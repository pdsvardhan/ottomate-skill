# C10 — theme-extract: guarantee accent contrast at derivation time · unit plan

**Written 2026-07-28.** A1 §3.10: derive by role, then **normalise lightness to the accent target and
clamp chroma so contrast is guaranteed at derivation time**. Today `extractAccent` only clamps HSV
*value* to `[0.55, 0.92]` — but contrast is a function of **relative luminance** (WCAG), not HSV V, so
a vivid-but-dark hue (a deep blue at V 0.9) can still fail against a dark surface. From a very dark
poster it can hand downstream an accent that fails the floor.

**Owner ruling 2026-07-28:** target the **dark canvas `#101216` at the WCAG 3:1 non-text/UI floor**
(the accent is a border/badge on a dark-mode-first surface), and clamp chroma.

## Fix — in `theme-extract.mjs`, corrective (not gratuitous)

1. WCAG `relLuminance(r,g,b)` and `contrast(l1,l2)`, inline (zero-dep).
2. An accent **luminance band** `[Llo, Lhi]`: `Llo = floor·(bgLum+0.05) − 0.05` (the exact luminance
   that clears the floor against the target bg — ≈0.116 for 3:1 on `#101216`), `Lhi ≈ 0.75` (above
   which it washes toward white and loses hue).
3. `normaliseForContrast(h, s, v, opts)` — clamp saturation into a chroma band, then adjust V
   (luminance is monotone in V at fixed h,s) to bring the colour **into** the band: raise if below
   `Llo`, lower if above `Lhi`, **leave untouched if already inside**. Corrective only — a well-behaved
   accent must not drift.
4. `extractAccent` calls it after the vibrant pick.

## Acceptance — must-fail AND must-pass (for the chosen dark-canvas / 3:1 target)

- **Must-fix (was-failing):** a dark-derived accent (a deep blue whose luminance < Llo) **fails** 3:1
  against `#101216` before the normalise and **passes** after.
- **Must-pass (unchanged):** the gold `#e9b84c` (luminance ≈0.52, already in band) is **not** moved.
- **Must-pass:** a very light accent still clears 3:1 on the dark canvas after the fix, and is
  chroma-clamped so it keeps its hue rather than washing to white.
- **Demonstrated on real posters (VAULT7A):** run `extractAccent` on a dark, a light and a mid poster;
  every returned accent clears 3:1 against `#101216`, and a poster that already yielded a good accent
  is unchanged.
