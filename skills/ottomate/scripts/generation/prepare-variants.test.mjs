// Tests for prepare-variants.mjs (R1.2). run: node --test prepare-variants.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareVariants } from './prepare-variants.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOCKS = path.resolve(HERE, '../theming/blocks');
const FIX = path.resolve(HERE, '../theming/_fixtures');
const tmp = () => mkdtempSync(path.join(os.tmpdir(), 'ottomate-r12-'));

const html = path.join(BLOCKS, 'spending-variant.html');
const cleanCss = path.join(BLOCKS, 'spending-variant.block.css');
const dirtyCss = path.join(FIX, 'category-breakdown.DIRTY.css');

test('prepareVariants inlines each variant into a SELF-CONTAINED file (no external <link>) + variant_files', () => {
  const out = tmp();
  const r = prepareVariants([
    { label: 'A · flat', html, blockCss: cleanCss },
    { label: 'B · raised', html, blockCss: cleanCss },
    { label: 'C · floating', html, blockCss: cleanCss },
  ], out);
  assert.equal(r.ok, true);
  assert.equal(r.variant_files.length, 3);
  const first = r.variant_files[0].path;
  assert.ok(existsSync(first));
  const contents = readFileSync(first, 'utf8');
  assert.ok(!/rel=["']stylesheet["']/.test(contents), 'self-contained: no external stylesheet link remains');
  assert.match(contents, /--color-surface/, 'the theme vars are inlined');
});

// MUST-FAIL: a variant whose block css bakes raw values is refused (fail-closed).
test('a variant with a raw-value block css is BLOCKED (fail-closed)', () => {
  const out = tmp();
  const r = prepareVariants([
    { label: 'A', html, blockCss: cleanCss },
    { label: 'B', html, blockCss: dirtyCss },   // injected raw hex/easing/radius
  ], out);
  assert.equal(r.ok, false);
  assert.ok(r.blocking >= 1);
  assert.ok(r.lintReports.some((rep) => rep.label === 'B' && rep.blocking > 0));
});

test('fewer than 2 variants, or a missing html, is refused', () => {
  assert.throws(() => prepareVariants([{ label: 'A', html }], tmp()), /at least 2 variants/);
  assert.throws(() => prepareVariants([{ label: 'A', html: '/nope.html' }, { label: 'B', html }], tmp()), /variant html not found/);
});
