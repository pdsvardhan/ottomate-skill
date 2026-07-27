// C7 — the colour budget must be STATED (AC9). run: node --test colour-budget.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateColourBudget } from './build-variant-set.mjs';

test('MUST FAIL — a config with no colorBudget is refused', () => {
  const r = validateColourBudget({});
  assert.equal(r.ok, false);
  assert.match(r.reason, /required/);
});

test('MUST PASS — a positive number of surfaces is a stated budget', () => {
  assert.deepEqual(validateColourBudget({ colorBudget: 4 }), { ok: true, budget: 4 });
});

test('MUST FAIL — zero or negative surface counts are not a budget', () => {
  assert.equal(validateColourBudget({ colorBudget: 0 }).ok, false);
  assert.equal(validateColourBudget({ colorBudget: -2 }).ok, false);
});

test('MUST PASS — {mode:"unconstrained", why} proceeds and carries the reason for the audit trail', () => {
  const r = validateColourBudget({ colorBudget: { mode: 'unconstrained', why: 'a deliberately maximal poster wall' } });
  assert.equal(r.ok, true);
  assert.equal(r.budget.why, 'a deliberately maximal poster wall');
});

test('MUST FAIL — unconstrained WITHOUT a why is not a stated choice', () => {
  assert.equal(validateColourBudget({ colorBudget: { mode: 'unconstrained' } }).ok, false);
  assert.equal(validateColourBudget({ colorBudget: { mode: 'unconstrained', why: '   ' } }).ok, false);
});

test('accepts the British spelling too', () => {
  assert.equal(validateColourBudget({ colourBudget: 3 }).ok, true);
});
