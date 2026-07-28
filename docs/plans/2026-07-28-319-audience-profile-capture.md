# #319 — audience-profile capture + intelligent backfill · plan

**Written 2026-07-28.** App to-do #319. The context gate (`contextGate`, N1) already captures the four
context answers (audience · use-cases · brand-tone · primary-screen) into the ledger and blocks a round
until they exist. What #319 adds is the **audience PROFILE** (P1/P2/P3) — the field that
`resolveFloor(profile)` uses to decide which floor rules bind — captured per project and **backfilled**
for the projects that predate it.

## Why it matters

`resolveFloor` is proven to return different floors for P1 vs P3, and a per-project override beats the
preset. But nothing **captures** the profile from the owner or infers it — every round currently
defaults to `P1` (the owner's own profile). For a project whose real audience is P3 (a shipped product
with external users), defaulting to P1 makes the floor soft exactly where it should bind. This closes
that gap.

## The two halves

**A. Capture (going forward).** When context is first recorded for a project (the N1 gate), also ask the
profile — three plain choices, not jargon:
- **P1** — *just me / a demo*: I'm the only user; err generous, skip screen-reader-only floors.
- **P2** — *a small team / internal*: colleagues use it; the standard floor.
- **P3** — *a shipped product / external users*: strangers use it; the full WCAG 2.2 AA floor binds.

Store on the project (or the ledger context blob — no migration if it rides in `design_ledger.context`).
`profile_at_decision` already exists on `design_decisions`, so each decision keeps the profile it was
taken under.

**B. Intelligent backfill (existing projects).** Infer a *suggested* profile — never silently set it —
from signals already in the app: `current_status` (`live`/`public` → P3; `ideating`/`building` → P1),
a public URL / deploy target, `used_in_projects`, whether the repo has a real user auth surface. Present
the suggestion with its evidence; the owner confirms or overrides. **Suggest, never assert** — the same
discipline as the author backfill (H1) and prior-art (conflict, not resolution).

## Build (app + skill)

1. **Skill:** extend the N1 context gate prompt to include the profile question; write it into
   `design_ledger.context.profile`. `buildRoundInput`/`resolveFloor` already read a profile — thread it
   from context instead of the `P1` default.
2. **App:** a small profile field on the project settings / the design surface, showing the current
   profile + the inferred suggestion with evidence.
3. **Backfill:** a one-shot that computes the *suggested* profile for all projects and writes it to a
   review list (not to the projects) — the owner applies from there. Backup-first if it ever writes.

## Acceptance

- **Must-pass:** a project marked `live`/`public` yields a **P3 suggestion** with the signal named; an
  `ideating` project yields **P1**.
- **Must-fail:** the backfill never overwrites an owner-set profile, and never sets one without
  confirmation (suggest-only).
- **Must-pass:** once a project's profile is P3, a round's `resolveFloor` binds the P3 floor (the
  existing test proves P1 ≠ P3; this asserts the profile now comes from captured context, not the default).
