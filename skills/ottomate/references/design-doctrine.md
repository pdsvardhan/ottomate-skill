# Design doctrine — the durable rules every design round runs on

> **Load this at the START of every design round**, into the round's fresh sub-agent, together with the
> project's ledger `context` + `constraints` + `rejected[]`. It is deliberately short and must **stay**
> short — a doctrine that grows into a textbook recreates the long-session degradation it exists to
> prevent. Detail lives in `docs/research/` and is pulled **only** when a round opens that axis.
>
> **Owns:** the principles a generator must know. **Does not own:** the mechanical gate
> (`data/design-rules.json`, executed by code, never read by a model) or the score
> (`data/design-rubric.md`). Method/flow lives in `stage-2-design-method.md`.

## Provenance & honesty policy

Distilled 2026-07-23 from the owner's research corpus, kept verbatim in `docs/research/`. Every rule
cites its track + section. The corpus separates `[CITED]` (measured) from `[REASONED]` (synthesised
from established principle) — **that distinction is preserved here and must not be laundered.** A
`[REASONED]` rule is a good default, not a fact; if it fights reality in a real round, reality wins and
the rule gets amended with a note.

Tracks read so far: **G1** variant generation · **G2** critique & evaluation · **G3** taste elicitation ·
**F2** distinctiveness/anti-generic. Foundation tracks (A5 a11y, A1 colour, B1 motion, A3 layout,
H2 feasibility) arrive with the constraint checker. The remaining 13 are on-demand only.

---

## 1. Generation — how options are made (G1)

1. **Diverge in parallel, never in series.** Build a decision's alternatives side by side and take
   feedback on the *set*; do not refine one design and ask "better?". Parallel beat serial on ad CTR
   (445 vs 398/M), expert rating (24.4 vs 21.7/50) and designer self-efficacy (+2.5 vs +0.4) at equal
   time and feedback. `[CITED — G1 §3.1, Dow et al. 2010 TOCHI]`
2. **One axis per set.** A variant set isolates **exactly one** decision axis and holds every other
   variable constant. Two things moving at once makes the pick uninterpretable and the resulting lock a
   lie. `[G1 §3.2, §4.3]`
3. **Never show a set you have not proven differs.** Two diffs plus a sort, run *before* display:
   **axis diff** (the named axis parameter provably differs across every pair) · **control diff** (every
   non-axis variable is token-identical) · **blind-sort** (each variant's level on the axis is stateable
   without ambiguity — "this is the compact one"). Any failure = regenerate, do not present.
   `[G1 §3.3, §4.3 — the direct fix for the owner's observed "variants felt identical"]`
4. **Count: 3 by default.** `2` = genuinely binary axis or a late confirm · **`3` = default** (two poles
   + a middle reveals the gradient) · `4–5` = only wide/early/foundational axes at low fidelity ·
   `6+` = never. **Count falls as fidelity rises** (5 → 3 → 2). If you cannot make N genuinely
   different-on-axis, **lower N** — three real differences beat five with two duplicates.
   `[G1 §3.4/§4.4 + G3 §3.2 agree; Hick–Hyman grounds the shape, the exact numbers are [REASONED]]`
