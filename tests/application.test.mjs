import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const shaderNames = [
  "thermal-pixel-ink",
  "viscous-cursor-dye",
  "reaction-bloom",
  "cellular-contagion",
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("publishes every shader through the generated shadcn registry", async () => {
  const [sourceCatalog, publicCatalog] = await Promise.all([
    readJson("registry.json"),
    readJson("public/r/registry.json"),
  ]);

  assert.deepEqual(publicCatalog, sourceCatalog);
  assert.equal(publicCatalog.name, "solace-shaders");
  assert.equal(publicCatalog.homepage, "https://www.solaceui.com");
  assert.deepEqual(
    publicCatalog.items.map(({ name }) => name),
    shaderNames,
  );

  for (const name of shaderNames) {
    const item = await readJson(`public/r/${name}.json`);
    assert.equal(item.name, name);
    assert.equal(item.type, "registry:component");
    assert.equal(item.files.length, 1);
    assert.match(item.files[0].content, /export (function|type)/);
  }
});

test("keeps all catalog detail routes and their shader labs", async () => {
  const routes = [
    ["thermal-pixel-ink", /<ShaderLab \/>/],
    ["viscous-cursor-dye", /variant="viscous"/],
    ["reaction-bloom", /variant="reaction"/],
    ["cellular-contagion", /variant="cellular"/],
  ];

  for (const [slug, expected] of routes) {
    const page = await readFile(
      new URL(`app/shaders/${slug}/page.tsx`, root),
      "utf8",
    );
    assert.match(page, expected);
  }
});

test("does not retain retired hosting and database infrastructure", async () => {
  const retiredPaths = [
    ".openai/hosting.json",
    "vite.config.ts",
    "worker/index.ts",
    "build/sites-vite-plugin.ts",
    "drizzle.config.ts",
    "db/index.ts",
    "examples/d1/app/api/notes/route.ts",
  ];

  for (const path of retiredPaths) {
    await assert.rejects(access(new URL(path, root)));
  }
});
