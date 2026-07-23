# A2 — Typography (general)

*Design-intelligence reference. Track A2 of the registry research map. Written to be read by the UI-design agent before it sets any type, and by a human owner auditing that work. Every recommended face is free + self-hostable; every technique carries a strict-CSP / single-file / offline verdict.*

---

## 1. Scope line

This track owns **type as a working system**: how to *read* a typeface (classification → the mood it signals), how to *pick* one from a brief adjective, how to *pair* two so they cooperate, how to *size* them (modular scales and when to abandon them), how to *set* them (measure, leading, rag, hyphenation, `text-wrap`), which *numerals* belong where, how a face must *change between light and dark*, how *variable fonts* earn their bytes, what breaks when *scripts mix*, and how to *self-host and embed* any of it inside a single offline HTML file under strict CSP.

## 2. Boundary (what this track does **not** cover)

MECE split against the sibling tracks — name-checked so nothing here duplicates them:

- **The *words* — microcopy, tone, error strings, button labels, empty-state wording** → **D1 UX writing**. A2 sets the glyphs; D1 chooses the characters.
- **Icon glyphs / icon fonts as symbols** → **D2 Iconography**. A2 covers *text* glyphs and the mono faces used for code, not pictographic icon sets.
- **Font *loading* performance and subsetting *at scale* — byte budgets, `font-display` strategy tuning, critical-font preloading, CLS scoring** → **E1 Performance**. A2 gives the *offline-embed method* (subset → WOFF2 → base64 `@font-face`) and the metric-override fallback; **E1 owns the byte budgets and the loading policy.**
- **The *colour* of text — contrast ratios, APCA, halation, pure-black/pure-white bans** → **A1 Colour**. A2 owns the *weight/tracking/leading* deltas between light and dark (optical, not chromatic); A1 owns the contrast math. Cross-referenced where they touch.
- **Where sourcing tables live broadly / the cross-domain asset matrix** → **H1**. A2 owns **role/mood selection + the curated open-licensed type catalogue** (§5); H1 is the wider sourcing index.
- **Whether reaching for a given face reads as generic / on-trend / brand-diluting** → **F2 Distinctiveness**. A2 flags the Inter-overuse risk with data and points at F2 for the verdict.
- **Motion of type** (kinetic headlines, variable-axis animation timing) → **B1 Motion**. A2 says *which axis* is animatable and *why* (grade, weight); B1 owns duration/easing.

---

## 3. Executive rules (apply these before reading the body)

