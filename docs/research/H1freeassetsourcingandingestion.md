# H1 — Free asset sourcing & ingestion

*Design-intelligence reference. Track H1 of the registry research map. Written to be read by the design agent before it pulls any external asset into a variant, and by a human owner auditing the registry's supply chain, licences, and provenance.*

---

## 1. Scope line

This track owns **the supply chain**: where free, open-licensed assets come from for every category the tool draws on — UI component snippets, icons, brand/logo marks, fonts, motion (Lottie/SVG/CSS), illustrations, textures/noise/patterns, shaders/animated backgrounds, and sound — and **how a found asset becomes a trustworthy registry entry**: normalised, de-frameworked, de-duplicated, quality-graded, dark/light-ready, CSP-verified, and licence-clean with provenance intact.

## 2. Boundary (what this track does **not** cover)

- **Which asset suits a given design** (does *this* icon set / illustration / font fit *this* brief, mood, density) → the foundation tracks **A1–A4** (colour, type, layout, shape/material) and **D2**. H1 gets the asset *in the door* with a correct licence and a clean entry; the foundations decide *when to reach for it*.
- **Icon glyph design, grid, stroke and cross-set visual consistency** → **D2 Iconography**. H1 sources and tags icon sets; D2 judges whether mixing Lucide with Material Symbols looks coherent.
- **Font role / mood / pairing selection** → **A2 Typography**. H1 confirms a font is OFL and embeds it offline; A2 decides it should be a humanist sans for this project.
- **The consolidated single-file no-network feasibility matrix across techniques** (CSS vs SVG vs Canvas vs WebGL vs WASM) → **H2 Feasibility**. H1 gives each *source*'s CSP/offline verdict inline; H2 owns the cross-technique matrix.
- **Whether an asset reads as generic / overused** (unDraw-face syndrome, default-Bootstrap look) → **F2 Distinctiveness**.
- **How motion assets are animated and choreographed once embedded** → **B1 Motion**. H1 sources the Lottie/SVG; B1 governs duration, easing, reduced-motion.
- **Runtime accessibility conformance math** (contrast, APCA, focus order) → **A5 Accessibility**. H1 records an a11y grade at ingest; A5 owns the conformance model.

---

## 3. Executive rules (apply these before reading the body)

1. **Download and self-host/inline everything; never hotlink.** The strict-CSP sandbox blocks *every* external request — CDN scripts, `fonts.googleapis.com`, the Iconify API, the LottieFiles web-player, remote images. The registry stores **bytes** (inline SVG, base64 WOFF2, JSON strings, data-URI audio), never URLs. The single most common failure in this track is shipping a `<link>`/`<script src>`/`<img src>` to a remote asset. If it isn't embeddable as inline text or a `data:` URI, it does not qualify.
2. **Capture provenance at ingest or lose it forever.** Every entry records: source URL, author/foundry, SPDX licence ID, licence URL, attribution string (if any), and retrieval date. No provenance → **quarantine**, do not ship. Re-deriving a licence weeks later from a stripped SVG is impossible.
3. **Work the licence tiers, not vibes.** GREEN = CC0 / MIT / ISC / BSD / Apache-2.0 / OFL-1.1 — use and redistribute freely (keep notices). AMBER = CC-BY, CC-BY-SA, and custom-permissive (unDraw, Lottie Simple, Remix Icon v1.0) — usable but with an obligation (attribution ledger, share-alike caution, no-repackaging clause). RED = any `-NC` (non-commercial), any `-ND` (no-derivatives), and **unknown/unverified** — reject for a general-purpose commercial tool. (§4.2 table.)
4. **Default icon stack, zero attribution friction:** **Lucide (ISC)**, **Heroicons (MIT)**, **Tabler (MIT)**, **Phosphor (MIT)**, **Material Symbols (Apache-2.0)**. All ship as inline SVG with `currentColor`, all inline cleanly, all are GREEN. Reach past them only for a glyph they lack.
5. **Brand/logo marks: the SVG data is licensed, the trademark is not.** simple-icons is CC0 *for the path data* — but the brands' **trademarks and copyrights are not waived** and the project says so explicitly. Only use a mark to *refer to that brand*; never recolour/distort a logo, imply endorsement, or use it decoratively. Record the trademark owner and a "trademark, not licensed" flag on every brand-mark entry.
6. **Fonts: OFL-1.1 / Apache-2.0 only; subset and inline as WOFF2.** Embed with `@font-face` + base64 `data:` URI (or a bundled WOFF2 blob). Keep the OFL text and any **Reserved Font Name** in the entry; never rename a *modified* OFL font using its reserved name. Self-hosting for web display carries near-zero obligation; shipping the raw font file as a standalone download is what triggers "include OFL.txt."
7. **Illustrations: separate "use in output" from "store as a pack."** unDraw is best-in-class but its custom licence **forbids repackaging/redistribution "in packs," forbids scraping, and forbids AI-training use** — so pull unDraw *per image into a rendered variant*, do **not** bulk-ingest it as a redistributable registry pack. For anything the registry itself stores and redistributes, prefer **CC0** sets (Open Peeps, Open Doodles, Humaaans).
8. **Motion: Lottie inlines, Rive is blocked.** LottieFiles free-tab assets are the Lottie **Simple License** (commercial OK, attribution optional) — but don't bulk-compile them into a "competing service," which the licence forbids. `lottie-web` (MIT) is plain JS with **no eval** → inlines fine. **Rive is WebAssembly** → a no-eval CSP blocks it; exclude it from the sandbox.
9. **Shaders: do not ingest Shadertoy code.** Shadertoy's **default licence is CC BY-NC-SA 3.0 — non-commercial** — unusable for a general-purpose commercial tool, and viral (SA). Generate your own CSS/Canvas/WebGL backgrounds, or source from CC0/MIT shader collections with an explicit permissive licence. WebGL/Canvas *techniques* are CSP-safe (no eval); the blocker here is licence, not CSP.
10. **Sound: CC0 first, encode as short data-URI, gesture-gated.** Prefer **Kenney (CC0)** and **Freesound filtered to CC0**. Pixabay/Mixkit are usable *in output* but restrict standalone redistribution — don't store them as a redistributable pack. Autoplay is blocked by browsers anyway: ship muted, play on user gesture.
11. **Strip framework coupling on ingest.** JSX→HTML (`className`→`class`, resolve props to static values), Tailwind→compiled scoped CSS, remove build-time deps. Prefer **CSS-only interactivity** (`<details>`/`<summary>`, the `popover` attribute, `:has()`, the checkbox-hack, `:target`) over JS; where JS is unavoidable, inline vanilla with **no eval**.
12. **Tokenise on ingest.** Replace hard-coded hex/spacing with CSS custom properties so every entry is themeable and ships a `prefers-color-scheme: dark` path. A snippet with baked-in `#fff` backgrounds is a **downgrade**, not a finished entry.
13. **Grade A–F on a fixed rubric; only A/B ship by default.** Score rendering fidelity, responsive, a11y, dark/light, self-containment/CSP, code cleanliness, distinctiveness (§4.15). C = repair before use; F = reject.
14. **De-duplicate structurally and visually before adding.** Near-identical variants dilute selection and bloat the registry. Hash normalised DOM + a rendered-screenshot perceptual hash; collapse near-duplicates (§4.14).
15. **Maintain an attribution ledger (NOTICES) and assemble it into the output.** Any MIT/ISC/Apache/OFL/CC-BY asset that actually ships needs its notice carried. Auto-generate the NOTICES block from the entries used; a variant that embeds CC-BY assets without it is non-compliant.

---

## 4. Body

### 4.1 The one rule that governs the whole supply chain: *download, don't hotlink*

