"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig, useDialKitController } from "dialkit";
import { ExposureGrid, type ExposureGridColors, type ExposureGridSettings } from "./ExposureGrid";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";
const DEFAULT_MEDIA_SOURCE = "/exposure-grid-mountain.jpg";
type PaletteName = "editorial" | "mineral" | "signal" | "monochrome";

const PALETTES: Record<PaletteName, ExposureGridColors> = {
  editorial: { grid: "#EAF1EC", accent: "#FF008B", secondary: "#2600FF", ink: "#17211B", paper: "#F0EAE4" },
  mineral: { grid: "#E7F0EF", accent: "#D9E5DF", secondary: "#5F7D86", ink: "#142D38", paper: "#EDF0E9" },
  signal: { grid: "#F2F0E9", accent: "#FF654A", secondary: "#3157F6", ink: "#171915", paper: "#F1EEE7" },
  monochrome: { grid: "#F4F4EE", accent: "#E8E8E0", secondary: "#777A74", ink: "#151713", paper: "#EEEDE8" },
};

const DIAL_CONFIG = {
  source: {
    choose: { type: "action", label: "Choose image or video" },
    clear: { type: "action", label: "Use built-in composition" },
  },
  grid: {
    columns: [4, 2, 12, 1],
    rows: [4, 2, 10, 1],
    lineWidth: [2.5, 0.25, 2.5, 0.05],
    lineOpacity: [0.4, 0, 1, 0.02],
  },
  sampling: {
    treatment: {
      type: "select",
      options: [
        { value: "chroma", label: "Chroma sample" },
        { value: "exposure", label: "Exposure shift" },
        { value: "monochrome", label: "Monochrome" },
      ],
      default: "chroma",
    },
    activity: [0.4, 0.04, 0.56, 0.02],
    tempo: [0.96, 0, 1.2, 0.02],
    intensity: [0.78, 0, 1, 0.02],
    zoom: [0.68, 0, 1, 0.02],
    grain: [0.68, 0, 1, 0.02],
    interaction: [0.82, 0, 1, 0.02],
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "editorial", label: "Editorial" },
        { value: "mineral", label: "Mineral" },
        { value: "signal", label: "Signal" },
        { value: "monochrome", label: "Monochrome" },
      ],
      default: "editorial",
    },
    grid: { type: "color", default: PALETTES.editorial.grid },
    accent: { type: "color", default: PALETTES.editorial.accent },
    secondary: { type: "color", default: PALETTES.editorial.secondary },
    ink: { type: "color", default: PALETTES.editorial.ink },
    paper: { type: "color", default: PALETTES.editorial.paper },
  },
} satisfies DialConfig;

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const field = document.createElement("textarea");
  field.value = text; field.style.position = "fixed"; field.style.opacity = "0";
  document.body.appendChild(field); field.select(); document.execCommand("copy"); field.remove();
}

export function ExposureGridLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState(DEFAULT_MEDIA_SOURCE);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaName, setMediaName] = useState("Himalayan field study");
  const dial = useDialKitController("Exposure grid", DIAL_CONFIG, {
    id: "solace-exposure-grid-v2",
    persist: true,
    onAction: (action) => {
      if (action === "source.choose") inputRef.current?.click();
      if (action === "source.clear") {
        setMediaUrl((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return DEFAULT_MEDIA_SOURCE; });
        setMediaType("image");
        setMediaName("Himalayan field study");
      }
    },
  });
  const selectedPreset = dial.values.color.preset as PaletteName;
  const previousPreset = useRef(selectedPreset);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => CANONICAL_ORIGIN);
  useEffect(() => {
    if (previousPreset.current === selectedPreset) return;
    previousPreset.current = selectedPreset;
    dial.setValues({ color: { ...PALETTES[selectedPreset] } });
  }, [dial, selectedPreset]);
  useEffect(() => () => { if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl); }, [mediaUrl]);

  const settings = useMemo<ExposureGridSettings>(() => ({
    treatment: dial.values.sampling.treatment as ExposureGridSettings["treatment"],
    columns: dial.values.grid.columns, rows: dial.values.grid.rows,
    lineWidth: dial.values.grid.lineWidth, lineOpacity: dial.values.grid.lineOpacity,
    activity: dial.values.sampling.activity, tempo: dial.values.sampling.tempo,
    intensity: dial.values.sampling.intensity, zoom: dial.values.sampling.zoom,
    grain: dial.values.sampling.grain, interaction: dial.values.sampling.interaction,
    colors: { grid: dial.values.color.grid, accent: dial.values.color.accent, secondary: dial.values.color.secondary, ink: dial.values.color.ink, paper: dial.values.color.paper },
  }), [dial.values]);

  const registryUrl = `${origin}/r/exposure-grid.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;
  const snippet = `import { ExposureGrid } from "@/components/exposure-grid";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <ExposureGrid
    src="/your-image.jpg"
    treatment="${settings.treatment}"
    columns={${Math.round(settings.columns)}}
    rows={${Math.round(settings.rows)}}
    lineWidth={${settings.lineWidth.toFixed(2)}}
    lineOpacity={${settings.lineOpacity.toFixed(2)}}
    activity={${settings.activity.toFixed(2)}}
    tempo={${settings.tempo.toFixed(2)}}
    intensity={${settings.intensity.toFixed(2)}}
    zoom={${settings.zoom.toFixed(2)}}
    grain={${settings.grain.toFixed(2)}}
    interaction={${settings.interaction.toFixed(2)}}
    colors={{
      grid: "${settings.colors.grid}",
      accent: "${settings.colors.accent}",
      secondary: "${settings.colors.secondary}",
      ink: "${settings.colors.ink}",
      paper: "${settings.colors.paper}",
    }}
    className="h-full w-full"
  />
