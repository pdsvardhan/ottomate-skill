# Task 3 · P3-C — gate-wiring + cadence + flake-control + reporting (plan, 2026-07-28, Track B)

The first Phase-3 build (highest leverage: it makes the whole verifier run automatically). Off
[the Phase-3 plan](2026-07-28-task3-PHASE3-plan.md) §P3-C and the
[implementation plan](2026-07-28-task3-IMPLEMENTATION-PLAN.md) §Cadence. Owner decision already
taken: **nightly full pass = a cron on VAULT7A** (wire the existing `postTestRun()`, which today has
no caller; pairs with app to-do #289).

## What exists to build on (verified in-tree 2026-07-28)
- `harness/report.ts` — `Matrix`, `postReport()` (→ `feature_verification_reports`), `postFlowTestRun()`
  (→ `flow_test_runs`), and **`postTestRun()` (→ `test_runs`) — defined, zero callers.**
- `run-matrix.feature-verify.spec.ts` — the data-driven runner: reads `FV_MATRIX_FILE`, drives the
  held-out assertion registry, records into `Matrix`, applies the trust record, posts the report. This
  is the canonical spec the nightly executes.
- `harness/evidence.ts` — `caseEvidenceDir()` / `saveArtifact()` / `writeMatrix()` under `FV_EVIDENCE_ROOT`
  (today ephemeral in `/tmp`).
- `playwright.feature-verify.config.ts` — `workers:1`, `retries:0`, trace/video/screenshot always on,
  `json` reporter → `${EVID}/playwright-report.json`.
- `harness/matrix.mjs` — the matrix schema/validator/loader (pure `.mjs`, `node --test`-able).
- The Ottomate project registry: `GET /api/projects` (each row has `slug`, `tags`); repos live at
  `/mnt/storage/websites/<slug>` by convention (ottomate itself at `/opt/homeserver/ottomate`).

## The change-tier spine (shared with P3-A)
Verification scales to the change; the tier is **inferred from the impacted files**, owner-overridable.

| Tier | Trigger (impacted files) | Deterministic layers | AI-judge (P3-A) |
|---|---|---|---|
| **T0** | backend / API / copy / config only | L1 implicit + L2 system-state | none |
| **T1** | one element's style (css/tokens/className) | + L4 visual, scoped to the touched area | none |
| **T2** | a new/changed component | + L4 full + L3 metamorphic | quick advisory glance |
| **T3** | a new page / route / feature / redesign | everything | full advisory pass |

## Sub-units (each: pure module + `node --test` must-fail & must-pass, same-commit register row, then verify on VAULT7A)

### P3-C1 · change-tier + impacted-app/feature selection *(pure, answer-shaped by Q2)*
- `harness/change-tier.mjs` — `inferTier(impactedFiles, {override})` → `T0|T1|T2|T3`; `layersForTier(tier)`
  → the layer set that tier runs. The classifier is path-shape based (route/page dir → T3; component file
  → T2; style/token-only → T1; api/server/config/copy → T0), **max-wins** across the changed set, owner
  override always honoured.
- `harness/impacted.mjs` — `slugOf(absPath)` (repo-path convention → slug), `impactedApps(changedFiles)`
  → the set of slugs a diff touches, `impactedMatrices(changedFiles, matrices)` → the matrices whose
  declared **`covers: [globs]`** intersect the diff. (Adds an optional `covers` array to the matrix
  schema — additive, back-compatible; a matrix without `covers` is treated as "always impacted" for its
  app so nothing silently drops.)
- `changedFilesSince(gitRef)` — the one impure call (thin `git diff --name-only` shell-out), injectable
  so the pure logic is tested without git.
- **must-pass:** a copy-only diff → T0, layers = {implicit, system-state}; a diff under
  `.../app/routes/new-page/` → T3, all layers. **must-fail:** an unknown/empty diff must NOT default to
  T0-clean — it returns `UNKNOWN`⇒ treat as T3 (fail-closed: verify the most, not the least).

### P3-C2 · reporting tail — delta-vs-previous + JSONL + action_log
- `harness/delta.mjs` — `deltaVsPrevious(current, previous)` → `{new_failures[], fixed[], still_failing[],
  new_flakes[]}` keyed by case id; pure.
- `harness/run-log.mjs` — `appendRunLog(file, summary)` writes one JSONL line per run (run id, commit,
  tier, counts, verdict, delta, evidence dir); pure (writes to an injected path).
- `harness/action-log.mjs` — a small `ActionLog` recorder (`.step(action, detail)`) a spec attaches to a
  case so `CaseResult.action_log` is populated (today left empty); demonstrated in `run-matrix`.
- **must-pass:** two runs where case X went fail→pass ⇒ delta.fixed=[X]; JSONL append leaves prior lines
  intact and adds exactly one. **must-fail:** a case present in current but absent in previous is reported
  as `new_*`, never silently dropped.

### P3-C3 · durable evidence store + flake-control
- `harness/evidence-root.mjs` — `evidenceRootFor({mode, date, session})` → the dated **persistent** dir
  on the server (`/opt/homeserver/ottomate/fv-evidence/<yyyy-mm-dd>/<mode>-<session>`), replacing the
  ephemeral `/tmp` default for scheduled runs; `pruneEvidence(root, keepDays)` retention helper (pure over
  an injected dir lister). On-commit/manual runs keep `/tmp` (throwaway).
- `playwright.feature-verify.config.ts` — keep `retries:0` as the default gate; add an opt-in
  `FV_RETRIES` (0 or 1) with a flaky-surfacing note, and document the **official Playwright Docker image**
  as the deterministic run host + **Clock API freeze** (already applied per-spec via `reducedMotion` +
  `animation:none`) + **Testcontainers** for L2 disposable-DB cases (owner-confirmed IN; provided as a
  documented pattern + a thin `harness/disposable-db.md` recipe, wired per-project when an L2 case needs a
  real DB — MoB is read-mostly so none is wired yet, stated honestly).
- **must-pass:** `evidenceRootFor` yields a dated persistent path for `mode:'nightly'` and `/tmp` for
  `mode:'commit'`; `pruneEvidence(keepDays:7)` deletes only dirs older than 7 days. **must-fail:** a
  scheduled run must never write evidence under `/tmp` (asserted).

### P3-C4 · the orchestrator + cron + `postTestRun` wiring *(the wiring; answer-shaped by Q1)*
- `run.mjs` — the CLI the cron and the on-commit hook both call:
  `MODE=nightly|commit|fix`. Nightly: for each app with matrices, set `FV_*` (instance URL from the
  project record / the slug→port manifest), `FV_EVIDENCE_ROOT` = the dated persistent dir,
  `FV_TRIGGERED_BY=schedule`, run `npx playwright test` on the runner; then post-process — read
  `matrix.json` + `playwright-report.json`, `deltaVsPrevious` against the prior JSONL, append the run log.
  Commit: `changedFilesSince(last-green)` → `impactedApps`/`impactedMatrices` → `inferTier` → run only the
  impacted app's matrices with the tier's layers, `/tmp` evidence. Fix: the feature's full BLOCK set + the
  reproduce-symptom two-phase (`FV_PHASE=pre` then `post`).
- **`postTestRun` wiring:** `run-matrix`'s `afterAll` calls `postTestRun()` **when `FV_TRIGGERED_BY==='schedule'`**
  (nightly substrate; one `test_runs` row per app, `triggered_by:'schedule'`). Gated by a pure
  `shouldPostTestRun(env)` helper so the decision is unit-tested even though the POST runs in Playwright.
- `nightly.sh` — the shell the cron invokes: `scp` the harness to `/tmp/fv` (or run in place),
  `ln -s` node_modules + browsers, `POST /api/backup`, then `node run.mjs MODE=nightly`. Installed as a
  **crontab entry on VAULT7A** at the owner's schedule (Q1).
- **must-pass (on VAULT7A):** a real `MODE=nightly` run drives MoB, writes a `test_runs` row
  (`triggered_by:'schedule'`), lands evidence under the dated persistent dir, and appends a JSONL line
  with a delta vs the previous run. **must-fail:** with the app down, the run records a fail-closed
  `test_runs` (result≠passed) rather than a silent green.

## The two reserved decisions — SETTLED by the owner 2026-07-29
1. **Cron schedule → daily 03:30 server-local.** After the media-pipeline's busy window; a fresh
   green/delta each morning. Installed as a VAULT7A crontab entry in P3-C4.
2. **Per-app impacted-file heuristic → `covers:[globs]` on each matrix** (the recommended option):
   **file→slug by repo-path convention** (`/mnt/storage/websites/<slug>/…`); **file→matrix by a
   `covers:[globs]` field** each matrix declares (a matrix without `covers` is "always impacted" for its
   app, so nothing silently drops); **tier from the *kinds* of impacted files** per the table above;
   **last-green baseline** = the commit of the most recent all-green nightly, recorded in the run log,
   else `HEAD~1..HEAD`.

## Sequencing & parallel-safety
P3-C1 → P3-C2 → P3-C3 (all pure, answer-independent except C1's field names) → **P3-C4** (the wiring +
the VAULT7A verification + the cron install). Commit each sub-unit small; `git pull --rebase` before every
push; stage files explicitly (never `git add -A` — Track A leaves untracked files in the shared tree);
edit only the feature-verifier rows in `SKILL-REGISTER.md`. Staging dir on VAULT7A: `/tmp/fv`.
