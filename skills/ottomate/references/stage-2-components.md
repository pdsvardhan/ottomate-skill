# Stage 2.3 + 2.4 — Master Components (revised per CC-2.3)

**REWRITTEN 2026-04-29 per audit (D-S2.3.1 through D-S2.3.8).** Old design had cross-project scan + classification during project flow; new design separates one-time seeding from the per-project gap check.

> **Design method (Task 2, 2026-07-23).** The per-component pick below is the *state layer*; the
> *method* that decides each pick — showing **2–4 real interactive variants side by side, tagged by
> source, picked/mixed by the owner** (fidelity-ladder Step B; **library-first, not library-only** — the
> catalog is a shortcut, and a bespoke variant is first-class when nothing in it fits) — lives in
> `stage-2-design-method.md`. The variants are shown **in the app** at
> `/projects/<slug>/design/<target>` (`scripts/preview-build/` builds the page,
> `scripts/generation/publish-round.mjs` publishes it), not static SpotlightCards, when the slot is
> taste-driven. ⛔ The Claude-Artifact host was retired 2026-07-27. The chosen
> variant + rationale is written to the `ui_master_plans.design_ledger` (uncapped) AND to
> `components.asset_library_ref` / `picked` as today. Honour the **colour-budget rule** and **vary on
> the open axis** (§6/§7 of the method).

## Storage redesign

Master components stored as:
- **DB row** = lightweight index (id, name, category, description, source_paths, primary_file, framework_tags, tags, dependencies, variants, preview_url, license_note, library, source_url, quality_grade, ingestion_method, dark_light_compat, responsive)
- **Filesystem** = source code at `/mnt/storage/ottomate/assets/components/<id>/<primary_file>` (container path `/asset-library/components/<id>/`)
- DB row points to filesystem (`source_paths` array); no large blob columns
- Category enum single source of truth: app `lib/categories.ts` (13 categories, taxonomy-refine 2026-06-29) — verify there or via `GET /api/master-components` if this doc seems to have drifted

Schema migration: `tracker-migrations/sql/0004_master_components_simplification.sql`.

---

## 2.3 — Per-project gap check (lightweight, runs every project)

### Purpose
Verify the master_components catalog can serve THIS project's component needs before Stage 2.4 starts. Detect zero-coverage gaps; warn on thin coverage; **never seed during project flow**.

### Inputs
- `Doc 4.pages[].components` — categories THIS project needs
- `master_components` table (assumed rich after one-time seed)
- `Doc 1.preferences.likes` — preference tags (e.g., "animated") for thin-coverage detection

### Logic (mechanical, but MAPPED — the two category vocabularies differ)

> 2026-06-10: a naive `mc.category = c.category` join is broken by construction —
> live project components use ~24 ad-hoc values while the catalog has its own enum.
> **Remapped 2026-07-02** onto the 13-category taxonomy (`lib/categories.ts`,
> taxonomy-refine 2026-06-29; old 18-id list retired). Until this mapping moves
> into the tracker as code, apply it here when computing coverage:

| Project category (Doc 4) | Catalog categories to count |
|---|---|
| input, button, filter, toolbar | buttons-actions, forms-inputs |
| display, card, badge, pill, list, grid, row, cell, callout, panel | cards, layout |
| viz, progress, timeline | data-charts, feedback-progress |
| navigation, tabs | navigation |
| feedback | feedback-progress |
| layout, hero | layout, sections |
| overlay, drawer | overlays |
| *anything unmapped* | WARN — surface to user, never silently pass |

```sql
-- catalog_count for one project category = rows in any of its mapped catalog categories:
SELECT COUNT(*) FROM master_components WHERE category IN (<mapped list>);
```

(Catalog-only categories — backgrounds-effects, text-type, scroll-motion, media-galleries — are matched via tags during option ranking, not via this gap check.)

For categories with `catalog_count`:
- **0 entries** → HARD halt: *"`data-charts` has 0 entries. Seed before continuing — see `/components-browser` to add."*
- **<3 entries** → SOFT warn: *"`feedback-progress` has 2 entries. 2.4 will offer 2 options + 'build new'. Continue?"*
- **≥3 entries** → pass

Plus user-bias check: if `Doc 1.preferences.likes` includes "animated", verify category has ≥3 entries with `tags LIKE '%animated%'`.

### When 2.3 HARD halts

User must seed at least 1 entry per missing category before continuing. Three paths (one-time seeding activity — separate from project flow):

1. **Path 1**: Tracker UI form `http://localhost:8110/components-browser`
2. **Path 2**: Skill helper `/ottomate seed-component <category>`
3. **Path 3**: Bulk import script `scripts/import-master-components.ts <seed-batch.yaml>`

