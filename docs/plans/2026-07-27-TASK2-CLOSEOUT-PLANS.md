# Task 2 closeout — unit plans for the 12 remaining code items

**Written 2026-07-27.** These are what stands between the current build and §12's ten acceptance
criteria. Each unit carries build steps and an acceptance bar with **both** a must-fail and a
must-pass case, per the standing rule.

**Plan-readiness check, run before writing this:** none of the twelve had a unit plan. `rung A`
returned zero hits across `docs/plans/`; A7, the asset-fetcher and the source scan appeared only as
*mentions* in a backlog or a prompt. That is why this document exists rather than a build.

**Live state these plans assume** (measured today, and different from the handoff):
`screenroom` has **19 design decisions — 9 locked, 10 superseded, 15 confirmed**. All nine locked
decisions sit on `music-list`, `album-detail` and `library-lists`. The anatomy knows three archetypes:
`media-card`, `button`, `data-table-row`. **None of the three live targets is one of them.**

---

## C1 — A7: an unregistered target must work end to end, or fail loudly · **CRITICAL PATH**

**Why it is first.** It stopped being a tail item today. Nine locked owner decisions cannot become
code because their targets have no anatomy entry, and the emitter's response was to **skip silently**
with `SKIPPED library-list.surface-strategy — question not in the registry`. A silent skip of a locked
decision is the worst available failure: the owner believes the decision landed.

`anatomy-derive.mjs` exists (13/13) and has **never been exercised on an unseen component in a live
round**. This unit connects it.

**Build**
1. **Fail loudly first, before anything else.** In `emit-design-artifacts.mjs`, an axis whose question
   is not in the registry currently logs and continues. Change to: collect every unresolved axis and
   **exit non-zero** with all of them named. Do this as its own commit — it converts a silent data
   loss into a visible one, and it is worth having even if the rest slips.
2. Wire `anatomy-derive.mjs` into the resolution path: registry hit → use it; miss → **derive** from
   the target's source; derive fails → **stop and ask**, never invent (doctrine rule 40).
3. A derived entry is **cached, labelled `derived: true`, and carries the evidence it was derived
   from** — so a later reader can tell a derived inventory from a hand-written one.
4. Token naming for a derived axis must be deterministic and namespaced by target, exactly as the
   hand-written path is (`--library-list-surface-strategy`), so two components cannot collide.
5. Run it on the three real targets and show the diff.

**Acceptance**
- **Must-fail:** an axis that cannot be resolved *or* derived makes the emit **exit non-zero** naming
  the axis; a test asserts **no file was written** — not merely that a warning appeared.
- **Must-pass:** `library-list.surface-strategy` — the exact row that was silently dropped — resolves
  through derivation and emits a namespaced token.
