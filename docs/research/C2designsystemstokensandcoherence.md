# C2 — Design systems, tokens & coherence (fidelity)

*Design-intelligence reference. Track C2 of the registry research map. Written to be read by the design agent before it locks a single token or assembles a second component, and by a human owner auditing that the N built variants actually read as ONE system.*

---

## 1. Scope line

This track owns **coherence as a guarantee**: how design decisions are captured as **tokens** in a layered architecture (primitive → semantic → component), how those tokens are **named** and **aliased**, how one token set **themes** into light/dark and multiple brands, how you make **N independently-built components read as a single system** (shared radii/spacing/type/elevation/motion ramps and one state vocabulary), how you **measure** that coherence (audits, drift detection, what to diff and to what tolerance), how you **verify a built component matches its spec** (spec sheets, visual regression, tolerances), and how the system **versions, deprecates, and documents** itself so it survives handoff to the next agent or human.

## 2. Boundary (what this track does **not** cover)

- **What a *single* component contains** — its anatomy, its own enumerated variants and states → **C1 Component anatomy & taxonomy**. C1 says *what parts a button has and what states it can be in*; C2 says *the hover token every component shares* and *how to prove all buttons drew from it*.
- **Whether the result is *pretty*, on-trend, or distinctive** → **F1 / F2 (aesthetics & distinctiveness)**. C2 guarantees *consistency*; a perfectly coherent system can still be ugly. Coherence ≠ taste.
- **The colour-ramp math** (how step 9 of a scale is computed, contrast targets) → **A1**. C2 governs how that finished ramp is *aliased and shared*, not how its steps are generated.
- **The spacing/type scale math** (the modular ratio, the 4/8-pt grid derivation) → **A3**. C2 governs that every component *draws from the one scale* and invents no off-ramp value.
- **How a single elevation/shadow or material is built** → **A4**. C2 governs the *shared elevation ramp* across components.
- **The motion ramp itself** (duration ladder, easing curves) → **B1**. C2 governs that motion tokens are *shared and named* system-wide, so "standard transition" means one thing everywhere.
- **When a state change fires** (the trigger, the affordance) → **C1 / interaction-states track**. C2 owns the *shared, tokenised vocabulary* of states, not the per-component wiring.
- **The consolidated single-file feasibility matrix across all techniques** → **H2 Feasibility**. C2 gives token/theming/audit CSP-offline verdicts inline; H2 is the master matrix.

---

## 3. Executive rules (apply these before reading the body)

