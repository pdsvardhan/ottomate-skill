---
name: ottomate
description: Load and manage Ottomate web project sessions on VAULT7A. Triggered by `/ottomate`, `/ottomate <project-slug>`, or when the user mentions a tracked web project by name. Routes through 5 stages (Stage 0 preprocessing → Stage 1 spec → Stage 2 UI/tech → Stage 3 build → Stage 4 iterate) with anti-gaslighting protections, lock-in gates, an independent verifier sub-agent, and a traceability ledger. Persists state in the Ottomate app at http://127.0.0.1:8110 (server-side).
---

# Ottomate — router (v3.1, slimmed 2026-06-10)

This file routes; it does not restate. Each topic has exactly one owning reference — edit there, never copy here. Refer to pipeline steps by NAME (e.g. "SO1 verification", "component picking", "lock-in gate"), not by sub-step number — numbers have drifted twice and are being retired.

## One system, two halves

The skill owns judgment and dialogs; the Ottomate app owns state, gates, and evidence. Changes to one are reviewed against the other.

- **Server:** `ssh pdsv@192.168.1.10` (key-only; `references/credentials.md` is a locations-only map — it contains no secret values).
- **App API:** `http://127.0.0.1:8110` server-side. Mutations: `Authorization: Bearer $(cat /opt/homeserver/ottomate/.token)`.
- **Projects:** `/mnt/storage/websites/<slug>/` · **Held Type-2 code:** `/staging/code/<slug>/` · **Asset library:** `/mnt/storage/ottomate/assets/components/<id>/`.
- All file ops via SSH; code files written locally then SCP'd (never SSH heredoc).

## Authority order (when documents disagree)

1. Live API behavior.
2. `references/tracker-api-inventory.md` (generated from route code — path/method/auth existence).
3. The owning stage reference (request/response shapes, dialog flow).

If two documents disagree, follow this order AND tell the user about the drift. Never silently pick a side — silent picking is the gaslighting surface this system exists to remove.

## Session start (every session)

1. **Sanity:** `GET /api/sanity-check?phase=bootstrap` (server-side). Clean PROCEED → one status line, move on; open `references/sanity-check.md` ONLY when the verdict is BLOCK or a check failed (2026-07-02 — stop pre-reading 13KB for the common all-green case). Verdict BLOCK → surface the failing checks' `auto_fix` via AskUserQuestion; never execute fixes silently. Results cache 30 min (`sanity_check_runs`). A failing `wal-integrity` check means STOP — do not restart the container; follow adr-015.
2. **Route:** per `references/command-routing.md` (argument parsing, project resolution, state assessment, routing rules). Includes the **quick-resume fast path** (2026-07-02): same project packed up < 2h ago (per the `session-packed-up` skill-event) → skip the style/task ref re-reads and render the inlined QUICK RESUME block; any drift signal falls back to full load.
3. **Surface open tasks:** state assessment calls `GET /api/projects/<slug>/todos` (`references/task-tracking.md`) and lists open items in the load status block — informational, never blocking.
4. **Reload the design ledger (Phase 2, reload-on-resume):** if the project has design decisions, `GET /api/projects/<slug>/design-decisions` and run `resumeSummary(rows)` (`scripts/generation/ledger-context.mjs`) — surface **open** decisions, **locked/frozen** axes (not to be re-offered), and **rejected** values (not to be re-proposed) in the load status block. The ledger is the memory; a resumed design session reads it rather than re-deriving it. Informational at load; it becomes binding when a design round runs (Stage 2 generation inputs).

## Stage references — load only what the session needs

| Stage | Owning references (in order) |
|---|---|
| 0 — preprocess | `stage-0-overview.md` (incl. Type 1/2 detection + T2P catchup) |
| 1 — spec (SO1) | `stage-1-internal.md` → `stage-1-verification.md` |
| 2 — UI + tech | `stage-2-ui-master-plan.md` → `stage-2-design-method.md` (the A→B→C visual loop) → **`stage-2-generation.md` (the producer: anatomy → over-generate 6 → filter 3 → harness config; run in a FRESH sub-agent)** → `stage-2-components.md` → `stage-2-tech-architecture.md` |
| 3 — build | `stage-3-scaffolding.md` → `stage-3-pipeline-setup.md` → (Type 2 only: `stage-3-reformat.md`) → `stage-3-codegen.md` → `stage-3-verifier.md` → `stage-3-feature-verifier.md` (user-facing features) → `stage-3-testing.md` |
| 4 — iterate | `stage-4-mini-pipeline.md` |
| cross-cutting | `output-style.md` (always — includes the trigger-phrase table, merged 2026-07-02); `task-tracking.md` (per-project Ottomate to-dos — read at load, updated at wrap); `ledger-writes.md` (when posting claims/artifacts/test runs); `anti-gaslight-rules.md` (rule definitions); `documentation-standard.md` (what docs a project keeps, their formats, and the R-DOC-* freshness rules — load when authoring/reconciling docs or at 4.8); `pack-up-ritual.md` (at wrap) |

