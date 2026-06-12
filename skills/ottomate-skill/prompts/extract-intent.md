# Stage 0.4 Hybrid Intent Extractor Prompt

The Claude refinement pass that runs after the mechanical pre-pass. Extracts structured hints from user's free-form intent dump with **source-substring rule** as anti-hallucination guard.

**Used at:** Stage 0.4 Phase 2.
**Token budget:** ~800-1500 (input + output).
**Output format:** strict JSON; mechanical post-validation drops fabricated entries.

---

## Inputs (substituted at dispatch time)

```yaml
{{core_idea_raw}}                        # the verbatim user dump
{{candidate_hints}}                      # mechanical pre-pass output (high recall, may have noise)
{{candidate_hints.feature_hints_raw}}    # candidate feature keywords
{{candidate_hints.non_goals_candidates}} # negation pattern matches
{{candidate_hints.inspirations_candidates}}  # "like X" / "not like X" patterns
{{candidate_hints.domain_hints}}         # domain words (proper nouns, capitalized)
```

---

## The prompt

```
You are an extractor. Read the user's project description below and produce
STRUCTURED hints — only what the user EXPLICITLY mentioned or clearly implied.

CRITICAL RULES:
1. Do NOT add features you would recommend. Only what the user said.
2. Do NOT infer needs the user did not state.
3. Every extracted entry MUST have either:
   (a) a `source_substring` quoted verbatim from the user text (case-insensitive 
       substring or fuzzy match >= 90%), OR
   (b) for clearly implied items: a `why_inferred` reasoning string explaining 
       the derivation (e.g., "user said 'just data and charts' implies no user 
       authoring → non_goal: no user-generated content")
4. If you cannot tie an entry to source text or explicit reasoning, DROP IT.
5. For items that look like negations ("no login", "without auth", "don't want X"),
   put them in `negated_features`, NOT in `feature_hints`.
6. For comparisons ("like Twitter", "not like cricinfo"), mark `emulate_or_avoid`
   based on context (positive comparison = emulate; negative = avoid).
7. For `implicit_features_inferred`, ALWAYS mark for user confirmation at 0.10
   sketches review. Never silently lock.

USER TEXT:
{{core_idea_raw}}

CANDIDATE HINTS FROM PRE-PASS (verify, prune noise, add what's missing):
  feature_hints_raw:        {{candidate_hints.feature_hints_raw}}
  non_goals_candidates:     {{candidate_hints.non_goals_candidates}}
  inspirations_candidates:  {{candidate_hints.inspirations_candidates}}
  domain_hints:             {{candidate_hints.domain_hints}}

OUTPUT JSON ONLY (no prose, no markdown fence):
{
  "feature_hints": [
    { "value": "<short noun phrase>", 
      "source_substring": "<verbatim from user text>", 
      "confidence": <0.0-1.0> }
  ],
  "negated_features": [
    { "value": "<short noun phrase>",
      "source_substring": "<verbatim>",
      "confidence": <0.0-1.0> }
  ],
  "target_users_candidates": [
    { "value": "<user type>", 
      "source_substring": "<verbatim>",
      "confidence": <0.0-1.0> }
  ],
  "inspirations_candidates": [
    { "value": "<site/product name>",
      "emulate_or_avoid": "emulate"|"avoid",
      "source_substring": "<verbatim>" }
  ],
  "integrations_candidates": [
    { "value": "<service name>",
      "source_substring": "<verbatim>",
      "confidence": <0.0-1.0> }
  ],
  "domain_hints": [
    { "value": "<domain word>", 
      "source_substring": "<verbatim>" }
  ],
  "ui_hints_candidates": {
    "dark_mode_pref": <bool|null>,
    "palette_hint": "<color/aesthetic>"|null,
    "animation_level": "none"|"subtle"|"smooth"|"playful"|null,
    "layout_style": "<dashboard|card|list|...>"|null,
    "_provenance": "<source_substring or null>"
  },
  "tech_hints_candidates": {
    "framework_hint": "<framework name>"|null,
    "db_hint": "<db name>"|null,
    "deploy_hint": "<deploy target>"|null,
    "_provenance": "<source_substring or null>"
  },
  "auth_intent_candidate": {
    "value": "none"|"password"|"magic-link"|"oauth"|"sso"|"custom"|null,
    "_provenance": "<source_substring or null>"
  },
  "likes_candidates": [
    { "value": "<like phrase>",
      "source_substring": "<verbatim>" }
  ],
  "dislikes_candidates": [
    { "value": "<dislike phrase>",
      "source_substring": "<verbatim>" }
  ],
  "must_haves_candidates": [
    { "value": "<must-have phrase>",
      "source_substring": "<verbatim>" }
  ],
  "implicit_features_inferred": [
    { "value": "<feature name>",
      "why_inferred": "<reasoning trace>",
      "source_substring": "<verbatim phrase that triggered inference>",
      "confidence": <0.0-0.7> }
  ]
}
```

---

## Validation rules (mechanical post-Claude)

For every entry in every category:

