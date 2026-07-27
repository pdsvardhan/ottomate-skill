# I2 — the prior-art / reuse pass

**Unit plan.** Phase D of `2026-07-27-PROGRAM-REPLAN.md`. Answers the owner's question 2:
*"it should understand if this is already solved in a different part of the project."*

---

## 1. Live state verified before designing

- `buildRoundInput` (`method-routing.mjs:62`) takes `decisions` **already scoped to one target** and
  produces `contested` / `frozen` / `rejectedByAxis`. Nothing in it looks outside the target.
- `frozenByAxis` / `rejectedByAxis` (`ledger-context.mjs`) key on `archetype.subId` — no target in the key.
- `GET /api/projects/<slug>/design-decisions` already returns the **whole project**; the per-target
  filter is a query param. So the data needed is one call away and no API change is required.
- Screenroom now has a real round in that ledger, so this is testable against live data.

## 2. The distinction that makes this correct

Two different kinds of "already answered", and collapsing them would produce wrong advice:

| Kind | Example | Strength | Why |
|---|---|---|---|
| **reuse** — same archetype, different target | `media-card.corner-radius` locked on the browse page, now opening a round on the collection page | **strong** — propose inheriting; do not re-open unless the owner wants to diverge deliberately | Two instances of the same component answering the same question differently is drift, not design |
| **coherence** — different archetype, same question | `button.corner-radius` locked, now deciding `media-card.corner-radius` | **advisory only — never auto-inherit** | Doctrine 116/§*Shape* : the radius ladder and concentric nesting mean a nested element's radius *should* differ from its container's. Auto-inheriting here would be a bug |

A third outcome matters as much as the other two: when the project has **two different locked values
for the same question on the same archetype**, prior art must report a **conflict**, not pick one.
That is the project already disagreeing with itself, and it is exactly what nobody was catching.

## 3. Spec

`scripts/generation/prior-art.mjs`, pure (no network — the caller fetches):

- `priorArtByAxis(allProjectDecisions, { targetId, archetype })` → per sub-decision:
  `{ axis, question, reuse[], coherence[], consensus, conflict, verdict }`
  where `verdict ∈ { 'inherit', 'conflict', 'review', 'open' }`.
  Only **locked** decisions can produce `inherit`. `rejected` and `superseded` rows are ignored.
- `applyPriorArt(roundInput, priorArt, { diverge })` → moves `inherit` axes out of `contested` and into
  `inheritedControls`, unless the axis is named in `diverge` (deliberate divergence stays possible —
  the owner's ruling 3: a preset, not a straitjacket).
- `formatPriorArt(priorArt)` → the human/agent summary line per axis.
- Wired as input #7 of `stage-2-generation.md` and returned from `buildRoundInput`.

## 4. Acceptance

1. Unit tests: reuse vs coherence classified differently; conflict reported rather than resolved;
   rejected/superseded ignored; `inherit` only from `locked`; `diverge` overrides.
2. Run against Screenroom's **live** ledger and show the real output.
3. Full plugin suite still green; committed and pushed.

## 5. Deliberately out of scope (the other half of the owner's question)

**Reading the project's built source** to answer "what radius does this project already use in code?".
The ledger half answers *already decided*; a code scan answers *already built*. That is a second unit
(D2) and needs a per-project source-root convention plus real CSS parsing (postcss — see the re-plan's
OSS table), not a grep. Recording it here so it is not mistaken for done.
