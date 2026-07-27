// publish-round.mjs — publish a design round INTO THE OTTOMATE APP.
//
// This replaces "publish a Claude Artifact" as step 6 of stage-2-generation.md
// (owner decision, 2026-07-27: the design surface lives at /projects/<slug>/design,
// the artifact path is retired). The harness is UNCHANGED — it still emits one
// self-contained HTML page. Only the destination moves:
//
//   1. the built HTML is copied onto the previews volume, where the app's existing
//      read-only static route (/api/previews/<path>) already serves it, and
//   2. one `proposed` design_decisions row is POSTed per sub-decision, each carrying
//      `variants_shown` (the pick options) and `preview_url` (where the round renders).
//
// A ROUND needs no table of its own: it IS the rows sharing (project, target, round).
//
// ONE DOOR (adr-018): every DB write here goes through the API, never sqlite.
// The script POSTs /api/backup itself before the first write, so backup-first is
// mechanical rather than a thing to remember.
//
// Runs on VAULT7A: node 20 is present, the API is localhost-bound, and the previews
// volume is a host path (/mnt/storage/ottomate/assets/previews, :rw in compose).
//
// Usage:
//   node publish-round.mjs --manifest round.json \
//        --previews-dir /mnt/storage/ottomate/assets/previews \
//        --api http://127.0.0.1:8110 --token-file /opt/homeserver/ottomate/.token
//   ... --dry-run    print what would happen, touch nothing
//   ... --replace    allow re-publishing over an existing (target, round)

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ANATOMY = path.join(HERE, '..', '..', 'data', 'component-anatomy.json');

export function loadAnatomy(p = ANATOMY) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// A round's HTML lives under a stable, guessable path so the URL survives a rebuild.
// Dots are legal inside a data-oid (screenroom.media-card) but a LEADING dot is not:
// stripping them is what makes "../../etc/passwd" collapse to "etc-passwd" rather than
// to something the app's traversal guard then has to catch.
export function safeSegment(s) {
  return String(s).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
}

export function roundPaths(manifest) {
  const slug = safeSegment(manifest.project_slug);
  const target = safeSegment(manifest.target_id);
  const rel = path.posix.join('design-rounds', slug, target, `r${manifest.round}`);
  return { rel, relFile: path.posix.join(rel, 'index.html'), url: `/api/previews/${rel}/index.html` };
}

/**
 * PURE. Turn a round manifest into the `proposed` design_decisions payloads.
 *
 * @param {object} manifest
 * @param {string} manifest.project_slug
 * @param {string} manifest.target_id            the data-oid
 * @param {string} manifest.archetype            key into component-anatomy.json
 * @param {number} manifest.round
 * @param {Record<string,Record<string,*>>} manifest.variants_shown  { slot: { subDecisionId: value } }
 * @param {string} [manifest.target_kind]
 * @param {number} [manifest.rung]
 * @param {string} [manifest.profile]
 * @param {object} [manifest.constraints]
 * @param {string} [manifest.session_id]
 * @param {object} [anatomy]
 * @returns {Array<object>} one POST payload per sub-decision offered in this round
 */
export function buildRoundPayloads(manifest, anatomy = loadAnatomy()) {
  const {
    target_id, archetype, round, variants_shown,
    target_kind, rung, profile = 'P1', constraints = null, session_id = null,
  } = manifest;

  const arche = anatomy.archetypes?.[archetype];
  if (!arche) {
    throw new Error(`unknown archetype "${archetype}" (known: ${Object.keys(anatomy.archetypes ?? {}).join(', ')})`);
  }
  if (!variants_shown || typeof variants_shown !== 'object') {
    throw new Error('manifest.variants_shown is required — { slot: { subDecisionId: value } }');
  }
  const slots = Object.keys(variants_shown);
  if (slots.length < 2) {
    throw new Error(`a round must offer at least 2 variants; got ${slots.length}`);
  }

  const known = new Set(arche.sub_decisions.map((s) => s.id));
  const TIER_RUNG = { primitive: 2, composite: 3, surface: 4 };
  const resolvedRung = rung ?? TIER_RUNG[arche.tier] ?? 2;
  const kind = target_kind ?? (arche.tier === 'surface' ? 'page' : 'component');

  // Every sub-decision any slot offered a value for. Order follows the anatomy so the
  // pick UI reads in the order the anatomy declares, not in object-key order.
  const offeredIds = arche.sub_decisions
    .map((s) => s.id)
    .filter((id) => slots.some((slot) => variants_shown[slot]?.[id] !== undefined));

  for (const slot of slots) {
    for (const id of Object.keys(variants_shown[slot] ?? {})) {
      if (!known.has(id)) {
        throw new Error(`"${id}" (in slot ${slot}) is not a sub-decision of ${archetype} — an axis must trace to the anatomy (doctrine rule 40)`);
      }
    }
  }
  if (offeredIds.length === 0) throw new Error('no sub-decisions were offered by any slot');

  const { url } = roundPaths(manifest);

  return offeredIds.map((id) => {
    const sub = arche.sub_decisions.find((s) => s.id === id);
    const shown = {};
    for (const slot of slots) {
      const v = variants_shown[slot]?.[id];
      if (v !== undefined) shown[slot] = String(v);
    }
    return {
      target_id,
      target_kind: kind,
      axis: `${archetype}.${id}`,
      status: 'proposed',
      rung: resolvedRung,
      round,
      variants_shown: shown,
      rationale: `Offered in round ${round}${sub?.hint ? ` — ${sub.hint}` : ''}`,
      constraints_applied: constraints,
      profile_at_decision: profile,
      preview_url: url,
      confirmed: false,
      session_id,
    };
  });
}

