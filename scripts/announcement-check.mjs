import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BRAND_LAB_BROWSER ? { executablePath: process.env.BRAND_LAB_BROWSER } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('outputs/announcement', { recursive: true });
try {
  await page.goto(process.env.ANNOUNCEMENT_URL || 'http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.locator('.proof[data-ready="true"]').waitFor({ timeout: 60000 });
  const source = await page.locator('.proof .bl-source canvas').elementHandle();
  assert.ok(source);
  assert.equal(await page.locator('.proof-material[data-ready="true"]').count(), 3);
  assert.equal(await page.locator('.proof-brand,.proof-review,.proof-playback,.proof-steps i').count(), 0);
  assert.equal(await page.locator('.proof-header').innerText(), 'Introducing Brand Lab');
  assert.equal(await page.locator('.proof-primary').evaluate(el => getComputedStyle(el).borderTopColor), 'rgba(0, 0, 0, 0)');
  const href = await page.locator('.proof-primary').getAttribute('href');
  assert.equal(JSON.parse(new URL(href, 'http://localhost').searchParams.get('brandLab')).shaderId, 'specimen-index');
  await page.locator('.proof[data-phase="2"]').waitFor();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'outputs/announcement/dark-studio-1440.png' });
  await page.locator('.proof[data-phase="0"]').waitFor({ timeout: 15000 });
  assert.ok(await source.evaluate(el => el === document.querySelector('.proof .bl-source canvas')), 'Loop must reuse its WebGL renderer');
  assert.equal(await page.locator('.proof .bl-source canvas').count(), 1);
  // Exercise visibility handling without depending on headless tab occlusion.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('.proof .bl-source').waitFor({ state: 'detached' });
  await page.waitForTimeout(3500);
  assert.equal(await page.locator('.proof').getAttribute('data-phase'), '0');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('.proof[data-phase="2"]').waitFor();
  console.log('Loop reuses one renderer; hidden-tab work stops.');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 650 ? 1000 : 844 });
    await page.waitForTimeout(1800);
    assert.ok(await page.locator('.proof-dialog').evaluate(el => el.scrollWidth <= el.clientWidth), `Overflow at ${width}`);
    if (width === 390) await page.screenshot({ path: 'outputs/announcement/dark-studio-390.png' });
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.proof-dialog[open]').count(), 0);
  assert.equal(await page.locator('.proof .bl-source').count(), 0);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.proof[data-phase="2"]').waitFor();
  await page.waitForTimeout(10500);
  assert.equal(await page.locator('.proof').getAttribute('data-phase'), '2');
  assert.equal(await page.locator('.proof .bl-source').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Dark Open Studio: clean UI, loop, renderer reuse, responsive layouts, handoff, Escape and reduced motion passed.');
} finally { await browser.close(); }
