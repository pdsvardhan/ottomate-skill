// T5 — slot letters reshuffle; labels are the identity that survives.
// Every rule here has a must-FAIL and a must-PASS case.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLabels, shownEntry, buildShown, readShown, describeSlot, isTraceableAcrossRounds,
  SHAPE_LEGACY, SHAPE_LABELLED,
} from './variant-slots.mjs';
import { picksToLedger } from './picks-to-ledger.mjs';
import { buildRoundPayloads } from './publish-round.mjs';
import { resolveAnatomy } from './anatomy.mjs';

const A = resolveAnatomy();
const LABELS = { A: 'sharp', B: 'soft', C: 'mid' };

// ── the label is mandatory on the WRITE side ───────────────────────────────────────────────────

test('MUST FAIL — a slot with no label is rejected', () => {
  assert.throws(() => shownEntry('A', '4px', {}), /slot "A" has no label/);
});

test('MUST FAIL — a blank or whitespace label is rejected, not accepted as present', () => {
  assert.throws(() => shownEntry('A', '4px', { A: '' }), /has no label/);
  assert.throws(() => shownEntry('A', '4px', { A: '   ' }), /has no label/);
});

test('MUST FAIL — a non-string label (a number, a stray object) is rejected', () => {
  assert.throws(() => shownEntry('A', '4px', { A: 3 }), /has no label/);
  assert.throws(() => shownEntry('A', '4px', { A: { name: 'sharp' } }), /has no label/);
});

test('MUST PASS — a labelled slot yields { value, label }, value stringified', () => {
  assert.deepEqual(shownEntry('A', 4, { A: 'sharp' }), { value: '4', label: 'sharp' });
});

test('the error names the slot and tells you which key to pass — a bare "invalid" would not', () => {
  try {
    shownEntry('C', 'x', { A: 'sharp' });
    assert.fail('expected a throw');
  } catch (e) {
    assert.match(e.message, /slot "C"/);
    assert.match(e.message, /variant_labels/);
    assert.match(e.message, /slot_mapping/);
  }
});

// ── resolveLabels accepts both the hand-authored and the harness key ────────────────────────────

test('resolveLabels reads variant_labels OR the harness\'s own slot_mapping', () => {
  assert.deepEqual(resolveLabels({ variant_labels: LABELS }), LABELS);
  assert.deepEqual(resolveLabels({ slot_mapping: LABELS }), LABELS,
    'build-variant-set.mjs writes slot_mapping — accepting it removes the transcription step where a label gets lost');
  assert.deepEqual(resolveLabels({}), {});
  assert.deepEqual(resolveLabels(), {});
});

test('variant_labels wins over slot_mapping when both are present (an explicit override stays possible)', () => {
  assert.deepEqual(resolveLabels({ variant_labels: { A: 'hand' }, slot_mapping: { A: 'auto' } }), { A: 'hand' });
});

// ── buildShown skips slots that offered nothing, but never skips a missing label ────────────────

test('MUST PASS — a slot that offered no value for this axis is omitted, not written as undefined', () => {
  const shown = buildShown(['A', 'B'], (s) => (s === 'A' ? '4px' : undefined), LABELS);
  assert.deepEqual(Object.keys(shown), ['A']);
});

test('MUST FAIL — a slot that DID offer a value still needs its label', () => {
  assert.throws(() => buildShown(['A', 'B'], () => '4px', { A: 'sharp' }), /slot "B" has no label/);
});

// ── the READ side tolerates the legacy shape forever ────────────────────────────────────────────

test('readShown parses the legacy bare shape and marks it as legacy', () => {
  const out = readShown({ A: '4px', B: 12 });
  assert.deepEqual(out, [
    { slot: 'A', value: '4px', label: null, shape: SHAPE_LEGACY },
    { slot: 'B', value: '12', label: null, shape: SHAPE_LEGACY },
  ]);
});

test('readShown parses the labelled shape', () => {
  const out = readShown({ A: { value: '4px', label: 'sharp' } });
  assert.deepEqual(out, [{ slot: 'A', value: '4px', label: 'sharp', shape: SHAPE_LABELLED }]);
});

test('readShown handles a row that is HALF migrated — the real state of a live ledger mid-change', () => {
  const out = readShown({ A: { value: '4px', label: 'sharp' }, B: '12px' });
  assert.equal(out.find((e) => e.slot === 'A').shape, SHAPE_LABELLED);
  assert.equal(out.find((e) => e.slot === 'B').shape, SHAPE_LEGACY);
});

