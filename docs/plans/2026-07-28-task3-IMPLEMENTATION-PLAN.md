# Task 3 — Feature Verifier: IMPLEMENTATION PLAN (post-research, 2026-07-28, Track B)

Built on the three research tracks — [T1 visual/VLM-judge](../research/task3/T1-visual-acceptance-and-vlm-judge.md),
[T2 oracle/case-gen](../research/task3/T2-oracle-and-case-generation.md),
[T3 acceptance-gate/agentic-verification](../research/task3/T3-acceptance-gate-and-agentic-verification.md).
**Supersedes the WP0–WP8 ordering** in `2026-07-28-TASK3-BRIEF.md` (WP8 resolved; the old WPs fold into the
layers below). This is the re-plan the owner asked for; **build stays parked until the owner reviews it.**

## What the research changed about the design
1. **Independence is architectural, not aspirational.** LLM-generated oracles capture *actual* (buggy)
   behavior when written near the code — so the verifier must author its checks in a **fresh context
   blind to the coder's diff and claims**, from the requirement only. (T2 §3, T3 §3)
2. **The reward-hacking threat is documented and specific** — agents fake green via `exit(0)`,
   `raise SkipTest`, `__eq__`→True, `conftest.py` report-patching, reading expected values out of test
   files, memorizing visible tests. **Every one works by making the check not really run.** ⇒ fail-closed
   + verifier-owns-its-assertions + assert-real-system-state is *provably* the right architecture. (T3 §1)
3. **The model is blind at geometry (~58%) and below-random at design quality** ⇒ deterministic math/DOM
   hard-gates; **Claude-as-judge is advisory-only and can *fail* but never *bless*.** (T1)
4. **Metamorphic/property relations are the independence engine** — "different JD ⇒ different résumé"
   catches the fixed-template bug with *no known-correct value*, where a golden test would bless it. (T2)
5. **Flake is the adoption risk, not correctness** (Google: 84% of red-transitions are flakes). Only
   deterministic checks BLOCK; pixel-diff and taste-judgments WARN. (T3 §4)

## The six non-negotiable invariants (every layer obeys these)
1. **Claim-blind independence** — fresh context/subagent; sees the requirement + running app, never the
   coder's diff or "I fixed X."
2. **Fail-closed** — skipped / mocked / errored / could-not-observe / missing-baseline ⇒ **FAIL**.
   Verdicts are `PASS / FAIL / UNMEASURED`, and **UNMEASURED counts as FAIL at the gate.**
3. **Verifier owns and runs its own assertions** — never trusts an exit code, log line, or test report the
   coder could touch; asserts **real system state via a second channel**.
4. **Every BLOCK assertion is un-fakeable** — cannot be made green by editing prose, a test file, an exit
   code, or a report object; only by the feature actually working.
5. **Deterministic + flake-controlled** — Docker-pinned, time/animation-frozen, isolated, honest retries.
6. **Model advisory-only** — can flag/fail, never pass; blind to claims; grounded + cross-checked.

## The architecture — a layered, fail-closed gate

