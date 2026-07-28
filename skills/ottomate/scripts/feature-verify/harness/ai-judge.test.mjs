import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeGate, crossCheckSpatialClaims, reconcileSamples, judgeVerdict, applyJudgeToOutcome } from './ai-judge.mjs';

test('judgeGate: skipped below T2, glance at T2, full at T3', () => {
  assert.equal(judgeGate('T0'), 'none');
  assert.equal(judgeGate('T1'), 'none');
  assert.equal(judgeGate('T2'), 'glance');
  assert.equal(judgeGate('T3'), 'full');
});

test('must-fail: a hallucinated "overlap" the DOM contradicts is DISCARDED', () => {
  const findings = [
    { dimension: 'nothing-broken', verdict: 'flag', spatial: true, claim_type: 'overlap', region: '.legend', rationale: 'the legend looks like it covers the map' },
  ];
  // L4 re-measured the cited regions and found no overlap, and there is no horizontal overflow.
  const facts = { overflow: { ok: true }, regionOverlap: { overlaps: [] } };
  const { kept, discarded } = crossCheckSpatialClaims(findings, facts);
  assert.equal(kept.length, 0);
  assert.equal(discarded.length, 1);
  assert.match(discarded[0].reason, /contradicts/);
});

test('a spatial claim the DOM CORROBORATES is kept + marked corroborated', () => {
  const findings = [{ dimension: 'nothing-broken', verdict: 'flag', spatial: true, claim_type: 'clipping', region: '.card', rationale: 'text cut off' }];
  const { kept } = crossCheckSpatialClaims(findings, { hardClip: { ok: false } }); // L4 also sees hard-clip
  assert.equal(kept.length, 1);
  assert.equal(kept[0].corroborated, true);
});

test('a spatial claim the layer cannot measure is soft-kept as unverified; non-spatial passes through', () => {
  const findings = [
    { dimension: 'intentional', verdict: 'warn', spatial: true, claim_type: 'weird-spacing', region: '.hero' },
    { dimension: 'empty-state', verdict: 'warn', spatial: false, region: '.list', rationale: 'empty state is blank' },
  ];
  const { kept, discarded } = crossCheckSpatialClaims(findings, { overflow: { ok: true } });
  assert.equal(discarded.length, 0);
  assert.equal(kept.length, 2);
  assert.equal(kept[0].unverified, true);
  assert.equal(kept[1].unverified, undefined);
});

test('reconcileSamples: agreed across all passes vs no-confidence on disagreement; single pass labelled', () => {
  const a = [{ dimension: 'd', claim_type: 'overlap', region: '.x', verdict: 'flag' }];
  const b = [{ dimension: 'd', claim_type: 'overlap', region: '.x', verdict: 'flag' }, { dimension: 'e', region: '.y', verdict: 'warn' }];
  const merged = reconcileSamples([a, b]);
  const overlap = merged.find((f) => f.claim_type === 'overlap');
  const only = merged.find((f) => f.dimension === 'e');
  assert.equal(overlap.confidence, 'agreed');       // in both
  assert.equal(only.confidence, 'no-confidence');    // in one
  assert.equal(reconcileSamples([a])[0].confidence, 'single-pass');
});

test('must-fail: judgeVerdict can NEVER emit a gating pass', () => {
  for (const findings of [[], [{ verdict: 'warn' }], [{ verdict: 'flag' }], [{ confidence: 'no-confidence' }]]) {
    const v = judgeVerdict(findings);
    assert.equal(v.gating, false);
    assert.notEqual(v.band, 'pass');
    assert.notEqual(v.band, 'APPROVE');
  }
});

test('judgeVerdict bands: clean / warn / flag (flag on a flag OR a no-confidence)', () => {
  assert.equal(judgeVerdict([]).band, 'clean');
  assert.equal(judgeVerdict([{ verdict: 'warn' }]).band, 'warn');
  assert.equal(judgeVerdict([{ verdict: 'flag' }]).band, 'flag');
  assert.equal(judgeVerdict([{ verdict: 'warn', confidence: 'no-confidence' }]).needs_human, true);
});

test('applyJudgeToOutcome downgrades only: a red stays red, a pass may become warn, never the reverse', () => {
  assert.equal(applyJudgeToOutcome('fail', judgeVerdict([{ verdict: 'flag' }])), 'fail');
  assert.equal(applyJudgeToOutcome('pass', judgeVerdict([{ verdict: 'flag' }])), 'warn');
  assert.equal(applyJudgeToOutcome('pass', judgeVerdict([])), 'pass');
  assert.equal(applyJudgeToOutcome('pass', judgeVerdict([{ verdict: 'warn' }])), 'pass'); // warn band doesn't downgrade a pass
});
