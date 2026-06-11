# Ottomate — status (generated)

> Generated 2026-06-11T18:00:51+05:30 by `scripts/generate-status.sh`. Do not hand-edit (adr-016:
> every hand-written count in the previous STATUS drifted wrong).

- Health: `{"status":"ok","version":"0.1.0","port":"3000","db":"connected","timestamp":"2026-06-11T12:30:51.575Z"}`
- API route files: 105
- Tracker repo head: d131fcc 2026-06-11 iter-16 wrap: regenerate API inventory
- Latest off-disk backup: ottomate-20260611T023001.db

## Projects (live)

| slug | lifecycle | flows | features | pages | components |
|---|---|---|---|---|---|
| cap-a | building | 0 | 0 | 0 | 0 |
| cointrail | building | 8 | 12 | 5 | 8 |
| cricket-stats | building | 0 | 0 | 0 | 0 |
| desi-skies | ideating | 0 | 0 | 0 | 0 |
| health | building | 0 | 0 | 0 | 0 |
| home | building | 0 | 0 | 0 | 0 |
| ingest | building | 0 | 0 | 0 | 0 |
| leaploop | shipped | 6 | 14 | 7 | 29 |
| mapsofbharat | building | 5 | 12 | 1 | 7 |
| media-dashboard | building | 8 | 15 | 18 | 41 |
| ottomate | building | 54 | 20 | 18 | 30 |
| paata | ideating | 0 | 0 | 0 | 0 |
| portfolio | building | 13 | 18 | 0 | 0 |
| sms-receiver | deprecated | 0 | 0 | 0 | 0 |
| tasks | building | 13 | 20 | 13 | 75 |
| vacayornay-data | deprecated | 0 | 0 | 0 | 0 |

## Totals (live)

- DB tables: 71
- ADRs: 75 | Iterations: 13 | Verification reports: 95
- Master components: 193 | Open/accepted risks: 42
- flow_test_runs: 5 (0 = E2E wiring not yet live; see adr-014)

## Where everything lives

- Skill plugin: `~/.claude/plugins/ottomate/` (git: Gitea `pdsv/ottomate`)
- Web app: `/opt/homeserver/ottomate` (git: Gitea `pdsv/ottomate-tracker-v3`), container `ottomate`, 127.0.0.1:8110
- Backups: `/mnt/storage/backups/ottomate/` (nightly 02:30 VACUUM INTO, 14 kept)
- Decisions: ADR index per project in the app; bodies in `decisions/` of the tracker repo
- Audit + workstream plan: `~/Desktop/Skills CC/Ottomate/AUDIT-2026-06-10.md`
