// P2-A + P2-B: the DATA-DRIVEN runner. Reads a declarative matrix file (FV_MATRIX_FILE), drives each
// case by invoking the held-out assertion registry the matrix REFERENCES BY NAME (the verifier owns the
// assertion logic — the matrix cannot inject it), records into Matrix, then P2-B: assesses independence
// trust + tamper and downgrades an untrustworthy run to advisory before posting. Proves the file→runner→
// verdict path reproduces P1-A's APPROVE. See docs/plans/2026-07-28-task3-P2A/P2B-*-design.md.

import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';
import { loadConfig, Matrix, postReport, postTestRun, caseEvidenceDir, writeMatrix } from './harness';
import { loadMatrix } from './harness/matrix.mjs';
import { shouldPostTestRun } from './harness/orchestrate.mjs';
import { assessTrust, applyTrust } from './harness/trust-record.mjs';
import { assertUntampered } from './harness/tamper-guard.mjs';
import { symptomVerdict } from './harness/reproduce-symptom.mjs';
import { ActionLog } from './harness/action-log.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const cfg = loadConfig();
const matrix = new Matrix();
const MATRIX_FILE = process.env.FV_MATRIX_FILE as string;
let api: APIRequestContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let m: any;

type Check = { ok: boolean; detail: string; observed?: unknown; action_log?: unknown };
// The held-out assertion REGISTRY — the verifier OWNS these; the matrix references them by NAME only,
// so a project's coder cannot rewrite the assertion. Feature drivers live here, in the plugin.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, (page: Page, api: APIRequestContext, params: any) => Promise<Check>> = {
  'mob.indicator-switch-verified': async (page, api, params) => {
    const log = new ActionLog();
    const A = params.from, B = params.to;
    const fetchM = async (id: string) => (await (await api.get(`${cfg.instanceUrl}/api/metrics/${id}?level=district`)).json()) as { name: string; stats_count: number };
    const dA = await fetchM(A); const dB = await fetchM(B);
    const legendSum = async () => {
      const c = page.locator('[data-legend-count]'); const n = await c.count();
      if (!n) return null; let s = 0;
      for (let i = 0; i < n; i++) { const t = (await c.nth(i).innerText()).replace(/[^\d]/g, ''); if (t) s += Number(t); }
      return s;
    };
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (mm) => { if (mm.type() === 'error') errs.push(mm.text()); });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    log.step('goto', { url: `/?m=${A}&lvl=district` });
    await page.goto(`/?m=${A}&lvl=district`);
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await expect(page.getByText(dA.name).first()).toBeVisible({ timeout: 20_000 });
    log.step('click', { role: 'button', name: 'change indicator' });
    await page.getByRole('button', { name: /change indicator|browse indicators/i }).click();
    const dlg = page.getByRole('dialog', { name: /choose an indicator/i });
    await expect(dlg).toBeVisible();
    log.step('pick-category', { category: params.category });
    await dlg.getByRole('button', { name: new RegExp(params.category, 'i') }).first().click();
    log.step('pick-indicator', { indicator: dB.name });
    await dlg.getByRole('button', { name: new RegExp(dB.name, 'i') }).first().click();
    await expect(page).toHaveURL(new RegExp(`[?&]m=${B}(&|$)`), { timeout: 20_000 });
    await expect(page.getByText(dB.name).first()).toBeVisible();
    const sumB = await legendSum();
    log.step('assert-legend-sum', { sumB, stats_count: dB.stats_count });
    const ok = sumB === dB.stats_count && errs.length === 0;
    return { ok, detail: `switch ${A}→${B}: legend sum ${sumB} vs api stats_count ${dB.stats_count}; console errors ${errs.length}`, observed: { sumB, stats_count: dB.stats_count, errors: errs }, action_log: log.toJSON() };
  },
  // Reproduce-symptom demo control: the app has no real bug, so the "break" is a labelled flag
  // (FV_SIMULATE_BROKEN=1) — RED in the pre-fix phase, GREEN post-fix. Proves the two-phase orchestration.
  'demo.controllable-symptom': async () => ({
    ok: process.env.FV_SIMULATE_BROKEN !== '1',
    detail: process.env.FV_SIMULATE_BROKEN === '1' ? 'simulated broken (RED) — the pre-fix state' : 'working (GREEN) — the post-fix state',
  }),
};

const PHASE = process.env.FV_PHASE ?? 'both';
const STORE = process.env.FV_SYMPTOM_STORE ?? '/tmp/fv/symptom-baselines';

test.beforeAll(async () => { api = await playwrightRequest.newContext(); m = await loadMatrix(MATRIX_FILE); });

test.afterAll(async () => {
  let verdict = matrix.verdict(cfg.riskPolicy);
  // P2-B: independence trust — an untrustworthy run can never be a gating APPROVE.
  const tamper = await assertUntampered({
    repoRoot: process.env.FV_PROJECT_ROOT ?? '.',
    featureCommits: (process.env.FV_FEATURE_COMMITS ?? '').split(',').filter(Boolean),
    protectedPaths: [MATRIX_FILE],
  });
  const trust = assessTrust({
    claim_blind: m.authored?.blind_to_diff === true,
    held_out: true, // the assertion registry lives in the plugin, not the project
    owner_reviewed: m.review?.owner_locked === true,
    untampered: tamper.untampered,
    pre_build_authored: !!m.authored?.at_commit,
  });
  verdict = applyTrust(verdict, trust);
  await postReport(api, cfg, { target_kind: 'stage-3-feature', target_id: m.feature, matrix, verdict, full_report: { trust, tamper } });
  await writeMatrix(cfg.evidenceRoot, matrix.results,
    `# feature-verify: ${m.feature} (P2-A runner)\n\n${verdict.recommendation_overall} — ${verdict.reason}\n\ntrust: ${JSON.stringify(trust)}\n\n${matrix.renderTable()}\n`);
  // P3-C4: the nightly substrate — one test_runs row per app on the scheduled cadence (fail-closed:
  // result derives from the matrix counts, not any coder-touchable exit code). No-op off schedule.
  if (shouldPostTestRun(process.env)) {
    await postTestRun(api, cfg, { matrix, commit_sha: cfg.commitSha ?? 'unknown', triggered_by: 'schedule', notes: `${m.feature} — nightly` });
  }
  await api.dispose();
});

test('run the declarative matrix (data-driven)', async ({ page }) => {
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
      }
      continue;
    }

    for (const o of c.oracles) {
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
        matrix.record({ case: `${c.id}: ${o.assert}`, variant: c.path, axis: o.layer, system_state: { error: String((err as Error)?.message ?? err) }, outcome: 'fail', evidence: { dir } });
        continue;
      }
      matrix.record({ case: `${c.id}: ${o.assert}`, variant: c.path, axis: o.layer, system_state: r.observed ?? r, action_log: r.action_log, outcome: r.ok ? 'pass' : 'fail', evidence: { dir } });
    }
  }
  expect(matrix.counts().fail, 'no case should fail on the working feature').toBe(0);
});
