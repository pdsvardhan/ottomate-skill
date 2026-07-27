# P2 — hand-rolled pixel comparison

**Unit plan.** Parent: `2026-07-27-PRE-STAGE4-PLANS.md` §P2. Owner decision **D16**: hand-roll it,
keep the plugin zero-dependency. Playwright already returns PNG buffers and zlib is in Node core.

## Why this is the highest-value item left

It is the only item that both **closes rules** and **fixes a logged defect**. The defect is the
important half:

> `computed-axis-divergence` measures **vocabulary overlap**, not rendered difference.

**Corrected after reading the implementation rather than the plan** — an earlier draft of this doc
said it compared CSS property *strings*. It does not. It builds a per-panel signature as the SET of
resolved values for each of 12 properties and takes the mean Jaccard distance over the properties
that move somewhere in the set. That is genuinely computed-style-aware, and it was already fixed once
this program for diluting the score with control properties.

The residual defect is narrower and real: **a set of values says nothing about how much of the panel
each value covers.** A radius change on a 3px element and a radius change across the whole card score
identically. Geometry and layout are invisible to it entirely. So it can report "these differ" for a
change nobody can see, and under-report a change that dominates the panel.

Pixels answer the question the vocabulary cannot: *how much of what you actually see changed?* The
pixel measure therefore **complements** the Jaccard one rather than replacing it — both are reported.

## State going in (verified, not assumed)

| | |
|---|---|
| Plugin | `main`, clean, 0 unpushed, at `b82fdbd` (P1) |
| Round-scope rules | **76 of 79 enforced.** The 3 pending are exactly this unit's targets |
| Suites | design-check 116/117 · generation 150/150 · gate 36/36 · browser 4/4 on VAULT7A |
| Playwright | `/opt/homeserver/ottomate/node_modules/playwright`, Chromium 1217+1223 |

## Build order

### 1. `pixel/png-decode.mjs` — a minimal PNG reader

Playwright's `screenshot()` returns a PNG buffer. Decoding it is inflate plus un-filtering, both of
which are ordinary code:

- parse the 8-byte signature, then walk `length/type/data/crc` chunks
- read `IHDR` (width, height, bit depth, colour type, interlace)
- concatenate every `IDAT`, `zlib.inflateSync` the result
- un-filter scanlines: `None/Sub/Up/Average/Paeth` (filter byte per row)

**Deliberately narrow:** 8-bit, non-interlaced, colour type 2 (RGB) or 6 (RGBA) — what Chromium
actually emits. Anything else **throws with what it got**, rather than returning plausible garbage.
A decoder that silently mis-reads a format produces a divergence number that looks fine and means
nothing.

### 2. `pixel/pixel-compare.mjs` — perceptual distance

Per-pixel difference in a perceptual space (YIQ-weighted, the same basis pixelmatch uses), returning:

```
{ width, height, differing, total, fraction, meanDelta, maxDelta }
```

`fraction` (0–1) is the headline. Alpha is composited against a stated background before comparison,
because two transparent pixels of different colour are not a visible difference.

**Size mismatch is reported, never silently cropped** — panels of different sizes is itself a finding.

### 3. Wire the four consumers

| Rule | What pixels give it |
|---|---|
| `computed-axis-divergence` *(already enforced — this REPLACES its metric)* | rendered difference between panel screenshots, not vocabulary overlap |
| `adv-accent-budget` | accent **pixel share** of the panel, instead of counting declarations |
| `adv-glass-legibility` | samples the **composited backdrop** behind a glass surface — provably invisible to `getComputedStyle`, which is why this rule has always been out of reach |
| `adv-motion-behind-text` | compares two frames captured across an animation |

## Acceptance

1. **Two deliberately-identical panels score ~0; two obviously-different ones score high.** Both as
   tests.
2. The decoder is verified against a **real Chromium PNG**, not only against fixtures produced by a
   hand-written encoder in the same file — a round-trip through my own encoder would hide a bug that
   the encoder shares. Known-colour pixels are asserted by value.
3. **The Screenroom r1 panels are re-measured and the result stated either way.** If they turn out to
   be more alike than the current metric suggested, that is a finding to log, not a number to bury.
4. **The threshold is not tuned to make an existing round pass.** Written here before any number is
   known, because that is the point at which the temptation appears.
5. Zero dependencies. No `package.json`.
6. Register updated in the same commit.

## Honest scope limits, recorded up front

- **`adv-glass-legibility` stays partly out of reach even with pixels.** Sampling the backdrop tells
  us the composite; deciding whether the text over it is legible still needs the text's own colour
  and a contrast judgement against a *non-uniform* background. It will report the **worst-case region
  contrast**, which is a real measurement — but the register must not claim more than that.
- **`adv-motion-behind-text` needs two frames**, so it only applies where an animation exists; a
  static panel must return `notApplicable`.
- Pixel work runs **only where Chromium lives**. On Windows these rules must report `unavailable`,
  never a pass — the same three-state discipline `computed-runner.mjs` already enforces.
