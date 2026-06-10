# Stage 1 Internal Process — Consume ND1 → Produce SO1

> **POST-AUDIT AMENDMENTS (2026-04-29):** This file's sub-step 2-11 behavior is amended per the locked audit. (Deltas below were applied; original changelog archived at `_archive/references/stage-amendments.md`.) Critical inline changes:
> - **Sub-step 1:** ND1 archived in 1.1 (not 1.10). Transactional all-or-nothing stub creation. Initial staging ADR shell created here.
> - **Sub-step 2:** Most fields already set in Stage 0 — only fill `summary.tagline` (template + Claude polish), `summary.short_description` (Claude composes), `tags` (mechanical extraction). target_devices captured at 0.8.
> - **Sub-step 3-5 (Doc 3/2/4):** Per-feature/flow/page Claude **active critique pass** + cross-entity Claude pass for completeness gaps. Paginated card panel (10/page; soft warning at >30 features). Per `references/output-style.md`.
> - **Sub-step 7 (Doc 5):** Skip if `has_data_layer=false`. Claude designs schema from features + sketches.
> - **Sub-step 8 (Doc 7):** Catalog matching via `data/risk-rules.yaml` (mechanical) + Claude refinement pass for project-specific risks.
> - **Sub-step 10:** See `references/anti-gaslight-rules.md` for the 7 detection rules; runs at every transition.
>
> Source-substring rule applies to every Claude extraction.
> Phase ledger transitions written to `feature_phase_transitions` etc. per `references/ledger-tables.md`.

After preprocessing (Stage 0) produces `staging/ND1.yaml`, this reference governs Stage 1's internal work: turning ND1 into the 7 locked SO1 docs.

## Pre-flight

1. Read `staging/ND1.yaml`
2. Validate against `schemas/nd1.schema.yaml`
3. Check `sanity_check_results.passed = true` (else halt)
4. Validate all mandatory ND1 fields populated (else halt with "ND1 incomplete; resume preprocessing")

## 11 sub-steps

### Sub-step 1: ND1 Consumption + Carryover Application

Apply the carryover map from ND1 → SO1:

| ND1 field | Lands in SO1 |
|---|---|
| `core_idea`, `problem_statement`, `target_users`, `non_goals_initial`, `success_criteria_initial` | Doc 1 manifest fields directly |
| `likes`, `dislikes`, `must_haves`, `avoid` | Doc 1 `manifest.preferences` block |
| `ui_hints` | Doc 4 component-shortlist preferences (held for Stage 2 picker) |
| `tech_hints` | Doc 8 staging ADR (recorded for Stage 2 BUILD) |
| `integrations_initial` | Doc 7 `third_party_services` seed |
| `auth_intent` | Doc 7 `auth_strategy` seed |
| `inspirations` | Central UI asset repo (cross-project) + project-level reference notes |
| `F1_code`, `F2_docs`, `F3_samples`, `F4_data` (sources) | Source files moved into project repo at appropriate paths; decisions captured in Doc 8 staging ADR |
| `features_sketch` | Doc 3 `features.yaml` (refined in Sub-step 4) |
| `flows_sketch` | Doc 2 `flows.yaml` (refined in Sub-step 5) |
| `risk_concerns_initial` | Doc 7 `risk_instances` (matched to global catalog in Sub-step 8) |
| `data_sketch` | Doc 5 `has_data_layer` + `sources` seed |

### Sub-step 2: Doc 1 Completion (Project Overview)

From ND1: `proposed_slug`, `proposed_display_name`, intent fields, preferences.

AI defaults:
- `current_status`: `building` (default)
- `lifecycle_phase`: `ideating` (transitions to `building` when Stage 2 starts)
- `scope_size`: estimate from features count + complexity (nano: 1-3 features, S: 4-7, M: 8-15, L: 16-30, XL: 30+)
- `target_devices`: ask user via `AskUserQuestion` (`desktop` / `mobile` / `tablet` / `both`)
- `hosting_target`: default `vault7a-docker`; user confirms if non-default
- `port`: AI proposes next free port (query Ottomate DB for existing); user confirms
- `public_url`: auto-generate `https://<slug>.vault7a.xyz`
- `repository_url`: auto-generate `https://git.vault7a.xyz/pdsv/<slug>`

