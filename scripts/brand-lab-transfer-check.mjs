// Optional integration QA using an external Playwright runtime, no product dependency.
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
page.on('pageerror', e => errors.push(e.message));
const readNative = () => page.locator('.stage canvas').evaluate(canvas => {
  const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber'));
  let root = canvas[key]; while (root?.return) root = root.return;
  function find(fiber, props) {
    if (!fiber) return null;
    const next = fiber.memoizedProps?.settings ? fiber.memoizedProps : props;
    if (fiber.stateNode === canvas) return next;
    for (let child = fiber.child; child; child = child.sibling) { const found = find(child, next); if (found) return found; }
    return null;
  }
  const props = find(root.stateNode.current, null);
  if (props) return JSON.parse(JSON.stringify(props));
  return null;
});
try {
  await page.goto(origin + '/shaders/viscous-cursor-dye');
  await page.locator('.stage canvas').waitFor(); await page.waitForTimeout(250);
  await page.evaluate(() => {
    const key = 'dialkit:solace-viscous-cursor-dye';
    const data = JSON.parse(localStorage.getItem(key));
    data.values['material.distortion'] = 1.25;
    data.baseValues['material.distortion'] = 1.25;
    data.presets = [{ id: 'saved-review', name: 'Saved review', values: { ...data.values } }];
    data.activePresetId = 'saved-review';
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload(); await page.locator('.stage canvas').waitFor(); await page.waitForTimeout(250);
  assert.equal((await readNative()).settings.distortion, 1.25);
  const saved = await page.evaluate(() => localStorage.getItem('dialkit:solace-viscous-cursor-dye'));
  await page.goto(base);
  await page.getByRole('button', { name: 'Use your brand' }).click();
  await page.getByLabel('Brand name', { exact: true }).fill('NOVA');
  await page.getByLabel('Campaign line', { exact: true }).fill('A shared direction.');
  await page.getByRole('button', { name: 'Back to canvas' }).click();
  for (const shader of registry.items) {
    await page.getByRole('button', { name: shader.title, exact: true }).click();
    const href = await page.locator('.bl-footer a').getAttribute('href');
    const url = new URL(href, origin);
    const setup = JSON.parse(url.searchParams.get('brandLab'));
    assert.equal(setup.brand.name, 'NOVA');
    await page.goto(url.href);
    await page.locator('.stage canvas').waitFor(); await page.waitForTimeout(300);
    const actual = await readNative();
    assert.ok(actual?.settings, shader.name + ' settings missing');
    const expected = { ...setup.native }, native = { ...actual.settings };
    // SVG is dormant for a word target; the editor retains its own SVG draft.
    if (shader.name === 'particle-assembly') { delete expected.svg; delete native.svg; }
    assert.deepEqual(native, expected, shader.name + ' transferred settings differ');
    await page.waitForFunction(expected => {
      const href = document.querySelector('.brandLabTransferAction')?.href;
      return href && JSON.stringify(JSON.parse(new URL(href).searchParams.get('brandLab')).editorNative) === JSON.stringify(expected);
    }, actual.settings);
    if (['refractive-lens','exposure-grid','fluid-distortion','blackhole-lensing','specimen-index','thermal-etch-burn'].includes(shader.name)) assert.equal(actual.src, setup.brand.media);
    assert.equal(await page.locator('.brandLabHeaderControl').count(), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem('dialkit:solace-viscous-cursor-dye')), saved, 'saved values/presets changed');
    results.push({ id: shader.name, nativeSettingsMatch: true });
    console.log(shader.name + ': native settings match');
    await page.locator('.brandLabHeaderControl summary').click();
    await page.locator('.brandLabTransferAction').click();
    await page.locator('.bl-shader-rail').waitFor();
  }
  await page.getByRole('button', { name: 'Viscous Cursor Dye', exact: true }).click();
  await page.locator('.bl-footer a').click(); await page.locator('.stage canvas').waitFor();
  const beforeEdit = (await readNative()).settings.scale;
  const slider = page.locator('.dialkit-slider-wrapper:visible').filter({ has: page.locator('.dialkit-slider-label', { hasText: /^scale$/i }) }).last();
  const box = await slider.locator('.dialkit-slider').boundingBox();
  await slider.locator('.dialkit-slider').click({ position: { x: box.width * .7, y: box.height / 2 } });
  await page.waitForFunction(before => {
    const value = [...document.querySelectorAll('.dialkit-slider-wrapper')].find(element => element.getClientRects().length)?.querySelector('.dialkit-slider-value');
    return value && Number(value.textContent) !== before;
  }, beforeEdit);
  assert.notEqual((await readNative()).settings.scale, beforeEdit, 'temporary panel did not respond to an edit');
  assert.equal(await page.evaluate(() => localStorage.getItem('dialkit:solace-viscous-cursor-dye')), saved);
  assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('-brand-lab')).length), 0);
  await page.goto(origin + '/shaders/viscous-cursor-dye');
  await page.locator('.stage canvas').waitFor(); await page.waitForTimeout(250);
  assert.equal((await readNative()).settings.distortion, 1.25);
  assert.equal(await page.locator('.brandLabHeaderControl summary').count(), 1);
  await page.goto(base);
  await page.getByRole('button', { name: 'Viscous Cursor Dye', exact: true }).click();
  await page.getByRole('button', { name: 'Copy setup link', exact: true }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(shared);
  assert.equal(await page.getByRole('button', { name: 'Viscous Cursor Dye', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: 'outputs/brand-lab/setup-desktop.png', fullPage: true });
  const portable = JSON.parse(new URL(shared).searchParams.get('brandLab'));
  portable.brand.name = 'SHARED'; portable.brand.tagline = 'One direction, many expressions.';
  portable.treatments.poster = { placement: 'Mask', intensity: 42 };
  // Native settings for this Field do not depend on the brand name.
  portable.missing = ['logo', 'media'];
  const restored = origin + '/brand-lab?brandLab=' + encodeURIComponent(JSON.stringify(portable));
  await page.goto(restored);
  assert.equal(await page.locator('.bl-poster').getAttribute('data-placement'), 'Mask');
  assert.equal(await page.locator('.bl-poster').evaluate(el => el.style.getPropertyValue('--material-strength')), '0.42');
  await page.getByRole('button', { name: 'Replace assets' }).click();
  assert.equal(await page.getByLabel('Brand name', { exact: true }).inputValue(), 'SHARED');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII=', 'base64');
  await page.getByLabel('Upload logo', { exact: true }).setInputFiles({ name: 'mark.png', mimeType: 'image/png', buffer: png });
  await page.locator('.bl-upload-error').filter({ hasText: 'Opening your asset' }).waitFor({ state: 'hidden' });
  await page.getByLabel('Upload campaign media', { exact: true }).setInputFiles({ name: 'study.png', mimeType: 'image/png', buffer: png });
  await page.locator('.bl-upload-error').filter({ hasText: 'Opening your asset' }).waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Back to canvas' }).click();
  assert.equal(await page.locator('.bl-setup-notice').count(), 0);
  await page.getByRole('button', { name: 'Copy setup link', exact: true }).click();
  const uploadedLink = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(!uploadedLink.includes('blob'), 'upload URL leaked into portable setup');
  assert.deepEqual(JSON.parse(new URL(uploadedLink).searchParams.get('brandLab')).missing.sort(), ['logo', 'media']);
  await page.getByRole('button', { name: 'Thermal Etch Burn', exact: true }).click();
  await page.locator('.bl-footer a').click();
  await page.locator('.stage canvas').waitFor();
  await page.locator('.brandLabHeaderControl summary').click();
  assert.equal(await page.getByRole('button', { name: 'Replace media', exact: true }).count(), 1);
  await page.getByLabel('Replace campaign image', { exact: true }).setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: png });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.stage canvas');
    const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber'));
    let root = canvas[key]; while(root.return) root=root.return;
    function find(f) { if (f?.memoizedProps?.src?.startsWith('blob:')) return true; for(let c=f?.child;c;c=c.sibling) if(find(c)) return true; return false; }
    return find(root.stateNode.current);
  });
  await page.getByRole('button', { name: 'View configured JSX', exact: true }).click();
  assert.match(await page.locator('.codePanel').textContent(), /src="\/your-image.jpg"/);
  await page.screenshot({ path: 'outputs/brand-lab/transferred-editor.png', fullPage: true });
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(uploadedLink);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'restored mobile setup overflows');
  await mobile.getByRole('button', { name: 'Replace assets' }).click();
  await mobile.screenshot({ path: 'outputs/brand-lab/setup-mobile.png', fullPage: true });
  await mobile.close();
  await page.goto(origin + '/brand-lab?brandLab=invalid');
  assert.match(await page.locator('.bl-footer').textContent(), /invalid or unsupported/);
  assert.deepEqual(errors, []);
  await writeFile('outputs/brand-lab/transfer-report.json', JSON.stringify({ results, preservedPreset: true, temporaryPanel: true, setupRoundTrip: true, errors }, null, 2));
  console.log(JSON.stringify({ shaders: results.length, preservedPreset: true, setupRoundTrip: true }));
} catch(error) { await page.screenshot({ path: 'outputs/brand-lab/transfer-failure.png', fullPage: true }); throw error; }
finally { await browser.close(); }
