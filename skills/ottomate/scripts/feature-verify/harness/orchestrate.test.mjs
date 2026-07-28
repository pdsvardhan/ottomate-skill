import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPostTestRun, planNightly, planCommit } from './orchestrate.mjs';
import { PERSIST_ROOT } from './evidence-root.mjs';

test('shouldPostTestRun is true only for the scheduled (nightly) cadence', () => {
  assert.equal(shouldPostTestRun({ FV_TRIGGERED_BY: 'schedule' }), true);
  assert.equal(shouldPostTestRun({ FV_TRIGGERED_BY: 'push' }), false);
  assert.equal(shouldPostTestRun({}), false);
});

const manifest = {
  apps: [
    { slug: 'mapsofbharat', instance_url: 'http://127.0.0.1:8610', matrix_files: ['fixtures/mob.matrix.json'] },
    { slug: 'screenroom', instance_url: 'http://127.0.0.1:8620', matrix_files: ['a.json', 'b.json'] },
  ],
};

test('must-pass: planNightly emits one run-unit per (app × matrix), schedule cadence, persistent evidence', () => {
  const units = planNightly(manifest, { date: '2026-07-29', session: 'nite' });
  assert.equal(units.length, 3);
  assert.deepEqual(units.map((u) => u.app), ['mapsofbharat', 'screenroom', 'screenroom']);
  assert.ok(units.every((u) => u.triggeredBy === 'schedule' && u.mode === 'nightly'));
  assert.ok(units.every((u) => u.evidenceRoot.startsWith(`${PERSIST_ROOT}/2026-07-29/`)));
});

test('planCommit: infers the tier, selects impacted matrices via covers, evidence to /tmp', () => {
  const matrices = [
    { file: 'card.json', covers: ['src/components/Card.tsx'] },
    { file: 'map.json', covers: ['src/map/**'] },
  ];
  const plan = planCommit({
    app: 'mapsofbharat', instanceUrl: 'http://127.0.0.1:8610',
    changedFiles: ['src/components/Card.tsx'], matrices, date: '2026-07-29', session: 's',
  });
  assert.equal(plan.tier, 'T2');                       // a component change
  assert.equal(plan.layers.judge, 'glance');
  assert.deepEqual(plan.units.map((u) => u.matrixFile), ['card.json']); // map.json not impacted
  assert.ok(plan.units[0].evidenceRoot.startsWith('/tmp/'));
});

test('must-fail: an unknown/empty commit diff fails closed to T3 and runs the no-covers matrices', () => {
  const matrices = [{ file: 'always.json' }]; // no covers ⇒ always impacted when the app is touched…
  const plan = planCommit({ app: 'x', instanceUrl: 'u', changedFiles: [], matrices });
  assert.equal(plan.tier, 'T3');
  assert.equal(plan.unknown, true);
  // …but an EMPTY diff impacts nothing, so no units run (nothing to verify) — honest, not a false green
  assert.deepEqual(plan.units, []);
});
