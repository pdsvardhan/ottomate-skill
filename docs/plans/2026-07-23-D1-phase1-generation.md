# D1 — Phase 1: generation logic + quick wins

**Category:** D · Generation · **Size:** L · **Where:** plugin (`ottomate`, `main`) + one safe live-DB demo
**Owner rulings this session:** first target = **a throwaway test component**; scope = **build it AND run
one real round via a fresh sub-agent** (documented → demonstrated).

The harness *displays* variants safely; nothing *produces* them yet except me, by hand. This unit builds
the producer, and runs it once for real. **No real generation round has ever run — this ends that.**

---

## ✅ Outcome (2026-07-23) — built AND demonstrated end-to-end

**Part A** (commit `7f909d2`): enforced rules 15→26 of 89 (7 bookkeeping flips + 4 new source detectors);
`block-svg-id-collision` downgraded block→advise.

**Part B** (commits `481c82e`, `6d83df8`): all four elements built + a **real round run by a fresh
sub-agent** on a throwaway media-card:
- The fresh agent committed to an *editorial* direction, over-generated 6, filtered to 3 by rubric
  judgment (honestly flagged as judgment), honouring the constraint contract (no glass/gradient-text,
  no network, no script, accent ≤3 surfaces).
- Harness ran: gate + checker. **Verified rendering isolated in the real Artifact sandbox**
  (`…/e8bfa469-…`) — three visibly-distinct cards (pill vs no-badge vs corner-ribbon; footer vs below
  vs overlaid title; CTA vs frame vs badge accent), each in its own shadow root.
- **Live pick→ledger round-trip**: a mixed pick (radius from soft-footer, title from sharp-broadsheet,
  accent from soft-footer, badge from overlaid-poster) → 4 `design_decisions` rows POSTed to a
  throwaway `zzz-phase1-demo` project, read back with `mixed_from` + `rejected[]` intact, project
  deleted (cascade). Backup-first, one-door, clean teardown.

**The real round earned its keep — it caught THREE real things unit tests could not:**
1. The gate FALSE-REJECTED the set: `axis.kind:"structural"` demanded markup divergence, but the
   markup fingerprint is blind to CSS-value differences, so three genuinely-different cards read as
   "98% identical." Fix: kind-selection guidance in the method (`stylistic` for value-difference
   bundles; axis-diff is the divergence proof). The correction was **proven by rendering**, not asserted.
2. `adv-css-layer-order` false-positived on a hex colour (`#ffcf8a`) in a gradient. Fixed + regression test.
3. The `block-svg-id-collision` downgrade (A2) was **validated** — the agent naturally reused `.is-hover`
   etc. across panels, which now advises instead of blocking a legitimate isolated set.

**Honest limits carried forward (not claimed):** the 6→3 filter is model judgment (no scorer); the
generation-variance seeding is `[REASONED]` (the gate is the backstop); there is no computed
rendered-appearance divergence check yet (the proper backstop for stylistic bundles).

---

## Part A — Quick wins (do FIRST; A2 unblocks Part B)

**A1. Bookkeeping flip (7 rules).** `iso-axis-diff · iso-control-diff · iso-blind-sort · iso-count ·
iso-never-one · present-randomise-order · present-neutral-labels` already execute via
`isolation-gate.mjs` (20/20) but are marked `pending` in `design-rules.json`. Flip to `enforced` with
`enforced_by: "scripts/preview-build/isolation-gate.test.mjs › …"`. **Leave `seq-parents-locked` and
`lock-regression-gate` pending** — those are genuinely unbuilt (the DAG and the golden-file differ).

**A2. Downgrade `block-svg-id-collision` block_owner → advise.** Now that markup panels are shadow-
isolated (`4813ffa`), a cross-variant id/class/keyframes collision is **harmless** — each lives in its
own shadow root. Keeping it as a hard block would **reject legitimate DSD-isolated sets** the moment a
generator reuses `.card` across two variants, which it naturally will. So this is not just cleanup —
**it unblocks Part B.** Keep it as an *advisory* (namespacing is still good hygiene). *Disclosed
reversal of an earlier "needs owner OK" — doing it because it's now clearly correct; say if you'd rather
keep it hard.*

**A3. Write a batch of source detectors.** Implement the clearly-source-checkable ones useful to a
generation round: `adv-token-layer-direction` · `adv-raw-value-drift` · `adv-single-icon-set` ·
`adv-icon-delivery-inline-svg` · `adv-deterministic-placeholder` · `adv-no-image-distortion` (source
half) · `adv-progressive-disclosure-depth`. Each gets a must-fail + must-pass test and flips to
`enforced`. The remaining source rules and all `computed` rules stay pending (Phase 3b).

