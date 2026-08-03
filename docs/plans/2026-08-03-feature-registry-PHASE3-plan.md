# Feature Registry — PHASE 3 build plan: "register + verify or you can't ship" (2026-08-03)

**Status: PLANNED, not built.** Phases 1 + 2 are DONE + DEPLOYED (see
`2026-08-03-feature-registry-NEXT-SESSION.md`). This is the complete, executable plan for **Phase 3 —
the hard ship-gate**. Read this top-to-bottom, then execute P3-0 → P3-E in order.

## Goal (one sentence)
Make it **impossible to mark a user-facing feature shipped** (ledger `INTEGRATED` / a `deploy_artifacts`
row / status `done`) without (i) a **registered flow**, (ii) a **linked test** (`linked_playwright_test`),
and (iii) a **passing verification against the current commit** — enforced per-project via a ramp, on top
of the machinery that already exists.

## The big realisation: ~80% already exists — Phase 3 is EXTEND + WIRE + PROVE, not greenfield
Verified live this session (2026-08-03):
- **The anti-gaslight rule engine is live:** `GET /api/anti-gaslight/violations[?project_slug=]` →
  `app/api/anti-gaslight/violations/route.ts` — a clean SQLite engine of 5 rules (R1–R5), each a
  `RuleResult {rule, severity:'HARD'|'SOFT', description, count, items, note}` built on `getRawSqlite()`,
  each guarding table-existence and degrading to `count:0` on a fresh DB. **New rules slot straight in here.**
- **Rule 1 `unclaimed-done` (HARD)** — a `status='done'` feature with **no** `feature_claims` row.
- **Rule 5b `untested-deploys` (HARD)** — a deploy with no `test_run` in the day before it.
- **The gate mechanism exists:** anti-gaslight-rules.md:155 — *"every stage transition → run
  `GET /api/anti-gaslight/violations` → refuse the transition on any HARD violation."* Per-project wrapper
  `GET /api/audit/[slug]/...`. So enforcement = adding rules the gate already consults + a commit-specific check.
- **The commit-specific signal exists:** `feature_verification_reports` carries `commit_sha` +
  `target_id` (the flow id) + `recommendation_overall` ('APPROVE'|'BLOCK'|'ITERATE'). So *"a passing run vs
  commit X for flow F"* = a row `target_id=F, commit_sha=X, recommendation_overall='APPROVE'`.
- **BP-2's roll-up** already makes `feature.test_status` the AND of its flows (the standing, commit-agnostic
  "is this feature passing" signal). **BP-4's Verify-site queue** can produce the APPROVE reports the gate needs.

## The precise gaps Phase 3 closes
1. **No rule** flags "a done/user-facing feature with no linked flow, or a linked flow with no
   `linked_playwright_test`, or `feature.test_status != 'passing'`." (The standing check.)
2. **No commit-specific deploy check** — SKILL.md:55 specs *"feature verifier APPROVE on every user-facing
   feature ... vs the current commit"* as **prose**; nothing computes it at deploy time.
3. **`feature_claims` (213 rows)** — `reconciled_with='unreconciled'` claims are never gated, and nothing
   auto-flips a claim to `'verified'` when a passing report lands. (Rule 1 only catches done-with-NO-claim.)
4. **No per-project ramp flag** — can't turn the hard gate on for screenroom first without blocking all 8+ apps.
5. **Register `Enforced? = no`** — must stay `no` until a test proves the gate BLOCKS (register discipline).

## Real schema facts (so you don't re-derive)
- `projects` (drizzle) columns incl. `slug, current_status, lifecycle_phase, deployed_at, deploy_commit_sha`.
  **No gate column yet.** Next drizzle migration = **`0012_*`, journal `idx: 7`** (last was `0011`, idx 6).
- `feature_claims` (RAW table, outside drizzle — via `getRawSqlite()`): `feature_id, claimed_at,
  claimed_by_session, claim_text, source, reconciled_with ∈ {verified,partial,stub-detected,dropped,
  unreconciled} default 'unreconciled', reconciled_at, reconciler_id (→ verification_reports.id, loose)`.
  Index `idx_fc_unreconciled` exists.
- `deploy_artifacts` (RAW): `project_slug, feature_ids (JSON array), commit_sha, deploy_url, deployed_at,
  smoke_test_run_id`. 56 rows.
- `test_runs` (RAW): `project_slug, commit_sha, result ∈ {passed,failed,partial,errored,running},
  triggered_by`. 126 rows. (Note: `flow_test_runs` — the drizzle per-flow table — has **no** commit_sha;
  the commit-specific signal lives in `feature_verification_reports`.)
- `flow_features` (flow_id, feature_id) = the flow↔feature link. `flows.linked_playwright_test`,
  `flows.test_status`, `features.test_status` (derived — BP-2), `features.status ∈ {planned,building,done,
  blocked,dropped}`, `features.type ∈ {ui,backend,automated,hybrid}`.

