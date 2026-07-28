import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deltaVsPrevious, hasRegression } from './delta.mjs';

const prev = [
  { case: 'a', outcome: 'pass' },
  { case: 'b', outcome: 'fail' },
  { case: 'c', outcome: 'fail' },
  { case: 'gone', outcome: 'pass' },
];
const cur = [
  { case: 'a', outcome: 'fail' },  // pass → fail = new failure
  { case: 'b', outcome: 'pass' },  // fail → pass = fixed
  { case: 'c', outcome: 'fail' },  // fail → fail = still failing
  { case: 'new', outcome: 'pass' }, // appeared
];

test('must-pass: fail→pass is bucketed as fixed, pass→fail as a new failure, fail→fail as still-failing', () => {
  const d = deltaVsPrevious(cur, prev);
  assert.deepEqual(d.fixed, ['b']);
  assert.deepEqual(d.new_failures, ['a']);
  assert.deepEqual(d.still_failing, ['c']);
  assert.equal(hasRegression(d), true);
});

test('must-fail: a case present now but absent before is reported (appeared), never silently dropped', () => {
  const d = deltaVsPrevious(cur, prev);
  assert.deepEqual(d.appeared, ['new']);
  assert.deepEqual(d.disappeared, ['gone']);
});

test('a known-flaky new red is surfaced as a flake, not counted as a regression', () => {
  const d = deltaVsPrevious(cur, prev, { knownFlaky: ['a'] });
  assert.deepEqual(d.flakes, ['a']);
  assert.deepEqual(d.new_failures, []);
  assert.equal(hasRegression(d), false);
});

test('identical runs produce an empty delta', () => {
  const d = deltaVsPrevious(prev, prev);
  assert.deepEqual([d.new_failures, d.fixed, d.appeared, d.disappeared], [[], [], [], []]);
});
