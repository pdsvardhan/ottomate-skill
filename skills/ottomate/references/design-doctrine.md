# Design doctrine — the durable rules every design round runs on

> **Load this at the START of every design round**, into the round's fresh sub-agent, together with the
> project's ledger `context` + `constraints` + `rejected[]`. It is deliberately short and must **stay**
> short — a doctrine that grows into a textbook recreates the long-session degradation it exists to
> prevent. Detail lives in `docs/research/` and is pulled **only** when a round opens that axis.
>
> **Owns:** the principles a generator must know. **Does not own:** the mechanical gate
> (`data/design-rules.json`, executed by code, never read by a model) or the score
> (`data/design-rubric.md`). Method/flow lives in `stage-2-design-method.md`.

## Provenance & honesty policy

Distilled 2026-07-23 from the owner's research corpus, kept verbatim in `docs/research/`. Every rule
cites its track + section. The corpus separates `[CITED]` (measured) from `[REASONED]` (synthesised
from established principle) — **that distinction is preserved here and must not be laundered.** A
`[REASONED]` rule is a good default, not a fact; if it fights reality in a real round, reality wins and
the rule gets amended with a note.

Tracks read so far: **G1** variant generation · **G2** critique & evaluation · **G3** taste elicitation ·
**F2** distinctiveness/anti-generic. Foundation tracks (A5 a11y, A1 colour, B1 motion, A3 layout,
H2 feasibility) arrive with the constraint checker. The remaining 13 are on-demand only.

---

## 1. Generation — how options are made (G1)

1. **Diverge in parallel, never in series.** Build a decision's alternatives side by side and take
   feedback on the *set*; do not refine one design and ask "better?". Parallel beat serial on ad CTR
   (445 vs 398/M), expert rating (24.4 vs 21.7/50) and designer self-efficacy (+2.5 vs +0.4) at equal
   time and feedback. `[CITED — G1 §3.1, Dow et al. 2010 TOCHI]`
2. **One axis per set.** A variant set isolates **exactly one** decision axis and holds every other
   variable constant. Two things moving at once makes the pick uninterpretable and the resulting lock a
   lie. `[G1 §3.2, §4.3]`
3. **Never show a set you have not proven differs.** Two diffs plus a sort, run *before* display:
   **axis diff** (the named axis parameter provably differs across every pair) · **control diff** (every
   non-axis variable is token-identical) · **blind-sort** (each variant's level on the axis is stateable
   without ambiguity — "this is the compact one"). Any failure = regenerate, do not present.
   `[G1 §3.3, §4.3 — the direct fix for the owner's observed "variants felt identical"]`
4. **Count: 3 by default.** `2` = genuinely binary axis or a late confirm · **`3` = default** (two poles
   + a middle reveals the gradient) · `4–5` = only wide/early/foundational axes at low fidelity ·
   `6+` = never. **Count falls as fidelity rises** (5 → 3 → 2). If you cannot make N genuinely
   different-on-axis, **lower N** — three real differences beat five with two duplicates.
   `[G1 §3.4/§4.4 + G3 §3.2 agree; Hick–Hyman grounds the shape, the exact numbers are [REASONED]]`
