# /ottomate Command Routing

The `/ottomate` slash command delegates here for full routing logic. The command file (`commands/ottomate.md`) is intentionally minimal — Claude Code on Windows appears to silently drop slash commands when the body has very long lines (~500+ chars) or large markdown tables. This file holds the real routing logic the skill loads on demand.

## Routing rules — follow in order

### Step 1 — Sanity check (informational, NEVER blocking)

Run the bootstrap check directly — do NOT read `references/sanity-check.md` first:

```bash
ssh pdsv@192.0.2.10 'curl -sf "http://127.0.0.1:8110/api/sanity-check?phase=bootstrap"'
```

- **Verdict PROCEED, no failing checks** → one status line in the load block; move on. (This is the common case — the 13KB sanity reference stays unread.)
- **Verdict BLOCK, or any check failed/warned** → NOW open `references/sanity-check.md` for the BLOCK/PROCEED model + per-check recovery. A BLOCK stops (SSH unreachable, Ottomate down, disk full, wal-integrity fail); everything else is reported in a short status block and ignored. Specifically: untracked YAML mirrors, unpushed commits, lifecycle phase mismatches — these are NOT blockers. Do not ask the user to "resolve git state" before continuing.
- If the SSH itself fails, that IS the BLOCK — surface it.

### Step 2 — Parse `$ARGUMENTS`

Tokenise the user's request (whitespace-split). Then:

- **(empty)** → Go to Step 3 with `slug = null` and no category filter.
- **`new`** → Run Stage 0 preprocessing per `references/stage-0-overview.md` (includes Type 1 / Type 2 detection). Stop here.
- **`personal`** or **`cv`** (single token, case-insensitive) → Go to Step 3 with `slug = null` and `category_filter = <value>`. The list rendered in Step 3 must filter `projects` to those whose `tags` array contains the matching value.
- **`<slug>`** (single token) → Go to Step 3 with that slug, no extra request.
- **`<slug> <rest...>`** → Go to Step 3 with that slug. The rest is held for Step 5 routing.

### Step 2.5 — Quick-resume fast path (2026-07-02)

When `$ARGUMENTS` names a slug, check session freshness inside the Step 4 batch (one extra curl):

```bash
curl -sf "http://127.0.0.1:8110/api/skill-events?project_slug=<slug>&limit=1"
```

**If the latest event is `session-packed-up` AND `event_at` is < 2 hours old → QUICK RESUME:**

- Skip re-reading `output-style.md` and `task-tracking.md` — the only template needed is inlined below. Still obey the core style rules: compact one-liners, no markdown tables, ≤30 lines, no preambles, no emoji.
- Skip the Rule E "how do you want to work" AskUserQuestion when the user's message already carries a request (route it directly); otherwise ask with the last session's pickup as the first option.
- Render this block and nothing more:

```
QUICK RESUME — <slug> (last session <N>min ago)
  Last: <notes from the session-packed-up event>
  Tasks open: <count> — <top 1-2 one-liners>
  <stage/lifecycle one-liner from context-packet>

Continue where you left off, or something else?
```

**Fall back to the FULL load path** (Steps 3-5 as written, all refs) if ANY of: sanity verdict not clean · latest event is not `session-packed-up` or is stale · context-packet contradicts the event's notes (lifecycle/stage moved) · the user's request clearly targets different work than last session. Quick-resume trades ~5 reference reads for a little drift risk — the fallback list is the drift guard; when in doubt, full load.

### Step 3 — Resolve which project

If `slug == null`: GET `/api/projects`, then render the compact one-line listing per `references/output-style.md` (NOT a markdown table; NOT a per-item paragraph). If `category_filter` is set (`personal` / `cv`), client-side filter the list to rows whose `tags` array contains that value before rendering, and put the filter in the header (`PROJECTS (personal) — ...`). AskUserQuestion only for the top 3-4 candidates; longer lists rely on the user typing a slug.

If `slug` provided: validate via GET `/api/projects/<slug>`. If 404, ask whether to scaffold (`new` flow) or pick a different slug.

### Step 4 — Project state assessment

**Batch these into ONE ssh invocation** (one round-trip, not three — SSH handshakes are the dominant session-load cost):

```bash
ssh pdsv@192.0.2.10 '
  curl -sf "http://127.0.0.1:8110/api/projects/<slug>/context-packet?include=flows,features,pages,risks,decisions";
  echo "---TODOS---";
  curl -sf "http://127.0.0.1:8110/api/projects/<slug>/todos?open=1";
  echo "---REPO---";
  test -d /mnt/storage/websites/<slug> && echo present || echo missing'
```

Locally, in the same step, one cheap check (owner ruling 2026-07-27 — **notice, then ask**):

```bash
ls -t ~/Downloads/<slug>-comments-* 2>/dev/null | head -1
```

