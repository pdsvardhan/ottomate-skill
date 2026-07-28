# Ottomate Design-System Rebuild — SPEC v1 (2026-07-29)

Motivated by the design-method TEST on cointrail (`docs/test-runs/2026-07-28-cointrail-run1.md`, findings
F-1…F-17) and the owner's vision (2026-07-29). Grounded in two web-research passes (cited inline). This is
a PLAN, not code — approve the sequence (§5) before building. Owner's **taste links still pending** (blocks
pillar A's *content*, not its design).

---

## 1. Nomenclature — the vocabulary everything else uses
Stop overloading "component." Seven plain nouns (owner-facing), each 1:1 to a formal term (AI/docs-facing):

| You say | What it is | Examples | Formal equivalent |
|---|---|---|---|
| **Styles** | raw design values — colour, type, spacing, radius, shadow, **motion timing** | brand navy, `radius-lg`, `200ms ease` | design tokens (DTCG: `color`/`dimension`/`duration`/`cubicBezier`/`transition`) |
| **Parts** | smallest pieces, one job | button, input, icon, badge, avatar | atoms / elements |
| **Blocks** | parts assembled into a reusable unit — *"a search bar" lives here* | search bar, card, table, navbar, modal | molecules + organisms |
| **Layouts** | empty page skeletons, arrangement only | dashboard shell, auth frame | templates |
| **Screens** | real live pages with real content | cointrail dashboard | pages |
| **Behaviors** | how a Part/Block reacts + moves (states + motion) | hover-lift, focus ring, loading, on-load reveal | interaction states + motion tokens |
| **Patterns** | *docs-only* guidance (advice, not code) | "empty states", "confirm before delete" | patterns (Curtis) |

Motion sits in TWO places on purpose: motion *values* are **Styles**; motion *behavior* is a **Behavior**.
(Sources: Frost Atomic Design; Curtis/EightShapes classification; W3C DTCG.)

---

## 2. Problems → solutions (the 17 findings, mapped)
| Finding | Fix (pillar) |
|---|---|
| **F-13** app unreachable (no tunnel) | Expose the apps in-browser (§Pillar F / Phase 0) |
| **F-14** JS-inert static preview | **Ladle iframe-grid live preview** in the project's real toolchain (Pillar F) |
| **F-15** no decomposition intelligence | Decompose-and-ask intake + the pattern dictionary (Pillars D/E) |
| **F-17** round not legible | The "this round decides X" legibility banner (Pillar F) |
| **F-16** structural rules cap ambition | Live preview lifts the interactivity ceiling; keep taste-rules, relax the mechanics (Pillars E/F) |
| **F-4** derive returns junk parts | Decomposition driven by the anatomy graph + `data-role`/`data-oid` stamping, not name-guessing (Pillar E) |
| **F-8** colour budget miscounts slate / ignores config | Semantic-token theming + **per-theme contrast gate** replaces the crude accent-count (Pillar C) |
| **F-9** isolation ↔ divergence tension | Variants are whole live directions OR one-property cycles by explicit owner choice, not a forced control matrix (Pillar E) |
| **F-11** publish needs registry surgery | The library/catalog is token-and-graph based; any Block can be a design target (Pillars B/C) |
| **F-10** compare view squeezes wide sections | Live preview renders each variant full-size in its own iframe (Pillar F) |
| **F-1,2,7,12** doc/code drift, false positives, enum-as-token | Cleaned up as each subsystem is rebuilt |

---

## 3. Architecture — the six pillars

