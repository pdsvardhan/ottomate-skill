import { defineConfig, devices } from '@playwright/test';

// Feature-verify Playwright config (Task 3) — the DETERMINISTIC GATE.
// Evidence is ALWAYS on; single worker + retries:0 so the gate can't flake-pass (fix flake at
// the source per §5E: freeze time/animations with the Clock API in specs, stable fonts, isolated
// dirs/seeds — NOT retries). Drives FV_INSTANCE_URL (the real running app).
//
// P3-C3 flake control (see harness/flake-control.md):
//   • run host — the official Playwright Docker image (mcr.microsoft.com/playwright:v1.60.0-jammy)
//     pins the browser+OS+font stack so pixel/geometry checks are reproducible off the dev box;
//   • time/animation — frozen per-spec (page.clock + reducedMotion + animation:none), not here;
//   • disposable deps — Testcontainers for L2 real-DB cases (owner-confirmed IN), wired per project;
//   • retries — DEFAULT 0 (a deterministic gate must not flake-pass). FV_RETRIES=1 is an opt-in for
//     an unattended nightly that would rather surface-and-quarantine a flake than fail the whole pass;
//     keep the quarantine budget < 2% and never let a retried case emit a silent green.
//
// Run:  FV_* env set (see harness/config.ts) then
//   npx playwright test -c scripts/feature-verify/playwright.feature-verify.config.ts

const EVID = process.env.FV_EVIDENCE_ROOT ?? '/tmp/feature-verify';
const baseURL = process.env.FV_INSTANCE_URL ?? 'http://127.0.0.1:8110';

export default defineConfig({
  testDir: process.env.FV_TEST_DIR ?? '.',
  testMatch: /.*\.feature-verify\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: Number(process.env.FV_RETRIES ?? 0), // 0 = the gate default; 1 = opt-in nightly flake-surfacing
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: `${EVID}/artifacts`,
  reporter: [['list'], ['json', { outputFile: `${EVID}/playwright-report.json` }]],
  use: {
    baseURL,
    trace: 'on',        // trace / video / screenshot ALWAYS on — every case carries its proof
    video: 'on',
    screenshot: 'on',
    actionTimeout: 15_000,
  },
  projects: [{ name: 'feature-verify', use: { ...devices['Desktop Chrome'] } }],
});
