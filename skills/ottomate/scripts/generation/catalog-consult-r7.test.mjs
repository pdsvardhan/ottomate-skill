// R7 (D-8) — a round must PROVE it consulted the catalog. run: node --test catalog-consult-r7.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogConsultationProof } from './catalog-source.mjs';

const candidates = [{ id: 'mc-card-glass' }, { id: 'mc-stat-tile' }, { id: 'mc-panel-plain' }];

// MUST-FAIL: bespoke while candidates existed, with no record of what was weighed.
test('a bespoke variant with candidates but NO weighed_against is FLAGGED (D-8)', () => {
  const r = catalogConsultationProof([{ label: 'A', source: { kind: 'bespoke', why: 'the catalog cards do not do a 3-panel spending cluster' } }], candidates);
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /records NO catalog consultation/);
});

// MUST-PASS: bespoke that records the mc-ids it weighed → proven consultation.
test('a bespoke variant that records weighed_against PASSES + produces an auditable record', () => {
  const r = catalogConsultationProof(
    [{ label: 'A', source: { kind: 'bespoke', why: 'none of these handle a 3-panel cluster', weighed_against: ['mc-card-glass', 'mc-stat-tile'] } }],
    candidates,
  );
  assert.equal(r.ok, true, r.problems.join('; '));
  assert.deepEqual(r.consultation.per_variant[0].weighed_against, ['mc-card-glass', 'mc-stat-tile']);
  assert.deepEqual(r.consultation.candidates_available, ['mc-card-glass', 'mc-stat-tile', 'mc-panel-plain']);
});

test('a catalog-sourced variant needs no consultation record (it USED the catalog)', () => {
  const r = catalogConsultationProof([{ label: 'A', source: { kind: 'catalog', mc_id: 'mc-card-glass' } }], candidates);
  assert.equal(r.ok, true);
  assert.equal(r.consultation.per_variant[0].mc_id, 'mc-card-glass');
});

test('with NO candidates available, a bespoke variant is fine (nothing to consult)', () => {
  const r = catalogConsultationProof([{ label: 'A', source: { kind: 'bespoke', why: 'novel component' } }], []);
  assert.equal(r.ok, true);
});

test('a FABRICATED consultation (weighed an id that was never a candidate) is caught', () => {
  const r = catalogConsultationProof([{ label: 'A', source: { kind: 'bespoke', why: 'x', weighed_against: ['mc-does-not-exist'] } }], candidates);
  assert.equal(r.ok, false);
  assert.match(r.problems.join(' '), /not catalog candidates/);
});
