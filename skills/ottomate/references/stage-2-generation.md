# Stage 2 — Variant generation (the producer)

**Loaded when a design round needs variants made.** The harness *displays* variants; this is the method
that *produces* them. Run it in a **fresh sub-agent** fed only the inputs below — not inline in a long
session (a long session produces repetitive designs; the ledger is the memory, the chat is disposable).

> **Honesty flags baked in.** The 6→3 filter is **model-applied rubric judgment**, not a mechanical
> score — no scoring runner exists yet. The "get 6 genuinely-different variants" step is a `[REASONED]`
> technique, with the **isolation gate as the backstop** that rejects a samey set. Say which is which.

---

## Inputs (the fresh agent gets ONLY these)

1. **Target + anatomy** — the `data-oid`, and the archetype's entry in `data/component-anatomy.json`
   (tier, parts, required states, the sub-decision list). This is *what to vary* — never invent axes.
2. **The constraint contract** — `must_use` · `animation_vocab` · `forbidden` · `source_policy` ·
   `colour_budget`. These BLOCK (doctrine §5). `source_policy` defaults **library-first**.
3. **The audience profile** — P1/P2/P3. Selects which floor rules bind (`data/design-rules.json`
   `audience_profiles`).
4. **The committed direction** — one entry from `data/design-directions.json` (see step 1).
5. **`design-doctrine.md`** — the 229 cited rules. Load it.
6. **`rejected[]` and frozen controls** — from the ledger via
   `scripts/generation/ledger-context.mjs` (Phase 2): `rejectedByAxis(decisions)` = every value already
   turned down for this target (empty on gen-1) — **never re-offer a rejected value**; and
   `frozenByAxis(decisions)` = every **locked** sub-decision — a locked axis is a **frozen control**
   (doctrine 39), **excluded from the round's contested axes**, never re-offered as a variant.

## The steps

### 0. Commit to a named direction (rung 0)
If no direction is set, pick one from `design-directions.json` using the brief's adjectives
(`adjective_map`). No adjectives → Swiss-adjacent minimalism (doctrine 52 — boldness is opt-in, never a
silent default). Record it; it frames every bundle. Flag a `trend_bound` direction as a bet (doctrine 50).

### 1. Enumerate the sub-decisions
Take the archetype's `sub_decisions` from the anatomy. These are the round's axes — the parts and
states, nothing invented (doctrine 40). A round is normally a **bundle** of ~8–12 of them across 2–4
variants; the pick is per-item (doctrine 38).

### 2. Over-generate 6, SEEDED FOR DIVERGENCE  `[REASONED]`
Author **6** complete bundles. To get genuinely different ones from one model — the open LLM-behaviour
gap the register flags — give each candidate a **distinct seed**:
- assign 2–3 candidates a **different named direction** (or a different material reference), and
- on the 3–4 most contested sub-decisions, force **different values per candidate**, and
- state explicitly, per candidate, *"these must differ from the others on: <the named axes>."*

Spend the budget here (doctrine 41): the committed direction, content-derived colour, a named material
reference — gen-1, not rounds 2–3 grinding toward them. **The isolation gate is the backstop:** if the
6 still came out samey, it rejects the set and you regenerate. Do not rely on the seed alone.

### 3. Filter 6 → 3 by rubric judgment  *(model-applied — no runner yet)*
Score each of the 6 against `data/design-rubric.md` (Hierarchy/Consistency/Legibility/Craft, 4×25),
including the **vision-proxy 5-second test** (name the primary action cold). Keep the **3 strongest**.
Record the scores and *why* each survivor beat the two it displaced — this is a judgment, logged, not a
computed number. A *Rebuild*-band survivor triggers one regeneration before it ships.

### 4. Emit a harness config (markup mode, states pinned)
Write a `variant-set.json` for `build-variant-set.mjs`. Declare `axis.params` + per-variant `axis_values`
for **every** named sub-decision (so the gate's per-sub-decision isolation applies).

**Set `axis.kind` to match the bundle's dominant nature — this matters:**
- `"structural"` **only** when the contested axes genuinely move the DOM tree (layout: grid vs list;
  nav: tabs vs sidebar). The gate then requires ≥15% *markup* divergence.
- `"stylistic"` for a bundle whose differences are mostly CSS **values** (radius, elevation, colour,
  motion, accent placement). **The structural markup fingerprint is BLIND to CSS-value differences** —
  it counts tag/class/property *names*, not values — so declaring a stylistic bundle `"structural"`
  makes the gate FALSE-REJECT three genuinely different cards as "98% identical." *(This is exactly
  what happened on the first real round, 2026-07-23.)* For a stylistic bundle, **axis-diff on the
  declared params is the divergence proof**; a rendered-appearance check (computed, browser) is the
  proper backstop and is a noted follow-up.
- A **mixed** bundle (some structural, some stylistic sub-decisions) is `"stylistic"` unless the
  *majority* genuinely restructure the DOM.
- Each variant is a `panelTemplate` (its own markup + `<style>`), authored so the tier's
  **render_surface** shows the **required states pinned open** (element 2) — e.g. a card rendered in its
  hover-revealed state, a button strip across rest/hover/focus-visible/active/disabled. Judge the axis
  where it lives.
- Namespacing is *nice* but no longer required — panels are shadow-isolated (`block-svg-id-collision`
  is advisory now).

### 5. Run the harness — gate + checker, fail closed
`node build-variant-set.mjs variant-set.json`. It runs the isolation gate **and** the constraint
checker before emitting. On a BLOCK (exit 2, nothing written): a feasibility/owner violation or a samey
set → **fix and regenerate**, never present. Advisories annotate the panels; a *Rebuild* band triggers
one auto-regeneration.

### 6. Present + record per-item picks
Publish the artifact (stable URL). The owner picks a **value per sub-decision** — a mix is normal. Feed
the pick vector through `scripts/generation/picks-to-ledger.mjs` → one `design_decisions` row per
sub-decision (`chosen_value`, `mixed_from`, `rejected[]`, `profile_at_decision`). The rejected values
become the next round's `rejected[]` input (step 6 above).

### 7. Lock + guard against regression (Phase 2)
When the owner confirms a pick, **lock** it: `ledger-context.lockDecision(...)` PATCHes
`status:'locked', confirmed:true, snapshot: snapshotForLock(decision, source)` — a lock is *earned*
(422 without `confirmed`, G3 rule 12). On any later rebuild, run
`diffAgainstSnapshots(lockedDecisions, currentByAxis, currentSourceByAxis)` and **block on a regression**
(a locked value or its source region silently changed) until the owner unlocks with a reason (422
without `unlock_reason`, G3 rule 13). This is the golden-file regression gate — the ledger protecting
committed work. *Source/value-level; a rendered-pixel diff is the computed follow-up.*

## What this method deliberately does NOT do yet
- **No mechanical rubric runner** — step 3 is model judgment. (Follow-up: score `computed` rules in the
  Playwright harness.)
- **No mechanical "state is visibly rendered" gate** — step 4 pins states by convention + checklist; a
  gate that proves the axis is visible in a shown state is a noted follow-up.
- **No proven generation-variance guarantee** — step 2 is `[REASONED]`; the gate is the safety net.
