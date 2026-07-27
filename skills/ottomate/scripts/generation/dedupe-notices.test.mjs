// Stage 4 S7 + S8. Must-FAIL and must-PASS per rule.

import test from 'node:test';
import assert from 'node:assert/strict';
import { structuralSimilarity, findDuplicates, preferSurvivor, THRESHOLDS } from './dedupe.mjs';
import { buildNotices } from './notices.mjs';

const CARD_A = `<div class="card shadow"><img class="poster"/><h3 class="title">x</h3></div>
  .card { border-radius: 8px; background: var(--s); }`;
// Same component, re-typed: different class names and markup order, same rendered thing.
const CARD_REIMPL = `<article class="tile elevated"><picture class="art"/><h3 class="name">x</h3></article>
  .tile { border-radius: 8px; background: var(--s); }`;
const TABLE = `<table class="grid"><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>
  .grid { border-collapse: collapse; font-variant-numeric: tabular-nums; }`;

// A 2x1 PNG-shaped record matching what png-decode returns.
const img = (px) => ({ width: px.length, height: 1, channels: 4,
  data: Uint8Array.from(px.flatMap((c) => [...c, 255])) });
const RED_IMG = img([[220, 30, 30], [220, 30, 30]]);
const RED_IMG2 = img([[220, 30, 30], [220, 30, 30]]);
const BLUE_IMG = img([[20, 40, 220], [20, 40, 220]]);

// ── S7 structural ──────────────────────────────────────────────────────────────────────────────

test('MUST PASS — the same source scores 1.0 against itself', () => {
  assert.equal(structuralSimilarity(CARD_A, CARD_A), 1);
});

test('MUST PASS — two genuinely different components score well below the near bar', () => {
  const s = structuralSimilarity(CARD_A, TABLE);
  assert.ok(s < THRESHOLDS.structural_near, `expected < ${THRESHOLDS.structural_near}, got ${s}`);
});

test('an empty source is UNMEASURABLE (null), never scored as "different"', () => {
  assert.equal(structuralSimilarity('', CARD_A), null);
  assert.equal(structuralSimilarity(null, CARD_A), null);
});

test('the dedupe bar is HIGH, and deliberately not P2\'s low divergence floor', () => {
  assert.ok(THRESHOLDS.structural_same >= 0.95);
  assert.ok(THRESHOLDS.visual_same_max_fraction <= 0.05,
    'P2 asks "different enough?" with a 0.005 floor; dedupe asks the opposite and must not reuse it');
});

// ── S7 the two measures catch different things ─────────────────────────────────────────────────

test('MUST PASS — an exact re-upload is caught by BOTH measures', () => {
  const r = findDuplicates(
    { id: 'mc-new', src: CARD_A, png: RED_IMG },
    [{ id: 'mc-old', src: CARD_A, png: RED_IMG2 }],
  );
  assert.equal(r.duplicates.length, 1);
  assert.equal(r.duplicates[0].by, 'both');
});

test('MUST FAIL — a RE-IMPLEMENTATION passes structurally and is caught VISUALLY', () => {
  // This is the case structural-only dedupe misses, and the reason H1 asks for both.
  const s = structuralSimilarity(CARD_A, CARD_REIMPL);
  assert.ok(s < THRESHOLDS.structural_same, `structural must NOT flag it (got ${s})`);

  const r = findDuplicates(
    { id: 'mc-new', src: CARD_REIMPL, png: RED_IMG },
    [{ id: 'mc-old', src: CARD_A, png: RED_IMG2 }],
  );
  assert.equal(r.duplicates.length, 1);
  assert.match(r.duplicates[0].by, /visual-only/);
});

test('MUST PASS — two genuinely different components are not flagged by either measure', () => {
  const r = findDuplicates(
    { id: 'mc-new', src: TABLE, png: BLUE_IMG },
    [{ id: 'mc-old', src: CARD_A, png: RED_IMG }],
  );
  assert.equal(r.duplicates.length, 0);
});

test('a visual check runs even when the structural score is low — that is the point', () => {
  const r = findDuplicates(
    { id: 'a', src: TABLE, png: RED_IMG },
    [{ id: 'b', src: CARD_A, png: RED_IMG2 }],
  );
  assert.equal(r.visualChecks, 1);
});

