# N2 — the design index as a status board (app-side) · plan

**Written 2026-07-28.** Owner ruling: *"per-round URLs stay; what I want is the design INDEX as a
status board — pages vs components, final vs not."* Today `/projects/[slug]/design` lists targets with
raw decision counts. N2 turns it into a **status board**: every design target, what kind it is, and how
far it has got. **App-side** (the Ottomate Next.js app), so this is a plan, not a plugin change.

## No migration — it is all derivable

A "target" is the set of `design_decisions` rows sharing `target_id`. Everything the board needs is
already on those rows: `target_kind` (page|component), `round`, `status`
(proposed|in-review|locked|superseded), `confirmed`, `updated_at`, `preview_url`. **No schema change** —
same lesson as the design surface itself.

## The board

Group by `target_kind` (**Pages** vs **Components**), one row per `target_id`:

| column | derived from |
|---|---|
| target | `target_id` (leaf) |
| kind | `target_kind` |
| status | **final** = every non-superseded axis is `locked`; **in progress** = any `proposed`/`in-review`; **not started** = no rows | roll-up over the target's rows |
| rounds | distinct `round` among non-superseded rows |
| open axes | count of non-locked, non-superseded rows |
| last activity | max `updated_at` |
| link | the latest round's `preview_url` → `/projects/[slug]/design/[target]` (per-round URLs stay) |

A project-level roll-up at the top: *N targets — X final, Y in progress, Z not started.*

## Build (app)

1. A server component `/projects/[slug]/design` (upgrade the existing page): `GET
   /api/projects/[slug]/design-decisions`, partition by `target_id`, compute the roll-up per the table.
2. The status logic is pure and **unit-testable** — extract `summariseTargets(rows)` into a lib fn with
   its own test (must-cover: a fully-locked target reads *final*; one proposed row makes it *in
   progress*; superseded-only reads *not started* / archived).
3. Two sections (Pages, Components), sorted by status then last activity; the roll-up chip row on top.
4. No new endpoint needed; if the list grows, add `?summary=1` to return the roll-up server-side.

## Acceptance

- **Must-pass:** screenroom shows its **page** targets (music-list, album-detail, library-lists, …, all
  `final` — 15 locked) distinct from its **component** target (poster-card, *in progress* — rounds 1+2
  proposed, decisions 55–65).
- **Must-pass:** the status roll-up matches the ledger (superseded rows do not count as open).
- **Must-fail (unit):** a target whose only rows are `superseded` is not reported as *in progress*.