// ── live side ────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { dryRun: false, replace: false, noBackup: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--replace') out.replace = true;
    else if (a === '--no-backup') out.noBackup = true;
    else if (a.startsWith('--')) out[a.slice(2).replace(/-/g, '_')] = argv[++i];
  }
  return out;
}

async function api(base, token, pathname, init = {}) {
  const res = await fetch(`${base}${pathname}`, {
    ...init,
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifest) {
    console.error('usage: node publish-round.mjs --manifest round.json --previews-dir <dir> --api <base> --token-file <file> [--dry-run] [--replace]');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(args.manifest, 'utf8'));
  const payloads = buildRoundPayloads(manifest);
  const { relFile, url } = roundPaths(manifest);

  const base = args.api ?? 'http://127.0.0.1:8110';
  const token = args.token ?? (args.token_file ? readFileSync(args.token_file, 'utf8').trim() : null);

  console.log(`round: ${manifest.project_slug} / ${manifest.target_id} / r${manifest.round}`);
  console.log(`archetype: ${manifest.archetype} · ${payloads.length} sub-decisions · ${Object.keys(manifest.variants_shown).length} variants`);
  console.log(`preview:  ${url}`);
  for (const p of payloads) console.log(`  ${p.axis.padEnd(34)} ${JSON.stringify(p.variants_shown)}`);

  if (args.dry_run || args.dryRun) { console.log('\n--dry-run: nothing written.'); return; }

  // 1. the HTML → the previews volume
  if (!args.previews_dir) throw new Error('--previews-dir is required (e.g. /mnt/storage/ottomate/assets/previews)');
  if (!manifest.html) throw new Error('manifest.html (path to the harness output) is required');
  const dest = path.join(args.previews_dir, relFile);
  mkdirSync(path.dirname(dest), { recursive: true });
  if (path.resolve(manifest.html) !== path.resolve(dest)) copyFileSync(manifest.html, dest);
  writeFileSync(path.join(path.dirname(dest), 'round.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nwrote ${dest} (${(readFileSync(dest).length / 1024).toFixed(1)} KB)`);

  // 2. idempotency — refuse to double-publish a (target, round)
  const existing = await api(base, token, `/api/projects/${manifest.project_slug}/design-decisions?target_id=${encodeURIComponent(manifest.target_id)}&limit=500`);
  const clash = (existing.body?.decisions ?? []).filter((d) => (d.round ?? 1) === manifest.round);
  if (clash.length && !args.replace) {
    console.error(`\nREFUSED: ${clash.length} decision(s) already exist for round ${manifest.round} on this target. Re-run with --replace, or publish as a new round.`);
    process.exit(2);
  }

  // 3. backup BEFORE the first write (hard constraint 2) — mechanical, not remembered
  if (!args.noBackup && !args.no_backup) {
    const b = await api(base, token, '/api/backup', { method: 'POST', body: '{}' });
    console.log(`backup: HTTP ${b.status} ${JSON.stringify(b.body)?.slice(0, 160) ?? ''}`);
    if (!b.ok) { console.error('backup failed — refusing to write.'); process.exit(3); }
  }

  // 4. the rows
  const created = [];
  for (const p of payloads) {
    const r = await api(base, token, `/api/projects/${manifest.project_slug}/design-decisions`, {
      method: 'POST', body: JSON.stringify(p),
    });
    if (!r.ok) { console.error(`POST ${p.axis} → HTTP ${r.status} ${JSON.stringify(r.body)}`); process.exit(4); }
    created.push(r.body?.decision?.id);
  }
  console.log(`\ncreated ${created.length} decisions: ${created.join(', ')}`);
  console.log(`open:  ${base}/projects/${manifest.project_slug}/design/${encodeURIComponent(manifest.target_id)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