Every category below reduces to the same CSP question, and the answer is almost always the same: **the source's delivery mechanism is irrelevant; only the downloadable artifact matters.** A strict CSP with no `unsafe-inline`/`unsafe-eval` and no network means:

| Delivery mechanism | In the sandbox | Correct move |
|---|---|---|
| `<script src="https://cdn…">` (icon font, Lottie player, Tailwind CDN) | **BLOCKED** (network + often eval) | Download the library; inline the JS (no-eval builds only) |
| `<link href="https://fonts.googleapis.com/…">` | **BLOCKED** (network) | Self-host: `@font-face` with bundled/base64 WOFF2 |
| Iconify API (`api.iconify.design`) | **BLOCKED** (network) | Use the `icon-sets` JSON offline; inline the one SVG you need |
| `<img src="https://…illustration.svg">` | **BLOCKED** (network) | Inline the SVG, or `data:` URI |
| Inline `<svg>…</svg>` | **PASS** | Default for icons, marks, illustrations, patterns |
| CSS `background-image: url("data:image/svg+xml,…")` | **PASS** | Default for textures/patterns |
| `@font-face { src: url("data:font/woff2;base64,…") }` | **PASS** | Default for fonts |
| Inline `<audio>` with `data:audio/…;base64,…` | **PASS** | Default for sound |
| Inlined `lottie-web` + JSON as a JS string | **PASS** (no eval, no WASM) | Only motion library that qualifies |
| Rive `.riv` + WASM runtime | **BLOCKED** (`wasm-unsafe-eval` needed) | Exclude; substitute SVG/CSS or Lottie |
| WebGL/Canvas shader (own code) | **PASS** (no eval) | Fine for backgrounds; watch perf (E1/H2) |

So for the rest of this document, **"CSP verdict: PASS (download & inline)"** is the norm; the notable exceptions (Rive, hotlinked players, remote fonts, non-commercial shaders) are called out explicitly.

### 4.2 The licence-tier compliance model (read this before any table)

This is the decision the machine agent needs most. Map every asset to an SPDX-style identifier, then to a verdict:

| Licence | Attribution? | Share-alike / copyleft? | Commercial? | Derivatives (recolour/tokenise/edit)? | Verdict for the tool |
|---|---|---|---|---|---|
| **CC0-1.0** / Public Domain | No | No | Yes | Yes | **GREEN** — ideal; store, redistribute, modify freely |
| **MIT / ISC / BSD-2/3** | Keep notice | No | Yes | Yes | **GREEN** — carry the short notice in NOTICES |
| **Apache-2.0** | Keep NOTICE | No | Yes | Yes | **GREEN** — notice + explicit patent grant |
| **OFL-1.1** | No (in UI) | Yes (bundle stays OFL) | Yes | Yes (keep Reserved Font Name rules) | **GREEN** for embedding; keep OFL if you ship the raw font file |
| **CC-BY-4.0** | **Yes** | No | Yes | Yes | **AMBER** — attribution ledger mandatory |
| **CC-BY-SA-4.0 / 3.0** | Yes | **Yes (viral)** | Yes | Yes, but derivative inherits SA | **AMBER** — SA can force your combined asset open; avoid where the output must stay proprietary |
| **unDraw custom** | No | No | Yes | Yes | **AMBER** — no repackaging/packs, no scraping, no AI-training; use per-image only |
| **Lottie Simple License** | No | Derivatives same terms | Yes | Yes | **AMBER** — no compiling into a competing library |
| **Remix Icon License v1.0** | No | No | Yes | Yes | **AMBER** — include licence copy if you ship the whole set |
| **CC-BY-NC / NC-SA / NC-ND** | — | — | **No** | — | **RED** — reject (commercial tool) |
| **CC-BY-ND** | Yes | — | Yes | **No** | **RED** — can't tokenise/edit → useless for variants |
| **Unknown / All-rights-reserved / unverified** | — | — | — | — | **RED** — quarantine until cleared |

**Two traps this table encodes:**
- **ShareAlike (SA) is viral.** If you embed a CC-BY-SA texture into a combined asset and distribute it, the SA term can require you to license the derivative under CC-BY-SA too. For a tool whose output users may treat as their own proprietary work, prefer CC0/MIT and treat SA sources (Subtle Patterns, some Wikimedia media) as last resort.
- **"Free" ≠ "open".** Custom "free" licences (unDraw, Lottie Simple, Mixkit, Pixabay, Freepik/Storyset) permit *use* but usually forbid *redistribution as a pack/library* — exactly what a registry does. The safe pattern: use them **in generated output**, don't **store them as a redistributable registry pack**. CC0/MIT/OFL assets have no such split and are the only ones safe to bulk-store.

### 4.3 Category — UI component libraries & collections

The registry's core. Two shapes: **libraries** (a coherent system — daisyUI, Flowbite) and **collections** (loose copy-paste snippets — HyperUI, UIverse). For a single-file vanilla tool, collections that emit plain HTML/CSS are worth more than React libraries you must de-framework.

