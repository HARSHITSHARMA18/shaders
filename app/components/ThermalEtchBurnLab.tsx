"use client";

import { useTransferDial, useBrandLabTransfer, useCaptureNativeSettings } from "./BrandLabTransfer";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { ShadersLogo } from "./ShadersLogo";
import {
  ThermalEtchBurn,
  type ThermalEtchColors,
  type ThermalEtchSettings,
} from "./ThermalEtchBurn";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";

type PaletteName = "chemical" | "ember" | "violet" | "monochrome";

const PALETTES: Record<PaletteName, ThermalEtchColors> = {
  chemical: {
    ink: "#10251A",
    paper: "#78935F",
    cool: "#23604B",
    warm: "#F2E85B",
    hot: "#FF654F",
    peak: "#A535FF",
  },
  ember: {
    ink: "#1B120D",
    paper: "#76624C",
    cool: "#79321F",
    warm: "#FFD15A",
    hot: "#FF532E",
    peak: "#FFF4C2",
  },
  violet: {
    ink: "#171225",
    paper: "#69607D",
    cool: "#40306E",
    warm: "#F0DA78",
    hot: "#EB596E",
    peak: "#B45CFF",
  },
  monochrome: {
    ink: "#111411",
    paper: "#9A9D94",
    cool: "#343934",
    warm: "#D6D7CC",
    hot: "#F1F0E7",
    peak: "#FFFFFF",
  },
};

const DIAL_CONFIG = {
  burn: {
    progress: [0.12, 0, 1, 0.01],
    edgeWidth: [0.075, 0.015, 0.2, 0.005],
    heat: [1.05, 0.3, 1.8, 0.05],
    turbulence: [0.62, 0, 1.4, 0.05],
  },
  texture: {
    grain: [0.58, 0, 1, 0.02],
    contrast: [1.18, 0.5, 2, 0.05],
    detail: [0.82, 0, 1.5, 0.05],
  },
  motion: {
    speed: [0.42, 0, 1.4, 0.02],
    animate: true,
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "chemical", label: "Chemical print" },
        { value: "ember", label: "Ember" },
        { value: "violet", label: "Violet flare" },
        { value: "monochrome", label: "Monochrome" },
      ],
      default: "chemical",
    },
    ink: { type: "color", default: PALETTES.chemical.ink },
    paper: { type: "color", default: PALETTES.chemical.paper },
    cool: { type: "color", default: PALETTES.chemical.cool },
    warm: { type: "color", default: PALETTES.chemical.warm },
    hot: { type: "color", default: PALETTES.chemical.hot },
    peak: { type: "color", default: PALETTES.chemical.peak },
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

export function ThermalEtchBurnLab() {
  const transfer = useBrandLabTransfer();
  const [mediaUrl, setMediaUrl] = useState(transfer?.brand.media);
  const [mediaError, setMediaError] = useState("");
  const mediaGeneration = useRef(0);
  useEffect(() => () => { mediaGeneration.current++; }, []);
  useEffect(() => () => { if (mediaUrl?.startsWith("blob:")) URL.revokeObjectURL(mediaUrl); }, [mediaUrl]);
  const dial = useTransferDial("Thermal etch burn", DIAL_CONFIG, {
    id: "solace-thermal-etch-burn",
    persist: true,
  });
  const selectedPreset = dial.values.color.preset as PaletteName;
  const previousPreset = useRef(selectedPreset);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => CANONICAL_ORIGIN,
  );

  useEffect(() => {
    if (previousPreset.current === selectedPreset) return;
    previousPreset.current = selectedPreset;
    dial.setValues({ color: { ...PALETTES[selectedPreset] } });
  }, [dial, selectedPreset]);

  const settings = useMemo<ThermalEtchSettings>(
    () => ({
      progress: dial.values.burn.progress,
      edgeWidth: dial.values.burn.edgeWidth,
      heat: dial.values.burn.heat,
      turbulence: dial.values.burn.turbulence,
      grain: dial.values.texture.grain,
      contrast: dial.values.texture.contrast,
      detail: dial.values.texture.detail,
      speed: dial.values.motion.animate ? dial.values.motion.speed : 0,
      colors: {
        ink: dial.values.color.ink,
        paper: dial.values.color.paper,
        cool: dial.values.color.cool,
        warm: dial.values.color.warm,
        hot: dial.values.color.hot,
        peak: dial.values.color.peak,
      },
    }),
    [dial.values],
  );

  useCaptureNativeSettings(settings);
  const registryUrl = `${origin}/r/thermal-etch-burn.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;
  const mediaProp = mediaUrl ? '\n    src="/your-image.jpg"' : "";
  const snippet = `import { ThermalEtchBurn } from "@/components/thermal-etch-burn";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <ThermalEtchBurn${mediaProp}
    progress={${settings.progress.toFixed(2)}}
    speed={${settings.speed.toFixed(2)}}
    edgeWidth={${settings.edgeWidth.toFixed(3)}}
    heat={${settings.heat.toFixed(2)}}
    turbulence={${settings.turbulence.toFixed(2)}}
    grain={${settings.grain.toFixed(2)}}
    contrast={${settings.contrast.toFixed(2)}}
    detail={${settings.detail.toFixed(2)}}
    colors={{
      ink: "${settings.colors.ink}",
      paper: "${settings.colors.paper}",
      cool: "${settings.colors.cool}",
      warm: "${settings.colors.warm}",
      hot: "${settings.colors.hot}",
      peak: "${settings.colors.peak}",
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
      </header>

      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading">
            <div>
              <Link className="backLink" href="/">← All shaders</Link>
              <div className="eyebrow">Experiment 008 / Procedural field</div>
              <h1>Thermal etch burn</h1>
            </div>
            <p>
              A grain-heavy thermal front moving through generated topographic
              linework, woven fibers, and reactive heat.
            </p>
          </div>

          {transfer && <input aria-label="Replace campaign image" type="file" accept="image/*" hidden onChange={async event => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (!file) return;
            if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) { setMediaError("Choose an image under 12 MB."); return; }
            const generation = ++mediaGeneration.current;
            const url = URL.createObjectURL(file);
            const image = new Image(); image.src = url;
            try {
              await image.decode();
              if (generation !== mediaGeneration.current) { URL.revokeObjectURL(url); return; }
              setMediaUrl(url); setMediaError("");
            } catch { URL.revokeObjectURL(url); if (generation === mediaGeneration.current) setMediaError("This image could not be opened. Your previous image stays in place."); }
          }} />}
          {mediaError && <p role="status">{mediaError}</p>}
          <div className="stage fieldStage etchStage">
            <ThermalEtchBurn
              className="shaderCanvas"
              src={mediaUrl}
              settings={settings}
            />
            <div className="stageTop" aria-hidden="true">
              <span>{mediaUrl ? "Brand Lab campaign" : "Procedural print"}</span>
              <span>WebGL 2</span>
            </div>
            <div className="stageBottom">
              <span>Move through the print to concentrate heat</span>
              <span className="stageHint">Tune the material in DialKit</span>
            </div>
          </div>
        </section>

        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>Installs the standalone procedural shader into your components directory.</p>
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

      <aside className="inspector" aria-label="Thermal etch burn fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={dial.resetValues} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          <PaletteEditor
            stops={[
              { key: "ink", label: "Ink", value: dial.values.color.ink },
              { key: "paper", label: "Paper", value: dial.values.color.paper },
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
