# Phase 0 — COMPLETION NOTE (Ottomate design-system rebuild) · 2026-07-29

Applies the governing rule (spec §7): **BUILD → VERIFY with evidence → RECORD → PLAN next**. This is the
RECORD. Every claim below was run; the must-fail cases are included because *a check that never fails is
not evidence*. Phase 1 plan: `docs/plans/2026-07-29-phase-1-plan.md`.

**Substrate built:** the design surface is reachable, a 3-tier semantic-token theming seam + a fail-closed
per-theme contrast gate + a ban-raw-values lint exist and are proven, and the owner's taste is parsed and
injected into the generator. All local suites green.

---

## 0. Parked cointrail TEST round — HANDLED (not rolled back)
The code word **"skill test done" was NOT given**, so per the manifest the parked mutations were left live
(they coexist harmlessly with Phase 0 — different target). Verified still present, via the API (ONE DOOR):
- `cointrail.spending-analysis` design-decisions **67–72, status locked** (count 6).
- `design_ledger.context` **present, profile P1**.
- preview dir `…/previews/design-rounds/cointrail/cointrail.spending-analysis/r1/` (index.html + round.json).
- server temp dir `/home/pdsv/cointrail-designtest/` intact.

Rollback + `docs/audits/2026-07-29-design-method-test-findings.md` remain **owner-gated on the code word**.
Offer stands: a clean cointrail is nicer for the pilot theme, but Phase 0 did not need it.

---

## 1. WS0.1 — Reachability & correct URL surfacing ✅
**Built:** `publish-round.mjs` now prints the **reachable tunnel URL** (`https://ottomate.vault7a.xyz/…`),
never the internal `127.0.0.1:8110` (F-13). New pure exports `publicRoundUrl` / `publicDesignUrl` /
`DEFAULT_PUBLIC_BASE`; `--public-base` overrides for LAN. API POSTs still go server-side.

**Routing identified** (corrects the stale `credentials.md` path): cloudflared config is
`/opt/homeserver/appdata/cloudflared/config.yml`; `ottomate.vault7a.xyz → http://authentik:9000` (SSO) →
the ottomate container (`127.0.0.1:8110→3000`). A project **"design-mode" route** (Phase 1) exposes the same
way: `cointrail.vault7a.xyz` already routes through authentik → the cointrail container, so a Next.js
`/design-mode` route inside that app is reachable with no new tunnel entry.

