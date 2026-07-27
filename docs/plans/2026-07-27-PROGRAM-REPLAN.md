# Task 2 — program re-plan, 2026-07-27

**Supersedes §3 of `2026-07-23-SESSION-HANDOFF.md`** (which said "run a real round next"). That item
survives, but it is now **second**, because the owner changed where a round is *shown*.

**Written after** reading `SKILL-REGISTER.md` + the handoff, then verifying live state on VAULT7A
rather than trusting either.

---

## 0. What the owner asked, 2026-07-27

Four questions and one new requirement. The questions are answered in §1–§2; the requirement is §3.

| # | Owner's decision (asked + answered this session) |
|---|---|
| D1 | **The design surface lives as a route inside the Ottomate app** — `/projects/[slug]/design`. Not a separate container. |
| D2 | **The Claude-Artifact path is retired.** App only. |
| D3 | **Order: build the page first, then run the real round through it.** |
| D4 | **The real round's target is Screenroom's media/poster card.** |

---

## 1. Two method gaps the owner's questions exposed (both real, both new to the register)

### G-A · Round composition — *"how does it decide what to show together?"*
**What exists.** Altitude is routed (`routeRungs`: component / cluster / page / site → which rungs
run). What varies inside a target comes from `data/component-anatomy.json` — named parts, required
states, 6–10 named sub-decisions, doctrine rule 40 forbidding invented axes. The **tier picks the
render surface**: primitive → all required states pinned open in one strip; composite → 1–3 instances
at real density; surface → once. Rendering a page to decide a button is logged as a rung error.

**What is missing.**
1. **No rule for how many sub-decisions go in one round.** `stage-2-generation.md` says "normally a
   bundle of ~8–12" — prose, no code, no citation.
2. **No rule for which sub-decisions must travel together**, or when a component round must escalate
   to a cluster round because two components share a radius / elevation / state language.
3. **The anatomy has 3 archetypes** (media-card, button, data-table-row). Anything else has no
   sub-decision inventory at all — so the model must improvise, which is exactly what rule 40 forbids.

**Status:** `⬜ absent`. Becomes Phase C.

### G-B · Prior-art / reuse — *"is this already solved elsewhere in the project?"*
**What exists.** Greenfield-vs-existing *is* handled: `routeEntry` distinguishes stage-2 /
stage-4-item / deferred-overhaul / `ui-mode:none`; a stage-4 entry inherits locked context and does not
re-interview; locked axes become frozen controls and rejected values are never re-offered
(demonstrated live, round 2).

**What is missing.** Nothing asks *"has this axis already been answered somewhere else in this
project?"* The ledger is queried **per `target_id`**, so a radius locked on the poster card is
invisible when a round opens on the collection card. `master_components` is queried by *category*, not
by decided-axis. Nothing reads the project's built code. The only backstop is
`adv-cross-component-coherence` — a **post-hoc** check on a mixed pick, not a **pre-round** answer.

**Status:** `⬜ absent`. Becomes Phase D. Engineering gap, not a research gap.

---

## 2. Research: sufficient on quality, four real holes

**22 tracks → 229 cited rules. More research on "what is good UI" would not move the needle** — the
bottleneck is that **61 of 90 machine rules still do not execute.** Knowledge is not the constraint;
runners are.

Genuine holes, each named only because a *built* mechanism is waiting on it:

| # | Hole | Why it is not in the corpus |
|---|---|---|
| R1 | **The owner's own decision history** — every past pick, comment and rejection, sitting unused in the DB | No external corpus contains it. Highest-signal taste data available. *(Already register gap 1)* |
| R2 | **Generation variance** — how to make one model emit genuinely different candidates | An LLM-behaviour question, not a design question. The whole variant harness rests on it; today it is a `[REASONED]` seeding technique with the isolation gate as backstop. *(Already register gap 2)* |
| R3 | **Round composition / choice-session design** — how many options and how many axes a person compares well at once; when paired comparison beats a 3-up; whether one axis should be shown across two components together | Decision-science / HCI literature, not design literature. G1 gave option *count by rung* and nothing else. **This is the literature G-A above is missing — the one worth researching.** |
| R4 | **Licence/provenance operationalisation** | H1 wrote the rules; nobody has audited the 179 catalog rows against them. Narrow, concrete, needed by Phase G. |

Nothing else was added. Inventing topics to fill a slot is how a register starts lying.

---

## 3. Third-party / OSS worth adopting — each tied to a pending item

| Pending item | OSS | Why it beats what we have |
|---|---|---|
| `feas-baseline-gate` needs real `@supports` parsing | **postcss** + `postcss-value-parser` | A real CSS AST instead of regex; sharpens the other source rules as a side effect |
| "is this CSS feature safe to ship here" | **web-features** / `baseline-browser-mapping` (W3C WebDX) | The Baseline-tier data E2 rule 106 asks for, as *data* rather than a judgment call |
| floor a11y rules (contrast, target size, name/role/value) | **axe-core**, driven by the Playwright + Chromium already on VAULT7A | Enforces a chunk of the floor tier for near-zero build cost |
| ΔE2000 / OKLCH math, and the `theme-extract` L-normalisation defect | **culori** | Hand-rolled today; culori is small and exact |
| The pixel half of the regression gate | **pixelmatch** or **odiff** | The snapshot differ is source/value-level only |
| H1 **visual** dedupe + removing the ImageMagick dependency | **sharp** + `blockhash-core` | Pure npm → `theme-extract` would run on Windows too; today it is server-only |
| H1 licence tiers + NOTICES | **spdx-expression-parse** + `spdx-license-ids` | Turns GREEN/AMBER/RED from prose into a function |

