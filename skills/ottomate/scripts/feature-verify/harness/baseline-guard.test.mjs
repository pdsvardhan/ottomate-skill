import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { requireBaseline } from './baseline-guard.mjs';

test('missing baseline is a FAIL, never auto-created', async () => {
  const r = await requireBaseline('/tmp/does-not-exist-xyz-123.png');
  assert.equal(r.ok, false); assert.match(r.detail, /missing baseline/i);
});
test('present baseline passes', async () => {
  const r = await requireBaseline(fileURLToPath(import.meta.url));
  assert.equal(r.ok, true);
});
