// Neon Coast Cover Studio: the editor. A design is one plain object — format, layout, grade, the words, the
// heat, a crop per panel and the pop-out hero — and every control, drag and export reads or writes that
// object, then repaints through cover.js. Photos are loaded from the person's own machine (or the bundled
// samples) and never leave it. Undo history is snapshots of the design object alone.

import { FORMATS, LAYOUTS, clearPanelCache, layoutById, renderCover } from './cover.js';
import { GRADES, gradeById } from './grades.js';
import { buildCutout, sampleImagePixel } from './cutout.js';
import { parseShotScene } from './shots.js';

const SAMPLES = [
  { name: 'boulevard', label: 'Boulevard' },
  { name: 'pier', label: 'Pier' },
  { name: 'neon', label: 'Neon Street' },
  { name: 'rooftop', label: 'Rooftop' },
];

const stage = document.getElementById('stage');
const stageCtx = stage.getContext('2d');
const status = document.getElementById('status');
const photos = [];
let photoSeq = 0;

let state = freshState();
let selectedPanel = 0;
let heroSelected = false;
let activePhoto = 0;
let lastRender = { panelRects: [], heroRect: null };
let cutoutCache = { key: '', canvas: null };
let heroPreviewRect = null;

function freshState() {
  return {
    format: 'landscape',
    layout: 'heat',
    grade: 'vice',
    headline: 'NEON COAST',
    subtitle: 'Sunset Heist',
    callout: 'ONE CITY. NO BRAKES.',
    heat: 5,
    badge: 'WANTED',
    tagA: 'DRIVER',
    tagB: 'WHEELMAN',
    panels: Array.from({ length: 8 }, (_, i) => ({ photo: i % SAMPLES.length, dx: 0, dy: 0, scale: 1 })),
    hero: { photo: 1, mode: 'chroma', key: [110, 165, 225], tolerance: 84, feather: 36, scale: 112, dx: 0, dy: 0 },
    finish: { grain: 100, vignette: 100 },
  };
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadStudioFonts() {
  try {
    const anton = new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')");
    const pacifico = new FontFace('Pacifico', "url('./fonts/Pacifico-Regular.ttf')");
    const loaded = await Promise.all([anton.load(), pacifico.load()]);
    for (const face of loaded) document.fonts.add(face);
  } catch {
    // The studio still works on system fonts when the vendored ones cannot load.
  }
}

function currentCutout() {
  const hero = state.hero;
  const photo = photos[hero.photo];
  if (!photo || hero.mode === 'off') return null;
  const key = [photo.id, hero.mode, hero.key.join(','), hero.tolerance, hero.feather].join('|');
  if (cutoutCache.key !== key) {
    cutoutCache = { key, canvas: buildCutout(photo.img, hero) };
  }
  return cutoutCache.canvas;
}

function redraw() {
  const format = FORMATS[state.format];
  if (stage.width !== format.w || stage.height !== format.h) {
    stage.width = format.w;
    stage.height = format.h;
  }
  lastRender = renderCover(stageCtx, state, photos, currentCutout());
  drawSelection();
  drawHeroPreview();
}

function drawSelection() {
  const format = FORMATS[state.format];
  stageCtx.save();
  if (heroSelected && lastRender.heroRect) {
    const r = lastRender.heroRect;
    stageCtx.strokeStyle = '#ff2d95';
    stageCtx.lineWidth = Math.max(3, format.w * 0.0022);
    stageCtx.setLineDash([16, 10]);
    stageCtx.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    stageCtx.setLineDash([]);
    drawSelectionLabel(r.x - 6, r.y - 6, 'POP-OUT HERO', '#ff2d95');
  } else if (selectedPanel >= 0 && lastRender.panelRects[selectedPanel]) {
    const r = lastRender.panelRects[selectedPanel];
    stageCtx.strokeStyle = '#00e5ff';
    stageCtx.lineWidth = Math.max(3, format.w * 0.0022);
    stageCtx.setLineDash([16, 10]);
    stageCtx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
    stageCtx.setLineDash([]);
    drawSelectionLabel(r.x + 10, r.y + 10, `PANEL ${selectedPanel + 1}`, '#00e5ff');
  }
  stageCtx.restore();
}

function drawSelectionLabel(x, y, text, colour) {
  const format = FORMATS[state.format];
  const size = Math.max(13, format.w * 0.011);
  stageCtx.save();
  stageCtx.font = `${size}px Anton, sans-serif`;
  const w = stageCtx.measureText(text).width + size;
  stageCtx.fillStyle = 'rgba(5, 3, 12, 0.85)';
  stageCtx.fillRect(x, y, w, size * 1.7);
  stageCtx.fillStyle = colour;
  stageCtx.textAlign = 'left';
  stageCtx.textBaseline = 'middle';
  stageCtx.fillText(text, x + size * 0.5, y + size * 0.87);
  stageCtx.restore();
}

function drawHeroPreview() {
  const preview = document.getElementById('hero-preview');
  const ctx = preview.getContext('2d');
  ctx.clearRect(0, 0, preview.width, preview.height);
  const cutout = currentCutout();
  const photo = photos[state.hero.photo];
  const source = cutout ?? (photo ? photo.img : null);
  if (!source) {
    heroPreviewRect = null;
    return;
  }
  const sw = source.naturalWidth ?? source.width;
  const sh = source.naturalHeight ?? source.height;
  const scale = Math.min(preview.width / sw, preview.height / sh);
  const w = sw * scale;
  const h = sh * scale;
  const x = (preview.width - w) / 2;
  const y = (preview.height - h) / 2;
  heroPreviewRect = { x, y, w, h };
  ctx.drawImage(source, x, y, w, h);
}

// ---------- history ----------

const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify(state);
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncHistoryButtons();
}

