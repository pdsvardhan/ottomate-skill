# Stage 0 — Preprocessing (entry point)

Stage 0 is the new top-level stage that handles everything before SO1 production: sanity checks, journey detection, doc translation (Type 2 only), intent dialog, sketches → finalized ND1.

**Output of Stage 0:** `staging/ND1.yaml` written + `nd1_archive` row + Ottomate `projects.lifecycle_phase` still `ideating` (transitions at Stage 1.10).

**Type 1 vs Type 2:** the only divergence is at sub-step 0.3 (Doc Translation, Type 2 only). After 0.3 both paths produce a partial-or-empty ND1 + gap list, then converge on identical sub-steps 0.4-0.11.

---

## 11 sub-steps

```
0.1  Bootstrap sanity         mechanical, ~2s, 0 tokens
0.2  Journey detection        mostly mechanical, ~0-500 tokens
0.3  Doc translation (T2 only) Claude-driven, ~5-15K tokens
0.4  Initial intent capture   hybrid extraction, ~1-1.5K tokens
0.5  Slug + display + port    deterministic, ~0-500 tokens
0.6  Identity sanity          mechanical, folded into 0.1 framework
0.7  Intent deepening         Claude-active refinement, ~1.5-3K tokens
0.8  Preferences              Claude-active refinement, ~1-2K tokens
0.9  External refs sanity     mechanical, conditional
0.10 AI sketches              Claude-DOMINANT, ~5-8K tokens (the meaty one)
0.11 Trigger + ND1 finalize   mechanical wrap, ~0-200 tokens
```

**Total Stage 0 budget:** ~10-20K tokens for Type 1; ~20-40K for Type 2 (doc translation adds the delta).

---

## 0.1 — Bootstrap sanity

See `references/sanity-check.md` Phase 0 — Bootstrap (7 sub-checks).

**Output:** `sanity_check_runs` row + cached result (TTL 30 min).

If any HARD → halt with auto-fix offer; user picks remediation; re-run.

---

## 0.2 — Journey Detection (Type 1 vs Type 2)

### Auto-detect (mechanical)
Regex on user's initial message + attachments:
- `attachments.count == 0 AND fenced_blocks.count < 2 AND no file_path_patterns` → high confidence Type 1
- `attachments.count > 0 OR (fenced_blocks.count >= 2 AND lines >= 30)` → high confidence Type 2
- Borderline (1 fenced block, or only file path patterns mentioned) → ambiguous

### Claude semantic check (~300 tokens, only on borderline)
Claude reads the message, decides whether attachments are intent-bearing (real F1-F4) or referential ("here's a link to inspiration").

### User confirmation
- High-confidence Type 1 → auto-confirm; surface as one-liner: *"Type 1 confirmed (no artifacts detected). Proceeding."*
- High-confidence Type 2 → AskUserQuestion with the categorized inventory: *"Detected Type 2 with 3 docs + 1 sample URL. Proceed with T2P?"*
- Borderline → AskUserQuestion: *"This message contains an attachment + a description. Treat as Type 1 (idea only) or Type 2 (use the attachment)?"*

### Output
```yaml
journey_detection:
  decided_at: <timestamp>
  journey_type: 1                    # or 2
  confidence: high                   # high | borderline | confirmed-by-user
  evidence:
    attachments_count: 0
    fenced_code_blocks: 0
    file_path_patterns: 0
  user_confirmed: false              # true if AskUserQuestion fired
```

---

## 0.3 — Doc Translation (Type 2 only)

Replaces the old 13-step T2P with 8 phases (A-H). The 8-phase summary below IS the operative spec; the full original design is archived in the `_archive/` planning docs (no separate doc-translation reference exists).

**Phases:**
- A: Mechanical inventory (file extension classification → F1/F2/F3/F4)
- B: Hold F1 code at `/staging/code/<slug>/` (no content processing)
- C: Per-doc Claude summarization with adaptive char cap (8K default; 8-25K full process; 25-80K asks user; >80K samples)
- D: Per-URL fetch + Claude UX description (Browser MCP)
- E: Mechanical sample of data files + light Claude annotation
- F: **Claude pass mapping doc summaries → ND1 fields** (per amendment D-AMEND.5)
- G: Single batched user confirmation panel
- H: Mechanical gap list against ND1 mandatory fields

**Output:** `partial_nd1` (with field-level provenance) + `gap_list` (which mandatory fields still need 0.4-0.10 to fill).

