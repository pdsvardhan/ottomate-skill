# A1 — Named directions (F1 ingestion)

**Category:** A · Foundations · **Size:** M · **Where:** plugin only, no DB
**Blocks:** B2/B3 (harness revision) — designing bundles around directions later is a retrofit.
**Source:** `docs/research/F1stylemovementsandvisualreference.md` (115 KB, the corpus's largest track)

---

## Why

The owner's ruling: *"if first gen is creative enough, reruns would be reduced drastically."* F2's core
finding is that **slop is the absence of a decision** — with nothing chosen, generation falls to the
statistical centre of its training data. F1 is the catalogue of things to *choose*: 20 named directions,
each with a type/colour/shape/motion recipe, what it signals, when it fits, how it fails, and how to
execute it convincingly.

Today generation commits to nothing. "Vibrant, glassy" is an adjective, not a direction — and F1 rule 3
says the single most common brief-to-direction failure is guessing from one adjective.

## What gets built

### 1. `data/design-directions.json` — the selection table (machine-readable)

Twenty rows from F1 §5.0, each: `id · name · family · signals · best_when · key_failure · a11y_risk`,
plus two flags this project needs:

- `trend_bound: true` for Y2K/Frutiger Aero, Neo-Brutalism, Material-3-Expressive (F1 rule 13 — live
  2025–26 trends; good for a nostalgia/consumer brief, risky for something that must look right in
  three years). **Say out loud which kind of bet is being made.**
- `a11y_risk: high` for Glassmorphism, Neumorphism, Cyber-neon-on-black, dark Terminal (rule 7 —
  high risk *by construction, not by accident*). Under P3 these need the contrast check against the
  **actual rendered background** plus a solid fallback gated on `prefers-reduced-transparency`.

Plus the **adjective → direction map** from F1 §4.2, because "modern/clean/professional" each map to
≥4 different directions depending on a second adjective.

### 2. Doctrine additions (`references/design-doctrine.md`)

The durable rules, cited — not the execution specs:

| F1 rule | Why it's durable |
|---|---|
| 1 — name exactly one direction, or two with one explicitly dominant, **before touching a token** | The commitment that prevents slop |
| 3 — "modern/clean/professional" are underspecified; always disambiguate with a second adjective or a real reference | The most common brief failure |
| 5 — a direction is a bet across **type + colour + shape/space + motion together**; changing only the palette is a re-skinned default | Exactly the F2 failure |
| 6 — every direction has 2–3 "authentic vs cosplay" markers; **hit at least two** | Turns "did we commit?" into a check |
| 9 — cap at two directions, one clearly dominant; a second contributes exactly one accent move | Prevents incoherence |
| 10 — match motion *character* to the family before tuning numbers (brutalism abrupt, luxury slow/un-springy, playful bouncy, terminal narrated) | Feeds `animation_vocab` |
| 11 — every recommended typeface must be free/open with licence stated; Helvetica/Univers/Futura/Frutiger/Didot are **commercial** | Prevents an unshippable pick |
| 13 — flag trend-bound choices explicitly | Owner decides the bet |
| 15 — no adjectives at all → Swiss-adjacent minimalism with editorial type discipline. **Boldness is opt-in, never a silent default** | The safe default |

### 3. On-demand execution specs

Each direction's full recipe lives in F1 §5.1–5.20 (~24 lines each). **Not ingested.** When a direction
is chosen, that one subsection is pulled from `docs/research/`. This is the build-item-driven policy
working as designed — 20 recipes loaded by default would recreate the degradation problem.

## How it plugs in

- **Rung 0 (direction) becomes real.** Today the ladder's top rung is "3–5 whole-vibe options" with
  nothing behind it. It becomes: map the brief's adjectives → 3 candidate directions → show them →
  the winner is a **frozen constant** for every rung below (G1 §4.5).
- **The chosen direction is a ledger field**, so every later round inherits it instead of re-deriving.
- **`animation_vocab` gets a source.** Motion character comes from the direction's family, so the
  constraint has something real to check against (build item C3).
- **The templated tax gets a defence.** F2's rows 5–8 (headline font, type pairing, hero layout) are
  scored against the committed direction rather than against nothing.

## Acceptance

1. `design-directions.json` parses; 20 rows; each has family, signals, best_when, key_failure, a11y_risk.
2. Adjective map resolves "modern" to ≥4 candidates and requires a disambiguator.
3. Doctrine carries the 9 rules above, each cited to F1.
4. A direction can be recorded in the ledger and read back.
5. Choosing a direction pulls only that direction's §5.x subsection — never the whole track.

## Out of scope

- Token math per direction (A1 colour, A4 material, A2 type own that).
- Building a variant *in* a direction — that's the harness (B2/B3).
- Genericness scoring — F2's rubric already exists.
