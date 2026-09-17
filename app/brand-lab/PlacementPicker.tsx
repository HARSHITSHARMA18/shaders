"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Placement } from "./model";

const descriptions: Record<Placement, string> = {
  Background: "Fill the whole surface",
  Media: "Within the media frame",
  Mask: "Shape with your identity",
};

export function PlacementPicker({ value, modes, onChange }: {
  value: Placement; modes: readonly Placement[]; onChange: (value: Placement) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };

  return <div className="bl-placement" ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === "Tab") setOpen(false);
  }}>
    <span className="bl-placement-label">Placement</span>
    <button ref={trigger} className="bl-placement-trigger" aria-label={`Placement: ${value}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => setOpen(current => !current)} onKeyDown={event => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
    }}>{value}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></button>
    {open && <div id={listId} role="listbox" aria-label="Placement" className="bl-placement-menu" onKeyDown={event => {
      const options = Array.from(root.current!.querySelectorAll<HTMLButtonElement>('[role="option"]'));
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      const target = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : event.key === "ArrowDown" ? (index + 1) % options.length : event.key === "ArrowUp" ? (index + options.length - 1) % options.length : null;
      if (target !== null) { event.preventDefault(); options[target]?.focus(); }
    }}>
      {modes.map(mode => <button key={mode} role="option" aria-selected={mode === value} tabIndex={-1} onClick={() => { onChange(mode); close(); }}><span><strong>{mode}</strong><small>{descriptions[mode]}</small></span><span aria-hidden="true">{mode === value ? "✓" : ""}</span></button>)}
    </div>}
  </div>;
}
