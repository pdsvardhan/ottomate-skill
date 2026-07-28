# Stage 2 — Variant generation (the producer)

**Loaded when a design round needs variants made.** The harness *displays* variants; this is the method
that *produces* them.

**Route first (`references/stage-2-routing.md`).** Ask **scope** (component/cluster/page/site) and
**entry** (stage-2 / stage-4-item / deferred-overhaul / `ui-mode:none`). Scope selects the rungs via
`routeRungs` — a `component` scope never runs whole-vibe directions. **`ui-mode:none` is the default and
runs NO round** (build neutral placeholder UI + `data-oid`, design later).

**Decompose-and-ask FIRST — never assume scope (WS1.3, fixes F-15).** On a redesign request, before any
round: (1) read the target's real source and `decompose({src})` (`scripts/generation/decompose.mjs`) — the
parts come from the `data-role`/`data-oid` STAMPS, not name-guessing (F-4); (2) fire `scopeQuestion(decomp)`
as an **`AskUserQuestion`** — the owner explicitly picks WHAT to change and HOW DEEP (whole component / one
part / one property — F-9 supports granular *and* bold); (3) `requireExplicitScope(choice)` **BLOCKS** if no
scope was chosen (a round may never run on an assumed scope). Then `axesForScope(decomp, choice)` yields the
contested axes → `composeRounds` → the round. **Every round leads with the legibility banner (WS1.2, F-17):**
`bannerFromComposition({composition, currentRound, frozen, variantCount})` (`round-banner.mjs`) states LOUDLY
what this round decides, what is held, and what is deferred — a deferral sets `assentRequired` and must get a
yes (no silent round-2). `assertAccounted` guarantees no contested axis is varied/dropped silently.