</div>`;
  const copy = async (kind: "install" | "jsx", value: string) => { await writeClipboard(value); setCopied(kind); window.setTimeout(() => setCopied(null), 1600); };

  return (
    <div className="labShell detailShell">
      <header className="topbar"><Link className="wordmark" href="/" aria-label="Back to Solace Shaders catalog"><SolaceLogo className="solaceLogo" /><span>Solace</span><span className="brandDivider">/</span><span className="brandSection">Shaders</span></Link></header>
      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading"><div><Link className="backLink" href="/">← All shaders</Link><div className="eyebrow">Experiment 011 / Editorial media</div><h1>Exposure grid</h1></div><p>A camera-clean media grid where selected frames become alternate exposures, color samples, or tactile material.</p></div>
          <div className="stage fieldStage exposureGridStage">
            <ExposureGrid className="shaderCanvas" src={mediaUrl} mediaType={mediaType} settings={settings} />
            <div className="stageTop" aria-hidden="true"><span>{mediaName}</span><span>{Math.round(settings.columns)} × {Math.round(settings.rows)} sampling grid · WebGL 2</span></div>
            <div className="stageBottom"><span>Move across the frame to inspect a cell</span><span className="stageHint">Samples change with composed timing</span></div>
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={(event) => {
            const file = event.target.files?.[0]; if (!file) return;
            setMediaUrl((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return URL.createObjectURL(file); });
            setMediaType(file.type.startsWith("video/") ? "video" : "image"); setMediaName(file.name); event.target.value = "";
          }} />
        </section>
        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro"><span className="eyebrow">Solace registry</span><h2 id="install-title">Add it to your project</h2><p>Installs one standalone WebGL media component with image and video support.</p></div>
          <div className="installCommand"><code>{registryCommand}</code><Tooltip content={copied === "install" ? "Copied" : "Copy command"}><button className={`iconActionButton${copied === "install" ? " isCopied" : ""}`} type="button" aria-label="Copy command" onClick={() => copy("install", registryCommand)}><CopyActionIcon confirmed={copied === "install"} /></button></Tooltip></div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}><button className="usageToggle iconActionButton" type="button" aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"} aria-expanded={codeOpen} aria-controls="configured-jsx" onClick={() => setCodeOpen((open) => !open)}><CodeActionIcon /></button></Tooltip>
        </section>
        {codeOpen ? <section className="codePanel" id="configured-jsx" aria-label="Configured component snippet"><div className="codePanelHeader"><div><span className="eyebrow">Current DialKit values</span><h2>Ready-to-paste usage</h2></div><Tooltip content={copied === "jsx" ? "Copied" : "Copy JSX"}><button className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`} type="button" aria-label="Copy JSX" onClick={() => copy("jsx", snippet)}><CopyActionIcon confirmed={copied === "jsx"} /></button></Tooltip></div><HighlightedCode code={snippet} /></section> : null}
      </main>
      <aside className="inspector" aria-label="Exposure grid fine-tuning controls"><div className="dialkitFrame"><PanelResetButton onReset={dial.resetValues} /><DialRoot mode="inline" theme="dark" productionEnabled /><PaletteEditor stops={[{ key: "grid", label: "Grid", value: dial.values.color.grid }, { key: "accent", label: "Accent", value: dial.values.color.accent }, { key: "secondary", label: "Secondary", value: dial.values.color.secondary }, { key: "ink", label: "Ink", value: dial.values.color.ink }, { key: "paper", label: "Paper", value: dial.values.color.paper }]} onChange={(key, value) => dial.setValue(`color.${key}`, value)} /></div></aside>
    </div>
  );
}
