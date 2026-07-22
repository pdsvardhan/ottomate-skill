# Stage 4.2 Classifier Prompt (updated — source-substring rule)

Used in Stage 4.2 to extract structured items from raw user feedback (tracker submission or chat message). **Updated per audit:** strict source-substring rule + context-packet (lite scope) instead of full SO1.

---

## When invoked

User submits text via tracker or chat → row in `reports` (status=`pending`) → user clicks "Analyze" (or types "analyze" in chat) → this prompt runs.

---

## Inputs (substituted at dispatch time)

```yaml
{{raw_text}}                             # the report's raw_text, verbatim
{{context_packet}}                       # lite scope per Codex Round 2 (~3-5K tokens)
                                         # NOT full SO1
{{context_packet.features}}              # condensed feature list (id + title only)
{{context_packet.flows}}                 # condensed flow list (id + title)
{{context_packet.pages}}                 # condensed page list (id + title)
{{context_packet.open_bugs}}             # current open bugs (id + title)
{{context_packet.must_haves}}            # locked must_haves rails
{{context_packet.non_goals}}             # locked non_goals rails
{{iteration_history}}                    # last 3 iterations summaries
```

---

## The prompt

```
You are an extraction classifier. Read the user's message carefully and extract
DISCRETE structured items. The user often writes loosely — your job is to convert
their text into individual, actionable items, each tied to a substring of what
they actually wrote.

CRITICAL RULES:
1. Every item MUST have a `source_substring` quoted from the user text. If you
   cannot tie an item to a substring, DROP IT.
2. Each item must be a single, actionable concept. Split mega-prompts.
3. Don't fabricate. If the user is vague, mark confidence < 0.7 and surface in
   `clarifications_needed`.
4. Don't merge unrelated items.
5. Tag each item with its `target_kind` + `target_id` (existing entity, or null if new).
6. Don't claim work you can't verify. If user says "tests are failing", that's
   an `observation`, not auto-classified as a bug unless they're requesting fix.
7. Reject items that violate locked must_haves or non_goals (surface in 
   `rail_violations` for user to override via ADR if intentional).
8. Items that look like duplicates of recent iterations → flag in
   `duplicate_warnings`.

USER MESSAGE:
{{raw_text}}

EXISTING PROJECT CONTEXT (DO NOT add items the user didn't mention):
  Features: {{context_packet.features}}
  Flows:    {{context_packet.flows}}
  Pages:    {{context_packet.pages}}
  Open bugs: {{context_packet.open_bugs}}

LOCKED RAILS (items violating these need explicit user override):
  must_haves: {{context_packet.must_haves}}
  non_goals:  {{context_packet.non_goals}}

RECENT ITERATIONS (for duplicate detection):
{{iteration_history}}

ITEM TYPES:
  bug                       - Something broken in existing functionality
  new_feature_request       - New functionality user wants added
  feature_modification      - Existing feature should change behavior
  flow_modification         - Existing user flow should change
  page_modification         - Existing page should change
  component_modification    - Existing UI component should change
  risk_addition             - New risk identified
  re_wire                   - Multiple cascading changes (multi-doc updates)
  revamp                    - Major scope change (re-runs parts of Stage 2)
  observation               - User noting something but not requesting action
  question                  - User asking for info, not action

OUTPUT JSON ONLY (no prose, no markdown):
{
  "items": [
    {
      "item_type": "<item_type>",
      "title": "<short statement, AI-generated, ≤80 chars>",
      "description": "<cleaned excerpt, 1-3 sentences>",
      "source_substring": "<verbatim from user text>",
      "target_kind": "feature"|"flow"|"page"|"component"|"integration"|"secret"|null,
      "target_id": "<existing ID>"|null,
      "proposed_change": {
        "kind": "<bug_fix|new_feature|modification|...>",
        "action_summary": "<1-line of what would be built/changed>",
        "ambiguity": "<note if scope unclear>"
      },
      "confidence": <0.0-1.0>,
      "notes": "<optional rationale or ambiguity flags>"
    }
  ],
  
  "rejected_excerpts": [
    { "excerpt": "<text from user>", 
      "reason": "<why no item created>" }
  ],
  
  "clarifications_needed": [
    { "item_index": <number>, 
      "question": "<specific clarifying question>" }
  ],
  
  "rail_violations": [
    { "item_index": <number>,
      "violated_rail": "<must_have or non_goal text>",
      "rail_type": "must_haves"|"non_goals",
      "needs_override_adr": true }
  ],
  
  "duplicate_warnings": [
    { "item_index": <number>,
      "duplicate_of": "<iteration_<N> item or open_bug ID>",
      "similarity_reason": "<why suspected duplicate>" }
  ]
}
```