1. **Pick the class from the brief's *mood*, not from a favourites list.** The map is stable: **humanist/old-style serif** → tradition, warmth, long-form trust; **transitional serif** → authority, editorial neutrality; **Didone/modern serif** → luxury, fashion, high-contrast elegance (fragile small); **humanist sans** → friendly, legible, human; **grotesque sans** → honest, sturdy, editorial; **neo-grotesque sans** → neutral, corporate, objective (can read generic); **geometric sans** → modern, architectural, forward (weak in long text); **mono** → technical, engineered, raw-data. Choose the *class* first, the *face* second (§4.1–4.2).
2. **Two families is the ceiling; earn the second one.** Get hierarchy from **weight, size, colour and role** before you add a family. Three families needs a written reason. A **superfamily** (one design across scripts/widths/mono, e.g. IBM Plex, Source, Noto) beats an ad-hoc pair on harmony every time (§4.3).
3. **Pair by contrast, share a mood.** Two subtly-different neutral sans read as a *mistake*, not a system — "subtle differences look like accidents, clear differences look like design." Pair *across* classes (editorial serif display + neutral sans body) or exploit one family's weight range. Check x-height, width and rhythm are not hostile side-by-side ([Pangram Pangram](https://pangrampangram.com/blogs/journal/how-to-pair-fonts)).
4. **Anchor sizes to a modular scale, then round to the grid.** Ratio **1.125–1.2** for dense UI, **1.25** for general web, **1.333–1.5** for editorial hierarchy. Compute in `rem`, then *snap* to values that land on your spacing grid — a pure ratio that yields `31.25px` is fine; one that yields `43.9px` next to an 8-px grid is not (§4.4).
5. **Body measure 45–75 characters per line, target ~66.** Set `max-width: 66ch` (≈ `34em`). **Leading rises with measure and falls with size:** body `line-height` **1.4–1.6** (1.5 default), display **1.05–1.25**, small print **1.5–1.7** (§4.5).
6. **Reach for a variable font when you use ≥ 3 weights or need width / optical-size / grade.** A subset variable font ≈ the weight of **2–4 static cuts** but yields *every* step and unlocks dark-mode **grade** changes with no reflow. For **1–2 weights**, subset *statics* are usually smaller — instance the VF down (§4.6).
7. **Set numerals on purpose.** `tabular-nums` for anything columnar or that *updates in place* — tables, prices, timers, dashboards — or the layout jitters. `oldstyle-nums` for editorial running text; `lining-nums` for UI chrome and all-caps; `slashed-zero` for code, IDs and serials. The default is usually proportional-lining, which is wrong for a data table (§4.7).
8. **Light-on-dark blooms — lighten and open it.** On dark backgrounds reduce weight **~10–15 %** (drop a step, or lower a **`GRAD`** axis so nothing reflows) and open tracking **+0.01 to +0.02em**; optionally reduce `opsz`. This is optical, not chromatic — the *contrast* rules (never `#FFF` on `#000`, halation) are **A1** (§4.8).
9. **Left-aligned / ragged-right by default.** Justify (`text-align: justify`) *only* with `hyphens: auto` and a `lang` attribute, or you get rivers. Never hyphenate or justify headings (§4.5).
10. **`text-wrap: balance` on headings, `text-wrap: pretty` on body — as progressive enhancement only.** `balance` is capped at **6 lines (Chromium) / 10 (Firefox)**; `pretty` is **~82 % support, no Firefox** (July 2026). Both silently degrade to normal wrap — so **gate nothing on them** (§4.5).
11. **Multi-script: prefer a superfamily; otherwise fix the vertical-metric jump.** Mixing families across scripts (Latin + CJK/Arabic/Devanagari) causes baseline/line-height jumps because their `hhea`/`OS-2` metrics differ. Use **Noto / IBM Plex / Source** (harmonised metrics), or repair the fallback with `@font-face` `size-adjust` + `ascent-override`/`descent-override`/`line-gap-override`, or per-`:lang()` `line-height` (§4.9).
12. **Self-host by embedding: subset → WOFF2 → base64 `@font-face`.** `pyftsubset` to the needed `unicode-range` + OpenType features, `--flavor=woff2`, then inline as `src: url(data:font/woff2;base64,…)`. **CSP verdict: survives a strict, no-network, no-eval sandbox *iff* `font-src` allows `data:`** (this tool's sandbox permits embedded fonts by design). base64 adds **~33 %** — subset first; **E1 owns the byte budget** (§4.10).
13. **Don't default to Inter.** It is excellent and *everywhere* — reflexively reaching for it costs distinctiveness. OFL alternatives with more character: **Public Sans, Libre Franklin, IBM Plex Sans, Source Sans 3, Hanken Grotesk**. Verdict on "does it read generic" is **F2** (§4.1, §5.1).
14. **Always ship a metric-matched fallback stack ending in a generic.** `font-family: "X", "X Fallback", sans-serif`. Give the fallback `@font-face` metric overrides so the pre-paint / font-error frame doesn't shift layout (§4.9–4.10).
15. **Respect optical size.** If the face has an `opsz` axis, keep `font-optical-sizing: auto` so 48-px headings get their intended contrast and 13-px captions stay sturdy. Freezing one `opsz` across a 12→48 px range throws away the axis's whole point (§4.6).

---

## 4. Body

### 4.1 Classification → the mood each class signals

Classification is not trivia; it is a **lookup from a design brief's adjectives to a shortlist of faces.** Read a face by three diagnostic features — **contrast** (thick/thin stroke difference), **aperture** (how open the counters and terminals are), and **axis/stress** (angle of the thickest part) — then place it in a class, then read the mood.

| Class | Diagnostic features | Signals / mood | Archetype (proprietary) | OFL equivalent to reach for | Strong for | Weak / avoid for |
|---|---|---|---|---|---|---|
| **Humanist / Old-style serif** (Garalde) | Moderate contrast, angled (calligraphic) stress, bracketed serifs, small x-height | Warm, literary, traditional, trustworthy, "book" | Garamond, Minion, Sabon | **Source Serif 4**, **Lora**, **EB Garamond** | Long-form reading, editorial body, print-feel | Dense UI, tiny sizes, "modern tech" briefs |
| **Transitional serif** | Higher contrast, near-vertical stress, sharper brackets | Authoritative, neutral, institutional, editorial | Times, Georgia, Baskerville | **Libre Baskerville**, **Newsreader**, **PT Serif** | News/editorial, headings + body, formal UI | Playful or luxury-fashion moods |
| **Didone / Modern serif** | Extreme contrast, vertical stress, hairline unbracketed serifs | Elegant, luxury, fashion, cold, high-fashion | Didot, Bodoni | **Playfair Display**, **Fraunces** (high `opsz`) | Fashion/beauty display, large headlines | **Body text, small sizes** — hairlines vanish/shimmer |
| **Slab serif** | Low contrast, heavy rectangular serifs | Sturdy, mechanical, confident, retro-industrial | Rockwell, Clarendon | **Bitter**, **Roboto Slab**, **Zilla Slab** | Screen headings, sturdy body, "solid" brands | Elegant/delicate briefs |
| **Humanist sans** | Some stroke modulation, open apertures, Roman proportions, calligraphic *e/a* | Approachable, human, legible, calm, accessible | Frutiger, Gill, Myriad | **Source Sans 3**, **IBM Plex Sans**, **Hanken Grotesk** | Body UI, forms, accessible reading | When you need cold neutrality |
| **Grotesque sans** (early) | Slight contrast, some quirk, squared curves, spurred G | Honest, sturdy, editorial, early-industrial | Franklin Gothic, Founders Grotesk | **Libre Franklin**, **Archivo**, **Space Grotesk** | Editorial headlines, characterful UI | Ultra-clean corporate minimalism |
| **Neo-grotesque sans** | Near-zero contrast, closed apertures, uniform, horizontal terminals | Neutral, modern, corporate, objective — *can read generic* | Helvetica, Univers, Akzidenz | **Inter** (flag overuse), **Public Sans**, **Roboto** | Dense product UI, data, neutral chrome | Distinctiveness (→ F2); warmth |
| **Geometric sans** | Circular *O*, single-story *a*, near-monoline | Modern, architectural, precise, forward, "startup" | Futura, Avenir, Century Gothic | **Poppins**, **Jost**, **Montserrat** | Big display, logos, short marketing | **Long body text** — low immersive legibility |
| **Monospace** | Fixed advance width, exaggerated details, slab-ish terminals | Technical, engineered, precise, raw data, code | Courier, Consolas | **JetBrains Mono**, **IBM Plex Mono**, **Space Mono** | Code, data, terminals, "engineered" brands | Long prose; dense tabular *labels* |
| **Display / decorative** | Anything — high personality by design | Whatever the face says; headline-only voice | (thousands) | **Fraunces**, **Big Shoulders**, **Space Grotesk** | Headlines, hero, logotype | **Body text at any size** |

Sources for the taxonomy and features: [Smashing — Making Sense of Type Classification](https://www.smashingmagazine.com/2013/06/making-sense-of-type-classification-part-2/), [Toptal — Typeface Classification](https://www.toptal.com/designers/typography/typeface-classification).

**The distinctiveness flag (cross-ref F2).** Inter is the reflexive UI default and it *shows*: it, Roboto, Open Sans, Poppins and Montserrat dominate real-world usage ([Web Almanac 2025 — Fonts](https://almanac.httparchive.org/en/2025/fonts)). Excellent engineering, but "neutral" plus "ubiquitous" = *invisible brand*. If the brief wants character, treat the neo-grotesque slot as **Public Sans / Libre Franklin / IBM Plex Sans / Hanken Grotesk** and let **F2** rule on generic-ness.

### 4.2 From a brief adjective to a face — decision table

The brief rarely says "geometric sans." It says a mood word. Translate:

| Brief says… | Class to reach for | First OFL pick | Second OFL pick | Why |
|---|---|---|---|---|
| Trustworthy, editorial, long-form, "serious" | Humanist/transitional serif | **Source Serif 4** | Newsreader | Angled stress + open aperture = immersive reading |
| Modern, neutral, clean, corporate | Neo-grotesque sans | **Public Sans** | Inter *(flag overuse)* | Low contrast, objective; Public Sans dodges the Inter cliché |
| Friendly, approachable, human, warm | Humanist sans | **Source Sans 3** | IBM Plex Sans | Stroke modulation + open forms read "human" |
| Technical, precise, engineered | Grotesque / mono-inflected | **Space Grotesk** | IBM Plex Mono / JetBrains Mono | Squared forms + mono cues = "engineered" |
| Elegant, luxury, fashion, refined | Didone / high-contrast display | **Playfair Display** | Fraunces (opsz 144) | Hairline contrast reads couture — *display only* |
| Bold, confident, sturdy, loud | Grotesque / slab, heavy weights | **Libre Franklin** (Black) | Archivo / Bitter | Wide weight range, sturdy skeleton |
| Playful, characterful, editorial-quirky | Old-style-with-attitude | **Fraunces** (`SOFT`/`WONK`) | Recursive (Casual) | Softness/wonk axes add warmth without silliness |
| Startup, geometric, forward | Geometric sans | **Poppins** | Jost | Circular geometry = "future"; keep body elsewhere |
| Accessible, maximum legibility, low-vision | Legibility-first sans | **Atkinson Hyperlegible** | Public Sans | Disambiguated glyph shapes (0/O, 1/l/I) |

**Anti-pattern:** matching the *literal* subject instead of the *mood* — a bank does not want a "money-looking" font, it wants *transitional-serif authority*; a kids' app does not want Comic Sans, it wants *rounded humanist warmth* (e.g. Baloo, Quicksand — both OFL).

### 4.3 Pairing — rules that actually hold

The single most-repeated professional rule: **most projects need two families; three is a stretch** ([Pangram Pangram](https://pangrampangram.com/blogs/journal/how-to-pair-fonts)). Get contrast from role and weight *before* adding a family.

**Four pairing strategies, in order of safety:**

1. **One superfamily, many roles (safest).** IBM Plex Sans + IBM Plex Mono + IBM Plex Serif; or Source Sans 3 + Source Serif 4 + Source Code Pro. Metrics, weight and rhythm are co-designed — they *cannot* clash. Use for design systems.
2. **One family, its whole weight range.** Inter 800 headlines + Inter 400 body + Inter 500 UI. Zero clash risk; hierarchy comes from weight/size. The default for product UI.
3. **Cross-class contrast pair (the classic).** An **editorial serif display** + a **neutral sans body** (or the reverse): *Fraunces* headlines + *Public Sans* body; *Newsreader* headlines + *Inter* body. High contrast, shared contemporary mood.
4. **Same era / same designer, different structure.** Two faces from a compatible period or hand (e.g. two Adobe Source faces) pair predictably.

**The failure to avoid: the "almost-same" pair.** Two neutral sans with slightly different x-heights (Inter body + Roboto headings) read as a *bug* — the eye registers difference without purpose. If both are sans, make one *clearly* display/grotesque and the other *clearly* neutral, or use one family.

**Checklist for any pair (verify side-by-side at the same optical size):**
- **x-height ratio** within ~5–8 % — mismatched x-heights make one look "shrunk."
- **Weight cross-check** — a "Regular" in one family may be visually heavier than the other's; match by *appearance*, not by the number 400.
- **Mood agreement** — both "thoughtful and contemporary," or both "warm and hand-made"; a luxury serif over a toy sans "feels confused."
- **Contrast present** — different class, or ≥ 2 weight steps apart, or serif-vs-sans.

**Worked example — a complete two-family type system (copyable).** *Newsreader* (transitional editorial serif, OFL) for display + *Public Sans* (neutral grotesque, OFL) for UI/body, on a Major-Third scale (see §4.4 for the numbers):

```css
:root {
  --font-display: "Newsreader", Georgia, "Times New Roman", serif;
  --font-ui:      "Public Sans", system-ui, -apple-system, sans-serif;

  /* Major Third (1.25), base 16px = 1rem */
  --step--1: 0.8000rem;  /* 12.80px  caption / legal */
  --step-0:  1.0000rem;  /* 16.00px  body */
  --step-1:  1.2500rem;  /* 20.00px  lead / H4 */
  --step-2:  1.5625rem;  /* 25.00px  H3 */
  --step-3:  1.9531rem;  /* 31.25px  H2 */
  --step-4:  2.4414rem;  /* 39.06px  H1 */
  --step-5:  3.0518rem;  /* 48.83px  display */

  --measure: 66ch;
  --leading-body: 1.55;
  --leading-head: 1.15;
}
body { font-family: var(--font-ui); font-size: var(--step-0);
       line-height: var(--leading-body); }
p    { max-width: var(--measure); text-wrap: pretty; }
h1, h2, .display {
  font-family: var(--font-display); line-height: var(--leading-head);
  text-wrap: balance; letter-spacing: -0.01em;   /* large serif display tightens slightly */
}
h1 { font-size: var(--step-4); }
h2 { font-size: var(--step-3); }
```

### 4.4 Modular scales — and when to abandon them

A modular scale multiplies a base size by a fixed ratio, up and down. It buys *consistent hierarchy* for free.

**The ratios, named, with feel and fit:**

| Ratio | Musical name | Character | Best for |
|---|---|---|---|
| **1.067** | Minor second | Barely-there steps | Ultra-dense dashboards, data grids |
| **1.125** | Major second | Compact, tight | Dense product UI, tables |
| **1.200** | Minor third | Balanced, calm | General app UI |
| **1.250** | Major third | Clear but not loud | **General web default** |
| **1.333** | Perfect fourth | Confident hierarchy | Editorial, marketing sites |
| **1.414** | Augmented fourth (√2) | Strong, print-derived | Editorial, poster-ish |
| **1.500** | Perfect fifth | Big jumps | Bold editorial, few sizes |
| **1.618** | Golden ratio | Dramatic | Display-led, minimal step count |

Source: [Creative Market — What is a Typographic Scale](https://creativemarket.com/blog/typographic-scale); ratio names are the standard musical-interval set used by [type-scale.com](https://typescale.com) and the Modular Scale tool.

**Worked example — Major Third (1.25) from a 16 px / 1 rem base:**

| Step | Multiplier | px | rem | Role |
|---|---|---|---|---|
| −2 | 1.25⁻² | 10.24 | 0.640 | fine print (rarely) |
| −1 | 1.25⁻¹ | 12.80 | 0.800 | caption, legal |
| 0 | 1.25⁰ | 16.00 | 1.000 | **body** |
| +1 | 1.25¹ | 20.00 | 1.250 | lead / H4 |
| +2 | 1.25² | 25.00 | 1.5625 | H3 |
| +3 | 1.25³ | 31.25 | 1.9531 | H2 |
| +4 | 1.25⁴ | 39.06 | 2.4414 | H1 |
| +5 | 1.25⁵ | 48.83 | 3.0518 | display |

**When to *abandon* the scale (decision rules):**

1. **When it prints a size you don't need.** You need H1, H2, H3, body, caption — five sizes. A ratio generating eight is over-engineered; keep the five, drop the rest.
2. **When a step lands off the grid.** `1.25⁴ = 39.06px` is fine; if a ratio yields `43.9px` next to an 8-px spacing grid, **round to 40 px**. The grid wins; the ratio is a *starting suggestion*.
3. **In dense UI.** Data-dense apps often need fixed, closely-spaced sizes (12 / 13 / 14 / 16 / 20) that no single clean ratio hits. Hand-tune to the component set; a ratio there fights you.
4. **Use a *dual scale* for editorial.** One tight ratio (1.2) for the *text* sizes (caption→lead) and one loose ratio (1.5) for the *display* sizes. A single ratio big enough for dramatic headlines makes body-adjacent steps too far apart.
5. **Fluid type interpolates anyway.** With `clamp()` the scale defines the *endpoints*, not every step:
   ```css
   /* H1 fluid between the mobile and desktop scale steps */
   h1 { font-size: clamp(2rem, 1.5rem + 2.2vw, 2.4414rem); }
   ```
   Compute min and max from *two* scales (a smaller base on mobile), let `clamp()` fill the middle. Recent-CSS note: `clamp()` is universally supported; safe.

### 4.5 Measure, leading, rag, hyphenation, `text-wrap`

**Measure (line length).** The readable band is **45–75 characters per line**, with **~66 the classic target** (Bringhurst) ([Baymard](https://baymard.com/blog/line-length-readability), [UXPin](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/), [Google Fonts Knowledge — Measure](https://fonts.google.com/knowledge/using_type/understanding_measure_line_length)). Below ~45 the eye jumps lines too often; above ~75 it loses the return sweep.

```css
p { max-width: 66ch; }   /* ch = advance width of "0"; ~66ch ≈ 66–72 characters */
```

*Caveat on `ch`:* the `ch` unit is the width of the digit `0`, so `66ch` ≠ exactly 66 characters — proportional text averages a bit more. `34em` is an equivalent rule of thumb. Multi-column layouts drop the target to **40–50 CPL**; narrow UI panels tolerate **35–45**.

**Leading (`line-height`).** Two inverse relationships govern it:
- **Leading rises with measure** — a long line needs more vertical space to find the next line's start.
- **Leading falls as size rises** — big display type needs *tight* leading; small text needs *loose*.

| Context | Size band | `line-height` |
|---|---|---|
| Display / hero | ≥ 40 px | **1.05–1.2** |
| Headings | 24–40 px | **1.15–1.3** |
| Body (UI/web) | 15–20 px | **1.4–1.6** (1.5 default) |
| Long-form editorial | 18–21 px | **1.5–1.7** |
| Captions / fine print | ≤ 13 px | **1.4–1.5** |
| Dense data rows | 12–14 px | **1.2–1.35** |

Use a *unitless* `line-height` so it scales with `font-size`. Reference: [Elements of Typographic Style Applied to the Web §2.1.2](http://webtypography.net/2.1.2).

**Rag & alignment.** Default to **left-aligned / ragged-right** on screen — it gives even word spacing. A *good rag* avoids very short lines, very long lines, and "ladders" (hyphens or the same word stacking). **Justify only with hyphenation**, or word spaces stretch into rivers:

```css
.article p {
  text-align: justify;
  hyphens: auto;          /* REQUIRES a lang attribute on <html> or the block */
  hyphenate-limit-chars: 6 3 3;  /* min word / min before / min after — avoids ugly splits */
}
```
`hyphens: auto` does nothing without `lang` (the browser needs the language's hyphenation dictionary). Never justify or hyphenate **headings**.

**`text-wrap` (recent CSS — use as enhancement, fall back cleanly):**

| Value | Does | Use on | Line limit | Support (Jul 2026) |
|---|---|---|---|---|
| `balance` | Evens line lengths across the block | **Headings, blockquotes, captions** (short) | **≤ 6 lines Chromium / ≤ 10 Firefox** | Baseline 2024 (broad) |
| `pretty` | Fixes orphans, improves rag & hyphenation across the *whole* paragraph | **Body copy** | none | **~82 %**, Chrome 117+ / Safari 26+ / **no Firefox** |
| `stable` | Keeps earlier lines fixed while editing | `contenteditable` | n/a | Baseline 2024 |

Sources: [WebKit — Better typography with text-wrap: pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/), [MDN — text-wrap-style](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap-style), [caniuse — text-wrap: pretty](https://caniuse.com/mdn-css_properties_text-wrap_pretty). Note Chromium's `pretty` only optimises the **last ~4 lines**; Safari (26+) applies it to the **whole paragraph**.

```css
h1, h2, h3, blockquote, figcaption { text-wrap: balance; }
p, li { text-wrap: pretty; }
```
Both **degrade to normal wrapping** when unsupported — safe to apply unconditionally; just never *depend* on the balanced result for layout to work.

### 4.6 Variable fonts — axes, economics, when a VF beats statics

A variable font stores a whole design space in one file, navigable along **axes**. Five registered axes plus common custom ones:

| Axis | Tag | Registered? | What it does | CSS |
|---|---|---|---|---|
| Weight | `wght` | ✔ | Thin→Black, any step | `font-weight: 430;` |
| Width | `wdth` | ✔ | Condensed→Expanded (%) | `font-stretch: 85%;` |
| Optical size | `opsz` | ✔ | Detail/contrast per size | `font-optical-sizing: auto;` |
| Slant | `slnt` | ✔ | Mechanical oblique (degrees) | `font-style: oblique 10deg;` |
| Italic | `ital` | ✔ | True italic (0/1) | `font-style: italic;` |
| **Grade** | `GRAD` | ✗ (custom) | Weight *without* width change → **no reflow** | `font-variation-settings: "GRAD" -50;` |
| Mono / Casual / Cursive / Soft / Wonk | `MONO` `CASL` `CRSV` `SOFT` `WONK` | ✗ | Face-specific personality | `font-variation-settings: "CASL" 0.5;` |

CSS syntax rules: use the **high-level properties** (`font-weight`, `font-stretch`, `font-optical-sizing`, `font-style`) whenever they exist — they're inheritable and animatable. Fall to `font-variation-settings` **only** for custom axes (`GRAD`, `MONO`, …), and set *all* the axes you care about in one declaration (it doesn't inherit partial values). Source: [web.dev — Introduction to variable fonts](https://web.dev/articles/variable-fonts), [MDN — font-variation-settings].

**When a variable font beats statics (decision rule):**

| Situation | Verdict |
|---|---|
| You use **≥ 3 weights** | **VF wins** — one file replaces 3+; Monotype measured **~88 % size reduction** consolidating 48 styles into one VF ([web.dev](https://web.dev/articles/variable-fonts)) |
| You need **width, optical size, or grade** | **VF only** — statics can't interpolate |
| **Dark-mode grade** or animated weight | **VF only** — `GRAD` re-weights with zero reflow (§4.8) |
| You use **exactly 1–2 weights** | **Statics usually smaller** — instance the VF down (below) |
| Strict byte budget, Latin-only, one weight | **Subset static** — a VF carries the whole design space you won't use |

**Instancing (pin a VF to shrink it).** If you only need one weight, don't ship the axes:
```bash
# Pin Public Sans to weight 400, drop the axis — much smaller file
fonttools varLib.instancer PublicSans-Variable.ttf wght=400 \
  --output PublicSans-400.ttf
```

**Performance honesty flags:**
- A VF is **bigger than one static** but **smaller than three**. If you ship Roboto Regular *only*, the VF is a net loss — instance it.
- **base64 inflates whatever you embed by ~33 %** (§4.10). A full Recursive or Fraunces VF is *hundreds of KB* before base64 — **subset aggressively** or the single HTML file bloats. E1 owns the budget.
- VF support is universal in modern browsers (WOFF2 ≈ **65 % of all font requests**, WOFF2+WOFF ≈ 81 %, per [Web Almanac 2025](https://almanac.httparchive.org/en/2025/fonts)); no fallback needed beyond a generic family.

### 4.7 Numerals — tabular vs proportional, lining vs oldstyle, slashed zero

Two independent choices (spacing × height) plus the zero, controlled cleanly via `font-variant-numeric` (which maps to OpenType features under the hood). Reference: [MDN — font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric).

| Feature | Keyword | OT tag | What it does | Use for |
|---|---|---|---|---|
| **Tabular** | `tabular-nums` | `tnum` | Every digit same advance width | Tables, prices in columns, timers, dashboards, anything that **updates in place** |
| **Proportional** | `proportional-nums` | `pnum` | Digits naturally spaced | Running text, headlines |
| **Lining** | `lining-nums` | `lnum` | All digits at cap height, on baseline | UI chrome, all-caps, tables |
| **Oldstyle** | `oldstyle-nums` | `onum` | Digits with ascenders/descenders (3,4,5,7,9 dip) | **Editorial body** — blends with lowercase |
| **Slashed zero** | `slashed-zero` | `zero` | 0 gets a slash | Code, IDs, serials, account numbers |
| Fractions | `diagonal-fractions` | `frac` | ½ built from `1/2` | Recipes, specs |
| Ordinal | `ordinal` | `ordn` | 1ˢᵗ, 2ⁿᵈ superscript markers | Dates, ranks |

**Decision table — which numerals where:**

| Context | Spacing | Height | Zero |
|---|---|---|---|
| Body / editorial prose | proportional | **oldstyle** | normal |
| UI labels, buttons, nav | proportional | lining | normal |
| **Data tables, spreadsheets** | **tabular** | lining | normal (slashed if IDs) |
| **Dashboards / live metrics / counters** | **tabular** | lining | optional slashed |
| **Clocks / timers / stopwatches** | **tabular** | lining | normal |
| **Prices in a vertical list** | **tabular** | lining | normal |
| Code / monospace | (mono is already fixed-width) | lining | **slashed** |

**The bug this prevents:** proportional-lining is the common default, so a live-updating counter or a right-aligned price column **shifts width every time a digit changes** (a `1` is narrower than a `8`). `tabular-nums` locks the width. This is the single most common numeral defect in dashboards.

```css
.price-col, .metric, .timer, table td.num {
  font-variant-numeric: tabular-nums lining-nums;
}
.prose { font-variant-numeric: oldstyle-nums proportional-nums; }
code, .id { font-variant-numeric: slashed-zero tabular-nums; }
```

*High-level vs low-level:* prefer `font-variant-numeric` (readable, inheritable, combinable). `font-feature-settings: "tnum" 1` is the low-level escape hatch — it **overrides** `font-variant-*` entirely and resets any features you didn't list, so don't mix the two on one element. **Honesty flag:** oldstyle/tabular figures only exist if the *face ships them*; many minimal UI fonts include only proportional-lining. Verify the face has the feature before relying on it (Source Serif, Newsreader, IBM Plex, Inter all do).

### 4.8 Optical adjustments — dark vs light (the numbers)

Light text on a dark background **optically bloats** (irradiation / halation): the same weight looks *heavier and slightly larger* than on a light background. Left uncorrected, dark-mode body text looks chunky and buzzy. The corrections are **weight ↓, tracking ↑, optionally opsz ↓** — all optical, not chromatic (contrast/colour is **A1**).

| Parameter | Light default | Dark target | Delta | Mechanism |
|---|---|---|---|---|
| Body weight | 400 | **~340–370** | **−10 to −15 %** (or `GRAD −25…−50`) | counter the bloom |
| Bold weight | 700 | **~600–650** | −50 to −100 | same, at strength |
| Letter-spacing | 0 | **+0.01 to +0.02em** | slight open | blooming closes counters |
| Line-height | 1.5 | 1.5–1.6 | **+0 to +0.1** | give bloomed text air |
| `opsz` (if present) | `auto` | **−5 to −10 %** | reduce high-contrast shimmer | thin strokes bloom worst |

Sources: [CSS-Tricks — Adjusting variable font weights in dark mode](https://css-tricks.com/using-css-custom-properties-to-adjust-variable-font-weights-in-dark-mode/) (uses a `--font-weight-multiplier: 0.85`, i.e. 400→340, 700→595, plus `letter-spacing: .02ch`); [Mark Boulton — Optical sizing for dark mode](https://markboulton.co.uk/journal/optical-sizing-for-dark-mode/) (decrease `opsz` on dark to cut glyph contrast — flagged by the author as **subjective, face-dependent, no fixed number**).

**The clean implementation — one multiplier, or the grade axis:**

```css
/* A) Static/any font: scale weight + open tracking in dark */
:root { --wght-mult: 1; --track: 0; }
@media (prefers-color-scheme: dark) {
  :root { --wght-mult: 0.85; --track: 0.02em; }
}
body   { font-weight: calc(400 * var(--wght-mult)); letter-spacing: var(--track); }
strong { font-weight: calc(700 * var(--wght-mult)); }

/* B) Variable font WITH a grade axis (Roboto Flex, Recursive): re-weight, ZERO reflow */
@media (prefers-color-scheme: dark) {
  body { font-variation-settings: "GRAD" -40; }
}
```

**Why grade (`GRAD`) is the right tool:** it changes apparent weight **without changing glyph width**, so nothing re-wraps or shifts between themes — exactly what you want when only the *background* flipped. Faces with `GRAD`: Roboto Flex, Recursive. Honesty flag: the exact numbers above are **heuristic ranges** — the correct value depends on the face's contrast and your background lightness; tune by eye and confirm against A1's contrast floor.

### 4.9 Multi-script — what breaks when scripts mix, and the fix

Set Latin next to CJK, Arabic, Devanagari, Thai or Cyrillic from *different* families and three things break:

1. **Vertical-metric mismatch → line jump / baseline shift.** Fonts declare vertical metrics in **three** places — `hhea` (Mac origin), `OS/2` *typo* (`sTypoAscender/Descender`), and `OS/2` *win* — and set a `USE_TYPO_METRICS` flag saying which to trust. Different families pick different values, so an inline run that switches font mid-line suddenly grows the line box or drops the baseline. ([type.today — Vertical metrics puzzle](https://type.today/en/journal/verticalmetrics), [SIL — Line Metrics](https://silnrsi.github.io/FDBP/en-US/Line_Metrics.html)).
2. **x-height / cap-height mismatch.** A `16px` Latin next to a `16px` CJK often looks like two different sizes because their design em is filled differently.
3. **Apparent-weight mismatch.** A "Regular" Latin beside a "Regular" CJK frequently looks lighter — CJK regulars carry more ink.

**Two fixes, in order of preference:**

**A) Use a superfamily (best).** One design programme spanning scripts with **harmonised metrics and weights**:
- **Noto** ("No Tofu") — Google's OFL project covering **~all of Unicode** with matched vertical metrics and weights. The universal fallback.
- **IBM Plex** — Latin/Greek/Cyrillic + Thai, Arabic, Devanagari, Hebrew, JP, KR.
- **Source Han / Noto CJK** (Adobe↔Google, same files) — CJK harmonised with Source/Noto Latin.

```css
/* Scripts share metrics → no jump */
:root { --sans: "Noto Sans", "Noto Sans JP", "Noto Sans Arabic", sans-serif; }
```

**B) If you must mix families, repair the fallback's metrics.** Match the fallback to the primary with `@font-face` descriptors so switching mid-run doesn't move the baseline:

```css
@font-face {
  font-family: "JP Fallback";
  src: local("Hiragino Sans"), local("Noto Sans JP");
  size-adjust: 100%;        /* scale glyph size to match primary's x-height */
  ascent-override: 88%;     /* clamp the line box to the Latin metrics */
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: "Inter", "JP Fallback", sans-serif; }
```
`size-adjust` scales the whole face; `ascent/descent/line-gap-override` pin the line box so a taller CJK face can't stretch the line. ([MDN — size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)). Alternatively, set per-language `line-height` with `:lang()`:
```css
:lang(ja), :lang(zh) { line-height: 1.7; }   /* CJK wants looser leading than Latin */
```

**Offline / CSP note for multi-script:** Noto **CJK** faces are **multi-megabyte** — you *cannot* base64-inline a whole one into a single HTML file. **Subset per language** to the exact glyphs used (§4.10), or the file becomes unusable. Latin/Greek/Cyrillic Noto subsets are small and inline fine.

### 4.10 Self-hosting & offline embedding (the strict-CSP method)

The tool ships **one HTML file, no network, no eval**. Fonts therefore must be **embedded**, ideally as base64 `data:` URIs. Method:

**Step 1 — subset to what you use** (`pyftsubset`, from `fonttools`):
```bash
pyftsubset PublicSans-Variable.woff2 \
  --output-file=PublicSans.subset.woff2 \
  --flavor=woff2 \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2074,U+20AC,U+2122,U+2212" \
  --layout-features="kern,liga,calt,ccmp,mark,mkmk,tnum,lnum,onum,pnum,zero,frac" \
  --no-hinting
```
- `--unicodes` = Basic Latin + Latin-1 + common punctuation/symbols (extend for accents, quotes, currency you use).
- `--layout-features` = **keep the OpenType features you rely on** — here the numeral features from §4.7. Default keeps a curated set; naming them is explicit. Use `"*"` to keep *all* (bigger, safest).
- Variable axes (`fvar`/`gvar`) are **preserved by default** — don't `--instance` unless you deliberately want to pin a weight and shrink the file.

**Step 2 — base64-encode, no line wraps:**
```bash
base64 -w0 PublicSans.subset.woff2 > PublicSans.subset.b64      # GNU
# macOS: base64 -i PublicSans.subset.woff2 -o PublicSans.subset.b64
```

**Step 3 — inline in `@font-face`, add a metric-matched fallback:**
```css
@font-face {
  font-family: "Public Sans";
  src: url(data:font/woff2;base64,d09GMgABAAAAAAoAABAAAAAAH…TRUNCATED…) format("woff2");
  font-weight: 100 900;      /* keep variable range */
  font-style: normal;
  font-display: swap;        /* harmless with data: URI — there is no network fetch */
}
/* Metric-matched fallback → no layout shift in the pre-paint / error frame */
@font-face {
  font-family: "Public Sans Fallback";
  src: local("Arial"), local("Helvetica Neue");
  ascent-override: 92%; descent-override: 24%; line-gap-override: 0%;
  size-adjust: 104%;         /* ILLUSTRATIVE — generate real values per face */
}
:root { --font-ui: "Public Sans", "Public Sans Fallback", system-ui, sans-serif; }
```

**CSP / offline verdict (the load-bearing rule):**
- **Survives the strict, no-network, no-eval sandbox — *provided the CSP `font-src` allows `data:`.`** i.e. `font-src 'self' data:` (or `font-src data:`). This tool's sandbox permits embedded fonts by design, so this is satisfied; **if a CSP were `font-src 'self'` only, the `data:` URI would be blocked.** State the requirement explicitly in any handoff.
- **No external request, no CDN, no `fonts.googleapis.com`, no eval** — the whole face is bytes in the file. ✔
- **base64 costs ~33 % over the binary** — always subset *first*; a Latin subset of a VF is typically **15–45 KB WOFF2** → ~20–60 KB base64. Per-face **byte budgets are E1's** — A2 owns *that this is the correct method*.
- **WOFF2 is the only format needed** — modern-browser-only sandbox; no WOFF/TTF fallback required (WOFF2 ≈ 81 % of real requests with WOFF, and this environment is current).

**Honesty flag on the fallback numbers:** the `ascent/descent/size-adjust` values above are *illustrative*. Generate real ones per face (measure the primary's metrics, or use a metric-override generator / the `fontaine`-style tooling) — wrong overrides *cause* the shift they're meant to prevent.

---

## 5. Options catalogue — open-licensed faces indexed by role & mood

**Every face below is [SIL Open Font License 1.1](https://openfontlicense.org) (OFL-1.1)** unless noted — free, self-hostable, embeddable. Columns: **what · when to use · when NOT · where (URL) · cost/feasibility (subset & embed) · pitfalls.** *Licence-verification honesty flag:* Inter, Fraunces and Recursive were confirmed directly from their repos this session; the remainder are the long-established OFL-1.1 releases of these families — **re-read the bundled `OFL.txt` at embed time** to confirm the exact copyright line, and never ship a face whose `LICENSE` you haven't opened.

### 5.1 UI-text / neutral & humanist sans (body, chrome, forms)

| Face | What · mood | When to use | When NOT | Where (URL) | Cost / embed feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **Inter** | Neo-grotesque UI workhorse; neutral, objective. VF `wght 100–900` + `opsz`, rich OT features | Dense product UI, data, dashboards | When brand needs character (→ F2) | [github.com/rsms/inter](https://github.com/rsms/inter) | VF subsets small; Latin ~20–35 KB WOFF2. Embeds cleanly | **Overused → generic**; huge if you don't subset |
| **Public Sans** | USWDS neutral grotesque; slightly warmer, less ubiquitous | The "not-Inter" neutral default | Ultra-distinctive branding | [github.com/uswds/public-sans](https://github.com/uswds/public-sans) | VF `wght`; subsets small | Fewer OT features than Inter; single-axis VF |
| **Source Sans 3** | Humanist sans; friendly, legible, calm | Body, forms, accessible reading | Cold/corporate neutrality | [github.com/adobe-fonts/source-sans](https://github.com/adobe-fonts/source-sans) | VF `wght` (+ italic); subsets well | Slightly generic-Adobe feel |
| **IBM Plex Sans** | Humanist-grotesque; corporate but characterful; **superfamily** (Serif/Mono/scripts) | Design systems needing one family across roles/scripts | Playful/luxury briefs | [github.com/IBM/plex](https://github.com/IBM/plex) | Per-script static + VF; **subset per script** | Full multi-script repo is large — take only what you use |
| **Libre Franklin** | Franklin Gothic grotesque; editorial, sturdy; `wght 100–900` | Characterful headlines + body, editorial UI | Minimal geometric looks | [github.com/impallari/Libre-Franklin](https://github.com/impallari/Libre-Franklin) | VF subsets small | Very wide weight range — pick a disciplined subset of weights |
| **Hanken Grotesk** | Contemporary grotesque; friendly-neutral | Modern product UI wanting a touch more warmth than Inter | — | [fonts.google.com/specimen/Hanken+Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) | VF `wght`; small subsets | Verify OFL in bundle (Google Fonts release) |
| **Atkinson Hyperlegible** | Legibility-first; disambiguated 0/O, 1/l/I; humanist | Accessibility-critical UI, low-vision audiences | Neutral "designery" chrome | [github.com/googlefonts/atkinson-hyperlegible-next](https://github.com/googlefonts/atkinson-hyperlegible-next) | Static weights small | Limited weights/styles; a specialist, not a workhorse |

### 5.2 Editorial / serif (long-form, headings, "trust")

| Face | What · mood | When to use | When NOT | Where (URL) | Cost / embed feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **Source Serif 4** | Transitional serif; neutral, readable; pairs with Source Sans | Editorial body, article text | "Warm hand-made" briefs | [github.com/adobe-fonts/source-serif](https://github.com/adobe-fonts/source-serif) | VF `wght` + `opsz`; subsets well | Slightly institutional |
| **Newsreader** | Editorial serif with `opsz`; italics designed for reading; both text & display | News/editorial reading + headlines | Corporate-neutral UI | [fonts.google.com/specimen/Newsreader](https://fonts.google.com/specimen/Newsreader) | VF `opsz`+`wght`+italic; subset per size use | Big VF if you keep all axes — instance/subset |
| **Lora** | Contemporary brushed serif; warm, screen-friendly | Comfortable long-form with personality | Cold/technical tone | [fonts.google.com/specimen/Lora](https://fonts.google.com/specimen/Lora) | VF `wght`; small | Mild personality — not for luxury contrast |
| **Libre Baskerville** | Web-tuned Baskerville; classic, authoritative | Formal editorial, quotes | Dense UI, tiny sizes | [github.com/impallari/Libre-Baskerville](https://github.com/impallari/Libre-Baskerville) | 3 statics; tiny | Large x-height by design; only 3 styles |
| **Literata** | E-reader serif (Google Books); comfortable, calm | Book-length reading, long articles | Punchy headlines | [fonts.google.com/specimen/Literata](https://fonts.google.com/specimen/Literata) | VF `opsz`+`wght`+italic | Reserved voice; needs `opsz` handled |
| **Bitter** | Slab serif; sturdy, screen-optimised | Solid headings + body, "dependable" brands | Elegant/delicate briefs | [github.com/solmatas/BitterPro](https://github.com/solmatas/BitterPro) | VF `wght`; small | Slab heaviness can dominate |

### 5.3 Display (headlines, hero, logotype — never body)

| Face | What · mood | When to use | When NOT | Where (URL) | Cost / embed feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **Fraunces** | "Old-style with wonk"; `opsz`+`wght`+`SOFT`+`WONK`; editorial, characterful, warm-luxury | Distinctive editorial headlines, brand display | **Body text** (very high contrast at high `opsz`) | [github.com/undercasetype/Fraunces](https://github.com/undercasetype/Fraunces) | Large multi-axis VF — **subset + limit axes** | Wonk/soft need tuning; hairlines fragile small |
| **Playfair Display** | Didone display; elegant, fashion, high-contrast | Luxury/fashion/beauty headlines | Body, small sizes, low-DPI | [fonts.google.com/specimen/Playfair+Display](https://fonts.google.com/specimen/Playfair+Display) | VF `wght`+italic; moderate | Hairline serifs shimmer/vanish below ~24px |
| **Space Grotesk** | Techy proportional grotesque (from Space Mono); modern, engineered | Tech/startup display, product hero | Long reading; warm briefs | [github.com/floriankarsten/space-grotesk](https://github.com/floriankarsten/space-grotesk) | VF `wght`; small | Quirky digits/caps — display only |
| **Archivo** / **Archivo Expanded** | Grotesque display family; wide `wdth` range; strong, industrial | Big condensed/expanded headlines | Delicate/luxury moods | [github.com/Omnibus-Type/Archivo](https://github.com/Omnibus-Type/Archivo) | VF `wght`+`wdth`; subset | Expanded widths eat horizontal space |
| **Big Shoulders** | Condensed display (Chicago-signage roots); bold, urban | Posters, tight vertical headlines | Body, relaxed layouts | [github.com/xotypeco/big_shoulders](https://github.com/xotypeco/big_shoulders) | VF; subset | Condensed → low legibility if overused |

### 5.4 Technical & monospace (code, data, "engineered")

| Face | What · mood | When to use | When NOT | Where (URL) | Cost / embed feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **JetBrains Mono** | Code mono; tall x-height, coding ligatures; clear, modern | Code blocks, terminals, data | Prose | [github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) | VF `wght`; subset (drop ligatures if unused) | Ligatures surprise non-code contexts — disable with `calt 0` |
| **IBM Plex Mono** | Mono member of Plex superfamily; technical yet warm | Mono paired with Plex Sans/Serif | Standalone quirky mono | [github.com/IBM/plex](https://github.com/IBM/plex) | Static + VF; subset | Take only from the large Plex repo |
| **Source Code Pro** | Neutral code mono; disambiguated glyphs | Neutral code/data, pairs with Source | Characterful mono | [github.com/adobe-fonts/source-code-pro](https://github.com/adobe-fonts/source-code-pro) | VF `wght`; small | Plain by design |
| **Space Mono** | Quirky fixed-width display mono | Retro-tech headlines, labels | Long code, long prose | [github.com/googlefonts/spacemono](https://github.com/googlefonts/spacemono) | 2 statics; tiny | Personality-heavy; display use |
| **Fira Code** | Code mono famous for ligatures | Code where `=>`, `!=` ligatures help | Non-code numerals/labels | [github.com/tonsky/FiraCode](https://github.com/tonsky/FiraCode) | Static + VF; subset | Ligatures must be intentional |
| **Recursive** | **Multi-tool VF**: `MONO 0–1` (sans↔mono), `CASL 0–1` (linear↔casual), `wght 300–1000`, `slnt 0→−15`, `CRSV`; playful→technical in one file | One file spanning UI, code, and expressive display; **has grade-like flexibility** | Tight byte budgets (rich axes = weight) | [github.com/arrowtype/recursive](https://github.com/arrowtype/recursive) | Powerful but **large** — subset + limit axes hard | Easy to over-use axes; instance for shipping |

### 5.5 Multi-script / superfamilies

| Face | What · coverage | When to use | When NOT | Where (URL) | Cost / embed feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **Noto** family | Google's "no tofu"; **~all Unicode**, harmonised metrics/weights across scripts | Any multi-script UI; universal fallback | When one custom face already covers your scripts | [notofonts.github.io](https://notofonts.github.io) / [github.com/notofonts](https://github.com/notofonts) | Latin subsets small; **CJK are multi-MB → subset per language** | Do **not** inline whole CJK; per-script files |
| **Noto Sans CJK / Source Han Sans** | CJK (JP/KR/SC/TC), harmonised with Latin | Chinese/Japanese/Korean text | Latin-only projects | [github.com/notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) | **Multi-MB even subset** — take only glyphs used | Byte budget (→ E1); subset ruthlessly |
| **IBM Plex** | Latin/Greek/Cyrillic + Arabic/Thai/Devanagari/Hebrew/JP/KR; superfamily | Corporate systems spanning scripts + roles | — | [github.com/IBM/plex](https://github.com/IBM/plex) | Per-script; subset | Repo is huge — clone only needed scripts |
| **Source Sans/Serif + Han** | Adobe superfamily, Latin↔CJK harmonised | Editorial multi-script | — | [github.com/adobe-fonts](https://github.com/adobe-fonts) | Per-script; subset | Same CJK size caveat |

**Commercial alternatives (one line, for completeness only):** if a paid budget exists and OFL isn't required, *Söhne / Untitled Sans* (neo-grotesque), *Lyon / Tiempos* (editorial serif), and *Berkeley Mono* (mono) are common premium picks — **not self-hostable-free, out of scope**; prefer the OFL rows above.

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Wrong class for the mood** | Geometric sans in a 900-word article; Didone at 13px | Re-map brief adjective → class (§4.1–4.2); serif/humanist for reading, display for headlines only |
| **"Almost-same" pairing** | Two neutral sans with different x-heights; feels off, not designed | Increase contrast (cross-class or ≥2 weights), or collapse to one family (§4.3) |
| **Three+ families, no reason** | Fragmented, "ransom-note" pages | Cut to two; get hierarchy from weight/size/role (§4.3) |
| **Scale off the grid** | 43.9px heading beside 8-px spacing system | Round scale steps to the grid; the ratio is a suggestion (§4.4) |
| **Over-long / over-short measure** | Body lines > 90 chars or < 40 | `max-width: 66ch` (~34em); 45–75 CPL (§4.5) |
| **Leading wrong for size** | Tight body (1.2) or airy display (1.6) | Body 1.4–1.6, display 1.05–1.25; unitless (§4.5) |
| **Justified rivers** | White gaps snaking down justified text | Add `hyphens: auto` + `lang`, or switch to left-aligned (§4.5) |
| **Numeral width jitter** | Live counter / price column jumps width as digits change | `font-variant-numeric: tabular-nums` (§4.7) |
| **Oldstyle figures in a table** | Digits with descenders misalign in columns | `lining-nums` for tables/UI (§4.7) |
| **Dark-mode text looks chunky/buzzy** | Same weight on dark reads bold, shimmery | Weight −10–15 % or `GRAD −40`; tracking +0.01–0.02em; opsz −5–10 % (§4.8) |
| **Theme flip reflows text** | Words re-wrap switching light↔dark | Use `GRAD` (re-weights without width change), not `wght` (§4.8) |
| **Multi-script line jump** | Line height/baseline jumps where scripts meet inline | Superfamily (Noto/Plex), or `size-adjust`+`*-override` on fallback `@font-face` (§4.9) |
| **CJK bloats the single file** | Base64-inlined CJK → multi-MB HTML | Subset per language to used glyphs; never inline a whole CJK face (§4.9–4.10) |
| **Font blocked in sandbox** | Text falls to generic; CSP console error on `data:` | Ensure `font-src` allows `data:`; embed via base64, not a URL (§4.10) |
| **Un-subset VF embedded** | HTML file hundreds of KB heavier than needed | `pyftsubset` to unicode-range + features first; instance if 1 weight (§4.6, §4.10) |
| **Fallback shift (CLS-like)** | Layout nudges on paint/font-error | Metric-matched fallback `@font-face` (real override values) (§4.10) |
| **`text-wrap: pretty` relied on** | Ragged in Firefox; "balanced" heading assumed | Treat as enhancement; design must hold under normal wrap (§4.5) |
| **Inter-by-reflex** | Generic, "seen-it" UI | Consider Public Sans/Libre Franklin/Plex/Source; F2 rules (§4.1) |
| **opsz frozen** | 48px heading thin, 13px caption fragile | `font-optical-sizing: auto`; don't pin `opsz` across a wide size range (§4.6) |

---

## 7. Pre-flight checklist (run before shipping any type)

- [ ] Face **class matches the brief's mood** (§4.1–4.2); serif/humanist for reading, display for headlines only.
- [ ] **≤ 2 families**, contrast is clear, moods agree, x-heights within ~5–8 % (§4.3).
- [ ] Sizes come from a **modular scale**, then **rounded to the grid**; only the steps you need exist (§4.4).
- [ ] Body **measure 45–75 CPL** (`max-width: ~66ch`); **leading 1.4–1.6** body / tight display (§4.5).
- [ ] Left-aligned by default; any **justify has `hyphens: auto` + `lang`** (§4.5).
- [ ] `text-wrap: balance` on headings, `pretty` on body — **as enhancement**, layout holds without them (§4.5).
- [ ] **Numerals set deliberately**: `tabular-nums` for columns/live metrics/timers, oldstyle for editorial, slashed-zero for code/IDs (§4.7).
- [ ] **Variable font** chosen only when ≥3 weights / needs width-opsz-grade; otherwise instanced static (§4.6).
- [ ] **Dark theme**: weight −10–15 % (or `GRAD`), tracking +0.01–0.02em; theme flip **doesn't reflow** (§4.8).
- [ ] **Multi-script**: superfamily, or fallback `@font-face` metric overrides; CJK **subset per language** (§4.9).
- [ ] Every face **subset** (`pyftsubset` → unicode-range + features) → **WOFF2** → **base64 `@font-face`**; no external request (§4.10).
- [ ] **CSP `font-src` allows `data:`**; verdict noted in handoff (§4.10).
- [ ] **Metric-matched fallback** stack ending in a generic; real override values, not the illustrative ones (§4.10).
- [ ] Each face's **`OFL.txt` opened and licence confirmed**; source URL recorded (§5).
- [ ] `font-optical-sizing: auto` where the face has `opsz` (§4.6, §4.15-rule).

---

## 8. Open questions / unverified

- **`text-wrap: pretty` support is moving.** ~82 %, Chrome 117+ / Safari 26+, **no Firefox** as of **July 2026**, and Chromium optimises only the last ~4 lines vs Safari's whole-paragraph pass. Re-check [caniuse](https://caniuse.com/mdn-css_properties_text-wrap_pretty) at build time — treat as time-sensitive enhancement.
- **Dark-mode optical deltas are heuristic, not measured constants.** The −10–15 % weight / +0.01–0.02em tracking / −5–10 % opsz ranges are synthesised from CSS-Tricks and Mark Boulton, both of whom flag the numbers as **face- and background-dependent, tune-by-eye**. Not a spec.
- **Licence verification is partial.** Inter, Fraunces, Recursive confirmed OFL-1.1 directly from repos this session; the other ~20 faces are the well-known OFL-1.1 releases but were **not each re-fetched** — open the bundled `OFL.txt` before shipping any of them. Never invent a licence line.
- **Metric-override fallback values** (`ascent/descent/line-gap/size-adjust`) shown are **illustrative**. Real values must be generated per face; wrong ones cause the shift they prevent.
- **`ch` ≠ character count.** `66ch` measures 66 zero-widths; actual characters per line vary with the face. Confirm the visual measure, don't trust the number blindly.
- **Superfamily vertical-metric harmony is claimed, not universally guaranteed.** Even within Noto, Latin vs CJK line-height often differs — test the specific pair; the `:lang()` line-height patch (§4.9) is frequently still needed.
- **Byte budgets are E1's.** Sizes here ("15–45 KB WOFF2 Latin subset", "CJK multi-MB") are order-of-magnitude guidance, not the authoritative budget — E1 owns the numbers per project.

---

## 9. Sources

Primary / authoritative:
- [MDN — font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric) — figure styles, spacing, slashed zero, OT tags.
- [MDN — text-wrap-style](https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap-style) — balance/pretty/stable, line-count caps.
- [MDN — @font-face size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust) — metric overrides for fallbacks.
- [web.dev — Introduction to variable fonts on the web](https://web.dev/articles/variable-fonts) — five axes, syntax, ~88 % consolidation figure.
- [WebKit — Better typography with text-wrap: pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/) — pretty vs balance behaviour, whole-paragraph pass.
- [caniuse — text-wrap: pretty](https://caniuse.com/mdn-css_properties_text-wrap_pretty) — ~82 %, Chrome 117+/Safari 26+/no Firefox.
- [HTTP Archive — Web Almanac 2025: Fonts](https://almanac.httparchive.org/en/2025/fonts) — usage ranking, self-host %, WOFF2 %, VF adoption, font-display.
- [Google Fonts Knowledge — Understanding measure / line length](https://fonts.google.com/knowledge/using_type/understanding_measure_line_length).
- [Baymard — Readability: the optimal line length](https://baymard.com/blog/line-length-readability); [UXPin — Optimal line length](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/).
- [Elements of Typographic Style Applied to the Web §2.1.2 — measure](http://webtypography.net/2.1.2).
- [type.today — Web design: the vertical metrics puzzle](https://type.today/en/journal/verticalmetrics); [SIL FDBP — Line Metrics](https://silnrsi.github.io/FDBP/en-US/Line_Metrics.html) — hhea/typo/win, USE_TYPO_METRICS.

Reference / secondary:
- [Smashing — Making Sense of Type Classification](https://www.smashingmagazine.com/2013/06/making-sense-of-type-classification-part-2/); [Toptal — Typeface Classification](https://www.toptal.com/designers/typography/typeface-classification).
- [Pangram Pangram — How to Pair Fonts](https://pangrampangram.com/blogs/journal/how-to-pair-fonts) — two-families rule, contrast, mood, superfamilies.
- [Creative Market — What is a Typographic Scale](https://creativemarket.com/blog/typographic-scale) — ratio names.
- [CSS-Tricks — Adjusting variable font weights in dark mode](https://css-tricks.com/using-css-custom-properties-to-adjust-variable-font-weights-in-dark-mode/) — 0.85 multiplier, `.02ch` tracking.
- [Mark Boulton — Optical sizing for dark mode](https://markboulton.co.uk/journal/optical-sizing-for-dark-mode/) — reduce opsz on dark (subjective).
- [Glyphhanger subsetting](https://florianbrinkmann.com/en/glyphhanger-4691/); [SymbolFYI — Unicode subsetting](https://symbolfyi.com/guides/web-fonts-unicode-subsetting/) — `pyftsubset` flags.

Licences (OFL-1.1 unless noted; verified-this-session flagged):
- [Inter — OFL-1.1, © Rasmus Andersson (RSMS)](https://github.com/rsms/inter) — **verified**.
- [Fraunces — OFL-1.1, © Undercase Type](https://github.com/undercasetype/Fraunces) — **verified**; axes `opsz/wght/SOFT/WONK`.
- [Recursive — OFL-1.1, © Arrow Type / Stephen Nixon](https://github.com/arrowtype/recursive) — **verified**; axes `MONO/CASL/wght/slnt/CRSV`.
- Public Sans [uswds/public-sans], Source Sans/Serif/Code [adobe-fonts], IBM Plex [IBM/plex], Libre Franklin & Libre Baskerville [impallari], Newsreader / Lora / Literata / Hanken Grotesk / Playfair Display [Google Fonts], Atkinson Hyperlegible [googlefonts], Space Grotesk [floriankarsten] & Space Mono / Big Shoulders / Bitter / Archivo / JetBrains Mono / Fira Code / Noto — all **OFL-1.1, not individually re-fetched this session** (open bundled `OFL.txt` before shipping). URLs in §5.
