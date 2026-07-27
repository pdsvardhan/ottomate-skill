// catalog-source.mjs — make `source_policy` real, and stop the catalog being bypassed.
//
// C2, 2026-07-27. The owner spent a sprint taking `master_components` to 179 entries, and the design
// method never once looked at it. `must_use` was empty on every real round and `source_policy` sat at
// status:"pending", so "library-first, not library-only" was enforced by absolutely nothing.
//
// The register said source_policy "needs a source-tagging convention that does not exist yet". This
// file IS that convention, and it is deliberately tiny:
//
//     variant.source = { kind: 'catalog',  mc_id: 'mc-poster-card-glass' }
//     variant.source = { kind: 'bespoke',  why: 'nothing in cards/ handles a 2:3 poster with an
//                                                ownership chip and a partial meter' }
//
// LIBRARY-FIRST, NOT LIBRARY-ONLY (owner ruling): a bespoke variant is first-class. What the policy
// refuses is a set where the catalog was never *considered* — bespoke without a stated reason. That
// is the difference between choosing to build something and not knowing the catalog exists.

// Project-category → catalog-category mapping. Kept here rather than inferred, because a silent
// mapping is how a gap check quietly starts passing everything (this bit the 2.3 gap check before).
export const ARCHETYPE_CATEGORIES = {
  'media-card': ['cards', 'media-galleries'],
  button: ['buttons-actions'],
  'data-table-row': ['tables', 'data-charts'],
};
export const TIER_CATEGORIES = {
  primitive: ['buttons-actions', 'forms-inputs'],
  composite: ['cards', 'overlays', 'feedback-progress'],
  surface: ['layout', 'sections', 'navigation'],
};

/**
 * Rank catalog entries that could serve this target. PURE — the caller fetches the catalog.
 * @param {Array<object>} catalog  master_components rows
 * @param {object} o
 * @param {string} [o.archetype]
 * @param {string} [o.tier]
 * @param {string} [o.preferLibrary]
 * @param {string[]} [o.preferTags]
 * @param {number} [o.limit]
 */
export function catalogCandidates(catalog = [], { archetype, tier, preferLibrary = '', preferTags = [], limit = 5 } = {}) {
  const cats = new Set([...(ARCHETYPE_CATEGORIES[archetype] ?? []), ...(TIER_CATEGORIES[tier] ?? [])]);
  const tags = preferTags.map((t) => String(t).toLowerCase());
  const GRADE = { A: 3, B: 2, C: 1 };

  // Ranked the way stage-2-components.md §2.4 already documents it: preferred library FIRST, then
  // quality grade, then tag overlap. A single weighted score let grade outrank the library preference,
  // which contradicts the convention the catalog was built under — caught by a test.
  return catalog
    .filter((mc) => mc && cats.has(mc.category))
    .map((mc) => {
      const mcTags = (Array.isArray(mc.tags) ? mc.tags : []).map((t) => String(t).toLowerCase());
      return {
        id: mc.id, name: mc.name, category: mc.category, library: mc.library, quality_grade: mc.quality_grade,
        preferred: Boolean(preferLibrary) && mc.library === preferLibrary,
        grade: GRADE[mc.quality_grade] ?? 0,
        tagHits: tags.filter((t) => mcTags.includes(t)).length,
      };
    })
    .sort((a, b) => (Number(b.preferred) - Number(a.preferred))
      || (b.grade - a.grade)
      || (b.tagHits - a.tagHits)
      || String(a.id).localeCompare(String(b.id)))
    .slice(0, limit);
}

const KINDS = new Set(['catalog', 'bespoke']);

/**
 * Enforce `source_policy`. Default `library-first`.
 *   library-first : every variant must declare a source; a bespoke one must say WHY the catalog
 *                   did not fit. At least one candidate must have been available to consider.
 *   library-only  : every variant must be catalog-sourced.
 *   bespoke-ok    : declaration still required, no reason needed.
 * @returns {{pass:boolean, problems:string[], notes:string[]}}
 */
export function checkSourcePolicy(variants = [], { policy = 'library-first', candidates = [] } = {}) {
  const problems = [];
  const notes = [];

  for (const v of variants) {
    const src = v.source;
    if (!src || !KINDS.has(src.kind)) {
      problems.push(`variant "${v.label}" declares no source — every variant must say whether it came from the catalog or was built bespoke (source_policy)`);
      continue;
    }
    if (src.kind === 'catalog') {
      if (!src.mc_id) problems.push(`variant "${v.label}" claims a catalog source with no mc_id`);
      else notes.push(`${v.label} ← ${src.mc_id}`);
      continue;
    }
    // bespoke
    if (policy === 'library-only') {
      problems.push(`variant "${v.label}" is bespoke, but source_policy is library-only`);
    } else if (policy === 'library-first' && !(src.why && String(src.why).trim().length >= 15)) {
      problems.push(`variant "${v.label}" is bespoke with no stated reason — library-first allows bespoke, but only when you say what the catalog could not do (at least 15 chars)`);
    } else {
      notes.push(`${v.label} bespoke: ${src.why ?? '(no reason required under this policy)'}`);
    }
  }

  // "The catalog was never considered" is the failure this policy exists to catch. If candidates were
  // available and every single variant is bespoke, say so — even when each one gave a reason.
  if (policy === 'library-first' && candidates.length > 0 && variants.length > 0
      && variants.every((v) => v.source?.kind === 'bespoke')) {
    notes.push(`ALL ${variants.length} variants are bespoke while ${candidates.length} catalog candidate(s) existed: ${candidates.slice(0, 3).map((c) => c.id).join(', ')}. Allowed, but worth a second look.`);
  }
  return { pass: problems.length === 0, problems, notes };
}

export function formatSource(result, candidates = []) {
  const l = [`source policy: ${result.pass ? 'PASS' : 'FAIL'}`];
  for (const p of result.problems) l.push(`  BLOCK ${p}`);
  for (const n of result.notes) l.push(`  ${n}`);
  if (candidates.length) l.push(`  catalog candidates considered: ${candidates.map((c) => `${c.id}(${c.quality_grade ?? '?'})`).join(', ')}`);
  else l.push('  catalog candidates: none for this archetype/tier — bespoke is the only option');
  return l.join('\n');
}
