# Task 3 — Phase 3 plan (2026-07-28, Track B)

> **STATUS 2026-07-29: Phase 3 BUILT.** **P3-C** (gate-wiring/cadence/cron/reporting) — verified live on
> VAULT7A, nightly cron installed. **P3-A** (AI-visual-judge) — built + demonstrated live on MoB. **P3-D**
> (trajectory monitor) — built. **P3-B** — struck by the owner. Full pure suite 67/67. See the per-unit
> plan docs (`2026-07-28-task3-P3{C,A}-*`) + the SKILL-REGISTER "Feature verifier" row. Remaining Task-3
> tails = the two skill-level dispatch hooks (the judge post-run pass; the trajectory hand-off) — the
> guardrail harness is ready + demonstrated, not yet auto-wired into the skill flow.

The tail of the [implementation re-plan](2026-07-28-task3-IMPLEMENTATION-PLAN.md), after Phase 1 (P1-A…E)
and Phase 2 (P2-A + P2-B) were built + verified. Owner decisions taken 2026-07-28.

## The cross-cutting idea: verification effort scales to the change (owner insight)
The owner runs "varied types of changes and varied volumes", so the right design is **not** "run
everything on every change" — it's a **change-tier** that scales which layers run, how many cases, and
whether the AI-judge fires. The tier is **inferred from the change scope** (which files/components the
change touched — the same impacted-file analysis P3-C needs), with an **owner override**.

| Tier | Example | Deterministic layers | AI-judge (P3-A) |
|---|---|---|---|
| **T0** backend / copy / config | fix an API, reword a label | L1 implicit + L2 system-state | none |
| **T1** small style tweak | colour/spacing on one element | + L4 visual (scoped to the touched area) | none |
| **T2** new/changed component | a new card, a reworked control | + L4 full + L3 metamorphic | **quick advisory glance** |
| **T3** new page / feature / redesign | a whole new flow | everything | **full advisory pass** |

## P3-A — AI-visual-judge (advisory, fail-closed) · **BUILD**
Owner: fires at **T2 and up** (quick glance T2, full pass T3); advisory-only, never gates.
- [ ] **Rubric** `data/feature-verify-judge-rubric.md` — off Task-2's `data/design-rubric.md`; dims =
  *looks intentional / on-spec / balanced*, *empty-state works*, *nothing visibly broken*.
- [ ] **Prompt** `prompts/feature-verifier-judge-prompt.md` — Claude in-session, blind to coder claims,
  reference-anchored, **forced grounding** (cite the region per finding).
- [ ] **Harness** `harness/ai-judge.mjs` — records a `judge_verdict` on the case; **advisory only** (may
  `warn`/flag, cannot emit `pass`); **T3 adds** the reliability guardrails (order-randomized, sampled
  2–3× → disagreement=no-confidence→human, and a periodic CALM self-audit). **T2 = one grounded glance.**
- [ ] **Cross-check:** every spatial claim the judge makes is checked against the L2/L4 DOM/geometry
  layer; a claim the deterministic layer contradicts is **discarded** (neutralises VLM spatial-blindness).
- [ ] **Dispatch:** the runner emits screenshots; the skill spawns a fresh Claude judge pass reading them
  + the rubric; the verdict is advisory and recorded, never gating.
- [ ] **Tier gate:** the judge step is skipped below T2 (inferred from change scope; owner override).
- **must-pass:** a good T3 screen → advisory-clean · **must-fail:** the judge cannot produce a gating
  APPROVE; a hallucinated overlap is discarded by the DOM cross-check.

## P3-B — reference-fidelity · **SKIPPED (owner, 2026-07-28)**
The owner designs in code / via the Task-2 method and does **not** keep target design images to compare
against, so there is nothing for this layer to do. `baseline-guard.mjs` (missing-baseline⇒FAIL) is
already built and stays, so if design-image comparison is ever wanted it can't auto-bless. **Not built.**

## P3-C — gate-wiring + cadence + flake-control + reporting · **BUILD (nightly = cron on VAULT7A)**
Owner: the nightly full pass runs as a **cron on VAULT7A** (simplest; no Gitea Actions runners needed).
- [ ] **Nightly cron** on VAULT7A runs the full matrix across all apps on the real stack; wire the
  existing `postTestRun()` (it has no caller today). Pairs with **app to-do #289**.
- [ ] **On-commit / on-fix cadence:** impacted **app only** (diff vs last-green main) → smoke of that
  app's BLOCK cases; owner-reported-fix → full BLOCK set + the reproduce-symptom two-phase.
- [ ] **Change-tier selection** (shared with P3-A): infer the tier from the impacted files → run the
  layers that tier calls for.
- [ ] **Flake control:** run in the official Playwright Docker image; **Clock API** freeze;
  **Testcontainers** disposable DB for L2 file/DB cases (owner-confirmed IN); keep `retries:0` (or
  `retries:1` with flaky-surfacing + a <2% quarantine budget).
- [ ] **Reporting tail** (old WP7): populate `action_log` per case · JSON**L** output ·
  **delta-vs-previous-run**.
- [ ] **Durable evidence store:** trace/video/screenshot to a dated dir on the server (today ephemeral in
  `/tmp`).
- **⚠ open:** the exact cron schedule + the per-app impacted-file heuristic (settle at build).

## P3-D — CoT/trajectory monitor · **BUILD (owner, 2026-07-28)**
- [ ] `harness/trajectory-monitor.mjs` — a **cheap-model** scan of the coder's build-session log for
  hack-narration ("let me just skip these tests", "hardcode the expected value"); flags high-risk.
  **Detection/gating only, NEVER a training signal** (T3: optimising against it teaches obfuscation).
- [ ] **Precondition:** the coder's session trajectory must be accessible to the verifier — confirm the
  wiring at build (where the build-session log lives).
- **must-pass:** a clean trajectory → no flag · **must-fail:** a trajectory containing a known hack
  phrase → flagged high-risk.

## Sequencing
**P3-C first** (makes the whole verifier run automatically — the highest leverage), then **P3-A**
(the judge, tier-gated), then **P3-D** (the monitor). **P3-B is struck.** Each unit: a plan doc +
must-fail + must-pass + a same-commit register row, verified on VAULT7A.
