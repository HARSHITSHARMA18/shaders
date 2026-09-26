import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.BRAND_LAB_ORIGIN || 'http://127.0.0.1:3005';
const browser = await chromium.launch({ headless: true, ...(process.env.BRAND_LAB_BROWSER ? { executablePath: process.env.BRAND_LAB_BROWSER } : {}) });
const page = await browser.newPage({ viewport: { width: 1745, height: 828 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function rendererSettings(selector) {
  return page.locator(selector).evaluate(canvas => {
    const key = Object.keys(canvas).find(name => name.startsWith('__reactFiber'));
    let root = canvas[key];
    while (root?.return) root = root.return;
    const find = (fiber, props) => {
      if (!fiber) return null;
      const next = fiber.memoizedProps?.settings ? fiber.memoizedProps : props;
      if (fiber.stateNode === canvas) return next;
      for (let child = fiber.child; child; child = child.sibling) {
        const result = find(child, next);
        if (result) return result;
      }
      return null;
    };
    return JSON.parse(JSON.stringify(find(root.stateNode.current, null)?.settings));
  });
}

try {
  await page.goto(`${origin}/shaders/viscous-cursor-dye`);
  await page.locator('.stage canvas').waitFor();
  await page.waitForFunction(() => localStorage.getItem('dialkit:solace-viscous-cursor-dye'));
  await page.evaluate(() => {
    const key = 'dialkit:solace-viscous-cursor-dye';
    const data = JSON.parse(localStorage.getItem(key));
    data.values['material.distortion'] = 1.25;
    data.values['material.trail'] = 0.85;
    data.values['motion.speed'] = 0.6;
    data.values['color.primary'] = '#A442CC';
    data.baseValues['material.distortion'] = 1.25;
    data.baseValues['material.trail'] = 0.85;
    data.baseValues['motion.speed'] = 0.6;
    data.baseValues['color.primary'] = '#A442CC';
    data.presets = [{ id: 'brand-lab-proof', name: 'Brand Lab proof', values: { ...data.values } }];
    data.activePresetId = 'brand-lab-proof';
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page.locator('.stage canvas').waitFor();
  await page.waitForFunction(() => document.querySelector('.stage canvas')?.width > 1);
  const native = await rendererSettings('.stage canvas');
  assert.equal(native.distortion, 1.25);
  assert.equal(native.trail, 0.85);
  assert.equal(native.speed, 0.6);
  assert.equal(native.colors.primary.toLowerCase(), '#a442cc');
  await page.locator('.brandLabHeaderControl summary').click();
  const link = page.getByRole('link', { name: 'Open Brand Lab' });
  await page.waitForFunction(() => {
    const href = [...document.querySelectorAll('a')].find(a => a.textContent?.includes('Open Brand Lab'))?.href;
    return href && JSON.parse(new URL(href).searchParams.get('brandLab'))?.editorNative?.distortion === 1.25;
  });
  const transfer = JSON.parse(new URL(await link.getAttribute('href'), origin).searchParams.get('brandLab'));
  assert.deepEqual(transfer.editorNative, native, 'editor preset snapshot differs from the active renderer');
  await link.click();
  await page.locator('.bl-source canvas').waitFor();
  await page.waitForFunction(() => document.querySelector('.bl-poster canvas[data-ready="true"]'));
  assert.deepEqual(await rendererSettings('.bl-source canvas'), native, 'Brand Lab renderer did not receive the exact preset');
  const pausedButton = page.getByRole('button', { name: 'Pause shader motion' });
  await pausedButton.click();
  await page.locator('.bl-source').waitFor({ state: 'detached' });
  const canvas = page.locator('.bl-poster canvas[data-material]');
  const held = await canvas.evaluate(node => node.toDataURL());
  await page.waitForTimeout(650);
  assert.equal(await canvas.evaluate(node => node.toDataURL()), held, 'paused canvas changed');

  await page.locator('[data-surface-id="poster"]').click();
  const downloadButton = page.getByRole('button', { name: 'Download PNG' });
  const downloadOnce = async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  };
  const first = await downloadOnce();
  const second = await downloadOnce();
  assert.equal(first.readUInt32BE(16), 1080);
  assert.equal(first.readUInt32BE(20), 1350);
  assert.equal(createHash('sha256').update(first).digest('hex'), createHash('sha256').update(second).digest('hex'), 'exports of a held frame differ');
  assert.equal(await canvas.evaluate(node => node.toDataURL()), held, 'export moved the held frame');

  await page.getByRole('button', { name: 'Resume shader motion' }).click();
  await page.locator('.bl-source canvas').waitFor();
  await page.waitForFunction(previous => document.querySelector('.bl-poster canvas[data-material]')?.toDataURL() !== previous, held);
  await page.locator('[data-surface-id="poster"]').click();
  await downloadOnce();
  assert.equal(await page.getByRole('button', { name: 'Resume shader motion' }).getAttribute('aria-pressed'), 'true', 'download did not hold its frame');
  const automatic = await canvas.evaluate(node => node.toDataURL());
  await page.waitForTimeout(500);
  assert.equal(await canvas.evaluate(node => node.toDataURL()), automatic, 'automatic pause drifted after export');
  await mkdir('outputs/brand-lab', { recursive: true });
  await page.screenshot({ path: 'outputs/brand-lab/preset-pause-desktop.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Resume shader motion' }).click();
  await page.locator('.bl-source canvas').waitFor();
  await page.getByRole('button', { name: 'Pause shader motion' }).click();
  assert.equal(await page.locator('.bl-motion-toggle').getAttribute('aria-pressed'), 'true');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile layout overflows');
  await page.screenshot({ path: 'outputs/brand-lab/preset-pause-mobile.png' });
  assert.deepEqual(errors, []);
  console.log('Preset settings, held canvas, repeat PNGs, automatic pause, resume, and mobile layout: passed');
} finally {
  await browser.close();
}
