# Output Style + Trigger Phrases — Discipline Rules

**Origin:** the user's pain — *"why a simple task of loading all projects is so complicated looking?"* The skill defaults to multi-column markdown tables when given structured data. This file globalizes the fix.

**Applies to:** every dialog-rendering moment in the skill (project listing, feature/flow/page lists in panels, coverage reports, handoff summaries, trace reports).

> **Merged 2026-07-02:** the trigger-phrase table (formerly `trigger-phrases.md`) now lives in the "Trigger phrases" section at the bottom of this file — both were loaded every session, so they are one read now. This file is the SINGLE source of trigger truth; stage references link here and must not carry their own phrase tables.

---

## Hard rules

### R1. Compact one-line per item (default for any list ≥3 items)

**Format:**
```
<id>  ·  <key field>  ·  <secondary field>  ·  <tagline truncated to 60 chars>
```

**Example (project list):**
```
cricket-stats  ·  building/building   ·  :8101  ·  IPL stats head-to-head comparison
balls-of-the-bull  ·  building/building   ·  :8501  ·  Manual entry SQLite tracker
```

**Anti-pattern (what NOT to do):**
```
| Slug | Display Name | Stack | Port | Tagline |
|------|------|------|------|------|
| cricket-stats | Cricket Stats | Next.js 15 + better-sqlite3 ... | 8101 | ... |
| ... 14 rows ... |
```

### R2. Tables only on explicit user request

If user says "show me as a table" / "compare these as a grid" → table OK.
Otherwise → compact one-line.

### R3. No multi-paragraph descriptions per item in a list

User drilled into ONE specific item → multi-paragraph OK.
Listing N items → one line per item; user clicks/types to drill in.

### R4. Hard line caps

| Context | Cap |
|---|---|
| Primary list (projects, features, flows) | 30 lines |
| Drill-in detail | 60 lines |
| "Show me everything" explicit request | 100 lines |
| Trace Report | 80 lines |
| Handoff summary | 20 lines |

If output would exceed cap → abbreviate older/archived/lower-priority items as one-liners; offer "see more" affordance.

### R5. No emoji unless user uses them first

Skill's structured output is emoji-free. If user uses emoji in their input, skill may match style. Default = no emoji.

### R6. Numbers visible in headers

```
✓ ND1 finalized — cricket-stats
  9 features sketched   5 flows sketched   6 risks identified
```

NOT:
```
ND1 finalized for cricket-stats. We've sketched several features...
```

### R7. No preambles

Forbidden phrases in skill's structured output:
- "Loading..."
- "Let me think about this..."
- "Sure, I'd be happy to help..."
- "Great question!"
- "Here's what I found..."

Get to the answer.

### R8. Compact summaries beat verbose breakdowns

Prefer:
> 9 features locked, avg AC quality 0.81, 0 stub-detected, 100% coverage on success_criteria.

Over:
> Feature 1 has 3 acceptance criteria, the first is "Search returns matching players", the quality score is 0.92...

User can drill in if they want detail.

---

## Templates per dialog type

### Project listing (Phase 2 routing, no slug provided)

Columns: `slug · category · status/lifecycle · port · tagline`. Category comes from `projects.tags` — surface `personal`, `cv`, or `personal,cv` (in that order); show `—` if neither present.

```
PROJECTS — pick a slug to load, or type "new" to create

cricket-stats   ·  cv           ·  building/building  ·  :8101  ·  IPL h2h stats
home            ·  personal,cv  ·  building/building  ·  :8500  ·  VAULT7A landing
media-dashboard ·  personal     ·  building/building  ·  :8504  ·  Self-hosted media cockpit
... 6 more ...

Type a slug, "new", "/ottomate personal" / "/ottomate cv" to filter, or "/ottomate <slug> <quick bug report>".
```

**Filter shortcuts.** When `$ARGUMENTS` is exactly `personal` or `cv` (case-insensitive, single token), filter the project list to rows whose `tags` array contains that value. Render with the same template; header becomes `PROJECTS (personal) — ...` or `PROJECTS (cv) — ...`.

### Stage 0/1/2/3/4 sub-step entry

```
[STAGE 1.3] Doc 3 features refinement — 9 sketches → final rows
Inputs ready · processing locked at 1.1

Continuing now.
```

