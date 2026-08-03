#!/usr/bin/env node
// gen-reference-docs (Phase 4, D5) — generate a project's FEATURES reference
// doc FROM the registry (Layer-1, R-DOC-1/9). The registry is the single source
// of truth; this is a generated build artifact that carries a provenance header
// and must never be hand-edited. Idempotent: same registry → same bytes.
//
//   node gen-reference-docs.mjs --project <slug> [--out <path>] [--commit <sha>]
// Default out: /mnt/storage/websites/<slug>/FEATURES.md. Runs on the box (reads
// the tracker API on localhost). Env: FV_TRACKER_BASE (http://127.0.0.1:8110).

import { writeFileSync } from 'node:fs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const project = arg('project');
if (!project) { console.error('usage: gen-reference-docs.mjs --project <slug> [--out <path>] [--commit <sha>]'); process.exit(2); }
const TRACKER = process.env.FV_TRACKER_BASE || 'http://127.0.0.1:8110';
const out = arg('out', `/mnt/storage/websites/${project}/FEATURES.md`);
const commit = arg('commit', 'HEAD');

const get = async (p) => { const r = await fetch(`${TRACKER}${p}`); if (!r.ok) throw new Error(`${p} → ${r.status}`); return r.json(); };
const esc = (s) => (s == null ? '' : String(s).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim());

const STATUS_ORDER = ['done', 'building', 'blocked', 'planned', 'dropped'];

const feats = (await get(`/api/projects/${project}/features`)).features ?? [];
const flows = (await get(`/api/projects/${project}/flows`)).flows ?? [];

// pull ACs per feature (the spec — the point of the reference)
const acByFeat = {};
for (const f of feats) {
  try { acByFeat[f.id] = (await get(`/api/projects/${project}/features/${f.id}/acceptance-criteria`)).acceptance_criteria ?? []; }
  catch { acByFeat[f.id] = []; }
}

const lines = [];
lines.push(`<!-- generated from registry @ ${commit} on ${new Date().toISOString().slice(0, 10)} — DO NOT EDIT; edit the registry via the Ottomate API. R-DOC-1. -->`);
lines.push(`# ${project} — Features & Flows (generated reference)`);
lines.push('');
lines.push(`> Generated from the Ottomate registry (the single source of truth). To change anything here, edit the feature/flow/acceptance-criteria in the tracker, then re-run \`scripts/generation/gen-reference-docs.mjs --project ${project}\`.`);
lines.push('');
lines.push('## Features');
lines.push('');
const shownFeats = feats.filter((f) => f.status !== 'dropped');
for (const st of STATUS_ORDER) {
  const group = shownFeats.filter((f) => (f.status ?? 'planned') === st);
  if (!group.length) continue;
  lines.push(`### ${st} (${group.length})`);
  lines.push('');
  for (const f of group.sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`- **${esc(f.title)}** \`${f.id}\` — _${f.type ?? 'n/a'}_, test: \`${f.test_status ?? 'not-tested'}\``);
    if (f.short_description) lines.push(`  - ${esc(f.short_description)}`);
    const acs = acByFeat[f.id] ?? [];
    for (const ac of acs) lines.push(`  - AC: ${esc(ac.content)}${ac.linked_test ? ` (test: \`${esc(ac.linked_test)}\`)` : ''}`);
  }
  lines.push('');
}
lines.push('## Flows');
lines.push('');
for (const fl of flows.filter((x) => true).sort((a, b) => a.id.localeCompare(b.id))) {
  lines.push(`- **${esc(fl.title)}** \`${fl.id}\` — test: \`${fl.test_status ?? 'not-tested'}\`${fl.linked_playwright_test ? ` (\`${esc(fl.linked_playwright_test)}\`)` : ''}`);
  if (fl.trigger || fl.expected_outcome) lines.push(`  - ${esc(fl.trigger)} → ${esc(fl.expected_outcome)}`);
}
lines.push('');

writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out} — ${shownFeats.length} features (+${feats.length - shownFeats.length} dropped omitted), ${flows.length} flows.`);
