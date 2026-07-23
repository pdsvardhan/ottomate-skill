# Preview build — the ONE command (Task 2 §4)

`fetch → extract → inject → emit` in a single step. The Screenroom run's biggest friction was doing
this in ~5 manual round-trips per mockup; this collapses it. Method: `references/stage-2-design-method.md`.

**Two commands, one pipeline:**

```bash
node build-variant-set.mjs <variant-set.json>   # N labelled variants + the isolation gate  ← use this for a design round
node build-preview.mjs     <config.json>        # a single preview (one locked design, no options)
```

## The variant harness — `build-variant-set.mjs`

This is the command a **design round** runs. It emits **one page containing N labelled variants** that
differ on exactly one named axis — decision D2 and core-loop rule 2, mechanised.

```bash
node build-variant-set.mjs density-set.json
# → variant-set.html           one page, N panels, randomised slot order (publish to the SAME URL)
# → variant-set.manifest.json  axis, resolved tokens per variant, slot→variant map, full gate result
```

**It refuses to emit a set it has not proven.** The isolation gate (`isolation-gate.mjs`, G1 §4.3) runs
*before* anything is written; on failure it prints why, writes **nothing**, and exits **2**. The caller
regenerates. Fail closed — the same principle as the Task-3 feature verifier.

| Gate check | What it proves | Source |
|---|---|---|
| `count` | Option count fits the fidelity rung (rung 2 = 3; rung 4 = 2). Never 1, never 6+ | G1 §4.4 |
| `labels` | Labels are neutral, distinct, and nothing is marked recommended/preselected | G3 §3.4/§3.5 |
| `control-diff` | **No variant moves anything outside the declared axis** — the check that makes a lock *true* rather than a guess about why the owner picked | G1 §4.3 step 4b |
| `axis-diff` | Every **pair** differs on the axis by ≥ the minimum relative step (default 15%) | G1 §4.3 step 4a |
| `blind-sort` | Each variant's level is nameable. Deliberately **scale-invariant** — it answers "can the level be named?", never "is the gap perceptible?" (that's `axis-diff`'s call) | G1 §4.3 step 4c |
| `structural` | Structural axes only: the rendered **tag/class/CSS-property fingerprint** actually diverges. Frequency-aware cosine, so prose and embedded posters can't move the number | G1 §4.3 |

Content (posters, copy, ratings) is built **once** and shared by every panel, so "functionally
identical, stylistically distinct" (G1 §3.7) is a structural guarantee, not a hope.

### Variant-set config

```jsonc
{
  "axis": {
    "name": "density",
    "parameter": "card padding + meta lines shown + card min-width + line-height",
    "rung": 2,                    // 0 direction · 1 mechanic · 2 component · 3 cluster · 4 page · 5 micro
    "params": ["pad", "metaLines", "cardMin", "lineHeight", "titleSize"],
    "minRelStep": 0.15,           // [REASONED] G1 §8 — an engineering default, tune per axis
    "kind": "token"               // or "structural" — then each variant supplies a `panelTemplate`
  },
  "control": { "radius": 10, "gap": 14, "actionColour": "#ff5a4d" },   // frozen in every panel
  "variants": [
    { "label": "spacious", "caption": "roomy — title, meta, rating, play",
      "axis_values": { "pad": 22, "metaLines": 3, "cardMin": 200, "lineHeight": 1.62, "titleSize": 16 } }
    // … 2 more
  ],
  "shuffleSeed": 20260723,        // omit for a fresh shuffle each round
  "assetRoot": "…", "cards": [ … ]
}
```

A key declared in **both** `control` and `axis.params` fails the gate, as does a variant that sets a key
outside `axis.params` — that is the contamination which turns "we locked density" into a colour
preference nobody recorded.

### Tests

```bash
node isolation-gate.test.mjs    # 20 cases: the pass case + every failure mode G1 §6 names
```

## Single preview — `build-preview.mjs`

For a locked design with no options left to show.

```bash
node build-preview.mjs <config.json>
# → preview.html   body-content-only, self-contained (publish via the Artifact tool)
# → tokens.json    the extracted per-card accents (feed into ui_master_plans.design_ledger)
```

Then publish with the **Artifact tool** using the **same `file_path` every round** — that keeps the
**stable URL** (the "one evolving preview" non-negotiable). Never mint a new URL per round.

| File | Role |
|---|---|
| `theme-extract.mjs` | Theme-from-content: ImageMagick histogram → dominant **vibrant** colour, skipping near-black/near-grey, boosted to read on light AND dark. Pluggable (`extractAccent()` is the only contract). Also a CLI: `node theme-extract.mjs <image>`. |
| `build-preview.mjs` | The one command: resolves assets, downscales + embeds them as `data:` URIs, extracts each accent, injects into the template, **fails loudly if any `{{PLACEHOLDER}}` is left unfilled**, writes the preview + tokens. |
| `template.card-wall.html` | Self-contained interactive poster wall: per-card border = that poster's own colour; colour-budget honoured; light + dark via tokens (`prefers-color-scheme` + `data-theme` override); hover lift/glow; `prefers-reduced-motion` respected. |

## Config

```jsonc
{
  "title": "Screenroom",
  "subtitle": "…",
  "template": "template.card-wall.html",
  "output": "preview.html",
  "tokensOut": "tokens.json",
  "posterWidth": 340,                    // downscale so the self-contained page stays small
  "colorBudget": { "accent_surfaces": ["poster-edge"], "rule": "neutral everywhere else" },
  "assetRoot": "/mnt/storage/media/movies/Indian",
  "cards": [ { "title": "…", "meta": "…", "rating": "8.1", "owned": true, "image": "Film (2006)/poster.jpg" } ]
}
```

`assetRoot` + `cards[].image` is the **per-project asset-source config** — swap it for a project API
fetch (Radarr/TMDB/your own) by extending the asset step; everything downstream is unchanged.

## Rules this pipeline enforces

- **No unfilled placeholder ever ships** — a half-filled preview misleads the owner (§5).
- **Real content, never lorem** — a fake rainbow poster once read as "Holi on a card" and had to be redone.
- **Self-contained** — assets embedded as `data:` URIs; the artifact CSP blocks every external request.
- **Colour-budget** — the derived accent is spent on the frame only; the action colour (coral) and the
  purposeful fixed colours (stat tiles) are deliberately NOT the derived hue. Restraint ≠ monochrome.
- **Same URL each round** — republish the same file path; locked items carry forward untouched.

## Gotcha

Don't write a literal `{{TOKEN}}` into the template's own comments — the substitution would fill the
comment instead of the real slot. (It did; the placeholder guard caught it. Names are spelled without
braces in the template header for this reason.)