Do not preload anything else. Superseded references live in `_archive/references/` — never load them.

## Stage gates (HARD = stop and re-enter the step)

Gates are never waived. If a gate is unsatisfiable as written, that is a BUG in the gate — stop and tell the user; do not "interpret around" it (adr-014: gates only reference state that can actually be written).

- **0 → 1:** ND1 finalized (staging file complete + user confirmed) · ≥1 success criterion · ≥1 non-goal · ≥1 feature sketch · ≥1 flow sketch · sanity pass. (Risk-concern floor removed 2026-06-10 — `risk_concerns_initial` is optional; Stage 1 sub-step 8 catalogs risks regardless.) Note: `nd1_archive.status = consumed` is set BY Stage 1 intake — it is Stage 1's exit marker, not this gate's condition.
- **1 → 2:** 5-pass SO1 verification passed · all features SPECCED · all flows step-locked · YAML mirrors hash-match.
- **Within 2:** UI master plan saved via `PUT /api/projects/<slug>/ui-master-plan` BEFORE component picking · ≥2-3 options per component slot from `master_components` (browser page `/projects/<slug>/components-pick` primary, chat AskUserQuestion fallback) · at exit every component `picked` with `asset_library_ref` OR has documented `skip_reason`. **When a design ROUND runs (`stage-2-generation.md`), three gates fire before any variant set is shown, fail-closed: the isolation gate (G1, `isolation-gate.mjs`), the constraint checker (owner contract + feasibility, `design-check/`), and — on a rebuild of a locked target — the design-regression gate (Phase-2 snapshot differ, `ledger-context.mjs`).**
- **2 → 3:** component-pick gate clean · tech stack + architecture + build plan captured as ADRs (no dedicated endpoints yet — ADR-presence IS the gate, per adr-014) · `CODING_GUIDELINES.md` written to repo · **design-lock gate (profile-aware, `stage-3-scaffolding.md`): a user-facing target with no locked design decision is advisory at P1/P2, BLOCKING at P3 (`stage3DesignGate`).**
- **3 → deploy:** auth strategy set if any page is non-anonymous · secret scan clean (gitleaks/Trivy — NOT Infisical, per adr-014) · backup plan defined · tunnel route configured · code verifier APPROVE on every feature · **feature verifier APPROVE on every user-facing feature** (`stage-3-feature-verifier.md` — drives the real app + asserts system state; posts to `feature_verification_reports` + mirrors `flow_test_runs`) · critical-flow E2Es green in `flow_test_runs` against the current commit (`cv`/public projects: BLOCK on red; `personal`/internal: WARN — adr-014) · **registry ship-gate (Phase 3 — gated projects only, `projects.verify_gate!='off'`): `GET /api/anti-gaslight/violations?project_slug` HARD-free AND `GET /api/verify/gate?project_slug&commit_sha=<deploying commit>` returns `ok:true` — REFUSE deploy on any HARD `unverified-ship`/`unreconciled-claim` or any commit-specific `blocking` entry. Details + CLI (`scripts/feature-verify/deploy-gate.mjs`) in `stage-3-feature-verifier.md`.**
- **4 lock-in:** user locks extracted items BEFORE any code · UI items route through per-item component-pick · trace report at integrate.

## Anti-gaslight bedrock (always active, never disabled)

1. **Source-substring or `why_inferred`** on every extraction (Stage 0 intent, Stage 4 classify).
2. **Lock before build** — Stage 1 scope-lock; Stage 4 lock-in gate.
3. **≥1 acceptance criterion per feature** — the API enforces this (422 on `building` with 0 ACs).
4. **Independent verifier sub-agents (two siblings)** — separate context; inputs are the locked manifest + diff (+ for the feature verifier, the owner-reviewed case matrix), never coder claims. **Code verifier**: is the code correct/complete (`stage-3-verifier.md`, `prompts/verifier-prompts.md`). **Feature verifier**: does it work for a user — drives the real app + asserts **system state** (`stage-3-feature-verifier.md`, `prompts/feature-verifier-prompt.md`). System-state assertions ARE the anti-gaslight (they check the real effect, not a claim); AI Explorer/Judge (Claude, in-session) never gate; fail-closed. Both gate "done" for user-facing features.
5. **Stub detection** per `data/stub-patterns.md` (with allowlist + `@intentional-placeholder` protocol).
6. **Ledger writes on every transition** per `ledger-writes.md` — detection rules query these tables; empty tables detect nothing.
7. **Design-round gates (fail-closed, Task 2)** — a variant set is never shown unless the **isolation gate** proves it differs on its named axis and matches on all else (`isolation-gate.mjs`), and the **constraint checker** clears the owner contract + feasibility (`design-check/`). A **locked** design decision is protected on rebuild by the **snapshot regression gate** (`ledger-context.mjs`); reopening needs a reason (PATCH 422). Design rounds run in a fresh sub-agent fed the ledger, so a rejected value is never re-offered.
7. **Drop-with-reason** — nothing silently deferred; an explicit ADR or `skip_reason`, surfaced to the user.

