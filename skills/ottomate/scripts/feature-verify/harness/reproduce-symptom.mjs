// P2-B: SWE-bench FAIL_TO_PASS + PASS_TO_PASS as a verdict over two runner phases (pre-fix / post-fix).
// A symptom that was not RED before the fix means the bug was never reproduced — inconclusive (warn),
// never a pass. See docs/plans/2026-07-28-task3-P2B-*-design.md.
export function symptomVerdict({ preFixRed, postFixGreen, passToPass = [] }) {
  if (!preFixRed) return { outcome: 'warn', detail: 'symptom not reproduced pre-fix (already green) — inconclusive, not a pass' };
  const regressed = passToPass.some((g) => g === false);
  if (postFixGreen && !regressed) return { outcome: 'pass', detail: 'RED pre-fix → GREEN post-fix, no PASS_TO_PASS regression' };
  return { outcome: 'fail', detail: !postFixGreen ? 'symptom still RED after the claimed fix' : 'a PASS_TO_PASS case regressed' };
}
