// C12 scenario 2 — the ~20-component pairing run. READ-ONLY: reads component source and runs the pure
// derive + composition path. No DB, no repo write. Output IS the comparison table + a findings list.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { collectEvidence, inferTier, proposeRecord, validateRecord } from './scripts/generation/anatomy-derive.mjs';
import { questionRegistry, resolveAnatomy } from './scripts/generation/anatomy.mjs';
import { composeRounds } from './scripts/generation/round-composition.mjs';

const ROOT = '/mnt/storage/websites/screenroom/components';
const REG = questionRegistry();
const TIERS = resolveAnatomy().tiers;

// ~20 real components spanning tiers.
const FILES = [
  'ui/button.tsx', 'ui/badge.tsx', 'ui/avatar.tsx', 'ui/progress.tsx', 'ui/tabs.tsx', 'ui/dialog.tsx', 'ui/hover-card.tsx', 'ui/drawer.tsx',
  'shared/OwnChip.tsx', 'shared/Facets.tsx', 'shared/CountUp.tsx',
  'detail/WatchCard.tsx', 'detail/FileCard.tsx', 'detail/EpisodeRow.tsx', 'detail/RatingsRow.tsx', 'detail/PeoplePills.tsx', 'detail/DetailHero.tsx',
  'home/CollectionCells.tsx', 'home/SpotlightHero.tsx',
  'lists/FilmsList.tsx', 'lists/MusicRacks.tsx', 'lists/ListStates.tsx',
  'queue/QueueView.tsx',
];

function loadCss(file) {
  for (const ext of ['.module.css', '.css', '.module.scss', '.scss']) {
    const p = path.join(ROOT, file.replace(/\.tsx$/, ext));
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return '';
}

const rows = [];
const findings = [];

for (const file of FILES) {
  const abs = path.join(ROOT, file);
  if (!existsSync(abs)) { findings.push(`MISSING: ${file} not found`); continue; }
  const source = readFileSync(abs, 'utf8');
  const css = loadCss(file);
  const ev = collectEvidence(source, css);
  const tier = inferTier(ev);
  const rec = proposeRecord(ev, { name: path.basename(file, '.tsx') });
  const val = validateRecord(rec, ev);

  // chosen questions -> composition sub-decisions
  const sub = rec.questions.map((e) => {
    const q = REG[e.q];
    return q ? { id: e.q, part: e.part, channel: q.channel, scope_hint: q.scope_hint } : { id: e.q, part: e.part, channel: undefined, scope_hint: undefined };
  });
  const comp = composeRounds(sub, { scope: 'component' });

  rows.push({
    file, tier: rec.tier, conf: rec.confidence, hasCss: ev.hasCss,
    parts: rec.parts.length, partSrc: rec.part_source,
    likely: rec.likely.length, possible: rec.possible.length, qn: rec.questions.length,
    valOk: val.ok, valProblems: val.problems,
    rounds: comp.matrix.rounds, widest: comp.matrix.widest, regime: comp.matrix.regime,
    promote: comp.promote.map((a) => a.id), warnings: comp.warnings,
    surface: (TIERS[rec.tier]?.render_surface ?? '').slice(0, 60),
    childComponents: ev.childComponents.length,
    partsSample: rec.parts.slice(0, 5),
  });

  // findings heuristics — where the pairing is wrong/weak
  if (!val.ok) findings.push(`VALIDATE FAIL: ${file} (${rec.tier}) — ${val.problems.join(' | ')}`);
  if (rec.part_source.includes('class names only')) findings.push(`WEAK PARTS: ${file} — no stylesheet; parts are raw classes ${JSON.stringify(rec.parts.slice(0, 4))}`);
  if (rec.parts.some((p) => /^(flex|grid|gap|px|py|mt|mb|text|bg|rounded|absolute|relative|w-|h-|items|justify)/.test(p))) findings.push(`TAILWIND PARTS: ${file} — a Tailwind utility was taken as a component part: ${JSON.stringify(rec.parts.filter((p) => /^(flex|grid|gap|px|py|mt|mb|text|bg|rounded|absolute|relative|w-|h-|items|justify)/.test(p)).slice(0, 5))}`);
  if (comp.warnings.length) findings.push(`COMPOSITION WARN: ${file} — ${comp.warnings.join(' | ')}`);
  if (sub.some((s) => s.channel === undefined)) findings.push(`UNMAPPED Q: ${file} — a chosen question is not in the registry`);
}

// ── the table ────────────────────────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log('\n' + '='.repeat(140));
console.log('C12(2) PAIRING TABLE — ' + rows.length + ' components');
console.log('='.repeat(140));
console.log([pad('component', 26), pad('tier', 10), pad('conf', 7), pad('css', 4), pad('parts', 6), pad('q(L/P)', 8), pad('valid', 6), pad('rounds', 7), pad('widest', 7), pad('regime', 18), 'promote'].join(' '));
console.log('-'.repeat(140));
for (const r of rows) {
  console.log([
    pad(r.file, 26), pad(r.tier, 10), pad(r.conf, 7), pad(r.hasCss ? 'yes' : 'no', 4),
    pad(r.parts, 6), pad(`${r.likely}/${r.possible}`, 8), pad(r.valOk ? 'ok' : 'FAIL', 6),
    pad(r.rounds, 7), pad(r.widest, 7), pad(r.regime, 18), r.promote.join(',').slice(0, 30),
  ].join(' '));
}

// ── tier + regime distribution ─────────────────────────────────────────────────────────────────
const tally = (key) => rows.reduce((m, r) => (m[r[key]] = (m[r[key]] || 0) + 1, m), {});
console.log('\ntier distribution:', JSON.stringify(tally('tier')));
console.log('regime distribution:', JSON.stringify(tally('regime')));
console.log('validate ok:', rows.filter((r) => r.valOk).length, '/', rows.length);
console.log('has stylesheet:', rows.filter((r) => r.hasCss).length, '/', rows.length);

// ── findings ─────────────────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(140));
console.log('FINDINGS — ' + findings.length);
console.log('='.repeat(140));
// dedupe-ish: group by prefix
for (const f of findings) console.log('  - ' + f);
