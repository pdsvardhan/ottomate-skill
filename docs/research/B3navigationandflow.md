# B3 — Navigation & flow

*Design-intelligence reference. Track B3 of the registry research map. Written to be read by the design agent before it structures any navigation or multi-screen flow, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns **navigation as a system and multi-screen flow as a sequence**: which structural model (top nav, sidebar, tabs, breadcrumb, command palette, bottom nav, mega-menu, off-canvas drawer, step indicator) carries a given information architecture; how broad and how deep that architecture is allowed to get before the model must change; how a user finds their way in, orients once there, and finds their way back out (wayfinding); how first-run/onboarding is staged and skipped; how progressive disclosure keeps a screen simple; how a multi-step task is split into a wizard or a task list; which modality (inline/modal/drawer/new page) each interruption is staged in, by a decision rule, not taste; and what part of all of it must live in the URL so it is shareable, bookmarkable, and restorable. It is the skeleton the screens hang on.

## 2. Boundary (what this track does **not** cover)

- **The visual design of a nav component** — its anatomy, spacing tokens, color/elevation treatment, icon set → **C1 / A-group** (visual design tracks). B3 decides a sidebar is the right model at this breadth/depth; C1/A-group decides what that sidebar looks like.
- **Copy and labels inside navigation** — link text, tab names, menu-item wording, a wizard's Back/Next button labels → **D1**. B3 decides a tab exists and what object it represents; D1 decides what it's called.
- **Interaction states of a nav item** — hover, focus, active/current, disabled, pressed visuals and exactly what triggers each → **B2 Interaction states & affordance**. B3 decides that a nav item must mark "current section"; B2 decides how that state renders and what else changes when it fires.
- **The motion of a drawer/menu opening or a tab panel switching** — duration, easing, choreography → **B1 Motion & animation systems**. B3 decides drawer vs modal vs new page; B1 decides how the chosen surface animates in.
- **Accessibility conformance methodology and the full audit** (contrast ratios, screen-reader test protocols, the complete WCAG matrix) → **A5 Accessibility**. B3 cites and applies only the specific navigation-relevant success criteria inline (2.4.1, 2.4.5, 2.4.8 — §4.5) because they directly constrain nav-model choice; A5 owns the exhaustive conformance audit.
- **Raw page-load/render performance of a navigation-heavy screen** (mega-menu bundle size, sidebar paint cost) → **E1 Performance**. B3 owns the structure; E1 owns the byte/frame budget.

Together these tracks fully partition "a navigation element" with no overlap: structure/flow (**B3**) → visual form (**C1/A-group**) → state visuals (**B2**) → motion (**B1**) → words (**D1**) → conformance depth (**A5**) → runtime cost (**E1**). If the question is "what should exist and where does it lead," it's B3; anything about how it looks, states, moves, reads, is audited, or costs belongs to a sibling.

---

## 3. Executive rules (apply these before structuring any nav or flow)