**If that file is newer than the project's newest `source='visual-qa'` report**, add ONE line to the
load block:

```
uningested comment batch — <filename> (<age>). Ingest it?
```

**Never ingest unprompted.** The notice is a notice; the import writes a report, screenshots to the
asset volume and classified items, and that needs a yes. If the newest export is *older* than the last
ingest, say nothing — a stale file must not nag. Why this exists: on 2026-07-26 the owner did a comment
pass, the direct push failed silently (to-do #333), and the session noticed nothing until they asked
*"thought you autoread them"*.

(When the slug is already known at Step 1, fold the sanity curl into this same invocation.)

Compute three signals:

- `so1_empty` = (flows + features + pages all empty)
- `repo_on_disk` = test returned 0
- `has_request` = user passed extra text after the slug

**Project to-dos** (already fetched in the batch above; semantics per `references/task-tracking.md`): keep the `?open=1` result (state NOT IN done/parked) as `todo_open`; from `counts`, `owner_queue` > 0 means items are waiting on the owner — list them on their own line (they are the owner's queue, not the session's). These are surfaced in the load status block alongside project status (template in `output-style.md`) — **informational, never routing-affecting**. If an open to-do the user picks up references concrete paths/files/datasets, existence-check them (one `ls` in the same ssh batch where possible) and surface any mismatch between the to-do's claim and reality BEFORE planning around it.

### Step 5 — Route based on state

Apply the FIRST rule that matches:

**Rule A — Repo missing.** Slug exists in Ottomate but repo not on disk (and slug isn't "ottomate", which lives at `/opt/homeserver/ottomate/`): HARD halt. Ask whether to clone from Gitea or pick a different slug.

**Rule B — Empty SO1 + repo on disk = Stage 0 catchup (T2P).** Use the T2P (existing-project) branch of `references/stage-0-overview.md`. AskUserQuestion first: "Run catchup now / Open project read-only / Submit a quick bug report instead / Cancel". If the user picks catchup, walk Stage 0's T2P path into Stage 1; each of the 7 SO1 docs hits a lock-in gate.

**Rule C — Empty SO1 + repo missing.** Edge case. Ask user.

**Rule D1 — Visual-QA batch (DOM-commenter). Check this BEFORE Rule D.** Fires when the argument
matches `*-comments-*` (either extension), **or** the user's message names comments / visual QA / the
DOM commenter / "the commenter" — e.g. *"here are my comments"*, *"ingest my comments"*, *"I did a
comment pass"*, *"thought you autoread them"*. Route to `references/stage-4-visual-qa.md` and follow it;
do **not** treat the text as a Rule-D free-text report, because that would file the comments as one
blob of `raw_text` and throw away every screenshot, locator and category.

**Match `.json` AND `.zip`.** The spec said `.zip`; measured 2026-07-27, `~/Downloads` holds **38**
exports — **33 `.json` (v1)** and 2 `.zip` (v2). A zip-only pattern misses nearly all real exports.
v1 is a bare array without the v2 fields and still ingests.

**Rule D — User typed extra text after slug = Stage 4 intake.** POST `/api/projects/<slug>/reports` with the rest as raw_text. Run classifier prompt at `prompts/classify-text.md`. POST `/api/reports/<id>/classify` with structured items. Tell user: open the lock-in gate at `https://ottomate.vault7a.xyz/iterations/<iter_id>` (owner-facing host — **never** print `localhost:8110` or `127.0.0.1:8110`; see `references/credentials.md`).

**Rule E — SO1 populated, no extra request.** AskUserQuestion: Continue Stage 2 / Continue Stage 3 / Run a Stage 4 iteration / Pack up / Just open in chat. Use the trigger table in `references/output-style.md` to gauge intent from free-text.

### Step 6 — Server access

SSH to `pdsv@192.0.2.10`. Credentials in `references/credentials.md`. Mutating Ottomate calls require `Authorization: Bearer $(cat /opt/homeserver/ottomate/.token)`.

### Step 7 — Pack up

When user says "pack up", "done", "good night": follow `references/pack-up-ritual.md`. After pack-up, run on the host: `ssh pdsv@192.0.2.10 'cd /opt/homeserver/ottomate && npm run mirror:write -- <slug>'`. That's the script that writes `<slug>/ottomate/*.yaml` to `/mnt/storage/websites/<slug>/`.

## Anti-gaslighting reminders

- No code changes before a lock-in gate (Stage 1 SO1 lock, Stage 2 master-plan lock, Stage 4 items lock).
- Verifier sub-agent is mandatory at Stage 3 verification and Stage 4 item verification (by name, not number) — dispatch via the Agent tool with locked-manifest+diff inputs (NOT coder claims) per Codex P0 #4.
- Use AskUserQuestion for choices, never prose.
- If a SOFT warning surfaces, mention it once. If a HARD check fails, stop and ask.
