# Task 3 (Feature Verifier) — remaining work

**Status:** shipped but **ITERATE**, not APPROVE (independent verification 2026-07-23).
**Spec:** `docs/specs/TASK3-FEATURE-VERIFIER-SPEC.md` (LOCKED) · **Method:** `references/stage-3-feature-verifier.md`
**Built in:** plugin `08befda`/`4989c4a` · app `9160ec3`→`665aa32`

## What is real and live (do not rebuild)

- `feature_verification_reports` table (migration 0008 + journal idx 3), `GET/POST
  /api/feature-verification-reports`, `GET/DELETE /[id]`, `GET /api/reports/[id]`. Typecheck clean.
- Harness: `assertFileOnDisk` / `assertViaApi` (ONE DOOR) / `pollUntil`; `unicode.ts` NFC-vs-NFD
  recipe (the best-built piece); `Matrix.verdict()` correctly **fail-closed** (skipped ⇒ never APPROVE);
  evidence dir helpers; `postReport` / `postFlowTestRun` / `postTestRun`.
- One end-to-end run really inserted 3 reports through the API (proven forensically via
  `sqlite_sequence`), asserted a DB row + on-disk bytes, and verified Telugu/Tamil/emoji survived NFC.

## Verified gaps → the work

### P1 — One real browser-driving spec  *(the headline overclaim)*
The only instantiation drives the app over **HTTP** (`request`), never a browser. Zero clicks,
keystrokes, `setInputFiles`, screenshots. `selectors.ts` (`oid()`) and `pollUntil` have **zero call
sites**, so the `data-oid` "one instrument, two consumers" pairing is unproven and evidence capture
(`trace/video/screenshot: 'on'`) never fires — no browser context is created.

**Build:** `components-pick.feature-verify.spec.ts` against a real Ottomate UI flow.
- `page.goto` the components-pick page → select a component via **`oid()`** → assert the pick landed
  with `assertViaApi` → `pollUntil` for the async status rollup. That gives selectors.ts and pollUntil
  real call sites and produces genuine trace/video/screenshot artifacts.
- Add a **file-upload** leg (`setInputFiles`) somewhere real so the folder/upload claim is exercised.
- **Do NOT delete the evidence afterwards.** Persist one run under a non-`/tmp` evidence root and
  reference it from the report. (My dogfood cleaned up so thoroughly that no artifact survived — the
  "a red links to exact proof" path is still unproven.)

### P2 — One deliberately RED case, with its proof persisted
No failing case has ever been produced, so the anti-gaslight payoff (red → exact bytes) is untested.
Pick a genuine edge case that currently fails (or assert a real unmet requirement), let it go red, and
keep the evidence. This is the single most convincing artifact the whole task can produce.

### P3 — Wire the nightly subset
`postTestRun()` now exists; **nothing schedules it**. No CI workflow, no cron entry (`crontab -l`
shows only backup + build-previews).
- Tag a critical subset (e.g. `@nightly`) and add a runner script + cron entry.
- **Known constraint:** the disposable `:3100` instance mounts `/asset-library` **read-only**, so
  file-write cases fail there. Either scope the nightly subset to read-only cases, or give the nightly
  instance a writable asset mount. Decide explicitly; do not let it silently fail.

### P4 — Explorer + Judge are prose only
No rubric file exists; `judge_verdict` is a type field with **zero producers**; no Explorer finding has
ever been frozen into a spec.
- Write `data/design-judge-rubric.md` (or feature-judge rubric) with concrete scoring criteria.
- Run the §5H playbook **once** against a real feature and freeze ≥1 finding into a deterministic spec —
  that is what proves the discovery layer earns its place.

### P5 — Spec deviation to resolve: axe / Lighthouse-CI / Lost Pixel / Testcontainers
Spec §4/§5A names these in the **deterministic core** (axe as a *hard gate*). None are installed; the
docs reframed them as "pluggable". Now recorded as a known deviation.
- **Decide:** either install `@axe-core/playwright` and make a11y a real gate, or amend the spec via ADR.
  Leaving prose and reality disagreeing is the failure mode this system exists to prevent.

## Suggested order
P1 → P2 (same session; P2 rides on P1's browser harness) → P3 → P4 → P5.

## Acceptance for APPROVE
1. A browser spec that clicks/types/uploads, with **surviving** trace + screenshot evidence.
2. ≥1 red case whose proof is persisted and linked from the report.
3. A scheduled nightly run posting to `test_runs`.
4. Explorer playbook run once, ≥1 finding frozen into a spec; judge rubric exists and produced ≥1 verdict.
5. axe decision made (installed as a gate, or an ADR amending the spec).
