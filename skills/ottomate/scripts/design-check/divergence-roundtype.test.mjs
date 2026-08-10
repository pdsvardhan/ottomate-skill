// divergence-roundtype.test.mjs — the WIRING of the divergence exemption, not the exemption itself.
//
// 2026-08-10, found on a real mapsofbharat cluster round. `composition-gate-r3.test.mjs` already
// asserted that a one-axis controlled round is exempt from the divergence floor, and it passed —
// because it calls `blockingFindings` directly. Nothing asserted that the HARNESS ever passes a
// roundType, and it did not: `build-variant-set.mjs` called `runComputedPass` / `blockingFindings`
// without one, so `allFindings` always took its 'whole-direction' default and the exemption was
// unreachable in production. A unit test on a code path nothing reaches is a test that passes while
// the behaviour it describes is dead.
//
// These tests bite at the boundary the old ones did not.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allFindings, blockingFindings, formatComputed, DIVERGENCE_EXEMPT } from './computed-runner.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tooAlike = { divergence: [{ pair: ['Option A', 'Option B'], differ: false, distance: 0.12 }] };
const ran = { state: 'ran', findings: tooAlike };

test('a multi-axis CONTROLLED round is exempt, same as one-axis — control-diff governs both', () => {
  assert.equal(blockingFindings(tooAlike, { roundType: 'controlled' }).length, 0);
  assert.equal(blockingFindings(tooAlike, { roundType: 'one-axis' }).length, 0);
  assert.ok(DIVERGENCE_EXEMPT.has('controlled') && DIVERGENCE_EXEMPT.has('one-axis'));
});

test('CONTROL — whole-direction still blocks, and it is still the default', () => {
  assert.equal(blockingFindings(tooAlike, { roundType: 'whole-direction' }).length, 1);
  assert.equal(blockingFindings(tooAlike).length, 1);
  assert.equal(allFindings(tooAlike).filter((f) => f.rule === 'computed-axis-divergence').length, 1);
});

// This is the one that fails before the fix: formatComputed did not ACCEPT a roundType at all, so it
// reported divergence as BLOCK no matter what the round was. The harness prints this string, so a
// caller reading the output was told a controlled round was blocked when it was not.
test('formatComputed honours roundType instead of ignoring it', () => {
  assert.match(formatComputed(ran, 'P3', 'whole-direction'), /BLOCK computed-axis-divergence/);
  assert.doesNotMatch(formatComputed(ran, 'P3', 'controlled'), /BLOCK computed-axis-divergence/);
  assert.match(formatComputed(ran, 'P3'), /BLOCK computed-axis-divergence/); // default unchanged
});

// The wiring guard. Asserting on source is blunt, but the alternative is spinning up Chromium and a
// full build inside a unit test, and the defect being guarded is EXACTLY "the call site silently
// stopped passing the argument" — which only a call-site assertion catches.
test('build-variant-set passes roundType to both the formatter and the blocker', () => {
  const src = readFileSync(path.join(HERE, '..', 'preview-build', 'build-variant-set.mjs'), 'utf8');
  assert.match(src, /const roundType = cfg\.roundType \?\? 'whole-direction'/,
    'the harness must read roundType off the config, defaulting to whole-direction');
  assert.match(src, /formatComputed\([^)]*roundType\)/,
    'formatComputed must receive roundType — it prints the BLOCK lines the operator reads');
  assert.match(src, /blockingFindings\(computed\.findings, \{ profile, roundType \}\)/,
    'blockingFindings must receive roundType — this is the call that decides exit(2)');
});
