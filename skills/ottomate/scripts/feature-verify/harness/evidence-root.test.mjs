import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceRootFor, pruneEvidence, PERSIST_ROOT } from './evidence-root.mjs';

test('must-pass: a nightly run resolves to a dated PERSISTENT dir; a commit run stays in /tmp', () => {
  const nightly = evidenceRootFor({ mode: 'nightly', date: '2026-07-29', session: 'abc' });
  assert.equal(nightly, `${PERSIST_ROOT}/2026-07-29/nightly-abc`);
  const commit = evidenceRootFor({ mode: 'commit', date: '2026-07-29', session: 'abc' });
  assert.match(commit, /^\/tmp\//);
});

test('a fix run also persists (its RED→GREEN proof is worth keeping); session is path-sanitised', () => {
  const r = evidenceRootFor({ mode: 'fix', date: '2026-07-29', session: 'a/b c' });
  assert.equal(r, `${PERSIST_ROOT}/2026-07-29/fix-a_b_c`);
});

test('must-fail: a persistent mode can never resolve under /tmp (fail-loud)', () => {
  assert.throws(
    () => evidenceRootFor({ mode: 'nightly', persistRoot: '/tmp/oops', date: '2026-07-29', session: 'x' }),
    /must persist, not write under \/tmp/,
  );
});

test('pruneEvidence deletes only dirs older than keepDays; non-date dirs are left alone', async () => {
  const removed = [];
  const pruned = await pruneEvidence('/root', 7, {
    now: Date.parse('2026-07-29'),
    lister: async () => ['2026-07-01', '2026-07-28', 'latest', 'artifacts'],
    remover: async (p) => removed.push(p),
  });
  assert.deepEqual(pruned, ['2026-07-01']);          // 28 days old → pruned; 1 day old kept
  assert.deepEqual(removed, ['/root/2026-07-01']);   // non-date dirs ('latest','artifacts') untouched
});
