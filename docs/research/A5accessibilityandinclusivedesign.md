# A5 — Accessibility & inclusive design

*Design-intelligence reference. Track A5 of the registry research map. This track is the **accessibility-conformance authority** for the whole registry: it owns the numeric thresholds, the success-criteria (SC) mapping, and how to TEST. Written to be read by the design agent before it ships any variant, and by a human owner auditing that work. Every variant the tool emits is a single self-contained HTML file, light **and** dark, under a **strict CSP** (no external requests, no `eval`). Conformance verdicts below assume that sandbox.*

**Standards-status honesty flag (read first):** **WCAG 2.2 is the current W3C Recommendation** (published **2023-10-05**) and is the version you conform to for legal/contractual purposes. **WCAG 3.0 is an early-stage W3C Working Draft** and **APCA is a draft candidate contrast method inside that work — neither is normative.** Use WCAG 2.2's numeric ratios (§4.2) for *compliance*; use APCA (§4.3) as a *design aid*, especially for dark mode. This distinction is load-bearing and is flagged at every relevant point below. ([WCAG 2.2 What's New](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/))

---

## 1. Scope line

This track owns **conformance to accessibility standards as numbers and contracts**: the exact WCAG 2.2 success criteria and their thresholds (contrast, target size, focus, reflow, spacing, flashes), the APCA perceptual-contrast model and why/when to use it, focus-visibility recipes, keyboard operability and focus order, the screen-reader semantic contract for each common composite widget (ARIA roles + keyboard), the user-preference media queries (`prefers-reduced-motion`, `prefers-contrast`, `forced-colors`), vestibular-safe motion *conformance*, cognitive-load reduction, and internationalisation (RTL mirroring, text expansion, locale formats). It states the CSP/offline verdict wherever a technique's feasibility depends on it.

## 2. Boundary (what this track does **not** own)

MECE split against its siblings — name the neighbour, hand off cleanly:

- **Generating accessible palettes** — ramp math, colour-blind-safe *categorical* sets, tint/shade scales → **A1 Colour & palette systems**. A5 owns the *conformance thresholds those palettes must hit* (4.5:1, 3:1, APCA Lc) and *how to test them*; A1 owns producing the colours.
- **Motion vocabulary** — durations, easing curves, spring constants, choreography → **B1 Motion & animation systems**. A5 owns the *reduced-motion conformance model, the vestibular trigger list as a safety constraint, the flash threshold, and pause/stop/hide*; B1 owns how motion is authored.
- **State DESIGN** — the hover/press/loading/disabled state matrix and what visually changes → **B2 Interaction states & affordance**. A5 owns the *accessibility hooks and contracts* for those states (focus indicator, `aria-*` state, non-colour redundancy).
- **Layout, reflow mechanics, and target *spacing*** — grid, breakpoints, the physical arrangement that makes 24 px targets fit → **A3 Layout & responsive**. A5 owns the *SC thresholds* (1.4.10 reflow 320 px, 2.5.8 target size 24 px) and *how to verify* them; A3 owns building the layout that satisfies them.
- **Shape / depth / material** (shadow, glass, border construction) → **A4**. A5 says a focus ring must be ≥3:1 and survive forced-colors; A4 builds the material.
- **The consolidated single-file / no-network feasibility matrix** across all rendering techniques → **H2 Feasibility**. A5 gives the a11y-specific CSP verdicts inline (e.g. ARIA needs no network; `outline` survives forced-colors where `box-shadow` does not).

---

## 3. Executive rules (apply before reading the body)

1. **Conform to WCAG 2.2 AA; treat WCAG 3 / APCA as advisory.** Ship against the 2.2 numeric SCs. APCA and WCAG 3 are **drafts** (§4.3) — never cite them as the compliance bar. When a stakeholder says "we're APCA-compliant," correct it: there is no such conformance today.
2. **Text contrast is 4.5:1, large text 3:1 (1.4.3 AA).** "Large" = **≥ 24 px** (18 pt) regular **or ≥ 18.66 px** (14 pt) **bold** (1 pt = 1.333 px). Below those sizes you need 4.5:1. AAA (1.4.6) raises these to **7:1 / 4.5:1**. ([1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))
3. **Non-text contrast is 3:1 (1.4.11 AA).** Every UI component state needed to identify/operate it (borders of inputs, the focus ring, toggle tracks, icon-only buttons) and every meaningful part of an informative graphic must hit **3:1 against adjacent colour(s)**. Disabled components are exempt. ([1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html))
4. **Never encode meaning in colour alone (1.4.1 A).** Links get an underline or ≥3:1 vs body text *plus* a non-colour cue on interaction; errors get an icon + text, not just a red border; chart series get shape/label, not only hue. ([1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html))
5. **A visible focus indicator is mandatory (2.4.7 AA) and must be ≥3:1 and, ideally, meet 2.4.13.** Recipe: **≥2 px thick**, **≥3:1** against *both* the component and the surface behind it, use **`outline` + `outline-offset`** (not only `box-shadow`, which forced-colors deletes), and use **`:focus-visible`** so mouse users don't see it. On dark surfaces add an **offset gap** so the ring separates. §4.4 has a copy-paste recipe meeting 2.4.11 + 2.4.13. ([2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html))
6. **Keyboard-focused elements must not be fully hidden (2.4.11 AA).** Sticky headers, footers, cookie bars and toolbars must not entirely cover the focused control. Scroll it into view or offset the scroll container. ([2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html))
7. **Interactive targets are ≥ 24×24 CSS px (2.5.8 AA)**, or spaced so a 24 px circle centred on each doesn't overlap a neighbour's. AAA (2.5.5) wants **44×44**. Inline links in prose are exempt. ([2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html))
8. **Everything operable by keyboard, in a logical order, with no traps (2.1.1 / 2.1.2 / 2.4.3, all Level A).** Every drag interaction needs a single-pointer (click/tap) alternative (**2.5.7 AA**). Provide a **skip link** (2.4.1 A). Modal dialogs **trap focus while open and return it on close** (APG contract, §4.7). ([2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html))
9. **Every composite widget follows its APG role + keyboard contract exactly (§4.7).** A "tab" that isn't arrow-key navigable, or a "dialog" without `role="dialog"`/`aria-modal`/focus trap, is broken for screen-reader and keyboard users regardless of how it looks. ARIA is inline HTML attributes — **fully CSP-safe, zero network.**
10. **Respect the three user-preference media queries.** `prefers-reduced-motion: reduce` → substitute movement with fades/instant, don't `animation:none` everything (§4.8). `prefers-contrast: more` → thicken borders/rings, raise contrast. `forced-colors: active` (Windows High Contrast) → keep `outline`s, map to **system colours** (`Canvas`, `CanvasText`, `Highlight`, `ButtonText`, `LinkText`), and know `box-shadow`/`background-image`/`text-shadow` are forced to `none` (§4.9).
11. **Reflow at 320 CSS px with no 2-D scrolling (1.4.10 AA); survive the text-spacing overrides (1.4.12 AA).** Content must work at a 320 px-wide viewport (≡ 1280 px @ 400 % zoom) and not break when a user forces line-height **1.5**, paragraph-spacing **2×**, letter-spacing **0.12em**, word-spacing **0.16em**. Use logical, flexible layout; never fixed heights on text containers. ([1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html))
12. **Nothing flashes more than 3×/second (2.3.1 A).** Hard seizure-safety ceiling over any area larger than ~**341×256 px** (the 10° visual-field proxy). Auto-moving content lasting >5 s that sits alongside other content needs a pause/stop/hide control (**2.2.2 A**). ([2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))
13. **Be consistent (3.2.3 / 3.2.4 AA, 3.2.6 A).** Navigation appears in the same relative order across views; the same function is labelled/iconed the same way; help sits in a consistent location. Consistency is a cognitive-load SC, not a nicety. ([WCAG 2.2 new SCs](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/))
14. **Internationalise structurally.** Use **CSS logical properties** (`margin-inline-start`, `inset-inline`, `text-align: start`) so RTL mirrors by flipping `dir="rtl"`; budget **+30–40 %** text expansion (German/Finnish/Russian) and far more for short strings; format numbers/dates/currency with `Intl.*`, never hard-code. Mirror *directional* icons (back/next, breadcrumbs, undo); do **not** mirror content tied to a constant (clocks, the media timeline) (§4.10).
15. **Reduce cognitive load by default.** Plain language, short chunks, one primary action per view, forgiving errors with recovery (3.3.1/3.3.3 A), don't force users to re-enter known data (3.3.7 A), don't gate auth on a memory/puzzle test without an alternative (3.3.8 AA). Accessibility for cognition is mostly restraint (§4.11).

