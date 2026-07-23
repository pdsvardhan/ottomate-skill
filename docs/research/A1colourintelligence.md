# A1 — Colour intelligence

*Design-intelligence reference. Track A1 of the registry research map. Written to be read by the design agent before it chooses, derives, or applies a single colour, and by a human owner auditing that work. Colour is treated here as a **system**, not a swatch.*

---

## 1. Scope line

This track owns **colour as a system**: which colour space the agent reasons in and why perceptual spaces matter; how tonal ramps are built; how a palette is **derived from content** (extracting a hue from an image and conditioning it for a given background with guaranteed contrast); how **semantic** colour (success/warn/danger/info) is kept separate from **brand accent**; **colour budgets** (how much of a screen may carry the accent and which surfaces earn it); **neutral construction** (hue-tinted greys); **dark-surface behaviour** (saturation shifts, halation/glow, why pure black fails, elevation via lightness); **state colour** (hover/active deltas that survive *both* themes); and **colour-blindness-safe categorical sets**. It also owns the CSS-level feasibility of all of the above in a strict-CSP, single-file, offline delivery target.

## 2. Boundary (what this track does **not** cover)

- **Contrast *measurement* and *conformance*** — WCAG 2.x ratio math (4.5:1 / 3:1), APCA Lc thresholds, the pass/fail verdict → **A5 Accessibility**. A1 *targets* contrast while choosing lightness and *references* thresholds as design inputs; A5 owns the conformance model and the tooling that certifies it. Every "guaranteed contrast" claim here means "engineered to clear A5's bar, then verified by A5."
- **Gradients, mesh, glass, glow *as material*** — their construction, blur, layering, depth → **A4 Shape, depth & material**. A1 says *what colour* a surface is and how colour behaves on dark; A4 builds the material that colour sits in. (Halation is discussed here because it is a *colour-on-dark* perception effect, but the fix for a glowing material is A4's.)
- **The colour of a specific brand mark / logo** — the fixed identity colour of a client's mark → **D2 Brand expression**. A1 takes a brand hue as *input* and derives a system from it; it does not choose the mark's colour.
- **How colour *tokens are named, structured and shared* across components** (token architecture, theming plumbing, `--color-*` naming) → **C2 Tokens & theming**. A1 defines the *values and the rules that generate them*; C2 defines how they are packaged and consumed.
- **The consolidated single-file/no-network feasibility matrix across all techniques** → **H2 Feasibility**. A1 gives the colour-specific CSP/offline verdicts inline (which CSS colour features need fallbacks, whether image extraction can run in the sandbox); H2 is the master matrix.
- **Motion of colour** (animating a colour transition, theme cross-fade timing) → **B1 Motion**. A1 defines the two endpoint colours and the *delta*; B1 animates between them.

---

## 3. Executive rules (apply these before reading the body)

1. **Reason in a perceptual space; ship sRGB hex as the floor.** Do all ramp, state, mixing and derivation math in **OKLCH** (perceptually uniform: equal lightness steps *look* equal, and changing hue does not change perceived lightness — unlike HSL/RGB). Then **precompute sRGB hex tokens as the baseline** so the file renders everywhere, and layer live `oklch()` / `color-mix()` / relative-colour on top behind `@supports`. ([Ottosson, Oklab](https://bottosson.github.io/posts/oklab/), [Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl))
2. **One accent hue family. Semantic colour is a *separate* system.** The brand accent and the four status colours (success/warn/danger/info) are different axes. Never derive danger-red or success-green from the accent, and never let the accent borrow a semantic hue's meaning. If the derived accent *lands on* a semantic hue (e.g. brand red vs danger red), nudge one apart (§4.6).
3. **Spend the accent like money — the 10 % budget.** On any given screen, saturated accent should cover **≈10 % of pixels** (the 60/30/10 split: ~60 % dominant neutral, ~30 % secondary surface/text, ~10 % accent). The accent is earned by a *ranked* list of surfaces (§4.5); everything else is neutral. This rule is the direct cure for the two-sided failure: *accent on every surface → cheap*; *accent nowhere → dead*.
4. **Neutrals are hue-tinted, never pure grey — but on a chroma leash.** Tint the greyscale toward one hue (usually the brand hue or its complement) with **OKLCH chroma ≈ 0.004–0.02**. Below that it reads as flat "computer grey"; above ~**0.03** the greys visibly turn blue/beige and stop reading as neutral (§4.3).
5. **Build ramps by holding H, moving L on a perceptual curve, and *tapering* C at the ends.** A ramp is one hue at many lightnesses. Vary **L** across the ramp; keep **H** fixed (±2° at most); let **C** peak in the mid-tones and fall toward both white and black (extreme lightness cannot hold chroma). Give the L ladder explicit numbers (§4.2).
6. **Never pure black in dark mode.** Base dark surface at **OKLCH L ≈ 0.18** (Material's `#121212`), not `#000`. Pure black kills elevation (shadows vanish), maximises halation, and increases eye-strain against light text. ([Material dark theme](https://m3.material.io/blog/android-dark-theme-tutorial))
7. **Express elevation on dark as +lightness, not shadow.** Each elevation step ≈ **+0.03 L** (or a white overlay rising **0 % → 16 %** from resting surface to top layer). Material's verified overlay ladder: 0/1/2/3/4/6/8/12/16/24 dp → **0/5/7/8/9/11/12/14/15/16 %** (§4.7).
8. **Desaturate and dim on dark to stop halation and vibration.** On a dark surface, **reduce accent/semantic chroma by ~10–30 %** and **avoid pure-white text** (use L ≈ 0.90, e.g. `#E6E6E6`, not `#FFF`). High-chroma or pure-white marks on near-black bloom for astigmatic/low-vision users and "vibrate" against saturated neighbours (§4.7).
9. **State deltas are direction-aware lightness moves, not a second hardcoded hex.** Encode hover/press as an **OKLCH ΔL** or a `color-mix()` toward the foreground, so the *same rule* darkens in light mode and lightens in dark mode. Hover ≈ **ΔL ±0.04–0.06** (mix ~8 % toward text); press ≈ **ΔL ±0.08–0.10** (mix ~12 %). A single "darken 8 %" rule silently breaks in dark mode (§4.8).
10. **Guarantee contrast *at derivation time*, then verify with A5.** When you derive or condition a colour, **set L to the theme's accent target and clamp C**, so the result clears the intended threshold before it ships. Never emit a raw extracted colour onto a surface. OKLCH L only *correlates* with WCAG luminance — target with it, confirm with A5's math (§4.4, honesty flag in §8).
11. **Derive from content by *role*, not by "dominant".** The single most common pixel in an image is usually a dull background; the *accent* you want is the **vibrant** swatch. Extract with a quantiser (median-cut/MMCQ or k-means), pick the swatch by role (Vibrant for accent, Muted for surface, DarkVibrant for dark-theme accent), then **normalise L and clamp C** — do not paint surfaces with the raw pick (§4.4).
12. **Categorical/data colour comes from a *verified* CVD-safe set — never hand-picked.** Use **Okabe–Ito** (8 colours) or **Paul Tol** (bright 7 / muted 10). Cap at **≤8 categories** (5–8 is already hard; >8 is effectively impossible to distinguish) and **pair colour with shape/label/pattern** — colour is never the sole encoding (§4.9). ([Okabe–Ito](https://thenode.biologists.com/data-visualization-with-flying-colors/research/), [Tol, SRON](https://sronpersonalpages.nl/~pault/data/colourschemes.pdf))
13. **Gamut-map derived colours into the target gamut; don't trust the browser to.** Not every OKLCH triplet is displayable; Chrome/Safari currently **clip** (fast, inaccurate) rather than gamut-map. Compute the in-gamut sRGB (and P3-where-available) value at authoring time with a library, or bake a hex fallback. ([Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), [colorjs.io](https://github.com/color-js/color.js))
14. **Every token exists in both themes, and the whole system is reviewed in light *and* dark before shipping.** A palette that was only ever seen in one theme is a half-built palette. Dark is not "invert the hexes" — L inverts, but chroma and the neutral tint are re-tuned (§4.7).

---

## 4. Body

### 4.1 Why a perceptual space — and which one

The agent must pick a *reasoning* space (where it does math) distinct from the *delivery* format (what it writes to CSS). The delivery floor is always sRGB hex; the reasoning space should be perceptual.

**The core defect of the "obvious" spaces:**

| Space | Model | Fatal flaw for systematic colour | Verdict |
|---|---|---|---|
| **sRGB / hex** | Device RGB primaries | Not perceptual at all; `#808080` is not "half" of `#FFFFFF` perceptually; no meaningful "add 10 % lightness" | Delivery floor only |
| **HSL / HSV** | Cylinder over sRGB | **Lightness lies.** At equal S/L, yellow/cyan/magenta look far *lighter* than blue/red; rotating hue silently changes perceived lightness and can break text contrast | Never for ramp/state math |
| **CIELAB / LCH** | Perceptual, luminance-anchored | Better, but has a well-known **blue hue shift**: changing L or C of blues (hue ~270–330) drifts them toward purple | Usable; OKLCH is the fix |
| **OKLab / OKLCH** | Ottosson 2020, optimised on CAM16 + CIEDE2000 | Perceptually uniform L, *and* fixes the CIELAB blue shift; hue stays put as you move L/C | **Reasoning space of choice** |
| **HCT** | Google/Material; CAM16 hue+chroma × CIELAB **L\*** as "tone" | Purpose-built so **tone ≈ contrast**; ties palette generation to accessibility | Excellent for *tonal-palette* generation |

**Why OKLCH specifically (verified claims):** Ottosson's optimisation reduced lightness-prediction RMS error to **0.20 vs CIELAB's 1.70**, and chroma error to **0.81 vs 1.84**; it removes the hue-shift-toward-purple that CIELAB/CIELUV show in gradients. ([Ottosson, *A perceptual color space*](https://bottosson.github.io/posts/oklab/)) In CSS-practical terms (Evil Martians): OKLCH's **L is perceived lightness held constant across hues**, so a generated ramp keeps even *visual* steps; and it exposes the *real* gamut instead of HSL's fake "every hue reaches 100 % saturation." ([Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl))

**OKLCH channel ranges to program against:**
- **L** (lightness): `0`–`1` (or `0%`–`100%`). `0` = black, `1` = white.
- **C** (chroma): `0` = grey; practical maximum below **~0.37**, and *hue-dependent* — you cannot ask every hue for the same chroma.
- **H** (hue angle): `0`–`360°`. Rough anchors: **red ≈ 25–30°, orange ≈ 45–60°, yellow ≈ 90–100°, green ≈ 140–150°, cyan ≈ 195°, blue ≈ 250–265°, purple ≈ 300–320°, magenta ≈ 350°.**

Source for ranges: [Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), [MDN `<color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value). *(Hue anchors are approximate and should be spot-checked with a picker; exact hex↔OKLCH needs a library — §5.)*

**Honesty flag — L is not luminance.** OKLCH **L** is *perceptual lightness*; WCAG 2.x contrast is computed from *relative luminance* (a different, non-perceptual formula), and APCA uses a third model. They **correlate strongly but are not equal**. Use L to *target* contrast (bigger ΔL ≈ more contrast), then hand the pair to **A5** for the actual ratio. HCT's "tone" is closer to luminance reasoning because it *is* CIELAB L\*, which is why Material ties tone to contrast — but it too must be verified, not assumed.

### 4.2 Building a tonal ramp

A ramp (a "colour scale", e.g. `blue-50 … blue-950`) is **one hue rendered at a ladder of lightnesses**. The method:

1. **Fix H** for the whole ramp (drift ≤ ±2°; a tiny warm-to-cool drift across the ramp is an advanced move, not a default).
2. **Choose L stops on a perceptual curve** — closer together in the light end (the eye is more sensitive there), wider in the mids. A 12-stop ladder that works as a default:

| Step | L | Typical role (light theme) |
|---|---|---|
| 50 | **0.985** | Faintest tint / hover bg |
| 100 | **0.967** | Subtle fill |
| 200 | **0.928** | Hairline borders, disabled fill |
| 300 | **0.872** | Borders, dividers |
| 400 | **0.715** | Placeholder text, icons (decorative) |
| 500 | **0.606** | **Base / brand mid** |
| 600 | **0.512** | Accent fill with white text |
| 700 | **0.432** | Hover on 600, strong text-accent |
| 800 | **0.352** | Pressed, high-emphasis |
| 900 | **0.278** | Headings on light, darkest fill |
| 950 | **0.205** | Near-black tint |

3. **Taper C toward the ends.** Chroma cannot survive at L≈0.985 or L≈0.2 — asking for it either clips or makes a muddy edge. Let C rise into the mids and fall at the extremes, e.g. for a blue at H=264: `50→C0.01`, `100→0.02`, `200→0.04`, `300→0.07`, `400→0.13`, `500→0.16`, `600→0.18`, `700→0.16`, `800→0.13`, `900→0.09`, `950→0.05`. The exact peak depends on the hue's gamut (yellows peak lower in C than blues).
4. **Gamut-clamp every stop** into sRGB (and P3 if you branch on `@media (color-gamut: p3)`), then **emit hex**.

**Relative-colour makes this expressible at runtime** (behind `@supports`), holding H and only moving L/C from a single seed:

```css
:root { --blue-500: oklch(0.606 0.16 264); }
@supports (color: oklch(from red l c h)) {
  --blue-300: oklch(from var(--blue-500) 0.872 0.07 h);
  --blue-700: oklch(from var(--blue-500) 0.432 0.16 h);
}
```

> **Worked example B — a hue-tinted *neutral* ramp in OKLCH.** Same machinery, tiny chroma. Tint the greys toward the brand blue (H=264) so surfaces feel of-a-family with the accent instead of clinically grey. Note C never exceeds 0.02:

| Token | OKLCH (light) | ≈ hex | Role |
|---|---|---|---|
| `neutral-0` | `oklch(0.995 0.003 264)` | `#FDFDFE` | Page background |
| `neutral-50` | `oklch(0.985 0.004 264)` | `#F9F9FB` | Raised card |
| `neutral-100` | `oklch(0.967 0.006 264)` | `#F1F1F5` | Subtle fill |
| `neutral-200` | `oklch(0.922 0.008 264)` | `#E3E3EA` | Borders |
| `neutral-300` | `oklch(0.872 0.010 264)` | `#D2D3DC` | Strong border |
| `neutral-400` | `oklch(0.715 0.014 264)` | `#9FA1AF` | Muted text/icon |
| `neutral-500` | `oklch(0.606 0.016 264)` | `#7B7D8C` | Secondary text |
| `neutral-600` | `oklch(0.512 0.016 264)` | `#5F6170` | Body-ish |
| `neutral-700` | `oklch(0.432 0.014 264)` | `#4A4B58` | Body text |
| `neutral-800` | `oklch(0.352 0.012 264)` | `#35363F` | Headings |
| `neutral-900` | `oklch(0.278 0.010 264)` | `#25262D` | Max-emphasis text |
| `neutral-950` | `oklch(0.205 0.008 264)` | `#181920` | Dark-mode base surface |

*(Hex values are computed approximations — recompute with culori/colorjs.io and gamut-clamp before shipping; §8.)* The dark theme **reuses these tokens with flipped roles**: `neutral-950/900` become surfaces, `neutral-100/200` become text — but with dark-specific re-tuning per §4.7, not a raw flip.

### 4.3 Neutral construction — the hue-tinted grey

Pure `#808080`-family greys look dead and "system-default." Real design-system neutrals carry a whisper of hue so they belong to the palette. Rules:

- **Pick the tint hue:** usually the **brand hue** (cohesive, warm-if-brand-is-warm) or its **complement** (a cool-grey UI under a warm accent is a classic, e.g. warm-brand + slightly-blue greys).
- **Chroma budget for neutrals: 0.004–0.02**, peaking in the mid-greys (300–600) exactly like a colour ramp but an order of magnitude smaller. Below ~0.004 the tint is invisible (you've built plain grey); above ~0.03 users read the greys as "blue-grey"/"warm-grey" — fine if intended, a bug if not.
- **Keep the tint hue *constant* down the ramp** — a grey ramp that drifts hue looks contaminated.
- **Warm vs cool neutrals change the whole mood:** warm greys (H ≈ 40–80) feel editorial/soft; cool greys (H ≈ 240–270) feel technical/crisp. Choose deliberately; don't leave it to chance.

### 4.4 Deriving a palette from content

The high-value, high-risk feature: take an input (usually an image — a hero photo, an uploaded logo, product art) and produce a coherent accent + supporting palette.

**Pipeline:**

1. **Reduce the image to representative colours (quantisation).** Two standard algorithms:
   - **Median-cut / MMCQ** (modified median-cut quantisation) — recursively splits the RGB colour cube along its longest axis; fast, deterministic, the basis of **ColorThief** and **node-vibrant**.
   - **k-means clustering** — partitions pixels into *k* clusters by colour distance; can give better cluster centres, is slower and non-deterministic (seed-dependent).
2. **Pick a swatch by *role*, not frequency.** node-vibrant returns a named taxonomy — **Vibrant, LightVibrant, DarkVibrant, Muted, LightMuted, DarkMuted** — which is more useful than raw dominance:
   - **Accent (light theme)** → `Vibrant` or `DarkVibrant`.
   - **Accent (dark theme)** → `LightVibrant` (needs to sit bright on dark).
   - **Surfaces / neutral tint hue** → `Muted` / `DarkMuted`.
3. **Convert to OKLCH** and treat only the **H** as sacred (it carries the brand feeling). Discard the extracted L and C — they were dictated by lighting and JPEG, not by your design intent.
4. **Condition:** set **L to the theme's accent target** and **clamp C** to your accent ceiling and to the gamut. Now it is safe to place.

**Pitfalls (all common, all detectable):**

| Pitfall | Why it happens | Guard |
|---|---|---|
| Accent is a dull mud | Picked the *dominant* (background) colour, not the vibrant one | Choose by role (Vibrant), not frequency |
| Accent is near-grey, then "boosted" into a wrong hue | Source had low chroma; forcing C invents a hue that isn't there | If extracted **C < ~0.04**, treat source as achromatic → fall back to a *default* brand hue, don't fabricate one |
| Accent fails contrast on the target bg | Raw L kept | Always re-set L to the theme target (below) |
| Accent collides with a semantic colour | Image gave a red; danger is also red | Detect H within ~±20° of a semantic anchor → nudge accent H away *or* switch semantics to icon+text (§4.6) |
| Two extracted colours clash | Picked two high-C swatches of similar L → they vibrate | Keep one accent; demote the other to low-C surface tint |
| Over-saturated on dark | P3-vibrant pick blooms on `#121212` | Apply the dark-mode chroma cut (§4.7) |

> **Worked example A — derive an accent from an image and condition it for a dark background with guaranteed contrast.**
>
> 1. **Extract.** node-vibrant returns `Vibrant = #E2590C` (a burnt orange). Convert → **`oklch(0.64 0.19 44)`** *(approx; recompute with a library)*.
> 2. **Keep only H = 44.** Discard the source L/C.
> 3. **Set brand seed, gamut-clamped:** `--brand: oklch(0.64 0.17 44);`
> 4. **Condition per theme** (hold H, set L to target, clamp C):
>    - **Light theme accent** (a fill that carries **white** text): push darker so white text clears the bar → `oklch(0.56 0.16 44)` ≈ `#C24E12`.
>    - **Dark theme accent** (a fill/text on `#121212`, L≈0.18): push **brighter and calmer** to sit on dark without halation → `oklch(0.72 0.13 44)` ≈ `#F08A4B`.
> 5. **Contrast target check.** Dark-theme accent L 0.72 vs surface L 0.18 → **ΔL ≈ 0.54**, a wide gap that comfortably targets ≥3:1 for a large UI element; the light-theme fill L 0.56 vs white text L 1.0 → **ΔL ≈ 0.44**. *Then verify the actual ratio in A5 — ΔL is the design target, not the certificate (§8).*
>
> **CSS, with hex floor + relative-colour enhancement:**
> ```css
> :root{
>   --brand: #C85A20;                      /* precomputed sRGB floor  */
>   --accent: #C24E12;                     /* light-theme fill        */
>   --accent-ink: #ffffff;
> }
> @supports (color: oklch(from red l c h)){
>   :root{ --brand: oklch(0.64 0.17 44); --accent: oklch(from var(--brand) 0.56 0.16 h); }
> }
> @media (prefers-color-scheme: dark){
>   :root{ --accent: #F08A4B; }
>   @supports (color: oklch(from red l c h)){
>     :root{ --accent: oklch(from var(--brand) 0.72 0.13 h); }  /* brighter, C cut ~24% */
>   }
> }
> ```
> Everything above is **pure CSS → CSP-safe, no network, no eval**. The one part that needs JS — reading pixels out of the image (`canvas.getImageData` + node-vibrant/ColorThief) — is discussed under CSP next.

**CSP / offline verdict for derivation.** Image quantisers (**node-vibrant**, **ColorThief**) are **plain JS — no `eval`, no WASM** — so they *can* run inside a strict-CSP single file. But two hard limits: (a) **no remote images** — the source must be a same-file `data:` URI or a user-supplied file, since the sandbox blocks network; (b) `canvas.getImageData` on a cross-origin image taints the canvas and throws. **Preferred pattern:** run derivation **at authoring time** (in the agent's build step, off-sandbox) and bake the conditioned OKLCH/hex tokens into the file. **In-sandbox live derivation** is only for a colour the *user* supplies inside the session (an inlined data-URI image or a colour picker), and then `color-mix()`/relative-colour can do the conditioning in pure CSS.

### 4.5 Colour budgets — how much accent, and which surfaces earn it

This is the section that fixes the brief's named failure mode (*one accent everywhere → cheap; then no accent → dead*). The cure is a **budget plus a ranked earn-list**, not "more" or "less" colour.

**The 60/30/10 split** (interior-design heuristic, load-bearing in UI): **~60 %** dominant neutral (backgrounds, most surfaces), **~30 %** secondary (cards, sections, body text — often a neutral step or a muted brand tint), **~10 %** accent (the loud 10 %). ([freeCodeCamp: 60-30-10](https://www.freecodecamp.org/news/the-60-30-10-rule-in-design/), [UX Planet](https://uxplanet.org/the-60-30-10-rule-a-foolproof-way-to-choose-colors-for-your-ui-design-d15625e56d25))

**The earn-list — surfaces that *may* spend the 10 % accent, ranked:**

1. The **primary action** on the view (one primary CTA per context).
2. The **active/selected** state (current nav item, selected tab, chosen option).
3. The **focus ring** (accent is fine; but focus must not rely on colour *alone* — pair with a ring outline).
4. A single **key data highlight** (the one number/bar the view is about).
5. Small **brand touches** (a logo, a link, an accent underline).

**Surfaces that must *not* carry accent by default** (this is where "cheap" comes from): every card border, every icon, every heading, every hover background, large fills, section backgrounds, and secondary/tertiary buttons. Those are **neutral**; they earn a *tint* (a low-C neutral or a 5–10 % accent wash) at most, not saturated accent.

**Where 60/30/10 breaks (know the exceptions):**

| Context | What breaks | Adjustment |
|---|---|---|
| **Data-dense dashboards** | 10 % accent can't encode many series | Split into a *categorical* system (§4.9) for data + a single accent for chrome; keep chrome at ~10 % |
| **Dark mode** | Saturated accent reads "louder" on dark; 10 % feels like 20 % | Shrink the accent footprint and cut its chroma (§4.7) |
| **Marketing / hero** | Intentional colour flooding | Budget applies to *product UI*, not a landing hero — but keep reading text off the loud areas (see B1/A4) |
| **Status-heavy screens** | Semantic colours add up | Semantic ≠ accent; they share the "loud" budget, so a screen full of status chips has *no room left* for decorative accent |

**Detection rule for the agent:** if more than one *hue family* is carrying saturation in a single view (excluding necessary semantics), or if the accent appears on >~10 % of the surface area, it's over budget → demote the weakest uses to neutral. If the view has **zero** saturated pixels and isn't intentionally monochrome, it's under budget → promote the primary action.

### 4.6 Semantic colour — a separate system

Success/warning/danger/info are a **meaning system**, not decoration, and must stay legible even when the brand accent changes. Rules:

- **Fixed hue anchors**, tuned once, reused everywhere. Working OKLCH anchors:

| Role | Hue (OKLCH) | Light variant (target) | Dark variant (target) | Note |
|---|---|---|---|---|
| **Danger / error** | **~27°** (red) | `oklch(0.55 0.20 27)` | `oklch(0.70 0.16 27)` | Most saturated; reserve for destructive/error |
| **Warning / caution** | **~75°** (amber) | `oklch(0.75 0.15 75)` | `oklch(0.83 0.13 75)` | Amber, *not* yellow — pure yellow can't hold contrast for text |
| **Success / confirm** | **~150°** (green) | `oklch(0.60 0.14 150)` | `oklch(0.74 0.12 150)` | |
| **Info / neutral-notice** | **~250°** (blue) | `oklch(0.58 0.15 250)` | `oklch(0.72 0.12 250)` | Often overlaps brand blue — see collision rule |

*(Targets are starting points; clamp to gamut and verify contrast in A5.)*

- **Keep semantic hues ≥ ~30° apart from the brand accent** in H. If the brand is red and danger is red, users can't tell "brand" from "error." Resolve by (a) shifting the accent's hue, or (b) making semantics rely on **icon + text + shape**, not colour, so a red brand can coexist with a red-adjacent danger.
- **Never encode status by colour alone** (this is also an A5 rule, but it's a colour-*design* rule too): danger = red **+ icon + label**; success = green **+ check + label**. This is what makes semantics survive colour-blindness (§4.9) and greyscale.
- **Each semantic colour needs a full mini-set**: a text-safe foreground, a fill, a subtle background wash (mix ~10–15 % of the hue into the surface), and a border — in *both* themes.

### 4.7 Dark-surface colour behaviour

Dark mode is not "invert the light palette." Colour behaves differently against dark, and several effects must be actively managed.

**Why pure black (`#000`) fails — four concrete reasons:**
1. **Elevation dies.** Shadows are near-invisible on black, so you lose depth cues; Material's fix is to signal elevation with *lighter* surfaces instead (below). ([Material dark theme](https://m3.material.io/blog/android-dark-theme-tutorial))
2. **Halation / glow.** High-luminance (especially white or high-C) content on pure black *blooms* — a smeary halo — worst for astigmatic and low-vision users, and on OLED where black pixels are fully off next to lit ones. Mitigate with a non-black surface and dimmed text.
3. **Eye strain.** Light text on pure black maximises the contrast swing during scanning; a dark grey base reduces it. ([Material dark theme](https://m3.material.io/blog/android-dark-theme-tutorial))
4. **No headroom.** From `#000` you can only go lighter; a raised base (`#121212`) lets you build surfaces both slightly up (elevation) and, rarely, down (recesses).

**The dark base and elevation ladder (verified Material numbers).** Base surface `#121212` (**OKLCH L ≈ 0.18–0.20**). Elevation is a **white overlay** whose opacity rises with height — equivalently, a **+L** move:

| Elevation | dp | White overlay | ≈ OKLCH L | Use |
|---|---|---|---|---|
| Resting surface | 0 | **0 %** | 0.18 | Page background |
| +1 | 1 | **5 %** | ~0.21 | Cards, resting components |
| +2 | 2 | **7 %** | ~0.22 | Raised card |
| +3 | 3 | **8 %** | ~0.23 | Search bar, refresh |
| +4 | 4 | **9 %** | ~0.24 | App bar |
| +6 | 6 | **11 %** | ~0.26 | FAB, snackbar |
| +8 | 8 | **12 %** | ~0.27 | Menus, bottom nav |
| +12 | 12 | **14 %** | ~0.29 | Nav drawer |
| +16 | 16 | **15 %** | ~0.30 | Modal drawer |
| +24 | 24 | **16 %** | ~0.31 | Dialog (highest) |

Source: [Material dark theme overlay ladder](https://m3.material.io/blog/android-dark-theme-tutorial) (0/5/7/8/9/11/12/14/15/16 %, verified). **Practical rule:** each perceived elevation step ≈ **+0.03 L**; 4–5 distinct steps is plenty for most UIs.

**Saturation on dark — desaturate and dim:**
- **Cut chroma ~10–30 %** vs the light-theme colour. A fully saturated accent that reads "confident" on white reads "screaming" on `#121212` and can vibrate against neighbours. Material's guidance: dark theme wants **desaturated** colours — tonal range ~**50–400**, with the primary around tone **200**, i.e. *lighter and less saturated* than the light-theme 500/600. ([Material](https://blog.prototypr.io/how-to-design-a-dark-theme-for-your-android-app-3daeb264637))
- **Raise L of accents/semantics** so they sit *brighter* than the surface (on light bg, accents are darker than the bg; on dark bg they must be lighter). This L-inversion is the single biggest structural change from light to dark.
- **Never pure-white text.** Use **L ≈ 0.90** (`#E6E6E6`) for primary text, ~0.70 for secondary, ~0.55 for disabled — softer than `#FFF`, kills halation, still clears contrast on `#121212`.

**Vibration / simultaneous contrast:** two high-chroma colours of *similar lightness* placed adjacent (classic: saturated red next to saturated blue/green at equal L) shimmer at the edge. Avoid equal-L high-C adjacencies; separate them with a neutral, or split their lightness.

### 4.8 State colour — deltas that survive both themes

Interactive states (hover, active/press, selected, disabled) must be expressed as **relative moves from the base**, so one rule works in light *and* dark. Hardcoding a second hex per state is the bug that makes dark-mode hovers disappear or glow.

**The direction-aware lightness rule:**

| State | Light theme | Dark theme | Perceptual delta |
|---|---|---|---|
| **Hover** | darken base | **lighten** base | **ΔL ≈ ±0.04–0.06** |
| **Active / press** | darken more | lighten more | **ΔL ≈ ±0.08–0.10** |
| **Selected** | accent tint bg (wash) | accent tint bg (wash) | mix ~10–15 % accent into surface |
| **Disabled** | drop chroma + toward mid | drop chroma + toward surface | C→~0, L toward surface; ~38 % opacity is the Material convention |

**Two implementation strategies, both CSP-safe pure CSS:**

*Strategy 1 — `color-mix()` toward the foreground (recommended; simplest and inherently theme-safe).* Because text is dark in light mode and light in dark mode, mixing the surface **toward `currentColor`** darkens on light and lightens on dark, automatically:

```css
.btn            { background: var(--surface); }
.btn:hover      { background: color-mix(in oklab, var(--surface), currentColor 8%);  }
.btn:active     { background: color-mix(in oklab, var(--surface), currentColor 12%); }
```

*Strategy 2 — relative-colour ΔL with a theme sign.* Set a `--state-dir` of `+`/`-` per theme (or just use two `calc`s under `prefers-color-scheme`) and move L:

```css
:root                         { --hover: oklch(from var(--surface) calc(l - 0.05) c h); }
@media (prefers-color-scheme: dark){
  :root                       { --hover: oklch(from var(--surface) calc(l + 0.05) c h); }
}
```

Both interpolate/mix **in `oklab`/OKLCH**, so the step *looks* even. `color-mix()` is the safer default (widest support — §4.10); relative-colour is newer.

*(These ΔL magnitudes are engineering defaults chosen to be perceptible but calm; Material's state-layer opacities — hover ≈8 %, focus ≈10 %, pressed ≈10 % — are a related convention. Treat both as starting points to tune, and let A5 confirm that hover/selected states still meet non-text contrast. Honesty flag §8.)*

### 4.9 Colour-blindness-safe categorical sets

For *categorical* data (series, tags, chips, legend entries) the palette must survive the common colour-vision deficiencies (protanopia/deuteranopia ≈ 8 % of men; tritanopia rarer). **Do not hand-pick** — use a vetted set.

**Okabe–Ito (recommended default; 8 colours, verified hex).** Designed by Masataka Okabe & Kei Ito for Color Universal Design; popularised by Wong, *Nature Methods* 8(6):441 (2011). Distinguishable under protan/deutan/tritan **and** distinct in greyscale print. ([source](https://thenode.biologists.com/data-visualization-with-flying-colors/research/), [hex reference](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference))

| # | Name | Hex | RGB |
|---|---|---|---|
| 1 | Black | `#000000` | 0,0,0 |
| 2 | Orange | `#E69F00` | 230,159,0 |
| 3 | Sky blue | `#56B4E9` | 86,180,233 |
| 4 | Bluish green | `#009E73` | 0,158,115 |
| 5 | Yellow | `#F0E442` | 240,228,66 |
| 6 | Blue | `#0072B2` | 0,114,178 |
| 7 | Vermillion | `#D55E00` | 213,94,0 |
| 8 | Reddish purple | `#CC79A7` | 204,121,167 |

**Paul Tol schemes (verified hex from the SRON primary source).** ([Tol, *Colour Schemes*, SRON/EPS/TN/09-002](https://sronpersonalpages.nl/~pault/data/colourschemes.pdf))
- **Bright (7):** `#4477AA` blue · `#66CCEE` cyan · `#228833` green · `#CCBB44` yellow · `#EE6677` red · `#AA3377` purple · `#BBBBBB` grey.
- **Muted (10):** `#332288` indigo · `#88CCEE` cyan · `#44AA99` teal · `#117733` green · `#999933` olive · `#DDCC77` sand · `#CC6677` rose · `#882255` wine · `#AA4499` purple · `#DDDDDD` pale grey *(pale grey reserved for "bad data")*.

**Usage rules (numbers):**
- **≤4 categories:** trivially safe — take the first 4 of Okabe–Ito in order.
- **5–8 categories:** a real challenge but doable with a vetted set.
- **>8 categories:** effectively **impossible** to keep distinguishable by colour — switch strategy (group, facet, or use direct labels). ([source](https://thenode.biologists.com/data-visualization-with-flying-colors/research/))
- **Always dual-encode:** colour **+** shape/marker/label/pattern. Use "thick lines or large symbols" so the colour-to-legend mapping is easy; colour is never the only channel.
- **Verify, don't trust:** simulate the final palette through protan/deutan/tritan filters (a CVD simulator; chroma.js and colorjs.io can help) before shipping — especially any *sequential/diverging* data ramp, which is a separate problem from categorical (prefer a perceptually-uniform ramp like a single-hue OKLCH scale or a vetted scientific map).

### 4.10 Modern CSS colour features — support, CSP, and fallbacks

All colour output is **pure CSS → inherently CSP-safe** (no network, no eval, no external assets). The only real constraint is **browser support**, handled with a precomputed sRGB-hex floor plus `@supports` enhancement. Current status (mid-2026, **verify at build with Baseline/caniuse — §8**):

| Feature | Baseline / support | What it buys | Fallback |
|---|---|---|---|
| **`oklch()` / `oklab()`** | **Baseline: widely available.** Chrome/Edge 111+, Firefox 113+, Safari 15.4+ | Perceptual authoring; P3-reachable colours | Precomputed **sRGB hex** declared first; browser ignores the `oklch` line it can't parse |
| **`color-mix()`** | **Baseline: widely available** (since ~May 2023). Chrome/Edge 111+, FF 113+, Safari 16.2+ | Tinting, state layers, transparency, theme-safe hover | Precomputed hex, or a two-declaration cascade |
| **Relative colour (`from`)** | **Newer** — Chrome/Edge 119+, Firefox 128+, Safari 16.4+ (Baseline ~2024) | Derive whole ramps/states from one seed at runtime | Ship the *computed* hex tokens; gate live derivation behind `@supports (color: oklch(from red l c h))` |
| **`@property`** | **Baseline 2024** (since July 2024) | Typed custom props → animatable colour vars, gradient-stop transitions | Static colour vars; feature-detect before relying on animation |
| **P3 gamut** (`oklch()` in P3, `@media (color-gamut: p3)`) | Growing | ~**30 % more colours** than sRGB on capable displays | Provide sRGB values as default, P3 in the media query |

**The single robust pattern for the sandbox** (works everywhere, enhances where supported):

```css
:root{
  --accent:      #C24E12;                     /* 1. sRGB floor — universal      */
}
@supports (color: oklch(0% 0 0)){
  :root{ --accent: oklch(0.56 0.16 44); }     /* 2. perceptual, P3-reachable    */
}
@supports (color: oklch(from red l c h)){
  :root{ --accent-hover: oklch(from var(--accent) calc(l - 0.05) c h); }  /* 3. derive */
}
```

**Gamut caveat (restate rule 13):** an `oklch()` you write may be outside sRGB/P3; Chrome/Safari currently **clip** rather than gamut-map, which can shift the colour. Compute the in-gamut value with a library at authoring time and emit that as the hex floor, so the fallback is *correct*, not just present.

---

## 5. Options catalogue

Columns: **what · when to use · when NOT · licence · where to get · cost / single-file-CSP feasibility · pitfalls.** "CSP-safe" = survives a strict Content-Security-Policy with no `unsafe-inline`/`unsafe-eval` and **no network**. All CSS colour *output* is CSP-safe; the feasibility column flags where JS is involved.

### 5a. Colour-space / reasoning choices

| Space | What / when to use | When NOT | Licence | Where | CSP/feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **OKLCH** | Default reasoning space; all ramps, states, mixing, derivation | When you need luminance-exact contrast (that's A5) | Web platform / open spec | [CSS Color 4](https://www.w3.org/TR/css-color-4/) | Native CSS, CSP-safe; hex floor for old browsers | L ≠ WCAG luminance; not every triplet in-gamut |
| **OKLab** | Interpolation/mixing where you want rectangular (no hue-arc) mixing | Picking by hue (use OKLCH) | Web platform | CSS Color 4 | Native, CSP-safe | Same gamut caveat |
| **HCT** | *Tonal-palette* generation with contrast baked in (tone≈contrast) | Ad-hoc single colours; when you're already in OKLCH | via lib (below) | Material | Needs JS lib at authoring time | Not a CSS-native space; must precompute to hex/oklch |
| **LCH / Lab** | Legacy perceptual; fine if OKLCH unsupported | New work (OKLCH fixes the blue shift) | Web platform | CSS Color 4 | Native, CSP-safe | Blue hue shift on L/C changes |
| **HSL / HSV** | Only for quick author-time intuition | Any systematic ramp/state math | Web platform | CSS | Native | **Lightness lies**; breaks contrast silently |
| **sRGB hex** | Delivery floor, universal fallback | Reasoning/derivation | Web platform | CSS | Native, universal | Not perceptual |

### 5b. Palette-derivation approaches

| Approach | What / when | When NOT | Licence | Where | CSP/feasibility | Pitfalls |
|---|---|---|---|---|---|---|
| **Hold-H, vary-L ramp** | Default ramp/neutral construction (§4.2–4.3) | — | Method (free) | This doc | Pure CSS or lib; CSP-safe | Taper C at ends or it clips |
| **Contrast-target generation** | Generate stops by *target ratio* (accessibility-first) | When you want fixed L stops | Apache-2.0 | **Adobe Leonardo** (below) | JS at authoring time | Interpolation-space choices affect result |
| **Tonal palette (HCT)** | Material-style tone 0–100; tone≈contrast | Non-Material systems that don't want the look | Apache-2.0 | **material-color-utilities** | JS at authoring time | Opinionated aesthetic; verify contrast |
| **Image extraction** | Derive accent from a photo/logo (§4.4) | When brand hue is already known | MIT | **node-vibrant / ColorThief** | Plain JS, CSP-safe **but no remote images**; prefer author-time | Dominant≠accent; condition L/C after |
| **`color-mix()` tinting** | Washes, state layers, semantic bg tints | Precision ramp stops | Web platform | CSS | Native, CSP-safe | Choose `in oklab`/`oklch` not `srgb` |
| **Relative-colour derivation** | One seed → ramp/states at runtime | Old browsers without a floor | Web platform | CSS | Native, CSP-safe; gate w/ `@supports` | Newer support; ship computed hex too |

### 5c. Open-licensed colour libraries & data (verify licence at build)

| Tool | What it does | Licence (verified) | Where | CSP / feasibility | Pitfalls / notes |
|---|---|---|---|---|---|
| **culori** | Conversion, interpolation, colour-difference, blending; full CSS Color 4 incl. OKLab/OKLCH; dependency-light | **MIT** | [Evercoder/culori](https://github.com/Evercoder/culori) | JS, no eval → CSP-safe inlined; best for **author-time** token generation | Tree-shake; verify gamut-map fn you use |
| **colorjs.io (color.js)** | Reference-grade: **proper gamut mapping** (not clip), DeltaE, every CSS Color 4 space; by the CSS Color spec editors (Verou & Lilley) | **MIT** | [color-js/color.js](https://github.com/color-js/color.js) | JS, CSP-safe inlined; heavier than culori | Larger bundle; use at authoring time, not per-frame |
| **chroma.js** | Colour **scales**, Lab/Lch interpolation, CVD simulation, ColorBrewer | **BSD-3-Clause** (lib) **+ Apache-2.0** (ColorBrewer data) | [gka/chroma.js](https://github.com/gka/chroma.js) | JS, zero-dep, CSP-safe inlined | Two licences in one repo — attribute both |
| **material-color-utilities** | HCT space, tonal palettes, dynamic colour, contrast fixers | **Apache-2.0** | [material-foundation/material-color-utilities](https://github.com/material-foundation/material-color-utilities) | JS at author time | Opinionated Material aesthetic |
| **Adobe Leonardo** | Generate palettes by **target contrast ratio**; adaptive themes | **Apache-2.0** | [adobe/leonardo](https://github.com/adobe/leonardo) | JS at author time; uses D3 interpolation | Contrast model is WCAG2 by default (A5 owns final check) |
| **node-vibrant** | Extract Vibrant/Muted/Dark/Light swatches from images (MMCQ) | **MIT** | [Vibrant-Colors/node-vibrant](https://github.com/Vibrant-Colors/node-vibrant) | Plain JS, CSP-safe; **no remote images** in sandbox | Dominant≠accent; pick by role |
| **ColorThief** | Dominant colour + palette from image (MMCQ median-cut) | **MIT** (© Lokesh Dhakar) | [lokesh/color-thief](https://github.com/lokesh/color-thief) | Plain JS, CSP-safe; same no-remote-image limit | Returns dominant, not "vibrant" |
| **Okabe–Ito palette** (data) | 8-colour CVD-safe categorical set | Free to use (Color Universal Design; Wong 2011) | [hex ref](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference) | Just hex values — inline them | Cap ≤8; dual-encode |
| **Paul Tol schemes** (data) | Bright/muted/etc. CVD-safe sets | Free technical note (SRON) | [SRON PDF](https://sronpersonalpages.nl/~pault/data/colourschemes.pdf) | Inline hex | Reserve pale-grey for bad data |
| **ColorBrewer** (data) | Sequential/diverging/qualitative map palettes | **Apache-2.0** | [colorbrewer2.org](https://colorbrewer2.org) | Inline hex | Cynthia Brewer attribution |

*Commercial alternatives (one line): paid pickers/generators (Coolors Pro, Adobe Color premium, various "AI palette" SaaS) exist but add nothing self-hostable — everything above is free and offline-capable.*

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Accent on every surface** (the "cheap" failure) | Borders, icons, headings, hovers all tinted with the brand colour; >~10 % of pixels saturated; more than one hue family carrying saturation | Apply the budget (§4.5): demote all but the ranked earn-list to neutral; accent ≤10 % |
| **No colour at all** (the "dead" over-correction) | Zero saturated pixels, all-grey UI that isn't intentionally monochrome; primary action indistinguishable | Promote the primary action + active state to accent; add a hue-tinted neutral so greys aren't lifeless (§4.3) |
| **Ramp with uneven steps** | Some neighbours look identical, others jump; usually built in HSL/RGB | Rebuild in OKLCH holding H, even ΔL, taper C (§4.2) |
| **Grey looks dead / "system default"** | Flat `#808080` neutrals | Tint toward a hue at C 0.004–0.02 (§4.3) |
| **Grey looks contaminated** | Neutrals read visibly blue/beige when they shouldn't | Chroma too high — pull under ~0.03 (§4.3) |
| **Pure-black dark mode** | `#000` base; elevation invisible; text haloing/blooming | Base `#121212` (L≈0.18); elevation via +L overlay ladder (§4.7) |
| **Accent screams on dark** | Light-theme accent reused as-is; vibrates, glows | Cut chroma 10–30 %, raise L above surface (§4.7) |
| **Halation on text** | Pure-white text on near-black smears (worst for astigmatism/OLED) | Text L≈0.90 (`#E6E6E6`) not `#FFF`; non-black surface (§4.7) |
| **Hover invisible/glowing in one theme** | State was a hardcoded hex; works in light, vanishes or blooms in dark | Direction-aware ΔL or `color-mix` toward `currentColor` (§4.8) |
| **Derived accent is mud** | Extracted the dominant (background) colour | Pick by role: Vibrant, not dominant (§4.4) |
| **Derived hue invented from a grey** | Low-chroma source "boosted" into a random hue | If source C<~0.04 → treat achromatic, use default brand hue (§4.4) |
| **Brand accent = a semantic colour** | Brand red vs danger red; users can't tell brand from error | Keep ≥~30° apart, or make semantics icon+text (§4.6) |
| **Status by colour alone** | Red/green with no icon or label | Add icon + text; survives CVD & greyscale (§4.6, §4.9) |
| **Categorical palette fails CVD** | Two series merge under deutan/protan simulation | Use Okabe–Ito/Tol; ≤8; dual-encode; simulate before ship (§4.9) |
| **Colour clips / shifts unexpectedly** | An `oklch()` renders duller/different than intended | Out of gamut + naïve browser clip — gamut-map at author time, emit correct hex (§4.10, rule 13) |
| **Modern colour breaks old browsers** | `oklch()`/relative-colour used with no fallback → invalid, element uninitialised | Precompute sRGB hex floor; `@supports`-gate enhancements (§4.10) |
| **Live image derivation dead in sandbox** | Tries to read a remote image; CORS-taint or network-blocked | Derive at author time and bake tokens; only same-file data-URI images in-sandbox (§4.4) |

---

## 7. Pre-flight checklist (run before shipping any palette)

- [ ] All ramp/state/derivation math done in **OKLCH**; **sRGB hex floor** emitted; `oklch()/color-mix()/relative-colour` gated behind `@supports` (§4.1, §4.10).
- [ ] **One accent hue family**; semantic colours are a **separate** system and ≥~30° from the accent (§4.2, §4.6).
- [ ] **Accent budget ≤ ~10 %** of each screen; accent only on the ranked earn-list; everything else neutral (§4.5).
- [ ] Neutrals are **hue-tinted** (C 0.004–0.02, one constant hue, never >~0.03) (§4.3).
- [ ] Ramps hold **H**, step **L** perceptually, **taper C** at the ends; every stop gamut-clamped (§4.2).
- [ ] Dark base is **`#121212`/L≈0.18, not `#000`**; elevation via the **+L overlay ladder** (0→16 %) (§4.7).
- [ ] Dark accents/semantics **desaturated ~10–30 %** and **lighter than the surface**; text **L≈0.90, not pure white** (§4.7).
- [ ] State colours are **direction-aware ΔL / `color-mix` toward foreground**, verified in **both** themes (§4.8).
- [ ] Derived colours were **conditioned** (L set to target, C clamped) and their contrast **verified by A5** — no raw picks on surfaces (§4.4, rule 10).
- [ ] Categorical data uses a **verified CVD-safe set** (Okabe–Ito/Tol), **≤8** categories, **dual-encoded** with shape/label, simulated through protan/deutan/tritan (§4.9).
- [ ] Every token exists in **light *and* dark**; the whole system was **reviewed in both** (rule 14).
- [ ] Every recommended library/data set is **free + self-hostable**, licence noted (culori/colorjs.io MIT, chroma.js BSD+Apache, Material/Leonardo Apache-2.0, node-vibrant/ColorThief MIT) (§5).
- [ ] Any in-sandbox image derivation uses a **same-file data-URI** image (no network), or derivation was done **at authoring time** (§4.4).

---

## 8. Open questions / unverified

- **Browser-support figures are time-sensitive.** The Baseline/version numbers in §4.10 are as of **mid-2026** and must be re-checked at build against Baseline/caniuse. Relative-colour (`from`) and `@property` are the youngest and most likely to matter for the fallback strategy. *(Verify.)*
- **OKLCH L is not WCAG luminance.** Every "ΔL ≈ contrast" statement here is a **design target**, not a conformance result. WCAG 2.x uses relative luminance; APCA uses a different model again. Final ratios are **A5's** to certify. Do not treat any L delta in this document as a guaranteed pass. *(Structural honesty flag.)*
- **Approximate hex↔OKLCH values.** All hex equivalents given for OKLCH triplets (neutral ramp, worked examples, semantic anchors) are **computed approximations** for illustration. Recompute with culori/colorjs.io and gamut-clamp before shipping; do not paste these as final tokens.
- **State-delta magnitudes and Material state-layer opacities** (hover ~8 %, focus ~10 %, pressed ~10 %; ΔL ±0.04–0.10) are **sensible defaults**, sourced to Material convention and tuned for perceptibility — not a universal constant. Tune per product and re-verify non-text contrast with A5.
- **chroma.js dual licence:** the repo README states **BSD** for the library and **Apache-2.0** for the bundled ColorBrewer data. If your policy needs a single OSI licence, this is still fine (both are OSI-approved) but attribute both. *(Verified from the LICENSE file; re-confirm at the version you pin.)*
- **node-vibrant / ColorThief in-sandbox:** confirmed **plain JS (no eval/WASM)** and therefore CSP-compatible, but the **no-remote-image** and **canvas-taint** constraints mean live in-sandbox derivation is narrow. The recommended path is **author-time** derivation. *(Feasibility verified in principle; test the exact build.)*
- **P3 vs sRGB accent choice** (whether to spend the extra ~30 % gamut on the accent) is partly an A4/brand aesthetic call; A1 only guarantees a correct sRGB floor + optional P3 branch.
- **Sequential/diverging data ramps** (as opposed to categorical) are touched only lightly here; a full treatment of perceptually-uniform data ramps and scientific colour maps (viridis/cividis, Tol's, ColorBrewer) is arguably its own sub-track — flag if the tool needs heavy data-viz colour.

---

## 9. Sources

Primary / authoritative:
- [Björn Ottosson — *A perceptual color space for image processing* (Oklab)](https://bottosson.github.io/posts/oklab/) — Oklab derivation, L/a/b + polar C/h, cube-root nonlinearity, RMS-error comparisons vs CIELAB. Public domain / MIT.
- [W3C — CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) — `oklch()/oklab()/lch()/lab()`, `color-mix()`, gamut mapping.
- [MDN — Using relative colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Using_relative_colors) — `from` syntax, channel variables, `calc`, `@supports` gating, Safari `deg` caveat.
- [MDN — `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) — spaces, percentage normalisation, hue interpolation, Baseline since ~May 2023.
- [MDN — `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — typed custom props, animatable colour vars, Baseline 2024.
- [MDN — `<color>` value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) — colour syntaxes and ranges.
- [Material Design 3 — Building a Material dark theme](https://m3.material.io/blog/android-dark-theme-tutorial) — why not pure black, `#121212`, elevation overlays, desaturation.
- [Paul Tol — *Colour Schemes*, SRON/EPS/TN/09-002](https://sronpersonalpages.nl/~pault/data/colourschemes.pdf) — bright/muted CVD-safe hex sets, bad-data grey.

Reference / secondary:
- [Evil Martians — OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) — practical OKLCH ranges, HSL/LCH failures, P3, gamut-clip caveat, contrast heuristic.
- [Modern CSS Tools — Modern CSS Color guide](https://moderncsstools.com/guides/modern-colors/) — 2026 support numbers, fallback cascade.
- [The Node (Biologists) — Data visualization with flying colors](https://thenode.biologists.com/data-visualization-with-flying-colors/research/) — Okabe–Ito origin, ≤4/5–8/>8 category limits, dual-encoding.
- [ConceptViz — Okabe–Ito palette hex reference](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference) — verified 8-colour hex + Wong 2011 citation.
- [freeCodeCamp — The 60-30-10 rule](https://www.freecodecamp.org/news/the-60-30-10-rule-in-design/) and [UX Planet — 60-30-10](https://uxplanet.org/the-60-30-10-rule-a-foolproof-way-to-choose-colors-for-your-ui-design-d15625e56d25) — budget split.
- [Design a dark theme (Prototypr)](https://blog.prototypr.io/how-to-design-a-dark-theme-for-your-android-app-3daeb264637) — `#121212`, 4dp=9% overlay, tonal-value 50–400 desaturation.
- [Vuetify issue #14198](https://github.com/vuetifyjs/vuetify/issues/14198) — full dark elevation overlay ladder (0/5/7/8/9/11/12/14/15/16 %).

Libraries & data — licences (verified from source):
- [culori — **MIT**](https://github.com/Evercoder/culori); [colorjs.io / color.js — **MIT**](https://github.com/color-js/color.js) (Verou & Lilley; proper gamut mapping).
- [chroma.js — **BSD-3-Clause** + **Apache-2.0** (ColorBrewer data)](https://github.com/gka/chroma.js/blob/main/LICENSE).
- [material-color-utilities — **Apache-2.0**](https://github.com/material-foundation/material-color-utilities) (HCT, tonal palettes).
- [Adobe Leonardo — **Apache-2.0**](https://github.com/adobe/leonardo) (contrast-target palettes).
- [node-vibrant — **MIT**](https://github.com/Vibrant-Colors/node-vibrant) (via [jsDelivr](https://www.jsdelivr.com/package/npm/node-vibrant)); [ColorThief — **MIT**](https://github.com/lokesh/color-thief/blob/master/LICENSE) (© Lokesh Dhakar).
- [ColorBrewer — **Apache-2.0**](https://colorbrewer2.org) (Cynthia Brewer).
