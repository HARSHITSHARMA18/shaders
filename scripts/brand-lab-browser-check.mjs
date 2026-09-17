// Optional local browser validation. Uses an existing Playwright installation;
// it is not a dependency of the product or the normal build/test pipeline.
// BRAND_LAB_PLAYWRIGHT_PATH may point at a bundled playwright/index.js.
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || "playwright");
const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const output = path.join(root, "outputs/brand-lab");
const previews = path.join(root, "public/brand-lab/previews");
await mkdir(output, { recursive: true });
await mkdir(previews, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BRAND_LAB_BROWSER ? { executablePath: process.env.BRAND_LAB_BROWSER } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const messages = [];
const warnings = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && !message.text().includes("404")) messages.push(message.text()); });
page.on("console", message => { if (message.type() === "warning") warnings.push(message.text()); });
const results = [];
const ready = async () => {
  // Named sidebar rows may sit below the Scene at small viewports. A live
  // preview deliberately pauses offscreen; inspect it in view before waiting.
  await page.locator(".bl-study").scrollIntoViewIfNeeded();
  await page.locator('canvas[data-material="study"][data-ready="true"]').waitFor({ timeout: 15000 });
};
const pixels = () => page.locator('canvas[data-material="study"]').evaluate(canvas => {
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  const colors = new Set();
  let brightness = 0;
  for (let i = 0; i < data.length; i += 160) {
    colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    brightness += data[i] + data[i + 1] + data[i + 2];
  }
  return { colors: colors.size, brightness, width: canvas.width, height: canvas.height };
});

