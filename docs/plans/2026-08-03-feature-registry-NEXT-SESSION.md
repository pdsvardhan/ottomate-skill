# Feature-Registry build — NEXT-SESSION HANDOFF (2026-08-03)

**Start here.** This is the frictionless entry point to continue the feature-registry + whole-site
feature-verifier build. Everything below is real, on-disk, and verified this session.

## Read in this order
1. **This doc** — where we are + how to resume.
2. `docs/plans/2026-08-03-feature-registry-whole-site-verify-plan.md` — the 4-phase plan (Phase 1 now DONE).
3. Memory `ottomate-feature-registry-plan-2026-08-03.md` — full session detail + owner decisions.

## Where we are (one paragraph)
**Phase 1 is DONE and proven.** We built a reusable disposable-sandbox verifier for screenroom's
`flow-music-upload`, ran it on a throwaway instance (never touching the live library), and **closed the
loop into the tracker registry**. On its first real run it **caught a genuine, owner-confirmed defect** (a
`;`-separated duet lands crediting only the first artist). The reusable pattern is ready for **Phase 2**
(the registry-driven full-site runner + in-app dashboard).

## Owner decisions (locked, 2026-08-03)
- Isolation = **disposable sandbox instance** (done for screenroom).
- Run source = **registry-driven + in-app UI** (Phase 2).
- Ship gate = **hard everywhere**, activated per-project as Phase 4 backfills each (Phase 3).
- Multi-artist drop = **a real defect** (preserve all artists); verifier oracle stays strict.

## What's built (on disk, PERSISTENT)
Reusable harness — `skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music/`:
- `up.sh` / `down.sh` — idempotent bring-up / teardown of the disposable sandbox (screenroom + real
  disposable Navidrome + Jellyfin stub on a private net, scratch dirs, admin-by-default). `down.sh` cleans
  the Navidrome-owned scratch via a root container.
- `stub.mjs` — Jellyfin/Subsonic stub (dedup + refresh + `/__log`).
- `music-upload.verify.mjs` — the driver: drives the REAL routes `POST /api/music/{upload,scan,commit}`,
  asserts via **filesystem** (landed path + `ffprobe` tags) + **commit response** + **live Navidrome
  `search3`**. 19 cases (happy×5 langs + conservation + duplicate + non-audio + corrupt + no-tags→attach).
  On finish posts a report keyed to the flow + drives `flow.test_status` (skip with `FV_NO_POST=1`).
- `README.md` — topology, cases, findings, TODOs.

## Current registry state (PERSISTENT in the tracker :8110 — kept as real data)
- Flow `flow-music-upload`: **`test_status: failing`**, `linked_playwright_test` populated,
  `last_tested_date` set.
- Report **id 32**: `target_id: flow-music-upload`, **BLOCK**, 17-case matrix + the finding. (A later
  formalized run used `FV_NO_POST=1`, so 32 is the canonical result.)
- Feature `feat-music-upload`: **AC id 540** "All credited artists are preserved…" added (the defect as a
  requirement). Feature is at the **5-AC cap**.
- Link `flow-music-upload → feat-music-upload` created.
- Screenroom HEAD at run: `adce73e`.

## How to resume the sandbox (VAULT7A)
The box's `/tmp/sr-*` is ephemeral (cleaned this session). Re-stage from the plugin:
```bash
scp -r skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music pdsv@192.168.1.10:/tmp/sr-harness
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && sed -i 's/\r$//' *.sh *.mjs && chmod +x *.sh && ./up.sh"
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && FV_NO_POST=1 node music-upload.verify.mjs"   # verify only
ssh pdsv@192.168.1.10 "cd /tmp/sr-harness && ./down.sh"                                     # teardown
```
Env for a real (posting) run: `FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token)`,
`FV_COMMIT_SHA=$(git -C /mnt/storage/websites/screenroom rev-parse --short HEAD)`. **POST `/api/backup`
before any posting run.** screenroom repo = `/mnt/storage/websites/screenroom`; image `screenroom-app:latest`.

## Findings this session (both real)
1. **DEFECT (owner-confirmed):** `;`-multi-artist tag → only the first artist lands. Fix in **screenroom**
   `app/api/music/scan/route.ts` tag extraction (preserve all artists as repeated ARTIST tags). NOT a
   verifier change.
2. **Registry-mechanism gap:** `feature.test_status` ("derived AND of linked flows") is **documented but
   never implemented** — nothing computes it. The `/coverage` endpoint reads the *stored* value (it does
   show the failing FLOW correctly). Implementing the derivation is Phase-2 work.

## Remaining follow-ups (documented; none block Phase 2)
1. The multi-artist **defect fix** in screenroom (above).
2. **Implement `feature.test_status` derivation** (Phase-2 coverage/cascade).
3. **`feat.`-grouping** edge case — needs a multi-track album with a `feat.` (none local).
4. **Commit + register currency** (do these together, per the register's same-commit rule): stage the new
   `sandboxes/screenroom-music/**` files EXPLICITLY (not `git add -A`); update the SKILL-REGISTER
   feature-verifier row (or add a feature-registry row) noting Phase-1 proven + the harness path; `git pull
   --rebase` first. **Nothing is committed yet.**

## Then: Phase 2
Per the plan doc — the registry-driven `full-site` run mode (`planFullSite` enumerating tracker flows →
their linked matrices), the in-app "Verify site" button + API, and reviving `/coverage` from real reports.
The screenroom-music sandbox is the reusable template: write-heavy flows get a disposable instance; read-only
flows can share one.

## Environment quick-ref
VAULT7A `ssh pdsv@192.168.1.10` (key-only) · tracker :8110 · screenroom :8504 (repo `/mnt/storage/websites/screenroom`) ·
Navidrome :4533 (library `/mnt/storage/media/music`) · ONE DOOR (all DB via the API) · backup-before-writes ·
prune only SYNTHETIC rows (report 32 + flow-failing are REAL, keep them).
