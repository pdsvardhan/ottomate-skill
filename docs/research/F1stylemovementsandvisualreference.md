# F1 — Style movements & visual reference

*Design-intelligence reference. Track F1 of the registry research map. Written to be read by the design agent before it commits to a named aesthetic direction, and by a human owner auditing that choice. Companion to **F2** (F2 gets a design *out* of the generic statistical centre; F1 says *where to land* and how to land there convincingly). Current as of **July 2026**; movement facts are cited to design-history/trade sources, execution specs cross-reference the sibling tracks that own the token mechanics, and synthesis is flagged inline.*

---

## 1. Scope line

This track owns **the catalogue of named, committable aesthetic directions** a general-purpose UI can be built in — Swiss/International Typographic, editorial/magazine, brutalism, neo-brutalism, minimalism, maximalism, glassmorphism, neumorphism, claymorphism, skeuomorphism, retro/terminal, cyber/technical, organic/soft, luxury/premium, playful, Bauhaus/geometric modernism, Memphis/postmodern, Art Deco, Y2K/Frutiger Aero, and Material/dynamic-adaptive — and for each: what it looks/sounds/moves like at a high level (type classification, colour behaviour, shape/space/shadow character, motion character), what it *signals* to a viewer, when it is the right call, how it fails, and **how to execute it convincingly instead of as a costume**. It also owns translating a client's loose adjectives into a named direction, and building a direction out of a specific domain's own materials rather than a movement's generic stock motifs.

---

## 2. Boundary (what this track does **not** cover)

- **The tokens that implement a chosen direction** — the actual OKLCH colour ramp, the type scale and pairing mechanics, the spacing/grid system, the exact shadow/radius/blur recipe → **A1 Colour**, **A2 Typography**, **A3 Space, layout & composition**, **A4 Shape, depth & material**. F1 names the direction and states its recipe *at the level of a design decision* ("neo-brutalism uses a flat, single-colour, unblurred offset shadow"); **A1–A4 own the numbers that make that decision real** (the exact hex/OKLCH, the exact `box-shadow` string, the exact grid). Every per-movement spec below cross-references the owning track.
- **Escaping generic/templated sameness** → **F2 Distinctiveness & anti-generic design**. F2's own boundary states this split precisely: *"F2 says 'escape the statistical centre'; F1 says 'here is how to commit to a specific off-centre point and do it well.' F2 gets you out of the default basin; F1 tells you where to land."* A design can follow every rule in this track and still be generic *within* its chosen movement (a neo-brutalist site that looks like every other neo-brutalist template) — that residual genericness is F2's rubric to catch, not F1's. Conversely F2 explicitly flags glassmorphism, bento grids, and reflexive dark mode among its **current slop tells** (§5.7, §5.20 below) — this track teaches how to execute those directions well *when they are the right choice*; F2 teaches how to tell whether reaching for them was itself a lazy default.
- **The method for generating and converging on a *set* of options** (how many variants, isolating a decision axis, when to lock) → **G1 Variant generation & convergence**. F1 is the catalogue G1 draws named directions *from*; G1 governs how many directions to show, how to verify they actually differ, and when to stop.
- **Whether a chosen accent/shadow/effect is worth its performance or accessibility cost** → **A5 Accessibility** (conformance math) and **E1 Performance** (byte/render budget); E1's own boundary names this track **"F1 Aesthetic judgement"** for the question "does this effect's cost buy anything." F1 flags, per movement, which directions are structurally high-risk (glassmorphism, neumorphism, cyber-neon, dark terminal) and says *when not to reach for them*; A5 owns the pass/fail math.
- **Coherence across independently-built components** ("do all my buttons still look like one system") → **C2 Design systems, tokens & coherence**. C2 says it plainly: *"Whether the result is pretty, on-trend, or distinctive → F1/F2. C2 guarantees consistency; a perfectly coherent system can still be ugly."* F1 picks the aesthetic; C2 proves every component actually drew from it.
- **Icon-set construction, brand-mark/logo handling, and illustration-system rules** → **D2 Iconography, imagery & brand marks**. F1 describes what an icon/illustration *should feel like* inside a given movement (thin-line vs. filled, geometric vs. hand-drawn); D2 owns grid, stroke, optical sizing, and sourcing.
- **Sourcing/licence-clean acquisition of fonts, icons, textures at scale** → **H1 Free asset sourcing & ingestion**. F1 names a free/open face per movement with its licence and source as a *design decision*, satisfying this report's own constraint that nothing recommended is invented or unverifiably licensed; H1 owns the full supply-chain verification, subsetting, and provenance ledger.

---

## 3. Executive rules (apply these before reading the body)

1. **Name exactly one direction — or exactly two, with one explicitly dominant — before touching a single token.** "Make it modern and clean" is not a direction. Route it through the adjective-mapping table (§4.2) and confirm with a disambiguating reference (a competitor, an era, a real artifact) before writing any CSS.
2. **Respect the MECE boundary in §2.** This track says *which* named direction and its recipe *at a decision level*; it never re-derives **A1–A4**'s exact token math, never re-litigates **F2**'s genericness rubric, and never decides **G1**'s option count. Cross-reference, don't duplicate.
3. **"Modern," "clean," and "professional" are underspecified — always disambiguate.** Each maps to at least four different directions depending on a second adjective (modern-corporate → Swiss; modern-tech → Material or Cyber; modern-luxury → Luxury/Editorial; modern-playful → Playful). Guessing wrong on a single-word brief is the most common brief-to-direction failure (§4.2, row 9).
4. **State, per direction, which token carries its identity in *both* light and dark mode before building either.** Some movements invert badly by default: skeuomorphism's top-lit warm gradient reads as "wet plastic" in a naive dark flip; brutalism's stark white/black pairing needs a deliberate (not automatic) inversion; Swiss's single accent may need re-tuning for dark contrast. Decide the dark-mode-carrying token on purpose.
5. **A direction is a bet across type + colour + shape/space + motion *together*.** Changing only the colour palette while leaving generic type, radius, and motion in place is the single most common way a "direction" fails to read as intentional — it becomes a re-skinned default, which is exactly what **F2** exists to catch. Every row in the catalogue (§5) specifies all four axes; use all four every time.
6. **Every movement lists 2–3 "authentic vs. cosplay" markers (§5.x). Hit at least two.** These are the specific, checkable details that separate genuine commitment to a direction from a surface-level skin applied late. Fewer than two present is a signal to revisit the build, not ship it.
7. **Treat glassmorphism, neumorphism, cyber-neon-on-black, and dark terminal palettes as high accessibility risk by construction, not by accident.** Verify WCAG **1.4.3** (4.5:1 normal text / 3:1 large text) and **1.4.11** (3:1 non-text/UI-boundary contrast) against the *actual rendered* background, not the mockup, and ship a solid/opaque fallback gated on `prefers-reduced-transparency` / `forced-colors`. Cross-ref **A5**; the exact glass recipe and its own accessibility levers are **A4**'s. ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html))
8. **Prefer a domain's own real artifacts over a movement's stock motifs (§4.3).** A generic leaf icon signals "eco" for any brand; a specific, non-swappable artifact (this domain's actual ledger line, wax seal, waveform, blister pack) can't be handed to a competitor without breaking.
9. **Cap combined directions at two, one clearly dominant.** Three or more simultaneous named movements on one surface is how output becomes incoherent. Pick a dominant grammar; let a second direction contribute exactly one accent move (a colour behaviour, a border treatment), never equal weight.
10. **Match motion *character* to the movement's family archetype before tuning its numbers (§4.4).** Brutalism is abrupt/instant; luxury is slow and un-springy; playful is bouncy; terminal is narrated/staggered. Decide the character here; the exact milliseconds, easing curves, and spring constants are **B1**'s.
11. **Every recommended typeface must be free/open with a licence and source stated — never assume a historically "correct" face is free.** Helvetica, Univers, Akzidenz-Grotesk, Futura, Frutiger, and the original Didot/Bodoni cuts are all commercial/foundry-licensed (Monotype and successors). Use the catalogue's named open substitute (cross-ref **A2**'s classification table) and say so explicitly.
12. **"Premium"/"luxury" is not a synonym for minimalism.** It is minimalism **plus** specific, checkable signals — art-directed (never stock) photography, visible typographic refinement (tracking/kerning discipline), and total restraint (one loose element breaks the illusion). Strip those and a "luxury" build is an empty template (§5.14).
13. **Flag trend-bound choices to the human owner explicitly.** Y2K/Frutiger Aero, neo-brutalism, and Material 3 Expressive's specific shape-morph/spring vocabulary are *live, fast-moving 2025–2026 trends* (sourced, §9) — good bets for a nostalgia/creator/consumer brief, riskier for a brand that must still look correct in three years. Swiss, minimalism, and editorial are the durable defaults; say out loud which kind of bet is being made.
14. **A high-risk or "out of favour" movement is not banned — it is high-context-dependency.** Corporate-Memphis-style illustration, pure neumorphism, and glass-over-body-text are not forbidden; check the row's "when NOT" and failure mode before either defaulting away from a movement or reaching for it out of habit.
15. **When a brief gives no adjectives at all, default to the MECE-safe middle — Swiss-adjacent minimalism with editorial type discipline — rather than inventing a maximalist or brutalist choice nobody asked for.** Boldness is opt-in, never a silent default.

---

## 4. Body

### 4.1 The key questions to answer before naming a direction

1. **What does the brand need to *signal*, not just "look like"?** Every adjective a client offers is really a proxy for a signal (trust, rebellion, exclusivity, warmth). Route through §4.2.
2. **What are this domain's own real materials?** Before reaching for a movement's stock motifs, mine the domain itself (§4.3).
3. **Does this have to survive dark mode, `prefers-reduced-motion`, `prefers-reduced-transparency`, and forced-colors — and which token carries the identity through each?** (Executive Rule 4, §4.5.)
4. **Is this a durable choice or a trend-bound one, and does the human owner know which?** (Executive Rule 13.)
5. **Is one direction enough, or does the brief actually need a dominant direction plus one accent direction?** (Executive Rule 9.)
6. **What would make this read as cosplay instead of commitment?** Every catalogue row (§5) answers this explicitly so the check is never a matter of taste.

### 4.2 Adjective → direction: translating client language

Clients almost never say a movement's name. They say a mood word. The table below is the lookup — **this is original synthesis** (no canonical "adjective dictionary" for aesthetic direction exists in the design literature; it is built from the sourced characteristics of each movement in §5, cross-checked against **A2**'s own brief-adjective-to-typeface-class table, which uses the identical method for type alone). Treat it as a strong starting heuristic to be confirmed with a second, disambiguating reference (a competitor site, an era, a real object) — never ship a direction chosen from one word alone.

| Client says… | Primary direction | Secondary / hybrid | Why | Don't confuse with |
|---|---|---|---|---|
| Trustworthy, clean, professional, corporate | **Swiss / Intl. Typographic** (§5.1) | Editorial, for content-heavy trust | Neutral grid + restrained colour reads competence, not sentiment | **Luxury** — luxury adds material/photographic warmth Swiss deliberately withholds |
| Bold, raw, edgy, disruptive, "unlike everyone else" | **Neo-Brutalism** (§5.4) | Pure Brutalism, if genuinely anti-commercial | Thick borders + flat offset shadow read as confident irreverence | **Cyber/Technical** — edgy-graphic vs. edgy-dystopian-tech; ask which |
| Premium, expensive, exclusive, sophisticated, considered | **Luxury / Premium** (§5.14) | Art Deco, if also "glamorous / 1920s" | Restraint + visible craft signals cost, not just absence of clutter | Plain **Minimalism** — lacks the material/photographic quality that actually reads as expensive |
| Fun, friendly, approachable, human, energetic | **Playful** (§5.15) | Organic/Soft, if also "calm/natural" | Rounded + saturated + springy motion = low-stakes invitation | Watch for **Corporate Memphis** drift (§6) — generic ≠ playful |
| Futuristic, high-tech, sci-fi, "hacker," "the Matrix" | **Cyber/Technical** (§5.12) if danger/elite-tech is implied; **Retro/Terminal** (§5.11) if practitioner/CLI-authentic is implied | — | Disambiguate: dystopian-elite console vs. earned technical credibility | These two are the pair most often confused with each other |
| Nostalgic, retro, throwback, "2000s," Y2K | **Y2K / Frutiger Aero** (§5.19) if glossy/optimistic; **Retro/Terminal** (§5.11) if specifically 1980s–90s computing | — | Disambiguate by decade *and* mood (optimistic-glossy vs. utilitarian-CLI) | Don't default to Terminal just because "retro" was said |
| Natural, calm, wellness, sustainable, organic, earthy | **Organic / Soft** (§5.13) | Minimalism, for a quieter register | Warmer, slower, less loud than Playful | **Playful** — organic is calmer/slower, not toy-energetic |
| Rich, eclectic, expressive, "more is more," loud, maximal | **Maximalism** (§5.6) | Memphis/Postmodern, if also "quirky/irreverent" | Density + layering vs. Memphis's specific pattern-clash-and-asymmetry vocabulary | Ask whether the clash should feel *curated* (Maximalism) or *deliberately wrong* (Memphis) |
| "Modern" **(alone — always ask a follow-up)** | Default **Swiss/Minimal** *pending confirmation* | — | Underspecified: modern-corporate, modern-tech, modern-luxury, and modern-playful are all "modern" and look nothing alike | Never lock tokens from this word alone (Executive Rule 3) |
| Tactile, real, physical, "feels like an object" | **Skeuomorphism** (§5.10) | Claymorphism, for a softer/less literal tactility | Literal material reference vs. abstracted soft-3D | Confirm the domain has a real physical referent, or it reads as decoration (§4.3) |
| Airy, floaty, ethereal, frosted, layered | **Glassmorphism** (§5.7) | — | Depth-through-translucency | **A11y caveat always attached** — see §4.5 before committing |
| Soft, gentle, huggable, touchable, squishy | **Claymorphism** (§5.9), preferred | Neumorphism (§5.8), only for a single decorative control | Clay keeps a real contrast path; pure neumorphism structurally cannot | **A11y caveat always attached** — see §4.5 |
| Systematic, cross-platform, "Google-like," adaptive, smart | **Material / Dynamic-Adaptive** (§5.20) | — | The algorithmic, wallpaper-derived palette *is* the signal | Don't use for an iOS-primary or brand-distinct product — reads as "someone used a component library" |
| Artistic, editorial, "like a magazine," storytelling, authored | **Editorial / Magazine** (§5.2) | — | Oversized display type + asymmetric grid-breaking = "someone chose this" | Not for transactional flows — narrative pacing fights task completion |
| Geometric, disciplined, structured, grid-based | **Swiss** (§5.1), if monochrome/corporate; **Bauhaus** (§5.16), if primary-colour/foundational-modernist | — | This is the single highest-value disambiguation in the table — see below | Swiss ≠ Bauhaus; conflating them is a common error |
| Glamorous, Art Deco, "roaring twenties," opulent-geometric, Gatsby | **Art Deco** (§5.18) | — | A period style with a specific symmetrical-ornament vocabulary | Don't reach for this for a generic "expensive tech" brief — see Luxury instead |
| Quirky, clashing, 80s, postmodern, "Memphis" | **Memphis / Postmodern** (§5.17) | — | Deliberately "wrong" colour/pattern combinations are the point | Diluting the clash into "tasteful" defeats it — see §5.17 |
| Honest, anti-marketing, no-BS, indie, zine | **Brutalism** (§5.3) | Neo-Brutalism, if it still needs to convert/sell | Pure brutalism forgoes conversion optimisation entirely; confirm that's acceptable | Neo-Brutalism is *not* a softer synonym — it is a distinct, more commercial grammar |
| Premium tech, engineered, precise | **Swiss + Luxury hybrid** (max 2 directions, Executive Rule 9) | — | "Swiss grid, luxury type" — one structural grammar, one material register | Don't let both directions compete for dominance — pick one |

