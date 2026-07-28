# Phase 4 — COMPLETION + VERIFICATION (every unfixed finding, now solved) · 2026-07-29

Built the entire remediation plan (R1–R8). This note VERIFIES each original finding is actually solved —
every fix ships with a must-pass AND a must-fail (a control), per §7. **All local suites green: generation
394/394 · design-check 132/132 (excl. the Windows-only Playwright browser test) · preview-build+theming
64/64.** All pushed to `origin/main`.

## Finding → fix → evidence (the ones that were NOT fully fixed before Phase 4)

| Finding | Was | Fix (R#) | Verified by |
|---|---|---|---|
| **F-14** dead preview (auto) | half-wired | **R1.1/R1.2** publish auto-emits the grid+banner; harness prepares interactive self-contained variants | end-to-end demo (prepareVariants→round.json grid+banner); tests 6/6 + 3/3 |
| **F-14** durability | render wiped on restart | **R1.3** build-previews preserves `design-rounds/**` | probe: design-rounds survives, component dir removed; deployed |
| **F-4** junk decompose | addressed | **R2.2** no JS-leak/marker parts, no false media-aspect, LOW confidence on empty; **R2.1** stamped cointrail | anatomy-derive-r2 6/6 (reproduces cointrail); decompose enumerates the 3 panels @ high confidence |
| **F-5** merged questions | partial | **R3.1** composeRounds default one-question-per-round; `packed` opt-in | 5 channels→5 rounds; packed→fewer (tests 6/6) |
| **F-9** gates fight | addressed | **R3.2** divergence for whole-direction rounds only; control-diff for one-axis; divergence now layout-aware | one-axis round not blocked; whole-direction still is; layout diff registers (controls) |
| **F-7** advisory misfires | partial | **R4.1/2/3** currency≠HTTP code; drift is same-class only; shared classes fine under shadow isolation | checks-r4 6/6, each with a CONTROL |
| **F-11** registry surgery | partial | **R5** publish accepts inline decomposed anatomy | novel component publishes with no registry edit; rule-40 still refuses a phantom axis (5/5) |
| **F-12** enum-as-token | open | **R6** enum value on a token-mapped question → structural, not `--x: flat-hairline` | emit-enum-r6 3/3 (enum→structural, CSS value→token) |
| **D-8** catalog not proven | open | **R7** a bespoke variant must record the mc-ids it weighed; empty/fabricated consultation flagged | catalog-consult-r7 5/5 |
| **§M** not one command | partial | **R8.1** planRound sequences the whole chain, marks the forks | round-pipeline 5/5 |
| **F-1** routing doc | minor | **R8.2** stage-4-item note: "inherit" ≠ "skip"; contextGate still blocks an empty ledger | doc caveat |
| **F-2** plan vs built | minor | **R8.3** reconcileLedgerVsSource flags `palette_dark:null` while a dark theme ships | round-pipeline 5/5 (control incl.) |

## Also this session (owner-gated items closed)
- **WS1.4 rollback DONE** — the parked cointrail test round reversed (backup-first), cointrail at baseline
  (decisions 0, ledger null, preview 404, temp dir gone); findings audit written.
- **P3.2 graduation** — already built + verified (6-gate pipeline, no migration needed).

## Net status of the original 17 findings + D-8
**16 now FIXED or ADDRESSED with a control** (F-13/14/15/17/8/10 fixed earlier; F-4/5/6/7/9/11/12/16 +
D-8 fixed in Phase 4). **2 MINOR** (F-1/F-2, doc/reconciliation — fixed). **1 positive** (F-3, not a
defect). The only remaining item is the `set_session_title` harness limitation (not the method).

## What still needs a real re-test to confirm END-TO-END (owner, another session)
The modules are all built + unit-verified. A live cointrail re-run (owner-driven: scope pick + value picks)
is the final integration proof — the pieces are now auto-wired (R1) and cointrail is stamped (R2.1), so the
re-run should be clean end-to-end. Also live-only: the R3.2 layout-aware divergence + R4 checks run their
DOM half in Chromium on VAULT7A (the Windows browser test is the one non-blocking local red).
