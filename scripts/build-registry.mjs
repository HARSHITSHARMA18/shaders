import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDirectory = resolve(root, "public/r");
const thermalPath = "registry/default/thermal-pixel-ink/thermal-pixel-shader.tsx";
const fieldPath = "registry/default/field-shaders/solace-field-shader.tsx";
const etchPath = "registry/default/thermal-etch-burn/thermal-etch-burn.tsx";
const particlePath = "registry/default/particle-morph/particle-morph-shader.tsx";
const lensPath = "registry/default/refractive-lens/refractive-lens.tsx";
const exposureGridPath = "registry/default/exposure-grid/exposure-grid.tsx";
const fluidPath = "registry/default/fluid-distortion/fluid-distortion.tsx";
const blackholePath = "registry/default/blackhole-lensing/blackhole-lensing.tsx";
const [thermalSource, fieldSource, etchSource, particleSource, lensSource, exposureGridSource, fluidSource, blackholeSource] = await Promise.all([
  readFile(resolve(root, thermalPath), "utf8"),
  readFile(resolve(root, fieldPath), "utf8"),
  readFile(resolve(root, etchPath), "utf8"),
  readFile(resolve(root, particlePath), "utf8"),
  readFile(resolve(root, lensPath), "utf8"),
  readFile(resolve(root, exposureGridPath), "utf8"),
  readFile(resolve(root, fluidPath), "utf8"),
  readFile(resolve(root, blackholePath), "utf8"),
]);

const definitions = [
  {
    name: "thermal-pixel-ink",
    title: "Thermal Pixel Ink",
    description:
      "An interactive WebGL heat field with a persistent trail, quantized color bands, and pointer-pressure response.",
    path: thermalPath,
    target: "@components/thermal-pixel-shader.tsx",
    content: thermalSource,
    docs:
      "Render <ThermalPixelShader /> inside a container with an explicit width and height. The canvas fills its parent.",
  },
  {
    name: "viscous-cursor-dye",
    title: "Viscous Cursor Dye",
    description: "A pointer-reactive folded dye field rendered with WebGL.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="viscous" /> inside a container with an explicit width and height.',
  },
  {
    name: "reaction-bloom",
    title: "Reaction Bloom",
    description: "A pointer-seeded field of rings, membranes, and cellular growth.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="reaction" /> inside a container with an explicit width and height.',
  },
  {
    name: "cellular-contagion",
    title: "Cellular Contagion",
    description: "A discrete pointer-reactive field with four quantized material states.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="cellular" /> inside a container with an explicit width and height.',
  },
  {
    name: "repulsion-lattice",
    title: "Repulsion Lattice",
    description: "A luminous point field that opens and shears around pointer pressure.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="repulsion" palette="ember" /> inside a container with an explicit width and height.',
  },
  {
    name: "magnetic-pixels",
    title: "Magnetic Pixels",
    description: "Spring-tethered particles with pointer-controlled polarity and visible tension.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="magnetic" /> inside a container with an explicit width and height.',
  },
  {
    name: "chromatic-refraction",
    title: "Chromatic Refraction",
    description: "A moving glass field that separates spectral layers around the pointer.",
    path: fieldPath,
    target: "@components/solace-field-shader.tsx",
    content: fieldSource,
    docs:
      'Render <SolaceFieldShader variant="chromatic" palette="acid" /> inside a container with an explicit width and height.',
  },
  {
    name: "thermal-etch-burn",
    title: "Thermal Etch Burn",
    description:
      "A grain-heavy thermal front moving through generative topographic linework and woven fibers.",
    path: etchPath,
    target: "@components/thermal-etch-burn.tsx",
    content: etchSource,
    docs:
      "Render <ThermalEtchBurn /> inside a container with an explicit width and height. No image or external asset is required.",
  },
  {
    name: "particle-assembly",
    title: "Particle Assembly",
    description:
      "Glossy WebGL particles that loop between ambient scatter and an editable wordmark or supplied SVG logo.",
    path: particlePath,
    target: "@components/particle-morph-shader.tsx",
    content: particleSource,
    docs:
      'Render <ParticleMorphShader preset="word" text="SOLACE" /> for text, or pass preset="svg" with a complete SVG string to assemble a custom logo.',
  },
  {
    name: "refractive-lens",
    title: "Refractive Lens",
    description:
      "A shapeable interactive glass lens that refracts generated artwork, images, or video.",
    path: lensPath,
    target: "@components/refractive-lens.tsx",
    content: lensSource,
    docs:
      'Render <RefractiveLens /> for the built-in composition, or pass src="/artwork.jpg" or a video source. Use svgMask with a complete SVG string for a custom lens silhouette.',
  },
  {
    name: "exposure-grid",
    title: "Exposure Grid",
    description:
      "An editorial image or video grid with independently changing exposure, color, and texture samples.",
    path: exposureGridPath,
    target: "@components/exposure-grid.tsx",
    content: exposureGridSource,
    docs:
      'Render <ExposureGrid src="/artwork.jpg" /> inside a container with explicit dimensions. Video sources are supported with mediaType="video".',
  },
  {
    name: "fluid-distortion",
    title: "Fluid Distortion",
    description:
      "A pointer-reactive 2D fluid that warps generated color forms or supplied media, including a liquid rim.",
    path: fluidPath,
    target: "@components/fluid-distortion.tsx",
    content: fluidSource,
    docs:
      'Render <FluidDistortion composition="flare" /> inside a container with explicit dimensions. Pass src for image or video displacement, and current="orbit" for a self-stirring surface.',
  },
  {
    name: "blackhole-lensing",
    title: "Blackhole Lensing",
    description:
      "Gravitational lensing black hole portal with Einstein rings, Kerr metric frame-dragging spin, and chromatic dispersion.",
    path: blackholePath,
    target: "@components/blackhole-lensing.tsx",
    content: blackholeSource,
    docs:
      'Render <BlackholeLensing /> inside a container with explicit dimensions. Use progress for warp transition animations.',
  },
];

const catalog = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "solace-shaders",
  homepage: "https://shaders.solaceui.com",
  items: definitions.map(({ name, title, description, path }) => ({
    name,
    type: "registry:component",
    title,
    description,
    files: [{ path, type: "registry:component" }],
  })),
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(root, "registry.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  writeFile(resolve(outputDirectory, "registry.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  ...definitions.map(({ name, title, description, path, target, content, docs }) =>
    writeFile(
      resolve(outputDirectory, `${name}.json`),
      `${JSON.stringify({
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name,
        type: "registry:component",
        title,
        description,
        files: [{ path, type: "registry:component", target, content }],
        docs,
      }, null, 2)}\n`,
    ),
  ),
]);
