# Stage 4 — Visual-QA Intake (DOM-Commenter → gated batch)

Task 1 (2026-07-23). Turns a batch of click-to-comment DOM feedback into gated Stage-4 iteration
items. This is a Stage 4.1 **intake source**, not a new pipeline — after intake+classify it rejoins
`stage-4-mini-pipeline.md` at the 4.3 lock-in gate.

## When this runs

- The owner drops a `<project>-comments-*.zip` in `~/Downloads` and says "ingest my comments" / "here's my visual QA", OR
- mentions the DOM-commenter / that they've done a comment pass on a live site.

The export is produced by the **DOM Commenter** extension (`~/Desktop/Skills CC/Ottomate/tools/dom-commenter/`, own repo). See its v2 format below.

## Auto-pickup (no manual "attach")

A Claude session runs on the owner's PC, so read the export directly — do **not** ask them to paste it:

```bash
# newest export for the project (or newest overall if project unknown)
ls -t ~/Downloads/*comments*.zip | head -1
```

Unpack it (`comments.json` + `images/<uid>.jpg`). The `project` field on each row is the target slug
(derived from hostname: `screenroom.vault7a.xyz` → `screenroom`). If it doesn't match a tracked
project, AskUserQuestion which project this batch belongs to.

## v2 export format (bare array; v1 still ingests)

Each row: `id`(uuid), `ts`, `schema_v:2`, `project`, `page`, `url`, `title`,
`target` (fuzzy human locator, v1), `locator` `{css_path, role, aria_label, text_anchor, rect{x,y,w,h,dpr}}`,
`provenance` `{oid, source}`|null (Ottomate-built sites w/ `data-oid`), `category`
(`ui|bug|tech|copy|perf|question|a11y|content`|null), `screenshot` (zip path `images/<uid>.jpg`),
`selection`, `text` (the comment). v1 exports are a bare array without the NEW fields — still ingest.

## Ingest (ONE report + per-comment evidence) — TESTED 2026-07-23

Build the import payload locally (base64 each screenshot), SCP it, POST server-side:

```bash
# 1. build payload.json = { imported_by_session, comments:[{...v2 fields..., screenshot_b64}] }
#    (python: read the zip, base64.b64encode(zf.read(row['screenshot'])) → screenshot_b64)
scp payload.json pdsv@192.168.1.10:/tmp/vqa-payload.json
ssh pdsv@192.168.1.10 'cd /opt/homeserver/ottomate && \
  curl -sf -X POST http://127.0.0.1:8110/api/projects/<slug>/reports/import-visual-qa \
    -H "Authorization: Bearer $(cat .token)" -H "Content-Type: application/json" \
    --data-binary @/tmp/vqa-payload.json; rm -f /tmp/vqa-payload.json'
```

The route (`app/api/projects/[slug]/reports/import-visual-qa`) creates **one `report`**
(`source='visual-qa'`, `status='pending'`, `raw_text` = the comments concatenated verbatim so the
classifier's source-substring rule works), writes each `screenshot_b64` to
`/asset-library/visual-qa/<report_id>/<uid>.jpg` (host `/mnt/storage/ottomate/assets/visual-qa/…`),
and inserts one `report_comments` row per comment (`locator`/`provenance` as JSON). Returns
`{report, comments, count, screenshots_written, classify_next}`.

## Classify (4.2) — visual-aware

Run the classifier (`prompts/classify-text.md`, visual-QA section) over the report's comments, then
POST items to `/api/reports/<report_id>/classify` (existing endpoint, `{classified_by_session, items}`). **Put the source comment id(s) in each item's `proposed_change.source_comment_ids`** (the `report_comments` row ids from the import response) — the 4.3 lock-in view renders each item beside *its* screenshot thumbnail(s) from this (precise per-item mapping, not just the batch view).
Each **comment** is its own mini `raw_text`; use its `url/page/category/locator/provenance` as strong
signals for `target_kind`/`target_id`. Keep the bedrock rules:
- **source-substring** per item (source = the comment `text`); drop hallucinations.
- **split** one comment → many items (a comment can be a bug + a request + a test-ask).
- **scope**: a comment can be element- / page- / project-wide (e.g. "overhaul the whole site using the
  central component library") → a `revamp`/scope note applied across items, not one tiny fix.
- **junk/meta**: throwaway ("lol", "okay") or tool-meta comments → `observation` or reject-with-reason
  (never fabricate an item). If a batch yields zero real items, say so; don't force one.

## 4.3 batch lock-in → pipeline

The extracted items land in the iteration's **Pending-Approval / lock-in** state. The owner reviews the
batch and **confirms before any build** (edit / split / reject / lock) — this is D3 (confirm-before-build).
Screenshots are evidence: each `report_comments` row has its shot on the asset volume (served to the
browser via the visual-qa screenshot route once the lock-in view enhancement lands). After lock, the
normal `stage-4-mini-pipeline.md` runs (route → component-pick/taste → mini-build → verifier → integrate → trace).

## Status (2026-07-23) — all shipped

Everything below is LIVE + verified:
- Extension v2 capture (screenshot + category + locator + `data-oid` detect); export **zip** OR
  **"Send to Ottomate"** direct push (no download; token stored locally, POSTs via the service worker).
- `POST …/import-visual-qa` + `report_comments` + screenshot storage; classify → 4.3 lock-in.
- The 4.3 lock-in **view renders screenshot thumbnails** — the batch in the left column, and **per-item**
  on each card via `proposed_change.source_comment_ids`. Shots served by `/api/asset/[...path]`.
- `DELETE /api/reports/[id]` removes a report + its comments + screenshots (cleanup).
- **`data-oid` provenance** stamped by codegen on component/section roots
  (`references/stage-3-codegen.md` → "Provenance stamping") → exact comment→component mapping; also
  Task 3's stable test selectors.
