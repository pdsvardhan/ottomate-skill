# Anti-Gaslight Detection Rules — 6 active + 1 deferred

The substrate that catches scope drift, silent additions, missing verification, and other gaslighting patterns. Rules query the phase ledger tables (see `ledger-tables.md`) and entity tables.

**Status (2026-05-13):**
| Rule | Buildable | Status |
|---|---|---|
| 1 — Unreconciled claims | ✅ `feature_claims` table built (migration 0008 applied 2026-05-13) | **Active.** Skill must emit claim rows via `POST /api/feature-claims` for rule to fire. |
| 2 — Silent provenance | ✅ `_provenance` column exists (migration 0005 applied) | Active. |
| 3 — Silent drops | ✅ `derived_from_sketch_id` column exists | Active. |
| 4 — Coverage gaps | ✅ uses existing tables; `test_runs` table now available for tighter signal | Active (enhanced). |
| 5 — must_haves / non_goals violations | ✅ uses iteration_items | Active. |
| 6 — Phase order violations | ✅ phase_transitions tables exist | Active. |
| 7 — Stale verifier | ✅ uses verification_reports + entity.updated_at | Active. |
| 5b — Deploy gap (new) | ✅ `deploy_artifacts` table built 2026-05-13 | Active. Detects features BUILT >7 days with no deploy_artifact row. |



**When rules fire:**
- Every stage transition (1.9, 2.8, 3.5/3.7/3.8, 4.7/4.8) — HARD halt on any rule violation
- Every pack-up — SOFT warning if any violations detected
- Every `/ottomate <slug>` invocation — INFO surfaces unresolved violations as a session-start warning

**Severity:**
- HARD = stage transition refused; user must fix
- SOFT = surface via AskUserQuestion at appropriate moment
- INFO = surface in pack-up summary; no action required

---

## Rule 1 — Unreconciled claims (ACTIVE)

> **Status (2026-05-13):** `feature_claims` table built + applied. API endpoint `POST /api/feature-claims` available. Rule queries unreconciled rows directly.
>
> **For rule to fire effectively:** skill must POST a `feature_claim` row every time a coder agent reports "done", every iteration-summary mentions "shipped", every chat assertion claims completion. Verifier completion handler should PATCH the matching claim's `reconciled_with` to `verified` / `partial` / `stub-detected` / `dropped`.
>
> The rule has two complementary queries below: the primary against `feature_claims` (catches all claim sources), and a fallback against `verification_reports` (still useful when no claim row was emitted but a phase transition went past `VERIFIED` without verifier APPROVE).

**Primary query — unreconciled `feature_claims`:**
```sql
SELECT fc.feature_id, f.title, fc.claimed_at, fc.claim_text, fc.source, fc.claimed_by_session
FROM feature_claims fc
LEFT JOIN features f ON f.id = fc.feature_id
WHERE fc.reconciled_with = 'unreconciled'
  AND fc.claimed_at < datetime('now', '-1 hour');
```

**Fallback query — phase advanced past VERIFIED without verifier APPROVE:**

**What:** A feature transitioned to `INTEGRATED` (or `VERIFIED`) but has no `verification_reports` row with `recommendation_overall='APPROVE'` for that feature.

**Why:** Indicates Claude or skill claimed the feature is done without the verifier sub-agent confirming. Anti-gaslight bedrock says verifier is mandatory.

**Severity:** HARD at stage transition; SOFT at pack-up.

**Query:**
```sql
SELECT f.id, f.title
FROM features f
WHERE f.current_phase IN ('VERIFIED', 'INTEGRATED')
  AND NOT EXISTS (
    SELECT 1 FROM verification_reports vr
    WHERE vr.target_kind = 'feature'
      AND vr.target_id = f.id
      AND vr.recommendation_overall = 'APPROVE'
  );
```

**Remediation:** Re-run verifier on flagged feature. If verifier still BLOCKs, revert phase transition and address verifier findings.

---

## Rule 2 — Silent provenance

**What:** A `features` / `flows` / `pages` / `components` / `risk_instances` row exists with NO `_provenance.source_substring` (or equivalent) AND NO `derived_from_sketch_id` (or equivalent ancestor link).

**Why:** Means Claude added an entity that doesn't trace to user input or to an upstream sketch. Anti-hallucination guard violated.

**Severity:** HARD at every stage transition; SOFT at pack-up.

**Query:**
```sql
-- features
SELECT f.id, f.title FROM features f
WHERE f.derived_from_sketch_id IS NULL
  AND (f._provenance->>'source_substring' IS NULL 
       AND f._provenance->>'why_inferred' IS NULL);

-- repeat for flows, pages, components, risk_instances
```

