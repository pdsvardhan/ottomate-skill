# Stage 2 — TRUSTWORTHY. The next set of to-dos.

**Parent:** `2026-07-27-TASK2-COMPLETION-PLAN.md`. Stage 1 (USABLE) is complete — plugin `59053ad`,
app `6ecc260`, 117 + 31 + 55 tests green.

**What Stage 2 is for, in one line:** Stage 1 made the tool *usable*; Stage 2 makes it so that
**nothing it shows you can be quietly wrong**.

Ordered in three batches. Batch A is small corrections that each stop a real loss. Batch B is the two
things that change the *quality* of what you're shown. Batch C is completeness.

---

## Batch A — quick corrections (each small, each fixes a real loss)

### T7 · The rung bug — a composite component is being treated as a cluster
`TIER_RUNG = { primitive: 2, composite: 3, surface: 4 }` maps a composite **component** onto rung 3,
which is named **cluster**. Rung drives `COUNT_BY_RUNG`, so this silently relaxed the variant count
from *exactly 3* to *2–3* for every card round we have run. It is also **duplicated verbatim** in
`picks-to-ledger.mjs:19` and `publish-round.mjs:89`.

- **Build:** tier→rung belongs in the question registry (one home), and a composite component resolves
  to rung 2 (`component`). Rung 3 is for a genuine multi-component cluster.
- **Acceptance:** one definition, both callers use it; a test asserts a composite component gets rung 2
  and a `cluster`-scope round gets rung 3; the count rule tightens back to exactly 3 at component rung.
- **Risk:** the two live Screenroom rounds carry `rung: 3`. Decide whether to backfill or leave them
  labelled honestly — **do not silently rewrite live rows.**

### T5 · Slot letters are re-shuffled every round, so `mixed_from` doesn't survive
G3 §3.6 randomises presentation order per round. The ledger stores `mixed_from: {variant: "A"}` with no
label, so "A" in round 1 is a different bundle from "A" in round 2 and only the harness manifest can
tell them apart.

- **Build:** carry the **label** beside the slot in `variants_shown` and `mixed_from`; show both in the
  picker.
- **Acceptance:** a decision from round 1 and one from round 2 are distinguishable from the ledger row
  alone, with no manifest lookup. Must-fail: a payload with a slot but no label is rejected.

### T4 · The 6→3 filter throws three bundles away and keeps no record
The method over-generates 6 and keeps 3. The discarded three vanish — so the filter is unauditable and
the next round can't learn from them.

- **Build:** write the discarded bundles + why into the `round.json` that `publish-round.mjs` **already
  writes** beside the preview. No schema change, no migration.
- **Acceptance:** after a round, `round.json` names all 6 candidates, which 3 shipped, and the stated
  reason each survivor beat the two it displaced.

### T3 · "Not picked" and "rejected" are the same word, and one of them is a permanent ban
Picking A writes B and C as `rejected` with `why_rejected: "not selected in the per-item pick"`, and the
method says a round must **never re-offer a rejected value**. **So a close second is banned forever for
losing once.**

- **Build:** two grades — `not_selected` (may return in a later round) and `rejected_with_reason` (hard
  ban). Only the second binds `rejectedByAxis`. The picker gets an explicit "rule this out" action
  distinct from simply choosing something else.
- **Acceptance:** a value not picked in round 1 **can** be offered again in round 2; a value ruled out
  with a reason cannot. Must-fail on the second.
- **Touches:** plugin (`ledger-context.mjs`) **and** the app picker → typecheck + rebuild.

---

## Batch B — the two that change what you're actually shown

### T8 · Feed the model your own decision history  ⭐ highest value in Stage 2
Every past locked value, every rejection, every DOM-commenter comment sits in the DB **unused**. It is
the highest-signal taste data that exists, it needs no research, and no external corpus can substitute
for it. Today a fresh round knows the doctrine and the constraints — but nothing about *you*.

- **Build:** a style-prior packet assembled from the ledger — what this owner has locked before across
  projects, what they consistently reject, and the wording of their own comments — injected into the
  generation input alongside the doctrine.
- **Acceptance:** demonstrated on real data, not a fixture: a round generated **with** the packet
  re-offers materially fewer already-rejected shapes than one generated without. State plainly that
  this is a **[REASONED]** technique with an honest measurement, not a proof.
- **Risk:** overfitting to past taste is a real failure mode — the packet must inform, never constrain,
  and the round must still be able to offer something the owner has never seen.

### T2 · Auto-inline the computed pass — a manual step is a step that gets skipped
The computed checker exists and works (contrast · cross-component coherence · appearance divergence),
but it runs as a **separate manual command after the fact**. It is the only thing that proves the panels
genuinely *look* different rather than merely reading differently — the backstop under the whole
stylistic-bundle model.

- **Build:** run it as part of the round. **Constraint verified today:** `run-computed.mjs` imports
  `playwright`, which resolves only on VAULT7A — so the harness must either shell out where Chromium
  exists or report **"computed pass UNAVAILABLE here"**. It must never silently skip and print a pass.
- **Acceptance:** a round built on the server runs the computed pass automatically and blocks on a real
  failure; a round built on Windows says the pass could not run, and says it loudly.
- **Risk:** this is exactly the class of thing that gets reported as passing when it never ran. The
  must-fail test is "no Chromium ⇒ the output says UNAVAILABLE, not PASS".

---

## Batch C — completeness

### T1 · The control side is unverified — the twin of the hole fixed today
`control-diff` only checks that a key isn't declared as *both* control and axis. **Nothing verifies the
panels actually hold the controls constant.** Same class of hole as the declaration-vs-artifact one
reproduced this session, on the other side of the set.

- **Build:** for each declared control, assert the panels agree on it — source-level where the value is
  literal, computed where it isn't.
- **Acceptance:** a set that declares `typeface` as control but uses two different fonts is **blocked**;
  the honest set still passes. Must-fail required.

### T6 · `inheritedControls` is computed and then dropped
`buildRoundInput` works out which axes are inherited from prior art, and `build-variant-set.mjs` never
reads them. So an inherited value is a note, not a frozen control.

- **Build:** the harness consumes `inheritedControls` into its `control` block automatically.
- **Acceptance:** an inherited axis appears as a frozen control in the emitted manifest without being
  hand-written into the config.

### T9 · The rubric scorer's objective half
The 6→3 filter is pure model judgment. Contrast, size ratios and token adherence are **computable**;
taste is not. Partial mechanisation beats none.

- **Build:** score the computable rows of `design-rubric.md`; leave the subjective rows as judgment,
  clearly labelled as such.
- **Acceptance:** the filter records a computed score **and** a judgment, separately, and never presents
  the judgment as a measurement.

---

## Gates and follow-ups — not units, but they block or unblock things

| | |
|---|---|
| **Your picks on the two live rounds** | Blocks nothing in Stage 2, but it is what turns U5 from tested-in-a-sandbox into proven-on-your-repo |
| **U5's first live run** | The emitter has never written to Screenroom's real repo. First run should be `--dry-run` in front of you |
| **`data-oid` stamping in Screenroom** | One attribute on the card root. Until then `screenroom.poster-card` is a chosen name, not a wire, and Task 1 / Task 3 / Task 2 aren't actually pointing at the same thing |
| **The composition prediction** | If every pick on round 1 comes from a single panel, that is evidence about the method, and worth recording either way |

---

## Standing rules (unchanged)

Plan before each unit · demonstrate, don't assert · every enforced rule names a test with **both** a
failing and a passing case · register updated in the same commit · ONE DOOR · backup before any DB
change · never `drizzle-kit` · typecheck before rebuild · `git status` after committing.
