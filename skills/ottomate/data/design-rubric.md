# Design rubric — the pressure-test run on every variant before it is shown

> **Who runs this:** the design round's sub-agent, on each variant, **after** the mechanical checker
> (`data/design-rules.json`) has passed it and **before** the owner sees anything.
> **Tier: ADVISE** (owner ruling 2026-07-23) — the score is computed and shown, it does not block.
> The one exception: a **Rebuild** band triggers **one** automatic regeneration; if the rebuild still
> bands Rebuild, the variant is shown with its score visible rather than silently withheld.
>
> Source: **G2 §4.6/§7** (`docs/research/G2designcritiqueheuristicsandevaluation.md`), plus the F2 §7
> templated tax. Principles in `references/design-doctrine.md` §4.

## Rendering discipline — do this first

Every check that says *look at the screen* means **render the artifact and read the pixels** — not the
markup, not the spec. Reasoning from source re-triggers the exact curse-of-knowledge blind spot the
rubric exists to route around. `[G2 §4.6]`

Our previews are self-contained single-file HTML, so a headless render is cheap. Where a render is not
available, **say so and label the score as source-derived** — never present a source-read as a render.

---

## The four dimensions (25 each, 100 total)

### 1. Hierarchy (0–25) — is the primary action obvious in ~5 seconds?

| Check | Pts | How |
|---|---|---|
| Exactly one element reads as the dominant CTA/message — no two competing at equal top-level weight | 10 | Enumerate every CTA-styled element (filled button, oversized/bold headline, saturated colour, banner); if ≥2 score similarly on size + colour + position, fail |
| Visual weight ranks match intended importance (primary > secondary > tertiary visible in size/contrast/position, not just DOM order) | 8 | Compare each element's intended priority from the worklist/brief against its rendered rank |
| **Vision-proxy 5-second test**: from the screenshot cold, name the single primary action without reading body copy | 7 | Render; state the one conclusion *before* consulting the intended answer; compare |

**Critical-fail trigger:** cannot name a primary action at all, **or 3+ elements** compete at equal top
weight → **cap this dimension at 5/25** regardless of sub-scores.

### 2. Consistency (0–25) — are tokens actually shared?

| Check | Pts | How |
|---|---|---|
| Every colour traces to the declared token set — no one-off hex | 6 | Extract all colour values from the rendered CSS; flag any absent from the token list |
| Spacing values sit on one scale | 6 | Extract every margin/padding/gap; flag if >~6–8 distinct values on one screen, or any value off the base unit |
| Type scale limited and reused (≤ ~5–7 steps) | 5 | Count distinct `font-size` values against the declared scale |
| Repeated components styled identically wherever they recur | 5 | Diff computed style across instances; flag divergence not explained by a declared state/variant |
| Interactive states follow one pattern, not invented per instance | 3 | Check each state's delta against the same delta used elsewhere |

### 3. Legibility (0–25) — craft pre-check; numeric conformance belongs to the hard floor

| Check | Pts | How |
|---|---|---|
| Body size + line-height in comfortable range (≥ ~14–16px, 1.4–1.6×) | 6 | Computed `font-size` / `line-height` on body blocks |
| Line length near 50–75 chars, not past ~80 | 5 | Container width ÷ average glyph width, or a `max-width`/`ch` constraint |
| Any pairing that *looks* low-contrast is **flagged, not adjudicated** | 8 | Scan for tight/washed-out pairings; log location. **Do not state a ratio here** — the 4.5:1 hard gate in `design-rules.json` (`floor-contrast`) owns the numeric call |
| Meaning never carried by colour alone | 6 | For every coloured status cue, confirm a second channel exists. Also a hard-floor gate (`floor-not-colour-alone`) |

### 4. Craft (0–25) — alignment, rhythm, optics, edge cases

| Check | Pts | How |
|---|---|---|
| Elements align to a shared grid — no stray 1–3px misalignments | 7 | Compare sibling edge coordinates; flag unintentional near-misses |
| Spacing rhythm even — equal gaps between repeated items, matching internal padding across siblings | 6 | Compare gap/padding across repeated structures |
| **Optical**, not merely mathematical, alignment — icons centred by eye; round/pointed shapes very slightly larger than square neighbours of nominally equal size | 4 | Spot-check icon-to-text baselines and circle/square pairs |
| No clipping, overflow, orphans or broken wraps at realistic content lengths | 4 | Re-render with longest-likely, empty, and truncated strings — **not** the demo content |
| Non-happy-path states (empty, loading, error) styled to the primary state's standard | 4 | Confirm each has intentional styling, even if minimal |

---

## Bands and the hard-gate rule

| Total | Band | Action |
|---|---|---|
| **90–100** | Ship | Present |
| **75–89** | Ship with a punch-list | Present, flag the list |
| **50–74** | Revise before showing | Fix and re-score before calling it done |
| **< 50** | Rebuild | Not a finished option |

**Do not average past a catastrophe.** Two overrides sit on top of the raw total — check the floor
*before* trusting it:

1. **Any single dimension < 10/25** caps the overall band at **Revise**, whatever the total.
2. **Any Hierarchy critical-fail** caps the overall band at **Rebuild**.

---

## What is reported with each variant

Presenting a set shows, per variant, a compact line — this is what makes a violation *visible instead of
silent*, which is the whole point of the constraint contract:

```
Variant B  ·  source: mc-shine-border  ·  constraints honoured: 5/5
           ·  rubric 84/100 (H22 C21 L20 Cr21) — Ship with punch-list
           ·  templated tax 1/18  ·  punch-list: card gap 14px is off the 8px scale
```

- **constraints honoured** — the owner's contract (`must_use`, `animation_vocab`, `forbidden`,
  `source_policy`, `colour_budget`). Anything less than N/N should have been regenerated, never shown;
  if an N-1 ever appears, the checker has a bug worth reporting.
- **rubric** — this file, with per-dimension breakdown so a low dimension is visible under a good total.
- **templated tax** — F2 §7, 0–18, lower is better. 3+ of the five high-signal rows (accent hue, accent
  provenance, headline font, hero layout, card grid) = templated regardless of total.

## Honesty rules that travel with the score

- **State the band explicitly before presenting.** Never let a variant read as done implicitly. `[G2 §7]`
- **Never call a same-agent check "user-tested" or "validated".** The 5-second test above is a
  *vision proxy* run by the agent; label it as one. A real first-click or 5-second test needs a fresh
  human. `[G2 §7]` — same rule the code verifier and feature verifier already run under.
- **Any number quoted in a critique is either traceable to `docs/research/` or marked unverified.**
- **Score trend, not just snapshot.** Log each round's rubric total and tax alongside prior rounds in
  the ledger — a design that is drifting downward across rounds is a signal the axis is mis-framed.

## Known limits

- The rubric is a **self-critique**. G2 §4.7 is explicit that self-review is unreliable: the aesthetic-
  usability effect makes polished-looking screens score better than they deserve, so **re-score
  hierarchy and error-recovery harder on anything that already looks good**.
- Where the architecture allows, run **two passes with different framing** and reconcile; a single pass
  is disclosed as single-pass, never presented as complete. `[G2 §4.3/§6]`
- Point allocations are G2's prescriptive defaults, not measured weights. Tune against real rounds.
