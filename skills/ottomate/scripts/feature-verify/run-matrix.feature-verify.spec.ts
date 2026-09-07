// P2-A + P2-B: the DATA-DRIVEN runner. Reads a declarative matrix file (FV_MATRIX_FILE), drives each
// case by invoking the held-out assertion registry the matrix REFERENCES BY NAME (the verifier owns the
// assertion logic — the matrix cannot inject it), records into Matrix, then P2-B: assesses independence
// trust + tamper and downgrades an untrustworthy run to advisory before posting. Proves the file→runner→
// verdict path reproduces P1-A's APPROVE. See docs/plans/2026-07-28-task3-P2A/P2B-*-design.md.
//
// 2026-09-07 (#717): this file is GENERIC. A project's oracles live in its own repo at
// tests/e2e/feature-verify/oracles/index.ts and are loaded by harness/project-oracles.ts; only the
// reproduce-symptom demo oracle is built in. screenroom's 350 `sr.*` oracles moved there unchanged.

import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';
import { loadConfig, Matrix, postReport, postFlowTestRun, flowStatusFor, postTestRun, buildReportBody, caseEvidenceDir, writeMatrix } from './harness';
import { loadMatrix } from './harness/matrix.mjs';
import { resolveBudget, deadlineFrom, isHarnessAbort, abortReasonFrom, loadBudgets, notRunCell } from './harness/budget.mjs';
import { shouldPostTestRun } from './harness/orchestrate.mjs';
import { assessTrust, applyTrust, registryIsHeldOut } from './harness/trust-record.mjs';
import { assertUntampered, lockedStateBase } from './harness/tamper-guard.mjs';
import { symptomVerdict } from './harness/reproduce-symptom.mjs';
import { ActionLog } from './harness/action-log.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadProjectOracles, type Check, type OracleRegistry, type ProjectOracles } from './harness/project-oracles';

const cfg = loadConfig();
const matrix = new Matrix();
/** The per-matrix wall-clock budgets, read from `budgets.json` beside the matrix (iter-161). */
let BUDGETS: Record<string, number> = {};
const MATRIX_FILE = process.env.FV_MATRIX_FILE as string;
let api: APIRequestContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let m: any;


/** The oracle registry the matrix resolves names against: built-ins + the project's own module. */
let REGISTRY: OracleRegistry = {};
let hooks: ProjectOracles = { REGISTRY: {} };

/** Built-in oracles every project gets: the reproduce-symptom demo control. */
const BUILTIN: OracleRegistry = {
  // Reproduce-symptom demo control: the app has no real bug, so the "break" is a labelled flag
  // (FV_SIMULATE_BROKEN=1) — RED in the pre-fix phase, GREEN post-fix. Proves the two-phase orchestration.
  'demo.controllable-symptom': async () => ({
    ok: process.env.FV_SIMULATE_BROKEN !== '1',
    detail: process.env.FV_SIMULATE_BROKEN === '1' ? 'simulated broken (RED) — the pre-fix state' : 'working (GREEN) — the post-fix state',
  }),
};

const PHASE = process.env.FV_PHASE ?? 'both';
const STORE = process.env.FV_SYMPTOM_STORE ?? '/tmp/fv/symptom-baselines';

test.beforeAll(async () => {
  // #717: the project's held-out oracles come from its own repo; the factory gets cfg + Matrix now, and
  // the API context / loaded matrix through setters once they exist (the moved code's own `api` / `m`).
  hooks = await loadProjectOracles({ cfg, matrix, harness: { ActionLog, expect } });
  api = await playwrightRequest.newContext({ timeout: 120_000, extraHTTPHeaders: hooks.ownerHeaders ?? {} });
  hooks.setApi?.(api);
  await hooks.beforeAll?.(api);
  m = await loadMatrix(MATRIX_FILE);
  hooks.setMatrix?.(m);
  BUDGETS = await loadBudgets(MATRIX_FILE);
  REGISTRY = { ...BUILTIN, ...hooks.REGISTRY };
});

/** FV_TRIGGERED_BY → the test_runs `triggered_by` enum, defaulting to 'manual'. */
const TRIGGER_BY: Record<string, 'push' | 'schedule' | 'manual' | 'iteration'> = {
  push: 'push', schedule: 'schedule', manual: 'manual', iteration: 'iteration',
};

