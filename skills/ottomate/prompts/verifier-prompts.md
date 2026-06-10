# Verifier Sub-Agent Prompts (trimmed per Codex Round 2 — ~4K target)

Per Codex P0 #4: verifier inputs are **locked items + AC + expected_artifacts manifest + branch_diff** — NOT coder claims. Coder claims are SECONDARY signal.

**Original prompt:** ~327 lines / ~9K tokens.
**Target:** ~150 lines / ~4K tokens (per Codex Round 2 sub-agent isolation goal).

Reductions:
- Stub-pattern table externalized to `data/stub-patterns.md` (referenced not inlined)
- Output schema referenced from `schemas/verification-report.schema.yaml` (not inlined)
- Concrete example removed (verifier follows schema; no example needed)

---

## When invoked

- **Stage 3.5** — after each feature's code generation, before testing
- **Stage 4.7** — per locked iteration item, after mini-build

Dispatched via Agent tool to a fresh sub-agent (~2-5K tokens of focused context, NOT main session's accumulated 50K+).

---

## Input schema (substituted at dispatch time)

```yaml
{{target_kind}}:           stage-3-feature | stage-4-iteration-item
{{target_id}}:             feature-id | iteration_item-id
{{locked_items}}:          # the work that was locked
  - title, description, acceptance_criteria
{{expected_artifacts}}:    # coder's STRUCTURED manifest
  files_created: [...]
  files_modified: [...]
  endpoints_added: [...]
  db_tables_modified: [...]
  tests_added: [...]
{{branch_diff}}:
  base: main
  head: <branch>
  diff_summary: <git diff --stat>
  diff_full_path: /tmp/diff-<id>.patch
{{deploy_url}}:            # for endpoint-hit tests
  https://<slug>.vault7a.xyz
{{stub_patterns_ref}}:     data/stub-patterns.md
{{verifier_prompt_version}}: v3.0
{{coder_claims}}:          # OPTIONAL secondary signal — DO NOT trust
```

---

## The prompt (trimmed)

```
You are an independent verifier. Confirm that the locked work has been done —
completely, correctly, without stubs or fakery.

You have NO knowledge of what the coder agent claims to have built. Inputs:
1. LOCKED WORK (what should have been built)
2. EXPECTED ARTIFACTS manifest (structured contract from coder)
3. BRANCH DIFF (actual file changes)
4. DEPLOY URL (for endpoint testing)
5. (optional) coder narrative — DO NOT trust as primary signal

Run 4 verification passes. Output strict YAML matching 
schemas/verification-report.schema.yaml. NO prose explanations.

═════════════════════════════════════════════════════════════
LOCKED WORK
═════════════════════════════════════════════════════════════
{{locked_items}}

═════════════════════════════════════════════════════════════
ACCEPTANCE CRITERIA (LOAD-BEARING — CHECK EACH)
═════════════════════════════════════════════════════════════
{{acceptance_criteria}}

═════════════════════════════════════════════════════════════
EXPECTED ARTIFACTS MANIFEST (the contract — verify against this)
═════════════════════════════════════════════════════════════
files_created:       {{expected_artifacts.files_created}}
files_modified:      {{expected_artifacts.files_modified}}
endpoints_added:     {{expected_artifacts.endpoints_added}}
db_tables_modified:  {{expected_artifacts.db_tables_modified}}
tests_added:         {{expected_artifacts.tests_added}}

═════════════════════════════════════════════════════════════
BRANCH DIFF
═════════════════════════════════════════════════════════════
Base: {{branch_diff.base}}     Head: {{branch_diff.head}}
Summary: {{branch_diff.diff_summary}}
Full: {{branch_diff.diff_full_path}}

═════════════════════════════════════════════════════════════
DEPLOY URL: {{deploy_url}}
═════════════════════════════════════════════════════════════

═════════════════════════════════════════════════════════════
PASS A — Code Reality Check
═════════════════════════════════════════════════════════════
For each file in expected_artifacts.files_created:
  - Confirm path exists. Missing = FAIL.
For each file in expected_artifacts.files_modified:
  - Compare against base. No real changes (or only whitespace) = FAIL.
For each endpoint in expected_artifacts.endpoints_added:
  - curl with realistic params; require 2xx + non-stub body.
  - Stub indicators: empty array, single placeholder object, "lorem ipsum", etc.
For each table in expected_artifacts.db_tables_modified:
  - Query metadata (PRAGMA table_info / \d). Confirm shape.

═════════════════════════════════════════════════════════════
PASS B — Stub Detection (HARD FAIL on hits)
═════════════════════════════════════════════════════════════
See {{stub_patterns_ref}} for full pattern list. Summary:
  HARD-fail patterns: TODO/FIXME/HACK/XXX comments, empty bodies returning 
  null/[]/{}, hardcoded mock returns, "Lorem ipsum"/"TBD"/"Coming soon", 
  Math.random() for data, await sleep(); return mock patterns, 
  expect(true).toBe(true) tests, it.skip claimed as test.

ALLOWLIST: **/*.test.ts, tests/**, docs/**, **/*.md, **/CHANGELOG.md
ESCAPE HATCH: Lines with `// @intentional-placeholder` allowed ONLY if 
  iteration's lock_in_audit.intentional_placeholders_allowed >= count of
  annotations in diff. Without that lock-in, even annotated lines HARD FAIL.

If ANY non-allowlisted, non-escape-hatched pattern hits:
  set pass_b_stub_detection.result = "stub-detected"
  set recommendation.overall = "BLOCK"
  set recommendation.mandatory_user_review = true
  This BYPASSES auto-fix loop.

═════════════════════════════════════════════════════════════
PASS C — Data Correctness
═════════════════════════════════════════════════════════════
If "tests pass" claimed: re-run; require exit 0 + non-stub tests.
If "ingestion works" claimed: trigger; count rows before/after; require delta > 0.
If "DB seeded" claimed: sample 5-10 rows; confirm shape vs data_contracts.yaml.
If "API responds" claimed: hit endpoint; validate shape; confirm non-stub.

═════════════════════════════════════════════════════════════
PASS D — Acceptance Criteria Validation
═════════════════════════════════════════════════════════════
For each criterion:
1. Run linked Playwright spec, OR generate one from criterion text.
2. Run headless against deploy_url.
3. Independently perform the user flow described.
4. Mark: pass | fail | no-test.

If acceptance_criteria is empty: report "unable-to-verify" — recommend BLOCK 
with reason "no AC — cannot validate" + suggest user add AC.

═════════════════════════════════════════════════════════════
OUTPUT
═════════════════════════════════════════════════════════════
Produce verification_report YAML matching schemas/verification-report.schema.yaml.
Required fields: version, ran_at, verifier_session_id, verifier_prompt_version,
target {kind, id}, input_contract, pass_a/b/c/d, hard_failures, partial, 
verified, recommendation {overall, reason, mandatory_user_review, 
suggested_action}, cost_tokens_used, duration_ms.

═════════════════════════════════════════════════════════════
RULES
═════════════════════════════════════════════════════════════
1. Pass B stub-detection bedrock: any hit = BLOCK + mandatory_user_review.
2. Don't trust coder claims. Verify against contract + actual artifacts.
3. Test independently. Re-run tests; click flows yourself for Pass D.
4. Empty acceptance_criteria = unable-to-verify, NOT auto-pass. BLOCK.
5. Output ONLY the YAML report. No prose.

verifier_prompt_version: {{verifier_prompt_version}}
═════════════════════════════════════════════════════════════
END PROMPT
═════════════════════════════════════════════════════════════
```

---

## Externalized references

### `data/stub-patterns.md` (new, ~80 lines)

Full table of HARD-fail patterns + allowlist + escape-hatch flow. Verifier reads this as a static config; not inlined per dispatch.

### `schemas/verification-report.schema.yaml` (existing)

The structured output shape verifier produces. Already exists; verifier follows it.

---

## Integration with auto-fix loop

For non-stub failures (Pass A/C/D fail but B clean):
- Stage 3.7 / Stage 4.x auto-fix loop runs (max 3 iterations)
- Coder reads verifier report → tries fix → verifier re-runs
- After 3 iterations, escalate to user

For stub failures (Pass B):
- NO auto-fix attempt — escalate immediately
- Stubs imply intent ambiguity, not a bug
- Mandatory user review

---

## Cost notes

- Per dispatch: ~2-5K tokens of prompt + inputs (down from ~9K) + ~500-1500 tokens of output
- Sub-agent isolation: verifier session ~3-6K total context (vs main session's 50K+)
- Per-feature dispatch in Stage 3.5 + per-item dispatch in Stage 4.7 — bounded by item count

Acceptable cost for the failure mode it prevents (silent stubs / lies). Per Codex: this IS the anti-gaslight bedrock.

---

## Failure modes

| Verifier output | Skill action |
|---|---|
| `recommendation.overall = APPROVE` | Move to next sub-step |
| `overall = ITERATE + iterations < 3` | Auto-fix loop runs; coder retries |
| `overall = ITERATE + iterations >= 3` | Escalate to user with full attempt history |
| `overall = BLOCK + mandatory_user_review` | HALT; show stub evidence; user decides intent |
| Verifier itself errors | Skill retries dispatch ONCE; if still errors, escalate with logs |

---

## Special: Stage 1 has no verifier sub-agent

Decision: NO verifier sub-agent in Stage 1 (per existing locked design).
Reasoning: Stage 1 produces docs, not code; classical 5-pass validation suffices because surface is structured data, not code. Stub detection doesn't apply to YAML.

If stub-like patterns emerge in Stage 1 SO1 docs (e.g., AI fills features.yaml with Lorem ipsum), revisit and add a Stage 1 stub-detection lint pass.

---

## Special: Stage 4 trivial bug fixes (4.4 direct fix path)

Trivial bugs (typos, color tweaks) skip 4.5 mini-staging but **do NOT skip 4.7 verifier**. Even trivial fixes get the 4-pass check — narrow scope makes verifier cheap (~1-2K tokens per trivial fix). No exceptions.
