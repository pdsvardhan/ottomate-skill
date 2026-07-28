# Design-method test harness — the protocol a TEST session runs

**Purpose.** The owner human-tests the Ottomate **Task-2 iterative UI design method** by *running it for
real* on a project, while a session (you) (a) **tracks every mutation** so it can be fully rolled back,
and (b) **observes** against the checklist below. Run the skill **normally** — do not change how it
behaves; the whole point is to test the real thing. You are ALSO the recorder and, at the end, the
rollback + the reviewer.

---

## 0. Setup — before the owner gives the example

1. **Title the session** `TEST — design <slug>` (fill the slug once you know it).
2. **Read** `../../SKILL-REGISTER.md` (what exists + what is enforced) and this file.
3. **`POST /api/backup`** (labelled) — record the returned path in the manifest as the **last-resort**
   restore point. (Surgical rollback is primary; a whole-DB restore would revert other sessions too.)
4. **Open a manifest** at `docs/test-runs/<date>-<slug>-run<N>.md` from the template in §2.
5. **Record the baseline** for the target project, so rollback can be *verified*, not assumed:
   - `GET /api/projects/<slug>/design-decisions` → the current **count + max id** (for an existing project).
   - The project repo's **pre-test HEAD sha** (only if you will test the real emit).
   - Whether the project **already exists** (a new-project onboard is rolled back by one project DELETE).
6. **WAIT.** Do not design anything until the owner names the project + the change. The trigger itself is
   part of the test (does the method engage from a natural request?).

---

## 1. Running the method (the part under test)

- Run the design method exactly as the skill dictates for the owner's request — intake → context →
  worklist → round(s) → gate/check/computed → publish → pick/mix → lock → emit. **Change nothing** about
  how it decides; only *log and watch*.
- **Emit defaults to `--dry-run`** during a test (no project-repo commit to undo) **unless** the owner
  asks to test the real emit — then record the pre-test HEAD sha AND the resulting commit sha.
- **Every mutation → a manifest row, as you make it** (§2). The rollback is only as complete as the log.
- **Backup-first before any DB write.** **ONE DOOR** — all DB via the API, never a second sqlite client.
- If **onboarding a NEW project**, record the created slug (deleting it cascades pages/components/decisions).

---

## 2. The manifest (append every mutation)

```
# TEST RUN — <slug> — run <N> — <date>
Baseline: decisions count=<n> maxId=<m> · repo HEAD=<sha or n/a> · project pre-existing=<yes/no>
Backup: <path from /api/backup>

| # | type | target | id / path / sha | undo |
|---|------|--------|-----------------|------|
```
**types:** `db-decision` (design_decisions id) · `db-ledger` (ui_master_plans.design_ledger change +
the prior value) · `db-project` (created slug) · `db-other` (table + id) · `preview` (previews-volume
path) · `repo-commit` (project repo + commit sha, with the pre-test HEAD) · `file` (path written).

---

## 3. Observe — the comprehensive checklist

Not a script to walk in order — a lens. For **each row that the run touches**, record a **verdict**
(`PASS` / `WEAK` / `FAIL` / `N/A`) with a **specific note + evidence** (the round, file, output, or DB
row that shows it). "Mostly worked" is a **WEAK or FAIL with the gap named**, never a PASS. Add rows the
run surfaces that aren't here — this list is a floor, not a ceiling.

### A. Trigger & routing
- A natural "change how X looks" request **engages the design method** (not a generic code edit).
- Scope classified right: component / cluster / page / site → the right ladder rungs (`routeRungs`).
- A vague/deictic ask ("new button here", no context) **REFUSES and asks** rather than guessing.
- Entry point: existing project **inherits** context (no re-interview); new project **interviews**.
- `ui-mode:none` ("design later") is respected as the default, not forced into a round.

### B. Context intake & adherence to what exists
- New project: the **context gate** captures audience / use-cases / tone / primary-screen **+ the
  P1/P2/P3 profile** before any visual.
- Existing project: context is **inherited**, and the built code is consulted — does it read the
  project's **existing tokens/theme** (`source-art`) and **prior decisions** (`prior-art`) and make the
  new work **adhere** to them?
- A conflict between what the ledger says and what the code already does is **named, not silently seeded**.

### C. Round composition — grouping intelligence (a headline concern)
- **1 / 3 / 10 components**, and **one big component with many changes**: does it **group sub-decisions
  intelligently** into rounds (≤5 contested axes, grouped by perceptual channel, structure-before-dress),
  or dump everything into one **over-wide** round, or **over-split** into many tiny ones?
- Does it **show multiple related things at once** (token/round economy) vs one-at-a-time round-trips?
- Does it **promote foundational axes** and **escalate** a component round to cluster/page when needed?
- Multiple components: are they handled **together coherently** (shared foundation) or in disconnected silos?

