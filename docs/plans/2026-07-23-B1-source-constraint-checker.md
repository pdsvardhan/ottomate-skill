# B1 — The source constraint checker (Phase 3a)

**Category:** B · Enforcement · **Size:** M · **Where:** plugin (`ottomate`, branch `main`)
**Unblocks:** the owner's #1 pain — *89 rules are `status:"pending"` and enforce nothing today*
**Follows:** the research sweep (22/22 tracks, complete 2026-07-23)

---

## Why this unit, and why first

The handoff ordered the phases generation → persistence → enforcement → wiring. **Complete knowledge
changed that order twice**, so this is the re-plan, not a deviation:

1. **Phase 1 (generation) is blocked.** D2 §3.11 exposed that the variant harness injects all N
   variants into one document with no namespace isolation (`template.variant-set.html:140`). Building
   markup-mode generation on top of that would produce sets whose *source* differs and whose *display*
   is identical — the exact failure the isolation gate exists to prevent. That fix needs a browser to
   verify, so it is a separate unit.
2. **Phase 3 split in two.** C2 §3.10 established that coherence and token-adherence are **runtime**
   questions (`getComputedStyle`), not source-text ones. Rules now carry `method`. **39 rules are
   `source` and need no browser at all** — they are pure Node, testable locally, and include every
   feasibility rule. That is Phase 3a, this unit. The 16 `computed` rules are Phase 3b and need a
   rendering host.

So 3a is the largest amount of *real, provable* enforcement available for the least machinery, and it
attacks the thing two independent verifiers already caught this program doing: documenting rules
without running any.

## Verified current state (read 2026-07-23, live)

```
plugin repo      ~/.claude/plugins/ottomate, branch main @ 42b4b9d, clean, 0 unpushed
doctrine         skills/ottomate/references/design-doctrine.md — 229 rules, numbering contiguous 1-229
rules            skills/ottomate/data/design-rules.json — 89 rules, ALL status:"pending"
                 by tier   block_owner 10 · block_floor 5 · block_feasibility 6 · advise 68
                 by method source 39 · computed 16 · unset 34 (pre-existing, unclassified)
existing gate    scripts/preview-build/isolation-gate.mjs — 247 lines, exports runGate/formatGate,
                 returns { pass, checks:[{name,pass,detail}], failures[] }; 20/20 tests green
harness          build-variant-set.mjs:83 calls runGate BEFORE emitting; exit 2 and writes nothing
contract schema  design-rules.json → constraint_contract_schema (must_use, animation_vocab,
                 forbidden, source_policy, colour_budget) — all status:"pending", none implemented
```

**No DB change in this unit.** Nothing touches the app, so no backup, no migration, no drizzle-kit
question. Plugin-only.

## Specification

New directory `scripts/design-check/`, mirroring `preview-build/`'s conventions.

**`design-check.mjs`** — `runCheck({ variants, contract, profile, rules })` where `variants` is
`{ [label]: sourceText }`.

- Loads `data/design-rules.json`; runs only rules with `method:"source"` **and** an implemented
  checker. A rule with no implementation is **skipped and reported as skipped** — never counted as a
  pass. That distinction is the whole point of the `Enforced?` field in the register.
- **Tier semantics**, exactly as doctrine §5:
  - `block_feasibility` → fail closed, never profile-filtered (a blank panel is blank for everyone)
  - `block_owner` → fail closed, never profile-filtered
  - `block_floor` → fail closed, **filtered by audience profile** via `resolveFloor(profile)`
  - `advise` → annotated, never blocks
- Returns `{ pass, blocked[], advisories[], skipped[], checked, byRule }`.

**`resolveFloor(profile)`** — reads `audience_profiles` from the JSON and returns the set of
`block_floor` rule ids that bind for P1/P2/P3. This is the owner's ruling made executable.

**Checks implemented in this unit** (source-method, mechanically sound):

| Tier | Rules |
|---|---|
| feasibility | `feas-no-eval` · `feas-no-wasm` · `feas-no-network` (incl. the placeholder-service list) · `feas-no-inline-handlers` |
| owner contract | `must_use` · `animation_vocab` · `forbidden` (5 detectors) |
| owner integrity | `block-svg-id-collision` — cross-variant, the Phase-1 blocker's static half |
| advise | `adv-no-font-smoothing` · `adv-action-label-specific` · `adv-error-copy-shape` · `adv-no-implementation-vocabulary` · `adv-css-layer-order` · `adv-inline-style-attr` · `adv-webkit-prefix-pair` · `adv-not-default-inter` · `adv-hover-control-focus-within` · `adv-weight-budget` |

**Deliberately NOT implemented here, and why** — recorded so nobody later reads silence as coverage:

- `feas-baseline-gate` — needs real `@supports` block parsing to avoid firing on correctly-gated code.
- `source_policy` / `colour_budget` — the first needs a source-tagging convention that does not exist
  yet; the second needs rendered surfaces, so it is `computed`.
- Every `computed` rule — Phase 3b.
- `adv-glass-legibility` and `adv-brand-mark-authentic` — already marked in the register as **not
  fully checkable by any method**. They must never be reported as enforced.

## Procedure

1. Write `scripts/design-check/design-check.mjs` + `checks.mjs` (the individual detectors).
2. Write `scripts/design-check/design-check.test.mjs` — for **every** implemented rule, one case that
   must fail and one that must pass. A detector with only a passing test proves nothing.
3. Run the suite; all green.
4. Wire into `build-variant-set.mjs` **after** `runGate`, before emit: feasibility/owner failures
   `process.exit(2)` and write nothing; advisories print and flow into the panel's annotation slot
   (`v.constraints_honoured`, which the template already renders).
5. Flip `status` from `"pending"` to `"enforced"` **only** for rules with a passing failing-case test,
   and add `enforced_by` naming the test.
6. Re-run `isolation-gate.test.mjs` — must stay 20/20.
7. Update `SKILL-REGISTER.md` §2 and §3 in the same commit; move the flipped rules out of the
   "Specified, enforcing nothing" list.
8. Commit + push. `git status` **after** committing.

## Acceptance

1. `node --test scripts/design-check/design-check.test.mjs` green, with a **failing case per rule**.
2. A variant containing `eval(` is **blocked**, and the harness writes nothing.
3. A variant referencing `placehold.co` is blocked by `feas-no-network`.
4. Two variants declaring the same SVG `id` are blocked by `block-svg-id-collision`.
5. An `animation_vocab` of `["fade-up"]` blocks a variant that also defines `@keyframes bounce`.
6. `resolveFloor('P1')` and `resolveFloor('P3')` return **different** sets, proving the profile filter
   is executable rather than prose.
7. A clean variant passes with zero blocks and its advisories annotated, not suppressed.
8. The register's `Enforced?` column names a test for every rule flipped to `enforced`, and every rule
   not implemented is still listed as pending.

## Risks

| Risk | Mitigation |
|---|---|
| **False positives make the gate get switched off** — the real failure mode for a linter | Only `block_*` tiers stop a build; all 68 `advise` rules annotate. Regex scoped to user-visible text for copy rules, not to class names |
| Regex over HTML is fragile | Accepted deliberately and scoped: these are *source* rules by definition. Anything needing cascade or DOM resolution is `computed` and out of scope — that boundary is the `method` field |
| Overclaiming enforcement | A rule flips to `enforced` **only** with a test that proves it *fires*. Unimplemented rules report as `skipped`, never as passing |
| The checker drifts from the JSON | The JSON is the single source of ids and params; the checker looks rules up by id and reports any implemented detector whose id is absent from the JSON |
