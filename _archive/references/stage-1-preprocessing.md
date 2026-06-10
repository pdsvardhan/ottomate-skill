# Stage 1 — Preprocessing (Type 1 + T2P)

Both flows produce the same `staging/ND1.yaml` (28 components — see `schemas/nd1.schema.yaml`). They differ at intake.

## Journey detection (auto)

On `/project` invocation, inspect what user provided:

```
text-only input → Type 1
ANY of:                  → Type 2
  - code files / repository
  - docs (MD, txt, docx, pdf)
  - URLs to sample sites
  - data files (CSV, JSON, etc.)
ambiguous → AI asks user
```

## Type 1 Preprocessing — 8 steps (no docs)

### Step 1: Journey Detection
Confirm Type 1 with user via `AskUserQuestion`:
- Question: "I see your project intent — no artifacts attached. Is this a from-scratch idea (Type 1)?"
- Options: "Yes — Type 1 (no artifacts)" / "No — I have files I forgot to attach (Type 2)" / "Mixed — let me explain"

### Step 2: Sanity Check (gate)
Run `scripts/sanity-check.sh --stage=1`. See `references/sanity-check.md` Stage 1 section. Halt on HARD failures.

### Step 3: Initial Intent Capture
Free-form prompt to the user:
> "Tell me what you want to build. Describe it in your own words — what it does, who uses it, what makes it useful. Don't worry about being structured; we'll organize it together."

Capture raw response → `core_idea` candidate (will be refined in step 5).

### Step 4: Slug + Display Name Negotiation
AI proposes 2-3 slug options based on the intent. User picks via `AskUserQuestion`.

Slug rules:
- `^[a-z][a-z0-9-]+$`, 3-40 chars
- Must be unique (validated against Ottomate DB `projects.slug`)
- Display name 1-60 chars, any case

Validate uniqueness; if collision, propose alternatives.

Lock `proposed_slug` + `proposed_display_name` → ND1 fields #1, #2.

Create provisional row in Ottomate DB (`status: ideating`, `lifecycle: ideating`).

### Step 5: Intent Deepening Dialog
Sequence of `AskUserQuestion` calls (one at a time, conversational):

