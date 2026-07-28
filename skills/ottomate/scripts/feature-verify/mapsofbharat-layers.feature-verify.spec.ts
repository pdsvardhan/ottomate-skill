// Feature-verify P1-C/D/E (Task 3, Track B) — the reusable LAYERS, demonstrated on Maps of Bharat.
//   L1 implicit-oracle (P1-C): every indicator endpoint answers 200 + well-formed (population-wide).
//   L3 metamorphic/property (P1-D): data self-consistency over sampled indicators (fast-check) +
//      a non-constancy relation (different indicators ⇒ different data).
//   L4 mechanical-visual (P1-E, self-contained): overflow / hard-clip / axe-contrast on the real page.
// Each layer proves BOTH directions without a permanently-red suite: a must-PASS on real data AND a
// self-test that the DETECTOR FIRES on a bad input. Advisory findings (axe/clip) warn, never fake-pass.
// Base = FV_INSTANCE_URL (MoB :8610); report sink = FV_TRACKER_BASE (Ottomate :8110).

import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import fc from 'fast-check';
import {
  loadConfig, Matrix, caseEvidenceDir, saveArtifact, writeMatrix, postReport,
  assertPopulationOk, nonConstancy, checkNoHorizontalOverflow, checkNoHardClippedText, checkAxeContrast,
} from './harness';

const cfg = loadConfig();
const matrix = new Matrix();
let api: APIRequestContext;

interface Metric { id: string; name: string; levels: string[] }
interface MetricData { id: string; name: string; count: number; stats_count: number; min: number; max: number; mean: number; values: Record<string, number> }

test.beforeAll(async () => { api = await playwrightRequest.newContext(); });
test.afterAll(async () => {
  const verdict = matrix.verdict(cfg.riskPolicy);
  await postReport(api, cfg, { target_kind: 'stage-3-feature', target_id: 'feat-mapsofbharat-layers-C-D-E', matrix, verdict });
  await writeMatrix(cfg.evidenceRoot, matrix.results,
    `# feature-verify: mapsofbharat L1/L3/L4 layers (P1-C/D/E)\n\n${verdict.recommendation_overall} — ${verdict.reason}\n\n${matrix.renderTable()}\n`);
  await api.dispose();
});

async function metricList(): Promise<Metric[]> {
  const res = await api.get(`${cfg.instanceUrl}/api/metrics`);
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { metrics: Metric[] }).metrics;
}
async function metricData(id: string): Promise<MetricData> {
  const res = await api.get(`${cfg.instanceUrl}/api/metrics/${id}?level=district`);
  expect(res.ok(), `GET ${id} → ${res.status()}`).toBeTruthy();
  return (await res.json()) as MetricData;
}

// ── P1-C — L1 implicit-oracle: EVERY indicator endpoint is 200 + well-formed (+ detector fires on a bogus id) ──
test('L1 implicit-oracle: every /api/metrics/[id] 200 + well-formed over the whole population', async () => {
  const dir = await caseEvidenceDir(cfg.evidenceRoot, 'L1-implicit');
  const ids = (await metricList()).filter((m) => m.levels?.includes('district')).map((m) => m.id);
  const urls = ids.map((id) => `${cfg.instanceUrl}/api/metrics/${id}?level=district`);
  const pop = await assertPopulationOk<MetricData>(api, urls, (j) =>
    j && typeof j.count === 'number' && j.count > 0 ? { ok: true, detail: 'ok' } : { ok: false, detail: `count missing/zero (${j?.count})` });
  await saveArtifact(dir, 'population.json', JSON.stringify(pop, null, 2));
  matrix.record({ case: `all ${urls.length} indicator endpoints 200 + well-formed (count>0)`, variant: 'happy', axis: 'implicit-oracle',
    system_state: pop, outcome: pop.ok ? 'pass' : 'fail', evidence: { dir } });

  // Detector self-test (must-fire): a bogus id mixed into the population MUST be caught.
  const withBogus = await assertPopulationOk(api, [...urls.slice(0, 3), `${cfg.instanceUrl}/api/metrics/__does_not_exist__?level=district`]);
  matrix.record({ case: 'implicit-oracle detector fires on a bogus endpoint (self-test)', variant: 'error', axis: 'detector-fires',
    system_state: { fired: !withBogus.ok, detail: withBogus.detail }, outcome: !withBogus.ok ? 'pass' : 'fail', evidence: { dir } });

  expect(pop.ok, pop.detail).toBeTruthy();
  expect(withBogus.ok, 'detector should have fired on the bogus id').toBeFalsy();
});