For Type 1, this sub-step is skipped entirely. `partial_nd1` is empty; `gap_list` covers everything.

---

## 0.4 — Initial Intent Capture

Free-form user dump captured verbatim to `intent_drafts.core_idea_raw` (immutable; preserved forever).

### Hybrid extraction (3 phases — per amendment D-AMEND.1/2/3/4)

**Phase 1 — Mechanical pre-pass (~0 tokens):**
- Negation patterns: `\bno\s+(\w+(?:\s+\w+){0,3})\b`, `\bwithout\s+...`, `\bdon'?t\s+want\s+...`, `\bavoid\s+...` → `non_goals_candidates`
- Reference patterns: `\blike\s+(\w+)`, `\bsimilar\s+to\s+...`, `\bnot\s+like\s+...` → `inspirations_candidates` with emulate/avoid flag
- Direct hints: keyword bag of action verbs + domain words → `feature_hints_raw`
- Specific patterns: URLs, emails, file paths, port numbers, domain tokens (T20, ODI, etc.)
- Negation neutralization: feature_hints_raw entries that overlap with negation patterns get moved to non_goals

Output: `candidate_hints` (high recall, may have noise)

**Phase 2 — Claude refinement (~800-1500 tokens):**
Single Claude call with the prompt at `prompts/extract-intent.md`. Output JSON:
```yaml
feature_hints:           [{value, source_substring, confidence}]
negated_features:        [{value, source_substring, confidence}]
target_users_candidates: [{value, source_substring, confidence}]
inspirations_candidates: [{value, emulate_or_avoid, source_substring}]
domain_hints:            [{value, source_substring}]
implicit_features_inferred: [{value, why_inferred, source_substring}]
```

**Phase 3 — Validation (~0 tokens, anti-hallucination guard):**
- For each hint: confidence ≥ 0.7 → require `source_substring` present in `core_idea_raw` (case-insensitive substring or fuzzy match ≥90% Levenshtein)
- confidence < 0.7 OR `is_implicit=true` → flag `REQUIRES_USER_CONFIRMATION_AT_0.10`
- Hints failing validation → DROP

### Storage immediate
Persisted to `intent_drafts` table at capture (not just session memory). Session crash doesn't lose the dump.

### Borderline-length re-prompt
If response < 50 chars OR < 10 distinct words → re-prompt with examples.

---

## 0.5 — Slug + Display Name + Port

### Deterministic slug candidates
From `extracted_hints.domain_hints`: lowercase + strip non-alpha + hyphenate + dedupe + truncate to 40. Top 2-3 candidates.

### Display name = title-case the slug
Mechanical transform; user can edit.

