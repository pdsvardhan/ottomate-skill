# Feature Registry + Whole-Site Feature-Verifier — PLAN (2026-08-03)

**Status: PHASES 1 + 2 DONE + DEPLOYED (2026-08-03); Phase 3 PLANNED IN DETAIL; Phase 4 pending.** This is
the research-backed, phased build for turning the feature verifier from "one proven flow (Maps of Bharat)"
into "a registry-driven inspector that can verify the whole site on a manual trigger, blocks
unregistered/unverified features from shipping, and keeps the docs honest against reality."

> **Phase 2 complete (2026-08-03).** Multi-artist defect fixed-live (screenroom `728f207`, report 33) ·
> `feature.test_status` roll-up deployed (tracker `37b3fc5`) · `planFullSite` built + tested (plugin
> `22a5f9e`, 12/12) · `/coverage` revived from real data + gaps (tracker `c0303b6`) · Verify-site async queue
> + button deployed + demonstrated end-to-end (tracker `1ad4fa5` + plugin `9149d8d`: 118 flows planned, 115
> gaps, music-upload APPROVE 23/23 → report 34 → run `done`). **Phase 3 (the hard ship-gate) has a complete,
> executable plan: `docs/plans/2026-08-03-feature-registry-PHASE3-plan.md`.** Resume via
> `docs/plans/2026-08-03-feature-registry-NEXT-SESSION.md`.

> **Phase 1 complete** — the screenroom `flow-music-upload` was verified end-to-end on a reusable
> disposable sandbox, the loop closed into the registry (report keyed to the flow · `test_status` driven ·
> `linked_test` populated), and a real owner-confirmed defect was caught on the first run. Reusable harness:
> `skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music/`. **Resume via
> `docs/plans/2026-08-03-feature-registry-NEXT-SESSION.md`.** Two findings logged there (multi-artist drop
> defect; `feature.test_status` derivation documented-not-implemented). Nothing committed yet.

Authored after: the 7-step verifier end-to-end test (`docs/plans/2026-07-29-task3-TEST-RECIPE.md`, all
passed), a live probe of the tracker data model, and a doc/pipeline research sweep (citations inline).

**Owner decisions locked (2026-08-03):**
1. **Isolation = disposable sandbox instance** — write-heavy flows run against a throwaway app+DB+media+Navidrome, torn down after. Never touch the live library.
2. **Run source = registry-driven + in-app UI now** — the tracker's flows decide what runs; build the Ottomate "Verify site" button + dashboard up front.
3. **Ship gate = hard everywhere** — no feature marked shipped without a registered + passing matrix, on every project (rollout ramp in Phase 3).

---

## 0. What already exists (build ON this, do not reinvent)

The research (cited) shows ~70% of the scaffolding is already here. The honest framing: this is mostly
**wiring + enforcement + reconciliation**, with **one genuinely new infra build** (the disposable instance).

| Intended capability | Nearest existing thing today | Where |
|---|---|---|
| Register a feature/flow | Stage 1 sub-steps 3/4 author features (ACs, API 422 on 0 ACs) + flows (steps ≥2, pre-conditions, edge-cases) → DB + YAML | `references/stage-1-internal.md`; `schemas/{features,flows}.schema.yaml`; `SKILL.md:62` |
| Acceptance criteria as test target | Per-AC `text` + `test_status` + `linked_test`; "LOAD-BEARING for anti-gaslighting" | `features.schema.yaml` |
| Flow ↔ test link | `flow_test_runs` via `POST /api/flows/[id]/test`; phase evidence `playwright_added` | `stage-3-feature-verifier.md:282`; `flows.schema.yaml:53` |
| "Shipped/live" marker | ledger phase `INTEGRATED` (`pr_merged`) + a `deploy_artifacts` row; Rule 5b guards "built >7d, no deploy" | `ledger-tables.md`; `ledger-writes.md`; `anti-gaslight-rules.md:110` |
| Deploy gate ("verify or don't ship") | Stage 3→deploy HARD gate **already specs** "feature-verifier APPROVE on every user-facing feature + green flow_test_runs vs current commit" | `SKILL.md:55` |
| Coverage dashboard | `GET /api/coverage` + `/coverage` view; `features.test_status` derived from flows | `tracker-api.md:297`; `stage-3-testing.md:55` |
| Reconcile registry vs running app | the feature verifier itself (drives real app, asserts system state) + nightly full-matrix cron | `stage-3-feature-verifier.md` |
| Traceability ledger | 6 `*_phase_transitions` tables + `feature_claims`/`deploy_artifacts`/`verification_reports` | `ledger-tables.md`; `ledger-writes.md` |
| Truth discipline | `Enforced?` evidence-gating, status legend, Known-defects table, "register claim ≠ evidence", authority order | `SKILL-REGISTER.md:24-33`; `SKILL.md:19-25` |