**The Swiss-vs-Bauhaus disambiguation, worked:** "geometric" alone is not enough information. Ask: *is the brief's geometry restrained and monochrome, or primary-coloured and playful-foundational?* Swiss (§5.1) is a grid-and-typography discipline expressed mostly in black/white/one accent; Bauhaus (§5.16) is a compositional discipline built from literal circle/square/triangle primitives in a red/yellow/blue triad. A fintech dashboard wanting "geometric and disciplined" almost always means Swiss; a design-education or cultural brand wanting "geometric and foundational" may genuinely mean Bauhaus.

### 4.3 Building a direction from a domain's own materials

Reaching for a movement's stock motifs (a generic leaf for "eco," a generic padlock for "secure") produces output that could belong to any competitor. The stronger move: mine the domain's *own* real artifacts and pass them through the chosen movement's grammar. **This method is original synthesis** — it is a design-process heuristic informed by the researched movements below, not a documented industry-standard procedure; it is offered as a strong, checkable starting method.

**The five-step method:**

1. **Inventory the domain's real artifacts** — not the industry's stock iconography, but the actual physical/cultural objects a person in this domain would recognise (a bank's ledger lines vs. a generic "dollar sign").
2. **Pick exactly one named movement as the grammar** (§5) — the rules for type/colour/shape/motion that will govern everything.
3. **Filter the artifacts through that grammar's rules** — keep only what the chosen movement's vocabulary can express; discard the rest. The same artifact survives translation differently through different grammars (worked example below).
4. **Create one signature detail unique to this brief** — not the movement's generic version of the motif, but a specific rendering of the domain's own artifact that a competitor's brief couldn't reuse unmodified.
5. **Validate by subtraction** — remove the domain artifact and check whether the direction still reads as intentional. If it collapses into generic wallpaper, the movement was carrying the whole thing and the domain material wasn't doing real work.

**Worked example — the same domain material through two different grammars.** Domain: fintech. Real artifact: the ledger grid (ruled columns, tabular alignment, ink stamps).

- **Through Swiss/Minimal (§5.1):** the ledger becomes hairline `1px` table rules on a strict column grid, tabular-lining numerals, one accent (red) reserved for negative amounts — the ledger's *discipline* survives, its *texture* is discarded.
- **Through Skeuomorphism (§5.10):** the ledger becomes a literal receipt-paper card component with a perforated top edge (SVG mask), thermal-printer monospace type, and an ink-stamp "PAID" mark rendered with A4's bevel primitive — the ledger's *texture* survives, rendered as a real object.

Same domain material, two legitimate, clearly different, non-generic outcomes — proving the domain material is doing real work rather than being cosmetic in either case.

**Domain material reference table** (illustrative starting points, not exhaustive — `[SYNTHESIS]`):

| Domain | Real artifacts to mine (not stock icons) | Compatible directions | Signature-detail example |
|---|---|---|---|
| Legal / professional services | Vellum grain, wax seals, statute numbering, ribbon binding, courtroom panelling | Swiss (restrained), Luxury/Editorial, Skeuomorphism (literal seal) | A minimal line-art seal mark used as the loading indicator |
| Fintech / banking | Ledger grid lines, punch cards, graph paper, thermal-receipt type, security microprint | Swiss/Minimal, Neo-Brutalism (challenger-bank energy), Skeuomorphism | Monospace "receipt" transaction list with a perforated divider |
| Developer tools / infra | Terminal, diff/merge views, git graphs, man-pages, commit hashes | Retro/Terminal, Cyber/Technical, Swiss (docs-style) | Inline diff red/green used as the *only* accent pair |
| Healthcare / wellness | Clipboard forms, light-box glow, blister-pack grid, ADA-signage sans | Organic/Soft, Minimalism, Swiss (clinical) | A blister-pack-inspired rounded-cell progress tracker |
| Food / agriculture | Seed packets, hand-lettered market signage, terracotta, produce stamps | Organic/Soft, Editorial, Memphis (market-quirky) | A hand-stamp "verified fresh" badge motif |
| Music / audio | Waveform, vinyl groove, tape reel, VU meter, mixing-board knob | Skeuomorphism (literal knobs), Cyber/Technical (stage/rave), Retro/Terminal (VU mono readouts) | A real animated waveform scrubber instead of a generic progress bar |
| Real estate / hospitality | Architectural blueprints, brass fixtures, floor-plan linework | Luxury/Editorial, Art Deco (historic property), Swiss (blueprint-grid) | Blueprint linework at very low opacity as background texture only |
| Education / kids | Crayon/marker texture, sticker sheets, ruled exercise-book lines | Playful, Organic/Soft, Memphis (energetic) | Ruled-notebook lines behind a "notes" feature specifically, not everywhere |

### 4.4 Motion character by movement family

This track names the motion *character* each family implies; the exact duration ladder, easing curves, and spring constants are **B1**'s (its duration bands: short 50–200 ms, medium 250–400 ms, long 450–600 ms, extra-long 700–1000 ms; its damping-ratio guidance for springs, ζ).

| Movement family | Motion archetype | B1 duration band | Easing/spring character |
|---|---|---|---|
| Swiss / Minimalism / Material (base) | Functional only, no flourish | Short (100–200 ms) | Standard ease-in-out |
| Editorial / Luxury | Slow, deliberate | Medium–long (300–600 ms) | Gentle ease-out; never a spring/bounce |
| Brutalism | Instant / none | None–short (0–100 ms) | Linear or no easing — abruptness is the point |
| Neo-Brutalism / Claymorphism | Punchy press-response | Short (100–150 ms) | Scale/translate snap (§5.4, §5.9) |
| Playful / Y2K-Aero | Springy, bouncy | Short–medium (150–300 ms) | Spring, B1 ζ ≈ 0.4–0.6, visible overshoot |
| Glassmorphism | Soft cross-fade | Medium (200–300 ms) | Ease-out entrances |
| Skeuomorphism | Mechanical settle | Short–medium (100–250 ms) | Slight overshoot-then-settle |
| Retro / Terminal | Narrated (typewriter/boot) | Slow stagger (120–150 ms/line) | Linear — deliberately mechanical |
| Cyber / Technical | Glitch burst + hold | Very short burst (<100 ms) + hold | Sharp, non-eased cuts |
| Organic / Soft | Ambient breathing | Long/looping (1–3 s+) | Sinusoidal ease-in-out, small displacement |
| Maximalism / Memphis | Layered, erratic | Mixed per layer | Deliberately varied — part of the composition |
| Art Deco | Elegant, symmetrical reveal | Medium (300–500 ms) | No bounce; stroke-draw ornament assembly (B1's SVG stroke-draw technique) |

### 4.5 The accessibility-risk movements — when NOT to reach for glass or neumorphism

Two of this catalogue's most requested directions are structurally the two highest accessibility risks in it. This is not a minor caveat — **A4** (which owns the exact recipe) already flags neumorphism as *"an a11y liability → A5... notoriously low contrast & ambiguous; add borders or avoid,"* and Nielsen Norman Group's own glassmorphism guidance is explicit that unmitigated use "creates significant accessibility and usability challenges — particularly text readability." ([NN/g — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/), [A4 §4.5](/home/claude/A4-shape-depth-and-material.md))

**Glassmorphism (§5.7).** The risk is structural: the panel's fill is *necessarily* semi-transparent, so its effective contrast against text depends on whatever happens to render behind it — a variable the designer doesn't fully control. **A4**'s verified recipe is `backdrop-filter: blur(8–20px) saturate(120–180%)` plus a 1px top highlight and a border ([A4 §3, rule 7](/home/claude/A4-shape-depth-and-material.md)); NN/g adds that *"more background blur is better, especially with intricate backgrounds"* because a half-blurred, half-legible background is worse than a fully-obscured one; Axess Lab separately cautions against relying on blur strength alone and to keep body text at **4.5:1** and larger/bold UI at **3:1**, using an opaque scrim behind text rather than trusting the blur to deliver contrast. **Read together, these are complementary, not contradictory:** blur enough to fully obscure background detail (NN/g's point), but never treat blur amount as your contrast mechanism — get real contrast from fill opacity or a scrim (Axess Lab's point). **When NOT to use it:** text-dense reading surfaces, any legal/financial UI where guaranteed contrast is non-negotiable, low-end-device targets (blur is GPU-costly — cross-ref **E1**), or anywhere a solid/opaque `prefers-reduced-transparency` fallback cannot realistically be built and tested. ([NN/g](https://www.nngroup.com/articles/glassmorphism/), [Axess Lab](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/))

**Neumorphism (§5.8).** The risk is more fundamental than glass's: the style's entire visual language is *sameness* — element and background share almost the same base colour, with all depth communicated by two very-low-contrast offset shadows. This directly collides with WCAG **1.4.11** (3:1 non-text/UI-boundary contrast): a neumorphic control that looks "correct" for the style frequently **cannot pass 1.4.11 without a deliberate override** (adding a hairline border, which partially breaks the illusion). **When NOT to use it:** as a system-wide UI style, on any text-bearing or data-dense surface, or on any product with a compliance mandate. **When it's defensible:** a single, narrow, decorative control (one hero toggle, one music-player dial) where the *surrounding* UI supplies the product's real contrast and hierarchy. **Prefer Claymorphism (§5.9) instead** when the "soft 3D" signal is wanted — it fixes exactly this problem by allowing genuine colour contrast between element and background while keeping a similar tactile read. ([Wikipedia — Neumorphism](https://en.wikipedia.org/wiki/Neumorphism), [A4 options catalogue](/home/claude/A4-shape-depth-and-material.md))

**The general rule for both:** run the WCAG **1.4.3**/**1.4.11** check (→**A5**) against the actual rendered surface before shipping either style, always pair the effect with a redundant non-colour/non-transparency signal (a real border on focus, an icon, a label), and always build and test the `prefers-reduced-transparency` / high-contrast fallback rather than assuming the effect degrades gracefully on its own.

### 4.6 Worked examples — one component, two directions, concrete tokens

Two components, each rendered in two contrasting named directions, with the specific decision-level tokens each would carry into **A1/A2/A3/A4/B1**'s mechanics. These are *copyable starting points at the recipe level*, not production-grade token sheets — the exact hex/OKLCH values, gamut-clamping, and elevation-ladder maths belong to A1/A4.

**Worked example A — a pricing card, in Swiss/Minimal vs. Neo-Brutalism**

*Swiss/Minimal (§5.1):*
```css
.card--swiss {
  background: #ffffff;
  border: 1px solid #e4e4e7;      /* hairline, cross-ref A4 §4.2 */
  border-radius: 4px;              /* A4 radius-xs */
  box-shadow: none;
  padding: 32px;
  font-family: "Public Sans", ui-sans-serif, system-ui;  /* A2: neo-grotesque sans */
}
.card--swiss .price { font-size: 40px; font-weight: 600; letter-spacing: -0.02em; }
.card--swiss .cta {
  background: #09090b; color: #fff; border-radius: 2px; padding: 12px 20px;
  transition: opacity 150ms cubic-bezier(0.2,0,0,1);   /* B1 short band, standard easing */
}
.card--swiss .cta:hover { opacity: 0.85; }              /* no transform — Swiss motion is quiet */
```

*Neo-Brutalism (§5.4):*
```css
.card--neobrutal {
  background: #FFF7E8;
  border: 3px solid #000;
  border-radius: 0;                /* A4 radius-0 — deliberately breaks the "round=friendly" default */
  box-shadow: 6px 6px 0 #000;      /* flat, single-colour, unblurred — breaks A4 rule 5's soft/tinted default on purpose */
  padding: 28px;
  font-family: "Archivo Black", ui-sans-serif;  /* A2: grotesque sans (early) */
}
.card--neobrutal .price { font-size: 44px; font-weight: 900; }
.card--neobrutal .cta {
  background: #FF5A5F; color: #000; border: 3px solid #000; border-radius: 0;
  box-shadow: 4px 4px 0 #000;
}
.card--neobrutal .cta:active {
  transform: translate(4px, 4px); box-shadow: 0 0 0 #000;   /* B1 short band, ~100ms, no easing curve — an instant snap */
}
```

**Worked example B — a navbar/hero panel, in Glassmorphism (dark, accessibility-checked) vs. Skeuomorphism**

*Glassmorphism (§5.7, using A4's verified recipe):*
```css
.panel--glass {
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(16px) saturate(160%);      /* A4 §3 rule 7: 8–20px blur, 120–180% saturate */
  -webkit-backdrop-filter: blur(16px) saturate(160%);  /* Safari prefix, per A4 */
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3); /* A4's inset top-highlight primitive */
}
.panel--glass .title {
  font-family: "Hanken Grotesk", ui-sans-serif;    /* A2: humanist sans, medium+ weight — thin weights disappear over blur */
  font-weight: 600; color: #fff;
}
@media (prefers-reduced-transparency: reduce) {
  .panel--glass { background: #111318; backdrop-filter: none; -webkit-backdrop-filter: none; }
}
```
*Requires a genuine background behind the panel for the effect to mean anything, and the text colour must be checked at 4.5:1 against the worst-case rendered pixels behind it — not the mockup (Executive Rule 7).*

*Skeuomorphism (§5.10, composing A4's bevel + layered-elevation primitives):*
```css
.panel--skeu {
  background: linear-gradient(180deg, #f7f2ea, #e8e0d2 60%, #d9cfbc);
  border: 1px solid #b8a98e;
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(0,0,0,.25),            /* A4 §4.3 contact shadow */
    0 4px 10px rgba(0,0,0,.18),           /* A4 §4.3 ambient shadow */
    inset 0 1px 0 rgba(255,255,255,.8),   /* A4 §4.2 top inset highlight */
    inset 0 -2px 3px rgba(0,0,0,.12);     /* A4 §4.2 bottom inset shade */
}
.panel--skeu .title {
  font-family: "IBM Plex Serif", serif;    /* A2: humanist/old-style serif — "tradition, warmth" */
  color: #4a3f2d; font-weight: 600;
  text-shadow: 0 1px 0 rgba(255,255,255,.7);  /* emboss cue — verify contrast WITHOUT the emboss shadow counted */
}
.panel--skeu :active { transform: translateY(1px); }   /* B1 short band, ~100ms, slight overshoot-then-settle */
```

**Worked example C — a login form, in Luxury/Editorial vs. Playful**

*Luxury/Editorial (§5.14):*
```css
.form--luxury { max-width: 360px; margin: 0 auto; padding: 64px 0; }
.form--luxury label {
  font-family: "Jost", ui-sans-serif;      /* A2: geometric sans, light-tracked */
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b6b6b;
}
.form--luxury input {
  border: none; border-bottom: 1px solid #cfcfcf; border-radius: 0;
  padding: 12px 0; font-family: "Cormorant Garamond", serif; font-size: 18px;
  transition: border-color 400ms ease;      /* B1 long-ish, slow, no bounce */
}
.form--luxury input:focus { border-bottom-color: #111; }
.form--luxury button {
  background: #111; color: #fff; border-radius: 0; padding: 14px 28px;
  letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px;
}
```

*Playful (§5.15):*
```css
.form--playful { max-width: 360px; padding: 32px; background: #FFF9E8; border-radius: 24px; }
.form--playful label { font-family: "Fredoka", ui-sans-serif; font-size: 14px; color: #333; }
.form--playful input {
  border: 2px solid #FFD166; border-radius: 14px; padding: 12px 16px;
  font-family: "Nunito", ui-sans-serif;
}
.form--playful input:focus { border-color: #EF476F; box-shadow: 0 0 0 4px rgba(239,71,111,.15); }
.form--playful button {
  background: #06D6A0; color: #003824; border-radius: 999px; padding: 14px 24px; font-weight: 700;
  transition: transform 200ms;              /* B1 short band, spring ζ≈0.5, slight overshoot on success */
}
.form--playful button:hover { transform: translateY(-2px); }
.form--playful button:active { transform: scale(0.97); }
```

---

## 5. Options catalogue — the movements table

Twenty named directions, grouped into rough families for navigation: **systemic/rational** (Swiss, Editorial), **raw/anti-design** (Brutalism, Neo-Brutalism), **reductive** (Minimalism) vs. **abundant** (Maximalism), the **material-illusion family** (Glassmorphism, Neumorphism, Claymorphism, Skeuomorphism), **nostalgia/technical** (Retro/Terminal, Cyber/Technical), **warm** (Organic/Soft, Luxury/Premium, Playful), **historical-decorative** (Bauhaus, Memphis, Art Deco), **contemporary-nostalgia** (Y2K/Frutiger Aero), and **systematic** (Material/Dynamic-Adaptive). Each row is a scan entry; each numbered subsection beneath is the full execution spec.

### 5.0 Master table

| # | Movement | Family | Signals | Best when | Key failure | A11y risk |
|---|---|---|---|---|---|---|
| 5.1 | Swiss / Intl. Typographic | Systemic | Trust, neutrality, engineered precision | Enterprise, B2B, finance, institutional | Grid as an excuse for boring; multiple competing accents | Low |
| 5.2 | Editorial / Magazine | Systemic | Authored point of view, narrative credibility | Publishing, storytelling, portfolios | Big serif + white bg with no real grid-breaking = costume | Low |
| 5.3 | Brutalism | Raw | Honesty, anti-marketing, defiance | Art/portfolio, indie, protest, dev-audience | Incompetence mistaken for intent; broken a11y called "raw" | Medium (unmitigated) |
| 5.4 | Neo-Brutalism | Raw | Confident, loud, startup-defiant | Consumer SaaS, creator tools, youth brands | Inconsistent border/shadow application; low-contrast colour clash | Medium (borders) |
| 5.5 | Minimalism | Reductive | Confidence, focus, product-first | E-commerce photography, single-purpose tools | Absence-of-decision, generic-SaaS sameness | Low |
| 5.6 | Maximalism | Abundant | Abundance, joy, personality-forward | Fashion, beauty, entertainment, youth culture | Clutter — density without hierarchy | Medium (contrast/motion) |
| 5.7 | Glassmorphism | Material-illusion | Depth, layered context, futuristic-soft | Layered dashboards, overlays, media-rich contexts | Text-on-glass contrast failure; over-applied "visual noise" | **High** |
| 5.8 | Neumorphism | Material-illusion | Tactile, soft, calm | One decorative hero control only | System-wide use fails contrast almost by construction | **High** |
| 5.9 | Claymorphism | Material-illusion | Playful-soft-3D, inflated | Onboarding, kid/wellness apps | Overused reads childish; shadow recipe applied inconsistently | Low–Medium |
| 5.10 | Skeuomorphism | Material-illusion | Familiarity, tactility, reassurance | Camera/synth/calculator, premium tactile moments | Bitmap texture (perf); naive dark-mode inversion; embossed low-contrast text | Medium |
| 5.11 | Retro / Terminal | Nostalgia-technical | Technical credibility, hacker authenticity | Dev tools, CLI-adjacent, security/infra | Any non-monospace slip breaks the illusion instantly | Medium (dim text) |
| 5.12 | Cyber / Technical | Nostalgia-technical | High-tech, edge, dystopia-or-elite | Security/dev/gaming, dark-tech marketing | Neon overused past 1–2 accents; readability sacrificed for atmosphere | Medium–High |
| 5.13 | Organic / Soft | Warm | Human, natural, calm, sustainable | Wellness, sustainability, food/ag, education | Corporate-Memphis-style generic blob cliché | Low |
| 5.14 | Luxury / Premium | Warm | Exclusivity, craft, restraint-as-confidence | Fashion, hospitality, high-end goods | Collapses into generic minimalism with no craft signal | Low |
| 5.15 | Playful | Warm | Friendly, low-stakes, encouraging | Consumer/edtech, onboarding, habit apps | Corporate-Memphis drift; playfulness in a high-stakes moment | Low |
| 5.16 | Bauhaus / Geometric Modernism | Historical | Foundational modernism, geometric confidence | Design-education, cultural, architectural products | "Colourful minimalism" with no real primitive-shape vocabulary | Low |
| 5.17 | Memphis / Postmodern | Historical | Irreverent, anti-taste, playful clash | Culture/entertainment/fashion, event branding | Diluted into "tasteful" colourful shapes — defeats the point | Medium (pattern density) |
| 5.18 | Art Deco | Historical | Glamour, opulence, Machine-Age confidence | Hospitality/nightlife, jewelry, event/awards | Gold applied without the symmetry discipline | Low |
| 5.19 | Y2K / Frutiger Aero | Contemporary-nostalgia | Techno-utopian, glossy nostalgia | Gen-Z consumer, music/entertainment, nostalgia marketing | Missing the specular-highlight "shine" — the #1 tell | Medium (gloss text) |
| 5.20 | Material / Dynamic-Adaptive | Systematic | Systematic, cross-platform, adaptive | Android/Google-ecosystem products | Only colour tokens borrowed; shape/motion stay generic | Low |

---

### 5.1 Swiss / International Typographic Style

**Signal:** engineered trust, neutrality, systemic rigor — "the message, not the messenger." **Lineage:** Zürich/Basel schools, peak **1950–1970**; Josef Müller-Brockmann (*Grid Systems in Graphic Design*, 1981), Emil Ruder (*Typographie*, 1967), Armin Hofmann; typefaces moved Akzidenz-Grotesk → **Helvetica** (1957, Miedinger/Hoffmann) → **Univers** (1957, Frutiger, 21-weight system). ([The Graphic Design School](https://www.thegraphicdesignschool.com/design-history/swiss-style-movement/), [Grapheine](https://grapheine.com/en/magazine/graphic-designer-muller-brockmann-swiss-style/))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Neo-grotesque sans**. One family, 2–3 weights max, flush-left/ragged-right, strict baseline grid, exact 1.4–1.5× leading. |
| Colour (→A1) | Near-monochrome: black/white + **one** signal accent (Müller-Brockmann's posters ran red/black/white). If reasoning in A1's OKLCH: near-zero chroma except the single accent step. |
| Shape/space (→A3, →A4) | Strict modular column grid (A3's 12-column system); hairline rules only; sharp/near-zero radius (A4 `radius-0`/`radius-xs`, "editorial/technical/serious" per A4's own sharp-vs-round rule); objective documentary photography cropped tightly to the grid, not illustration. |
| Motion (→B1) | None-to-minimal; short band (100–150 ms), standard easing, purely functional — no flourish. |

**When to use:** enterprise/B2B, finance, institutional, anything needing to signal precision and neutrality across locales. **When NOT:** consumer-emotional/playful/luxury-sensory briefs; anything needing warmth or texture front-and-center.

**How it fails:** the grid becomes an excuse for boring rather than a discipline; the single-accent rule is violated (multiple competing "brand colours" = flat design, not Swiss); zero photographic/data personality behind the grid.

**Authentic vs. cosplay:**
1. A real modular grid with visible column logic that survives different content lengths — not just centred text with padding.
2. Exactly one accent colour used with intent, not a rainbow of "brand colours."
3. Type sized from an actual modular scale (cross-ref A2 §4.4-style ratios), not arbitrary px jumps.

**Type pick:** Public Sans — OFL 1.1, [fonts.google.com/specimen/Public+Sans](https://fonts.google.com/specimen/Public+Sans) (deliberately not Inter — cross-ref A2 rule 13 and F2's own flag that Inter is a generic tell).

---

### 5.2 Editorial / Magazine

**Signal:** authored point of view, narrative, "someone chose this," cultural credibility. **Lineage:** print magazine design conventions (large-scale display serif, grid-breaking, pull quotes) carried into web editorial work. ([Cedilla Studio](https://www.cedilla.studio/blog/editorial-design-inspiration))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 classes: **Display/decorative** (headline) + **Transitional serif** or **Humanist/Old-style serif** (body). A2 itself names Fraunces as "editorial, characterful, warm-luxury." Drastic size jump (16px body → 64–120px headline); pull quotes, drop caps, kickers/bylines as functional devices. |
| Colour (→A1) | Usually restrained (ink + paper + one accent) **or** full-bleed photographic colour driving the palette per section — colour typically comes from imagery, not swatches. |
| Shape/space (→A3) | Asymmetric, grid-breaking layout (cross-ref A3's **asymmetric-grid** technique, `grid-template-columns: 2fr 1fr 1fr`-style); text wraps images; margins vary intentionally rather than uniform padding; hairline rules as section dividers. |
| Motion (→B1) | Slower than UI-standard: medium–long band (300–600 ms); cross-fades between "spreads," scroll-triggered reveals timed to reading pace, not snap. |

**When to use:** content/publishing, thought-leadership, storytelling marketing, portfolios, longform. **When NOT:** transactional flows (checkout, forms, dashboards) — narrative pacing fights task completion.

**How it fails:** it's "big serif font on white" with a uniform grid underneath — that's minimalism wearing a serif, not editorial; or grid-breaking becomes actually broken (overlapping, unreadable text).

**Authentic vs. cosplay:**
1. An actual asymmetric grid with a visible kicker → headline → dek → byline hierarchy, not one font-size jump.
2. A pull-quote or drop-cap used functionally on real long-form text, not pasted onto short marketing copy.
3. Image captions/credits present — a real editorial signal most AI-generated "editorial" layouts skip.

**Type pick:** Fraunces (display) — OFL 1.1, [github.com/undercasetype/Fraunces](https://github.com/undercasetype/Fraunces) — + Newsreader (body) — OFL 1.1, [fonts.google.com/specimen/Newsreader](https://fonts.google.com/specimen/Newsreader). Both already in A2's own catalogue.

---

### 5.3 Brutalism (web brutalism)

**Signal:** honesty, anti-marketing, "content over chrome," defiance of polish. **Lineage:** architectural Brutalism (*béton brut*) → web-brutalism movement, codified in **seven principles** at brutalist-web.design: readable content, limited interactivity (links/buttons only), clear hierarchy via underlined links, a functional back button, native scrolling, purposeful decoration, and performance as a feature. ([Brutalist Web Design](https://brutalist-web.design/))

| Axis | Spec |
|---|---|
| Type (→A2) | System-default/near-default stacks (`ui-sans-serif, ui-monospace`); large unstyled headings; visible, real underlines on links (not decorative). No A2 classification chosen deliberately — the *absence* of a choice is the choice. |
| Colour (→A1) | Default black-on-white or stark inversion; any colour applied flatly, no gradients, no tinted-neutral softening (A1's hue-tinted-grey rule is deliberately skipped). |
| Shape/space (→A4) | No rounded corners (`radius-0`), no soft shadows, visible borders, dense/table-like layouts, images at native/awkward proportions rather than art-directed crops. |
| Motion (→B1) | None by default; instant state changes. Any animation reads as violating the ethos unless it's crude/glitchy on purpose. |

**When to use:** art/portfolio/experimental sites, anti-corporate positioning, developer/technical audiences who read raw HTML as authenticity, protest/indie/zine contexts. **When NOT:** conversion-critical commercial flows, any audience needing reassurance (finance, healthcare, enterprise procurement), accessibility-first mandates without extra deliberate care.

**How it fails:** it's actually just bad design without an anti-design point of view (broken forms, illegible contrast) — brutalism is deliberate constraint, not incompetence; or it silently drops WCAG contrast/target-size and calls the result "raw."

**Authentic vs. cosplay:**
1. Real semantic HTML defaults (native focus rings, native buttons, real underlined links) rather than a "brutalist skin" built from custom divs faking system-font CSS.
2. Restraint — one deliberate "shock" element, not everything shouting at once.
3. Content genuinely unmediated — no marketing copy dressed up as raw text.

**Type pick:** literal system stack (`ui-monospace, ui-sans-serif, system-ui`) — no embed needed. If a touch of personality is wanted while keeping the "raw" read: Space Mono — OFL 1.1, [github.com/googlefonts/spacemono](https://github.com/googlefonts/spacemono) (already in A2's monospace row).

---

### 5.4 Neo-Brutalism

**Signal:** confident, loud, "we don't need your polish to be trusted" — creator-economy/startup defiance with structure underneath. **Lineage:** web brutalism's 2020s evolution merged with 90s/Y2K UI nostalgia; trend coverage widely cites Gumroad's 2021 redesign and Figma-community "neubrutalist" kits as accelerants — **noted here as trend commentary, not independently re-verified against Gumroad's own design writeup** (Envato, Bejamas). Nielsen Norman Group has since published a formal definition and guidance. ([NN/g — Neobrutalism](https://www.nngroup.com/articles/neobrutalism/), [Envato — Trend Deep Dive](https://author.envato.com/hub/trend-deep-dive-neo-brutalism/))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Grotesque sans (early)** for display — Archivo or Space Grotesk (both are literally A2's own picks for this class: "editorial headlines, characterful UI") — paired with a plain workhorse body per NN/g's own "expressive headline + clean body font" guidance. |
| Colour (→A1) | 2–3 bold, high-contrast primaries, no gradients — NN/g explicitly flags avoiding low-contrast pairs like yellow+cyan. Flat, undiluted, deliberately not hue-tinted-soft. |
| Shape/space (→A4) | Thick (3–6px) solid borders on every actionable element (`radius-0`), and a **flat, single-colour, unblurred offset shadow** (e.g. `4px 4px 0 #000`) instead of A4's default soft/tinted/layered shadow — this offset-hard-shadow is the style's single most identifying token. |
| Motion (→B1) | Press states literally collapse the element into its own shadow (`translate(4px,4px)` + shadow removed on `:active`); short band (100–150 ms), no easing subtlety — a snap, not a curve. |

**When to use:** consumer SaaS/creator tools wanting to look confident and distinct from "generic SaaS," youth-skewing/indie brands, marketing sites breaking template-sameness (cross-ref F2). **When NOT:** enterprise/regulated/finance needing calm trust signals; content-dense data products where borders/shadows compete with data-ink.

**How it fails:** borders/shadows applied inconsistently (some components brutalist, some soft — reads as a mistake, not a style); NN/g's own usability warning — oversized type and dense geometric shapes creating clutter and confusing interfaces; contrast failure on the very borders that define the style (WCAG **1.4.11**, 3:1 — cross-ref A5).

**Authentic vs. cosplay:**
1. The offset hard-shadow is tied to a real interaction (press = shadow collapses) — a static decorative shadow with no interactive payoff is cosplay.
2. Borders are structural on every actionable element, not applied to one hero card only.
3. A restricted 2–3 colour palette that still meets contrast, not a rainbow.

**Type pick:** Archivo Black — OFL 1.1, [github.com/Omnibus-Type/Archivo](https://github.com/Omnibus-Type/Archivo) (A2-listed) + IBM Plex Mono for accents — OFL 1.1, [github.com/IBM/plex](https://github.com/IBM/plex).

**A11y flag (→A5):** contrast-check the border colour against *both* the component fill and the page background independently — 3:1 minimum per WCAG 1.4.11.

---

### 5.5 Minimalism

**Signal:** confidence, focus, "we removed everything that wasn't essential." **Lineage:** Dieter Rams' **Ten Principles of Good Design** (Braun, 1970s–80s), principle 10, *"Weniger, aber besser"* — less, but better; carried into digital via flat design (Windows Metro 2010 / iOS 7 2013) and Apple's product-page minimalism. ([IxDF — Dieter Rams](https://ixdf.org/literature/article/dieter-rams-10-timeless-commandments-for-good-design), [Design Museum](https://designmuseum.org/discover-design/all-stories/what-is-good-design-a-quick-look-at-dieter-rams-ten-principles))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Neo-grotesque sans**, one family, 2 weights, small clear scale (rarely >5–6 steps), generous line-height. |
| Colour (→A1) | Near-monochrome neutral base (1–2 hue-tinted greys per A1's own construction rule) + a single brand accent spent sparingly (A1's ≈10% accent budget) — no gradients/textures. |
| Shape/space (→A3, →A4) | Generous, *composed* whitespace (Rams' "unobtrusive," not "empty"); small-to-no radius; hairline dividers; frequently expressed today as a **bento grid** (A3's technique: 12-column base, `grid-auto-flow: dense`, cap tile-size vocabulary at ~3 sizes) — bento is minimalism's current default layout skin. |
| Motion (→B1) | Minimal, purely functional; short band (100–200 ms) fades, no bounce, no attention-seeking motion. |

**When to use:** product-first contexts where the interface must disappear behind content/product, premium-tech positioning, anywhere clarity/speed outrank personality. **When NOT:** content needing emotional warmth; brands needing to differentiate on personality where "clean" reads as generic — this is the **single most common source of F2's "templated" failure**.

**How it fails:** minimalism becomes absence-of-decision rather than a decision — indistinguishable from every other "clean SaaS" template; or "less" removes necessary affordances (invisible buttons, no visible state).

**Authentic vs. cosplay:**
1. An actual point of view about what was removed and why (Rams' "unobtrusive"), not "empty."
2. One confident, clearly intentional accent colour/detail, not zero personality.
3. Real compositional (asymmetric, considered) whitespace rather than uniform padding on every element.

**Type pick:** IBM Plex Sans — OFL 1.1, [github.com/IBM/plex](https://github.com/IBM/plex), or Source Sans 3 — OFL 1.1, [github.com/adobe-fonts/source-sans](https://github.com/adobe-fonts/source-sans) (A2's own alternatives to the Inter default, per A2 rule 13).

---

### 5.6 Maximalism

**Signal:** abundance, joy, personality-forward, "we're not afraid of too much." **Lineage:** a 2020s reaction against minimalism fatigue in fashion, interiors, and graphic design. ([Envato Tuts+ — What is the Maximalism Graphic Design Trend?](https://design.tutsplus.com/articles/what-is-the-maximalism-graphic-design-trend--cms-108604))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Display/decorative** mixed deliberately (2–4 typefaces on one page), varied sizes/weights used as texture, not just hierarchy — but cap at 2 typefaces even here to protect legibility (a deliberate guardrail this track adds on top of the source material). |
| Colour (→A1) | Vibrant, saturated, deliberately contrasting combinations used with intent — per the source, "vibrant... contrasting colors" driving energy rather than restraint. |
| Shape/space (→A3) | Dense, collage-like layering of images/patterns/type; "little negative space is key" — patterns and textures compound rather than isolate; this is the explicit inverse of A3's own "whitespace is the first hierarchy tool" default rule, applied on purpose. |
| Motion (→B1) | Layered, playful, can be ambient/continuous (marquees, floating collage layers) — must still respect B1's vestibular-safety limits and reduced-motion substitution. |

**When to use:** fashion/beauty/entertainment/culture brands, youth/Gen-Z consumer brands, contexts where memorability *is* the brand promise, festival/event/nightlife. **When NOT:** task-focused utility products, data-dense dashboards, regulated/trust-first industries, anywhere cognitive load must stay low.

**How it fails:** density loses hierarchy entirely — the source names this precisely: *"designs that appear cluttered and confuse audiences,"* *"patterns that clash rather than coordinate."* Or there's no underlying grid holding the chaos — successful maximalism is *disciplined* chaos, not the absence of a system.

**Authentic vs. cosplay:**
1. A hidden structural grid/rhythm still governs the composition — real maximalism is "intentional chaos," not randomness.
2. Genuine repetition used as a device (the source: repetition "reinforcing importance"), not just noise.
3. At least one area of visual rest — even maximalist compositions need a focal anchor.

**Type pick:** Unbounded (display) — OFL 1.1, [fonts.google.com/specimen/Unbounded](https://fonts.google.com/specimen/Unbounded) + IBM Plex Sans (body, for legibility) — OFL 1.1.

---

### 5.7 Glassmorphism

**Signal:** depth, layered context, futuristic-but-soft, "content floating above content." **Lineage:** the term was coined by **Michal Malewicz of Hype4.Academy** (2020) to name and catalogue the frosted-glass trend; accelerated by Apple's frosted-panel language (macOS Big Sur onward) and, in 2025, superseded/absorbed into Apple's **"Liquid Glass"** material — introduced at **WWDC 2025** across iOS/iPadOS/macOS/watchOS/tvOS "26" — which adds specular highlights and dynamic light response. Commentary explicitly links Liquid Glass's nature-tech, light-reactive lineage back to **Frutiger Aero** (§5.19). ([Hype4.Academy](https://hype4.academy/tools/glassmorphism-generator), [Apple Newsroom, June 2025](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/), [IxDF — Glassmorphism](https://ixdf.org/literature/topics/glassmorphism))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Humanist sans**, medium-to-semibold weight minimum — thin weights disappear against blur. Hanken Grotesk, Source Sans 3. |
| Colour (→A1) | The panel has no colour of its own — only what it distorts; a real background (image/gradient/vivid field) is required behind it. Apple's own description: the material's *"colour is informed by surrounding content and intelligently adapts between light and dark environments."* |
| Shape/space (→A4) | **Use A4's verified recipe exactly:** semi-transparent fill + `backdrop-filter: blur(8–20px) saturate(120–180%)` + a 1px top-light highlight + a border ([A4 §3 rule 7](/home/claude/A4-shape-depth-and-material.md)); rounded rectangles (glass reads as "poured," sharp corners undercut the metaphor); one primary glass surface per view — never stack translucency on translucency. |
| Motion (→B1) | Soft cross-fades on open/close (medium band, 200–300 ms, ease-out entrances); Apple's Liquid Glass adds a specular highlight that *"dynamically reacts to movement."* |

**When to use:** layered/dashboard UI needing to show "what's behind" (overlays, modals, notification stacks), media-rich contexts with strong imagery to blur, OS-level chrome. **When NOT:** see §4.5 — text-dense surfaces, low-end-device targets, legal/financial precision contexts, or anywhere a tested opaque fallback can't realistically ship. **F2 flag:** glassmorphism is explicitly named in F2's own cliché catalogue as a former escape now over-applied into a core "slop" effect — reach for it because the layered-depth signal is *right for this brief*, not by reflex.

**How it fails:** text sits directly on glass with no contrast safety net; overused so every panel is glass and nothing reads as "behind" anything, losing the depth metaphor entirely (designedforhumans.tech calls this "visual noise"); shipped without a `prefers-reduced-transparency`/solid fallback.

**Authentic vs. cosplay:**
1. There's an actual distinguishable layer behind the glass — a real background, not a flat colour pretending to be blurred.
2. One primary glass surface per view (Apple's own guidance), not stacked translucency on translucency.
3. A tested solid/opaque fallback exists for `prefers-reduced-transparency`/forced-colors, not a hope that blur renders everywhere.

**Type pick:** Hanken Grotesk — OFL 1.1, [fonts.google.com/specimen/Hanken+Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (A2-listed).

**A11y flag (→A5): HIGH RISK.** See §4.5 in full before shipping.

---

### 5.8 Neumorphism (Soft UI)

**Signal:** tactile, soft, calm, "everything is carved from the same material." **Lineage:** the term (portmanteau of "new" + "skeuomorphism") is dated to **2019**; Alexander Plyuto's banking-app concept on Dribbble is the widely-cited early popularising work. Rapid backlash by 2021 over accessibility ceded trend-mindshare to glassmorphism. ([Wikipedia — Neumorphism](https://en.wikipedia.org/wiki/Neumorphism))

| Axis | Spec |
|---|---|
| Type (→A2) | Same-family, sized up one step from the product's normal scale to compensate for the field's low native contrast. |
| Colour (→A1) | Monochrome — element and background share nearly the same base colour; this sameness *is* the style. Introducing a second hue breaks the illusion. |
| Shape/space (→A4) | Large radius (soft/pillowy); elements appear extruded (raised) or engraved (inset) from one continuous surface via two very-low-contrast offset shadows (light + dark, top-left convention) — composes A4's shadow-layering primitive at minimum contrast; **never** a hard edge or visible border (a border breaks the "carved from one material" illusion, which is exactly why it's the fix — see Claymorphism). |
| Motion (→B1) | Press states swap the raised/inset shadow pair (`:active` toggles the arrangement) — short band, 100–150 ms. This state-swap on press is the style's entire interaction language. |

**When to use:** narrow, decorative contexts only — a single hero control, a music-player/toggle-heavy widget, a brand moment where tactility is the whole point and the *surrounding* UI supplies real contrast and hierarchy. **When NOT:** system-wide; any text-bearing or data-dense surface; any product with a compliance mandate. See §4.5 in full.

**How it fails:** used anywhere text/data needs to be read (fails WCAG **1.4.3**/**1.4.11** almost by construction); applied across an entire product (the low-contrast sameness that looks elegant on one hero control becomes illegible fatigue at system scale — the documented reason for its 2021 decline).

**Authentic vs. cosplay:**
1. Genuinely matching background/element colour — a "neumorphic" card visibly different in colour from its background is just "soft shadow," not neumorphism.
2. The raised/inset toggle is functional (press = state change), not decorative.
3. Scope discipline — 1–3 controls maximum, with real-contrast UI everywhere else.

**Type pick:** IBM Plex Sans, minimum weight 500.

**A11y flag (→A5): HIGH RISK — arguably the highest in this catalogue.** Never the sole differentiator for interactive vs. static elements; always pair with a redundant non-colour signal; verify 3:1 per WCAG 1.4.11 — pure neumorphism frequently cannot pass this by design and needs a deliberate override (a hairline border) to ship compliant. **A4 itself recommends: "add borders or avoid."**

---

### 5.9 Claymorphism

**Signal:** playful-soft-3D, "inflated," approachable-but-modern — neumorphism's accessibility fix. **Lineage:** emerged **~2021–2022** as a direct answer to neumorphism's contrast problem; profiled by Smashing Magazine, *"Claymorphism: Will It Stick Around?"* (2022). ([Smashing Magazine](https://www.smashingmagazine.com/2022/03/claymorphism-css-ui-design-trend/))

| Axis | Spec |
|---|---|
| Type (→A2) | Rounded, friendly sans, medium weight — contrast is no longer the constraint it was in neumorphism, so type can behave normally. |
| Colour (→A1) | **Any** background/element colour combination works — this is the key structural fix over neumorphism. Typically saturated pastels; foreground/background genuinely contrast. |
| Shape/space (→A4) | Very large radius (32px+); a signature **triple-shadow stack**: one dark outset shadow (the "floating" cue) plus two inset shadows (light + dark, offset diagonally) simulating an inflated, rounded-edge material — composes A4's inset-highlight/inset-shade primitives at higher contrast than neumorphism uses them. |
| Motion (→B1) | Press/hover = scale-down (`scale(0.97)`) rather than a raised/inset swap, since clay squishes rather than inverting — B1's press-scale micro-interaction pattern, short band 100–150 ms. |

**When to use:** onboarding/illustration-adjacent UI, kid-friendly or wellness apps, anywhere a "soft toy" tactility is wanted *with* actual legibility. **When NOT:** dense data UI, enterprise/serious-trust contexts, anything needing sharp/precise visual language.

**How it fails:** overused across a whole interface it reads childish/overwhelming; the shadow stack applied inconsistently (some elements clay, others flat) breaks the material illusion.

**Authentic vs. cosplay:**
1. The specific three-shadow recipe (1 outset + 2 inset, diagonally opposed) — a single soft shadow is just "soft UI," not clay.
2. Genuinely saturated/contrasting colour choices — monochrome drifts it back into neumorphism.
3. Generous, consistent large radius across every clay element.

**Type pick:** Fredoka — OFL 1.1, [fonts.google.com/specimen/Fredoka](https://fonts.google.com/specimen/Fredoka), or Baloo 2 — OFL 1.1, [fonts.google.com/specimen/Baloo+2](https://fonts.google.com/specimen/Baloo+2) (both outside A2's core table; same humanist-sans-rounded logic).

**A11y flag:** lower risk than neumorphism since colour contrast is genuinely achievable — but still verify text-on-clay contrast, and respect reduced-motion for the scale-press interaction.

---

### 5.10 Skeuomorphism

**Signal:** familiarity, tactility, "this behaves like the real thing," reassurance for unfamiliar functions. **Lineage:** dominant in early GUI/iOS design (1980s Mac; iOS 1–6 under Scott Forstall) — leather stitching, felt, reel-to-reel tape UI; the etymology is Greek *skeuos* (tool/container) + *morphḗ* (shape), applied to material objects since **1890** and to computer interfaces from the **1980s**. Replaced by flat design at **iOS 7 (WWDC 2013)** once Jonathan Ive took over software design; commentary describes a partial 2025–2026 revival, usually blended with depth/glass languages rather than a pure return. ([Wikipedia — Skeuomorphism](https://en.wikipedia.org/wiki/Skeuomorphism), [Forbes](https://www.forbes.com/sites/timworstall/2013/09/19/apples-ios7-well-it-was-time-for-skeuomorphism-to-die/))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Humanist/Old-style serif** ("tradition, warmth... 'book'") — IBM Plex Serif or Source Serif 4 — 600 weight, warm ink colour (never pure black), a subtle emboss `text-shadow` on labels. |
| Colour (→A1) | Warm material tones referencing a real material (walnut, brushed steel, leather, paper) — never pure white/black as the base. |
| Shape/space (→A4) | Composes A4's **bevel primitive** (inset top-highlight + bottom-shade, §4.2) with A4's **layered elevation** (contact + ambient, §4.3), across four stacked layers, tinted warm rather than pure black per A4's own rule 5; radius 8–12px (a manufactured edge, sharper than Claymorphism's pillowy 32px+); subtle procedural noise/grain (inline SVG `feTurbulence`, 0.04–0.06 opacity — CSP-safe, per A4's own grain technique) standing in for material texture. |
| Motion (→B1) | Press = literal physical depression (`translateY(1px)` + inner-shadow swap); dial/knob rotation for continuous controls; mechanical snap-then-settle rather than airy ease. |

**When to use:** unfamiliar or physically-analogous functions needing an intuitive handle (camera, synth/mixer, calculator, timer), premium/tactile brand moments, onboarding a new interaction model. **When NOT:** data-dense/dashboard UI (texture competes with data-ink), fast-scan-at-scale contexts, dark-mode-first products (top-lit gradients invert badly).

**How it fails:** photographic/bitmap textures instead of vector/procedural ones (real performance damage — cross-ref E1); embossed low-contrast text (grey-on-grey emboss routinely fails WCAG 4.5:1); naive dark-mode inversion produces a "wet plastic" look, because the top-lit-gradient convention assumes a light-from-above real-world reference that doesn't invert cleanly; rotational/knob-only controls with no keyboard/switch equivalent fail motor-accessibility.

**Authentic vs. cosplay:**
1. The full four-layer shadow stack (contact + ambient + 2 insets) is present, not one generic drop-shadow.
2. A real border sits underneath the texture, keeping the control legible in `forced-colors` mode.
3. The metaphor maps to a genuine physical referent from the product's own domain (a synth app's knobs, a camera app's shutter) — not decoration bolted onto a generic button.

**Type pick:** IBM Plex Serif — OFL 1.1, [github.com/IBM/plex](https://github.com/IBM/plex), or Source Serif 4 — OFL 1.1, [github.com/adobe-fonts/source-serif](https://github.com/adobe-fonts/source-serif).

**A11y flag (→A5):** verify embossed-text contrast independently — the emboss `text-shadow` does not count toward the computed ratio; provide non-rotational alternate controls for any knob/dial.

---

### 5.11 Retro / Terminal (computing nostalgia)

**Signal:** technical authenticity, hacker credibility, "built by people who type for a living." **Lineage:** DOS/Unix terminals, BBS culture, green/amber phosphor CRT monitors (1970s–90s); contemporary revival in developer-tool branding.

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Monospace**, for *everything* — headings, body, buttons, nav. No exceptions; a single sans-serif slip breaks the terminal illusion. JetBrains Mono, IBM Plex Mono, or Space Mono (all three already in A2's own monospace row); VT323 or Press Start 2P for an authentic bitmap-CRT flavour. |
| Colour (→A1) | Strict two-zone system — dark background (`#0A0E0A`–`#243029` range) + phosphor foreground (`#00FF41`→`#007A20` classic green; amber alternate); reserved state colours (`#FF3333` error, `#FFD700` warning, `#5BB8FF` info); never invert to light-on-light or mix zones. |
| Shape/space (→A4) | Zero radius (`radius-0`) — terminals have none; ASCII/box-drawing-style borders and dividers instead of whitespace-driven separation; buttons styled as bracketed commands (`[ Run ]`); dense information layout, modest 28–36px section padding rather than generous whitespace. |
| Motion (→B1) | Boot-sequence line-by-line reveal (120–150 ms/line — intentionally slower than B1's UI-stagger norm of 20–50 ms, because "system initialising" is the narrative); typewriter text effect (~40 ms/character) with a blinking cursor; phosphor glow via layered `text-shadow`, reserved for H1/active-nav/key numbers only. |

**When to use:** developer tools, CLI-adjacent products, security/infra wanting technical credibility, easter-egg/about pages, retro-brand positioning. **When NOT:** consumer-mainstream products needing approachability, contexts where dense monospace hurts scan-speed for non-technical users, accessibility-first products without active contrast correction.

**How it fails:** any non-monospace type sneaks in (breaks the illusion instantly — the single most-checked marker); low-contrast dim/muted green variants left unverified individually; the glow effect applied to everything, which loses hierarchy and reads "80s screensaver" instead of "terminal."

**Authentic vs. cosplay:**
1. 100% monospace, zero exceptions.
2. A real two-zone dark/phosphor palette with disciplined state-colour reservation — "dark mode with a green accent" is cosplay, not terminal.
3. Motion that narrates a boot/process (staggered lines, typewriter) rather than generic UI fades.

**Type pick:** JetBrains Mono — OFL 1.1, [github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) (A2-listed); VT323 — OFL 1.1, [fonts.google.com/specimen/VT323](https://fonts.google.com/specimen/VT323) (designer Peter Hull) for bitmap CRT flavour.

**A11y flag:** verify every dim/muted foreground shade individually against the exact background — glow/blur `text-shadow` does not add to computed contrast.

---

### 5.12 Cyber / Technical (cyberpunk, dark-tech, HUD)

**Signal:** high-tech, edge/danger, surveillance-and-hacking culture, near-future dystopia-or-elite-tech. **Lineage:** cyberpunk fiction/film visual language (neon-on-dark), expressed today in game HUDs and dark-tech product marketing. ([Stellae Design](https://www.stellae.design/en/learn/cyberpunk-ui-design))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Monospace**-anchored (JetBrains Mono/Share Tech Mono) for data/labels, all-caps tracking-heavy labels, fixed-width layouts reinforcing "machine readout." |
| Colour (→A1) | Near-black base (`#0a0a0f`–`#0d0d12`) + sparse saturated neon accents (cyan `#00fff5`, magenta `#ff00ff`, electric blue `#0066ff`, toxic green `#00ff41`, hot pink `#ff0080`) — used *sparingly*; the discipline of restraint is the actual skill, not the neon itself. |
| Shape/space (→A4) | Clipped/angular corners (a diagonal cut instead of a radius — the inverse of A4's round-for-friendly default), HUD-style bracket frames around key data, technical grid/reticle overlays, hard edges throughout. |
| Motion (→B1) | Glitch artifacts (brief chromatic-aberration/RGB-split on state change), scanline overlay, boot/data-stream reveals — very short bursts (<100 ms) with sharp non-eased cuts; must respect B1's vestibular-safety and WCAG **2.3.1** flash-rate limits (nothing >3×/s). |

**When to use:** security/dev/gaming/Web3 products, dark-mode-native technical dashboards wanting an "elite console" feel, entertainment/gaming marketing. **When NOT:** approachable consumer/family products, healthcare/finance (the danger/edge signal actively undermines trust), accessibility-constrained contexts.

**How it fails:** neon overused across the whole surface ("making interfaces chaotic," per Stellae) instead of reserved for 1–2 focal accents; readability sacrificed for atmosphere (thin neon type on black routinely falls under 4.5:1); the technical-monospace foundation skipped — a "cyberpunk" UI set in a rounded humanist sans reads as costume, not system.

**Authentic vs. cosplay:**
1. Restraint — neon is the exception colour on a near-black canvas, not the majority colour.
2. Real HUD conventions present (bracket corners, technical labels, grid overlay), not just "dark background + one neon gradient."
3. Glitch/scanline motion tied to actual state changes (error, alert, boot), not constant ambient noise.

**Type pick:** Share Tech Mono — OFL 1.1, [fonts.google.com/specimen/Share+Tech+Mono](https://fonts.google.com/specimen/Share+Tech+Mono) (designer Carrois Type Design) for data; Rajdhani — OFL 1.1, [fonts.google.com/specimen/Rajdhani](https://fonts.google.com/specimen/Rajdhani) for a condensed technical display face.

**A11y flag:** verify neon-on-black text at 4.5:1 per colour individually (cyan/green typically pass at full saturation; magenta/hot-pink at small sizes often don't); cap flash/glitch rate under WCAG 2.3.1.

---

### 5.13 Organic / Soft (biophilic, blob-driven)

**Signal:** human, natural, calm, sustainable, "made by people, not machines." **Lineage:** biophilic design (natural forms/materials in built and digital environments) crossed with the 2020s "blob shape" UI trend used for brand cohesion and section-dividing. ([DesignerUp — Trendy blobs and organic shapes](https://designerup.co/blog/trendy-blobs-and-organic-shapes/), [gbd magazine — Biophilic Design](https://gbdmagazine.com/what-is-biophilic-design/))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Humanist sans**, rounded terminals — Quicksand or Nunito (outside A2's core table; same humanist-sans-warm logic as A2's Source Sans 3/Hanken Grotesk row, chosen here for their rounder terminal shape). |
| Colour (→A1) | Earth-and-plant palette — muted greens, terracotta, cream, warm neutrals; soft multi-stop gradients (sky/water/leaf transitions), not the hard 2-stop gradients of tech-brand UI. |
| Shape/space (→A4) | Asymmetric blob shapes as section dividers/background fields, generated with controllable irregularity (e.g. the free Blobmaker tool) rather than one stock blob reused everywhere; large radius, pill-shaped buttons/tags; irregular organic image-crop masks instead of rectangles. |
| Motion (→B1) | Slow, breathing/floating ambient motion — long/looping band (1–3 s+), small displacement (safe under B1's vestibular guidance since movement stays small and slow); gentle morph between blob states rather than snap transitions. |

**When to use:** wellness/health, sustainability/climate, food/agriculture, education for younger users, community/nonprofit. **When NOT:** fintech/security/enterprise needing precision signalling, data-dense dashboards (organic shapes don't align to grids well), performance-critical mobile (soft blur/shadow layering adds paint cost).

**How it fails:** the blob becomes a generic corporate-illustration cliché — this is exactly where **Corporate Memphis** drift (§5.15, §6) most often rides in, on organic/blob backgrounds; shapes placed with no relationship to content; gradients/blur costs tank performance on low-end mobile.

**Authentic vs. cosplay:**
1. Blob/organic shapes generated with actual controllable irregularity, not one stock "blob PNG" reused everywhere.
2. The palette genuinely references real natural materials (a specific plant, a specific terrain), not just "green means eco."
3. Motion is slow and ambient (breathing), not the snappy UI-standard timing used elsewhere in the catalogue — 150 ms motion under organic shapes reads mismatched.

**Type pick:** Quicksand — OFL 1.1, [fonts.google.com/specimen/Quicksand](https://fonts.google.com/specimen/Quicksand), paired with a plain body sans (Source Sans 3) so long-form text stays legible.

**A11y flag:** verify text placed over blob-and-gradient fields for contrast at every point the text crosses a gradient stop, not just the average.

---

### 5.14 Luxury / Premium

**Signal:** exclusivity, craft, restraint-as-confidence, "we don't need to convince you." **Lineage:** fashion/luxury-goods web design conventions — minimalist palettes, generous editorial whitespace, exceptional art-directed photography, subtle motion. ([Webflow — Luxury brand websites](https://webflow.com/blog/luxury-brand-websites))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Didone/Modern serif** for display — Playfair Display or Fraunces at high `opsz` (both A2's own picks: "luxury/fashion/beauty headlines") — paired with a light-weight, wide-tracked geometric sans for labels/navigation. Kerning/tracking discipline is non-negotiable — this is what makes the type itself look expensive. |
| Colour (→A1) | Minimalist and restrained — black/white/cream base, at most one accent (often a muted metal or none at all); colour comes from art-directed photography, not UI chrome. |
| Shape/space (→A4) | Very generous whitespace as an editorial device, not padding; minimal-to-no radius (A4: sharp reads "editorial/technical/luxury" — sharp is more considered than rounded here); hairline (1px) dividers only; large full-bleed imagery with precise alignment between image, shadow, and grid. |
| Motion (→B1) | Slow, smooth, understated — image hover-enlarge, sparing parallax, hidden navigation appearing on demand; medium–long band (400–600 ms), gentle ease, **never** a bounce/spring (springs signal playful — the wrong register here). |

**When to use:** fashion, hospitality/travel, high-end real estate, premium consumer goods, professional-services firms wanting "considered" over "approachable." **When NOT:** budget/value-positioned products (restraint reads as slow/unhelpful when the promise is speed/affordability), high-frequency utility tools, youth/mass-market consumer apps.

**How it fails:** it collapses into generic minimalism with no craft signal — luxury is minimalism *plus* specific material/typographic/photographic quality; strip those and it's an empty template, the most common luxury-brief failure. Motion becomes gratuitous (parallax overload, bouncy transitions), which reads as trying too hard — the opposite of the intended confidence.

**Authentic vs. cosplay:**
1. Photography/imagery is art-directed and specific to the product — never generic stock. This single factor differentiates luxury from templated minimalism more than any token choice.
2. Typographic refinement is visible at the kerning/tracking level, not just "we used a serif font."
3. Restraint is total and deliberate — one loud CTA button in stock-blue immediately breaks the illusion.

**Type pick:** Cormorant Garamond — OFL 1.1, [fonts.google.com/specimen/Cormorant+Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (designer Christian Thalmann), or Playfair Display — OFL 1.1, [fonts.google.com/specimen/Playfair+Display](https://fonts.google.com/specimen/Playfair+Display) (A2-listed); paired with Jost — OFL 1.1, [fonts.google.com/specimen/Jost](https://fonts.google.com/specimen/Jost) (A2-listed geometric sans). Historic luxury faces — Didot, Bodoni's original cuts, Futura — are commercial/foundry-owned in their modern digitisations (Executive Rule 11); these are the free substitutes, not claimed equivalents.

---

### 5.15 Playful

**Signal:** friendly, human, low-stakes, encouraging, "you can't get this wrong." **Lineage:** consumer/edtech products — Duolingo's own design writing documents a shift toward "brighter, rounder, friendlier" illustration built on shape variety, exaggeration, and composition (Duolingo's team explicitly frames this through *composition and rhythm*, not a fixed shape→emotion symbolism — noted here to avoid over-claiming beyond what the source states). ([Duolingo Design Blog](https://blog.duolingo.com/shape-language-duolingos-art-style/))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 has an explicit row for this mood: **"Playful, characterful, editorial-quirky" → Fraunces (`SOFT`/`WONK` axes) or Recursive (`CASL` casual axis)**. For a more overtly rounded/kid-consumer register (distinct from Fraunces' editorial-quirky register), Fredoka or Baloo 2. |
| Colour (→A1) | Saturated, warm, high-chroma, spent broadly rather than restrained to one accent (playful spends across primary/secondary/tertiary roles); high value-contrast for toy-like clarity. |
| Shape/space (→A4) | Rounded-everything (pill buttons, large-radius cards), asymmetric/bouncy composition, illustrated mascots/characters used *functionally* (progress, empty, error states) rather than pure decoration. |
| Motion (→B1) | Springy, bouncy — B1 ζ ≈ 0.4–0.6, visibly more bounce than "productivity UI" defaults; celebratory micro-interactions on success (confetti, scale-overshoot); fast and eager rather than slow/deliberate. |

**When to use:** consumer apps for broad/young audiences, onboarding and empty-states across *any* product (playful is often appropriate locally even inside a serious product), education, habit/wellness apps needing encouragement over authority. **When NOT:** high-stakes/regulated decisions (medical results, legal, large financial transactions) where playfulness undercuts gravity; enterprise procurement audiences; anywhere the brand needs to signal seniority over approachability.

**How it fails:** it drifts into **Corporate Memphis** — flat, interchangeable, near-expressionless figures with exaggerated limbs, used to paper over a lack of real product personality; widely criticised as *"too minimalistic, generic, lazy, overused"* once it became a default across tech illustration post-2017 (the style's popularisation is often traced to Facebook's 2017 adoption). Or playfulness is applied to a moment that needs gravity (an error deleting real user data should not bounce). ([AIGA Eye on Design](https://eyeondesign.aiga.org/what-the-think-pieces-about-corporate-memphis-tell-us-about-the-state-of-illustration/), [Wikipedia — Corporate Memphis](https://en.wikipedia.org/wiki/Corporate_Memphis))

**Authentic vs. cosplay:**
1. Illustration/shape choices are specific to the brand (a recognisable, differentiated mascot/motif system), not generic rounded-figure stock illustration — the Corporate-Memphis tell.
2. Motion is tuned per-context — celebratory moments bounce, serious/destructive moments do not; this judgment is the marker of real design, not a blanket "spring everything" setting.
3. Colour has real hierarchy (primary/secondary/tertiary roles), not every element equally loud.

**Type pick:** Fredoka — OFL 1.1, [fonts.google.com/specimen/Fredoka](https://fonts.google.com/specimen/Fredoka), paired with Nunito — OFL 1.1, [fonts.google.com/specimen/Nunito](https://fonts.google.com/specimen/Nunito) for body.

---

### 5.16 Bauhaus / Geometric Modernism

**Signal:** foundational modernism, craft-meets-industry, "form follows function" pedigree, geometric confidence. **Lineage:** Bauhaus school, founded by **Walter Gropius, 1 April 1919, Weimar**; moved to Dessau (1925), then Berlin (1932); closed **1933** under Nazi pressure. Taught unity of art/craft/industrial production; basic geometric primitives (circle/square/triangle) and Kandinsky's colour-form correspondence became a foundational visual vocabulary later absorbed into Swiss Style and most of 20th-century modernism. ([Wikipedia — Bauhaus](https://en.wikipedia.org/wiki/Bauhaus))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Geometric sans** — exact match to A2's own row (archetype Futura/Avenir, OFL equivalents Poppins/Jost/Montserrat). |
| Colour (→A1) | Primary triad (red/yellow/blue) plus black/white, used as flat undiluted fields — no tints/gradients. Colour-form correspondence (circle=blue, square=red, triangle=yellow, per Kandinsky's Bauhaus-era theory) is a genuine, citable authenticity marker when used deliberately. |
| Shape/space (→A3, →A4) | Basic geometric primitives (circle, square, triangle/diagonal) as literal compositional elements, not just border-radius choices; asymmetric but rule-governed placement; generous flat colour fields functioning as shapes. |
| Motion (→B1) | Geometric transforms — rotation, simple scale, primitive-shape morphs (a square rotating into a diamond) — short-medium band, standard (not overshoot) easing; mechanical, not organic. |

**When to use:** design-education/cultural/museum contexts, brands invoking foundational-modernist credibility distinct from Swiss's corporate-neutral reading, geometric/architectural product categories. **When NOT:** anywhere Swiss/Minimalism already covers the brief better (Executive Rule/§4.2's Swiss-vs-Bauhaus disambiguation) — don't reach for this just because "geometric" was said; warmth-seeking or organic-seeking briefs.

**How it fails:** used as a synonym for "colourful minimalism" with no actual primitive-shape vocabulary — adding red/yellow/blue accents to an otherwise generic layout is cosplay, not Bauhaus; or confused with Memphis (§5.17) — Bauhaus is a *disciplined* primary triad + basic forms, Memphis is clashing pastel-and-neon + kitsch pattern.

**Authentic vs. cosplay:**
1. Actual geometric primitives (circle/square/triangle) function as content-bearing shapes, not decoration.
2. The primary-triad discipline (red/yellow/blue + black/white only) is held, not diluted with a fifth "brand colour."
3. A visible construction logic — elements built from grid-locked primitives, not freeform placement.

**Type pick:** Poppins — OFL 1.1, [fonts.google.com/specimen/Poppins](https://fonts.google.com/specimen/Poppins) (A2-listed geometric sans), or Space Grotesk — OFL 1.1, [fonts.google.com/specimen/Space+Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (designer Florian Karsten).

---

### 5.17 Memphis / Postmodern

**Signal:** irreverent, anti-establishment-taste, playful clash, "rules are optional," 80s-revival energy. **Lineage:** **Memphis Group**, founded by **Ettore Sottsass** with Barbara Radice, first exhibited **18 September 1981**, Arc '74 showroom, **Milan**; core members Michele De Lucchi, Nathalie du Pasquier, George Sowden, Martine Bedin. Deliberately rejected modernist "good taste" with kitsch patterns (leopard-skin, terrazzo), clashing pastel-and-neon colour, and asymmetric "topsy-turvy" forms. ([Design Museum — Memphis](https://designmuseum.org/memphis))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 classes: **Display/decorative** + **Grotesque sans (early)** mixed — bold display faces used at unconventional angles/scales. |
| Colour (→A1) | Clashing pastel + neon/primary combinations used *without* other movements' harmony rules — e.g. pink + acid-yellow + turquoise + black in one composition. Deliberately "wrong" pairings are the point. |
| Shape/space (→A4) | Squiggles, terrazzo/confetti patterns, asymmetric "topsy-turvy" arrangement (elements at odd angles rather than grid-aligned), thick zigzag/wavy borders, faux-material textures (laminate/plastic patterns as flat colour fills online). |
| Motion (→B1) | Erratic/bouncy — elements can rotate to odd angles on load, little easing restraint; closer to Maximalism's energy but with sharper, more graphic (less collage-photographic) shapes. |

**When to use:** culture/entertainment/fashion brands wanting deliberate irreverence, event/festival branding, youth-culture or nostalgia-driven positioning. **When NOT:** any context needing to signal restraint/seriousness/trust; long-form reading surfaces (pattern density fights legibility); enterprise/finance.

**How it fails:** diluted into generic "colourful geometric shapes" with no actual pattern-clash discipline — real Memphis commits to visibly "wrong" colour/pattern combinations, and hedging them into "tasteful" defeats the point; or overused past a brand-accent role into full-product UI — Memphis was furniture/objects, not dense reading interfaces, and has no native answer for a settings page.

**Authentic vs. cosplay:**
1. Genuine pattern-clash (terrazzo/squiggle/zigzag motifs as real fills, not just border decoration).
2. Asymmetric, non-grid placement of at least some elements — a perfectly gridded "Memphis" page is cosplay.
3. Colour combinations a "tasteful" palette generator would reject — the deliberate clash is the tell.

**Type pick:** Bungee — OFL 1.1, [github.com/djrrb/Bungee](https://github.com/djrrb/Bungee) (designer David Jonathan Ross) for graphic punch, paired with a plain sans for any body copy.

---

### 5.18 Art Deco

**Signal:** glamour, opulence, engineered luxury, Machine-Age confidence. **Lineage:** flourished internationally **1910s–1950s**, peak **1920s–early 1930s**; emerged in Paris before WWI. The name derives from the 1925 Paris *"Exposition internationale des arts décoratifs et industriels modernes,"* though the phrase "Art déco" itself wasn't printed until 1966 and was popularised by historian Bevis Hillier's 1968 book. Motifs: geometric triangles/squares/cylinders, chevrons and zigzags, stylised florals, Egyptian/Mesopotamian/Asian/Pre-Columbian influences; early palette drew on Fauvism and the Ballets Russes. ([Wikipedia — Art Deco](https://en.wikipedia.org/wiki/Art_Deco))

| Axis | Spec |
|---|---|
| Type (→A2) | High-contrast geometric display serif or engraved-look caps with wide tracking, symmetrical letterforms; ornamental swashes reserved for a single hero mark/wordmark, never body text. |
| Colour (→A1) | Black + gold/brass metallic accent as the signature pairing, sometimes with one jewel tone (emerald, sapphire, deep burgundy) added; high value-contrast throughout, no pastels. |
| Shape/space (→A4) | Strict bilateral symmetry; sunburst/fan and stepped-ziggurat motifs as literal ornamental devices; thin metallic-look hairline borders/frames; strong vertical emphasis echoing skyscraper massing. |
| Motion (→B1) | Elegant, symmetrical reveals — a sunburst radiating out, a frame drawing itself in stroke-order (cross-ref B1's SVG stroke-draw technique for "line ornament assembling itself"); medium band (300–500 ms), no bounce. |

**When to use:** hospitality/nightlife/entertainment branding, jewelry/watches, event and awards-show marketing, any "roaring twenties/glamour" brief distinct from contemporary minimalist luxury. **When NOT:** contemporary tech-premium briefs — use Luxury/Premium (§5.14) instead; Art Deco is a period style, not a generic "expensive" signal, and forcing it onto e.g. a fintech app reads as costume.

**How it fails:** gold/ornament applied without the symmetry discipline — asymmetric "Deco" is a contradiction, since rigid symmetry *is* the style's identity; or the ornament overwhelms function — Deco's geometric frames are decorative borders *around* content, not a replacement for a usable grid.

**Authentic vs. cosplay:**
1. Real bilateral symmetry in at least the hero composition.
2. A specific period motif present (sunburst, ziggurat-step, fan), not just "gold colour + serif font."
3. The metallic accent stays restrained to ornament/rules/icons, not flooded across backgrounds — that reads gaudy, not engineered luxury.

**Type pick:** Cinzel — OFL 1.1, [fonts.google.com/specimen/Cinzel](https://fonts.google.com/specimen/Cinzel) (designer Natanael Gama) for engraved-classical caps, or Poiret One — OFL 1.1, [fonts.google.com/specimen/Poiret+One](https://fonts.google.com/specimen/Poiret+One) for an authentic thin Deco display flourish (display-only — pair with a plain serif/sans for text).

---

### 5.19 Y2K / Frutiger Aero (glossy tech-optimism)

**Signal:** nostalgic, techno-utopian, glossy, "the future we were promised" — a live 2025–2026 trend, not purely historical. **Lineage:** two related but distinguishable waves. **(a) Y2K proper** (late 1990s–early 2000s): chrome, translucent plastic (iMac G3-era), silver-and-cyber optimism. **(b) Frutiger Aero** — named **2017** by Sofi Xian of the Consumer Aesthetics Research Institute, retroactively describing mid-2000s–early-2010s UI (Windows Aero/Vista glossy gradients, nature-tech imagery: blue sky, water, aurorae, bokeh). Both are in active revival as of 2025–2026, and commentary explicitly links Apple's 2025 Liquid Glass language (§5.7) back to Frutiger Aero lineage. ([Wikipedia — Frutiger Aero](https://en.wikipedia.org/wiki/Frutiger_Aero), [Kittl](https://www.kittl.com/blogs/frutiger-aero-aesthetic-stl/), [Dazed](https://www.dazeddigital.com/life-culture/article/58103/1/what-is-frutiger-aero-aesthetic-tiktok-msn-messenger-windows-vista-noughties))

| Axis | Spec |
|---|---|
| Type (→A2) | A2 class: **Humanist sans** — A2's own archetype list for this class literally includes **Frutiger** itself, the typeface this aesthetic is named after. Rounded, glossy-adjacent, medium-heavy weight; occasional italic-condensed accents for early-2000s tech-branding flavour. |
| Colour (→A1) | Bright saturated blues/greens/yellows referencing sky/water/nature imagery; high-gloss, *multi-stop* gradients (not the flat 2-stop gradients of tech-brand minimalism) simulating a wet/glassy reflection. |
| Shape/space (→A4) | Bubble/pill shapes with a strong specular highlight — a bright white "shine" ellipse on every glossy element; this single detail is the era's most identifying marker. Rounded-everything; water-droplet/bokeh/lens-flare motifs; chrome/brushed-metal edge treatments on structural chrome. |
| Motion (→B1) | Bouncy, glossy hover states (a highlight sweep on hover); soft floating/parallax bokeh in backgrounds (slow, small-displacement — respect B1's vestibular limits); reflective "wet" transitions. |

**When to use:** nostalgia-marketing, Gen-Z-targeted consumer brands, music/entertainment, anywhere "optimistic tech future" is the desired register, distinguishing a brand from flat/minimal competitors. **When NOT:** enterprise/serious-trust contexts; anywhere the brief wants restraint (this is a maximal, glossy, ornamented direction); accessibility-constrained builds (heavy gloss/gradient text carries real contrast risk).

**How it fails:** the gloss/highlight detail is skipped — a rounded blue gradient button *without* the specular highlight ellipse just reads as "rounded gradient," not Aero (the single most-missed detail); or it's overused past nostalgia into visual noise.

**Authentic vs. cosplay:**
1. The specular-highlight ellipse/shine is present on glossy elements — the single highest-leverage authenticity marker for this style.
2. Nature-tech imagery motifs (water, sky, bokeh) appear somewhere, not just colour.
3. Gradients are multi-stop and "wet," not flat 2-stop tech gradients.

**Type pick:** a free rounded-terminal humanist sans as the practical substitute for the era's commercial Frutiger/Myriad-class faces — Nunito Sans, OFL 1.1, [fonts.google.com/specimen/Nunito+Sans](https://fonts.google.com/specimen/Nunito+Sans), or Quicksand. **Note explicitly:** Frutiger itself is a commercial Monotype-family typeface and is not free — these are approximations of its rounded-humanist register, not substitutes claimed to "be" Frutiger (Executive Rule 11).

**A11y flag:** gloss/gradient text needs contrast checked at its darkest rendered point, not its average — specular highlights wash out edges.

---

### 5.20 Material / Dynamic-Adaptive (Google Material Design lineage)

**Signal:** systematic, cross-platform-consistent, "Google-tech," adaptive-to-the-user, engineered-but-friendly. **Lineage:** Google **Material Design** launched **2014** (paper-and-ink metaphor, flat design + realistic shadow physics); evolved to **Material You**/Material 3 (2021, wallpaper-derived dynamic colour); **Material 3 Expressive**, rolling out through 2025 across Pixel/Android/Wear OS, adds a **35-shape morphing library**, spring-based motion throughout, and bolder typographic hierarchy per Google's own announcements. ([Android Authority — Material 3 Expressive](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/), [m3.material.io](https://m3.material.io/) — also the duration/easing source cited in **B1**)

| Axis | Spec |
|---|---|
| Type (→A2) | Roboto — the system's own native, authentic choice — or Roboto Flex for variable-weight expressive headlines. Material 3 Expressive specifically pushes larger, heavier headline weights for scannability. |
| Colour (→A1) | Dynamic/adaptive — a small set of seed colours algorithmically generates a full tonal palette (primary/secondary/tertiary containers, each with on-colour pairs) that can shift per-user (wallpaper-derived) or per-brand (seeded). The algorithmic derivation itself, not any fixed palette, is the authenticity marker. |
| Shape/space (→A4) | A defined shape-token scale (none/xs/sm/md/lg/xl radius steps) applied consistently by component role, plus — as of Expressive — morphing *between* shape states (square↔squircle) as a first-class motion device. |
| Motion (→B1) | Spring-physics-driven throughout, not duration+easing curves — cross-ref B1 §4.3 for the mechanics. M3's own token ladder (short1–extra-long4, **50 ms–1000 ms**, already verified in **B1** §4.1) is a primary source worth reusing directly. |

**When to use:** Android-adjacent or cross-Google-ecosystem products, briefs explicitly referencing "Material Design"/"feels like Google," teams wanting a well-documented, pre-solved token system *as* the aesthetic itself. **When NOT:** iOS-primary or brand-distinct products — Material has a strong, recognisable house style that can read as generic-Android rather than bespoke (cross-ref F2); any brief wanting a non-tech/non-systematic signal.

**How it fails:** only the colour tokens are borrowed while shape/motion/type stay generic, producing an uncanny "not-quite-Material" hybrid that reads as neither systematic nor bespoke; or it's applied to a non-Android context without adaptation, so users read unmistakably-Material components as "someone used a component library" — undercutting a bespoke-brand brief.

**Authentic vs. cosplay:**
1. The tonal-palette-from-seed-colour derivation is actually implemented, not just "we picked colours that look Google-ish."
2. Shape tokens applied by role consistently — buttons/cards/sheets each get their defined step, not ad hoc radii.
3. Spring motion — not `cubic-bezier` curves — genuinely drives transitions, matching M3's actual mechanism.

**Type pick:** Roboto — **Apache License 2.0** (note: not OFL — one of the few Google Fonts exceptions), [github.com/googlefonts/roboto](https://github.com/googlefonts/roboto); or Roboto Flex — OFL 1.1, [fonts.google.com/specimen/Roboto+Flex](https://fonts.google.com/specimen/Roboto+Flex).

---

## 6. Failure modes (cross-movement, system-level)

Per-movement failures are catalogued in each §5.x row. This table covers failures that happen *across* the catalogue, when using it as a system.

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Skin, not commitment** — only colour tokens changed | Two "different directions" share identical type, radius, and motion; only hex codes differ | Force at least one type-classification change (→A2) + one shape/motion change (→A4/B1) per direction swap (Executive Rule 5) |
| **Adjective mismatch** — "modern" guessed wrong | Client says "that's not what I meant" on a single-word brief | Route through §4.2's disambiguation table; confirm with a second reference (competitor/era/artifact) before locking tokens |
| **Direction doesn't survive dark mode** | Toggling theme breaks the identifying token — skeuomorphism's gradient inverts to "wet plastic," brutalism's white/black flips oddly | Decide, per direction, which token carries identity in each mode *before* building either (Executive Rule 4) |
| **Two+ directions collide incoherently** | A page has neo-brutalist buttons next to glassmorphic cards next to a luxury-serif headline with no dominant grammar | Cap at 2 directions, one dominant/one accent (Executive Rule 9) |
| **Trend-current direction shipped as if timeless** | Y2K/Frutiger-Aero or neo-brutalism used for a durable enterprise brand with no refresh plan | Flag trend-bound choices explicitly to the human owner (Executive Rule 13) |
| **A11y-risk direction shipped unmitigated** | Glass/neumorphism/cyber-neon panel fails 4.5:1/3:1 against the actual rendered backdrop | Run the A5 conformance pass + ship a solid/opaque fallback before shipping (§4.5) |
| **Domain motif borrowed generically** | The illustration/motif could be swapped onto a competitor's product with zero change needed | Use the domain-materials method (§4.3) to find a specific, non-swappable artifact |
| **Corporate-Memphis drift inside Playful** | Characters/illustrations are interchangeable with any other tech company's | Apply Playful's authenticity markers (§5.15) — a specific, differentiated mascot/motif system |
| **Cosplay — the movement is a skin, not a grammar** | The build fails its row's 2-of-3 authenticity-marker test | Revisit against the per-movement "authentic vs. cosplay" checklist (§5.x) |
| **Motion character contradicts the movement** | A brutalist site with 400 ms eased spring transitions; a luxury site with bouncy overshoot | Apply §4.4's motion-family mapping |
| **Recommended font is commercial but treated as free** | Spec calls for Helvetica/Univers/Futura/Frutiger/Didot without a licensing note | Substitute the catalogue's named free/open alternative (Executive Rule 11) |
| **Movement reached for out of reflex, not fit** | Glassmorphism, bento grid, or dark-mode-as-default appears because it's easy, not because the brief calls for it | Cross-check against **F2**'s own cliché catalogue — these three are explicitly named there as former escapes now over-applied |

---

## 7. Pre-flight checklist

- [ ] Exactly one direction is named — or exactly two, with one explicitly dominant — before any token is written (Executive Rules 1, 9).
- [ ] The direction was chosen via the adjective-mapping table (§4.2) **and** confirmed with at least one disambiguating reference, not a single ambiguous word (Executive Rule 3).
- [ ] Type, colour, shape/space, **and** motion all changed together — not just colour (Executive Rule 5).
- [ ] At least 2 of the row's 3 "authentic vs. cosplay" markers are present (§5.x, Executive Rule 6).
- [ ] Domain materials were mined (§4.3) before falling back to the movement's generic stock motifs (Executive Rule 8).
- [ ] Both light **and** dark mode were checked for the token that carries the direction's identity (Executive Rule 4).
- [ ] Every recommended font is free/open with licence + source noted; any historically "correct" but commercial face (Helvetica, Univers, Futura, Frutiger, Didot) has a flagged open substitute (Executive Rule 11).
- [ ] If the direction is glass, neumorphism, cyber-neon, or terminal-dark: a WCAG **1.4.3** (4.5:1 text) and **1.4.11** (3:1 non-text) pass was run against the *actual rendered* background, and a solid/opaque fallback exists (§4.5, →A5).
- [ ] Motion character matches the movement's family archetype (§4.4), not a generic default.
- [ ] If two directions are mixed, one is clearly dominant, per §4.2's hybrid guidance — not an arbitrary collision (Executive Rule 9).
- [ ] Trend-bound choices (Y2K/Aero, Neo-Brutalism, Material 3 Expressive's specific vocabulary) are flagged to the human owner as trend-bound, distinct from durable classics (Executive Rule 13).
- [ ] The chosen direction was cross-checked against **F2** — does it still look like every other AI-generated site in this direction, or does it carry a specific, non-generic detail.

---

## 8. Open questions / unverified

- **The adjective→direction mapping (§4.2) is original synthesis.** No canonical industry taxonomy maps client adjectives to named aesthetic movements; the table is built from this report's own sourced movement characteristics, cross-checked against **A2**'s parallel (and independently written) brief-adjective-to-typeface-class table for internal consistency. Treat it as a strong starting heuristic, always confirmed with a second reference.
- **"Authentic vs. cosplay" markers per movement (§5.x) are synthesis.** They are pattern-matched from each movement's sourced failure-mode commentary plus general design-critical reasoning, not a peer-reviewed checklist. `[SYNTHESIS]`
- **The domain-materials method (§4.3) is original methodology synthesis**, offered as a strong, checkable starting process rather than a documented industry-standard procedure; its worked domain examples are illustrative, not sourced case studies of real shipped products.
- **Trend-currency claims** (Y2K/Frutiger Aero revival, bento-grid dominance, Material 3 Expressive rollout specifics, neo-brutalism's Gumroad/Figma accelerant story) are sourced to design-trend journalism (Kittl, Dazed, 9to5Google/Android Authority, Envato, Bejamas) as of the mid-2026 research date. These are fast-moving and should be re-verified at build time — the same caveat **B1** applies to its scroll-driven-animation support table. The Gumroad/Figma-as-accelerant claim specifically is trend-commentary, not independently verified against Gumroad's own design writeup.
- **Apple Liquid Glass accessibility specifics** (the "contrast can fall below WCAG 2.2 AA on complex wallpapers" claim, the exact behaviour of Apple's Reduce Transparency/Reduce Motion toggles) are sourced to a third-party design-blog analysis (designedforhumans.tech), not Apple's own Human Interface Guidelines accessibility documentation directly — treat as reasonable-but-secondary pending direct HIG verification at implementation time.
- **Font licence/source verification depth varies.** Designer/foundry attribution was independently confirmed via primary repositories for Fraunces (Undercase Type, via `github.com/undercasetype/Fraunces/OFL.txt`) and Bricolage Grotesque (Mathieu Triay / Atelier Triay, via its GitHub repo) during this research. The remaining recommended faces are stated with licence = OFL 1.1 (or Apache 2.0 for Roboto, called out explicitly) and source = `fonts.google.com/specimen/<name>`, consistent with Google Fonts' near-universal licensing policy and with the specific faces already vetted in **A2**'s own catalogue — but individual OFL.txt files were not re-fetched for every single face in this report. Confirm at implementation time if attribution precision matters for the deliverable (cross-ref **H1**'s provenance-ledger requirement).
- **Duolingo's shape language:** this report deliberately does **not** claim Duolingo's own writing asserts a fixed shape→emotion symbolism (e.g. "circles mean X") — their own blog post frames the effect through composition, exaggeration, and rhythm instead, and §5.15 is worded to match that, not to overstate it.
- **The blur-amount guidance for glassmorphism (§4.5)** synthesises two sources that emphasise different failure directions (NN/g: under-blurring busy backgrounds; Axess Lab: over-relying on blur for contrast) into one complementary rule. Both were fetched directly and are quoted accurately; the synthesis connecting them is this report's own.
- **Research method note:** this report's WebSearch budget was exhausted mid-task (200/200 calls); remaining verification relied on direct WebFetch against known/discovered URLs, including the sibling registry documents already on disk (A1–A5, B1, C1–C2, D2, E1, F2, G1, G3, H1), which were read directly to ensure this track's boundary claims, cross-references, and shared numbers (e.g. A4's glass recipe, A2's type classification, A3's grid techniques) are consistent with — not contradictory to — what those tracks already state.

---

## 9. Sources

**Design history / movement origin (primary or best-available):**
- [The Graphic Design School — Swiss Style / International Typographic Style](https://www.thegraphicdesignschool.com/design-history/swiss-style-movement/) — typefaces, grid, key figures, dates.
- [Grapheine — Josef Müller-Brockmann](https://grapheine.com/en/magazine/graphic-designer-muller-brockmann-swiss-style/).
- [Brutalist Web Design — manifesto](https://brutalist-web.design/) — the seven principles.
- [Nielsen Norman Group — Neobrutalism: Definition and Best Practices](https://www.nngroup.com/articles/neobrutalism/).
- [Hype4.Academy — Glassmorphism generator/origin](https://hype4.academy/tools/glassmorphism-generator) — Michal Malewicz coinage.
- [Interaction Design Foundation — What Is Glassmorphism?](https://ixdf.org/literature/topics/glassmorphism)
- [Apple Newsroom — "Apple introduces a delightful and elegant new software design," June 2025](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) — Liquid Glass, official description.
- [Wikipedia — Neumorphism](https://en.wikipedia.org/wiki/Neumorphism) — coinage (2019), Alexander Plyuto, accessibility decline.
- [Smashing Magazine — Claymorphism: Will It Stick Around? (2022)](https://www.smashingmagazine.com/2022/03/claymorphism-css-ui-design-trend/)
- [Superdesign.dev — Skeuomorphism style/recipe](https://superdesign.dev/styles/skeuomorphism)
- [Wikipedia — Skeuomorphism](https://en.wikipedia.org/wiki/Skeuomorphism) — etymology, Apple/Ive/iOS 7 history.
- [Forbes — Apple's iOS 7 and the end of skeuomorphism](https://www.forbes.com/sites/timworstall/2013/09/19/apples-ios7-well-it-was-time-for-skeuomorphism-to-die/)
- [Stellae Design — Cyberpunk UI Design](https://www.stellae.design/en/learn/cyberpunk-ui-design)
- [DesignerUp — Trendy blobs and organic shapes](https://designerup.co/blog/trendy-blobs-and-organic-shapes/)
- [gbd magazine — What is Biophilic Design?](https://gbdmagazine.com/what-is-biophilic-design/)
- [Webflow — Luxury brand websites](https://webflow.com/blog/luxury-brand-websites)
- [Duolingo Design Blog — Shape language, Duolingo's art style](https://blog.duolingo.com/shape-language-duolingos-art-style/)
- [AIGA Eye on Design — What the think pieces about "Corporate Memphis" tell us](https://eyeondesign.aiga.org/what-the-think-pieces-about-corporate-memphis-tell-us-about-the-state-of-illustration/)
- [Wikipedia — Corporate Memphis](https://en.wikipedia.org/wiki/Corporate_Memphis)
- [Wikipedia — Bauhaus](https://en.wikipedia.org/wiki/Bauhaus) — founding date, Gropius, closure, principles.
- [Design Museum — Memphis](https://designmuseum.org/memphis) — founding date, members, characteristics.
- [Wikipedia — Art Deco](https://en.wikipedia.org/wiki/Art_Deco) — period, motifs, name origin.
- [Wikipedia — Frutiger Aero](https://en.wikipedia.org/wiki/Frutiger_Aero) — coinage (2017, Sofi Xian), characteristics, revival, Liquid Glass link.
- [Kittl — Frutiger Aero aesthetic, 2026 comeback](https://www.kittl.com/blogs/frutiger-aero-aesthetic-stl/)
- [Dazed — What is Frutiger Aero](https://www.dazeddigital.com/life-culture/article/58103/1/what-is-frutiger-aero-aesthetic-tiktok-msn-messenger-windows-vista-noughties)
- [Android Authority — Material 3 Expressive deep dive](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/)
- [Envato Tuts+ — What is the Maximalism Graphic Design Trend?](https://design.tutsplus.com/articles/what-is-the-maximalism-graphic-design-trend--cms-108604)
- [Cedilla Studio — Editorial design inspiration](https://www.cedilla.studio/blog/editorial-design-inspiration)
- [uidesignprompts.com — Terminal design system spec](https://uidesignprompts.com/prompts/terminal-design)
- [Interaction Design Foundation — Dieter Rams' 10 timeless commandments](https://ixdf.org/literature/article/dieter-rams-10-timeless-commandments-for-good-design)
- [Design Museum — Dieter Rams' Ten Principles](https://designmuseum.org/discover-design/all-stories/what-is-good-design-a-quick-look-at-dieter-rams-ten-principles)
- [senorit.de — Bento grid design trend 2025](https://senorit.de/en/blog/bento-grid-design-trend-2025)

**Accessibility:**
- [W3C — Understanding SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C — Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Nielsen Norman Group — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/)
- [Axess Lab — Glassmorphism meets accessibility: can frosted glass be inclusive?](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)
- [designedforhumans.tech — Liquid Glass: smart or bad for accessibility?](https://designedforhumans.tech/blog/liquid-glass-smart-or-bad-for-accessibility)

**Trend commentary (used for currency/context claims, flagged as trend journalism not peer-reviewed research):**
- [Envato Author Hub — Trend Deep Dive: Neo-brutalism](https://author.envato.com/hub/trend-deep-dive-neo-brutalism/)
- [Bejamas — Neubrutalism, the UI design trend that wins the web](https://bejamas.com/blog/neubrutalism-web-design-trend)
- [Figma — Top web design trends for 2026](https://www.figma.com/resource-library/web-design-trends/)

**Font licences (source + licence verified directly):**
- Fraunces — OFL 1.1, Undercase Type — [github.com/undercasetype/Fraunces](https://github.com/undercasetype/Fraunces).
- Bricolage Grotesque — OFL 1.1, Mathieu Triay / Atelier Triay — [github.com/ateliertriay/bricolage](https://github.com/ateliertriay/bricolage).
- Roboto — Apache License 2.0 — [github.com/googlefonts/roboto](https://github.com/googlefonts/roboto).
- All other recommended faces — OFL 1.1 via Google Fonts (`fonts.google.com/specimen/<name>`), consistent with Google Fonts' near-universal licensing policy; see §8 honesty flag on verification depth.

**Registry cross-references (internal, read directly to verify consistency — not external citations):**
- `/home/claude/A1-colour-intelligence.md` — OKLCH reasoning, accent budget, hue-tinted neutrals.
- `/home/claude/A2-typography.md` — type classification table, brief-adjective mapping, font catalogue, "don't default to Inter" rule.
- `/home/claude/A3-space-layout-and-composition.md` — bento/asymmetric-grid technique, whitespace-as-hierarchy rule.
- `/home/claude/A4-shape-depth-and-material.md` — radius scale, bevel/elevation primitives, verified glassmorphism recipe, neumorphism a11y liability note.
- `/home/claude/A5-accessibility-and-inclusive-design.md` — WCAG SC master table.
- `/home/claude/B1-motion-and-animation-systems.md` — duration ladder, easing archetypes, spring damping ratio.
- `/home/claude/C2-design-systems-tokens-and-coherence.md` — "coherence ≠ taste," F1/F2 attribution.
- `/home/claude/E1-performance-delivery-and-css-architecture.md` — "F1 Aesthetic judgement" framing.
- `/home/claude/F2-distinctiveness-and-anti-generic.md` — the F1/F2 boundary statement, current slop-cliché catalogue (glassmorphism, bento, dark-mode-default).
- `/home/claude/G1-variant-generation-and-convergence.md` — variant-count/fidelity-ladder methodology this track's catalogue feeds into.
