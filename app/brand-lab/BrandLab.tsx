"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShadersLogo } from "../components/ShadersLogo";
import { PaletteEditor } from "../components/PaletteEditor";
import { createSetup, setupQuery, DEFAULT_TREATMENTS, IDENTITY_TREATMENTS, WEB_TREATMENTS, type BrandLabSetup } from "./setup";
import { WebScene } from "./WebScene";
import { CanvasFrame } from "./CanvasFrame";
import { IdentityScene } from "./IdentityScene";
import { CampaignScene } from "./CampaignScene";
import { ShaderMaterial } from "./ShaderMaterial";
import { ShaderControlsDrawer } from "./ShaderControlsDrawer";
import { EMPTY_TUNING, type ShaderTuning } from "./shader-controls";
import { SurfaceControls } from "./SurfaceControls";
import { DEFAULT_BRAND, MEDIA_SHADERS, sceneSurfaces, sceneLabel, type SceneId, supportsBrandPalette, type Brand, type ShaderEntry, type Treatment } from "./model";
import type { SurfaceCopy } from "./surface-copy";
import { downloadAsset } from "./asset-export";
import type { NativeSnapshot } from "./native-snapshot";

function decodeUpload(url: string, kind: "image" | "video"): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("This file took too long to open. Try a smaller file.")); }, 10000);
    const element = kind === "video" ? document.createElement("video") : new Image();
    const cleanup = () => { clearTimeout(timeout); element.onload = null; element.onerror = null; if (element instanceof HTMLVideoElement) { element.onloadeddata = null; element.removeAttribute("src"); element.load(); } };
    const loaded = () => { cleanup(); resolve(); };
    element.onerror = () => { cleanup(); reject(new Error("This file could not be opened. Your previous asset is still in place.")); };
    if (element instanceof HTMLVideoElement) { element.muted = true; element.preload = "auto"; element.onloadeddata = loaded; } else element.onload = loaded;
    element.src = url;
  });
}

