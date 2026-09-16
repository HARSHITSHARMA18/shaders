"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { ShadersLogo } from "../components/ShadersLogo";
import { CampaignScene } from "./CampaignScene";
import { ShaderMaterial } from "./ShaderMaterial";
import { DEFAULT_BRAND, MEDIA_SHADERS, SURFACES, supportsBrandPalette, type Brand, type Placement, type ShaderEntry, type Treatment } from "./model";

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

export function BrandLab({ shaders }: { shaders: ShaderEntry[] }) {
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [shaderId, setShaderId] = useState<string | null>("viscous-cursor-dye");
  const [selected, setSelected] = useState<string | null>(null);
  const [palette, setPalette] = useState<"Original" | "Brand">("Brand");
  const [treatments, setTreatments] = useState<Record<string, Treatment>>({ poster: { placement: "Background", intensity: 100 }, study: { placement: "Media", intensity: 100 }, wordmark: { placement: "Mask", intensity: 100 } });
  const [status, setStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const urlsRef = useRef(new Set<string>());
  const uploadGeneration = useRef(0);
  const active = shaders.find(shader => shader.id === shaderId);
  const surface = SURFACES.find(surface => surface.id === selected);
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
      const previous = destination === "logo" ? brand.logo : brand.media;
      setBrand(current => destination === "logo" ? { ...current, logo: url } : { ...current, media: url, mediaType: isVideo ? "video" : "image" });
      if (previous?.startsWith("blob:")) { URL.revokeObjectURL(previous); urlsRef.current.delete(previous); }
    } catch (error) { URL.revokeObjectURL(url); urlsRef.current.delete(url); if (generation === uploadGeneration.current) setUploadError((error as Error).message); }
    finally { if (generation === uploadGeneration.current) setUploading(false); }
  };
  const selectShader = (id: string | null) => { setShaderId(id); setStatus(""); };
  const changeTreatment = (next: Partial<Treatment>) => { if (selected) setTreatments(current => ({ ...current, [selected]: { ...current[selected], ...next } })); };
  const resetBrand = () => { uploadGeneration.current++; urlsRef.current.forEach(url => URL.revokeObjectURL(url)); urlsRef.current.clear(); setBrand(DEFAULT_BRAND); setUploadError(""); setUploading(false); };

  return <div className="bl-page">
    <header className="catalogHeader bl-header">
      <Link className="wordmark" href="/" aria-label="Shaders by Solace home"><ShadersLogo className="solaceLogo" /><span>Shaders</span><span className="brandDivider">/</span><span className="brandSection">Solace</span></Link>
      <div className="bl-header-title">Brand Lab <span>First study</span></div>
      <Link href="/" className="bl-back">All shaders ↗</Link>
    </header>
    <main className="bl-main">
      <div className="bl-intro">
        <div><span className="bl-kicker">SHADERS, IN CONTEXT</span><h1>See what belongs<br />in your brand.</h1></div>
        <div className="bl-intro-right"><p>A material, a mood, a whole campaign.<br />Try a shader. Make the identity yours.</p><button className="bl-brand-button" onClick={() => dialogRef.current?.showModal()}>Use your brand <span>↗</span></button></div>
      </div>
      <div className="bl-workspace">
        <aside className="bl-shader-rail" aria-label="Choose a shader">
          <span className="bl-rail-label">MATERIALS</span>
          <div className="bl-tile-grid">
            <button className="bl-shader-tile bl-original" aria-label="Original / No shader" aria-pressed={shaderId === null} onClick={() => selectShader(null)} onMouseEnter={() => setHovered("Original")} onMouseLeave={() => setHovered(null)}><span>Ø</span><small>Original</small></button>
            {shaders.map(shader => <button key={shader.id} className="bl-shader-tile" aria-label={shader.title} aria-pressed={shaderId === shader.id} title={shader.title} onClick={() => selectShader(shader.id)} onMouseEnter={() => setHovered(shader.title)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(shader.title)} onBlur={() => setHovered(null)}>
              <NextImage src={`/brand-lab/previews/${shader.id}.png`} alt="" width={52} height={52} unoptimized onError={event => { event.currentTarget.style.visibility = "hidden"; }} /><span className="bl-tile-fallback">{String(shaders.indexOf(shader) + 1).padStart(2, "0")}</span><span className="bl-tile-name">{shader.title}</span>
            </button>)}
          </div>
          <div className="bl-rail-current" aria-hidden="true">{hovered ?? active?.title ?? "Original"}</div>
          <span className="bl-rail-count">{shaders.length} shaders<br />One shared identity.</span>
        </aside>
        <section className="bl-canvas-area" aria-label="Campaign canvas">
          <div className="bl-canvas-toolbar"><span className="bl-scene-label">Campaign <span>01</span></span><span className="bl-shader-label"><i />{active?.title ?? "Original / No shader"}</span><button className="bl-reset" onClick={() => { setSelected(null); selectShader(null); }}>View original ↗</button></div>
          <CampaignScene brand={brand} shaderId={shaderId} selected={selected} treatments={treatments} sceneRef={sceneRef} onSelect={setSelected} />
          <ShaderMaterial id={shaderId} brand={brand} palette={paletteSupported ? palette : "Original"} sceneRef={sceneRef} onStatus={setStatus} />
          <div className="bl-context" data-open={Boolean(surface)}>
            {surface ? <><span className="bl-context-title">{surface.label}</span><label>Placement<select aria-label="Placement" value={treatments[surface.id].placement} onChange={event => changeTreatment({ placement: event.target.value as Placement })}>{surface.modes.map(mode => <option key={mode}>{mode}</option>)}</select></label><label className="bl-strength">Strength<input aria-label="Material strength" type="range" min="0" max="100" value={treatments[surface.id].intensity} disabled={!shaderId} onChange={event => changeTreatment({ intensity: Number(event.target.value) })} /><output>{treatments[surface.id].intensity}%</output></label><button aria-label="Close surface controls" onClick={() => setSelected(null)}>×</button></> : <span>Select a surface to shape the material.</span>}
          </div>
          <div className="bl-material-note" role="status">{status || (shaderId && !MEDIA_SHADERS.has(shaderId) ? "Generated material; your photograph stays original." : shaderId === "thermal-etch-burn" && brand.mediaType === "video" ? "Thermal Etch uses generated material with video. Choose an image to etch your media." : "")}</div>
        </section>
      </div>
      <footer className="bl-footer"><span>From experiment to expression.</span>{shaderId ? <Link href={`/shaders/${shaderId}`}>Explore {active?.title.toLowerCase()} ↗</Link> : <Link href="/">Explore the shader collection ↗</Link>}</footer>
    </main>
    <dialog className="bl-brand-dialog" ref={dialogRef}>
      <div className="bl-dialog-top"><span className="bl-kicker">A LIGHTWEIGHT IDENTITY</span><button aria-label="Close brand controls" onClick={() => dialogRef.current?.close()}>×</button></div>
      <h2>Make it yours.</h2><p>Just enough to see your brand in a new light.</p>
      <label>Brand name<input autoFocus value={brand.name} maxLength={24} onChange={event => setBrand(current => ({ ...current, name: event.target.value }))} /></label>
      <label>Campaign line<input value={brand.tagline} maxLength={70} onChange={event => setBrand(current => ({ ...current, tagline: event.target.value }))} /></label>
      <div className="bl-colors"><label>Primary<input type="color" value={brand.primary} onChange={event => setBrand(current => ({ ...current, primary: event.target.value }))} /><span>{brand.primary.toUpperCase()}</span></label><label>Secondary<input type="color" value={brand.secondary} onChange={event => setBrand(current => ({ ...current, secondary: event.target.value }))} /><span>{brand.secondary.toUpperCase()}</span></label></div>
      <label>Material palette<select value={paletteSupported ? palette : "Original"} onChange={event => setPalette(event.target.value as "Original" | "Brand")}><option>Original</option><option disabled={!paletteSupported}>Brand</option></select></label>
      {!paletteSupported && <small>This lens keeps its native optical tint.</small>}
      <div className="bl-uploads"><label className="bl-upload">{brand.logo ? "Replace logo" : "+ Logo / wordmark"}<input aria-label="Upload logo" type="file" accept="image/*" disabled={uploading} onChange={event => { void upload(event.target.files?.[0], "logo"); event.target.value = ""; }} /></label><label className="bl-upload">+ Image / video<input aria-label="Upload campaign media" type="file" accept="image/*,video/*" disabled={uploading} onChange={event => { void upload(event.target.files?.[0], "media"); event.target.value = ""; }} /></label></div>
      <small>Files stay in this browser. Images ≤12 MB · Video ≤40 MB.</small>
      <div className="bl-upload-error" role="status">{uploading ? "Opening your asset…" : uploadError}</div>
      <div className="bl-dialog-bottom"><button onClick={resetBrand}>Reset identity</button><button className="bl-brand-button" onClick={() => dialogRef.current?.close()}>Back to canvas ↗</button></div>
    </dialog>
  </div>;
}
