# Stage 2 — scope × entry routing

**Scope is asked FIRST, and it selects the rungs.** A `component` scope that runs whole-vibe directions
is a bug. Executable in `scripts/generation/method-routing.mjs` (`routeRungs`, `routeEntry`).

## Scope → which ladder rungs run

| Scope | Target | Rungs (`routeRungs`) |
|---|---|---|
| `component` | one component (`data-oid`) | **B** + micro — `['component','micro']` |
| `cluster` | several components / a page region | **B → C-cluster** — `['component','cluster']` |
| `page` | one whole page | **C-page** (+ B for unsettled parts) — `['page','component']` |
| `site` | full overhaul / greenfield | **A → A½ → B → C** — `['direction','mechanic','component','cluster','page']` |

## Entry point → what context to (re)establish

| Entry | When | Context handling (`routeEntry`) |
|---|---|---|
| `stage-2` | designing before build (rare) | Full context gate; foundation set here |
| `stage-4-item` | a built component/page bugs you | **Inherit** locked context + foundation from the ledger; **do NOT re-interview** |
| `deferred-overhaul` | built on placeholders, now doing UI | Run the context gate **now** (it was skipped), then scope = `page` or `site` |
| **`ui-mode:none`** | **the DEFAULT — defer UI** | Record the decision (drop-with-reason), build neutral + `data-oid`, **run NO design round**, expect a later overhaul |

## Deferral is the default path — and it is safe *if* you protect three things

The owner's normal workflow is **build backend + placeholder UI first, design later "when bored."** That
is fully supported. But three things are expensive to retrofit — capture them up front even when UI is
deferred (`DEFERRAL` in the module):
- **Cheap to defer:** per-component look · whole-page style · micro-polish.
- **Expensive to defer:** **foundation tokens** (ramp/type-scale/radius) · **the core mechanic** ·
  **theme-from-content wiring.** Defer these and "rework" becomes a redesign.
- **Do up front even at `ui-mode:none`:** the context-gate answers (audience/use-cases/tone/primary
  screen, ~5 min) · "is this project asset-rich?" (wire theme-from-content early) · build
  visibly-neutral, replaceable UI with `data-oid` stamping on → later rework is a **swap, not a rewrite**.

The Stage-3 design gate (`stage-3-scaffolding.md`) enforces the deferral contract per audience profile:
advisory at P1/P2, blocking at P3.
