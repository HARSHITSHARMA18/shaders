"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig, useDialKitController } from "dialkit";
import {
  DEFAULT_FLUID_DISTORTION_SVG,
  FLUID_DISTORTION_CHARACTERS,
  FLUID_DISTORTION_PALETTES,
  FluidDistortion,
  type FluidDistortionCharacter,
  type FluidDistortionComposition,
  type FluidDistortionCurrent,
  type FluidDistortionPalette,
  type FluidDistortionSettings,
} from "./FluidDistortion";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";

const DIAL_CONFIG = {
  source: {
    composition: {
      type: "select",
      options: [
        { value: "media", label: "Image or video" },
        { value: "svg", label: "SVG mask" },
        { value: "flare", label: "Flare cluster" },
        { value: "capsule", label: "Soft capsule" },
        { value: "orbs", label: "Twin orbs" },
        { value: "ribbon", label: "Ribbon" },
      ],
      default: "media",
    },
    pasteSvg: { type: "action", label: "Paste SVG mask" },
    choose: { type: "action", label: "Choose image or video" },
    clear: { type: "action", label: "Use generated form" },
  },
  motion: {
    current: {
      type: "select",
      options: [
        { value: "idle", label: "Idle current" },
        { value: "orbit", label: "Orbiting stir" },
        { value: "pointer", label: "Pointer only" },
      ],
      default: "idle",
    },
    character: {
      type: "select",
      options: [
        { value: "silk", label: "Silk" },
        { value: "honey", label: "Honey" },
        { value: "storm", label: "Storm" },
      ],
      default: "silk",
    },
  },
  fluid: {
    cursorSize: [0.018, 0.006, 0.07, 0.001],
    cursorPower: [0.28, 0.06, 0.9, 0.01],
    distortion: [0.52, 0.08, 1, 0.01],
    softness: [0.09, 0.03, 0.18, 0.005],
    gloss: [0.42, 0, 1, 0.01],
    swirl: [0.55, 0, 1, 0.01],
    dissipationVel: [0.986, 0.92, 0.995, 0.001],
    dissipationDist: [0.992, 0.94, 0.998, 0.001],
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "flare", label: "Warm flare" },
        { value: "aurora", label: "Aurora" },
        { value: "citrus", label: "Citrus" },
        { value: "glacier", label: "Glacier" },
        { value: "ink", label: "Ink" },
      ],
      default: "flare",
    },
    background: { type: "color", default: FLUID_DISTORTION_PALETTES.flare.background },
    bloomA: { type: "color", default: FLUID_DISTORTION_PALETTES.flare.bloomA },
    bloomB: { type: "color", default: FLUID_DISTORTION_PALETTES.flare.bloomB },
    bloomC: { type: "color", default: FLUID_DISTORTION_PALETTES.flare.bloomC },
    highlight: { type: "color", default: FLUID_DISTORTION_PALETTES.flare.highlight },
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

