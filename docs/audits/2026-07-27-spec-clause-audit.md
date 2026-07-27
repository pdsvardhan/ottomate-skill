# Spec-clause audit — the three locked task specs vs what is actually built

**Date:** 2026-07-27 · **Auditor:** independent read of code + specs, this machine (Windows, no VAULT7A access).
**Method:** each locked spec decomposed into numbered atomic clauses; each clause given one state and a
file-path evidence anchor.

## What was audited

| Source | Path |
|---|---|
| Task 1 spec | `C:\Users\pdsva\Desktop\Skills CC\Ottomate\TASK1-VISUAL-QA-INTAKE-SPEC.md` |
| Task 2 spec | `C:\Users\pdsva\Desktop\Skills CC\Ottomate\TASK2-UI-DESIGN-SPEC.md` |
| Task 3 spec | `C:\Users\pdsva\Desktop\Skills CC\Ottomate\TASK3-FEATURE-VERIFIER-SPEC.md` |
| Register | `C:\Users\pdsva\.claude\plugins\ottomate\SKILL-REGISTER.md` |
| Code + suites | `C:\Users\pdsva\.claude\plugins\ottomate\skills\ottomate\scripts\` |
| Rule statuses | `C:\Users\pdsva\.claude\plugins\ottomate\skills\ottomate\data\design-rules.json` |
| Extension | `C:\Users\pdsva\Desktop\Skills CC\Ottomate\tools\dom-commenter\` |

## States used

- **BUILT+PROVEN** — code exists AND a named test exercises it (test file named in the evidence cell).
- **BUILT** — code exists; no test names it.
- **PARTIAL** — some of the clause is met; the row says precisely which part is not.
- **NOT BUILT** — nothing implements it.
- **UNKNOWN** — could not be determined from this machine. Used deliberately, not as a hedge.

`evidence` is always a file path. A claim in `SKILL-REGISTER.md` is **not** evidence: where the register
is the only support, the row reads **BUILT** with `register claim only, not independently verified`.

## Limits of this method — read before using the scorecard

1. **No VAULT7A access.** `curl http://127.0.0.1:8110` returned `000`; the Ottomate app source is not
   mirrored on this machine (`grep -rl import-visual-qa` over `C:\Users\pdsva` hits only skill docs and
   one Playwright spec). **Every app-side clause — HTTP endpoints, DB tables, the 4.3 lock-in view — is
   therefore UNKNOWN or register-claim-only.** That is the single biggest hole in this audit, and it
   falls almost entirely on Task 1, whose value lives in the app.
2. **No Playwright here.** `feature-verify/*.spec.ts` was read, not run. `design-check/computed-checks.browser.test.mjs`
   fails locally for the same reason (a known-good 4/4 on VAULT7A; not counted as a real failure).
3. **Reading code proves existence, not behaviour.** Where no test names a module, the row says BUILT even
   when the code looks correct.
4. **A passing suite proves the tested property, not the clause.** Several clauses are partly covered by a
   suite; those are PARTIAL with the uncovered half named.
5. **Two copies of the Task-2 spec exist and have diverged.** `docs/specs/TASK2-UI-DESIGN-SPEC.md` inside
   the plugin carries a **§11b amendment (owner ruling 2026-07-27: "interactive" means CSS-interactive;
   JS inside a panel does not run)** which the Desktop original does **not** contain. Task 1 and Task 3
   copies are byte-identical. This audit scores against the Desktop originals, as instructed, and flags
   §11b where it changes a verdict.

## Suite counts measured today (this machine, 2026-07-27)

| Suite | Command | Result |
|---|---|---|
| design-check | `node --test "design-check/*.test.mjs"` | **118 pass / 1 fail / 119** — the fail is `computed-checks.browser.test.mjs` (needs Playwright; 4/4 on VAULT7A). Not a real failure. |
| pixel | `node --test "design-check/pixel/*.test.mjs"` | **22 / 22** |
| generation | `node --test "generation/*.test.mjs"` | **150 / 150** |
| preview-build | `node --test "preview-build/*.test.mjs"` | **17 / 17** |
| isolation gate | `node preview-build/isolation-gate.test.mjs` | **36 passed, 0 failed** |
| DOM-commenter | `node --test tools/dom-commenter/test/lib.test.js` | **23 / 23** (not in the given baseline; measured here) |
| feature-verify | — | **no unit test file exists.** Only `visual-qa-import.feature-verify.spec.ts`, which needs a live app. |

`design-rules.json` re-counted directly: **91 rules — 79 `enforced`, 11 `pending` (7 `scope:app` + 4
`scope:catalog`), 1 `declared-unenforceable`.** Tiers: `block_owner` 9 · `block_floor` 5 · `advise` 71 ·
`block_feasibility` 6. Matches the given baseline exactly.

---

# Task 1 — Visual-QA Intake (DOM-Commenter → gated Stage 4)

Spec sections decomposed: §5A extension · §5B app · §5C skill · §5D Phase 2 · §6 schema · §7 mapping ·
§10 resolved decisions · §11 risks · §12 acceptance.

