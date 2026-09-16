"use client";

import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Brand } from "./model";

const Field = lazy(() => import("../components/SolaceFieldShader").then(m => ({ default: m.SolaceFieldShader })));
const Thermal = lazy(() => import("../components/ThermalPixelShader").then(m => ({ default: m.ThermalPixelShader })));
const Etch = lazy(() => import("../components/ThermalEtchBurn").then(m => ({ default: m.ThermalEtchBurn })));
const Particle = lazy(() => import("../components/ParticleMorphShader").then(m => ({ default: m.ParticleMorphShader })));
const Lens = lazy(() => import("../components/RefractiveLens").then(m => ({ default: m.RefractiveLens })));
const Exposure = lazy(() => import("../components/ExposureGrid").then(m => ({ default: m.ExposureGrid })));
const Fluid = lazy(() => import("../components/FluidDistortion").then(m => ({ default: m.FluidDistortion })));
const Blackhole = lazy(() => import("../components/BlackholeLensing").then(m => ({ default: m.BlackholeLensing })));
const Specimen = lazy(() => import("../components/SpecimenIndex").then(m => ({ default: m.SpecimenIndex })));

const variants = {
  "viscous-cursor-dye": "viscous", "reaction-bloom": "reaction", "cellular-contagion": "cellular",
  "repulsion-lattice": "repulsion", "magnetic-pixels": "magnetic", "chromatic-refraction": "chromatic",
} as const;

