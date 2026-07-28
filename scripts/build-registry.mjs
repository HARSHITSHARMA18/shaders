import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const outputDirectory = resolve(root, "public/r");
const thermalPath = "registry/default/thermal-pixel-ink/thermal-pixel-shader.tsx";
const fieldPath = "registry/default/field-shaders/solace-field-shader.tsx";
const [thermalSource, fieldSource] = await Promise.all([
  readFile(resolve(root, thermalPath), "utf8"),
  readFile(resolve(root, fieldPath), "utf8"),
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
];

const catalog = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "solace-shaders",
  homepage: "https://www.solaceui.com",
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
