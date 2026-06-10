# Ledger Tables — Phase Transition Schema

The substrate every stage transition writes to. Append-only audit trail of state changes per entity. Anti-gaslight detection rules (`anti-gaslight-rules.md`) query these. Cross-stage audit queries (`/api/audit/<slug>`) read these.

**Storage:** Tracker SQLite. ~50 bytes per row. Estimated for 14 projects × 50 entities × ~10 transitions over project lifetime: ~70K rows total. Trivial footprint.

**Append-only:** No UPDATE, no DELETE. Immutable history.

---

## ⚠ Phase enum complexity — recommended collapse (2026-05-13)

The current schema has 8 feature phases, 6 flow phases, 6 page phases, 6 component phases. That's a lot of granularity for solo use. Realistic transitions in practice are:

**features (collapse 8 → 5):**
```
PROPOSED → SPECCED → BUILDING → VERIFIED → INTEGRATED
                                              ↘ REGRESSED → BUILDING (loop)
                                              ↘ DROPPED (terminal, with ADR)
```
Removed: BUILD_READY (collapse into SPECCED — at Stage 2.8 verification the SPECCED phase already implies build-readiness). STUB-DETECTED (out-of-band — handle as verifier-result attribute, not phase).

**flows (collapse 6 → 4):**
```
DRAFT → LINKED → TESTED → INTEGRATED
                            ↘ REGRESSED → LINKED (loop)
```
Removed: STEPS-LOCKED (collapse into LINKED — same Stage 1 transition).

**pages + components:** drop the per-entity phase enum entirely; derive their state from their parent feature/flow. Per-entity transition tables (`page_phase_transitions`, `component_phase_transitions`) are mostly redundant — most page/component changes are driven by feature changes.

**Why this hasn't been applied yet:** the DB already has CHECK constraints on `current_phase` columns; collapsing the enum requires a SQLite migration (`PRAGMA legacy_alter_table=OFF` + table rebuild). Designed but not deployed. Apply in next Ottomate session.

---

## Common shape

All 6 transition tables share this column structure:

```sql
CREATE TABLE <entity>_phase_transitions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  <entity>_id     TEXT NOT NULL REFERENCES <entity_table>(id) ON DELETE CASCADE,
  from_phase      TEXT NOT NULL,            -- previous phase (or 'NONE' for first transition)
  to_phase        TEXT NOT NULL,            -- new phase
  transitioned_at TEXT NOT NULL,            -- ISO timestamp
  session_id      TEXT NOT NULL,
  evidence_kind   TEXT,                     -- what triggered the transition
  evidence_ref    TEXT,                     -- FK or path to evidence artifact
  triggered_by    TEXT NOT NULL DEFAULT 'skill_auto',  -- skill_auto | user_manual | verifier | claude_classifier
  notes           TEXT
);

CREATE INDEX idx_<entity>_pt_entity ON <entity>_phase_transitions(<entity>_id, transitioned_at DESC);
CREATE INDEX idx_<entity>_pt_session ON <entity>_phase_transitions(session_id);
```

---

## 1. feature_phase_transitions

**Phases (for `features.current_phase`):**

```
NONE → PROPOSED → SPECCED → BUILD_READY → BUILDING → VERIFIED → INTEGRATED
                                                          ↘
                                                            REGRESSED → BUILDING (re-iter)

Any non-INTEGRATED → DROPPED (with ADR; explicit user choice or non_goal violation)
```

**Phase definitions:**
- **PROPOSED** — Stage 0.10 sketch became 1.1 stub row OR user added at 1.3 panel
- **SPECCED** — Stage 1.9 verification passed; AC ≥1 + linked entities; ready for Stage 2 component picks
- **BUILD_READY** — Stage 2.8 verification passed; components picked; tech stack locked; build_plan includes this feature
- **BUILDING** — Stage 3.4 codegen started for this feature
- **VERIFIED** — Stage 3.5 verifier returned APPROVE
- **INTEGRATED** — Stage 3 PR merged to main OR Stage 4.8 iteration integrated affecting this feature
- **REGRESSED** — Stage 4 iteration modified this feature; needs re-build + re-verify
- **DROPPED** — explicit drop via ADR (Stage 1 if surface ADR; Stage 4 if iteration item type=drop)

**evidence_kind values:**
- `stage1_verification` (PROPOSED → SPECCED)
- `stage2_verification` (SPECCED → BUILD_READY)
- `codegen_started` (BUILD_READY → BUILDING)
- `verifier_approve` (BUILDING → VERIFIED)
- `pr_merged` (VERIFIED → INTEGRATED)
- `iteration_<N>_modify` (INTEGRATED → REGRESSED)
- `adr_drop` (Any → DROPPED)
- `auto_fix_loop_<n>` (BUILDING → BUILDING; n = iteration in auto-fix loop)