function restore(json) {
  state = JSON.parse(json);
  clearPanelCache();
  cutoutCache = { key: '', canvas: null };
  syncControls();
  redraw();
}

function syncHistoryButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

document.getElementById('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncHistoryButtons();
});
document.getElementById('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncHistoryButtons();
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    document.getElementById(e.shiftKey ? 'redo' : 'undo').click();
  }
});

// ---------- controls ----------

function syncControls() {
  document.querySelectorAll('[data-format]').forEach((b) => b.classList.toggle('on', b.dataset.format === state.format));
  document.querySelectorAll('#layout-grid button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#grade-grid button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.getElementById('headline').value = state.headline;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('callout').value = state.callout;
  document.getElementById('badge').value = state.badge;
  document.getElementById('tag-a').value = state.tagA;
  document.getElementById('tag-b').value = state.tagB;
  document.querySelectorAll('#heat-stars button').forEach((b) => b.classList.toggle('lit', Number(b.dataset.heat) <= state.heat));
  const heroPhoto = document.getElementById('hero-photo');
  heroPhoto.innerHTML = photos.map((p, i) => `<option value="${i}">${p.label}</option>`).join('');
  heroPhoto.value = String(Math.min(state.hero.photo, photos.length - 1));
  document.getElementById('hero-mode').value = state.hero.mode;
  document.getElementById('hero-tol').value = String(state.hero.tolerance);
  document.getElementById('hero-feather').value = String(state.hero.feather);
  document.getElementById('hero-scale').value = String(state.hero.scale);
  state.finish ??= { grain: 100, vignette: 100 };
  document.getElementById('finish-grain').value = String(state.finish.grain);
  document.getElementById('finish-vignette').value = String(state.finish.vignette);
  document.getElementById('selected-label').textContent = heroSelected ? 'the pop-out hero' : `panel ${selectedPanel + 1}`;
  document.querySelectorAll('#tray button').forEach((b, i) => b.classList.toggle('on', i === activePhoto));
}

function buildLayoutButtons() {
  const grid = document.getElementById('layout-grid');
  grid.innerHTML = '';
  for (const layout of LAYOUTS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.layout = layout.id;
    const mini = document.createElement('canvas');
    mini.width = 264;
    mini.height = 88;
    drawLayoutMini(mini, layout);
    const label = document.createElement('span');
    label.textContent = layout.name;
    button.append(mini, label);
    button.title = layout.blurb;
    button.addEventListener('click', () => {
      pushHistory();
      state.layout = layout.id;
      selectedPanel = 0;
      heroSelected = false;
      syncControls();
      redraw();
    });
    grid.appendChild(button);
  }
}

function drawLayoutMini(canvas, layout) {
  const ctx = canvas.getContext('2d');
  const spec = layout.formats[state.format];
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(0, 0, W, H);
  spec.panels.forEach((p, i) => {
    const grad = ctx.createLinearGradient(p.x * W, p.y * H, (p.x + p.w) * W, (p.y + p.h) * H);
    grad.addColorStop(0, i % 2 ? '#d94f70' : '#f28c4b');
    grad.addColorStop(1, i % 2 ? '#3d1a5c' : '#8e2a63');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x * W + 1.5, p.y * H + 1.5, p.w * W - 3, p.h * H - 3);
  });
  if (spec.callout) {
    ctx.fillStyle = '#ff2d95';
    ctx.fillRect(spec.callout.x * W + 1.5, spec.callout.y * H + 1.5, spec.callout.w * W - 3, spec.callout.h * H - 3);
  }
  if (spec.title) {
    ctx.fillStyle = '#ffc75f';
    ctx.fillRect(spec.title.x * W + 1.5, spec.title.y * H + 1.5, spec.title.w * W - 3, spec.title.h * H - 3);
  }
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(spec.hero.cx * W, spec.hero.cy * H, 7, 0, Math.PI * 2);
  ctx.fill();
}

