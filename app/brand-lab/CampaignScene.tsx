"use client";

import type { CSSProperties, RefObject } from "react";
import Image from "next/image";
import { letterMask, usesBrandMedia, SURFACES, type Brand, type Treatment } from "./model";
import { copyValue, type SurfaceCopy } from "./surface-copy";

export function CampaignScene({ brand, shaderId, selected, treatments, copy, sceneRef, onSelect }: {
  brand: Brand; shaderId: string | null; selected: string | null;
  treatments: Record<string, Treatment>; copy: SurfaceCopy; sceneRef: RefObject<HTMLDivElement | null>; onSelect: (id: string, keyboard?: boolean) => void;
}) {
  const mask = brand.logo ?? letterMask(brand.name);
  const canvas = (id: string) => <canvas data-material={id} aria-hidden="true" className="bl-material" />;
  const style = (id: string): CSSProperties => ({
    "--material-strength": shaderId ? treatments[id].intensity / 100 : 0,
    "--brand-primary": brand.primary,
    "--material-mask": `url("${mask}")`,
  } as CSSProperties);
  const selection = (id: string) => ({
    role: "button" as const, tabIndex: 0, "aria-label": `Select ${SURFACES.find(surface => surface.id === id)?.label}`,
    "aria-pressed": selected === id, "data-selected": selected === id,
    "data-surface-id": id, "aria-controls": selected === id ? "bl-surface-controls" : undefined,
    "data-placement": treatments[id].placement, style: style(id),
    onClick: () => onSelect(id),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id, true); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".bl-surface-controls .bl-placement-trigger")?.focus({ preventScroll: true })); } },
  });
  const name = <span className="bl-brand-name">{brand.logo ? <Image src={brand.logo} alt={brand.name} width={140} height={40} unoptimized /> : brand.name}</span>;
  return <div className="bl-scene" ref={sceneRef} data-has-shader={Boolean(shaderId)}>
    <div className="bl-board-heading"><span>01 / A library, in three forms</span><span>{brand.name} · Visual system 2026</span></div>
    <div className="bl-composition">
      <div className="bl-poster-group">
        <div className="bl-poster bl-surface" data-shader={shaderId} {...selection("poster")}>
          <div className="bl-poster-base" />
          <div className="bl-material-layer">{canvas("poster")}</div>
          <div className="bl-poster-content">
            <div className="bl-poster-top">{name}<span className="bl-copy-text">{copyValue(copy, "poster-note", "Thoughtful blocks\nfor better pages.")}</span></div>
            <h2>{brand.tagline}</h2>
            <div className="bl-poster-bottom"><span className="bl-copy-text">{copyValue(copy, "poster-footer", "Build with clarity.\nMake it yours.")}</span><span>{brand.name.toUpperCase()}<br />EST. 2026</span><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 35 35 5M6 5h29v29" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>
          </div>
        </div>
        <div className="bl-asset-caption"><span>01 — Campaign poster</span><span>1080 × 1350</span></div>
      </div>
      <div className="bl-right-column">
        <div className="bl-study-group">
          <div className="bl-study bl-surface" data-generated={shaderId !== null && !usesBrandMedia(shaderId, brand.mediaType)} {...selection("study")}>
            <div className="bl-study-title"><span>ONE SYSTEM, TWO VOICES</span><span>S / 026</span></div>
            <div className="bl-study-window">
              <div className="bl-pair-sheet bl-pair-photo">
                <div className="bl-pair-sheet-top"><span>{brand.name}</span><span>01 / FORM</span></div>
                <strong className="bl-copy-text">{copyValue(copy, "study-headline-1", "Start with\na better\nblock.")}</strong>
                <div className="bl-pair-image">{brand.mediaType === "video" ? <video src={brand.media} muted loop playsInline autoPlay={false} preload="metadata" aria-label="Brand film still" /> : <Image src={brand.media} alt="Campaign landscape" width={1080} height={1080} unoptimized />}</div>
              </div>
              <div className="bl-pair-sheet bl-pair-material">
                <div className="bl-material-layer">{canvas("study")}</div>
                <div className="bl-pair-sheet-top"><span>{brand.name}</span><span>02 / EXPRESSION</span></div>
                <strong className="bl-copy-text">{copyValue(copy, "study-headline-2", "Make it\nyour\nown.")}</strong>
                <span className="bl-pair-sheet-end">BUILT FOR WHAT IS NEXT ↗</span>
              </div>
            </div>
            <div className="bl-study-bottom"><span className="bl-copy-text">{copyValue(copy, "study-note", "Two expressions. One system.")}</span><span>↗</span></div>
          </div>
          <div className="bl-asset-caption"><span>02 — Poster pair</span><span>1080 × 1080</span></div>
        </div>
        <div className="bl-invitation" style={{ "--brand-primary": brand.primary } as CSSProperties}>
          <div className="bl-invitation-top"><span>A BETTER STARTING POINT</span><span className="bl-accent-chip">{canvas("accent")}</span></div>
          <p>Make room for<br />what matters.</p>
          <div className="bl-invitation-bottom"><span>{brand.name}<br />A thoughtful blocks library</span><span>Explore the library ↗</span></div>
        </div>
      </div>
      <div className="bl-strip-group">
        <div className="bl-wordmark bl-surface" {...selection("wordmark")}>
          <div className="bl-dither-art"><div className="bl-material-layer">{canvas("wordmark")}</div><span className="bl-dither-index">{brand.name} / 03</span><span className="bl-dither-brand">{brand.name}</span></div>
          <div className="bl-dither-type"><span className="bl-kicker bl-copy-text">{copyValue(copy, "wordmark-kicker", "THE SYSTEM, CONTINUED")}</span><span className="bl-dither-rule" /><strong className="bl-copy-text">{copyValue(copy, "wordmark-headline", "MADE TO\nFEEL RIGHT.")}</strong><div><span>{brand.name}<br /><span className="bl-copy-text">{copyValue(copy, "wordmark-note", "A more considered way.")}</span></span><span>↗</span></div></div>
        </div>
        <div className="bl-asset-caption"><span>03 — Graphic pair</span><span>1600 × 440</span></div>
      </div>
    </div>
    <div className="bl-board-footer"><span>{brand.name} / Campaign direction No. 01</span><span>One material. A different expression on every surface.</span></div>
  </div>;
}
