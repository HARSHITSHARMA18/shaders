"use client";

import { CSSProperties, useMemo, useState } from "react";
import Link from "next/link";
import {
  PaletteName,
  ThermalPixelSettings,
  ThermalPixelShader,
} from "./ThermalPixelShader";

const DEFAULT_SETTINGS: ThermalPixelSettings = {
  cellSize: 10,
  brushRadius: 82,
  heat: 1.05,
  pressBoost: 1.55,
  decay: 0.925,
  noise: 0.46,
  speed: 0.68,
  ambient: 0.42,
  gap: 0.085,
  bandShift: 0,
  palette: "wild",
};

const PRESETS: Record<string, ThermalPixelSettings> = {
  Default: DEFAULT_SETTINGS,
  Sharp: { ...DEFAULT_SETTINGS, cellSize: 8, brushRadius: 58, heat: 1.35, decay: 0.89, gap: 0.12 },
  Soft: { ...DEFAULT_SETTINGS, cellSize: 13, brushRadius: 118, heat: 0.72, decay: 0.965, noise: 0.2, ambient: 0.3 },
  Ember: { ...DEFAULT_SETTINGS, brushRadius: 96, heat: 1.28, decay: 0.95, noise: 0.62, palette: "ember" },
};

type NumberSetting = Exclude<keyof ThermalPixelSettings, "palette">;

type RangeControlProps = {
  label: string;
  setting: NumberSetting;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (setting: NumberSetting, value: number) => void;
};

