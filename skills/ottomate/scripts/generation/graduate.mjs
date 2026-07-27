// Graduation — Stage 4 S9. Turns a LOCKED bespoke variant into a real `master_components` row.
//
// `draftGraduation()` is UNCHANGED and still never writes: it is now the dry-run, and its refusals
// stay tested exactly as they were. `graduate()` is the new writing path, and it runs the five gates
// in order — S3 provenance → S4 licence → S5 tokenisation → S6 grade → S7 dedupe — failing closed at
// each. A component that trips any gate leaves the catalog byte-for-byte unchanged.
//
// Provenance for a graduated bespoke variant is KNOWABLE, so it is recorded rather than defaulted:
// the author is the owner, the licence is the project's, the source is the round that produced it,
// and `retrieved_at` is the lock. Defaulting any of those would be inventing provenance in the one
// subsystem whose entire purpose is not inventing provenance.
//
// ONE DOOR: the write is a POST to the app API. `POST /api/backup` is the caller's responsibility and
// is asserted, not assumed.

import { validateProvenance, licenceTier as tierOf } from './provenance.mjs';
import { gradeComponent } from './grade-component.mjs';
import { findDuplicates } from './dedupe.mjs';

const GREEN = new Set(['CC0-1.0', 'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'OFL-1.1']);
const AMBER = new Set(['CC-BY-4.0', 'CC-BY-SA-4.0', 'unDraw-custom', 'Lottie-Simple', 'RemixIcon-1.0']);
const RED_PATTERNS = [/-NC/i, /-ND/i, /CC BY-NC-SA/i, /^unknown$/i, /^unverified$/i];

/** Kept for the draft path's existing tests. `provenance.mjs` owns the authoritative tiering. */
export function licenceTier(spdxId) {
  if (!spdxId) return 'RED';
  if (GREEN.has(spdxId)) return 'GREEN';
  if (AMBER.has(spdxId)) return 'AMBER';
  if (RED_PATTERNS.some((re) => re.test(spdxId))) return 'RED';
  return 'RED';
}

const REQUIRED_PROVENANCE = ['source_url', 'author', 'spdx_id', 'licence_url', 'attribution', 'retrieved_at'];

function bakedInLiterals(source) {
  const hits = [...String(source).matchAll(/(?<![\w-])#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
  return [...new Set(hits)];
}

/**
 * Build a DRAFT graduation record for review. Never writes. This is the --dry-run.
 * @returns {{writes:false, draft:object|null, quarantine:boolean, reasons:string[], tier:string}}
 */
export function draftGraduation(lockedDecision, source, provenance = {}) {
  const reasons = [];
  if (lockedDecision?.status !== 'locked') reasons.push('only a LOCKED decision may graduate');

  const missing = REQUIRED_PROVENANCE.filter((k) => !provenance[k]);
  const inHouse = provenance.ingestion_method === 'hand-authored' || provenance.author === 'ottomate';
  if (missing.length && !inHouse) reasons.push(`missing provenance → quarantine: ${missing.join(', ')}`);

  const tier = licenceTier(provenance.spdx_id ?? (inHouse ? 'MIT' : null));
  if (tier === 'RED') reasons.push('RED licence tier (or unverified) — reject');

  const baked = bakedInLiterals(source);
  if (baked.length) reasons.push(`not tokenised — baked-in literals (${baked.slice(0, 3).join(', ')}); route through tokens before shipping`);

  const quarantine = reasons.length > 0;
  const draft = quarantine ? null : {
    id: `mc-graduated-${(lockedDecision.axis || 'x').replace(/[^\w-]/g, '-')}`,
    library: 'ottomate',
    source_url: provenance.source_url ?? null,
    ingestion_method: provenance.ingestion_method ?? 'hand-authored',
    license_note: provenance.spdx_id ?? 'MIT (in-house)',
    _pending_columns: {
      spdx_id: provenance.spdx_id ?? (inHouse ? 'MIT' : null),
      author: provenance.author ?? null,
      attribution: provenance.attribution ?? null,
      retrieved_at: provenance.retrieved_at ?? null,
      trademark_flag: !!provenance.trademark,
      grade: null,
    },
    from_decision: { axis: lockedDecision.axis, chosen_value: lockedDecision.chosen_value, target_id: lockedDecision.target_id },
    tier,
  };

  return { writes: false, draft, quarantine, reasons, tier };
}

// ── S9: the writing path ───────────────────────────────────────────────────────────────────────

/** Shape the real `master_components` row from a locked decision. Nothing here is defaulted. */
export function buildCatalogRow(lockedDecision, source, provenance, opts = {}) {
  const axisSlug = String(lockedDecision.axis ?? 'x').replace(/[^\w-]/g, '-').toLowerCase();
  return {
    id: opts.id ?? `mc-graduated-${axisSlug}`,
    name: opts.name ?? `Graduated: ${lockedDecision.axis}`,
    category: opts.category ?? null,
    description: opts.description
      ?? `Graduated from a locked design decision (${lockedDecision.axis} = ${lockedDecision.chosen_value}) on ${lockedDecision.target_id}.`,
    library: 'ottomate',
    ingestion_method: 'project-extracted',
    source_url: provenance.source_url ?? null,
    licence_url: provenance.licence_url ?? null,
    spdx_id: provenance.spdx_id ?? null,
    author: provenance.author ?? null,
    attribution: provenance.attribution ?? null,
    retrieved_at: provenance.retrieved_at ?? null,
    trademark_flag: provenance.trademark === true,
    license_note: provenance.spdx_id ? String(provenance.spdx_id) : null,
    dependencies: opts.dependencies ?? [],
    dark_light_compat: opts.dark_light_compat,
    responsive: opts.responsive,
    used_in_projects: opts.projectSlug ? [opts.projectSlug] : [],
    source_code: source,
    primary_file: opts.primary_file ?? `${opts.id ?? `mc-graduated-${axisSlug}`}.tsx`,
  };
}

/**
 * Run every gate and, only if all pass, write. Fails closed.
 *
 * @param {object} lockedDecision
 * @param {string} source
 * @param {object} provenance
 * @param {object} opts
 * @param {boolean} [opts.apply]        false/omitted → dry run, nothing is written
 * @param {Array}   [opts.existing]     catalog rows to dedupe against
 * @param {Function}[opts.post]         async (row) => ({status, body}); injected so this is testable
 * @param {boolean} [opts.backedUp]     caller asserts POST /api/backup already ran
 */
export async function graduate(lockedDecision, source, provenance = {}, opts = {}) {
  const gates = [];
  const fail = (gate, why) => { gates.push({ gate, pass: false, why }); };
  const pass = (gate, note) => { gates.push({ gate, pass: true, note }); };

  // Gate 0 — a proposed decision has not been chosen.
  if (lockedDecision?.status !== 'locked') fail('locked', `status is "${lockedDecision?.status ?? 'absent'}" — only a LOCKED decision may graduate`);
  else pass('locked', 'decision is locked');

  const rec = buildCatalogRow(lockedDecision, source, provenance, opts);

  // Gate 1 — provenance (S3). Graduation is third-party-strict on purpose: we know all six fields
  // here, so accepting fewer would be choosing not to record what we already have.
  const prov = validateProvenance(rec, { requireAll: true });
  if (prov.ok) pass('provenance', 'complete'); else fail('provenance', prov.reason);

  // Gate 2 — licence (S4).
  const licence = tierOf(provenance.spdx_id);
  if (licence.tier === 'RED') fail('licence', licence.why); else pass('licence', licence.why);

  // Gate 3 — tokenisation (S5) is a GATE here, not a weighted factor. In the catalog-wide grader a
  // literal is one term among seven and can be outvoted; at graduation it must block, because H1 says
  // a baked-in #fff is "a downgrade, not an entry" AND because this is the one moment the token names
  // are actually known — the round that produced this variant emitted them.
  const graded = gradeComponent(rec, source);
  const tok = graded.tokenisation;
  if (tok.measurable && tok.literalColours > 0) {
    fail('tokenised', `${tok.literalColours} baked-in literal colour(s) (${tok.samples.join(', ')}) — graduate through the round's tokens, not as literals`);
  } else pass('tokenised', tok.measurable ? 'no literals in styling positions' : 'no source to read');

  // Gate 4 — grade (S6). Only A/B ship.
  if (graded.ships) pass('grade', `${graded.grade} (score ${graded.score?.toFixed(2)})`);
  else fail('grade', `grade ${graded.grade} — only A and B ship${graded.gateReason ? ` · ${graded.gateReason}` : ''}`);

  // Gate 5 — dedupe (S7). Reported as a blocker for an automatic write; a human may still override.
  const dup = findDuplicates({ id: rec.id, src: source, png: opts.png }, opts.existing ?? []);
  if (dup.duplicates.length) fail('dedupe', `duplicates ${dup.duplicates.map((d) => `${d.id} (${d.by})`).join(', ')}`);
  else pass('dedupe', `${dup.checked} checked, none matched`);

  const blockers = gates.filter((g) => !g.pass);
  const ok = blockers.length === 0;

  if (!ok || opts.apply !== true) {
    return {
      writes: false, ok, row: rec, gates, grade: graded.grade,
      reason: ok ? 'all gates passed — dry run, nothing written' : blockers.map((b) => `${b.gate}: ${b.why}`).join(' · '),
    };
  }

  if (opts.backedUp !== true) {
    return { writes: false, ok: false, row: rec, gates, grade: graded.grade,
      reason: 'refusing to write without POST /api/backup — pass backedUp:true once it has run' };
  }
  if (typeof opts.post !== 'function') {
    return { writes: false, ok: false, row: rec, gates, grade: graded.grade, reason: 'no post() provided' };
  }

  const res = await opts.post(rec);
  const wrote = res?.status === 200 || res?.status === 201;
  return {
    writes: wrote, ok: wrote, row: rec, gates, grade: graded.grade, response: res,
    reason: wrote ? `graduated ${rec.id} at grade ${graded.grade}` : `POST failed (${res?.status})`,
  };
}