### Port allocation
The projects table only knows what Ottomate registered; a port can be busy on the host (another container,
a dev server) and never appear there (#731). Pick the first port in 8500–8599 that is free in ALL of: the
projects table, live listeners (`ss -ltn`), and docker published ports — one batched ssh call:

```bash
ssh pdsv@192.0.2.10 'used=$( { curl -s http://127.0.0.1:8110/api/projects | python3 -c "import sys,json;d=json.load(sys.stdin);r=d if isinstance(d,list) else d.get(\"projects\",[]);[print(p[\"port\"]) for p in r if p.get(\"port\")]"; ss -ltnH | awk "{print \$4}" | grep -oE "[0-9]+$"; docker ps --format "{{.Ports}}" | grep -oE ":[0-9]+->" | tr -d ":>-"; } | sort -un); for p in $(seq 8500 8599); do echo "$used" | grep -qx "$p" || { echo "$p"; break; }; done'
```

Surface the chosen port in the panel; if the DB-max+1 port differs from the first-free port, say so (it means
something unregistered is squatting a port — worth a look, not a blocker).

### Combined panel
ONE AskUserQuestion with 3-5 candidates + "Type my own" + "Generate different options" + (if revive) "⓪ REVIVE existing".

Each candidate pre-checked: format ✓ + slug-unique ✓ + domain-not-in-NPM-proxy ✓ + port-free (projects table + ss -ltn + docker) ✓ + repo-dir-doesn't-exist (else → revive option appears).

### Output
```yaml
slug_negotiation:
  candidates_offered: [...]
  user_choice: { slug, display_name, port, chose_at }
  rejection_history: []
  tracker_row_created: { project_slug, lifecycle_phase: ideating, current_status: building }
```

---

## 0.6 — Identity Lock sanity

See `references/sanity-check.md` Phase 1 — Identity Lock (5 sub-checks: slug-valid, display-name, port-available, domain-available, repo-dir-status).

Fires after 0.5 user choice. HARD halt + jump-back to 0.5 if any fails.

---

## 0.7 — Intent Deepening

**Two-turn batched dialog** (replaces 5 sequential interrogations from old design):

### Turn 1 (free-form)
Problem statement only. If Type 2 with pre-fill from 0.3: show extracted draft + AskUserQuestion *"Approve / Edit / Replace"*. If Type 1: free-form prompt (templated rendering).

### Turn 2 (multiselect AskUserQuestion)

**Audience profile — ask ONCE here, default P1 (#319).** One extra option group in the same panel:
`P1 just me / a demo` · `P2 small team / internal` · `P3 shipped / external users`. Store it at
`ui_master_plans.design_ledger.context.profile` (the `PUT /api/projects/<slug>/ui-master-plan` context
merge). It decides which accessibility-floor rules block vs. advise at Stage 2/3 (`resolveFloor`). When the
owner never set one, `lib/audience-profile.ts resolveProjectProfile()` falls back to `suggestProfile()`
(lifecycle + public_url signals) — a suggestion, shown as such, never written back as if the owner chose it.
Three multiselects in one panel:
- target_users (≥1; pre-filled from extracted_hints.target_users_candidates)
- non_goals_initial (≥1; templates seed + Claude refines for project specificity per amendment D-AMEND.6)
- success_criteria_initial (≥1, max 10; templates seed + Claude refines — ceremony floor removed 2026-06-10)

Each list shows AI-proposed candidates + "Add custom" + (Type 2) doc-extracted entries.

### Domain template library
Static `data/intent-templates.yaml` keyed by `domain_hints`. ~10 domains × 5 templates each. Claude actively refines templates for project-specificity rather than just accepting them.

### Conflict detection (regex, 0 tokens)
must_haves vs non_goals overlap, intent vs non_goals contradictions → soft confirm.

### Quality scoring on success_criteria
Heuristic: contains number / time-unit / specific verb (returns, renders, completes) → ≥0.6. Below → soft confirm "this AC will be hard to test."

### Refined core_idea
**Default OFF (anti-gaslight).** No auto-rewrite. Show raw verbatim + AskUserQuestion: *"Edit your phrasing? [No, keep raw / Yes, I'll edit / Show me a tightened version]"*. Only on explicit user opt-in does Claude rewrite.

### Completeness gate
At end of Turn 2: validate problem ≥10 chars, target_users ≥1, non_goals ≥1, success ≥1 (floor relaxed 2026-06-10). If short → AI proposes more candidates with rejection history.

---

## 0.8 — Preferences

**Single batched panel** with:

### Section A: Taste (4 multiselects)
- likes (templates + extracted_hints + "add custom")
- dislikes
- must_haves (becomes hard rails — surfaced at every Stage 4.3 lock-in)
- avoid

### Section B: Technical hints (4 conditional fields)
- ui_hints (dark_mode_pref, palette_hint, animation_level, layout_style) — each with explicit "skip" option
- tech_hints (framework_hint, db_hint, deploy_hint) — each with "skip — let Stage 2 decide"
- integrations_initial (list — Claude proposes from intent + extracted_hints.integrations_candidates)
- auth_intent (none / password / magic-link / oauth / sso / custom / unspecified)

**target_devices** captured here (moved from old 1.2 per D-S1.2.2): `desktop / mobile / tablet / both`.

### Templates seed; Claude actively refines (per amendment D-AMEND.7)

Same approach as 0.7. Static template library + Claude proposes project-specific additions.

### Conflict detection
must_haves vs non_goals overlap (regex). Soft-confirm on hits.

### Auth_intent skip path
Per D-S08.7, `auth_intent: skip` becomes the default (no auth assumed). Stage 1.7 reads this; user can upgrade later via ADR.

---

## 0.9 — External Refs sanity

See `references/sanity-check.md` Phase 3 — External Refs (2 sub-checks, conditional).

Only fires if user mentioned URLs in 0.7/0.8 (inspirations or integrations). Curl reachability with 10s timeout. SOFT-confirm on dead URLs.

---

## 0.10 — AI Sketches

**Claude-DOMINANT** per amendment D-AMEND.8. The most important Claude work in Stage 0.

### Phase A — Generative pass (~3-5K tokens)
Single Claude call with full ND1 context:
- core_idea_raw + (optional) refined
- problem_statement + target_users + non_goals_initial + success_criteria_initial
- likes / dislikes / must_haves / avoid
- ui_hints / tech_hints / integrations_initial / auth_intent
- (Type 2) partial_nd1.features_sketch from 0.3
- extracted_hints from 0.4

Output: features_sketch + flows_sketch with provenance per entry.

**No hard cap** (per user correction). Capture all extracted (Type 2) + AI fills gaps (Type 1) within scope-aware soft targets:

| scope_size | features target | flows target |
|---|---|---|
| nano | 1-3 | 1-3 |
| small | 4-7 | 3-5 |
| medium | 6-10 | 4-6 |
| large | 8-14 | 5-8 |
| xl | 10-15 top-level | 5-10 |

Soft warning at >30 features: "Large project — consider grouping under parent features OR splitting into milestones."

### Phase B — Static rule overlay (mechanical)
Risk catalog matching from `data/risk-rules.yaml` (~30-50 deterministic rules):
- has_data_layer + manual_refresh → data-staleness
- integrations_initial non-empty → third-party-api-failure (per service)
- auth_intent != none → auth-bypass + session-leak
- public exposure → ddos-exposure
- features mention "user input" → xss + injection
- baseline always: no-tests + no-error-tracking (unless tech_hints already specified)

Conflict detection vs non_goals + avoid (regex). Confidence scoring per sketch.

### Phase C — Complementary gap detection (~1-2K tokens — the missed-features catcher)
Second Claude call: *"Look at the features_sketch + flows_sketch you just generated. What's missing that a typical project of this type would have? Propose `complementary_suggestions[]`."*

Examples it should catch:
- Search feature without filter / sort / pagination
- List view without pagination / empty-state
- Create flow without edit / delete (CRUD incomplete)
- Form without validation / error states
- Auth without password-reset (if auth_intent != none)
- Data ingestion without freshness alerting

Surfaces separately in panel: *"AI also noticed these typical companions — want any?"* User picks 0-N.

### Phase D — User review panel
Paginated card panel (10/page); approve all / edit individual / split / merge / reject / add custom / re-generate / **skip-AI escape hatch** (user types own list directly).

scope_size_proposed in this panel (chicken-and-egg fix from earlier; user confirms; Doc 1 at 1.2 reads from there).

### Caching
Hash on `core_idea_raw + non_goals + must_haves + features_sketch_pre_fill + scope_proposal`. Idempotent re-runs cost 0.

---

## 0.11 — Trigger + ND1 finalize

### Trigger detection
Per CC-2 discipline: position-aware, phase-aware, question-mark suppressed, exclusion list. Fires only when phrase at message start AND completeness pre-check passes.

### Validation
Re-validate ND1 against `nd1.schema.yaml`. Errors map to sub-step pointers (jump-back navigation).

### Persistence
- Write `staging/ND1.yaml` to project repo
- Insert `nd1_archive` row (queryable mirror)
- Update `intent_drafts.status: finalized`
- Idempotent re-run (second trigger = no-op)

### Provenance summary in finalize panel
```
✅ ND1 finalized — cricket-stats

  9 features sketched   5 flows sketched   6 risks identified
  Provenance: 5 from intent · 11 ai-proposed · 3 templates · 3 your edits
  Saved: staging/ND1.yaml + project row in Ottomate finalized
  Stage 0 duration: 45 min · ~6.8K tokens

Ready for Stage 1 (SO1 production)?
[ Yes, start Stage 1 now ] [ Pack up, resume later ]
```

### Type 2 diff
For Type 2: shows what came from docs originally vs what changed during dialog. *"From PRD: 4 features. After dialog: 6 features (2 added, 0 removed)."*

---

## What Stage 1 inherits from Stage 0

- `staging/ND1.yaml` (canonical) + `nd1_archive` row (queryable mirror)
- 28 ND1 fields fully populated (with provenance per field)
- All extracted_hints retained (Stage 1 can reuse for refinement)
- Sanity check results embedded (audit at project birth)
- (Type 2) F1 code held at `/staging/code/<slug>/` (referenced; processed at 3.3)

Stage 1.1 reads ND1 mechanically and creates SO1 stub rows.

---

## Resumability

Pack up mid-Stage-0 → state preserved in `intent_drafts` + project row in Ottomates. Next session:
- `/ottomate <slug>` detects partial state
- Surfaces: *"You're at Stage 0.7 (intent deepening). Resume?"*
- User picks resume or restart

No data loss. No "Claude forgot what we were doing."
