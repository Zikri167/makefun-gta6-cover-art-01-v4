// The lettering layer: a striped retro-chrome headline, a neon script subtitle, and the furniture that makes
// a panel grid read as cover art — a halftone title block, a star heat meter, a diagonal badge ribbon, role
// tags and a gradient callout panel. All of it is drawn with the two vendored OFL fonts, Anton for the chrome
// and Pacifico for the script, and all of it is original to this studio.

const CHROME_STOPS = [
  [0.0, '#ffffff'], [0.18, '#f4f7fa'], [0.34, '#c9d2dc'], [0.44, '#8b96a3'],
  [0.5, '#2c3138'], [0.56, '#8b96a3'], [0.68, '#d7dee6'], [0.86, '#f7fafc'], [1.0, '#ffffff'],
];

/** Shrinks an Anton size until `text` fits `maxWidth`; returns the size. */
export function fitAntonSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Tints a cut-out or lettering canvas one flat colour, keeping its alpha. */
export function tintedCopy(source, colour) {
  const out = makeCanvas(source.width, source.height);
  const ctx = out.getContext('2d');
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, out.width, out.height);
  return out;
}

/**
 * Renders the headline as striped retro chrome on its own canvas: a vertical chrome gradient clipped to the
 * letter shapes, fine pinstripes raked across at -15 degrees, and a specular highlight along the top edge.
 */
export function chromeTitleCanvas(text, maxWidth, startSize) {
  const probe = makeCanvas(8, 8).getContext('2d');
  const size = fitAntonSize(probe, text, maxWidth, startSize);
  probe.font = `${size}px Anton, sans-serif`;
  const textW = Math.ceil(probe.measureText(text).width);
  const pad = Math.ceil(size * 0.22);
  const canvas = makeCanvas(textW + pad * 2, size * 1.34);
  const ctx = canvas.getContext('2d');
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + size * 0.03);

  ctx.globalCompositeOperation = 'source-in';
  const chrome = ctx.createLinearGradient(0, canvas.height / 2 - size * 0.52, 0, canvas.height / 2 + size * 0.52);
  for (const [at, colour] of CHROME_STOPS) chrome.addColorStop(at, colour);
  ctx.fillStyle = chrome;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // The pinstripes are painted on their own canvas first: repeated 'source-in' fills would each keep
  // only their intersection with what is already drawn, and disjoint stripes would erase one another.
  // One 'source-atop' pass blends the whole stripe sheet over the letters, inside the letter alpha only.
  const stripes = makeCanvas(canvas.width, canvas.height);
  const sctx = stripes.getContext('2d');
  sctx.translate(canvas.width / 2, canvas.height / 2);
  sctx.rotate((-15 * Math.PI) / 180);
  sctx.fillStyle = 'rgba(16, 18, 24, 0.38)';
  const stripeGap = Math.max(3, size / 11);
  for (let y = -canvas.height; y < canvas.height; y += stripeGap * 2) {
    sctx.fillRect(-canvas.width, y, canvas.width * 2, stripeGap * 0.62);
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(stripes, 0, 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height * 0.46);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.46);
  sheen.addColorStop(0, 'rgba(255,255,255,0.75)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.46);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';

  return { canvas, size };
}

/** Draws the chrome headline centred at (cx, cy): cyan neon bleed behind, a black keyline, then the chrome. */
export function drawChromeTitle(ctx, text, cx, cy, maxWidth, startSize) {
  const clean = (text ?? '').trim().toUpperCase();
  if (!clean) return 0;
  const { canvas, size } = chromeTitleCanvas(clean, maxWidth, startSize);
  const x = cx - canvas.width / 2;
  const y = cy - canvas.height / 2;
  const glow = tintedCopy(canvas, '#00e5ff');
  ctx.save();
  ctx.shadowColor = 'rgba(0, 229, 255, 0.9)';
  ctx.shadowBlur = size * 0.42;
  const gx = cx - (canvas.width * 1.07) / 2;
  const gy = cy - (canvas.height * 1.07) / 2;
  ctx.drawImage(glow, gx, gy, canvas.width * 1.07, canvas.height * 1.07);
  ctx.drawImage(glow, gx, gy, canvas.width * 1.07, canvas.height * 1.07);
  ctx.restore();
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#06060a';
  ctx.lineWidth = Math.max(2, size * 0.11);
  ctx.strokeText(clean, cx, cy + size * 0.03);
  ctx.restore();
  ctx.drawImage(canvas, x, y);
  return size;
}

