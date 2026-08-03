#!/usr/bin/env bash
# Teardown the screenroom music-upload disposable sandbox (containers + network + scratch dirs).
set -uo pipefail
ROOT=${SR_SANDBOX_ROOT:-/tmp/sr-sandbox}
IMG=${SR_IMAGE:-screenroom-app:latest}
docker rm -f sr-sandbox sr-stub sr-navidrome 2>/dev/null || true
docker network rm sr-sandbox-net 2>/dev/null || true
# Navidrome writes its cache as its own uid, so a plain rm hits permission-denied. Clean the scratch via a
# throwaway ROOT container (reusing an image that's already present) before removing the dir.
docker run --rm --user 0:0 -v "$(dirname "$ROOT")":/t --entrypoint sh "$IMG" -c "rm -rf /t/$(basename "$ROOT")" 2>/dev/null || true
rm -rf "$ROOT" 2>/dev/null || true
echo "sandbox torn down + scratch removed: $ROOT"
