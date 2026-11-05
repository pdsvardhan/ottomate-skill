# Ottomate skill

A Claude Code skill that takes a web project from idea to shipped, one approved stage at a time. It works with a companion website, the tracker, which keeps each project's plan and progress outside the chat.

> **About this public copy.** Published in November 2026 for my portfolio, with its real commit history. It was built for my own home server, so its paths and hosts assume that setup and it won't run as-is. Home-network addresses are replaced with documentation addresses (192.0.2.x), and a few internal files were left out of the history.

A *skill* is a set of instructions, reference files and scripts that Claude Code (Anthropic's coding agent) loads when a task calls for it. This one tells Claude how to plan, design, build and improve a web app, and when to stop and ask the user.

## Why it exists

In long AI build sessions, three things kept going wrong:

- The AI said a feature was finished when it was only a placeholder.
- It quietly dropped work it had agreed to do.
- Everything was lost between chats, so each new session started from scratch.

Ottomate keeps each project's plan and progress in the tracker, and the skill works from that record. Nothing counts as done until the user has approved what gets built and two separate checks have passed.

## How it works

A project moves through five stages. The reference files call them Stage 0 to Stage 4.

| Stage | What happens | Before moving on |
|---|---|---|
| 0. Idea | The skill interviews the user: the problem, who it is for, what success looks like, what is out of scope, likes and dislikes. It drafts rough features and user flows. It can also start from an existing project's docs and code. | The user confirms the brief. It names at least one success measure, one thing out of scope, one feature and one user flow. |
| 1. Spec | The brief becomes a written spec: an overview, features (each with 1 to 5 acceptance criteria, the tests that define "done"), step-by-step user flows, pages, data, risks and early decisions. The skill checks the spec in five passes, including one that confirms nothing from the brief was dropped. | All five passes are clean, every feature is specified, every flow's steps are locked, and the user confirms. |
| 2. Design | The user chooses the look by picking, not describing. The skill shows real, interactive options side by side that differ in one thing at a time. Theme, colours and fonts are locked in a UI plan with a colour-contrast check, and each part of a page is picked from a shared component library. Tech stack, architecture and build plan are recorded as decisions. | Every component is picked, or skipped with a written reason. Stack and architecture decisions are recorded, and coding guidelines are written to the repo. |
| 3. Build | The skill sets up the repo and container, writes the code feature by feature, runs the two checks below and the tests, then deploys. | Both checks pass for every feature, a secret scan is clean, a backup plan is in place, and the key end-to-end tests pass. |
| 4. Improve | Feedback typed in chat, filed on the tracker or left as on-page comments is split into separate items. Each item must quote the user's words or say why it was inferred. Each item is then built and checked like a feature. | The user reviews and locks the list of items before any code is written. A trace report at the end maps what was asked for to what was built and checked. |

**Gates.** The "before moving on" column is the gate for each stage. The user approves every step that decides what gets built: they confirm the brief and the spec, pick the design, and lock each list of changes before any code is written. Gates are never waived. If one can't be met, the skill stops and asks instead of working around it. Anything left out needs a written reason that the user sees.

### The two checks

**Code review agent.** After each feature is coded, a separate Claude agent reviews it with its own fresh context. It gets the locked spec, the list of expected files and the code changes, not the coder's own account of what it did. It confirms that the expected files, functions and endpoints really exist and work. It scans the changed code for placeholders such as TODO notes, hard-coded sample data, "Lorem ipsum", "Coming soon" and empty functions. It runs the tests, checks that they test something real, and checks each acceptance criterion. A placeholder is a hard fail: work stops until the user has reviewed it.

**Feature check.** A second, separate check drives the running app in a real browser (Chromium, through Playwright), the way a human tester would. Its test cases are written from the spec before the code is built, without seeing the coder's work, and the user reviews them first. The cases cover the normal path, edge cases, errors and awkward data such as non-English text, emoji and very large inputs. After each step it confirms the real effect, such as the file saved on disk or the record stored in the database, not just a success message. It saves screenshots, video and traces as evidence. A step that errors or is skipped can never count as a pass. AI opinions on how a page looks are advisory: they can flag something for a human, but they never pass or fail a feature.

A feature counts as done only when both checks pass. On public projects a failure blocks the release; on personal projects it shows as a warning.

## The skill and the website

The skill decides what to do next and talks to the user. The tracker holds the state, enforces the gates and stores the evidence.

| Part | What it owns |
|---|---|
| **This skill** | How the work is done: the steps for each stage, the questions to ask, the gate rules, the prompts for the review agents, and scripts for design previews, design checks and browser tests. |
| **The tracker** | The record: each project's brief, spec, design decisions, to-do list, feedback, test results and review reports. Its API enforces some rules directly; for example, a feature with no acceptance criteria can't be moved to "building". It also flags problems such as a "done" claim that no check has confirmed, or a deploy with no test run. It has pages for picking designs and locking lists of changes, and pages that present each project's features, flows, architecture and progress. |

Every session starts by loading the project from the tracker: its stage, open to-dos and earlier design decisions, including options the user already rejected. When the user says "pack up", progress is saved, and the spec is also written as YAML files into the project's own repo as a backup.

The tracker is a Next.js app with a SQLite database. Its code is at [pdsvardhan/ottomate-tracker](https://github.com/pdsvardhan/ottomate-tracker).

## Using it

```
/ottomate                  List projects and pick one
/ottomate <slug>           Resume a project
/ottomate new              Start a new project at the idea stage
/ottomate <slug> <text>    Send feedback on a project and start an improve round
```

A slug is a project's short name in the tracker.

It needs:

- **Claude Code**, with this repo installed as a plugin (see `.claude-plugin/plugin.json`).
- **A running tracker** that the skill can reach. As written, the skill calls the tracker's API over SSH on my home server, and write calls need an access token kept on that server. To run it anywhere else, the host and paths in `SKILL.md` and `references/` would need changing.
- **Node.js** for the scripts. The browser checks use Playwright.

## What's in this repo

| Folder | What's in it |
|---|---|
| `skills/ottomate/` | The skill itself (see below). |
| `commands/` | `/ottomate seed-component`, a helper that adds one component to the shared component library. |
| `data/scaffold/` | A starter `/design` page copied into each project, so the user can pick components in the project's own look. |
| `docs/` | Specs, plans, research notes, audits and test-run write-ups made while building the skill. |
| `scripts/` | `generate-status.sh`, which produced the `STATUS.md` snapshot (June 2026) from the live tracker. |
| `_archive/` | Older requirements, planning docs and retired references, kept for history. |
| `.claude-plugin/` | The plugin manifest Claude Code uses to load the skill. |

Inside `skills/ottomate/`:

- `SKILL.md`: the entry point. It lists the stages, gates and rules, and points to one reference file per topic.
- `references/`: step-by-step instructions for each stage, plus shared topics such as output style, the tracker's API and the end-of-session routine.
- `prompts/`: prompts for the two checks, the test-case author and the visual judge, and for turning the user's free text (the idea, or later feedback) into structured items.
- `scripts/`: Node.js tools. `feature-verify/` is the Playwright test harness, `design-check/` checks design options against rules, `generation/` and `preview-build/` build the side-by-side design options, `theming/` builds design tokens and checks contrast, and `doc-lint/` checks project docs.
- `schemas/`: the expected shape of each spec document and review report.
- `data/`: rule lists and rubrics, including the placeholder patterns the code review looks for.

`SKILL-REGISTER.md` at the root is the owner's index of every system and rule in the skill.

## Links

- Showcase (public): https://ottomate.vault7a.xyz/showcase/
- Tracker repo: https://github.com/pdsvardhan/ottomate-tracker
- Author: Sai Vardhan Palli, [LinkedIn](https://www.linkedin.com/in/sai-vardhan-palli-3b1614187/)
