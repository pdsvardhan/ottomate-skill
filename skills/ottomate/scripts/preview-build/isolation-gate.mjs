// Isolation gate — G1 §4.3, executable.
//
// "The tool must never show a variant set it has not proven differs on the named axis and matches on
// every other." Every "felt identical" report is a skipped step 4.
//
// Runs BEFORE anything is emitted. A failing set is REGENERATED, never presented (fail closed — the
// same principle as the Task-3 feature verifier). Source: docs/research/G1variantgenerationandconvergence.md
//
// Checks, in order:
//   count        — option count fits the fidelity rung (G1 §4.4); never 1, never 6+
//   labels       — neutral, distinct, no "recommended", no pre-selection (G3 §3.4/§3.5)
//   control-diff — no variant moves anything outside the declared axis parameters (G1 §4.3 step 4b)
//   axis-diff    — every PAIR differs on the axis by at least the minimum step (step 4a)
//   blind-sort   — every variant's level on the axis is stateable without ambiguity (step 4c)
//   structural   — for structural axes only: rendered markup must actually diverge

// G1 §4.4 + §4.5: count falls as fidelity rises. [min, max] per rung.
export const COUNT_BY_RUNG = {
  0: [3, 5], // direction — widest, cheapest to discard
  1: [3, 4], // mechanic
  2: [3, 3], // component — the default rung, and the default count
  3: [2, 3], // cluster
  4: [2, 2], // page
  5: [2, 2], // micro
};

export const RUNG_NAMES = ['direction', 'mechanic', 'component', 'cluster', 'page', 'micro'];

// G3 §3.4: value-laden wording on an identical question produced a 37-point swing. Labels must be
// descriptive of the AXIS LEVEL ("compact"), never of quality ("cleaner", "the modern one").
const EVALUATIVE = [
  'best', 'better', 'worse', 'worst', 'good', 'bad', 'nice', 'ugly', 'clean', 'cleaner', 'messy',
  'modern', 'outdated', 'dated', 'classic', 'improved', 'recommended', 'preferred', 'optimal',
  'premium', 'cheap', 'professional', 'amateur', 'beautiful', 'elegant', 'boring',
];

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

// A value we can honestly look for in source text: a number with an optional CSS unit, or a hex
// colour. Symbolic values ("flat-hairline", "corner-ribbon") name a treatment, not a token, so their
// absence from the text proves nothing and must never be reported.
const LITERAL_RE = /^(-?\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|deg|vh|vw|ch|fr)?|#[0-9a-fA-F]{3,8})$/;
export function isLiteralValue(v) {
  return typeof v === 'number' || (typeof v === 'string' && LITERAL_RE.test(v.trim()));
}

// Relative step between two numbers, scale-free so it works for 8px padding and 1.6 line-height alike.
function relStep(a, b) {
  const m = Math.max(Math.abs(a), Math.abs(b));
  return m === 0 ? 0 : Math.abs(a - b) / m;
}

/**
 * @param {object} set  the variant-set config (see README)
 * @param {object} [rendered]  optional { [label]: htmlString } for the structural check
 * @returns {{ pass: boolean, checks: Array<{name,pass,detail}>, failures: string[] }}
 */