5. **Diverge low, converge high.** Six rungs — **direction → mechanic → component → cluster → page →
   micro**. Explore cheaply where discarding is cheap; commit expensively to few. Each rung's winner
   becomes the next rung's **frozen constant**. `[G1 §3.5/§4.5 — [REASONED] synthesis of Buxton's
   design funnel + Double Diamond]`
6. **Sequence by blast radius; parents before children.** Default order: direction → layout/structure →
   density → type → colour/material → component pattern → component styling → micro-interaction/motion →
   copy. **Never lock an axis before every axis it depends on is locked.** Locking a child first is the
   structural cause of "an early choice invalidated a locked later one". `[G1 §3.6/§4.6 — [REASONED];
   the *rule* is invariant, the *specific order* is a sensible default a brand-led product may reorder]`
7. **Functionally identical, stylistically distinct.** Hold content and function constant across the set
   so the pick judges the axis, not the data. `[CITED — G1 §3.7, Tohidi & Buxton 2006 CHI]`
8. **Never show one option.** Shown a single design people give inflated ratings and **never reject it**
   (0/12); shown alternatives they rate honestly and do reject (3/12). One option is not a choice, it
   manufactures false consensus. `[CITED — G1 §3.8, Tohidi & Buxton 2006]`
9. **Mix only across orthogonal axes.** Merging the best of several beat picking the single best
   (**70% vs 56%** usability gain). But two levels of the *same* axis cannot blend — reject that and
   offer **a third point between them** instead. A mix is a **new candidate**: verify coherence and
   re-show it once before locking. `[CITED merge result (Nielsen/Faber) + [REASONED] extension to
   automated axis-mixing — G1 §3.9/§4.7]`
10. **Don't reveal a polished hero early.** Design fixation anchors people to a shown example's form
    *and its flaws* — in professionals as much as students. Keep early rungs rough.
    `[CITED — G1 §3.14, Jansson & Smith 1991]`

## 2. Elicitation & the record (G3)

11. **Selection beats description — always render, never ask them to describe.** Stated liking explains
    at best a quarter to a third of the variance in what actually works (r = 0.44 / 0.53). Reserve free
    text for the residual that genuinely cannot be shown: brand name, forbidden colours, legal
    constraints. `[CITED — G3 §3.1, Nielsen & Levy 1994 via NN/g]`
12. **Neutral labels only.** A / B / C or plain numbers — never "the modern one" vs "the classic one".
    Value-laden wording on an identical underlying question produced a **37-point swing** in agreement.
    `[CITED — G3 §3.4, YouGov]`
13. **Never pre-highlight a "recommended" option in a taste choice.** A disclosed-as-arbitrary anchor
    still moved estimates ~25% → ~45%; a highlighted default works the same way.
    `[CITED — G3 §3.5, Tversky & Kahneman 1974]`
    **Note:** this is the one place the skill's usual "recommend first + label (Recommended)" house style
    is **suspended** — it applies to *taste* choices only, not to engineering or process questions.
14. **Randomise slot order on every presentation.** Items shown first are evaluated more favourably
    independent of content. `[CITED primacy — G3 §3.6.]` G1's additional *centre*-bias claim is
    **[REASONED, unverified]** and G3 declines to corroborate it — randomising handles both anyway.
15. **Record the concrete value, never the description.** `radius.md = 8px (--radius-md)`, not "the
    rounder one". Descriptions decay across a session boundary; a token reference replays with zero
    interpretation loss. `[G3 §3.10, ADR discipline]`
16. **Record rejections with the same rigour as picks**, each with a one-line why tied to an
    **observable reaction** ("picked B over A unprompted"), never an inferred trait ("prefers
    minimalism"). In the choice-blindness paradigm people confidently justified choices they had not
    made. `[CITED — G3 §3.11, Johansson/Hall/Sikström]`
17. **Lock is binary, explicit and earned.** Provisional on first pick; `locked` only on an explicit
    confirm **or** after surviving one full re-exposure unchanged. `[G3 §3.12]`
18. **Unlocking is harder than locking.** Protecting committed work is the default-friction action;
    reopening it deserves a confirm step. `[G3 §3.13]`
19. **Restate the concrete interpretation and get a confirm before acting** — and again before
    propagating it beyond the exact surface it was tested on. "You liked rounded corners on the button,
    so I rounded everything" is a **separate** decision, not a free inference. `[G3 §3.14]`
20. **Contradictions are an intensity axis, not a dispute.** "More minimal" + "more expressive" about the
    same thing are two points on one un-named axis. Name the axis, generate 3 points, let a new
    *selection* resolve it. `[G3 §3.9]`
21. **Session recap, not re-derivation.** A resumed session reads the ledger and surfaces "here's what's
    locked" — it never silently resumes and never re-asks an answered question. Insert a recap roughly
    every **5–8** consecutive decisions. `[G3 §3.8 — soft budget; the decision-fatigue evidence is
    contested (ego depletion failed a 23-lab replication), so treat as directional, never a hard gate]`

## 3. Distinctiveness (F2)

22. **Slop is the absence of a decision, not the presence of a bad one.** With nothing chosen, a model
    falls to the statistical centre of its training data. The fix is procedural: **make and record one
    aesthetic commitment before styling anything**, then hold it everywhere. `[F2 §3.1]`
    **Corollary (resolves the owner-override rule):** an explicitly requested "slop" tell — "make it
    glassy" — *is* a decision, so it is exempt from the templated tax and recorded in the ledger as a
    deliberate choice. Their words win; execute it well.
23. **Homogenisation is real and predates AI.** 227,000+ screenshots / ~10,000 sites (2003–2019): peak
    diversity ~2008–2010, then sharp convergence (~44% drop in layout-similarity distance 2010–2019)
    driven by Bootstrap/WordPress/SEO. Models trained on that corpus re-emit the mean.
    `[CITED — F2 §3.2, Goree et al. CHI 2021 — the strongest hard evidence in the track]`
24. **The accent hue is the highest-signal tell — derive it, don't default it.** Stock Tailwind indigo
    `#6366F1` became "the model's idea of a button". Derive the accent from content, or at minimum
    rotate out of the **240–280°** hue band. `[F2 §3.4]` — **this is the direct external validation of
    theme-from-content**: our poster-derived accent scores 0 on both accent rows of the templated tax.
