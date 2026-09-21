import type { FieldShaderSettings, FieldShaderVariant } from "../components/SolaceFieldShader";
import type { ThermalPixelSettings } from "../components/ThermalPixelShader";
import type { ThermalEtchSettings } from "../components/ThermalEtchBurn";
import type { ParticleMorphSettings } from "../components/ParticleMorphShader";
import type { RefractiveLensSettings } from "../components/RefractiveLens";
import type { ExposureGridSettings } from "../components/ExposureGrid";
import type { FluidDistortionSettings } from "../components/FluidDistortion";
import type { BlackholeLensingSettings } from "../components/BlackholeLensing";
import type { SpecimenIndexSettings } from "../components/SpecimenIndex";
import type { ShaderTuning } from "./shader-controls";
import type { Brand } from "./model";

export const variants = {
  "viscous-cursor-dye": "viscous", "reaction-bloom": "reaction", "cellular-contagion": "cellular",
  "repulsion-lattice": "repulsion", "magnetic-pixels": "magnetic", "chromatic-refraction": "chromatic",
} as const satisfies Record<string, FieldShaderVariant>;
export type NativeSettings = {
  field: FieldShaderSettings; thermal: ThermalPixelSettings; etch: ThermalEtchSettings;
  particle: ParticleMorphSettings; lens: RefractiveLensSettings; exposure: ExposureGridSettings;
  fluid: FluidDistortionSettings; blackhole: BlackholeLensingSettings; specimen: SpecimenIndexSettings;
};

// Explicit Scene settings include the public components' previously implicit
// defaults. Keep this private snapshot versioned with setup.ts; no renderer imports.
export function nativeSettings(brand: Brand, palette: "Original" | "Brand", id: string, tuning: ShaderTuning = {}): NativeSettings {
  const mapped = palette === "Brand", background = "#151b17", paper = "#f0efe7";
  const settings: NativeSettings = {
    field: { scale: 1, intensity: 1, speed: .3, distortion: .8, trail: .45, palette: id === "chromatic-refraction" ? "acid" : "signal", colors: mapped ? { background, primary: brand.primary, secondary: brand.secondary, highlight: paper } : id === "chromatic-refraction" ? { background: "#0e0d17", primary: "#7638fa", secondary: "#ff4c91", highlight: "#eaff38" } : { background: "#090b0a", primary: "#1236ff", secondary: "#f0432f", highlight: "#d8ff2f" } },
    thermal: { cellSize: 9, brushRadius: 82, heat: 1.05, pressBoost: 1.55, decay: .925, noise: .46, speed: .35, ambient: .6, gap: .085, bandShift: 0, palette: "wild", colors: mapped ? { background, shadow: "#25372c", cool: brand.primary, warm: brand.secondary, hot: paper, peak: "#ffffff" } : { background: "#efeee8", shadow: "#101932", cool: "#1236ff", warm: "#ffd522", hot: "#f0432f", peak: "#d8ff2f" } },
    etch: { progress: .12, speed: .24, edgeWidth: .075, heat: 1.05, turbulence: .62, grain: .35, contrast: 1.18, detail: .82, colors: mapped ? { ink: background, paper: "#667950", cool: brand.primary, warm: brand.secondary, hot: paper, peak: "#ffffff" } : { ink: "#10251A", paper: "#78935F", cool: "#23604B", warm: "#F2E85B", hot: "#FF654F", peak: "#A535FF" } },
    particle: { preset: "word", svg: "", text: brand.name.slice(0, 12), particleCount: 1200, size: 4, gloss: .72, scatter: 1.12, duration: 7, turbulence: .58, interaction: .35, palette: "acid", colors: mapped ? { background, shadow: "#6b7446", surface: brand.primary, highlight: paper } : { background: "#111408", shadow: "#7b851d", surface: "#d7eb36", highlight: "#f8ffd0" } },
    lens: { mode: "static", shape: "circle", size: .7, radius: .74, refraction: 1.25, magnification: .82, frost: .04, thickness: .78, dispersion: .6, glassTint: "#F8FFF8", tintStrength: .06, follow: .08, position: [.5, .5] },
    exposure: { treatment: "chroma", columns: 3, rows: 3, lineWidth: 2.5, lineOpacity: .4, activity: .4, tempo: .96, intensity: .78, zoom: .68, grain: .3, interaction: .82, colors: mapped ? { accent: brand.primary, secondary: brand.secondary, ink: background, paper, grid: paper } : { grid: "#EAF1EC", accent: "#FF008B", secondary: "#2600FF", ink: "#17211B", paper: "#F0EAE4" } },
    fluid: { composition: "media", current: "orbit", character: "silk", cursorSize: .018, cursorPower: .18, distortion: .28, softness: .09, gloss: .35, swirl: .55, dissipationVel: .986, dissipationDist: .992, palette: "flare", colors: mapped ? { background, bloomA: brand.primary, bloomB: brand.secondary, bloomC: "#658b68", highlight: paper } : { background: "#FFFFFF", bloomA: "#FF4B9A", bloomB: "#FF6A21", bloomC: "#E01732", highlight: "#FFE6C8" } },
    blackhole: { mode: "orbit", progress: 1, radius: .18, lens: .34, reach: .34, orbit: .5, aberration: .01, wobble: .01, squash: .02, breath: .02, position: [.5, .5], palette: "editorial", colors: mapped ? { background, accretion: brand.primary, photonRing: brand.secondary, singularity: "#040604" } : { background: "#050505", accretion: "#F4F4F0", photonRing: "#FFFFFF", singularity: "#000000" } },
    specimen: { study: "editorial", mode: "auto", geometry: "studio", probes: 3, magnification: 1.38, detail: .78, frameWeight: 1, connectors: .86, grain: .18, motion: .2, response: .14, geometryAmount: .9, geometryDensity: .78, geometryScale: .84, pointerGeometry: .96, colors: mapped ? { paper, ink: background, frame: paper, accent: brand.primary, secondary: brand.secondary } : { paper: "#F3F3EE", ink: "#050607", frame: "#FAFAF5", accent: "#7591FF", secondary: "#2E43F5" } },
  };
  const kind = nativeKind(id);
  return kind ? { ...settings, [kind]: { ...settings[kind], ...tuning } } : settings;
}
export function nativeKind(id: string): keyof NativeSettings | undefined {
  if (Object.hasOwn(variants, id)) return "field";
  const kinds = { "thermal-pixel-ink": "thermal", "thermal-etch-burn": "etch", "particle-assembly": "particle", "refractive-lens": "lens", "exposure-grid": "exposure", "fluid-distortion": "fluid", "blackhole-lensing": "blackhole", "specimen-index": "specimen" } as const;
  return Object.hasOwn(kinds, id) ? kinds[id as keyof typeof kinds] : undefined;
}
export type IdentityPaletteStop = { color: string; label: string };

