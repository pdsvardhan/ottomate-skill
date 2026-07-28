import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateMatrix } from './matrix.mjs';

const good = {
  feature: 'f.x', requirement_ref: 'AC-1',
  authored: { from: 'locked-AC', at_commit: 'abc123', blind_to_diff: true },
  target: { kind: 'flow', id: 'x', base: 'FV_INSTANCE_URL' },
  parameters: { indicator: ['A', 'B'] },
  cases: [{ id: 'c1', path: 'happy', params: { indicator: 'A' }, oracles: [{ layer: 'system-state' }] }],
  review: { owner_locked: false, locked_at: null },
};

test('a well-formed matrix passes', () => assert.equal(validateMatrix(good).ok, true));
test('must-fail: bad path enum', () => {
  const bad = structuredClone(good); bad.cases[0].path = 'nonsense';
  const r = validateMatrix(bad); assert.equal(r.ok, false); assert.match(r.errors.join(), /path/);
});
test('must-fail: bad oracle layer', () => {
  const bad = structuredClone(good); bad.cases[0].oracles = [{ layer: 'made-up' }];
  assert.equal(validateMatrix(bad).ok, false);
});
test('must-fail: no cases / missing authored.at_commit', () => {
  assert.equal(validateMatrix({ ...good, cases: [] }).ok, false);
  const b2 = structuredClone(good); delete b2.authored.at_commit; assert.equal(validateMatrix(b2).ok, false);
});
test('reproduce_symptom: pass_to_pass must reference a real case id', () => {
  const m = structuredClone(good);
  m.cases[0].reproduce_symptom = true; m.cases[0].symptom_assert = 'x'; m.cases[0].pass_to_pass = ['nope'];
  assert.equal(validateMatrix(m).ok, false);
});
