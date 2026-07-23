# C1 — Component anatomy & taxonomy

*Design-intelligence reference. Track C1 of the registry research map. Written to be read by the design agent before it assembles or invents any component, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns the **canonical inventory of UI components** — primitives, composites, and surfaces — and for each: its **anatomy/slots**, its **required variants**, the **states it must support** (listed here, defined in B2), and its **common misuse**; plus the cross-cutting rules for **variant-vs-prop modelling**, **composition/slotting patterns**, **build-new-vs-compose** decisions, **component/part/state naming**, and what it takes to **document a component so it can be rebuilt faithfully** by an agent that has never seen it.

## 2. Boundary (what this track does **not** cover)

- **How components stay consistent *with each other*** — shared token ramps, cross-component coherence, visual drift detection → **C2 Design-system coherence**. C1 defines what a single Button *is*; C2 defines how the Button's blue stays the same blue as the Link's blue.
- **Data-bearing components** — tables, charts, dashboards, stat tiles, sparklines → **C3 Data components**. C1's "List" and "Card" are content containers; C3 owns anything whose primary job is presenting a dataset.
- **The detailed state matrix** — exactly what visually changes (color, elevation, border) for hover/focus/pressed/disabled/etc. → **B2 Interaction states & affordance**. C1 *lists which states a given component must support*; B2 *defines what each state looks like and when it fires*.
- **Motion** — how a dialog's entrance animates, easing, duration → **B1 Motion & animation systems**. C1's Dialog spec says *it has an open/closed state*; B1 says how that transition moves.
- **Accessibility conformance testing and scoring** — WCAG success-criteria audits, contrast math, screen-reader QA protocol → **A5 Accessibility**. C1 cites the W3C ARIA Authoring Practices Guide (APG) for *structural* correctness (roles, required properties, keyboard maps) because a component built on the wrong pattern is unrebuildable-correctly; A5 owns full conformance verification.

---

## 3. Executive rules (apply these before reading the inventory)