5. **Diverge low, converge high.** Six rungs — **direction → mechanic → component → cluster → page →
   micro**. Explore cheaply where discarding is cheap; commit expensively to few. Each rung's winner
   becomes the next rung's **frozen constant**. `[G1 §3.5/§4.5 — [REASONED] synthesis of Buxton's
   design funnel + Double Diamond]`
6. **Sequence by blast radius; parents before children.** Default order: direction → layout/structure →
   density → type → colour/material → component pattern → component styling → micro-interaction/motion →
   copy. **Never lock an axis before every axis it depends on is locked.** Locking a child first is the
   structural cause of "an early choice invalidated a locked later one". `[G1 §3.6/§4.6 — [REASONED];
   the *rule* is invariant, the *specific order* is a sensible default a brand-led product may reorder]`
7. **Functionally identical, stylistically distinct.** Hold content and function constant across the set
   so the pick judges the axis, not the data. `[CITED — G1 §3.7, Tohidi & Buxton 2006 CHI]`
8. **Never show one option.** Shown a single design people give inflated ratings and **never reject it**
   (0/12); shown alternatives they rate honestly and do reject (3/12). One option is not a choice, it
   manufactures false consensus. `[CITED — G1 §3.8, Tohidi & Buxton 2006]`
9. **Mix only across orthogonal axes.** Merging the best of several beat picking the single best
   (**70% vs 56%** usability gain). But two levels of the *same* axis cannot blend — reject that and
   offer **a third point between them** instead. A mix is a **new candidate**: verify coherence and
   re-show it once before locking. `[CITED merge result (Nielsen/Faber) + [REASONED] extension to
   automated axis-mixing — G1 §3.9/§4.7]`
10. **Don't reveal a polished hero early.** Design fixation anchors people to a shown example's form
    *and its flaws* — in professionals as much as students. Keep early rungs rough.
    `[CITED — G1 §3.14, Jansson & Smith 1991]`

## 2. Elicitation & the record (G3)

11. **Selection beats description — always render, never ask them to describe.** Stated liking explains
    at best a quarter to a third of the variance in what actually works (r = 0.44 / 0.53). Reserve free
    text for the residual that genuinely cannot be shown: brand name, forbidden colours, legal
    constraints. `[CITED — G3 §3.1, Nielsen & Levy 1994 via NN/g]`
12. **Neutral labels only.** A / B / C or plain numbers — never "the modern one" vs "the classic one".
    Value-laden wording on an identical underlying question produced a **37-point swing** in agreement.
    `[CITED — G3 §3.4, YouGov]`
13. **Never pre-highlight a "recommended" option in a taste choice.** A disclosed-as-arbitrary anchor
    still moved estimates ~25% → ~45%; a highlighted default works the same way.
    `[CITED — G3 §3.5, Tversky & Kahneman 1974]`
    **Note:** this is the one place the skill's usual "recommend first + label (Recommended)" house style
    is **suspended** — it applies to *taste* choices only, not to engineering or process questions.
14. **Randomise slot order on every presentation.** Items shown first are evaluated more favourably
    independent of content. `[CITED primacy — G3 §3.6.]` G1's additional *centre*-bias claim is
    **[REASONED, unverified]** and G3 declines to corroborate it — randomising handles both anyway.
15. **Record the concrete value, never the description.** `radius.md = 8px (--radius-md)`, not "the
    rounder one". Descriptions decay across a session boundary; a token reference replays with zero
    interpretation loss. `[G3 §3.10, ADR discipline]`
16. **Record rejections with the same rigour as picks**, each with a one-line why tied to an
    **observable reaction** ("picked B over A unprompted"), never an inferred trait ("prefers
    minimalism"). In the choice-blindness paradigm people confidently justified choices they had not
    made. `[CITED — G3 §3.11, Johansson/Hall/Sikström]`
17. **Lock is binary, explicit and earned.** Provisional on first pick; `locked` only on an explicit
    confirm **or** after surviving one full re-exposure unchanged. `[G3 §3.12]`
18. **Unlocking is harder than locking.** Protecting committed work is the default-friction action;
    reopening it deserves a confirm step. `[G3 §3.13]`
19. **Restate the concrete interpretation and get a confirm before acting** — and again before
    propagating it beyond the exact surface it was tested on. "You liked rounded corners on the button,
    so I rounded everything" is a **separate** decision, not a free inference. `[G3 §3.14]`
20. **Contradictions are an intensity axis, not a dispute.** "More minimal" + "more expressive" about the
    same thing are two points on one un-named axis. Name the axis, generate 3 points, let a new
    *selection* resolve it. `[G3 §3.9]`
21. **Session recap, not re-derivation.** A resumed session reads the ledger and surfaces "here's what's
    locked" — it never silently resumes and never re-asks an answered question. Insert a recap roughly
    every **5–8** consecutive decisions. `[G3 §3.8 — soft budget; the decision-fatigue evidence is
    contested (ego depletion failed a 23-lab replication), so treat as directional, never a hard gate]`

## 3. Distinctiveness (F2)

22. **Slop is the absence of a decision, not the presence of a bad one.** With nothing chosen, a model
    falls to the statistical centre of its training data. The fix is procedural: **make and record one
    aesthetic commitment before styling anything**, then hold it everywhere. `[F2 §3.1]`
    **Corollary (resolves the owner-override rule):** an explicitly requested "slop" tell — "make it
    glassy" — *is* a decision, so it is exempt from the templated tax and recorded in the ledger as a
    deliberate choice. Their words win; execute it well.
23. **Homogenisation is real and predates AI.** 227,000+ screenshots / ~10,000 sites (2003–2019): peak
    diversity ~2008–2010, then sharp convergence (~44% drop in layout-similarity distance 2010–2019)
    driven by Bootstrap/WordPress/SEO. Models trained on that corpus re-emit the mean.
    `[CITED — F2 §3.2, Goree et al. CHI 2021 — the strongest hard evidence in the track]`
24. **The accent hue is the highest-signal tell — derive it, don't default it.** Stock Tailwind indigo
    `#6366F1` became "the model's idea of a button". Derive the accent from content, or at minimum
    rotate out of the **240–280°** hue band. `[F2 §3.4]` — **this is the direct external validation of
    theme-from-content**: our poster-derived accent scores 0 on both accent rows of the templated tax.
25. **Commit hard in ONE place; keep the rest quiet.** The escape is not "be weird everywhere" (that
    breaks usability) — it is one bold move surrounded by disciplined, conventional structure.
    Distinctiveness is **concentrated, not smeared**. `[F2 §3.5 — taste-flagged, widely echoed]`
    This is the same shape as our existing **colour-budget rule**, independently arrived at.
26. **Cap the palette and force a dominant** — 60/30/10, extend via tints/shades, semantic colours kept
    separate, and no pure `#fff`/`#000` grounds (tint the neutral). `[F2 §3.6]`
27. **Separate surfaces with space → tone (3–5% L shift) → elevation. Border last.** The flat 1px grey
    border on every card and the coloured 3–4px left strip are named among the most reliable AI tells.
    `[F2 §3.9]`
28. **Break the equal-card grid.** "Exactly three cards in a row" and the default bento are reflexes;
    deliberate asymmetry (60/40, one 2× feature, off-axis anchor) is the cheapest de-genericiser that
    costs no usability **provided reading order stays linear**. `[F2 §3.8]`
29. **Reference a real material, not "modern".** Riso grain, letterpress deboss, matte enamel, blueprint
    linework, newsprint, ceramic — a *named* material forces non-default shadows, textures and edges.
    `[F2 §3.11]`
30. **Beware the escape treadmill.** Today's escape is tomorrow's tell: Space Grotesk, the single
    serif-italic accent word, bento grids and Geist were 2023 escapes and are 2026 tells. **Never
    hard-code a permanent "non-generic" allowlist** — the cliché catalogue in `data/design-rules.json`
    carries a `baselined` date and needs re-checking roughly quarterly. `[F2 §3.14]`
31. **Distinctiveness ≠ novelty.** The target is *specific to this content*, not maximally strange —
    unearned strangeness is just a different generic. **The test is fit, not distance.** `[F2 §3.15]`
32. **Every escape move must survive accessibility.** Distinctiveness that fails contrast, removes focus
    states, or ships undesigned empty/error states isn't distinctive, it's broken. `[F2 §3.12]`

## 4. Quality (G2)

33. **Evaluate the rendered pixels, not the markup.** Every "look at the screen" check means render the
    artifact and read the image; reasoning from source re-triggers the curse of knowledge the check
    exists to route around. `[G2 §4.6]`
34. **Score before showing** — 4 dimensions × 25: Hierarchy · Consistency · Legibility · Craft. Bands:
    90–100 Ship · 75–89 Ship-with-punch-list · 50–74 Revise · <50 Rebuild. Full rubric in
    `data/design-rubric.md`. `[G2 §4.6]`
