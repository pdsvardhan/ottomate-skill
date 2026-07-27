// Tests for round-composition.mjs — the round-size + grouping rule.
// run: node --test round-composition.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeRounds, formatComposition, DEFAULT_MAX_AXES } from './round-composition.mjs';
import { resolveAnatomy } from './anatomy.mjs';

const anatomy = resolveAnatomy();
const mediaCard = anatomy.archetypes['media-card'].sub_decisions;

test('every sub-decision in every archetype carries a channel and a scope_hint', () => {
  for (const [name, a] of Object.entries(anatomy.archetypes)) {
    for (const sd of a.sub_decisions) {
      assert.ok(sd.channel, `${name}.${sd.id} has no channel`);
      assert.ok(sd.scope_hint, `${name}.${sd.id} has no scope_hint`);
      assert.ok(['local', 'foundational'].includes(sd.scope_hint), `${name}.${sd.id} scope_hint invalid`);
    }
  }
});

test('a channel is never split across rounds — it is one fused impression', () => {
  const { rounds } = composeRounds(mediaCard);
  const seen = new Map();
  for (const r of rounds) for (const c of r.channels) {
    assert.ok(!seen.has(c), `channel ${c} appears in more than one round`);
    seen.set(c, r.index);
  }
});

test('no round exceeds the matrix bound unless a single channel does', () => {
  const { rounds } = composeRounds(mediaCard);
  for (const r of rounds) {
    if (!r.overWide) assert.ok(r.axes.length <= DEFAULT_MAX_AXES, `round ${r.index} has ${r.axes.length} axes`);
  }
});

test('structure comes before dress — weight/density precede colour/motion', () => {
  const { rounds } = composeRounds(mediaCard);
  const firstOf = (c) => rounds.find((r) => r.channels.includes(c))?.index ?? Infinity;
  assert.ok(firstOf('weight') <= firstOf('colour'), 'colour was judged before shape');
  assert.ok(firstOf('density') <= firstOf('motion'), 'motion was judged before density');
});

test('the whole media-card (10 axes) splits rather than running as one 30-cell matrix', () => {
  const { rounds, matrix } = composeRounds(mediaCard);
  assert.equal(matrix.axes, 10);
  assert.ok(rounds.length >= 2, 'ten axes should not be one round');
  assert.equal(matrix.regime, 'per-item-viable');
});

test('foundational axes are flagged for promotion at component scope, not at cluster scope', () => {
  const atComponent = composeRounds(mediaCard, { scope: 'component' });
  const atCluster = composeRounds(mediaCard, { scope: 'cluster' });
  assert.ok(atComponent.promote.length > 0);
  assert.ok(atComponent.promote.every((a) => a.scope_hint === 'foundational'));
  assert.equal(atCluster.promote.length, 0);
});

test('corner-radius and elevation are foundational and land in the same round (they fuse)', () => {
  const { rounds } = composeRounds(mediaCard);
  const r = rounds.find((x) => x.axes.some((a) => a.id === 'corner-radius'));
  assert.ok(r.axes.some((a) => a.id === 'elevation'), 'radius and elevation were separated');
});

test('a channel bigger than the bound runs over-wide, LOUDLY, rather than being split', () => {
  const fat = Array.from({ length: 7 }, (_, i) => ({ id: `w${i}`, channel: 'weight', scope_hint: 'local' }));
  const { rounds, matrix, warnings } = composeRounds(fat);
  assert.equal(rounds.length, 1);
  assert.equal(rounds[0].overWide, true);
  assert.equal(matrix.regime, 'expect-panel-level');
  assert.match(warnings.join(' '), /over-wide|expect panel-level/i);
});

test('an unknown channel is judged last and warned about, never dropped', () => {
  const odd = [{ id: 'x', channel: 'vibes', scope_hint: 'local' }, { id: 'r', channel: 'weight', scope_hint: 'local' }];
  const { rounds, warnings } = composeRounds(odd);
  assert.equal(rounds.at(-1).channels.at(-1), 'vibes');
  assert.match(warnings.join(' '), /unknown channel "vibes"/);
  assert.equal(rounds.flatMap((r) => r.axes).length, 2);
});

test('an empty contested set produces no rounds and does not throw', () => {
  const { rounds, matrix } = composeRounds([]);
  assert.equal(rounds.length, 0);
  assert.equal(matrix.axes, 0);
});

test('the summary names the regime, the rounds and the promotions', () => {
  const s = formatComposition(composeRounds(mediaCard));
  assert.match(s, /per-item-viable/);
  assert.match(s, /round 1/);
  assert.match(s, /PROMOTE:/);
});
