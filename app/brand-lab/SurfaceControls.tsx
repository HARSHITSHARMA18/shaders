"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { PlacementPicker } from "./PlacementPicker";
import { type Surface, type Placement, type Treatment } from "./model";
import { COPY_FIELDS, copyValue, type SurfaceCopy } from "./surface-copy";

export function SurfaceControls({ surface, treatment, enabled, paused, materialReady, onPause, focusOnOpen, sceneRef, brandName, copy, onCopyChange, onDownload, onChange, onClose, modes }: {
  modes?: readonly Placement[]; surface: Surface; treatment: Treatment; enabled: boolean; paused: boolean; materialReady: boolean; onPause: () => void; focusOnOpen: boolean;
  sceneRef: RefObject<HTMLDivElement | null>; brandName: string; copy: SurfaceCopy; onCopyChange: (key: string, value: string) => void; onDownload: () => Promise<void>; onChange: (next: Partial<Treatment>) => void; onClose: () => void;
}) {
  const [position, setPosition] = useState<{ left: number; top: number; visible: boolean } | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "working" | "error">("idle");
  const panel = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (!focusOnOpen) focused.current = false;
    if (focusOnOpen && position?.visible && !focused.current) {
      panel.current?.querySelector<HTMLButtonElement>(".bl-placement-trigger")?.focus({ preventScroll: true });
      focused.current = true;
    }
  }, [focusOnOpen, position?.visible]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const asset = sceneRef.current?.querySelector(`[data-surface-id="${surface.id}"]`);
      if (!asset) return;
      const rect = asset.getBoundingClientRect();
      const width = 264, height = panel.current?.offsetHeight ?? 190;
      const left = rect.right + width + 16 < innerWidth - 20 ? rect.right + 16 : Math.max(20, rect.right - width - 12);
      setPosition({ left, top: Math.max(20, Math.min(rect.top + 12, innerHeight - height - 20)), visible: rect.bottom > 0 && rect.top < innerHeight });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); };
  }, [surface.id, sceneRef]);
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (panel.current?.contains(target)) return;
      if (target.closest?.("[data-surface-id]")) return;
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);
  const close = () => {
    sceneRef.current?.querySelector<HTMLElement>(`[data-surface-id="${surface.id}"]`)?.focus({ preventScroll: true });
    onClose();
  };
  return <div id="bl-surface-controls" ref={panel} className="bl-surface-controls" role="region" aria-label={`${surface.label} controls`} style={{ left: position?.left, top: position?.top, visibility: position?.visible ? "visible" : "hidden" }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
  }}>
    <div className="bl-surface-controls-heading"><span><small>SURFACE TREATMENT</small><strong>{surface.label}</strong></span><button aria-label="Close surface controls" onClick={close}>×</button></div>
    <PlacementPicker value={treatment.placement} modes={modes ?? surface.modes} onChange={placement => onChange({ placement })} />
    <label className="bl-strength"><span>Strength</span><output>{treatment.intensity}%</output><input aria-label="Material strength" type="range" min="0" max="100" value={treatment.intensity} disabled={!enabled} onChange={event => onChange({ intensity: Number(event.target.value) })} /></label>
    <p>{enabled ? "Strength blends material with the original." : "Choose a material to apply a treatment."}</p>
    <div className="bl-surface-copy"><span className="bl-copy-heading">ASSET COPY</span>{(COPY_FIELDS[surface.id] ?? []).map(field => <label key={field.key}><span>{field.label}</span><textarea aria-label={`${surface.label} ${field.label}`} maxLength={180} rows={field.fallback.includes("\n") ? 3 : 2} value={copyValue(copy, field.key, field.key === "material-note" ? `MATERIAL / ${brandName}` : field.fallback)} onChange={event => onCopyChange(field.key, event.target.value)} /></label>)}</div>
    {enabled && <div className="bl-asset-motion"><span>FRAME</span><button type="button" aria-pressed={paused} disabled={!materialReady || downloadState === "working"} onClick={onPause}>{paused ? (
      <>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-player-play" aria-hidden="true">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
        </svg>
        <span>Resume motion</span>
      </>
    ) : (
      <>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-player-pause" aria-hidden="true">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M6 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
          <path d="M14 6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1l0 -12" />
        </svg>
        <span>Pause at this frame</span>
      </>
    )}</button></div>}
    <div className="bl-asset-actions"><button type="button" disabled={downloadState === "working"} onClick={async () => { setDownloadState("working"); try { await onDownload(); setDownloadState("idle"); } catch { setDownloadState("error"); } }}>{downloadState === "working" ? "Rendering image…" : (
        <>
          <span>Download PNG</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-file-download" aria-hidden="true">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
            <path d="M12 17v-6" />
            <path d="M9.5 14.5l2.5 2.5l2.5 -2.5" />
          </svg>
        </>
      )}</button><span>{surface.width} × {surface.height}</span></div>
    {enabled && <p className="bl-frame-note">{paused ? "This frame is held for your PNG." : "Download will hold the current frame for you."}</p>}
    {downloadState === "error" && <p role="alert">Export could not finish. Let the material load, then try again.</p>}
  </div>;
}
