"use client";

import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { ShaderTuning } from "./shader-controls";
import { usesBrandMedia, type Brand, type SceneId } from "./model";
import { nativeKind, nativeSettings, variants } from "./native-settings";
import type { NativeSnapshot } from "./native-snapshot";

const Field = lazy(() => import("../components/SolaceFieldShader").then(m => ({ default: m.SolaceFieldShader })));
const Thermal = lazy(() => import("../components/ThermalPixelShader").then(m => ({ default: m.ThermalPixelShader })));
const Etch = lazy(() => import("../components/ThermalEtchBurn").then(m => ({ default: m.ThermalEtchBurn })));
const Particle = lazy(() => import("../components/ParticleMorphShader").then(m => ({ default: m.ParticleMorphShader })));
const Lens = lazy(() => import("../components/RefractiveLens").then(m => ({ default: m.RefractiveLens })));
const Exposure = lazy(() => import("../components/ExposureGrid").then(m => ({ default: m.ExposureGrid })));
const Fluid = lazy(() => import("../components/FluidDistortion").then(m => ({ default: m.FluidDistortion })));
const Blackhole = lazy(() => import("../components/BlackholeLensing").then(m => ({ default: m.BlackholeLensing })));
const Specimen = lazy(() => import("../components/SpecimenIndex").then(m => ({ default: m.SpecimenIndex })));

// One native renderer supplies every asset. Directed crop windows give each
// surface its own expression without multiplying WebGL contexts or changing
// the framing of shaders that process uploaded media.
const materialWindows: Record<string, { x: number; y: number; zoom: number }> = {
  poster: { x: .5, y: .5, zoom: 1 },
  study: { x: .18, y: .62, zoom: 1.35 },
  wordmark: { x: .78, y: .3, zoom: 1.35 },
  "identity-mark": { x: .28, y: .68, zoom: 1.35 },
  "identity-tile": { x: .76, y: .24, zoom: 1.55 },
  "identity-material": { x: .5, y: .38, zoom: 1.1 },
  "web-hero": { x: .7, y: .3, zoom: 1.25 },
  "web-feature": { x: .2, y: .74, zoom: 1.5 },
  "web-cta": { x: .82, y: .5, zoom: 1.15 },
};

