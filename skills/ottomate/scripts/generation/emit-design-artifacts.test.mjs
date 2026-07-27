// U5 — locked picks become code.
// run: node --test emit-design-artifacts.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildArtifacts, emitToRepo, repoGuards, tokenName, formatEmit, TOKENS_FILE, SPEC_FILE, ARTIFACT_DIR } from './emit-design-artifacts.mjs';

const d = (o) => ({ id: 1, status: 'locked', target_id: 'screenroom.poster-card', axis: 'media-card.corner-radius', chosen_value: '4px', round: 1, ...o });

test('a token-shaped pick becomes a CSS custom property', () => {
  const a = buildArtifacts([d({})], { project: 'screenroom' });
  assert.equal(a.tokens.length, 1);
  assert.match(a.css, /--poster-card-radius: 4px;/);
  assert.match(a.css, /media-card\.corner-radius/);
});

test('a STRUCTURAL pick cannot be a custom property, so it goes to the spec', () => {
  const a = buildArtifacts([d({ id: 2, axis: 'media-card.title-placement', chosen_value: 'below-media' })], { project: 'screenroom' });
  assert.equal(a.tokens.length, 0);
  assert.equal(a.structural.length, 1);
  assert.equal(a.spec.decisions[0].value, 'below-media');
});

test('structural picks are ECHOED in the CSS — a decision invisible from the code gets violated', () => {
  const a = buildArtifacts([d({ id: 2, axis: 'media-card.media-aspect', chosen_value: '16/9' })], { project: 'x' });
  assert.match(a.css, /Structural decisions/);
  assert.match(a.css, /media-card\.media-aspect = 16\/9/);
});

test('ONLY locked decisions are emitted — a proposal is not a decision', () => {
  const a = buildArtifacts([d({ status: 'proposed' }), d({ id: 3, status: 'in-review' }), d({ id: 4, status: 'rejected' })], {});
  assert.equal(a.tokens.length, 0);
  assert.match(a.css, /no token-shaped decisions are locked yet/);
});

test('a locked row with no chosen_value is not emitted', () => {
  assert.equal(buildArtifacts([d({ chosen_value: null })], {}).tokens.length, 0);
});

test('a question outside the registry is SKIPPED and reported, never guessed at', () => {
  const a = buildArtifacts([d({ axis: 'media-card.vibe-level' })], {});
  assert.equal(a.skipped.length, 1);
  assert.match(a.skipped[0].why, /not in the registry/);
});

test('token names are namespaced by target, so two components cannot collide', () => {
  assert.equal(tokenName('--{t}-radius', 'screenroom.poster-card'), '--poster-card-radius');
  assert.equal(tokenName('--{t}-radius', 'screenroom.collection-card'), '--collection-card-radius');
});

test('the header names the source rows, so the file traces back to the ledger', () => {
  const a = buildArtifacts([d({ id: 42 })], { project: 'screenroom' });
  assert.match(a.css, /status=locked \(ids 42\)/);
  assert.match(a.css, /do not edit by hand/);
});

// ── the repo side, against a real throwaway git repo ────────────────────────────────────────────
function repo() {
  const r = mkdtempSync(path.join(tmpdir(), 'otto-emit-'));
  execFileSync('git', ['-C', r, 'init', '-q']);
  execFileSync('git', ['-C', r, 'config', 'user.email', 't@t']);
  execFileSync('git', ['-C', r, 'config', 'user.name', 't']);
  writeFileSync(path.join(r, 'README.md'), '#\n');
  execFileSync('git', ['-C', r, 'add', '.']);
  execFileSync('git', ['-C', r, 'commit', '-qm', 'init']);
  return r;
}

