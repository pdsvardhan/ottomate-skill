# Unit plans — the A queue and the two new rulings

**2026-07-27.** Section B (Task-2 closeout C1–C12) is already planned in
`2026-07-27-TASK2-CLOSEOUT-PLANS.md`. This covers what had no plan: **A1–A6**, and **N1/N2** from the
owner's rulings this session. A7 step 1 is done (`654e18f`); the rest of A7 is C1.

---

## A2 — `stage-4-visual-qa.md` still advertises `data-oid` as shipped · trivial

Line 77 reads `## Status (2026-07-23) — all shipped`, and lines 86–88 list `data-oid` provenance
stamping under it. The claim was **withdrawn 2026-07-27** on the owner's decision: `grep -rc data-oid`
over Screenroom returns 0. Two skill docs currently contradict each other.

**Build:** rewrite the status block to say what is live and what was withdrawn, with the reason.
**Acceptance:** no line in the file claims `data-oid` is shipped; the withdrawal is stated with its
date and its consequence (a component rename does not invalidate its design decisions, because nothing
connects them).

---

## A3 — `stage-2-design-method.md` BUILD STATUS is stale in the pessimistic direction · trivial

Line 35 says "30 of 91 rules"; line 44 says "**61 of 91 rules remain `pending`**". Measured today:
**79 enforced, 0 round-scope pending, 11 excluded by scope, 1 declared-unenforceable.**

**Build:** replace the block with the measured numbers and name the suites.
**Acceptance:** the numbers match `design-rules.json` when re-counted. *A status block that understates
is still a status block that lies* — this is the same defect class as a rule marked `pending` while
working.

---

## A6 — the three specs under version control · small · **owner ruled: plugin copy is canonical**

`~/Desktop/Skills CC/Ottomate` is not a git repo, and the two copies of the Task-2 spec have already
diverged (the plugin's carries the §11b CSS-interactive amendment; the Desktop original does not).

**Build**
1. The plugin's `docs/specs/` copies become the single source of truth (they are already in git and
   already carry the amendment).
2. Add a header to each naming it canonical, dating it, and pointing at the register.
3. Replace the Desktop originals with a short pointer file, so opening the old path leads somewhere
   rather than to a stale spec. **Do not delete them silently** — a file that vanishes reads as loss.
4. Record the divergence in the register's superseded section.

**Acceptance:** each spec exists once, in git; the Desktop path points at it; a diff of the two former
copies is recorded so the amendment's history is not lost.

---

## A1 — visual-QA routing · **owner deferred the shape twice; proceeding on the recommendation**

Evidence gathered: **38 exports in `~/Downloads`, 33 of them `.json`**; exactly **one** visual-QA report
ever reached the app; and the owner's own words on 2026-07-26 — *"thought you autoread them"*.
Open to-do **#333** shows the direct push had already failed silently, so routing was the *second*
failure.

Owner **has** ruled the auto-pickup half: *notice, then ask* — never ingest without confirmation.

**Build**
1. `command-routing.md` — a new **Rule D2** in Step 5: a message naming comments/visual-QA, or an
   argument matching `*-comments-*`, routes to `references/stage-4-visual-qa.md`.
2. Extend the pattern to **`.json` and `.zip`** — 33 of 35 real exports are v1 `.json`, so the spec's
   zip-only wording would have missed nearly all of them.
3. `output-style.md` — trigger-phrase rows: *"here are my comments"*, *"ingest my comments"*,
   *"did my visual QA"*, *"check the commenter"*. Position-aware and question-suppressed, like every
   other trigger.
4. Step 4's existing ssh batch gains one `ls -t ~/Downloads/<slug>-comments-*` and compares against
   the project's newest `source='visual-qa'` report. Newer file → **one line** in the load block
   offering to ingest. **Never ingests unprompted.**

**Acceptance**
- **Must-pass:** a `.json` export newer than the last ingest surfaces the offer line.
- **Must-fail:** an export **older** than the last ingest does **not** nag.
- **Must-fail:** nothing is POSTed without confirmation — the notice is a notice.

---

## A5 — unit tests for `scripts/feature-verify/` · **blocks the parallel Task-3 session**

Zero tests exist, including for `Matrix.verdict()` — the fail-closed logic the whole Task-3 gate rests
on. This is WP0 of the Task-3 brief; landing it first is what lets that session start from a clean base
while I stop touching the directory.

**Build:** a test file exercising `Matrix` (counts, verdict, renderTable) and the unicode helpers.
Node 22.13 strips TypeScript types with `--experimental-strip-types`, so no build step and no
`package.json` — the zero-dependency rule holds.

**Acceptance**
- **Must-fail:** one failing case → `BLOCK`; one **skipped** case → `ITERATE`, never `APPROVE` — a
  skipped step can never render green.
- **Must-pass:** all-pass → `APPROVE` with `mandatory_user_review: false`.
- **Must-fail:** `judge_verdict` is ignored by the verdict — an AI verdict must never gate.
- **Must-pass:** risk policy `warn` records the failure without demanding review; `block` demands it.
- **Must-fail:** NFD input is caught as not-NFC; a transliterated name is caught as ASCII-mangled.

---

## N1 — context gate blocks at P1, but remembers the answers · **owner ruling**

Today `contextGate` advises at P1 and blocks at P2/P3. The owner has ruled it should **block at P1
too**, but only once per project: answer the four questions (audience · use-cases · brand-tone ·
primary-screen) on the first round, reuse them thereafter, re-ask only when they change.

**Build**
1. Persist the four answers per project. The `ui_master_plans.design_ledger` blob already exists and is
   the right home — **no migration**.
2. `contextGate` gains a `stored` input: a complete stored context satisfies the gate at any profile.
3. Blocking at P1 becomes the default; the escape is an explicit `--recontext` to re-ask.
4. `ui-mode:none` keeps skipping the gate — deferring UI is the owner's default and that is unchanged.

**Acceptance**
- **Must-fail:** a first round on a project with no stored context is **blocked at P1** (this is the
  behaviour change; today it advises).
- **Must-pass:** a second round on the same project with stored context proceeds with **no questions**.
- **Must-fail:** stored context missing one of the four keys does not satisfy the gate.
- **Must-pass:** `ui-mode:none` still skips.

---

## N2 — the design index as a status board · **owner ruling** · app-side, largest of these

The owner's words: *"per project urls maintained in ottomate, with clear distinction between pages,
components, what's final what's not, cuz sometimes i refer these pages to see what's done what's not."*

So this is **not** a URL-scheme change. Per-round URLs stay (they give history). What is missing is
that `/projects/<slug>/design` does not work as a **status view**.

**Build**
1. Group targets by **kind** — page vs component — from `target_kind`, which the ledger already stores.
2. Show per target: **locked / open / superseded** counts, and the newest round with a link.
3. Sort so unfinished work is at the top; finished work reads as finished.
4. Show the count of decisions that **cannot become code** (an unresolved axis, per C1's new refusal) —
   that is the number that would have silently been zero.

**Acceptance**
- **Must-pass:** a target with all decisions locked renders as final; one with open decisions renders
  as in-progress, with the open count.
- **Must-pass:** pages and components are visually distinct.
- **Must-fail:** a target whose axes cannot resolve is flagged, not shown as complete.
- Typecheck before the container rebuild; `git status` after committing.

---

## Order

**A2 · A3** (minutes, and they are lies in docs) → **A6** (stops the divergence recurring) →
**A1** → **A5** (unblocks the parallel session) → **C1** (critical path) → **N1** → **N2** →
**A4** (run the spec on VAULT7A).
