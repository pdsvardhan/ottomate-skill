# /ottomate Command Routing

The `/ottomate` slash command delegates here for full routing logic. The command file (`commands/ottomate.md`) is intentionally minimal — Claude Code on Windows appears to silently drop slash commands when the body has very long lines (~500+ chars) or large markdown tables. This file holds the real routing logic the skill loads on demand.

## Routing rules — follow in order

### Step 1 — Sanity check (informational, NEVER blocking)

Run the appropriate sanity checks per `references/sanity-check.md`. Print HARD failures (those DO block — e.g. SSH unreachable, Ottomate down, disk full). All other warnings (SOFT/INFO) are reported and ignored. Specifically: untracked YAML mirrors, unpushed commits, lifecycle phase mismatches, missing optional services like GlitchTip — these are NOT blockers. Mention them in a short status block, then move on. Do not ask the user to "resolve git state" before continuing.

### Step 2 — Parse `$ARGUMENTS`

Tokenise the user's request (whitespace-split). Then:

- **(empty)** → Go to Step 3 with `slug = null` and no category filter.
- **`new`** → Run Type 1 / Type 2 preprocessing per `references/stage-1-preprocessing.md`. Stop here.
- **`personal`** or **`cv`** (single token, case-insensitive) → Go to Step 3 with `slug = null` and `category_filter = <value>`. The list rendered in Step 3 must filter `projects` to those whose `tags` array contains the matching value.
- **`<slug>`** (single token) → Go to Step 3 with that slug, no extra request.
- **`<slug> <rest...>`** → Go to Step 3 with that slug. The rest is held for Step 5 routing.

### Step 3 — Resolve which project

If `slug == null`: GET `/api/projects`, then render the compact one-line listing per `references/output-style.md` (NOT a markdown table; NOT a per-item paragraph). If `category_filter` is set (`personal` / `cv`), client-side filter the list to rows whose `tags` array contains that value before rendering, and put the filter in the header (`PROJECTS (personal) — ...`). AskUserQuestion only for the top 3-4 candidates; longer lists rely on the user typing a slug.

If `slug` provided: validate via GET `/api/projects/<slug>`. If 404, ask whether to scaffold (`new` flow) or pick a different slug.

### Step 4 — Project state assessment

Fetch context-packet: GET `/api/projects/<slug>/context-packet?include=flows,features,pages,risks,decisions`.

Check repo on disk: `ssh pdsv@192.168.1.10 'test -d /mnt/storage/websites/<slug>'`.

Compute three signals:

- `so1_empty` = (flows + features + pages all empty)
- `repo_on_disk` = test returned 0
- `has_request` = user passed extra text after the slug

### Step 5 — Route based on state

Apply the FIRST rule that matches:

**Rule A — Repo missing.** Slug exists in Ottomate but repo not on disk (and slug isn't "ottomate", which lives at `/opt/homeserver/ottomate/`): HARD halt. Ask whether to clone from Gitea or pick a different slug.

**Rule B — Empty SO1 + repo on disk = Stage 1 catchup (T2P).** Use `references/stage-1-preprocessing.md` T2P branch. AskUserQuestion first: "Run Stage 1 catchup now / Open project read-only / Submit a quick bug report instead / Cancel". If the user picks catchup, walk the T2P 13-step process. Each of the 7 SO1 docs hits a lock-in gate.

**Rule C — Empty SO1 + repo missing.** Edge case. Ask user.

**Rule D — User typed extra text after slug = Stage 4 intake.** POST `/api/projects/<slug>/reports` with the rest as raw_text. Run classifier prompt at `prompts/classify-text.md`. POST `/api/reports/<id>/classify` with structured items. Tell user: open the lock-in gate at `http://localhost:8110/iterations/<iter_id>`.

**Rule E — SO1 populated, no extra request.** AskUserQuestion: Continue Stage 2 / Continue Stage 3 / Run a Stage 4 iteration / Pack up / Just open in chat. Read `references/trigger-phrases.md` to gauge intent from free-text.

### Step 6 — Server access

SSH to `pdsv@192.168.1.10`. Credentials in `references/credentials.md`. Mutating Ottomate calls require `Authorization: Bearer $(cat /opt/homeserver/ottomate/.token)`.

### Step 7 — Pack up

When user says "pack up", "done", "good night": follow `references/pack-up-ritual.md`. After pack-up, run on the host: `ssh pdsv@192.168.1.10 'cd /opt/homeserver/ottomate && npm run mirror:write -- <slug>'`. That's the script that writes `<slug>/ottomate/*.yaml` to `/mnt/storage/websites/<slug>/`.

## Anti-gaslighting reminders

- No code changes before a lock-in gate (Stage 1 SO1 lock, Stage 2 master-plan lock, Stage 4 items lock).
- Verifier sub-agent is mandatory in Stage 3.4 and Stage 4.7 — dispatch via the Agent tool with locked-manifest+diff inputs (NOT coder claims) per Codex P0 #4.
- Use AskUserQuestion for choices, never prose.
- If a SOFT warning surfaces, mention it once. If a HARD check fails, stop and ask.