// ── P1-D — L3 metamorphic/property: data invariant over sampled indicators + non-constancy relation ──
test('L3 metamorphic/property: data self-consistency holds over sampled indicators + non-constancy', async () => {
  const dir = await caseEvidenceDir(cfg.evidenceRoot, 'L3-metamorphic');
  const ids = (await metricList()).filter((m) => m.levels?.includes('district')).map((m) => m.id);

  // Property (no known-correct value needed): for ANY indicator the API data is self-consistent.
  let counterexample: unknown = null;
  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...ids), async (id) => {
      const d = await metricData(id);
      const ok = d.count > 0 && d.stats_count <= d.count && (d.stats_count === 0 || (d.min <= d.mean && d.mean <= d.max));
      if (!ok) counterexample = { id, count: d.count, stats_count: d.stats_count, min: d.min, mean: d.mean, max: d.max };
      return ok;
    }),
    { numRuns: 12 },
  ).catch(() => { /* fast-check rejects on falsification; counterexample already captured + shrunk */ });
  const propOk = counterexample === null;
  await saveArtifact(dir, 'property.json', JSON.stringify({ population: ids.length, sampled: 12, counterexample }, null, 2));
  matrix.record({ case: 'data self-consistency invariant holds over sampled indicators (property-based)', variant: 'edge', axis: 'property',
    system_state: { holds: propOk, counterexample }, outcome: propOk ? 'pass' : 'fail', evidence: { dir } });

  // Metamorphic non-constancy: two DIFFERENT indicators ⇒ different data; self-test that a==a is flagged.
  const [a, b] = [ids[0], ids[ids.length - 1]];
  const da = await metricData(a); const db = await metricData(b);
  const differ = nonConstancy(JSON.stringify(da.values), JSON.stringify(db.values));
  const selfFires = nonConstancy(1, 1); // identical inputs MUST be flagged (detector self-test)
  matrix.record({ case: `non-constancy: different indicators (${a} vs ${b}) yield different data`, variant: 'edge', axis: 'metamorphic',
    system_state: { differ: differ.ok, self_test_fires: !selfFires.ok }, outcome: differ.ok && !selfFires.ok ? 'pass' : 'fail', evidence: { dir } });

  expect(propOk, `property counterexample: ${JSON.stringify(counterexample)}`).toBeTruthy();
  expect(differ.ok && !selfFires.ok).toBeTruthy();
});

// ── P1-E — L4 mechanical-visual (self-contained): geometry + axe on the real atlas + detector self-test ──
test('L4 mechanical-visual: overflow/clip/contrast on the real atlas (+ overflow detector self-test)', async ({ page }) => {
  const dir = await caseEvidenceDir(cfg.evidenceRoot, 'L4-visual');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?m=livestock_buffalo&lvl=district');
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await expect(page.getByText('Buffaloes').first()).toBeVisible({ timeout: 20_000 });

  const overflow = await checkNoHorizontalOverflow(page);
  const clipped = await checkNoHardClippedText(page);
  const axe = await checkAxeContrast(page);
  await saveArtifact(dir, 'visual.json', JSON.stringify({ overflow, clipped, axe }, null, 2));
  matrix.record({ case: 'no horizontal overflow at desktop width', variant: 'happy', axis: 'visual-geometry',
    system_state: overflow, outcome: overflow.ok ? 'pass' : 'fail', evidence: { dir } });
  // hard-clip + axe contrast are real findings but advisory on a personal project (warn, never fake-pass).
  matrix.record({ case: 'no hard-clipped (silently lost) text', variant: 'error', axis: 'visual-geometry',
    system_state: clipped, outcome: clipped.ok ? 'pass' : 'warn', evidence: { dir } });
  matrix.record({ case: 'axe color-contrast', variant: 'error', axis: 'a11y-contrast',
    system_state: axe, outcome: axe.ok ? 'pass' : 'warn', evidence: { dir } });

  // Detector self-test (must-fire): inject a 5000px-wide element; the overflow detector MUST catch it.
  await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'width:5000px;height:8px'; d.textContent = 'x'; document.body.appendChild(d); });
  const injected = await checkNoHorizontalOverflow(page);
  matrix.record({ case: 'overflow detector fires on an injected 5000px element (self-test)', variant: 'error', axis: 'detector-fires',
    system_state: { fired: !injected.ok, detail: injected.detail }, outcome: !injected.ok ? 'pass' : 'fail', evidence: { dir } });

  expect(overflow.ok, overflow.detail).toBeTruthy();
  expect(injected.ok, 'overflow detector should have fired on the injected element').toBeFalsy();
});
