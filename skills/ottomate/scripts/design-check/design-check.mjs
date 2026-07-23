// The design constraint checker — Phase 3a, source-method rules.
//
// Runs AFTER the isolation gate and BEFORE anything is emitted. Same fail-closed principle: a set that
// violates a blocking rule is regenerated, never presented.
//
// Tier semantics are doctrine §5, executable:
//   block_feasibility — the artifact does not RUN. Never profile-filtered: a blank panel is blank for
//                       everyone. Fail closed.
//   block_owner       — the owner's own constraints + decision integrity. Never profile-filtered.
//   block_floor       — the small hard doctrine floor. FILTERED BY AUDIENCE PROFILE.
//   advise            — computed, annotated on the variant, shown. Never blocks.
//
// A rule with no implemented detector is reported as SKIPPED, never as a pass. `checked` counts only
// rules that actually ran.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETECTORS, CONTRACT_DETECTORS } from './checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(HERE, '..', '..', 'data', 'design-rules.json');

export function loadRules(rulesPath = RULES_PATH) {
  return JSON.parse(readFileSync(rulesPath, 'utf8'));
}

/**
 * Which block_floor rules actually bind for an audience profile.
 * The owner's ruling, made executable: the profile is a preset, not a straitjacket — every entry is
 * per-project editable via `overrides`.
 *
 * @returns {{ block: string[], advise: string[], skip: string[] }}
 */
export function resolveFloor(profile, rules = loadRules(), overrides = {}) {
  const p = rules.audience_profiles?.profiles?.[profile];
  if (!p) throw new Error(`unknown audience profile "${profile}" (known: ${Object.keys(rules.audience_profiles?.profiles ?? {}).join(', ')})`);
  const out = { block: [], advise: [], skip: [] };
  const merged = { ...p.floor, ...overrides };
  for (const [id, verdict] of Object.entries(merged)) {
    if (verdict === 'block') out.block.push(id);
    else if (verdict === 'advise' || verdict === 'allow-with-flag') out.advise.push(id);
    else out.skip.push(id); // 'skip' | 'allow'
  }
  return out;
}

/**
 * @param {object} opts
 * @param {Record<string,string>} opts.variants  { label: sourceText }
 * @param {object} [opts.contract]               the owner's constraint contract
 * @param {string} [opts.profile]                'P1' | 'P2' | 'P3'
 * @param {object} [opts.floorOverrides]         per-project floor edits
 * @param {object} [opts.rules]                  parsed design-rules.json
 */
export function runCheck({ variants, contract = {}, profile = 'P1', floorOverrides = {}, rules = loadRules() }) {
  const floor = resolveFloor(profile, rules, floorOverrides);
  const findings = [];
  const skipped = [];
  let checked = 0;

  const record = (rule, label, res, tier) => {
    checked += 1;
    if (res.pass) return;
    findings.push({ rule: rule.id, tier, label, detail: res.detail, source: rule.source, remedy: rule.remedy });
  };

  // ── rules[] ────────────────────────────────────────────────────────────────
  for (const rule of rules.rules) {
    const impl = DETECTORS[rule.id];
    if (!impl) {
      if (rule.method === 'source') skipped.push({ rule: rule.id, why: 'no detector implemented yet' });
      else skipped.push({ rule: rule.id, why: `method:"${rule.method ?? 'unclassified'}" — out of scope for the source checker` });
      continue;
    }
    // block_floor is the only tier the profile touches.
    let tier = rule.tier;
    if (tier === 'block_floor') {
      if (floor.skip.includes(rule.id)) { skipped.push({ rule: rule.id, why: `profile ${profile}: skip` }); continue; }
      if (floor.advise.includes(rule.id)) tier = 'advise';
    }
    if (impl.scope === 'set') {
      record(rule, '(set)', impl.fn(variants, rule, contract), tier);
    } else {
      for (const [label, src] of Object.entries(variants)) record(rule, label, impl.fn(src, rule, contract), tier);
    }
  }

  // ── the owner's constraint contract ────────────────────────────────────────
  for (const [id, impl] of Object.entries(CONTRACT_DETECTORS)) {
    const schema = rules.constraint_contract_schema?.[impl.key] ?? {};
    const rule = { id, tier: 'block_owner', source: `constraint_contract_schema.${impl.key}`, remedy: 'regenerate_variant', params: schema };
    for (const [label, src] of Object.entries(variants)) record(rule, label, impl.fn(src, rule, contract), 'block_owner');
  }

  const blocked = findings.filter((f) => f.tier.startsWith('block'));
  const advisories = findings.filter((f) => f.tier === 'advise');
  return { pass: blocked.length === 0, blocked, advisories, skipped, checked, profile, floor };
}

export function formatCheck(result) {
  const lines = [];
  const icon = result.pass ? 'PASS' : 'FAIL';
  lines.push(`constraint check: ${icon} — ${result.checked} checks ran, ${result.blocked.length} blocking, ${result.advisories.length} advisory, ${result.skipped.length} skipped (profile ${result.profile})`);
  for (const f of result.blocked) lines.push(`  BLOCK  [${f.tier}] ${f.rule} @ ${f.label}: ${f.detail}`);
  for (const f of result.advisories) lines.push(`  advise ${f.rule} @ ${f.label}: ${f.detail}`);
  if (!result.pass) lines.push('  → regenerate. A blocked set is never presented (doctrine §5, fail closed).');
  return lines.join('\n');
}

// Per-variant annotation for the template's existing `constraints_honoured` slot.
export function annotationsByVariant(result, labels) {
  const out = {};
  for (const label of labels) {
    const mine = [...result.blocked, ...result.advisories].filter((f) => f.label === label);
    out[label] = mine.length ? `${mine.length} finding(s): ${mine.map((f) => f.rule).join(', ')}` : 'clean';
  }
  return out;
}
