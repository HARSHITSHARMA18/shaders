"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useDialKitController, type DialConfig, type UseDialOptions } from "dialkit";
import { nativeKind, nativeSettings } from "../brand-lab/native-settings";
import { createSetup, DEFAULT_TREATMENTS, setupQuery, type BrandLabSetup } from "../brand-lab/setup";
import { editorTuning } from "../brand-lab/editor-transfer";
import type { NativeSnapshot } from "../brand-lab/native-snapshot";
import { DEFAULT_BRAND } from "../brand-lab/model";
import "./brand-lab-transfer.css";
import { sceneLabel, usesBrandMedia } from "../brand-lab/model";

const TransferContext = createContext<BrandLabSetup | null>(null);
const EditorValuesContext = createContext<((values: Record<string, unknown>) => void) | null>(null);
const NativeSettingsContext = createContext<((settings: NativeSnapshot) => void) | null>(null);
export function useBrandLabTransfer() { return useContext(TransferContext); }
export function useCaptureNativeSettings(settings: NativeSnapshot) {
  const register = useContext(NativeSettingsContext);
  useEffect(() => { register?.(settings); }, [register, settings]);
}

export function BrandLabTransfer({ setup, children }: { setup: BrandLabSetup | null; children: ReactNode }) {
  const pathname = usePathname();
  const id = setup?.shaderId ?? pathname?.split("/").filter(Boolean).at(-1) ?? null;
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [native, setNative] = useState<NativeSnapshot | null>(null);
  const register = useCallback((next: Record<string, unknown>) => setValues(current => JSON.stringify(current) === JSON.stringify(next) ? current : next), []);
  const registerNative = useCallback((next: NativeSnapshot) => setNative(current => JSON.stringify(current) === JSON.stringify(next) ? current : next), []);
  const returnSetup = id ? createSetup(setup?.brand ?? DEFAULT_BRAND, id, setup?.palette ?? "Original", setup?.treatments ?? DEFAULT_TREATMENTS, values ? editorTuning(id, values) : setup?.tuning ?? {}, setup?.scene ?? "campaign", setup?.copy ?? {}, native ?? setup?.editorNative) : null;
  return <EditorValuesContext.Provider value={register}><NativeSettingsContext.Provider value={registerNative}><TransferContext.Provider value={setup}>
    {setup && <div className="brandLabTransferNotice" role="status">
      <span>From Brand Lab · temporary editor session. Your saved settings stay intact. Your selected preset and settings return with you.
        {setup.missing.includes("media") && " Uploaded campaign media is excluded from this setup link. Replace it here if needed."}
      </span>
      {usesBrandMedia(setup.shaderId, setup.brand.mediaType) && <button type="button" onClick={() => document.querySelector<HTMLInputElement>(".experiment input[type=file]")?.click()}>{setup.missing.includes("media") ? "Replace media" : "Change media"}</button>}
      <a href={`/brand-lab?${setupQuery(returnSetup ?? setup)}`}>Use preset in {sceneLabel(setup.scene)} ↗</a>
    </div>}
    {!setup && returnSetup && <div className="brandLabTransferNotice brandLabTransferEntry"><span>See this shader in a designed context. Its selected preset and settings come with you.</span><a href={`/brand-lab?${setupQuery(returnSetup)}`}>Use in Brand Lab ↗</a></div>}
    {children}
  </TransferContext.Provider></NativeSettingsContext.Provider></EditorValuesContext.Provider>;
}

function transferValues(setup: BrandLabSetup): Record<string, unknown> {
  const id = setup.shaderId!;
  const all = nativeSettings(setup.brand, setup.palette, id, setup.tuning);
  const kind = nativeKind(id);
  if (kind && setup.native) (all as unknown as Record<string, unknown>)[kind] = setup.native;
  switch (nativeKind(id)) {
    case "field": { const s = all.field; return { material: s, motion: { speed: s.speed, animate: true }, color: { preset: s.palette, ...s.colors } }; }
    case "thermal": { const s = all.thermal; return { geometry: { cellSize: s.cellSize, gridGap: s.gap }, brush: { radius: s.brushRadius, heat: s.heat, pressBoost: s.pressBoost }, field: { ...s, motion: true }, color: { preset: s.palette, bandShift: s.bandShift, ...s.colors } }; }
    case "etch": { const s = all.etch; return { burn: s, texture: s, motion: { speed: s.speed, animate: true }, color: { ...s.colors } }; }
    case "particle": { const s = all.particle; return { target: { preset: s.preset, text: s.text }, particles: { count: s.particleCount, ...s }, motion: s, color: { preset: s.palette, ...s.colors } }; }
    case "lens": { const s = all.lens; return { lens: s, optics: s, color: { preset: "spectral", tint: s.glassTint, tintStrength: s.tintStrength } }; }
    case "exposure": { const s = all.exposure; return { grid: s, sampling: s, color: { preset: "editorial", ...s.colors } }; }
    case "fluid": { const s = all.fluid; return { source: { composition: s.composition }, motion: s, fluid: s, color: { preset: s.palette, ...s.colors } }; }
    case "blackhole": { const s = all.blackhole; return { portal: { mode: s.mode }, physics: s, color: { preset: s.palette, ...s.colors } }; }
    case "specimen": { const s = all.specimen; return { composition: s, geometry: { system: s.geometry, amount: s.geometryAmount, density: s.geometryDensity, scale: s.geometryScale, pointer: s.pointerGeometry }, sampling: s, framing: s, color: s.colors }; }
    default: return {};
  }
}

// Populate configuration defaults before DialKit registers the temporary panel.
// This avoids racing palette-change effects or writing into the normal panel.
function withDefaults(config: DialConfig, updates: Record<string, unknown>): DialConfig {
  return Object.fromEntries(Object.entries(config).map(([key, control]) => {
    const value = updates[key];
    if (value === undefined) return [key, control];
    if (Array.isArray(control) && typeof value === "number") return [key, [value, Math.min(control[1], value), Math.max(control[2], value), ...control.slice(3)]];
    if (typeof control === "object" && control !== null && !Array.isArray(control)) {
      if ("type" in control) return [key, control.type === "action" ? control : { ...control, default: value }];
      return [key, withDefaults(control as DialConfig, value as Record<string, unknown>)];
    }
    return [key, value];
  })) as DialConfig;
}

export function useTransferDial<T extends DialConfig>(name: string, config: T, options: UseDialOptions) {
  const setup = useBrandLabTransfer();
  const register = useContext(EditorValuesContext);
  const initialConfig = useMemo(() => setup ? withDefaults(config, transferValues(setup)) as T : config, [config, setup]);
  const dial = useDialKitController(name, initialConfig, setup ? { ...options, id: `${options.id}-brand-lab`, persist: false } : options);
  useEffect(() => { register?.(dial.values as Record<string, unknown>); }, [register, dial.values]);
  return dial;
}
