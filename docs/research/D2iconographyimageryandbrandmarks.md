# D2 — Iconography, imagery & brand marks

*Design-intelligence reference. Track D2 of the registry research map. Written to be read by the design agent before it places a single icon, logo, avatar, or image, and by a human owner auditing that work. Current as of July 2026; licence + trademark + CSP verdict stated for every asset source.*

---

## 1. Scope line

This track owns **visual marks as a system**: how an icon set is constructed (grid, stroke weight, optical sizing, corner treatment) and what a given icon *means* (filled vs outline semantics); the discipline of **adopting a single set consistently** and the rules for the rare case of mixing; sourcing and using **real brand/product logos** from licence-clean SVG sets without ever hand-drawing them, and the **trademark-≠-licence** caveats that attach; illustration systems; **photography/artwork handling** (aspect ratios, cropping, focal points) and — critically — **deterministic placeholders for MISSING ART**; **avatars and initials**; **favicon/app-icon** systems; and **SVG optimisation and inlining** so every mark ships inside a single strict-CSP, no-network HTML file.

## 2. Boundary (what this track does **not** cover)

- **Animating a mark** — stroke-draw, morph, assemble, icon transitions → **B1 Motion & animation systems**. D2 defines the static mark and its grid; B1 makes it move.
- **The colour of a mark or icon** — palette, theming, active/hover tints, dark-mode ink → **A1 Colour**. D2 says *filled vs outline* (a semantic/shape decision) and states the *contrast target* an icon must hit; A1 owns which hue satisfies it.
- **The full supply catalogue of where to source icon/logo sets** (the exhaustive licence-by-licence sourcing table, mirrors, CDNs, Iconify/registry plumbing) → **H1 Asset sourcing**. **D2 owns the design & consistency *judgment*** — grid/stroke/optical-size/corner, filled-vs-outline, single-set discipline, trademark usage — and cites H1 for where to actually download.
- **The consolidated single-file / no-network feasibility matrix across all rendering techniques** (inline SVG vs sprite vs icon-font vs canvas) → **H2 Feasibility**. D2 gives the icon/image-specific CSP verdicts inline; H2 is the master matrix.
- **Contrast/APCA conformance math and the accessibility model** (target-size law, non-text contrast thresholds) → **A5 Accessibility**. D2 references the numbers it must hit (24 px target, 3:1 non-text, 4.5:1 text-in-avatar) and applies them; A5 owns the conformance model.
- **Whether a mark reads as generic / on-brand / distinctive** → **F2 Distinctiveness**.

---

## 3. Executive rules (apply these before reading the body)

