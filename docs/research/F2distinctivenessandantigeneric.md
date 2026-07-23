# F2 — Distinctiveness & anti-generic design

*Design-intelligence reference. Track F2 of the registry research map. Written to be read by the design agent **before it commits to a look**, and by a human owner auditing whether the output escaped "AI slop." Companion to F1 (how to execute a named aesthetic) and A1–A4 (the tokens that implement distinctiveness).*

---

## 1. Scope line

This track owns **why machine-generated UI reads as generic, and how to escape it without breaking usability**: an evidence-based catalogue of the *current* (2024–2026) "AI slop" clichés across **colour, type, layout, effects, iconography and copy**; the mechanisms that make models converge on them (training-distribution averaging, ease-of-implementation bias, safety/blandness, feedback-loop contamination); the repeatable **escape moves** (commitment, one bold place, content-derived tokens, deliberate asymmetry, real-material reference); and an **objective, checkable rubric** for answering "does this look templated?" by *counting default choices* rather than by taste.

## 2. Boundary (what this track does **not** cover)

- **The *method* for generating options** — decision axes, how many variants, how to diverge them — → **G1 Variant methodology**. F2 says *what generic is and how to leave it*; G1 says *how to produce and organise the alternatives*.
- **Executing a *named* aesthetic direction** (brutalism, editorial, Swiss, neo-brutalist, maximal, industrial-mono) → **F1 Style movements**. **The split is load-bearing: F2 says "escape the statistical centre"; F1 says "here is how to commit to a specific off-centre point and do it well."** F2 gets you *out* of the default basin; F1 tells you where to land.
- **The tokens that *implement* distinctiveness** — the colour ramp, type scale, spacing/radius/elevation scales, the actual custom properties → **A1 Colour**, **A2 Type**, **A3 Space/layout**, **A4 Shape, depth & material**. F2 says "derive the accent from content, don't use stock indigo"; **A1** owns *how the ramp is built*.
- **Critique heuristics / scoring / the automated "would a designer retouch this?" loop** → **G2 Critique & evaluation**. F2 supplies the *signals* (§5, §7); G2 owns the *scoring model and iteration loop*.
- **Contrast/accessibility conformance math** (APCA `Lc`, WCAG ratios, focus-visible mechanics) → **A5 Accessibility**. F2 cites the thresholds where an escape move risks breaking them; A5 owns the conformance model.
- **Motion cliché** (identical fade-ins, bounce-on-every-hover) is *catalogued* here as an iconographic/effects tell, but the **motion system** (durations, easing, reduced-motion) → **B1 Motion**.

**MECE check:** *generic vs. distinctive* (F2) is orthogonal to *which named direction* (F1), *how many options* (G1), *the token values* (A1–A4), and *how we score it* (G2). A design can be distinctive and un-scored, or scored generic and on-brand-for-a-boring-brand. F2 is the axis "how far from the machine's default basin, and is that distance *earned*."

---

## 3. Executive rules (apply these before reading the body)

