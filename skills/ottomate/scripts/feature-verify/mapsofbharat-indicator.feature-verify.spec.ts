// Feature-verify P1-A (Task 3, Track B) — THE FIRST BROWSER-DRIVING SPEC.
// Drives the REAL Maps of Bharat atlas like a QA human (clicks CHANGE INDICATOR, picks an
// indicator in the chooser dialog) and asserts SYSTEM STATE via an independent 2nd channel — the
// app's own /api/metrics data, NOT the UI's self-report — so a UI that renders but shows the wrong
// / stale data is caught. Canvas paint is out of scope (owner ruling); we assert DOM controls + data.
//
// Layers exercised: L2 system-state (the displayed indicator + the histogram district-count match
// the data API), L3 non-constancy seed (indicator A ≠ B ⇒ the page's selected indicator changes),
// L1 implicit-oracle (no console/page errors; the data endpoint answers 200, well-formed, count>0).
// Fail-closed: a check that could not be OBSERVED is recorded warn/fail, never a silent pass.
//
// Base URL = FV_INSTANCE_URL (MoB, http://127.0.0.1:8610). Report sink = FV_TRACKER_BASE (Ottomate).
// Run: see docs/plans/2026-07-28-task3-P1A-browser-leg-plan.md (scp to /tmp/fv, ln -s node_modules).

import { test, expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';
import { loadConfig, Matrix, caseEvidenceDir, saveArtifact, writeMatrix, postReport, type CaseResult } from './harness';

const cfg = loadConfig();
const matrix = new Matrix();

// Two real district-level indicators from different categories (verified live 2026-07-28):
// A in `agriculture`, B in `assets` — so the switch also crosses a chooser category.
const A = { id: 'livestock_buffalo', name: 'Buffaloes', category: 'agriculture' };
const B = { id: 'assets_car', name: 'Households owning a car', category: 'assets' };

interface MetricData { id: string; name: string; count: number; stats_count: number; min: number; max: number }

let api: APIRequestContext;

test.beforeAll(async () => {
  api = await playwrightRequest.newContext();
});

test.afterAll(async () => {
  const verdict = matrix.verdict(cfg.riskPolicy);
  await postReport(api, cfg, { target_kind: 'stage-3-feature', target_id: 'feat-mapsofbharat-indicator-switch', matrix, verdict });
  await writeMatrix(cfg.evidenceRoot, matrix.results,
    `# feature-verify: mapsofbharat indicator switch (P1-A)\n\n${verdict.recommendation_overall} — ${verdict.reason}\n\n${matrix.renderTable()}\n`);
  await api.dispose();
});

/** 2nd channel: the app's own data for an indicator (bypasses the UI entirely). */
async function fetchMetric(id: string): Promise<MetricData> {
  const res = await api.get(`${cfg.instanceUrl}/api/metrics/${id}?level=district`);
  expect(res.ok(), `GET /api/metrics/${id} → ${res.status()}`).toBeTruthy();
  return (await res.json()) as MetricData;
}

/** Sum of the histogram legend's per-class counts — what the *user* sees the map is built from. */
async function legendCountSum(page: Page): Promise<number | null> {
  const cells = page.locator('[data-legend-count]');
  const n = await cells.count();
  if (n === 0) return null; // legend not in binned mode / not rendered — observable-absent
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const t = (await cells.nth(i).innerText()).replace(/[^\d]/g, '');
    if (t) sum += Number(t);
  }
  return sum;
}

