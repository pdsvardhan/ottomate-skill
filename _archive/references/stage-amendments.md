# Stage Reference Amendments

Cross-cutting amendments to be applied to existing skill files at `~/.claude/plugins/ottomate/skills/ottomate/references/`. The full rewrites would balloon the audit; these amendments capture only the deltas per audit decisions.

For each existing file, this doc lists:
- **Sections to keep** as-is
- **Sections to amend** with new content
- **Sections to add** (new sub-sections)
- **Sections to delete** (dead weight)

Reference the existing file at the path; apply deltas.

---

## `references/stage-1-internal.md` (existing file — focus on SO1 production)

### Keep
- Pre-flight section (read ND1, validate, check sanity_check_results)
- 11 sub-step structure
- Failure handling section

### Amend

**Sub-step 1 (Consume ND1 + Carryover):**
- Add: archive ND1 immediately at 1.1 (NOT deferred to 1.10)
- Add: transactional all-or-nothing stub creation
- Add: idempotent re-run (second consume = no-op via `nd1_archive.status = consumed` check)
- Add: collision detection (HARD halt if features rows already exist)
- Add: emit `skill_events` row (`event_type=stage_1_consume`)
- Add: every SO1 stub carries `derived_from_nd1_version: 1` + provenance from ND1's `_provenance`
- Drop: section about moving F1 code (already done at 0.3)
- Replace: "inspirations route to central UI asset repo" with "inspirations route to projects.inspirations_notes (project-level only); cross-project asset-pool design deferred"

**Sub-step 2 (Doc 1 Completion):**
- Drastically reduce: most fields already set in Stage 0
- Only fill: `summary.tagline` (template + Claude polish), `summary.short_description` (Claude composes), `tags` (mechanical noun extraction + user picks)
- Note: target_devices moved to 0.8 per D-S1.2.2
- Add: card preview rendered before lock (templated; user confirms appearance)
- Add: `projects.doc1_status = ready` as explicit gate

**Sub-step 3 (Doc 3 Features Refinement):**
- Replace per-feature sequential dialog with paginated card panel (10/page; soft warning at >30 features)
- AC generation: type-templates + flow-linkage + success_criterion mapping seeded; **Claude actively refines** per amendment D-AMEND.9
- Add: per-feature Claude critique pass (refinement_suggestions, missing_complementary_within_feature, dependency_suggestions, over_broad_warning, vague_ac_warnings)
- Add: cross-feature Claude pass (duplications, overlaps, CRUD completeness)
- Add: AC quality scoring heuristic (number / time-unit / specific verb → ≥0.6)
- Add: conflict detection vs non_goals + avoid + must_haves
- Add: dependency cycle check (HARD halt on cycle)
- Add: coverage gates (success_criteria + must_haves mapped to ≥1 feature AC)
- Add: phase transition `→ PROPOSED` written to `feature_phase_transitions`
- Drop: "linked_pages" capture (deferred to 1.5 reverse-edge)

**Sub-step 4 (Doc 2 Flows Refinement):**
- Same paginated card panel pattern as 1.3
- Per-flow Claude generates step triples (actor/action/result), edge cases, pre-conditions
- Cross-flow Claude pass (CRUD / auth / error-state / empty-state completeness)
- Phase transition → DRAFT → STEPS-LOCKED at 1.9
- Defer linked_pages to 1.5

**Sub-step 5 (Doc 4 Pages Derivation):**
- Pages NOT 1:1 from features — Claude proposes consolidation options
- Per-page component list generation with complementary catches (search→filter, list→pagination, etc.)
- Cross-page Claude pass (missing pages: 404, settings, profile, error boundary)
- State coverage gate (empty_state + loading_state + error_state per page)
- Backfill flows.linked_pages via Claude inference + user confirm

**Sub-step 6 (Doc 4 Components per Page):**
- Already covered in sub-step 5