**The registry already substantially holds the music-upload spec** (verified live): flow `flow-music-upload`
has a trigger, an expected outcome, **ordered steps naming real endpoints** (`/api/music/upload`,
`/api/music/scan`), **edge-cases** (non-audio skipped, duplicate banner, "feat." fuzzy ~5%), and its parent
feature's ACs are already oracle-shaped ("Fetched assets persist to the files and are visible in Navidrome
after rescan"). We are not authoring this from scratch — we are wiring + thickening it.

## 0b. The precise gaps (what is actually missing)

1. **Registration is dialog/sketch-sourced, never code-discovered.** Anything built outside Stage 1 (e.g.
   the media→screenroom app history) never gets registered → drift. (`stage-1-internal.md` has no
   "discover feature from running app" step.)
2. **`linked_playwright_test` / per-AC `linked_test` columns exist but have NO writer step.** The link is
   nowhere populated. (Research: string appears only in `flows.schema.yaml`.)
3. **Verifier reports use a free-form `target_id`** (`"mapsofbharat.indicator-switch"`), not a flow/feature
   id — so a report can't be reconciled back to a registry row. (Live probe of `feature_verification_reports`.)
4. **`test_status` is stale/manual, not driven by real runs.** Probe: screenroom flows all `not-tested`,
   mapsofbharat `passing` (5/5) — but the matrix runner posts `feature_verification_reports`, not
   `POST /api/flows/[id]/test`. The documented wire (verifier→flow test_status) is not firing for the new runner.
5. **No disposable instance for write-heavy flows** — only the Testcontainers disposable-DB exists (proven
   in the 7-step test). File moves + Navidrome are real side effects with no sandbox yet.
6. **No registry-driven "full-site" run mode.** `run.mjs` has `nightly|commit|fix`, all driven by the
   static `data/feature-verify-apps.json` (only mapsofbharat wired). No mode enumerates the tracker's flows.
7. **The `/coverage` view exists but is unloved + not driven by real data** (owner's own comment:
   "this page looks like a different website, do we even need it?").
8. **The deploy gate is spec, not enforced.** `SKILL.md:55` specs the requirement; nothing proves it fires.
9. **Live doc-drift found this session** (repay in Workstream D): nightly documented at 03:30 but runs
   `30 2` (#289 consolidation); `linked_playwright_test` unwritten; `target_id` unwired.

---

## The plan — 4 phases + a continuous doc-truth workstream

Sequencing: **1 → 2 → 3 → 4**, with **Workstream D (doc-truth)** running across all of them. Phase 1's
disposable-instance infra is the critical-path long pole.

---

## Phase 1 — Thicken + wire ONE flow end-to-end (music upload) as the proof

**Goal:** prove the full loop — registry spec → disposable instance → matrix → run → results written back to
the registry — on the flow you got burned by, without touching your live library.

**1a. Confirm + thicken the registry entry** (`screenroom / flow-music-upload`).
- It's already strong. Add the missing oracle-grade ACs to the parent feature(s): per-field metadata
  correctness (title/album/album-artist/language), dedup behavior, Navidrome-visible-after-rescan,
  persistence-after-reload. Each AC gets a `linked_test` slot to fill in 1d.
- Confirm the app identity: **media.vault7a.xyz appears to be screenroom's earlier host** (no separate
  `media` project exists; screenroom:8504 serves `/music/add`). Record the alias; fold the old
  media-comments in as backfill seed (Phase 4).

**1b. Build the disposable sandbox instance for screenroom** *(the one genuinely new infra build — long pole)*.
- A per-run throwaway: **app container** (screenroom off a baked image) + **disposable Postgres**
  (reuse `harness/disposable-db.mjs`, proven in the 7-step test) + **a scratch music dir** (tmpfs/volume,
  not `/mnt/storage`) + **a stubbed or scratch Navidrome** (either a throwaway Navidrome container pointed
  at the scratch dir, or a stub honoring the rescan/list API the flow calls).
