# Ottomate — Web Project Pipeline Skill

Orchestrates web project work across 5 stages (Stage 0 preprocessing → Stage 1 SO1 production → Stage 2 UI + Tech → Stage 3 Build + Test + Deploy → Stage 4 Iterate) on the VAULT7A home server. Anti-gaslighting bedrock at every stage transition.

## Status

✅ **Live.** Tracker container running on `127.0.0.1:8110`. Phases 1-9 shipped; Pilot 1 (`ottomate` self-onboard) complete; 13 projects loaded. Component-pick flow + Stage 2 hardening landed 2026-05-12.

For current state see `STATUS.md`.

## How to invoke

```
/ottomate                          Start a session — auto-detect intent + list projects
/ottomate <project-slug>           Resume a specific project
/ottomate new                      Force new-project flow (Stage 0)
/ottomate <slug> <text>            Stage 4 intake with raw text
```

Or natural language: mention the project name + intent in chat, the skill auto-routes.

## Structure

```
~/.claude/plugins/ottomate/
├── .claude-plugin/plugin.json            Plugin manifest
├── README.md                             This file
├── REQUIREMENTS.md                       Master spec (R0-R22)
├── STATUS.md                             Live state dashboard
├── PILOT_ONBOARDING.md                   Pilot project notes
├── _archive/                             Stale planning docs (pre-audit, kept for reference)
├── commands/
│   ├── ottomate.md                       /ottomate command entry
│   └── seed-component.md                 /ottomate seed-component
└── skills/ottomate/
    ├── SKILL.md                          Top-level router
    ├── references/                       26 stage + cross-cutting refs
    ├── schemas/                          10 YAML schemas
    ├── prompts/                          4 reusable AI prompts
    ├── data/                             intent-templates, risk-rules, stub-patterns
    └── scripts/                          import-master-components.ts
```

## Companion tracker

`/opt/homeserver/ottomate/` on VAULT7A — Next.js 16 + drizzle + SQLite at port 8110 (localhost-bound). 88 API routes. Repo at `git.vault7a.xyz/pdsv/ottomate-tracker-v3`.

SSH tunnel to view UI:
```bash
ssh -L 8110:127.0.0.1:8110 pdsv@192.168.1.10
# then http://localhost:8110
```

## What's locked

- 5-stage pipeline (Stage 0-4); Stage 5 deferred per user direction
- 7 SO1 docs (overview / flows / features / ui / data / risks / decisions; Doc 6 Inspirations dropped)
- ND1 ephemeral preprocessing input (28 fields, 18 mandatory + 10 conditional)
- Verifier sub-agent (4-pass: code reality / stub detection / data correctness / acceptance criteria)
- 10 lock-in gates (8 original + 2 from Codex Round 2 — deferral/drop + public exposure)
- Trigger phrases for stage transitions
- "Pack up" session-end ritual with drift detection
- ~38 sanity checks across 4 phases (rewritten from 52 pre-audit to BLOCK/PROCEED model)
- Bearer auth on tracker mutations
- Tasks-dashboard stays SEPARATE (not merged)
- Free / self-hosted tools only (Gitea Actions, Playwright, Vitest, axe, Lighthouse, Lost Pixel, Trivy, GlitchTip, Plausible, Infisical)

## Design memory

Canonical design lives in `~/.claude/projects/.../memory/ottomate-*.md`. Audit artifacts at `~/Desktop/skill cleanup/audit-output-2026-04-29/`.
