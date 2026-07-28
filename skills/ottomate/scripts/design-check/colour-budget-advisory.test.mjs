// colour-budget-advisory.test.mjs — WS1.0: colourBudget is ADVISORY, not blocking (F-8 fix).
// A real blocker (divergence) is the CONTROL — the downgrade must not disarm everything.
// run: node --test colour-budget-advisory.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allFindings, blockingFindings } from './computed-runner.mjs';

// an over-budget colour finding, exactly the shape computed-checks.js emits
const overBudget = {
  colourBudget: [{ label: 'panel', distinctAccents: 5, surfaces: 9, budget: 4, withinBudget: false, monochrome: false, colours: ['rgb(16,185,129)', 'rgb(29,78,216)', 'rgb(245,158,11)', 'rgb(239,68,68)'] }],
};

test('an over-budget colour is ADVISORY — it appears in allFindings but NOT in blockingFindings (F-8)', () => {
  const all = allFindings(overBudget);
  const cb = all.find((f) => f.rule === 'colour_budget');
  assert.ok(cb, 'the colour-budget finding is still surfaced');
  assert.equal(cb.advise, true, 'it is advisory');
  assert.equal(blockingFindings(overBudget).length, 0, 'a >4-hue data-viz no longer BLOCKS a round');
});

// CONTROL: a genuine blocker must still block, so the downgrade did not disarm the gate wholesale.
test('CONTROL — a divergence failure STILL blocks (the gate is not disarmed)', () => {
  const divergent = { divergence: [{ pair: ['A', 'B'], differ: false, distance: 0.08 }] };
  const b = blockingFindings(divergent);
  assert.equal(b.length, 1);
  assert.equal(b[0].rule, 'computed-axis-divergence');
});

test('CONTROL — a P2/P3 contrast floor failure STILL blocks', () => {
  const badContrast = { contrast: [{ label: 'p', text: 'hi', ratio: 2.1, need: 4.5 }] };
  assert.equal(blockingFindings(badContrast, { profile: 'P2' }).length, 1);
  // and at P1 it advises (unchanged audience-profile behaviour)
  assert.equal(blockingFindings(badContrast, { profile: 'P1' }).length, 0);
});
