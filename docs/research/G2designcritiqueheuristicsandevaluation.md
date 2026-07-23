# G2 — Design critique, heuristics & evaluation

*Design-intelligence reference. Track G2 of the registry research map. Written to be read by the design agent immediately before it shows any generated screen to a non-designer, and by a human owner auditing that judgment. Current as of July 2026.*

---

## 1. Scope line

This track owns **how design quality gets judged, by whom, and with what evidence, before a human ever sees the output**: the canonical evaluation frameworks (Nielsen's 10 usability heuristics and their history/successors, the cognitive walkthrough, first-click testing, five-second testing), the exact method mechanics behind each (evaluator counts, the 0–4 severity scale, the four walkthrough questions, what each test does and doesn't measure), a concrete **agent-runnable self-critique rubric** across hierarchy / consistency / legibility / craft with numeric scoring bands and hard gates, the cognitive blind spots that make self-review unreliable in the first place (confirmation bias, the curse of knowledge, the aesthetic-usability effect), the quantitative signals worth logging across iterations, and a precise, repeatable way to phrase a finding — giving it or receiving it — so it is specific enough to act on instead of "I like it" / "make it pop."

## 2. Boundary (what this track does **not** cover)

MECE split against sibling tracks; each hand-off named:

- **Accessibility conformance math** — the WCAG 2.2 numeric success criteria (4.5:1 / 3:1 contrast, 24×24 px targets, focus-visible mechanics) and APCA as a draft/advisory model → **A5 Accessibility & inclusive design**. G2's legibility check flags things that *look* risky (a tight-looking pairing, color-only meaning) as a pre-show heuristic; it never computes or certifies a ratio. Every flagged item still has to clear A5 before ship.
- **"Does this look generic / templated / like every other AI output"** → **F2 Distinctiveness & anti-generic design**. G2 asks "does it communicate and work"; F2 asks "is it differentiated." A screen can pass every G2 check and still be F2-generic, and vice versa — the axes are orthogonal by design.
- **Capturing, recording, and versioning the resulting decision** — decision ledgers, ADR-style records, the taste model behind a pick → **G3 Taste elicitation**. G2 produces the findings and the verdict; G3 owns how that verdict gets written down and turned into a durable preference record.
- **Generating the variants/options being evaluated** → **G1 Variant generation & convergence methodology**. G2 never designs a screen; it only judges ones G1 (or an earlier pass of the same agent) already produced. G1 also owns *option count* and *divergence*; G2 owns *is this option good*.
- **Whether a given interaction state's design is complete or correct** — the hover/focus/loading/error/disabled state matrix and what each must change → **B2 Interaction states & affordance**. G2's craft check flags a symptom ("this state looks unstyled or missing") as a finding; B2 owns the specification of what states must exist and what they must do.
- **Deep token-architecture coherence audits** — computed-style diffing, alias-chain verification, ΔE colour-drift tolerances → **C2 Design systems, tokens & coherence**. G2's "consistency" rubric dimension is a fast, surface-level pre-show pass (are values visibly/structurally reused); C2 owns the authoritative deep audit and its numeric tolerances.

---

## 3. Executive rules

