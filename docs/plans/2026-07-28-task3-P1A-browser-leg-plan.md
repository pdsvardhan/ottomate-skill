# P1-A — The browser leg on Maps of Bharat (Task 3, Track B) · BUILD PLAN

> The first work package of Phase 1 per [`2026-07-28-task3-IMPLEMENTATION-PLAN.md`](2026-07-28-task3-IMPLEMENTATION-PLAN.md).
> **The point of the whole task:** the harness has never driven a browser. This ships one real
> Playwright spec that clicks/selects in the live UI and asserts the **system-state effect** (L1 + L2),
> producing surviving trace + video + screenshot evidence. Owner-confirmed target (2026-07-28).

## Goal
Drive the **Maps of Bharat** indicator-switch flow end-to-end in a real browser and prove — via an
independent second channel, not the UI's self-report — that selecting an indicator actually loads the
**correct dataset** and updates the **on-page stats/legend** to match. Canvas paint is out of scope; we
assert the DOM controls + the data behind them.

## Step 0 — Investigate MoB's real flow FIRST (design against reality, not imagination)
Do **not** write the spec from the two commenter breadcrumbs alone. Establish, from ground truth:
- **The DOM of the control:** the `CHANGE INDICATOR` button (`button.mt-3.w-full` per the 2026-07-03
  export) → what opens (a dropdown / modal / list), and how an indicator + admin level are chosen.
  Prefer `getByRole`/`getByTestId`; **`data-oid` is dead** — do not rely on it.
- **The URL contract:** known shape `?m=<metric>&lvl=<level>` (e.g. `m=literacy_rate&lvl=district`).
  Confirm the param names + a couple of real indicator ids + levels.
- **The data channel (for the 2nd-channel assertion):** which endpoint / static JSON serves the indicator
  values (so we can assert the on-page number for a district == the value in MoB's own data). Find it by
  reading MoB's source on VAULT7A **or** inspecting the live site's network panel.
- **The on-page observable:** what visibly updates on indicator change — a legend range, a stats panel,
  a "top/bottom districts" list, a title. Pick a **DOM-readable** value that reflects the data (not the
  canvas paint).

How to investigate (pick the lowest-friction that works): read MoB's repo on VAULT7A (Next.js app), or
load `https://mapsofbharat.vault7a.xyz/` and read DOM + network. Record findings inline in this plan.

## The spec (what it drives + asserts)
`scripts/feature-verify/mapsofbharat-indicator.feature-verify.spec.ts` — a **real browser context**
(not Playwright `request`):
1. **Navigate** to a known baseline (`?m=A&lvl=district`); wait for the data settle (a network idle on the
   data endpoint / a stable DOM signal — never `waitForTimeout`).
2. **Capture baseline** — read the on-page observable value for a fixed district (2nd-channel: also GET the
   data for indicator A and compute the expected value for that district).
3. **Act** — click `CHANGE INDICATOR`, select a *different* indicator B (getByRole/getByTestId).
4. **Assert the effect (L2 system-state, via a 2nd channel):**
   - the URL param `m` is now B (state changed);
   - the on-page observable value for the fixed district now equals **B's** value from MoB's data source
     (differential recompute — the number changed AND matches the independent data), **not** A's;
   - **metamorphic seed (L3):** A ≠ B ⇒ the rendered values must differ (non-constancy — catches a stuck
     control that changes the URL but not the data).
5. **Assert L1 implicit:** no console errors, no 4xx/5xx on the data fetch, the data response is
   well-formed + non-empty.
6. **Evidence:** trace + video + screenshot are already configured `on` — a real browser context makes
   them actually produce. Persist paths.

## The two acceptance cases (both required)
- **must-PASS:** the working indicator switch — B's data loads, the on-page value matches B's independent
  value, values differ from A. Verdict PASS with evidence.
- **must-FAIL:** a broken effect **BLOCKS**. Cheapest honest red: assert against a *deliberately wrong*
  expected value (or, better, point the spec at a state where the control is known-stuck) and confirm
  `Matrix.verdict()` returns **BLOCK**, the report records the failing case, and the **evidence path is
  openable** (trace/screenshot on disk). A gate that never blocked isn't proven. (This is also P1-B's
  seed.) **UNMEASURED (data endpoint unreachable / DOM signal never appeared) ⇒ FAIL**, never a silent pass.

## Run recipe (VAULT7A — the browser leg needs a real browser)
- **scp the harness to `/tmp/fv`** (NOT `/tmp/ottoskill` — Track A owns that) and
  `ln -s /opt/homeserver/ottomate/node_modules` next to it (ESM/Playwright resolve bare specifiers from
  the file's location).
- Env: `FV_BEARER_TOKEN` / `FV_PROJECT_SLUG=mapsofbharat` / `FV_RISK_POLICY` / `FV_ASSET_ROOT`.
- Drive the **live app** for the real UI; the disposable `:3100` DB mounts assets `:ro` (fine — this flow
  reads data, doesn't write files). MoB data reads only; no `POST /api/backup` needed for MoB itself.
- Persisting the verifier's own report to `feature_verification_reports` → **`POST /api/backup` first**
  (ONE DOOR; all DB via the API).

## Definition of done for P1-A
A real browser context ran; must-PASS passed and must-FAIL blocked; trace + video + screenshot exist on
disk and open; one `feature_verification_reports` row written (backup-first); the register's
feature-verifier row updated **in the same commit**; `git pull --rebase` before push. **Never claim a
browser leg that did not run** — attach the evidence.

## Then
P1-B (harden the red case + persist it as the standing proof) → P1-C (implicit-oracle layer) →
P1-D (metamorphic/property) → P1-E (mechanical-visual, wiring axe-core + Task-2's computed checks).