### Pillar A — Taste profile (what you like)
A living **taste file per owner**, updated on a **manual trigger** (a `/taste` command), stored in Ottomate,
read by the design AI. Follows v0's **"grounded skill" model**: persist verified preferences, ground
generation in them, never invent against them ([v0 Design Systems 2.0](https://v0.app/docs/design-systems-2)).
- **Content:** the owner's liked references (A/A1 = love, tier-2 = decent) → I extract concrete, written
  preferences (palette leanings, type, density, motion appetite, layout patterns, "avoid" list). *(needs links)*
- **Reuse:** extends `style-priors.mjs` (owner's locked-decision history) with *explicit* references.
- **Feeds:** the intake flow (D) as defaults, and the generator (E) as grounding + an anti-slop "your-taste" bar.

### Pillar B — Directory / catalog
One faceted Ottomate page: **type × project**. Project → Screens → Blocks → Parts rollup, with **"used in N
projects"** backlinks. Each item card = thumbnail + name + **status pill** + **version** + **provenance
badge** + view-live.
- **Status enum (~4):** Draft → In Review → **Stable/Finalised** → Deprecated (+ optional Experimental).
  **Finalised = a locked design round** (owner ruling). (Storybook/Primer lifecycles.)
- **Provenance badge:** **Authored** (`library='ottomate'`) / **Imported** (shadcn/magicui/…) / **Project-local**
  — THIS is the "system-built vs legacy" distinction; legacy/imported render **greyed + not clickable**.
- **Click target:** an **Ottomate detail page** (versions/decisions/spec/tokens-consumed) **+ a "view live"** link
  (opens the isolated live render AND the real Screen). (owner ruling.)
- **Reuse:** the N2/N3 boards (`summariseTargets`/`rollUpPage`/`groupByFlow`) + `master_components` + the
  `design_decisions` ledger already provide status, rollups, and provenance columns — this is an enrichment,
  not a greenfield. (Sources: Zeroheight status, Chromatic versioning, Curtis on provenance.)

### Pillar C — Library + nomenclature + theming
**One reusable library in Ottomate**, **themed per project via tokens** (owner ruling), no forks.
- **Three-tier tokens:** primitive → **semantic (the only layer components read)** → component(optional).
  A theme = redefining the semantic tier under a `[data-theme]` selector; CSS vars recalc instantly.
- **Rules:** ban raw values in Blocks/Parts (lint via the `normalize` skill) · foreground-pairing
  (`surface`/`on-surface`) · **a per-theme contrast gate as a publish gate** (kills the "invisible text"
  class, and replaces F-8's crude accent count) · author tokens once in DTCG JSON, build N theme sheets
  (Style Dictionary). Ship **1 library + N themes**.
- **Reuse:** `master_components` becomes the Blocks/Parts library; its `quality_grade`/provenance columns
  already exist; graduation (`graduate.mjs`) promotes a locked bespoke Block into it.

### Pillar D — Top-down intake flow (project onboarding)
Separate **one-time project onboarding** from per-generation prompts (the universal pattern across v0 /
Builder Fusion / Uizard / Stitch). ~**30 "UI-decision" questions in 5 stages**, each **enum + default**, each
**pre-filled** by reading the repo/DB, persisted per project, **re-run only on what's being rebuilt**.
- **Stages:** ① Research/what-to-show (archetype, audience, primary data) → ② Structure (page types, dashboard
  sub-type [operational/analytical/strategic], nav, above-the-fold) → ③ Style (tokens, mode, radius, style
  family, density) → ④ Interaction (motion budget, hover richness, loading, 3D, interactive charts, feedback)
  → ⑤ silent constraints (a11y/perf as defaults, not questions).
- **Grounding rule (from v0):** the AI may only use tokens/components verified in the project's DS /
  `master_components` — never invent one. Follow-up questions only when sources are insufficient.
- **Reuse:** the existing context gate + `ui-master-plan` + P1/P2/P3 profiles are the seed of this; expand
  from 4 questions to the staged ~30, and make PRE-FILL real (read the repo).

### Pillar E — Decomposition + variant intelligence (the missing brain)
On "redesign X," the tool **inspects the real component, decomposes it** (Section → the changeable
dimensions: layout, font, data-presentation, Behaviors) and **ASKS what to change and how deep** (whole
Block / one Section / one property — anything from a font to a border animation). Then variants explore
**real combinations**, and the tool recommends good ones from a dictionary.
- **The pattern/combination dictionary** — a machine-readable graph the AI loads on activation:
  `app_archetypes → layout_templates → section_patterns → component_refs (→ master_components)`, plus
  `chart_by_data` (encode the **FT Visual Vocabulary** — 9 data-relationships × ~70 charts, open-source,
  ingest wholesale + Datawrapper's "avoid" notes), `interaction_patterns` (the 20-pattern motion table below),
  and **`combination_rules`** (the "what's good together / avoid together" layer as first-class facts).
  Live section/flow reference via the **Mobbin MCP** (~621k real screens).
- **Motion dictionary (starter, 20 patterns):** button-press, hover-elevate, focus-ring, menu-open,
  modal-enter, toast, skeleton→content, streamed-load, count-up, list-stagger, tab-slide, accordion,
  scroll-reveal, 3D-tilt, drag-reorder, optimistic+undo, success-check, error-shake, chart-tooltip,
  chart-brush — each tagged productive/expressive, with tokens + good-with/avoid + reduced-motion swap.
- **Fixes F-4/F-15/F-9:** decomposition comes from the anatomy graph + `data-role` stamping (not name
  guessing); the owner picks scope explicitly; variants can be one-property cycles OR whole directions.
- (Sources: UI-Patterns.com, uxpatterns.dev, Mobbin, FT Visual Vocabulary, Datawrapper, Yellowfin dashboards,
  Carbon/Material motion.)

### Pillar F — The live, legible loop
- **Live preview engine:** a per-project **Ladle** isolation server (Vite-native, ~1.2s cold start vs
  Storybook ~8s) rendering each variant as an auto-generated **fixture that imports the REAL component**;
  Ottomate shows a **grid of iframes**, one per variant, full-size, with real hover/motion/3D/charts +
  a postMessage bus for "interact all"/viewport sync. **Sandpack/Nodebox** for not-yet-committed AI drafts.
  This replaces the JS-inert DSD panels (F-14) and the squeezed compare view (F-10).
- **Legibility banner (F-17):** every round leads with, in plain language, **"This round decides: [X, Y].
  The N versions differ ONLY in that; everything else is held. Pick one or mix."** — enumerated, loud, never
  a buried subtitle. No silent "round 2" deferrals — if something's deferred, say so and get assent.
- **Reachability (F-13):** expose the Ottomate app + a project "design mode" route via the Cloudflare tunnel
  (or LAN), and make publish surface a **reachable** URL — not `127.0.0.1`.
- **Always-ask-first** scope (owner ruling).
- (Sources: Ladle vs Storybook benchmarks; Storybook embed/composition; Sanity/Builder visual-editing.)

---

## 4. Existing Ottomate infra this reuses (not greenfield)
`master_components` (116) → Pillar C library · `style-priors.mjs` → Pillar A · `design_decisions` ledger +
lock/version → Pillars B/E · N2/N3 boards → Pillar B · context gate + `ui-master-plan` + P1/P2/P3 → Pillar D ·
`graduate.mjs` → Pillar C · the `normalize`/contrast checks → Pillar C's per-theme gate.

---

## 5. Recommended build sequence (my call, per the owner's ask — approve/adjust)
Ordered by dependency + pain. Each phase is independently useful.

- **Phase 0 — Foundations (unblock everything).** (a) Expose the apps in-browser (fix F-13). (b) Lock the
  nomenclature + stand up the three-tier **semantic-token theming** seam + per-theme contrast gate (Pillar C
  core) — everything downstream reads these. (c) Capture the **taste profile** from the owner's links (Pillar A).
- **Phase 1 — The live, legible, decompose-and-ask loop (fixes the exact failure you hit).** Ladle
  iframe-grid live preview (F-14/F-10) + the legibility banner (F-17) + decompose-and-ask for a single Block
  (F-15) + always-ask scope. *After this, re-run the cointrail spending-analysis redesign for real — it will
  be viewable, live, and legible.*
- **Phase 2 — The intelligence.** The per-project onboarding intake (~30 Qs, real pre-fill) + the
  pattern/combination + chart + motion **dictionaries** (seed from FT Visual Vocabulary + Mobbin MCP). This is
  what turns "competent" into "excellent."
- **Phase 3 — The catalog + reusable library.** The directory (Pillar B) + graduation of Finalised Blocks into
  the shared themed library (Pillar C). Comes last because it *catalogs what the system now produces well* — a
  basic read-only inventory can ship earlier if you want visibility sooner.

**Why this order:** you must be able to SEE and RUN a design (Phase 1) before the intelligence (Phase 2)
pays off, and the catalog (Phase 3) is most valuable once the system is producing finalised work. Phase 0's
tokens + taste are the substrate all three stand on.

---

## 6. Open items / risks
- **Taste links** — pending; Pillar A content blocked until received.
- **Effort** — this is a multi-week build across the app + the plugin + each project's repo (Ladle per
  project). Phase 1 alone is the highest-value slice and could stand as the first milestone.
- **Mobbin MCP / external deps** — evaluate licensing + auth before wiring.
- The cointrail TEST round (67–72, locked) is still parked; rolls back on "skill test done".

---

## 7. Phase workflow — the GOVERNING RULE (every phase, owner ruling 2026-07-29)
No phase is "done" on a claim. Each phase session ends by proving it, then planning forward:

1. **BUILD** the phase's tasks.
2. **VERIFY against the plan, with EVIDENCE** — for every acceptance criterion, produce *proof it actually
   works*: run it and show the output; include a **must-fail case** where a gate/lint is involved (a check
   that never fails is not evidence); render both colour schemes where visual. Use the code + feature
   verifier discipline. **"Claimed done" ≠ "verified done"** — that gap is the exact failure this whole test
   exposed (a method that reported green while shipping unreachable, static, illegible output).
3. **RECORD** a short completion note: what was built · the verification evidence · what is NOT done · any
   deviation (good-vs-bad, named).
4. **PLAN the next phase** — concrete tasks + acceptance criteria — before the session ends.

A gap is **named, never hidden**. If an acceptance criterion can't be met, the phase reports it as an open
item and does not claim completion.

---

## 8. Phase 0 — detailed plan (Foundations)
**Goal:** the substrate Phases 1–3 stand on — the design surface is reachable, a semantic-token theming
seam + per-theme contrast gate exist, and the taste profile is captured and read by the AI. **~1 build
session.**

### WS0.1 — Reachability & correct URL surfacing
- Confirm the Ottomate app is browser-reachable (✅ `ottomate.vault7a.xyz` works — corrects test-finding
  F-13) and identify the routing (Cloudflare tunnel → NPM, not the cloudflared config I grepped) so a
  project **"design mode" route** can be exposed the same way in Phase 1.
- Make `publish-round.mjs` (and the method) print the **reachable tunnel URL**, never `127.0.0.1`.
- **Acceptance:** publishing a round yields a link the owner opens in a browser and sees the round.
- **Verify:** owner opens the printed URL and confirms it renders; `curl` the tunnel host server-side returns
  200 (auth caveat noted).

### WS0.2 — Semantic-token theming seam + per-theme contrast gate  *(the core build)*
- Define the **3-tier token model** (primitive → **semantic (only layer components read)** → component) and
  the semantic contract: `--color-surface / --color-on-surface / --color-border / --color-action /
  --radius-* / --shadow-* / --motion-*`.
- Author **cointrail's tokens as the pilot theme** in DTCG JSON; emit a `[data-theme="cointrail"]` CSS-vars
  sheet (Style Dictionary or a minimal builder).
- Refactor **one real Block** (a spending-analysis panel) to read **only** semantic tokens.
- Build the **ban-raw-values lint** (extend the `normalize` skill): flags a hard-coded hex/px/easing inside a
  Block/Part.
- Build the **per-theme contrast gate**: run the existing contrast check **per theme**, as a fail-closed
  publish gate — this **replaces F-8's crude accent-count** and kills the "invisible text" class.
- **Acceptance:** the refactored Block reads only semantic tokens · renders correctly under the cointrail
  theme in **light + dark** · the contrast gate **passes** it and **fails** a deliberately-broken theme · the
  lint **flags** an injected raw hex.
- **Verify:** run gate + lint and show **pass AND must-fail** output; render both schemes.

### WS0.3 — Taste profile captured + wired
- Taste profile v0 written (`references/taste-profile.md`) — ✅ done (bold/3D/motion/effect-rich; anti-slop
  made advisory for this owner).
- **Wire the generator to read it** (inject into the round packet; anti-slop → advisory on this owner's
  projects) and stub the `/taste` manual-update flow (doc + note; full app UI is later).
- **Acceptance:** the generation packet includes the taste profile · a dry-run generation visibly reflects it
  (proposes 3D/animated/glow options, not flat) · anti-slop is advisory, not blocking, for this owner.
- **Verify:** show a generation packet/output reflecting the taste bar + confirm the anti-slop tier flip.

### Phase 0 exit (apply §7)
Verify all three WS acceptance criteria with evidence · record the completion note · **plan Phase 1** (Ladle
live-preview engine, the legibility banner, decompose-and-ask for one Block, always-ask scope — with
acceptance criteria) before ending.