---

## 4. Body

### 4.1 Which standard governs, and the SC master table

**Version reality (July 2026):** **WCAG 2.2** is the current Recommendation (2023-10-05). It adds **9 new SCs** over 2.1 and **removes 4.1.1 Parsing** (declared obsolete — browsers repair markup, so it no longer maps to a user problem). **WCAG 3.0** remains a **Working Draft** with a different structure (outcomes, a bronze/silver/gold scoring model, no fixed publication date); do not design *to* it yet. ([What's New in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/))

**New in WCAG 2.2 (verified numbers + levels):**

| SC | Name | Level | One-line |
|---|---|---|---|
| **2.4.11** | Focus Not Obscured (Minimum) | **AA** | Focused component not *entirely* hidden by author content |
| **2.4.12** | Focus Not Obscured (Enhanced) | **AAA** | Focused component not *even partially* hidden |
| **2.4.13** | Focus Appearance | **AAA** | Focus indicator ≥ 2 px-perimeter area **and** ≥3:1 focused-vs-unfocused |
| **2.5.7** | Dragging Movements | **AA** | Any drag has a single-pointer alternative |
| **2.5.8** | Target Size (Minimum) | **AA** | Targets ≥ 24×24 CSS px (or spaced) |
| **3.2.6** | Consistent Help | **A** | Help in a consistent location across pages |
| **3.3.7** | Redundant Entry | **A** | Don't make users re-enter known info |
| **3.3.8** | Accessible Authentication (Minimum) | **AA** | No cognitive-function test without an alternative |
| **3.3.9** | Accessible Authentication (Enhanced) | **AAA** | Stricter — no object-recognition/PII test |

Source (all rows): [W3C — What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/). Note the **numbering gotcha the task flags**: **2.4.11 became AA "Focus Not Obscured (Minimum)"**, and the old draft "Focus Appearance (Minimum/Enhanced)" collapsed into a **single AAA "Focus Appearance" at 2.4.13** — verified above.

**The SCs this track polices most (master reference):**

| SC | Name | Level | Threshold / rule (exact) |
|---|---|---|---|
| 1.4.1 | Use of Color | A | Colour never the *only* visual means of conveying info/action/state |
| 1.4.3 | Contrast (Minimum) | AA | Text **4.5:1**; large text **3:1** (large = ≥24 px, or ≥18.66 px bold) |
| 1.4.6 | Contrast (Enhanced) | AAA | Text **7:1**; large text **4.5:1** |
| 1.4.11 | Non-text Contrast | AA | UI components & meaningful graphics **3:1** vs adjacent |
| 1.4.10 | Reflow | AA | No 2-D scroll at **320** CSS px wide (≡ 1280 px @ 400 %) / 256 px tall |
| 1.4.12 | Text Spacing | AA | Survive line **1.5**, ¶ **2×**, letter **0.12em**, word **0.16em** |
| 2.1.1 | Keyboard | A | All functionality operable by keyboard |
| 2.1.2 | No Keyboard Trap | A | Focus can always leave via keyboard |
| 2.1.4 | Character Key Shortcuts | A | Single-key shortcuts must be remappable/off/focus-scoped |
| 2.2.2 | Pause, Stop, Hide | A | Auto-moving/blinking >5 s alongside content → pause control |
| 2.3.1 | Three Flashes or Below Threshold | A | ≤ **3** general **and** ≤ 3 red flashes per second |
| 2.4.1 | Bypass Blocks | A | Skip link / landmark to bypass repeated blocks |
| 2.4.3 | Focus Order | A | Focus order preserves meaning & operability |
| 2.4.7 | Focus Visible | AA | A visible keyboard-focus indicator exists |
| 2.4.11 | Focus Not Obscured (Min) | AA | Focused component not entirely hidden |
| 2.4.13 | Focus Appearance | AAA | ≥2 px-perimeter area **and** ≥3:1 focused/unfocused |
| 2.5.5 | Target Size (Enhanced) | AAA | Targets **44×44** CSS px |
| 2.5.7 | Dragging Movements | AA | Single-pointer alternative to any drag |
| 2.5.8 | Target Size (Minimum) | AA | Targets **24×24** CSS px (or spaced) |
| 3.2.3 | Consistent Navigation | AA | Repeated nav in same relative order |
| 3.2.4 | Consistent Identification | AA | Same function → same label/icon |
| 3.2.6 | Consistent Help | A | Help in consistent location |
| 3.3.1 | Error Identification | A | Errors identified in text, in context |
| 3.3.3 | Error Suggestion | AA | Suggest a fix when known |

All levels/numbers verified against the linked W3C Understanding pages (see §9).

### 4.2 Contrast — text, UI, graphics (the compliance math)

**The WCAG 2.x contrast ratio** is computed from *relative luminance* L (0 = black, 1 = white):

```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)        →  range 1:1 … 21:1
L = 0.2126·R + 0.7152·G + 0.0722·B    (each channel linearised from sRGB)
```

This is a **fixed ratio, polarity-blind** — it gives the same number for dark-on-light and light-on-dark of the same two colours. That property is exactly what APCA fixes (§4.3), but for *compliance* this is the law.

| What | SC | Level | Threshold |
|---|---|---|---|
| Body text (< 24 px, or < 18.66 px bold) | 1.4.3 | AA | **4.5:1** |
| Large text (≥ 24 px, or ≥ 18.66 px bold) | 1.4.3 | AA | **3:1** |
| Body text (AAA) | 1.4.6 | AAA | **7:1** |
| Large text (AAA) | 1.4.6 | AAA | **4.5:1** |
| UI component state / boundary (input border, toggle track, focus ring, icon button) | 1.4.11 | AA | **3:1** vs adjacent |
| Meaningful part of an informative graphic (chart line, icon glyph) | 1.4.11 | AA | **3:1** vs adjacent |
| Disabled/inactive component | 1.4.11 | — | **Exempt** |
| Text over an image/gradient | 1.4.3 | AA | 4.5:1 vs the *worst-case* pixels behind it |

**The "large text" boundary, exactly:** 1 pt = 1.333 px, so **18 pt = 24 px** (regular) and **14 pt bold = 18.66 px** (bold). Anything at or above those is "large" and drops to 3:1; anything below needs 4.5:1. ([1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html))

**Decision rules that trip teams up:**
- **Placeholder text is text.** If it conveys anything, it needs 4.5:1. Grey placeholders routinely fail — don't use placeholder as a label.
- **The focus ring is a UI component** → its own contrast is governed by **1.4.11 (3:1)**, and its *change* on focus by **2.4.13** (AAA). Both, not either.
- **Icon-only controls:** the glyph needs 3:1 (1.4.11) *and* the hit area still needs 24×24 (2.5.8).
- **Disabled controls are exempt from contrast** — but if users can't tell disabled from enabled, that's a 1.4.1/usability problem; keep a non-contrast cue.
- **Adjacent colour** for 1.4.11 means whatever the component sits against — a 3:1 border can fail on one side (the page) and pass on the other (a card). Check the worst side.

**1.4.1 Use of Color — the non-colour-redundancy rule (Level A, often missed):** "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element." ([1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)) Concretely: inline links inside body text need a **non-colour indicator** (underline, or an icon/weight change) *unless* they hit 3:1 vs surrounding text **and** show a non-colour cue on hover/focus; form validation needs **icon + message**, not a red border alone; required fields need `*` or "(required)", not only colour; categorical charts need pattern/label/shape, not only hue (that lives in A1, but the *rule* is here).

### 4.3 APCA — perceptual contrast (design aid, **not** compliance) — DRAFT

**Status flag (repeat):** APCA (Advanced Perceptual Contrast Algorithm) is the **candidate** contrast method for **WCAG 3**, which is an early **Working Draft**. It is **not normative** and **cannot be used for WCAG conformance today.** It also ships as an independent "APCA Readability Criterion." Use it to *design* (especially dark mode), then *verify* compliance with 2.2's ratios. ([APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html))

**Why it differs from 4.5:1 — four reasons the static ratio is wrong:**
1. **Polarity.** Human contrast perception is *not* symmetric: light text on a dark field and dark text on a light field of the same luminance pair look *differently* legible. WCAG 2.x returns one number for both; APCA returns a **signed Lc** — positive for dark-on-light, negative for light-on-dark — and weights them differently. This is *the* dark-mode fix.
2. **Spatial frequency (font weight & size).** Thin, small text has higher spatial frequency and needs more contrast; large/bold text needs less. WCAG 2.x captures this crudely with one "large text" step; APCA folds size **and weight** into the required Lc via a lookup table.
3. **Perceptual, not ratio-based.** APCA models perceived lightness (roughly, "halving the Lc halves perceived contrast"), so its scale is more uniform across the colour space. WCAG 2.x's ratio **overstates** contrast among dark colours — two near-blacks can report a "passing" ratio yet be indistinguishable on a screen.
4. **Dark-mode failure of 2.x.** Because of (1) and (3), the 4.5:1 ratio "cannot provide useful guidance when designing dark mode" — it passes low-contrast dark pairs and can reject legible ones. ([APCA easy intro](https://git.apcacontrast.com/documentation/APCAeasyIntro.html))

**APCA Lc thresholds (the commonly-cited "Bronze" ladder — treat as approximate, use the official lookup for production):**

| Lc (abs.) | Intended use |
|---|---|
| **Lc 90** | Preferred for fluent **body text** (e.g. ~14–18 px, weight 400); *suggested max* for very large/bold |
| **Lc 75** | Minimum for **body/column text** (≈ 18 px/400, 16 px/500, 14 px/700) |
| **Lc 60** | Minimum for **larger content text** not in body columns (e.g. 24 px normal, 16 px bold) |
| **Lc 45** | Minimum for **large text / headlines** (≈ 36 px normal or 24 px bold) and detailed pictograms |
| **Lc 30** | Absolute floor for **spot/placeholder/disabled** text and solid icons |
| **Lc 15** | Floor for **non-semantic non-text** (dividers, decorative separators); **below 15 ≈ invisible** |

Sources: [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html), [APCA easy intro](https://git.apcacontrast.com/documentation/APCAeasyIntro.html). **Honesty flag:** the exact size×weight×Lc cells vary slightly between APCA documents and versions; the two primary pages above differ in their example mappings. Use the interactive calculator's lookup, and **do not** present any Lc pass as "WCAG compliant."

**How to use it in this tool's two-theme mandate:** design the **dark** theme with APCA (it's where 2.x misleads), then **gate the ship on 2.2 ratios**. If a dark-mode pair passes APCA Lc 75 for body but only reaches WCAG 4.2:1, you must either lift it to 4.5:1 (to conform) or document the deviation — APCA passing does **not** discharge the legal requirement.

### 4.4 Focus visibility — the recipe (2.4.7 / 2.4.11 / 2.4.13 + 1.4.11)

Four SCs stack on the focus indicator:

| SC | Level | What it demands of the focus indicator |
|---|---|---|
| 2.4.7 Focus Visible | AA | It **exists** and is visible in a keyboard mode |
| 1.4.11 Non-text Contrast | AA | The indicator is **≥3:1** vs adjacent colours |
| 2.4.11 Focus Not Obscured (Min) | AA | The focused element isn't **entirely** covered by author content |
| 2.4.13 Focus Appearance | AAA | Indicator area ≥ **2 px-thick perimeter** of the component **and** **≥3:1** between the focused and unfocused states of those pixels |

([2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html))

**Design rules derived from the SCs:**
- **Use `:focus-visible`, not `:focus`.** It shows the ring for keyboard/AT users and suppresses it for mouse clicks — you no longer have to choose between "ugly for everyone" and "invisible for keyboard users."
- **Never `outline: none` without a replacement.** Removing the UA outline with nothing else is the single most common keyboard-a11y failure (fails 2.4.7).
- **Thickness ≥ 2 px** (2.4.13 wants an area equal to a 2 px perimeter; 2–3 px solid is the simplest way to satisfy it).
- **Contrast ≥ 3:1 against *both* the component and the surface.** A ring that contrasts with the button but not the page (or vice-versa) fails on one side. The robust fix is a **two-colour ring** (a light band + a dark band) so one band always contrasts.
- **On dark surfaces, add `outline-offset`** (a 2 px gap): the gap shows the surface between element and ring, which separates them and prevents a dark ring from vanishing into a dark element edge.
- **Prefer `outline` over `box-shadow`** for the ring itself: `outline` is retained in forced-colors mode; **`box-shadow` is forced to `none`** (§4.9), so a shadow-only ring disappears in Windows High Contrast.
- **`outline` follows `border-radius`** in modern engines, so rounded controls get a rounded ring for free.

**Worked example #1 — a focus ring that meets 2.4.7 + 1.4.11 + 2.4.13 on any background, light or dark, and survives forced-colors.** CSP-safe (pure CSS, no network).

```css
/* Base: no ring for mouse users, reset the UA default cleanly */
:where(a, button, input, select, textarea, [tabindex]) {
  outline: none;
}

/* Keyboard focus: 3px ring + 2px offset gap, meets 2.4.13 area + contrast */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--focus-ring, #1a73e8); /* ≥3:1 vs component AND surface */
  outline-offset: 2px;                            /* gap: separates ring on dark UI */
  border-radius: inherit;
}

/* Two-colour "bulletproof" ring for surfaces where one colour can't clear 3:1 both sides.
   The outline is the outer band; box-shadow paints an inner contrasting band.
   (box-shadow is decorative-only here; the outline alone still satisfies WHCM.) */
.btn:focus-visible {
  outline: 2px solid #ffffff;                 /* light band */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px #0b0b0b;              /* dark band — enhancement, not the guarantee */
}

/* Dark theme: swap the ring colour so it clears 3:1 on a dark surface */
@media (prefers-color-scheme: dark) {
  :root { --focus-ring: #8ab4f8; }            /* verify ≥3:1 vs your dark bg */
}

/* Higher contrast requested: thicken and use a starker colour */
@media (prefers-contrast: more) {
  :where(a,button,input,select,textarea,[tabindex]):focus-visible {
    outline-width: 3px; outline-color: CanvasText;
  }
}

/* Forced colors / Windows High Contrast: a *transparent* outline becomes a
   visible SYSTEM colour here, so the ring is guaranteed even though box-shadow
   is stripped. Highlight is the OS focus/selection colour. */
@media (forced-colors: active) {
  :where(a,button,input,select,textarea,[tabindex]):focus-visible {
    outline: 3px solid Highlight;   /* or `2px solid transparent` to inherit the forced colour */
    outline-offset: 2px;
    box-shadow: none;               /* it's already stripped; be explicit */
  }
}

/* Reduced motion: never animate the ring in/out — instant is fine */
@media (prefers-reduced-motion: reduce) {
  :where(a,button,input,select,textarea,[tabindex]):focus-visible { transition: none; }
}
```

Why this passes: the visible ring exists (2.4.7); it is ≥3:1 vs adjacent because you pick `--focus-ring` per theme against *both* neighbours, and the two-band variant guarantees one band clears 3:1 on any surface (1.4.11); it is ≥2 px thick and its pixels change from unfocused→focused by well over 3:1 (2.4.13); it is retained and system-coloured in forced-colors (§4.9). **You still owe 2.4.11**: ensure sticky headers/footers don't cover the focused control — set `scroll-padding-block: <sticky-height>` on the scroll container so scrolled-into-view focus lands below the sticky bar.

### 4.5 Target size & pointer input (2.5.8 / 2.5.5 / 2.5.7)

| SC | Level | Rule | Exceptions |
|---|---|---|---|
| 2.5.8 Target Size (Minimum) | **AA** | Pointer target **≥ 24×24 CSS px** | **Spacing** (a 24 px circle centred on each undersized target doesn't intersect another target's circle), **Equivalent** (same function reachable via a compliant control), **Inline** (target within a sentence / constrained by line-height), **User-agent** (UA-determined size), **Essential** (presentation legally required/essential) |
| 2.5.5 Target Size (Enhanced) | **AAA** | Pointer target **≥ 44×44 CSS px** | Equivalent, Inline, User-agent, Essential |
| 2.5.7 Dragging Movements | **AA** | Any drag operation has a **single-pointer** (tap/click) alternative | Essential drag; UA-provided gesture |

Sources: [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html), [2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).

**Design rules:**
- **24×24 is the AA floor; 44×44 is the comfortable/AAA and the mobile-ergonomic target** (matches Apple HIG 44 pt and is close to Material's 48 dp). Prefer 44 where space allows; never go under 24.
- **The hit area, not the ink, is what's measured.** A 16 px icon in a control with padding to 24×24 passes. Grow the *target* with padding or a pseudo-element, keep the glyph small.
- **The Spacing exception is your escape hatch for dense toolbars/tables**: if visual design forces 20 px icons, ensure ≥24 px centre-to-centre spacing so the circles don't intersect.
- **2.5.7 kills "drag-only" UIs.** Sliders need arrow-key/step alternatives; drag-to-reorder needs move-up/down buttons or a menu; drag-to-dismiss needs a close button; map pan needs zoom buttons. Provide the alternative *and* keep the drag.
- **`touch-action`/pointer events:** don't hijack native scrolling; ensure `pointer:coarse` users get the larger targets (`@media (pointer: coarse)`).

### 4.6 Keyboard operability & focus order

The Level-A keyboard baseline (non-negotiable):

- **2.1.1 Keyboard (A):** every function works from the keyboard. Custom controls need `tabindex="0"` (focusable) and key handlers matching their role's APG contract (§4.7).
- **2.1.2 No Keyboard Trap (A):** focus can always move *out* by standard keys. The *only* legitimate trap is a **modal dialog**, and it must be escapable (Esc / a close control) — that's a managed trap with a return, not a violation.
- **2.1.4 Character Key Shortcuts (A):** single-character shortcuts (e.g. "j/k") must be turn-off-able, remappable, or active only on focus — otherwise speech-input users trigger them accidentally.
- **2.4.3 Focus Order (A):** the tab order matches the visual/reading order and preserves meaning. **Never** use positive `tabindex` values (e.g. `tabindex="3"`) — they create brittle, illogical orders. Order the **DOM** correctly instead; use `tabindex="0"` (in natural order) and `tabindex="-1"` (focusable only programmatically).
- **2.4.1 Bypass Blocks (A):** a **skip link** (`<a href="#main" class="skip-link">Skip to content</a>`) that is visually hidden until focused, plus landmark regions (`<header><nav><main><footer>` or `role=` equivalents).
- **Focus management on route/panel change (SPA):** when content swaps without a page load, move focus to the new region's heading (`tabindex="-1"` + `.focus()`), or a screen reader announces nothing.

**Modal focus contract (the pattern most often wrong):** on open → move focus **into** the dialog; **trap** Tab/Shift+Tab inside; **Esc** closes; on close → **return focus to the invoking element**. Full contract + code in §4.7.

**Skip link recipe (CSP-safe):**

```css
.skip-link { position: absolute; left: -9999px; top: 0; }
.skip-link:focus { left: 8px; top: 8px; z-index: 1000;
  background: Canvas; color: CanvasText; padding: 8px 12px;
  outline: 3px solid Highlight; }  /* system colours → survives forced-colors */
```

### 4.7 Screen-reader semantics — the composite-widget contracts (WAI-ARIA APG)

ARIA is **inline HTML attributes**: **zero network, CSP-safe, works offline** in the single-file sandbox. The rule of ARIA still applies: **prefer native elements** (`<button>`, `<a href>`, `<input type=checkbox>`, `<dialog>`, `<details>/<summary>`) — they bring role, focus, and keyboard for free. Reach for ARIA only when no native element fits (tabs, combobox, menu, custom switch). "**No ARIA is better than bad ARIA.**"

**The contract table** (role + required states + keyboard), each row sourced to its APG pattern:

| Widget | Container role | Item role | Key states/props | Keyboard contract |
|---|---|---|---|---|
| **Modal dialog** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)) | `dialog` + `aria-modal="true"` | — | `aria-labelledby` (title) **or** `aria-label`; opt. `aria-describedby` | Open→focus moves inside; **Tab/Shift+Tab wrap inside** (trap); **Esc** closes; close→focus returns to trigger |
| **Tabs** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)) | `tablist` (`aria-orientation`) | `tab` → panel `tabpanel` | `aria-selected` (true on 1), `aria-controls`→panel, panel `aria-labelledby`→tab; **roving `tabindex`** (0 on active, −1 others) | Tab enters at active tab, then leaves the widget; **←/→** (horizontal) or **↑/↓** (vertical) move between tabs & wrap; **Home/End** first/last (opt.); **automatic** activation on focus (default, if panels are cheap) **or** manual via **Space/Enter** |
| **Combobox (editable + listbox)** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)) | input `combobox`; popup `listbox` | `option` (+ `aria-selected`) | `aria-expanded`, `aria-controls`→listbox, `aria-autocomplete` (`none`/`list`/`both`); **DOM focus stays on input**, AT focus via **`aria-activedescendant`** | **↓** opens/moves to first option; **↑** to last; **Enter** accepts & closes; **Esc** closes (keeps value) / clears; **Home/End** (opt.); typing filters |
| **Menu button → menu** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)) | button `aria-haspopup="menu"`; `menu` | `menuitem` / `menuitemradio` / `menuitemcheckbox` | button `aria-expanded`, opt. `aria-controls` | **Enter/Space/↓** open→focus first item (**↑** opens→last); within menu **↑/↓** move & wrap, **Home/End**, **type-ahead**; **Esc** closes & **returns focus to button**; **Tab** closes |
| **Disclosure** (show/hide) ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)) | `button` | — | `aria-expanded` true/false, opt. `aria-controls`→region | **Enter/Space** toggles. *(Native `<details>/<summary>` gives this free — prefer it.)* |
| **Accordion** (extends disclosure) ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)) | headers as `button` in `<h_>` | region per panel | each header `aria-expanded`, `aria-controls`; panel `role="region"` + `aria-labelledby` | **Enter/Space** toggle; **↑/↓** between headers (opt.), **Home/End** (opt.) |
| **Switch** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)) | `switch` | — | **`aria-checked`** true/false (binary — no mixed state, unlike checkbox) | **Space** toggles (**Enter** optional) |
| **Tooltip** ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)) | `tooltip` on the bubble | — | trigger `aria-describedby`→tooltip | Shows on **hover *and* keyboard focus**; **Esc** dismisses; **tooltip never receives focus** |

