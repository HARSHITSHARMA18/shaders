"use client";

import Link from "next/link";
import { SolaceLogo } from "./SolaceLogo";
import {
  FieldShaderPalette,
  FieldShaderVariant,
  SolaceFieldShader,
} from "./SolaceFieldShader";
import { ThermalEtchBurn } from "./ThermalEtchBurn";
import { ThermalPixelShader } from "./ThermalPixelShader";

const liveStudies: Array<{
  number: string;
  title: string;
  copy: string;
  slug: string;
  variant: FieldShaderVariant;
  palette?: FieldShaderPalette;
  scale?: number;
  intensity?: number;
  distortion?: number;
  trail?: number;
}> = [
  {
    number: "02",
    title: "Viscous cursor dye",
    copy: "Velocity, curl and folded trails.",
    slug: "viscous-cursor-dye",
    variant: "viscous",
  },
  {
    number: "03",
    title: "Reaction bloom",
    copy: "A pointer-triggered chemical garden.",
    slug: "reaction-bloom",
    variant: "reaction",
  },
  {
    number: "04",
    title: "Cellular contagion",
    copy: "Excite, burn, cool, repeat.",
    slug: "cellular-contagion",
    variant: "cellular",
    scale: 0.72,
  },
  {
    number: "05",
    title: "Repulsion lattice",
    copy: "A compact four-point aperture moving through a luminous halftone field.",
    slug: "repulsion-lattice",
    variant: "repulsion",
    palette: "ember",
    scale: 0.82,
    intensity: 1.08,
    distortion: 0.92,
    trail: 0.58,
  },
  {
    number: "06",
    title: "Magnetic pixels",
    copy: "Spring-bound particles switch polarity under tension.",
    slug: "magnetic-pixels",
    variant: "magnetic",
    scale: 1.05,
    distortion: 0.92,
    trail: 0.62,
  },
  {
    number: "07",
    title: "Chromatic refraction",
    copy: "Moving glass splits spectral layers around its rim.",
    slug: "chromatic-refraction",
    variant: "chromatic",
    palette: "acid",
    scale: 1.15,
    distortion: 1.05,
    trail: 0.58,
  },
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
        <span className="catalogMaker">
          Building cool stuff{" "}
          <a href="https://x.com/harshitlog" target="_blank" rel="noreferrer">
            @harshitlog
          </a>
        </span>
      </header>

      <main>
        <section className="catalogHero">
          <a
            className="eyebrow catalogHeroLink"
            href="https://www.solaceui.com"
            target="_blank"
            rel="noreferrer"
          >
            Browse tastefully crafted blocks for marketing pages
            <svg
              className="catalogHeroLinkIcon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 12h14" />
              <path d="m15 16 4-4" />
              <path d="m15 8 4 4" />
            </svg>
          </a>
          <h1>Shaders for interfaces that should feel alive.</h1>
          <p>
            Explore, tune, and copy interactive visual systems built as reusable
            Solace UI blocks.
          </p>
        </section>

        <section className="shaderGrid" aria-label="Shader catalog">
          <Link
            className="shaderCard featuredCard"
            href="/shaders/thermal-pixel-ink"
          >
            <div className="shaderPreview livePreview">
              <ThermalPixelShader
                className="catalogCanvas"
                cellSize={12}
                ambient={0.5}
                speed={0.5}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>01</span>
                <h2>Thermal pixel ink</h2>
              </div>
              <p>
                Persistent heat, hard palette bands, and cursor-path mixing.
              </p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          {liveStudies.map((study) => (
            <Link
              className="shaderCard"
              href={`/shaders/${study.slug}`}
              key={study.number}
            >
              <div className="shaderPreview livePreview">
                <SolaceFieldShader
                  className="catalogCanvas"
                  variant={study.variant}
                  palette={study.palette}
                  scale={study.scale ?? 1}
                  intensity={study.intensity}
                  distortion={study.distortion}
                  speed={0.48}
                  trail={study.trail ?? 0.55}
                />
                <span className="availableBadge">Available</span>
              </div>
              <div className="shaderCardBody">
                <div>
                  <span>{study.number}</span>
                  <h2>{study.title}</h2>
                </div>
                <p>{study.copy}</p>
                <span className="openLabel">Open experiment →</span>
              </div>
            </Link>
          ))}

          <Link
            className="shaderCard"
            href="/shaders/thermal-etch-burn"
          >
            <div className="shaderPreview livePreview">
              <ThermalEtchBurn
                className="catalogCanvas"
                speed={0.32}
                grain={0.52}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>08</span>
                <h2>Thermal etch burn</h2>
              </div>
              <p>A volatile thermal front moves through generative etched linework.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>
        </section>
      </main>

      <footer className="catalogFooter">
        <a
          className="footerBrand"
          href="https://www.solaceui.com"
          target="_blank"
          rel="noreferrer"
        >
          <SolaceLogo className="solaceLogo footerLogo" />
          Solace UI
        </a>
        <span className="footerCredit">
          © 2026{" "}
          <a href="https://www.solaceui.com" target="_blank" rel="noreferrer">
            Solace UI
          </a>
        </span>
      </footer>
    </div>
  );
}
