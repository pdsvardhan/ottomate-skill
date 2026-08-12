# Feature-verify harness (Task 3)

The **deterministic core** of the feature verifier — the sibling gate to the code verifier.
It drives the **real running app** like a QA human, feeds it real + nasty inputs, and asserts
**user-visible outcomes + system state, with evidence**. Method + dispatch prompt:
`references/stage-3-feature-verifier.md` · `prompts/feature-verifier-prompt.md`.

## What's here

| File | Role |
|---|---|
| `harness/config.ts` | Env-driven config (`FV_*`) — instance URL, tracker base, token, evidence root, asset root, risk policy. |
| `harness/selectors.ts` | Stable-selector helpers. **`oid()` is dead code — zero call sites; do not build on it.** Bind to `getByRole`, then the app's own `data-testid` / `data-widget`. No self-healing selectors on the gate. |
| `harness/system-state.ts` | `assertFileOnDisk` (fs bytes) · `assertViaApi` (DB-via-API, ONE DOOR) · `pollUntil` (async effects). |
| `harness/unicode.ts` | `SCRIPT_FIXTURES`, `NORMALIZATION_PAIR`, `assertNfcPreserved` — the NFC-vs-NFD headline recipe. |
| `harness/evidence.ts` | Per-case evidence dirs, bytes-as-proof, `writeMatrix` (matrix.json + summary.md). |
| `harness/report.ts` | `Matrix` (records cases, computes the verdict, fail-closed) + `postReport` / `postFlowTestRun`. |
| `playwright.feature-verify.config.ts` | The gate config — evidence always on, 1 worker, retries:0. |
| `visual-qa-import.feature-verify.spec.ts` | Worked example (`<feature>.feature-verify.spec.ts` naming) against Ottomate's own visual-QA import — also the dogfood. |

## Instantiate into a project

1. Copy this whole `feature-verify/` dir into the project's `tests/e2e/feature-verify/`.
2. Ensure the project has `@playwright/test` (every Ottomate scaffold does).
3. **Add `testIgnore: '**/feature-verify/**'` to the project's ROOT `playwright.config.ts`.**
   The feature verifier is a SEPARATE test project (its specs call `loadConfig()` at import and
   need `FV_*` env), invoked explicitly with `-c .../playwright.feature-verify.config.ts` — never
   part of the default `test:e2e`. Without this the default suite imports them and throws.
4. Author `<feature>.feature-verify.spec.ts` next to `harness/` — import from `./harness`.
5. Bind to the app's OWN stable hooks — `getByRole` first, then `getByTestId` / `data-widget`.
   Where a needed element has no hook, add one to the component; never reach for a brittle
   CSS-or-text selector on the gate.

   **`data-oid` is dead** (`references/stage-3-feature-verifier.md`: "`oid()` is dead code with
   zero call sites"). This README told you to stamp it until 2026-08-11, which contradicted the
   reference and cost a session real time: screenroom's binding to its existing `data-testid`
   hooks was written up as a *divergence needing recording* when it was simply the documented
   contract. There is nothing to diverge from — using the app's own hooks IS the rule.

## The loop (per user-facing feature / Stage-4 item)

1. **Case-gen (lock-in first).** From the feature spec + ACs + linked flows, enumerate
   workflows × variants: happy · edge(empty·max·boundary·first-run) · error(net·provider-down·
   permission·timeout) · data(non-ASCII·large·duplicate·corrupt·mixed). Show the owner the
   matrix **before any run**; they add/cut cases. Only then author specs.
2. **Drive + assert system state.** Playwright drives the real workflow (clicks/typing/
   `setInputFiles` incl. folder uploads, or `request()` for API-driven features). After each
   action assert the **effect**: `assertFileOnDisk` / `assertViaApi` / `pollUntil`. A 200 is not
   proof — the file/row/rescan is.
3. **Unicode.** For every non-ASCII fixture: `assertNfcPreserved(stored, expected)` — codepoints
   preserved, not transliterated, bytes match in BOTH the DB row and the on-disk dirent.
4. **Explorer + Judge (Claude, in the build session).** Fuzz the playbook (adversarial inputs,
   races, error paths, boundary/state, visibility) and freeze each finding as a spec here; score
   only subjective cells against a rubric (advisory, never gates).
5. **Report.** `matrix.record(...)` each case, then `postReport` (rich sink) +
   `postFlowTestRun` per critical flow (what the deploy gate reads) + the CI subset to test_runs.

## Run

```bash
export FV_INSTANCE_URL=http://127.0.0.1:8110      # the running app to drive
export FV_TRACKER_BASE=http://127.0.0.1:8110      # where the report is filed
export FV_BEARER_TOKEN="$(cat /opt/homeserver/ottomate/.token)"
export FV_PROJECT_SLUG=<slug>
export FV_RISK_POLICY=block                        # cv/public: block ; personal: warn
export FV_EVIDENCE_ROOT=/tmp/feature-verify/$(date +%s)
export FV_ASSET_ROOT=/mnt/storage/ottomate/assets  # fs root for on-disk assertions (if any)
export FV_SESSION_ID=fv-<feature>-<date>

npx playwright test -c tests/e2e/feature-verify/playwright.feature-verify.config.ts
```

## Rules (the non-negotiables)

- **System-state is the anti-gaslight** — assert the real effect, not a status code.
- **Fail closed** — a skipped/mocked/errored case is never green (`Matrix` treats skipped as
  not-a-clean-pass → ITERATE, never APPROVE).
- **ONE DOOR (adr-018)** — DB assertions go through the app's API, never a second sqlite client.
- **No self-healing selectors** on the gate — role / testid / `data-widget` / ARIA only.
- **Both verifiers gate "done"** — block-on-red for cv/public, warn for personal (adr-014).
- **Owner-reviewed matrix before any run** — no invent-and-run.

## Pluggable layers (target project wires as needed)

`@axe-core/playwright` (a11y hard gate on user-facing pages) · `toHaveScreenshot`/Lost Pixel
(visual regression) · Lighthouse-CI (perf budgets) · Testcontainers (a disposable real Postgres/
Redis for isolated system-state). Each is optional — skip gracefully if unwired; never fake a
green. Phase 2 (only if wanted): an unattended-CI hosted VLM for subjective judging when Claude
isn't in the session.
