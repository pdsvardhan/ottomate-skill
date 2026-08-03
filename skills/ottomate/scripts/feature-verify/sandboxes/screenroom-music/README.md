# screenroom music-upload — disposable-sandbox feature verifier

The first **complex-flow** proof for the feature-registry build (Phase 1). Verifies screenroom's
`flow-music-upload` end-to-end on a **throwaway** instance — the live library is never touched.

## Why a sandbox (and why it's light)
screenroom has **no application database**. A completed upload persists only via (a) the audio file's own
tags (`metaflac`), (b) its path under `/music/<lang>/<artist>/<album>/`, and (c) Navidrome/Jellyfin
rescans. So the sandbox needs **no Postgres** — just scratch `/music` + `/incoming` dirs and stub/real
services. Auth defaults to **admin** on a direct port hit (no Authentik header, `MEDIA_AUTH_STRICT` unset),
so there's no SSO to defeat.

## Topology (`up.sh`)
- **sr-sandbox** — the existing `screenroom-app:latest` image, scratch `/music`+`/incoming`, `:8599`.
- **sr-navidrome** — a **real** disposable Navidrome (`deluan/navidrome`, auto-admin) indexing the scratch
  `/music` — the un-fakeable "visible in Navidrome after rescan" channel (`:4610`, admin/verifyadmin).
- **sr-stub** — a tiny node stub for Jellyfin dedup (`/Search/Hints` empty) + `/Library/Refresh` +
  Subsonic ping; logs every call at `/__log` (`:4599`).
All on a private `sr-sandbox-net`.

## Run (on VAULT7A)
```bash
cd <this dir>
./up.sh
FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token) FV_COMMIT_SHA=$(git -C /mnt/storage/websites/screenroom rev-parse --short HEAD) \
  node music-upload.verify.mjs        # add FV_NO_POST=1 to skip writing to the tracker
./down.sh                              # teardown + remove scratch
```
The driver drives the REAL routes `POST /api/music/{upload,scan,commit}` (multipart) and asserts via
second channels the coder can't fake: the **filesystem** (landed path + `ffprobe` tags), the **commit
response**, and **live Navidrome `search3`**. Fail-closed. On finish it posts a report keyed to
`target_id:flow-music-upload` and drives `flow.test_status` (unless `FV_NO_POST=1`).

## The matrix (23 cases)
- **Happy path (L1/L2/L3 + correctness)** — 5 blessed songs across languages (Eng/Telugu/Hindi/Tamil/Eng)
  upload → scan → commit → land at the right path with correct tags → **found via live Navidrome**;
  conservation 5→5. (14 cases: upload · scan · commit · conservation · correctness×5 · navidrome-visible×5.)
- **Duplicate** (L3) — re-commit the same set → no-clobber guard, library size unchanged.
- **Non-audio** (L1) — a `.txt` is rejected at upload (415).
- **Corrupt FLAC** (L1 fail-closed) — the integrity gate rejects it; nothing lands.
- **No-tags → attach** (L1/L2) — a tag-stripped file scans as low-confidence; user-chosen metadata
  persists on commit.
- **feat.-grouping** (edge #126, 4 cases: L3/L2/correctness×2) — a real 7-track album (**Son of
  Satyamurthy**, `ALBUMARTIST=Devi Sri Prasad`, seven *different* per-track artists incl. a `;`-multi one)
  → all seven land in **ONE** folder `telugu/Devi Sri Prasad/Son of Satyamurthy`, album-artist constant,
  and the `;`-multi-artist track (`Sagar;M.M. Manasi`) keeps **both** singers. Exercises the multi-artist
  fix + album-artist grouping together.

## Findings (2026-08-03)
- **DEFECT (owner-confirmed) — FIXED + DEPLOYED.** A track with multiple `ARTIST` Vorbis comments (e.g.
  `S.P. Balasubrahmanyam` + `S. Janaki` on Indhuvadana) landed crediting **only the first**: scan read
  `music-metadata`'s `common.artist` (the FIRST value) and ignored the `common.artists` array. First run
  → **BLOCK** (report 32), `flow.test_status → failing`. **Fix (screenroom `728f207`):** scan captures
  `common.artists` (splits `;` too), commit carries the list, `writeTags` writes **repeated ARTIST tags**.
  Re-verified **APPROVE 23/23** on the deployed image → **report 33**, `flow.test_status → passing`.
- **Registry gap — FIXED.** `feature.test_status` ("derived AND of linked flows") was documented but never
  computed. Now derived on every flow-test write + a `POST /api/coverage/recompute` backfill (tracker
  `37b3fc5`); `feat-music-upload` rolls up to `passing`.

## TODO / follow-ups
- Fold the sandbox lifecycle + driver into the main harness orchestrator so Phase-2's full-site runner
  (`planFullSite` in `harness/orchestrate.mjs`) reuses it (currently invoked directly).