export function FluidDistortionLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string | undefined>("/fluid-distortion-hero.png");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaName, setMediaName] = useState("UI hero composition");
  const [svgMarkup, setSvgMarkup] = useState(DEFAULT_FLUID_DISTORTION_SVG);
  const [svgDraft, setSvgDraft] = useState(DEFAULT_FLUID_DISTORTION_SVG);
  const [svgEditorOpen, setSvgEditorOpen] = useState(false);

  const dial = useDialKitController("Fluid distortion", DIAL_CONFIG, {
    id: "solace-fluid-distortion-v1",
    persist: true,
    onAction: (action) => {
      if (action === "source.choose") inputRef.current?.click();
      if (action === "source.clear") {
        setMediaUrl((current) => {
          if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
          return undefined;
        });
        setMediaName("Generated flare");
        dial.setValue("source.composition", "flare");
      }
      if (action === "source.pasteSvg") {
        setSvgDraft(svgMarkup);
        setSvgEditorOpen(true);
      }
    },
  });

  const selectedPalette = dial.values.color.preset as FluidDistortionPalette;
  const selectedCharacter = dial.values.motion.character as FluidDistortionCharacter;
  const previousPalette = useRef(selectedPalette);
  const previousCharacter = useRef(selectedCharacter);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => CANONICAL_ORIGIN);

  useEffect(() => {
    if (previousPalette.current === selectedPalette) return;
    previousPalette.current = selectedPalette;
    dial.setValues({ color: { ...FLUID_DISTORTION_PALETTES[selectedPalette] } });
  }, [dial, selectedPalette]);

  useEffect(() => {
    if (previousCharacter.current === selectedCharacter) return;
    previousCharacter.current = selectedCharacter;
    dial.setValues({ fluid: { ...FLUID_DISTORTION_CHARACTERS[selectedCharacter] } });
  }, [dial, selectedCharacter]);

  useEffect(() => () => {
    if (mediaUrl?.startsWith("blob:")) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  const settings = useMemo<FluidDistortionSettings>(() => ({
    composition: dial.values.source.composition as FluidDistortionComposition,
    current: dial.values.motion.current as FluidDistortionCurrent,
    character: selectedCharacter,
    cursorSize: dial.values.fluid.cursorSize,
    cursorPower: dial.values.fluid.cursorPower,
    distortion: dial.values.fluid.distortion,
    softness: dial.values.fluid.softness,
    gloss: dial.values.fluid.gloss,
    swirl: dial.values.fluid.swirl,
    dissipationVel: dial.values.fluid.dissipationVel,
    dissipationDist: dial.values.fluid.dissipationDist,
    palette: selectedPalette,
    colors: {
      background: dial.values.color.background,
      bloomA: dial.values.color.bloomA,
      bloomB: dial.values.color.bloomB,
      bloomC: dial.values.color.bloomC,
      highlight: dial.values.color.highlight,
    },
  }), [dial.values, selectedCharacter, selectedPalette]);

  const usingMedia = settings.composition === "media" && Boolean(mediaUrl);
  const usingSvg = settings.composition === "svg";
  const registryUrl = `${origin}/r/fluid-distortion.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;

  const svgDeclaration = usingSvg
    ? `\nconst customSvg = \`${svgMarkup.replaceAll("`", "\\`").replaceAll("${", "\\${")}\`;\n`
    : "";
  const svgProp = usingSvg ? `\n    svgMask={customSvg}` : "";
  const mediaProp = usingMedia ? `\n    src="/your-image.jpg"` : "";

  const snippet = `import { FluidDistortion } from "@/components/fluid-distortion";
${svgDeclaration}
<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <FluidDistortion
    composition="${settings.composition}"
    current="${settings.current}"
    character="${settings.character}"${svgProp}${mediaProp}
    cursorSize={${settings.cursorSize.toFixed(3)}}
    cursorPower={${settings.cursorPower.toFixed(2)}}
    distortion={${settings.distortion.toFixed(2)}}
    softness={${settings.softness.toFixed(2)}}
    gloss={${settings.gloss.toFixed(2)}}
    swirl={${settings.swirl.toFixed(2)}}
    colors={{
      background: "${settings.colors.background}",
      bloomA: "${settings.colors.bloomA}",
      bloomB: "${settings.colors.bloomB}",
      bloomC: "${settings.colors.bloomC}",
      highlight: "${settings.colors.highlight}",
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
              <div className="eyebrow">Experiment 012 / Liquid surface</div>
              <h1>Fluid distortion</h1>
            </div>
            <p>
              A stable 2D fluid that warps color, media, and the rim of a soft
              form. Stir it, or let an idle current keep the surface alive.
            </p>
          </div>
          <div className="stage fieldStage">
            <FluidDistortion
              className="shaderCanvas"
              src={usingMedia ? mediaUrl : undefined}
              mediaType={mediaType}
              svgMask={usingSvg ? svgMarkup : undefined}
              settings={settings}
            />
            <div className="stageTop" aria-hidden="true">
              <span>{usingMedia ? mediaName : usingSvg ? "SVG mask" : settings.composition}</span>
              <span>{settings.character} · WebGL 2</span>
            </div>
            <div className="stageBottom">
              <span>Move through the form to impart momentum</span>
              <span className="stageHint">Edges ripple with the velocity field</span>
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
              dial.setValue("source.composition", "media");
              event.target.value = "";
            }}
          />
        </section>
        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>Installs one standalone fluid surface with generated forms, custom SVGs, and optional media.</p>
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
      <aside className="inspector" aria-label="Fluid distortion fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={() => {
            dial.resetValues();
            setMediaUrl((current) => {
              if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
              return undefined;
            });
            setMediaName("Generated flare");
            setSvgMarkup(DEFAULT_FLUID_DISTORTION_SVG);
            setSvgDraft(DEFAULT_FLUID_DISTORTION_SVG);
          }} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          {svgEditorOpen ? (
            <div
              role="dialog"
              aria-label="Paste SVG mask"
              style={{
                position: "absolute",
                top: 148,
                left: 12,
                right: 12,
                zIndex: 20,
                padding: 10,
                border: "1px solid #353a35",
                borderRadius: 10,
                background: "#111311",
                boxShadow: "0 18px 45px rgba(0,0,0,.55)",
              }}
            >
              <div style={{ display: "grid", gap: 3, marginBottom: 8 }}>
                <strong style={{ color: "#dfe4df", fontSize: 10, fontWeight: 500 }}>SVG fluid mask</strong>
                <span style={{ color: "#697069", font: '7px/1.2 "SFMono-Regular", Consolas, monospace' }}>
                  Paste a complete SVG element. It stays local.
                </span>
              </div>
              <textarea
                className="particleSvgTextarea"
                value={svgDraft}
                onChange={(event) => setSvgDraft(event.target.value)}
                wrap="soft"
                spellCheck={false}
                style={{
                  display: "block",
                  boxSizing: "border-box",
                  width: "100%",
                  height: 132,
                  resize: "none",
                  padding: 9,
                  border: "1px solid #2c302c",
                  borderRadius: 7,
                  outline: "none",
                  background: "#090b0a",
                  color: "#c2c9c3",
                  font: '8px/1.45 "SFMono-Regular", Consolas, monospace',
                  whiteSpace: "pre-wrap",
                  overflowX: "hidden",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setSvgEditorOpen(false)}
                  style={{
                    height: 27,
                    padding: "0 9px",
                    border: "1px solid #2f332f",
                    borderRadius: 6,
                    background: "transparent",
                    color: "#8e958f",
                    fontSize: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSvgMarkup(svgDraft);
                    dial.setValue("source.composition", "svg");
                    setSvgEditorOpen(false);
                  }}
                  style={{
                    height: 27,
                    padding: "0 10px",
                    border: 0,
                    borderRadius: 6,
                    background: "#d8ff2f",
                    color: "#10120d",
                    fontSize: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Apply SVG
                </button>
              </div>
            </div>
          ) : null}
          <PaletteEditor
            title="Pigment"
            summary="Paper, blooms, and gloss"
            ariaLabel="Fluid pigment editor"
            stops={[
              { key: "background", label: "Paper", value: dial.values.color.background },
              { key: "bloomA", label: "Bloom A", value: dial.values.color.bloomA },
              { key: "bloomB", label: "Bloom B", value: dial.values.color.bloomB },
              { key: "bloomC", label: "Bloom C", value: dial.values.color.bloomC },
              { key: "highlight", label: "Gloss", value: dial.values.color.highlight },
            ]}
            onChange={(key, value) => dial.setValue(`color.${key}`, value)}
          />
        </div>
      </aside>
    </div>
  );
}
