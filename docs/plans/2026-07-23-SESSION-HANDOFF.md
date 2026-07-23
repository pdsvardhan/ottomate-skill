# SESSION HANDOFF — Task 2, next session starts here

**Written:** 2026-07-23 end of session 2 · **Status of everything:** `../../SKILL-REGISTER.md`
**Read this doc, then the register. Nothing else is required to start.**

---

## 0. Read order (do not skip, do not read more than this)

| # | File | Why |
|---|---|---|
| 1 | `SKILL-REGISTER.md` (plugin root) | What exists, what's enforced, what's superseded. **`Enforced?` is a field, not a claim** |
| 2 | This doc | What to do next and what the owner has already ruled |
| 3 | `docs/specs/TASK2-UI-DESIGN-SPEC.md` | The LOCKED spec. §12 is the acceptance bar |
| 4 | `references/design-doctrine.md` | 88 cited rules. Load into any design round |
| 5 | Only the plan doc for the item you're building | `docs/plans/2026-07-23-A*.md` etc. |

**Do NOT** bulk-read `docs/research/` (24 files, 1.5 MB). That is the degradation problem this whole
architecture exists to prevent. Pull one track's one section, on demand.

## 1. Where everything is

| | |
|---|---|
| **Plugin** | `~/.claude/plugins/ottomate` · repo `pdsv/ottomate` · branch `main` · **@ `02c3a51`, clean, 0 unpushed** |
| **App** | `/opt/homeserver/ottomate` via `ssh pdsv@192.168.1.10` · repo `pdsv/ottomate-tracker-v3` · branch `iter-65-2026-07-13` · **@ `9c4c75d`, clean, 0 unpushed** |
| **API** | `http://127.0.0.1:8110` · bearer token at `/opt/homeserver/ottomate/.token` · health green, `db_fds` clean |
| **Preview artifact** | `https://claude.ai/code/artifact/76f9cb7a-9c14-4950-9061-251b75b998f1` (currently the round-3 variant set) |
| **Research corpus** | `docs/research/` (24 files) — also at `~/Downloads/Design research docs/` |

## 2. The one question waiting on the owner

**What display scaling is the 27″ monitor actually set to?**
A3 §3.7: a 27″ 4K panel is ≈163 PPI and OSes default it to ~150% scaling → a real logical viewport of
**≈2560×1440**, not 3840. "4K-first" runs through the method, the Screenroom density tuning and the P1
profile, and all of it assumed the marketing number. If they're at 150%, the density work re-bases.

## 3. Do this next, in this order

### 3a. Finish the research sweep — 11 of 22 tracks remain

Owner ruled: **sweep all**. The method that works, verified this session:

```bash
cd ~/.claude/plugins/ottomate/docs/research && awk '/^## 3\./{p=1} /^## 4\./{p=0} p' A4shapedepthandmaterial.md
```

§3 is written by the corpus to be applied **without reading the body** — ~20 lines instead of ~1000.
**Distil into doctrine + `design-rules.json` and commit every 2–4 tracks**, so progress survives a
context boundary. Update the register in the same commit.

