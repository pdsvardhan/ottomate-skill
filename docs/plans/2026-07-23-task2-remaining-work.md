# Task 2 (UI Design Method) — remaining work + workflow redesign

**Status:** shipped but **ITERATE**, not APPROVE (independent verification 2026-07-23).
**Spec:** `docs/specs/TASK2-UI-DESIGN-SPEC.md` (LOCKED) · **Method:** `references/stage-2-design-method.md`
**Built in:** plugin `e68f0fc`/`b1f0568`/`4989c4a` · app `06b199c`

> **This doc is the handoff brief for the next Task-2 session.** Owner will bring ~20 long research
> documents on UI principles; §8 says how to ingest them without drowning the context.

## 1. What is real and live (do not rebuild)

- **One-command pipeline** `scripts/preview-build/`: fetch → extract → inject → emit, ~0.2s, with a
  placeholder guard that genuinely fires. Verified independently.
- **Theme-from-content**: `theme-extract.mjs` (ImageMagick histogram → dominant vibrant colour, skips
  near-black/near-grey, boosted for light+dark). An independent verifier re-ran it and got
  byte-identical colours to the stored ledger — the tokens are genuinely machine-derived.
- **Self-contained previews**: zero external requests, `data:` URIs, real content, light+dark,
  `prefers-reduced-motion`, colour-budget honoured in code.
- **Uncapped ledger**: `ui_master_plans.design_ledger` (migration 0009). 834-char rationale round-trips.
- Published to a **stable Claude Artifact URL**, re-published in place on round 2.

## 2. The central gap

**The pipeline emits ONE design, not 2–4 variants.** One template, one output, no variant harness, no
`axis` label per set. Core-loop rule 2 and decision D2 — *the whole point of Task 2* — are currently
prose a human hand-executes, i.e. exactly the friction §5D exists to remove. **Everything else in this
doc is secondary to fixing this.**

Also unbuilt/unwired: reload-on-resume, the Stage-3 handoff, context gate + anti-slop enforcement
(prose-only, nothing checks them), asset-fetcher is local-path only. No real design session has ever
been run — the live ledger is a seeded demonstration (foundation tokens all NULL, 2 of 4 worklist items).

---

## 3. Workflow model — the owner's ACTUAL use cases (new; this is the redesign)

The method currently assumes design happens at Stage 2, before build. **That is the owner's rarest
path.** Real usage, in frequency order:

| # | Use case | Frequency |
|---|---|---|
| 1 | Build everything with **placeholder UI**, backend first, test hard, then do UI later "when bored" | **most common** |
| 2 | "I don't like *this one component*" → variants for it → pick | common |
| 3 | Same for a **page**, or a few components within a page | common |
| 4 | Full **UI overhaul** | occasional |
| 5 | Don't care about UI at all — anything goes | occasional |
| 6 | Full pipeline from scratch at Stage 2 | **rare** |

### 3a. Two orthogonal dimensions: SCOPE × ENTRY POINT

**Scope** determines which ladder rungs run — the full A→A½→B→C should NOT fire for a single button.

| Scope | Target | Rungs that run |
|---|---|---|
| `component` | one component (`data-oid`) | **B** only (+ micro) |
| `cluster` | several components / a page region | **B → C-cluster** |
| `page` | one whole page | **C-page** (+ B for any unsettled part) |
| `site` | full overhaul / greenfield | **A → A½ → B → C** (full ladder) |

**Entry point** determines what context must be (re)established:

| Entry | When | Context handling |
|---|---|---|
| `stage-2` | designing before build (rare) | Full context gate; foundation set here |
| `stage-4-item` | a component/page bugs you | **Inherit** locked context + foundation from the ledger; do NOT re-interview |
| `deferred-overhaul` | built on placeholders, now doing UI | **Run the context gate now** (it was skipped), then scope = `page` or `site` |
| `ui-mode: none` | don't care | Record the decision explicitly (drop-with-reason), build neutral + `data-oid`, expect a later overhaul |

