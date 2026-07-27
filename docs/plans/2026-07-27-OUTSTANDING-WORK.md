# Outstanding work — the whole programme, one list

**Written 2026-07-27** in answer to: *"list all the tasks that are planned in to-do and still needs
work or not yet thought through."*

Everything below is either **not started**, **partially built**, or **decided but unimplemented**.
Anything already complete is omitted — see `SKILL-REGISTER.md` for what is done.

**Work-type legend** — **BUILD** design settled, just write it · **DIG** must measure live state first ·
**RESEARCH** genuinely unknown · **BRAINSTORM** needs a design conversation · **DECIDE** one owner
ruling unblocks it · **FIX** a known defect with a known cause.

---

## A. This session's build queue (A1–A7)

| # | Item | Type | State |
|---|---|---|---|
| A1 | Visual-QA routing — `command-routing.md` + `output-style.md` | **DECIDE** → BUILD | **Investigated, awaiting your ruling.** See §A1 below |
| A2 | `stage-4-visual-qa.md` still lists `data-oid` under "all shipped" | FIX | Not started |
| A3 | `stage-2-design-method.md` says "61 of 91 pending"; truth is 79 enforced, 0 pending | FIX | Not started |
| A4 | Resolve Task 1's 14 UNKNOWN clauses by running the spec on VAULT7A | DIG | **Partly done already** — see §C |
| A5 | Unit-test `scripts/feature-verify/` incl. `Matrix.verdict()` | BUILD | Not started · **blocks the parallel Task-3 session** |
| A6 | The 3 locked specs live outside version control | BUILD | Not started |
| A7 | Unregistered anatomy target silently skipped by the emitter | BUILD | Not started · **urgent, bit in production** |

### §A1 — what the investigation found, and why the recommendation changed
The spec's premise was that a `*-comments-*.zip` **drop** should route. Reality, measured:

- **38 comment exports in `~/Downloads`** — **33 `.json` (v1)**, 2 `.zip` (v2). The spec names `.zip`;
  matching only that would miss 33 of 35 real exports.
- **Exactly one** visual-QA report exists in the app, ever: **#127** (mapsofbharat, 2026-07-26,
  `classified`, 15 `report_comments` rows, 15 JPEGs on the asset volume).
- Yesterday's transcript, verbatim: *"i built a dom based website commentor tool… gave some comments
  **thought you autoread them**, can you check"*. The routing hole is not theoretical.
- **And the real cause was worse than missing routing.** Open to-do **#333**: *"DOM Commenter
  Send-to-Ottomate push fails silently (mapsofbharat 2026-07-26): no report created, assets/visual-qa
  empty, zero import-visual-qa hits in container logs; owner had to fall back to zip export."*

So the owner's actual intent — press "Send to Ottomate", have it appear — **was exercised and failed
silently**. Routing was the second failure, not the first. That reorders the fix:

1. **#333 first** (FIX) — a silent push failure is a worse bug than an unrouted file, because the
   owner believes the batch has landed.
2. **Then routing** (BUILD) — extended to `.json`, phrase-triggered, plus the notice-then-ask
   Downloads check you approved.

**Still needs your ruling:** whether to build the routing as specced-and-corrected, or amend the spec.

---

## B. Stage 4 — graduation (PLAN stage; S1 already answered)

**S1 was run today, and it changes the plan materially. Two claims in circulation are wrong:**

| Claim in the register / memory / prompt | Live truth (measured 2026-07-27) |
|---|---|
| "the 179 catalog rows" | **`master_components` holds 116 rows.** `GET /api/master-components` returns `count: 116`; the route has no limit and no default filter (read directly) |
| "the target columns do not exist" | **Six of eight already exist** |

**Columns that already exist:** `source_url` · `license_note` · `quality_grade` · `ingestion_method` ·
`source_paths` · `library` · `dependencies` · `framework_tags` · `dark_light_compat` · `responsive`.

**Fill rates:** `quality_grade` A 31 · B 21 · C 47 · null 17 (**85% graded already**) ·
`license_note` non-empty on **86/116** · `source_url` on **40/116** ·
`ingestion_method` = hand-authored 48 · manual-copy 37 · hand-curated 26 · gist 3 · project-extracted 2.

**Genuinely missing vs H1:** `spdx_id` · `author` · `attribution` · `licence_url` · `retrieved_at` ·
`trademark_flag`. **Six columns, not eight** — the migration is smaller than H1 implied.

