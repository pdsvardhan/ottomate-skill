# Task 3 — Feature Verifier: PROPER-TEST RECIPE (for a fresh session, 2026-07-29)

**Read this first if you're here to test the feature verifier.** Everything below is built, unit-tested,
and dogfooded live on Maps of Bharat; this doc is how to run a **proper end-to-end test** from a clean
session and confirm it for yourself. Authority is `../../SKILL-REGISTER.md` (the "Feature verifier" row);
architecture is `2026-07-28-task3-IMPLEMENTATION-PLAN.md`; per-unit plans are `2026-07-28-task3-P3{C,A}-*`.

## State in one paragraph
Phases 1–3 are complete. The deterministic gate (L1 implicit · L2 system-state · L3 metamorphic ·
L4 mechanical-visual) drives the **real** MoB app in Chromium and blocks/approves fail-closed; the
independence machinery (claim-blind case-matrix generator · held-out assertion registry · trust record +
tamper tripwire · reproduce-symptom RED→GREEN) is built; it **runs automatically** (VAULT7A nightly cron
at `30 2`, change-tier-scaled, delta/JSONL reporting, durable dated evidence); and the advisory layers
(AI-visual-judge + trajectory monitor) attach via the skill-post path — a flag / high-risk softens an
APPROVE→ITERATE for human review, **never blocks, never reverses**. Full pure suite **84/84**. Dogfooded
end-to-end on a real feature into one unified ITERATE report.

## Environment (VAULT7A) — prereqs
- `ssh pdsv@192.168.1.10` (key-only). MoB app on `:8610`, Ottomate tracker on `:8110`, both must be 200.
- Durable harness home: **`/opt/homeserver/fv-harness`** (the cron uses it; kept current). For an
  ad-hoc test, scp `skills/ottomate/scripts/feature-verify` → **`/tmp/fv`** and `npm install` there
  (own `node_modules`; browsers cached in `~/.cache/ms-playwright`; `@playwright/test` pinned 1.60.0).
- Env for every run: `FV_TRACKER_BASE=http://127.0.0.1:8110`, `FV_INSTANCE_URL=http://127.0.0.1:8610`,
  `FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token)`, `FV_PROJECT_SLUG=mapsofbharat`,
  `FV_RISK_POLICY=warn`, `FV_EVIDENCE_ROOT=<a dir>`, `FV_SESSION_ID=<id>`.
- **ONE DOOR:** all DB access via the API; **never** drizzle-kit or a 2nd sqlite client. **POST
  `/api/backup`** before any run that writes `feature_verification_reports` / `test_runs`.

## The proper test — a checklist (each step is independently verifiable)
1. **Pure suite** — `cd /tmp/fv && node --test harness/*.test.mjs gen-matrix.test.mjs` → **84/84**.
2. **Browser leg (L2 system-state)** — `run-matrix.feature-verify.spec.ts` with
   `FV_MATRIX_FILE=fixtures/mapsofbharat.indicator-switch.matrix.json` → APPROVE 1/1; trace/video/
   screenshot under `FV_EVIDENCE_ROOT`. (Or the original `mapsofbharat-indicator.feature-verify.spec.ts`.)
3. **Layers (L1/L3/L4)** — `mapsofbharat-layers.feature-verify.spec.ts` → 3 specs pass on live data;
   `L4-visual/visual.json` carries the real overflow/clip/axe facts.
4. **Fail-closed (must BLOCK)** — point the instance at a dead port (`FV_INSTANCE_URL=…:8611`) and run
   the matrix runner → the driver throws, the case is a **recorded FAIL** (not an empty-matrix green),
   verdict BLOCK, `test_runs` result `failed`. **Delete the synthetic report + prune the failed
   `test_runs` row** after (`DELETE /api/feature-verification-reports/[id]` and
   `DELETE /api/test-runs/[id]`, both bearer + JSON body).
5. **Full pipeline dogfood (one unified report)** — the skill-orchestrated path:
   a. `inferTier(changedFiles)` (`harness/change-tier.mjs`) → the tier + layer plan.
   b. Run the layers spec **and** the matrix runner with **`FV_NO_POST=1`** (each writes
      `report-payload.json` + evidence, no post).
   c. Spawn a **fresh judge sub-agent** (blind to the diff) with `prompts/feature-verifier-judge-prompt.md`
      on the screenshots + the real L4 facts → its findings JSON.
   d. `node dogfood.mjs --matrix … --layers … --visual … --judge … --coder-log-file … --tier T3`
      assembles ONE report: deterministic L1/L2/L3/L4 + an Explorer-frozen case (`harness/explorer.mjs`)
      + the judge (`harness/judge-dispatch.mjs`, cross-checked) + the trajectory
      (`harness/trajectory-monitor.mjs`). Expect **ITERATE** on a healthy MoB (advisory contrast warn +
      the explorer placeholder). Verify: 10 cases across all axes, `judge.discarded ≥ 1` (the overlap
      hallucination), `trajectory.risk none`. **Delete the dogfood report after.**
6. **Disposable-DB (L2, Testcontainers)** — `TESTCONTAINERS_RYUK_DISABLED=true node disposable-db.demo.mjs`
   → a Telugu+emoji title round-trips byte-identical through a REAL throwaway Postgres; container torn
   down. (Needs the `@testcontainers/postgresql` + `pg` deps installed + Docker.)
7. **The cron** — `crontab -l | grep ottomate-nightly` shows `30 2 * * * …/ottomate-nightly.sh`
   (backup → fv → previews). Its log: `/opt/homeserver/logs/ottomate-nightly.log`; the fv run-log:
   `/opt/homeserver/ottomate/fv-evidence/run-log.jsonl`. Confirm the **first scheduled fire** landed a
   `passed` `test_runs` row (`triggered_by:schedule`) + a run-log delta.

## Cleanup discipline (leave the DB as you found it)
Every ad-hoc/demo/fail-closed run writes a report (and maybe a `test_runs` row). **Prune them** via the
DELETE routes so MoB's real trend stays honest (both DELETE routes exist + are bearer-gated). Do NOT
leave synthetic `failed` rows. `POST /api/backup` before, prune after.

## Parallel-session rules (Track A shares this tree)
`git pull --rebase` before every push; commit small; **stage files explicitly** (Track A leaves untracked
files under `docs/**`, `skills/ottomate/scripts/theming/**`, `references/taste-profile.md` — a bare
`git add -A` would sweep them). In `SKILL-REGISTER.md` edit **only the feature-verifier row**. VAULT7A
staging is `/tmp/fv` (Track A owns `/tmp/ottoskill`).

## What is NOT done (honest)
- **Nothing build- or test-pending in Task 3.** The only passive item: watch the cron's first scheduled
  fire (above).
- **Out of Track B:** `#342/#343` (the *code* verifier's disposable-instance / control-tree + turbopack
  symlink recipe) and landing the `test_runs` DELETE route from branch `iter-65` → `main` (app to-dos
  #208/#335).
- **A generalized one-command unified verify** per feature (what `dogfood.mjs` does for MoB, productised)
  is a nicety, not pending work — every underlying piece is built.
