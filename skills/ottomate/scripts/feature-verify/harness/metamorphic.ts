// Feature-verify harness — L3 METAMORPHIC / PROPERTY relations (Task 3, Track B). Assert a RELATION
// between executions without a known-correct value — the independence engine: a relation cannot be
// satisfied by echoing the implementation's own output, so it survives "the coder wrote the test too".
// See docs/research/task3/T2-oracle-and-case-generation.md. Pair with `fast-check` in the spec for the
// input generation (property-based); these are the relation primitives the property asserts.

import type { StateCheck } from './system-state';

/** Non-constancy: different inputs MUST yield different outputs (defeats a stuck control / a fixed
 *  template served while claiming to vary — the leaploop "is the résumé actually tailored?" bug). */
export function nonConstancy<T>(a: T, b: T, equal: (x: T, y: T) => boolean = (x, y) => x === y): StateCheck {
  const same = equal(a, b);
  return { ok: !same, detail: same ? 'outputs identical for different inputs — non-constancy VIOLATED' : 'outputs differ (ok)', observed: { a, b } };
}

/** Conservation / count: an observed count must equal an independently-known expected count
 *  (upload N files ⇒ N rows; N pages ∪ ⇒ the full set). Counted from OUR inputs, not the app's echo. */
export function conservation(observed: number, expected: number, label = 'count'): StateCheck {
  return { ok: observed === expected, detail: `${label}: observed ${observed} ${observed === expected ? '==' : '!='} expected ${expected}`, observed: { observed, expected } };
}

/** A boolean invariant that must hold for every sampled input (the body of a property-based check). */
export function invariant(holds: boolean, detail: string, observed?: unknown): StateCheck {
  return { ok: holds, detail, observed };
}
