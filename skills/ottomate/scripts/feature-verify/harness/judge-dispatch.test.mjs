import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDeterministicFacts, assembleJudgeInput, needsResample, processJudgeOutput, detectJudgeDrift } from './judge-dispatch.mjs';

test('extractDeterministicFacts pulls L1/L4 signals from matrix results by case-name convention', () => {
  const facts = extractDeterministicFacts([
    { case: 'c1: no-horizontal-overflow', outcome: 'pass' },
    { case: 'c1: no-hard-clip', outcome: 'pass' },
    { case: 'c1: axe-contrast', outcome: 'fail' },
    { case: 'c1: implicit population', outcome: 'pass' },
  ]);
  assert.deepEqual(facts.overflow, { ok: true });
  assert.deepEqual(facts.hardClip, { ok: true });
  assert.deepEqual(facts.contrast, { ok: false });
  assert.equal(facts.consoleErrors, 0);
});

test('assembleJudgeInput returns {gate:none} below T2 (the judge is skipped)', async () => {
  const r = await assembleJudgeInput({ evidenceRoot: '/no/dir', results: [], tier: 'T1' });
  assert.deepEqual(r, { gate: 'none' });
});

test('assembleJudgeInput gates glance at T2 / full at T3 and carries facts', async () => {
  const r = await assembleJudgeInput({ evidenceRoot: '/no/dir', results: [{ case: 'x: axe-contrast', outcome: 'fail' }], tier: 'T2' });
  assert.equal(r.gate, 'glance');
  assert.deepEqual(r.deterministicFacts.contrast, { ok: false });
  assert.ok(Array.isArray(r.screenshots)); // empty (dir missing) but present
});

test('sample-on-flag: only re-samples on a T3 flag with < 3 passes', () => {
  assert.equal(needsResample({ band: 'flag' }, 'T3', 1), true);
  assert.equal(needsResample({ band: 'flag' }, 'T3', 3), false); // already have 3
  assert.equal(needsResample({ band: 'warn' }, 'T3', 1), false); // a clean/warn first pass is trusted
  assert.equal(needsResample({ band: 'flag' }, 'T2', 1), false); // T2 glance never re-samples
});

test('processJudgeOutput single pass: hallucinated overlap discarded, verdict advisory', () => {
  const pass1 = [
    { dimension: 'intentional', verdict: 'clean', region: '.x' },
    { dimension: 'nothing-broken', verdict: 'flag', spatial: true, claim_type: 'overlap', region: '.a,.b' },
  ];
  const facts = { overflow: { ok: true }, regionOverlap: { overlaps: [] } };
  const { judge_verdict, needsResample: rs } = processJudgeOutput([pass1], facts, { tier: 'T3' });
  assert.equal(judge_verdict.gating, false);
  assert.equal(judge_verdict.band, 'clean');              // the only flag was a discarded hallucination
  assert.equal(judge_verdict.discarded.length, 1);
  assert.equal(rs, false);                                // first-pass band is clean → no resample
});

test('processJudgeOutput: a REAL corroborated flag survives → band flag → would resample at T3', () => {
  const pass1 = [{ dimension: 'nothing-broken', verdict: 'flag', spatial: true, claim_type: 'clipping', region: '.card' }];
  const facts = { hardClip: { ok: false } }; // L4 confirms the clip
  const { judge_verdict, needsResample: rs } = processJudgeOutput([pass1], facts, { tier: 'T3' });
  assert.equal(judge_verdict.band, 'flag');
  assert.equal(judge_verdict.findings[0].corroborated, true);
  assert.equal(rs, true);
});

test('processJudgeOutput reconciles 3 passes: agreed kept, disagreed → no-confidence', () => {
  const f = { dimension: 'nothing-broken', verdict: 'flag', spatial: true, claim_type: 'clipping', region: '.card' };
  const facts = { hardClip: { ok: false } };
  const { judge_verdict } = processJudgeOutput([[f], [f], [{ ...f, region: '.other' }]], facts, { tier: 'T3' });
  assert.equal(judge_verdict.passes, 3);
  assert.equal(judge_verdict.needs_human, true); // the '.other' finding is only in one pass → no-confidence → flag
});

test('CALM detectJudgeDrift: a golden that re-judges clean = no drift; anything else = drift', () => {
  assert.equal(detectJudgeDrift({ band: 'clean' }).drift, false);
  assert.equal(detectJudgeDrift({ band: 'warn' }).drift, true);
  assert.match(detectJudgeDrift({ band: 'flag' }).note, /drift/);
});
