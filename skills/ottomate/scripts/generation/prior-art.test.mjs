// Tests for prior-art.mjs — the pre-round "is this already solved here?" pass.
// run: node --test prior-art.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priorArtByAxis, applyPriorArt, formatPriorArt, axisQuestion, axisArchetype } from './prior-art.mjs';

const SUBS = [{ id: 'corner-radius' }, { id: 'elevation' }, { id: 'hover-motion' }];

function d(o) {
  return { id: 1, target_id: 'other.card', axis: 'media-card.corner-radius', status: 'locked', chosen_value: '12px', round: 1, ...o };
}

test('axis parsing splits archetype from question', () => {
  assert.equal(axisQuestion('media-card.corner-radius'), 'corner-radius');
  assert.equal(axisArchetype('media-card.corner-radius'), 'media-card');
  assert.equal(axisQuestion('corner-radius'), 'corner-radius');
  assert.equal(axisArchetype('corner-radius'), '');
});

test('same archetype on a DIFFERENT target, locked → inherit', () => {
  const pa = priorArtByAxis([d({})], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(pa['corner-radius'].verdict, 'inherit');
  assert.equal(pa['corner-radius'].consensus, '12px');
  assert.equal(pa['corner-radius'].reuse.length, 1);
  assert.equal(pa['corner-radius'].coherence.length, 0);
});

test('the SAME target is never its own prior art', () => {
  const pa = priorArtByAxis([d({ target_id: 'this.card' })], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(pa['corner-radius'].verdict, 'open');
});

test('a DIFFERENT archetype is coherence, not reuse — never inherited (radius ladder)', () => {
  const pa = priorArtByAxis([d({ axis: 'button.corner-radius', chosen_value: '9999px' })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const r = pa['corner-radius'];
  assert.equal(r.verdict, 'review');
  assert.equal(r.consensus, null);
  assert.equal(r.reuse.length, 0);
  assert.equal(r.coherence.length, 1);
});

test('two different locked values on the same archetype → CONFLICT, not a pick', () => {
  const pa = priorArtByAxis(
    [d({ id: 1, target_id: 'a.card', chosen_value: '4px' }), d({ id: 2, target_id: 'b.card', chosen_value: '20px' })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const r = pa['corner-radius'];
  assert.equal(r.verdict, 'conflict');
  assert.deepEqual(r.conflict.sort(), ['20px', '4px']);
  assert.equal(r.consensus, null);
});

test('the same locked value on two targets is agreement, not conflict', () => {
  const pa = priorArtByAxis(
    [d({ id: 1, target_id: 'a.card' }), d({ id: 2, target_id: 'b.card' })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(pa['corner-radius'].verdict, 'inherit');
  assert.equal(pa['corner-radius'].consensus, '12px');
});

test('a PROPOSED decision elsewhere is context, never an inheritance (a proposal is not an answer)', () => {
  const pa = priorArtByAxis([d({ status: 'proposed', chosen_value: null })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(pa['corner-radius'].verdict, 'review');
  assert.equal(pa['corner-radius'].consensus, null);
});

test('rejected and superseded rows are ignored entirely', () => {
  const pa = priorArtByAxis(
    [d({ status: 'rejected' }), d({ id: 2, status: 'superseded' })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(pa['corner-radius'].verdict, 'open');
});

test('applyPriorArt moves an inherit axis out of contested and into inheritedControls', () => {
  const pa = priorArtByAxis([d({})], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const out = applyPriorArt({ contested: SUBS }, pa);
  assert.deepEqual(out.contested.map((s) => s.id), ['elevation', 'hover-motion']);
  assert.deepEqual(out.inheritedControls, { 'media-card.corner-radius': { value: '12px', from: ['other.card'] } });
});

test('deliberate divergence keeps an inheritable axis contested (ruling 3: a preset, not a straitjacket)', () => {
  const pa = priorArtByAxis([d({})], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const out = applyPriorArt({ contested: SUBS }, pa, { diverge: ['corner-radius'] });
  assert.deepEqual(out.contested.map((s) => s.id), ['corner-radius', 'elevation', 'hover-motion']);
  assert.deepEqual(out.inheritedControls, {});
});

test('a conflict stays contested AND is surfaced — the round is where it gets settled', () => {
  const pa = priorArtByAxis(
    [d({ id: 1, target_id: 'a.card', chosen_value: '4px' }), d({ id: 2, target_id: 'b.card', chosen_value: '20px' })],
    { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const out = applyPriorArt({ contested: SUBS }, pa);
  assert.equal(out.contested.length, 3);
  assert.equal(out.priorArtConflicts.length, 1);
  assert.equal(out.priorArtConflicts[0].question, 'corner-radius');
});

test('formatPriorArt says nothing about untouched axes and names the source for the rest', () => {
  const pa = priorArtByAxis([d({})], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  const s = formatPriorArt(pa);
  assert.match(s, /inherit\s+corner-radius\s+= 12px/);
  assert.match(s, /locked on other\.card/);
  assert.doesNotMatch(s, /elevation/);
});

test('an empty ledger produces the honest empty line, not a crash', () => {
  const pa = priorArtByAxis([], { targetId: 'this.card', archetype: 'media-card', subDecisions: SUBS });
  assert.equal(formatPriorArt(pa), '  (no prior art in this project for these axes)');
});