- **Must-fail:** derivation that would invent a part not present in the source is refused (this is
  already `anatomy-derive`'s tested behaviour; assert it survives the wiring).
- **Must-pass:** re-running the emit is a no-op, not an empty commit.

**Risk:** deriving badly is worse than not deriving. The refusal path is the load-bearing half.

---

## C2 — The asset-fetcher (§5D-A)

Today the pipeline reads local files (`assetRoot` + `cards[].image`). The spec asks for real content
pulled from **project APIs**, retry- and proxy-robust. Nothing exists.

**Build**
1. `scripts/preview-build/asset-fetch.mjs` — a small fetcher with a **pluggable per-project source**:
   `{kind:'fs', root}` (today's behaviour, kept) or `{kind:'api', url, headers, pick}`.
2. Bounded retry with backoff; a **hard timeout**; and on exhaustion it **fails the build**, never
   silently substitutes a placeholder — the placeholder guard exists precisely because a silent
   fallback once shipped.
3. Cache fetched assets under the scratch dir keyed by URL, so a round is reproducible offline and a
   rebuild does not re-hit the project.
4. Keep everything `data:`-inlined at emit, so CSP-safety is unchanged.

**Acceptance**
- **Must-pass:** an API source returns three images and the round builds with them inlined.
- **Must-fail:** a source that 500s on every attempt **fails the build** with the URL and attempt
  count named; a test asserts no partial page was written.
- **Must-pass:** the existing `fs` config path behaves byte-identically to today (regression).

---

## C3 — A test for `design-round.mjs` · small

AC10 — "the pipeline runs as one command" — is the only acceptance criterion whose module has **no
test naming it**.

**Build:** drive `design-round.mjs` end to end against a fixture set, asserting the stage order and
the fail-closed behaviour at each step.

**Acceptance**
- **Must-pass:** a clean set runs gates → build → check → computed → publish and reports each stage.
- **Must-fail:** a set that fails the isolation gate **never reaches publish** (assert publish was not
  called, not just that the exit code was non-zero).
- **Must-fail:** the existing "refuses to publish a file other than the one this run built" guard is
  covered — that is the seam the one-command design exists to close.

---

## C4 — Rung A: style boards · **no plan existed anywhere**

§5C rung A is 3–5 whole-vibe direction boards, each with a named palette, a type voice, a mood and a
hero sample. `design-directions.json` holds 20 named directions and the router maps rung A — but
**nothing enforces what a board contains, and no board has ever been produced.**

**Build**
1. A board schema: `{direction, palette: [4-6 hex], type_voice: {display, body}, mood: [3-5 words],
   hero_sample}`.
2. A checker in the gate family: count bounds, palette contrast floor, and **distinctness across
   boards** (two boards that differ only in accent are not two directions).
3. A board renderer reusing the variant harness — boards are a variant set with a different card.
4. Run one real rung-A round.

**Acceptance**
- **Must-fail:** a board with 2 palette entries, or no hero sample, is refused with the field named.
- **Must-fail:** two boards whose palettes are within ΔE of each other are refused as not distinct.
- **Must-pass:** a well-formed 3-board set passes and renders.

---

## C5 — Rung C: a cluster or whole-page round

Routed (`RUNGS_BY_SCOPE`, tested) but **never run**. Every real round to date is component-scope on
one target.

**Build**
1. Pick a real cluster from the live ledger — the three `library-list` axes are already a cluster in
   everything but name.
2. Render at **real density on the measured screen** (2194×1234 logical, not 3840).
3. Confirm `coreMechanicGate` behaves: page/site scope must stay blocked until a rung-1 decision is
   *locked*, and nine now are — so this is the first time that gate can be exercised truthfully.

**Acceptance**
- **Must-fail:** a page-scope round with no locked rung-1 mechanic is blocked.
- **Must-pass:** with the mechanic locked, a cluster round composes ≤5 contested axes grouped by
  perceptual channel and renders at real density.

---

## C6 — Make ask-on-primary and pressure-test mechanical · closes **AC7**

Both are prose. AC7 says "anti-slop **+ ask-on-primary** enforced"; only the first half is.

**Build**
1. `primaryDecisionGate(roundInput)` — a *primary* decision (a foundational axis, or one flagged for
   promotion by `round-composition.mjs`) may not be recorded without an explicit owner choice. Not a
   new concept: it is the lock-earned rule applied one rung earlier.
2. `pressureTest(variants)` — run the checks that already exist (contrast, reduced-motion, colour
   budget) **before** presenting, and refuse to present until each has *run*. Three states, never
   blurred: `ran` · `unavailable` · `failed` — the same vocabulary the computed pass uses.

**Acceptance**
- **Must-fail:** a primary axis recorded with no owner choice is refused.
- **Must-fail:** presenting before the pressure-test has run is refused, and `unavailable` is
  reported as unavailable — never rounded up to a pass.
- **Must-pass:** a non-primary axis is unaffected (this must not turn every round into a dialog).

---

## C7 — Colour budget stated up front · closes **AC9**

The *honoured* half is enforced in pixels and blocks. The *stated* half is a config field nobody is
required to fill.

**Build:** make `colorBudget` mandatory in the round config, with an explicit `{mode:'unconstrained',
why}` escape so a deliberate choice is possible but must be *stated*.

**Acceptance**
- **Must-fail:** a round config with no `colorBudget` is refused before build.
- **Must-pass:** `{mode:'unconstrained', why:'…'}` proceeds, and the reason is carried into the round
  record so the choice is auditable later.

---

## C8 — Assert light **and** dark actually render · closes half of **AC4**

`prefers-color-scheme` is present in both templates; **no test asserts either world renders.**

**Build:** in the computed pass, collect once per scheme and assert the floor rules hold in both.

**Acceptance**
- **Must-fail:** a panel meeting contrast in light and failing in dark is caught, naming the scheme.
- **Must-pass:** a panel correct in both passes, and the report says which schemes were measured.

---

## C9 — Prior-art **source scan** (D2)

The ledger half is done: "is this already *decided*?" The source half — "what does the built code
already *use*?" — is not.

**Build**
1. A per-project **source-root convention** (the projects live at `/mnt/storage/websites/<slug>`).
2. Real CSS/token extraction, not a grep — the register is explicit that a grep cannot see cascade
   resolution. Reuse the computed collector rather than adding a parser dependency.
3. Report **conflict**, never auto-resolve: "the ledger says 12px, the built code uses 8px" is
   information for the owner, not a value to silently prefer.

**Acceptance**
- **Must-pass:** a project whose CSS defines `--radius: 8px` reports it as already-built prior art.
- **Must-fail:** a disagreement between ledger and code is reported as a **conflict naming both**, and
  the round is not silently seeded with either.

---

## C10 — `theme-extract.mjs`: normalise L, clamp C

A1 §3.10: derive by role, then **normalise lightness to the accent target and clamp chroma so
contrast is guaranteed at derivation time**. Today it only boosts V, so a dark poster can yield an
accent that fails contrast downstream.

**Acceptance**
- **Must-fail:** a very dark and a very light poster both currently yield accents failing the
  contrast floor; after the fix both pass.
- **Must-pass:** an already well-behaved poster's accent is unchanged (no gratuitous drift).

---

## C11 — Source declarations on the r1/r2 round configs · unblocks the republish

Found by running the rebuild: `build-variant-set.mjs` refuses the r1 set with
`source policy: FAIL — NOTHING WRITTEN. A set that never considered the catalog is not a library-first
set.` The gate is right; the configs predate the rule.

**Build:** add `source: {kind:'bespoke', why}` per variant — the checker itself reports
`catalog candidates: none for this archetype/tier`, so bespoke is the honest answer. Then
`POST /api/backup` and republish with `--replace`.

**Acceptance**
- **Must-pass:** both sets rebuild green and republish.
- **Must-fail:** a variant with `kind:'bespoke'` and no `why` is still refused (do not weaken the rule
  to get past it).

---

## C12 — The six end-to-end scenarios · **the actual §12 proof**

1. A single component, start to finish.
2. **~20 different components** — the pairing test. For each: which archetype/tier it resolves to,
   which sub-decisions become contested, how round-composition groups them by perceptual channel,
   which render surface the tier gets. **Recorded as a table, because the output is the comparison.**
   This is a test of routing and pairing across *variety*, not of one round's output — and with three
   registered archetypes it will mostly exercise **C1's derive path**, which is the point.
3. New component on an existing project.
4. Unseen archetype forcing derive — **= C1**.
5. Redesign of built UI, where prior art must reconcile *already decided* vs *already built* —
   **needs C9**.
6. Cold start: brand-new project, Stage 0 → Stage 3, no spec, no ledger, no components.

**Acceptance:** every scenario produces either a working round or a **named refusal**. A scenario that
"mostly worked" is recorded as a failure with the specific gap — the point is to find the gaps, not to
collect green ticks.

---

## Order

**C1 → C12(2) → C11 → C3 · C8 · C7 → C6 → C4 → C5 → C9 → C10 → C2**

C1 first because nine locked decisions are stuck behind it. The 20-component pairing run comes second
because it is the cheapest way to find what *else* is broken before building more. C2 is last: it is
the largest unit and the only one nothing else depends on.
