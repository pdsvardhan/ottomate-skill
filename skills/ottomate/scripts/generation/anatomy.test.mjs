// U1 — the anatomy split. The bar is that the split provably changed NOTHING.
// run: node --test anatomy.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAnatomy, resolveArchetype, questionRegistry, questionsForTier, tokenShapedQuestions, loadAnatomy } from './anatomy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(path.join(HERE, '__anatomy-golden.json'), 'utf8'));

test('GOLDEN — the resolved anatomy is byte-identical to the pre-split file', () => {
  const now = resolveAnatomy();
  assert.equal(
    JSON.stringify({ tiers: now.tiers, state_matrix: now.state_matrix, archetypes: now.archetypes }),
    JSON.stringify({ tiers: golden.tiers, state_matrix: golden.state_matrix, archetypes: golden.archetypes }),
  );
});

test('each archetype resolves identically on its own', () => {
  for (const name of Object.keys(golden.archetypes)) {
    assert.deepEqual(resolveArchetype(name), golden.archetypes[name], name);
  }
});

test('loadAnatomy keeps its pre-split contract — the resolved shape, not the raw files', () => {
  const a = loadAnatomy();
  assert.ok(a.archetypes['media-card'].sub_decisions.length > 0);
  assert.ok(a.tiers.composite.render_surface);
});

test('a per-component hint OVERRIDES the registry hint', () => {
  // corner-radius is answered by both media-card and button, with different worked hints.
  const card = resolveArchetype('media-card').sub_decisions.find((s) => s.id === 'corner-radius');
  const btn = resolveArchetype('button').sub_decisions.find((s) => s.id === 'corner-radius');
  assert.notEqual(card.hint, btn.hint, 'the two archetypes should not share one generic hint');
  assert.equal(card.hint, golden.archetypes['media-card'].sub_decisions.find((s) => s.id === 'corner-radius').hint);
  assert.equal(btn.hint, golden.archetypes.button.sub_decisions.find((s) => s.id === 'corner-radius').hint);
});

test('a question shared by two archetypes carries ONE channel and ONE scope_hint', () => {
  const card = resolveArchetype('media-card').sub_decisions.find((s) => s.id === 'corner-radius');
  const btn = resolveArchetype('button').sub_decisions.find((s) => s.id === 'corner-radius');
  assert.equal(card.channel, btn.channel);
  assert.equal(card.scope_hint, btn.scope_hint);
});

test('an unknown archetype is refused, and the error lists the known ones', () => {
  assert.throws(() => resolveArchetype('nope'), /unknown archetype "nope".*media-card/s);
});

test('the registry knows which tiers each question applies to', () => {
  const forPrimitive = questionsForTier('primitive').map((q) => q.id);
  assert.ok(forPrimitive.includes('emphasis-scale'), 'button questions should apply to primitive');
  assert.ok(!forPrimitive.includes('media-aspect'), 'a media aspect is not a primitive question');
});

test('token-shaped vs structural is recorded, because U5 needs to know what can become CSS', () => {
  const tokens = tokenShapedQuestions();
  assert.ok(tokens['corner-radius']?.token, 'radius must be token-shaped');
  assert.ok(!tokens['title-placement'], 'title placement cannot be a CSS custom property');
  assert.ok(!tokens['media-aspect'], 'media aspect is structural');
});

test('every question in the registry declares a channel, a scope_hint and a token field', () => {
  for (const [id, q] of Object.entries(questionRegistry())) {
    assert.ok(q.channel, `${id} has no channel`);
    assert.ok(['local', 'foundational'].includes(q.scope_hint), `${id} scope_hint invalid`);
    assert.ok('token' in q, `${id} does not say whether it is token-shaped`);
  }
});

test('every archetype question resolves to a real registry entry', () => {
  const reg = questionRegistry();
  for (const name of Object.keys(golden.archetypes)) {
    for (const sd of resolveArchetype(name).sub_decisions) {
      assert.ok(reg[sd.id], `${name} references unknown question ${sd.id}`);
    }
  }
});
