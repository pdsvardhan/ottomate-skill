# Stage 4 — Graduation. Unit plans for S1b and S2–S10.

**Written 2026-07-27.** H1 is the spec (`design-doctrine.md` §3¾ *Asset sourcing*). This doc turns its
ten one-line items into buildable units, each with build steps and an acceptance bar carrying **both**
a must-fail and a must-pass case.

> **S1 is already done** and it moved the goalposts. Read §0 before anything else — three of the
> original S-items are smaller than they were written, and one new prerequisite appeared.

---

## 0. Live state, measured 2026-07-27 — the plan is built on these, not on H1's assumptions

| Question | Measured answer |
|---|---|
| How many catalog rows? | **116.** `GET /api/master-components` → `count: 116`; the route applies no limit and no default filter (read directly). **The "179" repeated everywhere was never true of this table** |
| Component dirs on disk? | **267** at `/mnt/storage/ottomate/assets/components/` — a **151-dir gap** (to-do #306) |
| Do provenance columns exist? | **Partly.** `source_url` · `license_note` · `quality_grade` · `ingestion_method` · `source_paths` · `library` all exist |
| Fill rates | `quality_grade` **A 31 · B 21 · C 47 · null 17** (85% graded) · `license_note` **86/116** · `source_url` **40/116** |
| `library` distribution | ottomate 48 · asset-library 26 · react-bits 13 · magicui 11 · aceternity 10 · codepen 3 · kibo 3 · balls-of-the-bull-app 1 · tasks-app 1 |
| `ingestion_method` | hand-authored 48 · manual-copy 37 · hand-curated 26 · gist 3 · project-extracted 2 |
| Next migration | **`0011_`**; last is `0010_design_decisions`, journal `idx: 5` → **new entry `idx: 6`, `version: "6"`, `breakpoints: true`** |
| `quality_grade` type | `text(..., { enum: ['A','B','C'] })` — **A–C, not A–F.** The enum is **TS/zod-only, no SQL CHECK**, so widening it is a *code* change, not a migration |

**Three consequences that change the S-list:**

1. **S2 shrinks from 8 columns to 6.** `source_url` and a grade column already exist.
2. **S6 changes shape.** Grading is not being *added* — 85% of rows already carry a grade nobody can
   reproduce. S6's real job is to make the grade **derivable and re-runnable**, and to widen A–C to A–F.
3. **A new prerequisite, S1b.** Graduation writes *into* this catalog. Ingesting one clean component
   into a table that is 57% out of sync with its own asset volume compounds a known defect.

---

## S1b — Reconcile the 151-dir drift · **prerequisite, do first**

**Why first:** every later unit assumes the catalog is the source of truth about itself. It currently
is not. A dedupe pass (S7) that cannot see 151 components will report "no duplicate" and be wrong.

**Build**
1. Enumerate `/mnt/storage/ottomate/assets/components/*` and diff against the 116 `id`s.
2. **Classify before touching anything** — the 151 are not one thing. Expect at least: components from
   the 2026-07-04 sourcing sprint that were written to disk but never registered; orphan dirs from
   deleted rows; and `source_paths` pointing at the older `/asset-library/<id>/` layout. *(Memory
   records that orphan asset dirs are **not** safe to delete — some are fixture dependencies.)*
3. Produce a written classification with counts per class. **Do not bulk re-ingest** — that is how
   unprovenanced rows would enter the catalog at exactly the moment Stage 4 exists to prevent it.
4. Re-ingest only the class that is genuinely "built, rendered, never registered", **through the S3
   provenance gate**, so they arrive with provenance rather than being back-filled later.

**Acceptance**
- **Must-pass:** a written classification accounting for **all 151** dirs, every dir in exactly one class.
- **Must-fail:** a dir that cannot be classified is reported as `unknown` and **blocks its own
  re-ingest** — it must never be swept into a catch-all "re-ingest the rest".

**Risk:** deleting an orphan dir that a fixture depends on. **Nothing is deleted in this unit.**

---

## S2 — The migration · six columns, hand-written

**Never `drizzle-kit generate`/`migrate`** — the un-journaled 0002–0006 gap makes it unsafe.
**`POST /api/backup` first.** ONE DOOR for everything else.

**Build**
1. `lib/db/migrations/0011_master_components_provenance.sql`:
   ```sql
   ALTER TABLE master_components ADD COLUMN spdx_id TEXT;
   ALTER TABLE master_components ADD COLUMN author TEXT;
   ALTER TABLE master_components ADD COLUMN attribution TEXT;
   ALTER TABLE master_components ADD COLUMN licence_url TEXT;
   ALTER TABLE master_components ADD COLUMN retrieved_at INTEGER;
   ALTER TABLE master_components ADD COLUMN trademark_flag INTEGER DEFAULT 0;
   ```
   All nullable, no backfill, no default beyond `trademark_flag`. **A NULL here means "we never
   captured it", which is exactly what quarantine (S3) must be able to see.** Defaulting `spdx_id` to
   anything would launder an unknown licence into a known one — the single worst thing this subsystem
   could do.
2. Hand-add the journal entry to `lib/db/migrations/meta/_journal.json`: `idx: 6`, `version: "6"`,
   `when: <epoch ms>`, `tag: "0011_master_components_provenance"`, `breakpoints: true`.
3. Mirror in `lib/db/schema.ts`; **widen `quality_grade` to `['A','B','C','D','E','F']`** in the same
   change (TS-only, no SQL).
4. `POST /api/backup` → let the app self-migrate on boot → **typecheck before the container rebuild**.
5. `git status` **after** committing.

**Acceptance**
- **Must-pass:** `GET /api/master-components` still returns **116** rows, the six new keys present and
  `null` on every pre-existing row; one row PATCHed with a full provenance set round-trips.
- **Must-fail:** a POST carrying `quality_grade: 'G'` is **422**, not silently stored.
- **Must-fail:** re-running the migration does not double-apply (journal idx is the guard).

**Risk:** the live DB. Backup first, and this is the one unit that should not run without the owner
saying go.

---

## S3 — Provenance at ingest, or quarantine

H1: *provenance captured at ingest or lost forever; no provenance → quarantine.*

**Build**
1. `scripts/generation/provenance.mjs` — `validateProvenance({source_url, author, spdx_id, licence_url,
   attribution, retrieved_at})` → `{ok, missing[], tier, quarantine:boolean}`.
2. **Required set depends on origin, and the honest rule is not "always require everything":** a
   `library:'ottomate'` hand-authored component genuinely has no upstream URL, and demanding one would
   teach people to type `n/a`. So: **authored** → `author` + `spdx_id` (we are the author, we choose the
   licence); **third-party** → all six.
3. Wire into the ingest path (`POST /api/master-components`) **and** `graduate.mjs`.
4. Quarantine = a row that is stored but **excluded from catalog lookups**, not a row that is refused.
   Refusing loses the work; quarantining keeps it and makes the gap visible and fixable.

**Acceptance**
- **Must-pass:** an authored component with `author` + `spdx_id` ingests and is catalog-visible.
- **Must-fail:** a third-party component with no `spdx_id` is **quarantined**, and a catalog lookup does
  not return it.
- **Must-fail:** `spdx_id: ''` and `spdx_id: 'unknown'` are treated as **absent**, not as a value.

**Applied to the existing 116:** run it as a *report* first. Expect ~30 rows with no `license_note` and
76 with no `source_url` to flag. **Do not retro-quarantine on the first run** — see the open question
in §Q.

---

## S4 — GREEN / AMBER / RED licence tiers

`licenceTier(spdxId)` already exists in `graduate.mjs`. This unit hardens it and encodes the named
exclusions.

**Build**
1. **GREEN** — MIT · ISC · BSD-2/3 · Apache-2.0 · CC0-1.0 · Unlicense. Ship freely, attribution as the
   licence requires.
2. **AMBER** — copyleft or attribution-heavy (GPL family, MPL, CC-BY): usable with obligations; must
   appear in NOTICES; flagged at pick time.
3. **RED** — **anything `-NC`, anything `-ND`, and anything unknown**. Rejected. *Unknown is RED, not
   AMBER: an unidentified licence is not a permissive one, and treating it as merely cautionary is how
   an NC asset ends up in a cv/public project.*
4. Named exclusions, encoded by name with their reason:
   - **Shadertoy — CC BY-NC-SA 3.0.** Non-commercial **and** viral. RED.
   - **unDraw** — per-image licence only; forbids repackaging into packs, scraping, and **AI-training
     use**. RED for bulk ingest; a single hand-picked image is a separate owner decision.
   - **Rive** — WASM. Already blocked by the `no-wasm` feasibility rule; encode here too so it fails at
     *ingest* rather than at *render*, three stages later.
5. **`trademark_flag` is independent of the licence.** H1 §3.5 and D2 §3.7 independently concluded a
   CC0 file licence does **not** waive a trademark. A CC0 logo is still a logo.

**Acceptance**
- **Must-pass:** `MIT` → GREEN · `CC-BY-4.0` → AMBER · `GPL-3.0-only` → AMBER with obligations.
- **Must-fail:** `CC-BY-NC-SA-3.0` → RED · `CC-BY-ND-4.0` → RED · `null`/`''`/`'proprietary'` → RED.
- **Must-fail:** a CC0 component with `trademark_flag: 1` is **not** cleared by its GREEN tier.

---

## S5 — Strip framework coupling; tokenise on ingest · **the least-designed unit**

H1: *a baked-in `#fff` is a downgrade, not an entry.* `tokeniseCheck` exists in `graduate.mjs` as a
check. Turning a *check* into a *transform* is the hard part, and it is **not currently designed** —
this unit needs a design pass before a build pass.

**Two honest options, and the recommendation**

- **(a) Detect and report, do not rewrite.** Flag literal colours / spacing / radii and **downgrade the
  grade**, leaving the source untouched. Cheap, safe, no risk of a bad rewrite.
- **(b) Rewrite literals to tokens on ingest.** Matches H1's letter, and is where a machine mangles a
  component: a literal inside an SVG `stroke`, a `box-shadow`'s third colour stop, or a
  `color-mix()` argument is not interchangeable with a token.

**Recommendation: (a) first, (b) never automatically.** Report, downgrade, and let the *graduation of a
locked bespoke variant* — where the tokens are already known because the round produced them — do the
substitution with the round's own token names. That is the only case where the mapping is knowable
rather than guessed. Framework-coupling stripping (React-specific imports, `className` utilities) stays
in scope for a report, not a rewrite.

**Acceptance**
- **Must-pass:** a component using only `var(--…)` scores no tokenisation penalty.
- **Must-fail:** one with `#fff` in a `background` is flagged **and** its grade drops by at least one
  band — a flag with no consequence is a flag nobody reads.
- **Must-pass:** a literal inside a `<path d="…">` is **not** counted as a colour.

---

## S6 — The grading runner · A–F, only A/B ship

**Reframed by S1: 85% of rows already carry a grade, and nothing can reproduce it.** An unreproducible
grade is exactly the class of claim this programme keeps deleting.

**Build**
1. `scripts/generation/grade-component.mjs` — a pure function over a component record + its source,
   returning `{grade, factors[], unmeasurable[]}`.
2. Factors, each measurable: provenance completeness (S3) · licence tier (S4) · tokenisation (S5) ·
   dark/light support · responsive · dependency count · **whether it renders at all** (the existing
   isolation/feasibility rules already answer this).
3. **An unmeasurable factor shrinks the denominator; it never scores zero.** Copied deliberately from
   `rubric-score.mjs`, where the same decision was made and holds.
4. Only **A/B** ship. C–F stay in the catalog, visible, with the reason attached.
5. **Re-grade the existing 116 as a report and diff against the stored grades.** Disagreements are the
   interesting output. **Do not overwrite the stored grade in this unit** — first show the owner where
   the runner and the human disagree, because on the first run the human is at least as likely right.

**Acceptance**
- **Must-pass:** a fully-provenanced, MIT, tokenised, dark/light, zero-dependency component grades A.
- **Must-fail:** a RED-licence component **cannot** reach A or B regardless of every other factor —
  licence is a gate, not a weighted term.
- **Must-pass:** a component with an unmeasurable factor grades on the remaining factors, and the
  factor is listed in `unmeasurable[]` rather than silently dropped.

---

## S7 — Dedupe, structurally AND visually · **P2's pixel work is already the instrument**

**Build**
1. **Structural:** reuse the frequency-aware cosine fingerprint over tag/class/CSS-property that
   replaced set-based Jaccard in the isolation gate. Do not invent a second one.
2. **Visual:** render the candidate and each near-structural match in the harness, screenshot both,
   and compare with `comparePNG` / `pixelDelta` from `scripts/design-check/pixel/`.
3. **The threshold is inverted from P2's.** `divergenceVerdict` asks *"are these different enough?"*
   with a deliberately **low** floor, because a controlled variant set is designed to be mostly
   identical. Dedupe asks the opposite question — *"are these the same thing?"* — and needs a **high**
   similarity bar. **Do not reuse P2's 0.005 fraction here.** Calibrate against known pairs and write
   the calibration down, the way P2's floor was calibrated against byte-identical panels (0.0000) and
   the real r1 panels (0.0809 / 0.1108 / 0.1581).
4. A duplicate is **reported, not auto-rejected.** Two components can look identical and differ in
   licence, provenance, or dependency weight — and the better-provenanced one should win, which is a
   judgement.

**Acceptance**
- **Must-pass:** the same component ingested twice is caught by **both** measures.
- **Must-fail:** two components that render identically but have different source (a re-implementation)
  are caught **visually** while passing structurally — that is the case structural-only dedupe misses,
  and the reason H1 asks for both.
- **Must-pass:** two genuinely different cards are not flagged.

---

## S8 — The NOTICES ledger

**Build**
1. `scripts/generation/notices.mjs` — assemble from catalog rows actually **used in a project**
   (`used_in_projects`), not from the whole catalog. A NOTICES file listing 116 components for a site
   that uses 9 is noise, and noise is how a real obligation gets missed.
2. Group by licence; GREEN with no attribution requirement may be summarised, AMBER is itemised with
   author + licence URL + source URL.
3. Emit to the project repo alongside the design tokens `emit-design-artifacts.mjs` already writes —
   same discipline: **commit on the project branch, never push, refuse on a dirty tree, `--dry-run`
   writes nothing.**

**Acceptance**
- **Must-pass:** a project using two AMBER components gets both itemised with author and licence URL.
- **Must-fail:** a component whose licence requires attribution but has **no `author`** blocks the
  NOTICES build with its id named — it must not emit a NOTICES file with a blank attribution line.
- **Must-pass:** `--dry-run` prints and writes nothing.

---

## S9 — Make `graduate.mjs` write

Today `draftGraduation()` returns `{writes: false, …}` and its 6 tests prove it **refuses**.

**Build**
1. Keep `draftGraduation` exactly as is — it becomes the **dry-run**, and the refusal stays tested.
2. Add `graduate({...}, {apply: true})`: run S3 → S4 → S5 → S6 → S7 in order, fail closed at each,
   then `POST /api/master-components` (ONE DOOR), after `POST /api/backup`.
3. Provenance for a graduated bespoke variant is knowable and must be recorded, not defaulted: author =
   the owner, `spdx_id` = the project's licence, `source_url` = the design round's preview URL,
   `retrieved_at` = the lock timestamp, plus the `design_decisions` row ids that produced it.
4. **Only a `locked` decision may graduate.** A `proposed` one has not been chosen.

**Acceptance**
- **Must-pass:** a locked, provenanced, GREEN, tokenised variant is created in the catalog and
  `GET` returns it — **count goes 116 → 117**.
- **Must-fail:** a `proposed` (unlocked) decision is refused.
- **Must-fail:** any one of the five gates failing leaves **nothing written** — assert the count is
  unchanged, not merely that an error was thrown.
- **Must-pass:** `--dry-run` reproduces today's `{writes:false}` output byte-for-byte.

---

## S10 — Wire into `stage-4-mini-pipeline.md`

**Build**
1. A new step after the per-item verifier: *"did this item produce something worth graduating?"*
2. **It asks, it never auto-graduates.** Graduation puts a component in front of every future project;
   that is the owner's call. Consistent with the no-anatomy-approval-gate ruling, which auto-derives
   *within* a round but never auto-decides *across* projects.
3. Update `references/graduation-protocol.md` and the register in the same commit.

**Acceptance**
- **Must-pass:** a locked bespoke variant surfaces a graduation prompt naming the candidate.
- **Must-fail:** nothing is written to `master_components` without an explicit confirm.

---

## Build order

**S1b → S2 → S3 → S4 → S6 → S5 → S7 → S8 → S9 → S10.**

S5 moves after S6 because S6 needs a tokenisation *signal*, which option (a) provides immediately,
while S5's transform question can stay open without blocking anything. S9 needs all of S3–S7 to exist,
because it is the thing that runs them in sequence.

## Q — open questions for the owner, to answer before S3 lands

1. **Retro-quarantine.** 30 of the 116 rows have no `license_note` and 76 have no `source_url`. When
   S3 goes live, do those rows get quarantined (correct, and instantly shrinks the usable catalog by up
   to a quarter), grandfathered with a `provenance_debt` flag, or fixed first? **My recommendation:
   grandfather with a visible flag, and let S6 dock their grade** — quarantining them punishes the
   catalog for a rule written after they arrived, while a flag makes the debt visible and payable.
2. **The 17 ungraded rows.** Grade them with the S6 runner, or leave `null` as an honest "never
   assessed"? **Recommendation: run the grader, store the result, and mark it `machine-graded`** so it
   is distinguishable from the 99 a human graded.
3. **S5 option (a) or (b).** Recommendation (a); see the unit.
