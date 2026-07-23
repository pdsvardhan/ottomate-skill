# Design-intelligence reference — master index

*The knowledge base an AI UI-design tool reads before it designs anything. 22 standalone track reports across 8 groups, each a handbook-grade chapter with directly-applicable executive rules, options catalogues (licence + source + strict-CSP/offline verdict for everything recommended), failure modes with detection, pre-flight checklists, and honestly-flagged unverified claims.*

---

## How to use this set

- **Machine agent:** read the target track's **§3 Executive rules** first — they are written to be applied without reading the body. Drop into the body, options catalogue, or checklist only when you need the reasoning or the specifics.
- **Human owner:** each report stands alone and reads like an internal design-system handbook chapter. Start with the four priorities (B1, H1, C2, A1), then the group you're working in.
- **Boundaries are deliberate.** The set is MECE: every report states, up front, what it does *not* cover and which sibling track owns that. When a question spans two tracks, the boundary lines tell you who's authoritative. Cross-references use the track codes below.

## The constraints every track was written against

1. **General-purpose** — works for any project; concrete examples are illustrations, never the frame.
2. **Free & self-hostable only** — every recommended font/icon/component/library/asset is open-licensed (OFL / MIT / Apache-2.0 / ISC / BSD / CC0 / CC-BY) *and* downloadable for offline embedding, with the licence stated and sourced. Paid options appear at most as a one-line "commercial alternative," never a recommendation.
3. **Strict-CSP, single-file, offline** — the tool ships one self-contained HTML file into a sandbox with **no external requests and no `eval`/WASM-eval**. Everything must inline (text or `data:` URI). Every asset and technique carries an explicit CSP/offline verdict.
4. **Actionable & numeric** — decision rules ("if A and B, choose X; threshold is N"), not menus; numbers wherever numbers exist.
5. **Honest** — contested advice is marked contested; unverified claims and licences are flagged, not invented. See the consolidated register at the bottom.

> **Count note:** the brief's heading says "twenty tracks," but it specifies **22** (A1–H2; the §6 execution order lists all 22). All 22 are delivered.

---

## The map — 22 tracks, 8 groups

### GROUP A — Foundations (the invisible system)

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **A1 — Colour intelligence** | Colour as a system: perceptual spaces (OKLCH), tonal ramps, deriving palettes from content, colour budgets, hue-tinted neutrals, dark-surface behaviour, colour-blind-safe sets | Contrast *conformance* → A5 · gradients/mesh *as material* → A4 · sharing colour tokens across components → C2 |
| **A2 — Typography** | Classification & mood, choosing a face from a brief, pairing, modular scales, variable fonts, numerals, dark/light optical adjustments, multi-script, a catalogue of open-licensed faces by role, subsetting/embedding | Microcopy/wording → D1 · icon glyphs → D2 · font byte-budgets → E1 |
| **A3 — Space, layout & composition** | Spacing systems, modular vs fluid scales, grids (incl. bento/asymmetric), density modes, optical alignment, **large-display-first**, z-index tokens, whitespace as hierarchy | Motion → B1 · what goes *in* the layout (tables/charts) → C3 · sharing spacing tokens → C2 |
| **A4 — Shape, depth & material** | Radius systems & nested-radius maths, borders/hairlines, elevation & shadow physics (dark-mode glow), glassmorphism, gradients, noise/grain/dithering, animated borders as material, texture | Colour within a material → A1 · animating a material → B1 · contrast → A5 |
| **A5 — Accessibility & inclusive design** | The **conformance authority**: WCAG 2.2 SCs + thresholds, APCA (draft), focus visibility, target sizes, keyboard operability, SR semantics for composite widgets, reduced-motion/contrast/forced-colors, RTL/i18n | Generating accessible palettes → A1 · motion vocabulary → B1 · state design → B2 |

### GROUP B — Behaviour

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **B1 — Motion & animation systems** | Duration ladders, easing & spring vocabulary, choreography (stagger/FLIP/View Transitions), micro-interactions, animated marks (SVG/CSS/Lottie/Rive), scroll & pointer effects, performance budgets, motion-behind-text rule, reduced-motion | Which state triggers motion → B2 · motion's material → A4 · a11y conformance → A5 |
| **B2 — Interaction states & affordance** | The complete **state matrix** (rest→skeleton) and what each must change (never colour alone), affordance, input-modality differences, feedback timing (spinner vs skeleton), destructive-action patterns | Animation of a transition → B1 · copy in states → D1 · conformance → A5 |
| **B3 — Navigation & flow** | IA patterns, nav-model selection (top-nav/sidebar/tabs/command-palette/breadcrumb), search-as-nav, wayfinding, onboarding, progressive disclosure, wizards, **modality decision rule**, deep-linking/URL-state | Visual design of a nav component → C1 · copy → D1 · states → B2 |

