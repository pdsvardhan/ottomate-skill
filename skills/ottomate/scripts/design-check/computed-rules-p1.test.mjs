// P1 — the COMPUTED half of the panel-rule tail. One MUST-FAIL and one MUST-PASS per rule, in plain
// Node, over element records. Plus notApplicable cases, because these nine rules read fields the
// collector must populate, and a rule that quietly passes when its input is missing is worse than one
// that is honestly pending.
// run: node --test computed-rules-p1.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from './computed-rules.mjs';

const el = (o) => ({ tag: 'div', cls: 'x', text: '', w: 100, h: 40, depth: 1, parentRadius: null, styles: {}, ...o });
const fails = (r, why) => { assert.equal(r.pass, false, why || `expected a finding, got: ${r.detail}`); return r; };
const passes = (r) => { assert.equal(r.pass, true, r.detail); return r; };
const notApplicable = (r) => { assert.equal(r.notApplicable, true, `expected notApplicable, got pass=${r.pass}: ${r.detail}`); return r; };

// ── the colour maths these rules stand on ───────────────────────────────────────────────────────
// CIEDE2000 against the Sharma/Wu/Dalal reference pairs. If this is wrong, adv-token-adherence is
// wrong in a way no fixture would reveal.
test('deltaE2000 — matches published reference values, and differs from CIE76 where it matters', () => {
  assert.ok(Math.abs(R.deltaE2000([255, 255, 255], [255, 255, 255])) < 1e-9, 'identical colours are ΔE 0');
  // A pair a designer would call "the same blue"; CIE76 over-reports saturated blues.
  const a = [0, 71, 171], b = [3, 74, 175];
  const d2000 = R.deltaE2000(a, b);
  assert.ok(d2000 < 2, `near-identical blues should sit inside the ΔE2000 warn band, got ${d2000.toFixed(2)}`);
  // A genuinely different colour must land far outside it.
  assert.ok(R.deltaE2000([0, 71, 171], [200, 30, 40]) > 20, 'blue vs red is not a rounding difference');
  // symmetry
  assert.ok(Math.abs(R.deltaE2000(a, b) - R.deltaE2000(b, a)) < 1e-9, 'ΔE must be symmetric');
});

test('contrast — WCAG anchor points', () => {
  assert.ok(Math.abs(R.contrast([0, 0, 0], [255, 255, 255]) - 21) < 0.01, 'black on white is 21:1');
  assert.ok(Math.abs(R.contrast([255, 255, 255], [255, 255, 255]) - 1) < 0.01, 'white on white is 1:1');
});

// ── floor-not-colour-alone ──────────────────────────────────────────────────────────────────────
test('floor-not-colour-alone — status dots distinguished ONLY by hue are caught', () => {
  const dot = (bg) => el({ tag: 'span', cls: 'status-dot', text: '', hasIcon: false, styles: { backgroundColor: bg, fontWeight: '400', borderRadius: 99 } });
  fails(R.floorNotColourAlone([dot('rgb(34, 197, 94)'), dot('rgb(239, 68, 68)'), dot('rgb(234, 179, 8)')]),
    'green/red/amber with no label, icon, weight or shape difference is colour-alone');

  // the same cues, each carrying a text label — a second channel
  const labelled = (bg, t) => el({ tag: 'span', cls: 'status-dot', text: t, hasIcon: false, styles: { backgroundColor: bg, fontWeight: '400', borderRadius: 99 } });
  passes(R.floorNotColourAlone([labelled('rgb(34, 197, 94)', 'Online'), labelled('rgb(239, 68, 68)', 'Offline'), labelled('rgb(234, 179, 8)', 'Away')]));
});

test('floor-not-colour-alone — one coloured thing is decoration, not a state encoding', () => {
  notApplicable(R.floorNotColourAlone([el({ cls: 'accent-bar', styles: { backgroundColor: 'rgb(34, 197, 94)' } })]));
  // same hue repeated is branding, not state
  const brand = (t) => el({ tag: 'span', cls: 'chip', text: t, styles: { backgroundColor: 'rgb(34, 197, 94)', fontWeight: '400', borderRadius: 4 } });
  passes(R.floorNotColourAlone([brand('A'), brand('B')]));
});

// ── floor-focus-ring ────────────────────────────────────────────────────────────────────────────
test('floor-focus-ring — a box-shadow-only ring is caught; a 2px outline passes', () => {
  const btn = (focus) => el({ tag: 'button', cls: 'go', styles: { backgroundColor: 'rgb(255,255,255)' }, focus });
  fails(R.floorFocusRing([btn({ outlineStyle: 'none', outlineWidth: '0px', outlineColor: 'rgb(0,0,0)', boxShadow: 'rgb(59,130,246) 0px 0px 0px 3px' })]),
    'forced-colors deletes box-shadow, leaving no visible focus at all');
  passes(R.floorFocusRing([btn({ outlineStyle: 'solid', outlineWidth: '2px', outlineColor: 'rgb(17,24,39)', boxShadow: 'none' })]));
});