1. **Match the nav model to breadth × depth — not preference.** Few sections & shallow → top nav. Broad and/or growing → sidebar (left-aligned, always visible on desktop, text-labeled), once you pass roughly **7–9 top-level items** or the IA is expected to keep growing (typical of B2B/enterprise/gov/health products). Sibling views of the same object → tabs. Deep hierarchies users can land in mid-way → breadcrumb, supplementary only. Keyboard-first power users on a desktop tool → layer a command palette on top of whichever primary model you picked; it augments, it never replaces. Full table in §5.1; worked walkthrough in §4.2. ([NN/g: Left-Side Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/))
2. **"7±2" does not govern nav-menu item counts — treat it as folklore.** NN/g's own research is explicit that menu size is "not 7, despite a common myth," and is driven by contextual factors rather than short-term-memory limits ([NN/g: How Many Items in a Navigation Menu?](https://www.nngroup.com/videos/number-items-navigation-menu/)). Cross-checking real conventions instead: mobile bottom-nav clusters at **3–5 items (6 max before an overflow drawer is required)**; iOS tab bars target **"about five or fewer"**; desktop global nav gets unwieldy past **7–9** and should move to a sidebar. Treat 5–9 as a soft convention band shaped by content scope, device real estate, and label recognizability — not a cognitive law. See §4.3 and the honesty flag in §8.
3. **Hidden navigation has a measured cost — spend it deliberately.** NN/g's comparative testing found hamburger-only nav used in only **27%** of desktop sessions vs **48–50%** for visible/combo nav; discoverability dropped **>20%**; task-difficulty ratings rose **21%**; completion was **≥39% slower on desktop, 15% slower on mobile**. Reserve the hamburger for genuinely "browse-mostly" mobile sites with many options and a tight space budget; never hide a desktop sidebar behind one. ([NN/g: Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/))
4. **Breadcrumbs are supplementary, never primary.** They encode the site's fixed hierarchy — not the user's click history — the current page is the final, unlinked item, and they're unnecessary on flat 1–2-level sites. Markup: `<nav aria-label="Breadcrumb"><ol>…<a aria-current="page">` on the last item only. ([NN/g: Breadcrumbs — 11 Design Guidelines](https://www.nngroup.com/articles/breadcrumbs/); [W3C APG Breadcrumb example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/))
5. **Don't remove global navigation to chase a "search-only" model unless data supports it.** Hiding categories hurts users who arrive via deep links with no homepage context; per NN/g, "just because this model works for Amazon doesn't mean it will work for other sites." Validate against click-tracking and bounce/order-size data before cutting nav. ([NN/g: Killing Off the Global Navigation](https://www.nngroup.com/articles/killing-global-navigation-one-trend-avoid/))
6. **For a task with a clear beginning and end, drop persistent navigation for a linear back-link + task-list model; reserve persistent top nav for tools used repeatedly with no fixed task order.** This is GOV.UK's tested, explicit decision rule, and it generalizes past government services to any product that mixes "do one thing" flows with "manage an ongoing thing" surfaces. ([GOV.UK Design System: Navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service)) Worked example in §4.9.
7. **Default a multi-step flow to one question/decision per screen; merge only when research supports it — and don't let merging hide an over-long flow.** ([GDS: One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)) For independently completable, resumable tasks rather than a strict sequence, use a **task list** instead — GOV.UK adopted it after finding **over 60% of user-support contacts** were confusion about the application process itself. ([GDS: the task list pattern](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern))
8. **Every wizard needs: visible step progress, an always-available and working Back, strict forward order (no skip-ahead), save-and-resume, and steps that carry enough context to stand alone.** Use wizards for **novice/infrequent, unfamiliar, high-stakes, or naturally segmentable** tasks; avoid them for **expert/repeated** tasks or anything needing cross-step comparison. ([NN/g: Wizards — Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/)) No authoritative universal "ideal step count" exists — see §8.
9. **Apply the modality decision rule in order:** (1) destructive/blocking, must resolve before continuing? → **modal**, short and specific; (2) lightweight edit fully scoped to what's already on screen? → **inline**; (3) secondary task where the primary view must stay visible/referenceable? → **drawer/sheet**; (4) heavy, deep, multi-step, or needs its own shareable URL? → **new page**. Table in §5.2; 4-task worked example in §4.9. ([NN/g: Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/); [NN/g: Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/))
10. **Confirmation dialogs only earn their interruption for serious, specific, and ideally abnormal actions.** Restate exactly what will happen; a generic "Are you sure?" trains users to click through blind, which is worse than no dialog at all. ([NN/g: Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/))
11. **Progressive disclosure has a hard practical ceiling of two levels.** Primary screen = everything most users need most often, chosen via task analysis/frequency data, not guesswork; one hop to a secondary screen for the rest. A third disclosure level is a documented usability failure pattern. ([NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/))
12. **Don't build onboarding by default — build a UI that doesn't need it.** NN/g's controlled test across **70 users / 4 apps** found near-identical task success with vs. without a tutorial (**91% vs. 94%**) and *higher* perceived ease for the group that skipped it (**5.49 vs. 4.92** on a 7-point scale). ([NN/g: Mobile Tutorials — Wasted Effort or Efficiency Boost?](https://www.nngroup.com/articles/mobile-tutorials/)) Where onboarding is genuinely warranted, keep it **skippable** and prefer contextual, progressive triggers over a front-loaded tour. ([NN/g: Mobile-App Onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/))
13. **Search beats browse once users can name what they want, the IA is deep/broad enough that browsing costs more than typing, or the user arrived mid-task with no context.** Design for decay: query success falls **51% (1st query) → 32% (2nd) → 18% (3rd)**; average query length is only **2.0 words**; search usability explained **43%** of the productivity gap between high- and low-usability intranets tested. Keep search visible on every page, not buried. ([NN/g: Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/); [NN/g: Is Navigation Useful?](https://www.nngroup.com/articles/is-navigation-useful/))
14. **Give users ≥2 redundant "you are here" cues at all times** (page title/H1, nav highlight, breadcrumb, URL) — this is an accessibility floor, not just good practice: **WCAG 2.4.8 Location (AAA)** wants location communicated; **2.4.5 Multiple Ways (AA)** requires at least two of {nav links, search, sitemap, table of contents, comprehensive link list, home-links-to-everything} to reach a given page (process-step pages are exempt). ([W3C: Understanding 2.4.8](https://www.w3.org/WAI/WCAG21/Understanding/location.html); [W3C: Understanding 2.4.5](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html))
15. **Put shareable/restorable state in the URL** — active tab, filters, sort, selection, search query, page number, wizard step — and pick the right History API call: `pushState` for a real navigational move (Back stays meaningful), `replaceState` for refining state within the same step (Back doesn't need 30 presses to escape a filter session). ([MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)) Worked example in §4.10.

---

## 4. Body

### 4.1 IA patterns — the five base shapes

Every navigation model sits on top of one of a small number of underlying information-architecture shapes. Pick the shape from the content's actual structure first; the nav model follows from it (§4.2).

| IA pattern | Structure | Nav model that fits | When to use | Example |
|---|---|---|---|---|
| **Hierarchical / tree** | Parent → child, largely one path down | Sidebar (+ breadcrumb for depth ≥3) | Content with real categorization and depth | Documentation site, file manager, admin console |
| **Hub-and-spoke** | Central hub; each spoke is a self-contained task; user returns to hub between tasks | Nav hub / bottom nav, "back to hub" always available | Task-based apps where a session accomplishes **one** thing | Flight check-in, banking-app home screen ([NN/g: mobile navigation patterns](https://www.nngroup.com/articles/mobile-navigation-patterns/)) |
| **Sequential / linear** | Fixed order, A → B → C → done, steps may depend on prior answers | Wizard with progress + Back | Data collection with dependencies; checkout; regulated applications | Checkout flow, GOV.UK "apply for…" services |
| **Flat** | All items effectively one level, no real hierarchy | Single top nav or menu; no breadcrumb needed | Small sites/apps (roughly <15–20 destinations) | Marketing site, single-feature tool |
| **Faceted / matrix** | Items tagged with multiple independent attributes; many valid paths to the same item | Facet/filter panel layered over a list, not the primary nav | Large catalogs or datasets with genuinely independent attributes | E-commerce catalog, admin data table, search results |

The hierarchical/hub-and-spoke/sequential/matrix taxonomy is standard IA teaching, canonically associated with Rosenfeld, Morville & Arango's *Information Architecture: For the Web and Beyond* ([reference](https://books.google.com/books/about/Information_Architecture.html?id=vJWJCgAAQBAJ) — textbook citation, not independently re-verified page-by-page this session; see §8). The hub-and-spoke and flat-vs-hierarchical distinctions for mobile are corroborated directly by NN/g's mobile navigation patterns article above.

**Faceted vs. filtered — don't over-build.** A filter excludes items from one dimension; faceted navigation exposes **multiple independent dimensions simultaneously** and helps users understand the shape of the content space itself. Faceted nav is more powerful but costs more — comprehensive metadata tagging plus a more complex interface — and adds interaction cost of its own. Verify users need that complexity before building it; a simple filter is often faster to build and to use. ([NN/g: Filters vs. Facets](https://www.nngroup.com/articles/filters-vs-facets/))

### 4.2 Nav-model selection — breadth × depth

The core selection tool is a 2-axis matrix: how many top-level sections (**breadth**), and how many levels deep content goes (**depth**).

| Breadth ↓ / Depth → | Shallow (≤2 IA levels) | Deep (3+ IA levels) |
|---|---|---|
| **Narrow** (≤5 sections) | Top nav alone | Top nav + breadcrumb |
| **Broad** (6–9 sections) | Top nav (tight) or sidebar | Sidebar + breadcrumb |
| **Very broad** (10+ sections, or expected to grow) | Sidebar, grouped; mega-menu if it's a marketing/content site | Sidebar + breadcrumb + command palette |

**Overlays — apply on top of any cell:**
- Sibling views of one object at any cell → add **tabs** within that section, don't fork the primary nav for it.
- Keyboard-first power users on a desktop tool, at any cell → layer a **command palette** on top; it's an accelerator, never the sole path (Rule 1).
- Mobile viewport collapses the top row: top nav/sidebar → **bottom nav** (3–5 items, 6 max) + an overflow **off-canvas drawer** for the rest (§5.1).
- A task with a clear start/end at any cell → drop the persistent model *for that flow specifically*; use a back-link + wizard/task-list instead (Rule 6, §4.8–4.9).

**Worked example — nav-model selection for a data-dense desktop admin tool:**

*Scenario:* an internal analytics/ops console. IA: 6 top-level domains (Dashboards, Customers, Orders, Catalog, Reports, Settings), each with 3–10 sub-views; record drill-down runs up to 4 levels deep (list → record → related record → related record); users are internal power users spending 4+ hours/day in the tool; the domain list is expected to keep growing.

1. **Breadth = 6 domains today**, but "expected to keep growing" plus internal/enterprise use pushes this into the **broad, growing** case even though 6 alone would look "narrow." Per Rule 1, choose **sidebar**, not top nav — vertical nav is explicitly recommended for "B2B, enterprise… areas likely to grow." ([NN/g: vertical-nav](https://www.nngroup.com/articles/vertical-nav/))
2. **Depth within a domain** (Customers → All customers / Segments / Imports) is a small, fixed set of sibling views of the same object type → **tabs** inside the domain's page. Cap sidebar nesting at one level; push further depth into tabs or the page itself.
3. **Record drill-down** (list → record → related record, 4 levels) means users will land mid-hierarchy from search, saved links, or a shared Slack message → add a **breadcrumb** alongside the sidebar+tabs to satisfy WCAG 2.4.8/2.4.5 (§4.5). Not used at the domain level — only inside record views.
4. **Power users need to jump** across 6 domains × ~6 sub-views × N records without mousing through the sidebar every time → layer a **command palette** (Cmd/Ctrl+K) built on `cmdk` or `kbar` (both MIT — §5.1), indexed over domain names, sub-view names, and record search.
5. **State must be shareable** ("orders filtered to refunded, sorted by date, row `ord_8842` selected" pasted into a ticket) → mirror **tab + filter + sort + selection** into the URL (§4.10).

*Resulting stack:* **Sidebar** (6 domains, left-aligned, text-labeled, scales via grouping) + **Tabs** (sibling sub-views) + **Breadcrumb** (record drill-down only) + **Command palette** (global accelerator) + **URL state** (tab/filter/sort/selection). This is the normal shape of a mature dense desktop product — nav models compose; hunting for a single "right" model for the whole product is the wrong frame.

### 4.3 How many top-level items, really?

| System / convention | Recommended count | Source |
|---|---|---|
| Mobile bottom nav (tab bar) | **3–5** primary destinations; **6** max before an overflow pattern is required | Material Components bottom-navigation spec, verified via [component mirror](https://github.com/material-components/material-components-ios/blob/c8b8acabf8c78b9e266c33803848e9e67967fe73/components/BottomNavigation/docs/README.md) |
| iOS tab bar | **~5 or fewer**; promote to a sidebar for complex hierarchies on wider layouts | [Apple HIG: Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (content JS-gated at fetch time; cross-verified via mirror, see §8) |
| Desktop global/top nav | Workable to roughly **7–9**; beyond that, or if the IA will keep growing, move to a sidebar | [NN/g: vertical-nav](https://www.nngroup.com/articles/vertical-nav/) |
| Alphabetized menus | Alphabetical ordering pays off mainly past **~20 items**; under **~10** categories, a meaningful grouping beats the alphabet | [NN/g: Top 3 IA Questions about Navigation Menus](https://www.nngroup.com/articles/ia-questions-navigation-menus/) |
| "Magic number 7" (Miller's Law, 1956) | **Does not govern menu size.** It's a working-memory finding, and NN/g explicitly rejects its application to nav-item counts | [NN/g video](https://www.nngroup.com/videos/number-items-navigation-menu/); Miller's original finding is summarized at [Miller's law — Wikipedia](https://en.wikipedia.org/wiki/Miller%27s_law) (secondary; original 1956 *Psychological Review* paper not independently re-fetched this session) |

**Honesty flag:** NN/g states the answer is driven by "4 main factors," but the source consulted here is a 3-minute video and only its text summary was retrievable — the four factors themselves were **not** extracted verbatim and are not asserted here (see §8). Treat the 5–9 convention band above as triangulated from adjacent, text-verified sources, not as a direct restatement of NN/g's four factors.

### 4.4 Search as navigation — when search beats browse

| Condition | Favors | Evidence |
|---|---|---|
| User can name the target (navigational/transactional intent) | Search | — |
| IA is deep/broad enough that browsing would cost several clicks | Search — but make the **first** query count | Query success decays **51% → 32% → 18%** across the 1st–3rd query attempt ([NN/g: Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/)) |
| User arrived mid-task via a deep link, no homepage context | Search, or breadcrumb-back — not top-level browse | — |
| User is exploring without a defined target, or vocabulary mismatch is likely | Browse/nav | Average query length is only **2.0 words** — most users never use advanced/Boolean syntax ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)) |
| Content is thin (a handful of pages) | Browse/nav — a search box adds cost for no benefit | — |
| (general) | Keep search **visible on every page** | Search usability explained **43%** of the productivity gap between high- and low-usability intranets tested; nearly half of users abandon immediately after one failed query ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)) |

Underlying behavior: users "go straight at the content and ignore the navigation" on scan, and turn to search specifically **when they are lost** — so search functions partly as an escape hatch from a failed nav model, not just an alternative to it. ([NN/g: Is Navigation Useful?](https://www.nngroup.com/articles/is-navigation-useful/)) On mobile, faceted filtering and search are often combined behind a results-count-labeled tray rather than kept as separate systems. ([NN/g: Mobile Faceted Search with a Tray](https://www.nngroup.com/articles/mobile-faceted-search/) — noted for further reading; not deep-verified this session, see §8.)

### 4.5 Wayfinding & orientation — "you are here"

Users frequently land mid-site via search results or shared links with zero homepage context, so location must be communicated redundantly, on every page, not just inferred from a single element.

**Eight signaling mechanisms** (use at least two together — see WCAG table below):

| Mechanism | How it signals location |
|---|---|
| Branding/logo | Confirms whose product this is; logo should link home |
| Nav highlighting | Current section is visually distinguished within the nav itself |
| Headings | A clear heading hierarchy gives pathway context at a glance |
| Page title & URL | Descriptive `<title>`/H1 and a human-readable path reveal IA position |
| Breadcrumbs | A linked hierarchy path exposes ancestor pages |
| Contextual cues | Dates, tags, category icons situate content in time/structure |
| Visual/section styling | Color-coding or chrome changes signal a section change |
| Progress steps | A numbered sequence shows position within a flow (checkout, wizard) |

Source: [NN/g: Navigation — You Are Here](https://www.nngroup.com/articles/navigation-you-are-here/); complementary: [NN/g: Local Navigation Is a Valuable Orientation and Wayfinding Aid](https://www.nngroup.com/articles/local-navigation/) — local (sibling-page) navigation should stay **visible but less salient** than global navigation, and works best when analytics show exploratory, multi-subpage browsing within a category.

**The accessibility floor for wayfinding:**

| Success criterion | Level | Requirement | Typical technique |
|---|---|---|---|
| **2.4.1 Bypass Blocks** | A | A mechanism exists to skip repeated content blocks | "Skip to main content" link; ARIA landmarks |
| **2.4.5 Multiple Ways** | AA | ≥2 ways exist to locate a given page (nav links, search, sitemap, table of contents, comprehensive link list, home-links-to-everything); pages that result from completing a process are exempt | Persistent nav **and** a visible search box |
| **2.4.8 Location** | AAA | The user's location within the set of pages is available | Breadcrumbs, nav highlighting, `aria-current` |

Sources: [W3C Understanding 2.4.1](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html), [2.4.5](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html), [2.4.8](https://www.w3.org/WAI/WCAG21/Understanding/location.html). Mark the current page/step programmatically with `aria-current="page"` (breadcrumbs, current nav item) or `aria-current="step"` (wizard progress) — never rely on color alone. ([MDN: `aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current))

### 4.6 Onboarding & first-run

| Component | What it does | Verdict |
|---|---|---|
| **Feature promotion** | Markets what the app can do | Reads as marketing to users; use sparingly |
| **Customization** | Collects setup/preference data upfront | Legitimate when personalization genuinely depends on it; prefer content-based over cosmetic |
| **Instructions** (coach marks, deck-of-cards tutorial, interactive walkthrough) | Teaches interface mechanics | NN/g found tutorials **did not improve task performance**; favor contextual help delivered when a feature becomes actionable |

Source: [NN/g: Mobile-App Onboarding: An Analysis of Components and Techniques](https://www.nngroup.com/articles/mobile-app-onboarding/).

**The data on tutorials specifically** (NN/g, 70 users across 4 mobile apps): task success **91% with a tutorial vs. 94% without**; perceived ease **4.92 vs. 5.49** (7-point scale, higher = easier, favoring the no-tutorial group); completion time showed no meaningful difference (**93.49 s vs. 85.17 s**). Conclusion: "tutorials take time and effort to design and develop, and those would be better spent making the UI easy to use." ([NN/g: Mobile Tutorials — Wasted Effort or Efficiency Boost?](https://www.nngroup.com/articles/mobile-tutorials/))

**Decision rule:** avoid onboarding by default. Build it only when (a) required setup data genuinely can't be inferred, (b) the experience is meaningfully personalized by it, or (c) an interaction pattern is truly novel/non-standard. When you do build it: make **Skip** highly visible at every step, and prefer progressive/contextual triggers (show the tip when the feature becomes relevant) over a front-loaded tour.

### 4.7 Progressive disclosure

**Definition:** defer advanced or rarely used options to a secondary screen so the primary screen stays learnable and low-error; the mechanism to get to the secondary screen must be simple, visible, and carry strong "information scent" about what's behind it. ([NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/))

| Put on the primary screen if… | Defer to secondary if… |
|---|---|
| Most users need it most sessions | Only specialists or edge cases need it |
| It's required to complete the core task | It only customizes/optimizes an already-completable task |
| Frequency-of-use data (analytics, task analysis, field studies) confirms high use | Usage data shows it's rarely touched |
| — | Including it on the primary screen would clutter or slow the majority |

**Hard ceiling: two levels.** Decide the primary/secondary split using task analysis, frequency-of-use statistics, and usability testing — not intuition. Designs that add a third disclosure level are a documented usability failure pattern; users get lost navigating between levels. This directly bounds mega-menu granularity (§5.1) and command-palette result grouping alike.

### 4.8 Wizards & multi-step flows

**When to use a wizard vs. not**, per NN/g's definition ("a step-by-step process… in which subsequent steps may depend on information entered in previous ones"):

| Use a wizard for | Avoid a wizard for |
|---|---|
| Novice users or infrequent processes (setup, configuration) | Repeated tasks that need efficiency |
| Users without domain expertise in the task | Expert users with a different mental model |
| Complex information that benefits from segmentation | Tasks requiring comparison of data across steps |
| — | Situations that need frequent interruption |

Source: [NN/g: Wizards — Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/), which also specifies: show a list/diagram of all steps with the current one highlighted; enforce strict sequence (no skip-ahead/reorder); label Next/Back descriptively, not generically; allow exit-and-resume; keep each step self-sufficient; place help beside the step without covering it; default to the user's prior selections where relevant.

**Three flow patterns, compared** (GOV.UK Design System — code and guidance are MIT-licensed and reusable):

| Pattern | Structure | Use when | Progress cue |
|---|---|---|---|
| **One-thing-per-page** (linear wizard) | Strict sequence, one question per screen | Clear dependency chain; novice/infrequent users; needs clean error handling and conditional branching | "Question *X* of *Y*" — omit or update the total dynamically if it varies by answer path |
| **Task list** | Grouped, orderable tasks; some optional, some parallel | Multiple discrete tasks that may not be strictly sequential, may span sittings, or mix online/offline steps | Per-task status labels (e.g. "COMPLETED"), not one global bar |
| **Check your answers** | Single review page immediately before submission (or per-section for long transactions) | End of any transaction — always, regardless of which of the above patterns preceded it | Not progress — a review/edit surface, with "Change" links that return to check-answers afterward |

Sources: [GDS: one thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/); [GDS: the task list pattern](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern) (origin: **>60%** of a service's user-support contacts traced to confusion about the application process); [GOV.UK: Check answers pattern](https://design-system.service.gov.uk/patterns/check-answers).

**On step count — an honest gap.** No primary source reviewed here gives a universal "ideal" number of wizard steps; GOV.UK explicitly lets the total vary per user and either omits or dynamically updates it rather than fixing a number. The nearest available *complexity* number is field-based, not step-based: average e-commerce checkout collects **11.3 form fields**, and **22%** of shoppers report having abandoned a checkout for being too long/complicated ([Baymard Institute: Checkout Optimization — Minimize Form Fields](https://baymard.com/blog/checkout-flow-average-form-fields)). Use field/decision count as your complexity budget, and validate actual step count with task analysis — not a fixed target (§8).

### 4.9 Modality — the decision rule

**Algorithm** (evaluate in this order; the first match wins):

```
IF the action is destructive/blocking AND the user must resolve it before continuing
    → MODAL (keep it short, specific — restate exactly what will happen; Rule 10)
ELSE IF the change is fully scoped to content already visible on screen AND low-risk
    → INLINE
ELSE IF it is a secondary task AND the user needs the primary view to stay visible/referenceable
    → DRAWER / SHEET
ELSE  (heavy, deep, multi-step, or needs its own shareable/resumable URL)
    → NEW PAGE
```

This operationalizes NN/g's modal guidance (use modals for irreversible-action confirmation, must-answer-before-continuing input, or a short focused sub-task; avoid them for nonessential content, high-stakes flows like checkout, or anything requiring background reference — [NN/g: Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)) together with the bottom-sheet modal/nonmodal split (nonmodal sheets keep background content interactive and referenceable — the Google Maps pin-detail pattern; expandable sheets often start nonmodal and become modal only once fully expanded — [NN/g: Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/)).

**Worked example — modality decision applied to four concrete tasks:**

| Task | Weight | Needs background context? | Reversible? | → Modality | Why |
|---|---|---|---|---|---|
| Mark one invoice row "Paid" in a table | Trivial (1 field) | Yes — must stay in the table | Yes | **Inline** | Fully scoped to the visible row; a modal would interrupt for no reason |
| Reply with a canned response while triaging a support queue | Moderate (bounded, multi-field) | Yes — must keep seeing the queue/ticket | Yes | **Drawer / side panel** | Secondary to the primary triage task; user returns to the list immediately after |
| Confirm permanent deletion of a project and its data | Trivial (1 decision) | No | **No — irreversible** | **Modal** | Short, blocking, must resolve before continuing; text must restate specifics, not "Are you sure?" |
| Complete identity verification (document upload + liveness + address) | Heavy (multi-step, branches) | No — becomes its own task | Partially | **New page (wizard/task list)** | Deep/heavy, needs its own URL to resume, must not be dismissible by an accidental click-outside |

The reasoning transfers to any task: run it through the four-line algorithm above; don't default to a modality out of habit or implementation convenience.

### 4.10 Deep-linking & URL-state

**What belongs in the URL vs. what doesn't:**

| Belongs in the URL | Does NOT belong in the URL |
|---|---|
| Active tab/view | Hover/focus state |
| Applied filters & sort order | Draft/unsaved form text (use component state or `localStorage`) |
| Pagination page | Animation-in-progress flags |
| Selected item/record ID | Auth tokens or other secrets (never — use cookies/headers) |
| Search query | Transient loading/spinner state |
| Wizard step, if each step is a real, resumable page | — |

**Rule of thumb:** if a teammate should be able to receive it as a link and land on the *exact same view*, it belongs in the URL. If it's purely transient UI chrome, it doesn't.

**`pushState` vs. `replaceState`:** `pushState(state, '', url)` adds a new history entry — use it for a genuine navigational move (switching tabs, drilling into a record) so the Back button is meaningful. `replaceState(state, '', url)` updates the current entry in place — use it for refining state within the same step (adjusting a filter, nudging a sort) so Back doesn't require dozens of presses to escape a filtering session. Both are native, zero-dependency, and safe under a strict CSP (no `eval`, no network). ([MDN: Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API))

**Worked example — deep-linking a filtered, tabbed data table:**

Target shareable URL:
```
/orders?tab=refunds&status=pending&sort=-created_at&page=2&selected=ord_8842
```

```js
// Real navigational move: switching tabs → pushState (Back should return to the previous tab)
function setTab(tab) {
  const url = new URL(location.href);
  url.searchParams.set('tab', tab);
  history.pushState({ tab }, '', url);
  render();
}

// Refinement within the same step: tweaking a filter → replaceState
// (Back shouldn't require one press per filter click to escape the table)
function setFilter(key, value) {
  const url = new URL(location.href);
  value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  history.replaceState(history.state, '', url);
  render();
}

// Restore on load and on Back/Forward
window.addEventListener('popstate', render);
function render() {
  const p = new URLSearchParams(location.search);
  applyState({
    tab: p.get('tab') ?? 'all',
    status: p.get('status'),
    sort: p.get('sort') ?? '-created_at',
    page: Number(p.get('page') ?? 1),
    selected: p.get('selected'),
  });
}
```

Practical ceiling: keep query strings reasonably short — a commonly cited cross-browser/server practical safe limit is **~2000 characters**; this figure is widely repeated web-engineering convention and was not re-verified against a primary source this session (see §8) — confirm against your actual target browsers/CDN/server before relying on it for a state-heavy design.

---

## 5. Options catalogue

### 5.1 Navigation models

Columns: **model · when to use · when NOT · app type/depth fit · a11y notes · pitfalls.** Visual styling of any model below is owned by C1/A-group; this table is model-*selection* only.

| Model | When to use | When NOT | App type / depth fit | A11y notes | Pitfalls |
|---|---|---|---|---|---|
| **Top nav** (global horizontal) | Shallow-to-moderate breadth (≤~9 top items); marketing/content/brand-forward products; desktop-first | >9 sections; IA likely to keep growing; dense internal tools; mobile-first with many items | Shallow-broad (marketing, brochure, content sites); depth 1–2 | `<nav aria-label>` landmark; simple links need no extra ARIA; dropdowns must be keyboard-operable | Cramming too many items forces wrapping/truncation; hover-only submenus break on touch; hiding it below the hamburger threshold hurts discoverability (Rule 3) |
| **Sidebar** (left vertical) | Broad and/or growing IA (>7–9 top sections); desktop apps; B2B/enterprise/admin/gov/health; needs room for icons+labels+grouping | Small marketing sites; narrow mobile viewports (collapses to drawer/bottom nav); very shallow apps | Deep+broad (dashboards, admin panels, docs); scales via grouped sections | Nav landmark with label; real links, not menubar semantics, unless it behaves like a native app menu; mark current section `aria-current="page"` | Never hide behind a hamburger on desktop (explicit NN/g rule); icon-only without labels hurts recognition; unlimited nesting degrades scannability — cap at ~1 level ([NN/g: vertical-nav](https://www.nngroup.com/articles/vertical-nav/)) |
| **Tabs** | Switching between sibling views of the *same* object/dataset, all available now, small fixed set (~2–7) | Sequential/dependent steps (use a wizard); unrelated destinations (use nav); long unbounded "tab" lists (use nav/dropdown) | Within-section navigation; depth-agnostic | Full [ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-controls`/`aria-labelledby`, roving arrow-key focus; choose automatic vs. manual activation | Using tabs for what's really a dependent wizard; too many tabs forces scroll/overflow; nesting tabs within tabs |
| **Breadcrumb** | Hierarchical content ≥3 levels deep; users can land mid-hierarchy via search/deep link; need "how do I get back up" | Flat/1–2 level sites; as a *replacement* for real nav; to show session/click history (it is not a back button) | Deep hierarchical (docs, file systems, catalogs, drill-down records); supplementary at any breadth | `<nav aria-label="Breadcrumb"><ol>` + `aria-current="page"` on the last, unlinked item ([W3C APG example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/)) | Linking the current page; showing multiple parent paths on multi-parent taxonomies (pick one canonical path); wrapping to multiple lines on mobile |
| **Command palette** | Power users; keyboard-first workflows; large, flat, searchable action/content space; desktop-class apps used for hours | Sole/only nav for new or occasional users (low discoverability without a visible trigger); touch-only contexts; small item sets where browsing is just as fast | Any depth — it *bypasses* hierarchy via search; best layered on top of a primary model, not a replacement for one | Implements the [ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (text input + listbox popup, managed active-descendant focus, `aria-expanded`); must have a visible open affordance too, not shortcut-only | Shipping it as the *only* way to navigate; poor fuzzy-match relevance; incorrect focus trapping; `cmdk` handles ~2,000–3,000 items before virtualization is needed — plan accordingly for larger sets ([cmdk](https://github.com/pacocoursey/cmdk)) |
| **Bottom nav** (tab bar) | Mobile apps; **3–5** primary destinations (6 max); each a top-level peer; frequent switching | >6 destinations; desktop; secondary/rare actions; deep hierarchies (nest those inside a tab's own section, don't make them peers) | Shallow-broad, mobile, task-based; depth 1 at the bar itself | Label every icon with text, not icon-only; persistent across scroll; mark active tab; meet touch-target size | Exceeding ~5–6 forces a catch-all "More" tab; reordering/relabeling between sessions breaks muscle memory |
| **Mega-menu** | Large sites with many features/categories needing two IA levels visible at once; hub-style category sites | Small IA (<~15–20 destinations — a normal dropdown suffices); mobile (needs a distinct collapsed pattern); would hide the search box | Shallow trigger (top nav) exposing depth-2 in one view; broad IA | Implement via the [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) or the [Menubar navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/) — not a bespoke hover-only widget; top-level items must be real links to real pages | No hover-intent delay causes flicker — use **~0.5 s** stationary-mouse-before-open and **~0.5 s** after pointer-exit before close; over-granular grouping overwhelms ([NN/g: Mega Menus Work Well for Site Navigation](https://www.nngroup.com/articles/mega-menus-work-well/)) |
| **Off-canvas / hamburger drawer** | Mobile, "browse-mostly" sites with many options and a tight space budget; overflow after bottom-nav's 5–6 slots are placed | Primary nav for a small option set (a visible bar wins — Rule 3's numbers); desktop (never hide a sidebar behind one) | Mobile; broad-IA overflow | [Disclosure navigation pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/): button with `aria-expanded` controlling a nav landmark; manage focus on open/close; `Escape` closes | Measured costs are real: up to **39%** slower task completion on desktop, **>20%** discoverability drop vs. visible/combo nav ([NN/g: hamburger-menus](https://www.nngroup.com/articles/hamburger-menus/)); gesture-only reveal is worse still |
| **Step indicator / wizard nav** | Sequential task with real dependencies; sign-up/checkout/application flows; novice or infrequent users | Expert users doing repeated/familiar tasks; tasks needing cross-step comparison; non-linear task sets (use a task list — §4.8) | Sequential IA; typically single-path, can branch conditionally | `aria-current="step"` on the active indicator; each step ideally its own deep-linkable URL; Back must be a real, working, labeled control at every step | Allowing skip-ahead without validation; hiding a fixed total step count; losing entered data on Back ([NN/g: Wizards](https://www.nngroup.com/articles/wizards/)) |

### 5.2 Modality decision table

**Decision rule** (also in §4.9): `destructive+blocking → MODAL` → else `scoped+low-risk → INLINE` → else `secondary task needing background context → DRAWER/SHEET` → else `heavy/deep/needs a URL → NEW PAGE`.

| Modality | Task weight | Interruption cost | Context needed | When to use | When NOT | Pitfalls |
|---|---|---|---|---|---|---|
| **Modal** | Light, short (one decision or small required input) | High **by design** — blocks everything else on purpose | Little to none — must be self-contained; if the user needs to see background info to decide, the modal has failed | Irreversible/destructive-action confirmation; must-answer-before-continuing input; a short focused sub-task | Nonessential content (ads/newsletter signup); high-stakes flows like checkout; anything needing background reference; anything that's really a multi-step task | Overuse causes "are you sure?" blindness ([NN/g: confirmation-dialog](https://www.nngroup.com/articles/confirmation-dialog/)); stacking modals on modals; using a modal for what's actually a wizard |
| **Drawer / sheet** | Moderate — a self-contained side task | Low–moderate; nonmodal variants keep the background interactive, fully-expanded/modal sheets block like a modal | High — the point is keeping the primary view visible/referenceable | Secondary task alongside a primary one (respond to a ticket while the list stays visible; view a map pin's details; a filters panel) | Task is actually the user's main goal right now (give it a page instead); content needs to be its own shareable/bookmarkable destination | Not deciding modal-vs-nonmodal up front — expandable sheets shift between the two and must do so intentionally ([NN/g: bottom-sheet](https://www.nngroup.com/articles/bottom-sheet/)); drawer content that itself needs deep navigation is a complexity smell |
| **Inline** | Trivial–light (single field/action) | None — stays in flow | Full — the task *is* the visible context | Quick edits fully scoped to visible content (rename, status toggle, reorder); on-the-spot validation | Action has consequences beyond the visible row/field; needs multi-field input; is irreversible | Cramming too much into an inline editor; no clear save/cancel affordance; losing the edit on accidental navigation |
| **New page** | Heavy, deep, multi-step | User explicitly chose to leave — expected, not an interruption | Low — the task becomes the new context; link back if needed | Complex workflows (wizards/task lists); anything needing its own URL to resume/share/bookmark; many fields/steps/branches (checkout, KYC, applications) | Task is trivial (inline is faster); task is secondary to another still-open task (use a drawer instead) | Forcing full navigation for a one-field edit; losing the "return to where I was" path; not preserving the origin page's scroll/selection state |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Hamburger hides primary nav for a small option set or on desktop** | Nav click-through <30%; high bounce on landing pages; session recordings show search-first behavior | Promote to a visible top nav or sidebar; reserve the hamburger for genuine mobile overflow (§5.1, Rule 3) |
| **Breadcrumb built from click history, not IA** | Breadcrumb trail changes depending on how the user navigated in | Derive the breadcrumb from the site's fixed hierarchy; one canonical path only (§4.1, Rule 4) |
| **Sidebar hidden behind a hamburger on desktop** | Nav requires a click to reveal on wide viewports | Always show the sidebar on desktop; hamburger is a mobile-only pattern (§5.1) |
| **Nav item count creeps past usable range with no regrouping** | Top nav wraps to 2 lines; sidebar list scrolls with no sections/grouping | Regroup under real categories; move to sidebar+grouping or add a command palette (§4.3, §4.2) |
| **Command palette shipped as the *only* navigation** | No visible way to discover it exists except by accident/docs; new-user task success is low | Keep a visible primary nav; the palette is an accelerator with a visible trigger, not a hidden shortcut (§5.1) |
| **Modal used for a multi-step or high-stakes flow** | Modal contains its own internal Next/Back; an "are you sure" appears mid-checkout | Move to a dedicated page/wizard with a URL per step (§4.9, §5.2) |
| **Confirmation-dialog fatigue** | Fast click-to-dismiss telemetry; destructive actions still happen "by accident" anyway | Reserve confirmation for genuinely severe/abnormal actions; restate specifics instead of "Are you sure?" (Rule 10) |
| **Wizard with no visible progress or no working Back** | Usability testing shows mid-flow abandonment; "how many more steps" support questions | Add a step list/progress indicator + an always-available Back that preserves entered data (§4.8) |
| **"One thing per page" taken too literally** | Absurdly long question count for a simple task; heavy step-fatigue drop-off | Merge closely related questions where research supports it; treat "too many questions" as a scope problem, not just a pagination problem (§4.8) |
| **Filters/tab/selection missing from the URL** | Users can't share a link to "this exact view"; refresh loses state; Back exits the app entirely | Mirror tab/filter/sort/selection/page into the URL via `pushState`/`replaceState` (§4.10) |
| **Every filter tweak pushes a new history entry** | Back button needs many presses to escape a filtering session | Use `replaceState` for same-step refinements; `pushState` only for real navigational moves (§4.10, Rule 15) |
| **Onboarding tutorial forced on every first run, unskippable** | High onboarding-abandonment; "just let me in" feedback | Make it skippable; prefer contextual/progressive triggers over a front-loaded tour — tutorials didn't improve success in NN/g's test (§4.6) |
| **Faceted navigation built where a simple filter would do** | High engineering cost; analytics show most users touch only one filter | Downgrade to simple filters unless content genuinely has many independent attributes (§4.1) |
| **Tabs used for sequential/dependent steps** | Tab 2 doesn't make sense without completing tab 1; users jump ahead and hit errors | Convert to a wizard with enforced order, or disable not-yet-available tabs with a clear reason (§5.1) |
| **Mega-menu with no hover-intent delay** | Menu flickers open/closed as the pointer crosses the nav bar | Add ~0.5 s stationary-before-open and ~0.5 s after-exit-before-close (§5.1) |
| **Missing landmark / current-page semantics** | Automated audit (e.g. axe) or screen-reader pass shows nav without `aria-label`, no `aria-current` anywhere | Apply the APG patterns exactly: nav landmark + `aria-current="page"`/`"step"`, `tablist`/`tab`/`tabpanel`, `aria-expanded` on disclosures (§4.5, §5.1) |

---

## 7. Pre-flight checklist (run before shipping any nav or flow)

- [ ] The primary nav model was chosen from the **breadth × depth matrix** (§4.2), not from taste; growth trajectory was considered, not just today's count.
- [ ] Top-level item count sits in a defensible range for the surface (top nav ~≤9, sidebar unlimited-with-grouping, bottom nav 3–5/6 max, tabs ~2–7) — and nobody cited "7±2" as the reason (§4.3).
- [ ] Hidden/hamburger nav is used only where its measured cost (§ Rule 3) is acceptable — never as the sole desktop nav.
- [ ] Breadcrumbs (if present) reflect fixed hierarchy, not click history, end unlinked on the current page, and are skipped on flat/shallow sections (§5.1).
- [ ] A command palette (if present) is an *addition* to a visible primary nav, not a replacement for one, and is built on a free/open, keyboard-accessible library (`cmdk`, `kbar`, or Radix primitives — all MIT).
- [ ] Every multi-step flow shows **progress + a working Back** and enforces sequence only where steps truly depend on each other (§4.8).
- [ ] Non-linear, resumable, multi-task services use a **task list**, not a forced linear wizard (§4.8).
- [ ] A **check-your-answers/review** step exists immediately before final submission on any transactional flow (§4.8).
- [ ] Every interruption's modality was chosen by the **§4.9/§5.2 decision rule** (destructive+blocking → modal; scoped+low-risk → inline; secondary+context-needed → drawer; heavy/deep → new page) — not by default habit.
- [ ] Confirmation dialogs are reserved for serious/abnormal actions and restate specifics; none say only "Are you sure?" (Rule 10).
- [ ] Onboarding (if present) is skippable, and its necessity was justified against the "avoid by default" baseline (§4.6).
- [ ] No disclosure pattern goes past **two levels** (§4.7).
- [ ] Search is visible on every page if the IA is deep/broad enough that browsing alone would fail (§4.4).
- [ ] At least **two** redundant "you are here" cues are present on every screen, satisfying WCAG 2.4.5 (≥2 ways to a page) at minimum, 2.4.8 where feasible (§4.5).
- [ ] Shareable state — tab, filters, sort, selection, search query, page, wizard step — lives in the **URL**, with `pushState` for real navigation and `replaceState` for in-place refinement (§4.10).
- [ ] Every nav widget uses the matching **ARIA APG pattern** (tabs, breadcrumb, disclosure, menubar, combobox) rather than ad hoc markup (§5.1).

---

## 8. Open questions / unverified

- **NN/g's "4 factors" for menu-item count** were referenced by title only ("4 main factors determine the answer, but it's not 7") — the video itself was not transcribed in this research pass, so the specific factors are **not** asserted anywhere in this report. The 5–9 convention band in §4.3 is triangulated from separate, text-verified sources (vertical-nav, Material, Apple), not a restatement of NN/g's four factors. Re-fetch/watch the video directly if the exact factors matter for a specific decision.
- **No universal "ideal wizard step count"** was found in any primary source reviewed. GOV.UK explicitly varies the total per user and avoids a fixed target; treat any claim of "wizards should have exactly N steps" as an unverified myth. The field-count proxy (11.3 average fields, 22% abandonment) is from Baymard's checkout research specifically, not wizards generally (§4.8).
- **Material Design 3 (`m3.material.io`) and Apple HIG (`developer.apple.com`) navigation pages require client-side JavaScript to render** for the fetch method used in this research pass, so the "3–5, up to 6" bottom-nav and "~5 or fewer" tab-bar numbers were cross-verified via, respectively, an official Material-Components-iOS GitHub markdown mirror and a third-party HIG-content mirror rather than the live pages. Both are living documents — re-verify against the current `m3.material.io/components/navigation-bar/guidelines` and `developer.apple.com/design/human-interface-guidelines/tab-bars` at build time.
- **Baymard's "Why Your Checkout Process Should Be Completely Linear" article's specific arguments/numbers were not extractable** in this pass (title and existence confirmed via Baymard's resource index only). The 11.3-field / 22%-abandonment figures cited in §4.8 come from a different, related Baymard page and are solid; the linearity article's own claims should be re-fetched directly before being quoted.
- **The ~2000-character practical URL-length ceiling** (§4.10) is widely repeated web-engineering convention, not re-verified against a primary browser/server spec in this session — confirm against your actual target environment before relying on it.
- **Long-tail command-palette libraries** listed by the `awesome-command-palette` aggregator (e.g. `ninja-keys`, `react-command-palette`, `vue-command-palette`, `scoutbar`, `kmenu`, `command-pal`) were **not individually license-verified** here. Only `cmdk` (MIT), `kbar` (MIT), and Radix Primitives (MIT, © WorkOS) were confirmed directly against their LICENSE files — treat those three as the safe recommended stack and verify any other entry's license before adoption.
- **The five-part IA taxonomy** (hierarchical, hub-and-spoke, sequential, flat, faceted) is standard, widely-taught IA theory conventionally traced to Rosenfeld, Morville & Arango's *Information Architecture: For the Web and Beyond*; this was cited as a bibliographic/textbook reference (Google Books listing) rather than independently re-verified page-by-page against fetched web content this session.
- **Miller's Law / "7±2"** (Miller, 1956, *Psychological Review*) is cited here via its Wikipedia summary as a stable secondary source; the original paper was not re-fetched. Its relevance to this report is specifically that NN/g's *current* UX research says it does **not** govern nav-menu sizing — the historical psychology finding itself is not in dispute, only its popular misapplication to navigation design.

---

## 9. Sources

Primary / authoritative:
- [NN/g — Left-Side Vertical Navigation on Desktop](https://www.nngroup.com/articles/vertical-nav/) — sidebar vs. top nav, 7–9 threshold.
- [NN/g — Breadcrumbs: 11 Design Guidelines for Desktop and Mobile](https://www.nngroup.com/articles/breadcrumbs/).
- [NN/g — Modal & Nonmodal Dialogs: When (& When Not) to Use Them](https://www.nngroup.com/articles/modal-nonmodal-dialog/).
- [NN/g — Bottom Sheets: Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/).
- [NN/g — Basic Patterns for Mobile Navigation: A Primer](https://www.nngroup.com/articles/mobile-navigation-patterns/).
- [NN/g — Is Navigation Useful?](https://www.nngroup.com/articles/is-navigation-useful/).
- [NN/g — Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/) — search success-rate decay, query length, productivity share.
- [NN/g — Mega Menus Work Well for Site Navigation](https://www.nngroup.com/articles/mega-menus-work-well/) — 0.5 s hover-intent timing.
- [NN/g — Mobile-App Onboarding: An Analysis of Components and Techniques](https://www.nngroup.com/articles/mobile-app-onboarding/).
- [NN/g — Mobile Tutorials: Wasted Effort or Efficiency Boost?](https://www.nngroup.com/articles/mobile-tutorials/) — 91%/94% success, 4.92/5.49 ease.
- [NN/g — Filters vs. Facets: Definitions](https://www.nngroup.com/articles/filters-vs-facets/).
- [NN/g — Navigation: You Are Here](https://www.nngroup.com/articles/navigation-you-are-here/) — 8 orientation mechanisms.
- [NN/g — Local Navigation Is a Valuable Orientation and Wayfinding Aid](https://www.nngroup.com/articles/local-navigation/).
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — two-level ceiling.
- [NN/g — Wizards: Definition and Design Recommendations](https://www.nngroup.com/articles/wizards/).
- [NN/g — Top 3 IA Questions about Navigation Menus](https://www.nngroup.com/articles/ia-questions-navigation-menus/).
- [NN/g — Killing Off the Global Navigation: One Trend to Avoid](https://www.nngroup.com/articles/killing-global-navigation-one-trend-avoid/).
- [NN/g — Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/) — the 27%/48–50%, 39%/15%, 21% figures.
- [NN/g — Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/).
- [NN/g — How Many Items in a Navigation Menu? (Video)](https://www.nngroup.com/videos/number-items-navigation-menu/) — "not 7" finding.
- [W3C WAI-ARIA APG — Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
- [W3C WAI-ARIA APG — Disclosure (Show/Hide) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).
- [W3C WAI-ARIA APG — Breadcrumb Example](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/).
- [W3C WAI-ARIA APG — Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/); [Navigation Menubar Example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/).
- [W3C WAI-ARIA APG — Disclosure Navigation (Hybrid) Example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/) — accessible mega-menu pattern.
- [W3C WAI-ARIA APG — Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — underlies command-palette accessibility.
- [W3C — Understanding SC 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html) (Level A).
- [W3C — Understanding SC 2.4.5 Multiple Ways](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html) (Level AA).
- [W3C — Understanding SC 2.4.8 Location](https://www.w3.org/WAI/WCAG21/Understanding/location.html) (Level AAA).
- [MDN — `aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current).
- [MDN — Working with the History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API) — `pushState`/`replaceState` mechanics.
- [GOV.UK Design System — Patterns overview](https://design-system.service.gov.uk/patterns/).
- [GOV.UK Design System — Navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service) — task-list-vs-persistent-nav decision rule.
- [GOV.UK Design System — Step by step navigation](https://design-system.service.gov.uk/patterns/step-by-step-navigation).
- [GOV.UK Design System — Check answers](https://design-system.service.gov.uk/patterns/check-answers).
- [GDS Design Notes — One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/).
- [GDS Design Notes — We've published the task list pattern](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern) — >60% support-contact figure.
- [GOV.UK Components Guide — Back link](https://components.publishing.service.gov.uk/component-guide/back_link).

Reference / secondary:
- [Material Components (iOS) — Bottom Navigation spec, GitHub mirror](https://github.com/material-components/material-components-ios/blob/c8b8acabf8c78b9e266c33803848e9e67967fe73/components/BottomNavigation/docs/README.md) — 3–5/6-item guidance (live `m3.material.io` page is JS-gated; see §8).
- [Apple Human Interface Guidelines — Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) (live page JS-gated; content cross-checked via a third-party markdown mirror — see §8).
- [Baymard Institute — Checkout Optimization: Minimize Form Fields](https://baymard.com/blog/checkout-flow-average-form-fields) — 11.3-field average, 22% abandonment.
- [Baymard Institute — Why Your Checkout Process Should Be Completely Linear](https://baymard.com/blog/checkout-process-should-be-linear) (existence confirmed; content not extracted, see §8).
- [Rosenfeld, Morville & Arango — *Information Architecture: For the Web and Beyond*](https://books.google.com/books/about/Information_Architecture.html?id=vJWJCgAAQBAJ) — canonical IA-pattern taxonomy (textbook citation).
- [Miller's law — Wikipedia summary](https://en.wikipedia.org/wiki/Miller%27s_law) of Miller (1956), *Psychological Review* — origin of "7±2," cited for the honesty flag in §4.3/§8.
- [`awesome-command-palette` — curated list of implementations](https://github.com/stefanjudis/awesome-command-palette).
- [Radix Primitives — Navigation Menu docs](https://www.radix-ui.com/primitives/docs/components/navigation-menu).

Licences (verified from source):
- [`cmdk` — MIT](https://github.com/pacocoursey/cmdk) (12.8k★; official site [cmdk.paco.me](https://cmdk.paco.me/); handles ~2,000–3,000 items before virtualization is needed).
- [`kbar` — MIT](https://github.com/timc1/kbar/blob/main/LICENSE).
- [Radix Primitives — MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE) (© 2022 WorkOS).
- [`govuk-frontend` — MIT](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/LICENSE.txt) (GOV.UK Design System code).
