# Sanity Check Reference (rewritten — 3-phase, BLOCK/PROCEED model)

Pre-gate validation runs before preprocessing dialogs and stage transitions. Two states: **BLOCK** (must resolve) or **PROCEED** (continue with optional CONFIRMs surfacing as AskUserQuestion).

**Old HARD/SOFT/INFO collapsed to BLOCK/PROCEED+CONFIRM** per audit (the user found 3 levels overcomplicated; INFO had no actionable role).

---

## 4 phases (chronological by when they fire)

```
Phase 0 — Bootstrap        session start, before any user input    7 sub-checks
Phase 1 — Identity Lock    after Stage 0.5 (slug+name+port set)    5 sub-checks
Phase 2 — Intent Consistency  after Stage 0.2 (Journey Detection)   1 sub-check
Phase 3 — External Refs    after Stage 0.6 (preferences captured)   2 sub-checks (conditional)
```

Plus stage-transition phases:
```
Stage 1 → 2 transition     7 checks (mostly already covered by 1.9)
Stage 2 → 3 transition     8 checks (mostly already covered by 2.8)
Stage 3 → 4 transition     6 checks (deploy gate per Codex Round 2)
Stage 4 — per iteration    6 checks
```

For Type 1 entry (the most common case), only Phase 0 + Phase 1 + (rarely) Phase 2 + (rarely) Phase 3 fire. Total ~13-15 sub-checks per session start; not 31 lumped together.

---

## Phase 0 — Bootstrap (always first, ~2s, 0 tokens)

Runs at every session start. Cached 30 minutes — subsequent stage transitions reuse if still valid.

| # | Check | Verdict on fail | Auto-fix? |
|---|---|---|---|
| 1 | Server liveness (3 parallel: SSH + Ottomate /api/health + Gitea /api/v1/version) | BLOCK | Manual (check VAULT7A power, SSH daemon, container status) |
| 2 | Disk space `/mnt/storage` ≥10GB AND `/opt` ≥5GB | BLOCK | Auto-offer `cleanup-routine.sh` |
| 3 | DB schema healthy (drizzle migrations current + required tables present + risks_catalog ≥20 rows) | BLOCK | Auto-offer `npm run db:migrate` AND/OR `npm run seed:risks` |
| 4 | Bearer token valid (file at `/opt/homeserver/ottomate/.token` exists + accepted by Ottomate API) | BLOCK | Auto-offer `openssl rand -hex 32 > /opt/homeserver/ottomate/.token && chmod 600 ...` (with re-deploy reminder) |
| 5 | Server clock in sync (drift between server `date +%s` and local <300s) | PROCEED+CONFIRM | Manual (`sudo timedatectl set-ntp true`) |
| 6 | Deferred tools loaded (AskUserQuestion + verifier toolkit callable) | BLOCK | Auto-offer `ToolSearch` to load |
| 7 | Last-session unresolved-halt audit (read most recent `sanity_check_runs`; flag if last verdict was BLOCK without recorded remediation) | PROCEED+CONFIRM | Surface: "previous session BLOCKed on X, did you fix it?" |

Each check fires in parallel; total wall-clock target <2s.

---

## Phase 1 — Identity Lock (after Stage 0.5; ~500ms, 0 tokens)

Runs after slug + display_name + port are set in 0.5. HARD-blocks lock-in if any fail.

| # | Check | Verdict on fail | Remediation |
|---|---|---|---|
| 8 | Slug format `^[a-z][a-z0-9-]+$`, length 3-40 | BLOCK | User retypes (back to 0.5 panel) |
| 9 | Slug unique (SQL `SELECT 1 FROM projects WHERE slug = ?`) | BLOCK | User picks different (back to 0.5) |
| 10 | Display name length 1-60 | BLOCK | User retypes |
| 11 | Port available (DB `MAX(port)+1` AND `ss -tlnp` shows nothing on `<port>` server-side) | BLOCK | AI proposes next free; user confirms |
| 12 | Domain not in NPM proxy hosts (`<slug>.vault7a.xyz`) | BLOCK | User picks different slug (back to 0.5) |
| 13 | Repo dir status (`/mnt/storage/websites/<slug>/` exists?) | PROCEED+CONFIRM | If exists → revive route option in 0.5 (route ⓪) |

---

## Phase 2 — Intent Consistency (after Stage 0.2; ~50ms, 0 tokens)

Runs once after Journey Detection.

| # | Check | Verdict on fail | Remediation |
|---|---|---|---|
| 14 | Type matches attachments (deterministic regex: count fenced blocks + attachment count + file path patterns) | PROCEED+CONFIRM | If Type 1 + artifacts present OR Type 2 + no artifacts: AskUserQuestion "did you mean X?" |

