# Anti-Gaslight Detection Rules

> **Header rewrite (2026-06-10):** the canonical implementation is now LIVE:
> **`GET /api/anti-gaslight/violations[?project_slug=<slug>]`** — 5 rules reimplemented in
> SQLite (built 2026-06-10; `app/api/anti-gaslight/violations/route.ts` in the app repo).
> The PostgreSQL SQL that used to fill this file (jsonb/ILIKE/LATERAL/NOW) could never run
> against the SQLite DB and has been removed. This file keeps only each rule's
> intent / severity / when-it-fires prose. For rule logic, the endpoint is authoritative.

The substrate that catches scope drift, silent additions, missing verification, and other gaslighting patterns. Rules query the phase ledger tables (see `ledger-tables.md`) and entity tables — empty ledger tables detect nothing (see `ledger-writes.md`).

**Rule → live implementation map:**

| Rule (this file) | Live rule id in the endpoint | Status |
|---|---|---|
| 1 — Unreconciled claims | `unclaimed-done` (HARD) | Live |
| 2 — Silent provenance | — | Prose-only; enforced as source-substring discipline at extraction time |
| 3 — Silent drops | `silent-drops` (SOFT) | Live (detects stalled iteration items; ND1-sketch drop check remains prose-only) |
| 4 — Coverage gaps | `missing-acceptance` (HARD) | Partially live (AC-presence check; must_haves mapping remains prose-only) |
| 5 — must_haves / non_goals violations | — | Prose-only; enforced server-side at the 4.3 lock validation |
| 5b — Deploy gap | `untested-deploys` (HARD) | Live |
| 6 — Phase order violations | — | Prose-only |
| 7 — Stale verifier | `stale-verification` (SOFT) | Live |

**When rules fire:**
- Every stage transition (SO1 verification, Stage 2 verification, Stage 3 deploy gate, Stage 4 verifier-result/integrate) — HARD halt on any rule violation
- Every pack-up — SOFT warning if any violations detected
- Every `/ottomate <slug>` invocation — INFO surfaces unresolved violations as a session-start warning

**Severity:**
- HARD = stage transition refused; user must fix
- SOFT = surface via AskUserQuestion at appropriate moment
- INFO = surface in pack-up summary; no action required

---

## Rule 1 — Unreconciled claims

**What:** A "done" assertion (coder agent, iteration summary, chat claim) was never reconciled with a verifier verdict — or a feature sits at done with no claim row at all.

**Why:** Claude or the skill claimed completion without the verifier sub-agent confirming. Verifier is anti-gaslight bedrock.

**Severity:** HARD at stage transition; SOFT at pack-up.

**Live check:** rule `unclaimed-done` in `GET /api/anti-gaslight/violations`.

**Feeding it:** skill must POST a `feature_claims` row on every "done" assertion and PATCH `reconciled_with` after the verifier completes (see `ledger-writes.md`). No claim rows → nothing to reconcile → rule fires on done-features with zero claims.

**Remediation:** re-run verifier on the flagged feature. If verifier still BLOCKs, revert the phase transition and address findings.

---

## Rule 2 — Silent provenance

**What:** A features / flows / pages / components / risk_instances row exists with no `_provenance.source_substring` (or `why_inferred`) and no `derived_from_sketch_id` ancestor link.

**Why:** Claude added an entity that doesn't trace to user input or an upstream sketch. Anti-hallucination guard violated.

**Severity:** HARD at every stage transition; SOFT at pack-up.

**Live check:** not in the live 5 — enforced upstream as the source-substring rule on every Claude extraction (Stage 0 intent, Stage 4 classify).

**Remediation:** surface the flagged entity; user confirms (provenance becomes `user_typed_at_<sub-step>`) or rejects (entity deleted; ADR if used downstream).

---

## Rule 3 — Silent drops

**What:** A user idea disappeared without acknowledgment — a finalized ND1 sketch with no corresponding entity row and no ADR documenting the drop, or a locked iteration item that stalls in locked/building and never reaches integrated/rejected/deferred. A locked item the user decides not to build is closed via **defer-with-reason** (`POST /api/iterations/<id>/items/<itemId>` with a mandatory `reason` → status `deferred`); the reason is the acknowledgment that prevents this from being a silent drop.

**Why:** Classic gaslight pattern: the user asked for it, it quietly never happened.

**Severity:** HARD at Stage 1 → Stage 2 transition; SOFT at pack-up.

**Live check:** rule `silent-drops` in `GET /api/anti-gaslight/violations` (items stuck >7 days after lock). The ND1-sketch variant is checked as prose during SO1 verification.