### Sub-step exit

```
✓ 1.3 complete — 9 features locked (6 bulk-approved · 2 edited · 1 added)
  AC quality avg: 0.81 · coverage: 3/3 success_criteria · 1/1 must_haves
  Continuing to 1.4 (flows).
```

### Sanity check pass

```
✓ Bootstrap clean — 8/8 checks passed in 1.8s
```

### Sanity check fail

```
✗ Bootstrap BLOCKED — 2 issues need fixing:

  DB schema behind                version 12, expected 14
  Bearer token missing            file at /opt/homeserver/ottomate/.token

[ Run npm run db:migrate? ]   [ Regenerate token? ]   [ Abort ]
```

### Project load — open tasks (to-do surface)

Shown in the load status block per `references/task-tracking.md` (source: `GET /api/projects/<slug>/todos`). Open count in the header, one compact line per task. Zero open → `Tasks — none open`. More than ~8 → list 8 then `+N more (full list via GET /api/projects/<slug>/todos)`.

```
Tasks — stateofus (1 open)
  • Fix red CI — pause tests, kill Chrome re-download · → .gitea/workflows/ci.yml
```

### Lock-in gate panel (Stage 4.3 — see references/propose-confirm.md, relocated from prompts/ 2026-06-11)

Per the locked panel design — original message collapsible, items in cards with confidence + source_substring, must_haves + non_goals as visible rails, action buttons.

### Trace report (Stage 4.8)

Per the locked Trace Report design — original → items locked → built per item → AC regression → coverage delta → ADR (if any) → anti-gaslight bedrock confirmation.

### Pack-up summary

```
🧳 Session packed up.

Stage: 1.3 features refinement
Duration: 38 min · ~24K tokens
Files changed: 4 · Commits: 2 · Decisions: 1 ADR
Next session pickup: continue 1.4 (flows refinement) — 4 sketches ready
```

(Emoji ok in pack-up since "🧳" is functional iconography for "luggage/packing", same way "✓" / "✗" are.)

---

## Anti-pattern catalog (don't do these)

### AP1. Multi-column markdown table for structured lists when not requested

Already covered above. The most common drift.

### AP2. Per-item full description block

```
**feat-player-search** — Find any IPL player by name; pick two for comparison.
This feature is the foundation for the comparison view that comes later. The
player data is sourced from a manual CSV upload, refreshed manually after each
match. The search supports both first name and last name lookups...

**feat-comparison-view** — Side-by-side stats: T20s vs ODIs vs total. This
feature renders the comparison after two players are selected...
```

For 9 features that's 3+ pages of output. The user wanted the LIST, not 9 essays. Use one-liners; offer drill-in.

### AP3. Redundant restatement of user's request

User: "Show me cricket-stats coverage."
**Bad:** "Sure! You want to see the test coverage for the cricket-stats project. I'll fetch that for you now. Here's the cricket-stats coverage..."
**Good:** "cricket-stats coverage: 67% lines, 8/12 flows tested (3 untested: search-empty, refresh-fail, mobile-tap)."

### AP4. Walls of text for explanations

If user asked HOW something works (rare), explain. If user asked FOR something, deliver it; explain only if asked.

### AP5. Excessive options when one is right

Opinionation rule applies. If the answer is clearly Next.js (per tech_hints + picked components), recommend Next.js with one-line rationale. Don't list 5 frameworks with pros/cons.

### AP6. Trailing meta-commentary

**Bad:** "I hope this helps! Let me know if you have any questions about the implementation."
**Good:** (nothing — just stop)

The structured output is the deliverable. Don't add narration after it.

---

## Where this is enforced

Each sub-step audit lists which dialog moments use this style:

- Stage 0.5 — slug + display + port batched panel
- Stage 0.7 — intent deepening 2-turn batched
- Stage 0.10 — sketches paginated card panel
- Stage 1.3 — features refinement card panel (10/page)
- Stage 1.4 — flows refinement card panel
- Stage 1.5 — pages + components card panel
- Stage 2.2 — UI Master Plan 3-stage panel
- Stage 2.4 — per-component selection card panel
- Stage 4.3 — lock-in gate panel (THE most important)
- Stage 4.8 — trace report
- Phase 2 — project listing
- Phase 5 — pack-up summary

