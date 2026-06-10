# Ledger Writes — when the skill POSTs to feature_claims / deploy_artifacts / test_runs

> **Why this exists:** anti-gaslight Rules 1, 4, 5, 5b depend on these three tables being populated as the skill works. Without writes, the rules query empty tables and detect nothing. Per `anti-gaslight-rules.md`. Tables built 2026-05-13.

Every write goes through Ottomate REST API with bearer auth. All endpoints localhost-bound; reach via SSH.

```
TOKEN=$(ssh pdsv@192.168.1.10 'cat /opt/homeserver/ottomate/.token')
BASE='http://127.0.0.1:8110'   # use via SSH tunnel or run curl on the server
```

---

## When to POST `feature_claims`

A claim is **every "this feature is done" assertion** made by Claude, a sub-agent, or the user. Capture them so the verifier can reconcile them later. **Unreconciled claims older than 1 hour fire Rule 1.**

### Stage 3.4 — after each feature codegen completes

The skill dispatches a coder agent per feature in the build plan. After the coder reports "done" (success exit / final message claims build complete), BEFORE dispatching the verifier:

```bash
curl -sf -X POST "$BASE/api/feature-claims" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feature_id": "feat-player-search",
    "claim_text": "<one-line summary from coder agent>",
    "source": "coder-agent",
    "claimed_by_session": "<current session id>",
    "claimed_at": "<ISO timestamp, optional>"
  }'
```

Capture the returned `id` — needed for the reconcile PATCH.

### Stage 3.5 — after verifier completes, PATCH the claim

After dispatching the verifier sub-agent and reading its `verification_report` row, reconcile the claim:

```bash
# verifier APPROVE
curl -sf -X PATCH "$BASE/api/feature-claims?id=$CLAIM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reconciled_with":"verified","reconciler_id":<verification_report_id>}'

# verifier BLOCK with stub detected
curl -sf -X PATCH "$BASE/api/feature-claims?id=$CLAIM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reconciled_with":"stub-detected","reconciler_id":<verification_report_id>}'

# verifier APPROVE with caveats (partial)
# → reconciled_with: "partial"
```

**Map verifier verdict → reconciled_with:**
| Verifier verdict | reconciled_with |
|---|---|
| APPROVE, all 4 passes clean | `verified` |
| APPROVE with partial-failures noted | `partial` |
| BLOCK with stub detected (Pass B) | `stub-detected` |
| BLOCK with user-rejected fix; feature dropped | `dropped` |

### Stage 4.6 — iteration mini-build

Same pattern: POST a claim with `source: 'iteration-summary'` after the iteration coder reports done, PATCH after verifier (4.7) returns.

### Chat-asserted "done" — catch-all

If you (Claude) ever say "I've shipped feat-X" or "feat-Y is now live" in chat WITHOUT going through Stage 3.4 / 4.6, POST a claim with `source: 'chat'`. The reconciliation step will flag it as unreconciled until evidence appears.

---

## When to POST `deploy_artifacts`

Records what was actually shipped to a public URL. **Features in `BUILT` phase >7 days with no deploy_artifact fire Rule 5.**

### Stage 3.7 — after successful deploy + smoke test

After `docker compose up -d` (or equivalent) succeeds AND the smoke test passes:

```bash
curl -sf -X POST "$BASE/api/deploy-artifacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_slug": "<slug>",
    "feature_ids": ["feat-a","feat-b","feat-c"],
    "commit_sha": "<HEAD sha>",
    "deploy_url": "https://<slug>.vault7a.xyz",
    "deployed_by_session": "<session_id>",
    "smoke_test_passed": true,
    "smoke_test_run_id": <test_run id from the smoke test>,
    "notes": "<optional>"
  }'
```

`feature_ids` should list every feature whose code is in this deploy commit. Pull from the merged PR's feature targets.

### Rollback

If you roll back, POST a new artifact with `rollback_of: <previous artifact id>` and `deploy_url` pointing to the previous version. The history thread stays intact.

---

## When to POST `test_runs`

Records each CI / local test invocation. **The latest test_run for a project is what Rule 4 (acceptance-criteria regression) compares against feature/flow phase state.**

### Best path: Gitea Actions workflow step

Add a step to `.gitea/workflows/test.yml` for each project:

```yaml
- name: Report test run to Ottomate
  if: always()  # report even on failure
  run: |
    curl -sf -X POST "http://192.168.1.10:8110/api/test-runs" \
      -H "Authorization: Bearer ${{ secrets.TRACKER_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d "{
        \"project_slug\": \"${{ github.event.repository.name }}\",
        \"commit_sha\": \"${{ github.sha }}\",
        \"branch\": \"${{ github.ref_name }}\",
        \"started_at\": \"${{ steps.test.outputs.started_at }}\",
        \"completed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"result\": \"${{ job.status == 'success' && 'passed' || 'failed' }}\",
        \"total\": ${{ steps.test.outputs.total }},
        \"passed\": ${{ steps.test.outputs.passed }},
        \"failed\": ${{ steps.test.outputs.failed }},
        \"triggered_by\": \"${{ github.event_name == 'push' && 'push' || 'manual' }}\"
      }"
```

`TRACKER_API_TOKEN` needs to be added as a Gitea Actions secret per project.

### Fallback: skill-side after manual test runs

If you run tests locally (e.g., `npx playwright test`) and CI isn't wired up yet, POST manually:

```bash
curl -sf -X POST "$BASE/api/test-runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_slug": "<slug>",
    "commit_sha": "<HEAD sha>",
    "branch": "<branch>",
    "started_at": "<ISO>",
    "completed_at": "<ISO>",
    "result": "passed",
    "total": 42, "passed": 41, "failed": 0, "skipped": 1,
    "triggered_by": "manual"
  }'
```

---

## Read endpoints (for the rules + dashboards)

| Query | Used by |
|---|---|
| `GET /api/feature-claims?reconciled_with=unreconciled` | Rule 1 detection |
| `GET /api/feature-claims?feature_id=feat-X` | Per-feature audit timeline |
| `GET /api/deploy-artifacts?project_slug=<slug>&since=<ISO>` | Rule 5 deploy-gap detection |
| `GET /api/test-runs?project_slug=<slug>&latest=1` | Rule 4 latest CI result |
| `GET /api/test-runs?project_slug=<slug>&result=failed` | Failing-test inventory |

GETs are unauthenticated (localhost-bound + CF Tunnel).

---

## Failure handling

- **POST fails (5xx):** retry once. If still failing, log to `skill_events` table with `event_type=ledger_write_failed` and surface in pack-up summary. **Do not silently swallow.** A failed claim write is the gaslight pattern these tables exist to prevent.
- **POST returns 404 (feature/project not found):** surfaces a structural inconsistency. Halt the stage transition; ask user to fix.
- **POST returns 401/403 (bearer rejected):** the bearer token isn't being loaded by your skill session. Source from `/opt/homeserver/ottomate/.token` via SSH at session start.

---

## Cross-references

- Anti-gaslight rules: `references/anti-gaslight-rules.md`
- Verifier sub-agent: `references/stage-3-verifier.md`
- Iteration pipeline: `references/stage-4-mini-pipeline.md`
- Ottomate API: `references/tracker-api.md`
