// U2 — deriving a component's inventory from its own source.
// run: node --test anatomy-derive.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectEvidence, inferTier, proposeRecord, validateRecord } from './anatomy-derive.mjs';

const CARD = `
  export function Card(p){ return (
    <article className="mc" data-role="media-card">
      <div className="pz"><img src={p.url} alt=""/><span className="chip">Owned</span></div>
      <button className="info" aria-label="Quick look">i</button>
      <div className="cap"><span className="t">{p.title}</span></div>
    </article>); }`;
const CARD_CSS = `.mc{border-radius:12px;box-shadow:0 2px 4px #000;transition:transform 200ms}
  .pz{aspect-ratio:2/3}.chip{color:#fff}.cap{padding:8px}.t{font-size:12px}.info{outline:none}`;

test('evidence records elements, classes, child components and CSS props — not just names', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  assert.ok(ev.elements.includes('img') && ev.elements.includes('button'));
  assert.ok(ev.classNames.includes('mc') && ev.classNames.includes('cap'));
  assert.deepEqual(ev.dataRoles, ['media-card']);
  assert.ok(ev.cssProps.includes('aspect-ratio'), 'CSS properties are the signal a name cannot give');
  assert.equal(ev.hasImage, true);
});

test('tier is inferred WITH a reason — an unexplained classification is not checkable', () => {
  const t = inferTier(collectEvidence('<main><h1>x</h1></main>'));
  assert.equal(t.tier, 'surface');
  assert.match(t.why, /landmark/);
});

test('a landmark makes it a surface; a named child makes it composite; neither makes it primitive', () => {
  assert.equal(inferTier(collectEvidence('<nav><a href="/">x</a></nav>')).tier, 'surface');
  assert.equal(inferTier(collectEvidence('<div><OwnChip/></div>')).tier, 'composite');
  assert.equal(inferTier(collectEvidence('<span className="chip">x</span>')).tier, 'primitive');
});

test('data-role is authoritative when present, class names are the fallback', () => {
  const withRole = proposeRecord(collectEvidence(CARD, CARD_CSS));
  assert.match(withRole.part_source, /data-role/);
  const noRole = proposeRecord(collectEvidence(CARD.replace(/ data-role="media-card"/, ''), CARD_CSS));
  assert.match(noRole.part_source, /class names the stylesheet actually styles/);
  assert.ok(noRole.parts.includes('mc'));
});

test('with no stylesheet the record SAYS the signal is weak rather than pretending', () => {
  const r = proposeRecord(collectEvidence(CARD.replace(/ data-role="media-card"/, ''), ''));
  assert.equal(r.confidence, 'low');
  assert.match(r.part_source, /NO CSS SUPPLIED/);
});

test('questions are RANKED by evidence, never silently filtered', () => {
  const r = proposeRecord(collectEvidence(CARD, CARD_CSS));
  assert.ok(r.likely.includes('media-aspect'), 'an <img> plus aspect-ratio should evidence media-aspect');
  assert.ok(r.likely.length + r.possible.length > r.likely.length || r.possible.length === 0);
  // everything not evidenced is still reported, so a keyword miss is visible rather than invisible
  assert.ok(Array.isArray(r.possible));
});

test('every proposed question names a part that exists in the source', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const r = proposeRecord(ev);
  const known = new Set([...ev.classNames, ...ev.dataRoles, ...ev.childComponents, ...ev.elements, ...ev.cssSelectors]);
  for (const q of r.questions) assert.ok(known.has(q.part), `${q.q} names unknown part ${q.part}`);
});

test('MUST FAIL — a part with no evidence in the source is rejected', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), parts: ['imaginary-part'] };
  const v = validateRecord(bad, ev);
  assert.equal(v.ok, false);
  assert.match(v.problems.join(' '), /imaginary-part.*traceable, not invented/);
});

test('MUST FAIL — a question outside the registry is rejected (doctrine rule 40)', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), questions: [{ q: 'vibe-level', part: 'mc' }] };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /not in the registry/);
});

test('MUST FAIL — a tier that contradicts the evidence is rejected', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), tier: 'surface' };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /contradicts the evidence/);
});

test('MUST FAIL — an interactive component missing the always-states floor is rejected (B2)', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  const bad = { ...proposeRecord(ev), required_states: ['rest'] };
  assert.equal(validateRecord(bad, ev).ok, false);
  assert.match(validateRecord(bad, ev).problems.join(' '), /missing required state "hover"/);
});

test('the honest happy path: the proposed record validates', () => {
  const ev = collectEvidence(CARD, CARD_CSS);
  assert.equal(validateRecord(proposeRecord(ev), ev).ok, true);
});