35. **Do not average past a catastrophe.** Any single dimension < 10/25 caps the band at *Revise*
    regardless of total; a hierarchy critical-fail caps it at *Rebuild*. Check the floor before trusting
    the total. `[G2 §4.6]`
36. **State the band explicitly before presenting anything.** Never present a variant as done implicitly.
    `[G2 §7]`
37. **Never claim "user-tested" or "validated" for a same-agent vision-proxy check.** A 5-second or
    first-click test done by the agent is a proxy and must be labelled one. `[G2 §7]` — the same
    anti-gaslight rule the code verifier and feature verifier already run under.

---

## 3½. Committing to a direction (F1)

The other half of rule 22: slop is the absence of a decision, and **a named direction is the decision.**
The selection table + adjective map are in `data/design-directions.json`; each direction's full recipe
stays in `docs/research/` and is pulled **only for the one direction chosen**.

42. **Name exactly one direction — or two with one explicitly dominant — before touching a single
    token.** "Make it modern and clean" is not a direction. Route the brief's adjectives through the
    map, confirm with a disambiguating reference (a competitor, an era, a real object), then build.
    Three or more directions on one surface is how output becomes incoherent; a second direction
    contributes exactly **one** accent move, never equal weight. `[F1 §3.1, §3.9]`
43. **"Modern", "clean" and "professional" are underspecified — always disambiguate.** Each maps to at
    least four directions that look nothing alike (modern-corporate → Swiss; modern-tech → Material or
    Cyber; modern-luxury → Luxury/Editorial; modern-playful → Playful). Guessing from a one-word brief
    is the most common brief-to-direction failure. `[F1 §3.3]`
44. **A direction is a bet across type + colour + shape/space + motion *together*.** Changing the
    palette while type, radius and motion stay generic is a re-skinned default — the exact F2 failure.
    Use all four axes every time. `[F1 §3.5]`
45. **Hit at least two of a direction's "authentic vs cosplay" markers.** Each direction lists 2–3
    specific checkable details separating genuine commitment from a late-applied skin. Fewer than two
    is a signal to revisit the build, not to ship it. `[F1 §3.6]`
46. **Match motion *character* to the direction's family before tuning any numbers** — brutalism
    abrupt, luxury slow and un-springy, playful bouncy, terminal narrated/staggered. The milliseconds
    and curves are B1's. This is where `animation_vocab` gets a source. `[F1 §3.10]`
47. **Decide the dark-mode-carrying token on purpose.** Some directions invert badly by default:
    skeuomorphism's top-lit warm gradient becomes "wet plastic"; brutalism's stark pairing needs a
    deliberate inversion; Swiss's single accent may need re-tuning for dark contrast. `[F1 §3.4]`
48. **Glassmorphism, neumorphism, cyber-neon-on-black and dark terminal palettes are high
    accessibility risk *by construction, not by accident*.** Verify contrast against the **actual
    rendered background**, not the mockup, and ship a solid fallback gated on
    `prefers-reduced-transparency` / `forced-colors`. Not banned — high-context-dependency. `[F1 §3.7, §3.14]`
49. **Every recommended typeface must be free/open with its licence stated.** Helvetica, Univers,
    Akzidenz-Grotesk, Futura, Frutiger and the original Didot/Bodoni cuts are **all commercial** — never
    assume the historically "correct" face is free. `[F1 §3.11]`
50. **Flag trend-bound choices out loud.** Y2K/Frutiger Aero, neo-brutalism and Material-3-Expressive
    are live 2025–26 trends: good bets for a nostalgia or consumer brief, riskier for something that
    must still look right in three years. Swiss, minimalism and editorial are the durable defaults —
    **say which kind of bet is being made.** `[F1 §3.13]`
51. **"Premium" is not a synonym for minimalism.** It is minimalism *plus* art-directed (never stock)
    imagery, visible tracking/kerning discipline, and total restraint — one loose element breaks the
    illusion. Strip those and a "luxury" build is an empty template. `[F1 §3.12]`
52. **No adjectives at all → Swiss-adjacent minimalism with editorial type discipline.** Boldness is
    opt-in, **never a silent default** — do not invent a maximalist or brutalist choice nobody asked
    for. `[F1 §3.15]`
53. **Prefer the domain's own real artifacts over a movement's stock motifs.** A generic leaf icon
    signals "eco" for any brand; this domain's actual ledger line, waveform, wax seal or blister pack
    cannot be handed to a competitor without breaking. Same principle as theme-from-content. `[F1 §3.8]`

## 3¾. Foundation numbers (A5 · A1 · B1 · A3 · C2 · H2 · E2)

The checkable half of the doctrine. These are the numbers the constraint checker enforces; the
reasoning behind each is in `docs/research/`, pulled on demand.

### Accessibility — the conformance authority (A5)

54. **Conform to WCAG 2.2 AA. APCA and WCAG 3 are DRAFTS — never cite them as the compliance bar.**
    If someone says "we're APCA-compliant," correct it: no such conformance exists today. `[A5 §3.1]`
    *This independently confirms the arbitration made earlier — WCAG 4.5:1 gates, APCA advises.*
55. **Contrast: 4.5:1 text · 3:1 large · 3:1 non-text.** "Large" = **≥24px regular or ≥18.66px bold**
    (1pt = 1.333px). Non-text covers every part needed to identify or operate a control — input
    borders, focus rings, toggle tracks, icon-only buttons — against *adjacent* colour. Disabled
    components are exempt. `[A5 §3.2, §3.3]`
56. **Focus ring: ≥2px, ≥3:1 against BOTH the component and the surface behind it, via `outline` +
    `outline-offset` — not `box-shadow` alone, which `forced-colors` deletes.** Use `:focus-visible`.
    And a focused element must not be fully obscured by sticky chrome (2.4.11). `[A5 §3.5, §3.6]`
57. **Targets ≥24×24 CSS px** (AAA wants 44×44); inline links in prose are exempt. Every drag
    interaction needs a single-pointer alternative (2.5.7). `[A5 §3.7, §3.8]`
58. **Honour three preference queries, not one:** `prefers-reduced-motion`, `prefers-contrast`, and
    `forced-colors` — under forced-colors, keep `outline`s and map to system colours; `box-shadow`,
    `background-image` and `text-shadow` are forced to `none`. `[A5 §3.10]`
