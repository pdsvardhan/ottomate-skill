# I1 — the design surface moves into the Ottomate app

**Unit plan.** Phase A of `2026-07-27-PROGRAM-REPLAN.md`. Owner decisions D1 (route in the app,
not a separate container), D2 (**retire the Claude-Artifact path**), D3 (page first, round second).

---

## 1. Live state verified before designing (not recalled)

| Fact | How checked | Result |
|---|---|---|
| App branch/commit clean | `git status` + `rev-parse` on VAULT7A | `iter-65-2026-07-13` @ `9c4c75d`, clean |
| Container healthy | `docker ps` + `GET /api/health` | `Up 3 days (healthy)`, `db: connected` |
| `design_decisions` shape | read `lib/db/schema.ts:1093-1131` | 22 columns; `variants_shown`, `mixed_from`, `rejected`, `preview_url`, `snapshot`, `confirmed` all present |
| Ledger API | read both route files end to end | `GET`/`POST` collection; `GET`/`PATCH`/`DELETE` item; lock-earned + unlock-reason 422s already implemented |
| A static host for self-contained HTML | read `app/api/previews/[...path]/route.ts` | Serves `.html`/`.png`/`.json` from `/asset-library/previews`, traversal-guarded, `Cache-Control: 60` |
| That volume writable from the host | `touch` + `rm` | **WRITABLE** — `/mnt/storage/ottomate/assets/previews`, `:rw` in compose |
| Browser mutation auth | read `PickSlot.tsx` + `lib/auth.ts` | `sessionStorage['ottomate_token']` → `Authorization: Bearer`; `TokenInjector.tsx` sets it |
| Node on server | `node -v` | v20.19.2 |

**The load-bearing consequence: NO DB MIGRATION IS NEEDED.** A *round* is derivable from rows that
already exist. Nothing to hand-write, no journal entry, no `drizzle-kit`, no DDL risk.

---

## 2. Spec

### 2.1 Data model — a round, with zero schema change

A **round** = the `design_decisions` rows sharing `(project_slug, target_id, round)`.
One row per **sub-decision**, exactly as the anatomy defines them.

| Column | Carries |
|---|---|
| `axis` | `media-card.corner-radius` — dotted, the anatomy's `sub_decisions[].id` |
| `variants_shown` | `[{ variant:"A", value:"4px", label:"tight", panel:"v1" }, …]` — **the pick options** |
| `preview_url` | `/api/previews/design-rounds/<slug>/<target>/r<N>/index.html` |
| `rung`, `target_kind`, `profile_at_decision`, `constraints_applied` | round metadata, already on every row |
| `status` | starts `proposed` |

Transitions, all through the **existing** API (no new endpoints):
- **pick** → `PATCH { chosen_value, mixed_from, rejected, rationale, status:'in-review' }`
- **lock** → `PATCH { status:'locked', confirmed:true, confirmation_text_shown, snapshot }` — the API
  already 422s a lock that was not earned
- **unlock** → `PATCH { status:'in-review', unlock_reason }` — already 422s without a reason

### 2.2 App — two routes

**`/projects/[slug]/design`** (server component)
Index of every `target_id` that has decisions: target, kind, latest round, counts
(open / in-review / locked / rejected), link in. Empty state explains how a round gets published.

**`/projects/[slug]/design/[target]`** (server component + one client child)
- `?round=N`, defaulting to the highest round present.
- **The round preview** — `<iframe>` of `preview_url`, same-origin, generous default height (the
  owner's viewport is 2194×1100 logical: err generous, never cramped) + an "open standalone" link.
  *Not sandboxed:* the content is our own pipeline output and has already passed the feasibility gate
  (no `eval`, no WASM, no network, no inline handlers); sandboxing would also break token mode's
  client render.
- **The pick column** — one row per axis:
  - the options from `variants_shown`, radio-selected, each showing variant label + concrete value;
  - a rationale field (uncapped, matching the column);
  - anything previously **rejected** on this axis, struck through, non-selectable;
  - a **locked** axis renders frozen with an unlock control that demands a reason.
- **Save picks** → one PATCH per changed axis. **Lock** → per-axis, with the confirmation text shown
  to the owner sent back as `confirmation_text_shown` (that string is the proof the restate-before-act
  step happened).

Auth: the established `sessionStorage['ottomate_token']` pattern, same as `PickSlot`.

### 2.3 Plugin — `scripts/generation/publish-round.mjs`

Replaces "publish a Claude Artifact" as step 6 of `stage-2-generation.md`.

```
node publish-round.mjs --manifest round.json --previews-dir /mnt/storage/ottomate/assets/previews \
                       --api http://127.0.0.1:8110 --token-file /opt/homeserver/ottomate/.token
```

1. Copies the harness's built `index.html` to `<previews-dir>/design-rounds/<slug>/<target>/r<N>/`.
2. POSTs one `proposed` decision per sub-decision, each carrying `variants_shown` + `preview_url`.
3. Prints the round URL and the created row ids.

**Runs on VAULT7A** (node 20 present; the API is localhost-bound; the previews volume is a host path).
Idempotent per `(target, round)`: refuses to double-post unless `--replace`.

### 2.4 Retiring the artifact path

`stage-2-generation.md` §6 and `stage-2-design-method.md` change from "publish an Artifact at a stable
URL" to "publish the round into the app." **The harness itself is unchanged** — it still emits one
self-contained HTML page; only the *destination* moves. The gate, the source checker and the computed
pass all stay exactly where they are in the sequence.

---

## 3. Acceptance — demonstrated, each with the command that proves it

1. `npx tsc --noEmit` clean **before** any container rebuild.
2. Container rebuilt; `GET /api/health` → `ok`.
3. `POST /api/backup` **before** the first write.
4. A real round published for `screenroom`: `curl` the page and show the panel markup actually present
   in the served HTML — not "it should render".
5. A pick PATCH round-trips: `GET` the row back and show `chosen_value` set.
6. Lock **without** `confirmed` → `422 lock_not_earned`; **with** → `status:"locked"`. Both shown.
7. Unlock without `unlock_reason` → `422 unlock_requires_reason`. Shown.
8. Plugin suites still green (`node --test`).
9. Both repos committed **and** `git status` re-run after committing; plugin pushed.

## 4. Risks

| Risk | Mitigation |
|---|---|
| Container rebuild is the only genuinely risky step | typecheck first; health check after; the DB is untouched by a rebuild, and a backup is taken anyway |
| `target_id` is a `data-oid` and may not be URL-safe | `encodeURIComponent` on the way out, `decodeURIComponent` on the way in; test with the real Screenroom oid |
| iframe scroll/height (known iter-16 caveat) | generous fixed height + standalone link; not load-bearing for the pick |
| Retiring artifacts could be read as "delete the harness" | It is not. Only the publish destination changes; the register entry must say so explicitly |
| Writing rows before the page can read them | Publish → read back via `GET` in the same step, before touching the UI |