test('with no pixels available, only the structural half runs — and says so by omission', () => {
  const r = findDuplicates({ id: 'a', src: CARD_A }, [{ id: 'b', src: CARD_A }]);
  assert.equal(r.visualChecks, 0);
  assert.equal(r.duplicates[0].visual, null);
  assert.equal(r.duplicates[0].by, 'structural');
});

test('a duplicate is REPORTED, never auto-rejected', () => {
  const r = findDuplicates({ id: 'a', src: CARD_A }, [{ id: 'b', src: CARD_A }]);
  assert.equal(r.duplicates[0].action, 'report');
});

test('the better-provenanced duplicate survives; an equal pair is an owner judgement, not a rule', () => {
  const good = { id: 'good', spdx_id: 'MIT', author: 'x', source_url: 'u' };
  const poor = { id: 'poor', provenance_debt: true };
  assert.equal(preferSurvivor(good, poor).survivor, 'good');
  assert.equal(preferSurvivor(good, { id: 'other', spdx_id: 'MIT', author: 'y', source_url: 'v' }).survivor, null);
});

// ── S8 NOTICES ─────────────────────────────────────────────────────────────────────────────────

const CATALOG = [
  { id: 'mc-a', name: 'A', spdx_id: 'MIT', author: 'x', used_in_projects: ['demo'] },
  { id: 'mc-b', name: 'B', spdx_id: 'MIT', author: 'y', used_in_projects: ['demo'] },
  { id: 'mc-c', name: 'C', spdx_id: 'CC-BY-4.0', author: 'Carol', licence_url: 'https://cc/by', source_url: 'https://s/c', used_in_projects: ['demo'] },
  { id: 'mc-d', name: 'D', spdx_id: 'GPL-3.0-only', author: 'Dan', used_in_projects: ['demo'] },
  { id: 'mc-elsewhere', name: 'E', spdx_id: 'MIT', author: 'z', used_in_projects: ['other'] },
];

test('MUST PASS — a project using two AMBER components gets both itemised with author and licence URL', () => {
  const n = buildNotices('demo', CATALOG);
  assert.equal(n.ok, true, n.blockers.join(' | '));
  assert.equal(n.used, 4, 'only components used by THIS project');
  assert.match(n.text, /### C \(`mc-c`\)/);
  assert.match(n.text, /Licence: CC-BY-4\.0 — https:\/\/cc\/by/);
  assert.match(n.text, /Author: Carol/);
  assert.match(n.text, /### D \(`mc-d`\)/);
});

test('a component used by ANOTHER project never appears — noise is how an obligation gets missed', () => {
  assert.ok(!buildNotices('demo', CATALOG).text.includes('mc-elsewhere'));
});

test('permissive licences are SUMMARISED, not itemised, so the AMBER ones stay visible', () => {
  const n = buildNotices('demo', CATALOG);
  assert.match(n.text, /\*\*MIT\*\* \(2\): mc-a, mc-b/);
});

test('MUST FAIL — an attribution-requiring licence with no author BLOCKS, naming the id', () => {
  const bad = [{ id: 'mc-x', name: 'X', spdx_id: 'CC-BY-4.0', used_in_projects: ['demo'] }];
  const n = buildNotices('demo', bad);
  assert.equal(n.ok, false);
  assert.equal(n.text, null, 'a NOTICES file with a blank attribution line looks discharged and is worse than none');
  assert.match(n.blockers[0], /mc-x/);
  assert.match(n.blockers[0], /requires attribution/);
});

test('MUST FAIL — a RED-licence component in a shipped project blocks outright', () => {
  const bad = [{ id: 'mc-nc', name: 'NC', spdx_id: 'CC-BY-NC-4.0', author: 'a', used_in_projects: ['demo'] }];
  const n = buildNotices('demo', bad);
  assert.equal(n.ok, false);
  assert.match(n.blockers[0], /must not be in a shipped project/);
});

test('MUST PASS — a trademark is surfaced in NOTICES even under a permissive licence', () => {
  const tm = [{ id: 'mc-l', name: 'L', spdx_id: 'CC-BY-4.0', author: 'a', trademark_flag: true, used_in_projects: ['demo'] }];
  const n = buildNotices('demo', tm);
  assert.equal(n.ok, true);
  assert.match(n.text, /Trademark/);
});

test('a project using nothing produces a valid, empty NOTICES rather than an error', () => {
  const n = buildNotices('nobody', CATALOG);
  assert.equal(n.ok, true);
  assert.equal(n.used, 0);
});
