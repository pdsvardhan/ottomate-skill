# Stage 2.2 — UI Master Plan

> **POST-AUDIT AMENDMENTS (2026-04-29):** Per `references/stage-amendments.md`:
> - Replace single-shot "propose 2-3 themes" with **3-stage panel**: Stage A (2-3 directions) → Stage B (flesh-out + sample component preview) → Stage C (lock-in gate)
> - **WCAG AA contrast HARD gate** (any sub-threshold pair blocks lock until fixed)
> - Light palette derived mechanically from dark via culori/chroma-js
> - Type scale + spacing + breakpoints derived from chosen ratios
> - `ui_master_plans.version` row; Stage 4 changes require new version + ADR
> - Conflict detection vs `Doc 1.preferences` (0.8) at every Claude pass

**The lock-in gate for the visual identity.** Theme + palette + fonts + animation level + aspect ratios get locked here. Stage 3 cannot change them without going back through this gate.

## Inputs

- Doc 4 from Stage 1 (Pages — gives count + types)
- Doc 1.preferences.likes / dislikes (visual hints, e.g. "playful", "minimal", "neon", "earthy")
- Doc 1.target_devices (drives default aspect ratios)
- Optional: F3 inspirations from ND1 (sample sites the user liked)
- **NEW 2026-05-19** — Library-side `inspirations` table (27 seed rows from Dribbble + Figma community templates). When the user says "I want it to feel like X", query first:
  ```sql
  SELECT id, title, domain, style_tags, matched_master_component_ids, match_confidence
  FROM inspirations
  WHERE (:domain_hint = '' OR domain LIKE '%' || :domain_hint || '%')
    AND (:style_hint  = '' OR style_tags LIKE '%' || :style_hint  || '%')
  ORDER BY CASE match_confidence WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END;
  ```
  If 1-3 high/medium rows match, surface them via AskUserQuestion as "is this the vibe?" The selected `inspiration.id` is stored in `ui_master_plans.style_inspiration_id` and consumed at Stage 2.4 to seed the component candidates (see `stage-2-components.md` → "Inspiration cross-reference").

## Required choices (lock all of these)

### Aspect ratios
- `desktop` only · `mobile` only · `tablet` only · `both` (desktop + mobile)
- Default: `both`. Tablet folds into desktop unless user picks tablet-explicit.

### Theme modes
- **Both dark + light are MANDATORY.** No single-mode sites.
- Generate light palette from dark palette using a contrast-preserving algorithm (or vice versa).

### Palette (per mode)
- ≥3 accent colors per palette
- WCAG AA contrast for body text on background
- Save as `palette_dark` and `palette_light` JSON in `ui_master_plans` row

### Typography
- Heading family · body family · monospace family
- House defaults: Outfit (heading + body) + JetBrains Mono (mono)
- User can override; if so, propose 2-3 alternatives that match the project's vibe (use Doc 1.preferences as input)

### Animation level
- `none` · `subtle` · `smooth` · `playful`
- Map to Framer Motion preset later in Stage 3

### Spacing / shadow / radius / iconography
- Pick a scale token (e.g. 4-point grid, 8-point grid)
- Pick a shadow set (none / soft / dramatic)
- Pick a radius scale (sharp 0px / soft 6px / pill 999px)
- Icon library: lucide / heroicons / phosphor / tabler / custom

## Workflow

1. **Read inputs** via `GET /api/projects/<slug>/context-packet?include=preferences,pages`.
2. **Inspiration scan (NEW 2026-05-19)** — derive `domain_hint` from Doc 1 (problem statement + project type) and `style_hint` from preferences.likes. Run the inspirations query above. If 1-3 high-confidence rows match, AskUserQuestion: "Looks like one of these vibes — which?" Selected row's `matched_master_component_ids` is carried into Stage 2.4 candidate pool. If no match, continue to step 3 unchanged.
3. **Propose 2-3 themes** using preferences + sample sites + chosen inspiration (if any) as guidance. Use AskUserQuestion with previews — each option shows palette swatches + font sample as a small markdown preview.
4. **User picks** → AI fleshes out the chosen direction with concrete colors, font sizes, spacing tokens. Persist `style_inspiration_id` if step 2 surfaced one.
5. **Lock-in gate**: present the full UI Master Plan back to the user. Show a side-by-side panel with the user's preferences and the resulting choices. AskUserQuestion: confirm / adjust / restart.
6. **Persist** via `PUT /api/projects/<slug>/ui-master-plan` (NOT YET IMPLEMENTED — POST as part of project upsert for now).

## Tracker integration

Until the dedicated `ui_master_plans` upsert endpoint exists, use the project-level PATCH to record theme intent in a project tag or attached ADR. Phase 5 of the build adds the dedicated endpoint and a UI page.

## Output gate

The skill MUST NOT enter Stage 2 sub-stage 2.3 (component selection) without a confirmed UI Master Plan. The trigger phrase "let's pick components" advances; before that, every other phrase loops back to "let's lock the theme".