25. **Commit hard in ONE place; keep the rest quiet.** The escape is not "be weird everywhere" (that
    breaks usability) — it is one bold move surrounded by disciplined, conventional structure.
    Distinctiveness is **concentrated, not smeared**. `[F2 §3.5 — taste-flagged, widely echoed]`
    This is the same shape as our existing **colour-budget rule**, independently arrived at.
26. **Cap the palette and force a dominant** — 60/30/10, extend via tints/shades, semantic colours kept
    separate, and no pure `#fff`/`#000` grounds (tint the neutral). `[F2 §3.6]`
27. **Separate surfaces with space → tone (3–5% L shift) → elevation. Border last.** The flat 1px grey
    border on every card and the coloured 3–4px left strip are named among the most reliable AI tells.
    `[F2 §3.9]`
28. **Break the equal-card grid.** "Exactly three cards in a row" and the default bento are reflexes;
    deliberate asymmetry (60/40, one 2× feature, off-axis anchor) is the cheapest de-genericiser that
    costs no usability **provided reading order stays linear**. `[F2 §3.8]`
29. **Reference a real material, not "modern".** Riso grain, letterpress deboss, matte enamel, blueprint
    linework, newsprint, ceramic — a *named* material forces non-default shadows, textures and edges.
    `[F2 §3.11]`
30. **Beware the escape treadmill.** Today's escape is tomorrow's tell: Space Grotesk, the single
    serif-italic accent word, bento grids and Geist were 2023 escapes and are 2026 tells. **Never
    hard-code a permanent "non-generic" allowlist** — the cliché catalogue in `data/design-rules.json`
    carries a `baselined` date and needs re-checking roughly quarterly. `[F2 §3.14]`
31. **Distinctiveness ≠ novelty.** The target is *specific to this content*, not maximally strange —
    unearned strangeness is just a different generic. **The test is fit, not distance.** `[F2 §3.15]`
32. **Every escape move must survive accessibility.** Distinctiveness that fails contrast, removes focus
    states, or ships undesigned empty/error states isn't distinctive, it's broken. `[F2 §3.12]`

## 4. Quality (G2)

33. **Evaluate the rendered pixels, not the markup.** Every "look at the screen" check means render the
    artifact and read the image; reasoning from source re-triggers the curse of knowledge the check
    exists to route around. `[G2 §4.6]`
34. **Score before showing** — 4 dimensions × 25: Hierarchy · Consistency · Legibility · Craft. Bands:
    90–100 Ship · 75–89 Ship-with-punch-list · 50–74 Revise · <50 Rebuild. Full rubric in
    `data/design-rubric.md`. `[G2 §4.6]`
35. **Do not average past a catastrophe.** Any single dimension < 10/25 caps the band at *Revise*
    regardless of total; a hierarchy critical-fail caps it at *Rebuild*. Check the floor before trusting
    the total. `[G2 §4.6]`
36. **State the band explicitly before presenting anything.** Never present a variant as done implicitly.
    `[G2 §7]`
37. **Never claim "user-tested" or "validated" for a same-agent vision-proxy check.** A 5-second or
    first-click test done by the agent is a proxy and must be labelled one. `[G2 §7]` — the same
    anti-gaslight rule the code verifier and feature verifier already run under.

---

## 5. Enforcement tiers (owner ruling 2026-07-23)

Three tiers. The distinction is load-bearing: **the owner's own constraints are absolute; the research
is advice with a small hard floor.**