1. **Classify by reuse shape, not by complexity.** A **primitive** is a single interactive/display concern with no other named component nested inside it (Button, Checkbox, Badge). A **composite** assembles ≥2 primitives and *owns* interaction/state orchestration between them (Dialog, Combobox, Toast). A **surface** is a page-level layout region composed of composites+primitives that typically appears **once per screen**, not repeated many times (App-shell, Page-header). Test: *if it repeats many times per screen, it's a primitive or composite; if it's a once-per-screen layout region, it's a surface.*
2. **Variant vs. prop: mutual exclusivity decides.** A **variant** is a named, author-chosen value from a closed set where each value swaps **multiple visual properties together** and the values are **mutually exclusive in meaning** (Button `emphasis`: primary/secondary/tertiary/ghost — a button is never "primary and secondary"). A **prop** (boolean or independent enum) is a modifier that **combines freely** with any variant value (`disabled`, `loading`, `size`, `fullWidth`). Test: *if two values of the dimension could sensibly both apply at once, it's a prop or a second, orthogonal variant axis — not a value inside the same enum.*
3. **Tone and emphasis are usually two separate variant axes, not one.** The most common modelling bug is folding a status color (danger/success) into the same enum as emphasis (primary/secondary), producing an unmanageable cross-product (`primary-danger`, `secondary-danger`, `tertiary-danger`…). IBM Carbon models this correctly: "Danger button" is documented as **its own axis with three styles — primary, tertiary, ghost** — proving tone × emphasis are independent. ([Carbon Button usage](https://carbondesignsystem.com/components/button/usage/))
4. **States are never variants.** hover, focus, active/pressed, disabled, loading, selected, error are runtime/user/data-driven — never a value a designer "picks" for a static instance the way a variant is chosen. C1's job is to say **which** states a component must support; B2 defines what each looks like. Modelling an error condition as a selectable "variant" instead of a state is a recurring, avoidable defect.
5. **Anatomy before API.** Name every visible/structural part *before* naming a single prop. Parts become either (a) subcomponent names using **parent-prepended naming** — `DialogTitle`, `CardActions`, never a bare generic `Title`/`Actions` ([EightShapes: Subcomponents](https://medium.com/eightshapes-llc/subcomponents-753ce9f6600a)) — or (b) BEM elements (`.c-dialog__title`). Props are then declared per-part or per-root only after anatomy is settled.
6. **Minimum viable anatomy per tier.** Every primitive needs at least a root/container + a content slot. Every composite needs a root + (trigger, if not always-visible) + a content region + an explicit dismiss-or-commit affordance. Every surface needs at least one landmark role (`main`, `navigation`, `banner`, `contentinfo`). A component missing its tier's floor is under-specified, not "simple."
7. **Compose before you build.** Before creating a new composite, check whether it is a *known recombination* of existing primitives plus a positioning/overlay pattern — e.g., Combobox = Input + Listbox + Popover-positioning; Command-palette = Dialog + Combobox-style input + List. Build genuinely new interaction models only when no existing APG pattern's role set or keyboard map fits (rare) — see the build-new-vs-compose table in §5.3.
8. **Prefer the platform inside this tool's constraints.** In a strict-CSP, single self-contained HTML file, offline, no-`eval` deliverable, reach for native elements before scripted widgets: `<dialog>` for modal, the `popover` attribute for popovers/menus/tooltips/toasts, `<details>`/`<details name="…">` for accordion (including exclusive groups), `<select>` (optionally with the emerging customizable-select CSS) for select. These ship with built-in focus management, Esc handling, and top-layer stacking, at **zero JS-eval risk**. Document the CSP/offline verdict per component — see §4.8.
9. **Every anchored composite needs a documented positioning contract.** Side, alignment, offset, and collision behavior (flip/shift on overflow) must be specified, not left implicit — undocumented positioning is the most common reason a composite breaks the first time it's placed somewhere other than where it was designed.
10. **Required-variant floor.** Every primitive with a semantic role must ship at minimum a neutral/default plus one role-signalling variant: Button needs primary+secondary at minimum; Badge/Tag needs neutral+at least one status tone; Banner needs info+critical at minimum. Shipping one flat, toneless style is the most common real-world inventory gap.
11. **Required-state floor.** Every interactive component defines at minimum **hover, focus-visible, active/pressed, disabled**. Anything asynchronous adds **loading**; anything with a validity concept adds **error/invalid**; anything selectable adds **selected/checked**. (Full per-state visual deltas are B2's domain; C1 only enumerates which apply — see the inventory tables in §4.)
12. **Icon-only anything needs a programmatic accessible name.** `aria-label` on icon-buttons and icon-only toggles — never a tooltip alone. Tooltips are not reliably exposed to touch or announced by all assistive tech; APG's Tooltip pattern is explicit that tooltip content must be supplementary, not the only source of a name or of essential information. ([APG Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/))
13. **State-vs-a11y must not fork.** Whatever attribute drives the visual state (`data-state="open"`, a BEM modifier class) must be the *same* attribute — or programmatically tied to the same one — that drives the accessibility state (`aria-expanded`, `aria-checked`, `aria-selected`). If CSS reads one flag and the screen reader reads another, they will eventually disagree. Hook CSS off the ARIA/native attribute directly where one exists (`[aria-expanded="true"]`, `:disabled`, `:checked`) rather than duplicating state into a parallel class.
14. **"Documented for faithful rebuild" = six required parts.** A spec is complete only when it has all of: (a) anatomy/parts list, (b) variant enum with what visually changes per value, (c) state list with trigger + a B2 pointer, (d) keyboard map + ARIA role/property list, (e) the naming convention applied to every part, (f) a minimal working markup skeleton. Missing any one forces an implementer to guess — and guessing is where cross-component drift (→ C2) begins. Both worked examples in §4.9–4.10 satisfy all six.
15. **Divergent naming across ecosystems is normal — resolve it once, not per-instance.** Carbon's "Tag" ≈ Material's "Chip" ≈ Polaris's "Tag"/"Badge" split by interactivity. Pick one name and one definition per concept for your system, record the cross-reference once (§4.5), and stop re-litigating it component by component.

---

## 4. Body — the canonical inventory

### 4.1 Taxonomy: primitives → composites → surfaces

| Tier | Definition | Reuse shape | Examples |
|---|---|---|---|
| **Primitive** | Single interactive/display concern; no other named component nested inside | Repeats many times per screen | Button, Input, Checkbox, Badge, Avatar |
| **Composite** | Assembles ≥2 primitives; owns interaction/state orchestration between its parts (open/closed, active item, positioning) | Repeats several times per screen | Dialog, Dropdown-menu, Tabs, Toast |
| **Surface** | Page-level layout region composed of composites + primitives; provides landmark structure | Usually once per screen (per region) | App-shell, Page-header, Empty-state |

This mirrors the spirit of Brad Frost's atoms/molecules/organisms taxonomy — smaller indivisible pieces compose into functional groups, which compose into distinct page sections — but this report uses **primitive/composite/surface** because those names map directly onto reuse cardinality and API ownership, which is what an implementer needs to decide "do I compose or build." ([Atomic Design, ch. 2](https://atomicdesign.bradfrost.com/chapter-2/))

### 4.2 Primitives inventory

*States column is the required floor per Rule 11; exact visual deltas are B2's domain.*

| Component | Anatomy / slots | Required variants | Required states | Common misuse |
|---|---|---|---|---|
| **Button** | root; optional leading icon; label; optional trailing icon; optional loading indicator | emphasis: primary / secondary / tertiary / ghost (mutually exclusive); tone: neutral / danger (orthogonal axis, Rule 3) | hover, focus-visible, active, disabled, loading | >1 primary per view; used for navigation instead of a link; icon-only with no `aria-label`; disabling with no explanation instead of showing why |
| **Icon-button** | root; single icon slot; required `aria-label` (no visible label) | same emphasis/tone axes as Button; optional `pressed` (toggle) | hover, focus-visible, active, disabled, (pressed via `aria-pressed` if toggle) | missing accessible name; touch target under ~24 CSS px (WCAG 2.5.8) / under 44 px recommended; used where a labeled button would remove ambiguity |
| **Input (text field)** | label; field box; optional leading/trailing icon or adornment; helper text; error text; optional counter | `type` is a prop (text/email/number/search/…), not a variant | default, hover, focus, filled, disabled, read-only, invalid, required | placeholder used *as* the label (disappears on typing, fails a11y); error text not linked via `aria-describedby`; no visible focus ring |
| **Textarea** | same as Input + resize handle | auto-grow vs fixed-rows (prop) | same as Input + at-character-limit | fixed tiny height forcing an inner scrollbar for normal-length content |
| **Checkbox** | control box (indicator); label | none (binary/tri-state is state, not variant) | unchecked, checked, indeterminate, hover, focus-visible, disabled (× each check-state) | indeterminate set visually without `aria-checked="mixed"`; used for mutually-exclusive choices (should be Radio) |
| **Radio (group)** | group container (`fieldset`/`legend` or `role="radiogroup"` + `aria-label`); item × N (control + label) | none | unchecked, checked (one per group), hover, focus-visible, disabled | radios missing a shared group/`name` so more than one can be checked across the page; used for a single yes/no (should be Checkbox or Switch) |
| **Switch** | track; thumb; label text that does **not** change with state | none | off, on, hover, focus-visible, disabled | used for actions needing an explicit "Save" step (switch should apply immediately, per APG); used when there are >2 options; label text changes between "On"/"Off" (APG explicitly forbids this) |
| **Select** | trigger (closed-value display + chevron); popup listbox; option items; optional group label/separator | none intrinsic (searchable = Combobox, a different composite) | closed, open, placeholder/unselected, selected, disabled, invalid; per-option: highlighted, selected, disabled | 2-option select instead of Switch/Radio pair; custom-built replacement with broken keyboard support instead of native `<select>` |
| **Slider** | track; filled range; thumb(s); optional value bubble; optional ticks/labels | single-thumb vs range/multi-thumb (variant — adds a whole part) | default, hover (thumb), focus-visible (thumb), dragging, disabled | thumb hit-target too small for touch; value not exposed via `aria-valuenow`/`min`/`max`/`text`; step size mismatched to needed precision |
| **Link** | text (or icon + text); underline/visited affordance | inline (within text) vs standalone (nav-like) — prop; external-link indicator — prop | default, hover, focus-visible, visited (optional), active | styled to look like a Button or vice versa (breaks navigate-vs-act expectations — see Worked Example, §4.9); color-only affordance with no underline |
| **Badge** | small container; numeric or dot content; optionally overlaid on another element | numeric (count) vs dot (status-only); tone (neutral/info/success/warning/critical) as a layered prop | default; overflow truncation (e.g. "99+") — otherwise non-interactive by definition | used as a clickable filter (that's Tag/Chip, §4.5); illegible at 3+ digit counts |
| **Tag / Chip** | container; label; optional leading icon/avatar; optional trailing remove (×) | read-only / selectable / dismissible / operational (Carbon's 4; Material's assist/filter/input/suggestion is the analogous split — verify current M3 naming, §8) | enabled, hover, focus-visible, selected (selectable), disabled | conflated with Badge (Chip is interactive/removable; Badge is a passive indicator); remove (×) with no `aria-label` ("Remove {label}") |
| **Avatar** | image slot; fallback slot (initials/icon); optional status-dot overlay | shape (circle/rounded-square) — prop; size — prop | loading, loaded, error/fallback | fallback initials with insufficient contrast; meaningful photo missing descriptive `alt` (vs. correctly-empty `alt` when purely decorative) |
| **Label** | text; optional required-marker; optional info-trigger | none | default, disabled (mirrors control), error (mirrors control) | not programmatically associated to its control (missing `for`/`id` or wrapping) |
| **Divider** | rule/line; optional inline label ("OR") | horizontal vs vertical; solid vs subtle tone (prop) | none (static) | marking every visual gap with `role="separator"` (over-announces to screen readers) instead of plain decorative spacing |
| **Spinner** | single indeterminate rotating indicator; optional label | size (prop); inline vs full-region overlay (variant — overlay adds a scrim part) | visible/spinning; must be wrapped in `role="status"`/`aria-live` | shown for very short waits causing flicker (ref B1/B2 for the exact threshold); no accessible announcement; no associated label for what is loading |
| **Progress (determinate)** | track; filled indicator; optional label/percentage | determinate vs indeterminate; linear vs circular | 0–100% value, indeterminate loop, error/failed, complete | indeterminate styling used for a determinate wait (misleads on true progress); missing `role="progressbar"` + `aria-valuenow/min/max` |
| **Tooltip** | trigger (any element, external); content bubble; optional arrow | none (a "rich"/interactive tooltip is actually a Popover, §4.3 — flag the swap) | closed, delayed-open, instant-open (Radix's 3-state model) | essential or interactive content placed only in a tooltip (unreachable via touch/screen reader, ref APG); used as the *only* accessible name for an icon-button (Rule 12) |

### 4.3 Composites inventory

| Component | Anatomy / slots | Required variants | Required states | Common misuse |
|---|---|---|---|---|
| **Dropdown-menu** | trigger; content (popup); optional label; item; group; checkbox-item; radio-group + radio-item; item-indicator; separator; optional arrow; sub-menu (sub-trigger + sub-content) ([Radix Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)) | action-menu (command items) vs selection-menu (checkbox/radio items) — mode, not a full variant | closed/open (trigger + content); item: enabled, highlighted (roving focus), disabled, checked | plain items with manual checkmarks instead of real checkbox/radio-items (breaks a11y state); >2 levels of nested submenu; long-form content or text inputs placed inside (role `menu` expects command items + type-ahead, not free text — use Popover/Dialog instead) |
| **Combobox / autocomplete** | input (`role="combobox"`); popup (`listbox`/`grid`/`tree`/`dialog` per `aria-haspopup`); options ([APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)) | 4 APG types: select-only; editable + list-autocomplete; editable + inline-autocomplete; editable, no autocomplete | closed/open; option: active-descendant, selected; input: empty/has-value/invalid | DOM focus moved into options instead of using `aria-activedescendant` (breaks typing — see Failure modes §6); filtering that silently discards a valid free-text entry when free text should be allowed |
| **Date-picker** | trigger/input(s) (single or start+end fields); popover/dialog containing month/year header + prev/next nav; calendar grid (`role="grid"`, cells = `gridcell`); optional footer (clear/apply) | single-date vs range vs multi-month-range ([Polaris Date picker](https://polaris-react.shopify.com/components/selection-and-input/date-picker)) | cell: default, today, selected, in-range, range-start/-end, disabled (out of range/blocked), focus | calendar-only entry with no typed-date fallback (Polaris explicitly recommends a text-field alternative); trapping focus so manual typing is impossible; **APG has no canonical Date Picker pattern** — flag, §8 |
| **Dialog / modal** | overlay/backdrop; container; header (title + close); body; footer (actions); external trigger — full spec in §4.10 | size: sm/md/lg/fullscreen (prop); purpose: informational/confirmation/form/danger (variant — changes icon, button count/color, dismissibility; mirrors Carbon's passive/transactional/danger/acknowledgment split) | closed, open, (opening/closing — ref B1), internal loading, internal invalid | nested dialogs; no explicit initial-focus decision; dismissible-by-backdrop-click on a destructive/data-loss action; body content that needs its own scroll instead of scrolling the whole viewport |
| **Drawer / sheet** | same core as Dialog + directional slide edge (left/right/top/bottom) + optional drag handle (mobile bottom sheets) | edge: left/right/top/bottom (variant — changes anatomy with a handle on bottom sheets); size/breakpoint (prop) | same as Dialog + snap-points (partial/full) + dragging | used where the main view must stay simultaneously referenceable (a drawer still typically dims/blocks — use a persistent split-view/side-panel instead); no drag-handle affordance on touch |
| **Popover** | trigger/anchor; content; optional arrow; optional close ([Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)) | modal vs non-modal (explicit prop); interactive vs display-only content | closed/open; positioning: side × align × collision (flip/shift) | used where a Dialog is semantically correct (Popover = contextual/anchored, usually light-dismiss; Dialog = interrupts flow, demands a decision) — swapping breaks modality expectations; anchored with no collision handling, popping off-screen |
| **Tabs** | root; list (`tablist`); trigger (`tab`) × N; content (`tabpanel`) × N ([Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)) | line/underline vs contained/boxed (visual); horizontal vs vertical (prop — changes arrow-key axis) | tab: active, inactive, disabled, hover, focus-visible; panel: shown/hidden | a required field buried in a non-active panel with no warning before submit; used for a strictly linear/sequential flow (should be Stepper); >7–8 tabs with no overflow handling |
| **Accordion / disclosure** | **Disclosure** (single): trigger + content pair. **Accordion** (set): root + item × N (heading-wrapped trigger + panel) — two distinct APG patterns, not one ([APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), [APG Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)) | single-open (exclusive) vs multi-open (variant); bordered vs flush (prop) | item: expanded, collapsed, hover, focus-visible, disabled | a lone show/hide toggle mislabeled and built as a full "accordion" (wrong ARIA grouping for a single item — use Disclosure); trigger is a styled `<div>`, not a real focusable button; heading level around the trigger skipped or omitted |
| **Card** | container/surface; optional media; header (title + optional meta); body; footer (actions) — modelled as `CardImage`/`CardText`/`CardActions` subcomponents ([EightShapes: Subcomponents](https://medium.com/eightshapes-llc/subcomponents-753ce9f6600a)) | outlined vs elevated vs filled (system-level style, rarely per-instance); interactive/clickable vs static (variant) | default; hover/focus-visible/selected (interactive only); disabled | a real `<button>`/`<a>` nested inside a card that is *itself* wrapped in an outer link/click handler (invalid nested-interactive markup, ambiguous target); "click anywhere" card with zero visible affordance |
| **List** | container; item × N (optional leading icon/avatar/checkbox + primary text + secondary text + optional trailing meta/action) | plain vs interactive/selectable (→ becomes `role="listbox"`/`option`, APG Listbox) vs orderable | item: default, hover, focus-visible, selected, disabled | generic `<ul>`/`<li>` markup used for what is actually a selection widget (should be Listbox semantics, not a static list) |
| **Form-field / group** | label; control (composed-in, not owned); helper text; error text; optional required-marker. Group: `fieldset`+`legend` or `role="group"` + `aria-labelledby` wrapping related fields | none | default, focus-within, disabled, invalid (message + `aria-invalid="true"` + `aria-describedby`), required | error text visually near but not programmatically linked (`aria-describedby`); asterisk-only required indicator with no text legend; bare `<div>` used where fields are logically grouped (loses the grouping context for screen readers) |
| **Toast** | viewport (fixed region); root (icon + title + description + action + close); optional timestamp ([Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast); [Carbon Notification](https://carbondesignsystem.com/components/notification/usage/)) | tone: info/success/warning/error (variant) × actionable vs plain (prop) | open/closed; paused-on-hover/focus; swipe: start/move/cancel/end | auto-dismiss with no pause-on-hover/focus and a duration shorter than the message takes to read (WCAG 2.2.2 territory, ref B1/B2); used for content the user *must* see/act on (should be a persistent Banner instead) |
| **Breadcrumb** | `nav` landmark (`aria-label="Breadcrumb"`); ordered list of link × N-1 + separator × N-1 + current page (non-link, `aria-current="page"`) ([Carbon Breadcrumb](https://carbondesignsystem.com/components/breadcrumb/usage/)) | location-based vs path-based (dynamically generated) | link: default, hover, focus-visible; overflow (collapses middle items) | wraps to a second line (explicitly flagged by Carbon as a defect); replaces primary navigation entirely; current page rendered as a clickable link instead of plain text + `aria-current` |
| **Pagination** | **(a)** items-per-page selector + range-of-total text + prev/next. **(b)** page-number buttons (current = `aria-current="page"`) + overflow button + prev/next — two distinct anatomies sharing one name ([Carbon Pagination](https://carbondesignsystem.com/components/pagination/usage/)) | (a) data-table pagination vs (b) page-number nav | button: default, hover, focus-visible, disabled (prev on page 1 / next on last page) | used for a linear multi-step flow (should be Stepper); used "superfluously" where infinite scroll or no pagination would serve better (Carbon's own guidance); placed above instead of below the paginated content |
| **Stepper** (Carbon: "Progress Indicator") | step × N: status indicator (checkmark-complete / number-current / number-not-started / error icon) + connecting line + label + optional helper text ([Carbon Progress Indicator](https://carbondesignsystem.com/components/progress-indicator/usage/)) | horizontal vs vertical (Carbon recommends vertical when space allows); linear (gated) vs non-linear (freely navigable) | completed, current, not-started, error, disabled, hover, focus (7, Carbon-verified) | used for non-sequential navigation (that's Tabs); skip-ahead allowed in a linear flow with unvalidated prior steps; the specific failing step not surfaced on submit-time validation |
| **Command-palette** | dialog wrapper (often native `<dialog>`); search input; list; group × N (with heading); item × N (optional shortcut hint/icon); empty state; optional loading indicator; separator ([cmdk](https://github.com/pacocoursey/cmdk), MIT) | flat list vs grouped/sectioned; search-only vs with default/recent items | closed/open; input: empty/typing/no-results; item: highlighted (roving, **not** DOM focus), selected, disabled | real DOM focus moved per item while arrow-navigating (breaks typing — must use `aria-activedescendant`, focus stays in the input, ref APG Combobox); no global keyboard shortcut to open it; every keystroke blocks on network with no debounce/loading affordance |
| **Segmented-control** (Carbon: "Content Switcher") | container/track; segment × N (label and/or icon), exactly one selected ([Carbon Content Switcher](https://carbondesignsystem.com/components/content-switcher/usage/)) | label-only / icon-only / icon+label; high-contrast vs low-contrast (Carbon's placement-context variant) | unselected, selected, hover, focus, disabled (5, Carbon-verified) | used for a binary on/off (should be Switch, per Carbon's own guidance); used for genuinely distinct/unrelated content areas (should be Tabs — segmented control implies peer views of *similar* data); unequal segment widths |

### 4.4 Surfaces inventory

| Component | Anatomy / slots | Required variants | Required states | Common misuse |
|---|---|---|---|---|
| **App-shell** | header (always present) + optional left panel (product nav) + optional right panel (system panel) + `main` landmark. Directional convention: product-specific = left, system/global = right ([Carbon UI Shell](https://carbondesignsystem.com/components/UI-shell-header/usage/)) | header-only (simple products) vs header + left panel vs header + both panels | left panel: expanded/collapsed/hidden (responsive); right panel: open/closed | competing top-level nav systems fighting for primacy (breadcrumb + tabs + sidebar all claiming to be *the* nav); chrome that doesn't collapse responsively, forcing horizontal scroll |
| **Top-nav** | brand/logo slot; primary nav links/menu; utilities (search/notifications/profile — "reserved for universal, system-level functions"); product switcher, always rightmost (Carbon-verified convention) | — (part of App-shell header) | link: default, hover, focus-visible, current (`aria-current="page"`) | too many peer nav items with no responsive collapse (should fold into the left-panel hamburger, per Carbon); product-nav and system-utility icons mixed out of the left→right / product→global convention |
| **Sidebar** (App-shell left panel) | `nav` landmark; item × N (icon + label, optionally nested/collapsible groups); optional section headers; optional collapse toggle | expanded (icon+label) vs rail/collapsed (icon-only) vs overlay (mobile — effectively a Drawer) | item: default, hover, focus-visible, current, disabled; nested group: expanded/collapsed | collapsed/rail mode with icon-only items and no accessible name/tooltip; current-page shown by color alone with no non-color cue (ref A5) |
| **Page-header** | optional breadcrumb (composes Breadcrumb); title (`<h1>`); optional description; optional metadata row (composes Badge/Tag); primary + secondary actions (composes Button); optional page-level tabs (composes Tabs) | sticky/pinned-on-scroll vs static (prop) | — (mostly composed-in states) | two `<h1>`s on one page; so many actions the header wraps unpredictably with no overflow menu |
| **Banner / alert** (page-level, distinct from Toast) | icon (status); title; body; ≤2 actions; optional dismiss ([Polaris Banner](https://polaris-react.shopify.com/components/feedback-indicators/banner)) | tone: info / success / warning / critical (4, Polaris-verified) | dismissible vs non-dismissible (critical/required info); focus-visible on actions/dismiss | dismissible on information the user is required to see; `role="alert"` (assertive) applied to trivial banners — over-announces and causes "alert fatigue" for screen-reader users, reserve it for genuinely urgent content, else use `role="status"` (polite) per APG's Alert pattern; used as a substitute for inline field-level validation |
| **Empty-state** | decorative illustration/image (empty `alt`); heading; body text; primary action; optional secondary action; optional footer content ([Polaris Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)) | default / subdued-footer / full-width (3, Polaris-verified) | — (static; only its action buttons carry states) | applied to a single missing field/widget instead of full-page/section absence of data (Polaris scopes this explicitly to page/section-level emptiness); vague CTA copy; **omitted entirely**, leaving a blank void — the single most common miss |

### 4.5 Cross-system naming map (resolve once, per Rule 15)

| Concept in this report | Carbon | Material (M3) | Polaris | Notes |
|---|---|---|---|---|
| Passive status/count indicator, non-interactive | *(no direct equivalent — closest is a small Tag)* | Badge | Badge | keep non-interactive; if it gains an onclick/remove, it's actually a Tag/Chip |
| Interactive, removable, filterable label | Tag (read-only / selectable / dismissible / operational) ([Carbon Tag](https://carbondesignsystem.com/components/tag/usage/)) | Chip (assist / filter / input / suggestion — verify current naming, §8) | Tag | pick ONE name for your system; this report uses **Tag/Chip** |
| Peer toggle between views of similar data | Content switcher ([Carbon Content Switcher](https://carbondesignsystem.com/components/content-switcher/usage/)) | *(Segmented button)* | *(no dedicated component — composed from ButtonGroup)* | this report uses **Segmented control** |
| Selection input with a popup list | Select / Dropdown / Combobox / Autocomplete / Datalist / Picker — six names surveyed across systems ([Open UI Select research](https://open-ui.org/components/select.research/)) | Select / Menu | Select / Autocomplete / Combobox | Open UI's own research page treats this naming spread as *unresolved* across the industry — pick one mapping and hold it (§4.6) |
| Single step, sequential flow with completion state | Progress indicator ([Carbon Progress Indicator](https://carbondesignsystem.com/components/progress-indicator/usage/)) | *(Stepper — mobile guidelines)* | *(no dedicated component)* | this report uses **Stepper** |

### 4.6 Naming conventions — component, part, state

Use one convention per layer; do not invent a new scheme per component.

| Layer | Convention | Example |
|---|---|---|
| **Component (block)** | one settled name per concept (§4.5 resolves cross-system spelling); lower-kebab class root or PascalCase in code | `.c-dialog`, `Dialog` |
| **Part (element)** | BEM double-underscore, **or** parent-prepended subcomponent name — never a bare generic part name ([EightShapes: Crafting Component API](https://medium.com/eightshapes-llc/crafting-ui-component-api-together-81946d140371)) | `.c-dialog__title`, `DialogTitle` (not `Title`) |
| **Variant (author-chosen, mutually exclusive)** | BEM double-dash modifier class, or a `data-variant`/`data-size` attribute | `.c-button--primary`, `data-size="lg"` |
| **State (runtime/user/data-driven)** | native pseudo-class where one exists → else ARIA state mirrored by attribute selector → else `data-state`/`data-*` only for UI-only state with no ARIA equivalent (Rule 13) | `:disabled`, `:checked`, `[aria-expanded="true"]`, `[data-state="open"]`, `[data-side="top"]` |

The `data-state`/`data-*` vocabulary above is not invented for this report — it is the exact convention Radix Primitives ships across its whole library (`data-state="open\|closed"`, `data-disabled`, `data-orientation`, `data-side`, `data-align`, `data-highlighted`, `data-placeholder`), verified directly from its component docs. ([Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [Radix Select](https://www.radix-ui.com/primitives/docs/components/select), [Radix Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)) It generalizes well to hand-authored HTML because attribute selectors (`[data-state="open"]`) work with zero framework and zero `eval`.

**State-layer reference numbers (informative — B2 owns the canonical version):** Google's MDC Web source ships exact ripple/state-layer opacities, verified directly from source:

| Ink tone | Hover | Focus | Press | Selected | Activated |
|---|---|---|---|---|---|
| Dark-on-light ink | 4% | 12% | 12% | 8% | 12% |
| Light-on-dark ink | 8% | 24% | 24% | 16% | 24% |

Source: [`material-components-web` `_ripple-theme.scss`](https://github.com/material-components/material-components-web/blob/master/packages/mdc-ripple/_ripple-theme.scss) (Apache-2.0). **Honesty flag:** these are the Material 2 / MDC-Web values, verified from source code. Material 3's own site (`m3.material.io/foundations/interaction/states/state-layers`) is JS-rendered and could not be fetched this session; M3's commonly-cited figures (hover ≈8%, focus/press ≈10%, dragged ≈16% against a single on-surface layer) are a widely repeated simplification of the same idea but were **not freshly re-verified** here — check the live token export at build time if exact fidelity to M3 matters.

### 4.7 Slotting & composition patterns

| Pattern | What | When | When NOT |
|---|---|---|---|
| **Children / default slot** | Consumer passes arbitrary content into one open region | Simple wrappers (Card body, Button label) | Component must coordinate multiple distinct regions |
| **Named subcomponents** | Parent-prepended parts (`DialogTitle`, `.c-dialog__title`) consumers can reorder/omit/restyle | ≥2 semantically distinct regions | Trivial one-slot components |
| **Native `<slot>` (Shadow DOM)** | Web Component named slots | Shipping real Custom Elements with Shadow DOM | Single hand-authored HTML file with no Shadow-DOM strategy already in place — adds `::part()`/`::slotted()` styling overhead for no benefit here |
| **Render-slot / render-prop** | Consumer function receives internal state, returns markup | Framework contexts (React/Vue) exposing internal state to fully custom rendering | Vanilla HTML/CSS/JS deliverable — this concept doesn't exist in plain DOM; don't reach for it |
| **Portal (manual)** | Render subtree elsewhere in the DOM to escape clipping/z-index | Historically: overlay content in a scrolling/clipped ancestor | **Superseded** for CSP-safe single-file builds by the native `popover` attribute / top layer (§4.8), which escapes stacking context and overflow with zero manual DOM surgery |

### 4.8 Native-HTML fast path — CSP/offline verdicts

This tool's hard constraints (strict CSP, no `eval`, single self-contained file, offline) make platform-native mechanisms the default, not a fallback. Verdicts below are dated to this research session; **re-verify support at build time**.

| Composite | Native mechanism | CSP/offline verdict | Support (as researched, mid-2026) |
|---|---|---|---|
| Dialog / modal | `<dialog>` + `.showModal()` | Zero-`eval`, CSP-safe. Built-in focus trap, `::backdrop`, implicit `aria-modal="true"` | **Baseline widely available since ~March 2022.** ([MDN `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)) The newer `closedby` attribute (controls light-dismiss/Esc precisely) is narrower: **Chrome/Edge 134+, Firefox 141+; not supported in Safari** as of this research. ([caniuse: dialog closedby](https://caniuse.com/mdn-html_elements_dialog_closedby)) |
| Popover / Dropdown-menu / Tooltip / Toast | `popover` attribute + `popovertarget`/`popovertargetaction` | Zero-`eval`, CSP-safe. Top-layer rendering, light-dismiss (`auto`), `::backdrop`, `:popover-open` | **Baseline newly available since 27 Jan 2025**, all three engines (Safari fixed a light-dismiss bug in 18.3). ([web.dev: Popover reaches Baseline](https://web.dev/blog/popover-baseline), [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)) The `hint` popover type (non-`auto`-closing, good for tooltips) is newer — verify support depth at build time |
| Accordion (incl. exclusive) | `<details>`/`<summary>`; `name` attribute for exclusive grouping | Zero-JS, zero-`eval`, CSP-safe | `name`-based exclusive grouping: **Chrome/Edge 120+, Firefox 130+, Safari 17.2+.** ([Chrome for Developers: Exclusive accordion](https://developer.chrome.com/docs/css-ui/exclusive-accordion)) A JS polyfill exists for older engines; documented as a fallback, not the default |
| Select | `<select>` + `appearance: base-select` on **both** the select and its `::picker(select)`, plus `<selectedcontent>` | Zero-`eval`, CSP-safe where supported | **Shipped in Chromium**; still a graduated Open UI proposal as of Jan 2026 — Firefox/Safari status must be re-checked at build time. ([Open UI: Customizable select explainer](https://open-ui.org/components/customizable-select.explainer/)) Until broadly supported, build Select/Combobox per the APG pattern as the safe cross-browser default |

### 4.9 Worked example — Button (full anatomy + slots + variants + states)

**Anatomy (parts):**

```
.c-button                       — root (native <button>, or <a> only for navigation)
.c-button__icon--leading        — optional icon before label
.c-button__label                — text node
.c-button__icon--trailing       — optional icon after label
.c-button__spinner               — optional loading indicator (replaces/overlays label)
```

**Variant axes (Rule 2/3 — two independent axes, not one enum):**

| Axis | Values | What changes | Mutually exclusive within axis? |
|---|---|---|---|
| `emphasis` | `primary` \| `secondary` \| `tertiary` \| `ghost` | fill, border, text weight/color | yes |
| `tone` | `neutral` (default) \| `danger` | hue only, layered on top of whichever emphasis is chosen | yes within axis, but combines freely with any emphasis (Carbon: danger has primary/tertiary/ghost sub-styles, proving the axis is independent — [Carbon Button usage](https://carbondesignsystem.com/components/button/usage/)) |

**Props (freely combinable, independent of both axes):**

| Prop | Type | Notes |
|---|---|---|
| `size` | enum `sm` \| `md` \| `lg` | recommended 3-step floor for a general system; Carbon documents 7 sizes and Polaris documents 4 — both are outliers for a product-specific system, not a general target (§8) |
| `disabled` | boolean | native `disabled` attribute — removes from tab order, which is correct for buttons |
| `loading` | boolean | pairs with `aria-busy="true"`; label stays in the DOM (don't let the accessible name disappear) |
| `fullWidth` | boolean | — |
| `iconOnly` | boolean | **requires** `aria-label` (Rule 12) |
| `type` | native `button`\|`submit`\|`reset` | always set explicitly; an unset `type` inside a `<form>` defaults to `submit`, a frequent accidental-submit bug |

**Required states:** default, hover, active/pressed, focus-visible, disabled, loading — the floor from Rule 11. (Exact per-state visual deltas: B2.)

**Semantics & keyboard:**
- Prefer native `<button>` — gets `role="button"`, focusability, and both **Space and Enter** activation for free (APG Button pattern). ([APG patterns list](https://www.w3.org/WAI/ARIA/apg/patterns/))
- If a non-button element must be used: `role="button"` + `tabindex="0"` + manually handle both Space and Enter — APG documents this fallback explicitly, but it is strictly worse than the native element in a hand-authored file.
- **Button vs. Link, precisely:** a Button performs an in-page action (mutate state, submit, open); a Link navigates (changes URL, supports right-click → "open in new tab," responds to **Enter only**, natively — **Space does not activate a link**). Styling a `<a>` to look like a Button without knowing this is a common, easy-to-miss keyboard bug.
- Loading: set `disabled` **and** `aria-busy="true"`, keep the label (or replace with "Saving…" text, not just an icon) so the accessible name never goes silent mid-action.

**Minimal markup (matches this tool's actual output shape — plain HTML/CSS, no framework):**

```html
<button type="submit" class="c-button c-button--primary" data-size="md">
  <span class="c-button__label">Save changes</span>
</button>

<button type="submit" class="c-button c-button--primary" data-size="md" disabled aria-busy="true">
  <span class="c-button__spinner" aria-hidden="true"></span>
  <span class="c-button__label">Saving…</span>
</button>

<button type="button" class="c-button c-button--ghost c-button--danger" data-size="sm">
  <span class="c-button__label">Delete</span>
</button>

<button type="button" class="c-button c-button--ghost" aria-label="Delete item" data-size="md">
  <svg class="c-button__icon" aria-hidden="true" focusable="false"><!-- trash icon --></svg>
</button>
```

```css
.c-button { display: inline-flex; align-items: center; gap: .5rem; border-radius: var(--radius-md); }
.c-button--primary { background: var(--color-action-primary); color: var(--color-on-primary); border: 1px solid transparent; }
.c-button--primary:hover  { background: var(--color-action-primary-hover); }
.c-button--primary:active { background: var(--color-action-primary-active); }
.c-button--primary:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 2px; }
.c-button--primary:disabled { opacity: .5; cursor: not-allowed; }
.c-button--danger { --color-action-primary: var(--color-danger); --color-action-primary-hover: var(--color-danger-hover); }
```

**CSP/offline verdict:** fully native HTML/CSS; the non-loading path needs **zero JS**. The `loading` prop needs a handful of vanilla-JS lines (toggle `disabled`/`aria-busy`/swap inner markup on submit) — no `eval`, fully CSP-safe.

### 4.10 Worked example — Dialog (full anatomy + slots + variants + states)

**Anatomy (parts, cross-checked against Radix Dialog and the APG Dialog (Modal) pattern):**

```
.c-dialog                — the <dialog> element itself; carries [open] natively
.c-dialog::backdrop       — native backdrop (or .c-dialog__overlay if not using <dialog>)
.c-dialog__content        — inner wrapper (needed if <form method="dialog"> also lives here)
.c-dialog__header         — title + close
.c-dialog__title          — REQUIRED — becomes the accessible name via aria-labelledby
.c-dialog__description    — OPTIONAL — becomes aria-describedby target; omit for complex body content (lists/tables) per APG
.c-dialog__close          — dismiss button
.c-dialog__body           — main content
.c-dialog__footer         — action buttons (≤2–3)
```

Sources: [Radix Dialog anatomy](https://www.radix-ui.com/primitives/docs/components/dialog), [APG Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

**Variants:**

| Axis | Values | What changes |
|---|---|---|
| `size` | `sm` \| `md` \| `lg` \| `fullscreen` | max-width/height, footer button layout |
| `purpose` | `informational` \| `confirmation` \| `form` \| `danger` | icon presence, action-button count/color, default dismissibility (mirrors Carbon's passive/transactional/danger/acknowledgment split — [Carbon Modal usage](https://carbondesignsystem.com/components/modal/usage/)) |

**Props:** `dismissibleByBackdrop` (boolean, default `true`; set `false` for destructive/data-loss dialogs — maps directly to the native `closedby` attribute), `initialFocus` (selector/ref).

**Required states:** closed, open, (opening/closing — ref B1 for the transition spec), internal `loading` (e.g. submitting a form inside), internal `invalid` (validation surfaced in the body).

**ARIA & focus management (verified against APG):**

| Requirement | Detail |
|---|---|
| Role | `dialog` (native `<dialog>` implies this) |
| Modality | `aria-modal="true"` — set automatically by `.showModal()` |
| Accessible name | `aria-labelledby` → the Title's `id` (or `aria-label` if no visible title) |
| Accessible description | `aria-describedby` → Description's `id`; **omit** if body has complex structure (lists/tables) — explicit APG guidance |
| Focus on open | move to a considered element, not "whatever is first": a static `tabindex="-1"` element for complex content; the title/first paragraph for long content (avoids scroll-jump); the *least destructive* option for destructive dialogs; a frequent default (e.g. "OK") for simple info dialogs |
| Focus on close | return to the triggering element, unless it no longer exists |
| Focus containment | Tab/Shift+Tab cycle within the dialog only, wrapping at both ends — automatic with `<dialog>` + `.showModal()` (rest of page becomes inert) |

**Keyboard map:**

| Key | Behavior |
|---|---|
| `Esc` | closes, per the `closedby` setting (`none` \| `closerequest` \| `any`) |
| `Tab` | next focusable inside the dialog; wraps to the first at the end |
| `Shift+Tab` | previous focusable inside the dialog; wraps to the last at the start |
| `Enter`/`Space` on Close | closes |

**Minimal markup — native `<dialog>` (recommended default for this tool's constraints):**

```html
<button type="button" data-dialog-open="confirm-delete">Delete account</button>

<dialog id="confirm-delete" class="c-dialog c-dialog--sm c-dialog--danger"
        closedby="any" aria-labelledby="confirm-delete-title" aria-describedby="confirm-delete-desc">
  <form method="dialog" class="c-dialog__content">
    <header class="c-dialog__header">
      <h2 id="confirm-delete-title" class="c-dialog__title">Delete account?</h2>
      <button type="submit" value="cancel" class="c-dialog__close" aria-label="Close">&times;</button>
    </header>
    <div class="c-dialog__body">
      <p id="confirm-delete-desc">This permanently deletes your account and cannot be undone.</p>
    </div>
    <footer class="c-dialog__footer">
      <button type="submit" value="cancel" class="c-button c-button--secondary" formnovalidate>Cancel</button>
      <button type="submit" value="confirm" class="c-button c-button--primary c-button--danger" autofocus>Delete</button>
    </footer>
  </form>
</dialog>

<script>
  document.querySelectorAll('[data-dialog-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.dialogOpen).showModal();
    });
  });
</script>
```

```css
.c-dialog { border: none; border-radius: var(--radius-lg); padding: 0; max-inline-size: 28rem; }
.c-dialog::backdrop { background: rgb(0 0 0 / 50%); }
/* animate per B1: transform/opacity + @starting-style, not layout properties */
```

**CSP/offline verdict:** native `<dialog>` is zero-`eval`, fully CSP-safe, with a built-in focus trap, `Esc`-to-close, top-layer stacking, and `aria-modal` — for roughly two lines of vanilla JS (`showModal()`). The `closedby="any"` light-dismiss (click outside to close) is **Chrome/Edge 134+ and Firefox 141+ only** as of this research; Safari does not yet support it, so a manual fallback is needed for full cross-browser backdrop-click dismissal:

```js
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close('cancel'); });
```

Esc-to-close and focus trapping via `.showModal()` work everywhere `<dialog>` is supported (Baseline since 2022), independent of `closedby`.

---

## 5. Options catalogue

### 5.1 Variant-vs-prop modelling

| Pattern | What | When | When NOT | Notes | Pitfalls |
|---|---|---|---|---|---|
| **Enum variant** | One named prop, closed set of mutually-exclusive values, each swaps multiple visual properties together | Distinct semantic/visual identity: Button emphasis, Badge tone, Dialog size | The values are actually combinable (see next row) | Model as a BEM modifier class or `data-variant` | Folding two orthogonal concerns into one enum → combinatorial explosion (`primary-danger`, `secondary-danger`, …) |
| **Orthogonal boolean/enum prop** | Independent modifier, combines freely with any variant value | `disabled`, `loading`, `size`, `fullWidth`, Button `tone=danger` | The dimension actually has hidden mutual exclusivity — then it's a variant in disguise | Multiple props can be set simultaneously without contradiction | Modelling something as a prop when real instances never combine it with other values (should have been a variant) |
| **Compound/derived variant** | A variant computed *from* two orthogonal props at the design-token layer (emphasis × tone → a final color) | System needs both axes to resolve to one flattened token lookup internally | Only one axis ever varies in practice | Keep the **API** as two props; flatten only at the CSS-variable/token layer | Exposing the flattened cross-product itself as the public API — reintroduces the explosion the axes were meant to avoid |
| **State (not a variant)** | Runtime/user/data-driven, expressed via native pseudo-class or `aria-*`/`data-state` | hover, focus, active, disabled, loading, selected, error | Never something a designer "picks" for a resting instance | Full definitions: B2 | Treating "error" as an author-selectable variant instead of a state that appears on validation failure |

### 5.2 Build-new vs. compose-existing

| Signal | Decision | Why |
|---|---|---|
| Interaction model (focus behavior, keyboard map, dismissal) already matches an APG pattern | **Compose** — implement that pattern's roles/keyboard map with your own visual skin | Re-deriving a keyboard map that APG has already solved is wasted effort and a fresh source of bugs |
| It's a positioning/timing variant of an existing composite (e.g., "menu that opens on hover instead of click") | **Compose** — reuse the Popover/Dropdown-menu internals, change only the trigger event | The hard part (positioning, focus, dismissal) doesn't change |
| Anatomy is a strict superset of existing composites (Command-palette = Dialog + Combobox-style input + List) | **Compose** the parts; don't hand-roll focus trapping or list navigation again | Each part already has a tested a11y story |
| No existing pattern's role set or keyboard map fits (genuinely novel manipulation — e.g., a custom canvas-based tool) | **Build new** — but budget real accessibility research; you now own a keyboard map nothing in APG covers | This is legitimately rare; most "new components" are recombination |
| The only difference from an existing composite is visual skin | **Compose** — this is a styling task, not a new component | Building "new" here duplicates behavior code for zero interaction benefit |

### 5.3 Headless/primitive component libraries (reference set — for React-based tooling; the target deliverable itself should default to native HTML per §4.8)

| Library | What | Licence | When to use | When NOT | Pitfalls |
|---|---|---|---|---|---|
| **Radix Primitives** | ~30 unstyled React primitives, `data-state`-driven | **MIT** (© WorkOS) ([licence](https://github.com/radix-ui/primitives/blob/main/LICENSE)) | React build needing Dialog/DropdownMenu/Select/Tabs/Accordion/Toast/Tooltip/Popover with APG-conformant a11y out of the box | Non-React or plain-HTML single-file target | No built-in Combobox; React-only |
| **React Aria** (Adobe) | Headless hooks; very deep APG coverage incl. Combobox, DatePicker, Calendar | **Apache 2.0** | React builds needing the widest pattern coverage, including date/calendar | Non-React target | Hooks-based API is a steeper learning curve than styled parts |
| **Base UI** (Radix + MUI teams) | Successor-generation unstyled React primitives | **MIT** | New React projects wanting a Radix-like API, actively developed | Non-React target | Newer/smaller component set at time of writing — verify current coverage |
| **Ariakit** | Headless React primitives, similar scope to Radix | **MIT** | Alternative to Radix, e.g. for Combobox/Command coverage | Non-React target | Smaller ecosystem/community than Radix |
| **cmdk** | Command-palette / list component (Cmd+K pattern), wraps Radix Dialog for the modal variant | **MIT** ([licence](https://github.com/pacocoursey/cmdk)) | Any React build needing a command palette | Non-React target; >2–3k items need external virtualization (none built in) | Client-side filtering by default |
| **Vaul** | Drawer / bottom-sheet with drag physics and snap points | **MIT** (© Emil Kowalski) ([licence](https://github.com/emilkowalski/vaul/blob/main/LICENSE.md)) | React build needing a mobile-style bottom sheet | Non-React target; desktop-only side drawers (a plain Dialog variant suffices) | React-only |
| **Native HTML** (`<dialog>`, `popover`, `<details name>`, `<select>`) | Platform primitives, zero dependency | Web platform — no licence needed | **This tool's actual target**: strict-CSP, single self-contained HTML file, no `eval`, no framework | Rich Combobox/DatePicker/Command-palette behavior beyond what native elements alone provide — must hand-build per APG | Newest bits (`closedby`, customizable `<select>`) have real cross-browser gaps — verify at build time; hand-building means you own the APG-conformant keyboard map |

---

## 6. Failure modes

| Failure | Detect | Fix |
|---|---|---|
| Variant/prop conflation → combinatorial explosion | Component has 10+ mutually-exclusive boolean props, or a variant enum with 15+ values | Split into orthogonal axes (emphasis × tone, §4.9); flatten only at the token layer (§5.1) |
| Missing accessible name on an icon-only control | Screen reader announces "button" with no label; automated a11y audit flags it | Add `aria-label`/`aria-labelledby`; never rely on tooltip alone (Rule 12) |
| Tooltip carries essential or interactive content | Content only reachable on hover; gone on touch; unreachable by screen reader | Move essential content to always-visible text, or use an interactive, touch-reachable Popover instead |
| `role="menu"` used for a form or long-form popup | Typing in a text field inside the menu breaks (menu expects command items + type-ahead) | Swap to Popover/Dialog; `menu` role is for action lists only (APG Menu Button) |
| Custom widget re-implements native behavior worse | Custom `<div>` dropdown with no keyboard support; Space doesn't activate a `<div role="button">` | Prefer the native element (Rule 8); if custom is unavoidable, implement the *full* APG keyboard map, not a partial one |
| One-off accordion code per instance | Different accordions on the same product respond to different keys / expose different ARIA | Standardize on one implementation, ideally native `<details>`/`<summary>` ± `name` grouping, reused everywhere |
| Single toggle mislabeled/built as "Accordion" | A lone show/hide control carries accordion-group semantics it doesn't need | Use the simpler Disclosure pattern (button + `aria-expanded` + content) for standalone toggles |
| Dialog opened with no initial-focus decision | Focus lands on whatever is first in the DOM (often the close ✕), with no rationale | Set focus deliberately per APG's content-based decision tree (§4.10) |
| Dialog dismissible by backdrop click on a destructive/data-loss action | Accidental outside click discards unsaved input or confirms a destructive action | Set non-light-dismiss (`closedby="none"`/`false`) for destructive or data-entry dialogs; require an explicit button |
| Combobox breaks screen-reader tracking | Arrow-key navigation moves real DOM focus into options; the input loses focus and typing stops working | Use the `aria-activedescendant` pattern — DOM focus stays on the input; a data-attribute marks the active option (APG Combobox) |
| Toast used for must-read/must-act content | A critical error message auto-dismisses before the user finishes reading it | Use a persistent inline Banner instead; reserve Toast for transient, non-critical confirmation |
| Badge used as an interactive filter | A passive Badge gains an onclick and a remove (×), colliding with Tag/Chip's job | Rebuild as Tag/Chip (§4.5); Badge stays non-interactive |
| Segmented control spans unrelated content | Users expect peer views of the *same* data; instead it swaps to unrelated sections, disorienting navigation | Swap to Tabs (Carbon's own guidance, §4.3) |
| Pagination used for a linear/sequential flow | Users can jump straight to "step 5" of a wizard, skipping required steps | Swap to Stepper, which gates on completion |
| Breadcrumb wraps to a second line | Visual QA at a narrow viewport shows two lines | Truncate middle items behind an overflow/ellipsis affordance instead of wrapping (Carbon) |
| State-layer styling drifts per component (one-off hex overlays) | Visual QA shows inconsistent hover darkness across Button/Tag/List-item | Centralize state-layer opacity as tokens (§4.6) applied uniformly; full ramp ownership is C2 |
| `closedby`/light-dismiss assumed to work everywhere | Backdrop click fails to close the dialog in Safari (unsupported there as of this research) | Add the manual backdrop-click fallback shown in §4.10 until support is universal — re-verify at build time |

---

## 7. Pre-flight checklist (run before shipping any component spec)

- [ ] The component is classified as primitive, composite, or surface using the reuse-shape test (§4.1), not by "how complex it feels."
- [ ] Anatomy is named and diagrammed **before** any prop exists (Rule 5); every part follows the naming convention (§4.6).
- [ ] Variant axes are orthogonal — no mutually-combinable concepts folded into one enum (Rule 2/3, §5.1).
- [ ] Every variant states exactly what visual properties it changes.
- [ ] Required-state floor is met: hover, focus-visible, active, disabled at minimum; loading/error/selected added where applicable (Rule 11).
- [ ] No state is modelled as a variant, and no variant is modelled as a state (Rule 4).
- [ ] Icon-only instances have a programmatic accessible name, not just a tooltip (Rule 12).
- [ ] The attribute driving visual state and the attribute driving accessibility state are the same one, or provably kept in sync (Rule 13).
- [ ] Every anchored/overlay composite has a documented position, alignment, offset, and collision behavior (Rule 9).
- [ ] The component maps to a known APG pattern where one exists; if it doesn't, that's been confirmed deliberately, not by omission (§5.2).
- [ ] Native HTML mechanism considered first (`<dialog>`, `popover`, `<details name>`, `<select>`) before a scripted equivalent (Rule 8, §4.8); the CSP/offline verdict is stated.
- [ ] A minimal working markup skeleton exists and has been checked against the six rebuild-fidelity requirements (Rule 14).
- [ ] Cross-system naming has been resolved once for this concept, not re-litigated per instance (§4.5).
- [ ] Keyboard map is complete, not just "the common keys" (Tab/Shift+Tab wrap behavior, Home/End where APG specifies them, Esc where dismissal applies).
- [ ] Light and dark are both accounted for in the token references used (no hstudio-only hardcoded colors in the markup/CSS skeleton).

---

## 8. Open questions / unverified

- **Material 3's exact state-layer opacity tokens** could not be freshly fetched (`m3.material.io` is JS-rendered). This report anchors on MDC-Web's source-verified values (§4.6) and flags the commonly-cited M3 simplification (hover ≈8%/focus & press ≈10%/dragged ≈16%) as **not independently re-verified this session** — re-check the live token export at build time if exact M3 fidelity matters.
- **Shopify Polaris React is archived** (GitHub repository archived **6 Jan 2026**) in favor of **Polaris Web Components**. This report cites Polaris React's documented UX/anatomy guidance throughout because it remains the most detailed public description of the interaction patterns as of this research, but any implementation-level API reference should move to Polaris Web Components; that library's public component-level anatomy documentation is comparatively thin as of this research and should be re-surveyed before relying on it further. ([Polaris React licence/archive notice](https://github.com/Shopify/polaris-react/blob/main/LICENSE.md), [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components))
- **`closedby` (dialog) and customizable `<select>` are both fast-moving, Chromium-first proposals.** Exact cross-browser support must be re-checked at build time (caniuse); numbers in §4.8 are dated to this research session.
- **APG has no canonical Date Picker pattern.** The Dialog + Grid combination documented in §4.3 is this report's best-practice assembly from adjacent APG patterns, not a ratified single APG page — treat date-picker a11y as requiring more manual verification than most other composites in this inventory.
- **Material 3's Chip sub-type taxonomy** (assist/filter/input/suggestion) was drawn from search-result snippets and secondary sources, not a fully fetched primary M3 page (JS-rendered) — treat this 4-way split as commonly cited but re-verify against `m3.material.io/components/chips` directly.
- **Open UI's cross-system naming research pages** (e.g., Select) are explicitly framed by Open UI itself as ongoing *research*, not a ratified recommendation — treat Open UI citations in §4.5 as "current thinking under active development," not a settled standard.
- **Carbon's 7-step Button size scale** (2xs–2xl) and Polaris's 4-step scale (micro/slim/medium/large) are product-specific outliers; this report recommends a 3-step floor (sm/md/lg) as the general-purpose default (§4.9) — the "right" number of sizes for a general tool remains a judgment call, not something either primary source settles.
- **Native `<select>` customization (`appearance: base-select`) is not yet a safe cross-browser default** — until Firefox/Safari ship it, this report treats the hand-built Select/Combobox per APG as the reliable path and the native customizable select as a progressive enhancement, not the baseline.

---

## 9. Sources

Primary / authoritative:
- [W3C WAI-ARIA Authoring Practices Guide — Patterns index](https://www.w3.org/WAI/ARIA/apg/patterns/) — canonical pattern list.
- [APG — Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); [APG — Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/); [APG — Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/); [APG — Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/); [APG — Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/); [APG — Alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/); [APG — Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/); [APG — Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/); [APG — Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/); [APG — Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).
- [Radix Primitives — Components](https://www.radix-ui.com/primitives/docs/components); component-level docs for [Dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu), [Select](https://www.radix-ui.com/primitives/docs/components/select), [Toast](https://www.radix-ui.com/primitives/docs/components/toast), [Popover](https://www.radix-ui.com/primitives/docs/components/popover), [Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip), [Tabs](https://www.radix-ui.com/primitives/docs/components/tabs), [Accordion](https://www.radix-ui.com/primitives/docs/components/accordion), [Avatar](https://www.radix-ui.com/primitives/docs/components/avatar), [Slider](https://www.radix-ui.com/primitives/docs/components/slider), [Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox), [Radio Group](https://www.radix-ui.com/primitives/docs/components/radio-group), [Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group); [licence](https://github.com/radix-ui/primitives/blob/main/LICENSE).
- IBM Carbon Design System: [Button](https://carbondesignsystem.com/components/button/usage/), [Modal](https://carbondesignsystem.com/components/modal/usage/), [Notification](https://carbondesignsystem.com/components/notification/usage/), [Tag](https://carbondesignsystem.com/components/tag/usage/), [Content Switcher](https://carbondesignsystem.com/components/content-switcher/usage/), [Progress Indicator](https://carbondesignsystem.com/components/progress-indicator/usage/), [Breadcrumb](https://carbondesignsystem.com/components/breadcrumb/usage/), [Pagination](https://carbondesignsystem.com/components/pagination/usage/), [Components overview](https://carbondesignsystem.com/components/overview/components/), [UI Shell](https://carbondesignsystem.com/components/UI-shell-header/usage/); licence: [Apache 2.0](https://github.com/carbon-design-system/carbon/blob/main/LICENSE).
- Shopify Polaris: [Button](https://polaris-react.shopify.com/components/actions/button), [Banner](https://polaris-react.shopify.com/components/feedback-indicators/banner), [Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state), [Date picker](https://polaris-react.shopify.com/components/selection-and-input/date-picker), [Components index](https://polaris-react.shopify.com/components); [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components) (current successor); licence/archive status: [Polaris React LICENSE.md](https://github.com/Shopify/polaris-react/blob/main/LICENSE.md).
- Open UI: [Select naming research](https://open-ui.org/components/select.research/), [Customizable select explainer](https://open-ui.org/components/customizable-select.explainer/).
- Material Design / MDC Web: [`_ripple-theme.scss` source](https://github.com/material-components/material-components-web/blob/master/packages/mdc-ripple/_ripple-theme.scss) (state-layer opacities, source-verified).
- [MDN — `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog); [MDN — Popover API: Using](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using); [web.dev — Popover reaches Baseline](https://web.dev/blog/popover-baseline); [Chrome for Developers — Exclusive accordion](https://developer.chrome.com/docs/css-ui/exclusive-accordion); [caniuse — dialog `closedby`](https://caniuse.com/mdn-html_elements_dialog_closedby).

Reference / secondary:
- Nathan Curtis (EightShapes): [Crafting Component API, Together](https://medium.com/eightshapes-llc/crafting-ui-component-api-together-81946d140371); [Subcomponents](https://medium.com/eightshapes-llc/subcomponents-753ce9f6600a).
- [Brad Frost — Atomic Design, Chapter 2](https://atomicdesign.bradfrost.com/chapter-2/) — taxonomy framing.
- [Adobe Spectrum Design Data — interaction states registry](https://opensource.adobe.com/spectrum-design-data/registry/states) ([repo](https://github.com/adobe/spectrum-design-data), Apache-2.0 family) — cross-system canonical state list (default/hover/active/focus/keyboard-focus/disabled/down/pending/selected/drag-and-drop).
- [eBay Playbook — Interaction states](https://playbook.ebay.com/foundations/interaction-states) — supplementary state-opacity reference.

Licences (verified from source):
- [Radix Primitives — MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE) (© WorkOS).
- [IBM Carbon — Apache License 2.0](https://github.com/carbon-design-system/carbon/blob/main/LICENSE).
- [Shopify Polaris React — MIT](https://github.com/Shopify/polaris-react/blob/main/LICENSE.md) (© Shopify Inc.; repository archived 6 Jan 2026).
- [cmdk — MIT](https://github.com/pacocoursey/cmdk).
- [Vaul — MIT](https://github.com/emilkowalski/vaul/blob/main/LICENSE.md) (© Emil Kowalski).
- Adobe React Spectrum / Spectrum Web Components / Spectrum CSS — Apache 2.0 (ecosystem-wide, per Adobe's public repositories).