**Remediation:** user either creates an ADR explaining the drop ("out of scope"), defers-with-reason, or restores the item. **Doc purge (adr from cointrail deep-dive):** when a feature is dropped/deferred, the Stage-4 doc-reconcile step (4.8) must also remove it from the rendered docs — README, architecture diagrams, pages, flows, public_docs — not just flip the DB row. A feature absent from the DB but still named in the showcase is itself a gaslight surface.

---

## Rule 4 — Coverage gaps

**What:** A `must_haves` entry is unmapped to any feature / flow / page / AC; a success criterion has no covering AC; or a feature past planning has zero acceptance criteria.

**Why:** User's stated requirements aren't reflected in what was built — silent narrowing. With 0 ACs, nothing objective defines "done".

**Severity:** SOFT at every stage transition (HARD at SO1 verification if must_haves coverage = 0); INFO at pack-up. AC-presence is HARD (the API also 422s on `building` with 0 ACs).

**Live check:** rule `missing-acceptance` in `GET /api/anti-gaslight/violations` (AC-presence). must_haves/success-criteria mapping is checked as prose during SO1 verification.

**Remediation:** add a covering feature/AC, or relax the must_have/success criterion via ADR.

---

## Rule 5 — must_haves / non_goals violations

**What:** An iteration item's `proposed_change` conflicts with locked `must_haves` or `non_goals` and no override ADR exists.

**Why:** Stage 4 trying to violate rails the user explicitly set — the exact pattern the 4.3 lock-in gate exists to prevent; this rule catches it if lock-in failed.

**Severity:** HARD at Stage 4.3 lock; HARD at 4.8 integrate; SOFT at pack-up for open iterations.

**Live check:** not in the live 5 — enforced server-side in the `POST /api/iterations/<id>/lock` validation (rails check), with violations requiring an explicit override ADR.

**Remediation:** reject the item, edit it to comply, or create an explicit override ADR (which retires the must_have/non_goal).

---

## Rule 5b — Deploy gap

**What:** A deploy happened with no test run for the same project in the day before it — or a feature sits BUILT >7 days with no deploy artifact.

**Why:** Shipping unverified builds (or claiming built without shipping) erodes the evidence chain.

**Severity:** HARD (untested deploys); SOFT (stale undeployed builds).

**Live check:** rule `untested-deploys` in `GET /api/anti-gaslight/violations`. Requires CI to POST `test_run` and `deploy_artifact` rows (see `ledger-writes.md`).

**Remediation:** run the flow tests against the deployed commit; post the test_run row.

---

## Rule 6 — Phase order violations

**What:** A `<entity>_phase_transitions` ledger shows a skipped phase (e.g. `PROPOSED → INTEGRATED` with no SPECCED/BUILD_READY/BUILDING/VERIFIED rows), or a transition whose `from_phase` doesn't match the previous row's `to_phase`.

Valid feature chain: `PROPOSED → SPECCED → BUILD_READY → BUILDING → VERIFIED → INTEGRATED`; `any → DROPPED` only via ADR; `INTEGRATED → REGRESSED → BUILDING` for Stage 4 re-iteration.

**Why:** A stage was skipped silently; the ledger should be a complete record.

**Severity:** HARD at every transition; HARD at pack-up.

**Live check:** not in the live 5 — prose-only; check the ledger when investigating suspicious transitions.

**Remediation:** write the missing transition row (write was missed) OR roll back to the previous phase and walk through normally (phase was illegally skipped).

---

## Rule 7 — Stale verifier

**What:** A feature was edited after its latest verifier APPROVE — the last verdict no longer covers current state.

**Why:** Stage 4 may have changed code without re-running the verifier. Coverage erodes.

**Severity:** SOFT at every Stage 4.8 integrate; INFO at pack-up.

**Live check:** rule `stale-verification` in `GET /api/anti-gaslight/violations`.

**Remediation:** re-run the verifier on edited features even when the iteration item didn't directly target them (regression risk).

---

## Cross-cutting: where rules surface

- **Every stage transition:** run `GET /api/anti-gaslight/violations?project_slug=<slug>`; refuse the transition on any HARD violation. (`GET /api/audit/<slug>/anti-gaslight-violations` is the per-project wrapper of the same rules.)
- **Every pack-up:** same call; surface SOFT + INFO findings in the pack-up summary.
- **Session start:** same call on first project load; surface unresolved findings as a one-line warning. User drills in via the audit view or addresses inline.

Schema substrate (the `current_phase` / `_provenance` / `derived_from_sketch_id` columns and the phase transition tables) is documented in `ledger-tables.md`.

---

## Why this matters

The user's stated pain: scope drift, silent additions, "Claude says it's done but I'm not sure." Without rules, every stage transition relies on Claude's narrative honesty. With rules, every transition runs an objective check that doesn't trust narrative.

**Rules detect what narrative hides.**