---

## Part B — Phase 1 generation, the four elements

### Verified live state (read 2026-07-23)

```
C1 §3        tiers primitive/composite/surface; anatomy-before-API; parent-prepended part names;
             required-variant floor (rule 10); required-state floor (rule 11: hover/focus-visible/
             active/disabled + loading if async + error if validity + selected if selectable)
B2 §3        the full state matrix + machine hooks; hover is never the only affordance; focus ring
             >=2px/3:1; state never colour-alone
rubric       data/design-rubric.md — 4x25 (Hierarchy/Consistency/Legibility/Craft); MODEL-APPLIED,
             incl. a "vision-proxy 5-second test". No mechanical runner exists.
directions   data/design-directions.json — 20 directions {id,family,signals,best_when,key_failure,
             a11y_risk,motion_character,trend_bound,durable_default} + adjective_map + on_demand_recipes
harness      config → variants[] with markup (panelTemplate) or tokens; axis{name,parameter,kind,rung,
             params}; gate + design-check run before emit; markup mode = static DSD, token mode immune.
             cards:[] ⇒ no ImageMagick ⇒ runs on Windows.
ledger       design_decisions (migration 0010, live): one row per decision; chosen_value, mixed_from,
             rejected[], rationale (uncapped), profile_at_decision, constraints_applied. Keyed by
             project_slug (FK). PATCH enforces lock-earned/unlock-reason as 422s.
```

### Element 1 — Sub-decision inventory → `data/component-anatomy.json`

A data file the generator reads to know **what to vary**. Per component archetype:
- `tier` (primitive | composite | surface) — C1 §3.1
- `parts[]` — parent-prepended names (C1 §3.5), e.g. Card = `Card{Container,Media,Header,Title,Meta,Actions}`
- `required_states[]` — the B2/C1 floor for the tier (rule 11)
- `required_variant_floor` — C1 §3.10
- `render_surface` — how a round of this tier is rendered (element 2)
- `sub_decisions[]` — the ~8–12 named axes that can vary, **each tagged with the part it belongs to**
  and a `kind` (structural | stylistic | motion | copy). These ARE the bundle's sub-decisions
  (doctrine 40: "what to vary comes from the anatomy, not from invention").

Seed archetypes: **media-card** (composite — the demo target), plus **button** (primitive) and
**data-table-row** (composite) so the file proves it generalises past one shape. Validated by a schema
test (every archetype has all keys; every sub_decision names an existing part; required_states ⊇ the
tier floor).

### Element 2 — Render-by-tier

`render_surface` in the anatomy data drives it: **primitive** → the component across its required states
pinned open, side by side · **composite** → 1–3 instances at real density · **surface** → once, full
density (doctrine "render surface follows the tier"). The generation method instructs the sub-agent to
author panel markup that **pins each required state visibly** (e.g. a `:hover`-equivalent instance shown
open), so the axis is judged where it lives — the fix for the "axis params not visible in a shown state"
defect. *This pass wires the convention + a checklist; a mechanical "state is visibly rendered" gate is
noted as a follow-up, not built here.*

### Element 3 — Bundle model + per-item picks → `scripts/generation/picks-to-ledger.mjs`

- A **round** = the target's sub-decisions × 2–4 variant bundles. Each variant declares its
  `axis_values` per sub-decision so the gate's per-sub-decision isolation applies (doctrine 38: every
  named sub-decision genuinely differs; nothing outside the list moves).
- **Per-item pick**: the owner picks a value per sub-decision (a *vector*, mix is normal).
  `picks-to-ledger.mjs` turns a pick vector into **one `design_decisions` payload per sub-decision**
  (`chosen_value`, `mixed_from` = which variant it came from, `constraints_applied`,
  `profile_at_decision`, `rationale`). Pure logic, unit-tested with no DB.
