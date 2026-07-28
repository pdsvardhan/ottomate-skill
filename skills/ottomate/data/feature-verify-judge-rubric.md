# Feature-verify AI-judge rubric — the ADVISORY holistic glance (P3-A)

> **Who runs this:** a **fresh Claude sub-agent** (the judge), dispatched by the skill on a case's
> captured screenshots + ARIA snapshot, **blind to the coder's diff** and to any "I fixed X." It runs
> **only at T2+** on the change-tier (a quick grounded glance at T2, a full guardrailed pass at T3) —
> `judgeGate(tier)`.
> **Tier: ADVISORY (owner ruling).** VLMs are ~58% at geometry and below-random at design quality (T1),
> so this judge **flags, it never blesses**: it can move a green case to `warn`, it can never render a
> case a gating pass, and it can never turn a red green. Every geometry call it makes is **cross-checked
> against the deterministic L2/L4 layer and discarded if the layer contradicts it**.
> Sibling to Task-2's `data/design-rubric.md` (which judges *design taste* at design time); this judges
> *"does the built/fixed feature work and look right for a user"* at build/verify time.

## Rendering discipline — do this first
Every check means **read the captured screenshot + ARIA snapshot**, never the markup or the diff.
Reasoning from source re-triggers the coder's own blind spot. Where a render is missing, **say so** and
label the finding source-derived — never present a source-read as a render.

## The four dimensions — each a `clean | warn | flag` with a **cited region**
A finding MUST name where it is (a selector, an ARIA node, or a screenshot crop/coords). A finding with
no cited region is dropped — grounding is mandatory.

### 1. Intentional / on-spec / balanced
Does the rendered result look **deliberate** and match the **requirement** (never the diff)? Placeholder
text, lorem, a half-built control, a raw JSON dump, an obviously-unstyled element → `flag`. Slightly-off
spacing/rhythm that still reads as finished → `warn`. Matches the requirement and looks intentional →
`clean`. **Do not score aesthetics on a 100-scale here** — that is design-time's job; here it is a
binary-ish "looks finished + on-requirement or not."

### 2. Empty / first-run / error state works
Drive or inspect the **non-happy** states named by the case. A blank screen, a raw stack trace, an
untranslated key, or a spinner that never resolves → `flag`. An intentional-but-minimal empty state →
`clean`. If the case did not exercise these states, say so — **do not assume they work.**

### 3. Nothing visibly broken
Obvious overlap, clipping, off-canvas content, garbled/mojibake text, an element rendered on top of
another. **This dimension is the most hallucination-prone** — so state the impression and let the DOM
decide: tag each such finding `spatial` with a `claim_type` (`overlap | clipping | overflow | off-canvas
| contrast | not-visible`) and cite the exact selectors. `crossCheckSpatialClaims` will **discard** any
that the L4 geometry/contrast layer contradicts and **keep** (as corroborated) any it confirms. **Never
state a contrast ratio or a pixel measurement** — defer every number to L4.

### 4. Symptom-relevance (owner-reported fixes only)
Does the change **plausibly address the reported symptom**? (The deterministic RED→GREEN is owned by the
P2-B reproduce-symptom two-phase; this is the "does the fix look like it's even in the right place" glance
on top of it.) If the screenshot shows the reported area unchanged → `flag`.

## Bands — NONE gate
| Band | When | What it does |
|---|---|---|
| **clean** | no surviving findings | recorded in `judge_verdict`; case outcome unchanged |
| **warn** | minor findings survive the cross-check | recorded in `judge_verdict` (visible); a **minor** advisory note **does not flip the gate** — the judge is advisory, and any *real* issue (contrast, clip, overflow) is already caught deterministically by L1–L4 |
| **flag** | something looks wrong, OR the T3 samples disagreed (`no-confidence`) | recorded; **needs a human**; downgrades a green case to `warn` (→ ITERATE, a human reviews); a red stays red; still never gates |

`applyJudgeToOutcome` enforces the direction: **downgrade-only** — `fail`→`fail`, `pass`→`warn` (on a
**flag** — a plain warn leaves a pass a pass, the advisory note lives in `judge_verdict`), never
`pass`→gating-pass, never `fail`→`pass`.

## T3 reliability guardrails
- **Order-randomised** — judge the screenshots in a random order so position doesn't anchor the verdict.
- **Sampled 2–3×** — `reconcileSamples`: a finding in **all** samples is `agreed`; a finding in only some
  is `no-confidence` → **human**. A single pass (T2 glance) is labelled `single-pass`, never "reconciled".
- **CALM self-audit** (periodic, unattended path) — re-judge a past clean case known-good to detect drift.

## Honesty rules that travel with the verdict
- **Never call this "user-tested" or "validated."** It is a **vision proxy** run by the agent; label it
  one. A real first-click / 5-second test needs a fresh human. (Same rule the design rubric runs under.)
- **Every geometry/contrast number is L4's, not the judge's.** The judge names *where*; the layer says
  *whether*.
- **State the band explicitly.** A case never reads "judged fine" implicitly.
- **The judge is blind to the diff.** If a finding could only be made by reading the code, it is out of
  scope — judge the running result, not the change.
