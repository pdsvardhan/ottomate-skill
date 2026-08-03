// P3-C3: the DURABLE evidence store. Scheduled + owner-reported-fix runs write trace/video/screenshot to
// a dated PERSISTENT dir on the server (not the ephemeral /tmp the default config uses) so a morning's
// red is still openable at trace.playwright.dev; throwaway runs (on-commit smoke, manual) stay in /tmp.
// pruneEvidence keeps the store bounded. Pure except the default fs lister/remover, both injectable.
// See docs/plans/2026-07-28-task3-P3C-*.

import { promises as fs } from 'node:fs';
import path from 'node:path';

// Overridable so the cron (and a test run) can point the durable store at a writable location.
export const PERSIST_ROOT = process.env.FV_PERSIST_ROOT ?? '/opt/homeserver/ottomate/fv-evidence';
const TMP_ROOT = '/tmp/fv-evidence';

// Runs whose evidence is worth keeping: the nightly trend, every owner-reported-fix (its RED→GREEN
// proof), and a manual whole-site verification (full-site) — all deliberate, all worth re-opening later.
const PERSISTENT_MODES = new Set(['nightly', 'fix', 'full-site']);

/**
 * The evidence root for one run: `<persist>/<yyyy-mm-dd>/<mode>-<session>` for scheduled/fix runs,
 * `<tmp>/…` for throwaway runs. A scheduled run NEVER resolves under /tmp (fail-loud if it would).
 */
export function evidenceRootFor(opts = {}) {
  const mode = opts.mode ?? 'manual';
  const date = opts.date ?? new Date().toISOString().slice(0, 10);
  const session = String(opts.session ?? `fv-${Date.now()}`).replace(/[^\w.-]/g, '_');
  const persistRoot = opts.persistRoot ?? PERSIST_ROOT;
  const tmpRoot = opts.tmpRoot ?? TMP_ROOT;
  const root = PERSISTENT_MODES.has(mode)
    ? path.posix.join(persistRoot, date, `${mode}-${session}`)
    : path.posix.join(tmpRoot, date, `${mode}-${session}`);
  if (PERSISTENT_MODES.has(mode) && (root.startsWith('/tmp/') || root.startsWith('/tmp\\')))
    throw new Error(`evidenceRootFor: a ${mode} run must persist, not write under /tmp (${root})`);
  return root;
}

/**
 * Prune dated evidence dirs older than `keepDays`. `root` holds `yyyy-mm-dd` subdirs; non-date entries
 * are left alone. Returns the names pruned. lister/remover/now are injected for testing.
 */
export async function pruneEvidence(root, keepDays, opts = {}) {
  const now = opts.now ?? Date.now();
  const lister = opts.lister ?? (async () =>
    (await fs.readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name));
  const remover = opts.remover ?? (async (p) => fs.rm(p, { recursive: true, force: true }));
  const cutoff = now - keepDays * 86_400_000;
  const pruned = [];
  for (const name of await lister()) {
    const t = Date.parse(name);          // a yyyy-mm-dd dir name → UTC midnight; NaN for non-date dirs
    if (Number.isNaN(t)) continue;
    if (t < cutoff) { await remover(path.posix.join(root, name)); pruned.push(name); }
  }
  return pruned;
}
