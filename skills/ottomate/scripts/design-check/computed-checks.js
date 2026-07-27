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
    function sigDistance(s1, s2) {
      let total = 0;
      for (const p of VECTOR_PROPS) {
        const a = s1[p], b = s2[p];
        const union = new Set([...a, ...b]);
        let inter = 0; for (const v of a) if (b.has(v)) inter += 1;
        total += union.size ? (union.size - inter) / union.size : 0; // Jaccard distance
      }
      return total / VECTOR_PROPS.length;
    }
    if (scopes.length >= 2) {
      const sigs = scopes.map(({ label, sr }) => ({ label, sig: panelSignature(sr) }));
      for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++) {
        const d = sigDistance(sigs[i].sig, sigs[j].sig);
        findings.divergence.push({ pair: [sigs[i].label, sigs[j].label], distance: Math.round(d * 100) / 100, differ: d >= divergenceFloor });
      }
    }
    return findings;
  }

  g.OTTO_COMPUTED = { computedChecks, contrastRatio, relLuminance, deltaE, styleVector, vecDistance, parseColor };
})(typeof window !== 'undefined' ? window : globalThis);
