# Task 3 · P3-A — AI-visual-judge (advisory, fail-closed) · plan (2026-07-28, Track B)

The second Phase-3 build, after [P3-C](2026-07-28-task3-P3C-gate-wiring-plan.md). Off the
[Phase-3 plan](2026-07-28-task3-PHASE3-plan.md) §P3-A + the [implementation plan](2026-07-28-task3-IMPLEMENTATION-PLAN.md)
L7. **The judge can flag/warn, it can never bless.** Grounded in the research: VLMs are ~58% at geometry
and below-random at design quality (T1) → the model is **advisory-only**; the deterministic layers gate.

## The invariants this unit must obey (from the six)
- **Advisory-only** — the judge emits `clean | warn | flag`, **never** a gating `pass`/APPROVE. A judge
  finding can move a case to `warn` (advisory), never to `fail` on its own and never to a clean pass.
- **Claim-blind** — the judge sees the requirement + the running app's screenshots/ARIA + the
  deterministic-layer facts. It **never** sees the coder's diff or "I fixed X."
- **Grounded + cross-checked** — every finding must cite a region (selector / bounding box / screenshot
  crop). **Every spatial/geometry claim is cross-checked against L2/L4; a claim the deterministic layer
  contradicts is DISCARDED** (this is what neutralises VLM spatial-blindness).
- **Tier-gated** — the judge is skipped below **T2**; a **quick grounded glance at T2**, a **full
  guardrailed pass at T3** (`layersForTier(tier).judge` = `none|glance|full`, already built in P3-C1).

## Deliverables (each: a must-fail + must-pass; pure logic unit-tested, the dispatch demonstrated on MoB)

### 1. Rubric — `data/feature-verify-judge-rubric.md`
Off Task-2's `data/design-rubric.md` shape (forced grounding, delegate-numeric-to-the-hard-gate, the
honesty rules), but scoped to the **feature verifier's** question ("does this built/fixed feature work +
look right for a user?"), not aesthetic scoring. Four advisory dimensions, each a `clean|warn|flag` with a
**cited region**:
1. **Intentional / on-spec / balanced** — the rendered result looks deliberate and matches the
   *requirement* (never the diff); no obviously unfinished or placeholder look.
2. **Empty / first-run / error state works** — the non-happy states render intentionally, not as a blank
   or a raw error.
3. **Nothing visibly broken** — no obvious overlap / clipping / off-canvas / garbled content — **but every
   such call is a candidate claim that L4 geometry adjudicates; the judge flags, the DOM decides.**
4. **Symptom-relevance** (owner-reported fixes only) — the change plausibly addresses the *reported*
   symptom (pairs with the P2-B reproduce-symptom two-phase, which owns the deterministic RED→GREEN).
Bands: **clean** (no findings) · **advisory-warn** (minor findings, recorded) · **flag-for-human**
(something looks wrong OR the sampled passes disagreed). **No band gates.** Honesty rules travel with the
verdict: a same-agent glance is labelled a *vision proxy*, never "user-tested"; any geometry number is
deferred to L4, never stated by the judge.

### 2. Prompt — `prompts/feature-verifier-judge-prompt.md`
The dispatch prompt for a **fresh Claude judge pass** (a sub-agent, blind to the diff). Inputs = the
requirement text + the case's screenshots (+ ARIA snapshot) + the **deterministic-layer facts already
computed** (L1 errors, L4 overflow/clip/contrast observations) + the rubric. Forces: cite a region per
finding; **do not compute geometry — defer every spatial call to the DOM layer** (state the impression,
let the cross-check keep or drop it); output a **structured JSON** verdict (per-dimension
`{verdict, region, rationale}`), never prose-only. For **T3**: judge the screenshots in a
**randomised order**, run **2–3 samples**, and if they disagree on a finding, that finding is
**no-confidence → human**. A periodic CALM self-audit note is included for the unattended path.

### 3. Harness — `harness/ai-judge.mjs` (pure orchestration; the Claude pass is dispatched by the skill)
- `judgeGate(tier)` → `'none'|'glance'|'full'` (thin re-export of `layersForTier(tier).judge`; the tier
  gate lives in one place).
- `crossCheckSpatialClaims(findings, deterministicFacts)` → for each finding tagged spatial, keep it only
  if the deterministic facts do **not** contradict it; a contradicted claim is **discarded** with a
  recorded reason (e.g. judge says "cards overlap" but L4 reports no overflow/collision → dropped). **The
  load-bearing pure function.**
- `reconcileSamples(samples)` → merge 2–3 T3 passes; a finding the samples disagree on → `no-confidence`
  (→ human), agreed findings kept.
- `judgeVerdict(findings)` → the advisory cell recorded on the case as `judge_verdict`; returns
  `{ band: 'clean'|'warn'|'flag', findings, gating: false }`. **Asserts `gating` is always false and there
  is no code path to `pass`.**
- **must-pass:** a good T3 screen with no surviving findings → `band:'clean'`, `gating:false`.
- **must-fail:** (a) a hallucinated "overlap" finding that L4 contradicts is **discarded** by
  `crossCheckSpatialClaims`; (b) `judgeVerdict` can **never** return a gating pass — asserted.

### 4. Dispatch + wiring
The runner already emits screenshots (trace/video/screenshot always on). The skill spawns the fresh
Claude judge pass reading them + the rubric (blind to the diff), then `crossCheckSpatialClaims` against
the case's L4 facts, `reconcileSamples` (T3), and records `judge_verdict` on the `CaseResult` (the field
already exists in `report.ts`). The case outcome is unchanged unless a *surviving* flag downgrades a clean
case to `warn` (advisory) — a red stays red, a green with a judge flag becomes `warn`, **never** the
reverse. Method-doc wiring: a "§5 Judge (advisory)" update in `stage-3-feature-verifier.md` pointing at
the rubric/prompt/harness and the tier gate.

### 5. Live demonstration on Maps of Bharat (T3-style)
Spawn a real sub-agent judge pass on a **real MoB screenshot** (captured by the runner) + the rubric,
blind to any diff; run its findings through the cross-check against the real L4 facts; record the advisory
verdict. Then a **negative control**: inject a fabricated spatial finding ("legend overlaps the map") and
show the cross-check **discards** it because L4 reports no overflow/collision. Proves: the judge runs,
grounds, cannot gate, and its spatial hallucinations are neutralised.

## Sequencing & parallel-safety
Rubric + prompt + `ai-judge.mjs` + tests → method-doc §5 update → live MoB demo → register row. Same
rules as P3-C: pure tests on node 20/22, commit small, `git pull --rebase` before every push, stage
explicitly (Track A leaves untracked files), edit only the feature-verifier rows in `SKILL-REGISTER.md`,
`/tmp/fv` staging. Then **P3-D** (trajectory monitor) closes Phase 3.
