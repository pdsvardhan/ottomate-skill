# SESSION HANDOFF — Task 2, next session starts here

**Written:** 2026-07-23 end of session 3 · **Status of everything:** `../../SKILL-REGISTER.md`
**Read this doc, then the register. Nothing else is required to start.**

---

## 0. Read order (do not skip, do not read more than this)

| # | File | Why |
|---|---|---|
| 1 | `SKILL-REGISTER.md` (plugin root) | What exists, what's enforced, what's superseded. **`Enforced?` is a field, not a claim** |
| 2 | This doc | What to do next and what the owner has already ruled |
| 3 | `docs/specs/TASK2-UI-DESIGN-SPEC.md` | The LOCKED spec. §12 is the acceptance bar |
| 4 | `references/design-doctrine.md` | **229 cited rules — all 22 tracks now distilled.** Load into any design round |
| 5 | Only the plan doc for the item you're building | `docs/plans/2026-07-23-*.md` |

**Do NOT** bulk-read `docs/research/`. The sweep is **complete** — every §3 executive rule is already
in the doctrine. What remains in those files is each track's *body* (worked examples, comparison
tables, reasoning). Pull one on demand for build knowledge on a specific axis; never in bulk.

## 1. Where everything is

| | |
|---|---|
| **Plugin** | `~/.claude/plugins/ottomate` · repo `pdsv/ottomate` · branch `main` · **clean, 0 unpushed (all Phase 1–4 + 3b work pushed)**. Where ALL Task-2 work lives |
| **App** | `/opt/homeserver/ottomate` via `ssh pdsv@192.168.1.10` · repo `pdsv/ottomate-tracker-v3` · branch `iter-65-2026-07-13` · **@ `9c4c75d`, unchanged since session 2** — Phases 1/2/3a/3b/4 were all plugin-only (the design_decisions table + API already existed). The server's `@playwright`+Chromium hosts the computed checks |
| **Test suites (plugin)** | `node --test` — generation 8/8 · ledger-context 9/9 · method-routing 9/9 · graduate 6/6 · design-check 33/33 · computed-checks 6/6 · harness-dsd 7/7 · isolation-gate 20/20. Browser test (server only): `computed-checks.browser.test.mjs` 4/4 |
| **API** | `http://127.0.0.1:8110` · bearer token at `/opt/homeserver/ottomate/.token` |
| **Preview artifact** | `https://claude.ai/code/artifact/76f9cb7a-9c14-4950-9061-251b75b998f1` |

## 2. The open question, ANSWERED — and it re-bases the density work

**The 27″ monitor runs at 175 % scaling.** Measured, not asked: the only attached display is a
**Dell S2725QC, 27.1″ (60×34 cm), 3840×2160 native, 162 PPI**, at **effective DPI 168 → a logical
viewport of 2194×1234 CSS px**, and a maximised browser's content box is nearer **2194×1100**. The
laptop's internal panel is detached, so this is the *only* screen.

That is **~14 % wider than 1080p** — not 3840, and not even the 2560×1440 that A3 §3.7 predicted from
the 150 % default. The owner is one notch above Windows' recommendation, putting effective density at
≈93 PPI, *below* the 110–140 comfort band: **they deliberately run a larger UI, so err generous, never
cramped.** Doctrine rule 83, the P1 profile row and the register all carry the measured number.
*(Probed with `GetDpiForMonitor` + `EnumDisplayDevices`; re-measure if the setup changes.)*

## 3. Do this next, in this order

> ⛔ **SUPERSEDED 2026-07-27 by `2026-07-27-PROGRAM-REPLAN.md`.** The owner changed *where* a round is
> shown (the design surface is now a route in the Ottomate app; the Claude-Artifact path is retired)
> and named two method gaps that were not on any list — **round composition** and **prior-art/reuse**.
> §3a below has been **done**: a real round is published to Screenroom's live ledger. Read the re-plan
> for the current order. §3b/3c/3d survive unchanged as phases E/F/G there.

**Phases 1, 2, 3a (source), 3b (3 computed rules) and 4 (wiring) are all BUILT.** The parts work and
two throwaway rounds were run end-to-end. What is NOT yet done is a real session on a real project, and
the remaining implementation tail. Nothing below is blocked on research or a decision — the research
sweep is complete (22/22) and the owner rulings in §4 are settled. **These are work, not waiting.**

