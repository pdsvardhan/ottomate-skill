# A3 — Space, layout & composition

*Design-intelligence reference. Track A3 of the registry research map. Written to be read by the design agent before it lays out any screen, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns **space as a system**: the base spacing unit and the full numeric scale built on it, when to break that scale (optical correction, hairlines), modular (token) vs fluid (`clamp()`/container-query) scaling, grid systems (12-column, bento, asymmetric, subgrid), density modes and when dense data needs its own independent scale, alignment and optical correction, responsive strategy with explicit **large-display-first** rules for 27"+ 4K desktop monitors, z-index/layering discipline as a token system, and whitespace used deliberately as a hierarchy signal.

## 2. Boundary (what this track does **not** cover)

- **How things MOVE through space** (duration, easing, choreography, FLIP, scroll-driven reveals) → **B1 Motion & animation systems**. A3 defines the static grid and spacing tokens; B1 animates transitions between A3's states.
- **WHAT goes inside the layout** — table/chart/data-grid internals: column types, sorting, virtualization, chart mark selection → **C3** (owns data-in-layout). A3 owns the *row-height/density scale* a table sits on; C3 owns what the table *does*.
- **Spacing/scale tokens SHARED across components** — the governance of how a spacing token is named, versioned, and consumed by button/card/modal components → **C2 Design tokens & sharing**. A3 *designs* the scale (§4.1); C2 governs how it's distributed and overridden.
- **Type scale** (font-size steps, line-height ratios as a typographic system) → **A2 Typography**. A3 only touches type where it intersects layout: measure/line-length (§4.7) and baseline-grid vertical rhythm (§4.4).
- **Contrast and minimum target size** (WCAG 1.4.3, 2.5.8 24×24px target size) → **A5 Accessibility**. A3 flags where density modes *approach* the target-size floor (§4.5) but the conformance number itself is A5's.
- **Color, elevation/shadow material, border/glass construction** → **A4 Shape, depth & material**. A3's z-index (§4.8) says *what stacking order*; A4 says what a layer *looks like* once it's there.

---

## 3. Executive rules (apply these before laying out anything)

