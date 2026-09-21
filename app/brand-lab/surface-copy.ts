export type SurfaceCopy = Record<string, string>;
export const COPY_FIELDS: Record<string, readonly { key: string; label: string; fallback: string }[]> = {
  poster: [{ key: "poster-note", label: "Top note", fallback: "Thoughtful blocks\nfor better pages." }, { key: "poster-footer", label: "Footer note", fallback: "Build with clarity.\nMake it yours." }],
  study: [
    { key: "study-headline-1", label: "Left headline", fallback: "Start with\na better\nblock." },
    { key: "study-headline-2", label: "Right headline", fallback: "Make it\nyour\nown." },
    { key: "study-note", label: "Supporting line", fallback: "Two expressions. One system." },
  ],
  wordmark: [
    { key: "wordmark-kicker", label: "Kicker", fallback: "THE SYSTEM, CONTINUED" },
    { key: "wordmark-headline", label: "Headline", fallback: "MADE TO\nFEEL RIGHT." },
    { key: "wordmark-note", label: "Supporting line", fallback: "A more considered way." },
  ],
  "identity-mark": [{ key: "signature-note", label: "Signature line", fallback: "An independent spirit.\nA shared way of seeing." }],
  "identity-tile": [
    { key: "tile-note", label: "Corner label", fallback: "01 / MARK" },
    { key: "tile-headline", label: "Headline", fallback: "Details make\nthe difference." },
  ],
  "identity-material": [
    { key: "material-headline", label: "Headline", fallback: "Make space\nfor what matters." },
    { key: "material-note", label: "Supporting line", fallback: "MATERIAL / SolaceUI" },
  ],
  "web-hero": [{ key: "web-hero-note", label: "Supporting line", fallback: "A flexible library for the pages you imagine.\nMake a strong start, then make it yours." }],
  "web-feature": [
    { key: "feature-note", label: "Feature label", fallback: "BLOCK STUDY / 001" },
    { key: "feature-headline", label: "Headline", fallback: "Built to\nstand out." },
  ],
  "web-cta": [
    { key: "web-cta-headline", label: "Headline", fallback: "Make your\nmark." },
    { key: "web-cta-note", label: "Side note", fallback: "ONE SYSTEM\nENDLESS EXPRESSIONS" },
  ],
};
export function copyValue(copy: SurfaceCopy, key: string, fallback: string) { return copy[key] ?? fallback; }
export function validCopy(raw: unknown): SurfaceCopy | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const allowed = new Set(Object.values(COPY_FIELDS).flat().map(field => field.key));
  const entries = Object.entries(raw);
  if (entries.some(([key, value]) => !allowed.has(key) || typeof value !== "string" || value.length > 180)) return null;
  return Object.fromEntries(entries);
}