1. **Problem statement** — "What problem does this solve? In a few sentences." (free text → ND1 #6)
2. **Target users** — "Who uses this? List user types." (multiselect or free text → ND1 #7)
3. **Non-goals** — "What is this NOT? List things we explicitly won't build." (list, min 1 → ND1 #8). *Critical for anti-gaslighting.*
4. **Success criteria** — "How will you know it's working? List qualitative markers (e.g., 'compare players in <3 clicks')." (list, min 3 → ND1 #9)
5. **Core idea (final form)** — AI rewrites the intent as a clean paragraph based on prior answers; user approves or edits → ND1 #5

If user struggles on non-goals, prompt with examples: "Common non-goals: 'no user accounts', 'no payment processing', 'no real-time chat', 'mobile-first only'."

### Step 6: Preferences Dialog
Sequence:
1. **Likes** — "What excites you about this? Any patterns you love?" (list → ND1 #10)
2. **Dislikes** — "What patterns / styles / behaviors do you NOT want?" (list → ND1 #11)
3. **Must-haves** — "Any non-negotiables?" (list → ND1 #12)
4. **Avoid** — "Anti-patterns to never do?" (list → ND1 #13)

Optional capture (only if user mentions during dialog):
- UI hints (dark mode, palette idea, animation level) → ND1 #25
- Tech hints (framework preference) → ND1 #26
- Integrations mentioned → ND1 #27
- Auth concerns → ND1 #28

### Step 7: AI-Generated Sketches
Based on accumulated context, AI proposes:
- **Features sketch (3-10):** initial feature list with brief titles
- **Flows sketch (3-5):** main user flows (high-level, not detailed steps yet)
- **Risks initial:** likely risk types from project context (e.g., data project → `temp-api-key`, `unencrypted-storage`)

Present to user: "Here's what I think we're building. Refine?"

User edits via dialog. Lock to ND1 #14, #15, #16.

### Step 8: Trigger + ND1 Finalize
Wait for trigger phrase ("let's move on", "stage 1 done", "ND1 done", "let's get to stage 2", etc. — see `references/trigger-phrases.md`).

On trigger:
1. Run completeness check:
   - All mandatory ND1 fields populated
   - Sanity check originally passed
   - Sketches non-empty
2. Write `staging/ND1.yaml` to project repo
3. Validate against `schemas/nd1.schema.yaml`
4. Display summary to user: "ND1 ready. Proceeding to Stage 1 internal."
5. Trigger Stage 1 internal process (see `references/stage-1-internal.md`)

---

## T2P (Type 2 Preprocessing) — 13 steps

Same final ND1 schema, but with sources sections populated and intent dialog informed by artifacts.

### Step 1: Journey Detection
Confirm Type 2:
- Question: "I see artifacts in your message — code/docs/data/URLs. Type 2 (with artifacts)?"
- Options: "Yes — Type 2" / "No — ignore artifacts, go Type 1" / "Mixed — let me clarify"

### Step 2: Sanity Check (extended)
Run sanity check including artifact integrity (checks 11-16). Halt on HARD failures (e.g., file unreadable, leaked secrets).

### Step 3: Artifact Inventory
AI categorizes each artifact into F1/F2/F3/F4:
- F1 = code (extensions: `.py`, `.js`, `.ts`, `.tsx`, `.jsx`, `.go`, `.rs`, etc.)
- F2 = docs (`.md`, `.txt`, `.docx`, `.pdf`)
- F3 = sample URLs (anything starting `https?://`)
- F4 = data (`.csv`, `.json`, `.parquet`, `.xlsx`, etc.)

Show user the categorized inventory. User confirms or recategorizes.

### Step 4: F1 Processing (if code)
For each code file:
- AI summarizes (purpose, language, key components, exports)
- Show summary to user via `AskUserQuestion`:
  - **Question:** "What to do with `<filename>`?"
  - **Options:** "Use as-is" / "Selective tweak (specify what to keep)" / "Overhaul" / "Discard" / "Identify likes (use as inspiration only)"
- Record decision → ND1 #20 `F1_code` entry

### Step 5: F2 Processing (if docs)
For each doc:
- AI reads + summarizes by section
- Per doc: "Use which sections? Drop which?" via dialog
- Record → ND1 #21 `F2_docs` entry

### Step 6: F3 Processing (if sample URLs)
For each URL:
- Fetch via Browser MCP (or curl as fallback)
- Take screenshot
- AI describes the UX / patterns observed
- Per URL: "What to emulate? What to AVOID copying?" via dialog
- Record → ND1 #22 `F3_samples` + #19 `inspirations`
- **Also routes asset references to central UI asset repo** (cross-project, not per-project)

### Step 7: F4 Processing (if data)
For each data source:
- Inspect (CSV → headers + sample rows; JSON → schema; etc.)
- AI summarizes shape (columns, types, row count, gaps)
- Per source: "Source type (one-time / recurring / etc.)? Use decision?" via dialog
- Record → ND1 #23 `F4_data` entry
- Auto-set `data_sketch.has_data_layer: true` → ND1 #24

### Step 8: Slug + Display Name Negotiation
Same as Type 1 step 4. AI may propose slug from existing artifact context (e.g., from existing repo name in F1).

### Step 9: Intent Deepening Dialog (informed by sources)
Same as Type 1 step 5, but **AI pre-populates answers from F1-F4 where possible**:
- README in F2 → extract problem statement, target users, etc.
- Code comments / function names in F1 → suggest core ideas, features
- Sample sites in F3 → suggest visual style preferences

User refines AI's pre-filled answers. Faster than Type 1 because most fields are draft-filled.

### Step 10: Preferences Dialog (informed)
Same as Type 1 step 6. AI proposes preferences from artifact analysis:
- Existing dark mode in F1 → suggest `dark_mode_pref: true`
- Used libraries → suggest tech preferences

### Step 11: Auto-Extracted Hints
Mechanically extract:
- F1 → tech_hints (framework, DB, libs from `package.json` / `requirements.txt`)
- F2 → integrations_initial (mentioned external services)
- F3 → ui_hints (palette / layout from screenshots)
- F4 → auth_intent (if data has user-related fields)

Show extracted hints to user for confirmation; user can override.

### Step 12: AI-Generated Sketches (heavily informed)
Same as Type 1 step 7, but sketches are drawn primarily from sources. User refines.

### Step 13: Trigger + ND1 Finalize
Same as Type 1 step 8.

---

## Common rules across both flows

- **AskUserQuestion tool for all choices.** No prose questions. Multi-step dialogs use sequential calls.
- **One thing at a time.** Don't ask 5 questions in one prompt; sequence them.
- **AI proposes, user refines.** Don't ask blank-slate questions when you can offer 2-3 options.
- **Pre-populate from context.** In T2P, leverage artifacts to draft answers.
- **Trigger phrases are detected at any moment.** If user says "let's move on" mid-step, finalize current step's data and advance.
- **No silent state changes.** Every ND1 field write is shown to the user (via UI or summary).

## Failure modes

| Failure | Recovery |
|---|---|
| User abandons mid-dialog | Save partial ND1 to `staging/ND1.yaml` with `status: partial`. Resume on next session. |
| Sanity check HARD fail | Halt. Show user the failed check + remediation. Wait for fix. |
| Confidence too low on intent | Re-ask with examples. Don't proceed with vague intent. |
| User insists "skip the questions, just build" | Refuse. Anti-gaslighting requires Stage 1. Explain why. Offer to do faster (lite mode) but not skip. |
