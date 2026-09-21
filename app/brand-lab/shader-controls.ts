export type ShaderTuning = Record<string, number>;
export type ShaderControl = { key: string; label: string; min: number; max: number; step: number };
export const EMPTY_TUNING: ShaderTuning = {};
const control = (key: string, label: string, min: number, max: number, step: number): ShaderControl => ({ key, label, min, max, step });
const field = [control('scale', 'Scale', .35, 2.4, .05), control('distortion', 'Distortion', 0, 1.5, .05), control('speed', 'Speed', 0, 1.6, .05)];
const controls: Record<string, readonly ShaderControl[]> = {
  'viscous-cursor-dye': [control('distortion', 'Distortion', 0, 1.5, .05), control('trail', 'Trail', 0, 1, .05), control('speed', 'Speed', 0, 1.6, .05)], 'reaction-bloom': field, 'cellular-contagion': field,
  'repulsion-lattice': field, 'magnetic-pixels': field, 'chromatic-refraction': field,
  'thermal-pixel-ink': [control('cellSize', 'Cell size', 5, 22, 1), control('ambient', 'Ambient heat', 0, 1, .02), control('speed', 'Speed', 0, 1.2, .02)],
  'thermal-etch-burn': [control('progress', 'Burn progress', 0, 1, .01), control('grain', 'Grain', 0, 1, .02), control('speed', 'Speed', 0, 1.4, .02)],
  'particle-assembly': [control('size', 'Particle size', 2.5, 9, .1), control('scatter', 'Scatter', .75, 1.65, .05), control('duration', 'Assembly duration', 3.2, 9, .1)],
  'refractive-lens': [control('size', 'Lens size', .16, .72, .01), control('refraction', 'Refraction', 0, 1.4, .02), control('dispersion', 'Dispersion', 0, .8, .02)],
  'exposure-grid': [control('columns', 'Columns', 2, 12, 1), control('activity', 'Sampling activity', .04, .56, .02), control('grain', 'Grain', 0, 1, .02)],
  'fluid-distortion': [control('distortion', 'Distortion', .08, 1, .01), control('softness', 'Softness', .03, .18, .005), control('gloss', 'Gloss', 0, 1, .01)],
  'blackhole-lensing': [control('radius', 'Portal radius', .04, .3, .01), control('lens', 'Lensing', 0, .8, .02), control('orbit', 'Orbit', 0, 1.8, .05)],
  'specimen-index': [control('probes', 'Probes', 1, 4, 1), control('detail', 'Detail', 0, 1, .02), control('motion', 'Motion', 0, 1, .02)],
};
export function shaderControls(id: string | null): readonly ShaderControl[] { return id && Object.hasOwn(controls, id) ? controls[id] : []; }
export function validateTuning(id: string | null, raw: unknown): ShaderTuning | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const allowed = shaderControls(id);
  const entries = Object.entries(raw);
  for (const [key, value] of entries) {
    const c = allowed.find(c => c.key === key);
    if (!c || typeof value !== 'number' || !Number.isFinite(value) || value < c.min || value > c.max || c.step === 1 && !Number.isInteger(value)) return null;
  }
  return Object.fromEntries(entries);
}
export function clampControl(control: ShaderControl, value: number) {
  return Number(Math.max(control.min, Math.min(control.max, Math.round(value / control.step) * control.step)).toFixed(4));
}