1. **Run the self-critique rubric (§4.6) on every screen before showing it.** Score hierarchy, consistency, legibility, and craft; never present anything scoring below "Revise" or tripping a critical-fail trigger as finished.
2. **Treat Nielsen's 10 heuristics (§4.1) as the default whole-screen checklist.** Unchanged since 1994, refined via factor analysis of **249** real usability problems and **101** candidate principles across **25,149** data points ([Nielsen's own history](https://jakobnielsenphd.substack.com/p/usability-heuristics-history)). Run all 10 against every materially new screen, not just the ones that feel relevant.
3. **A single evaluator — including you, alone — finds only about 35% of what a full panel would** (42% of major problems, 32% of minor ones, averaged across 6 projects — §4.3). One self-review pass is a floor, not a ceiling: where the architecture allows it, run 2–3 independent passes with different framing and reconcile; where it doesn't, disclose "single-pass."
4. **Rate every finding 0–4 using frequency × impact × persistence (§4.3), never gut feel — and never average a severity-4 finding away with unrelated good scores elsewhere.** A single Sev-4 finding hard-blocks shipping regardless of everything else.
5. **Reserve the cognitive walkthrough (§4.4) for new, complex, or unfamiliar multi-step flows** (checkout, onboarding, wizards); it's overkill for a static screen. Ask all 4 questions — goal, visibility, association, feedback — at every real step; one "no" fails that step.
6. **First-click and five-second tests need a genuinely fresh human to be valid (§4.5).** An agent cannot self-administer either one without the curse of knowledge invalidating the result. Use the rendered-screenshot vision-proxy (§4.6) as a cheap early signal only, say so explicitly if it's surfaced, and flag high-stakes flows to the human owner as needing a real test.
7. **The primary action must be nameable from a cold look at the rendered screen alone.** If two elements compete for top visual weight, that's a hierarchy failure regardless of how polished either one is individually (aesthetic-usability effect, §4.7).
8. **Consistency is measurable, not a vibe.** Count distinct spacing values, hex colors, and font sizes actually rendered on a screen. More than **~6–8** distinct spacing values, or any color outside the declared token set, is a finding (§4.6) — the deep, authoritative audit still belongs to C2.
9. **Legibility checks here are craft-level pre-checks** (size, line-height, ~50–75-character line length, no color-only meaning) — never a substitute for numeric contrast/conformance, which A5 owns and must still run before ship.
10. **Ban "I like it" / "looks clean" / "feels off" from every finding.** Every finding cites a location, an observed fact, and the heuristic or rubric dimension it violates (§4.9) — describe the problem, don't just prescribe a pixel fix.
11. **Watch specifically for the aesthetic-usability effect in your own review.** A good-looking screen reads as more usable than it is — to you too. Re-check hierarchy and error-recovery *harder*, not softer, on anything that already looks polished (§4.7).
12. **Log quantitative signals across iterations, not just a single snapshot:** rubric score trend, count of severity-≥3 findings, and — once real users are involved — task success rate (**~78%** average benchmark) and SUS (**~68** average) (§4.8).
13. **Structure every finding, self-found or human-given, with the fixed template:** Location → Observation → Principle → Evidence → Severity → optional direction (§4.9). Never hand over a fix with no diagnosis attached.
14. **Every non-happy-path state (empty, loading, error, realistic/edge-length content) is in scope for the craft and hierarchy checks.** "Design that later" is exactly how severity-4 findings ship (§4.6, worked example A finding #9).
15. **Flag every unverified number you state or rely on** — evaluator-count percentages, benchmark rates, sample-size conventions — rather than silently presenting a secondary blog's stat as NN/g-verified (§8). When two similar-sounding statistics come from different methods (heuristic evaluation's L≈35% vs. usability testing's L≈31%), keep them distinct — don't conflate them.

---

## 4. Body

### 4.1 Nielsen's 10 usability heuristics — the canonical list

Nielsen's 10 heuristics are the default checklist for heuristic evaluation (§4.3) and the base vocabulary the rest of this track's rubric is built on. Canonical source: [NN/g — 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) (Nielsen; originally published 1994-04-24, last updated 2024-01-30 — the text itself has **not changed** since 1994; see §4.2).

| # | Heuristic | Nielsen's definition (verbatim, NN/g) | Agent self-check question |
|---|---|---|---|
| 1 | **Visibility of system status** | "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time." | Does every async action (load, save, submit) show a state within ~1s, or a spinner/skeleton if it can't? |
| 2 | **Match between the system and the real world** | "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon." | Would the target persona recognize every label/icon without a tooltip? |
| 3 | **User control and freedom** | "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process." | Is there a visible back/cancel/undo for every multi-step or destructive action? |
| 4 | **Consistency and standards** | "Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions." | Does the same control look and behave the same everywhere it appears on this screen and the last one? |
| 5 | **Error prevention** | "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place." | Are risky/irreversible actions confirmed or constrained (format masks, disabled invalid states) before submission? |
| 6 | **Recognition rather than recall** | "Minimize the user's memory load by making elements, actions, and options visible. The user should not have to remember information from one part of the interface to another." | Does the user ever have to remember something from an earlier screen to complete this one? |
| 7 | **Flexibility and efficiency of use** | "Shortcuts — hidden from novice users — may speed up the interaction for the expert user so that the design can cater to both inexperienced and experienced users." | Is there an unnecessary tax on repeat/expert use (no shortcuts, no defaults, no bulk action)? |
| 8 | **Aesthetic and minimalist design** | "Interfaces should not contain information that is irrelevant or rarely needed. Every extra unit of information competes with the relevant units." | Does every element earn its place, or is something competing with the primary action for no reason? |
| 9 | **Help users recognize, diagnose, and recover from errors** | "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution." | Does every error message say what went wrong, where, and what to do next — in plain language? |
| 10 | **Help and documentation** | "It's best if the system doesn't need any additional explanation. However, it may be necessary to provide documentation to help users understand how to complete their tasks." | If help is needed, is it findable at the point of need, task-focused, and short? |

These 10 are **not independent** — a single finding often maps to two or three at once (an unlabeled icon button is simultaneously a match-to-real-world failure *and* a recognition-over-recall failure). Log the clearest one; don't force a rigid single-heuristic taxonomy.

### 4.2 Where the 10 came from, and the recognized successor/extension frameworks

**History.** Nielsen and Rolf Molich first published a heuristic set at CHI'90 — Nielsen, J. & Molich, R. (1990), "Heuristic Evaluation of User Interfaces," *Proc. SIGCHI Conference on Human Factors in Computing Systems*, Seattle, 249–256 ([ACM DL](https://dl.acm.org/doi/10.1145/97243.97281)) — built from "the best thinking two solid UX professors could produce," not yet research-grounded. In 1994, Nielsen refined it with a proper **factor analysis**: he compiled **249 usability problems** from 11 real projects and **101 candidate usability principles** from the literature, then ran factor analysis across **25,149 data points** to find which principles had the greatest explanatory power for real problems. The 10 that survived are the list in §4.1. ([Nielsen's own retrospective](https://jakobnielsenphd.substack.com/p/usability-heuristics-history); companion CHI'92 paper: Nielsen, J. (1992), "Finding Usability Problems Through Heuristic Evaluation," [PDF mirror](https://course.ccs.neu.edu/is4300sp13/ssl/articles/p373-nielsen.pdf).)

**Honesty flag — "reimagined" ≠ "revised."** A 2023–2026 NN/g-adjacent retrospective confirms the heuristics' *text* is unchanged since 1994 — what's evolved is the community "reimagining" them into mnemonics, posters, comics, and translations, not their substance. ([UX Tigers — The 10 Usability Heuristics Reimagined](https://www.uxtigers.com/post/10-heuristics-reimagined)) Treat any source claiming Nielsen "updated" the heuristics with new wording as imprecise unless it cites a specific dated NN/g revision.

**Recognized successor / extension frameworks:**

| Framework | Source | What it adds beyond Nielsen's 10 | When to reach for it |
|---|---|---|---|
| **Shneiderman's Eight Golden Rules** | Ben Shneiderman & Catherine Plaisant, *Designing the User Interface* (textbook, successive editions); [secondary summary, IxDF](https://ixdf.org/literature/article/shneiderman-s-eight-golden-rules-will-help-you-design-better-interfaces) | Explicit **"design dialogue to yield closure"** (a task sequence needs a clear end/confirmation) and **"support internal locus of control"** (the user, not the system, drives); frames short-term-memory load around the classic ~5-item working-memory limit | Cross-check on task-flow completion and command/dialog design — largely overlaps Nielsen's 10; treat as a second phrasing, not new coverage |
| **Norman's action-cycle fundamentals** (affordances, signifiers, mapping, feedback, conceptual model, constraints; gulf of execution / gulf of evaluation) | Don Norman, *The Design of Everyday Things* (1988, rev. 2013) | A **causal model of why** usability problems happen, not just a checklist of that they happened — useful for diagnosing root cause, not just logging a symptom | Root-causing a cluster of related findings; explaining a finding to a non-designer stakeholder in plain terms |
| **Cognitive walkthrough** | Wharton, Lewis, Rieman & Polson (1990–1994) | A **task-flow, step-by-step** method rather than a whole-interface checklist — see §4.4 | New/complex/unfamiliar flows, early prototypes, learnability-specific concerns |
| **AI-interface heuristics** | No single canonical set as of July 2026 | NN/g's own position is to **re-apply the classic 10**, with extra weight on *visibility of system status* (is the system "thinking," what did it do) and a transparency concern (can the user tell how a result was produced well enough to correct it) — not a proposal for new heuristics. ([Nielsen, "AI: First New UI Paradigm in 60 Years," 2023](https://www.nngroup.com/articles/ai-paradigm/)) | Evaluating AI-in-the-loop or agent-driven UI. *(Honesty flag: nascent area — don't treat any single blog's "10 AI heuristics" listicle as settled; expect a canonical successor set to firm up.)* |

### 4.3 Running a heuristic evaluation

**What it is.** A structured expert-inspection method: one or more evaluators independently examine an interface against a heuristic set (default: Nielsen's 10) and log every violation as a finding. It is one of Nielsen's original **"discount usability engineering"** methods — deliberately cheap and fast, no lab, no recruiting. ([NN/g — Discount Usability: 20 Years](https://www.nngroup.com/articles/discount-usability-20-years/); *general framing, not independently re-verified in full detail here*.)

**How many evaluators.** [NN/g recommends **3 to 5 independent evaluators**](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/): "each individual (no matter how experienced or expert) is likely to miss some of the potential usability issues." This isn't a vibe — it's grounded in a measured curve.

**The math (Nielsen & Landauer, 1993).** Problems found by *i* evaluators follow:

```
ProblemsFound(i) = N × (1 − (1 − L)^i)
```

where **N** = total problems in the interface and **L** = the probability a single evaluator finds any given problem. ([Nielsen & Landauer, "A mathematical model of the finding of usability problems," Proc. INTERCHI'93](https://www.semanticscholar.org/paper/A-mathematical-model-of-the-finding-of-usability-Nielsen-Landauer/245061d94c228abdc9bda2d9a10679e897526465)) For **heuristic evaluation specifically**, [Nielsen's case studies across 6 projects](https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/) put **L ≈ 34–35%** on average (**42%** for major problems, **32%** for minor ones, per evaluator) — a single evaluator finds only about a third of what's actually there. [Nielsen's cost-benefit example](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/) finds an optimum around **~4 evaluators**, where benefit outweighs cost by roughly **62×** in his illustrative project — the practical range this converges to across projects is the commonly quoted **3–5**.

> **Honesty flag — do not conflate this with "5 users find 85% of problems."** That figure (§4.7) is from **usability testing with real users**, a different method with a different L (≈31%). Heuristic evaluation's L≈34–35% describes expert evaluators reviewing without real users; testing's L≈31% describes real users attempting real tasks. Both use the same *shape* of formula. They are not the same number and are not interchangeable — a common conflation online.

**Severity rating — the 0–4 scale.** Every finding is rated by combining three qualitative factors — **frequency** (common or rare), **impact** (easy or hard to overcome when it happens), and **persistence** (a one-time annoyance the user learns around, or a repeated tax) — plus, where relevant, likely **market/business impact**. ([NN/g — Severity Ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/))

| Rating | Label | Nielsen's definition (verbatim) | What it means for shipping |
|---|---|---|---|
| **0** | Not a problem | "I don't agree that this is a usability problem at all." | Log and drop — no action |
| **1** | Cosmetic | "Need not be fixed unless extra time is available." | Backlog; ship as-is |
| **2** | Minor | "Fixing this should be given low priority." | Ship; add to a punch-list |
| **3** | Major | "Important to fix, so should be given high priority." | Do not present as "done" without disclosure or a fix |
| **4** | Catastrophe | "Imperative to fix this before product can be released." | Hard block — never present as finished |

**Process — 3 phases.** *Preparation* (~15–30 min): pick the heuristic set, scope the review, decide how findings get logged. *Independent evaluation* (~1–2 hours per evaluator, per NN/g's guidance): a first pass to get a feel for the interface, then a second pass hunting violations heuristic-by-heuristic. *Consolidation*: merge findings (watch for the same root issue reported twice in different words), agree severities, prioritize. ([NN/g](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/))

**How reliable is it, really — the honest ceiling.** Heuristic evaluation is not a substitute for real usability testing, and the gap is measured, not assumed. [MeasuringU's comparative research](https://measuringu.com/effective-he/) found heuristic evaluation (HE) identifies only **~30–43%** of the same issues real usability testing (UT) finds (their specific study: 32%, i.e. 16 of 50 user-encountered issues); HE **misses ~49%** of what UT catches; and **~34%** of HE-flagged issues (range 9–46% across the studies surveyed) are *not* independently confirmed by UT — though the authors caution these aren't necessarily false positives; some are real but long-tail. **Conclusion, and this track's default:** run both where you can; where you can't, treat a heuristic pass as a floor, not a ceiling.

### 4.4 Running a cognitive walkthrough

**Origin.** Wharton, C., Lewis, C., Rieman, J., & Polson, P. (1992), "Cognitive Walkthroughs: A Method for Theory-Based Evaluation of User Interfaces," *International Journal of Man-Machine Studies*, 36, 741–773 ([PDF](http://sonify.psych.gatech.edu/~ben/references/polson_cognitive_walkthroughs_a_method_for_theory-based_evaluation_of_user_interfaces.pdf)), building on earlier theory-based work by Polson & Lewis.

**What it is.** A **task-flow, step-by-step** inspection, distinct from heuristic evaluation's whole-interface checklist pass. Pick one real task, break it into the exact sequence of actions a user must perform, and at **every single step**, ask 4 questions from the perspective of a first-time user with a specific, stated background. ([NN/g — Evaluate Interface Learnability with Cognitive Walkthroughs](https://www.nngroup.com/articles/cognitive-walkthroughs/))

| # | Question | A "no" here means... | Typical failure pattern |
|---|---|---|---|
| 1 | **Will the user try to achieve the right outcome at this step?** (Do they even know this sub-goal exists?) | The task's structure is invisible — the user doesn't know this step is necessary | A required step is hidden behind an unrelated menu; no signposting of "next you need to…" |
| 2 | **Will the user notice that the correct action is available?** (Is it findable?) | The control exists but has low/no affordance | Icon-only control with no label; a link styled like plain text; action buried in an overflow menu |
| 3 | **Will the user associate the correct action with the outcome they want?** (Does the label/icon match their mental model?) | The label doesn't map to what the user is trying to do | Jargon ("Provision," "Instantiate"), an ambiguous icon, a metaphor from the wrong domain |
| 4 | **After acting, will the user see that they've made progress toward their goal?** | Feedback is missing, delayed, or easy to misread as failure | Silent success, no confirmation, a state change that doesn't register visually |

If **any** question gets a "no" for a step, that step **fails** — record it as a finding (a learnability breakdown) and continue to the next step; don't stop the walkthrough early.

**When to use it vs. heuristic evaluation.** Reach for a cognitive walkthrough on **new, complex, or unfamiliar task flows** — onboarding, checkout, any multi-step wizard — where the real risk is *first-time learnability*, not general polish. It's overkill for a static marketing page with no sequential task. Heuristic evaluation is the broad, cheap, whole-screen pass; cognitive walkthrough is the narrow, deep, one-flow-at-a-time pass. Many real reviews run both: heuristic evaluation across every screen, cognitive walkthrough on the two or three flows that matter most.

**Team and format.** Typically a small workshop: one person acts out the task ("the user"), a facilitator asks the 4 questions at each step, a recorder logs findings; cross-functional participants (design, PM, engineering, a domain expert) surface different blind spots. *(NN/g's own writeup does not specify a standard team size or step-count the way heuristic evaluation specifies 3–5 evaluators — treat "one task, every real step, 4 questions each" as the load-bearing part, and team size as flexible, flagged as not independently sourced to a specific number.)*

**Agent adaptation.** An agent can run this alone as a structured reasoning trace: enumerate the task's real steps, and for each step, answer all 4 questions explicitly in character as the stated persona (not as the agent, which already knows the design) before moving on. This is fully agent-runnable without any human participant — see §4.6 and §7 for how it plugs into the pre-show checklist.

### 4.5 First-click test and five-second test

**What each measures, in one line.** A first-click test asks "given a real task, where do you click first, and were you right?" — it's **behavioral**. A five-second test asks "what did you see or understand in a brief glance?" — it's **attitudinal and recall-based**. ([NN/g — UX Research Methods Glossary](https://www.nngroup.com/articles/research-methods-glossary/))

| Attribute | First-click test | Five-second test |
|---|---|---|
| Type | Behavioral: click location + time | Attitudinal + limited recall (self-report after brief exposure) |
| Needs a task? | Yes — "find X" / "do Y" | No — often open-ended ("what is this for?") |
| Typical output | % correct first click, time-to-click, click heatmap | % recalling key elements/purpose, sentiment rating |
| Best for | Validating IA/navigation/first-tap placement | Validating hierarchy, brand read, "what is this" clarity |
| Predictive strength | See below — strongly predicts eventual task success | Attitudes stabilize fast; comprehension accuracy does not (see below) |
| Sample size convention | No fixed NN/g minimum found; unmoderated tools commonly recruit **tens of responses** for a stable % | Small N (5–10) gives a fast qualitative read; 20+ for more stable %recall. *Both ranges are practical convention, not a verified NN/g minimum — flag before hard-coding.* |

**First-click predicts task success — three independent data points.** [Bob Bailey's research across ~12 studies](https://measuringu.com/first-choice/) found that if a user's first click landed on the optimal path, **87%** eventually succeeded at the task, versus only **46%** when the first click was wrong. MeasuringU's own testing on live sites (2 studies, 750 users, 21 tasks) found a smaller but real gap: **78% vs. 70%**. Their tree-testing study (navigation-only, no search, 8 studies, 1,000+ users, 137 tasks) found the starkest effect: **80% vs. 14%** — "users were more than six times as likely to succeed if their first choice was correct." Removing real-world escape hatches (like search) sharpens the correlation, suggesting live-site testing may *understate* how much a first click matters. ([MeasuringU — The Importance of the First Choice](https://measuringu.com/first-choice/))

**Five-second test — the rigid "5 seconds" is a convention, not a proven optimum.** A peer-reviewed case study found attitudes toward a design crystallize fast and barely differ whether shown for 2, 5, or 10 seconds — but **comprehension/purpose-identification accuracy kept improving from 2s to 10s**, and complex designs specifically benefited from more time. The paper's recommendation is to adjust exposure duration to the design's visual complexity rather than defaulting to 5 seconds. ([Smashing Magazine, Dec 2023](https://www.smashingmagazine.com/2023/12/five-second-testing-case-study/)) Treat "5 seconds" as a well-known, useful convention — not a scientifically validated fixed constant.

**Why these can't be validly self-administered by the agent that built the screen.** Both methods derive their value from a **fresh, unbiased first reaction** — the participant must not already know what the design is "supposed" to communicate. An agent evaluating its own just-generated output has the opposite condition: full knowledge of intent, structure, and content — a textbook case of the curse of knowledge (§4.7). A same-agent "first click" or "five-second glance" is **not equivalent to real data** and must never be reported as if it were. The best an agent can honestly do is the **vision-based proxy check** in the self-critique rubric (§4.6) — treat it as a cheap early-warning signal, not a substitute, and disclose it explicitly as such whenever it's surfaced to a human.

### 4.6 The self-critique rubric — hierarchy, consistency, legibility, craft

This is the procedure the agent runs on **every screen, every iteration**, before showing anything to the human owner. It has four dimensions, each scored **0–25** (100 total), each with agent-runnable checks and a stated method for performing them technically, plus a hard-gate rule so a high total can never paper over one severe failure.

**Rendering discipline (do this first).** Every check below that says "look at the rendered screen" means exactly that — render the actual artifact (e.g., via a headless browser such as **Playwright** or **Puppeteer**, both Apache-2.0, free and open source) and evaluate the pixels, not the markup or the spec. Reasoning from markup/spec alone re-triggers the curse of knowledge this whole section exists to route around (§4.7).

#### Dimension 1 — Hierarchy (0–25): is the primary action obvious in ~5 seconds?

| Check | Points | How to check it (agent-runnable) |
|---|---|---|
| Exactly one element reads as the dominant call-to-action/message — no two elements competing at equal top-level visual weight | 10 | Enumerate every CTA-level-styled element (filled button, oversized/bold headline, saturated color, banner); if ≥2 score similarly on size + color + position, fail this check |
| Visual weight ranks match intended importance (primary > secondary > tertiary is visible in size/contrast/position, not just DOM order) | 8 | Compare each element's declared/intended priority (from the brief/spec) against its rendered size/contrast/placement rank |
| **Vision-proxy 5-second test** passes: looking at the rendered screenshot cold, the agent can name the single primary action/message without reading body copy | 7 | Render the screen; do a first-pass read of the image alone (not the code/spec); state the one conclusion before consulting the intended answer; compare |

**Critical-fail trigger:** if the agent cannot name a primary action at all, or **3+ elements** compete at equal top-level weight, **cap this dimension at 5/25** regardless of the sub-scores above — this mirrors Nielsen's severity-4 override (§4.3): a hierarchy collapse is not "averaged away" by good detail work elsewhere.

#### Dimension 2 — Consistency (0–25): are tokens actually shared?

| Check | Points | How to check it (agent-runnable) |
|---|---|---|
| Color usage traces to a fixed, declared palette — no one-off hex/rgb values outside the token set | 6 | Extract every color value in the rendered CSS; flag any not present in the declared token list |
| Spacing values fall on one scale (e.g., a 4px or 8px base) | 6 | Extract every margin/padding/gap value; count distinct values; flag if more than **~6–8** distinct values appear on one screen, or any value isn't a multiple of the declared base unit |
| Typographic scale is limited and reused (≤ ~5–7 size steps) | 5 | Extract every font-size value in use; count distinct values against the declared type scale |
| Repeated components are styled identically wherever they recur | 5 | Diff computed style of every instance of the "same" component; flag divergence not explained by a declared state/variant |
| Interactive states (hover/focus/active/disabled/error) follow one consistent pattern, not invented per instance | 3 | Check each state's delta (color/elevation/border shift) against the same delta used elsewhere for the same state |

*(This is a fast pre-show pass, not the authoritative audit — route anything ambiguous to C2's computed-style diffing with its ΔE tolerances; see §2.)*

#### Dimension 3 — Legibility (0–25): craft-level pre-check; numeric conformance is A5's job

| Check | Points | How to check it (agent-runnable) |
|---|---|---|
| Body text size and line-height are within comfortable working ranges — a starting heuristic, not a conformance bar (**≥ ~14–16px equivalent, 1.4–1.6× line-height**) | 6 | Extract computed font-size/line-height for body text blocks |
| Line length sits near **50–75 characters** per line for body paragraphs, not exceeding **~80** (Ruder's classic range; WCAG 1.4.8's 80-character reflow guidance as the outer bound) | 5 | Estimate characters-per-line from container width ÷ average glyph width at the given font-size, or check for a `max-width`/`ch`-unit constraint ([Baymard](https://baymard.com/blog/line-length-readability)) |
| Any text/background pairing that *looks* low-contrast is flagged for A5 — not adjudicated here | 8 | Visually scan for pairings that read as tight/washed-out; log as a flag with location; do **not** state a ratio or a pass/fail — that's A5's numeric call |
| Meaning is never carried by color alone (status, required fields, errors also carry an icon, label, or shape) | 6 | For every colored status/meaning cue, confirm a second, non-color channel exists |

#### Dimension 4 — Craft (0–25): alignment, spacing rhythm, optical issues, edge cases

| Check | Points | How to check it (agent-runnable) |
|---|---|---|
| Elements align to a shared grid — no stray 1–3px misalignments | 7 | Compare edge coordinates of sibling elements; flag near-misses that look unintentional |
| Spacing rhythm is even — equal gaps between repeated items, matching internal padding across sibling containers | 6 | Compare gap/padding values across repeated structures |
| **Optical**, not just mathematical, alignment — icons/text centered by eye, not just bounding box; round/pointed shapes sized very slightly larger than square neighbors of "equal" nominal size | 4 | Spot-check icon-to-text baseline alignment and any circle/square pairs at nominally equal size |
| No unintended clipping, overflow, orphaned text, or broken wraps at realistic content lengths (longest likely string, empty string, a truncated name) | 4 | Re-render with min/max plausible content lengths, not just the demo content |
| Non-happy-path states (empty, loading, error) are styled to the same standard as the primary state — not left bare or default-browser-styled | 4 | Confirm every state referenced by B2's matrix has *some* intentional styling present, even if minimal *(existence/quality flag only — the state's required content is B2's spec, not G2's)* |

#### Scoring bands

| Total (0–100) | Band | Action |
|---|---|---|
| **90–100** | Ship | No notable issues; present to the human owner |
| **75–89** | Ship with a punch-list | Minor fixes noted but not blocking; show, flag the list |
| **50–74** | Revise before showing | At least one real problem; fix and re-score before presenting as "done" |
| **< 50** | Rebuild | Fundamental issue(s); do not present this as a finished option |

**The hard-gate rule — do not average past a catastrophe.** Two overrides apply on top of the raw total, mirroring both Nielsen's severity scale (§4.3) and NN/g's own warning against naively averaging ordinal success levels ([success-rate metric](https://www.nngroup.com/articles/success-rate-the-simplest-usability-metric/)) — a good score elsewhere does not cancel a real failure:

1. **Any single dimension scoring below 10/25** (under 40% within that dimension) caps the *overall* band at **"Revise,"** regardless of the total.
2. **Any Hierarchy critical-fail trigger** caps the overall band at **"Rebuild."**

Check the floor *before* trusting the total. See worked example B (§4.10) for this rule firing in practice.

### 4.7 Why self-review is unreliable — the cognitive blind spots

**Confirmation bias.** The tendency to notice evidence that confirms what you already believe (the design is fine) and discount evidence that doesn't. An agent that just generated a screen is primed to see it succeed. Mitigation: run checks in a fixed, adversarial order that requires hunting for the failure before concluding success — the rubric (§4.6) is phrased as claims that must be *true*, not an open-ended "does this look okay."

**Curse of knowledge.** [A well-documented bias](https://www.usertesting.com/blog/curse-of-knowledge) in which someone who already knows something — here, the agent that wrote the copy, chose the labels, and knows exactly where every control is — cannot accurately simulate *not* knowing it. It's the direct reason first-click and five-second tests can't be validly self-administered (§4.5): the agent cannot forget its own intent to have a genuinely first reaction. Mitigation: the vision-proxy check (§4.6) is a partial workaround — evaluate the *rendered pixels*, not the spec/intent — but it remains weaker than a genuinely fresh viewer and should be labeled as such whenever it's surfaced.

**Aesthetic-usability effect.** [Kurosu & Kashimura (1995, Hitachi Design Center)](https://www.nngroup.com/articles/aesthetic-usability-effect/) tested 26 ATM-interface variants with 252 participants and found perceived-aesthetics correlated with perceived-usability *more strongly* than aesthetics correlated with *actual* usability — people believe attractive things work better, even while directly trying to evaluate whether they work. For a self-critique agent this cuts two ways: (1) a polished screen makes *the agent itself* more forgiving of real problems underneath, and (2) if a human owner reacts to a good-looking screen with praise, that praise is not confirmation the underlying flow works. NN/g's own caveat: "a pretty design can make users forgiving of minor usability problems, but not of large ones" — so it masks Sev-1/2 findings, not Sev-4 ones. Mitigation: score hierarchy and error-recovery *especially hard* on anything that already looks polished — that's precisely where the halo effect hides a real defect.

### 4.8 Quantitative signals worth tracking

| Signal | Definition | Benchmark / reference point | Who can produce it | Source |
|---|---|---|---|---|
| Task/success rate | % of users completing a defined task | Average **78%** across 1,189 tasks / 115 studies / 3,472 users; top quartile >92%, bottom quartile <49%; common target 70% (consumer), 100% (high-stakes) | **Real users only** | [MeasuringU](https://measuringu.com/task-completion/) |
| SUS (System Usability Scale) | 10-item, 5-point Likert post-task survey, scored 0–100 | Average **68** (50th percentile); grade curve **A+ 84.1–100 → F 0–51.6**; "Acceptable" >70, "Marginal" 50–70, "Not acceptable" <50 | **Real users only** | [MeasuringU](https://measuringu.com/interpret-sus-score/) *(synthesis of Bangor/Kortum/Miller-era research and Sauro's later grading curve; underlying academic papers not independently re-fetched here)* |
| First-click accuracy | % choosing the optimal first click for a task | 87% eventual success if correct vs. 46% if wrong (Bailey); 80% vs. 14% in tree-testing (§4.5) | Real users, **or** agent vision-proxy (flagged non-equivalent) | [MeasuringU](https://measuringu.com/first-choice/) |
| Five-second recall/comprehension | % correctly identifying purpose/key elements after brief exposure | No fixed benchmark; accuracy improves 2s→10s with complexity (§4.5) | Real users, **or** agent vision-proxy (flagged non-equivalent) | NN/g glossary + [Smashing Magazine](https://www.smashingmagazine.com/2023/12/five-second-testing-case-study/) |
| Heuristic-eval issue count by severity | Count of Sev 0–4 findings from a heuristic pass | No universal benchmark; hard-gate on any Sev-4; track trend | Agent (self, 1 pass) or human panel (3–5 passes) | §4.3 |
| HE/UT overlap | % of real-user-found issues a heuristic pass also caught | ~30–43% typical overlap; ~49% of UT-found issues missed by HE; ~34% of HE findings unconfirmed by UT (long-tail, not necessarily false) | Requires **both** an HE pass and real UT data | [MeasuringU](https://measuringu.com/effective-he/) |
| Time on task | Duration to complete a task | No universal benchmark; track relative change vs. prior version | Real users | [NN/g Usability Metrics](https://www.nngroup.com/articles/usability-metrics/) |
| Error rate | Count/type of user errors during a task | No universal benchmark; track relative change | Real users | [NN/g Usability Metrics](https://www.nngroup.com/articles/usability-metrics/) |
| Rubric score (this track) | 0–100 self-critique score across hierarchy/consistency/legibility/craft | Bands: Ship ≥90, Minor-fix 75–89, Revise 50–74, Rebuild <50 — **this report's own scale, not an external benchmark** | Agent (self, every screen, every iteration) | §4.6 |

**Reading this table correctly:** the top four real-user-dependent rows are aspirational targets for *when* real users eventually see the work — an agent cannot produce them itself except via the explicitly-flagged, non-equivalent vision-proxy. The bottom three rows (issue counts, HE/UT overlap, rubric score) are what the agent *can* produce and should log every iteration to see whether quality is trending up or just churning.

### 4.9 Giving and receiving feedback precisely

**The finding template — use for every issue, self-found or human-given:**

```
[Location]    Where exactly — screen, component, state.
[Observation] What is literally there — described, not judged. No adjectives like "bad."
[Principle]   Which heuristic / rubric dimension / research finding it violates.
[Evidence]    Why it matters — the concrete impact on a user or task.
[Severity]    0–4 (§4.3).
[Direction]   Optional: the problem to solve, not the pixel-level fix — leave room for
              exploration unless the fix is trivial and unambiguous.
```

Worked line: *"On the checkout summary (Location), the 'Place Order' button and the 'Save for later' link are styled in the same blue at the same size (Observation) — this violates heuristic 8, aesthetic and minimalist design, since a secondary action visually competes with the primary conversion action (Principle/Evidence). Severity 3 — major (Severity). Direction: the primary action needs to visually outrank the secondary one; several routes exist — color, size, position (Direction, not prescribed)."*

**Banned phrases.** "I like it" / "I don't like it," "make it pop," "feels clunky," "looks clean" — none of these cite a location, a principle, or an impact. Adapted from [Nielsen's design-critique guidance](https://www.uxtigers.com/post/design-crit). If a reaction is only visceral, run the **5 Whys**: ask "why does it feel clunky?" repeatedly until the answer lands on something concrete (inconsistent spacing, competing CTAs, slow feedback) — that answer is the real finding.

**Describe, don't prescribe.** State the problem ("the primary and secondary actions have equal visual weight") rather than the fix ("make the button bigger and blue"). Solutionizing forecloses better options and can conflict with constraints the critic doesn't see. Reserve a concrete fix for cases where the direction is genuinely unambiguous.

**Nielsen's "Unlucky Thirteen" critique pitfalls** ([source](https://www.uxtigers.com/post/design-crit)), condensed:

| # | Pitfall | Looks like | Fix |
|---|---|---|---|
| 1 | Context vacuum | Critique starts with no framing of user/goal/constraint | Spend the first 3–5 min stating persona, goal, and what's already decided |
| 2 | Solutionizing | "Just make the button red" | Name the problem; let the direction stay open |
| 3 | Bikeshedding | Long debate on a color while the flow is broken | Time-box; explicitly rank structural findings above cosmetic ones |
| 4 | "I like / don't like" | Taste with no citation | Ban the phrase; require a principle or evidence |
| 5 | Presenter defensiveness | Arguing back instead of listening | Note it, move on; resolve after the session |
| 6 | Status rituals | Loudest/most senior voice wins by rank, not evidence | Structure so junior/outside voices speak first |
| 7 | Vague feedback | "Make it more user-friendly" | Force the 5-Whys down to something specific |
| 8 | Receiver defensiveness | Critique taken personally | Reframe: findings target "the design," not the designer |
| 9 | HiPPO effect | Highest-paid/most senior opinion overrides evidence | Anchor every claim to a heuristic/persona/data point, not authority |
| 10 | Unfacilitated free-for-all | No structure, time runs out, nothing resolved | Assign a facilitator and a scribe every time |
| 11 | Design by committee | Every suggestion incorporated indiscriminately | Owner (human or agent) decides what to act on — not a vote |
| 12 | Black hole | Findings never get written down or closed | Log every finding with an owner and a status |
| 13 | Too-late critique | Review only happens on polished, expensive-to-change work | Run the self-critique rubric at every iteration, not just before final ship |

**Receiving feedback (including from the human owner).** Log every piece of feedback even when you disagree — with your rationale — rather than silently dropping it (closes pitfall #12). Ask what user/business problem a request is trying to solve before implementing it verbatim: a request is often a *symptom description*, not the right fix. Use **linguistic distancing** — "the design" or "this option," not "your version" — to keep the exchange about the artifact.

### 4.10 Worked examples

#### Worked example A — heuristic evaluation pass on a sample screen, with severity ratings

**Sample screen:** "Checkout — Shipping & Payment," a single-page step in a 3-step checkout flow: page header, a shipping-address form, a payment-method selector, a promo-code field, an order-summary sidebar (repeating full product descriptions from the cart), and two buttons — a primary "Place Order" and a secondary "Save for later" link, both styled in the same blue at similar size.

| # | Heuristic | Finding | Evidence | Sev | Fix direction |
|---|---|---|---|---|---|
| 1 | Visibility of system status | No indicator of which step this is | No "Step 2 of 3" or equivalent anywhere on screen | **2** | Add a step/progress indicator |
| 2 | Match to real world | Field labeled "Locality" | Audience's everyday term is "City/Town" | **2** | Use plain, familiar terminology |
| 3 | User control & freedom | No way to edit cart quantity from this step | Only the browser back button works, risking loss of entered address data | **3** | Add a visible "edit cart" affordance that preserves entered data |
| 4 | Consistency & standards | Primary and secondary actions look alike | "Place Order" (primary) and "Save for later" (secondary) share color and size; the primary button was also labeled "Continue" on the prior step | **3** | Standardize primary-action styling and precedence across steps |
| 5 | Error prevention | Card-number field has no inline validation | Accepts any characters until full-form submission | **3** | Add live format masking/validation |
| 6 | Recognition rather than recall | Promo-code field assumes memory of a code seen elsewhere | No paste hint or reference to where the code appeared | **1** | Add placeholder text noting where to find the code |
| 7 | Flexibility & efficiency | No autofill/saved-address shortcut | Returning users re-type everything | **2** | Add browser autofill hooks and a saved-address option |
| 8 | Aesthetic & minimalist design | Order summary repeats full product descriptions | Already seen once in the cart; crowds this step | **1** | Collapse to name + price + qty; link out for detail |
| 9 | Help users recover from errors | Submit failure gives no field-level detail | Banner reads only "Error: invalid input" | **4** | Point at the specific field(s) and state what's wrong |
| 10 | Help and documentation | No help/chat affordance if stuck on payment | Nothing visible near the payment section | **1** | Add a low-key help link near payment |

**Roll-up:** 1×Sev4, 3×Sev3 (#3, #4, #5), 3×Sev2 (#1, #2, #7), 3×Sev1 (#6, #8, #10). **Decision rule applied:** the single Sev-4 finding (#9) hard-blocks shipping regardless of everything else on this list — this screen is not ready to present as "done." Fix #9 first, then the three Sev-3 findings (#3, #4, #5); the rest can ship with a disclosed punch-list.

#### Worked example B — the self-critique rubric applied to hierarchy / consistency / legibility / craft

**Sample screen:** an analytics-dashboard home screen — top bar (logo + nav), a welcome header, three stat cards (Revenue / Users / Churn), an outlined "Export Report" button top-right, a filled orange "Upgrade Plan" banner mid-page, a "View Details" link on each stat card, and a chart below.

| Dimension | Check | Score | Note |
|---|---|---|---|
| **Hierarchy** | One dominant CTA | 2/10 | The orange "Upgrade Plan" banner and the outlined "Export Report" button both read as calls to action; neither is clearly subordinate to the stat content, which is the screen's actual job |
| | Visual weight matches intent | 3/8 | Stat cards are appropriately dominant as content, but the banner outweighs them |
| | Vision-proxy 5s test | 1/7 | First impression on a cold render: "upgrade banner" — not "here are my stats." Fails the intended read |
| | **Subtotal** | **6/25** | **Below the 10/25 floor — triggers the hard gate** |
| **Consistency** | Palette | 3/6 | Banner uses a one-off orange outside the declared token set |
| | Spacing scale | 4/6 | Cards use 16/24px consistently; banner padding is an off-scale 18px |
| | Type scale | 5/5 | 5 sizes used, all on-scale |
| | Repeated components identical | 5/5 | Stat cards structurally identical |
| | Interactive states | 3/3 | Hover states consistent across links/buttons |
| | **Subtotal** | **20/25** | Good |
| **Legibility** | Size/line-height | 6/6 | 14px/1.5 body — comfortable |
| | Line length | 5/5 | Card descriptions ~40–50 characters |
| | Contrast (flag only) | 4/8 | Secondary gray text on light-gray card background reads tight — **flagged to A5** for a numeric check, not adjudicated here |
| | Color-only meaning | 3/6 | Churn stat signaled only by red text/number, no icon/label distinguishing "up = bad" — **flag** |
| | **Subtotal** | **18/25** | Good, with two flagged items |
| **Craft** | Alignment | 7/7 | Cards align to the grid cleanly |
| | Spacing rhythm | 6/6 | Even gaps throughout |
| | Optical alignment | 3/4 | Card icon sits slightly off the text baseline |
| | No clipping/overflow | 2/4 | Chart legend text truncates without an ellipsis at narrow widths |
| | Non-happy-path states | 1/4 | No empty state defined for a brand-new account with no data yet |
| | **Subtotal** | **19/25** | Good |

**Total: 6 + 20 + 18 + 19 = 63/100 → raw band "Revise before showing."** The hard-gate rule independently agrees here (Hierarchy = 6/25, below the 10/25 floor, caps the band at "Revise" on its own) — but it won't always agree with the raw total; a screen could total 80 and still get capped by one weak dimension, which is the entire point of checking the floor first (§4.6).

**Do not show this screen until, in priority order:** (1) the banner's competing visual weight is resolved — Hierarchy is the only dimension currently below the gate floor; (2) the banner's color/spacing is pulled onto the token scale — Consistency; (3) the contrast pairing and color-only churn signal are handed to A5 for verification — Legibility; (4) an empty state is designed — Craft.

---

## 5. Options catalogue — evaluation methods

| Method | What it catches | When to run | Cost | What it misses |
|---|---|---|---|---|
| **Heuristic evaluation** (§4.3) | Broad, whole-screen usability violations against a known-good checklist; fast and cheap | Any fidelity, wireframe through shipped; ideal as a standing pre-show gate | 3–5 evaluators × ~1–2 hrs each + consolidation (~1–2 person-days total); an agent alone ≈ single-evaluator cost (minutes) | Real-user surprises: single evaluator finds only **~35%** of problems (§4.3); even 3–5 evaluators together catch only **~30–43%** of what real usability testing finds ([MeasuringU](https://measuringu.com/effective-he/)) |
| **Cognitive walkthrough** (§4.4) | Step-by-step learnability breakdowns in a specific task flow — where a first-timer gets stuck | New/complex/unfamiliar flows (onboarding, checkout, wizards); early prototypes | Workshop format, roughly 1–3 hrs per flow depending on step count (practical estimate, not NN/g-sourced) | Whole-screen aesthetic/consistency issues outside the walked task; expert-user needs (it's deliberately a novice-first-use lens) |
| **First-click test** (§4.5) | Whether the IA/navigation/first-tap placement is right for a given task | After a navigation/IA structure exists, before committing to it; validating a specific task path | Unmoderated tool + real participants; practical range of tens of responses for a stable %, cheap per response *(convention, not NN/g-sourced)* | Anything about *why* someone clicked wrong; aesthetic/brand impressions; requires a real, fresh human — **not agent-self-administrable** (§4.5) |
| **Five-second test** (§4.5) | First impression: what registers, perceived purpose, aesthetic reaction | Early concept/hero/landing screens; validating headline hierarchy and brand read | Same tooling profile as above; small N (5–10) gives a fast qualitative read, 20+ for stability *(convention, not verified minimum)* | Multi-purpose/complex interfaces (the rigid-5s convention under-serves them, §4.5); also not validly agent-self-administrable |
| **Self-critique rubric** (agent, §4.6) | Hierarchy clarity, token/consistency drift, legibility red-flags, craft/alignment defects — everything an agent *can* check on its own output | Every iteration, before every human-facing show — the standing pre-show gate | Near-zero marginal cost; seconds to minutes per screen, fully automatable | Real first-reaction data (curse of knowledge, §4.7); numeric a11y conformance (→A5); distinctiveness (→F2); anything requiring a genuinely fresh human |
| **Pluralistic walkthrough** (variant) | Combines end-users, developers, and designers walking the same flow together, comparing perspectives live | When stakeholder alignment matters as much as finding issues; complex domain-specific flows | Workshop-level: recruiting + a facilitated session — more expensive than a solo cognitive walkthrough | Still not unmoderated real-world behavior; participants know they're being watched (reactivity) |
| **Moderated usability testing** (gold-standard anchor) | Everything above, plus real behavior, real confusion, real task failure, unscripted reactions | Before any high-stakes launch; whenever heuristic/self-critique findings need real-user confirmation | 5 users/round finds **~85%** of problems (Nielsen & Landauer's L≈31% model, [NN/g](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)); ~1–2 days to recruit + run + synthesize per round of 5 | Nothing structural — it's the reference method everything else approximates; costliest and slowest, so it doesn't scale to every iteration |

---

## 6. Failure modes — review blind spots

| Failure mode | What it looks like | Detect | Fix |
|---|---|---|---|
| Confirmation bias | Self-review concludes "looks good" suspiciously often; findings skew toward what was already planned to fix | Track the ratio of self-found Sev≥3 issues over iterations — near-zero after the first pass is suspicious, not reassuring | Force an adversarial check order: hunt for failures before being allowed to conclude success (§4.7); treat rubric checks as falsifiable claims, not a vibe scan |
| Curse of knowledge | Agent judges a label/flow as "obvious" because it wrote it | Ask: would this be equally clear with the intent/spec hidden? | Use the vision-proxy check on the rendered screenshot alone, not the spec (§4.6); flag to the human that real first-click/5-sec data is the honest next step for anything high-stakes |
| Aesthetic-usability effect (self-inflicted) | A polished-looking screen sails through review with few findings despite real flow problems | Score hierarchy and error-recovery *harder*, not softer, on anything that already looks strong (§4.7) | Explicitly re-run the hierarchy and error-path checks a second time on high-polish screens before shipping |
| Severity-averaging fallacy | Rubric total looks fine (e.g., 80/100) while one dimension hides a catastrophe | Check the floor rule, not just the total, every time (§4.6) | Apply the hard gate: any dimension < 10/25, or a hierarchy critical-fail trigger, caps the band regardless of total |
| Single-evaluator-as-ceiling | One self-review pass is treated as equivalent to a full panel | Compare findings against the known ceiling: a single evaluator finds ~35% of what a panel would (§4.3) | Where the architecture allows it, run 2–3 independent passes (different framing/persona) and reconcile; otherwise disclose "single-pass" explicitly |
| Checklist theater | Every rubric box gets ticked "pass" with no genuine adversarial effort — going through the motions | Spot-check: do findings ever come back Sev≥2? If a rubric never produces a real finding across many screens, the check isn't working | Require at least one explicit falsification attempt per dimension before a "pass" is accepted; sample-audit a subset of "clean" screens with a fresh pass |
| Banned-phrase leakage | Findings phrased as "looks clean," "feels off," "not great" with no location/principle/evidence | Scan findings text for banned phrases (§4.9) before logging | Reject and rewrite any finding that doesn't fit the Location→Observation→Principle→Evidence→Severity template |
| HiPPO / status override | A finding gets dropped or downgraded because a senior stakeholder waved it off, not because the evidence changed | Compare severity before/after a status-based objection with no new evidence attached | Anchor every severity to the 0–4 definitions (§4.3), not to who raised or dismissed it; log the override and its rationale |
| Testing only the happy path | Rubric run against demo content only; real/edge-length content breaks the layout later | Re-render with max-length, empty, and truncated content before scoring craft (§4.6) | Add realistic content-length variation as a standing craft check, not a one-off |
| Halo effect from one strong component | One excellent hero component makes the whole screen's review go easy | Score each dimension independently per screen area, not as a single holistic gut call | Keep the rubric's per-check structure explicit rather than collapsing to an overall impression first |
| Recency bias across a review session | The most recently reviewed screen gets judged relative to the previous one, not against the fixed rubric bar | Compare scores across a session for suspicious drift (all scores rising or falling together with no design change) | Score against fixed rubric criteria (§4.6), never "better/worse than the last one" |
| No-distancing self-critique | Agent reviews its own fresh output with no framing device, maximizing all of the above biases at once | Check whether the review step happened at all, and whether it used the rendered-only vision proxy vs. spec-informed reasoning | Always route hierarchy/craft checks through the rendered artifact, not the authoring context (§4.6); review "the design," not "my design" (linguistic distancing, §4.9) |

---

## 7. Pre-show checklist (the agent's self-critique, run before showing any screen)

- [ ] Ran a full 10-heuristic pass (§4.1) against every materially new or changed screen — not just the ones that "felt" relevant.
- [ ] Logged every violation with the Location → Observation → Principle → Evidence → Severity template (§4.9); zero findings phrased as "looks good/bad" with no evidence.
- [ ] Rated every finding 0–4 using frequency × impact × persistence (§4.3), not gut feel.
- [ ] Ran a cognitive walkthrough (§4.4) on every new/complex/multi-step task flow, asking all 4 questions at every real step.
- [ ] Where the architecture allows independent passes, ran ≥2 reviews with different framing/persona and reconciled — a single pass is disclosed as single-pass, not presented as complete (§4.3, §6).
- [ ] Scored **Hierarchy** (0–25): named the single primary action/message from the rendered screenshot alone, without reading the spec (§4.6).
- [ ] Scored **Consistency** (0–25): counted distinct color/spacing/type values actually in use against the declared token set (§4.6).
- [ ] Scored **Legibility** (0–25): checked size/line-height/line-length against the craft heuristics, and flagged — but did not adjudicate — any contrast/color-only-meaning risk for A5 (§4.6).
- [ ] Scored **Craft** (0–25): checked alignment, spacing rhythm, optical correction, and re-rendered with realistic (not demo) content lengths (§4.6).
- [ ] Checked non-happy-path states (empty/loading/error) exist and are styled to the primary state's standard (§4.6; content correctness owned by B2).
- [ ] Computed the total and applied the hard-gate rule: any dimension < 10/25, or a hierarchy critical-fail trigger, caps the band regardless of the raw total (§4.6).
- [ ] Any Severity-4 finding from the heuristic pass hard-blocks shipping, independent of the rubric score (§4.3, worked example A).
- [ ] Re-scored hierarchy and error-recovery specifically hard on any screen that already looks polished (aesthetic-usability-effect check, §4.7).
- [ ] Logged the rubric score and heuristic-severity counts for this iteration alongside prior iterations to track trend, not just a snapshot (§4.8).
- [ ] Confirmed every legibility/contrast flag is explicitly hedged as "flagged for A5" rather than stated as pass/fail (§2, §4.6).
- [ ] Confirmed no claim of "user-tested" or "validated" appears anywhere the check was actually a same-agent vision-proxy, not a real first-click/five-second test with a fresh human (§4.5, §4.7).
- [ ] If this is a high-stakes flow (checkout, sign-up, a destructive action, anything with a Sev-3+ history), flagged to the human owner that a real first-click and/or five-second test with real participants is the recommended next step (§4.5, §5).
- [ ] Every finding shown to the human owner uses the fixed template and avoids all of Nielsen's "Unlucky Thirteen" pitfalls (§4.9) — no unlabeled vague feedback, no undisclosed solutionizing presented as the only option.
- [ ] Any number quoted in this critique (a percentage, a benchmark, a study stat) is either traceable to a source in §9 or explicitly marked unverified (§8).
- [ ] Final band — **Ship / Ship-with-punch-list / Revise / Rebuild** — is stated explicitly before presenting anything to the human owner; never presented as "done" implicitly.

---

## 8. Open questions / unverified

- **The exact number of candidate heuristics considered before the 1994 factor analysis reduced them to 10** is not pinned down beyond "101 candidate principles" — the intermediate shortlist process wasn't independently verified here.
- **Cognitive walkthrough has no standardized "3–5 evaluators"-equivalent number** the way heuristic evaluation does; team size and step granularity are treated here as flexible, based on general HCI-practice writeups rather than a specific NN/g figure.
- **First-click and five-second sample-size guidance in this report ("tens of responses," "5–10 / 20+") is a practical convention**, not a verified NN/g minimum — verify before hard-coding a threshold into tooling.
- **Whether an agent's own vision-based look at its rendered screenshot is a valid statistical proxy for real first-click/five-second data is unverified**, and this report's position is that it is likely **not** equivalent (curse of knowledge, no real saccade/attention behavior) — treat rubric-based self-critique as risk reduction, not a replacement for real testing on anything consequential.
- **No widely-adopted canonical heuristic set specific to AI-generated/AI-assisted UI evaluation exists as of July 2026** — NN/g's own position re-applies the classic 10. This is a nascent area; expect it to firm up.
- **SUS's "68 average / analysis of 10,000+ responses" benchmark and the letter-grade curve** are widely repeated via MeasuringU's secondary synthesis of Bangor/Kortum/Miller-era research and Jeff Sauro's later grading-curve work; the underlying academic papers were not independently re-fetched for this report.
- **The Nielsen/Landauer "L≈31%, 5 users, ~85%" figure applies to usability testing with real users**; the separate "single evaluator finds ~35%" figure applies to expert heuristic evaluation. Both are real and sourced, and are correctly distinguished throughout this report (§4.3, §4.7) — but they are commonly conflated elsewhere online. Don't merge them.
- **MeasuringU's HE-vs-UT overlap/miss percentages** (36% overlap, 49% miss, 34% "unconfirmed") come from a specific comparative study design with a small sample and vary 9–46% / 30–43% across the studies it surveys — treat the point numbers as illustrative of a *range*, not a fixed constant.
- **Nielsen's cost-benefit example ("optimal ~4 evaluators, ~62× ROI")** is from one illustrative project in his own writeup — actual ROI is project-specific; don't quote 62× as a universal constant.
- **Shneiderman's Eight Golden Rules and Norman's action-cycle fundamentals** are summarized here from secondary sources (IxDF) and general knowledge of the primary texts (*Designing the User Interface*; *The Design of Everyday Things*) rather than a fresh page-level fetch of the original books — the content is well-established and low-risk, but page/edition-specific wording should be checked against a specific edition if quoting directly.

---

## 9. Sources

**Primary / authoritative:**
- [NN/g — 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) — the canonical list.
- [NN/g — How to Conduct a Heuristic Evaluation](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/) — method, evaluators, process.
- [NN/g — The Theory Behind Heuristic Evaluations](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/) — the math model, cost-benefit example.
- [NN/g — Severity Ratings for Usability Problems](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/) — the 0–4 scale.
- [NN/g — Usability Problems Found by Heuristic Evaluation](https://www.nngroup.com/articles/usability-problems-found-by-heuristic-evaluation/) — single-evaluator 35%/42%/32% stats.
- [NN/g — Evaluate Interface Learnability with Cognitive Walkthroughs](https://www.nngroup.com/articles/cognitive-walkthroughs/) — the 4 questions, process.
- [NN/g — Why You Only Need to Test with 5 Users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/) — Nielsen/Landauer model, L≈31%, 85%.
- [NN/g — The Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) — Kurosu & Kashimura 1995.
- [NN/g — Success Rate: The Simplest Usability Metric](https://www.nngroup.com/articles/success-rate-the-simplest-usability-metric/) — averaging-ordinal-data caveat.
- [NN/g — Usability Metrics](https://www.nngroup.com/articles/usability-metrics/) — effectiveness/efficiency/satisfaction metrics.
- [NN/g — UX Research Methods Glossary](https://www.nngroup.com/articles/research-methods-glossary/) — first-click and five-second definitions.
- [NN/g — Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) — 0.1s/1s/10s perceptual anchors.
- [NN/g — AI: First New UI Paradigm in 60 Years](https://www.nngroup.com/articles/ai-paradigm/) — AI-interface evaluation stance.
- [NN/g — Discount Usability: 20 Years](https://www.nngroup.com/articles/discount-usability-20-years/) — cost framing.
- Nielsen, J. & Molich, R. (1990), "Heuristic Evaluation of User Interfaces," *Proc. SIGCHI CHI'90*, Seattle, 249–256. [ACM DL](https://dl.acm.org/doi/10.1145/97243.97281).
- Nielsen, J. (1992), "Finding Usability Problems Through Heuristic Evaluation," *Proc. CHI'92*. [PDF mirror](https://course.ccs.neu.edu/is4300sp13/ssl/articles/p373-nielsen.pdf).
- Nielsen, J. & Landauer, T. K. (1993), "A mathematical model of the finding of usability problems," *Proc. INTERCHI'93*. [Semantic Scholar](https://www.semanticscholar.org/paper/A-mathematical-model-of-the-finding-of-usability-Nielsen-Landauer/245061d94c228abdc9bda2d9a10679e897526465).
- Wharton, C., Lewis, C., Rieman, J., & Polson, P. (1992), "Cognitive Walkthroughs: A Method for Theory-Based Evaluation of User Interfaces," *International Journal of Man-Machine Studies*, 36, 741–773. [PDF](http://sonify.psych.gatech.edu/~ben/references/polson_cognitive_walkthroughs_a_method_for_theory-based_evaluation_of_user_interfaces.pdf).

**Reference / secondary:**
- [MeasuringU — The Importance of the First Choice in Website Navigation](https://measuringu.com/first-choice/) — Bailey/MeasuringU/tree-test first-click stats.
- [MeasuringU — How Effective Are Heuristic Evaluations?](https://measuringu.com/effective-he/) — HE-vs-UT overlap/miss rates.
- [MeasuringU — 5 Ways to Interpret a SUS Score](https://measuringu.com/interpret-sus-score/) — SUS bands, grade curve.
- [MeasuringU — What Is A Good Task-Completion Rate?](https://measuringu.com/task-completion/) — 78% benchmark, quartiles.
- [Smashing Magazine — Five-Second Testing: Taking a Closer Look at First Impressions (Dec 2023)](https://www.smashingmagazine.com/2023/12/five-second-testing-case-study/) — five-second-test nuance/critique.
- [UserTesting — The Curse of Knowledge Effect](https://www.usertesting.com/blog/curse-of-knowledge) — definition, mitigations.
- [Baymard Institute — Readability: The Optimal Line Length](https://baymard.com/blog/line-length-readability) — 50–75/80-character guidance.
- [Jakob Nielsen (Substack) — How I Developed the 10 Usability Heuristics](https://jakobnielsenphd.substack.com/p/usability-heuristics-history) — origin/history, factor-analysis numbers.
- [Jakob Nielsen (UX Tigers) — How to Run a UX Design Critique](https://www.uxtigers.com/post/design-crit) — feedback framework, Unlucky Thirteen.
- [Jakob Nielsen (UX Tigers) — The 10 Usability Heuristics Reimagined](https://www.uxtigers.com/post/10-heuristics-reimagined) — unchanged-since-1994 confirmation.
- [Interaction Design Foundation — Shneiderman's Eight Golden Rules](https://ixdf.org/literature/article/shneiderman-s-eight-golden-rules-will-help-you-design-better-interfaces) — secondary summary of the rules.

**Books (primary texts, cited from general knowledge — verify edition-specific wording before direct quotation):**
- Krug, S. (2014), *Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability*, New Riders. [Author/publisher page](https://sensible.com/dont-make-me-think/).
- Shneiderman, B. & Plaisant, C., *Designing the User Interface: Strategies for Effective Human-Computer Interaction*, Pearson (successive editions) — original source of the Eight Golden Rules.
- Norman, D. (2013), *The Design of Everyday Things*, rev. & expanded ed., Basic Books (orig. 1988) — affordances, signifiers, feedback, conceptual model, gulf of execution/evaluation.

**Cross-referenced, owned elsewhere (not restated here):**
- WCAG 2.2 numeric success criteria and APCA's draft/advisory status — owned by **A5 Accessibility & inclusive design**.
- Token-architecture computed-style audits and ΔE tolerances — owned by **C2 Design systems, tokens & coherence**.
