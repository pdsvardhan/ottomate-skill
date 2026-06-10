# /design Route Scaffold — Skill Enhancement Design

**Date:** 2026-05-13
**Author:** Ottomate skill (during `tasks` Stage 2 catchup session)
**Status:** approved-for-implementation (user blanket-approved 2026-05-13)
**Project trigger:** `tasks` (first project to receive backfill)

---

## Why this exists

The user expectation that surfaced during `tasks` Stage 2 catchup: every Ottomate-built site
should have a project-local `/design` page that lets the user see and pick from the
`master_components` asset library, in the project's own visual language. The current skill
only offers two pick surfaces — chat-based `AskUserQuestion` and the cross-project tracker
page (`ottomate.vault7a.xyz/projects/<slug>/components-pick`). Neither feels "inside" a
project.

This scaffold makes `/design` a **first-class part of every Ottomate-built site**, scaffolded
in by default at Stage 3 and backfillable into existing projects.

## Goals (in priority order)

1. Show the project's UI master-plan tokens (palettes, fonts, layout summary) rendered.
2. List every component slot for the current project, grouped by page, with status (picked /
   skipped / pending) clearly visible.
3. Open a drawer on each slot showing the 2-3 ranked master_components options for that
   category, with preview (image if `preview_url`, source-code snippet fallback).
4. Pick / skip / skip-with-reason directly on `/design`; writes round-trip back to the
   tracker via the project's own API proxy.
5. Optimistic UI; hot-reloads after each mutation.

## Non-goals (deferred to v2)

- Live-render preview iframe (uses `preview_url` image + source snippet only)
- Variant selection sub-pick UI (catalog supports `variants_json`; v2 surface)
- Cross-page consistency review pass (run via tracker, not `/design`, after first pick pass)
- Auth gate on `/design` (single-user; route is public alongside the rest of the site)
- "Propose new component" inline flow (use `/ottomate seed-component` from chat for now)

## Architecture

```
Browser (public-facing)
  └── tasks.vault7a.xyz/design (Next.js page, server-rendered)
        └── client islands: SlotGrid, SlotDrawer, TokensPanel
              └── fetch via tasks.vault7a.xyz/api/design/*
                    └── server-side Next.js routes (token kept here)
                          └── ottomate.vault7a.xyz/api/* (bearer-auth'd)
```

Token path: `TRACKER_API_TOKEN` env var, server-side only. Never reaches the browser.

## File layout (in skill repo + scaffolded into each project)

Skill repo: `~/.claude/plugins/ottomate/data/scaffold/design-route/`

```
app/
  design/
    page.tsx               (server component; fetches project + slots + master_components)
    SlotGrid.client.tsx    (client; renders cards + handles drawer open)
    SlotDrawer.client.tsx  (client; renders drawer with options + pick/skip actions)
    TokensPanel.client.tsx (client; renders palette swatches + fonts)
  api/
    design/
      slots/route.ts             (GET: list components for current project)
      master-components/route.ts (GET: catalog filtered by category)
      pick/route.ts              (POST: { component_id, asset_library_ref, variant? })
      skip/route.ts              (POST: { component_id, skip_reason })
lib/
  design/
    tracker.ts             (server-side fetch helper with bearer auth)
    types.ts               (Component, MasterComponent, UIMasterPlan types)
```

The current project's slug is read from a build-time env var `OTTOMATE_PROJECT_SLUG` (set
in docker-compose). The skill's scaffold-into-project step generates this env entry.

## Visual language

Use the **project's own** ui_master_plan tokens. The BOTB visual *pattern* (rounded-2xl
cards, top-edge gradient strip, restrained fade/slide) is the structural template, but
actual colors / fonts / radii come from the project's CSS variables. This means `tasks`'s
`/design` looks glass-liquid-purple (its own brand), not BOTB-emerald.

Concretely:
- Cards use `bg-[var(--bg-card,_var(--card))]` (works on both tasks-style and BOTB-style token names)
- Accent strip uses `bg-gradient-to-r from-[var(--accent-from,_#3b82f6)] to-[var(--accent-to,_#a855f7)]`
- Status chips use `--ok`/`--warn`/`--crit` if defined, fall back to Tailwind's emerald/amber/rose

This dual-token pattern is the key to making one scaffold work across projects.

## Data flow per action

**Initial render (server component):**
1. Read `process.env.OTTOMATE_PROJECT_SLUG` → `slug`.
2. Fetch `${TRACKER_API_BASE}/api/projects/${slug}/context-packet?include=ui_master_plan,components,pages` server-side.
3. Pass slots + tokens + pages to client islands as props.