test('floor-focus-ring — a too-thin ring and a too-low-contrast ring are both caught', () => {
  const btn = (focus) => el({ tag: 'button', cls: 'go', styles: { backgroundColor: 'rgb(255,255,255)' }, focus });
  assert.match(fails(R.floorFocusRing([btn({ outlineStyle: 'solid', outlineWidth: '1px', outlineColor: 'rgb(17,24,39)' })])).detail, /1px/);
  assert.match(fails(R.floorFocusRing([btn({ outlineStyle: 'solid', outlineWidth: '3px', outlineColor: 'rgb(235,235,235)' })])).detail, /against/);
});

test('floor-focus-ring — no focus records means NOT CHECKED, never a silent pass', () => {
  const r = notApplicable(R.floorFocusRing([el({ tag: 'button' })]));
  assert.match(r.detail, /NOT checked/i, 'the detail must say it was not checked, not that it passed');
});

// ── adv-state-delta-relative ────────────────────────────────────────────────────────────────────
test('adv-state-delta-relative — a hover that is a different hex is caught; a lightness move passes', () => {
  const base = 'rgb(37, 99, 235)';
  fails(R.advStateDeltaRelative([el({ tag: 'button', cls: 'cta', dark: false, styles: { backgroundColor: base }, hover: { backgroundColor: 'rgb(220, 38, 38)' } })]),
    'a hue jump is a second hardcoded colour, not a state delta');
  fails(R.advStateDeltaRelative([el({ tag: 'button', cls: 'cta', dark: false, styles: { backgroundColor: base }, hover: { backgroundColor: base } })]),
    'no lightness change at all is not a state');
  // ΔL 0.05 darker, same hue — a hover
  passes(R.advStateDeltaRelative([el({ tag: 'button', cls: 'cta', dark: false, styles: { backgroundColor: base }, hover: { backgroundColor: 'rgb(33, 88, 210)' } })]));
});

// The rule caught this before a human did: rgb(29,78,187) is ΔL 0.095 off the same base — a PRESS
// delta, not a hover one. The first draft of the test above used it as the hover must-pass and the
// rule correctly refused it. Keeping both bands under test so that discrimination cannot regress.
test('adv-state-delta-relative — hover and press bands are distinguished, not merged', () => {
  const base = 'rgb(37, 99, 235)';
  const btn = (o) => el({ tag: 'button', cls: 'cta', dark: false, styles: { backgroundColor: base }, ...o });
  passes(R.advStateDeltaRelative([btn({ hover: { backgroundColor: 'rgb(33, 88, 210)' }, active: { backgroundColor: 'rgb(29, 78, 187)' } })]));
  // the two swapped: a press-sized jump on hover, a hover-sized nudge on press
  fails(R.advStateDeltaRelative([btn({ hover: { backgroundColor: 'rgb(29, 78, 187)' } })]),
    'ΔL 0.095 is a press move; offering it as hover must be reported');
});

test('adv-state-delta-relative — direction is mode-aware: a dark surface must LIGHTEN', () => {
  const dark = 'rgb(30, 41, 59)';
  fails(R.advStateDeltaRelative([el({ tag: 'button', cls: 'cta', dark: true, styles: { backgroundColor: dark }, hover: { backgroundColor: 'rgb(19, 26, 37)' } })]),
    'darkening an already-dark surface moves the wrong way');
  notApplicable(R.advStateDeltaRelative([el({ tag: 'button', cls: 'cta', styles: { backgroundColor: dark } })]));
});

// ── adv-derivation-contrast-guarantee ───────────────────────────────────────────────────────────
test('adv-derivation-contrast-guarantee — a raw extracted accent painted under text is caught', () => {
  // #3395A9 is a REAL accent theme-extract.mjs returns from Radarr poster art.
  fails(R.advDerivationContrastGuarantee([el({ tag: 'span', cls: 'badge', text: 'Owned', styles: { backgroundColor: 'rgb(51, 149, 169)', color: 'rgb(255,255,255)', fontSize: 13 } })]),
    'white on the raw teal pick is ~2.6:1 — the pick was never normalised');
  passes(R.advDerivationContrastGuarantee([el({ tag: 'span', cls: 'badge', text: 'Owned', styles: { backgroundColor: 'rgb(19, 78, 90)', color: 'rgb(255,255,255)', fontSize: 13 } })]));
});

test('adv-derivation-contrast-guarantee — large text gets the 3:1 bar, not 4.5:1', () => {
  passes(R.advDerivationContrastGuarantee([el({ tag: 'h2', cls: 'hero', text: 'Arrival', styles: { backgroundColor: 'rgb(51, 149, 169)', color: 'rgb(17,24,39)', fontSize: 32 } })]));
  notApplicable(R.advDerivationContrastGuarantee([el({ text: 'plain', styles: { backgroundColor: 'rgb(250,250,250)', color: 'rgb(0,0,0)' } })]));
});

// ── adv-density-scale ───────────────────────────────────────────────────────────────────────────
const rows = (n, h, cls = 'row') => Array.from({ length: n }, () => el({ tag: 'tr', cls, h }));

