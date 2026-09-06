# Project Task Tracking (Ottomate to-dos)

Per-project task tracking lives in the **Ottomate DB** (`project_todos`), read/written via the API. The app owns this state (SKILL.md "app owns state") — there is **no task file in the repo**. There is also **no web UI**: the `components/project/TodoList.tsx` widget exists in the app repo but is NOT rendered — it was removed from the showcase in the 2026-06-10 redesign (to-dos are internal build-rails, capture≠display). To-dos are surfaced by the **skill at session load** (and via the API), never on the website.

## The model (locked 2026-09-07 — #774 + #530)

A to-do is no longer one 300-char title + a boolean. Columns (enums mirror `lib/validation/todos.ts`):

- `title` — short imperative, **<=140 chars for new rows** (the API still accepts 300 so old rows stay editable). The WHY goes in `body`.
- `body` — uncapped markdown: why, pointer (`-> path` / ADR / iteration), evidence, the parked reason.
- `state` — `open` (captured, not looked at) · `ready` (specced, build it) · `in-progress` · `built` (code exists, needs verification/test) · `blocked` · `parked` (deliberately deferred, reason in body) · `done`. `done=true` is kept in sync for old callers.
- `blocked_on` — only while `blocked`: `owner` (the owner's own queue) · `dependency` · `external` · `other`.
- `kind` — `bug` · `feature` · `chore` · `research` · `process` · `misc`.
- `priority` — `P0` · `P1` · `P2` (no prose priorities in titles).
- `origin` — where it came from: `iter-156 verifier`, `report 822`, `from mapsofbharat #521`, `session 2026-09-07`.
- `blocked_by` — to-do ids this one waits on (the "under #526" link, as data).
- `last_verified_at` — when a session last confirmed the row still describes reality; the staleness signal.

**Misc is a signal, not a dumping ground.** `GET .../todos` returns `counts` (per state / kind / blocked_on / priority, plus `open` and `owner_queue`). When `kind=misc` or `blocked_on=other` grows, that is the moment to name the category that is missing — surface it at pack-up. Projects and skills do NOT add their own kinds or states; propose one here.

## Endpoints

- `GET /api/projects/<slug>/todos[?open=1|?state=<state>]` -> `{ count, todos: [...], counts }`. `open=1` = state NOT IN (done, parked) — what the load block shows.
- `GET /api/todos/<id>` -> `{ todo }`.
- `POST /api/projects/<slug>/todos` `{ title, body?, state?, kind?, blocked_on?, priority?, origin?, blocked_by?, sort_order? }` -> 201 (bearer). Defaults: `state=open`, `kind=misc`.
- `PATCH /api/todos/<id>` — any of the above plus `done` and `last_verified_at` (ISO, or `true` for now). `state` drives `done`; `done` alone drives `state`; leaving `blocked` clears `blocked_on`. Unknown fields come back as `ignored[]` (#688) — never silently dropped.
- `DELETE /api/todos/<id>` (bearer).

## Task style (lean — "just enough + where to look")

```
title:  Fix red CI: stale tests hard-fail + Chrome re-downloads each run
body:   Pause via RUN_TESTS toggle + prebuilt Playwright image -> .gitea/workflows/ci.yml
kind:   chore   state: ready   priority: P1   origin: session 2026-06-15
```

No status words in titles (`DONE`, `PARKED`, `URGENT`, `owner call`) — they are fields now. Prose in a title that
is really a state, a priority or an origin is a smell the pack-up step should fix.

## Load-time check (session-start step)

Per `command-routing.md` Step 4, after state assessment the skill calls `GET /api/projects/<slug>/todos` and surfaces open (`?open=1`: state NOT IN done/parked) items — and the **owner queue** (`state=blocked, blocked_on=owner`) as its own line, so what waits on the owner is visible to the owner in the load status block (template in `output-style.md`). **Informational, never routing-affecting.** The meta `ottomate` project uses its own slug.

## Completion and the pack-up pass

- Landed and verified -> `PATCH {state: 'done'}`. Landed but NOT verified (no verifier/test yet) -> `{state: 'built'}` — the honest state, not done.
- Picked up this session -> `in-progress`; handed back waiting on the owner -> `{state: 'blocked', blocked_on: 'owner'}` with the question in `body`.
- Every to-do you read and found still true -> `{last_verified_at: true}`; one you found stale -> fix title/body, then stamp it.
- New out-of-scope items -> `POST` with `kind`, `origin` (`session <date>` / `iter-N` / `report N`) and the why in `body` — anti-gaslight Rule 7 (drop-with-reason) made concrete.

## Adding tasks

User or skill can `POST` a task. When the user reports something out-of-scope for the current work, capturing it as a to-do (with a pointer) is preferred over silently dropping it — anti-gaslight Rule 7 (drop-with-reason) made concrete.