**Sub-step 7 (Doc 5 Data Overview):**
- Conditional skip if `has_data_layer = false` (single marker write)
- Claude designs schema (tables + columns + relationships) from data-touching features
- Ingestion strategy proposal (one-time / scheduled / webhook + R1-R4 fields per existing design)
- Data quality rules generation
- Freshness alerts mandatory on `scheduled-fetch` / `webhook-receive` sources
- Schema → feature query support validated at 1.9

**Sub-step 8 (Doc 7 Risks):**
- Catalog matching mechanical (deterministic rules)
- **Claude refinement pass for project-specific risks** (CDN downtime, scraping, rate-limit gaps)
- Risk → artifact attachment Claude-proposed, user confirms (no floating risks)
- **Claude-inferred secrets list** from integrations + auth + data sources (NAMES only, no values)
- Cross-risk completeness checks
- Risk lifecycle: `open / accepted / resolved` per Codex P1 #10 (never delete)

**Sub-step 9 (Doc 8 Initial Staging ADR):**
- Move shell creation to **1.1** (with carryover summary baked in)
- 1.8 finalizes the body composition (Context / Decision / Consequences) using Stage 1 outcomes
- Append-only contract enforced

**Sub-step 10 (Verification):**
- Replace with cross-reference to `references/stage-1-verification.md`

**Sub-step 11 (Handoff):**
- Drop ND1 archive (moved to 1.1)
- Add: drift detection on YAML mirrors
- Add: lifecycle transition `ideating → building` here
- Add: skill_events row
- Add: Stage 2 preview rendered in handoff summary

### Add (new sections)

**"Anti-gaslight bedrock for Stage 1" section** at top of file referencing:
- `references/anti-gaslight-rules.md` (the 7 detection rules)
- `references/ledger-tables.md` (the phase transitions)
- Source-substring rule applied throughout

---

## `references/stage-2-ui-master-plan.md` (existing file — light amendments)

### Keep
- Most existing content (well-designed already)

### Amend

**"Workflow" section:**
- Replace single-shot "propose 2-3 themes" with **3-stage panel**:
  - Stage A: 2-3 distinct directions (named, palette-feel, font-feel, motion-vibe)
  - Stage B: After pick → flesh out concrete tokens with sample component preview
  - Stage C: Lock-in gate (full plan + conflicts + atomic confirm)

**Mechanical bits:**
- Add: WCAG AA contrast HARD gate (any sub-threshold pair blocks lock)
- Add: light palette derived mechanically from dark via culori/chroma-js
- Add: type scale + spacing + breakpoints derived from chosen ratios

**Anti-gaslight section:**
- Add: `ui_master_plans.version` row with version increment for changes
- Add: Stage 4 changes require new version + ADR (no silent edits)
- Add: conflict detection vs `preferences` (0.8) at every Claude pass

---

## `references/stage-2-components.md` (existing file — significant rewrite)

### Replace entirely with revised scope (per CC-2.3 simplification)

**Old design:** cross-project scan + classification during project flow
**New design:** lightweight gap check only

```markdown
# Stage 2.3 — Master Components Gap Check (revised)

Per CC-2.3 redesign, master components seeding is a separate one-time activity
(see `references/onboarding-modes.md`). During project flow, 2.3 is a 
lightweight gap check.

## Workflow (mechanical, ~50ms, 0 tokens)

For each unique component category referenced in this project's pages:
- 0 entries in master_components for category → HARD halt
- <3 entries → SOFT warn (Stage 2.4 will offer what's available + "build new")

## Storage redesign (per D-S2.3.2)

Master components stored as:
- DB row: lightweight index (id, name, category, description, source_code_path,
  framework_tags, tags, dependencies, variants_json, preview_url, license_note)
- Filesystem: source code at /mnt/storage/ottomate/assets/components/<id>/<primary_file>

## One-time seeding paths (separate activity)

- Path 1: Tracker UI form `/components-browser`
- Path 2: Skill helper `/ottomate seed-component`
- Path 3: Bulk import script `scripts/import-master-components.ts`

## What to do if 2.3 HARD halts

User must seed at least 1 entry per missing category before continuing.
Easiest paths: Path 2 in chat, or Path 1 in Ottomate UI.

## Stage 2.4 follow-up

Once 2.3 passes, Stage 2.4 reads master_components (with grown catalog),
ranks per-component options, user picks. See `stage-2-components-pick.md`
(new file) for 2.4 details.
```

