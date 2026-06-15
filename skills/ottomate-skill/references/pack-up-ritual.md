# Pack Up — Session-End Ritual

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied; operative deltas (drift detection, reconciliation lock, anti-gaslight surfacing) are merged into the body below (banner collapsed 2026-06-10; changelog archived at `_archive/references/stage-amendments.md`). The stale "plugin has no remote" caveat was removed — the plugin pushes to Gitea `pdsv/ottomate` (SKILL.md rule 15).

Triggered by: "pack up" / "done" / "good night" / "wrap up" / "that's all" / equivalent.

The ritual does ALL session housekeeping in a single sequence. User initiates explicitly; the skill confirms before destructive steps.

## Sequence

### 1. Validate current working state
Check there are no half-edited files or incomplete dialogs:
- Any pending `AskUserQuestion` waiting for user → "You haven't answered the last question. Skip and pack up anyway? (Y/N)"
- Any half-written file in `/tmp/` on local or server → flag for cleanup
- Any uncommitted local edits to project files → confirm before commit

### 2. Sync Ottomate DB → YAML mirrors

**Drift detection runs BEFORE any write** (hash compare DB-canonical vs file). Drift surfaces via AskUserQuestion (import / overwrite / abort); a `drift_resolutions` row is written.

For every SO1 / SO2 / SO3 doc affected during this session:
- Read canonical state from Ottomate DB
- Serialize to YAML matching the doc's schema
- Write to project repo:
  - `overview.yaml`, `flows.yaml`, `features.yaml`, `ui.yaml`, `data.yaml`, `risks.yaml`
  - `decisions/<date>-*.md` files (already exist, no rewrite needed)
  - Stage 2: `ui-master-plan.yaml`, `tech-stack.yaml`, `architecture.yaml`, `build-plan.yaml`
  - Stage 3: `code-overview.md`, `test-coverage.yaml`, `verification-report.yaml`
  - Stage 4: `iterations/iteration-<N>-<date>.yaml`

Mirror writes are idempotent — if no changes, skip the file.

### 3. Update iteration log

Append entry to `iteration-log.md` (per project) summarizing this session:

```markdown
## Session 2026-04-26 — <category>

**Stage:** <e.g., Stage 1 internal — features + flows refinement>
**Duration:** ~45 min
**What changed:**
- Added 8 features to `features.yaml`
- Refined 4 user flows
- Captured 3 risks (open) linked to features

**Decisions:** <list of ADRs created>
**Next session context:** <what to pick up>
```

### 3b. Update project to-dos

Per `references/task-tracking.md`: for any to-do completed this session, `PATCH /api/todos/<id>` with `done=true`. `POST` any new out-of-scope items the user raised this session as fresh to-dos (drop-with-reason, anti-gaslight Rule 7). State lives in the DB — no file to commit.

### 4. Pack-Up Reconciliation Lock, then commit + push

**Before pushing** (Codex Round 2): show the final session-close screen — done / not-done / deferred / risks-changed / commits — and get user confirmation.

```bash
ssh pdsv@192.168.1.10 'cd /mnt/storage/websites/<slug> && \
  git add -A && \
  git commit -m "Session <date>: <summary>" && \
  git push origin HEAD'
```

If commit fails (no changes): skip silently.
If push fails (network / auth): warn but continue ritual.

### 5. Auto-push plugin repos

If `~/.claude/plugins/ottomate/` has uncommitted changes:
```bash
cd ~/.claude/plugins/ottomate && git add -A && \
  git commit -m "auto: sync from <slug> session" && \
  git push origin main
```

Same for `~/.claude/plugins/vault7a-ops/` (server-ops skill).

### 6. Clean up temp files

- Delete any local SCP-staging temp files (e.g. `%TEMP%\*.ts`, `%TEMP%\*.sh` created this session)
- SSH to server, scrub `/tmp/*.tar.gz` and `/tmp/review-*` stale artifacts
- Remove backup files (`*.bak`) older than 24h

### 7. Update Ottomate

- Update project status / lifecycle if changed during session
- Mark current stage's progress
- Set `last_session_at` timestamp

### 8. Show session summary to user

Anti-gaslight rule violations surface here as SOFT warnings (run `GET /api/anti-gaslight/violations?project_slug=<slug>`; per `references/anti-gaslight-rules.md`).

```
🧳 Pack up complete.

Session summary:
- Stage: <X>
- Duration: ~<Y> min
- Files changed: <N>
- Commits: <M>
- Decisions made: <K>
- Tracker updates: <list>

Next session pick-up:
- <hints from iteration log>

Plugin repos: <auto-pushed | unchanged>
Temp files: cleaned
```

## Failure handling

- **Step 2 fails (mirror write):** report which file failed, attempt continue with remaining files. Don't block commit.
- **Step 4 fails (push):** warn user; commit is still local. User can manually push later.
- **Step 5 fails (plugin push):** warn user. Plugin changes accumulate; will push on next ritual.
- **Network down entirely:** save all state locally; retry on next session.

## What NOT to do during pack up

- Don't make new content decisions — pack up is mechanical
- Don't dispatch sub-agents
- Don't modify schemas
- Don't engage in dialogs unless the validation step uncovers blockers
