"use client";

import Image from "next/image";
import type { CSSProperties, RefObject } from "react";
import { WEB_SURFACES, letterMask, usesBrandMedia, type Brand, type Treatment } from "./model";
import { copyValue, type SurfaceCopy } from "./surface-copy";

export function WebScene({ brand, shaderId, selected, treatments, copy, sceneRef, onSelect }: {
  brand: Brand; shaderId: string | null; selected: string | null;
  treatments: Record<string, Treatment>; copy: SurfaceCopy; sceneRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string, keyboard?: boolean) => void;
}) {
  const mask = brand.logo ?? letterMask(brand.name);
  const mediaShader = usesBrandMedia(shaderId, brand.mediaType);
  const canvas = (id: string) => <canvas data-material={id} className="bl-material" aria-hidden="true" />;
  const media = (alt: string) => brand.mediaType === "video" ? <video src={brand.media} muted playsInline preload="metadata" aria-label={alt} /> : <Image src={brand.media} alt={alt} width={1200} height={800} unoptimized />;
  const select = (id: string) => ({
    role: "button" as const, tabIndex: 0, "aria-label": `Select ${WEB_SURFACES.find(s => s.id === id)?.label}`,
    "aria-pressed": selected === id, "data-selected": selected === id, "data-surface-id": id,
    "aria-controls": selected === id ? "bl-surface-controls" : undefined,
    "data-placement": treatments[id].placement,
    style: { "--material-strength": shaderId ? treatments[id].intensity / 100 : 0, "--brand-primary": brand.primary, "--brand-secondary": brand.secondary, "--material-mask": `url("${mask}")` } as CSSProperties,
    onClick: () => onSelect(id),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id, true); } },
  });
  const name = brand.logo ? <Image src={brand.logo} alt={brand.name} width={120} height={32} unoptimized /> : brand.name;
  const caption = (number: string, label: string, size: string) => <div className="bl-asset-caption"><span>{number} — {label}</span><span>{size}</span></div>;
  return <div className="bl-scene bl-web" ref={sceneRef} data-has-shader={Boolean(shaderId)}>
    <div className="bl-board-heading"><span>03 / A place for your brand</span><span>{brand.name} · Web direction</span></div>
    <div className="bl-web-browser">
      <div className="bl-web-chrome" aria-hidden="true"><span><i /><i /><i /></span><span>www.{brand.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "yourbrand"}.studio</span><span>↗</span></div>
      <div className="bl-web-nav"><strong>{name}<sup>®</sup></strong><span>Blocks&nbsp;&nbsp;&nbsp; Library&nbsp;&nbsp;&nbsp; About</span><span className="bl-web-nav-link">Explore blocks ↗</span></div>
      <div className="bl-web-hero bl-surface" data-particle={shaderId === "particle-assembly"} {...select("web-hero")}>
        <div className="bl-web-hero-visual">{media("Website hero landscape")}<div className="bl-material-layer">{canvas("web-hero")}</div><div className="bl-web-hero-card"><span>{brand.name} / BLOCK STUDY</span><strong>Thoughtful blocks.<br />Built to belong.</strong><span>{brand.name.toUpperCase()} / BLOCKS LIBRARY</span></div></div>
        <div className="bl-web-hero-copy"><span className="bl-kicker">DESIGNED WITH {brand.name.toUpperCase()}</span><h2>{brand.tagline}</h2><p className="bl-copy-text">{copyValue(copy, "web-hero-note", "A flexible library for the pages you imagine.\nMake a strong start, then make it yours.")}</p><span className="bl-web-button">Explore the library <span>↗</span></span><span className="bl-web-hero-copy-foot">DESIGN / SYSTEMS / POSSIBILITY</span></div>
      </div>
    </div>
    {caption("01", "Website promo", "1600 × 860")}
    <div className="bl-web-intro"><span className="bl-kicker">MADE FOR THE NEXT IDEA</span><p>Good design makes room <em>for more.</em></p><span>A starting point for the next idea.<br />A visual system you can make your own.</span></div>
    <div className="bl-web-feature-row"><div><div className="bl-web-feature bl-surface" data-generated={Boolean(shaderId) && !mediaShader} {...select("web-feature")}>
      <div className="bl-material-layer">{canvas("web-feature")}</div><div className="bl-web-feature-note"><span className="bl-copy-text">{copyValue(copy, "feature-note", "BLOCK STUDY / 001")}</span><strong className="bl-copy-text">{copyValue(copy, "feature-headline", "Built to\nstand out.")}</strong></div>
    </div>{caption("02", "Editorial feature", "1200 × 900")}</div><div className="bl-web-feature-copy"><span className="bl-kicker">INSIDE THE SYSTEM OF {brand.name}</span><h3>Design<br />without friction.</h3><p>Every detail has a purpose.<br />Compose a page that feels entirely yours.</p><span className="bl-web-text-link">Explore the blocks ↗</span><span className="bl-web-feature-index">01 — MANY POSSIBILITIES</span></div></div>
    <div className="bl-web-cta bl-surface" {...select("web-cta")}><div className="bl-web-cta-original" /><div className="bl-material-layer">{canvas("web-cta")}</div><div className="bl-web-cta-copy"><span className="bl-kicker">{brand.name} / MAKE IT YOURS</span><h3 className="bl-copy-text">{copyValue(copy, "web-cta-headline", "Make your\nmark.")}</h3><span className="bl-web-button">Start building <span>↗</span></span></div><div className="bl-web-cta-side"><span className="bl-copy-text">{copyValue(copy, "web-cta-note", "ONE SYSTEM\nENDLESS EXPRESSIONS")}</span><span>{brand.name.toUpperCase()} 2026</span></div><span className="bl-web-cta-register">{brand.name} / MADE FOR IDEAS</span></div>
    {caption("03", "Footer banner", "1600 × 500")}
    <div className="bl-web-colophon"><strong>{brand.name}</strong><span>Independent in spirit.<br />Thoughtful by design.</span><span>© 2026 / All ideas welcome.</span></div>
    <div className="bl-board-footer"><span>{brand.name} / Web direction No. 03</span><span>Expressive material. A clear place for content.</span></div>
  </div>;
}