| id | clause | state | evidence |
|---|---|---|---|
| T1-01 | §5A "On Alt+click … `chrome.tabs.captureVisibleTab` … returns a dataURL" | BUILT | `tools\dom-commenter\background.js:128` (`captureVisibleTab`), `content.js:1171` (`captureViewport`). No test names it — `test\lib.test.js` covers only pure helpers. |
| T1-02 | §5A "keeps the **viewport shot with the element outlined**" (context, not a tight crop) | BUILT | `tools\dom-commenter\content.js:1171` → `outlineScreenshot(shot, locator.rect)`; also `content.js:381`. Untested. |
| T1-03 | §5A "honours `devicePixelRatio`" | UNKNOWN | `dpr` is in the locator rect per `lib.js:79-85`; whether `outlineScreenshot` scales by it was not traced through the canvas code and no test asserts it. Not claiming either way. |
| T1-04 | §5A "on an offscreen canvas → stored with the comment" | BUILT | `content.js:1022-1035` stores `screenshot` on the comment record. Untested. |
| T1-05 | §5A category quick-pick, **one keystroke**, default `unset` so speed is unchanged | BUILT | `content.js:853-871` (mousedown-preventDefault keystroke picker, toggles off to `null`). Untested. |
| T1-06 | §5A "Keep the human `target` string" (v1 field retained) | BUILT+PROVEN | `lib.js` `describeTarget`; `tools\dom-commenter\test\lib.test.js` — *"describeTarget formats tag + up to 2 classes + quoted snippet"*, *"…includes id as #id when present"*. |
| T1-07 | §5A structured `locator` = `{css_path, role/aria, text_anchor, rect}` | BUILT | `lib.js:50-90` (`buildLocator`, depth-capped nth-of-type path). **No test names `buildLocator`** — the 23-test suite does not import it. |
| T1-08 | §5A provenance detect: `data-oid`/`data-ottomate` on the element **or nearest ancestor** | BUILT | `lib.js:93-99` (`detectProvenance`, uses `el.closest`). Untested. |
| T1-09 | §5A "Export v2 … Back-compatible: old bare-array exports still ingest" | PARTIAL | Export side built: `content.js:412-445` emits `schema_v:2` rows. **The v1-ingest half is app-side and unverifiable here** — no local code path was found that proves a bare v1 array still imports. |
| T1-10 | §5A manifest: "no new permissions needed for screenshots (`activeTab` suffices)" | BUILT — with a deviation | `tools\dom-commenter\manifest.json` declares `activeTab, scripting, storage, unlimitedStorage` **plus `host_permissions: https://ottomate.vault7a.xyz/*`**. The extra host permission is the Phase-2 direct push (§5A/§10), so the clause holds for screenshots but the manifest is no longer permission-neutral. |
| T1-11 | §5A/§10 transfer = a `.zip` (`comments.json` + `images/`) written to Downloads | BUILT+PROVEN (filename) / BUILT (zip bytes) | Zip writer `lib.js:248-320` (hand-rolled STORE-mode, no dependency) — **untested**. The export filename *is* tested: `test\lib.test.js` — *"formatExportFilename derives name from project and date"* (`lib.js:42`). |
| T1-12 | §5A "the skill reads the newest `<project>-comments-*.zip` straight from `~/Downloads`" | BUILT (prose) | `skills\ottomate\references\stage-4-visual-qa.md:18-21` gives the `ls -t ~/Downloads/*comments*.zip` recipe. It is an instruction to a model, not code; nothing executes or tests it. |
| T1-13 | §5B `POST /api/projects/<slug>/reports/import-visual-qa` accepting a v2 batch (or v1 array) | UNKNOWN | Documented at `references\stage-4-visual-qa.md:44-54`; driven by `scripts\feature-verify\visual-qa-import.feature-verify.spec.ts:51` — but the app is not on this machine and the spec was not run. Register claims it live; **register claim only, not independently verified**. |
| T1-14 | §5B "Creates **one `report`** (`source='visual-qa'`, `raw_text` = concatenated comments for the substring-audit trail)" | UNKNOWN | Same as T1-13. Documented `references\stage-4-visual-qa.md:49-52`. |
| T1-15 | §5B stores per-comment evidence: screenshot → asset store at `/mnt/storage/ottomate/assets/…` | UNKNOWN | Documented `references\stage-4-visual-qa.md:51-53`; asserted by `visual-qa-import.feature-verify.spec.ts:82-89` (`assertFileOnDisk` with exact bytes) — a real system-state assertion, but never run here. |
| T1-16 | §5B evidence also carries `url`, `page`, `locator`, `provenance`, `category` | UNKNOWN | Payload built at `content.js:490-497` and documented `references\stage-4-visual-qa.md:29-33`; persistence unverifiable here. |
| T1-17 | §5B/§10-D3 evidence link = a **linked `report_comments` table** (not a column on `iteration_items`) | UNKNOWN | Named in `references\stage-4-visual-qa.md:53`. No migration or schema file for it exists in the plugin tree. |
| T1-18 | §5B "iteration_items gain an optional `evidence` ref so a built item can show 'here's the exact thing you commented on'" | PARTIAL | The realised design is different: items carry `proposed_change.source_comment_ids` (`references\stage-4-visual-qa.md:59`), not an `evidence` ref object. Whether that satisfies the clause is a **judgement the spec does not settle**; the shape the spec named does not exist. |
| T1-19 | §5B classifier upgrade runs the **existing** `POST /api/reports/<id>/classify` after import | BUILT (prose) / UNKNOWN (endpoint) | `references\stage-4-visual-qa.md:56-59`. Endpoint pre-dates Task 1; not exercised here. |
| T1-20 | §5B 4.3 "Pending Approval" panel renders each item with **source comment + screenshot thumbnail + target page/url** | UNKNOWN | Claimed live at `references\stage-4-visual-qa.md:83-84` ("renders screenshot thumbnails … per-item … served by `/api/asset/[...path]`"). App-side UI; no local artifact. Register claim only. |
| T1-21 | §5B same edit/split/merge/reject/confirm actions on the batch | UNKNOWN | Same as T1-20. |
| T1-22 | §5C new `references/stage-4-visual-qa.md` exists and covers the sub-flow | BUILT+PROVEN-by-inspection | `skills\ottomate\references\stage-4-visual-qa.md` — 89 lines, covers intake→classify→lock-in. (No test can exist for a prose file; existence is directly verified.) |
| T1-23 | §5C that file covers **scope handling** — element vs page vs project-wide directive | BUILT | `references\stage-4-visual-qa.md:64-66` names element/page/project-wide → `revamp`/scope note. |
| T1-24 | §5C `prompts/classify-text.md` gains a **visual-QA mode** | BUILT | `skills\ottomate\prompts\classify-text.md:11` — a dedicated paragraph: per-comment mini-message, `category/url/page/locator/provenance` as signals. |
| T1-25 | §5C classifier keeps the **source-substring** rule (source = the comment) | BUILT | `prompts\classify-text.md:11` restates it; the general rule is elsewhere in the same file. Prompt text, so nothing mechanically enforces it. |
| T1-26 | §5C classifier keeps **split** (one comment → many items) | BUILT | `prompts\classify-text.md:11` ("Same rules below (source-substring, split, …)"). |
| T1-27 | §5C classifier **detects project-scope directives → a `revamp`/scope note across items** | PARTIAL | `references\stage-4-visual-qa.md:64-66` states it; `prompts\classify-text.md:80` has `revamp` as an existing item type. The *detection* instruction lives in the reference, not in the prompt the classifier runs — so the prompt does not itself carry the rule. |
| T1-28 | §5C `stage-4-mini-pipeline.md` 4.1 adds "visual-QA batch (DOM-commenter)" to intake sources | BUILT | `skills\ottomate\references\stage-4-mini-pipeline.md:18` — exact line present. |
| T1-29 | §5C `command-routing.md` — dropping a `*-comments-*.json`/zip, or "here are my comments", **routes into this flow** | **NOT BUILT** | `skills\ottomate\references\command-routing.md` — case-insensitive grep for `comment`, `visual`, `dom-comm`, `zip` returns **zero hits**. The file's Step 2 argument parsing and Step 5 state routing contain no visual-QA branch. |
| T1-30 | §5C `output-style.md` — a **trigger phrase** for this flow | **NOT BUILT** | `skills\ottomate\references\output-style.md` — grep for `visual`/`dom-comm`/visual-QA returns nothing; the only `comment` hit is `AP6. Trailing meta-commentary` at line 214, unrelated. `SKILL.md` line 46 confirms this file owns the trigger-phrase table. |
| T1-31 | §6 export row carries `schema_v`, `project`, `page`, `url`, `title`, `target`, `locator`, `provenance`, `category`, `screenshot`, `selection`, `text` | BUILT | `content.js:428-445` (export mapping) and `content.js:1018-1035` (capture record). Untested; field-by-field parity with §6 was read, not asserted by code. |
| T1-32 | §6 "Version inferred from presence of `locator`/`schema_v`" | UNKNOWN | Inference happens in the app's import route. Not present in extension code. |
| T1-33 | §10 categories = `ui\|bug\|tech\|copy\|perf\|question` **+ `a11y` + `content`** | BUILT | `references\stage-4-visual-qa.md:31-32` documents all eight. The extension's picker list at `content.js:853-871` was read as the source of the keystrokes; exact eight-way parity is asserted by the doc, not by a test. |
| T1-34 | §11 screenshots to the asset store, **not DB blobs** | UNKNOWN | Documented `references\stage-4-visual-qa.md:51-52` (writes to `/asset-library/visual-qa/<report_id>/<uid>.jpg`). Storage layer unverifiable here. |
| T1-35 | §11 "**cap per batch**" on screenshot volume | **NOT BUILT** | No cap appears in `content.js` export, in `references\stage-4-visual-qa.md`, or anywhere in the skill tree. |
| T1-36 | §11 "very large batches (30+) may need **sub-batching at 4.3**" | **NOT BUILT** | No sub-batching rule in `references\stage-4-visual-qa.md` or `stage-4-mini-pipeline.md`. (Spec wording is "may need", so this is a soft clause — recorded rather than scored harshly.) |
| T1-37 | §11 ONE DOOR — all writes via the API, no direct DB | BUILT | `SKILL-REGISTER.md` §6 rule 1 and `references\stage-4-visual-qa.md:39-47` (SCP + `curl` to the app API). Enforced by discipline, not code. |
| T1-38 | §5D / Phase 2 — Stage-3 scaffolding injects `data-oid` on rendered components | PARTIAL — **and the doc overclaims** | The *instruction* exists: `references\stage-3-codegen.md:21,28-37` ("Stamp `data-oid` provenance on every component/section root"). But `SKILL-REGISTER.md` §5 Known defects records the claim **WITHDRAWN 2026-07-27**: `grep -rc data-oid` over Screenroom returns **0** and the owner declined to stamp. Meanwhile `references\stage-4-visual-qa.md:86-88` still lists it under "**all shipped**". Two skill docs disagree. |
| T1-39 | §5A/§10 Phase-2 direct push "Send to Ottomate" | BUILT (ahead of phasing) | `content.js:483-497` (push path, slug derivation, error fallback to Export zip); `manifest.json` host permission. Untested. Delivered early relative to §8. |
| T1-40 | §12 AC1 — Alt+click captures viewport shot with element outlined + optional category; export v2 zip validates; v1 exports still ingest | PARTIAL | Capture + category + zip: T1-01/05/11 (BUILT, untested). "export v2 validates" — no validator exists locally. "v1 still ingests" — UNKNOWN (app-side). |
| T1-41 | §12 AC2 — a dropped batch creates one report, classifies into items, and the 4.3 panel shows each item beside its screenshot | UNKNOWN | Entirely app-side; register + `references\stage-4-visual-qa.md:77-84` claim it live and dogfooded. Register claim only, not independently verified. |
| T1-42 | §12 AC3 — owner can edit/split/reject and **must confirm before any build**; no code runs pre-lock | UNKNOWN | The gate itself is the pre-existing 4.3 lock-in (`references\stage-4-mini-pipeline.md`), which is real; that the visual-QA batch is routed through it unmodified is documented but not verified here. |
| T1-43 | §12 AC4 — a built item's Trace Report references the originating screenshot + url | UNKNOWN | No local artifact. Not claimed as demonstrated anywhere I could find, including the register. |
| T1-44 | §12 AC5 — "Skill routes a `*-comments-*` drop into this flow **automatically**" | **NOT BUILT** | Follows directly from T1-29 + T1-30. Neither `command-routing.md` nor `output-style.md` nor `SKILL.md` mentions visual QA; the only pointer is one line inside `stage-4-mini-pipeline.md:18`, which is loaded *after* routing has already chosen Stage 4. Nothing turns a dropped zip into this flow without the owner naming it. |