try {
  await page.goto(process.env.BRAND_LAB_URL || "http://127.0.0.1:3000/brand-lab");
  await ready();
  await page.screenshot({ path: path.join(output, "default-desktop.png"), fullPage: true });
  const posterRect = await page.locator(".bl-poster").boundingBox();
  if (process.env.BRAND_LAB_SKIP_SHADER_SWEEP !== "1") for (const shader of registry.items) {
    const started = Date.now();
    await page.getByRole("button", { name: shader.title, exact: true }).click();
    await ready();
    const firstFrameMs = Date.now() - started;
    // Allow media texture readiness and particle assembly to become representative.
    // A finite wait belongs in frame capture, not in the application's interaction.
    await page.waitForTimeout(shader.name === "particle-assembly" ? 3500 : 400);
    assert.equal(await page.getByRole("button", { name: shader.title, exact: true }).getAttribute("aria-pressed"), "true");
    const frame = await pixels();
    assert.ok(frame.colors > 8, `${shader.name} produced a blank/flat material (${frame.colors} colors)`);
    assert.equal(await page.locator(".bl-source canvas").count(), 1, "Only one WebGL source is mounted");
    const box = await page.locator(".bl-poster").boundingBox();
    assert.ok(Math.abs(box.width - posterRect.width) < 2, "Shader changes keep composition width stable");
    const png = await page.locator('canvas[data-material="study"]').evaluate(canvas => {
      const thumb = document.createElement("canvas");
      thumb.width = thumb.height = 128;
      const size = Math.min(canvas.width, canvas.height);
      thumb.getContext("2d").drawImage(canvas, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size, 0, 0, 128, 128);
      return thumb.toDataURL("image/png").split(",")[1];
    });
    if (process.env.BRAND_LAB_CAPTURE_PREVIEWS === "1") await writeFile(path.join(previews, `${shader.name}.png`), Buffer.from(png, "base64"));
    results.push({ id: shader.name, firstFrameMs, captureMs: Date.now() - started, ...frame });
    console.log(`PASS ${shader.name}: ${frame.colors} sampled colors`);
  }
  if (results.length) await writeFile(path.join(output, "shader-report.json"), JSON.stringify(results, null, 2));
  await page.getByRole("button", { name: "Original / No shader", exact: true }).click();
  assert.equal(await page.locator(".bl-source canvas").count(), 0);
  await page.screenshot({ path: path.join(output, "original-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Thermal Pixel Ink", exact: true }).click();
  await ready();
  await page.getByRole("button", { name: "Select Campaign poster", exact: true }).press("Enter");
  assert.equal(await page.locator('.bl-shader-tile[title]').count(), 0, "No duplicate native hover tooltips");
  await page.getByRole("button", { name: "Placement: Background", exact: true }).press("ArrowDown");
  await page.getByRole("option", { name: /Background/ }).press("ArrowDown");
  await page.getByRole("option", { name: /Mask/ }).press("Enter");
  assert.equal(await page.getByRole("listbox", { name: "Placement" }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Placement: Mask", exact: true }).evaluate(button => button === document.activeElement), true);
  await page.getByRole("button", { name: "Placement: Mask", exact: true }).click();
  assert.equal(await page.getByRole("option", { name: /Accent/ }).count(), 0);
  await page.getByRole("option", { name: /Mask/ }).press("Escape");
  assert.equal(await page.locator(".bl-poster").getAttribute("data-placement"), "Mask");
  await page.getByLabel("Material strength", { exact: true }).fill("60");
  assert.match(await page.locator(".bl-poster").getAttribute("style"), /0.6/);
  await page.getByRole("button", { name: "Close surface controls" }).click();
  await page.getByRole("button", { name: "Use your brand ↗" }).click();
  assert.equal(await page.locator("dialog").evaluate(dialog => dialog.open), true);
  const liveSource = await page.locator(".bl-source canvas").elementHandle();
  await page.getByLabel("Brand name", { exact: true }).fill("COMMON");
  await page.getByLabel("Campaign line", { exact: true }).fill("Room for another perspective.");
  assert.equal(await page.evaluate(source => document.querySelector(".bl-source canvas") === source, liveSource), true, "Copy edits must preserve the live renderer instance");
  assert.equal(await page.locator(".bl-poster h2").textContent(), "Room for another perspective.");
  await page.getByLabel("Upload campaign media").setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not a png") });
  await page.getByText("This file could not be opened.", { exact: false }).waitFor();
  assert.match(await page.locator(".bl-study-window img").getAttribute("src"), /exposure-grid-mountain/);
  await page.getByLabel("Upload campaign media").setInputFiles(path.join(root, "public/fluid-distortion-hero.png"));
  await page.waitForFunction(() => document.querySelector(".bl-study-window img").getAttribute("src").startsWith("blob:"));
  const uploadedUrl = await page.locator(".bl-study-window img").getAttribute("src");
  await page.getByLabel("Upload logo").setInputFiles(path.join(root, "public/favicon.svg"));
  await page.waitForFunction(() => document.querySelector(".bl-brand-name img")?.getAttribute("src").startsWith("blob:"));
  await page.getByRole("button", { name: "Reset identity" }).click();
  assert.equal(await page.evaluate(async url => { try { await fetch(url); return true; } catch { return false; } }, uploadedUrl), false, "Reset must revoke uploaded media URL");
  await page.getByRole("button", { name: "Back to canvas ↗" }).click();
  if (process.env.BRAND_LAB_TEST_VIDEO) {
    await page.getByRole("button", { name: "Exposure Grid", exact: true }).click();
    await ready();
    await page.getByRole("button", { name: "Use your brand ↗" }).click();
    await page.getByLabel("Upload campaign media").setInputFiles(process.env.BRAND_LAB_TEST_VIDEO);
    await page.locator(".bl-study-window video").waitFor();
    await page.getByRole("button", { name: "Back to canvas ↗" }).click();
    await ready();
    await page.waitForTimeout(500);
    assert.ok((await pixels()).colors > 8, "Uploaded video must produce real material output");
    await page.getByRole("button", { name: "Use your brand ↗" }).click();
    await page.getByRole("button", { name: "Reset identity" }).click();
    await page.getByRole("button", { name: "Back to canvas ↗" }).click();
  }
  await page.getByRole("button", { name: "Select Campaign poster" }).click();
  await page.getByRole("button", { name: "Placement: Mask", exact: true }).click();
  await page.getByRole("option", { name: /Background/ }).click();
  await page.getByLabel("Material strength").fill("100");
  await page.getByRole("button", { name: "Close surface controls" }).click();
  await page.getByRole("button", { name: "Thermal Etch Burn", exact: true }).click();
  await ready();
  const cadence = await page.evaluate(() => new Promise(resolve => {
    const canvas = document.querySelector('canvas[data-material="poster"]');
    const first = Number(canvas.dataset.frame), start = performance.now();
    setTimeout(() => resolve({ copiesPerSecond: (Number(canvas.dataset.frame) - first) * 1000 / (performance.now() - start), source: [...document.querySelectorAll(".bl-source canvas")].map(c => ({ width: c.width, height: c.height })), presentationCanvases: document.querySelectorAll("canvas[data-material]").length }), 1500);
  }));
  await page.screenshot({ path: path.join(output, "campaign-desktop.png"), fullPage: true });

  // Reduced-motion still must recapture after selecting another shader.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Reaction Bloom", exact: true }).click();
  await ready();
  await page.waitForTimeout(2200);
  assert.equal(await page.locator(".bl-source canvas").count(), 0);
  await page.getByRole("button", { name: "Magnetic Pixels", exact: true }).click();
  await ready();
  assert.ok((await pixels()).colors > 8);
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Mobile is a deliberately simplified stacked browse/test flow.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Thermal Pixel Ink", exact: true }).click();
  await ready();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Mobile must not overflow horizontally");
  await page.screenshot({ path: path.join(output, "campaign-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1024, height: 900 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Tablet must not overflow horizontally");
  // More switches than Chrome's usual context limit; detached preview contexts
  // must be released while the currently selected shader remains usable.
  for (let i = 0; i < 18; i++) {
    await page.getByRole("button", { name: i % 2 ? "Viscous Cursor Dye" : "Reaction Bloom", exact: true }).click();
    await ready();
  }

  // Explicitly exercise the unsupported-device recovery rather than accepting blank output.
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === "webgl2" ? null : original.call(this, type, ...args); };
  });
  await fallback.goto(process.env.BRAND_LAB_URL || "http://127.0.0.1:3000/brand-lab");
  await fallback.getByText("Live material unavailable.", { exact: false }).waitFor({ timeout: 15000 });
  await fallback.close();
  assert.deepEqual(errors, [], "No uncaught browser errors");
  assert.deepEqual(messages.filter(message => !message.includes("Failed to load resource")), [], "No shader compilation errors");
  assert.deepEqual(warnings.filter(message => /Too many active WebGL|CONTEXT_LOST/i.test(message)), [], "No context exhaustion after repeated switching");
  await writeFile(path.join(output, "browser-report.json"), JSON.stringify({ results, cadence, errors, messages, warnings }, null, 2));
  console.log("PASS original, surface controls, keyboard selection, invalid media, reduced motion, mobile/tablet, no-WebGL fallback");
} finally { await browser.close(); }
