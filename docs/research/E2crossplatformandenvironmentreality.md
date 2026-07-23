# E2 — Cross-platform & environment reality

*Design-intelligence reference. Track E2 of the registry research map. Written to be read by the build agent **before** it emits a single-file HTML/CSS variant, and by a human owner auditing that output. This track owns **browser/engine reality** and **the strict-CSP offline-sandbox gotcha list** — the "what actually breaks in the box, and the @supports-gated way to ship it anyway" knowledge that other tracks reference.*

*All support/Baseline numbers are current to **July 2026** and are **TIME-SENSITIVE** — every one is flagged and every one ships with a fallback regardless of its status. Re-check at build time against the linked primary source (caniuse / web-features / MDN).*

---

## 1. Scope line

This track owns **the environment the design runs in**: which modern-CSS features are actually safe *today* and how each degrades; how the same CSS renders differently across engines (Blink / WebKit / Gecko) and OSes (macOS / Windows / Linux / Android); how fonts antialias differently; how colour is managed and how to reach wide-gamut P3 without breaking sRGB; HiDPI/retina crispness; dark-mode plumbing that avoids the flash of wrong theme with **no network and no JS**; print; and — the load-bearing part — **what breaks inside a STRICT-CSP, no-network, no-eval single-file sandbox and the exact workaround for each.** Every verdict is stated plainly with an `@supports` gate and a fallback.

## 2. Boundary (what this track does **not** cover)

- **Accessibility *conformance* of environment prefs** — `prefers-contrast`, `forced-colors`/Windows High Contrast, `prefers-reduced-motion` as a WCAG obligation, contrast math → **A5 Accessibility**. E2 *detects* these media features and wires the plumbing; A5 owns the conformance model and the required responses.
- **Performance budgets & measurement** — Lighthouse, Core Web Vitals, bundle/byte budgets, layer counts, profiling → **E1 Performance**. E2 says *whether a feature exists and degrades*; E1 says *whether it's fast enough*.
- **How to *build* a material** — the construction of a glassmorphism panel, a shadow system, a gradient mesh, a glow → **A4 Shape, depth & material**. E2 tells you `backdrop-filter` is Newly-Available-not-Widely and how to gate it; A4 tells you what to put behind the blur.
- **The full technique-choice feasibility matrix** — CSS vs SVG vs Canvas vs WebGL vs JS for a given effect, and hand-inlining a React/Tailwind snippet down to vanilla → **H2 Feasibility**. **The split:** *E2 owns browser/engine reality + the CSP-sandbox breakage list* (this document); *H2 owns which technique to pick* once you know what the box allows.
- **Motion specifics** — durations, easing, scroll-driven *choreography*, reduced-motion substitution patterns → **B1 Motion**. E2 gives the *support/CSP verdict* on `animation-timeline`; B1 gives the motion design.

MECE check: a claim belongs to E2 iff it is about *"will this run, and how does it look/degrade, in a real browser or the sandbox"* — not *"is it fast" (E1)*, *"is it accessible" (A5)*, *"how is it built" (A4)*, or *"which tool" (H2)*.

---

## 3. Executive rules (apply these before reading the body)

