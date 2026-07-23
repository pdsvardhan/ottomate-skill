# H2 — Implementation feasibility matrix

*Design-intelligence reference. Track H2 of the registry research map. Written to be read by the design agent before it picks an implementation technique for any effect, and by a human owner auditing that choice.*

---

## 1. Scope line

This track owns **technique choice**: given a visual/interactive effect an AI UI-design tool wants to ship inside a single self-contained HTML file, which implementation family — pure CSS/HTML, inline SVG(+SMIL), Canvas 2D, WebGL/shaders, the Web Animations API, or a JS library — is feasible, at what authoring cost, and whether it actually survives a strict-CSP, offline, no-eval, no-WASM sandbox; it also owns how to hand-inline a React/Tailwind snippet into faithful vanilla HTML/CSS/JS, when a dependency earns its weight, and how to degrade any effect gracefully to a static floor.

## 2. Boundary (what this track does **not** cover)

- **Raw performance measurement, frame budgets, Core Web Vitals, CSS architecture at scale** → **E1 Performance**. H2 gives the qualitative performance *shape* of each technique (what it scales with); E1 owns the numbers and the measurement method.
- **Exact current browser-support percentages/versions and the full strict-CSP breakage list** (every directive, every header nuance) → **E2 Browser support & CSP**. H2 references E2's verdicts and gives only tiered support labels (Universal / Modern-evergreen / Gate-required) — enough to make a *technique choice*, not enough to be the support authority.
- **Sourcing actual assets and code snippets** (where to find/generate an icon set, a font, a Lottie JSON, a reusable component snippet) → **H1 Sourcing**. H2 assumes an asset or snippet already exists and asks *which technique family should render it, and does that family survive the sandbox*.
- **The motion-specific technique table** (duration/easing/choreography choices for animation) → **B1 Motion & animation systems**. B1 owns *how a motion should feel*; H2 owns *which engine can render any effect at all in this sandbox* and consolidates across the non-motion effects B1 doesn't touch (gradients, marks, charts, 3D, particles).
- **Accessibility conformance math** (contrast ratios, APCA, focus-order rules, ARIA-pattern correctness) → **A5 Accessibility**. H2 says whether a technique *has* DOM semantics to attach meaning to at all; A5 owns whether those semantics *pass* WCAG.
- **Whether an effect is worth its cost aesthetically, or reads as generic** → **F2 Distinctiveness**. H2 is agnostic to taste — it only answers "can this be built, in what, and does it survive."

---

## 3. Executive rules (apply these before reading the body)

