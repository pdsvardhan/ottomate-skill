# SESSION HANDOFF — 2026-07-28 (v2, end of the big Task-2 closeout). Next session starts here.

**Supersedes the earlier 2026-07-28 handoff.** This session closed **almost all of Task 2** and set up
**two parallel tracks** for next time. Read this, then `../../SKILL-REGISTER.md`.

## Read order
| # | File | Why |
|---|---|---|
| 1 | This doc | What's done, the two parallel tracks, the file-ownership map |
| 2 | `../../SKILL-REGISTER.md` | What exists and what is **actually enforced** (`Enforced?` is a field) |
| 3 | `2026-07-28-TASK2-FINAL-TEST-PLAN.md` | The verification/testing session's script |
| 4 | `2026-07-28-TASK3-BRIEF.md` | The Task-3 session's self-contained brief |

Do **not** bulk-read `docs/research/`.

## What landed this session (all pushed to `main`)
C1 (`e364f8a`) · the emit into screenroom (`c3f2b0e`, local, not pushed — 15 page decisions) · C12(2)
pairing run (`b689db0`) · **U2b** derive-hardening for shadcn/Tailwind/Radix (`0e4a3c8`, validate
17/23→23/23) · C3 (`793ee3f`) · C7 (`793ee3f`) · C6 (`3c5a4a7`) · C9 source-art (`43515ed`) · C2
asset-fetcher (`ca6e11d`) · C4 checker+renderer (`2565c68`,`868d5e0`) · C11 configs green (`aaa4069`) ·
**C10** theme-extract contrast (`ba6191e`) · **author backfill** → 48 A-grade, up from zero
(`2e892d0`, DB) · **republish** poster-card r1+r2 live 55–65 (`d36da16`, DB) · C8 (`6a54e65`) · plans
(`79b2640`). Generation suite **293/293**.

## Task 2 — status: BUILD COMPLETE. Only testing + two app-side features remain.
- **Done + tested:** C1–C4, C6–C11, U2b, the emit, author backfill, republish. Every unit has a plan,
  must-fail + must-pass tests, and a same-commit register row.
- **Deferred BY OWNER DESIGN → the final test pass:** C5 (cluster round), C12 scenarios 1/3/4/5/6, the
  browser legs (C8 light/dark in Chromium, the computed suite, a real rung-A round, theme-extract on a
  wide poster sample, pixel). Script: `2026-07-28-TASK2-FINAL-TEST-PLAN.md`.
- **Planned, app-side (need an app session):** **N2** design index status board
  (`2026-07-28-N2-design-index-status-board.md`) · **#319** audience-profile capture
  (`2026-07-28-319-audience-profile-capture.md`).
- **Owner-settled:** C10 target (dark canvas 3:1) · author mapping (conservative) · republish (r1=round1,
  r2-B=round2) · poster-gold (leave as-is).

## THE NEXT SESSION(S) — the owner will run TWO in parallel

### Track A — Task 2: **verification + testing** (product-level, not just unit-level)
The owner's mandate: *"verify everything built — product level too: has what we envisioned / planned /
put in requirements materialised? what are the gaps? — and the testing."* So Track A is **two things**:
1. **A requirements-traceability audit** — walk the three locked specs (`docs/specs/`) clause by clause
   against what actually exists, and write a gap report: envisioned vs materialised, per acceptance
   criterion. Not code — judgement against the spec. Output: `docs/audits/2026-XX-XX-task2-traceability.md`.
2. **Run `2026-07-28-TASK2-FINAL-TEST-PLAN.md`** — the 6 §12 scenarios + the deferred browser legs +
   the parameter matrix, on VAULT7A, as one pass against the finished system. Defects → register.

Then, if time: build **N2** and **#319** (app-side).

### Track B — Task 3: **feature verifier** (mostly BUILD)
Self-contained brief: `2026-07-28-TASK3-BRIEF.md`. One-line state: the plumbing is real and now
unit-tested (A5), the spec ran HTTP-only on VAULT7A (A4), but **nothing has ever driven a browser** —
WP1 (the browser leg) is the whole point and is unwritten. Two owner DECIDE points (first browser
target; whether zero-dependency binds the project under test).

## Parallel-session compatibility — the file-ownership map (READ BEFORE EITHER SESSION WRITES)

| Path / resource | Track A (Task 2) | Track B (Task 3) |
|---|---|---|
| `scripts/generation/**`, `scripts/preview-build/**`, `scripts/design-check/**` | **owns** | — |
| `data/**`, `references/stage-2-*.md`, `references/design-doctrine.md`, `design-questions.json` | **owns** | — |
| `scripts/feature-verify/**`, `prompts/feature-verifier-prompt.md`, `references/stage-3-feature-verifier.md` | — | **owns** |
| `references/stage-4-mini-pipeline.md` §4.7 (feature-verifier leg) | — | **owns** (WP8) |
| `SKILL.md` | design gates / stage-2 sections | line-86 verifier / stage-3.5 sections |
| `SKILL-REGISTER.md` | §2/§3 design rows, §5 design defects | §2 feature-verifier row, §5 Task-3 defects |
| `docs/plans/`, `docs/audits/` | `*task2*`, `*C*`, `*U*`, `*N*` files | `*task3*`, `*feature*` files |
| **memory** | `skill-tasks-program-2026-07-23.md` (Task-2 lines) | append a distinct `ottomate-task3-*` memory, don't rewrite Task-2 lines |
| **VAULT7A staging** | `/tmp/ottoskill` | `/tmp/fv` (separate — do not share a staging dir) |
| **live DB tables** | `design_decisions`, `master_components` | `feature_verification_reports` (different tables) |

**Rules that keep the two from colliding:**
1. **Git:** commit small; **`git pull --rebase` before every push.** The only real merge-risk file is
   `SKILL-REGISTER.md` — each track edits only its own rows (append, never reflow the other's), so a
   rebase resolves cleanly. `git status` after committing (a bare commit once pushed a broken tree).
2. **DB:** both must `POST /api/backup` before their own write. Different tables, so no data collision.
   **To-do #247:** two Claude sessions share VAULT7A as `pdsv`; a sibling's docker/ops actions can read
   as incidents — expect it, don't panic.
3. **ONE DOOR** (all DB via the API) and **never `drizzle-kit`** apply to both.
4. **ESM/Playwright resolve bare specifiers from the FILE's location** — symlink `node_modules` next to
   whatever you run on VAULT7A (`/opt/homeserver/ottomate/node_modules`).

## Live state (measured, trust over older docs)
Catalog **116 rows**, now **A48/B18/C20/D30** (author backfilled). Ledger: **15 page decisions locked**
(music-list/album-detail/library-lists/…) + poster-card **round 1 = 55–60, round 2 = 61–65 proposed**
(old 18–27 superseded). Suites: generation 293/293 · design-check 118/119 (the 1 = Playwright-only,
green on VAULT7A) · isolation-gate 36/36 · preview-build 29/29 · feature-verify harness unit-tested.

## Owner-reserved, still open (do NOT decide these)
S1b class D (finish or write off the 58 unfinished catalog dirs) · Task-3 DECIDE-1 (first browser
target — my read: the 4.3 lock-in view) · Task-3 DECIDE-2 (does zero-dependency bind the project under
test, or only the plugin?).
