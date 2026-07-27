// capture-fixture.mjs — produce the ONE PNG in the pixel suite that our own encoder did not write.
//
// An encoder and a decoder written in the same sitting can share a misunderstanding and round-trip
// each other perfectly. This captures a known two-swatch render in real Chromium so the decoder is
// checked against libpng's choice of filters and chunking, with pixel values asserted by number.
//
// Run where Chromium lives (VAULT7A):
//   OTTO_PW_ROOT=/opt/homeserver/ottomate node capture-fixture.mjs ./fixtures/chromium-swatch.png
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const pwRoot = process.env.OTTO_PW_ROOT;
const { chromium } = pwRoot
  ? await import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.mjs')).href)
    .catch(() => import(pathToFileURL(path.join(pwRoot, 'node_modules', 'playwright', 'index.js')).href))
  : await import('playwright');

const out = process.argv[2] || './fixtures/chromium-swatch.png';
// #3395A9 is a real accent theme-extract.mjs derives from Radarr poster art; #101418 is the surface.
const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .row{display:flex;width:120px;height:60px}
  .a{width:60px;height:60px;background:#3395A9}
  .b{width:60px;height:60px;background:#101418}
</style><div class="row"><div class="a"></div><div class="b"></div></div>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 120, height: 60 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  const buf = await page.locator('.row').screenshot({ type: 'png' });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
} finally {
  await browser.close();
}
