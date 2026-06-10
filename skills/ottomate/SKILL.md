---
name: ottomate
description: Load and manage Ottomate web project sessions on VAULT7A. Triggered by `/ottomate` command, by `/ottomate <project-slug>` to load a specific project, or when the user mentions a tracked web project by name. Routes through 5 stages (Stage 0 preprocessing → Stage 1 SO1 production → Stage 2 UI/Tech → Stage 3 build → Stage 4 iterate) with anti-gaslighting protections, lock-in gates, an independent verifier sub-agent, and an end-to-end traceability ledger. Persists state in the Ottomate at http://127.0.0.1:8110.
---

# Ottomate Project Session — v3 (post-audit)

## What this skill does

Orchestrates web project work across **5 stages** on VAULT7A:

- **Stage 0 — Preprocessing:** sanity + journey detection + (Type 2 only) doc translation + intent dialog → `staging/ND1.yaml`
- **Stage 1 — SO1 Production:** ND1 → 7 SO1 docs (overview/flows/features/pages/data/risks/ADRs) → 5-pass verification
- **Stage 2 — UI + Tech:** UI master plan + components (≥2-3 options per slot, HARD enforced) + tech stack + architecture + build plan + coding-guidelines doc → SO2
- **Stage 3 — Build + Test + Deploy:** scaffold + CI + (Type 2 only) reformat + per-feature codegen + verifier sub-agent + multi-tier testing + deploy → SO3
- **Stage 4 — Iterate:** raw text → classify → 4.3 lock-in gate → mini-pipeline per item → trace report → SO4

Every stage transition is gated. Anti-gaslighting bedrock runs at multiple layers (source-substring rule, lock-in gate, verifier sub-agent, phase ledger detection rules).

## Server access

- **SSH:** `pdsv@192.168.1.10` — credentials in `references/credentials.md`
- **Projects:** `/mnt/storage/websites/<slug>/`
- **Tracker (Ottomate v3):** API at `http://127.0.0.1:8110` (server-side; localhost-bound). Mutations require `Authorization: Bearer $(cat /opt/homeserver/ottomate/.token)`.
- **Gitea:** `https://git.vault7a.xyz` (or `http://127.0.0.1:3300` server-side)
- **Asset library:** `/mnt/storage/ottomate/assets/components/<id>/` (master components source code)
- **Held code (Type 2):** `/staging/code/<slug>/`

**All file ops via SSH.** Code files: write locally first, SCP up. Never SSH heredoc for code.

---

## Phase 1 — BOOTSTRAP SANITY (always first, ~2s, 0 tokens)

Run `references/sanity-check.md` Phase 0 — Bootstrap (7 sub-checks: server liveness / disk / DB schema / bearer token / clock / deferred tools / last-session audit). Calls `GET /api/sanity-check?phase=bootstrap`.

**Auto-fix on BLOCK:** for known fixes (`run-npm-script`, `regenerate-token`, `restart-container`), skill calls `AskUserQuestion` offering the remediation. Never silent execution.

Results persisted to `sanity_check_runs` table. Cached 30 minutes — subsequent stage transitions reuse if still valid.

---

## Phase 2 — ROUTE (determine session intent)

Parse `$ARGUMENTS`:
- **(empty)** → list projects (compact one-line per `references/output-style.md`); `AskUserQuestion` to pick
- **`new`** → enter Stage 0 preprocessing
- **`personal`** or **`cv`** (single token, case-insensitive) → list projects filtered to those whose `tags` array contains that value; same compact one-line render
- **`<slug>`** → fetch context-packet `GET /api/projects/<slug>/context-packet?scope=lite`; route per state below
- **`<slug> <text>`** → Stage 4 intake with raw text

**Project categories** live in the existing `projects.tags` JSON array. Reserved values: `personal` (projects for self-use on VAULT7A) and `cv` (projects shown on the public portfolio/CV). A project can have both, one, or neither. Surface as a `category` column in listings; never overwrite the rest of the tags array when patching.

### Type 1 vs Type 2 detection (mandatory user confirmation)

