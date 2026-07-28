import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explorerPlaybook, nastyInputCatalog, freezeAsCase, mergeFrozenCases } from './explorer.mjs';
import { validateMatrix } from './matrix.mjs';

test('the playbook is the fixed 5 high-value categories, each with probes', () => {
  const pb = explorerPlaybook();
  assert.deepEqual(pb.map((c) => c.id), ['adversarial-inputs', 'interruptions-races', 'error-paths', 'boundary-state', 'visibility']);
  assert.ok(pb.every((c) => c.probes.length > 0));
});

test('the nasty-input catalog covers the headline classes (non-ascii, nfc/nfd, empty, huge, duplicate)', () => {
  const cat = nastyInputCatalog();
  for (const k of ['non-ascii:telugu', 'nfd', 'empty', 'huge', 'duplicate']) assert.ok(cat.includes(k), `missing ${k}`);
});

test('freezeAsCase maps category→path and produces a case that passes validateMatrix', () => {
  const c = freezeAsCase({ category: 'error-paths', probe: 'provider offline', layer: 'implicit', assert: 'mob.some-check' });
  assert.equal(c.path, 'error');
  assert.equal(c.discovered_by, 'explorer');
  assert.equal(c.needs_assert, undefined); // has an assert → runnable
  // wrap in a minimal valid matrix and validate
  const m = { feature: 'f', requirement_ref: 'r', authored: { at_commit: 'x', blind_to_diff: true }, target: { kind: 'flow', id: 'x' }, cases: [c], review: { owner_locked: false } };
  assert.equal(validateMatrix(m).ok, true);
});

test('must-fail: a finding WITHOUT an assert is frozen needs_assert:true (fail-closed placeholder, never a silent pass)', () => {
  const c = freezeAsCase({ category: 'adversarial-inputs', probe: 'non-ascii', input: 'non-ascii:telugu', layer: 'system-state' });
  assert.equal(c.needs_assert, true);
  assert.equal(c.path, 'edge');
  assert.deepEqual(c.params, { input: 'non-ascii:telugu' });
});

test('interruptions→concurrency, visibility→permission path mapping', () => {
  assert.equal(freezeAsCase({ category: 'interruptions-races', probe: 'double-submit' }).path, 'concurrency');
  assert.equal(freezeAsCase({ category: 'visibility', probe: 'guest' }).path, 'permission');
});

test('mergeFrozenCases appends + de-dupes by id (a rerun re-freezes the same finding, not a duplicate)', () => {
  const existing = [{ id: 'c1', path: 'happy', oracles: [{ layer: 'system-state' }] }];
  const frozen = [freezeAsCase({ category: 'error-paths', probe: 'timeout', id: 'explorer-timeout' }),
                  freezeAsCase({ category: 'error-paths', probe: 'timeout', id: 'explorer-timeout' })];
  const merged = mergeFrozenCases(existing, frozen);
  assert.equal(merged.length, 2); // c1 + one explorer-timeout (the dup collapsed)
});

test('freezeAsCase rejects an unknown layer', () => {
  assert.throws(() => freezeAsCase({ category: 'error-paths', probe: 'x', layer: 'made-up' }), /bad layer/);
});
