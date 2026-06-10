# Stage 1 — SO1 verification (5 passes)

> Referred to by NAME — sub-step numbers drifted (1.9 vs 1.10 across files) and are retired.

**Mandatory.** Run after producing all 7 SO1 docs and before declaring Stage 1 complete. Catches inconsistency before Stage 2 builds on a faulty foundation.

## When to run

Stage 1 sub-step 10, after Doc 8 (ADRs) is finalised.

## Inputs

- All 7 SO1 docs in DB for `<project_slug>` (Docs 1, 2, 3, 4, 5, 7, 8)
- ND1 archive at `staging/archive/ND1-<datetime>.yaml` (for carryover audit)

## 5 verification passes

### Pass 1 — Format

Each doc validates against its schema in `schemas/`:
- `overview.schema.yaml` ↔ Doc 1 + non_goals + success_criteria
- `flows.schema.yaml` ↔ Doc 2 + steps + pre_conditions + edge_cases
- `features.schema.yaml` ↔ Doc 3 + acceptance_criteria
- `ui.schema.yaml` ↔ Doc 4 + components + variants + entry_points
- `data.schema.yaml` ↔ Doc 5 (concepts + sources + contracts)
- `risks.schema.yaml` ↔ Doc 7 (instances + policies + 3rd-party + auth + secrets)
- `adr.schema.yaml` ↔ Doc 8

Use `GET /api/projects/<slug>` and child endpoints to read the live state. Validate each payload. Any failure → HARD halt with field path.

### Pass 2 — Mandatory fields

Per R3 (7 SO1 docs):
- Doc 1: slug, display_name, summary block, current_status, lifecycle_phase, scope_size, target_devices, hosting_target, problem_statement, ≥1 non_goal, ≥3 success_criteria, preferences object
- Doc 2: each flow has trigger, expected_outcome, ≥2 steps, ≥1 linked_features (UI flows: ≥1 linked_pages too)
- Doc 3: each feature has type, status, ≥1 acceptance_criterion (max 5)
- Doc 4: each page has route + layout_type + permissions; components have category + purpose_on_page
- Doc 5 conceptual: retention_policy_type set; if has_data_layer=true then ≥1 data_source
- Doc 7: ≥1 policy block; secrets are NAMES only (no values)
- Doc 8: each ADR has body_path that exists on disk

### Pass 3 — Cross-doc consistency

- Every flow.linked_features[*] exists in features
- Every flow.linked_pages[*] exists in pages
- Every feature.linked_flows[*] exists in flows (reverse direction)
- Every component.asset_library_ref points to an extant master_components row
- Every secret.name appears nowhere else as a literal value (light grep)
- ADR body_path files exist
- adr_features / adr_risks references resolve

### Pass 4 — Carryover from ND1

Re-read the archived ND1. Verify:
- intent fields → Doc 1 manifest
- likes/dislikes/must_haves/avoid → Doc 1.preferences
- ui_hints → Doc 4 component shortlist preferences
- tech_hints → Doc 8 staging ADR
- integrations_initial → Doc 7.third_party_services seed
- auth_intent → Doc 7.auth_config seed
- F1-F4 source files → moved to repo, decisions in ADR
- features/flows/risks_concerns sketches → refined in SO1

If any sketch was silently dropped without an ADR explaining why → HARD halt.

### Pass 5 — Interconnection sanity

Lightweight graph validation:
- Use `GET /api/graph/<slug>` to fetch nodes + edges
- Every feature with status='building' or 'done' has at least one linked flow OR linked page (orphaned features are suspicious)
- Every UI flow has at least one linked page (UI flows that don't visit a page are anomalies)
- Every page has at least one linked feature (pages that implement no feature are scaffolding-only — flag, don't halt)

## Output

Append a verification result row to `verification_reports`:

```
POST /api/iterations/.../verifier-result   (only if Stage 1 verifier promoted to Stage 4 item)
```

For Stage 1 standalone: just persist as a JSON blob attached to the project, or print to stdout. (No iteration_item exists yet at Stage 1.)

If any HARD halt: tell user the failing field paths via clickable AskUserQuestion. Block trigger to Stage 2 until fixed.
