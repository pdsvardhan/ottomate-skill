# Phase 4 — test-findings REMEDIATION plan (everything not fully fixed) · 2026-07-29

Fixes every finding from the cointrail test (`docs/test-runs/2026-07-28-cointrail-run1.md`) that is NOT
fully closed after Phase 0–3, plus the integration gaps surfaced when the owner asked "are the fixes done?".
Governed by §7 (build → verify with evidence + a must-fail → record → plan). **No external research is
required — every item is an internal engineering or design decision; the brainstorm outcomes are inline.**
Grouped into workstreams R1–R8, ordered by leverage (R1 makes a clean re-test possible).

Legend for the source findings' current state: **Partial / Addressed-residual / Open / Integration-gap**.

---

## R1 — Auto-wire the live loop (closes F-14's residual + the WS1.1 integration gaps) · HIGHEST LEVERAGE
Today the live grid is deployed and the interactive-variant pattern is proven, but a round does NOT
produce it automatically — I hand-wrote `variant_previews`+`banner` and hand-authored the interactive HTML.
A re-test would show the fixes' logic but a static emit. This makes it automatic.

- **R1.1 — publish-round auto-emits `variant_previews` + `banner`.** `publish-round.mjs` copies the
  per-variant HTML files it is given and writes `variant_previews:[{label,file}]` + the WS1.2 `banner` html
  into `round.json`. *(Approach: manifest carries `variant_files:[{label,path}]`; publish copies + records
  them; banner from `bannerFromComposition`.)*
  **Accept:** publishing a round with variant files yields a `round.json` the deployed RoundPicker renders as
  the live grid + banner — no hand-editing. **Must-fail:** a manifest that references a missing variant file
  is refused. **Where:** plugin.
- **R1.2 — the harness emits INTERACTIVE self-contained per-variant HTML** (not static DSD). Rewire
  `build-variant-set.mjs` (or add an emit path) to render each variant as a token-themed interactive Block
  (the `spending-variant.html` pattern) run through `inline-block.mjs`, one file per variant.
  **Accept:** running the harness on a ≥2-variant round emits N interactive files that render live in the
  grid (count-up/hover/3D actually run), each passing `ban-raw-values`. **Must-fail:** a variant that bakes a
  raw hex is blocked pre-emit. **Where:** plugin (build-variant-set). *Brainstorm: keep the DSD path as a
  fallback for pure-token/no-JS cards; interactive HTML is the default for cluster/page scope.*
- **R1.3 — design-round preview durability** — already spawned as a background task (previews dir regenerates
  at container startup, wiping `design-rounds/**`). Fix = preserve `design-rounds/**` in the regeneration OR
  store renders in a location it never clears. **Accept:** a published round's grid still serves 200 after a
  container rebuild. **Where:** app.

## R2 — Decompose robustness (closes F-4's residual)
`anatomy-derive` returns semantically-empty parts on a Tailwind/CSS-var/no-`data-role` stack (leaked JS
ternary names as "parts", a false `media-aspect` axis) yet validates PASS at "medium" confidence.

- **R2.1 — a `data-role`/`data-oid` stamping pass on cointrail's 3 panels** (transaction-history,
  top-merchants, category-breakdown) + a short stamping convention doc. Makes `decompose` read real parts
  from the live source, not a generic fallback. **Accept:** `decompose({src: CardDetail.tsx})` returns the 3
  panels + their real sub-parts from stamps, `derived:true`. **Where:** cointrail app source (small, additive).
- **R2.2 — harden `anatomy-derive`** so an empty/junk derivation is HONEST: reject className tokens that are
  JS identifiers (camelCase ternary leaks like `isCredit`), never offer `media-aspect` when there is no media
  well, and DROP confidence to "low" when the parts list is semantically empty (so the model knows to read
  source). **Accept:** on the unstamped `CardDetail.tsx`, derive reports low confidence + no false axes
  (must-fail: it must NOT return `media-aspect` or `isCredit` as parts). **Where:** plugin.

## R3 — Composition + gate reconciliation (closes F-5 + F-9) · needs the two brainstorms below
- **R3.1 — one-question-per-round (F-5).** *Brainstorm outcome:* the greedy packer merges up to 3 channels
  into one 5-axis round. Rather than always split (too many rounds) or always pack (illegible), give
  `composeRounds` a `granularity` the owner sets in the WS1.3 scope step: **`one-per-round`** (default — one
  perceptual channel per round, maximally legible) vs **`packed`** (fewer, wider rounds, explicitly chosen).
  The WS1.2 banner already enumerates a packed round's questions, so packing becomes an informed owner choice,
  not a silent default. **Accept:** default composition of 5 channels → 5 single-question rounds; `packed`
  reproduces today's behaviour; the choice is surfaced. **Must-fail:** a round claiming `one-per-round` that
  carries 2 channels is rejected. **Where:** plugin (round-composition + method-doc).