**Open slot drawer (client):**
1. Click slot card → set `selectedSlotId` in client state.
2. Drawer fetches `/api/design/master-components?category=<cat>` (project's own API route).
3. Project's API route proxies to tracker with bearer.
4. Render 2-3 options sorted by tag overlap with project's preference tags.

**Pick (client):**
1. Click "Pick this" on an option → POST `/api/design/pick` with `{ component_id, asset_library_ref, variant? }`.
2. Project's API route proxies POST to tracker `/api/projects/<slug>/components/<component_id>/pick`.
3. On 2xx, optimistically update client state. On error, surface inline toast.

**Skip (client):**
1. Click "Skip" → open small textarea for reason → POST `/api/design/skip`.
2. Same proxy pattern.

## Acceptance criteria

- AC1: `/design` renders without error when project context-packet returns shape from
  tracker spec (tested on `tasks`).
- AC2: TokensPanel shows accent palette swatches + heading/body/mono font samples + a 1-line
  layout-style summary.
- AC3: SlotGrid renders one card per row in `components` table for the current project,
  ordered first by `page.id` then by component name. Status visible (picked / skipped /
  pending color-coded).
- AC4: Opening a slot drawer fetches and shows ≥2-3 ranked master_components from the
  current project's relevant category (or fewer if catalog is thin — show "build new"
  affordance instead).
- AC5: Each option in the drawer shows `preview_url` `<img>` if present, source-code snippet
  otherwise (first ~30 lines from `source_code_path` joined to a code block).
- AC6: Clicking "Pick" round-trips through `/api/design/pick` and the slot updates
  optimistically; the same row in the tracker DB has `picked=true` + `asset_library_ref`
  set + `current_phase='COMPONENT_PICKED'`.
- AC7: Clicking "Skip" with a reason round-trips and persists `skip_reason` + `picked=false`.
- AC8: Page loads in dark and light theme without contrast issues (verified by extending
  the existing `<ThemeProvider>` not adding a new one).
- AC9: API token never reaches the browser (verified by `view-source` / network tab).

## Risks

- **R1**: Catalog gaps (e.g. tasks needs overlay×17 but catalog has overlay=1). Surface in
  drawer as "Only 1 option available; consider build-new or skip" — non-blocking. Logged
  here, also in tracker as a SOFT warn.
- **R2**: Scaffold drift across projects. Mitigation: skill includes a future
  `/ottomate refresh-design-route` command that re-copies template; for now, projects
  diverge as they age. Acceptable trade.
- **R3**: Token leakage if someone misconfigures env. Mitigation: the proxy routes are the
  ONLY caller of tracker; the client never has `TRACKER_API_TOKEN` in its bundle.
- **R4**: Hot-reload after API write may not reflect on the tracker page if user has both
  open. Mitigation: tracker page is a SWR-friendly future improvement; for now, manual
  refresh after `/design` actions.

## Test plan

- Unit: `lib/design/tracker.ts` — happy path + 401 + 500.
- Integration: API routes — mock tracker, assert proxy headers + body.
- E2E (Playwright, added in Stage 3 testing round): hit `/design` against the running
  `tasks` deployment, pick a slot, verify tracker DB updated.

## Provenance

This design responds to user request 2026-05-13 (verbatim):
> "in one of the stages, one of the tasks should be go through the UI repository that we
> have and select if, you know, for that UI component element category, there are any
> assets present, it should show. And if any of them are visible, it should show them on
> the screen to me just to make sure that..."

User confirmed via AskUserQuestion at 2026-05-13:
- /design role: "Complement: /design = preview + pick, tracker still also works"
- Write path: "Proxy through project's own /api/design/* routes"
- Page structure: "Slot-grid first, tokens second"
- Preview render: "preview_url image if available, source-code preview otherwise"
- Visual inspiration: BOTB (balls-of-the-bull)
- Scope: "Add a /design scaffold to every new Ottomate Stage 3 scaffold"

Q5–Q7 (distribution / config / backfill) decided unilaterally with blanket user approval at
shower-break message 2026-05-13.

## Next steps after this design doc

1. Implement scaffold templates under `~/.claude/plugins/ottomate/data/scaffold/design-route/`
2. Update `references/stage-3-scaffolding.md` to include "copy design-route template" step
3. SCP scaffold files into `tasks` repo as backfill
4. Add env vars to `tasks/docker-compose.yml`
5. Build + smoke-test on the deployed `tasks.vault7a.xyz/design`
6. Commit + push tasks repo and the skill repo (skill repo doesn't have remote yet per
   SKILL.md "Repos" section — store locally only for now)