### Add new file `stage-2-components-pick.md` for the 2.4 details

(See SKILL.md amendments — 2.4 is the per-component selection step that media-dashboard skipped. Card panel with ≥2-3 options per component, HARD enforcement at exit, cross-page consistency review, propose-new-component path, etc.)

---

## `references/stage-2-tech-architecture.md` (existing file — amendments)

### Keep
- House defaults table
- Mermaid diagram structure

### Amend

**Coding Guidelines doc** — new sub-section per D-S0.8:
- Stage 2.5 produces `CODING_GUIDELINES.md` in project repo
- Sections: file tree, naming, imports, state, styling (with ui_master_plan tokens), component sourcing rule, testing, accessibility, performance, security, project-specific conventions
- Stage 3.3 reformat reads this; Stage 3.4 codegen reads this

**Mechanical vs Claude split:**
- Per-choice rationale: Claude (~500 tokens)
- Architecture composition: Claude composes 3 Mermaid diagrams (~1-2K tokens)
- Coding guidelines: Claude composes from templates + locked state (~2-3K tokens)
- Override conflict detection: regex/mechanical

---

## `references/stage-3-scaffolding.md` (existing file — minor amendments)

### Keep
- Battle-tested rules (node 22 bookworm-slim, .dockerignore, uid 1000, public/)

### Amend

**Pre-checks:**
- Add: drift detection (no manual edits to scaffold-target paths since 1.10)

**Workflow step 8 (Gitea Actions secrets):**
- Add: TRACKER_API_TOKEN required (mutations need bearer auth per Codex Round 2)

**Add new section "Phase ledger transitions":**
- pages: `PROPOSED → LAYOUT_LOCKED` (per page, after Tailwind tokens applied)
- skill_events row: `stage_3_scaffold_complete`

---

## `references/stage-3-pipeline-setup.md` (minor)

### Amend

**HARD halt before 3.3:**
- Lighthouse base ≥80; Trivy 0 HIGH+ on scaffold; all CI workflows green

**Add Cloudflare Tunnel check** (per Missing-4) — verify tunnel route configured for public URL

---

## `references/stage-3-verifier.md` (significant amendment per Codex Round 2)

