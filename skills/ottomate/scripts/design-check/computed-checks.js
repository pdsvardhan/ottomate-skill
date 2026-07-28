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
  // Hue in degrees (0..359). D-2: the colour budget counts distinct ACCENT HUES — one accent used at
  // several opacities/tints is one accent on a few surfaces, exactly what the budget allows.
  function hueOf(r, gg, b) {
    r /= 255; gg /= 255; b /= 255;
    const max = Math.max(r, gg, b), min = Math.min(r, gg, b), d = max - min;
    if (d === 0) return 0;
    let h;
    if (max === r) h = ((gg - b) / d) % 6;
    else if (max === gg) h = (b - r) / d + 2;
    else h = (r - gg) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
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
          // D-2 (2026-07-28): key by HUE bucket, NOT the full rgba string. Keying by string counted one
          // accent hue at N opacities (rgba(gold,.1), rgba(gold,.45)) as N distinct accents and
          // false-blocked a single-hue design. 15° buckets keep genuinely different hues apart.
          const bucket = Math.round(hueOf(r, g, b) / 15) % 24;
          const cur = accentish.get(bucket);
          if (cur) cur.count += 1;
          else accentish.set(bucket, { count: 1, sample: v });
        }
      }
      const distinct = [...accentish.values()];
      findings.colourBudget.push({
        label, distinctAccents: distinct.length, budget,
        surfaces: distinct.reduce((a, x) => a + x.count, 0),
        withinBudget: distinct.length <= budget,
        monochrome: distinct.length === 0,
        colours: distinct.slice(0, 8).map((x) => x.sample),
      });
    }
    // 5. ELEMENT RECORDS (C6 batch 3) — collect, do not judge. The rules themselves are pure
    // functions in computed-rules.mjs so they can be unit-tested in plain Node; this pass only has to
    // gather what they read. Emitted per panel and evaluated by the host runner.
    findings.records = [];
    // `dark` is which colour scheme this collection ran under. adv-dark-mode-type-optical compares
    // two record sets, so the HOST collects twice (emulateMedia) and merges — one pass cannot answer it.
    const dark = !!(opts.dark != null ? opts.dark : (g.matchMedia && g.matchMedia('(prefers-color-scheme: dark)').matches));
    // querySelectorAll('*') also returns <style>, <script>, <template>… — elements that render
    // nothing but still report a computed colour, font-weight and letter-spacing. They were showing
    // up in real output as `style.` rows drifting from the token set and failing the dark-mode type
    // check. Not design, not measurable, out.
    const NON_RENDERED = new Set(['style', 'script', 'template', 'link', 'meta', 'title', 'head', 'noscript']);
    for (const { label, sr } of scopes) {
      const rows = [];
      for (const node of sr.querySelectorAll('*')) {
        if (NON_RENDERED.has(node.tagName.toLowerCase())) continue;
        const cs = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const parent = node.parentElement;
        const pr = parent ? parseFloat(getComputedStyle(parent).borderTopLeftRadius) : null;
        const own = [...node.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue).join('').trim();
        rows.push({
          tag: node.tagName.toLowerCase(),
          cls: (node.className && String(node.className).split(/\s+/)[0]) || '',
          text: own.slice(0, 200),
          w: rect.width, h: rect.height,
          parentRadius: Number.isFinite(pr) ? pr : null,
          dark,
          // P1: a second channel beside colour can be an icon, so floor-not-colour-alone has to see one.
          hasIcon: !!node.querySelector('svg, img, use, [class*="icon"]'),
          styles: {
            fontSize: parseFloat(cs.fontSize) || 0,
            lineHeight: parseFloat(cs.lineHeight) || 0,
            fontFamily: cs.fontFamily,
            fontWeight: cs.fontWeight,
            fontVariantNumeric: cs.fontVariantNumeric,
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            borderRadius: parseFloat(cs.borderTopLeftRadius) || 0,
            boxShadow: cs.boxShadow,
            textAlign: cs.textAlign,
            paddingTop: parseFloat(cs.paddingTop) || 0,
            paddingBottom: parseFloat(cs.paddingBottom) || 0,
            // P1 additions
            marginTop: parseFloat(cs.marginTop) || 0,
            marginBottom: parseFloat(cs.marginBottom) || 0,
            // 'normal' parses to NaN; adv-dark-mode-type-optical needs a number it can subtract.
            letterSpacing: parseFloat(cs.letterSpacing) || 0,
          },
        });
      }
      findings.records.push({ label, rows });
    }

    // P1: the RESOLVED token set, for adv-token-adherence. Read off the declared custom properties
    // rather than the source text — a grep cannot see cascade resolution or color-mix()/oklch() output,
    // which is the whole reason that rule is method:"computed".
    // A custom property is SUBSTITUTED, not computed — getPropertyValue('--accent') hands back the
    // literal '#3395A9', never 'rgb(51, 149, 169)'. So each candidate is painted onto a throwaway
    // probe and read back through `color`, which the engine normalises to rgb() for us. Anything that
    // is not a colour fails to apply and reads back as the sentinel, which is how it gets filtered.
    findings.tokens = [];
    try {
      const SENTINEL = 'rgb(1, 2, 3)';
      for (const { label, sr } of scopes) {
        // A ShadowRoot is nodeType 11, so getComputedStyle() cannot be called on it. `:host` custom
        // properties compute on the HOST ELEMENT — reading them off document.body instead returned an
        // empty token set on the first real-Chromium run, and adv-token-adherence would then have
        // reported notApplicable forever without anyone noticing.
        const isShadow = !!sr.host;
        const anchor = isShadow ? sr.host : (sr.body || document.body);
        const mount = isShadow ? sr : (sr.body || document.body);
        if (!anchor || !mount) { findings.tokens.push({ label, values: [] }); continue; }
        const names = new Set();
        for (const sheet of (sr.styleSheets || [])) {
          let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
          for (const rule of rules || []) {
            if (!rule.style) continue;
            for (const prop of rule.style) if (String(prop).startsWith('--')) names.add(String(prop));
          }
        }
        if (!names.size) { findings.tokens.push({ label, values: [] }); continue; }
        const probe = document.createElement('span');
        probe.style.display = 'none';
        mount.appendChild(probe);
        const values = [];
        for (const n of names) {
          const raw = (getComputedStyle(anchor).getPropertyValue(n) || '').trim();
          if (!raw) continue;
          probe.style.color = SENTINEL;
          probe.style.color = raw;
          const resolved = getComputedStyle(probe).color;
          if (resolved && resolved !== SENTINEL) values.push(resolved);
        }
        probe.remove();
        findings.tokens.push({ label, values: [...new Set(values)] });
      }
    } catch (e) { findings.tokens = [{ label: 'error', values: [], error: String(e).slice(0, 120) }]; }
    return findings;
  }

  g.OTTO_COMPUTED = { computedChecks, contrastRatio, relLuminance, deltaE, styleVector, vecDistance, parseColor };
})(typeof window !== 'undefined' ? window : globalThis);
