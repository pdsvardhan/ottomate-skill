# Ottomate API Reference (for skill consumers)

> **AUTHORITY NOTE (2026-06-10):** for whether a path/method EXISTS and whether it
> requires bearer auth, `tracker-api-inventory.md` (generated from route code) is
> authoritative and outranks everything below. This prose file documents request/
> response SHAPES and is known to contain stale claims (e.g. components-pick was
> marked NOT IMPLEMENTED here after it shipped). Full rewrite scheduled in WS2.
>
> **Before grepping route source for a body shape:** check this file, then
> `task-tracking.md` (todos), then the owning stage reference. Grep the app's
> `app/api/` source only if all three miss — and when they do, add what you
> learned back here (2026-07-01 windfall session burned 5 greps re-discovering
> documented shapes).

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied. The endpoints added then are in the
> generated inventory (authoritative); their request shapes moved to the body section
> "Stage 0 + cross-cutting endpoints" below (banner collapsed 2026-06-10). The stale
> "components-pick page NOT IMPLEMENTED" note was removed — the route exists per inventory.

Tracker v3 runs at `${TRACKER_API_BASE}` (default: `http://127.0.0.1:8110`). All endpoints return JSON. Skill uses zod schemas (mirroring `schemas/`) to validate request/response shapes.

**Per Codex P0 #1:** No hardcoded ports. Always reference `process.env.TRACKER_API_BASE`.

**Per Codex P0 #3:** Tracker is a state store. Skill is the worker. Tracker endpoints record state transitions; skill polls and executes builds. Tracker does NOT orchestrate.

## Authentication (Codex Round 2 — bearer required for mutations)

- **GET endpoints (read-only):** no auth required. Localhost-bound + Cloudflare Tunnel handles external auth.
- **POST / PATCH / DELETE endpoints:** **MUST send `Authorization: Bearer <TRACKER_API_TOKEN>` header.** Even single-user, mutating endpoints need auth — protects against accidental cross-app calls + future multi-user.
- **Webhook outbound (Ottomate → tasks-dashboard):** also uses this bearer token in `Authorization` header.

### Token management

- One bearer token generated at Ottomate install:
  ```bash
  openssl rand -hex 32 > /opt/homeserver/ottomate/.token
  chmod 600 /opt/homeserver/ottomate/.token
  ```
- Stored in Ottomate `.env` as `TRACKER_API_TOKEN`
- Stored in skill plugin's `references/credentials.md` (gitignored locally — added via Infisical sync)
- Rotated quarterly (or on any compromise) — update both sides simultaneously
- Tasks-dashboard side stores it in `.env` as `TRACKER_API_TOKEN_INBOUND` for the webhook handler

### Validation
Tracker v3 middleware checks every mutating route:
```typescript
// lib/auth.ts
export function requireBearer(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) throw new Response('unauthorized', { status: 401 })
  if (auth.slice(7) !== process.env.TRACKER_API_TOKEN) throw new Response('forbidden', { status: 403 })
}
```

Failed auth: 401 (no/malformed header) or 403 (wrong token).

## Conventions

- All POST/PATCH bodies are JSON
- All responses are JSON
- Errors use HTTP status codes + `{ error: string, details?: object }` body
- Validation failures return 400 with zod error details
- Resource not found returns 404
- Conflicts (duplicate slug, etc.) return 409

## Per-doc CRUD pattern (consistent across all SO1 docs)

For each doc (overview via `/projects/{slug}`, flows, features, pages, data, risks, decisions). NOTE the real route segments differ from the doc names — verify against `tracker-api-inventory.md`:

```
GET    /api/projects                                 List all projects
GET    /api/projects/{slug}                          Project detail (overview)
POST   /api/projects                                 Create project (Stage 1 hand-off)
PATCH  /api/projects/{slug}                          Update overview fields
DELETE /api/projects/{slug}                          Soft-archive

GET    /api/projects/{slug}/flows                    List flows
POST   /api/projects/{slug}/flows                    Create flow
GET    /api/projects/{slug}/flows/{flow_id}          Flow detail
PATCH  /api/projects/{slug}/flows/{flow_id}          Update flow
DELETE /api/projects/{slug}/flows/{flow_id}          Delete flow

# Same CRUD shape for (REAL segments, per inventory):
#   /features  /pages                         (named as the doc)
#   /data-sources        (Doc 5 "data";   NOT /data)
#   /risk-instances      (Doc 7 "risks";  NOT /risks; resolve-not-delete via /resolve)
#   /adr-index           (Doc 8 "decisions"; NOT /decisions)
#   /ui-master-plan (PUT) · /architecture (POST, per-kind diagrams; kinds
#     process/topology/platform/data/ux/api — platform added iter-16 2026-06-11)
# There is no per-project /components route — components live under pages + the
# global /master-components catalog.
```

## Stage 0 + cross-cutting endpoints (added post-audit 2026-04-29)

```
GET  /api/sanity-check?phase={bootstrap|identity|intent|external|stage_X_to_Y}&project_slug={slug?}
     → returns sanity_check block per `references/sanity-check.md`; persists sanity_check_runs row

POST /api/projects/{slug}/intent-drafts                  (Stage 0.4 capture)
     Body: { core_idea_raw, session_id }

POST /api/projects/{slug}/intent-drafts/extract-hints    (Stage 0.4 hybrid extraction)
     Body: { core_idea_raw, candidate_hints, session_id }
     → returns refined hints; validates source_substring (anti-hallucination guard)

GET  /api/iterations/{id}/items/{itemId}/component-options
     → up to 6 ranked candidates from master_components

POST /api/iterations/{id}/items/{itemId}/pick-component
     Body: { master_component_id, picked_variant?, picked_provenance }

GET  /api/drift?project_slug={slug}                      → detected drift rows
POST /api/drift/{id}/resolve
     Body: { resolution: "import" | "overwrite" | "abort", session_id }

GET  /api/audit/{slug}                                   → full ledger of phase transitions
GET  /api/anti-gaslight/violations?project_slug={slug?}  → canonical live rule check
     (5 rules in SQLite, built 2026-06-10; see references/anti-gaslight-rules.md)
GET  /api/audit/{slug}/anti-gaslight-violations          → per-project wrapper, same rules

POST /api/master-components                              (one-time seed Path 2)
     Body: { id, name, category, description, source_code?, primary_file?,
             source_paths?, variants?, framework_tags?, tags?, dependencies?,
             library?, source_url?, quality_grade?, ingestion_method?, ... }
     If source_code + primary_file are sent, the ROUTE writes the file to
     /asset-library/components/<id>/<primary_file> and fills source_paths —
     single-call seeding; no manual SSH file write. (zod:
     lib/validation/master-components.ts; category enum: lib/categories.ts.)

POST /api/skill-events                                   (timeline log)
     Body: { project_slug?, event_type, session_id, evidence?, ... }
```

## Component/asset surfaces added 2026-06-23 → 06-30 (iter-8/36/77/11, taxonomy)

```
GET   /api/master-components?q=&category=&tag=            filtered catalog list
GET   /api/master-components/{id}                         row detail
PUT   /api/master-components/{id}                         partial update (same schema minus id; can add source_code later)
DELETE /api/master-components/{id}
GET   /api/master-components/{id}/source                  raw source of primary file

GET   /api/inspirations?…                                 list (existed pre-iter-8)
POST  /api/inspirations                                   create (write API, iter-8)
GET   /api/inspirations/{id}                              detail
PATCH /api/inspirations/{id}                              update
DELETE /api/inspirations/{id}
GET   /api/inspirations/{id}/thumbnail                    self-hosted thumbnail serve

GET   /api/previews/[...path]                             serves built inline-preview bundles
                                                          (esbuild sandbox output; components page)
```