59. **Reflow at 320px with no 2-D scrolling, and survive the text-spacing overrides** (line-height
    1.5, paragraph 2×, letter 0.12em, word 0.16em). Never fix the height of a text container.
    `[A5 §3.11]` — binds at P3; advisory at P1/P2.
60. **Nothing flashes more than 3×/second** over an area larger than ~341×256px. `[A5 §3.12]`

### Colour (A1)

61. **Reason in OKLCH, ship sRGB hex as the floor.** Equal lightness steps *look* equal and changing
    hue doesn't shift perceived lightness — unlike HSL. Precompute hex so the file renders
    everywhere; layer `oklch()`/`color-mix()` behind `@supports`. `[A1 §3.1]`
62. **The accent budget is ≈10% of pixels — 60/30/10.** ~60% dominant neutral, ~30% secondary
    surface/text, ~10% accent, earned by a *ranked* list of surfaces. This is the numeric form of our
    colour-budget rule, and it cures both failures at once: accent everywhere reads cheap, accent
    nowhere reads dead. `[A1 §3.3]`
63. **One accent hue family; semantic colour is a SEPARATE system.** Never derive danger-red or
    success-green from the accent. If a derived accent lands on a semantic hue, nudge one apart.
    `[A1 §3.2]` — the Screenroom template already does this (derived accent on the frame, fixed coral
    for the one action, teal/amber for stat tiles).
64. **Neutrals are hue-tinted, never pure grey — but leashed:** OKLCH chroma **0.004–0.02**. Below
    that reads as flat computer-grey; above ~0.03 the greys visibly turn blue/beige. `[A1 §3.4]`
65. **Never pure black in dark mode** — base surface at OKLCH **L ≈ 0.18** (`#121212`). Pure black
    kills elevation, maximises halation and raises eye strain. **Express elevation on dark as
    +lightness (≈ +0.03 L per step), not shadow.** `[A1 §3.6, §3.7]`
66. **On dark, cut accent chroma 10–30% and avoid pure-white text** (L ≈ 0.90, `#E6E6E6`). High-chroma
    and pure-white marks bloom for astigmatic and low-vision users. `[A1 §3.8]`
67. **State deltas are direction-aware lightness moves, not a second hardcoded hex.** Hover ≈ ΔL
    ±0.04–0.06, press ≈ ±0.08–0.10, so one rule darkens in light and lightens in dark. A hardcoded
    "darken 8%" silently breaks in dark mode. `[A1 §3.9]`
68. **Derive from content by ROLE, not by "dominant".** The most common pixel is usually a dull
    background; the accent you want is the **vibrant** swatch. Then **normalise L to the theme's
    accent target and clamp C so contrast is guaranteed AT DERIVATION TIME** — never paint a surface
    with the raw pick. `[A1 §3.10, §3.11]`
    *Our `theme-extract.mjs` already picks vibrant-not-dominant and skips near-black/near-grey — this
    validates the approach. The L-normalise + C-clamp step is the upgrade it still needs.*
69. **Categorical/data colour comes from a verified CVD-safe set** — Okabe–Ito (8) or Paul Tol —
    capped at **≤8 categories**, always paired with shape/label/pattern. `[A1 §3.12]`

### Motion (B1) — this is where `animation_vocab` gets its numbers

70. **Duration ladder, by role:** micro feedback (hover/press/toggle) **100–150ms** · small enter/exit
    (tooltip, chip) **150–200ms** · standard component (dropdown, card, tab) **250–300ms** · large
    surface (drawer, sheet, dialog) **350–500ms** · full page/hero **500–600ms**. Over **600ms** needs
    a justification. **Duration scales with distance and size** (+50–100ms per size step) — a 200ms
    tooltip and a 200ms full-screen sheet is a bug. `[B1 §3.1, §3.2]`
71. **Enter decelerates, exit accelerates, move-within-view is symmetric** — and exits run **20–30%
    shorter** than entrances, because the user has already decided. `[B1 §3.3]`
72. **Never `linear` for positional motion.** Linear is for continuous motion only (spinners,
    marquees, real progress) and opacity cross-fades. `[B1 §3.4]`
73. **Springs for interruptible/gesture motion; curves for choreographed motion.** A spring has no
    fixed duration, so it can't be reliably staggered or coordinated. `[B1 §3.5]`
74. **Animate only `transform` and `opacity`.** Width/height/top/left/margin trigger layout;
    box-shadow/filter/background/border-radius trigger paint. Both drop frames. Budget ≈**10ms per
    frame** at 60Hz. Use `will-change` surgically and remove it. `[B1 §3.6, §3.7, §3.8]`
75. **Stagger 20–60ms per item, cap the whole sequence at 300–500ms.** Past ~8–10 items animate only
    what's in the viewport. `[B1 §3.12]`
76. **The vestibular trigger list is specific:** large-area movement, parallax, zoom/scale over big
    distances, spin/rotation, and motion that fights the scroll direction. **Safe:** opacity, colour,
    blur, and movement under ~10% of viewport. Design the reduced path around *this*, not around "no
    animation". `[B1 §3.11]` — and never blanket `animation: none !important`, which strips state
    signalling and loading affordances. `[B1 §3.10]`
77. **Motion never sits un-mitigated behind reading text.** Visible movement behind text at rest is a
    defect; auto-motion lasting >5s alongside content needs a pause control (WCAG 2.2.2). `[B1 §3.9]`
78. **In a strict-CSP offline file: SVG+CSS first, then WAAPI. Lottie (MIT) works inlined — plain JS,
    no eval. Rive needs WebAssembly and is UNAVAILABLE** unless `script-src 'wasm-unsafe-eval'` is
    present. Scroll-driven `animation-timeline` is Chromium-only as of mid-2026 — `@supports`-gate it
    and never make content *visibility* depend on it. `[B1 §3.14, §3.15]`

### Space & layout (A3)

