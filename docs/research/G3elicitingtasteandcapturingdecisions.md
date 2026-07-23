# G3 — Eliciting taste & capturing decisions

*Design-intelligence reference. Track G3 of the registry research map. Written to be read by the design agent before it asks a non-designer to choose anything, and by a human owner auditing whether the resulting decisions actually stick. HCI/psychology evidence is cited where it exists; reasoned claims are flagged `[REASONED]` (same convention as G1) or called out inline.*

---

## 1. Scope line

This track owns **the mechanics of extracting a preference from someone who cannot describe what they want, and making that preference durable**: structuring choices as selections instead of open-ended description; sizing and framing choice sets so they don't fatigue or lead the person; converting contradictory verbal feedback into concrete intensity variants; recording every decision in a schema specific enough to survive a session boundary, an agent restart, or a hand-off to a different session; explicit locking and mechanical protection of locked work; and restating the system's interpretation back to the person before acting on it.

## 2. Boundary (what this track does **not** cover)

- **Generating the candidate options themselves** — how many variants to *produce*, guaranteeing they differ on one axis, the fidelity ladder, decision sequencing → **[G1 Variant generation & convergence](/home/claude/G1-variant-generation-and-convergence.md)**. G1's own boundary section states this split precisely: *"Capturing/locking the decision durably — decision ledgers, ADR-style records, restating-understanding, and the taste model behind a user's pick → G3."* G1 says *when* to lock and *how to scope regeneration around a lock* (its §4.9); G3 owns *what must be true before something is eligible to be locked*, and *the record*. A pool of variants G1 generates internally is not the same number as what G3 exposes to the person in one ask — see §4.2.
- **Judging whether a given option is any good** — heuristic evaluation, craft-quality scoring, ranking on merit → **G2 Critique**. G3 assumes options shown have cleared G2's bar; it only governs how the person reacts and what gets kept. (G2 does not yet exist as a written track at the time of this report — its scope is taken from the assigning brief, not independently verified against a sibling file.)
- **The actual visual-system mechanics being chosen between** — color, type, shape/material, motion, interaction states — → the **A-track and B-track** docs (e.g., shape/material, accessibility, motion, interaction states) that G1 itself defers to for "how to build" each axis. G3 is medium-agnostic: the same selection/lock/restate machinery applies whether the axis is a color token or an easing curve.
- **Multi-stakeholder / team sign-off decision-making.** This track is single-decider taste elicitation (one non-designer, one tool). Group-consensus techniques (dot voting, workshops) are cited below only for their *quantitative choice-budget logic*, not adopted as a multi-person process.

This boundary is MECE by pipeline stage, matching G1's own framing: **G1 makes options → G2 grades options → G3 elicits a reaction to options and records it durably → the A/B-track docs own what the chosen option is actually made of.** Within G3's own remit, choice-set **sizing** (§4.2), **framing** (§4.3), **contradiction-handling** (§4.4), the **decision-record schema** (§4.5/§5.2), **locking** (§4.6) and **restating** (§4.7) are themselves mutually exclusive stages of one elicitation event and collectively cover it end to end.

---

## 3. Executive rules

