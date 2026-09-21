import { validateTuning, type ShaderTuning } from "./shader-controls";
import { DEFAULT_BRAND, sceneSurfaces, type SceneId, type Brand, type Treatment } from "./model";
import { nativeKind, nativeSettings, type NativeSettings } from "./native-settings";
import { validCopy, type SurfaceCopy } from "./surface-copy";
import { validateNativeSnapshot, type NativeSnapshot } from "./native-snapshot";

export const DEFAULT_TREATMENTS: Record<string, Treatment> = { poster: { placement: "Background", intensity: 100 }, study: { placement: "Media", intensity: 100 }, wordmark: { placement: "Background", intensity: 100 } };
export type BrandLabSetup = {
  version: 3; tuning: ShaderTuning; scene: SceneId; brand: Brand; shaderId: string | null;
  palette: "Original" | "Brand"; treatments: Record<string, Treatment>;
  native: NativeSettings[keyof NativeSettings] | null; editorNative?: NativeSnapshot; missing: ("logo" | "media")[]; copy?: SurfaceCopy;
};
// Setups support bundled assets only. Upload object URLs are deliberately never
// serialized or presented as portable files.
export function createSetup(brand: Brand, shaderId: string | null, palette: BrandLabSetup["palette"], treatments: BrandLabSetup["treatments"], tuning: ShaderTuning = {}, scene: SceneId = "campaign", copy: SurfaceCopy = {}, editorNative?: NativeSnapshot): BrandLabSetup {
  const missing: BrandLabSetup["missing"] = [];
  if (brand.logo && brand.logo !== DEFAULT_BRAND.logo) missing.push("logo");
  if (brand.media !== DEFAULT_BRAND.media || brand.mediaType !== "image") missing.push("media");
  const portable: Brand = { name: brand.name, tagline: brand.tagline, primary: brand.primary, secondary: brand.secondary, logo: brand.logo === DEFAULT_BRAND.logo ? DEFAULT_BRAND.logo : undefined, media: DEFAULT_BRAND.media, mediaType: "image" };
  const kind = shaderId ? nativeKind(shaderId) : undefined;
  return { version: 3, tuning, scene, brand: portable, shaderId, palette, treatments, native: kind ? editorNative ?? nativeSettings(portable, palette, shaderId!, tuning)[kind] : null, editorNative, missing, copy };
}
export function setupQuery(setup: BrandLabSetup) { return `brandLab=${encodeURIComponent(JSON.stringify(setup))}`; }
export function readSetup(raw: string | string[] | undefined): BrandLabSetup | null {
  if (typeof raw !== "string" || raw.length > 12000) return null;
  try {
    const value = JSON.parse(raw) as Omit<BrandLabSetup, "version" | "tuning"> & { version: number; tuning?: unknown };
    if (![1, 2, 3].includes(value.version) || !["campaign", "identity", "web"].includes(value.scene) || !value.brand || !value.treatments || !Array.isArray(value.missing)) return null;
    const { brand, shaderId, palette } = value;
    if (typeof brand.name !== "string" || brand.name.length > 24 || typeof brand.tagline !== "string" || brand.tagline.length > 70) return null;
    if (![brand.primary, brand.secondary].every(color => typeof color === "string" && /^#[\da-f]{6}$/i.test(color))) return null;
    if ((brand.logo && brand.logo !== DEFAULT_BRAND.logo) || brand.media !== DEFAULT_BRAND.media || brand.mediaType !== "image" || !["Original", "Brand"].includes(palette)) return null;
    if (shaderId !== null && (typeof shaderId !== "string" || !nativeKind(shaderId))) return null;
    if (value.missing.some(key => key !== "logo" && key !== "media")) return null;
    const copy = value.copy === undefined ? {} : validCopy(value.copy);
    if (!copy) return null;
    for (const surface of sceneSurfaces(value.scene)) {
      const t = value.treatments[surface.id];
      if (!t || !(surface.modes as readonly string[]).includes(t.placement) || !Number.isFinite(t.intensity) || t.intensity < 0 || t.intensity > 100) return null;
    }
    // V1 links migrate to default tuning. V2 allows only the curated numeric
    // controls; validate the complete snapshot against those values.
    const tuning = validateTuning(shaderId, value.version === 1 ? {} : value.tuning);
    if (!tuning) return null;
    const editorNative = value.version === 3 && value.editorNative !== undefined ? validateNativeSnapshot(shaderId, value.editorNative) : undefined;
    if (value.editorNative !== undefined && !editorNative) return null;
    const treatments = Object.fromEntries(sceneSurfaces(value.scene).map(surface => [surface.id, { placement: value.treatments[surface.id].placement, intensity: value.treatments[surface.id].intensity }]));
    const expected = createSetup(brand, shaderId, palette, treatments, tuning, value.scene, copy, editorNative ?? undefined);
    if (JSON.stringify(value.native) !== JSON.stringify(expected.native)) return null;
    return { ...expected, missing: [...new Set(value.missing)] };
  } catch { return null; }
}

export const IDENTITY_TREATMENTS: Record<string, Treatment> = {
  "identity-mark": { placement: "Mask", intensity: 100 },
  "identity-tile": { placement: "Background", intensity: 100 },
  "identity-material": { placement: "Media", intensity: 100 },
};

export const WEB_TREATMENTS: Record<string, Treatment> = { "web-hero": { placement: "Media", intensity: 100 }, "web-feature": { placement: "Media", intensity: 100 }, "web-cta": { placement: "Background", intensity: 100 } };