### Live-verified shapes + gotchas (comwatch Stage 0+1 run, 2026-06-12)

- **Page ids are GLOBALLY unique across projects** (like ADR ids). `page-home` etc.
  collide with other projects' pages — always use `page-<slug>-<name>`.
- **Flow/page detail GETs return children at the TOP level**, not nested:
  `{flow, steps, pre_conditions, edge_cases}` / `{page, entry_points, components}`.
- **Link reads live at `GET /api/graph/{slug}`** → `{nodes: {flows,features,pages,components},
  edges: {flow_features, flow_pages, page_features, page_components}}` (keyed lists,
  e.g. `{flow_id, feature_id}`). There is no `?project_slug=` form — slug is a path segment.
- **ADR↔risk links require a body**: `PUT .../adr-index/{id}/links/risks/{riskInstanceId}`
  with `{"kind": "instance"}` (or `"type"`). riskId = numeric risk_instance id.
  ADR↔feature links accept an empty JSON body.
- **`POST intent-drafts` is capture-only + idempotent** (409 if core_idea_raw differs;
  no PATCH; sketch fields exist in the table but no route writes them). **No nd1_archive
  route exists either** (table only) — `staging/ND1.yaml` is the canonical Stage 0 artifact;
  document this in the ND1's known_drift block.
- **`risks_catalog` has no write route**; risk_instances 404 unknown `risk_type_id`s.
  Map project-specific risks to nearest catalog entries (notes + severity_override)
  and record unmappable ones in the staging ADR. (Catalog write API tracked as an
  app improvement, 2026-06-12.)
- **Gitea repo creation**: push-to-create is OFF. Create via
  `POST http://192.168.1.10:3300/api/v1/user/repos` with `Authorization: token $(cat ~/.gitea-token)`
  (server-side), then `git remote add origin ssh://gitea/pdsv/<slug>.git && git push -u origin master`.
- **YAML mirrors**: `cd /opt/homeserver/ottomate && npm run mirror:write -- <slug>` —
  also takes a DB backup. A "1 drift warning" on first run after DB edits is the writer
  resolving DB-newer-than-mirror; re-run to confirm 0.

## Stage 1 endpoints

```
POST   /api/sanity-check?stage=1&slug={x}&journey_type={1|2}
       → Returns sanity_check_results block (per sanity-check schema)
       → Skill calls before any preprocessing dialog

# NOT IMPLEMENTED (2026-05-19 audit): no consolidated `stage-*-handoff` endpoint
# exists. Stage transitions happen via per-doc PATCH/POST on the existing
# /api/projects/{slug}/{doc}/* endpoints below. The handoff bundle was an early
# design that was decomposed into the per-doc CRUD pattern. Skill must NOT POST
# to these paths — they 404.
# POST   /api/projects/{slug}/stage-1-handoff
```

## Stage 2/3 endpoints

```
# NOT IMPLEMENTED (2026-05-19 audit): same as stage-1-handoff above.
# Corrected 2026-06-10: ui-master-plan via PUT /api/projects/<slug>/ui-master-plan;
# architecture diagrams via POST /api/projects/<slug>/architecture (new 2026-06-10);
# tech-stack + build-plan stored as ADRs (no dedicated endpoints, per adr-014).
# Lifecycle phase transitions via PATCH /api/projects/{slug}.
# POST   /api/projects/{slug}/stage-2-handoff
# POST   /api/projects/{slug}/stage-3-handoff
```

## Stage 4 endpoints (the lock-in gate flow)

