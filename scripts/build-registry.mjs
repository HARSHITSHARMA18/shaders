import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDirectory = resolve(root, "public/r");
const thermalPath = "registry/default/thermal-pixel-ink/thermal-pixel-shader.tsx";
const fieldPath = "registry/default/field-shaders/solace-field-shader.tsx";
const etchPath = "registry/default/thermal-etch-burn/thermal-etch-burn.tsx";
const [thermalSource, fieldSource, etchSource] = await Promise.all([
  readFile(resolve(root, thermalPath), "utf8"),
  readFile(resolve(root, fieldPath), "utf8"),
  readFile(resolve(root, etchPath), "utf8"),
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
