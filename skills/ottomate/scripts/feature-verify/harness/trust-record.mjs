// P2-B: the consolidated independence verdict. A run that is not trustworthy can never be a gating
// APPROVE — downgrade to advisory ITERATE, keeping the reason so the anti-gaslight property is an
// AUDITABLE field, not a promise. Dimensions: claim_blind · held_out · owner_reviewed · untampered ·
// pre_build_authored. See docs/research/task3/T3-*.md §3-4.
export function assessTrust(dimensions) {
  const warnings = Object.entries(dimensions)
    .filter(([, v]) => v !== true)
    .map(([k]) => `independence dimension not satisfied: ${k}`);
  return { trustworthy: warnings.length === 0, dimensions, warnings };
}

export function applyTrust(verdict, trust) {
  if (trust.trustworthy || verdict.recommendation_overall !== 'APPROVE') return verdict;
  return {
    ...verdict,
    recommendation_overall: 'ITERATE',
    mandatory_user_review: false,
    reason: `untrustworthy run (${trust.warnings.join('; ')}) — advisory, not gating`,
  };
}
