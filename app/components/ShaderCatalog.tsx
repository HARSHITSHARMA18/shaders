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
import { ParticleMorphShader, SOLACE_MARK_SVG } from "./ParticleMorphShader";
import { RefractiveLens } from "./RefractiveLens";
import { ExposureGrid } from "./ExposureGrid";
import { FluidDistortion } from "./FluidDistortion";
import { BlackholeLensing } from "./BlackholeLensing";
import { SpecimenIndex } from "./SpecimenIndex";

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
        <div className="catalogMeta">
          <a
            className="githubLink"
            href="https://github.com/HARSHITSHARMA18/shaders"
            target="_blank"
            rel="noreferrer"
            aria-label="View Solace Shaders on GitHub"
            title="View source on GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.96 10.96 0 0 1 12 6.13c.98 0 1.95.13 2.86.38 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.27c0 .31.21.67.79.56A11.5 11.5 0 0 0 12 .7Z"
              />
            </svg>
          </a>
          <span className="catalogMaker">
            Building cool stuff{" "}
            <a href="https://x.com/harshitlog" target="_blank" rel="noreferrer">
              @harshitlog
            </a>
          </span>
        </div>
      </header>

      <main>
        <section className="catalogHero">
          <span className="eyebrow">Interactive WebGL studies · Ready to install</span>
          <h1>Shaders for interfaces that should feel alive.</h1>
          <p>
            Explore, tune, and copy interactive visual systems built as reusable
            interface components.
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

          <Link
            className="shaderCard"
            href="/shaders/particle-assembly"
          >
            <div className="shaderPreview livePreview">
              <ParticleMorphShader
                className="catalogCanvas"
                preset="svg"
                svg={SOLACE_MARK_SVG}
                particleCount={920}
                size={4.2}
                interaction={0.2}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>09</span>
                <h2>Particle assembly</h2>
              </div>
              <p>Glossy particles resolve into editable wordmarks or a supplied SVG logo.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          <Link className="shaderCard" href="/shaders/refractive-lens">
            <div className="shaderPreview livePreview">
              <RefractiveLens
                className="catalogCanvas"
                src="/specimen-index-flax.png"
                shape="circle"
                mode="pointer"
                size={0.56}
                radius={0.74}
                refraction={1.28}
                magnification={0.82}
                frost={0.04}
                thickness={0.78}
                dispersion={0.8}
                follow={0.08}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>10</span>
                <h2>Refractive lens</h2>
              </div>
              <p>A shapeable optical surface that redirects focus through supplied media.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          <Link className="shaderCard" href="/shaders/fluid-distortion">
            <div className="shaderPreview livePreview">
              <FluidDistortion
                className="catalogCanvas"
                src="/fluid-distortion-hero.png"
                composition="media"
                current="orbit"
                character="silk"
                palette="flare"
                distortion={0.56}
                gloss={0.48}
                swirl={0.62}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>12</span>
                <h2>Fluid distortion</h2>
              </div>
              <p>A liquid rim and color field that keeps the momentum of your pointer.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          <Link className="shaderCard" href="/shaders/exposure-grid">
            <div className="shaderPreview livePreview">
              <ExposureGrid
                className="catalogCanvas"
                src="/exposure-grid-mountain.jpg"
                columns={4}
                rows={4}
                lineWidth={2.5}
                lineOpacity={0.4}
                activity={0.4}
                tempo={0.96}
                intensity={0.78}
                zoom={0.68}
                grain={0.68}
                interaction={0.82}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div><span>11</span><h2>Exposure grid</h2></div>
              <p>Camera-clean framing with independently shifting color and material samples.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          <Link className="shaderCard" href="/shaders/blackhole-lensing">
            <div className="shaderPreview livePreview">
              <BlackholeLensing
                className="catalogCanvas"
                mode="orbit"
                radius={0.2}
                lens={0.34}
                orbit={0.9}
                aberration={0.15}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div>
                <span>13</span>
                <h2>Black hole portal</h2>
              </div>
              <p>Gravitational lensing, frame dragging spin, and chromatic dispersion around an event horizon.</p>
              <span className="openLabel">Open experiment →</span>
            </div>
          </Link>

          <Link className="shaderCard" href="/shaders/specimen-index">
            <div className="shaderPreview livePreview">
              <SpecimenIndex
                className="catalogCanvas"
                src="/specimen-index-flax.png"
                study="editorial"
                mode="auto"
                probes={4}
                magnification={1.38}
                detail={0.78}
                connectors={0.86}
                grain={0.18}
                motion={0.24}
                geometry="studio"
                geometryAmount={0.9}
                geometryDensity={0.78}
                geometryScale={0.84}
                pointerGeometry={0.96}
              />
              <span className="availableBadge">Available</span>
            </div>
            <div className="shaderCardBody">
              <div><span>14</span><h2>Specimen index</h2></div>
              <p>A botanical image becomes a living system of detected geometry, samples, and pointer constructions.</p>
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