```
POST   /api/projects/{slug}/reports
       Body: { raw_text: string, flow_id?: string, source: "tracker-flow-bug" | "tracker-mega-prompt" | "chat" | "auto-feedback" }
       → Inserts report (status=pending), returns { report_id }

POST   /api/reports/{report_id}/classify
       Body: { session_id?: string }
       → Triggers classifier (skill calls Claude classifier, posts results)
       → Returns: { iteration_id, items: [...], rejected: [...], clarifications_needed: [...] }
       → Skill is responsible for running classifier; Ottomate stores results

GET    /api/iterations/{iteration_id}
       → Returns full iteration with items + status

PATCH  /api/iterations/{iteration_id}/items/{item_id}
       Body: { title?, description?, target?, proposed_change?, item_type? }
       → User edits an extracted item

POST   /api/iterations/{iteration_id}/items
       Body: { item_type, title, description, target?, proposed_change? }
       → User-authored item (confidence implicitly 1.0)

POST   /api/iterations/{iteration_id}/items/{item_id}/split
       Body: { splits: [{title, description}, {title, description}, ...] }
       → Original item replaced with N children

DELETE /api/iterations/{iteration_id}/items/{item_id}
       → Reject item

POST   /api/iterations/{iteration_id}/lock
       Body: { user_session_id }
       → Validates: all items confidence >= 0.7 OR user_edited = true
       → Transitions iteration status to "building"
       → Returns: { status: "building", kickoff_at }

GET    /api/iterations/{iteration_id}/status
       → Polled by skill during build/verify
       → Returns: { status, current_item_id, items_progress: {...} }

POST   /api/iterations/{iteration_id}/items/{item_id}/build-status
       Body: { status: "building" | "built" | "failed", evidence?: object }
       → Skill writes back per-item progress

POST   /api/iterations/{iteration_id}/items/{item_id}/verifier-result
       Body: <verification_report yaml/json>
       → Skill writes verifier output back

POST   /api/iterations/{iteration_id}/integrate
       Body: { commits: [...], merge_sha, deploy_url? }
       → Final integrate step; transitions to "integrated"
       → Auto-creates ADR if iteration was significant
       → Triggers webhook to tasks-dashboard if user opted in

GET    /api/iterations/{iteration_id}/trace
       → Trace report (raw → items → built → verified)
       → Used in Ottomate UI 4.8 view

POST   /api/iterations/{iteration_id}/cancel
       → Cancels iteration; reports.status = "ignored"; no code changes
```

## Cross-cutting endpoints

```
GET    /api/inbox?status=pending&project_slug={x}
       → Pending reports across projects (filterable)
       → Used by Ottomate UI Bug Inbox + skill for batch classify

GET    /api/coverage[?project_slug={x}]
       → Test coverage dashboard data:
         {
           projects: [{ slug, total_flows, tested, passing, last_test_run }],
           top_failing: [...],
           untested: [...]
         }

GET    /api/graph/{slug}
       → Relationships graph data:
         { nodes: [{ id, type, label }], edges: [{ from, to, kind }] }

GET    /api/search?q={query}[&types=features,flows,pages,bugs,decisions]
       → FTS5-backed cross-doc search
       → Returns grouped results per doc type

GET    /api/risks-heatmap
       → Cross-project risk visualization data:
         { 
           risk_types: [{ id, name, severity, instance_count_by_project: {} }],
           hot_zones: [...]
         }

GET    /api/components[?category={x}&dark_light={x}&responsive={x}]
       → Master Components Browser:
         { components: [{ id, name, category, variants, used_in_projects: [] }] }
```

## Context packet endpoint (Codex Round 2 — token savings)

```
GET /api/projects/{slug}/context-packet?item_id={id}&scope={lite|standard|full}
       → Returns compact scoped context for Claude to consume
       → Tracker pre-computes from SO1 + SO2 docs; Claude doesn't load full files
       → Response cached with content-hash; only re-computed on change
       
       Response shape (lite scope, ~3-5K tokens):
         {
           project: { slug, display_name, summary, scope_size, lifecycle_phase },
           item_context: {                          # if item_id provided
             item_id, type, title, target,
             affected_features: [...],              # only items relevant to this iteration item
             affected_flows: [...],
             affected_pages: [...]
           },
           recent_decisions: [...]                  # last 3 ADRs
         }
       
       Response shape (standard scope, ~10K tokens):
         lite + full feature definitions + flows + recent verifier reports
       
       Response shape (full scope, ~30K tokens):
         all SO1 + SO2 doc snapshots — for context-heavy work like Stage 1 catchup
```

