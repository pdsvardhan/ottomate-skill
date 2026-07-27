// run-pixel.mjs — the host half of P2. Renders panels in real Chromium, screenshots each, and
// reports RENDERED divergence between every pair.
//
// This is what replaces the vocabulary-overlap metric behind `computed-axis-divergence`. The old one
// compared the STRINGS of a fixed list of CSS properties, which cannot distinguish `12px` from
// `0.75rem` (identical rendering, scored as different) or a 1px shadow tweak from a total recolour
// (both scored as exactly one property).
//
// Usage — one page with declarative-shadow-root panels:
//   OTTO_PW_ROOT=/opt/homeserver/ottomate node run-pixel.mjs --page out.html
// or standalone panel files, each rendered at the same viewport:
//   OTTO_PW_ROOT=/opt/homeserver/ottomate node run-pixel.mjs a.html b.html c.html
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { comparePNG } from './pixel-compare.mjs';

const pwRoot = process.env.OTTO_PW_ROOT;
const { chromium } = pwRoot
  ? await import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.mjs')).href)
    .catch(() => import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.js')).href))
  : await import('playwright');

const args = process.argv.slice(2);
const pageMode = args[0] === '--page';
const files = pageMode ? args.slice(1) : args;
if (!files.length) { console.error('usage: run-pixel.mjs [--page] <html...>'); process.exit(2); }

const WIDTH = Number(process.env.OTTO_PIXEL_WIDTH || 760);
const HEIGHT = Number(process.env.OTTO_PIXEL_HEIGHT || 520);

const browser = await chromium.launch();
const shots = [];
try {
  if (pageMode) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(files[0]), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const panels = await page.locator('.vs-panel').all();
    for (let i = 0; i < panels.length; i++) {
      const label = (await panels[i].getAttribute('aria-label')) || `panel-${i}`;
      shots.push({ label, png: await panels[i].screenshot({ type: 'png' }) });
    }
    await page.close();
  } else {
    for (const f of files) {
      // Same viewport for every panel, so a size difference means a real layout difference.
      const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
      await page.setContent(readFileSync(f, 'utf8'), { waitUntil: 'load' });
      await page.waitForTimeout(250);
      shots.push({ label: path.basename(f, '.html'), png: await page.screenshot({ type: 'png' }) });
      await page.close();
    }
  }
} finally {
  await browser.close();
}

const pairs = [];
for (let i = 0; i < shots.length; i++) {
  for (let j = i + 1; j < shots.length; j++) {
    const r = comparePNG(shots[i].png, shots[j].png);
    pairs.push({
      pair: [shots[i].label, shots[j].label],
      fraction: +r.fraction.toFixed(4),
      meanDelta: +r.meanDelta.toFixed(4),
      maxDelta: +r.maxDelta.toFixed(4),
      sizeMismatch: r.sizeMismatch,
    });
  }
}
console.log(JSON.stringify({ panels: shots.map((s) => s.label), pairs }, null, 2));
