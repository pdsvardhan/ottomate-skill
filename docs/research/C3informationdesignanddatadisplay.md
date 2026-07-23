# C3 — Information design & data display

*Design-intelligence reference. Track C3 of the registry research map. Written to be read by the design agent before it renders any table, chart, dashboard, or dense list, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns **how data is displayed and scanned**: dense data tables (density, alignment, sticky headers/columns, sorting, row actions), numerals inside data, charts (type selection, encoding, axes, legends, series colour count, sparklines, accessibility), dashboards and stat tiles, dense list/feed patterns, empty/loading/error/skeleton states *for data*, pagination vs infinite scroll vs load-more, filtering and faceting, and scanning behaviour/hierarchy on data-dense screens.

## 2. Boundary (what this track does **not** cover)

- **Generic page layout and grid systems** (columns, breakpoints, spacing scale) → **A3 Layout & grids**. C3 says a table needs a sticky header at 0; A3 says how the surrounding page grid is built.
- **The colour math / building the series palette** (colour-blind-safe hue selection, contrast formulas, sequential/diverging ramps) → **A1 Colour**. C3 says *how many series maximum* and *which channel to encode with*; A1 builds the actual swatches.
- **Numeral typography as a font feature** (which typeface has tabular figures, how to load/toggle the OpenType feature system-wide) → **A2 Typography**. C3 says *right-align numerics and use tabular figures*; A2 owns the feature/font mechanics.
- **State *visuals*** — skeleton shimmer design, spinner construction, animation of the loading indicator itself → **B2 Interaction states & affordance**. C3 says *when* to show a skeleton vs spinner vs empty state for data and what shape it should match; B2 designs the shimmer/spinner asset.
- **Motion/transition timing** (how a row expands, how a value counts up, how a chart draws in) → **B1 Motion & animation systems**. C3 defines the static end-states; B1 defines how you get there.
- **Chart accessibility *conformance testing*** (axe-core runs, WCAG audit tooling, contrast-checker software) → **A5 Accessibility**. C3 states the *design* requirements (alt-text formula, data-table fallback, 3:1 non-text contrast) inline because they're load-bearing for chart construction; A5 owns the verification/tooling layer.
- **The single-file no-network feasibility matrix across rendering techniques** (SVG vs Canvas vs WebGL trade-offs at a platform level) → **H2 Feasibility**. C3 gives the chart-specific CSP/offline verdict inline; H2 is the consolidated cross-track matrix.

---

## 3. Executive rules (apply these before laying out any data screen)