1. **Slop is the absence of a decision, not the presence of a bad one.** Every source converges on this: the generic look is what you get when *no one chose* — the model falls to the statistical centre of its training data. The fix is therefore *procedural*, not cosmetic: **make and record one aesthetic commitment before styling anything**, then hold it everywhere. ([vibecodekit](https://vibecodekit.dev/ai-slop-design), [SmoothUI](https://smoothui.dev/blog/ai-design-slop))
2. **Homogenisation is real and predates AI — AI is an accelerant, not the origin.** A peer-reviewed study of **227,000+ screenshots from ~10,000 sites (2003–2019)** found web design was *most diverse around 2008–2010*, then converged sharply; one summary puts the **layout-similarity distance down ~44 % over 2010–2019**, driven by responsive frameworks (Bootstrap/jQuery), CMS templates (WordPress) and SEO. AI models trained on that already-converged corpus inherit and *re-emit* the mean. ([Goree et al., CHI 2021](https://dl.acm.org/doi/abs/10.1145/3411764.3445156); [summary, J. Kolko](https://www.jonkolko.com/phd/writing/25-07-12-homogenization-of-web-design); [OneZero](https://onezero.medium.com/its-not-just-you-websites-really-do-all-look-the-same-now-d8050b8ea743)) *(This is the strongest hard evidence in the track; almost everything else is expert/community consensus — flagged as such.)*
3. **The 2024–2026 slop signature is a specific, nameable set.** Community consensus across many independent write-ups: **stock indigo/violet accent (`#6366F1`/`#8B5CF6`) → purple gradient; Inter/Geist/Poppins default type; centered single-column hero + one CTA + a badge above the H1; three (or six) equal rounded cards with thin-line icons; `rounded-2xl shadow-lg` glass/soft-shadow; reflexive dark mode; weightless triad copy ("Build faster. Ship smarter.").** If your output contains most of these, it is indistinguishable from thousands of others. ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [vibecodekit](https://vibecodekit.dev/ai-slop-design), [925studios](https://www.925studios.co/blog/ai-slop-design-tells))
4. **The accent hue is the single highest-signal tell — derive it, don't default it.** Stock Tailwind indigo is the reflex because a demo default (`bg-indigo-500`, chosen ~2020 as an "inoffensive placeholder") saturated tutorials 2019–2024 and became the model's idea of "a button." **Derive the accent from the product's content/domain** (cross-ref **A1**), or at minimum rotate off the 240–280° hue band. ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [dev.to/alanwest](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p))
5. **Commit hard in ONE place; keep the rest quiet.** The reliable escape is *not* "be weird everywhere" (that breaks usability) — it is **one bold move** (a display face, an oversized editorial headline, a saturated field, a real texture, an asymmetric split) surrounded by disciplined, conventional, accessible structure. Distinctiveness is *concentrated*, not *smeared*. (Synthesised from the "one focal point + one accent per screen" rule, [vibecodekit](https://vibecodekit.dev/ai-slop-design); taste-forward but widely echoed.)
6. **Cap the palette and force a dominant.** 60 / 30 / 10 — one dominant, one neutral, one sharp accent; extend only via tints/shades; keep semantic colours separate. Timid, evenly-weighted palettes with no dominant read as generic *and* flatten hierarchy. Avoid pure `#fff`/`#000` grounds — give the neutral a slight hue/temperature. ([vibecodekit](https://vibecodekit.dev/ai-slop-design))
7. **Pair a display face with a body face; never ship the unchosen default.** Inter/Roboto/Open Sans/Geist/Poppins as the *headline* is a tell precisely because they're the no-decision option. Pick an intentional **display + body** pairing, drive hierarchy with **weight contrast** (100/200 vs. 800/900, not gradual steps), and keep body ≥ 16 px at a 60–80-character measure. (Type *specifics* → **A2**.) ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [925studios](https://www.925studios.co/blog/ai-slop-design-tells))
8. **Break the equal-card grid.** "Exactly three cards in a row" and the bento grid are reflexes. Introduce **deliberate asymmetry** (a 60/40 or 70/30 split, one feature given 2× space, an off-axis anchor). Asymmetry is the cheapest de-genericiser that costs no usability if reading order stays clear. ([925studios](https://www.925studios.co/blog/ai-slop-design-tells), [vibecodekit](https://vibecodekit.dev/ai-slop-design))
9. **Separate surfaces with space, then tone, then elevation — border last.** The flat 1px gray border on every card, and the coloured 3–4px left-strip, are named as among the *most reliable* AI tells. Prefer whitespace → a 3–5 % background-lightness shift → soft elevation; add a border only if all three fail. (Material specifics → **A4**.) ([vibecodekit](https://vibecodekit.dev/ai-slop-design))
10. **Write copy only your product could write.** Weightless triads ("Fast, efficient, reliable"), "It's Not X, It's Y", vapid openers ("In today's fast-paced world"), em-dash-heavy cadence, and emoji-led bullets are the copy signature. Replace with one concrete, product-specific claim. (UX-copy craft → G2/skill; the *tells* are here.) ([Charlie Guo, Field Guide to AI Slop](https://www.ignorance.ai/p/the-field-guide-to-ai-slop))
11. **Reference a real material, not "modern."** The escape from glassmorphism-by-default is a *specific* material reference: risograph grain, letterpress deboss, matte enamel, blueprint linework, newsprint, ceramic. A named material forces non-default shadows/textures/edges. Cross-ref **A4**; generate grain with CSP-safe SVG `feTurbulence` (§6, no network).
12. **Every escape move must survive an accessibility check.** Distinctiveness that fails contrast, removes focus states, or ships undesigned empty/error states is not distinctive — it's broken. Gate colour choices on **APCA `Lc` ≥ 75 (body), ≥ 45 (large/bold), ≥ 30 (non-text UI)**; design all interaction + empty + error states. (Conformance → **A5**.) ([vibecodekit](https://vibecodekit.dev/ai-slop-design))
13. **Judge templated-ness by *counting defaults*, not by vibe.** Use the objective rubric in §7: score each dimension "default choice = 1 point of templated tax." A high score means the machine chose; a low score means a human (or a well-instructed agent) chose. This is the track's headline deliverable.
14. **Beware the escape treadmill.** Today's escape becomes tomorrow's tell the moment it's common enough to enter the corpus and the prompt-conventions. Space Grotesk, the single serif-italic accent word, bento grids, and Geist were *escapes in 2023* and are *tells in 2026*. Distinctiveness is relative to the current mean — **re-baseline periodically; never hard-code a "non-generic" allowlist.** ([vibecodekit](https://vibecodekit.dev/ai-slop-design) lists these former-escapes as current tells.)
15. **Distinctiveness ≠ novelty for its own sake.** The goal is a look that is *specific to this content/brand* and *memorable*, not maximally strange. Strangeness that isn't earned by the content is just a different generic (the "AI maximalism" generic). The test is *fit*, not *distance*. (Taste flag — but consistent with the diverge-with-purpose argument, [Dialogue Theory](https://www.dialoguetheory.com/ideas/interface-design-is-diverging-thats-a-good-thing).)

---

## 4. Body

### 4.1 What, precisely, is "AI slop" in UI? (the current signature)

"AI slop" originally named low-effort AI *content*; by 2025–2026 it has a stable *visual* meaning for UI. The signature is remarkably consistent across independent critiques, which is itself evidence it's a real attractor rather than one writer's pet peeve. Consolidated:

| Dimension | The default the machine reaches for | Corroborating sources |
|---|---|---|
| **Colour** | Indigo/violet accent (`#6366F1`, `#8B5CF6`), purple→blue or purple→cyan gradient, gradient on big numbers, pure `#fff`/`#000` grounds, timid no-dominant palette | [superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [vibecodekit](https://vibecodekit.dev/ai-slop-design), [925studios](https://www.925studios.co/blog/ai-slop-design-tells) |
| **Type** | Inter / Roboto / Open Sans / **Geist / Poppins / Space Grotesk** as *unchosen headline*; all-caps section labels; single serif-italic "accent word"; decorative monospace | [superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [vibecodekit](https://vibecodekit.dev/ai-slop-design) |
| **Layout** | Centered single-column hero, **badge directly above H1**, one CTA; **exactly three (or six) equal cards**; numbered 1·2·3 step rows; horizontal stat banner; bento grid as reflex | [925studios](https://www.925studios.co/blog/ai-slop-design-tells), [vibecodekit](https://vibecodekit.dev/ai-slop-design) |
| **Effects / material** | `rounded-2xl shadow-lg p-6` shadcn default untouched; glassmorphism; neon-on-dark glow; purple gradient **orbs/blobs** behind hero; subtle shadow at exactly **0.1 opacity** | [vibecodekit](https://vibecodekit.dev/ai-slop-design), [superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [SmoothUI](https://smoothui.dev/blog/ai-design-slop) |
| **Surfaces / borders** | Flat 1px gray border on every card; **coloured 3–4px left-border strip** ("single most reliable AI tell"); everything boxed | [vibecodekit](https://vibecodekit.dev/ai-slop-design) |
| **Iconography** | Centered thin-line (Lucide/Heroicons) icon above each heading; interchangeable/generic; floating 3D abstract blobs; over-smooth "plastic" illustration; generic stock photography | [925studios](https://www.925studios.co/blog/ai-slop-design-tells), [vibecodekit](https://vibecodekit.dev/ai-slop-design) |
| **Copy** | Weightless triad ("Build faster. Ship smarter." / "Fast, efficient, reliable"); "It's Not X, It's Y"; vapid opener; em-dash cadence; emoji-led bullets | [925studios](https://www.925studios.co/blog/ai-slop-design-tells), [Field Guide](https://www.ignorance.ai/p/the-field-guide-to-ai-slop) |
| **Motion** | Identical fade-ins on everything; bounce on every hover; snap (no easing) transitions; inert/absent hover-focus states | [SmoothUI](https://smoothui.dev/blog/ai-design-slop), [vibecodekit](https://vibecodekit.dev/ai-slop-design) (motion *system* → **B1**) |
| **Mode** | **Dark mode shipped as the reflexive default** ("single most common AI tell") | [vibecodekit](https://vibecodekit.dev/ai-slop-design) |

**Honesty flag.** The empirical, peer-reviewed claim is *homogenisation is real and measurable* (§4.2). The *specific 2026 catalogue above* is **design-community consensus / expert opinion**, not a controlled study — but its consistency across many independent authors, and its match to observable AI output, make it reliable *as a working description of the current mean*. Treat item-by-item severity as taste; treat "this cluster = generic" as well-supported.

### 4.2 Why does generic happen? (the convergence mechanisms)

Five compounding mechanisms. The first is measured; the rest are well-argued mechanism, not proven from model internals — flagged.

**(a) The corpus was already homogenised (measured).** Goree et al. (CHI 2021) quantified visual + structural similarity across 227k+ screenshots, 2003–2019: diversity peaked ~2008–2010, then fell as responsive design, Bootstrap/jQuery, WordPress templates and SEO best-practice narrowed the "repertoire of possible and legitimate designs." A model trained on 2019–2024 web code is trained on the *bottom* of that diversity curve. ([CHI 2021](https://dl.acm.org/doi/abs/10.1145/3411764.3445156); [Kolko summary](https://www.jonkolko.com/phd/writing/25-07-12-homogenization-of-web-design))

**(b) Distributional convergence / averaging (mechanism).** An LLM predicts the *most probable* token. Design choices that are "safe, work universally, and offend no one dominate the training data," so the model "reverts to the statistical center." The purple button isn't chosen — it's the mode of the distribution. Tailwind UI's `bg-indigo-500` demo default propagated through thousands of tutorials and became that mode. ([SmoothUI](https://smoothui.dev/blog/ai-design-slop), [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website))

**(c) Ease-of-implementation bias (mechanism).** Coding agents narrow *further* than the raw average: they "build only what is easy to implement," which eliminates striking-but-fiddly directions (real asymmetry, tilted planes, bespoke grids, custom illustration) in favour of the copy-pasteable component. The generative surface is doubly biased: toward the *mean* and toward the *easy*. ([SmoothUI](https://smoothui.dev/blog/ai-design-slop))

**(d) Safety/blandness & instruction-tuning (mechanism, weaker evidence).** Alignment toward "helpful, inoffensive, broadly acceptable" plausibly reinforces the median aesthetic (no source rigorously isolates RLHF as a *cause*; prg.sh explicitly attributes the effect to *training distribution*, not safety tuning). **Flag: plausible contributor, not established.**

**(e) Feedback-loop contamination (mechanism).** AI-generated purple sites deploy to the live web, get re-scraped, and shift the next model's distribution further toward indigo — a ratchet. Each generation makes the mean *more* purple, not less. ([dev.to/alanwest](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p))

**Decision consequence.** Because the causes are *distributional*, the cure is **injecting a decision the distribution lacks** — a constraint, a reference, a content-derived token, a committed direction. Better *adjectives* ("cleaner", "more premium") do **not** work: the diagnostic symptom that you're stuck is reaching for vague adjectives, which signals taste and implementation are still fused. Inject *specific constraints or references* instead. ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic))

### 4.3 The escape moves (the core of the track)

Six moves, ordered by leverage. Each is a *rule with a decision*, not a vibe. All preserve usability when applied as written.

**Move 1 — Commit to one direction and record it (highest leverage).** Before styling, choose a direction and freeze its tokens in a single source of truth (a `DESIGN.md` / token block): palette, fonts, radius, texture, motion. This is the process fix every source converges on; it defeats mechanism (b) by *replacing the missing decision*. **The choice of direction is F1's job; F2's rule is only "make and hold one."** ([vibecodekit](https://vibecodekit.dev/ai-slop-design), [SmoothUI](https://smoothui.dev/blog/ai-design-slop))

**Move 2 — Content-derived tokens (defeats the stock-indigo tell).** Derive the accent, and ideally the whole temperature, from the *product's own content* — its domain, its imagery, its subject matter — rather than a stock swatch. A fintech-for-farmers derives a soil/greenhouse palette; a legal tool derives an ink/paper palette. **This is the single most powerful de-genericiser because it makes the palette *unrepeatable* by another product.** Mechanically (owned by **A1**): sample a source image/brand mark, pick a seed hue, build the ramp in a perceptual space (OKLCH), reserve semantic colours. F2's rule: *the accent must be justifiable from content, not from a framework default.*

**Move 3 — One bold place (defeats "weird everywhere" and protects usability).** Pick exactly **one** element per screen to be loud — an oversized editorial headline, a full-bleed saturated field, a real texture, a hero asymmetry, a single expressive display face — and keep *everything else* quiet, conventional, and accessible. Concentration is what separates "distinctive" from "chaotic." (Synthesises the "one focal point + one accent per screen" rule; taste-forward but low-risk.)

**Move 4 — Deliberate asymmetry (cheap, usability-neutral).** Replace the centered single-column / equal-3-card reflex with an intentional imbalance: 60/40 or 70/30 hero split, one feature card given 2× area, an off-centre optical anchor, a broken baseline grid. Keep reading order unambiguous and it costs nothing in usability while instantly reading "designed." ([925studios](https://www.925studios.co/blog/ai-slop-design-tells))

**Move 5 — Real-material reference (defeats default glass/gradient).** Swap "modern/glassy" for a *named* physical material (riso grain, letterpress deboss, matte enamel, blueprint, newsprint, ceramic, anodised metal). A concrete referent forces non-default edges, shadows and texture — the model can't fall back to `shadow-lg` because the material dictates something specific. Cross-ref **A4**; grain is CSP/offline-safe via SVG `feTurbulence` (§6).

**Move 6 — Specific copy (defeats weightless triads).** Replace any headline that a competitor could also use with one concrete, product-specific claim, number, or verb. "Build faster. Ship smarter." → the actual thing the product does that nothing else does. Kill emoji bullets, "It's Not X, It's Y", and vapid openers. ([Field Guide](https://www.ignorance.ai/p/the-field-guide-to-ai-slop))

**Prompt-level tactics that help (diminishing returns).** Explicit per-dimension constraints; concrete reference directions ("1970s ski lodge: burnt orange, avocado"); negation lists ("avoid indigo, avoid glassmorphism, avoid centered hero"); role assignment ("senior brand designer") shifts the probability distribution. But all of these hit a ceiling — *process* beats *prompt*. ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic), [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website))

### 4.4 Distinctiveness *without* harming usability

The whole point of F2 (vs. "just be weird") is that distinctiveness and usability are **not** a trade-off when the distinctiveness is *concentrated and grounded*. The named real-world escapes prove it: Anthropic's hand-drawn "scribble" warmth, Arturia's diagrammatic technical edges, Notion's spare restraint, Airbnb's 3D icons, Open's soft gradient/texture system — each is unmistakably itself *and* clear at the centre. The sweet spot is "aesthetic choices distinctly aligned with brand values while remaining usable and accessible." ([Dialogue Theory](https://www.dialoguetheory.com/ideas/interface-design-is-diverging-thats-a-good-thing))

**The usability guardrails that must survive every escape move:**

| Escape move | The usability risk it introduces | The non-negotiable guardrail |
|---|---|---|
| Content-derived accent | Accent may fail contrast on text/CTAs | APCA `Lc` ≥ 75 body / ≥ 45 large / ≥ 30 UI; test the *actual* pair (→ **A5**) |
| One bold display face | Poor legibility at body sizes; slow load | Display for **headlines only**; body stays a workhorse; subset + self-host (§6) |
| Saturated/coloured field | Text on colour drops below contrast | Overlay/scrim or pick text token by APCA against the *field*, not the page |
| Deliberate asymmetry | Ambiguous reading order; broken responsive | Preserve one clear scan path; test at 320 px; asymmetry is *visual*, order is *linear* |
| Real texture / grain | Noise over text harms reading; heavy bytes | Texture on *fields*, not under body copy; SVG filter, not raster; reduced-motion static |
| Removing borders | Loses separation for low-vision users | Keep a *perceptible* non-border separation (tone/elevation) that also passes non-text contrast |
| Dark mode as a *choice* | Reflexive dark harms outdoor/low-vision some | Offer both; don't *default* dark; ensure both themes pass contrast |

**Rule:** an escape move that trips any guardrail is *reverted or re-scoped*, never shipped. Distinctiveness is earned *on top of* a usable base, never *instead of* one.

### 4.5 The escape treadmill (why any static allowlist rots)

Distinctiveness is **relative to the current mean**, and the mean moves — partly *because* escapes get copied into the corpus and into prompt-libraries. Documented drift:

| Was an escape (≈2022–2023) | Is a tell (2026) | Why it flipped |
|---|---|---|
| Space Grotesk / Geist headline | Named generic default | Entered every starter kit + the training corpus |
| Single serif-italic "accent word" | Named AI tell | Became the reflexive "add personality" move |
| Bento grid | Named reflex layout | Templatised; now the *new* three-card |
| Glassmorphism | Core slop effect | Was the 2021 escape from flat design; over-applied |
| Dark mode | "Single most common AI tell" (as *default*) | Cheap "premium" signal, now expected |

(Every flip above is documented in [vibecodekit](https://vibecodekit.dev/ai-slop-design), which lists these *former* escapes among *current* tells.)

**Decision rule:** never hard-code a "non-generic" font/colour/layout allowlist into the tool. Instead, encode the **method** (derive from content, commit + concentrate, count defaults) and **re-baseline the cliché catalogue on a schedule** (§8). The catalogue in §5 is dated *July 2026* and *will* rot.

---

## 5. Options catalogue — the CATALOGUE OF CLICHÉS

The core reference. Columns: **the cliché · why models converge on it · why it reads generic · the escape move · usability caveat.** Organised by dimension. "Escape move" cross-references A1–A4 for token implementation and F1 for committing to a direction. **All escapes are subject to the treadmill (§4.5) and the guardrails (§4.4).**

### 5.1 Colour

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Stock indigo/violet accent** `#6366F1`/`#8B5CF6` | `bg-indigo-500` demo default → saturated 2019–24 tutorials → distribution mode ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)) | Identical to thousands of sites; signals "no colour decision" | **Content-derived accent** (→ **A1**); or at minimum rotate out of the 240–280° band | New hue must still hit APCA on CTAs/links (→ **A5**) |
| **Purple→blue / purple→cyan gradient** | Gradients are "impactful" + purple is the accent → gradient of the accent | The default flourish; instantly "AI hero" | Flat committed colour, or a *content-referenced* two-stop (sunset for travel, ink-wash for legal); gradient only if it means something | Text on gradient often fails contrast — scrim or pick text token vs. the *darkest* stop |
| **Gradient on big stat numbers** | "Make numbers pop" pattern in the corpus | Decorative, meaningless, ubiquitous | Solid accent or weight/scale for emphasis; reserve colour for meaning | Gradient text often fails non-text + text contrast |
| **Timid, no-dominant palette** | Averaging blends toward mid-saturation equilibrium | No hierarchy, no memorability | **60/30/10** with a real dominant; extend via tints/shades ([vibecodekit](https://vibecodekit.dev/ai-slop-design)) | Dominant must not be a text colour that fails contrast |
| **Pure `#fff` / `#000` grounds** | Simplest, most frequent tokens | Flat, clinical, "unfinished" | Tint the neutral (warm paper, cool slate); give ground a temperature | Keep body-on-ground APCA `Lc` ≥ 75 |

### 5.2 Type

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Inter / Roboto / Open Sans / Geist / Poppins as headline** | The unchosen default; ships with every starter | "No typography decision was made" ([925studios](https://www.925studios.co/blog/ai-slop-design-tells)) | Intentional **display + body pairing** (→ **A2**); e.g. a real display serif for headlines, workhorse sans for body | Display face for headlines *only*; body stays legible ≥ 16 px |
| **Gradual weight hierarchy** (400/500/600) | Safe, evenly spaced | Muddy, low-contrast hierarchy | **Extreme weight contrast** (100/200 vs 800/900) ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic)) | Ensure thin weights still pass contrast at small sizes |
| **Single serif-italic "accent word"** | The reflexive "add class" move; now in the corpus | A recognised tell in itself (treadmill) | Commit the whole display voice, not one italic word; or drop it | — |
| **All-caps section labels everywhere** | Common "eyebrow" pattern | Overused rhythm | Use sparingly; vary label treatment | All-caps hurts readability past ~2–3 words; keep short |
| **Decorative monospace** | "Techy" signal in corpus | Cliché of "developer product" | Monospace only where it's *semantically* code/data | Mono has lower reading speed for prose |

### 5.3 Layout

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Centered single-column hero + badge-above-H1 + one CTA** | The dominant hero pattern in training data | The universal "AI landing page" | **Deliberate asymmetry**: 60/40 split, off-axis anchor, editorial left-align | Preserve one clear scan path; test at 320 px |
| **Exactly three (or six) equal cards** | Tailwind tutorial reflex ([925studios](https://www.925studios.co/blog/ai-slop-design-tells)) | The single most recognisable feature-section | Break the grid: uneven spans, one 2× feature, list+detail | Keep tab/reading order linear even when visually uneven |
| **Bento grid** | The *new* default (post-2023) | Templatised; now itself a tell | Use only if content genuinely varies in weight; vary cell rhythm | Don't let bento hide primary actions in equal cells |
| **Numbered 1·2·3 step row** | Common "how it works" block | Predictable | Narrative or diagrammatic flow tied to the actual process | Keep steps sequentially navigable |
| **Horizontal stat banner** | "Social proof" reflex | Interchangeable | Integrate proof into context; vary the form | Don't gradient the numbers (5.1) |

### 5.4 Effects & material

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **`rounded-2xl shadow-lg p-6` untouched** | shadcn/ui default component | "Component library, unstyled" | Commit a bespoke radius + elevation scale (→ **A4**) | Keep focus rings visible against new elevation |
| **Glassmorphism (blur + translucency)** | Was the 2021 escape; over-applied | Now core slop; dated | Real-material reference (riso/letterpress/enamel) (→ **A4**) | Text over glass/blur frequently fails contrast — scrim |
| **Neon-on-dark glow** | "Premium/techy" signal | Ubiquitous in AI dark themes | Commit a considered dark palette *or* go light; drop glow | Glow ≠ contrast; verify APCA regardless |
| **Purple gradient orbs/blobs behind hero** | The default "ambient interest" | Instantly "AI hero background" | Content-referenced texture/photograph, or nothing | Keep motion/orbs from competing with text (→ **B1**, **A5**) |
| **Shadow at exactly `0.1` opacity everywhere** | The corpus default shadow | Flat sameness | Layered, direction-consistent elevation set (→ **A4**) | Elevation must also serve real z-hierarchy |

### 5.5 Surfaces & borders

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Flat 1px gray border on every card** | Simplest separation | "Boxed everything" | Separate by **space → tone (3–5 % L shift) → elevation**; border last ([vibecodekit](https://vibecodekit.dev/ai-slop-design)) | Separation must stay perceptible for low-vision (non-text contrast) |
| **Coloured 3–4px left-border strip** | Common "callout/alert" snippet | "Single most reliable AI tell" | Reserve for *true* semantic state (error/success), not decoration | If used for state, pair with icon/text, not colour alone |
| **Every block boxed** | Cards are the safe container | Rhythmless, cluttered | Let some content sit directly on the ground; group by proximity | Maintain grouping clarity without the box |

### 5.6 Iconography & imagery

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Centered thin-line icon above each heading** | Lucide/Heroicons default pattern | Interchangeable; "any product" | Bespoke or duotone icon set; or drop icons where text suffices; commit one icon *voice* | Icons need labels; never icon-only for key actions |
| **Floating 3D abstract blobs** | "Modern hero art" reflex | Meaningless, ubiquitous | Real diagram, product screenshot, or commissioned/generated-but-specific art | Decorative art needs `alt=""`; don't encode meaning in it |
| **Over-smooth "plastic" 3D illustration** | Common stock/AI-art look | Corporate-Memphis-successor cliché | A committed illustration style tied to brand (line, riso, photographic) | Ensure illustration doesn't carry unlabeled meaning |
| **Generic stock photography** | Safe filler | Soulless, off-brand | Specific, real, or content-derived imagery | Real contrast/alt requirements apply |

### 5.7 Copy (the verbal slop signature)

| The cliché | Why models converge on it | Why it reads generic | The escape move | Usability caveat |
|---|---|---|---|---|
| **Weightless triad** "Build faster. Ship smarter." / "Fast, efficient, reliable" | Snappy triads are high-probability text | Says nothing product-specific ([925studios](https://www.925studios.co/blog/ai-slop-design-tells)) | One concrete claim only your product can make | Keep headline scannable; specificity ≠ length |
| **"It's Not X, It's Y" / parallelism abuse** | Reflexive rhetorical device ([Field Guide](https://www.ignorance.ai/p/the-field-guide-to-ai-slop)) | Recognised AI cadence | Plain declarative; lead with the noun | — |
| **Vapid opener** "In today's fast-paced world…" | High-probability filler | Instantly AI-authored | Delete; start at the specific point | — |
| **Em-dash-heavy cadence** | Statistically over-represented in AI text (usage ~tripled) | A widely-cited (if over-belaboured) tell | Vary sentence structure and length; don't *avoid* em-dashes mechanically — vary rhythm | Don't sacrifice clarity chasing a punctuation ghost |
| **Emoji-led bullets** | GPT-family list habit (Claude does this rarely) | "No human formats a product page this way" | Plain bullets or none; let hierarchy carry it | Emoji as sole label harms screen readers |

---

## 6. Worked examples

Concrete de-genericising. Each keeps usability intact and applies *one bold place* + *counting defaults*.

### 6.1 Generic SaaS hero → de-genericised (token/layout/material diff)

**BEFORE (templated tax ≈ 9/10 — see §7):**

```html
<section class="hero">                <!-- centered single column -->
  <span class="badge">🚀 New</span>    <!-- badge above H1 + emoji -->
  <h1>Build faster. Ship smarter.</h1> <!-- weightless triad -->
  <p>The all-in-one platform for modern teams.</p>
  <button class="cta">Get Started</button>
  <div class="cards">                  <!-- exactly three equal cards -->
    <div class="card"><LucideZap/>…</div>
    <div class="card"><LucideShield/>…</div>
    <div class="card"><LucideRocket/>…</div>
  </div>
</section>
```
```css
:root{ --accent:#6366f1; --font:Inter; --radius:1rem; }
.hero{ text-align:center; background:#fff; }
.cta{ background:linear-gradient(90deg,#6366f1,#8b5cf6); border-radius:1rem;
      box-shadow:0 10px 15px rgba(0,0,0,.1); }
.card{ border:1px solid #e5e7eb; border-radius:1rem;
       box-shadow:0 10px 15px rgba(0,0,0,.1); }
```

**AFTER (templated tax ≈ 1/10). This is a *product for independent bakeries*, so tokens are content-derived.**

Specific changes, dimension by dimension:

| Dimension | Before | After | Move |
|---|---|---|---|
| **Accent** | `#6366F1` stock indigo | `oklch(0.62 0.14 55)` — a *crust/amber* derived from the product domain | Content-derived token (A1) |
| **Ground** | pure `#fff` | `oklch(0.98 0.01 85)` — warm paper, not white | Tint the neutral |
| **Type** | Inter everywhere | **Fraunces** (display, headline only) + **Newsreader** (body) — both OFL | Display+body pairing (A2) |
| **Hierarchy** | 400/600 | 300 body / **900** headline | Extreme weight contrast |
| **Layout** | centered, 3 equal cards | **70/30 asymmetric split**: oversized headline left, one product photo right; features as a **left-aligned list**, not equal cards | Deliberate asymmetry + one bold place |
| **Material** | glass + `shadow-lg` | subtle **riso grain** on the accent field via SVG `feTurbulence`; flat 1px borders removed, separated by a `4 % L` tone shift | Real-material reference (A4) |
| **Copy** | "Build faster. Ship smarter." | "Know exactly how much flour to order on Tuesday." | Specific claim only this product can make |
| **Icons** | 3 centered Lucide | dropped; a single hand-set numeral drives the one stat that matters | Remove default iconography |

```css
:root{
  --accent: oklch(0.62 0.14 55);      /* content-derived, not #6366f1 */
  --paper:  oklch(0.98 0.01 85);      /* warm, not #fff */
  --ink:    oklch(0.25 0.02 60);
  --display: "Fraunces", Georgia, serif;   /* OFL, self-hosted */
  --body:    "Newsreader", Georgia, serif;  /* OFL, self-hosted */
  --radius: 6px;                       /* bespoke, not 1rem/2xl */
}
.hero{ display:grid; grid-template-columns: 70% 30%; background:var(--paper); }
.hero h1{ font:900 clamp(3rem,7vw,6rem)/0.95 var(--display); color:var(--ink);
          text-align:left; letter-spacing:-0.02em; }         /* one bold place */
.hero .body{ font:300 1.125rem/1.6 var(--body); max-width:62ch; }
/* CSP/offline-safe grain — no network, no eval, degrades to flat */
.field{ position:relative; background:var(--accent); }
.field::after{ content:""; position:absolute; inset:0; pointer-events:none;
  opacity:.09; mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,\
    <svg xmlns='http://www.w3.org/2000/svg'><filter id='g'>\
    <feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/>\
    </filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>"); }
```

**Usability preserved:** headline/body pairs are checked for APCA `Lc` ≥ 75; the CTA `--accent` on `--paper` is verified for `Lc` ≥ 45 as a large control; the 70/30 split keeps a single top-to-bottom reading order; grain sits on the *accent field*, never under body copy; no border removal drops separation below perceptible tone contrast.

**CSP/offline note (only place it's needed):** the grain is an **inline SVG `feTurbulence`** encoded as a `data:` URI — **no network, no `eval`, strict-CSP-safe**, and it degrades to a flat accent field if filters are unsupported. This replaces the default gradient/glass with a *material* at ~0 bytes of asset weight. Self-hosted fonts must be **subset + embedded** (woff2, base64 `@font-face` or bundled) because a strict CSP with no `font-src` external + offline requirement blocks Google Fonts' CDN; see §9 for licences.

### 6.2 "One bold place" applied to a dashboard (distinctiveness where it's safe)

A data dashboard *must* stay conventional (scan-ability, density, learnability). "Be weird everywhere" would wreck it. So concentrate all distinctiveness in **one** low-risk surface:

- **The 95 % conventional base:** standard table/grid, neutral tokens, familiar controls, all states designed, APCA-passing. *No* experimentation in the working surface.
- **The one bold place:** the **empty state / first-run hero** and the **primary KPI tile** get a committed display face, a content-derived accent field with riso grain, and one oversized numeral. These are read once or glanced at — high memorability value, low interaction risk.
- **Result:** the product is *recognisably itself* on the screens users screenshot and remember, while the daily-driver surface stays boring-on-purpose. Distinctiveness is **placed where usability tolerates it**, not spread where it doesn't.

**Decision rule for "where is the one bold place?":** the surface with the *highest memorability-to-interaction-frequency ratio* — hero, empty state, onboarding, marketing, 404, sign-in — *not* the dense working surface.

### 6.3 Content-derived accent, worked (defeating stock indigo, cross-ref A1)

Product: a **tide/surf-conditions** app. Method (F2 mandates *that* it's derived; A1 owns *how*):

1. **Seed from content:** sample the product's core imagery (ocean at the app's home break) → dominant hue lands ~200–210° (deep sea-green-blue), *not* 250° indigo.
2. **Pick the seed in OKLCH:** `oklch(0.55 0.11 205)` — a hue no framework ships as a default.
3. **Build the ramp** perceptually (A1): tints/shades at fixed L steps; reserve semantic red/amber/green outside the brand hue.
4. **Verify:** accent-on-paper CTA hits APCA `Lc` ≥ 45; link text hits `Lc` ≥ 75 or gets underline+weight.
5. **Result:** an accent that is *specific to this product's content* and *cannot be produced by another product's derivation* — the opposite of a shared stock swatch. Templated tax on the colour dimension: **0**.

---

## 7. The objective "does this look templated?" rubric

**The track's headline deliverable.** Score by **counting default choices**, not by taste. Each row is a binary, checkable signal; a "yes, it's the default" = **1 point of templated tax**. Run it on the rendered output (screenshot + DOM/CSS).

### 7.1 The scorecard (0 = bespoke, 1 = machine-default)

| # | Dimension | Signal (score 1 if TRUE) | How to check |
|---|---|---|---|
| 1 | **Accent hue** | Accent sits in **240–280°** (indigo/violet) OR equals `#6366F1`/`#8B5CF6`/`#A855F7` | Read the primary/CTA colour; convert to hue |
| 2 | **Accent provenance** | Accent is **not** justifiable from content (no derivation, no brand source) | Ask: what content produced this hue? If "none", score 1 |
| 3 | **Gradient** | A **purple/indigo→blue/cyan gradient** appears on hero/CTA/numbers | Inspect backgrounds and text fills |
| 4 | **Palette shape** | **No dominant** hue (evenly-weighted) OR pure `#fff`/`#000` ground | Check for 60/30/10; check ground tokens |
| 5 | **Headline font** | Headline is **Inter/Roboto/Open Sans/Geist/Poppins/Space Grotesk** | Read `font-family` on H1 |
| 6 | **Type pairing** | **No display+body pairing** (one sans for everything) | Compare H1 vs body font |
| 7 | **Hierarchy** | Weight steps are **gradual** (400/500/600), no strong contrast | Inspect font-weights |
| 8 | **Hero layout** | **Centered single column**, badge-above-H1, one CTA | Look at hero structure |
| 9 | **Feature grid** | **Exactly three (or six) equal cards** OR default bento | Count cards / check spans |
| 10 | **Card material** | `rounded-2xl` + `shadow-lg` + `0.1`-opacity shadow, untouched | Inspect radius/shadow tokens |
| 11 | **Separation** | **Flat 1px gray border** on cards OR coloured left-strip decoration | Inspect borders |
| 12 | **Effect** | **Glassmorphism** OR neon-glow OR purple **orbs/blobs** behind hero | Look at hero background/effects |
| 13 | **Iconography** | **Centered thin-line (Lucide/Heroicons)** icon above each heading | Inspect icon set + placement |
| 14 | **Imagery** | Floating 3D blobs / plastic 3D illustration / generic stock | Look at hero art |
| 15 | **Copy** | Weightless triad / "It's Not X, It's Y" / vapid opener / emoji bullets | Read the headline + bullets |
| 16 | **Mode** | **Dark mode shipped as the reflexive default** (not a chosen direction) | Check default theme + whether a choice was made |
| 17 | **States** | Missing focus states / undesigned empty + error states | Tab through; trigger empty/error |
| 18 | **Motion** | Identical fade-ins on everything / bounce-on-every-hover / snap transitions | Observe interactions (→ **B1**) |

### 7.2 Score bands (decision rule)

| Templated tax (of 18) | Verdict | Action |
|---|---|---|
| **0–2** | Distinctive & deliberate | Ship (pending G2 critique + A5 conformance) |
| **3–5** | Mostly bespoke, a few defaults leaked | Fix the flagged rows; re-score |
| **6–9** | Reads templated | Apply escape moves §4.3 to the top-scoring dimensions; re-score |
| **10+** | Full "AI slop" | No aesthetic decision was made — go back to Move 1 (commit a direction, F1) |

**Weighting note (taste-flagged):** rows **1, 2, 5, 8, 9** are the *highest-signal* tells (accent, provenance, headline font, hero, card grid) — the ones a human notices in the first second. If any *three* of those five are 1, treat as templated regardless of total. Rows 17–18 are *usability/quality* leaks that co-occur with slop but are owned by A5/B1/G2 — count them, but fix via those tracks.

**How this is objective:** every row is a binary you can read off the DOM/CSS or a screenshot without opinion. "Is the accent hue in 240–280°?" is a measurement. "Is it Inter?" is a string check. The rubric converts "looks AI-generated" from vibe into a **countable score**, which is exactly what an agent (and an auditing owner) can act on.

---

## 8. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **No decision made** | Templated tax ≥ 6; every dimension is the default | Move 1: commit one direction, freeze tokens (F1) before styling |
| **Stock indigo accent** | Hue 240–280° / `#6366F1` | Content-derived accent (Move 2, A1); rotate hue band |
| **"Weird everywhere" over-correction** | Low tax but *unusable* — chaotic, illegible, no scan path | Concentrate to **one bold place** (Move 3); revert distinctiveness that trips a §4.4 guardrail |
| **Escape-that's-now-a-tell** | "Distinctive" font/layout still scores generic (Space Grotesk, bento, serif-italic word) | Re-baseline against the *current* mean (§4.5); the catalogue rots |
| **Adjective spiral** | Owner/agent iterating on "cleaner", "more premium", no change | Symptom of fused taste+implementation ([superdesign](https://superdesign.dev/blog/why-ai-design-looks-generic)); inject a *specific* constraint/reference instead |
| **Distinctive but inaccessible** | Bespoke look, but APCA fails / no focus / undesigned empty state | Guardrails §4.4; conformance → **A5**; states → G2. Revert offending move |
| **Timid palette** | No dominant; everything mid-saturation | 60/30/10; force a dominant + one sharp accent |
| **Boxed everything / border reflex** | Flat 1px borders + left-strips (rows 11) | Space → tone → elevation; border last (A4) |
| **Weightless copy** | Rows 15 flags; headline any competitor could use | One concrete product-specific claim; kill triads/emoji bullets |
| **Gradient/glass reflex** | Rows 3, 12 | Flat committed colour or real-material reference (Move 5, A4) |
| **Dark-by-default** | Ships dark with no light option or rationale | Make mode a *choice*; offer both; don't default dark |
| **Feedback-loop drift over time** | Outputs trend *more* generic across builds | Periodic re-baseline (§8 open Q); don't train prompt-libraries on your own past output |
| **Over-fitting to one reference** | Every output looks like the *same* single reference (e.g. "make it like Stripe") | Reference is a *seed*, not a target; vary per content (G1 owns option spread) |

---

## 9. Pre-ship "generic?" audit checklist

Run before shipping any variant. (The scored version is §7; this is the fast gate.)

- [ ] **A direction was committed and recorded** before styling (tokens frozen) — not defaulted (§4.3 Move 1).
- [ ] **Accent is content-derived or justified**, and **out of the 240–280° indigo/violet band** (§5.1, A1).
- [ ] **No purple/indigo→blue/cyan gradient** on hero/CTA/numbers (§5.1).
- [ ] Palette has a **dominant** (60/30/10); ground is **tinted**, not pure `#fff`/`#000` (§5.1).
- [ ] **Headline is not Inter/Roboto/Geist/Poppins/Space Grotesk**; there's a **display+body pairing** with **weight contrast** (§5.2, A2).
- [ ] Hero is **not** centered-single-column-badge-above-H1; there is **deliberate asymmetry** with a clear reading order (§5.3).
- [ ] Feature section is **not** exactly-three-equal-cards / default bento (§5.3).
- [ ] Cards are **not** `rounded-2xl shadow-lg` defaults; separation is **space → tone → elevation**, not flat 1px border or decorative left-strip (§5.4–5.5, A4).
- [ ] **No default glassmorphism / neon glow / purple orbs**; effects reference a **real material** if present (§5.4, A4).
- [ ] Icons are **not** centered-thin-line-Lucide-above-every-heading; imagery is **specific**, not blobs/plastic-3D/stock (§5.6).
- [ ] Copy is **specific to this product** — no weightless triad, "It's Not X, It's Y", vapid opener, or emoji bullets (§5.7).
- [ ] Dark mode is a **choice**, not the reflexive default (§7 row 16).
- [ ] **One bold place** identified; the rest is quiet and conventional (§4.3 Move 3).
- [ ] Every escape move **passes its §4.4 usability guardrail** (APCA, focus, states, 320 px, reading order) — conformance owned by **A5**.
- [ ] **Templated tax scored ≤ 2** (§7), and **no 3-of-5 high-signal rows** (1,2,5,8,9) are flagged.
- [ ] Any recommended **font/texture asset is free + self-hostable** with licence noted (§10); grain is CSP/offline-safe SVG, not a fetched raster (§6).

---

## 10. Open questions / unverified

- **The specific 2026 cliché catalogue (§5) is expert/community consensus, not a controlled study.** Only the *fact of homogenisation* (Goree et al., CHI 2021) is peer-reviewed and it predates modern generative models. No public, rigorous study yet measures *AI-specifically-generated* UI against human-designed UI on the exact tells in §5. Treat §5 as a well-corroborated working description, re-baselined on a schedule (§4.5) — **not** as measured constants. *(Evidence: strong for "generic is real", moderate/consensus for "these are the 2026 specifics".)*
- **The Tailwind-indigo origin story is a plausible, multiply-attributed narrative, not a controlled attribution.** Several independent authors trace stock indigo to `bg-indigo-500` and Adam Wathan's ~2020 placeholder choice; none isolates it experimentally. The *mechanism* (a default saturating tutorials → training mode) is convincing but not proven causally. Use as a strong heuristic. ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [dev.to/alanwest](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p))
- **Convergence mechanisms (b)–(e) are argued, not measured from model internals.** "Distributional convergence," ease-of-implementation bias, safety/blandness, and feedback-loop contamination are reasonable and consistent across sources, but no cited work opens the model to *prove* which dominates. The safety/RLHF contribution is the weakest-evidenced — flagged in §4.2(d).
- **The templated-ness rubric's thresholds (§7) are a proposed instrument, not a validated one.** Hue band 240–280°, the score bands, and the "3-of-5 high-signal" rule are *this report's synthesis* for actionability; they haven't been calibrated against human "looks templated" judgments at scale. Ship as a v1 heuristic; validate against G2's critique data over time.
- **APCA `Lc` targets (75/45/30)** are taken from the escape-guide sources and align with APCA guidance, but APCA itself is not yet a WCAG-normative standard — **A5 owns the current conformance call**; F2 only flags where an escape risks contrast.
- **"One bold place" and asymmetry as usability-neutral** are strongly-held craft consensus (and consistent with the diverge-with-purpose evidence), but the *specific* claim "asymmetry costs no usability if reading order is preserved" is taste-grounded, not measured. Test per product.
- **Re-baseline cadence is unspecified.** The catalogue rots (§4.5) but no source gives a rate. Recommend re-checking §5/§7 against current AI output **quarterly**; treat any escape that appears in 3+ starter kits as promoted-to-tell. *(Unverified heuristic.)*

---

## 11. Sources

**Empirical / peer-reviewed (the hard evidence):**
- [Goree, Doosti, Crandall & Su — *Investigating the Homogenization of Web Design: A Mixed-Methods Approach*, CHI 2021](https://dl.acm.org/doi/abs/10.1145/3411764.3445156) — 227k+ screenshots, ~10k sites, 2003–2019; diversity peak ~2008–2010, sharp convergence after; drivers: responsive frameworks, CMS templates, SEO. **The core evidence that homogenisation is real and predates AI.**
- [Jon Kolko — summary of the homogenization study](https://www.jonkolko.com/phd/writing/25-07-12-homogenization-of-web-design) — "layout similarity distance declined ~44 % from 2010–2019"; corpus size; causal factors.
- [OneZero — *It's Not Just You: Websites Really Do All Look the Same Now*](https://onezero.medium.com/its-not-just-you-websites-really-do-all-look-the-same-now-d8050b8ea743) — popular write-up of the same study; "most dissimilar 2008–2010", "significantly less common 2010–2016"; Sam Goree quote.

**Convergence mechanism + escape method (expert/community, consistent):**
- [prg.sh — *Why Your AI Keeps Building the Same Purple Gradient Website*](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website) — "median of every Tailwind tutorial 2019–2024"; indigo origin; constraints/references/negation; role assignment.
- [SmoothUI — *AI Design Slop: Why AI-Generated UI Looks Generic*](https://smoothui.dev/blog/ai-design-slop) — coins "distributional convergence"; two-layer compounding (average + easy-to-implement); process-over-prompt fixes.
- [Superdesign — *Why AI Design Looks Generic (2026)*](https://superdesign.dev/blog/why-ai-design-looks-generic) — cliché set with hex values (`#6366F1`, `#8B5CF6`, `#A855F7`, `#F9FAFB`); training-distribution mechanism; the "cleaner/more premium" adjective-spiral diagnostic; extreme weight-contrast tip.
- [dev.to/alanwest — *Why Every AI-Built Website Looks the Same (Blame Tailwind's Indigo-500)*](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p) — indigo origin (~2020 placeholder), feedback-loop contamination.

**The cliché catalogue + objective rubric material:**
- [vibecodekit — *AI Slop Design: Why AI-Generated UI Looks Generic (Fix Guide 2026)*](https://vibecodekit.dev/ai-slop-design) — **richest single tell-list + fixes**: coloured left-strip "single most reliable tell", dark-mode-default "single most common tell", `rounded-2xl shadow-lg` defaults, Space Grotesk/Geist/Poppins as tells, bento reflex, orbs; 60/30/10; borderless separation order; 8pt grid; APCA `Lc` 75/45/30; anti-slop checklist.
- [925studios — *AI Slop Fonts and Gradients: The Tells That Give Away AI Design*](https://www.925studios.co/blog/ai-slop-design-tells) — Inter default, indigo-purple gradient, three-cards, thin-line icons, "Build faster. Ship smarter." weightless copy; brand-decision-before-tool fix.
- [Charlie Guo — *The Field Guide to AI Slop*](https://www.ignorance.ai/p/the-field-guide-to-ai-slop) — copy tells: em-dash tripling, "It's Not X, It's Y", snappy triads, vapid openers, emoji bullets (GPT vs Claude), monotone sentence length.
- [Dialogue Theory — *UI Design in 2025 is Diverging: That's a Good Thing*](https://www.dialoguetheory.com/ideas/interface-design-is-diverging-thats-a-good-thing) — named brand escapes (Anthropic scribbles, Arturia diagrammatic, Notion, Airbnb 3D icons, Open textures); distinctiveness-with-usability sweet spot.

**Escape assets (free + self-hostable; licences verified from source):**
- **Fraunces** — display serif, **SIL Open Font License 1.1**; [Google Fonts](https://fonts.google.com/specimen/Fraunces), self-host via [Fontsource](https://fontsource.org/fonts/fraunces) (npm/download, no CDN).
- **Newsreader** — editorial serif, **SIL OFL 1.1**; [Google Fonts](https://fonts.google.com/specimen/Newsreader), Fontsource.
- **Instrument Serif** — high-contrast display, **SIL OFL 1.1**; [Google Fonts](https://fonts.google.com/specimen/Instrument+Serif).
- *(Space Grotesk, Geist — also OFL — are listed here only as **cautionary former-escapes now flagged as tells**, per vibecodekit; not recommended as headline defaults.)*
- **Grain/texture:** SVG `feTurbulence` filter — **web-platform, no licence, no network, strict-CSP-safe** (inline `data:` URI); see §6. Preferred over any fetched raster texture for the offline/CSP constraint.
- **Self-hosting note (CSP/offline):** under a strict CSP with no external `font-src` and an offline requirement, Google Fonts' CDN is blocked — **subset the woff2 and embed** (`@font-face` base64 or bundled file). Fontsource packages these OFL fonts for exactly this self-hosted path. Font *token* implementation → **A2**.
