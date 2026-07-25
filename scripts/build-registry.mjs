import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const sourcePath = "registry/default/thermal-pixel-ink/thermal-pixel-shader.tsx";
const source = await readFile(resolve(root, sourcePath), "utf8");
const outputDirectory = resolve(root, "public/r");

const catalog = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "solace-shaders",
  homepage: "https://solace-shaders-lab.swetasharma02.chatgpt.site",
  items: [
    {
      name: "thermal-pixel-ink",
      type: "registry:component",
      title: "Thermal Pixel Ink",
      description:
        "An interactive WebGL heat field with a persistent trail, quantized color bands, and pointer-pressure response.",
      files: [{ path: sourcePath, type: "registry:component" }],
    },
  ],
};

const item = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "thermal-pixel-ink",
  type: "registry:component",
  title: "Thermal Pixel Ink",
  description:
    "An interactive WebGL heat field with a persistent trail, quantized color bands, and pointer-pressure response.",
  files: [
    {
      path: sourcePath,
      type: "registry:component",
      target: "@components/thermal-pixel-shader.tsx",
      content: source,
    },
  ],
  docs:
    "Render <ThermalPixelShader /> inside a container with an explicit width and height. The canvas fills its parent.",
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, "registry.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  writeFile(
    resolve(outputDirectory, "thermal-pixel-ink.json"),
    `${JSON.stringify(item, null, 2)}\n`,
  ),
]);