**Remediation:** Surface flagged entity to user; user either confirms (provenance becomes `user_typed_at_<sub-step>`) or rejects (entity deleted; ADR if it was used downstream).

---

## Rule 3 — Silent drops

**What:** A `features_sketch[]` entry from finalized ND1 has NO corresponding `features` row AND NO ADR documenting the drop.

**Why:** Means a user's idea was dropped without explicit acknowledgment. Classic gaslight pattern.

**Severity:** HARD at Stage 1 → Stage 2 transition; SOFT at pack-up.

**Query:**
```sql
-- For each project's nd1_archive.features_sketch[]:
-- For each sketch entry sk-feat-X:
SELECT sketch_id 
FROM jsonb_array_elements(nd1_archive.features_sketch)
WHERE NOT EXISTS (
  SELECT 1 FROM features f WHERE f.derived_from_sketch_id = sketch_id
)
AND NOT EXISTS (
  SELECT 1 FROM adr_index a 
  WHERE a.tags @> '["dropped-feature"]'::jsonb
    AND a.body LIKE '%' || sketch_id || '%'
);
```

(Same shape for flows_sketch.)

**Remediation:** Surface dropped sketches at Stage 1.9 verification; user either creates ADR explaining drop ("decided this is out of scope") or restores feature.

---

## Rule 4 — Coverage gaps

**What:** A `must_haves` entry from Doc 1 is unmapped to any feature / flow / page / AC. OR a `success_criteria_initial` entry has no feature whose AC covers it.

**Why:** User's stated requirements aren't reflected in what was built. Silent narrowing.

**Severity:** SOFT at every stage transition (HARD at 1.9 if must_haves coverage = 0); INFO at pack-up.

**Query:**
```sql
-- must_haves coverage
SELECT mh FROM (
  SELECT jsonb_array_elements_text(preferences->'must_haves') AS mh
  FROM projects WHERE slug = ?
) AS must_haves
WHERE NOT EXISTS (
  SELECT 1 FROM features f
  WHERE f.project_slug = ?
    AND (f.title ILIKE '%' || mh || '%' 
         OR f.short_description ILIKE '%' || mh || '%'
         OR EXISTS (
           SELECT 1 FROM feature_acceptance_criteria fac
           WHERE fac.feature_id = f.id
             AND fac.value ILIKE '%' || mh || '%'
         ))
);

-- success_criteria coverage (similar shape)
```

**Remediation:** Surface unmapped items; user either adds a feature/AC that covers, or relaxes the must_have/success_criterion via ADR.

---

## Rule 5 — must_haves / non_goals violations

**What:** An `iteration_items` row has a `proposed_change` that conflicts with locked `must_haves` (Doc 1) or `non_goals_initial` AND there's no override ADR.

**Why:** Stage 4 iteration trying to violate the rails the user explicitly set. The exact gaslight pattern Stage 4.3 lock-in gate exists to prevent — but rule catches if lock-in failed.

**Severity:** HARD at Stage 4.3 lock; HARD at Stage 4.8 integrate; SOFT at pack-up if any open iteration has violation.

**Query:**
```sql
SELECT ii.id, ii.title, ii.proposed_change
FROM iteration_items ii
JOIN iterations i ON i.id = ii.iteration_id
JOIN projects p ON p.slug = i.project_slug
WHERE i.status IN ('locked', 'building', 'verifying')
  AND (
    -- regex check: proposed_change.action_summary against non_goals
    EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(p.preferences->'non_goals') AS ng
      WHERE ii.proposed_change->>'action_summary' ILIKE '%' || ng || '%'
    )
    OR
    -- contradicts must_haves (e.g., "remove keyboard nav" vs must_have "keyboard nav")
    EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(p.preferences->'must_haves') AS mh
      WHERE ii.proposed_change->>'action_summary' ILIKE '%remove%' || mh || '%'
        OR ii.proposed_change->>'action_summary' ILIKE '%disable%' || mh || '%'
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM adr_index a
    WHERE a.iteration_id = i.id
      AND a.tags @> '["override"]'::jsonb
  );
```

**Remediation:** Block lock; surface violation to user; user either rejects the iteration item, edits to comply, or creates explicit override ADR (which retires the must_have/non_goal).

---

## Rule 6 — Phase order violations

**What:** A `<entity>_phase_transitions` row shows a transition that skips intermediate phases. E.g., feature went `PROPOSED → INTEGRATED` without `SPECCED / BUILD_READY / BUILDING / VERIFIED` rows in between.

**Why:** Means a stage was skipped silently. Ledger should be a complete record.