**Rule:** scope is asked **first**, and it selects the rungs. A `component` scope that tries to run
whole-vibe directions is a bug.

### 3b. Making deferral safe (the default path)

Deferring UI is legitimate and supported, but three things are expensive to retrofit. When
`ui-mode: none` / placeholder is chosen, capture this **one short round** up front:

1. **Context gate answers** (audience / use-cases / tone / primary screen) — 5 minutes; makes the later
   overhaul fast instead of exploratory.
2. **Is this project asset-rich?** If identity will come from real content (posters/artwork), wire
   theme-from-content early — retrofitting means touching every card.
3. **Build visibly neutral, replaceable UI + keep `data-oid` stamping on** → later rework is *swap*,
   not rewrite, and both the visual-QA commenter and the design targeting can address exact components.

Cheap to defer: per-component look, whole-page style, micro-polish.
Expensive to defer: **foundation tokens** (ramp/type-scale/radius), **the core mechanic**,
**theme-from-content wiring**. Defer those and the "rework" becomes a redesign.

---

## 4. Long-session degradation (owner-observed, real)

> *"In a single chat, when everything is fresh, more good designs come out… in a long session later the
> designs start getting very repeated."*

**Diagnosis:** accumulated context anchors the model on what it already produced; variants converge.
This is not fixable by prompting harder — it is architectural.

**Design: the ledger is the memory; the chat is disposable.**

1. **Each design round runs in a FRESH sub-agent**, given only: the ledger's `context` + `constraints` +
   locked decisions + the current `axis` + the **`rejected[]` list** — *not* the chat history.
2. **`rejected[]` / `exhausted[]` per target** in the ledger, so a fresh round knows what has already
   been tried and must differ from it.
3. **Round budget per axis** (e.g. 3): on exceeding it, force a context reset rather than grinding.
4. **Divergence check before presenting**: compare the N variants to each other *and* to previously
   shown ones on the stated axis; if too similar, regenerate instead of shipping a "samey" round
   (this is the Round-1 trap from the original retrospective, now mechanical).
5. Long chats stay fine for *conversation*; generation always happens in a fresh context.

---

## 5. Structured ledger — what's finalized vs under review

Current ledger is one JSON blob — not queryable per target/status. Needed:

**Per-target records with a state machine:**
```
proposed → in-review → locked
                ↘ rejected
   locked → superseded (when revisited later)
```

Each record: `target_id` · `scope` · `status` · `axis` · `round` · `variants_shown[]` ·
`chosen` · `mixed_from[]` · `rejected[]` · `rationale` (uncapped) · `constraints_applied[]` ·
`preview_url` · `ts`.

Must answer instantly: *what's open? what's locked? what did we already reject for this component?*

**`target_id` = the `data-oid` value.** This is the unification worth calling out:
**one instrument, three consumers** — Task 1 maps a comment → component, Task 3 uses it as a stable
test selector, Task 2 uses it as the design target. Same id everywhere.

**Likely app change:** promote the ledger from a JSON blob to a queryable `design_decisions` table
(project_slug, target_id, scope, status, …) with the blob kept for context/worklist. Decide in the
next session; migration would be `0010`.

---

## 6. Component graduation + tagging (feeding the central library)

Locked bespoke variants should be able to graduate into `master_components` via `seed-component`
(already offered post-round). To make retrieval actually work, the catalog needs a **granularity**
axis alongside its 13 categories — "component" currently means anything from a button to a whole section:

| Granularity | Example |
|---|---|
| `primitive` | button, input, badge |
| `element` | card, stat tile, avatar |
| `composite` | search bar + filters + sort = one "filter bar" |
| `section` | hero, results grid, footer |
| `shell` | page frame / nav skeleton |

Tag on: granularity · category · design-direction it belongs to · **animation vocabulary** · source
(`mc-id` or `bespoke`) · project of origin. That makes "give me composite filter bars with subtle
motion in this direction" a real query instead of a vibe.

---

## 7. Instruction adherence — the trust problem  ⚠ HIGH PRIORITY

