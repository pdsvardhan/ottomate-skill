// R8 — round pipeline plan (§M) + ledger-vs-source reconciliation (F-2). run: node --test round-pipeline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRound, reconcileLedgerVsSource, ROUND_STEPS } from './round-pipeline.mjs';

test('planRound sequences the full chain and marks where it pauses (owner/model forks)', () => {
  const p = planRound();
  assert.deepEqual(p.steps.map((s) => s.id), ['decompose', 'scope', 'context-gate', 'compose', 'generate', 'gates', 'publish', 'pick', 'lock', 'emit']);
  // the forks are explicit: scope/pick/lock are owner, generate is a model sub-agent
  assert.deepEqual(p.pauses.map((x) => `${x.id}:${x.kind}`), ['scope:owner', 'generate:model', 'pick:owner', 'lock:owner']);
  assert.equal(p.nextPause, 'scope', 'the first fork is the always-ask scope');
});

test('resumeAfter continues the plan (a one-command driver runs auto steps between forks)', () => {
  const p = planRound({ resumeAfter: 'scope' });
  assert.equal(p.steps[0].id, 'context-gate');
  assert.deepEqual(p.mechanical.slice(0, 2), ['context-gate', 'compose']);
  assert.equal(p.nextPause, 'generate');
});

test('every step is mechanical, owner, or model (no unclassified step)', () => {
  assert.ok(ROUND_STEPS.every((s) => ['mechanical', 'owner', 'model'].includes(s.kind)));
});

// F-2: the reconciliation flags a ledger field contradicting the shipped source.
test('reconcileLedgerVsSource FLAGS palette_dark:null while the source ships a dark theme (F-2)', () => {
  const r = reconcileLedgerVsSource({ palette_dark: null }, { css: 'body{} .dark{ --bg:#000 }' });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /palette_dark is null/);
  // hasDarkTokens flag also triggers it
  assert.equal(reconcileLedgerVsSource({ palette_dark: null }, { hasDarkTokens: true }).ok, false);
});

test('CONTROL — no contradiction when palette_dark is set, or the source ships no dark theme', () => {
  assert.equal(reconcileLedgerVsSource({ palette_dark: { bg: '#000' } }, { hasDarkTokens: true }).ok, true);
  assert.equal(reconcileLedgerVsSource({ palette_dark: null }, { css: '.card{color:#111}' }).ok, true);
});
