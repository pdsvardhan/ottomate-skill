// P3-C1: impacted-app / impacted-matrix selection for the on-commit cadence. A commit's diff maps to
//   1. the APP it touched — by repo-path convention (/mnt/storage/websites/<slug>/… ; ottomate at
//      /opt/homeserver/ottomate) — see slugOf / impactedApps;
//   2. the MATRICES within that app — each matrix declares a `covers:[globs]`; a matrix with no covers
//      is "always impacted" for its app so nothing silently drops — see impactedMatrices.
// Pure except changedFilesSince (the one thin git shell-out). See docs/plans/2026-07-28-task3-P3C-*.

import { execFileSync } from 'node:child_process';

const DEFAULT_WEBSITES_ROOT = '/mnt/storage/websites';
const DEFAULT_OTTOMATE_ROOT = '/opt/homeserver/ottomate';

/** Absolute path → its project slug, or null if it lives under neither known root. */
export function slugOf(absPath, opts = {}) {
  const websitesRoot = (opts.websitesRoot ?? DEFAULT_WEBSITES_ROOT).replace(/\/+$/, '');
  const ottomateRoot = (opts.ottomateRoot ?? DEFAULT_OTTOMATE_ROOT).replace(/\/+$/, '');
  const p = String(absPath).replace(/\\/g, '/');
  if (p === ottomateRoot || p.startsWith(ottomateRoot + '/')) return 'ottomate';
  if (p.startsWith(websitesRoot + '/')) {
    const rest = p.slice(websitesRoot.length + 1);
    const seg = rest.split('/')[0];
    return seg || null;
  }
  return null;
}

/** The set of slugs a diff of ABSOLUTE paths touches (sorted, unique, nulls dropped). */
export function impactedApps(changedFiles, opts = {}) {
  const s = new Set();
  for (const f of changedFiles ?? []) { const slug = slugOf(f, opts); if (slug) s.add(slug); }
  return [...s].sort();
}

// Minimal glob → RegExp: ** spans separators, * within a segment, ? one non-separator char.
export function globToRegExp(glob) {
  let re = '';
  const g = String(glob).replace(/\\/g, '/');
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') { re += '.*'; i++; if (g[i + 1] === '/') i++; } // **/  → .*
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

export function globMatchesAny(glob, files) {
  const re = globToRegExp(glob);
  return (files ?? []).some((f) => re.test(String(f).replace(/\\/g, '/')));
}

/**
 * Which of ONE app's matrices a diff impacts.
 * @param {string[]} changedFiles  repo-relative paths for that app (empty ⇒ nothing impacted)
 * @param {{file:string, covers?:string[]}[]} matrices
 * @returns {{file:string, covers?:string[]}[]}  the impacted subset (order preserved)
 */
export function impactedMatrices(changedFiles, matrices) {
  const files = changedFiles ?? [];
  if (files.length === 0) return [];
  return (matrices ?? []).filter((m) => {
    if (!Array.isArray(m.covers) || m.covers.length === 0) return true; // no covers ⇒ always impacted
    return m.covers.some((glob) => globMatchesAny(glob, files));
  });
}

/**
 * The one impure call: repo-relative paths changed since a git ref (default the previous commit).
 * Kept thin + injectable so the pure logic above is tested without git. `--diff-filter=d` drops
 * deletions (a deleted file has no surface to verify).
 */
export function changedFilesSince(gitRef = 'HEAD~1', opts = {}) {
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=d', gitRef], {
    cwd: opts.cwd ?? process.cwd(), encoding: 'utf8',
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}
