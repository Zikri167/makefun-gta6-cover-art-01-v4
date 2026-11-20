// Colour grades for the cover panels. Each grade is a gradient map: a photo's luminance is pushed through a
// strip of colour stops, then the result is blended back with the photo so faces and details survive, and a
// split tone, vignette weight, grain weight and halftone weight ride along. The lookup table for a grade is
// built once and cached; applying it to a panel is a single pass over that panel's pixels.

/** One grade: gradient-map stops plus the strength of every finish that travels with it. */
export const GRADES = [
  {
    id: 'vice', name: 'Vice Sunset',
    stops: [[0, '#1a0a2e'], [0.15, '#3d1a5c'], [0.35, '#d94f70'], [0.5, '#f28c4b'], [0.65, '#ffc75f'], [0.85, '#ffeb3b'], [1, '#fff8e7']],
    mapAmount: 0.42, saturation: 1.12, contrast: 1.05, shadowTint: '#1a0a2e', shadowAmount: 0.4, highlightTint: '#ffc75f', highlightAmount: 0.2,
    vignette: 0.5, grain: 0.05, halftone: 0.16,
  },
  {
    id: 'neon', name: 'Neon Night',
    stops: [[0, '#050510'], [0.1, '#0d0d2b'], [0.3, '#1b003b'], [0.5, '#00f3ff'], [0.6, '#bc13fe'], [0.75, '#ff2d95'], [0.9, '#ffd700'], [1, '#ffffff']],
    mapAmount: 0.34, saturation: 1.22, contrast: 1.1, shadowTint: '#0d0d2b', shadowAmount: 0.5, highlightTint: '#00f3ff', highlightAmount: 0.15,
    vignette: 0.62, grain: 0.07, halftone: 0.12,
  },
  {
    id: 'golden', name: 'Golden Hour',
    stops: [[0, '#241108'], [0.25, '#6e3410'], [0.5, '#c97b2d'], [0.72, '#f2b04b'], [0.9, '#ffd98a'], [1, '#fff3d6']],
    mapAmount: 0.38, saturation: 1.08, contrast: 1.02, shadowTint: '#2b1408', shadowAmount: 0.35, highlightTint: '#ffcf7d', highlightAmount: 0.22,
    vignette: 0.42, grain: 0.04, halftone: 0.1,
  },
  {
    id: 'dusk', name: 'Dusk Purple',
    stops: [[0, '#12041f'], [0.22, '#33124f'], [0.45, '#6d2a7a'], [0.62, '#b83a7d'], [0.8, '#e56a9a'], [1, '#ffe3ee']],
    mapAmount: 0.4, saturation: 1.05, contrast: 1.04, shadowTint: '#1c0630', shadowAmount: 0.45, highlightTint: '#ff9ec4', highlightAmount: 0.16,
    vignette: 0.55, grain: 0.05, halftone: 0.14,
  },
  {
    id: 'storm', name: 'Rain Storm',
    stops: [[0, '#0a1214'], [0.3, '#22383c'], [0.55, '#4d6d72'], [0.78, '#93a8a4'], [1, '#e8f0ea']],
    mapAmount: 0.36, saturation: 0.72, contrast: 1.06, shadowTint: '#0c1a1c', shadowAmount: 0.4, highlightTint: '#b9cdc4', highlightAmount: 0.1,
    vignette: 0.6, grain: 0.08, halftone: 0.08,
  },
  {
    id: 'noir', name: 'Noir Ink',
    stops: [[0, '#000000'], [0.28, '#2e2e33'], [0.52, '#6d6d75'], [0.76, '#b9b9c2'], [1, '#ffffff']],
    mapAmount: 0.88, saturation: 0.05, contrast: 1.22, shadowTint: '#000000', shadowAmount: 0.3, highlightTint: '#ffffff', highlightAmount: 0.06,
    vignette: 0.66, grain: 0.09, halftone: 0.3,
  },
  {
    id: 'candy', name: 'Candy Pop',
    stops: [[0, '#1c0530'], [0.24, '#5b1e9e'], [0.48, '#e83e8c'], [0.66, '#ff7ac0'], [0.84, '#37e0e6'], [1, '#fdfdff']],
    mapAmount: 0.33, saturation: 1.38, contrast: 1.03, shadowTint: '#22063d', shadowAmount: 0.38, highlightTint: '#7df3ff', highlightAmount: 0.18,
    vignette: 0.4, grain: 0.04, halftone: 0.12,
  },
  {
    id: 'desert', name: 'Desert Heat',
    stops: [[0, '#1d0d04'], [0.26, '#59300f'], [0.5, '#a35a1d'], [0.72, '#dd8f3a'], [0.9, '#f7c877'], [1, '#ffefd2']],
    mapAmount: 0.4, saturation: 1.02, contrast: 1.05, shadowTint: '#241105', shadowAmount: 0.42, highlightTint: '#ffbe78', highlightAmount: 0.2,
    vignette: 0.48, grain: 0.06, halftone: 0.12,
  },
  {
    id: 'ocean', name: 'Ocean Breeze',
    stops: [[0, '#03141f'], [0.24, '#0a3550'], [0.48, '#14607e'], [0.68, '#2fa3a8'], [0.86, '#8fe0d4'], [1, '#f2fffb']],
    mapAmount: 0.38, saturation: 1.1, contrast: 1.03, shadowTint: '#04202f', shadowAmount: 0.42, highlightTint: '#9fe8dc', highlightAmount: 0.16,
    vignette: 0.46, grain: 0.04, halftone: 0.1,
  },
  {
    id: 'chrome', name: 'Midnight Chrome',
    stops: [[0, '#05070d'], [0.26, '#1c2739'], [0.5, '#46586e'], [0.7, '#8fa3b8'], [0.88, '#d7e4f2'], [1, '#ffffff']],
    mapAmount: 0.44, saturation: 0.82, contrast: 1.12, shadowTint: '#060a14', shadowAmount: 0.46, highlightTint: '#cfe6ff', highlightAmount: 0.14,
    vignette: 0.58, grain: 0.06, halftone: 0.18,
  },
];

