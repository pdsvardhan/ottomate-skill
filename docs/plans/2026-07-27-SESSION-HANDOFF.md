# SESSION HANDOFF — 2026-07-27. Next session starts here.

**Supersedes `2026-07-23-SESSION-HANDOFF.md` entirely.**
Read this, then `SKILL-REGISTER.md`. Nothing else is required to start.
**Do NOT bulk-read `docs/research/`** — the sweep is complete and distilled into the doctrine.

## Read order

| # | File | Why |
|---|---|---|
| 1 | This doc | What happened, what is next, what the owner has ruled |
| 2 | `../../SKILL-REGISTER.md` | What exists and what is **actually** enforced. `Enforced?` is a field, not a claim |
| 3 | `2026-07-27-PRE-STAGE4-PLANS.md` | **The work queue.** P1–P5, each with acceptance |
| 4 | `2026-07-27-TASK2-COMPLETION-PLAN.md` | The four-stage shape and the §12 acceptance bar |

## Where everything is

| | |
|---|---|
| **Plugin** | `~/.claude/plugins/ottomate` · `main` · clean, 0 unpushed. All Task-2 work lives here |
| **App** | `/opt/homeserver/ottomate` via `ssh pdsv@192.168.1.10` · branch `iter-65-2026-07-13` · clean |
| **Design surface** | `https://ottomate.vault7a.xyz/projects/<slug>/design/<target>` — **the Claude-Artifact path is retired** |
| **Live rounds** | Screenroom poster card, r1 (weight+density) and r2 (colour+motion), decisions 18–27, all `in-review` |
| **Suites** | `node --test` — 150 generation · 36 gate · 81 design-check · 16 harness. One known failure on Windows: `computed-checks.browser.test.mjs` needs Playwright, which lives only on VAULT7A |

## Status in one paragraph

**Stages 1 (usable) and 2 (trustworthy) are complete. Stage 3 is complete except a rule tail.** A
round now runs as **one command** — gates → build → isolation gate → source policy → constraint
checker → computed pass → publish — failing closed at every step. Picks are made in the app and become
**real code**: a tokens file plus a spec, committed on the project's branch, never pushed. **62 of 79
round-scope rules are enforced**, each naming a test with a must-fail *and* a must-pass case; 17
remain pending and are reported as *skipped*, never as passing. Two Screenroom rounds are live on real
Radarr poster art, correctly composed at 5 axes each. **What is NOT done: the owner has locked
nothing**, so style priors on real data and the real-repo emit are proven only on a throwaway project;
the computed divergence metric under-reads and needs the pixel work; and Stage 4 (graduation) is
untouched.

## Owner rulings — settled, do not re-litigate

1. Design surface = **the app**, not artifacts. 2. **All 90** rules were the target; after honest
reclassification the round-checker denominator is **79**. 3. Order: usable → trustworthy → complete.
4. **Graduation is last.** 5. Picks become a **real tokens file + a small spec**, committed, never
pushed. 6. Worklist = a **query** over `iteration_items`. 7. **No anatomy-approval gate** — derive
silently, correct in-flight. 8. "Interactive" means **CSS-interactive** (spec §11b). 9. **Reclassify**
app/catalog rules rather than pretend a panel checker can see them. 10. **Hand-roll pixel comparison**;
the plugin stays zero-dependency. 11. **Fresh sub-agent per round.** 12. **No `data-oid`** in
Screenroom — `target_id` is a label, and the "one instrument, three consumers" claim is **withdrawn**.

## Do this next

**`2026-07-27-PRE-STAGE4-PLANS.md` is the queue.** P1 (14 panel rules) · P2 (pixel comparison — the
highest-value item, it fixes the divergence defect) · P3 (defects our own tooling found) · P4 (practise
the fresh-sub-agent round). P5 is deferred on purpose. Then Stage 4.

## Blocked on the owner

**One lock.** Judging the live rounds and locking anything makes style priors real and triggers the
first genuine tokens file in Screenroom's repo — shown as a `--dry-run` first. Nothing else waits on it.

## Gotchas — do not rediscover these

- **`requireBearer` is in `lib/auth.ts`**, not `lib/api.ts`; `readAuthBody` **400s on an empty body**.
- **ESM resolves bare specifiers from the FILE's location**, not `process.cwd()` — hence `OTTO_PW_ROOT`.
- **`iteration_items` has NO timestamp columns.** Recency comes from the autoincrement id.
- **`POST /api/projects` rejects `ideating`** — the enum is `building|shipped|paused|archived`.
- **`source_policy` and `colour_budget` are CONTRACT KEYS, not rules.** Editing `rules[]` for them
  silently matches nothing; the count is what catches it.
- **The DETECTORS map takes `{ scope, fn }`**, not a bare function.
- Writing JS through a shell heredoc mangles `\n` inside string literals. Write the file, then insert.
- **Editing `design-rules.json` with `JSON.stringify` reflows it** — that is now accepted, but expect
  a large diff.
- The plugin has **no `package.json` by design**. Keep it that way.

## The discipline that caught real bugs today — keep it

**Demonstrate, don't assert.** Today that meant: reproducing the gate hole with three byte-identical
panels *before* fixing it; running the emitter as a dry-run against Screenroom's real repo, which
revealed `design/` already holds 159 files; and running every new detector against our own panels,
where `floor-reduced-motion` promptly failed our own work. A detector that never fires on real markup
is suspicious, not reassuring.

**Never lower a threshold to make something pass.** The divergence metric under-reads; it is logged as
a defect with a diagnosis, and the floor was left where it is.

**A rule marked `pending` while working is as wrong as one marked `enforced` while broken.** Two rules
were found in that state today.
