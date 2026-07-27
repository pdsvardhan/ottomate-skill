// Unit tests for the PURE maths of the computed checker (contrast, ΔE, style-vector distance).
// The DOM pass (computedChecks) is verified by RUNNING it in real Chromium — see the Phase-3b demo,
// not fakeable here. Loading the plain script sets globalThis.OTTO_COMPUTED.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('./computed-checks.js');
const { contrastRatio, deltaE, vecDistance, parseColor } = globalThis.OTTO_COMPUTED;

const rgb = (r, g, b) => ({ r, g, b, a: 1 });

test('the script attaches its API to globalThis', () => {
  assert.ok(globalThis.OTTO_COMPUTED && typeof globalThis.OTTO_COMPUTED.computedChecks === 'function');
});

test('parseColor reads rgb() and rgba()', () => {
  assert.deepEqual(parseColor('rgb(255, 0, 0)'), { r: 255, g: 0, b: 0, a: 1 });
  assert.equal(parseColor('rgba(0, 0, 0, 0)').a, 0);
  assert.equal(parseColor('red'), null);
});

test('contrastRatio matches known WCAG pairs', () => {
  assert.equal(Math.round(contrastRatio(rgb(0, 0, 0), rgb(255, 255, 255))), 21); // black/white = 21:1
  assert.equal(Math.round(contrastRatio(rgb(255, 255, 255), rgb(255, 255, 255))), 1); // same = 1:1
  // a known-failing pair: #777 on #fff ≈ 4.48 (< 4.5)
  const r = contrastRatio(rgb(0x77, 0x77, 0x77), rgb(255, 255, 255));
  assert.ok(r > 4.3 && r < 4.6, `#777/#fff ~4.48, got ${r}`);
  assert.ok(r < 4.5, 'and it fails the 4.5 body floor');
});

test('contrast is symmetric', () => {
  assert.equal(
    Math.round(contrastRatio(rgb(30, 30, 30), rgb(240, 240, 240)) * 1000),
    Math.round(contrastRatio(rgb(240, 240, 240), rgb(30, 30, 30)) * 1000),
  );
});

test('deltaE is ~0 for identical colours and large for very different ones', () => {
  assert.ok(deltaE(rgb(20, 22, 28), rgb(20, 22, 28)) < 0.001, 'identical → ~0');
  assert.ok(deltaE(rgb(0, 0, 0), rgb(255, 255, 255)) > 90, 'black vs white → large');
  assert.ok(deltaE(rgb(20, 22, 28), rgb(22, 24, 30)) < 2, 'a near-identical pair is within the ≤2 tolerance');
});

test('vecDistance is 0 for identical vectors and rises with differing properties', () => {
  const a = { borderRadius: '0px', boxShadow: 'none', color: 'rgb(0,0,0)' };
  const b = { borderRadius: '0px', boxShadow: 'none', color: 'rgb(0,0,0)' };
  const c = { borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,.3)', color: 'rgb(255,255,255)' };
  assert.equal(vecDistance(a, b), 0, 'identical → 0 (would FAIL a divergence floor → correctly flags samey panels)');
  assert.ok(vecDistance(a, c) > 0, 'different values → non-zero distance (panels diverge)');
});
