// emit-design-artifacts.mjs — a locked round becomes CODE.
//
// U5, 2026-07-27. Locked spec §12 criterion 6 ("output = a design spec handed to Stage 3") was the
// one criterion with nothing behind it at all: the pipeline produced strings like
// `corner-radius = 4px` and stopped. `stage3DesignGate` only ever checked that decisions EXISTED.
//
// Owner rulings this is built to (D9, D12, D13):
//   - the primary artifact is a REAL CSS token file the project imports, not a spec document;
//   - the picks that cannot be a custom property (title placement, media aspect, meta density —
//     5 of the 20 questions) go to a small machine-readable spec AND are echoed as comments in the
//     CSS, so no decision is invisible from the code;
//   - it writes and COMMITS on the project's branch. It never pushes and never deploys.
//
// Blast radius is the real risk here — this is the only thing in Stage 1 that writes into someone
// else's repo. The limits below are not configurable: only paths under `design/`, refuse on a dirty
// tree, never push, and `--dry-run` prints the exact diff.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { questionRegistry } from './anatomy.mjs';
import { collectEvidence } from './anatomy-derive.mjs';

// A DEDICATED subdirectory, not `design/` itself. Found by the first dry run against a real repo
// (2026-07-27): Screenroom's `design/` already holds 159 tracked files — prototypes, data, templates,
// handover notes. Writing generated artifacts in there would bury them, and it would couple our
// dirty-tree guard to every unrelated edit anyone makes in that folder. Own a narrow path instead.
export const ARTIFACT_DIR = 'design/ottomate';
export const TOKENS_FILE = 'ottomate-tokens.css';
export const SPEC_FILE = 'ottomate-design-spec.json';

function axisParts(axis) {
  const i = String(axis).lastIndexOf('.');
  return i === -1 ? { archetype: '', question: String(axis) } : { archetype: axis.slice(0, i), question: axis.slice(i + 1) };
}

/** `--{t}-radius` with {t} filled from the target — a stable, collision-free custom-property name. */
export function tokenName(template, targetId) {
  const leaf = String(targetId).split('.').pop().replace(/[^a-zA-Z0-9-]+/g, '-');
  return String(template).replace('{t}', leaf);
}

/** A deterministic, target-namespaced token name for a DERIVED axis (one the registry never defined). */
export function derivedTokenName(question, targetId) {
  return tokenName('--{t}-' + slugForToken(question), targetId);
}

function slugForToken(question) {
  return String(question).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Is this a value CSS could actually hold as a token — a length/time/angle/number, a colour, or a
 * function? Deliberately TIGHT: an enum slug like `reuse-browse-surface` or `two-racks-one-page` must
 * read as NOT-a-token, because the whole point is to keep a novel structural choice out of the CSS
 * token path where it would either be garbage or tempt a fabricated custom property.
 */
export function looksLikeCssValue(v) {
  const s = String(v ?? '').trim();
  if (!s) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return true;
  if (/^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|calc|var|clamp|min|max|linear-gradient|radial-gradient)\(/i.test(s)) return true;
  const tok = /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ms|s|deg|rad|turn|fr|ch|ex|pt|cm|mm|in)?$/;
  return s.split(/\s+/).every((t) => tok.test(t)); // "0 2px 4px" is one value, "nav-only" is not
}

/**
 * The invention guard. A novel question with a CSS-shaped value on a component target is the ONE case
 * that could produce a fabricated `--{t}-{question}`. Mint it ONLY if the target's real source
 * corroborates the axis — otherwise STOP and ask. Weak by design and openly so: it only has to refuse
 * a token nothing in the source supports, not to classify the component.
 * @param {(targetId:string)=>({source?:string,css?:string}|null)} sourceLoader
 * @param {Map} cache  per-run evidence cache, keyed by target_id
 */
