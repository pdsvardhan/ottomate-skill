import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pairwise } from './pairwise.mjs';

test('covers every value pair in < full cross-product', () => {
  const rows = pairwise({ a: ['1', '2'], b: ['x', 'y'], c: ['p', 'q'] });
  const has = (k1, v1, k2, v2) => rows.some((r) => r[k1] === v1 && r[k2] === v2);
  for (const v1 of ['1', '2']) for (const v2 of ['x', 'y']) assert.ok(has('a', v1, 'b', v2), `a=${v1},b=${v2}`);
  for (const v1 of ['1', '2']) for (const v2 of ['p', 'q']) assert.ok(has('a', v1, 'c', v2));
  for (const v1 of ['x', 'y']) for (const v2 of ['p', 'q']) assert.ok(has('b', v1, 'c', v2));
  assert.ok(rows.length < 8, `pairwise ${rows.length} should be < full 8`);
});

test('single-parameter and empty are handled', () => {
  assert.equal(pairwise({ a: ['1', '2', '3'] }).length, 3);
  assert.deepEqual(pairwise({}), [{}]);
});