1. **"Baseline Newly Available" is not "safe for everyone."** Baseline **Widely Available** = supported in every major engine for **≥30 months** (safe to use unguarded). Baseline **Newly Available** = works in the *current* version of all major engines but **not older versions still in the wild** — guard it. **Limited availability** = at least one major engine is missing — *always* guard + fallback. Read every row of §5 through this lens. ([web.dev Baseline](https://web.dev/baseline), [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/))
2. **Gate every non-Widely feature with `@supports` and ship the fallback first.** Write the sRGB/solid/static declaration as the base rule; put the modern feature inside `@supports (feature: value){…}`. Property-value `@supports` covers most; use `@supports selector(:has(*))` for selectors. Where CSS can't feature-detect (`@property`, `popover`, custom-element upgrades) fall back to a JS check (`CSS.supports(...)`, `'popover' in HTMLElement.prototype`) — still CSP-safe, no eval.
3. **The cascade *is* a fallback for colour and many values.** A browser drops a declaration it can't parse and keeps the previous one. `color:#a33; color:oklch(55% .2 25);` gives sRGB browsers the hex and modern browsers the oklch — no `@supports` needed for that class of override. Use this for P3/oklch/relative-colour first; reserve `@supports` for *properties* that change layout or need a companion rule.
4. **In the strict-CSP offline sandbox, three things are simply gone: the network, `eval`, and WASM-compile.** No remote fonts/CSS/JS/images, no `eval`/`new Function`/`setTimeout("string")`, and no `WebAssembly.instantiate` unless the policy carries `'wasm-unsafe-eval'`. Design as if those don't exist. Everything is inlined; every asset is a `data:` URI; every "library" is plain vanilla JS. (§4.3, §5-CSP.)
5. **`'self'` does not include `data:` — you must allowlist the scheme.** A policy of `img-src 'self'` **blocks** `<img src="data:…">`; you need `img-src 'self' data:`. Same for `font-src data:` (base64 `@font-face`) and `media-src data:`. If you don't control the header, *test what the sandbox actually sets* — this is the single most common inlined-asset failure. ([MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP))
6. **Inline `<style>`/`<script>` need `'unsafe-inline'` OR a hash — nonces are impossible in a static file.** A nonce must be fresh per HTTP response and injected server-side; a single self-contained file served statically can't produce one. So a strict policy either allows `style-src/script-src 'unsafe-inline'` (common, weaker) or requires a **SHA-256 hash per block** (`'sha256-…'`) — which changes every time you edit that block. Know which regime the sandbox uses before you rely on inline blocks. ([MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP))
7. **Inline `style="…"` attributes are governed separately (`style-src-attr`) and a hash-based policy blocks them.** AI-generated markup leans on inline style attributes; under a strict, hash-based `style-src` (no `'unsafe-inline'`) those attributes are dropped, silently un-styling the page. Prefer a single hashed `<style>` block + classes; if you must keep inline styles, the policy needs `'unsafe-inline'` or `'unsafe-hashes'` on `style-src-attr`. (§4.3.)
8. **Rive and any WASM runtime are dead in a no-eval box; Lottie (vanilla JS) survives.** `rive-runtime` compiles WebAssembly → blocked without `'wasm-unsafe-eval'`. `lottie-web` (MIT) is plain JS with no eval → runs when inlined. Prefer **SVG+CSS / WAAPI** for marks; use inlined Lottie for designer JSON; treat Rive as *unavailable*. (This is the E2 verdict; B1 owns the motion design, H2 owns the technique pick.)
9. **`-webkit-` still matters for two glass-era properties.** `backdrop-filter` needs `-webkit-backdrop-filter` for Safari < 18; `mask`/`mask-composite` needs `-webkit-mask-*` for older WebKit **with *different* keywords** (`source-over`/`source-in`, not `add`/`intersect`). Always declare the prefixed line first, then the standard. ([caniuse backdrop-filter](https://caniuse.com/css-backdrop-filter), [MDN mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite))
10. **Set `color-scheme` in CSS *and* in a `<meta>` in `<head>` to kill the dark-mode flash — no JS needed.** `<meta name="color-scheme" content="light dark">` before any stylesheet lets the browser paint the correct canvas/UA background on the *first* frame, so a dark-mode user never sees a white flash. Pair with `prefers-color-scheme` media queries or `light-dark()` for content colours. (§4.6, Worked Example B.) ([MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme))
11. **A network-free explicit theme toggle can only follow the system or use a CSS-only hack.** With no storage-JS running before first paint you cannot *persist* a user override without a flash. Options: (a) follow the OS via `prefers-color-scheme` (zero flash, no choice); (b) a pure-CSS `:has()`/`:checked` checkbox toggle (flips a class, no persistence across reload); (c) an inlined vanilla-JS toggle that writes a class in `<head>` *before* body paint (CSP-permitting). Don't promise persisted per-user themes in a static offline file. (§4.6.)
12. **Wide-gamut P3 is opt-in and must degrade to sRGB via the cascade.** Declare the sRGB colour first, then override with `color(display-p3 …)` or an out-of-sRGB `oklch()`; gate ambitious cases with `@supports (color: color(display-p3 1 1 1))` or `@media (color-gamut: p3)`. P3 only *shows* on a P3 display; on sRGB screens it's gamut-mapped, so never rely on the extra saturation for meaning (state, contrast). (§4.5, Worked Example C.)
13. **Never "fix" font weight with `-webkit-font-smoothing`.** It's **non-standard, macOS-only**, and does nothing on Windows/Android; it forces grayscale AA that makes text *lighter/thinner* on Mac only, so a design tuned with it looks different cross-OS. Text is heavier on Windows (ClearType/DirectWrite) and lighter on macOS (CoreText grayscale) *by default* — design for both, don't paper over it. ([MDN font-smooth](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth))
14. **Prefer vectors for anything that must be crisp at any DPR; raster only as inlined `data:` @2x.** SVG/CSS is resolution-independent and free of retina blur. In a no-network single file a raster asset is a `data:` URI that *doubles* in bytes at @2x — reach for inline SVG first, `image-set()` with a density fallback only when raster is unavoidable. (§4.7.)
15. **Reserve the newest toys — `anchor-positioning`, `scroll-timeline`, `text-wrap:pretty`, `field-sizing`, `corner-shape` — for progressive enhancement only, never for layout/legibility that must hold.** Several are Limited-availability in July 2026 (no Firefox: scroll-driven, `text-wrap:pretty`; Chromium-only: `corner-shape`). Content must be complete and usable when they no-op. (§5.)

---

## 4. Body

### 4.1 How to read a support number (the Baseline model)

Baseline is a joint Google/Mozilla/Apple/MDN status that collapses per-engine version tables into three states. Getting the *semantics* right is the whole game:

| Baseline state | Formal meaning | Design action |
|---|---|---|
| **Widely available** | In all major engines (Chrome, Edge, Firefox, Safari) for **≥ 30 months** | Use unguarded. Old-version risk is negligible. |
| **Newly available** | Just reached all major engines; **older still-installed versions lack it** | Guard with `@supports` + fallback; safe as *enhancement*. |
| **Limited availability** | ≥ 1 major engine missing (or a regression block) | Always fallback-first; treat the feature as absent for critical paths. |

Two traps: (1) **"Newly available" flatters** — a feature can be Newly Available yet fail for the ~10–20 % of users on a browser one or two versions back; the fallback is not optional. (2) **Baseline is conservative and can be *blocked by one platform*.** `accent-color` shipped on desktop Chrome/Firefox in **2021** and Safari in **Dec 2025**, yet web-features lists it **Limited availability** because a **Chrome-Android regression since Dec 2025** holds the whole feature back — the raw caniuse picture is far rosier than the Baseline badge. Cross-check the badge against caniuse when it looks pessimistic. ([accent-color / web-features](https://web-platform-dx.github.io/web-features-explorer/features/accent-color/) — *time-sensitive, verify*)

The consolidated, fallback-annotated table is **§5**. The rest of §4 is the reasoning behind the columns.

### 4.2 The modern-CSS landscape, mid-2026 (narrative)

The good news for a 2026 build agent: the **colour** and **layout** stacks are now largely *Widely Available*. `container queries` (size) went Widely Available **2025-08-14**, `subgrid` **2026-03-15**, `:has()` **2026-06-19** (last month), `color-mix()` and `oklch()` **~2025-11**. These are safe to use with only light guarding. ([web-features](https://web-platform-dx.github.io/web-features-explorer/))

The *interaction and typography* frontier is where the risk lives. `backdrop-filter` (Newly, Sept 2024), `@property` (Newly, July 2024), `popover` (Newly, Jan 2025), `light-dark()` and `text-wrap:balance` (Newly, May 2024), `anchor-positioning` (Newly **2026**, once Firefox 147 shipped in Jan 2026), and `field-sizing` (Newly **2026-06-16**, Firefox 152) are all real but need guards. And three remain **Limited**: **scroll-driven animations** and **`text-wrap:pretty`** (Firefox has *not* shipped either — blocked since Sept 2025), and **`corner-shape`/`superellipse()`** (Chromium-only since Chrome 139, Aug 2025). Full rows, dates, `@supports` tests and fallbacks in §5.

### 4.3 STRICT-CSP / no-network / no-eval — what breaks (the owned list)

This is the section other tracks defer to. Assume the sandbox delivers **one HTML file**, enforces a **Content-Security-Policy with no `unsafe-eval`**, and has **no network**. Below, "breaks" means *fails silently or throws a CSP violation*; each row gives the workaround.

| # | What breaks | Why (directive/mechanism) | Workaround (CSP-safe) |
|---|---|---|---|
| 1 | **Remote fonts** (`<link>` to Google Fonts; `@font-face src:url(https://…)`) | `font-src`/`default-src` blocks the fetch; no network anyway | **Base64-inline** the (subset!) font: `@font-face{src:url(data:font/woff2;base64,…)}` **and** ensure `font-src data:` is allowed. Subset to needed glyphs — full weights are 15–100 KB+ each. (Worked Example D.) |
| 2 | **CDN CSS/JS** (`<link rel=stylesheet href=cdn>`, `<script src=cdn>`) | `style-src`/`script-src`/network | Inline all CSS in `<style>` and all JS in `<script>` — *but* those blocks then face rules 3–4. |
| 3 | **Inline `<style>`/`<script>` blocks** | `style-src`/`script-src` block inline content unless allowed | Need `'unsafe-inline'` **or** a per-block **`'sha256-…'` hash**. **Nonces can't work in a static file** (must be server-fresh per response). Hashes change on every edit — automate them or accept `'unsafe-inline'`. |
| 4 | **Inline `style="…"` attributes** | `style-src-attr`; a hash/nonce policy without `'unsafe-inline'` drops them | Move styling into a hashed `<style>` block + classes. If inline attrs are unavoidable, policy needs `'unsafe-inline'` or `'unsafe-hashes'`. **This silently un-styles AI-emitted markup.** |
| 5 | **Inline event handlers** (`onclick=`, `javascript:` URLs) | `script-src-attr`; blocked even under many "inline" allowances | `addEventListener` inside an inlined (hashed/allowed) `<script>`. |
| 6 | **`eval` / `new Function` / `setTimeout("code")`** | Blocked unless `script-src 'unsafe-eval'` | Forbidden by design. Kills **runtime template compilation** (some templating/`vue`-runtime-compiler paths, `lodash.template`, older Angular JIT). Precompile, or use render functions that don't eval. |
| 7 | **WebAssembly** (`WebAssembly.instantiate`/`compile`) | Blocked unless `script-src 'wasm-unsafe-eval'` (distinct from `unsafe-eval`) | Avoid WASM. **Rive**, WASM image codecs, `ammo.js`, some `ffmpeg.wasm` → *dead*. Use SVG/Canvas/CSS/vanilla-JS. `'wasm-unsafe-eval'` is narrower than `'unsafe-eval'` and survives hash/nonce policies **if** present. |
| 8 | **Remote images / `background-image:url(https://…)`** | `img-src`/network | Inline as `data:` URI (needs `img-src data:`) or, better, **inline `<svg>`** (counts as document markup, not an image fetch — no `img-src` needed). |
| 9 | **Remote SVG via `<img>` or `<use href="ext.svg#i">`** | `img-src` / same-origin `<use>` rules | Inline the `<svg>`/`<symbol>` directly in the document. |
| 10 | **Remote media** (`<video>/<audio>/<source src>`) | `media-src`/network | Inline `data:` (heavy — often impractical) or omit. |
| 11 | **`@import url(remote)`**, remote `@font-face`, CSS `image-set()` remote URLs | `style-src`/`font-src`/`img-src` | Inline all of it. `image-set()` may still switch between *inlined* `data:` sources by resolution. |
| 12 | **`fetch`/`XHR`/`WebSocket`/`EventSource`** to any origin | `connect-src`/network | No network — remove. Ship all data inline as a JS object / `data:` JSON. |
| 13 | **Web Workers / Service Workers / `Worker(blob:)`** | `worker-src`/`child-src`; `blob:` needs allowlisting | Run on main thread, or allow `worker-src blob:` if the sandbox permits (often it doesn't). |
| 14 | **Dynamic `import()` of a remote/blob module** | `script-src` + network | Inline modules; avoid dynamic import of external URLs. |
| 15 | **`<iframe src=remote>` / embeds** | `frame-src`/`child-src` + network | Use `<iframe srcdoc="…">` for self-contained frames (still subject to the parent CSP); no remote embeds. |

**The single-file tension, stated once:** a "self-contained HTML file" wants inline `<style>`/`<script>` and `data:` assets. A *strict* CSP wants the opposite. The realistic reconciliations are: **(A)** the sandbox sets `style-src 'unsafe-inline'` (styling is low-risk) but a stricter `script-src` (hashes) — then keep JS in one hashable block and lean on CSS; **(B)** the sandbox hashes everything — then avoid inline `style=""` attributes entirely and keep each `<style>`/`<script>` stable so its hash is stable; **(C)** you control the header — precompute SHA-256 hashes at emit time. In all three, `data:` schemes for `img-src`/`font-src` must be explicitly present, and `eval`/WASM stay off. **Verify the actual policy the box enforces before assuming.**

### 4.4 Engine / OS rendering differences (same CSS, different pixels)

Four families of difference that make a pixel-perfect single design look wrong somewhere. None is a bug you can "fix" — you *design around* them.

**(a) Font antialiasing & rendering.** macOS (CoreText) renders text with **grayscale AA** (subpixel was dropped in recent macOS) → text looks **lighter/thinner**. Windows (DirectWrite/ClearType) uses **hinting + historically subpixel** → text looks **heavier/sharper**. Linux (FreeType) varies by distro config. Consequences: the *same* `font-weight`/`font-size` reads a notch heavier on Windows; a hairline weight that's elegant on Mac can look anemic on Windows and vice-versa. `-webkit-font-smoothing:antialiased` / `-moz-osx-font-smoothing:grayscale` **only affect macOS**, are **non-standard**, and MDN advises against production reliance — using them to lighten text makes the Mac/Windows gap *worse*, not better. **Rule:** pick weights that hold on both engines; test at least one WebKit-on-mac and one Blink-on-Windows target; never tune a design *by eye on one OS* using font-smoothing. ([MDN font-smooth](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth), [google/fonts #1170](https://github.com/google/fonts/issues/1170))

**(b) Native form controls.** `<select>`, `<input type=checkbox|radio|range|date|color>`, and scrollbars render with **OS/engine chrome** by default — a macOS Safari checkbox ≠ a Windows Chrome checkbox ≠ an Android checkbox. Levers: **`accent-color`** (tints checkbox/radio/range/progress — broadly usable since 2021 on desktop, though Baseline-Limited on a Chrome-Android regression, §4.1); **`appearance:none`** to strip native styling and restyle from scratch; **`field-sizing:content`** to auto-size text inputs/`<textarea>` (Newly 2026); the customizable-`<select>` (`appearance:base-select`) work is Chromium-experimental — treat as absent. **Rule:** either accept native look (best a11y/consistency-with-OS) or fully `appearance:none` + rebuild; don't half-style (worst cross-engine results).

**(c) Scrollbar styling.** Standard **`scrollbar-width`** (`auto|thin|none`) and **`scrollbar-color`** are **Newly available (2025-12-12**, once Safari 26.2 shipped; Chrome 121 Jan-2024, Firefox 64 2018). The older **`::-webkit-scrollbar`** pseudo-elements give finer control but are **non-standard, Blink/WebKit-only** (no Firefox). macOS/iOS use **overlay** scrollbars (zero layout width); Windows classic scrollbars **take layout width** → a layout that assumes no scrollbar gutter shifts on Windows. **Fix:** `scrollbar-gutter:stable` to reserve space; use the *standard* `scrollbar-width/color` for cross-engine theming and treat `::-webkit-scrollbar` as progressive enhancement. ([scrollbar-color / web-features](https://web-platform-dx.github.io/web-features-explorer/features/scrollbar-color/) — *time-sensitive*)

**(d) Sub-pixel rounding.** Engines round fractional lengths differently. `width:calc(100%/3)`, fractional `transform: translate`, and 1px borders on non-integer positions produce **off-by-one seams/gaps** — visible as hairline lines between adjacent cells or a 1px jump between browsers. On HiDPI, snapping to *device* pixels differs again. **Fixes:** avoid fractional track math where seams show (prefer `grid` with `fr` + `gap`); for true 1-device-pixel hairlines use a `transform:scaleY(.5)` pseudo-element or `0.5px` borders; don't rely on exact pixel coincidence across engines.

**(e) System fonts.** `font-family:system-ui` resolves to **SF Pro (macOS/iOS)**, **Segoe UI (Windows)**, **Roboto (Android)** — native feel, but **different metrics/line-heights**, so a `system-ui` layout reflows subtly per OS. Fine for body UI; risky for tightly-fitted labels.

### 4.5 Colour management & wide-gamut P3

Modern displays are increasingly **P3 (wide-gamut)**, ~25 % more saturated than sRGB. Browsers now **colour-manage**: an sRGB colour is mapped to look correct on a P3 screen (not naively over-saturated). To actually *use* the wider gamut you must ask for it:

- **`color(display-p3 r g b)`** — explicit P3 (~**92 %** global support: Chrome 111, Safari 15, Firefox 113; Widely-ish 2025-11). ([caniuse color()](https://caniuse.com/css-color-function))
- **`oklch()`/`oklab()`** — perceptually-uniform; can specify colours *outside* sRGB (~**90.5 %** global). ([caniuse oklch](https://caniuse.com/mdn-css_types_color_oklch))

**The fallback pattern is the cascade (Rule 3):** declare sRGB first, then the wide-gamut override; unsupported browsers drop the second line.

```css
.brand { color: #12b886;                       /* sRGB fallback, always */
         color: color(display-p3 0 .7 .5); }    /* P3 where supported */
```

For anything conditional on the *display* (not just parsing), gate with `@media (color-gamut: p3)` or `@supports (color: color(display-p3 1 1 1))`. **Gotchas:** (1) out-of-sRGB `oklch()` values are **gamut-mapped differently per engine** — don't depend on the exact clipped colour for state/contrast; (2) `color-mix()` interpolates differently per space (`in oklab` vs `in srgb`) — pick the space explicitly; (3) **untagged images are assumed sRGB** — a P3 `data:` image without an embedded ICC profile shifts colour. **Never encode meaning (error/success, focus, contrast) in the P3-only saturation delta** — sRGB users must get the same information.

### 4.6 Dark-mode plumbing & the flash of wrong theme (no network, no build-time JS)

The "flash of inaccurate colour theme" (FART) happens when the browser paints a default (usually **light**) canvas before your dark styles apply. In a no-network single file the robust fixes are CSS-only:

1. **Declare `color-scheme` early — in `<meta>` *and* CSS.** `<meta name="color-scheme" content="light dark">` in `<head>` **before any stylesheet** lets the UA paint the correct canvas/background, form-control and scrollbar colours on the **first frame**, so a dark-mode user never flashes white. Mirror it with `:root{color-scheme:light dark}`. ([MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme), [web.dev prefers-color-scheme](https://web.dev/articles/prefers-color-scheme))
2. **Drive content colours from the system pref**, via `@media (prefers-color-scheme: dark)` overrides or the **`light-dark()`** function (Newly, May 2024 — Chrome 123 / FF 120 / Safari 17.5; guard for older). `light-dark()` needs `color-scheme` set to work.
3. **`color-scheme: only light`** opts out of Chrome's *Auto Dark Theme* (auto-darkening of light sites) when you've hand-tuned light.

**Explicit toggle without a server (Rule 11):** you cannot *persist* a per-user override across reloads without JS running before first paint. Three honest options: **(a)** follow OS only (zero flash, no user choice); **(b)** a **pure-CSS `:has()` checkbox** toggle that flips a `:root` state and swaps custom properties — no persistence, resets on reload, but flash-free within a session; **(c)** an inlined vanilla-JS snippet in `<head>` that reads a stored choice and sets a class **before** `<body>` paints (CSP-permitting; still no network). Don't promise durable saved themes in a static offline artifact. Full setup in **Worked Example B**.

### 4.7 HiDPI / retina

`devicePixelRatio` is 2–3 on modern phones/laptops; a 1-CSS-px line is 2–3 device pixels. **Vectors win:** SVG and CSS (borders, gradients, shadows) are resolution-independent and always crisp — *prefer them for icons, logos, dividers, and shapes*. For **raster**, supply higher-density sources: `<img srcset="a.png 1x, a@2x.png 2x">` or CSS `background-image: image-set("a.png" 1x, "a@2x.png" 2x)`. **In the no-network single file** every raster is a `data:` URI, so @2x *doubles the bytes for that asset* — reach for inline SVG first; use `image-set()` only when a photo is unavoidable, and consider AVIF/WebP `data:` with a PNG fallback via `image-set(... type("image/avif"), ...)`. Detect density with `@media (resolution >= 2dppx)` (modern) / `(-webkit-min-device-pixel-ratio: 2)` (legacy). For **1-device-pixel hairlines** on retina, use a `transform: scaleY(0.5)` pseudo-element or `0.5px` borders (well-supported on HiDPI).

### 4.8 Print (`@media print`)

Single-file artifacts are often printed/PDF'd; a few basics prevent an ugly page:

- **Backgrounds are dropped by default** to save ink — a dark-themed panel prints as white with invisible white text. Force retention with **`print-color-adjust: exact`** (`-webkit-print-color-adjust:exact` for older Blink/WebKit) on elements whose bg carries meaning; or, better, **force a light print theme** in `@media print`.
- **Page breaks:** `break-inside: avoid` on cards/tables/figures; `break-before/after: page`; the legacy `page-break-*` aliases still work.
- **`@page { margin: … ; size: … }`** for margins/orientation.
- **Reveal link targets:** `@media print { a[href^="http"]::after { content:" ("attr(href)")" } }`.
- **Hide interactive chrome** (nav, toggles, sticky bars); switch to `pt`/`cm` units; ensure black-on-white body text. Always give print its own `@media print` block rather than trusting screen styles.

---

## 5. Options catalogue — MODERN-CSS SUPPORT / FALLBACK TABLE (mid-2026)

**Columns:** feature · Baseline/support status (**TIME-SENSITIVE — July 2026; verify at build**) · what it needs · `@supports` test · fallback. Dates from [web-features explorer](https://web-platform-dx.github.io/web-features-explorer/) and [caniuse](https://caniuse.com) unless noted. "Newly" = Baseline Newly Available; "Widely" = Widely Available; "Limited" = ≥1 engine missing.

| Feature | Status (July 2026) — *verify* | What it needs / engines | `@supports` test | Fallback |
|---|---|---|---|---|
| **backdrop-filter** | **Newly** (since 2024-09-16; Widely exp. 2027-03-16). Chrome 76, FF 103, **Safari 18** | `-webkit-backdrop-filter` for Safari < 18; a semi-transparent bg to blur | `@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px)))` | **Solid/again-opaque panel** (raise bg alpha to ~0.85+). See Worked Example A. |
| **mask / mask-composite** | mask-composite **Widely** (since 2023-12). unprefixed `mask` Chrome 120 / Safari 15.4 / FF 53 | `-webkit-mask-*` for old WebKit **with different keywords** (`source-in`≈`intersect`) | `@supports (mask-composite: intersect)` / `@supports (mask-image:none)` | Provide `-webkit-mask-*` line first; else a plain shape/`clip-path` or PNG-alpha `data:` image. |
| **color-mix()** | **Widely** (since 2025-11-09). Chrome 111, FF 113, Safari 16.2 | Specify interpolation space (`in oklab`) | `@supports (color: color-mix(in oklab, red, blue))` | Precomputed static colour (hex) as the base declaration (cascade). |
| **oklch() / oklab()** | **Widely** (~2025-11; ~90.5 % global). Chrome 111, Safari 15.4, FF 113 | — | `@supports (color: oklch(0% 0 0))` | sRGB hex/`rgb()` declared first (cascade, Rule 3). |
| **Relative colour** `rgb(from … )` | **Newly** (since 2024-09-16; Widely exp. 2027-03). Chrome 125, FF 128, Safari 18 | — | `@supports (color: rgb(from white r g b))` | Static precomputed colour; or `color-mix()` for simple tints. |
| **@property** (typed custom props) | **Newly** (since 2024-07-09; Widely exp. 2027-01). Chrome 85, Safari 16.4, **FF 128** | Registration for animatable/typed vars | *No CSS `@supports`;* JS: `CSS.registerProperty` in `window` / try-catch | Unregistered custom property still works as a plain value; just not animatable/typed — animation no-ops gracefully. |
| **Container queries** (size) | **Widely** (since 2025-08-14). Chrome 105, FF 110, Safari 16 | `container-type/inline-size` on ancestor | `@supports (container-type: inline-size)` | Media-query breakpoints on viewport as fallback layout. |
| **Subgrid** | **Widely** (since 2026-03-15). Chrome 117, FF 71, Safari 16 | Parent `display:grid` | `@supports (grid-template-columns: subgrid)` | Nested independent grid, or flex; accept looser alignment. |
| **:has()** | **Widely** (since 2026-06-19 — *last month*). Chrome 105, Safari 15.4, FF 121 | — | `@supports selector(:has(*))` | JS class-toggle (CSP-safe) or accept no parent-conditional styling. |
| **Scroll-driven** `animation-timeline: scroll()/view()` | **Limited** — **no Firefox** (blocked since 2025-09). Chrome 115, Safari 26 | Off-main-thread; keyframes | `@supports (animation-timeline: scroll())` | **IntersectionObserver** class-toggle (vanilla JS, no eval) or static reveal. **Never gate visibility on it.** (B1 owns the motion.) |
| **text-wrap: balance** | **Newly** (since 2024-05-13; Widely exp. 2026-11-13). Chrome 114, FF 121, Safari 17.5 | Best on short multi-line (headings); ~capped line count | `@supports (text-wrap: balance)` | Normal greedy wrapping (no-op) — purely cosmetic; safe to skip. |
| **text-wrap: pretty** | **Limited** — **no Firefox** (blocked since 2025-09). Chrome 117, Safari 26 | — | `@supports (text-wrap: pretty)` | Normal wrapping (no-op). Cosmetic; safe. |
| **Anchor positioning** | **Newly (2026)** — **FF 147 shipped Jan 2026** (~82 % global). Chrome 125, Safari 26 | `anchor-name` + `position-anchor`; **sub-features (`position-try`, `position-area`, `position-visibility`) vary per engine** | `@supports (anchor-name: --a)` | Absolute/fixed positioning + a JS positioner (e.g. inlined Floating-UI-style math, no eval) or the CSS-Anchor-Positioning polyfill (verify CSP/WASM-free). |
| **Popover attribute / API** | **Newly** (since 2025-01-27; Widely exp. 2027-07-27). Chrome 116, FF 125, Safari 17 | `popover` attr + `popovertarget` | *No CSS test;* JS: `'popover' in HTMLElement.prototype` | Vanilla-JS toggle of a top-layer `<div>` (`.hidden` class), manual focus/Esc/light-dismiss. |
| **field-sizing: content** | **Newly (2026)** — **FF 152 (2026-06-16)**, Safari 26.2, Chrome 123 | Form control | `@supports (field-sizing: content)` | Fixed `rows`/width + vanilla-JS auto-grow (`scrollHeight`) or accept fixed size. |
| **corner-shape / superellipse()** | **Limited / experimental** — **Chromium only** (Chrome 139, 2025-08). No FF/Safari | — | `@supports (corner-shape: superellipse(2))` | Standard `border-radius` (rounded). Squircle look degrades to rounded — safe cosmetic. |
| **light-dark()** | **Newly** (since 2024-05-13; Widely exp. 2026-11). Chrome 123, FF 120, Safari 17.5 | Requires `color-scheme` set | `@supports (color: light-dark(#fff,#000))` | `@media (prefers-color-scheme)` override blocks (Worked Example B). |
| **color-scheme** (property + meta) | **Widely** (since ~2022). Broad | `<meta>` in `<head>` for first-paint | `@supports (color-scheme: light dark)` (≈universal) | Manual dark bg/text; without it, expect UA-chrome flash. |
| **accent-color** | **Limited** *by Baseline* (Chrome-Android regression since 2025-12) but desktop since 2021, Safari 26.2 | Form controls | `@supports (accent-color: red)` | Native control colour; or `appearance:none` + custom control. |
| **scrollbar-color / -width** | **Newly** (since 2025-12-12). Chrome 121, FF 64, Safari 26.2 | — | `@supports (scrollbar-width: thin)` | `::-webkit-scrollbar` (Blink/WebKit only) as enhancement; else native scrollbar. |
| **color() display-p3 (wide gamut)** | **Widely** (~2025-11; ~92 % global). Chrome 111, Safari 15, FF 113 | A P3 display to *see* it | `@supports (color: color(display-p3 1 1 1))` / `@media (color-gamut:p3)` | sRGB colour declared first (cascade); never encode meaning in the P3 delta (§4.5). |

*(Which technique to *choose* for a given effect — CSS vs SVG vs Canvas vs WebGL, and hand-inlining — is **H2**. This table is "does it run and how does it degrade.")*

### Worked Example A — progressive `backdrop-filter` glass (prefixed + `@supports` + opaque fallback + reduced-transparency)

```css
/* FALLBACK FIRST: an opaque-enough panel that works with zero blur support */
.glass {
  background: rgba(20, 22, 28, 0.85);          /* readable without blur */
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
}
/* ENHANCE: only where backdrop-filter (or its -webkit- form) is supported */
@supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))) {
  .glass {
    background: rgba(20, 22, 28, 0.45);          /* let the blur do the work */
    -webkit-backdrop-filter: blur(12px) saturate(1.4);   /* Safari < 18 */
    backdrop-filter: blur(12px) saturate(1.4);           /* standard */
  }
}
/* A11y (A5 owns the mandate; E2 wires it): users who reduce transparency get the opaque panel back */
@media (prefers-reduced-transparency: reduce) {
  .glass { background: rgba(20,22,28,0.92); -webkit-backdrop-filter:none; backdrop-filter:none; }
}
```

Why it's correct: the *base* rule is legible with no blur at all; the enhancement only raises transparency **after** confirming blur support (so an unsupported browser never shows unreadable low-alpha text); the `-webkit-` line covers Safari < 18; reduced-transparency restores opacity. ([caniuse backdrop-filter](https://caniuse.com/css-backdrop-filter))

### Worked Example B — dark-mode plumbing with no flash, no network (system-driven + optional CSS-only toggle)

```html
<!-- 1) FIRST-PAINT canvas fix: in <head>, BEFORE any stylesheet -->
<meta name="color-scheme" content="light dark">
```
```css
/* 2) Declare scheme so UA chrome + light-dark() work; tokens via prefers-color-scheme */
:root {
  color-scheme: light dark;
  --bg:   #ffffff;  --fg:  #16181d;  --card: #f4f5f7;   /* light defaults */
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #16181d; --fg: #f2f3f5; --card: #22252c; }  /* dark overrides */
}
body { background: var(--bg); color: var(--fg); }

/* 3) Where light-dark() is supported it's terser — GUARDED (Newly, not Widely) */
@supports (color: light-dark(#000, #fff)) {
  :root { --card: light-dark(#f4f5f7, #22252c); }
}

/* 4) OPTIONAL pure-CSS session toggle (no JS, no storage): a checkbox flips :root */
/*    <input type="checkbox" id="dark"> somewhere near the top of <body>          */
:root:has(#dark:checked) { --bg:#16181d; --fg:#f2f3f5; --card:#22252c; }
```

Why it's flash-free: the `<meta>` lets the browser paint the correct dark **canvas** on frame 1 (no white flash for dark-mode users) **without any script**; content colours follow the OS via `prefers-color-scheme`; `light-dark()` is used only behind `@supports`; the optional `:has()` checkbox gives an in-session override with **no JS and no network** (it doesn't persist across reload — that would need pre-paint storage-JS, Rule 11). ([MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme), [web.dev prefers-color-scheme](https://web.dev/articles/prefers-color-scheme))

### Worked Example C — wide-gamut P3 with sRGB fallback (cascade + gated enhancement)

```css
.cta {
  background: #12b886;                          /* sRGB — everyone gets this */
  background: color(display-p3 0 0.72 0.55);     /* P3 override where parsed */
}
/* Only push a vivid, deliberately-out-of-sRGB accent on true P3 displays */
@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    .cta { box-shadow: 0 0 24px color(display-p3 0 0.9 0.6 / 0.6); }
  }
}
```

The first two lines need no `@supports` — the cascade drops the P3 line in sRGB browsers. The glow (which *only makes sense* on a P3 screen) is double-gated by `@supports` **and** `@media (color-gamut:p3)`. No meaning rides on the extra saturation (Rule 12). ([caniuse color()](https://caniuse.com/css-color-function))

### Worked Example D — CSP-safe self-hosted font (base64 `@font-face`, and the header it requires)

```css
/* Font inlined as a data: URI — no network, survives strict-CSP IF font-src allows data: */
@font-face {
  font-family: "AppSans";
  font-style: normal; font-weight: 400 700;      /* variable range — one file */
  font-display: swap;                              /* show fallback text immediately */
  src: url("data:font/woff2;base64,d09GMgABAAAAA…") format("woff2");
}
:root { font-family: "AppSans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
```
```
Required policy (whoever sets the header): font-src 'self' data:;
```

Notes: **subset** the font to the glyphs you use (full weights are 15–100 KB+ each; a subset can be 5–20 KB) — bytes are the real cost of inlining. `font-display: swap` avoids invisible text while… there's nothing to wait for, but it also protects against a broken `data:` URI. **`'self'` alone blocks the `data:` src** (Rule 5) — the policy must carry `data:` in `font-src`, and a `system-ui` fallback stack means a blocked font still renders native. ([MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP))

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Inlined font not applied** | Body text falls back to system font; DevTools Console: CSP `font-src` violation on a `data:` URI | Add `data:` to `font-src` (Rule 5); confirm base64 MIME (`font/woff2`); keep a `system-ui` fallback. |
| **Inline `<style>`/`<script>` stripped** | Page renders unstyled / JS inert; Console: "Refused to apply inline style/execute inline script" | Provide `'unsafe-inline'` or a correct `'sha256-…'` per block; **nonces won't work statically** (Rule 6). |
| **Inline `style=""` dropped under hash policy** | Only *some* styling missing (the inline-attr bits); `<style>` block works | Move inline styles to a hashed `<style>` + classes; or allow `'unsafe-inline'`/`'unsafe-hashes'` on `style-src-attr` (Rule 7). |
| **Rive / WASM mark blank** | Empty box where animation should be; Console: WASM compile blocked by CSP | Swap to inlined **Lottie** (vanilla JS) or **SVG+CSS/WAAPI**; `'wasm-unsafe-eval'` absent (Rule 8). |
| **`data:` image blocked** | Broken-image icon; Console: `img-src` violation | `img-src 'self' data:`, or inline as `<svg>` (no `img-src` needed). |
| **Glass panel unreadable in Safari < 18 / unsupported** | Low-alpha text over no blur; washed out | Fallback-first opaque bg; `@supports` gate; `-webkit-backdrop-filter` line (Worked Example A). |
| **Dark-mode white flash** | Brief white flash before dark styles on load | `<meta name="color-scheme">` in `<head>` **before** CSS + `:root{color-scheme:light dark}` (Rule 10). |
| **Persisted theme toggle flashes/​resets** | Chosen theme flips to system on reload | Accept system-follow or CSS-`:has()` session toggle; true persistence needs pre-paint storage-JS (Rule 11). |
| **Text too thin on macOS / too heavy on Windows** | Design tuned on one OS looks off on the other | Choose weights robust on both; **don't** use `-webkit-font-smoothing` to compensate (Rule 13). |
| **Layout shifts on Windows only** | 1–17px horizontal jump vs macOS | Classic Windows scrollbars take width → `scrollbar-gutter: stable` (§4.4c). |
| **Hairline seams between grid cells** | 1px gaps/overlaps at some zooms/engines | Avoid fractional track math; use `grid` `fr`+`gap`; `scaleY(.5)` hairlines (§4.4d). |
| **Blurry raster on retina** | Icons/logos soft on HiDPI | Use SVG/CSS vectors; else `srcset`/`image-set()` @2x `data:` (§4.7). |
| **P3 colour "wrong" / invisible** | Over-saturated or clipped oddly per browser; or state cue lost on sRGB | sRGB-first cascade; don't encode meaning in P3 delta; gate `@media (color-gamut:p3)` (§4.5). |
| **Dark panel prints white / invisible text** | PDF/print shows empty box | `print-color-adjust: exact` or force a light `@media print` theme (§4.8). |
| **Scroll animation dead in Firefox** | Reveal never fires; content stuck hidden | `@supports (animation-timeline: scroll())` + IO fallback; **never gate visibility on it** (§5). |
| **`corner-shape` squircle only in Chrome** | Rounded (not squircle) in FF/Safari | Expected — it's a cosmetic no-op → `border-radius`; don't rely on the shape (§5). |
| **Anchor-positioned popover mis-places in some engine** | Tooltip/menu off-target where sub-features differ | Gate `@supports (anchor-name:--a)`; provide JS-positioned fallback; test `position-try`/`position-area` per engine (§5). |

---

## 7. Pre-flight checklist (run before shipping any single-file variant)

- [ ] Every feature not **Widely available** is `@supports`-gated (or cascade-fallback for colours), **fallback authored first** (§3.2, §5).
- [ ] No **remote** anything: fonts, CSS, JS, images, media, iframes — all inlined (§4.3).
- [ ] Every `data:` asset's scheme is allowlisted in the policy you actually run under (`img-src data:`, `font-src data:`) — **verified, not assumed** (Rule 5).
- [ ] Inline `<style>`/`<script>` strategy matches the sandbox's CSP regime (`'unsafe-inline'` vs per-block hashes); **no nonces assumed** (Rule 6).
- [ ] No inline `style=""`/`onclick=` under a hash-based policy; styling in hashed `<style>` + classes, handlers via `addEventListener` (Rules 7, §4.3-5).
- [ ] **No `eval`/`new Function`/`setTimeout("…")`; no WASM/Rive** — verified in Console (Rules 4, 8).
- [ ] `backdrop-filter`/`mask` carry `-webkit-` lines; glass is legible with **zero** blur (Rule 9, Ex A).
- [ ] `<meta name="color-scheme">` in `<head>` before CSS + `color-scheme` on `:root`; **no dark-mode flash** verified (Rule 10, Ex B).
- [ ] Theme override promises are honest about persistence in a static file (Rule 11).
- [ ] Wide-gamut colours are **sRGB-first**; no meaning encoded in the P3 delta (Rule 12, Ex C).
- [ ] No `-webkit-font-smoothing` used to tune weight; weights checked on a Blink/Windows **and** WebKit/macOS target (Rule 13, §4.4a).
- [ ] `scrollbar-gutter: stable` where Windows scrollbar width would shift layout (§4.4c).
- [ ] Crisp elements are **vectors**; raster only as inlined @2x `data:` (Rule 14, §4.7).
- [ ] A `@media print` block exists: backgrounds handled (`print-color-adjust`), page breaks set, chrome hidden (§4.8).
- [ ] Scroll-driven / anchor / `text-wrap:pretty` / `field-sizing` / `corner-shape` used **only** as enhancement; content complete when they no-op (Rule 15, §5).
- [ ] Every support/Baseline number in the build was **re-verified** against caniuse/web-features at build time (all §5 rows are time-sensitive).

---

## 8. Open questions / unverified

- **All §5 dates are July-2026 snapshots and move monthly.** Especially volatile right now: **`field-sizing`** (Newly only since 2026-06-16), **`:has()`** (crossed to Widely 2026-06-19), **`subgrid`** (Widely 2026-03-15), **anchor positioning** (Newly *this year* after Firefox 147, Jan 2026, with **sub-features still diverging** — `position-try`/`position-area`/`position-visibility` not uniformly shipped). Re-check each before relying on it. *(Verified against web-features explorer + caniuse at fetch time.)*
- **Firefox scroll-driven & `text-wrap:pretty`** are "blocked since Sept 2025" per web-features — a Firefox release could flip either to Newly Available at any time. Treat "no Firefox" as the current, not permanent, state.
- **`accent-color` Baseline paradox:** Limited *only* because of a Chrome-Android regression (since Dec 2025) despite ~universal desktop support since 2021 + Safari 26.2. The Baseline badge understates real usability — a good reminder to cross-read caniuse. Exact regression scope unverified beyond the web-features note.
- **`corner-shape`/`superellipse()`** is Chromium-only (Chrome 139) and syntax may still shift before other engines ship; MDN flags it experimental. Do not spec it as load-bearing.
- **The exact CSP the target sandbox enforces was not observed here** — the `data:` scheme allowlisting, `'unsafe-inline'` vs hash regime, and whether `'wasm-unsafe-eval'` is present are *asserted from the CSP spec/MDN* and **must be confirmed against the real policy**. The single most likely gap between this report and a live box.
- **`-webkit-font-smoothing` macOS-only behaviour** is documented by MDN as non-standard; precise per-macOS-version subpixel/grayscale behaviour (and any 2026 change) not independently re-verified.
- **P3 gamut-mapping differences** across engines for out-of-sRGB `oklch()` are real but not quantified here; if exact clipped colours matter, test per engine.
- **Print `print-color-adjust`** naming (`-webkit-print-color-adjust` alias) support edges not re-verified for every engine; keep the `-webkit-` alias.

---

## 9. Sources

Primary / authoritative (fetched July 2026):

- [web.dev — Baseline](https://web.dev/baseline) and [Web-features explorer](https://web-platform-dx.github.io/web-features-explorer/) — Baseline states & exact dates for: [backdrop-filter](https://web-platform-dx.github.io/web-features-explorer/features/backdrop-filter/) (Newly 2024-09-16), [scroll-driven](https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/) (Limited, no FF), [color-mix](https://web-platform-dx.github.io/web-features-explorer/features/color-mix/) (Widely 2025-11-09), [:has()](https://web-platform-dx.github.io/web-features-explorer/features/has/) (Widely 2026-06-19), [container-queries](https://web-platform-dx.github.io/web-features-explorer/features/container-queries/) (Widely 2025-08-14), [subgrid](https://web-platform-dx.github.io/web-features-explorer/features/subgrid/) (Widely 2026-03-15), [@property](https://web-platform-dx.github.io/web-features-explorer/features/registered-custom-properties/) (Newly 2024-07-09), [popover](https://web-platform-dx.github.io/web-features-explorer/features/popover/) (Newly 2025-01-27), [text-wrap-balance](https://web-platform-dx.github.io/web-features-explorer/features/text-wrap-balance/) (Newly 2024-05-13), [text-wrap-pretty](https://web-platform-dx.github.io/web-features-explorer/features/text-wrap-pretty/) (Limited, no FF), [field-sizing](https://web-platform-dx.github.io/web-features-explorer/features/field-sizing/) (Newly 2026-06-16), [light-dark](https://web-platform-dx.github.io/web-features-explorer/features/light-dark/) (Newly 2024-05-13), [relative-color](https://web-platform-dx.github.io/web-features-explorer/features/relative-color/) (Newly 2024-09-16), [scrollbar-color](https://web-platform-dx.github.io/web-features-explorer/features/scrollbar-color/) (Newly 2025-12-12), [accent-color](https://web-platform-dx.github.io/web-features-explorer/features/accent-color/) (Limited — Chrome-Android block).
- [caniuse — CSS Anchor Positioning](https://caniuse.com/css-anchor-positioning) (~82 % global, Chrome 125 / Safari 26 / **FF 147**), [color() function / display-p3](https://caniuse.com/css-color-function) (~92 %), [oklch()](https://caniuse.com/mdn-css_types_color_oklch) (~90.5 %), [backdrop-filter](https://caniuse.com/css-backdrop-filter), [CSS masks](https://caniuse.com/css-masks).
- [MDN — Content Security Policy guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) — inline `'unsafe-inline'` vs nonce vs hash; `'unsafe-eval'`; `'wasm-unsafe-eval'`; `default-src` fallback; `data:` scheme handling.
- [MDN — color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme) — values, UA-chrome effect, `<meta>`, first-paint flash avoidance.
- [MDN — mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite) — `add/subtract/intersect/exclude` and the `-webkit-mask-composite` Porter-Duff keyword caveat.
- [MDN — font-smooth / -webkit-font-smoothing](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth) — non-standard, macOS-only.
- [MDN — corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape) & [Chrome for Developers — implementing corner-shape](https://developer.chrome.com/blog/implementing-corner-shape) — Chromium-only, experimental (Chrome 139).
- [web.dev — prefers-color-scheme](https://web.dev/articles/prefers-color-scheme) — dark-mode strategy & flash avoidance.
- [OddBird — Anchor Positioning update, Fall 2025](https://www.oddbird.net/2025/10/13/anchor-position-area-update/) — cross-engine anchor sub-feature differences.

Reference / secondary:
- [buildmvpfast — Web Platform Baseline 2026](https://www.buildmvpfast.com/blog/web-platform-baseline-2026-new-features-browser-support) — Firefox 147 anchor-positioning date (Jan 2026); consolidated 2025–26 Baseline list.
- [google/fonts #1170 — remove -webkit-font-smoothing](https://github.com/google/fonts/issues/1170) — macOS-only smoothing discussion.
- [Frontend Masters — CSS corner-shape & the superellipse](https://frontendmasters.com/blog/understanding-css-corner-shape-and-the-power-of-the-superellipse/); [CSS-Tricks — Flash of inAccurate coloR Theme (FART)](https://css-tricks.com/flash-of-inaccurate-color-theme-fart/).

Licences (tools referenced): [`lottie-web` — MIT](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md) (CSP-safe, vanilla JS, inlinable); [`rive-runtime` — MIT](https://github.com/rive-app/rive-runtime/blob/main/LICENSE) (**blocked** under no-`wasm-unsafe-eval` CSP). All modern-CSS features above are web-platform native (no licence).
