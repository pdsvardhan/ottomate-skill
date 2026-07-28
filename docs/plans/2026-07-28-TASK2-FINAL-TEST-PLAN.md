# Task 2 — the final, cross-parameter test plan (run LAST, once everything is built)

**Written 2026-07-28.** Owner ruling: *"whatever requires testing will do at last, with a proper test
plan, all kinds of scenarios, testing across parameters, once it's completely built. C12 is the
testing."* This is that plan. It is deliberately **not** run yet — it runs once the build is complete,
as one pass, so a defect is found against the finished system rather than a moving one.

Everything below is either the **6 §12 scenarios**, the **deferred browser runs** that unit tests
stood in for, or the **parameter matrix** that exercises routing/pairing across variety.

## 0. Environment & preconditions

- **Host:** VAULT7A (`/opt/homeserver/ottomate` resolves `playwright` + Chromium; the API is
  localhost-bound; the previews volume is a host path). Windows can run every *source* check but reports
  the computed pass `UNAVAILABLE` — so the browser legs MUST run on VAULT7A.
- **Recipe:** `scp` the plugin `scripts/` + `data/` to `/tmp/ottoskill` (siblings), set `OTTO_PW_ROOT`
  / `computed.cwd` to `/opt/homeserver/ottomate`. `POST /api/backup` before any run that writes.
- **Fixtures:** real screenroom source (`/mnt/storage/websites/screenroom`), real radarr posters
  (`/opt/homeserver/appdata/radarr/MediaCover/<id>/poster-500.jpg`), the 116-row live catalog, the live
  ledger. Throwaway project slug `zzz-t2-final` for the cold-start scenario (deleted after).

## 1. The six §12 scenarios (C12)

| # | Scenario | What it proves | Depends on |
|---|---|---|---|
| 1 | A single component, start to finish | intake → anatomy → round → gate → checker → computed → publish → pick → lock → emit, one target | all |
| 2 | **~20 components — the pairing table** | archetype/tier resolution, contested axes, channel grouping, render surface across variety | ✅ **run 2026-07-28** (`docs/audits/2026-07-27-C12-scenario2-pairing.md`) — re-run post-build to confirm no regression |
| 3 | New component on an existing project | context INHERITED (not re-interviewed), prior-art (ledger + source) consulted | prior-art, source-art (C9) |
| 4 | Unseen archetype forcing derive | `anatomy-derive` resolves a component with no hand-written entry | U2b hardening |
| 5 | Redesign of built UI | reconcile "already decided" (ledger) vs "already built" (`source-art`) → conflict named, not seeded | C9 |
| 6 | Cold start | Stage 0 → Stage 3, no spec, no ledger, no components; context gate fires exactly once | pre-round-gates |

**Acceptance per scenario:** a working round **or a named refusal**. A scenario that "mostly worked" is
recorded as a **failure with the specific gap**. The point is to find gaps, not collect green ticks.

## 2. Deferred browser runs (unit tests stood in for these)

| Leg | Unit | Run |
|---|---|---|
| **Light AND dark render** | C8 `assertBothSchemes` | Collect the harness records **twice** (once per `prefers-color-scheme`) in real Chromium; assert the floors hold in both, on real round output |
| **The full computed pass** | `computed-checks.browser.test.mjs` (the 1 suite that only passes on VAULT7A) | Run green on VAULT7A; contrast / coherence / divergence on real panels |
| **A real rung-A round** | C4 `render-boards` | Render a 3–5 board set from real directions, publish it, confirm it renders isolated in the app iframe |
| **A real rung-C cluster round (C5)** | routing + `coreMechanicGate` | With a rung-1 mechanic **locked**, run a cluster round (the three `library-list` axes are a cluster in all but name) at real density on the measured screen (2194×1234), pick, lock |
| **theme-extract on real posters** | C10 | Re-run across a wide poster sample; **every** accent clears 3:1 on `#101216` (spot-checked 6/6 on 2026-07-28) |
| **Pixel comparison** | `pixel/*` | Capture real panels; near-identity guard + accent-budget by pixel share |

## 3. The parameter matrix (scenario 2, widened)

The pairing run is a test of routing across *variety*. Run it across the cartesian-ish spread and record
the table — the output IS the comparison:

- **tier** × {primitive, composite, surface}
- **archetype** × {registered: media-card/button/data-table-row} ∪ {derived: everything else}
- **scope** × {component, cluster, page, site} → rung routing (`routeRungs`)
- **entry** × {stage-2, stage-4-item, deferred-overhaul, ui-mode:none}
- **profile** × {P1, P2, P3} → `resolveFloor` binds different floors
- **source** × {catalog hit, bespoke-with-why} → source policy
- **stack idioms** × {shadcn `cn`/`cva`, Radix `<X.Y>`, Tailwind-only, `data-role`-stamped} → the U2b axes

For each cell: does it route to the right rungs / anatomy / render surface, and does the composition
group ≤5 contested axes by channel? A cell that mis-routes is a defect with the cell that exposed it.

## 4. Cross-cutting assertions (run over every scenario)

- **Fail-closed everywhere:** a blocked gate/checker/computed rule writes NOTHING (assert no file, no row).
- **Never invent:** an unresolved locked decision blocks the emit (C1); a novel token needs source
  corroboration (C1); derive refuses an out-of-registry question (U2b/rule 40).
- **Provenance honest:** a graduation dry-run on a real catalog row reproduces its grade; no A without
  author (now 48 real A rows); RED licence caps at C.
- **Traceability:** every published variant carries its label (T5); a pick round-trips `mixed_from`.

## 5. Order & reporting

Run **1 → 6** in order (each builds on the last), then the browser legs (§2), then widen §3. Record every
result in a dated audit under `docs/audits/`, defects into the register Known-defects table with the
scenario that exposed each. **No threshold is ever moved to make a scenario pass** — log the defect.
