# S1b — the catalog drift, classified

**2026-07-27.** Prerequisite for Stage 4: graduation writes *into* `master_components`, and the table
was 57% out of sync with its own asset volume. Per-dir data: `2026-07-27-S1b-catalog-drift.json`.

## The numbers, corrected twice while measuring

| | |
|---|---|
| Entries under `/mnt/storage/ottomate/assets/components/` | **267** |
| …of which actual directories | **266** |
| …stray file | **1** — `registry.json`, dated **Apr 5**, a pre-`master_components` snippet registry ("Claude picks from these during Step 5"). Unrelated to the drift; it is not a component |
| Registered in `master_components` | **116** |
| **Unregistered directories** | **150** (not 151 — the first count included `registry.json`) |
| **Registered rows with no directory** | **0** — nothing is broken in the other direction |

## Classification — every one of the 150 in exactly one class

| Class | Count | What it is | Re-ingestable? |
|---|---:|---|---|
| **A — render-inline ready** | **66** | `export default`, zero props, no `@/` alias | **Yes** — the only clean class |
| **B — default export, takes props** | 4 | Renders, but the sandbox needs a zero-prop default export | Needs a wrapper |
| **C — default export, aliased import** | 1 | `@/…` will not resolve in the sandbox | Needs an import rewrite |
| **D — named export + aliased import** | **58** | Both blockers at once | No, as-is |
| **E — named export, no alias** | 16 | Named export only | Needs a wrapper |
| **web-multifile** | 5 | html/css/js (codepen-style): `mc-liquid-gradient-bg`, `mc-moon-toggle`, `mc-pure-css-glassmorphism…`, `mc-scroll-animation-with-grid-motion`, `mc-swiper-js-carousel…` | Different pipeline |
| | **150** | sum checks | |

**Top external imports across the 150:** `react` 68 · `lucide-react` 49 · `motion/react` 16 ·
`radix-ui` 10 · `@coss/ui/lib/utils` 9 · `class-variance-authority` 5 · `@tanstack/react-table` 5.

## What this falsifies

**The register and the memory index both say the 2026-07-04 sourcing sprint produced ~90 "AUTHORED
self-contained render-inline" components and that "178/179 render LIVE".** Against the disk today,
**only 66 of the 150 unregistered dirs are render-inline-ready.** 58 are named exports with
unresolvable `@/` aliases — exactly the "raw registry items mostly fail (needs-context /
unresolvable-alias)" failure the sprint's own notes describe, which suggests a later pass added
registry pulls that never rendered and never registered.

A worked example, read in full rather than inferred — `mc-ai-token-counter`:

```tsx
import { cn } from "@/lib/utils";
type Props = { used: number; limit: number; className?: string };
export function TokenCounter({ used, limit, className }: Props) {
```

Named export, required props, unresolvable alias. Three separate reasons it cannot render in the
sandbox, in a 752-byte file. It is not a registration that got lost; it is a component that was never
finished.

## Recommendation

**Do not bulk re-ingest.** Only **class A (66)** is a genuine "built, renders, never registered" case,
and even those must enter through the **S3 provenance gate** so they arrive with provenance instead of
being back-filled later — which is the exact debt Stage 4 exists to stop accruing.

Classes B/C/E (21) are recoverable with a wrapper or an import rewrite; that is component work, not
catalog work, and belongs in its own unit. Class D (58) should be treated as **unfinished source, not
catalog candidates**.

**Nothing is deleted in this unit.** Orphan asset dirs are known to be unsafe to remove — some are
fixture dependencies.