export function runGate(set, rendered = null) {
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass, detail });

  const axis = set.axis ?? {};
  const variants = set.variants ?? [];
  const control = set.control ?? {};
  const params = axis.params ?? [];
  const minRelStep = axis.minRelStep ?? 0.15; // [REASONED] G1 §8 — tune per axis, not a measured constant
  const rung = axis.rung ?? 2;

  // ── 1. count (G1 §4.4) ───────────────────────────────────────────────────────
  const bounds = COUNT_BY_RUNG[rung];
  if (!bounds) {
    add('count', false, `unknown rung ${rung} (valid 0-5: ${RUNG_NAMES.join(', ')})`);
  } else {
    const n = variants.length;
    const ok = n >= bounds[0] && n <= bounds[1];
    add('count', ok,
      ok ? `${n} variants at rung ${rung} (${RUNG_NAMES[rung]}), allowed ${bounds[0]}-${bounds[1]}`
         : `${n} variants at rung ${rung} (${RUNG_NAMES[rung]}) — allowed ${bounds[0]}-${bounds[1]}. ` +
           (n < 2 ? 'A lone design gets dishonest praise and is never rejected (G1 §3.8).'
                  : 'Count falls as fidelity rises: 5 -> 3 -> 2 (G1 §4.5).'));
  }

  // ── 2. labels (G3 §3.4 / §3.5) ───────────────────────────────────────────────
  {
    const labels = variants.map((v) => String(v.label ?? ''));
    const bad = [];
    for (const l of labels) {
      if (!l) { bad.push('(empty label)'); continue; }
      const words = l.toLowerCase().split(/[^a-z]+/).filter(Boolean);
      for (const w of words) if (EVALUATIVE.includes(w)) bad.push(`"${l}" contains evaluative word "${w}"`);
    }
    if (new Set(labels).size !== labels.length) bad.push('labels are not distinct');
    if (variants.some((v) => v.recommended || v.default || v.preselected)) {
      bad.push('a variant is marked recommended/default/preselected — anchoring persists even when the anchor is known to be arbitrary (G3 §3.5)');
    }
    add('labels', bad.length === 0, bad.length ? bad.join('; ') : `neutral + distinct: ${labels.join(', ')}`);
  }

  // ── 3. control diff (G1 §4.3 step 4b) — the check that makes a lock TRUE ─────
  {
    const problems = [];
    if (params.length === 0) problems.push('axis.params is empty — you cannot isolate what you have not named (step 1)');
    for (const p of params) {
      if (Object.prototype.hasOwnProperty.call(control, p)) {
        problems.push(`"${p}" is declared BOTH as a frozen control and as a varying axis parameter`);
      }
    }
    for (const v of variants) {
      const keys = Object.keys(v.axis_values ?? {});
      for (const k of keys) {
        if (!params.includes(k)) {
          problems.push(`variant "${v.label}" moves "${k}", which is not a declared axis parameter — the set is CONTAMINATED (two axes moving at once makes the pick uninterpretable)`);
        }
      }
      for (const p of params) {
        if (!Object.prototype.hasOwnProperty.call(v.axis_values ?? {}, p)) {
          problems.push(`variant "${v.label}" does not set declared axis parameter "${p}"`);
        }
      }
    }
    add('control-diff', problems.length === 0,
      problems.length ? problems.join('; ')
                      : `${Object.keys(control).length} control variables frozen; variants move only ${params.join(', ')}`);
  }

  // ── 4. axis diff (G1 §4.3 step 4a) — the literal "felt identical" fix ────────
  {
    const problems = [];
    const notes = [];

    // Every declared parameter should actually move somewhere in the set.
    for (const p of params) {
      const vals = variants.map((v) => (v.axis_values ?? {})[p]);
      const distinct = new Set(vals.map((x) => JSON.stringify(x)));
      if (distinct.size === 1) {
        problems.push(`declared axis parameter "${p}" is identical across all variants — the axis never moved`);
      }
    }

    // Every PAIR must differ perceptibly on at least one parameter.
    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const a = variants[i], b = variants[j];
        let moved = null;
        for (const p of params) {
          const av = (a.axis_values ?? {})[p], bv = (b.axis_values ?? {})[p];
          if (isNum(av) && isNum(bv)) {
            const s = relStep(av, bv);
            if (s >= minRelStep) { moved = `${p} ${av}->${bv} (${(s * 100).toFixed(0)}%)`; break; }
          } else if (JSON.stringify(av) !== JSON.stringify(bv)) {
            moved = `${p} ${JSON.stringify(av)}->${JSON.stringify(bv)}`; break;
          }
        }
        if (moved) notes.push(`${a.label}/${b.label}: ${moved}`);
        else problems.push(`"${a.label}" and "${b.label}" do not differ by >= ${(minRelStep * 100).toFixed(0)}% on ANY axis parameter — sub-threshold difference, they will read as identical`);
      }
    }
    add('axis-diff', problems.length === 0, problems.length ? problems.join('; ') : notes.join(' · '));
  }

  // ── 5. blind-sort (G1 §4.3 step 4c) ─────────────────────────────────────────
  // If the tool itself cannot state where each variant sits on the axis, a human never will.
  // NOTE: ranks are normalised per parameter, so this check is deliberately SCALE-INVARIANT — it
  // answers "can each level be named?", never "is the gap perceptible?". Magnitude belongs to
  // axis-diff, which is why a sub-threshold set can pass here and still (correctly) fail the gate.
  {
    const numeric = params.filter((p) => variants.every((v) => isNum((v.axis_values ?? {})[p])));
    if (numeric.length === 0) {
      // Non-numeric axis (mechanic, imagery, layout): distinct values are enough to state a level.
      const sigs = variants.map((v) => JSON.stringify(v.axis_values));
      const ok = new Set(sigs).size === variants.length;
      add('blind-sort', ok, ok ? 'non-numeric axis: every variant has a distinct, nameable configuration'
                               : 'two variants share an identical axis configuration — their level is not stateable');
    } else {
      // Composite rank from the numeric parameters, normalised per parameter.
      const ranks = variants.map((v) => {
        let sum = 0;
        for (const p of numeric) {
          const vals = variants.map((x) => x.axis_values[p]);
          const lo = Math.min(...vals), hi = Math.max(...vals);
          sum += hi === lo ? 0 : (v.axis_values[p] - lo) / (hi - lo);
        }
        return { label: v.label, score: sum / numeric.length };
      }).sort((a, b) => a.score - b.score);

      const ties = [];
      for (let i = 1; i < ranks.length; i++) {
        if (Math.abs(ranks[i].score - ranks[i - 1].score) < 0.1) {
          ties.push(`${ranks[i - 1].label} ~ ${ranks[i].label}`);
        }
      }
      add('blind-sort', ties.length === 0,
        ties.length ? `variants sit at effectively the same level on ${axis.name}: ${ties.join(', ')}`
                    : `each level is nameable, ${axis.name} order: ${ranks.map((r) => r.label).join(' < ')} ` +
                      `(relative ranks ${ranks.map((r) => r.score.toFixed(2)).join('/')}; magnitude is axis-diff's call)`);
    }
  }

  // ── 6. structural distance — structural axes only ───────────────────────────
  // A token-driven density change is a small TEXT diff but a large PERCEPTUAL one, so a text-diff
  // floor is only meaningful when the axis is supposed to move the markup itself.
  if (axis.kind === 'structural') {
    if (!rendered) {
      add('structural', false, 'axis.kind is "structural" but no rendered markup was supplied to the gate');
    } else {
      const floor = axis.minStructuralDiff ?? 0.15; // [REASONED] G1 §4.3 operational threshold
      const problems = [], notes = [];
      // A STRUCTURAL fingerprint, not a text diff: tag vocabulary + class vocabulary + CSS property
      // vocabulary. Prose and embedded posters are control, not axis, so they must not move the number.
      const norm = (h) => {
        const s = String(h).replace(/data:[a-z/+-]+;base64,[A-Za-z0-9+/=]+/g, 'DATA_URI');
        const toks = [];
        for (const m of s.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) toks.push(`tag:${m[1].toLowerCase()}`);
        for (const m of s.matchAll(/(?:class|id)\s*=\s*"([^"]*)"/g)) {
          for (const c of m[1].split(/\s+/).filter(Boolean)) toks.push(`cls:${c}`);
        }
        for (const m of s.matchAll(/([a-z-]{3,})\s*:\s*[^;}"]+/g)) toks.push(`css:${m[1]}`);
        return toks;
      };
      // Frequency-aware, not set-based: a set diff ignores how OFTEN a token appears, so appending a
      // couple of tags to short markup reads as a large distance when the two are plainly near-identical.
      const counts = (toks) => { const m = new Map(); for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1); return m; };
      const cosine = (a, b) => {
        let dot = 0, na = 0, nb = 0;
        for (const [t, n] of a) { na += n * n; if (b.has(t)) dot += n * b.get(t); }
        for (const [, n] of b) nb += n * n;
        return na && nb ? dot / Math.sqrt(na * nb) : 0;
      };
      for (let i = 0; i < variants.length; i++) {
        for (let j = i + 1; j < variants.length; j++) {
          const A = counts(norm(rendered[variants[i].label])), B = counts(norm(rendered[variants[j].label]));
          const distance = 1 - cosine(A, B);
          const line = `${variants[i].label}/${variants[j].label}: ${(distance * 100).toFixed(1)}% structural distance`;
          if (distance < floor) problems.push(`${line} — below the ${(floor * 100).toFixed(0)}% floor; these render nearly the same markup`);
          else notes.push(line);
        }
      }
      add('structural', problems.length === 0, problems.length ? problems.join('; ') : notes.join(' · '));
    }
  }

  // ── 6b. control-held (T1) — the TWIN of axis-realised, on the other side of the set ───────────
  // `control-diff` above only checks that a key is not declared as BOTH control and axis. Nothing
  // verified that the panels actually HOLD the controls constant — so "everything else is frozen" was
  // an unverified claim, exactly the class of hole reproduced in axis-realised on 2026-07-27.
  // Only LITERAL control values are checkable from source; a prose control ("system-ui stack") is
  // reported as unchecked rather than quietly counted as verified.
  if (rendered && variants.length > 1) {
    const problems = [], notes = [], unchecked = [];
    for (const [key, val] of Object.entries(control)) {
      if (!isLiteralValue(val)) { unchecked.push(key); continue; }
      const lit = String(val);
      const have = variants.filter((v) => String(rendered[v.label] ?? '').includes(lit)).map((v) => v.label);
      if (have.length === 0) continue;                       // nobody uses it — not a broken control
      if (have.length !== variants.length) {
        const missing = variants.map((v) => v.label).filter((l) => !have.includes(l));
        problems.push(`control "${key}" (${lit}) is present in ${have.join(', ')} but MISSING from ${missing.join(', ')} — it is not being held constant`);
      } else notes.push(`${key}=${lit} in all ${variants.length}`);
    }
    if (unchecked.length) notes.push(`not source-checkable: ${unchecked.join(', ')}`);
    add('control-held', problems.length === 0,
      problems.length ? problems.join('; ') : (notes.join(' · ') || 'no literal controls declared'));
  }

  // ── 7. axis-realised (markup mode, EVERY axis kind) ──────────────────────────
  // The hole this closes, found 2026-07-27 and reproduced before it was fixed: every check above
  // reads `axis_values`, which is a DECLARATION. Nothing read the artifact. Three BYTE-IDENTICAL
  // panels declared "4px"/"12px"/"20px" passed count, labels, control-diff, axis-diff, blind-sort
  // and the constraint checker, and would have been published as three options. That is the original
  // "the variants felt identical" bug re-entering through a different door: the failure moved from
  // "the model made them similar" to "the model mis-declared them", and the gate could not see it.
  //
  // Two tiers, because they have different false-alarm profiles:
  //   distinct-source  BLOCKS. Two panels with identical source cannot be two options. No false alarms.
  //   value-present    ADVISES. A declared LITERAL value should appear in its own panel's source.
  //                    Advisory because `4px` authored as `0.25rem` is correct but unfindable, and a
  //                    blocking check that punishes a legal unit choice would just get switched off.
  // The subtle case — different source, same rendered appearance — belongs to `computed-axis-divergence`
  // (a browser is the only thing that can see it). These three are layers, not alternatives.
  if (rendered && variants.length > 1) {
    const problems = [], notes = [];
    const squash = (h) => String(h ?? '').replace(/\s+/g, ' ').trim();

    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const a = variants[i].label, b = variants[j].label;
        if (rendered[a] !== undefined && rendered[b] !== undefined && squash(rendered[a]) === squash(rendered[b])) {
          problems.push(`"${a}" and "${b}" have IDENTICAL panel source — the declared axis values are a fiction`);
        }
      }
    }
    add('distinct-source', problems.length === 0,
      problems.length ? problems.join('; ') : `${variants.length} panels, all sources distinct`);

    // advisory half — reported, never blocking
    const missing = [];
    for (const v of variants) {
      const src = rendered[v.label];
      if (src === undefined) continue;
      for (const p of params) {
        const val = (v.axis_values ?? {})[p];
        if (!isLiteralValue(val)) continue;
        if (!String(src).includes(String(val))) missing.push(`${v.label}.${p}="${val}"`);
      }
    }
    if (missing.length) notes.push(`declared literal not found verbatim in its own panel (may be a legal unit choice): ${missing.join(', ')}`);
    add('value-present', true, notes.length ? notes.join(' · ') : 'every declared literal appears in its own panel');
  }

  const failures = checks.filter((c) => !c.pass).map((c) => `${c.name}: ${c.detail}`);
  return { pass: failures.length === 0, checks, failures };
}

export function formatGate(result) {
  const lines = [];
  for (const c of result.checks) lines.push(`  ${c.pass ? 'PASS' : 'FAIL'}  ${c.name.padEnd(13)} ${c.detail}`);
  lines.push(result.pass
    ? '  GATE PASS — set may be presented'
    : '  GATE FAIL — REGENERATE. This set must not be shown (G1 §4.3 step 5).');
  return lines.join('\n');
}
