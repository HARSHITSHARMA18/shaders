import { DEFAULT_BRAND } from "./model";
import { nativeKind, nativeSettings, type NativeSettings } from "./native-settings";

export type NativeSnapshot = NativeSettings[keyof NativeSettings];

// The editor and Brand Lab use the same public renderer settings. Accept only
// that renderer's known shape and small, finite values from a portable link.
export function validateNativeSnapshot(id: string | null, raw: unknown): NativeSnapshot | null {
  const kind = id && nativeKind(id);
  const serialized = JSON.stringify(raw);
  if (!kind || !serialized || serialized.length > 11000) return null;
  const expected = nativeSettings(DEFAULT_BRAND, "Original", id)[kind];
  const matches = (value: unknown, shape: unknown, key = ""): boolean => {
    if (typeof shape === "number") return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 100000;
    if (typeof shape === "string") {
      if (typeof value !== "string") return false;
      if (key === "svg") return value.length <= 8000 && !/<script|<foreignObject|\bon\w+\s*=|javascript:/i.test(value);
      if (key === "text") return value.length <= 24;
      if (/^(background|primary|secondary|highlight|shadow|surface|cool|warm|hot|peak|ink|paper|grid|frame|accent|bloomA|bloomB|bloomC|accretion|photonRing|singularity|glassTint)$/.test(key)) return /^#[\da-f]{6}$/i.test(value);
      return /^[a-z][a-z0-9-]{0,31}$/.test(value);
    }
    if (Array.isArray(shape)) return Array.isArray(value) && value.length === shape.length && value.every((entry, index) => matches(entry, shape[index]));
    if (!shape || typeof shape !== "object" || !value || typeof value !== "object" || Array.isArray(value)) return false;
    const keys = Object.keys(shape);
    return Object.keys(value).length === keys.length && keys.every(child => Object.hasOwn(value, child) && matches((value as Record<string, unknown>)[child], (shape as Record<string, unknown>)[child], child));
  };
  return matches(raw, expected) ? raw as NativeSnapshot : null;
}
