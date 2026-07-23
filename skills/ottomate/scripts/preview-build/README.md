# Preview build — the ONE command (Task 2 §4)

`fetch → extract → inject → emit` in a single step. The Screenroom run's biggest friction was doing
this in ~5 manual round-trips per mockup; this collapses it. Method: `references/stage-2-design-method.md`.

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
