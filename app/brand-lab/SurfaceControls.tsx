"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { PlacementPicker } from "./PlacementPicker";
import { SURFACES, type Treatment } from "./model";

export function SurfaceControls({ surface, treatment, enabled, sceneRef, onChange, onClose }: {
  surface: typeof SURFACES[number]; treatment: Treatment; enabled: boolean;
  sceneRef: RefObject<HTMLDivElement | null>; onChange: (next: Partial<Treatment>) => void; onClose: () => void;
}) {
  const [position, setPosition] = useState<{ left: number; top: number; visible: boolean } | null>(null);
  const panel = useRef<HTMLDivElement>(null);
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
  const close = () => {
    sceneRef.current?.querySelector<HTMLElement>(`[data-surface-id="${surface.id}"]`)?.focus({ preventScroll: true });
    onClose();
  };
  return <div id="bl-surface-controls" ref={panel} className="bl-surface-controls" role="region" aria-label={`${surface.label} controls`} style={{ left: position?.left, top: position?.top, visibility: position?.visible ? "visible" : "hidden" }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); close(); }
  }}>
    <div className="bl-surface-controls-heading"><span><small>SURFACE TREATMENT</small><strong>{surface.label}</strong></span><button aria-label="Close surface controls" onClick={close}>×</button></div>
    <PlacementPicker value={treatment.placement} modes={surface.modes} onChange={placement => onChange({ placement })} />
    <label className="bl-strength"><span>Strength</span><output>{treatment.intensity}%</output><input aria-label="Material strength" type="range" min="0" max="100" value={treatment.intensity} disabled={!enabled} onChange={event => onChange({ intensity: Number(event.target.value) })} /></label>
    <p>{enabled ? "Strength blends material with the original." : "Choose a material to apply a treatment."}</p>
  </div>;
}