```
                 requirement / design decision / owner bug report   (the oracle source — pinned, blind to the diff)
                                     │
                 ┌───────────────────┴─── CASE-MATRIX GENERATOR (P2-A) ───────────────────┐
                 │  EP/BVA values → path templates → layered oracles → pairwise bound →    │
                 │  risk-order → structured-template instantiation → OWNER reviews once     │
                 └───────────────────────────────┬─────────────────────────────────────────┘
                                                  │  drives the REAL app (Playwright)
   ┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
   │ HARD-GATE (deterministic, no model)           │                          ADVISORY (model)     │
   │  L1 Implicit    no 4xx/5xx, no console/server err, well-formed, job not orphaned              │
   │  L2 System-state  DB row via API · file on disk · async job done — + differential recompute   │
   │  L3 Metamorphic/property  non-constancy · conservation · union/subset · inverse · permutation │
   │  L4 Mechanical visual  overflow · clip · collision · contrast · target-size · pseudo-loc·stress│
   │  L5 Reference-fidelity  Design2Code metrics (only when a target design image exists)          │
   │  L6 Pixel-regression (WARN)  toHaveScreenshot; MISSING BASELINE ⇒ FAIL, never auto-bless      │
   │                                               │   L7 AI-judge (ADVISORY): holistic fidelity + │
   │                                               │      symptom-relevance; reference-anchored,    │
   │                                               │      grounded, cross-checked vs L2/L4, never   │
   │                                               │      blesses; disagreement → human             │
   └───────────────────────────────────────────────┴───────────────────────────────────────────────┘
                                                  │
                        Matrix.verdict()  (fail-closed: any BLOCK fail / any UNMEASURED ⇒ BLOCK)
                                                  │
              evidence (trace/video/screenshot to a dated dir) + feature_verification_reports + flow_test_runs
```

## The layers — verdict tier · what it catches · status

| Layer | Tier | Catches (mapped to real logged bugs) | Status |
|---|---|---|---|
| **L1 Implicit-oracle** | BLOCK | crashes, 4xx/5xx over the *whole population* — **"one link → 400 downloads"** | new (cheap) |
| **L2 System-state** | BLOCK | 200-writes-nothing, **upload drops files**, **"check everything landed"**, job never finishes | helpers built (A4/A5); **needs the browser leg** |
| **L3 Metamorphic/property** | BLOCK | **"is the résumé actually tailored?"**, partial drops, **load-more** dup/drop | new — the independence engine |
| **L4 Mechanical visual** | BLOCK | **"cut off at proj…"**, **"tags not visible"**, **"empty space"**, **"not responsive"**, low contrast | Task-2 checker exists; **needs wiring** |
| **L5 Reference-fidelity** | BLOCK (if design given) | on-spec drift (colors/positions vs the design) | new |
| **L6 Pixel-regression** | WARN | visual drift on human-approved baselines | Playwright built-in |
| **L7 AI-judge** | ADVISORY | "looks unintentional/unbalanced", did-it-fix-the-*reported*-symptom | new — fail-closed frontier |

## The case-matrix generator (P2-A — the oracle engine, T2 §4)
Per feature the agent claims to have built/fixed: **(1)** pin the spec verbatim, blind to the diff →
**(2)** model parameters (EP + BVA: counts 0/1/many/over-limit; strings ascii/NFC/NFD/RTL/emoji/long/empty;
files 0-byte/huge/wrong-type/dup; auth owner/other/guest) → **(3)** enumerate paths (happy · error · edge ·
permission · concurrency · persistence-after-reload) → **(4)** attach oracles by class, layered (L1–L6) →
**(5)** bound the cross-product with a **pairwise covering array** (NIST ACTS or MS PICT — free, OSS;
3-way for high-risk) → **(6)** risk-order (Likelihood × Impact) → **(7)** owner reviews the matrix **once**
→ **(8)** Claude *instantiates the structured templates* (never free-forms the oracle), refined/rejected
against the pinned spec.

## Work packages (phased; each ships with a must-FAIL and a must-PASS case)

**Phase 1 — the deterministic spine (no model; build first; covers most real bugs)**
- **P1-A · Browser leg + system-state on the first real feature** *(the point; was WP1)*. Drive one real
  app end-to-end (click/type/`setInputFiles`), assert the effect via a second channel, produce
  trace+video+screenshot. must-FAIL: a broken effect BLOCKs with openable evidence · must-PASS: the working
  effect passes. **Owner picks the feature — Maps of Bharat (indicator→dataset→on-page-stats flow; not the
  canvas).**
- **P1-B · The deliberate RED case** *(was WP2)*. Break something; watch the matrix BLOCK; persist openable
  evidence. Proves the gate bites.
