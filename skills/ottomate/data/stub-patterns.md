# Stub Detection Patterns (Verifier Pass B)

Externalized from `prompts/verifier-prompts.md` per Codex Round 2 — verifier reads this as static config rather than inlining the table in the prompt. Saves ~2-3K tokens per dispatch.

**Used by:** Stage 3.5 + Stage 4.7 verifier sub-agent.

**Action on hit:** any non-allowlisted, non-escape-hatched pattern hit = HARD FAIL. `pass_b_stub_detection.result = "stub-detected"`. `recommendation.overall = BLOCK`. `mandatory_user_review = true`. **Bypasses auto-fix loop.**

---

## HARD-fail patterns

### 1. TODO / FIXME / placeholder comments

| Regex | Languages | Severity | Reason |
|---|---|---|---|
| `//\s*TODO` | TS / JS / Go / Rust / Java / C / C++ / Swift | HARD | Logic explicitly marked incomplete |
| `//\s*FIXME` | same | HARD | Same |
| `//\s*HACK` | same | HARD | Same |
| `//\s*XXX` | same | HARD | Same |
| `#\s*TODO\b` | Python / Ruby / Bash / YAML | HARD | Same |
| `#\s*FIXME\b` | same | HARD | Same |
| `<!--\s*TODO` | HTML / Markdown | HARD | Same |
| `<!--\s*FIXME` | same | HARD | Same |

### 2. Empty function bodies

| Pattern | Languages | Severity | Reason |
|---|---|---|---|
| Function body is ONLY `return null;` | TS / JS | HARD | Empty body where logic was claimed |
| Function body is ONLY `return undefined;` | TS / JS | HARD | Same |
| Function body is ONLY `return "";` | TS / JS / Python | HARD | Same |
| Function body is ONLY `return [];` | TS / JS | HARD | Same |
| Function body is ONLY `return {};` | TS / JS | HARD | Same |
| Function body is ONLY `pass` | Python | HARD | Same |
| Function body is ONLY `throw new Error("not implemented")` | TS / JS | HARD | Same |
| Function body is ONLY `raise NotImplementedError` | Python | HARD | Same |

**Detection:** parse function body; if statement count == 1 AND that statement is one of the above patterns AND function was claimed implemented → HARD fail.

### 3. Hardcoded mock returns where real fetch was claimed

| Pattern | Severity | Reason |
|---|---|---|
| `return [{id:1,name:"Foo"}]` (no real fetch in surrounding code) | HARD | Fake data |
| `return [{}, {}]` (with no real shape) | HARD | Fake data |
| `return [{}]` (single empty object) | HARD | Same |
| Mock data factories used in production paths (e.g. `fakerjs.name()` outside `__tests__/`) | HARD | Same |

**Detection:** AST analysis — function returns object literal AND no `await fetch()` / `db.query()` / equivalent earlier in body.

### 4. Placeholder UI strings

| Pattern | Severity | Reason |
|---|---|---|
| `Lorem ipsum` | HARD | Placeholder content |
| `dolor sit amet` | HARD | Same |
| `\bTBD\b` | HARD | To-be-determined |
| `Coming soon` | HARD (escape hatch applies) | Deferred feature |
| `<placeholder>` | HARD | Literal placeholder |
| `<insert text>` | HARD | Literal placeholder |
| `Sample text` | HARD | Placeholder |
| `Insert content here` | HARD | Placeholder |
| `[Edit this text]` | HARD | Placeholder |

**Detection:** string literal search in `.tsx` / `.jsx` / `.html` / `.md` files. Allowlisted in `**/*.test.*` / `tests/**` / `docs/**`.

### 5. Explicit fake-data markers

| Pattern | Severity | Reason |
|---|---|---|
| `console\.log\(.*"FAKE` | HARD | Explicit fake marker |
| `console\.log\(.*"DEBUG` | HARD | Debug residue (would be removed) |
| `// fake data for now` | HARD (escape hatch applies) | Same |
| `// stub for testing` | HARD (in non-test paths) | Same |
| `// mock data` | HARD (in non-test paths) | Same |
| `// REMOVE BEFORE COMMIT` | HARD | Should not be present |

### 6. Math.random() returning data values

| Pattern | Severity | Reason |
|---|---|---|
| `Math.random()` used as a data value (not for IDs / styling / animations) | HARD | Fake variability |
| `random.choice(...)` outside seed/test contexts | HARD | Same |
| `np.random` in production paths | HARD | Same |

**Detection:** AST analysis — Math.random() or equivalent is the source of a value that ends up in a render or response. False-positive risk: animation jitter is OK; key generation OK if combined with timestamp.

### 7. Pretend-async patterns