---

## Work items — execute in order. Each has files · acceptance · a must-FAIL test.

### P3-0 — Per-project ramp flag (prereq, small)
- **Schema:** add `verify_gate` to `projects` (drizzle) — `text('verify_gate', { enum: ['off','warn','block'] }).default('off')`. Edit `lib/db/schema.ts`, add migration **`lib/db/migrations/0012_project_verify_gate.sql`** (`ALTER TABLE projects ADD COLUMN verify_gate TEXT DEFAULT 'off';`) + bump `meta/_journal.json` (idx 7). Migrations run on boot (Dockerfile copies `lib/db/migrations`).
- **Arm screenroom:** after deploy, `PATCH /api/projects/screenroom {verify_gate:'block'}` (backup-first). All others stay `'off'`.
- **Acceptance:** `GET /api/projects/screenroom` shows `verify_gate:'block'`; a fresh project defaults `'off'`.

### P3-A — Rule R6 `unverified-ship` (the core standing rule)
- **File:** `app/api/anti-gaslight/violations/route.ts` — add R6 in the R1–R5 pattern (raw SQLite via `getRawSqlite`, guard table existence, cap `MAX_ITEMS`).
- **Logic** — for every project whose `verify_gate != 'off'`, flag each **user-facing** feature
  (`type IN ('ui','hybrid')`) at `status='done'` that fails ANY of:
  (a) has **no** `flow_features` row (no registered flow), OR
  (b) has a linked flow whose `linked_playwright_test` is NULL/'' (no test), OR
  (c) `features.test_status != 'passing'` (the derived roll-up — a failing/untested feature isn't shippable).
- **Severity by ramp:** `verify_gate='block'` → **HARD**; `'warn'` → SOFT; `'off'` → skip (rule emits nothing).
- **Item shape:** `{feature_id, project_slug, reason: 'no-flow'|'no-test'|'not-passing'}`.
- **Acceptance + must-FAIL:** a `done` `ui` feature on a `'block'` project with an untested linked flow →
  appears as HARD `unverified-ship`; a fully-passing feature with a linked+tested flow does **not**; the same
  feature on an `'off'` project never flags. `feat-music-upload` (passing, linked, screenroom='block') must
  **not** flag.

### P3-B — Reconcile claims + gate the unreconciled (extends the claim ledger)
- **B1 — auto-reconcile writer:** when an **APPROVE** `feature_verification_report` is posted for a flow,
  mark that flow's linked features' latest `feature_claims` row `reconciled_with='verified',
  reconciled_at=now, reconciler_id=<report.id>`. Wire into the report POST
  (`app/api/feature-verification-reports/route.ts`) **and** expose it in the existing
  `POST /api/coverage/recompute` backfill (reuse the `flow_features` join from `lib/feature-rollup.ts`).
  New helper `lib/claim-reconcile.ts` (raw SQLite — `feature_claims` is not a drizzle table).
- **B2 — Rule R7 `unreconciled-claim`:** on `verify_gate='block'` projects, a feature with a
  `feature_claims` row `reconciled_with='unreconciled'` **older than the current session** (use `claimed_at`
  vs a grace window, or simply any unreconciled claim on a gated project) → **HARD**. Complements R1.
- **Acceptance:** posting an APPROVE report flips the feature's unreconciled claim to `'verified'`; an
  unreconciled claim on a gated project shows HARD; on `'off'` it doesn't.

### P3-C — The commit-specific deploy gate (make SKILL.md:55 actually fire)
- **Endpoint:** `GET /api/verify/gate?project_slug=<slug>&commit_sha=<sha>` (read-only, open) →
  `{ ok: boolean, gate: 'off'|'warn'|'block', blocking: [...], warnings: [...] }`. For each user-facing
  feature in the project: each linked flow must have an **APPROVE** `feature_verification_reports` row with
  `commit_sha == <sha>`; a missing linked test or a missing/na APPROVE@sha → a blocking (gate='block') or
  warning (gate='warn') entry. `off` → `ok:true` with advisory only.
- **Skill wiring:** the 3→deploy step (and 4.8 integrate) runs BOTH `GET /api/anti-gaslight/violations` and
  `GET /api/verify/gate` for the deploying commit; **refuses** on any HARD / any `blocking` for gated projects.
- **Optional CLI hook:** `scripts/deploy-gate.mjs` (calls the endpoint, exits non-zero on block) for a
  pre-deploy shell hook — but the primary enforcement is the skill step.
- **Acceptance + must-FAIL:** screenroom at a commit with **no** APPROVE report → `ok:false` with music-upload
  blocking; at `728f207` (has APPROVE reports 33/34) → music-upload passes; a project with `verify_gate='off'`
  → `ok:true`, advisory only.

### P3-D — Wire into the skill + register + repay doc-debt (Workstream D)
- **SKILL.md** 3→deploy HARD gate: add the two checks above; **stage-3-feature-verifier.md** + the deploy
  notes document them. Follow authority order (live API > inventory > stage-ref).
- **Regenerate** `references/tracker-api-inventory.md` for the new routes (`/api/verify/gate`, the reconcile).
- **SKILL-REGISTER** feature-verifier row: set the gate `Enforced? = yes` **only after P3-E proves it fires**,
  naming the test. Until then it stays `no`.
- **Repay the specific doc-debt (small, do it here):** nightly cron documented `03:30` but runs `30 2`
  (#289) → fix in `stage-3-feature-verifier.md`; document the now-built wiring (linked_playwright_test
  writer, `target_id=flow` reports, driven `test_status`, the BP-2 roll-up, BP-5 coverage, BP-4 verify queue).

### P3-E — Prove the gate BLOCKS (the enforcement test — the gate is not "enforced" until this passes)
- On screenroom (`verify_gate='block'`), **backup-first**:
  1. Create a synthetic `done` `ui` feature with a linked flow that has no test → `GET
     /api/anti-gaslight/violations?project_slug=screenroom` shows HARD `unverified-ship`; `GET
     /api/verify/gate?...&commit_sha=<HEAD>` returns `ok:false` naming it.
  2. Simulate the deploy-gate step refusing (the skill step, or `scripts/deploy-gate.mjs` exit≠0).
  3. Resolve it (link+verify, or drop the synthetic) → both checks clear (`ok:true`).
  4. **Prune the synthetic rows** (they are synthetic — DELETE via the API DELETE routes; real rows kept).
- **Evidence:** the BLOCK response JSON + the cleared response. **Only then** flip the register row
  `Enforced? = yes (test: P3-E)`.

---

## Rollout ramp (how "hard everywhere" avoids blocking everything on day 1)
`verify_gate` starts `'off'` on every project **except screenroom = 'block'** (it's Phase-1/2 backfilled).
As Phase 4 backfills each app (features/flows/tests registered), flip it `'off' → 'warn' → 'block'`. Target
state: `'block'` on all. The gate is *hard* — the ramp is the rollout, not an exception.

## "Consider all cases"
| Case | Handling |
|---|---|
| Owner-only / experimental feature | Still gated on a `'block'` project (the ramp, not an exception) |
| Hotfix | Still needs an APPROVE report vs the **hotfix** commit (P3-C is commit-specific) |
| Non-user-facing feature (`type` backend/automated) | R6 targets `ui`/`hybrid`; exempt from the browser leg, but still needs a passing linked flow if it has one |
| Feature with no flow at all on a gated project | HARD `unverified-ship` reason `no-flow` — register a flow first |
| A flow with no test | Already a coverage GAP (BP-5) → R6 reason `no-test` on a gated project |
| Fresh project (no gate) | `verify_gate='off'` → advisory only, never blocks |
| Stale pass (APPROVE at an old commit) | P3-C requires `commit_sha == deploying commit`, so a stale pass doesn't count |

## Discipline (unchanged, non-negotiable)
ONE-DOOR (all DB via the API/app) · **`POST /api/backup` before every tracker write/deploy** · rebuild from a
CLEAN tree (tracker tree is clean; screenroom needs a worktree — owner has WIP there) · **commit only my
files** · deploy-as-I-go, health-check after · **prune only SYNTHETIC rows** (report 32/33/34, the
flow/feature statuses, the 213 claims are REAL — keep them).

## Effort (honest)
**Low code, high leverage.** P3-A/B/C are ~3 SQLite rules + one read-only endpoint + one reconcile writer +
one `projects` column — all against machinery that already exists. **One tracker deploy** carries P3-0/A/B/C
(migration + rules + endpoint); P3-D is doc edits; P3-E is the proof. Estimate: a single focused session.

## Deployment quick-ref (both apps)
- **Tracker** (`ottomate`): source = `/opt/homeserver/ottomate` (= `/mnt/storage/websites/ottomate`, bind
  mount; tree clean except untracked `fv-evidence/`; branch `ws1.1-live-preview`). Deploy: **backup →**
  `cd /opt/homeserver/ottomate && docker compose build ottomate && docker compose up -d` → health
  `GET /api/health`. Image `ottomate-ottomate`. `.dockerignore` excludes `.next`/`data` so working-tree
  builds are clean. Commit → push `origin ws1.1-live-preview` (SSH remote `ottomate-tracker-v3.git`).
- **screenroom**: repo `/mnt/storage/websites/screenroom` has **owner WIP** — build `:latest` from a
  `git worktree add /tmp/sr-deploy <commit>` (NOT the dirty tree), `docker compose up -d --no-build`.
- Token: `cat /opt/homeserver/ottomate/.token`. Heredoc-with-`()` over ssh breaks — avoid parens in commit
  messages or write them to a file.