/** Finds a grade by id, falling back to Vice Sunset. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const lutCache = new Map();

/** Builds (and caches) the 256-entry RGB lookup table for a grade's gradient map. */
export function gradientLut(grade) {
  if (lutCache.has(grade.id)) return lutCache.get(grade.id);
  const stops = grade.stops.map(([at, hex]) => [at, hexToRgb(hex)]);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = Math.max(0.0001, b[0] - a[0]);
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = a[1][c] + (b[1][c] - a[1][c]) * f;
  }
  lutCache.set(grade.id, lut);
  return lut;
}

/**
 * Grades one canvas in place: contrast and saturation first, then the gradient map blended by mapAmount,
 * then the split tone (shadows toward shadowTint, highlights toward highlightTint).
 */
export function applyGradeToCanvas(canvas, grade) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  if (!w || !h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const lut = gradientLut(grade);
  const [sr, sg, sb] = hexToRgb(grade.shadowTint);
  const [hr, hg, hb] = hexToRgb(grade.highlightTint);
  const map = grade.mapAmount;
  const keep = 1 - map;
  const sat = grade.saturation;
  const con = grade.contrast;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    r = (r - 128) * con + 128;
    g = (g - 128) * con + 128;
    b = (b - 128) * con + 128;
    const grey = 0.299 * r + 0.587 * g + 0.114 * b;
    r = grey + (r - grey) * sat;
    g = grey + (g - grey) * sat;
    b = grey + (b - grey) * sat;
    const li = Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
    const base = li * 3;
    r = r * keep + lut[base] * map;
    g = g * keep + lut[base + 1] * map;
    b = b * keep + lut[base + 2] * map;
    const t = li / 255;
    const shadowMix = (1 - t) * (1 - t) * grade.shadowAmount;
    const highlightMix = t * t * grade.highlightAmount;
    data[i] = r + (sr - r) * shadowMix + (hr - r) * highlightMix;
    data[i + 1] = g + (sg - g) * shadowMix + (hg - g) * highlightMix;
    data[i + 2] = b + (sb - b) * shadowMix + (hb - b) * highlightMix;
  }
  ctx.putImageData(img, 0, 0);
}

let grainCanvas = null;

/** A small tile of monochrome noise, generated once and reused as the film grain overlay. */
export function grainTile() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 180;
  grainCanvas.height = 180;
  const ctx = grainCanvas.getContext('2d');
  const img = ctx.createImageData(180, 180);
  let seed = 987654321;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 96 + (seed % 128);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return grainCanvas;
}

/** A halftone dot pattern tile at a given pitch, drawn in white so it can be tinted by globalAlpha. */
export function halftoneTile(pitch, radius) {
  const tile = document.createElement('canvas');
  tile.width = pitch;
  tile.height = pitch;
  const ctx = tile.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(pitch / 2, pitch / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.arc(pitch, 0, radius, 0, Math.PI * 2);
  ctx.arc(0, pitch, radius, 0, Math.PI * 2);
  ctx.arc(pitch, pitch, radius, 0, Math.PI * 2);
  ctx.fill();
  return tile;
}
