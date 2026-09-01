"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig, useDialKitController } from "dialkit";
import {
  BLACKHOLE_LENSING_PALETTES,
  BLACKHOLE_LENSING_PRESETS,
  BlackholeLensing,
  type BlackholeLensingMode,
  type BlackholeLensingPalette,
  type BlackholeLensingSettings,
} from "./BlackholeLensing";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";
const DEFAULT_MEDIA_SOURCE = "/blackhole-halftone.webp";

const DIAL_CONFIG = {
  portal: {
    mode: {
      type: "select",
      options: [
        { value: "click", label: "Click to place" },
        { value: "pointer", label: "Pointer track" },
        { value: "orbit", label: "Orbiting drift" },
        { value: "fixed", label: "Fixed position" },
      ],
      default: "click",
    },
    choose: { type: "action", label: "Choose media background" },
    clear: { type: "action", label: "Use default halftone" },
  },
  physics: {
    progress: [1.0, 0, 1, 0.01],
    radius: [BLACKHOLE_LENSING_PRESETS.editorial.radius, 0.05, 0.45, 0.01],
    lens: [BLACKHOLE_LENSING_PRESETS.editorial.lens, 0.05, 0.8, 0.01],
    reach: [BLACKHOLE_LENSING_PRESETS.editorial.reach, 0.1, 0.8, 0.01],
    orbit: [BLACKHOLE_LENSING_PRESETS.editorial.orbit, 0, 3, 0.05],
    aberration: [BLACKHOLE_LENSING_PRESETS.editorial.aberration, 0, 0.4, 0.01],
    wobble: [BLACKHOLE_LENSING_PRESETS.editorial.wobble, 0, 0.2, 0.01],
    squash: [BLACKHOLE_LENSING_PRESETS.editorial.squash, 0, 0.25, 0.01],
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "editorial", label: "Editorial mono" },
        { value: "cinematic", label: "Cinematic amber" },
        { value: "chromatic", label: "Chromatic portal" },
        { value: "signal", label: "Signal lens" },
      ],
      default: "editorial",
    },
    background: { type: "color", default: BLACKHOLE_LENSING_PALETTES.editorial.background },
    accretion: { type: "color", default: BLACKHOLE_LENSING_PALETTES.editorial.accretion },
    photonRing: { type: "color", default: BLACKHOLE_LENSING_PALETTES.editorial.photonRing },
    singularity: { type: "color", default: BLACKHOLE_LENSING_PALETTES.editorial.singularity },
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

