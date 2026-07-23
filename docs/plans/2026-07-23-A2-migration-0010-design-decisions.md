# A2 — Migration 0010: `design_decisions`

**Category:** A · Foundations · **Size:** M · **Where:** app (`ottomate-tracker-v3`, branch `iter-65-2026-07-13`)
**Blocks:** D1 `rejected[]` · D2 snapshot + regression gate · per-target status · profile graduation
**Owner ruling 2026-07-23:** one row per decision in a real table; the blob stays for loose context.

---

## Why

Every design decision for a project currently lives in **one JSON blob** (`ui_master_plans.design_ledger`,
migration 0009). Writing works — an 834-char rationale round-trips. But nothing can answer:

- *What is still undecided on the Card?*
- *What did we already reject here, so a fresh round doesn't re-offer it?*
- *Which decisions depended on the audience profile that just changed?*

…without loading and re-parsing the whole blob. And with **bundled rounds** (~10 decisions per round,
owner-confirmed) the blob stops being viable immediately. Two features are outright impossible without
per-row storage: the **golden-file regression gate** (needs a stored snapshot per lock to diff against)
and **profile graduation** (needs to find exactly the decisions whose rationale cited the old profile).

## Verified current state (read 2026-07-23, live)

```
lib/db/migrations/  0000, 0001, 0002…0006 (un-journaled), 0007, 0008, 0009, fresh-catchup.sql
journal entries:    idx 0→0000, 1→0001, 2→0007, 3→0008, 4→0009      ⇒ next is idx 5
schema:             lib/db/schema.ts  (ui_master_plans at :500, design_ledger at :514)
self-migrate:       lib/db/client.ts:44  migrate(db, { migrationsFolder: './lib/db/migrations' })
branch:             iter-65-2026-07-13 @ 665aa32
```

**The 0002–0006 journal gap is why `drizzle-kit generate` stays unsafe** — it would try to recreate
hand-applied DDL. Migration written by hand, journal entry added by hand, app self-migrates on boot.
This is the same procedure used successfully for 0007, 0008 and 0009.

## Schema

`design_decisions`, following G3 §5.2's decision-record schema (the field set that makes a decision
survive a session boundary) plus this project's own needs:

| Column | Type | Why |
|---|---|---|
| `id` | int PK autoincrement | |
| `project_slug` | text NOT NULL → projects.slug, cascade | Same FK pattern as `feature_verification_reports` |
| `target_id` | text NOT NULL | **The `data-oid` value** — one instrument, three consumers (Task 1 comment→component, Task 3 test selector, Task 2 design target) |
| `target_kind` | enum `component`/`cluster`/`page`/`site`/`foundation` | The scope dimension |
| `axis` | text NOT NULL | The decision itself, dotted (`card.corner-radius`, `card.hover-motion`) — G3 §5.2 `component_axis` |
| `status` | enum `proposed`/`in-review`/`locked`/`rejected`/`superseded` | The state machine. G3 rule 12: locked is earned, never implied by a first click |
| `rung` | int 0–5 | direction/mechanic/component/cluster/page/micro |
| `round` | int | Round budget (cap 2–3 per axis, G1 §4.8) |
| `variants_shown` | json | What was offered, with slot→label mapping |
| `chosen_value` | text | **The concrete token/value**, never a description — G3 rule 10 |
| `mixed_from` | json nullable | Which variants a mix drew from |
| `rejected` | json | `[{value, why_rejected}]` — G3 rule 11; a fresh round must not re-offer these |
| `rationale` | text | **Uncapped.** Tied to an observable reaction, never an inferred trait |
| `constraints_applied` | json | The contract in force when decided; travels to Stage 3 |
| `profile_at_decision` | text | **The graduation key** — which audience profile the rationale depended on |
| `snapshot` | text nullable | The locked artifact, for the golden-file regression gate |
| `preview_url` | text nullable | |
| `confirmed` | bool default false | Proof the restate-before-act step happened |
| `confirmation_text_shown` | text nullable | What the owner actually agreed to |
| `session_id` | text nullable | Traceability across a session boundary |
| `supersedes` / `superseded_by` | int nullable | Change audit trail |
| `created_at` / `updated_at` | timestamp | Recency / supersession order |

**Indexes:** `(project_slug, target_id)`, `(project_slug, status)`, `(project_slug, profile_at_decision)`
— the three questions above, answered by index rather than by parsing.

**The blob is NOT removed.** `design_ledger` keeps `context` (incl. the audience profile), the worklist,
and the constraint contract. Per-decision records move to the table. No data migration needed — the live
ledger holds only a seeded demonstration.

## Procedure (in order, non-negotiable)

1. `POST /api/backup` — **before any DB change.**
2. Add `design_decisions` to `lib/db/schema.ts` (follow the `feature_verification_reports` pattern at :1046).
3. Hand-write `lib/db/migrations/0010_design_decisions.sql`.
4. Hand-add journal entry `idx: 5, tag: "0010_design_decisions"`.
5. **Never run `drizzle-kit migrate` or `generate`.**
6. Endpoints — same shape as the Task-3 sink:
   - `GET  /api/projects/[slug]/design-decisions` (filter by `status`, `target_id`, `axis`)
   - `POST /api/projects/[slug]/design-decisions`
   - `PATCH /api/design-decisions/[id]` (status transitions, lock/unlock)
   - `GET  /api/projects/[slug]/design-decisions/reopen?profile=P2` → the graduation list
7. Zod schemas with **no length cap on `rationale`** (the 300-char cap is `project_todos.title` — never
   store design decisions as todo titles).
8. `npx tsc --noEmit` — **before** the container rebuild.
9. Rebuild; app self-migrates on boot; verify health + the new table.
10. Smoke: 401 unauthenticated · 422 bad payload · 201 create · 200 read-back · uncapped rationale
    round-trip · a status transition · the reopen query.
11. Commit + push. `git status` **after** committing (a bare `git commit` with no re-`add` once pushed
    a tree that didn't typecheck).

## Acceptance

1. Table exists live; journal has idx 5; app booted and self-migrated after a backup.
2. "What's open on `<target_id>`?" answered by one indexed query.
3. A >1000-char rationale round-trips intact.
4. `rejected[]` is queryable per target, so a fresh round can be told what not to re-offer.
5. A locked row stores a snapshot the regression gate can diff.
6. The reopen query returns exactly the decisions that cited a given profile.
7. Typecheck clean; health green; ONE DOOR respected (all reads/writes via the API).

## Risks

| Risk | Mitigation |
|---|---|
| Live DB damage | `POST /api/backup` first; hand-written DDL only; additive (CREATE TABLE, no ALTER of existing) |
| `drizzle-kit` run by reflex | Called out in this doc, in the migration header comment, and in `ledger-tables.md` |
| Fresh-clone drift | 0010 is journaled, so `migrate()` handles it; `fresh-catchup.sql` covers only the un-journaled 0002–0006 |
| Schema churn once bundles land | Bundled rounds write N rows of the same shape — the row IS the sub-decision, so the shape holds |
