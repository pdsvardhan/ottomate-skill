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

/**
 * Write-heavy flows need their OWN disposable instance (a real sandbox: screenroom+Navidrome, a fresh
 * DB, scratch dirs); read-only flows can share one live instance. A flow whose linked test lives under a
 * `sandboxes/` dir is write-heavy by construction (that's what the sandbox harness IS); an explicit
 * opts.writeHeavyFlows (Set or array of flow ids) overrides; everything else is treated as read-only.
 */
export function classifyInstance(flow, opts = {}) {
  const wh = opts.writeHeavyFlows;
  const id = flow?.id;
  const inSet = wh && (typeof wh.has === 'function' ? wh.has(id) : Array.isArray(wh) && wh.includes(id));
  if (inSet) return 'disposable';
  if (/\/sandboxes\//.test(flow?.linked_playwright_test ?? '')) return 'disposable';
  return 'shared';
}

const PRIORITY_RANK = { critical: 0, important: 1, 'nice-to-have': 2 };

/**
 * Full-site: the REGISTRY-DRIVEN planner (Phase 2a). Input is the tracker's flows across all projects
 * (fetched by run.mjs — the planner stays pure). One run-unit per flow that HAS a linked test; a flow
 * with NO linked test is surfaced as a GAP, never a silent pass. Write-heavy flows are tagged for a
 * disposable instance, read-only for a shared one. Units are risk-ordered (critical → important → rest).
 * opts.projects filters to a subset (per-project "Verify"). Evidence persists (full-site is deliberate).
 */
export function planFullSite(flows, opts = {}) {
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const session = opts.session ?? `full-site-${Date.now()}`;
  const projectFilter = opts.projects ? new Set(opts.projects) : null;
  const inScope = (f) => !projectFilter || projectFilter.has(f.project_slug);
  const units = [];
  const gaps = [];
  for (const flow of flows ?? []) {
    if (!inScope(flow)) continue;
    if (!flow.linked_playwright_test) {
      gaps.push({ project: flow.project_slug, flowId: flow.id, title: flow.title, reason: 'no-linked-test' });
      continue;
    }
    const instance = classifyInstance(flow, opts);
    units.push({
      project: flow.project_slug,
      flowId: flow.id,
      testFile: flow.linked_playwright_test,
      instance,
      priority: flow.priority ?? 'important',
      mode: 'full-site',
      triggeredBy: opts.triggeredBy ?? 'manual',
      lastStatus: flow.test_status ?? 'not-tested',
      evidenceRoot: evidenceRootFor({
        mode: 'full-site', date,
        session: `${session}-${flow.project_slug}-${flow.id}`,
        persistRoot: opts.persistRoot, tmpRoot: opts.tmpRoot,
      }),
    });
  }
  units.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1));
  const disposable = units.filter((u) => u.instance === 'disposable').length;
  return {
    units,
    gaps,
    summary: {
      total_flows: (flows ?? []).filter(inScope).length,
      runnable: units.length,
      gaps: gaps.length,
      disposable,
      shared: units.length - disposable,
    },
  };
}
