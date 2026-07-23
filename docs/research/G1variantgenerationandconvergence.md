# G1 — Variant generation & convergence methodology

*Design-intelligence reference. Track G1 of the registry research map. Written to be read by the design agent before it generates a single variant, and by a human owner auditing how options are produced, shown, mixed, and locked. This track is largely **methodology the tool runs on itself**; HCI evidence is cited where it exists and reasoned claims are flagged `[REASONED]`.*

---

## 1. Scope line

This track owns **how to generate options that are genuinely useful, and how to converge on one**: isolating the single decision axis a variant set is meant to probe, **guaranteeing the variants actually differ on that axis** (and match on everything else), choosing how many options to show (2/3/4/5), moving up a **fidelity ladder** (direction → mechanic → component → cluster → page → micro), **mixing/recombining** picks, deciding **when to stop**, **sequencing decisions** so an early choice never invalidates a later locked one, and **protecting locked items from regression** when other components regenerate.

## 2. Boundary (what this track does **not** cover)

- **Judging whether a given variant is *good*** — heuristic evaluation, scoring rubrics, ranking quality → **G2 Critique**. G1 *produces* the spread and *verifies it differs on-axis*; G2 says which point on the axis is better.
- **Capturing/locking the decision durably** — decision ledgers, ADR-style records, restating-understanding, and the taste model behind a user's pick → **G3 Taste elicitation**. G1 says *when* to lock and *how to scope regeneration around a lock*; G3 owns the *record and the elicitation dialogue*. Deep **choice-overload psychology** (satisficing, regret) is shared with G3.
- **Whether a variant reads as generic / off-the-shelf** and the anti-generic catalogue → **F2 Distinctiveness**. G1 guarantees variants differ *from each other on an axis*; F2 guarantees the set differs *from the sea of templates*.
- **How to actually build the variant** — the tokens, color, material, type, motion that realise a point on an axis → **A/B/C tracks** (A1 colour, A4 shape/depth/material, B1 motion, C2 tokens & coherence). G1 names the axis "material"; A4 builds the glass.
- **Single-file / strict-CSP / offline feasibility** of a technique a variant needs → **H2 Feasibility**. G1 assumes the variant can be built; H2 says whether it survives the sandbox.

Everything G1 owns lives in one loop of the tool's pipeline: **decompose UI → for each component build 2–4 REAL interactive variants → non-designer picks/mixes → rebuild to the same preview URL → lock → assemble locked components into mockups.** G1 is the "build 2–4 variants," the "picks/mixes," and the "lock + don't regress" logic.

---

## 3. Executive rules (apply these before reading the body)