function buildGradeButtons() {
  const grid = document.getElementById('grade-grid');
  grid.innerHTML = '';
  for (const grade of GRADES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.grade = grade.id;
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = `linear-gradient(90deg, ${grade.stops.map(([at, hex]) => `${hex} ${Math.round(at * 100)}%`).join(', ')})`;
    const label = document.createElement('span');
    label.textContent = grade.name;
    button.append(swatch, label);
    button.addEventListener('click', () => {
      pushHistory();
      state.grade = grade.id;
      syncControls();
      redraw();
    });
    grid.appendChild(button);
  }
}

function buildTray() {
  const tray = document.getElementById('tray');
  tray.innerHTML = '';
  photos.forEach((photo, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    const img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.label;
    const name = document.createElement('span');
    name.className = 'tray-name';
    name.textContent = photo.label;
    button.append(img, name);
    button.addEventListener('click', () => {
      activePhoto = i;
      if (!heroSelected && selectedPanel >= 0) {
        pushHistory();
        state.panels[selectedPanel].photo = i;
      }
      syncControls();
      redraw();
    });
    button.addEventListener('dblclick', () => {
      pushHistory();
      state.panels.forEach((p) => { p.photo = i; });
      redraw();
    });
    tray.appendChild(button);
  });
}

document.querySelectorAll('[data-format]').forEach((button) => {
  button.addEventListener('click', () => {
    pushHistory();
    state.format = button.dataset.format;
    buildLayoutButtons();
    syncControls();
    redraw();
  });
});

function bindText(id, apply) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => { apply(input.value); redraw(); });
  input.addEventListener('change', () => pushHistory());
}
bindText('headline', (v) => { state.headline = v; });
bindText('subtitle', (v) => { state.subtitle = v; });
bindText('callout', (v) => { state.callout = v; });
bindText('badge', (v) => { state.badge = v; });
bindText('tag-a', (v) => { state.tagA = v; });
bindText('tag-b', (v) => { state.tagB = v; });

document.querySelectorAll('#heat-stars button').forEach((button) => {
  button.addEventListener('click', () => {
    pushHistory();
    state.heat = Number(button.dataset.heat);
    syncControls();
    redraw();
  });
});

document.getElementById('fill-all').addEventListener('click', () => {
  pushHistory();
  state.panels.forEach((p) => { p.photo = activePhoto; });
  redraw();
});
document.getElementById('cycle-photos').addEventListener('click', () => {
  pushHistory();
  state.panels.forEach((p, i) => { p.photo = i % photos.length; });
  redraw();
});

