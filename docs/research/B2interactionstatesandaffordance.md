# B2 — Interaction states & affordance

*Design-intelligence reference. Track B2 of the registry research map. Written to be read by the design agent before it styles any interactive element, and by a human owner auditing that work. Current as of July 2026.*

---

## 1. Scope line

This track owns **the complete state matrix every interactive component must define** — rest, hover, focus, focus-visible, active/pressed, selected, disabled, read-only, loading, skeleton, empty, error, success, dragging — and **what each state must change** (never colour alone). It owns **affordance** (making interactive things look interactive without decoration inflation), **input-modality differences** (pointer / touch / keyboard / pen and hover-less devices), **feedback timing** (perceived-latency thresholds; spinner vs skeleton vs progress vs optimistic vs nothing), and **destructive-action patterns** (undo vs confirm). It owns **encoding state in form/shape, not only hue** (colour-blind and dark-mode safety).

## 2. Boundary (what this track does **not** cover)

MECE split against the sibling tracks; each hand-off named:

- **The *animation* of a state transition** — duration, easing, spring, stagger of the hover→rest or loading→loaded tween → **B1 Motion & animation systems**. B2 says *which states exist, when each fires, and what else must change*; B1 says *how the pixels move between them*. (A hover state's colour/elevation delta is B2; the 120 ms ease that carries it is B1.)
- **The *words* inside a state** — error-message wording, empty-state headline/CTA copy, button microcopy, confirmation-dialog phrasing → **D1 UX copy**. B2 owns that an error state exists, is announced, and is redundantly encoded; D1 owns what it *says*.
- **Focus-ring contrast *conformance* / APCA math and target-size WCAG *minimums as a pass/fail* → **A5 Accessibility**. B2 gives practical, buildable numbers (≥2px ring, ≥3:1, ≥24/44/48px targets) and the *design*; A5 owns the conformance model and the maths.
- **Colour deltas that must survive light/dark and brand themes** (the exact token values, contrast-preserving palette ramps) → **A1 Colour & theming**. B2 says "state must not rely on hue and must invert correctly across themes"; A1 owns the token system that makes a given delta survive.
- **The static construction of the *material* that a state restyles** — a shadow, border, glass, gradient used as an elevation cue → **A4 Shape, depth & material**. B2 *toggles* elevation between states; A4 defines the elevation.
- **The single-file no-network feasibility matrix across techniques** → **H2 Feasibility**. B2 gives CSP/offline verdicts inline for each feedback mechanism; H2 is the consolidated matrix.

---

## 3. Executive rules (apply before reading the body)

1. **Define the whole matrix, not three states.** Every interactive component ships: rest, hover, **focus-visible**, active/pressed, and — where applicable — selected, disabled, read-only, loading, error, success, plus skeleton/empty at the container and dragging if draggable. A component that styles only rest + hover is unfinished. Adobe Spectrum, Material, and Carbon all treat this as a required set, not a nice-to-have. ([Spectrum states](https://opensource.adobe.com/spectrum-design-data/registry/states), [Carbon read-only pattern](https://carbondesignsystem.com/patterns/read-only-states-pattern/))
2. **Never encode state in colour alone.** Every state that carries meaning must also change a **non-colour channel**: shape, icon, text/label, border, weight, position, fill-vs-outline, or an ARIA attribute. ~1 in 12 men have a colour-vision deficiency, and dark-mode inversion can flip a hue-only signal into invisibility. This is WCAG **1.4.1 Use of Color** and it is the spine of this whole track. ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html))
3. **Every visual state needs a machine hook.** Pair the pixels with the correct DOM/ARIA state so keyboard and screen-reader users perceive it: `:disabled`/`aria-disabled`, `aria-pressed` (toggle), `aria-selected`/`aria-current`, `aria-busy` (loading), `aria-invalid` + `aria-describedby` (error), `readonly`. State that exists only in CSS does not exist for assistive tech. ([ARIA APG — Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/))
4. **`:hover`, `:focus-visible`, and `:active` answer different questions — keep them separate.** Hover = "a pointer is over me" (never fires on touch/keyboard). Focus-visible = "keyboard focus landed here, show a ring." Active = "I'm being pressed right now." Style the ring with **`:focus-visible`**, not `:focus`, so a mouse click doesn't leave a sticky outline. ([MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible))
5. **Hover is an enhancement, never the only affordance.** Touch, keyboard, and many pens have no hover. Anything revealed *only* on `:hover` — a row's delete button, a card's actions — is invisible to most users. Gate hover *polish* behind `@media (hover: hover) and (pointer: fine)`; make the underlying affordance **persistent**. ([Smashing — hover/pointer media queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/))
6. **Follow the feedback-timing ladder.** **<100 ms** feels instant → show nothing. **~300–500 ms** is the *delay before a spinner* (so it never flashes for fast responses). **>1 s** always show an indicator. **2–10 s** spinner or skeleton. **>10 s** percent-done bar + estimate. ([NN/g Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/), [NN/g Progress Indicators](https://www.nngroup.com/articles/progress-indicators/))
7. **Pick the indicator by the *shape and length* of the wait.** **Skeleton** for content-shaped page/section loads (< ~10 s); **spinner** for short indeterminate module loads (2–10 s); **progress bar** for measurable waits (>10 s); **nothing** under ~100 ms and often under ~1 s. ([NN/g Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/))
8. **Prefer optimistic UI for reversible, high-success actions; a pending state for risky ones.** Optimistic = apply the change instantly, reconcile on the server response, roll back + surface an error on failure. Use it for likes, toggles, adds, reorders. Do **not** use it for payments, irreversible deletes, or low-success operations where a rollback would confuse. ([Simon Hearne — Optimistic UI](https://simonhearne.com/2021/optimistic-ui-patterns/))
9. **Prefer undo over confirm; reserve confirmation for irreversible or high-cost actions.** A confirm dialog on routine actions trains users to click through it ("of course I want to do the thing I just told you to do"). When you must confirm, **label the buttons with the action** — "Delete file" / "Keep file", never "Yes"/"No" — and restate the consequence. ([NN/g Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/))
10. **Disabled ≠ read-only.** *Disabled* removes the element from tab order and the accessibility tree and is exempt from contrast — use it only when the user needn't perceive it. *Read-only* keeps the element **focusable and announced** — use it when the value must be read or copied but not edited. Never use disabled to mean "not yet, and here's why" without an explanation the user can actually reach. ([Carbon read-only pattern](https://carbondesignsystem.com/patterns/read-only-states-pattern/))
11. **Affordance = at least two independent signals.** A thing reads as interactive through *label + cursor + fill/border/elevation + consistency* — not one weak signifier. Conversely, don't inflate: not every card needs a shadow. Reserve elevation for genuinely raised/actionable surfaces so it keeps meaning. ([NN/g Button States](https://www.nngroup.com/articles/button-states-communicate-interaction/))
12. **Hit the target-size numbers.** ≥ **24×24** CSS px absolute minimum (crowded exception needs 24px spacing); aim **44×44** (Apple HIG) / **48×48** (Material) for primary and touch controls. The *hit area* can exceed the *visual* size via padding or a `::before` overlay. ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html))
13. **Give the focus ring real numbers.** ≥ **2px** thick, ≥ **3:1** contrast against adjacent colours, offset so it isn't clipped, and **never removed without a replacement**. (WCAG 2.4.13 Focus Appearance is the source of the 2px/3:1 figures; A5 owns the pass/fail.) ([WCAG 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html))
14. **Every state must survive both themes and reduced motion.** A hover that *darkens* in light must *lighten* in dark; a state whose only signal is animation must still read when motion is off (state ≠ motion — the animation is B1's, the state is yours). Prefer translucent black/white **state layers** over hard-coded hues so the delta inverts automatically. ([Material state layers](https://m3.material.io/foundations/interaction/states/state-layers))
15. **Draggable controls need a pointer-free path.** Any state reachable only by dragging (reorder, slider, resize) must also be operable with single taps/clicks or keys — WCAG **2.5.7 Dragging Movements** (AA). Style a `dragging` state, but don't make dragging the *only* way to reach the outcome. ([WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html))

---

## 4. Body

### 4.1 THE FULL STATE MATRIX (the centrepiece)

This is the reusable contract. For **every** interactive component, walk this table and answer each row. Columns: **State · When it applies · Visual change from rest · What must NOT be the only signal (redundancy) · a11y / DOM hook.**

| State | When it applies | Visual change from rest (design intent) | Must NOT be the only signal | a11y / DOM hook (CSS selector + ARIA/DOM) |
|---|---|---|---|---|
| **Rest / default** | Idle, interactive, reachable | Baseline fill/border/label; clear affordance (rule 11) | Colour: the *resting* affordance itself must not be hue-only (a link that is only "blue" fails) | Native element (`<button>`, `<a href>`) or `role` + `tabindex="0"` |
| **Hover** | Pointer is over it (fine pointer) | Subtle emphasis: +8% state layer / slight fill or border shift, cursor `pointer` | Cursor + fill/border change together; never *only* a colour swap. Must be **redundant** to a persistent affordance (touch has no hover) | `:hover`, wrapped in `@media (hover:hover) and (pointer:fine)` |
| **Focus (programmatic)** | Element has focus by any means | (Usually no *visible* ring for mouse — see focus-visible) | — | `:focus`; set `outline:none` here **only** if `:focus-visible` supplies the ring |
| **Focus-visible** | Keyboard/AT focus the UA decides to show | **Focus ring**: ≥2px, ≥3:1 contrast, offset | Ring is a *shape* (outline/box-shadow), inherently non-hue; keep it ≥3:1 so it's not colour-perception-dependent | `:focus-visible` |
| **Active / pressed (momentary)** | Being clicked/tapped right now | Quick "push": `scale(0.97)` or +10% state layer, 100–150 ms | Scale/inset shadow, not only a darker hue | `:active` |
| **Selected / pressed (toggle)** | Persistent on/off or chosen-in-a-set | Filled vs outline flip; check/dot icon; bolder weight; indicator bar | **Icon or fill-shape change**, not only an accent colour (colour-blind + dark-mode) | `aria-pressed` (toggle button), `aria-selected` (option/tab), `aria-current` (nav/step), `:checked` |
| **Disabled** | Action unavailable; user need not perceive detail | Desaturated, ~38% content / ~12% container opacity, `cursor:not-allowed` | Reduced opacity **and** removal of hover/press affordances; ideally a nearby reason (tooltip/text) | `disabled` (native, removes from tab order) **or** `aria-disabled="true"` (kept focusable, you must block activation) |
| **Read-only** | Value must be read/copied, not edited | De-emphasised chrome: transparent field bg, no caret, arrow cursor; **text keeps full contrast** | Removal of edit affordances (border/caret) + arrow cursor; label copy "(read only)" — not just a paler box | `readonly` attr (input), or `aria-readonly="true"`; **stays focusable & announced** |
| **Loading (element-level)** | This control kicked off async work | Spinner/pending swap on the control; disable re-entry | Spinner **shape** + disabled affordance, not just a colour dim | `aria-busy="true"` on the control; keep an accessible name |
| **Skeleton (container-level)** | Content-shaped region is fetching | Grey placeholder blocks matching final layout; optional shimmer (motion = B1) | The *placeholder shape*, not colour; announce politely | `aria-busy="true"` on the region; `aria-hidden` the fake blocks; a visually-hidden "Loading…" in an `aria-live` region |
| **Empty** | No data yet (first-run / no-results / filtered-to-zero) | Illustration/icon + explanation + primary action; distinct from *loading* and *error* | Icon + text (copy → D1), not a blank or a lone colour | `role="status"` region; ensure it's not mistaken for loading (`aria-busy="false"`) |
| **Error** | Validation/submit failed | Border + **icon** + message; input marked invalid | Icon (✕/triangle) **and** text **and** border weight — colour is the *last* channel | `aria-invalid="true"`, `aria-describedby` → message id; message in `role="alert"` / `aria-live="assertive"` |
| **Success / confirmed** | Action succeeded | Check icon + message; brief, may auto-dismiss | Check **shape** + text, not only green | `role="status"` / `aria-live="polite"`; don't steal focus |
| **Dragging** | Item is being dragged | Lift (elevation/scale ~1.02), reduced opacity on source, drop-target highlight | Elevation/opacity change + a drop-zone outline, not only a tint | `aria-grabbed` (deprecated — prefer live-region announcements); **must have a non-drag alternative** (rule 15) |
| **Indeterminate** (checkbox/progress) | Partial/unknown (tri-state, unknown progress) | Dash/mixed mark (checkbox); moving indeterminate bar | The **dash mark** / motion, not colour | `indeterminate` DOM property (checkbox); `aria-checked="mixed"`; `<progress>` without `value` |

**How to use it:** for a new component, delete the rows that don't apply (a static label needs none; a submit button needs rest/hover/focus-visible/active/disabled/loading/error/success), and *implement every remaining row's last two columns*. The two right-hand columns — redundancy and a11y hook — are the ones teams skip, and they are exactly what "never colour alone" and "state has a machine hook" enforce.

### 4.2 Focus, hover, active — the three that get conflated

These are the most-confused selectors. They are orthogonal and can coexist (a keyboard-focused button being pressed is `:focus-visible:active`).

| Selector | Fires when | Fires on touch? | Fires on keyboard? | Use it for |
|---|---|---|---|---|
| `:hover` | Pointer overlaps the element | **Sticky/buggy** (state can persist after tap) | No | Pointer-only emphasis; must be redundant |
| `:focus` | Element is focused by *any* means | On tap of a focusable element | Yes | Rarely style directly; base for focus-visible fallback |
| `:focus-visible` | Focused **and** the UA heuristic says "show it" (≈ keyboard, not mouse-click) | Generally no | **Yes** | **The visible focus ring** |
| `:active` | Being activated (mouse down / tap down / Space-Enter held) | Yes (briefly) | Yes | Momentary "press" feedback |

**Why `:focus-visible` and not `:focus`:** browsers now use heuristics so a ring appears for keyboard users but *not* when a control is clicked with a mouse — "when a button is clicked using a pointing device, the focus is generally not visually indicated, but when a text box needing user input has focus, focus is indicated." Styling `:focus` directly reintroduces the sticky-outline-after-click annoyance that made teams (wrongly) `outline:none` everything. ([MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible))

**Support (verify at build):** `:focus-visible` is **Baseline Widely available since March 2022**. For legacy engines, gate:

```css
.btn:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
@supports not selector(:focus-visible) {
  .btn:focus { outline: 2px solid var(--focus); outline-offset: 2px; }
}
```

**The cardinal focus sins:** (1) `outline: none` with no replacement — removes the ring for keyboard users (WCAG 2.4.7 fail). (2) Using `outline: none` + a `box-shadow` ring but forgetting `outline` returns in forced-colours/high-contrast mode — prefer `outline` (it respects Windows High Contrast) or add a transparent `outline` as a WHCM fallback. (3) A ring that's clipped by `overflow:hidden` — use `outline-offset` or an inset `box-shadow`.

### 4.3 Selected, disabled, read-only — the "status" trio

**Selected / pressed (persistent).** Distinct from momentary `:active`. Two sub-cases with different ARIA:

- **Toggle button** (mute on/off): `aria-pressed="true|false"`. The **label must not change** with state — a "Mute" toggle stays "Mute"; the screen reader announces "Mute, toggle button, pressed." Changing the label *and* the pressed state double-encodes and confuses. ([ARIA APG — Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/))
- **Selected in a set** (tab, list option, segmented control): `aria-selected="true"` (or `aria-current` for the current page/step in navigation). Visually flip **fill vs outline** or add an **indicator bar / check** — a colour-only "active tab" is a classic colour-alone failure.

**Disabled — two mechanisms, different semantics:**

| | `disabled` (HTML) | `aria-disabled="true"` |
|---|---|---|
| Tab order | **Removed** | **Kept** (still focusable) |
| Screen-reader announces | Often skipped/"dimmed" | "dimmed"/"unavailable" but reachable |
| Contrast requirement | **Exempt** (can be low-contrast) | Not exempt by default — keep it legible |
| Activation | Browser blocks it | **You must block it in JS/handlers** |
| Use when | Truly inert, user needn't inspect | User should *discover why* it's disabled (keeps it focusable so a tooltip/description is reachable) |

Disabled visual treatment (Material reference): **content at ~38% opacity, container at ~12%** — verified secondary source; the exact figures are Material's disabled tokens. ([WyeWorks — Material states](https://www.wyeworks.com/blog/2022/11/15/material-interaction-states-with-tailwind/)) NN/g recommends pairing the visual with `aria-disabled` for SR compatibility, and warns that fully non-perceivable disabled buttons hide *why* an action is unavailable. ([NN/g Button States](https://www.nngroup.com/articles/button-states-communicate-interaction/))

**Read-only (the forgotten state).** Carbon draws the line sharply: "Read-only components remain navigable so that users can review the information they contain. This contrasts with disabled components, which cannot be reached by a keyboard." Read-only gets a **transparent field background, de-emphasised selection/clickability, an arrow cursor, and an icon-colour change — but the text keeps full contrast**. Use it for view-only permissions or values needed later in the flow; use disabled for "temporarily unavailable pending an action." ([Carbon read-only pattern](https://carbondesignsystem.com/patterns/read-only-states-pattern/))

### 4.4 Loading, skeleton, empty, error, success — the async states

**Element-level loading vs container-level skeleton** are different states with different hooks:

- **Element loading** (a submit button that's working): swap the label for a spinner *inside the control*, set `aria-busy="true"`, keep the accessible name, and block re-submission. Do **not** collapse the button's width — reserve it, or the layout jumps.
- **Skeleton** (a card/table/region fetching): grey placeholders that **match the final layout's shape and count**, on the container marked `aria-busy="true"`, with the placeholder blocks `aria-hidden` and a visually-hidden "Loading…" in a polite live region. NN/g's caveat: *frame-only* skeletons (just header/footer, no content placeholders) "make blank screens appear non-functional — users may abandon"; and animated skeletons "risk being distracting, annoying, or even create accessibility problems." Shimmer is optional and its motion is **B1's** concern (and must respect `prefers-reduced-motion`). ([NN/g Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/))

**Empty** is three sub-states that look similar but mean different things — do not conflate with *loading*:

| Empty sub-state | Trigger | What it needs |
|---|---|---|
| First-run / zero-data | New account, nothing created yet | Encouraging illustration + explanation + **primary CTA** to create the first item |
| No-results | Search/filter returned nothing | "No matches" + a way to broaden/clear the filter — *not* the first-run CTA |
| Error-empty | Fetch failed | Reads as **error**, offers **retry** — never a silent blank |

Mark empty regions `role="status"` and ensure `aria-busy="false"` so AT users aren't told it's still loading. (Copy for all three → **D1**.)

**Error & success** are covered in the matrix; the load-bearing rules: error uses `aria-invalid` + `aria-describedby` pointing at a message in `role="alert"`; success uses `role="status"`/`aria-live="polite"` and **does not steal focus**. Both are **icon + text + border/shape first, colour last** (§4.10).

### 4.5 Dragging & other pointer states

**Dragging** needs: a **lift** on the dragged item (elevation +1 level or `scale(1.02)`), **reduced opacity on the source** placeholder, and a **drop-target highlight** (outline/inset, not a lone tint). The legacy `aria-grabbed`/`aria-dropeffect` are deprecated — announce drag progress via a live region ("Item 3 grabbed. Use arrow keys to move.") instead.

**Non-negotiable:** provide a **single-pointer / keyboard alternative** to every drag (reorder buttons, a "move to" menu, arrow-key nudging). This is WCAG **2.5.7 Dragging Movements** (AA) and **2.5.1 Pointer Gestures** (no path/multipoint-only actions). ([WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html))

### 4.6 Affordance — looking interactive without decoration inflation

Affordance is the perceived signal that a thing can be acted on. Flat design created an "affordance crisis": when buttons lose all borders/shadows, click rates drop because users can't tell what's interactive. The fix is **redundant, consistent signifiers**, not more shadows.

**The affordance signal set** (a control should carry **≥2** of these, and be *consistent* with siblings):

| Signal | Strength | Cost | Notes |
|---|---|---|---|
| **Label / text** ("Save", "Delete") | Strong | Free | A verb reads as actionable |
| **Cursor** (`pointer`) | Medium | Free | Pointer on clickable things; debated for `<button>` but common practice |
| **Fill / background** | Strong | Cheap | Solid fill = primary; the strongest "button" cue |
| **Border / outline** | Medium | Cheap | Carries affordance without elevation inflation |
| **Elevation / shadow** | Strong | **Expensive if overused** | Reserve for genuinely raised surfaces; not every card |
| **Underline** (links in text) | Strong | Free | The *only* reliable in-text link signal — colour alone fails |
| **Position / grouping** | Medium | Free | A toolbar row reads as controls by context |
| **Consistency** | Strong | Free | If all primary buttons look alike, users generalise |

**Decoration-inflation anti-patterns:** (1) shadow on every element → nothing reads as raised; (2) hover-lift on non-interactive cards → false affordance; (3) button-styled non-buttons and link-styled non-links → broken expectations. **Rule:** a signifier only signifies if it's *reserved* for the thing it signifies.

**In-text links must not rely on colour alone** — WCAG 1.4.1's canonical example. Underline them, or guarantee a non-colour distinction (weight/icon) plus a ≥3:1 contrast *against surrounding text* (the maths → A5). ([WCAG 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html))

### 4.7 Input modality — pointer, touch, keyboard, pen, and hover-less devices

Four modalities, three capability axes (`hover`, `pointer` precision, presence of a physical keyboard). The media features:

| Feature | Values | Detects | Design lever |
|---|---|---|---|
| `hover` | `hover` / `none` | Can the **primary** input hover? | Gate hover styles |
| `any-hover` | `hover` / `none` | Can **any** input hover? | Hybrid devices (phone + mouse) |
| `pointer` | `fine` / `coarse` / `none` | **Primary** pointer precision | Target sizing |
| `any-pointer` | `fine` / `coarse` / `none` | **Any** pointer precision | Hybrid devices |

**The core patterns:**

```css
/* Hover polish ONLY where hover is real and the pointer is precise */
@media (hover: hover) and (pointer: fine) {
  .card:hover { box-shadow: var(--elev-2); }
  .row:hover .row__delete { opacity: 1; } /* reveal-on-hover, enhancement only */
}
/* Coarse pointers get bigger targets */
@media (pointer: coarse) {
  .btn { min-height: 48px; min-width: 48px; }
}
```

**Why this matters — three concrete failures:**

1. **Reveal-on-hover on touch = invisible.** A row-delete that only appears on `:hover` cannot be reached on a phone. The delete affordance must be **persistent** (always-visible icon, or a swipe/overflow menu); hover may only *emphasise* it.
2. **Sticky hover on touch.** Tapping an element can leave its `:hover` state "stuck" until you tap elsewhere, because touch has no "un-hover." Gating hover behind `@media (hover:hover)` eliminates it.
3. **Hybrid devices.** A laptop with a touchscreen reports `pointer: fine` (primary) but `any-pointer: coarse` too; a phone with a Bluetooth mouse is the reverse. Don't hard-branch the whole UI on one query — size targets for the *coarsest likely* input and treat hover as additive. ([Smashing — hover/pointer media queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/), [CSS-Tricks — interaction media features](https://css-tricks.com/interaction-media-features-and-their-potential-for-incorrect-assumptions/))

**Pen/stylus:** reports `pointer: fine`, and `hover` may be `hover` (hovering pens) or `none`. Treat as precise for sizing but don't assume hover.

**Keyboard:** no hover, no pointer — everything must be operable via Tab/Shift-Tab/Enter/Space/arrows, and **focus-visible must be present**. This is the modality most likely to be broken by `outline:none`.

**Target sizes across modality:**

| Guideline | Size | Level / source |
|---|---|---|
| WCAG 2.5.8 Target Size (Minimum) | **24×24 CSS px** (or 24px spacing offset if smaller) | AA — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| WCAG 2.5.5 Target Size (Enhanced) | **44×44 CSS px** | AAA — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) |
| Apple HIG | **44×44 pt** | Platform |
| Material | **48×48 dp** | Platform |

The **hit area can exceed the visual size**: pad the control, or add a `::before { position:absolute; inset:-8px; }` to grow the tap target without changing the look. "No one ever complained a button was too easy to tap." (Conformance pass/fail → **A5**.)

### 4.8 Feedback timing — the perceived-latency ladder

Feedback must begin within the perceptual "instant" window or the UI feels broken. The anchors:

| Elapsed time | User perceives | Correct feedback |
|---|---|---|
| **< 100 ms** | Instantaneous, direct manipulation | **Nothing** — just do it. Feedback under 100 ms feels "free." |
| **100 ms – 1 s** | Slight but noticeable delay; flow of thought intact | Ideally still nothing, or a subtle in-place change. **Do not** flash a spinner here — see below |
| **~300–500 ms** | The **spinner-delay threshold** | *If* the wait will exceed this, *now* is when a spinner may appear (delayed, so fast responses never flash it) |
| **> 1 s** | Flow starts to break | **Always show an indicator** (NN/g: use a progress indicator for anything over ~1.0 s) |
| **2 – 10 s** | Waiting consciously | **Spinner** (module) or **skeleton** (page/section) |
| **> 10 s** | Attention wanders; may leave | **Percent-done bar + time estimate**; keep attention |

Sources: 100 ms/1 s/10 s are Nielsen's classic response-time limits and the RAIL 100 ms interaction budget; the >1 s / 2–10 s / >10 s split is NN/g's progress-indicator and skeleton guidance; 100 ms perceptibility is corroborated by optimistic-UI research ("we start to notice delays around 100 ms"). ([NN/g Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/), [NN/g Progress Indicators](https://www.nngroup.com/articles/progress-indicators/), [Simon Hearne](https://simonhearne.com/2021/optimistic-ui-patterns/))

**The spinner-flash anti-pattern (why the ~300–500 ms *delay* exists).** If you show a spinner immediately and the response returns in 80 ms, the spinner *flashes* — appearing and vanishing too fast to read, which feels **more** broken than no spinner. Two coupled fixes: (1) **delay** the spinner by ~300–500 ms so fast responses never trigger it; (2) once shown, keep it up for a **minimum ~500 ms** so it doesn't flash *out*. Both are widely-adopted engineering heuristics rather than a single citable spec figure — *flag as heuristic*.

**Decision: spinner vs skeleton vs progress vs optimistic vs nothing** — see the Options catalogue (§5). The one-line rules: **shape-known + page/section → skeleton; short + indeterminate + module → spinner; measurable + long → progress bar; reversible + high-success → optimistic (no indicator at all); <100 ms → nothing.**

**Optimistic UI in detail.** Decouple feedback from the network: apply the expected result to the UI *immediately*, fire the request in the background, and **reconcile** when it returns — on failure, roll back the UI and surface an error (ideally with retry). This turns a 300 ms round-trip into a 0 ms-perceived interaction. ([Simon Hearne](https://simonhearne.com/2021/optimistic-ui-patterns/))

- **Use for:** likes/favourites, toggles, add-to-cart, reorder/drag, marking read, inline edits — high success rate, cheap and safe to roll back.
- **Do NOT use for:** payments/checkout, irreversible deletes, anything where showing an unconfirmed state could mislead into a second action, or where the failure rate is high. There, show an honest **pending** state.
- **Rollback must be visible and explained**, never silent — a like that quietly un-likes teaches distrust.

### 4.9 Destructive actions — undo vs confirm

The default is **undo**, not confirm. Confirmation dialogs, overused, become reflexive click-through: "If you warn people too much, they stop paying attention." Undo lets the action happen fast and offers a safety net. Reserve confirmation for actions that are **irreversible or high-cost**. ([NN/g Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/))

**The decision rule:**

| Reversible? | Cost of an accidental trigger | Frequency | → Pattern |
|---|---|---|---|
| Yes | Low | Any | **Optimistic + no confirm** (undo optional) |
| Yes | Low–medium | Frequent | **Undo** (toast, 5–10 s window) — *not* a dialog |
| Yes but effortful | Medium | Occasional | **Undo**, longer window / persistent |
| **No (irreversible)** | High | Rare | **Confirm dialog** with action-labelled buttons |
| No | **Severe** (delete org, wipe data) | Very rare | **Type-to-confirm** ("type DELETE") or re-authenticate |

**When you do confirm — the rules:**

1. **Restate the specific consequence** ("This permanently deletes 3 projects and their history"), not "Are you sure?".
2. **Label buttons with the outcome**: "Delete file" / "Keep file" — never "Yes"/"No" or "OK"/"Cancel" for destructive choices. ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/))
3. **Make the destructive button visually distinct AND redundantly encoded** — not "the red one." Red fill **+** a label verb **+** often an icon; the safe/cancel default gets visual priority. Colour-blind users must still tell them apart (§4.10).
4. **Separate consequential from benign options** — don't place "Delete" immediately beside "Save" with identical styling; proximity + sameness causes mis-clicks. ([NN/g — Proximity of Consequential Options](https://www.nngroup.com/articles/proximity-consequential-options/))
5. **Don't double-confirm** routine things — dialog fatigue erases the dialog's value.

**Undo window numbers:** an undo toast typically persists **5–10 s** (long enough to react, short enough not to linger); for higher-cost reversible actions, make it **persistent until dismissed** or move it to a "recently deleted" area. (These are common product conventions — *flag as convention, not spec*.)

### 4.10 Encoding state without hue — the redundancy system (colour-blind + dark-mode)

"Never colour alone" operationalised. For each stateful meaning, colour is allowed as *one* channel but must be **backed by a shape/text/position channel** that survives (a) colour-vision deficiency and (b) light↔dark inversion.

| Meaning | Hue (allowed, not sole) | **Redundant non-hue channel(s)** |
|---|---|---|
| Error | Red | ✕ / triangle **icon** + message **text** + heavier **border** + `aria-invalid` |
| Success | Green | ✓ **check icon** + text + `role=status` |
| Warning | Amber | ⚠ **icon** + text |
| Selected | Accent | **Fill↔outline flip**, check/dot **icon**, **indicator bar**, bolder **weight** |
| Disabled | Grey | **Reduced opacity** + removed affordances + `cursor:not-allowed` + `aria-disabled` |
| Required field | (often red \*) | **Asterisk/"required"** text + `required`/`aria-required` |
| Current / active nav | Accent | **Indicator bar** + `aria-current` + bolder weight |
| Focus | Accent ring | The **ring shape** itself (≥2px) is non-hue by construction |

**Dark-mode safety specifics:**

- Prefer **translucent state layers** (`rgb(255 255 255 / 8%)` in dark, `rgb(0 0 0 / 8%)` in light) over hard-coded hover hues, so "emphasis" means *lighter* in dark and *darker* in light automatically. Material's state-layer model formalises this — an on-colour overlay at a per-state opacity. Commonly-cited M3 opacities: **hover ~8%, focus ~10%, pressed ~10%, dragged ~16%** — *flag: the canonical M3 page is JS-rendered and secondary sources disagree at the margins; verify the exact tokens at build.* ([Material state layers](https://m3.material.io/foundations/interaction/states/state-layers))
- A **selected background tint** that has enough contrast in light can vanish in dark (or vice-versa) — which is why the *icon/border/weight* redundancy is what actually carries the state across themes. The exact contrast-preserving token values are **A1's**; the design rule (don't let a theme-fragile tint be the only signal) is B2's.
- Semantic hues shift across themes: "red" error at full saturation can be painful in dark mode — desaturate, but keep the **icon** so the meaning survives regardless.

### 4.11 Worked example A — full Button state matrix (CSS, light + dark, CSP-safe)

A single `<button>` implementing rest, hover, focus-visible, active, selected (toggle), disabled, and loading — pure CSS, using translucent state layers so it inverts for dark mode, no JS for the visual states, strict-CSP-safe (no external requests, no `eval`, no inline event handlers).

```html
<button class="btn" type="button">Save</button>
<button class="btn" type="button" aria-pressed="true">Bookmarked</button>
<button class="btn" type="button" aria-busy="true">
  <span class="btn__spinner" aria-hidden="true"></span>
  <span class="btn__label">Saving…</span>
</button>
<button class="btn" type="button" aria-disabled="true">Unavailable</button>
```

```css
.btn {
  /* --- tokens: one accent, theme-aware surface & ink --- */
  --accent: #2563eb;
  --ink: #ffffff;
  --surface: var(--accent);
  --layer: 0 0% 100%;          /* white overlay for state layers on a dark fill */
  position: relative;
  display: inline-flex; align-items: center; gap: .5rem;
  min-height: 44px; padding: 0 16px;       /* ≥44px target (§4.7) */
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  font: 600 15px/1 system-ui, sans-serif;
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms ease; /* motion → B1 */
}

/* State layer: a translucent overlay whose OPACITY encodes emphasis,
   so it lightens a dark fill and (with black) darkens a light fill. */
.btn::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  background: hsl(var(--layer)); opacity: 0; pointer-events: none;
  transition: opacity 120ms ease;
}

/* HOVER — only where hover is real; opacity, not a new hue */
@media (hover: hover) and (pointer: fine) {
  .btn:hover::after { opacity: .12; }
}

/* FOCUS-VISIBLE — 2px ring, offset, ≥3:1 target, shape-based (non-hue) */
.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ACTIVE — momentary push: transform + deeper layer, not just darker */
.btn:active { transform: scale(.97); }
.btn:active::after { opacity: .2; }

/* SELECTED (toggle) — fill→outline flip + persistent layer + (add an icon in real UI) */
.btn[aria-pressed="true"] {
  background: transparent; color: var(--accent);
  border-color: var(--accent);
}
.btn[aria-pressed="true"]::after { opacity: .08; }

/* DISABLED — reduced opacity + not-allowed; aria-disabled keeps it focusable */
.btn[aria-disabled="true"] {
  opacity: .5; cursor: not-allowed;
}
.btn[aria-disabled="true"]:hover::after,
.btn[aria-disabled="true"]:active { /* kill affordances */
  opacity: 0; transform: none;
}

/* LOADING — spinner shape + width reserved (label swapped, not removed) */
.btn[aria-busy="true"] { cursor: progress; }
.btn__spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: btn-spin 700ms linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }

/* THEME — dark mode: keep white state-layer, swap surface/ink via tokens */
@media (prefers-color-scheme: dark) {
  .btn { --accent: #60a5fa; --ink: #0b1220; }
  /* --layer stays white: emphasis still reads as "lighter" on the fill */
}

/* MOTION — reduced-motion swaps spin for a static pulse (state still reads) */
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
  .btn:active { transform: none; }
  .btn__spinner { animation: none; border-top-color: currentColor; opacity: .5; }
}
```

**What this demonstrates:** (1) every state changes a **non-colour channel** — hover = opacity layer, focus = ring shape, active = transform, selected = fill/outline flip, disabled = opacity + affordance removal, loading = spinner shape; (2) the **state layer inverts for dark mode for free** because emphasis is expressed as overlay opacity, not a hard-coded hue; (3) it's **pure CSS + ARIA** — no JS needed for the visuals, so it's strict-CSP/offline safe; (4) it's **reduced-motion aware** without losing the *state* (the loading state still reads when the spin stops — that's the B1/B2 boundary in action). In production, add an **icon** to the selected/toggle button so it's not the outline-flip *and* colour alone.

### 4.12 Worked example B — destructive action: undo-vs-confirm decision, both patterns

**Pattern 1 — Reversible delete → optimistic remove + Undo toast (the default).** No dialog. The row disappears immediately; a toast offers undo for ~7 s; the server call fires in the background and rolls back on failure.

```html
<!-- After clicking "Delete" on a list row -->
<div class="toast" role="status">          <!-- polite: doesn't steal focus -->
  <span class="toast__icon" aria-hidden="true">🗑</span>  <!-- icon = redundant to text -->
  <span>“Q3 report” deleted.</span>
  <button class="toast__undo" type="button">Undo</button>
</div>
```
```css
.toast { display:flex; align-items:center; gap:.75rem; padding:12px 16px;
         border-radius:8px; background:#1f2937; color:#fff; }
.toast__undo { min-height:44px; padding:0 12px; background:none;
               border:1px solid #4b5563; border-radius:6px; color:#93c5fd;
               text-decoration:underline; cursor:pointer; } /* not colour alone: underline */
.toast__undo:focus-visible { outline:2px solid #93c5fd; outline-offset:2px; }
```
Undo window ~5–10 s; the toast is `role="status"` so it's announced without grabbing focus; the Undo control is a real ≥44px button with a focus ring and an **underline** (not colour alone).

**Pattern 2 — Irreversible / high-cost delete → confirmation with action-labelled buttons.** Used only when there is no undo (permanent, expensive, or bulk).

```html
<div role="alertdialog" aria-modal="true"
     aria-labelledby="d-title" aria-describedby="d-desc" class="dialog">
  <h2 id="d-title">Delete “Marketing” workspace?</h2>
  <p id="d-desc">This permanently deletes 42 files and removes 6 members.
     <strong>This can’t be undone.</strong></p>
  <div class="dialog__actions">
    <button type="button" class="btn btn--ghost">Keep workspace</button>   <!-- safe default, visual priority -->
    <button type="button" class="btn btn--danger">
      <span aria-hidden="true">⚠</span> Delete workspace                    <!-- icon + verb + colour -->
    </button>
  </div>
</div>
```
```css
.btn--danger { background:#dc2626; color:#fff; }        /* colour is ONE channel… */
.btn--danger::before { /* …the icon + the verb "Delete" are the others */ }
.dialog__actions { display:flex; gap:12px; justify-content:flex-end; }
/* Separate consequential from benign: danger is not adjacent-identical to a Save */
```

**The rule made concrete:** Pattern 1 (undo) is the default for reversible actions because it's fast and forgiving; Pattern 2 (confirm) is reserved for the irreversible case, uses **`role="alertdialog"`**, **restates the specific consequence**, **labels buttons with the outcome** ("Delete workspace"/"Keep workspace", not Yes/No), gives the **safe option visual priority**, and encodes "destructive" with **icon + verb + colour** (never red alone). For catastrophic actions, replace the button with a **type-to-confirm** field.

---

## 5. Options catalogue — feedback mechanisms

Columns: **what · when to use · when NOT · licence · how (implementation) · CSP/offline · pitfalls.** All of these are patterns built from the web platform, so **licence is n/a** (no third-party dependency); where a helper library exists it's noted.

| Mechanism | What it is | When to use | When NOT | Licence | How (CSP-safe implementation) | CSP / offline | Pitfalls |
|---|---|---|---|---|---|---|---|
| **Nothing (instant)** | No indicator; result appears | Response **< 100 ms**; optimistic updates | Anything the user waits on > ~1 s | n/a | Just apply the change | ✅ Safe | Feels broken if the wait is actually long; measure real latency |
| **Optimistic update** | Apply expected result immediately, reconcile on response | Reversible, **high-success**, low-stakes (likes, toggles, add, reorder) | Payments, irreversible deletes, high failure rate | n/a | Update DOM/state now; background request; roll back + error toast on fail | ✅ Safe (logic can be inline JS, no eval) | Silent rollback erodes trust; must show + explain failures |
| **Spinner (indeterminate)** | Looping indicator, unknown duration | **Short indeterminate** module waits **2–10 s** | < 1 s (flashes); measurable long waits; full pages (use skeleton) | n/a | Pure CSS `@keyframes rotate` on a bordered circle | ✅ Safe | **Delay ~300–500 ms** before showing + **~500 ms min** display to avoid flash; must respect reduced-motion |
| **Skeleton screen** | Grey placeholders matching final layout | **Content-shaped** page/section loads, up to ~10 s | Tiny/opaque waits; when layout shape is unknown | n/a | Static CSS placeholder blocks; optional shimmer (motion → B1) | ✅ Safe | Frame-only skeletons feel dead; animation can distract/annoy; must match real layout or causes shift ([NN/g](https://www.nngroup.com/articles/skeleton-screens/)) |
| **Progress bar (determinate)** | Percent-done, measurable | Waits **> 10 s** or known steps (uploads, multi-doc) | Unknown duration (use spinner); very short waits | n/a | `<progress value max>` or a CSS width-driven bar | ✅ Safe | Fake/janky progress erodes trust; start slower, accelerate near end ([NN/g](https://www.nngroup.com/articles/progress-indicators/)) |
| **Inline pending state** | The control itself shows working (button spinner, `aria-busy`) | Form submits, save buttons — keep context | When the whole region changes (use skeleton) | n/a | `aria-busy="true"`, swap label for spinner, reserve width | ✅ Safe | Don't collapse width (layout jump); block re-submit; keep accessible name |
| **Indeterminate → determinate switch** | Spinner first, progress once measurable | Work whose length becomes known mid-flight | When you never learn the length | n/a | Start spinner, swap to `<progress>` when total known | ✅ Safe | Jarring swap if abrupt; cross-fade (B1) |
| **Live-region status text** | Visually-hidden/visible text announced to AT | Accompany *any* async state for SR users | As the *only* visual feedback for sighted users | n/a | `role="status"`/`aria-live="polite"` (or `assertive`/`alert` for errors) | ✅ Safe | `assertive` interrupts — reserve for errors; don't spam updates |
| *(helper)* **Skeleton/spinner via a UI lib** | Prebuilt components (e.g. shadcn/ui `Skeleton`, MUI) | If already using that stack | Adds a dependency for something CSS does natively | Varies — **shadcn/ui MIT**, **MUI MIT** | Inlined component CSS | ✅ Safe if self-hosted/inlined | Overkill for a single-file build; verify licence (most are MIT) |

**One-screen decision tree:**

```
Will it take < 100 ms?            → show NOTHING
Reversible & high-success?        → OPTIMISTIC update (no indicator)
< ~1 s but > 100 ms?              → nothing, or subtle in-place; do NOT flash a spinner
Page/section, layout known?       → SKELETON
Short (2–10 s), indeterminate?    → SPINNER (delayed 300–500 ms, min 500 ms shown)
Measurable / > 10 s?              → PROGRESS BAR + time estimate
Single control kicked it off?     → inline PENDING state (aria-busy) on that control
…and always:                     → pair with a LIVE REGION for AT
```

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Colour-alone state** | Error/selected/required signalled only by hue; invisible in greyscale or to CVD users | Add icon + text + border/weight; test in greyscale; audit against WCAG 1.4.1 (§4.10) |
| **Only rest + hover styled** | Keyboard focus invisible; no pressed/disabled/loading | Implement the full matrix (§4.1); at minimum add focus-visible + disabled + pressed |
| **`outline: none` with no replacement** | Tab through the page — focus vanishes | Restore a `:focus-visible` ring (≥2px, ≥3:1, offset); keep an `outline` for WHCM (§4.2) |
| **`:focus` used for the ring** | Sticky outline after mouse-clicking a button | Move ring to `:focus-visible`; `@supports` fallback for legacy (§4.2) |
| **Reveal-on-hover only** | Row/card actions unreachable on touch | Make the affordance persistent; hover only *emphasises*; gate hover in media query (§4.7) |
| **Sticky hover on touch** | Tapped element stays "hovered" | Wrap hover in `@media (hover:hover) and (pointer:fine)` (§4.7) |
| **Spinner flash** | Spinner blinks for < 100 ms then vanishes; feels janky | Delay spinner 300–500 ms; enforce ~500 ms minimum display (§4.8) |
| **Spinner for a 30 s wait** | Endless spin, users abandon | Switch to determinate progress + estimate over ~10 s (§4.8, §5) |
| **Skeleton doesn't match layout** | Content jumps when it loads (CLS) | Match placeholder shape/count to real content; reserve dimensions (§4.4) |
| **Disabled hides the "why"** | Users stuck at a disabled submit, no reason | Use `aria-disabled` (keeps focus) + a reachable reason, or inline validation (§4.3) |
| **Disabled ↔ read-only confusion** | Copyable value is `disabled` (unfocusable) or an editable field is `readonly` | Read-only for view/copy (focusable, announced); disabled for truly inert (§4.3) |
| **Confirm fatigue** | "Are you sure?" on every routine action; users auto-click | Replace with undo; reserve confirm for irreversible/high-cost (§4.9) |
| **Yes/No destructive buttons** | Ambiguous confirm ("OK"/"Cancel") | Label with outcomes ("Delete file"/"Keep file") (§4.9) |
| **Destructive = red only** | Colour-blind user can't tell delete from save | Icon + verb + colour + placement + safe-option priority (§4.9, §4.10) |
| **Consequential next to benign** | "Delete" beside identically-styled "Save" | Separate/space them; differentiate weight (§4.9) |
| **Optimistic rollback is silent** | Like reverts with no message; user confused | Always surface + explain the failure, offer retry (§4.8) |
| **Targets too small / crowded** | Mis-taps on mobile; < 24px controls touching | ≥24px (min) / 44–48px (touch); grow hit area via padding/`::before` (§4.7) |
| **State breaks in dark mode** | Hover darkens a dark fill into invisibility; tint vanishes | Use translucent white/black state layers; back state with icon/border (§4.10) |
| **State lost under reduced motion** | Loading spinner frozen reads as "done"; nothing signals busy | Keep a *static* state signal when motion off (dim/pulse-off, `aria-busy`) (§4.11) |
| **Drag with no alternative** | Reorder only by drag; keyboard/AT can't | Add buttons/menu/arrow-key move; WCAG 2.5.7 (§4.5) |

---

## 7. Pre-flight checklist (run before shipping any interactive component)

- [ ] **Every applicable matrix row implemented** (§4.1): rest, hover, focus-visible, active, and — as relevant — selected, disabled, read-only, loading, error, success, skeleton/empty, dragging.
- [ ] **No state relies on colour alone** — each carries an icon/shape/text/border/position channel too (§4.10; WCAG 1.4.1).
- [ ] **Every visual state has a machine hook** — `aria-pressed`/`aria-selected`/`aria-current`/`aria-busy`/`aria-invalid`/`aria-disabled`/`readonly`/`:disabled` (§4.1).
- [ ] **Focus ring uses `:focus-visible`**, ≥2px, ≥3:1, offset, not clipped, never removed without replacement; WHCM-safe (§4.2, §4.13→A5).
- [ ] **Hover is additive, not sole** — gated in `@media (hover:hover) and (pointer:fine)`; every hover-revealed affordance is persistent by another means (§4.7).
- [ ] **Feedback timing follows the ladder** — nothing <100 ms; spinner delayed 300–500 ms + min ~500 ms; indicator >1 s; skeleton vs spinner vs progress chosen by shape/length (§4.8, §5).
- [ ] **Optimistic UI only for reversible/high-success**; failures roll back **visibly** with retry (§4.8).
- [ ] **Undo is the default for reversible destructive actions**; confirm reserved for irreversible/high-cost; buttons labelled with outcomes, not Yes/No; safe option prioritised; consequential separated from benign (§4.9).
- [ ] **Disabled vs read-only chosen deliberately** — read-only stays focusable/announced; disabled is truly inert; disabled never hides a needed "why" (§4.3).
- [ ] **Targets ≥24px (min) / 44–48px (touch)**; hit area grown via padding/`::before` where the visual is smaller (§4.7).
- [ ] **Every state survives dark mode** — translucent state layers or theme-aware tokens; state backed by non-hue channel (§4.10; deltas → A1).
- [ ] **Every state survives reduced motion** — the *state* still reads when the animation is off (motion itself → B1) (§4.11).
- [ ] **Draggable controls have a pointer-free / keyboard alternative** (WCAG 2.5.7) (§4.5).
- [ ] **Affordance ≥2 independent signals**, consistent with siblings; no decoration inflation (shadows/hover-lift reserved for genuinely interactive/raised things) (§4.6).
- [ ] **Async states announced** via a live region (`status`/`alert`) for AT users (§4.4, §5).

---

## 8. Open questions / unverified

- **Material state-layer opacities** (hover ~8% / focus ~10% / pressed ~10% / dragged ~16%) are the widely-cited M3 values, but the canonical `m3.material.io` page is JS-rendered and the secondary sources fetched disagreed at the margins (one example used 16% for a *tinted hover* sample). **Verify the exact tokens against `@material/tokens` or the live spec at build time.** The disabled figures (38% content / 12% container) were corroborated by a secondary source but should also be re-checked. ([Material state layers](https://m3.material.io/foundations/interaction/states/state-layers))
- **The 300–500 ms spinner-delay and ~500 ms minimum-display** are near-universal engineering heuristics to avoid spinner flash, but not a single citable spec figure — treat as a strong convention, not a standard. NN/g anchors the >1 s "show an indicator" and 2–10 s "spinner" bands; the *delay* is inferred from the < 1 s "don't flash" guidance.
- **Undo-window duration (5–10 s)** is a product convention (Gmail-style undo-send, toast defaults), not a spec. High-cost reversible actions may warrant a persistent "recently deleted" area instead — decide per action.
- **WCAG Focus Appearance is SC 2.4.13, Level AAA** in the final WCAG 2.2 Recommendation (Oct 2023) — the 2px-perimeter / 3:1 figures come from there. Earlier drafts numbered/levelled it differently; some blogs still cite "2.4.11 AA." B2 uses the numbers as *design targets*; **A5 owns the conformance verdict** and should confirm the current SC number/level. ([WCAG 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html))
- **`:has()` for parent/sibling state** (e.g. `.field:has(:invalid)`) is powerful for pure-CSS state encoding and is Baseline in modern engines, but **verify support** for the target browser floor and provide a JS-toggled-class fallback if needed. (Not exercised in the worked examples to keep them maximally portable.)
- **Cursor `pointer` on `<button>`** is contested (the historical native default is `default`/arrow); this report follows the dominant modern convention (pointer on anything clickable). If a design system mandates otherwise, that's a house-style call, not an accessibility one.
- **Hybrid/variable-input devices** (touch laptop, phone + mouse) mean `hover`/`pointer` media queries describe the *primary* input only; `any-hover`/`any-pointer` help but the safest rule is "size for the coarsest likely input, treat hover as additive." Real-device testing recommended. ([CSS-Tricks](https://css-tricks.com/interaction-media-features-and-their-potential-for-incorrect-assumptions/))

---

## 9. Sources

Primary / authoritative:
- [W3C WAI-ARIA APG — Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) — `aria-pressed` toggles, `aria-disabled`, Space/Enter, label-must-not-change.
- [MDN — `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — keyboard-vs-pointer heuristic, Baseline March 2022, `@supports` fallback.
- [WCAG 2.2 — 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) — colour must not be the only visual means.
- [WCAG 2.2 — 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) — 2px-perimeter minimum, 3:1 focused/unfocused contrast (AAA).
- [WCAG 2.2 — 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24×24 CSS px (AA).
- [WCAG 2.2 — 2.5.5 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) — 44×44 CSS px (AAA).
- [WCAG 2.2 — 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) — single-pointer alternative to drag (AA).
- [NN/g — Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) — 0.1 s / 1 s / 10 s perceptual anchors.
- [NN/g — Progress Indicators Make a Slow System Less Insufferable](https://www.nngroup.com/articles/progress-indicators/) — >1 s show indicator; 2–10 s looped; >10 s percent-done.
- [NN/g — Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/) — skeleton vs spinner vs progress by wait length; frame-only/animation caveats.
- [NN/g — Button States: Communicate Interaction](https://www.nngroup.com/articles/button-states-communicate-interaction/) — enabled/disabled/hover/focus/pressed/loading; stroke-not-colour focus; press 100–150 ms.
- [NN/g — Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/) — undo over confirm; action-labelled buttons; over-warning fatigue.
- [NN/g — Dangerous UX: Consequential Options Close to Benign Options](https://www.nngroup.com/articles/proximity-consequential-options/) — separate destructive from benign.
- [Carbon Design System — Read-only states pattern](https://carbondesignsystem.com/patterns/read-only-states-pattern/) — read-only vs disabled: focusability, announcement, contrast.
- [Adobe Spectrum — States registry](https://opensource.adobe.com/spectrum-design-data/registry/states) — canonical state list incl. keyboard-focus vs focus, pending, drag-and-drop.
- [Material Design 3 — State layers](https://m3.material.io/foundations/interaction/states/state-layers) — translucent on-colour overlay per state (values flagged unverified).

Reference / secondary:
- [Simon Hearne — Optimistic UI Patterns](https://simonhearne.com/2021/optimistic-ui-patterns/) — decouple feedback from network; 100 ms perceptibility.
- [Smashing Magazine — A Guide to Hover and Pointer Media Queries](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/) — hover/pointer/any-* patterns and the hybrid-device pitfall.
- [CSS-Tricks — Interaction Media Features and Their Potential for Incorrect Assumptions](https://css-tricks.com/interaction-media-features-and-their-potential-for-incorrect-assumptions/) — primary-input caveats.
- [WyeWorks — Material Interaction States with Tailwind](https://www.wyeworks.com/blog/2022/11/15/material-interaction-states-with-tailwind/) — disabled 38%/12% opacities (secondary corroboration).
- [W3C WCAG — C45: Using `:focus-visible`](https://www.w3.org/WAI/WCAG22/Techniques/css/C45) — keyboard focus-indication technique.

Cross-track hand-offs: transition animation → **B1**; state copy → **D1**; contrast/target-size conformance & APCA → **A5**; theme-surviving colour deltas → **A1**; material construction → **A4**; single-file feasibility matrix → **H2**.
