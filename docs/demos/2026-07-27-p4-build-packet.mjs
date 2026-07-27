// P4 — build the round packet a fresh sub-agent will be fed, and NOTHING else.
//
// Base data is Screenroom's REAL ten ledger rows, fetched from the API. The owner has locked nothing
// (all ten are in-review), so a rehearsal against them as-is would be vacuous on exactly the two
// properties P4 exists to verify — no frozen axes and no hard bans means the agent cannot violate
// either. So two rows are marked locked and one hard-rejected IN MEMORY ONLY, clearly as a rehearsal.
// The database is not touched: the owner is mid-decision on these rows.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const base = process.env.HOME + '/.claude/plugins/ottomate';
const { buildRoundInput } = await import(pathToFileURL(`${base}/skills/ottomate/scripts/generation/method-routing.mjs`).href);
const { resolveAnatomy } = await import(pathToFileURL(`${base}/skills/ottomate/scripts/generation/anatomy.mjs`).href);
const anatomy = resolveAnatomy();  // U1 split the file; sub_decisions live in design-questions.json

const raw = JSON.parse(readFileSync(new URL('./screenroom-rows.json', import.meta.url), 'utf8'));
const rows = (raw.decisions ?? raw.data ?? raw).map((r) => ({ ...r }));

// ── the rehearsal state ─────────────────────────────────────────────────────────────────────────
const FROZEN_AXES = ['media-card.media-aspect', 'media-card.title-placement'];
const BANNED = { axis: 'media-card.corner-radius', value: '18px' };

for (const r of rows) {
  if (FROZEN_AXES.includes(r.axis)) { r.status = 'locked'; r.confirmed = true; }
}
rows.push({
  id: 9001, target_id: 'screenroom.poster-card', axis: BANNED.axis, status: 'rejected',
  chosen_value: BANNED.value, round: 1,
  why_rejected: 'REHEARSAL hard ban: the owner ruled this radius out for poster cards — too soft against the poster edge',
  // Only grade 'rejected_with_reason' binds — 'not_selected' may come back. That two-grade model
  // was itself a logged defect fix, and the first fixture here defaulted to soft and correctly
  // produced an empty ban list.
  rejected: [{ value: BANNED.value, grade: 'rejected_with_reason',
    why_rejected: 'REHEARSAL hard ban: too soft against the poster edge' }],
});

const packet = buildRoundInput({
  anatomy,
  archetype: 'media-card',
  targetId: 'screenroom.poster-card',
  decisions: rows.filter((r) => r.target_id === 'screenroom.poster-card'),
  projectDecisions: rows,
  profile: 'P1',
  scope: 'component',
  contract: { animation_vocab: ['transform', 'opacity'], forbidden: ['parallax', 'bounce', 'gradient-text'] },
});

const out = {
  frozenAxes: Object.keys(packet.frozen ?? {}),
  frozenValues: packet.frozen,
  contestedAxes: (packet.contested ?? []).map((sd) => sd.id),
  rejectedByAxis: packet.rejectedByAxis,
  composition: (packet.composition?.rounds ?? []).map((r) => ({ axes: r.axes ?? r, channel: r.channel })),
  requiredStates: packet.requiredStates,
  contract: packet.contract,
  tier: packet.tier,
  renderSurface: packet.renderSurface,
};
writeFileSync(new URL('./p4-packet.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('FROZEN  :', out.frozenAxes.join(', ') || '(none)');
console.log('CONTESTED:', out.contestedAxes.join(', '));
console.log('REJECTED :', JSON.stringify(out.rejectedByAxis));
console.log('COMPOSITION:', JSON.stringify(out.composition));
