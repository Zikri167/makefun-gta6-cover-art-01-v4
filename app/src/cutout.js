// The pop-out hero: turning one photo into a cut-out that can spill across the panel grid, with no library
// and no network. Two ways in — a colour key that removes a picked backdrop colour with a feathered edge and
// a despill pass, and a one-click ink silhouette that thresholds the photo into high-contrast poster ink.
// The cut-out is then composited with a soft drop shadow and a white keyline, the way poster art is cut out.

import { tintedCopy } from './lettering.js';

const WORK_MAX = 760;

function workSize(img) {
  const scale = Math.min(1, WORK_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  return [Math.max(1, Math.round(img.naturalWidth * scale)), Math.max(1, Math.round(img.naturalHeight * scale))];
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Reads one pixel of an image at fractional coordinates, for picking a backdrop colour. */
export function sampleImagePixel(img, fx, fy) {
  const c = makeCanvas(1, 1);
  const ctx = c.getContext('2d');
  const sx = Math.min(img.naturalWidth - 1, Math.max(0, Math.round(fx * img.naturalWidth)));
  const sy = Math.min(img.naturalHeight - 1, Math.max(0, Math.round(fy * img.naturalHeight)));
  ctx.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

function colourDistance(r, g, b, key) {
  const dr = (r - key[0]) * 0.42;
  const dg = (g - key[1]) * 0.5;
  const db = (b - key[2]) * 0.36;
  return Math.sqrt(dr * dr + dg * dg + db * db) * 2.2;
}

/**
 * Colour-key cut-out: pixels near the key colour fade out across the feather band, and semi-transparent
 * edge pixels are despilled toward their non-key channels so no halo of backdrop colour survives.
 */
export function chromaCutout(img, key, tolerance, feather) {
  const [w, h] = workSize(img);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const lo = Math.max(0, tolerance - feather / 2);
  const hi = tolerance + feather / 2;
  const dominant = key.indexOf(Math.max(...key));
  for (let i = 0; i < data.length; i += 4) {
    const dist = colourDistance(data[i], data[i + 1], data[i + 2], key);
    let alpha = (dist - lo) / Math.max(1, hi - lo);
    alpha = Math.max(0, Math.min(1, alpha));
    alpha = alpha * alpha * (3 - 2 * alpha);
    if (alpha > 0 && alpha < 1) {
      const others = [data[i], data[i + 1], data[i + 2]].filter((_, c) => c !== dominant);
      const cap = Math.max(others[0], others[1]) + 12;
      if (data[i + dominant] > cap) data[i + dominant] = cap;
    }
    data[i + 3] = Math.round(data[i + 3] * alpha);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function otsuThreshold(lums) {
  const hist = new Array(256).fill(0);
  for (const v of lums) hist[v]++;
  const total = lums.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let weightB = 0;
  let best = -1;
  let threshold = 128;
  for (let i = 0; i < 256; i++) {
    weightB += hist[i];
    if (!weightB) continue;
    const weightF = total - weightB;
    if (!weightF) break;
    sumB += i * hist[i];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (between > best) { best = between; threshold = i; }
  }
  return threshold;
}

function morphClose(alpha, w, h) {
  const dilated = new Uint8ClampedArray(alpha);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) m = Math.max(m, alpha[ny * w + nx]);
        }
      }
      dilated[y * w + x] = m;
    }
  }
  const closed = new Uint8ClampedArray(alpha);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) m = Math.min(m, dilated[ny * w + nx]);
        }
      }
      closed[y * w + x] = m;
    }
  }
  return closed;
}

/**
 * Ink silhouette cut-out: the subject side of an Otsu threshold (whichever side the photo's border is not)
 * becomes the mask, closed and softened, and the photo is printed through it as steep-contrast ink.
 */
export function silhouetteCutout(img) {
  const [w, h] = workSize(img);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const lums = new Uint8ClampedArray(w * h);
  for (let p = 0, i = 0; p < lums.length; p++, i += 4) {
    lums[p] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const threshold = otsuThreshold(lums);
  let borderSum = 0;
  let borderCount = 0;
  for (let x = 0; x < w; x += 4) {
    borderSum += lums[x] + lums[(h - 1) * w + x];
    borderCount += 2;
  }
  for (let y = 0; y < h; y += 4) {
    borderSum += lums[y * w] + lums[y * w + w - 1];
    borderCount += 2;
  }
  const subjectIsDark = borderSum / borderCount > threshold;
  const alpha = new Uint8ClampedArray(w * h);
  for (let p = 0; p < lums.length; p++) {
    const inside = subjectIsDark ? lums[p] <= threshold : lums[p] >= threshold;
    const edge = Math.abs(lums[p] - threshold);
    alpha[p] = inside ? Math.min(255, 160 + edge * 4) : Math.max(0, 96 - edge * 4);
  }
  const closed = morphClose(alpha, w, h);
  for (let p = 0, i = 0; p < lums.length; p++, i += 4) {
    const ink = Math.max(0, Math.min(255, (lums[p] - 128) * 2.4 + 128));
    data[i] = ink;
    data[i + 1] = ink;
    data[i + 2] = Math.min(255, ink * 1.04 + 4);
    data[i + 3] = closed[p];
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Builds the cut-out for a hero setting: { mode, key, tolerance, feather } over an image. */
export function buildCutout(img, hero) {
  if (!img || hero.mode === 'off') return null;
  if (hero.mode === 'silhouette') return silhouetteCutout(img);
  return chromaCutout(img, hero.key, hero.tolerance, hero.feather);
}

/**
 * Draws the cut-out popping out of the grid: a blurred black silhouette as the drop shadow, a white
 * keyline grown around the alpha, then the cut-out itself. Returns the drawn rectangle.
 */
export function drawPopOutHero(ctx, cutout, cx, cy, drawWidth) {
  const drawHeight = (drawWidth * cutout.height) / cutout.width;
  const x = cx - drawWidth / 2;
  const y = cy - drawHeight / 2;
  const silhouette = tintedCopy(cutout, '#000000');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.filter = `blur(${Math.max(3, drawWidth * 0.018)}px)`;
  ctx.drawImage(silhouette, x + drawWidth * 0.028, y + drawHeight * 0.045, drawWidth, drawHeight);
  ctx.restore();
  const keyline = tintedCopy(cutout, '#ffffff');
  const grow = Math.max(2, drawWidth * 0.011);
  ctx.save();
  for (let a = 0; a < 8; a++) {
    const dx = Math.cos((a * Math.PI) / 4) * grow;
    const dy = Math.sin((a * Math.PI) / 4) * grow;
    ctx.drawImage(keyline, x + dx, y + dy, drawWidth, drawHeight);
  }
  ctx.restore();
  ctx.drawImage(cutout, x, y, drawWidth, drawHeight);
  return { x, y, w: drawWidth, h: drawHeight };
}