**Evidence:**
- Unit tests: `publish-round.test.mjs` **13/13** (3 new URL assertions incl. "no loopback host").
- Dry-run prints `preview: https://ottomate.vault7a.xyz/api/previews/…`.
- **Client-side reachability (from a Windows machine, i.e. the owner's browser):**
  `GET https://ottomate.vault7a.xyz/ → 200`, `GET …/previews/…/r1/index.html → 200`.
  **Control:** `GET http://127.0.0.1:8110/ → 000 (connection refused)` — the old printed URL is dead from a
  client, exactly F-13.

---

## 2. WS0.2 — Semantic-token theming seam + per-theme contrast gate ✅ (the core)
New self-contained subsystem in `skills/ottomate/scripts/theming/`.

### 2a. 3-tier DTCG theme + builder
- `cointrail.tokens.json` — cointrail's tokens as **primitive → semantic(light/dark) → (component)**,
  **grounded in the app's real `app/globals.css`** (not invented). Semantic contract: `--color-surface /
  -on-surface / -on-surface-muted / -on-surface-subtle / -surface-sunken / -surface-raised / -border /
  -action / -on-action / -chart-1..4`, plus `--radius-* --shadow-* --motion-*`.
- `build-theme.mjs` — dependency-free DTCG builder: resolves `{alias}` refs, flattens **only the semantic
  tier**, emits `[data-theme="cointrail"]` (light) + `[data-theme="cointrail"].dark` (cointrail's real
  convention). `resolvedColorMap` is shared with the gate so it checks exactly what ships.
- **Evidence:** `build-theme.test.mjs` **9/9**; emitted `cointrail.theme.css` (1.9 KB) contains both blocks;
  no primitive ever appears as a var name.

### 2b. Per-theme contrast gate — REPLACES F-8's colour budget
- `contrast-gate.mjs` — **fail-closed**, token-level, per-scheme. For each declared fg↔bg pairing it
  computes the WCAG ratio (reusing `contrast()` from `design-check/computed-rules.mjs` — one impl, not a
  fork) and enforces a floor by kind: **text 4.5 · large/ui 3**; **decorative/chart → advisory** (a subtle
  border and a data-viz swatch are not text — gating them fail-closed is the F-7 misfire trap).
- **Why token-level, not DOM-level** *(named deviation, GOOD):* the old budget needed Chromium and still
  mis-read cool slate as accents. The pairings a system *promises* are knowable from tokens alone, so the
  gate runs in plain Node with a real must-pass/must-fail and no browser.
- **Evidence — must-pass AND must-fail:**
  - `contrast-gate.mjs --theme cointrail.tokens.json` → **PASS, exit 0**. Every text/UI pairing clears its
    floor in light **and** dark (on-surface 17.85:1, muted 7.58:1, subtle 4.76:1, action 6.7:1, …). The 4
    category hues + cool-neutral slate — **the exact combination F-8 falsely blocked** — now pass; the subtle
    border (1.23:1) and lighter swatches surface as *advisories*, correctly.
  - `--theme _fixtures/broken-theme.tokens.json` → **BLOCK, exit 1**: invisible on-surface (1.2:1) in light
    is caught and **named by scheme**; the fine dark scheme is not blamed.
  - `contrast-gate.test.mjs` **6/6** (incl. must-pass, must-fail, missing-token-fails, advisory-never-blocks).

### 2c. One real Block refactored to read ONLY semantic tokens — rendered light + dark
- `blocks/category-breakdown.block.css` — a real cointrail spending-analysis panel; every colour/radius/
  shadow/motion value is `var(--…)`. Taste-aware: `--shadow-card` depth, hover-lift, bars that grow in,
  count-up total, `prefers-reduced-motion` graceful reduction. `data-role`/`data-oid` stamped (Pillar E / F-4).
- `blocks/category-breakdown.html` — render harness; links the theme sheet + block css (one source, no
  drift); **synthetic Indian finance data** (PII hygiene); `?dark=1` toggles the scheme, `?still=1` = settled
  capture.
- **Evidence:** rendered in **real headless Chromium on VAULT7A**, both schemes (screenshots delivered):
  the same token-only Block re-themes entirely from the `[data-theme].dark` sheet, and both are legible —
  matching the gate's PASS. (The count-up is live; a `?still=1` mode was added because rAF is throttled
  under headless `--virtual-time-budget` — a *harness* quirk, not a Block defect; the bars' CSS transitions
  completed fine.)

### 2d. Ban-raw-values lint
- `ban-raw-values.mjs` — flags a Block/Part that hard-codes a contract value: **HARD (fail-closed)** = raw
  colour (hex/rgb/hsl/named), raw easing (cubic-bezier/keyword, timing context only), hard-coded radius/
  shadow; **ADVISORY** = raw px spacing (no spacing-scale token yet — flagging it fail-closed would
  false-fail every real Block). Scans declaration *values* only; `var(--…)` is the allowed shape.
- **Evidence — must-pass AND must-fail:**
  - clean Block → **PASS, exit 0** (0 blocking, 19 advisory spacing).
  - injected-raws copy (`_fixtures/…DIRTY.css`: raw hex + `ease-in-out` + `18px` radius) → **BLOCK, exit 1**,
    3 blocking findings named by line + category.
  - `ban-raw-values.test.mjs` **8/8** (incl. selector-not-value, timing-context-only, hairline allowlist).

---

## 3. WS0.3 — Taste profile captured + wired ✅
- `taste-packet.mjs` — parses `references/taste-profile.md` into the generator's grounding signal
  (one-line DNA, `motionBudget=expressive`, loves, avoid, `wantedTells`) and provides the **anti-slop tier
  flip**: `antiSlopTierFor(tell, baseTier, taste)` downgrades a *wanted* aesthetic tell to `'advisory'`.
- Wired into `buildRoundInput` (`method-routing.mjs`): the round packet now carries a compact `taste` block
  when supplied, `null` otherwise (never invented). Method doc `stage-2-generation.md` updated (input #8).
  `/taste` manual-update flow stubbed in the taste profile.
- **Evidence:**
  - `taste-packet.test.mjs` **6/6**; `method-routing.test.mjs` **10/10** (incl. packet-carries-taste).
  - Dry-run: the packet shows `motionBudget: expressive`, `delight: true`, `antiSlopAdvisory: true`, loves.
  - **The flip WITH a control:** glow / gradient-text / glassmorphism / parallax / bounce → **advisory** for
    this owner; **neumorphism (not wanted) STAYS `block_owner`**, and with **no taste** every tell stays
    blocking. A flip that flipped everything unconditionally would not be evidence.
  - **Floors are never flipped:** the contrast gate, `prefers-reduced-motion` and feasibility are not
    doctrine tells and are never passed to the flip — taste raises the aesthetic ceiling, never the floor.

---

## 4. Test totals (all local, this session)
| suite | result |
|---|---|
| `theming/*` (build-theme 9, contrast-gate 6, ban-raw-values 8) | **23/23** |
| `generation/*` (incl. publish-round 13, taste-packet 6, method-routing 10) | **306/306** |
| `design-check/*` sanity (checks, computed-rules, scheme-check) | **19/19** |

No regressions from the `publish-round.mjs` / `method-routing.mjs` edits.

---

## 5. What is NOT done (named gaps — not hidden)
1. **Gate/lint not yet WIRED into the enforced publish pipeline.** The contrast gate and lint EXIST and are
   proven standalone, but `publish-round.mjs` / `computed-runner` still enforce the old `colourBudget`
   (F-8). *Retiring colourBudget and calling `contrastGate` as the fail-closed publish gate (and running
   `ban-raw-values` pre-publish) is a bounded wiring task* — first item of Phase 1 (§ "0. Wiring").
2. **The theming seam covers ONE theme (cointrail) and ONE Block.** Other projects' tokens + refactoring
   more Blocks to semantic-only is Phase 3 (catalog) work; Phase 0 proved the seam on the pilot.
3. **The generator READS taste but no live round was regenerated** with it — the cointrail
   spending-analysis re-run is Phase 1's payoff (it needs the live preview to be judged).
4. **`/taste` is a doc stub**, not an app UI/slash-command (Phase 2+).
5. **Project "design-mode" route** is *identified* (routing above) but not built — Phase 1.
6. **`normalize` skill integration:** the lint is a standalone script; folding it into the `normalize`
   skill's flow is deferred (the script is the substance; the skill wrapper is packaging).

## 6. Deviations (good-vs-bad, named)
- **GOOD:** contrast gate is token-level (Node, no browser) with a real must-fail — a deliberate, stronger
  choice than literally "run the existing DOM check per theme"; reuses the shared `contrast()` maths.
- **GOOD:** decorative/chart pairings advisory; raw spacing px advisory — avoids the F-7 "misfire trains you
  to ignore it" failure mode. Enforce the contract (colour/radius/shadow/motion) hard; flag the rest.
- **GOOD:** `?still=1` render mode added to sidestep a headless virtual-time rAF quirk — the Block's motion
  is genuinely live; the mode is a screenshot convenience, and it's documented as such.
- **NEUTRAL:** the DIRTY.css / broken-theme.tokens.json fixtures are kept (like Track B's must-fail
  fixtures) as living evidence of the gates' teeth.