```typescript
function validateHint(hint: Hint, rawText: string): boolean {
  // Rule A: source_substring must be present in rawText (or fuzzy match)
  if (hint.source_substring) {
    if (rawText.toLowerCase().includes(hint.source_substring.toLowerCase())) {
      return true;
    }
    if (fuzzyMatch(hint.source_substring, rawText) >= 0.9) {
      return true;
    }
    return false; // FABRICATION — drop
  }
  
  // Rule B: implicit items need why_inferred
  if (hint.why_inferred) {
    return hint.why_inferred.length >= 20; // non-empty reasoning required
  }
  
  return false; // neither substring nor reasoning — drop
}
```

For confidence < 0.7 OR implicit items: mark `REQUIRES_USER_CONFIRMATION_AT_0.10` flag.

---

## Example (cricket-stats input)

User typed:
> "I want to build a cricket stats app where I can compare two players head-to-head. Like, pick two batsmen and see who's better in T20s vs ODIs. For me and my friends who follow IPL. Should feel snappy, not like cricinfo which is bloated. No login or accounts. Just data and charts."

Expected Claude output:

```json
{
  "feature_hints": [
    { "value": "compare players head-to-head", 
      "source_substring": "compare two players head-to-head", 
      "confidence": 0.95 },
    { "value": "stats display", 
      "source_substring": "see who's better in T20s vs ODIs", 
      "confidence": 0.92 },
    { "value": "data ingestion", 
      "source_substring": "Just data and charts", 
      "confidence": 0.78 }
  ],
  "negated_features": [
    { "value": "login system", 
      "source_substring": "No login or accounts", 
      "confidence": 0.98 },
    { "value": "user accounts", 
      "source_substring": "No login or accounts", 
      "confidence": 0.98 }
  ],
  "target_users_candidates": [
    { "value": "me and my friends who follow IPL", 
      "source_substring": "For me and my friends who follow IPL", 
      "confidence": 0.95 }
  ],
  "inspirations_candidates": [
    { "value": "cricinfo",
      "emulate_or_avoid": "avoid",
      "source_substring": "not like cricinfo which is bloated" }
  ],
  "integrations_candidates": [],
  "domain_hints": [
    { "value": "cricket", "source_substring": "cricket stats app" },
    { "value": "IPL", "source_substring": "IPL" },
    { "value": "T20", "source_substring": "T20s" },
    { "value": "ODI", "source_substring": "ODIs" },
    { "value": "batsmen", "source_substring": "batsmen" }
  ],
  "ui_hints_candidates": {
    "dark_mode_pref": null,
    "palette_hint": null,
    "animation_level": "subtle",
    "layout_style": "data-dense",
    "_provenance": "Should feel snappy, not like cricinfo which is bloated"
  },
  "tech_hints_candidates": {
    "framework_hint": null,
    "db_hint": null,
    "deploy_hint": null,
    "_provenance": null
  },
  "auth_intent_candidate": {
    "value": "none",
    "_provenance": "No login or accounts"
  },
  "likes_candidates": [
    { "value": "snappy", "source_substring": "Should feel snappy" }
  ],
  "dislikes_candidates": [
    { "value": "bloated", "source_substring": "bloated" }
  ],
  "must_haves_candidates": [
    { "value": "single-user", 
      "source_substring": "For me and my friends" }
  ],
  "implicit_features_inferred": [
    { "value": "data refresh strategy",
      "why_inferred": "user mentioned 'data and charts' + 'IPL' (live tournament) suggests need for data refresh; not explicitly requested but typical for sports stats apps",
      "source_substring": "Just data and charts",
      "confidence": 0.55 }
  ]
}
```

The `data refresh strategy` is implicit — gets `REQUIRES_USER_CONFIRMATION_AT_0.10` flag. User explicitly confirms before it appears in features_sketch.

---

## Failure modes

| Failure | Recovery |
|---|---|
| Claude returns malformed JSON | Skill re-prompts with stricter format hint; max 2 retries |
| Claude returns empty hints lists | Soft-confirm with user: "Couldn't extract hints — could you say a bit more or rephrase?" |
| All hints fail source-substring validation | Critical anti-hallucination signal; soft-halt + surface raw text + ask user to provide structured input directly |
| Claude includes hints with unverifiable source_substring | Mechanical drop; log to `intent_drafts.dropped_hallucinations[]` for audit |

---

## Token cost

- Prompt template: ~500 tokens (the rules + schema)
- Substituted inputs: ~500-2000 tokens (depends on user dump length + candidate hints size)
- Claude output: ~300-1500 tokens (depends on richness of extraction)
- Total per session: **~1.5-4K tokens**

One Claude call per session at Stage 0.4. Cached if user re-runs same `core_idea_raw`.

---

## Anti-gaslight angle

This prompt is the bedrock of "tight, trackable, verifiable knitting" the user emphasized:

1. **Source-substring on every entry** → audit chain back to user's exact words
2. **Drop fabrications** → mechanical post-Claude filter rejects unverifiable hints
3. **Implicit items flagged** → user must confirm at 0.10; never silently locked
4. **Strict JSON output** → no narrative drift; structured schema enforced

When ND1 is finalized at 0.11, every field has provenance. When SO1 docs are derived at 1.1, provenance carries forward. When Stage 4 iterates, every change traces back to user's original input.

The chain is unbroken from user's first sentence to deployed code.