- **Live demonstration (safe):** `POST /api/backup` first; create a throwaway `zzz-phase1-demo` project
  via the API; POST the pick rows; read them back; then delete the throwaway project (or leave it,
  clearly named, if project-delete isn't exposed). **One door, backup-first, touches no real project.**

### Element 4 — Over-generate 6 → filter to 3 → `references/stage-2-generation.md`

The method a **fresh-context sub-agent** follows:
1. Load target anatomy, constraint contract, audience profile, doctrine, `rejected[]` (empty gen-1).
2. Commit to a named direction (rung 0) from `design-directions.json` if unset.
3. Enumerate sub-decisions from the anatomy.
4. **Over-generate 6 bundles, seeded for divergence** — each candidate gets a distinct seed (a
   different named direction, or a different value on the contested sub-decisions) with an explicit
   "these must differ on the named axes" instruction. *This is the generation-variance technique the
   register flags as the open LLM-behaviour gap; the approach is `[REASONED]`, and the **isolation gate
   is the backstop** that rejects a set that came out samey anyway.*
5. **Filter 6 → 3 by MODEL-APPLIED rubric judgment** (the rubric doc is built for this; it has
   vision-proxy checks a model performs). **HONEST: there is no mechanical rubric runner yet** — the
   filter is the sub-agent's scored judgment, recorded, not a computed score. The mechanical runner is
   a later item.
6. Emit a harness config (markup panels, states pinned per element 2).
7. Run the harness — gate + checker. On fail, regenerate (fail closed).
8. Present; record the pick vector via element 3.

### The real round (the demonstration)

Target: a **throwaway synthetic media-card** (no real project). Run via a **fresh `Agent` sub-agent**
(not inline — this session is long, exactly the degradation case the owner named). The sub-agent
authors 6 bundles, self-filters to 3, emits a config. Main session runs the harness (markup mode, no
ImageMagick), publishes the artifact, and I eyeball it. Then demonstrate element 3 by recording a sample
mixed pick to the throwaway ledger project.

## Procedure

1. **Part A** first: A1 flip, A2 downgrade, A3 detectors — each with tests; `design-check` stays green.
2. Build `data/component-anatomy.json` + schema test.
3. Write `references/stage-2-generation.md` (the method) and wire it into SKILL.md's Stage-2 router.
4. Build + unit-test `scripts/generation/picks-to-ledger.mjs`.
5. `POST /api/backup`; create `zzz-phase1-demo`; keep the id.
6. Spawn the fresh generation sub-agent with the method + media-card anatomy + a sample constraint
   contract + a committed direction. Receive its 6→3 config.
7. Run `build-variant-set.mjs`; confirm gate PASS + checker PASS + DSD isolation; publish the artifact;
   screenshot-verify in Chrome (documented ≠ demonstrated).
8. Feed a sample mixed pick vector through `picks-to-ledger.mjs` → POST to `zzz-phase1-demo`; read back;
   clean up.
9. Update `SKILL-REGISTER.md` (systems, rules, the "no real round" line) + this plan's outcome, same
   commits. Commit per part; `git status` after each.

## Acceptance

1. `component-anatomy.json` covers 3 archetypes, schema-valid; every sub_decision names a real part.
2. A generation round produces a **gate-passing, checker-passing, DSD-isolated** 3-variant set for the
   media-card, **verified rendering in the Artifact sandbox** — not just emitted.
3. The 3 variants are **genuinely different** on the named sub-decisions (the gate proves it; I also
   eyeball that they don't read as three near-identical cards).
4. A mixed pick vector ("v1's corners + v2's hover + v3's spacing") produces one `design_decisions` row
   per sub-decision, each with `mixed_from`, round-tripped through the live API on the throwaway project.
5. Part A: 7 rules flip to `enforced` (naming the gate test); `block-svg-id-collision` is `advise`; the
   A3 detectors each have a must-fail test. `design-check` + `isolation-gate` + `harness-dsd` all green.
6. Register honestly reflects: filter is model-judgment (no mechanical runner); render-state gate not
   built; generation-variance technique is `[REASONED]`.

## Risks

| Risk | Mitigation |
|---|---|
| **Overclaiming "generation works"** after one round | Acceptance #2 requires an in-sandbox render, not emission; #3 requires genuine difference; the honest limits (model-judgment filter, no variance proof) go in the register |
| Live-DB damage from the demo | `POST /api/backup` first; throwaway `zzz-` project only; one door; delete or clearly-label after. No real project touched |
| The sub-agent returns a samey set | The isolation gate rejects it (exit 2, nothing shown) — the backstop is already proven (20/20). Regenerate |
| Downgrading `block-svg-id-collision` loses a guard | It's redundant under DSD (harmless collision); kept as advisory so it still annotates. Disclosed for owner objection |
| Scope creep (mechanical rubric runner, render-state gate) | Explicitly OUT; both noted as follow-ups. This pass proves the loop, not every enforcement |
| Fresh sub-agent can't run the harness itself | It only authors + emits a config (text); the main session runs the harness. Clean division |