**Honesty flag — the tooltip pattern is not final.** APG states: *"This design pattern is work in progress; it does not yet have task-force consensus."* Follow the stable parts (role=`tooltip`, `aria-describedby`, show on hover **and** focus per **1.4.13 Content on Hover or Focus**, Esc-dismissible, not focusable). If the popup must contain focusable content, **use a non-modal dialog instead of a tooltip.** ([APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/))

**Worked example #2 — accessible Tabs (automatic activation), full ARIA + keyboard contract, CSP-safe (inline script, no `eval`).**

```html
<div class="tabs">
  <div role="tablist" aria-label="Account settings">
    <button role="tab" id="t1" aria-selected="true"  aria-controls="p1" tabindex="0">Profile</button>
    <button role="tab" id="t2" aria-selected="false" aria-controls="p2" tabindex="-1">Billing</button>
    <button role="tab" id="t3" aria-selected="false" aria-controls="p3" tabindex="-1">Security</button>
  </div>
  <div role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">…Profile…</div>
  <div role="tabpanel" id="p2" aria-labelledby="t2" tabindex="0" hidden>…Billing…</div>
  <div role="tabpanel" id="p3" aria-labelledby="t3" tabindex="0" hidden>…Security…</div>
</div>

<script>
// Roving tabindex + Left/Right/Home/End, automatic activation. No eval, CSP-safe.
document.querySelectorAll('.tabs [role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const activate = (tab) => {
    tabs.forEach((t) => {
      const sel = t === tab;
      t.setAttribute('aria-selected', sel);
      t.tabIndex = sel ? 0 : -1;                       // roving tabindex
      document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
    });
    tab.focus();
  };
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    let n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length; // wrap
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n !== null) { e.preventDefault(); activate(tabs[n]); }   // automatic activation
  });
  tabs.forEach((t) => t.addEventListener('click', () => activate(t)));
});
</script>
```