---

## Posting to the API (live shape — verified 2026-07-16)

Claude emits the JSON above. The skill runs the validation pass below, then POSTs
`{ classified_by_session, items: [...] }` to `POST /api/reports/<id>/classify`. Each
item must match the live `ClassifiedItemSchema` (flat, not nested):
`{ item_type, title, description?, target_kind?, target_id?, proposed_change?, confidence? }`
— `target_kind` ∈ `feature|flow|page|component|integration|secret`. The endpoint
creates the iteration (`awaiting-lock`) and inserts each item at `pending-review`.
`source_substring` and `notes` are skill-side only (anti-hallucination validation +
audit); they are not columns on `iteration_items` and are stripped on POST.

## Validation pass (mechanical post-Claude)

```typescript
function validateItem(item: Item, rawText: string): boolean {
  // Anti-hallucination: source_substring must be in raw_text
  if (!item.source_substring) return false;
  if (!fuzzyMatch(item.source_substring, rawText, 0.9)) return false;
  return true;
}

// Confidence threshold check:
items.filter(i => i.confidence < 0.7 && !i.user_edited)
     .forEach(i => clarifications_needed.push(...));
```

Items failing source-substring validation → DROP + log to `iterations.dropped_hallucinations[]`.

Items with confidence < 0.7 AND not in `clarifications_needed` from Claude → mechanically add to clarifications.

---

## Confidence thresholds

- ≥ 0.9: high confidence, AI-generated title is reliable, ready for 4.3 lock-in
- 0.7 - 0.89: medium, present to user as draft, allow edits at 4.3
- < 0.7: low, MUST be flagged in `clarifications_needed` BEFORE 4.3 panel renders

---

## Rail violations handling

If `rail_violations[]` is non-empty:
- Skill surfaces at 4.3 panel: *"⚠ Item #3 ('Add user login form') conflicts with non_goal 'no login system'. Override?"*
- User options: 
  - **Override + create ADR** — ADR retires the non_goal; Doc 1.preferences.non_goals updated; iteration proceeds
  - **Edit item** — modify item to comply
  - **Reject item** — soft-reject with reason

No silent rail violation. The non_goal that user locked at 0.7 is sacred until explicitly retired.

---

## Duplicate handling

For items in `duplicate_warnings[]`:
- 4.3 panel shows: *"Item #2 looks similar to bug-42 (open since iter-3) — merge or keep distinct?"*
- User picks merge (close bug-42 with reference to this item) or keep distinct (proceed)

---

## Post-classify behavior

Skill takes Claude's output and:
1. Validates each item's source_substring (anti-hallucination)
2. Inserts items into `iteration_items` table
3. If any `clarifications_needed` → AskUserQuestion BEFORE 4.3 panel
4. If user resolves clarifications → re-fire classifier on affected items only (or merge user-typed text into items)
5. Once all items confidence ≥ 0.7 OR user_edited → 4.3 lock-in panel renders

---

## Failure modes

| Failure | Recovery |
|---|---|
| Empty items[] | "I couldn't extract any items. Could you rephrase what you'd like to change?" |
| All items low confidence | "Could you break this into smaller, specific requests? Each request becomes one item." |
| All items fail source-substring (hallucination signal) | Soft-halt; surface raw text; ask user to provide structured input directly |
| User insists "just analyze it as-is, don't bother me" | Refuse silently; proceed but flag iteration with `low_confidence_lock=true` for audit + Stage 4.7 verifier strictness up |
| Rail violations only (no clean items) | Surface as: "your message conflicts with locked rails. Override + ADR needed before iteration proceeds." |

---

## Token cost

- Prompt template: ~600 tokens
- raw_text: ~50-2000 tokens
- context_packet (lite): ~3-5K tokens
- Claude output: ~300-1500 tokens
- Total per analyze: **~4-9K tokens** (most variability from raw_text length)

Significantly less than full-SO1-context approach (~50K+ savings per iteration). One classifier call per `Analyze` action.

---

## Anti-gaslight bedrock — what this prompt enforces

1. **Source-substring rule** → no fabrication possible (mechanical drop)
2. **Confidence threshold** → no auto-lock on uncertain items (4.3 demands clarification)
3. **Rail violations explicit** → must_haves/non_goals can't be silently violated; user override + ADR required
4. **Duplicate detection** → same bug not booked twice
5. **Reject log** → even fragments that didn't make items are kept for transparency
6. **Implicit/inferred items** → flagged for explicit user confirm; never silently locked

These layers mean: from user's "the search is broken and we need a dashboard..." to the locked iteration items, every transformation is auditable + verifiable + reversible.