- Seed with a **test-song corpus** incl. the nasty inputs the edge-cases name: clean tagged song, no-tags
  song, non-English/Telugu title+tags, an exact duplicate, a non-audio file, a "feat." fuzzy case, and the
  **5 blessed songs** (known-correct metadata) that serve as the correctness reference.
- Env/teardown: `TESTCONTAINERS_RYUK_DISABLED` pattern; guaranteed teardown even on failure; assert the
  scratch paths are never under the real library (fail-loud if they are).
- **Note:** this is adjacent to the code-verifier's disposable-instance recipe (#342/#343, out of Track B)
  — coordinate so the two share the container/teardown machinery instead of duplicating it.

**1c. Author the case matrix from the registry** (the generator drafts; you review once).
- Input = the flow's steps + edge-cases + the feature ACs (already in the tracker). The P2-A case-matrix
  generator models inputs (1 / many / nasty), enumerates the path (upload → scan → metadata → search-attach
  → move → rescan → reload), attaches layered oracles, bounds with pairwise, risk-orders.
- Oracles per step: **L1** scan/upload jobs finish, no 4xx/5xx, no orphaned job. **L2** files land at
  `/music/<lang>/<artist>/<album>/`, DB rows exist, **Navidrome lists them after rescan** (second channel),
  survive reload. **L3** N uploaded → N rows (conservation), duplicate → 1 row + dupe flag, non-audio →
  skipped-with-warning (not silently dropped). **Correctness** each metadata field == the blessed fixture.
- You approve the matrix once (the owner-review gate); it's stored in
  `screenroom repo: design/feature-verify/music-upload.matrix.json` with `covers:` globs.

**1d. Wire matrix ↔ registry** *(closes gaps 2–4)*.
- Give the matrix a `flow_id` / `feature_id` field; make the runner **post keyed to that id** (replace the
  free-form `target_id`) so a report reconciles to a registry row.
- Populate `flow.linked_playwright_test` (and per-AC `linked_test`) — give the unwritten column its writer.
- After a run, **drive `test_status`** from the real result: `POST /api/flows/[id]/test` (writes
  `flow_test_runs`) → flow `test_status` (derived) → feature `test_status` (AND of linked flows). One run,
  real status, no manual edits.

**1e. Run it → unified report → results in the registry.**
- Run the matrix on the disposable instance; produce the one unified report (L1/L2/L3/correctness + evidence)
  AND write `flow_test_runs` + `test_status` back. Verify the coverage endpoint now reflects the real run.

**Deliverable:** music-upload verified end-to-end on a disposable instance; the flow's `test_status` and its
feature's `test_status` are driven by a real run; evidence openable; zero live-library pollution.

**All-cases baked in here:** write side effects (disposable), owner-only permission (test login/role +
guest/other-user negative cases), external metadata APIs (stub/record-replay + L3 no-known-correct +
tolerance), async jobs (completion waits + timeouts + orphan detection), i18n (Telugu round-trip — DB layer
already proven), correctness needs a reference (5 fixtures), duplicate/non-audio/persistence-after-reload.

---

## Phase 2 — Full-site manual-trigger runner + in-app dashboard

**Goal:** one click → verify every registered flow across the site → a real dashboard.

**2a. Registry-driven `full-site` run mode** (new planner `planFullSite` in `harness/orchestrate.mjs`).
- Enumerate registered flows across all projects **from the tracker API** (not the static manifest); map
  each flow → its linked matrix; schedule each on the right instance (disposable for write-heavy flows,
  a shared live/read-only instance for read-only flows — flag per flow).
- Concurrency: parallelism cap, per-flow timeout, a disposable-instance budget (spinning many sandboxes is
  costly — pool/reuse where safe), and a queue so a full-site run is orchestrated, not a stampede.
- Write results back per flow (as in 1d/1e); one run-log + delta across the whole site.

**2b. Manual trigger surface (in-app, per your choice).**
- API: `POST /api/verify/site` (whole site) and `POST /api/verify/project/[slug]` (one app), bearer-gated;
  reuse `POST /api/flows/[id]/test` for a single flow. Returns a run id to poll.
- Ottomate app UI: a **"Verify site"** button (and per-project / per-flow "Verify") that kicks the run and
  streams status. **Note the constraint:** the Ottomate app is prod-docker (baked `.next`) — this is real
  app code + image rebuild + redeploy, not a hot edit.

