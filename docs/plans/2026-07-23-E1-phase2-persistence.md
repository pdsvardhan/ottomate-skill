# E1 — Phase 2: persistence (the ledger becomes the memory)

**Category:** E · Persistence · **Size:** M · **Where:** plugin (`ottomate`, `main`) + one safe live demo
**Follows:** Phase 1 (generation, done + demonstrated). **No DB change** — the table + API already support it.

Phase 1 *writes* decisions. Phase 2 makes them *survive and matter across sessions*: a new round is told
what was already rejected, a resumed session re-reads the ledger instead of re-deriving it, and a rebuild
cannot silently regress a locked decision.

---

## ✅ Outcome (2026-07-23) — built + demonstrated live

`scripts/generation/ledger-context.mjs` + `ledger-context.test.mjs` (9/9). No DB change.
- **rejected[] + frozen** (`rejectedByAxis`, `frozenByAxis`) → wired into `stage-2-generation.md` input #6.
- **reload-on-resume** (`resumeSummary`) → wired into SKILL.md session-start step 4.
- **snapshot differ** (`snapshotForLock`, `diffAgainstSnapshots`) → wired into stage-4 §4.6.5.
**Live demo (backup-first, throwaway `zzz-phase2-demo`, deleted after):** lock WITHOUT confirmed → 422;
lock WITH confirmed+snapshot → 200; reopen WITHOUT reason → 422; the stored snapshot round-tripped
through the API and the differ then **caught a 14→8 regression** and **passed** an unchanged rebuild.
**Honest limit:** the differ is source/value-level; a rendered-pixel regression check is the computed
follow-up.

---

## Verified live state (read 2026-07-23)

```
design_decisions   table live (migration 0010). Columns rejected(json), snapshot(text), status all exist.
GET  /api/projects/[slug]/design-decisions?status=&target_id=&axis=&profile_at_decision=  → rows carry
     rejected[] AND snapshot.
PATCH /api/design-decisions/[id]  accepts status, snapshot, confirmed, unlock_reason. LOCK needs
     confirmed:true (422 else, G3 rule 12); UNLOCK needs unlock_reason (422 else, G3 rule 13).
```
So all three Phase-2 pieces are **client-side logic + wiring** over an API that already exists.

## Specification — `scripts/generation/ledger-context.mjs`

Pure functions (unit-tested, no DB) + thin fetch wrappers (used at runtime).

### 1. `rejected[]` wiring
- `rejectedByAxis(decisions)` → `{ [axis]: [{value, why}] }` — every value turned down for a target,
  grouped by sub-decision. **This is the generation method's input #6** — a fresh round is fed it and
  **never re-offers a rejected value**.
- `frozenByAxis(decisions)` → `{ [axis]: value }` — the chosen value of every **locked** decision.
  Harvest-before-ask (doctrine 39): a locked sub-decision is a **frozen control**, not re-offered as a
  variant axis. The generation method must exclude these from the round's contested axes.

### 2. reload-on-resume
- `resumeSummary(decisions)` → `{ open:[…proposed/in-review], locked:[…], rejectedByAxis, frozenByAxis }`
  — the one-call picture a resumed session loads. Wired into the skill's load sequence so the ledger is
  read **automatically**, not "fetched explicitly" (the current register gap).
- `fetchDecisions(baseUrl, token, slug, params)` — GET wrapper.

### 3. snapshot differ (the regression gate)
- `snapshotForLock(decision, source?)` → a compact deterministic string
  `{ axis, chosen_value, source_sha256, at }` stored via PATCH when a decision locks. `source_sha256` is
  a hash of the chosen variant's markup for that region when available (catches source drift even when
  the value label is unchanged); omitted when there is no source.
- `lockDecision(baseUrl, token, id, snapshot)` — PATCH wrapper (`status:'locked', confirmed:true,
  snapshot`).
- `diffAgainstSnapshots(lockedDecisions, currentByAxis, currentSourceByAxis?)` → `[{axis, was, now, kind}]`
  — for every locked decision carrying a snapshot, compare the **current build's** value (and source
  hash) for that axis. A changed value or hash with no unlock = a **regression**, returned for the
  caller to block/flag. This is the "golden-file regression gate" (register: snapshot column existed,
  no differ — now it exists).

**Scope honesty:** the differ is **source/value-level** (catches a locked `corner-radius:14` silently
becoming `8`, or the region's markup changing). A **rendered-pixel** regression check is the computed
follow-up, same boundary as everywhere else — noted, not built.

## Wiring
- `stage-2-generation.md`: input #6 (`rejected[]`) + the frozen-controls exclusion now name
  `rejectedByAxis`/`frozenByAxis` as their source; step 7 runs `diffAgainstSnapshots` after a rebuild.
- The skill load sequence (SKILL.md / stage-0): document that session start calls `resumeSummary` — the
  reload-on-resume step.
- `stage-4-mini-pipeline.md`: after a rebuild, run the differ; a regression on a locked target blocks
  until unlocked (fail closed, consistent with the gate/checker).

## Procedure
1. Build `ledger-context.mjs` (pure fns + fetch wrappers).
2. `ledger-context.test.mjs`: for each pure fn, a must-catch + must-pass case (esp. the differ catching a
   regressed locked value and passing an unchanged one).
3. Wire the three references above.
4. **Live demo (safe):** `POST /api/backup`; throwaway `zzz-phase2-demo` project; POST a decision → lock
   it with a snapshot → GET back → run the differ against (a) an unchanged value (passes) and (b) a
   changed value (flags regression); delete the project. One door, backup-first, clean.
5. Update `SKILL-REGISTER.md` (systems: reload-on-resume, snapshot differ → their real state) same commit.
6. Commit + push; `git status` after.

## Acceptance
1. `ledger-context.test.mjs` green, with the differ proven to catch a regression AND pass no-change.
2. `rejectedByAxis` collects every rejected value across a target's rows, grouped by axis.
3. `resumeSummary` partitions open / locked / rejected / frozen from one GET.
4. **Live:** a locked decision stores a snapshot; changing its value on rebuild is flagged by the differ;
   round-tripped through the live API on a throwaway project; unlock needs a reason (422 proven).
5. Register: reload-on-resume and the snapshot differ move off ⬜/🟡 to their true state, each naming a test.

## Risks
| Risk | Mitigation |
|---|---|
| Overclaiming the differ | It is source/value-level only; the pixel-diff is explicitly a follow-up. Acceptance requires a real catch + a real pass |
| Live-DB damage | `POST /api/backup` first; throwaway `zzz-` project; one door; deleted after |
| Lock/unlock 422 semantics drift | The demo asserts the 422s live (lock needs confirmed, unlock needs reason) rather than assuming |
| Frozen-vs-rejected confusion | Two distinct helpers, two distinct meanings (locked = don't re-offer as an axis; rejected = don't re-offer this value); tested separately |
