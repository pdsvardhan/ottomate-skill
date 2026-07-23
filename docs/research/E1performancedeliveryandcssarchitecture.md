# E1 — Performance, delivery & CSS architecture

*Design-intelligence reference. Track E1 of the registry research map. Written to be read by the design agent before it inlines a font, encodes an image, or writes a stylesheet, and by a human owner auditing the byte budget and the cascade. Tuned throughout to the tool's actual target: **one self-contained HTML file, strict CSP, offline sandbox — no network, no CDN, no eval.***

---

## 1. Scope line

This track owns **the byte cost and the cascade**: how big the single file is allowed to get and why; how FONTS are subset and embedded (woff2, unicode-range, variable-vs-static, the base64 tax); which IMAGE format to encode to and when a raster bloats the file past reason; the page-level asset/paint budget; and how to architect CSS at scale — cascade layers, custom properties, `@property`, container queries, logical properties, nesting — so **specificity stays flat** instead of collapsing into an `!important` war. It also owns *measuring* all of the above (Lighthouse, DevTools, Core Web Vitals) and the realistic thresholds to hold to.

## 2. Boundary (what this track does **not** cover)

MECE against the sibling tracks. E1 owns *page-level byte and paint budgets and CSS architecture*; each neighbour owns a named adjacent concern:

- **Whether an effect is worth its cost *aesthetically*** (does the glow/gradient/shadow earn its pixels, does it read as generic) → **F1 Aesthetic judgement**. E1 says what a technique *costs*; F1 says whether that cost buys anything.
- **Animation compositor detail** — `transform`/`opacity` vs layout/paint, `will-change`, layer count, the per-frame 16.7 ms/8.3 ms budget → **B1 Motion & animation systems**. E1 owns the *page-level* asset and paint budget (total weight, decode, LCP/CLS); B1 owns the *per-animation* frame budget. Where they touch (a big `filter`/`box-shadow` that repaints a large area), E1 counts it as paint cost; B1 governs whether it can animate.
- **Cross-engine support, graceful degradation, and the CSP-breakage list** (what a strict CSP actually blocks, per-feature fallbacks, engine gaps) → **E2 Compatibility & CSP**. E1 gives the CSP/offline verdict *inline per technique*; E2 is the consolidated matrix and the degradation policy.
- **Material construction** — how a shadow, gradient, glass, glow, or border is *built* → **A4 Shape, depth & material**. E1 budgets the paint cost of the material A4 defines.
- **Font *role* and subset-*for-mood* selection** — which typeface, which weights carry which meaning, pairing → **A2 Typography**. E1 owns the *byte mechanics* of whatever A2 chose: subsetting, format, embed.
- **The full single-file feasibility matrix across CSS/SVG/Canvas/WebGL/JS** → **H2 Feasibility**. E1 gives asset- and CSS-specific verdicts inline; H2 consolidates.

---

## 3. Executive rules (apply these before reading the body)

