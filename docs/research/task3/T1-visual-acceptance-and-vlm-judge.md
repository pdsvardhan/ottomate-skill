# T1 — Visual / design acceptance automation + VLM-as-judge reliability

> **Task-3 research track, distilled 2026-07-28 (Track B).** Source: deep web sweep (29 sources, cited
> below). This is durable reference knowledge for the feature verifier's **visual/design layer** — the
> "does it look right / match the design" half of the commit-time truth gate. Companion tracks: T2
> (oracle / case-gen), T3 (acceptance-gate architecture).

## The one-line philosophy
**Math and the DOM gate; Claude only advises — it can *fail* a screen, never *bless* one — and every one
of its spatial claims must survive a deterministic cross-check.** That is what makes the visual layer both
anti-gaslight and un-gaslightable.

## Three findings that shape everything
1. **Regression tooling (pixel/perceptual diff) cannot judge *initial* quality.** Every OSS tool answers
   *"did it change from a human-approved baseline?"* — useless on a freshly built feature that has no
   baseline. Biggest gap for an AI-app-factory.
2. **VLMs are measurably blind at precise geometry** — overlap, alignment, "cut off by 3px." SOTA models
   score **~58%** on trivial "do these two shapes overlap?" tasks (VLMs Are Blind). ⇒ geometry must be
   **deterministic**, never model-judged.
3. **VLMs are weak and biased at holistic design judgment** — *below the 50% random baseline* at
   predicting real A/B design winners (WiserUI-Bench), and carry the full LLM-judge bias load (position,
   verbosity, self-preference, sycophancy). ⇒ the model is **advisory**, never a hard gate.

---

## §0 — DECISIONS FOR OUR VERIFIER (the actionable distillation)

**The visual layer is two-tier and fail-closed:**

