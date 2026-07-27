// T8 — the owner's own decision history as style priors.
// run: node --test style-priors.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStylePriors, formatStylePriors, scoreAgainstPriors } from './style-priors.mjs';

const L = (o) => ({ status: 'locked', project_slug: 'p1', target_id: 't1', axis: 'media-card.corner-radius', chosen_value: '4px', ...o });

test('a value locked twice is a PATTERN; once is WEAK', () => {
  const p = buildStylePriors([L({ target_id: 't1' }), L({ target_id: 't2' }), L({ axis: 'media-card.elevation', chosen_value: 'flat-hairline' })]);
  const radius = p.prefers.find((x) => x.question === 'corner-radius');
  const elev = p.prefers.find((x) => x.question === 'elevation');
  assert.equal(radius.count, 2);
  assert.equal(radius.strength, 'pattern');
  assert.equal(elev.strength, 'weak', 'one instance is an anecdote, not a preference');
});

test('ONLY locked decisions become preferences — a proposal is not taste', () => {
  const p = buildStylePriors([L({ status: 'proposed' }), L({ status: 'in-review' })]);
  assert.equal(p.prefers.length, 0);
  assert.equal(p.empty, true);
});

test('ONLY a deliberate rule-out becomes an avoid — merely losing a round is not taste (T3)', () => {
  const soft = [{ axis: 'media-card.corner-radius', status: 'in-review', rejected: [{ value: '20px', grade: 'not_selected', why_rejected: 'not selected in the per-item pick' }] }];
  assert.equal(buildStylePriors(soft).avoids.length, 0);
  const hard = [{ axis: 'media-card.corner-radius', status: 'in-review', rejected: [{ value: '20px', grade: 'rejected_with_reason', why_rejected: 'too soft for a data surface' }] }];
  const p = buildStylePriors(hard);
  assert.equal(p.avoids.length, 1);
  assert.equal(p.avoids[0].whys[0], 'too soft for a data surface');
});

test('priors are CROSS-PROJECT — taste belongs to the person, not the project', () => {
  const p = buildStylePriors([L({ project_slug: 'p1' }), L({ project_slug: 'p2', target_id: 't9' })]);
  assert.deepEqual(p.prefers[0].projects.sort(), ['p1', 'p2']);
  assert.equal(p.prefers[0].strength, 'pattern');
});

test("a target's own history does not speak for its own round", () => {
  const p = buildStylePriors([L({ target_id: 'me' })], { excludeTarget: 'me' });
  assert.equal(p.empty, true);
});

test('axes with NO history are named as an explore budget — silence is not agreement', () => {
  const p = buildStylePriors([L({})], { axesInPlay: ['corner-radius', 'hover-motion', 'badge-style'] });
  assert.deepEqual(p.explore.sort(), ['badge-style', 'hover-motion']);
});

test('an empty ledger says so plainly and forbids inventing a house style', () => {
  const s = formatStylePriors(buildStylePriors([]));
  assert.match(s, /none yet/);
  assert.match(s, /absence of history is not a preference/);
});

test('the injected text hedges — a count is evidence, not a rule', () => {
  const s = formatStylePriors(buildStylePriors([L({ target_id: 'a' }), L({ target_id: 'b' })]));
  assert.match(s, /INFORM, they do not/);
  assert.match(s, /constrain/);
  assert.match(s, /show them something new/);
});

test('a weak prior is labelled in the text so it cannot be read as a preference', () => {
  const s = formatStylePriors(buildStylePriors([L({})]));
  assert.match(s, /once only; do not treat as a preference/);
});

test('scoreAgainstPriors counts ruled-out values a proposed round would re-offer', () => {
  const priors = buildStylePriors([{ axis: 'media-card.corner-radius', status: 'in-review', rejected: [{ value: '20px', grade: 'rejected_with_reason', why_rejected: 'too soft' }] }]);
  const bad = { A: { 'corner-radius': '20px' }, B: { 'corner-radius': '4px' } };
  const good = { A: { 'corner-radius': '4px' }, B: { 'corner-radius': '12px' } };
  assert.equal(scoreAgainstPriors(bad, priors).ruledOutReOffered, 1);
  assert.equal(scoreAgainstPriors(bad, priors).violations[0].slot, 'A');
  assert.equal(scoreAgainstPriors(good, priors).ruledOutReOffered, 0);
});
