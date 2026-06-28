---
description: "Add a new component to the master_components asset library (one-time seeding)"
argument-hint: "[component name or category, optional]"
allowed-tools: [Bash, Read, Write, AskUserQuestion]
---

# /ottomate seed-component — Add Master Component

Helper to add a single new component to the master_components asset library (CC-2.3 Path 2). Walks the user through metadata + source code paste, writes file to filesystem + creates DB row.

The user's request: $ARGUMENTS

## Workflow

### 1. Determine intent

If `$ARGUMENTS` is empty, ask:
> "Adding a new master component. What category?"
>
> AskUserQuestion with options from the **13 refined categories** (taxonomy-refine
> 2026-06-29 — the single source of truth is the app's `lib/categories.ts`; the
> older 18-category list with empty utilitarian buckets was retired):
> 1. `buttons-actions` — Buttons & Actions
> 2. `cards` — Cards
> 3. `text-type` — Text & Type
> 4. `backgrounds-effects` — Backgrounds & Effects ⭐
> 5. `navigation` — Navigation
> 6. `media-galleries` — Media & Galleries
> 7. `data-charts` — Data & Charts
> 8. `feedback-progress` — Feedback & Progress
> 9. `scroll-motion` — Scroll & Motion ⭐
> 10. `layout` — Layout
> 11. `forms-inputs` — Forms & Inputs
> 12. `overlays` — Overlays
> 13. `sections` — Sections

The catalog is a **showcase of distinctive / animated components**, not an
exhaustive primitive library. Bias toward eye-catching, self-contained pieces;
every new component MUST render inline in the preview sandbox (a self-contained
default export with no required props bundles + renders automatically — see the
17 first-party components seeded under these gap categories). If `$ARGUMENTS`
matches a category name or keyword, pre-fill the category.

> **NOTE (drift guard):** the live `category` enum is whatever
> `lib/categories.ts` exports — verify against it (or `GET /api/master-components`)
> before seeding; do not trust this list if it has drifted.

### 2. Collect metadata via AskUserQuestion

Sequential prompts (per output-style.md — keep tight):

- **Name** (e.g., "Magnetic Button"): free-form (1-80 chars)
- **ID** (auto-derived: `mc-` + slugified name): user can override
- **Description** (1-2 sentences): free-form (1-500 chars)
- **Tags** (multiselect from `[basic, modern, animated, interactive, accessibility-first, dark-only, light-only, responsive]`): user picks ≥1
- **Framework** (multiselect from `[react, next, vue, svelte, vanilla]`): user picks ≥1
- **Variants** (free-form list, optional): e.g., "primary, ghost, icon-only"
- **Dependencies** (free-form list, optional): e.g., "framer-motion, lucide-react"
- **Preview URL** (optional): e.g., "https://ui.aceternity.com/components/magnetic-button"
- **License** (optional): e.g., "MIT (Aceternity UI)"

### 3. Source code paste

> "Paste the component source code below. (Press Enter twice to finish.)"

Capture user input (multiline). If they paste a file path instead, read from that path.

If empty → abort with reason.

### 4. Confirm before write

Render summary panel (per output-style.md):

```
NEW COMPONENT — confirm before save

  ID:           mc-button-magnetic
  Name:         Magnetic Button
  Category:     buttons-actions
  Description:  Cursor pulls the button toward it on hover.
  Tags:         [animated, modern, interactive]
  Framework:    [react, next]
  Variants:     [primary, ghost, icon-only]
  Dependencies: [framer-motion]
  Preview:      https://ui.aceternity.com/components/magnetic-button
  License:      MIT (Aceternity UI)
  Primary:      react.tsx (245 lines)

  Will write to: /mnt/storage/ottomate/assets/components/mc-button-magnetic/
  And insert: master_components row id=mc-button-magnetic

[ Save ]   [ Edit a field ]   [ Cancel ]
```

### 5. Write to filesystem + DB (on Save)

```bash
ssh pdsv@192.168.1.10 'mkdir -p /mnt/storage/ottomate/assets/components/<id>/'
# SCP source code or write via SSH
ssh pdsv@192.168.1.10 'cat > /mnt/storage/ottomate/assets/components/<id>/<primary_file>' <<< "<source>"
```

Then insert DB row via REST API:

```bash
curl -X POST http://127.0.0.1:8110/api/master-components \
  -H "Authorization: Bearer $(ssh pdsv@192.168.1.10 'cat /opt/homeserver/ottomate/.token')" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<id>",
    "name": "<name>",
    "category": "<category>",
    "description": "<description>",
    "source_code_path": "/mnt/storage/ottomate/assets/components/<id>/",
    "primary_file": "<primary_file>",
    "framework_tags": ["react", "next"],
    "tags": ["animated", "modern"],
    "dependencies": ["framer-motion"],
    "variants_json": ["primary", "ghost"],
    "preview_url": "<url>",
    "license_note": "<license>"
  }'
```

### 6. Confirm + summary

```
✅ Component added — mc-button-magnetic
   File: /mnt/storage/ottomate/assets/components/mc-button-magnetic/react.tsx (245 lines)
   DB row: master_components.id = mc-button-magnetic
   Catalog count: 16 (was 15)

Add another? [Yes / No, done]
```

## Failure modes

| Failure | Recovery |
|---|---|
| ID already exists | AskUserQuestion: "ID `<id>` taken. Use different ID? Pick one: [auto-derived alt] / [user types]" |
| Source code empty | Abort with "no source provided; aborting" |
| API returns 401 | Bearer token issue; surface check `references/credentials.md` |
| API returns 409 (duplicate) | Same as ID-exists; offer rename |
| File write fails | Surface filesystem error; abort DB insert |

## Bulk path

For >10 components, prefer the bulk script:

```bash
# Prepare seed-batch.yaml offline with N entries
ssh pdsv@192.168.1.10 'cd /opt/homeserver/ottomate && tsx scripts/import-master-components.ts ./seed-batch.yaml'
```

## Anti-gaslight

- Every new component carries `_provenance: { added_via: "/ottomate seed-component", added_by_session, added_at }` (writable to component's metadata, optional)
- Source code is on filesystem; DB row is index only — easy to audit + diff
- License attribution required if source is from external library

## Use case

User reaches Stage 2.4 (per-component selection) for a project. Skill detects gap (category X has 0-2 entries; user's project needs ≥3 options). Skill suggests:

> ⚠ Category 11 (Data Visualisation) has 1 entry; need ≥3 for this project's chart features.
>
> Options:
> [1] Add 2 more components now (`/ottomate seed-component data-visualisation`)
> [2] Continue with what's available (skill will offer 1 + "build new")
> [3] Pause and seed later

User picks Option 1 → skill calls `/ottomate seed-component data-visualisation` → walks through adding line-chart, bar-chart components → returns to Stage 2.4 with full options.
