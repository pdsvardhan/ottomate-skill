# Trigger Phrases

> **POST-AUDIT AMENDMENTS (2026-04-29) — Detection discipline (CC-2):**
> 1. **Position-aware:** phrases fire only at message **start** OR as **entire message**. "let's move on to discuss the API design" doesn't fire "let's move on" advance.
> 2. **Phase-aware:** "next" disambiguates by **active context** — next-step / next-item / next-stage based on what dialog is open.
> 3. **Question-mark suppresses** trigger firing (interrogatives, not commands). "Ready to test what?" doesn't fire "ready to test" trigger.
> 4. **Exclusion list:** "next time" / "next week" / "next month" → not "next" advance. "I want to pause that feature" → not "pause" trigger.
> 5. Implementation: regex-based but phase-context-aware. Skill scans every message; ambiguous matches surface AskUserQuestion to disambiguate.
>
> Phrases below are unchanged; the new rules govern WHEN they fire.

The skill detects user phrases as transition signals. Detection runs continuously during work — at any sub-step, if the user types one of these, the skill advances or wraps.

## Forward transitions

| Phrase pattern | Effect |
|---|---|
| "let's move on" / "next" / "ready" / "proceed" / "let's go" | Move to next sub-stage in current reference |
| "let's complete stage 1" / "stage 1 done" / "ND1 done" / "preprocessing done" | Finalize ND1 (end Stage 1 preprocessing) |
| "let's get to stage 2" / "move to stage 2" / "stage 2 now" | Transition Stage 1 → Stage 2 |
| "let's get to stage 3" / "build it" / "ready to build" | Transition Stage 2 → Stage 3 |
| "let me test" / "ready to test" / "I'll review now" | Transition out of build, ready for Stage 4 |
| "analyze" / "classify" / "process this" | Trigger Stage 4 step 4.2 (classification) |
| "lock & build" / "approve all" / "looks good, build" | Lock Stage 4 step 4.3 list, kick off build |

## Backward / pause transitions

| Phrase pattern | Effect |
|---|---|
| "go back" / "previous step" / "wait" | Step back to previous sub-step (no work undone, just re-enter dialog) |
| "let me think" / "pause" / "hold on" | Pause work, save state, wait for user signal |
| "skip" / "next item" / "move on" (in Stage 4 item review) | Skip current item, move to next in list |

## Wrap signals

| Phrase pattern | Effect |
|---|---|
| "pack up" | Run full session-end ritual (see `pack-up-ritual.md`) |
| "done" / "good night" / "wrap up" / "that's all" / "see ya" | Same as "pack up" |
| "save and quit" / "stop" / "end session" | Same as "pack up" but more abrupt — minimal cleanup |

## Disambiguation

If a phrase is ambiguous (e.g., "next" mid-list), use the immediate context:
- In a step-by-step dialog → next step
- In an item review → next item
- In a stage transition prompt → confirm transition

If genuinely unsure, ask via `AskUserQuestion`:
- "Did you mean 'next sub-step' or 'next item in list' or 'next stage'?"

## Implementation note

Detection is regex-based. The skill scans every user message for these phrases. Detection happens BEFORE classification of message content — phrases are checked first, content second.

Phrases that don't match any pattern fall through to normal content handling (free-form input for the current sub-step's question).
