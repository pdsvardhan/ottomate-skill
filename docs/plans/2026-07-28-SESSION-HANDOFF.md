# SESSION HANDOFF — 2026-07-28. Next session starts here.

**Supersedes `2026-07-27-SESSION-HANDOFF.md` and `2026-07-27-NEXT-SESSION-PROMPT.md` entirely.**
The opening prompt to paste is at the bottom.

## Read order

| # | File | Why |
|---|---|---|
| 1 | This doc | What happened, what is next, what the owner has ruled |
| 2 | `../../SKILL-REGISTER.md` | What exists and what is **actually** enforced |
| 3 | `2026-07-27-TASK2-CLOSEOUT-PLANS.md` | **The work queue** — C1–C12, each with acceptance |
| 4 | `2026-07-27-OUTSTANDING-WORK.md` | The whole backlog, marked by kind of work needed |

Do **not** bulk-read `docs/research/`. Do **not** re-derive status by hand — it is in the register.

## What landed on 2026-07-27 (nine commits, all pushed)

| | |
|---|---|
| **T5** | Slot letters are presentation; the **label is the identity**. Strict on write, permissive on read forever. 21/21 |
| **Stage 4 — the whole subsystem** | S1b classification · **migration 0011** · S3 provenance gate · S4 licence tiers · S5 tokenisation · S6 A–F grader · S7 dedupe · S8 NOTICES · S9 `graduate()` writes · S10 wired at **4.7b**. 77 new tests |
| **A1** | Visual-QA routing — `command-routing.md` Rule D1 + `output-style.md` triggers + notice-then-ask |
| **A2 · A3** | Two false status blocks corrected (`data-oid` "all shipped"; "61 of 91 pending") |
| **A4** | The feature-verify spec **run on VAULT7A** — 3 passed, 569 ms. 14 UNKNOWN clauses → 10 |
| **A5** | First unit tests for `feature-verify` — **20/20**, proven non-vacuous by sabotage |
| **A6** | The three specs are under git; the plugin copies are canonical |
| **N1** | Context gate **blocks at P1**; answers persist per project |

**Suites:** generation **251/251** · design-check 118/119 · pixel 22/22 · preview-build 17/17 ·
isolation-gate 36/36 · feature-verify **20/20**. The single failure needs Playwright and passes 4/4 on
VAULT7A.

## Live state — four standing claims were falsified by measurement. Trust these, not older docs.

1. **The catalog is 116 rows, not 179.** `GET /api/master-components` → `count: 116`; the route has no
   limit and no default filter. Every "179" in older docs was wrong.
2. **The owner HAS locked decisions — 9 of them.** `screenroom` holds 19 rows: **9 locked, 10
   superseded, 15 confirmed**. Older docs saying "nothing is locked" are stale.
3. **All 9 locked decisions are on targets with NO anatomy entry** — `music-list`, `album-detail`,
   `library-lists`. The anatomy knows `media-card`, `button`, `data-table-row`. **This is why C1 is the
   critical path.**
4. **The catalog drift is 150 dirs, and they were never finished.** 267 entries = 266 dirs + a stray
   `registry.json`. Only **66 of 150** are render-inline-ready; **58** are named exports with
   unresolvable `@/` aliases. The claim that the sourcing sprint produced ~90 self-contained
   render-inline components is false — see `docs/audits/2026-07-27-S1b-catalog-drift.md`.

## Do this next — **C1 is the critical path**

**Step 1 is already done** (`654e18f`): an unresolved locked decision now **blocks** the emit instead
of being logged as `SKIPPED`. What remains:

1. Wire `anatomy-derive.mjs` into resolution: **registry hit → use · miss → derive from source ·
   derive fails → STOP and ask.** Never invent (doctrine rule 40).
2. A derived entry is cached, labelled `derived: true`, and carries the evidence it came from.
3. Token names for derived axes stay deterministic and namespaced by target.
4. **Then re-run the emit dry-run against the 9 locked rows and show the owner the diff.** They have
   approved the real emit *after* C1 lands.

Full plan: `2026-07-27-TASK2-CLOSEOUT-PLANS.md` §C1. After that, C12(2) — the 20-component pairing
run — is the cheapest way to find what else is broken.

## Owner rulings — settled, do not re-litigate

1. **Context gate blocks at P1**, answers remembered per project. *(built)*
2. **Per-round URLs stay**; what the owner wants is the **design index as a status board** —
   pages vs components, final vs not. That is **N2**, app-side, unbuilt.