test.afterAll(async () => {
  let verdict = matrix.verdict(cfg.riskPolicy);

  /* P2-B independence trust. The tamper tripwire was a PERMANENT NO-OP until 2026-08-26:
   * `FV_FEATURE_COMMITS` was read on this line and set at ZERO call sites, so
   * tamper-guard short-circuited to `untampered:true` ("nothing to check") on every run.
   * Proof it mattered: commit da79d59 edited all six protected matrices and the guard
   * reported no tampering. The entry points (run.mjs · nightly.sh · deploy-gate.mjs) now
   * compute and pass the range; the guard resolves it, ALSO inspects the working tree
   * (an uncommitted matrix edit is the likeliest tamper and `git show` cannot see one),
   * and returns status:'unknown' — which is NOT untampered — when it can determine
   * neither. */
  /* THE FILE'S OWN LOCK OUTRANKS THE ENVIRONMENT.
   * FV_FEATURE_COMMIT_RANGE / FV_FEATURE_COMMIT_BASE are how a caller says which commits to
   * compare — and a caller who sets them to the head sha makes every range empty, which read as
   * clean and cleared a genuinely tampered matrix. Whether a protected file was edited after
   * review is a property of the FILE, so when the matrix declares a lock we resolve the base
   * ourselves and ignore what we were handed. The override still serves matrices with no lock,
   * which is the case it was written for. */
  const repoRootForTamper = process.env.FV_PROJECT_ROOT || process.cwd();
  let rangeForTamper = process.env.FV_FEATURE_COMMIT_RANGE || null;
  let rangeSource = rangeForTamper ? 'FV_FEATURE_COMMIT_RANGE' : 'none';
  if (m.review?.locked_at) {
    const { base: lockBase } = await lockedStateBase({ repoRoot: repoRootForTamper, matrixPath: MATRIX_FILE });
    if (lockBase) {
      const own = `${lockBase}..HEAD`;
      if (rangeForTamper && rangeForTamper !== own) {
        console.warn(`[fv] ignoring supplied range ${rangeForTamper}: this matrix declares a lock, so its own recorded lock (${own}) decides what counts as post-review.`);
      }
      rangeForTamper = own;
      rangeSource = 'the matrix own recorded lock';
    }
  }

  const tamper = await assertUntampered({
    repoRoot: repoRootForTamper,
    featureCommits: (process.env.FV_FEATURE_COMMITS ?? '').split(/[\s,]+/).filter(Boolean),
    commitRange: rangeForTamper,
    protectedPaths: [MATRIX_FILE],
  });
  (tamper as Record<string, unknown>).range_source = rangeSource;
  const trust = assessTrust({
    claim_blind: m.authored?.blind_to_diff === true,
    // B2: was a hardcoded `true`. Now computed — a matrix may NAME an assertion, never carry
    // one. Recorded with `structural` provenance so nobody reads it as a measurement.
    held_out: registryIsHeldOut(m),
    owner_reviewed: m.review?.owner_locked === true,
    // 'unknown' is not 'untampered' — and neither is a comparison of ZERO commits. A
    // vacuous range (the lock IS the head) yields a defensible verdict that establishes
    // nothing, so it must not satisfy the one dimension whose provenance is 'measured'.
    untampered: tamper.untampered === true && tamper.vacuous !== true,
    pre_build_authored: !!m.authored?.at_commit,
  });
  verdict = applyTrust(verdict, trust);

  /* WHERE THE REPORT IS FILED.
   * target_id is the REGISTRY FLOW id when the matrix names one (owner ruling,
   * 2026-08-11): the deploy gate resolves per (feature x linked flow) and matches on the
   * flow, so posting m.feature put the verdict somewhere the gate never looks — 12 of
   * screenroom's 16 rows were invisible that way.
   * A PAGE matrix names no flow. The API refuses a non-flow target_id for
   * target_kind='stage-3-feature' whenever the project's verify_gate is armed
   * (screenroom's is 'block'), so filing one that way threw the entire report away with
   * a 422 — which is how iter-156's home run came to post NOTHING. A page matrix is
   * filed as the stage-4 iteration item it actually is; the gate correctly does not
   * count that as flow approval, and nothing is lost from the ledger. */
  const flowId: string | null =
    typeof m.flow_id === 'string' && m.flow_id.trim() ? m.flow_id.trim() : null;
  const reportArgs = {
    target_kind: (flowId ? 'stage-3-feature' : 'stage-4-iteration-item') as 'stage-3-feature' | 'stage-4-iteration-item',
    target_id: flowId ?? m.feature,
    matrix,
    verdict,
    full_report: { trust, tamper },
  };

  /* The per-critical-flow mirror the Stage-3 deploy gate actually reads. `postFlowTestRun`
   * existed but was referenced only from the README — the flow_test_runs mirror was
   * unimplemented, so per-flow pass/fail never reached the ledger. Status is derived from
   * the (already fail-closed) verdict rather than from raw counts, so a skipped case or a
   * trust downgrade lands as 'not-tested', never as 'passing'. */
  const flowStatus = flowStatusFor(verdict);
  const flowNotes = `feature-verify ${m.feature} @ ${cfg.commitSha ?? 'unknown-sha'} — ${verdict.reason}`;
  const triggeredBy = shouldPostTestRun(process.env)
    ? 'schedule'
    : (TRIGGER_BY[process.env.FV_TRIGGERED_BY ?? ''] ?? 'manual');

  await writeMatrix(cfg.evidenceRoot, matrix.results,
    `# feature-verify: ${m.feature} (P2-A runner)\n\n${verdict.recommendation_overall} — ${verdict.reason}\n\ntrust: ${JSON.stringify(trust)}\n\ntamper: ${JSON.stringify(tamper)}\n\n${matrix.renderTable()}\n`);

  // P3-A hook (a): FV_NO_POST is the INTERACTIVE (skill-session) path — the runner produces the matrix +
  // evidence but does NOT post; the skill then runs the judge on the screenshots and posts the COMPLETE
  // report (with judge_verdict merged) via post-report.mjs. The nightly path (FV_NO_POST unset) posts here
  // as before — the judge needs a Claude sub-agent, which no nightly cron has, so it never runs unattended.
  if (process.env.FV_NO_POST === '1') {
    await fs.writeFile(path.join(cfg.evidenceRoot, 'report-payload.json'), JSON.stringify(buildReportBody(cfg, reportArgs), null, 2));
    // The deferred path posts nothing itself, so it must hand post-report.mjs everything
    // the immediate path would have written. Without these two files the interactive path
    // silently skipped the flow mirror and the test_runs row entirely.
    await fs.writeFile(path.join(cfg.evidenceRoot, 'flow-mirror.json'),
      JSON.stringify(flowId ? { flow_id: flowId, status: flowStatus, notes: flowNotes }
                            : { flow_id: null, status: flowStatus, notes: flowNotes, skipped: `matrix "${m.feature}" names no flow_id — nothing to mirror` }, null, 2));
    // Field names are the API's (passed/failed/skipped), not Matrix.counts()'s (pass/fail/warn) —
    // spreading counts() straight in would drop the headline numbers on the floor: the zod schema
    // ignores unknown keys and stores nulls for the ones it wanted.
    const dc = matrix.counts();
    await fs.writeFile(path.join(cfg.evidenceRoot, 'test-run-payload.json'), JSON.stringify({
      project_slug: cfg.projectSlug,
      commit_sha: cfg.commitSha ?? 'unknown-sha',
      result: dc.fail > 0 ? 'failed' : dc.skipped > 0 ? 'partial' : 'passed',
      total: dc.total, passed: dc.pass, failed: dc.fail, skipped: dc.skipped,
      per_test_results: matrix.results,
      triggered_by: triggeredBy,
      notes: `${m.feature} — ${triggeredBy}`,
    }, null, 2));
  } else {
    await postReport(api, cfg, reportArgs);
    if (flowId) await postFlowTestRun(api, cfg, flowId, flowStatus, flowNotes);
    // P3-C4 / anti-gaslight Rule 4: EVERY run leaves a test_runs row, not only the
    // scheduled cadence. iter-156 ran the home matrix and left zero rows, so from the
    // ledger's side that run never happened. shouldPostTestRun() still identifies the
    // nightly cadence — it now picks the trigger, not whether anything is recorded at all.
    await postTestRun(api, cfg, { matrix, commit_sha: cfg.commitSha ?? 'unknown-sha', triggered_by: triggeredBy, notes: `${m.feature} — ${triggeredBy}` });
  }
  await api.dispose();

  /* Fail-closed EXIT. applyTrust() already downgrades the posted verdict, but the process
   * still exited 0 — so a tampered or untamper-unknowable run read as green to anything
   * watching the exit code. It does not any more. Posting happens first, so the downgrade
   * and its reason are on the record before the run goes red. */
  if (!trust.trustworthy) {
    throw new Error(
      `feature-verify run is NOT TRUSTWORTHY — ${trust.warnings.join('; ')}. ` +
      `tamper: status=${tamper.status} action=${tamper.action} — ${tamper.detail}`,
    );
  }
});

