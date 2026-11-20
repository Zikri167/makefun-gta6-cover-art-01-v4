// The cover itself: twelve layouts across the three post sizes, each a grid of graded photo panels with an
// inked keyline and halftone finish, a reserved title block, a callout card, a badge ribbon, role tags and a
// hero slot the pop-out cut-out spills from. renderCover paints a whole design onto a 2D context at the
// format's full export size; the editor and the exporter share it, so what you see is the PNG you get.

import { applyGradeToCanvas, gradeById, grainTile, halftoneTile } from './grades.js';
import { drawBadgeRibbon, drawCalloutPanel, drawRoleTag, drawTitleBlock, roleTagWidth } from './lettering.js';
import { drawPopOutHero } from './cutout.js';

/** The three post sizes the studio exports, at full resolution. */
export const FORMATS = {
  square: { id: 'square', name: 'Square', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait', w: 1080, h: 1350 },
  landscape: { id: 'landscape', name: 'Wide', w: 1920, h: 1080 },
};

const cell = (x, y, w, h, tilt = 0) => ({ x, y, w, h, tilt });

/** Layout families; each carries one panel geometry per format. Rects are fractions of the cover. */
export const LAYOUTS = [
  {
    id: 'heat', name: 'Panel Heat', blurb: 'Nine-panel poster grid, title in the middle',
    formats: {
      landscape: {
        panels: [cell(0, 0, 1 / 3, 1 / 3, -2), cell(1 / 3, 0, 1 / 3, 1 / 3), cell(2 / 3, 0, 1 / 3, 1 / 3, 2), cell(0, 1 / 3, 1 / 3, 1 / 3), cell(2 / 3, 1 / 3, 1 / 3, 1 / 3), cell(0, 2 / 3, 1 / 3, 1 / 3, 1.5), cell(2 / 3, 2 / 3, 1 / 3, 1 / 3, -1.5)],
        title: { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
        callout: { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
        hero: { cx: 0.5, cy: 0.29, w: 0.27 },
        titleLowText: true,
        badgePanel: 3, badgeCorner: 'tl',
        tags: [{ panel: 5, corner: 'bl' }, { panel: 6, corner: 'br' }],
      },
      portrait: {
        panels: [cell(0, 0, 1, 0.4), cell(0, 0.4, 0.5, 0.3, -1.5), cell(0.5, 0.4, 0.5, 0.3, 1.5), cell(0.69, 0.7, 0.31, 0.3)],
        title: { x: 0, y: 0.7, w: 0.38, h: 0.3 },
        callout: { x: 0.38, y: 0.7, w: 0.31, h: 0.3 },
        hero: { cx: 0.5, cy: 0.37, w: 0.52 },
        badgePanel: 0, badgeCorner: 'tr',
        tags: [{ panel: 2, corner: 'tl' }, { panel: 0, corner: 'bl' }],
      },
      square: {
        panels: [cell(0, 0, 1 / 3, 1 / 3, -2), cell(1 / 3, 0, 1 / 3, 1 / 3), cell(2 / 3, 0, 1 / 3, 1 / 3, 2), cell(0, 1 / 3, 1 / 3, 1 / 3), cell(2 / 3, 1 / 3, 1 / 3, 1 / 3), cell(0, 2 / 3, 1 / 3, 1 / 3, 1.5), cell(2 / 3, 2 / 3, 1 / 3, 1 / 3, -1.5)],
        title: { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
        callout: { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
        hero: { cx: 0.5, cy: 0.29, w: 0.31 },
        titleLowText: true,
        badgePanel: 3, badgeCorner: 'tl',
        tags: [{ panel: 5, corner: 'bl' }, { panel: 6, corner: 'br' }],
      },
    },
  },
  {
    id: 'banner', name: 'Top Banner', blurb: 'Masthead title over a hero panel and a quad grid',
    formats: {
      landscape: {
        panels: [cell(0, 0.2, 0.44, 0.8), cell(0.44, 0.2, 0.28, 0.4), cell(0.72, 0.2, 0.28, 0.4, 1.5), cell(0.44, 0.6, 0.28, 0.4, -1.5), cell(0.72, 0.6, 0.28, 0.4)],
        title: { x: 0, y: 0, w: 1, h: 0.2 },
        callout: null,
        hero: { cx: 0.22, cy: 0.58, w: 0.3 },
        badgePanel: 2, badgeCorner: 'tr',
        tags: [{ panel: 0, corner: 'bl' }, { panel: 4, corner: 'br' }],
      },
      portrait: {
        panels: [cell(0, 0.15, 1, 0.4), cell(0, 0.55, 0.5, 0.225), cell(0.5, 0.55, 0.5, 0.225, 1.5), cell(0, 0.775, 0.5, 0.225, -1.5), cell(0.5, 0.775, 0.5, 0.225)],
        title: { x: 0, y: 0, w: 1, h: 0.15 },
        callout: null,
        hero: { cx: 0.5, cy: 0.36, w: 0.56 },
        badgePanel: 1, badgeCorner: 'tl',
        tags: [{ panel: 0, corner: 'br' }, { panel: 4, corner: 'bl' }],
      },
      square: {
        panels: [cell(0, 0.18, 0.5, 0.41), cell(0.5, 0.18, 0.5, 0.41, 1.5), cell(0, 0.59, 0.5, 0.41, -1.5), cell(0.5, 0.59, 0.5, 0.41)],
        title: { x: 0, y: 0, w: 1, h: 0.18 },
        callout: null,
        hero: { cx: 0.5, cy: 0.55, w: 0.4 },
        badgePanel: 0, badgeCorner: 'tl',
        tags: [{ panel: 1, corner: 'tr' }, { panel: 3, corner: 'br' }],
      },
    },
  },
  {
    id: 'stack', name: 'Side Stack', blurb: 'A tall title column beside a wall of panels',
    formats: {
      landscape: {
        panels: [cell(0.3, 0, 0.35, 1 / 3), cell(0.65, 0, 0.35, 1 / 3, 1.5), cell(0.3, 1 / 3, 0.35, 1 / 3, -1.5), cell(0.65, 1 / 3, 0.35, 1 / 3), cell(0.3, 2 / 3, 0.35, 1 / 3), cell(0.65, 2 / 3, 0.35, 1 / 3, -2)],
        title: { x: 0, y: 0, w: 0.3, h: 1 },
        callout: null,
        hero: { cx: 0.3, cy: 0.52, w: 0.3 },
        badgePanel: 0, badgeCorner: 'tr',
        tags: [{ panel: 3, corner: 'bl' }, { panel: 5, corner: 'br' }],
      },
      portrait: {
        panels: [cell(0.42, 0, 0.58, 1 / 3), cell(0.42, 1 / 3, 0.58, 1 / 3, 1.5), cell(0.42, 2 / 3, 0.58, 1 / 3, -1.5)],
        title: { x: 0, y: 0, w: 0.42, h: 1 },
        callout: null,
        hero: { cx: 0.42, cy: 0.5, w: 0.5 },
        badgePanel: 0, badgeCorner: 'tr',
        tags: [{ panel: 1, corner: 'tl' }, { panel: 2, corner: 'bl' }],
      },
      square: {
        panels: [cell(0.34, 0, 0.33, 0.5), cell(0.67, 0, 0.33, 0.5, 1.5), cell(0.34, 0.5, 0.33, 0.5, -1.5), cell(0.67, 0.5, 0.33, 0.5)],
        title: { x: 0, y: 0, w: 0.34, h: 1 },
        callout: null,
        hero: { cx: 0.34, cy: 0.5, w: 0.36 },
        badgePanel: 1, badgeCorner: 'tr',
        tags: [{ panel: 0, corner: 'tl' }, { panel: 3, corner: 'br' }],
      },
    },
  },
  {
    id: 'bleed', name: 'Full Bleed', blurb: 'One photo wall-to-wall, inset panels, title band',
    formats: {
      landscape: {
        panels: [cell(0, 0, 1, 1), cell(0.76, 0.06, 0.2, 0.3), cell(0.76, 0.4, 0.2, 0.3)],
        title: { x: 0.04, y: 0.7, w: 0.56, h: 0.26 },
        callout: null,
        hero: { cx: 0.66, cy: 0.54, w: 0.3 },
        badgePanel: 0, badgeCorner: 'tl',
        tags: [{ panel: 1, corner: 'bl' }, { panel: 2, corner: 'bl' }],
      },
      portrait: {
        panels: [cell(0, 0, 1, 1), cell(0.7, 0.05, 0.26, 0.2), cell(0.7, 0.28, 0.26, 0.2)],
        title: { x: 0.05, y: 0.76, w: 0.9, h: 0.2 },
        callout: null,
        hero: { cx: 0.46, cy: 0.44, w: 0.55 },
        badgePanel: 0, badgeCorner: 'tl',
        tags: [{ panel: 1, corner: 'bl' }, { panel: 2, corner: 'bl' }],
      },
      square: {
        panels: [cell(0, 0, 1, 1), cell(0.72, 0.06, 0.24, 0.24)],
        title: { x: 0.04, y: 0.74, w: 0.92, h: 0.22 },
        callout: null,
        hero: { cx: 0.4, cy: 0.44, w: 0.42 },
        badgePanel: 0, badgeCorner: 'tl',
        tags: [{ panel: 1, corner: 'bl' }],
      },
    },
  },
];

/** Finds a layout family by id, falling back to Panel Heat. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** The panel geometry for a design's layout and format, in cover fractions. */
export function layoutSpec(state) {
  return layoutById(state.layout).formats[state.format] ?? layoutById(state.layout).formats.landscape;
}

function toPx(rect, W, H) {
  return { x: rect.x * W, y: rect.y * H, w: rect.w * W, h: rect.h * H, tilt: rect.tilt ?? 0 };
}

const panelCache = new Map();

/** Drops every cached graded panel (used when photos change). */
export function clearPanelCache() {
  panelCache.clear();
}

function placeholderPanel(pw, ph, index, grade) {
  const c = document.createElement('canvas');
  c.width = pw;
  c.height = ph;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, pw, ph);
  grad.addColorStop(0, '#241536');
  grad.addColorStop(0.55, '#3d1a5c');
  grad.addColorStop(1, '#571f4d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, pw, ph);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = `${Math.max(13, ph * 0.09)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PANEL ${index + 1}`, pw / 2, ph / 2 - ph * 0.07);
  ctx.font = `${Math.max(10, ph * 0.05)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('add a photo', pw / 2, ph / 2 + ph * 0.06);
  return c;
}

/**
 * One panel, rendered and graded at its exact pixel size and cached: the photo cover-fitted with the
 * panel's crop (pan offsets and zoom), the grade applied, and the halftone dot finish over the top.
 */
export function gradedPanelCanvas(photo, pw, ph, grade, crop, index) {
  const key = [
    photo ? photo.id : 'none', pw, ph, grade.id,
    crop.scale.toFixed(3), crop.dx.toFixed(2), crop.dy.toFixed(2), index,
  ].join('|');
  if (panelCache.has(key)) return panelCache.get(key);
  let canvas;
  if (!photo) {
    canvas = placeholderPanel(pw, ph, index, grade);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext('2d');
    const img = photo.img;
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * crop.scale;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    const ox = (pw - dw) / 2 + crop.dx * (dw - pw) * 0.5;
    const oy = (ph - dh) / 2 + crop.dy * (dh - ph) * 0.5;
    ctx.fillStyle = '#0a0614';
    ctx.fillRect(0, 0, pw, ph);
    ctx.drawImage(img, ox, oy, dw, dh);
    applyGradeToCanvas(canvas, grade);
    if (grade.halftone > 0.01) {
      ctx.save();
      ctx.globalAlpha = grade.halftone * 0.6;
      ctx.fillStyle = ctx.createPattern(halftoneTile(9, 2.4), 'repeat');
      ctx.fillRect(0, 0, pw, ph);
      ctx.restore();
    }
  }
  if (panelCache.size > 90) panelCache.clear();
  panelCache.set(key, canvas);
  return canvas;
}

function drawPanel(ctx, canvas, rect) {
  ctx.save();
  if (rect.tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.tilt * Math.PI) / 180);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = rect.w * 0.05;
    ctx.shadowOffsetY = rect.h * 0.03;
    ctx.drawImage(canvas, -rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#0a0810';
    ctx.lineWidth = Math.max(2, rect.w * 0.008);
    ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-rect.w / 2 + 4, -rect.h / 2 + 4, rect.w - 8, rect.h - 8);
  } else {
    ctx.drawImage(canvas, rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#0a0810';
    ctx.lineWidth = Math.max(2, rect.w * 0.008);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
  }
  ctx.restore();
}

function tagPosition(rect, corner, W, text) {
  const inset = Math.max(8, W * 0.008);
  const scale = Math.max(0.8, W / 1500);
  const tagH = 26 * scale;
  const tagW = roleTagWidth(text, scale);
  const top = corner.startsWith('t');
  const left = corner.endsWith('l');
  const x = left ? rect.x + inset : rect.x + rect.w - inset - tagW;
  const y = top ? rect.y + inset : rect.y + rect.h - inset - tagH;
  return [x, y, scale];
}

/**
 * Paints the whole design. `photos` is the photo list (each { id, img }), `cutout` the hero cut-out canvas
 * or null. Returns the drawn panel rectangles and the hero rectangle, for the editor's hit-testing.
 */
export function renderCover(ctx, state, photos, cutout) {
  const format = FORMATS[state.format];
  const W = format.w;
  const H = format.h;
  const grade = gradeById(state.grade);
  const spec = layoutSpec(state);
  const words = { headline: state.headline, subtitle: state.subtitle, heat: state.heat };
  const finish = state.finish ?? { grain: 100, vignette: 100 };

  ctx.save();
  ctx.fillStyle = '#07040d';
  ctx.fillRect(0, 0, W, H);
  const board = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
  board.addColorStop(0, 'rgba(61, 26, 92, 0.5)');
  board.addColorStop(1, 'rgba(7, 4, 13, 0)');
  ctx.fillStyle = board;
  ctx.fillRect(0, 0, W, H);

  const panelRects = spec.panels.map((p) => toPx(p, W, H));
  panelRects.forEach((rect, i) => {
    const panelState = state.panels[i] ?? { photo: -1, dx: 0, dy: 0, scale: 1 };
    const photo = panelState.photo >= 0 ? photos[panelState.photo] : null;
    const canvas = gradedPanelCanvas(photo ?? null, Math.round(rect.w), Math.round(rect.h), grade, panelState, i);
    drawPanel(ctx, canvas, rect);
  });

  const dots = ctx.createPattern(halftoneTile(11, 3), 'repeat');
  if (spec.callout) {
    drawCalloutPanel(ctx, toPx(spec.callout, W, H), state.callout, dots);
  }
  if (spec.title) {
    drawTitleBlock(ctx, toPx(spec.title, W, H), words, dots, spec.titleLowText === true);
  }

  let heroRect = null;
  if (cutout && state.hero.mode !== 'off') {
    const drawW = spec.hero.w * W * (state.hero.scale / 100);
    const cx = (spec.hero.cx + state.hero.dx) * W;
    const cy = (spec.hero.cy + state.hero.dy) * H;
    heroRect = drawPopOutHero(ctx, cutout, cx, cy, drawW);
  }

  if (spec.badgePanel >= 0 && panelRects[spec.badgePanel]) {
    drawBadgeRibbon(ctx, panelRects[spec.badgePanel], spec.badgeCorner, state.badge);
  }
  const tagTexts = [state.tagA, state.tagB];
  (spec.tags ?? []).forEach((tag, i) => {
    const rect = panelRects[tag.panel];
    if (!rect || !tagTexts[i]) return;
    const [tx, ty, scale] = tagPosition(rect, tag.corner, W, tagTexts[i]);
    drawRoleTag(ctx, tx, ty, tagTexts[i], scale);
  });

  const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vignette.addColorStop(0, 'rgba(5, 2, 12, 0)');
  vignette.addColorStop(1, `rgba(5, 2, 12, ${Math.min(1, 0.62 * grade.vignette * (finish.vignette / 100))})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  if (grade.grain * (finish.grain / 100) > 0.005) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, grade.grain * (finish.grain / 100));
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.restore();
  return { panelRects, heroRect, spec };
}
