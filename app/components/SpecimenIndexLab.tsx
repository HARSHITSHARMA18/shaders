"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig, useDialKitController } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { SpecimenIndex, type SpecimenIndexColors, type SpecimenIndexSettings } from "./SpecimenIndex";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";
const DEFAULT_MEDIA_SOURCE = "/specimen-index-flax.png";
type StudyName = SpecimenIndexSettings["study"];

const STUDY_COLORS: Record<StudyName, SpecimenIndexColors> = {
  editorial: { paper: "#F3F3EE", ink: "#050607", frame: "#FAFAF5", accent: "#7591FF", secondary: "#2E43F5" },
  chromatic: { paper: "#E8E8E2", ink: "#090A0B", frame: "#F8F7F1", accent: "#FF3D9A", secondary: "#3157F6" },
  material: { paper: "#E8E0D2", ink: "#251D18", frame: "#FAF4E8", accent: "#EE6A3A", secondary: "#718875" },
  exposure: { paper: "#F2F0E8", ink: "#090A08", frame: "#FFFFFF", accent: "#F4FF3E", secondary: "#4DD7D0" },
};

const DIAL_CONFIG = {
  source: {
    choose: { type: "action", label: "Choose image or video" },
    clear: { type: "action", label: "Use built-in composition" },
  },
  composition: {
    study: {
      type: "select",
      options: [
        { value: "editorial", label: "Editorial index" },
        { value: "chromatic", label: "Chromatic proof" },
        { value: "material", label: "Material study" },
        { value: "exposure", label: "Exposure study" },
      ],
      default: "editorial",
    },
    mode: {
      type: "select",
      options: [
        { value: "pointer", label: "Pointer + pin" },
        { value: "auto", label: "Authored drift" },
        { value: "pinned", label: "Click to place" },
      ],
      default: "pointer",
    },
    probes: [4, 1, 4, 1],
  },
  geometry: {
    system: {
      type: "select",
      options: [
        { value: "studio", label: "Studio system" },
        { value: "chain", label: "Circle chain" },
        { value: "features", label: "Feature map" },
        { value: "frames", label: "Quiet frames" },
      ],
      default: "studio",
    },
    amount: [0.9, 0, 1, 0.02],
    density: [0.78, 0, 1, 0.02],
    scale: [0.84, 0, 1, 0.02],
    pointer: [0.96, 0, 1, 0.02],
  },
  sampling: {
    magnification: [1.38, 1.02, 2.2, 0.02],
    detail: [0.78, 0, 1, 0.02],
    motion: [0.24, 0, 1, 0.02],
    response: [0.14, 0.03, 0.28, 0.01],
  },
  framing: {
    frameWeight: [1, 0.4, 2.4, 0.05],
    connectors: [0.86, 0, 1, 0.02],
    grain: [0.18, 0, 1, 0.02],
  },
  color: {
    paper: { type: "color", default: STUDY_COLORS.editorial.paper },
    ink: { type: "color", default: STUDY_COLORS.editorial.ink },
    frame: { type: "color", default: STUDY_COLORS.editorial.frame },
    accent: { type: "color", default: STUDY_COLORS.editorial.accent },
    secondary: { type: "color", default: STUDY_COLORS.editorial.secondary },
  },
} satisfies DialConfig;

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function SpecimenIndexLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState(DEFAULT_MEDIA_SOURCE);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaName, setMediaName] = useState("Linum specimen / 001");
  const dial = useDialKitController("Specimen index", DIAL_CONFIG, {
    id: "solace-specimen-index-v1",
    persist: true,
    onAction: (action) => {
      if (action === "source.choose") inputRef.current?.click();
      if (action === "source.clear") {
        setMediaUrl((current) => {
          if (current.startsWith("blob:")) URL.revokeObjectURL(current);
          return DEFAULT_MEDIA_SOURCE;
        });
        setMediaType("image");
        setMediaName("Linum specimen / 001");
      }
    },
  });
  const selectedStudy = dial.values.composition.study as StudyName;
  const previousStudy = useRef(selectedStudy);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => CANONICAL_ORIGIN);

  useEffect(() => {
    if (previousStudy.current === selectedStudy) return;
    previousStudy.current = selectedStudy;
    dial.setValues({ color: { ...STUDY_COLORS[selectedStudy] } });
  }, [dial, selectedStudy]);
  useEffect(() => () => {
    if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  const settings = useMemo<SpecimenIndexSettings>(() => ({
    study: selectedStudy,
    mode: dial.values.composition.mode as SpecimenIndexSettings["mode"],
    geometry: dial.values.geometry.system as SpecimenIndexSettings["geometry"],
    probes: dial.values.composition.probes,
    magnification: dial.values.sampling.magnification,
    detail: dial.values.sampling.detail,
    motion: dial.values.sampling.motion,
    response: dial.values.sampling.response,
    geometryAmount: dial.values.geometry.amount,
    geometryDensity: dial.values.geometry.density,
    geometryScale: dial.values.geometry.scale,
    pointerGeometry: dial.values.geometry.pointer,
    frameWeight: dial.values.framing.frameWeight,
    connectors: dial.values.framing.connectors,
    grain: dial.values.framing.grain,
    colors: {
      paper: dial.values.color.paper,
      ink: dial.values.color.ink,
      frame: dial.values.color.frame,
      accent: dial.values.color.accent,
      secondary: dial.values.color.secondary,
    },
  }), [dial.values, selectedStudy]);

  const registryUrl = `${origin}/r/specimen-index.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;
  const snippet = `import { SpecimenIndex } from "@/components/specimen-index";

<div className="relative h-[640px] overflow-hidden rounded-2xl">
  <SpecimenIndex
    src="/your-image.jpg"
    study="${settings.study}"
    mode="${settings.mode}"
    geometry="${settings.geometry}"
    probes={${Math.round(settings.probes)}}
    magnification={${settings.magnification.toFixed(2)}}
    detail={${settings.detail.toFixed(2)}}
    frameWeight={${settings.frameWeight.toFixed(2)}}
    connectors={${settings.connectors.toFixed(2)}}
    grain={${settings.grain.toFixed(2)}}
    motion={${settings.motion.toFixed(2)}}
    response={${settings.response.toFixed(2)}}
    geometryAmount={${settings.geometryAmount.toFixed(2)}}
    geometryDensity={${settings.geometryDensity.toFixed(2)}}
    geometryScale={${settings.geometryScale.toFixed(2)}}
    pointerGeometry={${settings.pointerGeometry.toFixed(2)}}
    colors={{
      paper: "${settings.colors.paper}",
      ink: "${settings.colors.ink}",
      frame: "${settings.colors.frame}",
      accent: "${settings.colors.accent}",
      secondary: "${settings.colors.secondary}",
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
        <Link className="wordmark" href="/" aria-label="Back to Solace Shaders catalog">
          <SolaceLogo className="solaceLogo" />
          <span>Solace</span><span className="brandDivider">/</span><span className="brandSection">Shaders</span>
        </Link>
      </header>
      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading">
            <div><Link className="backLink" href="/">← All shaders</Link><div className="eyebrow">Experiment 014 / Optical composition</div><h1>Specimen index</h1></div>
            <p>A living graphic studio where detected image features become frames, circle chains, intersections, and connected samples.</p>
          </div>
          <div className="stage fieldStage specimenIndexStage">
            <SpecimenIndex className="shaderCanvas" src={mediaUrl} mediaType={mediaType} settings={settings} />
            <div className="stageTop" aria-hidden="true"><span>{mediaName}</span><span>{settings.study} · {Math.round(settings.probes)} optical probes · WebGL 2</span></div>
            <div className="stageBottom"><span>Move to inspect · click to pin</span><span className="stageHint">Each window reads the same source differently</span></div>
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setMediaUrl((current) => {
              if (current.startsWith("blob:")) URL.revokeObjectURL(current);
              return URL.createObjectURL(file);
            });
            setMediaType(file.type.startsWith("video/") ? "video" : "image");
            setMediaName(file.name);
            event.target.value = "";
          }} />
        </section>
        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro"><span className="eyebrow">Solace registry</span><h2 id="install-title">Add it to your project</h2><p>Installs one standalone WebGL component with image and video support.</p></div>
          <div className="installCommand"><code>{registryCommand}</code><Tooltip content={copied === "install" ? "Copied" : "Copy command"}><button className={`iconActionButton${copied === "install" ? " isCopied" : ""}`} type="button" aria-label="Copy command" onClick={() => copy("install", registryCommand)}><CopyActionIcon confirmed={copied === "install"} /></button></Tooltip></div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}><button className="usageToggle iconActionButton" type="button" aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"} aria-expanded={codeOpen} aria-controls="configured-jsx" onClick={() => setCodeOpen((open) => !open)}><CodeActionIcon /></button></Tooltip>
        </section>
        {codeOpen ? <section className="codePanel" id="configured-jsx" aria-label="Configured component snippet"><div className="codePanelHeader"><div><span className="eyebrow">Current DialKit values</span><h2>Ready-to-paste usage</h2></div><Tooltip content={copied === "jsx" ? "Copied" : "Copy JSX"}><button className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`} type="button" aria-label="Copy JSX" onClick={() => copy("jsx", snippet)}><CopyActionIcon confirmed={copied === "jsx"} /></button></Tooltip></div><HighlightedCode code={snippet} /></section> : null}
      </main>
      <aside className="inspector" aria-label="Specimen Index fine-tuning controls">
        <div className="dialkitFrame"><PanelResetButton onReset={dial.resetValues} /><DialRoot mode="inline" theme="dark" productionEnabled /><PaletteEditor stops={[{ key: "paper", label: "Paper", value: dial.values.color.paper }, { key: "ink", label: "Ink", value: dial.values.color.ink }, { key: "frame", label: "Frame", value: dial.values.color.frame }, { key: "accent", label: "Accent", value: dial.values.color.accent }, { key: "secondary", label: "Secondary", value: dial.values.color.secondary }]} onChange={(key, value) => dial.setValue(`color.${key}`, value)} /></div>
      </aside>
    </div>
  );
}
