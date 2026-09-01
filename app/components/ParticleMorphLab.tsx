"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DialRoot, useDialKitController, type DialConfig } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { ParticleMorphShader, PARTICLE_MORPH_PALETTES, SOLACE_MARK_SVG, type ParticleMorphPalette, type ParticleMorphPreset, type ParticleMorphSettings } from "./ParticleMorphShader";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";

function createParticleDials(targetMode: ParticleMorphPreset) {
  const colors = PARTICLE_MORPH_PALETTES.rose;
  return {
    target: {
      preset: {
        type: "select",
        options: [
          { value: "word", label: "Wordmark" },
          { value: "svg", label: "SVG logo" },
        ],
        default: targetMode,
      },
      ...(targetMode === "word"
        ? { text: { type: "text" as const, default: "SOLACE", placeholder: "Type up to 12 characters" } }
        : { pasteSvg: { type: "action" as const, label: "Paste SVG code" } }),
    },
    particles: {
      count: [1280, 500, 2000, 20] as [number, number, number, number],
      size: [5.2, 2.5, 9, 0.1] as [number, number, number, number],
      gloss: [0.72, 0, 1, 0.05] as [number, number, number, number],
      scatter: [1.12, 0.75, 1.65, 0.05] as [number, number, number, number],
    },
    motion: {
      duration: [5.2, 3.2, 9, 0.1] as [number, number, number, number],
      turbulence: [0.58, 0, 1.4, 0.05] as [number, number, number, number],
      interaction: [0.35, 0, 1, 0.05] as [number, number, number, number],
    },
    color: {
      preset: {
        type: "select",
        options: [
          { value: "rose", label: "Rose" },
          { value: "pearl", label: "Pearl" },
          { value: "cobalt", label: "Cobalt" },
          { value: "acid", label: "Acid" },
        ],
        default: "rose",
      },
      background: { type: "color", default: colors.background },
      shadow: { type: "color", default: colors.shadow },
      surface: { type: "color", default: colors.surface },
      highlight: { type: "color", default: colors.highlight },
    },
  } satisfies DialConfig;
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

export function ParticleMorphLab() {
  const [targetMode, setTargetMode] = useState<ParticleMorphPreset>("svg");
  const [targetText, setTargetText] = useState("SOLACE");
  const [svgMarkup, setSvgMarkup] = useState(SOLACE_MARK_SVG);
  const [svgDraft, setSvgDraft] = useState(SOLACE_MARK_SVG);
  const [svgEditorOpen, setSvgEditorOpen] = useState(false);
  const svgEditorRef = useRef<HTMLTextAreaElement>(null);
  const dialConfig = useMemo(() => createParticleDials(targetMode), [targetMode]);
  const dial = useDialKitController("Particle assembly", dialConfig, {
    id: "solace-particle-assembly",
    persist: true,
    onAction: (action) => {
      if (action !== "target.pasteSvg") return;
      setSvgDraft(svgMarkup);
      setSvgEditorOpen(true);
    },
  });
  const selectedPalette = dial.values.color.preset as ParticleMorphPalette;
  const targetValues = dial.values.target as { preset: string; text?: string };
  const selectedTarget = targetValues.preset as ParticleMorphPreset;
  const configuredText = targetValues.text ?? targetText;
  useEffect(() => {
    if (selectedTarget === targetMode && (targetValues.text === undefined || targetValues.text === targetText)) return;
    const update = window.setTimeout(() => {
      if (selectedTarget !== targetMode) setTargetMode(selectedTarget);
      if (targetValues.text !== undefined && targetValues.text !== targetText) setTargetText(targetValues.text);
    }, 0);
    return () => window.clearTimeout(update);
  }, [selectedTarget, targetMode, targetText, targetValues.text]);
  useEffect(() => {
    if (svgEditorOpen) svgEditorRef.current?.focus();
  }, [svgEditorOpen]);
  const previousPalette = useRef(selectedPalette);
  useEffect(() => {
    if (previousPalette.current === selectedPalette) return;
    previousPalette.current = selectedPalette;
    dial.setValues({ color: { ...PARTICLE_MORPH_PALETTES[selectedPalette] } });
  }, [dial, selectedPalette]);

  const settings = useMemo<ParticleMorphSettings>(() => ({
    preset: selectedTarget,
    text: configuredText.slice(0, 12),
    svg: svgMarkup,
    particleCount: dial.values.particles.count,
    size: dial.values.particles.size,
    gloss: dial.values.particles.gloss,
    scatter: dial.values.particles.scatter,
    duration: dial.values.motion.duration,
    turbulence: dial.values.motion.turbulence,
    interaction: dial.values.motion.interaction,
    palette: selectedPalette,
    colors: {
      background: dial.values.color.background,
      shadow: dial.values.color.shadow,
      surface: dial.values.color.surface,
      highlight: dial.values.color.highlight,
    },
  }), [configuredText, dial.values, selectedPalette, selectedTarget, svgMarkup]);

  const resetControls = () => {
    dial.resetValues();
    setTargetMode("svg");
    setTargetText("SOLACE");
    setSvgMarkup(SOLACE_MARK_SVG);
    setSvgDraft(SOLACE_MARK_SVG);
    setSvgEditorOpen(false);
  };

  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => CANONICAL_ORIGIN,
  );
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const registryUrl = `${origin}/r/particle-assembly.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;
  const targetProps = settings.preset === "svg"
    ? `preset="svg"\n    svg={\`${settings.svg.replaceAll("`", "\\`").replaceAll("${", "\\${")}\`}`
    : `preset="word"\n    text="${settings.text.replaceAll('"', '\\"')}"`;
  const snippet = `import { ParticleMorphShader } from "@/components/particle-morph-shader";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <ParticleMorphShader
    ${targetProps}
    particleCount={${Math.round(settings.particleCount)}}
    size={${settings.size.toFixed(1)}}
    gloss={${settings.gloss.toFixed(2)}}
    scatter={${settings.scatter.toFixed(2)}}
    duration={${settings.duration.toFixed(1)}}
    turbulence={${settings.turbulence.toFixed(2)}}
    interaction={${settings.interaction.toFixed(2)}}
    colors={{
      background: "${settings.colors?.background}",
      shadow: "${settings.colors?.shadow}",
      surface: "${settings.colors?.surface}",
      highlight: "${settings.colors?.highlight}",
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
              <div className="eyebrow">Experiment 009 / Particle material</div>
              <h1>Particle assembly</h1>
            </div>
            <p>Glossy particles gather into an editable wordmark or any pasted SVG logo before returning to ambient motion.</p>
          </div>

          <div className="stage fieldStage">
            <ParticleMorphShader className="shaderCanvas" settings={settings} />
            <div className="stageTop" aria-hidden="true">
              <span>{settings.preset === "svg" ? "SVG logo" : "wordmark"} target</span>
              <span>{Math.round(settings.particleCount)} particles · WebGL 2</span>
            </div>
            <div className="stageBottom">
              <span>Move through the field to gently repel the material</span>
              <span className="stageHint">Choose Wordmark or SVG logo in DialKit</span>
            </div>
          </div>
        </section>

        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>Installs one standalone WebGL component with text and sanitized SVG target generation included.</p>
          </div>
          <div className="installCommand">
            <code>{registryCommand}</code>
            <Tooltip content={copied === "install" ? "Copied" : "Copy command"}>
              <button className={`iconActionButton${copied === "install" ? " isCopied" : ""}`} type="button" aria-label={copied === "install" ? "Command copied" : "Copy command"} onClick={() => copy("install", registryCommand)}>
                <CopyActionIcon confirmed={copied === "install"} />
              </button>
            </Tooltip>
          </div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}>
            <button className="usageToggle iconActionButton" type="button" aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"} aria-expanded={codeOpen} aria-controls="configured-jsx" onClick={() => setCodeOpen((open) => !open)}>
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
                <button className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`} type="button" aria-label={copied === "jsx" ? "JSX copied" : "Copy JSX"} onClick={() => copy("jsx", snippet)}>
                  <CopyActionIcon confirmed={copied === "jsx"} />
                </button>
              </Tooltip>
            </div>
            <HighlightedCode code={snippet} />
          </section>
        ) : null}
      </main>

      <aside className="inspector" aria-label="Particle assembly fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={resetControls} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          {svgEditorOpen ? (
            <div
              role="dialog"
              aria-label="Paste SVG code"
              onKeyDown={(event) => {
                if (event.key === "Escape") setSvgEditorOpen(false);
              }}
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
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "grid", gap: 3 }}>
                  <strong style={{ color: "#dfe4df", fontSize: 10, fontWeight: 500 }}>SVG logo</strong>
                  <span style={{ color: "#697069", font: '7px/1.2 "SFMono-Regular", Consolas, monospace' }}>Paste a complete SVG element. It stays local.</span>
                </div>
              </div>
              <textarea
                className="particleSvgTextarea"
                ref={svgEditorRef}
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
                <button type="button" onClick={() => setSvgEditorOpen(false)} style={{ height: 27, padding: "0 9px", border: "1px solid #2f332f", borderRadius: 6, background: "transparent", color: "#8e958f", fontSize: 8, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => { setSvgMarkup(svgDraft); setSvgEditorOpen(false); }} style={{ height: 27, padding: "0 10px", border: 0, borderRadius: 6, background: "#d8ff2f", color: "#10120d", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Apply SVG</button>
              </div>
            </div>
          ) : null}
          <PaletteEditor
            stops={[
              { key: "background", label: "Background", value: dial.values.color.background },
              { key: "shadow", label: "Shadow", value: dial.values.color.shadow },
              { key: "surface", label: "Surface", value: dial.values.color.surface },
              { key: "highlight", label: "Highlight", value: dial.values.color.highlight },
            ]}
            onChange={(key, value) => dial.setValue(`color.${key}`, value)}
          />
        </div>
      </aside>
    </div>
  );
}
