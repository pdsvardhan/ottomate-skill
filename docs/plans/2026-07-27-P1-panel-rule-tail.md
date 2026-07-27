# P1 — the 14 remaining panel rules

**Unit plan.** Parent: `2026-07-27-PRE-STAGE4-PLANS.md` §P1. Written before any code, per the standing rule.

## Verified live state (measured, not assumed)

| | |
|---|---|
| Plugin tree | `main`, clean, 0 unpushed, at `6d562e7` |
| Rules file | **91 rules** — `enforced` 62 · `pending` 28 · `declared-unenforceable` 1 |
| Round-scope pending | **17** — exactly P1's 14 + P2's 3 (`adv-glass-legibility`, `adv-accent-budget`, `adv-motion-behind-text`) |
| Method split | source 52 · computed 30 · gate 7 · ledger 2 — nothing unclassified |
| Suites | generation **150/150** · design-check **81/82** · isolation-gate **36/36** (own runner) · card-slots 9 · harness-dsd 7 |
| The 1 failure | `computed-checks.browser.test.mjs` — needs Playwright, which lives only on VAULT7A. **Known and expected on Windows** |
| VAULT7A | reachable; Playwright at `/opt/homeserver/ottomate/node_modules/playwright`, Chromium 1217+1223 present |

So the register's headline number is accurate. Good — this plan starts from a true baseline.

## The shape every rule must take

**Computed rules are pure functions over element records** (`computed-rules.mjs`), never over a live
DOM. That is what makes a must-fail and a must-pass case runnable in plain Node. The browser pass
(`computed-checks.js` §5) only *collects*; it makes no judgements. Adding a computed rule therefore has
**two halves**, and only doing the first is enforcement in name only:

1. the pure function + its two test cases (plain Node), and
2. the collector field it reads, populated in real Chromium.

**Source rules are `fn(source, rule, contract) -> {pass, detail}`** registered in `DETECTORS` as
`{ scope, fn }` — a bare function silently registers nothing.

## A decision this unit has to make honestly

`adv-token-adherence` specifies **ΔE2000 ≤1 pass / ≤2 warn**. The existing `deltaE` in
`computed-checks.js` is **CIE76**, and says so in its own comment ("Approximate (not CIEDE2000)").
At a tolerance of 1–2 those two metrics genuinely disagree — CIE76 over-reports difference in
saturated blues, which is exactly where a brand accent usually sits. **Implementing CIEDE2000
properly** (~35 lines, pure maths, zero dependency) is the only way to claim the rule as written.
Reusing CIE76 and calling it ΔE2000 would be a quiet false claim of the kind this register exists to
prevent. The existing CIE76 stays where it is for the coarse "same value?" gate.

## The 9 computed rules

Record fields in **bold** do not exist in the collector yet and must be added in half 2.

| Rule | Judgement | Reads | notApplicable when |
|---|---|---|---|
| `floor-not-colour-alone` | Colour carries meaning only when ≥2 cues **in the same role** differ in hue. If those cues are identical in text, icon, shape and weight, colour is the sole channel → fail | `text`, **`hasIcon`**, `color`, `backgroundColor`, `fontWeight`, `borderRadius` | <2 chromatic cues sharing a role |
| `floor-focus-ring` | outline present, ≥2px, ≥3:1 against **both** component and surface. box-shadow-only fails | **`focus:{outlineStyle,outlineWidth,outlineColor,boxShadow}`**, `backgroundColor` | no focus records collected (never a silent pass) |
| `adv-state-delta-relative` | hover ΔL 0.04–0.06, press 0.08–0.10, **direction-aware** (darken on light, lighten on dark). A hue shift >10° means a second hardcoded hex, not a lightness move | **`hover`/`active` backgroundColor**, `dark` | no state records collected |
| `adv-derivation-contrast-guarantee` | An accent surface must clear contrast against its own foreground **and** sit within the accent L band — i.e. the raw extracted pick was normalised before it was painted | `backgroundColor`, `color` | no accent-painted surface |
| `adv-density-scale` | ≥15 repeated rows: heights on the 4px step, within one band, ≥32px or flagged | `h`, `tag`, `cls` | <15 repeated rows |
| `adv-whitespace-first` | Heading space above ÷ below within 1.5–2. Inverted (below ≥ above) is the real failure | **`marginTop`/`marginBottom`**, `tag` | no headings with non-zero margins |
| `adv-body-type` | Running text ≥14px, line-height ratio 1.4–1.6 | `fontSize`, `lineHeight`, `text` | no running text |
| `adv-token-adherence` | Every computed colour within **ΔE2000 ≤2** of a declared token | `color`, `backgroundColor` + **`tokens`** | no tokens declared |
| `adv-dark-mode-type-optical` | Same role across modes: weight −10–15% **or** a GRAD move, tracking +0.01–0.02em. Identical in both modes means one is wrong | **`letterSpacing`**, `fontWeight`, `dark` | only one mode collected |

**Margin collapse** is a known limit of reading computed `marginTop`/`marginBottom`: adjacent margins
collapse, so the resolved value can overstate real space. `adv-whitespace-first` is `advise`, and its
detail line will say what it measured. Recorded here rather than discovered later.

## The 5 source rules

| Rule | Detector | Must-fail fixture | notApplicable |
|---|---|---|---|
| `adv-p3-meaning-independent` | Every `color(display-p3 …)` needs an sRGB declaration of the **same property in the same block**, before it | block whose only `color` is p3 | no p3 at all |
| `adv-bar-zero-baseline` | (a) an explicit non-zero min (`data-y-min`, `domain:[20,`, `yMin`) on a bar chart, or (b) SVG `<rect>` bars that do **not** share a bottom edge | `data-y-min="20"` | **no chart present** |
| `adv-series-cap-and-labels` | distinct series >7 fail, >5 warn; a legend with no direct labels advises | 9 series | no chart |
| `adv-encoding-channel` | precise magnitude encoded in **area or hue** (pie/donut/treemap) rather than position/length | donut with % labels | no chart |
| `adv-plain-language` | no sentence >25 words; no paragraph >5 sentences, over `visibleText()` only | a 30-word sentence | no prose |

**The four chart rules must return `notApplicable`, never a silent pass, on a variant with no chart** —
called out in the parent plan, and the single easiest way to fake coverage here. Each gets an explicit
third assertion proving it.

## Acceptance

1. Every rule flipped to `enforced` carries `enforced_by` **naming its test**, and has **both** a
   must-fail and a must-pass case. The meta-test in `design-check.test.mjs:318` already refuses an
   `enforced` claim with no detector — it caught exactly that twice last session.
2. The four chart rules additionally assert `notApplicable` on chart-free source.
3. Collector half landed and **run in real Chromium on VAULT7A**, not just asserted — otherwise the
   computed rules are enforced in Node and inert in production, which is precisely the "documented ≠
   demonstrated" failure.
4. Suites stay green: generation 150/150, design-check's only failure remains the Playwright one.
5. Register updated **in the same commit**, with the new honest count.
6. **No threshold is moved to make anything pass.** If a rule fires on our own artifacts, that is a
   finding for P3, not a reason to soften the rule.

## Expected collision, predicted in advance

`adv-derivation-contrast-guarantee` is the checker for a defect already in the register —
*`theme-extract.mjs` emits the raw extracted pick* (Medium). If the rule is right, it should fire on
our own extracted accents. **Predicting it here so that if it does fire, it is a confirmation rather
than a surprise, and if it does not, the rule is too weak.**

## Order

Source 5 first (no collector dependency, fastest to green) → computed 9 pure functions → collector
extension → VAULT7A run → rules file + register + commit.
