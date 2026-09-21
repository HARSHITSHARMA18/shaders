import { clampControl, shaderControls, type ShaderTuning } from "./shader-controls";

type Values = Record<string, unknown>;
const paths: Record<string, Record<string, string>> = {
  "viscous-cursor-dye": { distortion: "material.distortion", trail: "material.trail", speed: "motion.speed" },
  "reaction-bloom": { scale: "material.scale", distortion: "material.distortion", speed: "motion.speed" },
  "cellular-contagion": { scale: "material.scale", distortion: "material.distortion", speed: "motion.speed" },
  "repulsion-lattice": { scale: "material.scale", distortion: "material.distortion", speed: "motion.speed" },
  "magnetic-pixels": { scale: "material.scale", distortion: "material.distortion", speed: "motion.speed" },
  "chromatic-refraction": { scale: "material.scale", distortion: "material.distortion", speed: "motion.speed" },
  "thermal-pixel-ink": { cellSize: "geometry.cellSize", ambient: "field.ambient", speed: "field.speed" },
  "thermal-etch-burn": { progress: "burn.progress", grain: "texture.grain", speed: "motion.speed" },
  "particle-assembly": { size: "particles.size", scatter: "particles.scatter", duration: "motion.duration" },
  "refractive-lens": { size: "lens.size", refraction: "optics.refraction", dispersion: "optics.dispersion" },
  "exposure-grid": { columns: "grid.columns", activity: "sampling.activity", grain: "sampling.grain" },
  "fluid-distortion": { distortion: "fluid.distortion", softness: "fluid.softness", gloss: "fluid.gloss" },
  "blackhole-lensing": { radius: "physics.radius", lens: "physics.lens", orbit: "physics.orbit" },
  "specimen-index": { probes: "composition.probes", detail: "sampling.detail", motion: "sampling.motion" },
};
function at(values: Values, path: string): unknown { return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Values)[key] : undefined, values); }
export function editorTuning(id: string, values: Values): ShaderTuning {
  const map = paths[id] ?? {};
  return Object.fromEntries(shaderControls(id).flatMap(control => {
    const raw = at(values, map[control.key]);
    if (typeof raw !== "number" || !Number.isFinite(raw)) return [];
    const stopped = control.key === "speed" && (at(values, "motion.animate") === false || at(values, "field.motion") === false);
    return [[control.key, clampControl(control, stopped ? 0 : raw)]];
  }));
}
