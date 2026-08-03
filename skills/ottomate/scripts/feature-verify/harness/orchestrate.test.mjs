import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldPostTestRun, planNightly, planCommit, planFullSite, classifyInstance } from './orchestrate.mjs';
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

// ── Phase 2a: the registry-driven full-site planner ──
const flows = [
  {
    project_slug: 'screenroom', id: 'flow-music-upload', title: 'Music upload',
    priority: 'important', test_status: 'passing',
    linked_playwright_test: 'skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music/music-upload.verify.mjs',
  },
  {
    project_slug: 'mapsofbharat', id: 'flow-indicator', title: 'Indicator switch',
    priority: 'critical', test_status: 'passing',
    linked_playwright_test: 'tests/e2e/mob-indicator.feature-verify.spec.ts',
  },
  {
    project_slug: 'screenroom', id: 'flow-search', title: 'Search', priority: 'nice-to-have',
    test_status: 'not-tested', linked_playwright_test: null, // no test → a GAP
  },
];

test('planFullSite: one unit per linked flow, risk-ordered, sandbox flows → disposable, evidence persists', () => {
  const plan = planFullSite(flows, { date: '2026-08-03', session: 'fs' });
  assert.equal(plan.summary.total_flows, 3);
  assert.equal(plan.units.length, 2);
  assert.equal(plan.summary.gaps, 1);
  assert.deepEqual(plan.units.map((u) => u.flowId), ['flow-indicator', 'flow-music-upload']); // critical first
  const byId = Object.fromEntries(plan.units.map((u) => [u.flowId, u]));
  assert.equal(byId['flow-music-upload'].instance, 'disposable');   // under sandboxes/
  assert.equal(byId['flow-indicator'].instance, 'shared');          // read-only spec
  assert.equal(plan.summary.disposable, 1);
  assert.ok(byId['flow-music-upload'].evidenceRoot.startsWith(`${PERSIST_ROOT}/2026-08-03/`)); // full-site persists
});

test('must-not-silent-pass: a flow with no linked test is a GAP, never a run-unit', () => {
  const plan = planFullSite(flows);
  assert.deepEqual(plan.gaps.map((g) => g.flowId), ['flow-search']);
  assert.ok(!plan.units.some((u) => u.flowId === 'flow-search'));
});

test('planFullSite: opts.projects filters to a subset; writeHeavyFlows forces disposable', () => {
  const plan = planFullSite(flows, { projects: ['mapsofbharat'], writeHeavyFlows: new Set(['flow-indicator']) });
  assert.equal(plan.summary.total_flows, 1);
  assert.equal(plan.units.length, 1);
  assert.equal(plan.units[0].project, 'mapsofbharat');
  assert.equal(plan.units[0].instance, 'disposable'); // forced despite not being a sandbox path
});

test('classifyInstance: sandbox path or explicit set → disposable, else shared', () => {
  assert.equal(classifyInstance({ id: 'a', linked_playwright_test: 'x/sandboxes/y.mjs' }), 'disposable');
  assert.equal(classifyInstance({ id: 'b', linked_playwright_test: 'tests/e2e/z.spec.ts' }), 'shared');
  assert.equal(classifyInstance({ id: 'c' }, { writeHeavyFlows: ['c'] }), 'disposable');
  assert.equal(classifyInstance({ id: 'd' }), 'shared'); // no test, no set
});
