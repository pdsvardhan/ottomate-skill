// Tests for intake.mjs (Phase 2 P2.4). run: node --test intake.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadIntake, validateIntake, allQuestions, askableStages, prefillIntake, applicableQuestions, questionsForRebuild } from './intake.mjs';

test('the intake has 5 stages, ~30 questions, and VALIDATES (every default is in its enum)', () => {
  const intake = loadIntake();
  assert.equal(intake.stages.length, 5);
  const qs = allQuestions(intake);
  assert.ok(qs.length >= 25 && qs.length <= 35, `~30 questions, got ${qs.length}`);
  const v = validateIntake(intake);
  assert.equal(v.ok, true, v.errors.join('\n'));
});

test('a default NOT in its enum FAILS validation (must-fail)', () => {
  const bad = { stages: [1, 2, 3, 4, { id: 'x', questions: [{ id: 'q', q: 'Q', enum: ['a', 'b'], default: 'c' }] }] };
  const v = validateIntake(bad);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /not in its enum/.test(e)));
});

test('askableStages excludes the silent constraints stage', () => {
  const asked = askableStages();
  assert.ok(asked.every((s) => !s.silent));
  assert.ok(!asked.some((s) => s.id === 'constraints'));
});

// THE PRE-FILL is real: repo/ledger/taste/token evidence fills the defaults (cointrail-like project).
test('pre-fill derives answers from repo + ledger + taste + tokens (not blank questions)', () => {
  const evidence = {
    files: ['transactions.ts', 'spending-analysis.tsx', 'category-breakdown.tsx'],
    hasDarkTokens: true, hasGlassTokens: true, radiusRem: true,
    ledgerContext: { profile: 'P1' },
    taste: { motionBudget: 'expressive', delight: true },
  };
  const pf = prefillIntake(evidence);
  assert.equal(pf['primary-data'].value, 'financial');   // "transaction"/"spend" in repo
  assert.equal(pf['primary-data'].source, 'repo');
  assert.equal(pf['audience'].value, 'P1-owner');         // ledger profile P1
  assert.equal(pf['data-relationship'].value, 'part-to-whole'); // "breakdown"/"category"
  assert.equal(pf['theme-mode'].value, 'both');           // dark tokens present
  assert.equal(pf['surface-treatment'].value, 'glass');   // glass tokens present
  assert.equal(pf['radius-scale'].value, 'rounded');      // radius in rem
  assert.equal(pf['motion-budget'].value, 'expressive');  // taste
  assert.equal(pf['motion-budget'].source, 'taste');
  assert.ok(pf['motion-budget'].prefilled);
});

test('with no evidence, every question falls back to its static default (source=default)', () => {
  const pf = prefillIntake({});
  assert.equal(pf['primary-data'].value, 'analytics');
  assert.equal(pf['primary-data'].source, 'default');
  assert.equal(pf['primary-data'].prefilled, false);
});

test('applicableQuestions drops a conditional (dashboard-subtype) unless its when is met', () => {
  assert.ok(!applicableQuestions({ archetype: 'landing' }).some((q) => q.id === 'dashboard-subtype'));
  assert.ok(applicableQuestions({ archetype: 'dashboard' }).some((q) => q.id === 'dashboard-subtype'));
});

test('questionsForRebuild returns only the named stages (re-run only what changed)', () => {
  const only = questionsForRebuild(['style']);
  assert.ok(only.length > 0 && only.every((q) => q.stage === 'style'));
  assert.ok(only.some((q) => q.id === 'theme-mode'));
});
