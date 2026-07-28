// Tests for emit-round-json.mjs (R1.1). run: node --test emit-round-json.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVariantPreviews, selfStyledBanner, buildRoundJsonExtras } from './emit-round-json.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const themeFile = path.resolve(HERE, '../theming/cointrail.tokens.json');
const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'ottomate-r11-'));

const bannerInputs = { decided: [{ id: 'panel-depth', hint: 'flat vs raised' }], deferred: [{ id: 'motion' }], variantCount: 3 };

test('buildVariantPreviews copies each variant file into the round dir and records label+file', () => {
  const dir = tmp();
  const v1 = path.join(dir, 'src-a.html'); writeFileSync(v1, '<b>A</b>');
  const v2 = path.join(dir, 'src-b.html'); writeFileSync(v2, '<b>B</b>');
  const out = buildVariantPreviews([{ label: 'A', path: v1 }, { label: 'B', path: v2 }], dir);
  assert.deepEqual(out, [{ label: 'A', file: 'src-a.html' }, { label: 'B', file: 'src-b.html' }]);
  assert.ok(existsSync(path.join(dir, 'src-a.html')));
});

// MUST-FAIL: a round cannot advertise a preview file it does not have.
test('a missing variant file is REFUSED (never advertise a preview that is not there)', () => {
  const dir = tmp();
  assert.throws(() => buildVariantPreviews([{ label: 'X', path: path.join(dir, 'ghost.html') }], dir), /variant file not found/);
});

test('selfStyledBanner inlines the theme light vars (renders on the app page) + the banner html', () => {
  const html = selfStyledBanner(bannerInputs, themeFile);
  assert.match(html, /class="rb-wrap"/);
  assert.match(html, /--color-action:#1d4ed8;/);       // theme var inlined
  assert.match(html, /This round decides/);            // banner content
  assert.match(html, /needs your OK to defer/);        // deferral surfaced
});

test('selfStyledBanner falls back to the bare banner when there is no theme', () => {
  const html = selfStyledBanner(bannerInputs, null);
  assert.match(html, /round-banner/);
  assert.ok(!html.includes('rb-wrap'), 'no theme → no self-style wrapper');
});

test('buildRoundJsonExtras assembles variant_previews + banner from a manifest', () => {
  const dir = tmp();
  const v = path.join(dir, 'v.html'); writeFileSync(v, '<b>v</b>');
  const manifest = { variant_files: [{ label: 'A · flat', path: v }], banner: bannerInputs };
  const extras = buildRoundJsonExtras(manifest, dir, { themeFile });
  assert.equal(extras.variant_previews.length, 1);
  assert.equal(extras.variant_previews[0].file, 'v.html');
  assert.match(extras.banner, /rb-wrap/);
});

test('a legacy manifest (no variant_files, no banner) yields NO extras (single-iframe fallback)', () => {
  const extras = buildRoundJsonExtras({}, tmp(), {});
  assert.deepEqual(extras, {});
});