**Deliberately not adopted:** Storybook (heavy, framework-coupled, a second component universe to
maintain) · Chromatic (SaaS, paid, ships work off-box) · Figma / Stitch MCPs (they do the designing —
that is the thing being built here) · Penpot (a design tool, not a pipeline part).

---

## 4. What is already built — verified live 2026-07-27, not quoted from the register

### Plugin (`~/.claude/plugins/ottomate`, `main`, clean, 0 unpushed at `e144196`)
Per `SKILL-REGISTER.md` §2. Suites re-verified in §6 below.

### App (`/opt/homeserver/ottomate`, `iter-65-2026-07-13` @ `9c4c75d`, clean, container up 3 days healthy)
**More of the new requirement already exists than expected. The design surface is mostly wiring.**

| Piece | State | Where |
|---|---|---|
| `design_decisions` table — 22 columns incl. `variants_shown`, `mixed_from`, `rejected`, `snapshot`, `preview_url`, `confirmed`, `profile_at_decision` | ✅ live (migration 0010) | `lib/db/schema.ts:1093` |
| `GET`/`POST /api/projects/<slug>/design-decisions` — filters by status / target_id / axis / profile | ✅ live | `app/api/projects/[slug]/design-decisions/route.ts` |
| `GET`/`PATCH`/`DELETE /api/design-decisions/<id>` — the state machine, lock-earned 422, unlock-reason 422 | ✅ live | `app/api/design-decisions/[id]/route.ts` |
| **Static host for self-contained HTML** — read-only, path-traversal guarded, serves `.html`/`.png`/`.json` | ✅ live | `app/api/previews/[...path]/route.ts` → `/asset-library/previews` |
| The previews volume, **writable from the host** | ✅ verified (`touch` test) | `/mnt/storage/ottomate/assets/previews` ← `:rw` in compose |
| A working pick-UI precedent | ✅ live | `/projects/[slug]/components-pick` + `PickSlot.tsx` |
| Browser-side auth pattern for mutations | ✅ live | `components/auth/TokenInjector.tsx` → `sessionStorage['ottomate_token']` |

**Consequence: no DB migration is needed for the design surface.** A *round* is derivable as
"the `design_decisions` rows for (project, target_id, round)" — each already carries `variants_shown`,
`preview_url` and `rung`. No new table, no `drizzle-kit`, no journal edit. This is the lean answer.

---

## 5. The new plan, in order

| Phase | Unit | Why here |
|---|---|---|
| **A** ⭐ | **Design surface in the app** (`2026-07-27-I1-design-surface-in-app.md`) | Owner D1+D2+D3. Blocks B — running the round on a surface being retired would waste it |
| **B** ⭐ | **The real Screenroom round**, media/poster card, through that page, writing the real ledger | Owner D4; the locked spec's §12 acceptance; still the biggest single gap |
| **C** | **Round composition + anatomy expansion** (G-A) | The owner's question 1. Needs R3 research to be *principled*; a defensible interim rule can ship first |
| **D** | **Prior-art / reuse pass** (G-B) | The owner's question 2. Pure engineering — query the ledger across targets + the catalog by axis before a round opens |
| **E** | Remaining ~12 computed rules + **auto-inline** the computed pass | Old 3b tail; adopt **axe-core** + **culori** here |
| **F** | Source tail — `feas-baseline-gate`, `source_policy`, constraint capture | Old 3c; adopt **postcss** + **web-features** here |
| **G** | Graduation ingest subsystem (migration + grade runner + dedupe + NOTICES) | Old 3d; adopt **spdx-\*** + **sharp/blockhash**; needs R4 audit first |

**Unchanged and still binding:** the hard constraints in `SKILL-REGISTER.md` §6 and the owner rulings
in the handoff §4. One ruling still awaiting a word: the **`block_feasibility` 4th tier** (built and
enforcing either way).

---

## 6. Live verification run for this re-plan

Everything asserted in §4 was checked, not recalled:

- `git rev-parse` + `git status` on both repos (plugin clean @ `e144196`; app clean @ `9c4c75d`)
- `GET /api/health` → `{"status":"ok","db":"connected","db_fds":"clean"}`
- `GET /api/projects` → `screenroom` is real: `building`, port 8504, gold-on-charcoal glass (adr-032)
- `find app/api` → the design-decisions and previews routes read in full, not inferred
- `touch` on `/mnt/storage/ottomate/assets/previews` → **WRITABLE**
- `docker ps` → `ottomate Up 3 days (healthy)`; node v20.19.2 on the server
