export type ShaderEntry = { id: string; title: string };
export type Placement = "Background" | "Media" | "Mask" | "Accent";
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
  name: "FORME",
  tagline: "A different kind of gathering.",
  primary: "#d6f369",
  secondary: "#ed8c56",
  media: "/exposure-grid-mountain.jpg",
  mediaType: "image",
};

export const SURFACES = [
  { id: "poster", label: "Campaign poster", width: 1080, height: 1350, modes: ["Background", "Mask", "Accent"] },
  { id: "study", label: "Material study", width: 1080, height: 1080, modes: ["Media", "Mask", "Accent"] },
  { id: "wordmark", label: "Identity strip", width: 1600, height: 600, modes: ["Mask", "Background"] },
] as const;

export const MEDIA_SHADERS = new Set(["refractive-lens", "exposure-grid", "fluid-distortion", "blackhole-lensing", "specimen-index", "thermal-etch-burn"]);
export function supportsBrandPalette(id: string | null) { return id !== "refractive-lens"; }

export function letterMask(name: string) {
  const letter = (name.trim()[0] || "F").replace(/[<>&"']/g, "");
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><text x="200" y="330" fill="white" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="410">${letter}</text></svg>`)}`;
}