test('adv-density-scale — 20 rows off the 4px step are caught; a 40px standard band passes', () => {
  assert.match(fails(R.advDensityScale(rows(20, 37))).detail, /density step/);
  passes(R.advDensityScale(rows(20, 40)));
});

test('adv-density-scale — rows under 32px demand a target-size review, and <15 rows is not a grid', () => {
  assert.match(fails(R.advDensityScale(rows(20, 24))).detail, /target-size review/);
  notApplicable(R.advDensityScale(rows(8, 40)));
});

// ── adv-whitespace-first ────────────────────────────────────────────────────────────────────────
test('adv-whitespace-first — an inverted heading gap is caught; 1.5-2x passes', () => {
  const h = (mt, mb) => el({ tag: 'h2', cls: 'sec', styles: { marginTop: mt, marginBottom: mb } });
  assert.match(fails(R.advWhitespaceFirst([h(8, 16)])).detail, /precedes/);
  fails(R.advWhitespaceFirst([h(18, 16)]), 'a ratio of 1.13 does not read as grouping');
  passes(R.advWhitespaceFirst([h(32, 16)]));
  notApplicable(R.advWhitespaceFirst([el({ tag: 'h2', styles: { marginTop: 0, marginBottom: 0 } })]));
});

// ── adv-body-type ───────────────────────────────────────────────────────────────────────────────
test('adv-body-type — 12px body with 1.2 leading is caught; 16px/1.5 passes', () => {
  const prose = 'Downloads finished and two files were added to your library just now.';
  fails(R.advBodyType([el({ tag: 'p', cls: 'copy', text: prose, styles: { fontSize: 12, lineHeight: 14.4 } })]));
  passes(R.advBodyType([el({ tag: 'p', cls: 'copy', text: prose, styles: { fontSize: 16, lineHeight: 24 } })]));
  notApplicable(R.advBodyType([el({ tag: 'span', text: 'Owned', styles: { fontSize: 12 } })]));
});

// ── adv-token-adherence ─────────────────────────────────────────────────────────────────────────
test('adv-token-adherence — a one-off hex outside the token set is caught', () => {
  const tokens = ['rgb(17, 24, 39)', 'rgb(37, 99, 235)', 'rgb(255, 255, 255)'];
  fails(R.advTokenAdherence([el({ cls: 'odd', styles: { color: 'rgb(155, 44, 200)', backgroundColor: 'rgb(255,255,255)' } })], { tokens }),
    'a purple that traces to no token is drift');
  // a value one JND off a token still traces to it
  passes(R.advTokenAdherence([el({ cls: 'fine', styles: { color: 'rgb(18, 25, 40)', backgroundColor: 'rgb(255,255,255)' } })], { tokens }));
});

test('adv-token-adherence — with no declared tokens it is NOT applicable, never a pass', () => {
  notApplicable(R.advTokenAdherence([el({ styles: { color: 'rgb(1,2,3)' } })], { tokens: [] }));
});

// ── adv-dark-mode-type-optical ──────────────────────────────────────────────────────────────────
test('adv-dark-mode-type-optical — identical weight and tracking in both modes is caught', () => {
  const pair = (lw, dw, lt, dt) => ([
    el({ tag: 'p', cls: 'copy', text: 'Arrival', dark: false, styles: { fontSize: 16, fontWeight: String(lw), letterSpacing: lt } }),
    el({ tag: 'p', cls: 'copy', text: 'Arrival', dark: true, styles: { fontSize: 16, fontWeight: String(dw), letterSpacing: dt } }),
  ]);
  assert.match(fails(R.advDarkModeTypeOptical(pair(600, 600, 0, 0))).detail, /identical/);
  // 600 -> 525 is a 12.5% drop, tracking +0.015em at 16px = 0.24px
  passes(R.advDarkModeTypeOptical(pair(600, 525, 0, 0.24)));
});

test('adv-dark-mode-type-optical — one colour scheme alone cannot be judged', () => {
  notApplicable(R.advDarkModeTypeOptical([el({ tag: 'p', cls: 'copy', text: 'x', dark: false, styles: { fontSize: 16, fontWeight: '400' } })]));
});

// ── registration ────────────────────────────────────────────────────────────────────────────────
test('all nine P1 computed rules are registered in COMPUTED_RULES and survive runComputedRules', () => {
  const ids = ['floor-not-colour-alone', 'floor-focus-ring', 'adv-state-delta-relative',
    'adv-derivation-contrast-guarantee', 'adv-density-scale', 'adv-whitespace-first',
    'adv-body-type', 'adv-token-adherence', 'adv-dark-mode-type-optical'];
  for (const id of ids) assert.equal(typeof R.COMPUTED_RULES[id], 'function', `${id} is not registered`);
  const out = R.runComputedRules([el({ tag: 'button', text: 'Go' })]);
  for (const id of ids) {
    assert.ok(out[id], `${id} produced no verdict`);
    assert.doesNotMatch(String(out[id].detail), /rule threw/, `${id} threw on a minimal record: ${out[id].detail}`);
  }
});
