# Stage 1 — USABLE. Six unit plans.

**Parent:** `2026-07-27-TASK2-COMPLETION-PLAN.md`. Everything here was checked against live state, not
recalled. **Yes, Stage 1 can be built end to end** — no unit is blocked on research or on a decision.
One prerequisite was discovered while planning (U6a) and is folded in.

**Owner decisions added this round:**

| # | Decision |
|---|---|
| D12 | Non-token picks → **a tokens file plus a small machine-readable spec**. Tokens are primary; the structural picks go to `design-spec.json` and are echoed as comments in the tokens file so nothing is invisible |
| D13 | A locked round **writes and commits** on the project's branch. **No push, no deploy** — that stays the owner's call |
| D14 | Design work **attaches to the iteration that already exists** rather than inventing a parallel record. Owner: *"even if I go straight it still creates an iteration currently."* Create the item **when a round locks**, not when it opens |

**Build order (recommended):** **U6 → U1 → U2 → U5 → U3 → U4.**
U6 first so the owner has a correct round to pick on while the rest is built; U1 is the root-cause fix
and unblocks U2 and U5.

---

## U1 — Split the anatomy

### Live state
`component-anatomy.json` (96 lines) holds four things at once: `meta`, `tiers` (3, each with a
`render_surface`), `state_matrix` (5 always + 4 conditional), and `archetypes` (3, each with `tier`,
`parts`, `required_states`, `required_variant_floor`, `sub_decisions[]`). 22 sub-decisions, each now
carrying `id / part / kind / axis / channel / scope_hint / hint`.

Consumers, all of which must keep working unchanged:
`picks-to-ledger.mjs` (`loadAnatomy`, `arche.sub_decisions`, `arche.tier`) ·
`method-routing.mjs` (`buildRoundInput` → `sub_decisions`, `required_states`, `tiers[t].render_surface`) ·
`publish-round.mjs` (`sub_decisions`, `tier`, `sub.hint`) · `round-composition.mjs` (`channel`,
`scope_hint`) · three test files.

### Spec
- **New `data/design-questions.json`** — the universal half: `tiers`, `state_matrix`, and a `questions`
  registry keyed by question id → `{ channel, scope_hint, kind, axis, applies_to_tiers[],
  applies_to_roles[], token (the CSS custom property it maps to, or null if structural), hint }`.
  The `token` field is what U5 reads to know which picks can become code.
- **`data/component-anatomy.json` shrinks** to per-component records only:
  `{ tier, parts[], part_roles{}, required_states[], required_variant_floor, questions: [{ q, part, hint? }] }`.
- **New `scripts/generation/anatomy.mjs`** exporting `resolveArchetype(id)` which merges the two and
  returns **exactly today's shape**. Per-component `hint` wins over the question's generic hint.
- Every consumer switches to `resolveArchetype`.

### Acceptance
1. A **golden snapshot** of `resolveArchetype()` for all 3 archetypes, captured from the pre-split file,
   deep-equals the post-split output. This is the whole point: the split provably changes nothing.
2. `buildRoundInput` output identical before and after for all 3 archetypes.
3. A test proves a per-component hint **overrides** the generic one.
4. Full suite green.

