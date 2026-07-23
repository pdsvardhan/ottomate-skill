# Task 1 — Visual-QA Intake (DOM-Commenter → gated Stage 4)

**Status:** ✅ LOCKED 2026-07-23 — §10 defaults applied. Build order: **Task 1** → Task 3 → Task 2.
**Author:** design session 2026-07-23. **Scope:** Ottomate skill improvement, Task 1 of 3.
**Related:** Task 2 (UI-design method, LOCKED) + Task 3 (feature verifier, LOCKED); §9 keeps Task 1's evidence intake shared with Task 3.

---

## 1. Problem & goal

Today visual QA is a **manual, ungated side-loop**: you Alt+click elements on a live site, type comments, export `<project>-comments-<date>.json`, and hand the file to a chat. Three concrete failures seen in your real exports (`Downloads/DOM COMMENTS/`):

- **Dead screenshots.** You already paste `C:\…\Screenshot ….png` into comment text (ottomate batch #2, #6). A server-side Claude session **cannot open those local paths** — the visual evidence is lost exactly where it's needed.
- **Unreliable `target`.** Real targets are `div.wrap`, bare `div`, and per-build Next.js hashes (`div.jsx-aacc449a5fc5a797.card`). The innertext snippet does all the locating; mapping a comment to a component/source is guesswork.
- **No gate.** Comments bypass the anti-gaslighting spine (classify → lock-in → verifier → trace). The memory even records this as "NOT part of the pipeline."

**Goal:** make click-to-comment visual QA a **first-class, gated Stage-4 testing input** — enriched with screenshots + a sturdy locator, ingested as a **batch you confirm before any build**, then run through the existing Stage-4 pipeline unchanged.

## 2. Decisions locked in Q&A (2026-07-23)

| # | Decision |
|---|---|
| D1 | **Keep the extension** as the universal capture tool (you QA on live `*.vault7a.xyz` — an in-app overlay can't reach those cross-origin). |
| D2 | Build **native gated ingest**, not just a smoother import. |
| D3 | **Full Stage-4 gates**, processed **in batches you confirm before build** (= the 4.3 lock-in gate applied to a comment batch). |
| D4 | **Enrich capture** (screenshot + category + sturdier locator). |
| D5 | **Yes to `data-oid` provenance** instrumentation for Ottomate-built sites — **Phase 2**. |

## 3. Scope / non-goals

**In scope:** extension v2 capture (screenshot/category/locator/provenance-detect); an app ingest endpoint + evidence storage; a classifier upgrade; a batch lock-in review with thumbnails; skill flow + prompt + routing updates.

**Non-goals (Phase 1):** no in-app comment overlay (extension covers live sites); not replacing the extension; no new pipeline (reuse Stage 4.4–4.8); direct extension→app push and scaffolding `data-oid` are **Phase 2**.

## 4. End-to-end flow (after)

```
Alt+click on live site → comment + AUTO element screenshot + optional 1-key category
      → click Export (v2 zip) → Claude auto-reads it from ~/Downloads (no manual "attach")
        ── OR (Phase 2) extension "Send to Ottomate" pushes straight ──►
POST /api/projects/<slug>/reports/import-visual-qa
      → 1 report batch (source=visual-qa) + per-comment evidence (screenshot asset, url, locator, provenance)
      → 4.2 classify (visual-aware): each comment → 0..N iteration_items, evidence attached
      → 4.3 BATCH LOCK-IN: review panel shows each item + its screenshot + page; edit/split/reject/CONFIRM
      → 4.4–4.8 existing gated pipeline (route → component-pick/taste → mini-build → verifier → integrate → Trace Report)
```

## 5. Component design

### 5A — Extension v2 (capture) · `tools/dom-commenter/`

- **Screenshot (the big win).** On Alt+click, content script → messages the service worker → `chrome.tabs.captureVisibleTab` (works under the existing `activeTab` grant from the action click) → returns a dataURL → content script keeps the **viewport shot with the element outlined** (context beats a tight crop; honours `devicePixelRatio`) on an offscreen canvas → stored with the comment.
- **Category quick-pick.** One keystroke in the comment box: `ui | bug | tech | copy | perf | question` (default `unset`, so speed is unchanged).
- **Sturdier locator.** Keep the human `target` string; also store structured `locator` = `{ css_path (nth-child chain), role/aria, text_anchor, rect }`.
- **Provenance detect.** If the hovered element (or nearest ancestor) carries `data-oid`/`data-ottomate`, capture it → exact component identity (populated for Ottomate-built sites once Phase 2 lands; null otherwise).
- **Export v2** (§6). Back-compatible: old bare-array exports still ingest.
- **Manifest:** no new permissions needed for screenshots (`activeTab` suffices). Phase 2 direct-push adds a host permission for the Ottomate origin + an options page for the ingest token.
- **Transfer = auto-pickup (Phase 1).** Export writes a `.zip` (`comments.json` + `images/`) to Downloads; the skill reads the newest `<project>-comments-*.zip` straight from `~/Downloads` — a Claude session runs on the owner's PC, so there is no "attach the file" step. Only the Export click stays manual; Phase 2's direct push removes even that.

### 5B — App (ingest + gate) · `/opt/homeserver/ottomate` *(endpoints/schema proposed — confirm against live app at build)*

- **`POST /api/projects/<slug>/reports/import-visual-qa`** — accepts a v2 batch (or v1 array). Creates **one `report`** (`source='visual-qa'`, `raw_text` = concatenated comments for the substring-audit trail) and stores per-comment **evidence**: screenshot → asset store (pattern of `master_components` assets at `/mnt/storage/ottomate/assets/…`), plus `url`, `page`, `locator`, `provenance`, `category`.
- **Evidence link (schema add):** iteration_items gain an optional `evidence` ref (`{ comment_id, screenshot_asset, url, locator, provenance }`) so a built item can show "here's the exact thing you commented on." (New column/table — confirm shape at build; ONE DOOR rule = via API only.)
- **Classifier upgrade** — §5C. Runs the existing `POST /api/reports/<id>/classify` after.
- **Batch lock-in view** — extend the 4.3 "Pending Approval" panel to render each item with its **source comment + screenshot thumbnail + target page/url**. Same edit/split/merge/reject/confirm actions. This IS "confirm before build" (D3).

### 5C — Skill (flow + prompts) · `~/.claude/plugins/ottomate/`

- **New `references/stage-4-visual-qa.md`** — the visual-QA intake sub-flow: how a batch enters 4.1/4.2, how screenshot/locator/provenance/category feed classification, batch lock-in, and **scope handling** (element vs page vs project-wide directive like "overhaul the entire site using the central component library" — screenroom #1).
- **Upgrade `prompts/classify-text.md`** — a visual-QA mode: iterate comments (each is its own mini `raw_text` with `url/page/target/category/provenance` as strong signals for `target_kind`/`target_id`); keep the source-substring rule (source = the comment); keep split (one comment → many items — screenroom's last comment = bug + fix-all + a test-suite request); detect project-scope directives → a `revamp`/scope note applied across items.
- **`references/stage-4-mini-pipeline.md`** 4.1 — add "visual-QA batch (DOM-commenter)" to intake sources.
- **`references/command-routing.md`** — dropping a `*-comments-*.json`/zip, or "here are my comments", routes into this flow.
- **`references/output-style.md`** — trigger phrase.

### 5D — Provenance instrumentation (Phase 2) · Stage-3 scaffolding

Stage-3 scaffolding injects a lightweight `data-oid="<component/source ref>"` on rendered components (QA/prod build). The commenter reads it → visual QA maps to **exact source** for every Ottomate-built project, retiring the fuzzy-target problem. Opt-in per project; adds a small scaffolding step (own ADR).

## 6. Export v2 schema

Bare array (v1-compatible); each row adds optional fields. Version inferred from presence of `locator`/`schema_v`.

```jsonc
[{
  "id": "uuid", "ts": "ISO", "schema_v": 2,
  "project": "screenroom", "page": "/browse",
  "url": "https://screenroom.vault7a.xyz/browse?genre=35",
  "title": "Browse · Screenroom",
  "target": "span.chip.c-none — \"NOT OURS YET\"",         // v1, kept
  "locator": { "css_path": "div.cgrid>div:nth-child(3)>span.chip",
               "role": null, "text_anchor": "NOT OURS YET",
               "rect": { "x":120,"y":340,"w":90,"h":24,"dpr":2 } },   // NEW
  "provenance": { "oid": "mc-chip-status", "source": "data-oid" },    // NEW, null if absent
  "category": "ui",                                        // NEW: ui|bug|tech|copy|perf|question|unset
  "screenshot": "images/<id>.png",                         // NEW: zip path or data: URL
  "selection": null,
  "text": "these labels look visually awful and hard to spot"
}]
```

## 7. Mapping to Stage 4 (reuse, don't reinvent)

| Sub-stage | Visual-QA behaviour |
|---|---|
| 4.1 Intake | batch → one `report` (`source=visual-qa`) + evidence rows |
| 4.2 Classify | visual-aware prompt; per-comment → items with evidence + confidence |
| 4.3 Lock-in | **batch review with thumbnails**; edit/split/reject/**confirm** (D3) |
| 4.4–4.4.6 | existing route + component-pick + design-taste (category=`ui`/taste routes here) |
| 4.5–4.7 | mini-staging → mini-build → per-item verifier (unchanged) |
| 4.8 | integrate + Trace Report, now able to show before/after against the screenshot |

## 8. Phasing

**Phase 1 (core loop, file-drop):** 5A screenshot + category + locator + export v2; 5B ingest endpoint + evidence storage + batch lock-in view; 5C classifier upgrade + skill references. → Full gated batch-confirm loop **with live screenshots**. This is ~90% of the value.

**Phase 2 (frictionless + exact):** extension "Send to Ottomate" direct push (kills the file handoff) + 5D `data-oid` provenance. Needs the auth decision (§10).

## 9. Task 3 shared-infra note

Task 1's ingest is really a **"QA evidence intake."** Design the `report(source=…)` + evidence model generically so Task 3 (a suite that mimics user behaviour) posts its **run artifacts** (steps, screenshots, pass/fail, recordings) through the *same* intake → same lock-in/verifier/trace. That last screenroom comment (fix upload, then "write test cases simulating user testing … record data each time … analyse which pass") is literally Task 3 arriving through Task 1's front door. Build once.

## 10. Open decisions — RESOLVED at lock (2026-07-23)

**Applied:** packaging = **zip**; direct-push auth = **Phase 2**; evidence = **linked `report_comments` table** (confirm exact shape vs live app); categories = `ui|bug|tech|copy|perf|question` **+ `a11y` + `content`**. Original items kept below.

1. **Screenshot packaging** — zip bundle vs inline data-URLs for file-drop. → **zip**
2. **Direct-push auth (Phase 2)** — the app sits behind Authentik/Cloudflare; a scoped ingest token in extension options vs an SSO-cookie path. → **Phase 2**
3. **Evidence schema** — new column on `iteration_items` vs a linked `report_comments` table. → **linked table** (confirm against live app)
4. **Category taxonomy** — is `ui|bug|tech|copy|perf|question` the right set, or add `a11y`/`content`/`data`? → **+ `a11y` + `content`**

## 11. Risks / anti-gaslighting

- Screenshots are large → asset-store + thumbnails, not DB blobs; cap per batch.
- The v2 locator/provenance are **hints, not proof** — the classifier still obeys source-substring; the screenshot is evidence the verifier can check against.
- Batch size: very large batches (30+) may need sub-batching at 4.3 so the confirm step stays reviewable.
- ONE DOOR: all writes via the API; no direct DB.

## 12. Acceptance criteria (Phase 1)

1. Alt+click on a live site captures a **viewport screenshot with the element outlined** + optional category; export v2 (zip) validates; v1 exports still ingest.
2. A dropped batch creates one `report`, classifies into items, and the **4.3 panel shows each item beside its screenshot**.
3. Owner can edit/split/reject and **must confirm before any build**; no code runs pre-lock.
4. A built item's Trace Report references the originating screenshot + url.
5. Skill routes a `*-comments-*` drop into this flow automatically.
