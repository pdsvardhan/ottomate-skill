# F1 — Phase 4: wiring (the design method becomes one profile-aware pipeline)

**Category:** F · Wiring · **Size:** L · **Where:** plugin (`ottomate`, `main`) + one round-2 live demo
**Owner rulings (this session):** graduation = **wiring now + a protocol/spec**, defer the full ingest
subsystem; **run a real round 2** that reads the ledger. **No DB change** in this unit.

Phases 1–3a built the parts (generate, persist, enforce). Phase 4 makes them one pipeline that respects
the owner's real workflow — *build on placeholder UI, do design later, never re-derive locked work.*

---

## ✅ Outcome (2026-07-23) — wiring built + demonstrated; graduation scoped honestly

Commit `90e7e9d`. Plugin-only, no DB change. `method-routing.mjs` 9/9 + `graduate.mjs` 6/6.
- **Fresh-context default** (`buildRoundInput`), **scope×entry routing** (`routeRungs`/`routeEntry`,
  `ui-mode:none` = default, no round), **Stage-3 profile gate** (`stage3DesignGate`: advise P1/P2, block
  P3) — wired into `stage-2-generation.md`, `stage-3-scaffolding.md`, and SKILL.md's 2→3 HARD gate +
  bedrock item 7. Docs: `stage-2-routing.md`.
- **Graduation** = `graduation-protocol.md` (H1-grounded) + `graduate.mjs` `draftGraduation()` which
  **never writes** (the catalog lacks spdx/author/attribution/retrieved_at/trademark/grade columns).
  The full ingest subsystem is the next unit — stated plainly, not claimed.

**Round-2 demo — the payoff, demonstrated not asserted.** Seeded a throwaway `zzz-phase4-demo` ledger
(corner-radius **locked** at 14; hover-motion rejected {scale,none}; accent-usage rejected {badge}),
built the packet from the **live** ledger via `buildRoundInput`, spawned a **fresh sub-agent** with only
that packet. Result, **mechanically verified**: corner-radius is NOT a contested param and is 14 in all
3 panels; no rejected value reappears (hover-motion ∉ {scale,none}, accent-usage ∉ {badge}). Gate +
checker PASS, DSD-isolated, published (`…/f287b602-…`) — three genuinely different, legible cards, a
notch better than round 1. Backup-first, throwaway deleted, ledger temp removed.

---

## Verified live state (read 2026-07-23)
```
SKILL.md            has "## Stage gates (HARD)" + "## Anti-gaslight bedrock" — item 4 has a home.
stage-3 refs        do NOT read design_decisions (grep clean) — the gap item 3 closes.
master_components   has license_note, source_url, ingestion_method — but NOT spdx_id/author/
                    attribution/retrieved_at/trademark_flag/grade. So full graduation needs a
                    migration; this unit ships the PROTOCOL + flags the gap, not the subsystem.
audience profiles   resolveFloor() (Phase 3a) already makes P1/P2/P3 executable — item 3 reuses it.
ledger-context.mjs  rejectedByAxis/frozenByAxis/resumeSummary (Phase 2) — item 1 consumes them.
```

## Specification

### 1. Fresh-context rounds as the default → `scripts/generation/method-routing.mjs` + method doc
- `buildRoundInput({ anatomy, archetype, contract, profile, direction, decisions })` → the self-contained
  input packet a fresh sub-agent gets: **contested axes = the archetype's sub-decisions MINUS the
  `frozenByAxis` (locked) axes**; `rejectedByAxis` per axis (never re-offer); the committed direction;
  the constraint contract; the profile. Pure, tested.
- `stage-2-generation.md`: state that **every round runs in a fresh `Agent` sub-agent** fed exactly this
  packet (the ledger is the memory, the chat is disposable — the owner's anti-degradation ruling), and
  give the spawn recipe. Phase 1 proved the pattern once; this makes it the default.

### 2. scope × entry routing → same module + `references/stage-2-routing.md`
Encodes the owner's session-2 ruling (see `docs/plans/2026-07-23-task2-remaining-work.md`).
- `routeRungs(scope)` → which ladder rungs run: `component`→[component, micro]; `cluster`→[cluster,
  component]; `page`→[page, cluster]; `site`→[direction, mechanic, …] (the full ladder). **The full
  A→A½→B→C never fires for a single button.**
- `routeEntry(entry)` → behaviour: `stage-2` (cold start, rare) = full from rung 0; `stage-4-item` =
  **inherit context, don't re-interview** (direction/tokens are frozen controls); `deferred-overhaul` =
  run each deferred target's scope rungs; **`ui-mode:none` = skip design entirely (placeholder UI,
  backend-first) — the owner's DEFAULT.** Pure, tested.
