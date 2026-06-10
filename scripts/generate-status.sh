#!/usr/bin/env bash
# Generates STATUS.md from the live system. Never hand-edit STATUS.md (adr-016).
# Usage: bash scripts/generate-status.sh > STATUS.md
set -euo pipefail
S="pdsv@192.168.1.10"

ssh "$S" '
API=http://127.0.0.1:8110
NOW=$(date -Is)
HEALTH=$(curl -s -m 10 $API/api/health)
ROUTES=$(find /opt/homeserver/ottomate/app/api -name route.ts | wc -l)
GITHEAD=$(cd /opt/homeserver/ottomate && git log -1 --format="%h %ad %s" --date=short)
LATEST_BACKUP=$(ls -1t /mnt/storage/backups/ottomate/ottomate-*.db 2>/dev/null | head -1 | xargs -r basename)
echo "# Ottomate — status (generated)"
echo
echo "> Generated $NOW by \`scripts/generate-status.sh\`. Do not hand-edit (adr-016:"
echo "> every hand-written count in the previous STATUS drifted wrong)."
echo
echo "- Health: \`$HEALTH\`"
echo "- API route files: $ROUTES"
echo "- Tracker repo head: $GITHEAD"
echo "- Latest off-disk backup: ${LATEST_BACKUP:-none}"
echo
echo "## Projects (live)"
echo
echo "| slug | lifecycle | flows | features | pages | components |"
echo "|---|---|---|---|---|---|"
docker exec ottomate node -e "
const d=require(\"better-sqlite3\")(\"/app/data/ottomate.db\",{readonly:true});
const ps=d.prepare(\"SELECT slug,lifecycle_phase FROM projects ORDER BY slug\").all();
for (const p of ps){
  const c={};
  for (const t of [\"flows\",\"features\",\"pages\",\"components\"]) c[t]=d.prepare(\"SELECT count(*) n FROM \"+t+\" WHERE project_slug=?\").get(p.slug).n;
  console.log(\"| \"+p.slug+\" | \"+(p.lifecycle_phase||\"-\")+\" | \"+c.flows+\" | \"+c.features+\" | \"+c.pages+\" | \"+c.components+\" |\");
}
const n=(q)=>d.prepare(q).get().n;
console.log(\"\");
console.log(\"## Totals (live)\");
console.log(\"\");
console.log(\"- DB tables: \"+n(\"SELECT count(*) n FROM sqlite_master WHERE type=\x27table\x27\"));
console.log(\"- ADRs: \"+n(\"SELECT count(*) n FROM adr_index\")+\" | Iterations: \"+n(\"SELECT count(*) n FROM iterations\")+\" | Verification reports: \"+n(\"SELECT count(*) n FROM verification_reports\"));
console.log(\"- Master components: \"+n(\"SELECT count(*) n FROM master_components\")+\" | Open/accepted risks: \"+n(\"SELECT count(*) n FROM risk_instances WHERE status!=\x27resolved\x27\"));
console.log(\"- flow_test_runs: \"+n(\"SELECT count(*) n FROM flow_test_runs\")+\" (0 = E2E wiring not yet live; see adr-014)\");
"
echo
echo "## Where everything lives"
echo
echo "- Skill plugin: \`~/.claude/plugins/ottomate/\` (git: Gitea \`pdsv/ottomate\`)"
echo "- Web app: \`/opt/homeserver/ottomate\` (git: Gitea \`pdsv/ottomate-tracker-v3\`), container \`ottomate\`, 127.0.0.1:8110"
echo "- Backups: \`/mnt/storage/backups/ottomate/\` (nightly 02:30 VACUUM INTO, 14 kept)"
echo "- Decisions: ADR index per project in the app; bodies in \`decisions/\` of the tracker repo"
echo "- Audit + workstream plan: \`~/Desktop/Skills CC/Ottomate/AUDIT-2026-06-10.md\`"
'