Remaining, roughly by value: **C2** tokens/coherence (owns drift detection + the mix-coherence check
G1 requires and we don't have) · **H2** feasibility (what a variant may even use in the sandbox) ·
**E2** cross-platform/CSP reality · **A4** material · **A2** type · **D2** icons · **C3** data display ·
**B3** nav · **D1** copy · **E1** perf · **H1** assets.

Watch for the pattern that has held 3 times: an unread track turns out to be the spec for something
about to be hand-designed. When it happens, **change the plan, don't defend it** — and log the change
in the register's superseded list.

### 3b. Re-plan against complete knowledge, then build

Phases, from the agreed order:

| Phase | Items | Note |
|---|---|---|
| **1 Generation** | sub-decision inventory from C1 anatomy · render-by-tier with states pinned · bundle model + per-item picks · over-generate 6 → show best 3 | Fixes both known high-severity defects |
| **2 Persistence** | `rejected[]` wiring · reload-on-resume · snapshot differ | Table already exists (0010) |
| **3 Enforcement** | A3 profile `resolveFloor()` → constraint capture → **the checker** → wire into pre-present | The owner's #1 pain. **37 rules are `pending` and enforce nothing today** |
| **4 Wiring** | fresh-context rounds · scope×entry routing · Stage-3 gate · register gates in SKILL.md HARD list · graduation to `master_components` | |

Write a plan doc before each unit (the owner asked for this explicitly). Pattern to follow:
`docs/plans/2026-07-23-A2-migration-0010-design-decisions.md` — it verifies live state *first*, then
specifies, then lists acceptance and risks.

## 4. Owner rulings — treat as settled, do not re-litigate

1. **Research sweep: all 22 tracks**, not build-item-driven (superseded mid-session).
2. **Two-tier enforcement, profile-filtered.** Owner constraints BLOCK (fail closed). Doctrine ADVISES,
   except a small hard floor. Which floor rules bind is decided by the **audience profile**.
3. **Audience profiles P1 solo / P2 trusted-group / P3 public.** Ask once at Stage 0/1, default P1,
   backfill existing projects. **Every floor rule is per-project EDITABLE** — the profile is a preset,
   not a straitjacket. Screen-reader support = skip for all their audiences, editable even at P3.
4. **Variants are bundles of ~8–12 sub-decisions; picks are per-item.** A mix is the normal outcome.
   Researched as affordable: it's 10 choices of 3 (not a 30-way choice) and only ~3 renders, since
   sub-decisions co-locate in one artifact. Choice-overload meta-analysis: d = 0.02.
5. **Gen-1 budget:** commit to a named direction (`data/design-directions.json`) **and** over-generate
   ~6, rubric-filter to 3. Reruns collapse when the first set is genuinely creative.
6. **Stage-3 gate follows the profile** — advisory at P1/P2 (build on placeholders, do UI later is the
   owner's *default* workflow), blocking at P3.
7. **Ledger = one row per decision** (`design_decisions`, migration 0010, live).
8. **Do not spend time on skill-UI polish while the pipeline is unbuilt.** Explicitly deprioritised:
   restoring the old Screenroom preview, and the 3px left-strip tell in `template.card-wall.html`.

## 5. Hard constraints — violating any of these is the failure mode, not a style choice

1. **ONE DOOR (adr-018)** — never open the live `.db` with a second sqlite client. Everything via the API.
2. **`POST /api/backup` before ANY DB change.**
3. **Never run `drizzle-kit generate`/`migrate`** — the un-journaled 0002–0006 gap makes it unsafe.
   Hand-write the migration, hand-add the journal entry, let the app self-migrate on boot.
4. **`npx tsc --noEmit` before every container rebuild.**
5. **`git status` AFTER committing** — a bare `commit` with no re-`add` once pushed a non-typechecking tree.
6. **Never store a design decision as a todo title** — `project_todos.title` caps at 300 chars and will 422.
7. **Do not overclaim.** Documented ≠ demonstrated. If something is specced but unproven, say so and
   mark it in the register. Two independent verifiers have already caught this program overclaiming.

## 6. Gotchas that cost time this session — don't rediscover them

- `requireBearer` lives in **`lib/auth.ts`**, not `lib/api.ts` (where it is imported but not re-exported).
- `readAuthBody` calls `req.json()` and **400s on an empty body** — a DELETE with no body must use
  `requireBearer` directly.
- Nested shell quoting through `ssh … <<'HEREDOC'` **ate the quotes** around `sqliteTable('name'`,
  producing a bare identifier that typechecked as an error. Prefer writing files locally + `scp`, or
  verify with `grep` immediately after writing.
- The plugin's `preview-build` scripts need **ImageMagick**, which is on VAULT7A but not on Windows
  (`convert` there resolves to the disk utility). Gate logic tests run locally; full builds run on the server.
- A round's rationale must go in `design_decisions.rationale` (uncapped), never a todo title.

## 7. Honest state in one paragraph

The **generation** half is real and tested: the isolation gate (20/20, G1 §4.3 as code), the variant
harness (real round from 12 posters, samey set correctly rejected), the one-command preview pipeline,
machine-derived theme tokens, and now the `design_decisions` table with lock-earned / unlock-harder
enforced as HTTP 422s. The **enforcement, memory and handoff** halves are still specification: 37 rules
sit at `status:"pending"` and nothing checks them, rounds do not run in a fresh sub-agent, there is no
`rejected[]` wiring or snapshot differ, and **no real end-to-end design session has ever been run** —
the live ledger is still a seeded demonstration. Task 2 is `ITERATE`, not `APPROVE`, against the locked
spec's §12: **2 of 10 criteria fully met, 4 partial, 4 untouched.**
