# Everything before Stage 4 — unit plans

**Written 2026-07-27 end of session, for the NEXT session.** Parent:
`2026-07-27-TASK2-COMPLETION-PLAN.md`. Stage 1 and Stage 2 are complete; Stage 3 is complete except
the rule tail below. **These five units are all that stands between here and Stage 4 (graduation).**

## Owner decisions this session — settled, do not re-litigate

| # | Decision |
|---|---|
| D15 | **Reclassify rather than pretend.** 4 catalog-ingest rules move to Stage 4; 7 whole-app rules get `scope:'app'` and wait for a separate app audit. A design round shows ONE component, so a panel checker structurally cannot see either group. **Already applied.** |
| D16 | **Hand-roll pixel comparison. Keep the plugin zero-dependency.** Playwright already returns PNG buffers |
| D17 | **Every round runs in a FRESH sub-agent**, as the method specifies. Both Screenroom rounds were authored inline; that stops |
| D18 | **Do NOT stamp `data-oid` in Screenroom.** `target_id` is a chosen label, not a wire — and the register's "one instrument, three consumers" claim is **withdrawn** rather than left implying something untrue. **Already applied.** |

## The honest number, after reclassification

**62 of 79 round-scope rules enforced. 17 pending** — 14 panel + 3 pixel.
Plus 7 `scope:'app'`, 4 `scope:'catalog'`, 1 `declared-unenforceable`, all excluded from that
denominator **with a reason recorded on each rule**.

---

## P1 — the 14 remaining panel rules

The genuine C6 tail: everything a round checker can still legitimately see.

**Computed (9)** — `computed-rules.mjs`, same pure-function shape as batch 3, so each is testable in
plain Node: `floor-not-colour-alone` · `floor-focus-ring` · `adv-state-delta-relative` ·
`adv-derivation-contrast-guarantee` · `adv-density-scale` · `adv-whitespace-first` · `adv-body-type` ·
`adv-token-adherence` · `adv-dark-mode-type-optical`.

**Source (5)** — `checks.mjs`: `adv-p3-meaning-independent` · `adv-bar-zero-baseline` ·
`adv-series-cap-and-labels` · `adv-encoding-channel` · `adv-plain-language`.

**Acceptance:** every rule flipped to `enforced` names a test and has **both** a must-fail and a
must-pass case. The meta-test already refuses an `enforced` claim with no detector — it caught exactly
that twice this session.
**Watch for:** the four chart rules (`bar-zero-baseline`, `series-cap`, `encoding-channel`) only apply
to a variant that actually contains a chart. They must return `notApplicable`, never a silent pass.

## P2 — pixel comparison (hand-rolled)

Closes three rules **and** fixes the divergence metric, which is the highest-value defect left.

- **Decode PNG.** Playwright's `screenshot()` returns a PNG buffer. Needs a minimal decoder —
  zlib is in Node core, so this is inflate plus un-filtering scanlines. No dependency.
- **Compare.** Per-pixel difference with a perceptual tolerance, returning a 0–1 distance.
- **Then:** `computed-axis-divergence` measures **rendered difference** instead of vocabulary overlap
  — the residual defect logged this session. `adv-glass-legibility` samples the composited backdrop
  behind glass, which `getComputedStyle` provably cannot report. `adv-accent-budget` measures accent
  **pixel share** rather than counting declarations. `adv-motion-behind-text` compares frames.
- **Acceptance:** two deliberately-identical panels score ~0 and two obviously-different ones score
  high; the Screenroom round-1 panels are re-measured and the result stated either way. **Do not tune
  the threshold to make an existing round pass.**

## P3 — fix the defects this session's own tooling found

1. **Our published panels fail `floor-reduced-motion`** — the generator emits transitions with no
   `prefers-reduced-motion` block. Fix `docs/rounds/screenroom-postercard-r2/gen.mjs` and republish.
2. **`template.card-wall.html`** — the coloured 3px left strip (owner-deferred, now detected) and an
   emoji used as iconography.
3. **The harness state captions sit at ~3.2:1**, below the 4.5 floor. They are annotation, not design,
   but they are ours.

## P4 — the fresh-sub-agent round protocol (D17)

`stage-2-generation.md` already specifies it and `buildRoundInput` already assembles the packet. What
is missing is that it has not been *practised* since 2026-07-23. Next session: run one real round
through a fresh `Agent`, fed only the packet, and confirm mechanically that it re-offered no
hard-banned value and omitted every frozen axis — the same check round 2 passed on the 23rd.

## P5 — the whole-app audit *(optional, and NOT required for Stage 4)*

The 7 `scope:'app'` rules need a checker that reads a built page or the project source rather than a
variant panel. **Deliberately deferred** — it is a different tool with a different input, and nothing
in Stage 4 depends on it. Recorded so it is not mistaken for forgotten work.

---

## Still blocked on the owner

**Lock at least one decision** on the live Screenroom rounds. It is the only thing that makes style
priors real on live data and triggers the first genuine tokens file in Screenroom's repo (which will
be shown as a `--dry-run` first). Everything else above can proceed without it.

## Standing rules

Plan before each unit · demonstrate, don't assert · must-fail **and** must-pass per rule · register
updated in the same commit · ONE DOOR · backup before any DB change · never `drizzle-kit` · typecheck
before rebuild · `git status` after committing · **never lower a threshold to make something pass**.
