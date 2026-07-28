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
