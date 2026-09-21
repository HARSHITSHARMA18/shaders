"use client";

import Image from "next/image";
import type { CSSProperties, RefObject } from "react";
import { IDENTITY_SURFACES, wordmarkMask, usesBrandMedia, type Brand, type Treatment } from "./model";
import { copyValue, type SurfaceCopy } from "./surface-copy";
import { resolveIdentityPalette, type NativeSettings } from "./native-settings";
import type { ShaderTuning } from "./shader-controls";

export function IdentityScene({ brand, shaderId, selected, treatments, copy, sceneRef, onSelect, palette, native, tuning }: {
  brand: Brand; shaderId: string | null; selected: string | null;
  treatments: Record<string, Treatment>; copy: SurfaceCopy; sceneRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string, keyboard?: boolean) => void;
  palette?: "Original" | "Brand";
  native?: NativeSettings[keyof NativeSettings] | Record<string, unknown> | null;
  tuning?: ShaderTuning;
}) {
  const paletteStops = resolveIdentityPalette({ brand, shaderId, palette, native, tuning });
  const mask = brand.logo ?? wordmarkMask(brand.name);
  const particle = shaderId === "particle-assembly";
  const generated = Boolean(shaderId) && !usesBrandMedia(shaderId, brand.mediaType);
  const canvas = (id: string) => <canvas data-material={id} className="bl-material" aria-hidden="true" />;
  const select = (id: string) => ({
    role: "button" as const, tabIndex: 0, "aria-label": `Select ${IDENTITY_SURFACES.find(s => s.id === id)?.label}`,
    "aria-pressed": selected === id, "data-selected": selected === id, "data-surface-id": id,
    "aria-controls": selected === id ? "bl-surface-controls" : undefined,
    "data-placement": particle && id === "identity-mark" ? "Background" : treatments[id].placement,
    style: { "--material-strength": shaderId ? treatments[id].intensity / 100 : 0, "--brand-primary": brand.primary, "--brand-secondary": brand.secondary, "--material-mask": `url("${mask}")` } as CSSProperties,
    onClick: () => onSelect(id),
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(id, true); } },
  });
  const caption = (number: string, label: string, size: string) => <div className="bl-asset-caption"><span>{number} — {label}</span><span>{size}</span></div>;
  return <div className="bl-scene bl-identity" ref={sceneRef} data-has-shader={Boolean(shaderId)}>
    <div className="bl-board-heading"><span>02 / A system with character</span><span>{brand.name} · A coherent visual language</span></div>
    <div className="bl-id-heading"><h2>An identity in<br /><em>every detail.</em></h2><p>One visual language.<br />Many ways to make it yours.</p><span className="bl-id-edition">IDENTITY SYSTEM<br />N° 002 / 2026</span></div>
    <div className="bl-id-grid">
      <div className="bl-id-signature-group">
        <div className="bl-id-signature bl-surface" data-particle={particle} {...select("identity-mark")}>
          <div className="bl-id-spread-copy"><span className="bl-id-corner">SIGNATURE / 01</span><span className="bl-id-spread-name">{brand.logo ? <Image src={brand.logo} alt={brand.name} width={600} height={180} unoptimized /> : brand.name}</span><span className="bl-id-spread-line bl-copy-text">{copyValue(copy, "signature-note", "An independent spirit.\nA shared way of seeing.")}</span><span className="bl-id-spread-foot">{brand.name} / IDENTITY 2026 <span>↗</span></span></div>
          <div className="bl-id-spread-visual"><div className="bl-id-original" /><div className="bl-material-layer">{canvas("identity-mark")}</div><span>DESIGNED TO BELONG.</span><span>02 / MATERIAL IN MOTION</span></div>
        </div>
        {caption("01", particle ? "Word assembly" : "Signature mark", "1600 × 840")}
      </div>
      <div className="bl-id-type"><span className="bl-kicker">THE MARK, WITHOUT THE NOISE</span>{brand.logo ? <Image src={brand.logo} alt={brand.name} width={600} height={140} unoptimized /> : <h3>{brand.name || "Your name"}<span>®</span></h3>}<div><span>One mark. Many expressions.</span><span>Aa / 0123456789</span></div></div>
      <div className="bl-id-side">
        <div className="bl-id-tile-group"><div className="bl-id-tile bl-surface" {...select("identity-tile")}><div className="bl-id-pair-heading"><span>{brand.name}</span><span className="bl-copy-text">{copyValue(copy, "tile-note", "01 / MARK")}</span></div><strong className="bl-copy-text">{copyValue(copy, "tile-headline", "Details make\nthe difference.")}</strong><div className="bl-id-original" /><div className="bl-material-layer">{canvas("identity-tile")}</div><span className="bl-id-tile-brand">{brand.name}</span><span className="bl-id-tile-number">02 / 03</span></div>{caption("02", "Graphic study A", "1080 × 1160")}</div>
      </div>
      <div className="bl-id-material-group"><div className="bl-id-material bl-surface" data-generated={generated} {...select("identity-material")}>
        <div className="bl-material-layer">{canvas("identity-material")}</div><div className="bl-id-material-copy"><span>02 / IN CONTEXT</span><strong className="bl-copy-text">{copyValue(copy, "material-headline", "Make space\nfor what matters.")}</strong><span className="bl-copy-text">{copyValue(copy, "material-note", `MATERIAL / ${brand.name}`)}</span></div>
      </div>{caption("03", "Graphic study B", "1080 × 1160")}</div>
      <div className="bl-id-palette"><span className="bl-kicker">A PALETTE WITH CHARACTER</span><div>{paletteStops.map((stop, index) => <span key={index} style={{ background: stop.color }} />)}</div><p>{paletteStops.map((stop, index) => <span key={index}>{stop.label}</span>)}</p></div>
      <p className="bl-id-thought">Distinctive in motion.<br />Clear at rest.</p>
    </div>
    <div className="bl-board-footer"><span>{brand.name} / Identity direction No. 02</span><span>One signature. A system of expressions.</span></div>
  </div>;
}
