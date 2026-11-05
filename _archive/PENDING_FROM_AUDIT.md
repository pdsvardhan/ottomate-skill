# Pending Work — Deferred from 2026-05-13 Cleanup

Items the 2026-05-13 review surfaced but didn't apply (require server-side work, schema migrations, or larger build).

---

## 🐛 Bootstrap sanity-check API bug — EXACT PATCH READY (HIGH PRIORITY)

**Symptom:** `GET /api/sanity-check?phase=bootstrap` returns 3 false-positive `BLOCKED` criticals.

**Live test (2026-05-13 15:44 UTC):**
```json
{
  "verdict": "BLOCKED",
  "checks": [
    {"id":"disk-space","result":"fail","detail":{"mnt_storage_free_gb":0,"opt_free_gb":1536}},
    {"id":"db-schema-healthy","result":"fail","detail":{"missing_tables":["projects","features","flows","pages","components","risks_catalog","master_components"],"risks_catalog_rows":0}},
    {"id":"bearer-token-valid","result":"fail","detail":{"token_configured":false}}
  ]
}
```

All three are false positives — actual DB has 14 projects + 50 risks, `.token` file exists at `/opt/homeserver/ottomate/.token`, disk has space.

### Root cause per check

1. **disk-space**: Reads `df /mnt/storage` and `df /opt`. `/mnt/storage` doesn't exist inside container (only `/repos` mounts host's `/mnt/storage/websites`). `df /opt` reports container's overlay filesystem (1.5 TB; not the actual data path).
2. **db-schema-healthy**: Calls `await db.run("SELECT ...")` for SELECT statements. With drizzle better-sqlite3, `.run()` returns `{changes, lastInsertRowid}` for INSERT/UPDATE/DELETE — it has NO `.rows` property for SELECT. So `(tables as any).rows?.map(...) ?? []` → `[]` → "all tables missing". Same for `SELECT COUNT(*)` → reports 0 rows.
3. **bearer-token-valid**: Reads `process.env.TRACKER_API_TOKEN`. But `docker-compose.yml` sets `TRACKER_API_TOKEN_FILE=/run/secrets/tracker_token` (Docker secret mount). Wrong env var name.

### Exact patch — `app/api/sanity-check/route.ts`

Three surgical edits in `runBootstrapChecks()`:

**Edit 1 — disk-space (lines ~127-149):**

Replace:
```ts
const dfMnt = execSync('df -h /mnt/storage 2>/dev/null | tail -1').toString();
const dfOpt = execSync('df -h /opt 2>/dev/null | tail -1').toString();
const mntFreeGb = parseDiskFree(dfMnt);
const optFreeGb = parseDiskFree(dfOpt);
const passed = mntFreeGb >= 10 && optFreeGb >= 5;
checks.push({
  id: 'disk-space',
  result: passed ? 'pass' : 'fail',
  detail: { mnt_storage_free_gb: mntFreeGb, opt_free_gb: optFreeGb },
  // ...
});
```

With:
```ts
// Check paths visible inside container: /repos (= host /mnt/storage/websites) + /app/data (= host data volume)
const dfRepos = execSync('df -h /repos 2>/dev/null | tail -1').toString();
const dfData = execSync('df -h /app/data 2>/dev/null | tail -1').toString();
const reposFreeGb = parseDiskFree(dfRepos);
const dataFreeGb = parseDiskFree(dfData);
const passed = reposFreeGb >= 10 && dataFreeGb >= 2;
checks.push({
  id: 'disk-space',
  result: passed ? 'pass' : 'fail',
  detail: { repos_free_gb: reposFreeGb, app_data_free_gb: dataFreeGb },
  auto_fix: passed ? undefined : {
    action: 'manual',
    command: 'cleanup-routine.sh',
    approval_required: true,
    explanation: 'Run cleanup script on server',
  },
});
```

**Edit 2 — db-schema-healthy (lines ~159-185):**

Replace:
```ts
const db = await getDb();
const tables = await db.run(`SELECT name FROM sqlite_master WHERE type='table'`);
const requiredTables = ['projects', 'features', 'flows', 'pages', 'components', 'risks_catalog', 'master_components'];
const tableNames = (tables as any).rows?.map((r: any) => r.name) ?? [];
const missing = requiredTables.filter((t) => !tableNames.includes(t));
const risksCatalog = await db.run(`SELECT COUNT(*) AS c FROM risks_catalog`);
const risksCount = (risksCatalog as any).rows?.[0]?.c ?? 0;
```