### 3a. ⭐ The biggest gap: run ONE real end-to-end session on a REAL project
Every round so far used a **throwaway test component** (media-card) on a **throwaway project**. The
locked spec's §12 acceptance wants a real one. Pick a real tracked project + a real target (Screenroom
is the natural candidate), run the full loop — route → fresh-context generate → gate + source checker →
render + computed pass → per-item picks → lock → snapshot — writing to that project's **real** ledger
(backup-first, ONE DOOR). This is what moves Task 2 from `ITERATE` toward `APPROVE`, and it will
surface the next batch of real bugs the way rounds 1 and 2 did.

### 3b. Finish Phase 3b — the rest of the computed rules + auto-inline
The architecture is built (`computed-checks.js`, runs in Node + real Chromium; 3 rules enforced). Add
the other ~12 `computed` rules (shadow/glass/type-optical/scale/leading/tabular/radius-nesting/…)
against the same pattern — each with a math unit test + a browser-test case. Then **auto-inline the
computed pass** so it runs as part of a round rather than a manual server/`run-computed.mjs` step.

### 3c. Finish Phase 3a source tail
`feas-baseline-gate` (`@supports` parsing) · `source_policy` (needs a source-tagging convention) ·
**constraint capture** — the contract is read from a config today; nothing writes it to the ledger yet.

### 3d. Graduation ingest SUBSYSTEM (own unit; protocol + hook already written)
`references/graduation-protocol.md` + `graduate.mjs` (the non-writing draft hook) exist. The subsystem
needs a **hand-written migration** adding `master_components` columns (spdx_id, author, attribution,
retrieved_at, trademark_flag, grade — currently absent), then the grade runner, structural+visual
dedupe, and the NOTICES assembler. Backup-first; never `drizzle-kit`.

