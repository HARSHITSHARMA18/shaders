// Optional browser integration QA, using an external Playwright runtime.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || 'playwright');
const registry = JSON.parse(await readFile('registry.json', 'utf8'));
const base = process.env.BRAND_LAB_URL || 'http://127.0.0.1:3004/brand-lab';
const origin = new URL(base).origin;
await mkdir('outputs/brand-lab', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BRAND_LAB_BROWSER ? { executablePath: process.env.BRAND_LAB_BROWSER } : {}) });
const context = await browser.newContext({ viewport: { width: 1745, height: 828 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
const drawer = page.locator('.bl-tune-drawer');
const snapshot = async () => JSON.parse(new URL(await page.locator('.bl-footer a').getAttribute('href'), origin).searchParams.get('brandLab'));
const readNative = async (selector = '.bl-source canvas') => page.locator(selector).evaluate(canvas => {
  const key = Object.keys(canvas).find(key => key.startsWith('__reactFiber'));
  let root = canvas[key]; while (root.return) root = root.return;
  function find(fiber, props) {
    const next = fiber.memoizedProps?.settings ? fiber.memoizedProps : props;
    if (fiber.stateNode === canvas) return next;
    for (let child = fiber.child; child; child = child.sibling) { const found = find(child, next); if (found) return found; }
    return null;
  }
  return JSON.parse(JSON.stringify(find(root.stateNode.current, null).settings));
});
const ready = async () => { await page.locator('.bl-study').scrollIntoViewIfNeeded(); await page.locator('canvas[data-material="study"][data-ready="true"]').waitFor(); await page.locator('.bl-source canvas').waitFor({ state: 'attached' }); };
try {
  await page.goto(base); await ready();
  assert.equal(await drawer.count(), 0, 'drawer is closed by default');
  const posterBefore = await page.locator('.bl-poster').boundingBox();
  await page.getByRole('button', { name: 'Tune shader', exact: true }).click();
  assert.equal(await drawer.count(), 1);
  assert.ok(await drawer.boundingBox().then(box => box.x > 1300), 'drawer opens on the right');
  const posterAfter = await page.locator('.bl-poster').boundingBox();
  assert.equal(posterBefore.width, posterAfter.width, 'drawer cannot resize the composition');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'bl-tune-heading');
  for (const shader of registry.items) {
    await page.getByRole('button', { name: shader.title, exact: true }).click(); await ready();
    if (!await drawer.count()) await page.getByRole('button', { name: 'Tune shader', exact: true }).click();
    assert.equal(await drawer.getByRole('slider').filter({ has: page.locator('.dialkit-slider') }).count(), 3);
    await page.locator('.bl-source canvas').evaluate(canvas => { window.__blSource = canvas; });
    const before = await readNative();
    const sliders = drawer.locator('.bl-tune-slider');
    for (let index = 0; index < 3; index++) {
      const slider = sliders.nth(index), key = await slider.getAttribute('data-control');
      const old = Number(await slider.getAttribute('aria-valuenow'));
      await slider.focus(); await slider.press('ArrowRight');
      const current = Number(await slider.getAttribute('aria-valuenow'));
      assert.notEqual(current, old, shader.name + ' ' + key + ' does not adjust');
      assert.equal((await readNative())[key], current, 'control does not reach the native renderer');
      const setup = await snapshot();
      assert.equal(setup.version, 2); assert.equal(setup.tuning[key], current); assert.equal(setup.native[key], current);
    }
    assert.ok(await page.locator('.bl-source canvas').evaluate(canvas => canvas === window.__blSource), 'live adjustments remounted the native source');
    results.push({ id: shader.name, controls: Object.keys((await snapshot()).tuning), nativeValuesMatch: true });
    console.log('PASS curated live controls: ' + shader.name);
    if (shader.name === 'refractive-lens') { assert.equal(await drawer.getByRole('group', { name: 'Material palette' }).count(), 0); }
    // Rendered adapter settings should preserve every untuned property.
    const setup = await snapshot(), current = await readNative();
    for (const key of Object.keys(before)) if (!(key in setup.tuning)) assert.deepEqual(current[key], before[key]);
    const editorUrl = await drawer.getByRole('link', { name: 'Explore full editor' }).getAttribute('href');
    await page.goto(new URL(editorUrl, origin).href); await page.locator('.stage canvas').waitFor();
    const editorNative = await readNative('.stage canvas');
    for (const key of Object.keys(setup.native)) if (key !== 'svg') assert.deepEqual(editorNative[key], setup.native[key], shader.name + ' tuned transfer ' + key);
    results.at(-1).tunedEditorTransfer = true;
    if (shader.name === 'fluid-distortion') {
      await page.getByRole('button', { name: 'View configured JSX' }).click();
      assert.ok((await page.locator('#configured-jsx').textContent()).includes('softness={' + setup.native.softness.toFixed(3) + '}'), 'configured JSX loses softness precision');
    }
    await page.locator('.brandLabTransferNotice a').click(); await ready();
    await page.getByRole('button', { name: 'Tune shader', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Viscous Cursor Dye', exact: true }).click(); await ready();
  for (const slider of await drawer.locator('.bl-tune-slider').all()) { await slider.focus(); await slider.press('ArrowRight'); }
  const kept = await snapshot();
  await page.getByRole('button', { name: 'Reaction Bloom', exact: true }).click(); await ready();
  await page.getByRole('button', { name: 'Viscous Cursor Dye', exact: true }).click(); await ready();
  assert.deepEqual((await snapshot()).tuning, kept.tuning, 'switching effects loses adjustments');
  await drawer.getByRole('button', { name: 'Original', exact: true }).click();
  assert.equal((await readNative()).colors.primary, '#1236ff');
  assert.deepEqual((await snapshot()).tuning, kept.tuning, 'palette switching loses adjustments');
  await drawer.getByRole('button', { name: 'Brand', exact: true }).click();
  assert.equal((await readNative()).colors.primary, '#d6f369');
  const colors = drawer.locator('.bl-tune-colors');
  assert.equal(await colors.getAttribute('open'), null, 'brand colors should start collapsed');
  await colors.locator('summary').click();
  const hex = colors.getByRole('textbox', { name: 'Hex color' });
  await hex.fill('#c4e85a'); await hex.press('Enter');
  assert.equal((await readNative()).colors.primary.toLowerCase(), '#c4e85a');
  await hex.fill('#d6f369'); await hex.press('Enter');
  await colors.locator('summary').click();
  // The actual DialKit track must support pointer editing as well as keyboard.
  const track = drawer.locator('.dialkit-slider').first(); const box = await track.boundingBox();
  const old = (await readNative()).distortion;
  await page.mouse.move(box.x + box.width * .4, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .65, box.y + box.height / 2, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(100);
  assert.notEqual((await readNative()).distortion, old);
  await page.screenshot({ path: 'outputs/brand-lab/tuning-desktop.png', fullPage: true });
  await drawer.locator('#bl-tune-heading').focus(); await page.keyboard.press('Escape');
  assert.equal(await drawer.count(), 0); assert.ok(await page.getByRole('button', { name: 'Tune shader', exact: true }).evaluate(button => document.activeElement === button));
  await page.getByRole('button', { name: 'Copy setup link', exact: true }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText()); const expected = await snapshot();
  await page.goto(shared); await ready(); assert.deepEqual(await readNative(), expected.native);
  await page.getByRole('button', { name: 'Tune shader', exact: true }).click();
  const transfer = await drawer.getByRole('link', { name: 'Explore full editor' }).getAttribute('href');
  await page.goto(new URL(transfer, origin).href); await page.locator('.stage canvas').waitFor();
  await page.waitForTimeout(100); assert.deepEqual(await readNative('.stage canvas'), expected.native);
  await page.locator('.brandLabTransferNotice a').click(); await ready();
  await page.getByRole('button', { name: 'Tune shader', exact: true }).click();
  await drawer.getByRole('button', { name: 'Reset shader settings' }).click();
  assert.deepEqual((await snapshot()).tuning, {});
  assert.equal((await readNative()).distortion, .8);
  const legacy = await snapshot(); legacy.version = 1; delete legacy.tuning;
  await page.goto(origin + '/brand-lab?brandLab=' + encodeURIComponent(JSON.stringify(legacy))); await ready();
  assert.equal((await snapshot()).version, 2, 'v1 setup is not migrated');
  const invalid = await snapshot(); invalid.tuning = { distortion: 999 }; invalid.native.distortion = 999;
  await page.goto(origin + '/brand-lab?brandLab=' + encodeURIComponent(JSON.stringify(invalid)));
  assert.match(await page.locator('.bl-footer').textContent(), /invalid or unsupported/);
  const mobile = await context.newPage(); await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(shared); await mobile.getByRole('button', { name: 'Tune shader', exact: true }).click();
  const mobileDrawer = mobile.locator('.bl-tune-drawer'), bounds = await mobileDrawer.boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390 && bounds.y > 100 && bounds.y + bounds.height <= 844);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: 'outputs/brand-lab/tuning-mobile.png' });
  await mobile.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' }); await reduced.goto(shared);
  await reduced.locator('.bl-study').scrollIntoViewIfNeeded(); await reduced.locator('canvas[data-material="study"][data-ready="true"]').waitFor();
  await reduced.waitForTimeout(1800); assert.equal(await reduced.locator('.bl-source canvas').count(), 0);
  await reduced.getByRole('button', { name: 'Tune shader', exact: true }).click();
  await reduced.getByRole('slider', { name: 'Distortion', exact: true }).focus(); await reduced.keyboard.press('ArrowRight');
  await reduced.locator('.bl-source canvas').waitFor({ state: 'attached' }); await reduced.waitForTimeout(1900);
  assert.equal(await reduced.locator('.bl-source canvas').count(), 0, 'tuned reduced-motion frame did not release its source');
  await reduced.close();
  assert.deepEqual(errors, []);
  await writeFile('outputs/brand-lab/tuning-report.json', JSON.stringify({ results, sharedTuning: true, editorTransfer: true, legacyMigration: true, reset: true, mobile: true, reducedMotion: true, errors }, null, 2));
  console.log('PASS tuning persistence, native transfer, v1 migration, reset, mobile sheet, reduced motion');
} catch(error) { await page.screenshot({ path: 'outputs/brand-lab/tuning-failure.png', fullPage: true }); throw error; }
finally { await browser.close(); }