## Task 1 — what is genuinely missing

1. **Automatic routing (AC5).** The two files the spec names — `command-routing.md` and `output-style.md` —
   were never touched. A `*-comments-*.zip` drop does not route anywhere by itself.
2. **A batch cap and 30+ sub-batching** (§11) — nothing anywhere.
3. **The `evidence` ref on `iteration_items`** as specified (§5B) — the built design uses
   `proposed_change.source_comment_ids` instead; a defensible substitution, but not the clause.
4. **A trace-report → screenshot link (AC4)** — no evidence it was ever demonstrated.
5. **`data-oid` stamping is prose that no live project honours** — and `stage-4-visual-qa.md` still
   advertises it as shipped, which the register itself contradicts.
6. **Extension test coverage stops at pure string/colour helpers.** `buildLocator`, `detectProvenance`,
   `makeZip` and the whole screenshot path — the four things Task 1 actually added — have no test.
7. **Everything app-side is unverified from here.** If the owner wants a real Task-1 verdict, the
   `visual-qa-import.feature-verify.spec.ts` run on VAULT7A is the cheapest way to get one.

---

# Task 3 — Feature Verifier

Spec sections decomposed: §2 decisions · §4 layers · §5A–5H · §6 integration · §8 phasing · §11 risks ·
§12 acceptance. The reference file carries its own honest status block
(`references\stage-3-feature-verifier.md:14-40`, "**ITERATE**, not APPROVE") which this audit corroborates
rather than contradicts.