| Source | What's there | Licence (verified) | Attribution | Download / self-host + CSP | Quality | Gaps / pitfalls |
|---|---|---|---|---|---|---|
| [HyperUI](https://hyperui.dev/) ([LICENSE](https://github.com/markmead/hyperui/blob/main/LICENSE)) | 200+ Tailwind marketing/app/e-com blocks, plain markup | **MIT** | Notice in NOTICES | Copy HTML; Tailwind→compile to static CSS. PASS | High, clean, responsive | Tailwind-classed — must compile; light-mode-biased, add dark tokens |
| [daisyUI](https://daisyui.com/) ([LICENSE](https://github.com/saadeghi/daisyui/blob/master/LICENSE)) | Semantic component classes over Tailwind; themeable, built-in dark | **MIT** | Notice | Ship the daisyUI CSS (or compiled subset) inline. PASS | High; excellent theming/dark | Depends on its CSS layer; prune to used components |
| [shadcn/ui](https://ui.shadcn.com/) ([LICENSE](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)) | Copy-in React + Radix + Tailwind components; a11y-strong | **MIT** | Notice | Heavy de-framework (React→HTML, Radix behaviours→vanilla). PASS after work | Very high a11y/structure | React/Radix coupling; most expensive to vanilla-ise |
| [Flowbite](https://flowbite.com/) (core [MIT](https://github.com/themesberg/flowbite)) | Tailwind components + interactive JS; large catalogue | **MIT** (core); **Flowbite Pro/Blocks paid** | Notice | Core HTML/CSS inline; its JS is a data-attribute plugin (no eval) → PASS | High | Free vs Pro split — verify each block is from the MIT core, not Pro |
| [Preline UI](https://preline.co/) ([LICENSE](https://preline.co/docs/license.html)) | 300+ Tailwind components + plugin JS | **MIT** (+ fair-use note) | Notice | HTML/CSS inline; check JS is eval-free. PASS | High | "Fair use" wording — read it; some pro templates separate |
| [UIverse](https://uiverse.io/) ([LICENSE](https://github.com/uiverse-io/galaxy/blob/main/LICENSE)) | 6,000+ community CSS/Tailwind micro-components (buttons, toggles, cards, loaders) | **MIT** (© Uiverse.io) | Notice | Copy HTML+CSS directly; often zero-JS. **Best fit** for the sandbox | Variable (community) — grade hard | Quality varies wildly; many use fixed px/no dark; dedupe heavily |
| [Tailblocks](https://tailblocks.cc/), [Meraki UI](https://merakiui.com/) | Ready Tailwind blocks/sections | **MIT** (verify per repo) | Notice | Copy HTML; compile Tailwind. PASS | Good | Verify each repo's LICENSE before bulk ingest |
| [CodePen](https://codepen.io/) (public) ([licensing](https://blog.codepen.io/documentation/licensing/)) | Endless CSS/JS experiments, effects, novel components | **Public pens auto-MIT** — *for the author's own code only* | Notice | Copy source; vet embedded assets. PASS | Extremely variable | **Trap:** MIT covers the author's code, **not** third-party fonts/images/libs they embedded, and can't grant rights to copied copyrighted work. Prefer pens with an explicit licence; quarantine anything embedding unclear assets |
| [Radix Primitives](https://www.radix-ui.com/), [Headless UI](https://headlessui.com/) | Unstyled accessible behaviours (React/Vue) | **MIT** | Notice | Use as a **behaviour reference**, re-implement vanilla. PASS | High (a11y patterns) | React/Vue only — mine the ARIA/keyboard pattern, not the code |
| **Commercial alternative** | [Tailwind Plus](https://tailwindcss.com/plus) (ex-Tailwind UI) | Paid, proprietary | — | — | Reference-grade | One line only: **not** free; never ingest |

**Working rule:** for the sandbox, rank sources by **de-framework cost**: UIverse/CodePen (plain HTML/CSS, cheap) > HyperUI/Preline/Flowbite (Tailwind, compile) > daisyUI (ship its CSS layer) > shadcn/Radix (React+behaviour, expensive). Ingest cheap-and-clean first.

### 4.4 Category — Icon sets

All the recommended sets ship **individual SVGs** that inline with `currentColor` — the perfect sandbox asset. Prefer **outline sets with a consistent stroke/grid** for UI (D2 owns consistency).

| Source | What's there | Licence (verified) | Attribution | Download / CSP | Quality | Gaps |
|---|---|---|---|---|---|---|
| [Lucide](https://lucide.dev/) ([licence](https://lucide.dev/license)) | ~1,600 clean outline icons; Feather's successor | **ISC** (main); ~120 Feather-derived icons **MIT**, © 2013– Cole Bemis | Keep ISC/MIT notice | npm/`lucide-static` SVGs; inline. PASS | Very high, consistent 24px grid | Outline-only (no filled variants for some) |
| [Heroicons](https://heroicons.com/) ([LICENSE](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE)) | ~300 icons, outline/solid/mini/micro, 24 & 20px | **MIT** | Notice | SVGs in repo; inline. PASS | Very high (Tailwind team) | Smaller set; UI-centric, few domain glyphs |
| [Tabler Icons](https://tabler.io/icons) ([LICENSE](https://github.com/tabler/tabler-icons/blob/main/LICENSE)) | **6,100+** outline + filled, 24px 2px-stroke | **MIT** | Notice | SVGs/webfont; inline SVG. PASS | High, huge coverage | Some niche icons thinner in polish |
| [Phosphor](https://phosphoricons.com/) ([LICENSE](https://github.com/phosphor-icons/core/blob/main/LICENSE)) | ~9,000 across 6 weights (thin→fill, duotone) | **MIT** | Notice | SVGs; inline. PASS | High; weight range is unique | Weight sprawl — pick one weight per project |
| [Material Symbols](https://fonts.google.com/icons) ([LICENSE](https://github.com/google/material-design-icons/blob/master/LICENSE)) | ~3,300 icons, variable (weight/fill/grade/optical size) | **Apache-2.0** | NOTICE | Static SVGs from repo; inline. PASS | Very high; variable axes | Variable **font** axes don't survive inline-SVG — export the static SVG you need |
| [Feather](https://feathericons.com/) ([LICENSE](https://github.com/feathericons/feather/blob/main/LICENSE)) | ~290 minimalist outline icons | **MIT**, © Cole Bemis | Notice | SVGs; inline. PASS | High but **low maintenance** now | Largely superseded by Lucide — prefer Lucide |
| [Bootstrap Icons](https://icons.getbootstrap.com/) ([LICENSE](https://github.com/twbs/icons/blob/main/LICENSE)) | ~2,000 icons, outline + filled | **MIT** | Notice | SVGs; inline. PASS | High | Slightly heavier visual style |
| [Remix Icon](https://remixicon.com/) ([Licence](https://github.com/Remix-Design/RemixIcon/blob/master/License)) | ~3,000 icons, line + fill pairs | **Remix Icon License v1.0** (attribution optional; include licence if shipping whole set) | Optional | SVGs; inline. PASS | High | **Not** Apache-2.0 as often assumed — verify (they relicensed) |
| [Iconify icon-sets](https://github.com/iconify/icon-sets) | **200+ sets, ~300k icons**, normalised JSON **with per-set licence metadata** | Framework **MIT**; each set keeps its own licence (some require attribution) | Per set | Use the JSON **offline** (not the API); inline. PASS | Aggregator — quality is the underlying set's | **Do not hotlink the Iconify API.** Filter to permissive sets; carry per-set licence |
| [SVG Repo](https://www.svgrepo.com/) ([licensing](https://www.svgrepo.com/page/licensing/)) | ~500k icons/vectors, **mixed** licences | CC0 / MIT / CC-BY / GPL / Apache / MPL / OFL / proprietary — **per file** | Per file | Download SVG; inline. PASS | Variable | **Licence is per-icon** — never assume; filter to CC0/MIT |

**Ingestion accelerator:** the **Iconify `icon-sets` repo** is the highest-leverage bulk source — hundreds of sets already normalised to identical JSON *with a `license` field per set*. Ingest from it offline (respect each set's licence via `collections.md`), and you get provenance for free.

### 4.5 Category — Brand / logo marks (trademark ≠ licence)

This is the category most likely to create legal exposure. **The rule is structural:** an open licence can free the *SVG path data*, but it **cannot** free the *trademark* — only the brand owner controls that.

| Source | What's there | Licence of the *data* | Trademark status | CSP | Pitfalls |
|---|---|---|---|---|---|
| [simple-icons](https://simpleicons.org/) ([LICENSE](https://github.com/simple-icons/simple-icons/blob/master/LICENSE.md), [DISCLAIMER](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md)) | ~3,300 brand SVGs (single-colour marks) | **CC0-1.0** for the project's SVG data | **Trademarks/copyrights remain with owners.** Project states CC0 "doesn't mean to imply that all icons within the project are also CC0"; users must check brand guidelines and get permissions | Download SVG; inline. PASS | Do **not** recolour/distort a mark, imply endorsement, or use decoratively. Store trademark-owner + "trademark, not licensed" flag |
| [SVGL](https://svgl.app/) | Logos incl. wordmarks, some full-colour | Site is a gallery; **per-logo brand rights apply** | Same as above — trademarks belong to owners | Download; inline. PASS | No blanket licence; treat every logo as trademark-restricted |
| [VectorLogoZone](https://www.vectorlogo.zone/) | Tech/product logos | Marks used under nominative fair use; **trademarks owned by brands** | Same | Download; inline. PASS | For "works with X" style reference only |

**Operating policy for brand marks:**
1. Use a brand mark **only to identify that brand** (a real "Sign in with GitHub", a genuine integration list) — never as decoration or to imply a relationship that doesn't exist.
2. **Never modify** the mark's colour, proportions, or form (violates brand guidelines even when the SVG is CC0).
3. Record `trademark_owner` and set `licence = CC0 (data) / trademark-restricted (use)`; grade these entries **conditional** — the agent must confirm real brand context before placing one.
4. When in doubt, prefer a **generic category icon** (from §4.4) over a brand mark.

### 4.6 Category — Fonts

Fonts are the highest-value / highest-CSP-friction category: a wrong `<link>` to Google's API is the classic sandbox break. **Self-host, subset, inline.**

| Source | What's there | Licence | Attribution | Download / self-host + CSP | Quality | Gaps |
|---|---|---|---|---|---|---|
| [Google Fonts](https://fonts.google.com/) ([licence guide](https://googlefonts.github.io/gf-guide/license-file.html)) | ~1,700 families | **Mostly OFL-1.1**; a few older ones **Apache-2.0** — check per family | No (UI use) | "Download family" → WOFF2; `@font-face` inline. **Never use the CSS API link.** PASS when self-hosted | Broad, reliable | Licence varies by family — verify; huge families need subsetting |
| [Fontsource](https://fontsource.org/) ([docs](https://fontsource.org/docs)) | Google + open fonts packaged **for self-hosting** via npm, with WOFF2 + per-font licence | Per font (OFL/Apache) | Per font | npm package ships WOFF2 + licence file; inline. PASS | Same fonts, self-host-ready | Still verify the specific font's licence field |
| [OFL fonts catalogue](https://openfontlicense.org/ofl-fonts/) | Curated OFL families | **OFL-1.1** | No | Download; inline. PASS | Varies | Discovery index, not a CDN |
| **Commercial alternative** | Adobe Fonts / MyFonts | Paid, licence-gated | — | — | — | Never ingest; can't self-host/inline |

**OFL obligations, precisely ([SIL guidance](https://community.software.sil.org/t/ofl-license-requirements-for-self-hosting-google-fonts/3769)):**
- **Web embedding (self-host / inline) carries near-zero obligation** — you do *not* have to expose OFL.txt to end users when the font is only used to render your page.
- **Distributing the raw font file as a standalone download** *does* require shipping the OFL text. The registry should therefore keep the OFL text in the entry (for compliance) even though the inlined variant needn't surface it.
- **Reserved Font Name (RFN):** if you *modify* an OFL font, you may **not** distribute it under its reserved name. Subsetting for web use is fine; forking-and-renaming needs a new name.
- **Subsetting is mandatory practice, not licence:** a full family as base64 can be 100–400 KB per weight. Subset to used glyphs/weights (a Latin-basic subset of a variable font is often <30 KB WOFF2) to keep the single file sane. (Byte budgets are H2/E1's domain; the *practice* belongs here.)

### 4.7 Category — Motion assets (Lottie / SVG / CSS / Rive)

Cross-reference **B1** for how motion behaves once embedded; H1 owns *sourcing and the CSP verdict.*

| Source / format | What's there | Licence | Attribution | CSP / offline verdict | Pitfalls |
|---|---|---|---|---|---|
| [LottieFiles](https://lottiefiles.com/) free tab ([Simple License](https://lottiefiles.com/page/license)) | Thousands of JSON vector animations | **Lottie Simple License (FL 9.13.21)** — commercial OK, **attribution optional** | Optional | Download JSON; play with inlined `lottie-web`. PASS | Licence forbids "compiling Files… to replicate a competing service" — use per-asset, don't bulk-mirror; some items are **premium** (not Simple License) — verify per file |
| [`lottie-web`](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md) | The player | **MIT**, © Bodymovin | Notice | Plain JS, **no eval, no WASM** → inline the player + JSON string. PASS | ~250 KB min / ~60 KB gz; Canvas renderer ignores CSS |
| **Pure SVG + CSS/SMIL** | Stroke-draw, morph, transform | Web platform | — | **Best for the sandbox.** Inline; zero JS. PASS | Author yourself or adapt CC0 SVGs; SMIL morph needs compatible node counts |
| [Rive community](https://rive.app/community/files/) | Interactive state-machine animations | Runtime **MIT** ([licence](https://github.com/rive-app/rive-runtime/blob/main/LICENSE)); **community-file reuse terms are per-file/unclear** | Per file | **BLOCKED** — web runtime is **WebAssembly**; needs `wasm-unsafe-eval`. Exclude from a no-eval CSP | Great tech, wrong constraint; also don't assume community files are openly licensed |
| [SVGator](https://www.svgator.com/) exports (if self-made) | SVG/CSS/SMIL animations | Your own output | — | Inline. PASS | Free tier limits/watermark — verify before relying |

**Decision:** for the sandbox, **SVG+CSS first**, **inlined Lottie** for designer-authored complexity, **never Rive**. Bulk-ingesting LottieFiles into the registry risks the "competing service" clause — store a *few* vetted JSONs, or author SVG/CSS.

### 4.8 Category — Illustrations

The split from Rule 7 is the whole game: **CC0 sets you can store and redistribute** vs **custom-"free" sets you may only use per-image in output.**

| Source | What's there | Licence | Attribution | Store-as-pack? | CSP | Pitfalls |
|---|---|---|---|---|---|---|
| [unDraw](https://undraw.co/) ([licence](https://undraw.co/license)) | Large, recolourable flat-vector library (single accent colour) | **Custom open licence** — commercial OK, **no attribution** | No | **No** — licence forbids "distribute the assets in packs," scraping, and **AI-training** | Download SVG per image; inline. PASS | Use per-image in a rendered variant; do **not** bulk-store; recolour via its accent only |
| [Open Peeps](https://www.openpeeps.com/) | Hand-drawn mix-&-match characters | **CC0-1.0** | No | **Yes** | Inline. PASS | Style is distinctive (can read "trendy") |
| [Open Doodles](https://www.opendoodles.com/) | Loose sketchy scenes/figures | **CC0-1.0** | No | **Yes** | Inline. PASS | Sketch style not for every brand |
| [Humaaans](https://www.humaaans.com/) | Mix-&-match human figures | **CC0-1.0** (Pablo Stanley) | No | **Yes** | Inline. PASS | Verify CC0 on the download page at ingest |
| [Storyset](https://storyset.com/) ([terms](https://storyset.com/terms)) | Customisable, some animated | **Freepik/Storyset free licence — attribution required** for free tier | **Yes** | Only with attribution ledger | Download SVG; inline. PASS | Attribution is mandatory — AMBER; keep the credit string |
| [DrawKit](https://www.drawkit.com/) | Mixed illustration/icon packs | **Mixed** — some free/CC0, many paid | Per pack | Per pack | Inline free ones. PASS | Verify each pack's licence; don't assume |
| [SVG Repo — illustrations](https://www.svgrepo.com/) | Aggregated vectors | Mixed (per file) | Per file | CC0/MIT only | Inline. PASS | Per-file licence check |

### 4.9 Category — Textures / noise / patterns

Mostly **SVG or tiny PNG tiles** → `background-image: url("data:…")`. The licence surprises here are real (attribution, share-alike).

| Source | What's there | Licence | Attribution | CSP | Pitfalls |
|---|---|---|---|---|---|
| [Hero Patterns](https://heropatterns.com/) | ~90 repeatable SVG background patterns | **CC BY 4.0** (per site footer) | **Yes** | Download SVG → data-URI background. PASS | Attribution required — AMBER; older write-ups call it "free," so **verify at ingest** |
| [Pattern Monster](https://pattern.monster/) | Generator: thousands of customisable seamless SVG patterns | Generated patterns stated **free for personal & commercial use** (tool is open-source) | No (stated) | Export SVG → data-URI. PASS | Confirm the "free to use" statement for the version you use; flag as verify |
| [Transparent Textures](https://www.transparenttextures.com/) / [Subtle Patterns](https://github.com/atlemo/SubtlePatterns) | ~500 subtle tiling PNG textures | **CC BY-SA 3.0** | **Yes + ShareAlike** | Tile PNG → data-URI. PASS | **SA is viral** — AMBER/near-RED for proprietary output; prefer generating noise instead |
| **Generated CSS noise/gradients** | `conic/radial-gradient`, SVG `feTurbulence` noise, CSS `background` tiles | **Your own output** — no third-party licence | No | Inline CSS/SVG. PASS | **Best default:** author noise/patterns so there's *no* licence to track. SVG `feTurbulence` gives film-grain with zero assets |
| [SVG Backgrounds](https://www.svgbackgrounds.com/) | Configurable SVG backgrounds | **Mixed** (free set + paid) | Per asset | Inline. PASS | Free vs paid split — verify |

**Preferred pattern:** for noise and simple geometric texture, **generate it** (CSS gradients, SVG `feTurbulence`) — zero licence, zero attribution, perfectly CSP-safe. Reach for a library only for a specific motif, and then CC0/MIT first.

### 4.10 Category — Shaders / animated backgrounds

The licence, not the CSP, is the blocker. WebGL/Canvas *techniques* run under strict CSP (no eval); but the *code you'd copy* is usually badly licensed.

| Source | What's there | Licence | CSP | Verdict |
|---|---|---|---|---|
| [Shadertoy](https://www.shadertoy.com/) | Vast GLSL fragment-shader gallery | **Default CC BY-NC-SA 3.0 — non-commercial** (authors may pick another, rarely) | Technique PASS; code licence RED | **Do not ingest** unless an individual shader is explicitly CC0/MIT. NC + SA make it unusable for a commercial tool |
| **Own CSS/Canvas/WebGL** | Gradients, mesh gradients, particle fields, `feTurbulence` | **Your output** | PASS | **Preferred** — author generative backgrounds; no licence to track |
| MIT/CC0 shader collections (e.g. specific GitHub repos with an explicit permissive LICENSE) | Curated GLSL | Per repo (**must be MIT/CC0**) | PASS | Only with a verified permissive LICENSE file — check every time |
| **Commercial alternative** | Paid shader/background packs | Proprietary | — | Never ingest |

**Rule:** treat "animated background" as a **generate-it** category, not a source-it category. If you must source, demand an explicit MIT/CC0 LICENSE in the repo; Shadertoy's default kills reuse.

### 4.11 Category — Sound (UI feedback, ambience)

Short, subtle, **gesture-gated**, encoded as base64 `data:audio/…`. CC0 first.

| Source | What's there | Licence | Attribution | Store-as-pack? | CSP | Pitfalls |
|---|---|---|---|---|---|---|
| [Kenney](https://kenney.nl/assets/interface-sounds) | UI/interface sound packs (clicks, toggles, confirms) | **CC0-1.0** | No | **Yes** | Encode WAV/OGG→base64 `data:`. PASS | Game-flavoured; pick neutral clicks |
| [Freesound](https://freesound.org/) | Huge community SFX library | **Mixed** — filter to **CC0**; others CC-BY / CC-BY-NC | Per file | CC0 only | base64 data-URI. PASS | **Filter to CC0**; CC-BY needs ledger; NC = RED |
| [Pixabay](https://pixabay.com/sound-effects/) ([terms](https://pixabay.com/service/terms/)) | SFX + music | **Pixabay Content License** — commercial OK, **no attribution** | No | Only in output, not as pack | data-URI. PASS | Forbids redistributing content on a similar/competing platform; per-file check for recognisable trademarks |
| [Mixkit](https://mixkit.co/license/) | SFX + music | **Mixkit Free License** — commercial OK, no attribution | No | Only in output | data-URI. PASS | **No standalone redistribution;** full terms behind "View License" — **verify** before relying |
| **Commercial alternative** | Epidemic Sound / Artlist | Subscription | — | — | — | Never ingest |

**Practice:** UI sound must be **off by default** and triggered by a user gesture (browsers block autoplay anyway); keep clips <1–2 s so base64 stays small. Default to **Kenney (CC0)** and **Freesound CC0**.

---

### 4.12 Ingestion methodology — turning a found asset into a registry entry

A registry entry is a normalised record + the embeddable bytes. Fields (kept as structured columns in the registry store — shown here as a table, **not** shipped as JSON):

| Field | Meaning | Example | Why it matters |
|---|---|---|---|
| `id` | Stable slug, `category/name-variant` | `component/stat-card-01` | Selection, dedupe |
| `category` / `subcategory` | Top taxonomy | `component` / `data-display` | Retrieval |
| `tags` | Free tags: style, density, use | `card, metric, minimal, dark-ready` | Search/match (A-tracks consume) |
| `source_url` | Exact origin | `https://uiverse.io/…` | Provenance, re-check |
| `author` | Creator/foundry | `Jane Doe` | Attribution |
| `licence` | SPDX-style ID | `MIT` | Compliance (§4.2) |
| `licence_url` | Canonical licence | `…/LICENSE` | Audit |
| `attribution_text` | Required credit string, or `none` | `none` | NOTICES assembly |
| `framework_origin` | What it was | `react+tailwind` | De-framework tracking |
| `framework_final` | What it is now | `vanilla-html-css` | Guarantee |
| `dependencies` | Runtime deps after ingest | `none` (or `lottie-web@5`) | CSP gate |
| `csp_verdict` | PASS / conditional / FAIL | `PASS` | Hard gate |
| `dark_light` | `both` / `light-only` / `dark-only` | `both (tokenised)` | Theming |
| `responsive` | Breakpoint behaviour | `fluid 320–1440` | Layout fit |
| `a11y` | Semantics/focus/contrast notes | `role=button, focus-visible, AA` | A5 input |
| `quality_grade` | A–F (§4.15) | `B` | Ship gate |
| `preview` | Rendered thumbnail (data-URI PNG/SVG) | — | Human + agent scan |
| `hash_struct` / `hash_visual` | Dedupe hashes | — | §4.14 |
| `ingested_at` | Date | `2026-07-23` | Freshness/audit |

**The pipeline (8 steps):**
1. **Capture** — URL, author, licence (read the actual LICENSE file, not a badge), screenshot. If licence is unclear → **quarantine**, don't proceed.
2. **Sanitise** — run HTML through **DOMPurify** (strip scripts/handlers/`javascript:` URIs); run SVG through **SVGO** — *but* configure it **not** to drop licence/metadata you need (SVGO's default strips `<metadata>`; keep a NOTICES record externally, see §4.16).
3. **De-framework** — JSX→HTML, Tailwind→compiled scoped CSS, remove build deps; convert interactivity to CSS-only or inline no-eval JS (§4.13).
4. **Tokenise** — replace hard-coded colours/spacing with CSS custom properties; add a `prefers-color-scheme: dark` block (§4.13 example).
5. **Grade** — score on the rubric (§4.15).
6. **De-duplicate** — compute structural + visual hashes; collapse near-duplicates (§4.14).
7. **Tag** — style/density/use tags for the A-tracks.
8. **Record provenance + NOTICES** — write the licence/attribution row; add to the ledger (§4.16). Render the preview.

### 4.13 Stripping framework coupling (React/Tailwind → vanilla)

The registry ships **one self-contained HTML file** — so every entry must be framework-free. Three coupling types and their fixes:

**A. JSX / React → HTML.**
- `className` → `class`; `htmlFor` → `for`; self-closing non-void tags get closing tags.
- Resolve props/state to **static** values (a `{value}` becomes a real string; a `{items.map(...)}` becomes literal repeated markup).
- Replace event handlers + state with **CSS-only interactivity** where possible: `<details>/<summary>` (accordion/disclosure), the **`popover`** attribute (menus/tooltips), `:has()` (parent-state), the **checkbox-hack** (`<input type=checkbox>` + `:checked`) for toggles/tabs, `:target` for routed panels. Where genuine JS is needed, write **inline vanilla with no `eval`/`new Function`**.
- Radix/Headless behaviours: don't port the library — reimplement the **ARIA + keyboard pattern** it documents (roles, `aria-expanded`, arrow-key handling) in ~20 lines of vanilla.

**B. Tailwind utility classes → CSS.** Two paths:
- **Compile (preferred):** run the snippet's markup through the Tailwind CLI to emit the *exact* static CSS for the classes used, then inline that CSS and keep the classes. Deterministic, complete, dark-variant-aware.
- **Translate:** for tiny snippets, hand-convert utilities to a scoped class (`p-6`→`padding:1.5rem`, `rounded-xl`→`border-radius:.75rem`). Faster for one button; error-prone at scale.
- Either way, **map Tailwind's palette to CSS variables** so the entry is themeable (`bg-slate-800` → `background: var(--surface-dark)`).

**C. Runtime/library dependencies.** Anything needing a bundler, a CDN, or WASM is disqualified until removed. Icon-font classes (`<i class="fa-…">`) → replace with the **inline SVG** of that glyph. A charting lib → out of scope for a snippet (that's a whole-app concern).

### 4.14 De-duplication

Near-duplicates (the same button from three collections, or one component posted twice) dilute selection and inflate the registry. Two-layer dedupe:

- **Structural hash.** Normalise the DOM: strip whitespace/comments, sort attributes, drop author-specific class names, canonicalise the CSS (sorted declarations, normalised units/colours). Hash the result. Exact structural matches → keep the highest-graded, drop the rest.
- **Visual hash.** Render the entry to a fixed-size thumbnail and compute a **perceptual hash** (pHash/aHash). Two entries within a small Hamming distance (e.g. ≤ 6/64 bits) are visual near-duplicates even if their markup differs → keep the better-coded one.
- **Semantic near-dupe.** Same category + heavily overlapping tags + similar visual hash → flag for human review rather than auto-merge (they may be legit variants worth keeping as *distinct* options).

**Rule:** dedupe **before** grading spend — don't polish two copies of the same card.

### 4.15 Quality grading rubric

Score each dimension 0–2, sum to 14, map to a grade. Only **A/B** ship by default.

| Dimension (0–2 each) | 0 | 1 | 2 |
|---|---|---|---|
| **Rendering fidelity** | Broken/misaligned | Minor issues | Pixel-clean as intended |
| **Responsive** | Fixed px, overflows | Works at 2 sizes | Fluid 320–1440, no overflow |
| **A11y** | No semantics, no focus | Semantic but gaps | Semantic + focus-visible + AA contrast + reduced-motion |
| **Dark/light** | Light-only, baked hex | One theme + partial | Both via tokens |
| **Self-containment / CSP** | Needs network/eval/WASM | Minor external | Fully inline, no-eval PASS |
| **Code cleanliness** | Bloated/obfuscated | Acceptable | Minimal, readable, tokenised |
| **Distinctiveness** | Generic default look | Competent | Characterful without being gimmicky (F2 confirms) |

**Grade bands:** A = 12–14, B = 9–11, C = 6–8 (repair before use), D = 3–5, F = 0–2 (reject). **Hard gates override the sum:** any `csp_verdict = FAIL` or `licence = RED/unknown` is an automatic **F** regardless of score.

### 4.16 Provenance & licence compliance (the attribution ledger)

- **Every entry carries its licence row** (§4.12). This is non-negotiable — an asset with no confirmed licence is RED.
- **Attribution ledger / NOTICES.** Maintain a machine-readable ledger keyed by entry id: licence, copyright line, attribution string. When a variant ships, **assemble the NOTICES** from exactly the entries it used (MIT/ISC/Apache/OFL/CC-BY all need their notice carried) and include it in the output (e.g. an HTML comment block or an "Attributions" section). CC0 needs nothing; CC-BY needs the credit; SA needs the credit *and* flags a copyleft obligation on the derivative.
- **SVGO metadata trap.** SVGO's default config removes `<metadata>`/comments — which can delete the very licence note you needed ([svgo#431](https://github.com/svg/svgo/issues/431)). Fix: keep licence data in the **registry field + NOTICES**, not only inside the SVG; if you must keep it in-file, disable `removeMetadata`.
- **Quarantine lane.** Unverified licence, `-NC`, `-ND`, or "all rights reserved" → quarantine, never auto-ship. A human clears or discards.
- **Trademark lane (brand marks).** CC0 *data* + owned *trademark* → conditional entries (§4.5); the agent must confirm real brand context before use.
- **Re-verification.** Licences change (Remix Icon moved off Apache to its own v1.0; Hero Patterns is now CC BY). Store `ingested_at` and re-check licences periodically; treat memory of a licence as **unverified** until the LICENSE file is read.

### 4.17 How to search for components effectively

**Query patterns that work:**
- Scope to known-good sources: `site:uiverse.io toggle switch`, `site:hyperui.dev pricing table`.
- Force the constraints into the query: `pricing card tailwind component MIT github`, `accessible tabs vanilla css no javascript`.
- For behaviour patterns (not code): `combobox aria keyboard pattern` → then re-implement vanilla (§4.13).
- Prefer the **source repo** over a listicle — read the actual `LICENSE`.

**The right sites, by need:**
- **Plain HTML/CSS micro-components:** UIverse, CodePen (public, licence-checked).
- **Tailwind blocks/sections:** HyperUI, Preline, Tailblocks, Meraki UI, Flowbite (core).
- **Full systems with dark/theming:** daisyUI.
- **Accessible behaviour reference:** Radix, Headless UI, the WAI-ARIA Authoring Practices.
- **Icons:** Iconify (offline JSON) as the meta-index; then Lucide/Tabler/Phosphor/Heroicons directly.

**Evaluate a found snippet in ~60 seconds:**
1. **Licence** — is there a real LICENSE file / explicit licence? Unknown → stop.
2. **View source** — plain HTML/CSS (cheap) or React/Tailwind/deps (costlier)?
3. **Dependencies** — any CDN/library/icon-font/WASM? Each is de-framework work.
4. **Responsive** — resize to 320px and 1440px; does it hold?
5. **A11y** — Tab through it: is there a visible focus ring, real semantics, sane order?
6. **Dark** — any dark handling, or baked-in white?
7. **Distinctiveness** — generic default, or does it earn a slot? (F2.)

If it passes 1 and clears 3–4 quickly, ingest; otherwise skip — the registry is better small and clean than large and coupled.

---

### Worked example 1 — Tailwind + React card → vanilla, tokenised registry entry

**Found** (a component site; React + Tailwind, light-only, `className`, props):

```jsx
export function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
```

**Ingested** (semantic HTML, scoped tokenised CSS, dark via `prefers-color-scheme`, zero deps, CSP PASS):

```html
<article class="stat-card">
  <p class="stat-card__label">Monthly revenue</p>
  <p class="stat-card__value">$48,200</p>
</article>
<style>
  .stat-card{
    background:var(--surface,#fff); color:var(--text,#0f172a);
    border-radius:12px; padding:24px;
    box-shadow:0 4px 6px -1px rgb(0 0 0 / .1);
  }
  .stat-card__label{ margin:0; font-size:.875rem; color:var(--text-muted,#64748b); }
  .stat-card__value{ margin:.5rem 0 0; font-size:1.875rem; font-weight:600; }
  @media (prefers-color-scheme: dark){
    .stat-card{ --surface:#1e293b; --text:#fff; --text-muted:#94a3b8; }
  }
</style>
```

**Registry entry:**

| Field | Value |
|---|---|
| `id` | `component/stat-card-01` |
| `category` | `component / data-display` |
| `tags` | `card, metric, kpi, minimal, dark-ready` |
| `source_url` | *(the found page)* |
| `author` / `licence` | *(page author)* / `MIT` |
| `attribution_text` | *(MIT notice → NOTICES)* |
| `framework_origin` → `final` | `react+tailwind` → `vanilla-html-css` |
| `dependencies` / `csp_verdict` | `none` / **PASS** |
| `dark_light` / `responsive` | `both (tokenised)` / `fluid` |
| `a11y` | `semantic; AA in both themes` |
| `quality_grade` | `B` (add responsive type scale → A) |

*Notes:* props resolved to static text; Tailwind's `dark:` variants became a `prefers-color-scheme` block; palette became tokens so A1 can re-theme.

### Worked example 2 — Offline icon + SVG pattern + attribution ledger

**Inline icon (Lucide "search", ISC).** No network; scales with `currentColor`:

```html
<button class="icon-btn" aria-label="Search">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round"
       stroke-linejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
</button>
```

**SVG pattern as a data-URI background** (generate-your-own dots — no third-party licence):

```css
.hero{
  background-color:#4f46e5;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.25'/%3E%3C/svg%3E");
}
```

**Attribution-ledger rows** (assembled into the shipped NOTICES because ISC requires the notice; the generated pattern needs none):

| Asset | Licence | Notice to ship |
|---|---|---|
| Lucide `search` | ISC | `Lucide © Lucide Contributors (ISC). Feather-derived icons © 2013– Cole Bemis (MIT).` |
| Dot pattern | — (self-generated) | none |

*CSP verdict:* both **PASS** — inline SVG and a `data:` URI, zero requests, no eval.

### Worked example 3 — Self-host + inline an OFL font (compact)

```css
@font-face{
  font-family:"Inter"; font-style:normal; font-weight:400; font-display:swap;
  /* subset to used glyphs; base64 kept small */
  src:url("data:font/woff2;base64,d09GMgABAAAAAA…") format("woff2");
}
:root{ font-family:"Inter", system-ui, sans-serif; }
```

Registry note: `licence = OFL-1.1`; `reserved_font_name = "Inter"` (don't rename a modified copy "Inter"); OFL text kept in the entry (needed only if the raw font file is redistributed standalone, not for inlined web use); **subset before base64** to keep the single file lean (H2/E1 own byte budgets).

---

## 5. Options catalogue — ingestion & embedding tooling

The per-category *sources* live in §4.3–4.11. This catalogue is the **tooling** that turns a found asset into a clean, CSP-safe entry. Columns: what · when to use · when NOT · licence · where · cost/CSP feasibility · pitfalls.

| Tool | What it is | When to use | When NOT | Licence | Where to get | Cost / CSP feasibility | Pitfalls |
|---|---|---|---|---|---|---|---|
| **DOMPurify** | XSS/HTML sanitiser (DOM-only) | Cleaning any ingested HTML snippet before storage | Non-HTML assets | **Apache-2.0 OR MPL-2.0** (dual) | [cure53/DOMPurify](https://github.com/cure53/DOMPurify/blob/main/LICENSE) | Build-time (Node) — not shipped in output | Configure allow-list; it won't fix layout, only safety |
| **SVGO** | SVG optimiser/minifier | Shrinking icons/illustrations/patterns pre-inline | When you must keep in-file metadata | **MIT** | [svg/svgo](https://github.com/svg/svgo) | Build-time; output inlines. PASS | **Default strips `<metadata>`/comments** ([#431](https://github.com/svg/svgo/issues/431)) — keep licence in the registry, or disable `removeMetadata` |
| **Tailwind CSS CLI** | Compiles utility classes → static CSS | De-frameworking Tailwind snippets (§4.13) | Non-Tailwind snippets | **MIT** | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Build-time; emits inlinable CSS. PASS | Emit only used classes (purge) or CSS bloats |
| **Iconify `icon-sets`** | 200+ icon sets as normalised JSON **with per-set licence** | Bulk icon ingest with provenance | Hotlinking the live API (blocked) | Framework **MIT**; sets keep own licence | [iconify/icon-sets](https://github.com/iconify/icon-sets) | Use JSON offline; inline SVGs. PASS | Respect each set's licence via `collections.md`; never call the API at runtime |
| **Fontsource** | Open fonts packaged for self-hosting (WOFF2 + licence) | Getting a self-hostable, subsettable font quickly | Fonts not in its index | Per font (**OFL/Apache**) | [fontsource.org](https://fontsource.org/docs) | npm; inline the WOFF2. PASS | Still verify the specific font's licence field |
| **`lottie-web`** | Lottie JSON player | Designer-authored complex motion in-sandbox | Simple motion CSS can do; tight budgets | **MIT** | [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | Inline player + JSON string; no eval/WASM. PASS | ~250 KB min; Canvas renderer ignores CSS |
| **A font subsetter** (e.g. `fonttools`/`glyphhanger`-style) | Reduces a font to used glyphs | Every inlined font | — | (tool-dependent — verify) | — | Build-time; shrinks base64 dramatically | Confirm the subsetting tool's own licence; keep RFN rules |
| **Perceptual-hash lib** (pHash/aHash) | Visual near-dupe detection | Step 6 dedupe (§4.14) | Exact-match cases (use structural hash) | (lib-dependent — verify) | — | Build-time | Tune the Hamming threshold to avoid merging legit variants |
| **Headless browser** (screenshot) | Renders entry → preview + visual hash | Previews, visual dedupe, render-fidelity grading | — | (engine-dependent) | — | Build-time | Render at fixed size/theme for comparable hashes |

*(The consolidated single-file feasibility matrix across CSS/SVG/Canvas/WebGL/WASM is **H2**; motion behaviour is **B1**.)*

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Hotlinked asset** | Blank icon/font/animation in sandbox; CSP console error (blocked request to a CDN/API) | Download; inline SVG / base64 WOFF2 / data-URI / inlined no-eval JS (§4.1) |
| **Remote font (`fonts.googleapis.com`)** | Fallback font renders; network blocked | Self-host: `@font-face` with bundled/base64 WOFF2 (§4.6) |
| **Rive won't run** | Blank where a Rive mark should be; WASM/eval CSP error | Swap to inlined Lottie, SVG+CSS, or WAAPI (§4.7) |
| **Licence assumed from memory** | Ships an "MIT" asset that relicensed (e.g. Remix Icon → v1.0; Hero Patterns → CC BY) | Read the actual LICENSE at ingest; store `ingested_at`; re-verify periodically (§4.16) |
| **Non-commercial asset ingested** | A Shadertoy background, a Freesound `-NC` clip in a commercial variant | Filter to CC0/MIT/permissive; RED-list all `-NC`/`-ND` (§4.2, §4.10) |
| **Brand mark misused** | A logo recoloured/decorative/implying endorsement | Restrict to genuine brand reference; never modify; flag trademark owner (§4.5) |
| **unDraw stored as a pack** | Bulk unDraw SVGs in the redistributable registry | Use per-image in output only; store CC0 illustration sets instead (§4.8) |
| **Attribution dropped** | CC-BY/MIT/OFL asset shipped with no notice; SVGO stripped metadata | Maintain the ledger; assemble NOTICES into output; keep licence in registry field (§4.16) |
| **ShareAlike contamination** | CC-BY-SA texture embedded; derivative now owes SA | Prefer CC0/generated textures; treat SA as near-RED for proprietary output (§4.2, §4.9) |
| **Framework coupling shipped** | Entry contains `className`, JSX, Tailwind classes with no compiled CSS, or a CDN dep | De-framework fully before storing; `framework_final = vanilla` gate (§4.13) |
| **Baked-in light theme** | White backgrounds on a dark variant; hard-coded hex | Tokenise; add `prefers-color-scheme: dark` (§4.13) |
| **Duplicate bloat** | Three near-identical buttons offered as "options" | Structural + visual hash dedupe before adding (§4.14) |
| **Unknown-licence asset shipped** | No LICENSE found but ingested anyway | Quarantine lane; never auto-ship unverified (§4.16) |
| **CodePen third-party assets assumed MIT** | A pen's embedded font/image/library treated as MIT | MIT covers the author's *own* code only; vet embedded assets separately (§4.3) |
| **Oversized base64 font** | Single file balloons; slow parse | Subset to used glyphs/weights before base64 (§4.6) |
| **Autoplay sound** | Browser blocks it / users startled | Muted by default; play on user gesture; keep clips short (§4.11) |

---

## 7. Pre-flight checklist (run before shipping any sourced asset)

- [ ] **CSP:** asset is embedded as inline SVG / base64 / data-URI / inlined no-eval JS — **no** `<link>`/`<script src>`/`<img src>`/API/WASM (§4.1).
- [ ] **Licence read from source**, mapped to SPDX, tier GREEN or AMBER-with-obligation-met; RED/unknown quarantined (§4.2).
- [ ] **Provenance recorded:** source URL, author, licence URL, attribution string, `ingested_at` (§4.12).
- [ ] **Attribution ledger updated;** NOTICES will assemble into any output that uses this asset (§4.16).
- [ ] **Brand marks:** trademark owner recorded; used only as genuine brand reference; unmodified (§4.5).
- [ ] **Fonts:** OFL/Apache; subset; RFN respected; OFL text kept in entry (§4.6).
- [ ] **Illustrations:** CC0 if stored as a pack; unDraw/custom-"free" used per-image only, not bulk-stored (§4.8).
- [ ] **Motion:** Lottie inlined (no eval); **no Rive**; LottieFiles not bulk-mirrored (§4.7).
- [ ] **Shaders/backgrounds:** generated-your-own or explicitly MIT/CC0; **no Shadertoy default** (§4.10).
- [ ] **Sound:** CC0-first; off by default + gesture-gated; short data-URI (§4.11).
- [ ] **De-frameworked:** `framework_final = vanilla`; CSS-only interactivity preferred; no build/CDN deps (§4.13).
- [ ] **Tokenised:** dark/light both via CSS variables; no baked hex (§4.13).
- [ ] **Graded A/B** on the rubric; C repaired, F rejected; hard gates (CSP FAIL / licence RED = auto-F) applied (§4.15).
- [ ] **De-duplicated** structurally + visually against the registry (§4.14).

---

## 8. Open questions / unverified

- **Hero Patterns licence = CC BY 4.0** was read from the live site footer (July 2026); older articles call it "free to use." The attribution requirement is material — **re-confirm at ingest** and, if in doubt, generate the pattern instead. *(Verify.)*
- **Pattern Monster** generated-output terms ("free for personal & commercial use") were taken from the tool's own statements, not a formal licence document. **Verify** for the version used; the underlying generator code is open-source but that's separate from the output-use grant.
- **Mixkit Free License** exact redistribution terms sit behind a "View License" click that did not render in fetch; the "no standalone redistribution, commercial OK, no attribution" summary is the well-documented shape but the **precise clause set is unverified** — read it before relying, or prefer Kenney/Freesound CC0.
- **Haikei** generated-asset licence was **not confirmed** from the homepage (TOS not fetched). Treat generated Haikei SVGs as *unverified* until the TOS/pricing licence is read; the safe path is self-generated backgrounds.
- **Rive community-file reuse:** runtimes are MIT, but individual community `.riv` files carry **no blanket open licence** — and Rive is CSP-blocked anyway. Don't assume community files are reusable.
- **Remix Icon** now uses a bespoke **"Remix Icon License v1.0"** (read July 2026), not Apache-2.0 as many secondary sources still claim — a live example of why memory ≠ verification. Re-read on each major version.
- **CodePen default licence:** CodePen's docs state public pens are MIT — but this covers the *author's own code*, cannot cover embedded third-party assets, and cannot launder copied copyrighted work. Treated here as AMBER with per-pen asset vetting; the exact ToS interaction with embedded assets is worth a legal read for high-volume ingestion.
- **Humaaans / Open Doodles / Open Peeps CC0** were confirmed as CC0 from the projects and secondary sources; re-check the specific download page's stated licence at ingest (creators occasionally change terms).
- **Per-family Google Fonts licence** varies (mostly OFL, some Apache) — never assume; read the family's licence tab.
- **Subsetter / pHash / screenshot tool licences** are intentionally left tool-agnostic here; pick specific tools and verify each one's licence before adopting.

---

## 9. Sources

Licences (verified from primary sources, July 2026):
- Icons — [Heroicons MIT](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE); [Lucide licence: ISC + Feather-MIT](https://lucide.dev/license); [Tabler MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE); [Material Symbols Apache-2.0](https://github.com/google/material-design-icons/blob/master/LICENSE); [Feather MIT](https://github.com/feathericons/feather/blob/main/LICENSE); [Phosphor MIT](https://github.com/phosphor-icons/core/blob/main/LICENSE); [Bootstrap Icons MIT](https://github.com/twbs/icons/blob/main/LICENSE); [Remix Icon License v1.0](https://github.com/Remix-Design/RemixIcon/blob/master/License).
- Brand marks — [simple-icons CC0 LICENSE](https://github.com/simple-icons/simple-icons/blob/master/LICENSE.md) and [DISCLAIMER (trademark caveat)](https://github.com/simple-icons/simple-icons/blob/master/DISCLAIMER.md).
- Aggregators — [Iconify icon-sets (per-set licences)](https://github.com/iconify/icon-sets); [SVG Repo licensing (mixed)](https://www.svgrepo.com/page/licensing/).
- Fonts — [Google Fonts licence guide](https://googlefonts.github.io/gf-guide/license-file.html); [SIL OFL](https://openfontlicense.org/); [Fontsource docs](https://fontsource.org/docs); [SIL community: OFL self-hosting requirements](https://community.software.sil.org/t/ofl-license-requirements-for-self-hosting-google-fonts/3769).
- Components — [shadcn/ui MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md); [daisyUI MIT](https://github.com/saadeghi/daisyui/blob/master/LICENSE); [HyperUI MIT](https://github.com/markmead/hyperui/blob/main/LICENSE); [Flowbite (MIT core)](https://github.com/themesberg/flowbite); [Preline licence](https://preline.co/docs/license.html); [UIverse MIT](https://github.com/uiverse-io/galaxy/blob/main/LICENSE); [CodePen licensing](https://blog.codepen.io/documentation/licensing/).
- Illustrations — [unDraw licence (custom; no-repackaging/no-AI-training)](https://undraw.co/license); [Open Peeps](https://www.openpeeps.com/); [Open Doodles](https://www.opendoodles.com/); [Humaaans](https://www.humaaans.com/); [Storyset terms (attribution)](https://storyset.com/terms).
- Patterns/textures — [Hero Patterns (CC BY 4.0 per site)](https://heropatterns.com/); [Pattern Monster](https://pattern.monster/); [Subtle Patterns CC BY-SA 3.0](https://github.com/atlemo/SubtlePatterns); [Transparent Textures](https://www.transparenttextures.com/).
- Motion — [Lottie Simple License](https://lottiefiles.com/page/license); [lottie-web MIT](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md); [Rive runtime MIT](https://github.com/rive-app/rive-runtime/blob/main/LICENSE); [Rive community](https://rive.app/community/files/).
- Shaders — [Shadertoy terms (default CC BY-NC-SA)](https://www.shadertoy.com/terms) *(fetch 403 in July 2026; default licence is widely documented — verify)*.
- Sound — [Kenney CC0](https://kenney.nl/assets/interface-sounds); [Freesound](https://freesound.org/); [Pixabay terms](https://pixabay.com/service/terms/); [Mixkit licence](https://mixkit.co/license/).
- Tooling — [DOMPurify (Apache-2.0/MPL-2.0)](https://github.com/cure53/DOMPurify/blob/main/LICENSE); [SVGO MIT](https://github.com/svg/svgo) and [metadata-stripping issue #431](https://github.com/svg/svgo/issues/431); [Tailwind CSS MIT](https://github.com/tailwindlabs/tailwindcss).

Unverified / time-sensitive (see §8): Hero Patterns CC BY (re-confirm), Pattern Monster output terms, Mixkit exact clauses, Haikei output licence, Rive community-file reuse, per-family Google Fonts licence, and any subsetter/pHash/screenshot tool licences. Treat all licence claims as **re-verify-at-ingest**; licences change (Remix Icon and Hero Patterns both moved since their commonly-cited terms).
