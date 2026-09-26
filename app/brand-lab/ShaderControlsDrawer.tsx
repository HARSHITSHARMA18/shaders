"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Slider } from "dialkit";
import { PaletteEditor } from "../components/PaletteEditor";
import { nativeKind, nativeSettings } from "./native-settings";
import { shaderControls, clampControl, type ShaderTuning } from "./shader-controls";
import { setupQuery, type BrandLabSetup } from "./setup";
import { sceneLabel, supportsBrandPalette, type Brand, type ShaderEntry } from "./model";

export function ShaderControlsDrawer({ shader, brand, palette, tuning, setup, onChange, onPalette, onColor, onReset, onClose }: {
  shader: ShaderEntry; brand: Brand; palette: "Original" | "Brand"; tuning: ShaderTuning; setup: BrandLabSetup;
  onChange: (key: string, value: number) => void; onPalette: (value: "Original" | "Brand") => void;
  onColor: (key: string, value: string) => void; onReset: () => void; onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);
  const supported = supportsBrandPalette(shader.id);
  const settings = setup.native ?? nativeSettings(brand, palette, shader.id, tuning)[nativeKind(shader.id)!];
  const controls = shaderControls(shader.id);
  return <aside id="bl-shader-controls" className="bl-tune-drawer" aria-labelledby="bl-tune-heading" onKeyDown={event => {
    if (event.key === "Escape" && !(event.target as HTMLElement).closest(".paletteEditorMeta")) { event.preventDefault(); event.stopPropagation(); onClose(); }
  }}>
    <div className="bl-tune-top"><span className="bl-kicker">TUNE THE MATERIAL</span><button type="button" aria-label="Close shader controls" onClick={onClose}><svg viewBox="0 0 20 20" aria-hidden="true" width="13" height="13"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></div>
    <h2 id="bl-tune-heading" ref={headingRef} tabIndex={-1}>{shader.title}</h2>
    <p className="bl-tune-intro">{setup.editorNative ? "Imported editor preset. Adjust it here, or choose a Brand Lab palette." : "Small adjustments. A different expression."}</p>
    <div className="bl-tune-dials dialkit-root" data-theme="dark" data-mode="inline">
      {controls.map(control => {
        const value = Number((settings as unknown as Record<string, unknown>)[control.key]);
        const change = (next: number) => { if (Number.isFinite(next)) onChange(control.key, clampControl(control, next)); };
        return <div key={shader.id + control.key} className="bl-tune-slider" data-control={control.key} role="slider" tabIndex={0} aria-label={control.label} aria-valuemin={control.min} aria-valuemax={control.max} aria-valuenow={value} onKeyDown={event => {
          if (event.target !== event.currentTarget) return;
          const delta = control.step * (event.shiftKey ? 10 : 1);
          const next = event.key === "Home" ? control.min : event.key === "End" ? control.max : ["ArrowRight", "ArrowUp"].includes(event.key) ? value + delta : ["ArrowLeft", "ArrowDown"].includes(event.key) ? value - delta : undefined;
          if (next !== undefined) { event.preventDefault(); change(next); }
        }}>
          <Slider label={control.label} value={value} min={control.min} max={control.max} step={control.step} onChange={change} />
        </div>;
      })}
    </div>
    {supported ? <div className="bl-tune-palette">
      <span className="bl-kicker">MATERIAL PALETTE</span>
      <div className="bl-tune-palette-choice" role="group" aria-label="Material palette">{setup.editorNative && <button type="button" aria-pressed="true" disabled>Editor preset</button>}{(["Original", "Brand"] as const).map(value => <button key={value} type="button" aria-pressed={!setup.editorNative && palette === value} onClick={() => onPalette(value)}>{value}</button>)}</div>
      {palette === "Brand" && !setup.editorNative ? <details className="bl-tune-colors"><summary><span>Brand colors</span><span className="bl-tune-swatches" aria-hidden="true"><i style={{ background: brand.primary }} /><i style={{ background: brand.secondary }} />+</span></summary><PaletteEditor title="Brand colors" summary="Primary / Secondary" ariaLabel="Shader brand color editor" stops={[{ key: "primary", label: "Primary", value: brand.primary }, { key: "secondary", label: "Secondary", value: brand.secondary }]} onChange={onColor} /></details> : <p className="bl-tune-note">{setup.editorNative ? "Colors and composition follow the selected editor preset." : "The shader keeps its original material colors."}</p>}
    </div> : <p className="bl-tune-note">This lens keeps its native optical tint.</p>}
    <div className="bl-tune-footer"><button type="button" onClick={onReset}>Reset shader settings ↺</button><Link href={"/shaders/" + shader.id + "?" + setupQuery(setup)}>Explore full editor ↗</Link></div>
    <p className="bl-tune-note">These settings apply across {sceneLabel(setup.scene)}. Select an asset to adjust its placement and strength.</p>
  </aside>;
}