export function BrandLab({ shaders, initialSetup, invalidSetup = false }: { shaders: ShaderEntry[]; initialSetup: BrandLabSetup | null; invalidSetup?: boolean }) {
  const [scene, setScene] = useState<SceneId>(initialSetup?.scene ?? "campaign");
  const [brand, setBrand] = useState<Brand>(initialSetup?.brand ?? DEFAULT_BRAND);
  const [shaderId, setShaderId] = useState<string | null>(initialSetup ? initialSetup.shaderId : "specimen-index");
  const [tuningOpen, setTuningOpen] = useState(false);
  const [tuningByShader, setTuningByShader] = useState<Record<string, ShaderTuning>>(initialSetup?.shaderId ? { [initialSetup.shaderId]: initialSetup.tuning } : {});
  const [nativeByShader, setNativeByShader] = useState<Record<string, NativeSnapshot>>(initialSetup?.shaderId && initialSetup.editorNative ? { [initialSetup.shaderId]: initialSetup.editorNative } : {});
  const [paused, setPaused] = useState(false);
  const [materialReady, setMaterialReady] = useState(false);
  const tuning = shaderId ? tuningByShader[shaderId] ?? EMPTY_TUNING : EMPTY_TUNING;
  const tuneButtonRef = useRef<HTMLButtonElement>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusControls, setFocusControls] = useState(false);
  const [palette, setPalette] = useState<"Original" | "Brand">(initialSetup?.palette ?? "Original");
  const [treatments, setTreatments] = useState<Record<string, Treatment>>({ ...DEFAULT_TREATMENTS, ...IDENTITY_TREATMENTS, ...WEB_TREATMENTS, ...initialSetup?.treatments });
  const [copy, setCopy] = useState<SurfaceCopy>(initialSetup?.copy ?? {});
  const [missingAssets, setMissingAssets] = useState(initialSetup?.missing ?? []);
  const [linkStatus, setLinkStatus] = useState("");
  const [status, setStatus] = useState("");
  const handleMaterialStatus = useCallback((value: string) => { setStatus(value); setMaterialReady(!value); }, []);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const urlsRef = useRef(new Set<string>());
  const uploadGeneration = useRef(0);
  const active = shaders.find(shader => shader.id === shaderId);
  const surface = sceneSurfaces(scene).find(surface => surface.id === selected);
  const paletteSupported = supportsBrandPalette(shaderId);

  useEffect(() => () => { uploadGeneration.current++; urlsRef.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const upload = async (file: File | undefined, destination: "logo" | "media") => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    if (!(file.type.startsWith("image/") || destination === "media" && isVideo)) { setUploadError("Choose an image for your logo, or an image/video for your campaign."); return; }
    if (file.size > (isVideo ? 40 : 12) * 1024 * 1024) { setUploadError(`Choose a file under ${isVideo ? 40 : 12} MB.`); return; }
    const generation = ++uploadGeneration.current;
    const url = URL.createObjectURL(file); urlsRef.current.add(url);
    setUploading(true); setUploadError("");
    try {
      await decodeUpload(url, isVideo ? "video" : "image");
      if (generation !== uploadGeneration.current) { URL.revokeObjectURL(url); urlsRef.current.delete(url); return; }
      setMissingAssets(current => current.filter(key => key !== destination));
      const previous = destination === "logo" ? brand.logo : brand.media;
      setPaused(false); setBrand(current => destination === "logo" ? { ...current, logo: url } : { ...current, media: url, mediaType: isVideo ? "video" : "image" });
      if (previous?.startsWith("blob:")) { URL.revokeObjectURL(previous); urlsRef.current.delete(previous); }
    } catch (error) { URL.revokeObjectURL(url); urlsRef.current.delete(url); if (generation === uploadGeneration.current) setUploadError((error as Error).message); }
    finally { if (generation === uploadGeneration.current) setUploading(false); }
  };
  const selectShader = (id: string | null) => { if (!id) setTuningOpen(false); setPaused(false); setMaterialReady(false); setLinkStatus(""); if (id && id === shaderId) setRetryKey(current => current + 1); setShaderId(id); setStatus(""); };
  const selectSurface = (id: string, keyboard = false) => { setTuningOpen(false); setFocusControls(keyboard); setSelected(current => (current === id ? null : id)); };
  const changeTreatment = (next: Partial<Treatment>) => { if (selected) setTreatments(current => ({ ...current, [selected]: { ...current[selected], ...next } })); };
  const resetBrand = () => { setPaused(false); setMissingAssets([]); uploadGeneration.current++; urlsRef.current.forEach(url => URL.revokeObjectURL(url)); urlsRef.current.clear(); setBrand(DEFAULT_BRAND); setUploadError(""); setUploading(false); };

  const setup = createSetup(brand, shaderId, palette, Object.fromEntries(sceneSurfaces(scene).map(surface => [surface.id, treatments[surface.id]])), tuning, scene, copy, shaderId ? nativeByShader[shaderId] : undefined);
  setup.missing = [...new Set([...setup.missing, ...missingAssets])];
  const closeTuning = () => { setTuningOpen(false); tuneButtonRef.current?.focus({ preventScroll: true }); };
  const changeTuning = (key: string, value: number) => { if (shaderId) { setPaused(false); setTuningByShader(current => ({ ...current, [shaderId]: { ...current[shaderId], [key]: value } })); setNativeByShader(current => current[shaderId] ? { ...current, [shaderId]: { ...current[shaderId], [key]: value } } : current); setLinkStatus(""); } };
  const choosePalette = (value: "Original" | "Brand") => { setPaused(false); if (shaderId) setNativeByShader(current => { const next = { ...current }; delete next[shaderId]; return next; }); setPalette(value); };
  const resetTuning = () => { choosePalette("Brand"); if (shaderId) setTuningByShader(current => ({ ...current, [shaderId]: {} })); setLinkStatus(""); };
  const toggleMotion = () => { if (shaderId && materialReady) setPaused(current => !current); };
  const freezeForDownload = async () => {
    if (!shaderId || paused) return;
    if (!materialReady) throw new Error("Material not ready");
    setPaused(true);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  };
  const copySetup = async () => {
    const url = new URL("/brand-lab", window.location.origin);
    url.search = setupQuery(setup);
    try {
      await navigator.clipboard.writeText(url.href);
      setLinkStatus(setup.missing.length ? "Link copied · uploads need replacing when reopened." : "Setup link copied.");
    } catch { setLinkStatus("Clipboard unavailable. Try again with browser clipboard access enabled."); }
  };

  return <div className="bl-page">
    <header className="catalogHeader bl-header">
      <Link className="wordmark" href="/" aria-label="Shaders by Solace home"><ShadersLogo className="solaceLogo" /><span>Shaders</span><span className="brandDivider">/</span><span className="brandSection">Solace</span></Link>
      <div className="bl-header-title">Brand Lab</div>
      <Link href="/" className="bl-back">All shaders ↗</Link>
    </header>
    <main className="bl-main">
      <div className="bl-intro">
        <div><span className="bl-kicker">SHADERS, IN CONTEXT</span><h1>See what belongs<br />in your brand.</h1></div>
        <div className="bl-intro-right"><p>A material, a mood, a visual language.<br />Try a shader. Make the identity yours.</p><button className="bl-brand-button" onClick={() => dialogRef.current?.showModal()}>Use your brand <span>↗</span></button></div>
      </div>
      {missingAssets.length > 0 && <div className="bl-setup-notice" role="status"><span>{sceneLabel(scene)} restored. Replace your {missingAssets.includes("logo") ? "logo" : ""}{missingAssets.length === 2 ? " and " : ""}{missingAssets.includes("media") ? "image or video" : ""} to complete it.</span><button type="button" onClick={() => dialogRef.current?.showModal()}>Replace assets ↗</button></div>}
      <div className="bl-workspace">
        <aside className="bl-shader-rail" aria-label="Choose a shader">
          <div className="bl-rail-heading"><span className="bl-rail-label">MATERIAL LIBRARY</span><span>{String(shaders.length).padStart(2, "0")}</span></div>
          <div className="bl-tile-grid">
            <button className="bl-shader-tile bl-original" aria-label="Original / No shader" aria-pressed={shaderId === null} onClick={() => selectShader(null)}><span className="bl-thumb bl-original-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="m6 17 5-5 3 3 4-5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="9" cy="9" r="1.3" fill="currentColor" /></svg></span><span className="bl-row-name">Original<small>No treatment</small></span></button>
            {shaders.map(shader => <button key={shader.id} className="bl-shader-tile" aria-label={shader.title} aria-pressed={shaderId === shader.id} onClick={() => selectShader(shader.id)}>
              <span className="bl-thumb"><NextImage src={`/brand-lab/previews/${shader.id}.png`} alt="" width={52} height={52} unoptimized onError={event => { event.currentTarget.style.visibility = "hidden"; }} /><span className="bl-tile-fallback">{String(shaders.indexOf(shader) + 1).padStart(2, "0")}</span></span><span className="bl-row-name">{shader.title}</span><span className="bl-tile-name">{shader.title}</span>
            </button>)}
          </div>
          <span className="bl-rail-count">One material.<br />A different expression.</span>
        </aside>
        <section className="bl-canvas-area" aria-label={`${sceneLabel(scene)} canvas`}>
          <CanvasFrame>
          <div className="bl-canvas-toolbar"><div className="bl-scene-switch" role="group" aria-label="Scene">{(["campaign", "identity", "web"] as const).map(id => <button type="button" key={id} aria-pressed={scene === id} onClick={() => { setSelected(null); setPaused(false); setMaterialReady(false); setStatus(""); setLinkStatus(""); setScene(id); }}>{sceneLabel(id)}<span>{id === "campaign" ? "01" : id === "identity" ? "02" : "03"}</span></button>)}</div><span className="bl-shader-label">{active?.title ?? "Original / No shader"}</span><div className="bl-canvas-actions"><button className="bl-motion-toggle" type="button" aria-label={paused ? "Resume shader motion" : "Pause shader motion"} aria-pressed={paused} disabled={!shaderId || !materialReady} onClick={toggleMotion}><span aria-hidden="true">{paused ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-player-play">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-player-pause">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
      <path d="M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
    </svg>
  )}</span><span>{paused ? "Resume" : "Pause"}</span></button><button ref={tuneButtonRef} className="bl-tune-trigger" type="button" disabled={!shaderId} aria-expanded={tuningOpen} aria-controls="bl-shader-controls" onClick={() => { setSelected(null); if (!tuningOpen && matchMedia("(max-width:650px)").matches) sceneRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); setTuningOpen(current => !current); }}>Tune shader <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 4h14M1 12h14" /><rect x="4" y="2" width="3" height="4" rx="1" fill="#e4e5dc" /><rect x="9" y="10" width="3" height="4" rx="1" fill="#e4e5dc" /></svg></button><button className="bl-reset" onClick={() => { setSelected(null); selectShader(null); }}>View original ↗</button></div></div>
          {scene === "web" ? <WebScene brand={brand} shaderId={shaderId} selected={selected} treatments={treatments} copy={copy} sceneRef={sceneRef} onSelect={selectSurface} /> : scene === "identity" ? <IdentityScene brand={brand} shaderId={shaderId} palette={paletteSupported ? palette : "Original"} native={shaderId ? nativeByShader[shaderId] : undefined} tuning={tuning} selected={selected} treatments={treatments} copy={copy} sceneRef={sceneRef} onSelect={selectSurface} /> : <CampaignScene brand={brand} shaderId={shaderId} selected={selected} treatments={treatments} copy={copy} sceneRef={sceneRef} onSelect={selectSurface} />}</CanvasFrame>
          <ShaderMaterial id={shaderId} brand={brand} palette={paletteSupported ? palette : "Original"} native={shaderId ? nativeByShader[shaderId] : undefined} sceneRef={sceneRef} onStatus={handleMaterialStatus} retryKey={retryKey} tuning={tuning} scene={scene} paused={paused} />
          {surface && <SurfaceControls key={surface.id} surface={surface} modes={shaderId === "particle-assembly" && surface.id === "identity-mark" ? ["Background"] : undefined} treatment={shaderId === "particle-assembly" && surface.id === "identity-mark" ? { ...treatments[surface.id], placement: "Background" } : treatments[surface.id]} enabled={Boolean(shaderId)} paused={paused} materialReady={materialReady} onPause={toggleMotion} focusOnOpen={focusControls} sceneRef={sceneRef} brandName={brand.name} copy={copy} onCopyChange={(key, value) => setCopy(current => ({ ...current, [key]: value }))} onDownload={async () => { await freezeForDownload(); const asset = sceneRef.current?.querySelector<HTMLElement>(`[data-surface-id="${surface.id}"]`); if (!asset || shaderId && !asset.querySelector('canvas[data-ready="true"]')) throw new Error("Material not ready"); await downloadAsset(asset, surface, brand.name); }} onChange={changeTreatment} onClose={() => setSelected(null)} />}
          <div className="bl-material-note" role="status">{status || (shaderId && !MEDIA_SHADERS.has(shaderId) ? "Generated material; your photograph stays original." : shaderId === "thermal-etch-burn" && brand.mediaType === "video" ? "Thermal Etch uses generated material with video. Choose an image to etch your media." : "")}</div>
        </section>
      </div>
      <footer className="bl-footer"><span role="status">{linkStatus || (invalidSetup ? "This setup link is invalid or unsupported. Showing the starting Campaign." : missingAssets.length ? "Setup restored · replace uploaded assets in Use your brand." : "From experiment to expression.")}</span><button type="button" onClick={() => void copySetup()}>Copy setup link</button>{shaderId ? <Link href={`/shaders/${shaderId}?${setupQuery(setup)}`}>Explore {active?.title.toLowerCase()} ↗</Link> : <Link href="/">Explore the shader collection ↗</Link>}</footer>
    </main>
    {tuningOpen && active && <ShaderControlsDrawer shader={active} brand={brand} palette={paletteSupported ? palette : "Original"} tuning={tuning} setup={setup} onChange={changeTuning} onPalette={choosePalette} onColor={(key, value) => { setPaused(false); setBrand(current => ({ ...current, [key]: value })); }} onReset={resetTuning} onClose={closeTuning} />}
    <dialog className="bl-brand-dialog" ref={dialogRef} aria-labelledby="bl-brand-title" onClick={event => {
      if (event.target === dialogRef.current) dialogRef.current?.close();
    }} onKeyDown={event => {
      if (event.key === "Escape" && (event.target as HTMLElement).closest(".paletteEditorMeta")) { event.preventDefault(); event.stopPropagation(); }
    }}>
      <div className="bl-dialog-top"><span className="bl-kicker">A LIGHTWEIGHT IDENTITY</span><button type="button" aria-label="Close brand controls" onClick={() => dialogRef.current?.close()}><svg viewBox="0 0 20 20" aria-hidden="true" width="13" height="13"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button></div>
      <h2 id="bl-brand-title">Make it yours.</h2><p>Just enough to see your brand in a new light.</p>
      <label>Brand name<input autoFocus value={brand.name} maxLength={24} onChange={event => { setPaused(false); setBrand(current => ({ ...current, name: event.target.value })); }} /></label>
      <label>Campaign line<input value={brand.tagline} maxLength={70} onChange={event => { setPaused(false); setBrand(current => ({ ...current, tagline: event.target.value })); }} /></label>
      <PaletteEditor title="Brand colors" summary="Primary / Secondary" ariaLabel="Brand color editor" stops={[{ key: "primary", label: "Primary", value: brand.primary }, { key: "secondary", label: "Secondary", value: brand.secondary }]} onChange={(key, value) => { setPaused(false); setBrand(current => ({ ...current, [key]: value })); }} />
      <label>Material palette<select value={shaderId && nativeByShader[shaderId] ? "Editor preset" : paletteSupported ? palette : "Original"} onChange={event => choosePalette(event.target.value as "Original" | "Brand")}>{shaderId && nativeByShader[shaderId] && <option disabled>Editor preset</option>}<option>Original</option><option disabled={!paletteSupported}>Brand</option></select></label>
      {!paletteSupported && <small>This lens keeps its native optical tint.</small>}
      <div className="bl-uploads"><label className="bl-upload">{brand.logo ? "Replace logo" : "+ Logo / wordmark"}<input aria-label="Upload logo" type="file" accept="image/*" disabled={uploading} onChange={event => { void upload(event.target.files?.[0], "logo"); event.target.value = ""; }} /></label><label className="bl-upload">+ Image / video<input aria-label="Upload campaign media" type="file" accept="image/*,video/*" disabled={uploading} onChange={event => { void upload(event.target.files?.[0], "media"); event.target.value = ""; }} /></label></div>
      <small>Files stay in this browser. Images ≤12 MB · Video ≤40 MB.</small>
      <div className="bl-upload-error" role="status">{uploading ? "Opening your asset…" : uploadError}</div>
      <div className="bl-dialog-bottom"><button type="button" onClick={resetBrand}>Reset identity</button><button type="button" className="bl-brand-button" onClick={() => dialogRef.current?.close()}>Back to canvas ↗</button></div>
    </dialog>
  </div>;
}