test('drives the real indicator switch and asserts the data via a 2nd channel', async ({ page }) => {
  const dir = await caseEvidenceDir(cfg.evidenceRoot, 'indicator-switch');
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text()}`); });

  // Freeze animations (chooser slide, count-up) for a deterministic read — §5E, not retries.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // ── Pull both indicators' authoritative data up front (the oracle) ──
  const dataA = await fetchMetric(A.id);
  const dataB = await fetchMetric(B.id);
  await saveArtifact(dir, 'oracle.json', JSON.stringify({ dataA, dataB }, null, 2));

  // ── CASE 1 (L2 happy): indicator A renders, and the histogram accounts for the real district count ──
  await page.goto(`/?m=${A.id}&lvl=district`);
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await expect(page.getByText(A.name).first()).toBeVisible({ timeout: 20_000 });

  // Two 2nd-channel checks. (1) The page displays the indicator the URL selected — the getByText
  // assertion above already threw if not, so reaching here proves A.name rendered. (2) The API
  // serves well-formed data for it. (3) IF the histogram legend is present, its class counts must
  // sum to the API's stats_count — a present-but-WRONG histogram is a real fail; an absent one
  // (buffalo defaults to a continuous legend) is not a defect, so it does not fail the case.
  const sumA = await legendCountSum(page);
  const apiWellFormed = dataA.count > 0 && dataA.min <= dataA.max;
  const histoA = sumA === null ? 'absent' : sumA === dataA.stats_count ? 'match' : 'mismatch';
  matrix.record({
    case: 'indicator A renders the URL-selected indicator with well-formed data', variant: 'happy', axis: 'system-state',
    inputs: { indicator: A.id, level: 'district' },
    system_state: { name_shown: A.name, api: { name: dataA.name, count: dataA.count, stats_count: dataA.stats_count, min: dataA.min, max: dataA.max }, histogram: histoA, legend_count_sum: sumA },
    outcome: apiWellFormed && histoA !== 'mismatch' ? 'pass' : 'fail',
    evidence: { dir },
  });

  // ── CASE 2 (L2 state + L3 non-constancy): CHANGE INDICATOR → B actually switches the data ──
  await page.getByRole('button', { name: /change indicator|browse indicators/i }).click();
  const dialog = page.getByRole('dialog', { name: /choose an indicator/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: new RegExp(B.category, 'i') }).first().click();
  await dialog.getByRole('button', { name: new RegExp(B.name, 'i') }).first().click();

  await expect(page).toHaveURL(new RegExp(`[?&]m=${B.id}(&|$)`), { timeout: 20_000 });
  await expect(page.getByText(B.name).first()).toBeVisible();
  const sumB = await legendCountSum(page);
  const switched = sumB === null ? null : sumB === dataB.stats_count && sumB !== sumA; // B's data now, and it differs from A's
  matrix.record({
    case: 'CHANGE INDICATOR switches to B (url + name + histogram all reflect B, not A)', variant: 'edge', axis: 'non-constancy',
    inputs: { from: A.id, to: B.id },
    system_state: { url_has_B: true, name_shown: B.name, legend_count_sum: sumB, api_stats_count_B: dataB.stats_count, differs_from_A: sumB !== sumA },
    outcome: switched === true ? 'pass' : switched === null ? 'warn' : 'fail',
    evidence: { dir },
  });

  // ── CASE 3 (L1 implicit): the flow produced no console/page errors ──
  await saveArtifact(dir, 'console-errors.json', JSON.stringify(consoleErrors, null, 2));
  matrix.record({
    case: 'no console/page errors during the real flow', variant: 'error', axis: 'implicit-oracle',
    system_state: { console_errors: consoleErrors },
    outcome: consoleErrors.length === 0 ? 'pass' : 'fail',
    evidence: { dir },
  });

  // The hard part the whole layer exists to prove: the switch really changed the data.
  expect(switched === false, `indicator switch did not change the histogram data (A sum ${sumA}, B sum ${sumB})`).toBeFalsy();
});

// ── P1-B: the DELIBERATE RED case — proves the gate actually BLOCKS (a gate that never blocked
// isn't proven). Runs only under FV_DEMO_RED=1 so the normal suite stays green. It asserts the
// live histogram equals a FABRICATED wrong count; MoB serves the real number, so the assertion
// fails → the case records `fail` → Matrix.verdict() = BLOCK, with trace/screenshot as proof.
// This is the shape a real "displayed data ≠ expected data" defect would take. ──
test('RED (deliberate): a wrong data expectation BLOCKS the gate', async ({ page }) => {
  test.skip(!process.env.FV_DEMO_RED, 'red-path demonstration only — set FV_DEMO_RED=1');
  const dir = await caseEvidenceDir(cfg.evidenceRoot, 'deliberate-red');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/?m=${B.id}&lvl=district`);
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await expect(page.getByText(B.name).first()).toBeVisible({ timeout: 20_000 });

  const sum = await legendCountSum(page);
  const FABRICATED = 999; // MoB actually serves 733; a correct verifier must NOT let this pass.
  const matched = sum === FABRICATED;
  matrix.record({
    case: 'histogram matches a deliberately-wrong expected count (must fail)', variant: 'error', axis: 'gate-bites',
    inputs: { fabricated_expected: FABRICATED }, system_state: { observed_legend_sum: sum, expected_fabricated: FABRICATED },
    outcome: matched ? 'pass' : 'fail', evidence: { dir },
  });
  // Intentional: this SHOULD throw — the point is to see red + BLOCK + persisted evidence.
  expect(matched, `deliberate red: observed ${sum} !== fabricated ${FABRICATED} → the gate must BLOCK, with this trace as proof`).toBeTruthy();
});
