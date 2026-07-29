# NEXT-SESSION PROMPT — cointrail design-method TEST, run 2 (the paste-in below)

Paste the block under "► PROMPT" into a fresh session. It re-tests the REBUILT method (Phase 0–4) on the
same target as run 1, so the two runs are comparable. The session both PERFORMS the real redesign and
SILENTLY RECORDS how the method performs. It stops at the published live variants for the owner's feedback.

---

## ► PROMPT

> You are running the **cointrail design-method TEST, run 2**. You have TWO roles at once:
> 1. **Designer** — actually perform the redesign using the Ottomate skill, for real (not a simulation).
> 2. **Silent recorder + critical observer** — you are TESTING the rebuilt method, not just using it. Log
>    every step, every mutation, every file you create, and your way of working; and give a critical,
>    evidence-backed verdict on how the method performs at each step. Stay in the designer's flow — observe
>    silently, record thoroughly.
>
> **The trigger (act on this exactly as a normal owner request):**
> > "In **cointrail**, on the **card-detail page** (a card's detail view), the **spending-analysis section** —
> > the transaction-history, top-merchants and category-breakdown panels — still looks basic and flat.
> > Redesign these panels visually so they're bold, interactive and animated, the way I like."
>
> **Read first (so you know what the rebuild changed, and how to judge it):**
> - `docs/plans/2026-07-29-ottomate-design-system-rebuild.md` (the SPEC + §7 governing rule)
> - `docs/plans/2026-07-29-phase-0-completion.md`, `…-phase-1-plan.md`, `…-phase-2-completion.md`,
>   `…-phase-4-completion.md` (what was BUILT: semantic tokens + contrast gate, live grid + banner,
>   decompose-and-ask, dictionaries, and the R1–R8 remediations)
> - `docs/test-runs/2026-07-28-cointrail-run1.md` (run 1 + findings F-1…F-17 — the bar you are re-checking)
> - `docs/audits/2026-07-29-design-method-test-findings.md` (which findings were fixed and how)
> - `skills/ottomate/references/taste-profile.md` (owner taste = bold/3D/motion; anti-slop ADVISORY) and
>   `references/data-role-stamping.md` (cointrail's 3 panels are now stamped — decompose reads them)
> - The Ottomate skill itself (`/ottomate cointrail`) and `references/stage-2-generation.md`.
>
> **Run the rebuilt pipeline end-to-end** (see `scripts/generation/round-pipeline.mjs` `planRound` for the
> ordered chain — run the mechanical steps yourself, pause at the forks):
> 1. **Decompose-and-ask** — decompose `cointrail.spending-analysis` from its `data-role` stamps
>    (`decompose.mjs`; it should enumerate transaction-history / top-merchants / category-breakdown) and
>    **ASK the owner** the scope + granularity (whole section / one panel / one property) — never assume it.
> 2. **Context gate** — cointrail is at baseline (`design_ledger` null), so the gate fires; capture
>    audience / use-cases / tone / primary-screen (known answers below) + profile P1, persist via the API.
> 3. **Compose** — `composeRounds` (one-question-per-round by default; a wider "packed" round is an explicit
>    owner choice).
> 4. **Generate** — spawn a FRESH sub-agent that authors **interactive, self-contained, token-only HTML per
>    variant** (the `theming/blocks/spending-variant.html` pattern: real motion/3D/count-up, `var(--…)` only,
>    `prefers-reduced-motion` aware). Run `prepare-variants.mjs` to inline + lint each (fail-closed).
> 5. **Gates** — per-theme contrast gate + ban-raw-values + catalog-consult proof (fail-closed).
> 6. **Publish** — `publish-round.mjs` (pass `variant_files` + the `banner` inputs so it AUTO-emits the live
>    grid + legibility banner into round.json). The deployed RoundPicker renders the live per-variant grid.
>
> **Record as you go — this is the point of the run:**
> - Keep a running **`docs/test-runs/2026-07-30-cointrail-run2.md`** with: a **mutation log** (every DB /
>   file / preview write, each with its exact undo command, per the run-1 manifest style); every **decision +
>   why**; the **files you create** and your **way of working**; and a **§3-style critical observation** per
>   step (verdict PASS / WEAK / FAIL + specific evidence) on how the REBUILT method performed — explicitly
>   compare against the run-1 finding it was meant to fix. Track **performance / efficiency** at each step
>   (round-trips, sub-agent passes, gate blocks).
> - **Update any docs that are now stale** as you touch them (method docs, inventory, SKILL-REGISTER) — note
>   each doc edit in the log.
>
> **Constraints (always):** ONE DOOR — all DB via the API. **Backup-first** (POST /api/backup) before any DB
> write. **Never touch Track B** (`scripts/feature-verify/**`, `/tmp/fv`, `feature_verification_reports`).
> Emit is **not reached** this run (you stop before pick/lock/emit). cointrail is at **baseline** (decisions
> count=0, ledger null) and **stamped**. This run creates a NEW parked round (proposed rows + preview) —
> log it for reverse-rollback, and **roll back only on the code word "skill test done."**
>
> **STOP when the live variants are published** (the owner can open the grid + banner at
> `https://ottomate.vault7a.xyz/projects/cointrail/design/cointrail.spending-analysis`). Hand off: tell the
> owner the round is live, summarise your step-by-step observations, and WAIT. Do **not** pick/lock/emit.
>
> **Then the cycle:** the owner reviews the ENTIRE flow + the variants and gives feedback. Together, **write
> ALL the issues again** — a fresh, numbered findings list (run-2 F-1…F-N, same rigour as run 1), append it
> to the run-2 doc. Those findings feed the next fix pass, and the process repeats (design → observe →
> feedback → findings → fix → re-test).
>
> **Known context (answer the gate fast — from run 1):** audience = solo owner, P1 (personal finance tool
> over the owner's own statements). use-cases = review one card's spend for a period · scan the transaction
> history · understand spend by category and by merchant. tone = keep cointrail's light-glass-finance
> foundation (white cards on #f8f9fc, Outfit + JetBrains Mono, emerald/blue/amber/rose, soft shadows, the
> glass/perspective/animate utilities) but push spending-analysis to **maximum expressiveness — 3D + rich
> micro-interactions + animation, intensity 5/5**. primary screen = desktop web first, Android second.

---

## Notes for the owner (not part of the paste)
- Target + stop-point chosen with you: whole spending-analysis **section** (tests decompose-and-ask hardest,
  matches run 1); **stop after publish** (you review, then we write run-2 findings and repeat).
- The rebuilt method should now: decompose the 3 stamped panels + ASK scope · fire the contrast gate (not the
  colour budget) · emit interactive per-variant HTML into a live full-width grid · lead with the legibility
  banner · one question per round. Watch whether each actually holds — that is what run 2 measures.
- Session-title-setting is a known harness limit (not the method); ignore it.
