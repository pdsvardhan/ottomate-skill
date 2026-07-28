// P3-C2: delta-vs-previous-run. Compares two runs' case×outcome results (Matrix.results) and buckets
// each case: what newly broke, what got fixed, what is still broken, what appeared/disappeared, and —
// when the run-log's flake history is supplied — which "new failures" are actually known flakes (so a
// flaky red is surfaced, not alarmed as a regression). Pure. See docs/plans/2026-07-28-task3-P3C-*.

const isFail = (o) => o === 'fail';

function outcomesById(results) {
  const m = new Map();
  for (const r of results ?? []) m.set(r.case, r.outcome);
  return m;
}

/**
 * @param {{case:string, outcome:string}[]} current
 * @param {{case:string, outcome:string}[]} previous
 * @param {{knownFlaky?: Iterable<string>}} [opts]
 * @returns {{new_failures:string[], fixed:string[], still_failing:string[],
 *            appeared:string[], disappeared:string[], flakes:string[]}}
 */
export function deltaVsPrevious(current, previous, opts = {}) {
  const cur = outcomesById(current);
  const prev = outcomesById(previous);
  const flaky = new Set(opts.knownFlaky ?? []);
  const out = { new_failures: [], fixed: [], still_failing: [], appeared: [], disappeared: [], flakes: [] };

  for (const [id, o] of cur) {
    if (!prev.has(id)) out.appeared.push(id);
    if (isFail(o)) {
      if (isFail(prev.get(id))) out.still_failing.push(id);
      else if (flaky.has(id)) out.flakes.push(id);       // a known-flaky red → surfaced, not a regression
      else out.new_failures.push(id);                     // pass/absent → fail = a real new failure
    } else if (isFail(prev.get(id))) {
      out.fixed.push(id);                                 // fail → pass = fixed
    }
  }
  for (const id of prev.keys()) if (!cur.has(id)) out.disappeared.push(id); // present before, gone now
  return out;
}

/** True when the delta contains a genuine regression (a new failure that is not a known flake). */
export function hasRegression(delta) {
  return (delta?.new_failures?.length ?? 0) > 0;
}