**Example row:**
```sql
INSERT INTO feature_phase_transitions VALUES (
  142,                                          -- id
  'feat-player-search',                         -- feature_id
  'BUILDING',                                   -- from_phase
  'VERIFIED',                                   -- to_phase
  '2026-04-29T15:42:00Z',
  'ses-abc-123',
  'verifier_approve',
  '{"verification_report_id": 87, "passes": "A:pass,B:clean,C:pass,D:3/3"}',
  'verifier',
  null
);
```

---

## 2. flow_phase_transitions

**Phases:**
```
NONE → DRAFT → STEPS-LOCKED → LINKED → TESTED → INTEGRATED
                                                  ↘
                                                    REGRESSED → STEPS-LOCKED (re-iter)
```

- **DRAFT** — Stage 0.10 sketch → 1.1 stub OR 1.4 user-added
- **STEPS-LOCKED** — Stage 1.4 sub-step verified; ≥2 actor/action/result steps; edge cases captured
- **LINKED** — Stage 1.5 backfilled `linked_pages` (pages now exist as rows)
- **TESTED** — Stage 3.5 Playwright spec exists + passes for the flow
- **INTEGRATED** — Flow's tests run in CI on every PR
- **REGRESSED** — Stage 4 iteration modified this flow

**evidence_kind values:**
- `stage1_verification` (DRAFT → STEPS-LOCKED)
- `pages_backfilled` (STEPS-LOCKED → LINKED)
- `playwright_added` (LINKED → TESTED)
- `ci_green` (TESTED → INTEGRATED)
- `iteration_<N>_modify` (INTEGRATED → REGRESSED)

---

## 3. page_phase_transitions

**Phases:**
```
NONE → PROPOSED → LAYOUT_LOCKED → COMPONENTS_PICKED → BUILT → DEPLOYED
                                                          ↘
                                                            REGRESSED → BUILT
```

- **PROPOSED** — Stage 1.5 derivation
- **LAYOUT_LOCKED** — Stage 2.2 UI master plan applied; layout_type confirmed
- **COMPONENTS_PICKED** — Stage 2.4 every component on page has `picked=true` + `asset_library_ref`
- **BUILT** — Stage 3.4 page route file written + tested
- **DEPLOYED** — Stage 3.8 page accessible at public URL

---

## 4. component_phase_transitions

**Phases:**
```
NONE → PROPOSED → COMPONENT_PICKED → STAGE_2_VERIFIED → BUILT → DEPLOYED
                       ↓
                       SKIPPED (with skip_reason; never transitions further)
```

- **PROPOSED** — Stage 1.5 component proposed
- **COMPONENT_PICKED** — Stage 2.4 user picked a `master_components` row; `picked=true`
- **STAGE_2_VERIFIED** — Stage 2.8 verified asset_library_ref resolves
- **BUILT** — Stage 3.4 component code generated/imported into project
- **DEPLOYED** — Stage 3.8 component renders in deployed page
- **SKIPPED** — Stage 2.4 user explicitly skipped with `skip_reason`; Stage 3 won't generate code for this slot

---

## 5. risk_lifecycle_transitions