function corroborate(d, question, { sourceLoader, cache }) {
  if (typeof sourceLoader !== 'function') return { ok: false, why: 'no source available to corroborate against' };
  const key = String(d.target_id);
  let ev = cache.get(key);
  if (ev === undefined) {
    const src = sourceLoader(d.target_id);
    ev = src ? collectEvidence(src.source ?? '', src.css ?? '') : null;
    cache.set(key, ev);
  }
  if (!ev) return { ok: false, why: `no source found for target "${d.target_id}"` };
  const slug = slugForToken(question);
  const hay = [...(ev.cssProps ?? []), ...(ev.classNames ?? []), ...(ev.dataRoles ?? [])].map((s) => String(s).toLowerCase());
  const matched = hay.find((h) => h.includes(slug) || slug.includes(h));
  if (matched) return { ok: true, evidence: { how: 'source-corroborated', matched, slug } };
  return { ok: false, why: `nothing in the target's source matches "${slug}"` };
}

/**
 * Resolve ONE locked decision to exactly one of: token · structural · unresolved. The three are never
 * blurred — an unresolved decision blocks the emit rather than being dropped (C1 step 1).
 */
export function resolveDecision(d, { registry = questionRegistry(), sourceLoader, cache = new Map() } = {}) {
  const { question } = axisParts(d.axis);
  const base = { id: d.id, axis: d.axis, target_id: d.target_id, question, value: String(d.chosen_value), round: d.round ?? null };
  const q = registry[question];

  // 1. Registry HIT.
  if (q) {
    const row = { ...base, channel: q.channel, scope_hint: q.scope_hint, derived: false };
    // R6 (F-12): a token-mapped question mints a TOKEN only when the chosen value is a real CSS value. An
    // ENUM value ("flat-hairline", "hairline-rule") is not valid as `--x: <value>`; the looksLikeCssValue
    // guard now gates the REGISTERED path too, so an enum routes to a STRUCTURAL record instead of minting
    // an invalid custom property. A CSS-shaped value (radius "6px") still mints a token.
    if (q.token && looksLikeCssValue(d.chosen_value)) {
      return { kind: 'token', row: { ...row, token: tokenName(q.token, d.target_id) } };
    }
    if (q.token) {
      return {
        kind: 'structural',
        row: {
          ...row,
          evidence: {
            how: 'enum-value-structural',
            why: `"${question}" maps to token ${q.token}, but the chosen value "${d.chosen_value}" is an enum, not a CSS value — recorded as a structural decision, never minted as an invalid --custom-property`,
          },
        },
      };
    }
    return { kind: 'structural', row };
  }

  // 2. Registry MISS on a page-scope OR non-CSS-shaped decision → verbatim STRUCTURAL record.
  const pageScope = d.target_kind === 'page';
  if (pageScope || !looksLikeCssValue(d.chosen_value)) {
    return {
      kind: 'structural',
      row: {
        ...base, channel: null, scope_hint: pageScope ? 'page' : 'local', derived: true,
        evidence: {
          how: 'novel-question-structural',
          why: `"${question}" is not in the universal registry; ${pageScope ? 'target_kind=page' : `value "${d.chosen_value}" is not CSS-shaped`} — recorded verbatim as a structural decision, never a token`,
        },
      },
    };
  }

  // 3. Registry MISS, CSS-shaped value, component-scope → mint a token ONLY if the source corroborates.
  const corr = corroborate(d, question, { sourceLoader, cache });
  if (corr.ok) {
    return { kind: 'token', row: { ...base, channel: null, scope_hint: 'local', derived: true, token: derivedTokenName(question, d.target_id), evidence: corr.evidence } };
  }
  return {
    kind: 'unresolved',
    row: {
      axis: d.axis,
      why: `novel question "${question}" is not in the registry and its token-shaped value "${d.chosen_value}" could not be corroborated from the target's source (${corr.why}) — refusing to invent a custom property (doctrine rule 40). Add "${question}" to the registry, or supply the target's source.`,
    },
  };
}

/**
 * PURE. Locked decisions → the two artifacts' CONTENT. No fs, no git — so the shape is unit-testable
 * without a repo.
 * @param {Array<object>} decisions  design_decisions rows (any status; only `locked` are emitted)
 * @param {object} [opts]
 * @returns {{css:string, spec:object, tokens:Array, structural:Array, skipped:Array}}
 */
