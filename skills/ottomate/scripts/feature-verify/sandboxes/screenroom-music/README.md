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

## The matrix (19 cases)
- **Happy path (L1/L2/L3 + correctness)** — 5 blessed songs across languages (Eng/Telugu/Hindi/Tamil/Eng)
  upload → scan → commit → land at the right path with correct tags → **found via live Navidrome**;
  conservation 5→5. (14 cases: upload · scan · commit · conservation · correctness×5 · navidrome-visible×5.)
- **Duplicate** (L3) — re-commit the same set → no-clobber guard, library size unchanged.
- **Non-audio** (L1) — a `.txt` is rejected at upload (415).
- **Corrupt FLAC** (L1 fail-closed) — the integrity gate rejects it; nothing lands.
- **No-tags → attach** (L1/L2) — a tag-stripped file scans as low-confidence; user-chosen metadata
  persists on commit.

## Findings from the first real run (2026-08-03)
- **DEFECT (owner-confirmed):** a `;`-separated multi-artist tag (`S.P. Balasubrahmanyam;S. Janaki`) lands
  crediting **only the first artist** — the 2nd credited singer is dropped (scan's `ScanFile.artist` is
  single-valued). Verdict **BLOCK**, report keyed to the flow, `flow.test_status → failing`. Fix belongs in
  screenroom (`app/api/music/scan/route.ts` tag extraction → preserve all artists as standard repeated
  ARTIST tags).
- **Registry gap:** `feature.test_status` ("derived AND of linked flows") is **documented but not
  implemented** — nothing computes it; the coverage endpoint reads the stored value. Feature roll-up needs
  the derivation coded (Phase-2 coverage-mechanism work).

## TODO / follow-ups
- **`feat.`-grouping** edge case (edge #126): needs a multi-track album where track-artists vary but the
  album-artist is constant, to assert they land in ONE folder. Only a single `feat.` track is present
  locally; add when a suitable 2+-track album exists.
- Fold the sandbox lifecycle + driver into the main harness orchestrator so Phase-2's full-site runner
  reuses it (currently invoked directly).