> *"Even though I specifically tell it to use this set of animations I like, or source from the central
> Ottomate library, it doesn't. It just randomly creates stupid things."*

This is the most damaging failure: it makes stated preferences feel ignored. Prose instructions decay
in long contexts and nothing checks them. **Fix = treat design constraints exactly like the
anti-gaslight verifier treats code claims — as a checkable contract, not a request.**

1. **Capture constraints as structured records**, not chat prose, in the ledger:
   ```
   constraints: {
     must_use:        ["mc-shine-border", "mc-border-beam"],
     animation_vocab: ["fade-up", "border-draw"],   // ONLY these
     forbidden:       ["glassmorphism", "parallax", "bounce"],
     source_policy:   "library-first" | "library-only" | "bespoke-ok",
     colour_budget:   { accent_surfaces: [...] }
   }
   ```
2. **Constraints are injected into EVERY round's fresh sub-agent** — they live in the ledger, so they
   cannot fade with context (this also fixes §4's drift).
3. **Mechanical pre-present check — the key move.** Before showing anything, verify each variant:
   - `must_use` → grep the variant source for the mc-id
   - `animation_vocab` → parse CSS/JS animation + transition names; anything outside the vocab fails
   - `forbidden` → detect `backdrop-filter`, parallax handlers, bounce easings
   - colour-budget → count surfaces carrying the derived accent
   A failing variant is **regenerated, never presented**. This is the same "fail closed" principle as
   Task 3.
4. **Show a per-variant "constraints honoured" line** when presenting, so a violation is visible
   instead of silent.
5. **Constraints travel to Stage 3** in the design spec, so the build can't quietly drop them — and
   Task 3's feature verifier can assert them later.

---

## 8. Ingesting the owner's ~20 UI research documents

Do **not** load 20 long documents into the design context — that recreates the §4 degradation problem.

1. **Distil into a house doctrine**: `references/design-doctrine.md` — the durable principles, deduped
   and resolved where sources conflict (owner arbitrates conflicts).
2. **Split into two artifacts:**
   - **Checkable rules** → feed §7's mechanical checker (contrast, spacing scale, motion limits,
     colour budget, type scale adherence). These are enforced, not advisory.
   - **A judging rubric** → `data/design-rubric.md`, used to score variants before presenting.
3. **Keep the raw research** in `docs/research/` for provenance, loaded **only on demand**, never by default.
4. Each doctrine rule cites its source document, so a disputed rule is traceable.

---

## 9. Build order

| # | Item | Why this order |
|---|---|---|
| 1 | **Variant harness** (N labelled variants, one config, `axis` per set, divergence check) | The central gap; everything else is decoration without it |
| 2 | **Constraints contract + mechanical pre-present checker** (§7) | Highest trust payoff; also stabilises §4 |
| 3 | **Fresh-context round architecture + `rejected[]`** (§4) | Fixes long-session decay |
| 4 | **Structured ledger / `design_decisions`** (§5) | Makes scope + status tracking real |
| 5 | **Scope × entry-point routing** (§3) | Encodes the real workflow; cheap once 1–4 exist |
| 6 | Wire reload-on-resume + Stage-3 handoff; register context gate + anti-slop in a rule registry | Closes verified gaps |
| 7 | Granularity tags + graduation to `master_components` (§6) | Compounding value over time |
| 8 | Doctrine + rubric from the 20 docs (§8) | Best done once 2 exists to consume it |

## 10. Acceptance for APPROVE

1. A round emits **2–4 genuinely different, labelled variants** on one stated axis, from one command.
2. A stated constraint (animation vocab / must-use mc-id) is **mechanically enforced** — a violating
   variant is regenerated, not shown.
3. One **real design session** run end to end at `component` scope and at `page` scope, with the ledger
   showing locked vs in-review per target.
4. A fresh-context round demonstrably avoids repeating a `rejected[]` variant.
5. Reload-on-resume works without being told; Stage 3 reads the design spec.
