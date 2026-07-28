// Tests for taste-packet.mjs — parse the real profile + the anti-slop tier FLIP with a control.
// run: node --test taste-packet.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTaste, parseTasteProfile, buildTastePacket, antiSlopTierFor, DOCTRINE_TELLS } from './taste-packet.mjs';

const taste = loadTaste(); // reads the real references/taste-profile.md

test('the real profile parses to bold/expressive with the loved tells wanted', () => {
  assert.match(taste.oneLine, /bold/i);
  assert.equal(taste.motionBudget, 'expressive');
  assert.equal(taste.delight, true);
  // the tells the owner A-graded are marked wanted
  for (const t of ['glow', 'gradient-text', 'glassmorphism']) assert.ok(taste.wanted.includes(t), `${t} should be wanted`);
  assert.equal(taste.antiSlop.tier, 'advisory');
});

test('buildTastePacket is compact and carries the advisory flag + wanted tells', () => {
  const p = buildTastePacket(taste);
  assert.equal(p.antiSlopAdvisory, true);
  assert.equal(p.motionBudget, 'expressive');
  assert.ok(p.loves.length > 0 && p.loves.length <= 8);
  assert.ok(p.wantedTells.includes('glow'));
  assert.equal(p.source, 'references/taste-profile.md');
});

// THE FLIP + THE CONTROL: a wanted tell downgrades for this owner, but NOT without taste, and NOT for
// a tell the owner did not ask for. A flip that flips everything unconditionally is not evidence.
test('antiSlopTierFor downgrades a WANTED tell to advisory for this owner', () => {
  assert.equal(antiSlopTierFor('glow', 'block_owner', taste), 'advisory');
  assert.equal(antiSlopTierFor('gradient-text', 'block_owner', taste), 'advisory');
  assert.equal(antiSlopTierFor('glassmorphism', 'block_owner', taste), 'advisory');
});

test('CONTROL — with NO taste, the same tell stays blocking', () => {
  assert.equal(antiSlopTierFor('glow', 'block_owner', null), 'block_owner');
  const neutral = { antiSlop: { tier: 'block_owner' }, wanted: [] };
  assert.equal(antiSlopTierFor('glow', 'block_owner', neutral), 'block_owner');
});

test('CONTROL — a tell the owner did NOT mark wanted is not downgraded', () => {
  // neumorphism is a doctrine tell the profile does not love → stays at its base tier.
  const t = parseTasteProfile('## One line\n**Bold.**\n## Avoid\nflat.\nanti-slop is ADVISORY, never blocking\n- I love **glow**');
  assert.ok(!t.wanted.includes('neumorphism'));
  assert.equal(antiSlopTierFor('neumorphism', 'block_owner', t), 'block_owner');
  assert.equal(antiSlopTierFor('glow', 'block_owner', t), 'advisory');
});

test('floors are never passed through this function, so they can never be downgraded', () => {
  // contrast / reduced-motion are not doctrine TELLS; a caller only ever asks about aesthetic tells.
  assert.ok(!DOCTRINE_TELLS.includes('contrast'));
  assert.ok(!DOCTRINE_TELLS.includes('reduced-motion'));
});
