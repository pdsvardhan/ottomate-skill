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
| **Plugin** | `~/.claude/plugins/ottomate` · repo `pdsv/ottomate` · branch `main` · **@ `bedc504`, clean, 0 unpushed** |
| **App** | `/opt/homeserver/ottomate` via `ssh pdsv@192.168.1.10` · repo `pdsv/ottomate-tracker-v3` · branch `iter-65-2026-07-13` · **@ `9c4c75d`** *(unchanged this session — nothing touched the app)* |
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

### 3a. ✅ DONE 2026-07-23 — the variant harness now isolates markup-mode panels

**Resolved.** Markup variants emit as static declarative shadow roots (`renderPanelStatic` +
`{{PANELS_HTML}}`); verified rendering isolated on real output in the real Artifact sandbox
(`…/57e854cb-…`), `harness-dsd.test.mjs` 6/6. The render check also caught + fixed two pre-existing
bugs: `min-height:100%` blanked every artifact (→ `100vh` in both templates), and a
`path.isAbsolute(undefined)` crash. **Phase 1 generation is unblocked.** Details:
`docs/plans/2026-07-23-C1-harness-dsd-isolation.md`. Next Phase-1 item: sub-decision inventory from C1
anatomy + render-by-tier. *(Original blocker writeup kept below for context.)*

### ~~3a. Unblock Phase 1~~ — original writeup (superseded, kept for context)

**This is the top item and it blocks generation.** `template.variant-set.html:140` does
`host.innerHTML = panels.map(…)`, so all N variants land in **one document** with no iframe and no
shadow root. A shared SVG `id` makes `url(#id)` resolve to the **first** match; a shared class plus a
variant `<style>` block lets the **last** panel restyle its siblings; `@keyframes` and `:root` props go
document-wide. The set then **differs in source and matches on screen** — exactly what the isolation
gate exists to prevent, and a second root cause of the A≈B round.

The **static half is already enforced** (`block-svg-id-collision`, tested) — a colliding set is now
blocked. But blocking is not fixing: a generator that keeps producing generic class names will just
keep getting rejected. Three candidate fixes, **none chosen yet**:

| Option | Upside | What must be verified first |
|---|---|---|
| (a) build-time prefix rewriting of ids/classes/keyframes | robust, no browser feature dependency | needs a real HTML+CSS rewriter, not regex |
| (b) `iframe srcdoc` per panel | total isolation, zero rewriting | per-panel height management; the known iter-16 iframe-scrollbar caveat |
| (c) declarative shadow DOM (`<template shadowrootmode>`) | native id + CSS scoping, no iframes, no script | **two things I could not verify without a browser:** its Baseline tier as of now (it looked *Newly* rather than *Widely* Available), and — the real catch — **`innerHTML` does not parse declarative shadow roots**; that needs `setHTMLUnsafe()`, which is newer still |

**Do not pick from memory.** Doctrine rule 106 is explicit that Baseline tier is a build-time check.
Verify in a real browser, then write the plan doc.

### 3b. Phase 3b — the computed checker

16 rules are `method:"computed"` and need a rendering host. **The Task-3 Playwright harness in
`scripts/feature-verify/` is the natural one** — reuse, not a new subsystem. Start with
**`adv-cross-component-coherence`**: it is the mix-coherence check G1 requires, and the owner's
per-item pick model (doctrine 38) depends on it — when they take the header from v1 and the card from
v2, that rule is what proves the result is still one design.

### 3c. The rest, unchanged in intent

| Phase | Items |
|---|---|
| **1 Generation** | sub-decision inventory from C1 anatomy · render-by-tier with states pinned · bundle model + per-item picks · over-generate 6 → show best 3. **Gated on 3a** |
| **2 Persistence** | `rejected[]` wiring · reload-on-resume · snapshot differ. Table already exists (0010) |
| **3a remainder** | `feas-baseline-gate` (`@supports` parsing) · `source_policy` (needs a tagging convention) · constraint *capture* — the contract is read from config today; nothing writes it to the ledger |
| **4 Wiring** | fresh-context rounds · scope×entry routing · Stage-3 gate · register gates in SKILL.md's HARD list · **graduation to `master_components` — now specced by H1, see the register's superseded list** |

Write a plan doc before each unit. Pattern:
`docs/plans/2026-07-23-B1-source-constraint-checker.md` (verifies live state first, then specifies,
then lists acceptance and risks) or the earlier `…-A2-migration-0010-design-decisions.md`.

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