1. **Default to the cheapest technique family that satisfies the effect, and escalate only when the lower rung is provably insufficient**: CSS → SVG → Canvas → WebGL → JS library. The effect→technique lookup (§5.3) makes "provably insufficient" checkable instead of a judgment call.
2. **"Library" always means inlined plain-JS text, never a CDN reference.** This sandbox is offline by definition — `<script src="https://cdn...">` fails the same way whether or not a CSP is even enforced, because there is no network path. Paste the library's built UMD/IIFE source.
3. **No-eval also means no-WebAssembly here — read that literally.** `'wasm-unsafe-eval'` is a *separate* CSP keyword from `'unsafe-eval'`; if neither is granted, `WebAssembly.instantiate()`/`.compile()` refuse outright, in every engine ([MDN `script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)). That eliminates Rive's web runtime, Three.js's `DRACOLoader`/`KTX2Loader`, and any WASM-compiled physics/noise engine — not conditionally, **always**, in this sandbox.
4. **Canvas and WebGL buy performance/expressiveness at the cost of every DOM accessibility semantic.** MDN is explicit that canvas content "is not exposed to accessibility tools as semantic HTML is" ([MDN `<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas)) — the same is true of WebGL. Use them only for genuinely decorative/generative content, and mirror anything information-bearing in real DOM/ARIA (§4.3).
5. **Inline SVG is the default for marks, icons, charts, and vector shapes.** It is simultaneously CSP-safe by construction, cheap on `transform`/`opacity`, and the only technique family that is accessible *by default* rather than by extra work.
6. **Reach for a JS dependency only when all five clauses of §4.4 hold**: native infeasibility, permissive licence, verified eval/WASM-free inlining, proportionate weight, fail-safe wrapping. GSAP passes the licence clause with a caveat — free, but a proprietary Webflow licence, not OSI-approved ([terms](https://gsap.com/community/standard-license/)) — disclose that tradeoff rather than silently shipping it.
7. **Every degradation ladder needs a true bottom rung**: zero JS, zero gated CSS feature, always renders correctly. That rung is what ships under `prefers-reduced-motion: reduce`, to any engine that fails a feature check, and to anything that throws (§4.6).
8. **Hand-inline React/Tailwind by resolving the framework away, not shrinking it**: strip JSX/hooks/imports entirely, compile Tailwind to a static stylesheet *offline* (never the Play CDN at runtime), turn `onClick`-style handlers into `addEventListener` calls inside the file's own script block, and never introduce `eval`/`new Function` in translation (§4.5).
9. **Never use inline event-handler attributes or `javascript:` URIs.** A hash/nonce-based strict `script-src` does not cover `onclick="..."` by default — only `'unsafe-inline'` or the narrower `'unsafe-hashes'` does ([content-security-policy.com](https://content-security-policy.com/unsafe-inline/)). Wire everything through `addEventListener` inside the one covered `<script>` block.
10. **"Single-file" and "no-network" are two separate checks, not one.** A technique can be trivially single-file (its code is just text) yet still reach the network by default — a CDN script, a Google Fonts `@import`, a runtime `fetch()`. Verify both independently for every technique and every library.
11. **Treat "performance" here as *shape*, not a number.** CSS/SVG/WAAPI scale with DOM node count and which CSS properties you touch; Canvas/WebGL scale with pixel/shader cost, not DOM size. Match the family's scaling curve to your actual N. Exact budgets and measurement method belong to **E1**.
12. **Treat "browser support" here as a tier, not a percentage.** Universal (ship with no gate), Modern-evergreen (safe for a 2026 general-purpose target, gate lightly), Gate-required (needs `@supports`/feature-detect + a real fallback). Exact current numbers and the full CSP breakage list belong to **E2** — re-verify at build time.
13. **A CSP-safe technique can still break for a reason that has nothing to do with CSP.** SMIL only animates an SVG that's inlined in the document — not one referenced via `<img src>` or CSS `background-image`; Web Workers and Houdini Paint Worklets need a script resource that a strict `worker-src`/`script-src` may not extend to `blob:`/`data:` even when the main document is fine. Verify each; don't assume from the family's general verdict (§6).
14. **Mirror data-bearing Canvas/WebGL output in accessible DOM text as a default habit, not an edge case** — a chart's numbers, a mark's meaning. It's cheap (a visually-hidden table or summary) relative to rebuilding the visual in SVG, and it's the only way the content exists for a screen reader (§4.3).
15. **Verify a library's "eval/WASM-free" reputation against the specific pinned version's actual code.** Popular libraries have shipped eval in specific, avoidable code paths before — Chart.js's pre-v3 string tooltip/label templates used `new Function()` ([chartjs/Chart.js#281](https://github.com/chartjs/Chart.js/issues/281)). Grep the pasted source for `eval(`, `new Function(`, and `.wasm` before trusting it (§6).

---

## 4. Body

### 4.1 The sandbox model — what "single-file, strict-CSP, offline, no-eval" actually forbids

**Working definition used throughout this report** (inherited from the brief; cross-check against **E2** for the exact policy this tool applies): the delivered artifact is *one* `.html` file; it runs with **zero** outbound network access; its CSP grants **neither** `'unsafe-eval'` **nor** `'wasm-unsafe-eval'`. Every verdict below assumes exactly this — a technique that is "fine under a typical strict CSP" but quietly relies on a WASM allowance is **not** fine here.

Four separate constraints, each with its own failure signature:

| Constraint | Means | Typical violation | Detect |
|---|---|---|---|
| **Single-file** | Every byte — markup, CSS, JS, fonts, images, JSON — lives in the one `.html`; no sibling files, no relative paths | `<link rel="stylesheet" href="style.css">`, `<img src="logo.svg">` pointing at a file that won't travel with the HTML | Broken image icon, unstyled page, 404 in console if served, blank if opened via `file://` |
| **Offline / no-network** | Zero outbound requests at runtime — no CDN, no Google Fonts, no `fetch()`/`XHR`, no analytics beacon | `<script src="https://cdn.jsdelivr.net/...">`, `@import url(https://fonts.googleapis.com/...)`, a runtime `fetch()` call | Pending/failed request in the network panel; console CSP `connect-src`/`script-src` violation if a CSP is enforced, or a silent hang if there is genuinely no network path |
| **No-eval** | CSP `script-src` omits `'unsafe-eval'` | `eval()`, `new Function()`, string-argument `setTimeout("...", n)`/`setInterval(...)` | Console: *"Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source..."* ([MDN `script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)) |
| **No-WASM-eval** | CSP `script-src` also omits `'wasm-unsafe-eval'` — a **separate keyword** from `'unsafe-eval'` | `WebAssembly.instantiate()`/`.compile()` anywhere on the page or inside a pasted library | Console: WASM compile/instantiate refused. This is stricter than most "strict CSP" writeups assume, since many only discuss `unsafe-eval` and treat WASM as a separate, sometimes-granted allowance — verify the sandbox truly omits **both** keywords ([MDN: `'wasm-unsafe-eval'` is more specific than `'unsafe-eval'`, and WebAssembly is blocked if neither is present](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)) |

In practice the host most plausibly enforces this either as a real HTTP response header (if it ever serves the file from a server) or as a `<meta http-equiv="Content-Security-Policy">` tag baked into the document, using **hash-based** `script-src`/`style-src` sources computed over the file's own inline `<script>`/`<style>` blocks — nonces need a fresh per-response random value, which a static file re-opened later can't regenerate, so hash-based is the mechanism that actually works for a file that must stay valid every time it's opened ([web.dev: strict CSP](https://web.dev/articles/strict-csp)). Two consequences follow: (1) keep to as few inline `<script>`/`<style>` blocks as practical, since each needs its own hash; (2) `frame-ancestors`, `report-uri`/`report-to`, and `sandbox` are documented CSP directives that are **HTTP-header-only** — a `<meta>`-delivered policy does not enforce them. *(This paragraph states standard CSP-spec behavior; it was not independently re-fetched this session — cross-check against E2's exact delivery mechanism before relying on it, see §8.)*

None of this is a technique choice can override — every row in §5.1 inherits these four constraints as a hard floor. What changes per technique is *how much of its usual implementation survives them intact*.

### 4.2 Technique families at a glance — the one idea that explains each row

Six families, one unifying mechanic each, worth internalizing before reading the matrix:

- **Pure CSS/HTML** is cheapest because the browser's own compositor already knows how to move a layer — you're not asking it to do new work, just telling it *which* work (`transform`/`opacity`) to run on the GPU thread instead of the main thread. Its ceiling is expressiveness, not speed: no native spring, no per-object imperative control, and multi-step choreography gets verbose fast (see B1 §4.3 on approximating springs with long `@keyframes`).
- **Inline SVG** is a DOM tree of real, stylable, scriptable shapes — it inherits CSS's compositor cheapness for `transform`/`opacity` on `<g>`/`<path>` *and* keeps full accessibility semantics, at the cost of per-node overhead once shape count climbs into the thousands (rarely true for icons/marks; sometimes true for generative art — that's the cue to jump to Canvas).
- **Canvas 2D** trades every one of SVG's per-node conveniences (hit-testing, CSS styling, an accessibility tree, individually addressable nodes) for a single bitmap painted by hand — which is exactly why it's *cheaper* at high object counts: there is no DOM to keep in sync.
- **WebGL** makes the same trade one level deeper: even the bitmap's *pixels* are computed in parallel on the GPU instead of one CPU core, at the cost of a much higher authoring floor — you're writing a rendering pipeline, not calling `fillRect`.
- **WAAPI** is CSS's compositor model exposed as a JS object instead of a stylesheet rule — the same performance ceiling as CSS transitions/keyframes, with imperative control (`.pause()`, `.reverse()`, `.finished`) pure CSS can't offer.
- **JS animation libraries** don't add a new rendering path at all: Motion and anime.js ultimately drive WAAPI/CSS properties; GSAP ultimately sets style properties or drives Canvas/SVG. The library's value is orchestration ergonomics — timelines, stagger, spring-feeling easing, gesture/drag handling — not a performance tier the underlying primitive didn't already have. Judge a library purely on *how much hand-written code it saves* and *what it costs to inline safely* (§4.4).

### 4.3 Accessibility — DOM semantics vs none, per family

DOM semantics is closer to binary than a spectrum per family: a technique either hands the accessibility tree a real node to describe, or it hands it nothing.

| Family | What the accessibility tree sees | The pattern that closes the gap |
|---|---|---|
| CSS/HTML, WAAPI | Whatever real element is being animated | Don't let the animation *strand* focus, or leave `aria-hidden`/`display:none` set on a focused element mid-transition |
| Inline SVG | Each shape, **if** labeled | `role="img"` + `aria-label` (or a `<title>` as the first child) on the root `<svg>` for a single graphic; per-shape labels only for genuinely separate interactive parts — don't over-narrate decorative sub-paths |
| Canvas 2D, WebGL | Nothing — a bitmap. MDN: canvas content "is not exposed to accessibility tools as semantic HTML is," and recommends avoiding canvas in an accessible app where a semantic alternative exists ([MDN `<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas)) | `role="img"` + `aria-label` for static-meaning content; a visually-hidden DOM twin (a real `<table>`, a text summary) for data-bearing content like a chart, so the *numbers* survive independent of the picture (see [Chart.js's own accessibility guidance](https://www.chartjs.org/docs/latest/general/accessibility.html), which recommends exactly this pattern) |
| JS libraries | Inherits whichever of the above it targets | Same fix as the underlying target |

Conformance math (contrast ratios, focus-order rules, ARIA-pattern correctness) is **A5**'s job; H2 stops at "does this family give you a node to attach semantics to, yes or no." For a structured pass on a finished screen, use the `design:accessibility-review` audit.

### 4.4 When is a JS dependency worth it? — the decision rule

Reach for a dependency only when **every** one of these clauses is true — it's a conjunction, not a menu:

1. **Native infeasibility.** The effect is infeasible, or disproportionately expensive to hand-roll, in CSS/SVG/Canvas/WAAPI alone (real rigid-body physics, force-directed graphs, a full chart library's worth of scales/legends/tooltips, frame-accurate After-Effects-authored playback).
2. **Permissive licence.** MIT/Apache-2.0/ISC/BSD/Unlicense — or, for the one common non-OSI exception in this space (GSAP), the tradeoff is disclosed and accepted rather than silently shipped.
3. **Verified eval/WASM-free inlining.** Zero `eval`/`new Function`/`WebAssembly` in the code paths actually exercised, checked against the specific pinned version — not the library's reputation (§6, rule 15).
4. **Proportionate weight.** Its footprint matches the effect's value in the file — a 6 KB confetti burst for a completion moment: yes; a 500 KB+ dashboard engine for one static bar chart: no, hand-roll a dozen SVG `<rect>`s instead.
5. **Fails safe.** Wrapped so that if construction throws or a required API is missing, the page falls to the next rung of its degradation ladder (§4.6) instead of going blank.

If any one clause fails, hand-roll the effect natively instead. The matrix in §5.1 exists precisely so clause 1 ("infeasible natively") is a checkable claim rather than a guess. Worked example verdicts: **Matter.js** for real stacking/collision physics — clearly passes (genuinely hard to hand-roll, MIT); **vanilla-tilt.js** for a hover tilt — borderline (about 20 lines of `pointermove` + `transform` does the same thing; add it only if you're shipping several pointer-driven effects and want one consistent implementation, not for a single card).

### 4.5 Worked example — hand-inlining a React + Tailwind component to vanilla HTML/CSS/JS

**Before — a typical React + Tailwind component:**

```jsx
import { useState } from "react";

function StatCard({ label, value, trend, items }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur p-5 shadow-lg w-[280px]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}
        >
          {trend >= 0 ? `+${trend}%` : `${trend}%`}
        </span>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <button
        className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>{item.name}</span><span>{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
// usage: <StatCard label="Revenue" value="$42,900" trend={12}
//   items={[{name:"Online",value:"$31,200"},{name:"Retail",value:"$11,700"}]} />
```

**The method — six steps:**

1. **Inventory every React-ism.** Here: one import, four props (`label`,`value`,`trend`,`items`), one state variable (`expanded`), one event handler (`onClick`), one conditional className (ternary on `trend`'s sign), one conditional-render block (`expanded && (...)`), one `.map()` list render.
2. **Resolve props to literal values.** A design-tool mock is generated with known content, not bound to live data — so `label`, `value`, `trend`, `items` become literal text/attributes at generation time, not runtime variables.
3. **Decide state: static or vanilla-JS-interactive.** `expanded` is genuinely interactive (a user toggles it) — keep it, but as a DOM attribute (`hidden`) flipped by a plain closure, not a framework state cell. A conditional className that's *derived from a prop already resolved in step 2* (the trend ternary) is not state — resolve it once, at generation time, to the concrete class string.
4. **Unroll what's static, keep what's dynamic.** `items.map()` is driven by data known at generation time → unroll it into static repeated `<li>` markup. This is a big part of why hand-inlining a *design-tool mock* is easier than a general React→vanilla port: the data is frozen, so most `.map()`/ternary logic collapses to plain HTML, and only genuine user-interaction state needs real JS.
5. **Compile Tailwind to static CSS, offline, before the file exists.** Collect every class used (both ternary branches) and run the standalone CLI — no Node.js, no network required ([Tailwind standalone CLI](https://tailwindcss.com/blog/standalone-cli)):
   ```bash
   ./tailwindcss -i input.css -o output.css --minify --content "./mock.html"
   ```
   Paste the compiled output into one `<style>` block. **Never** load `cdn.tailwindcss.com` at runtime — it fetches over the network and runs a JIT compiler in-page, failing both the no-network rule and, depending on build, the no-eval rule. If the sandboxed file might ever render inside a page that *also* ships Tailwind (rather than in its own iframe), set `prefix: 'tw-'` in the Tailwind config before compiling so `.flex` becomes `.tw-flex` — cheap insurance against class collisions; skip it if the host always isolates each variant (confirm that embedding model with the host/**E2** rather than assuming it).
6. **Translate JSX syntax and wire events without eval.** `className`→`class`; drop `key`; replace `onClick={fn}` with `addEventListener('click', fn)` inside the file's one script block — never an `onclick="..."` attribute (§6, rule 5).

**After — the vanilla output:**

```html
<div class="rounded-2xl bg-white/80 backdrop-blur p-5 shadow-lg w-[280px]" id="stat-card">
  <div class="flex items-center justify-between">
    <span class="text-sm font-medium text-slate-500">Revenue</span>
    <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">+12%</span>
  </div>
  <div class="mt-2 text-3xl font-semibold text-slate-900">$42,900</div>
  <button class="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
          id="stat-card-toggle" aria-expanded="false" aria-controls="stat-card-list">
    Show details
  </button>
  <ul class="mt-2 space-y-1 text-sm text-slate-600" id="stat-card-list" hidden>
    <li class="flex justify-between"><span>Online</span><span>$31,200</span></li>
    <li class="flex justify-between"><span>Retail</span><span>$11,700</span></li>
  </ul>
</div>

<script>
(function () {
  var btn = document.getElementById('stat-card-toggle');
  var list = document.getElementById('stat-card-list');
  btn.addEventListener('click', function () {
    var willOpen = list.hasAttribute('hidden');
    if (willOpen) { list.removeAttribute('hidden'); } else { list.setAttribute('hidden', ''); }
    btn.setAttribute('aria-expanded', String(willOpen));
    btn.textContent = willOpen ? 'Hide details' : 'Show details';
  });
})();
</script>
```

(`<style>` holds the Tailwind CLI's compiled output for exactly the classes used — machine-generated, not hand-transcribed; omitted here for length.) Note the two `aria-*` attributes: the original React version had **no** accessible-expanded-state signal at all — a common real-world gap. Faithful translation means preserving pixels *and* upgrading semantics where the source was already thin, not just porting the gap forward.

**Verify before shipping:**
- Grep the final file for `eval(`, `new Function(`, `document.write(`, `.innerHTML =`, `<script src="http`, `@import url(http`, `fonts.googleapis` — zero hits.
- Confirm no `onclick=`/other inline-handler attributes remain.
- Open it locally behind a real strict CSP meta tag (`script-src 'sha256-...'; style-src 'sha256-...'; img-src data:; font-src data:; default-src 'none'`) and confirm zero console CSP violations.

### 4.6 Worked example — graceful-degradation ladder for a fluid/mesh gradient background (WebGL → Canvas → CSS → static)

The pattern: **markup always contains the bottom rung**; JS attempts to *upgrade* it; nothing is removed until the next rung is confirmed working; `prefers-reduced-motion: reduce` short-circuits straight to the bottom.

**Tier 1 — WebGL** (richest, priciest; a hand-rolled full-screen-quad shader, no 3D engine needed for a flat effect):

```html
<div id="mesh-slot" class="mesh-fallback"><!-- Tier 3/4 CSS lives here by default, see below --></div>
<script>
(function () {
  var slot = document.getElementById('mesh-slot');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // stay on Tier 3/4, do nothing

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  var gl = canvas.getContext('webgl');

  if (gl) {
    slot.replaceWith(canvas);
    var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }';
    var fs = [
      'precision mediump float; uniform float u_time; uniform vec2 u_res;',
      'void main () {',
      '  vec2 uv = gl_FragCoord.xy / u_res;',
      '  float t = u_time * 0.05;',
      '  float a = sin((uv.x+t)*3.0) * 0.5 + 0.5;',
      '  float b = cos((uv.y-t)*3.0) * 0.5 + 0.5;',
      '  vec3 c1 = vec3(0.36,0.20,0.92), c2 = vec3(0.98,0.36,0.55), c3 = vec3(0.20,0.80,0.90);',
      '  gl_FragColor = vec4(mix(mix(c1,c2,a), c3, b*0.6), 1.0);',
      '}'
    ].join('\n');
    function compile(type, src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uTime = gl.getUniformLocation(prog, 'u_time'), uRes = gl.getUniformLocation(prog, 'u_res');
    (function frame(t) {
      var w = canvas.clientWidth, h = canvas.clientHeight; // production: also multiply by devicePixelRatio (E1)
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0,0,w,h); }
      gl.uniform2f(uRes, w, h); gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    })(0);
  } else {
    // Tier 2 — Canvas 2D
    var ctx2 = canvas.getContext('2d');
    if (ctx2) {
      slot.replaceWith(canvas);
      function blob(ctx,x,y,r,color){
        var g = ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,color); g.addColorStop(1,'transparent');
        ctx.fillStyle = g; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); // real deploy: bound to blob's rect, not full canvas (E1)
      }
      (function draw(t) {
        var w = canvas.width = canvas.clientWidth, h = canvas.height = canvas.clientHeight;
        ctx2.clearRect(0,0,w,h);
        ctx2.filter = 'blur(40px)'; // Modern-evergreen only (Safari 15.4+); drop for older-engine targets
        blob(ctx2, w*0.3 + Math.sin(t/4000)*40, h*0.3, w*0.5, '#5c34eb');
        blob(ctx2, w*0.7, h*0.6 + Math.cos(t/5000)*40, w*0.5, '#fa5c8c');
        blob(ctx2, w*0.5 + Math.sin(t/6000)*30, h*0.8, w*0.4, '#33cce6');
        requestAnimationFrame(draw);
      })(0);
    }
    // else: neither WebGL nor Canvas 2D available — leave `slot` untouched, Tier 3/4 CSS keeps showing
  }
})();
</script>
```

**Tier 3/4 — CSS-only** (the markup's default; also the reduced-motion / no-script / no-Canvas floor — note the media query makes this *one* block serve as both the animated Tier 3 and the static Tier 4, since "Tier 4" is simply this same rule with `animation: none`):

```css
.mesh-fallback {
  position: absolute; inset: 0;
  background:
    radial-gradient(at 30% 30%, #5c34ebcc 0, transparent 60%),
    radial-gradient(at 70% 60%, #fa5c8ccc 0, transparent 60%),
    radial-gradient(at 50% 80%, #33cce6cc 0, transparent 55%),
    #12081f;
  background-size: 140% 140%;
  animation: mesh-drift 18s ease-in-out infinite;
}
@keyframes mesh-drift {
  0%, 100% { background-position: 0% 0%, 100% 100%, 50% 100%; }
  50%      { background-position: 20% 10%, 80% 90%, 60% 80%; }
}
@media (prefers-reduced-motion: reduce) {
  .mesh-fallback { animation: none; } /* this is Tier 4 */
}
```

**Detection logic, stated plainly:** feature-detect (`getContext('webgl')` → `getContext('2d')` → neither), never assume; markup order guarantees a correct result even if the whole `<script>` block fails to run; `prefers-reduced-motion` is checked *before* attempting the richest tier, not applied as an afterthought on top of it.

**The same ladder pattern, compressed, for other effects** (full code omitted for length — the wiring is identical: markup defaults to the last column, JS attempts to upgrade):

| Effect | Tier 1 (richest) | Tier 2 | Tier 3 | Tier 4 (static / reduced-motion) |
|---|---|---|---|---|
| Particle field | WebGL instanced points | Canvas 2D + rAF (100s of particles) | ~20–40 absolutely-positioned `<span>`s with CSS `@keyframes` | A handful of static dots, `opacity` only |
| 3D product/scene viewer | WebGL (Three.js: orbit + lighting) | Canvas 2D pre-rendered sprite-sheet rotation | CSS 3D `rotateY` tilt on a flat image | Single static hero image |
| Complex vector mark/logo | lottie-web (inlined JSON) | SVG + WAAPI (stroke-draw/morph) | SVG + CSS `@keyframes` | Static SVG, no animation |
| Animated gradient/rainbow border | `@property`-animated `conic-gradient` spin | SVG stroke rotate | CSS static gradient border | Static solid-color border |
| Data chart entrance | Canvas (Chart.js animated) or SVG (D3 animated) | SVG hand-rolled bars/lines with CSS transition | Static SVG shapes, no entrance | *(no further tier — legibility floor, data must stay readable, not blank)* |

---

## 5. Options catalogue

### 5.1 The feasibility matrix — technique families × dimensions

"CSP-safe"/"inlines clean" below means: survives the four constraints in §4.1 with no code change. "Conditional" means: survives *if* you follow the specific practice named — verify the exact claim, don't assume.

| Family | Implementation cost | Browser support (tier; % → **E2**) | Runtime performance (qualitative; budgets → **E1**) | Accessibility impact | Single-file | No-network | No-eval | Licence |
|---|---|---|---|---|---|---|---|---|
| **Pure CSS/HTML** | Low for states/loops; no native spring, no interruption model | Universal core; `@property`/`color-mix()`/`backdrop-filter`/`animation-timeline` = Modern-evergreen, gate with `@supports` | Cheapest tier available anywhere — compositor-only on `transform`/`opacity`; scales with **DOM node count** | Full — real elements keep their real semantics | Trivial | Trivial | Trivial (declarative) | Platform, no licence |
| **Inline SVG (+SMIL)** | Low–medium; path morphing needs equal point structure or a helper lib | Universal core + CSS-on-SVG; SMIL never actually removed but CSS/WAAPI preferred for transform/opacity ([CSS-Tricks: SMIL on?](https://css-tricks.com/smil-on/)) | DOM-per-shape; fine to the low hundreds of nodes (marks, icons, small charts) | Best-case *if authored for it* — every shape is a labelable DOM node (`role`, `aria-label`, `<title>`); zero if left bare | Trivial **only if inlined in-body** — `<img src>`/CSS `background-image` breaks SMIL and CSS-variable theming (§6) | Trivial | Trivial (declarative XML, not script) | Platform, no licence |
| **Canvas 2D + rAF** | Medium–high — imperative redraw loop, hit-testing, DPR scaling, resize all hand-written | Universal (shipped ~2010) | CPU-rasterized bitmap; scales with **pixel area × draw calls**, not DOM size — beats SVG/DOM past roughly hundreds of independently-moving objects; main-thread unless paired with `OffscreenCanvas`+Worker | **None by default** — MDN: not exposed to accessibility tools ([MDN `<canvas>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas)); requires hand-authored `role="img"`/DOM twin | Trivial | Trivial | Trivial for the native API; audit any *pasted library* separately | Platform, no licence |
| **WebGL/shaders (raw)** | High for a lit 3D scene; moderate for a single full-screen shader (no scene graph needed) | Universal WebGL1, near-universal WebGL2; low-power/software-render GPUs may refuse context | GPU-bound; flat cost across huge pixel/particle counts that would choke Canvas/DOM — real fixed costs: shader-compile stalls, thermal/battery draw, context loss | **None by default**, same void as Canvas, worse in practice since content is *only ever* pixels | Trivial — GLSL is a plain JS string, no separate asset | Trivial | Trivial for raw `gl.compileShader`/`linkProgram` — GLSL compiles via the browser's native driver, not JS `eval` ([MDN `WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader)). **Caveat:** higher-level engines that transpile GLSL→WGSL for a WebGPU code path (e.g. Babylon.js's `glslang`) lazy-load a **WASM** compiler and hit the no-WASM wall — confirmed scoped to the WebGPU path only, not plain WebGL ([Babylon.js forum](https://forum.babylonjs.com/t/glslang-csp-issue/58177)) | Platform, no licence |
| **Web Animations API** | Low–medium — imperative but declarative-shaped (`el.animate(keyframes, options)`); native `.pause()`/`.reverse()`/`.finished` | Universal (`Element.animate` evergreen for years) | Same compositor ceiling as CSS for `transform`/`opacity` — same underlying engine | Inherits the target element's semantics (same model as CSS) | Trivial — DOM API, no library | Trivial | Trivial — plain method call, no eval, no WASM | Platform, no licence |
| **JS animation libraries** (Motion, anime.js, GSAP, …) | Low *for what they cover* (springs, timelines, stagger, gesture); cost is dependency weight + learning curve, not authoring difficulty | Whatever DOM/Canvas primitive they drive supports — libraries add ergonomics, not browser support | Ceiling of the primitive they target (WAAPI/CSS-backed ⇒ compositor-cheap; Canvas-backed ⇒ Canvas's ceiling) | Inherits the target's semantics (DOM-backed) or Canvas's void (Canvas-backed) | Conditional — paste the built UMD/IIFE source as literal `<script>` text; never a CDN reference | Conditional — same; verify no auto-fetch (font/plugin auto-loaders) | Conditional — verify the *specific pinned version* has no `eval`/`new Function`/WASM path (§5.2, §6, rule 15) | **Varies — mostly MIT/Apache/ISC; GSAP is free but a non-OSI Webflow licence (§5.2)** |

### 5.2 Named library verdicts

The "JS animation libraries" row above is one line covering many different licences and costs — broken out here, plus the WebGL-helper, charting, particle, and vector-mark libraries an AI UI-design tool is likely to reach for. Every licence below was confirmed directly against the project's own repository/licence file this session.

| Library | Category | For | Licence (verified) | Approx. cost | CSP/sandbox verdict | Watch for |
|---|---|---|---|---|---|---|
| **Motion** (motion.dev) | Animation, DOM/WAAPI-backed | Springs, gestures, orchestration — vanilla, React, Vue | **MIT** ([motion.dev](https://motion.dev/)) | Small; vendor claims "up to 90% smaller than GSAP equivalents" for comparable APIs — verify the actual KB of your specific import set | Inlines clean — plain JS, no eval/WASM | Successor to "Framer Motion"/"Motion One" — same MIT licence, now one unified vanilla+React+Vue package |
| **anime.js v4** | Animation, DOM/CSS/SVG-backed | Timelines, stagger, SVG path draw | **MIT** ([LICENSE.md](https://github.com/juliangarnier/anime/blob/master/LICENSE.md)) | Small; ships ESM/UMD/CJS/IIFE builds | Inlines clean — grab the IIFE/UMD build for a direct `<script>` paste (v4 is ESM-first by default) | v3→v4 is a breaking rewrite; pin the version you test against |
| **GSAP** (core + plugins) | Animation, DOM/SVG/Canvas-agnostic | Hardest sequencing, ScrollTrigger, Draggable | **Free "Standard No-Charge" licence, owned by Webflow — NOT OSI-approved** ([terms](https://gsap.com/community/standard-license/), [Webflow made it free](https://webflow.com/blog/gsap-becomes-free)) | Core ~30–70 KB depending on plugins | Inlines clean (plain JS, no eval/WASM) | Licence forbids building a *competing visual animation builder* — irrelevant to shipping one UI, but disclose the non-OSI status per §4.4 clause 2 |
| **Three.js** | WebGL 3D engine | Full 3D scenes, materials, lighting, cameras | **MIT**, copyright 2010–2026 ([LICENSE](https://github.com/mrdoob/three.js/blob/dev/LICENSE)) | Core 150 KB+ min; grows fast with loaders/postprocessing | Core inlines clean. **`DRACOLoader`/`KTX2Loader` pull in WASM decoders — do not use in this sandbox; ship uncompressed geometry/textures instead** | Easy to accidentally import a WASM-backed loader transitively — audit imports |
| **OGL** | Minimal WebGL helper | Full-screen shaders, light 3D, when Three.js is overkill | **Unlicense** (public-domain-equivalent) ([package.json](https://github.com/oframe/ogl/blob/master/package.json)) | ~30 KB — a fraction of Three.js | Inlines clean, no WASM | Smaller community/docs; you write more of the scene graph yourself |
| **PixiJS** | 2D-via-WebGL renderer | Fast many-sprite 2D (not 3D) | **MIT** ([LICENSE](https://github.com/pixijs/pixijs/blob/dev/LICENSE)) | Comparable order of magnitude to Three.js | Inlines clean | Overkill next to Canvas 2D unless object count genuinely needs GPU batching |
| **D3.js** (`d3-*` modules) | Data-driven SVG/Canvas | Custom charts, scales, axes, force layouts, geo | **ISC** — functionally MIT-equivalent, simpler wording ([package.json](https://github.com/d3/d3/blob/main/package.json)) | Import only the needed `d3-*` submodules; the full `d3` bundle is large | Inlines clean | Steep API surface — for a standard bar/line/pie, Chart.js is less code |
| **Chart.js** | Canvas charting | Standard chart types with legends/tooltips/animation out of the box | **MIT** ([LICENSE.md](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md)) | ~200 KB min for core + all controllers; tree-shake to used chart types | **Verify the build**: legacy versions used `new Function()` for string tooltip/label templates — a real CSP eval violation ([chartjs/Chart.js#281](https://github.com/chartjs/Chart.js/issues/281)); modern function-callback options avoid it entirely — don't opt into string templates | Canvas output needs the `role="img"` + `aria-label` pattern from [Chart.js's own accessibility docs](https://www.chartjs.org/docs/latest/general/accessibility.html) |
| **Apache ECharts** | Canvas/SVG charting | Complex/large-dataset dashboards, heatmaps, geo | **Apache-2.0** ([LICENSE](https://github.com/apache/echarts/blob/master/LICENSE)) | Large (500 KB+ full build); use the official custom-build tool to trim | Inlines clean | Heaviest option here — reserve for genuinely complex dashboards, not a single KPI card |
| **tsParticles** | Canvas particle engine | Particle fields, confetti, fireworks, snow presets | **MIT** ([repo](https://github.com/tsparticles/tsparticles)) | Modular — `@tsparticles/engine` + `slim`/`basic` bundle keeps it reasonable; `all` is heavy | Inlines clean | Grab `engine`+`slim` only, not `all`, for single-file weight |
| **canvas-confetti** | Canvas one-shot effect | Burst/cannon confetti on a success moment | **ISC** ([LICENSE](https://github.com/catdad/canvas-confetti/blob/master/LICENSE)) | ~6 KB min | Inlines clean | Purpose-built for one thing — don't reach for tsParticles if this is all you need |
| **lottie-web** | AE/JSON vector player | Designer-authored complex marks/illustrations | **MIT** ([LICENSE.md](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md)) — see B1 §4.6 for the full CSP writeup | ~250 KB min / ~60 KB gz full build; `_light` build smaller | Inlines clean — plain JS, no WASM | JSON payload can dominate file size; Canvas renderer variant ignores CSS |
| **Rive runtime** | State-machine vector player | Interactive, stateful vector characters | **MIT** (runtime itself) ([LICENSE](https://github.com/rive-app/rive-runtime/blob/main/LICENSE)) | N/A | **Blocked** — the web runtime is WebAssembly; this sandbox grants no `wasm-unsafe-eval` | Do not select for this sandbox regardless of the permissive licence (rule 3; B1 §4.6) |
| **flubber** | SVG path interpolation | Morph between shapes with different point counts/topology | **MIT** ([package.json](https://github.com/veltman/flubber/blob/master/package.json)) | Small | Inlines clean | Only needed when endpoints aren't already point-compatible — try hand-equalizing points first (one less dependency) |
| **vanilla-tilt.js** | Pointer-driven CSS transform | 3D tilt-on-hover cards | **MIT** ([package.json](https://github.com/micku7zu/vanilla-tilt.js/blob/master/package.json)) | ~4 KB | Inlines clean | ~20 lines of hand-rolled `pointermove`+`transform` does the same thing — run it through §4.4 before adding |
| **Typed.js** | Text animation | Typewriter effect with variable timing/backspacing | **MIT** ([LICENSE.txt](https://github.com/mattboldt/typed.js/blob/master/LICENSE.txt)) | ~6 KB | Inlines clean | A `setInterval` substring reveal is ~15 lines — reach for the library only for multi-string cycling/backspace choreography |
| **Matter.js** | 2D rigid-body physics | Real gravity/collision (falling, bouncing, stacking UI elements) | **MIT** ([repo](https://github.com/liabru/matter-js)) | Moderate | Inlines clean | Genuinely hard to hand-roll correctly — one of the clearest "dependency passes §4.4" cases |
| **Konva.js** | Canvas 2D scene-graph | Interactive/draggable canvas shapes with per-object hit-testing | **MIT** ([LICENSE](https://github.com/konvajs/konva/blob/master/LICENSE)) | Moderate | Inlines clean | Re-adds some of SVG's per-object conveniences on top of Canvas — compare against "just use SVG" first |

### 5.3 Effect → technique lookup

Organized by effect category. "Primary" is the default pick; "Fallback" is what to use when the primary is infeasible, over-budget, or fails its `@supports`/feature-detect gate.

#### Backgrounds & surfaces

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Flat/linear/radial/conic gradient | CSS `background` | — | Universal, zero cost |
| Animated gradient shift (hue/position) | CSS `@property` + `animation` on the registered custom property | Plain `background-position` keyframe (works without `@property`, less smooth on color stops) | `@property` = 93.3% global, Modern-evergreen ([caniuse](https://caniuse.com/mdn-css_at-rules_property), verify §E2) |
| Glassmorphism / frosted panel | CSS `backdrop-filter: blur()` | Solid translucent panel, no blur | 94.6% global ([caniuse](https://caniuse.com/css-backdrop-filter), verify §E2) |
| Animated gradient/rainbow border | `@property`-animated `conic-gradient` spun via `background`, revealed with `padding` + `background-clip` | SVG `<rect>`/`<path>` stroke with animated `stroke-dashoffset`/rotation | See B1 §4.6 for the SVG stroke-draw mechanics |
| Fluid / mesh gradient (Stripe-style) | WebGL fragment shader (hand-rolled full-screen quad — §4.6 worked example) | Canvas 2D layered blurred radial gradients | CSS: 3–4 stacked `radial-gradient()` layers, `@keyframes` on `background-position` (full ladder in §4.6) |
| Noise / grain texture overlay | SVG `feTurbulence` filter — procedural, zero asset weight | Small base64 PNG noise tile (asset — sourcing is **H1**'s job) | Native SVG filter, no library, no network |
| Liquid / gooey blob merge | SVG filter: `feGaussianBlur` + `feColorMatrix` (the "goo" contrast trick) | CSS `filter: blur()` + `filter: contrast()` layered on overlapping divs (coarser) | Native, no library |
| Blob / organic shape morph | CSS `border-radius` keyframe animation (cheap, approximate) | SVG `<path>` `d` morph via SMIL/WAAPI (needs equal point count, or **flubber**, §5.2) | |

#### Motion & feedback micro-effects

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Hover/press/state feedback | CSS transitions on `transform`/`opacity` | — | See B1 §4.5 for the meaning-per-motion table |
| Skeleton loading shimmer | CSS `background-position` gradient sweep `@keyframes` | — | Pure CSS, cheap |
| Marquee / infinite ticker | CSS `@keyframes translateX` loop | — | Pure CSS; `linear` easing is *correct* here (B1 rule 4) |
| Count-up number | Vanilla JS `requestAnimationFrame` interpolation | WAAPI driving a CSS counter via `@property <integer>` | Small enough to always hand-roll |
| Progress ring / circular progress | SVG `stroke-dasharray`/`stroke-dashoffset` | CSS `@property`-animated angle on `conic-gradient` | See B1 §4.6 for the `pathLength="1"` normalization trick |
| Confetti / success burst | **canvas-confetti** (§5.2) | Small CSS `@keyframes` burst of a dozen DOM nodes | Purpose-built library; don't reach for a full particle engine |
| Cursor spotlight / magnetic hover | CSS custom properties (`--x`,`--y`) updated on `pointermove`, consumed by `radial-gradient`/`transform` | — | Gate `@media (hover:hover) and (pointer:fine)` — B1 §4.7 |
| Physics-feel bounce/drop/stack | WAAPI spring approximation, or CSS spring-keyframes | **Matter.js** for real rigid-body collision/stacking (§5.2) | Reach for Matter.js only for genuine multi-object collision, not a single bounce |

#### Vector marks, icons & illustration

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Static icon/logo | Inline SVG | — | Inline in-body, not `<img src>` (loses theming, see §6) |
| Self-drawing / stroke-reveal mark | SVG + CSS `stroke-dashoffset` | — | See B1 §4.6 worked example |
| Complex vector mark / AE-authored animation | **lottie-web** (inlined JSON+player, §5.2) | Hand-authored SVG + CSS/WAAPI | **Rive is blocked** — WASM runtime (rule 3) |
| Icon set reused across a page | SVG `<symbol>` + `<use href="#id">` sprite, defined once | Repeated inline `<svg>` per instance | `<use>` cuts payload for repeated icons — a technique-choice win, not an **H1** asset-sourcing concern |
| Animated illustration (multi-part) | SVG + CSS/WAAPI orchestration | lottie-web | Prefer native SVG first — B1 rule 14 |

#### Data visualization

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Simple bar/line/pie (few series) | Hand-rolled inline SVG (`<rect>`/`<path>`) | **Chart.js** if entrance-animation/tooltips/legend are needed | SVG keeps every data point in the DOM = accessible + inspectable |
| Standard interactive chart (tooltips, legend, responsive) | **Chart.js** or **D3** | **Apache ECharts** if dataset/complexity outgrows both | Verify the pinned Chart.js build avoids legacy string-template options (§6) |
| Complex/large-dataset dashboard, heatmap, geo | **Apache ECharts** (§5.2) | D3 + Canvas hand-rolled | Heaviest option — reserve for genuinely complex cases |
| Force-directed graph / network | **D3-force**, rendered to SVG or Canvas | — | |
| Sparkline / inline micro-chart | Hand-rolled inline SVG `<polyline>` | — | Too small to justify any library |

#### 3D & immersive

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Full 3D scene (lighting, camera, materials) | **Three.js** (§5.2) | **OGL** for a lighter footprint | Avoid `DRACOLoader`/`KTX2Loader` — WASM decoders, blocked |
| Single full-screen shader effect (no scene graph) | Raw WebGL, hand-rolled (§4.6 worked example) | Three.js `ShaderMaterial` on a full-screen plane | Raw WebGL avoids pulling in a whole 3D engine for one shader |
| 3D card tilt on hover | CSS `perspective`/`rotateX`/`rotateY` + `pointermove` (hand-rolled, or **vanilla-tilt.js**) | — | Classic §4.4 borderline case |
| Many fast-moving 2D sprites (GPU-batched) | **PixiJS** (§5.2) | Canvas 2D if object count is moderate | PixiJS is 2D-via-WebGL, not a 3D engine |
| Product viewer / rotating hero object | Three.js (interactive) | Canvas 2D pre-rendered sprite-sheet rotation | Static hero image is the floor (§4.6 ladder table) |

#### Text effects

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Typewriter / typing reveal | Vanilla JS `setInterval`/rAF substring reveal (~15 lines) | **Typed.js** for multi-string cycling/backspace choreography | Hand-roll unless the choreography is genuinely multi-string |
| Fixed-width typing caret (monospace) | CSS `steps()` width animation | — | No JS at all, monospace-only |
| Gradient/animated text fill | CSS `background-clip: text` + `background` animation | — | Pure CSS |
| Split-letter stagger reveal | Pre-split `<span>`s + staggered `animation-delay` | JS runtime split only if text is dynamic/unknown at generation time | The tool generates fixed mock copy, so pre-splitting at generation time avoids a runtime dependency entirely |

#### Scroll & pointer-driven

| Effect | Primary technique | Fallback / alternative | Notes |
|---|---|---|---|
| Scroll-triggered reveal | CSS `animation-timeline: view()` | IntersectionObserver + class toggle | 83.7% global, Firefox 155+/Safari 26+ ([caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_view), verify §E2); gate with `@supports` |
| Parallax scroll background | CSS `animation-timeline: scroll()` | JS scroll listener + `transform`, rAF-throttled | Keep layer-speed deltas small — top vestibular trigger, B1 §4.9 |
| Shared-element / hero morph transition | View Transitions API (`document.startViewTransition`) | FLIP-based manual transform (B1 §4.4) | 88.5% global, Firefox 144+/Safari 18+ ([caniuse](https://caniuse.com/view-transitions), verify §E2); always keep the instant-swap fallback |
| Sticky/pinned section | CSS `position: sticky` | JS scroll listener | |
| Image before/after compare slider | CSS `clip-path` driven by a range `<input>` | — | Native, no library |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| CDN `<script src>` copied from a tutorial | Blank/broken effect; network panel shows a pending/failed request; console CSP `connect-src`/`script-src` violation if a CSP is enforced | Paste the library's full built UMD/IIFE source as literal `<script>` text |
| WASM-backed library or loader (Rive, `DRACOLoader`/`KTX2Loader`, any WASM-compiled physics/noise engine) | Console: WASM compile/instantiate refused; effect silently doesn't render | Swap to a pure-JS equivalent — SVG+CSS/lottie-web instead of Rive; uncompressed geometry instead of Draco (§5.2) |
| Legacy library eval/template-compile path (pre-v3 Chart.js string tooltip/label templates, `_.template`, a Handlebars runtime compile) | Console: *"Refused to evaluate a string as JavaScript..."* ([chartjs/Chart.js#281](https://github.com/chartjs/Chart.js/issues/281)) | Use the modern function-callback option shape instead of string templates; grep the pinned version's source for `new Function(` before trusting it |
| External font/image URL (Google Fonts link, remote `<img src>`) | Broken image icon; invisible text (FOUT); pending/failed network request | Inline as base64 `data:` URI in `@font-face`/`src` (flag size to **H1** for the asset budget) |
| Inline `onclick=`/`javascript:` handler | Click does nothing; console CSP violation naming `script-src-attr`/`unsafe-inline` | Remove the attribute; wire with `addEventListener` inside the file's own hashed `<script>` block ([content-security-policy.com](https://content-security-policy.com/unsafe-inline/)) |
| SVG referenced via `<img src>`/CSS `background-image` instead of inlined | SMIL doesn't play; CSS variables/`:hover` inside the SVG don't apply; a logo is static where motion was expected | Inline the `<svg>...</svg>` markup directly in the HTML body |
| `new Worker(url)` for off-main-thread Canvas/WebGL compute | `SecurityError` constructing the Worker, or silent failure | Confirm `worker-src`/`child-src` allows `blob:` before relying on this pattern (verify with **E2**); otherwise keep the work on the main thread inside the rAF budget (**E1**) |
| CSS Houdini Paint Worklet (`CSS.paintWorklet.addModule()`) | Effect no-ops on Firefox/Safari; may also hit a worklet-src CSP block on Chromium | Don't rely on Houdini for general-purpose work (Chromium-only adoption); use `@property`-driven gradients/animation instead |
| Trusted Types enforcement blocks `innerHTML`/`insertAdjacentHTML` | `TypeError: Failed to set the 'innerHTML' property... requires 'TrustedHTML'` ([MDN Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)) | Build DOM via `createElement`/`textContent`/`setAttribute` instead of string HTML injection — safe regardless of whether Trusted Types is actually enforced |
| WebGL context creation fails or is lost | `getContext('webgl2')`/`('webgl')` returns `null`; `webglcontextlost` fires mid-session | Feature-detect at start and fall to the Canvas rung of the ladder (§4.6); attach a `webglcontextlost` handler if shipping WebGL at all ([MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)) |
| Canvas/WebGL carries information with no DOM twin | Screen reader announces nothing where a chart/mark is; an accessibility audit finds the gap | Add `role="img"` + `aria-label`, or a visually-hidden DOM/text twin for data-bearing content (§4.3) |
| Oversized single-file payload (full GSAP+plugins, a Lottie JSON export, Three.js + base64 GLTF) | File is multi-MB; slow to open/hand off; defeats the point of "single self-contained file" | Trim to used modules/chart types; tree-shake; or drop a tier on the degradation ladder (§4.6) |
| `backdrop-filter`/`@property`/`animation-timeline` used ungated | Flat/opaque panel, or a jump-cut instead of a smooth reveal, on an older engine | Wrap in `@supports (...)`; ship the CSS-only fallback rung as the *default* markup (§4.6) |
| Tailwind Play CDN (`cdn.tailwindcss.com`) left in a hand-inlined component | Network request at runtime; a JIT compiler runs in-page (also a potential no-eval risk depending on build) | Compile offline with the Tailwind standalone CLI and paste the static output into one `<style>` block (§4.5) |

---

## 7. Pre-flight checklist (run before shipping any technique choice)

- [ ] The chosen technique is the cheapest family that satisfies the effect (CSS → SVG → Canvas → WebGL → library), per §5.1/§5.3 — no WebGL where CSS would do.
- [ ] Every library is pasted as literal built (UMD/IIFE) `<script>` text — no `<script src="https://cdn...">` anywhere in the file.
- [ ] Every font/image/icon is a `data:` URI or omitted — no external `url()`, `<link>`, or `<img src="https://...">`.
- [ ] The final file has been grepped for `eval(`, `new Function(`, `.wasm`, `WebAssembly.` — zero hits, or each hit is justified and the technique reconsidered.
- [ ] No `onclick=`/inline event-handler attributes and no `javascript:` URIs — all handlers wired via `addEventListener` inside the file's own `<script>` block.
- [ ] SVG marks/icons are inlined directly in the document body, not referenced via `<img src>` or CSS `background-image` — SMIL and CSS-variable theming depend on it.
- [ ] Every Canvas/WebGL element that carries meaning (not pure decoration) has `role="img"` + `aria-label`, or a visually-hidden DOM/text twin for data-bearing content (charts, counters).
- [ ] Any gated feature (`animation-timeline`, `backdrop-filter`, `@property`, WebGL context) has an `@supports`/feature-detect path and a fallback that isn't blank.
- [ ] `prefers-reduced-motion: reduce` short-circuits straight to the bottom rung of the degradation ladder (§4.6) for every animated effect.
- [ ] Every degradation ladder's bottom rung requires zero JS and zero ungated CSS feature — plain and always-correct.
- [ ] Any React/Tailwind source has been fully resolved: no JSX, no hooks, no imports; Tailwind compiled to a static `<style>` block offline (never the Play CDN); lists either unrolled at generation time or looped with plain DOM APIs (no `innerHTML` of dynamic strings).
- [ ] Every dependency picked passes all five clauses of the decision rule in §4.4, including the licence check (MIT/Apache/ISC/BSD/Unlicense, or a disclosed GSAP exception).
- [ ] The specific pinned version of every library was checked for eval/WASM code paths — not assumed safe from reputation alone (§6).
- [ ] File size is proportionate — audited against **H1**'s asset budget, no dead/unused library code shipped.
- [ ] Opened once against a real strict-CSP meta tag (hash-only `script-src`/`style-src`, no `unsafe-eval`, no `wasm-unsafe-eval`) with zero console violations before hand-off.

---

## 8. Open questions / unverified

- **All caniuse percentages cited (`@property` 93.3%, `backdrop-filter` 94.6%, `animation-timeline: view()` 83.7%, View Transitions 88.5%) are a July-2026 snapshot** fetched during this research pass — re-verify at build time against **E2**/live caniuse data; these figures move monthly.
- **`wasm-unsafe-eval` cross-browser consistency**: one 2022–2023-era community report described inconsistent behavior for `wasm-unsafe-eval` across Chrome/Firefox/Safari of that vintage ([WebAssembly/content-security-policy#7](https://github.com/WebAssembly/content-security-policy/issues/7)). This report's central claim doesn't depend on that nuance — this sandbox grants **neither** keyword, so WASM is blocked regardless of any browser's `wasm-unsafe-eval` support — but if the host's actual policy differs from the brief's stated "no eval, no WASM-eval" (e.g. it grants `wasm-unsafe-eval` without `unsafe-eval`), the WASM verdicts throughout (Rive, Draco/KTX2, GSAP MorphSVG-adjacent WASM tooling if any) would need revisiting. Confirm the exact grant against **E2**.
- **CSP delivery via `<meta http-equiv="Content-Security-Policy">`** — the claim that `frame-ancestors`, `report-uri`/`report-to`, and `sandbox` are HTTP-header-only and not enforced via a meta tag is standard CSP-spec behavior, stated from general platform knowledge; it was not independently re-confirmed against the current CSP spec text this session. Cross-check against **E2**'s description of exactly how this tool's sandbox delivers its policy (header vs meta) before relying on the "few inline blocks, hash them" guidance in §4.1.
- **Trusted Types enforcement** (`require-trusted-types-for 'script'`) is confirmed to be an *opt-in*, separate hardening layer from "strict CSP" generally ([MDN Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)) — whether *this specific tool's* sandbox enables it is unknown; the checklist's "avoid `innerHTML` of dynamic strings" advice is given as safe-by-default regardless.
- **`worker-src`/`child-src` allowance for `blob:` Worker construction** — needed for any `OffscreenCanvas`-off-main-thread pattern — was not verified for this specific sandbox; treated as unconfirmed throughout and flagged at every point it matters (§4.1, §6).
- **CSS Houdini Paint Worklet current (mid-2026) cross-browser adoption** — treated here as "Chromium-only," consistent with its multi-year status, but the exact current caniuse number was not independently re-fetched this session; if general-purpose cross-browser reach is required, avoid it regardless of the exact percentage.
- **Library bundle-size figures** (Motion, Chart.js, lottie-web, GSAP, etc.) are approximate and version/build-dependent — verify the specific pinned version's actual output size, not the figures quoted here.
- **`color-mix()` support tier** is stated as "Modern-evergreen" from general platform knowledge (Chrome 111/Firefox 113/Safari 16.4 era); not independently re-fetched with a live caniuse percentage this session — treat as directionally correct, confirm exact number via **E2**.
- **The GSAP "Standard No-Charge" licence's exact prohibited-use wording** is Webflow-controlled and can change; re-read the current terms at implementation time rather than relying on this report's summary if the specific use case is anywhere near the "competing visual builder" boundary.

---

## 9. Sources

Primary / authoritative:
- [MDN — `Content-Security-Policy: script-src` directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) — `unsafe-eval` vs `wasm-unsafe-eval`, what each blocks.
- [MDN — `Content-Security-Policy` header overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy) — meta-tag delivery.
- [web.dev — Mitigate XSS with a strict Content Security Policy](https://web.dev/articles/strict-csp) — nonce/hash strict-CSP definition, canonical policy shape.
- [content-security-policy.com — `unsafe-inline` guide](https://content-security-policy.com/unsafe-inline/) — inline event-handler attributes, `unsafe-hashes`.
- [MDN — Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) — `require-trusted-types-for`, `innerHTML` blocking, opt-in status.
- [MDN — `<canvas>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas) — accessibility tree exposure, fallback content.
- [MDN — `WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader) / [`WebGLRenderingContext.compileShader()`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/compileShader) — native GLSL compilation, no JS eval.
- [MDN — WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — context loss, feature detection, system limits.
- [Chart.js — Accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html) — `role="img"`/`aria-label` pattern for Canvas charts.
- [caniuse — `backdrop-filter`](https://caniuse.com/css-backdrop-filter) — 94.63% global (fetched July 2026).
- [caniuse — CSS `@property`](https://caniuse.com/mdn-css_at-rules_property) — 93.29% global (fetched July 2026).
- [caniuse — `animation-timeline: view()`](https://caniuse.com/mdn-css_properties_animation-timeline_view) — 83.66% global, Firefox 155+, Safari 26+ (fetched July 2026).
- [caniuse — View Transitions (single-document)](https://caniuse.com/view-transitions) — 88.46% global, Firefox 144+, Safari 18+ (fetched July 2026).
- [CSS-Tricks — SMIL on?](https://css-tricks.com/smil-on/) — Chrome's reversed SMIL deprecation, current status.
- [Tailwind CSS — Standalone CLI](https://tailwindcss.com/blog/standalone-cli) — offline, no-Node.js compilation.
- [WebAssembly/content-security-policy #7](https://github.com/WebAssembly/content-security-policy/issues/7) — `wasm-unsafe-eval` history and cross-browser notes.
- [Babylon.js forum — glslang CSP issue](https://forum.babylonjs.com/t/glslang-csp-issue/58177) — WASM shader-transpile path scoped to WebGPU, not plain WebGL.
- [chartjs/Chart.js #281 — Unsafe eval in chart.js](https://github.com/chartjs/Chart.js/issues/281) — legacy `new Function()` template-compile eval trap.

Licences (verified directly from source this session):
- [Three.js — MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE) (© 2010–2026 three.js authors).
- [anime.js v4 — MIT](https://github.com/juliangarnier/anime/blob/master/LICENSE.md).
- Motion — MIT ([motion.dev](https://motion.dev/)).
- [GSAP — "Standard No-Charge" licence](https://gsap.com/community/standard-license/) (free, self-hostable, **not OSI-approved**, owned by Webflow); [Webflow announcement](https://webflow.com/blog/gsap-becomes-free).
- [PixiJS — MIT](https://github.com/pixijs/pixijs/blob/dev/LICENSE) (© 2013–2023 Mathew Groves, Chad Engler).
- [D3.js — ISC](https://github.com/d3/d3/blob/main/package.json).
- [Chart.js — MIT](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md) (© 2014–2024 Chart.js Contributors).
- [Apache ECharts — Apache-2.0](https://github.com/apache/echarts/blob/master/LICENSE).
- [tsParticles — MIT](https://github.com/tsparticles/tsparticles).
- [canvas-confetti — ISC](https://github.com/catdad/canvas-confetti/blob/master/LICENSE).
- [Rive runtime — MIT](https://github.com/rive-app/rive-runtime/blob/main/LICENSE) (© 2020 Rive) — note the WASM/CSP constraint still applies regardless of licence.
- lottie-web — MIT (verified in B1 §9: [LICENSE.md](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md)).
- [Konva.js — MIT](https://github.com/konvajs/konva/blob/master/LICENSE).
- [flubber — MIT](https://github.com/veltman/flubber/blob/master/package.json).
- [OGL — Unlicense](https://github.com/oframe/ogl/blob/master/package.json).
- [vanilla-tilt.js — MIT](https://github.com/micku7zu/vanilla-tilt.js/blob/master/package.json).
- [Typed.js — MIT](https://github.com/mattboldt/typed.js/blob/master/LICENSE.txt).
- [Matter.js — MIT](https://github.com/liabru/matter-js).

Internal sibling reports:
- **B1 — Motion & animation systems** (`/home/claude/B1-motion-and-animation-systems.md`) — duration/easing/choreography, the animated-mark CSP writeup this report's SVG/Lottie/Rive verdicts are kept consistent with.