function releaseDetachedSource(canvas: HTMLCanvasElement | null) {
  if (canvas && !canvas.isConnected) {
    // Public renderers delete their own resources. Explicitly release the private
    // preview's context slot as well, rather than waiting for browser GC.
    canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

class MaterialBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Renderer({ id, brand, palette }: { id: string; brand: Brand; palette: "Original" | "Brand" }) {
  const mapped = palette === "Brand";
  const background = "#151b17", paper = "#f0efe7";
  const fieldColors = mapped ? { background, primary: brand.primary, secondary: brand.secondary, highlight: paper } : undefined;
  const shared = { className: "bl-source-canvas" };
  const media = { src: brand.media, mediaType: brand.mediaType };
  if (id in variants) return <Field {...shared} variant={variants[id as keyof typeof variants]} palette={id === "chromatic-refraction" ? "acid" : "signal"} colors={fieldColors} speed={0.3} scale={1} distortion={0.8} />;
  switch (id) {
    case "thermal-pixel-ink": return <Thermal {...shared} cellSize={9} ambient={0.6} speed={0.35} colors={mapped ? { background, shadow: "#25372c", cool: brand.primary, warm: brand.secondary, hot: paper, peak: "#ffffff" } : undefined} />;
    case "thermal-etch-burn": return <Etch {...shared} src={brand.mediaType === "image" ? brand.media : undefined} speed={0.24} grain={0.35} colors={mapped ? { ink: background, paper: "#667950", cool: brand.primary, warm: brand.secondary, hot: paper, peak: "#ffffff" } : undefined} />;
    case "particle-assembly": return <Particle {...shared} preset="word" text={brand.name.slice(0, 12)} particleCount={1200} size={4} duration={7} palette="acid" colors={mapped ? { background, shadow: "#6b7446", surface: brand.primary, highlight: paper } : undefined} />;
    case "refractive-lens": return <Lens {...shared} {...media} mode="static" shape="circle" size={0.7} refraction={1.25} dispersion={0.6} />;
    case "exposure-grid": return <Exposure {...shared} {...media} columns={3} rows={3} grain={0.3} colors={mapped ? { accent: brand.primary, secondary: brand.secondary, ink: background, paper, grid: paper } : undefined} />;
    case "fluid-distortion": return <Fluid {...shared} {...media} composition="media" current="orbit" character="silk" distortion={0.6} gloss={0.5} colors={mapped ? { background, bloomA: brand.primary, bloomB: brand.secondary, bloomC: "#658b68", highlight: paper } : undefined} />;
    case "blackhole-lensing": return <Blackhole {...shared} {...media} mode="orbit" radius={0.18} lens={0.34} orbit={0.5} colors={mapped ? { background, accretion: brand.primary, photonRing: brand.secondary, singularity: "#040604" } : undefined} />;
    case "specimen-index": return <Specimen {...shared} {...media} mode="auto" probes={3} motion={0.2} colors={mapped ? { paper, ink: background, frame: paper, accent: brand.primary, secondary: brand.secondary } : undefined} />;
    default: throw new Error(`No Brand Lab adapter for ${id}`);
  }
}

export function ShaderMaterial({ id, brand, palette, sceneRef, onStatus }: {
  id: string | null; brand: Brand; palette: "Original" | "Brand";
  sceneRef: RefObject<HTMLDivElement | null>; onStatus: (value: string) => void;
}) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const reducedRef = useRef(false);
  const intersectingRef = useRef(true);
  const lastSourceRef = useRef<HTMLCanvasElement | null>(null);
  const fail = useCallback((message: string) => {
    sceneRef.current?.querySelectorAll("canvas[data-material]").forEach(canvas => canvas.removeAttribute("data-ready"));
    onStatus(message);
    setRunning(false);
  }, [sceneRef, onStatus]);
  useEffect(() => () => releaseDetachedSource(lastSourceRef.current), []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedRef.current = motion.matches;
      setRunning(intersectingRef.current && !document.hidden);
      setGeneration(value => value + 1);
    };
    const observer = new IntersectionObserver(entries => { intersectingRef.current = entries[0].isIntersecting; sync(); });
    observer.observe(scene);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); motion.removeEventListener("change", sync); };
  }, [sceneRef]);

  useEffect(() => {
    // Resume a still/failed preview after an edit. Live renderers keep their
    // canvas and update uniforms through the public components' settings refs.
    const frame = requestAnimationFrame(() => {
      if (intersectingRef.current && !document.hidden) setRunning(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [id, brand, palette]);

  useEffect(() => {
    if (!id || !running) {
      releaseDetachedSource(lastSourceRef.current);
      lastSourceRef.current = null;
      return;
    }
    let frame = 0, last = 0, copies = 0, finished = false;
    const started = performance.now();
    onStatus("Preparing material…");
    const copy = (now: number) => {
      if (finished) return;
      const source = sourceRef.current?.querySelector("canvas");
      if (source && source.width > 1 && now - last >= 33) {
        if (source !== lastSourceRef.current) {
          releaseDetachedSource(lastSourceRef.current);
          lastSourceRef.current = source;
        }
        const gl = source.getContext("webgl2");
        if (!gl || gl.isContextLost()) { fail("Live material unavailable. Showing the original artwork."); finished = true; return; }
        if (!gl.getParameter(gl.CURRENT_PROGRAM)) {
          if (now - started > 12000) { fail("Material could not load. Showing the original artwork."); finished = true; return; }
          frame = requestAnimationFrame(copy);
          return;
        }
        // Sample the hidden source during the animation-frame phase. Its last
        // rendered buffer is retained because it never enters page compositing.
        const destinations = sceneRef.current?.querySelectorAll<HTMLCanvasElement>("canvas[data-material]");
        destinations?.forEach(target => {
          const bounds = target.getBoundingClientRect();
          const width = Math.max(1, Math.round(bounds.width));
          const height = Math.max(1, Math.round(bounds.height));
          if (target.width !== width || target.height !== height) { target.width = width; target.height = height; }
          const context = target.getContext("2d", { alpha: false });
          if (!context) return;
          const scale = Math.max(width / source.width, height / source.height);
          const sw = width / scale, sh = height / scale;
          context.drawImage(source, (source.width - sw) / 2, (source.height - sh) / 2, sw, sh, 0, 0, width, height);
          // The first copy can precede the lazy renderer's first draw callback.
          // Keep original artwork visible until a subsequent rendered frame.
          if (copies > 0) target.dataset.ready = "true";
          target.dataset.frame = String(copies + 1);
        });
        last = now; copies++;
        if (copies === 2) onStatus("");
        if (reducedRef.current && now - started > 1600) { setRunning(false); finished = true; return; }
      }
      if (now - started > 12000 && copies === 0) { fail("Material could not load. Showing the original artwork."); return; }
      frame = requestAnimationFrame(copy);
    };
    frame = requestAnimationFrame(copy);
    const forward = (event: PointerEvent) => {
      const source = sourceRef.current?.querySelector("canvas");
      const target = (event.target as HTMLElement).closest(".bl-surface");
      if (!source || !target) return;
      const rect = target.getBoundingClientRect(), sourceRect = source.getBoundingClientRect();
      source.dispatchEvent(new PointerEvent("pointermove", { clientX: sourceRect.left + (event.clientX - rect.left) / rect.width * sourceRect.width, clientY: sourceRect.top + (event.clientY - rect.top) / rect.height * sourceRect.height }));
    };
    const scene = sceneRef.current;
    scene?.addEventListener("pointermove", forward);
    return () => { finished = true; cancelAnimationFrame(frame); scene?.removeEventListener("pointermove", forward); };
  }, [id, running, brand, palette, generation, onStatus, sceneRef, fail]);

  if (!id || !running) return null;
  return <div className="bl-source" ref={sourceRef} aria-hidden="true" inert>
    <MaterialBoundary key={`${id}-${generation}`} onFailure={() => fail("This material could not render. Showing the original artwork.")}>
      <Suspense fallback={null}><Renderer id={id} brand={brand} palette={palette} /></Suspense>
    </MaterialBoundary>
  </div>;
}