test('readShown survives null / absent / non-object input rather than throwing on a read path', () => {
  assert.deepEqual(readShown(null), []);
  assert.deepEqual(readShown(undefined), []);
  assert.deepEqual(readShown('nonsense'), []);
  assert.deepEqual(readShown({ A: null }), [], 'a null slot is dropped, not read as the string "null"');
});

test('describeSlot never lets an unlabelled legacy row masquerade as an identified one', () => {
  assert.equal(describeSlot('A', 'sharp'), 'sharp (slot A)');
  assert.match(describeSlot('A', null), /unlabelled — pre-T5 row/);
});

// ── THE ACCEPTANCE CRITERION, as code ───────────────────────────────────────────────────────────
// "A decision from round 1 and one from round 2 are distinguishable from the ledger row alone,
//  with no manifest lookup."

test('ACCEPTANCE — two rounds that reshuffle the same slot letter stay distinguishable', () => {
  // The same bundle "soft" is slot B in round 1 and slot A in round 2. That is the whole failure.
  const r1 = buildShown(['A', 'B'], (s) => (s === 'A' ? '0' : '20'), { A: 'sharp', B: 'soft' });
  const r2 = buildShown(['A', 'B'], (s) => (s === 'A' ? '20' : '0'), { A: 'soft', B: 'sharp' });

  assert.ok(isTraceableAcrossRounds(r1, r2));

  // Without labels the two rows are indistinguishable on the letter alone...
  assert.equal(r1.B.value, r2.A.value, 'the same VALUE sits under a different letter in each round');
  // ...but the label resolves it from the row itself.
  assert.equal(r1.B.label, 'soft');
  assert.equal(r2.A.label, 'soft');
});

test('MUST FAIL — a legacy row pair is reported as NOT traceable, rather than quietly passing', () => {
  assert.equal(isTraceableAcrossRounds({ A: '0' }, { A: '20' }), false);
  assert.equal(isTraceableAcrossRounds({ A: { value: '0', label: 'sharp' } }, { A: '20' }), false,
    'one legacy side is enough to make the pair untraceable — this must not round up to true');
  assert.equal(isTraceableAcrossRounds({}, {}), false, 'nothing shown is not "traceable"');
});

// ── the two real writers now go through it ──────────────────────────────────────────────────────

const ROUND = {
  projectSlug: 'zzz-demo',
  targetId: 'oid-card-1',
  archetype: 'media-card',
  round: 1,
  variantsShown: {
    A: { 'corner-radius': 0 },
    B: { 'corner-radius': 20 },
  },
  picks: { 'corner-radius': { value: 20, from: 'B' } },
  variantLabels: { A: 'sharp', B: 'soft' },
};

test('picksToLedger writes the labelled shape, and labels mixed_from + rejected[]', () => {
  const [row] = picksToLedger(ROUND, A);
  assert.deepEqual(row.variants_shown, {
    A: { value: '0', label: 'sharp' },
    B: { value: '20', label: 'soft' },
  });
  assert.deepEqual(row.mixed_from, { variant: 'B', label: 'soft' });
  assert.deepEqual(row.rejected.map((r) => [r.value, r.label]), [[0, 'sharp']],
    'a rejected value carries the label of the bundle that offered it');
  assert.match(row.rationale, /from variant soft/, 'the prose names the label, not the letter');
});

test('MUST FAIL — picksToLedger refuses a round with no labels at all', () => {
  const { variantLabels, ...noLabels } = ROUND;
  assert.throws(() => picksToLedger(noLabels, A), /has no label/);
});

test('picksToLedger accepts the harness\'s slot_mapping directly, with no hand transcription', () => {
  const { variantLabels, ...rest } = ROUND;
  const [row] = picksToLedger({ ...rest, slotMapping: { A: 'sharp', B: 'soft' } }, A);
  assert.equal(row.variants_shown.A.label, 'sharp');
});

test('MUST FAIL — buildRoundPayloads refuses to publish a round whose slots have no labels', () => {
  assert.throws(() => buildRoundPayloads({
    project_slug: 'zzz', target_id: 'oid-1', archetype: 'media-card', round: 1,
    variants_shown: { A: { 'corner-radius': 0 }, B: { 'corner-radius': 20 } },
  }, A), /has no label/);
});

test('MUST PASS — buildRoundPayloads publishes when labels are supplied', () => {
  const [row] = buildRoundPayloads({
    project_slug: 'zzz', target_id: 'oid-1', archetype: 'media-card', round: 1,
    variants_shown: { A: { 'corner-radius': 0 }, B: { 'corner-radius': 20 } },
    variant_labels: { A: 'sharp', B: 'soft' },
  }, A);
  assert.deepEqual(row.variants_shown, {
    A: { value: '0', label: 'sharp' },
    B: { value: '20', label: 'soft' },
  });
});
