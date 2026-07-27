// Stage 4 S3 + S4. Every rule has a must-FAIL and a must-PASS case.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  licenceTier, excludedSource, validateProvenance, originOf, normaliseField, NAMED_EXCLUSIONS,
} from './provenance.mjs';

// ── S4 licence tiers ───────────────────────────────────────────────────────────────────────────

test('MUST PASS — permissive ids are GREEN with no obligations', () => {
  for (const id of ['MIT', 'ISC', 'BSD-3-Clause', 'Apache-2.0', 'CC0-1.0', 'Unlicense']) {
    assert.equal(licenceTier(id).tier, 'GREEN', id);
    assert.equal(licenceTier(id).obligations, false, id);
  }
});

test('MUST PASS — copyleft and attribution licences are AMBER, and carry obligations', () => {
  for (const id of ['CC-BY-4.0', 'GPL-3.0-only', 'MPL-2.0', 'LGPL-3.0-only']) {
    assert.equal(licenceTier(id).tier, 'AMBER', id);
    assert.equal(licenceTier(id).obligations, true, id);
  }
});

test('MUST FAIL — every -NC licence is RED', () => {
  for (const id of ['CC-BY-NC-4.0', 'CC-BY-NC-SA-3.0', 'CC-BY-NC-ND-4.0']) {
    assert.equal(licenceTier(id).tier, 'RED', id);
    assert.match(licenceTier(id).why, /non-commercial/);
  }
});

test('MUST FAIL — every -ND licence is RED', () => {
  assert.equal(licenceTier('CC-BY-ND-4.0').tier, 'RED');
  assert.match(licenceTier('CC-BY-ND-4.0').why, /derivatives/);
});

test('MUST FAIL — the -NC check runs BEFORE the allow-list, so CC-BY-NC-4.0 never matches CC-BY-4.0', () => {
  assert.equal(licenceTier('CC-BY-4.0').tier, 'AMBER');
  assert.equal(licenceTier('CC-BY-NC-4.0').tier, 'RED',
    'a loose match against the AMBER list would let a non-commercial asset through — the whole point of ordering the checks');
});

test('MUST FAIL — unknown is RED, never AMBER. This is the rule that keeps -NC out of a public project', () => {
  for (const id of [null, undefined, '', '   ', 'unknown', 'n/a', 'proprietary', 'custom-eula', 'TBD']) {
    assert.equal(licenceTier(id).tier, 'RED', JSON.stringify(id));
  }
});

test('a placeholder cannot satisfy the gate — normaliseField treats it as absent', () => {
  assert.equal(normaliseField('unknown'), null);
  assert.equal(normaliseField('  N/A '), null);
  assert.equal(normaliseField(''), null);
  assert.equal(normaliseField('MIT'), 'MIT');
  assert.equal(normaliseField('  MIT  '), 'MIT', 'trimmed, not rejected');
});

// ── S4 named exclusions ────────────────────────────────────────────────────────────────────────

test('MUST FAIL — Shadertoy is excluded by name, and the reason names BOTH disqualifiers', () => {
  const e = excludedSource('https://www.shadertoy.com/view/abc123');
  assert.equal(e.name, 'shadertoy');
  assert.match(e.reason, /non-commercial/i);
  assert.match(e.reason, /viral|share-alike/i);
});

test('MUST FAIL — unDraw is excluded, naming repackaging AND AI-training', () => {
  const e = excludedSource('https://undraw.co/illustrations');
  assert.equal(e.name, 'undraw');
  assert.match(e.reason, /repackag/i);
  assert.match(e.reason, /AI-training/i);
});

test('MUST FAIL — Rive is excluded at INGEST, not left to fail at render three stages later', () => {
  assert.equal(excludedSource('https://rive.app/community/x').name, 'rive');
  assert.equal(excludedSource('/assets/hero.riv').name, 'rive');
  assert.match(NAMED_EXCLUSIONS.rive.reason, /no-wasm/);
});

test('MUST PASS — an ordinary source URL is not excluded', () => {
  assert.equal(excludedSource('https://github.com/shadcn-ui/ui'), null);
  assert.equal(excludedSource(null), null);
});

// ── S3 origin routing ──────────────────────────────────────────────────────────────────────────

test('origin: our own work needs less than a third-party pull, and that is deliberate', () => {
  assert.equal(originOf({ library: 'ottomate' }), 'authored');
  assert.equal(originOf({ ingestion_method: 'hand-authored' }), 'authored');
  assert.equal(originOf({ library: 'magicui' }), 'third-party');
  assert.equal(originOf({}), 'third-party', 'unknown origin defaults to the STRICTER requirement');
});

// ── S3 the gate ────────────────────────────────────────────────────────────────────────────────

