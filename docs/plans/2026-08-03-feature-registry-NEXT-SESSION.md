# Feature-Registry build — NEXT-SESSION HANDOFF (updated 2026-08-03, Phase 2 complete)

**Start here.** Frictionless entry point to continue the feature-registry + whole-site feature-verifier
build. **Phases 1 + 2 are DONE, DEPLOYED, and VERIFIED. Next up: Phase 3 (the hard ship-gate) — a complete,
executable plan already exists.** Everything below is real, on-disk, and verified.

## Read in this order
1. **This doc** — where we are + how to resume.
2. **`docs/plans/2026-08-03-feature-registry-PHASE3-plan.md`** — the complete Phase-3 build plan (execute it).
3. `docs/plans/2026-08-03-feature-registry-whole-site-verify-plan.md` — the original 4-phase plan (Phases 1+2 done).
4. Memory `ottomate-feature-registry-plan-2026-08-03.md` — full session detail + owner decisions.

## Where we are (one paragraph)
**Phase 1 (prove one flow end-to-end on a disposable sandbox) and Phase 2 (roll-up + full-site runner +
in-app Verify-site + coverage revival) are complete.** The music-upload multi-artist defect was fixed and
**deployed live**; `feature.test_status` now derives from linked flows; `/coverage` shows real data + gaps;
`planFullSite` plans the whole site; and the **"Verify site" queue works end-to-end** (enqueue → host runner
drains → runs the sandbox → posts results → status done). **Phase 3** makes it impossible to ship an
unregistered/unverified user-facing feature — and ~80% of that machinery (the anti-gaslight rule engine + the
stage-transition gate + the commit-specific report signal) **already exists**, so Phase 3 is EXTEND + WIRE +
PROVE. **Nothing is left half-done; the tree is clean.**

## What shipped this session (all committed + pushed + deployed)
| Item | Result | Commit |
|---|---|---|
| BP-0 multi-artist fix | live `screenroom:latest`; report **33** APPROVE 23/23; `flow → passing` | screenroom `728f207` |
| BP-1 feat-grouping | real *Son of Satyamurthy* 7→1 folder, `;`-track keeps both | plugin `22a5f9e` |
| BP-2 `feature.test_status` roll-up | cascade + `POST /api/coverage/recompute`; **65** features; `feat-music-upload → passing` | tracker `37b3fc5` |
| BP-3 `planFullSite` | registry-driven planner; gaps ≠ silent pass; **12/12** tests | plugin `22a5f9e` |
| BP-5 `/coverage` revived | real flow/feature status + **gaps** + last-verdict | tracker `c0303b6` |
| BP-4 Verify-site queue+button | **demoed:** 118 flows / 115 gaps / music-upload APPROVE 23/23 → report **34** → `done` | tracker `1ad4fa5`, plugin `9149d8d` |
| Register currency | feature-registry row marked Phase-2-complete | plugin `7655ab2` |

## Current registry state (PERSISTENT — real data, do NOT prune)
- Flow `flow-music-upload`: **`test_status: passing`**, `linked_playwright_test` = the sandbox path, `last_tested` set.
- Feature `feat-music-upload`: **`test_status: passing`** (rolled up), AC `id 540` present.
- Reports: **32 BLOCK** (historical, the caught defect), **33 APPROVE** (`728f207`), **34 APPROVE** (Verify-site run). All KEEP.
- A demo verify-run file `data/verify-queue/vr-1785776069283-*.json` (status `done`) — harmless, keep or delete.

## What Phase 3 is (and why it's small) — full plan in the PHASE3 doc
Make "register + verify or you can't ship" **hard, per-project (ramp)**. It EXTENDS what exists:
- `GET /api/anti-gaslight/violations` is a live SQLite rule engine (R1–R5) — **add R6 `unverified-ship`
  + R7 `unreconciled-claim`** in the same pattern.
- The stage-transition gate already *"refuses on any HARD violation"* — the new rules just plug in.
- `feature_verification_reports.commit_sha` + `target_id` give the **commit-specific** signal — add a small
  read-only `GET /api/verify/gate?project_slug&commit_sha` the deploy step consults.
- Add a `projects.verify_gate ∈ {off,warn,block}` column (migration **`0012`**, idx 7) for the ramp; arm
  **screenroom = 'block'** first. **Prove the gate BLOCKS** (P3-E), then set the register `Enforced? = yes`.

Execute **P3-0 → P3-E** from the PHASE3 plan (each item has files · acceptance · a must-FAIL test).

## How to resume the sandbox (if a Phase-3 test needs a live verify run)
The box's `/tmp/sr-harness` is ephemeral. Re-stage from the plugin:
```bash
ssh pdsv@192.168.1.10 "rm -rf /tmp/sr-harness"
scp -r skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music pdsv@192.168.1.10:/tmp/sr-harness
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && sed -i 's/\r$//' *.sh *.mjs && chmod +x *.sh && SR_IMAGE=screenroom-app:latest ./up.sh"
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && FV_NO_POST=1 node music-upload.verify.mjs"   # verify only (no registry write)
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && ./down.sh"                                    # teardown
```
For the whole-site queue runner: `scp -r skills/ottomate/scripts/feature-verify/harness
pdsv@192.168.1.10:/tmp/fv-harness` then `FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token) node
/tmp/fv-harness/queue-runner.mjs`. **`POST /api/backup` before any run that posts.**

## Environment quick-ref (VAULT7A)
`ssh pdsv@192.168.1.10` (key-only) · **tracker** `ottomate` :8110 (source `/opt/homeserver/ottomate` =
`/mnt/storage/websites/ottomate` bind-mount, branch `ws1.1-live-preview`, image `ottomate-ottomate`, DB
`./data/ottomate.db`, deploy = backup → `docker compose build ottomate && up -d`) · **screenroom** :8504
(repo `/mnt/storage/websites/screenroom` has OWNER WIP → build `:latest` from a `git worktree`, `up -d
--no-build`) · Navidrome :4533 (library `/mnt/storage/media/music`). **ONE DOOR** (all DB via the API) ·
**backup-before-writes** · **commit only my files** · prune ONLY synthetic rows · git pull --rebase / stage
explicitly before any push · **heredoc-with-`()` over ssh breaks** (avoid parens in commit messages).

## Doc-debt to repay in Phase 3 (Workstream D, small)
- Nightly cron: docs say **03:30**, reality is **`30 2`** (#289) → fix `stage-3-feature-verifier.md`.
- Document the now-built wiring: `linked_playwright_test` writer · reports keyed to `target_id=flow` ·
  driven `test_status` · the BP-2 roll-up · BP-5 coverage · BP-4 verify queue.