1. **Base spacing unit is 8px, half-step 4px, hairline 2px/1px.** Never hand-write an arbitrary margin/padding/gap (13px, 22px, 7px) — every spacing value traces to a token. Rationale: 8 divides cleanly across common device pixel ratios (1×/2×/3×) and most viewport/component dimensions are divisible by 8 on at least one axis. ([spec.fm: 8-pt grid](https://spec.fm/specifics/8-pt-grid))
2. **Adopt the full scale, not just the base unit.** A working scale: **0 / 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px**. Real systems converge on this almost exactly up to 64px, then diverge in the tail — IBM Carbon continues 80/96/160px, GitLab's Pajamas continues 40–96px then 120–160px. Pick your own tail past 64px deliberately for macro whitespace (§4.9), don't just keep doubling blindly. ([Carbon spacing](https://v10.carbondesignsystem.com/guidelines/spacing/overview/), [GitLab Pajamas spacing](https://design.gitlab.com/product-foundations/spacing))
3. **Break the grid for exactly three reasons**, never a fourth: (a) **optical correction** — a circle/icon/hairline that measures "right" but looks wrong (§4.6); (b) **1px hairline dividers**, which sit outside any 2px+ scale by definition; (c) **forced alignment to an external fixed-size asset** (a third-party embed, a fixed-size ad unit). Every other off-scale nudge is scale debt — either promote it to a named token or don't ship it.
4. **Use modular (token) steps for anything that must be nameable and reused** — component padding, gaps, icon sizes, form control heights. **Use fluid values (`clamp()`) for anything that should breathe continuously with the viewport** — page-level gutters, hero type, section padding on a large display. Don't fluid-ize component-internal spacing (it should feel identical everywhere the component appears); do fluid-ize macro layout spacing. ([MDN `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp))
5. **Cap text measure at 45–75ch (65ch default) regardless of viewport width — including on a 3840px-wide panel.** WCAG's outer, AAA-level ceiling is 80 characters (40 for CJK). Never let a paragraph's `max-width` grow just because the monitor is bigger — route the extra width to a second pane, not a longer line. ([Baymard: Readability](https://baymard.com/blog/line-length-readability), [Butterick's Practical Typography: Line length](https://practicaltypography.com/line-length.html), [WCAG 2.0 Understanding 1.4.8](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-visual-presentation.html))
6. **On large displays, add structure, not width.** Extra horizontal space earned by a bigger monitor should become new panes/rails/columns — never a single wider column of text or a single stretched card. Google's own canonical "supporting pane" layout moves from one stacked pane (compact, <600dp) to a **50/50** split (medium, ≥600dp) to a **70/30** split (expanded, ≥840dp) — it is never one pane simply stretched. ([Android Developers: Canonical layouts](https://developer.android.com/develop/ui/views/layout/canonical-layouts))
7. **A "4K monitor" does not mean 3840 CSS px of layout width.** A 27" 4K panel is ≈163 PPI; the comfortable no-scaling band is ≈110–140 PPI, so OSes default a 27"/4K screen to ≈150% scaling — yielding a **logical (CSS) viewport around 2560×1440**, the same layout budget as a native 1440p screen. Design and test against realistic logical widths (1536–1920px is common; 2560–3840px only for 100–125%-scaled or 32"+/38"+ panels), not the panel's marketing resolution. ([DisplayNinja: Pixel density](https://www.displayninja.com/what-is-pixel-density/))
8. **Container queries for component-level adaptation; viewport media queries for page-shell decisions.** A card should adapt to the space *it* gets (sidebar vs. 3-column grid), not to the viewport. `container-type: inline-size` + `@container (width > Nrem)`; prefer `rem` thresholds over `px` so the query still respects a user's browser zoom/base-font setting. Support is solidly Baseline: Chrome/Edge 105–106+, Firefox 110+, Safari 16+, **~93% global**. ([MDN: Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries), [caniuse](https://caniuse.com/css-container-queries), [Josh Comeau: Container queries intro](https://www.joshwcomeau.com/css/container-queries-introduction/))
9. **`container-type` also creates a new stacking context.** The same declaration that makes an element size-queryable also traps any `z-index` children inside it. If an overlay rendered inside a container-query card refuses to escape the card visually, this is why — either keep container-query wrappers free of positioned overlay children, or render the overlay via the native top layer instead (§4.8). ([MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context))
10. **Use subgrid to align nested items to a parent grid's tracks** — card headers/footers lining up across a row, bento-tile internals, label/input columns nested inside a page grid. `grid-template-columns: subgrid`. Baseline-solid since September 2023, **~90–93% global** (Chrome/Edge 117+, Firefox 71+ — Firefox shipped first — Safari 16+); gate the remainder with `@supports (grid-template-columns: subgrid)` and a manually-repeated-track fallback. ([MDN: Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid), [caniuse](https://caniuse.com/css-subgrid))
11. **Give data-dense surfaces their own density scale, decoupled from the 8pt layout grid**, once a table/grid needs to show more rows than 8px steps can express cleanly (rule of thumb: any grid meant to show >15–20 rows per screen, or any professional/power-user tool). Layout spacing jumps in 8px multiples (24→32 is a 33% jump); a dense-table scale should step in **4px** (24/28/32/36/40) so density has finer control than page layout needs. ([Carbon: Data table style](https://carbondesignsystem.com/components/data-table/style/))
12. **Reference density row-heights (verified):** comfortable 48–64px, standard 40px, compact 32px, extra-compact 24px — IBM Carbon's four confirmed table sizes. Treat any custom mode under ~32px row height as needing a target-size review; that number itself is A5's to police.
13. **Z-index is a tiered token ladder with gaps, never a raw incrementing integer.** Reserve a fixed, documented scale (dropdown/sticky/overlay/modal/popover/tooltip/toast, spaced ≥100 apart) so a new layer can be inserted without renumbering everything; never hand-write `z-index: 9999`. For anything that must **always** win — modal, popover menu, native tooltip — prefer the browser's **top layer** (`<dialog>`, `[popover]`) over z-index entirely: top-layer elements stack by insertion order **above the entire document regardless of any z-index value**, permanently ending the arms race for that layer. ([Bootstrap z-index](https://getbootstrap.com/docs/5.3/layout/z-index/), [Chrome for Developers: The top layer](https://developer.chrome.com/blog/what-is-the-top-layer))
14. **Whitespace is the first hierarchy tool, not the last.** Before reaching for a new font-size, weight, or color to separate two things, try more space (unrelated) or less space (related) between them. Start a layout with *more* whitespace than feels necessary and remove it — not the reverse. A section heading should carry visibly more space **above** it than below it (roughly 1.5–2×): that asymmetry alone signals "this heading belongs to what follows," at zero color/weight cost. ([Refactoring UI — layout & spacing notes](https://jacobshannon.com/blog/books/refactoring-ui/layout-and-spacing/))
15. **Optically correct, don't mathematically center, non-rectilinear shapes.** A circle/triangle/diamond sized to the exact bounding box of an adjacent square will read *smaller* — enlarge circular/pointed marks ~2–4% of nominal size to read as equal. For the chronic icon-vs-text vertical-centering offset (caused by font half-leading), the current CSS answer is `text-box-trim: trim-both` (Chrome/Edge 133+, Safari 18.2+, **~79% global**, no Firefox yet) — fall back to a manually-tuned `translateY()` nudge (1–2px) per typeface where unsupported. ([D'Amato: Logical Optical](https://blog.damato.design/posts/logical-optical/), [Chrome for Developers: `text-box-trim`](https://developer.chrome.com/blog/css-text-box-trim), [caniuse](https://caniuse.com/css-text-box-trim))

---

## 4. Body

### 4.1 Spacing — what's the base unit, and when do you break it?

The 8-point grid's rationale is arithmetic, not aesthetic: interfaces render at integer device-pixel multiples (1×, 2×, 3×), and **8 is the smallest unit that stays a clean integer across all common scale factors** while also dividing most viewport and component dimensions evenly on at least one axis. The half-step (4px) exists for tight internal spacing (icon-to-label gaps, chip padding) where a full 8px reads as too loose; a 2px/1px hairline exists purely for dividers/borders, outside the rhythm scale by design. ([spec.fm](https://spec.fm/specifics/8-pt-grid), [The Hangline: 8px grid](https://www.thehangline.com/8px-grid-spacing-system-explained-for-web-designers/))

**Real-world scales compared** (all px):

| System | Steps | Notes |
|---|---|---|
| **This report (recommended)** | 0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 | Matches the task's canonical example scale through 64, extends for large-display macro whitespace |
| **IBM Carbon** (`spacing-01`…`13`) | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 | Adds 40 and 80; jumps 96→160 (skips 128) | 
| **GitLab Pajamas** | 0, 1, 2, 4, 8, 12, 16, 24, 32, 40–96 (steps of 8), 120–160 | Formula `8 × 2ⁿ`, augmented with `n × 1.5` after 16px |
| **Refactoring UI / Tailwind default** | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 | Rule: *no two values in the scale should be closer than ~25% apart*, so a scale step is always a meaningfully different decision |
| **Open Props** (`--size-1`…`--size-15`) | 4, 8, 16, 20, 24, 28, 32, 48, 64, 80, 96, 120, 160, 240, 320, 480 | Also ships negative sizes (`--size-000`, `--size-00`) for negative margins/letter-spacing, and `--size-fluid-1…10` as pre-built `clamp()` fluid steps |

Sources: [Carbon spacing overview](https://v10.carbondesignsystem.com/guidelines/spacing/overview/), [GitLab Pajamas spacing](https://design.gitlab.com/product-foundations/spacing), [Refactoring UI notes](https://jacobshannon.com/blog/books/refactoring-ui/layout-and-spacing/), [Open Props](https://open-props.style/).

**Usage guidance (GitLab's mapping, a good default heuristic):** within-component spacing 2–4px · between closely related elements 8px · between unrelated elements 16px · between sub-sections 24px · between major sections 32px+. 12px is the one common exception — reserve it for horizontal padding inside tabs/buttons/form controls where 8px feels cramped and 16px feels loose.

**Worked example 1 — the spacing scale as CSS custom properties + usage.** Spacing tokens are theme-agnostic (unlike color) — this block is identical in light and dark mode, no duplication needed:

```css
:root {
  /* Core scale — 8pt base, 4px half-step, 2px/1px hairline */
  --space-0:   0px;
  --space-px:  1px;    /* hairline borders/dividers only — never a layout gap */
  --space-1:   2px;    /* micro: icon-to-label gap inside a dense control */
  --space-2:   4px;    /* tight: chip/tag internal padding */
  --space-3:   8px;    /* base unit: default gap between closely related items */
  --space-4:  12px;    /* form control internal padding (the one off-doubling step) */
  --space-5:  16px;    /* default component padding; gap between unrelated inline items */
  --space-6:  24px;    /* card padding; gap between sub-sections */
  --space-7:  32px;    /* gap between distinct components/blocks */
  --space-8:  48px;    /* gap between major page regions */
  --space-9:  64px;    /* page-level rhythm; large-display section gutters */
  --space-10: 96px;    /* hero / section breaks on large displays */
  --space-11: 128px;   /* rare: full-bleed macro whitespace, large-display only */
}

/* Usage */
.card {
  padding: var(--space-6);
  display: grid;
  gap: var(--space-3);              /* related fields inside the card: tight */
}
.card + .card { margin-block-start: var(--space-7); }   /* unrelated cards: looser */
.page-section + .page-section { margin-block-start: var(--space-9); } /* macro */
```

**Fluid variant of the same scale** (for the handful of tokens that should breathe with viewport instead of jumping) — see §4.2 for the formula this is built from:

```css
:root {
  --space-fluid-gutter: clamp(1rem, 0.21rem + 3.16vw, 4rem); /* 16px @400px → 64px @1920px */
}
```

### 4.2 Modular vs fluid scales — tokens or `clamp()`?

**Modular** means a fixed, finite set of named steps (the scale in §4.1, or a type ratio). It jumps between defined values and never has an "in-between" — good for anything that must be *nameable, predictable, and consistent* everywhere it's used: component padding, gaps, icon sizes.

**Fluid** means a value computed continuously from the viewport via `clamp(min, preferred, max)`, which CSS resolves as `max(MIN, min(VAL, MAX))` — a hard floor, a hard ceiling, and a smoothly interpolated value between them. `clamp()` has been Baseline-available since **July 2020**, ~94% global support via the CSS math-functions family. Use it for macro layout values that should feel continuous rather than jumpy: page gutters, hero type, section padding — anything where a viewport media-query "jump" would be visually jarring. ([MDN `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp), [caniuse: CSS math functions](https://caniuse.com/css-math-functions))

**The linear-interpolation formula** (the technique the free [Utopia fluid-scale calculator](https://utopia.fyi/space/calculator/) automates — a free web calculator, output is plain portable CSS with no runtime dependency or licence to track):

```
slope        = (maxSize − minSize) / (maxViewport − minViewport)
vwPart       = slope × 100                       // as a vw coefficient
interceptPx  = minSize − slope × minViewport      // constant offset in px
preferred    = "{interceptPx/16}rem + {vwPart}vw"
value        = clamp(minSize, preferred, maxSize)
```

Worked: min 16px at 400px viewport, max 64px at 1920px viewport →
`slope = (64−16)/(1920−400) = 0.0316`, `vwPart ≈ 3.16vw`, `interceptPx ≈ 3.37px ≈ 0.21rem` →
**`clamp(1rem, 0.21rem + 3.16vw, 4rem)`** (this is the `--space-fluid-gutter` token above). Utopia's own generated example for a smaller range: `clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)` scaling 18px→20px between 360–1240px — same formula, smaller amplitude. ([Utopia fluid space calculator](https://utopia.fyi/space/calculator/))

**Decision table:**

| Situation | Modular token | Fluid `clamp()` |
|---|---|---|
| Component internal padding/gap | ✅ always | ❌ (feels inconsistent per-instance) |
| Icon size, control height | ✅ always | ❌ |
| Page/section gutters | Acceptable (pick nearest step at each breakpoint) | ✅ preferred — no visible jump |
| Hero/display type size | Acceptable with 2–3 breakpoint steps | ✅ preferred |
| Body/UI type size (A2's territory, noted for boundary) | ✅ (small clamp range at most) | Use a **narrow** clamp only — big swings hurt reading rhythm |
| Grid column count | N/A — use container queries (§4.3) or `auto-fit`/`minmax()` (§4.4) | N/A |

Container query length units (`cqw`, `cqi`, etc., §4.3) extend the same fluid idea to a *container's* size instead of the viewport's — use them inside a component that must scale with the space its container grants it, independent of the page.

### 4.3 Container queries — responsive to what?

A container query answers "what does *this* element look like given the space its *parent* gives it," independent of viewport size — the mechanism that makes a card component correctly dense in a 3-column grid and correctly spacious alone in a sidebar, without two component variants.

**Syntax:**

```css
.card-slot { container-type: inline-size; container-name: card; }
/* shorthand: container: card / inline-size; */

@container card (width > 32rem) {
  .card__title { font-size: 1.25rem; }
  .card { grid-template-columns: auto 1fr; }
}
```

`container-type` values: `normal` (default — name/style queries only, no size query), `inline-size` (query the inline dimension only; **preferred default**), `size` (query both dimensions — see gotcha below). Container query length units: **`cqw`/`cqh`/`cqi`/`cqb`** (1% of the container's width/height/inline-size/block-size) and **`cqmin`/`cqmax`** (smaller/larger of `cqi`/`cqb`). ([MDN: Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries))

**Recommended breakpoint scale** (rem, not px — respects a user's browser zoom/base-font-size setting per [Josh Comeau's accessibility point](https://www.joshwcomeau.com/css/container-queries-introduction/)):

| Token | rem | px (16px root) | Typical use |
|---|---|---|---|
| `--cq-xs` | 20rem | 320px | Single-column card, icon-only nav |
| `--cq-sm` | 30rem | 480px | Stack → inline label pattern |
| `--cq-md` | 40rem | 640px | Two-up internal layout |
| `--cq-lg` | 48rem | 768px | Full card chrome (metadata row appears) |
| `--cq-xl` | 64rem | 1024px | Panel-internal multi-column |
| `--cq-2xl` | 80rem | 1280px | Dashboard-panel dense mode |

**Support:** Baseline-solid, **~93% global** — Chrome/Edge 106+ (partial 105), Firefox 110+, Safari 16+. Fallback for the remainder: design the un-queried state to be the *most* space-constrained one (mobile-safe default), so a non-supporting engine degrades to "always compact" rather than broken. ([caniuse](https://caniuse.com/css-container-queries))

**Three gotchas, all real:**
1. **`container-type: size` collapses intrinsic-height children.** It applies containment on both axes, so a child sized by its content can shrink to zero. Use `container-type: inline-size` unless you specifically need to query block-size. ([Josh Comeau](https://www.joshwcomeau.com/css/container-queries-introduction/))
2. **`container-type` creates a new stacking context** (§ exec rule 9, detailed in §4.8) — an easy-to-miss interaction between this section and layering.
3. **Container *style* queries** (`@container style(--variant: danger) { … }` — querying a custom-property value on the container rather than its size) reached **Baseline "Newly Available" on 19 May 2026**, following Firefox 151. This is *very* recent as of this report (written July 2026) — treat as emerging, keep JS/class-based fallbacks for another 1–2 years until it's "Widely Available" (Baseline's ~30-month bar). ([web.dev / droptimes coverage](https://www.thedroptimes.com/70900/css-container-style-queries-drupal))

### 4.4 Grid systems — which structure, and how do the columns divide?

**Why 12 (or 16).** Twelve is the smallest number divisible by 1, 2, 3, 4, and 6 — it splits cleanly into halves, thirds, quarters, and sixths simultaneously, which is why it's the default convention (Bootstrap, most editorial grids). IBM's Carbon 2x grid instead runs **16 columns** at desktop tiers (still divisible by 2/4/8) for finer control at large widths — a deliberate, evidenced alternative, not an error:

| Carbon breakpoint | Min width | Columns | Margin |
|---|---|---|---|
| Small | 320px | 4 | 0 |
| Medium | 672px | 8 | 16px |
| Large | 1056px | 16 | 16px |
| X-Large | 1312px | 16 | 16px |
| Max | 1584px | 16 | 24px |

Source: [Carbon 2x grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/). (Material Design's legacy M1 spec used 4 columns <480dp, 8–12 columns 600–840dp, 12 columns ≥1024dp, 16/24dp gutters, on an 8dp baseline unit with margin/gutter options of 8/16/24/40dp — [m1.material.io](https://m1.material.io/layout/responsive-ui.html); verify current M3 numbers directly, the M3 site is JS-rendered and could not be fetched for this report — see §8.)

**Baseline grid / vertical rhythm.** Set `line-height` to a multiple of the spacing base unit so text baselines land on the grid: 16px font-size at 1.5 line-height = 24px (3×8px) — every line, list item, and form row then shares a common vertical cadence even across mixed type sizes. ([freeCodeCamp: 8-point grid typography](https://www.freecodecamp.org/news/8-point-grid-typography-on-the-web-be5dc97db6bc/))

**Bento.** An irregular grid of variously-sized tiles inside one grid container, popularized by Apple/Google product pages and now common in dashboards. Technique: a 12-column base, `grid-auto-flow: dense` to fill gaps, per-tile spans:

```css
.bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr));
         grid-auto-flow: dense; gap: var(--space-5); }
.bento__hero     { grid-column: span 6; grid-row: span 4; }
.bento__stat     { grid-column: span 3; grid-row: span 2; }
.bento__list     { grid-column: span 3; grid-row: span 4; }
```

Pitfall with real accessibility teeth: `grid-auto-flow: dense` **reorders visually independent of DOM order** — keyboard/screen-reader users traverse DOM order, so a visually-sensible bento can still violate WCAG 1.3.2 (Meaningful Sequence) if source order wasn't kept intentional. Keep the DOM in reading order and let `dense` fill gaps only, don't rely on it to fix a badly-ordered source. ([iamsteve.me: Bento grid with CSS grid & container queries](https://iamsteve.me/blog/bento-layout-css-grid))

**Asymmetric grids.** Deliberately unequal column widths (`grid-template-columns: 2fr 1fr 1fr`) instead of uniform columns — an editorial/marketing technique for visual interest and emphasis. Avoid in utility/productivity UI and forms, where predictability of alignment beats visual interest; if used, keep the *gaps* on-scale even though the columns aren't uniform.

**Subgrid.** Lets a nested grid item inherit its parent's track sizing instead of establishing independent tracks — the fix for "this card's internal header/body/footer won't line up with the card next to it."

```css
.row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-5); }
.card { grid-column: span 1; display: grid; grid-row: span 3;
        grid-template-rows: subgrid; }  /* card's own rows now align to siblings' rows */

@supports not (grid-template-rows: subgrid) {
  .card { grid-template-rows: auto 1fr auto; } /* manual fallback: approximate the same 3 rows */
}
```

Baseline since September 2023, **~90–93% global** (Firefox led, 71+; Chrome/Edge 117+; Safari 16+). ([MDN Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid), [caniuse](https://caniuse.com/css-subgrid))

**Holy grail.** Header/footer full-width, 3-column middle (nav/main/aside), one grid declaration, no floats or JS:

```css
.shell { display: grid; grid-template: auto 1fr auto / auto minmax(0,1fr) auto;
         min-block-size: 100dvb; }
.shell > header { grid-column: 1 / -1; }
.shell > footer { grid-column: 1 / -1; }
```

`minmax(0,1fr)` on the main column is load-bearing — without it, long unbreakable content (a URL, a wide table) overflows the track instead of scrolling inside it. ([web.dev: Holy grail — ten modern layouts in one line of CSS](https://web.dev/patterns/layout/holy-grail))

**Sidebar (split) — no media query needed.** The [Every Layout](https://every-layout.dev/layouts/sidebar/) `Sidebar` pattern (Heydon Pickering & Andy Bell) wraps a fixed pane and a flexible pane so the layout self-collapses to stacked at narrow widths:

```css
.with-sidebar { display: flex; flex-wrap: wrap; gap: var(--space-5); }
.sidebar      { flex-basis: 20rem; flex-grow: 1; }
.not-sidebar  { flex-basis: 0; flex-grow: 999; min-inline-size: 50%; }
```

The `flex-grow: 999` is a deliberate, documented hack (comment it in code) — it forces the content pane to consume all available space while the sidebar keeps its intrinsic width; `min-inline-size: 50%` is what actually triggers the wrap point.

**RAM pattern (Repeat/Auto/Minmax) — responsive card grids without breakpoints:**

```css
.card-grid { display: grid; gap: var(--space-5);
             grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); }
```

Cards reflow their count automatically as the container widens — pair with container queries (§4.3) if the *cards themselves* also need to change internal layout at some width, not just their count.

### 4.5 Density modes — how compact, and when does data need its own scale?

Density is a row-height/padding scale, and the same 8pt layout scale is usually the *wrong* tool for it once a surface is data-dense: an 8px jump from 24→32px row height is a 33% change, too coarse for tuning "how many rows fit." IBM Carbon's data table exposes four **confirmed** sizes:

| Density | Row height | Notes |
|---|---|---|
| Extra small (xs) | **24px** | Power-user/monitoring; verify target-size implications (A5) before shipping interactive cells at this height |
| Small (sm) | **32px** | Compact — dense professional tools |
| Medium (md) | **40px** | Default/standard |
| Large (lg) | **48px** | Comfortable |
| Extra large (xl) | **64px** | Touch-adjacent / relaxed review |

Source: [Carbon data table style](https://carbondesignsystem.com/components/data-table/style/). Cross-reference: MUI X DataGrid's confirmed **default standard row height is 52px**, with compact/comfortable density toggles built as multipliers off that base — the exact multiplier factors were not independently confirmed from primary docs in this pass (flagged §8); treat MUI's own numbers as authoritative if you're building on MUI specifically. ([MUI X: Row height](https://mui.com/x/react-data-grid/row-height/))

**Decision rule — when density needs its own independent scale (not the layout 8pt scale):** if a table/grid is meant to display **more than ~15–20 rows** in a standard viewport without scrolling, or the surface is a professional/power-user tool (trading, logs, monitoring, admin back-office), define a **dedicated 4px-step density scale** (24/28/32/36/40) decoupled from page-layout spacing, and let the two scales diverge on purpose. General content surfaces (cards, list views, settings) should stay on the 8pt scale — introducing a second scale there is unnecessary complexity.

**Recommended density tier table (synthesis, grounded in the numbers above):**

| Density | Row height | Cell padding (V / H) | Use for |
|---|---|---|---|
| Comfortable | 48–64px | 12–16px / 16px | Default consumer surfaces, touch-adjacent |
| Standard | 40px | 8–12px / 16px | Default enterprise data grid |
| Compact | 32px | 6–8px / 12px | Power-user dense grids |
| Extra-compact | 24px | 2–4px / 8px | Logs/monitoring only — own scale, own a11y review |

**Boundary reminder:** A3 owns this row-height/density *scale*; what's rendered inside each cell (sortable headers, cell types, virtualization strategy) is **C3**'s; the hard minimum click/tap target number is **A5**'s.

### 4.6 Alignment & optical correction — when does "correct" math look wrong?

Mathematically centered ≠ visually centered whenever a shape's silhouette isn't a rectangle. The eye judges by perceived mass/area, not bounding-box geometry.

**Circle vs. square, equal nominal size.** A circle and a square sharing the same *height* are not the same *area* — a circle of diameter 20 units has area ≈314 sq units against a square of side 18 units at 324 sq units (matched as closely as whole-unit sizing allows, still ~3% apart) — meaning to make a circular badge/avatar/icon *read* as the same size as a square neighbor, it typically needs to be enlarged roughly **2–4%** beyond the square's nominal box. The same logic applies to triangular marks (a play-button icon's centroid, not its bounding-box center, is what should align to a button's visual center). ([D'Amato: Logical Optical](https://blog.damato.design/posts/logical-optical/))

**Icon-vs-text vertical misalignment.** The chronic offender: an icon sits visibly above or below the text label next to it. Root cause is font "half-leading" — every font reserves an inconsistent amount of invisible space above/below the glyph within its line box, and that space (not the glyph) is what flexbox `align-items: center` actually centers. The current CSS-native fix:

```css
.button__label { text-box: trim-both cap alphabetic; } /* trims the half-leading directly */
```

`text-box-trim` values: `trim-start` / `trim-end` / `trim-both` / `none`; `text-box-edge` reference points: `cap` (capital-letter height), `ex` (x-height), `text` (glyph bounds), `alphabetic`. Support: **Chrome/Edge 133+, Safari 18.2+, ~79% global — no Firefox yet** (verify at build time). Fallback for unsupported engines: a manually-tuned `transform: translateY(1px)` (or 2px, per-typeface) nudge on the text node, or accept default half-leading and design the row-height with enough padding that ±1–2px doesn't read as broken. ([Chrome for Developers: `text-box-trim`](https://developer.chrome.com/blog/css-text-box-trim), [caniuse](https://caniuse.com/css-text-box-trim))

**Hairline/1px-border rendering.** A `1px` CSS border can render as a fractional or doubled physical pixel on non-integer device-pixel-ratio displays (common at 125%/150% OS scaling — exactly the scaling most 27"+ 4K monitors run at, §4.7). Prefer `box-shadow: 0 0 0 1px var(--color)` over `border` for hairlines where sub-pixel consistency matters, and test at 125%/150% OS scaling specifically, not just 100%/200%.

**Optical margin alignment (hanging punctuation).** A quotation mark or bullet glyph has visible white space in its own bounding box; align the *ink*, not the box, to the text edge — pull opening quotes/bullets slightly outside the text block (`hanging-punctuation: first` where supported, or a small negative text-indent as a manual fallback) so the paragraph's visual left edge reads flush.

### 4.7 Responsive strategy & large-display-first — what actually changes on a 27"+ 4K monitor?

**The failure mode this section exists to prevent:** treating "large display" as "the same mobile-derived layout, just stretched." That produces either (a) absurdly long text lines, or (b) enormous empty margins with content marooned in the center — both are common, both are wrong, and NN/g has been documenting the second failure for over two decades: *"screen space shouldn't be hoarded, it should be spent"* — as screens grow, **enlarge content and show more of it**, don't just enlarge the margins around a fixed-size island. ([NN/g: Utilize Available Screen Space](https://www.nngroup.com/articles/utilize-available-screen-space/))

**Physical reality check — what "27+ 4K" actually gives you in CSS pixels:**

| Panel | Physical resolution | PPI | Typical OS scaling | Resulting logical (CSS) viewport |
|---|---|---|---|---|
| 27" 1440p | 2560×1440 | 109 | 100% | 2560×1440 |
| 27" 4K | 3840×2160 | 163 | ~150% (common default) | **≈2560×1440** — same layout budget as 1440p |
| 27" 4K | 3840×2160 | 163 | 100% (some power users) | 3840×2160, but text/UI renders very small |
| 32" 4K | 3840×2160 | 138 | 125% | ≈3072×1728 |

PPI figures: [DisplayNinja](https://www.displayninja.com/what-is-pixel-density/) (27" 4K = 163 PPI, 27" 1440p = 109 PPI, comfortable no-scaling band ≈110–140 PPI). **Practical rule: design and test your "large" tier against logical CSS widths of 1536/1920/2560/3840px explicitly — don't assume the panel's marketing resolution is what CSS receives.** Desktop resolution market-share data changes quickly and cross-source figures were inconsistent in this research pass — treat any single-source resolution-share statistic as indicative only (flagged in §8), and instead design against the PPI/scaling logic above, which holds regardless of market share.

**Window size classes (Google's Material 3 breakpoints, verified via Android's implementation docs):**

| Class | Width | Represents |
|---|---|---|
| Compact | <600dp | 99.96% of phones, portrait |
| Medium | 600–839dp | Tablets portrait, unfolded-inner displays portrait |
| Expanded | 840–1199dp | Tablets landscape, unfolded-inner displays landscape |
| Large | 1200–1599dp | Large tablets |
| **Extra-large** | **≥1600dp** | **Desktop displays** |

Source: [Android Developers: window size classes](https://developer.android.com/develop/ui/views/layout/use-window-size-classes) (`dp` ≈ CSS `px` at 1× — treat as directly portable to web breakpoints). This is the single most load-bearing number for large-display-first work: **1600px logical width is where Google's own system explicitly names the tier "Desktop displays"** — that's your practical "go large-display" breakpoint, not 1200px, and not the panel's physical 3840px.

**Canonical multi-pane layouts and their real proportions** (this is what "add structure, not width" means concretely):

| Pattern | Compact (<600dp) | Medium (600–839dp) | Expanded (≥840dp) |
|---|---|---|---|
| **List-detail** | One pane at a time (selecting a list item replaces the list with detail) | Same as compact | **Both panes simultaneously** |
| **Supporting pane** | Single pane; supporting content moves below/into a sheet | **50/50** split | **70/30** split (main/supporting) |
| **Feed** | Single scrolling column | Multi-column grid begins | More columns via `auto-fit`/`minmax()` (§4.4) |

Source: [Android Developers: Canonical layouts](https://developer.android.com/develop/ui/views/layout/canonical-layouts). Note the proportions **change with tier** (50/50 → 70/30) rather than the panes simply growing together — that's the structural difference between "responsive" and "large-display-first."

**Five concrete moves for the extra-large (≥1600px) tier:**
1. **Cap measure regardless of width** — 45–75ch (§ exec rule 5) even at 3840 logical px.
2. **Add a pane, don't widen one** — go from single-pane → list-detail → list-detail-plus-inspector as width tiers cross, mirroring the canonical proportions above.
3. **Fixed-width rails stay fixed** — navigation rails and inspector/filter panels have a natural content width (icons + labels, form controls); bound them with `clamp()`/`rem`, e.g. `inline-size: clamp(15rem, 20vw, 18.75rem)` (240–300px), and let only the *flexible* content zone consume extra width.
4. **Opportunistic density, not bigger rows** — a table or card feed should show *more rows/columns* as vertical/horizontal space grows, not taller rows or bigger cards past a sensible cap (card width cap ≈360–420px is common before it starts feeling like wasted space per item).
5. **Multi-column body text is a rare exception, not a default** — CSS multi-column (`columns: 2`) is legitimate for long-form document/article readers on very wide panels, but is almost never right for application UI; prefer panes over newspaper columns for anything interactive.

**Honesty flag on "bigger screen = more productive."** Vendor productivity claims (e.g., Apple's monitor-size study) have been directly challenged by Nielsen for testing rote, skilled, low-level operations rather than realistic tasks — don't cite screen-size productivity percentages as settled fact in design rationale; the *qualitative* recommendation (spend the space, add structure) is well evidenced even where the *quantitative* productivity claims are not. ([NN/g: Productivity and screen size](https://www.nngroup.com/articles/productivity-and-screen-size/))

**Worked example 2 — large-display-first responsive shell** (rail + measure-capped main + supporting pane, fluid gutters, subgrid-enhanced card row, container-query-aware panel). Single self-contained block, CSP-safe (no JS, no network):

```html
<style>
  :root {
    --rail-w: clamp(15rem, 20vw, 18.75rem);      /* 240–300px, fluid within bounds */
    --gutter: clamp(1rem, 0.21rem + 3.16vw, 4rem); /* 16px → 64px, §4.2 formula */
    --measure: 65ch;
  }

  .shell {
    display: grid;
    grid-template-columns: var(--rail-w) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    min-block-size: 100dvb;
  }
  .shell__header { grid-column: 1 / -1; }

  .rail { padding: var(--gutter) var(--space-5); border-inline-end: 1px solid var(--border); }

  /* Expanded tier (≥840px, mirrors M3 "expanded"): reveal the supporting pane at 70/30 */
  .content { display: grid; grid-template-columns: 1fr; gap: var(--gutter); padding: var(--gutter); }
  @media (width >= 840px) {
    .content { grid-template-columns: 70fr 30fr; }
  }
  /* Extra-large tier (≥1600px, M3's own "desktop displays" cut-line): add a third zone
     instead of widening the first two */
  @media (width >= 1600px) {
    .content { grid-template-columns: var(--rail-w) 1fr 30fr; }
  }

  .prose { max-inline-size: var(--measure); }   /* cap the line length even at 4K, exec rule 5 */

  /* Card row: subgrid keeps each card's header/body/footer aligned across siblings */
  .card-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              grid-auto-rows: auto 1fr auto; gap: var(--space-5); }
  .card { grid-row: span 3; display: grid; grid-template-rows: subgrid; }
  @supports not (grid-template-rows: subgrid) {
    .card { grid-template-rows: auto 1fr auto; } /* ~93% engines fall back to this, visually close */
  }

  /* Supporting pane is itself a container-query context — adapts to ITS space, not the viewport */
  .supporting-pane { container-type: inline-size; container-name: supporting; }
  @container supporting (width < 20rem) { .supporting-pane .meta-row { flex-direction: column; } }
</style>

<div class="shell">
  <header class="shell__header">…</header>
  <nav class="rail">…</nav>
  <main class="content">
    <article class="prose">…</article>
    <aside class="supporting-pane"><div class="meta-row">…</div></aside>
  </main>
</div>
```

### 4.8 Z-index & layering — how do you guarantee something stays on top?

**Evidenced real-world scale (Bootstrap 5.3)** — note the *relative order* and the *gaps*, not just the absolute numbers:

| Layer | z-index |
|---|---|
| Dropdown | 1000 |
| Sticky | 1020 |
| Fixed | 1030 |
| Offcanvas backdrop | 1040 |
| Offcanvas | 1045 |
| Modal backdrop | 1050 |
| Modal | 1055 |
| Popover | 1070 |
| Tooltip | 1080 |
| Toast | 1090 |

Source: [Bootstrap 5.3: Z-index](https://getbootstrap.com/docs/5.3/layout/z-index/) — Bootstrap explicitly warns against changing one value without reconsidering all of them, because the *relationships* are the point, not the specific numbers.

**Recommended token ladder** (this report's synthesis — same relative order as Bootstrap's evidenced scale, wider gaps for insertion headroom, named to match the tiers this track was asked to cover):

```css
:root {
  --z-base:      0;     /* normal document flow */
  --z-dropdown:  1000;  /* menus, select popups, autocomplete */
  --z-sticky:    1100;  /* sticky headers, sticky table columns */
  --z-overlay:   1200;  /* scrims/backdrops behind modals & drawers */
  --z-modal:     1300;  /* dialogs, drawers, sheets */
  --z-popover:   1400;  /* floating panels anchored to a trigger */
  --z-tooltip:   1500;  /* tooltips */
  --z-toast:     1600;  /* notifications — must beat tooltips while visible, per Bootstrap's evidenced order */
}
```

**The alternative model — relational tokens, no magic numbers at all.** Smashing Magazine's proposed system replaces absolute integers with arithmetic relationships (`base = 0`, `above = base + 1`, e.g. `dropdown = above + openButton`) so every value's *reason* is legible in the token name itself and a linter can catch a broken dependency; the article notes a real production app's highest resulting value was only **5**, versus the four-and-five-digit numbers common in ad-hoc CSS. Use this model when a team is fighting constant z-index collisions and needs the *reasoning* enforced, not just the *values*. ([Smashing Magazine: Managing CSS Z-Index in Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/))

**What actually creates a new stacking context** (i.e., why a `z-index: 9999` child can still render *underneath* a `z-index: 5` element elsewhere on the page) — the full trigger list:

| Trigger | Example |
|---|---|
| Root element | `<html>` |
| `position: relative/absolute` + `z-index ≠ auto` | Any explicitly positioned, explicitly stacked element |
| `position: fixed` or `sticky` | Always creates a context, with or without z-index |
| Flex/grid item + `z-index ≠ auto` | A grid cell given a stacking order |
| `opacity < 1` | A faded card |
| `transform`, `filter`, `backdrop-filter`, `clip-path`, `mask`, `perspective` ≠ `none` | Any of B1's compositor-friendly animated properties |
| `mix-blend-mode ≠ normal`, `isolation: isolate` | Blend-mode compositions |
| `contain: layout/paint`, **`container-type: size`/`inline-size`** | §4.3's container queries — the crossover gotcha |
| `will-change` naming a stacking-context property | Pre-animation hints |
| Top-layer membership | Fullscreen, popover, `<dialog>` (see below) |

Source: [MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context). **The bug pattern:** if a positioned ancestor (say, `.card` with `transform` for a hover lift) has *any* stacking context, its descendants' z-index values are compared **only against siblings inside that same context** — a `z-index: 6` grandchild trapped inside a `z-index: 4` ancestor will still render *below* an unrelated `z-index: 5` element elsewhere, because the comparison that matters is at the ancestor level, not the leaf. **Fix:** raise the *ancestor's* z-index/token tier, or don't give the ancestor a stacking-context-triggering property in the first place, or render the overlay outside that subtree entirely (portal to `<body>`, or use the top layer below).

**The top layer — the way to stop fighting z-index for must-win layers.** `<dialog>` (shown via `.showModal()`) and elements with the `popover` attribute are promoted to the browser's **top layer**, a rendering layer that sits above the entire document. Inside the top layer, **z-index has no effect** — elements stack purely by insertion/most-recently-shown order, so a top-layer element always wins against *any* z-index value in normal flow, permanently. `<dialog>` has broad modern support; the Popover API reached Baseline "Newly available" in 2024 and is Baseline-solid by mid-2026. Use the top layer for modals, popovers/menus, and native tooltips instead of hand-managed z-index wherever the component can be authored as `<dialog>`/`[popover]`. ([Chrome for Developers: What is the top layer](https://developer.chrome.com/blog/what-is-the-top-layer), [web.dev: Popover reaches Baseline](https://web.dev/blog/popover-baseline))

### 4.9 Whitespace as hierarchy — how much space communicates what?

**Macro vs. micro whitespace.** Macro whitespace (between major regions — nav/content/rail, between page sections) should live in the large end of the scale, **32–128px** (`--space-7` through `--space-11`). Micro whitespace (inside a component, between a label and its input) lives at the small end, **2–16px** (`--space-1` through `--space-5`). A layout that uses the *same* gap for both macro and micro relationships has no hierarchy signal left to give — everything reads as equally (un)related.

**Proximity is the mechanism.** Items placed closer together are read as belonging together (the Gestalt law of proximity, foundational to all grid/spacing systems here) — which is why whitespace is a hierarchy tool *before* color or type-weight: grouping/separation via distance requires no additional visual style, works in light and dark mode identically, and never competes with a brand palette.

**Practical rules:**
- **Start generous, then remove.** Design with more whitespace than feels necessary and pull it back, rather than starting tight and trying to add "breathing room" later — the latter tends to produce inconsistent, ad-hoc spacing since there's no longer a system driving it. ([Refactoring UI notes](https://jacobshannon.com/blog/books/refactoring-ui/layout-and-spacing/))
- **Heading space-above > space-below**, roughly 1.5–2×. A heading with equal space on both sides visually floats between the section it introduces and the one before it; more space above than below makes the ownership direction unambiguous with zero typographic change.
- **Don't scale everything proportionally across breakpoints.** Large elements (hero sections, big CTAs) should shrink *disproportionately faster* than small elements (body text, icons) as viewport narrows — a design that scales uniformly looks merely zoomed, not genuinely adapted. ([Refactoring UI notes](https://jacobshannon.com/blog/books/refactoring-ui/layout-and-spacing/))
- **Reach for space before a rule/divider.** A visible border is a stronger, more permanent-feeling separator than whitespace — reserve it for cases where proximity/spacing genuinely isn't enough to read as separate (e.g., a data table's row/column grid), and let spacing alone do the grouping work everywhere else.

---

## 5. Options catalogue — grid & layout systems

Columns: **what · when · when NOT · licence · how (CSP-safe/offline) · CSP/feasibility · pitfalls.** Licence is **n/a** throughout this table — every row is a CSS *technique*, not a distributable library, so there is nothing to license; the one actual library referenced in this report (Open Props) is licensed separately (§9).

| System | What | When | When NOT | Licence | How (single-file, strict-CSP) | CSP/feasibility | Pitfalls |
|---|---|---|---|---|---|---|---|
| **12-column grid** | Uniform grid, items span N of 12 columns | General-purpose page/section layout; anything needing simultaneous halves/thirds/quarters/sixths | Highly irregular editorial spreads; dense data grids (use §4.5's density scale instead) | n/a | `grid-template-columns: repeat(12, minmax(0,1fr))` + `grid-column: span N` | Pure CSS, zero JS, fully CSP-safe & offline-safe | Spans that don't divide evenly leave orphan gaps; omitting `minmax(0, …)` lets content overflow its track |
| **Bento** | Irregular grid of mixed-size tiles, gaps auto-filled | Dashboards/overview surfaces showing heterogeneous content at a glance | Sequential/step content; anything a screen-reader user must traverse in strict order | n/a | `repeat(12, minmax(0,1fr))` + `grid-auto-flow: dense` + per-tile `grid-column/row: span` (§4.4) | Pure CSS, CSP-safe | `dense` reorders **visually only** — DOM order must stay meaningful (WCAG 1.3.2); cap tile-size vocabulary at ~3 sizes or it reads as chaos |
| **Asymmetric** | Deliberately unequal column widths (`2fr 1fr 1fr`) | Editorial/marketing pages, hero sections, emphasis via imbalance | Utility/productivity UI, forms — predictability beats visual interest | n/a | `grid-template-columns: 2fr 1fr 1fr` (or mixed `px`/`fr`) | Pure CSS, CSP-safe | Easy to drift into inconsistent rhythm; keep *gaps* on-scale even when columns aren't uniform |
| **Holy grail** | Header/footer full-width, 3-col middle (nav/main/aside), one grid | Classic persistent-nav app shell | Content needing >3 horizontal regions at once (use dashboard) | n/a | `grid-template: auto 1fr auto / auto minmax(0,1fr) auto` (§4.4) | Pure CSS, CSP-safe, one declaration | Main column needs `minmax(0, 1fr)` or long unbreakable content overflows; size nav/aside from intrinsic content, not eyeballed px |
| **Split (two-pane)** | Two panes, one flexible/one fixed or proportional (50/50, 70/30) | Compare views, editor+preview, list-detail | Below the container's "medium" width — must collapse to single pane | n/a | Every Layout `Sidebar` pattern: fixed `flex-basis` pane + `flex-grow: 999; min-inline-size: 50%` content pane (§4.4) | Pure CSS, CSP-safe, no media query needed | `flex-grow: 999` is a real (documented) hack — comment it; wrap point is unpredictable without `min-inline-size` |
| **Sidebar + content** | One fixed/narrow rail (nav, filters, inspector) + one fluid zone | Persistent navigation/tools that must stay a constant, content-independent width | Content that itself needs to flex the rail's width (rare) | n/a | `grid-template-columns: clamp(15rem,20vw,18.75rem) 1fr` or the flex Sidebar pattern | Pure CSS, CSP-safe | Fixing rail width in raw `px` fights user zoom — bound with `rem`/`clamp()` (§ exec rule 7's large-display move #3) |
| **Dashboard** | Multiple independent, often container-query-aware panels in a grid | Monitoring/analytics/admin overviews — many small glanceable units | Focused single-task flows; long-form reading | n/a | 12–16 col grid + bento-style spans per panel; each panel its own `container-type: inline-size` context | Pure CSS + optional non-`eval` JS for drag-reorder (pointer events + DOM move) | Independent per-panel container queries can pick visibly inconsistent internal density across panels; cap the panel-size vocabulary |
| **List-detail** (bonus) | Two panes: browse list, view/edit detail | Messaging, contact managers, product catalogs | Single, non-drillable content | n/a | Single grid at ≥840px (`auto-fit` both panes); single pane + swap below | Pure CSS, CSP-safe | At compact width, must swap panes rather than compress both — compressing both to fit is unreadable |
| **Feed / card grid (RAM)** | Auto-reflowing grid of equal-ish cards | Large content volumes: news, catalogs, search results | Content needing fixed reading order/pagination logic | n/a | `grid-template-columns: repeat(auto-fit, minmax(240px,1fr))` (§4.4) | Pure CSS, CSP-safe, zero breakpoints needed | Without a `min()` cap, a lone item can stretch to full container width and look broken |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Arbitrary spacing values** | Grep CSS for margin/padding/gap values not in the token list (13px, 22px, 7px…) | Replace with nearest scale token (§4.1); add a lint rule disallowing raw `px` in spacing properties |
| **Text column stretches to fill a wide monitor** | Paragraph `max-width: none`/`100%`; line length visibly >90 characters on a large display | Cap `max-inline-size: 65ch` on prose containers (§4.7 exec rule 5); route extra width to a second pane |
| **"4K-ready" only tested at 100% OS scaling** | Design feels tiny/cramped at the OS's actual default (≈150% on 27"/4K) | Test against logical viewport widths 1536/1920/2560px, not the panel's native resolution (§4.7) |
| **Large display = same layout, just centered with huge margins** | Content marooned in a fixed-width island on a 1600px+ viewport, empty gutters on both sides | Add a pane/rail per the canonical proportions (50/50 → 70/30, §4.7); don't just add margin |
| **Z-index arms race** | Grep for `z-index` values >2000 or non-token integers (`9999`, `99999`) | Migrate to the tiered token ladder (§4.8); move must-win layers to the native top layer |
| **Z-index child trapped under a lower sibling** | Element with a *higher* z-index still renders behind something with a *lower* one | Find the ancestor stacking context (position+z-index, opacity<1, transform, filter, `container-type`, etc.); raise the ancestor's tier or render the overlay outside that subtree/via the top layer (§4.8) |
| **`container-type: size` collapses content** | Content inside a container-query wrapper disappears or shrinks to zero height | Use `container-type: inline-size` unless block-axis querying is truly required (§4.3) |
| **Bento/dense-grid visual order ≠ DOM order** | Tab through the page; keyboard focus jumps illogically versus the visual layout | Keep DOM order = intended reading order; use `grid-auto-flow: dense` only to fill gaps, verify with a screen reader (WCAG 1.3.2) |
| **Dense table forced onto the 8pt layout scale** | Row height locked to 24/32/40 clashes with the density the surface actually needs | Give the table its own 4px-step density scale, decoupled from page-layout spacing (§4.5 exec rule 11) |
| **Subgrid with no fallback** | Nested grid items misalign in the ~7–10% non-supporting share | `@supports (grid-template-columns: subgrid)`; fallback manually repeats the parent's track sizes (§4.4) |
| **Icon/text baseline mismatch** | Zoom to 400%, screenshot a button row; icon visibly floats above/below its label | `text-box-trim: trim-both` where supported (~79%); manual `translateY()` nudge fallback elsewhere (§4.6) |
| **Circular/pointed mark looks smaller than square neighbors** | Circle and square at identical CSS width look visually mismatched side-by-side | Enlarge the circular/pointed element ~2–4% of nominal size (§4.6) |
| **Whitespace used inconsistently as a signal** | Two visually-equal gaps mean different relationships in different parts of the UI | Audit against the token scale; codify which token = which semantic relationship (always `--space-3` label↔input, always `--space-7` between sections) |
| **Container query breakpoints hard-coded per component** | Grep for repeated raw `@container (min-width: XXXpx)` literals scattered across files | Centralize as shared custom-property thresholds (§4.3); consider container *style* queries once broadly Baseline |
| **Fixed-width rail fights browser zoom** | At 200% browser zoom, the rail crowds out main content or its own content clips | Define rail bounds with `rem`/`clamp()`, never raw `px` (§4.7) |

---

## 7. Pre-flight checklist (run before shipping any layout)

- [ ] Every spacing value traces to a scale token (§4.1); off-scale values exist only for optical correction, hairlines, or forced external alignment (exec rule 3).
- [ ] Fluid (`clamp()`) is used for macro/page-level values that should breathe continuously; modular tokens are used for anything that must be nameable/reused (§4.2).
- [ ] Prose/reading columns are capped at **45–75ch** (65ch default) on every viewport, including the largest (§4.7 exec rule 5).
- [ ] The large-display tier (≥1600px logical) adds a **pane/rail**, not just wider margins or a wider single column (§4.7).
- [ ] Layouts were tested against **logical CSS widths** (1536/1920/2560px), not panel marketing resolution (§4.7).
- [ ] Container queries use `container-type: inline-size` (not `size`, unless block-axis querying is deliberate) and `rem` thresholds, with a `@supports`/non-supporting fallback that degrades to the most-compact state (§4.3).
- [ ] Any `container-type`/positioned/transformed ancestor was checked for accidental **stacking-context trapping** of its overlay children (§4.8, §4.3 gotcha).
- [ ] Subgrid usage has an `@supports (grid-template-columns: subgrid)` fallback for the ~7–10% non-supporting share (§4.4).
- [ ] `grid-auto-flow: dense` (bento) never scrambles DOM/reading order — verified with keyboard tab order and/or a screen reader (§4.4, WCAG 1.3.2).
- [ ] Any data-dense surface (>15–20 visible rows, or a power-user tool) uses its **own 4px-step density scale**, not the 8pt page-layout scale (§4.5).
- [ ] z-index values come from the tiered token ladder (base/dropdown/sticky/overlay/modal/popover/tooltip/toast); must-win layers (modal, popover, tooltip) use the native **top layer** (`<dialog>`/`[popover]`) where feasible instead of hand z-index (§4.8).
- [ ] Icon/text vertical alignment checked at 400% zoom; `text-box-trim` or a tuned fallback nudge applied where misaligned (§4.6).
- [ ] Circular/pointed marks are optically enlarged (~2–4%) relative to rectilinear neighbors of the "same" size (§4.6).
- [ ] Whitespace, not color/weight, is the first hierarchy tool tried; section headings carry more space above than below (§4.9).
- [ ] All of the above holds in **both light and dark** themes (spacing/z-index tokens are theme-agnostic by construction — verify no light/dark-only spacing overrides crept in).

---

## 8. Open questions / unverified

- **Desktop screen-resolution market-share figures were unreliable in this research pass.** A live StatCounter pull returned an implausible distribution (e.g., an apparently large "800×600" share for mid-2026 desktop traffic) that reads as a data-extraction artifact rather than real data. **Do not cite specific resolution-share percentages from this report** — re-pull [gs.statcounter.com/screen-resolution-stats/desktop/worldwide](https://gs.statcounter.com/screen-resolution-stats/desktop/worldwide) directly at build/decision time. The PPI/OS-scaling reasoning in §4.7 does not depend on this figure and is separately sourced.
- **Container *style* queries** reached Baseline "Newly Available" on **19 May 2026** — roughly two months before this report's date. "Newly available" is not "Widely available" (Baseline's bar is ~30 months of full core-browser support); treat style queries as emerging and keep a fallback for at least the next year or two. ([source](https://www.thedroptimes.com/70900/css-container-style-queries-drupal))
- **MUI X DataGrid's exact compact/comfortable density multipliers** were not independently confirmed from primary docs in this pass — only the default **standard = 52px** row height was confirmed. If building specifically on MUI, verify the current compact/comfortable pixel outputs against MUI X's own source/docs before hard-coding them into a spec.
- **`text-box-trim`/`text-box-edge` Firefox support** was not shipped as of the sources checked (mid-2026); this property is moving fast — re-check [caniuse](https://caniuse.com/css-text-box-trim) at build time.
- **Material Design 3's current (m3.material.io) layout-grid column counts per breakpoint could not be directly fetched** — the site is JS-rendered and returned only metadata to this report's fetch tool. The window-size-class **dp thresholds** used throughout (600/840/1200/1600) come from Android Developers' documentation of the same M3 system and are high-confidence; the **column-count-per-tier** table in §4.4 is sourced from the legacy M1 spec (`m1.material.io`) as a fallback and should be cross-checked against current M3 documentation directly before being treated as current Google guidance.
- **Firefox's subgrid support figure (71+, i.e., 2019)** looks surprisingly early relative to Chrome/Safari, but is consistent with Firefox's well-known lead in implementing CSS Grid Level 2 subgrid ahead of other engines — flagged for re-verification at build time since caniuse data drifts.
- **The "~2–4% optical enlargement" rule for circular/pointed shapes** is this report's synthesis from one worked example's numbers (a ~314-vs-324-square-unit, ~3%, area comparison) rather than a codified spec constant — treat as a starting heuristic to tune by eye per icon set/typeface, not a precise formula.
- **Refactoring UI's exact spacing-scale numbers** could not be sourced from the (paywalled) book directly; the numbers in §4.1's comparison table are from a third-party chapter summary and from Tailwind CSS's default scale (which the book is widely reported to have influenced) — treat as representative, not a verbatim quote of the book.

---

## 9. Sources

Primary / authoritative:
- [MDN — CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — syntax, `container-type`, units.
- [MDN — CSS Subgrid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Subgrid) — syntax, Baseline status.
- [MDN — `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) — syntax, resolution algorithm, Baseline status.
- [MDN — Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context) — full trigger list, nested-context bug pattern.
- [MDN — `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim).
- [caniuse — CSS container queries](https://caniuse.com/css-container-queries) (~93% global).
- [caniuse — CSS subgrid](https://caniuse.com/css-subgrid) (~90–93% global).
- [caniuse — CSS math functions](https://caniuse.com/css-math-functions) (~94% global, `clamp()`/`min()`/`max()`).
- [caniuse — CSS `text-box-trim`](https://caniuse.com/css-text-box-trim) (~79% global).
- [Chrome for Developers — What is the top layer](https://developer.chrome.com/blog/what-is-the-top-layer).
- [Chrome for Developers — CSS `text-box-trim`](https://developer.chrome.com/blog/css-text-box-trim).
- [web.dev — Popover API reaches Baseline](https://web.dev/blog/popover-baseline).
- [web.dev — Ten modern layouts in one line of CSS (Holy grail)](https://web.dev/patterns/layout/holy-grail).
- [WCAG 2.0 — Understanding SC 1.4.8 Visual Presentation](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-visual-presentation.html) — 80-char line-width ceiling, 1.5× line/paragraph spacing.
- [Baymard Institute — Readability: The Optimal Line Length](https://baymard.com/blog/line-length-readability) — 50–75ch guidance, Emil Ruder attribution.
- [Butterick's Practical Typography — Line length](https://practicaltypography.com/line-length.html) — 45–90 characters, "2–3 alphabets" test.
- [Nielsen Norman Group — Utilize Available Screen Space](https://www.nngroup.com/articles/utilize-available-screen-space/) — "spend, don't hoard" principle.
- [Nielsen Norman Group — Productivity and Screen Size](https://www.nngroup.com/articles/productivity-and-screen-size/) — critique of naive screen-size productivity claims.
- [Android Developers — Use window size classes](https://developer.android.com/develop/ui/views/layout/use-window-size-classes) — compact/medium/expanded/large/extra-large dp thresholds.
- [Android Developers — Canonical layouts](https://developer.android.com/develop/ui/views/layout/canonical-layouts) — list-detail, supporting-pane 50/50 & 70/30, feed.
- [Material Design (legacy M1) — Responsive UI](https://m1.material.io/layout/responsive-ui.html) — column counts, gutters, 8dp baseline (verify against current M3, §8).
- [IBM Carbon Design System — 2x Grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/) — 16-column desktop grid, breakpoints.
- [IBM Carbon Design System — Spacing overview](https://v10.carbondesignsystem.com/guidelines/spacing/overview/) — full spacing token scale.
- [IBM Carbon Design System — Data table style](https://carbondesignsystem.com/components/data-table/style/) — 24/32/40/48/64px row heights.
- [GitLab Pajamas Design System — Spacing](https://design.gitlab.com/product-foundations/spacing) — `8×2ⁿ` formula, usage mapping.
- [Bootstrap 5.3 — Z-index](https://getbootstrap.com/docs/5.3/layout/z-index/) — evidenced real-world z-index scale.
- [Every Layout — Sidebar](https://every-layout.dev/layouts/sidebar/) (Heydon Pickering & Andy Bell) — flex-based split-pane pattern.
- [DisplayNinja — What is pixel density](https://www.displayninja.com/what-is-pixel-density/) — 27"/4K = 163 PPI, 27"/1440p = 109 PPI, scaling guidance.

Reference / secondary:
- [spec.fm — 8-Point Grid](https://spec.fm/specifics/8-pt-grid) — density-scaling rationale.
- [The Hangline — 8px Grid Spacing System](https://www.thehangline.com/8px-grid-spacing-system-explained-for-web-designers/).
- [freeCodeCamp — 8-Point Grid: Typography on the Web](https://www.freecodecamp.org/news/8-point-grid-typography-on-the-web-be5dc97db6bc/) — baseline/vertical rhythm.
- [Josh W. Comeau — A Friendly Introduction to Container Queries](https://www.joshwcomeau.com/css/container-queries-introduction/) — `rem` vs `px` thresholds, `container-type: size` gotcha.
- [iamsteve.me — Bento grid layout with CSS grid and container queries](https://iamsteve.me/blog/bento-layout-css-grid).
- [D'Amato — Logical Optical](https://blog.damato.design/posts/logical-optical/) — circle/square/triangle optical-correction worked numbers.
- [Jacob Shannon — Refactoring UI: Layout and Spacing (chapter notes)](https://jacobshannon.com/blog/books/refactoring-ui/layout-and-spacing/) — whitespace/hierarchy rules, 25%-apart scale rule.
- [Smashing Magazine — Managing CSS Z-Index in Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/) — relational z-index token model.
- [MUI X — Data Grid row height](https://mui.com/x/react-data-grid/row-height/) — 52px default standard row height.
- [Utopia — Fluid space calculator](https://utopia.fyi/space/calculator/) (James Gilyead & Trys Mudford) — free `clamp()` linear-interpolation generator, no runtime licence (output is plain CSS).
- [The Drop Times — CSS container style queries reach Baseline](https://www.thedroptimes.com/70900/css-container-style-queries-drupal) — 19 May 2026 Baseline date.

Licences (verified from source):
- [Open Props — MIT](https://github.com/argyleink/open-props/blob/main/LICENSE) (© Adam Argyle) — spacing/size custom-property scale, CDN or npm, [open-props.style](https://open-props.style/).
