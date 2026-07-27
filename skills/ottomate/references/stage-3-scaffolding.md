# Stage 3.1 — Scaffolding (repo init + Docker + NPM proxy + Gitea Actions)

> **POST-AUDIT AMENDMENTS (2026-04-29):** applied (changelog archived at `_archive/references/stage-amendments.md`; restated lines collapsed 2026-06-10 — Gitea secrets are in step 9, skill-event reporting + Type-2 ordering in the body / SKILL.md stage table). Operative deltas:
> - Pre-checks: drift detection (no manual edits to scaffold-target paths since 1.10)
> - Phase ledger transition: pages `PROPOSED → LAYOUT_LOCKED` after Tailwind tokens applied

The first concrete write of code. Goal: project boots a `/api/health` endpoint inside Docker with auth-protected mutations.

## Pre-checks

Run sanity-check first (`GET /api/sanity-check`on Ottomate; the per-stage checks live in `references/sanity-check.md`).

Required to pass:
- Stage 2 verified
- **Design-lock gate (profile-aware, Phase 4).** `GET /api/projects/<slug>/design-decisions?status=locked`
  and run `stage3DesignGate({ profile, targetsBuilt, lockedDecisions })`
  (`scripts/generation/method-routing.mjs`). A user-facing target built with no locked design decision
  is **advisory at P1/P2** (the owner's default is to build on placeholder UI and design later — do not
  block) and **BLOCKING at P3** (public ships no un-designed UI). This is the ledger reaching into
  Stage 3: the build reads the locked design spec instead of ignoring it.
- Repo absent at `git.vault7a.xyz/pdsv/<slug>` (else: revive flow)
- Gitea Actions runner up
- Server disk ≥10GB free
- `projects-net` Docker network exists

## Workflow

1. **Create Gitea repo** via API:
   ```
   curl -u pdsv:<gitea-token> -X POST http://git.vault7a.xyz/api/v1/user/repos \
     -d "{\"name\": \"<slug>\", \"private\": true, \"auto_init\": true}"
   ```
2. **Clone to /opt/homeserver/<slug>/** on VAULT7A. Set up upstream.
3. **Generate package.json + tsconfig + next.config + eslint + prettier** from the locked tech stack.
4. **Apply** the chosen Tailwind theme tokens from Doc 1.preferences + UI Master Plan.
5. **Drizzle schema scaffold**: empty schema.ts with the data-contracts table list (filled from Doc 5).
6. **API health endpoint** + bearer auth middleware (mirror `lib/auth.ts` from Ottomate).
7. **Dockerfile** — bookworm-slim, multi-stage, `output: 'standalone'` next.config, `user: "1000:1000"` in compose, healthcheck pointing at /api/health.
8. **Gitea Actions** workflow file at `.gitea/workflows/ci.yml` that runs on push: typecheck → vitest → playwright → trivy.
9. **Gitea Actions secrets**: ANTHROPIC_API_KEY (only if needed), TRACKER_API_TOKEN.
10. **Copy `/design` route scaffold** from `data/scaffold/design-route/` into the project:
    - `app/design/page.tsx` + `app/design/DesignClient.tsx`
    - `app/api/design/{master-components,pick,skip}/route.ts`
    - `lib/design/tracker.ts`
    Add env wiring to `docker-compose.yml`:
    ```yaml
    - OTTOMATE_PROJECT_SLUG=<slug>
    - TRACKER_API_BASE=http://ottomate:3000   # container-to-container on projects-net
    - TRACKER_API_TOKEN=${TRACKER_API_TOKEN}
    ```
    Create server-side `.env` with `TRACKER_API_TOKEN=$(cat /opt/homeserver/ottomate/.token)`.
    Confirm `.env` is in `.gitignore`. See
    `docs/plans/2026-05-13-design-route-scaffold-design.md` for the full design rationale.
11. **First commit + push**.
12. **Open PR `feat/scaffold` → main`** so the user can review before merging into main.

Once merged: report scaffold complete via `POST /api/skill-events { event_type: 'stage-3-start' }` and proceed to 3.2.

## /design route — what step 10 ships

Every Ottomate-built project gets a project-local `/design` page at
`<project>.vault7a.xyz/design`. It shows the UI master plan tokens, the slot grid for the
project's components, and inline pick/skip drawer with options from the `master_components`
catalog. Writes round-trip through the project's own `/api/design/*` proxy so Ottomate
bearer token never reaches the browser. Visual pattern: BOTB (rounded-2xl + top gradient
strip + restrained motion) using the project's own CSS variables.

The scaffold template is canonical at
`~/.claude/plugins/ottomate/data/scaffold/design-route/`. Backfill into existing projects:
SCP the template + add env + commit + rebuild. First backfill (2026-05-13): `tasks` —
worked end-to-end after fixing TRACKER_API_BASE to `http://ottomate:3000`.

## Lessons-learned hard rules

- `node:22-bookworm-slim` (not alpine) so better-sqlite3 prebuilt binaries work.
- `.dockerignore` MUST exclude `node_modules`, `.next`, `.env`, `*.db` to prevent host-built artifacts from corrupting the builder stage.
- `public/` dir must exist (even empty) so Next standalone COPY succeeds.
- Mount data dir owned by uid 1000 + run container as `user: "1000:1000"`.
- Mount `.token` as a Docker secret; the app reads `process.env.TRACKER_API_TOKEN_FILE`.

These are battle-tested from Phase 1 of Ottomate's own bootstrap.

## Output

A booting container at `127.0.0.1:<port>/api/health` returning `{status:'ok',db:'connected'}`. Port chosen at slug-create time, persisted on the project row.

## Next

`references/stage-3-pipeline-setup.md` for CI tools, then code generation.