1. **"Embed vs link" is not a decision here — it is forced.** A strict-CSP offline sandbox blocks every external request, so *everything* inlines: CSS in `<style>`, JS in `<script>`, fonts and images as `data:` URIs or inline SVG. The classic web advice ("inline only critical CSS, lazy-load the rest, link big images") does not apply. Your only levers are **format, quality, subset size, and total weight** — optimise those, not request count.
2. **Hold a single-file weight budget.** Target **≤ ~1 MB** for a snappy variant, **≤ 2 MB** acceptable for a rich one; treat **> 2 MB** as a budget event. Anchor: Lighthouse's *total-byte-weight* audit **flags pages over 5,000 KiB** and **targets under 1,600 KiB**. ([Lighthouse: Avoid enormous network payloads](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight))
3. **base64 costs exactly +1/3.** Three binary bytes encode to four ASCII characters (4×6 bits = 24 = 3×8), so an embedded asset is **≈ 33% larger** in the file — 100 KB binary → ~133 KB text, plus a ~30-char `data:` prefix and (if you let it) newline overhead. It also **can't be streamed/parallelised** — but with **no network waterfall in a single file that downside is moot**. If the HTML is served over HTTP with gzip/Brotli the +33% shrinks to **~2.5–5%** on the wire; opened from `file://` or held in memory it is paid in full, and the decoded DOM string and image-decode cost are **always** paid. ([Lemire: base64 space overhead](https://lemire.me/blog/2019/01/30/what-is-the-space-overhead-of-base64-encoding/))
4. **Core Web Vitals field targets (75th percentile):** **LCP ≤ 2.5 s**, **INP ≤ 200 ms**, **CLS ≤ 0.1**. INP became the CWV responsiveness metric and **replaced FID on 12 March 2024**. ([web.dev/vitals](https://web.dev/articles/vitals), [web.dev/blog/inp-cwv-march-12](https://web.dev/blog/inp-cwv-march-12))
5. **Know the "poor" cliffs, not just "good":** **LCP > 4.0 s**, **INP > 500 ms**, **CLS > 0.25** are the failing thresholds; the band between is "needs improvement." ([web.dev/lcp](https://web.dev/articles/lcp), [web.dev/inp](https://web.dev/articles/inp), [web.dev/cls](https://web.dev/articles/cls))
6. **Subset every embedded font to exactly the glyphs used, output woff2.** Use `pyftsubset` (fonttools, MIT). A tight Latin subset is typically **10–30 KB** woff2. **WOFF2's Brotli compression is up to 30% smaller than WOFF** and far smaller than raw TTF — always `--flavor=woff2`. ([web.dev: reduce web font size](https://web.dev/articles/reduce-webfont-size))
7. **Variable-vs-static break-even is 3 weights/widths.** At **≥ 3** axis positions a single variable woff2 beats the static set; at **≤ 2**, static instances are lighter. Verified example (Inter): **12 static files ≈ 321 KB vs 1 variable ≈ 95 KB (~70% saving)**, but **Regular+Bold only = ~53 KB static < 95 KB variable**. base64 inflates both by the same +33%, so it does **not** move the break-even. ([static vs variable, verify](https://font-converters.com/compare/static-vs-variable-fonts))
8. **`unicode-range` and `font-display` lose their usual purpose when inlined.** No network ⇒ no per-range lazy download and no FOIT/FOUT to manage. **Do not split a face into many `unicode-range` subsets "for savings"** — offline there are none, and you add parse blocks. Subset once, embed once. Keep `font-display: swap` (harmless) and use `unicode-range` only to *scope* a subset so it isn't applied to glyphs it lacks. ([MDN font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display))
9. **Prefer SVG and CSS over raster.** Inline **SVG** for icons/logos/UI (vector, no base64 tax, scales crisp) and **CSS** for gradients/shadows/shapes (zero image bytes). Rasterise **only photographs**. Standalone `<svg>` and CSS gradients are *not even LCP candidates*, so they can't hurt that metric. ([web.dev/lcp](https://web.dev/articles/lcp))
10. **For photographs, encode before you embed.** **AVIF ≈ 50% smaller than JPEG**; **WebP 25–35% smaller than JPEG** (and ~80% smaller than PNG). Encode with Squoosh (Apache-2.0, runs locally in WASM). Treat any single base64 raster **> ~150–200 KB encoded** as a budget event — there is no "link it instead" escape offline. ([web.dev: serve WebP](https://web.dev/articles/serve-images-webp), [AVIF vs WebP, verify](https://speedvitals.com/blog/webp-vs-avif/))
11. **Mind main-thread *decode*, not just size.** AVIF decodes **slower** than WebP/JPEG; many or large inlined rasters delay **LCP** and can cost **INP** even with zero network. When decode latency matters more than the last few percent of size, prefer **WebP**. ([AVIF vs WebP decode, verify](https://speedvitals.com/blog/webp-vs-avif/))
12. **Architect CSS with `@layer` in a fixed order:** `reset → base → tokens → layout → components → utilities`. A **later layer wins regardless of specificity**, so utilities beat components without `!important`. This is the mechanism that keeps specificity flat at scale. ([MDN @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer))
13. **Ban ID selectors and `!important` for styling; reach for `:where()` for resets.** `:where()` has specificity **(0,0,0)**; `:is()`/`:has()`/`:not()` take their **most specific argument**. IDs and `!important` are exactly what collapse a layered system — and `!important` *reverses* layer order (see §4.7), which is doubly confusing. ([MDN specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity))
14. **Theme with custom properties; type the animatable/guarded ones with `@property`.** Registering `syntax`/`inherits`/`initial-value` makes a variable **interpolable** (so gradients/angles/colors animate) and **guarded** (invalid values fall back to `initial-value` instead of breaking the cascade). Use **container queries** — not viewport media queries — for component responsiveness, and **logical properties** (`margin-inline`, `padding-block`, `inset`) for layout. ([MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), [MDN container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries))
15. **Measure, don't guess — and read lab tools as *relative*.** Lighthouse's performance score is **TBT 30% + LCP 25% + CLS 25% + FCP 10% + SI 10%**, "good" = **90–100**. Use DevTools **Coverage** for unused CSS/JS and **Performance** for layout/paint. But lab tooling models a *network* the offline sandbox doesn't have — treat the numbers as comparative between variants, not as absolute field CWV. ([Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring))

---

## 4. Body

### 4.1 What does "performance" mean for a CSP-offline single file?

The tool ships one HTML document with everything inlined, into a sandbox that makes **zero network requests**. That deletes most of the classic web-performance model and rewrites the rest:

| Classic web concern | Status in the single-file offline case |
|---|---|
| Request count / HTTP waterfall / connection setup | **Gone.** One document, no sub-resources to fetch, no waterfall to parallelise against. |
| TTFB / CDN / caching / preconnect / preload | **Gone / N/A.** Nothing is fetched; TTFB ≈ 0. |
| Render-blocking CSS, "inline critical CSS, defer the rest" | **Collapsed.** All CSS is inline and critical-path by construction. The lever is *total CSS size* and *selector-match / style-recalc cost*, not inline-vs-external. |
| base64 "can't be streamed / adds requests" | **Moot.** No streaming benefit to lose; the cost that remains is total weight + memory + decode (§4.2). |
| Font `unicode-range` lazy per-range download | **Moot.** No network ⇒ nothing lazy-loads; every embedded byte ships regardless (§4.3). |
| FOIT/FOUT, `font-display`, font preloading | **≈ Moot.** Inlined fonts are available at CSS-parse time; no fetch to swap around (§4.3). |
| Image `srcset`/lazy-loading/`loading="lazy"` | **Mostly moot.** Nothing is fetched; every embedded image is decoded when laid out. Off-screen decode still helps INP but there's no download to defer. |

**What still bites, and why:**
- **Parse cost.** The DOM string = the file size. A 5 MB base64 blob is a 5 MB string the parser must ingest and the engine must hold in memory.
- **Decode cost.** base64 → binary is cheap; **image decode is not**, and it runs on the main thread. Large/many inlined images delay first paint and LCP and can block interaction (INP).
- **Style/layout/paint.** Big paint areas (large blurred shadows, full-bleed gradients, backdrop-filter) still cost per-frame; thousands of custom-property lookups and container queries still cost style recalc.
- **Layout stability (CLS)** and **responsiveness (INP)** are DOM/CSS/JS properties, not network properties — they survive the offline reframe intact.

**Net:** the budget for this context is **total weight + memory + decode + paint**, governed by CWV's LCP/INP/CLS — *not* request count or network waterfall.

### 4.2 The base64 tax — exact cost, and does it matter here?

**The math (exact).** base64 maps every **3 bytes → 4 characters** (each char carries 6 bits; 4×6 = 24 = 3×8). Encoded length = `ceil(n/3) × 4`. That is a fixed **+33.3%** ("4/3 larger"), plus:

| Component | Cost | Avoid it by |
|---|---|---|
| Core 4/3 expansion | **+33.3%** | Unavoidable; it's the encoding |
| `=` padding on the final group | up to +2 chars (matters only for tiny assets) | Negligible above ~1 KB |
| `data:` URI prefix (e.g. `data:font/woff2;base64,`) | ~20–35 bytes flat | Negligible |
| MIME line breaks every 76 chars | **≈ +1.4%** | Encode with **`base64 -w0`** (no wrap) |

So **100 KB binary → ~133 KB text**; a **200 KB AVIF → ~267 KB** in the file.

**Does it matter for THIS context?** Two honest cases:

1. **HTML transferred over HTTP with gzip/Brotli** (e.g. the sandbox is served): compression **recovers most of the +33%** — Lemire measured base64-then-gzip files landing **within ~2.5–5%** of the original binary size, because gzip/Brotli model the 64-symbol alphabet well. The transfer penalty is then small. ([Lemire](https://lemire.me/blog/2019/01/30/what-is-the-space-overhead-of-base64-encoding/))
2. **Opened from `file://` or held as an in-memory string** with no transfer compression: the **+33% is real and fully paid**, on disk and in the DOM string the engine holds in RAM.

**What is *always* paid regardless of transfer:**
- the **in-memory DOM string** is the base64 length (inflated), not the binary length;
- **decode work** (base64→binary, then image/font decode) on the main thread.

**Decision rule.** base64 is *fine* for small/critical assets (icons already better as SVG; a subset font at 10–30 KB; a thumbnail at ≤ ~100 KB encoded). It becomes a problem when a **large** raster's inflated bytes push total weight and decode time up — and offline you can't escape by linking, so you must attack **format + quality + dimensions** instead (§4.4). Never hand-wave base64 as "free because it's one file"; the request-count win is real, the weight/decode cost is also real.

### 4.3 Fonts — subsetting and embedding for offline use

**Format: always woff2.** WOFF2 uses Brotli and is **up to 30% smaller than WOFF**, and dramatically smaller than raw TTF/OTF. In an offline single file there is **no reason to ship any other format** — legacy fallbacks (`.eot`, `.ttf`, `.woff`) only add bytes for engines that, in a modern sandbox, you don't target (E2 owns the support call). ([web.dev](https://web.dev/articles/reduce-webfont-size))

**Subsetting is the biggest single lever.** A "full" Latin text font is often 40–200 KB+ woff2 unsubset; subset to the glyphs a *specific variant* actually renders and it drops to **10–30 KB**. For CJK the difference is 100×+ (megabytes → tens of KB). Use **`pyftsubset`** (part of **fonttools, MIT**). ([web.dev](https://web.dev/articles/reduce-webfont-size))

**Variable vs static — the 3-position break-even.** A variable font carries one master plus interpolation data; a static set carries one file per instance.

| You render… | Lighter choice | Why |
|---|---|---|
| **1 weight** (e.g. 400) | **Static instance** | One small file; no VF overhead |
| **2 weights** (e.g. 400 + 700) | **Static instances** | Inter: ~53 KB static **<** 95 KB VF |
| **3+ weights/widths, or fluid weight** | **Variable font** (axis-clipped) | Inter: 12 static ≈ 321 KB **>** 95 KB VF (~70% saving) |
| **Animated/interpolated weight** | **Variable font** | Only a VF can hit in-between values |

base64 inflates *either* choice by the same +33%, so it does not shift the crossover. If you go variable, **clip the axis range** to what you use (`fonttools varLib.instancer Font.ttf wght=300:700`) *before* glyph-subsetting — shipping the full 100–900 range when you only use 300–700 is wasted bytes. ([verify](https://font-converters.com/compare/static-vs-variable-fonts))

**`unicode-range` and `font-display` — reframed for offline (honesty flag).** On the network, `unicode-range` lets the browser download only the subset a page's characters need, and `font-display` manages the swap while the font arrives. **Offline, neither buys what it usually does:** everything is embedded so nothing lazy-loads, and an inlined font is ready at CSS-parse time so there's no FOIT/FOUT window. Practical guidance: **subset once, embed one `@font-face` per family/axis**; keep `font-display: swap` (harmless, and correct if the doc is ever served online); use `unicode-range` only to *scope* a subset face so the engine doesn't try to use it for glyphs it doesn't contain (falling back cleanly instead of showing tofu).

#### Worked example 1 — font subset + base64 `@font-face` pipeline (with the weight tradeoff)

```bash
# 0. Install (both MIT / free / self-hostable). brotli enables woff2 output.
pip install fonttools brotli
npm install -g glyphhanger            # MIT; wraps pyftsubset, finds unicode-ranges

# 1. Discover exactly which glyphs the built variant uses.
#    glyphhanger can emit the unicode-range string to feed pyftsubset:
glyphhanger ./variant.html            # prints e.g. U+0020-007E,U+2018-2019,U+2026
#    ...or drive the whole subset itself:
glyphhanger ./variant.html --subset=Inter.ttf --formats=woff2

# 2a. STATIC path — subset ONE weight to a tight Latin set, output woff2.
pyftsubset Inter-Regular.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2018-201A,U+2022,U+2026" \
  --layout-features="kern,liga,calt" \
  --flavor=woff2 --desubroutinize \
  --output-file=inter-regular.subset.woff2

# 2b. VARIABLE path — FIRST clip the weight axis to the range you use,
#     THEN glyph-subset. (Instancing is a separate fonttools tool.)
fonttools varLib.instancer Inter-Variable.ttf wght=300:700 -o Inter-clip.ttf
pyftsubset Inter-clip.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF" \
  --layout-features="kern,liga,calt" \
  --flavor=woff2 --output-file=inter.subset.woff2

# 3. base64-encode with NO line wrapping (-w0), then paste into @font-face.
base64 -w0 inter-regular.subset.woff2 > inter-regular.b64
```

```css
/* STATIC instance embed (choose this at ≤ 2 weights) */
@font-face {
  font-family: "Inter";
  src: url("data:font/woff2;base64,d09GMgABAAAA…") format("woff2");
  font-weight: 400;                 /* one instance per @font-face */
  font-style: normal;
  font-display: swap;               /* harmless; irrelevant offline (no fetch) */
  unicode-range: U+0000-00FF, U+2018-201A, U+2022, U+2026; /* scope, not saving */
}

/* VARIABLE embed (choose this at ≥ 3 weights or fluid weight) */
@font-face {
  font-family: "Inter var";
  src: url("data:font/woff2;base64,d09GMgABAAAA…") format("woff2");
  font-weight: 300 700;             /* the CLIPPED axis range */
  font-style: normal;
  font-display: swap;
}
```

**The tradeoff, stated:** at ≤ 2 weights the static instances (~53 KB for Inter 400+700, → ~71 KB base64) beat the variable font (~95 KB, → ~127 KB base64). At ≥ 3 weights the single clipped VF (~95 KB) beats the static pile (~321 KB for 12 files). base64 inflates both proportionally, so **pick static or variable on the weight count, then eat the same +33% either way.** Always `--flavor=woff2`, always `-w0` on the encode.

### 4.4 Images — which format, and when embedding bloats the file

Offline, you **cannot link** an image — so the first question is never "embed or link," it is **"do I need a raster at all?"**

**Decision ladder (cheapest first):**

| Need | Use | Bytes | Notes |
|---|---|---|---|
| Icon, logo, UI glyph, simple illustration | **Inline `<svg>`** | tiny, no base64 tax | Vector, crisp at any DPI; stylable via CSS; not an LCP candidate |
| Flat fill, gradient, shadow, shape, texture | **CSS** (`linear-/radial-gradient`, `box-shadow`, `conic-gradient`) | ~0 image bytes | No decode; animatable |
| Photograph, complex raster | **Encoded raster → base64** | see below | Only case where base64 is justified |

**Format sizes (verified):**

| Format | vs JPEG | vs PNG | Decode / encode | Support (2025) |
|---|---|---|---|---|
| **AVIF** | **≈ 50% smaller** | much smaller | **Slower decode**, slow encode | ~93–94% |
| **WebP** | **25–35% smaller** | **~80% smaller** | **Faster decode**, faster encode | ~95% |
| **MozJPEG** (tuned JPEG) | baseline | — | fastest decode | ~100% |
| **PNG/OxiPNG** | larger (photos) | lossless | fast | ~100% |

Sources: [web.dev: serve WebP](https://web.dev/articles/serve-images-webp) (25–35% vs JPEG, ~80% vs PNG), [AVIF vs WebP, verify](https://speedvitals.com/blog/webp-vs-avif/) (AVIF ~50% vs JPEG; AVIF decodes slower).

**When AVIF, when WebP (offline nuance):** AVIF wins on *bytes* for photographs (~50% vs JPEG), which matters most in a weight-constrained single file. But AVIF **decodes slower on the main thread**, and offline the decode is the cost you can't hide behind a network wait — so for **large or numerous** inlined images where LCP/INP is tight, **WebP** (faster decode, still 25–35% under JPEG) can be the better *system* choice. For **logos/flat graphics**, WebP often beats AVIF on size too. Verify per-asset by encoding both and comparing (§ worked example 3).

**When inlining is fine vs when it bloats the file:**

| Situation | Verdict |
|---|---|
| Icon/logo/UI → SVG; shape → CSS | **Always inline** (tiny / zero bytes) |
| Small photo (avatar, thumbnail) ≤ ~100 KB encoded | **Inline base64 is fine** (~133 KB in file) |
| Medium hero ≤ ~150–200 KB encoded | **Acceptable**, but it's a real chunk of budget |
| Large/multiple full-bleed photos | **Budget event** — this is where a single file bloats past reason. Attack quality (AVIF q≈50 / WebP q≈75), dimensions (never embed larger than displayed × DPR), and count. No "link instead" escape offline. |

#### Worked example 3 — encode then embed (Squoosh CLI, local/offline)

```bash
# @squoosh/cli (Apache-2.0) runs every Squoosh codec locally via WebAssembly.
# It uploads NOTHING. Encode the SAME source to AVIF and WebP and compare bytes.
npx @squoosh/cli --avif '{"cqLevel":33}' hero.png    # AVIF, lower cqLevel = higher quality
npx @squoosh/cli --webp '{"quality":75}' hero.png    # WebP q75
npx @squoosh/cli --mozjpeg '{"quality":72}' hero.png # tuned JPEG baseline for comparison

# Downscale to display size first if the source is oversized:
npx @squoosh/cli --resize '{"width":1280}' --avif '{"cqLevel":33}' hero.png

# Then base64-embed the smallest ACCEPTABLE one (adds the +33% to THAT file):
base64 -w0 hero.avif                                  # paste into <img src> or CSS url()
```

```html
<!-- Give the raster explicit dimensions to prevent CLS (§4.9). -->
<img src="data:image/avif;base64,AAAAIGZ0eXBhdmlm…"
     width="1280" height="720" alt="…" decoding="async">
```

**Rule of thumb from the numbers:** a 1280×720 photo lands roughly ~40–90 KB as AVIF q≈50 (→ ~53–120 KB base64), ~70–130 KB as WebP q≈75. Pick the format on the **size-vs-decode** tradeoff above, set `width`/`height` to reserve space, and count it against the weight budget (§4.5).

### 4.5 The single-file total-weight budget (heuristic)

There is no primary-source "single-file budget" — the numbers below are **derived** (honesty flag), anchored to Lighthouse's `total-byte-weight` (target **< 1,600 KiB**, flag **> 5,000 KiB**) and to parse/decode reasoning for the offline case. Use them as tripwires, not laws.

| Payload class | Snappy | Acceptable | Investigate |
|---|---|---|---|
| **Total file** | ≤ 1 MB | ≤ 2 MB | > 2 MB (hard flag nearing 5,000 KiB) |
| Text (HTML+CSS+JS, minified) | ≤ 100 KB | ≤ 250 KB | > 250 KB |
| CSS alone (minified) | ≤ 50 KB | ≤ 100 KB | > 100 KB |
| Per embedded font (woff2 subset) | ≤ 30 KB | ≤ 60 KB | > 60 KB, or > 2 families |
| Single base64 raster (encoded) | ≤ 100 KB | ≤ 200 KB | > 200 KB |
| Total embedded raster | ≤ 300 KB | ≤ 800 KB | > 800 KB |

**Reasoning:** minified text at ≤ 100 KB parses in low-single-digit ms; the risk in a single file is almost always **fonts + rasters**, dominated by the +33% base64 tax and image decode. Keep the *sum* of embedded binary assets small and the total falls into place.

### 4.6 Core Web Vitals in the single-file case

The 2026 CWV set and thresholds (field data, **75th percentile**, mobile/desktop split). INP **replaced FID on 12 March 2024**. ([web.dev/vitals](https://web.dev/articles/vitals))

| Metric | Good | Needs improvement | Poor | Measures |
|---|---|---|---|---|
| **LCP** — Largest Contentful Paint | **≤ 2.5 s** | 2.5–4.0 s | **> 4.0 s** | Time to render the largest content element |
| **INP** — Interaction to Next Paint | **≤ 200 ms** | 200–500 ms | **> 500 ms** | Worst-case interaction responsiveness |
| **CLS** — Cumulative Layout Shift | **≤ 0.1** | 0.1–0.25 | **> 0.25** | Unexpected layout movement |

Sources: [web.dev/lcp](https://web.dev/articles/lcp), [web.dev/inp](https://web.dev/articles/inp), [web.dev/cls](https://web.dev/articles/cls).

**How each behaves offline, and where to act:**

- **LCP** decomposes into **TTFB → resource load delay → resource load duration → element render delay**. Offline, **TTFB ≈ 0** and there's no network load — so LCP ≈ **parse the (possibly huge) HTML string + decode the LCP image + style/layout/paint**. The LCP element is usually an inlined `<img>`, a `url()` background, or a text block. **Levers:** keep the LCP image's *encoded* bytes small and decodable (§4.4), don't bury it after a megabyte of base64, prefer text/SVG/CSS for the hero (standalone `<svg>` and CSS gradients aren't even LCP candidates). ([web.dev/lcp](https://web.dev/articles/lcp))
- **INP** decomposes into **input delay → processing duration → presentation delay**. Offline this is pure main-thread work: heavy JS handlers, giant synchronous style recalc (thousands of custom-property reads, many container queries re-evaluating), or forced reflow. **Levers:** keep handlers light, avoid layout thrash, don't over-nest container-query contexts. ([web.dev/inp](https://web.dev/articles/inp))
- **CLS** = `impact fraction × distance fraction`, summed within a **session window** (max **5 s**, gap **< 1 s**), reported as the **largest burst**. Fully offline-relevant. **Levers:** set `width`/`height` (or `aspect-ratio`) on every raster/SVG, reserve space for anything injected, and — because inlined fonts don't FOUT — font swap is a *non*-issue here. ([web.dev/cls](https://web.dev/articles/cls))

### 4.7 CSS architecture at scale — keeping specificity flat

Specificity collapse is the failure where, to make one rule win, someone adds a selector, then an ID, then `!important`, and the stylesheet becomes an arms race no one can reason about. **Cascade layers** are the structural fix.

**How the cascade sorts (simplified, high → low):** origin/importance → **layer** → specificity → source order. The key consequence: **for two rules in *different* layers, the layer decides — specificity never enters into it.** Within *one* layer, specificity and order apply normally.

**Normal declarations:** unlayered beats layered; among layers, the **last-declared layer wins**.
**`!important` declarations — the order *reverses* (honesty/precision flag):** among layers the **first-declared layer wins**, and **unlayered `!important` is the *weakest* author-important** (it loses to `!important` in any layer). This inversion is *by design* (it lets a low-priority reset layer protect a value), but it is exactly why `!important` in a layered system is so confusing — a second reason to avoid it entirely. ([MDN @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer))

**Recommended layer order:** `reset → base → tokens → layout → components → utilities`. Declare it **once, up front**, so precedence is explicit and immune to source-order accidents.

**Specificity primitives to keep flat:**

| Selector | Specificity | Use for |
|---|---|---|
| `:where(…)` | **(0,0,0)** always | Resets/defaults that must never fight real styles |
| `:is(…)` / `:has(…)` / `:not(…)` | **most specific argument** | Grouping — but beware it inherits the *highest* arg |
| Native nesting `&` | takes the **parent selector list's highest** specificity (like `:is()`) | Locality — avoid grouping a high-specificity selector into a nested parent list |
| `#id` | (1,0,0) — huge | **Never** for styling (fine as a JS/anchor hook) |
| `!important` | escalates + inverts layers | **Never** for styling |

#### Worked example 2 — `@layer` architecture that keeps specificity flat

```css
/* 1. Declare the cascade order ONCE. Later layer = wins, regardless of specificity. */
@layer reset, base, tokens, layout, components, utilities;

/* 2. reset — zero-specificity so it can never fight real styles later */
@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  :where(h1,h2,h3,p,figure,blockquote,ul,ol) { margin: 0; }   /* (0,0,0) */
}

/* 3. tokens — custom properties, incl. a TYPED one that is guarded + animatable */
@layer tokens {
  @property --brand-h { syntax: "<number>"; inherits: true; initial-value: 255; }
  :root {
    --space-1:.25rem; --space-2:.5rem; --space-4:1rem;
    --radius:.5rem; --surface:#fff;
    --brand: hsl(var(--brand-h) 83% 53%);   /* animate --brand-h → hue animates */
  }
}

/* 4. components — ordinary specificity; the LAYER guarantees utilities can win later */
@layer components {
  .card {
    padding-block: var(--space-4);           /* logical properties */
    padding-inline: var(--space-4);
    border-radius: var(--radius);
    background: var(--surface);
    container-type: inline-size;              /* enable container queries on the card */
  }
  .card__title { font-size: 1rem; }
  @container (inline-size > 30rem) {          /* responds to the CARD, not the viewport */
    .card__title { font-size: 1.25rem; }
  }
}

/* 5. utilities — LAST layer, so a single-class utility beats a multi-class component
      rule WITHOUT !important and WITHOUT an ID. Specificity stays flat. */
@layer utilities {
  .u-mt-0     { margin-block-start: 0; }
  .u-center   { text-align: center; }
}
```

**Why it stays flat:** `.u-mt-0` (specificity (0,1,0)) overrides `.card__title` (also (0,1,0)) purely because `utilities` is declared **after** `components` — no ID, no `!important`, no escalation. Add a new component tomorrow and the utility still wins, because the *layer* decides, not the selector weight. That is the whole point.

### 4.8 The modern CSS toolbox (what each buys, and its offline/CSP status)

All of the following are **native CSS**: zero bytes of library, **CSP-safe** (no script, no eval), and fully functional offline. E2 owns the exact engine-support call; the baselines below are for orientation.

| Feature | What it buys | Offline/CSP | Baseline (verify at build) |
|---|---|---|---|
| **Cascade layers `@layer`** | Flat specificity, explicit precedence | Native, CSP-safe | Widely available since 2022 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)) |
| **Custom properties `--x`** | Theming, one source of truth, runtime theming | Native, CSP-safe | Long-stable |
| **`@property`** (typed vars) | Interpolable vars (animate gradients/angles/colors) + **guarded** (invalid → `initial-value`) | Native, CSP-safe | **Baseline 2024** (~Jul 2024) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)) |
| **Container queries `@container`** | Component responds to its *container*, not the viewport → truly reusable | Native, CSP-safe | Baseline 2023 (Chrome 105 / FF 110 / Safari 16) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)) |
| **Container query units** `cqi cqb cqw cqh cqmin cqmax` | Size type/space to the container | Native, CSP-safe | With container queries |
| **Logical properties** `margin-inline`, `padding-block`, `inset`, … | Writing-mode-independent layout; halves LTR/RTL duplication | Native, CSP-safe | Widely available |
| **Native nesting `&`** | Locality, smaller source, fewer repeated selectors | Native, CSP-safe | Baseline 2023–24 (verify) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting)) |

**`@property` — why typing enables animation and guards values.** An unregistered `--x` is an opaque string the engine can't interpolate, so it snaps between keyframes. Registering it with a `syntax` (`<color>`, `<angle>`, `<length>`, `<percentage>`, …) tells the engine the type, so it can compute intermediate values — the classic use is animating a gradient stop or a conic angle. The same registration **guards** the value: anything not matching `syntax` is rejected and the property falls back to `initial-value` instead of poisoning the cascade. `inherits` and `initial-value` are required (the latter optional only for `syntax:"*"`). ([MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property))

**Container queries vs media queries.** A media query asks about the *viewport*; a container query (`container-type: inline-size` on the parent, then `@container (inline-size > 30rem)`) asks about the *component's own box* — so the same card lays out correctly in a sidebar, a grid, or full-bleed without knowing where it lives. In a design tool that emits reusable component variants, this is the correct default. ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries))

**Nesting — the specificity gotcha.** Native nesting combines specificity normally, but the `&` selector adopts the **highest specificity in the parent selector *list*** (it behaves like `:is()`). Nesting under a single class (`.card`) is fine; nesting under a list that includes an ID or a heavy compound quietly inflates every nested rule. Keep nested parents low-specificity. ([MDN nesting & specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting))

### 4.9 Critical path & paint cost in a single file

**All CSS is critical.** There is no "defer non-critical CSS" — it's all inline and parsed before first render. The levers become: **total CSS size** (Coverage-audit and drop unused rules), **selector-match cost** (avoid pathological universal/descendant selectors on huge DOMs), and **style-recalc cost** (thousands of custom-property reads and deeply nested container-query contexts re-run on change).

**Paint cost (page-level; B1 owns the per-frame animation budget).** Large paint areas are expensive *per paint*, animated or not: full-bleed `filter: blur()`/`backdrop-filter`, huge `box-shadow` spread, large `radial-/conic-gradient`, and big `border-radius` + shadow combos. Budget them like bytes — a hero with a full-viewport backdrop-filter behind live content repaints a large layer. If it must animate, that's B1's frame-budget problem; if it's static but enormous, it still lengthens first paint.

**CLS causes and fixes (offline-relevant):**

| Cause | Fix |
|---|---|
| `<img>`/SVG without dimensions | Set `width`/`height` or `aspect-ratio` to reserve space |
| Content injected after first paint (JS) | Reserve space up front; avoid inserting above existing content |
| Late web-font swap | **Non-issue offline** — inlined fonts don't FOUT |
| Dynamically sized components (accordions expanding on load) | Give initial min-height; animate from a reserved box |

### 4.10 Measuring — tools and realistic thresholds

| Tool | What it gives | Offline caveat |
|---|---|---|
| **Lighthouse** | Lab perf score, opportunities/diagnostics, `total-byte-weight` | Models a throttled *network* the sandbox lacks — read as **relative between variants**, not absolute field CWV |
| **DevTools → Coverage** | Unused CSS/JS bytes per file | Directly actionable: delete unused rules to cut weight |
| **DevTools → Performance** | Frame timeline, Layout/Paint/Recalc, long tasks | The real tool for INP/paint debugging offline |
| **DevTools → Rendering** | Paint-flashing, layer borders | Spot oversized repaint areas |
| **CrUX / field RUM** | Real 75th-percentile CWV | The only *ground truth* for CWV; lab tools estimate |
| **WebPageTest** | Filmstrip, waterfall, repeat-view | Waterfall mostly N/A offline; filmstrip still useful for paint timing |

**Lighthouse 10 performance score = weighted sum:** **TBT 30% + LCP 25% + CLS 25% + FCP 10% + Speed Index 10%**. Buckets: **90–100 green (good)**, 50–89 orange, 0–49 red. Note TBT (a lab proxy for INP) carries the most weight, so main-thread work dominates the score. ([Lighthouse scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring), [Lighthouse 10](https://developer.chrome.com/blog/lighthouse-10-0/))

**Honesty flag:** Lighthouse throttles a simulated Slow 4G and computes LCP/TBT against it. A single offline file has *no* network, so Lighthouse will typically report near-perfect load metrics — which flatters the file and hides nothing about **decode/paint/INP**, the things that actually bite offline. Trust the **Performance panel** and **Coverage** over the headline score for this context.

---

## 5. Options catalogue

"CSP-safe/offline" below means the tool runs at **build time** on the developer's machine (all three categories do) and its *output* survives a strict, no-eval, no-network CSP when inlined. Licences verified from source.

### 5a. Font subsetting & manipulation

| Tool | What it is | When to use | When NOT | Licence | Where | CSP/offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **`pyftsubset` / fonttools** | Python font toolkit; subsets glyphs, drops tables, outputs woff2 | The default subsetter for any embedded font | — (it's the baseline) | **MIT** ([fonttools](https://github.com/fonttools/fonttools)) | `pip install fonttools brotli` | Build-time; output is inert woff2 → fully CSP-safe | woff2 output **needs `brotli`** installed; over-dropping `--layout-features` can kill ligatures/kerning |
| **`fonttools varLib.instancer`** | Clips/pins variable-font axes | Before subsetting a VF you only partly use (e.g. `wght=300:700`) | Static fonts (nothing to instance) | **MIT** (fonttools) | fonttools | Build-time, CSP-safe | Pinning to one value = static instance; clipping a range keeps it variable |
| **glyphhanger** | Utility belt: auto-detects used glyphs/unicode-ranges from HTML, wraps `pyftsubset` | Deriving the exact subset/`unicode-range` from a built variant | When you already know the codepoints | **MIT** ([glyphhanger](https://github.com/zachleat/glyphhanger)) | `npm i -g glyphhanger` | Build-time, CSP-safe | Needs Python+fonttools present; headless-browser detection can miss dynamically injected text |
| **`base64` / OS coreutils** | Encodes woff2 → data URI | The embed step | — | Public domain / GPL (GNU) | Preinstalled | Output is a `data:` string → CSP-safe | **Use `-w0`** (no line wrap) or you add ~1.4% |

### 5b. Image encoding

| Tool | What it is | When to use | When NOT | Licence | Where | CSP/offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Squoosh (`@squoosh/cli`)** | Local WASM encoder: MozJPEG, WebP, AVIF, OxiPNG, JXL, WP2 | Encoding photos to AVIF/WebP before embedding; comparing formats | Vector art (use SVG) | **Apache-2.0** ([Squoosh](https://github.com/GoogleChromeLabs/squoosh)) | `npx @squoosh/cli` | Runs locally, uploads nothing; output inert → CSP-safe | CLI is **older/less-maintained** (honesty flag) — see jSquash; AVIF encode is slow |
| **jSquash** | Maintained fork of Squoosh's WASM codecs (browser+node) | When you want current, maintained Squoosh codecs in a script | Simple one-off (use the CLI) | **MIT/Apache** ([jSquash](https://github.com/jamsinclair/jSquash)) | npm | Build- or run-time WASM; CSP note: WASM needs `wasm-unsafe-eval` only if run *inside* the sandbox — as a build tool it's fine | Verify per-codec licence |
| **`cwebp` (libwebp)** | Google's WebP encoder | Fast, scriptable WebP encoding | AVIF (use libavif/Squoosh) | **BSD-3** (libwebp) | Google | Build-time, CSP-safe | Quality/effort flags matter; `-q 75` sane default |
| **`avifenc` (libavif)** | Reference AVIF encoder | Smallest photographic bytes | When decode latency matters (prefer WebP) | **BSD-2** (libavif) | AOMedia | Build-time, CSP-safe | Slow encode; `--min/--max` or `-q` control quality; AVIF **decodes slower** |
| **SVGO** | SVG optimiser | Shrinking inline SVG icons/logos | Raster | **MIT** | npm | Build-time, CSP-safe | Aggressive plugins can break rendering; test output |

### 5c. CSS tooling

| Tool | What it is | When to use | When NOT | Licence | Where | CSP/offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Lightning CSS** | Rust CSS parser/transformer/minifier/prefixer; targets browsers | Minify + transpile modern CSS + prefix in one fast pass | When you need PostCSS's plugin ecosystem | **MPL-2.0** ([Lightning CSS](https://github.com/parcel-bundler/lightningcss)) | `npm i lightningcss` / CLI | Build-time; output is plain CSS → CSP-safe | MPL is file-level copyleft (fine to *use*); check target list matches E2's support call |
| **PostCSS + Autoprefixer / preset-env** | JS CSS transform pipeline | Plugin-based transforms, nesting/`@property` polyfilling for older targets | When Lightning CSS already covers it (faster) | **MIT** | npm | Build-time, CSP-safe | Plugin sprawl; keep the chain minimal |
| **cssnano** | CSS minifier (PostCSS) | Squeezing final CSS bytes | If Lightning CSS is already minifying | **MIT** | npm | Build-time, CSP-safe | Aggressive presets can change behaviour; test |
| **PurgeCSS** | Removes unused CSS by scanning markup | Trimming a utility framework to used classes only | Dynamic class names it can't see | **MIT** | npm | Build-time, CSP-safe | Safelist dynamic classes or they're purged |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **File bloated by base64 rasters** | Total > 2 MB; DevTools shows huge `data:` strings; slow parse | Re-encode AVIF/WebP at lower quality, downscale to display size, or replace with SVG/CSS; count against §4.5 budget |
| **Full-size image embedded** | An image embedded far larger than displayed × DPR | Resize before encoding (`--resize`); never embed above display resolution |
| **Unsubset font shipped** | A 100 KB+ woff2 for a few dozen glyphs | `pyftsubset --unicodes=…`; a Latin subset should be 10–30 KB |
| **Variable font used for 1–2 weights** | 95 KB VF where 2 static instances = ~53 KB | Ship static instances below 3 weights (§4.3) |
| **VF axis not clipped** | Full 100–900 range shipped when only 300–700 used | `varLib.instancer wght=300:700` before subsetting |
| **base64 with line wrapping** | ~1.4% extra + broken data URIs on some parsers | Encode with `base64 -w0` |
| **AVIF hurting LCP/INP offline** | Slow first paint / janky interaction despite zero network; Performance panel shows long decode | Switch large images to WebP (faster decode) or reduce count/size |
| **CLS from undimensioned media** | Content jumps as images/SVG lay out; CLS > 0.1 | Set `width`/`height` or `aspect-ratio` on every raster/SVG |
| **Specificity war / `!important` creep** | New rules need `!important` or IDs to win | Adopt `@layer` order (§4.7); move overrides to a later layer; delete `!important` |
| **`!important` behaving "backwards"** | An `!important` in a "high" layer loses to one in a "low" layer | Expected — `!important` **reverses** layer order; stop using it (§4.7) |
| **Nesting inflated specificity** | Nested rules unexpectedly beat later ones | Nested `&` takes the parent list's *highest* specificity; keep nested parents low-specificity / avoid IDs in the list |
| **Unregistered var won't animate** | A `--x` in a gradient snaps between keyframes | Register with `@property` (`syntax`/`inherits`/`initial-value`) so it interpolates (§4.8) |
| **Invalid var poisons cascade** | One bad custom-property value breaks a component | Type it with `@property` so invalid values fall back to `initial-value` |
| **Media query where container query belongs** | Component breaks when placed in a narrow container despite a wide viewport | `container-type` on the parent + `@container` (§4.8) |
| **Unused CSS shipped** | Coverage tab shows large unused % | PurgeCSS / delete dead rules; re-check Coverage |
| **Trusting Lighthouse load score offline** | Near-perfect LCP in Lighthouse but sluggish in the sandbox | Lighthouse models a network the sandbox lacks; debug with Performance/Coverage, not the headline score |

---

## 7. Pre-flight checklist (run before shipping any variant)

- [ ] **Nothing links out.** All CSS/JS/fonts/images are inlined (`<style>`, `<script>`, `data:` URIs, inline SVG) — no external URL survives the CSP (§3.1).
- [ ] **Total file within budget:** ≤ 1 MB snappy / ≤ 2 MB acceptable; nothing near Lighthouse's 5,000 KiB flag (§4.5).
- [ ] **Every raster earns its base64:** icon/logo/UI is **SVG**, shape/gradient is **CSS**; only photographs are rasterised (§4.4).
- [ ] **Photos encoded** to AVIF (~50% < JPEG) or WebP (25–35% < JPEG, faster decode), sized to display × DPR, `width`/`height` set (§4.4, §4.9).
- [ ] **Fonts subset** with `pyftsubset` to the glyphs used, **`--flavor=woff2`**, `base64 -w0` (§4.3).
- [ ] **VF-vs-static chosen on the 3-weight rule;** VF axis clipped to the range used (§4.3).
- [ ] **No `unicode-range` splitting "for savings";** one `@font-face` per family/axis (§4.3).
- [ ] **CWV sanity:** LCP element small & early (≤ 2.5 s intent), no undimensioned media (CLS ≤ 0.1), interaction handlers light (INP ≤ 200 ms) (§4.6).
- [ ] **`@layer` order declared once** (`reset→base→tokens→layout→components→utilities`); overrides live in later layers (§4.7).
- [ ] **No ID selectors, no `!important`** for styling; resets use `:where()` (0,0,0) (§4.7).
- [ ] **Typed custom properties** (`@property`) for any animatable/guarded token; **container queries** for component responsiveness; **logical properties** for layout (§4.8).
- [ ] **Nested parents are low-specificity** (no ID/heavy compound in a nested parent list) (§4.8).
- [ ] **Unused CSS removed** (DevTools Coverage) (§4.9, §4.10).
- [ ] **Measured with Performance/Coverage**, not just the Lighthouse load score (offline flatters it) (§4.10).
- [ ] Every tool used is **free + self-hostable**, licence noted (fonttools/glyphhanger **MIT**, Squoosh **Apache-2.0**, Lightning CSS **MPL-2.0**) (§5).

---

## 8. Open questions / unverified

- **Single-file weight budget (§4.5) is derived, not a primary standard.** It's anchored to Lighthouse `total-byte-weight` (<1,600 KiB target / >5,000 KiB flag) and parse/decode reasoning; treat the sub-budgets as tripwires, tune per project.
- **base64-then-compression recovery (~2.5–5%)** is from one authoritative secondary source (Lemire) and depends on *whether the sandbox transfers the HTML with gzip/Brotli at all*. If the file is opened from disk/memory, assume the **full +33%**. Verify how your sandbox serves the file.
- **AVIF vs WebP exact percentages** (AVIF ~50% vs JPEG; WebP 25–35%) and **decode-speed** ordering come from web.dev (WebP) plus a secondary comparison (AVIF, decode). Numbers are image-dependent — **encode both and measure** per asset. Browser-support figures (~93–95%) are E2's call, not a byte fact.
- **Variable-vs-static Inter numbers** (321 KB / 95 KB / 53 KB) are from a secondary source; the **3-weight break-even** is the robust takeaway — re-measure for the specific family.
- **Baseline dates** for `@property` (~Jul 2024), container queries (2023), nesting (2023–24) are orientation only; the exact support matrix and CSP-breakage list are **E2's** to own — re-check caniuse at build time.
- **Native nesting `&` specificity** (behaves like `:is()`, taking the parent list's highest) reflects the current spec; older engines shipped an earlier interpretation — verify if targeting old versions (E2).
- **`@squoosh/cli` maintenance:** functional and self-hostable, but the repo has seen reduced upkeep; **jSquash** is the maintained codec fork. Confirm current status before standardising on it.
- **Lighthouse offline caveat:** the load-metric portion of the score is unreliable for a no-network file; there is no primary doc on "Lighthouse for offline single files" — this is reasoned guidance.

---

## 9. Sources

Primary / authoritative:
- [web.dev — Web Vitals (thresholds, 75th pct)](https://web.dev/articles/vitals)
- [web.dev — LCP](https://web.dev/articles/lcp) · [web.dev — INP](https://web.dev/articles/inp) · [web.dev — CLS](https://web.dev/articles/cls)
- [web.dev — INP becomes a Core Web Vital on March 12 (2024)](https://web.dev/blog/inp-cwv-march-12)
- [web.dev — Reduce web font size (WOFF2 ~30% < WOFF; subsetting; unicode-range; VF)](https://web.dev/articles/reduce-webfont-size)
- [web.dev — Serve images in modern formats / WebP (25–35% < JPEG, ~80% < PNG)](https://web.dev/articles/serve-images-webp)
- [MDN — @layer (cascade layers, order, !important reversal)](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [MDN — @property (typed custom properties, animation, guarding)](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [MDN — Container queries (container-type, @container, cq units)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- [MDN — CSS nesting (& selector, specificity)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting)
- [MDN — Specificity (:where/:is)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)
- [MDN — font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [Lighthouse — Performance scoring (TBT 30 / LCP 25 / CLS 25 / FCP 10 / SI 10; 90–100 good)](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [Lighthouse — Avoid enormous network payloads (>5,000 KiB flag, <1,600 KiB target)](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight)
- [Chrome for Developers — What's new in Lighthouse 10 (CLS→25%)](https://developer.chrome.com/blog/lighthouse-10-0/)

Reference / secondary (flagged where used):
- [Daniel Lemire — What is the space overhead of base64 encoding? (4/3 = +33%, gzip recovery)](https://lemire.me/blog/2019/01/30/what-is-the-space-overhead-of-base64-encoding/)
- [SpeedVitals — WebP vs AVIF (AVIF ~50% < JPEG; decode speed)](https://speedvitals.com/blog/webp-vs-avif/)
- [font-converters — Static vs variable fonts (3-weight break-even; Inter numbers)](https://font-converters.com/compare/static-vs-variable-fonts)
- [Bram.us — Compress images on the CLI with squoosh-cli](https://www.bram.us/2020/12/09/compress-avif-webp-png-etc-images-on-the-cli-with-squoosh-cli/)

Licences (verified from source):
- [fonttools — MIT](https://github.com/fonttools/fonttools) (includes `pyftsubset`, `varLib.instancer`)
- [glyphhanger — MIT](https://github.com/zachleat/glyphhanger) (wraps `pyftsubset`)
- [Squoosh — Apache-2.0](https://github.com/GoogleChromeLabs/squoosh); [jSquash — MIT/Apache](https://github.com/jamsinclair/jSquash)
- [Lightning CSS — MPL-2.0](https://github.com/parcel-bundler/lightningcss) (Rust; CLI + npm)