| Pattern | Severity | Reason |
|---|---|---|
| `await sleep(N); return mockResult` | HARD | Pretend latency |
| `await new Promise(r => setTimeout(r, N)); return mock` | HARD | Same |
| Functions marked `async` that have no `await` AND return literal | HARD | Fake async |

### 8. Test file stubs

| Pattern | Severity | Reason |
|---|---|---|
| `expect(true).toBe(true)` (in test claimed as added) | HARD | Defeats verification purpose |
| `expect(1).toBe(1)` | HARD | Same |
| `it.skip(...)` for tests claimed as added | HARD | Same |
| `xit(...)` (Jasmine) | HARD | Same |
| `test.skip(...)` (Vitest) | HARD | Same |
| `// @ts-expect-error` without comment explaining why | HARD | Suppressing type errors |
| `// eslint-disable-next-line` without comment explaining why | HARD | Suppressing lint errors |
| Empty `describe` / `it` blocks | HARD | Same |

---

## ALLOWLIST — paths where TODO/FIXME OK

Legitimate backlog noting in tests + docs.

```
**/*.test.ts
**/*.test.tsx
**/*.test.js
**/*.test.jsx
**/*.spec.ts
**/*.spec.tsx
**/*.spec.js
**/*.spec.jsx
tests/**
__tests__/**
e2e/**
docs/**
**/*.md (excluding production-rendered docs)
**/CHANGELOG.md
**/TODO.md
**/ROADMAP.md
**/CONTRIBUTING.md
.gitignore
.dockerignore
.eslintignore
```

Patterns 1 (TODO/FIXME comments) and 4 ("Coming soon" / placeholder strings) suppressed in allowlisted paths. Other patterns (empty bodies, mock returns, etc.) still HARD-fail in allowlisted paths.

---

## ESCAPE HATCH — `@intentional-placeholder` annotation

Lines ending with `// @intentional-placeholder` (or `# @intentional-placeholder` for Python) are allowed BUT only if:

1. Iteration's `lock_in_audit.intentional_placeholders_allowed >= count of @intentional-placeholder annotations in diff`
2. Without that lock-in approval, even annotated lines HARD FAIL

**Use case:** legitimate "Coming soon" badge for a known-deferred feature that user explicitly approved at 4.3.

**Verification flow:**
1. Verifier counts `@intentional-placeholder` annotations in diff
2. Verifier reads iteration's `lock_in_audit.final_locked_list` for `intentional_placeholders_allowed` field
3. If counts match (or annotations <= approved): annotated lines pass; non-annotated still fail
4. If user didn't approve any but annotations exist: HARD FAIL with message "intentional-placeholder annotation requires lock-in approval"

---

## Edge cases (NOT stub-detection hits)

These look stub-like but are legitimate:

- `return null` as a guard clause early in a function (followed by real logic)
- `return []` as an empty initial state in a hook (`useState([])`)
- `Math.random()` used for unique key generation (combined with timestamp)
- `// eslint-disable-next-line ` with explanation (e.g., `// eslint-disable-next-line @typescript-eslint/no-explicit-any  -- API spec uses 'any'`)
- `<!--  -->` empty HTML comment for layout
- Test `it.todo(...)` for planned-but-not-yet-written tests (not `it.skip`)
- Empty `mock` objects in test fixtures (`vi.mock(...)` with `{}`)

**Verifier judgment:** when a pattern matches but context suggests legitimate use, mark as `partial` not `stub-detected`. User reviews.

---

## How verifier reports stubs

```yaml
pass_b_stub_detection:
  result: stub-detected      # or "clean"
  hits:
    - file: app/_components/result-card.tsx
      line: 23
      pattern_matched: "// TODO"
      pattern_id: 1.todo
      snippet: "  // TODO: implement click handler"
      allowlisted: false
      escape_hatched: false
    - file: app/_components/result-card.tsx
      line: 31
      pattern_matched: "Lorem ipsum"
      pattern_id: 4.lorem
      snippet: "<span>Lorem ipsum description</span>"
      allowlisted: false
      escape_hatched: false
  count: 2
  blocking: true
```

If `blocking=true` → `recommendation.overall = BLOCK` + `mandatory_user_review = true`. No auto-fix.

---

## Adding new patterns

When you discover a new stub pattern in the wild, add it here. Each pattern:
- `regex` (PCRE-compatible)
- `languages` (file extensions affected)
- `severity` (HARD or partial)
- `reason` (1-line description)
- `escape_hatch_applicable` (true/false)
- `allowlist_applicable` (true/false)

Test new patterns against past Stage 3 / Stage 4 verifier reports to ensure no false positives in production code.

Patterns version in this file: **v1** (2026-04-29). Bump when patterns added/changed; verifier records `verifier_prompt_version` per report so old reports stay interpretable.