Contract satisfied: single Tab stop enters at the selected tab and the next Tab leaves the widget (roving `tabindex`); **←/→** cycle and **wrap**; **Home/End** jump; activation follows focus (automatic — correct because panels are cheap/local); `aria-selected` and panel `hidden` stay in sync; each panel is labelled by its tab and is itself focusable (`tabindex="0"`) so keyboard users can reach panel content. For **manual** activation (use when panels are expensive), remove `activate()` from the arrow handler and toggle only on Space/Enter/click.

**Live regions** (for async status — toasts, validation, search counts): `aria-live="polite"` (waits for a pause) or `assertive` (interrupts — reserve for errors); `role="status"` = polite+atomic, `role="alert"` = assertive. The live region must **exist in the DOM before** you write to it, or the change isn't announced.

### 4.8 Reduced motion & flashes (conformance side of B1)

- **`prefers-reduced-motion: reduce`** — **substitute, don't delete.** Replace movement (slide/parallax/zoom/spin) with an opacity fade or instant change; keep functional feedback. Anti-pattern: `*{animation:none!important;transition:none!important}` — it can break skeletons, focus transitions, and state cues. B1 owns the motion vocabulary; A5 owns the requirement that a reduced path *exists and preserves function*.
- **Vestibular safety (design constraint, not a single SC):** the triggers are large-area movement, parallax, zoom/scale over big distances, spin/rotation, and motion against the scroll direction. Under `reduce`, remove these specifically. Safe: opacity, colour, blur, small (<~10 % viewport) movement.
- **2.3.1 Three Flashes (A):** no more than **3 general flashes and/or 3 red flashes in any 1-second window**, over any area bigger than the **~341×256 px** proxy for a 10° visual field (25 % of that field ≈ 0.006 steradians). A "general flash" = a pair of opposing relative-luminance changes of ≥10 % where the darker state is below 0.80 relative luminance. Below 3 Hz, or below that area, is exempt — but **3 Hz is a hard ceiling**, not a target. ([2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))
- **2.2.2 Pause, Stop, Hide (A):** any **auto-playing, moving, blinking or scrolling** content that lasts **> 5 s** and is presented **alongside other content** needs a mechanism to pause/stop/hide (carousels, animated backgrounds, marquees, auto-advancing steppers). ([2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))

