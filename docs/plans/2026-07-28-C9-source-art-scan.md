# C9 — the prior-art SOURCE scan ("already built") · unit plan

**Written 2026-07-28.** The ledger half of prior art is done (`prior-art.mjs`: "is this already
*decided*?"). C9 is the source half: "what does the built code already *use*?" — so a round does not
re-decide a token the project has already shipped, and a disagreement between the ledger and the code
is surfaced as a **conflict**, never silently resolved.

## Scope, honestly bounded

This reads **declared** design tokens — `--name: value` custom-property declarations in the project's
CSS/source. That is a legitimate source scan (declared values, comment-stripped, multi-file), and it is
**not** a naive grep: comments are stripped and only real declarations match. What it does **not** do is
read *resolved* values (what a component actually computes after the cascade) — that needs a browser and
stays the computed follow-up. The register will say which one this is.

## Build — `scripts/generation/source-art.mjs`, pure

1. `extractDeclaredTokens(css)` — strip `/* … */`, match `--name: value;` declarations; last-wins per
   name, but every distinct value seen is kept so an intra-file contradiction is visible.
2. `scanSourceArt(files)` — `[{path, css}]` → `{name → {value, sources:[{path,value}], conflict}}`,
   flagging a token declared with different values across files.
3. `reconcileSourceArt({ sourceTokens, ledger, registry })` — for each token-shaped question, match a
   source token by the emitter's own suffix (`corner-radius` → `--{t}-radius` → suffix `radius` → any
   `--*radius`). Verdict per question: `already-built` (source has it, ledger has no lock) ·
   `consistent` (source == locked ledger value) · `conflict` (source ≠ locked ledger value — names
   **both**) · `none`.
4. `formatSourceArt(...)`.

## Acceptance — must-fail AND must-pass

- **Must-pass:** a project CSS with `--radius: 8px` and a round about to decide `corner-radius` reports
  it as **already-built** (value 8px), available to consider.
- **Must-fail:** the ledger holds a **locked** `corner-radius = 12px` and the code declares
  `--radius: 8px` → **conflict**, naming both the ledger value and the source path/token; the reconcile
  output carries **no** seeded value (the round is not silently fed either).
- **Must-pass:** agreement (locked 8px, source 8px) reads `consistent`, not a conflict.
- **Must-pass (not a grep):** a `--radius` that appears only inside a CSS comment is **not** extracted.
- **Must-fail:** the same token declared with two different values across two files is reported as an
  intra-source conflict.
