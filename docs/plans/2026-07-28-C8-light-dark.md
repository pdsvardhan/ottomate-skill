# C8 — assert light AND dark actually render · unit plan

**Written 2026-07-28.** `prefers-color-scheme` is present in both preview templates, but **no check
asserts either world renders** — a design that clears contrast in light and fails in dark is half-broken
and nobody sees it in a single-scheme review. Closes half of AC4.

## Build — `scripts/design-check/scheme-check.mjs`, pure

The computed collector already tags every record with a `dark` flag ("which colour-scheme this set was
collected under"). C8 runs the **floors** over records collected under **each** scheme and reports the
failing scheme by name:

- `schemeContrastFloor(els, {min})` — per-element text-vs-own-background contrast, honest about scope
  (only elements that PAINT their own background and carry text; nearest-opaque-ancestor for inherited
  backgrounds stays a browser job). Reuses the existing `rgb`/`paintedBg`/`contrast`.
- `assertBothSchemes({light, dark}, opts)` — runs the floors on each scheme; **both must be measured**
  (a scheme not measured is not a scheme that passed) and every floor must hold in both. Returns the
  failing scheme(s) named.

The per-scheme *collection* in real Chromium (run the harness twice, once per `prefers-color-scheme`)
is the browser half and rides on the final test plan; the *assertion* is what this unit builds and tests.

## Acceptance — must-fail AND must-pass

- **Must-fail:** a panel meeting contrast in light but failing in dark is caught, **naming `dark`**.
- **Must-fail:** only one scheme supplied → refused ("not measured is not passed").
- **Must-pass:** a panel correct in both passes, and the report says **which schemes were measured**.