After seeding, re-run 2.3 gap check.

### Token cost
0. Pure SQL.

---

## 2.4 — Per-Component Selection (the rule media-dashboard violated)

After 2.3 passes, walk every component on every page. Surface ≥2-3 options. User picks.

### HARD enforcement at exit

```sql
SELECT 
  COUNT(*) FILTER (WHERE picked = true) AS picked,
  COUNT(*) FILTER (WHERE picked = false AND skip_reason IS NULL) AS unresolved,
  COUNT(*) FILTER (WHERE picked = false AND skip_reason IS NOT NULL) AS skipped_with_reason,
  COUNT(*) AS total
FROM components 
WHERE project_slug = ?;
```

`unresolved > 0` → **HARD halt.** *"3 components on page-X have no picked option. Resolve before exit (pick / propose new / skip with reason)."*

### Per-page batched ranking

One Claude call per page (not per component). Inputs: all components on the page + their `purpose_on_page` + linked_features + linked_flows + ui_master_plan tag preferences + optional inspiration cross-refs from the `inspirations` table.

Output: for each component, ≥2-3 ranked options from `master_components`, prioritised by quality grade + aesthetic family match.

**Ranking SQL (revised 2026-05-19, uses new structured columns):**

```sql
-- Bind variables:
--   :cat         = e.g. 'buttons-actions'
--   :prefer_lib  = library to prefer (from ui_master_plan), e.g. 'aceternity' or '' for any
--   :prefer_tag  = single tag the project favours, e.g. 'modern' or '' for any
SELECT id, name, description, category, framework_tags, tags,
       library, quality_grade, source_paths, primary_file, preview_url
FROM master_components
WHERE category = :cat
  AND (:prefer_tag = '' OR tags LIKE '%' || :prefer_tag || '%')
ORDER BY
  CASE WHEN :prefer_lib != '' AND library = :prefer_lib THEN 0 ELSE 1 END,
  CASE quality_grade WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 ELSE 4 END,
  RANDOM()
LIMIT 5;
```

Then Claude picks the top 2-3 with rationale, factoring `purpose_on_page` and `linked_features`.

**Inspiration cross-reference (NEW 2026-05-19):**

If `ui_master_plan.style_inspiration_id` references an `inspirations` row (e.g. `insp-f3-vision-ui`), pre-pull its `matched_master_component_ids` JSON array and include those mc-ids as candidates BEFORE running the per-category SQL:

```sql
SELECT matched_master_component_ids
FROM inspirations
WHERE id = :insp_id;
-- Parse JSON → for each matched mc-id, ensure it appears in the candidate set
```

This is how the user gets "I like the Vision UI vibe" → `mc-shell-vision-glass` surfaces automatically as a Stage 2.4 candidate for the shell slot.

Token cost: ~500-1500 per page.

### Pick UI — Ottomate web app is PRIMARY (chat fallback as contingency)

