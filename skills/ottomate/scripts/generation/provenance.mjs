// Stage 4 S3 + S4 — provenance at ingest, and the GREEN/AMBER/RED licence tiers.
//
// H1: provenance is captured AT INGEST or lost forever. There is no later pass that can recover who
// wrote a component or under what licence — the moment it is in the catalog with a null spdx_id, the
// only honest options are "ask a human" or "delete it". So the gate lives here, at the door.
//
// Two rules that look like details and are not:
//   1. UNKNOWN IS RED, not AMBER. An unidentified licence is not a permissive one. Treating it as
//      merely cautionary is exactly how a -NC asset reaches a public project.
//   2. A TRADEMARK IS NOT A LICENCE. H1 §3.5 and D2 §3.7 reached this independently: a CC0 file
//      licence does not waive a trademark. A CC0 logo is still a logo.
//
// PURE. No network, no fs — unit-tested with neither.

// ── S4: licence tiers ──────────────────────────────────────────────────────────────────────────

/** Ship freely; attribution only where the licence itself asks. */
const GREEN_SPDX = new Set([
  'MIT', 'MIT-0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'CC0-1.0', 'Unlicense', '0BSD',
]);

/** Usable, with obligations. Must appear in NOTICES; flagged at pick time. */
const AMBER_SPDX = new Set([
  'CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-SA-4.0', 'CC-BY-SA-3.0',
  'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'LGPL-2.1-only', 'LGPL-3.0-only', 'MPL-2.0', 'EPL-2.0', 'AGPL-3.0-only',
]);

/**
 * Sources excluded BY NAME, with the reason. Encoded here rather than left to the SPDX check because
 * each is a trap a plausible-looking licence string would walk straight past.
 */
export const NAMED_EXCLUSIONS = {
  shadertoy: {
    match: /shadertoy\.com/i,
    reason: 'Shadertoy content is CC BY-NC-SA 3.0 — non-commercial AND viral (share-alike). Both halves disqualify it.',
  },
  undraw: {
    match: /undraw\.co/i,
    reason: 'unDraw licences per-image only; it forbids repackaging into packs, scraping, and AI-training use. Bulk ingest is exactly what it prohibits.',
  },
  rive: {
    match: /rive\.app|\.riv$/i,
    reason: 'Rive requires a WebAssembly runtime, which the no-wasm feasibility rule already forbids. Caught here so it fails at INGEST rather than three stages later at render.',
  },
};

const EMPTYISH = new Set(['', 'unknown', 'n/a', 'na', 'none', 'tbd', '-', '?', 'null', 'undefined']);

/** '' and 'unknown' are ABSENT, not values — otherwise the gate is satisfied by typing a placeholder. */
export function normaliseField(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return EMPTYISH.has(s.toLowerCase()) ? null : s;
}

/**
 * @param {string|null} spdxId
 * @returns {{tier:'GREEN'|'AMBER'|'RED', why:string, obligations:boolean}}
 */
export function licenceTier(spdxId) {
  const id = normaliseField(spdxId);
  if (!id) {
    return { tier: 'RED', why: 'no SPDX identifier — an unidentified licence is not a permissive one', obligations: false };
  }
  // -NC and -ND are checked BEFORE the allow-lists: a compound id like `CC-BY-NC-4.0` must never be
  // matched loosely against `CC-BY-4.0` and pass.
  if (/-NC(-|$)/i.test(id)) return { tier: 'RED', why: `${id} is non-commercial (-NC)`, obligations: false };
  if (/-ND(-|$)/i.test(id)) return { tier: 'RED', why: `${id} forbids derivatives (-ND)`, obligations: false };
  if (GREEN_SPDX.has(id)) return { tier: 'GREEN', why: `${id} is permissive`, obligations: false };
  if (AMBER_SPDX.has(id)) return { tier: 'AMBER', why: `${id} carries obligations (copyleft or required attribution)`, obligations: true };
  return { tier: 'RED', why: `${id} is not on the GREEN or AMBER list — unrecognised is treated as RED, never as permissive`, obligations: false };
}

/** Check a source URL against the named exclusions. Returns the first match, or null. */
export function excludedSource(sourceUrl) {
  const u = normaliseField(sourceUrl);
  if (!u) return null;
  for (const [name, rule] of Object.entries(NAMED_EXCLUSIONS)) {
    if (rule.match.test(u)) return { name, reason: rule.reason };
  }
  return null;
}

// ── S3: the provenance gate ────────────────────────────────────────────────────────────────────

/**
 * What must be present depends on where the component came from, and the honest rule is NOT
 * "always require everything". A hand-authored component genuinely has no upstream URL, and
 * demanding one only teaches people to type "n/a" — which `normaliseField` then rejects anyway.
 */
export const REQUIRED_BY_ORIGIN = {
  authored: ['author', 'spdx_id'],
  'third-party': ['author', 'spdx_id', 'source_url', 'licence_url', 'attribution', 'retrieved_at'],
};

/** `library: 'ottomate'` or a hand-authored ingestion method means we wrote it. */
export function originOf(rec = {}) {
  const lib = normaliseField(rec.library);
  const method = normaliseField(rec.ingestion_method);
  if (lib === 'ottomate' || method === 'hand-authored' || method === 'project-extracted') return 'authored';
  return 'third-party';
}

/**
 * The gate. Returns a verdict; it never throws, because the caller decides between quarantine and
 * refusal and both need the detail.
 *
 * @param {object} rec  a master_components-shaped record
 * @param {{grandfather?:boolean}} [opts]  grandfather=true marks a pre-rule row as debt instead of
 *   quarantining it (owner decision 2026-07-27) — see `provenance_debt`.
 */
export function validateProvenance(rec = {}, opts = {}) {
  const origin = originOf(rec);
  const required = REQUIRED_BY_ORIGIN[origin];
  const missing = required.filter((f) => normaliseField(rec[f]) === null);

  const licence = licenceTier(rec.spdx_id);
  const excluded = excludedSource(rec.source_url);
  const trademark = rec.trademark_flag === true || rec.trademark_flag === 1;

  const blockers = [];
  if (excluded) blockers.push(`excluded source (${excluded.name}): ${excluded.reason}`);
  if (licence.tier === 'RED') blockers.push(`licence RED: ${licence.why}`);
  if (missing.length) blockers.push(`missing provenance for a ${origin} component: ${missing.join(', ')}`);

  // A trademark does not block ingest; it blocks *unreviewed use*, and it must never be cleared by a
  // permissive file licence.
  const warnings = trademark
    ? ['carries a trademark — a file licence does not waive it; use needs an explicit owner decision']
    : [];

  const ok = blockers.length === 0;
  const grandfathered = !ok && opts.grandfather === true && missing.length > 0
    && licence.tier !== 'RED' && !excluded;

  return {
    ok,
    origin,
    missing,
    licence,
    excluded,
    trademark,
    warnings,
    blockers,
    // Quarantine = stored but NOT catalog-visible. Refusing would lose the work; quarantining keeps it
    // and makes the gap visible and fixable.
    quarantine: !ok && !grandfathered,
    provenance_debt: grandfathered,
    reason: ok ? 'provenance complete' : blockers.join(' · '),
  };
}
