#!/bin/bash
# fv-drift.sh — fail-closed guard for the shared feature-verify runner (ottomate #718).
# FV_HOME is hand-synced from app repos; measured 2026-08-28 they were 5,971 lines apart within a day, so a
# nightly could run the OLD runner and report green. Compares every common .ts/.mjs/.mts file between FV_HOME
# and each manifest app's tests/e2e/feature-verify; exits 1 on any difference. Never auto-copies — copying
# would hide which side is newer. Sync by hand, then re-run.
FV_HOME="${FV_HOME:-/opt/homeserver/fv-harness}"; rc=0
roots=$(python3 -c "import json,sys;d=json.load(open('$FV_HOME/feature-verify-apps.json'));print('\n'.join(a.get('repo_root','') for a in d.get('apps',[]) if a.get('repo_root')))")
for root in $roots; do
  t="$root/tests/e2e/feature-verify"; [ -d "$t" ] || continue
  for f in $(cd "$t" && find . -type f \( -name "*.ts" -o -name "*.mjs" -o -name "*.mts" \) -not -path "*/node_modules/*" -not -path "*/evidence/*" | sort); do
    [ -f "$FV_HOME/$f" ] || continue
    if ! cmp -s "$FV_HOME/$f" "$t/$f"; then
      newer=$([ "$t/$f" -nt "$FV_HOME/$f" ] && echo "repo newer" || echo "shared newer")
      echo "DRIFT  $f  ($(diff "$FV_HOME/$f" "$t/$f" | grep -c '^[<>]') lines, $newer)  <- $root"; rc=1
    fi
  done
done
[ $rc -eq 0 ] && echo "fv-drift: shared runner matches every app repo tree"
exit $rc
