// C6 batch 3 — one MUST-FAIL and one MUST-PASS per computed rule, in plain Node.
// These were previously only exercisable inside Chromium, which meant their edge cases got argued
// about instead of tested. Records in, verdict out.
// run: node --test computed-rules.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from './computed-rules.mjs';

const el = (o) => ({ tag: 'div', cls: 'x', text: '', w: 100, h: 40, depth: 1, parentRadius: null, styles: {}, ...o });
const fails = (r, why) => { assert.equal(r.pass, false, why || r.detail); return r; };
const passes = (r) => { assert.equal(r.pass, true, r.detail); return r; };

test('floor-target-size — a control under 24px is caught; a comfortable one is not', () => {
  fails(R.floorTargetSize([el({ tag: 'button', w: 20, h: 20 })]));
  passes(R.floorTargetSize([el({ tag: 'button', w: 44, h: 44 })]));
  assert.ok(R.floorTargetSize([el({ tag: 'div' })]).notApplicable, 'no controls means nothing to judge');
});

test('adv-type-family-count — three families is an accident, two is a system', () => {
  const f = (n) => n.map((x) => el({ styles: { fontFamily: x } }));
  fails(R.advTypeFamilyCount(f(['Sora', 'Georgia', 'JetBrains Mono'])));
  passes(R.advTypeFamilyCount(f(['Sora', 'JetBrains Mono', 'Sora'])));
});

test('adv-leading-by-role — one global line-height across the size range is caught', () => {
  const flat = [
    el({ text: 'a', styles: { fontSize: 12, lineHeight: 18 } }),
    el({ text: 'b', styles: { fontSize: 14, lineHeight: 21 } }),
    el({ text: 'c', styles: { fontSize: 32, lineHeight: 48 } }),
  ];
  fails(R.advLeadingByRole(flat), 'ratio 1.5 everywhere means leading was never considered');
  const tuned = [
    el({ text: 'a', styles: { fontSize: 12, lineHeight: 19 } }),
    el({ text: 'b', styles: { fontSize: 14, lineHeight: 22 } }),
    el({ text: 'c', styles: { fontSize: 32, lineHeight: 36 } }),
  ];
  passes(R.advLeadingByRole(tuned));
});

test('adv-line-length — a 140ch measure is caught, 65ch passes', () => {
  const long = 'x'.repeat(200);
  fails(R.advLineLength([el({ text: long, w: 1400, styles: { fontSize: 16 } })]));
  passes(R.advLineLength([el({ text: long, w: 520, styles: { fontSize: 16 } })]));
});

test('adv-tabular-numerals — numbers that will jitter as they change are caught', () => {
  const nums = (v) => [el({ text: '12.4 GB', styles: { fontVariantNumeric: v } }), el({ text: '46.2 GB', styles: { fontVariantNumeric: v } })];
  fails(R.advTabularNumerals(nums('normal')));
  passes(R.advTabularNumerals(nums('tabular-nums')));
});

test('adv-radius-nesting — a child rounder than its container is caught', () => {
  fails(R.advRadiusNesting([el({ parentRadius: 4, styles: { borderRadius: 12 } })]));
  passes(R.advRadiusNesting([el({ parentRadius: 12, styles: { borderRadius: 8 } })]));
});

test('adv-shadow-one-light-source — two directions is two light sources', () => {
  fails(R.advShadowOneLightSource([
    el({ styles: { boxShadow: 'rgba(0,0,0,0.4) 0px 8px 16px' } }),
    el({ styles: { boxShadow: 'rgba(0,0,0,0.4) 0px -8px 16px' } }),
  ]));
  passes(R.advShadowOneLightSource([
    el({ styles: { boxShadow: 'rgba(0,0,0,0.4) 0px 8px 16px' } }),
    el({ styles: { boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px' } }),
  ]));
});

test('adv-shadow-tinted-layered — a single flat pure-black shadow is the default nobody chose', () => {
  fails(R.advShadowTintedLayered([el({ styles: { boxShadow: 'rgba(0, 0, 0, 0.5) 0px 4px 8px' } })]));
  passes(R.advShadowTintedLayered([el({ styles: { boxShadow: 'rgba(5, 7, 11, 0.65) 0px 2px 4px, rgba(5, 7, 11, 0.9) 0px 16px 34px' } })]));
});

test('adv-dark-surface-floor — pure black leaves no darker step for elevation', () => {
  fails(R.advDarkSurfaceFloor([el({ styles: { backgroundColor: 'rgb(0, 0, 0)' } })]));
  passes(R.advDarkSurfaceFloor([el({ styles: { backgroundColor: 'rgb(16, 18, 22)' } })]));
});

test('adv-neutral-tint — perfectly untinted greys beside a warm accent read as dirty', () => {
  fails(R.advNeutralTint([el({ styles: { backgroundColor: 'rgb(30, 30, 30)' } }), el({ styles: { backgroundColor: 'rgb(60, 60, 60)' } })]));
  passes(R.advNeutralTint([el({ styles: { backgroundColor: 'rgb(16, 18, 22)' } }), el({ styles: { backgroundColor: 'rgb(60, 60, 60)' } })]));
});

test('scale adherence — a scatter of sizes is caught, a ladder is not', () => {
  const sizes = (xs) => xs.map((v) => el({ styles: { fontSize: v } }));
  fails(R.advTypeScale(sizes([11, 12, 13, 14, 15, 16, 17, 18, 19])));
  passes(R.advTypeScale(sizes([12, 14, 16, 24, 12, 14])));
  const radii = (xs) => xs.map((v) => el({ styles: { borderRadius: v } }));
  fails(R.advRadiusScale(radii([2, 3, 4, 5, 6, 7])));
  passes(R.advRadiusScale(radii([4, 8, 12, 4, 8])));
});

test('adv-numeric-column-alignment — left-aligned digits never line up', () => {
  const cells = (a) => [el({ text: '12.4', styles: { textAlign: a } }), el({ text: '146.2', styles: { textAlign: a } })];
  fails(R.advNumericColumnAlignment(cells('left')));
  passes(R.advNumericColumnAlignment(cells('right')));
});

test('a rule with nothing to measure returns notApplicable, never a silent pass or a zero', () => {
  for (const [id, fn] of Object.entries(R.COMPUTED_RULES)) {
    const r = fn([]);
    assert.equal(r.pass, true, `${id} should not fail on an empty panel`);
    assert.equal(r.notApplicable, true, `${id} must mark an empty panel as not-applicable, not as a pass`);
  }
});

test('runComputedRules never throws — a broken rule reports itself instead of killing the pass', () => {
  const out = R.runComputedRules([el({ styles: null })]);
  assert.equal(Object.keys(out).length, Object.keys(R.COMPUTED_RULES).length);
});