const AUTHORED_OK = { library: 'ottomate', author: 'pdsv', spdx_id: 'MIT' };
const THIRD_PARTY_OK = {
  library: 'magicui', author: 'magicui', spdx_id: 'MIT',
  source_url: 'https://magicui.design/x', licence_url: 'https://magicui.design/licence',
  attribution: 'MagicUI, MIT', retrieved_at: 1785160000000,
};

test('MUST PASS — an authored component with author + spdx ingests and is catalog-visible', () => {
  const v = validateProvenance(AUTHORED_OK);
  assert.equal(v.ok, true);
  assert.equal(v.quarantine, false);
  assert.equal(v.licence.tier, 'GREEN');
});

test('MUST PASS — a fully-provenanced third-party component ingests', () => {
  const v = validateProvenance(THIRD_PARTY_OK);
  assert.equal(v.ok, true, v.reason);
  assert.equal(v.quarantine, false);
});

test('MUST FAIL — a third-party component with no spdx_id is QUARANTINED, not refused', () => {
  const v = validateProvenance({ ...THIRD_PARTY_OK, spdx_id: null });
  assert.equal(v.ok, false);
  assert.equal(v.quarantine, true, 'quarantine keeps the work and makes the gap visible; refusing loses it');
  assert.match(v.reason, /licence RED/);
});

test('MUST FAIL — spdx_id of "" or "unknown" is treated as ABSENT, not as a value', () => {
  for (const bad of ['', 'unknown', '   ']) {
    const v = validateProvenance({ ...THIRD_PARTY_OK, spdx_id: bad });
    assert.equal(v.ok, false, JSON.stringify(bad));
    assert.ok(v.missing.includes('spdx_id'), 'it must count as MISSING, not as a supplied value');
  }
});

test('MUST FAIL — a third-party component missing only attribution still fails', () => {
  const v = validateProvenance({ ...THIRD_PARTY_OK, attribution: null });
  assert.equal(v.ok, false);
  assert.deepEqual(v.missing, ['attribution']);
});

test('MUST PASS — the same missing field does NOT fail an authored component, because it is not required', () => {
  assert.equal(validateProvenance({ ...AUTHORED_OK, attribution: null }).ok, true);
});

test('MUST FAIL — a RED licence blocks even when every provenance field is present', () => {
  const v = validateProvenance({ ...THIRD_PARTY_OK, spdx_id: 'CC-BY-NC-SA-3.0' });
  assert.equal(v.ok, false);
  assert.equal(v.missing.length, 0, 'nothing is missing — the licence alone is the blocker');
});

test('MUST FAIL — an excluded source blocks even with a GREEN licence declared', () => {
  const v = validateProvenance({ ...THIRD_PARTY_OK, spdx_id: 'MIT', source_url: 'https://www.shadertoy.com/view/x' });
  assert.equal(v.ok, false);
  assert.equal(v.excluded.name, 'shadertoy');
});

test('MUST FAIL — a CC0 component with a trademark is NOT cleared by its GREEN tier', () => {
  const v = validateProvenance({ ...AUTHORED_OK, spdx_id: 'CC0-1.0', trademark_flag: true });
  assert.equal(v.licence.tier, 'GREEN');
  assert.equal(v.trademark, true);
  assert.equal(v.warnings.length, 1);
  assert.match(v.warnings[0], /does not waive it/);
});

// ── the owner's grandfathering decision ────────────────────────────────────────────────────────

test('MUST PASS — grandfather marks a pre-rule row as debt instead of quarantining it', () => {
  const v = validateProvenance({ library: 'magicui', spdx_id: 'MIT', author: 'x' }, { grandfather: true });
  assert.equal(v.ok, false, 'it is still not complete — the debt is recorded, not forgiven');
  assert.equal(v.provenance_debt, true);
  assert.equal(v.quarantine, false);
});

test('MUST FAIL — grandfathering NEVER rescues a RED licence or an excluded source', () => {
  const red = validateProvenance({ library: 'magicui', spdx_id: 'CC-BY-NC-4.0' }, { grandfather: true });
  assert.equal(red.provenance_debt, false);
  assert.equal(red.quarantine, true, 'a missing field is a debt; a non-commercial licence is not');

  const ex = validateProvenance(
    { library: 'x', spdx_id: 'MIT', author: 'a', source_url: 'https://undraw.co/i' }, { grandfather: true },
  );
  assert.equal(ex.provenance_debt, false);
  assert.equal(ex.quarantine, true);
});

test('MUST PASS — grandfather is opt-in; without it the same row quarantines', () => {
  const rec = { library: 'magicui', spdx_id: 'MIT', author: 'x' };
  assert.equal(validateProvenance(rec).quarantine, true);
  assert.equal(validateProvenance(rec, { grandfather: true }).quarantine, false);
});
