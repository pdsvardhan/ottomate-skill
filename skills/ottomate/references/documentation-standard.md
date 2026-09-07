# Ottomate Documentation Standard (in force — enforcement shipped Phase 4; doc_gate=block on screenroom, mapsofbharat, leaploop; warn on ottomate since 2026-09-07)

> **Status: IN FORCE.** The text was never formally locked by the owner, but the enforcement it specifies (doc-lint + the doc_gate ramp) shipped and four projects run under it; per-project backfills are tracked as to-dos #833–841. This defines *what docs a project keeps, in what format, and the structural
> rules that keep them honest*. The enforcement (native rules + Vale/lychee + the spec-sync gate)
> codifies this file, so this is locked FIRST (skill bedrock: lock before build). Scope: **per-project
> product docs now; the skill's own internal docs in a follow-up** (owner decision 2026-08-04).
>
> Grounded in four free, established standards — **Diátaxis** (doc taxonomy), **docs-as-code / living
> documentation** (single source of truth, generate the rest), **Specification by Example** (executable
> acceptance criteria), and **arc42 + C4 + ADR** (architecture/decision formats). No paid tools, no
> hosted services.

## 0. The governing principle

**One source of truth. Everything else is generated from it or explains it. Nothing is hand-maintained
in two places.** Documentation drift is *structural*, not a discipline failure — it happens when the same
fact lives in two places that change on different schedules. So the standard removes the second copy.

For Ottomate the single source of truth is **the registry** (the tracker DB: features, flows, acceptance
criteria, pages, components, ADR index). The website already renders from it; the verifier already tests
against it. This standard extends that discipline to every remaining doc.

## 1. The layered doc model (what a project keeps)

Every doc falls into exactly one layer. If a doc doesn't fit a layer, it should not exist.

### Layer 0 — CANONICAL: the registry (Diátaxis: reference, canonical)
- **Lives in:** the tracker DB, via the API + `schemas/*.schema.yaml` (zod-validated).
- **Contains:** features (+ ACs), flows (+ steps), pages, components, the ADR index.
- **Maintained by:** the skill + owner, through the API. Never edited as a file.
- This is the *only* place a feature/flow/page is *defined*. Every other doc derives from or explains it.

### Layer 1 — REFERENCE: generated from the registry (Diátaxis: reference)
- **Lives in:** the rendered showcase site (overview / features / flows / pages / architecture / progress)
  and — optionally — a generated `FEATURES.md` in the repo.
- **Format:** generated output carrying a provenance header:
  `<!-- generated from registry @ <commit> on <date> — DO NOT EDIT; edit the registry -->`.
- **Maintained by:** generation only. A hand-edit to a Layer-1 doc is a violation (it forks the truth).
- **Regenerated:** at every Stage-4.8 integrate and every pack-up.

### Layer 2 — EXPLANATION: hand-written narrative, the "why" (Diátaxis: explanation + how-to)
The **only** docs a human authors by hand. Kept thin; each has a required section skeleton.
- `README.md` — what it is + how to run + how to develop. *(orientation + how-to)* **Required.**
- `ARCHITECTURE.md` — system design, using the **arc42** section skeleton and **C4** diagram levels
  (context → container → component). *(explanation)* **Required.**