### Risks
- Hints are component-specific (media-card's radius hint mentions a "data/tech voice"). The merge must
  preserve them — covered by acceptance 3.
- `corner-radius` and `actions-reveal` appear in two archetypes each; the universal entry must be the
  same design question in both. Verified: matching `channel` and `scope_hint` today.

**Depends on:** nothing. **Unblocks:** U2, U5.

---

## U2 — Derive a component's inventory from its own source

### Live state
Project sources live at `/mnt/storage/websites/<slug>` — **positional, no column points at them**
(checked; the container also mounts it read-only at `/repos`). Screenroom's `PosterCard.tsx` really
contains parts `pz · pf · pills · own · meter · info · cap · t · yr · gb` and child components
`OwnChip`, `PosterImage`, `QuickPeek`.

### Spec — two halves, because this is judgment on top of a floor
**Mechanical — `scripts/generation/anatomy-derive.mjs`:**
- `collectEvidence(source, css?)` → `{ elements[], classNames[], dataRoles[], childComponents[],
  cssSelectors[], cssProps[], landmarkRoles[], interactiveEls[] }`.
- `inferTier(evidence)` → landmark role ⇒ `surface`; a named child component or ≥2 interactive regions
  ⇒ `composite`; else `primitive`.
- `validateRecord(record, evidence, questions)` — **fails closed**: every question id must exist in the
  registry, every declared part must trace to real evidence in the source, the tier must be consistent
  with the evidence, and `required_states` must cover the tier's floor.

**Judgment — documented in `references/stage-2-anatomy.md`:** given the evidence bundle and the
question registry, produce the per-component record. This is a model task with a mechanical validator,
exactly like the 6→3 filter — and it is labelled as such, not dressed up as parsing.

**No approval gate (D11).** The derived axes surface *inside the round* — in the axis header and the
panel meta — and are correctable while looking at it. The record is saved to `component-anatomy.json`
only once a round has been published from it (survival, not assertion).

### Acceptance
1. `PosterCard.tsx` → tier `composite`, parts covering media / badge / status / caption / action;
   validator passes.
2. Two components it has never seen (`OwnChip.tsx` → primitive; a page shell → surface) produce records
   a human reading the file agrees with.
3. **Must-fail:** a record naming a part with no evidence in the source is rejected.
4. **Must-fail:** a record naming a question absent from the registry is rejected.

### Risks
- Abbreviated class names (`pz`, `cap`) are weak signals on their own — so evidence must include element
  types and CSS properties (`aspect-ratio` ⇒ media), never names alone.
- CSS often lives in a global stylesheet, not beside the component. If no CSS is supplied the evidence
  bundle **says so**, rather than silently deriving from JSX alone.

**Depends on:** U1.

---

## U3 — Design-intent intake

### Live state
`iteration_items` carries `item_type`, `target_kind`, `target_id`, `status`, and
`POST /api/iterations/[id]/items` exists. The owner's real inputs are one line: *"need to redesign
this"*, *"new button here"*, *"visual overhaul"*.

### Spec — `scripts/generation/design-intent.mjs`
`classifyIntent(text, context)` → `{ is_design, scope, target: { kind, id, confidence }, action }`
- **Scope from phrasing:** "overhaul / whole app / everything" ⇒ `site`; "this page / screen" ⇒ `page`;
  "these / this section" ⇒ `cluster`; default `component`.
- **Target resolution** against the project's `components`, `pages` and open `iteration_items`, plus
  **context** (the last DOM comment, the design page currently open, an explicitly named oid).
- **Confidence gate — the acceptance-critical behaviour.** No candidate above threshold, or two
  candidates within a narrow margin ⇒ `action:'ask'`. **It never guesses a target.**

`attachOnLock(...)` (D14) — find the project's open iteration and create one `iteration_item` **when a
round locks**, linking the design decisions to it. Nothing is created while merely exploring.

### Acceptance
1. **Must-ask:** "new button here" with no context resolves to `action:'ask'`, not a guess.
2. "new button here" with a design page open for target X resolves to X.
3. "redesign the poster card" on screenroom ⇒ that target, scope `component`.
4. "visual overhaul" ⇒ scope `site`.
5. Locking creates exactly **one** iteration item; exploring creates none.

### Risks
- Fuzzy matching false-positives — mitigated by requiring a clear margin between the top two candidates.
- "this" is only resolvable from context, so context must actually be plumbed through from the caller;
  if it isn't, the honest outcome is `ask`.

**Depends on:** U1/U2 for target→archetype. Classification itself is independent.

---

## U4 — The worklist

### Live state
`iteration_items` already has everything needed. **`GET /api/iterations` does not exist** (verified 404,
with a helpful error naming aspirational endpoints) — so the read path must be confirmed or a small
endpoint added. `components` carries `picked` / `skip_reason` for unfilled slots.

### Spec
`worklistForProject(slug)` unions two sources:
1. `iteration_items` with `target_kind ∈ (component, page)`, a UI-bearing `item_type`
   (`component_modification`, `page_modification`, `revamp`, `new_feature_request`, and `bug` when its
   visual-QA category says so), `status ∉ (rejected, integrated)`.
2. `components` where `picked = false` and `skip_reason IS NULL`.

**Ranking:** unsettled first (no locked design decisions for that target), then most recently raised,
then most referenced. Each row shows its **source** (a DOM comment · an iteration item · an unpicked
slot), the target, and whether an inventory exists yet. Surfaced above the target list on
`/projects/[slug]/design`; clicking opens a round on that target.

### Acceptance
Screenroom's design page lists real outstanding UI work with real sources; a target with locked
decisions ranks below one without; clicking starts a round on the correct `target_id`.

### Risks
- The read endpoint may need adding — small, but it is a real app change, so typecheck + rebuild.
- The item_type ⇒ "has UI" mapping is a judgment and must be **written down in the module**, not implied.

**Depends on:** U3 (shares the target model). Independent of U1/U2.

---

## U5 — Picks → code

### Live state
No emitter exists anywhere; `stage3DesignGate` only checks that decisions *exist*. Of the media-card's
10 sub-decisions, **7 are token-shaped and 3 are structural**. Project repos are real git repos at
`/mnt/storage/websites/<slug>` with remotes on the local Gitea.

### Spec — `scripts/generation/emit-design-artifacts.mjs`
Input: a project's **locked** decisions + the question registry from U1 (whose `token` field says which
question maps to which CSS custom property, or `null` for structural).

