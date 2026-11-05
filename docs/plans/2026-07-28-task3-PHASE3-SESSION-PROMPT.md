# Task 3 — Phase 3 session-starter prompt (paste this into the new session)

---

You are running **TRACK B (Task 3 — the feature verifier), Phase 3**. A parallel session may run Track A
(Task 2) at the same time; stay in your lane per the file-ownership map.

**READ FIRST, IN ORDER:**
1. `~/.claude/plugins/ottomate/docs/plans/2026-07-28-task3-PHASE3-plan.md` — the Phase-3 plan + the 4 owner
   decisions + the change-tier spine (start here).
2. `~/.claude/plugins/ottomate/docs/plans/2026-07-28-task3-IMPLEMENTATION-PLAN.md` — the 7-layer architecture
   the whole verifier is built on.
3. `~/.claude/plugins/ottomate/SKILL-REGISTER.md` — the "Feature verifier" row (what exists + is enforced).
4. `~/.claude/plugins/ottomate/docs/plans/2026-07-28-SESSION-HANDOFF.md` — the parallel file-ownership map.
Do NOT bulk-read `docs/research/`; the distilled Task-3 tracks are `docs/research/task3/{T1,T2,T3}.md` if needed.

**STATE (measured, verified on VAULT7A):** Phase 1 (P1-A…E) and Phase 2 (P2-A case-matrix generator +
P2-B independence enforcement) are **BUILT + VERIFIED** — the browser leg passes and blocks (reports id
6/7), the implicit/metamorphic/visual layers work (id 8), the data-driven runner reproduces P1-A from a
declarative matrix file (id 9), the trust record downgrades an unreviewed run (id 10), and the
reproduce-symptom two-phase (RED→GREEN) is demonstrated. 21+ unit tests green on node 20. **Nothing in
Phase 3 is built yet — that is the job.**

**THE JOB — build Phase 3 in this order (detail in the plan doc):**
- **P3-C first** (highest leverage — makes the verifier run automatically): gate-wiring + cadence +
  flake-control + reporting. Nightly full pass = a **cron on VAULT7A** (wire the existing `postTestRun()`,
  which has no caller; pairs with app to-do #289); on-commit = impacted **app only** (diff vs last-green);
  flake control (Playwright Docker image, Clock freeze, Testcontainers disposable DB); reporting tail
  (`action_log`, JSONL, delta-vs-previous); durable evidence store (today ephemeral in `/tmp`).
- **P3-A** (the AI-visual-judge): **advisory-only**, fires at **T2+** on the change-tier (quick grounded
  glance at T2, full guardrailed pass at T3; tier inferred from impacted files, owner override). Rubric
  `data/feature-verify-judge-rubric.md` (off Task-2's `design-rubric.md`), prompt
  `prompts/feature-verifier-judge-prompt.md`, harness `harness/ai-judge.mjs`. **Every spatial claim the
  judge makes is cross-checked against the L2/L4 DOM/geometry layer and discarded if contradicted.** The
  judge can `warn`/flag, never emit a gating `pass`.
- **P3-D** (the trajectory monitor): a cheap-model scan of the coder's build-session log for hack-narration
  — **detection-only, never a training signal**. Confirm the session-log wiring at build.
- **P3-B is SKIPPED** (owner: designs in code, no target design images; `baseline-guard` stays).

**THE CHANGE-TIER SPINE (the reframe that shapes P3-A + P3-C):** verification scales to the change —
T0 backend/copy → T1 style tweak → T2 new/changed component → T3 new page/feature/redesign; the tier is
**inferred from the impacted files** (owner override). Which layers run + whether the judge fires follow
the tier (table in the plan doc). Each unit: a plan doc first, a must-fail + must-pass, a same-commit
register row, verified on VAULT7A. **Never claim a browser/CI leg that didn't run — attach the evidence.**

**YOUR LANE (owns):** `scripts/feature-verify/**`, `references/stage-3-feature-verifier.md`,
`prompts/feature-verifier-*.md`, `references/stage-4-mini-pipeline.md` §4.7, `data/feature-verify-*`. In
`SKILL-REGISTER.md`/`SKILL.md` edit ONLY the feature-verifier rows/sections. DO NOT touch
`scripts/generation`, `scripts/preview-build`, `scripts/design-check`, `data/design-*`, or
`references/stage-2-*` — Track A owns those. Stage to **`/tmp/fv`** (NOT `/tmp/ottoskill`). DB table:
`feature_verification_reports`.

**RUN RECIPE (VAULT7A):** `ssh pdsv@192.0.2.10` (key-only). `scp` the `scripts/feature-verify` dir to
`/tmp/fv`, then `cd /tmp/fv && npm install` (a `package.json` is committed; `@playwright/test` is pinned
to 1.60.0 to match the browsers cached in `~/.cache/ms-playwright`). Env: `FV_INSTANCE_URL=http://127.0.0.1:8610`
(the app under test — MoB), `FV_TRACKER_BASE=http://127.0.0.1:8110` (the Ottomate sink),
`FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token)`, `FV_PROJECT_SLUG=<slug>`, `FV_RISK_POLICY=warn`,
`FV_EVIDENCE_ROOT`, `FV_SESSION_ID`; the matrix runner also takes `FV_MATRIX_FILE`. Pure-logic tests:
`node --test harness/*.test.mjs` (also runs locally on Windows node). **`POST /api/backup` before writing
`feature_verification_reports`.** ONE DOOR (all DB via the API); never `drizzle-kit`.

**PARALLEL RULES:** `git pull --rebase` before every push; commit small; `git status` AFTER committing —
and stage files EXPLICITLY (Track A leaves untracked files like `docs/test-runs/*` in the shared tree; a
bare `git add -A` would sweep them into your commit). Only ever edit your own rows in `SKILL-REGISTER.md`.
To-do #247: a sibling Claude session shares VAULT7A as `pdsv` — expected.

**GOTCHAS:** `data-oid` is DEAD on live projects (use `getByRole`/`getByTestId`; `selectors.ts oid()` is
dead code). ESM/Playwright resolve bare specifiers from the FILE's location — that's why the harness needs
its own `/tmp/fv/node_modules`. The Ottomate app is server-side; drive it via `ssh` + `curl`, batch calls.

**MEMORY:** the entry point is the `[Task 3 verifier re-plan 2026-07-28]` line in `MEMORY.md`
(`ottomate-task3-verifier-replan-2026-07-28.md`). Append Phase-3 progress there; don't rewrite Task-2 lines.