If following an instruction would bypass one of these, stop and ask.

### Capture vs display (owner decision 2026-06-10, amended 2026-06-11 per adr-017)

non_goals, must_haves, risks, and verifier output are BUILD RAILS — captured in the DB and enforced at gates, but NEVER rendered on the showcase UI. **Carve-out (adr-017, Doc B):** curated decisions (accepted, non-superseded `adr-index` rows) DO render on the architecture page as its third layer (Workflow → System → Decisions) — concise one-line entries, never full bodies. The website shows overview / features / flows / pages / architecture (incl. decisions) / progress. A rails section missing from the site is intentional, not a bug — do not add one.

## Operating rules

1. Everything on the server; local files are SCP staging.
2. DB canonical; YAML mirrors written + committed + pushed at every milestone — lock-in, integrate, pack-up — not only at pack-up (adr-018 Gitea recovery net).
3. Be opinionated; choices via AskUserQuestion, never prose questions.
4. Pull before work; push after.
5. Scope escalations are explicit — ADR required.
6. Code via Write tool + SCP; never SSH heredoc.
7. Commit before any docker rebuild.
8. Sub-agents must read full files before editing.
9. Clean temp files (local and server) after use.
10. Verifier is mandatory — no "small fix" exception. The **code** verifier runs on every feature; the **feature** verifier (`stage-3-feature-verifier.md`) additionally runs on every **user-facing** feature/item (Stage 3 + Stage 4.7). "Done" = both green (block cv/public, warn personal).
11. Risks resolve (status + summary), never delete.
12. Check `master_components` before authoring any UI primitive.
13. Bearer token on all mutations.
14. ADR ids: `adr-NNN-<short-slug>` (API regex-enforces; `adr.schema.yaml` matches).
15. Plugin and app repos are pushed at pack-up; STATUS.md regenerated via `scripts/generate-status.sh`, never hand-edited (adr-016).
16. **ONE DOOR (adr-018):** never open `data/ottomate.db` with host `sqlite3` or any second SQLite client while the container runs — both 2026-06 data losses came from exactly that (WAL orphaned-shm cascade). All reads/writes via the API. Forensic read needed? `POST /api/backup` first, then read the dead snapshot. A mutation answering 503 `db_write_path_unsafe`, or `/api/health` returning `degraded`, is the split tripwire: STOP, rescue per adr-015, never restart first.
17. Decisions are showcase content (iter-17): every new ADR gets a recruiter-readable title, the `curated` marker, and either one category tag (`cat:product` / `cat:system` / `cat:security` / `cat:reliability`) to display or no cat-tag to stay hidden. Curation record: tracker `docs/decisions-curation.md`.
18. **Batch server calls** — one ssh invocation carrying several curls/tests (separated by echo markers), never one ssh round-trip per call. SSH handshakes are the dominant latency in every session (2026-07-01 cap-a session: 19 ssh ops for 26 API calls).
19. **Background sub-agents only for work nothing pending depends on.** If the next step consumes the output, run the agent foreground — backgrounded agents are orphaned by any interrupt/restart and their work is silently lost (2026-07-01 windfall-labs session lost 2).

## Output style + triggers

`references/output-style.md` governs all rendering (compact one-liners, 30-line cap, no preambles) AND carries the single trigger table (merged from trigger-phrases.md, 2026-07-02) — detection is judgment-based: a phrase fires only at message start or as the whole message, never inside questions; ambiguity → AskUserQuestion.

## Repos

- **Plugin:** `~/.claude/plugins/ottomate/` — Gitea `pdsv/ottomate`. Commit + push on every change; this directory is the system's brain.
- **App:** `/opt/homeserver/ottomate` — Gitea `pdsv/ottomate-tracker-v3`.
- **Audit + workstream plan:** `~/Desktop/Skills CC/Ottomate/AUDIT-2026-06-10.md`.