Per Stage 0.2 (`references/stage-0-overview.md`):
- Mechanical regex: count attachments + fenced code blocks + file path patterns
- High confidence (zero markers) → auto-confirm Type 1, surface as one-liner
- Borderline → Claude semantic check (~300 tokens) + AskUserQuestion confirm
- Type 2 detected → route to 0.3 doc translation

### Routing table

| Detected state | Route to |
|---|---|
| No project row in Ottomate + user describes intent | Stage 0 — Type 1 path |
| No project row in Ottomate + user provides artifacts | Stage 0 — Type 2 path (0.3 doc translation fires) |
| Tracker row exists, lifecycle: ideating, ND1 incomplete | Resume Stage 0 |
| Tracker row exists, ND1 finalized, Stage 1 incomplete | Resume Stage 1 |
| Tracker row exists, **components.count = 0 AND pages.count > 0** | **Stage 2.2 → 2.4 (catchup; this is the "components never picked" recovery path)** |
| Tracker row exists, all SO1 counts = 0, repo on disk | Stage 0 catchup (T2P) |
| Tracker row exists, Stage 1 done, Stage 2 NOT locked | Stage 2 STRICT 2.2 → 2.3 → 2.4 sequence |
| Tracker row exists, Stage 2 locked, no build yet | Stage 3 build |
| Tracker row exists, deployed (building / shipped / maintained) + user reports issue | Stage 4 mini-pipeline |
| User asks status only | Show Ottomate dashboard, don't proceed to work |

---

## Phase 2.5 — STAGE GATE ENFORCEMENT (anti-gaslighting bedrock)

Each stage transition has prerequisites that **MUST** hold. HARD halts; no override paths.

### Stage 0 → Stage 1 gate

Before entering Stage 1, Ottomate must have:
- ND1 finalized (`nd1_archive.status = consumed`)
- ≥1 success_criterion, ≥1 non_goal, ≥1 feature_sketch, ≥1 flow_sketch
- Sanity check passed (cached or freshly run)
- ≥3 risk_concerns_initial (auto-detect baseline: `no-tests` if no test files; `no-error-tracking` if no GlitchTip; `no-rate-limit` if no middleware; plus 2-3 project-specific from CLAUDE.md scan if Type 2)

### Stage 1 → Stage 2 gate (HARD)

- 5-pass verification passed at 1.9
- All `features.current_phase = SPECCED`
- All `flows.current_phase = STEPS-LOCKED`
- All YAML mirrors hash-match DB-derivable hashes (no drift)
- `projects.lifecycle_phase = building` (set at 1.10)

### Stage 2.2 → 2.3 gate (HARD)

`ui_master_plans` row exists with all required fields populated (aspect_ratios, palette_dark, fonts, animation_level, type_scale, spacing_scale, etc.). If empty when 2.4 starts: **HARD halt — return to 2.2.**

### Stage 2.3 → 2.4 gate (HARD)

