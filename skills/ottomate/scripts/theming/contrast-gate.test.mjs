// Tests for contrast-gate.mjs — the per-theme fail-closed contrast gate.
// Includes MUST-PASS (cointrail) and MUST-FAIL (broken fixture) cases: a gate that never fails is not
// evidence (spec §7). run: node --test contrast-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTheme } from './build-theme.mjs';
import { contrastGate, checkScheme, hexToRgb, KIND_FLOOR } from './contrast-gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cointrail = loadTheme(path.join(HERE, 'cointrail.tokens.json'));
const broken = loadTheme(path.join(HERE, '_fixtures', 'broken-theme.tokens.json'));

test('hexToRgb handles #rgb, #rrggbb, and #rrggbbaa (alpha ignored)', () => {
  assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
  assert.deepEqual(hexToRgb('#0e0e18'), [14, 14, 24]);
  assert.deepEqual(hexToRgb('#1d4ed8ff'), [29, 78, 216]);
  assert.throws(() => hexToRgb('rgb(1,2,3)'), /not an opaque hex/);
});

// MUST-PASS: the pilot theme clears every text/UI floor in BOTH schemes.
test('cointrail PASSES the gate in light and dark', () => {
  const g = contrastGate(cointrail);
  assert.equal(g.ok, true, g.why);
  assert.deepEqual(Object.keys(g.schemes).sort(), ['dark', 'light']);
  assert.equal(g.schemes.light.ok, true);
  assert.equal(g.schemes.dark.ok, true);
  assert.equal(g.failing.length, 0);
});

test('every non-advisory cointrail pairing actually clears its WCAG floor', () => {
  for (const scheme of ['light', 'dark']) {
    for (const r of checkScheme(cointrail, scheme).results) {
      if (r.advisory) continue;
      assert.ok(r.ratio >= r.min, `${r.fg}/${r.bg}@${scheme} = ${r.ratio}:1 < ${r.min}`);
    }
  }
});

// MUST-FAIL: invisible text in light must BLOCK, and the gate must name the scheme.
test('the broken theme BLOCKS — invisible on-surface in light is caught', () => {
  const g = contrastGate(broken);
  assert.equal(g.ok, false);
  assert.ok(g.failing.some((f) => f.scheme === 'light' && f.fg === 'color.on-surface'),
    'the invisible light on-surface must be the (a) failure');
  // and the dark scheme, which is fine, must NOT be blamed
  assert.equal(g.schemes.dark.ok, true);
  assert.match(g.why, /below floor/);
});

test('a pairing naming a token the theme does not define fails (never skipped silently)', () => {
  const t = JSON.parse(JSON.stringify(broken));
  t.$extensions['com.ottomate.contrast'].pairings.push({ fg: 'color.nope', bg: 'color.surface', kind: 'text' });
  const r = checkScheme(t, 'light');
  assert.ok(r.results.some((x) => x.fg === 'color.nope' && x.pass === false && /missing token/.test(x.note)));
});

test('advisory kinds (decorative/chart) never block, only warn', () => {
  // cointrail's border-on-surface is ~1.2:1 (subtle) but decorative → advisory, not a block.
  const g = contrastGate(cointrail);
  const borderAdv = g.advisories.find((a) => a.fg === 'color.border');
  assert.ok(borderAdv, 'the subtle border should surface as an advisory');
  assert.equal(g.ok, true, 'advisories must not flip the gate to BLOCK');
  assert.equal(KIND_FLOOR.text, 4.5);
});