**Severity:** HARD at every transition; HARD at pack-up.

**Query:**
```sql
WITH transitions AS (
  SELECT 
    feature_id,
    transitioned_at,
    from_phase,
    to_phase,
    LAG(to_phase) OVER (PARTITION BY feature_id ORDER BY transitioned_at) AS prev_to_phase
  FROM feature_phase_transitions
)
SELECT * FROM transitions
WHERE prev_to_phase IS NOT NULL
  AND from_phase != prev_to_phase;
```

(Detects ledger gaps: from_phase of new transition doesn't match to_phase of previous.)

Plus phase-order validity check:
```sql
-- Valid feature transitions
PROPOSED → SPECCED
SPECCED → BUILD_READY
BUILD_READY → BUILDING
BUILDING → VERIFIED  (or BUILDING → BUILDING via auto-fix iteration)
VERIFIED → INTEGRATED
Any → DROPPED (via ADR)
INTEGRATED → REGRESSED (Stage 4 modification)
REGRESSED → BUILDING (re-iteration)

-- Invalid transitions (rule fires on these):
PROPOSED → INTEGRATED  (skip)
PROPOSED → BUILDING  (skip)
SPECCED → INTEGRATED  (skip)
```

**Remediation:** Investigate ledger gap; usually means transition write was missing (write the missing row) OR phase was illegally skipped (rollback to prev phase, walk through normally).

---

## Rule 7 — Stale verifier

**What:** A feature's last verifier run was >7 days ago AND the feature has been edited since (Stage 4 iteration touched it).

**Why:** Stage 4 may have changed code without re-running the verifier. Coverage erodes.

**Severity:** SOFT at every Stage 4.8 integrate; INFO at pack-up.

**Query:**
```sql
SELECT 
  f.id, f.title,
  f.updated_at AS last_edited_at,
  vr.ran_at AS last_verifier_run
FROM features f
LEFT JOIN LATERAL (
  SELECT MAX(ran_at) AS ran_at
  FROM verification_reports
  WHERE target_kind = 'feature' AND target_id = f.id
    AND recommendation_overall = 'APPROVE'
) vr ON true
WHERE f.updated_at > vr.ran_at
  AND f.updated_at < NOW() - INTERVAL '7 days';
```

**Remediation:** Stage 4 iteration that touches a feature should re-run verifier on that feature even if the iteration item didn't directly target it (regression risk). Or surface: "feat-X was edited at iter-3 but verifier hasn't run since iter-1; re-run?"

---

## Cross-cutting: where rules surface

### At every stage transition

Stage 1.9 verification, Stage 2.8 verification, Stage 3.5/3.8 deploy gate, Stage 4.7/4.8 integrate.

Each transition runs `GET /api/audit/<slug>/anti-gaslight-violations?severity=HARD&phase=<phase>` and refuses transition if any HARD violations.

### At every pack-up

Run `GET /api/audit/<slug>/anti-gaslight-violations?severity=ALL`. Surface SOFT and INFO in pack-up summary:

```
🧳 Pack up complete.

  ⚠ 2 anti-gaslight findings (review at next session):
     · Rule 4: must_have "keyboard nav" — coverage hint not found in features
     · Rule 7: feat-search verifier last ran 8 days ago, edited at iter-3
```

### At session start

Run `GET /api/audit/<slug>/anti-gaslight-violations?severity=ALL` on first project load.

```
[Stage 1.3] feat-player-search — refining
  ⚠ Note: 1 anti-gaslight finding pending review (Rule 4 — keyboard nav coverage)
```

User can drill in via `/audit/<slug>` or address inline.

---

## Schema additions for ledger-driven rules

The rules require these columns on entity tables:

```sql
ALTER TABLE features ADD COLUMN current_phase TEXT NOT NULL DEFAULT 'PROPOSED';
ALTER TABLE features ADD COLUMN _provenance JSONB;
ALTER TABLE features ADD COLUMN derived_from_sketch_id TEXT;
ALTER TABLE features ADD COLUMN derived_from_nd1_version INTEGER;
-- (sqlite uses TEXT for JSON, no JSONB)

-- Same for flows, pages, components, risk_instances
```

And the 6 phase transition tables (see `ledger-tables.md`).

---

## Why this matters

The user's stated pain: scope drift, silent additions, "Claude says it's done but I'm not sure," the media-dashboard regression. Without rules, every stage transition relies on Claude's narrative honesty. With rules, every transition runs an objective check that doesn't trust narrative.

**Rules detect what narrative hides.**

The cost: ~50ms per rule × 7 rules × per transition = ~350ms (mechanical SQL). Worth it.
