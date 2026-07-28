"use client";

import Link from "next/link";
import { SolaceLogo } from "./SolaceLogo";
import { ThermalPixelShader } from "./ThermalPixelShader";

const studies = [
  { number: "02", title: "Viscous cursor dye", copy: "Velocity, curl and folded trails.", preview: "viscous" },
  { number: "03", title: "Reaction bloom", copy: "A pointer-triggered chemical garden.", preview: "reaction" },
  { number: "04", title: "Cellular contagion", copy: "Excite, burn, cool, repeat.", preview: "cellular" },
  { number: "05", title: "Magnetic pixels", copy: "Spring-bound particles under tension.", preview: "magnetic" },
  { number: "06", title: "Chromatic refraction", copy: "Split light around interface edges.", preview: "chromatic" },
];

export function ShaderCatalog() {
  return (
    <div className="catalogPage">
      <header className="catalogHeader">
        <Link className="wordmark" href="/" aria-label="Solace Shaders home">
          <SolaceLogo className="solaceLogo" />
          <span>Solace</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Shaders</span>
        </Link>
        <span>Interactive material studies / 2026</span>
      </header>

      <main>
        <section className="catalogHero">
          <div className="eyebrow">Solace UI material archive</div>
          <h1>Shaders for interfaces that should feel alive.</h1>
          <p>Explore, tune, and copy interactive visual systems built as reusable Solace UI blocks.</p>
        </section>

        <section className="shaderGrid" aria-label="Shader catalog">
          <Link className="shaderCard featuredCard" href="/shaders/thermal-pixel-ink">
            <div className="shaderPreview livePreview">
              <ThermalPixelShader className="catalogCanvas" cellSize={12} ambient={0.5} speed={0.5} />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div><span>01</span><h2>Thermal pixel ink</h2></div>
              <p>Persistent heat, hard palette bands, and cursor-path mixing.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          {studies.map((study) => (
            <article className="shaderCard queuedCard" key={study.number}>
              <div className={`shaderPreview studyPreview ${study.preview}`} aria-hidden="true"><i /><i /><i /></div>
              <div className="shaderCardBody">
                <div><span>{study.number}</span><h2>{study.title}</h2></div>
                <p>{study.copy}</p>
                <span className="researchLabel">Research queue</span>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="catalogFooter">
        <span className="footerBrand"><SolaceLogo className="solaceLogo footerLogo" />Solace UI</span>
        <span>One material at a time.</span>
      </footer>
    </div>
  );
}
