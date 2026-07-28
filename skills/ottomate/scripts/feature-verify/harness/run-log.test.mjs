import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runLogEntry, appendRunLog, readRunLog, lastGreenCommit, flakyCases } from './run-log.mjs';

async function tmpFile() {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'fv-runlog-'));
  return path.join(d, 'sub', 'runs.jsonl'); // sub/ exercises the mkdir -p
}

test('runLogEntry derives result from counts (fail>0→failed, skipped>0→partial, else passed)', () => {
  assert.equal(runLogEntry({ counts: { total: 3, fail: 1 } }).result, 'failed');
  assert.equal(runLogEntry({ counts: { total: 3, skipped: 1 } }).result, 'partial');
  assert.equal(runLogEntry({ counts: { total: 3, pass: 3 } }).result, 'passed');
});

test('must-pass: append leaves prior lines intact and adds exactly one; readRunLog round-trips', async () => {
  const file = await tmpFile();
  await appendRunLog(file, runLogEntry({ run_id: 'r1', app: 'mob', commit: 'aaa', counts: { total: 1, pass: 1 } }));
  await appendRunLog(file, runLogEntry({ run_id: 'r2', app: 'mob', commit: 'bbb', counts: { total: 1, fail: 1 } }));
  const entries = await readRunLog(file);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((e) => e.run_id), ['r1', 'r2']);
});

test('readRunLog on a missing file is [] (fail-soft), and torn lines are skipped', async () => {
  assert.deepEqual(await readRunLog('/no/such/file.jsonl'), []);
  const file = await tmpFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, '{"run_id":"ok","result":"passed"}\n{not json}\n\n');
  const e = await readRunLog(file);
  assert.equal(e.length, 1);
  assert.equal(e[0].run_id, 'ok');
});

test('lastGreenCommit returns the most recent passed commit for the app', () => {
  const entries = [
    { app: 'mob', result: 'passed', commit: 'g1' },
    { app: 'other', result: 'passed', commit: 'x' },
    { app: 'mob', result: 'failed', commit: 'r1' },
    { app: 'mob', result: 'passed', commit: 'g2' },
    { app: 'mob', result: 'failed', commit: 'r2' },
  ];
  assert.equal(lastGreenCommit(entries, { app: 'mob' }), 'g2');
  assert.equal(lastGreenCommit([{ app: 'mob', result: 'failed', commit: 'r' }], { app: 'mob' }), null);
});

test('flakyCases surfaces a case whose outcome is not constant across recent runs', () => {
  const entries = [
    { app: 'mob', results: [{ case: 'x', outcome: 'pass' }, { case: 'y', outcome: 'pass' }] },
    { app: 'mob', results: [{ case: 'x', outcome: 'fail' }, { case: 'y', outcome: 'pass' }] },
    { app: 'mob', results: [{ case: 'x', outcome: 'pass' }, { case: 'y', outcome: 'pass' }] },
  ];
  assert.deepEqual(flakyCases(entries, { app: 'mob' }), ['x']); // x flips, y is steady
});
