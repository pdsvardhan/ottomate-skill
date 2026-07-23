# A4 — Shape, depth & material

*Design-intelligence reference. Track A4 of the registry research map. Written to be read by the design agent before it gives any surface a corner, an edge, a shadow, a sheen or a texture — and by a human owner auditing that work. Current as of **July 2026**; every recent-CSS claim carries a support verdict and a fallback, because this material ships into a **single self-contained HTML file under a strict CSP (no external requests, no eval)**, light **and** dark.*

---

## 1. Scope line

This track owns **the tactile language of a surface**: the **radius** system (how round, nested-radius maths, when sharp beats round), the **edge** (borders, hairlines, inset highlights, rings, gradient strokes), **elevation** (shadow physics, dual-shadow ladders, and the dark-mode problem where shadows barely read so border/tint/glow must substitute), **glassmorphism** (blur/saturation/highlight recipes and when they fail), **gradients** (linear/radial/conic/mesh and colour-space interpolation), **noise/grain/dithering** (killing banding), **animated borders/beams/glow treated as material**, and **texture/pattern** construction. It defines the **static material**; it hands off *animating* it, *choosing its hue*, and *proving its contrast* to siblings below.

## 2. Boundary (what this track does **not** cover)

MECE split — each neighbour named so nothing falls between:

- **Which hue / which ramp step a material uses** (is the accent `oklch(0.7 0.15 250)` or `…260`, how many steps in the neutral ramp) → **A1 Colour**. A4 says *build a tinted shadow / a two-stop gradient / a saturate-boosted glass*; A1 says *which colours go in*.
- **Animating a material** — the duration, easing, spring, stagger of a shadow lift, a rotating beam, a shimmering gradient → **B1 Motion**. A4 defines the *static* material **and flags it animatable, with the property to animate**; B1 owns the timing. (Cross-refs to B1 appear at every animated technique.)
- **Contrast / conformance maths** — APCA/WCAG ratios for text on glass, on gradients, on tinted surfaces → **A5 Accessibility**. A4 flags *where* a material threatens legibility and gives the mitigation levers; A5 owns the pass/fail model.
- **Sourcing ready-made texture/pattern/noise *packs*** (SVG pattern libraries, grain image sets) → **H1 Assets**. A4 owns **construction and usage** of texture from pure CSS/SVG; H1 owns procurement.
- **The consolidated single-file feasibility matrix across CSS vs SVG vs Canvas vs WebGL** → **H2 Feasibility**. A4 gives the **material-specific CSP/offline + browser-support verdict inline** for every technique; H2 is the master table.
- **Page-level render performance budgets** (paint area, layer count at scale, Core Web Vitals) → **E1 Performance**. A4 flags the *per-technique* cost (blur area, filter cost, layered-shadow paint); E1 owns the page budget.

---

## 3. Executive rules (apply before reading the body)

