import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMatrix } from './gen-matrix.mjs';
import { validateMatrix } from './harness/matrix.mjs';

const req = {
  feature: 'demo.x', requirement_ref: 'AC-1',
  target: { kind: 'flow', id: 'x', base: 'FV_INSTANCE_URL' },
  parameters: { a: ['1', '2'], b: ['x', 'y'], c: ['p', 'q'] },
  oracleLayers: ['system-state', 'implicit'],
};

test('produces a valid, pairwise-bounded, risk-ordered matrix', async () => {
  const m = await buildMatrix(req, { at_commit: 'abc' });
  assert.equal(validateMatrix(m).ok, true);
  const happy = m.cases.filter((c) => c.path === 'happy');
  assert.ok(happy.length < 8, `happy cases ${happy.length} should be < full cross-product 8 (pairwise)`);
  for (const p of ['error', 'permission', 'persistence']) assert.ok(m.cases.some((c) => c.path === p), `mandatory path ${p} present`);
  const idxPerm = m.cases.findIndex((c) => c.path === 'permission');
  const idxHappy = m.cases.findIndex((c) => c.path === 'happy');
  assert.ok(idxPerm < idxHappy, 'permission is risk-ordered before happy');
});

test('must-fail: an unknown oracle layer throws', async () => {
  await assert.rejects(() => buildMatrix({ ...req, oracleLayers: ['made-up'] }, { at_commit: 'a' }), /unknown oracle layer/);
});

// The gate matches feature_verification_reports.target_id against the REGISTRY flow id, so the
// matrix has to be able to carry one. Absent by default on purpose: a guessed flow would file a
// green APPROVE against something nobody drove, which is worse than no approval at all.
test('flow_id is carried through when named, and absent when not', async () => {
  const withFlow = await buildMatrix({ ...req, flow_id: 'flow-request-tv' }, { at_commit: 'abc' });
  assert.equal(withFlow.flow_id, 'flow-request-tv');
  assert.equal(validateMatrix(withFlow).ok, true);

  const without = await buildMatrix(req, { at_commit: 'abc' });
  assert.equal('flow_id' in without, false, 'flow_id must not be invented');
  assert.equal(validateMatrix(without).ok, true);
});

test('must-fail: a blank flow_id is rejected rather than posted as an empty target', async () => {
  const m = await buildMatrix(req, { at_commit: 'abc' });
  for (const bad of ['', '   ', 42, null]) {
    const v = validateMatrix({ ...m, flow_id: bad });
    assert.equal(v.ok, false, `flow_id ${JSON.stringify(bad)} should be rejected`);
    assert.match(v.errors.join('; '), /flow_id/);
  }
});