| Tier | What's in it | On violation |
|---|---|---|
| **BLOCK — owner constraints** | `must_use` · `animation_vocab` · `forbidden` · `source_policy` · `colour_budget`, and doctrine rules 2/3/4/8 (the isolation gate + never-show-one) | **Regenerate. Never presented.** Fail closed, same principle as the Task-3 verifier. |
| **BLOCK — hard doctrine floor** | Text contrast < 4.5:1 (large 3:1) · `prefers-reduced-motion` not honoured · interactive target < 24px · meaning carried by colour alone | **Regenerate.** Deliberately tiny — these are the four an owner should never have to spend a round catching. |
| **ADVISE — everything else** | All remaining doctrine, the G2 rubric score + band, the F2 templated tax | **Computed, annotated on the variant, shown.** A *Rebuild* band triggers **one** automatic regeneration; if it still bands Rebuild it is shown with the score visible. |

**Contrast standard:** hard gate = **WCAG 2.1 AA (4.5:1 / 3:1)** — stable, computable, no licence
question. F2 §3.12's **APCA `Lc` ≥ 75/45/30** is computed as an *advisory* score alongside; it is a
**draft** standard with an unconfirmed embedding licence (flagged in the corpus index), so it does not
gate. Revisit if APCA lands in WCAG 3.

**Owner override outranks all three tiers** — an explicit instruction is a decision (rule 22), recorded
in the ledger with its rationale, and exempt from the tax it would otherwise incur.

## 6. Arbitrated conflicts (the register)

| Conflict | Resolution | Basis |
|---|---|---|
| ChatGPT report: "avoid `data:` URIs and inline `<style>`/`<script>` under strict CSP" vs the entire Cowork set + our working pipeline | **Cowork wins.** Inline + `data:` URIs are *observed* working in the Claude Artifact sandbox (640 KB self-contained page renders). The ChatGPT advice describes a production app's CSP, not our preview target. | Live evidence beats spec-asserted CSP — the corpus index flags exactly this as its #1 "verify at build time" item |
| Spec D2 "2–4 variants" vs G1/G3 "3 default, 2 binary, 4–5 low-fi only" | **Adopt the graded rule.** It sits inside the spec's range for every rung except a rung-0 direction pass; recorded as a refinement of D2, not a break. | G1 §4.4 + G3 §3.2 independently agree |
| G1 rule 13 asserts centre bias; G3 rule 6 corroborates only *primacy* and declines centre | **Randomise order** (handles both); record centre-bias as `[REASONED, uncorroborated]`. | G3 §3.6 explicitly flags it |
| "More options cause overload" (folk rule) vs the meta-analysis | Overload is **d = 0.02 — essentially zero overall** across 63 conditions / 50 experiments / n=5,036. It appears only under moderators: hard-to-compare multi-attribute options, no prior preference, time pressure, must-justify-later. **Our audience matches several**, so cap at 3 for *that* reason — not because "more is bad". | `[CITED — G3 §3.3, Scheibehenne et al. 2010]` |
| Decision fatigue as a hard budget | **Soft, contested.** Ego depletion largely failed a 23-lab preregistered replication; the judges/parole finding is disputed as a scheduling artifact. Use 5–8 as a recap prompt, never a gate. | `[G3 §3.8/§8]` |
| F2 calls glassmorphism slop; the method says an owner asking for "glassy" wins | **No conflict** — rule 22's corollary. An explicit request is a decision; exempt from the tax, recorded as deliberate. | F2 §3.1 |

## 7. What is deliberately NOT here

Per-axis **build** knowledge — how to make convincing glass, choose a typeface pairing, tune a spring,
design a table — belongs to the agent generating a variant **on that axis**, pulled on demand from
`docs/research/`:

`A1` colour · `A2` type · `A3` space/layout · `A4` shape/depth/material · `A5` a11y conformance ·
`B1` motion · `B2` states/affordance · `B3` nav/flow · `C1` component anatomy · `C2` tokens/coherence ·
`C3` information design · `D1` UX writing · `D2` iconography/imagery · `E1` performance/CSS ·
`E2` cross-platform/CSP reality · `F1` style movements · `H1` asset sourcing · `H2` feasibility matrix

Loading them by default would recreate the degradation this file is built to avoid.