```css
/* Reduced-motion: keep the fade (state signal), drop the travel (vestibular). */
.panel { transition: transform .3s cubic-bezier(.2,0,0,1), opacity .3s; }
@media (prefers-reduced-motion: reduce) {
  .panel { transition: opacity .15s; transform: none; } /* opacity only, no translate */
  *, *::before, *::after { animation-iteration-count: 1 !important; } /* stop loops, keep 1 play */
}
```

### 4.9 prefers-contrast & forced-colors (Windows High Contrast Mode)

**`prefers-contrast`** values: **`no-preference`**, **`more`** (user wants higher contrast), **`less`** (lower), **`custom`** (user-defined palette; also matches `forced-colors: active`). Map OS "Increase Contrast" (macOS) / high-contrast prefs here. Under `more`: thicken borders/focus rings, raise text and non-text contrast toward AAA (7:1 / 4.5:1). ([MDN prefers-contrast](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast))

**`forced-colors: active`** (Windows High Contrast Mode, and Edge/Chrome forced-colors) replaces your palette with a small **user-chosen system palette**. What you must know:

- **The browser overrides these to system colours:** `color`, `background-color`, `border-color`, `outline-color`, `text-decoration-color`, `column-rule-color`, SVG `fill`/`stroke`.
- **These are forced to `none` — plan around losing them:** **`box-shadow` → none**, **`text-shadow` → none**, **non-URL `background-image` → none**. So depth/elevation, shadow-only focus rings, and gradient/CSS-drawn affordances **disappear**. Re-express them with **`border`/`outline`** (which survive).
- **System colour keywords to author with:** `Canvas` / `CanvasText` (page bg/text), `ButtonFace` / `ButtonText`, `LinkText`, `Highlight` / `HighlightText` (selection/focus), `GrayText` (disabled), `Field` / `FieldText`. Use these in your `@media (forced-colors: active)` block so your UI reads correctly.
- **System colours track *native semantics, not ARIA.*** `role="button"` on a `<div>` will **not** get `ButtonText`. Another reason to use real `<button>`/`<a>`.
- **`forced-color-adjust: none`** opts an element out (rare — e.g. a colour swatch whose colour is the content). `auto` (default) lets forcing apply; the browser also draws a **"backplate"** behind text over images to preserve legibility.
- **Don't build a separate design** for forced colors; make small tweaks so the forced result stays usable. Baseline-available since Sept 2022. ([MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors))

**Worked example #3 — a card + button that stay legible in forced colors (CSP-safe):**

