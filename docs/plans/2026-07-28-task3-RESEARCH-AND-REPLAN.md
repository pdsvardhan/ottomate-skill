# Task 3 — Feature Verifier: RESEARCH SWEEP + RE-PLAN (2026-07-28, Track B)

Written after the owner (a) broadened the scope substantially and (b) greenlit a **deep** research sweep,
**parking all build work until it lands.** This is the plan-of-record for the research → re-plan →
requirements-update chain. Supersedes the WP ordering in `2026-07-28-TASK3-BRIEF.md` (WP8 stays resolved;
the rest is reshaped by what the research finds).

## The reframed vision (owner ruling, 2026-07-28)
The feature verifier is the **commit-time TRUTH gate.** When the coding agent says *"I built feature X"*
or *"I fixed bug Y,"* the verifier **independently proves it is actually true on the live site** —
correct **data**, correct **visuals** (as designed), matching the **requirement** — across every case
worth imagining, **blind to the agent's claims, fail-closed.** It runs whenever the agent commits, and
whenever the owner reports an issue and the agent claims a fix.

Canonical example (owner's words): *"In Maps of Bharat, select an indicator → assert the correct dataset
loads, the numbers shown are actually right, AND the visuals render the way the design says"* — not just
"a 200 came back."

Scope decisions locked this session:
- **Canvas/WebGL is out of reach, and that's fine** (vardhan 3D, the maplibre map paint). Target the DOM
  controls + the data behind them, never the canvas pixels.
- **Feature-requests-as-such aren't "solved"** by the verifier; once built, the verifier asserts they
  meet the requirement.
- **Design/layout/"looks awful" verification is REQUIRED** — not via the bolt-on tools the owner set
  aside (axe/Lighthouse/Lost Pixel as a fixed answer), but via the *right* approach, to be settled by
  research.
- **Dependencies:** free/open-source OK; **no paid SaaS**; no GPU. The only gate-time AI is **Claude
  in-session** (Explorer/Judge). This *relaxes* the earlier "zero-dependency" reading (which was an
  owner mis-start) but keeps "nothing paid."

## The layered architecture (WORKING HYPOTHESIS — to be validated/reshaped by research)
1. **Deterministic system-state core** (data correct, effect happened: DB-via-API / fs / async-poll)
   → **HARD gate.** [~built: helpers + one HTTP-only run (A4); no browser leg yet]
2. **Mechanical visual/robustness checks** (contrast, overflow, clipped text, responsive, token
   adherence) → **HARD gate where deterministic.** [Task 2's design checker already does much of this in
   real Chromium; needs *wiring* into this gate]
3. **AI-visual-judge** (holistic fidelity vs the design spec) → **ADVISORY + evidence, fail-closed.**
   [NEW — the research frontier; the risk is it becomes the *new* gaslighter]
4. **The case / oracle generator** — what "correct" *is* per feature → the hard prerequisite the bug
   triage proved is the crux. [unbuilt]

## Why research (the gap)
The plugin's 22-track research corpus (`docs/research/A1…H2`) is **entirely design generation** — colour,
type, layout, critique heuristics. There is **zero** research on testing / verification / visual
acceptance. Task 2 got a foundation; Task 3 never did. The scope just expanded into exactly that gap.

## Evidence that shaped this (the 85-comment bug triage, 2026-07-28)
Across 7 projects' DOM-commenter exports, ~83 substantive comments classified: **~6 clearly solved** by
the verifier (functional: "upload stuck", "one link → 400 downloads", "load more broken", "Preview JD not
working"), **~12 partial** (data-correctness + "is it *actually* tailored?"), **~65 not addressed**
(design ~38, feature-requests ~13, canvas/3D ~15). Takeaways that drive the re-plan: (1) the oracle
problem is everywhere ("album art missing *though Navidrome has it*"); (2) most owner pain is design →
the verifier is **one leg of a three-legged stool** (Task 1 visual-QA intake + Task 2 design verifier +
Task 3 feature verifier); (3) canvas blindness is real and accepted. Full triage lives in chat; persist
to `docs/audits/` if the owner confirms the classification.

## Three research tracks (dispatched 2026-07-28, parallel, deep)
- **T1 — Visual/design acceptance automation + VLM-as-judge reliability.** Regression vs robustness vs
  quality buckets; OSS self-hostable tooling; VLM-as-judge failure modes + reliability techniques; the
  deterministic mechanical checks; how to keep a visual judge fail-closed.
- **T2 — The test-ORACLE problem + case/matrix generation, INDEPENDENCE as the theme.** Oracle
  categories (Barr et al.); metamorphic + property-based testing; combinatorial/pairwise bounding;
  spec→test generation and the "assert-the-bug-back" risk; how to keep the oracle independent of the
  implementation; a concrete case-matrix recipe.
- **T3 — Commit-time acceptance-gate ARCHITECTURE + agentic-coding verification.** CI gate patterns;
  flake control; the reward-hacking/gaslighting problem in coding agents + mitigations; independent-
  verifier design; cost/cadence (impacted-test selection, nightly full pass).

Each returns a cited synthesis + an "APPLY TO US" recommendation.

## Deliverables pipeline (after research lands)
1. **Distilled reference docs** — one per track under `docs/research/task3/` (durable, the way Task 2's
   tracks are). Cited, opinionated, mapped to our constraints.
2. **Revised implementation plan** — the layered architecture as WPs, each with a must-fail AND a
   must-pass acceptance case.
3. **Updated requirements** — amend `docs/specs/TASK3-FEATURE-VERIFIER-SPEC.md` for the broadened scope
   (design/visual acceptance, the 4-layer gate, the fail-closed judge, canvas-out-of-scope) with a
   **dated amendment banner** — never silently rewrite a locked spec.
4. **Updated skill docs** — `SKILL-REGISTER.md` Task-3 rows, `references/stage-3-feature-verifier.md`,
   the brief; same-commit discipline, edit only Track-B rows.

## Parked until research lands (owner ruling)
WP1 first-browser-target and the whole build order — reshaped by the research, so parked. No build
this session until the sweep is synthesized and the owner has the re-plan.