function releaseDetachedSource(canvas: HTMLCanvasElement | null) {
  if (canvas && !canvas.isConnected) {
    // Public renderers delete their own resources. Explicitly release the private
    // preview's context slot as well, rather than waiting for browser GC.
    canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

function sceneIsVisible(scene: HTMLDivElement | null) {
  if (!scene || document.hidden) return false;
  const rect = scene.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
}

class MaterialBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Renderer({ id, brand, palette, tuning, native }: { id: string; brand: Brand; palette: "Original" | "Brand"; tuning: ShaderTuning; native?: NativeSnapshot }) {
  const settings = nativeSettings(brand, palette, id, tuning);
  const kind = nativeKind(id);
  if (native && kind) (settings as unknown as Record<string, unknown>)[kind] = native;
  const shared = { className: "bl-source-canvas" };
  const media = { src: brand.media, mediaType: brand.mediaType };
  if (Object.hasOwn(variants, id)) return <Field {...shared} variant={variants[id as keyof typeof variants]} settings={settings.field} />;
  switch (id) {
    case "thermal-pixel-ink": return <Thermal {...shared} settings={settings.thermal} />;
    case "thermal-etch-burn": return <Etch {...shared} src={brand.mediaType === "image" ? brand.media : undefined} settings={settings.etch} />;
    case "particle-assembly": return <Particle {...shared} settings={settings.particle} />;
    case "refractive-lens": return <Lens {...shared} {...media} settings={settings.lens} />;
    case "exposure-grid": return <Exposure {...shared} {...media} settings={settings.exposure} />;
    case "fluid-distortion": return <Fluid {...shared} {...media} settings={settings.fluid} />;
    case "blackhole-lensing": return <Blackhole {...shared} {...media} settings={settings.blackhole} />;
    case "specimen-index": return <Specimen {...shared} {...media} settings={settings.specimen} />;
    default: throw new Error(`No Brand Lab adapter for ${id}`);
  }
}

export function ShaderMaterial({ id, brand, palette, native, sceneRef, onStatus, retryKey, tuning, scene, paused }: {
  id: string | null; brand: Brand; palette: "Original" | "Brand";
  native?: NativeSnapshot; sceneRef: RefObject<HTMLDivElement | null>; onStatus: (value: string) => void; retryKey: number; tuning: ShaderTuning; scene: SceneId; paused: boolean;
}) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const reducedRef = useRef(false);
  const intersectingRef = useRef(true);
  const lastSourceRef = useRef<HTMLCanvasElement | null>(null);
  const fail = useCallback((message: string) => {
    sceneRef.current?.querySelectorAll("canvas[data-material]").forEach(canvas => canvas.removeAttribute("data-ready"));
    sceneRef.current?.setAttribute("data-material-failed", "true");
    onStatus(message);
    setRunning(false);
  }, [sceneRef, onStatus]);
  useEffect(() => () => releaseDetachedSource(lastSourceRef.current), []);

  useEffect(() => { sceneRef.current?.removeAttribute("data-material-failed"); }, [id, scene, retryKey, sceneRef]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedRef.current = motion.matches;
      // Observer callbacks can describe a prior layout after viewport/capture
      // changes. Read current bounds before pausing the private renderer.
      intersectingRef.current = sceneIsVisible(scene);
      setRunning(intersectingRef.current && !paused);
    };
    const motionChanged = () => { setGeneration(value => value + 1); sync(); };
    const observer = new IntersectionObserver(sync);
    observer.observe(scene);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", motionChanged);
    sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); motion.removeEventListener("change", motionChanged); };
  }, [sceneRef, scene, paused]);

  useEffect(() => {
    // Resume a still/failed preview after an edit. Live renderers keep their
    // canvas and update uniforms through the public components' settings refs.
    const frame = requestAnimationFrame(() => {
      intersectingRef.current = sceneIsVisible(sceneRef.current);
      if (intersectingRef.current && !paused) setRunning(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [id, brand, palette, native, tuning, retryKey, scene, sceneRef, paused]);

  useEffect(() => {
    if (!id || !running) {
      releaseDetachedSource(lastSourceRef.current);
      lastSourceRef.current = null;
      return;
    }
    let frame = 0, last = 0, copies = 0, finished = false;
    let observedSource: HTMLCanvasElement | null = null, sourceStarted = 0, hasDrawn = false;
    const started = performance.now();
    if (!sceneRef.current?.querySelector('canvas[data-ready="true"]')) onStatus("Preparing material…");
    const copy = (now: number) => {
      if (finished) return;
      const source = sourceRef.current?.querySelector("canvas");
      const interval = 1000 / 30;
      if (source && source.width > 1 && now - last >= interval) {
        if (source !== observedSource) {
          observedSource = source; sourceStarted = now; hasDrawn = false;
        }
        if (source !== lastSourceRef.current) {
          releaseDetachedSource(lastSourceRef.current);
          lastSourceRef.current = source;
        }
        const gl = source.getContext("webgl2");
        if (!gl || gl.isContextLost()) { fail("Live material unavailable. Showing the original artwork."); finished = true; return; }
        if (!hasDrawn && !gl.getParameter(gl.CURRENT_PROGRAM)) {
          if (now - sourceStarted > 12000) { fail("Material could not load. Showing the original artwork."); finished = true; return; }
          frame = requestAnimationFrame(copy);
          return;
        }
        hasDrawn = true;
        // Sample the hidden source during the animation-frame phase. Its last
        // rendered buffer is retained because it never enters page compositing.
        const destinations = sceneRef.current?.querySelectorAll<HTMLCanvasElement>("canvas[data-material]");
        destinations?.forEach(target => {
          const bounds = target.getBoundingClientRect();
          // Seed every role on a new material/edit, and capture complete stills
          // for reduced motion. Live offscreen roles retain their last frame;
          // they resume copying automatically as scrolling brings them into view.
          if (copies > 1 && !reducedRef.current && (bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth)) return;
          const width = Math.max(1, Math.round(bounds.width));
          const height = Math.max(1, Math.round(bounds.height));
          if (target.width !== width || target.height !== height) { target.width = width; target.height = height; }
          const context = target.getContext("2d", { alpha: false });
          if (!context) return;
          const scale = Math.max(width / source.width, height / source.height);
          const window = usesBrandMedia(id, brand.mediaType) ? undefined : materialWindows[target.dataset.material ?? ""];
          const zoom = window?.zoom ?? 1;
          const sw = width / scale / zoom, sh = height / scale / zoom;
          const x = window?.x ?? .5, y = window?.y ?? .5;
          context.drawImage(source, (source.width - sw) * x, (source.height - sh) * y, sw, sh, 0, 0, width, height);
          // The first copy can precede the lazy renderer's first draw callback.
          // Keep original artwork visible until a subsequent rendered frame.
          if (copies > 0) target.dataset.ready = "true";
          target.dataset.frame = String(copies + 1);
        });
        last = now - (now - last) % interval; copies++;
        if (copies === 2) onStatus("");
        if (reducedRef.current && now - started > 1600) { setRunning(false); finished = true; return; }
      }
      // Lazy module loading and a mounted renderer's first draw are different
      // phases. A slow chunk must not consume the first-draw grace period.
      if (!observedSource && now - started > 30000) { fail("Material could not load. Showing the original artwork."); return; }
      frame = requestAnimationFrame(copy);
    };
    frame = requestAnimationFrame(copy);
    const forward = (event: PointerEvent) => {
      const source = sourceRef.current?.querySelector("canvas");
      const target = (event.target as HTMLElement).closest(".bl-surface");
      if (!source) return;
      if (!target) { source.dispatchEvent(new PointerEvent("pointerleave")); return; }
      const rect = target.getBoundingClientRect(), sourceRect = source.getBoundingClientRect();
      source.dispatchEvent(new PointerEvent("pointermove", { clientX: sourceRect.left + (event.clientX - rect.left) / rect.width * sourceRect.width, clientY: sourceRect.top + (event.clientY - rect.top) / rect.height * sourceRect.height }));
    };
    const scene = sceneRef.current;
    const leave = () => sourceRef.current?.querySelector("canvas")?.dispatchEvent(new PointerEvent("pointerleave"));
    scene?.addEventListener("pointermove", forward);
    scene?.addEventListener("pointerleave", leave);
    return () => { finished = true; cancelAnimationFrame(frame); scene?.removeEventListener("pointermove", forward); scene?.removeEventListener("pointerleave", leave); };
  }, [id, running, brand, palette, native, tuning, scene, generation, retryKey, onStatus, sceneRef, fail]);

  if (!id || !running) return null;
  return <div className="bl-source" ref={sourceRef} aria-hidden="true" inert>
    <MaterialBoundary key={`${id}-${generation}-${retryKey}`} onFailure={() => fail("This material could not render. Showing the original artwork.")}>
      <Suspense fallback={null}><Renderer id={id} brand={brand} palette={palette} tuning={tuning} native={native} /></Suspense>
    </MaterialBoundary>
  </div>;
}
