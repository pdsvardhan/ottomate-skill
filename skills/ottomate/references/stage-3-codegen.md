# Stage 3 — Codegen (per-feature build loop)

> Created 2026-06-10. This step existed in routing since v3 but had no owning
> reference — the single most failure-prone activity (writing the code) was the
> one with zero instructions. This file is the coder side of the verifier
> contract: `stage-3-verifier.md` consumes what this step produces.

## Inputs (all locked before this step)

- Build plan ADR (Stage 2 exit) — feature order, dependencies.
- SO1 docs: each feature's acceptance criteria, linked flows, pages, picked components (`asset_library_ref`).
- `CODING_GUIDELINES.md` in the repo.
- For Type 2: the reformat plan (`stage-3-reformat.md`) — it is the contract; codegen cannot deviate from it.

## Per-feature loop

For each feature in build-plan order:

1. **Scope check.** Re-read the feature's acceptance criteria and `non_goals`. If implementation would exceed them → STOP, surface via AskUserQuestion; expansion needs an ADR (drop-with-reason applies to additions too).
2. **Read before write.** Read the FULL current content of every file to be modified. Sub-agents dispatched for codegen get the same instruction verbatim.
3. **Implement.** Use picked master components (`asset_library_ref`) — never author a UI primitive that exists in the catalog (Rule 12). Code written locally → SCP (Rule 6). **Stamp `data-oid` provenance** on every component/section root — see "Provenance stamping" below (Task 1 visual-QA exact mapping).
4. **Self-check against stubs.** Scan your own diff per `data/stub-patterns.md`. Any intentional placeholder gets `@intentional-placeholder <reason>` AND a matching entry in the lock-in record — undeclared stubs are what the verifier hard-fails.
5. **Write the artifact manifest** (see below) — BEFORE claiming the feature done anywhere.
6. **Ledger write.** `POST /api/feature-claims` per `ledger-writes.md`: feature id, commit sha, manifest path, claimed acceptance criteria. A feature with no claim row is invisible to the anti-gaslight rules — the claim is not optional.
7. **Commit** with the feature id in the message (`feat(<feature-id>): ...`). Push per pack-up rules.
8. **Hand off to verification** (`stage-3-verifier.md`). The coder NEVER writes `verification_reports` rows, never sets `verifier_result`, never marks a feature VERIFIED — that is the verifier sub-agent's exclusive write. (This rule exists because it was violated: 9 self-administered reports, deleted 2026-05-13.)

## Provenance stamping — `data-oid` (Task 1 visual-QA exact mapping, 2026-07-23)

Every generated **component root** and **page-section root** carries a stable `data-oid` so the
DOM-commenter maps a click straight back to the exact source (its `detectProvenance` reads the nearest
`[data-oid]` ancestor; the Stage-4 visual-QA classifier then pins `target_id` from it — see
`references/stage-4-visual-qa.md`).

- **Value = the entity id**, not a source location: a picked master component → its `asset_library_ref`
  (`data-oid="mc-card-magnetic"`); a page section → `data-oid="<page-id>:<section>"` (`data-oid="page-browse:filter-bar"`);
  a feature-owned component → `data-oid="<feature-id>:<name>"`.
- **Stamp the root element only** (the outermost element the component/section renders) — the commenter
  climbs to the nearest ancestor, so per-leaf stamping is unnecessary.
- **Applies to all new builds** after this date; existing projects gain it as components are next
  touched (opt-in, no bulk rewrite). Add the convention to each project's `CODING_GUIDELINES.md` at
  scaffold time so it's enforced per-repo.
- **Cheap + safe:** `data-*` attributes are inert (no style/behaviour impact) and double as **stable
  test selectors for Task 3** (the feature verifier) — one instrument, two consumers.

## The artifact manifest (verifier input contract)

Per feature, written to `<repo>/ottomate/manifests/<feature-id>.yaml`:

```yaml
feature_id: feat-example
commit: <sha>
claimed_files:           # every file created/modified for this feature
  - path: app/api/x/route.ts
    change: created
claimed_routes:          # API/page routes this feature adds or changes
  - method: POST
    path: /api/x
claimed_behaviors:       # one per acceptance criterion, mapped
  - ac_id: ac-1
    behavior: "submitting the form persists a row and returns 201"
    verify_hint: "POST /api/x with {...}; expect 201 + row in table x"
intentional_placeholders: []   # ids matching @intentional-placeholder annotations
```

Rules: every acceptance criterion appears in `claimed_behaviors` (no silent drops); `verify_hint` must be executable by a verifier with shell+read access — "it works" is not a hint; the manifest lists what IS, not what is planned.

## What codegen never does

- Never marks anything verified (verifier's job).
- Never edits acceptance criteria to match what was built (scope-lock violation — if an AC is wrong, surface it; the user amends via the lock flow).
- Never skips the manifest "because the change is small" — small changes are where silent drops live.
- Never proceeds past a failed verifier verdict by re-wording claims; fix the code or take the item back to the lock-in gate.

## Stage 4 reuse

Stage 4's mini-pipeline build step uses this same loop scoped to one iteration item (`stage-4-mini-pipeline.md` step "build"), with the manifest posted to the item's `build-status` endpoint instead.