export function buildArtifacts(decisions, { project = '', registry = questionRegistry(), sourceLoader, now = new Date() } = {}) {
  const locked = (decisions ?? []).filter((d) => d && d.status === 'locked' && d.chosen_value);
  const tokens = [];
  const structural = [];
  const skipped = [];
  const cache = new Map(); // one derivation per target per run (C1: a derived entry is cached)

  for (const d of locked) {
    const { kind, row } = resolveDecision(d, { registry, sourceLoader, cache });
    if (kind === 'token') tokens.push(row);
    else if (kind === 'structural') structural.push(row);
    else skipped.push(row); // unresolved — blocks the emit (C1 step 1), never silently dropped
  }

  const stamp = now.toISOString();
  const head = [
    '/* GENERATED by the Ottomate design method — do not edit by hand.',
    ` * project: ${project}`,
    ` * emitted: ${stamp}`,
    ` * source:  design_decisions rows with status=locked (ids ${locked.map((d) => d.id).join(', ') || 'none'})`,
    ' *',
    ' * Editing this file by hand will trip the regression gate on the next rebuild, which is the',
    ' * point: a locked decision that changed silently is the failure this file exists to catch.',
    ' */',
  ];
  // Structural picks are echoed here even though CSS cannot express them — a decision that is
  // invisible from the code is a decision that gets quietly violated (D12). A `derived` decision (one
  // resolved outside the universal registry, C1) is marked so a reader can tell it from a registry hit.
  const echo = structural.length
    ? ['', '/* Structural decisions — NOT expressible as custom properties.', ' * They live in ' + SPEC_FILE + ' and are applied when the component is built.',
      ...structural.map((s) => ` *   ${s.axis} = ${s.value}${s.derived ? '   [derived: not in the universal registry]' : ''}`), ' */']
    : [];
  const body = tokens.length
    ? [':root {', ...tokens.map((t) => `  ${t.token}: ${t.value};  /* ${t.axis}${t.derived ? ' [derived]' : ''} */`), '}']
    : ['/* no token-shaped decisions are locked yet */'];

  const css = [...head, ...echo, '', ...body, ''].join('\n');
  const spec = {
    $comment: 'Structural design decisions the build stage applies when writing the component. Generated; do not edit by hand.',
    project, emitted: stamp,
    decisions: structural.map(({ id, axis, target_id, question, value, round, derived, evidence }) => ({ id, axis, target_id, question, value, round, ...(derived ? { derived, evidence } : {}) })),
  };
  return { css, spec, tokens, structural, skipped };
}

// ── the repo side ───────────────────────────────────────────────────────────────────────────────

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
}

/** Refuse on anything we would be overwriting blind. Returns a list of reasons, empty when safe. */
export function repoGuards(repo) {
  const problems = [];
  if (!existsSync(path.join(repo, '.git'))) return [`${repo} is not a git repository`];
  let dirty = '';
  try { dirty = git(repo, ['status', '--porcelain', '--', ARTIFACT_DIR]); }
  catch (e) { return [`git status failed in ${repo}: ${e.message}`]; }
  if (dirty) problems.push(`${ARTIFACT_DIR}/ has uncommitted changes — refusing to overwrite:\n    ${dirty.split('\n').join('\n    ')}`);
  return problems;
}

/**
 * Write + commit. NEVER pushes (D13). Returns what it did, or what it refused to do and why.
 */
