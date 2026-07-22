# Project Task Tracking (Ottomate to-dos)

Per-project task tracking lives in the **Ottomate DB** (`project_todos`), read/written via the API. The app owns this state (SKILL.md "app owns state") — there is **no task file in the repo**. There is also **no web UI**: the `components/project/TodoList.tsx` widget exists in the app repo but is NOT rendered — it was removed from the showcase in the 2026-06-10 redesign (to-dos are internal build-rails, capture≠display). To-dos are surfaced by the **skill at session load** (and via the API), never on the website.

## Endpoints

- `GET /api/projects/<slug>/todos` → `{ count, todos: [{ id, project_slug, title, done, sort_order, ... }] }` (read).
- `POST /api/projects/<slug>/todos` `{ title, sort_order? }` → create (bearer).
- `PATCH /api/todos/<id>` `{ title?, done?, sort_order? }` → edit / mark done (bearer).
- `DELETE /api/todos/<id>` → remove (bearer).

## Task style (lean — "just enough + where to look")

A task is a single `title` string (≤300 chars). Keep it terse: a short imperative, a one-line why, and a `-> pointer` to where to start.

```
Fix red CI: stale tests hard-fail + Chrome re-downloads each run. Pause via RUN_TESTS toggle + prebuilt Playwright image -> .gitea/workflows/ci.yml
```

No multi-paragraph tasks — if a task needs a spec, point at it (`-> docs/...`). `done` is a boolean; there is no separate "completed" list, the UI shows/hides done items.

## Load-time check (session-start step)

Per `command-routing.md` Step 4, after state assessment the skill calls `GET /api/projects/<slug>/todos` and surfaces open (`done=false`) items in the load status block (template in `output-style.md`). **Informational, never routing-affecting.** The meta `ottomate` project uses its own slug.

## Completion

When a task is finished, `PATCH /api/todos/<id>` with `done=true` (at pack-up, or when it lands). No file move — the DB flag + UI handle it.

## Adding tasks

User or skill can `POST` a task. When the user reports something out-of-scope for the current work, capturing it as a to-do (with a pointer) is preferred over silently dropping it — anti-gaslight Rule 7 (drop-with-reason) made concrete.