3. **Plugin spec copies are canonical.** *(built)*
4. **C1 first, then emit all 9.**
5. **Auto-pickup = notice, then ask.** Never ingest unprompted. *(built)*
6. **Grandfather pre-rule catalog rows** with a visible `provenance_debt` flag rather than
   quarantining them. *(built — 30 rows flagged)*
7. **Tokenise-on-ingest reports and downgrades; it never rewrites** third-party source. *(built)*
8. Everything in the 2026-07-27 handoff's rulings list still stands (design surface = the app;
   graduation is last; picks become a real tokens file; no anatomy-approval gate; CSS-interactive;
   hand-rolled pixel comparison; fresh sub-agent per round; no `data-oid`).

## Still blocked on the owner

- **The republish.** Approved, then found blocked: `build-variant-set.mjs` refuses the r1 set with
  `source policy: FAIL — NOTHING WRITTEN`. One `source: {kind:'bespoke', why}` per variant fixes it
  (**C11**), then backup + `--replace`.
- **Accent budget** — do the poster cards want more gold? 0.72 / 0.51 / 1.11 % against 10 ± 5 %.
  Taste, not code. The threshold was **not** moved.
- **S1b class D (58 unfinished components)** — finish them, or write them off?
- **Task 3 DECIDE-1** — which feature the browser leg drives first. *(My read: the Ottomate 4.3
  lock-in view — smallest surface, and it converts four UNKNOWN Task-1 clauses for free.)*
- **Task 3 DECIDE-2** — does zero-dependency bind the project under test, or only the plugin?

## The cheapest remaining win

**`author` is null on all 116 catalog rows.** That single field is why nothing grades A — the grader
works, the licence backfill worked (86 rows, by transcription from `license_note`), and provenance is
the only factor still scoring low. Mostly recoverable from `library`.

## Gotchas learned this session — do not rediscover these

- **The Drizzle migrator executes ONE statement per call.** A multi-statement `.sql` throws
  `RangeError: The supplied SQL string contains more than one statement`. Separate every statement with
  `--> statement-breakpoint`.
- **Migrations are bundled into the image at build time.** Fixing the file and restarting re-runs the
  OLD one. You must `docker compose up -d --build`.
- **A failing migration takes the app to HTTP 500** — it fails at DB bootstrap, so the whole app is
  down until the migration is fixed AND rebuilt.
- **Node 22.13 strips TypeScript natively** — `node --test --experimental-strip-types "…/*.test.mts"`.
  No build step, no `package.json`; the zero-dependency rule holds.
- **Running the feature-verify spec on VAULT7A:** `scp` the harness to `/tmp/fv`, `ln -s
  /opt/homeserver/ottomate/node_modules`, then set `FV_BEARER_TOKEN`, `FV_PROJECT_SLUG`,
  `FV_RISK_POLICY`, `FV_ASSET_ROOT`. ESM resolves bare specifiers from the **file's** location.
- **`node --test <dir>` fails on this Node** — use a glob. `isolation-gate` has its own runner.
- **Writing scripts through a shell heredoc mangles them.** Write the file, `scp` it, then run it.
- Everything in the previous handoff's gotcha list still applies (`requireBearer` in `lib/auth.ts`;
  `iteration_items` has no timestamps; `POST /api/projects` rejects `ideating`; `source_policy` and
  `colour_budget` are contract keys, not rules; `DETECTORS` takes `{scope, fn}`).

## The discipline that earned its keep — keep it

**Demonstrate, don't assert.** This session that meant: running the rebuild instead of assuming it
would work, which found that the live rounds cannot be republished as they stand; grading the real 116
rows instead of trusting the stored grades, which found that **zero** components could ship; and
sabotaging the fail-closed verdict to prove its new tests actually bite.

**Six defects were found by tests and fixed in the code, never in the assertion.** Two were mine and
would have shipped silently: `frameworkCoupling('')` scored portability 1.0 on a source it had never
read, and tokenisation was a weighted term a component with three baked-in `#fff`s could outvote.

**A defect row left open after its fix is the same error as a rule marked `pending` while working.**
Two stale rows were found this session by reading, not by testing. The Known-defects table deserves a
sweep.

---

## The prompt to paste

