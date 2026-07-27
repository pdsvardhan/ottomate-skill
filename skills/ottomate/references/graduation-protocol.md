# Graduation protocol — promoting a bespoke variant into `master_components`

**Status: PROTOCOL + a non-writing hook. The full ingest subsystem is a separate unit — it needs a
migration (see the gap below).** Grounded in H1 (`docs/research/H1freeassetsourcingandingestion.md` §3).

When a bespoke variant is chosen and **locked**, and it proves reusable, it can graduate into the
`master_components` catalog so future rounds pick it (source_policy `library-first`). Graduation is NOT
"copy the winning markup into the catalog" — it is an ingest contract.

## The contract (H1)

1. **Provenance at ingest or it is lost forever.** Record source, author, SPDX licence id, licence URL,
   attribution string, retrieval date. **No provenance → quarantine, do not ship.** `[H1 §3.2]`
2. **Licence tiers.** GREEN (CC0/MIT/ISC/BSD/Apache-2.0/OFL-1.1 — use freely, keep notices) · AMBER
   (CC-BY/CC-BY-SA/custom-permissive — usable with an obligation) · **RED (`-NC`, `-ND`, unknown/unverified
   — reject).** A bespoke variant authored in-house is effectively GREEN (`library='ottomate'`), but a
   variant that pulled in any third-party asset inherits that asset's tier. `[H1 §3.3]`
3. **Tokenise on ingest.** A baked-in `#fff` is a **downgrade, not a finished entry** — route every
   literal through a token, ship a dark path. `[H1 §3.12]`
4. **Grade A–F on the fixed rubric; only A/B ship** (rendering fidelity, responsive, a11y, dark/light,
   self-containment/CSP, code cleanliness, distinctiveness). C = repair first; F = reject. `[H1 §3.13]`
5. **De-duplicate structurally AND visually** before adding (normalised-DOM hash + a rendered-screenshot
   perceptual hash). `[H1 §3.14]`
6. **NOTICES.** Any MIT/ISC/Apache/OFL/CC-BY asset that ships carries its notice; assemble the block
   from the entries used. `[H1 §3.15]`
7. **Brand marks:** the SVG data may be licence-clean while the **trademark is not** — a `trademark, not
   licensed` flag is required, and marks are never hand-drawn/approximated. `[H1 §3.5, D2 §3.6-3.7]`
8. **Named exclusions to encode:** Shadertoy (CC BY-NC-SA 3.0 — non-commercial *and* viral) · unDraw
   (per-image only; forbids repackaging in packs, scraping, AI-training) · Rive (WASM, dead in the
   no-eval sandbox). `[H1 §3.7-3.9]`

## ⚠ The schema gap (why the subsystem is a separate unit)

`master_components` (verified 2026-07-23) HAS `license_note`, `source_url`, `ingestion_method`. It LACKS
`spdx_id`, `author`, `attribution`, `retrieved_at`, `trademark_flag`, and `grade`. The full contract
therefore needs a **hand-written migration** adding those columns (ONE DOOR, backup-first, journal entry
by hand — never `drizzle-kit`), plus the grade runner, the dedupe hasher, and the NOTICES assembler.
That is the graduation *subsystem* — the next unit, not this one.

## What exists now — `graduate()` hook (does NOT write to `master_components`)

`scripts/generation/graduate.mjs` `draftGraduation(lockedDecision, source, provenance)` builds a **draft
record** — the fully-formed candidate entry (tokenised source, provenance, licence tier, a placeholder
grade) — and returns it for review. It **explicitly does not POST to `master_components`**, because the
target columns do not exist yet. When the migration lands, wiring the draft to a live insert is the
remaining step. This keeps graduation honest: the contract is captured and testable now; the live write
waits on the schema.
