# G1 — Phase 3b: the computed checker (render, then read resolved styles)

**Category:** G · Enforcement · **Size:** L · **Where:** plugin (`ottomate`, `main`) + server Chromium demo
**Follows:** Phase 3a (source checker). The computed rules need a real browser — one is available.

The source checker (3a) reads variant TEXT. The computed rules need the *rendered* result — resolved
colours (contrast), resolved values across components (coherence), and whether panels actually LOOK
different (the divergence backstop that would have stopped round 1's false-reject). This builds that.

---

## ✅ Outcome (2026-07-23) — 3 computed checks built + demonstrated in real Chromium

`computed-checks.js` (one script, both hosts) + math unit tests 6/6 + an **automated browser test**
(`computed-checks.browser.test.mjs`) 4/4 on the server's Chromium + a real-output demo.
- **`floor-contrast`** (classified computed): resolved text vs effective bg → WCAG ratio; block P2/P3,
  advise P1; image/gradient backgrounds → *review*, never silently passed.
- **`adv-cross-component-coherence`**: same `data-role` → same resolved value across components (the
  mix-coherence check the per-item picks depend on).
- **`computed-axis-divergence`** (NEW rule): holistic resolved-style signature per panel; pairwise
  Jaccard distance ≥ floor. **The proper stylistic-bundle backstop** — on real round-2 output it scored
  A/B 0.39, A/C 0.41, B/C 0.57 (all differ), where the source structural check reported ~2% for all
  (round-1's false reject). A near-identical pair scored 0.06 → flagged.
- **Real catch + real pass, per discipline:** the browser test's CATCH fixture trips all three
  (contrast 1.28/2.71, coherence ΔE 173.9, divergence 0.06→too-similar); the PASS fixture and round-2
  clear them.

**Two bugs the demo caught that unit tests could not** (documented ≠ demonstrated, again): the
divergence sampler first picked the undifferentiated panel wrapper (distance 0 for different cards →
fixed to a holistic per-panel signature), and the contrast scan treated `<style>` CSS as page text
(→ skip style/script/template). Both found by running it in Chromium.

**Honest state:** 3 of ~15 computed rules built; the rest stub against the same architecture. The
computed pass is a **post-render step** (server runner / claude-in-chrome), **not auto-inlined** in the
harness's emit flow yet. Enforced count 26 → 29 of 90 (+1 new rule).

---

## Verified live state (read 2026-07-23)
```
server         @playwright + chromium-1217/1223 + headless_shell INSTALLED; tests/e2e/feature-verify/
               exists (the Task-3 Playwright host). So computed checks have a real headless Chromium.
computed rules 15 tagged method:"computed" in design-rules.json, all pending. floor-contrast is
               currently UNMETHODDED — classify it computed here (it needs resolved colours).
constraint     the design-check source checker (3a) is pure Node, pre-emit. Computed = a SEPARATE
               POST-RENDER pass (after the harness emits + the page paints).
```

## Architecture
- **`scripts/design-check/computed-checks.js`** — ONE plain script (IIFE attaching
  `globalThis.OTTO_COMPUTED = { computedChecks, contrastRatio, relLuminance, deltaE, styleVector,
  vecDistance }`), so the SAME source runs in **both** hosts: Node `require` (unit-test the pure math)
  and a browser via `addScriptTag`/inject (`computedChecks(root, opts)` reads the DOM). No duplication.
- **Node unit tests** (`computed-checks.test.mjs`): the pure math against known values (WCAG contrast
  pairs, ΔE, vector distance, on-ramp). The DOM logic is verified by **running it in real Chromium**
  (the demo) — documented ≠ demonstrated, so it is *demonstrated*, not unit-faked.
- **Host:** a small Playwright runner on the server loads a variant-set `out.html` into Chromium,
  `addScriptTag`s the checks, `page.evaluate`s `computedChecks`, prints findings. Same script is
  injectable via claude-in-chrome for interactive rounds.

## Checks built this pass (highest value; the rest stub against the same architecture)
1. **`computed-contrast`** (classify floor-contrast → computed). Per text element: resolved colour vs
   the effective (nearest opaque ancestor) background → WCAG ratio; flag < 4.5 (< 3 for large ≥24px/
   ≥18.66px-bold). Profile-gated: **advise P1, block P2/P3** (`resolveFloor`). Honest caveat: text over
   an image/gradient can't be resolved from computed styles alone → reported as "review", not passed.
2. **`adv-cross-component-coherence`** (the mix-coherence check the per-item picks depend on). Group
   rendered elements by a role key (a shared class / `data-role`), `getComputedStyle`, assert the same
   role resolves to the same value across components (ΔE ≤ 2 for colour; ±1px geometry).
3. **`computed-axis-divergence`** (NEW rule — the stylistic-bundle backstop). Across the N shadow-root
   panels, build a resolved-style vector (radius, shadow, bg, colour, padding, transform, …) per panel
   and assert pairwise distance ≥ a floor. **This is what the source structural check couldn't do** —
   it sees radius 0 vs 14. Complements, not replaces, the gate's source check.
4. **Scale on-ramp batch** (`adv-spacing-scale` / `adv-type-scale` / `adv-radius-scale`): resolved
   values fall on the declared ramp within tolerance. One helper, three rules.

**Deliberately deferred (stubbed, still pending):** the shadow/glass/type-optical/tabular rules
(`adv-shadow-*`, `adv-glass-legibility`, `adv-dark-mode-type-optical`, `adv-tabular-numerals`,
`adv-leading-by-role`, `adv-radius-nesting`, `adv-numeric-column-alignment`) and
`feas-degradation-bottom-rung`. Architecture supports them; not built now.

## Wiring
- `stage-2-generation.md`: after step 5 (harness emits + renders), a **post-render computed pass** runs
  `computedChecks` on the published output; block/advise per profile (same fail-closed principle).
- The computed pass is where `adv-cross-component-coherence` finally runs — the safety net that makes a
  per-item MIX provably still one design.

## Procedure
1. `computed-checks.js` (pure math + `computedChecks`) + `computed-checks.test.mjs` (math, in Node).
2. A Playwright runner (`scripts/design-check/run-computed.mjs` or a `.spec` for the server harness).
3. **Demo on real Chromium:** scp round-2's `out.html` + the checks to the server, run headless, show
   the findings (contrast ratios, coherence, divergence distances) on a REAL rendered set.
4. Flip the built computed rules to `enforced` **only** after the demo proves them, naming BOTH the unit
   test (math) and the demo (DOM). Classify floor-contrast computed. Add `computed-axis-divergence`.
5. Update `SKILL-REGISTER.md` + this plan's outcome same commit; `git status` after.

## Acceptance
1. `computed-checks.test.mjs` green: contrast math matches known WCAG pairs (e.g. #000/#fff = 21:1,
   a known-fail pair < 4.5); ΔE and vector distance behave; on-ramp catches an off-ramp value.
2. **On real Chromium (round-2 output):** contrast ratios are computed per element; coherence groups by
   role; the divergence check reports the panels as DIFFERENT (distance ≥ floor) — proving it would NOT
   false-reject a stylistic bundle the way the source structural check did.
3. A deliberately low-contrast fixture is **flagged**; a deliberately identical-looking pair is caught
   by divergence. (Real catch + real pass, per the program's discipline.)
4. Register: the built computed rules → `enforced` naming test+demo; floor-contrast classified computed;
   the deferred computed rules honestly still `pending`.

## Risks
| Risk | Mitigation |
|---|---|
| Overclaiming computed enforcement | Flip to enforced only with math unit-tested AND fired in real Chromium; deferred rules stay pending |
| Effective-background resolution is approximate | Walk to the nearest opaque ancestor; text over image/gradient → "review", never a silent pass. Stated |
| Two rendering hosts drift | ONE `computed-checks.js`, run in both via `globalThis` — no duplicated logic |
| ΔE2000 is heavy | A simple, documented ΔE (CIE76/OKLab distance) is enough for a ≤2 tolerance gate; noted as approximate, not lab-grade |
| Playwright run touches the server | Read-only: renders a local `out.html`, no DB, no live services. scp in, run, done |
