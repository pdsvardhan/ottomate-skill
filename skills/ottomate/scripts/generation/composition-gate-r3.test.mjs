// R3 (F-5 + F-9) — composition granularity + gate-by-round-type reconciliation.
// run: node --test composition-gate-r3.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { composeRounds, roundTypeForScope } from './round-composition.mjs';
import { allFindings, blockingFindings } from '../design-check/computed-runner.mjs';

// five perceptual channels, one axis each
const axes = [
  { id: 'panel-depth', channel: 'weight' },
  { id: 'row-density', channel: 'density' },
  { id: 'type-scale', channel: 'type' },
  { id: 'accent', channel: 'colour' },
  { id: 'motion', channel: 'motion' },
];

// ── R3.1 (F-5): one question per round by default ──
test('DEFAULT one-per-round: 5 channels → 5 rounds, each exactly ONE channel (F-5 fix)', () => {
  const r = composeRounds(axes);
  assert.equal(r.matrix.granularity, 'one-per-round');
  assert.equal(r.rounds.length, 5);
  assert.equal(r.matrix.widestChannels, 1, 'no round merges more than one channel');
  assert.ok(r.rounds.every((rd) => rd.channels.length === 1));
});

test('packed (owner-chosen) reproduces the old greedy behaviour — fewer, wider rounds', () => {
  const r = composeRounds(axes, { granularity: 'packed' });
  assert.equal(r.matrix.granularity, 'packed');
  assert.ok(r.rounds.length < 5, 'packing yields fewer rounds');
  assert.ok(r.matrix.widestChannels > 1, 'a packed round carries multiple channels');
});

// ── R3.2 (F-9): the divergence floor and control-diff no longer fight ──
const tooAlike = { divergence: [{ pair: ['A', 'B'], differ: false, distance: 0.11 }] };

test('a ONE-AXIS controlled round is NOT blocked by the divergence floor (control-diff governs it)', () => {
  const b = blockingFindings(tooAlike, { roundType: 'one-axis' });
  assert.equal(b.length, 0, 'low divergence is EXPECTED for a one-axis controlled round');
});

test('CONTROL — a WHOLE-DIRECTION round IS still blocked when its variants look too alike', () => {
  const b = blockingFindings(tooAlike, { roundType: 'whole-direction' });
  assert.equal(b.length, 1);
  assert.equal(b[0].rule, 'computed-axis-divergence');
  // default roundType is whole-direction (the safe default — divergence stays enforced)
  assert.equal(blockingFindings(tooAlike).length, 1);
});

test('roundTypeForScope maps a property scope to one-axis, whole/section to whole-direction', () => {
  assert.equal(roundTypeForScope('property'), 'one-axis');
  assert.equal(roundTypeForScope('whole'), 'whole-direction');
  assert.equal(roundTypeForScope('section'), 'whole-direction');
});

// ── R3.2: the divergence vector is now LAYOUT-AWARE ──
test('the divergence vector counts a layout-only difference (3-col vs rail vs bento)', () => {
  const require = createRequire(import.meta.url);
  require('../design-check/computed-checks.js'); // sets globalThis.OTTO_COMPUTED
  const { styleVector, vecDistance } = globalThis.OTTO_COMPUTED;
  const base = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', flexDirection: '', gap: '12px' };
  const rail = { ...base, gridTemplateColumns: '2fr 1fr' };
  const d = vecDistance(styleVector(base), styleVector(rail));
  assert.ok(d > 0, 'a layout-only change now registers as divergence (was invisible to the vector)');
});