**Status 2026-05-19 (iteration #5 B.5 landed):** the Ottomate page at `/projects/<slug>/components-pick` is live. The skill drives the user there by default. Chat fallback is the contingency path when the user can't open a browser or explicitly opts for it.

**Ottomate web app (PRIMARY):**
- URL: `https://ottomate.vault7a.xyz/projects/<slug>/components-pick` (externally) or `http://127.0.0.1:8110/projects/<slug>/components-pick` (server-side)
- Per-page sections with the project's `pages` rows, each showing every unpicked `components` row underneath
- Per-slot: 3 SpotlightCards (top-ranked `master_components` by token + quality score) + Skip-with-reason form
- Skill direction: render `AskUserQuestion` with two options — **"Open in browser"** (recommended) or **"Pick in chat"** (fallback)
- After the user picks "Open in browser", skill polls `GET /api/projects/<slug>/components-pick/status` every ~10s; when `unresolved === 0` the gate releases
- Status response shape: `{ total, picked, skipped, unresolved, ready_for_stage_3, by_page }`
- API endpoints exposed today:
  - `GET /api/components/<id>/component-options` — single-slot ranked options
  - `POST /api/components/<id>/pick` — body `{asset_library_ref}` or `{skip_reason}` (mutually exclusive)
  - `GET /api/projects/<slug>/components-pick/status` — rollup

**Chat fallback (CONTINGENCY only):** when the user explicitly chooses chat picking, run one `AskUserQuestion` per component slot, presenting the top 2-3 ranked options as choices. Write the pick to `components.asset_library_ref` + `picked=true` via `POST /api/components/<id>/pick`.

**For Stage 4 iteration-time picks (4.4.5 gate)** the existing per-iteration-item endpoints stay:
- `GET /api/iterations/<id>/items/<itemId>/component-options`
- `POST /api/iterations/<id>/items/<itemId>/pick-component`
These remain separate from the Stage 2.4 project-level picker described above.

### Cross-page consistency review

After all pages picked, Claude pass: "any component role used on multiple pages picked the SAME master_component? Or did `search-bar` end up as different components on different pages?"

Inconsistencies surface for user reconciliation.

### "More options" / "Propose new component" paths

- **More options** → Claude regenerates ranking with rejection_history input (~300-500 tokens)
- **Propose new component** → inline mini-seed activity scoped to this project (`/ottomate seed-component <category>`); writes to filesystem + master_components row; provenance: `proposed_during_project=<slug>`

### Variant selection

When a picked master_component has `variants: ["primary", "ghost", "icon-only"]`, Claude proposes which variant fits the slot. User confirms.

### Phase ledger transitions

- `components.current_phase: PROPOSED → COMPONENT_PICKED` for every row
- Logged in `component_phase_transitions` with `evidence_kind=stage_2_4_user_pick`

### Anti-gaslight hooks

- `picked_provenance` records every offered option + why-picked → audit "why did this slot end up as `mc-search-bar-animated`?"
- Cross-page consistency review prevents silent drift
- HARD halt at exit on unresolved slots — no media-dashboard regression
- Skip-with-reason path requires user-typed reason
- Phase transition logged

### Style-fit filter (mechanical pre-filter before Claude ranks)

Excludes catalog entries whose tags conflict with `ui_master_plans`:
- `animation_level: subtle` → exclude `playful` tagged components (unless no other options)
- `target_devices: mobile` → exclude `desktop-only` tagged components

Saves Claude inputs.

---

## Stage 4 component changes

Iteration items with `item_type IN ('component_modification', 'new_feature_request')` AND any UI involvement MUST route through `/iterations/<id>/items/<itemId>/pick-component` (Stage 4.4.5). Same ≥2-3-options pattern as 2.4 but scoped to one item.

Stage 2.4 picks are permanent until ADR + new pick at 4.4.5.

---

## Token cost summary

- 2.3 gap check: ~0 tokens (pure SQL)
- 2.4 per-page ranking: ~3-7K tokens (depending on page count + component count)

Justified — picking wrong components compounds into Stage 3 rebuild waste.

---

## What changed vs old design (audit-driven)

| Old | New |
|---|---|
| Cross-project scan during project flow | One-time seeding activity (separate from project flow) |
| 7-phase classify+dedup+seed-walk in 2.3 | 2.3 = SQL gap check only |
| `master_components.source_code` blob column | filesystem pointer (today: `source_paths` array; was `source_code_path` until 2026-06) |
| 2.4 sometimes silently skipped (media-dashboard regression) | HARD enforcement: every component must exit `picked=true` OR `skip_reason IS NOT NULL` |
| Cross-page consistency post-hoc | Claude review pass at end of 2.4 |
| Variants implicit | Variant selection sub-pick when applicable |

---

## Theme-from-content (Task 2 — the core differentiator, "the whole identity")

For **asset-rich** projects, derive per-item design tokens from the **real content itself** rather than
fixed hues — e.g. each media card's border colour from that poster's dominant vibrant colour. Borders
then always harmonise with real artwork (impossible with a fixed palette). In the Screenroom run this
was **not garnish — the poster-derived border WAS the product's identity.**

**Extractor recipe** (ImageMagick, pluggable — `scripts/preview-build/theme-extract.mjs`):

1. Downscale + quantise to ~8 colours: `convert <img> -resize 120x120 -colors 8 -depth 8 histogram:info:-`.
2. Parse the histogram (count + hex per colour). For each, compute HSV.
3. **Score = saturation × value × prevalence**; **skip near-black (V < ~0.15) and near-grey (S < ~0.12)**.
4. Pick the top; **boost for contrast** against the card background (nudge lightness so the border reads
   on both light + dark). Emit the hex as that item's `--card-accent` token.

**Colour-budget still applies:** the derived accent goes on the **poster edge only** (+ maybe one CTA) —
neutral everywhere else; do NOT tint ratings/specs/tables with it (the #1 rework in the real run). Keep
purposeful colour elsewhere (stat tiles, semantic states) — restraint ≠ monochrome.

**Wiring:** the one-command preview pipeline (`stage-2-design-method.md` §4) runs the fetcher + extractor
and injects `{{IMG_x}}` (data: URI) + `{{--card-accent}}` per card into the self-contained Artifact
template. Per-project asset-source config (where the real assets come from — a media path, Radarr/TMDB,
a project API) is the only reason theme-from-content is sequenced as a first-class Phase-2 wire rather
than default-on. Derive tokens from real content **wherever it improves cohesion**, not only posters.