With:
```ts
await getDb(); // ensure migrations applied
const sqlite = await getRawSqlite();
const tables = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as Array<{name:string}>;
const requiredTables = ['projects', 'features', 'flows', 'pages', 'components', 'risks_catalog', 'master_components'];
const tableNames = tables.map((r) => r.name);
const missing = requiredTables.filter((t) => !tableNames.includes(t));
const risksRow = sqlite.prepare(`SELECT COUNT(*) AS c FROM risks_catalog`).get() as {c:number} | undefined;
const risksCount = risksRow?.c ?? 0;
```

Plus add to top imports:
```ts
import { getDb, getRawSqlite } from '@/lib/db/client';
```
(replaces `import { getDb } from '@/lib/db/client';`)

**Edit 3 — bearer-token-valid (lines ~195-208):**

Replace:
```ts
const token = process.env.TRACKER_API_TOKEN;
checks.push({
  id: 'bearer-token-valid',
  result: token ? 'pass' : 'fail',
  detail: { token_configured: !!token },
  // ...
});
```

With:
```ts
import { readFileSync } from 'node:fs';  // add to top imports if missing

let token: string | null = null;
const tokenFile = process.env.TRACKER_API_TOKEN_FILE;
if (tokenFile && existsSync(tokenFile)) {
  try {
    token = readFileSync(tokenFile, 'utf-8').trim();
  } catch { /* fall through */ }
}
if (!token) {
  token = process.env.TRACKER_API_TOKEN ?? null;
}
checks.push({
  id: 'bearer-token-valid',
  result: token ? 'pass' : 'fail',
  detail: {
    token_configured: !!token,
    source: token ? (tokenFile && existsSync(tokenFile) ? 'docker-secret' : 'env-var') : 'none',
  },
  auto_fix: token ? undefined : {
    action: 'regenerate-token',
    command: 'openssl rand -hex 32 > /opt/homeserver/ottomate/.token && chmod 600 /opt/homeserver/ottomate/.token',
    approval_required: true,
    explanation: 'Neither TRACKER_API_TOKEN_FILE nor TRACKER_API_TOKEN set; regenerate the token file',
  },
});
```

### How to apply (5 min)

```bash
ssh pdsv@192.0.2.10
cd /opt/homeserver/ottomate
# Apply the 3 edits above to app/api/sanity-check/route.ts
docker compose up -d --build
# Verify:
curl -s 'http://127.0.0.1:8110/api/sanity-check?phase=bootstrap' | jq '.sanity_check.verdict'
# Expected: "PROCEED"
```

### Why this wasn't applied automatically (2026-05-13)

The tracker repo has 8 uncommitted modified files (audit-output deployment in flight). Editing `route.ts` directly risked entangling the fix with your other in-flight work. The patch above is surgical — apply when you're done with the audit deployment.

**Until then:** always verify a BLOCKED bootstrap verdict via SSH before trusting it.

---

## ✅ `feature_claims` + `deploy_artifacts` + `test_runs` tables — BUILT 2026-05-13

Tables created + applied to live DB. Migration at `/opt/homeserver/ottomate/lib/db/migrations/audit-2026-05-13/0008_feature_claims_deploy_artifacts_test_runs.sql`.

Verified via `.tables`:
- `feature_claims` ✓
- `deploy_artifacts` ✓
- `test_runs` ✓

API routes written + SCP'd to server (will serve after `docker compose up -d --build`):
- `app/api/feature-claims/route.ts` — GET (list with filters: `feature_id`, `reconciled_with`, `project_slug`), POST (create claim, bearer-auth), PATCH (`?id=N`, reconcile)
- `app/api/deploy-artifacts/route.ts` — GET (list with filters: `project_slug`, `since`), POST (record deploy, bearer-auth)
- `app/api/test-runs/route.ts` — GET (list with filters: `project_slug`, `result`, `branch`, `commit_sha`, `latest=1`), POST (record run, bearer-auth)

All routes use `getRawSqlite()` for the new tables (avoid touching in-flight schema.ts edits). Bearer auth via `readAuthBody()`.

**Still pending (next session):**
1. **Rebuild container** (`docker compose up -d --build`) — picks up new routes alongside your in-flight audit work.
2. **Update `anti-gaslight-rules.md` Rule 1** — rewrite the query to use `feature_claims` (currently uses weaker `verification_reports` substitute).
3. **Wire skill-side writes** — emit a `feature_claim` POST when a coder agent reports "done"; emit `deploy_artifact` POST after Stage 3 deploy; emit `test_run` POST when CI completes.
4. **Optional: add drizzle schema definitions** for these tables in `lib/db/schema.ts` (currently bypassed via raw better-sqlite3). Useful only if you want typed query builders.