---

## Anti-gaslight angle

The output style is anti-gaslight because:
- Compact summaries make it hard to hide things in walls of text
- "Numbers visible" forces objective reporting (counts, percentages, durations)
- "No preambles" prevents narrative drift away from the user's actual question
- Hard line caps prevent skill from burying important info

User can always drill in for detail. Default to compact + truthful.

---

# Trigger phrases

The skill detects user phrases as transition signals. Detection runs continuously during work — at any sub-step, if the user types one of these, the skill advances or wraps.

## Detection discipline (CC-2, 2026-04-29)

These rules govern WHEN a phrase fires:

1. **Position-aware:** phrases fire only at message **start** OR as **entire message**. "let's move on to discuss the API design" doesn't fire "let's move on" advance.
2. **Phase-aware:** "next" disambiguates by **active context** — next-step / next-item / next-stage based on what dialog is open.
3. **Question-mark suppresses** trigger firing (interrogatives, not commands). "Ready to test what?" doesn't fire "ready to test" trigger.
4. **Exclusion list:** "next time" / "next week" / "next month" → not "next" advance. "I want to pause that feature" → not "pause" trigger.
5. The skill scans every message; ambiguous matches surface AskUserQuestion to disambiguate (see the implementation note below — Claude is the parser, these are judgment rules).

## Forward transitions

| Phrase pattern | Effect |
|---|---|
| "let's move on" / "next" / "ready" / "proceed" / "let's go" | Move to next sub-stage in current reference |
| "ND1 done" / "preprocessing done" / "stage 0 done" | Finalize ND1 (end Stage 0 preprocessing) |
| "stage 1 done" / "let's complete stage 1" | End Stage 1 → run SO1 verification (if mid-Stage-0, AskUserQuestion: user may mean ND1 finalize under the old numbering) |
| "let's get to stage 2" / "move to stage 2" / "stage 2 now" | Transition Stage 1 → Stage 2 |
| "let's pick components" | Stage 2: enter component picking (after UI master plan saved) |
| "let's scaffold" / "let's get to stage 3" / "build it" / "ready to build" | Transition Stage 2 → Stage 3 |
| "let me test" / "ready to test" / "I'll review now" | Transition out of build, ready for Stage 4 |
| "analyze" / "classify" / "process this" | Trigger Stage 4 step 4.2 (classification) |
| "lock & build" / "approve all" / "looks good, build" | Lock Stage 4 step 4.3 list, kick off build |

## Backward / pause transitions

| Phrase pattern | Effect |
|---|---|
| "go back" / "previous step" / "wait" | Step back to previous sub-step (no work undone, just re-enter dialog) |
| "let me think" / "pause" / "hold on" | Pause work, save state, wait for user signal |
| "skip" / "next item" / "move on" (in Stage 4 item review) | Skip current item, move to next in list |

## Wrap signals

| Phrase pattern | Effect |
|---|---|
| "pack up" | Run full session-end ritual (see `pack-up-ritual.md`) |
| "done" / "good night" / "wrap up" / "that's all" / "see ya" | Same as "pack up" |
| "save and quit" / "stop" / "end session" | Same as "pack up" but more abrupt — minimal cleanup |

## Disambiguation

If a phrase is ambiguous (e.g., "next" mid-list), use the immediate context:
- In a step-by-step dialog → next step
- In an item review → next item
- In a stage transition prompt → confirm transition

If genuinely unsure, ask via `AskUserQuestion`:
- "Did you mean 'next sub-step' or 'next item in list' or 'next stage'?"

## Implementation note (honest version, 2026-06-10)

There is no regex engine in the loop — Claude is the parser, applying these tables as judgment guidance. That means: treat the discipline rules above (position, question-mark suppression, exclusions) as how to JUDGE, not as mechanical guarantees, and lean on the one mechanism that actually holds — **when in doubt, AskUserQuestion**. A missed trigger costs one extra message; a false fire costs an unwanted stage transition. Bias accordingly: only fire when confident.

Phrases that don't match any pattern fall through to normal content handling (free-form input for the current sub-step's question).
