// Self-contained 2-way covering array (greedy, seed-per-uncovered-pair). Bounds the parameter
// cross-product so the case matrix stays small while covering EVERY value pair — the NIST
// interaction-rule justification (2-way ≈ 93% of real faults). See
// docs/research/task3/T2-oracle-and-case-generation.md. (P2-A)
const pairKey = (k1, v1, k2, v2) => (k1 < k2 ? `${k1}=${v1}|${k2}=${v2}` : `${k2}=${v2}|${k1}=${v1}`);

export function pairwise(params) {
  const keys = Object.keys(params);
  if (keys.length === 0) return [{}];
  if (keys.length === 1) return params[keys[0]].map((v) => ({ [keys[0]]: v }));

  const need = new Set();
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++)
      for (const a of params[keys[i]]) for (const b of params[keys[j]]) need.add(pairKey(keys[i], a, keys[j], b));

  const rows = [];
  while (need.size) {
    // Seed the row with a still-uncovered pair so every row makes progress AND the first parameter
    // actually varies (a plain left-to-right greedy pins param[0] to its first value forever).
    const [seed] = need;
    const [p1, p2] = seed.split('|');
    const [sk1, sv1] = p1.split('=');
    const [sk2, sv2] = p2.split('=');
    const row = { [sk1]: sv1, [sk2]: sv2 };
    for (const k of keys) {
      if (k in row) continue;
      let best = params[k][0], bestGain = -1;
      for (const v of params[k]) {
        let gain = 0;
        for (const k2 of keys) if (k2 in row && need.has(pairKey(k, v, k2, row[k2]))) gain++;
        if (gain > bestGain) { bestGain = gain; best = v; }
      }
      row[k] = best;
    }
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++)
        need.delete(pairKey(keys[i], row[keys[i]], keys[j], row[keys[j]]));
    rows.push(row);
    if (rows.length > 10000) break; // safety
  }
  return rows;
}
