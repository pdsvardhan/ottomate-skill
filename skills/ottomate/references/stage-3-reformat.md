# Stage 3.3 — Reformat (Type 2 with code, conditional)

NEW sub-step added per Stage 0 discussion. Fires only when `projects.held_code_path IS NOT NULL` (Type 2 with code held at `/staging/code/<slug>/` from Stage 0.3 Phase B).

**Goal:** Study held code, decide per-module USE-AS-IS / REFACTOR / REWRITE. Apply CODING_GUIDELINES.md (from 2.5). Produce a `reformat_plan.yaml` that 3.4 codegen consumes.

---

## Inputs

- `/staging/code/<slug>/` — held source code (immutable; never modified during reformat)
- `CODING_GUIDELINES.md` — composed at 2.5
- `tech_stacks` row — target framework (possibly different from old code's framework)
- `features` rows + `feature_dependencies` — what we're building
- `ui_master_plans` row — target tokens (old code's design likely doesn't match)

---

## Outputs

- `code_health_report.yaml` — vuln scan + complexity + test coverage estimate of OLD code
- `reformat_plan.yaml` — per-module triage decisions
- `decisions/<date>-stage-3-reformat.md` ADR with rationale per non-trivial choice
- Module-mapping table: `old_path → new_path | action`

---

## 5 phases

### Phase A — Mechanical scan (~30s, 0 tokens)

```bash
# Vulnerability scan
trivy fs /staging/code/<slug>/ --severity HIGH,CRITICAL --format json
osv-scanner --json /staging/code/<slug>/

# Complexity report
ESLint with cyclomatic complexity rules
File size analysis (lines per file)
Dependency depth analysis (max import chain length)

# Test coverage estimate
Find test files: find /staging/code/<slug> -name "*.test.*" -o -name "*.spec.*"
Run if possible: cd /staging/code/<slug> && npm test --reporter json
Compute estimate of covered files vs total files

# File-tree analysis
Detect framework from imports (next, react, vue, vite, etc.)
Map old → potential new paths
Identify entry points (page.tsx, route.ts, etc.)
```

Output `code_health_report.yaml`:
```yaml
code_health:
  scanned_at: 2026-04-29T14:00:00Z
  total_files: 60
  total_loc: 4200
  framework_detected: nextjs-13
  
  vulnerabilities:
    critical: 0
    high: 2
    medium: 8
    findings:
      - cve: CVE-2023-12345
        package: next
        version_current: 13.4.0
        version_safe: 13.5.6
        severity: HIGH
        path: /staging/code/<slug>/package.json
  
  complexity:
    avg_cyclomatic: 3.2
    max_cyclomatic: 24
    files_over_threshold:
      - { path: lib/library.ts, cyclomatic: 24, recommendation: refactor }
      - { path: app/api/search/route.ts, cyclomatic: 18 }
  
  test_coverage:
    test_files_count: 12
    estimated_coverage_pct: 35
    findings: "few tests; refactor risk medium"
  
  framework_compatibility:
    target_framework: nextjs-15
    current_framework: nextjs-13
    breaking_changes: ["app router required", "params now async", "fetch caching defaults changed"]
    estimated_port_effort: medium
```

### Phase B — Per-module Claude triage (~3-6K tokens)

For each module/file in held code, Claude classifies into one of three actions:

**USE-AS-IS** — integrate into new project structure with minimal changes (path move + import path fix). Common when:
- Framework matches target
- Code passes guidelines
- No security findings on this module
- Cyclomatic complexity reasonable

**REFACTOR** — keep logic, apply CODING_GUIDELINES.md. Common when:
- Framework matches but conventions differ (e.g., naming, file tree)
- Patterns can be modernized (callbacks → async/await, classes → functions)
- Complexity reducible

**REWRITE** — old code becomes reference; new code authored fresh in 3.4. Common when:
- Framework differs (Vue → Next; React+Vite → Next App Router)
- Code has security findings
- Complexity too high to refactor
- Old patterns incompatible with target stack

Each decision carries `_rationale` (anti-gaslight: not "let's rewrite" but specific reason).

Per-module output:
```yaml
modules:
  - path: lib/library.ts
    action: REFACTOR
    rationale: "Pure logic, no framework deps; framework matches; cyclomatic 24 reducible by extracting per-resource queries; preserve API surface"
    new_path: app/_lib/library.ts
    target_complexity: <10
    preserve_api: true
    confidence: 0.85
  
  - path: app/api/search/route.ts
    action: USE-AS-IS
    rationale: "Next.js App Router compatible; 1 small file; pattern matches CODING_GUIDELINES"
    new_path: app/api/search/route.ts
    confidence: 0.95
  
  - path: components/SearchBar.tsx
    action: REWRITE
    rationale: "Old code is React+styled-components; target is Next + Tailwind; UI master plan tokens differ; CODING_GUIDELINES says always use master_components catalog (mc-search-bar-animated picked at 2.4); preserve search behavior + debounce timing"
    reference_for_rewrite: components/SearchBar.tsx
    confidence: 0.92
  
  - path: pages/index.tsx
    action: REWRITE
    rationale: "Pages router → App Router migration; layout structure differs"
    reference_for_rewrite: pages/index.tsx
    confidence: 1.0
  
  # ... etc
```

### Phase C — Cross-module Claude review (~1K tokens)

Claude reads triage decisions and surfaces:

**Cycles:**
- Module A USE-AS-IS depends on Module B REWRITE → possible interface mismatch
- Surfaces: "lib/library.ts (USE-AS-IS) imports from components/SearchBar (REWRITE) — interface compatible after rewrite?"

**Coverage gaps:**
- Features in build_plan that have no corresponding old-code module → flagged for fresh codegen at 3.4
- Surfaces: "feat-comparison-view has no old-code reference; 3.4 will author fresh"

**Over-importing:**
- USE-AS-IS modules that depend on packages not in target tech_stacks → either add deps or REFACTOR
- Surfaces: "lib/util.ts imports lodash, but target stack doesn't include lodash. Add to package.json or refactor to vanilla JS?"

**Effort estimation:**
- Total estimated token budget for 3.4 reformat work
- Per-module: USE-AS-IS ~0.5K (mechanical move) / REFACTOR ~3-8K / REWRITE ~5-15K

### Phase D — User review panel

Triage table rendered with per-module action + rationale. User can override per module:
- Force REWRITE on a module marked REFACTOR ("I never liked it")
- Force USE-AS-IS on a module marked REFACTOR ("don't touch it")
- Mark a module as DROP (not migrate; will be excluded from new project)

```
REFORMAT PLAN — cricket-stats-old → cricket-stats   60 modules

Action breakdown:
  USE-AS-IS    32 modules    ~16K tokens  (mostly utils + types)
  REFACTOR     18 modules    ~75K tokens  (UI components, framework conventions)
  REWRITE      8 modules     ~80K tokens  (page routes, framework migration)
  DROP         2 modules     0 tokens     (deprecated by user)

Cross-module concerns:
  ⚠ 1 cycle suspected: lib/library.ts (USE-AS-IS) imports SearchBar (REWRITE)
  ⚠ feat-comparison-view: no old-code reference; 3.4 fresh
  ⚠ over-import: lib/util.ts imports lodash (not in target stack); refactor recommended

Estimated total reformat budget: ~170K tokens (within Stage 3 budget)
Estimated wall-clock: ~3-5 hours of dialog + autonomous codegen

ACTIONS
  [ Apply plan ]   [ Edit per-module action ]   [ Address cross-module concerns ]   [ Cancel ]
```

User locks → ADR captures plan. 3.4 reads `reformat_plan.yaml` per feature/module.

### Phase E — Mechanical execution

For USE-AS-IS modules:
- Copy from `/staging/code/<slug>/` → new project repo at `new_path`
- Run AST-based import path fix (e.g., `'../lib/foo'` → `'@/lib/foo'`)
- Commit to scaffold branch as `chore: import use-as-is modules from old code`

REFACTOR and REWRITE are deferred to 3.4 codegen — they happen during per-feature build, not in 3.3:
- 3.4 reads reformat_plan when building each feature
- For REFACTOR modules touched by the current feature: read old code as input + apply guidelines + write new version
- For REWRITE modules: old code is reference only; 3.4 authors fresh

---

## Vulnerability handling (Phase A findings → Doc 7 risks)

Per D-S3.3.6: vuln scan results from Phase A become `risk_instances` additions in Doc 7.

For each HIGH+ finding:
- Map CVE to risks_catalog (or create new risk_type entry)
- Insert risk_instance with affected_artifact = the module + status = `open`
- Sunset_date proposed = "fix during reformat" (i.e., REFACTOR or REWRITE the module)
- ADR captures: "found vuln X in old code; reformat plan addresses by [refactor|rewrite|update package]"

---

## Anti-gaslight hooks

- `code_health_report.yaml` is real (Trivy + ESLint output, not vibes)
- Per-module `_rationale` (audit "why was lib/library.ts marked REFACTOR?")
- Cross-module review catches cycles + gaps before 3.4 runs into them
- Old code immutable at `/staging/code/<slug>/` — never modified during reformat; new project repo is the workspace
- Vuln findings explicit; can't silently skip a HIGH severity dependency
- DROP action requires explicit user choice; no silent module loss

---

## Decisions (per audit)

- D-S3.3.1 Conditional fire only when `held_code_path IS NOT NULL` — yes
- D-S3.3.2 5 phases (scan → triage → cross-module review → user review → execution) — yes
- D-S3.3.3 Per-module triage actions {USE-AS-IS, REFACTOR, REWRITE} with mandatory rationale — yes
- D-S3.3.4 Old code stays immutable at `/staging/code/<slug>/`; new project repo is workspace — yes
- D-S3.3.5 REFACTOR/REWRITE deferred to 3.4 codegen with reformat_plan as input; 3.3 only does USE-AS-IS copies — yes
- D-S3.3.6 Vuln scan results become risk_instances additions in Doc 7 — yes

---

## Token cost

- Phase A (mechanical scan): 0
- Phase B (per-module triage): ~3-6K
- Phase C (cross-module review): ~1K
- Phase D (panel render + user dialog): minimal
- Phase E (USE-AS-IS execution): 0

**Total Phase B+C: ~4-7K tokens** for 3.3 itself. REFACTOR + REWRITE costs incurred at 3.4 (already counted in 3.4 budget).

Wall-clock: ~5-15 minutes for triage + user review (excluding scan time + per-module Claude calls).

---

## When 3.3 doesn't fire

If `projects.held_code_path IS NULL`:
- Skip 3.3 entirely
- 3.4 codegen authors all features fresh

This happens for:
- Type 1 projects (no held code)
- Type 2 projects with only F2 docs / F3 URLs / F4 data (no F1 code)

---

## Stage 3.4 reads reformat_plan strictly

Per 3.4 (`stage-3-codegen.md` — see existing skill or amendment doc):
- Per feature, 3.4 reads `reformat_plan.yaml` to know which modules apply
- USE-AS-IS modules already in repo from 3.3 Phase E — 3.4 imports them
- REFACTOR modules: 3.4 reads old code as input + applies CODING_GUIDELINES + writes new version on feature branch
- REWRITE modules: 3.4 reads old code as reference (NOT as starting point) + authors fresh

The reformat_plan is the contract. 3.4 cannot deviate.