1. **One icon set. Full stop.** Pick a single family and use it everywhere. Mixing sets is the most common iconography defect — different grids, stroke weights, corner radii and terminal styles read as visual noise even when users can't name why. If you *must* borrow one missing glyph, **match the host set's grid, stroke width, corner radius and cap/join style** before shipping it (§4.3).
2. **24 px grid / 2 px stroke is the safe baseline.** The dominant outline sets (Material system icons, Lucide, Feather, Tabler, Heroicons-outline) are all drawn on a **24×24** grid. Stroke is **2 px** for most (Material, Lucide, Feather, Tabler) or **1.5 px** for the lighter look (Heroicons-outline, Iconoir). Keep **~2 dp padding** inside the box (a **20×20** live area). Never scale a 2 px-stroke icon up to 48 px without thinning the stroke — that's what optical sizing is for (§4.1–4.2).
3. **Use optical size, don't just `transform: scale()`.** A single master scaled from 20 px to 48 px keeps a *constant* stroke that looks heavy when small and spindly when large. Material Symbols exposes an **`opsz` axis (20→48 dp)** that re-weights the stroke per size; Heroicons/Carbon ship **discrete size masters** (16/20/24/32). At small UI sizes use the small master; don't just shrink the big one (§4.2).
4. **Filled = active/selected; outline = inactive/default.** This is the near-universal convention (tab bars, nav, toggles on iOS, Android, Material). Filled carries more visual weight and reads as "current"; outline reads as "available." Material Symbols encodes it as the **`FILL` axis (0→1)**. Keep the semantics consistent app-wide; never use fill purely decoratively where it could be read as state (§4.4).
5. **Icons that carry meaning need a text label and must clear 3:1 contrast.** NN/g research: only **home, print, and the magnifying-glass (search)** are near-universal; most icons are ambiguous without a label. Pair icon + visible text for navigation/actions; reserve icon-only for the tiny universal set or clearly labelled-by-context controls. A meaningful icon is a non-text UI component → **≥ 3:1 contrast** (WCAG 1.4.11) (§4.5).
6. **NEVER hand-draw or approximate a brand logo.** This is the core observed failure this track exists to kill. A hand-drawn mark is both *wrong* (proportions/legal form) and a *worse* trademark problem than using the real one. Source the real vector from a licence-clean set — **[Simple Icons](https://simpleicons.org/)** (~3,300 brand SVGs) or the brand's own press/brand kit — and inline it (§4.6).
7. **Trademark ≠ licence.** Simple Icons' SVG *data* is **CC0-1.0** (copyright waived), but its own **[DISCLAIMER](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md)** states this **does not waive the brand owners' trademark rights**. CC0 lets you copy the file; it does **not** let you imply endorsement, alter the mark, or ignore the brand's usage guidelines (clear space, min size, approved colours, no distortion). Always check the specific brand's guidelines before shipping its logo (§4.6).
8. **Render icons as inline SVG, not icon fonts or `<img>`.** Inline `<svg>` with `fill="currentColor"`/`stroke="currentColor"` is **CSP-safe, offline, themeable, accessible, and multicolour-capable**. Icon fonts need a font file (embeddable as a `data:` URI but a11y-hostile and monochrome-only) and `<img src>` needs a network fetch — **forbidden under strict-CSP/offline**. For many repeats, an inline SVG **sprite** (`<symbol>` + `<use>`) is also CSP-safe (§4.9).
9. **For missing art, generate a DETERMINISTIC placeholder from a seed — inline SVG, never a network service.** Hash the item's stable id → hue → gradient (or an identicon), emit inline SVG. Same seed ⇒ same image forever. **Do not** use `placehold.co`, `via.placeholder.com`, Gravatar, or the DiceBear HTTP API — every one is a **network request that a strict CSP blocks and offline breaks** (§4.7, worked example A).
10. **Initials avatars: hash the name for hue, pick text colour by the 0.179 luminance crossover, and you're guaranteed ≥ 4.5:1.** Choosing black-vs-white text at the relative-luminance crossover **L = 0.179** mathematically floors contrast at **≈ 4.58:1** against *any* solid background — a clean, provable win over "guess a text colour" (§4.8, worked example B).
11. **Optimise every SVG with SVGO, but keep `viewBox` and namespace your IDs.** SVGO (`preset-default`, **MIT**) strips metadata/comments and shrinks paths, typically **40–70 %**. But **`removeViewBox` breaks responsive scaling** — disable it (it is being removed from the default set; verify your version). And `cleanupIds` collisions corrupt multiple inlined SVGs sharing gradient/filter IDs — **prefix IDs per file** (§4.10).
12. **Ship a small, modern favicon/app-icon set, not fifteen legacy PNGs.** Three files cover almost everything: **`favicon.ico` @ 32×32**, an **SVG favicon**, and **`apple-touch-icon.png` @ 180×180**; add **192×192 + 512×512** PWA icons and a **512×512 maskable** icon with a **~80 % safe zone** (keep content inside the central Ø409 circle) (§4.11).
13. **Aspect ratios are a fixed vocabulary; crop to a focal point, never distort.** Use **1:1 / 4:3 / 3:2 / 16:9 / 21:9**; enforce with CSS `aspect-ratio` + `object-fit: cover` + `object-position: <focal>`. Never stretch (`object-fit: fill`) — distorted faces/products are an instant credibility hit (§4.7).
14. **Meet the target-size floor for interactive icons.** **WCAG 2.5.8 (AA)** requires a **≥ 24×24 CSS-px** target; **Apple HIG** wants **44×44 pt**, **Material** **48×48 dp**. A 20 px icon is fine *visually* but must sit in a ≥ 24 px (ideally 44–48 px) hit area via padding (§4.5).

---

## 4. Body

### 4.1 Grid & construction — the anatomy of an icon

Every coherent icon set starts from a **grid and keyline shapes** that keep glyphs optically equal in weight and area. The canonical system (Google Material, and the template most modern sets echo):

| Metric | Standard (24 dp) | Dense (20 dp) | Purpose |
|---|---|---|---|
| Grid / bounding box | **24×24 dp** | **20×20 dp** | The artboard |
| Live area | **20×20 dp** | **16×16 dp** | Where the glyph lives |
| Padding (trim) | **2 dp** all sides | **2 dp** all sides | Breathing room; prevents clipping |
| Keyline — square | **18×18 dp** | — | For square-ish glyphs (image, stop) |
| Keyline — circle | **Ø 20 dp** | — | For round glyphs (record, radio) |
| Keyline — vertical rect | **16×20 dp** | — | For tall glyphs (document, phone) |
| Keyline — horizontal rect | **20×16 dp** | — | For wide glyphs (card, monitor) |
| Corner radius (exterior) | **2 dp** | — | Interior corners stay **square** |
| Stroke width | **2 dp** | — | Constant across curves & angles |
| Touch target | **48 dp** | **40 dp** | The *hit area*, not the glyph |

Source: [Material Design — System icons (m1 spec, still the clearest keyline reference)](https://m1.material.io/style/icons.html). The keyline shapes are the trick: a circle must be *slightly larger* (Ø20) than a square (18×18) to look the *same size*, because the eye reads a circle as smaller than a square of equal bounding box. This is optical-area compensation, and it is why you cannot just draw everything to the 20×20 live box.

**Why the grid matters for adoption:** when you extend a set with a custom glyph, you inherit these numbers or the new icon will look foreign. Draw on the same grid, use the same keylines, the same 2 dp stroke, the same 2 dp corner radius.

### 4.2 Stroke weight & optical sizing — the number that breaks when you scale

A constant stroke does not survive scaling. A 2 px stroke on a 24 px icon is ~8.3 % of the box; scaled to 48 px it's a spindly ~4.2 %; shrunk to 16 px it's a clogged ~12.5 %. Two industry solutions:

1. **Variable optical-size axis (Material Symbols).** Four axes on one variable font:

   | Axis | Range | Default | What it does |
   |---|---|---|---|
   | **`opsz`** (optical size) | **20 → 48 dp** | 48 | Re-weights stroke as the icon scales, so weight looks constant at every size |
   | **`wght`** (weight) | **100 → 700** | 400 | Stroke thickness; also nudges overall size |
   | **`GRAD`** (grade) | **−25 → 200** | 0 | Fine stroke emphasis *without* changing size (finer than `wght`); use −25 on dark bg |
   | **`FILL`** | **0 → 1** | 0 | Outline (0) → solid (1); animate/toggle for state |

   Source: [Material Symbols guide (Google Fonts)](https://developers.google.com/fonts/docs/material_symbols). Set `opsz` to the *rendered* size, not a fixed value.

2. **Discrete size masters (Heroicons, Carbon).** Instead of an axis, ship separately-drawn masters per size, each optically corrected:

   | Set | Masters | Stroke / style |
   |---|---|---|
   | **Heroicons** | **24×24 outline** (2 px), **24×24 solid**, **20×20 solid** (mini), **16×16 solid** (micro) | Use outline for standard UI, mini for tight rows, micro for inline-with-text |
   | **IBM Carbon** | **16 / 20 / 24 / 32 px** | 16 & 20 tuned to 14/16 px text; 24 & 32 for larger contexts |

   Sources: [Heroicons README](https://github.com/tailwindlabs/heroicons/blob/master/README.md), [Carbon icons usage](https://carbondesignsystem.com/elements/icons/usage/).

**Decision rule:** below ~20 px use the small/mini master (or `opsz ≤ 24`); 20–32 px use the 24 master; above ~40 px use the large master (or `opsz ≥ 40`). **Never** hit a small size by `transform: scale()`-ing a large master — the stroke scales with it and clogs/thins.

**Baseline stroke reference across common free sets:**

| Set | Grid | Stroke | Cap / join | Corner radius |
|---|---|---|---|---|
| Material system icons | 24 dp | 2 dp | (filled forms) | 2 dp exterior |
| Lucide | 24 px | **2 px** | round / round | 2 px (≥8 px), 1 px (<8 px) |
| Feather | 24 px | **2 px** | round / round | (rounded) |
| Tabler | 24 px | **2 px** | round / round | (rounded) |
| Heroicons (outline) | 24 px | **1.5 px** | round | (rounded) |
| Iconoir | 24 px | **~1.5 px** *(verify)* | round | (rounded) |
| Phosphor (regular) | 256-unit canvas *(verify)* | 6 weights | round | (rounded) |

Sources: [Lucide icon design guide](https://lucide.dev/contribute/icon-design-guide), [Feather](https://github.com/feathericons/feather), [Tabler README](https://github.com/tabler/tabler-icons/blob/main/README.md). *(Exact Iconoir/Phosphor stroke values not confirmed from primary docs — flagged §8.)*

### 4.3 Consistency & the sin of mixing sets

**The rule is single-set.** A set is internally consistent by construction: one grid, one stroke, one corner language, one terminal style, one level of detail, one metaphor vocabulary. Mixing two sets imports two of each, and the eye reads the seams.

**Lucide's own consistency contract** (a good checklist for *any* set or extension): 24×24 canvas, **≥1 px padding**, **2 px centred stroke**, **round** cap & join, **2 px corner radius** (1 px for shapes <8 px), **≥2 px** gap between distinct elements, "similar optical volume" to a base circle/square, similar visual density across the set, `fill:none` + `stroke:currentColor`, **only** primitive elements (`path/line/polygon/polyline/circle/ellipse/rect`), **no transforms/filters/explicit strokes**. Source: [Lucide icon design guide](https://lucide.dev/contribute/icon-design-guide).

**If you truly must mix** (one set is missing a critical glyph), match, in priority order: (1) **grid** (redraw to 24×24), (2) **stroke width** (2 px to 2 px — a 1.5 px Heroicon dropped into a 2 px Lucide UI looks broken), (3) **cap/join** (round vs butt), (4) **corner radius**, (5) **fill logic** (don't drop a solid glyph into an outline row), (6) **detail density**. If you can't match all six, don't mix — find the glyph elsewhere in the same family or commission it on-grid.

### 4.4 Filled vs outline — the semantics

Fill is not decoration; it is **state**. The dominant convention:

| Style | Reads as | Use for |
|---|---|---|
| **Outline / line** | Inactive, default, available, secondary, lighter | Unselected tab, idle nav item, secondary action, list glyphs |
| **Filled / solid** | Active, selected, current, primary, heavier | Selected tab, current nav item, primary/confirmed state, emphasis |
| **Duotone / two-tone** | Expressive, brand, marketing | Feature grids, marketing, empty states — *not* dense UI |

The classic pattern is the **bottom tab bar**: every tab is an outline glyph; the **active** tab flips to **filled**. iOS, Android, and Material all do this; Material Symbols bakes it into the `FILL 0→1` axis so the *same* glyph carries both states (and can even animate between them — that transition is **B1's** job). Source: [Material Symbols guide](https://developers.google.com/fonts/docs/material_symbols).

**Rules:** (1) keep the mapping consistent app-wide — filled always means "current"; (2) an active filled icon and its inactive outline sibling must be the **same glyph** at the **same optical weight**, or the switch looks like two different icons; (3) don't use filled glyphs for *non-stateful* decoration where the fill could be misread as "selected"; (4) filled glyphs carry more contrast weight — verify both states independently clear 3:1.

### 4.5 Meaning, labels & target size

**Icons are ambiguous; labels disambiguate.** NN/g's research finding is blunt: beyond **home, print, and the search magnifier**, almost no icon has a stable cross-app meaning; the hamburger is the poster child for drift (menu? list? filters?). Guidance: [Icon Usability (NN/g)](https://www.nngroup.com/articles/icon-usability/).

- **Pair icon + visible text label** for navigation and primary actions. Don't hide the label behind hover (raises interaction cost, dies on touch).
- **Icon-only** is acceptable only for the near-universal set, or where an adjacent context makes it unambiguous, and always with an accessible name (`aria-label` / `<title>`).
- **The 5-second test:** if a designer can't conceive an appropriate icon for a concept within 5 seconds, an icon probably won't communicate it — use a word.

**Contrast & target size (numbers you must hit):**

| Requirement | Value | Source |
|---|---|---|
| Non-text (meaningful icon) contrast | **≥ 3:1** | WCAG 1.4.11 |
| Text baked into an avatar/badge | **≥ 4.5:1** | WCAG 1.4.3 |
| Target size (Minimum, AA) | **≥ 24×24 CSS px** | [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Target size (Enhanced, AAA) | **≥ 44×44 CSS px** | WCAG 2.5.5 |
| Apple HIG touch target | **44×44 pt** | Apple HIG |
| Material touch target | **48×48 dp** | Material |
| Carbon interactive icon target | **≥ 44 px** (e.g. 22 px glyph in 48 px) | [Carbon](https://carbondesignsystem.com/elements/icons/usage/) |

A **20 px glyph** in a **44–48 px** padded hit area is the standard reconciliation: small clean glyph, legal target.

### 4.6 Brand & product marks — sourcing, never drawing

**The failure mode this section exists to prevent:** *"Brand logos were hand-drawn approximations because no source was known."* A hand-drawn logo is wrong in proportion, wrong in legal form, and a *stronger* trademark violation than a faithful copy (you've created a distorted derivative of a protected mark). **Never do it.**

**Where the real vectors are** (design judgment here; H1 owns the full catalogue):

| Source | What | Licence (the *file*) | Trademark (the *mark*) | CSP/offline |
|---|---|---|---|---|
| **[Simple Icons](https://simpleicons.org/)** | ~3,300 popular brand/product monochrome SVGs | **CC0-1.0** (data) | **NOT waived** — brand owners retain TM | ✅ inline SVG, offline |
| **Brand's own press / brand kit** | Official full-colour logo, lockups, clear-space rules | Per brand ToS | Governed by brand guidelines | ✅ if you self-host the SVG |
| **[SVGL](https://svgl.app/)**, thesvg.org | Curated brand SVGs (often full-colour) | Per-item; verify | NOT waived | ✅ inline |

**The trademark-≠-licence rule, precisely.** A copyright licence (CC0/MIT) governs *the SVG file* — whether you may copy, modify, redistribute the vector artwork. A **trademark** governs *the mark's use in commerce* — whether your use implies affiliation/endorsement, whether you may alter it, recolour it, or violate clear-space/min-size. **CC0 waives the former and says nothing about the latter.** Simple Icons' [DISCLAIMER](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md) is explicit: the project's CC0 "doesn't mean to imply that all icons within the project are also CC0," it "cannot be held responsible for any legal activity raised by a brand," and users should consult each brand's own guidelines. Brands can request removal (removals@simpleicons.org).

**Practical usage rules for a brand mark:** (1) use the **official geometry** — inline the real SVG; (2) respect **clear space** and **minimum size** from the brand's guidelines; (3) **don't recolour or distort** unless the guidelines permit (Simple Icons ships a single-colour path + an official hex in its metadata); (4) don't imply endorsement/partnership; (5) for a "sign in with X" button, follow that provider's *specific* brand button rules (they're strict). When in doubt for a *generated/demo* UI, prefer a **generic placeholder mark** over a real brand you can't clear.

### 4.7 Imagery — aspect ratios, cropping, focal points, and missing art

**Aspect ratios are a closed vocabulary.** Pick from a fixed set and apply consistently:

| Ratio | Typical use |
|---|---|
| **1:1** | Avatars, product thumbnails, social tiles |
| **4:3** | Classic photo, cards, older cameras |
| **3:2** | Editorial/photography (35 mm frame) |
| **16:9** | Video, heroes, wide media |
| **21:9** | Cinematic banners |

**Enforce with CSS, crop to a focal point, never distort:**

```css
.media {
  aspect-ratio: 16 / 9;            /* reserves space, prevents layout shift */
  width: 100%;
}
.media img {
  width: 100%; height: 100%;
  object-fit: cover;              /* fill the box, crop overflow — never `fill` */
  object-position: 50% 35%;       /* focal point: bias up for faces */
}
```

`object-fit: cover` crops; `object-position` chooses *what* survives the crop (the focal point — a face, a product). **Never** `object-fit: fill` (distorts) or fixed `width`+`height` on a non-1:1 source. Reserve the box with `aspect-ratio` so a slow/missing image doesn't shift layout.

**Missing art → deterministic placeholder (never a blank box, never a network service).** When there is no image, generate one *deterministically from a stable seed* so the same entity always gets the same placeholder, and emit it as **inline SVG**:

- **Hash → hue → gradient block** (worked example A) — clean, brand-neutral, infinite variety, zero bytes over the wire.
- **Identicon** (GitHub-style symmetric grid) — good for anonymous/technical entities (commits, hashes, wallets).
- **Blurred dominant colour / low-poly** — if you *do* have the image but it's loading, a hashed solid or a tiny inline gradient is a fine LQIP.

**Anti-pattern (CSP + offline killer):** `placehold.co`, `via.placeholder.com`, `picsum.photos`, `loremflickr`, **Gravatar**, and the **DiceBear HTTP API** are all **network requests**. A strict CSP with no `img-src` allowance blocks them, and an offline single file shows broken images. Generate locally, inline.

### 4.8 Avatars & initials

Priority order for a user avatar: **(1) real uploaded photo** (self-hosted / inlined) → **(2) initials on a hashed colour** → **(3) deterministic identicon/pattern**. Fallbacks 2 and 3 must be **deterministic** (same user ⇒ same avatar) and **inline** (CSP-safe).

**Initials rules:** take 1–2 initials (first + last word), uppercase; centre optically (`dy≈0.35em`); font-size ≈ **40 %** of the box; use `system-ui` so no font file is needed. **Colour from a hash of the stable id** (name/email/user-id) so it's stable, and **choose the text colour to guarantee contrast** — see the crossover result below (worked example B).

**Common avatar sizes:** **24 px** (dense lists/comments), **32 px** (rows/tables), **40 px** (default/list-item), **48 px** (cards), **64–96 px** (profile headers), **128 px+** (profile pages). Round with `border-radius: 50%` or `rx=size/2` on the SVG rect.

**The contrast guarantee (why the crossover works).** For a solid background of relative luminance `L`, white text gives contrast `1.05/(L+0.05)` (falls as L rises) and black text gives `(L+0.05)/0.05` (rises with L). Picking the *better* of the two is worst exactly where they're equal: `(L+0.05)² = 0.0525 → L = 0.179`, where both equal **≈ 4.58:1**. So **`text = (luminance(bg) > 0.179) ? black : white`** floors contrast at ~4.58:1 against **any** background — clearing WCAG 4.5:1 automatically. No per-colour tuning needed.

### 4.9 Rendering icons — inline SVG wins under strict CSP

| Technique | CSP/offline | Themeable | Multicolour | A11y | Verdict |
|---|---|---|---|---|---|
| **Inline `<svg>`** (`currentColor`) | ✅ no network, no eval | ✅ via CSS | ✅ | ✅ `role`/`<title>`/`aria-label` | **Default choice** |
| **Inline SVG sprite** (`<symbol>`+`<use>`) | ✅ | ✅ | ✅ | ✅ | Best for many repeats of few glyphs |
| **Icon font** (`@font-face`) | ⚠️ needs font file; embeddable as `data:` URI but heavy | ✅ (color only) | ❌ monochrome | ⚠️ ligature/pseudo hacks | Avoid; legacy |
| **`<img src=icon.svg>`** | ❌ network fetch | ❌ | ✅ | ✅ alt | **Blocked offline/CSP** |
| **CSS `mask-image: url(data:…)`** | ✅ if `data:` inlined | ✅ (single colour) | ❌ | n/a (decorative) | OK for one-colour decorative glyphs |

**Inline SVG accessibility:** decorative → `aria-hidden="true"` + `focusable="false"`; meaningful → `role="img"` + `<title>` or `aria-label`. Set `fill="currentColor"` (filled sets) or `stroke="currentColor"` (outline sets) so one CSS `color` themes it — this is also how you satisfy A1's tinting without touching D2's geometry.

### 4.10 SVG optimisation & inlining

Raw exported SVGs are bloated: editor metadata, comments, redundant precision, wrapping groups, absolute paths. **[SVGO](https://svgo.dev/) (MIT)** fixes this; `preset-default` runs ~33 plugins (removeDoctype, removeComments, removeMetadata, cleanupIds, convertPathData, mergePaths, …). Typical shrink **40–70 %**. Source: [SVGO preset-default](https://svgo.dev/docs/preset-default/).

**Two footguns that corrupt output — configure around them:**

1. **`removeViewBox` breaks responsive scaling.** Without `viewBox`, `width/height:100%` no longer scales the artwork — it clips. It has historically shipped in `preset-default` and is a notorious footgun; it is being removed from the defaults ([PR #1461](https://github.com/svg/svgo/pull/1461), targeted for a v4 line — **verify your installed version**). **Always keep `viewBox`:**

   ```json
   { "plugins": [ { "name": "preset-default",
       "params": { "overrides": { "removeViewBox": false } } } ] }
   ```

2. **`cleanupIds` collisions corrupt multiple inlined SVGs.** When you inline several SVGs into one HTML file, shared IDs (`id="a"`, gradient/clip/filter refs) **collide**, and the browser resolves `url(#a)` to the *first* match — so gradients/masks bleed across icons. Fix: prefix IDs per file, e.g. `cleanupIds: { prefix: 'ic-heart-' }`, or `prefixIds`. This is the #1 bug when inlining logo/illustration SVGs with gradients.

**Other tips:** cap `cleanupNumericValues` precision at 2–3 decimals; keep `<title>` for meaningful icons (add `removeTitle: false` if your pipeline strips it); strip `width`/`height` attributes so CSS sizes the icon (but **keep `viewBox`**). SVGO is **MIT** (source); docs/assets CC-BY-4.0.

### 4.11 Favicons & app icons

The modern minimal set (per [Evil Martians, *How to Favicon*](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs)):

| File | Size | Role |
|---|---|---|
| `favicon.ico` | **32×32** (optionally + 16×16 layer) | Legacy browsers, bookmarks |
| `icon.svg` | any (vector) | Modern browsers; supports **light/dark via media query inside the SVG** |
| `apple-touch-icon.png` | **180×180** | iOS home screen |
| `icon-192.png` | **192×192** | PWA manifest |
| `icon-512.png` | **512×512** | PWA splash/install |
| `icon-mask.png` | **512×512 maskable** | Android adaptive; keep content in **~80 % safe zone** (central **Ø409** circle) |

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

**Maskable safe zone:** Android launchers crop the icon to varied shapes (circle, squircle, rounded square). Keep all essential content within the central **80 %** (radius 40 % from centre; the Ø409/512 circle). Verify at maskable.app. **CSP/offline note:** for a *single-file* demo, an **inline SVG favicon** via `<link rel="icon" href="data:image/svg+xml,…">` needs no external file at all — the CSP-cleanest option.

---

## 5. Options catalogue

"CSP-safe" = survives a strict Content-Security-Policy with **no** external requests and **no** `eval`, fully inlined/offline.

### 5A. General-purpose icon sets (FREE + self-hostable only)

Columns: **what · when · when NOT · licence · where · CSP/feasibility · pitfalls.**

| Set | What | When to use | When NOT | Licence | Where | CSP/offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Material Symbols** | Variable font, 4 axes (opsz/wght/GRAD/FILL), ~3,600 glyphs, 3 styles | You want true optical sizing + fill-state on one master; Google-ecosystem look | Ultra-tight byte budget (variable font is large) | **Apache-2.0** (attribution welcomed, not required) | [Google Fonts](https://fonts.google.com/icons) | ✅ Inline the *SVGs*; the variable **font** is embeddable but heavy | Font route needs the file; prefer per-glyph SVG export; huge if you ship the whole font |
| **Material system icons** (classic) | 2,000+ filled/outlined static SVGs, 24 dp grid | Simple, proven, on-grid, static | You need many weights | **Apache-2.0** | [github](https://github.com/google/material-design-icons) | ✅ inline SVG | Older set; fewer glyphs than Symbols |
| **Lucide** | Community fork of Feather, ~1,600+ icons, 24/2 px | Clean outline UI; best-maintained Feather line; active | You need filled variants for everything | **ISC** (+ some Feather-derived icons **MIT © Cole Bemis**) | [lucide.dev](https://lucide.dev/) | ✅ inline SVG, `currentColor` | Keep both copyright notices in source; mostly outline-only |
| **Feather** | The original 287 minimalist outline icons, 24/2 px | Tiny, elegant, ubiquitous look | You need breadth or fills | **MIT © feathericons** | [github](https://github.com/feathericons/feather) | ✅ inline SVG | Small set; **less active** than Lucide — prefer Lucide for new work |
| **Heroicons** | By Tailwind Labs; 24 outline (1.5 px), 24/20/16 solid | Tailwind projects; crisp discrete size masters | You want a single variable master | **MIT © Tailwind Labs** | [heroicons.com](https://heroicons.com/) | ✅ inline SVG | ~300 glyphs (narrower); mix of stroke widths across sizes |
| **Tabler** | 6,100+ icons (5,000+ outline, 1,000+ filled), 24/2 px | You need breadth + matching fills | Byte budget for the whole set | **MIT** | [tabler.io/icons](https://tabler.io/icons) | ✅ inline SVG | Huge set — import per-glyph, never the bundle |
| **Phosphor** | 6 weights (thin/light/regular/bold/fill/duotone), ~1,200 | You want weight range + duotone in one family | Strict single-weight minimalism | **MIT © Phosphor Icons** | [phosphoricons.com](https://phosphoricons.com/) | ✅ inline SVG | Exact grid/stroke not in primary docs (§8); pick ONE weight and stick to it |
| **Bootstrap Icons** | ~2,000 icons, 16 px base grid | Bootstrap projects | Non-Bootstrap 24 px UIs (grid mismatch) | **MIT** | [icons.getbootstrap.com](https://icons.getbootstrap.com/) | ✅ inline SVG | 16 px base — rescale carefully into 24 px systems |
| **Iconoir** | 1,600+ icons, 24 px, ~1.5 px | Light, thin-stroke aesthetic | You need 2 px weight to match a heavier UI | **MIT** | [iconoir.com](https://iconoir.com/) | ✅ inline SVG | Exact stroke unconfirmed (§8) |
| **IBM Carbon** | 2,600+ icons, 16/20/24/32 masters | Enterprise/data-dense UIs; Carbon DS | Playful/consumer aesthetic | **Apache-2.0** | [github](https://github.com/carbon-design-system/carbon/tree/main/packages/icons) | ✅ inline SVG | Neutral/corporate tone; discrete masters, no variable axis |
| **Font Awesome (Free)** | ~2,000 free icons, huge brand-icon coverage | You need brand glyphs + UI in one | You want a single permissive licence | **Tri-licence:** icons **CC BY 4.0**, fonts **SIL OFL 1.1**, code **MIT** | [fontawesome.com](https://fontawesome.com/) | ✅ inline SVG | **CC BY needs attribution** (satisfied by the embedded comment — keep it); many glyphs are Pro-only |
| **~~SF Symbols~~** | Apple's 6,900+ system symbols | **Apple platforms only** | **Web / any non-Apple use** | **Apple licence — NOT redistributable, Apple-OS UI mock-ups only** | Apple | ❌ **Excluded** — cannot ship on web | Licence forbids web/cross-platform & redistribution ([ref](https://apple.lukezilioli.com/wishlist/sf-symbols-web-license/)) |

*Full sourcing/mirror/CDN catalogue → **H1**. D2's recommendation: default to **Lucide** (outline UI) or **Material Symbols** (need optical sizing + fill states); **Tabler** or **Phosphor** when you need breadth or weights.*

### 5B. Brand/product-mark sources

| Source | What | When | When NOT | Licence (file) | Trademark (mark) | CSP | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Simple Icons** | ~3,300 monochrome brand SVGs + official hex | You need a real product logo, inlined | Full-colour lockups; brands that requested removal | **CC0-1.0** (data) | **NOT waived** — owner retains TM | ✅ inline | Monochrome only; follow brand guidelines; check per-brand |
| **Brand press/brand kit** | Official logo, colour lockups, clear-space rules | Production use of a specific brand | You can't accept the brand's ToS | Per brand | Governed by guidelines | ✅ self-host SVG | Each brand differs; "sign in with X" has strict button rules |
| **SVGL / thesvg.org** | Curated, often full-colour brand SVGs | You need colour marks | Licence unclear on an item | Per-item — **verify** | NOT waived | ✅ inline | Verify each item's provenance/licence |
| **Generic placeholder mark** (you draw a *neutral* shape) | An abstract non-brand logo for demos | Demo/mock UIs where no real brand is cleared | Representing a *specific real* company | Yours | n/a | ✅ inline | Must be clearly *generic*, not an approximation of a real logo |

**Never:** hand-draw a real brand's logo from memory/screenshot. It's wrong and a worse TM problem than a faithful copy (§4.6).

### 5C. Deterministic placeholder / missing-art approaches

| Approach | What | When | When NOT | Licence | Where | CSP | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Hash→hue→gradient (inline SVG)** | Seed → hue → 2-stop gradient block | Missing image/thumbnail; brand-neutral | You need recognisable content | Your code | Worked example A | ✅ inline, deterministic | Namespace gradient IDs (§4.10) |
| **jdenticon** | Deterministic identicon from string hash | Anonymous/technical entities | Human avatars (looks abstract) | **MIT** | [jdenticon.com](https://jdenticon.com/) | ✅ client-side SVG, no network | Ships as a JS lib; inline the script (no eval) |
| **boring-avatars** | 6 styles (marble/beam/pixel/sunset/ring/bauhaus) from a name/seed | Pretty, colourful gradient avatars | You need real initials/text | **MIT** | [github](https://github.com/boringdesigners/boring-avatars) | ✅ SVG, no network (core); it's a React lib — port the algo to vanilla for a single file | Optional **paid API** is network — don't use it |
| **DiceBear (self-hosted core)** | 30+ avatar styles, offline core | Rich avatar variety, self-hosted | The **HTTP API** (network) | **Core code MIT**; **each style its own licence** (CC0 / CC BY 4.0 / custom) | [dicebear.com](https://www.dicebear.com/licenses/) | ✅ *only* if you use the offline core + a permissively-licensed style; ❌ the hosted API | **Per-style licence varies** — CC BY styles need attribution; check before shipping |
| **Identicon (roll-your-own)** | Symmetric 5×5 grid from hash | Full control, zero deps | You want polish | Your code | Worked example C | ✅ inline | Basic look |
| **Network placeholder services** | placehold.co, Gravatar, DiceBear API, picsum | *Never* under strict CSP/offline | — | n/a | — | ❌ **network — blocked** | Broken images offline; a CSP violation |

### 5D. SVG-optimisation & inlining tools

| Tool | What | When | When NOT | Licence | Where | CSP relevance | Pitfalls |
|---|---|---|---|---|---|---|---|
| **SVGO** | The standard optimiser; `preset-default` ~33 plugins | Every SVG before inlining | You need to keep editor metadata | **MIT** (source) | [svgo.dev](https://svgo.dev/) | Produces the small inline SVGs the sandbox needs | **Disable `removeViewBox`**; **prefix IDs** to avoid inline collisions (§4.10) |
| **SVGOMG** | Browser GUI for SVGO | One-off manual optimise | CI pipelines (use CLI) | **MIT** | [jakearchibald.github.io/svgomg](https://jakearchibald.github.io/svgomg/) | Same output as SVGO | Same footguns as SVGO |
| **svgcleaner** | Rust optimiser, aggressive | Batch, speed | You need SVGO's plugin ecosystem | **MIT / GPL-3.0 (dual)** *(verify)* | [github](https://github.com/RazrFalcon/svgcleaner) | Small inline SVGs | Less maintained than SVGO |
| **`prefixIds` / `cleanupIds` (SVGO plugins)** | Namespace IDs per file | Inlining many SVGs with gradients/filters | Single isolated SVG | MIT (SVGO) | (SVGO) | **Essential** for multi-SVG single-file | Forgetting this = gradients bleed across icons |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Hand-drawn/approximated logo** | Logo proportions look "off"; not pixel-faithful to the real mark | Source the real SVG (Simple Icons / brand kit) and inline it; never approximate (§4.6) |
| **Mixed icon sets** | Some glyphs 1.5 px, some 2 px; some round caps, some butt; inconsistent detail | Standardise on ONE set; if truly extending, match grid+stroke+cap+radius+fill (§4.3) |
| **Stroke clogs/thins on scale** | 2 px icon scaled to 48 px looks spindly, or to 16 px looks clogged | Use optical size (`opsz`) or the correct discrete master; don't `transform:scale()` (§4.2) |
| **Filled where it means "selected"** | A decorative filled glyph reads as an active tab | Reserve fill for state; keep filled=active / outline=inactive consistent (§4.4) |
| **Icon-only, unlabeled, ambiguous** | Users hesitate/misclick; support tickets ask "what's this button?" | Add visible text labels; icon-only only for home/print/search (§4.5) |
| **Icon target too small** | Hit area <24 px; mis-taps on mobile | Pad glyph into a ≥24 px (ideally 44–48 px) target (§4.5) |
| **Broken images offline / CSP error** | Placeholder/avatar via placehold.co / Gravatar / DiceBear API fails; console CSP block | Generate deterministic inline SVG locally (§4.7, examples A–C) |
| **Random (non-deterministic) placeholders** | Same user's avatar colour changes each load | Seed from a stable id (name/email/user-id); hash → colour (§4.8) |
| **Unreadable initials avatar** | Light text on light hashed bg; fails 4.5:1 | Pick text by luminance crossover **0.179** → guaranteed ≥4.58:1 (§4.8, example B) |
| **SVG won't scale after optimise** | Icon clips/fixed-size after SVGO | `removeViewBox:false`; keep `viewBox`, drop width/height (§4.10) |
| **Gradients bleed between inlined SVGs** | Icon B shows icon A's gradient; duplicate `id`s | Prefix IDs per file (`cleanupIds`/`prefixIds`) (§4.10) |
| **Icon font under strict CSP** | Boxes/tofu; font file blocked or a11y broken | Switch to inline SVG with `currentColor` (§4.9) |
| **Distorted images** | Squashed faces/products | `object-fit: cover` + `object-position` focal point; never `fill` (§4.7) |
| **Layout shift on image load** | Content jumps as images arrive | Reserve space with `aspect-ratio` (§4.7) |
| **Trademark misuse** | Recoloured/distorted brand logo; implied endorsement | Follow brand guidelines; CC0≠TM waiver; use faithful mark or generic placeholder (§4.6) |
| **CC BY attribution dropped** | Font Awesome Free / CC BY DiceBear style, comment stripped | Keep the embedded attribution comment; check per-style licence (§5A, §5C) |
| **SF Symbols on the web** | Copied Apple symbols into a web UI | Remove — licence forbids it; swap to Lucide/Material/Tabler (§5A) |

---

## 7. Pre-flight checklist (run before shipping any mark)

- [ ] **One icon set** across the whole UI; any extension matches grid + stroke + cap/join + corner + fill logic (§4.3).
- [ ] Icons drawn on a **24 px grid** with **~2 dp padding**; stroke consistent (2 px or the set's 1.5 px) (§4.1).
- [ ] Small/large sizes use **optical size** (`opsz`) or the correct **discrete master**, not `transform:scale()` (§4.2).
- [ ] **Filled = active/selected, outline = inactive** applied consistently; state glyphs are the same shape at the same weight (§4.4).
- [ ] Meaningful icons have **visible text labels** (or an unambiguous context) and an accessible name; icon-only limited to the universal set (§4.5).
- [ ] Interactive icons sit in a **≥ 24 px** (ideally 44–48 px) target and clear **3:1** contrast (§4.5).
- [ ] **No hand-drawn logos.** Every brand mark is the **real inlined SVG** from a licence-clean source (§4.6).
- [ ] **Trademark checked** separately from file licence; brand guidelines (clear space, min size, no distortion) respected; CC0≠TM waiver noted (§4.6).
- [ ] Images use a **fixed aspect ratio** (1:1/4:3/3:2/16:9/21:9) via `aspect-ratio`; crop with `object-fit:cover` + focal `object-position`; never `fill` (§4.7).
- [ ] **Missing art → deterministic inline-SVG placeholder** from a stable seed; **no** placehold.co/Gravatar/DiceBear-API/picsum (§4.7).
- [ ] Avatars deterministic (hash of stable id); initials-avatar text colour chosen by **luminance crossover 0.179** → ≥ 4.58:1 (§4.8).
- [ ] Icons rendered as **inline SVG** (`currentColor`), decorative `aria-hidden`, meaningful `role="img"`+title; no icon fonts, no `<img src>` (§4.9).
- [ ] Every SVG **SVGO-optimised** with **`removeViewBox:false`** and **IDs prefixed** per file (§4.10).
- [ ] **Favicon/app-icon set**: 32×32 ico, SVG favicon, 180×180 apple-touch, 192/512 PWA + 512 maskable with **80 % safe zone** (§4.11).
- [ ] Every asset source has **licence + trademark note + CSP verdict** recorded; **CC BY** attributions kept; **SF Symbols excluded** (§5).

---

## 8. Open questions / unverified

- **SVGO `removeViewBox` default status is version-dependent.** It has historically shipped in `preset-default` (a footgun) and is being removed ([PR #1461](https://github.com/svg/svgo/pull/1461), targeted for a v4 line). Regardless of version, **explicitly set `removeViewBox:false`** — don't rely on the default. *Verify against your installed SVGO version.*
- **Exact stroke widths for Iconoir and Phosphor** were not confirmed from primary design docs (Iconoir stated ~1.5 px from secondary sources; Phosphor uses a 6-weight system on a canvas commonly cited as 256-unit but not verified here). Pull the real values from each set's design doc before matching a custom glyph. *(Flagged.)*
- **Remix Icon licence is ambiguous in current sources.** Long documented as **Apache-2.0**, but a fetch of its LICENSE surfaced a possible custom "Remix Icon License v1.0" (attribution appreciated, not required). **Verify the current [LICENSE file](https://github.com/Remix-Design/RemixIcon/blob/master/License) before relying on it.**
- **svgcleaner licence (MIT/GPL-3.0 dual)** stated from memory, not re-verified this pass — confirm before bundling.
- **Material Symbols `GRAD` range** cited as −25→200 from the Google Fonts guide; the negative/low-emphasis end is documented by example rather than a single canonical min — treat as approximate.
- **Maskable safe-zone geometry** (central Ø409 within 512, ~80 %) is from Evil Martians / the maskable-icon spec; launcher crop shapes vary — always spot-check at maskable.app.
- **Per-brand trademark terms change.** Simple Icons explicitly disclaims liability and notes brands may request removal; a logo present today may be gone or restricted tomorrow. **Re-verify any specific brand's guidelines at build time.**
- **NN/g "universal icon" set** (home/print/search) reflects their reported testing; specific universality can shift by audience/locale — treat as a strong heuristic, not a constant.

---

## 9. Sources

**Icon construction & semantics (primary):**
- [Material Design — System icons keylines & grid (m1)](https://m1.material.io/style/icons.html) — 24 dp grid, 20×20 live area, keyline shapes, 2 dp stroke/radius, 48 dp target.
- [Material Symbols guide (Google Fonts)](https://developers.google.com/fonts/docs/material_symbols) — opsz 20→48, wght 100→700, GRAD, FILL axes; fill-as-state.
- [Lucide — Icon design guide](https://lucide.dev/contribute/icon-design-guide) — 24×24, 2 px stroke, round caps, 2/1 px radius, consistency contract.
- [Heroicons README](https://github.com/tailwindlabs/heroicons/blob/master/README.md) — 24 outline/solid, 20 mini, 16 micro; MIT.
- [Feather (github)](https://github.com/feathericons/feather) — 24×24, 2 px, round; MIT; parent of Lucide.
- [Tabler README](https://github.com/tabler/tabler-icons/blob/main/README.md) — 6,146 icons, 24×24, 2 px; MIT.
- [IBM Carbon — Icons usage](https://carbondesignsystem.com/elements/icons/usage/) — 16/20/24/32 masters, ≥44 px target, 4.5:1; Apache-2.0.
- [NN/g — Icon Usability](https://www.nngroup.com/articles/icon-usability/) — labels required, universal-icon set, 5-second test.

**Brand marks & trademark:**
- [Simple Icons](https://simpleicons.org/) and its [DISCLAIMER.md](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md) — CC0 data, trademark NOT waived, liability disclaimer, removals process.
- [SF Symbols web-licence discussion](https://apple.lukezilioli.com/wishlist/sf-symbols-web-license/) — Apple-platform-only restriction; not for web.

**SVG optimisation:**
- [SVGO — preset-default plugin list](https://svgo.dev/docs/preset-default/) — 33 plugins; MIT source.
- [SVGO PR #1461 — remove removeViewBox from defaults](https://github.com/svg/svgo/pull/1461) — why viewBox removal is harmful; slated for v4.

**Placeholders & avatars:**
- [jdenticon](https://jdenticon.com/) — MIT, deterministic identicon, client-side SVG, no network.
- [boring-avatars (github)](https://github.com/boringdesigners/boring-avatars) — MIT, deterministic from seed, 6 styles, inline SVG.
- [DiceBear — Licenses](https://www.dicebear.com/licenses/) — core code MIT; each style its own licence (CC0/CC BY 4.0/custom).

**Favicons & imagery:**
- [Evil Martians — How to Favicon](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) — 32 ico + SVG + 180 apple-touch + 192/512 PWA + 512 maskable, 80 % safe zone.
- [WCAG 2.2 — 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — ≥24×24 CSS px (AA); 2.5.5 44×44 (AAA).

**Licence cross-reference (verified this pass):** Material Symbols/Icons **Apache-2.0**; Lucide **ISC** (+ Feather-derived **MIT © Cole Bemis**); Feather **MIT**; Heroicons **MIT**; Tabler **MIT**; Phosphor **MIT**; Bootstrap Icons **MIT**; Iconoir **MIT**; Carbon **Apache-2.0**; Font Awesome Free **CC BY 4.0 (icons) / SIL OFL 1.1 (fonts) / MIT (code)**; Simple Icons **CC0-1.0 (data), trademark not waived**; SVGO **MIT**; jdenticon **MIT**; boring-avatars **MIT**; DiceBear **MIT core / per-style varies**; Remix Icon **Apache-2.0 (verify — see §8)**; SF Symbols **Apple licence, web use forbidden**.

---

## Appendix — Worked examples (copyable, CSP-safe, offline)

### A. Deterministic hash → hue → gradient placeholder (inline SVG, no network, no eval)

Same seed ⇒ same image, forever. Note the **per-seed gradient ID** (avoids the collision bug from §4.10).

```html
<div class="ph" data-seed="invoice-8841" style="aspect-ratio:16/9;width:240px"></div>

<script>
// djb2-style string hash -> non-negative int
function hashSeed(s){let h=5381;for(let i=0;i<s.length;i++){h=((h<<5)+h)+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function placeholderSVG(seed,w,h){
  const n=hashSeed(seed);
  const hue=n%360, hue2=(hue+38)%360;
  const id='g'+n.toString(36);                 // unique id per seed -> no cross-SVG bleed
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"
      width="100%" height="100%" role="img" aria-label="placeholder image">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 62% 58%)"/>
      <stop offset="1" stop-color="hsl(${hue2} 60% 42%)"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
  </svg>`;
}
document.querySelectorAll('.ph').forEach(el=>{
  el.innerHTML = placeholderSVG(el.dataset.seed||'anon', 160, 90);
});
</script>
```

**No-JS / build-time variant** (bake the hue at generation time, pure CSS gradient):

```html
<!-- hue computed by your generator from the seed, written into the style -->
<div class="ph" style="aspect-ratio:16/9;
  background:linear-gradient(135deg, hsl(212 62% 58%), hsl(250 60% 42%));"></div>
```

### B. Initials avatar with hash-derived colour — guaranteed ≥ 4.58:1 contrast

Text colour chosen by the **0.179 luminance crossover** (§4.8): floors contrast at ~4.58:1 against any solid background.

```html
<span class="avatar" data-name="Ada Lovelace"></span>

<script>
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
function initials(name){return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');}
// sRGB relative luminance (0..1) from 0..255 channels
function lum(r,g,b){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
function hslToRgb(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),
  f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[255*f(0),255*f(8),255*f(4)];}
function avatar(name,size){
  const h=hash(name)%360, s=60, l=42;                  // fixed S/L; hue from hash
  const [r,g,b]=hslToRgb(h,s,l);
  const fg = lum(r,g,b) > 0.179 ? '#141414' : '#ffffff';  // crossover -> >=4.58:1 guaranteed
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"
      width="${size}" height="${size}" role="img" aria-label="${name}">
    <rect width="${size}" height="${size}" rx="${size/2}" fill="hsl(${h} ${s}% ${l}%)"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="${fg}"
      font-family="system-ui,-apple-system,sans-serif" font-size="${size*0.4}"
      font-weight="600">${initials(name)}</text>
  </svg>`;
}
document.querySelectorAll('.avatar').forEach(el=>el.innerHTML=avatar(el.dataset.name,40));
</script>
```

### C. Roll-your-own identicon — symmetric 5×5 grid from a hash (inline SVG)

Deterministic, mirrored (left/right symmetry reads as a "face/badge"), zero dependencies.

```html
<span class="ident" data-seed="user-4471"></span>

<script>
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function identicon(seed,size){
  const n=hash(seed), hue=n%360, cell=size/5;
  let rects='';
  for(let x=0;x<3;x++)for(let y=0;y<5;y++){            // fill left 3 cols, mirror to right
    if((n>>(x*5+y))&1){
      for(const cx of (x===2?[2]:[x,4-x])){
        rects+=`<rect x="${cx*cell}" y="${y*cell}" width="${cell}" height="${cell}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"
      width="${size}" height="${size}" role="img" aria-label="identicon">
    <rect width="${size}" height="${size}" fill="#eef0f3"/>
    <g fill="hsl(${hue} 55% 45%)">${rects}</g>
  </svg>`;
}
document.querySelectorAll('.ident').forEach(el=>el.innerHTML=identicon(el.dataset.seed,40));
</script>
```

### D. SVGO config that survives inlining (keep viewBox, prefix IDs)

```json
{
  "plugins": [
    { "name": "preset-default",
      "params": { "overrides": {
        "removeViewBox": false,
        "cleanupIds": { "prefix": "ic-heart-" }
      } } },
    { "name": "removeDimensions" }
  ]
}
```

*(`removeDimensions` strips `width`/`height` so CSS sizes the icon while `viewBox` is preserved for scaling.)*