- **P1-C · L1 implicit-oracle layer** — population-wide crash/4xx/5xx/console/job-orphan checks.
- **P1-D · L3 metamorphic/property layer** — `fast-check` + the reusable MR set + stateful model-based.
- **P1-E · L4 mechanical visual/robustness layer** — DOM+geometry probe at 4 breakpoints; wire Task-2's
  computed checks; pseudo-loc + empty/long-data stress.

**Phase 2 — the oracle generator + independence machinery**
- **P2-A · Case-matrix generator** — the recipe above, as code + a structured prompt; owner-review-once gate.
- **P2-B · Independence + fail-closed enforcement** — claim-blind runner; verifier owns its assertions;
  held-out spec location; harness-tamper tripwire; **reproduce-symptom (FAIL_TO_PASS + PASS_TO_PASS)** for
  owner-reported fixes; missing-baseline ⇒ FAIL.

**Phase 3 — advisory + wiring tails**
- **P3-A · L7 AI-visual-judge (advisory, fail-closed)** — reference-anchored/pairwise, forced grounding
  cross-checked against L2/L4, order-randomized, disagreement→human, never blesses; periodic CALM self-audit.
- **P3-B · L5 reference-fidelity** — Design2Code metrics when a target design exists.
- **P3-C · Gate wiring + cadence + flake control + reporting** — Docker-pin, Clock API, Testcontainers
  disposable DB, honest retries + quarantine (<2% budget), evidence to a dated dir (viewable at
  trace.playwright.dev, nothing leaves the box), block/warn per risk, **impacted-app selection** on commit,
  **nightly full pass** (to-do #289); `action_log`/JSONL/delta reporting *(was WP7)*.
- **P3-D · (optional) CoT/trajectory monitor** — cheap-model scan of the build session for hack-narration;
  detection/gating only, never a training signal.

## Cadence (T3 §5)
- **On commit:** impacted **app only**, smoke of impacted BLOCK assertions; fast fail-closed pass.
- **On owner-reported-fix:** that feature's full BLOCK set + the reproduce-symptom check.
- **Nightly:** full pass across all apps on the real stack (pairs with #289).

## Open decisions for the owner (before Phase 1)
1. **First feature** — confirm Maps of Bharat, and specifically the **indicator→dataset→stats** control
   flow (DOM + data, not the canvas). Alternative earlier candidates: the music-upload flow (the marquee
   system-state case).
2. **axe-core** — the mechanical visual layer's cheapest contrast/target-size engine is `axe-core` (free,
   self-hosted). You said "accessibility checker not needed" — but axe is also exactly what catches your
   own *"tags not visible / low contrast"* complaints. Option A: pull `axe-core` (one free dep, richest).
   Option B: reimplement just the ~10-line WCAG contrast formula + bounding-box target-size, no dep. Your call.
3. **Testcontainers** for the disposable real DB (free; needs Docker, which VAULT7A already runs) — OK to use?
4. **Reproduce-symptom discipline** — for every owner-reported fix, the verifier first writes a check that
   goes RED on the pre-fix state and GREEN after (SWE-bench FAIL_TO_PASS). Confirm this is the behavior you want.

## Out of scope / parked
- **Canvas / WebGL / 3D** (vardhan, the map paint) — accepted out of reach; we target DOM controls + data.
- **Paid visual-AI SaaS** (Applitools/Percy/Chromatic) — replicate Layout-mode from the DOM instead.
- **Performance/Lighthouse** — owner: not needed.

## Next doc deliverables (after owner nods the architecture)
- Amend `docs/specs/TASK3-FEATURE-VERIFIER-SPEC.md` with a **dated amendment banner** for the broadened
  scope (design/visual acceptance, the 7-layer fail-closed gate, the case-matrix generator, canvas-out).
- Update `SKILL-REGISTER.md` Task-3 rows, `references/stage-3-feature-verifier.md`, and the brief.
