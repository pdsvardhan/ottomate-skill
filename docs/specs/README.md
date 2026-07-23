# Locked design specs — the 3-task skill upgrade (2026-07-23)

Version-controlled copies of the specs that drove the Task 1 / Task 2 / Task 3 build.
They were authored and locked in `~/Desktop/Skills CC/Ottomate/`, which is **not a git
repo** — so the originals had no version control and no backup. These are the durable copies.

| Spec | What it specifies | Built as |
|---|---|---|
| `TASK1-VISUAL-QA-INTAKE-SPEC.md` | DOM-commenter capture → auto-pickup → app ingest → Stage-4 gated batch | shipped 2026-07-23 |
| `TASK3-FEATURE-VERIFIER-SPEC.md` | The feature verifier: deterministic Playwright gate + system-state / NFC-vs-NFD assertions, Explorer/Judge = Claude in-session | `references/stage-3-feature-verifier.md`, `prompts/feature-verifier-prompt.md`, `scripts/feature-verify/` |
| `TASK2-UI-DESIGN-SPEC.md` | The iterative UI design method: A→A½→B→C ladder, colour-budget, one-command preview, theme-from-content | `references/stage-2-design-method.md`, `scripts/preview-build/` |

All three are **LOCKED** — they are the historical record of what was agreed, not living
documents. If a decision changes, supersede it with an ADR rather than editing these.
