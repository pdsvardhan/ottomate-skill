# C6 — the remaining 61 rules

**Unit plan.** The largest single item left in Task 2. Parent: `2026-07-27-TASK2-COMPLETION-PLAN.md`.

## Live state, counted not recalled

`design-rules.json`: **91 rules, 30 enforced, 61 pending.** Contract keys: 5 of 5 enforced.

| Method | Pending | Note |
|---|---|---|
| `source` | 21 | pure string/regex work, no browser |
| `computed` | 14 | needs resolved styles — the Chromium pass |
| **unclassified** | **26** | no `method` field at all; must be classified before anything can own them |

## The dependency decision — recorded, because it shaped the plan

The OSS table proposed **postcss** (for `@supports` parsing) and **culori** (colour maths). But
**the plugin has no `package.json` and no `node_modules`** — every script runs on plain Node, which is
why the checker works identically on Windows and on VAULT7A.

**Decision: stay dependency-free.** `feas-baseline-gate` needs to parse `@supports`, which is a small
bounded grammar and is written by hand here. Colour maths already exists in `computed-checks.js`.
Adding a dependency tree to a zero-dependency plugin to gain a parser we can write in 40 lines is a bad
trade, and it would make the checker's portability conditional on an install step.

**Two exceptions stay honest rather than being forced:**
- `adv-glass-legibility` — needs **pixel sampling** of the composited backdrop. Playwright can
  screenshot, so this is *possible* on the server only. Left pending until the pixel-diff work.
- `adv-brand-mark-authentic` — **no method can ever check this.** Ships
  `status:"declared-unenforceable"` with its reason, and is excluded from the denominator. The real
  ceiling is therefore **90**, not 91.

## Batches

### Batch 1 — classify, and claim what is already built
26 rules carry no `method`. Classify each as `source` or `computed` by what it must read. **Then claim
the ones already enforced by existing code but never marked** — `lock-regression-gate` is
`diffAgainstSnapshots` in `ledger-context.mjs` with 9/9 tests, and has been sitting as `pending` while
working. A rule that is enforced but marked pending is the *opposite* of the overclaiming failure, and
just as wrong: it hides real coverage.

### Batch 2 — source detectors (the bulk)
Motion vocabulary · z-index ladder · reduced-motion · focus-ring spec · icon delivery · deterministic
placeholders · nav item count · URL state · empty states · plain language · chart baseline and
encoding · font strategy · provenance. All string-readable, all zero-dependency.

### Batch 3 — computed detectors
Scale adherence (spacing/type/radius) · radius nesting · shadow light-source and layering · leading by
role · family count · tabular numerals · dark-mode optical · numeric alignment · target size ·
accent pixel share · line length · density.

### Batch 4 — the feasibility tail
`feas-baseline-gate` (hand-written `@supports` parser) · `feas-degradation-bottom-rung`.

## Acceptance — unchanged from the standing rule

Every rule flipped to `enforced` names a test **and** has both a **must-fail** and a **must-pass**
case. A detector with only a passing test is indistinguishable from a stub returning `true`. The
meta-test in `design-check.test.mjs` already refuses an `enforced` claim with no detector — it caught
exactly that this session, twice.

## Risk

The failure mode for a batch this size is **detectors that pass everything**. Mitigations: the
must-fail case per rule, the existing meta-test, and running the whole corpus against our own real
round panels — where a detector that never fires on real markup is suspicious rather than reassuring.
