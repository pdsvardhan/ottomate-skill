// T9 — the objective half of the rubric, and the rule that it stays separate from judgment.
// run: node --test rubric-score.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreObjective, mergeVerdict, formatRubric } from './rubric-score.mjs';

const CONTRAST_OK = [{ ratio: 7.1, need: 4.5 }, { ratio: 5.0, need: 4.5 }];
const CONTRAST_HALF = [{ ratio: 7.1, need: 4.5 }, { ratio: 3.2, need: 4.5 }];

test('contrast scores the fraction of samples that meet their own floor', () => {
  assert.equal(scoreObjective({ contrast: CONTRAST_OK, source: '' }).rows.legibility_contrast.score, 25);
  assert.equal(scoreObjective({ contrast: CONTRAST_HALF, source: '' }).rows.legibility_contrast.score, 13);
});

test('a colour literal that duplicates a declared token is drift and costs points', () => {
  const drifting = ':root{--au:#e9b84c}.a{color:#e9b84c}.b{background:#e9b84c}';
  const noDrift = ':root{--au:#e9b84c}.a{color:#123456}';   // a literal, but not one that shadows a token
  assert.equal(scoreObjective({ source: drifting }).rows.craft_token_adherence.score, 0);
  assert.equal(scoreObjective({ source: noDrift }).rows.craft_token_adherence.score, 25);
});

test('routing every colour through its token leaves NOTHING to measure — not a zero', () => {
  const clean = ':root{--au:#e9b84c}.a{color:var(--au)}.b{background:var(--au)}';
  const r = scoreObjective({ source: clean });
  assert.equal(r.rows.craft_token_adherence, undefined);
  assert.match(r.notMeasured.join(' '), /craft_token_adherence \(no colour literals\)/);
});

test('a ladder of sizes scores above a scatter', () => {
  const ladder = '.a{font-size:12px}.b{font-size:16px}.c{border-radius:4px}';
  const scatter = '.a{font-size:11px}.b{font-size:12px}.c{font-size:13px}.d{font-size:14px}.e{font-size:15px}'
    + '.f{font-size:17px}.g{border-radius:3px}.h{border-radius:5px}.i{border-radius:7px}.j{border-radius:9px}';
  assert.ok(scoreObjective({ source: ladder }).rows.craft_scale_discipline.score
    > scoreObjective({ source: scatter }).rows.craft_scale_discipline.score);
});

test('a row with nothing to measure is reported as NOT MEASURED, never scored zero', () => {
  const r = scoreObjective({ contrast: [], source: '' });
  assert.equal(r.rows.legibility_contrast, undefined);
  assert.match(r.notMeasured.join(' '), /legibility_contrast \(no text sampled\)/);
  assert.equal(r.outOf, 0, 'the denominator shrinks — an unmeasurable row does not drag the score down');
});

test('THE LOAD-BEARING RULE — a measurement and a judgment are never summed', () => {
  const v = mergeVerdict(scoreObjective({ contrast: CONTRAST_OK, source: '' }), { band: 'Ship', note: 'reads well cold' });
  assert.equal(v.combined, null, 'combining them would launder an opinion into a number');
  assert.equal(v.measured.score, 25);
  assert.equal(v.judged.band, 'Ship');
});

test('the printed form labels the judgment as not a measurement', () => {
  const v = mergeVerdict(scoreObjective({ contrast: CONTRAST_OK, source: '' }), { band: 'Rebuild', note: 'hierarchy unclear' });
  assert.match(formatRubric(v, 'Option A'), /judgment \(NOT a measurement\): Rebuild/);
});

test('with no judgment recorded, the output says the subjective rows are still the model\'s call', () => {
  assert.match(formatRubric(mergeVerdict(scoreObjective({ contrast: CONTRAST_OK }))), /still the model's call/);
});