- **Tier A — deterministic HARD-GATE** (no baseline, no model, exactly reproducible). Build first; it
  covers most of the owner's *real* logged complaints ("empty space," "cut off at proj…," "tags not
  visible," "not responsive," "low contrast"). Run a **Playwright DOM+geometry probe** at ~4 viewports
  (360 / 768 / 1024 / 1440), collecting per-element `getBoundingClientRect` + `getComputedStyle` + one
  screenshot per breakpoint, asserting:
  1. **No horizontal overflow** (`scrollWidth ≤ clientWidth`; no element right-edge past viewport) → "not responsive" (WCAG F104 reflow).
  2. **No clipped/truncated text** (`text-overflow:ellipsis` **and** `scrollWidth>clientWidth`; or content > box under `overflow:hidden`) → "cut off."
  3. **No unexpected element overlap** (pairwise bounding-box intersection among elements that shouldn't touch) → "tags not visible / overlapping." *This is exactly the geometry VLMs fail at — doing it in JS is strictly better.*
  4. **No off-screen / zero-size / hidden** elements that should be visible → "tags not visible."
  5. **Contrast** via **axe-core** (whole pass → contrast + target-size + name-role-value + ~57%-by-volume of a11y, free, low-false-positive). For text over images/gradients, sample the *screenshot pixels* behind the text and compute the WCAG ratio directly (CSS color alone is insufficient there).
  6. **Touch-target ≥ 24×24 CSS px** (WCAG 2.5.8 AA; 24px-spacing exception).
  7. **Stress passes:** re-run 1–4 under **pseudolocalization** (`pseudo-l10n`, +35% text) and under **empty-data** and **very-long-data** fixtures → "empty space," overflow-under-real-data.
  8. **Determinism harness (non-negotiable):** `animations:'disabled'`, `caret:'hide'`, `page.clock.pauseAt(fixedDate)`, `await document.fonts.ready`, run inside the official `mcr.microsoft.com/playwright` Docker image. A flaky gate gets ignored.
  - Every check is **PASS / FAIL / UNMEASURED**, and **UNMEASURED ⇒ FAIL** at the gate.

- **Tier B — reference fidelity (deterministic), only when a target design image exists.** Compute
  **Design2Code-style metrics** vs the rendered screenshot: CLIP cosine (high-level) + block-match /
  text-Sørensen-Dice / color-CIEDE2000 / position-similarity (low-level, via Jonker-Volgenant element
  assignment). Below-threshold **hard-fails** and the sub-scores say *what's* wrong ("colors match,
  positions off"). Closest OSS analog to Applitools "Layout" match — and it's math, not model.

- **Tier C — pixel/perceptual regression, only where a baseline was genuinely human-approved.** Playwright
  `toHaveScreenshot` (pixelmatch; swap to **odiff** for large full-page shots), aggressive masking of
  dynamic regions, `maxDiffPixelRatio ≈ 0.01`; **SSIM** (jest-image-snapshot) for cross-env tolerance.
  **Do not** use on freshly built features — no baseline = catches nothing.

- **Tier D — Claude-as-judge (ADVISORY ONLY, tightly bounded).** For holistic things math can't score
  ("looks intentional/balanced/on-brand," "is the empty state doing its job"):
  - **Advisory only** — may raise a warning / flag-for-review; **never** produces a PASS. Tier A gates.
  - **Blind to the agent's claims** (anti-sycophancy). Feed only: screenshot(s) + rubric + optional reference image. Never "I fixed X, confirm."
  - **Reference-anchored + pairwise** where possible ("is B better than reference A on these rubric dimensions?"), not "rate 0–10."
  - **Forced grounding:** require it to cite the element/region (bbox or visible text) per finding, and **cross-check every spatial claim against the Tier-A DOM/geometry layer — discard claims the deterministic layer contradicts.**
  - **Structured rubric (G-Eval style)**, JSON out, order-randomized, sampled 2–3× → disagreement = *no-confidence → human*, not average-and-pass.
  - **Periodically CALM-audit** the judge (perturb a screenshot that should/shouldn't flip the verdict) to confirm it still bites and isn't rubber-stamping.

**Skip:** paid Visual-AI (Applitools/Percy/Chromatic — replicate Layout-mode from the DOM); trusting the
VLM for geometry; VLM absolute "design quality" scoring as a gate; pHash for UI regression; pixel-perfect
exact matching (guarantees flake).

---

## §1 — The three buckets + OSS tooling

**(a) Regression — "did pixels change from a known-good baseline?"** Needs a human-approved baseline;
catches drift, not initial correctness (the fundamental limit).
- Diff engines: **pixelmatch** (Mapbox; YIQ color metric + AA detection; ~28ms/1440×900; powers Playwright & jest-image-snapshot), **odiff** (native SIMD, ~6–7× faster, scales to ~18M px), **Resemble.js** (mismatch %, ignore-AA/colors; engine behind BackstopJS).
- Frameworks (OSS/self-hostable): **Playwright `toHaveScreenshot`** (built-in; `maxDiffPixels`/`maxDiffPixelRatio`/`threshold`/`mask`/`stylePath`/`animations`); **jest-image-snapshot** (pixelmatch **or SSIM**); **BackstopJS** (reference→test→approve + scrubber report); **reg-suit** (baseline in S3/GCS, PR-comment report); **Lost Pixel OSS core** (self-hostable "alt to Percy/Chromatic/Applitools").
- Flake sources → specific fixes (not "loosen threshold"): CSS animation → `animations:'disabled'` (covers CSS + WAAPI, **not** `setInterval`/JS motion); time → `page.clock.pauseAt`; fonts → `document.fonts.ready`; env → generate baselines *inside* the Playwright Docker image; dynamic regions → `mask` ("the single most important technique").

**(b) Perceptual / "Visual AI"** — Applitools **match levels** are the behaviors to approximate:
*Strict* (text/font/color/position, ignores AA), *Layout* (reverse-engineers page structure, maps
elements, checks *relative positions*, ignores content/color — the "dynamic content" mode), *Content /
Ignore-Colors / Dynamic-regex*. **OSS gap:** **SSIM** (luminance+contrast+structure, ~85ms) is the best
cheap perceptual metric but is a *whole-image scalar* — it can't extract elements or reason about relative
layout. **No OSS replicates Layout mode from the image.** But you control the app, so **reconstruct
Layout-mode from the DOM** (bounding boxes of named/role'd elements → relative-position invariants) —
deterministic and *more* reliable than image-based extraction.

**(c) Quality / on-spec — "is it good in the first place?"** No mature push-button industry standard;
it's human review + partial automation. Tractable reliable pieces: **Design2Code/Web2Code fidelity
metrics** (when a target design exists — CLIP + block-match + Sørensen-Dice text + CIEDE2000 color +
position), **design-system/token linting**, **axe-core as a quality proxy**, and an **advisory
MLLM-reviewer** (identifies usability issues at human-comparable severity but *also invents issues that
don't exist* → complement, never replace).

---

## §2 — VLM-as-judge for UI: reliability (with numbers)

**Benchmarks:**
- **WebDevJudge** (ICLR 2026 Oral) — best model **Claude-4-Sonnet 66.06%** pairwise agreement vs **human 84.82%** (~18pt gap); pointwise collapses to **~55.5%**. **Models anchor on code, not vision** (removing the screenshot dropped perf 0.9–1.7pt; removing the code dropped 4.9–8.7pt). Position bias persists (consistency 83–90%). Feasibility verification weak (90% recall / 72% precision).
- **WiserUI-Bench** — predicting real A/B winners: GPT-4o 30.1%, Claude-3.5-Sonnet 24.2%, o1 16.6% — **below 50% random**. Explaining *why* a design won is better (o1 64%).
- **MLLM as UI Judge** — "notable variability," low human agreement, aesthetic biases; not production-ready standalone.

**Failure modes:** spatial/geometric **blindness** (VLMs Are Blind: avg 58.1%, best 77.8% on trivial
overlap/crossing/circled-letter; humans ~100%) ⇒ cannot judge overlap/tight-alignment/"cut off";
left/right confusion (GPT-4V 46.7%); **hallucinated issues**; the full LLM-judge bias load — **position**,
**verbosity**, **self-preference**, **inconsistency** (same input, different scores), and **sycophancy**
(the direct anti-gaslight threat — never feed the agent's claim into the judge).

**Techniques that measurably help:** **pairwise > pointwise** (+8pt in WebDevJudge); **reference-anchored**
evaluation (cuts hallucination + score saturation); **forced grounding/citation** (quote the region);
**structured rubric + CoT (G-Eval)** — biggest value is making the task well-defined/auditable (raised
*human* inter-annotator agreement 65%→92%); **self-consistency** as an *uncertainty flag*, not a
confidence booster (majority vote hides confidence; still worse than inter-human); **calibration** on a
small labeled set (trust only in the regime where it matched humans); **position-bias control**
(order-swap, require order-invariance). **CALM** (Justice or Prejudice, ICLR 2025) = attack-and-detect
framework to audit your own judge.

---

## §3 — Deterministic mechanical checks (the highest-ROI bucket)

Computable from DOM + `getComputedStyle` + `getBoundingClientRect` + one screenshot; exactly reproducible;
ideal hard-gate material. Mapped to the owner's real complaints:
- **Horizontal overflow** (`documentElement.scrollWidth > clientWidth`; per-element right-edge past viewport) at each breakpoint → "not responsive" (WCAG F104).
- **Clipped/truncated text** (ellipsis-active, or content > box under hidden overflow) → "cut off at proj…".
- **Element collision** (pairwise bbox intersection) → "tags not visible / overlapping."
- **Off-screen / zero-size / hidden** expected-visible elements.
- **Touch-target < 24×24** (WCAG 2.5.8; 44×44 is the AAA/HIG stricter bar).
- **WCAG contrast** — pure math: `L = 0.2126R+0.7152G+0.0722B` (linearized sRGB); ratio `(L_hi+0.05)/(L_lo+0.05)`; AA 4.5:1 text / 3:1 large & UI. Over gradients/images, sample rendered pixels behind the text. Optionally **APCA Lc** (WCAG-3 draft, polarity/typography-aware). **axe-core** gives all this + more, free/self-hosted (~57%-by-volume automatable per Deque's 13k-page study, low false positives).
- **Empty-state / long-text / i18n stress** — **pseudolocalization** (expand strings ~35%, wrap in markers; `pseudo-l10n`) then re-run overflow/clip/collision; plus zero-data and huge-data fixtures.
- **Semantic layout diff without the paid tool** — extract DOM bboxes of named elements, assert relative-position invariants (nav above content, CTA in viewport, footer last).

---

## §4 — Anti-gaslight / fail-closed principles
1. **Two-tier verdicts:** deterministic HARD-GATE; model ADVISORY and can only FAIL, never PASS.
2. **UNMEASURED ⇒ FAIL.** Screenshot didn't render / fonts didn't load / page 500'd / axe couldn't run / judge errored-or-timed-out → fail-closed. Distinguish `PASS/FAIL/UNMEASURED` explicitly; the core invariant.
3. **Blind the judge to the agent's claims** (kills sycophancy).
4. **Model must cite/ground every finding** and be cross-checked against the DOM/geometry layer; contradicted claims are discarded.
5. **Pairwise / reference-anchored over absolute scoring.**
6. **Control the biases** (order-invariance, verbosity, no self-judging); **CALM-audit** the judge periodically.
7. **Self-consistency = uncertainty flag → human**, not average-and-pass.
8. **Calibrate + threshold on your own labeled good/bad set.**

---

## §5 — Sources
Regression/diff: Playwright PageAssertions (playwright.dev/docs/api/class-pageassertions) · flake-resistant guide (medium.com/@david-auerbach) · QASkills 2026 visual-regression, animations, clock guides (qaskills.sh) · pixelmatch (github.com/mapbox/pixelmatch) · odiff (github.com/dmtrKovalenko/odiff) + benchmark (vizzly.dev) · Resemble.js (rsmbl.github.io/Resemble.js) · jest-image-snapshot (github.com/americanexpress/jest-image-snapshot) · BackstopJS (npmjs.com/package/backstopjs) · reg-suit (github.com/Quramy/reg-suit) · Lost Pixel OSS (github.com/lost-pixel/lost-pixel) · SSIM (ece.uwaterloo.ca/~z70wang/research/ssim) · algorithms overview (wopee.io/blog/screenshot-comparison-algorithms-visual-testing).
Perceptual/Visual-AI: Applitools match levels (applitools.com/tutorials/concepts/best-practices/match-levels) · why pixel tools fail (applitools.com/blog/why-screenshot-image-comparison-tools-fail).
On-spec fidelity: Design2Code NAACL 2025 (aclanthology.org/2025.naacl-long.199.pdf) · Web2Code (arxiv.org/pdf/2406.20098).
VLM-as-judge benchmarks: WebDevJudge (arxiv.org/html/2510.18560v1) · WiserUI-Bench (arxiv.org/html/2505.05026v4) · MLLM as UI Judge (arxiv.org/pdf/2510.08783) · MLLM non-crash bug detection (arxiv.org/pdf/2407.19053) · usability improvements w/ MLLMs (arxiv.org/html/2604.25420).
VLM spatial reliability: VLMs Are Blind (arxiv.org/abs/2407.06581) · SPHERE (arxiv.org/html/2412.12693v2).
LLM-judge bias/technique: Justice or Prejudice/CALM (arxiv.org/abs/2410.02736) · Self-Preference Bias (arxiv.org/pdf/2410.21819) · Inconsistent & Biased Evaluators (arxiv.org/pdf/2405.01724) · LLMs-as-Judges survey (arxiv.org/html/2412.05579v2) · G-Eval guide (medium.com/@rkuma18) · Datadog grounding (datadoghq.com/blog/ai/llm-hallucination-detection) · Comet LLM-judge (comet.com/site/blog/llm-as-a-judge).
Mechanical checks: overflow detection (stevefenton.co.uk) · Playwright zero-overflow (dev.to/ohugonnot) · MDN text-overflow · WCAG contrast (allaccessible.org) · APCA (accessibilitychecker.org) · axe-core (github.com/dequelabs/axe-core) · Deque 57% study (deque.com/blog) · WCAG 2.5.8 target size (allaccessible.org) · pseudo-l10n (dev.to/anton_antonov).