### GROUP C — Structure

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **C1 — Component anatomy & taxonomy** | Canonical inventory (primitives→composites→surfaces) with anatomy/slots, required variants & states, misuse; variant-vs-prop modelling; composition/slotting; documenting for faithful rebuild | Cross-component consistency → C2 · data-bearing components → C3 · state detail → B2 |
| **C2 — Design systems, tokens & coherence** | Token architecture (primitive→semantic→component), theming/multi-brand, guaranteeing N components read as one system, coherence audits & drift detection, fidelity verification, versioning | What a single component contains → C1 · whether it's *pretty* → F-group |
| **C3 — Information design & data display** | Tables (density/alignment/sticky/sorting), numerals in data, chart-type selection & encoding, dashboards/stat tiles, dense feeds, data empty/loading/error, pagination patterns, faceting | Generic layout → A3 · chart colour theory → A1 · numeral type detail → A2 |

### GROUP D — Content & meaning

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **D1 — UX writing, voice & microcopy** | Voice/tone systems, recognisable naming, action labels, error messages (cause+remedy), empty states, confirmations, toasts, onboarding, terminology/glossaries, truncation, localisation-ready strings | Where copy sits → A3/C1 · screen-reader/alt text → A5 · toast motion → B1 |
| **D2 — Iconography, imagery & brand marks** | Icon systems (grid/stroke/optical/filled-vs-outline), adopting a set consistently, licence-clean brand marks + trademark caveats, illustration, imagery handling, **deterministic placeholders**, avatars, favicons, SVG optimisation | Animating a mark → B1 · colour of a mark → A1 · *sourcing* sets → H1 |

### GROUP E — Quality & delivery

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **E1 — Performance, delivery & CSS architecture** | Single-file asset budgets, font subsetting/base64 for offline, image formats (AVIF/WebP), Core Web Vitals thresholds, CSS at scale (@layer/custom-props/container-queries/@property/nesting), keeping specificity flat | Aesthetic worth of an effect → F1 · animation compositor detail → B1 · cross-engine support → E2 |
| **E2 — Cross-platform & environment reality** | Modern-CSS support/fallback table, engine/OS rendering diffs, colour management/P3, HiDPI, dark-mode plumbing (no-flash), print, and the **strict-CSP/offline "what breaks" list + workarounds** | Accessibility prefs → A5 · perf budgets → E1 · material techniques → A4 · technique-choice matrix → H2 |

### GROUP F — Aesthetic direction

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **F1 — Style movements & visual reference** | Catalogue of ~20 named directions (swiss/editorial/brutalism/minimalism/glassmorphism/neumorphism/retro/cyber/luxury/playful…): type/colour/shape/motion specs, what each signals, when it fits, how it fails, how to execute convincingly; adjective→direction mapping | Tokens implementing it → A1–A4 · escaping generic → F2 · generating options → G1 |
| **F2 — Distinctiveness & anti-generic** | Evidence-based catalogue of "AI slop" clichés (colour/type/layout/effects/icons/copy), why models converge, the escape moves (commitment, one bold place, content-derived tokens), an objective "templated?" rubric | Committing to a named direction → F1 · option-generation method → G1 |

### GROUP G — Process (the tool's own craft)

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **G1 — Variant generation & convergence** | Isolating the decision axis & guaranteeing difference on it, option counts, the fidelity ladder, mixing, when to stop, protecting locked items, sequencing decisions | Judging quality → G2 · capturing the decision → G3 · anti-generic → F2 |
| **G2 — Design critique, heuristics & evaluation** | Evaluation frameworks (Nielsen heuristics, cognitive walkthrough, first-click, 5-second test), an agent-runnable **self-critique rubric** (hierarchy/consistency/legibility/craft) with hard gates, review blind spots | Accessibility conformance → A5 · "looks templated" → F2 · capturing decisions → G3 |
| **G3 — Eliciting taste & capturing decisions** | Selection-over-description, structured choice, non-leading framing, choice fatigue, a durable **decision-record schema** that survives a session boundary, contradictory feedback → intensity variants, explicit locking, restating understanding | Generating the options → G1 · judging quality → G2 |

### GROUP H — Supply

| Track | Owns (scope) | Key boundary → |
|---|---|---|
| **H1 — Free asset sourcing & ingestion** | The supply chain: open-licensed sources per category (components/icons/marks/fonts/motion/illustration/texture/shaders/sound) with licence + self-host path; the **licence-tier compliance model**; ingestion/normalisation/de-frameworking/dedup/grading/provenance | Deciding *which* asset suits a design → the foundation tracks · icon consistency → D2 |
| **H2 — Implementation feasibility matrix** | Technique-choice matrix (CSS/SVG/Canvas/WebGL/WAAPI/JS-lib × cost/support/perf/a11y/single-file-no-network-no-eval survival/licence), effect→technique lookup, hand-inlining framework components to vanilla, graceful degradation | Raw perf measurement → E1 · browser-support/CSP detail → E2 · sourcing → H1 |

---

## Reading / execution order (leverage-first)