### One open owner decision (non-blocking)
Confirm the **`block_feasibility` 4th tier** (eval/WASM/network/inline-handlers — "does it render at
all") stays as its own tier, or folds into an existing one. It's built and enforcing either way.

**Write a plan doc before each unit** (verify live state → spec → acceptance → risks). Good patterns:
`docs/plans/2026-07-23-G1-phase3b-computed-checks.md`, `…-E1-phase2-persistence.md`,
`…-A2-migration-0010-design-decisions.md`. Demonstrate, don't assert: run it, show the output.

## 4. Owner rulings — settled, do not re-litigate

1. **Research sweep: all 22 tracks.** ✅ **DONE.**
2. **Two-tier enforcement, profile-filtered.** Owner constraints BLOCK (fail closed). Doctrine ADVISES,
   except a small hard floor. Which floor rules bind is decided by the audience profile.
3. **Audience profiles P1 solo / P2 trusted-group / P3 public.** Ask once at Stage 0/1, default P1.
   **Every floor rule is per-project EDITABLE** — the profile is a preset, not a straitjacket.
4. **Variants are bundles of ~8–12 sub-decisions; picks are per-item.** A mix is the normal outcome.
5. **Gen-1 budget:** commit to a named direction **and** over-generate ~6, rubric-filter to 3.
6. **Stage-3 gate follows the profile** — advisory at P1/P2, blocking at P3.
7. **Ledger = one row per decision** (`design_decisions`, migration 0010, live).
8. **Do not spend time on skill-UI polish while the pipeline is unbuilt.**

### One thing added this session that needs the owner's word

**A fourth enforcement tier, `block_feasibility`.** H2 and E2 surfaced a class of failure that is not
a taste or audience question: **the artifact does not render** (eval, WASM, a network reference, an
inline `on*=` handler). A blank panel is blank for everyone, so it can be neither profile-filtered nor
advised. It **extends** ruling 2 — that ruling governs *quality*, this governs *existence* — rather
than revising it, and nothing about the existing three tiers changed. It is built and enforcing.
**Say if you'd rather it were folded into one of the existing tiers.**

## 5. Hard constraints — violating any of these is the failure mode, not a style choice

1. **ONE DOOR (adr-018)** — never open the live `.db` with a second sqlite client. Everything via the API.
2. **`POST /api/backup` before ANY DB change.**
3. **Never run `drizzle-kit generate`/`migrate`** — the un-journaled 0002–0006 gap makes it unsafe.
4. **`npx tsc --noEmit` before every container rebuild.**
5. **`git status` AFTER committing.**
6. **Never store a design decision as a todo title** — `project_todos.title` caps at 300 chars.
7. **Do not overclaim.** Documented ≠ demonstrated. Two verifiers have already caught this program.

## 6. Gotchas — don't rediscover them

- `requireBearer` lives in **`lib/auth.ts`**, not `lib/api.ts`.
- `readAuthBody` calls `req.json()` and **400s on an empty body**.
- Nested quoting through `ssh … <<'HEREDOC'` **ate the quotes** around `sqliteTable('name'`. Prefer
  writing locally + `scp`, or `grep` immediately after writing.
- `preview-build` needs **ImageMagick** — on VAULT7A, not on Windows. **Gate and checker logic tests
  run locally** (pure Node); full image builds run on the server.
- **Comment stripping is load-bearing in the checker.** Our own templates carry the literal string
  `-webkit-font-smoothing` inside a comment explaining its absence; without stripping,
  `adv-no-font-smoothing` fires on the very fix that satisfied it. There is a test for this.
- **The checker only runs in the harness's markup mode.** Token mode has no per-variant source, so the
  build prints `constraint check: SKIPPED`. Every round run so far was token mode.
- Editing `design-rules.json` with `JSON.stringify` reflows all ~900 hand-formatted lines. Do
  text-level edits (see `scratchpad/flip-enforced.mjs` for the pattern).

## 7. Honest state in one paragraph

The **generation** half is real and tested: the isolation gate (20/20), the variant harness, the
one-command preview pipeline, machine-derived theme tokens, and `design_decisions` with lock-earned /
unlock-harder as HTTP 422s. **New this session:** the research sweep is **complete** (22/22 tracks →
229 cited doctrine rules, 89 machine-readable rules), the monitor question is **measured and closed**,
and **enforcement stopped being prose** — **26 of 89** rules plus 3 contract keys now execute, each
naming a test, wired into the harness ahead of emit, with `resolveFloor()` making the audience profile
executable. **The harness now isolates markup variants (declarative shadow DOM), and Phase-1 generation
is built and DEMONSTRATED**: a fresh sub-agent produced 3 genuinely-different media-card variants →
gate → checker → isolated render in the real sandbox → a mixed pick round-tripped live into the
`design_decisions` ledger. **So "no real end-to-end round has ever run" is no longer true — one has.**
**What is still specification:** 63 of 89 rules remain `pending` (reported as *skipped*, never passing);
the 16 `computed` rules have no runner; the 6→3 filter is model judgment, not a mechanical scorer;
there is no computed rendered-appearance divergence check; the live ledger outside that one round is
still a seeded demonstration. **Phases 2 AND 4 are now DONE.** Phase 2: `rejected[]`/frozen
wiring, reload-on-resume, snapshot regression gate (`ledger-context.mjs`, demonstrated live). Phase 4:
fresh-context rounds as the default, scope×entry routing, profile-aware Stage-3 gate, design gates in
the HARD list, and a graduation **protocol + non-writing hook** (`method-routing.mjs`, `graduate.mjs`) —
**round 2 demonstrated the ledger being respected** (fresh agent fed the live ledger → no rejected value
re-offered, frozen axis omitted; mechanically verified + rendered). **Phase 3b STARTED** — the computed checker exists
(`computed-checks.js`, runs in Node for the math + real Chromium for the DOM): `floor-contrast`,
`adv-cross-component-coherence`, and the new `computed-axis-divergence` backstop are built, tested
(6/6 math + 4/4 browser on the server) and demonstrated on real round-2 output. **Remaining: the
other ~12 computed rules** (shadow/glass/type-optical/scale/…) against the same architecture,
**auto-inlining the computed pass** into the harness (it's a post-render step today, run via
`run-computed.mjs` on the server or claude-in-chrome), and the **graduation ingest SUBSYSTEM** (a
migration for provenance/grade columns + grade runner + dedupe + NOTICES). Enforced: **29 of 90**
(26 source + 3 computed); 61 pending, reported as *skipped*. Task 2 is **`ITERATE`**, not `APPROVE`,
against the locked spec's §12 — but materially closer.