**When skill uses this:**
- Stage 4 mini-build: fetch `lite` scoped to the item being built. Saves 80-90% tokens vs loading whole SO1.
- Coder agent: requests `standard` for the feature it's working on.
- Verifier agent: requests `lite` only for the locked item — its prompt is otherwise complete.

**Caching:** Ottomate generates content hash from input docs. If unchanged since last call, returns cached packet. Skill keeps last hash, requests fresh only on hash change.

---

## Pack-up endpoint (skill calls)

```
POST   /api/pack-up
       Body: { project_slug, session_summary }
       → Triggers DB→YAML mirror sync for all SO1/SO2/SO3 docs
       → Iteration log appended
       → Commit + push handled (via skill, Ottomate informed)
       → Returns: { synced_files: [...], iteration_log_appended: bool, drift_detected: [...] }
```

If `drift_detected` is non-empty, skill must show user the drift dialog (per Codex P0 #2):
- "File flows.yaml was edited manually. Options: import (DB ← YAML), overwrite (YAML ← DB), abort"

## DB backup endpoint (Codex P0 #2)

```
POST   /api/backup
       Body: { reason: string }
       → Snapshots Ottomate DB to /opt/homeserver/ottomate/backups/<timestamp>.db
       → Returns: { backup_id, size_bytes, sha256 }
       → Skill calls before any destructive operation (cutover, mass migration, schema change)
```

## Onboarding endpoints

```
POST   /api/onboard
       Body: { project_slug, mode: "lite" | "standard" | "full" | "archive" }
       → Triggers backfill from existing /mnt/storage/websites/<slug>/ artifacts
       → Returns: { backfilled_docs: [...], unfilled_mandatory: [...], sanitization_warnings: [...] }
       → Per Codex P1 #7: includes secret scan + redact-before-import results

GET    /api/onboard/{slug}/status
       → Returns: { mode, status, progress, remaining_steps }
```

## External integration endpoints (optional, Codex P1 follow-up)

```
POST   /api/external-task-completed
       Body: { iteration_id, completed_at, source: "tasks-dashboard" }
       → Webhook from tasks-dashboard when user marks linked task done
       → Tracker updates iteration item status

POST   /api/skill-events
       Body: { iteration_id, item_id?, event, evidence }
       → Generic webhook for skill to write back various states
```

## Error handling examples

```
400 Validation error:
  {
    "error": "validation",
    "details": {
      "fieldErrors": { "slug": ["pattern mismatch"] },
      "formErrors": []
    }
  }

404 Not found:
  { "error": "not-found", "details": { "resource": "project", "slug": "foo" } }

409 Conflict:
  { "error": "conflict", "details": { "reason": "slug already exists" } }

500 Server error:
  { "error": "server-error", "details": { "request_id": "..." } }
```

## Polling pattern (skill = worker per Codex P0 #3)

```bash
# After lock-in (Stage 4.3):
ITER_ID=...
while true; do
  STATUS=$(curl -s ${TRACKER_API_BASE}/api/iterations/${ITER_ID}/status | jq -r '.status')
  case $STATUS in
    "building")  # skill executes mini-build per item, posts back ;;
    "verifying") # skill dispatches verifier, posts results ;;
    "integrated") break ;;
    "cancelled")  break ;;
  esac
  sleep 30
done
```

The skill drives the work loop; Ottomate just reflects state. No CRON/queue daemon inside Ottomate.

## Rate limits

None enforced (single-user). If polling becomes excessive, Ottomate can add ETag/If-Modified-Since support — defer until needed.

## Versioning

Endpoints versioned implicitly by Ottomate deploy. Major changes will be `/api/v2/...` etc. Schemas versioned via `version` field at top of every YAML/JSON payload (`"1"` for now).