79. **Base unit 8px, half-step 4, hairline 2/1. Scale: 0/2/4/8/12/16/24/32/48/64/96/128.** Every
    spacing value traces to a token — no hand-written 13px. **Break the grid for exactly three
    reasons:** optical correction, 1px hairlines, or forced alignment to an external fixed-size asset.
    Anything else is scale debt. `[A3 §3.1, §3.2, §3.3]`
80. **Modular tokens for component-internal spacing; `clamp()` fluid values for macro layout only.** A
    component should feel identical everywhere it appears. `[A3 §3.4]`
81. **Cap text measure at 45–75ch (65 default) regardless of viewport — including on a 3840px panel.**
    Never widen a paragraph because the monitor is bigger; route extra width to a second pane.
    `[A3 §3.5]`
82. **On large displays add STRUCTURE, not width.** Extra space becomes new panes/rails/columns —
    one stacked pane → 50/50 → 70/30, never one stretched column. `[A3 §3.6]`
83. **⚠ "4K" does not mean 3840 CSS px — and for THIS owner it means 2194.** A 27″ 4K panel is
    ≈163 PPI against a comfortable band of 110–140, so OSes scale it. `[A3 §3.7]`
    **MEASURED 2026-07-23, not assumed** — the owner's only attached display is a **Dell S2725QC,
    27.1″ (60×34 cm), 3840×2160 native, 162 PPI, running at 175 % scaling** (one notch above the
    150 % Windows recommends; the laptop's internal panel is detached). Effective DPI 168 →
    **logical viewport 2194×1234 CSS px**, and a maximised browser's *content* box is nearer
    **2194×1100**. That is only ~14 % wider than 1080p — **not** 1440p, and nowhere near 3840.
    At 175 % the effective density is ≈93 PPI, *below* the 110–140 band: this owner deliberately
    runs a **larger** UI than typical, so err generous, never cramped.
    **This corrects the method's "4K-first, tune density for 4K" instruction, the Screenroom
    density tuning and the P1 profile — all three inherited the marketing number.**
    *(Probed via `GetDpiForMonitor` + `EnumDisplayDevices`; re-measure if the setup changes.)*
84. **Container queries for component adaptation; media queries for page-shell decisions.** Prefer
    `rem` thresholds so zoom is respected. Note `container-type` **creates a stacking context** — an
    overlay inside a container-query card cannot escape it; use the native top layer instead.
    `[A3 §3.8, §3.9]`
85. **Data-dense surfaces get their own 4px density scale**, decoupled from the 8pt layout grid, once
    a grid shows >15–20 rows. Verified row heights: comfortable 48–64 · standard 40 · compact 32 ·
    extra-compact 24. Anything under ~32px needs a target-size review. `[A3 §3.11, §3.12]`
86. **Z-index is a tiered token ladder with gaps (≥100 apart), never a raw integer — and never 9999.**
    For anything that must always win, prefer the browser's **top layer** (`<dialog>`, `[popover]`),
    which stacks above the whole document regardless of z-index. `[A3 §3.13]`
87. **Whitespace is the FIRST hierarchy tool, not the last.** Before reaching for size, weight or
    colour, try more space (unrelated) or less space (related). Start with more whitespace than feels
    necessary and remove it. A section heading carries **1.5–2× more space above than below** — that
    asymmetry alone says "this heading belongs to what follows", at zero colour cost. `[A3 §3.14]`
88. **Optically correct non-rectilinear shapes** — circles and pointed marks need ~2–4% more than
    their nominal size to read as equal to a square neighbour. `[A3 §3.15, echoing G2's craft dimension]`

### Tokens & coherence (C2) — how a design stays one design

89. **Three layers, one direction: primitive → semantic → component.** A literal value (`#2563eb`,
    `8px`, `200ms`) lives **only** in the primitive layer. Semantic tokens reference primitives;
    component tokens reference semantics. Never skip a layer (component → primitive) and never
    reverse. This one rule is what makes theming a re-point instead of a rewrite. `[C2 §3.1]`
90. **Name primitives by *value*, semantics by *role*, components by *part*** — `--blue-600` →
    `--color-action-primary` → `--button-primary-bg`. A primitive named for a role (`--blue-primary`)
    or a semantic named for a colour (`--color-blue-action`) is a **defect**: it welds a decision to a
    value and breaks theming. Cap alias depth at **3 hops**, every chain traceable. `[C2 §3.2, §3.3]`
91. **One ramp per dimension, and one state vocabulary, consumed identically everywhere.** Radii,
    spacing, type, elevation, duration and colour each come from exactly one scale; no component
    invents an off-ramp `border-radius: 7px`. Likewise define the state set once — `rest, hover,
    focus-visible, active, selected, disabled, loading, invalid, read-only` — and its token delta, so
    "hover" is the *same* semantic move on a button, a menu row and a card. `[C2 §3.4, §3.5]`
92. **Ship tokens as CSS custom properties on `:root` — that is the only CSP-safe offline delivery,
    and theme by re-pointing the semantic layer, never by editing components.** DTCG/Style Dictionary
    are **build-time**; the delivered file carries only resolved `--token: value` declarations. A mode
    swap is a `:root` / `[data-theme]` / `prefers-color-scheme` re-point — no eval, no network.
    `[C2 §3.6, §3.7]`
93. **No component may hold a raw value that duplicates a token.** A literal `8px` sitting next to
    `--radius-2: 8px` is drift-in-waiting. `[C2 §3.9]`
94. **Prove coherence — never assume it — with a computed-style audit.** Render each component,
    `getComputedStyle`, and assert every radius/spacing/colour/shadow/duration is **on-ramp** AND that
    **the same semantic role resolves to the same value across components**. Tolerances: geometry
    **±0.5–1 px**; colour **ΔE(CIEDE2000) ≤ 1 pass / ≤ 2 warn / > 2 fail**. Verify against a spec
    sheet with tolerances, not by eye; pixel-diff catches what token-diff misses (Playwright
    `threshold` 0.2/pixel, changed-pixel ratio ≤ 0.1–0.2 % page-level). `[C2 §3.10, §3.11]`
    **This is the mix-coherence check G1 requires and we did not have** — and it is a *runtime*
    check, not a source-text one.
95. **Never hard-delete a token** — mark it deprecated, alias it to its replacement, keep it for a
    stated window. Renames and removals are MAJOR; adding is MINOR; a value tweak in the same role is
    PATCH. The token *is* the handoff contract: lock every decision as a token **reference**, not a
    raw value, so mockup, spec and any regenerated variant speak one vocabulary. `[C2 §3.12, §3.13]`
96. **Honesty flag on DTCG.** The Design Tokens Format Module *2025.10* is stable and vendor-neutral,
    **but it is a Community Group Final Report, NOT a W3C Recommendation**, and tool support is still
    catching up. Fine as interchange; do not assume lossless round-trips. `[C2 §3.14]`

### Feasibility — what a variant may even use (H2)

97. **Default to the cheapest technique family that satisfies the effect and escalate only when the
    lower rung is *provably* insufficient: CSS → SVG → Canvas → WebGL → JS library.** `[H2 §3.1]`
98. **"Library" always means inlined plain-JS source text, never a CDN reference.** The sandbox is
    offline by definition — a `<script src="https://…">` fails whether or not a CSP is enforced,
    because there is no network path. `[H2 §3.2]`
99. **No-eval also means no-WebAssembly — read that literally.** `'wasm-unsafe-eval'` is a *separate*
    CSP keyword from `'unsafe-eval'`; without it `WebAssembly.instantiate()/.compile()` refuse in
    every engine. That kills **Rive's web runtime**, Three.js's `DRACOLoader`/`KTX2Loader`, and every
    WASM-compiled physics/noise engine — **always**, not conditionally. `[H2 §3.3]`
100. **Inline SVG is the default for marks, icons, charts and vector shapes** — simultaneously
     CSP-safe by construction, cheap on `transform`/`opacity`, and the only family that is accessible
     *by default*. **Canvas and WebGL destroy every DOM accessibility semantic**, so use them only for
     genuinely decorative/generative content, and **mirror anything information-bearing in real DOM
     text** (a visually-hidden table or summary) as a default habit, not an edge case.
     `[H2 §3.4, §3.5, §3.14]`
101. **A JS dependency needs all five clauses:** native infeasibility · permissive licence · verified
     eval/WASM-free inlining · proportionate weight · fail-safe wrapping. **GSAP carries a licence
     caveat** — free, but a proprietary Webflow licence, not OSI-approved. Disclose it rather than
     silently shipping it. `[H2 §3.6]`
102. **Every degradation ladder needs a true bottom rung**: zero JS, zero gated CSS feature, always
     renders correctly. That rung is what ships under `prefers-reduced-motion: reduce`, to any engine
     failing a feature check, and to anything that throws. `[H2 §3.7]`
103. **Never use inline event-handler attributes or `javascript:` URIs.** A hash/nonce-based strict
     `script-src` does not cover `onclick="…"`. Wire everything through `addEventListener` inside the
     one covered `<script>` block. `[H2 §3.9]`
104. **"Single-file" and "no-network" are two separate checks, not one.** A technique can be trivially
     single-file (its code is just text) and still reach the network by default — a CDN script, a
     Google Fonts `@import`, a runtime `fetch()`. Verify both, independently, every time. `[H2 §3.10]`
105. **Verify "eval/WASM-free" against the pinned version's actual code** — grep the pasted source for
     `eval(`, `new Function(`, `.wasm`. Popular libraries have shipped eval in avoidable code paths
     before (Chart.js pre-v3 string templates). And a CSP-safe technique can still break for reasons
     unrelated to CSP: **SMIL only animates an SVG inlined in the document**, not one referenced via
     `<img src>` or `background-image`. `[H2 §3.13, §3.15]`

### Environment reality (E2) — what actually runs in the target

106. **"Baseline Newly Available" is not "safe for everyone."** *Widely Available* = in every major
     engine ≥ **30 months** → use unguarded. *Newly Available* = current versions only, **older ones
     still in the wild** → guard. *Limited* = an engine is missing → **always** guard + fallback.
     `[E2 §3.1]`
107. **Gate every non-Widely feature with `@supports` and ship the fallback FIRST** — base declaration
     outside the gate, modern feature inside it. **For colour values the cascade *is* the fallback**:
     `color:#a33; color:oklch(55% .2 25);` needs no `@supports` at all, because a browser drops what
     it cannot parse. Reserve `@supports` for properties that change layout or need a companion rule;
     where CSS can't feature-detect, use `CSS.supports(…)` / `'popover' in HTMLElement.prototype`.
     `[E2 §3.2, §3.3]`
108. **`'self'` does not include `data:` — the scheme must be allowlisted.** `img-src 'self'` **blocks**
     `<img src="data:…">`; base64 `@font-face` needs `font-src data:`. This is the single most common
     inlined-asset failure. **Test what the sandbox actually sets** rather than assuming. `[E2 §3.5]`
109. **Nonces are impossible in a static file** — they must be fresh per HTTP response. So a strict
     policy either allows `'unsafe-inline'` or demands a **SHA-256 hash per block that changes on
     every edit**. Separately, inline `style="…"` **attributes** are governed by `style-src-attr` and
     are dropped under a hash-based policy — prefer one hashed `<style>` block plus classes.
     `[E2 §3.6, §3.7]`
110. **`<meta name="color-scheme" content="light dark">` in `<head>`, before any stylesheet, kills the
     dark-mode flash with zero JS** — the browser paints the right canvas on the *first* frame. Pair
     with `prefers-color-scheme` / `light-dark()`. **Caveat for our own templates:** a
     *body-content-only* file has no `<head>` (the Artifact wrapper owns it), so there the CSS
     `color-scheme` property is the correct and sufficient substitute. And **never promise a persisted
     per-user theme toggle in a static offline file** — without pre-paint storage JS you get a flash;
     follow the OS, or use a `:has()`/`:checked` toggle that does not survive reload. `[E2 §3.10, §3.11]`
111. **Two `-webkit-` prefixes still matter in the glass era:** `backdrop-filter` needs
     `-webkit-backdrop-filter` for Safari < 18, and `mask`/`mask-composite` needs `-webkit-mask-*`
     **with *different* keywords** (`source-over`/`source-in`, not `add`/`intersect`). Prefixed line
     first, then the standard. `[E2 §3.9]`
112. **Never "fix" font weight with `-webkit-font-smoothing`.** It is **non-standard and macOS-only**,
     does nothing on Windows/Android, and forces grayscale AA that makes text lighter *on Mac only* —
     so a design tuned with it looks different cross-OS. Text is heavier on Windows (DirectWrite) and
     lighter on macOS (CoreText) **by default**; design for both instead of papering over it.
     `[E2 §3.13]` — *this owner tunes on Windows, where the property is a no-op, so its only effect is
     to make every Mac viewer see a lighter design. Removed from both preview templates 2026-07-23.*
113. **Wide-gamut P3 is opt-in and must degrade to sRGB via the cascade.** Gate ambitious cases with
     `@supports (color: color(display-p3 1 1 1))` or `@media (color-gamut: p3)`, and **never rely on
     the extra saturation for meaning** — it is gamut-mapped away on an sRGB screen. `[E2 §3.12]`
114. **Prefer vectors for anything that must stay crisp at any DPR; raster only as an inlined `data:`
     @2x** — which *doubles* in bytes. Reach for inline SVG first, `image-set()` only when raster is
     unavoidable. `[E2 §3.14]`
115. **Reserve the newest toys — `anchor-positioning`, `scroll-timeline`, `text-wrap: pretty`,
     `field-sizing`, `corner-shape` — for progressive enhancement only, never for layout or legibility
     that must hold.** Several are Limited-availability as of July 2026 (no Firefox for scroll-driven
     animation or `text-wrap: pretty`; `corner-shape` is Chromium-only). **Content must be complete and
     usable when they no-op.** `[E2 §3.15]`

## 4½. The audience profile — what makes a rule bind (owner ruling 2026-07-23)

**A rule is not universally true; it is true for an audience on a device.** Research states rules
against an implied general-public, all-devices reader. Most of this owner's projects are not that. So
the project's **audience profile** is a first-class, **revisable** ledger field, and it mechanically
selects which rules block, which advise, and which are skipped entirely.

| | **P1 — solo** | **P2 — trusted group** | **P3 — public** |
|---|---|---|---|
| Typical | 1 user (the owner), built by them, **Dell S2725QC 27″ 4K @ 175 %** | ~7 (family/friends), laptops | anyone, mobile → monitor |
| Input | mouse + keyboard | trackpad, some touchscreens | touch first-class |
| Hover-only content | **allowed** | allowed, flag touchscreen laptops | **BLOCKS** (B2 §3.5) |
| Target size ≥ 24px | skip | advise | **BLOCKS** |
| Contrast ≥ 4.5:1 | advise (their eyes, their call) | **BLOCKS** — other people, screens, lighting | **BLOCKS** |
| `prefers-reduced-motion` | advise | **BLOCKS** | **BLOCKS** |
| Screen-reader semantics | skip | skip unless a member needs it — **ask once** | **BLOCKS** |
| Responsive range | **single target ≈2194×1234 logical** (measured, rule 83) — *not* 3840 | 1280–1920 | mobile-first, full range |
| Colour-alone state | advise | **BLOCKS** | **BLOCKS** |

**Rules that never vary by profile:** the isolation gate (G1), the owner's own constraint contract, and
"never show one option". Those are about the integrity of the *decision*, not the audience.

**Graduation is the point.** A profile can change (a personal tool goes public). Because every decision
records the profile its rationale depended on, a profile change **automatically re-opens exactly those
decisions** instead of leaving silent debt. Recording *why* is what makes this work — see rule 16.

**Worked instance:** Screenroom is **P2**. Its card keeps title, rating and Play in a hover-revealed
footer. Under P3 that is a blocking B2 §3.5 defect; under P2 it is an **accepted informed trade-off**,
recorded with its reason, and it does not count against the design in critique. If Screenroom ever goes
public, that decision re-opens automatically.

## 4¾. Bundled rounds & harvested context (owner ruling 2026-07-23)

38. **A variant is normally a bundle; the pick is a vector, not a panel.** The owner's real reaction is
    *"I like 3 things in v1, 3 in v2, 4 in v3"* — so a round may carry **N named sub-decisions** across
    2–4 variants, and each sub-decision is selected **individually**. A mix is the default outcome, not
    an exception. G1's isolation still applies, restated for bundles: **every named sub-decision must
    genuinely differ across the set** (so all N really have N options, and none is silently constant),
    and nothing outside the declared list may move. Strict single-axis rounds remain the right tool for
    the one or two things still contested after a bundle round. `[G1 §3.9/§4.7 merge-beats-best 70% vs
    56% [CITED]; the per-item selection model is the owner's, and the evidence supports it]`
39. **Harvest before you ask.** Anything already true in the repo or the ledger is a **frozen control**,
    never an interview question: existing tokens, existing `master_components`, locked ledger decisions,
    the audience profile. Re-asking for something the system can look up is the behaviour the owner
    named as "vomit". The context gate earns its keep **only** on a genuinely cold start.
40. **What to vary comes from the component's anatomy, not from invention.** C1 gives every component a
    named parts list (a Card is container · media · header · title · meta · actions) and a required-state
    floor; B2 gives the state matrix. The sub-decisions in a bundle are **those parts and those states**.
    `[C1 §4.2-4.4, B2 §4.1]`
41. **Spend the budget on generation 1.** Reruns collapse when the first set is genuinely creative, so
    first generation gets the commitment to a direction, the content-derived colour, and the named
    material reference — not rounds 2 and 3 grinding toward them. `[owner ruling; consistent with F2 §3.1
    "slop is the absence of a decision"]`

**Component tiers (C1 §4.1 — replaces the 5-tier ladder previously invented in the Task-2 plan).**
Classify by **reuse cardinality**, not complexity: **primitive** = one concern, nothing named nested
inside, repeats many times (Button, Badge, Avatar) · **composite** = assembles ≥2 primitives *and owns
the state orchestration between them*, repeats several times (Card, Dialog, Tabs, Toast) · **surface** =
page-level region, usually once per screen (App-shell, Page-header, Empty-state). Test: *repeats many
times → primitive/composite; once per screen → surface.*

**Render surface follows the tier.** A round renders **the target's tier, with its required states pinned
open side by side** — a primitive across its states; a composite as 1–3 instances; a surface once at real
density. Rendering a full page to decide a component question is a rung error: it costs an order of
magnitude more and, if the axis lives in a collapsed region, hides the very difference being judged.

## 5. Enforcement tiers (owner ruling 2026-07-23)

Three tiers, **filtered by the audience profile above**. The distinction is load-bearing: **the owner's
own constraints are absolute; the research is advice with a small, profile-dependent hard floor.**

| Tier | What's in it | On violation |
|---|---|---|
| **BLOCK — feasibility** *(added 2026-07-23 from H2 + E2 — see note)* | The variant cannot run in the target sandbox at all: `eval`/`new Function` · WebAssembly · any network reference · inline `on*=` handlers · an ungated non-Widely feature carrying layout or legibility | **Regenerate. Never presented.** Fail closed. |
| **BLOCK — owner constraints** | `must_use` · `animation_vocab` · `forbidden` · `source_policy` · `colour_budget`, and doctrine rules 2/3/4/8 (the isolation gate + never-show-one) | **Regenerate. Never presented.** Fail closed, same principle as the Task-3 verifier. |
| **BLOCK — hard doctrine floor** | Text contrast < 4.5:1 (large 3:1) · `prefers-reduced-motion` not honoured · interactive target < 24px · meaning carried by colour alone | **Regenerate.** Deliberately tiny — these are the four an owner should never have to spend a round catching. |
| **ADVISE — everything else** | All remaining doctrine, the G2 rubric score + band, the F2 templated tax | **Computed, annotated on the variant, shown.** A *Rebuild* band triggers **one** automatic regeneration; if it still bands Rebuild it is shown with the score visible. |

**Why a fourth tier (H2/E2, 2026-07-23).** The three tiers above all answer *"is this design good, for
this audience?"* H2 and E2 introduced a class of failure that is not a taste or audience question at
all: **the artifact does not render.** A WASM runtime, a CDN `<script src>`, an `onclick=` attribute or
an ungated Limited-availability property produces a blank or broken panel no matter who is looking at
it, so it can be neither profile-filtered nor advised — it must fail closed, always. This **extends**
the owner's two-tier ruling rather than revising it: that ruling governs *quality*; this governs
*existence*. Its rules are also the **cheapest in the whole set to implement** — every one is a source
grep — so they are the natural first candidates to move off `status:"pending"`. *Flagged for owner
confirmation; nothing about the existing three tiers changes.*

**Contrast standard:** hard gate = **WCAG 2.1 AA (4.5:1 / 3:1)** — stable, computable, no licence
question. F2 §3.12's **APCA `Lc` ≥ 75/45/30** is computed as an *advisory* score alongside; it is a
**draft** standard with an unconfirmed embedding licence (flagged in the corpus index), so it does not
gate. Revisit if APCA lands in WCAG 3.

**Owner override outranks all three tiers** — an explicit instruction is a decision (rule 22), recorded
in the ledger with its rationale, and exempt from the tax it would otherwise incur.

## 6. Arbitrated conflicts (the register)

| Conflict | Resolution | Basis |
|---|---|---|
| ChatGPT report: "avoid `data:` URIs and inline `<style>`/`<script>` under strict CSP" vs the entire Cowork set + our working pipeline | **Cowork wins.** Inline + `data:` URIs are *observed* working in the Claude Artifact sandbox (640 KB self-contained page renders). The ChatGPT advice describes a production app's CSP, not our preview target. | Live evidence beats spec-asserted CSP — the corpus index flags exactly this as its #1 "verify at build time" item |
| Spec D2 "2–4 variants" vs G1/G3 "3 default, 2 binary, 4–5 low-fi only" | **Adopt the graded rule.** It sits inside the spec's range for every rung except a rung-0 direction pass; recorded as a refinement of D2, not a break. | G1 §4.4 + G3 §3.2 independently agree |
| G1 rule 13 asserts centre bias; G3 rule 6 corroborates only *primacy* and declines centre | **Randomise order** (handles both); record centre-bias as `[REASONED, uncorroborated]`. | G3 §3.6 explicitly flags it |
| "More options cause overload" (folk rule) vs the meta-analysis | Overload is **d = 0.02 — essentially zero overall** across 63 conditions / 50 experiments / n=5,036. It appears only under moderators: hard-to-compare multi-attribute options, no prior preference, time pressure, must-justify-later. **Our audience matches several**, so cap at 3 for *that* reason — not because "more is bad". | `[CITED — G3 §3.3, Scheibehenne et al. 2010]` |
| Decision fatigue as a hard budget | **Soft, contested.** Ego depletion largely failed a 23-lab preregistered replication; the judges/parole finding is disputed as a scheduling artifact. Use 5–8 as a recap prompt, never a gate. | `[G3 §3.8/§8]` |
| F2 calls glassmorphism slop; the method says an owner asking for "glassy" wins | **No conflict** — rule 22's corollary. An explicit request is a decision; exempt from the tax, recorded as deliberate. | F2 §3.1 |

## 7. What is deliberately NOT here

Per-axis **build** knowledge — how to make convincing glass, choose a typeface pairing, tune a spring,
design a table — belongs to the agent generating a variant **on that axis**, pulled on demand from
`docs/research/`:

`A1` colour · `A2` type · `A3` space/layout · `A4` shape/depth/material · `A5` a11y conformance ·
`B1` motion · `B2` states/affordance · `B3` nav/flow · `C1` component anatomy · `C2` tokens/coherence ·
`C3` information design · `D1` UX writing · `D2` iconography/imagery · `E1` performance/CSS ·
`E2` cross-platform/CSP reality · `F1` style movements · `H1` asset sourcing · `H2` feasibility matrix

Loading them by default would recreate the degradation this file is built to avoid.