- Cheap-to-defer (per-component look, page style, polish) vs expensive-to-defer (foundation tokens, core
  mechanic, theme-from-content wiring) recorded so deferral doesn't defer the load-bearing decisions.

### 3. Stage-3 gate follows the profile → same module + wire into stage-3 refs
- `stage3DesignGate({ profile, targetsBuilt, lockedDecisions })` → `{ verdict: 'pass'|'advise'|'block',
  missing: [...] }`. A user-facing target built without a locked design decision is: **advisory at
  P1/P2** (build on placeholders, do UI later — the owner's default), **blocking at P3** (public ships
  no un-designed UI). Reuses the profile floor. Pure, tested.
- `stage-3-scaffolding.md` / `stage-3-codegen.md`: read the locked design spec from the ledger and run
  this gate; wire the verdict into the 2→3 HARD gate per profile.

### 4. Register the design gates in the HARD list → SKILL.md
Add to "Stage gates (HARD)" / bedrock: the **isolation gate** (G1), the **constraint checker** (owner
contract + feasibility, fail closed), and the **design-regression gate** (Phase 2 snapshot differ) — so
they are first-class stop-conditions, not just method prose. The **2→3 gate** gains the profile-aware
design-lock condition from item 3.

### 5. Graduation PROTOCOL (spec only) → `references/graduation-protocol.md`
H1-grounded: provenance at ingest (source_url ✓, ingestion_method ✓ exist; **spdx_id, author,
attribution, retrieved_at, trademark_flag, grade MISSING — a migration is the follow-up**);
GREEN/AMBER/RED licence tiers; tokenise-on-ingest (a baked-in `#fff` is a downgrade); A–F grade, only
A/B ship; structural+visual dedupe; NOTICES assembly. **A `graduate()` hook stub** that captures a
chosen locked variant + its provenance into a draft record, explicitly NOT writing to
`master_components` yet (blocked on the migration). The full subsystem is the next unit.

### The round-2 demo (fresh-context + rejected[] end-to-end)
Backup-first, throwaway `zzz-phase4-demo`. Seed the ledger with round-1-style decisions (some
`rejected[]`, one `locked`/frozen). `buildRoundInput` from that ledger → spawn a **fresh sub-agent** fed
only the packet → it produces a new media-card set. **Verify: (a) no rejected value reappears, (b) the
frozen axis is absent from the contested set.** Run the harness (gate+checker+DSD), publish, eyeball.
Clean up.

## Procedure
1. `method-routing.mjs` (buildRoundInput, routeRungs, routeEntry, stage3DesignGate) + `method-routing.test.mjs`.
2. Docs: `stage-2-routing.md`, `graduation-protocol.md`; update `stage-2-generation.md` (fresh-context
   default + spawn recipe); wire stage-3 refs + SKILL.md HARD list.
3. Round-2 demo (backup-first, throwaway, cleaned up); publish + eyeball; confirm no-rejected/no-frozen.
4. Update `SKILL-REGISTER.md` (§2 systems, §5 phase 4) same commit(s); `git status` after.

## Acceptance
1. `method-routing.test.mjs` green: `component` scope does NOT run the full ladder; `ui-mode:none` skips
   design; `buildRoundInput` excludes frozen axes and carries rejected values; `stage3DesignGate` returns
   advise at P1/P2 and block at P3 for an un-designed public target.
2. Round 2 runs in a fresh sub-agent from the ledger and its set **re-offers no rejected value and omits
   the frozen axis** — verified against the harness output, not asserted.
3. SKILL.md HARD list names the three design gates + the profile-aware 2→3 design-lock.
4. `graduation-protocol.md` exists, H1-grounded, and **honestly states the migration gap** — the hook
   does NOT write to `master_components`.
5. Register: Phase 4 items → their true state; the graduation subsystem flagged as the next unit, not done.

## Risks
| Risk | Mitigation |
|---|---|
| Overclaiming graduation | It is a protocol + a non-writing hook; the register + doc state the migration gap plainly |
| Routing logic that quietly changes existing flows | New pure functions + docs; no existing step is rewired except the additive stage-3 design-gate read. Tested |
| Round-2 "avoids rejected" is asserted not shown | Acceptance #2 checks the actual harness output's axis_values against the seeded rejected/frozen set |
| Live-DB touch for the demo | Backup-first; throwaway `zzz-` project; one door; deleted after |
| Scope creep into Phase 3b (rubric scorer / computed check) | Explicitly OUT; the fresh round still filters by model judgment |
