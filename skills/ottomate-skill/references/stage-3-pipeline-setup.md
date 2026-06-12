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

## Gitea Actions workflows

`.gitea/workflows/ci.yml` — runs on every push to feature branches:
1. Setup node 22
2. `npm ci`
3. `npm run typecheck`
4. `npm run lint`
5. `npm test` (Vitest)
6. `npx playwright install --with-deps chromium`
7. `npx playwright test`
8. `npx axe-core` invocations (built into playwright tests)
9. Lost Pixel diff
10. `trivy fs --severity HIGH,CRITICAL .`

`.gitea/workflows/nightly.yml` — runs on schedule (`cron: '0 2 * * *'`):
1. Lighthouse CI on the live URL
2. k6 load test (read-only smoke)
3. Trivy + Grype + OSV-Scanner full scan
4. POST results to `/api/skill-events` with `event_type: 'misc'`

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

- All workflows green on the scaffold's main branch
- Lighthouse base score ≥80 across the four categories
- Lost Pixel baseline saved (no diffs)
- `trivy fs` returns 0 findings at HIGH+

If any fails: HARD halt. Don't progress to feature build until CI is green; debugging code-gen on top of broken CI multiplies the failure modes.
