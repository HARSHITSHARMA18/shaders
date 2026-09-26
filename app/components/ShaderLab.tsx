"use client";

import { BrandLabHeaderControl, useTransferDial, useCaptureNativeSettings } from "./BrandLabTransfer";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DialRoot, type DialConfig } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { ShadersLogo } from "./ShadersLogo";
import { Tooltip } from "./Tooltip";
import {
  PaletteName,
  THERMAL_PALETTES,
  ThermalPixelSettings,
  ThermalPixelShader,
} from "./ThermalPixelShader";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";

const DIAL_CONFIG = {
  geometry: {
    cellSize: [10, 6, 18, 1] as [number, number, number, number],
    gridGap: [0.085, 0, 0.24, 0.005] as [number, number, number, number],
  },
  brush: {
    radius: [82, 36, 150, 2] as [number, number, number, number],
    heat: [1.05, 0.3, 1.8, 0.05] as [number, number, number, number],
    pressBoost: [1.55, 1, 2.5, 0.05] as [number, number, number, number],
  },
  field: {
    decay: [0.925, 0.82, 0.985, 0.005] as [number, number, number, number],
    ambient: [0.42, 0, 0.8, 0.02] as [number, number, number, number],
    noise: [0.46, 0, 1, 0.02] as [number, number, number, number],
    speed: [0.68, 0, 1.5, 0.05] as [number, number, number, number],
    motion: true,
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "wild", label: "Wild signal" },
        { value: "ember", label: "Ember" },
        { value: "ultraviolet", label: "Ultraviolet" },
        { value: "lagoon", label: "Lagoon" },
        { value: "mono", label: "Monochrome" },
      ],
      default: "wild",
    },
    background: { type: "color", default: THERMAL_PALETTES.wild.background },
    shadow: { type: "color", default: THERMAL_PALETTES.wild.shadow },
    cool: { type: "color", default: THERMAL_PALETTES.wild.cool },
    warm: { type: "color", default: THERMAL_PALETTES.wild.warm },
    hot: { type: "color", default: THERMAL_PALETTES.wild.hot },
    peak: { type: "color", default: THERMAL_PALETTES.wild.peak },
    bandShift: [0, -0.15, 0.15, 0.01] as [number, number, number, number],
  },
} satisfies DialConfig;

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
  const dial = useTransferDial("Thermal Pixel Ink", DIAL_CONFIG, {
    id: "solace-thermal-pixel-ink",
    persist: true,
  });
  const selectedPreset = dial.values.color.preset as PaletteName;
  const previousPreset = useRef(selectedPreset);
  useEffect(() => {
    if (previousPreset.current === selectedPreset) return;
    previousPreset.current = selectedPreset;
    dial.setValues({ color: { ...THERMAL_PALETTES[selectedPreset] } });
  }, [dial, selectedPreset]);
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => CANONICAL_ORIGIN,
  );
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);

  const settings = useMemo<ThermalPixelSettings>(
    () => ({
      cellSize: dial.values.geometry.cellSize,
      brushRadius: dial.values.brush.radius,
      heat: dial.values.brush.heat,
      pressBoost: dial.values.brush.pressBoost,
      decay: dial.values.field.decay,
      noise: dial.values.field.noise,
      speed: dial.values.field.motion ? dial.values.field.speed : 0,
      ambient: dial.values.field.ambient,
      gap: dial.values.geometry.gridGap,
      bandShift: dial.values.color.bandShift,
      palette: selectedPreset,
      colors: {
        background: dial.values.color.background,
        shadow: dial.values.color.shadow,
        cool: dial.values.color.cool,
        warm: dial.values.color.warm,
        hot: dial.values.color.hot,
        peak: dial.values.color.peak,
      },
    }),
    [dial.values, selectedPreset],
  );

  useCaptureNativeSettings(settings);
  const registryUrl = `${origin}/r/thermal-pixel-ink.json`;
  const registryCommand = origin
    ? `npx shadcn@latest add ${registryUrl}`
    : "npx shadcn@latest add /r/thermal-pixel-ink.json";
  const snippet = `import { ThermalPixelShader } from "@/components/thermal-pixel-shader";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
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
    colors={{
      background: "${settings.colors?.background}",
      shadow: "${settings.colors?.shadow}",
      cool: "${settings.colors?.cool}",
      warm: "${settings.colors?.warm}",
      hot: "${settings.colors?.hot}",
      peak: "${settings.colors?.peak}",
    }}
    className="h-full w-full"
  />
</div>`;

  const copy = async (kind: "install" | "jsx", value: string) => {
    await writeClipboard(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="labShell detailShell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Back to Shaders by Solace catalog">
          <ShadersLogo className="solaceLogo" />
          <span>Shaders</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Solace</span>
        </Link>
        <BrandLabHeaderControl />
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
            <ThermalPixelShader className="shaderCanvas" settings={settings} />
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

        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>
              Installs the shader source into your components directory. No runtime
              package or Solace dependency is added.
            </p>
          </div>
          <div className="installCommand">
            <code>{registryCommand}</code>
            <Tooltip content={copied === "install" ? "Copied" : "Copy command"}>
              <button
                className={`iconActionButton${copied === "install" ? " isCopied" : ""}`}
                type="button"
                aria-label={copied === "install" ? "Command copied" : "Copy command"}
                onClick={() => copy("install", registryCommand)}
              >
                <CopyActionIcon confirmed={copied === "install"} />
              </button>
            </Tooltip>
          </div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}>
            <button
              className="usageToggle iconActionButton"
              type="button"
              aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"}
              aria-expanded={codeOpen}
              aria-controls="configured-jsx"
              onClick={() => setCodeOpen((open) => !open)}
            >
              <CodeActionIcon />
            </button>
          </Tooltip>
        </section>

        {codeOpen ? (
          <section className="codePanel" id="configured-jsx" aria-label="Configured component snippet">
            <div className="codePanelHeader">
              <div>
                <span className="eyebrow">Current DialKit values</span>
                <h2>Ready-to-paste usage</h2>
              </div>
              <Tooltip content={copied === "jsx" ? "Copied" : "Copy JSX"}>
                <button
                  className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`}
                  type="button"
                  aria-label={copied === "jsx" ? "JSX copied" : "Copy JSX"}
                  onClick={() => copy("jsx", snippet)}
                >
                  <CopyActionIcon confirmed={copied === "jsx"} />
                </button>
              </Tooltip>
            </div>
            <HighlightedCode code={snippet} />
          </section>
        ) : null}
      </main>

      <aside className="inspector" aria-label="Thermal pixel fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={dial.resetValues} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          <PaletteEditor
            stops={[
              { key: "background", label: "Background", value: dial.values.color.background },
              { key: "shadow", label: "Shadow", value: dial.values.color.shadow },
              { key: "cool", label: "Cool", value: dial.values.color.cool },
              { key: "warm", label: "Warm", value: dial.values.color.warm },
              { key: "hot", label: "Hot", value: dial.values.color.hot },
              { key: "peak", label: "Peak", value: dial.values.color.peak },
            ]}
            onChange={(key, value) => dial.setValue(`color.${key}`, value)}
          />
        </div>
      </aside>
    </div>
  );
}
