// pre-publish-gates.mjs — WS1.0. The fail-closed gates that must pass BEFORE a round's decisions are
// written to the ledger. Wires Phase 0's per-theme CONTRAST GATE + the ban-raw-values lint into the
// ACTUAL publish path (they existed standalone; this makes them enforced), replacing colourBudget (F-8,
// now advisory) as the legibility gate.
//
// Honest about scope — a gate that CANNOT run reports `skip`, never a silent pass:
//   - themeContrastGate: runs only when the project has an authored theme file. cointrail does; the other
//     projects do not yet, so it `skip`s until their tokens land. When it runs and a pairing is invisible,
//     it BLOCKS (fail-closed) and names the scheme.
//   - blockSourceLint: runs over the token-based Block/Part CSS a round declares. A legacy single-HTML
//     round declares none → `skip`. When a declared Block hard-codes a colour/easing/radius/shadow, it BLOCKS.

import { existsSync } from 'node:fs';
import { loadTheme } from '../theming/build-theme.mjs';
import { contrastGate } from '../theming/contrast-gate.mjs';
import { lintFile } from '../theming/ban-raw-values.mjs';

/** Per-theme contrast gate as a publish gate. skip (no theme yet) · pass · block (invisible pairing). */
export function themeContrastGate({ themeFile = null } = {}) {
  if (!themeFile) {
    return { verdict: 'skip', why: 'no theme file for this project yet — the per-theme contrast gate cannot run (NOT a pass; author the project tokens to enable it)' };
  }
  if (!existsSync(themeFile)) {
    return { verdict: 'block', why: `theme file not found: ${themeFile} — refusing to publish against a missing theme` };
  }
  let theme;
  try { theme = loadTheme(themeFile); }
  catch (e) { return { verdict: 'block', why: `theme file unparseable (${themeFile}): ${String(e).slice(0, 120)}` }; }
  const g = contrastGate(theme);
  return { verdict: g.ok ? 'pass' : 'block', why: g.why, gate: g };
}

/** ban-raw-values over each declared Block source. skip (none) · pass · block (hard finding). */
export function blockSourceLint({ blockCssFiles = [] } = {}) {
  if (!blockCssFiles.length) {
    return { verdict: 'skip', why: 'the round declares no token-based Block sources to lint (legacy single-HTML round)', reports: [] };
  }
  const missing = blockCssFiles.filter((f) => !existsSync(f));
  if (missing.length) return { verdict: 'block', why: `Block source(s) not found: ${missing.join(', ')}`, reports: [] };
  const reports = blockCssFiles.map((f) => lintFile(f));
  const blocking = reports.reduce((a, r) => a + r.blocking, 0);
  return {
    verdict: blocking ? 'block' : 'pass',
    why: blocking ? `${blocking} raw-value violation(s) across ${reports.length} Block source(s)` : `${reports.length} Block source(s) clean`,
    reports,
  };
}

/** Both gates, one call — what publish-round asks before writing any decision. Fail-closed. */
export function prePublishGates({ themeFile = null, blockCssFiles = [] } = {}) {
  const theme = themeContrastGate({ themeFile });
  const lint = blockSourceLint({ blockCssFiles });
  const blocked = [theme, lint].filter((g) => g.verdict === 'block');
  return { theme, lint, pass: blocked.length === 0, blocked };
}

export function formatPrePublish(g) {
  const mark = (v) => ({ pass: 'PASS', block: 'BLOCK', skip: 'SKIP' }[v] ?? v);
  const l = [
    `  ${mark(g.theme.verdict).padEnd(5)} theme-contrast  ${g.theme.why}`,
    `  ${mark(g.lint.verdict).padEnd(5)} block-lint      ${g.lint.why}`,
  ];
  if (!g.pass) l.push('  PUBLISH BLOCKED — a fail-closed gate did not pass. Nothing written.');
  return l.join('\n');
}