| id | clause | state | evidence |
|---|---|---|---|
| T3-01 | §2-D2 "**Playwright is the anchor**", not ad-hoc Claude-drives-a-browser | BUILT | `scripts\feature-verify\playwright.feature-verify.config.ts` — real config, `workers:1`, `retries:0`. |
| T3-02 | §4/§5A deterministic core **drives the real UI** — clicks, typing, `setInputFiles` incl. `webkitdirectory` folder uploads | **NOT BUILT** | The only spec, `scripts\feature-verify\visual-qa-import.feature-verify.spec.ts`, uses `playwrightRequest.newContext()` (line 33) and `api.post/get/delete` throughout. **Zero** `page.`, click, keystroke or `setInputFiles` call in the whole directory. Corroborated by the file's own status block at `references\stage-3-feature-verifier.md:23-25`. |
| T3-03 | §5A system-state assertion for files: `fs` stat **+ read the bytes back** | BUILT+PROVEN-by-use | `scripts\feature-verify\harness\system-state.ts` `assertFileOnDisk` (reads bytes, supports `exactBytes`); used at `visual-qa-import.feature-verify.spec.ts:88`. **No unit test exists** — the directory has no `*.test.*` file — so "proven" here means "has a real call site", not "has a test". Scored **BUILT**. |
| T3-04 | §5A system-state assertion for DB rows (a DB client) | PARTIAL | Realised as `assertViaApi` (`harness\system-state.ts`), deliberately going through the app API for ONE DOOR rather than a DB client. The clause's *intent* is met; its *letter* (a DB client) is not. Call site: `visual-qa-import.feature-verify.spec.ts:73`. |
| T3-05 | §5A downstream SDK/API assertions for services | **NOT BUILT** | No downstream-service assertion helper in `scripts\feature-verify\harness\`. |
| T3-06 | §4/§5A **Testcontainers** for disposable real dependencies | **NOT BUILT** | Named only as prose: `scripts\feature-verify\README.md:79`, `references\stage-3-feature-verifier.md:113`. Not installed; the reference's own status block says so (line 32-35). |
| T3-07 | §4 `expect.poll()` / `toPass()` for async effects | PARTIAL | A hand-rolled `pollUntil` exists (`harness\system-state.ts`), not Playwright's `expect.poll`/`toPass`. **Zero call sites** — confirmed by the reference's own status block (line 27). |
| T3-08 | §4/§5A trace / video / network / console **always on** | PARTIAL | Configured: `playwright.feature-verify.config.ts` `trace:'on', video:'on', screenshot:'on'`. **Never produces anything** — API-only specs create no browser context (status block line 36-37). Configured ≠ captured. |
| T3-09 | §4/§5A `toHaveScreenshot` / Lost Pixel visual regression | **NOT BUILT** | Not installed; prose only (`README.md:78`). |
| T3-10 | §4/§5A `@axe-core/playwright` **as a hard gate** | **NOT BUILT** | Not installed. Explicitly recorded as a known deviation at `references\stage-3-feature-verifier.md:32-35`. |
| T3-11 | §4/§5A Lighthouse-CI perf budgets | **NOT BUILT** | Same as T3-10. |
| T3-12 | §5B Unicode: assert stored name is **NFC** and `=== expected.normalize('NFC')` | BUILT | `harness\unicode.ts` (`assertNfcPreserved`); exercised at `visual-qa-import.feature-verify.spec.ts:111,139`. No unit test; the spec that uses it needs a live app. |
| T3-13 | §5B assert **not ASCII-transliterated** (raw codepoints preserved) | BUILT | `harness\unicode.ts`, used at `visual-qa-import.feature-verify.spec.ts:102-124` with Telugu + Tamil + emoji fixtures (`SCRIPT_FIXTURES`). |
| T3-14 | §5B verify bytes match in **both** the DB row **and** the on-disk dirent | PARTIAL | Both mechanisms exist (`assertViaApi` + `assertFileOnDisk`), but the unicode case (case 2/3) asserts only the API-read text; the on-disk byte assertion is used solely in the happy case with fixed ASCII bytes (`visual-qa-import.feature-verify.spec.ts:88`). **No case asserts non-ASCII bytes on disk** — which is the spec's headline. |
| T3-15 | §5B hard fixtures: Telugu, Tamil, emoji, combining marks, RTL, long names | PARTIAL | `harness\unicode.ts` ships `SCRIPT_FIXTURES` + `NORMALIZATION_PAIR`; Telugu/Tamil/emoji and an NFD combining pair are used. **RTL and long-name fixtures are not exercised by any case**; whether they exist in the fixture set was read as present-in-file but not asserted anywhere. |
| T3-16 | §5C **auto-enumerate** a case matrix from the feature's spec/ACs | **NOT BUILT** | No case-gen module exists. `grep -rl "case.gen\|caseGen\|case_matrix_plan"` over `scripts\`, `references\`, `prompts\` hits only two prose files. `prompts\feature-verifier-prompt.md:31` handles the absence by telling the agent to **STOP** — an honest guard, but the generator it points at does not exist as code. |
| T3-17 | §5C variants enumerated: happy / edge (empty·max·boundary) / error (net-fail·provider-down·permission) / data (non-ASCII·large·duplicate·corrupt·mixed) | PARTIAL | The taxonomy is written (`references\stage-3-feature-verifier.md:93`, `harness\report.ts` `variant?: 'happy'\|'edge'\|'error'\|'data'`). The one real spec instantiates **3 cases**: 1 happy, 2 data. No edge or error case exists anywhere. |
| T3-18 | §5C owner **reviews/adjusts the plan before any run** (a lock-in on the test plan) | BUILT (prose) | `prompts\feature-verifier-prompt.md:23,31-32,132` ("Owner-reviewed matrix before any run — no invent-and-run"). Enforced by prompt discipline; nothing mechanical, because there is no plan artifact to gate on (see T3-16). |
| T3-19 | §5C emit Playwright specs + a capture/record harness + the analysis config | PARTIAL | The harness and config exist (`scripts\feature-verify\harness\*`, `playwright.feature-verify.config.ts`). **Nothing emits specs** — the one spec is hand-written. |
| T3-20 | §5D per-**step** record (timestamp, action, screenshot, network, console) | **NOT BUILT** | `harness\report.ts` `CaseResult` has an `action_log?: unknown` field and nothing populates it; no per-step recorder exists. |
| T3-21 | §5D per-**case** record (inputs, action log, system-state values, duration, pass/fail, evidence paths) | PARTIAL | `harness\report.ts` `CaseResult` defines all of these fields and the spec populates `inputs`, `system_state`, `outcome`, `evidence`. **`action_log` and duration are never populated.** |
| T3-22 | §5D per-**run** machine-readable JSONL | PARTIAL | `writeMatrix` + the config's `['json', {outputFile}]` reporter emit JSON, not JSONL. Minor, but the clause says JSONL. |
| T3-23 | §5D human-readable **case×outcome matrix** with each red linked to its proof | BUILT | `harness\report.ts` (`Matrix.renderTable()`), written by `visual-qa-import.feature-verify.spec.ts:40`. No test. |
| T3-24 | §5D **deltas vs the previous run** | **NOT BUILT** | No prior-run comparison anywhere in `harness\report.ts`. |
| T3-25 | §5D persist to Ottomate reusing `flow_test_runs` / `test_runs` + an evidence store | BUILT / UNKNOWN | Helpers exist and are named: `harness\report.ts:118` (`postFlowTestRun`) and `:137` (`postTestRun`). `postReport` is called (`spec:39`); **`postTestRun` has no caller** (status block line 30-31). Whether the endpoints accept these payloads is app-side → UNKNOWN. |
| T3-26 | §5E per-test unique working dirs + seeded state | PARTIAL | `caseEvidenceDir` gives per-case evidence dirs (`harness\evidence.ts`). No seeded-state or per-test working-dir mechanism. |
| T3-27 | §5E freeze time/animations (Playwright **Clock API**) | **NOT BUILT** | Named only in a config comment: `playwright.feature-verify.config.ts:5`. No spec calls it. |
| T3-28 | §5E stable fonts | **NOT BUILT** | No font pinning anywhere in the config or harness. |
| T3-29 | §5E tag genuinely external-dependency cases | PARTIAL | The `axis` / `outcome:'skipped'` vocabulary supports it (`harness\report.ts`), but no case uses it and there is no explicit external-dependency tag. |
| T3-30 | §5E **no self-healing selectors**; use `getByRole`/`getByTestId`/ARIA snapshots | BUILT — vacuously | `harness\selectors.ts` provides only `oid()`/`oidWithin()` and its header states the ban. The rule cannot be violated because **nothing selects anything**: `oid()` has zero call sites (status block line 26). |
| T3-31 | §5F prefer owner-provided real fixtures; synthesize when scarce | PARTIAL | `harness\unicode.ts` synthesizes script fixtures. No owner-fixture intake path exists. |
| T3-32 | §5F curate a reusable **per-feature fixtures set** | **NOT BUILT** | Prose only: `references\stage-3-feature-verifier.md` ("under the project's `tests/e2e/feature-verify/fixtures/`"). No such directory or convention in code. |
| T3-33 | §5F the skill **asks** for domain data it can't synthesize | BUILT (prose) | `references\stage-3-feature-verifier.md` ("The skill **asks** (AskUserQuestion)"). |
| T3-34 | §5G/§5H Explorer = Claude Code runs the playbook and **freezes each finding into a deterministic Playwright spec** | **NOT BUILT** | Playbook written (`references\stage-3-feature-verifier.md:133-148`; 5 jobs, matching §5H). **No Explorer finding has ever been frozen into a spec** — the reference says so itself (line 28-29), and there is exactly one hand-written spec in the tree. |
| T3-35 | §5G Judge = Claude scores subjective cells **against a written rubric**, recording `{verdict, score, rubric_ref, evidence_paths, rationale}`, advisory only | PARTIAL | The *contract* exists: `harness\report.ts` `judge_verdict?: unknown`; `references\stage-3-feature-verifier.md:150-156`; `prompts\feature-verifier-prompt.md:87`. **No rubric file exists and `judge_verdict` has no producer** (status block line 28-29). The advisory-only property is honoured by `Matrix.verdict()`, which ignores the field. |
| T3-36 | §6 both verifiers are **independent sub-agents blind to coder claims** | BUILT | `SKILL.md:63` (two sibling verifiers, "inputs are the locked manifest + diff … never coder claims"); `prompts\feature-verifier-prompt.md:5,127`. Prompt/dispatch discipline; nothing mechanical. |
| T3-37 | §6 **completion gate = both green**, wired into the Stage-3→deploy gate | BUILT | `SKILL.md:55` — the 3→deploy gate lists "**feature verifier APPROVE on every user-facing feature**" alongside the code verifier and the `flow_test_runs` check. |
| T3-38 | §6 wired into the **Stage-4.7** per-item verify | PARTIAL | `SKILL.md:86` (rule 10) says the feature verifier runs "Stage 3 + Stage 4.7". But `references\stage-4-mini-pipeline.md` §4.7 (line 187 ff., and the API table at line 296) describes **one** verifier writing one `verification_reports` row via `verifier-result`; there is no feature-verifier leg in the 4.7 mechanics. The rule asserts it; the pipeline reference does not implement it. |
| T3-39 | §6 skill **rule 10** gains the sibling ("feature verifier mandatory for user-facing features") | BUILT+PROVEN-by-inspection | `SKILL.md:86` — verbatim. |
| T3-40 | §6/§11 **fail closed** — a skipped/mocked step can never render green | BUILT | `harness\report.ts` `Matrix.verdict()`: `fail>0 → BLOCK`; `skipped>0 → ITERATE` with reason "not a clean pass". Logic read directly. **No test exercises it** — there is no test file in `scripts\feature-verify\`. Register claims it "correctly fail-closed": register claim only, not independently verified. |
| T3-41 | §6/D5 block-on-red for `cv`/public, **warn** for personal (adr-014) | BUILT | `Matrix.verdict(riskPolicy)` in `harness\report.ts` sets `mandatory_user_review` from the policy and annotates "personal → warn-recorded, not blocking". Untested. |
| T3-42 | §11 AI verdicts never gate; always evidence-backed | BUILT | `Matrix.verdict()` never reads `judge_verdict`; `prompts\feature-verifier-prompt.md:129`. |
| T3-43 | §12 AC1 — from a feature spec, the skill **auto-produces a reviewable case matrix** | **NOT BUILT** | Follows from T3-16. |
| T3-44 | §12 AC2 — runs independently, **drives the real app via Playwright**, asserts system state with evidence | PARTIAL | System-state assertions are real (T3-03/04). "Drives the real app" is HTTP-only (T3-02). "With evidence" is configured but never produced (T3-08). |
| T3-45 | §12 AC3 — case×outcome matrix + structured results + evidence; a red links to exact proof | PARTIAL | Matrix + structured results exist (T3-23). **No red case has ever been produced and persisted** — the reference's own "to reach APPROVE" bar names this (line 39-40). |
| T3-46 | §12 AC4 — a user-facing feature passes only when **both** verifiers are green | BUILT | `SKILL.md:55,86`. Gate is declared in the skill's HARD list; never exercised end-to-end on a real feature. |
| T3-47 | §12 AC5 — runs in the build session; **a critical subset re-runs nightly in CI** | PARTIAL | Build-session run: possible (config + one spec). **Nightly CI is not wired** — no workflow, no cron entry, and `postTestRun()` has no scheduled caller (status block line 30-31). |

## Task 3 — what is genuinely missing

1. **The browser leg — the whole point of the task.** No spec clicks, types, uploads a file, or takes a
   screenshot. Everything is HTTP. The spec's §1 framing ("drives the running app like a QA human") is
   unrealised, and the reference file says so plainly.
2. **Case generation (AC1).** There is no generator; the prompt correctly refuses to run without a plan,
   which means the gate is unreachable rather than merely unused.
3. **The four named OSS layers** — axe-core (a *hard gate* in the spec), Lighthouse-CI, Lost Pixel,
   Testcontainers — are not installed. Recorded as a deliberate deviation, not hidden.
4. **Nightly CI.** Nothing runs on a schedule.
5. **Explorer and Judge are prose.** No rubric file, no producer for `judge_verdict`, no frozen finding.
6. **No red case, no evidence artifact, ever.** A gate that has never blocked is not evidence it can.
7. **The harness has no unit tests at all** — including `Matrix.verdict()`, the fail-closed logic the
   whole gate rests on.
8. **The 4.7 wiring is asserted in `SKILL.md` but absent from `stage-4-mini-pipeline.md`'s 4.7 mechanics.**

---

# Task 2 — Iterative UI Design Method

Spec sections decomposed: §2 decisions · §4 core loop · §5A–5G · §6 plug-points · §7 theme-from-content ·
§8 phasing · §11 risks · §12 acceptance (10 criteria).

| id | clause | state | evidence |
|---|---|---|---|
| T2-01 | §2-D1 home = Stage 2 **and** Stage 4.4.6; an upgrade, not a new pipeline | BUILT | `SKILL.md:40` (Stage-2 chain names `stage-2-design-method.md`); `references\stage-4-mini-pipeline.md:142` (§4.4.6 exists); `references\stage-2-design-method.md` "Where it plugs in". |
| T2-02 | §2-D2 / §4.2 show **2–4 genuinely different** real interactive variants, never prose | BUILT+PROVEN | `scripts\preview-build\isolation-gate.mjs` enforces axis-diff, control-diff, blind-sort and option-count-by-rung; `preview-build\isolation-gate.test.mjs` **36/36**, incl. a samey set rejected with exit 2. Note the spec's flat "2–4" was **superseded** by count-by-rung (`SKILL-REGISTER.md` §5). |
| T2-03 | §2-D2 **mixing is the point** ("1A's meta + 2C's button") | BUILT+PROVEN | `scripts\generation\picks-to-ledger.mjs` writes one `design_decisions` row per sub-decision with `mixed_from`; covered inside `generation/*.test.mjs` **150/150** (two test files import it). |
| T2-04 | §2-D3 / §4.4 / §5E **one evolving preview at a STABLE URL**, republished in place each round | **PARTIAL — deliberate deviation** | `scripts\generation\publish-round.mjs:49` builds `design-rounds/<slug>/<target>/r${round}` — a **new URL per round**; `publish-round.test.mjs:66` pins `/api/previews/design-rounds/demo/demo.media-card/r1/index.html`. `references\stage-2-design-method.md` loop rule 4 reframes this as "its own stable in-app URL … earlier rounds stay addressable". Defensible, but it is not the clause as locked, and the spec text was not amended. |
| T2-05 | §2-D3 preview is self-contained | BUILT+PROVEN | `scripts\preview-build\build-variant-set.mjs:31` embeds images as `data:` URIs; placeholder guard covered by `preview-build/*.test.mjs` **17/17** and `card-slots.test.mjs`. |
| T2-06 | §2-D3 **real content**, not lorem | BUILT | `build-variant-set.mjs` + `fillCardSlots` (`card-slots.test.mjs` 9 cases inside the 17/17). Real Radarr posters used in the live round per `SKILL-REGISTER.md` §2; the *rule* "never lorem" is prose (`stage-2-design-method.md` Step 5) plus the placeholder guard, which catches unfilled slots, not fake content. |
| T2-07 | §2-D3 **interactive** (real hover/motion) | PARTIAL | Panels are CSS-interactive only: declarative-shadow-DOM content is inert, so panel JS never runs (`harness-dsd.test.mjs` 6/6; `stage-2-design-method.md` loop rule 3). **The plugin's copy of the spec carries a §11b owner amendment redefining "interactive" as CSS-interactive; the Desktop original does not.** Against the audited (Desktop) text this is PARTIAL; against §11b it is BUILT. |
| T2-08 | §2-D3 themed **light + dark** | BUILT | `prefers-color-scheme` present in `scripts\preview-build\template.variant-set.html` (3 occurrences) and `template.card-wall.html` (2). No test asserts both worlds render. |
| T2-09 | §2-D3 **primary-screen-tuned** (4K-first if primary) | BUILT | The owner's real screen is measured and encoded — 2194×1234 logical — in `references\design-doctrine.md` rule 83 and the P1 profile in `data\design-rules.json`. Nothing mechanically checks a round against it (`adv-large-display-structure` is `scope:'app'`, `pending`). |
| T2-10 | §2-D4 variants render **real `master_components`**, tagged by source; quick-build only to fill gaps | BUILT+PROVEN (the policy) / **NOT BUILT** (the practice) | `scripts\generation\catalog-source.mjs` defines the tagging convention (`{kind:'catalog', mc_id}` / `{kind:'bespoke', why}`) and `checkSourcePolicy`; tested in `generation\stage3-gates.test.mjs` (inside 150/150). **But `SKILL-REGISTER.md` §5 Known defects still records "The catalog is bypassed" — `must_use` empty on the real round** — and the register notes the existing Screenroom config is *refused* by the new check. So the rule exists and blocks; no round has yet satisfied it. |
| T2-11 | §2-D5 output = **agreed design spec + preview URL**, handed to Stage 3; design ≠ implementation | BUILT+PROVEN | `scripts\generation\emit-design-artifacts.mjs` → tokens file + spec, `emit-design-artifacts.test.mjs` **14/14** (inside 150/150): namespaced tokens, `--dry-run` writes nothing, refuses a dirty tree, never pushes. |
| T2-12 | §2-D6 **theme-from-content is the core differentiator**, wired early for asset-rich projects | BUILT | `scripts\preview-build\theme-extract.mjs` (ImageMagick dominant-vibrant). No test file names it; `SKILL-REGISTER.md` reports an independent byte-identical re-run — **register claim only, not independently verified** here. |
| T2-13 | §4.1 "Show, don't tell" | BUILT (prose) | `references\stage-2-design-method.md` core loop rule 1. Method rule, not code. |
| T2-14 | §4.5 "Precise reaction → precise rebuild — restate what you understood" | BUILT (prose) | `stage-2-design-method.md` loop rule 5, Step 7. Listed under "Prose only (nothing checks them)" in `SKILL-REGISTER.md` §3. |
| T2-15 | §4.6 / §5G **lock explicitly**; never silently revisit | BUILT | `design_decisions` lock-earned (`confirmed:true`) and unlock-needs-reason are live 422s per `SKILL-REGISTER.md` §2 — **register claim only** (app-side, unverifiable here). The client-side half (`picks-to-ledger.mjs`, `ledger-context.mjs`) is tested inside 150/150. |
| T2-16 | §5A **context gate (mandatory)** — audience / use-cases / brand-tone / primary screen before any visual | BUILT+PROVEN | `scripts\generation\pre-round-gates.mjs` `contextGate` + `CONTEXT_KEYS`; `generation\stage3-gates.test.mjs` — *"a complete context passes"*, *"MUST STOP — a missing answer blocks at P3 and advises at P1"*. |
| T2-17 | §5A "**Do not proceed to visuals without it**" (a hard stop) | PARTIAL | At **P1 — the owner's own profile — the gate `advise`s, it does not block** (`pre-round-gates.mjs` contextGate). A documented, reasoned softening ("the owner alone pays for their own wrong round"), but the locked clause says do not proceed. `SKILL-REGISTER.md` §2 also still carries a separate row calling the context gate "🟡 prose". |
| T2-18 | §5B worklist decomposition into their-call / propose-react / you-drive-approve-once | PARTIAL | The three-way taxonomy is prose (`stage-2-design-method.md` Step 2). The **code** worklist is a different thing: `scripts\generation\design-intent.mjs:108-130` derives a worklist as a *query* over live rows, tested in `design-intent.test.mjs` (*"only UI-bearing, live, component/page items reach the worklist"*, *"unpicked component slots join the worklist"*). The eye-driven categorisation is not in it. |
| T2-19 | §5B owner picks **order + granularity** (one component vs a cluster) | BUILT (prose) | `stage-2-design-method.md` Step 2; scope vocabulary `component\|cluster\|page\|site` exists in `scripts\generation\method-routing.mjs` and is tested (`method-routing.test.mjs`, 9 cases). The *asking* is prose. |
| T2-20 | §5C rung **A** — 3–5 whole-vibe direction/style-boards with named palette + type voice + mood + hero sample | PARTIAL | Rung exists and routes: `method-routing.mjs:17` maps `direction`=A; `data\design-directions.json` holds 20 named directions + an adjective map. **No code enforces the 4–6 hex + type voice + mood + hero-sample composition of a style board.** |
| T2-21 | §5C rung **A½** — core mechanic iterated in depth **before** per-component work | BUILT+PROVEN | `pre-round-gates.mjs` `coreMechanicGate` — page/site scope blocked without a **locked** rung-1 decision (a merely `proposed` mechanic does not release it); `generation\stage3-gates.test.mjs`. |
| T2-22 | §5C rung **B** — per component, 2–4 real variants side by side, tagged by source, pick/mix | BUILT+PROVEN | Option-count-by-rung + axis isolation in `isolation-gate.mjs` (36/36); source tagging in `catalog-source.mjs` (tested in `stage3-gates.test.mjs`); mixing in `picks-to-ledger.mjs`. |
| T2-23 | §5C rung **C** — clusters → whole-page → micro, at real density on the target screen | PARTIAL | The rung is routed (`method-routing.mjs` `RUNGS_BY_SCOPE`, tested). **No cluster or whole-page round has been built or run** — every real round to date is `component` scope on `screenroom.poster-card` (`SKILL-REGISTER.md` §2 row "A real end-to-end round"). |
| T2-24 | §5C "**Vary on the *open* axis**" — each variant set isolates the decision it names | BUILT+PROVEN | `isolation-gate.mjs` axis-diff + `distinct-source` + `value-present`; `isolation-gate.test.mjs` 36/36, incl. the byte-identical-panels hole reproduced and now blocked. |
| T2-25 | §5D-**A** asset-fetcher — real content from **project APIs**, retry/proxy-robust | **PARTIAL → effectively NOT BUILT** | What exists is a local filesystem read: `assetRoot` + `cards[].image` (`scripts\preview-build\README.md:95-110`, `build-variant-set.mjs`). The README says a project-API fetch is "extending the asset step". **There is no fetcher, no retry, no proxy handling.** |
| T2-26 | §5D-**B** theme-extractor, pluggable | BUILT | `scripts\preview-build\theme-extract.mjs`. No test names it. |
| T2-27 | §5D-**C** template + injector; **verify no placeholder is left unfilled** | BUILT+PROVEN | `build-variant-set.mjs` (placeholder guard) + `fillCardSlots`; `preview-build\card-slots.test.mjs` (inside 17/17). |
| T2-28 | §5D-**D** artifact-publisher → stable URL, fast in-place update | BUILT+PROVEN (publisher) / PARTIAL (stable URL) | `scripts\generation\publish-round.mjs` + `publish-round.test.mjs`; `--replace` guards overwriting an existing (target, round). Stable-URL caveat: see T2-04. The **host changed** from Claude Artifacts to the Ottomate app (owner decision, `SKILL-REGISTER.md` §5 Superseded) — a knowing deviation from §10's resolved "preview host = Claude Artifacts". |
| T2-29 | §5D-**E** decision-ledger; survives long sessions; **reloads on resume**; **full decisions, no char cap** | BUILT / **internally contradicted** | `scripts\generation\ledger-context.mjs` `resumeSummary`, tested (`ledger-context.test.mjs`, 9 cases inside 150/150); wired at `SKILL.md:32` (session-start step 4, auto `GET …/design-decisions`). **But `references\stage-2-design-method.md` Step 4-E states "Reload is NOT automatic — the session-start path does not fetch the plan".** Two skill files disagree about the same behaviour; `SKILL.md` is the one that actually runs. Uncapped rationale: register reports a 2160-char round-trip — register claim only. |
| T2-30 | §5D-**F** component library = `master_components` | BUILT | `scripts\import-master-components.ts`; `catalog-source.mjs` ranking. See T2-10 for the practice gap. |
| T2-31 | §5D "**Fold A→D into ONE command**" | BUILT | `scripts\generation\design-round.mjs` — gates → build → check → computed → publish, fail-closed, and refuses to publish a file other than the one it just built. **No test names `design-round.mjs`** (grep over all suites: only its own file and a URL string in `publish-round.test.mjs`). |
| T2-32 | §5E previews are CSP-safe / inline / `data:` URIs | BUILT+PROVEN | `build-variant-set.mjs:31`; the feasibility rule `no-network` (incl. 12 named placeholder services) is enforced by `design-check\checks.mjs` with must-fail + must-pass cases in `design-check.test.mjs`. |
| T2-33 | §5F anti-slop tells detected (cyan-on-dark, purple→blue gradients, glassmorphism everywhere, default typefaces, centred-everything, `rounded-lg`, accent bar) | BUILT+PROVEN — **advisory only** | `adv-no-slop-tells` in `design-check\checks.mjs`, tested. It fires on the project's own `template.card-wall.html`. Advisory by construction, so it never blocks. `SKILL-REGISTER.md` §3 still lists "anti-slop tells" under **Prose only**, which is now wrong in the pessimistic direction. |
| T2-34 | §5F "**Colour-budget rule (hard)**" — accent on ≤ a stated few surfaces, neutral elsewhere | BUILT+PROVEN | `adv-accent-budget` measured by **pixel share**, not declaration count: `design-check\pixel\pixel-rules.mjs`, `pixel-rules.test.mjs` **8/8** (+ `pixel.test.mjs` 14/14 = 22/22). Over-budget blocks; monochrome is reported, not blocked. |
| T2-35 | §5F "**restraint ≠ monochrome**" | BUILT+PROVEN | Same rule; monochrome deliberately reported not blocked (`computed-checks.js`, tested). |
| T2-36 | §5F **state the budget up front** | PARTIAL | `colorBudget` is a config field (`preview-build\README.md:95-104`), so it can be stated. Nothing requires it to be stated before a round; `SKILL-REGISTER.md` §3 lists "colour-budget stated up front" under **Prose only**. |
| T2-37 | §5F **pressure-test each variant before presenting** (action-vs-brand colour, motion comfort, contrast/a11y) | PARTIAL | Contrast is enforced (`floor-contrast`, computed, real Chromium); reduced-motion is enforced (`floor-reduced-motion`, which caught all nine of the project's own published panels). **Action-colour-vs-brand-colour and "motion comfort" have no check**, and the pressure-test *pass* itself is listed under **Prose only** in `SKILL-REGISTER.md` §3. |
| T2-38 | §5G on a **primary decision, ask with concrete options** — never pick silently | BUILT (prose) | `stage-2-design-method.md` Step 7; `references\propose-confirm.md`. Explicitly "Prose only" in `SKILL-REGISTER.md` §3. |
| T2-39 | §5G **never regress a locked item** | BUILT+PROVEN | `diffAgainstSnapshots` / `snapshotForLock` in `scripts\generation\ledger-context.mjs`; `ledger-context.test.mjs` (9 cases). Source/value-level only — pixel-level regression is not wired to this gate. |
| T2-40 | §5G keep a visible **locked vs open** list | BUILT+PROVEN | `resumeSummary` partitions open / locked / frozen / rejected; `ledger-context.test.mjs`; surfaced per `SKILL.md:32`. |
| T2-41 | §6 Stage-2 files gain the A→B→C method; the UI master plan becomes the **decision-ledger home** | BUILT | `references\stage-2-design-method.md` (the method), `references\stage-2-ui-master-plan.md` (`design_ledger` blob). App-side persistence unverified here. |
| T2-42 | §6 Stage 4.4.6 uses the same loop for per-iteration aesthetic items | BUILT | `references\stage-4-mini-pipeline.md:142` (§4.4.6 design-taste pre-pick) + `stage-2-design-method.md` "Where it plugs in" (upgrades the 2–3-swatch flow to the full ladder "when the item warrants it"). No round has run through 4.4.6. |
| T2-43 | §6 preview published as a **Claude Artifact** (private URL, republished in place) | **NOT BUILT — knowingly superseded** | Owner decision 2026-07-27: the design surface moved into the app (`/projects/<slug>/design/<target>`); the Artifact path is retired across 4 files (`SKILL-REGISTER.md` §5 Superseded; `stage-2-design-method.md` header). §10 of the locked spec resolved this to "Claude Artifacts", so the spec text is now stale, not the build. |
| T2-44 | §7 pull real assets and derive **per-item** tokens from the content itself | BUILT | `theme-extract.mjs` + `{{ACCENT_n}}` per-card slots (`card-slots.test.mjs`). Register reports real Radarr posters producing varied accents — register claim only for the live run. |
| T2-45 | §7 per-project **asset-source config** (Phase 2) | PARTIAL | `assetRoot` + `cards[].image` in the variant-set config **is** a per-project asset-source config for a filesystem source (`preview-build\README.md:108-110`). It is not a config for a project *API* source, which is what §7 describes. |
| T2-46 | §12 AC1 — context gate captured before any visual | PARTIAL | Gate exists and is tested (T2-16) but **advises rather than blocks at P1** (T2-17), which is the owner's own profile and therefore the normal case. |
| T2-47 | §12 AC2 — worklist decomposed; owner picks order/granularity | PARTIAL | Worklist-as-query built and tested (T2-18); the eye-driven three-way decomposition and the order/granularity ask are prose. |
| T2-48 | §12 AC3 — each round shows 2–4 real interactive variants; owner picks/mixes; rebuild republishes to the **same URL**; locked items carry forward | PARTIAL | Variants + pick/mix + carry-forward: BUILT+PROVEN. **Same URL: not met** (T2-04). **"Interactive": CSS-only** (T2-07). |
| T2-49 | §12 AC4 — previews self-contained, real content, interactive, light/dark, primary-screen-tuned | PARTIAL | Self-contained + real content: proven. Light/dark: built, untested. Primary-screen-tuned: encoded as doctrine, unchecked. Interactive: CSS-only. |
| T2-50 | §12 AC5 — ledger records **every lock + rationale**, survives the session, reloads on resume | BUILT | Code + tests exist (T2-29, T2-40). **The live ledger has 10 rows, all `in-review`, zero locked** (given; `SKILL-REGISTER.md` §2), so "records every lock" has never been exercised on real data. |
| T2-51 | §12 AC6 — output = an agreed design spec (tokens + per-component specs + preview URL) handed to Stage 3 | BUILT+PROVEN | `emit-design-artifacts.mjs` + `emit-design-artifacts.test.mjs` 14/14; Stage-3 handoff gate `stage3DesignGate` in `method-routing.mjs`, tested. Demonstrated on a **throwaway** project, not on Screenroom (nothing is locked there). |
| T2-52 | §12 AC7 — anti-slop **+ ask-on-primary enforced** | PARTIAL | Anti-slop: detected, advisory (T2-33). **Ask-on-primary: prose, enforced by nothing** (T2-38). |
| T2-53 | §12 AC8 — core mechanic locked **before** whole-page work; each variant set isolates one decision | BUILT+PROVEN | `coreMechanicGate` (`stage3-gates.test.mjs`) + `isolation-gate.mjs` 36/36. |
| T2-54 | §12 AC9 — colour budget stated **and** honoured; not monochrome | PARTIAL | Honoured: measured in pixels and blocking (T2-34). **Stated up front: not enforced** (T2-36). Note the project's own published r1 panels measure ~10× **under** budget (0.72 / 0.51 / 1.11 % vs 10±5 %) — the rule fired on its authors' own work and the threshold was not moved. |
| T2-55 | §12 AC10 — pipeline runs as **one command**; ledger stores **full** decisions (no char cap) | BUILT | `design-round.mjs` exists and is fail-closed (T2-31) but **no test names it**. Uncapped rationale is a register claim (2160-char round-trip), not verified here. |
| T2-56 | §8 Phase 2 = real-asset fetcher + theme extractor + per-project asset config, "wire early for asset-rich projects" | PARTIAL | Extractor: built. Fetcher: not built (T2-25). Per-project config: filesystem-shaped only (T2-45). |
| T2-57 | Stage 4 graduation of a locked bespoke variant into `master_components` (§5C "worth seeding back"; H1 contract) | **NOT BUILT** (given, and confirmed) | `scripts\generation\graduate.mjs` — header states plainly "**It DOES NOT write to the catalog** — the target columns (spdx_id/author/attribution/retrieved_at/trademark_flag/grade) do not exist yet". `draftGraduation()` returns `{writes:false, …}`. Tested as a draft (`graduate.test.mjs`, 6 cases) — the tests prove it *refuses*, not that it graduates. |

## Task 2 — what is genuinely missing

1. **The asset-fetcher (§5D-A).** The pipeline reads local files; there is no project-API fetch, no retry,
   no proxy handling. This is the one §5D letter with essentially nothing behind it.
2. **Stage 4 graduation.** Confirmed not started: `graduate.mjs` never writes and the catalog schema lacks
   the provenance/grade columns.
3. **"Same URL each rebuild" (D3 / loop rule 4 / AC3).** Implemented as per-round URLs. Reasonable, but the
   locked text was not amended and the deviation is easy to miss.
4. **The context gate does not block at P1** — the owner's own profile — so AC1 is soft exactly where it
   is used.
5. **Ask-on-primary, pressure-test-before-presenting, and colour-budget-stated-up-front are prose.** AC7
   and AC9 each have one half enforced and one half not.
6. **Rungs A and C have never run.** Every real round is a component-scope B round on one target.
7. **Nothing is locked on the live project.** The ledger, the emitter and the style-priors machinery are
   proven on a throwaway project only; the real Screenroom round has 10 `in-review` rows and no picks.
8. **`design-round.mjs` — the one-command criterion — has no test.**

---

# SCORECARD

| Task | Clauses | BUILT+PROVEN | BUILT | PARTIAL | NOT BUILT | UNKNOWN |
|---|---:|---:|---:|---:|---:|---:|
| **Task 1** — visual-QA intake | 44 | 2 | 18 | 5 | 5 | 14 |
| **Task 3** — feature verifier | 47 | 1 | 14 | 17 | 14 | 1 |
| **Task 2** — design method | 57 | 17 | 19 | 17 | 4 | 0 |
| **Total** | **148** | **20** | **51** | **39** | **23** | **15** |

*Counting rules, stated so the numbers can be re-derived:*
- *Rows carrying a **split verdict** were counted once, at the **weaker** of the two states —
  T2-10 (policy proven / practice absent) → NOT BUILT · T2-25 (`PARTIAL → effectively NOT BUILT`) →
  NOT BUILT · T2-28 (publisher proven / URL partial) → PARTIAL · T3-25 (helper built / endpoint
  unverifiable) → UNKNOWN · T1-11 and T1-19 likewise.*
- *`BUILT (prose)` counts as **BUILT** — a method rule in a reference file is code the model executes,
  but nothing tests it.*
- *`BUILT+PROVEN-by-inspection` (T1-22, T3-39) counts as **BUILT+PROVEN**: the clause is "this file/line
  exists", which is directly verified rather than test-covered. Only two rows use it.*
- *`BUILT+PROVEN-by-use` (T3-03) counts as **BUILT** — a call site is not a test.*
- *`BUILT — vacuously` (T3-30) counts as **BUILT**: the rule cannot be violated because nothing exercises it.*
- *Deliberate, owner-approved deviations (T2-04, T2-43) are still scored against the **locked text**, with
  the deviation named in the row. Scoring them as met would make the spec unfalsifiable.*

## Honest verdict, one line per task

- **Task 1 — visual-QA intake: NOT verifiable as complete from here, and demonstrably incomplete where it
  *is* verifiable.** The extension is real and rich (it exceeds the spec in places — direct push landed
  early); the two skill-wiring clauses the spec names by filename were never written, so acceptance
  criterion 5 fails outright; and 14 of 44 clauses live in an app this machine cannot reach, so the
  register's "✅ complete, dogfooded" rests on evidence I could not see.
- **Task 3 — feature verifier: a well-designed harness with the load-bearing half missing.** 14 clauses
  NOT BUILT and 17 PARTIAL — including T3-02, the browser leg the whole spec is named after — plus no
  case generator, no red case ever produced, and no unit tests at all. The reference file says all of
  this about itself, which is the most creditable thing in this audit.
- **Task 2 — design method: the strongest of the three by a wide margin, and the only one with real
  enforcement behind its acceptance criteria** — 17 BUILT+PROVEN, 79 of 91 machine rules enforced with
  named tests, gates that have blocked the project's own work. What holds it short of done is that the
  method has never been run to a lock on a real project, rung A and rung C are unexercised, and Stage-4
  graduation has not started.

---

# Clauses I could not assess, and why

**15 UNKNOWN rows — 14 in Task 1, 1 in Task 3 — and 14 of them share one cause: the Ottomate app is not
on this machine.** `curl -m 4 http://127.0.0.1:8110` → `000`; no local checkout (`grep -rl import-visual-qa`
over `C:\Users\pdsva` returns only skill docs and one Playwright spec).

- T1-13 · T1-14 · T1-15 · T1-16 · T1-17 — the import endpoint, the single `report` row, screenshot
  storage, the evidence fields, the `report_comments` table.
- T1-19 (endpoint half) · T1-20 · T1-21 — the classify call and the 4.3 lock-in view with thumbnails.
- T1-32 — v1/v2 version inference (happens in the import route).
- T1-34 — asset-store vs DB-blob storage.
- T1-41 · T1-42 · T1-43 — acceptance criteria 2, 3 and 4, which are end-to-end app behaviours.
- **T3-25** — `postFlowTestRun` / `postTestRun` exist and are readable, but whether
  `flow_test_runs` / `test_runs` accept these payloads is an app-side question. Counted at the weaker
  state, UNKNOWN, rather than crediting the helper's existence as the clause.
- T1-09 (the v1-ingest half) and T1-18 are recorded as PARTIAL rather than UNKNOWN because the *local*
  half of each was verifiable.

**One genuinely undetermined technical clause:**
- **T1-03 — "honours `devicePixelRatio`".** The `dpr` value is captured into the locator rect
  (`lib.js:79-85`), but whether `outlineScreenshot` scales the outline by it was not traced through the
  canvas code, and no test asserts it. Guessing either way would be worse than saying so.

**Two clauses whose *meaning* is ambiguous in the locked text, flagged rather than resolved:**
- **T1-18** — §5B says iteration_items gain an optional `evidence` **ref**; §10 resolves evidence to a
  linked `report_comments` **table**. The build did the second and linked items via
  `proposed_change.source_comment_ids`. Whether that satisfies "a built item can show *here's the exact
  thing you commented on*" is a judgement the spec does not settle.
- **T2-07 / T2-48** — "interactive" is undefined in the Desktop spec and **redefined as CSS-interactive in
  the plugin's copy (§11b, 2026-07-27)**. Scored against the Desktop text as instructed; the amendment
  would flip both rows to BUILT.

**Things I checked but could only support with a register claim** (marked BUILT, never BUILT+PROVEN):
`theme-extract.mjs` reproducibility · the live `422`s for lock-earned / unlock-harder · the 2160-char
uncapped-rationale round-trip · `Matrix.verdict()` fail-closed behaviour · the 21/21 `design_decisions`
live smoke.

---

# Cross-cutting findings the clause tables surface

1. **`references\stage-2-design-method.md`'s BUILD STATUS block is stale in the *pessimistic* direction.**
   It says "**61 of 91 rules remain `pending`**" and "the constraint checker (30 of 91 rules)".
   `data\design-rules.json` today: **79 enforced, 11 pending, 1 declared-unenforceable.** A status block
   that understates is still a status block that lies; the register's own maintenance rule 1 ("update it
   in the same commit") applies to reference files too.
2. **`references\stage-4-visual-qa.md` claims `data-oid` stamping is shipped** (lines 86-88, under a
   heading reading "**Status — all shipped**") while `SKILL-REGISTER.md` §5 records the claim **withdrawn
   2026-07-27** on the owner's decision, with `grep -rc data-oid` returning 0 on the live project. One of
   these must change.
3. **`references\stage-2-design-method.md` Step 4-E says reload-on-resume is NOT automatic;
   `SKILL.md:32` implements it as session-start step 4.** The register sides with `SKILL.md`. The
   reference is wrong.
4. **`SKILL-REGISTER.md` §3 "Prose only (nothing checks them)" is out of date in both directions** —
   `anti-slop tells` now has a tested detector (`adv-no-slop-tells`) that fired on the project's own
   template, while `context gate` appears in §2 as "🟡 prose" *and* in §2 as "✅ C1+C7 `pre-round-gates.mjs`".
5. **The two copies of the Task-2 spec have diverged** (`docs\specs\TASK2-UI-DESIGN-SPEC.md` carries §11b;
   the Desktop original does not). Task 1 and Task 3 copies are byte-identical. Since the register itself
   flags "the 3 locked specs live outside version control" as a known defect, this is that defect
   producing its first real consequence.
6. **Test-coverage blind spots are concentrated on the newest and the oldest code:** `design-round.mjs`
   (the one-command criterion), the entire `feature-verify` harness, and the DOM-commenter's
   locator/provenance/zip/screenshot paths. Everything in `generation/` and `design-check/` is heavily
   covered by comparison.
