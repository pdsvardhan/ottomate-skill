# Task — audience-profile capture + intelligent backfill

**Raised:** 2026-07-23 (owner ruling during Task-2 session 2)
**Owns:** getting an `audience_profile` onto every project, old and new.
**Depends on:** `references/design-doctrine.md` §4½ · `data/design-rules.json` → `audience_profiles`
**Blocks:** the constraint checker (build item 2b) — the profile decides which floor rules bind.

---

## Why this exists

A design rule is not universally true; it is true **for an audience on a device**. The research corpus
states its rules against an implied general-public, all-devices reader. Most of this owner's projects
are not that:

| | Users | Built by | Devices |
|---|---|---|---|
| **P1 solo** | 1 (the owner) | the owner | one 27″ monitor, mouse + keyboard |
| **P2 trusted-group** | ~7 (family, friends) | the owner | laptop displays |
| **P3 public** | unknown | the owner | mobile → laptop → monitor |

Without a profile, the checker must either impose the full public-web floor on a single-user tool
(false failures, wasted rounds, exactly the "vomit" the owner objects to) or impose nothing.

## Owner rulings that constrain the design

1. **Ask once, at Stage 0/1.** Not per design round.
2. **Default `P1`.** The most common case, and the least likely to produce false failures if wrong.
3. **Every profile-derived rule is per-project EDITABLE.** The profile is a *preset*, not a straitjacket.
   Explicit ruling: screen-reader support — *"nobody needs, public also it should editable."* So even a
   `P3` project may switch `screen_reader` off, and the override is recorded with a reason.
4. **Backfill existing projects**, and make the backfill **intelligent** — but ship the dumb version first.

---

## Phase 1 — make it work (do this first)

1. **Storage.** `audience_profile` on the project's design ledger context:
   ```jsonc
   "audience_profile": {
     "preset": "P1" | "P2" | "P3",
     "users_est": 1,
     "devices": ["monitor-27"],          // monitor-27 | laptop | tablet | mobile
     "input": ["mouse", "keyboard"],     // mouse | keyboard | touch | pen
     "reach": "personal",                // personal | trusted-group | public
     "overrides": {                      // per-rule, ALWAYS allowed (ruling 3)
       "screen_reader": { "value": "skip", "reason": "owner: nobody in the audience needs it" }
     },
     "set_by": "owner" | "backfill-inferred",
     "confidence": "stated" | "inferred",
     "set_at": "2026-07-23T00:00:00Z"
   }
   ```
2. **Capture.** One `AskUserQuestion` at Stage 0/1 offering P1/P2/P3 in plain language, defaulting to P1.
   Never re-ask a project that has one.
3. **Resolution.** A `resolveFloor(profile)` helper returning, per floor rule, `block | advise | skip` —
   preset defaults from `design-rules.json`, then per-project `overrides` applied on top. **The checker
   calls only this**, never the raw preset table.
4. **Dumb backfill.** For every existing project without a profile: set `preset: "P1"`,
   `confidence: "inferred"`, `set_by: "backfill-inferred"`, and **flag it for confirmation** the next
   time that project is opened. A wrong P1 is safe — it under-enforces rather than blocking good work.

## Phase 2 — make it intelligent (the actual task)

Infer the profile from evidence already in the system instead of asking, then present the inference for
one-click confirmation. **Never silently trust an inference** — it sets `confidence: "inferred"` and asks.

### Evidence sources, strongest first

| Signal | Where | Infers |
|---|---|---|
| Public DNS / reverse-proxy host, TLS cert, no auth in front | NPM config, project's deploy notes | **P3** — anything reachable from the open internet |
| Behind Authentik / on the LAN only / `.vault7a` host | infra config | **P1 or P2** |
| `public_docs` published, or the project is on the CV / portfolio | project record | **P3** |
| Existing responsive CSS: mobile breakpoints, touch handlers, `@media (pointer: coarse)` | codebase | devices + input — a project with real mobile breakpoints was **built for** mobile |
| Viewport meta absent, or fixed min-width > 1280 | codebase | monitor/laptop only → P1/P2 |
| Stage-1 spec's stated audience / use-cases | `projects.spec`, ledger `context` | direct statement — **strongest textual signal** |
| Auth model: no login at all vs. shared password vs. per-user accounts | codebase | 1 user vs. small group vs. public |
| Analytics or user counts, if any | app | `users_est` |
| Sibling projects' profiles + the owner's stated defaults | ledger across projects | prior |

### Rules for the inference

- **Conflicting signals → take the STRICTER profile and say why.** A LAN-only host with published
  `public_docs` resolves to P3, because the cost of under-enforcing on a public surface is higher than
  the cost of a few advisory warnings on a private one.
- **Show the evidence.** "Inferred **P3** — reachable at `blog.example.com` with no auth, and the spec
  says 'for anyone learning X'. Correct?" Never present a bare verdict.
- **One question, not an interview.** The inference exists to replace the interview, per doctrine rule 39
  (harvest before ask). If the inference is confident, it is a confirm, not a form.
- **Re-infer on change.** A project that gains a public host, or loses one, re-runs the inference and
  surfaces the delta — this is the graduation mechanic (doctrine §4½) working automatically.

### Graduation — the payoff

Every design decision records the profile its rationale depended on. When a profile changes, the system
**re-opens exactly the decisions whose rationale cited the old profile** and hands the owner the list.

Worked instance: Screenroom is `P2`; its card keeps title, rating and Play in a hover-revealed footer —
an accepted informed trade-off under P2, a blocking B2 §3.5 defect under P3. If Screenroom ever goes
public, that one decision re-opens automatically and nothing else is disturbed.

---

## Acceptance

1. A new project is asked **once**, at Stage 0/1, and never again.
2. `resolveFloor()` returns the correct tier per rule for each preset, and per-project overrides win.
3. An override is storable **for any rule at any preset**, with a reason, including turning
   `screen_reader` off on a `P3` project.
4. Every existing project has a profile; each one is marked `stated` or `inferred`.
5. Phase 2: the inference gets ≥1 real project right from evidence alone, shows its evidence, and is
   confirmed in one click.
6. Changing a project's profile lists exactly the decisions that depended on the old one — no more, no fewer.

## Out of scope

- The checker itself (build item 2b) — this only decides *which rules it enforces*.
- Per-decision profile stamping — that rides on the `design_decisions` schema (migration 0010).