**Every round runs in a FRESH `Agent` sub-agent** — not inline in a long session (a long session
produces repetitive designs; the ledger is the memory, the chat is disposable). Assemble its
self-contained input packet with `buildRoundInput(...)` (`scripts/generation/method-routing.mjs`): it
reads the ledger and hands the agent the contested axes **with locked/frozen axes already removed** and
the `rejectedByAxis` map, so the fresh context cannot re-offer a locked or rejected value. Spawn recipe:
one `Agent` call, `subagent_type: general-purpose`, prompt = this method + the packet; it writes the
panel files + config and returns its 6→3 rationale; the main session runs the harness.

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
7. **Prior art — what this project already decided ELSEWHERE** (`scripts/generation/prior-art.mjs`).
   Pass `projectDecisions` (the whole project's rows, no `target_id` filter) + `targetId` to
   `buildRoundInput` and it also answers *"is this already solved in another part of the project?"*:
   - **reuse** — same archetype, different target, **locked** → `verdict:'inherit'`. The axis leaves
     the contested set and becomes an inherited control. Two instances of the same component answering
     the same question differently is drift, not design. Pass `diverge:['axis-id']` to re-open it on
     purpose (ruling 3 — a preset, never a straitjacket).
   - **coherence** — *different* archetype, same question (`button.corner-radius` vs
     `media-card.corner-radius`) → **advisory only, never inherited.** The radius ladder and concentric
     nesting mean a nested element's radius *should* differ from its container's (doctrine 116).
   - **conflict** — two different locked values for the same question on the same archetype → reported,
     **never silently resolved.** The round is where the project settles a disagreement it already has.
   A `proposed` decision elsewhere is context, never an inheritance: a proposal is not an answer.
8. **The owner's taste (Pillar A, WS0.3)** — pass `taste` (from `loadTaste()`,
   `scripts/generation/taste-packet.mjs`, which reads `references/taste-profile.md`) and
   `buildRoundInput` injects a compact `taste` block into the packet: the one-line DNA, `motionBudget`
   (**expressive** for this owner — real animation on load/hover, not productive-only), the loved
   directives (3D/tilt, glow/spotlight, animated numbers, gradient text, bento, springy inputs), the
   avoid-list, and `antiSlopAdvisory:true`. **Ground generation in this** (v0's "grounded skill" model):
   reach for the loved effects as WANTED, not penalised. **The anti-slop TIER FLIP:** for this owner the
   aesthetic slop tells (glow / gradient-text / glassmorphism / parallax / bounce) are **advisory, never
   blocking** (`antiSlopTierFor(tell, baseTier, taste)` returns `'advisory'`) — F-16's concrete fix.
   **Floors are NOT flipped:** the per-theme contrast gate, `prefers-reduced-motion` and feasibility stay
   blocking. Taste raises the aesthetic ceiling; it never lowers the legibility floor. A tell the owner
   did **not** mark wanted (e.g. neumorphism) keeps its base tier.

## The steps

### 0. Commit to a named direction (rung 0)
If no direction is set, pick one from `design-directions.json` using the brief's adjectives
(`adjective_map`). No adjectives → Swiss-adjacent minimalism (doctrine 52 — boldness is opt-in, never a
silent default). Record it; it frames every bundle. Flag a `trend_bound` direction as a bet (doctrine 50).

### 1. Enumerate the sub-decisions
Take the archetype's `sub_decisions` from the anatomy. These are the round's axes — the parts and
states, nothing invented (doctrine 40). The pick is per-item (doctrine 38).

### 1½. COMPOSE the round — how many axes, and which travel together
⛔ *Was: "a bundle of ~8–12 across 2–4 variants" — prose, no rule, no citation.* **Replaced
2026-07-27** by `scripts/generation/round-composition.mjs` (`composeRounds`), returned as
`composition` from `buildRoundInput`. Three rules, and the reasoning is in the module header:

- **Bound the MATRIX, not the option count.** Choice overload is not the constraint (Scheibehenne
  et al. 2010, d≈0.02) and Hick's law is logarithmic — *options* are cheap. What breaks is the
  alternatives × attributes matrix: past roughly **5 attributes** people switch from compensatory
  comparison to non-compensatory heuristics (Payne/Bettman/Johnson 1993; conjoint practice puts the
  band at 4–6). Our per-item-pick model **is** a compensatory task, so **≤5 contested axes per round**.
  Above it, expect "I like panel B" plus tweaks — which the module reports as
  `regime: 'expect-panel-level'` rather than pretending otherwise.
- **Group by perceptual channel; never split one.** `weight` (radius/elevation/borders/padding) ·
  `density` · `type` · `colour` · `motion`. Radius reads differently flat vs raised, so those fuse and
  must be judged together; accent placement is largely independent and belongs in its own round.
  Order is **structure before dress**: weight → density → type → colour → motion.
- **Promote foundational axes out of a component round.** An axis is `local` if two components may
  legitimately differ (meta-density, badge-style) and `foundational` if a sibling difference reads as
  inconsistency (radius ladder, elevation ladder, accent policy, motion vocabulary). Deciding a
  foundational axis inside one component round and again inside another **is how the conflict that
  `prior-art.mjs` reports gets created.** Promote, don't repair.

Every sub-decision in `component-anatomy.json` now carries `channel` + `scope_hint` (22/22).
Print `formatComposition(...)` before generating — the composition should be a visible decision.

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

**Pressure-test before presenting (C6, AC7).** Before a set is shown to the owner, call
`pressureTest({ checks })` from `pre-round-gates.mjs` over the contrast / reduced-motion / colour-budget
results. It refuses to present unless every check **ran** — an `unavailable` check (e.g. no Chromium)
is reported as unavailable, **never rounded up to a pass**. You cannot present what you did not check.

### 6. Publish INTO THE APP + record per-item picks
⛔ *Was: publish a Claude Artifact.* **Retired 2026-07-27** (owner decision) — the design surface is
`/projects/<slug>/design/<target>`.

Write a round manifest (`project_slug`, `target_id`, `archetype`, `round`, `profile`, `constraints`,
`html`, and `variants_shown` keyed by the harness's **slot letters** so the pick UI matches the panel
headers) and run:

> **T5 — `variant_labels` is REQUIRED (2026-07-27).** Slot letters are re-shuffled every round
> (G3 §3.6), so `A` in round 1 is a different bundle from `A` in round 2, and a row storing a bare
> letter cannot be traced back afterwards. Pass **`variant_labels: { A: "<label>", … }`** — or simply
> copy the **`slot_mapping`** the harness already writes into `variant-set.manifest.json`, which
> `publish-round.mjs` accepts under either key. A slot with no label is **rejected**, not written as
> `label: null`: there is no later opportunity to add it. Readers still tolerate the pre-T5 bare shape
> forever — rows 18–27 predate this and are deliberately **not** rewritten.

```
node scripts/generation/publish-round.mjs --manifest round.json \
     --previews-dir /mnt/storage/ottomate/assets/previews \
     --api http://127.0.0.1:8110 --token-file /opt/homeserver/ottomate/.token
```

It copies the page onto the previews volume, **POSTs `/api/backup` before the first write**, refuses to
double-publish a `(target, round)` without `--replace`, and creates one **`proposed`** row per
sub-decision carrying `variants_shown` + `preview_url`. Runs **on VAULT7A** (the API is localhost-bound
and the previews volume is a host path).

The owner then picks a **value per sub-decision** on that page — a mix is normal — and the page PATCHes
`chosen_value` / `mixed_from` / `rejected[]` / `status:'in-review'` onto those same rows. The rejected
values become the next round's `rejected[]` input (input #6 above). `picks-to-ledger.mjs` remains the
**pure** bundle→payload mapper and the shape both paths agree on.

### 6½. Post-render computed pass (Phase 3b)
After the harness emits and the page renders, run the **computed checker** on the rendered output —
the checks the source checker cannot do because they need resolved styles. Host: real Chromium (the
server has `@playwright` + chromium; run `scripts/design-check/run-computed.mjs <out.html>
<computed-checks.js>`, or inject `computed-checks.js` via the browser you already drive). It returns:
- **`floor-contrast`** — resolved text vs effective background; block P2/P3, advise P1 (text over an
  image/gradient is reported *review*, never silently passed).
- **`adv-cross-component-coherence`** — the mix-coherence check: same `data-role` → same resolved value
  across components. **Stamp `data-role` on role-bearing parts** so this can run on a mixed pick.
- **`computed-axis-divergence`** — the stylistic-bundle backstop: the panels' resolved-style signatures
  must actually differ. This is what the source structural check cannot see (it's blind to CSS values),
  so declare a stylistic bundle `kind:"stylistic"` at the gate and let THIS confirm real divergence.
- **Light AND dark both render (C8, AC4).** Collect the computed records **once per
  `prefers-color-scheme`** and call `assertBothSchemes({light, dark})` from `design-check/scheme-check.mjs`.
  A design that clears contrast in light but fails in dark is half-broken; **both schemes must be
  measured** (a scheme not measured is not a scheme that passed) and the failing scheme is named.

**Ask on primary (C6, AC7).** Before recording a **foundational** sub-decision — or one
`round-composition.mjs` flagged for **promotion** — call `primaryDecisionGate({ decision, ownerChoice,
promoted })`. A primary axis may not be recorded without an explicit owner choice: it is lock-earned one
rung earlier, because a foundational default silently becomes a frozen control everything inherits. A
non-primary axis is unaffected — a round must not become a dialog.

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