- **R3.2 — reconcile isolation control-diff ↔ divergence floor (F-9).** *Brainstorm outcome:* the two gates
  are opposed only because both are applied to every round. They serve DIFFERENT round types: **divergence**
  (variants must look different) belongs to **whole-direction** rounds; **control-diff** (only the named axis
  moves) belongs to **one-axis controlled** rounds. Fix = SELECT the gate by round type (from the WS1.3
  scope): a whole-direction round runs the divergence floor; a controlled one-axis round runs control-diff
  and the divergence floor is N/A (low divergence is the POINT). Also make the divergence vector
  layout-aware (it currently can't see 3-col vs rail vs bento). **Accept:** a controlled one-axis round passes
  without the divergence floor false-blocking; a whole-direction round still requires divergence; a
  layout-only difference registers as divergence. **Must-fail:** a whole-direction set that is actually samey
  still blocks. **Where:** plugin (computed-runner/computed-checks + the gate selector).

## R4 — Checker accuracy (closes F-7's advisory misfires)
Three advisories misfire and "a rule that misfires trains you to ignore it":
- **R4.1 — `adv-no-implementation-vocabulary`** flagged ₹428/500/403 as "HTTP status codes." Fix: only match
  bare 3-digit tokens in a code/status context, never currency-prefixed or ₹/$/€ amounts.
- **R4.2 — `adv-raw-value-drift`** flagged spacing 8/16/24px as "duplicating the radius token" purely on
  numeric coincidence. Fix: only flag when the property CLASS matches (a radius literal equal to a radius
  token), not a spacing value that happens to share a number.
- **R4.3 — `block-svg-id-collision`** fired on shared classes harmless under the shadow-DOM isolation the
  harness itself uses. Fix: scope the collision check within a shadow root, not across roots.
- **Accept:** each misfiring input now passes; a genuine instance of each still flags (must-fail per rule).
  **Where:** plugin (checks.mjs / computed-rules).

## R5 — Registry → graph (closes F-11 + F-16's structural residual) · brainstorm below
- **R5.1 — anatomy from the graph, not a fixed registry.** *Brainstorm outcome:* the fixed 3-archetype
  `component-anatomy.json` forced temp registry surgery to publish a novel component. `decompose.mjs`
  (WS1.3) + `patterns.json` (P2.3) already derive parts/sub-decisions for ANY component. Fix = let the round
  pipeline accept a **decomposed anatomy** (from `decompose`) directly, so an unregistered component's axes
  trace to its stamped/derived parts instead of a registry entry — `publish-round`'s "axis must trace to the
  anatomy" check reads the decomposition, not only the registry. Registered archetypes stay as an optional
  fast-path. **Accept:** a round publishes for an UNregistered component with no edit to
  `component-anatomy.json`. **Must-fail:** an axis that traces to NEITHER the registry nor the decomposition
  is still refused (doctrine rule 40 holds). **Where:** plugin (anatomy.mjs/publish-round + method-doc).

## R6 — Emit correctness (closes F-12)
- **R6.1 — no enum values minted as CSS custom-property values.** `emit-design-artifacts` mints
  `--…-elevation: flat-hairline` (an enum, not valid CSS). Fix: extend the `looksLikeCssValue` guard to the
  REGISTERED path too — an enum-valued decision routes to the STRUCTURAL spec (or maps enum→a real token
  value), never a raw custom property. **Accept:** emitting `elevation=flat-hairline` produces a structural
  entry, not an invalid `--x: flat-hairline`; a real CSS value (e.g. `radius=6px`) still mints a token.
  **Must-fail:** an enum reaching the token path is rejected. **Where:** plugin (emit-design-artifacts).

## R7 — Catalog-consult proof (closes standing defect D-8)
- **R7.1 — a round PROVES it consulted the catalog.** Today a variant asserts `source:{kind:'bespoke', why}`
  but never shows it checked the 116-row `master_components`. Fix: the round records the catalog query it ran
  (which mc-ids were considered for each part + why each was rejected/kept), from `catalog-source.mjs`.
  **Accept:** a published round carries a `catalog_consulted` record listing the candidates weighed; a
  bespoke source with an EMPTY consultation is flagged. **Must-fail:** `kind:'bespoke'` with no consultation
  record is rejected. **Where:** plugin (catalog-source + publish-round).

## R8 — Pipeline + docs (closes efficiency §M, F-1, F-2)
- **R8.1 — one-command end-to-end round.** `design-round.mjs` exists (gate→build→check→publish) but
  derive/compose/context/pick/lock/emit are still separate. Fix: a single `design-round` that runs
  decompose-and-ask → compose → context-gate → generate → gates → publish (grid+banner) in one invocation,
  pausing only at the genuine owner forks (scope, picks, lock). **Accept:** one command takes a target from
  "redesign X" to a published live round. **Where:** plugin.
- **R8.2 — routing doc clarity (F-1):** add the `contextGate`-overrides caveat to the `routeEntry` table so a
  doc-only reader isn't misled. **Where:** plugin doc.
- **R8.3 — plan↔built-reality reconciliation (F-2):** when `palette_dark` is null but a dark theme ships,
  the intake/onboarding (P2.4) reads the real tokens and records both schemes (the DTCG theme already carries
  them) — a check that flags a UMP field contradicting the shipped source. **Where:** plugin.

## Not remediable here
- **Session title** — `set_session_title` can't set the current session's title (harness limitation, not the
  method). Note only.

---

## Sequencing (recommended)
1. **R1** (auto-wire the live loop) — unblocks a clean end-to-end re-test. R1.1 → R1.2 → R1.3.
2. **R2** (decompose robustness) — so the re-test's decompose reads real parts.
3. **R3** (composition/gate reconciliation) — the two brainstormed gate fixes.
4. **R5** (registry→graph), **R6** (emit), **R7** (catalog proof), **R4** (checker misfires) — independent, any order.
5. **R8** (pipeline + docs) — last, ties it into one command.

## Verify + exit (§7)
Each R-item ships with a must-pass + must-fail and (where visual) a light+dark render. Then a Phase 4
completion note, and a clean cointrail re-test becomes fully end-to-end automatic.
