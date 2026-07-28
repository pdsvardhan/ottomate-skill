# Flake control (P3-C3)

Flake is the adoption risk, not correctness (Google: 84% of red-transitions are flakes). The gate
fixes flake **at the source**, never with blind retries. Four levers:

## 1. Deterministic run host — the official Playwright Docker image
Run the nightly + any pixel/geometry-sensitive pass inside
`mcr.microsoft.com/playwright:v1.60.0-jammy` (tag matches the `@playwright/test` pin in `package.json`
and the browsers cached in `~/.cache/ms-playwright`). This pins the browser build, OS, and **fonts**,
so `toHaveScreenshot`, overflow/clip geometry, and text-measure checks reproduce off the dev box.
```bash
docker run --rm --ipc=host --network=host \
  -e FV_INSTANCE_URL -e FV_TRACKER_BASE -e FV_BEARER_TOKEN -e FV_PROJECT_SLUG \
  -e FV_EVIDENCE_ROOT -e FV_SESSION_ID -e FV_MATRIX_FILE \
  -v /tmp/fv:/work -w /work \
  mcr.microsoft.com/playwright:v1.60.0-jammy \
  npx playwright test -c playwright.feature-verify.config.ts
```
`--network=host` lets the container reach the app on `127.0.0.1:8610` and the tracker on `:8110`.
(The VAULT7A cron can also run the harness directly with the host's cached browsers — the image is the
belt-and-braces for reproducibility.)

## 2. Time + animation frozen — per spec, not global
`page.clock.install({ time })` / `page.clock.setFixedTime()` for anything time-dependent;
`emulateMedia({ reducedMotion:'reduce' })` + an injected `*{animation:none!important;transition:none!important}`
before the first assertion (the runner's mob driver already does this). Freeze **in the spec** so each
case declares its own clock — a global freeze hides which cases actually depend on time.

## 3. Disposable real dependencies — Testcontainers (owner-confirmed IN)
For an L2 case that needs a real database/queue rather than the live one, spin a throwaway container so
the assertion runs against real-but-isolated state and tears down after:
```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
const pg = await new PostgreSqlContainer('postgres:16-alpine').start();
// point the app-under-test's disposable instance at pg.getConnectionUri(); assert via ITS api (ONE DOOR)
await pg.stop();
```
Read the disposable instance's state **through its own API**, never a second DB client (adr-018).
Maps of Bharat is read-mostly (indicator → stats), so no L2 disposable DB is wired for it yet — stated
honestly; the pattern is here for the first write-heavy feature (e.g. the music-upload flow).

**Built + demonstrated (2026-07-29):** `harness/disposable-db.mjs` — `withDisposablePostgres(fn)` (starts a
throwaway Postgres, hands `fn` its connection, always tears down) + `disposableDbEnv(conn)` (maps the
connection to the app-under-test's env). Proven live on VAULT7A (`disposable-db.demo.mjs`): a Telugu +
emoji title round-tripped byte-identical through a REAL throwaway Postgres, container torn down — the L2
disposable-dependency mechanism is ready to back a write-heavy feature's system-state check. Deps
(`@testcontainers/postgresql` + `pg`) are in `package.json`; the run host needs Docker.

## 4. Retries — 0 by default, opt-in surfacing for the nightly
`retries:0` is the gate default: a deterministic gate must not flake-pass. `FV_RETRIES=1` is an opt-in
for the **unattended nightly** that would rather surface-and-quarantine a flake than fail the whole
pass — but keep the quarantine budget **< 2%**, tag quarantined cases, and never let a retried case
emit a silent green (a case that only passes on retry is recorded as a flake in the run-log, not a pass).
Flakes are surfaced by `flakyCases()` (`harness/run-log.mjs`) and moved out of the regression bucket by
`deltaVsPrevious({ knownFlaky })` (`harness/delta.mjs`).
