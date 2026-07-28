# P2-A — The case-matrix generator: DESIGN (Task 3, Track B, 2026-07-28)

Brainstormed from [T2 research](../research/task3/T2-oracle-and-case-generation.md) + the real P1
layers (A–E, built + verified 2026-07-28) + two owner decisions. This is the approved design; the
implementation plan follows (via `writing-plans`).

## The problem P2-A solves
The P1 layers are the *oracles* (implicit / metamorphic / system-state / visual). P2-A is the piece
that, per feature, **turns a requirement into a bounded, independent set of cases that attach those
oracles** — automatically, without the case-author "asserting the bug back". The research (T2) named
this the actual crux of the whole verifier, harder than driving the browser.

## The key insight
The old brief's three shapes — (a) deterministic cross-product, (b) model-authored+reviewed, (c)
template-per-feature-kind — are **not a choice; they compose** into T2's anchored-hybrid pipeline:
deterministic machinery gives the STRUCTURE (EP/BVA values · fixed path templates · pairwise bound),
Claude fills the STRUCTURED TEMPLATES (never free-forms the oracle) anchored to the pinned requirement,
and the oracles attached are the **P1 modules already built**. The generator *selects and parameterizes*
oracles; it does not invent assertions.

## Owner decisions (2026-07-28)
1. **Output + review = a declarative matrix FILE.** Versionable, diffable, reviewed/locked on the file
   (not a new app UI — that's a later enhancement). (Not: direct Playwright specs; not: in-app surface.)
2. **Independence = temporal AND claim-blind (both).** Author the matrix from the locked ACs/requirement
   BEFORE the coder builds (the file predates the code — SWE-bench FAIL_TO_PASS discipline; git proves
   it), and fill any late-bound bits (real selectors) via a FRESH sub-agent that sees the running app +
   requirement but NEVER the coder's diff or "I fixed X".
3. **Pairwise engine = a small JS-native pairwise function** (no external ACTS/PICT binary — keep the
   plugin self-contained). (My call, not a fork worth the owner's time.)

## Architecture — three parts + the file format

### The matrix file — `design/feature-verify/<feature>.matrix.json` (in the project repo)
```jsonc
{
  "feature": "mapsofbharat.indicator-switch",
  "requirement_ref": "AC-xyz | bug-report-id | spec§",
  "authored": { "from": "locked-AC" | "bug-report", "at_commit": "<pre-build SHA>", "blind_to_diff": true },
  "target": { "kind": "flow" | "page" | "component", "id": "…", "base": "FV_INSTANCE_URL" },
  "parameters": { "indicator": ["A","B","…"], "level": ["district","state"] },   // EP/BVA value classes
  "cases": [
    { "id": "c1", "path": "happy",
      "params": { "indicator": "A", "level": "district" },
      "oracles": [ { "layer": "system-state", "assert": "histogram-sum == api.stats_count" },
                   { "layer": "implicit" } ] }
    // path ∈ happy | error | edge | permission | concurrency | persistence
    // layer ∈ system-state | implicit | metamorphic | visual  (the P1 modules)
  ],
  "review": { "owner_locked": false, "locked_at": null }
}
```

### 1. The generator — `scripts/feature-verify/gen-matrix.mjs` (+ a claim-blind Claude pass)
Runs the T2 recipe, in order, fail-closed: pin the requirement (record the pre-build commit) → EP/BVA
value classes per parameter → instantiate the fixed **path templates** → **attach P1 oracle layers** per
case → **JS pairwise** reduction over the parameter cross-product → risk-order → emit the file. Invoked
at Stage-3 spec-lock, fed only the requirement.

### 2. The runner — `scripts/feature-verify/run-matrix.mjs`
The data-driven generalization of the P1-A / layers specs: reads a matrix file and, per case, drives the
app (Playwright) + invokes the named P1 oracle module with its args → records into `Matrix` → posts the
report. Hand-written specs become the exception; the file is the norm.

### 3. The owner-review gate
The file's `review.owner_locked` flag. **Fail-closed: an unreviewed matrix run is ADVISORY only — it
never gates "done".** Locking is a deliberate owner act on the file (or a rendered view of it).

## Data flow
locked AC / bug-report → **claim-blind generator** (EP/BVA · paths · oracle-attach · pairwise · risk-order)
→ `matrix.json` → **owner reviews + locks** → coder builds → **runner** (drive app + attach P1 oracles per
case) → `Matrix.verdict()` → `feature_verification_reports` + evidence.

## Independence enforcement (the anti-gaslight guarantee)
- **Temporal:** `authored.at_commit` records the pre-build SHA; a tamper check flags a matrix modified
  after the feature's build commits.
- **Claim-blind:** the generator sub-agent's input is the requirement + (for selector binding) the
  running app — never the diff or the coder's narrative.
- **Reproduce-symptom (Stage 4.7):** for an owner-reported bug, the generator authors a case asserting
  RED on the pre-fix state, GREEN after (SWE-bench FAIL_TO_PASS).

## Error handling / fail-closed
- Unreviewed matrix → advisory, never gates.
- Oracle unobservable → `UNMEASURED` → FAIL (existing `Matrix` logic).
- Matrix authored *after* the build (temporal violation) → flagged high-risk.
- Selector binding fails (app changed) → the case FAILS, not silently skips.

## Testing
- **Unit:** a well-formed matrix is produced from a sample requirement; pairwise covers all value pairs;
  risk-ordering is correct; the tamper/temporal check fires; an unreviewed matrix does not gate.
- **must-fail + must-pass** per unit (the program discipline).
- **Demonstrated on MoB:** generate the `indicator-switch` matrix (the feature hand-written in P1-A) and
  show the **runner reproduces P1-A's APPROVE verdict from the declarative file** — proving the file
  format + runner are equivalent to the hand-written spec, then generalize.

## Scope / YAGNI (first cut)
- File format + runner + generator for **ONE feature-kind (a flow), demonstrated on MoB, reusing the P1
  oracles.** No full feature-kind template catalogue yet — grow it as features are covered (that's the
  scale version, the tier×part×channel move Task 2 made).
- Review = the **file itself**, not a new app UI (later enhancement).
- Pairwise = a self-contained JS function.

## Next
Implementation plan via `writing-plans`, then build P2-A (runner-first: prove the file→runner→verdict
path reproduces P1-A, then the generator that authors the file).
