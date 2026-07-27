# Task 2 — Iterative UI Design Method (Stage 2 design engine)

**Status:** ✅ LOCKED 2026-07-23; **amended 2026-07-23** with lessons from the first real run (retrospective: `~/Desktop/Projects/Personal projects/media manager dashboard/UI-APPROACH-RETROSPECTIVE.md`). Build order: Task 1 → Task 3 → **Task 2**.
**Author:** design session 2026-07-23. Task 2 of 3.
**Source:** `Downloads/TASK2-UI-DESIGN-METHOD.md` (method) + the Screenroom `UI-APPROACH-RETROSPECTIVE.md` (first real run's lessons, folded into §5/§7/§8). Owner: *"Task 2 is unique, solving my UI design issues."*

---

## 1. Problem & goal

Designing UI by prose fails both ways: AI-generated UI is generic "slop" (cream-and-serif, centered everything, glassmorphism everywhere); and humans **can't specify visuals in words** — they know it when they *see* it. Current Stage 2 already picks components from `master_components` with previews, but it lacks the **method**: a fast visual loop that shows real, interactive, genuinely-distinct options, lets you pick/mix, and converges on a locked, implementation-ready design — **taste extracted by selection, not description.**

**Goal:** make Stage 2 (and the Stage 4.4.6 taste gate) run the full method — *show 2–4 real interactive variants → pick/mix/nudge → rebuild the same preview URL → lock → next* — producing an agreed design spec handed to Stage 3.

## 2. Decisions locked

| # | Decision |
|---|---|
| D1 | Home = **Stage 2** (UI master plan + component pick) **+ Stage 4.4.6** (per-iteration design-taste). Upgrade, not a new pipeline. |
| D2 | **Show real interactive variants, never prose.** 2–4 genuinely different options; **mixing is the point** ("1A's meta + 2C's button"). |
| D3 | **One evolving preview at a stable URL**; self-contained; real content; interactive; light/dark; primary-screen-tuned. |
| D4 | Variants render **real `master_components`** (the existing library), tagged by source; quick-build only to fill gaps. |
| D5 | Output = **agreed design spec + preview URL**, handed to Stage 3. Design and implementation stay separate. |
| D6 | **Theme-from-content extraction** (poster → dominant-colour token) is the **core differentiator** — in the real run it *became the whole identity*. Wire it early for asset-rich projects (mechanically Phase 2 since it needs per-project asset config, but first-class, not an afterthought). |

## 3. Scope / non-goals

**In scope:** context gate; UI worklist decomposition; the A→B→C fidelity ladder; self-contained interactive previews on a stable URL; a decision ledger; anti-slop + anti-gaslight guardrails; real-asset + theme-from-content (phase 2).

**Non-goals:** not implementing into the real codebase (that's Stage 3); not authoring new library components (that's `seed-component`); not replacing `master_components`.

## 4. The core loop (non-negotiables)

1. **Show, don't tell** — build it and let them look; never "here's a description, ok?".
2. **Options, not one answer** — 2–4 genuinely different; pick or **mix**.
3. **Real + interactive** — real content, real hover/motion (they're often choosing the *interaction*); respect `prefers-reduced-motion`.
4. **One evolving preview** — republish to the **same URL** each round.
5. **Precise reaction → precise rebuild** — restate what you understood (anti-gaslight), change exactly that, keep what they liked.
6. **Lock explicitly** — mark approved items locked; never silently revisit.

## 5. Component design

- **5A Context gate (mandatory).** Acquire **audience / use-cases / brand-tone / primary screen** (e.g. "owner on a 27″ 4K first, family on laptops second") up front — short interview or a saved project profile. **Do not proceed to visuals without it** (code tells you *what* was built, not who it's for or how it should feel).
- **5B Worklist decomposition.** Break the target into components by **how much the eye drives them**: *their call* (cards, grids, hero, tables, filter bars, buttons) · *propose–react* (empty/loading states, dialogs, dashboards) · *you-drive-approve-once* (foundation tokens: colour ramp, type scale, spacing/radius, large-display layout). Owner picks **order + granularity** (one component per round vs a cluster). Foundation can be set implicitly *under* the first visual surface.
- **5C The fidelity ladder (broad → specific — the ordering is what worked).** **A — Directions/style-boards:** 3–5 whole-vibe options (named palette 4–6 hex + type voice + mood + one hero sample); pick 2–3. **A½ — Core mechanic (before per-component work).** Take the one mechanic that defines the product's spine — its signature state/interaction (Screenroom run: the ownership indicator → "border colour from the poster, state = border behaviour, coral = action only") — and iterate *that* in depth first. Nailing it early makes everything downstream cohere; jumping to whole pages before it's locked causes churn. **B — Component showcase:** for each component, 2–4 **real variants from `master_components`** side by side, tagged by source; pick/mix per component (most decisions land here). **C — Clusters → whole-page → micro:** assemble the locked pieces into **full screens with live interactions** at real density on the target screen, then whole-page style variants, then micro-variants for the last stubborn pieces. Locked items carry forward untouched.
  - **Vary on the *open* axis.** Label each variant set by the decision it isolates and make the variants differ meaningfully on **that** axis — if the decision is the *interaction*, don't ship five palettes sharing one hover (the Round-1 "samey" trap). Once a sub-part is settled, vary at the level still open (whole-*page*, not hero-only).
- **5D Preview pipeline (automate — top build priority).** **A** asset-fetcher (real content from project APIs; retry/proxy-robust) · **B** theme-extractor (content→tokens, pluggable) · **C** template+injector (fill `{{IMG_x}}`/`{{token}}` with embedded assets+tokens; **verify no placeholder is left unfilled**) · **D** artifact-publisher (self-contained page → **stable URL**, fast in-place update) · **E** decision-ledger (component → chosen variant + rationale; survives long sessions; reloads on resume — **store full decisions, no char cap**: a 300-char tracker limit truncated decisions twice in the real run) · **F** component-library = **`master_components`**. **Fold A→D into ONE command** (fetch → extract → inject → publish-to-same-URL): the run's biggest friction was doing this in ~5 manual round-trips per mockup.
- **5E Preview requirements.** Self-contained (inline all CSS/JS, **embed assets as `data:` URIs** — artifact CSP blocks external requests); **real content, never lorem** (fake placeholders mislead — the "Holi poster" lesson); interactive (real hover/3D/parallax/reveals); themed light+dark unless deliberately one world; responsive + **primary-screen-tuned** (4K-first if that's primary); same URL each rebuild.
- **5F Design-quality guardrails (bake into prompts).** Avoid AI-slop tells (cyan-on-dark, purple→blue hero gradients, glassmorphism *everywhere*, Inter/Space-Grotesk default, centered-everything, `rounded-lg` on all, accent bar on every card). Commit to a direction (bold or refined, not timid-middle). Dominant + sharp accents beat even palettes; semantic colours separate from accent. Purposeful motion (transform/opacity, ease-out, no bounce). Characterful display + clean body type. State reads via **form**, not only colour. **When the owner explicitly asks for a "slop" tell (e.g. "glassy"), their words win — do it well.**
  - **Colour-budget rule (hard).** A content-derived accent is allowed on **≤ a stated few surfaces** (e.g. the poster edge, one CTA, one card) — **neutral everywhere else**; state the budget up front. Over-tinting everything with one derived colour was the #1 source of rework. **But restraint ≠ monochrome** — keep purposeful colour (stat tiles, semantic states); don't over-correct to grey.
  - **Pressure-test each variant before presenting it.** Check against *use*, not just looks: action-colour vs brand-colour (don't spend the brand hue on a Play button), **motion comfort** (heavy parallax read as "dizzy"), and contrast / a11y. Fix these *before* the variant ships, so the round isn't spent correcting an obvious default.
- **5G Anti-gaslight discipline.** On a **primary decision** (hero accent, how a core state is encoded, layout skeleton) **ask with concrete options** — never pick silently and wait to be corrected. Restate each piece of feedback before acting. Never regress a locked item. Prefer structured choices over prose. Keep a visible **locked vs open** list.

## 6. Where it plugs into the skill

- **Stage 2:** `stage-2-ui-master-plan.md` + `stage-2-components.md` gain the A→B→C method; the UI master plan (`PUT /api/projects/<slug>/ui-master-plan`) becomes the **decision-ledger** home; component-pick already pulls `master_components`.
- **Stage 4.4.6** (design-taste pre-pick): uses the same loop for per-iteration aesthetic items — options *before* build.
- **Preview:** publish each round as a **Claude Artifact** (private URL, self-contained, republished in place) — fits the in-chat show → pick → refine loop.

## 7. Real assets + theme-from-content (core differentiator — "the whole identity")

Pull real assets (e.g. movie posters via Radarr/TMDB) and **derive per-item tokens from the content itself** — each card's border colour from the poster's dominant vibrant colour (ImageMagick: quantize ~8 colours → score by saturation×value×prevalence, skip near-black/grey → boost for contrast). Result: borders that always harmonise with real artwork, impossible with fixed hues. Generalize: **derive tokens from real content where it improves cohesion.** Needs a per-project asset-source config. **In the real run this was not garnish — the poster-derived border *was* the product's identity.** Treat it as first-class: for asset-rich projects wire the fetcher + extractor early; the per-project config is the only reason it's sequenced after the core loop.

## 8. Phasing

**Phase 1 (the method):** context gate + worklist + A→B→C loop with real `master_components` variants + self-contained interactive previews on a stable URL + decision ledger + guardrails.

**Phase 2 (the identity layer — wire early for asset-rich projects):** real-asset fetcher + theme-from-content extractor + per-project asset-source config. Not optional garnish — in the real run this *was* the design's identity; deferred only because it needs the per-project asset config.

## 9. Links to Task 1 / Task 3

- `master_components` + the preview/artifact pipeline are shared system-wide.
- Good design (Task 2) **reduces** the visual issues Task 1 captures and the functional ones Task 3 checks.
- The decision-ledger's locked design spec becomes Stage 3's build input **and** the baseline Task 3 asserts against.

## 10. Open decisions — RESOLVED at lock (2026-07-23)

**Applied:** preview host = **Claude Artifacts**; scope = **design spec + preview → Stage 3** (no auto-implement); theme-extraction = **ImageMagick** (pluggable); decision-ledger = **Ottomate DB + YAML mirror**, reload on resume; library gaps = **quick-build in-loop, seed later**; per-project asset-source config = Phase 2. Original items kept below.

1. **Preview host** — Ottomate preview sandbox vs artifact service vs static host for the stable URL. *(confirm)*
2. **Theme-extraction toolchain** — ImageMagick (used in the worked example) vs a JS lib vs a colour API; keep pluggable. *lean: ImageMagick.*
3. **Decision-ledger store** — Ottomate DB (ui-master-plan + a design-decisions store) + YAML mirror. *lean: DB, reload on resume.*
4. **Per-project asset-source config** shape (phase 2).
5. **Library gaps** — when `master_components` lacks a variant: quick-build inline vs `seed-component` first.

## 11. Risks / anti-gaslighting

- Fake/placeholder assets mislead (the "Holi poster" lesson) — real content only.
- CSP: artifact sandboxes block external requests — inline everything, embed as `data:` URIs.
- Never regress a locked design item while changing an unlocked one.
- Primary decisions are asked with options, never silently picked.

## 11b. Amendment — what "interactive" means (owner ruling, 2026-07-27)

Criteria 3 and 4 require previews to be **interactive**. Panels are isolated from one another by
**declarative shadow DOM**, which is what stops one option's CSS bleeding into another — and the cost
is that `<template>` content is inert, so **JavaScript inside a panel does not run**.

**Owner ruling: accept CSS-only, and say so rather than implying more.** Hover, focus-visible, active,
transitions and state changes all work, and those cover every axis the method actually varies — shape,
colour, density, motion. **JS-driven variants are out of scope for a design round.** If one is ever
genuinely needed, the option is a per-panel iframe, which was considered and rejected here as
re-introducing the per-panel height and scrollbar problems for a case that has not arisen.

"Interactive" in criteria 3 and 4 therefore means **CSS-interactive**, and a variant that depends on
scripting to be judged is a signal the round is at the wrong rung.

## 12. Acceptance criteria (Phase 1)

1. Context gate captured before any visual.
2. Worklist decomposed; owner picks order/granularity.
3. Each round shows **2–4 real interactive variants** (`master_components` where possible); owner picks/mixes; rebuild republishes to the **same URL**; locked items carry forward.
4. Previews self-contained (inline, `data:` URIs, CSP-safe), real content, interactive, light/dark, primary-screen-tuned.
5. Decision ledger records every lock + rationale; survives the session + reloads on resume.
6. Output = an agreed design spec (tokens + per-component specs + preview URL) handed to Stage 3.
7. Anti-slop + ask-on-primary enforced.
8. Core mechanic locked **before** whole-page work; each variant set isolates one decision (vary on the *open* axis).
9. Colour-budget stated + honoured — content accent on ≤ a few surfaces, neutral elsewhere, **not** monochrome.
10. Build pipeline runs as **one command** (fetch → extract → inject → publish-same-URL); ledger stores **full** decisions (no char cap).
