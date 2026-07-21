"use client";

import { useMemo, useState } from "react";
import {
  PaletteName,
  ThermalPixelSettings,
  ThermalPixelShader,
} from "./ThermalPixelShader";

const DEFAULT_SETTINGS: ThermalPixelSettings = {
  cellSize: 10,
  brushRadius: 82,
  heat: 1.05,
  decay: 0.925,
  noise: 0.46,
  speed: 0.68,
  palette: "wild",
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
  return (
    <label className="rangeControl">
      <span className="controlHeader">
        <span>{label}</span>
        <output>{display}</output>
      </span>
      <input
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
  const [resetKey, setResetKey] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () => `import { ThermalPixelShader } from "@/components/ThermalPixelShader";

<ThermalPixelShader
  cellSize={${settings.cellSize}}
  brushRadius={${settings.brushRadius}}
  heat={${settings.heat.toFixed(2)}}
  decay={${settings.decay.toFixed(3)}}
  noise={${settings.noise.toFixed(2)}}
  speed={${settings.speed.toFixed(2)}}
  palette="${settings.palette}"
/>`,
    [settings],
  );

  const setNumber = (setting: NumberSetting, value: number) => {
    setSettings((current) => ({ ...current, [setting]: value }));
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    setResetKey((current) => current + 1);
  };

  const copyCode = async () => {
    await writeClipboard(snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="labShell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Solace Shaders home">
          <span className="brandMark" aria-hidden="true" />
          <span>Solace</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Shaders</span>
        </a>
        <div className="topMeta">
          <span>Catalog 001</span>
          <span className="liveStatus"><i /> WebGL live</span>
        </div>
      </header>

      <aside className="catalog" aria-label="Shader catalog">
        <div className="catalogLabel">Experiments</div>
        <nav>
          <a className="catalogItem active" href="#thermal-pixel">
            <span>01</span>
            <strong>Thermal pixel ink</strong>
          </a>
          <div className="catalogItem unavailable" aria-disabled="true">
            <span>02</span>
            <strong>Viscous cursor dye</strong>
          </div>
          <div className="catalogItem unavailable" aria-disabled="true">
            <span>03</span>
            <strong>Reaction bloom</strong>
          </div>
          <div className="catalogItem unavailable" aria-disabled="true">
            <span>04</span>
            <strong>Magnetic pixels</strong>
          </div>
        </nav>
        <p className="catalogNote">A growing collection of interactive materials for Solace UI.</p>
      </aside>

      <main className="workspace" id="top">
        <section className="experiment" id="thermal-pixel">
          <div className="experimentHeading">
            <div>
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
              settings={settings}
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

      <aside className="inspector" aria-label="Shader controls">
        <div className="inspectorHeader">
          <div>
            <span className="eyebrow">Dialkit</span>
            <h2>Field settings</h2>
          </div>
          <button className="iconButton" type="button" onClick={reset} aria-label="Reset settings">
            Reset
          </button>
        </div>

        <div className="controls">
          <RangeControl label="Cell size" setting="cellSize" value={settings.cellSize} min={6} max={18} step={1} display={`${settings.cellSize}px`} onChange={setNumber} />
          <RangeControl label="Brush radius" setting="brushRadius" value={settings.brushRadius} min={36} max={150} step={2} display={`${settings.brushRadius}px`} onChange={setNumber} />
          <RangeControl label="Heat" setting="heat" value={settings.heat} min={0.3} max={1.8} step={0.05} display={settings.heat.toFixed(2)} onChange={setNumber} />
          <RangeControl label="Decay" setting="decay" value={settings.decay} min={0.82} max={0.985} step={0.005} display={settings.decay.toFixed(3)} onChange={setNumber} />
          <RangeControl label="Noise" setting="noise" value={settings.noise} min={0} max={1} step={0.02} display={settings.noise.toFixed(2)} onChange={setNumber} />
          <RangeControl label="Field speed" setting="speed" value={settings.speed} min={0} max={1.5} step={0.05} display={`${settings.speed.toFixed(2)}x`} onChange={setNumber} />

          <label className="selectControl">
            <span className="controlHeader"><span>Palette</span><output>{settings.palette}</output></span>
            <select
              value={settings.palette}
              onChange={(event) => setSettings((current) => ({ ...current, palette: event.target.value as PaletteName }))}
            >
              <option value="wild">Wild signal</option>
              <option value="ember">Ember</option>
              <option value="mono">Monochrome</option>
            </select>
          </label>

          <div className={`paletteStrip ${settings.palette}`} aria-label={`${settings.palette} palette preview`}>
            <i /><i /><i /><i /><i /><i />
          </div>
        </div>

        <div className="inspectorActions">
          <button className="secondaryButton" type="button" onClick={() => setCodeOpen((current) => !current)}>
            {codeOpen ? "Hide code" : "View code"}
          </button>
          <button className="primaryButton" type="button" onClick={copyCode}>
            {copied ? "Copied" : "Copy JSX"}
          </button>
        </div>
      </aside>

      <footer className="codebar">
        <div>
          <span className="codePrompt">import</span>
          <code>ThermalPixelShader from your Solace block</code>
        </div>
        <button type="button" onClick={copyCode}>{copied ? "Copied to clipboard" : "Copy JSX"}</button>
      </footer>
    </div>
  );
}
