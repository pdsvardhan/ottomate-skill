# Doc-freshness enforcement + leaploop backfill — build plan (2026-08-04)

> **Status: PLANNED (awaiting owner lock on `references/documentation-standard.md`).** This plan builds
> the enforcement that codifies that standard, plus the leaploop pilot backfill. It reuses the Phase-3
> machinery (the anti-gaslight SQLite rule engine, the `verify_gate` ramp, the commit-specific gate,
> `lib/claim-reconcile.ts`). Execute D0 → D7 in order; each item has files · acceptance · a must-FAIL test.
>
> **Deferred to next session (owner, Q2):** leaploop's test-evidence approach (link the 12 pytest tests
> vs build a browser leg) and the `linked_playwright_test → linked_test` generalization. Items that depend
> on it are marked **[Q2]** and are planned but not built until that's decided.

## The big realisation (same as Phase 3: EXTEND, not greenfield)
~70% exists. The anti-gaslight engine (`app/api/anti-gaslight/violations/route.ts`) is a live SQLite
rule engine we just extended with R6/R7; the `verify_gate` ramp + the integrate gate + the coverage
roll-up all exist. Doc-freshness = **a few more rules + a spec-sync check at integrate + two tiny free
linters + a generator** — on top of that.

---

## D0 — Ramp flag for docs (prereq, tiny)
- **Decision to confirm:** reuse `projects.verify_gate` for doc rules too, OR add a sibling
  `projects.doc_gate ∈ {off,warn,block}` (migration `0013`). **Recommend a sibling `doc_gate`** so a
  project can be ship-gated (verify) without being doc-gated yet, and vice-versa — independent ramps.
- **Acceptance:** `GET /api/projects/<slug>` shows `doc_gate`; default `off`; leaploop armed later.

## D1 — Native drift rules (extend the anti-gaslight engine) → R-DOC-3 / R-DOC-5 / R-DOC-4
- **File:** `app/api/anti-gaslight/violations/route.ts` — add, in the R1–R7 pattern (raw SQLite, guard
  table/column existence, cap MAX_ITEMS, severity by `doc_gate`):
  - **`dead-capability`** (R-DOC-5): a live flow step / feature / page that references a `dropped` or
    `deprecated` feature (by id or by a step whose result names a dropped capability). *leaploop's
    `flow-discovery-triage` "Tier-A alert sent" is the seed case.*
  - **`stale-spec`** (R-DOC-3): a feature/flow whose `updated_at` lags the project's last activity marker
    (last integrated iteration touching it, or `deploy_commit_sha` date) beyond a threshold, with no
    re-verify since. *leaploop features frozen 2026-06-02 vs repo 2026-07-02 is the seed case.*
  - **`unbacked-pass`** (R-DOC-4): a flow/feature `test_status='passing'` with no `linked_test`/
    `linked_playwright_test` and no `flow_test_runs`/report backing it. *leaploop `feat-auth-deploy` +
    mapsofbharat's 5 flows are seeds.*
- **Severity:** by `doc_gate` (block→HARD, warn→SOFT, off→skip), same shape as R6/R7.
- **Acceptance + must-FAIL:** on a `doc_gate='block'` project, a flow referencing a dropped feature →
  HARD `dead-capability`; a `passing` flow with no linked test → HARD `unbacked-pass`; the same on an
  `off` project emits nothing.

## D2 — Spec-sync gate at integrate → R-DOC-10
- **File:** `app/api/iterations/[id]/integrate/route.ts` — extend the existing "all items closed"
  validation: for every locked item whose `item_type ∈ {feature_modification, flow_modification,
  page_modification}` OR a `bug` flagged behaviour-changing, require the target entity's `updated_at ≥`
  the iteration lock time (proves its spec was edited this iteration). Refuse (400) naming offenders.
- **Skill wiring:** `stage-4-mini-pipeline.md` 4.8 — the doc-reconcile step becomes gate-backed, not prose.
- **Acceptance + must-FAIL:** integrate an iteration that changed a feature's behaviour but never PATCHed
  its spec → 400 `spec-not-synced` naming the feature; PATCH the spec → integrate passes.