Ask user via `AskUserQuestion` for confirmations on non-defaults. Write to Ottomate DB + `overview.yaml` mirror.

### Sub-step 3: Doc 3 Features Refinement

For each entry in `features_sketch`:
- AI assigns `feature_id` (`feat-<slug>`)
- AI proposes type (`ui` / `backend` / `automated` / `hybrid`)
- Per feature dialog (sequential `AskUserQuestion`):
  - Title (refine from sketch)
  - Parent feature (if sub-feature)
  - Short description (max 500 chars)
  - Priority (P0/P1/P2/P3)
  - Size (XS/S/M/L)
  - Acceptance criteria (≥1, max 5) — *critical for anti-gaslighting*
- Defaults: `status: planned`, `test_status: not-tested`
- Write to Ottomate DB + `features.yaml`

### Sub-step 4: Doc 2 Flows Refinement

For each entry in `flows_sketch`:
- AI assigns `flow_id`
- Per flow dialog:
  - Title
  - Linked features (M:N — at least 1)
  - Trigger
  - Pre-conditions (list)
  - **Steps (ordered, ≥2):** each step = `{actor: user|system, action, result}`
  - Expected outcome
  - Edge cases / failure modes
  - Type, priority
- Defaults: `test_status: not-tested`
- Write to Ottomate DB + `flows.yaml`

### Sub-step 5: Doc 4 Pages Derivation

Derive pages from features:
- Per feature → "Which page(s) does this appear on?" — user-confirmed
- Per page (deduplicated): AI proposes title, route, purpose, layout type
- Per page dialog:
  - Permissions (`anonymous` / `logged-in` / `admin` / `custom`)
  - Entry points (how user arrives)
  - Empty state, loading state, error state
  - Mobile handling
  - Linked features (M:N)
- Apply `ui_hints` from ND1 carryover

### Sub-step 6: Doc 4 Components per Page

For each page → list components needed:
- AI proposes component list from feature requirements (e.g., search feature → `search-bar`, `results-list`, `result-card`)
- Per component:
  - Name, purpose on this page
  - Category (`input` / `display` / `navigation` / `feedback` / `layout` / `overlay`)
  - Possible variants (list — Stage 2 will pick from these)
  - Data consumed / produced
  - `picked: false` (defaults; Stage 2 sets to `true` after picking)
- Write to Ottomate DB + `ui.yaml` (with components nested under pages)

### Sub-step 7: Doc 5 Data Overview

If `data_sketch.has_data_layer = true`:
- For each source from `F4_data` and `data_sketch.sources_hint`:
  - Confirm via dialog: source type, ingestion method, frequency, schema
  - Capture R1-R4 fields if recurring (refresh strategy, watermark, dedup, backfill)
- Tables/columns: AI proposes schema; user refines
- Retention policy, seed data plan, migration tooling, freshness alerts
- Write to Ottomate DB + `data.yaml`

If `has_data_layer = false`: write only `has_data_layer: false` marker, skip rest.

### Sub-step 8: Doc 7 Risks

Apply carryover seeds (`integrations_initial`, `auth_intent`).

For risk_concerns_initial from ND1:
- Match each to global `risks_catalog` (e.g., "no API auth" → catalog entry `no-auth`)
- For each match: ask user `affected_artifact` (which feature/page/integration/secret/data_table) + `status` (`open` / `accepted`) + `sunset_date` if accepted

Dialog for policies:
- Exposure (`public` / `intranet-only` / `invite-only` / `never-public`)
- Access control (default `anonymous-ok` unless auth_intent ≠ none)
- Data sensitivity tier (depends on data layer; `none` if no data)