1. **Selection beats description — always render, never ask to describe.** Show 2–4 concrete, interactive variants and let the person react; do not open a visual decision with an open-ended "describe what you want" prompt. Stated preference correlates only weakly with what actually performs: **r = 0.44** between measured performance and stated liking for PC applications (Nielsen & Levy, 1994), **r = 0.53** in newer web-based research — meaning stated liking explains at best roughly a quarter to a third of the variance in what actually works ([NN/g: First Rule of Usability? Don't Listen to Users](https://www.nngroup.com/articles/first-rule-of-usability-dont-listen-to-users/)). Reserve free text for the residual that genuinely cannot be shown (brand name, forbidden colors, legal/compliance constraints) — *the size of that residual (this report estimates ~15–25% of intake questions) is a reasoned estimate, not a measured figure* `[REASONED]`.
2. **Default choice-set size is 3, hard ceiling 5**, matching G1 §4.4's own option-count table (2 = binary/confirm, 3 = default, 4–5 = wide/early/foundational only, 6+ = never for a single decision). Hick's/Hick–Hyman Law (`RT = a + b·log₂(n+1)`) means decision time grows only logarithmically with option count — doubling options doesn't double time — but the law itself specifies **no maximum**; "3, ceiling 5" is a synthesis from adjacent evidence (dot-voting's ~1-vote-per-4-options ratio, §4.2; Miller/Cowan working-memory limits on holding several items for comparison), not a value Hick's Law itself states ([Hick's Law](https://en.wikipedia.org/wiki/Hick%27s_law); [IxDF: The Hick-Hyman Law](https://ixdf.org/literature/article/the-hick-hyman-law-an-argument-against-complexity-in-user-interface-design)) — see §8.
3. **Raw option *count* is not what causes overload — comparison *difficulty* is.** The most rigorous available evidence, a meta-analysis of 63 conditions across 50 experiments (n = 5,036), found a mean choice-overload effect of **d = 0.02** — essentially zero overall. Reliable overload appears only when moderators are present: options are **hard to compare on many attributes, the chooser has no prior preference/expertise, they are under time pressure, or they must justify the choice later** ([Scheibehenne, Greifeneder & Todd, 2010](https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf)). This tool's audience — design-naive people comparing multi-attribute visual options, often without domain expertise — matches several of those moderators directly; treat overload as a real risk **for this specific audience**, not because "more than N options is bad" as a general law. G1 explicitly hands this debate to G3 (G1 §8: *"Choice-overload magnitude is contested in the literature — G3 owns that debate"*).
4. **Never label options by evaluation.** Use neutral tokens (**A / B / C**, or plain numbers) — never adjective pairs like "the modern one" vs. "the classic one," or "clean" vs. "busy." Swapping value-laden wording for the identical underlying question produced a **37-point swing** (38% → 61% agreement) in documented professional survey research; neutral phrasing narrowed the same question to a 20%/48% split ([YouGov: How leading questions and acquiescence bias can impact survey results](https://yougov.com/en-gb/articles/45308-how-leading-questions-and-acquiescence-bias-can-im)).
5. **Never pre-highlight a "recommended" option in a taste-elicitation choice.** An arbitrary, disclosed-as-irrelevant anchor (a roulette wheel result) shifted numeric estimates from ~25% to ~45% in the foundational anchoring experiment ([Tversky & Kahneman 1974, via Wikipedia: Anchoring effect](https://en.wikipedia.org/wiki/Anchoring_effect)). A highlighted default in a choice UI functions the same way — it pulls selections toward it regardless of fit, and the effect persists even when people are told the anchor is arbitrary.
6. **Randomize slot/position across repeated symmetric choices.** Items shown first are evaluated more favorably independent of content — shown for trait-description ordering and extended to sequential choice as "outcome primacy" ([Serial-position effect](https://en.wikipedia.org/wiki/Serial-position_effect)). This sourced primacy mechanism grounds G1's own Rule 13, which flags order/centre bias as `[REASONED]` without citation — G1's *centre-bias* half (middle options over-picked) is not independently verified in this report and should still be read as G1's reasoned claim, not a G3-sourced one.
7. **Prefer forced relative choice over absolute self-rating for direction-finding.** People are unreliable at consistent absolute ratings but comparatively good at "which of these do I prefer" — the logic behind best-worst/MaxDiff scaling in market research ([Displayr: What is MaxDiff?](https://www.displayr.com/what-is-maxdiff/)). Reserve intensity sliders and Likert-style scales for **refining a direction already chosen**, not for discovering the direction itself ([NN/g: Rating Scales in UX Research](https://www.nngroup.com/articles/rating-scales/)).
8. **Budget for session-level fatigue separately from per-choice-set fatigue.** Even small (3–5 option) choice sets compound across a session: after roughly **5–8 consecutive decision points**, insert a "here's what's locked so far" recap rather than a ninth cold ask. This is a **soft, directional heuristic, not a proven hard threshold** — the flagship evidence for decision fatigue (judges' parole-ruling favorability drifting from ~65% toward 0% across a session, resetting after a break) has been disputed as a possible case-scheduling artifact, and the broader "ego depletion" mechanism largely failed a 23-lab preregistered replication ([Hagger et al., 2016](https://journals.sagepub.com/doi/10.1177/1745691616652873); [Decision fatigue](https://en.wikipedia.org/wiki/Decision_fatigue)) — budget for it; do not present it as settled science. See §8.
9. **Turn contradictory feedback into an intensity axis, not a verbal standoff.** If two pieces of feedback about the same component read as opposite ("more minimal" / "more expressive"), they usually describe two points on one un-named axis (density, ornamentation, saturation…), not a true contradiction. Name the axis, generate 3 concrete points on it, and let a new *selection* resolve it (§4.4, worked example). This generalizes a move G1 already makes for same-axis **mix** conflicts (G1 §4.7 / Worked Example C: reject the impossible blend, "offer a third density point between them instead") to verbal feedback more broadly.
10. **Record the concrete value, never the description.** A decision-ledger entry stores `radius.md = 8px (token --radius-md)`, not "the rounder one" — descriptions decay and are ambiguous across a session boundary; a token or snippet reference is replayable by a different agent instance with zero interpretation loss. This is the discipline Architecture Decision Records apply to engineering choices, adapted here to visual ones ([Nygard ADR template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)).
11. **Record what was rejected with the same rigor as what was chosen**, plus a one-line rationale tied to an **observable reaction** ("picked B over A, unprompted"; "said 'too playful,' selected the lower-intensity step"), never an inferred trait ("prefers minimalism"). People's own verbal explanations of their choices are unreliable: in the choice-blindness paradigm, participants confidently produced detailed justifications for choices they had not actually made, after an undetected swap of the chosen item ([Johansson, Hall, Sikström et al. — choice blindness](https://www.lucs.lu.se/fileadmin/user_upload/lucs/2011/01/Choice-Blindness-summary.pdf)) — anchor rationale in what was shown and picked, never in a theory about *why*.
12. **Lock status is binary, explicit, and earned — never implied by a first click.** Promote a selection from **provisional** to **locked** only on an explicit confirm, or after it survives one full re-exposure unchanged. G3 owns *earning* the lock (this rule); G1 §4.9 owns *enforcing* it mechanically (locked = frozen constant, passed verbatim into later generation, diffed as a golden file after every rebuild). Cross-ref **G1 §4.9**: regeneration must read lock-status as a hard filter on its randomization space, not a soft hint.
13. **Make unlocking harder than locking.** Treat "protect committed work" as the cheap, default-friction action and "reopen committed work" as the one that deserves a confirm step — the same asymmetry Amazon's "Type 1 / Type 2," one-way-door/two-way-door framing recommends for consequential vs. reversible decisions generally ([Bezos, 2015 Letter to Shareholders](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)): a locked decision, once made, should require more ceremony to reopen than it took to make. G1 §4.9 independently states the same rule from the generation side: *"A wanted change to a locked item is a re-open, not a regen."*
14. **Restate the concrete interpretation and get an explicit confirm before acting on it** — and before propagating it anywhere beyond the exact surface it was tested on. This mirrors "member checking" / respondent validation in qualitative research, where an interpretation is reflected back to its source for correction before being treated as fact ([Member check](https://en.wikipedia.org/wiki/Member_check)). Silent generalization — "you liked rounded corners on the button, so I rounded everything" — is a distinct, separately-confirmable step, not a free inference from one pick (§4.7).

---

## 4. Body

### 4.1 Why selection, not description?

The tool's entire premise is that the person **cannot describe visuals in words** — but it's worth being precise about *why* asking anyway fails, because the reasons determine what the fallback text channel is allowed to be used for.

| Reason | Evidence | Implication for G3 |
|---|---|---|
| **Stated preference weakly predicts actual fit.** | Nielsen & Levy (1994): **r = 0.44** between measured performance and stated preference across studies of PC applications; NN/g reports **r = 0.53** in newer web-based research ([NN/g](https://www.nngroup.com/articles/first-rule-of-usability-dont-listen-to-users/)). | Even a fluent verbal answer ("I want something modern and clean") would only weakly predict what actually works — the problem isn't just that non-designers lack vocabulary, it's that verbal preference is a noisy signal *in general*. |
| **People confabulate reasons for choices they didn't make.** | Choice-blindness experiments: after a covert swap of the chosen item, most manipulations went undetected, and participants readily gave confident, detailed justifications for the (different) item they ended up with ([Johansson, Hall, Sikström et al.](https://www.lucs.lu.se/fileadmin/user_upload/lucs/2011/01/Choice-Blindness-summary.pdf)). | Don't trust a person's *verbal explanation* of why they like something as ground truth — trust the *selection itself*, made against a real, shown artifact. Rationale fields in the decision ledger (§4.5) should record the observable act, not the self-report of motive. |
| **Self-report is more reliable *after* real use, on *motivational* questions.** | NN/g: pre-use judgments of alternatives lean on surface features, not usability; self-report works for "why are you here today"-style questions asked in context ([NN/g](https://www.nngroup.com/articles/first-rule-of-usability-dont-listen-to-users/)). | Text input in this tool should be reserved for **facts a render can't surface** (brand name, must-avoid colors, compliance constraints, "we already have a logo, match it") — not for aesthetic judgment, which belongs in selection. |
| **Forced relative choice extracts a cleaner signal than absolute self-rating**, especially from people without a vocabulary for the thing being rated. | Best-worst/MaxDiff scaling in market research is built on this premise ([Displayr](https://www.displayr.com/what-is-maxdiff/)). | Default interaction mode = **pick among rendered options**, not "rate this on a scale of 1–10" for a *direction-finding* question. Scales are for **intensity of an already-chosen direction** (§4.4, §5.1), not for finding the direction. |

**Applied rule:** the default interaction is *render + react* (click, drag, toggle, swipe). A free-text box is a fallback for the non-visual residual, not the default input mode — its presence should never be the first thing asked when the decision is visual.

### 4.2 How many choices before fatigue sets in?

This is the numbers-heavy question, and it's also where popular UX writing over-claims. The table below separates what's actually measured from what's synthesized.

| Source | What it actually measured | Number | Caveat |
|---|---|---|---|
| **Hick's Law** (Hick 1952 / Hyman 1953) | Choice reaction time vs. number of equally-likely options | `T = b·log₂(n+1)`; time grows **logarithmically** — each doubling of options adds a roughly fixed time increment, not a doubling of time | No universal "max options" figure in the law itself; explicitly does not specify a threshold — applies best to *unordered, unfamiliar* option sets, weakens once users can use scanning/sorting strategies ([Hick's Law](https://en.wikipedia.org/wiki/Hick%27s_law); [IxDF](https://ixdf.org/literature/article/the-hick-hyman-law-an-argument-against-complexity-in-user-interface-design)) |
| **Miller's "magic number 7±2"** (1956) | **Working-memory span** — how many items a person can hold at once — **not** choice/decision time | ~7 items; later work (Cowan) revises the practically-useful limit closer to **~4** for effortful concurrent processing | Frequently conflated with Hick's Law in popular UX writing; it's a different phenomenon (memory capacity, not reaction time) — cited here only as a loose rationale for why comparing *many* multi-attribute visual options at once is hard, not as a hard ceiling `[REASONED application]` ([Miller's law](https://en.wikipedia.org/wiki/Miller%27s_law)) |
| **Iyengar & Lepper, 2000** ("jam study") | Purchase behavior with 6 vs. 24 unfamiliar options in a real retail setting | **40%** (104/260) stopped at 6 options vs. **60%** (145/242) at 24 options; but **30%** (31) of the 6-option stoppers purchased vs. only **3%** (4) of the 24-option stoppers | Single, famous, large-effect study in a consumption context; the magnitude is illustrative of the *phenomenon* (extensive choice can suppress commitment via satisficing and anticipated regret), not a transferable number for a design-tool UI ([Iyengar & Lepper, 2000, PDF](https://faculty.washington.edu/jdb/345/345%20Articles/Iyengar%20&%20Lepper%20(2000).pdf)) |
| **Scheibehenne, Greifeneder & Todd, 2010** (meta-analysis) | Choice overload across 63 conditions, 50 experiments, n = 5,036 | Mean **d = 0.02** (95% CI −0.09 to 0.12) — no reliable average overload effect | The rigorous correction to the jam study's fame: overload is **not** a simple function of count. It reliably appears only with the moderators in Executive Rule 3 (comparison difficulty, no prior preference, time pressure, justification burden) — apply the moderators, not a raw number ([Scheibehenne et al. 2010](https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf)) |
| **NN/g dot voting** | Group prioritization exercises | Recommends **~1 vote per 4 options** offered | A design heuristic for group workshops, not a controlled experiment; adapted here only as supporting logic for "budgets should shrink faster than option count," relevant to the mix-and-match technique's selection budget (§5.1) ([NN/g: Dot Voting](https://www.nngroup.com/articles/dot-voting/)) |
| **Decision fatigue** (Danziger, Levav & Avnaim-Pesso, 2011, parole rulings) | Favorable-ruling rate across a judge's decision session | ~**65%** favorable at session start, drifting toward **~0%** before a break, resetting to **~65%** after ([Decision fatigue](https://en.wikipedia.org/wiki/Decision_fatigue); [PNAS reply defending the finding](https://www.pnas.org/doi/10.1073/pnas.1018033108)) | **Contested.** A published critique argued the pattern could reflect case-scheduling rather than fatigue ([Weinshall-Margel & Shapard, PNAS 2011](https://www.pnas.org/doi/10.1073/pnas.1110910108)); the authors replied defending the original causal claim. Independently, the broader ego-depletion mechanism the effect is usually explained by returned **"not significantly different from zero"** in a 23-lab preregistered replication ([Hagger et al. 2016](https://journals.sagepub.com/doi/10.1177/1745691616652873)). Use directionally only. |

**Synthesis rules** (this report's numbers, not a single citable study) `[REASONED]`:

- **Per choice set: 3 default, 5 hard ceiling** before restructuring into rounds or an intensity ladder (matches G1 §4.4 exactly).
- **Per session: ~5–8 sequential decision points** before forcing a recap checkpoint (§4.5) rather than a cold ninth ask.
- **Compounding rule:** ten small, easy 3-option choices back-to-back are *not* free just because each set is small — session-level budget and per-set budget are tracked independently, and either one alone can trigger a break/recap.
- Once the tool has real usage telemetry (selection latency, abandonment rate, re-generation requests per session), these synthesized numbers should be replaced with measured ones specific to this product — see §8.

### 4.3 How do we ask without leading the witness?

Three distinct bias mechanisms show up in choice framing, each with its own fix:

| Bias | What it does | Evidence | Fix |
|---|---|---|---|
| **Leading/loaded wording** | Value-laden phrasing shifts the answer toward the wording's implied valence | Identical underlying question swung **38% → 61%** agreement (a 37-point move) purely from wording; a neutral phrasing produced a **20%/48%** split ([YouGov](https://yougov.com/en-gb/articles/45308-how-leading-questions-and-acquiescence-bias-can-im)) | Neutral tokens only (**A/B/C**); if captions are needed, use paired **non-evaluative** descriptors ("more whitespace" vs. "denser layout"), never evaluative ones ("clean" vs. "busy") |
| **Anchoring from a highlighted/default option** | An arbitrary reference point pulls subsequent judgment toward it | Roulette-wheel anchor shifted estimates from **~25% to ~45%** depending on an admittedly-random starting number ([Tversky & Kahneman, via Wikipedia](https://en.wikipedia.org/wiki/Anchoring_effect)) | No "recommended" badge, no pre-selected radio button, no visually emphasized option in a taste-elicitation choice |
| **Position/order bias (primacy)** | Earlier-presented items are evaluated more favorably independent of content | A trait-order study found subjects rated the same person more positively when positive traits were listed first vs. last; "outcome primacy" extends the effect to sequential choice ([Serial-position effect](https://en.wikipedia.org/wiki/Serial-position_effect)) | Randomize slot assignment for anything structurally symmetric, on every repeat presentation, not just the first time |
| **Acquiescence bias** | Agree/disagree framings pull toward agreement regardless of content | Balancing the statement barely moved results (22%→24%); switching to a **forced-choice** format ("too little / too much / about right") dropped the biased response by 5 points ([YouGov](https://yougov.com/en-gb/articles/45308-how-leading-questions-and-acquiescence-bias-can-im)) | Prefer forced relative choice (§4.1, §5.1) over agree/disagree constructions for taste questions |

**Worked before/after:**

- **Leading:** *"Would you like the clean, modern version, or the busy, cluttered version?"*
- **Neutral:** Two unlabeled renders side by side, captioned only **"A"** / **"B"**, with any supporting caption limited to a non-evaluative fact ("more whitespace" / "more content per screen") rather than a verdict.

### 4.4 What do we do with contradictory feedback?

People's feedback contradicts itself constantly — not because they're inconsistent, but because they're describing a *reaction*, not naming an *axis*. "Make it more playful" followed later by "this feels too playful now" is not a logical contradiction once you notice both statements are pointing at different points on the *same* one-dimensional axis (here: ornamentation/playfulness intensity).

**The mechanism:**

1. **Detect.** Two feedback signals touch the same component and read as opposed in valence.
2. **Name the axis.** Map both statements onto one continuous, nameable dimension (density, ornamentation, saturation, formality, whitespace, contrast, motion-amount…) rather than treating them as two competing verbal demands to arbitrate.
3. **Generate 3 concrete points on that axis** — not just the two extremes implied by the two comments — and re-expose them as a **selection**, per §4.1, never as a request to verbally reconcile the contradiction ("did you mean X or Y?").
4. **Let the pick collapse the contradiction.** The new selection becomes the active locked value; both prior feedback signals stay in the ledger as historical context, marked `superseded_by` the new decision — audit trail preserved, nothing silently deleted (§4.5 schema).

This generalizes a move G1 already makes one level down, for **mix conflicts** rather than verbal feedback: when a user tries to combine two mutually exclusive levels of the same axis from two different variants, G1 rejects the blend and "offer[s] a third density point between them instead" (G1 §4.7, Worked Example C). It is also the designated escape valve for G1's own round-cap: when 2–3 generation rounds on one axis fail to converge, G1 explicitly escalates to G3 (G1 §4.8) — that escalation should land here.

**Worked example A — contradictory feedback → intensity ladder** (copyable):

```yaml
# Worked example A — contradictory feedback resolved as an intensity ladder
signal_1:
  timestamp: "2026-07-23T13:40:00Z"
  component: button.style
  user_said: "make it more playful"
  action_taken: "corner-radius 4px -> 16px, added spring-bounce on press"
signal_2:
  timestamp: "2026-07-23T13:52:00Z"
  component: button.style
  user_said: "this feels too playful now, tone it down"
detected_axis: "ornamentation-intensity (radius + motion emphasis) -- not a true contradiction"
generated_ladder:
  - step: 1
    label: "Subtle"
    tokens: "radius=4px, no bounce"
  - step: 2
    label: "Balanced"
    tokens: "radius=8px, ease-out 100ms, no overshoot"
  - step: 3
    label: "Playful"
    tokens: "radius=16px, spring bounce (zeta ~= 0.5)"
presentation: "3 real interactive buttons, captioned only 'Step 1/2/3', slot order randomized"
resolution: "user selects step 2 -> new locked decision dec-2026-07-23-002;
             signal_1 and signal_2 remain in the ledger, superseded_by: dec-2026-07-23-002"
```

Note what this is *not*: it is not asking "so which did you mean, playful or not playful?" — that re-opens the same unproductive verbal exchange that produced the contradiction. It replaces the question with a render.

### 4.5 What must a decision record contain to survive a session boundary?

A "session boundary" here means any of: the process restarts, the context window resets, a tab closes and reopens, the work is handed to a different agent instance, or the person simply returns days later. None of these should force re-asking a question that was already answered, and none should risk a locked decision drifting because the new session "interpreted" a vague record differently than the last one did.

| Must capture | Why concrete, not descriptive | Failure if omitted |
|---|---|---|
| **Stable id** | A later session needs a durable handle to look up, reference, or supersede this exact decision | "Which decision was that?" — no reliable way to reference it again |
| **Component / axis** | Scopes *exactly* what's decided (a dotted path, e.g. `button.corner-radius`), preventing silent over-generalization | Decision bleeds into surfaces it was never confirmed for |
| **Chosen value** | A concrete token/snippet/hex/spacing-step reference, never a description like "the rounder one" | Ambiguous across agent instances; not replayable without re-interpretation |
| **Rejected alternatives (with why)** | Prevents regeneration from re-offering something already declined; shows the range actually considered | User re-shown an option they already rejected — reads as "it's not listening" |
| **Rationale** | One line, tied to an **observable reaction**, not an inferred trait (§ Executive Rule 11) | Unfalsifiable inference ("prefers minimalism") drives future decisions on a guess |
| **Intensity** (if applicable) | Numeric/ordinal position on a named axis, so a later "a bit more of that" has something to increment from | Axis has to be re-derived from scratch next time it comes up |
| **Timestamp** | ISO 8601; establishes recency and supersession order | Can't tell which of two contradictory notes is the newer, governing one |
| **Lock status** | `provisional` / `locked` / `superseded` — gates whether regeneration may touch this (§4.6) | Accidental overwrite of something the person already committed to |
| **Scope** | `instance` / `component` / `global-token` — controls blast radius | A locked button radius silently reshapes every card and input |
| **Confirmed flag + the restatement text shown** | Proof that §4.7's restate-before-acting step actually happened, and what exactly was confirmed | No evidence the system checked its interpretation; "it did something I never agreed to" complaints are undebuggable |
| **Session/provenance id** | Which run/session made this call | Can't trace or debug which agent instance is responsible for a given entry |

The full schema and a filled worked example are in §5.2 — this table is the *why*; §5.2 is the *what, exactly*.

### 4.6 How does locking actually work, and what protects it?

Locking is a two-part contract split cleanly across two tracks:

- **G3 (this track) owns *earning* a lock** — the elicitation and confirmation discipline that promotes a selection from provisional to locked, and the durable record of that promotion.
- **G1 owns *enforcing* a lock mechanically** — once something is locked, G1 §4.9 treats it as a "frozen constant, not re-derived," passed verbatim into any later generation, and runs a regression gate after every rebuild that diffs locked components against their locked snapshot, reverting any drift.

**State model:**

| State | Set by | Regeneration may touch it? | Promotion path |
|---|---|---|---|
| **Provisional** | First selection in a choice set | Yes — freely regenerated as the user keeps exploring | Explicit confirm, **or** survives one full re-exposure unchanged, → `locked` |
| **Locked** | Explicit confirm action | **No** — G1's regression gate reverts any drift on a locked node | Only via an explicit unlock (below); never silently |
| **Superseded** | A later decision on the same axis is locked | N/A — historical record only, kept for audit trail | — |

**Protecting locked work concretely mirrors a shipped, verifiable pattern:** Figma's own layer lock behaves exactly this way — a locked layer "can't be moved or interacted with" on the canvas, but remains **visible, selectable in the layers panel, and inspectable**; locking a parent frame or group **cascades the lock to every child**, and children cannot be individually unlocked while the parent stays locked ([Figma: Lock and unlock layers](https://help.figma.com/hc/en-us/articles/360041596573-Lock-and-unlock-layers)). This is cited as an *existence proof* that "locked but still visible/inspectable, cascading to children" is implementable and already shipped in a general-purpose design tool — not as a recommendation to depend on Figma itself.

**Asymmetric friction (lock vs. unlock):** locking should be the cheap, low-friction default action (protecting work costs little); unlocking should cost more — a confirm step naming exactly what becomes eligible for regeneration again ("this will make the previously-locked Button radius eligible for change again — continue?"). This mirrors the "Type 1 / Type 2," one-way-door/two-way-door asymmetry: reopening a commitment deserves more ceremony than making a reversible tweak ([Bezos, 2015 Letter to Shareholders](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)). G1 §4.9 states the equivalent rule from the generation side verbatim: *"A wanted change to a locked item is a re-open, not a regen."*

**The cross-track contract, stated precisely:** G3's decision ledger (§5.2) is the source of truth G1's "locked = frozen constant" mechanism reads from. G1 does not re-derive lock status; it consumes the `lock_status` field G3's confirm step wrote.

### 4.7 How and when do we restate understanding before acting?

Two separate reasons converge on the same rule. First, methodologically: reflecting an interpretation back to its source for correction before treating it as fact is a named, standard qualitative-research practice — "member checking" or respondent validation — precisely because researchers' interpretations of what someone meant are often wrong in specific, correctable ways ([Member check](https://en.wikipedia.org/wiki/Member_check)). Second, empirically: people's own verbal accounts of their choices are not reliable enough to skip this step — the choice-blindness research shows people will confidently justify a choice they didn't actually make, once it's presented back to them as if they did ([Johansson, Hall, Sikström et al.](https://www.lucs.lu.se/fileadmin/user_upload/lucs/2011/01/Choice-Blindness-summary.pdf)). Together: restate in terms anchored to the **shown artifact and the concrete value**, not a paraphrase of presumed intent, and require an explicit confirm.

**Two tiers:**

| Tier | Trigger | What gets restated | Example |
|---|---|---|---|
| **Micro** | Every single decision, immediately | The concrete token/value and its exact scope | *"Locking Button corner radius at 8px (token `--radius-md`), applied to Button only. Correct?"* |
| **Macro (session recap)** | Session start after a boundary, or every 5–8 decisions (§4.2) | Everything locked so far, grouped, in plain terms tied to tokens | *"So far this session: Button radius locked at 8px. Primary color locked at `#2E5EFF`. Card shadow is provisional at intensity 2/3 — not yet confirmed."* |

**The generalization anti-pattern:** the most common source of "it did something I never agreed to" is silent scope expansion — applying a locked decision to a new surface it was never tested on ("you liked rounded corners on the button, so I rounded the cards and inputs too"). G1's own Worked Example C shows the correct pattern already, one level down: after composing an orthogonal mix, it *"confirms it's a new candidate the user hasn't literally seen, and re-shows it once for confirmation before locking"* (G1 §4.10). G3's rule generalizes that: **any scope expansion — mix, generalization, or propagation to a new component — is its own restate-and-confirm step**, never a silent inheritance from an earlier, narrower lock.

---

## 5. Options catalogue

### 5.1 Elicitation techniques

Columns: **technique · what it extracts · when to use · fatigue cost · pitfalls.**

| Technique | What it extracts | When to use | Fatigue cost | Pitfalls |
|---|---|---|---|---|
| **Binary this-or-that (forced pairwise)** | A single relative preference between two concrete options, with maximum signal clarity | Confirming between two survivors; genuinely dichotomous axes (light/dark, serif/sans); grounded in best-worst/forced-choice research as the cleanest relative-preference signal ([Displayr: MaxDiff](https://www.displayr.com/what-is-maxdiff/)) | **Lowest per decision** — `n=2` is the floor of Hick's Law's `log₂(n+1)` curve | False dichotomy on a genuinely continuous axis (hides the middle); overuse across many unrelated pairs still compounds session fatigue (§4.2) |
| **A/B/C selection (3–5 option single-pick)** | A point on a continuous axis, plus the shape of the person's preference across the spread (poles + middle reveals gradient) | The **default** technique for any continuous visual axis (density, emphasis, roundness) — matches G1 §4.4's default count of 3 | Moderate — grows log₂(n+1) per Hick's Law; middle-of-range options add real but diminishing time | Leading labels (§4.3); un-randomized slot order (§4.3); options too similar to discriminate (fails G1's axis-diff gate before it even reaches G3) |
| **Intensity slider / stepped ladder** | Fine position on an *already-identified* axis — "how much more/less of X" | Refining a direction already chosen via selection; resolving contradictory feedback (§4.4); NOT for discovering the axis itself | Low per-use, but semantic-differential-style scales need well-chosen endpoint labels or the signal degrades | Endpoint labels that aren't true opposites degrade the scale ([NN/g: Rating Scales](https://www.nngroup.com/articles/rating-scales/)); continuous sliders with no discrete anchor points make it hard for a non-designer to know where "normal" is — prefer 3–5 discrete stepped points over a free-drag slider |
| **Mix-and-match (component-level, budget-constrained)** | Cross-component preference in one interaction — which parts of several candidates the person would keep | Once 2–3 individually-strong candidates exist and no single one is a clean overall winner; the person's selections feed G1's own orthogonal-mixing logic (G1 §4.7) — G3 owns *how the person expresses* the multi-pick, G1 owns *how the system composes it* | **Highest** of the render-based techniques — evaluating N components × M candidates is combinatorially heavier; cap the selection budget (dot-voting's ~1-per-4 ratio is a reasonable adapted guide, §4.2) | Same-axis conflicts (two mutually exclusive picks) must be caught and resolved as an intensity choice, not silently "averaged" (G1 §4.7); incoherent token combinations need a coherence check before lock |
| **Swipe / rapid like-dislike** | Coarse directional signal across *many* candidates quickly, useful for early style/taste-space mapping | Very early, wide, cheap exploration (G1's fidelity rung 0) — never for a final, high-stakes lock; a real shipped example of pure selection-based training exists in Khroma's color tool, where a person "chooses 50 colors" to train a personalized palette generator, with **no** description step ([Khroma](https://www.khroma.co/train) — free web tool; cited as an existence proof of the pattern, source availability not independently verified) | Low per-item, but volume (dozens of swipes) adds up — track as session-level fatigue (§4.2), not per-item | Rapid low-friction taps can produce noisy/inattentive data; needs a higher item count before signal is trustworthy, which itself raises the session-fatigue question |
| **Ranked choice / drag-to-rank** | Full ordinal preference across a set, more information-dense than a single pick | Small sets (3–4) where relative *order* matters, not just the top pick (e.g., "which 3 layout directions are worth pursuing, in order") | **Higher** than single-pick — ranking N items is cognitively heavier than picking 1 of N | Rarely worth the cost above 4–5 items; degrades to noise past that; don't use as the default when a single pick would answer the actual question |
| **Structured reaction on a rendered artifact** (thumbs/reaction chips) | Lightweight signed feedback on a specific, already-built artifact | Post-hoc reaction capture on a near-final surface — adjacent to **G2 Critique**'s territory; G3 owns turning the reaction into a recorded, resolvable decision, not judging the artifact's quality | Very low per-use | Reaction alone ("👎") carries no axis information — must be paired with a targeted follow-up selection (never an open "why?") to become actionable |
| **Open-text residual capture** | Non-visual facts a render cannot surface: names, must-avoid constraints, compliance/legal facts, references to an existing asset | Only for the ~15–25% residual that genuinely isn't visual (§4.1) `[REASONED estimate]` | N/A — not a taste-fatigue channel, but a *wrong-default* cost if overused: defaulting to text for a visual question reintroduces the weak-correlation problem (§4.1) | The most commonly overused technique — teams reach for a text box because it's cheap to build, not because it's the right elicitation channel |

### 5.2 Decision-record schema

The schema exists to answer one question reliably, from any future session: **"what, exactly, was decided, why, and is it still in force?"** — without re-deriving it from a natural-language history.

| Field | Type / format | Required | Purpose | Anti-pattern it prevents |
|---|---|---|---|---|
| `id` | Stable slug, e.g. `dec-2026-07-23-001` | Yes | Durable lookup/reference across sessions | "Which decision was that?" ambiguity |
| `component_axis` | Dotted path, e.g. `button.corner-radius` | Yes | Scopes exactly what is decided | Over-broad silent generalization |
| `chosen_value` | Concrete token/snippet reference, e.g. `radius.md = 8px (--radius-md)` | Yes | Replayable without re-asking or re-interpreting | "The blue one" ambiguity across sessions/agents |
| `rejected_alternatives` | List of `{value, why_rejected}` | Yes | Prevents re-offering a declined option; documents the range considered | Regeneration re-proposes something already declined |
| `rationale` | One line, tied to an **observable** reaction | Yes | Human-auditable context without unfalsifiable inference | "Prefers minimalism" — an inferred trait, not a fact |
| `intensity` | Numeric/ordinal position on a named axis | If applicable | Supports later relative nudges ("a bit more of that") | Re-deriving the axis from scratch each time |
| `timestamp` | ISO 8601 | Yes | Establishes recency / supersession order | Can't tell which of two contradictory notes is newer |
| `lock_status` | Enum: `provisional` / `locked` / `superseded` | Yes | Gates whether regeneration may touch this (§4.6) | Accidental overwrite of committed work |
| `scope` | Enum/list: `instance` / `component` / `global-token` | Yes | Controls the blast radius of the decision | Locked button radius silently reshapes all cards |
| `supersedes` / `superseded_by` | Nullable id reference | No | Contradiction/change audit trail (§4.4) | Losing history when a decision changes |
| `confirmed` + `confirmation_text_shown` | Boolean + string | Yes | Proof the restate-before-act step (§4.7) actually happened | "It did something I never agreed to" is undebuggable |
| `session_id` | Session/agent run identifier | Yes | Traceability across a session boundary | Can't tell which run is responsible for an entry |

This schema is this report's own synthesis, built on the **discipline** of Architecture Decision Records — Nygard's minimal `Title / Status / Context / Decision / Consequences` ([Nygard ADR template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)) and the richer **MADR** format, which adds `Decision Drivers`, `Considered Options`, and per-option pros/cons ([MADR](https://adr.github.io/madr/), license **MIT OR CC0-1.0**) — adapted from software-architecture decisions to visual/token decisions. No single existing open-source schema for *AI design-tool taste elicitation* was found; if the product wants a literal file-based ledger, MADR's markdown-plus-front-matter format is a solid, free, open basis to start from. If it wants CLI tooling over such a ledger, **adr-tools** ([npryce/adr-tools](https://github.com/npryce/adr-tools), **GPL**) and **log4brains** ([thomvaill/log4brains](https://github.com/thomvaill/log4brains), **Apache-2.0**) demonstrate the pattern (new/supersede commands, searchable published history) — both are built for git-backed software repos, so treat them as **prior art to borrow the schema and discipline from**, not as drop-in dependencies for an interactive design tool's internal state store.

**Worked example B — a filled decision-ledger entry that survives a session boundary** (copyable):

```yaml
id: dec-2026-07-23-001
component_axis: button.corner-radius
chosen_value: "radius.md = 8px (token: --radius-md)"
rejected_alternatives:
  - value: "radius.sm = 4px (token: --radius-sm)"
    why_rejected: "shown in 3-way A/B/C selection; user picked B (this entry) over A unprompted"
  - value: "radius.xl = 20px (token: --radius-xl)"
    why_rejected: "shown as intensity-ladder step 3 during contradiction resolution (see dec-2026-07-23-000);
                   user said 'too playful now', selected the lower step instead"
rationale: >
  In a 3-way A/B/C selection on screen 'onboarding-cta', user selected variant B (8px)
  over A (4px) and C (20px) without prompting; reaction observed, not inferred.
intensity: "2 of 3 on the ornamentation-radius axis"
timestamp: "2026-07-23T14:12:00Z"
lock_status: locked
scope: "component:button (not yet propagated to card/input -- pending a separate decision)"
supersedes: "dec-2026-07-23-000"
superseded_by: null
confirmed: true
confirmation_text_shown: >
  "Locking Button corner radius at 8px (token --radius-md), applied to Button only. Correct?"
session_id: sess_9f21ac
```

**What "survives a session boundary" looks like in practice** — a new session (different process, days later, or a hand-off) starts by reading the ledger and surfacing a macro-tier restatement (§4.7) instead of silently resuming or re-asking:

```yaml
# session-start recap, generated from the ledger above (and any sibling entries)
recap_shown_to_user:
  - "Button corner radius: locked at 8px."
  - "Primary color: locked at #2E5EFF."
  - "Card shadow: provisional at intensity 2/3 -- not yet confirmed, will ask again."
no_questions_repeated: true   # dec-2026-07-23-001's axis is not re-asked
regeneration_constraint_passed_to_G1:
  locked_scope: ["button.corner-radius", "color.primary"]
  # G1 -- reads this list as a hard filter on its randomization space (G1 S4.9)
```

Both the individual entry and the session-start recap are built entirely from fields in the same schema — nothing here depends on re-parsing a natural-language history.

---

## 6. Failure modes

| Failure | Detect | Fix |
|---|---|---|
| **Open-ended "describe your style" prompt on a visual decision** | User leaves it blank, or gives a generic answer ("modern, clean") that doesn't disambiguate anything | Replace with a rendered A/B/C selection (§4.1); reserve text for the non-visual residual only |
| **Choice set too large (6+ options at once)** | Selection time balloons; first/last options win disproportionately; abandonment rises | Cap default at 3, ceiling 5 (§4.2, matches G1 §4.4); push overflow into a second round or an intensity ladder |
| **Leading or asymmetric labels** ("modern" vs. "outdated") | Re-labeling the identical visual pair with swapped wording flips the outcome | Neutral tokens (A/B/C) only; if captions are needed, use paired non-evaluative descriptors (§4.3) |
| **Highlighted / pre-selected "recommended" default** | Selection rate for the highlighted option far exceeds its rate when shown unmarked | Remove defaults from taste-elicitation choices entirely — anchoring persists even when the anchor is known to be arbitrary (§4.3) |
| **Same slot order every time** (new candidate always in position A) | Position-A win rate exceeds chance across many otherwise-unrelated choices | Randomize slot assignment on every presentation, not just the first (§4.3) |
| **Contradictory feedback treated as a verbal dispute to re-litigate** | The person repeats the same two contradictory statements; the session stalls in a loop | Convert to an intensity ladder on the named axis; let a new selection resolve it (§4.4) |
| **Decision recorded as free-text description** | Regeneration can't reliably reproduce "the blue one"; a different agent instance interprets it differently | Store the concrete token/value + scope, never a description alone (§5.2 schema) |
| **Rejected alternatives not recorded** | Regeneration re-offers an option the user already declined; reads as "not listening" | Persist the rejected list with a one-line why (§5.2 schema) |
| **Lock status implied, not explicit** | An early, exploratory click gets silently treated as final; the user never got to confirm or change it | Two-stage promotion: provisional on first pick, locked only after explicit confirm or unchanged re-exposure (§4.6) |
| **Regeneration overwrites a locked item** | A locked value changes without the user asking for it; trust in the tool collapses | Regeneration reads `lock_status` as a hard filter (cross-ref G1 §4.9's regression gate); any drift on a locked node is reverted automatically |
| **Unlock as easy as lock** | Accidental unlock exposes committed work to silent overwrite on the next regeneration pass | Add confirmation friction to unlock, asymmetric to lock (§4.6) |
| **Agent generalizes a locked decision to a new scope silently** | A locked button radius shows up on cards/inputs without ever being asked about there | Every scope expansion is its own restate-and-confirm step, never silent inheritance (§4.7) |
| **No restate step before acting** | User reports "it did something I never agreed to"; the tool's model of the decision and the user's don't match | Restate the concrete interpretation and require explicit confirm before propagating it (§4.7) |
| **Session boundary loses state** | A returning user is re-asked questions already answered, or previously-locked work has reverted | Decision ledger is read at session start; a short recap is surfaced, never silent re-derivation (§4.5, §5.2 worked example B) |
| **Decision-fatigue "budget" treated as a proven hard number** | A team ships or asserts "8 decisions is the fatigue limit" as established fact in a spec | Cite it as directional/contested (§4.2, §8); use it as a soft budget with an escape hatch, not a hard gate |
| **Text box offered as the default input for an aesthetic question** | Users are asked to type a style description before any render is shown | Reorder the flow so selection always comes first; text is opt-in overflow, not the entry point (§4.1, §5.1) |

---

## 7. Pre-flight checklist

**Before showing a choice:**
- [ ] The ask is a **selection** (render + react), not an open text box, unless it's genuinely non-visual (§4.1).
- [ ] Choice-set size is **3 by default, never exceeds 5** without restructuring into rounds or a ladder (§4.2).
- [ ] Labels are **neutral** (A/B/C or non-evaluative captions) — no adjective-loaded or "recommended" framing (§4.3).
- [ ] No option is pre-highlighted, pre-selected, or otherwise anchored as a default (§4.3).
- [ ] Presentation slot/order is **randomized** across repeated symmetric choices (§4.3).

**When feedback is contradictory:**
- [ ] The contradiction is mapped onto a **named axis**, not treated as a verbal dispute (§4.4).
- [ ] A **3-point ladder** on that axis is generated and shown as a new selection, not asked about again in words (§4.4).
- [ ] Both prior signals remain in the ledger, marked `superseded_by` the resolving decision (§4.4, §5.2).

**Every decision record:**
- [ ] Stores the **concrete token/value**, never a description alone (§5.2).
- [ ] Records **rejected alternatives** with a one-line why (§5.2).
- [ ] Ties **rationale** to an observable reaction, not an inferred trait or motive (§5.2, Executive Rule 11).
- [ ] Has `id`, `timestamp`, `lock_status`, `scope`, and `confirmed` populated (§5.2).

**Locking:**
- [ ] Promotion to `locked` requires an **explicit confirm** or unchanged re-exposure — never a first click alone (§4.6).
- [ ] Unlocking has **more friction** than locking (§4.6).
- [ ] Regeneration reads `lock_status` and **hard-excludes** locked scope (§4.6, cross-ref G1 §4.9).

**Restating:**
- [ ] Every inferred preference is **restated in concrete terms** and confirmed before it's applied beyond the exact tested surface (§4.7).
- [ ] Any **scope expansion** (propagating a locked decision to a new component) is its own restate-confirm step (§4.7).
- [ ] A **session-start recap** re-surfaces the locked ledger instead of re-asking already-answered questions (§4.5, §5.2).

**Fatigue budget:**
- [ ] Total sequential decision points before a recap/break checkpoint stays around **5–8**, tracked separately from per-set size (§4.2) — treated as a soft, revisable budget, not a proven constant (§8).

---

## 8. Open questions / unverified

- **Hick's Law gives no numeric "max options" threshold on its own.** The "3 default / 5 ceiling" figures in this report (Executive Rule 2, §4.2) are synthesized from adjacent evidence (dot-voting ratios, Miller/Cowan working-memory limits, and alignment with G1 §4.4's independently-stated table) — not a direct reading of Hick 1952 / Hyman 1953. `[REASONED]`
- **Miller's "7±2" measures working-memory span, not choice/decision time**, and is frequently conflated with Hick's Law in popular UX writing. Its application here (as loose support for "don't make people compare too many multi-attribute options at once") is this report's inference, not a direct finding about visual-comparison tasks. `[REASONED]`
- **Iyengar & Lepper's jam-study effect (3% vs. 30% purchase) is a single, famous, large-effect study** in a retail/consumption context, not validated against design-tool choice screens. Treat the dramatic magnitude as illustrative of the phenomenon (satisficing, anticipated regret under extensive choice), not as a transferable number.
- **Scheibehenne et al.'s meta-analysis (d ≈ 0.02 overall) is the more rigorous evidence** and complicates the popular "more choices always overload" narrative. This report leans on its *moderators* (comparison difficulty, no prior preference, time pressure, justification burden) as applicable to this tool's exact audience — that mapping is a reasoned application of the meta-analysis's own findings, not a direct study of AI design-tool choice screens specifically. `[REASONED application]`
- **Decision fatigue / ego depletion is scientifically contested.** The flagship parole-ruling study was challenged as a possible case-scheduling artifact (with the original authors defending it in reply), and the broader depletion mechanism largely failed a 23-lab preregistered replication. This report uses "session-level fatigue" only as a soft, directional design budget (~5–8 decisions), never as a proven mechanism with an exact number — any implementation that hard-codes this as settled science should be corrected.
- **The ~5–8-decisions-per-recap and 3-default/5-ceiling-per-set numbers are this report's synthesis**, calibrated to the tool's stated 2–4-variant interaction pattern and cross-checked against G1's independently-derived option-count table — not independently measured for AI design-tool choice screens. Recommend the product instrument its own funnel (selection latency, abandonment, re-generation requests per session) once it has usage data, and replace these synthesized numbers with measured ones. `[REASONED — flagged for future replacement with telemetry]`
- **Choice-blindness research generalizes an important caution** (people confabulate reasons for choices, even ones they didn't make) but the original studies used a face-attractiveness card-trick paradigm about post-hoc verbal rationale for a *swapped* outcome, not design-preference elicitation directly. Applying it to "restate concrete tokens instead of trusting a verbal explanation" (Executive Rule 11, §4.7) is this report's extension of the finding, not a direct replication in a design-tool context. `[REASONED application]`
- **MaxDiff/best-worst-scaling's "forced choice beats absolute rating for clean signal"** is standard market-research practice for product-attribute preference; no head-to-head study specifically for *visual aesthetic* preference (vs. product-attribute preference) was independently verified for this report. Treated as a reasonable adjacent-domain analogy. `[REASONED]`
- **Figma's lock-layer mechanics are accurately sourced from Figma's own help documentation**, but describe a general-purpose design tool's layer lock, not a taste-elicitation product. It is cited here only as an existence proof that "locked-but-visible/inspectable, cascading to children" is an already-shipped, implementable pattern — not as a recommendation to depend on Figma.
- **Khroma's "choose 50 colors" mechanism is cited from its own site copy** as an existence proof of pure selection-based preference training with zero description step; the tool's source-availability/license was not independently verified, and it is cited descriptively, not as a recommended dependency.
- **No single canonical open-source "decision-ledger for AI design-tool taste elicitation" schema exists to point to.** The schema in §5.2 is original synthesis, built from ADR practice (Nygard / MADR) adapted to visual/token decisions — flagged as constructed for this report, grounded in but not copied from an existing shipped schema.
- **G2 Critique does not yet exist as a written sibling track** at the time of this report; its boundary with G3 (stated in §2) is taken from the assigning brief rather than cross-checked against a sibling file, unlike the G1 boundary, which was verified directly against G1's own text.

---

## 9. Sources

Primary / authoritative (psychology & HCI):
- [Hick's Law — Wikipedia](https://en.wikipedia.org/wiki/Hick%27s_law) — `T = b·log₂(n+1)` formula, diminishing-returns behavior, limitations.
- [IxDF — The Hick-Hyman Law: An Argument Against Complexity in User Interface Design](https://ixdf.org/literature/article/the-hick-hyman-law-an-argument-against-complexity-in-user-interface-design) — practical application; confirms no fixed numeric threshold.
- [Miller's law — Wikipedia](https://en.wikipedia.org/wiki/Miller%27s_law) — the "7±2" working-memory claim, distinct from Hick's Law.
- [Iyengar, S. S., & Lepper, M. R. (2000). When Choice is Demotivating: Can One Desire Too Much of a Good Thing? — full PDF](https://faculty.washington.edu/jdb/345/345%20Articles/Iyengar%20&%20Lepper%20(2000).pdf) — the jam study; exact purchase/stop percentages.
- [Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload — full PDF](https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf) · [journal abstract, JCR](https://academic.oup.com/jcr/article-abstract/37/3/409/1827647) — the null-average / moderators finding.
- [Danziger, S., Levav, J., & Avnaim-Pesso, L. — Extraneous factors in judicial decisions, PNAS 2011](https://www.pnas.org/doi/10.1073/pnas.1018033108) — the parole-ruling decision-fatigue study and the authors' reply to critique.
- [Weinshall-Margel, K., & Shapard, J. — Overlooked factors in the analysis of parole decisions, PNAS 2011](https://www.pnas.org/doi/10.1073/pnas.1110910108) — the published critique of the above.
- [Hagger, M. S., et al. (2016). A Multilab Preregistered Replication of the Ego-Depletion Effect, Perspectives on Psychological Science](https://journals.sagepub.com/doi/10.1177/1745691616652873) — 23-lab replication, near-zero effect.
- [Decision fatigue — Wikipedia](https://en.wikipedia.org/wiki/Decision_fatigue) — synthesis of the above plus related findings.
- [Johansson, P., Hall, L., Sikström, S., et al. — Choice Blindness (research summary), Lund University Cognitive Science](https://www.lucs.lu.se/fileadmin/user_upload/lucs/2011/01/Choice-Blindness-summary.pdf) — the face-attractiveness card-trick paradigm and confabulation finding.
- [Anchoring effect (Tversky & Kahneman, 1974) — Wikipedia](https://en.wikipedia.org/wiki/Anchoring_effect) — the roulette-wheel experiment and anchoring-and-adjustment mechanism.
- [Serial-position effect — Wikipedia](https://en.wikipedia.org/wiki/Serial-position_effect) — primacy/recency, and primacy's extension to preference/evaluation and "outcome primacy."
- [Member check — Wikipedia](https://en.wikipedia.org/wiki/Member_check) — respondent validation methodology in qualitative research.

Nielsen Norman Group:
- [NN/g — First Rule of Usability? Don't Listen to Users](https://www.nngroup.com/articles/first-rule-of-usability-dont-listen-to-users/) — the 0.44 / 0.53 stated-preference-vs-performance correlation.
- [NN/g — Rating Scales in UX Research](https://www.nngroup.com/articles/rating-scales/) — Likert vs. semantic differential, scale-point and labeling guidance.
- [NN/g — Dot Voting: A Simple Decision-Making and Prioritizing Technique in UX](https://www.nngroup.com/articles/dot-voting/) — the ~1-vote-per-4-options ratio and group-decision pitfalls.
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — deferring secondary options, ≤2 disclosure levels.

Survey/market-research methodology (secondary):
- [YouGov — How leading questions and acquiescence bias can impact survey results](https://yougov.com/en-gb/articles/45308-how-leading-questions-and-acquiescence-bias-can-im) — the 37-point leading-wording swing and forced-choice de-biasing.
- [Displayr — What is MaxDiff? Understanding Best-Worst Scaling](https://www.displayr.com/what-is-maxdiff/) — forced relative choice vs. absolute rating.

ADR / decision-record practice:
- [Michael Nygard's ADR template (mirrored)](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md) — Title / Status / Context / Decision / Consequences.
- [MADR — Markdown Architectural Decision Records](https://adr.github.io/madr/) — the richer schema (decision drivers, considered options, pros/cons, confirmation); license **MIT OR CC0-1.0**.
- [adr-tools (npryce)](https://github.com/npryce/adr-tools) — CLI for managing an ADR log; license **GPL**.
- [log4brains (thomvaill)](https://github.com/thomvaill/log4brains) — ADR authoring + searchable static-site publishing; license **Apache-2.0**.

Product-mechanics existence proofs:
- [Figma Help Center — Lock and unlock layers](https://help.figma.com/hc/en-us/articles/360041596573-Lock-and-unlock-layers) — locked-but-visible/inspectable behavior, parent-to-child lock cascade.
- [Khroma — training/preference-selection page](https://www.khroma.co/train) — "choose 50 colors" pure-selection training mechanism.

Decision-framing:
- [Bezos, J. — Amazon 2015 Letter to Shareholders](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF) — Type 1/Type 2, one-way-door/two-way-door decision framing.

Sibling tracks (cross-referenced directly against source files, not summarized from memory):
- `/home/claude/G1-variant-generation-and-convergence.md` — option-count table (§4.4), fidelity ladder (§4.5), mixing rules (§4.7), stop conditions (§4.8), scoped regeneration/regression gate (§4.9), Worked Examples A–C (§4.10), boundary statement (§2), open questions (§8).
