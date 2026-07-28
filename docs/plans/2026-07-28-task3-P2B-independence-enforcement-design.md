# P2-B — Independence + fail-closed enforcement: DESIGN (Task 3, Track B, 2026-07-28)

Grounded in [T3 research](../research/task3/T3-acceptance-gate-and-agentic-verification.md) (the documented
reward-hacking threat model) + two owner decisions. Sibling to [P2-A](2026-07-28-task3-P2A-case-matrix-generator-design.md)
(the generator/runner); P2-B is the machinery that makes the whole verifier **structurally un-gaslightable.**

## The job
Make the verifier immune to the documented ways coding agents fake "green" (T3 §1): `exit(0)`/`raise
SkipTest` before asserts run, `__eq__`→True, patching the report object, reading expected values from
test files, memorizing visible tests. **Every one works by making the check not really run** — so the
defenses are: the verifier owns and runs its own assertions, fail-closed, held-out from the coder,
tamper-detected, claim-blind, and its trustworthiness is *recorded*, not assumed.

## Already covered — P2-B does NOT redo these
- `UNMEASURED ⇒ FAIL` (the `Matrix.verdict()` logic — built, `report.ts`).
- Claim-blind matrix authoring + owner-review gate + temporal tamper-on-the-matrix (P2-A Task 5).
- The verifier runs its OWN oracle code (the P1 modules), never the project's test suite / a coder exit code.

## Owner decisions (2026-07-28)
1. **Held-out split:** oracle code (runner + P1 modules + generator) lives in the **plugin** (a project's
   coder never touches it → structurally held-out); the **matrix file** lives in the **project** repo
   (reviewable, versioned with the feature) but is protected by the **tamper tripwire**.
2. **Reproduce-symptom = capture pre-fix, run both:** author the symptom assertion from the owner's bug
   report, run it against the still-broken live app → confirm **RED**; after the claimed fix → require
   **GREEN** + a `PASS_TO_PASS` sweep. Strong proof (the assertion demonstrably caught the bug), no
   rebuild. (Not: post-fix-only; not: git-checkout-rebuild.)

## The four guard modules + runner wiring

### 1. Held-out + harness-tamper tripwire — `harness/tamper-guard.mjs`
`assertUntampered({ featureCommits, matrixPath, repoRoot })` → `{ tampered, touched:[…], action }`. Uses
`git log`/`git diff --name-only` over the feature's build commits to see if any touched the matrix file
(or, defensively, any verifier-owned path that should not live in the project). Tampered → `action:
're-derive'` (high-risk: re-author the matrix from the requirement in a fresh claim-blind pass) or refuse
to gate. Extends P2-A's independence guard with the **file-tamper** dimension.

### 2. Reproduce-symptom — `harness/reproduce-symptom.mjs` (+ a `reproduce_symptom` case kind)
A case carries `{ reproduce_symptom:true, symptom_assert, pass_to_pass:[caseIds] }`. Two-phase:
- **Pre-fix** (bug-report time): run `symptom_assert` on the live broken app → **must be RED**. If it is
  already GREEN, the bug was not reproduced → outcome `inconclusive` (flagged), **never a pass**. Store
  the RED result keyed by `(project_slug, bug_report_id)`.
- **Post-fix** (agent claims done): run `symptom_assert` → **must be GREEN**; run every `pass_to_pass`
  case → **must stay GREEN**. The report records both phases, proving the assertion caught the bug and
  the fix cleared it without regressing neighbours (SWE-bench FAIL_TO_PASS + PASS_TO_PASS).

### 3. Consolidated trust record — `harness/trust-record.mjs`
`assessTrust({ matrix, tamper, claimBlind })` → `{ trustworthy, dimensions:{ claim_blind, held_out,
owner_reviewed, untampered, pre_build_authored }, warnings:[] }`. The runner emits this into the report's
`full_report.trust`. **A run that is not trustworthy has its verdict downgraded to advisory (ITERATE),
never a silent APPROVE** — so "was this gate actually trustworthy?" is an auditable field, not a promise.
Consolidates P2-A's independence guard + the tamper check + the claim-blind flag into one record.

### 4. `missing-baseline ⇒ FAIL` — `harness/baseline-guard.mjs`
`requireBaseline(absPath)` → `StateCheck`: FAIL when the baseline is absent, and it **never auto-creates
one** (so the future L6 pixel-regression layer cannot auto-bless the current, possibly-buggy UI). Built
now so L6 inherits it.

## Data flow
runner (P2-A) → `assertUntampered` + `assessTrust` BEFORE any verdict → attach `full_report.trust`; if any
case is `reproduce_symptom`, run the pre/post phases and require RED→GREEN + PASS_TO_PASS; any
`UNMEASURED`/missing-baseline → FAIL. **Trustworthy-APPROVE only when all dimensions hold; otherwise the
verdict is advisory.**

## Fail-closed additions (beyond the existing `UNMEASURED ⇒ FAIL`)
- untrustworthy run → advisory, never gates.
- tampered matrix → re-derive / refuse.
- reproduce-symptom not RED pre-fix → `inconclusive` flag (not a pass).
- missing baseline → FAIL.

## Testing (each guard: a must-fail AND a must-pass)
- **tamper-guard:** a feature commit touching the matrix → `tampered:true`; a clean set → `false`.
- **trust-record:** all dimensions hold → `trustworthy:true`; one missing (e.g. `owner_reviewed:false`) →
  `trustworthy:false` + the verdict downgrades.
- **reproduce-symptom:** RED→GREEN → pass; RED→still-RED → fail; already-GREEN pre-fix → `inconclusive`.
- **baseline-guard:** missing → FAIL; present → ok.
- **Demonstrated on MoB:** a synthetic bug-report flow — a symptom assertion RED against a deliberately
  broken state (reuse the P1-B fabricated-expectation trick), GREEN against the working one.

## Scope / YAGNI
- Four guard modules + wiring into the P2-A runner. No new subsystem.
- Pre-fix symptom baseline stored as a lightweight JSON record (or a `full_report` field) — **no new DB
  table** unless a real need appears.
- Reproduce-symptom demonstrated with a synthetic RED/GREEN on MoB (no real bug needed for the proof).

## Next
Implementation plan (below / companion `-plan.md`), then build after P2-A (the runner P2-B wires into
exists once P2-A Task 3 lands).