1. **Diverge in parallel, not in series.** Generate a decision's alternatives **side-by-side** and get feedback on the *set*, rather than refining one design and iterating. In a controlled study, parallel prototyping beat serial on ad click-through (**445 vs 398** per million), expert ratings (**24.4 vs 21.7** / 50), design divergence, and designer self-efficacy (**+2.5 vs +0.4**), with equal time and feedback. ([Dow et al. 2010, TOCHI](https://dl.acm.org/doi/10.1145/1879831.1879836), [Stanford PDF](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-final.pdf))
2. **One axis per decision.** A variant set must isolate **exactly one** decision axis (layout, *or* density, *or* material…) and hold **every other variable constant**. If two things vary at once, the user's pick is uninterpretable and the locked decision is contaminated.
3. **Verify difference-on-axis *objectively, before showing*.** Never present variants you have not proven (a) differ on the intended axis by a perceptible step and (b) match on all other axes. **This is the direct fix for the observed "a set of different variants all shared one interaction → felt identical" failure** — that failure is unverified output reaching the user. Method in §4.3.
4. **Default to 3 options.** `2` = binary A/B or a late confirm; `3` = **default** (two poles + a middle reveals the axis's *gradient*); `4–5` = only for *wide, early, foundational* spaces; `6+` = choice fatigue — decision time rises with option count (Hick–Hyman, `RT = a + b·log₂(n+1)`). ([Laws of UX: Hick's Law](https://lawsofux.com/hicks-law/); overload → G3.)
5. **Diverge at low fidelity, converge at high fidelity.** Divergence and fidelity are **inversely related**. Explore many cheap directions as words/wireframes; commit to few expensive pages. Climb the 6-rung ladder (§4.5); this is the Double Diamond's alternation of divergent/convergent thinking. ([Design Council: Double Diamond](https://www.designcouncil.org.uk/our-resources/the-double-diamond/))
6. **Decide foundational axes before dependent ones.** Order by **blast radius**: direction → layout/structure → density → type → colour/material → component pattern → component styling → micro-interaction/motion → copy. A late change to a foundational axis **invalidates** any dependent decision locked earlier (§4.6).
7. **Show functionally-identical, stylistically-distinct variants.** Hold the *content and function* constant across the set so the user judges the **axis**, not the data. Tohidi & Buxton's three test designs (Circular / Tabular / Linear) were *functionally identical*, differing only in form. ([Tohidi & Buxton 2006, CHI](https://dl.acm.org/doi/10.1145/1124772.1124960))
8. **Always show more than one — a lone design gets dishonest praise.** Shown a single design, users give inflated ratings and **never reject** it (0/12); shown alternatives, they rate more honestly and **do reject** (3/12), because multiple options signal "no commitment" and de-anchor them. One option is not a choice. ([Tohidi & Buxton 2006](https://www.billbuxton.com/rightDesign.pdf))
9. **Mix only across *orthogonal* axes, and verify the mix is coherent.** Merging the best of several designs beat picking the single best (**70% vs 56%** usability gain). But you cannot mix two *levels of the same axis*, and cross-system mixes break coherence — check the merged result before locking. ([Nielsen/Faber, NN/g](https://www.nngroup.com/articles/parallel-and-iterative-design/); coherence → C2.)
10. **Lock decisions, then scope all regeneration around the locked set.** A locked component is a **frozen constraint**: passed into later generation verbatim, never re-derived. Regenerate only the open target (§4.9).
11. **Regression-check every regeneration against the locked set.** After any rebuild, **diff** the locked components against their locked state; any drift is a regression → revert. Treat locks like golden files under test. `[REASONED — software-engineering analogy]`
12. **Stop when preference is stable or the remaining difference is below discrimination.** Cap **2–3 rounds per axis**. If the user says "either is fine," you've hit the axis's resolution floor — stop and lock; more options past that point only add fatigue (§4.8).
13. **Neutralise position and centre bias.** Users over-pick the first and (especially) the **middle** option. Randomise presentation order; make every option a real candidate — no decoys, no obvious throwaway. `[REASONED — presentation-bias control]`
14. **Don't expose a strong, polished example too early.** Design fixation: a shown example anchors people to its *form and its flaws*, in students and professionals alike. Diverge first, reveal a hero direction later. ([Jansson & Smith 1991, design fixation](https://www.jonkolko.com/phd/writing/25-06-12-design-fixation))

---

## 4. Body

### 4.1 Where G1 sits — the convergence loop

The tool's pipeline is a repeated **divergence → selection → lock** cycle applied component-by-component. G1 governs one turn of that cycle:

| Pipeline step | G1's job | Owned by |
|---|---|---|
| Decompose UI into components | (receives components) | upstream |
| **Build 2–4 real variants per component** | **isolate the axis, spread on it, verify difference** | **G1 §4.3–4.5** |
| Show a non-designer who picks/mixes | **choose option count; enable coherent mixing; de-bias presentation** | **G1 §4.4, §4.7** |
| Rebuild to the same preview URL | (re-render the chosen point) | build tracks (A/B/C) |
| Decisions LOCKED | **decide *when* to lock; scope future regen; regression-guard** | **G1 §4.8–4.9** (record → G3) |
| Assemble locked components into mockups | **sequence so no lock is invalidated** | **G1 §4.6** |

The whole loop is a small **Double Diamond** per axis: open up options (divergent), narrow to one (convergent), and only then open the next axis. ([Design Council](https://www.designcouncil.org.uk/our-resources/the-double-diamond/))

### 4.2 Why generate multiple alternatives at all? (the evidence)

Producing options is not indecision — it measurably produces better outcomes *and* better feedback. The four load-bearing findings:

| Finding | What it showed | Numbers | Source |
|---|---|---|---|
| **Parallel > serial** | Creating alternatives in parallel, then critiquing, beats iterating one design | CTR 445 vs 398/M; expert 24.4 vs 21.7/50; self-efficacy +2.5 vs +0.4; parallel designs objectively **more divergent** | [Dow et al. 2010](https://dl.acm.org/doi/10.1145/1879831.1879836) |
| **Multiple → honest feedback** | A lone design draws "faint praise"; alternatives free users to criticise & reject | Ratings *drop* toward honest (Circular 9.08→8.13, p=.004); rejections 0/12 → **3/12** | [Tohidi & Buxton 2006](https://www.billbuxton.com/rightDesign.pdf) |
| **Merge > best-of** | Combining the best ideas across alternatives beats picking one | best-of-4 **56%**, merged **70%**, merged + 1 iteration **152%** usability gain | [Nielsen/Faber](https://www.nngroup.com/articles/parallel-and-iterative-design/) |
| **Fixation is real** | A single early example anchors people to its form *and its flaws* | Effect holds for students *and* professional engineers | [Jansson & Smith 1991](https://www.jonkolko.com/phd/writing/25-06-12-design-fixation) |

Two consequences the tool must internalise:

- **The non-designer needs the spread to have an opinion at all.** Tohidi & Buxton found that with a single design *no participant rejected it*; the ability to say "not that one" only appeared once alternatives existed. A one-variant flow manufactures false consensus.
- **Critique feels safe against a set, threatening against a single.** In Dow, parallel participants found feedback helpful **13/16** with *zero* reporting it as negative; serial participants **6/17** helpful with **8/17** feeling it negative — because a critique of "one of my three" attacks the process, not the person. This is why the tool should always frame a choice as *among options*, never as a verdict on one artefact. ([Dow et al. 2010](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-final.pdf))

> **Honesty flag.** Tohidi & Buxton also found multiple alternatives **did not** increase *constructive redesign suggestions* — testing surfaces *problems and preferences*, not solutions. The tool must not expect the non-designer to invent a fix; it must generate the candidate fixes and let them *choose*. `[CITED]`

### 4.3 Isolating the decision axis — the core method (the "felt identical" fix)

The observed failure — *"a set of 'different' variants all shared one interaction → felt identical"* — is a **controlled-variable failure**: the variants moved on some axis nobody cared about (or on none) while the axis the set was *supposed* to probe stayed fixed. The fix is borrowed from **design of experiments / one-factor-at-a-time (OFAT)**: to learn the effect of one variable, vary *only* it and hold the rest constant. `[REASONED — DOE/OFAT applied to UI]` Tohidi & Buxton's method is the canonical UI instance: three designs *functionally identical*, differing *only* in structure. ([Tohidi & Buxton 2006](https://dl.acm.org/doi/10.1145/1124772.1124960))

**The five-step isolation protocol** (run for every variant set, *before* the user sees anything):

| Step | Action | Guarantees |
|---|---|---|
| **1. Name the axis** | State the single axis in words + its *parameter*: "information **density**, controlled by padding + meta-count + line-height." | You can't isolate what you can't name. |
| **2. Freeze the control set** | Enumerate every *other* variable and pin it to one shared value: same copy, same colours, same type family, same radius, same component skeleton. | Non-axis variables can't drift. |
| **3. Place distinct levels** | Assign each variant a **distinct, well-spaced point** on the axis (poles + middle for 3). Spacing must exceed the just-noticeable difference. | Variants differ *perceptibly*, not nominally. |
| **4. Verify — the gate** | **Diff** the variants two ways: (a) *axis diff* — the axis parameter differs by ≥ the min step across all pairs; (b) *control diff* — all non-axis variables are byte-identical / token-identical. Then the **blind-sort test**: can the axis level of each variant be stated without ambiguity ("this is the compact one")? | Objective proof of on-axis difference and off-axis sameness. |
| **5. Reject & regenerate on fail** | If two "variants" are >~85% identical, or they differ on a *second* axis, **do not show them** — regenerate. | The failure never reaches the user. |

**What each verification catches:**

- *Axis diff* catches the literal observed bug — three "layout variants" that all use the same interaction pattern fail the axis diff (the layout parameter didn't move) and are rejected before display.
- *Control diff* catches the subtler contamination — three "density variants" that *also* changed accent colour, so the user picks the one they like without anyone knowing *why* (density? colour?), and the locked "density decision" is a lie.
- *Blind-sort* catches "differences too small to perceive" — if the tool itself can't articulate where each variant sits on the axis, a human never will, and the set will "feel identical."

**Operational thresholds** `[REASONED — defaults, tune per axis]`: treat variants as *too similar* if a structural DOM/token diff is < ~15% of nodes/tokens, or (for visual axes) an embedding/pixel distance is below a per-axis floor. Treat the set as *contaminated* if any non-axis token differs. Both are automatable and should run as a pre-display gate.

> The single most important sentence in this track: **the tool must never show a variant set it has not proven differs on the named axis and matches on every other.** Every "felt identical" report is a skipped step 4.

### 4.4 How many options — 2 / 3 / 4 / 5

Option count trades **coverage of the axis** against **cognitive load** (Hick–Hyman: decision time grows ~`log₂(n+1)`; overload and satisficing grow faster — see G3). For a *non-designer* judging *side-by-side*, working memory caps useful comparison at ~3–4.

| Count | Name | Use when | Why | Risk if misused |
|---|---|---|---|---|
| **2** | Binary A/B | The axis is genuinely **dichotomous** (light/dark, serif/sans, tabs/accordion) **or** a late *confirm* between two survivors | Cleanest possible signal; forces a clear pick | **False dichotomy** — imposes either/or on a continuous axis; hides the middle |
| **3** | **Default** | Almost always, for any *continuous* axis (density, emphasis, roundness, motion energy) | Two poles + a middle reveals the **gradient** and lets the user point *between* samples; fits working memory | Middle becomes a lazy default (centre bias, §Rule 13) |
| **4** | Wide | **Early, foundational, high-blast-radius** axes with a genuinely large space (overall visual direction, layout model) | Enough to map an unfamiliar space without overload | Overkill on narrow axes; two of four are usually near-duplicates → fail §4.3 |
| **5** | Very wide | **Only** first-pass *direction* exploration where the space is unknown and cheap (rung 0–1 fidelity) | Casts the net once, at the cheapest rung, before narrowing hard | Choice fatigue begins; must collapse to ≤3 next round |
| **6+** | — | **Never** for a single decision | Past ~5, added options mostly add fatigue and near-duplicates, not information | Choice overload, satisficing, decision abandonment → G3 |

**Decision rules for count:**

- **Start from 3.** Deviate only with a reason: drop to **2** when the axis is truly binary or you're confirming; rise to **4–5** only at **low fidelity on a foundational axis**.
- **Count falls as fidelity rises.** A rung-0 direction pass may show 5; by the time you're at rung-4 pages, you should be at **2**. (See §4.5.)
- **More options demand cheaper options.** You may only show 5 if each costs almost nothing to make and discard — i.e., low on the ladder. Showing 5 *full pages* is both expensive and unreadable.
- **If you can't make N genuinely-different-on-axis variants (§4.3), lower N.** Three real differences beat five with two duplicates every time — duplicates are the "felt identical" failure in disguise.

### 4.5 The fidelity ladder — diverge low, converge high

Fidelity is *how finished a variant looks/behaves*. The rule: **spend divergence where throwing work away is cheap.** Six rungs, from broadest/cheapest to narrowest/most-expensive:

| Rung | Level | What a "variant" is | Typical option count | Divergence | Cost to discard |
|---|---|---|---|---|---|
| **0** | **Direction** | A *concept in words / mood*: "calm-editorial" vs "dense-utilitarian" vs "playful-bold". Maybe a reference or palette chip. | 3–5 | **Widest** | Trivial |
| **1** | **Mechanic** | The *interaction/structure model*, low-fi: tabs vs accordion vs single-scroll; sidebar vs top-nav. | 3–4 | Wide | Very low |
| **2** | **Component** | One **real interactive component** at the chosen mechanic: a card, a nav, a form field, varied on one axis. | **3** | Medium | Low |
| **3** | **Cluster** | Several components composed into a **section** — tests coherence between locked pieces. | 2–3 | Narrowing | Medium |
| **4** | **Page** | A full **assembled mockup** of locked components. | **2** | Narrow | High |
| **5** | **Micro** | **Micro-interaction / motion / copy polish** on an otherwise-locked page: hover feel, easing, microcopy. | 2 | Narrowest | High (but low blast radius) |

**How to read the ladder:**

- **Divergence and fidelity trade off along the rungs.** Five rough directions at rung 0 is healthy; five polished pages at rung 4 is waste *and* unreadable. If you find yourself wanting many options at a high rung, the real decision belongs at a lower rung — **drop down**.
- **Each rung's winner becomes the next rung's constant.** The direction chosen at rung 0 is *held fixed* while you vary the mechanic at rung 1; the mechanic is held fixed while you vary the component at rung 2. This is how isolation (§4.3) and sequencing (§4.6) interlock.
- **Don't skip rungs on high-blast-radius axes.** Jumping straight to rung-4 pages for a layout decision means every page rebuild is expensive and the user is anchored by polish (fixation, Rule 14). Decide layout as a rung-1 mechanic first.
- **Rung 5 is special: high fidelity, *low* blast radius.** Micro-polish is the one place late divergence is safe, because nothing depends on it. It's the last axis to open (§4.6).

### 4.6 Decision sequencing — blast radius and the dependency DAG

An early decision **invalidates** a later locked one when the later one *depends* on it. So sequence axes by **blast radius** (how many downstream decisions rest on this one) and **reversibility** (how expensive to redo). Decide high-blast-radius, low-reversibility axes **first**; decide low-blast-radius, cheap-to-change axes **last**. `[REASONED — dependency ordering; blast-radius framing standard in engineering]`

**The default axis order (a topological sort of the dependency DAG):**

| Order | Axis | Blast radius | Depends on | May be locked before… |
|---|---|---|---|---|
| 1 | **Direction / tone** | Whole product | — | everything |
| 2 | **Layout / structure** | All pages | direction | density, components |
| 3 | **Density** | All components | layout | type detail, component styling |
| 4 | **Type system** | All text | direction, density | colour, component styling |
| 5 | **Colour / material** | All surfaces | direction, type | component styling, motion |
| 6 | **Component pattern** | That component + clusters | layout, density | its styling & motion |
| 7 | **Component styling** (radius, weight, shadow) | That component | pattern, colour, material | its motion |
| 8 | **Micro-interaction / motion** | That component only | styling | copy |
| 9 | **Copy / microcopy** | Local | everything visual | — |

**The invalidation rule, stated precisely:** *never lock a decision on axis B before locking every axis A that B depends on.* Locking downstream-first is the structural cause of "an early choice invalidated a locked later one." The DAG turns that from a judgement call into a checkable constraint: before locking axis B, assert all of B's parents are already locked.

**Blast-radius ties the ladder together:** the axis order (§4.6) and the fidelity ladder (§4.5) are the same gradient viewed two ways — foundational axes are decided *low* on the ladder (cheap, divergent) and *early* in the sequence; dependent axes are decided *high* on the ladder and *late*. Micro-interaction is rung 5 *and* order 8 for the same reason: nothing depends on it.

### 4.7 Mixing & recombination

The pipeline lets the non-designer **pick *or mix***. Mixing is evidence-backed: Nielsen/Faber's *merged* design (best ideas from all four alternatives) scored **70%** vs **56%** for simply picking the best single one. ([NN/g](https://www.nngroup.com/articles/parallel-and-iterative-design/)) But mixing is only safe under constraints:

| Rule | Why | Failure if broken |
|---|---|---|
| **Mix only across orthogonal axes.** "Density from A + accent from B" composes; "high density from A + low density from B" does not. | Two levels of the *same* axis are mutually exclusive — there is no coherent blend. | Incoherent, self-contradicting output. |
| **Design axes to *be* orthogonal.** Decompose the space so picks compose cleanly (density independent of colour independent of motion). | Orthogonality is what *makes* mixing possible; it's a property you engineer at §4.3 step 2. | Every mix needs manual reconciliation. |
| **Verify the mix is coherent before locking.** A mix of components built on different token systems can clash (type scale, spacing base). | Frankenstein assembly — locally fine, globally broken. Coherence is C2's domain; G1 must *trigger the check*. | "Merged" UI that looks assembled from parts. |
| **A mix creates a *new* candidate — re-verify and (sometimes) re-show.** The blend is not one of the shown options; confirm it's what the user meant. | Users mis-predict how two picks combine. | Locking a blend the user didn't actually want. |

> **Honesty flag.** The 70%-vs-56% merge advantage comes from *expert designers* merging with judgement. An automated merge of orthogonal axis-picks is a *reasoned extrapolation* of that result, not a direct measurement — it works because the axes were built orthogonal (§4.3), not because averaging designs is magic. `[REASONED extension of CITED result]`

### 4.8 When to stop — convergence criteria

Divergence without a stop condition is just churn. Converge — and **lock** — when any of these fire:

| Stop signal | Detect it by | Action |
|---|---|---|
| **Stable preference** | User picks the same point across **two** presentations (e.g., after a reshuffle) | Lock it. |
| **Below discrimination** | User says "either is fine / I can't tell" — the remaining variants differ below their resolution floor | Lock **either** (pick the cheaper/more-accessible); stop splitting hairs. |
| **Diminishing divergence** | Successive rounds' variants are converging on their own (§4.3 diff shrinking) | You've found the answer; lock. |
| **Round cap hit** | **2–3 rounds** on one axis with no stable pick | Escalate to G3 (the axis may be mis-framed or the user's taste unelicited), don't spawn round 4. |
| **Regret check passes** | "Would shipping this pick upset you?" → no | Good enough; lock and move on (satisficing beats optimising here). |

**Rules:**
- **Cap at 2–3 rounds per axis.** Endless A/B is a failure mode, not thoroughness. If 3 rounds don't settle it, the problem is the *framing* (wrong axis, wrong fidelity) or *unelicited taste* → G3.
- **Convergence is monotonic with fidelity.** As you climb the ladder, options should *decrease* (5→3→2) and rounds should shorten. If options are *growing* as fidelity rises, sequencing is inverted (§4.6).
- **Stopping ≠ perfection.** The goal is a decision the user won't regret, reached cheaply — not the global optimum. (Scoring for *quality* is G2; this is purely *when the search halts*.)

### 4.9 Avoiding regression of locked items — scoped regeneration

Once a decision is **locked**, the risk is that generating *other* components silently changes it — the "regression of locked items." The defence is **scoping** plus a **regression gate**. `[REASONED — software-engineering discipline applied to design generation]`

**Scoped regeneration:**
1. **Locked = frozen constant, not re-derived.** A locked component's code/tokens are passed into any later generation **verbatim**, as fixed context — never regenerated "to match."
2. **Regenerate only the open target.** When building component *N*, the prompt/space is scoped to *N* alone; locked components are *inputs*, out of scope for change.
3. **Locked tokens are read-only.** If component *N* needs a shared token that a lock depends on, it *consumes* the locked value; it may not *redefine* it (that's a foundational change → must re-open the axis deliberately, §4.6, not a side effect).

**The regression gate (run after every rebuild):**
- **Diff each locked component against its locked snapshot.** Byte/DOM/token diff. **Any** difference on a locked component = regression → **revert that component to its snapshot** and flag.
- **Treat locks as golden files.** The test isn't "does it look fine," it's "is it *identical* to what was locked." This is the only reliable guard, because visual drift is easy to miss by eye.
- **A wanted change to a locked item is a re-open, not a regen.** If the user genuinely wants to revisit a lock, that's an explicit unlock + re-sequence (and everything downstream of it may need re-checking) — never an incidental rewrite.

**Why sequencing (§4.6) is the *upstream* fix:** the worst regressions come from changing a *foundational* axis after *dependent* items are locked (change density → every locked card re-flows). The regression gate *catches* drift; correct sequencing *prevents* the class of drift where a legitimate later decision forces an earlier lock to change. Use both.

### 4.10 Worked examples

#### Worked example A — isolating one axis for a "card," 3 genuinely-different variants

**Goal:** give the non-designer a real choice on **information density** for a content card — the axis, not colour, not layout.

**Step 1 — name the axis.** Density, parameterised as **{padding, line-height, meta-items shown, avatar on/off}**.

**Step 2 — freeze the control set** (identical across all three): same headline + body copy + image, same accent colour `#3B5BDB`, same type family (Inter), same corner radius `12px`, same elevation (one `0 1px 3px` shadow), same width, same click behaviour.

**Step 3 — place 3 distinct levels:**

| Variant | Padding | Line-height | Meta shown | Avatar | Axis level |
|---|---|---|---|---|---|
| **Spacious** | 24px | 1.6 | author + date + read-time | yes | low density |
| **Medium** | 16px | 1.45 | author + date | yes | mid |
| **Compact** | 8px | 1.3 | date only | no | high density |

**Step 4 — verify (the gate):**
- *Axis diff:* padding 24→16→8, meta 3→2→1 — monotonic, well-spaced. ✅
- *Control diff:* colour, type family, radius, shadow, copy, width, behaviour — **identical** across all three. ✅
- *Blind-sort:* "spacious / medium / compact" — each variant's level is unambiguous. ✅

**Step 5:** gate passes → show the three.

**Contrast — the FAILURE version (what the observed bug looks like):** three "density options" that actually all use `16px` padding and identical meta, but variant A is blue, B is green, C is purple. *Axis diff fails* (density parameter never moved) and *control diff fails* (colour, a different axis, moved). The user picks "the blue one" for reasons unrelated to density; the tool locks a "density decision" that is really a colour preference; and because the density axis never visibly moved, the set *"feels identical"* as density options. **Step 4 rejects this set before it's ever shown.** That single gate is the fix.

#### Worked example B — a sequencing plan that stops an early choice invalidating a lock

**Scenario:** a small analytics dashboard. Axes in play: **layout** (sidebar vs top-nav), **density**, **card pattern**, **card styling** (radius/shadow), **hover micro-interaction**.

**The wrong order (produces the invalidation):**
1. Tool builds beautiful *cards* first and locks a **hover micro-interaction**: a 12px lift with a spreading shadow.
2. *Then* the user picks **layout = compact sidebar** + **density = compact**.
3. Compact density shrinks cards and tightens the grid gutter to 8px. The locked 12px-lift hover now **collides with the neighbouring card** and the spreading shadow overflows the gutter.
4. The locked micro-interaction is **invalidated** by a later foundational choice → forced rework of a "done" decision. This is exactly "an early choice invalidated a locked later one" — caused by locking a **dependent** axis (order 8) before its **parents** (layout order 2, density order 3).

**The right order (dependency-respecting, §4.6):**

| Lock # | Axis | Rung | Depends on (must already be locked) |
|---|---|---|---|
| 1 | Layout = top-nav | mechanic (1) | direction |
| 2 | Density = comfortable | component (2) | layout |
| 3 | Card pattern | component (2) | layout, density |
| 4 | Card styling (radius/shadow) | styling (2–3) | pattern, colour |
| 5 | **Hover micro-interaction** | micro (5) | **styling, density** — now known: lift tuned to the settled gutter |

Because density and gutter are **locked before** the hover is designed, the hover is tuned to real spacing and **cannot** be invalidated by a later density change — there is no later density change; density is a parent and already frozen. The regression gate (§4.9) then guarantees that building the *next* component doesn't perturb the locked hover.

#### Worked example C — a coherent mix across orthogonal axes

The user likes **variant A's density** (compact) and **variant B's material** (glass, from A4). Because density and material were built as **orthogonal** axes (§4.3 step 2 held material constant while varying density, and vice-versa), the blend "compact + glass" is well-defined. The tool composes it, runs the **coherence check** (shared token base? type scale intact? → C2), confirms it's a *new* candidate the user hasn't literally seen, and **re-shows it once** for confirmation before locking. Had the user instead tried to combine "A's compact **density**" with "B's spacious **density**," the mix is rejected as *same-axis, mutually exclusive* — offer a *third density point between them* instead.

---

## 5. Options catalogue — decision-axis types (variant strategies)

The unit of a variant set is a **decision axis**. This catalogue is the menu of axes the tool picks *one* of per set. Columns: **what it varies · when to use it *as the axis* · how to guarantee difference on it (the §4.3 handle) · pitfalls.** Blast radius (→ §4.6 order) noted; the *build* of each lives in the A/B/C tracks.

| Axis | What it varies | Use as THE axis when… | Guarantee difference by… | Pitfalls |
|---|---|---|---|---|
| **Layout / structure** *(order 2, high blast)* | Arrangement, grouping, nav model, reading path | The *skeleton* is undecided; earliest structural fork | Distinct **arrangement graphs** (element order/nesting differs), not just restyled same layout; verify DOM structure diff is large | Restyling one layout ≠ variants; deciding late forces expensive page rebuilds → decide at rung 1 |
| **Density / information** *(order 3)* | Padding, line-height, items-per-area, meta shown | Content-heavy UI; "how much at once" is the live question | Monotonic spacing/meta ladder (Worked Ex. A); verify padding & count differ, colour/type held | Confusing density with *size*; changing colour "to help tell them apart" contaminates (→ §4.3) |
| **Hierarchy / emphasis** | What is biggest/first, focal order, contrast of importance | The elements are set but their *priority* is contested | Move the **focal element** and the size/weight ramp; verify the "loudest" element differs | Overlaps type & layout — pin those constant or you're varying three axes |
| **Type / voice-of-type** *(order 4)* | Typeface pairing, scale ratio, weight contrast | Brand voice-in-type is open; text-forward product | Different pairing *or* scale ratio (1.2 vs 1.333 vs 1.5); verify family/ratio differs, layout & colour held | Font swaps that also shift metrics silently change density; lock density first |
| **Colour / theme** *(order 5)* | Palette, light/dark, accent strategy | Mood/brand colour is the decision (build → **A1**) | Distinct hue/temperature or accent *strategy*; verify palette tokens differ, everything else identical | Colour is the *easiest* axis to leak into other sets — most common contaminant; quarantine it |
| **Material / depth** *(order 5–7)* | Flat vs shadow vs glass vs bordered vs neumorphic | Surface treatment is the question (build → **A4**) | Different depth *model* (elevation vs border vs blur); verify shadow/blur/border tokens differ | Material differences can be near-invisible at small size → fail blind-sort; show at real scale |
| **Shape** | Corner radius, geometric vs organic forms | Personality via form; icon/container style | Distinct radius scale (0 / 8 / 20px) or form language; verify radius/clip differs | Tiny radius deltas are sub-JND; space the levels widely |
| **Interaction mechanic** *(order ~1)* | The *behaviour*: tabs vs accordion vs scroll; modal vs inline | The interaction model itself is unchosen — **the axis in the observed failure** | Genuinely different **interaction pattern per variant**; verify the event/flow model differs, *not just the visuals* | **This is where "all shared one interaction" happens** — if variants render differently but behave identically, axis diff FAILS; reject |
| **Motion / feel** *(order 8, low blast)* | Easing, duration, spring vs curve, energy (build → **B1**) | Everything visual is locked; only *feel* remains (rung 5) | Distinct duration/easing/energy per variant; verify motion tokens differ | Late, low-stakes — don't over-invest options; 2 is usually enough |
| **Tone / copy** *(order 9)* | Voice, formality, length of microcopy | Words carry the brand; onboarding/empty states | Distinct register (terse/neutral/warm); verify strings differ, layout held | Easy to conflate with type; vary *words*, not *typography* |
| **Imagery / illustration** | Photographic vs illustrated vs iconographic vs none | Visual-content strategy is open | Different *media class* per variant; verify asset type differs | Licensing/feasibility (→ H1/H2); a11y of decorative imagery (→ A5) |

**How to choose *which* axis to open next:** take the **highest-blast-radius axis that is still open and whose parents are all locked** (§4.6). That is always the most information-rich, least-regret-prone next decision. Opening a low-blast axis (motion) while a high-blast one (layout) is unresolved wastes the round and invites regression.

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **"Variants felt identical" (the observed failure)** | Set differs on visuals but shares one interaction/axis-value; users see no real choice | Run §4.3 step 4 *axis diff* as a pre-display gate; reject sets where the named axis parameter didn't move; regenerate |
| **Contaminated set (2+ axes moving)** | User's pick can't be attributed to one axis; the "locked decision" is ambiguous | *Control diff* (§4.3): pin every non-axis variable; regenerate holding them constant |
| **Sub-threshold difference** | Variants differ, but below what a human perceives ("they look the same") | Widen level spacing beyond JND; drop option count; blind-sort test must pass |
| **Only one option shown** | A single design presented for approval | Never ship one; min 2, default 3 — a lone design gets false praise & is never rejected ([Tohidi & Buxton](https://www.billbuxton.com/rightDesign.pdf)) |
| **Too many options** | 6+ variants; user stalls, satisfices, or abandons | Cap per §4.4; 3 default, 5 max at low fidelity; collapse next round (Hick–Hyman) |
| **Serial refinement instead of parallel** | Tool iterates one design, asking "better?" each turn | Generate the set in parallel, critique the set — parallel beats serial on quality & morale ([Dow](https://dl.acm.org/doi/10.1145/1879831.1879836)) |
| **Divergence at high fidelity** | Five polished *pages* to choose between; expensive, unreadable | Move the decision down the ladder; diverge at rung 0–2, converge at 4 (§4.5) |
| **Early example anchoring** | One slick direction shown first; later options echo its form & flaws | Diverge before revealing a hero; keep early rungs rough (fixation, [Jansson & Smith](https://www.jonkolko.com/phd/writing/25-06-12-design-fixation)) |
| **Dependent axis locked before parent** | A micro/style decision locked, then a layout/density choice breaks it (Worked Ex. B) | Enforce the DAG (§4.6): assert all parent axes locked before locking a child |
| **Regression of a locked item** | A locked component silently changes when another is generated | Scoped regeneration + golden-file diff gate; revert any drift (§4.9) |
| **Same-axis mix** | User asked to combine two mutually-exclusive levels of one axis | Reject; offer a *third point between* them instead of an impossible blend (§4.7) |
| **Incoherent mix** | Orthogonal picks combined but tokens clash | Coherence check before lock (→ C2); re-show the blend once to confirm |
| **Centre / order bias** | Middle option wins suspiciously often | Randomise order; ensure every option is a real candidate, no decoys (Rule 13) |
| **Endless rounds** | 4+ rounds on one axis, no stable pick | Cap at 2–3; escalate framing/taste to G3, don't spawn more options |
| **Expecting the user to invent the fix** | Asking a non-designer "what would you change?" and stalling | Generate candidate fixes as variants; users *choose*, they don't *design* ([Tohidi & Buxton](https://dl.acm.org/doi/10.1145/1124772.1124960)) |

---

## 7. Pre-flight checklist (run before showing any variant set, and before any lock)

**Before showing a set:**
- [ ] The set isolates **exactly one named axis**; the axis and its parameter are stated (§4.3 step 1).
- [ ] Every **non-axis variable is frozen** to a shared value across all variants (§4.3 step 2).
- [ ] Variants sit at **distinct, well-spaced levels** on the axis (poles + middle for 3) (§4.3 step 3).
- [ ] **Axis diff passes** — the axis parameter provably differs across all pairs (§4.3 step 4a).
- [ ] **Control diff passes** — all other axes are identical across variants (§4.3 step 4b).
- [ ] **Blind-sort passes** — each variant's level on the axis is stateable without ambiguity (§4.3 step 4c).
- [ ] Option **count** fits the rule: 3 default; 2 for binary/confirm; 4–5 only for early foundational at low fidelity; never 6+ (§4.4).
- [ ] Fidelity **rung** matches the count: high divergence only at low rungs; ≤2 options at page level (§4.5).
- [ ] The axis being opened is the **highest-blast-radius open axis whose parents are all locked** (§4.6).
- [ ] Presentation order is **randomised / de-biased**; no decoy option (Rule 13).
- [ ] Functionally identical, stylistically distinct — the user judges the axis, not the data (Rule 7).

**Before locking a decision:**
- [ ] Preference is **stable** (repeat pick) *or* the remaining difference is **below discrimination** (§4.8).
- [ ] Round count is within the **2–3 cap**; if not, escalated to G3 rather than adding options (§4.8).
- [ ] All of this axis's **parent axes are already locked** (no dependent-before-parent) (§4.6).
- [ ] If a **mix**: axes are orthogonal, the blend is coherent (C2), and it's been re-shown once (§4.7).
- [ ] A **snapshot** of the locked component is stored for the regression gate (§4.9 / record → G3).

**After any regeneration:**
- [ ] **Regression gate passes** — every previously-locked component is byte/token-identical to its snapshot; any drift reverted (§4.9).
- [ ] Regeneration was **scoped** to the open target; locked items were inputs, not rewritten (§4.9).

---

## 8. Open questions / unverified

- **The isolation-verification gate (§4.3) is a `[REASONED]` construction** — the *principle* (isolate one variable, hold others constant) is textbook DOE/OFAT and Tohidi & Buxton's method is a real instance, but the specific automated thresholds (structural diff < ~15% = "too similar," per-axis embedding/pixel floors) are **engineering defaults, not measured constants**. Tune them per axis against real "felt identical" reports.
- **Option-count numbers (3 default, 5 ceiling)** rest on Hick–Hyman (decision time ~`log₂(n+1)`) and working-memory limits, both well-established, but the **exact** "3 is optimal for a non-designer side-by-side" is a synthesised heuristic, not a single citable RCT. Choice-overload magnitude is contested in the literature — G3 owns that debate.
- **The 6-rung fidelity ladder** is a `[REASONED]` synthesis of Buxton's design funnel and the Double Diamond; the *rung boundaries and per-rung counts* are prescriptive defaults, not empirically fixed.
- **The dependency DAG / axis order (§4.6)** is `[REASONED]` from blast-radius reasoning; a different product (e.g. brand-led vs data-led) may legitimately reorder colour vs layout. The *rule* (parents before children) is invariant; the *specific order* is a sensible default.
- **Scoped regeneration + golden-file regression gate (§4.9)** is a `[REASONED]` transfer of software regression-testing discipline to design generation; effective in principle, but its reliability depends on the diff being able to detect *meaningful* drift without false-positiving on trivial re-serialisation. Verify the diff granularity in implementation.
- **Merge-beats-best (§4.7)** is `[CITED]` for expert designers (70% vs 56%); its extension to *automated orthogonal-axis mixing* is a `[REASONED]` extrapolation that holds *only if* the axes were genuinely built orthogonal.
- **Numbers age.** The Dow (2010) and Tohidi & Buxton (2006) effect sizes are from their studies' contexts (web ads, small UIs); directionally robust and repeatedly replicated in spirit, but treat the *specific* figures as illustrative, not universal constants.

---

## 9. Sources

Primary / authoritative (HCI & design-method):
- [Dow, Glassco, Kass, Schwarz, Schwartz & Klemmer — *Parallel Prototyping Leads to Better Design Results, More Divergence, and Increased Self-Efficacy*, ACM TOCHI 2010](https://dl.acm.org/doi/10.1145/1879831.1879836) · [Stanford full PDF](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-final.pdf) — parallel vs serial; the CTR / rating / divergence / self-efficacy numbers.
- [Tohidi, Buxton, Baecker & Sellen — *Getting the Right Design and the Design Right: Testing Many Is Better Than One*, CHI 2006](https://dl.acm.org/doi/10.1145/1124772.1124960) · [full PDF](https://www.billbuxton.com/rightDesign.pdf) — multiple alternatives → honest feedback & willingness to reject; functionally-identical/stylistically-distinct method.
- [Nielsen & Faber — *Parallel & Iterative Design + Competitive Testing = High Usability*, NN/g](https://www.nngroup.com/articles/parallel-and-iterative-design/) · [Parallel Design](https://www.nngroup.com/articles/parallel-design/) — merge-beats-best (70% vs 56%); parallel + iterative + competitive combination.
- [Design Council — *The Double Diamond*](https://www.designcouncil.org.uk/our-resources/the-double-diamond/) · [History of the Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/history-of-the-double-diamond/) — divergent/convergent alternation; Discover/Define/Develop/Deliver.
- [Jansson & Smith (1991) — *Design Fixation* (summary, Jon Kolko)](https://www.jonkolko.com/phd/writing/25-06-12-design-fixation) — anchoring to an example's form *and flaws*, in novices and professionals.

Reference / secondary:
- [Laws of UX — Hick's Law](https://lawsofux.com/hicks-law/) — `RT = a + b·log₂(n+1)`; decompose complex decisions into stages.
- [Cardinal Path — The Case for Parallel Prototyping](https://www.cardinalpath.com/blog/web-design-the-case-for-parallel-prototyping) — practitioner framing of the Dow findings.
- Bill Buxton — *Sketching User Experiences* (the "design funnel": get the right design, then get the design right) — via [billbuxton.com papers](https://www.billbuxton.com/papers.html). *(Book; not fetched — cited as the origin of the funnel framing.)*

Cross-track (this registry map):
- **G2 Critique** — scoring/ranking variant *quality* (G1 only guarantees the spread differs on-axis).
- **G3 Taste elicitation** — durable decision records, restating understanding, and choice-overload psychology.
- **F2 Distinctiveness** — anti-generic; differing from templates (vs G1's differing from each other).
- **A1 / A4 / B1 / C2** — building a point on the colour / material / motion / token axes.
- **H2 Feasibility** — whether a chosen variant survives the single-file / strict-CSP / offline sandbox.

*Honesty note: sections 4.3–4.6 and 4.9 (isolation-verification gate, fidelity-ladder rungs, axis-sequencing DAG, scoped-regeneration regression gate) are **methodology the tool applies to itself**, reasoned from established principles (DOE/OFAT, Double Diamond, blast-radius ordering, software regression testing) and flagged `[REASONED]` inline. The empirical claims about parallel prototyping, multiple-alternative feedback, merge-beats-best, fixation, and Hick–Hyman are `[CITED]` above.*
