export type ShaderEntry = { id: string; title: string };
export type Placement = "Background" | "Media" | "Mask";
export type Brand = {
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  logo?: string;
  media: string;
  mediaType: "image" | "video";
};
export type Treatment = { placement: Placement; intensity: number };
export const DEFAULT_BRAND: Brand = {
  name: "SolaceUI",
  tagline: "Tasteful Marketing Blocks Library",
  primary: "#7591ff",
  secondary: "#2e43f5",
  logo: "/brand-lab/solaceui-mark.svg",
  media: "/exposure-grid-mountain.jpg",
  mediaType: "image",
};

export const SURFACES = [
  { id: "poster", label: "Campaign poster", width: 1080, height: 1350, modes: ["Background", "Mask"] },
  { id: "study", label: "Poster pair", width: 1080, height: 1080, modes: ["Media", "Mask"] },
  { id: "wordmark", label: "Graphic pair", width: 1600, height: 440, modes: ["Mask", "Background"] },
] as const;

export const MEDIA_SHADERS = new Set(["refractive-lens", "exposure-grid", "fluid-distortion", "blackhole-lensing", "specimen-index", "thermal-etch-burn"]);
export function usesBrandMedia(id: string | null, mediaType: Brand["mediaType"]) { return Boolean(id && MEDIA_SHADERS.has(id) && !(id === "thermal-etch-burn" && mediaType === "video")); }
export function supportsBrandPalette(id: string | null) { return id !== "refractive-lens"; }

export function letterMask(name: string) {
  const letter = (name.trim()[0] || "F").replace(/[<>&"']/g, "");
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><text x="200" y="330" fill="white" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="410">${letter}</text></svg>`)}`;
}

export function wordmarkMask(name: string) {
  const word = (name.trim() || "FORME").slice(0, 24).replace(/[<>&"']/g, "");
  const size = Math.min(245, Math.max(62, 1050 / Math.max(word.length * .58, 1)));
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320"><text x="600" y="238" fill="white" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${size}" letter-spacing="-.055em">${word}</text></svg>`)}`;
}

export type SceneId = "campaign" | "identity" | "web";
export const IDENTITY_SURFACES = [
  { id: "identity-mark", label: "Signature mark", width: 1600, height: 840, modes: ["Mask", "Background"] },
  { id: "identity-tile", label: "Graphic study A", width: 1080, height: 1160, modes: ["Mask", "Background"] },
  { id: "identity-material", label: "Graphic study B", width: 1080, height: 1160, modes: ["Media", "Mask"] },
] as const;
export const WEB_SURFACES = [
  { id: "web-hero", label: "Website promo", width: 1600, height: 860, modes: ["Media", "Background"] },
  { id: "web-feature", label: "Editorial feature", width: 1200, height: 900, modes: ["Media", "Mask"] },
  { id: "web-cta", label: "Footer banner", width: 1600, height: 500, modes: ["Mask", "Background"] },
] as const;
export function sceneLabel(scene: SceneId) { return scene === "web" ? "Web" : scene === "identity" ? "Identity" : "Campaign"; }
export type Surface = typeof SURFACES[number] | typeof IDENTITY_SURFACES[number] | typeof WEB_SURFACES[number];
export function sceneSurfaces(scene: SceneId): readonly Surface[] { return scene === "web" ? WEB_SURFACES : scene === "identity" ? IDENTITY_SURFACES : SURFACES; }