- `public_docs/*` — the showcase narrative (thesis / technical-deep-dive / validation / retrospective).
  *(explanation)* **Encouraged** (leaploop's are a good exemplar).
- `decisions/adr-NNN-<slug>.md` — **ADRs** in MADR style; supersede-don't-delete. *(explanation)*
  **Required for any decision / drop / re-wire.**
- **Rule:** a Layer-2 doc must NOT restate the registry's feature/flow list — it links to the generated
  Layer-1 reference instead. Narrative explains *why*; it never becomes a second feature catalog.
- **CUT:** stand-alone hand-written feature briefs (e.g. `LEAPLOOP_BRIEF.md`) — superseded by
  Layer-1 (generated reference) + the Layer-2 set. Retire them, don't maintain them.

### Layer 3 — OPERATIONAL / RECOVERY: skill-necessary, generated (Diátaxis: reference)
- `CODING_GUIDELINES.md` — written/read at the Stage-2→3 gate. **Skill-necessary. Required.**
- **YAML mirror** of the registry — adr-018 Gitea recovery net; generated, committed at milestones.
- `references/tracker-api-inventory.md` — generated from route code (already exists).

## 2. What is "necessary for the skill to function" (owner's explicit criterion)

The skill's gates read only these; everything else is human-facing or generated convenience:
- **The registry** (via API) — the operational source of truth for every stage.
- **ADRs** (`decisions/`) — ADR-presence *is* the Stage-2→3 gate (adr-014).
- **`CODING_GUIDELINES.md`** — written + checked at Stage-2→3.
- **The YAML mirror** — recovery (adr-018).

`README.md`, `ARCHITECTURE.md`, `public_docs/*` are load-bearing for *humans/recruiters*, not for the
skill's gates — so they must stay honest (Vale/lychee + the drift rules) but the skill does not depend on
them to run.

## 3. Formats at a glance

| Doc | Layer / type | Format / template | Source | Maintainer |
|---|---|---|---|---|
| registry specs | 0 canonical | zod + `schemas/*.yaml` rows | — (the source) | skill + owner via API |
| showcase pages | 1 reference | generated | registry | generation |
| `FEATURES.md` (if kept) | 1 reference | generated + provenance header | registry | generation |
| `README.md` | 2 explanation/how-to | required-section template (§4) | hand | owner + skill |
| `ARCHITECTURE.md` | 2 explanation | arc42 skeleton + C4 diagrams | hand | owner + skill |
| `public_docs/*` | 2 explanation | narrative template | hand | owner + skill |
| `decisions/adr-*.md` | 2 explanation | MADR ADR template | hand | owner + skill |
| `CODING_GUIDELINES.md` | 3 operational | template | hand | skill |
| YAML mirror | 3 operational | generated | registry | generation |
| `tracker-api-inventory.md` | 3 operational | generated from routes | route code | generation |

## 4. Required section skeletons (the hand-written docs)

Vale/markdownlint enforce presence of these headings; missing → gate flag.

- **README.md:** `# <name>` · What it is (1 para) · Status + live URL · Run locally · Develop · Links
  (→ generated reference, architecture, decisions).
- **ARCHITECTURE.md (arc42-lite):** Introduction & Goals · Constraints · Context (C4 L1) · Solution
  Strategy · Building Blocks (C4 L2/L3) · Runtime Scenarios · Deployment · Cross-cutting Concepts ·
  Decisions (→ links to ADRs) · Risks/Debt.
- **ADR (`adr-NNN-<slug>.md`, MADR):** Title · Status (`proposed|accepted|superseded-by adr-NNN`) ·
  Context · Decision · Consequences. Supersede-don't-delete.
- **public_docs/*:** free narrative, but must open with a one-line "what + as-of date/commit" header.

## 5. The structural rules (the enforceable set)

Each rule names its mechanism: **native** (tracker anti-gaslight engine), **Vale**, **lychee**, or **gate**.

| # | Rule | Mechanism |
|---|---|---|
| **R-DOC-1** | Single source: no feature/flow/page described in two *hand-authored* places; generated docs carry a provenance header; a hand-edit to a generated doc is a violation. | native + Vale (provenance header present) |
| **R-DOC-2** | No stale terms: a term tied to a dropped ADR/feature must not appear in any doc (per-project banned-term list, seeded from dropped features + superseded ADRs — e.g. "Telegram" after adr-010). | **Vale** |
| **R-DOC-3** | Freshness: a feature/flow's registry `updated_at` must not lag the repo's last relevant commit beyond a threshold without a re-verify. | **native** (stale-spec rule) |
| **R-DOC-4** | Executable AC: every AC is a testable example; a done user-facing feature's ACs SHOULD carry a `linked_test`; `test_status` is DERIVED from linked tests/runs, never hand-set. | native + gate |
| **R-DOC-5** | No dead capability: no live flow/feature/page step references a `dropped`/`deprecated` entity. | **native** (dead-capability rule) |
| **R-DOC-6** | Required sections present in each hand-authored doc (§4). | **Vale** / markdownlint |
| **R-DOC-7** | Links resolve — no broken links in any doc. | **lychee** |
| **R-DOC-8** | ADR discipline: supersede-don't-delete; every drop/re-wire/revamp has an ADR; dropped entities are recorded in an ADR. | native + gate |
| **R-DOC-9** | Generated docs are regenerated at Stage-4.8 integrate and at pack-up (no stale generated output committed). | **gate** |
| **R-DOC-10** | Spec-sync: a behaviour-changing iteration item cannot integrate unless its target's spec (description/ACs/steps) was updated in the same iteration. | **gate** (integrate) |

## 6. Severity + ramp (reuse the Phase-3 model)

These rules surface at session-start + pack-up (advisory) and at Stage-4.8 integrate + Stage-3→deploy.
Enforcement ramps per project — `off → warn → block` — reusing the Phase-3 ramp (either the existing
`projects.verify_gate` or a sibling `doc_gate`; decided in the enforcement plan). A project is not marked
doc-gated until a test proves the rules fire (register discipline: `Enforced? = yes` only with a named
test).

## 7. Non-goals

- Not adding a hosted doc platform (Backstage/MkDocs/Docusaurus) — the site already renders from the
  registry.
- Not importing a markdown-anchored drift tool (Drift/DocSync) — they assume markdown is the source of
  truth; ours is the DB, and the native anti-gaslight engine already is our drift detector.
- Not turning every AC into a heavyweight Gherkin feature file — "testable example" is the bar; Gherkin
  (pytest-bdd/behave) is available per-project where it earns its keep (deferred, per Q2).
