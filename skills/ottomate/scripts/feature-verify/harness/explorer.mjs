// P3 (Explorer hook): the ADVERSARIAL-PROBE playbook as a concrete mechanism. The judge scores "does it
// look right"; the Explorer asks "what did nobody try". The skill (Claude, in the build session) runs the
// fixed high-value playbook against the live app, and every finding is FROZEN into a matrix case so the
// next run reruns it deterministically (a finding's value persists as a test, never as a one-off). This
// module is the pure glue: the fixed playbook + the freeze-into-a-runnable-case operation. The concrete
// nasty string VALUES live in unicode.ts (SCRIPT_FIXTURES / NORMALIZATION_PAIR), resolved at spec runtime.
// See references/stage-3-feature-verifier.md §4 (Explorer playbook) + docs/plans/2026-07-28-task3-*.

import { PATHS, LAYERS } from './matrix.mjs';

// The fixed, high-value playbook (method §4) — NOT open-ended wandering. Each build runs these.
export const PLAYBOOK = [
  { id: 'adversarial-inputs', path: 'edge', probes: ['non-ascii', 'empty', 'huge/max', 'malformed/corrupt', 'duplicate', 'mixed-type', 'nfc-vs-nfd'] },
  { id: 'interruptions-races', path: 'concurrency', probes: ['double-submit', 'navigate-away mid-op', 'cancel mid-flow', 'rapid-repeat', 'back-button mid-flow'] },
  { id: 'error-paths', path: 'error', probes: ['provider/dependency offline', 'permission denied', 'network drop', 'timeout'] },
  { id: 'boundary-state', path: 'edge', probes: ['empty/first-run', 'at-limit', 'cross-flow contamination'] },
  { id: 'visibility', path: 'permission', probes: ['logged-out', 'owner', 'guest'] },
];

export function explorerPlaybook() { return PLAYBOOK; }

// The catalog of nasty INPUT KINDS a probe draws from. Named — the concrete value comes from unicode.ts
// (script fixtures) or is generated (empty/huge/dup) by the spec at runtime; the Explorer only decides
// WHICH to throw at the feature.
export function nastyInputCatalog() {
  return [
    'non-ascii:telugu', 'non-ascii:tamil', 'non-ascii:hindi', 'non-ascii:emoji', 'non-ascii:rtl', 'non-ascii:mixed',
    'nfc', 'nfd', 'empty', 'huge', 'duplicate', 'mixed-type', 'malformed',
  ];
}

const CATEGORY_PATH = Object.fromEntries(PLAYBOOK.map((c) => [c.id, c.path]));

/**
 * Freeze a discovered finding into a matrix case the data-driven runner can rerun deterministically.
 * A finding with a registered `assert` is immediately runnable; without one it is frozen with
 * `needs_assert:true` — the runner records it `skipped` (fail-closed / UNMEASURED, never a silent pass)
 * until an assertion is registered. The produced case passes `validateMatrix`.
 * @param {{category:string, probe:string, input?:string, layer?:string, assert?:string, note?:string, id?:string}} finding
 */
export function freezeAsCase(finding) {
  const path = finding.path ?? CATEGORY_PATH[finding.category] ?? 'edge';
  const layer = finding.layer ?? 'implicit';
  if (!PATHS.includes(path)) throw new Error(`freezeAsCase: "${finding.category}" → bad path "${path}"`);
  if (!LAYERS.includes(layer)) throw new Error(`freezeAsCase: bad layer "${layer}"`);
  const slug = `${finding.category}-${finding.probe}`.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  const oracle = { layer };
  if (finding.assert) oracle.assert = finding.assert;
  const c = {
    id: finding.id ?? `explorer-${slug}`,
    path,
    params: finding.input !== undefined ? { input: finding.input } : {},
    oracles: [oracle],
    discovered_by: 'explorer',
    probe: finding.probe,
  };
  if (!finding.assert) c.needs_assert = true; // honest: a bespoke finding needs its assertion wired
  if (finding.note) c.note = finding.note;
  return c;
}

/** Append frozen explorer cases to a matrix's case list, de-duping by id (a rerun re-freezes the same). */
export function mergeFrozenCases(cases, frozen) {
  const byId = new Map((cases ?? []).map((c) => [c.id, c]));
  for (const f of frozen ?? []) byId.set(f.id, f);
  return [...byId.values()];
}
