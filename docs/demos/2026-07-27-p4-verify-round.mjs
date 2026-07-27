// P4 — MECHANICAL verification of the fresh sub-agent's round. Not a reading of its prose.
import { readFileSync } from 'node:fs';
const packet = JSON.parse(readFileSync('./p4-agent-packet.json', 'utf8'));
const out = JSON.parse(readFileSync('./p4-agent-output.json', 'utf8'));

const contested = packet.contestedAxesThisRound.map((a) => a.id);
const frozen = packet.frozenControls ?? {};
const bans = packet.neverReOffer ?? {};
const opts = out.options ?? [];
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });

check('three options returned', opts.length === 3, `${opts.length} options`);

// 1. NO FROZEN AXIS APPEARS AS A CHOICE
const frozenIds = Object.keys(frozen).map((k) => k.split('.').pop());
const leaked = [];
for (const o of opts) for (const k of Object.keys(o.axis_values ?? {})) if (frozenIds.includes(k)) leaked.push(`${o.label}.${k}`);
check('every frozen axis is OMITTED', leaked.length === 0, leaked.length ? `leaked: ${leaked.join(', ')}` : `frozen ${frozenIds.join(', ')} absent from all options`);

// 2. NO HARD-BANNED VALUE RE-OFFERED
const norm = (v) => String(v).trim().toLowerCase();
const violations = [];
for (const [axisKey, entries] of Object.entries(bans)) {
  const id = axisKey.split('.').pop();
  for (const e of entries) for (const o of opts) {
    if (o.axis_values && norm(o.axis_values[id]) === norm(e.value)) violations.push(`${o.label}.${id}=${e.value}`);
  }
}
check('no hard-banned value re-offered', violations.length === 0,
  violations.length ? `RE-OFFERED: ${violations.join(', ')}` : `ban list ${Object.keys(bans).map(k=>k.split('.').pop()+'='+bans[k].map(e=>e.value).join('/')).join('; ')} respected`);

// 3. only contested axes present
const extra = [];
for (const o of opts) for (const k of Object.keys(o.axis_values ?? {})) if (!contested.includes(k)) extra.push(`${o.label}.${k}`);
check('only the contested axes are offered', extra.length === 0, extra.length ? `extra: ${extra.join(', ')}` : contested.join(', '));

// 4. every contested axis actually varies
const flat = [];
for (const id of contested) {
  const vals = new Set(opts.map((o) => norm(o.axis_values?.[id])));
  if (vals.size < 2) flat.push(`${id} (${[...vals].join('|')})`);
}
check('every contested axis genuinely varies', flat.length === 0, flat.length ? `does not move: ${flat.join(', ')}` : 'all three axes move across the set');

let bad = 0;
for (const c of checks) { if (!c.pass) bad++; console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}\n        ${c.detail}`); }
console.log(`\n${checks.length - bad}/${checks.length} checks passed`);
process.exit(bad ? 1 : 0);
