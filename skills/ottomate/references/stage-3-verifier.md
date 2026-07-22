# Stage 3.5 — Verifier Sub-Agent (Anti-Gaslighting; renumbered 3.4 → 3.5 post-audit)

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied (changelog archived at `_archive/references/stage-amendments.md`; prompt-location + Stage-4.7 lines collapsed 2026-06-10 — restated in body / stage-4 ref). Operative deltas:
> - Stub patterns externalized to `data/stub-patterns.md` (canonical; the table below is illustrative) + output schema from `schemas/verification-report.schema.yaml` — neither is inlined in the dispatch prompt
> - **`verifier_prompt_version` field stamped** on every verification_reports row (audit chain)
> - Allowlist + escape hatch (Codex Round 2 #6): `**/*.test.ts`, `tests/**`, `docs/**` allowlisted; `// @intentional-placeholder` annotation requires lock-in approval count match

**Mandatory step.** Runs after each feature's code generation, BEFORE comprehensive testing. Catches stubs, lies, and "fake done" before tests give false positives on stub data.

> **Sibling (Task 3):** this is the CODE verifier — *is the code correct/complete?* Its independent sibling, the **feature verifier** (`stage-3-feature-verifier.md`, `prompts/feature-verifier-prompt.md`), answers *does it work for a user?* by driving the real app and asserting **system state**. For a **user-facing** feature, "done" = both green (block cv/public, warn personal — adr-014). The feature verifier runs after this one (Stage 3) and per-item in Stage 4.7.

> **Ledger writes (2026-05-13):** Before dispatching the verifier, **POST a `feature_claim` row** capturing the coder's "done" assertion. After the verifier completes, **PATCH the claim's `reconciled_with`** based on verdict. See `references/ledger-writes.md` for the curl commands and verdict → reconciled_with mapping. Without these writes, anti-gaslight Rule 1 has nothing to query.

## When to run

After every feature's code generation in Stage 3 sub-stage 3.3, before sub-stage 3.5 (testing).

In Stage 4, runs after every iteration's mini-build (sub-stage 4.7), once per item in the locked list.

## How to dispatch

The verifier is an INDEPENDENT sub-agent. The coder agent does NOT write the verifier's prompt. The skill writes the verifier prompt directly, blind to coder's claims.

```
Use the Agent tool to dispatch a fresh agent with these inputs:
  - The feature ID being verified
  - Path to the feature's acceptance criteria
  - Path to the changed files in the feature's branch
  - Path to data_contracts.yaml (if data feature)
  - Project's deploy URL (for endpoint hits)

The verifier prompt is in `prompts/verifier-prompts.md`. Skill loads it,
substitutes feature-specific paths, dispatches.
```

## 4 verification passes

The verifier runs all 4 passes and outputs a single report.

### Pass A — Code reality check

For each claim made by coder:
- File claimed to exist? `ls <path>` confirms
- Function claimed implemented? Read file, locate function, body length ≥ 3 lines (not just `return null` or `// TODO`)
- Endpoint claimed working? `curl` it (with relevant params), confirm 2xx + non-empty response
- DB schema claimed exists? Query DB metadata (`PRAGMA table_info(...)` for SQLite, `\d <table>` for Postgres)

Each claim → verified / partial / failed.

### Pass B — Stub detection (HARD FAILS)

Scan changed files for these patterns. Any hit = stub-detected = HARD fail = mandatory user review (bypasses auto-fix loop because intent is ambiguous).

| Pattern | Reason |
|---|---|
| `// TODO`, `// FIXME`, `// HACK`, `# TODO`, `// XXX` | Logic explicitly marked incomplete |
| `return [{}, {}]` or `return [{}]` (with no real shape) | Hardcoded mock returns |
| Function bodies that are only `return null` / `return undefined` / `return ""` / `return []` / `pass` (Python) | Empty bodies |
| `Lorem ipsum`, `TBD`, `Coming soon`, `<insert text>`, `<placeholder>`, `Sample text` | Placeholder UI strings |
| `console.log\(.*"FAKE` or `// fake data for now` | Explicit fake-data markers |
| `Math.random\(\)` returning data values (not for IDs/styling) | Fake variability |
| `await sleep\(.*\); return` pattern with no real work | Pretend async |

### Pass C — Data correctness

For data-related claims:
- Coder claims "tests pass" → run tests via `npm test` or `pnpm test`, confirm exit 0 AND tests aren't using `expect(true).toBe(true)` patterns (regex check)
- Coder claims "data ingestion works" → run a real ingest, count rows in DB before/after, confirm delta > 0 with realistic values (not 1 row labelled "test")
- Coder claims "DB seeded" → query a sample of rows, confirm content shape matches `data_contracts.yaml` (not all "Foo" or "Bar")
- Coder claims "API responds" → hit endpoint, validate response against schema (not just 200)

### Pass D — Acceptance criteria validation

For each acceptance criterion linked to the feature (from `features.yaml`):
- Find the associated Playwright test (or generate one if missing — the verifier can author a quick test)
- Run the test in headless mode against the deployed feature
- Verify the criterion is independently achievable (e.g., "Compare players in 3 clicks" → verifier clicks 3 times, observes outcome)
- Pass / fail per criterion

## Output: `verification-report.yaml`

```yaml
verification_report:
  feature_id: feat-search
  ran_at: 2026-04-26T16:42:11Z
  verifier_session_id: vs-xyz
  coder_session_id: cs-abc
  
  claims_verified:
    - claim: "Implemented player search with debouncing"
      pass_a_code_reality: pass
      pass_b_stub_detection: clean
      pass_c_data_correctness: pass
      pass_d_acceptance: 
        - "Search returns results in <500ms": pass
        - "Empty query shows recent searches": pass
      overall: ✅ verified
    
    - claim: "Added result card component"
      pass_a_code_reality: pass
      pass_b_stub_detection: ❌ STUB DETECTED
      pass_b_evidence: |
        Found in components/result-card.tsx line 23:
          // TODO: implement click handler
        Found in components/result-card.tsx line 31:
          <span>Lorem ipsum description</span>
      overall: ❌ failed (mandatory user review)

  hard_failures: 1
  partial: 0
  verified: 1
  
  recommendation: 
    overall: BLOCK
    reason: "Stub-detection hit on result-card. Mandatory user review."
    suggested_action: "Show stubs to user, ask for intent: were these intentional placeholders or did coder skip work?"
```

## Hard escalation rules

If `pass_b_stub_detection` flags ANY pattern, the verifier outputs `recommendation.overall: BLOCK` with `mandatory_user_review: true`. The skill MUST NOT auto-fix or proceed without explicit user input on the flagged stubs.

This is the anti-gaslighting bedrock. **Don't bypass it under any circumstance.**

## Integration with auto-fix loop

For non-stub failures (passes A/C/D fail but B is clean):
- Auto-fix loop runs (max 3 iterations)
- Coder reads verifier report → tries to fix
- Verifier re-runs after each fix attempt
- After 3 iterations, escalate to user

For stub failures (pass B):
- NO auto-fix attempt — escalate immediately
- Stubs imply intent ambiguity, not a bug

## Cost notes

Verifier dispatch is the most expensive step in Stage 3 / Stage 4 (independent agent run with code reading + endpoint hits). Acceptable cost — anti-gaslighting protection is non-negotiable.

For Stage 4 iterations: verifier scoped to ONLY the changed item's affected files. Doesn't re-run on unchanged code. Keeps cost bounded.
