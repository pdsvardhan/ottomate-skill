# N3 — page-finalizes-from-components + classify-by-flow (owner ruling 2026-07-28)

Owner ruling on the two design-tracking gaps the traceability audit named: **build both now.** App-side,
extends the N2 status board. No migration — the structure already exists.

## The data that makes it buildable (measured 2026-07-28)
- **`components.page_id`** → components belong to pages. **`components.picked`/`skip_reason`** exist.
- **`flow_pages(flow_id, page_id)`** → flows link to pages. Screenroom has **10 real flows**.
- **`pages`** (id + route). Design status lives in `design_decisions` (per `target_id`).

## The honest constraint
A design target's `target_id` is a **free-form label** ("screenroom.poster-card"), not a wire to the
structure (data-oid is dead). Screenroom's page targets don't match its `pages` ids, and its
`components` table is **empty**. So:
- **Gap 2 (classify by flow)** — demonstrable NOW: 10 flows + `flow_pages` are real.
- **Gap 1 (page roll-up)** — the pure logic is built + unit-tested, but it only lights up for a project
  whose **components are decomposed (page_id set) and whose design target leaves match the component
  names.** A page with no structured components falls back to its own page-scope design-target status.
  This is forward-looking — it comes alive on a properly-onboarded new project (the Clean Plate test),
  not on screenroom's legacy free-form targets. **Say so in the UI; never fake a match.**

## Build (app only, `lib/design.ts` + the design page)
1. **Pure logic** (unit-tested):
   - `slugify` + `targetLeafSlug` — the match key.
   - `rollUpPage(page, components, statusByLeaf)` — a page is *final* when every non-skipped component is
     design-final; *in progress* if any is; falls back to `ownTargetStatus` when it has no components.
   - `groupByFlow(flows, flowPages, pageRollups)` — pages grouped per flow; a flow rolls up like a page.
2. **Page** — the server component queries `pages`, `components`, `flow_pages` via drizzle (the app IS
   the door), builds `statusByLeaf` from the design targets, renders a **"By user flow"** section (Gap 2)
   and per-page **component roll-up counts** (Gap 1). Screenroom shows its flows; a decomposed project
   shows the component roll-up.

## Acceptance
- **Must-pass (unit):** a page whose every non-skipped component has a *final* design target reads *final*;
  one *in-progress* component makes it *in progress*; a page with no components falls back to its own
  target status.
- **Must-pass (unit):** `groupByFlow` puts each page under its flow(s); a page in no flow is *Unassigned*.
- **Must-pass (live):** screenroom's design page renders a "By user flow" section listing its 10 flows.
- **Never fake:** an unmatched component reads *not started*, not a false *final*.