**Promoted from SOFT to BLOCK** per audit when ambiguity is high (e.g., user said Type 1 but pasted full code) — ambiguity at the gate is exactly when explicit confirm is required.

---

## Phase 3 — External Refs (after Stage 0.6; conditional, ~5-30s, 0 tokens)

Only fires if user mentioned URLs in 0.7 or 0.8.

| # | Check | Verdict on fail | Remediation |
|---|---|---|---|
| 15 | Inspirations URLs reachable (curl with 10s timeout per URL) | PROCEED+CONFIRM | "URL X is dead. Continue without / pick different / abort?" |
| 16 | Integrations endpoints respond (curl with timeout) | PROCEED+CONFIRM | Same |

---

## Stage 1 → 2 transition (3 sanity checks beyond 1.9 verification)

| # | Check | Verdict |
|---|---|---|
| 17 | Mermaid CLI installed (`mmdc --version`) | PROCEED+CONFIRM (skip diagrams if missing) |
| 18 | Master components scan feasible (existing projects scannable via SSH) | PROCEED |
| 19 | Browser MCP available (for Stage 2.4 component variant fetching) | PROCEED+CONFIRM (chat fallback if missing) |

---

## Stage 2 → 3 transition (4 sanity checks beyond 2.8)

| # | Check | Verdict |
|---|---|---|
| 20 | Repo doesn't exist at `git.vault7a.xyz/pdsv/<slug>` (or revive flow active) | BLOCK |
| 21 | Gitea Actions runner reachable | BLOCK |
| 22 | npm registry reachable (`curl -sf https://registry.npmjs.org/`) | BLOCK |
| 23 | Test framework images pullable (`docker pull mcr.microsoft.com/playwright`) — **first-build only, not every transition** | PROCEED+CONFIRM |
| 24 | Disk space for build (≥5GB free in `/opt`) | BLOCK |
| 25 | Infisical reachable for secrets — **only fires when Infisical is deployed (currently using `.env` files)** | PROCEED+CONFIRM |