**And a drift nobody planned for:** **267 component dirs on disk, 116 registered** — a **151-dir gap**
(open to-do #306). Graduation writes *into* a catalog that is already 57% unregistered. That is a
prerequisite, not a footnote.

| # | Item | Type |
|---|---|---|
| S1 | ~~Live-state check~~ | ✅ **done today** |
| S1b | **Reconcile the 151-dir drift before graduating anything** | **DIG** → BUILD · new, not in the original S-list |
| S2 | Hand-written migration + hand-added journal entry (6 columns, never drizzle-kit) | BUILD |
| S3 | Provenance at ingest or quarantine | BUILD |
| S4 | GREEN/AMBER/RED licence tiers; encode Shadertoy / unDraw / Rive exclusions | BUILD |
| S5 | Strip framework coupling; tokenise on ingest | **BRAINSTORM** → BUILD — "a baked-in `#fff` is a downgrade" is a *policy*; the mechanics of de-hardcoding arbitrary component source are not designed |
| S6 | A–F grading runner | BUILD — note `quality_grade` **already exists and is 85% filled**, so this is "write the runner that reproduces/justifies the grade", not "add grading" |
| S7 | Dedupe structurally AND visually | BUILD — P2's `scripts/design-check/pixel/` is already the visual instrument |
| S8 | NOTICES ledger assembled into output | BUILD |
| S9 | Make `graduate.mjs` write (it never has) | BUILD |
| S10 | Wire into `stage-4-mini-pipeline.md` | BUILD |

**Not thought through in Stage 4:** S5's tokenisation mechanics, and what happens to the **17 ungraded
rows** and the **30 rows with no `license_note`** when a quarantine rule starts binding retroactively.

---

## C. Task 1 — visual-QA intake

**Four of the 14 UNKNOWN clauses are now resolved** by reading live state today (report #127):

| Clause | Was | Now |
|---|---|---|
| T1-13 import endpoint accepts a v2 batch | UNKNOWN | **CONFIRMED** — #127 was created by it |
| T1-14 one `report`, `raw_text` = comments concatenated | UNKNOWN | **CONFIRMED** — `raw_text` reads `#1 [note] <url> \| <text> \| --- \|` |
| T1-15 screenshots → asset store | UNKNOWN | **CONFIRMED** — 15 JPEGs at `/mnt/storage/ottomate/assets/visual-qa/127/` |
| T1-16 evidence carries url/page/locator/provenance/category | UNKNOWN | **CONFIRMED** — all six columns present on `report_comments` |
| T1-17 linked `report_comments` table, not a column | UNKNOWN | **CONFIRMED** — rows 16–30 |
| T1-34 asset store, not DB blobs | UNKNOWN | **CONFIRMED** |

**Still open:**

| Item | Type |
|---|---|
| **#333 — Send-to-Ottomate push fails silently** | **FIX** · highest priority in Task 1 |
| Routing (AC5) — the A1 item | DECIDE → BUILD |
| Batch cap + 30+ sub-batching (§11) | BUILD · nothing anywhere |
| Trace-report → screenshot link (AC4) | DIG · never demonstrated |
| Extension tests stop at pure helpers — `buildLocator`, `detectProvenance`, `makeZip`, the whole screenshot path are untested | BUILD |
| T1-03 `devicePixelRatio` honoured in the outline | DIG · genuinely undetermined; the rect carries `dpr: 1.75` on real data |
| T1-20/21/41/42/43 — the 4.3 panel UI and ACs 2/3/4 | DIG · **closed for free by Task 3's WP1** if the browser leg drives that screen |
| T1-18 — `evidence` ref vs `source_comment_ids` | **DECIDE** · the spec does not settle which satisfies it |

---

## D. Task 2 — design method (strongest of the three; these are the tails)

| Item | Type |
|---|---|
| **The asset-fetcher (§5D-A)** — pipeline reads local files; no project-API fetch, no retry, no proxy | BUILD · the one §5D letter with nothing behind it |
| **Rungs A and C have never run** — every real round is a component-scope B round on one target | BUILD |
| **Nothing is locked on a live project** — Screenroom has 10 `in-review` rows, 0 locked | **DECIDE** (yours) |
| `design-round.mjs` — the one-command criterion — has **no test** | BUILD |
| Context gate advises rather than blocks at P1 (your own profile), so AC1 is soft exactly where it is used | DECIDE |
| Ask-on-primary · pressure-test-before-presenting · colour-budget-stated-up-front | BUILD · all three are prose |
| "Same URL each rebuild" (D3/AC3) implemented as per-round URLs — defensible, but the locked text was never amended | DECIDE |
| Prior-art **source scan** (D2) — "already decided" is answered; "already built" is not | BUILD |
| `theme-extract.mjs` emits the raw pick; A1 §3.10 wants L normalised and C clamped at derivation time | BUILD |
| `variants_shown` keyed by slot letter, and slots reshuffle every round → cross-round provenance is hand-recoverable only | FIX |
| `inheritedControls` computed then dropped by `build-variant-set.mjs` | FIX |
| Our own r1 panels are ~10× **under** the accent budget (0.72/0.51/1.11% vs 10±5%) | **DECIDE** (taste, not code) |
| Audience-profile capture + intelligent backfill (to-do #319) | BUILD |

### The Task-2 end-to-end test you asked for — 6 scenarios, none run yet
1. A single component, start to finish. **BUILD**
2. **~20 different components** — observe how the system *pairs* each with what it shows: archetype/tier
   resolution, which sub-decisions become contested axes, how round-composition groups by perceptual
   channel, which render surface each tier gets. **BUILD** · this is the routing/pairing test, and it is
   the scenario most likely to surface a real defect
3. New component on an existing project. **BUILD**
4. Unseen archetype forcing anatomy-derive. **= A7**
5. Redesign of built UI — prior-art must reconcile "already decided" vs "already built". **Blocked on
   D2's source scan** (above)
6. Cold start: brand-new project, Stage 0 → Stage 3, no spec, no ledger, no components. **BUILD**

---

## E. Task 3 — feature verifier

**See `2026-07-27-TASK3-PARALLEL-SESSION-BRIEF.md`** — written specifically so this can run in a
separate session. Summary: 47 clauses, 1 proven / 14 built / 17 partial / 14 not built; **zero browser
specs, zero unit tests, zero red cases ever**. Mostly **BUILD**; one **BRAINSTORM** (case generation);
two **DECIDE** points (first target feature; whether zero-dependency binds the project under test).

---

## F. Open app to-dos (11, live from `/api/projects/ottomate/todos`)

| # | Item | Type |
|---|---|---|
| 237 | **SECURITY:** `vault7a-ops runbooks.md:125` hardcodes the NPM admin password in plaintext | **FIX** · security |
| 333 | DOM Commenter Send-to-Ottomate push fails silently | FIX · see §A1 |
| 306 | Asset-library drift: 267 dirs on disk vs 116 registered | DIG → BUILD · see §B |
| 319 | Task-2 audience-profile capture + intelligent backfill | BUILD |
| 335 | Deploy main-only fixes (bedrock trio + lock gate + ND1 write path) | BUILD |
| 342 | `next dev --turbopack` refuses an out-of-root `node_modules` symlink | FIX · verifier recipe |
| 343 | Control trees: `git archive <sha>` → /tmp, symlink node_modules, copy config | BUILD · verifier recipe |
| 289 | Consolidate 2 crons into the shared nightly window | BUILD · **pairs with Task 3 WP6** |
| 300 | Research intake — 20-track payload, ingestion deliberately deferred | **DECIDE** |
| 240 | Incident-resolved note (ext4-recovery quiesce) | — informational |
| 247 | Concurrent Claude sessions share vault7a as `pdsv`; sibling docker ops read as incidents | **relevant right now** — a parallel Task-3 session will trip this |

---

## G. Not thought through anywhere — the honest list

1. **Stage 4 S5** — how to de-hardcode and tokenise arbitrary third-party component source.
2. **Task 3 WP3** — what "auto-enumerate a case matrix" means mechanically.
3. **Per-project fixture conventions** (Task 3 §5F) — one sentence of prose, no directory, no project.
4. **The Judge rubric's content** — the contract is specified, the questions have never been drafted.
5. **The 151-dir catalog drift** — nobody has looked at what those 151 unregistered dirs *are*.
6. **What retroactive quarantine does to existing rows** — 17 ungraded, 30 without a licence note.
7. **`data-oid` is withdrawn, but two specs still build on it** — Task 3's `selectors.ts` and Task 1's
   §5D Phase 2. Neither has been reworked to `getByRole`/`getByTestId`.
8. **Generation variance technique** (register §4, known research gap 2) — how to get genuinely
   different outputs from one model is an LLM-behaviour question the whole variant harness rests on.
