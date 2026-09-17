"use client";

import type { CSSProperties, RefObject } from "react";
import Image from "next/image";
import { letterMask, MEDIA_SHADERS, SURFACES, type Brand, type Treatment } from "./model";

export function CampaignScene({ brand, shaderId, selected, treatments, sceneRef, onSelect }: {
  brand: Brand; shaderId: string | null; selected: string | null;
  treatments: Record<string, Treatment>; sceneRef: RefObject<HTMLDivElement | null>; onSelect: (id: string) => void;
}) {
  const mask = brand.logo ?? letterMask(brand.name);
  const canvas = (id: string) => <canvas key={shaderId ?? "original"} data-material={id} aria-hidden="true" className="bl-material" />;
  const style = (id: string): CSSProperties => ({
    "--material-strength": shaderId ? treatments[id].intensity / 100 : 0,
    "--brand-primary": brand.primary,
    "--material-mask": `url("${mask}")`,
  } as CSSProperties);
  const selection = (id: string) => ({
    role: "button" as const, tabIndex: 0, "aria-label": `Select ${SURFACES.find(surface => surface.id === id)?.label}`,
    "aria-pressed": selected === id, "data-selected": selected === id,
    "data-surface-id": id,
    "aria-controls": selected === id ? "bl-surface-controls" : undefined,
    "data-placement": treatments[id].placement, style: style(id),
    onClick: () => onSelect(id),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id); } },
  });
  const name = <span className="bl-brand-name">{brand.logo ? <Image src={brand.logo} alt={brand.name} width={140} height={40} unoptimized /> : brand.name}</span>;
  return <div className="bl-scene" ref={sceneRef}>
    <div className="bl-board-heading"><span>01 / A gathering, in three forms</span><span>Independent culture · Autumn 2026</span></div>
    <div className="bl-composition">
      <div className="bl-poster-group">
        <div className="bl-poster bl-surface" {...selection("poster")}>
          <div className="bl-poster-base" />
          <div className="bl-material-layer">{canvas("poster")}</div>
          <div className="bl-poster-content">
            <div className="bl-poster-top">{name}<span>Art, sound<br />& shared space.</span></div>
            <h2>{brand.tagline}</h2>
            <div className="bl-poster-bottom"><span>One evening.<br />Many perspectives.</span><span>24.10.26<br />18:00 — late</span><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 35 35 5M6 5h29v29" fill="none" stroke="currentColor" strokeWidth="2" /></svg></div>
          </div>
        </div>
        <div className="bl-asset-caption"><span>01 — Campaign poster</span><span>1080 × 1350</span></div>
      </div>
      <div className="bl-right-column">
        <div className="bl-study-group">
          <div className="bl-study bl-surface" data-generated={shaderId !== null && !MEDIA_SHADERS.has(shaderId)} {...selection("study")}>
            <div className="bl-study-title"><span>WAYS<br />OF SEEING.</span><span>F / 026</span></div>
            <div className="bl-study-window">
              {brand.mediaType === "video" ? <video src={brand.media} muted loop playsInline autoPlay={false} preload="metadata" aria-label="Brand film still" /> : <Image src={brand.media} alt="Campaign landscape" width={1080} height={1080} unoptimized />}
              <div className="bl-material-layer">{canvas("study")}</div>
            </div>
            <div className="bl-study-bottom"><span>A space for the unexpected.</span><span>↗</span></div>
          </div>
          <div className="bl-asset-caption"><span>02 — Material study</span><span>1080 × 1080</span></div>
        </div>
        <div className="bl-invitation" style={{ "--brand-primary": brand.primary } as CSSProperties}>
          <div className="bl-invitation-top"><span>YOU’RE INVITED</span><span className="bl-accent-chip">{canvas("accent")}</span></div>
          <p>Come with<br />an open mind.</p>
          <div className="bl-invitation-bottom"><span>{brand.name}<br />An independent gathering</span><span>Discover the programme ↗</span></div>
        </div>
      </div>
      <div className="bl-strip-group">
        <div className="bl-wordmark bl-surface" {...selection("wordmark")}>
          <div className="bl-letter-base" style={{ maskImage: `url("${mask}")`, WebkitMaskImage: `url("${mask}")` }} />
          <div className="bl-material-layer">{canvas("wordmark")}</div>
          <div className="bl-wordmark-copy"><span>OPEN TO<br />OTHER IDEAS.</span><small>{brand.name} / Culture in common</small></div>
          <span className="bl-wordmark-register">®</span>
        </div>
        <div className="bl-asset-caption"><span>03 — Identity strip</span><span>1600 × 600</span></div>
      </div>
    </div>
    <div className="bl-board-footer"><span>{brand.name} / Campaign direction No. 01</span><span>One material. A different expression on every surface.</span></div>
  </div>;
}
