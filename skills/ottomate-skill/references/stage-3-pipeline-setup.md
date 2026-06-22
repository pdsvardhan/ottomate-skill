# Stage 3.2 — Pipeline Setup (CI tools)

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied (changelog archived at `_archive/references/stage-amendments.md`; tool choices + HARD-halt lines collapsed 2026-06-10 — restated in the body tables and exit checks). Operative delta:
> - Cloudflare Tunnel route check at deploy gate (per audit Missing-4)

After scaffold lands on main. Configure CI to run all the always-on checks before any feature build starts.

> **Ledger writes (2026-05-13):** the Gitea Actions workflow must **POST a `test_run` row** to Ottomate on every CI run (pass or fail). And the deploy step must **POST a `deploy_artifact` row** after successful deploy + smoke test. See `references/ledger-writes.md` for the exact workflow snippets and the `TRACKER_API_TOKEN` Gitea secret setup. Without these writes, anti-gaslight Rules 4 + 5 (regression detection, deploy-gap detection) have nothing to query.

## Tools (free / self-hosted only — R12)

| Concern | Tool | Self-hosted? |
|---|---|---|
| Type-check | tsc --noEmit | yes (npm) |
| Lint | eslint + prettier | yes (npm) |
| Unit tests | Vitest | yes (npm) |
| E2E + component | Playwright | yes (browser binaries cached) |
| a11y | axe-core via @axe-core/playwright | yes |
| Perf | Lighthouse CI | yes |
| Visual regression | **Lost Pixel** (NOT Percy SaaS) | yes |
| Load | k6 | yes |
| Security scan | **Trivy / Grype / OSV-Scanner** (NOT Snyk per Codex P1 #11) | yes |
| Runtime errors | GlitchTip | yes (deferred until Stage 5) |
| Analytics | Plausible | yes (deferred until Stage 5) |

## Gitea Actions workflows (canonical — adr-020)

**Policy (adr-020 — pre-production CI):** the fast gates (typecheck, lint, build) are **always hard**. The slow gates (vitest + Playwright) are **gated behind a `RUN_TESTS` repo variable** so pre-production pushes stay green and fast; flip `RUN_TESTS=true` (a Gitea repo variable) to turn them on, and they become hard at the Stage 3 → deploy gate for production. Playwright runs in a **prebuilt `mcr.microsoft.com/playwright` container** — never `playwright install` per run (that re-downloaded ~290 MB of Chromium every push, the root cause of the CI drift this policy fixes).

This is the **canonical `ci.yml`** every Node/Next/Vite repo gets (the WS-E rollout copies it verbatim, adjusting only the playwright image tag to match the repo's `@playwright/test` version):

```yaml
# .gitea/workflows/ci.yml — canonical Ottomate CI (adr-020)
name: ci
on:
  push:
    branches: ['**']
  pull_request:

jobs:
  quality:                      # ALWAYS hard — the fast gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit          # typecheck (works with or without a "typecheck" script) — HARD
      - run: npm run lint --if-present || echo "lint warnings (non-blocking)"  # lint = WARNING, not a hard fail (adr-020 amendment: style shouldn't red CI for a solo/no-public-users project; re-enable as hard when desired)
      - run: npm run build             # HARD

  tests:                        # GATED — vitest + Playwright; off pre-prod, hard at production
    if: ${{ vars.RUN_TESTS == 'true' }}
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.49.0-noble   # prebuilt browsers; NO per-run download
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test --if-present      # vitest (skips cleanly if no test script)
      - run: npx playwright test --if-present
```

Notes for the rollout:
- **Pin the container tag** to the repo's installed Playwright version (`npx playwright --version`), e.g. `v1.49.0-noble`. Mismatched tags fail fast.
- **Python/backend repos (e.g. `ingest`)** do NOT get this Node workflow — they get a Python variant: `quality` = `ruff check` + `mypy` (if present) + a build/import smoke; `tests` (gated) = `pytest`. Same `RUN_TESTS` gate, no Playwright container.
- A repo with no tests yet still gets the file — the `tests` job simply stays off (`RUN_TESTS` unset) and the `--if-present` guards no-op.

`.gitea/workflows/nightly.yml` (optional, only where deployed per adr-014) — runs on schedule (`cron: '0 2 * * *'`): Trivy/OSV security scan + (where configured) Lighthouse on the live URL, POSTing results to `/api/skill-events`. Do NOT scaffold nightly jobs that reference tools the repo doesn't actually have (adr-014: gates only reference deployed tools).

## Local helpers

`package.json` scripts:

```
"test": "vitest --run",
"test:e2e": "playwright test",
"test:visual": "lost-pixel",
"test:perf": "lhci autorun",
"test:a11y": "playwright test tests/a11y.spec.ts",
"sec:scan": "trivy fs ."
```

## Configuration files to add

- `playwright.config.ts` — base URL = `http://localhost:3000`, mobile + desktop projects
- `vitest.config.ts` — test environment, alias `@/*` → `./*`
- `lost-pixel.config.ts` — base URL + screenshot pages
- `lighthouserc.json` — perf + a11y + best-practices + SEO budgets
- `axe.config.ts` — WCAG 2.1 AA tags
- `.trivyignore` — empty (no exceptions yet)

## Verification before exiting Stage 3.2

- The `quality` job (typecheck + lint + build) is green on the scaffold's main branch — **HARD**.
- If `RUN_TESTS=true`, the `tests` job (vitest + Playwright) is green — **HARD at the production deploy gate**.
- Security/perf scans (Trivy/Lighthouse) only block where those tools are actually deployed (adr-014); don't hard-halt on tools the repo doesn't run.

If a HARD gate fails: halt. Don't progress to feature build on broken CI — debugging code-gen on top of broken CI multiplies the failure modes.