1. **Three layers, one direction: primitive → semantic → component.** A literal value (`#2563eb`, `8px`, `200ms`) lives **only** in the primitive layer. Semantic tokens reference primitives; component tokens reference semantics. Never skip a layer (component → primitive) and never reverse. This single rule is what makes theming a re-point instead of a rewrite. ([Material 3 token tiers](https://github.com/material-components/material-web/blob/main/docs/theming/README.md), [Nathan Curtis — Naming Tokens](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676))
2. **Name primitives by *value*, semantics by *role*, components by *part*.** `--blue-600` (primitive, context-free) → `--color-action-primary` (semantic, intent) → `--button-primary-bg` (component, scope). A primitive named for a role (`--blue-primary`) or a semantic named for a colour (`--color-blue-action`) is a defect — it welds a decision to a value and breaks theming.
3. **Cap alias depth at 3 hops and keep every chain traceable.** primitive → semantic → component is the target. Chains deeper than 3 resolve slowly, hide drift, and make an audit unable to say *why* a value is what it is.
4. **One ramp per dimension, referenced everywhere.** Radii, spacing, type sizes, elevation, motion durations and the colour scale each come from **one** scale (built by A1/A3/A4/B1). C2's job is that every component consumes that one scale and no component introduces an off-ramp `border-radius: 7px` when the ramp is 4/8/12/16.
5. **One state vocabulary, applied identically.** Define the state set once — `rest, hover, focus-visible, active, selected, disabled, loading, invalid/error, read-only` — and the token delta for each. Every component maps its states to the *same* tokens: "hover" must be the same semantic lightening on a button, a menu row, and a card.
6. **Ship tokens as CSS custom properties on `:root` — that is the only CSP-safe, offline delivery.** No build tool, JSON catalogue, or webfont fetch ships inside the single-file artifact. Style Dictionary / DTCG JSON are **build-time**; the delivered file carries only the *resolved* `--token: value` declarations. (CSP verdict: `:root{--x:…}` is 100% inlinable, zero network, zero eval.)
7. **Theme by re-pointing the semantic layer, not by editing components.** Swap brand or mode by changing which primitives the semantic tokens alias, scoped by `:root`, `[data-theme="…"]`, `.dark`, or `@media (prefers-color-scheme)`. All CSP-safe; a runtime toggle needs only a class/attribute flip (no eval). ([Radix aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing), [shadcn/ui theming](https://ui.shadcn.com/docs/theming))
8. **Prefer OKLCH for colour tokens, ship an sRGB fallback.** OKLCH (CSS Color 4) is perceptually uniform and CSP-native; it makes "same hue, one step darker on hover" a predictable maths op. Support is current-browser (~2023+); provide a hex/`rgb()` fallback value for old engines. ([shadcn/ui uses OKLCH](https://ui.shadcn.com/docs/theming))
9. **No component may hold a raw value that duplicates a token.** A literal `border-radius: 8px` sitting next to `--radius-2: 8px` is drift-in-waiting; route it through the token. Detect with a linter or a computed-style audit (§4.7). ([@lapidist/design-lint](https://github.com/bylapidist/design-lint))
10. **Prove coherence — don't assume it — with a computed-style audit.** Enumerate the ramps, render each component, `getComputedStyle`, and check every radius/spacing/colour/shadow/duration is *on-ramp* AND that the *same semantic role resolves to the same value across components*. Tolerances: geometry ±0.5–1 px; colour ΔE(CIEDE2000) ≤ 1 pass / ≤ 2 warn / > 2 fail (§4.7–4.8).
11. **Verify built components against a spec sheet with tolerances, not by eye.** Each component spec lists the token per property per state; fidelity = rendered value equals the spec token within tolerance. Pixel-diff (visual regression) catches what token-diff misses — set a mismatch budget (Playwright `threshold` default **0.2** per-pixel; a changed-pixel ratio ≤ **0.1–0.2 %** page-level). ([Playwright snapshots](https://playwright.dev/docs/api/class-snapshotassertions))
12. **Version with SemVer; renames and removals are MAJOR.** Adding a token = MINOR; a value tweak within the same role = PATCH (or MINOR if visually material). Never hard-delete a token — mark it `$deprecated`, alias it to its replacement, and keep it for a stated window (industry practice **3–18 months**). ([Curtis — Versioning Design Systems](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d))
13. **The token *is* the documentation and the handoff contract.** Lock every decision as a token *reference*, not a raw value, so the mockup, the implementation spec, and any regenerated variant all speak one vocabulary. A well-formed name (`category-concept-property-variant-state`) is self-documenting.
14. **Use the DTCG format for interchange — with eyes open (honesty flag).** The *Design Tokens Format Module 2025.10* is stable and vendor-neutral (`$value`/`$type`/`$description`/`$deprecated`, `{group.token}` aliases), **but it is a Community Group Final Report, NOT a W3C Recommendation**, and tool support for 2025.10 is still catching up (Style Dictionary added DTCG in v4; full 2025.10 support is WIP in v5). Use it as source-of-truth interchange; don't assume every tool round-trips it losslessly. ([DTCG 2025.10 status](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [Style Dictionary DTCG](https://styledictionary.com/info/dtcg/))

---

## 4. Body

### 4.1 What is a token, and what are the three layers?

A **design token** is a named, indivisible design decision — a colour, a dimension, a duration — stored once and referenced everywhere, so the decision can change in one place. The near-universal architecture is **three layers**, each with a different job and a different naming logic:

| Layer | A.k.a. | Job | Named for | Example (illustrative) | May reference |
|---|---|---|---|---|---|
| **Primitive** | base, reference (`md.ref`), global (Spectrum), option, core | Hold the raw values — the full palette/scale as context-free options | Its **value** | `--blue-600: #2563eb;` `--space-4: 16px;` `--radius-2: 8px;` `--dur-3: 200ms;` | Nothing (literals only) |
| **Semantic** | alias, system (`md.sys`), functional (Primer), decision | Assign roles/intent; this is where design *decides* | Its **role** | `--color-action-primary: var(--blue-600);` `--radius-control: var(--radius-2);` | Primitives |
| **Component** | component-specific (`md.comp`), scoped | Bind a component part to a semantic default; exists only to override | Its **part** | `--button-primary-bg: var(--color-action-primary);` | Semantics (occasionally primitives for one-offs) |

This maps cleanly onto every mature system: **Material 3** uses `--md-ref-*` → `--md-sys-*` → component tokens (note: component tokens are *not* prefixed `comp` in Material) ([Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)); **Adobe Spectrum** uses *global → alias → component-specific* ([spectrum-design-data](https://github.com/adobe/spectrum-design-data), Apache-2.0); **GitHub Primer** uses *base → functional → component/pattern* ([Primer token names](https://primer.style/product/primitives/token-names/)).

**DTCG anatomy of one token** (the interchange format, [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/)):

```jsonc
// illustrative — this is BUILD-time source, not what ships in the file
"color": {
  "blue": { "600": { "$type": "color", "$value": "#2563eb", "$description": "Primitive blue 600" } },
  "action": {
    "primary": { "$type": "color", "$value": "{color.blue.600}", "$description": "Default primary action surface" }
  }
}
```

Key DTCG properties: **`$value`** (required), **`$type`** (color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, plus composite border/shadow/transition/gradient/typography), **`$description`**, **`$deprecated`** (boolean or string reason), **`$extensions`** (vendor metadata). Aliases use **`{group.token}`** curly-brace syntax resolving to the whole `$value`; a JSON-Pointer form `{"$ref":"#/…"}` reaches a sub-property. Names may not start with `$` or contain `{`, `}`, `.`. ([DTCG format draft](https://www.designtokens.org/tr/drafts/format/))

> **Honesty flag.** The `designtokens.org/tr/drafts/format/` preview page literally says "Do not attempt to implement this version." The **stable** reference is *2025.10* ([announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)), which is a **Final Community Group Report** under the W3C Community Final Specification Agreement — *"not a W3C Standard nor on the W3C Standards Track."* It is royalty-free and stable enough to build on; it is not a formal web standard.

### 4.2 Naming — the grammar

Nathan Curtis's taxonomy is the canonical decomposition. A token name is a **path** assembled from ordered segments ([EightShapes — Naming Tokens](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)):

| Segment group | Segments | Role | Example fragment |
|---|---|---|---|
| **Namespace** | system / theme / domain | Prefix to avoid collisions | `acme-`, `esds-` |
| **Object** | component / element / group | Scope to a part (component layer) | `button`, `field` |
| **Base** | **category** · **property** · **concept** | The backbone: *what kind* · *which CSS role* · *grouped purpose* | `color` · `background` · `feedback` |
| **Modifier** | **variant** · **state** · **scale** · **mode** | Refinement, appended last | `error` · `hover` · `01` · `dark` |

Recommended order: **namespace → object → category → property → concept → variant → state → scale/mode**. Curtis's worked name: `esds-color-feedback-background-error-hover`. Not every token uses every segment; use the fewest that make the name unambiguous.

**How the real systems name — a comparison you can copy:**

| System | Primitive pattern | Semantic pattern | Component pattern | Delimiter |
|---|---|---|---|---|
| **Material 3** | `--md-ref-palette-primary40` | `--md-sys-color-primary` | `--md-filled-button-container-color` | hyphen, `ref/sys` prefixes |
| **IBM Carbon** | (internal palette) | `$text-primary`, `$layer-01`, `$background-hover`, `$support-error`, `$border-subtle-01` | component-scoped | hyphen, numbered layer sets |
| **GitHub Primer** | `base-color-blue-5`, `base-size-4` | `fgColor-default`, `bgColor-muted`, `borderColor-default` | `control-danger-borderColor-rest` | hyphen; `property-variant-scale` |
| **Adobe Spectrum** | global (`gray-800`, `size-100`) | alias (`neutral-content-color-default`) | component-specific | hyphen, 3 tiers |
| **Salesforce SLDS** | — | global hook `--slds-g-color-*` | component hook `--slds-c-button-brand-color-background` | `--slds-{g\|c}-[component]-[category]-[property]-[state]` |
| **shadcn/ui** | (Radix/OKLCH values) | `--background`/`--foreground`, `--primary`/`--primary-foreground`, `--muted`, `--destructive`, `--border`, `--ring`, `--radius` | (consumed directly) | hyphen; **background/foreground pairing** |
| **Radix Colors** | `--blue-1 … --blue-12` (12-step) | alias `--accent-1 … --accent-12` → a scale | consumed via steps | hyphen; numbered 12-step scale |

Sources: [Carbon color tokens](https://carbondesignsystem.com/elements/color/tokens/), [Primer token names](https://primer.style/product/primitives/token-names/), [SLDS styling hooks](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html), [shadcn/ui theming](https://ui.shadcn.com/docs/theming), [Radix scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale).

**Two naming conventions worth stealing wholesale:**

- **shadcn/ui's `background`/`foreground` pairing.** The surface token drops the `-background` suffix; the text/icon on it takes `-foreground`. So `--primary` is the surface, `--primary-foreground` is what sits on it. This guarantees every surface ships with a legible on-colour and makes contrast a *pairing* rule, not a per-use guess. ([shadcn/ui](https://ui.shadcn.com/docs/theming))
- **Radix's 12-step semantic scale.** Each step has a *fixed job* (below), so "which blue for a hovered button background" is answered by the step number, identically for every hue. This is the single strongest device for cross-component colour coherence.

| Radix step | Designated use |
|---|---|
| **1** | App background |
| **2** | Subtle background (striped rows, cards, code blocks) |
| **3** | UI element background — rest |
| **4** | UI element background — hover |
| **5** | UI element background — active/selected |
| **6** | Subtle borders & separators (non-interactive) |
| **7** | UI element border & focus ring (interactive) |
| **8** | Stronger border — hovered element |
| **9** | Solid background — purest step (buttons, graphics, overlays) |
| **10** | Solid — hover of step 9 |
| **11** | Low-contrast text (secondary) |
| **12** | High-contrast text (primary) |

Source: [Radix — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale). Steps 11–12 are guaranteed to hit accessible contrast on a step-2 background.

### 4.3 Aliasing rules

Aliasing is what turns three flat lists into a system. The rules:

| Rule | Statement | Why |
|---|---|---|
| **Direction** | Reference only *downward*: component → semantic → primitive. Never upward, never sideways within a layer (no long primitive→primitive chains). | Keeps the dependency graph a shallow tree; a cycle is invalid in DTCG and un-resolvable. |
| **Depth** | ≤ 3 hops from component to literal. | Deeper chains hide *why* and slow resolution/audit. |
| **Literals live once** | Raw values (`#…`, `px`, `ms`) appear **only** at the primitive layer. | A literal anywhere else is un-themeable drift. |
| **Primitives are dumb** | Primitives are named for value, never role (`--gray-900`, not `--text-color`). | A role-named primitive can't be re-pointed per theme. |
| **Semantics are the decision surface** | All theming/branding edits happen here by swapping which primitive a semantic aliases. | One layer to re-point = one place to theme. |
| **Component tokens are optional** | Create one only when a component must deviate from the semantic default; otherwise consume the semantic directly. | Avoids a combinatorial explosion of component tokens nobody reads. |

DTCG expresses aliasing with `{group.token}`; the CSS-var runtime equivalent is `var(--…)`, and both are CSP-safe at delivery because `var()` resolution is native.

### 4.4 Worked Example 1 — a primitive → semantic → component chain

Trace **one component (primary button)** across **two properties (background colour, corner radius)** through all three layers. Values illustrative; note OKLCH primary with hex fallback.

**Layer 1 — primitives (the only place literals live):**

```css
:root{
  /* colour ramp (A1 builds it; C2 shares it) */
  --blue-600: #2563eb;                 /* sRGB fallback first… */
  --blue-600: oklch(0.55 0.20 264);    /* …OKLCH wins where supported */
  --blue-700: oklch(0.49 0.20 264);
  --white:    #ffffff;
  /* radius ramp (A3) */         --radius-2: 8px;
  /* spacing ramp (A3) */        --space-3: 12px;  --space-4: 16px;
  /* motion ramp (B1) */         --dur-2: 150ms;   --ease-standard: cubic-bezier(.2,0,0,1);
}
```

**Layer 2 — semantics (the decision + theming surface):**

```css
:root{
  --color-action-primary:        var(--blue-600);
  --color-action-primary-hover:  var(--blue-700);
  --color-on-action:             var(--white);       /* foreground pairing */
  --radius-control:              var(--radius-2);
  --space-control-pad-y:         var(--space-3);
  --space-control-pad-x:         var(--space-4);
  --motion-control:              var(--dur-2) var(--ease-standard);
}
```

**Layer 3 — component (bind parts; exists to allow override):**

```css
:root{
  --button-primary-bg:        var(--color-action-primary);
  --button-primary-bg-hover:  var(--color-action-primary-hover);
  --button-primary-fg:        var(--color-on-action);
  --button-radius:            var(--radius-control);
  --button-pad:               var(--space-control-pad-y) var(--space-control-pad-x);
}
.btn-primary{
  background: var(--button-primary-bg);
  color:      var(--button-primary-fg);
  border-radius: var(--button-radius);
  padding:    var(--button-pad);
  transition: background var(--motion-control);
}
.btn-primary:hover{ background: var(--button-primary-bg-hover); }
```

**What this buys, concretely:**
- **Theme by re-point.** A dark theme or a second brand overrides *only* the semantic layer: `[data-theme="brandB"]{ --color-action-primary: var(--violet-600); }`. Every button (and every other component consuming `--color-action-primary`) updates. Components are untouched.
- **Coherence by construction.** A second component (e.g. a segmented control's selected segment) that also needs the primary action colour references `--color-action-primary` — *the identical token* — so the two can never drift.
- **Audit-ability.** The chain `.btn-primary` → `--button-primary-bg` → `--color-action-primary` → `--blue-600` is 3 hops and machine-traceable.

**The anti-pattern this prevents:** a component author writing `background:#2563eb` directly. It renders identically *today*, but it is invisible to theming and will silently diverge the day `--blue-600` shifts to `#2563ea`. Rule 9 forbids it; §4.7's audit detects it.

### 4.5 Theming & multi-brand

All practical theming reduces to **scoping the semantic layer**. Five approaches, all CSP-safe at delivery:

| Approach | Mechanism | Toggle cost | CSP/offline | When |
|---|---|---|---|---|
| **`prefers-color-scheme`** | `@media (prefers-color-scheme: dark){ :root{ …semantic overrides… } }` | **Zero JS** (OS-driven) | Native, CSP-safe | Light/dark that should follow the OS |
| **Attribute scope** | `[data-theme="dark"]{ … }`, `[data-brand="b"]{ … }` on a wrapper | 1 attribute flip (tiny JS, no eval) | Native, CSP-safe | Manual theme/brand switch |
| **Class scope** | `.dark{ … }` (shadcn/Tailwind convention) | 1 class flip | Native, CSP-safe | Same as above; framework-idiomatic |
| **Alias re-point** | Keep component/CSS identical; only change `--semantic: var(--primitiveX)` per scope | inherited from scope | Native, CSP-safe | Multi-brand from one component set (Radix pattern) |
| **DTCG Resolver / modes** | Build-time: token "modes/sets" resolve to per-theme CSS ([DTCG Resolver 2025.10](https://www.designtokens.org/tr/drafts/resolver/), Tokens Studio / Terrazzo "modes") | build-time only | Build tool, **not shipped**; output is plain CSS | When one source must emit many themes |

**The re-point pattern (Radix), minimal:**

```css
:root{                      /* brand A, light */
  --accent-9: var(--blue-9);   --accent-11: var(--blue-11);
}
.dark{                      /* dark: darker scale, same steps */
  --accent-9: var(--blue-dark-9); --accent-11: var(--blue-dark-11);
}
[data-brand="b"]{           /* brand B: swap the hue, steps unchanged */
  --accent-9: var(--violet-9);  --accent-11: var(--violet-11);
}
```

Because components only ever reference `--accent-9/11` (the *step*, i.e. the role), swapping the hue or mode never touches a component. ([Radix aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing))

**Colour space note (CSP-relevant).** Author ramps in **OKLCH** so per-theme deltas are predictable (hover = same L−0.06, same C, same H). OKLCH is CSS-native (no library needed at runtime → CSP-safe). Provide an sRGB fallback by declaring the hex value first and the `oklch()` value second on the same custom property — old engines keep the hex, modern engines take the OKLCH. Runtime OKLCH→sRGB conversion (e.g. for a computed audit) can use **culori** (MIT) at *build/audit* time, not in the shipped file. ([culori](https://github.com/Evercoder/culori), [shadcn/ui OKLCH](https://ui.shadcn.com/docs/theming))

> **Honesty flag — SLDS caveat.** Salesforce's component-level styling hooks (`--slds-c-*`) are documented as *available in SLDS 1 as of Summer '25 and not yet supported in SLDS 2 (Cosmos)* ([SLDS docs](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html)). Treat SLDS as a *naming-grammar* reference, not a drop-in.

### 4.6 Guaranteeing N components read as one system

Coherence is not a vibe; it is five enforceable mechanisms. Wire all five.

1. **One ramp per dimension, defined once.** Radii, spacing, type, elevation, motion, colour each have a single scale at the primitive/semantic layer. *Enforcement:* every component consumes tokens from that scale; §4.7 audit proves no off-ramp values exist.
2. **A shared semantic layer = shared decisions.** "Primary action colour", "card surface", "control radius" are decided *once* and referenced by name. Two components physically cannot differ on a shared decision because they reference the same token.
3. **One state vocabulary, tokenised.** Every interactive component implements the same state set with the same token deltas (table below). *Enforcement:* the audit checks that, e.g., every component's `:hover` background resolves to the "hover" semantic, not a bespoke colour.
4. **A shared elevation/motion vocabulary.** "Resting card", "raised menu", "modal" map to fixed elevation tokens; "micro", "standard", "large-surface" map to fixed duration tokens. No component invents a 230 ms transition when the ramp is 150/200/300.
5. **Prove it, then keep proving it.** The coherence audit (§4.7) runs on every generated batch; drift is caught at assembly, not in production.

**The single state vocabulary (define once, apply everywhere):**

| State | Trigger (owned by C1/interaction track) | Shared token delta (owned here) | Typical realisation |
|---|---|---|---|
| **rest / default** | none | base semantic tokens | `--color-surface`, `--color-fg` |
| **hover** | pointer over, `@media (hover:hover)` | one-step surface shift | `--color-*-hover` (Radix step +1) |
| **focus-visible** | keyboard focus | ring token, never removed | `--ring` / `--focus-ring` (Radix step 7) |
| **active / pressed** | pointer down | two-step shift + optional scale | `--color-*-active` (Radix step +2) |
| **selected** | selection state | selected surface + accent border | `--color-*-selected` (Radix step 5) |
| **disabled** | `disabled`/`aria-disabled` | reduced-emphasis + no pointer | `--color-fg-disabled`, opacity token |
| **loading** | async pending | non-interactive + spinner/skeleton | shared skeleton/spinner tokens |
| **invalid / error** | validation fail | error border + error text/helper | `--color-border-error`, `--color-text-error` |
| **read-only** | read-only input | subdued field, no edit affordance | `--color-field-readonly` |

This is exactly the Carbon model made explicit — Carbon ships `-hover`/`-active`/`-selected`/`-disabled` variants of its surface, border and text tokens so *the delta is a token, not a component decision* ([Carbon color tokens](https://carbondesignsystem.com/elements/color/tokens/)). The **guarantee** is: because the deltas are tokens, a button and a list-row hovered side by side shift by the identical amount.

### 4.7 Measuring coherence — the audit (what to diff, what tolerance)

This is the part a machine agent runs. It has two independent checks:

**Check A — On-ramp membership.** Every *used* value must be a member of the corresponding ramp.
**Check B — Cross-component role consistency.** The *same semantic role* must resolve to the *same value* in every component that uses it.

**Procedure (agent-runnable, no eval, CSP-safe DOM APIs):**

1. **Enumerate the ramps.** Read `:root`; collect every `--*` custom property and its *resolved* value (`getComputedStyle(document.documentElement).getPropertyValue('--…')`). Bucket into ramps: radii, spacing, font-size, colour, shadow, duration, border-width.
2. **Harvest used values.** For each rendered component, walk its elements; for each, `getComputedStyle(el)` and read the audited properties (below). This yields the *actual* values, after all `var()` resolution — the ground truth.
3. **Check A (ramp membership).** For each used value, find the nearest ramp member and compute the delta; flag anything outside tolerance as **off-ramp drift**.
4. **Check B (role consistency).** Group used values by semantic role (e.g. tag each element with the token it *should* use). Within a role, all resolved values must be identical (within tolerance); a mismatch is **role drift**.
5. **Report a drift table:** `component · element · property · found · nearest-token · Δ · verdict`.

**What to diff, and the tolerance for each:**

| Property (computed) | Ramp it must belong to | Match rule | Tolerance |
|---|---|---|---|
| `border-radius` (each corner) | radii ramp | exact ramp membership | **±0.5 px** (rounding only) |
| `padding-*`, `gap`, `margin-*` | spacing ramp | exact ramp membership | **±1 px** (sub-pixel/rounding) |
| `font-size`, `line-height` | type ramp | exact ramp membership | **±0.5 px** / ±0.02 unitless |
| `border-width` | border-width ramp | exact ramp membership | **±0.5 px** |
| `color`, `background-color`, `border-color` | colour tokens | convert to OKLab, **ΔE (CIEDE2000)** to nearest token | **≤ 1 pass · ≤ 2 warn · > 2 fail** |
| `box-shadow` | elevation ramp | normalise (offsets/blur/spread/alpha) then match token | offsets/blur/spread **±0.5 px**; alpha **±0.02** |
| `transition-duration`, `animation-duration` | motion ramp | exact ramp membership | **±0 ms** (durations are discrete) |
| `transition-timing-function` | easing set | string/curve match | exact (or ±0.02 per control point) |

**Colour tolerance rationale (honesty flag).** ΔE is a *perceptual* colour distance. The widely-cited CIEDE2000 bands are: **ΔE < 1** = imperceptible to the human eye; **1–2** = perceptible only on close inspection; **2–10** = perceptible at a glance. So ΔE ≤ 1 "pass" means *visually identical*; > 2 means *a human would see two different colours where the system intends one*. These bands are established colorimetry heuristics, not per-observer guarantees — treat them as thresholds, not physics. Compute ΔE with **culori**'s `differenceCiede2000` (MIT) at audit time. ([culori](https://github.com/Evercoder/culori))

**Two things the audit must NOT do:** (1) don't diff *raw source CSS strings* — diff *computed* values, because `var()` chains, `calc()`, and cascade make source text a poor proxy; (2) don't treat "0px" and "0" or `rgb(37,99,235)` and `#2563eb` as different — normalise units and colour formats before comparing.

### 4.8 Worked Example 2 — a coherence audit on two generated components

**Input:** the agent has built a `Button` and a `Card`, each as an HTML/CSS snippet, plus the `:root` token block from §4.4.

**Step 1 — ramps harvested from `:root`:**

- radii `{ --radius-2: 8px }` → ramp `{8}` (plus other steps 4/12/16 in a real system)
- spacing `{ 12, 16 }`
- colour `{ --blue-600 = oklch(0.55 .20 264), --blue-700 = oklch(0.49 .20 264), --white = #fff }`
- motion `{ 150ms }`

**Step 2 — used values (from `getComputedStyle`):**

| Component | Element | Property | Found (computed) |
|---|---|---|---|
| Button | `.btn-primary` | border-radius | `8px` |
| Button | `.btn-primary` | background | `oklch(0.55 0.20 264)` |
| Button | `.btn-primary:hover` | background | `oklch(0.49 0.20 264)` |
| Card | `.card` | border-radius | `7px` ⚠ |
| Card | `.card` | background | `#ffffff` |
| Card | `.card__cta` | background | `#2563ea` ⚠ |
| Card | `.card` | transition-duration | `200ms` ⚠ |

**Step 3–4 — checks:**

| Finding | Check | Nearest token | Δ | Verdict |
|---|---|---|---|---|
| Card radius `7px` | A (ramp) | `--radius-2` (8px) | 1 px | **FAIL — off-ramp** (> ±0.5 px). Someone typed `7px`. Fix: `border-radius: var(--radius-control)`. |
| Card CTA bg `#2563ea` | A + B | `--blue-600` `#2563eb` | ΔE ≈ 0.1 | **WARN** — visually identical but *hardcoded* (a raw literal duplicating a token). Route through `--color-action-primary`; it will silently drift the day the token changes. |
| Card transition `200ms` | A (motion) | `--dur-2` (150ms) | 50 ms | **FAIL — off-ramp.** Card animates 200 ms where the control motion token is 150 ms. Fix: `transition: … var(--motion-control)`. |
| Button values | A + B | exact tokens | 0 | **PASS.** |

**Step 5 — role-consistency (Check B):** the Button's primary background is `oklch(0.55 .20 264)`; the Card CTA's is `#2563ea`. Both claim the "primary action" role. Normalised, ΔE ≈ 0.1 → they *look* the same today, but only the Button is *bound to the token*. The audit flags the Card CTA as **role drift risk**: same pixels now, divergence guaranteed later. This is the single most valuable thing the audit catches — *pixel-identical values that are not the same token* — which a screenshot diff (§4.9) would rate a perfect pass.

**Takeaway:** token-diff (this audit) and pixel-diff (next section) are complementary. Token-diff catches *un-tokenised but correct-looking* values (invisible to pixels); pixel-diff catches *rendering* regressions a token graph can't see (z-order, overflow, font fallback).

### 4.9 Component fidelity — spec sheets & visual regression

**Fidelity = the built component equals its spec, within tolerance.** Two layers of verification:

**(a) The spec sheet (the contract).** For each component, record — per property, per state — the *token* it must use (not a raw value). Minimal shape:

| Part | Property | rest | hover | focus-visible | disabled |
|---|---|---|---|---|---|
| container | background | `--button-primary-bg` | `--button-primary-bg-hover` | (unchanged) | `--color-*-disabled` |
| container | radius | `--button-radius` | — | — | — |
| container | ring | none | none | `--focus-ring` | none |
| label | color | `--button-primary-fg` | — | — | `--color-fg-disabled` |

Fidelity check = §4.7's audit run against *this* expected mapping. This is the machine-checkable half of a developer-handoff spec (the design-handoff skill produces the human-readable half).

**(b) Visual regression (the pixels).** Render the component, screenshot it, diff against an approved baseline. Set a **mismatch budget**:

| Tool | Metric | Sensible threshold | Notes |
|---|---|---|---|
| **Playwright `toHaveScreenshot`** | `threshold` (per-pixel YIQ), `maxDiffPixels`, `maxDiffPixelRatio` | per-pixel `threshold` **0.2** (default); ratio ≤ **0.001–0.002** (0.1–0.2 %) | Uses pixelmatch internally. ([docs](https://playwright.dev/docs/api/class-snapshotassertions)) |
| **pixelmatch** | mismatched-pixel count; `threshold` 0–1 | `threshold` **0.1** (default; smaller = stricter), YIQ + anti-alias detect | ISC licence. ([repo](https://github.com/mapbox/pixelmatch)) |
| **BackstopJS** | `misMatchThreshold` **0–100 %** | **0.1 %** for components, looser for full pages | Uses resemble.js; MIT. ([repo](https://github.com/garris/BackstopJS)) |
| **odiff** | `threshold` 0–1 | match pixelmatch semantics; SIMD, ~6–7× faster | MIT. ([repo](https://github.com/dmtrKovalenko/odiff)) |

**Tolerance guidance:** anti-aliasing and sub-pixel font rendering cause *legitimate* tiny diffs, so a **0-tolerance pixel diff always fails**. Use a per-pixel `threshold` around **0.1–0.2** *and* a total changed-pixel ratio budget (**≤ 0.1 %** for small components; **≤ 0.2 %** for pages). Mask known-dynamic regions (timestamps, avatars). Enable pixelmatch's anti-alias ignore where jitter is the problem.

**CSP/offline verdict for fidelity tooling.** All of these are **out-of-band review tools** run in Node + a headless browser — they **do not ship in the artifact**, so the strict-CSP single-file constraint doesn't touch them. They *do* require a rendering engine at review time. The *token* audit (§4.7), by contrast, is pure DOM API (`getComputedStyle`) and can run either out-of-band *or* inside the delivered file's own context without violating CSP (no eval, no network).

### 4.10 Versioning & deprecation

Treat the token set + component API as a versioned contract (SemVer `MAJOR.MINOR.PATCH`) ([Curtis — Versioning](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d)):

| Change | Bump | Example |
|---|---|---|
| Rename/remove a token; change a token's *meaning*; restructure layers | **MAJOR** | `--btn-bg` → `--button-primary-bg`; deleting `--space-4` |
| Add a new token; add a variant/state; widen a scale | **MINOR** | new `--color-action-tertiary` |
| Fix a value within the same role; docs; non-visual internals | **PATCH** | nudge `--blue-600` by ΔE < 1 to hit contrast |

*(A value change big enough to be visible — ΔE > 2, a radius step change — is arguably MINOR/MAJOR, not PATCH; use the audit's ΔE to decide.)*

**Deprecation, not deletion.** Mark the token `$deprecated` (DTCG supports a boolean or a string reason) and **alias the old name to the new one** for a stated window so nothing breaks mid-flight:

```css
/* deprecation shim: keep old name working, point it at the new one */
:root{ --btn-bg: var(--button-primary-bg); } /* @deprecated → remove in v3 */
```

Industry deprecation windows (Curtis): **Financial Times / Origami ≈ 3–6 months**; **Salesforce Lightning ≈ 18 months** (serving disconnected teams). Process: *announce → set timeline → mark deprecated in docs → provide codemod/alias → announce again → delete on schedule.* ([Curtis — Versioning](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d))

**For a single-file tool specifically:** stamp the emitted artifact with a token-set version (or content hash) in a comment, so a *regenerated* variant can be checked for token-vocabulary drift against the locked spec. Re-generation that silently changes a token value is the file-tool equivalent of an un-versioned breaking change.

### 4.11 Documentation that survives handoff

The failure mode is documentation that rots the moment code changes. Defences:

- **Make the token the source of truth, and generate the rest.** Names and values live in one place (DTCG JSON at build time → resolved CSS in the file). Docs that *quote* values by hand drift; docs that *reference tokens* don't.
- **A self-documenting name beats a comment.** `color-feedback-background-error-hover` needs no gloss. Invest naming effort so the vocabulary explains itself.
- **Ship the spec sheet with the component (§4.9a).** Property × state × token is the contract the next agent regenerates against, and the thing the audit checks. This is the machine-readable twin of a design-handoff doc.
- **Living component docs (build-time).** Storybook and equivalents render each component's states/variants from the *real* code, so the doc can't lie about what the component does — but these are **build-time artefacts, not shipped in the single file**. ([Storybook for design systems](https://www.uxpin.com/studio/blog/how-storybook-helps-developers-with-design-systems/))
- **Record *locked decisions* as references.** When the tool "locks" a choice, store `--color-action-primary → --blue-600`, not `#2563eb`. The mockup, the spec, and the next variant then share one vocabulary; a reviewer can diff decisions, not hex codes.

---

## 5. Options catalogue

Columns: **what · when to use · when NOT · licence · where to get · cost / single-file-CSP feasibility · pitfalls.** "Ships in file" = does the thing end up inside the strict-CSP single-file artifact (tokens do; build/audit tools don't).

### 5a. Token build & interchange tooling (build-time; does NOT ship in the file)

| Tool | What | When to use | When NOT | Licence | Where | Cost / CSP-offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **CSS custom properties** | Native `--token` on `:root` | **Always** — the delivery format | n/a | Web platform | Native | **Ships in file. Best.** Zero network, zero eval, fully inlinable | Global scope; no build-time type checking |
| **Style Dictionary** | Token source → multi-platform output (CSS/SCSS/iOS/Android) via transforms/formats | One source → many targets; DTCG pipeline | Tiny projects with one CSS target | **Apache-2.0** | [style-dictionary/style-dictionary](https://github.com/style-dictionary/style-dictionary) | Build-time only; emits plain CSS. Free, self-hostable | DTCG in v4; **full 2025.10 support WIP in v5** — verify |
| **DTCG format (2025.10)** | Vendor-neutral token JSON (`$value`/`$type`/`{alias}`) | Cross-tool source of truth | As a *runtime* format (it isn't) | Open, royalty-free (W3C Community Final Spec Agreement) | [designtokens.org/tr/2025.10](https://www.designtokens.org/tr/2025.10/) | Build-time; resolves to CSS | **Community Group Report, not a W3C Rec**; uneven tool support |
| **DTCG Resolver / modes** | Theming via token modes/sets → per-theme output | Multi-theme from one source | Single theme | Open (DTCG) | [Resolver draft](https://www.designtokens.org/tr/drafts/resolver/) | Build-time | Draft module; tool support nascent |
| **Tokens Studio (Figma)** | Design-side token authoring, modes, sync | Designers own tokens in Figma | Code-first teams | Freemium (paid tiers) | tokens.studio | Build-time; export to Style Dictionary | *Commercial alternative for authoring; not required.* Free tier limited |

### 5b. Naming schemes to adopt (patterns, not dependencies — you copy the convention)

| Scheme | What | When to use | When NOT | Licence (of the *system*) | Where | Notes |
|---|---|---|---|---|---|---|
| **Radix 12-step scale** | Fixed step→role mapping per hue | Colour coherence across components | Non-colour dimensions | **MIT** (Radix Colors) | [radix-ui/colors](https://www.radix-ui.com/colors) | Strongest single device for colour coherence |
| **shadcn/ui background/foreground** | Surface + paired on-colour naming | Guaranteeing legible pairings | Systems needing many surfaces per role | **MIT** | [ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming) | Bakes contrast into the naming |
| **Material `ref/sys/comp` tiers** | Explicit 3-tier prefixes | Large systems wanting visible layers | Small token sets (verbose) | **Apache-2.0** | [material-web](https://github.com/material-components/material-web) | Component tier is *not* prefixed `comp` |
| **Carbon layer/state sets** | `layer-01/02/03`, `-hover/-active/-selected` | Nesting surfaces + shared state deltas | Flat UIs | **Apache-2.0** | [carbondesignsystem.com](https://carbondesignsystem.com/elements/color/tokens/) | Best model for a tokenised state vocabulary |
| **Primer base→functional→component** | `base-… / fgColor-… / control-…` grammar | Property-first naming | — | **MIT** | [primer.style](https://primer.style/product/primitives/token-names/) | Clean `property-variant-scale` grammar |
| **Curtis taxonomy** | Segment order for any name | Designing your own scheme | — | Article (CC) | [EightShapes](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676) | The meta-framework behind all the above |

*(Licences shown are each project's repo licence; you are adopting the naming **pattern**, not necessarily vendoring their code. Verify at the repo before copying assets.)*

### 5c. Theming approaches

| Approach | What | When | When NOT | Licence | CSP/offline | Pitfalls |
|---|---|---|---|---|---|---|
| **`prefers-color-scheme`** | OS-driven light/dark | Follow OS | Manual override needed | Web platform | **Ships; zero JS; CSP-safe** | No user override without JS |
| **`[data-theme]` / `.dark` scope** | Attribute/class-scoped overrides | Manual theme/brand toggle | — | Web platform | **Ships; 1 flip, no eval; CSP-safe** | FOUC if class applied late |
| **Semantic re-point (Radix)** | Swap primitive an alias points to | Multi-brand from one component set | — | Web platform | **Ships; CSP-safe** | Requires disciplined semantic layer |
| **OKLCH ramps + fallback** | Perceptual colour, predictable deltas | Colour theming/math | Legacy-browser-only targets | Web platform (CSS Color 4) | **Ships; CSP-safe** | Needs sRGB fallback for old engines |

### 5d. Coherence-audit & visual-regression tooling (review-time; does NOT ship)

| Tool | What | When | When NOT | Licence | Where | Cost / CSP-offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **`getComputedStyle` audit** (bespoke) | Diff computed radii/spacing/colour/shadow/duration vs ramps + role consistency | **Every batch** — token drift & role drift | Catching *rendering* regressions | Web platform | Native DOM | **Runs in-file or headless; no eval; CSP-safe** | You build it; needs a resolved ramp list |
| **culori** | OKLCH conversion + `differenceCiede2000` (ΔE) | Colour tolerance in the audit | Non-colour checks | **MIT** | [Evercoder/culori](https://github.com/Evercoder/culori) | Audit-time (or in-file); dependency-light | Pin version; verify ΔE fn name |
| **@lapidist/design-lint** | Lints hardcoded values, deprecated tokens, component policy | CI gate on token usage | Runtime | **MIT** | [bylapidist/design-lint](https://github.com/bylapidist/design-lint) | CLI, local/offline | Config-heavy; daemon model |
| **Playwright `toHaveScreenshot`** | Built-in pixel diff (pixelmatch) | Component/page visual regression | Token drift (blind to it) | **Apache-2.0** | [playwright.dev](https://playwright.dev/docs/test-snapshots) | Node + headless browser | Needs stable render env; mask dynamics |
| **pixelmatch** | Minimal pixel diff, YIQ, anti-alias detect | Lightweight custom diff | — | **ISC** | [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch) | Node/browser; tiny | `threshold` 0.1 default — tune |
| **odiff** | SIMD pixel diff, ~6–7× faster | Large screenshot suites | — | **MIT** | [dmtrKovalenko/odiff](https://github.com/dmtrKovalenko/odiff) | Native binary/Node | Fewer JS hooks than pixelmatch |
| **BackstopJS** | Batteries-included VRT (scenarios, report) | Turnkey VRT harness | Minimal setups | **MIT** | [garris/BackstopJS](https://github.com/garris/BackstopJS) | Node + headless | Heavier; `misMatchThreshold` in % |
| **resemble.js** | Image analysis/compare, ignore AA/colour | Custom diff logic | — | **MIT** | [rsmbl/Resemble.js](https://github.com/rsmbl/Resemble.js) | Node/browser | Slower than pixelmatch/odiff |

*Commercial alternatives (not recommendations): Chromatic, Percy, Applitools — hosted VRT with review workflows; paid.*

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to DETECT | FIX |
|---|---|---|
| **Hardcoded value duplicating a token** | `#2563eb` in a component while `--blue-600` exists; audit finds ΔE≈0 to a token but value is a *literal* | Route through the token; lint for raw hex/px (design-lint); it will drift the day the token changes |
| **Off-ramp value** | `border-radius:7px` / `transition:200ms` not in the ramp; audit Check A flags it | Snap to nearest ramp token; forbid literals in component layer |
| **Role drift (pixel-identical, different source)** | Two components claim "primary action"; same pixels, different tokens/literals; audit Check B flags | Bind both to the one semantic token; pixel-diff will NOT catch this — token-diff must |
| **Deep/duplicated alias chains** | 5-hop `var()` chains; slow resolve, un-auditable | Cap at 3 hops; collapse redundant aliases |
| **Primitive named for a role** | `--blue-primary` at the primitive layer; un-themeable | Rename to `--blue-600`; move the role to a semantic alias |
| **Theming edits reach into components** | Brand B forks component CSS instead of re-pointing semantics | Move all overrides to the semantic layer; components stay identical |
| **State delta baked per-component** | Button hover ≠ list-row hover shift; inconsistent feel | Tokenise the delta (`--color-*-hover`); apply the one vocabulary (§4.6) |
| **OKLCH with no fallback** | Colour vanishes/black in old engines | Declare hex first, `oklch()` second on the same property |
| **Pixel diff at 0 tolerance** | VRT fails on every AA/font jitter | Set `threshold`≈0.1–0.2 + changed-pixel ratio ≤0.1–0.2 %; mask dynamic regions |
| **Diffing source CSS instead of computed** | `0` vs `0px`, `rgb()` vs `#hex` reported as diffs | Diff `getComputedStyle` output; normalise units/colour format first |
| **Token deleted, not deprecated** | Downstream breaks on upgrade | `$deprecated` + alias shim for 3–18 months; announce; codemod |
| **Un-versioned regeneration** | Regenerated variant silently changes a token value | Stamp artifact with token-set version/hash; audit regen against locked spec |
| **Docs quote values by hand** | Docs say `#2563eb`; token is now different | Reference tokens in docs; generate from source |
| **DTCG assumed loss-less across tools** | Round-trip mangles `$type`/dimension units | Verify each tool's DTCG support (2025.10 support uneven); test round-trip |

---

## 7. Pre-flight checklist (run before assembling or locking components)

- [ ] **Three layers present**, one direction; literals appear **only** in the primitive layer (§3.1, §4.1).
- [ ] Primitives named by **value**, semantics by **role**, components by **part** (§3.2, §4.2).
- [ ] Alias chains ≤ **3 hops**; no cycles, no sideways refs (§3.3, §4.3).
- [ ] Every dimension (radii/spacing/type/elevation/motion/colour) drawn from **one shared ramp**; audit finds **no off-ramp values** (§3.4, §4.6–4.7).
- [ ] The **single state vocabulary** is applied identically; state deltas are **tokens**, not per-component decisions (§3.5, §4.6).
- [ ] Tokens ship as **`:root` custom properties**; no build tool/JSON/webfont fetch in the file (§3.6).
- [ ] Theming is a **semantic re-point** scoped by `prefers-color-scheme`/`[data-theme]`/`.dark`; components untouched (§3.7, §4.5).
- [ ] Colour ramps in **OKLCH with sRGB fallback** (§3.8, §4.5).
- [ ] **Computed-style audit passes**: Check A (ramp membership) and Check B (role consistency), within tolerances — geometry ±0.5–1 px, colour ΔE ≤ 1/≤ 2/> 2 (§3.10, §4.7–4.8).
- [ ] Each component has a **spec sheet** (property × state × token); fidelity check runs against it (§4.9a).
- [ ] Visual-regression budget set (per-pixel `threshold` ≈ 0.1–0.2; changed-pixel ratio ≤ 0.1–0.2 %); dynamic regions masked (§4.9b).
- [ ] Tokens **SemVer-versioned**; deprecations use `$deprecated` + alias shim, never hard delete (§3.12, §4.10).
- [ ] Decisions **locked as references**, not raw values; artifact stamped with token-set version (§3.13, §4.10–4.11).
- [ ] Every recommended tool is **free + self-hostable**; licences noted; audit/VRT tools understood to be **build/review-time, not shipped** (§5).

---

## 8. Open questions / unverified

- **DTCG 2025.10 tool support is a moving target.** The format is stable, but *implementation* lags — Style Dictionary's full 2025.10 support is WIP in v5 ([SD DTCG](https://styledictionary.com/info/dtcg/)). Re-verify round-trip fidelity per tool at build time. *(Verified: spec is a Community Group Final Report, not a W3C Rec.)*
- **ΔE tolerance bands** (< 1 imperceptible, 1–2 close inspection, 2–10 at a glance) are established colorimetry heuristics, not per-observer guarantees; the exact CIEDE2000 implementation (and whether to weight for large vs small colour areas) affects borderline calls. Treat ≤ 1 / ≤ 2 / > 2 as pragmatic thresholds.
- **`pixelmatch` licence is ISC** (not MIT, as often assumed) — ISC is OSI-approved and functionally equivalent to MIT, but state it correctly if a policy enumerates licences. *(Verified at repo.)*
- **SLDS component styling hooks** are documented as SLDS-1-only as of Summer '25, not yet in SLDS 2 (Cosmos). Use SLDS as a naming reference, not a drop-in. *(Verified in SLDS docs.)*
- **Spectrum token file structure** — the repo redirected to `adobe/spectrum-design-data` (Apache-2.0 verified); exact JSON file names for global/alias/component tiers were not fetched this pass. Verify at the new repo before vendoring.
- **The "375 sites, 7.5 % got token drift right" figure** circulating in 2026 is from a secondary Medium piece, not a primary study — cite only as illustrative of how common drift is, not as a measured benchmark.
- **Reference-system licences for Material/Carbon/Primer/Radix** are stated from common knowledge (Apache-2.0 / Apache-2.0 / MIT / MIT) but were not each fetched from their LICENSE files this pass; confirm before shipping any of their *assets* (you're mainly copying naming *patterns*, which carries no licence obligation).
- **In-file runtime colour math** (e.g. computing hover deltas from OKLCH at run time with culori) is CSP-safe (no eval) but adds bytes; prefer *pre-resolved* tokens in the shipped file and keep culori at build/audit time.

---

## 9. Sources

**Primary / authoritative:**
- [Design Tokens Format Module 2025.10 (Final Community Group Report)](https://www.designtokens.org/tr/2025.10/) — `$value`/`$type`/`$description`/`$deprecated`, `{group.token}` aliases, token & composite types.
- [Design Tokens spec reaches first stable version (2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/) — status, standing, theming/colour scope.
- [DTCG Resolver Module (draft)](https://www.designtokens.org/tr/drafts/resolver/) — modes/sets theming.
- [Material Web — Theming (token tiers)](https://github.com/material-components/material-web/blob/main/docs/theming/README.md) — `md-ref`/`md-sys`/component tokens, aliasing flow.
- [IBM Carbon — Color tokens](https://carbondesignsystem.com/elements/color/tokens/) — background/layer/field/border/text/support tokens, layering & state variants.
- [GitHub Primer — Token names](https://primer.style/product/primitives/token-names/) — base → functional → component grammar.
- [Adobe Spectrum design data](https://github.com/adobe/spectrum-design-data) — global/alias/component tiers; **Apache-2.0**.
- [Salesforce SLDS — Styling hooks](https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html) — `--slds-c-*` / `--slds-g-*` grammar and SLDS-1/2 caveat.
- [Radix Colors — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) & [Aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing) — 12-step step→role mapping; semantic aliasing.
- [shadcn/ui — Theming](https://ui.shadcn.com/docs/theming) — background/foreground pairing, OKLCH, `:root`/`.dark` split.
- [Playwright — Snapshot assertions](https://playwright.dev/docs/api/class-snapshotassertions) & [Visual comparisons](https://playwright.dev/docs/test-snapshots) — `threshold` 0.2, `maxDiffPixels`, `maxDiffPixelRatio`.

**Reference / secondary:**
- [Nathan Curtis (EightShapes) — Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676) — segment taxonomy & ordering.
- [Nathan Curtis (EightShapes) — Versioning Design Systems](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d) — SemVer, breaking changes, deprecation windows (FT 3–6 mo, Salesforce 18 mo).
- [Style Dictionary — DTCG support](https://styledictionary.com/info/dtcg/) — v4 DTCG, 2025.10 WIP in v5.
- [Storybook for design systems (UXPin)](https://www.uxpin.com/studio/blog/how-storybook-helps-developers-with-design-systems/) — living docs (build-time).

**Licences (verified from source this pass):**
- [Style Dictionary — Apache-2.0](https://github.com/amzn/style-dictionary/blob/main/README.md).
- [pixelmatch — **ISC**](https://github.com/mapbox/pixelmatch) (threshold 0.1 default, YIQ).
- [BackstopJS — MIT](https://github.com/garris/BackstopJS) (uses resemble.js; `misMatchThreshold` %).
- [resemble.js — MIT](https://github.com/rsmbl/Resemble.js).
- [odiff — MIT](https://github.com/dmtrKovalenko/odiff) (SIMD; threshold 0–1).
- [@lapidist/design-lint — MIT](https://github.com/bylapidist/design-lint) (hardcoded-value & deprecated-token linting; CLI/offline).
- [culori — MIT](https://github.com/Evercoder/culori) (`differenceCiede2000`, OKLCH; audit-time).
- [Adobe spectrum-design-data — Apache-2.0](https://github.com/adobe/spectrum-design-data).

*Reference-system licences stated from common knowledge but not each fetched this pass: Material Web (Apache-2.0), IBM Carbon (Apache-2.0), GitHub Primer (MIT), Radix (MIT). Verify before vendoring assets.*
