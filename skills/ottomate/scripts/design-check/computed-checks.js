// Phase 3b — the COMPUTED checker. Runs AFTER a variant set renders, reading resolved styles.
//
// ONE source, two hosts (no duplication):
//   - Node: `require('./computed-checks.js')` sets globalThis.OTTO_COMPUTED — unit-test the pure math.
//   - Browser: addScriptTag / inject this file, then call OTTO_COMPUTED.computedChecks(root, opts) —
//     it reads the DOM (getComputedStyle) inside each panel's declarative shadow root.
//
// The pure maths (contrast, deltaE, vectors) are unit-tested in Node. The DOM-reading `computedChecks`
// is verified by RUNNING it in real Chromium (documented != demonstrated) — see the Phase-3b demo.
(function (g) {
  'use strict';

  // ── pure colour maths (WCAG contrast + an approximate ΔE) ───────────────────────────────────────
  function parseColor(str) {
    if (!str) return null;
    const m = String(str).match(/(\d+\.?\d*)/g); // getComputedStyle always returns rgb()/rgba()
    if (!m || m.length < 3) return null;
    const n = m.map(Number);
    return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
  }
  function chan(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function relLuminance(rgb) { return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b); }
  function contrastRatio(fg, bg) {
    const L1 = relLuminance(fg), L2 = relLuminance(bg);
    const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
    return (hi + 0.05) / (lo + 0.05);
  }
  // sRGB → CIE Lab (D65), then CIE76 ΔE. Approximate (not CIEDE2000); adequate for a "same value?" gate.
  function toLab(rgb) {
    const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const r = f(rgb.r), gg = f(rgb.g), b = f(rgb.b);
    let x = (r * 0.4124 + gg * 0.3576 + b * 0.1805) / 0.95047;
    let y = (r * 0.2126 + gg * 0.7152 + b * 0.0722) / 1.0;
    let z = (r * 0.0193 + gg * 0.1192 + b * 0.9505) / 1.08883;
    const p = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    x = p(x); y = p(y); z = p(z);
    return { L: 116 * y - 16, a: 500 * (x - y), bb: 200 * (y - z) };
  }
  function deltaE(rgb1, rgb2) {
    const a = toLab(rgb1), b = toLab(rgb2);
    return Math.sqrt((a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.bb - b.bb) ** 2);
  }

  // ── style vector + distance (for the appearance-divergence backstop) ────────────────────────────
  const VECTOR_PROPS = ['borderRadius', 'boxShadow', 'backgroundColor', 'color', 'padding', 'borderWidth', 'borderStyle', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'textTransform'];
  function styleVector(cs) {
    const v = {};
    for (const p of VECTOR_PROPS) v[p] = cs[p] || '';
    return v;
  }
  function vecDistance(v1, v2) {
    let diff = 0;
    for (const p of VECTOR_PROPS) if ((v1[p] || '') !== (v2[p] || '')) diff += 1;
    return diff / VECTOR_PROPS.length; // fraction of sampled properties that differ
  }

  const isLarge = (cs) => parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);

  // ── the DOM pass (browser only) ─────────────────────────────────────────────────────────────────
  function computedChecks(root, opts) {
    opts = opts || {};
    const profile = opts.profile || 'P1';
    const divergenceFloor = opts.divergenceFloor != null ? opts.divergenceFloor : 0.25; // ≥25% of props differ
    const deltaEWarn = opts.deltaEWarn != null ? opts.deltaEWarn : 2;
    root = root || document;

    // panels = each declarative-shadow-root host; fall back to the root if none (token mode / plain page)
    const hosts = [...root.querySelectorAll('.vs-shadow-host')].filter((h) => h.shadowRoot);
    const scopes = hosts.length ? hosts.map((h) => ({ label: h.closest('.vs-panel') ? h.closest('.vs-panel').getAttribute('aria-label') : 'panel', sr: h.shadowRoot })) : [{ label: 'document', sr: root }];

    const findings = { contrast: [], divergence: [], coherence: [], meta: { scopes: scopes.length, textExamined: 0 } };

    // effective background = nearest ancestor (across shadow boundary) with an opaque background-color
    function effectiveBg(el) {
      let n = el;
      while (n) {
        const c = parseColor(getComputedStyle(n).backgroundColor);
        if (c && c.a >= 0.999) return c;                        // first opaque background wins
        n = n.parentElement || (n.getRootNode() && n.getRootNode().host) || null; // cross the shadow boundary
      }
      return null;
    }

    // 1. contrast — per text-bearing leaf
    for (const { label, sr } of scopes) {
      const els = sr.querySelectorAll('*');
      for (const el of els) {
        if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT' || el.tagName === 'TEMPLATE') continue; // not rendered text
        const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasOwnText) continue;
        findings.meta.textExamined += 1;
        const cs = getComputedStyle(el);
        const fg = parseColor(cs.color);
        const bg = effectiveBg(el);
        if (!fg) continue;
        if (!bg) { findings.contrast.push({ label, text: el.textContent.trim().slice(0, 24), ratio: null, note: 'background not resolvable (image/gradient?) — review' }); continue; }
        const ratio = contrastRatio(fg, bg);
        const need = isLarge(cs) ? 3 : 4.5;
        if (ratio < need) findings.contrast.push({ label, text: el.textContent.trim().slice(0, 24), ratio: Math.round(ratio * 100) / 100, need, large: isLarge(cs) });
      }
    }

    // 2. cross-component coherence — group [data-role] across all scopes; same role → same colour
    const byRole = {};
    for (const { label, sr } of scopes) {
      for (const el of sr.querySelectorAll('[data-role]')) {
        const role = el.getAttribute('data-role');
        const cs = getComputedStyle(el);
        (byRole[role] = byRole[role] || []).push({ label, color: parseColor(cs.color), bg: parseColor(cs.backgroundColor), radius: cs.borderRadius });
      }
    }
    for (const role of Object.keys(byRole)) {
      const items = byRole[role];
      for (let i = 1; i < items.length; i++) {
        if (items[i].color && items[0].color) {
          const de = deltaE(items[i].color, items[0].color);
          if (de > deltaEWarn) findings.coherence.push({ role, kind: 'colour', deltaE: Math.round(de * 10) / 10, note: `role "${role}" resolves to different colours across components` });
        }
      }
    }

    // 3. appearance divergence — a HOLISTIC per-panel signature: for each style property, the SET of
    // resolved values across every STYLED element in the panel (card + badge + button + accents). A
    // single-element sample under-counts (two panels can share a card surface yet differ in badge /
    // actions / accent). Distance = mean Jaccard distance across properties. This is what the source
    // structural check could not do — it reads resolved values, so it sees radius 0 vs 14, flat vs
    // shadowed, coral vs amber — and it neither false-rejects different panels nor passes identical ones.
    function panelSignature(sr) {
      const styled = [...sr.querySelectorAll('*')].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.borderRadius !== '0px' || cs.boxShadow !== 'none' || parseFloat(cs.borderWidth) > 0;
      });
      const sig = {};
      for (const p of VECTOR_PROPS) sig[p] = new Set(styled.map((el) => getComputedStyle(el)[p] || ''));
      return sig;
    }
    // WHICH PROPERTIES ARE ACTUALLY IN PLAY. Diagnosed 2026-07-27 on the first inline run: averaging
    // Jaccard distance over all 12 properties DILUTES the score with control. A panel carrying four
    // real posters plus their shared pills, chips and buttons has ~9 of 12 properties identical by
    // design, each contributing exactly 0 — so two genuinely different designs scored 0.06 while a
    // sparser placeholder round scored 0.39. The metric was measuring how much shared chrome a panel
    // had, not how far the axis moved.
    // Fix: average over the properties that MOVE SOMEWHERE in the set. A property identical in every
    // panel is control, and control must not drag the number down. `rawDistance` is kept and reported
    // so the change is visible rather than a silent retune.
    function inPlayProps(sigs) {
      return VECTOR_PROPS.filter((p) => {
        const union = new Set();
        for (const s of sigs) for (const v of s.sig[p]) union.add(v);
        return union.size > 1;
      });
    }
    function jaccard(a, b) {
      const union = new Set([...a, ...b]);
      let inter = 0; for (const v of a) if (b.has(v)) inter += 1;
      return union.size ? (union.size - inter) / union.size : 0;
    }
    function sigDistance(s1, s2, props) {
      if (!props.length) return 0;   // nothing moved anywhere — identical, and that must FAIL
      let total = 0;
      for (const p of props) total += jaccard(s1[p], s2[p]);
      return total / props.length;
    }
    if (scopes.length >= 2) {
      const sigs = scopes.map(({ label, sr }) => ({ label, sig: panelSignature(sr) }));
      const props = inPlayProps(sigs);
      findings.meta.divergenceProps = props;
      findings.meta.divergencePropsTotal = VECTOR_PROPS.length;
      for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) {
        const d = sigDistance(sigs[i].sig, sigs[j].sig, props);
        const raw = sigDistance(sigs[i].sig, sigs[j].sig, VECTOR_PROPS);
        findings.divergence.push({
          pair: [sigs[i].label, sigs[j].label],
          distance: Math.round(d * 100) / 100,
          rawDistance: Math.round(raw * 100) / 100,
          propsInPlay: props.length,
          differ: d >= divergenceFloor,
        });
      }
    }
    // 4. COLOUR BUDGET (C4) — the accent belongs on a few surfaces, neutral everywhere else, but NOT
    // monochrome (doctrine: restraint is not absence). Counting RESOLVED colour on rendered elements,
    // because the budget is about what the eye sees, not how many times a token was typed.
    findings.colourBudget = [];
    const budget = opts.colourBudget != null ? opts.colourBudget : 4;
    for (const { label, sr } of scopes) {
      const els = [...sr.querySelectorAll('*')];
      const accentish = new Map();
      for (const el of els) {
        const cs = getComputedStyle(el);
        for (const prop of ['backgroundColor', 'borderTopColor', 'color']) {
          const v = cs[prop];
          if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
          const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!m) continue;
          const [r, g, b] = [+m[1], +m[2], +m[3]];
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          // A neutral is not part of the budget; a saturated colour is.
          if (sat < 0.25 || max < 40) continue;
          accentish.set(v, (accentish.get(v) || 0) + 1);
        }
      }
      const distinct = [...accentish.keys()];
      findings.colourBudget.push({
        label, distinctAccents: distinct.length, budget,
        surfaces: [...accentish.entries()].reduce((a, [, n]) => a + n, 0),
        withinBudget: distinct.length <= budget,
        monochrome: distinct.length === 0,
        colours: distinct.slice(0, 8),
      });
    }
    return findings;
  }

  g.OTTO_COMPUTED = { computedChecks, contrastRatio, relLuminance, deltaE, styleVector, vecDistance, parseColor };
})(typeof window !== 'undefined' ? window : globalThis);