**Phases (per Codex P1 #10 — `resolved` state, never delete):**
```
NONE → open → accepted → resolved
              ↓
              open (un-accept)
              
NONE → open → resolved (skip accepted)
```

- **open** — Stage 1.7 risk identified; Stage 4 may add new opens
- **accepted** — User explicitly accepts risk with `sunset_date` (re-evaluate by date)
- **resolved** — Mitigation deployed; `resolved_at` + `resolution_summary` recorded; row hidden by default but kept for audit

**Sunset reminders:**
- Tracker UI shows sunset countdown chips (amber→red as date approaches)
- Skill surfaces at session start: "1 accepted risk approaching sunset (no-rate-limit, expires in 5 days)"

**evidence_kind values:**
- `stage1_initial` (NONE → open)
- `iteration_<N>_added` (NONE → open at Stage 4)
- `user_accepted` (open → accepted)
- `auto_unaccept` (accepted → open if sunset passed)
- `mitigation_deployed` (any → resolved)

---

## 6. iteration_item_transitions

**Phases (matches `iteration_items.status`):**
```
NONE → pending-review → locked → building → verifier-pending → verified → integrated
                          ↓                        ↓
                          rejected (cancel)        rejected (verifier BLOCK + user reject)
```

- **pending-review** — Stage 4.2 classifier output; awaiting 4.3 lock
- **locked** — Stage 4.3 user locked the list
- **building** — Stage 4.6 codegen in progress
- **verifier-pending** — Stage 4.7 verifier dispatched
- **verified** — verifier APPROVE
- **integrated** — Stage 4.8 merged to main, in Ottomate
- **rejected** — user rejected at any stage (cancel iteration, drop item)

**evidence_kind values:**
- `classified` (NONE → pending-review)
- `user_lock` (pending-review → locked)
- `codegen_started` (locked → building)
- `verifier_dispatched` (building → verifier-pending)
- `verifier_approve` (verifier-pending → verified)
- `verifier_block_user_reject` (verifier-pending → rejected)
- `pr_merged` (verified → integrated)
- `iteration_cancelled` (any → rejected)

---

## Transition write pattern

Every entity update should write a transition row in the same DB transaction. Example for feature SPECCED:

```typescript
db.transaction(() => {
  // Update entity
  db.update(features)
    .set({ current_phase: 'SPECCED', updated_at: now })
    .where(eq(features.id, featureId));
  
  // Append transition (immutable audit row)
  db.insert(featurePhaseTransitions)
    .values({
      feature_id: featureId,
      from_phase: 'PROPOSED',
      to_phase: 'SPECCED',
      transitioned_at: now,
      session_id: sessionId,
      evidence_kind: 'stage1_verification',
      evidence_ref: verificationReportId,
      triggered_by: 'skill_auto',
    });
});
```

If the transaction fails, both rows roll back. Anti-gaslight: ledger is always consistent with current state.

---

## Cross-stage audit queries

The ledger answers questions like:

### Q: Full lifecycle of feat-player-search?

```sql
SELECT * FROM feature_phase_transitions
WHERE feature_id = 'feat-player-search'
ORDER BY transitioned_at;
```

Returns chronological history; user can see every state change with evidence.

### Q: Which features changed in iteration #42?

```sql
SELECT DISTINCT feature_id FROM feature_phase_transitions
WHERE evidence_ref LIKE '%iter-42%'
   OR evidence_kind = 'iteration_42_modify';
```

### Q: Which features have been verified more than once?

```sql
SELECT feature_id, COUNT(*) AS verifier_runs
FROM feature_phase_transitions
WHERE evidence_kind = 'verifier_approve'
GROUP BY feature_id
HAVING COUNT(*) > 1
ORDER BY verifier_runs DESC;
```

### Q: Average time from PROPOSED to INTEGRATED per feature?

```sql
WITH lifecycle AS (
  SELECT 
    feature_id,
    MIN(transitioned_at) FILTER (WHERE to_phase = 'PROPOSED') AS proposed_at,
    MAX(transitioned_at) FILTER (WHERE to_phase = 'INTEGRATED') AS integrated_at
  FROM feature_phase_transitions
  GROUP BY feature_id
)
SELECT AVG(julianday(integrated_at) - julianday(proposed_at)) AS avg_days_to_integrate
FROM lifecycle
WHERE integrated_at IS NOT NULL;
```

### Q: Which transitions today and by whom?

```sql
SELECT 
  feature_id, from_phase, to_phase, evidence_kind, triggered_by, session_id
FROM feature_phase_transitions
WHERE date(transitioned_at) = date('now')
ORDER BY transitioned_at DESC;
```

---

## Tracker UI surface — `/audit/<slug>`

Per CC-7 D-CC7.5, Ottomate UI exposes ledger queries via `/audit/<slug>` page:

- Timeline view: all transitions for the project, filterable by entity / phase / evidence_kind
- Per-entity drill-in: click feature → full lifecycle table
- Anti-gaslight violations panel: live results of the 7 detection rules
- Cross-iteration view: which features changed across last N iterations

---

## Migration plan

For existing projects (the 14 already in Ottomate):

1. Add columns + new tables (migration files in `tracker-migrations/sql/0001_phase_transitions.sql`)
2. Backfill `current_phase`:
   - Features in already-shipped projects → `INTEGRATED`
   - Features in projects past Stage 1 verification but no Stage 2 → `SPECCED`
   - Features in stub state (Stage 1 partial) → `PROPOSED`
3. Backfill transition rows: one synthetic row per existing entity:
   ```sql
   INSERT INTO feature_phase_transitions
   SELECT NULL, id, 'NONE', current_phase, COALESCE(updated_at, created_at), 
          'migration', 'backfill_from_existing_state', NULL, 'migration', 
          'Synthetic row for pre-ledger state'
   FROM features;
   ```
4. After backfill, ledger is authoritative for all future transitions

---

## Why this matters

Without the ledger:
- "Where did this feature come from?" → no answer
- "When was this verified?" → no answer
- "Which features were silently dropped?" → no answer
- "Why is `feat-X` at phase REGRESSED?" → narrative-only, untrustworthy

With the ledger:
- Every state change has timestamp, session, evidence
- 7 detection rules can run mechanically
- Cross-session audit is trivial SQL
- Anti-gaslight bedrock has objective substrate, not just convention

The ledger is the truth that survives narrative drift.
