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
import { resolveAnatomy, rungForTier } from './anatomy.mjs';
import { resolveLabels, buildShown } from './variant-slots.mjs';
import { prePublishGates, formatPrePublish } from './pre-publish-gates.mjs';
import { buildRoundJsonExtras } from './emit-round-json.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Two files since U1 (2026-07-27); anatomy.mjs resolves them to the pre-split shape.
export { loadAnatomy } from './anatomy.mjs';

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

// WS0.1 (Phase 0, 2026-07-29 — corrects test-finding F-13). The app IS browser-reachable, but the
// tunnel host is served through Authentik SSO (cloudflared: ottomate.vault7a.xyz → authentik:9000 →
// the ottomate container on 127.0.0.1:8110). The API base (`--api`) must stay server-side/localhost
// for the POSTs; the URL PRINTED TO THE OWNER must be the reachable tunnel host, never 127.0.0.1
// (which is dead from the owner's browser — the exact thing that hid the cointrail round from them).
// `--public-base` overrides the default for a LAN-only or different-domain deployment.
export const DEFAULT_PUBLIC_BASE = 'https://ottomate.vault7a.xyz';

/** The owner-openable preview URL (tunnel host + the previews route). Pure, so it is unit-tested. */
export function publicRoundUrl(manifest, publicBase = DEFAULT_PUBLIC_BASE) {
  const { url } = roundPaths(manifest);
  return `${String(publicBase).replace(/\/+$/, '')}${url}`;
}