```
Continue the Ottomate skill work. Section A is closed, Stage 4 is BUILT, T5 is done.

READ THESE FOUR FIRST, IN THIS ORDER:
1. ~/.claude/plugins/ottomate/docs/plans/2026-07-28-SESSION-HANDOFF.md
2. ~/.claude/plugins/ottomate/SKILL-REGISTER.md
3. ~/.claude/plugins/ottomate/docs/plans/2026-07-27-TASK2-CLOSEOUT-PLANS.md   <- the work queue, C1-C12
4. ~/.claude/plugins/ottomate/docs/plans/2026-07-27-OUTSTANDING-WORK.md       <- the whole backlog

THE JOB: C1, then the emit, then keep going down the C-list.

C1 is the critical path and step 1 is already done (654e18f: an unresolved locked decision now BLOCKS
the emit instead of being silently skipped). What remains:
  - wire anatomy-derive.mjs into resolution: registry hit -> use it; miss -> derive from source;
    derive fails -> STOP and ask. Never invent (doctrine rule 40).
  - a derived entry is cached, labelled derived:true, and carries the evidence it came from.
  - token names for derived axes stay deterministic and namespaced by target.
  - THEN re-run the emit dry-run against the 9 locked rows and show me the diff. I have approved the
    real emit once C1 lands.
Plan: 2026-07-27-TASK2-CLOSEOUT-PLANS.md section C1.

After C1: C12 scenario 2 (the ~20-component pairing run) is the cheapest way to find what else is
broken. Then work down C11 / C3 / C8 / C7 / C6 / C4 / C5 / C9 / C10 / C2, and N2 (the design index as
a status board: pages vs components, final vs not).

LIVE STATE - trust these, they were measured and they contradict older docs:
  - the catalog is 116 rows, NOT 179.
  - I have 9 LOCKED decisions on screenroom (19 rows: 9 locked, 10 superseded, 15 confirmed).
  - all 9 are on music-list / album-detail / library-lists, and the anatomy knows only media-card,
    button, data-table-row. That is exactly why C1 blocks everything.
  - the catalog drift is 150 dirs and only 66 are render-inline-ready; 58 are named exports with
    unresolvable @/ aliases and were never finished.

OWNER RULINGS - settled, do not re-litigate:
  - context gate blocks at P1, answers remembered per project (built).
  - per-round URLs stay; what I want is the design INDEX as a status board (that is N2).
  - the plugin's docs/specs copies are canonical (built).
  - auto-pickup = notice, then ask; never ingest unprompted (built).
  - grandfather pre-rule catalog rows with a visible provenance_debt flag (built).
  - tokenise-on-ingest reports and downgrades, never rewrites (built).
  - C1 first, then emit all 9.

STILL MINE TO DECIDE - ask me when they come up:
  - the republish (blocked on C11's source declarations first).
  - do the poster cards want more gold (0.72/0.51/1.11% vs 10+-5%).
  - S1b class D: finish the 58, or write them off.
  - Task 3 DECIDE-1 and DECIDE-2 (see the Task-3 brief).

CHEAPEST WIN AVAILABLE: `author` is null on all 116 catalog rows, and that single field is the only
reason nothing grades A. Mostly recoverable from `library`.

DISCIPLINE: verify live state before changing it; demonstrate, don't assert (run it, show output).
Every rule flipped to `enforced` names a test with BOTH a must-fail and a must-pass case. NEVER lower
a threshold to make something pass - log the defect. Plan doc before each unit. The plugin has NO
package.json by design. Update SKILL-REGISTER.md in the same commit as the change it describes.
ONE DOOR (all DB access via the API) - POST /api/backup before any DB change - never drizzle-kit -
typecheck before any container rebuild - git status AFTER committing - commit + push every surface you
touch. Do NOT bulk-read docs/research/. Ask me as many questions as you need.

GOTCHAS worth knowing up front:
  - the Drizzle migrator runs ONE statement per call; separate every statement in a .sql with
    `--> statement-breakpoint` or it throws and takes the app to HTTP 500.
  - migrations are bundled into the image at BUILD time - fixing the file and restarting re-runs the
    old one. You must `docker compose up -d --build`.
  - Node 22.13 strips TypeScript natively: node --test --experimental-strip-types "dir/*.test.mts".
  - `node --test <dir>` fails on this Node - use a glob. isolation-gate has its own runner.
  - writing scripts through a shell heredoc mangles them. Write the file, scp it, then run it.
  - to run the feature-verify spec on VAULT7A: scp the harness to /tmp/fv, symlink
    /opt/homeserver/ottomate/node_modules, set FV_BEARER_TOKEN / FV_PROJECT_SLUG / FV_RISK_POLICY /
    FV_ASSET_ROOT. ESM resolves bare specifiers from the FILE's own location.

NOTE: scripts/feature-verify/ may be owned by a parallel Task-3 session (see
2026-07-27-TASK3-PARALLEL-SESSION-BRIEF.md for the file-ownership map). Check before touching it.
```