**2c. Revive the `/coverage` dashboard** (drive it from truth, restyle with the design system).
- Source it from real `feature_verification_reports` + `flow_test_runs` (not stale `test_status`): per
  project/flow show pass / iterate / block, last run + commit, evidence links, and the **gaps**
  (unregistered pages, flows with no matrix, features never run vs current commit).
- Fix the "looks like a different website" complaint by rebuilding it with the Ottomate design system.

**Deliverable:** a "Verify site" button that runs the whole registry and a coverage dashboard that shows the
real, current state — including what's *not* covered.

**All-cases:** mixed read-only vs write-heavy flows (instance strategy per flow), concurrency/budget/timeouts,
flake control (Docker-pin, clock freeze, retries <2%, quarantine), partial-site runs, a flow whose matrix is
missing (surface as a gap, never a silent pass).

---

## Phase 3 — "Register + verify or you can't ship" contract (hard, everywhere)

**Goal:** make it impossible to mark a feature shipped without a registered, passing matrix — on every project.

**3a. Enforce at the deploy gate** (the spec already exists at `SKILL.md:55`; make it *fire*).
- Before a feature can reach ledger phase `INTEGRATED` / get a `deploy_artifacts` row, require: (i) a
  registered flow, (ii) a linked matrix (`linked_playwright_test` populated), (iii) a **passing run against
  the current commit** (a stale pass doesn't count). Block otherwise.

**3b. Close the "built outside the pipeline" hole.**
- A pre-deploy reconcile of `feature_claims` (the "I built X" ledger, 100 rows today, with
  `reconciled_with`) against registered + verified features. An unreconciled claim blocks the ship.

**3c. New anti-gaslight rule** (extends Rule 5b): "feature `done`/claimed but no linked matrix, or no passing
run vs current commit" → a violation surfaced by `GET /api/anti-gaslight/violations`.

**3d. Wire into the Stage 3→deploy HARD gate** in `SKILL.md` + the deploy script, and mark the register row
`Enforced? = yes` **only once a test proves the gate fires** (per the register discipline).

**Rollout ramp for "hard everywhere":** the gate is *hard*, but it **activates per-project as that project's
backfill (Phase 4) completes** — otherwise day 1 it blocks all 8 apps that aren't registered yet. So: turn it
on for screenroom first (after Phase 1), then each app as Phase 4 backfills it. Target state = hard on all.

**Deliverable:** you literally cannot ship an unregistered or unverified feature on a backfilled project.

**All-cases:** a legitimately owner-only/experimental feature (still hard-gated per your choice — the ramp,
not an exception, is how we avoid blocking everything at once); a hotfix (still needs a passing run vs the
hotfix commit); a feature with no user-facing surface (registered but may be exempt from the *browser* leg).

---

## Phase 4 — Reality reconciliation + v0 backfill

**Goal:** make the registry match reality, and backfill the features that predate the registry.

**4a. The reconciler** (registry ↔ running app).
- Crawl each live app's routes + interactive elements; diff against the registry. Flag **"page/route/flow
  with no registered feature"** and **"registered feature whose route is gone."** Run periodically + surface
  in the coverage dashboard. This is what catches the media→screenroom drift and anything built off-pipeline.

**4b. v0 backfill** (one-time per app).
- For apps whose features predate the registry (thin flows everywhere; whole apps like the old media host),
  a one-time authoring pass: route crawl + the existing thin flow records + **the DOM Commenter comments**
  (your JSON exports — they literally describe expected behavior per page) → the generator drafts
  features + ACs + flows + matrices → you review. Then Phase 3's gate can turn on for that app.

**4c. Resolve app identity.** Make screenroom the one canonical project for the movies/music/TV app; record
media.vault7a.xyz as a historical alias; ensure `public_url`/ports are correct so the reconciler crawls the
right host.

**Deliverable:** registry == reality; no unregistered live features; v0 specs backfilled; gate can go hard
per app.

**All-cases:** superseded/renamed apps (alias handling), a route that exists but is intentionally
unregistered (allowlist), a registered feature intentionally retired (mark superseded, don't delete — matches
the ledger's "superseded stays" rule).

---

## Workstream D — Doc-truth (the "out of sync with docs" fix) — CONTINUOUS

This is your explicit concern. Two layers, plus a standing discipline and a one-time debt-repayment.

**Layer 1 — plugin docs ↔ this build.** The project already has the discipline; the fix is to *follow it
every phase*, not bolt it on at the end:
- **Same-commit updates** — every phase updates, in the same commit as the code: the **feature-verifier row
  in `SKILL-REGISTER.md`** (with `Enforced? = yes` **only** when a test proves it, naming the test — never
  "yes" for prose), the **owning reference** (`stage-3-feature-verifier.md`), and the **generated
  `tracker-api-inventory.md`** (regenerate from routes when the API changes). (`SKILL-REGISTER.md:26-30`.)
- **Supersede, don't delete** — stale claims get struck through with what replaced them
  (`SKILL-REGISTER.md:31`).
- **Follow the authority order** when docs disagree: live API > generated inventory > stage reference, and
  *tell the user about the drift* — never silently pick (`SKILL.md:19-25`).

**Repay the specific doc-debt found this session (do this first, it's small):**
- Nightly cron: docs say **03:30**, reality is **`30 2`** (#289 wrapper) → fix `stage-3-feature-verifier.md`.
- `linked_playwright_test`: documented column with no writer → Phase 1d gives it one; document the writer.
- Verifier `target_id` free-form vs implied flow linkage → Phase 1d wires it; document.
- `test_status` "derived from real runs" vs actually stale/manual → Phase 1e drives it; document.
- Confirm/repair whether the runner actually calls `POST /api/flows/[id]/test` (probe says not) → reconcile
  doc and code.

**Layer 2 — registry ("product docs") ↔ running app.** The registry *is* the product's living documentation;
**Phase 4 (the reconciler) is the mechanism that keeps it honest**, and Phase 3 (born-at-build gate) keeps it
from drifting again.

**The meta-principle (how drift stays fixed):** make the **running system the authority** (per `SKILL.md:19`),
and let the **verifier + reconciler + coverage dashboard continuously measure docs-vs-reality**, surfacing any
gap as a defect rather than silently picking a side. In effect, this whole build *is* the machine that keeps
the Ottomate docs and the running product honest with each other.

---

## "Consider all cases" — the hard cases, and where each is handled

| Case | Handled by |
|---|---|
| Write side effects (file moves, Navidrome rescan) | Disposable instance (Phase 1b); never live |
| Auth/permission (owner-only writes; multi-account future) | Test login/role fixtures + guest/other-user negative cases (1c) |
| External deps (music-metadata APIs, rate limits, flakiness) | Stub/record-replay + L3 no-known-correct + tolerance (1c) |
| Async/long-running jobs (upload→scan→rescan) | Completion waits, timeouts, L1 orphan detection (1c) |
| Non-determinism / flake | Docker-pin, clock freeze, retries <2% budget, quarantine (Phase 2) |
| Data correctness needs a reference | 5 blessed fixtures (1b/1c) |
| i18n (Telugu/Hindi filenames + tags) | Disposable-DB Telugu round-trip already proven (7-step test) |
| Persistence-after-reload / idempotency | Explicit oracle in the matrix (1c) |
| Features built outside the pipeline | Reconciler (4a) + born-at-build gate (3a/3b) |
| Renamed/superseded apps (media→screenroom) | Alias handling (4c); supersede-don't-delete |
| Cost/time of many disposable instances | Parallelism cap + pooling; only write-heavy flows get a fresh instance (2a) |
| A flow with no matrix | Surfaced as a coverage gap, never a silent pass (2c) |
| Docs drifting from build | Workstream D (same-commit + authority order + reconciler) |

---

## What I need from you to start Phase 1
1. The **5 test songs + their correct metadata** (title/album/album-artist/language) — the correctness reference.
2. **Read access** to screenroom's DB + the Navidrome API (for the second-channel checks and to shape the stub).
3. Confirm **screenroom is the one canonical app** for the music flow (media.vault7a.xyz = its old host).

## Effort + risk (honest)
- **Phase 1** is the biggest single lift because of **1b (disposable instance)** — that's the new infra long
  pole; the rest of Phase 1 is wiring against a registry that's already populated.
- **Phase 2**'s in-app UI is real app work (prod-docker rebuild + redeploy).
- **Phase 3** is mostly enforcement + one anti-gaslight rule; low code, high leverage.
- **Phase 4** is bounded but repetitive (per-app backfill); the DOM-commenter comments cut the cost a lot.
- **Workstream D** is cheap if done same-commit, expensive if deferred — so it's continuous, not a phase.

## Out of scope / deferred
- Design-taste verification (that's the design system + advisory judge; not this build).
- The code-verifier's own disposable-instance recipe (#342/#343) — coordinate to share teardown machinery.
- Perf/Lighthouse (owner: not needed).