export function resolveIdentityPalette({
  brand,
  shaderId,
  palette = "Original",
  native,
  tuning = {},
}: {
  brand: Brand;
  shaderId: string | null;
  palette?: "Original" | "Brand";
  native?: NativeSettings[keyof NativeSettings] | Record<string, unknown> | null;
  tuning?: ShaderTuning;
}): [IdentityPaletteStop, IdentityPaletteStop, IdentityPaletteStop] {
  const fallback: [IdentityPaletteStop, IdentityPaletteStop, IdentityPaletteStop] = [
    { color: brand.primary, label: brand.primary.toUpperCase() },
    { color: brand.secondary, label: brand.secondary.toUpperCase() },
    { color: "#233429", label: "INK / PAPER" },
  ];

  if (!shaderId) return fallback;
  const kind = nativeKind(shaderId);
  if (!kind) return fallback;

  const resolved = nativeSettings(brand, palette, shaderId, tuning);
  const settings = (native ?? resolved[kind]) as Record<string, unknown> | undefined;
  if (!settings) return fallback;

  const colors = (settings.colors && typeof settings.colors === "object" ? settings.colors : {}) as Record<string, unknown>;
  const asColor = (val: unknown, alt: string) => (typeof val === "string" && val.trim().length > 0 ? val.trim() : alt);

  switch (kind) {
    case "field": {
      const c1 = asColor(colors.primary, brand.primary);
      const c2 = asColor(colors.secondary, brand.secondary);
      const c3 = asColor(colors.highlight, asColor(colors.background, "#233429"));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: colors.highlight ? c3.toUpperCase() : "INK / PAPER" },
      ];
    }
    case "exposure": {
      const c1 = asColor(colors.accent, brand.primary);
      const c2 = asColor(colors.secondary, brand.secondary);
      const c3 = asColor(colors.paper, asColor(colors.ink, asColor(colors.grid, "#233429")));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "specimen": {
      const c1 = asColor(colors.accent, brand.primary);
      const c2 = asColor(colors.secondary, brand.secondary);
      const c3 = asColor(colors.paper, asColor(colors.ink, "#233429"));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "thermal": {
      const c1 = asColor(colors.cool, brand.primary);
      const c2 = asColor(colors.warm, brand.secondary);
      const c3 = asColor(colors.hot, asColor(colors.peak, asColor(colors.background, "#233429")));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "etch": {
      const c1 = asColor(colors.cool, brand.primary);
      const c2 = asColor(colors.warm, brand.secondary);
      const c3 = asColor(colors.paper, asColor(colors.hot, asColor(colors.ink, "#233429")));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "particle": {
      if (palette === "Brand" && !native) {
        const c3 = asColor(colors.highlight, "#f0efe7");
        return [
          { color: brand.primary, label: brand.primary.toUpperCase() },
          { color: brand.secondary, label: brand.secondary.toUpperCase() },
          { color: c3, label: c3.toUpperCase() },
        ];
      }
      const c1 = asColor(colors.surface, brand.primary);
      const c2 = asColor(colors.highlight, brand.secondary);
      const c3 = asColor(colors.shadow, asColor(colors.background, "#233429"));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "fluid": {
      const c1 = asColor(colors.bloomA, brand.primary);
      const c2 = asColor(colors.bloomB, brand.secondary);
      const c3 = asColor(colors.bloomC, asColor(colors.highlight, asColor(colors.background, "#233429")));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "blackhole": {
      const c1 = asColor(colors.accretion, brand.primary);
      const c2 = asColor(colors.photonRing, brand.secondary);
      const c3 = asColor(colors.singularity, asColor(colors.background, "#050505"));
      return [
        { color: c1, label: c1.toUpperCase() },
        { color: c2, label: c2.toUpperCase() },
        { color: c3, label: c3.toUpperCase() },
      ];
    }
    case "lens": {
      const tint = asColor(settings.glassTint, "#F8FFF8");
      return [
        { color: brand.primary, label: brand.primary.toUpperCase() },
        { color: brand.secondary, label: brand.secondary.toUpperCase() },
        { color: tint, label: tint.toUpperCase() },
      ];
    }
    default:
      return fallback;
  }
}
