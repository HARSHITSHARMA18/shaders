"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DialRoot, type DialConfig, useDialKitController } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import {
  DEFAULT_REFRACTIVE_LENS_SVG,
  REFRACTIVE_LENS_PALETTES,
  RefractiveLens,
  type RefractiveLensPalette,
  type RefractiveLensSettings,
} from "./RefractiveLens";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";
const DEFAULT_MEDIA_SOURCE = "/solaceui-renaissance.webp";

const DIAL_CONFIG = {
  source: {
    choose: { type: "action", label: "Choose image or video" },
    clear: { type: "action", label: "Use built-in composition" },
  },
  lens: {
    shape: {
      type: "select",
      options: [
        { value: "circle", label: "Circle" },
        { value: "rounded", label: "Rounded" },
        { value: "svg", label: "SVG mask" },
      ],
      default: "circle",
    },
    pasteSvg: { type: "action", label: "Paste SVG mask" },
    mode: {
      type: "select",
      options: [
        { value: "pointer", label: "Follow pointer" },
        { value: "static", label: "Fixed position" },
      ],
      default: "pointer",
    },
    size: [0.56, 0.16, 0.72, 0.01],
    radius: [0.74, 0, 1, 0.02],
  },
  color: {
    preset: {
      type: "select",
      options: [
        { value: "spectral", label: "Spectral crystal" },
        { value: "crystal", label: "Pure optic" },
        { value: "obsidian", label: "Obsidian smoked" },
        { value: "amber", label: "Warm amber" },
        { value: "emerald", label: "Emerald sage" },
        { value: "glacier", label: "Glacier ice" },
        { value: "amethyst", label: "Amethyst violet" },
        { value: "rose", label: "Rose quartz" },
      ],
      default: "spectral",
    },
    tint: { type: "color", default: REFRACTIVE_LENS_PALETTES.spectral.glassTint },
    tintStrength: [REFRACTIVE_LENS_PALETTES.spectral.tintStrength, 0, 0.6, 0.01],
  },
  optics: {
    refraction: [1.28, 0, 1.4, 0.02],
    magnification: [0.82, 0, 1, 0.02],
    frost: [0.04, 0, 0.8, 0.02],
    thickness: [0.78, 0, 1.4, 0.02],
    dispersion: [0.8, 0, 0.8, 0.02],
    follow: [0.08, 0.08, 1, 0.02],
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

export function RefractiveLensLab() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState(DEFAULT_MEDIA_SOURCE);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaName, setMediaName] = useState("Renaissance landscape");
  const [svgMarkup, setSvgMarkup] = useState(DEFAULT_REFRACTIVE_LENS_SVG);
  const [svgDraft, setSvgDraft] = useState(DEFAULT_REFRACTIVE_LENS_SVG);
  const [svgEditorOpen, setSvgEditorOpen] = useState(false);
  const dial = useDialKitController("Refractive lens", DIAL_CONFIG, {
    id: "solace-refractive-lens-v3",
    persist: true,
    onAction: (action) => {
      if (action === "source.choose") inputRef.current?.click();
      if (action === "source.clear") {
        setMediaUrl((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return DEFAULT_MEDIA_SOURCE; });
        setMediaName("Renaissance landscape");
      }
      if (action === "lens.pasteSvg") {
        setSvgDraft(svgMarkup);
        setSvgEditorOpen(true);
      }
    },
  });
  const selectedPreset = dial.values.color.preset as RefractiveLensPalette;
  const previousPreset = useRef(selectedPreset);
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => CANONICAL_ORIGIN);

  useEffect(() => {
    if (previousPreset.current === selectedPreset) return;
    previousPreset.current = selectedPreset;
    const palette = REFRACTIVE_LENS_PALETTES[selectedPreset];
    if (palette) {
      dial.setValues({
        color: { tint: palette.glassTint, tintStrength: palette.tintStrength },
      });
    }
  }, [dial, selectedPreset]);
  useEffect(() => () => { if (mediaUrl.startsWith("blob:")) URL.revokeObjectURL(mediaUrl); }, [mediaUrl]);

  const settings = useMemo<RefractiveLensSettings>(() => ({
    shape: dial.values.lens.shape as RefractiveLensSettings["shape"],
    mode: dial.values.lens.mode as RefractiveLensSettings["mode"],
    size: dial.values.lens.size,
    radius: dial.values.lens.radius,
    refraction: dial.values.optics.refraction,
    magnification: dial.values.optics.magnification,
    frost: dial.values.optics.frost,
    thickness: dial.values.optics.thickness,
    dispersion: dial.values.optics.dispersion,
    glassTint: dial.values.color.tint,
    tintStrength: dial.values.color.tintStrength,
    follow: dial.values.optics.follow,
    position: [0.5, 0.5],
  }), [dial.values]);

  const registryUrl = `${origin}/r/refractive-lens.json`;
  const registryCommand = `npx shadcn@latest add ${registryUrl}`;
  const svgDeclaration = settings.shape === "svg"
    ? `\nconst customSvg = \`${svgMarkup.replaceAll("`", "\\`").replaceAll("${", "\\${")}\`;\n`
    : "";
  const shapeProp = settings.shape === "svg" ? `shape="svg"\n    svgMask={customSvg}` : `shape="${settings.shape}"`;
  const snippet = `import { RefractiveLens } from "@/components/refractive-lens";
${svgDeclaration}

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <RefractiveLens
    // Optional: src="/artwork.jpg" or "/film.mp4"
    ${shapeProp}
    mode="${settings.mode}"
    size={${settings.size.toFixed(2)}}
    radius={${settings.radius.toFixed(2)}}
    refraction={${settings.refraction.toFixed(2)}}
    magnification={${settings.magnification.toFixed(2)}}
    frost={${settings.frost.toFixed(2)}}
    thickness={${settings.thickness.toFixed(2)}}
    dispersion={${settings.dispersion.toFixed(2)}}
    glassTint="${settings.glassTint}"
    tintStrength={${settings.tintStrength.toFixed(2)}}
    follow={${settings.follow.toFixed(2)}}
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
          <SolaceLogo className="solaceLogo" /><span>Solace</span><span className="brandDivider">/</span><span className="brandSection">Shaders</span>
        </Link>
      </header>
      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading">
            <div><Link className="backLink" href="/">← All shaders</Link><div className="eyebrow">Experiment 010 / Optical material</div><h1>Refractive lens</h1></div>
            <p>A shapeable glass surface for magnifying, bending, and directing focus through your own visual media.</p>
          </div>
          <div className="stage fieldStage refractiveLensStage">
            <RefractiveLens className="shaderCanvas" src={mediaUrl} mediaType={mediaType} svgMask={settings.shape === "svg" ? svgMarkup : undefined} settings={settings} />
            <div className="stageTop" aria-hidden="true"><span>{mediaName}</span><span>{settings.shape} lens · WebGL 2</span></div>
            <div className="stageBottom"><span>Move through the composition to redirect its focal plane</span><span className="stageHint">Your chosen media stays local</span></div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setMediaUrl((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return URL.createObjectURL(file); });
              setMediaType(file.type.startsWith("video/") ? "video" : "image");
              setMediaName(file.name);
              event.target.value = "";
            }}
          />
        </section>

        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro"><span className="eyebrow">Solace registry</span><h2 id="install-title">Add it to your project</h2><p>Installs one standalone lens with image, video, and SVG-mask support.</p></div>
          <div className="installCommand"><code>{registryCommand}</code><Tooltip content={copied === "install" ? "Copied" : "Copy command"}><button className={`iconActionButton${copied === "install" ? " isCopied" : ""}`} type="button" aria-label="Copy command" onClick={() => copy("install", registryCommand)}><CopyActionIcon confirmed={copied === "install"} /></button></Tooltip></div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}><button className="usageToggle iconActionButton" type="button" aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"} aria-expanded={codeOpen} aria-controls="configured-jsx" onClick={() => setCodeOpen((open) => !open)}><CodeActionIcon /></button></Tooltip>
        </section>
        {codeOpen ? <section className="codePanel" id="configured-jsx" aria-label="Configured component snippet"><div className="codePanelHeader"><div><span className="eyebrow">Current DialKit values</span><h2>Ready-to-paste usage</h2></div><Tooltip content={copied === "jsx" ? "Copied" : "Copy JSX"}><button className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`} type="button" aria-label="Copy JSX" onClick={() => copy("jsx", snippet)}><CopyActionIcon confirmed={copied === "jsx"} /></button></Tooltip></div><HighlightedCode code={snippet} /></section> : null}
      </main>

      <aside className="inspector" aria-label="Refractive lens fine-tuning controls">
        <div className="dialkitFrame">
          <PanelResetButton onReset={() => { dial.resetValues(); setSvgMarkup(DEFAULT_REFRACTIVE_LENS_SVG); setSvgDraft(DEFAULT_REFRACTIVE_LENS_SVG); }} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          {svgEditorOpen ? (
            <div role="dialog" aria-label="Paste SVG mask" style={{ position: "absolute", top: 148, left: 12, right: 12, zIndex: 20, padding: 10, border: "1px solid #353a35", borderRadius: 10, background: "#111311", boxShadow: "0 18px 45px rgba(0,0,0,.55)" }}>
              <div style={{ display: "grid", gap: 3, marginBottom: 8 }}><strong style={{ color: "#dfe4df", fontSize: 10, fontWeight: 500 }}>SVG lens mask</strong><span style={{ color: "#697069", font: '7px/1.2 "SFMono-Regular", Consolas, monospace' }}>Paste a complete SVG element. It stays local.</span></div>
              <textarea className="particleSvgTextarea" value={svgDraft} onChange={(event) => setSvgDraft(event.target.value)} wrap="soft" spellCheck={false} style={{ display: "block", boxSizing: "border-box", width: "100%", height: 132, resize: "none", padding: 9, border: "1px solid #2c302c", borderRadius: 7, outline: "none", background: "#090b0a", color: "#c2c9c3", font: '8px/1.45 "SFMono-Regular", Consolas, monospace', whiteSpace: "pre-wrap", overflowX: "hidden", overflowY: "auto", scrollbarWidth: "none", overflowWrap: "anywhere", wordBreak: "break-word" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}><button type="button" onClick={() => setSvgEditorOpen(false)} style={{ height: 27, padding: "0 9px", border: "1px solid #2f332f", borderRadius: 6, background: "transparent", color: "#8e958f", fontSize: 8, cursor: "pointer" }}>Cancel</button><button type="button" onClick={() => { setSvgMarkup(svgDraft); dial.setValue("lens.shape", "svg"); setSvgEditorOpen(false); }} style={{ height: 27, padding: "0 10px", border: 0, borderRadius: 6, background: "#d8ff2f", color: "#10120d", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Apply SVG</button></div>
            </div>
          ) : null}
          <PaletteEditor
            title="Glass tint"
            summary="Optical absorption & tone"
            ariaLabel="Glass tint editor"
            stops={[{ key: "tint", label: "Glass", value: dial.values.color.tint }]}
            onChange={(_, value) => dial.setValue("color.tint", value)}
          />
        </div>
      </aside>
    </div>
  );
}
