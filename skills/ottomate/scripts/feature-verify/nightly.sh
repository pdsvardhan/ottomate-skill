#!/usr/bin/env bash
# P3-C4: the VAULT7A nightly cron entry for the feature verifier. Installed as a crontab line
#   30 3 * * *  /opt/homeserver/fv-harness/nightly.sh
# Runs the full matrix across every app in the manifest at 03:30 local (owner decision 2026-07-29),
# after the media pipeline's busy window. Self-contains its env, backs up before any DB write (ONE
# DOOR + anti-gaslight), and logs to a dated file. Lives in the harness dir so it ships with run.mjs.
set -uo pipefail

# cron has a bare PATH — make node/npx/curl findable (adjust to the box's node install if it moves).
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

FV_HOME="${FV_HOME:-/opt/homeserver/fv-harness}"
TRACKER="${FV_TRACKER_BASE:-http://127.0.0.1:8110}"
TOKEN_FILE="${FV_TOKEN_FILE:-/opt/homeserver/ottomate/.token}"
LOG_DIR="${FV_LOG_DIR:-/opt/homeserver/ottomate/fv-evidence/logs}"

mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/nightly-$(date +%F).log"
exec >>"$LOG" 2>&1
echo "=== fv nightly $(date -Is) · FV_HOME=$FV_HOME ==="

export FV_TRACKER_BASE="$TRACKER"
export FV_BEARER_TOKEN="$(cat "$TOKEN_FILE")"
export FV_RISK_POLICY="${FV_RISK_POLICY:-warn}"   # a monitoring nightly surfaces, never halts a person

# ONE DOOR: back up before the runner writes feature_verification_reports + test_runs.
curl -fsS -X POST "$TRACKER/api/backup" -H "Authorization: Bearer $FV_BEARER_TOKEN" >/dev/null \
  && echo "backup ok" || echo "WARN: backup POST failed — continuing (runs are additive)"

cd "$FV_HOME" || { echo "FATAL: FV_HOME missing"; exit 2; }
rc=0
node run.mjs nightly || rc=$?
echo "=== done $(date -Is) rc=$rc ==="
exit "$rc"