## D3 — Derived test_status + AC linkage → R-DOC-4  [Q2]
- Make `test_status` derivation authoritative (extend `lib/feature-rollup.ts` + block hand-setting a
  flow to `passing` without a `linked_test` + a passing run). Generalize `flows.linked_playwright_test`
  usage to a language-agnostic `linked_test` (keep the column, treat any test path as valid) so
  pytest/other projects are first-class. **Held for Q2** (leaploop's pytest decision).
- **Acceptance:** a flow cannot read `passing` without a linked, passing test; linking the 12 leaploop
  pytest tests yields a real `test_status`.

## D4 — Adopt Vale + lychee (free, local, at the gate) → R-DOC-2 / R-DOC-6 / R-DOC-7
- **Install** Vale (MIT) + lychee (OSS) on VAULT7A (both single binaries; no service).
- **Config (in the plugin, versioned):** `scripts/doc-lint/.vale.ini` + a `styles/Ottomate/` with rules:
  banned-terms (per-project list generated from that project's dropped features + superseded ADRs —
  R-DOC-2), required-sections (§4 of the standard — R-DOC-6), provenance-header-present on generated
  docs (R-DOC-1). `lychee` config for link checking (R-DOC-7).
- **Runner:** `scripts/doc-lint/run.mjs --project <slug>` → runs Vale + lychee over the repo's Layer-2/3
  docs, exits non-zero on violation. Wired into pack-up + the deploy gate (advisory→blocking by `doc_gate`).
- **Acceptance + must-FAIL:** a doc containing a banned dropped-term (e.g. "Telegram" on leaploop) → Vale
  non-zero; a broken link → lychee non-zero; clean docs → exit 0.

## D5 — Generate reference docs from the registry → R-DOC-1 / R-DOC-9
- **File:** `scripts/generation/gen-reference-docs.mjs` — render a `FEATURES.md` (+ optionally flows/pages
  reference) from the registry with the provenance header; write to the project repo. Wire into 4.8
  integrate + pack-up so generated docs never go stale.
- **Acceptance:** running it reproduces the same file for an unchanged registry (idempotent); the header
  names the commit; a hand-edit is overwritten on next run (and flagged by R-DOC-1 in the meantime).

## D6 — Wire the skill + standard + register (doc-debt discipline)
- Lock `references/documentation-standard.md` (owner) → referenced from `SKILL.md` (a "Documentation"
  cross-cutting row) + `stage-4-mini-pipeline.md` 4.8 + `stage-1-*` (spec authoring uses the AC/section
  templates) + `pack-up-ritual.md` (Vale/lychee + regenerate).
- Regenerate `tracker-api-inventory.md` for any new routes; update `SKILL-REGISTER.md` with a
  "Documentation standard + freshness enforcement" row, `Enforced? = no` until D7 proves each rule.

## D7 — Leaploop backfill + PROVE (the pilot)  [partly Q2]
Backup-first; propose-from-evidence, owner confirms each:
1. **Purge dead capability** (R-DOC-5): fix `flow-discovery-triage` step to its real outcome; sweep the
   registry for other Telegram remnants.
2. **Freshness** (R-DOC-3): reconcile the ~1-month freeze (registry 2026-06-02 vs repo 2026-07-02) —
   walk the changes, owner confirms, bump specs.
3. **Prose fixes** (R-DOC-2/7): fix 74-vs-41, add Ashby/Workday to the ATS list, **retire
   `LEAPLOOP_BRIEF.md`**; run Vale/lychee clean.
4. **Regenerate** Layer-1 reference from the corrected registry (D5).
5. **[Q2] Link the 12 pytest tests** → real `test_status`; kill `feat-auth-deploy`'s false `passing`.
6. **Arm** leaploop `doc_gate` (off→warn→block) once clean; set `Enforced? = yes` naming the test.
- **Evidence:** the violations JSON before (dead-capability + stale-spec + unbacked-pass present) → after
  (clear); Vale/lychee red→green; the retired BRIEF; the regenerated reference.

---

## Sequencing + risk
- **D0–D2 + D4–D6** are standard-independent-enough to build once the standard is locked. **D3 + D7 step 5**
  wait on Q2 (next session).
- Same discipline as Phase 3: ONE-DOOR (all DB via API) · `POST /api/backup` before every write/deploy ·
  commit only my files · deploy-as-I-go, health-check after · prune only synthetic rows · reuse the ramp
  so nothing blocks all projects on day one.

## Effort (honest)
Low-to-moderate. D1/D2 are ~3 SQLite rules + one integrate check against existing machinery. D4 is config +
a runner for two single-binary tools. D5 is one generator. D7 is the bounded leaploop backfill. The
heaviest *decision* (D3/Q2) is deferred. Estimate: one focused build session for D0–D6, a second for D7.