---

## ✅ Phase enum collapse — NO DB MIGRATION NEEDED 2026-05-13

Verified on live schema: **no CHECK constraints exist on phase columns** (features.current_phase, flow.current_phase, all *_phase_transitions tables). The enum is enforced at the app layer via drizzle types, not the DB.

So phase collapse is **purely a code/doc change**:
- ✅ `references/ledger-tables.md` — recommendation already documented (2026-05-13)
- Pending: update drizzle types (if any) in `lib/db/schema.ts`
- Pending: grep app code for old phase values: `BUILD_READY`, `STEPS-LOCKED`, `STUB-DETECTED`, `COMPONENTS_PICKED`. Map BUILD_READY → SPECCED, STEPS-LOCKED → LINKED. Leave others.

**Live data check (2026-05-13):**
- features.current_phase distribution: PROPOSED=35, SPECCED=10, INTEGRATED=10 — **no rows in BUILD_READY**, so the SPECCED collapse is a no-op for data.
- flows.current_phase distribution: DRAFT=20, STEPS-LOCKED=15, INTEGRATED=6 — **15 STEPS-LOCKED rows** would need `UPDATE flows SET current_phase = 'LINKED' WHERE current_phase = 'STEPS-LOCKED'` when you apply.

---

## ✅ Cutover DNS — already live (verified 2026-05-13)

Tested end-to-end:
- DNS resolves: `ottomate.vault7a.xyz` → Cloudflare edge (`104.21.46.246`, `172.67.169.136`, IPv6 too)
- Cloudflared tunnel: config at `/opt/homeserver/appdata/cloudflared/config.yml` includes `hostname: ottomate.vault7a.xyz, service: http://ottomate:3000`
- NPM proxy: serves LAN traffic; `curl -s https://ottomate.vault7a.xyz/api/health` returns `{"status":"ok","db":"connected"}`
- Tunnel container up 2 weeks, healthy

Nothing to do.

---

## ✅ Audit-output cleanup — verified fully applied 2026-05-13

Diffed every file in `~/Desktop/skill cleanup/audit-output-2026-04-29/skill-rewrites/` against the current skill at `~/.claude/plugins/ottomate/`:

| Section | Files | Diff result |
|---|---|---|
| SKILL.md | 1 | ✅ byte-identical (252 lines) |
| references/ | 8 | 5 identical + 3 edited 2026-05-13 (anti-gaslight-rules, ledger-tables, sanity-check — see today's edits in plugin) |
| prompts/ | 3 | ✅ all identical |
| data/ | 3 | ✅ all identical |
| commands/ | 1 | ✅ seed-component.md identical |
| scripts/ | 1 | ✅ import-master-components.ts identical |

**DB migrations** (`tracker-migrations/sql/`):
- 0001 phase_transitions: ✅ tables present in DB (feature/flow/page/component)
- 0002 intent_drafts: ✅ table present
- 0003 sanity_check_runs: ✅ table + view present
- 0004 master_components_simplification: applied (verified by current `/components-browser` working)
- 0005 provenance_columns: ✅ verified — `_provenance`, `derived_from_sketch_id`, `current_phase` columns exist on features + flows
- 0006 drift_resolutions: ✅ table present
- 0007 skill_events: ✅ table present

**Verdict:** the audit-output folder is durable but no longer load-bearing. Safe to:
- (recommended) compress to `audit-output-2026-04-29.tar.gz` and move to `~/Desktop/archive/`, OR
- treat as a permanent design-reference snapshot and leave in place.

`DESIGN_LOCK.md` + `MIGRATION_GUIDE.md` from the same folder remain valuable as historical design records.

---

## 🧹 Misc small items

- `REQUIREMENTS.md` body still has a few "(Codex P1 #X)" cross-references. Harmless. Strip them if you want a pure-substance rewrite.
- `audit-output-2026-04-29/skill-rewrites/SKILL.md` may have moved on from the current live `skills/ottomate/SKILL.md` — diff if you suspect drift.
- `commands/seed-component.md` — referenced but I didn't audit it. Verify it still maps to the current component-pick flow after the 2026-05-12 hardening commit.

---

## Stage 5 — explicitly deferred

Per existing memory + REQUIREMENTS section: Stage 5 design only when single-user/home-server constraints change. Out of scope here.