### Replace prompt body
- Use trimmed version per `prompts/verifier-prompts.md` (this audit's deliverable, ~4K target)
- Externalize stub patterns to `references/stub-patterns.md` (referenced not inlined)
- Reference output schema at `schemas/verification-report.schema.yaml`

### Add `verifier_prompt_version` field stamping
- Every verification_reports row records the prompt version that produced it
- Audit chain: which version of verifier ran on which feature

### Add allowlist + escape hatch (Codex Round 2 #6)
- Per `prompts/verifier-prompts.md` — allowlisted paths + `@intentional-placeholder` annotation requiring lock-in approval

---

## `references/stage-3-testing.md` (minor)

### Amend
- Trivy + Grype + OSV-Scanner (NOT Snyk per Codex P1 #11) — locked in nightly CI
- Lost Pixel for visual regression (NOT Percy SaaS) — locked

---

## `references/stage-4-mini-pipeline.md` (significant)

### Keep
- Sub-stage 4.1 (Intake) shape
- 4.4 routing table
- 4.4.5 component-pick gate
- 4.5 mini-staging per item type
- 4.6 mini-build pattern
- 4.7 verifier per item

### Amend

**4.2 Classify:**
- Use updated `prompts/classify-text.md` (source-substring rule + lite context-packet)
- Confidence < 0.7 blocks 4.3 lock until clarified
- Implicit/inferred items get `why_inferred` + force user confirmation
- Duplicate detection vs iteration_history
- Reject log captures discarded fragments

**4.3 Lock-In Gate:**
- Server-side validation at lock: confidence ≥ 0.7 OR user_edited; must_haves + non_goals respected
- **must_haves + non_goals as visible rails** in panel (per CC-7)
- Override path = explicit ADR (no silent rail violation)
- 1-hour inactivity → `pending_user_review` (per Codex P2 #15)

**4.7 Verifier:**
- No "trivial fix skip verifier" exception
- Same trimmed prompt as Stage 3.5 + same allowlist + escape hatch

**4.8 Trace Report:**
- Anti-gaslight bedrock confirmation block in every Trace Report
- AC regression check HARD before integrate
- Stored permanently in `iterations.trace_report` for cross-session audit

### Add new section "Phase ledger transitions"
- iteration_items: `pending-review → locked → building → verifier-pending → verified → integrated`
- features touched by iteration: `INTEGRATED → REGRESSED → BUILDING → VERIFIED → INTEGRATED`
- skill_events emitted at each transition

---

## `references/pack-up-ritual.md` (significant amendment for CC-1)

### Keep
- 8-step sequence

### Amend

**Step 2 (Sync mirrors):**
- Add: drift detection BEFORE write (hash compare DB-canonical vs file)
- Add: drift dialog (import / overwrite / abort) on mismatch
- Add: drift_resolutions row written

**New step "Pack-Up Reconciliation Lock"** (Codex Round 2):
- Final session-close screen showing done / not-done / deferred / risks-changed / commits
- User confirms before push

**Step 5 (Plugin auto-push):**
- Add: only if remote exists (ottomate plugin currently no remote — skip with notice)

---

## `references/trigger-phrases.md` (amend per CC-2)

### Add discipline rules section

```markdown
## Detection discipline (per CC-2)

1. Position-aware: phrases fire only at message start OR as entire message
2. Phase-aware: "next" disambiguates by active context
3. Question-mark suppresses (interrogatives never fire)
4. Exclusion list:
   - "next time" / "next week" / "next month" → not "next" advance
   - "ready to test what?" → not "ready to test" trigger
   - "I want to pause that feature" → not "pause" trigger

Implementation: regex-based but phase-context-aware. Skill scans every message;
ambiguous matches surface AskUserQuestion to disambiguate.
```

---

## `references/tracker-api.md` (significant amendment)

### Add new endpoints

```
POST /api/projects/{slug}/intent-drafts       (Stage 0.4)
POST /api/projects/{slug}/intent-drafts/extract-hints  (hybrid extraction)
GET  /api/iterations/{id}/items/{itemId}/component-options  (Stage 4.4.5)
POST /api/iterations/{id}/items/{itemId}/pick-component
GET  /api/sanity-check?phase={phase}&project_slug={slug?}
GET  /api/drift?project_slug={slug}
POST /api/drift/{id}/resolve
GET  /api/audit/{slug}
GET  /api/audit/{slug}/anti-gaslight-violations?severity={ALL|HARD|SOFT}
POST /api/master-components                   (one-time seed Path 2)
GET  /api/projects/{slug}/components-pick/status  (poll for 2.4 picks)
POST /api/skill-events                        (timeline log)
```

### Add bearer auth section per Codex Round 2 #2
- Already exists in current ref; verify enforcement covers ALL POST/PATCH/DELETE

---

## `references/credentials.md` (cleanup amendment)

### Drop legacy v2 references
- Remove `tracker.vault7a.xyz` references (v2 domain)
- Remove `localhost:8100` references (v2 port)
- Replace with `ottomate.vault7a.xyz` and `localhost:8110`

---

## How to apply these amendments

1. Read each existing file in `~/.claude/plugins/ottomate/skills/ottomate/references/<name>.md`
2. Apply the deltas listed above (keep what stays, replace amended sections, add new sections)
3. Cross-reference new files (output-style.md, anti-gaslight-rules.md, ledger-tables.md, onboarding-modes.md, stage-0-overview.md, stage-3-reformat.md, extract-intent.md)
4. Validate with grep that every locked decision has a textual home

This file is the change-list. Apply in any order; they're independent edits.
