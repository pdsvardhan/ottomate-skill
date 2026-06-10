# Stage 3.6 — Multi-Tier Testing (renumbered 3.5 → 3.6 post-audit)

> **POST-AUDIT AMENDMENTS (2026-04-29):** (applied; changelog archived at `_archive/references/stage-amendments.md`):
> - Tests come from AC strictly (1 spec per AC); coder authors at 3.4
> - Trivy + Grype + OSV-Scanner (NOT Snyk per Codex P1 #11)
> - Lost Pixel for visual regression
> - Tag-based test selection in Stage 4.6 mini-build (only tests touching changed files)

After every feature's verifier-approved code, run the right tier. Anti-gaslighting bedrock: tests come from acceptance criteria, not from the coder's optimism.

## Always-run (every push)

These run in `.gitea/workflows/ci.yml` set up in stage-3-pipeline-setup.

| Tier | Tool | What it asserts |
|---|---|---|
| Type | tsc --noEmit | Code is well-typed |
| Lint | eslint | No common bugs (unused vars, no-explicit-any in feature code) |
| Unit | Vitest | Pure functions / utils behave as documented |
| Component | Playwright | Each rendered component matches its acceptance criteria |
| E2E flow | Playwright | Each Doc 2 flow's steps complete end-to-end |
| Visual regression | Lost Pixel | UI hasn't drifted from baseline |
| a11y | axe-playwright | WCAG 2.1 AA on every page |

## First-time + nightly

These take longer; run nightly + on first feature push only.

| Tier | Tool | What it asserts |
|---|---|---|
| Perf | Lighthouse CI | Score ≥ project's perf budget (Doc 1) |
| Load | k6 | p95 latency under expected traffic |
| Security | Trivy + Grype + OSV-Scanner | No HIGH+ vulnerabilities (NOT Snyk per Codex P1 #11) |

## Tests come from acceptance criteria

For each feature in Doc 3:
1. Read `acceptance_criteria` (max 5 per Doc 3; one acceptance criterion → one test).
2. For UI flows: write Playwright spec walking the flow's steps; assert each `result` field.
3. For backend features: write a Vitest unit test for pure logic + a Playwright API test hitting the route + asserting the JSON shape.
4. For visual regression: capture every page in Doc 4 with each loading_state.
5. For a11y: assert no axe violations on the page or component.

The verifier's Pass D (acceptance criteria) confirms each criterion has a corresponding test that runs and passes.

## Auto-fix loop

If a test fails:
1. Coder agent attempts a fix (1st iteration). New commit on the feature branch.
2. CI re-runs. If green: pass.
3. If still failing → 2nd iteration with a different approach.
4. If still failing → 3rd iteration.
5. If 3rd iteration still fails → HARD halt; escalate to user with diff + test failure log.

If verifier's Pass B (stub detection) flagged issues at any point: bypass the auto-fix loop entirely. Stub detection means the AI is faking it; iterating won't help. Mandatory user review per R1.2.

## Test result persistence

Per-feature test status persists in `features.test_status` (drizzle column). Aggregated coverage shows in Ottomate `/coverage` view.

## Cost discipline (R13)

External tools handle their domains. Don't have Claude re-summarise test logs that the JUnit XML already structures. Read the report file, extract the failing tests, feed only those to Claude.