### D. Anatomy / derive — what to vary
- Registered archetype (media-card / button / table-row): correct parts + sub-decisions?
- **Unseen component**: does derive-from-source work on the real stack (shadcn `cn`/`cva`, Radix `<X.Y>`,
  Tailwind)? Does it **refuse to invent** an out-of-registry axis (rule 40)? Correct tier?

### E. The variants — generation quality (a headline concern)
- **2–4 genuinely different** variants (not samey), varying on the **open axis** with controls held
  (isolation gate: axis-diff · control-diff · blind-sort · count-by-rung).
- They **render** — isolated, real content, CSS-interactive, light **and** dark hold.
- Are the designs **actually good**? Direction committed (not timid-middle)? **Anti-slop** (no
  cyan-on-dark / purple→blue gradient / glass-everywhere / rounded-lg-on-all / accent-bar-on-every-card)?
- **Colour budget** honoured (accent on a few surfaces, not monochrome)? **Pressure-tested** (contrast,
  motion comfort, a11y) before being shown? Real-asset / theme-from-content where it applies?

### F. Where & how served + the explaining text
- Renders in the **app design surface** (iframe, real page), **same URL** on each rebuild.
- The **explaining text** is clear, **honest** (no overclaiming), and labels are **neutral** (nothing
  pre-recommended).

### G. Pick / mix / lock — the loop
- You can **pick one** or **mix** ("1A's header + 2C's card"); a pick lands **proposed**, not auto-locked.
- **Lock is earned** (explicit confirm); a **locked** item **carries forward untouched**; a **rejected**
  value is **never re-offered**; the ledger records every lock **+ rationale**, uncapped.

### H. Catalog / source policy
- Does it **consult `master_components`** (library-first), or bypass it? Variants **tagged by source**
  (`catalog` mc_id / `bespoke` with a stated why)?

### I. Output / emit — handoff to Stage 3
- A locked round **emits tokens + a spec** into the project (token vs structural resolution correct,
  **nothing invented**); **doesn't push**; refuses on a dirty tree. (Prefer `--dry-run` in a test.)

### J. Tracking boards (N2 / N3 / #319)
- The status board shows **what's designed / pending / placeholder**; a component goes **final on
  confirm**; **a page finalizes when its components do** (new decomposed project); **classify-by-flow**
  reflects reality; the **audience profile** is shown.

### K. Anti-gaslight / trust — the meta
- **Ask-on-primary** (foundational decisions asked with options, not silently picked); feedback
  **restated before acting**; **never regresses** a locked item; each round runs **fresh-context** (no
  long-session repetition). **Every deviation from the brief: was it a GOOD idea or did it ignore you?**

### L. Fail-closed everywhere
- The gates actually **block** and write nothing when tripped (isolation, constraint checker, computed,
  T5 labels, source policy). **Computed-at-publish (D-3):** P2/P3 **blocks** a round whose computed
  checks didn't run; P1 warns.

### M. Efficiency / token economy
- Sensible batching; the **one-command** pipeline (fetch→build→check→publish) vs manual round-trips;
  no wasteful re-generation.

---

## 4. Code word: **"skill test done"**

When the owner says it, do these in order and **show your work at each step**:

1. **Read the manifest.**
2. **Roll back — in reverse order:** `DELETE /api/design-decisions/<id>` for each recorded decision ·
   restore/clear the recorded ledger change · `rm -rf` each preview dir · if the real emit ran,
   `git -C <repo> reset --hard <pre-test HEAD>` (only design/ottomate/ was touched; refuse if the tree
   has unrelated changes) · **`DELETE /api/projects/<slug>`** for any project you created (cascades).
3. **Verify clean, don't assume:** the project's design-decisions **count + max id == baseline** ·
   previews **404** · repo tree **clean at the pre-test sha** · a created project **404**. Print the check.
4. **Write the findings:** `docs/audits/<date>-design-method-test-findings.md` — every observation from
   §3 as a row (dimension · verdict · evidence · good-vs-bad deviation), then a **prioritised fix plan**.
5. **Do NOT** whole-DB-restore from the backup unless surgical rollback **failed** AND the owner approves
   (it reverts other sessions' writes too).

---

## 5. Safety (violate none)

- **Track B owns** `scripts/feature-verify/**` + `/tmp/fv` + `feature_verification_reports` — never touch them.
- **ONE DOOR** (all DB via the API) · **`POST /api/backup` before any DB write** · never `drizzle-kit`.
- **Never fake a green.** Never lower a threshold to make the method look better. Log the gap.
- Prefer a **surgical** rollback (the manifest) over a whole-DB restore.
- If unsure whether a mutation is yours, **do not delete it** — flag it for the owner.