document.getElementById('photo-files').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    photos.push({ id: `user:${photoSeq++}`, img, label: file.name.replace(/\.[^.]+$/, '').slice(0, 18), thumb: url });
  }
  if (files.length) {
    activePhoto = photos.length - files.length;
    buildTray();
    syncControls();
    status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} added — click a panel, then a photo, to place it.`;
    redraw();
  }
});

// ---------- hero controls ----------

document.getElementById('hero-photo').addEventListener('change', (e) => {
  pushHistory();
  state.hero.photo = Number(e.target.value);
  keyHeroFromSky();
  redraw();
});
document.getElementById('hero-mode').addEventListener('change', (e) => {
  pushHistory();
  state.hero.mode = e.target.value;
  redraw();
});
for (const [id, field] of [['hero-tol', 'tolerance'], ['hero-feather', 'feather'], ['hero-scale', 'scale']]) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => { state.hero[field] = Number(input.value); redraw(); });
  input.addEventListener('change', () => pushHistory());
}
for (const [id, field] of [['finish-grain', 'grain'], ['finish-vignette', 'vignette']]) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => { state.finish[field] = Number(input.value); redraw(); });
  input.addEventListener('change', () => pushHistory());
}
document.getElementById('hero-key-sky').addEventListener('click', () => {
  pushHistory();
  keyHeroFromSky();
  redraw();
});
document.getElementById('hero-center').addEventListener('click', () => {
  pushHistory();
  state.hero.dx = 0;
  state.hero.dy = 0;
  redraw();
});

function keyHeroFromSky() {
  const photo = photos[state.hero.photo];
  if (photo) state.hero.key = sampleImagePixel(photo.img, 0.93, 0.05);
}

document.getElementById('hero-preview').addEventListener('click', (e) => {
  const photo = photos[state.hero.photo];
  if (!photo || !heroPreviewRect) return;
  const box = e.target.getBoundingClientRect();
  const px = ((e.clientX - box.left) / box.width) * e.target.width;
  const py = ((e.clientY - box.top) / box.height) * e.target.height;
  const fx = (px - heroPreviewRect.x) / heroPreviewRect.w;
  const fy = (py - heroPreviewRect.y) / heroPreviewRect.h;
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
  pushHistory();
  state.hero.key = sampleImagePixel(photo.img, fx, fy);
  if (state.hero.mode === 'off') state.hero.mode = 'chroma';
  syncControls();
  redraw();
});

// ---------- stage pointer work ----------

function stagePoint(e) {
  const box = stage.getBoundingClientRect();
  return [
    ((e.clientX - box.left) / box.width) * stage.width,
    ((e.clientY - box.top) / box.height) * stage.height,
  ];
}

let drag = null;

stage.addEventListener('pointerdown', (e) => {
  const [x, y] = stagePoint(e);
  const heroRect = lastRender.heroRect;
  if (heroRect && x >= heroRect.x && x <= heroRect.x + heroRect.w && y >= heroRect.y && y <= heroRect.y + heroRect.h) {
    heroSelected = true;
    drag = { kind: 'hero', startX: x, startY: y, dx: state.hero.dx, dy: state.hero.dy };
  } else {
    const rects = lastRender.panelRects;
    let hit = -1;
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { hit = i; break; }
    }
    if (hit < 0) return;
    heroSelected = false;
    selectedPanel = hit;
    const panel = state.panels[hit];
    drag = { kind: 'panel', startX: x, startY: y, dx: panel.dx, dy: panel.dy, rect: rects[hit] };
  }
  stage.setPointerCapture(e.pointerId);
  syncControls();
  redraw();
});

stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const [x, y] = stagePoint(e);
  const format = FORMATS[state.format];
  if (drag.kind === 'hero') {
    state.hero.dx = Math.max(-0.32, Math.min(0.32, drag.dx + (x - drag.startX) / format.w));
    state.hero.dy = Math.max(-0.32, Math.min(0.32, drag.dy + (y - drag.startY) / format.h));
  } else {
    const panel = state.panels[selectedPanel];
    panel.dx = Math.max(-1, Math.min(1, drag.dx + ((x - drag.startX) / drag.rect.w) * 1.5));
    panel.dy = Math.max(-1, Math.min(1, drag.dy + ((y - drag.startY) / drag.rect.h) * 1.5));
  }
  redraw();
});

stage.addEventListener('pointerup', () => {
  if (drag) pushHistory();
  drag = null;
});

let wheelTimer = null;
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const step = e.deltaY < 0 ? 1.07 : 1 / 1.07;
  if (heroSelected) {
    state.hero.scale = Math.max(60, Math.min(170, state.hero.scale * step));
    document.getElementById('hero-scale').value = String(Math.round(state.hero.scale));
  } else if (selectedPanel >= 0) {
    const panel = state.panels[selectedPanel];
    panel.scale = Math.max(1, Math.min(3.2, panel.scale * step));
  }
  redraw();
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(pushHistory, 450);
}, { passive: false });

// ---------- export ----------

function renderDesign(formatId) {
  const format = FORMATS[formatId];
  const canvas = document.createElement('canvas');
  canvas.width = format.w;
  canvas.height = format.h;
  const design = { ...state, format: formatId };
  renderCover(canvas.getContext('2d'), design, photos, currentCutout());
  return canvas;
}

function downloadCanvas(canvas, name) {
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

document.getElementById('export-one').addEventListener('click', () => {
  const format = FORMATS[state.format];
  downloadCanvas(renderDesign(state.format), `neon-coast-${state.format}-${format.w}x${format.h}.png`);
  status.textContent = `Saved the ${format.name.toLowerCase()} cover, ${format.w} × ${format.h}.`;
});

document.getElementById('export-all').addEventListener('click', () => {
  for (const formatId of ['square', 'portrait', 'landscape']) {
    const format = FORMATS[formatId];
    downloadCanvas(renderDesign(formatId), `neon-coast-${formatId}-${format.w}x${format.h}.png`);
  }
  status.textContent = 'Saved all three sizes: square, portrait and wide.';
});

// ---------- boot and screenshot scenes ----------

async function boot() {
  await loadStudioFonts();
  for (const sample of SAMPLES) {
    const img = await loadImage(`samples/${sample.name}.jpg`);
    photos.push({ id: `sample:${sample.name}`, img, label: sample.label, thumb: `samples/${sample.name}.jpg` });
  }
  keyHeroFromSky();

  const params = new URLSearchParams(location.search);
  const scene = parseShotScene(params);
  if (scene) applyScene(scene);

  buildLayoutButtons();
  buildGradeButtons();
  buildTray();
  syncControls();
  syncHistoryButtons();
  redraw();

  if (scene) {
    document.body.classList.add(scene.shot === 'cover' ? 'shot-cover' : 'shot-editor');
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  }
}

function applyScene(scene) {
  if (scene.format) state.format = scene.format;
  if (scene.layout) state.layout = scene.layout;
  if (scene.grade) state.grade = scene.grade;
  if (scene.headline !== undefined) state.headline = scene.headline;
  if (scene.subtitle !== undefined) state.subtitle = scene.subtitle;
  if (scene.callout !== undefined) state.callout = scene.callout;
  if (scene.badge !== undefined) state.badge = scene.badge;
  if (scene.tagA !== undefined) state.tagA = scene.tagA;
  if (scene.tagB !== undefined) state.tagB = scene.tagB;
  if (scene.heat !== undefined) state.heat = scene.heat;
  if (scene.panelNames) {
    scene.panelNames.forEach((name, i) => {
      const index = SAMPLES.findIndex((s) => s.name === name);
      if (index >= 0 && state.panels[i]) state.panels[i].photo = index;
    });
  }
  if (scene.heroName) {
    const index = SAMPLES.findIndex((s) => s.name === scene.heroName);
    if (index >= 0) state.hero.photo = index;
  }
  if (scene.heroMode) state.hero.mode = scene.heroMode;
  if (scene.heroTolerance !== undefined) state.hero.tolerance = scene.heroTolerance;
  if (scene.heroFeather !== undefined) state.hero.feather = scene.heroFeather;
  if (scene.heroScale !== undefined) state.hero.scale = scene.heroScale;
  if (scene.heroKeyAt) {
    const photo = photos[state.hero.photo];
    if (photo) state.hero.key = sampleImagePixel(photo.img, scene.heroKeyAt[0], scene.heroKeyAt[1]);
  } else if (scene.heroName) {
    keyHeroFromSky();
  }
  if (scene.panelCrops) {
    scene.panelCrops.forEach((crop, i) => {
      if (crop && state.panels[i]) Object.assign(state.panels[i], crop);
    });
  }
  if (scene.selected !== undefined) selectedPanel = scene.selected;
  if (scene.shot === 'cover') {
    selectedPanel = -1;
    heroSelected = false;
  }
  if (scene.flash) {
    const card = document.getElementById(`card-${scene.flash}`);
    if (card) card.classList.add('flash');
  }
  clearPanelCache();
}

boot();
