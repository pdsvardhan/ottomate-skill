import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUntampered } from './tamper-guard.mjs';

const protectedPaths = ['design/feature-verify/x.matrix.json'];

test('a feature commit that touched the matrix → tampered', async () => {
  const runGit = async () => 'app/page.tsx\ndesign/feature-verify/x.matrix.json\n';
  const r = await assertUntampered({ featureCommits: ['a', 'b'], protectedPaths, runGit });
  assert.equal(r.untampered, false); assert.deepEqual(r.touched, protectedPaths); assert.equal(r.action, 're-derive');
});
test('a clean feature diff → untampered', async () => {
  const runGit = async () => 'app/page.tsx\nlib/db.ts\n';
  const r = await assertUntampered({ featureCommits: ['a'], protectedPaths, runGit });
  assert.equal(r.untampered, true); assert.equal(r.action, 'none');
});
