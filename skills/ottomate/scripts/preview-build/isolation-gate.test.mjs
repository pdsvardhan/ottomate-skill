// Gate tests — each case is a failure mode G1 §6 names, plus the passing case.
//   node isolation-gate.test.mjs
import { runGate } from './isolation-gate.mjs';

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = got === want;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : `  (expected ${want}, got ${got})`}`);
  ok ? pass++ : fail++;
}
function checkOf(r, n) { return r.checks.find((c) => c.name === n); }

// Worked example A from G1 §4.10: density, 3 well-spaced levels, everything else frozen.
const good = {
  axis: { name: 'density', parameter: 'card padding + meta lines + card min-width', rung: 2,
          params: ['pad', 'metaLines', 'cardMin', 'lineHeight'] },
  control: { radius: 10, accentSource: 'content', titleSize: 14, gap: 14 },
  variants: [
    { label: 'spacious', axis_values: { pad: 24, metaLines: 3, cardMin: 190, lineHeight: 1.6 } },
    { label: 'medium',   axis_values: { pad: 15, metaLines: 2, cardMin: 155, lineHeight: 1.45 } },
    { label: 'compact',  axis_values: { pad: 8,  metaLines: 1, cardMin: 120, lineHeight: 1.3 } },
  ],
};
const r1 = runGate(good);
t('good set passes the gate', r1.pass, true);
t('  count ok', checkOf(r1, 'count').pass, true);
t('  control-diff ok', checkOf(r1, 'control-diff').pass, true);
t('  axis-diff ok', checkOf(r1, 'axis-diff').pass, true);
t('  blind-sort ok', checkOf(r1, 'blind-sort').pass, true);

// THE observed bug: three "different" variants that share the axis value and differ on colour instead.
const samey = {
  axis: { name: 'density', parameter: 'card padding', rung: 2, params: ['pad'] },
  control: { radius: 10 },
  variants: [
    { label: 'one',   axis_values: { pad: 16 } },
    { label: 'two',   axis_values: { pad: 16 } },
    { label: 'three', axis_values: { pad: 16 } },
  ],
};
const r2 = runGate(samey);
t('"felt identical" set is REJECTED', r2.pass, false);
t('  axis-diff catches it', checkOf(r2, 'axis-diff').pass, false);

// Sub-threshold: the axis moved, but by less than a perceptible step.
const subThreshold = {
  axis: { name: 'density', parameter: 'card padding', rung: 2, params: ['pad'], minRelStep: 0.15 },
  control: {},
  variants: [
    { label: 'a', axis_values: { pad: 16 } },
    { label: 'b', axis_values: { pad: 17 } },
    { label: 'c', axis_values: { pad: 18 } },
  ],
};
t('sub-threshold difference is REJECTED', runGate(subThreshold).pass, false);

// Contamination: a second axis moves alongside the named one.
const contaminated = {
  axis: { name: 'density', parameter: 'card padding', rung: 2, params: ['pad'] },
  control: { accent: '#3B5BDB' },
  variants: [
    { label: 'a', axis_values: { pad: 24, accent: '#3B5BDB' } },
    { label: 'b', axis_values: { pad: 16, accent: '#2F9E44' } },
    { label: 'c', axis_values: { pad: 8,  accent: '#7048E8' } },
  ],
};
const r4 = runGate(contaminated);
t('contaminated set is REJECTED', r4.pass, false);
t('  control-diff catches the second axis', checkOf(r4, 'control-diff').pass, false);

// Count rules.
const one = { ...good, variants: [good.variants[0]] };
t('a single option is REJECTED', runGate(one).pass, false);
const six = {
  axis: { ...good.axis, rung: 0, params: ['pad'] },
  control: {},
  variants: [10, 20, 30, 40, 50, 60].map((p, i) => ({ label: `v${i}`, axis_values: { pad: p } })),
};
t('6 options is REJECTED even at rung 0', runGate(six).pass, false);
const pageRung = { ...good, axis: { ...good.axis, rung: 4 } };
t('3 options at rung 4 (page) is REJECTED — count falls as fidelity rises', runGate(pageRung).pass, false);

// Labels.
const evaluative = {
  ...good,
  variants: good.variants.map((v, i) => ({ ...v, label: ['the clean one', 'medium', 'the modern one'][i] })),
};
const r5 = runGate(evaluative);
t('evaluative labels are REJECTED', r5.pass, false);
t('  labels check catches it', checkOf(r5, 'labels').pass, false);

const recommended = { ...good, variants: good.variants.map((v, i) => (i === 1 ? { ...v, recommended: true } : v)) };
t('a pre-highlighted "recommended" option is REJECTED', runGate(recommended).pass, false);

// Structural axis with no real markup divergence.
const structural = {
  axis: { name: 'layout', parameter: 'grid vs list', rung: 1, kind: 'structural', params: ['mode'] },
  control: {},
  variants: [
    { label: 'grid', axis_values: { mode: 'grid' } },
    { label: 'list', axis_values: { mode: 'list' } },
    { label: 'rail', axis_values: { mode: 'rail' } },
  ],
};
const nearlySame = '<div class="x"><span>a</span><span>b</span><span>c</span></div>';
const r6 = runGate(structural, { grid: nearlySame, list: nearlySame + '<i>d</i>', rail: nearlySame + '<i>e</i>' });
t('structural axis with near-identical markup is REJECTED', r6.pass, false);
t('  structural check catches it', checkOf(r6, 'structural').pass, false);

const r7 = runGate(structural, {
  grid: '<div class="grid"><article class="card"><img><h3>t</h3></article></div>',
  list: '<ul class="rows"><li class="row"><span class="rank">1</span><p class="title">t</p><time>y</time></li></ul>',
  rail: '<section class="rail"><button class="prev"></button><div class="track"><figure class="tile"></figure></div></section>',
});
t('structural axis with genuinely different markup PASSES', r7.pass, true);

// Undeclared axis parameter.
const undeclared = {
  axis: { name: 'density', parameter: 'padding', rung: 2, params: [] },
  control: {},
  variants: [{ label: 'a', axis_values: { pad: 8 } }, { label: 'b', axis_values: { pad: 24 } }],
};
t('an unnamed axis is REJECTED (you cannot isolate what you have not named)', runGate(undeclared).pass, false);

// ── axis-realised: the declaration must be present in the artifact ─────────────────────────────
// Reproduces the hole found 2026-07-27 — three BYTE-IDENTICAL panels declaring three different
// values passed every other check and would have been published as three options.
const realisedSet = (a, b, c) => ({
  axis: { name: 'radius', parameter: 'corner radius', rung: 2, kind: 'stylistic', params: ['radius'] },
  control: { content: 'same' },
  variants: [
    { label: 'tight',  axis_values: { radius: '4px' } },
    { label: 'medium', axis_values: { radius: '12px' } },
    { label: 'loose',  axis_values: { radius: '20px' } },
  ],
  _rendered: { tight: a, medium: b, loose: c },
});

const identical = '<style>.c{border-radius:4px}</style><div class="c">x</div>';
const fake = realisedSet(identical, identical, identical);
const rF = runGate(fake, fake._rendered);
t('THREE IDENTICAL PANELS with different declared values are REJECTED', rF.pass, false);
t('  ...and it is distinct-source that catches it', checkOf(rF, 'distinct-source').pass, false);
t('  ...while axis-diff still (correctly) passes — it only reads the declaration', checkOf(rF, 'axis-diff').pass, true);

const honest = realisedSet(
  '<style>.c{border-radius:4px}</style><div class="c">x</div>',
  '<style>.c{border-radius:12px}</style><div class="c">x</div>',
  '<style>.c{border-radius:20px}</style><div class="c">x</div>',
);
const rH = runGate(honest, honest._rendered);
t('panels that really implement their declared values PASS', rH.pass, true);
t('  ...and value-present finds every declared literal', /every declared literal/.test(checkOf(rH, 'value-present').detail), true);

// Whitespace alone is not a difference.
const wsOnly = realisedSet(identical, `  ${identical}  `, '<b>different</b>');
t('panels differing ONLY by whitespace are still identical', runGate(wsOnly, wsOnly._rendered).pass, false);

// The advisory half never blocks, and never fires on a symbolic value.
const symbolic = {
  axis: { name: 'elevation', parameter: 'elevation treatment', rung: 2, kind: 'stylistic', params: ['elevation'] },
  control: { content: 'same' },
  variants: [
    { label: 'flat',   axis_values: { elevation: 'flat-hairline' } },
    { label: 'raised', axis_values: { elevation: 'surface-lightness' } },
    { label: 'cast',   axis_values: { elevation: 'dual-layer-shadow' } },
  ],
};
const rS = runGate(symbolic, { flat: '<div class="a">x</div>', raised: '<div class="b">y</div>', cast: '<div class="c">z</div>' });
t('a SYMBOLIC value is never reported as missing from source', rS.pass, true);
t('  ...value-present says nothing about it', /every declared literal/.test(checkOf(rS, 'value-present').detail), true);

// A declared literal authored in another legal unit ADVISES, never blocks.
const otherUnit = realisedSet(
  '<style>.c{border-radius:0.25rem}</style><div class="c">x</div>',
  '<style>.c{border-radius:12px}</style><div class="c">y</div>',
  '<style>.c{border-radius:20px}</style><div class="c">z</div>',
);
const rU = runGate(otherUnit, otherUnit._rendered);
t('a legal unit swap ADVISES but does not block', rU.pass, true);
t('  ...and it is named in the advisory', /tight\.radius="4px"/.test(checkOf(rU, 'value-present').detail), true);

// Token mode (no rendered markup) must be unaffected.
t('token mode (no markup) skips the realised checks entirely',
  runGate(fake).checks.some((c) => c.name === 'distinct-source'), false);


// ── control-held (T1): the twin of axis-realised, on the control side ──────────────────────────
// `control-diff` only ever checked that a key was not declared as BOTH control and axis. Nothing
// verified the panels actually HELD the controls constant, so "everything else is frozen" was an
// unverified claim — the same class of hole as the declaration-vs-artifact one.
const heldSet = (a, b, c) => ({
  axis: { name: 'radius', parameter: 'corner radius', rung: 2, kind: 'stylistic', params: ['radius'] },
  control: { canvas: '#101216', gutter: '18px', typeface: 'system-ui stack (prose - not checkable)' },
  variants: [
    { label: 'tight', axis_values: { radius: '4px' } },
    { label: 'mid',   axis_values: { radius: '12px' } },
    { label: 'loose', axis_values: { radius: '20px' } },
  ],
  _rendered: { tight: a, mid: b, loose: c },
});
const heldOk = heldSet(
  '<style>.c{background:#101216;gap:18px;border-radius:4px}</style><div class="c">a</div>',
  '<style>.c{background:#101216;gap:18px;border-radius:12px}</style><div class="c">b</div>',
  '<style>.c{background:#101216;gap:18px;border-radius:20px}</style><div class="c">c</div>',
);
const rOk = runGate(heldOk, heldOk._rendered);
t('a set that really holds its controls PASSES control-held', checkOf(rOk, 'control-held').pass, true);
t('  ...and a prose control is reported unchecked, never counted as verified',
  /not source-checkable: typeface/.test(checkOf(rOk, 'control-held').detail), true);

const heldBad = heldSet(
  '<style>.c{background:#101216;gap:18px;border-radius:4px}</style><div class="c">a</div>',
  '<style>.c{background:#000000;gap:18px;border-radius:12px}</style><div class="c">b</div>',
  '<style>.c{background:#101216;gap:18px;border-radius:20px}</style><div class="c">c</div>',
);
const rBad = runGate(heldBad, heldBad._rendered);
t('MUST FAIL - a control that is NOT held constant is caught', rBad.pass, false);
t('  ...and control-held names the panel that dropped it',
  /control "canvas".*MISSING from mid/.test(checkOf(rBad, 'control-held').detail), true);

const unusedC = heldSet('<div>a</div>', '<div>b</div>', '<div>c</div>');
t('a control no panel references at all is not reported as broken',
  checkOf(runGate(unusedC, unusedC._rendered), 'control-held').pass, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