/** The number of MATRIX CELLS this run is REQUIRED to record: one per oracle, or one per
 *  reproduce-symptom case. A case that records nothing is a hole in the matrix, and a hole
 *  used to read as "nothing failed" — so the count is asserted, never assumed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expectedCells(cases: any[]): number {
  return (cases ?? []).reduce((n, c) => n + (c.reproduce_symptom ? 1 : (c.oracles ?? []).length), 0);
}

test('run the declarative matrix (data-driven)', async ({ page }) => {
  /* iter-161 item 1088 — THE MATRIX CARRIES ITS OWN CLOCK.
   *
   * ONE Playwright test drives a WHOLE matrix, and the config gave every matrix 60 seconds.
   * flow-release-pick needs 5.7 MINUTES: `sr.scout.sweep-failure-shows-an-error-state` waits
   * `timeout_ms + 20s` = 80 seconds by itself, because what it verifies is that a hung upstream
   * eventually renders an error instead of a silent empty table. The config comment promised
   * "heavy matrices opt into a bigger budget" via FV_TIMEOUT, and FV_TIMEOUT had ZERO setters in
   * the whole tree. So six of the eleven flow matrices died partway on EVERY run, and the
   * remainder was recorded as failures — see the not-run branch below.
   *
   * `test.setTimeout()` here rather than in the config means run.mjs, nightly.sh and
   * deploy-gate.mjs all inherit the right budget without knowing this exists.
   */
  const { ms: budgetMs, source: budgetSource } = resolveBudget({
    matrixFile: MATRIX_FILE, budgets: BUDGETS, envTimeout: process.env.FV_TIMEOUT,
  });
  if (budgetMs > 0) test.setTimeout(budgetMs);
  const deadline = deadlineFrom(budgetMs);
  let aborted: string | null = null;
  console.log(`[fv] matrix ${m.feature}: ${expectedCells(m.cases)} cell(s), budget ${budgetMs}ms (${budgetSource})`);

  /* PLAN J — sweep at the START, not only in a finally a killed run never reaches.
   * The default request-movie path intercepts and creates nothing, but the opt-in
   * real-grab case (FV_ALLOW_REAL_GRAB) records the film it is about to add; if that
   * run was killed mid-flight its row + queue item survive, and this reclaims them
   * before a single new case fires. */
  if ((m.flow_id ?? m.feature) === 'flow-request-movie') {
    const swept = await (hooks.sweeps?.['real-grab']?.(api) ?? Promise.resolve([] as string[]));
    console.log(`[fv] plan-J start-sweep: ${swept.length ? `reclaimed real-grab leftovers ${swept.join(', ')}` : 'no real-grab leftovers to reclaim'}`);
  }
  /* PLAN J-YT — same start-sweep for the opt-in real YouTube download. A killed
   * FV_ALLOW_REAL_YT run leaves the file on disk + a job record + a Jellyfin scan;
   * this reclaims all three (delete file, re-scan, drop record) before any case fires. */
  if ((m.flow_id ?? m.feature) === 'flow-youtube-channel-pick') {
    const swept = await (hooks.sweeps?.['real-yt']?.(api) ?? Promise.resolve([] as string[]));
    console.log(`[fv] plan-J-YT start-sweep: ${swept.length ? `reclaimed real-yt leftovers ${swept.join(', ')}` : 'no real-yt leftovers to reclaim'}`);
  }

  for (const c of m.cases) {
    const dir = await caseEvidenceDir(cfg.evidenceRoot, c.id);

    // P2-B reproduce-symptom (two-phase): RED pre-fix → GREEN post-fix + PASS_TO_PASS (SWE-bench). The
    // pre-fix RED is stored so the post-fix run can prove the assertion actually caught the bug.
    if (c.reproduce_symptom) {
      const fn = c.symptom_assert ? REGISTRY[c.symptom_assert] : undefined;
      const storeFile = path.join(STORE, `${m.feature}-${c.id}`.replace(/[^\w.-]/g, '_') + '.json');
      if (!fn) { matrix.record({ case: `${c.id}: ${c.symptom_assert}`, outcome: 'skipped', system_state: { note: 'no registered symptom assertion' }, evidence: { dir } }); continue; }
      if (PHASE === 'pre') {
        const r = await fn(page, api, c.params ?? {});
        const preFixRed = !r.ok;
        await fs.mkdir(STORE, { recursive: true });
        await fs.writeFile(storeFile, JSON.stringify({ preFixRed, detail: r.detail }));
        matrix.record({ case: `${c.id}: symptom reproduced pre-fix`, variant: 'reproduce-symptom', axis: 'FAIL_TO_PASS', system_state: { preFixRed, detail: r.detail }, outcome: preFixRed ? 'pass' : 'warn', evidence: { dir } });
      } else if (PHASE === 'post') {
        let preFixRed = false;
        try { preFixRed = JSON.parse(await fs.readFile(storeFile, 'utf8')).preFixRed; } catch { /* no baseline recorded */ }
        const r = await fn(page, api, c.params ?? {});
        const passToPass: boolean[] = [];
        for (const ref of c.pass_to_pass ?? []) {
          const pc = m.cases.find((x: { id: string }) => x.id === ref);
          const pf = pc?.oracles?.[0]?.assert ? REGISTRY[pc.oracles[0].assert] : undefined;
          passToPass.push(pf ? (await pf(page, api, pc.params ?? {})).ok : false);
        }
        const v = symptomVerdict({ preFixRed, postFixGreen: r.ok, passToPass });
        matrix.record({ case: `${c.id}: reproduce-symptom (RED→GREEN)`, variant: 'reproduce-symptom', axis: 'FAIL_TO_PASS+PASS_TO_PASS', system_state: { preFixRed, postFixGreen: r.ok, passToPass, verdict: v }, outcome: v.outcome, evidence: { dir } });
      } else {
        // FV_PHASE unset (the 'both' default) ran NEITHER branch and recorded NOTHING, so a
        // matrix made only of reproduce-symptom cases produced an EMPTY result set — which the
        // old `fail === 0` assertion read as green. An unrun phase is UNMEASURED, not passed.
        matrix.record({
          case: `${c.id}: ${c.symptom_assert}`, variant: 'reproduce-symptom', outcome: 'skipped',
          system_state: { note: `reproduce-symptom needs FV_PHASE=pre or FV_PHASE=post; FV_PHASE="${PHASE}" ran neither` },
          evidence: { dir },
        });
      }
      continue;
    }

    for (const o of c.oracles) {
      /* iter-161 item 1089 — A CASE THAT NEVER RAN IS NOT A CASE THAT FAILED.
       * Once the budget is spent or the page has been torn down, nothing below can produce a
       * measurement, so stop pretending to try. Recorded as 'skipped' with `not_run`, which
       * keeps every fail-closed refusal intact (the runner asserts skipped:0 for green,
       * verdictFor maps any skip to ITERATE, flowStatusFor mirrors 'not-tested') while the
       * LABEL finally says what happened. */
      if (aborted || Date.now() > deadline || page.isClosed()) {
        aborted = aborted ?? (page.isClosed() ? 'the page was torn down' : `the matrix budget of ${budgetMs}ms ran out`);
        matrix.record(notRunCell({ caseId: c.id, oracle: o.assert, layer: o.layer, variant: c.path, reason: aborted, dir }));
        continue;
      }
      const fn = o.assert ? REGISTRY[o.assert] : undefined;
      if (!fn) { // fail-closed: an unknown assertion is UNMEASURED, never a pass
        matrix.record({ case: `${c.id}: ${o.assert ?? o.layer}`, variant: c.path, axis: o.layer, outcome: 'skipped', system_state: { note: `no registered assertion "${o.assert}"` }, evidence: { dir } });
        continue;
      }
      // fail-closed: a driver that THROWS (app down, selector gone, timeout) is a recorded FAIL, never
      // an un-recorded case that would leave the matrix empty and read as "all 0 passed" (P3-C4).
      let r: Check;
      try {
        r = await fn(page, api, c.params ?? {});
      } catch (err) {
        const msg = String((err as Error)?.message ?? err);
        /* iter-161 item 1089. An INFRASTRUCTURE abort is not an oracle failure. When the shared
         * clock fired, Playwright tore the page down and every remaining case threw
         * "Target page, context or browser has been closed" — recorded here as `fail`, and
         * indistinguishable in the report from a real defect. That is precisely how seven
         * phantom defects in flow-release-pick and two in flow-music-upload reached the backlog
         * as "two genuine defects" and "flaky, not fixed" (to-do #686).
         *
         * `isHarnessAbort` is deliberately narrow: an ORACLE'S OWN timeout
         * (`locator.waitFor: Timeout 25000ms exceeded`) stays a FAIL, because the app really did
         * not do the thing. Widening it would launder real defects into "never ran". */
        if (isHarnessAbort(msg)) {
          aborted = aborted ?? abortReasonFrom(msg);
          matrix.record(notRunCell({ caseId: c.id, oracle: o.assert, layer: o.layer, variant: c.path, reason: aborted, dir, error: msg }));
          continue;
        }
        matrix.record({ case: `${c.id}: ${o.assert}`, variant: c.path, axis: o.layer, system_state: { error: msg }, outcome: 'fail', evidence: { dir } });
        continue;
      }
      matrix.record({ case: `${c.id}: ${o.assert}`, variant: c.path, axis: o.layer, system_state: r.observed ?? r, action_log: r.action_log, outcome: r.ok ? 'pass' : 'fail', evidence: { dir } });
    }
  }

  /* ── WHAT GREEN MEANS ──────────────────────────────────────────────────────────────
   * The only assertion here was `expect(counts().fail).toBe(0)`. Skipped cases are not
   * fails, so a matrix whose oracles are ALL unimplemented recorded 15/15 SKIPPED and
   * exited 0 — page-find is in exactly that state right now, as are four of its
   * siblings. report.ts's verdict mapping was already fail-closed about this (skipped ⇒
   * ITERATE, never APPROVE); nothing carried that refusal into the process exit code.
   *
   * These three assertions do. They are written to STATE THEIR COUNTS so a future reader
   * can see what green means without re-deriving it: every declared cell recorded, every
   * recorded cell a pass, and the fail-closed verdict itself APPROVE.
   */
  const counts = matrix.counts();
  const declared = expectedCells(m.cases);
  const v = matrix.verdict(cfg.riskPolicy);

  // (1) A matrix with no cells cannot pass. `{total:0, fail:0}` satisfies every "nothing
  //     failed" test ever written, and means nothing was verified.
  expect(declared, `matrix ${m.feature} declares no oracles — an empty matrix is not a pass`).toBeGreaterThan(0);

  // (2) Every declared cell must have produced a row. A case that silently records nothing
  //     (an unrun phase, an early `continue`) cannot be counted as passing.
  expect(
    { recorded: counts.total, declared },
    `matrix ${m.feature}: every declared oracle must record a matrix cell`,
  ).toEqual({ recorded: declared, declared });

  // (3) Green = every case MEASURED and PASSED. Skipped/warn are unmeasured, not passed.
  expect(
    { pass: counts.pass, fail: counts.fail, warn: counts.warn, skipped: counts.skipped, total: counts.total, verdict: v.recommendation_overall },
    `matrix ${m.feature}: ${v.reason}`,
  ).toEqual({ pass: declared, fail: 0, warn: 0, skipped: 0, total: declared, verdict: 'APPROVE' });
});
