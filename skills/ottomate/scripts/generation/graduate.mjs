// Graduation hook — Phase 4 (protocol + non-writing draft only).
//
// Turns a LOCKED bespoke variant into a DRAFT master_components candidate per the H1 ingest contract:
// provenance, licence tier, tokenise-check, a placeholder grade. It DOES NOT write to the catalog — the
// target columns (spdx_id/author/attribution/retrieved_at/trademark_flag/grade) do not exist yet
// (see references/graduation-protocol.md). The full subsystem (migration + grade runner + dedupe +
// NOTICES) is the next unit. This keeps graduation honest: the contract is captured and testable now,
// the live write waits on the schema.

const GREEN = new Set(['CC0-1.0', 'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'OFL-1.1']);
const AMBER = new Set(['CC-BY-4.0', 'CC-BY-SA-4.0', 'unDraw-custom', 'Lottie-Simple', 'RemixIcon-1.0']);
const RED_PATTERNS = [/-NC/i, /-ND/i, /CC BY-NC-SA/i, /^unknown$/i, /^unverified$/i];

export function licenceTier(spdxId) {
  if (!spdxId) return 'RED';                       // no provenance → reject (H1 §3.2/§3.3)
  if (GREEN.has(spdxId)) return 'GREEN';
  if (AMBER.has(spdxId)) return 'AMBER';
  if (RED_PATTERNS.some((re) => re.test(spdxId))) return 'RED';
  return 'RED';                                    // unrecognised → treat as unverified = RED
}

const REQUIRED_PROVENANCE = ['source_url', 'author', 'spdx_id', 'licence_url', 'attribution', 'retrieved_at'];

// A baked-in literal colour is a downgrade, not a finished entry (H1 §3.12).
function bakedInLiterals(source) {
  const hits = [...String(source).matchAll(/(?<![\w-])#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]);
  return [...new Set(hits)];
}

/**
 * Build a DRAFT graduation record for review. Never writes.
 * @returns {{writes:false, draft:object|null, quarantine:boolean, reasons:string[], tier:string}}
 */
export function draftGraduation(lockedDecision, source, provenance = {}) {
  const reasons = [];
  if (lockedDecision?.status !== 'locked') reasons.push('only a LOCKED decision may graduate');

  const missing = REQUIRED_PROVENANCE.filter((k) => !provenance[k]);
  // in-house authored variants are effectively GREEN; a missing spdx is only fatal when third-party
  const inHouse = provenance.ingestion_method === 'hand-authored' || provenance.author === 'ottomate';
  if (missing.length && !inHouse) reasons.push(`missing provenance → quarantine: ${missing.join(', ')}`);

  const tier = licenceTier(provenance.spdx_id ?? (inHouse ? 'MIT' : null));
  if (tier === 'RED') reasons.push('RED licence tier (or unverified) — reject');

  const baked = bakedInLiterals(source);
  if (baked.length) reasons.push(`not tokenised — baked-in literals (${baked.slice(0, 3).join(', ')}); route through tokens before shipping`);

  const quarantine = reasons.length > 0;
  const draft = quarantine ? null : {
    // shaped toward master_components, but NOT inserted (columns pending a migration)
    id: `mc-graduated-${(lockedDecision.axis || 'x').replace(/[^\w-]/g, '-')}`,
    library: 'ottomate',
    source_url: provenance.source_url ?? null,
    ingestion_method: provenance.ingestion_method ?? 'hand-authored',
    license_note: provenance.spdx_id ?? 'MIT (in-house)',
    // fields that need the migration — carried in the draft, not yet columns:
    _pending_columns: {
      spdx_id: provenance.spdx_id ?? (inHouse ? 'MIT' : null),
      author: provenance.author ?? null,
      attribution: provenance.attribution ?? null,
      retrieved_at: provenance.retrieved_at ?? null,
      trademark_flag: !!provenance.trademark,
      grade: null,   // needs the rubric runner (Phase 3b / graduation subsystem)
    },
    from_decision: { axis: lockedDecision.axis, chosen_value: lockedDecision.chosen_value, target_id: lockedDecision.target_id },
    tier,
  };

  return { writes: false, draft, quarantine, reasons, tier };
}