1. **Priorities:** B1 · H1 · C2 · A1
2. **Core foundations:** A2 · A4 · F2
3. **Behaviour & selection:** B2 · G1 · D2
4. **Structure:** A3 · C1 · C3
5. **Quality gates:** A5 · E1 · E2
6. **Remainder:** D1 · F1 · G2 · G3 · B3 · H2

---

## Consolidated "verify at build time" register

These are the honestly-flagged items that recurred across reports. Re-confirm each against a live source when it matters; none undermines the delivered guidance, but each is a known soft spot.

**The single most important one:**
- **The exact CSP the target sandbox enforces was asserted from spec, not observed** (E2, H2, H1). Specifically: whether `data:` is allow-listed per directive (`img-src data:`, `font-src data:` — note `'self'` does *not* cover `data:`), whether CSP arrives via header or `<meta>`, and whether inline `<style>`/`<script>` rely on `unsafe-inline` vs hashes/nonces, and whether `worker-src` permits `blob:`. **Confirm against the real box before trusting any inlining pattern.**

**Volatile browser-support facts (mid-2026 snapshots — re-check caniuse/Baseline):**
- Scroll-driven animations (`animation-timeline`) and `text-wrap: pretty` — **no Firefox** as of mid-2026 (B1, E2). Always `@supports`-gate + fallback.
- `:has()` (Widely ~2026-06), `field-sizing` (Newly ~2026-06), anchor positioning (Newly 2026, sub-features diverging), container **style** queries (Baseline Newly ~2026-05), View Transitions, `corner-shape`/squircles, `prefers-reduced-transparency` — all guard-required, not safe (E2, A3, A4).

**Licence / source items to re-confirm:**
- **Remix Icon licence — cross-report conflict:** H1 read it as a custom "Remix Icon License v1.0"; D2 flagged Apache-2.0-vs-custom ambiguity. **Verify at the RemixIcon repo `License` file before vendoring.**
- APCA commercial-embedding licence unconfirmed (A5); Hero Patterns CC-BY, Mixkit/Haikei/Pattern Monster output terms, Rive community-file reuse (H1) — all flagged unverified.
- `@squoosh/cli` maintenance status — jSquash is the maintained fork (E1).

**Values sourced from secondary/JS-gated pages (re-pull from primary at build):**
- Material **state-layer opacities** (B2, C1) — canonical M3 page is JS-rendered; values substituted from MDC source.
- Material **dark-elevation overlay percentages** (A4) — MD2-canonical; re-verify.
- M3 **"emphasized" easing** is a two-part curve, not a single `cubic-bezier` (B1) — token exports approximate it.
- OKLCH hex values are computed approximations — recompute & gamut-clamp at ship (A1); note OKLCH L ≠ WCAG luminance (A1/A5).
- Shopify **Polaris React archived Jan 2026** (successor: Polaris Web Components) (C1).

**Claims that are reasoned/synthesis, not controlled studies (marked inline as such):**
- Only *design homogenisation itself* is peer-reviewed (Goree et al., CHI 2021); the specific 2026 cliché catalogue and escape moves are expert/community consensus — **re-baseline quarterly** (F2).
- "5–7 series" chart ceiling (C3), G1's variant-difference thresholds and G3's "3 default / 5 ceiling" choice counts (`[REASONED]`), and the Doherty 400 ms figure (B1) are heuristics.
- "Decision fatigue"/ego-depletion is scientifically contested (failed multi-lab replication) — G3 uses it cautiously.

---

## Provenance

Research was produced by delegated researchers, each working to a fixed report structure with this index's constraints and the B1 report as the quality exemplar, then reviewed on delivery. Model assignment: **B1, A5, E1, E2** on the higher-capability tier (accuracy-critical / precise-number tracks); the remaining tracks on a strong general tier. All numeric, licence, and support claims were drawn from real web sources cited inline in each report; unverifiable items are flagged rather than asserted.

## File manifest

`B1-motion-and-animation-systems.md` · `H1-free-asset-sourcing-and-ingestion.md` · `C2-design-systems-tokens-and-coherence.md` · `A1-colour-intelligence.md` · `A2-typography.md` · `A4-shape-depth-and-material.md` · `F2-distinctiveness-and-anti-generic.md` · `B2-interaction-states-and-affordance.md` · `G1-variant-generation-and-convergence.md` · `D2-iconography-imagery-and-brand-marks.md` · `A3-space-layout-and-composition.md` · `C1-component-anatomy-and-taxonomy.md` · `C3-information-design-and-data-display.md` · `A5-accessibility-and-inclusive-design.md` · `E1-performance-delivery-and-css-architecture.md` · `E2-cross-platform-and-environment-reality.md` · `D1-ux-writing-voice-and-microcopy.md` · `F1-style-movements-and-visual-reference.md` · `G2-design-critique-heuristics-and-evaluation.md` · `G3-eliciting-taste-and-capturing-decisions.md` · `B3-navigation-and-flow.md` · `H2-implementation-feasibility-matrix.md`