export function emitToRepo(repo, artifacts, { project, round, dryRun = false, allowSkipped = false } = {}) {
  const dir = path.join(repo, ARTIFACT_DIR);
  const cssPath = path.join(dir, TOKENS_FILE);
  const specPath = path.join(dir, SPEC_FILE);

  // C1 step 1 — FAIL LOUDLY. A locked decision whose question the registry cannot resolve used to be
  // logged as `SKIPPED …` and the emit continued, so the owner got a green run and a tokens file that
  // silently omitted a decision they had explicitly locked. That is the worst available failure mode:
  // it looks like success. The write now REFUSES until every locked decision resolves — or until the
  // caller passes `allowSkipped` and thereby says out loud that it is dropping them.
  if (artifacts.skipped?.length && !allowSkipped) {
    return {
      ok: false,
      unresolved: artifacts.skipped,
      refused: [
        `${artifacts.skipped.length} LOCKED decision(s) could not be resolved to a token or a spec entry, `
        + 'and a locked decision must never be dropped silently:',
        ...artifacts.skipped.map((s) => `  ${s.axis} — ${s.why}`),
        'Fix by giving the target an anatomy entry, or by letting anatomy-derive resolve it. '
        + 'Pass --allow-skipped only when you deliberately intend to emit without them.',
      ],
    };
  }

  const guards = repoGuards(repo);
  if (guards.length) return { ok: false, refused: guards };

  const before = {
    css: existsSync(cssPath) ? readFileSync(cssPath, 'utf8') : null,
    spec: existsSync(specPath) ? readFileSync(specPath, 'utf8') : null,
  };
  const nextSpec = JSON.stringify(artifacts.spec, null, 2) + '\n';
  const unchanged = before.css === artifacts.css && before.spec === nextSpec;

  if (dryRun) {
    return { ok: true, dryRun: true, unchanged, cssPath, specPath, css: artifacts.css, spec: nextSpec, before };
  }
  if (unchanged) return { ok: true, unchanged: true, cssPath, specPath, committed: null };

  mkdirSync(dir, { recursive: true });
  writeFileSync(cssPath, artifacts.css);
  writeFileSync(specPath, nextSpec);

  const msg = `design: apply locked decisions${round ? ` from round ${round}` : ''}\n\n`
    + `Generated by the Ottomate design method for ${project}.\n`
    + artifacts.tokens.map((t) => `  ${t.axis} = ${t.value}  ->  ${t.token}`).join('\n')
    + (artifacts.structural.length ? '\n' + artifacts.structural.map((s) => `  ${s.axis} = ${s.value}  (structural, see ${SPEC_FILE})`).join('\n') : '')
    + '\n\nNot pushed and not deployed — that stays the owner\'s call.\n';

  git(repo, ['add', '--', path.posix.join(ARTIFACT_DIR, TOKENS_FILE), path.posix.join(ARTIFACT_DIR, SPEC_FILE)]);
  git(repo, ['commit', '-m', msg]);
  return { ok: true, unchanged: false, cssPath, specPath, committed: git(repo, ['rev-parse', '--short', 'HEAD']), branch: git(repo, ['rev-parse', '--abbrev-ref', 'HEAD']) };
}

export function formatEmit(artifacts, result) {
  const l = [];
  l.push(`tokens: ${artifacts.tokens.length}   structural: ${artifacts.structural.length}   unresolved: ${artifacts.skipped.length}`);
  for (const t of artifacts.tokens) l.push(`  ${t.token.padEnd(30)} ${t.value}   (${t.axis})${t.derived ? '  [derived]' : ''}`);
  for (const s of artifacts.structural) l.push(`  [spec] ${s.axis} = ${s.value}${s.derived ? '  [derived]' : ''}`);
  // Not "SKIPPED" — that read like a note. An unresolved LOCKED decision is a blocker.
  for (const s of artifacts.skipped) l.push(`  UNRESOLVED (blocks emit) ${s.axis} — ${s.why}`);
  if (!result) return l.join('\n');
  if (!result.ok) l.push(`REFUSED:\n  - ${result.refused.join('\n  - ')}`);
  else if (result.dryRun) l.push(`dry run — would write ${result.cssPath}${result.unchanged ? ' (no change)' : ''}`);
  else if (result.unchanged) l.push('no change — artifacts already match the ledger');
  else l.push(`committed ${result.committed} on ${result.branch} (NOT pushed)`);
  return l.join('\n');
}
