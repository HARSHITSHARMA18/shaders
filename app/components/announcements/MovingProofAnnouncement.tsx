"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShaderMaterial } from "../../brand-lab/ShaderMaterial";
import { createSetup, setupQuery, DEFAULT_TREATMENTS } from "../../brand-lab/setup";
import { DEFAULT_BRAND } from "../../brand-lab/model";
import { EMPTY_TUNING } from "../../brand-lab/shader-controls";

const brand = { ...DEFAULT_BRAND, tagline: "Make room for possibility." };
const href = `/brand-lab?${setupQuery(createSetup(brand, "specimen-index", "Original", DEFAULT_TREATMENTS))}`;
function Mark() { return <span className="proof-mark" aria-hidden="true" />; }
function Arrow() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg>; }

export function MovingProofAnnouncement({ onClose }: { onClose: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState(0);
  const [failed, setFailed] = useState(false);
  const onStatus = useCallback((status: string) => {
    if (!status) setReady(true);
    if (/unavailable|could not/.test(status)) { setFailed(true); setReady(true); }
  }, []);


  useEffect(() => {
    if (!ready) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let timers: number[] = [];
    const clear = () => { timers.forEach(clearTimeout); timers = []; };
    // Reuse the renderer across cycles; only the composition changes.
    const cycle = () => {
      clear();
      setPhase(0);
      timers = [
        window.setTimeout(() => setPhase(1), 1800),
        window.setTimeout(() => setPhase(2), 3200),
        window.setTimeout(cycle, 10000),
      ];
    };
    const sync = () => {
      clear();
      if (document.hidden) return;
      timers = [window.setTimeout(motion.matches || failed ? () => setPhase(2) : cycle, 0)];
    };
    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clear();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ready, failed]);

  return <div className="proof" data-phase={phase} data-ready={ready} data-failed={failed}>
    <header className="proof-header">
      <span className="proof-edition">Introducing <strong>Brand Lab</strong></span>
      <button className="proof-close" aria-label="Close announcement" onClick={onClose}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg></button>
    </header>
    <div className="proof-intro">
      <h2 id="proof-title">One shader.<br /><em>Every possibility.</em></h2>
      <div className="proof-intro-aside"><p id="proof-description">See your shader become a campaign,<br className="proof-desktop-break" /> an identity, a presence on the web.</p></div>
    </div>
    <div className="proof-stage" ref={sceneRef} aria-label="Specimen Index transforms from a live field into Campaign, Identity, and Web">
      <div className="proof-registration" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="proof-stage-note"><span>SPECIMEN INDEX / 014</span><span>ONE MATERIAL. THREE EXPRESSIONS.</span></div>
      <article className="proof-poster bl-surface" aria-label="Campaign application">
        <canvas data-material="poster" className="proof-material" aria-hidden="true" />
        <div className="proof-poster-copy">
          <div className="proof-poster-top"><Mark /><span>AN OPEN INVITATION<br />TO SEE DIFFERENTLY.</span></div>
          <h3>Make room<br />for possibility.</h3>
          <div className="proof-poster-foot"><span>SOLACEUI<br />IN GOOD FORM.</span><Arrow /></div>
        </div>
        <span className="proof-raw-label">{failed ? "ORIGINAL ARTWORK · LIVE PREVIEW UNAVAILABLE" : ready ? "THE MATERIAL, BEFORE THE POSSIBILITIES." : "PREPARING THE LIVE MATERIAL"}</span>
      </article>
      <article className="proof-identity bl-surface" aria-label="Identity application">
        <div className="proof-identity-top"><span>SolaceUI</span><span>INDEPENDENT BY NATURE.</span></div>
        <div className="proof-signature"><canvas data-material="identity-mark" className="proof-material" aria-hidden="true" /></div>
        <div className="proof-identity-foot"><span>A shared<br /><em>perspective.</em></span><Arrow /></div>
      </article>
      <article className="proof-web bl-surface" aria-label="Web application">
        <div className="proof-web-nav"><Mark /><span>About &nbsp; Journal</span><span>Let’s talk ↗</span></div>
        <div className="proof-web-body">
          <div className="proof-web-type"><span className="proof-web-eyebrow">A SPACE FOR THE UNEXPECTED</span><h3>Culture<br /> without<br /><em> edges.</em></h3><span className="proof-web-link">Discover our world ↗</span></div>
          <div className="proof-web-image"><canvas data-material="web-hero" className="proof-material" aria-hidden="true" /><span>FIELD<br />NOTES / 01</span></div>
        </div>
      </article>
      <span className="proof-caption proof-caption-poster">01 <span>CAMPAIGN</span></span>
      <span className="proof-caption proof-caption-identity">02 <span>IDENTITY</span></span>
      <span className="proof-caption proof-caption-web">03 <span>WEB</span></span>
      <ShaderMaterial id="specimen-index" brand={brand} palette="Original" sceneRef={sceneRef} onStatus={onStatus} retryKey={0} tuning={EMPTY_TUNING} scene="campaign" paused={false} />
    </div>
    <div className="proof-sequence">
      <div className="proof-steps" aria-label="Reveal progress">{["Material", "Composition", "Possibilities"].map((label, index) => <span key={label} data-active={phase === index} aria-current={phase === index ? "step" : undefined}>{label}</span>)}</div>
    </div>
    <footer className="proof-footer"><div><p className="proof-kicker">MEET BRAND LAB</p><p className="proof-closing">Give your shader a world to live in.</p></div><Link href={href} className="proof-primary">Open Brand Lab <span className="proof-primary-icon"><Arrow /></span></Link></footer>
  </div>;
}
