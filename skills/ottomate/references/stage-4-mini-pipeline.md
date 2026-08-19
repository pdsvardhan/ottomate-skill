# Stage 4 — Iterate (Mini-Pipeline per User Input)

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied (changelog archived at `_archive/references/stage-amendments.md`; restated lines collapsed 2026-06-10 — confidence gate, no-skip verifier, AC regression are in the body; detection rules per `references/anti-gaslight-rules.md`). Operative deltas:
> - **4.2 Classify:** uses lite context-packet, NOT full SO1; implicit/inferred items get `why_inferred` + forced user confirmation
> - **4.3 Lock-In Gate:** **must_haves + non_goals shown as visible rails** in the panel; rails violations need an explicit override ADR; 1-hour inactivity → `pending_user_review` (Codex P2 #15)
> - **Phase ledger:** `iteration_items.status: pending-review → locked → building → verifier-pending → verified → integrated` written to `iteration_item_transitions`; touched features go `INTEGRATED → REGRESSED → BUILDING → VERIFIED → INTEGRATED`. Terminal closed states that satisfy integrate: `verified`/`integrated`, `rejected` (pre-lock drop or verifier BLOCK — **not** a coder-reported build failure, see 4.6), `deferred` (post-lock drop-with-reason, #115).

The continuous-improvement loop. Each iteration is its own mini-pipeline with the same anti-gaslighting protections as the main flow. **The 4.3 lock-in gate is the most important step in this entire skill** — it's the explicit anti-gaslighting bridge between user intent and Claude's work.

> **Ledger writes (2026-05-13):** every iteration that touches a feature must **POST a `feature_claim` row** at 4.6 mini-build completion (source: `iteration-summary`) and **PATCH it after 4.7 verifier** completes. See `references/ledger-writes.md`. Unreconciled iteration claims fire anti-gaslight Rule 1. The PATCH's `reconciler_id` is the `verification_report.id` returned by the 4.7 `verifier-result` call — that endpoint is the single writer of the item's report; do **not** also POST `/api/verification-reports` (single-write design, 2026-07-16; it now 400s for stage-4 items).

## When this stage runs

When project is past Stage 3 (deployed, lifecycle = `building` / `shipped` / `maintained`) and user submits feedback via:
- Tracker per-flow bug report (single-flow context)
- Tracker project-level mega-prompt (whole-project context, may span flows)
- Direct chat with Claude (free-form)
- **Visual-QA batch** (DOM-commenter export) — see `references/stage-4-visual-qa.md` (Task 1, 2026-07-23)
- (future) Auto-feedback from runtime monitoring (GlitchTip alerts, perf regressions)

## Pre-flight: Stage 4 sanity check

See `references/sanity-check.md` Stage 4 section. 6 checks. Halt on HARD; warn on SOFT.

## Sub-stages (8)

### 4.1 — Intake

Capture raw text into `reports` table:

```sql
INSERT INTO reports (project_slug, flow_id, raw_text, status, submitted_at)
VALUES (?, ?, ?, 'pending', NOW());
```

`flow_id` is NULL for project-level prompts. Original text preserved verbatim — never edit user input.

### 4.2 — Classify (extract structured items)

User triggers manually (clicks "Analyze" in Ottomate, or types "analyze" in chat). The classifier prompt is in `prompts/classify-text.md`.

Produces a list of structured items, each with (flat shape, matching the live `POST /api/reports/<id>/classify` body — see `prompts/classify-text.md`):
- `item_type`: `bug` / `new_feature_request` / `feature_modification` / `flow_modification` / `page_modification` / `component_modification` / `risk_addition` / `re_wire` / `revamp` / `observation` / `question`
- `title`: short statement (AI-generated)
- `description`: cleaned excerpt from original text
- `target_kind` + `target_id`: which existing entity this affects — `target_kind` ∈ `feature|flow|page|component|integration|secret`, `target_id` the entity id (both null if new)
- `proposed_change`: structured representation of the change
- `confidence`: 0.0-1.0 (low confidence triggers user clarification)

If any item's confidence < 0.7, AI asks the user to confirm the split BEFORE proceeding to 4.3:

```
"I see 5 items in your message but I'm not sure about #3 — is it a bug 
('search returns wrong results') or a feature request ('search should 
filter by date')? Please clarify."
```

### 4.3 — 🆕 Propose & Confirm (LOCK-IN GATE)

**This is the most important sub-stage.** Without it, Stage 4 is just gaslighting waiting to happen.

The skill presents the extracted items to the user via the Ottomate UI's "Pending Approval" panel (or chat if Stage 4 is running in chat mode).

Layout:

```
┌────────────────────────────────────────────────────────────────────┐
│  ITERATION #N — Project: <slug>                                    │
│                                                                    │
│  [▾ ORIGINAL MESSAGE (collapsible)]                                │
│  "the search is broken and we need a dashboard..."                 │
│                                                                    │
│  EXTRACTED ITEMS (review before locking):                          │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Item 1 — BUG                                  [edit][✗]    │    │
│  │ Title: Search returns empty results                        │    │
│  │ Affects: flow-search-add  ·  feat-search                  │    │
│  │ Description: User reports search field returns no results │    │
│  │ Confidence: 0.95                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Item 2 — NEW FEATURE                          [edit][✗]    │    │
│  │ Title: Dashboard page                                      │    │
│  │ Affects: (new page) page-dashboard                         │    │
│  │ Description: Add a dashboard view                          │    │
│  │ Confidence: 0.6                                            │    │
│  │ ⚠ Low confidence — please confirm                         │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  [+ Add item I missed]   [✓ Approve all]   [✏ Edit list]   [✗ Cancel]│
└────────────────────────────────────────────────────────────────────┘
```

User actions:
- **Approve all** — locks the list as-is, proceeds to 4.4
- **Edit individual item** — modifies title / description / target / proposed_change
- **Split item** — one item becomes two (e.g., "this is actually 2 bugs, not 1")
- **Merge items** — multiple items combine
- **Reject item** — removes from list (e.g., "actually that's not a real issue")
- **Add new item** — user types a new structured item

When user clicks "Lock & build", the list is committed and 4.4 starts.

**Critical:** No code changes happen before user clicks "Lock & build". The skill MUST NOT proceed past 4.3 without explicit lock action.

### 4.4 — Route per locked item

For each item in the locked list:

| Item type | Route |
|---|---|
| `bug` (trivial — typo, color, copy fix) | Direct fix path (skip 4.5, go to 4.6 mini-build) |
| `bug` (standard) | 4.5 mini-staging (light) → 4.6 mini-build |
| `new_feature_request` | 4.5 mini-staging (full SO1 update) → 4.6 mini-build |
| `feature_modification` / `flow_modification` / `page_modification` | 4.5 mini-staging (targeted SO1 update) → 4.6 mini-build |
| `component_modification` (HARD: must route through component-pick) | **4.4.5 component-pick gate** → 4.5 mini-staging → 4.6 mini-build |
| `new_feature_request` involving any UI component (HARD: must route through component-pick) | **4.4.5 component-pick gate** → 4.5 mini-staging (full SO1 update) → 4.6 mini-build |
| `risk_addition` | 4.5 mini-staging (Doc 7 update) → no build needed unless triggers code change |
| `re_wire` | 4.5 mini-staging (multi-doc cascading update + ADR) → 4.6 mini-build |
| `revamp` | 4.5 mini-staging may invoke mini-Stage-2 (UI Master Plan re-run) → 4.6 mini-build |
| `observation` | Log only — append to `iteration-log.md`, no code |
| `question` | Respond in chat, no code |

### 4.4.5 — Component-pick gate (UI items only)

**Trigger:** any locked iteration item where `item_type = 'component_modification'`, OR `item_type = 'new_feature_request'` AND title/description/proposed_change refer to UI (button, card, modal, animation, layout, navigation, etc.). Err on the side of triggering — false positives just add a confirmation step; false negatives reproduce the gaslighting pattern that hit media-dashboard's Stage 2.

**Process:**

1. Skill: `GET /api/iterations/<id>/items/<itemId>/component-options?category=<inferred>&tags=<modern|animated|...>` → returns up to 6 candidates from `master_components`, ranked by relevance to the item's title + description.
2. Skill renders a single message:
   > *"This item touches a UI component. Open the asset library at `https://ottomate.vault7a.xyz/iterations/<id>/items/<itemId>/pick-component` and click 'Use this' on your choice. I'll wait."*

   (Owner-facing host only — `localhost:8110` is a dead link for the owner; see `references/credentials.md`.)
3. Skill polls `GET /api/iterations/<id>/items/<itemId>` every ~10s checking `proposed_change.picked_component`. Once set, proceed to 4.5.
4. Chat-fallback (rare): if user prefers chat, render top 3 options as `AskUserQuestion` previews and POST `/pick-component` directly. UI page is the recommended path because it shows full source + framework tags + variants + previews.

**Why this exists separate from Stage 2.4:** Stage 2.4 runs ONCE per project at initial setup (every page × every component). This 4.4.5 gate runs PER ITERATION ITEM, scoped only to what changed. Same `master_components` library, same ≥2-3-options-with-preview pattern. User direction: *"rather than making a stage 4 project go through a step of stage 2, lets add a similar process in stage 4 whenever ui components issues or new components are being added"*.

If `picked_component` is already set on the item (user re-locked an item that had a previous pick), skip 4.4.5 unless the user explicitly requests another pick.

### 4.4.6 — Design-taste pre-pick (aesthetic items only, 2026-07-02)

**Trigger:** any locked item whose acceptance is a matter of TASTE, not correctness — palette / color scheme, typography, visual style, "make it look better". (Distinct from 4.4.5, which picks a component; this picks a *direction*.)

**Rule: options BEFORE build, never after.** Present 2-3 concrete directions cheaply — swatches, a reference URL, one mocked screenshot region, or the existing/official design as a named option — via AskUserQuestion, and let the user pick before any full variant is built. Building N complete variants and asking afterwards wastes the build AND the user's attention (2026-07-01 cap-a: two full color schemes built, verdict *"i hate both, i like the official one the best"* — the official palette was never offered as an option).

Always include "keep the current/official look" as one of the options when an official or statutory design exists.

**Scale the fidelity to the item (Task 2, 2026-07-23).** A cheap item (one button colour, a font tweak)
stays swatch-level as above. A **whole-surface restyle** ("redesign the card", "make the dashboard feel
premium") runs the full **A→B→C visual loop** (`references/stage-2-design-method.md`): show 2–4 **real
interactive variants** (from `master_components`, tagged by source) as one evolving **Claude Artifact** at
a stable URL, pick/mix, rebuild the same URL, lock. Honour the **colour-budget** + **vary-on-the-open-axis**
rules and record each decision to `ui_master_plans.design_ledger` (uncapped). Options are ALWAYS before
build — never build N full variants and ask after.

### 4.5 — Mini-Staging

Update the affected SO1/SO2 docs:

- **For `new_feature_request`:** Add entry to `features.yaml` + derive related entries in `flows.yaml`, `ui.yaml`, `data.yaml`, `risks.yaml` as needed. AI proposes; user confirms via dialog if scope unclear.
- **For `*_modification`:** Surgical update to the specific entry in the relevant doc. Validate cross-doc consistency (e.g., if a flow's linked features change, the feature row's linked_flows must update too).
- **For `re_wire`:** Cascading updates across multiple docs + auto-create ADR (`decisions/<date>-iter-<N>-rewire-<topic>.md`) documenting the scope shift. Anti-gaslighting: re-wires must be explicit, not silent.
- **For `revamp`:** May re-run Stage 2 sub-stages (UI Master Plan, component selection). Heavier; user confirms scope at start. Auto-create ADR.

All staging updates are written to Ottomate DB (canonical) and reflected in YAML mirrors on next commit / pack up.

### 4.6 — Mini-Build

Scoped Stage 3 code generation:
- Branch per iteration (e.g., `iter-<N>-<date>`)
- Code change limited to files affected by the locked items
- Tag-based test selection: only tests touching changed files run (using Playwright tags / Vitest patterns)
- No full nightly suite — that runs on cron, not per iteration
- Auto-fix loop with same 3-iteration bound

### 4.6.5 — Design-regression gate (Phase 2 snapshot differ, aesthetic items only)

After a rebuild that touches a target with **locked design decisions**, run
`diffAgainstSnapshots(lockedDecisions, currentByAxis, currentSourceByAxis)`
(`scripts/generation/ledger-context.mjs`) against the ledger. A **regression** — a locked value or its
source region silently changed — **blocks** until the owner unlocks it with a reason (PATCH 422 without
`unlock_reason`, G3 rule 13). This is the ledger protecting committed design work: a later edit cannot
quietly undo a locked decision. *Source/value-level; a rendered-pixel diff is the computed follow-up.*

### 4.7 — Verifier (MANDATORY)

> **Two verifiers run at this step** (consistent with `SKILL.md:86`). The **code verifier** (the 4-pass,
> immediately below) on every item; the **feature verifier** — the *sibling gate* documented further down
> this section — additionally on every **user-facing** item. "Done" = **both** green (block cv/public,
> warn personal — adr-014). Read to the "Feature verifier — the sibling gate" paragraph; §4.7 is not
> code-verifier-only.

Run the full 4-pass verifier (see `references/stage-3-verifier.md`) PER ITEM, not per iteration. Each item gets independent verification.

Output: per-item `verification_report` blocks merged into the iteration's report.

**Single-write (2026-07-16):** post each item's verdict ONCE, via `POST /api/iterations/<id>/items/<itemId>/verifier-result`. That single call inserts the `verification_reports` row, links it to the item (`item.verifier_result.report_id`), and returns it as `verification_report` in the response. Take `verification_report.id` from that response as the `reconciler_id` for the 4.6 feature-claim PATCH. **Do NOT also POST `/api/verification-reports`** — that produced two near-duplicate rows per item (mapsofbharat iter 78/79) and now 400s for stage-4 items. See `references/ledger-writes.md`.

**Stub detection still hard-fails.** No exceptions for "small fixes" — that's where stubs creep in.

**Feature verifier — the sibling gate (user-facing items).** For any item that touches a
user-facing feature/flow, ALSO run the **feature verifier** (`references/stage-3-feature-verifier.md`,
`prompts/feature-verifier-prompt.md`) scoped to that one item, alongside the code verifier. It
drives the real app + asserts **system state** (fs/DB-via-API/poll) with evidence, and posts its
case×outcome matrix to `POST /api/feature-verification-reports` (+ mirrors per-critical-flow
pass/fail to `flow_test_runs` via `POST /api/flows/<id>/test` `ran_by:'automated'`). The item is
"done" only when **both** verifiers are green (block cv/public, warn personal — adr-014). Advisory
(never blocking) for pure-backend/no-UI items. AI Explorer/Judge (Claude, in-session) never gate;
fail-closed (a skipped/mocked case is never green). The owner reviews the case matrix before the run.
**For an owner-reported bug (P2-B, 2026-07-28), the matrix is authored from the bug report — claim-blind —
with a `reproduce_symptom` case: the runner confirms it RED on the pre-fix state and GREEN after the
claimed fix (SWE-bench FAIL_TO_PASS + a PASS_TO_PASS sweep), and downgrades any run that is not
owner-reviewed / untampered / claim-blind to advisory (never a silent APPROVE). See
`references/stage-3-feature-verifier.md` + `docs/plans/2026-07-28-task3-P2{A,B}-*`.**
**Cadence (P3-C, 2026-07-29):** verification scales to the change-tier (T0 backend/copy → T3
new-page/redesign, inferred from the impacted files). This per-item Stage-4.7 run is the **on-fix /
on-commit** leg (impacted app only); a **VAULT7A cron also runs the full matrix nightly at 03:30**
across every app in `data/feature-verify-apps.json` (`run.mjs` orchestrates all three, `postTestRun`
wired). See `docs/plans/2026-07-28-task3-P3C-gate-wiring-plan.md`.

### 4.7b — Graduation offer (Stage 4 S10, 2026-07-27)

After the verifier passes, ask one question of the item: **did it produce something worth graduating
into `master_components`?** A locked bespoke variant that another project would want is the case.

**It ASKS. It never auto-graduates.** Graduation puts a component in front of every future project, so
it is the owner's call — the same reasoning as the no-anatomy-approval-gate ruling, which auto-derives
*within* a round but never auto-decides *across* projects.

```
node scripts/generation/graduate.mjs   # via the module: graduate(decision, source, provenance, opts)
```

`graduate()` runs six gates in order and **fails closed at each**, so nothing partial is ever written:

| Gate | Refuses when |
|---|---|
| `locked` | the decision is still `proposed` — it has not been chosen |
| `provenance` | any of the six H1 fields is missing (**`requireAll`**: at graduation we know all six, so accepting fewer would be choosing not to record what we have) |
| `licence` | the SPDX id is RED — and **unknown is RED**, never AMBER |
| `tokenised` | any baked-in literal colour. H1: a `#fff` is *a downgrade, not an entry* — and this is the one moment the round's own token names are known |
| `grade` | the A–F grade is not A or B |
| `dedupe` | it duplicates an existing component structurally **or** visually |

Without `apply: true` it is a **dry run** that never calls the API. With `apply: true` it also requires
`backedUp: true` — **`POST /api/backup` is asserted, not assumed**. Duplicates are *reported*: two
components can look identical and differ in licence or provenance, and choosing the survivor is a
judgement (`preferSurvivor` prefers the better-provenanced one and says by how much).

Tests: `graduate-write.test.mjs` 19/19 — every gate has a must-fail case asserting the catalog was
**provably untouched** (the injected `post()` recorded zero calls), not merely that an error was
raised.

### 4.8 — Integrate + Trace Report

When all items are verified:
1. Merge iteration branch to main
1b. Milestone mirror (adr-018): `npm run mirror:write -- <slug>` on the host, then commit + push the project repo — the Gitea recovery net fires at integrate, not only at pack-up
2. Run final regression check (existing acceptance criteria for affected features must still pass)
3. Update Ottomate:
   - Bugs: `status: open → fixed` with verifier evidence
   - Feature requests: status `proposed → done`, linked features.yaml entry created
   - Coverage updated (test coverage delta)
   - Verification report appended
4. Auto-create ADR if iteration was significant (re-wire, revamp, scope change)
4b. **Doc-reconcile (post-lock → docs) — closes the SO1-lock backfill gap.** Post-lock spec edits previously stopped at the DB and never reached the rendered showcase. For every item in this iteration, propagate its outcome OUT to the docs + ADRs, not just the entity row:
   - **dropped / deferred / rejected feature** → *purge* it from README, architecture diagrams, pages, flows, and `public_docs` — do not leave it named in the showcase (a feature absent from the DB but still rendered is a gaslight surface; anti-gaslight Rule 3).
   - **modified feature / flow / page** → update the corresponding doc sections so the rendered overview/features/flows/pages/architecture match the new DB state.
   - **re-wire / revamp / scope-shift** → confirm an ADR exists (id `adr-NNN-<slug>`, rule 14) and curate it for display (rule 17: recruiter title + `curated` + cat-tag or hide).
   - Then run the milestone mirror (step 1b above already did `mirror:write`); verify the YAML + repo docs reflect the reconcile before notifying.
   - **Enforced, not prose (Phase 4, 2026-08-04):** this reconcile is no longer trust-based. Follow
     `references/documentation-standard.md` (the layered doc model + rules R-DOC-*). On a **doc-gated**
     project (`projects.doc_gate='block'`) the integrate call itself **refuses** unless every
     **behaviour-changing** item left a spec update behind — `feature_modification`, `flow_modification`,
     **`bug`, `re_wire`, `revamp`** (D2 spec-sync, R-DOC-10). A feature/flow target must have its spec
     touched this iteration (updated_at ≥ lock); a project-wide re_wire/revamp must have touched *some*
     feature/flow spec. **Turn the change into the spec:** a fixed bug becomes a new/edited acceptance
     criterion (as the music-upload multi-artist defect became AC 540); a re-wire updates the affected
     features/flows + an ADR. **Cosmetic escape hatch** (typo/colour/copy that changes NO behaviour): set
     the item's `proposed_change.spec_impact='none'` with a reason in `notes` — the classifier should set
     this at 4.2 for genuinely cosmetic items so the gate doesn't false-block. Then regenerate the reference
     (`scripts/generation/gen-reference-docs.mjs --project <slug>`), run the doc-lint
     (`scripts/doc-lint/run.mjs --project <slug>`: Vale retired-terms + lychee links), and confirm
     `GET /api/anti-gaslight/violations?project_slug=<slug>` is free of HARD `dead-capability` /
     `unbacked-pass` before notifying. `stale-spec` is advisory.
5. Notify user with **Trace Report**:

```
ITERATION #N — Trace Report

Original message:
"the search is broken and we need a dashboard"

Items locked at 4.3 (after your edits):
  ✅ Item 1 (bug):   "Search returns empty results"
                      → flow: flow-search-add | feature: feat-search
  ✅ Item 2 (mod):   "Add metrics widget to home page"
                      → page: page-home | new component: metrics-widget
                      (changed from "new feature: dashboard page" per your edit)

Built per item:
  Item 1 → 3 files changed (api/search.ts, hooks/use-search.ts, components/search-bar.tsx)
           Tests: 5/5 pass | Verifier: ✅ verified | Stub-detection: clean
  Item 2 → 4 files changed (app/page.tsx, components/metrics-widget.tsx, ...)
           Tests: 8/8 pass | Verifier: ✅ verified | Stub-detection: clean

Acceptance criteria status (regression check):
  feat-search: 3/3 still passing
  feat-home-overview: 4/4 still passing

Coverage delta: +12% on flow-search-add, +5% on flow-home-load
ADR: none required (no re-wire / revamp)

🎯 Iteration complete. Live at https://<slug>.vault7a.xyz
```

The Trace Report makes the "what you asked → what got built → what's verified" mapping visible. **This is the anti-gaslighting payoff.**

## Outputs (SO4 — per iteration)

| Artifact | Where |
|---|---|
| Updated SO1/SO2/SO3 docs | Tracker DB + YAML mirrors |
| Bug status updates | Tracker DB |
| Feature additions | Tracker DB + `features.yaml` |
| `iterations/iteration-<N>-<date>.yaml` | Project repo |
| `decisions/<date>-iter-<N>-*.md` (ADRs for re-wires/scope shifts) | Project repo |
| `verification-report.yaml` (appended to project's lifetime report) | Project repo |

## Cost notes

- Mini-build incremental — only changed files compile, only relevant tests run
- Verifier scoped per item — verifier doesn't re-check unchanged code
- Full nightly suite NOT triggered per iteration (runs on cron)
- Tracker DB writes are cheap (local SQLite)
- Most iteration cost: classifier prompt + per-item coder agent + per-item verifier dispatch

Acceptable for the failure mode it prevents (gaslighting).

## Concrete Ottomate API calls

These map each sub-stage to the implemented Ottomate endpoint (see `references/tracker-api.md` for the full surface). All mutating calls require `Authorization: Bearer $(cat /opt/homeserver/ottomate/.token)`.

| Sub-stage | API call | Notes |
|---|---|---|
| 4.1 Intake | `POST /api/projects/<slug>/reports` body `{raw_text, source, flow_id?}` | Returns `{report: {id, status: 'pending', …}}` |
| 4.2 Classify (skill calls Claude itself, then submits) | `POST /api/reports/<id>/classify` body `{classified_by_session, items: [...]}` | Skill runs the classifier prompt locally → posts the structured items here. Returns `{iteration, items}`. Re-classify is rejected with 409. |
| 4.3 Lock-in gate (user UI; skill polls) | `GET /api/iterations/<id>` (full state) and `GET /api/iterations/<id>/status` (terse) | Skill polls status until it transitions from `awaiting-lock` → `building`. |
| 4.3 Add user-authored item | `POST /api/iterations/<id>/items` body `{item_type, title, description, target_kind, target_id, …}` | Always sets `user_edited=true`, `confidence=1`. |
| 4.3 Edit item | `PATCH /api/iterations/<id>/items/<itemId>` partial body | Marks `user_edited=true`. Locked iterations are 409. |
| 4.3 Reject item (pre-lock) | `DELETE /api/iterations/<id>/items/<itemId>` | Soft-rejects (status='rejected') so the trace report keeps history. Gated to pre-lock statuses; 409 once locked. |
| 4.8 Defer item (post-lock drop) | `POST /api/iterations/<id>/items/<itemId>` body `{reason}` | Defer-with-reason for a LOCKED item the user decides not to build: mandatory `reason` → appended to `notes`, status='deferred'. This is the post-lock drop-with-reason path (bedrock rule 7); without it integrate is unreachable. |
| 4.3 Split item | `POST /api/iterations/<id>/items/<itemId>/split` body `{new_items: [...], delete_original}` | All split items are `user_edited=true`. |
| 4.3 Lock | `POST /api/iterations/<id>/lock` | Server-side enforces confidence ≥ 0.7 OR user_edited; returns 400 with offending item IDs otherwise. Sets `lock_in_audit` JSON. |
| 4.4 Route per item | (skill side, no API) | Skill iterates `items[]` and dispatches per item. |
| 4.5 Mini-staging | Use the existing per-doc CRUD endpoints — `POST/PATCH /api/projects/<slug>/flows/...`, etc. | Each staging change is a normal SO1 mutation. |
| 4.6 Mini-build status | `POST /api/iterations/<id>/items/<itemId>/build-status` body `{status: 'building'\|'verifier-pending'\|'failed', notes}` | Coder agent reports **progress only — build-status can never close an item** (2026-07-16). All three labels fold to item status `building`; detail goes in `notes`. **`verified` → 400** (bedrock rule 4: a coder may not self-certify; only 4.7 `verifier-result` may set it, because that call writes the `verification_reports` row proving it). **`failed` no longer maps to `rejected`** (bedrock rule 7): `rejected` satisfies integrate, so that was a silent post-lock drop with no reason — a failed build now leaves the item OPEN. Closure is always explicit: 4.7 `verifier-result` (APPROVE→`verified` / BLOCK→`rejected`) or defer-with-reason (→`deferred`). |
| 4.7 Verifier result | `POST /api/iterations/<id>/items/<itemId>/verifier-result` body `{recommendation_overall: 'APPROVE'\|'BLOCK'\|'ITERATE', recommendation_reason, pass_a/b/c/d, mandatory_user_review, full_report, verifier_session_id}` | **Single writer** of the item's report: inserts one `verification_reports` row, links it to the item, and returns `{verification_report, item}`. Use `verification_report.id` as the feature-claim `reconciler_id`. Do NOT also POST `/api/verification-reports` (single-write design, 2026-07-16). |
| 4.8 Integrate | `POST /api/iterations/<id>/integrate` body `{trace_report, notes}` | Server validates all items are closed: `verified` / `rejected` / `integrated` / `deferred`. Returns 400 with offending items otherwise. Sets `integrated_at`. Run doc-reconcile (step 4b) before/at integrate. |
| 4.8 Trace report | `GET /api/iterations/<id>/trace` | Returns iteration + items + raw report + verifier reports + lock_in_audit + trace_report. |
| Cancel anytime before integrate | `POST /api/iterations/<id>/cancel` body `{reason}` | Records reason in trace_report. |

### Polling pattern

The skill drives the build loop and polls between dispatches:

```
ITER_ID=...
SESSION=...
while true; do
  STATUS=$(curl -sf http://127.0.0.1:8110/api/iterations/$ITER_ID/status | jq -r .status)
  case $STATUS in
    awaiting-lock|pending_user_review)
      # User hasn't locked yet — wait + retry
      sleep 30
      ;;
    building)
      # Run next pending item: build-status = progress, verifier-result = verdict
      ITEMS=$(curl -sf http://127.0.0.1:8110/api/iterations/$ITER_ID/status | jq -r '.items[] | select(.status=="locked") | .id')
      for ID in $ITEMS; do
        # progress only — build-status may NOT set 'verified' (400 by design, see 4.6)
        curl -X POST -H "Authorization: Bearer $TOKEN" \
          http://127.0.0.1:8110/api/iterations/$ITER_ID/items/$ID/build-status \
          -d '{"status":"building"}'
        # ... dispatch coder, then the INDEPENDENT verifier sub-agent ...
        # the verdict advances the item AND writes its single report; capture the id
        REPORT_ID=$(curl -sf -X POST -H "Authorization: Bearer $TOKEN" \
          http://127.0.0.1:8110/api/iterations/$ITER_ID/items/$ID/verifier-result \
          -d '{"recommendation_overall":"APPROVE","recommendation_reason":"<one-liner>","verifier_session_id":"verifier-'$ID'-<date>"}' \
          | jq -r '.verification_report.id')
        # reconcile the 4.6 feature-claim against $REPORT_ID (see ledger-writes.md)
      done
      ;;
    integrated|cancelled)
      break
      ;;
  esac
done
```

### Skill events for audit

Throughout, emit `POST /api/skill-events` with `event_type` keyed to lifecycle:
- `stage-4-start` when intake captured
- `lock-in-gate` when user reaches 4.3
- `verifier-dispatched` per item
- `verifier-result` per item
- `stage-4-complete` when integrated

These get logged for future audit + UI live-update streams.
