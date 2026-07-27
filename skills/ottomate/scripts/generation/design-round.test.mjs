// C3 — the one-command pipeline (design-round.mjs). AC10 is the only acceptance criterion whose
// module had no test naming it. This covers the SEAM the one-command design exists to close (publish
// only the file this run built) and the fail-closed control flow (a failed build never reaches publish).
// run: node --test design-round.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, manifestMatchesBuild } from './design-round.mjs';

const SELF = fileURLToPath(new URL('./design-round.mjs', import.meta.url));

test('parseArgs reads flags, --dry-run, and dash→underscore keys', () => {
  const a = parseArgs(['--set', 's.json', '--manifest', 'm.json', '--previews-dir', '/d', '--dry-run']);
  assert.equal(a.set, 's.json');
  assert.equal(a.manifest, 'm.json');
  assert.equal(a.previews_dir, '/d');
  assert.equal(a.dryRun, true);
});

test('MUST PASS — the manifest naming exactly the built file is accepted', () => {
  const setPath = '/proj/round/variant-set.json';
  const set = { output: 'variant-set.html' };
  const built = path.resolve('/proj/round/variant-set.html');
  const m = manifestMatchesBuild(set, { html: built }, setPath);
  assert.equal(m.ok, true);
  assert.equal(m.built, built);
});

test('MUST FAIL — a manifest naming a DIFFERENT file than the one just built is refused (the seam)', () => {
  const setPath = '/proj/round/variant-set.json';
  const set = { output: 'variant-set.html' };
  const m = manifestMatchesBuild(set, { html: '/proj/round/some-OTHER-file.html' }, setPath);
  assert.equal(m.ok, false, 'publishing a stale/other artifact past green gates is exactly the failure to prevent');
  assert.notEqual(m.built, m.want);
});

test('MUST PASS — the default output name is honoured when set.output is absent', () => {
  const m = manifestMatchesBuild({}, { html: path.resolve('/p/variant-set.html') }, '/p/set.json');
  assert.equal(m.ok, true);
});

// ── fail-closed control flow, driven as a real subprocess ─────────────────────────────────────────

test('MUST PASS — missing --set/--manifest prints usage and exits 1', () => {
  const r = spawnSync(process.execPath, [SELF], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: node design-round\.mjs/);
});

test('MUST FAIL — a build step that exits non-zero NEVER reaches publish (fail-closed)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'otto-dr-'));
  // A set the build step cannot process → build exits non-zero. The specific reason does not matter;
  // what matters is that ANY non-zero build result stops before the publish stage.
  const setPath = path.join(dir, 'variant-set.json');
  writeFileSync(setPath, JSON.stringify({ variants: [] })); // no variants → build fails
  writeFileSync(path.join(dir, 'round.json'), JSON.stringify({ html: path.join(dir, 'variant-set.html') }));
  const r = spawnSync(process.execPath, [SELF, '--set', setPath, '--manifest', path.join(dir, 'round.json')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0, 'a failed build must fail the whole command');
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  assert.match(out, /NOTHING PUBLISHED/);
  assert.doesNotMatch(out, /2\/2  publish/, 'the publish stage must never begin after a failed build');
});