```css
.card   { background: var(--surface); box-shadow: 0 1px 3px rgba(0,0,0,.2); border-radius: 12px; }
.button { background: var(--brand); color: #fff; border: 2px solid transparent; border-radius: 8px; }

@media (forced-colors: active) {
  .card {
    box-shadow: none;                 /* stripped anyway — restore depth with a border */
    border: 1px solid CanvasText;
  }
  .button {
    background: ButtonFace; color: ButtonText;
    border: 2px solid ButtonText;     /* the visible boundary now that bg is system-flat */
    forced-color-adjust: auto;
  }
  .button:focus-visible { outline: 3px solid Highlight; outline-offset: 2px; }
}
```

**The three preference queries side-by-side (verified values):**

| Query | Values | Trigger |
|---|---|---|
| `prefers-reduced-motion` | `no-preference` \| `reduce` | OS "reduce motion" |
| `prefers-contrast` | `no-preference` \| `more` \| `less` \| `custom` | OS contrast setting |
| `forced-colors` | `none` \| `active` | Windows HCM / forced-colors |

### 4.10 Internationalisation (RTL, expansion, locale formats)

**RTL mirroring — do it structurally with CSS logical properties**, so a single `dir="rtl"` on `<html>` flips the whole layout:

- Replace physical with **logical properties**: `margin-inline-start/end`, `padding-inline-*`, `inset-inline-start/end`, `border-inline-*`, `text-align: start/end`, `float: inline-start`. Avoid `left/right/margin-left` for anything that should mirror.
- Set both `dir` and `lang` (`<html lang="ar" dir="rtl">`); `lang` also drives correct fonts, hyphenation, and `Intl` formatting.
- **What mirrors:** overall layout and reading flow; **directional/navigational icons** — back/forward, next/previous, breadcrumb chevrons, undo/redo, list indentation, send/reply arrows, progress *through a flow* (wizard steppers).
- **What does NOT mirror:** content tied to a physical or universal constant — **clocks**, checkmarks, most logos, a graph's numeric axes, phone numbers, and the **media-playback timeline** (a progress scrubber/waveform represents time, which doesn't reverse). **Honesty flag / contested case:** design systems disagree on the **media transport buttons** (play/rewind/fast-forward). Some (e.g. Material's bidirectionality guidance) mirror fast-forward/rewind but keep the "play" triangle; others keep all transport controls unmirrored because they map to a fixed LTR timeline. The task brief groups "play/back" as mirroring; the safe, defensible rule is: **mirror icons that mean "navigate in reading direction"; keep icons that mean "move along the fixed time axis."** **Verify against your target platform's convention** rather than assuming. (General principle per W3C i18n mirroring guidance; exact icon list varies by design system.)
- **Numerals & bidi text:** wrap mixed LTR content (URLs, code, numbers) with `dir="ltr"`/`<bdi>` inside RTL to prevent reordering artefacts.

**Text expansion — budget space, don't fix it:**

- Translated UI text commonly grows **+30–40 %** for German, Finnish, Russian vs English; **very short strings** (buttons, labels, ≤10 chars) can expand **+100–300 %**. (W3C's expansion table: ~10-char source can need 200–300 %; long paragraphs ~30 %.)
- Consequences: **never fix widths/heights on text containers**, don't truncate labels, allow wrapping, keep icons+text able to stack, test with **pseudo-localisation** (`[!!! Ëxpänded têxt !!!]`) and with actual German/Russian. This intersects **1.4.10 reflow** and **1.4.12 text spacing** — a layout that survives text-spacing overrides usually survives expansion too.

**Locale formats — never hard-code, use `Intl` (built-in, CSP-safe, offline):**

- **Numbers:** `1,234.56` (en-US) vs `1.234,56` (de-DE) vs `1 234,56` (fr-FR). Use `Intl.NumberFormat(locale)`.
- **Dates:** `07/23/2026` (US, M/D/Y) vs `23/07/2026` (much of the world, D/M/Y) vs ISO `2026-07-23`. Use `Intl.DateTimeFormat(locale, …)`; for storage use ISO 8601 / UTC.
- **Currency:** symbol position and spacing differ (`$1,234.56` vs `1.234,56 €`); use `Intl.NumberFormat(locale,{style:'currency',currency:'EUR'})`.
- **Also locale-varying:** first day of week, week numbering, name order, address format, pluralisation (use `Intl.PluralRules`), sorting (`Intl.Collator`).

### 4.11 Cognitive load & inclusive-by-default

Cognition is the least "numeric" area but has real SCs and strong heuristics:

- **Consistency (3.2.3 Consistent Navigation AA, 3.2.4 Consistent Identification AA, 3.2.6 Consistent Help A):** repeated navigation stays in the same relative order; the same function keeps the same name/icon; a help affordance sits in a consistent place. Consistency lowers working-memory demand.
- **Don't tax memory (3.3.7 Redundant Entry A):** auto-fill or let users pick previously entered data within a process; don't ask users to re-key what the system knows.
- **Accessible authentication (3.3.8 AA):** don't require solving a puzzle, transcribing, or memorising to log in without an alternative (allow password managers/paste, offer email link, etc.).
- **Error prevention & recovery (3.3.1 Error Identification A, 3.3.3 Error Suggestion AA):** identify errors in text next to the field, suggest the fix, preserve entered data, and confirm destructive/legal/financial actions (3.3.4/3.3.6).
- **Heuristics beyond SCs:** plain language (aim ~lower-secondary reading level for general audiences); one primary action per screen; chunk long forms into steps with progress; reduce the number of simultaneous choices; make defaults safe; keep instructions visible (don't rely on recall); avoid time limits or make them adjustable (2.2.1 A).

---

## 5. Options catalogue — testing & auditing tools the agent can run

Columns: **what · when to use · licence · where · CSP / where-it-runs · pitfalls.** "Free + self-hostable + OSS" is called out because it's a hard constraint; tools that are *free but proprietary* are flagged. None of these run *inside* the generated single-file variant — they run in the **build/CI/dev** environment against the rendered output, so the strict-CSP-no-eval constraint of the artefact does not restrict them.

| Tool | What it does | When to use | Licence | Where | Runs where / CSP note | Pitfalls |
|---|---|---|---|---|---|---|
| **axe-core** | Automated WCAG rule engine (the de-facto standard; powers many others) | Primary automated pass in unit/E2E tests | **MPL-2.0** (OSS) ✓ ([LICENSE](https://github.com/dequelabs/axe-core/blob/develop/LICENSE)) | [github.com/dequelabs/axe-core](https://www.deque.com/axe/axe-core/) | Node/browser DevTools; runs against the DOM in a dev context — **not** injected into the CSP-locked artefact | Catches **~30–57 %** of issues; **no substitute for manual/keyboard/SR testing**; zero false-negative guarantee is false |
| **@axe-core/playwright** / **jest-axe** / **cypress-axe** | axe wired into E2E/unit runners | Regression-gate a11y in CI | **MPL-2.0 / MIT** ✓ | npm | CI headless browser | Only as good as the pages/states you drive it through; test each widget *state* |
| **Lighthouse** | Auditing suite incl. an **axe-based** a11y category (scored 0–100) | Quick page-level score, CI budgets | **Apache-2.0** (OSS) ✓ ([Wikipedia](https://en.wikipedia.org/wiki/Lighthouse_(software))) | Chrome DevTools / `lighthouse` CLI / CI | Headless Chrome | Score is a **weighted subset of axe** — a 100 is *not* "accessible"; doesn't test keyboard/SR |
| **Pa11y / Pa11y-CI** | CLI a11y runner (axe or HTML_CodeSniffer engine) | Headless CI, batch URL scans | **LGPL-3.0-only** (OSS) ✓ ([repo](https://github.com/pa11y/pa11y)) | [github.com/pa11y/pa11y](https://github.com/pa11y/pa11y) | Node + headless Chrome | Engine choice changes results; configure thresholds |
| **IBM Equal Access Checker** | Rule engine + browser extension + CLI, maps to WCAG/IBM reqs | Second engine (catches different issues than axe) | **Apache-2.0** (OSS) ✓ ([repo](https://github.com/IBMa/equal-access)) | [github.com/IBMa/equal-access](https://github.com/IBMa/equal-access) | Browser ext / Node CLI | Different rule taxonomy; reconcile with axe results |
| **WebAIM WAVE** | Visual in-page a11y annotations | Manual spot-check, teaching, seeing structure | **Free**, **proprietary** (not OSS/self-host) ⚠ | [wave.webaim.org](https://wave.webaim.org) + browser ext | Browser extension (local page) | Not OSS; API is paid — fine as a manual aid, **not** for the "self-hostable OSS" pipeline |
| **WebAIM Contrast Checker** | WCAG 2.x ratio + pass/fail at AA/AAA | Verify **1.4.3 / 1.4.11** ratios | **Free** web tool (proprietary) ⚠ | [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) | Browser | WCAG 2.x math only (not APCA); manual |
| **APCA calculator** (`apca-w3`) | Perceptual **Lc** contrast (draft) | **Design aid** for dark mode; §4.3 | Reference code available; **usage terms tied to WCAG 3 development** ⚠ verify | [apcacontrast.com](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html) | Browser / npm | **Not normative — do not report as WCAG-compliant**; licence for commercial embedding needs verification |
| **TPGi Colour Contrast Analyser (CCA)** | Desktop eyedropper contrast tool (WCAG 2.x) | Sampling colours off rendered UI/images | **Free** download, **proprietary** ⚠ | [tpgi.com/color-contrast-checker](https://www.tpgi.com/color-contrast-checker/) | Desktop app | Not OSS; WCAG 2.x only |
| **NVDA** | Screen reader (Windows) | **Manual SR testing** — the real acceptance test | **GPL-2.0** (OSS) ✓ | [nvaccess.org](https://www.nvaccess.org/) | Windows, local | Learning curve; test with **Firefox/Chrome**; can't be automated away |
| **VoiceOver** | Screen reader (macOS/iOS) | Manual SR testing on Apple stack | Bundled w/ OS (proprietary) | Built-in | macOS/iOS | Behaviour differs from NVDA/JAWS — test ≥2 SRs |
| **Orca** | Screen reader (Linux/GNOME) | Manual SR testing on Linux | **LGPL** (OSS) ✓ | GNOME | Linux | Smaller real-world user share |
| **Accessibility Insights** | Guided manual + automated (axe) checks, incl. **tab-stop visualiser** | Structured manual audit, focus-order check | **MIT** (OSS) ✓ | [accessibilityinsights.io](https://accessibilityinsights.io/) | Browser ext / Windows | Still needs a human to run the assessment |
| **Browser DevTools** (Chrome/Firefox) | Accessibility tree, contrast hints, **forced-colors / prefers-* emulation**, focus-order | Inspect computed roles/names; emulate `prefers-reduced-motion`/`forced-colors` | Bundled | Built-in | Local | Emulation ≠ real AT; verify on real screen readers |

**Testing doctrine:** automation (axe/Lighthouse/Pa11y) catches **at best roughly a third to a half** of issues (mostly contrast, names, roles, landmarks). The rest — **keyboard operability, focus order, focus visibility, SR announcement quality, cognitive clarity, reduced-motion/forced-colors behaviour** — is **manual**. Ship gate = automated pass **+** keyboard-only walkthrough **+** ≥1 screen-reader pass **+** the §7 checklist.

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **`outline: none` with no replacement** | Keyboard focus invisible; axe "focus" flags; tab through with mouse unplugged | Use `:focus-visible` ring ≥2 px, ≥3:1, offset (§4.4). Fails 2.4.7 |
| **Focus ring only via `box-shadow`** | Ring vanishes in Windows High Contrast | Add an `outline` (survives forced-colors); §4.4/§4.9 |
| **Low-contrast text** | Contrast checker < 4.5:1 (or <3:1 large); grey-on-grey, placeholder labels | Raise to 4.5:1 / 3:1 large; verify **both** themes. 1.4.3 |
| **Colour-only meaning** | Red-border-only errors, colour-only chart legend, un-underlined inline links | Add icon+text / pattern / underline. 1.4.1 |
| **Non-text UI < 3:1** | Faint input borders, ghost toggles, low-contrast icons; axe "non-text contrast" | 3:1 vs adjacent for component boundaries & meaningful glyphs. 1.4.11 |
| **Tiny targets** | Icon buttons < 24 px; fails on `pointer: coarse`; mis-taps | Pad hit area to ≥24×24 (prefer 44); or use the spacing exception. 2.5.8 |
| **Div-as-button** | `<div onclick>` not tabbable, no role, silent to SR, no forced-colors semantics | Use `<button>`; if unavoidable add role+`tabindex=0`+key handlers. 2.1.1 |
| **No keyboard path / trap** | Can't reach or can't leave a control by keyboard | Ensure operability + escapable focus; only modals trap (with return). 2.1.1/2.1.2 |
| **Positive `tabindex`** | Weird tab order jumping around | Remove; order the DOM; use only `0`/`-1`. 2.4.3 |
| **Modal without contract** | Focus stays behind modal, Esc dead, focus lost on close | role=dialog + aria-modal + trap + Esc + return focus (§4.7) |
| **Widget missing ARIA/keys** | Custom tabs/combobox not arrow-navigable; SR announces "clickable" | Implement the APG role+keyboard contract (§4.7 table) |
| **Focus hidden by sticky UI** | Focused field slides under sticky header/cookie bar | `scroll-padding` on scroller; don't fully cover focus. 2.4.11 |
| **Blanket `animation:none`** | Skeletons frozen, state cues gone under reduce-motion | Substitute fades/instant, keep functional feedback (§4.8) |
| **Flashing content** | Flicker > 3 Hz over a large area | Cap < 3 Hz; recheck area threshold. 2.3.1 |
| **Auto-carousel, no pause** | Moving >5 s beside content, no control | Add pause/stop/hide. 2.2.2 |
| **Breaks at 320 px / on zoom** | Horizontal scrollbar at 320 px or 400 % zoom; clipped content | Logical, fluid layout; no fixed text-container sizes. 1.4.10 |
| **Breaks under text-spacing** | Clipping/overlap when user forces spacing | No fixed heights, allow wrap/overflow. 1.4.12 |
| **Physical CSS props block RTL** | `margin-left` etc. don't mirror; layout wrong in `dir=rtl` | Switch to logical properties (§4.10) |
| **Truncated translations** | German/Russian labels clipped | Remove fixed widths; test pseudo-loc + real locales (§4.10) |
| **Hard-coded number/date** | `1,234.56` / `07/23/2026` shown to all locales | `Intl.NumberFormat`/`DateTimeFormat`; ISO storage (§4.10) |
| **"axe passed = accessible"** | Green CI, but keyboard/SR broken | Add manual keyboard + SR passes; automation ≈ ⅓–½ coverage (§5) |
| **APCA cited as compliance** | "APCA AA" in a report | Correct it: APCA/WCAG 3 are **draft**; conform to 2.2 ratios (§4.3) |

---

## 7. Pre-flight accessibility audit checklist (run before shipping any variant)

**Contrast & colour**
- [ ] All body text **≥ 4.5:1**, large text (≥24 px / ≥18.66 px bold) **≥ 3:1**, in **both** light and dark (1.4.3).
- [ ] All UI component boundaries/states & meaningful graphics **≥ 3:1** vs adjacent (1.4.11).
- [ ] No information conveyed by **colour alone**; links/errors/required/legends have a non-colour cue (1.4.1).
- [ ] (Design aid) Dark theme sanity-checked with **APCA** — but ship-gate is the 2.2 ratio, not APCA.

**Focus & keyboard**
- [ ] Visible **`:focus-visible`** ring on every interactive element: **≥2 px, ≥3:1** vs component **and** surface, offset on dark (2.4.7/1.4.11/2.4.13).
- [ ] Everything operable by **keyboard**; logical **focus order**; **no positive tabindex**; **no traps** (2.1.1/2.4.3/2.1.2).
- [ ] **Skip link** + landmarks; SPA route/panel changes move focus (2.4.1).
- [ ] Focused elements **never fully covered** by sticky/overlay content (2.4.11).
- [ ] Every **drag** has a single-pointer alternative (2.5.7).

**Targets**
- [ ] Interactive targets **≥ 24×24 CSS px** (prefer 44), or spaced per the exception (2.5.8).

**Semantics (screen reader)**
- [ ] Native elements preferred; each composite widget matches its **APG role + keyboard contract** (§4.7).
- [ ] Every control has an **accessible name**; images have alt (empty for decorative); form fields have `<label>`.
- [ ] Async status via **live regions** that pre-exist in the DOM.
- [ ] Verified with **≥1 real screen reader** (NVDA/VoiceOver), not just the a11y tree.

**Motion, reflow, spacing, flashes**
- [ ] **`prefers-reduced-motion: reduce`** substitutes (not deletes) motion; functional feedback kept (§4.8).
- [ ] Nothing flashes **> 3×/s** (2.3.1); auto-motion > 5 s has pause/stop/hide (2.2.2).
- [ ] No 2-D scroll at **320 px** wide / **400 % zoom** (1.4.10); survives **line 1.5 / ¶ 2× / letter 0.12em / word 0.16em** (1.4.12).

**Preferences & i18n**
- [ ] `prefers-contrast: more` thickens/raises contrast; **`forced-colors: active`** keeps `outline`s and uses **system colours**; no reliance on `box-shadow`/`background-image` for meaning (§4.9).
- [ ] Layout uses **CSS logical properties**; `dir="rtl"` mirrors correctly (directional icons mirror, timeline/clock don't) (§4.10).
- [ ] Space budgeted for **+30–40 %** text expansion; no fixed text-container sizes.
- [ ] Numbers/dates/currency via **`Intl.*`**; ISO storage (§4.10).

**Cognition & consistency**
- [ ] Consistent nav/identification/help (3.2.3/3.2.4/3.2.6); errors identified with suggestions and data preserved (3.3.1/3.3.3); no un-adjustable time limits.

**Automation**
- [ ] **axe-core** (or Pa11y/IBM) passes in CI, understood as **~⅓–½** coverage — manual passes above are the real gate (§5).

---

## 8. Open questions / unverified

- **APCA exact size×weight×Lc cells** differ between the two APCA primary pages fetched (e.g. Lc 75 mapped to "18 px/400" vs "24 px/300 …") and across APCA versions. The **ladder (Lc 90/75/60/45/30/15)** is stable; the precise per-cell font requirements should be read from the **live interactive lookup** at build time. *(Two APCA sources, minor disagreement — flagged.)*
- **APCA licence for commercial embedding.** The `apca-w3` reference code is published, but APCA is developed under the WCAG 3 process with its own usage/patent notes during the draft phase. Treat "free to embed in a shipped product" as **unverified** — confirm before bundling the algorithm; using an online calculator for design is unproblematic.
- **RTL mirroring of media *transport* controls (play/rewind/fast-forward)** is genuinely contested between design systems; the safe principle (navigate-direction mirrors, time-axis doesn't) is given, but the exact icon list should be **verified against the target platform's convention**. *(Primary W3C i18n gives the principle; per-icon lists are design-system-specific.)*
- **Text-expansion percentages** (+30–40 %, and up to +200–300 % for very short strings) are well-established W3C/industry ranges but are heuristics, not a spec threshold — validate with real target-locale strings and pseudo-localisation.
- **2.3.1 pixel proxy (341×256).** The steradian/visual-field definition is normative; the 341×256 px figure is the commonly-used *evaluation proxy* at a typical viewing distance — use the **PEAT** analyser for anything genuinely flashy rather than eyeballing.
- **Automation coverage %.** The "~⅓–½ of issues" figure is widely cited (and varies by study/rule-set); treat as an order-of-magnitude caution, not a measured constant. The qualitative point — automation cannot verify keyboard/SR/cognition — is not in doubt.
- **WCAG 3 timeline.** No stable publication date; structure (scoring model, outcomes) is still changing. Everything WCAG-3/APCA here is **draft** and must be re-checked before being treated as normative.

---

## 9. Sources

**Primary / normative — W3C WCAG 2.2 Understanding pages (SC numbers, levels, thresholds all verified against these):**
- [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) — the 9 new SCs + levels; Rec date 2023-10-05; 4.1.1 removed.
- [1.4.1 Use of Color (A)](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [1.4.3 Contrast (Minimum) (AA)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 / 3:1, large-text definition.
- [1.4.10 Reflow (AA)](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) — 320 CSS px / 256 / 400 %.
- [1.4.11 Non-text Contrast (AA)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — 3:1 UI/graphics.
- [1.4.12 Text Spacing (AA)](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) — 1.5 / 2× / 0.12em / 0.16em.
- [2.3.1 Three Flashes or Below Threshold (A)](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) — ≤3/s, area proxy.
- [2.2.2 Pause, Stop, Hide (A)](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [2.4.7 Focus Visible (AA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [2.4.11 Focus Not Obscured (Minimum) (AA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [2.4.13 Focus Appearance (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — 2 px perimeter + 3:1 focused/unfocused.
- [2.5.5 Target Size (Enhanced) (AAA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) — 44×44.
- [2.5.7 Dragging Movements (AA)](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [2.5.8 Target Size (Minimum) (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24×24 + 5 exceptions.

**Primary / normative — WAI-ARIA Authoring Practices Guide (widget contracts):**
- [APG — Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [APG — Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [APG — Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [APG — Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [APG — Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [APG — Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [APG — Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
- [APG — Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) — **flagged: "work in progress, no task-force consensus."**

**Primary — MDN (browser behaviour, media queries):**
- [MDN — `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors) — system colours, stripped properties, `forced-color-adjust`.
- [MDN — `prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast) — no-preference/more/less/custom.

**Draft — APCA / WCAG 3 (advisory only, NOT normative):**
- [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html) — Lc ladder, WCAG-3 candidate status.
- [APCA — The Easy Intro](https://git.apcacontrast.com/documentation/APCAeasyIntro.html) — why polarity/spatial-frequency/perceptual, dark-mode rationale.

**Tool licences (verified from source):**
- [axe-core — MPL-2.0](https://github.com/dequelabs/axe-core/blob/develop/LICENSE); engine home [deque.com/axe/axe-core](https://www.deque.com/axe/axe-core/).
- [Lighthouse — Apache-2.0](https://en.wikipedia.org/wiki/Lighthouse_(software)).
- [Pa11y — LGPL-3.0-only](https://github.com/pa11y/pa11y).
- [IBM Equal Access — Apache-2.0](https://github.com/IBMa/equal-access).
- NVDA — GPL-2.0 ([nvaccess.org](https://www.nvaccess.org/)); Accessibility Insights — MIT ([accessibilityinsights.io](https://accessibilityinsights.io/)). WebAIM WAVE / Contrast Checker and TPGi CCA are **free but proprietary** (flagged in §5).