1. **Radius is a scale, not a free parameter.** Adopt a token ladder and pick by role: **0** (sharp — data/tech/full-bleed), **2–4px** (inputs, chips, subtle), **6–8px** (buttons, small cards), **10–16px** (cards, modals, sheets), **20–28px** (hero panels, large containers), **9999px** (pills, avatars, toggles). Mixing three unrelated radii on one screen is a smell; two (a "tight" and a "loose") is a system.
2. **Nest radii concentrically: `inner = outer − gap`.** An inner element inside a rounded container must use `border-radius: calc(<outer> − <padding>)`, or the corners run un-parallel and the gap "pinches." Clamp to zero: `max(0px, calc(outer − gap))`. ([Cloud Four — the maths of nesting rounded corners](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/))
3. **Sharp beats round when the message is precision.** Go sharp (0–2px) for dense data tables, code/technical surfaces, editorial/luxury voice, full-bleed edges (rounding an edge-touching element leaves an ugly sliver), and elements under ~16px (a 12px radius on a 16px chip eats the chip). Round (8px+) reads friendly/soft/consumer. Radius is brand tone, chosen deliberately.
4. **Elevation is a fixed ladder (6 levels), and every shadow obeys one light source.** Same direction for every shadow on the page — light from **above**, so **vertical offset ≈ 2× horizontal**, horizontal usually **0** for UI. As an element rises: **offset ↑, blur ↑, opacity per-layer ↓** in tandem. ([Josh Comeau — Designing Beautiful Shadows](https://www.joshwcomeau.com/css/designing-shadows/))
5. **Use dual/multi-layer shadows, and tint them — never a single pure-black blur.** Real elevation = a **tight contact shadow** (small y, small blur, slight negative spread) **+ a soft ambient shadow** (larger y, blur 1.5–3× the offset). Colour the shadow toward the surface hue at low lightness (e.g. `hsl(220 40% 12%)`), not `#000` — black shadows look muddy and dead. Per-layer alpha **0.06–0.14** in light mode. ([Comeau](https://www.joshwcomeau.com/css/designing-shadows/), [Tobias Ahlin — layered box-shadows](https://tobiasahlin.com/blog/layered-smooth-box-shadows/))
6. **In dark mode, shadows barely read — substitute surface-tint + hairline + (optional) glow.** A black shadow on a near-black surface has almost no contrast. Three substitutes, usually combined: (a) **lighten the surface as it rises** (higher elevation = lighter fill — Material's overlay model), (b) a **1px top inset highlight** `inset 0 1px 0 hsl(0 0% 100% / .06)` and/or a hairline border to *draw the shape*, (c) a **coloured glow** for focus/emphasis. If you keep cast shadows, push lightness→~0 and opacity to **0.4–0.7**, blur ~2×. ([cssShowcase — shadows in dark mode](https://www.cssshowcase.com/articles/color/shadows-in-dark-mode-adjusting-for-dark-backgrounds), [Material dark theme](https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md))
7. **Glass = semi-transparent fill + `backdrop-filter: blur(8–20px) saturate(120–180%)` + a 1px top highlight + a border.** The fill *must* be partly transparent or there's nothing to frost. `saturate` re-vivifies colours the blur washes out. **Safari still requires the `-webkit-backdrop-filter` prefix** (through Safari 18). Always `@supports`-gate with an **opaque fallback**, and honour `prefers-reduced-transparency`. ([MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter), [NN/g glassmorphism](https://www.nngroup.com/articles/glassmorphism/))
8. **Glass fails on busy backgrounds and low contrast — treat text legibility as the hard constraint.** Body text over glass still needs **4.5:1** (large/UI **3:1**). If the backdrop is photographic/animated, either blur *harder* (NN/g: 25px is mild, 100px genuinely obscures) or drop an opaque scrim behind the text. Never trade legibility for "seeing more background." ([Axess Lab — glassmorphism & accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/))
9. **Interpolate gradients in `oklch`/`oklab` to kill the muddy midpoint.** A plain sRGB gradient between two saturated hues dips through a grey dead-zone; `linear-gradient(in oklch, …)` stays vivid. Baseline ~2023–24 — `@supports`-gate and fall back to the plain gradient. ([MDN color-mix / colour spaces](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix))
10. **Kill 8-bit gradient banding with an inline-SVG `feTurbulence` grain overlay at 2–5% opacity.** `type="fractalNoise"`, `baseFrequency` 0.6–0.9 (fine grain), `numOctaves` 2–4, `color-interpolation-filters="sRGB"`. **CSP note:** put the SVG **inline in the DOM** (a real `<svg>`/`filter:url(#id)`) — a `data:` URI background needs `img-src data:` in the CSP and can be blocked. ([CSS-Tricks — Grainy Gradients](https://css-tricks.com/grainy-gradients/), [Codrops — feTurbulence texture](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/))
11. **Animated borders, beams and glow are *material*; build them with `@property` + `conic-gradient`, and always ship a static fallback.** `@property` (Baseline **9 Jul 2024**) lets you register an `<angle>` custom property so a gradient can be *animated*; plain custom properties can't interpolate. Gate with `@supports`, provide a non-rotating gradient ring, and honour `prefers-reduced-motion`. **The rotation's duration/easing is B1's**; A4 owns the ring's construction. ([web.dev — @property Baseline](https://web.dev/blog/at-property-baseline), [Ryan Mulligan — @property & the new style](https://ryanmulligan.dev/blog/css-property-new-style/))
12. **Gradient borders with rounded corners use the `mask-composite: exclude` two-layer trick — not `border-image` (which ignores radius).** Paint the gradient on `border-box`, then mask out the `padding-box` so only the ring shows. **Safari uses the `-webkit-mask-composite: xor` keyword**; ship both. CSP-safe (pure CSS). ([Temani Afif — border with gradient and radius](https://dev.to/afif/border-with-gradient-and-radius-387f))
13. **Use non-layout rings and inset highlights for crisp edges.** `box-shadow: 0 0 0 1px <color>` draws a **1px ring that doesn't shift layout** (unlike `border`) — ideal for dividers, focus rings, hairlines. `inset 0 1px 0 hsl(0 0% 100% / .08–.25)` is the top-lit edge that makes buttons and dark surfaces look real. Both pure CSS, CSP-safe.
14. **Derive tints/shadow-colours/glow-alphas from a base with `color-mix()` (Baseline May 2023), not hand-picked hex.** `color-mix(in oklab, var(--surface) 92%, black)` for a coherent darken; `color-mix(in srgb, var(--accent) 30%, transparent)` for a glow alpha. Keeps a whole material family in sync from one token. ([MDN color-mix](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix))
15. **Every recent-CSS material is progressively enhanced: `@supports`-gate, fall back, and never let the fallback break legibility or layout.** The non-negotiable baseline is a solid fill with adequate contrast; blur, mesh, beams, grain and oklch are enhancements on top. This is the single rule the strict-CSP/offline target most punishes if broken.

---

## 4. Body

### 4.1 Radius — how round, and the nesting maths

**The scale.** Pick a small set of radius tokens and assign by component role. A workable 6-stop ladder:

| Token | Value | Use for | Notes |
|---|---|---|---|
| `radius-0` | **0** | Tables, code, full-bleed, technical UI | "Precise" voice; edges that touch the viewport |
| `radius-xs` | **2–4px** | Inputs, checkboxes, tags, tight chips | Barely-there softening |
| `radius-sm` | **6–8px** | Buttons, small cards, menus | The default "friendly but serious" |
| `radius-md` | **10–16px** | Cards, modals, sheets, toasts | Consumer-soft |
| `radius-lg` | **20–28px** | Hero panels, feature tiles, large containers | Bold, modern |
| `radius-full` | **9999px** | Pills, avatars, toggles, FABs | Use a huge number, not 50% — 50% goes elliptical on non-square boxes |

**The nesting law (the single most-broken radius rule).** When a rounded element sits inside a rounded container with a gap/padding between them, the corners are **concentric circles**; for them to stay parallel the inner radius must be smaller by exactly the gap:

```
innerRadius = outerRadius − gap        (gap = the padding/offset between the two)
```

Get it wrong (equal radii on both) and, as Cloud Four demonstrate, "the space between elements increases awkwardly in the corners." Implementation — compute, don't hand-tune:

```css
.card {
  --r: 16px;              /* outer radius */
  --pad: 8px;             /* gap between card edge and inner element */
  border-radius: var(--r);
  padding: var(--pad);
}
.card > .inner {
  /* inner = outer − gap, never below 0 (a big gap ⇒ inner should be sharp) */
  border-radius: max(0px, calc(var(--r) - var(--pad)));
}
```

Source: [Cloud Four — The Math Behind Nesting Rounded Corners](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/); corroborated by [CSS-Tricks PSA on nested border-radii](https://css-tricks.com/public-service-announcement-careful-with-your-nested-border-radii/). **CSP/offline: pure CSS + `calc()`, 100% safe. Support: universal.**

**When sharp beats round — decision rules, not taste:**

| Go sharp (0–2px) when… | Because |
|---|---|
| Dense data tables, spreadsheets, code editors | Rounding wastes corner space and reads "toy"; sharp = precise |
| An element is **full-bleed** / touches a container or viewport edge | A radius on a touching edge leaves a visible sliver of background |
| Brand voice is editorial, technical, luxury, "serious tool" | Sharp corners signal precision/restraint |
| Element is **< ~16px** | Radius ≥ ~⅓ of the size deforms it; either near-0 or fully round |
| Corners are nested 3+ deep | Rounding compounds; past a depth the inner radius hits 0 anyway |

**Squircles / continuous corners (honesty flag).** iOS-style "superellipse" corners (a smoother curve than a circular arc) **cannot be made with plain `border-radius`**. Options: an SVG/`clip-path` superellipse path, or the emerging CSS **`corner-shape` / `superellipse()`** (proposed 2024–25) — **very low support as of mid-2026; do not rely on it**; verify caniuse at build and fall back to a circular radius. `clip-path` squircles clip the shadow too, which is often undesirable — test.

### 4.2 The edge — borders, hairlines, rings, inset highlights

The edge is where a surface meets the world; it carries as much "material" signal as the shadow.

| Treatment | CSS | Reads as | Numbers |
|---|---|---|---|
| **Hairline (light bg)** | `border: 1px solid hsl(0 0% 0% / .08–.12)` | Quiet separation | Alpha, not a grey hex — composits over any bg |
| **Hairline (dark bg)** | `border: 1px solid hsl(0 0% 100% / .06–.12)` | Defines shape where shadow fails | The dark-mode workhorse (rule 6) |
| **Non-layout ring** | `box-shadow: 0 0 0 1px <color>` | Divider/focus/emphasis **without** reflow | Doesn't change box size like `border` does |
| **Top inset highlight** | `box-shadow: inset 0 1px 0 hsl(0 0% 100% / .1–.25)` | A light hitting the top edge → "raised, real" | Core of crisp buttons & dark surfaces |
| **Bottom inset shade** | `box-shadow: inset 0 -1px 0 hsl(0 0% 0% / .12)` | Pressed / recessed | Pair with the highlight for a bevel |
| **Focus ring** | `box-shadow: 0 0 0 3px hsl(210 100% 55% / .4)` | Keyboard focus | 3px, ~40% alpha; A5 owns conformance |
| **Gradient border** | `mask-composite` trick (§4.7) | Premium / branded edge | Needs radius-aware masking |

**Sub-pixel hairlines on HiDPI (honesty flag).** A "true 1px" line on a 2× display is really 2 device px. For an even thinner rule use `0.5px` (honoured on HiDPI, ignored/‑rounded on 1× — test) or a scaled pseudo-element. In practice a **1px low-alpha border is the robust default**; don't over-engineer.

### 4.3 Elevation — shadow physics and the ladder

**The physics (Comeau).** One light source, above and slightly to one side ⇒ every shadow shares a direction and a **vertical:horizontal ≈ 2:1** ratio (for UI, horizontal is usually 0). As an element lifts toward the viewer, three things move together: **offset grows, blur grows, and each layer's opacity drops** (the light spreads). A single blurry black rectangle is the tell of a fake shadow.

**Why layered/dual shadows.** Real penumbrae are graded, so stacking a **tight contact shadow** (defines where the object "touches down") with a **soft ambient shadow** (the diffuse cast) reads far more physical than one blur. Tobias Ahlin's technique stacks 3–6 layers with a smooth alpha progression (e.g. sharp: `0.25 → 0.20 → 0.15 → 0.10 → 0.05`); the two-layer contact+ambient model is the pragmatic minimum.

**The elevation ladder (6 levels), anchored to a real, citable scale.** Tailwind's default shadow scale (MIT) is a battle-tested reference; the mapping below is the ladder, its role, and Tailwind's *exact* values you can lift verbatim:

| Level | Role | y-offset / blur / spread pattern | Exact reference value (Tailwind, MIT) |
|---|---|---|---|
| **0** | Flush / inline | — | `none` |
| **1** | Resting card, input, list row | contact `0 1px 2px −1px` + ambient `0 1px 3px` | `0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)` |
| **2** | Raised / hover, dropdown | `0 2px 4px −2px` + `0 4px 6px −1px` | `0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)` |
| **3** | Popover, sticky bar, menu | `0 4px 6px −4px` + `0 10px 15px −3px` | `0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)` |
| **4** | Nav drawer, large popover | `0 8px 10px −6px` + `0 20px 25px −5px` | `0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1)` |
| **5** | Modal / dialog top of stack | single deep, negative spread | `0 25px 50px -12px rgb(0 0 0 / .25)` |

Source of exact values: [Tailwind CSS box-shadow scale](https://v3.tailwindcss.com/docs/box-shadow) (MIT). The **negative spread** on the sharper layer keeps the contact shadow tight instead of ballooning — that's the trick that makes these read crisp. Material 3's dual **key-light + ambient** model expresses the same idea with two explicit layers per level ([MD3 box-shadow values](https://studioncreations.com/blog/material-design-3-box-shadow-css-values/)).

> **WORKED EXAMPLE 1 — Tokenised elevation ladder, tinted, light + dark, CSP-safe.**
> Ships as pure CSS custom properties. `--shadow-hsl` tints the shadow toward the surface (Comeau) instead of pure black; `--shadow-strength` is the one knob dark mode turns up. Copy verbatim.

```css
:root {
  /* Tint the shadow toward the UI base hue, low lightness — NOT #000. */
  --shadow-hsl: 220 40% 12%;      /* h s l channels only, alpha applied per layer */
  --shadow-strength: 1;           /* light-mode baseline multiplier */

  --elevation-0: none;
  --elevation-1:
     0 1px 2px -1px hsl(var(--shadow-hsl) / calc(.12 * var(--shadow-strength))),
     0 1px 3px     hsl(var(--shadow-hsl) / calc(.09 * var(--shadow-strength)));
  --elevation-2:
     0 2px 4px -2px hsl(var(--shadow-hsl) / calc(.11 * var(--shadow-strength))),
     0 4px 6px -1px hsl(var(--shadow-hsl) / calc(.10 * var(--shadow-strength)));
  --elevation-3:
     0 4px 6px -4px  hsl(var(--shadow-hsl) / calc(.11 * var(--shadow-strength))),
     0 10px 15px -3px hsl(var(--shadow-hsl) / calc(.10 * var(--shadow-strength)));
  --elevation-4:
     0 8px 10px -6px  hsl(var(--shadow-hsl) / calc(.11 * var(--shadow-strength))),
     0 20px 25px -5px hsl(var(--shadow-hsl) / calc(.10 * var(--shadow-strength)));
  --elevation-5:
     0 25px 50px -12px hsl(var(--shadow-hsl) / calc(.25 * var(--shadow-strength)));
}

.card    { box-shadow: var(--elevation-1); border-radius: 12px; }
.popover { box-shadow: var(--elevation-3); border-radius: 12px; }
.dialog  { box-shadow: var(--elevation-5); border-radius: 16px; }

/* DARK MODE: shadows alone under-read. Darken + strengthen the shadow AND
   add a top highlight + hairline so the SHAPE is drawn by the edge, not the cast. */
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-hsl: 220 60% 2%;     /* near-black, faint hue */
    --shadow-strength: 2.2;       /* shadows must be ~2× stronger to register */
  }
  .card, .popover, .dialog {
    background: hsl(220 12% 12%);                       /* raised surfaces get lighter (see §4.4) */
    box-shadow:
      var(--elevation-2),
      inset 0 1px 0 hsl(0 0% 100% / .06);              /* top-lit edge */
    border: 1px solid hsl(0 0% 100% / .08);            /* hairline draws the shape */
  }
}
```
**CSP/offline: pure CSS, zero network, safe. Support: `box-shadow` + `hsl()` alpha + `calc()` universal;** `prefers-color-scheme` universal. **Animatable?** Yes — but animate shadow by **cross-fading two pre-rendered layers' `opacity`**, not the `box-shadow` itself (which paints every frame); timing → **B1**.

### 4.4 Dark-mode elevation — the surface-tint model

Dark mode inverts the elevation logic. On a light UI, higher = darker shadow. On a dark UI a cast shadow has almost no contrast against a dark background, so **height is communicated by making the surface lighter as it rises**. Material formalises this as a semi-transparent white (or `colorPrimary`) **overlay** whose alpha grows with elevation — "higher alpha percentages at higher elevations, and therefore lighter surfaces." ([Material dark theme](https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md))

**The canonical Material overlay ladder** (over a `#121212` base surface). *(Honesty flag: these are the widely-published Material Design 2 dark-theme values; the live spec page couldn't be re-fetched at write time — verify against the current spec before treating as exact.)*

| Elevation | White-overlay alpha | Elevation | White-overlay alpha |
|---|---|---|---|
| 0 dp | **0%** | 8 dp | **12%** |
| 1 dp | **5%** | 12 dp | **14%** |
| 2 dp | **7%** | 16 dp | **15%** |
| 3 dp | **8%** | 24 dp | **16%** |
| 4 dp | **9%** | — | — |
| 6 dp | **11%** | — | — |

Implementation in the sandbox — you don't need dp; map your 6-level ladder to rising surface lightness plus the edge treatments:

```css
/* Dark surfaces: base + a lightness step per elevation, drawn by hairline + highlight */
.dark .surface-1 { background: hsl(220 12% 11%); }
.dark .surface-2 { background: hsl(220 12% 13%); }
.dark .surface-3 { background: hsl(220 12% 16%); }   /* higher = lighter */
.dark .surface-1,.dark .surface-2,.dark .surface-3 {
  border: 1px solid hsl(0 0% 100% / .08);
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / .06);    /* top highlight = the lit edge */
}
```
Or derive the steps from one token with `color-mix`: `background: color-mix(in oklab, var(--surface) 94%, white);` for each level up. **The glow substitute:** for *focus/emphasis* in dark mode, a coloured bloom does what a shadow can't — `box-shadow: 0 0 0 1px hsl(210 100% 60% / .5), 0 0 16px hsl(210 100% 60% / .35);`.

### 4.5 Glassmorphism — done properly, and when it fails

**The recipe has four ingredients; drop any one and it stops looking like glass:**

1. **A semi-transparent fill** — `backdrop-filter` frosts *what's behind the element*, so the element's own background must be partly transparent or you see nothing. Light glass ≈ `hsl(0 0% 100% / .08–.14)`; dark glass ≈ `hsl(0 0% 0% / .3–.5)` or a tinted dark.
2. **Blur + saturate** — `backdrop-filter: blur(8–20px) saturate(120–180%)`. Blur frosts; **saturate re-vivifies** the colours the blur greys out. 8–12px = subtle, 16–20px = pronounced, >25px = heavily obscured (NN/g: 25px mild, 100px genuinely hides the backdrop).
3. **A 1px top highlight** — `inset 0 1px 0 hsl(0 0% 100% / .25)` — the specular line along the top edge that sells "glass" over "translucent panel."
4. **A border + cast shadow** — a hairline `1px solid hsl(0 0% 100% / .18)` gives the pane an edge; an outer shadow lifts it.

**Support & CSP verdicts (critical):**
- **`backdrop-filter` — Baseline "newly available" 2024**, BUT **Safari (through v18) still needs the `-webkit-backdrop-filter` prefix** — ship both, prefix first. ([MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter); [mdn/browser-compat-data #25914 — Safari still needs the prefix](https://github.com/mdn/browser-compat-data/issues/25914))
- **Backdrop-root gotcha:** if any ancestor has `opacity < 1`, a `filter`, or a `transform`, it becomes a backdrop root and the blur **won't reach content behind that ancestor**. If glass "does nothing," check the parents.
- **CSP/offline:** pure CSS rendering effect — **no network, no eval, fully CSP-safe.**
- **Performance:** blurring a large area every frame (e.g. behind a scrolling list) is GPU-costly; keep glass panels modestly sized and avoid animating the blur radius (→ E1).

**When glass fails (design a guard for each):**

| Failure | Trigger | Guard |
|---|---|---|
| Text unreadable | Busy/photographic backdrop, low fill opacity | Blur harder **or** scrim behind text; enforce **4.5:1** body / **3:1** UI |
| No effect in Safari | Missing `-webkit-` prefix | Ship prefixed + unprefixed |
| No effect anywhere | Opaque fill, or ancestor is a backdrop root | Make fill translucent; remove ancestor `opacity/filter/transform` |
| Excludes low-vision users | Transparency itself is the barrier | Honour `prefers-reduced-transparency` → opaque |
| Looks flat/plasticky | Missing highlight + border | Add the inset top highlight and a hairline |

Sources: [NN/g — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/), [Axess Lab — Glassmorphism meets accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/), [Chrome — prefers-reduced-transparency](https://developer.chrome.com/blog/css-prefers-reduced-transparency).

> **WORKED EXAMPLE 2 — Production glass, prefixed, gated, accessible, light + dark.** Copy verbatim.

```css
.glass {
  background: hsl(0 0% 100% / .10);                       /* 1. translucent fill (REQUIRED) */
  -webkit-backdrop-filter: blur(12px) saturate(160%);     /* 2. Safari needs the prefix */
          backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid hsl(0 0% 100% / .18);                 /* 4. edge */
  box-shadow:
     inset 0 1px 0 hsl(0 0% 100% / .25),                  /* 3. top highlight */
     0 8px 32px hsl(220 40% 10% / .25);                   /* cast shadow */
  border-radius: 16px;
}
@media (prefers-color-scheme: dark) {
  .glass { background: hsl(220 30% 8% / .45);
           border-color: hsl(0 0% 100% / .12);
           box-shadow: inset 0 1px 0 hsl(0 0% 100% / .10), 0 8px 32px hsl(0 0% 0% / .5); }
}
/* FALLBACK: no backdrop-filter support ⇒ go near-opaque so text stays legible. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: hsl(220 22% 18% / .92); }
}
/* ACCESSIBILITY: user asked for less transparency ⇒ opaque, no blur. */
@media (prefers-reduced-transparency: reduce) {
  .glass { background: hsl(220 22% 18% / .96);
           -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```
**CSP/offline: safe. Support:** `backdrop-filter` Baseline 2024 (Safari prefix); `@supports` universal; `prefers-reduced-transparency` **Chrome/Edge 118+, Firefox behind flag, Safari not supported** as of the source — **verify current** ([Chrome blog](https://developer.chrome.com/blog/css-prefers-reduced-transparency)).

### 4.6 Gradients — linear, radial, conic, mesh

| Type | Syntax spine | Best for | Support |
|---|---|---|---|
| **Linear** | `linear-gradient(160deg, a, b)` | Backgrounds, sheens, subtle fills | Universal |
| **Radial** | `radial-gradient(circle at 30% 20%, a, transparent 60%)` | Spotlights, glows, blobs | Universal |
| **Conic** | `conic-gradient(from 90deg at 50% 50%, a, b, a)` | Angular sweeps, pie/rings, gradient borders, beams | **Baseline widely available** ([caniuse](https://caniuse.com/css-conic-gradients)) |
| **Mesh** | *layered* radial gradients w/ transparent stops | Rich multi-colour "aurora" backgrounds | Universal (it's just stacked radials) |

**Colour-space interpolation (the quality lever).** `linear-gradient(in oklch, hotpink, cyan)` avoids the grey/muddy midpoint that plain sRGB produces between saturated hues. Baseline ~2023–24; gate it:

```css
.hero { background: linear-gradient(160deg, #ff5da2, #23d5ff); }         /* fallback */
@supports (background: linear-gradient(in oklch, red, blue)) {
  .hero { background: linear-gradient(160deg in oklch, #ff5da2, #23d5ff); }
}
```

**Mesh gradients without a library** — stack radial gradients with `transparent` outer stops so they blend; each is a "blob" you place with `at`:

```css
.mesh {
  background-color: #0e1230;                        /* base fills gaps */
  background-image:
    radial-gradient(40% 50% at 15% 20%, hsl(280 90% 60% / .55), transparent 70%),
    radial-gradient(45% 55% at 85% 15%, hsl(190 90% 55% / .50), transparent 70%),
    radial-gradient(50% 60% at 70% 85%, hsl(330 90% 60% / .45), transparent 70%),
    radial-gradient(45% 50% at 20% 90%, hsl(220 90% 55% / .40), transparent 70%);
}
```
Source pattern: [CSS-Tricks — Radial Gradient Recipes](https://css-tricks.com/radial-gradient-recipes/). **True SVG `<meshgradient>` is not supported in any browser — don't use it;** layered radials (optionally softened with an SVG blur) are the real technique. **CSP/offline: all gradients are pure CSS, safe.** Wide, smooth gradients **band** — see §4.7.

### 4.7 Noise, grain & dithering — killing banding

**Why banding happens.** An 8-bit channel has 256 steps. A smooth gradient stretched over hundreds of pixels forces visible flat "steps" (Mach banding). Three fixes, best first:

1. **A grain overlay dithers the steps** — the strongest, most general fix. An SVG `feTurbulence` noise layer at **2–5% opacity** breaks up the banding invisibly. (Also the film-grain aesthetic at **8–15%**.)
2. **Interpolate in `oklch`/`oklab`** — reduces (doesn't eliminate) banding and fixes muddy midpoints (§4.6).
3. **More colour stops** — adding intermediate stops shortens each band; a blunt fallback.

**feTurbulence parameters (the numbers):**

| Attr | Value | Effect |
|---|---|---|
| `type` | `fractalNoise` | Cloudy grain (use this). `turbulence` = harsher, veined |
| `baseFrequency` | **0.6–0.9** | Higher = finer grain. ~0.2–0.4 = large soft blobs |
| `numOctaves` | **2–4** | More = richer detail; >4 rarely worth the cost |
| `stitchTiles` | `stitch` | Seamless tiling |
| `color-interpolation-filters` | **`sRGB`** | **Required** for consistent cross-browser output (default `linearRGB` differs) ([Codrops](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/)) |

**CSP verdict (important, easy to get wrong):**
- **Inline `<svg>` in the DOM (or `filter: url(#id)` referencing an inline filter) — fully CSP-safe.** It's markup, not a fetched resource.
- **A `data:` URI SVG in `background-image: url("data:image/svg+xml,…")` is governed by CSP `img-src`.** Under a strict `default-src 'self'` with no `img-src data:`, it is **blocked**. The popular "grainy-gradients" data-URI recipe therefore needs `img-src data:` in the policy — **prefer the inline-SVG form in this sandbox.**

> **WORKED EXAMPLE 3 — Anti-banding grain overlay, inline-SVG, CSP-safe.** Kills banding on a wide gradient at 4% opacity. Copy verbatim.

```html
<div class="hero">
  <!-- Decorative, inline in the DOM (NOT a data: URI ⇒ no img-src needed). -->
  <svg class="grain" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <filter id="grain" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.8"
                    numOctaves="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>     <!-- monochrome grain -->
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
  <!-- …hero content… -->
</div>
```
```css
.hero {
  position: relative; isolation: isolate; overflow: hidden;
  background: linear-gradient(160deg, #2b1c55, #0e1230);   /* the banding-prone gradient */
}
.hero > .grain {
  position: absolute; inset: 0; width: 100%; height: 100%;
  opacity: .04;                 /* 2–5% = invisible but kills banding; 8–15% = visible film grain */
  mix-blend-mode: overlay;      /* soft-light also works; plain overlay is fine over dark */
  pointer-events: none; z-index: -1;
}
@media (prefers-reduced-transparency: reduce) { .hero > .grain { opacity: 0; } }
```
**CSP/offline: safe (inline SVG). Support:** `feTurbulence` universal; `mix-blend-mode` universal (minor per-engine rendering differences). **Cost:** the filter rasterises once — **do not animate `baseFrequency`** (re-renders every frame). Grain looks slightly different per browser — expected, not a bug.

### 4.8 Animated borders, beams & glow — as material

These are *materials that happen to move*. A4 builds the static ring/glow; **B1 owns the motion timing** (a rotating beam's `4s linear infinite` is a B1 decision — shown here only to make the example runnable).

**Glow (static).** A coloured, offset-free, large-blur shadow: `box-shadow: 0 0 20px hsl(210 100% 60% / .5);`. Neon = stack several (`0 0 4px`, `0 0 12px`, `0 0 28px`). Focus bloom in dark mode: `0 0 0 1px accent, 0 0 16px accent/.35`.

**Beam / conic sweep border.** Combine three techniques from this track: `@property` (animatable angle), `conic-gradient` (the moving light), and `mask-composite` (show only the ring).

> **WORKED EXAMPLE 4 — Animated conic beam border, gated, reduced-motion-aware.**

```css
@property --beam { syntax: "<angle>"; inherits: false; initial-value: 0deg; }

.beam { position: relative; border-radius: 14px; background: #0e1230; }
.beam::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: conic-gradient(from var(--beam),
              transparent 0turn, hsl(190 90% 70%) .12turn, transparent .25turn);
  /* Show only the border ring (padding-box masked out): */
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;        /* Safari keyword */
          mask-composite: exclude;    /* standard */
  animation: beam-spin 4s linear infinite;   /* ← duration/easing = B1's call */
}
@keyframes beam-spin { to { --beam: 360deg; } }

/* Fallback: no @property ⇒ a static gradient ring (no rotation). */
@supports not (background: conic-gradient(from var(--beam), red, blue)) {
  .beam::before { background: linear-gradient(135deg, hsl(190 90% 70%), transparent); }
}
@media (prefers-reduced-motion: reduce) { .beam::before { animation: none; } }
```
**CSP/offline: safe (pure CSS). Support:** `@property` Baseline **9 Jul 2024** (unsupported browsers get the static fallback); `conic-gradient` widely available; `mask-composite` — standard `exclude` broadly supported, **Safari historically needs `-webkit-mask-composite: xor`** (ship both). **Animatable?** That's the point — but the *only* animatable property here is the registered `--beam` angle; **timing → B1**.

### 4.7-bis Gradient borders with radius (the mask-composite trick)

`border-image` **ignores `border-radius`**, so a rounded gradient border needs masking: paint the gradient on `border-box`, then mask out the interior so only the ring remains.

```css
.gradient-border {
  border-radius: 16px;
  border: 2px solid transparent;                         /* thickness = ring width */
  background:
    linear-gradient(#0e1230, #0e1230) padding-box,       /* fill */
    linear-gradient(135deg, #6ee7ff, #a855f7) border-box;/* the ring gradient */
  -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
}
```
Source: [Temani Afif — Border with gradient and radius](https://dev.to/afif/border-with-gradient-and-radius-387f). **CSP/offline: safe. Support:** works Chrome/Firefox; **Safari needs the `-webkit-` prefix + `xor` keyword** — always ship both keyword forms.

### 4.9 Texture & pattern from pure CSS

Repeating gradients build crisp geometric texture with zero assets — **all CSP-safe, cheap, and offline** (A4 owns construction; sourcing *packs* → H1):

| Pattern | Recipe |
|---|---|
| **Stripes** | `repeating-linear-gradient(45deg, #0000 0 10px, hsl(0 0% 100% / .04) 10px 20px)` |
| **Dots (polka)** | `radial-gradient(hsl(0 0% 100% / .08) 1.5px, transparent 1.6px); background-size: 16px 16px;` |
| **Grid / graph** | two `repeating-linear-gradient`s (one 0deg, one 90deg) of thin low-alpha lines |
| **Checkerboard** | `repeating-conic-gradient(#0000 0% 25%, hsl(0 0% 100% / .05) 0% 50%); background-size: 24px 24px;` |
| **Hairline rule** | `linear-gradient(hsl(0 0% 100% / .08), transparent 1px)` |

Keep pattern alpha **low (2–8%)** so it reads as texture, not content, and never let it drop text contrast (→ A5). **Support: universal** (`repeating-conic-gradient` rides conic support). **Cost:** cheap unless the tile is 1px on a huge area — use a sensible `background-size`.

### 4.10 Deriving a material family — color-mix & relative colour

Keep an entire material family coherent by *deriving* from one base rather than hand-picking:

```css
--surface: hsl(220 16% 96%);
--surface-sunken:  color-mix(in oklab, var(--surface) 94%, black);  /* subtle darken */
--surface-raised:  color-mix(in oklab, var(--surface) 94%, white);  /* subtle lighten */
--shadow-color:    color-mix(in oklab, var(--surface) 30%, hsl(220 40% 8%));
--accent-glow:     color-mix(in srgb, var(--accent) 30%, transparent);  /* glow alpha */
```
`color-mix()` — **Baseline May 2023**, CSP-safe ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)). **Relative colour syntax** — `hsl(from var(--c) h s calc(l - 8%))` — is newer (~2024, Baseline forming); **`@supports`-gate and fall back to `color-mix` or an explicit value.** *(Which hues/ramp values go in is A1's call; A4 owns the derivation mechanics.)*

---

## 5. Options catalogue — material techniques

Columns: **what · when · when NOT · licence · where/how · cost & single-file-CSP feasibility · pitfalls.** "CSP-safe" = survives a strict CSP with **no** `unsafe-eval`, no network, and only inlined-but-hashed styles (matching the sandbox). Nearly every technique here is **native web platform → no licence, no bytes, offline by nature**; the exceptions (token libraries/generators) carry an explicit licence.

| Technique | What | When | When NOT | Licence | Where / how | Cost & CSP-offline feasibility | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Layered box-shadow elevation** | 2–5 stacked shadows = physical depth | Cards, popovers, modals, hover-lift | Dark mode as the *sole* cue (§4.4); flat/brutalist looks | Web platform | Native; values §4.3 | **Best.** Zero bytes, CSP-safe. Paint cost grows with layers/area | Single black blur looks fake; animate via opacity cross-fade, not `box-shadow` |
| **Inset shadow / bevel & highlight** | `inset` top highlight + bottom shade | Crisp buttons, dark surfaces, pressed states | Overuse → skeuomorphic | Web platform | Native; §4.2 | **Best.** CSP-safe, tiny | Too-strong inset reads "disabled/recessed" |
| **Non-layout ring** | `box-shadow: 0 0 0 1px` | Dividers, focus rings, hairlines w/o reflow | Where you actually need layout thickness | Web platform | Native; §4.2 | **Best.** CSP-safe | Not part of box size — can overlap siblings |
| **Backdrop-filter glass** | Blur+saturate the backdrop | Overlays on rich backgrounds, chrome, HUDs | Busy backdrop + critical text; low-end perf | Web platform | Native; §4.5 | CSP-safe. **GPU cost on large areas.** Safari needs `-webkit-` | Backdrop-root ancestors kill it; legibility; prefix |
| **Linear/radial gradient** | Colour transitions | Backgrounds, sheens, glows, spotlights | When banding will show (add grain) | Web platform | Native; §4.6 | **Best.** CSP-safe | Muddy midpoint (use oklch); banding on wide spans |
| **Conic gradient** | Angular sweep | Rings, pies, beams, gradient borders | Fine text backgrounds | Web platform | Native; §4.6 | **Best.** CSP-safe; Baseline | Hard edges alias slightly; add tiny blur if needed |
| **Mesh (layered radials)** | Several transparent-stop radials | "Aurora" hero backgrounds | Where contrast over it must be exact | Web platform | Native; §4.6 | **Best.** CSP-safe. True SVG mesh unsupported | Banding (grain it); can muddy if blobs overlap |
| **`@property` animated gradient** | Registered `<angle>` ⇒ animatable | Beams, shimmer, animated borders | When B1 says no motion; no fallback shipped | Web platform | Native; §4.8 | CSP-safe. Baseline **Jul 2024** | Plain custom props can't animate; needs `@supports` + fallback; **motion=B1** |
| **SVG feTurbulence grain** | Procedural noise overlay | Kill banding (2–5%), film grain (8–15%) | Behind small body text (adds visual noise) | Web platform | Inline `<svg>`; §4.7 | **CSP-safe inline.** `data:` URI form needs `img-src data:` | Don't animate baseFrequency; per-browser look; set `color-interpolation-filters="sRGB"` |
| **mask-composite gradient border** | Radius-aware gradient ring | Branded/premium edges w/ radius | When Safari must work w/o prefix testing | Web platform | Native; §4.7-bis | **CSP-safe.** Pure CSS | Safari `-webkit-…: xor`; masks content if not on a pseudo-element |
| **Repeating-gradient patterns** | Stripes/dots/grid/checker | Texture, zones, graph paper | As anything behind readable text at high alpha | Web platform | Native; §4.9 | **Best.** CSP-safe, cheap | 1px tiles on huge areas cost paint; keep alpha low |
| **Glow (coloured blur shadow)** | Offset-free large-blur shadow | Focus/emphasis (esp. dark mode), neon | Everywhere (loses meaning) | Web platform | Native; §4.8 | **Best.** CSP-safe | Big blur = paint cost; can blur into neighbours |
| **Neumorphism (dual inset+outset)** | Same-bg light+dark shadow pair | Niche "soft UI" hero moments | **Almost always** — fails contrast/affordance | Web platform | Native | CSP-safe **but an a11y liability → A5** | Notoriously low contrast & ambiguous; add borders or avoid |
| **color-mix / relative colour** | Derive tints/shadows/glows | Coherent material families from 1 token | — | Web platform | Native; §4.10 | **Best.** CSP-safe. `color-mix` Baseline 2023 | Relative-colour syntax newer — gate it |
| **Open Props (tokens)** | Ready shadow/gradient/easing tokens | Want vetted values, self-hosted | Byte-minimal one-offs | **MIT** *(verify at source)* | [open-props.style](https://open-props.style) · [github](https://github.com/argyleink/open-props) | Plain CSS vars, inlinable, **CSP-safe** | It's a whole set — cherry-pick the vars you use |
| **Tailwind shadow scale (values)** | Battle-tested elevation numbers | Anchor your ladder (§4.3) | — | **MIT** | [tailwind box-shadow](https://v3.tailwindcss.com/docs/box-shadow) | Copy the values; **CSP-safe** | Pure black — tint them per rule 5 |
| **Shadow Palette Generator** | Emits layered-shadow CSS | Author a bespoke ladder fast | — | Free tool; **output CSS is yours** | [joshwcomeau.com](https://www.joshwcomeau.com/css/introducing-shadow-palette-generator/) | Generates plain CSS ⇒ **CSP-safe** | It's a generator, not a runtime dep |

*(Consolidated CSS-vs-SVG-vs-Canvas feasibility across all tracks → **H2**.)*

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Fake-looking shadow** | One soft black rectangle; no contact edge | Dual-layer (tight contact + soft ambient); tint off-black; match one light direction (§4.3) |
| **Muddy shadow colour** | Grey, lifeless drop under a coloured card | Tint `--shadow-hsl` toward the surface hue at low lightness (rule 5) |
| **Shadows invisible in dark mode** | Elevated cards look flat on dark bg | Surface-tint (higher=lighter) + hairline + top highlight + optional glow; raise opacity/lower lightness if keeping cast (§4.4) |
| **Awkward nested corners** | Inner element's corner gap "pinches" | `inner = outer − gap`; clamp `max(0px, …)` (§4.1) |
| **Radius eats a small element** | 12px radius on a 16px chip = blob | Clamp radius to ≤ ⅓ size, or go fully round/sharp (§4.1) |
| **Gradient banding** | Visible steps across a wide/subtle gradient | feTurbulence grain 2–5% (inline SVG); interpolate `in oklch`; add stops (§4.7) |
| **Muddy gradient midpoint** | Grey dead-zone between two vivid hues | `linear-gradient(in oklch, …)` with `@supports` fallback (§4.6) |
| **Glass unreadable** | Text over frosted busy backdrop, low contrast | Blur harder or scrim behind text; enforce 4.5:1/3:1; respect reduced-transparency (§4.5) |
| **Glass does nothing in Safari** | Effect works in Chrome, not Safari | Add `-webkit-backdrop-filter` (Safari ≤18 needs it) |
| **Glass does nothing anywhere** | No frost at all | Fill isn't translucent, **or** an ancestor (`opacity/filter/transform`) is a backdrop root (§4.5) |
| **Gradient/beam border broken in Safari** | Ring missing or full-fill | Ship `-webkit-mask-composite: xor` **and** `mask-composite: exclude` (§4.7-bis/4.8) |
| **Animated gradient won't animate** | Angle jumps or is static | Register the angle via `@property`; `@supports` gate + static fallback (§4.8) |
| **Noise blocked by CSP** | Console `img-src` violation; no grain | Use **inline `<svg>`**, not a `data:` URI background; or add `img-src data:` (§4.7) |
| **feTurbulence janky** | FPS drop when grain animates | Never animate `baseFrequency`; rasterise once; small stitched tile (§4.7) |
| **Neumorphism unusable** | Buttons indistinguishable from bg; low contrast | Add real borders/contrast, or drop it (→ A5) |
| **Backdrop/blur/glow tanks perf** | Jank on scroll over large blurred/glow areas | Shrink the effect area; don't animate blur radius (→ E1) |
| **Recent-CSS breaks a browser** | Blank/mis-rendered material in FF/Safari | `@supports`-gate every recent feature; ship an opaque/static fallback (rule 15) |

---

## 7. Pre-flight checklist (run before shipping any surface)

- [ ] Radius comes from the **token ladder** and matches component role; **sharp** chosen deliberately for data/tech/full-bleed (§4.1).
- [ ] Every **nested** rounded element uses `inner = outer − gap`, clamped `max(0px, …)` (§4.1).
- [ ] Elevation uses the **6-level ladder**; shadows are **dual-layer + tinted**, one light direction, per-layer alpha 0.06–0.14 (§4.3).
- [ ] **Dark mode** draws depth with **surface-tint + hairline + top highlight (+ glow)**, not cast shadows alone (§4.4, §4.6).
- [ ] Glass has **translucent fill + blur 8–20px + saturate 120–180% + 1px highlight + border**, ships **`-webkit-` prefix**, an **opaque `@supports` fallback**, and honours **`prefers-reduced-transparency`** (§4.5).
- [ ] Text over glass/gradient/pattern meets **4.5:1 / 3:1** (verify → A5) (§4.5).
- [ ] Wide/subtle gradients carry an **inline-SVG grain overlay 2–5%** and/or **oklch interpolation**; no visible banding (§4.6–4.7).
- [ ] Noise ships as **inline `<svg>`** (CSP), not a `data:` URI; `color-interpolation-filters="sRGB"` set; not animated (§4.7).
- [ ] Animated borders/beams/glow use **`@property` + conic + mask**, `@supports`-gated, with a **static fallback** and `prefers-reduced-motion` off-switch; **timing deferred to B1** (§4.8).
- [ ] Gradient borders use **`mask-composite: exclude` + `-webkit-…: xor`**, not `border-image` (§4.7-bis).
- [ ] Material family derived via **`color-mix`** (Baseline 2023); relative-colour syntax `@supports`-gated (§4.10).
- [ ] **Every recent-CSS feature** (`backdrop-filter`, `@property`, `mask-composite`, `oklch` gradients, `color-mix`, `corner-shape`) is `@supports`/prefix-gated with a fallback that **keeps legibility and layout** (rule 15).
- [ ] No **neumorphism** without a contrast guard; no material drops text below AA (→ A5).
- [ ] All materials are **pure CSS / inline SVG** — no network, no eval; verified against the strict-CSP sandbox (whole track).

---

## 8. Open questions / unverified

- **Material dark-theme overlay percentages** (§4.4: 5/7/8/9/11/12/14/15/16%) are the widely-published **Material Design 2** values; the live spec page failed to fetch at write time — **re-verify** against the current spec if exact fidelity matters.
- **`prefers-reduced-transparency` support** is moving: source shows **Chrome/Edge 118+, Firefox behind a flag, Safari unsupported** — **re-check caniuse at build**.
- **`backdrop-filter` in Safari** still needed the **`-webkit-` prefix through Safari 18** per an open browser-compat-data issue — verify whether a later Safari dropped the requirement.
- **`mask-composite` keyword state** (`exclude` vs Safari's `-webkit-…: xor`) — ship both; verify whether current Safari accepts the standard keyword unprefixed.
- **`oklch`/`oklab` gradient interpolation** and **relative colour syntax** exact Baseline dates — treat as ~2023–24 and **`@supports`-gate**; confirm at build.
- **`corner-shape` / `superellipse()`** (true squircles) — **very low support mid-2026**; do not rely on it; use SVG/`clip-path` and expect it to clip the shadow.
- **feTurbulence cross-browser rendering** differs subtly (grain texture varies by engine) — expected; not a defect.
- **Per-technique GPU/paint cost** (blur area, layered-shadow repaint, large glow) is device-dependent and owned by **E1** — this track flags relative cost only.
- **Open Props licence** stated as **MIT** — highly likely correct, but confirm at the source repo before relying on it.

---

## 9. Sources

**Primary / foundational:**
- [Josh W. Comeau — Designing Beautiful Shadows in CSS](https://www.joshwcomeau.com/css/designing-shadows/) — light direction, 2:1 ratio, tinted & layered shadows, elevation scaling.
- [Tobias Ahlin — Smoother & sharper shadows with layered box-shadows](https://tobiasahlin.com/blog/layered-smooth-box-shadows/) — multi-layer alpha progressions.
- [Cloud Four — The Math Behind Nesting Rounded Corners](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/) — `inner = outer − gap`.
- [CSS-Tricks — Careful With Your Nested Border-Radii (PSA)](https://css-tricks.com/public-service-announcement-careful-with-your-nested-border-radii/) — corroboration.
- [MDN — `backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter) — support, backdrop-root, `@supports`.
- [MDN — `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) — Baseline May 2023, colour spaces, tinting.
- [web.dev — `@property` now Baseline](https://web.dev/blog/at-property-baseline) — Baseline 9 Jul 2024, animated gradients, graceful fallback.
- [CSS-Tricks — Grainy Gradients](https://css-tricks.com/grainy-gradients/) — feTurbulence anti-banding recipe.
- [Codrops — SVG Filter Effects: Texture with feTurbulence](https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/) — baseFrequency/octaves, `color-interpolation-filters="sRGB"`.
- [Nielsen Norman Group — Glassmorphism](https://www.nngroup.com/articles/glassmorphism/) — when it works/fails, blur amounts, legibility.
- [Material — Dark theme (elevation overlays)](https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md) — surface-tint model.
- [Tailwind CSS — Box Shadow scale](https://v3.tailwindcss.com/docs/box-shadow) — exact, citable elevation values (MIT).

**Reference / secondary:**
- [Ryan Mulligan — CSS @property and the new style](https://ryanmulligan.dev/blog/css-property-new-style/) — animated conic border, registration syntax.
- [Temani Afif — Border with gradient and radius](https://dev.to/afif/border-with-gradient-and-radius-387f) — `mask-composite: exclude` technique.
- [CSS-Tricks — Radial Gradient Recipes](https://css-tricks.com/radial-gradient-recipes/) — layered-radial mesh.
- [Axess Lab — Glassmorphism meets accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) — 4.5:1/3:1, scrims, blur limits.
- [Chrome for Developers — prefers-reduced-transparency](https://developer.chrome.com/blog/css-prefers-reduced-transparency) — support, additive strategy.
- [cssShowcase — Shadows in dark mode](https://www.cssshowcase.com/articles/color/shadows-in-dark-mode-adjusting-for-dark-backgrounds) — dark-mode shadow opacity/lightness numbers.
- [Frontend Masters — Grainy Gradients](https://frontendmasters.com/blog/grainy-gradients/) — octaves vs cost, displacement.
- [Studio N Creations — Material Design 3 box-shadow CSS values](https://studioncreations.com/blog/material-design-3-box-shadow-css-values/) — MD3 dual key/ambient values *(alpha components; verify)*.
- [caniuse — conic gradients](https://caniuse.com/css-conic-gradients) · [caniuse — mask-composite](https://caniuse.com/mdn-css_properties_mask-composite) · [mdn/browser-compat-data #25914 — Safari still needs `-webkit-backdrop-filter`](https://github.com/mdn/browser-compat-data/issues/25914).

**Licences (verified from source where noted):**
- [Tailwind CSS — MIT](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE).
- [Open Props — MIT](https://github.com/argyleink/open-props) *(stated MIT; confirm at repo)*.
- [Josh Comeau Shadow Palette Generator](https://www.joshwcomeau.com/css/introducing-shadow-palette-generator/) — free generator; emitted CSS is yours.
- All other techniques are **native web platform (CSS/SVG) — no licence, offline by nature, CSP-safe** except where a `data:` URI (`img-src`) or prefix caveat is flagged inline.