For each component category needed by this project's Doc 4 pages:
- 0 entries in `master_components` for category → **HARD halt** — seed before continuing (`/components-browser` or `/ottomate seed-component`)
- <3 entries → SOFT warn (proceed with what's available + "build new" option in 2.4)

### Stage 2.4 component selection (HARD format)

For each component on each page:
- Skill MUST query `master_components` filtered by category + tags
- Surface ≥2-3 options to user via the **Ottomate web app at `/projects/<slug>/components-pick`** (PRIMARY since iter-5 B.5, 2026-05-19). Render an `AskUserQuestion` with two options — "Open in browser" or "Pick in chat" — defaulting recommendation to the browser path. Chat is the CONTINGENCY.
- Capture pick → `POST /api/components/<id>/pick` body `{asset_library_ref}` (or `{skip_reason}` for skip-with-reason). Sets `components.asset_library_ref` + `components.picked = true` + `picked_at` + `current_phase = PICKED`.

If a component lands at 2.4 exit with `asset_library_ref = NULL` or `picked = false` AND no `skip_reason`:
**HARD halt — re-run 2.4 for the affected component.** This is the rule media-dashboard violated.

### Stage 2 → Stage 3 gate (HARD)

- 2.8 verification passed
- All `components.picked = true` AND `asset_library_ref IS NOT NULL` (or `skip_reason IS NOT NULL` with documented reason)
- `tech_stacks` + `architectures` + `build_plans` rows present
- `CODING_GUIDELINES.md` written to project repo

### Stage 3 → Deploy gate (HARD, per Codex Round 2 #5)

Before any `docker compose up -d` of a public-facing project:
- `auth_strategy != none` if any page has `permissions != anonymous`
- All secrets in Doc 7 mapped to Infisical entries (no hardcoded values; verified by Trivy)
- Backup plan defined
- Data sensitivity tier acknowledged
- Cloudflare Tunnel route configured
- 3.5 verifier APPROVE on every feature; no BLOCK with `mandatory_user_review`

### Stage 4 component-pick (HARD for UI items)

Iteration items with `item_type IN ('component_modification', 'new_feature_request')` AND any UI involvement MUST route through `/iterations/<id>/items/<itemId>/pick-component`. Same ≥2-3-options pattern as Stage 2.4 but scoped to one item.

---

## Phase 3 — WORK (load + execute the relevant reference)

Per detected state, load the relevant reference file:

**Stage 0:** `references/stage-0-overview.md` (entry) + `references/sanity-check.md`
**Stage 1:** `references/stage-1-internal.md` + `references/stage-1-verification.md`
**Stage 2:** `references/stage-2-ui-master-plan.md` → `references/stage-2-components.md` → `references/stage-2-tech-architecture.md`
**Stage 3:** `references/stage-3-scaffolding.md` → `references/stage-3-pipeline-setup.md` → (if Type 2) `references/stage-3-reformat.md` → `references/stage-3-codegen.md` → `references/stage-3-verifier.md` → `references/stage-3-testing.md`
**Stage 4:** `references/stage-4-mini-pipeline.md`
**Ledger writes (cross-stage):** `references/ledger-writes.md` — when/how to POST feature_claims / deploy_artifacts / test_runs; anti-gaslight rules depend on these being populated.

All AI dialogs use `AskUserQuestion` for choices (per `references/output-style.md`); never prose questions. Updates land in:
- **Tracker DB** (canonical for structured data)
- **YAML mirror files** in project repo (auto-written on commit + on `pack up`)
- **Git commits** in project repo (push deferred to pack-up)

---

## Phase 4 — TRIGGER PHRASES (transitions)

Per `references/trigger-phrases.md` (with discipline rules per CC-2):

| Phrase | Action |
|---|---|
| "let's move on" / "next" / "ready" / "proceed" | Move to next sub-step in current reference |
| "stage 1 done" / "ND1 done" / "preprocessing done" | Finalize ND1 (end of Stage 0) |
| "let's get to stage 2" / "move to stage 2" | Stage 1 → Stage 2 transition |
| "let's get to stage 3" / "build it" | Stage 2 → Stage 3 transition |
| "let me test" / "ready to test" | Out of build phase, ready for Stage 4 |
| "analyze" / "classify" | Trigger Stage 4.2 classification |
| "lock & build" / "approve all" | Lock Stage 4.3 list, kick off build |
| "pack up" / "done" / "good night" | End-of-session ritual (`references/pack-up-ritual.md`) |

**Detection discipline:**
- Phrases fire only at **start of message** OR as **entire message** (position-aware)
- "next" disambiguates by **active context** (next-step / next-item / next-stage)
- **Question-mark suppresses** trigger firing (interrogatives, not commands)
- **Exclusion list** (e.g., "next time/week/month") never fires "next" advance

---

## Phase 5 — PACK UP (end of session)

Per `references/pack-up-ritual.md`:
1. Validate working state (no half-edited files, no pending AskUserQuestion)
2. **Drift check** — for each YAML mirror, compare hash; surface dialog if manual edit detected (import / overwrite / abort)
3. Sync Ottomate DB → YAML mirrors (idempotent, hash-checked, skip if unchanged)
4. Update `iteration-log.md` with session summary
5. Commit + push project repo
6. Auto-push plugin repos if changed AND remote exists
7. Cleanup temp files (local + server)
8. Update Ottomate (last_session_at, lifecycle if changed)
9. Render compact session summary

**Pack-up reconciliation lock screen** (per Codex Round 2): final session-close screen showing done / not-done / deferred / risks-changed / commits — user confirms before push.

---

## Anti-gaslight bedrock (cross-stage, ALWAYS ACTIVE)

These are built into every stage. **Never disable.** See `references/anti-gaslight-rules.md` for the 7 detection rules.

1. **Source-substring rule** — every Claude-extracted item must trace to a substring of user's input OR have explicit `why_inferred` reasoning (Stage 0.4, 4.2)
2. **Scope-lock dialogs** before code (Stage 1 internal, Stage 4.3 lock-in gate)
3. **Acceptance criteria** mandatory per feature (≥1, max 5; quality-scored)
4. **Verifier sub-agent** independent of coder (Stage 3.5 + Stage 4.7)
5. **Stub detection** as HARD fail with allowlist + `@intentional-placeholder` escape hatch (Stage 3 + Stage 4 verifier)
6. **Trace report** at integrate showing claim-vs-evidence (Stage 4.8)
7. **Phase ledger** detects unreconciled claims, silent drops, coverage gaps (CC-7)
8. **No silent "will do later"** — explicit drop-with-reason required, captured as ADR
9. **must_haves + non_goals as visible rails** at every Stage 4.3 lock-in gate
10. **HARD enforcement at Stage 2.4 exit** — every component picked or explicitly skipped (no media-dashboard regression)

If any of these are bypassed, **stop and ask** before continuing. They're non-negotiable.

---

## Output style (per `references/output-style.md`)

- Compact one-line per item for any list ≥3 items
- Tables only on explicit user request
- No multi-paragraph descriptions per item unless user drills into ONE
- Hard line cap: 30 lines (primary lists) / 60 (everything)
- No emoji unless user uses them first
- Numbers visible in headers
- No "Loading..." preambles — get to the answer

The user's pain ("why a simple task of loading all projects is so complicated looking?") was about exactly this. Globalize.

---

## Rules (carried over from existing skill, refined)

1. **Everything on the server.** Project files live on server. Local files are temp for SCP.
2. **DB canonical, YAML mirror.** Structured data → Ottomate DB. Mirror to git on commit + pack up.
3. **Be opinionated.** Recommend, don't list options. Use `AskUserQuestion` for choices.
4. **Always pull before, push after.**
5. **Escalate scope explicitly.** Never silently expand. ADR required for re-wires.
6. **Write code via SCP, never SSH heredoc.** Heredoc corrupts code; use Write tool + SCP.
7. **Commit before rebuild.** `git add -A && git commit && git push` BEFORE `docker compose up --build`.
8. **Agents must preserve existing code.** When dispatching sub-agents, instruct them to read FULL file first.
9. **Clean up temp files.** After SCP, delete local temp. Before commit, scrub `/tmp/` scripts on server.
10. **Verifier is mandatory.** No "small fix, skip verifier" exception in Stage 3 or Stage 4.
11. **Risks resolve, do NOT delete.** Set `status='resolved'` + `resolved_at` + `resolution_summary` (per Codex P1 #10). History stays for audit.
12. **Lock-in gate before build (Stage 4.3).** User confirms structured items extracted from raw text BEFORE any code changes.
13. **Master component sourcing rule strict.** Always check `master_components` catalog before authoring UI primitive (`asset_library_ref` mandatory at 2.4 exit).
14. **Source-substring on every Claude extraction.** Anti-hallucination guard.
15. **Phase ledger writes on every state transition.** No untracked transitions.
16. **Bearer token on all mutations.** Even single-user.
17. **ADR ids must be descriptive.** Use `adr-NNN-<short-slug>` form (e.g., `adr-001-cointrail-staging`). `adr_index.id` is a global primary key — generic ids like `adr-001` collide across projects. POST validation enforces `^adr-\d{3,}-[a-z][a-z0-9-]*$`.

## Repos

- **ottomate** (this skill plugin) — local at `~/.claude/plugins/ottomate/` (no remote git for the plugin itself yet)
- **ottomate-tracker-v3** (the Gitea repo backing Ottomate) — `http://localhost:3300/pdsv/ottomate-tracker-v3` (Gitea, server-side via SSH tunnel) at `/opt/homeserver/ottomate/`
- **vault7a-ops** (server skill, separate) — `~/.claude/plugins/vault7a-ops/`