- **`design/ottomate-tokens.css`** — the primary artifact. `:root { --<target>-<question>: <value>; }`,
  with a header naming the round, the decision ids and the date, and **the structural picks echoed as
  comments** so no decision is invisible from the code (D12).
- **`design/ottomate-design-spec.json`** — the structural picks, machine-readable, for Stage 3 codegen.
- **Write and commit on the project's branch** (D13), message naming the round and the locked
  decisions. **Never push. Never deploy.**
- Snapshot the emitted token file into `design_decisions.snapshot` so the **regression gate diffs real
  code**, not a value string.

### Acceptance
1. Locking a Screenroom decision writes both files and commits them; `git show` names the round.
2. Hand-editing the token file then re-running the differ **trips the regression gate**.
3. **Must-fail:** refuses cleanly when the repo is dirty in those paths.
4. `--dry-run` prints the exact diff and writes nothing.

### Risks
- **This is the highest blast radius in Stage 1** — it writes into a project repo. Mitigations, all
  non-negotiable: never push · only ever touch paths under `design/` · refuse on a dirty tree ·
  `--dry-run` first · the file is additive (the project opts in by importing it).
- The question→CSS-property map must live in `design-questions.json`, never be invented per project.

**Depends on:** U1.

---

## U6 — Re-run Screenroom properly

### Live state
r1 = decisions **12–17**, all `proposed`, none picked; `DELETE /api/design-decisions/[id]` exists.
348 posters at `/opt/homeserver/appdata/radarr/MediaCover/<id>/poster-500.jpg`, and **Radarr's API
returns real titles** (verified). `theme-extract` produces varied accents on them.

**Discovered while planning — U6a is a prerequisite, not an optional extra:** the harness has only
**six template-level placeholders** (`TITLE`, `SUBTITLE`, `AXIS_NAME`, `AXIS_PARAM`, `PANELS_HTML`,
`VARIANT_DATA`) and **none are per-card**. A markup-mode panel therefore receives **no shared content
at all**. That is a structural reason the first round used CSS gradients — theme-from-content and
markup mode are currently incompatible. Logged as a defect.

### Spec
- **U6a — harness fix.** Substitute per-card placeholders inside panel markup (`{{IMG_n}}`,
  `{{TITLE_n}}`, `{{META_n}}`, `{{ACCENT_n}}`) from the shared `cards` array **before** the panel is
  wrapped in its shadow root. The existing leftover-placeholder guard already fails loudly on a typo.
- **U6b — real content.** 4 real movies from Radarr (title, year, id) → `poster-500.jpg` → `cards` with
  `theme-extract` accents, downscaled to ~340 px.
- **U6c — republish.** Backup → delete 12–17 → build and publish **round A (weight + density:
  corner-radius, elevation, media-aspect, title-placement, meta-density)** and **round B (colour +
  motion: accent-usage, badge-style, selected-signal, actions-reveal, hover-motion)**. Panels
  re-authored on real posters, with the derived accent used on exactly the surfaces `accent-usage`
  names — no more.

### Acceptance
1. Two rounds live, **5 axes each**, `regime: per-item-viable`.
2. A `data:image/jpeg` URI is present in the served HTML — real poster art, proven by fetching the page.
3. Gate + constraint checker + the new `distinct-source` / `value-present` checks all pass.
4. Total page weight under E1's 1 MB "snappy" budget, measured and stated.
5. `formatComposition` output recorded in the round manifest.

### Risks
- Weight: 4 posters × 3 panels as data URIs. At ~340 px they should land far under 1 MB — **measured,
  not assumed**.
- Deleting r1 is destructive ⇒ `POST /api/backup` first; the round's inputs are already archived under
  `docs/rounds/screenroom-postercard-r1/`.

**Depends on:** U6a only. **Can go first.**

---

## What Stage 1 does not cover — deliberately

Control-side verification, the computed pass being auto-inlined, the two grades of `rejected[]`,
recording the discarded three, slot provenance, inherited controls reaching the harness, the
`TIER_RUNG` bug, owner-history injection and the rubric scorer are all **Stage 2**. They make the tool
trustworthy; Stage 1 makes it usable. Shipping them together would delay both.
