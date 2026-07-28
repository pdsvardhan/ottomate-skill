// P3-C4: the run PLANNER — pure logic that turns a cadence + inputs into a list of run-units the CLI
// (run.mjs) then executes. Keeping the planning pure means the branching (which apps, which matrices,
// which tier, where evidence lands, whether to post test_runs) is unit-tested; run.mjs is a thin
// conductor around child_process + fs. See docs/plans/2026-07-28-task3-P3C-*.

import { inferTier, layersForTier } from './change-tier.mjs';
import { impactedMatrices } from './impacted.mjs';
import { evidenceRootFor } from './evidence-root.mjs';

/** The nightly substrate (test_runs, triggered_by:'schedule') is posted only for scheduled runs. */
export function shouldPostTestRun(env) {
  return (env?.FV_TRIGGERED_BY ?? '') === 'schedule';
}

/**
 * Nightly: one run-unit per (app × matrix file) across the whole manifest; everything at schedule
 * cadence, evidence persisted to a dated dir.
 */
export function planNightly(manifest, opts = {}) {
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const session = opts.session ?? `nightly-${Date.now()}`;
  const units = [];
  for (const app of manifest?.apps ?? []) {
    for (const mf of app.matrix_files ?? []) {
      units.push({
        app: app.slug,
        instanceUrl: app.instance_url,
        matrixFile: mf,
        mode: 'nightly',
        triggeredBy: 'schedule',
        evidenceRoot: evidenceRootFor({ mode: 'nightly', date, session: `${session}-${app.slug}` }),
      });
    }
  }
  return units;
}

/**
 * On-commit within ONE app: infer the tier from the diff, select the impacted matrices (covers-globs),
 * evidence to /tmp (throwaway). Returns the tier context + the run-units.
 */
export function planCommit(args) {
  const { app, instanceUrl, changedFiles, matrices, override } = args;
  const date = args.date ?? new Date().toISOString().slice(0, 10);
  const session = args.session ?? `commit-${Date.now()}`;
  const tier = inferTier(changedFiles, { override });
  const layers = layersForTier(tier.tier);
  const impacted = impactedMatrices(changedFiles, matrices);
  const units = impacted.map((m) => ({
    app,
    instanceUrl,
    matrixFile: m.file,
    mode: 'commit',
    triggeredBy: 'push',
    tier: tier.tier,
    layers,
    evidenceRoot: evidenceRootFor({ mode: 'commit', date, session: `${session}-${app}` }),
  }));
  return { app, tier: tier.tier, tierReason: tier.reason, unknown: tier.unknown, layers, units };
}
