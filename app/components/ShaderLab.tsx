"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DialRoot, useDialKitController, type DialConfig } from "dialkit";
import {
  PaletteName,
  ThermalPixelSettings,
  ThermalPixelShader,
} from "./ThermalPixelShader";

const DEPLOYED_ORIGIN = "https://solace-shaders-lab.swetasharma02.chatgpt.site";

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
    palette: {
      type: "select",
      options: [
        { value: "wild", label: "Wild signal" },
        { value: "ember", label: "Ember" },
        { value: "mono", label: "Monochrome" },
      ],
      default: "wild",
    },
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
  const dial = useDialKitController("Thermal Pixel Ink", DIAL_CONFIG, {
    id: "solace-thermal-pixel-ink",
    persist: true,
  });
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => DEPLOYED_ORIGIN,
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
      palette: dial.values.color.palette as PaletteName,
    }),
    [dial.values],
  );

  const registryCommand = `npx shadcn@latest add ${origin}/r/thermal-pixel-ink.json`;
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
    palette="${settings.palette}"
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
            <button type="button" onClick={() => copy("install", registryCommand)}>
              {copied === "install" ? "Copied" : "Copy command"}
            </button>
          </div>
          <button className="usageToggle" type="button" onClick={() => setCodeOpen((open) => !open)}>
            {codeOpen ? "Hide configured JSX" : "View configured JSX"}
          </button>
        </section>

        {codeOpen ? (
          <section className="codePanel" aria-label="Configured component snippet">
            <div className="codePanelHeader">
              <div>
                <span className="eyebrow">Current DialKit values</span>
                <h2>Ready-to-paste usage</h2>
              </div>
              <button className="quietButton" type="button" onClick={() => copy("jsx", snippet)}>
                {copied === "jsx" ? "Copied" : "Copy JSX"}
              </button>
            </div>
            <pre><code>{snippet}</code></pre>
          </section>
        ) : null}
      </main>

      <aside className="inspector" aria-label="Thermal pixel fine-tuning controls">
        <div className="dialkitFrame">
          <DialRoot mode="inline" theme="dark" productionEnabled />
        </div>
        <p className="dialkitCredit">
          Controls powered by <a href="https://joshpuckett.me/dialkit" target="_blank" rel="noreferrer">DialKit</a>.
          Values and presets persist in this browser.
        </p>
      </aside>
    </div>
  );
}
