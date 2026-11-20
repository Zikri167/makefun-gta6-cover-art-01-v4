// Fixed scenes for the screenshots, driven by the page's query string: ?shot=cover shows one exported cover
// full frame, ?shot=editor shows the studio with a design loaded. Every field is optional and names the
// sample photos to use, so a scene is a compact description the screenshot script can replay exactly.

/** Parses the query into a scene patch for the editor state, or null when this is not a shot. */
export function parseShotScene(params) {
  const shot = params.get('shot');
  if (!shot) return null;
  const scene = { shot };
  const text = (key, target) => {
    const value = params.get(key);
    if (value !== null) scene[target ?? key] = value;
  };
  text('format');
  text('layout');
  text('grade');
  text('headline');
  text('subtitle');
  text('callout');
  text('badge');
  text('tagA', 'tagA');
  text('tagB', 'tagB');
  if (params.get('heat')) scene.heat = Number(params.get('heat'));
  if (params.get('panels')) scene.panelNames = params.get('panels').split(',').map((s) => s.trim());
  if (params.get('crops')) {
    scene.panelCrops = params.get('crops').split(';').map((entry) => {
      if (!entry) return null;
      const [dx, dy, scale] = entry.split(',').map(Number);
      return { dx: dx || 0, dy: dy || 0, scale: scale || 1 };
    });
  }
  if (params.get('hero')) scene.heroName = params.get('hero');
  if (params.get('heroMode')) scene.heroMode = params.get('heroMode');
  if (params.get('heroKeyAt')) {
    const [fx, fy] = params.get('heroKeyAt').split(',').map(Number);
    scene.heroKeyAt = [fx, fy];
  }
  if (params.get('heroTol')) scene.heroTolerance = Number(params.get('heroTol'));
  if (params.get('heroFeather')) scene.heroFeather = Number(params.get('heroFeather'));
  if (params.get('heroScale')) scene.heroScale = Number(params.get('heroScale'));
  if (params.get('selected')) scene.selected = Number(params.get('selected'));
  if (params.get('flash')) scene.flash = params.get('flash');
  return scene;
}
