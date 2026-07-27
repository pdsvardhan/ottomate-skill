# Stage 2 Design Method — the A→B→C visual loop (Task 2, 2026-07-23)

> The engine that turns vague intent into a locked, distinctive, **owned** design by **extracting
> taste through selection, not description.** Owns the *method*; `stage-2-ui-master-plan.md` and
> `stage-2-components.md` own the *state* (what's persisted). This file is loaded whenever Stage 2
> reaches the visual work, and again at the Stage-4.4.6 taste gate.
>
> **Preview host = the Ottomate app itself** — `/projects/<slug>/design/<target>` (owner decision,
> 2026-07-27). ⛔ The Claude-Artifact host is **retired**: a round's self-contained page is written to
> the previews volume and served by `/api/previews`, and the per-sub-decision picks are made on the
> same screen, writing straight to the `design_decisions` ledger. Publish with
> `scripts/generation/publish-round.mjs`.

## Why this exists

Designing UI by prose fails both ways: AI-generated UI is generic slop (cream-and-serif, centred
everything, glassmorphism everywhere), and non-designers **can't specify visuals in words** — they
know it when they *see* it. The current pick-from-`master_components` flow has previews but no
**method**: a fast visual loop that shows real, interactive, genuinely-distinct options, lets the
owner pick/mix, and converges on a locked spec. This adds that method.

**Proven (Screenroom, 2026-07-22/23):** a non-designer's "vibrant, glassy, away from gold-on-charcoal,
love 3D cards" converged to a precise owned design in ~two dozen quick rounds — far better than any
single-shot generation. The failure modes were all **colour discipline** and **varying the wrong
axis/level** — both cheap to fix with the rules below (retrospective folded into §4/§6/§7).

> ## ⚠ BUILD STATUS — last updated 2026-07-23 (post variant-harness). Still **ITERATE**, not APPROVE.
> **Live and proven:** the one-command pipeline (fetch → extract → inject → emit, ~0.2s, with a
> placeholder guard that really fires), machine-derived theme-from-content tokens, self-contained
> CSP-safe previews with real content + light/dark, the colour-budget honoured in code, and the
> **uncapped** decision ledger (834-char rationale round-tripped).
>
> **NEW — the central gap is closed.** `scripts/preview-build/build-variant-set.mjs` emits **N labelled
> variants on one named axis from one command**, and `isolation-gate.mjs` (G1 §4.3, executable) **refuses
> to emit a set it has not proven** — axis-diff, control-diff, blind-sort, count-by-rung, neutral labels,
> and a structural fingerprint for structural axes. Verified: 20/20 gate tests green (the pass case + every
> failure mode G1 §6 names); a real 3-variant density round built from **12 real posters** in 0.87s and
> published to the stable URL; a deliberately "samey" set was **rejected, wrote nothing, exit 2**.
> Core-loop rule 2 and decision D2 are now mechanical, not prose.
>
> **Doctrine ingested.** `references/design-doctrine.md` (durable cited rules, injected every round),
> `data/design-rules.json` (machine-readable, three enforcement tiers), `data/design-rubric.md`
> (G2's 4×25 with hard-gate overrides). Raw corpus in `docs/research/`, on demand only.
>
> **STILL NOT BUILT — do not claim these:**
> - **The constraint checker does not exist.** Every rule in `data/design-rules.json` is
>   `status:"pending"`. `must_use` / `animation_vocab` / `forbidden` / `source_policy` / colour-budget
>   are specified and **enforce nothing today**. The variant panels have `constraints_honoured` and
>   `rubric` slots that are still `null`. This is the next build item and the owner's #1 trust problem.
> - **Rounds do not run in a fresh sub-agent**, and there is no `rejected[]` — the long-session
>   degradation fix is designed but unbuilt.
> - **The ledger is still one JSON blob** — not per-target, no `proposed→in-review→locked` state machine,
>   no snapshot per lock, so **the golden-file regression gate has nothing to diff against**.
> - **Scope × entry-point routing is prose** — a `component` scope does not yet mechanically select rungs.
> - **No real design session has been run.** The live ledger is a seeded demonstration: foundation
>   tokens are all NULL and only 2 of 4 worklist items have decisions. It proves the plumbing, not
>   the method.
> - **Reload-on-resume and the Stage 3 handoff are unwired** (see `stage-2-ui-master-plan.md`);
>   Stage 3's own references never read the ledger. There is **no YAML mirror** despite an earlier claim.
> - **The context gate and anti-slop rules are prose-only** — not in SKILL.md's HARD gate list, not in
>   `anti-gaslight-rules.md`, not in `sanity-check.md`. Nothing mechanically enforces them.
> - **The asset-fetcher is local-path only** — not the "project APIs, retry/proxy-robust" of §5D-A.
> - **Known pre-existing tell:** `template.card-wall.html`'s `.sr-stat::before` is a coloured 3px left
>   strip — F2 §5.5 names that the single most reliable AI tell (doctrine rule 27). Not yet fixed.

## The core loop (non-negotiables)

1. **Show, don't tell** — build a small real thing and let them look; never "here's a description, ok?".
2. **Options, not one answer** — 2–4 genuinely different; the owner **picks or mixes** ("1A's meta + 2C's button").
3. **Real + CSS-interactive** *(bound clarified 2026-07-27, spec §11b)* — hover, focus-visible, active
   and transitions all work; **JavaScript inside a panel does NOT run** (declarative shadow DOM content
   is inert, which is the same property that keeps panels isolated). A variant that needs scripting to
   be judged is a signal the round is at the wrong rung.
3b. **Real + interactive** — real content, real hover/motion (they are often choosing the *interaction*); respect `prefers-reduced-motion`.
4. **One evolving preview** — every round lands at its own stable in-app URL,
   `/projects/<slug>/design/<target>?round=N` (not a tab graveyard; earlier rounds stay addressable).
5. **Precise reaction → precise rebuild** — restate what you understood (anti-gaslight), change exactly that, keep what they liked.
6. **Lock explicitly** — mark approved items locked; carry them forward untouched; never silently revisit.

## Step 1 — Context gate (mandatory; do NOT proceed to visuals without it)

Acquire, up front (short structured interview or a saved project profile):
- **audience** · **use-cases** · **brand-tone** · **primary screen** (e.g. "owner on a 27″ 4K first,
  family on laptops second" → tune density + layout for 4K first).

Code tells you *what* was built, not *who it's for* or *how it should feel*. Persist to the design
ledger's `context` block (`stage-2-ui-master-plan.md` → `design_ledger`). Missing context = STOP.

## Step 2 — Worklist decomposition

Break the target into components by **how much the eye drives them**, and let the owner pick
**order + granularity** (one component per round vs a cluster):
- **their call** — cards, grids, hero, tables, filter bars, buttons (pure taste — always show variants).
- **propose–react** — empty/loading states, dialogs, dashboards (propose, they react).
- **you-drive-approve-once** — foundation tokens: colour ramp, type scale, spacing/radius, large-display
  layout. Can be set *implicitly under* the first visual surface.

Persist the worklist + chosen order to the ledger.

## Step 3 — The fidelity ladder (broad → specific; the ordering IS the method)

- **A — Directions / style-boards.** 3–5 whole-vibe options: a named palette (4–6 hex) + type voice +
  mood + **one hero sample**. Owner picks 2–3 to pursue. *Vary on the open axis:* if the decision is the
  *interaction*, don't ship five palettes that share one hover (the Round-1 "samey" trap).
- **A½ — Core mechanic (before any per-component work).** Take the ONE mechanic that defines the
  product's spine — its signature state/interaction — and iterate *that* in depth first. (Screenroom:
  the ownership indicator → "border colour from the poster, state = border behaviour, coral = action
  only" — that single decision produced the whole system.) **Nailing it early makes everything
  downstream cohere; jumping to whole pages before it's locked causes churn.**
- **B — Component showcase.** For each worklist component, 2–4 **real, interactive variants** side by
  side, **tagged by source**; owner picks/mixes per component. **Most decisions land here.**
  - **Library-first, NOT library-only (owner ruling 2026-07-23).** Check `master_components` first
    (SKILL.md operating rule 12) and use a catalog entry **where it genuinely fits the direction** — tagged by its id
    (`mc-border-beam`, `mc-shine-border`, …) so provenance is auditable. But the catalog is **not
    complete and not right for every theme**: when nothing in it suits the chosen direction, **author a
    bespoke variant freely** and tag it `bespoke`. Never bend the design to what the library happens to
    contain — that inverts the whole method (taste drives the pick; the library is a shortcut, not a
    constraint). A variant set may freely mix catalog and bespoke entries.
  - Worth seeding back: if a bespoke variant gets picked and is reusable, offer `seed-component` after
    the round — that is how the catalog grows to fit real taste instead of constraining it.
- **C — Clusters → whole-page → micro.** Assemble the locked pieces into **full screens with live
  interactions at real density on the target screen**; then whole-*page* style variants; then
  micro-variants for the last stubborn pieces. **Once a sub-part is settled, vary at the level still
  open** (whole-page, not hero-only). Locked items carry forward untouched.

## Step 4 — Preview pipeline (ONE command — the top friction to remove)

The real run's biggest cost was doing this in ~5 manual round-trips per mockup. Fold fetch → extract →
inject → publish-to-same-URL into **one command** (`scripts/preview-build/`):

- **A asset-fetcher** — real content from the project's source (retry/proxy-robust).
- **B theme-extractor** — content → tokens (ImageMagick dominant-colour; pluggable). See §6.
- **C template + injector** — fill `{{IMG_x}}` / `{{token}}` with **embedded assets (data: URIs)** +
  tokens; **verify NO placeholder is left unfilled** before emitting.
- **D round-publisher** — self-contained page → the **previews volume**, served at
  `/api/previews/design-rounds/<slug>/<target>/r<N>/index.html` and framed by the app's design route.
  `scripts/generation/publish-round.mjs` copies the file **and** POSTs one `proposed` decision per
  sub-decision (backup-first, ONE DOOR). ⛔ *Was:* the Claude Artifact tool — retired 2026-07-27.
- **E decision-ledger** — component → chosen variant + rationale; **store FULL decisions, no char cap**
  (a 300-char tracker limit truncated decisions twice — that limit is on todo titles; the ledger lives
  as JSON on `ui_master_plans.design_ledger`, never as a todo). Survives long sessions. **Reload is NOT automatic** — the session-start path does not fetch the plan, so explicitly `GET /api/projects/<slug>/ui-master-plan` when resuming design work.
- **F component library** = `master_components` (the existing catalog) — a **source of shortcuts, not a
  constraint**; bespoke variants are first-class when the catalog doesn't fit (see Step B).

## Step 5 — Preview requirements

Self-contained (inline all CSS/JS, **embed assets as `data:` URIs** — the artifact CSP blocks external
requests); **real content, never lorem** (a fake rainbow poster read as "Holi on a card" and had to be
redone — realism matters); interactive (real hover/3D/parallax/reveals); themed **light + dark** unless
deliberately one world; responsive + **primary-screen-tuned** (4K-first if that's primary); **same URL**
each rebuild.

## Step 6 — Design-quality guardrails (bake into every variant)

- **Avoid AI-slop tells:** cyan-on-dark, purple→blue hero gradients, glassmorphism *everywhere*,
  Inter/Space-Grotesk default, centred-everything, `rounded-lg` on all, an accent bar on every card.
  Commit to a direction (bold OR refined, not timid-middle). Characterful display + clean body type.
  State reads via **form**, not only colour. **When the owner explicitly asks for a "slop" tell
  (e.g. "glassy"), their words win — do it well.**
- **Colour-budget rule (HARD).** A content-derived accent is allowed on **≤ a stated few surfaces**
  (e.g. the poster edge, one CTA, one card) — **neutral everywhere else**; state the budget up front.
  Over-tinting everything with one derived colour was the #1 source of rework. **But restraint ≠
  monochrome** — keep purposeful colour (stat tiles, semantic states); don't over-correct to grey.
- **Vary on the open axis.** Label each variant set by the decision it isolates; make the variants
  differ meaningfully on **that** axis (interaction vs palette vs layout).
- **Pressure-test each variant BEFORE presenting it.** Check against *use*, not just looks:
  action-colour vs brand-colour (don't spend the brand hue on a Play button), **motion comfort**
  (heavy parallax reads as "dizzy"), contrast / a11y. Fix these *before* the variant ships, so the
  round isn't spent correcting an obvious default — **propose the sensible default, don't surface it
  as a mistake to be caught.**

## Step 7 — Anti-gaslight discipline

- On a **primary decision** (hero accent, how a core state is encoded, layout skeleton) **ask with
  concrete options** — never pick silently and wait to be corrected ("if anything's primary, ask,
  don't make me catch it"). Prefer structured `AskUserQuestion` choices over prose.
- **Restate each piece of feedback** before acting on it.
- **Never regress a locked item** while changing an unlocked one.
- Keep a visible **locked vs open** list each round so both sides know what's fixed.

## Step 8 — Theme-from-content (the core differentiator — "the whole identity")

Pull real assets (e.g. movie posters) and **derive per-item tokens from the content itself** — each
card's border from the poster's dominant vibrant colour. Result: borders that always harmonise with
real artwork, impossible with fixed hues. **In the real run this was not garnish — the poster-derived
border WAS the product's identity.** Treat it as first-class: for asset-rich projects wire the
fetcher + extractor early. Generalise: **derive tokens from real content wherever it improves
cohesion.** Extractor recipe + `scripts/preview-build/` in §4 · `stage-2-components.md` "Theme-from-content".

## Output — the handoff to Stage 3

An agreed **design spec** (foundation tokens + per-component specs, each naming its `master_components`
source + chosen variant + rationale + any mix) **+ the preview Artifact URL**, recorded in the ledger.
Design and implementation stay separate — Stage 3 builds from this spec; it does NOT redesign. The
locked spec is also the baseline the Task-3 feature verifier asserts against.

## Where it plugs in

- **Stage 2:** `stage-2-ui-master-plan.md` (the ledger home + foundation lock) → this method → then
  `stage-2-components.md` component-pick pulls the picked `master_components` per the ladder's Step-B/C
  decisions. The UI master plan is saved BEFORE component picking (existing gate, unchanged).
- **Stage 4.4.6** (design-taste pre-pick): runs this same loop for per-iteration aesthetic items —
  options (real interactive variants) *before* build. Upgrades the existing "2–3 swatches via
  AskUserQuestion" to the full A→B→C loop when the item warrants it (a cheap item can still stay
  swatch-level; a whole-surface restyle uses the ladder).

## Anti-gaslight fit

Taste is extracted by **selection against something real on screen**, never by prose the owner has to
adjudicate. The ledger's full (uncapped) decisions + locked/open list are the audit trail; primary
decisions are always asked with options; locked items never regress. Real content only (no lorem, no
fake posters). The colour-budget + vary-on-open-axis rules are the two guardrails that removed nearly
all the real run's rework.