export function BlackholeLensingLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(DEFAULT_MEDIA_SOURCE);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaName, setMediaName] = useState("Halftone city study");

  const dial = useDialKitController("Blackhole lensing", DIAL_CONFIG, {
    id: "solace-blackhole-lensing-v2",
    persist: true,
    onAction: (action) => {
      if (action === "portal.choose") inputRef.current?.click();
      if (action === "portal.clear") {
        setMediaUrl((current) => {
          if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
          return DEFAULT_MEDIA_SOURCE;
        });
        setMediaType("image");
        setMediaName("Halftone city study");
      }
    },
  });

  const selectedPalette = dial.values.color.preset as BlackholeLensingPalette;
  const previousPalette = useRef(selectedPalette);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => CANONICAL_ORIGIN);

  useEffect(() => {
    if (previousPalette.current === selectedPalette) return;
    previousPalette.current = selectedPalette;
    const preset = BLACKHOLE_LENSING_PRESETS[selectedPalette];
    dial.setValues({
      physics: {
        progress: dial.values.physics.progress,
        radius: preset.radius,
        lens: preset.lens,
        reach: preset.reach,
        orbit: preset.orbit,
        aberration: preset.aberration,
        wobble: preset.wobble,
        squash: preset.squash,
      },
      color: { ...preset.colors },
    });
  }, [dial, selectedPalette]);

  useEffect(() => () => {
    if (mediaUrl?.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  const settings = useMemo<BlackholeLensingSettings>(() => ({
    mode: dial.values.portal.mode as BlackholeLensingMode,
    progress: dial.values.physics.progress,
    radius: dial.values.physics.radius,
    lens: dial.values.physics.lens,
    reach: dial.values.physics.reach,
    orbit: dial.values.physics.orbit,
    aberration: dial.values.physics.aberration,
    wobble: dial.values.physics.wobble,
    squash: dial.values.physics.squash,
    breath: 0.02,
    position: [0.5, 0.5],
    palette: selectedPalette,
    colors: {
      background: dial.values.color.background,
      accretion: dial.values.color.accretion,
      photonRing: dial.values.color.photonRing,
      singularity: dial.values.color.singularity,
    },
  }), [dial.values, selectedPalette]);

  const registryUrl = `${origin}/r/blackhole-lensing.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;

  const snippet = `import { BlackholeLensing } from "@/components/blackhole-lensing";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <BlackholeLensing
    palette="${selectedPalette}"
    mode="${settings.mode}"
    progress={${settings.progress.toFixed(2)}}
    radius={${settings.radius.toFixed(2)}}
    lens={${settings.lens.toFixed(2)}}
    reach={${settings.reach.toFixed(2)}}
    orbit={${settings.orbit.toFixed(2)}}
    aberration={${settings.aberration.toFixed(2)}}
    wobble={${settings.wobble.toFixed(2)}}
    colors={{
      background: "${settings.colors.background}",
      accretion: "${settings.colors.accretion}",
      photonRing: "${settings.colors.photonRing}",
      singularity: "${settings.colors.singularity}",
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
          <span>Solace</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Shaders</span>
        </Link>
      </header>
      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading">
            <div>
              <Link className="backLink" href="/">← All shaders</Link>
              <div className="eyebrow">Experiment 013 / Relativity</div>
              <h1>Black hole portal</h1>
            </div>
            <p>
              Gravitational lensing, Kerr metric frame-dragging spin, and spectral chromatic dispersion around an event horizon.
            </p>
          </div>
          <div className="stage fieldStage">
            <BlackholeLensing
              className="shaderCanvas"
              src={mediaUrl}
              mediaType={mediaType}
              settings={settings}
            />
            <div className="stageTop" aria-hidden="true">
              <span>{mediaName}</span>
              <span>{settings.mode} · WebGL 2</span>
            </div>
            <div className="stageBottom">
              <span>Click anywhere to place the singularity</span>
              <span className="stageHint">Each click sends a gravitational pulse through the image</span>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setMediaUrl((current) => {
                if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
                return URL.createObjectURL(file);
              });
              setMediaType(file.type.startsWith("video/") ? "video" : "image");
              setMediaName(file.name);
              event.target.value = "";
            }}
          />
        </section>
        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>Installs one standalone gravitational lensing shader with click placement, image and video support.</p>
          </div>
          <div className="installCommand">
            <code>{registryCommand}</code>
            <Tooltip content={copied === "install" ? "Copied" : "Copy command"}>
              <button
                className={`iconActionButton${copied === "install" ? " isCopied" : ""}`}
                type="button"
                aria-label="Copy command"
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
                  aria-label="Copy JSX"
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
      <aside className="inspector" aria-label="Black hole portal fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={() => {
            dial.resetValues();
            setMediaUrl(DEFAULT_MEDIA_SOURCE);
            setMediaType("image");
            setMediaName("Halftone city study");
          }} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          <PaletteEditor
            title="Accretion"
            summary="Void, disc, and photon ring"
            ariaLabel="Black hole accretion palette editor"
            stops={[
              { key: "background", label: "Void", value: dial.values.color.background },
              { key: "accretion", label: "Accretion", value: dial.values.color.accretion },
              { key: "photonRing", label: "Photon ring", value: dial.values.color.photonRing },
              { key: "singularity", label: "Core", value: dial.values.color.singularity },
            ]}
            onChange={(key, value) => dial.setValue(`color.${key}`, value)}
          />
        </div>
      </aside>
    </div>
  );
}
