// source-art.mjs — the prior-art SOURCE scan: "what does the built code already USE?" (C9, 2026-07-28)
//
// The ledger half (prior-art.mjs) answers "is this already DECIDED?". This answers "is this already
// BUILT?" by reading the DECLARED design tokens in a project's CSS, and reconciles them against the
// ledger. A disagreement between the two is reported as a CONFLICT and never silently resolved — the
// same discipline prior-art.mjs applies to two locked ledger values.
//
// Bounded on purpose: this reads DECLARED custom properties (`--name: value`), not RESOLVED values.
// Resolved values need a browser (the cascade, color-mix(), inheritance) and stay the computed
// follow-up. It is NOT a grep: comments are stripped and only real declarations match.
//
// PURE — the caller supplies the file contents (read from `/mnt/storage/websites/<slug>`), so it is
// unit-testable without a project on disk.

import { questionRegistry } from './anatomy.mjs';
import { axisQuestion } from './prior-art.mjs';

/** Remove CSS block comments so a token mentioned in a comment is never taken as a declaration. */
export function stripCssComments(css) {
  return String(css ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Declared custom properties in one stylesheet. Last-wins per name (cascade order within the text),
 * but every distinct value is kept so a contradiction inside one file is visible rather than hidden.
 * @returns {Object<string,{value:string, values:string[]}>}
 */
export function extractDeclaredTokens(css) {
  const clean = stripCssComments(css);
  const seen = {};
  for (const m of clean.matchAll(/(--[a-zA-Z][\w-]*)\s*:\s*([^;{}]+?)\s*(?:;|}|$)/g)) {
    const name = m[1];
    const value = m[2].trim();
    if (!value || value.startsWith('--') /* a var() alias, not a concrete value */) continue;
    (seen[name] ??= []).push(value);
  }
  const out = {};
  for (const [name, vals] of Object.entries(seen)) {
    const distinct = [...new Set(vals)];
    out[name] = { value: distinct[distinct.length - 1], values: distinct };
  }
  return out;
}

/**
 * Aggregate declared tokens across several files.
 * @param {Array<{path:string, css:string}>} files
 * @returns {Object<string,{name:string, value:string, sources:Array, conflict:string[]|null}>}
 */
export function scanSourceArt(files) {
  const byName = {};
  for (const f of files ?? []) {
    const toks = extractDeclaredTokens(f.css ?? '');
    for (const [name, t] of Object.entries(toks)) {
      (byName[name] ??= { name, sources: [] }).sources.push({ path: f.path, value: t.value });
    }
  }
  const out = {};
  for (const [name, agg] of Object.entries(byName)) {
    const distinct = [...new Set(agg.sources.map((s) => s.value))];
    out[name] = {
      name,
      value: agg.sources[agg.sources.length - 1].value,
      sources: agg.sources,
      conflict: distinct.length > 1 ? distinct : null, // one token, two values across files
    };
  }
  return out;
}

/** The token-name suffix a question maps to: `corner-radius` -> `--{t}-radius` -> `radius`. */
export function questionTokenSuffix(question, registry = questionRegistry()) {
  const tmpl = registry[question]?.token;
  if (!tmpl) return null;
  return String(tmpl).replace(/^--\{t\}-?/, '').replace(/^--/, '') || null;
}

function matchSourceToken(sourceTokens, suffix) {
  if (!suffix) return null;
  const want = suffix.toLowerCase();
  // `--radius`, `--card-radius`, `--library-list-radius` all match the `radius` suffix.
  const names = Object.keys(sourceTokens).filter((n) => {
    const bare = n.replace(/^--/, '').toLowerCase();
    return bare === want || bare.endsWith('-' + want);
  });
  return names.length ? sourceTokens[names[0]] : null; // first match; multiple is itself a signal, reported by caller
}

/**
 * Reconcile the built code's declared tokens against the ledger, per token-shaped question.
 * @param {object} o
 * @param {Object} o.sourceTokens   scanSourceArt(...) output
 * @param {Array<object>} o.ledger   design_decisions rows for the project
 * @param {string[]} [o.questions]   restrict to these questions (defaults to every token-shaped one seen in the ledger)
 * @param {object} [o.registry]
 * @returns {Object<string,{question, verdict, source, ledgerValue, why}>}
 */
export function reconcileSourceArt({ sourceTokens = {}, ledger = [], questions = null, registry = questionRegistry() } = {}) {
  const qs = questions ?? [...new Set((ledger ?? []).map((d) => axisQuestion(d.axis)).filter((q) => registry[q]?.token))];
  const out = {};
  for (const q of qs) {
    const suffix = questionTokenSuffix(q, registry);
    const src = matchSourceToken(sourceTokens, suffix);
    const locked = (ledger ?? []).find((d) => axisQuestion(d.axis) === q && d.status === 'locked' && d.chosen_value);
    const ledgerValue = locked?.chosen_value ?? null;

    let verdict = 'none';
    let why = '';
    // A value is NEVER seeded on a conflict — the round is handed the disagreement, not a resolution.
    if (src && ledgerValue) {
      if (String(src.value).trim() === String(ledgerValue).trim()) {
        verdict = 'consistent';
        why = `ledger and code agree on ${q} = ${ledgerValue}`;
      } else {
        verdict = 'conflict';
        why = `ledger says ${q} = ${ledgerValue} (locked), but the built code declares ${src.name} = ${src.value} `
          + `(${src.sources.map((s) => s.path).join(', ')}). Not seeding either — settle it in the round.`;
      }
    } else if (src && !ledgerValue) {
      verdict = 'already-built';
      why = `the code already declares ${src.name} = ${src.value} (${src.sources.map((s) => s.path).join(', ')}) — consider it before re-deciding ${q}`;
    }
    out[q] = { question: q, verdict, source: src ? { name: src.name, value: src.value, sources: src.sources } : null, ledgerValue, why };
  }
  return out;
}

export function formatSourceArt(reconciled) {
  const lines = [];
  for (const r of Object.values(reconciled ?? {})) {
    if (r.verdict === 'none') continue;
    const tag = { 'already-built': 'built   ', consistent: 'ok      ', conflict: 'CONFLICT' }[r.verdict] ?? r.verdict;
    lines.push(`  ${tag}  ${r.why}`);
  }
  return lines.length ? lines.join('\n') : '  (the built code declares no tokens matching these questions)';
}