/** Draws the neon script subtitle: three glow passes in the neon colour, then a near-white core. */
export function drawNeonScript(ctx, text, cx, cy, size, colour = '#ff2d95', maxWidth = Infinity) {
  const clean = (text ?? '').trim();
  if (!clean) return;
  ctx.save();
  ctx.font = `${size}px Pacifico, cursive`;
  while (ctx.measureText(clean).width > maxWidth && size > 9) {
    size -= 2;
    ctx.font = `${size}px Pacifico, cursive`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const blur of [size * 0.55, size * 0.26, size * 0.1]) {
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.fillStyle = colour;
    ctx.fillText(clean, cx, cy);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 250, 253, 0.96)';
  ctx.fillText(clean, cx, cy);
  ctx.restore();
}

/** A five-point star path centred at (cx, cy). */
export function starPath(ctx, cx, cy, radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.46;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** The heat meter: `level` gold stars lit out of five, with the words HEAT LEVEL beside them. */
export function drawHeatMeter(ctx, cx, cy, starRadius, level) {
  const lit = Math.max(0, Math.min(5, Math.round(level)));
  const gap = starRadius * 2.35;
  const totalW = gap * 4 + starRadius * 2;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = cx - totalW / 2 + starRadius + i * gap;
    starPath(ctx, x, cy, starRadius);
    if (i < lit) {
      ctx.save();
      ctx.shadowColor = 'rgba(255, 199, 95, 0.9)';
      ctx.shadowBlur = starRadius * 0.7;
      ctx.fillStyle = '#ffc75f';
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(6, 4, 12, 0.85)';
    ctx.lineWidth = Math.max(1, starRadius * 0.12);
    ctx.stroke();
  }
  ctx.font = `${Math.max(9, starRadius * 0.78)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 232, 190, 0.92)';
  ctx.fillText(`H E A T   L E V E L   ${lit}`, cx, cy + starRadius * 1.25);
  ctx.restore();
  return totalW;
}

/**
 * The title block: dark halftone paper, a sunset sweep along its foot, the chrome headline, the neon
 * subtitle and the heat meter, stacked the way a poster reserves its masthead.
 */
export function drawTitleBlock(ctx, rect, words, halftonePattern, lowText = false) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const base = ctx.createLinearGradient(x, y, x, y + h);
  base.addColorStop(0, '#180d2b');
  base.addColorStop(0.62, '#120a20');
  base.addColorStop(1, '#1d0b26');
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  if (halftonePattern) {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = halftonePattern;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  const sweep = ctx.createLinearGradient(x, y + h * 0.8, x + w, y + h);
  sweep.addColorStop(0, 'rgba(242, 140, 75, 0)');
  sweep.addColorStop(0.5, 'rgba(217, 79, 112, 0.4)');
  sweep.addColorStop(1, 'rgba(255, 45, 149, 0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(x, y + h * 0.8, w, h * 0.2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  const hasSub = (words.subtitle ?? '').trim().length > 0;
  const titleStart = Math.min(h * 0.42, w * 0.36);
  const titleY = lowText ? 0.5 : hasSub ? 0.34 : 0.42;
  const titleSize = drawChromeTitle(ctx, words.headline, x + w / 2, y + h * titleY, w * 0.9, titleStart);
  if (hasSub) {
    const subSize = Math.max(13, Math.min(h * 0.17, w * 0.15));
    drawNeonScript(ctx, words.subtitle, x + w / 2, y + h * (lowText ? 0.74 : 0.66), subSize, '#ff2d95', w * 0.92);
  }
  const starR = Math.max(7, Math.min(h * 0.045, w * 0.05));
  drawHeatMeter(ctx, x + w / 2, y + h * (lowText ? 0.9 : 0.87), starR, words.heat);
  ctx.restore();
  return titleSize;
}

/** A diagonal badge ribbon across a panel corner, with folded ends and white Anton lettering. */
export function drawBadgeRibbon(ctx, rect, corner, text) {
  const clean = (text ?? '').trim().toUpperCase();
  if (!clean) return;
  const bandH = Math.max(22, rect.h * 0.13);
  const bandL = rect.w * 1.06;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const cx = corner.endsWith('l') ? rect.x : rect.x + rect.w;
  const cy = corner.startsWith('t') ? rect.y : rect.y + rect.h;
  ctx.translate(cx, cy);
  ctx.rotate(corner === 'tl' || corner === 'br' ? -Math.PI / 4 : Math.PI / 4);
  ctx.translate(0, (corner.startsWith('t') ? 1 : -1) * bandH * 0.95);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = bandH * 0.4;
  ctx.shadowOffsetY = bandH * 0.18;
  const ribbon = ctx.createLinearGradient(0, -bandH / 2, 0, bandH / 2);
  ribbon.addColorStop(0, '#f0443a');
  ribbon.addColorStop(0.5, '#d92b25');
  ribbon.addColorStop(1, '#a11610');
  ctx.fillStyle = ribbon;
  ctx.fillRect(-bandL / 2, -bandH / 2, bandL, bandH);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.moveTo(-bandL / 2, bandH / 2);
  ctx.lineTo(-bandL / 2 + bandH * 0.7, 0);
  ctx.lineTo(-bandL / 2, -bandH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bandL / 2, bandH / 2);
  ctx.lineTo(bandL / 2 - bandH * 0.7, 0);
  ctx.lineTo(bandL / 2, -bandH / 2);
  ctx.closePath();
  ctx.fill();
  const size = fitAntonSize(ctx, clean, bandH * 1.7, bandH * 0.58);
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(clean, 0, size * 0.04);
  ctx.restore();
}

const tagProbe = document.createElement('canvas').getContext('2d');

/** The pixel width a role tag chip will occupy, so callers can right-align it inside a panel. */
export function roleTagWidth(text, scale = 1) {
  const clean = (text ?? '').trim().toUpperCase();
  if (!clean) return 0;
  tagProbe.font = `${15 * scale}px Anton, sans-serif`;
  return tagProbe.measureText(clean.split('').join('  ')).width + 20 * scale;
}

/** A role tag: a dark chip with a gold spine and letterspaced white capitals, pinned inside a panel. */
export function drawRoleTag(ctx, x, y, text, scale = 1) {
  const clean = (text ?? '').trim().toUpperCase();
  if (!clean) return;
  ctx.save();
  const size = 15 * scale;
  ctx.font = `${size}px Anton, sans-serif`;
  const spaced = clean.split('').join('  ');
  const w = ctx.measureText(spaced).width + 20 * scale;
  const h = 26 * scale;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 3 * scale;
  ctx.fillStyle = 'rgba(13, 10, 24, 0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5 * scale);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffc75f';
  ctx.fillRect(x, y, 4 * scale, h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(spaced, x + 11 * scale, y + h / 2 + size * 0.05);
  ctx.restore();
}

/** The callout panel: a sunset gradient card carrying one big line of Anton type and a gold pointer. */
export function drawCalloutPanel(ctx, rect, text, halftonePattern) {
  const clean = (text ?? '').trim().toUpperCase();
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#2a1052');
  grad.addColorStop(0.45, '#8e2a63');
  grad.addColorStop(0.75, '#d94f70');
  grad.addColorStop(1, '#f28c4b');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (halftonePattern) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = halftonePattern;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ffc75f';
  ctx.beginPath();
  const ax = rect.x + rect.w / 2;
  ctx.moveTo(ax - rect.h * 0.07, rect.y + rect.h * 0.1);
  ctx.lineTo(ax + rect.h * 0.07, rect.y + rect.h * 0.1);
  ctx.lineTo(ax, rect.y + rect.h * 0.02);
  ctx.closePath();
  ctx.fill();
  if (clean) {
    const words = clean.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > 14 && line) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, 3);
    const size = Math.min(rect.h * 0.3, fitAntonSize(ctx, shown.reduce((a, b) => (a.length > b.length ? a : b), ''), rect.w * 0.88, rect.h * 0.3));
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(20, 4, 30, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = '#ffffff';
    const lineH = size * 1.12;
    const top = rect.y + rect.h / 2 - ((shown.length - 1) * lineH) / 2 + rect.h * 0.03;
    shown.forEach((l, i) => ctx.fillText(l, ax, top + i * lineH));
  }
  ctx.restore();
}
