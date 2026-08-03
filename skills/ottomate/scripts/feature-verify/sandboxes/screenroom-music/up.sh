#!/usr/bin/env bash
# Disposable sandbox for verifying screenroom's music-upload flow (Phase 1, feature-registry build).
# Stands up a THROWAWAY screenroom + a REAL disposable Navidrome + a Jellyfin/Subsonic stub on a private
# docker network, writing to SCRATCH dirs — it NEVER touches the live /mnt/storage/media/music library.
# screenroom has no app DB, so no Postgres is needed; state is files + external-service rescans.
# Auth: no Authentik header on the direct port ⇒ admin (MEDIA_AUTH_STRICT unset), so no SSO to defeat.
# Run on VAULT7A. Idempotent (recreates). Teardown: ./down.sh
set -euo pipefail
ROOT=${SR_SANDBOX_ROOT:-/tmp/sr-sandbox}
IMG=${SR_IMAGE:-screenroom-app:latest}
ND_IMG=${ND_IMAGE:-deluan/navidrome:latest}
NET=sr-sandbox-net
NDPASS=${ND_ADMIN_PASS:-verifyadmin}
HERE="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT"/{music,incoming,data,corpus,navidrome-data}
docker network create "$NET" 2>/dev/null || true
docker rm -f sr-sandbox sr-stub sr-navidrome 2>/dev/null || true

# Jellyfin/Subsonic stub (reuses the screenroom image purely for its node runtime).
docker run -d --name sr-stub --network "$NET" -p 127.0.0.1:4599:4599 \
  -v "$HERE/stub.mjs":/stub.mjs:ro --entrypoint node "$IMG" /stub.mjs >/dev/null

# Real disposable Navidrome, indexing the scratch /music (the un-fakeable "visible in Navidrome" channel).
docker run -d --name sr-navidrome --network "$NET" -p 127.0.0.1:4610:4533 \
  -v "$ROOT/music":/music:ro -v "$ROOT/navidrome-data":/data \
  -e ND_MUSICFOLDER=/music -e ND_DATAFOLDER=/data -e ND_LOGLEVEL=error \
  -e ND_DEVAUTOCREATEADMINPASSWORD="$NDPASS" -e ND_SCANSCHEDULE=0 "$ND_IMG" >/dev/null

# Disposable screenroom → scratch dirs, real Navidrome, Jellyfin stub, admin-by-default.
docker run -d --name sr-sandbox --network "$NET" -p 127.0.0.1:8599:3000 --user 1000:1000 \
  -e NODE_ENV=production \
  -e NAVIDROME_URL=http://sr-navidrome:4533 -e NAVIDROME_USER=admin -e NAVIDROME_PASS="$NDPASS" \
  -e JELLYFIN_URL=http://sr-stub:4599 -e JELLYFIN_API_KEY=stub \
  -e MEDIA_ADMIN_GROUP=media-admins -e MEDIA_ADMIN_USER=vardhan \
  -v "$ROOT/music":/music -v "$ROOT/incoming":/incoming -v "$ROOT/data":/app/.data \
  "$IMG" >/dev/null

for i in $(seq 1 30); do [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8599/ 2>/dev/null || echo 000)" = 200 ] && break; sleep 1; done
echo "sandbox up:"
echo "  screenroom  http://127.0.0.1:8599  (admin-by-default)"
echo "  navidrome   http://127.0.0.1:4610  (admin / $NDPASS)"
echo "  stub        http://127.0.0.1:4599  (/__log for rescan calls)"
echo "  scratch     $ROOT   (music/ incoming/ corpus/)"