Secrets: list any secrets needed (name, where stored, what for — NO VALUES). Choose secrets management tool (`env-vars` / `infisical` / etc.).

Write to Ottomate DB + `risks.yaml`.

### Sub-step 9: Doc 8 Initial Staging ADR

Auto-create `decisions/<date>-initial-staging.md`:

```yaml
---
id: adr-001
title: Initial Stage 1 staging for <slug>
date: 2026-04-26
status: accepted
tags: [staging, initial]
linked_features: [<top-level feature IDs>]
linked_risks: [<open risk IDs>]
---

## Context
<Brief summary of project intent + journey type + key decisions made>

## Decision
<Scope: features locked, key choices, target_devices, hosting_target, etc.>

## Consequences
- Stage 2 inherits: <list>
- Locked-for-iteration: <list>
- Deferred: <list>
- Tech hints carried for Stage 2 BUILD: <from ND1 tech_hints>
```

Commit to project repo.

### Sub-step 10: VERIFICATION (5-pass)

Run all 5 verification passes:

**A. Format checks**
- All YAML files parse cleanly
- All required fields conform to declared types
- All enums use only allowed values
- DB row contents match YAML mirror (drift detection)

**B. Mandatory completeness**
- Every SO1 doc has all mandatory fields populated
- No empty `non_goals` / `success_criteria` / `acceptance_criteria` lists where ≥1 required
- Conditional fields populated when conditions met (e.g., `data_plan` if `has_data_layer=true`)

**C. Cross-doc validation**
- **Permissions ↔ Auth:** if any `page.permissions ≠ anonymous`, then `auth_strategy ≠ none`
- **Risk → Artifact:** every `risk_instance` has `affected_artifact_type` + `affected_artifact_id`
- Feature → Flow: every UI/hybrid feature has ≥1 linked flow
- Flow → Feature: every flow has ≥1 linked feature
- Flow → Page: every UI flow has ≥1 linked page
- Page → Feature: every page has ≥1 linked feature
- Component → Page: every component references existing page
- No orphans (no flow/page/component without upstream link)

**D. Consistency checks**
- All FK references resolve
- ADR linked_features and linked_risks exist
- Tracker DB rows ↔ YAML file contents match

**E. Interconnection report**
- Generate Feature ↔ Flow ↔ Page ↔ Component graph
- Flag disconnected subgraphs
- Show user a summary view (count + names of orphans if any)
- User confirms before completing

### Sub-step 11: Handoff

If verification passes:
1. Move `staging/ND1.yaml` → `staging/archive/ND1-<YYYY-MM-DD>-<HHMMSS>.yaml`
2. Append iteration log entry with Stage 1 summary
3. Commit + push to Gitea
4. Update Ottomate `lifecycle_phase: building` (transitions from `ideating`)
5. Auto-push plugin repos if changed
6. Confirm to user: **"Stage 1 complete. Ready for Stage 2 (UI master plan + tech finalization)?"**

If verification fails:
- Hard fails (broken FKs, missing mandatory): halt, show errors, ask user to fix via dialog
- Soft fails (orphan flows, sparse acceptance criteria): present via `AskUserQuestion`:
  - "Soft warning: <issue>. Accept and continue, or fix?"
  - On accept: log warning in staging ADR

## Failure handling

- **ND1 invalid:** halt, ask user to resume preprocessing
- **Verification stuck on hard fails:** offer to resume Stage 1 from the failed sub-step in next session
- **User abandons mid-dialog:** save partial state to Ottomate DB (status: `staging-in-progress`), resumable

## Estimated session time

For a clean Type 1 with simple project: ~30-60 minutes of dialog.
For a Type 2 with complex artifacts: 60-120 minutes (artifact processing + intent deepening informed by sources).
For Stage 1 catch-up of an existing project (Standard mode): 15-45 minutes (most fields back-fillable).