1. **Pick row height from a three-band ladder, not a guess.** Compact **32px** (dense ops/admin grids, power users), default **40–48px** (general product tables), relaxed **56px** (marketing-adjacent, touch-first, or rows carrying a secondary line of text). Carbon Design System's own row-height scale (24/32/40/48/64px for xs/sm/md/lg/xl) and Ant Design's padding-driven rows (8px→~36px, 12px→~44px, 16px→~52px) land in the same three bands — treat 32/40–48/56 as the safe, cross-validated defaults. ([Carbon data table style](https://carbondesignsystem.com/components/data-table/style/), [Ant Design Table](https://ant.design/components/table/))
2. **Right-align every numeric column; left-align every text column; use tabular (lining) figures.** Misaligned numbers can't be compared by magnitude at a glance — right alignment lets digit-place line up. Apply `font-variant-numeric: tabular-nums` (OpenType `tnum`) so every digit occupies equal width and columns of numbers don't jitter row to row. ([MDN font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)) — the font/feature-loading mechanics are A2's; this rule is the *display* rule.
3. **Sticky header is close to mandatory past one viewport of rows; sticky first column is conditional.** Freeze the header (`position: sticky; top: 0`) on any table whose rows exceed the viewport — NN/g lists this under the "compare data" task explicitly. Freeze the *first column* only when it's the row's human-readable identifier **and** the table is wider than the viewport (horizontal scroll) — otherwise it just wastes width. ([NN/g Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/))
4. **Sortable columns get a visible chevron affordance, one active `aria-sort` at a time, and a non-color signal.** Hollow/outline chevron when unsorted, filled + directional when sorted; never rely on colour alone to show sort state (WCAG 1.4.1). Set `aria-sort="ascending"|"descending"` on the active `<th>` only — never on more than one column simultaneously — and give screen-reader users a text cue (caption instructions or `aria-describedby`), because the icon alone isn't announced and live-region behaviour for sort-state changes is inconsistent across JAWS/NVDA/VoiceOver. ([Adrian Roselli, Sortable Table Columns](https://adrianroselli.com/2021/04/sortable-table-columns.html))
5. **Default sort by what users look for, not alphabetically.** Pick the column and direction that matches the most common query (most recent first, highest value first, most urgent first) — alphabetical-by-default is a cop-out that serves no real task. ([Data Table UX: 5 Rules of Thumb](https://mannhowie.com/data-table-ux))
6. **Row actions: 1–2 inline, 3+ behind an overflow menu; every hover-revealed control needs a keyboard/touch equivalent and a ≥24×24px hit target.** Hover-only reveal fails keyboard users (WCAG 2.1.1) and doesn't exist on touch — show actions on `:focus-within` too, or make them persistently visible at compact/touch breakpoints. Minimum target size is **24×24 CSS px** (WCAG 2.2 SC 2.5.8, AA, with spacing/inline/equivalent exceptions); **40–44px** is the comfortable touch target if the row height allows it. ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [BoIA: Hover Actions & Accessibility](https://www.boia.org/blog/hover-actions-and-accessibility-addressing-a-common-wcag-violation))
7. **Zebra striping is a preference, not a proven accuracy or speed win — hairline dividers (1px, ~8–12% opacity) are the safer default.** A controlled 244-participant study found no statistically significant accuracy difference between striped and plain tables, and inconsistent speed effects; striping *was* preferred aesthetically (46% vs 33% no-preference). Treat zebra as a stylistic choice layered on top of — never a substitute for — sticky headers, hover-row highlight, or a sticky identifying column. ([A List Apart: Zebra Striping — Does it Really Help?](https://alistapart.com/article/zebrastripingdoesithelp/))
8. **Choose chart type from the data *question*, not the data *shape*.** Comparison → bar/column. Trend over time → line/area. Part-to-whole → stacked bar (pie only ≤ 4 slices, never a donut when precise comparison matters). Correlation → scatter. Distribution → histogram/box/violin. Ranking → ordered bar. Deviation from a reference → diverging bar. Single KPI at a glance → stat tile + sparkline. Full matrix in §5.1. ([FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md), [Datawrapper: a friendly guide to choosing a chart type](https://www.datawrapper.de/blog/chart-types-guide))
9. **Encode the most important comparison with the highest-accuracy perceptual channel.** Cleveland & McGill's ranking (extended by Mackinlay and synthesized by Munzner) orders quantitative-judgment accuracy: **position > length > angle/slope > area > volume > colour saturation/luminance > colour hue (categorical) > texture/density**. Precise numeric comparison → position or length (bar/dot/line). Rough magnitude or a third dimension → area (bubble). Category identity, not magnitude → hue, and keep it to a small palette (Munzner: categorical hue distinguishability drops past ~8 colours). ([Cleveland & McGill via Mackinlay, ranking](https://courses.ischool.berkeley.edu/i213/s99/Lectures/Lecture7/tsld048.htm), [Munzner channel-effectiveness lecture notes](https://teaching.vda.univie.ac.at/vis/23s/LectureNotes/04_visual_encoding_principles.pdf))
10. **Cap series at 5–7 before a chart becomes unreadable; prefer direct labels over a legend.** Practitioner consensus converges around "get nervous past 4 categorical colours," "5 overlapping lines is the threshold of non-readability," with 10 workable only with interactivity/highlighting and never in a "live" dashboard. Direct-label chart elements at their endpoint/peak instead of forcing a legend lookup — legends cost the reader a memorize-then-cross-reference step. Fall back to a legend only when direct labels collide, and beyond ~7 series switch to small multiples (identical small charts, one per series, same scale) rather than cramming one chart. ([Data Revelations: How Many Lines Are Too Many?](https://www.datarevelations.com/how-many-lines-are-too-many-lines/), [Practical Reporting: Avoid legends whenever possible](https://www.practicalreporting.com/blog/2024/9/17/avoid-legends-footnotes-and-other-forms-of-indirect-labeling-in-your-charts-whenever-possible), [Tufte/Wikipedia: small multiples](https://en.wikipedia.org/wiki/Small_multiple))
11. **Bar/column charts start at zero, always; line charts may not, but only with a disclosed, deliberate reason.** A non-zero bar baseline distorts length-based comparison (a 13% real increase can visually read as a 460% increase) — never truncate a bar/column axis. Line charts encode by position/slope rather than length, so a non-zero baseline is defensible *only* when zero is arbitrary (temperature) or when zero-baselining would hide a small-but-critical change (vital signs, intraday price) — and it must be visually flagged (axis break mark, annotated range), never silent. ([Storytelling with Data: Bar charts must have a zero baseline](https://www.storytellingwithdata.com/blog/2012/09/bar-charts-must-have-zero-baseline), [Chad Skelton: should line charts start at zero](https://www.chadskelton.com/2018/06/bar-charts-should-always-start-at-zero.html))
12. **Sparklines are word-sized trend indicators, not precise-read charts — always pair one with an exact number.** Keep them roughly line-height to 2–3× line-height tall, banked so the dominant slope reads near 45° (Cleveland's banking-to-45° principle, as applied by Tufte), mark the last value with a dot tied to the adjacent number, and use colour sparingly (a routine/attention flag, never a full stoplight system). ([Tufte, Sparkline Theory and Practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/))
13. **Dashboard hierarchy: the single most important metric goes top-left; the whole primary view should need zero scrolling.** Eyes hit top-left first under F-pattern/Z-pattern scanning — put the number that answers "are we OK?" there. Stephen Few's core dashboard definition requires everything fit on one screen "so it can be monitored at a glance" — if the metric set doesn't fit, split into a no-scroll **overview** plus a scrollable **detail** view rather than silently letting the overview scroll. Every number needs comparison context (target, trend, prior period) — a number alone is not a KPI. ([Few, Information Dashboard Design overview](https://blogs.ischool.berkeley.edu/i247s12/files/2012/01/Dashboard-Design-Overview-Presentation.pdf), [NN/g F-Shaped Pattern of Reading](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/))
14. **Pick the load pattern by task, not by taste: countable/findable → pagination; low-commitment exploratory feed → infinite scroll (with caveats); ambiguous middle ground → load-more.** Users who need to find a specific item, compare items far apart, reach a footer, or return to a known position need numbered pagination or at least page landmarks. Homogeneous low-goal browsing (social/news/image feeds) is the only good fit for pure infinite scroll — and even then it needs a `role="feed"` pattern, a way to reach the footer, and a documented accessibility fallback. Load-more is the load-bearing middle: it keeps a manual pause point, preserves footer access, and accommodates low-bandwidth users at the cost of one extra click. Full decision table in §5.3. ([NN/g Infinite Scrolling: When to Use It](https://www.nngroup.com/articles/infinite-scrolling-tips/), [Deque: Infinite Scrolling & role=feed](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/))
15. **Every data state — loading, empty, and error — must look different from each other and never look like "genuinely zero rows."** Loading = skeleton shaped like the real content (same row/tile count, same column widths), shown only past the ~300–500ms threshold (see B1/B2). Empty = explain *why* nothing is there (system status) plus one concrete next action — never a silent blank table. Error = state what failed plus a retry action. A table that goes blank without one of these three explicit treatments is a defect users will read as "broken" or "no data exists," even when the truth is "still loading" or "your filters excluded everything." ([NN/g: Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/))

---

## 4. Body

### 4.1 Tables — density and the row-height ladder

Row height is the single number that determines how much of a table's data a screen can show at once, and it trades directly against scanability and touch usability.

| Density | Row height | Vertical padding (approx.) | Use for | Font size |
|---|---|---|---|---|
| **Compact** | **32px** | ~6–8px | Dense ops/admin grids, logs, finance/trading screens, power users who scan hundreds of rows | 12–13px |
| **Default** | **40–48px** | ~10–14px | General product tables — the safe default for most SaaS/admin UI | 13–14px |
| **Relaxed** | **56px** | ~16px+ | Touch-first surfaces, rows with a secondary text line (subtitle/meta), marketing-adjacent tables | 14–16px |

Cross-validated against two open design systems: **Carbon** ships an explicit xs/sm/md/lg/xl row scale of **24/32/40/48/64px** ([Carbon data table style](https://carbondesignsystem.com/components/data-table/style/)); **Ant Design**'s three densities (`large`/`middle`/`small`) use 16px/12px/8px vertical cell padding which, added to a 14px line-height, lands at roughly 52/44/36px ([Ant Design Table](https://ant.design/components/table/)) — both straddle the compact/default/relaxed bands above. **Never mix densities within one table**; if a screen needs both a scan mode and a detail mode, make density a user toggle (persist the choice), not a per-row inconsistency.

**Column ordering and identity.** Use a **human-readable identifier** (name, title, order number as shown to the user) in the first column — never a raw database/UUID key, which forces the user to cross-reference elsewhere to even find the row they want. Order remaining columns by importance and keep related fields adjacent so comparison doesn't require eye travel across the table. ([NN/g Data Tables](https://www.nngroup.com/articles/data-tables/), [mannhowie.com](https://mannhowie.com/data-table-ux))

### 4.2 Alignment, sticky structures, and dividers

| Element | Rule | Number |
|---|---|---|
| Text columns | Left-align | — |
| Numeric columns | Right-align, tabular figures | `font-variant-numeric: tabular-nums` |
| Currency/negative numbers | Right-align; align the decimal point; use parentheses or a leading minus **consistently** — never mix `-` and `()` in one table | — |
| Short categorical/status columns (badges, icons) | Center-align | — |
| Sticky header | `position: sticky; top: 0` once rows exceed viewport height | Add a 1px border or subtle shadow on scroll so it visually separates from body |
| Sticky first column | Only when it's the row identifier *and* the table scrolls horizontally | Add a hard divider/shadow at the freeze line so users notice the seam |
| Row divider (default) | Hairline, 1px, ~8–12% opacity — no proven accuracy/speed benefit to zebra over hairline | See rule 7 |
| Row divider (zebra, optional) | Alternate row background at ~3–5% tint if used — a stylistic layer, not a substitute for sticky/hover aids | [A List Apart study](https://alistapart.com/article/zebrastripingdoesithelp/) |
| Row hover highlight | Full-row background shift on `:hover`/`:focus-within` — helps users keep their place across wide tables regardless of zebra | — |

**Numerals inside data (brief — full typographic treatment is A2's).** The display-layer rule for this track is: **right-align + tabular figures**, always. Never left-align a number column, never use proportional (variable-width) figures in a table users are meant to scan vertically for magnitude, and keep decimal precision *consistent down the column* (all values to the same number of decimal places) so the eye can compare place-value directly.

### 4.3 Sorting affordance

| State | Icon | `aria-sort` on `<th>` | Notes |
|---|---|---|---|
| Unsorted, sortable | Hollow/outline double-chevron (▲▼), low-contrast | Omitted (preferred over `"none"`) | Still keyboard-focusable/actionable |
| Sorted ascending | Filled single chevron pointing up | `ascending` | Only one column at a time |
| Sorted descending | Filled single chevron pointing down | `descending` | Only one column at a time |
| Custom/non-standard sort | — | `other` | Rare; document the behaviour in a caption |

Never encode sort state by colour alone (WCAG 1.4.1). Screen-reader announcement of sort-state *changes* is inconsistent across engines (JAWS announces promptly; NVDA/VoiceOver may not without an `aria-live` region) — test on your actual target readers rather than assuming `aria-sort` alone is sufficient feedback. Avoid `aria-label` for sort hint text specifically because it's the attribute most often dropped during localization. ([Adrian Roselli, Sortable Table Columns](https://adrianroselli.com/2021/04/sortable-table-columns.html))

### 4.4 Row actions

| Pattern | When | Target size | Discoverability |
|---|---|---|---|
| Inline icon button(s), 1–2 max | Frequent, low-risk actions (edit, favorite) | ≥24×24px min (WCAG 2.5.8 AA), 40–44px comfortable | Reveal on `:hover` **and** `:focus-within`; persistent at touch breakpoints |
| Overflow ("⋯") menu | 3+ actions, or any destructive action that shouldn't be one accidental tap away | ≥24×24px trigger | Always visible (don't hide the *trigger* on hover — only the menu contents) |
| Row checkbox + bulk toolbar | Multi-record actions (delete, export, tag) | Checkbox ≥24×24px hit area even if the visible box is smaller | Toolbar appears above/below table on selection; include "select all" |
| Click-anywhere-on-row (navigate) | Row's primary purpose is "open this record" | Whole row | Must remain keyboard-operable (`<a>`-wrapped row or `tabindex`+`Enter` handler); don't combine with inline action buttons that would double-fire |

Hover-revealed controls fail two WCAG criteria if not handled: **2.1.1 Keyboard** (must be reachable without a pointer) and **1.4.13 Content on Hover or Focus** (if the reveal is a rich popover, it must be dismissible/persistent/hoverable). Fix: mirror every `:hover` reveal with `:focus-within` or `:focus-visible`, and default to persistently visible actions at any touch-primary breakpoint (`@media (hover: none)`). ([BoIA: Hover Actions & Accessibility](https://www.boia.org/blog/hover-actions-and-accessibility-addressing-a-common-wcag-violation))

### 4.5 The four table user-tasks (design to these, not to "a table")

NN/g frames every data table around four tasks; design decisions should trace back to one of them. ([NN/g Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/))

| Task | What it needs |
|---|---|
| **1. Find records matching criteria** | Human-readable identifying column; filters that are discoverable with a visible "filters active" state; default sort matching the most common query (not alphabetical) |
| **2. Compare data across records/columns** | Sticky header + optional sticky identity column; hairline dividers or row-hover highlight to keep place; column show/hide and reorder with a non-drag-only mechanism; multi-column sort where the domain needs it |
| **3. View/edit/add a single record's full data** | Pick one: in-place edit (only works for narrow tables), modal (focused, but hides neighboring rows for reference), non-modal side panel (keeps table visible, covers partial content), accordion expansion (nothing hidden, but rows below become hard to reach and users rarely re-collapse them) |
| **4. Take action on records** | 1–2 actions inline; 3+ behind overflow; batch actions via row checkboxes + toolbar + "select all" |

### 4.6 Chart type selection — the perceptual foundation

**The accuracy ranking (Cleveland & McGill 1984, extended by Mackinlay, synthesized by Munzner).** Quantitative-judgment tasks, most to least accurate:

| Rank | Channel | Use for |
|---|---|---|
| 1 | **Position** (common scale) | The gold standard — dot plots, bar/column baselines, scatterplot coordinates |
| 2 | **Length** | Bar/column height, error bars |
| 3 | **Angle / slope** | Line-chart trend reading, pie-chart wedges (weak — see §5.1) |
| 4 | **Area** | Bubble size, treemap tiles — rough magnitude only |
| 5 | **Volume / 3D size** | Avoid in 2D UI entirely — depth is not perceivable in flat charts |
| 6 | **Colour saturation / luminance** | Choropleth intensity, heatmap cells — ordered/sequential data |
| 7 | **Colour hue** | Categorical identity only, not magnitude — legibly distinguishable to **~8 hues max** (Munzner) |
| 8 | **Texture / density / curvature** | Last resort, rarely legible at UI sizes |

Sources: [Cleveland & McGill ranking via Mackinlay](https://courses.ischool.berkeley.edu/i213/s99/Lectures/Lecture7/tsld048.htm); [Munzner channel-effectiveness synthesis](https://teaching.vda.univie.ac.at/vis/23s/LectureNotes/04_visual_encoding_principles.pdf). **Decision rule:** put your chart's *primary* comparison on the highest-ranked channel it can afford; use lower-ranked channels only for secondary/contextual dimensions.

**The nine intents (FT Visual Vocabulary taxonomy)** — deviation, correlation, ranking, distribution, change-over-time, part-to-whole, magnitude, spatial, flow — map to chart families in the full matrix at **§5.1**. Always start from "what question is this chart answering?", not "what data type do I have?" — the same table of numbers can support a bar chart (magnitude), a line chart (change over time), or a scatter (correlation) depending on the question.

### 4.7 Encoding, axes, and legends

| Question | Rule | Number |
|---|---|---|
| Does the axis start at zero? | Bar/column: **always**. Line: only with a disclosed reason (arbitrary zero, or hiding a small-but-critical change) and a visible break/annotation | — |
| How many series before I need a legend at all? | Prefer direct end-of-line/top-of-bar labels up to ~4 series; a legend becomes acceptable, not required, past that if direct labels would collide | ≤4 direct-labeled |
| How many series before the chart is unreadable? | Hard ceiling before switching strategy | **5–7**; beyond that use small multiples or a "highlight one, gray the rest" interaction |
| Do I need axis labels/gridlines? | Titles + direct/annotated labels usually suffice; keep the y-axis label only when the unit isn't obvious from the title; keep the x-axis label for time series where the cadence (year/quarter/day) isn't self-evident | — |
| Pie chart slice count | Datawrapper Academy: **4 max** for genuine readability; never a donut when the reader must compare two similar-sized slices precisely | ≤4 |
| Legend vs direct label | Legend forces a memorize-then-cross-reference step; direct labeling removes it. Use a legend only when direct labels would visually collide | — |

Sources: [Datawrapper: choosing a chart type](https://www.datawrapper.de/blog/chart-types-guide), [Datawrapper: pie chart guidance](https://www.datawrapper.de/academy/what-to-consider-when-creating-a-pie-chart), [Datawrapper: why many charts skip axis labels](https://academy.datawrapper.de/article/239-why-datawrapper-does-not-include-axis-labels-for-many-charts), [Practical Reporting: avoid legends](https://www.practicalreporting.com/blog/2024/9/17/avoid-legends-footnotes-and-other-forms-of-indirect-labeling-in-your-charts-whenever-possible).

**Scatterplot overplotting.** Past a few hundred points, overlapping markers stop conveying density honestly. Mitigate with (in order of implementation cost in a hand-built SVG/Canvas context): (1) lower marker opacity (0.3–0.5 alpha) so overlap reads as darker, (2) small random jitter on categorical/discretized axes to separate coincident points, (3) binning into a 2D histogram/hexbin grid coloured by count once point count is too high for either of the above to help. ([ggplot2 book: dealing with overplotting](https://r4ds.github.io/bookclub-ggplot2/dealing-with-overplotting.html), [Hexagonal Binning Plot guide](https://www.visualizing.org/hexbin-plot))

**Histogram bin count.** Sturges' rule — `k = ⌈log₂(n)⌉ + 1` bins for `n` observations — is the standard starting point but is documented to **oversmooth** (too few bins) on large or skewed datasets; Scott's rule or the Freedman–Diaconis rule are the cited corrections for those cases. Treat Sturges as a reasonable default for small/symmetric samples, not a universal formula. ([Sturges's rule, Wikipedia](https://en.wikipedia.org/wiki/Sturges%27s_rule))

**Chart implementation / CSP verdict.** The consuming tool is strict-CSP, single-file, offline, no `eval`, no CDN — so charts are **hand-built inline SVG (preferred for most chart types: bars, lines, dots, areas — crisp at any zoom, DOM-addressable for a11y/tooltips) or Canvas 2D (only for very high point-count scatter/heatmap where SVG's per-element DOM cost becomes the bottleneck)**. No charting library (Chart.js, D3, Recharts, Highcharts, ECharts, etc.) is loaded from a CDN or bundled with network-fetched assets — everything is inlined vanilla markup/script. This is a design constraint, not a library recommendation; if a library is inlined at build time it must still avoid `eval`/`new Function` internally (verify before inlining — this is an H2/E1 concern, not this track's).

### 4.8 Sparklines

Tufte's definition: **"a small, intense, simple, word-sized graphic with typographic resolution"** — dense enough to be meaningful, small enough to sit inline with text or inside a table cell. ([Tufte, Sparkline Theory and Practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/))

| Attribute | Rule |
|---|---|
| Size | Roughly 1× to 2–3× line-height tall; wide enough to reveal the trend shape, no wider than needed |
| Aspect ratio | "Banked to 45°" (Cleveland) — stretch/compress horizontally until the dominant slopes average near 45°, which is the aspect ratio at which slope differences are most perceivable. Tufte cites ~5:1 for financial series, up to ~20:1 or more for longer series — there's no single fixed ratio, bank it to the data |
| Endpoint | Mark the last value with a dot, and tie it visually/textually to the actual number shown alongside (a sparkline is a trend supplement, never the only representation of the current value) |
| Range context | Optional grey band for a "normal" range; deviations outside it can carry a light colour flag |
| Colour | Sparing — a routine/attention flag, not a full red/yellow/green "stoplight" system (Few's mistake #6 applies here too — see §4.9) |
| What it is NOT | A chart for precise reading. No axis, no gridlines, no legend — if the user needs to read an exact historical value, that's a full chart or a table, not a sparkline |

### 4.9 Dashboards and stat tiles

**Definition and constraint (Stephen Few).** A dashboard is "a visual display of the most important information needed to achieve one or more objectives, consolidated and arranged on a single screen so it can be monitored at a glance." The single-screen constraint is load-bearing — scrolling breaks the simultaneous, parallel pattern-recognition that's the entire point of a dashboard. If the metric set doesn't fit, split into a no-scroll **overview** and a separate scrollable **detail** page rather than letting the "dashboard" quietly become a scrollable report. ([Few, Information Dashboard Design](https://blogs.ischool.berkeley.edu/i247s12/files/2012/01/Dashboard-Design-Overview-Presentation.pdf))

**Few's common-mistake list (condensed to the six most actionable):**

| # | Mistake | Fix |
|---|---|---|
| 1 | Exceeding the single screen | Split into overview (no-scroll) + detail (scrollable) |
| 2 | Numbers with no context | Every KPI needs a comparison: target, trend, prior period, or peer benchmark — never a bare number |
| 3 | Wrong display medium | Bar/line for comparison and trend; pie obscures proportion judgment past a few slices (§4.7) |
| 4 | Poor highlighting | Visual prominence (size, position, contrast) should track *importance*, not *recency of implementation* |
| 5 | Decoration with no data | Remove ornamental chart-junk; every pixel should carry information or clearly organize it |
| 6 | Misused colour | Don't stoplight-color everything; keep a colorblind-safe categorical set (A1); reserve red for genuine alerts |

**Hierarchy and scanning.** Under F-pattern/Z-pattern scanning, the top-left is where eyes land first and the top band + left edge get disproportionate attention. Practical placement rule: **the single most important KPI (the one that answers "are we OK right now?") occupies the top-left tile**; secondary metrics fill the remaining top row; supporting charts/trend detail go below; deep-dive tables go last. Group related tiles with subtle visual boundaries (whitespace or a hairline), not heavy borders around every tile. ([NN/g: F-Shaped Pattern of Reading Web Content](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/))

**Stat-tile (KPI card) anatomy** — five components, in size-hierarchy order:

| Component | Role | Typical sizing weight |
|---|---|---|
| Date/period label | Removes ambiguity about the window ("Last 30 days") | Smallest |
| Metric name | Short label ("Orders," not "Total Number of Orders Placed"); put detail in a tooltip if needed | Small |
| Metric value | The number itself | **Largest** on the tile |
| Delta / context | Period-over-period %, vs. average, or vs. target — pick by metric type (seasonal comparison for growth metrics; average comparison for stability checks; target progress only if a target genuinely exists) | Medium, colour-coded |
| Sparkline | Quick trend shape, optional but high-value | Medium, beneath or beside the value |

Colour convention: green = positive / red = negative is standard, but use a **neutral pair (e.g., blue/orange) when higher-vs-lower isn't unambiguously good/bad** (a rising refund rate is not "positive green"). Always pair colour with a redundant non-colour signal — a ▲/▼ glyph or explicit "+"/"−" sign — never colour alone (WCAG 1.4.1). ([Anatomy of the KPI Card](https://nastengraph.substack.com/p/anatomy-of-the-kpi-card))

### 4.10 Dense list/feed patterns

Dense lists (activity feeds, notification lists, search-result lists) share the table's scanning problems without the table's grid structure. Rules:

- **One clear primary line + one secondary (metadata) line per item**, never three+ competing text weights in one row.
- **Right-align or fixed-position any timestamp/status/count** at the row's trailing edge so the eye can scan that column vertically even without gridlines — this is the table alignment discipline (§4.2) applied without a `<table>`.
- **Consistent leading icon/avatar slot width** — even when an item has no avatar, reserve the space, or every row's text starts at a different x-position and the F-pattern's vertical scan (§4.9) breaks.
- **Group by time/category with a sticky section header** when the feed is long enough to need re-orientation (sticky "Today," "Yesterday," "Earlier").
- Row height for dense feeds follows the same three-band ladder as tables (§4.1) — a notification list is functionally a one-column table.

### 4.11 Empty / loading / error / skeleton states for data

These three (four, counting skeleton as loading's visual form) states are the most commonly conflated states in data UI. NN/g's guidance for empty states generalizes to all three: ([NN/g: Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/))

| State | Purpose | What it must contain | Anti-pattern |
|---|---|---|---|
| **Loading (skeleton)** | Signal "working," shape the wait | Skeleton matching the *real* row/tile count and column widths (or a sensible default of 5–8 rows if the real count is unknown); shown only past **~300–500ms** (below that, showing nothing avoids flicker — see B1 rule 12/B2) | A skeleton with a different row count/shape than what loads in, causing layout jump |
| **Empty — genuinely no data** | Communicate system status honestly | State *why* it's empty ("No orders in the selected date range"), plus one concrete next action (adjust filters, create a record) | A blank table indistinguishable from "still loading" or "broken" |
| **Empty — first-run/onboarding** | Teach, not just inform | A "pull revelation" — contextual guidance shown only when the user reaches that empty area, plus a direct path to populate it (a real button/link, not just descriptive text) | Describing what to do without a way to do it from the empty state itself |
| **Error** | Explain failure, offer recovery | What failed, in plain language; a retry action; preserve any filters/inputs the user had set | A generic "Something went wrong" with no retry, or one that silently discards the user's filter state |

**Never let a filtered-to-zero-results table look identical to a loading or broken table** — this is the single most common data-state bug: the row area is blank in all three cases unless explicitly designed apart.

### 4.12 Pagination vs infinite scroll vs load-more

| Signal | Points toward |
|---|---|
| User needs to **find** a specific item, **compare** items that may be far apart, or **return** to a known position | **Pagination** |
| Content must have a reachable **footer** (site footer, page chrome) | **Pagination** or **load-more** — never pure infinite scroll |
| Users browse with **no particular goal** (social feed, image discovery, news scroll) | **Infinite scroll**, with the caveats below |
| Ambiguous / want lower interaction cost than pagination but need footer access and a natural pause | **Load-more button** |
| Low-bandwidth user base, or a meaningfully sized population with motor/cognitive accessibility needs | **Pagination** or **load-more** — infinite scroll actively disadvantages both |

NN/g's synthesis: infinite scroll suits "situations where users will want to scroll through homogeneous items with no particular task or goal in mind"; avoid it whenever users need to find something specific, compare items across the list, or reach the footer. ([NN/g: Infinite Scrolling — When to Use It, When to Avoid It](https://www.nngroup.com/articles/infinite-scrolling-tips/)) Baymard's eCommerce usability testing found **load-more buttons can outperform both pagination and infinite scroll** — but only when implemented carefully, and search results specifically often need a *different* loading pattern than category browsing does. ([Baymard / Smashing Magazine: Infinite Scrolling, Pagination or Load-More Buttons?](https://baymard.com/blog/external-load-more-vs-pagination-vs-infinite-scrolling))

**If you ship infinite scroll, its accessibility floor is:** `role="feed"` with `aria-busy` during fetch (screen-reader support exists in current JAWS/NVDA/TalkBack/VoiceOver per Deque's compatibility testing, but role=feed only helps screen-reader *reading-mode* users — it does nothing for keyboard-only, switch-device, or low-vision users who still fight continuous reflow) **plus** a manual escape hatch: a visible toggle to switch to paginated/load-more mode, and/or a "back to top" control. Treat pure, non-optional infinite scroll as a last resort for a general-purpose tool. ([Deque: Infinite Scrolling & role=feed Accessibility Issues](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/))

### 4.13 Filtering and faceting

- **Show filters and results simultaneously.** Side-by-side on desktop (filter rail + result grid/table in view together); an overlay **tray** on mobile that keeps a translucent view of the results behind it, so selections visibly change the result set without a full navigation. Never push filtering to a separate screen the user must navigate back from ("pogo-sticking"). ([NN/g: Mobile Faceted Search with a Tray](https://www.nngroup.com/articles/mobile-faceted-search/))
- **Always show a live result count** — the running total, and ideally a per-facet-value count (e.g., "Color: Blue (14)") — updated on every filter change, and pinned/fixed so it doesn't scroll out of view.
- **Use natural-language labels, not icon-only controls**, for filter/facet triggers ("Filter," "Sort by") — icons alone are ambiguous and untranslatable at a glance.
- **Reset to page 1 on any filter change** in a paginated result set (silently keeping the user on page 7 of a now-2-page result set is a common, confusing bug).
- **Zero-result state is a first-class empty state** (§4.11), not a blank filter panel — tell the user which facet combination produced zero and offer a one-click "clear filters."

---

## 5. Options catalogue

### 5.1 Chart-type selection matrix

Columns: **intent (the data question) · best chart · avoid · encoding used · pitfalls.** Taxonomy after the [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md) and [Datawrapper's chart-type guide](https://www.datawrapper.de/blog/chart-types-guide).

| Intent | Best chart | Avoid | Encoding | Pitfalls |
|---|---|---|---|---|
| **Comparison** (a few categories, one metric) | Bar/column chart, ordered by value unless a natural order exists | 3D bars, pie for >4 categories | Position/length (rank 1–2) | Unsorted bars force extra scanning; always zero-baseline |
| **Trend over time** (regular interval) | Line chart | Bar chart for many time points (>~12–15 — becomes a comb); pie of any kind | Position/slope | Too many series (§4.7); don't silently truncate the y-axis (rule 11) |
| **Trend, composition changing over time** | Stacked area chart | Stacked area with >5 categories (bands become unreadable) | Position + colour hue (part) | Middle bands in a stack are hardest to compare — put the most important series at the baseline |
| **Ranking** (order matters more than exact value) | Ordered (sorted) bar, lollipop, or dot-strip | Unsorted bar, pie | Position | Re-sorting on filter change can disorient — animate the reorder (B1) |
| **Part-to-whole, single snapshot** | Stacked bar (100%) or a simple bar-per-category | Pie beyond **4 slices**, any donut for precise comparison, 3D pie | Length (stacked) vs. angle (pie, rank 3 — weaker) | A 3% share difference is legible in a bar, "practically invisible" in a pie |
| **Part-to-whole, hierarchical** | Treemap (only when hierarchy itself matters) | Treemap for flat/non-hierarchical data — just use a bar | Area (rank 4) | Small leaf nodes become unreadable; label only nodes above a minimum area |
| **Correlation between two variables** | Scatterplot | Line chart (implies false ordering/continuity) | Position (x,y) | Overplotting past a few hundred points — use opacity/jitter/hexbin (§4.7); causation is not shown, flag this in copy |
| **Correlation, 3 variables** | Bubble chart | Bubble with >~3 encoded dimensions (color+size+x+y is already the practical ceiling) | Position + area (size) | Area perception is weaker than position — add a size legend; readers find bubble charts "overwhelming" past a handful of points |
| **Distribution, one variable** | Histogram | Pie/bar-by-bucket without ordered bins | Position/length | Bin count changes the story — start from Sturges' rule, adjust, disclose bin width |
| **Distribution, compare across groups** | Box plot (compact) or violin plot (shape matters) | Overlapping histograms (>2–3 groups) | Position (quartiles) | Box plots hide multimodality — use violin/strip if bimodal shape is the point |
| **Distribution, full population (large n)** | Dot strip / barcode plot, or population pyramid for two-sided demographic splits | Histogram with too few observations (<~20) | Position | Overplotting at high n — bin or jitter |
| **Deviation from a reference (target/zero/average)** | Diverging bar chart | Plain bar with the reference invisible | Length from a non-zero, explicit baseline | Reference line must be visibly drawn and labeled, not implied |
| **Flow / movement between states** | Sankey diagram (volume-weighted) | Pie/bar for genuinely sequential flow data | Length (band width) | Gets unreadable past ~5–7 nodes per side; label the largest flows directly |
| **Spatial / geographic pattern** | Choropleth (rate/ratio) or proportional symbol map (count) | Choropleth of raw *totals* (area bias hides real magnitude — a big-area/low-population region looks more significant than it is) | Colour saturation (choropleth) / area (symbol) | Always map a *rate*, never a raw total, on a choropleth |
| **Single KPI, at-a-glance** | Stat tile + sparkline (§4.9, §4.8) | A full chart where one number + a trend line would answer the question faster | Position (sparkline) + typography (number) | A number with no context (no delta, no comparison) is not a KPI — rule 13 |

### 5.2 Table-pattern catalogue

| Pattern | When to use | Row height | Key mechanism | Pitfalls |
|---|---|---|---|---|
| **Dense data grid** | Admin/ops tool, power users, hundreds+ of rows | Compact 32px | Sticky header + sticky ID column, virtualization/`content-visibility:auto` past ~200 rows | Over-densify and touch targets fall under 24px — check row-action hit area independently of visual row height |
| **Comparison table** | Plans/pricing/spec comparison, few rows, many columns | Relaxed 48–56px | Columns are the "records," rows are attributes; sticky first *column* (attribute names), not header | Don't let feature checkmarks be the *only* signal — pair with row-hover for context |
| **Property/definition table** | Single-record detail view (key: value pairs) | Default 40–48px | Two-column layout, label left, value right or below | Not sortable/filterable by definition — don't add sort chevrons to a table with no ranking |
| **Expandable/nested-row table** | Parent-child data (order → line items) | Parent 40–48px, child rows can be compact 32px | Disclosure triangle on parent row; expanded state persists across sort/filter where possible | Users rarely re-collapse manually-expanded rows (NN/g accordion finding) — provide "collapse all" |
| **Editable inline table** | Spreadsheet-like bulk data entry | Default 40–48px (compact fights fat-finger editing) | Click/Enter to edit cell in place; Tab/arrow-key navigation between cells; visible dirty-state indicator per cell | In-place editing only scales to narrow tables (NN/g) — beyond ~6 editable columns, use the side-panel pattern instead |
| **Frozen-column wide table** | Table wider than viewport, needs horizontal scroll | Any density | `position: sticky; left: 0` on identity column(s); shadow/border at the freeze seam | Freezing too many columns re-creates the original horizontal-scroll problem — freeze 1 (rarely 2) columns max |
| **Card-list-as-table (responsive collapse)** | Same dataset, narrow viewport | Card ≥ relaxed 56px equivalent | Each row becomes a card; column *labels* become inline mini-labels next to each value | Losing the header context is common — repeat the field label inside every card, don't rely on position alone |
| **Log/console table** | High-frequency append-only data (events, logs) | Compact 32px, monospace-leaning numerals | Newest-first or newest-last by convention, auto-scroll-lock toggle, timestamp always tabular-aligned | Auto-scroll fighting a user who's trying to read a past entry — pause auto-scroll on manual scroll-up |

### 5.3 Pagination-pattern catalogue

| Pattern | Best for | Avoid when | Accessibility note | Implementation note |
|---|---|---|---|---|
| **Numbered pagination** | Findable/countable content: search results, admin tables, order history, anything users need to return to a known position in | Low-commitment browsing where page number is meaningless to the user | Page links are real focusable elements with `aria-current="page"` on the active one | Fully static/CSP-safe; page-size default **25** is a common convention (10/25/50/100 as user-selectable steps) |
| **Load-more button** | Middle ground: product/content grids where users want momentum but the app should still support a footer and a manual pause | Very long lists where dozens of clicks would be needed — switch to virtualization or true pagination past that | Button is a real `<button>`; announce newly loaded count via `aria-live="polite"` region | CSP-safe; appended DOM nodes only, no navigation |
| **Infinite scroll (auto)** | Homogeneous, low-goal feeds only (social, image discovery, news) | Anything findable/comparable/returnable-to; any footer that must stay reachable; low-bandwidth or accessibility-sensitive user base | Needs `role="feed"`, `aria-busy` during fetch, and a manual off-switch to pagination/load-more — screen-reader support for `role="feed"` exists in current JAWS/NVDA/TalkBack/VoiceOver but doesn't help keyboard-only or motor-impaired users | CSP-safe (IntersectionObserver, no `eval`); watch memory growth on very long sessions — recycle/virtualize off-screen nodes |
| **Cursor/"prev–next" only** | Very large or real-time-changing datasets where total count/page count is expensive or unstable | Users who need to jump to an arbitrary page or gauge "how much is left" | Same as numbered pagination for the two buttons present | Avoids the "page 4 of a dataset that changed" consistency bug that offset pagination has |
| **Hybrid: paginated with infinite-scroll-within-page** | Long feeds where you still want indexable/shareable positions | Adds complexity users rarely need in a general-purpose tool | Page-level `aria-current`, plus feed semantics within a page | More engineering cost than the pattern usually earns — justify explicitly before choosing this over plain load-more |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Numbers left-aligned or proportional-width** | A numeric column where digits don't line up vertically; magnitude comparison requires reading each value | Right-align + `font-variant-numeric: tabular-nums` (§4.2, rule 2) |
| **Row height too uniform across very different tables** | A 40-row admin log and a 6-row settings table use identical 48px rows | Pick density from the three-band ladder per table's actual task (§4.1) |
| **Sticky header missing on a long table** | Header scrolls away; users lose column meaning by row 20 | `position: sticky; top: 0` past one viewport of rows (rule 3) |
| **Every column frozen** | Horizontal scroll re-creates the same illegibility it was meant to fix | Freeze only the identity column(s), max 1–2 (§5.2) |
| **Sort state only shown by colour** | Colorblind users can't tell which column/direction is active | Chevron shape + `aria-sort`, never colour alone (rule 4) |
| **`aria-sort` on multiple columns** | Screen reader announces conflicting/duplicate sort state | Exactly one `aria-sort` value at a time (§4.3) |
| **Row actions only appear on `:hover`** | Keyboard and touch users can't reach edit/delete at all | Mirror on `:focus-within`; persistent at touch breakpoints (rule 6) |
| **Action target under 24×24px** | Tap-to-miss on dense/compact rows, especially mobile | Expand the *hit area* independent of the *visual* icon size (rule 6) |
| **Blank table with no state signal** | Identical appearance for "loading," "zero results," and "broken" | Three explicit, distinct treatments (§4.11, rule 15) |
| **Skeleton row count doesn't match loaded content** | Visible layout jump the instant real data arrives | Skeleton mirrors real row/column count, or a disclosed default (§4.11) |
| **Pie chart with 6+ slices, or a donut used for precise comparison** | Reader can't rank two similarly-sized slices by eye | Convert to a bar chart; cap pie at 4 slices (§4.7, §5.1) |
| **Bar chart with a non-zero baseline** | A 4% real difference reads as a 40%+ visual difference | Always zero-baseline bar/column charts (rule 11) |
| **Line chart truncated silently** | Small real fluctuation reads as a dramatic swing, no annotation explaining why | Either zero-baseline, or annotate/mark the break explicitly (rule 11) |
| **More than ~7 series in one chart, legend required to decode any of it** | Reader has to look up colour-to-category repeatedly; chart is functionally unreadable | Direct-label ≤4; small multiples or highlight-one-gray-rest beyond ~7 (rule 10) |
| **Scatterplot solid black blob** | Hundreds of overlapping points render as one mass, hides density | Opacity blending, jitter, or hexbin past a few hundred points (§4.7) |
| **Sparkline with no adjacent number** | Trend shape shown with no way to know the actual current value | Always pair a sparkline with the exact value it summarizes (§4.8) |
| **Dashboard requires scrolling to see "everything important"** | Users miss metrics below the fold during at-a-glance monitoring | Split into no-scroll overview + scrollable detail (rule 13) |
| **KPI tile shows a bare number, no comparison** | Users can't tell if 1,204 is good or bad | Add delta/target/average context — every number needs "compared to what" (rule 13, Tufte's small-multiples question) |
| **Infinite scroll with no way to reach the footer or reset** | Users trapped in an ever-growing feed, can't find settings/legal links | `role="feed"` + manual pagination/load-more fallback, or switch pattern entirely (§4.12) |
| **Filters navigate to a new page instead of updating in place** | "Pogo-sticking" between filter screen and results screen | Show filters and results simultaneously, update in place (§4.13) |
| **Filter panel with no result count** | User applies 4 filters with no idea if 2 or 200 results remain | Live, pinned result count updated on every change (§4.13) |
| **Chart with no text alternative** | Screen-reader users get "image" and nothing else | Alt text via Amy Cesal's formula + adjacent/linked data table (§4.14 in Checklist, sourced below) |

---

## 7. Pre-flight checklist (run before shipping any data screen)

- [ ] Row height chosen from the compact **32** / default **40–48** / relaxed **56** ladder, consistently within one table (§4.1).
- [ ] Numeric columns right-aligned with `font-variant-numeric: tabular-nums`; text columns left-aligned (§4.2).
- [ ] Sticky header past one viewport of rows; sticky first column only if it's the identity column *and* the table scrolls horizontally (rule 3).
- [ ] Sortable columns: chevron affordance (not colour-only), single active `aria-sort`, no `aria-label` for the sort hint (§4.3).
- [ ] Default sort matches the most common real query, not alphabetical-by-default (rule 5).
- [ ] Row actions: ≤2 inline or overflow-menu'd; every hover reveal mirrored on `:focus-within`; hit target **≥24×24px** (rule 6).
- [ ] Divider choice (hairline default vs. zebra) is a deliberate style decision, not assumed to improve accuracy (rule 7).
- [ ] Chart type chosen from the *question* (§5.1), not the data shape; primary comparison uses the highest-accuracy channel available (position/length before colour/area) (rule 9).
- [ ] Series count ≤ **5–7**; direct labels used up to ~4 before falling back to a legend; small multiples used beyond ~7 (rule 10).
- [ ] Bar/column axis starts at zero, no exceptions; any non-zero line-chart baseline is visibly annotated (rule 11).
- [ ] Every sparkline is paired with its exact current value; banked toward ~45° slope (rule 12).
- [ ] Dashboard's primary view requires **zero scrolling**; top-left tile is the single most important metric; every KPI has comparison context (rule 13).
- [ ] Stat tiles use the five-part anatomy (period, name, value, delta, sparkline) with non-colour-redundant delta signaling (§4.9).
- [ ] Loading, empty, and error states are three visually distinct treatments — none of them is "just blank" (rule 15).
- [ ] Pagination model chosen by task (findable→pagination, exploratory→infinite scroll with `role="feed"` + fallback, ambiguous→load-more) (rule 14).
- [ ] Faceted filters show a live, pinned result count and update results in place — no pogo-sticking (§4.13).
- [ ] Every chart has a non-visual path: alt text in the "[chart type] of [data] where [reason]" pattern, plus a linked/adjacent accessible data table (§4.6, §9).
- [ ] Chart contrast checked against **WCAG 1.4.11 (3:1, graphical objects/adjacent data elements)**, not the text 4.5:1 ratio — data labels-as-text still need 4.5:1 separately.
- [ ] No CDN chart/table widget library is loaded; charts are hand-built inline SVG/Canvas; verify no `eval`/`new Function` if anything is inlined (§4.7 CSP verdict).

---

## 8. Open questions / unverified

- **"5–7 series max" is a synthesized practitioner consensus, not one pinned study.** Individual sources cited different numbers (4 categorical colours before "getting nervous"; 5 overlapping lines as "the threshold of non-readability, barely"; 10 lines shown workable by Nick Desbarats *only* with interactivity and *not* recommended for live/changing dashboards). Treat 5–7 as a practical ceiling to design against, not a perceptual constant — *Practical Charts* (Desbarats) was not fetched directly and should be checked if this number needs to be defended precisely. ([Data Revelations](https://www.datarevelations.com/how-many-lines-are-too-many-lines/))
- **Zebra striping's non-effect is based on one controlled study** (Jessica Enders, N=244, 15×9 artificial dataset) — a single study, not a meta-analysis. It's the best available controlled evidence found, but treat "no proven benefit" as "no proven benefit *in this study's conditions*," not an absolute law. ([A List Apart](https://alistapart.com/article/zebrastripingdoesithelp/))
- **`aria-sort` screen-reader announcement behaviour is reported as inconsistent across engines** (JAWS vs. NVDA vs. VoiceOver) by one accessibility-specialist source (Adrian Roselli); this is a fast-moving area (screen reader behaviour changes with browser/OS updates) and should be re-verified against current engine versions at build time, not assumed stable through 2026.
- **The pie-chart "4 max" figure is Datawrapper Academy's specific number**; other practitioner sources round to "5–6." The task brief itself frames it as "~5." This report uses Datawrapper's more conservative 4 as the cited number and treats 5 as the outer edge some sources tolerate — both are defensible; pick one as a house rule rather than treating either as a hard perceptual law.
- **Sturges' rule formula** is stated from well-established statistical convention (`k = ⌈log₂ n⌉ + 1`); the fetched Wikipedia source confirmed the rule's existence, name, and oversmoothing caveat but the exact formula did not render cleanly from that fetch — cross-check against a stats primary source (Sturges, 1926, *JASA*) if bin-count precision matters for a specific build.
- **Baymard's specific eCommerce pagination/load-more/infinite-scroll percentages** were referenced only via a secondary summary (Smashing Magazine repost); the full original Baymard study (subscription-gated) was not directly fetched — the qualitative conclusion ("load-more can outperform both, but pitfalls can negate it; search ≠ category browsing") is used here without the underlying statistics.
- **Munzner's "~8 hue" categorical-distinguishability ceiling** was read from lecture-note slides synthesizing her book rather than *Visualization Analysis and Design* itself (which was paywalled in this research pass) — treat as a well-supported approximation, and note the exact palette-building number is A1's domain regardless.

---

## 9. Sources

Primary / authoritative:
- [Financial Times — Visual Vocabulary (chart-doctor repo)](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md) — chart-intent taxonomy (deviation, correlation, ranking, distribution, change-over-time, part-to-whole, magnitude, spatial, flow).
- Cleveland, W. & McGill, R. (1984), *Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods* — accuracy ranking, accessed via [Mackinlay's ranking summary](https://courses.ischool.berkeley.edu/i213/s99/Lectures/Lecture7/tsld048.htm).
- [Munzner, T. — visual-encoding channel-effectiveness lecture notes](https://teaching.vda.univie.ac.at/vis/23s/LectureNotes/04_visual_encoding_principles.pdf) (synthesizing *Visualization Analysis and Design*).
- [Datawrapper Academy / Blog — chart type guide](https://www.datawrapper.de/blog/chart-types-guide), [pie chart guidance](https://www.datawrapper.de/academy/what-to-consider-when-creating-a-pie-chart), [axis-label rationale](https://academy.datawrapper.de/article/239-why-datawrapper-does-not-include-axis-labels-for-many-charts).
- [Nielsen Norman Group — Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/).
- [Nielsen Norman Group — F-Shaped Pattern of Reading Web Content](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/).
- [Nielsen Norman Group — Infinite Scrolling: When to Use It, When to Avoid It](https://www.nngroup.com/articles/infinite-scrolling-tips/).
- [Nielsen Norman Group — Mobile Faceted Search with a Tray](https://www.nngroup.com/articles/mobile-faceted-search/).
- [Nielsen Norman Group — Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/).
- Few, S. — *Information Dashboard Design*; overview accessed via [Berkeley iSchool presentation deck](https://blogs.ischool.berkeley.edu/i247s12/files/2012/01/Dashboard-Design-Overview-Presentation.pdf).
- Tufte, E. — [Sparkline Theory and Practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/).
- [Small multiple — Wikipedia](https://en.wikipedia.org/wiki/Small_multiple) (Tufte origin and rationale).
- [WCAG 2.2 — SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [SC 1.4.11 Non-text Contrast](https://www.wcag.com/designers/1-4-11-non-text-contrast/); SC 1.4.1 Use of Color; SC 2.1.1 Keyboard; SC 1.4.13 Content on Hover or Focus.
- [Adrian Roselli — Sortable Table Columns](https://adrianroselli.com/2021/04/sortable-table-columns.html) — `aria-sort` implementation and screen-reader behaviour.
- [W3C WAI — Complex Images tutorial](https://www.w3.org/WAI/tutorials/images/complex/) — long-description patterns for charts.
- [W3C Wiki — SVG Accessibility / ARIA roles for charts](https://www.w3.org/wiki/SVG_Accessibility/ARIA_roles_for_charts).
- [Amy Cesal — Writing Alt Text for Data Visualization (Nightingale)](https://medium.com/nightingale/writing-alt-text-for-data-visualization-2a218ef43f81) — the alt-text formula (chart type · data type · reason for inclusion).
- [A List Apart — Zebra Striping: Does It Really Help?](https://alistapart.com/article/zebrastripingdoesithelp/) (Jessica Enders study).
- [Deque — Infinite Scrolling & role="feed" Accessibility Issues](https://www.deque.com/blog/infinite-scrolling-rolefeed-accessibility-issues/).
- [Baymard / Smashing Magazine — Infinite Scrolling, Pagination or "Load More" Buttons? Usability Findings in eCommerce](https://baymard.com/blog/external-load-more-vs-pagination-vs-infinite-scrolling).
- [Carbon Design System — Data Table style spec](https://carbondesignsystem.com/components/data-table/style/); [Ant Design — Table component](https://ant.design/components/table/) — row-height/density cross-validation.
- [MDN — font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric) — `tabular-nums`.
- Sturges, H. A. (1926) via [Sturges's rule — Wikipedia](https://en.wikipedia.org/wiki/Sturges%27s_rule) — histogram bin-count convention and oversmoothing caveat.

Reference / secondary:
- [mannhowie.com — Data Table UX: 5 Rules of Thumb](https://mannhowie.com/data-table-ux).
- [Data Revelations — How Many Lines Are Too Many Lines?](https://www.datarevelations.com/how-many-lines-are-too-many-lines/).
- [Practical Reporting — Avoid legends, footnotes, and other indirect labeling](https://www.practicalreporting.com/blog/2024/9/17/avoid-legends-footnotes-and-other-forms-of-indirect-labeling-in-your-charts-whenever-possible).
- [Storytelling with Data — Bar charts must have a zero baseline](https://www.storytellingwithdata.com/blog/2012/09/bar-charts-must-have-zero-baseline); [Chad Skelton — should line charts always start at zero?](https://www.chadskelton.com/2018/06/bar-charts-should-always-start-at-zero.html).
- [ggplot2 book — Dealing with overplotting](https://r4ds.github.io/bookclub-ggplot2/dealing-with-overplotting.html); [Hexagonal Binning Plot — the definitive guide](https://www.visualizing.org/hexbin-plot).
- [BoIA — Hover Actions and Accessibility: Addressing a Common WCAG Violation](https://www.boia.org/blog/hover-actions-and-accessibility-addressing-a-common-wcag-violation).
- [Anastasiya Kuznetsova — Anatomy of the KPI Card](https://nastengraph.substack.com/p/anatomy-of-the-kpi-card).
- [DubBot — Beyond the Chart: A Guide to Accessible Data Visualization](https://dubbot.com/dubblog/2024/charts-graphs.html).

---

## Appendix — worked examples (copyable)

### Worked example 1 — dense data-table spec (row heights, alignment, sticky header, sorting, row actions)

```html
<div class="table-scroll" role="region" aria-labelledby="orders-caption" tabindex="0">
  <table class="data-table" data-density="default"> <!-- data-density: compact | default | relaxed -->
    <caption id="orders-caption" class="visually-hidden">
      Orders. Sortable by column; press Enter on a column header to sort.
    </caption>
    <thead>
      <tr>
        <th scope="col" class="sticky-col" style="width:14ch">Order</th>
        <th scope="col">Customer</th>
        <th scope="col" aria-sort="descending">
          <button class="sort-btn" type="button">
            Date <svg class="chevron chevron--desc" aria-hidden="true" width="10" height="10"><path d="M1,3 L5,7 L9,3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
        </th>
        <th scope="col" class="num" aria-sort="none">
          <button class="sort-btn" type="button">
            Amount <svg class="chevron" aria-hidden="true" width="10" height="10"><path d="M1,3 L5,7 L9,3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
        </th>
        <th scope="col" style="width:8ch">Status</th>
        <th scope="col" style="width:6ch"><span class="visually-hidden">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="sticky-col">#10482</td>
        <td>Priya Sharma</td>
        <td>2026-07-21</td>
        <td class="num tabular">$1,204.00</td>
        <td><span class="badge badge--ok">Paid</span></td>
        <td class="row-actions">
          <button class="icon-btn" aria-label="Edit order #10482">✎</button>
          <button class="icon-btn" aria-label="More actions for order #10482">⋯</button>
        </td>
      </tr>
      <!-- additional rows -->
    </tbody>
  </table>
</div>

<style>
  :root {
    --row-h-compact: 32px;
    --row-h-default: 44px;   /* 40–48px band */
    --row-h-relaxed: 56px;
  }
  .data-table { border-collapse: collapse; width: 100%; font-size: 13px; }
  .data-table[data-density="compact"] td, .data-table[data-density="compact"] th { height: var(--row-h-compact); }
  .data-table[data-density="default"] td, .data-table[data-density="default"] th { height: var(--row-h-default); }
  .data-table[data-density="relaxed"] td, .data-table[data-density="relaxed"] th { height: var(--row-h-relaxed); }

  .data-table th, .data-table td { padding: 0 12px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.10); } /* hairline divider, ~10% opacity */
  .data-table .num { text-align: right; }                 /* rule 2: numerics right-aligned */
  .tabular { font-variant-numeric: tabular-nums; }         /* rule 2: tabular figures */

  .data-table thead th { position: sticky; top: 0; background: var(--surface, #fff); z-index: 2;
    box-shadow: 0 1px 0 rgba(0,0,0,0.14); }                /* rule 3: sticky header + seam */
  .sticky-col { position: sticky; left: 0; background: inherit; z-index: 1;
    box-shadow: 1px 0 0 rgba(0,0,0,0.14); }                /* rule 3: sticky identity column, only if needed */

  .sort-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: 0; font: inherit; cursor: pointer; }
  .chevron { opacity: 0.4; }                               /* unsorted: hollow/low-contrast */
  .chevron--desc { opacity: 1; transform: rotate(0deg); }  /* sorted: filled + directional, not colour-only */

  .data-table tbody tr:hover, .data-table tbody tr:focus-within { background: rgba(0,0,0,0.035); } /* row-hover aid, not zebra */

  .row-actions { display: flex; gap: 4px; opacity: 0; }
  .data-table tbody tr:hover .row-actions,
  .data-table tbody tr:focus-within .row-actions { opacity: 1; }  /* rule 6: hover reveal... */
  @media (hover: none) { .row-actions { opacity: 1; } }            /* ...but always visible on touch */
  .icon-btn { width: 32px; height: 32px; min-width: 24px; min-height: 24px; /* rule 6: ≥24×24 target */
    display: inline-flex; align-items: center; justify-content: center; border: 0; background: none; cursor: pointer; }

  .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
```

Notes: `aria-sort` appears on exactly one `<th>` at a time (rule 4); the sort button carries visible text + icon so no `aria-label` localization risk (§4.3); `.row-actions` mirrors `:hover` with `:focus-within` and forces visibility under `(hover: none)` for touch (rule 6); zero external requests, zero `eval`, pure CSS/HTML — CSP-safe.

### Worked example 2 — stat tile + sparkline anatomy (delta encoding)

```html
<div class="stat-tile">
  <p class="stat-period">Last 30 days</p>
  <h3 class="stat-name">Active subscriptions</h3>
  <p class="stat-value tabular">12,840</p>
  <p class="stat-delta stat-delta--up">
    <svg aria-hidden="true" width="10" height="10"><path d="M5,1 L9,9 L1,9 Z" fill="currentColor"/></svg>
    <span>+4.2%</span> <span class="stat-delta-label">vs previous 30 days</span>
  </p>
  <svg class="sparkline" viewBox="0 0 120 32" width="120" height="32" role="img"
       aria-label="Trend: active subscriptions rose steadily over the last 30 days, from 11,600 to 12,840">
    <polyline points="0,26 12,24 24,25 36,20 48,21 60,16 72,17 84,11 96,9 108,6 120,4"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="120" cy="4" r="2.5" fill="currentColor"/> <!-- rule 12: mark the endpoint -->
  </svg>
</div>

<style>
  .stat-tile { display: grid; gap: 2px; padding: 16px; border-radius: 8px; background: var(--tile-bg, #fff); }
  .stat-period { font-size: 11px; color: var(--text-muted); margin: 0; }               /* smallest */
  .stat-name   { font-size: 13px; font-weight: 600; margin: 0; }                        /* small */
  .stat-value  { font-size: 28px; font-weight: 700; margin: 4px 0 2px; line-height: 1; } /* largest */
  .tabular     { font-variant-numeric: tabular-nums; }
  .stat-delta  { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; }
  .stat-delta--up   { color: var(--positive, #1a7f37); }   /* colour ... */
  .stat-delta--down { color: var(--negative, #c4281c); }
  .stat-delta svg   { flex: none; }                        /* ...+ redundant ▲/▼ glyph, never colour alone */
  .stat-delta--down svg { transform: rotate(180deg); }
  .stat-delta-label { color: var(--text-muted); }
  .sparkline { display: block; margin-top: 8px; color: var(--accent, #2563eb); }
</style>
```

Notes: five-part anatomy in size order — period, name, value, delta, sparkline (§4.9); delta pairs colour with a shape glyph so meaning survives grayscale/colour-blindness (WCAG 1.4.1); the sparkline's own `aria-label` states the trend in words because the polyline itself is not readable by assistive tech, and the endpoint dot ties the shape to the concrete number above it (rule 12); swap `--positive`/`--negative` for a neutral blue/orange pair when the metric's direction isn't unambiguously good/bad (§4.9).

### Worked example 3 — empty / loading / error trio for a data panel

```html
<!-- LOADING: skeleton mirrors the real 5-row, 4-column shape; shown only past ~300–500ms -->
<div class="panel" aria-busy="true" aria-live="polite">
  <div class="skeleton-row" style="height:44px" aria-hidden="true"></div>
  <div class="skeleton-row" style="height:44px" aria-hidden="true"></div>
  <div class="skeleton-row" style="height:44px" aria-hidden="true"></div>
  <span class="visually-hidden">Loading orders…</span>
</div>

<!-- EMPTY: explains why + gives a next action (never just blank) -->
<div class="panel panel--empty">
  <p class="empty-title">No orders in the selected date range</p>
  <p class="empty-body">Try widening the date filter, or create a new order.</p>
  <button type="button" class="btn-primary">Clear date filter</button>
</div>

<!-- ERROR: states what failed + retry, preserves user's filters -->
<div class="panel panel--error" role="alert">
  <p class="error-title">Couldn't load orders</p>
  <p class="error-body">Your filters are still applied. Check your connection and try again.</p>
  <button type="button" class="btn-primary" id="retry-btn">Retry</button>
</div>
```

Notes: the three states are visually distinct (skeleton bars vs. explanatory text vs. alert-styled error), never collapse to "blank" (rule 15, §4.11); `aria-busy`/`aria-live` on load, `role="alert"` on error so assistive tech announces the failure without the user needing to find it; the error state explicitly preserves filter state in copy so users don't re-enter their query.