test('writes both files and COMMITS on the branch — and does not push', () => {
  const r = repo();
  const a = buildArtifacts([d({}), d({ id: 2, axis: 'media-card.title-placement', chosen_value: 'overlay' })], { project: 'p' });
  const res = emitToRepo(r, a, { project: 'p', round: 1 });
  assert.equal(res.ok, true);
  assert.ok(res.committed, 'should have committed');
  assert.ok(existsSync(path.join(r, ARTIFACT_DIR, TOKENS_FILE)));
  assert.ok(existsSync(path.join(r, ARTIFACT_DIR, SPEC_FILE)));
  const msg = execFileSync('git', ['-C', r, 'log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  assert.match(msg, /design: apply locked decisions from round 1/);
  assert.match(msg, /Not pushed and not deployed/);
  assert.equal(execFileSync('git', ['-C', r, 'remote'], { encoding: 'utf8' }).trim(), '', 'no remote — nothing could have been pushed');
});

test('MUST FAIL — refuses when design/ has uncommitted changes', () => {
  const r = repo();
  mkdirSync(path.join(r, ARTIFACT_DIR), { recursive: true });
  writeFileSync(path.join(r, ARTIFACT_DIR, TOKENS_FILE), '/* hand-edited */\n');
  const res = emitToRepo(r, buildArtifacts([d({})], {}), { project: 'p' });
  assert.equal(res.ok, false);
  assert.match(res.refused.join(' '), /uncommitted changes/);
  assert.equal(readFileSync(path.join(r, ARTIFACT_DIR, TOKENS_FILE), 'utf8'), '/* hand-edited */\n', 'the hand edit must survive untouched');
});

test('MUST FAIL — refuses outright when the target is not a git repo', () => {
  const res = emitToRepo(mkdtempSync(path.join(tmpdir(), 'otto-nogit-')), buildArtifacts([d({})], {}), {});
  assert.equal(res.ok, false);
  assert.match(res.refused.join(' '), /not a git repository/);
});

test('--dry-run prints the content and writes nothing', () => {
  const r = repo();
  const res = emitToRepo(r, buildArtifacts([d({})], {}), { project: 'p', dryRun: true });
  assert.equal(res.dryRun, true);
  assert.match(res.css, /--poster-card-radius/);
  assert.equal(existsSync(path.join(r, ARTIFACT_DIR, TOKENS_FILE)), false, 'dry run must not write');
});

test('re-emitting identical artifacts is a no-op, not an empty commit', () => {
  const r = repo();
  const a = buildArtifacts([d({})], { project: 'p', now: new Date('2026-07-27T00:00:00Z') });
  emitToRepo(r, a, { project: 'p' });
  const first = execFileSync('git', ['-C', r, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const again = emitToRepo(r, a, { project: 'p' });
  assert.equal(again.unchanged, true);
  assert.equal(execFileSync('git', ['-C', r, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), first);
});

test('the artifact dir is a dedicated subdirectory, never a shared design/ folder', () => {
  // Screenroom's design/ has 159 tracked files; owning it would bury our output and couple the
  // dirty-tree guard to every unrelated edit in there.
  assert.equal(ARTIFACT_DIR, 'design/ottomate');
});

test('a dirty file elsewhere in design/ does NOT block us — only our own subdirectory counts', () => {
  const r = repo();
  mkdirSync(path.join(r, 'design'), { recursive: true });
  writeFileSync(path.join(r, 'design', 'someone-elses-prototype.html'), '<p>wip</p>');
  assert.deepEqual(repoGuards(r), [], 'an unrelated file in design/ must not stop us');
});

test('guards report a clean repo as safe', () => {
  assert.deepEqual(repoGuards(repo()), []);
});

// ── C1 — resolving an unregistered locked decision (2026-07-28), or failing loudly ────────────────
// Live state: all 13 locked screenroom decisions are target_kind:"page", novel-question, enum-valued.
// The resolution has three outcomes, never blurred: token · structural · unresolved.

// A novel question with a CSS-shaped value on a component target — the ONLY case that could tempt a
// fabricated token, and the one that must STOP without corroborating source.
const novelToken = (o = {}) => ({ id: 9, status: 'locked', axis: 'card.glow-spread', chosen_value: '8px', target_id: 'x.card', ...o });

test('MUST PASS — a page-scope novel decision resolves to a STRUCTURAL spec entry, the emit goes green', () => {
  // The exact row that was silently dropped before C1: library-list.surface-strategy = reuse-browse-surface.
  const r = repo();
  const decisions = [{ id: 40, status: 'locked', axis: 'library-list.surface-strategy', chosen_value: 'reuse-browse-surface', target_id: 'screenroom.library-lists', target_kind: 'page' }];
  const a = buildArtifacts(decisions, { project: 'screenroom' });
  assert.equal(a.skipped.length, 0, 'a page-scope structural decision must not block the emit');
  assert.equal(a.structural.length, 1);
  assert.equal(a.structural[0].derived, true, 'it is resolved outside the registry, so it is labelled derived');
  assert.match(a.structural[0].evidence.why, /not in the universal registry/);
  assert.equal(a.spec.decisions[0].value, 'reuse-browse-surface', 'recorded verbatim into the spec');
  assert.equal(a.spec.decisions[0].derived, true);
  assert.match(a.css, /surface-strategy = reuse-browse-surface.*\[derived/, 'echoed in the CSS, marked derived');
  assert.equal(emitToRepo(r, a, { project: 'screenroom', dryRun: true }).ok, true);
});

test('MUST FAIL — a novel CSS-shaped decision with NO corroborating source is UNRESOLVED and blocks, writing nothing', () => {
  const r = repo();
  const a = buildArtifacts([novelToken()], { project: 'p' }); // no sourceLoader
  assert.equal(a.skipped.length, 1, 'precondition: nothing can corroborate an invented token');
  assert.equal(a.tokens.length, 0, 'a fabricated custom property is exactly what must NOT happen');
  const res = emitToRepo(r, a, { project: 'p' });
  assert.equal(res.ok, false);
  assert.match(res.refused.join('\n'), /card\.glow-spread/);
  assert.match(res.refused.join('\n'), /invent a custom property/);
  assert.equal(existsSync(path.join(r, 'design')), false, 'nothing was written');
});

test('MUST PASS — the SAME novel axis mints a token when the target source corroborates it, namespaced by target', () => {
  const sourceLoader = (t) => t === 'x.card' ? { source: '<div className="card"/>', css: '.card{ --glow-spread: 4px }' } : null;
  const a = buildArtifacts([novelToken()], { project: 'p', sourceLoader });
  assert.equal(a.skipped.length, 0);
  assert.equal(a.tokens.length, 1);
  assert.equal(a.tokens[0].token, '--card-glow-spread', 'deterministic, namespaced by the target leaf');
  assert.equal(a.tokens[0].derived, true);
  assert.equal(a.tokens[0].evidence.how, 'source-corroborated');
});

test('MUST FAIL — corroboration refuses when the source does NOT contain the axis (the invention guard survives the wiring)', () => {
  const sourceLoader = () => ({ source: '<div className="card"/>', css: '.card{ color:#fff }' }); // no glow-spread anywhere
  const a = buildArtifacts([novelToken()], { project: 'p', sourceLoader });
  assert.equal(a.tokens.length, 0, 'a token must never be minted from a source that does not support it');
  assert.equal(a.skipped.length, 1);
  assert.match(a.skipped[0].why, /nothing in the target's source matches/);
});

test('MUST FAIL — the refusal fires even when OTHER decisions resolve cleanly (a partial emit is the trap)', () => {
  const r = repo();
  const decisions = [
    { id: 1, status: 'locked', axis: 'media-card.corner-radius', chosen_value: '12px', target_id: 'x.card' },
    novelToken({ id: 2, target_id: 'x.list' }),
  ];
  const a = buildArtifacts(decisions, { project: 'p' }); // no sourceLoader → the novel one is unresolved
  assert.ok(a.tokens.length >= 1, 'precondition: one axis DOES resolve');
  assert.equal(a.skipped.length, 1);
  assert.equal(emitToRepo(r, a, { project: 'p' }).ok, false, 'a green run that quietly omits one locked decision is exactly the failure');
});

test('MUST PASS — --allow-skipped emits anyway, because dropping them is then said out loud', () => {
  const r = repo();
  const a = buildArtifacts([{ id: 1, status: 'locked', axis: 'media-card.corner-radius', chosen_value: '12px', target_id: 'x.card' }, novelToken({ id: 2, target_id: 'x.list' })], { project: 'p' });
  assert.equal(emitToRepo(r, a, { project: 'p', allowSkipped: true, dryRun: true }).ok, true);
});

test('MUST PASS — a fully resolvable set is unaffected by the new guard', () => {
  const r = repo();
  const a = buildArtifacts([{ id: 1, status: 'locked', axis: 'media-card.corner-radius', chosen_value: '12px', target_id: 'x.card' }], { project: 'p' });
  assert.equal(a.skipped.length, 0);
  assert.equal(emitToRepo(r, a, { project: 'p', dryRun: true }).ok, true);
});

test('the report calls it UNRESOLVED and says it blocks — "SKIPPED" read like a note', () => {
  assert.match(formatEmit(buildArtifacts([novelToken()], { project: 'p' })), /UNRESOLVED \(blocks emit\)/);
});