(Dropped 2026-05-13: "Network reachable for npm/pip install" — redundant with #22 npm-registry-reachable.)

---

## Stage 3 → Deploy gate (6 checks per Codex Round 2 #5)

| # | Check | Verdict |
|---|---|---|
| 27 | `auth_strategy != none` if any page `permissions != anonymous` | BLOCK |
| 28 | All secrets in Doc 7 mapped to Infisical entries (verified by Trivy scan = no hardcoded secrets) | BLOCK |
| 29 | Backup plan defined (DB snapshot path + frequency in Doc 5 retention_policy) | BLOCK |
| 30 | Data sensitivity tier acknowledged in Doc 7 policies | BLOCK |
| 31 | Cloudflare Tunnel route configured | BLOCK |
| 32 | All features 3.5 verifier APPROVE; no BLOCK with `mandatory_user_review` | BLOCK |

---

## Stage 4 — per iteration (4 checks)

| # | Check | Verdict |
|---|---|---|
| 33 | Project past Stage 3 (built + deployed) | BLOCK |
| 34 | Project lifecycle is `building` / `shipped` / `maintained` | BLOCK |
| 35 | Verifier sub-agent available (Agent tool callable) | BLOCK |
| 36 | Existing tests still passable on main (regression baseline) | PROCEED+CONFIRM |
| 37 | Live URL responds if `lifecycle: shipped` | PROCEED+CONFIRM |

(Dropped 2026-05-13: "Reports table accessible" — redundant with Phase 0 #3 db-schema-healthy.)

---

## Output schema

Every run produces a `sanity_check` block:

```yaml
sanity_check:
  phase: bootstrap                  # bootstrap | identity | intent | external | stage_X_to_Y
  ran_at: 2026-04-29T11:00:00Z
  duration_ms: 1840
  verdict: PROCEED                  # PROCEED | BLOCKED
  checks:
    - id: server-liveness
      result: pass
      detail: { ssh_ms: 180, ottomate_api_ms: 45, gitea_ms: 120 }
    - id: db-schema-healthy
      result: fail
      detail:
        migration_version: 12
        expected: 14
        missing_tables: []
      auto_fix:
        action: run-npm-script
        command: "npm run db:migrate"
        approval_required: true
        explanation: "Drizzle has 2 unapplied migrations."
    # ... per check
  blockers:
    - check_id: db-schema-healthy
      severity: critical
  confirms:
    - check_id: server-clock
      message: "Server clock drifted 4 seconds — affects ledger timestamps. Continue?"
      options: [proceed, abort, run-ntp-sync]
  next_phase: bootstrap            # re-run after fixes, OR identity (if PROCEED)
```

---

## Skill rendering

### Happy path (compact — per output-style.md)

```
✓ Bootstrap clean — 7/7 checks passed in 1.8s
```

### Blocked path

```
✗ Bootstrap BLOCKED — 2 issues need fixing:

  DB schema behind                version 12, expected 14
  Bearer token missing            file at /opt/homeserver/ottomate/.token

[ Run npm run db:migrate? ]   [ Regenerate token? ]   [ Abort ]
```

Skill calls `AskUserQuestion` per blocker. On Yes → run via SSH → re-run sanity → re-evaluate.

### Confirm path

Per CONFIRM check: render via AskUserQuestion with the check's options.

---

## Persistence

Every run writes one row to `sanity_check_runs`:

```sql
CREATE TABLE sanity_check_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_slug TEXT,                       -- NULL for bootstrap (no project yet)
  phase TEXT NOT NULL,
  ran_at TEXT NOT NULL,
  duration_ms INTEGER,
  verdict TEXT NOT NULL,                   -- PROCEED | BLOCKED
  results_json TEXT NOT NULL,              -- the full sanity_check block
  blockers_resolved TEXT,                  -- JSON: which auto-fixes were run + when + by whom
  confirms_resolved TEXT,                  -- JSON: user choices on confirms
  session_id TEXT
);
CREATE INDEX idx_scr_proj ON sanity_check_runs(project_slug, ran_at DESC);
```

This enables:
- "What was healthy when I started this project?" (audit at project birth — embedded in ND1)
- "What did I fix last session?" (cross-session continuity)
- "Did the previous session BLOCK without resolution?" (Phase 0 check 7)

---

## Implementation pattern

The skill calls one Ottomate endpoint per phase:

```bash
# Phase 0
curl -s "http://127.0.0.1:8110/api/sanity-check?phase=bootstrap"

# Phase 1
curl -s "http://127.0.0.1:8110/api/sanity-check?phase=identity&project_slug=cricket-stats&proposed_slug=cricket-stats&proposed_port=8101"

# Phase 2
curl -s "http://127.0.0.1:8110/api/sanity-check?phase=intent&project_slug=cricket-stats&journey_type=1"

# Phase 3
curl -s "http://127.0.0.1:8110/api/sanity-check?phase=external&project_slug=cricket-stats&urls=cricinfo.com,statsguru.com"
```

Tracker fans out internally (parallel sub-checks); skill receives structured result.

For stage-transition phases, similarly:
```bash
curl -s "http://127.0.0.1:8110/api/sanity-check?phase=stage_1_to_2&project_slug=cricket-stats"
```

---

## What was dropped from the old design

- **Check #5 Docker daemon (INFO at Stage 1)** — irrelevant pre-Stage 3; moved to Stage 2 → 3 transition
- **Check #9 Hosting target valid (SOFT)** — solving a non-problem; default vault7a-docker silently
- **Check #19 No uncommitted changes** — duplicate of Check #17 (working tree clean)
- **Check #22 Slug ↔ display name mismatch INFO** — solving a non-problem; 0.5 dialog already aligns
- **Check #26 Asset library populated INFO** — wrong stage; moved to Stage 2.3 gap check
- **Check #28 Repo dir state INFO** — subsumed by Check #23 → Phase 1 check #13

Net (post-2026-05-13 pruning): 31 documented checks pre-audit → 35 across all phases now → ~13-15 for a typical Type 1 session start. The reduction is "drop dead weight" + "split by phase so user sees the right subset at the right time."

---

## ⚠ Known API bug (2026-05-13)

`GET /api/sanity-check?phase=bootstrap` returns 3 false-positive BLOCKED criticals for `disk-space`, `bearer-token-valid`, and sometimes `db-schema-healthy`. Root cause: Ottomate route runs **inside the Docker container** and queries host paths (`/mnt/storage`, `/opt/homeserver/ottomate/.token`) that aren't bind-mounted into the container.

**Verified via:** `ssh pdsv@192.168.1.10 'docker exec ottomate sh -c "df -h /mnt/storage; ls /opt/homeserver/ottomate/.token"'` returns "No such file or directory" inside the container.

**Recommended fix (server-side, not in this skill):** either bind-mount the paths into the container (`docker-compose.yml`), or move host-filesystem + token checks to the **skill side** (Claude does `ssh` from outside and reports back). Until then, **always verify a BLOCKED bootstrap verdict via SSH before trusting it.**

---

## Anti-gaslight angle

- Every check has structured pass/warn/fail with specific evidence (no "looks good!")
- Every BLOCK halt + remediation logged in `sanity_check_runs`
- Phase 0 cached result has a TTL (30 min); after that re-verify before any preprocessing
- Block embedded in ND1 → ND1 audit captures full sanity state at project birth
- No silent skip of a BLOCK — Ottomate rejects ND1 inserts where `sanity_check_results.passed = false`
