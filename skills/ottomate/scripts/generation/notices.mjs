// Stage 4 S8 — the NOTICES ledger.
//
// Assembled from components a project ACTUALLY USES, not from the whole catalog. A NOTICES file
// listing 116 components for a site that uses 9 is noise, and noise is how a real obligation gets
// missed — which is the only failure mode this file exists to prevent.
//
// Fails closed: a component whose licence requires attribution but has no author BLOCKS the build,
// naming the id. Emitting a NOTICES file with a blank attribution line would be worse than emitting
// none, because it looks discharged.
//
// PURE. The caller writes the file, with the same discipline as `emit-design-artifacts.mjs`:
// commit on the project branch, never push, refuse on a dirty tree, --dry-run writes nothing.

import { licenceTier, normaliseField } from './provenance.mjs';

/**
 * @param {string} projectSlug
 * @param {Array<object>} catalog   master_components rows
 * @returns {{ok:boolean, text:string|null, used:number, blockers:string[], groups:object}}
 */
export function buildNotices(projectSlug, catalog = []) {
  const used = catalog.filter((c) => Array.isArray(c.used_in_projects) && c.used_in_projects.includes(projectSlug));

  const blockers = [];
  const groups = { GREEN: [], AMBER: [], RED: [] };

  for (const c of used) {
    const tier = licenceTier(c.spdx_id);
    const author = normaliseField(c.author);
    const attribution = normaliseField(c.attribution);

    if (tier.tier === 'RED') {
      blockers.push(`${c.id}: licence is RED (${tier.why}) — it must not be in a shipped project at all`);
      groups.RED.push(c);
      continue;
    }
    // AMBER always carries obligations, so it always needs an attributable author.
    if (tier.obligations && !author && !attribution) {
      blockers.push(`${c.id}: ${c.spdx_id} requires attribution but the row has no author and no attribution string`);
    }
    groups[tier.tier].push(c);
  }

  if (blockers.length) {
    return { ok: false, text: null, used: used.length, blockers, groups };
  }

  const lines = [
    `# NOTICES — ${projectSlug}`,
    '',
    `Third-party components used by this project, and the obligations that come with them.`,
    `Generated from the Ottomate component catalog. ${used.length} component(s).`,
    '',
  ];

  if (groups.AMBER.length) {
    lines.push('## Attribution required', '');
    for (const c of groups.AMBER.sort((a, b) => a.id.localeCompare(b.id))) {
      lines.push(`### ${c.name ?? c.id} (\`${c.id}\`)`);
      lines.push(`- Licence: ${c.spdx_id}${c.licence_url ? ` — ${c.licence_url}` : ''}`);
      lines.push(`- Author: ${normaliseField(c.author) ?? normaliseField(c.attribution)}`);
      if (c.source_url) lines.push(`- Source: ${c.source_url}`);
      if (c.trademark_flag) lines.push('- **Trademark:** the file licence does not waive it; use needs a separate decision.');
      lines.push('');
    }
  }

  if (groups.GREEN.length) {
    // Permissive licences may be summarised — itemising 60 MIT components buries the AMBER ones that
    // actually carry an obligation.
    lines.push('## Permissive licences', '');
    const byLicence = {};
    for (const c of groups.GREEN) (byLicence[c.spdx_id] ??= []).push(c.id);
    for (const [spdx, ids] of Object.entries(byLicence).sort()) {
      lines.push(`- **${spdx}** (${ids.length}): ${ids.sort().join(', ')}`);
    }
    lines.push('');
  }

  return { ok: true, text: lines.join('\n'), used: used.length, blockers: [], groups };
}