function RangeControl(props: RangeControlProps) {
  const { label, setting, value, min, max, step, display, onChange } = props;
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <label className="dialRow dialRange" style={{ "--fill": fill } as CSSProperties}>
      <span>{label}</span>
      <output>{display}</output>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(setting, Number(event.target.value))}
      />
    </label>
  );
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function ShaderLab() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [preset, setPreset] = useState("Default");
  const [motion, setMotion] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const liveSettings = useMemo(
    () => ({ ...settings, speed: motion ? settings.speed : 0 }),
    [settings, motion],
  );

  const snippet = useMemo(
    () => `import { ThermalPixelShader } from "@/components/ThermalPixelShader";

<ThermalPixelShader
  cellSize={${settings.cellSize}}
  brushRadius={${settings.brushRadius}}
  heat={${settings.heat.toFixed(2)}}
  pressBoost={${settings.pressBoost.toFixed(2)}}
  decay={${settings.decay.toFixed(3)}}
  noise={${settings.noise.toFixed(2)}}
  speed={${settings.speed.toFixed(2)}}
  ambient={${settings.ambient.toFixed(2)}}
  gap={${settings.gap.toFixed(3)}}
  bandShift={${settings.bandShift.toFixed(2)}}
  palette="${settings.palette}"
/>`,
    [settings],
  );

  const setNumber = (setting: NumberSetting, value: number) => {
    setPreset("Custom");
    setSettings((current) => ({ ...current, [setting]: value }));
  };

  const choosePreset = (name: string) => {
    setPreset(name);
    if (PRESETS[name]) {
      setSettings(PRESETS[name]);
      setResetKey((current) => current + 1);
    }
  };

  const reset = () => choosePreset("Default");

  const copyCode = async () => {
    await writeClipboard(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="labShell detailShell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Back to Solace Shaders catalog">
          <span className="brandMark" aria-hidden="true" />
          <span>Solace</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Shaders</span>
        </Link>
        <div className="topMeta">
          <Link href="/">Catalog</Link>
          <span className="liveStatus"><i /> WebGL live</span>
        </div>
      </header>

      <main className="workspace detailWorkspace" id="top">
        <section className="experiment" id="thermal-pixel">
          <div className="experimentHeading">
            <div>
              <Link className="backLink" href="/">← All shaders</Link>
              <div className="eyebrow">Experiment 001 / Interactive field</div>
              <h1>Thermal pixel ink</h1>
            </div>
            <p>
              A persistent heat field with a quantized palette. Move to paint;
              hold to push the field into its hottest band.
            </p>
          </div>

          <div className="stage">
            <ThermalPixelShader
              className="shaderCanvas"
              settings={liveSettings}
              resetKey={resetKey}
            />
            <div className="stageTop" aria-hidden="true">
              <span>Pointer field</span>
              <span>{Math.round(100 / settings.cellSize)} px density</span>
            </div>
            <div className="stageBottom">
              <span>Move anywhere to inject heat</span>
              <span className="stageHint">Press + hold for intensity</span>
            </div>
          </div>
        </section>

        {codeOpen ? (
          <section className="codePanel" aria-label="Component snippet">
            <div className="codePanelHeader">
              <div>
                <span className="eyebrow">Solace UI block</span>
                <h2>Current configuration</h2>
              </div>
              <button className="quietButton" type="button" onClick={() => setCodeOpen(false)}>
                Close
              </button>
            </div>
            <pre><code>{snippet}</code></pre>
          </section>
        ) : null}
      </main>

      <aside className="inspector" aria-label="Thermal pixel fine-tuning controls">
        <div className="dialPanel">
          <div className="dialHeader">
            <div>
              <span className="dialKicker">Shader controls</span>
              <h2>Thermal Pixel</h2>
            </div>
            <button className="dialIconButton" type="button" onClick={reset} aria-label="Reset all controls">↺</button>
          </div>

          <div className="dialToolbar">
            <select value={preset} onChange={(event) => choosePreset(event.target.value)} aria-label="Preset">
              {Object.keys(PRESETS).map((name) => <option value={name} key={name}>{name}</option>)}
              {preset === "Custom" ? <option value="Custom">Custom</option> : null}
            </select>
            <button type="button" onClick={copyCode}>{copied ? "Copied" : "Copy"}</button>
          </div>

          <div className="dialControls">
            <details open>
              <summary>Geometry</summary>
              <RangeControl label="Cell Size" setting="cellSize" value={settings.cellSize} min={6} max={18} step={1} display={`${settings.cellSize}px`} onChange={setNumber} />
              <RangeControl label="Grid Gap" setting="gap" value={settings.gap} min={0} max={0.24} step={0.005} display={settings.gap.toFixed(3)} onChange={setNumber} />
            </details>

            <details open>
              <summary>Brush</summary>
              <RangeControl label="Radius" setting="brushRadius" value={settings.brushRadius} min={36} max={150} step={2} display={`${settings.brushRadius}px`} onChange={setNumber} />
              <RangeControl label="Heat" setting="heat" value={settings.heat} min={0.3} max={1.8} step={0.05} display={settings.heat.toFixed(2)} onChange={setNumber} />
              <RangeControl label="Press Boost" setting="pressBoost" value={settings.pressBoost} min={1} max={2.5} step={0.05} display={`${settings.pressBoost.toFixed(2)}x`} onChange={setNumber} />
            </details>

            <details open>
              <summary>Field</summary>
              <RangeControl label="Decay" setting="decay" value={settings.decay} min={0.82} max={0.985} step={0.005} display={settings.decay.toFixed(3)} onChange={setNumber} />
              <RangeControl label="Ambient" setting="ambient" value={settings.ambient} min={0} max={0.8} step={0.02} display={settings.ambient.toFixed(2)} onChange={setNumber} />
              <RangeControl label="Noise" setting="noise" value={settings.noise} min={0} max={1} step={0.02} display={settings.noise.toFixed(2)} onChange={setNumber} />
              <RangeControl label="Speed" setting="speed" value={settings.speed} min={0} max={1.5} step={0.05} display={`${settings.speed.toFixed(2)}x`} onChange={setNumber} />
              <div className="dialRow dialSegmented">
                <span>Motion</span>
                <div role="group" aria-label="Field motion">
                  <button type="button" aria-pressed={!motion} onClick={() => setMotion(false)}>Off</button>
                  <button type="button" aria-pressed={motion} onClick={() => setMotion(true)}>On</button>
                </div>
              </div>
            </details>

            <details open>
              <summary>Color</summary>
              <label className="dialRow dialSelect">
                <span>Palette</span>
                <select
                  value={settings.palette}
                  onChange={(event) => {
                    setPreset("Custom");
                    setSettings((current) => ({ ...current, palette: event.target.value as PaletteName }));
                  }}
                >
                  <option value="wild">Wild signal</option>
                  <option value="ember">Ember</option>
                  <option value="mono">Monochrome</option>
                </select>
              </label>
              <RangeControl label="Band Shift" setting="bandShift" value={settings.bandShift} min={-0.15} max={0.15} step={0.01} display={settings.bandShift.toFixed(2)} onChange={setNumber} />
              <div className={`paletteStrip ${settings.palette}`} aria-label={`${settings.palette} palette preview`}>
                <i /><i /><i /><i /><i /><i />
              </div>
            </details>
          </div>

          <div className="dialActions">
            <button type="button" onClick={() => setCodeOpen((current) => !current)}>{codeOpen ? "Hide code" : "View code"}</button>
            <button className="dialPrimary" type="button" onClick={copyCode}>{copied ? "Copied" : "Copy JSX"}</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