/** The owner-openable design-surface URL for a (project, target) — the pick/mix page. */
export function publicDesignUrl(projectSlug, targetId, publicBase = DEFAULT_PUBLIC_BASE) {
  return `${String(publicBase).replace(/\/+$/, '')}/projects/${projectSlug}/design/${encodeURIComponent(targetId)}`;
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
/**
 * R5 (F-11): resolve the round's anatomy from the REGISTRY (fast-path) OR from an inline decomposed
 * anatomy the manifest carries (`anatomy_inline` from decompose.mjs). This is what lets a NOVEL / not-yet-
 * registered component publish a round without temp registry surgery — its axes trace to its stamped/derived
 * parts instead of a component-anatomy.json entry. Doctrine rule 40 still holds: below, an axis that traces
 * to NEITHER the registry nor the inline anatomy is refused.
 * @returns {{tier:string, sub_decisions:Array<{id:string, hint?:string}>}}
 */
export function resolveArchetype(manifest, anatomy = resolveAnatomy()) {
  const registered = anatomy.archetypes?.[manifest.archetype];
  if (registered) return registered;
  const inline = manifest.anatomy_inline;
  if (inline && Array.isArray(inline.sub_decisions) && inline.sub_decisions.length) {
    return { tier: inline.tier ?? 'composite', sub_decisions: inline.sub_decisions, required_states: inline.required_states ?? ['rest'], _inline: true };
  }
  throw new Error(`unknown archetype "${manifest.archetype}" and no manifest.anatomy_inline — register it, or pass the decomposed anatomy (decompose.mjs → anatomy_inline). Known: ${Object.keys(anatomy.archetypes ?? {}).join(', ')}`);
}

export function buildRoundPayloads(manifest, anatomy = resolveAnatomy()) {
  const {
    target_id, archetype, round, variants_shown,
    target_kind, rung, profile = 'P1', constraints = null, session_id = null,
  } = manifest;

  const arche = resolveArchetype(manifest, anatomy);
  if (!variants_shown || typeof variants_shown !== 'object') {
    throw new Error('manifest.variants_shown is required — { slot: { subDecisionId: value } }');
  }
  const slots = Object.keys(variants_shown);
  if (slots.length < 2) {
    throw new Error(`a round must offer at least 2 variants; got ${slots.length}`);
  }

  const known = new Set(arche.sub_decisions.map((s) => s.id));
  const resolvedRung = rung ?? rungForTier(arche.tier);
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

  // T5: slot letters are RE-SHUFFLED every round (G3 §3.6), so "A" in round 1 is a different bundle
  // from "A" in round 2. Storing the value under a bare letter made `mixed_from:{variant:"A"}`
  // unresolvable later without the harness manifest. Each entry carries its label, and a slot with
  // NO label is now rejected rather than written as `label: null` — a row that cannot be traced is
  // not a row worth writing, and there is no later chance to add the label.
  // SHAPE: { A: { value, label } }. Readers tolerate the legacy { A: value } — rows 18-27 were
  // written before this and are deliberately not rewritten.
  const labels = resolveLabels(manifest);
  return offeredIds.map((id) => {
    const sub = arche.sub_decisions.find((s) => s.id === id);
    const shown = buildShown(slots, (slot) => variants_shown[slot]?.[id], labels,
      `publishing round ${round} of ${archetype}`);
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

/**
 * T4. A round SHOULD declare every candidate it generated, marking which shipped. When it does not,
 * say so out loud rather than quietly recording three of six — an unaudited filter that looks audited
 * is worse than one that is obviously not.
 */
export function summariseFilter(manifest) {
  const shown = Object.keys(manifest.variants_shown ?? {}).length;
  const cands = manifest.candidates;
  if (!Array.isArray(cands) || !cands.length) {
    return { generated: null, shipped: shown, discarded: 0, candidates: [],
      missing: `no \`candidates\` in the manifest — the ${shown} shipped bundles are recorded but the ones the filter discarded are NOT. The filter is unaudited for this round.` };
  }
  const shippedC = cands.filter((c) => c.shipped);
  const discarded = cands.filter((c) => !c.shipped);
  return {
    generated: cands.length, shipped: shippedC.length, discarded: discarded.length,
    candidates: cands.map((c) => ({ label: c.label, shipped: !!c.shipped, why: c.why ?? null, axis_values: c.axis_values ?? null })),
    missing: shippedC.length === shown ? null
      : `manifest declares ${shippedC.length} shipped candidates but ${shown} variants were published — the record does not match what was shown.`,
  };
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
    console.error('usage: node publish-round.mjs --manifest round.json --previews-dir <dir> --api <base> --token-file <file> [--public-base https://ottomate.vault7a.xyz] [--theme-file <tokens.json>] [--block-source <block.css>] [--dry-run] [--replace]');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(args.manifest, 'utf8'));
  const payloads = buildRoundPayloads(manifest);
  const { relFile, url } = roundPaths(manifest);

  const base = args.api ?? 'http://127.0.0.1:8110';         // API POSTs — server-side, never surfaced
  const publicBase = args.public_base ?? DEFAULT_PUBLIC_BASE; // what the OWNER opens (WS0.1)
  const publicUrl = publicRoundUrl(manifest, publicBase);
  const token = args.token ?? (args.token_file ? readFileSync(args.token_file, 'utf8').trim() : null);

  console.log(`round: ${manifest.project_slug} / ${manifest.target_id} / r${manifest.round}`);
  console.log(`archetype: ${manifest.archetype} · ${payloads.length} sub-decisions · ${Object.keys(manifest.variants_shown).length} variants`);
  console.log(`preview:  ${publicUrl}`);
  for (const p of payloads) console.log(`  ${p.axis.padEnd(34)} ${JSON.stringify(p.variants_shown)}`);

  // WS1.0 — the fail-closed pre-publish gates (per-theme contrast + ban-raw-values), replacing the
  // colourBudget block (F-8, now advisory). `theme_file`/`block_sources` are manifest paths, resolved
  // relative to the manifest; `--theme-file`/`--block-source` override. A project with no theme yet
  // reports skip (not a pass). This runs in --dry-run too, so the gate is visible before a real publish.
  const manifestDir = path.dirname(path.resolve(args.manifest));
  // CLI paths resolve vs the CWD; manifest-declared paths resolve vs the manifest's directory.
  const fromManifest = (p) => (path.isAbsolute(p) ? p : path.join(manifestDir, p));
  const themeFile = args.theme_file ? path.resolve(args.theme_file)
    : (manifest.theme_file ? fromManifest(manifest.theme_file) : null);
  const blockCssFiles = args.block_source ? [path.resolve(args.block_source)]
    : (manifest.block_sources ?? []).map(fromManifest);
  const gates = prePublishGates({ themeFile, blockCssFiles });
  console.log('\npre-publish gates:');
  console.log(formatPrePublish(gates));

  if (args.dry_run || args.dryRun) { console.log('\n--dry-run: nothing written.'); return; }

  if (!gates.pass) {
    console.error('\nREFUSED: a fail-closed pre-publish gate blocked this round. Nothing written.');
    process.exit(5);
  }

  // 1. the HTML → the previews volume
  if (!args.previews_dir) throw new Error('--previews-dir is required (e.g. /mnt/storage/ottomate/assets/previews)');
  if (!manifest.html) throw new Error('manifest.html (path to the harness output) is required');
  const dest = path.join(args.previews_dir, relFile);
  mkdirSync(path.dirname(dest), { recursive: true });
  if (path.resolve(manifest.html) !== path.resolve(dest)) copyFileSync(manifest.html, dest);
  // T4: the filter over-generates 6 and keeps 3, and the three it discards used to vanish — so the
  // filter was unauditable and the next round could not learn from what was thrown away. They are
  // recorded here, beside the preview, in the file publish-round already wrote. No schema change.
  // R1.1: auto-emit the live grid + banner. `variant_files:[{label,path}]` are copied beside index.html
  // and recorded as `variant_previews`; `banner` (buildBanner inputs) becomes a self-styled banner. Both
  // optional — a legacy round with neither still publishes and falls back to the single index.html iframe.
  const extras = buildRoundJsonExtras(manifest, path.dirname(dest), { themeFile, resolveRel: fromManifest });
  const record = { ...manifest, ...extras, filter: summariseFilter(manifest) };
  writeFileSync(path.join(path.dirname(dest), 'round.json'), JSON.stringify(record, null, 2));
  if (extras.variant_previews) console.log(`  live grid: ${extras.variant_previews.length} interactive variant(s) — ${extras.variant_previews.map((v) => v.file).join(', ')}`);
  if (extras.banner) console.log('  legibility banner: emitted');
  if (record.filter.missing) console.warn(`  note: ${record.filter.missing}`);
  console.log(`\nwrote ${dest} (${(readFileSync(dest).length / 1024).toFixed(1)} KB)`);

  // 2. idempotency — refuse to double-publish a (target, round)
  const existing = await api(base, token, `/api/projects/${manifest.project_slug}/design-decisions?target_id=${encodeURIComponent(manifest.target_id)}&limit=500`);
  const clash = (existing.body?.decisions ?? []).filter((d) => (d.round ?? 1) === manifest.round);
  if (clash.length && !args.replace) {
    console.error(`\nREFUSED: ${clash.length} decision(s) already exist for round ${manifest.round} on this target. Re-run with --replace, or publish as a new round.`);
    process.exit(2);
  }

  /**
   * --replace must REPLACE (#462, 2026-08-20).
   *
   * It used to skip the refusal above and then POST anyway, leaving the old rows
   * in place beside the new ones. Republishing round 1 on screenroom's requests
   * ledger left rows 78 AND 79 proposed for the same axis, so the pick UI could
   * write the owner's choice onto the stale one and the locked decision would
   * then point at a variant they never saw. Row 78 had to be deleted by hand.
   *
   * A SETTLED clash is never deleted, even with --replace. That row is a
   * decision the owner made; destroying it to make room for a rerun is the worse
   * of the two failures. Refuse, and name which ones.
   */
  if (clash.length && args.replace) {
    const settled = clash.filter((d) => d.status && d.status !== 'proposed');
    if (settled.length) {
      console.error(`REFUSED: ${settled.length} decision(s) for round ${manifest.round} are not proposed (${settled.map((d) => `${d.id}:${d.status}`).join(', ')}).`);
      console.error('--replace will not delete a decision the owner has already settled. Reopen it deliberately, or publish as a new round.');
      process.exit(2);
    }
    for (const d of clash) {
      const r = await api(base, token, `/api/design-decisions/${d.id}`, { method: 'DELETE' });
      if (!r.ok) { console.error(`--replace: DELETE ${d.id} -> HTTP ${r.status} ${JSON.stringify(r.body)}`); process.exit(2); }
    }
    console.log(`--replace: removed ${clash.length} superseded proposal(s) for round ${manifest.round}: ${clash.map((d) => d.id).join(', ')}`);
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
  console.log(`preview: ${publicUrl}`);
  console.log(`open:    ${publicDesignUrl(manifest.project_slug, manifest.target_id, publicBase)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
