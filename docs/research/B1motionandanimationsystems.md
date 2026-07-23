# B1 — Motion & animation systems

*Design-intelligence reference. Track B1 of the registry research map. Written to be read by the design agent before it animates anything, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns **motion as a system**: how long things move, how they accelerate, how multiple moving things are choreographed, what a given micro-motion *communicates*, how marks/logos animate, how scroll- and pointer-driven effects are built, how all of it stays performant, where motion is allowed to live relative to content, and how every bit of it degrades for motion-sensitive users.

## 2. Boundary (what this track does **not** cover)

- **Which state change triggers a motion** (hover→rest, loading→loaded, the full state matrix) → **B2 Interaction states & affordance**. B1 says *how* the transition animates; B2 says *when* it fires and *what else* must change.
- **The material being animated** — a shadow, gradient, glass blur, glow, border — its static construction → **A4 Shape, depth & material**. B1 animates a material A4 defines.
- **Contrast/photosensitivity conformance math** (flash thresholds, APCA) → **A5 Accessibility**. B1 references the reduced-motion and pause/stop/hide hooks and applies them; A5 owns the conformance model.
- **Raw performance instrumentation** (Lighthouse, Core Web Vitals scoring, CSS architecture at scale) → **E1 Performance**. B1 owns the *animation* performance rules (compositor budget, layer cost); E1 owns page-level budgets.
- **Whether a given effect is worth its cost aesthetically / reads as generic** → **F2 Distinctiveness**.
- **The single-file no-network feasibility matrix across all techniques** (CSS vs SVG vs Canvas vs WebGL vs JS) → **H2 Feasibility**. B1 gives the motion-specific CSP/offline verdicts inline; H2 is the consolidated matrix.

---

## 3. Executive rules (apply these before reading the body)

1. **Use a duration ladder, not arbitrary times.** Adopt tokens and pick by role: micro state feedback (hover, press, toggle) **100–150 ms**; small element enter/exit (tooltip, chip, checkbox) **150–200 ms**; standard component transition (dropdown, card, tab panel) **250–300 ms**; large surface (drawer, sheet, dialog) **350–500 ms**; full-page/hero **500–600 ms**. A UI transition over **600 ms** needs a justification (storytelling, a mark). Material 3's scale runs `short1 50ms → long4 600ms → extra-long4 1000ms`; that is your working range. ([M3 easing & duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs))
2. **Duration scales with distance and size.** A bigger element or a longer travel path takes longer, or it looks like it teleports. Same easing, add roughly **+50–100 ms per size step**. A 200 ms tooltip and a 200 ms full-screen sheet is a bug; the sheet should be 400–500 ms.
3. **Enter decelerates; exit accelerates; move-within-view is symmetric.** Entrances use ease-**out** / decelerate (`cubic-bezier(0, 0, 0, 1)`) so they arrive gently; exits use ease-**in** / accelerate (`cubic-bezier(0.3, 0, 1, 1)`) so they leave quickly; things moving *inside* the viewport use standard ease-in-out (`cubic-bezier(0.2, 0, 0, 1)`). Make exits **~20–30 % shorter** than entrances — the user has decided; get out of the way. ([M3](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs), [IBM/Carbon motion](https://carbondesignsystem.com/elements/motion/overview/))
4. **Never use `linear` easing for positional motion.** Linear is only for *continuous* motion (spinners, marquees), progress bars that map to real progress, and opacity cross-fades. Anything that moves through space is eased, or it reads mechanical and cheap.
5. **Springs for interruptible/gesture motion; curves for deterministic/choreographed motion.** Drag, toss, reorder, toggle → spring (it handles interruption and velocity naturally). One-shot, precisely staggered, or must-finish-at-time-T sequences → duration + `cubic-bezier` (a spring has no fixed duration, so you can't reliably stagger or coordinate it).
6. **Animate only `transform` and `opacity` for anything that must be smooth.** These are composited on the GPU and skip layout and paint. Animating `width/height/top/left/margin/padding` triggers **layout**; `box-shadow/filter/background/color/border-radius` triggers **paint**. Both routinely drop frames — express the same intent with `transform: translate()/scale()` and opacity. ([web.dev: high-performance animations](https://web.dev/articles/animations-guide), [web.dev: compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count))
7. **Respect the frame budget.** One frame is **16.7 ms at 60 Hz, 8.3 ms at 120 Hz**; the browser needs part of that, so your work must fit in **~10 ms** (60 Hz). If a property can't be animated inside that, don't animate it. ([web.dev RAIL](https://web.dev/articles/rail/))
8. **Use `will-change` surgically and remove it.** Each hint promotes an element to its own compositor layer, which costs GPU memory; blanket `will-change` *degrades* performance. Add it on interaction-start, drop it on interaction-end. The older `transform: translateZ(0)` hack does the same and is only for engines lacking `will-change`. ([MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change))
9. **Motion never lives, un-mitigated, behind reading text.** If ambient/animated material sits under a text block it must (a) be pausable and (b) be quiet enough not to compete — drop it to near-static opacity, blur it, or place an opaque/scrim layer between motion and text. WCAG **2.2.2 Pause/Stop/Hide** *requires* a pause mechanism for auto-moving content that lasts > 5 s alongside other content. At rest, visible movement behind text is a defect. ([WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))
10. **Every motion degrades under `prefers-reduced-motion: reduce`.** Replace movement (translate/scale/parallax/spin) with an instant cut or a short opacity fade; keep functional feedback, drop decoration. Do **not** blanket `animation: none !important` on everything — that can strip state signalling and loading affordances. ([web.dev prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion))
11. **Know the vestibular trigger list.** What actually hurts motion-sensitive users: large-area movement, parallax (foreground/background at different speeds), zoom/scale over big distances, spin/rotation, and motion that fights the scroll direction. **Safe** properties: opacity, colour, blur, and small (< ~10 % of viewport) movement. Design the reduced path around this, not around "no animation." ([A List Apart: Designing Safer Web Animation](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/))
12. **Stagger reveals at 20–60 ms per item, and cap the sequence.** Offset list/grid items by **20–50 ms** each (Material-style ≈ 20–30 ms); cap the *total* run at **~300–500 ms** so the last item isn't left waiting. Past ~8–10 items, only animate the ones in the viewport.
13. **Animate layout changes with FLIP, not by animating layout properties.** Measure the element's **First** and **Last** rectangles, apply the inverse transform so it *looks* unmoved, then animate that transform to identity. The move/resize runs entirely on compositor-cheap `transform`. ([Paul Lewis: FLIP](https://aerotwist.com/blog/flip-your-animations/))
14. **For animated marks in the strict-CSP offline file, prefer pure SVG + CSS, then WAAPI.** Stroke-draw (`stroke-dasharray`/`stroke-dashoffset`), transform, opacity and `clip-path`/mask cover most logo animation with zero JS eval. **Lottie** (`lottie-web`, MIT) works when inlined — it's plain JS, no `eval`. **Rive** needs **WebAssembly**, which a strict CSP blocks unless `script-src 'wasm-unsafe-eval'` is present — treat Rive as unavailable in a no-eval sandbox. (See §Options and §9.)
15. **Native CSS scroll-driven animation is CSP-safe and off-main-thread, but support is uneven.** `animation-timeline: scroll()/view()` runs without JS and off the main thread, but as of mid-2026 it's **Chromium 115+** stable, **Firefox** behind a flag / partial, **Safari** partial — *verify current support*. Gate with `@supports (animation-timeline: scroll())` and provide a static or IntersectionObserver fallback. **Never make content *visibility* depend on a scroll animation.** ([MDN scroll-driven animations](https://developer.mozilla.org/docs/Web/CSS/CSS_scroll-driven_animations))

---

## 4. Body

### 4.1 Duration — how long is right?

Duration is the single most abused motion parameter: too long feels sluggish, too short feels janky or subliminal. Anchor it in perception, then in a token ladder.

**The perceptual anchors (Nielsen's response-time limits):** **0.1 s (100 ms)** is the ceiling for *feeling instantaneous* — feedback to a direct manipulation (press, hover, toggle) must begin within it. **1 s** is the limit for keeping an *uninterrupted flow of thought* — a transition the user is waiting on should complete by ~1 s or it needs a progress indicator. **10 s** is the limit of *keeping attention* on a task. These are about *system response*, but they bound animation too: a UI transition the user is waiting through should almost never exceed ~500 ms, and never 1 s. ([NN/g: Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/))

**The Doherty threshold (~400 ms):** productivity rises sharply when the system responds to a user action in under **400 ms**. Practically, treat 400 ms as the outer bound for *transitions in a working UI* (as opposed to marketing/hero motion). *(Sourced to IBM, Doherty & Thadani 1982; widely cited but the original is a technical report — treat the exact figure as a well-established heuristic rather than a live measurement.)*

**The token ladder (Material 3, verified values):**

| Band | Tokens | Range | Use for |
|---|---|---|---|
| Short | short1–short4 | **50 / 100 / 150 / 200 ms** | Hover, press, selection, small fades, icon state |
| Medium | medium1–medium4 | **250 / 300 / 350 / 400 ms** | Dropdowns, cards, tabs, expanding rows, most component transitions |
| Long | long1–long4 | **450 / 500 / 550 / 600 ms** | Drawers, sheets, dialogs, large containers |
| Extra-long | extra-long1–extra-long4 | **700 / 800 / 900 / 1000 ms** | Full-screen/hero storytelling, ambient loops, marks — rarely for functional UI |

Source: [M3 easing & duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs).

**Decision rule for scaling with size/distance:** pick the band from the *element's role*, then nudge within the band by *size*. A small dropdown = medium1 (250 ms); a large full-height drawer = long2–long4 (500–600 ms). If two things animate together but at different sizes, they may share *easing* but should **not** share *duration* — the big one lags slightly, which reads as physical weight, exactly right.

**Enter vs exit asymmetry:** exits should be shorter. If a dialog enters at 400 ms, exit at ~250–300 ms. Rationale: entrance introduces something the user must orient to (worth the time); exit is a decision already made (don't tax it). This is codified in most mature systems (Material, Carbon).

### 4.2 Easing — the shape of motion

Easing is *what the motion says about physics*. The four archetypes and where each belongs:

| Easing archetype | CSS | Curve behaviour | Use for | Never for |
|---|---|---|---|---|
| **Decelerate / ease-out** | `cubic-bezier(0, 0, 0, 1)` | Fast start, gentle stop | **Entrances**, elements arriving, expanding | Exits (looks hesitant) |
| **Accelerate / ease-in** | `cubic-bezier(0.3, 0, 1, 1)` | Slow start, fast exit | **Exits**, elements leaving, collapsing | Entrances (looks laggy) |
| **Standard / ease-in-out** | `cubic-bezier(0.2, 0, 0, 1)` | Slow-fast-slow | **Moving within view**, reposition, morph | One-directional enter/exit |
| **Linear** | `cubic-bezier(0, 0, 1, 1)` | Constant velocity | Spinners, real-progress bars, cross-fades | Any positional UI motion |

Source values: [M3 easing tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) (verified via token exports).

**The "emphasized" caveat (honesty flag):** Material 3's headline *Emphasized* easing is not truly a single `cubic-bezier` — it is a two-part spline (a slow, expressive start and an over-shooting settle) that CSS cannot express as one cubic-bezier. Token exports commonly approximate `emphasized` as the same value as `standard` (`cubic-bezier(0.2, 0, 0, 1)`), which loses the character. If you want the emphasized *feel* in a single-file CSS context, either (a) use `emphasized-decelerate` `cubic-bezier(0.05, 0.7, 0.1, 1)` for entrances, or (b) use a spring (see §4.3). Do not claim a single cubic-bezier "is" M3 emphasized — it isn't. ([discussion of the two-part curve](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs))

**Custom-curve heuristics:** the two control-point handles of `cubic-bezier(x1,y1,x2,y2)` control *in* and *out*. `y` values **above 1** overshoot (bounce/anticipation past the target); **below 0** undershoot (wind-up before moving). A gentle overshoot — e.g. `cubic-bezier(0.34, 1.56, 0.64, 1)` — adds life to a small confirming motion (a toast, a check). Use overshoot sparingly and never on large elements (it reads as unstable).

### 4.3 Springs — physics instead of a fixed curve

A spring models motion as a damped harmonic oscillator rather than a timed curve. Three parameters:

| Parameter | Physical meaning | Raising it… | Framer Motion default |
|---|---|---|---|
| **Stiffness** (tension, *k*) | Restoring force toward target (`F = −k·x`) | Snappier, faster | **100** |
| **Damping** (friction, *d*) | Force opposing velocity (`F = −d·v`); dissipates energy | Less bounce, settles sooner; `0` = oscillates forever | **10** |
| **Mass** (*m*) | Inertia (`a = F/m`) | Heavier, more sluggish, more overshoot | **1** |

Sources: [Maxime Heckel: physics behind spring animations](https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/), [Motion react transitions](https://motion.dev/docs/react-transitions).

**The one number that predicts feel — the damping ratio:**

```
ζ (zeta) = damping / (2 · √(stiffness · mass))
```

- **ζ < 1 — underdamped:** overshoots and bounces before settling. The Framer Motion default (100/10/1) gives ζ = 10 / (2·√100) = **0.5** → visibly bouncy.
- **ζ = 1 — critically damped:** fastest possible settle with **no overshoot**. This is the "expensive, precise" feel. For 100/1 you'd need damping = 20.
- **ζ > 1 — overdamped:** slow, no bounce, can feel heavy/laggy.

**Decision rule:** for productivity UI, target **ζ ≈ 0.7–1.0** (a hint of life, no distracting wobble). For playful/brand moments, **ζ ≈ 0.4–0.6**. Never ship ζ < 0.3 in functional UI — it wobbles like jelly.

**Modern spring authoring (duration + bounce):** newer Motion versions let you set a **`visualDuration`** (seconds to *appear* to reach target) and a **`bounce`** value (**default 0.25**, range 0 = no bounce → 1 = very bouncy) instead of raw stiffness/damping. This is easier to reason about and to coordinate with timed animations. ([Motion react transitions](https://motion.dev/docs/react-transitions))

**When a spring beats a curve:** (1) the motion can be *interrupted* mid-flight (drag, re-toggle) — a spring absorbs current velocity and redirects smoothly; a curve restarts and stutters. (2) The motion follows a *gesture* (throw/fling) — spring carries momentum. **When a curve beats a spring:** (1) you must *stagger* precisely or land at an exact time; (2) the motion is a *loop* or maps to *real progress*; (3) you're in a **pure-CSS/no-JS** file — CSS has no spring primitive, so you either use `cubic-bezier` or approximate a spring with a long multi-stop `@keyframes` (a "spring keyframe" generator can emit this; it's verbose but CSP-safe).

### 4.4 Choreography — orchestrating multiple moving things

Individual tweens are easy; making several read as *one intentional system* is the craft.

**Stagger.** Reveal a group by offsetting each child's start. Rules: **20–50 ms per item** (Material ≈ 20–30 ms); direction of the stagger should match reading/scan order (top-left first); **cap total** at ~300–500 ms; beyond ~10 items, stagger only the visible subset and cut the rest in instantly. Over-long staggers (e.g. 100 ms × 12 items = 1.2 s) make the UI feel slow to *load*, not elegant.

**Orchestration & overlap.** Sequenced motions should *overlap*, not run strictly one-after-another. A common recipe: the container expands (300 ms), and its contents begin fading/rising **~50–100 ms before** the container finishes, so the sequence feels connected rather than robotic. Material calls the outgoing/incoming overlap in a transition "cross-fade with a dwell."

**Shared-element / FLIP transitions.** When an element appears to *move and morph* between two states (a grid thumbnail → a detail hero), don't animate layout — use **FLIP** (First, Last, Invert, Play): record the start rect (First), let the DOM jump to the end state (Last), compute and apply the inverse `transform` so it appears unmoved (Invert), then transition that transform to identity (Play). Everything runs on `transform`/`opacity`. ([Paul Lewis: FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/)). The platform is growing native support via the **View Transitions API** (`document.startViewTransition`), which does the capture/cross-fade automatically — Chromium-stable, Safari shipping, Firefox in progress as of 2026; **verify current support** and keep a non-animated fallback (the API degrades to an instant swap when unsupported).

**Entrance vs exit asymmetry (again, at sequence level).** A menu that staggers *in* top-to-bottom should stagger *out* faster and often in reverse or all-at-once. Symmetrical in/out sequences feel unnervingly mechanical.

### 4.5 Micro-interactions — what each small motion *says*

Motion is a language; each pattern carries meaning. Match the pattern to the message:

| Micro-motion | Communicates | Typical spec |
|---|---|---|
| Quick scale-down on press (`scale(0.97)`) | "I received your touch" | 100 ms, ease-out, spring-back on release |
| Gentle overshoot on appear | "success / done" | 150–200 ms, slight overshoot (`y2 > 1`) |
| Horizontal shake | "error / rejected" | 300–400 ms, 2–3 oscillations, small amplitude (≤ 8 px) |
| Colour + slight lift on hover | "interactive, reachable" | 100–150 ms, transform + opacity, **not colour alone** |
| Cross-fade + size to content | "this changed in place" | 200–300 ms, standard easing, FLIP for the resize |
| Pulsing/breathing highlight | "look here / new" | slow (1–2 s) opacity loop, **must be pausable**, never behind text |
| Progress/indeterminate spinner | "working, unknown duration" | linear, continuous; show only after ~**300–500 ms** of waiting (see B2) |

**Rule of restraint:** a micro-interaction should be *felt more than seen*. If a user consciously notices the animation of a button press, it's too long or too big. Target 100–150 ms and small displacements.

### 4.6 Animated logos & marks

Four production paths, ranked by **strict-CSP / single-file / offline** friendliness (the tool's hard constraint):

1. **Pure SVG + CSS / SMIL (best for the sandbox).** *Stroke-draw:* set `stroke-dasharray` to the path length and animate `stroke-dashoffset` from that length to 0 — the line "draws itself." *Morph:* animate the `d` attribute between compatible paths (SMIL `<animate>`, or CSS where supported), or use `clip-path`/mask reveals. *Transform/opacity* for assembling pieces. **Zero JS eval, fully inlinable, deterministic.** This should be the default for marks in the sandbox.
2. **Web Animations API (WAAPI).** `element.animate([...], {...})` — JavaScript, but a DOM API with **no `eval`**, so it survives strict CSP. Good when you need dynamic/interruptible mark animation without a library. Inline the script.
3. **Lottie (`lottie-web`, MIT — [licence](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md), © 2015 Bodymovin).** Renders After-Effects/JSON animations to SVG/Canvas. **CSP verdict: works inlined** — `lottie-web` is plain JavaScript (no WebAssembly, no `eval`); embed the player script and the animation JSON as a JS variable or `data:` URI. **Cost:** full `lottie-web` ≈ 250 KB minified / ~60 KB gzipped; a `_light` build is smaller. Good for complex, designer-authored, non-interactive marks. **Pitfalls:** JSON can be heavy; Canvas renderer ignores CSS; test the specific build's CSP behaviour.
4. **Rive (runtimes MIT — [licence](https://github.com/rive-app/rive-runtime/blob/main/LICENSE), © Rive).** Interactive, state-machine-driven vector animation; smaller `.riv` files than equivalent Lottie. **CSP verdict: problematic** — the web runtime is **WebAssembly**, which a strict CSP blocks unless `script-src 'wasm-unsafe-eval'` (or `'unsafe-eval'`) is allowed. In a *no-eval* sandbox, **Rive will not run.** Excellent tech, wrong constraint — list it as "commercial-grade but blocked by strict CSP" and prefer 1–3.

**Worked example — self-drawing logo, CSP-safe, reduced-motion-aware:**

```html
<svg viewBox="0 0 100 100" width="96" height="96" aria-label="Logo">
  <path d="M10,90 L50,10 L90,90" fill="none" stroke="currentColor"
        stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
        pathLength="1" class="mark" />
</svg>
<style>
  .mark { stroke-dasharray: 1; stroke-dashoffset: 1;
          animation: draw 900ms cubic-bezier(0,0,0,1) forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  /* Reduced motion: no drawing, just present the finished mark */
  @media (prefers-reduced-motion: reduce) {
    .mark { animation: none; stroke-dashoffset: 0; }
  }
</style>
```

`pathLength="1"` normalises the path so you don't have to compute its real length — dasharray/offset of `1` covers any path. No JS, no network, degrades cleanly.

### 4.7 Scroll-driven & pointer-driven effects

**Native CSS scroll-driven animation** links an animation's *timeline* to scroll position instead of the clock:

- **Scroll progress timeline** — `animation-timeline: scroll(<scroller> <axis>)` or a named `scroll-timeline`. Progresses 0→100 % across the scroll container's full range. Use for scroll progress bars, parallax layers.
- **View progress timeline** — `animation-timeline: view()` or a named `view-timeline`. Progresses 0→100 % as *the element itself* crosses the viewport. Use for reveal-on-enter, pin/reveal effects. Tune the active window with `animation-range` (e.g. `enter 0% cover 40%`).

```css
@keyframes fade-rise { from { opacity: 0; transform: translateY(20px); }
                       to   { opacity: 1; transform: translateY(0); } }
.card { animation: fade-rise linear both; }
@supports (animation-timeline: view()) {
  .card { animation-timeline: view(); animation-range: entry 0% cover 30%; }
}
@media (prefers-reduced-motion: reduce) {
  .card { animation: none; opacity: 1; transform: none; }
}
```

**Why prefer native:** it runs **off the main thread** (smooth even under JS load) and is **CSP-safe** (no script). **Support reality (mid-2026, verify):** Chromium **115+** stable; Firefox behind a flag / partial; Safari partial. Because of that, **always** gate with `@supports (animation-timeline: scroll())` and ship a fallback: an **IntersectionObserver** that toggles a class (JS, no eval, CSP-safe), or simply show content statically. ([MDN](https://developer.mozilla.org/docs/Web/CSS/CSS_scroll-driven_animations), [Chrome for Developers](https://developer.chrome.com/blog/scroll-triggered-animations))

**Hard rule:** content must be **readable and functional with zero scroll animation**. Never gate visibility, layout, or interactivity on a scroll effect — motion-off and unsupported-browser users must still get everything. Parallax specifically is a top vestibular trigger (§4.9) — keep layer-speed deltas small and kill it under reduced motion.

**Pointer-driven effects** (tilt/spotlight/magnetic hover) read pointer position and map it to `transform`/CSS variables. Keep them to **`transform` and custom properties**, cap displacement (a few degrees of tilt, a few px of magnet), make them **hover-only** (they're meaningless and can misfire on touch — gate with `@media (hover: hover) and (pointer: fine)`), and disable under reduced motion.

### 4.8 Performance — hitting 60/120 fps

**The rendering pipeline** has three stages; where a property lands decides its cost:

| Stage | What it does | Properties that trigger it | Cost |
|---|---|---|---|
| **Layout** | Recompute geometry of this element *and often others* | `width, height, top, left, right, bottom, margin, padding, border-width, font-size` | Highest — can cascade to the whole subtree |
| **Paint** | Rasterise pixels | `color, background, box-shadow, border-radius, filter, outline` | High — repaints the element's layer |
| **Composite** | Blend existing layers on the GPU | **`transform`, `opacity`** (and `filter` sometimes on GPU) | Lowest — no layout, no paint |

Source: [web.dev: high-performance CSS animations](https://web.dev/articles/animations-guide), [web.dev: why some animations are slow](https://web.dev/articles/animations-overview).

**The core rule restated:** if it must be smooth, animate **`transform`** and **`opacity`** only. Need to animate width? Animate `transform: scaleX()` (and counter-scale children if needed) instead. Need to move? `translate`, not `top/left`. Need a shadow to grow on hover? Pre-render two shadow layers and cross-fade their **opacity** rather than animating `box-shadow` (which paints every frame).

**`will-change` and layers.** Promoting an element to its own compositor layer lets it animate without repainting neighbours — but layers cost GPU memory and *too many* layers slow compositing. Guidance: don't set `will-change` in static CSS on many elements; add it via a class **on interaction start** and remove on end; if you must hint statically, hint the *specific property* (`will-change: transform`) on a *few* elements. `transform: translateZ(0)`/`translate3d(0,0,0)` is the legacy way to force a layer and is only needed for engines without `will-change`. ([MDN will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change))

**Budgets.** 60 Hz = **16.7 ms/frame**, 120 Hz = **8.3 ms/frame**; leave the browser its slice, so target **≤ ~10 ms** of your own work at 60 Hz. Animating many elements, large blurs, or big `box-shadow`/`filter` areas blows this. ([web.dev RAIL](https://web.dev/articles/rail/))

**Measuring (do this, don't guess).** Chrome DevTools **Performance** panel → record an interaction → look for long frames, purple "Layout"/green "Paint" bars during animation (should be near-zero for a good animation), and check the **Rendering** tab's *Paint flashing* and *Layer borders*. If you see layout/paint firing every frame, you're animating the wrong property.

### 4.9 Where motion may and may not live (legibility rule)

Derive the general rule rather than memorising cases. Reading is a foveal task disrupted by nearby movement (the eye is evolved to saccade toward motion in the parafovea). Therefore:

- **Never place un-mitigated motion behind or immediately around a block of reading text.** Even at rest, a moving/looping background under paragraph text measurably slows reading and raises error rates. If you *must* combine them, insert an opaque or high-opacity scrim between the motion and the text, or drop the motion to near-static (opacity ≤ ~0.06, no positional change) beneath text.
- **Motion belongs in the periphery of attention or on the object of attention — not underneath it.** A hero background may animate *until* text overlays it; a loading area may animate *because* there's nothing to read yet; a card may lift *because it is the focus*.
- **Auto-playing motion that lasts > 5 s and sits alongside other content must be pausable** — WCAG **2.2.2 Pause, Stop, Hide**. Ambient loops (gradients, particles) therefore need a pause affordance or must be gated behind `prefers-reduced-motion`. ([WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html))
- **Nothing flashes more than 3 times per second** — WCAG **2.3.1** (seizure risk). This caps rapid strobing/flicker regardless of taste. ([WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html))

### 4.10 Reduced motion — graceful degradation, not a kill switch

`prefers-reduced-motion: reduce` reflects an OS-level user setting. The correct response is **substitution**, not deletion:

- **Keep** functional feedback that communicates state (a fade that says "loaded", a colour change that says "selected") — but express it without *movement*: cross-fade instead of slide, instant instead of spring.
- **Remove/replace** decorative movement: parallax, large slides, zooming reveals, spinning, auto-carousels, ambient particle fields.
- **The anti-pattern:** `*{animation:none!important;transition:none!important}`. It's a blunt instrument that can break skeleton loaders, remove focus transitions, and strip meaningful state changes. Prefer targeted overrides.

**Two solid patterns:**

```css
/* Pattern A — motion is opt-IN (safest default) */
@media (prefers-reduced-motion: no-preference) {
  .panel { transition: transform 300ms cubic-bezier(0.2,0,0,1); }
}
/* No transition is declared otherwise, so reduced-motion users get instant. */

/* Pattern B — reduce movement, keep a gentle fade */
.toast { animation: slide-in 300ms cubic-bezier(0,0,0,1); }
@media (prefers-reduced-motion: reduce) {
  .toast { animation: fade-in 150ms linear; } /* opacity only, no translate */
}
```

Source: [web.dev prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion), [CSS-Tricks: nuking motion](https://css-tricks.com/nuking-motion-with-prefers-reduced-motion/). The trigger list to design the reduced path around is in §4.7/§4.9 and [A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/).

---

## 5. Options catalogue — motion implementation techniques

Columns: **what · when to use · when NOT · licence · where to get · cost / single-file-CSP feasibility · pitfalls.** "CSP-safe" below means it survives a strict Content-Security-Policy with **no** `unsafe-inline`/`unsafe-eval` beyond inlined-but-hashed styles/scripts and no network.

| Technique | What it is | When to use | When NOT | Licence | Where to get | Cost / CSP-offline feasibility | Pitfalls |
|---|---|---|---|---|---|---|---|
| **CSS transitions** | Interpolate between two states on property change | State changes with a clear before/after (hover, open/close, theme) | Multi-step sequences; interruptible physics | Web platform | Native | **Best.** Zero bytes, off-main-thread for transform/opacity, fully CSP-safe | Only 2 states; no mid-flight control; easy to animate expensive props by mistake |
| **CSS `@keyframes`** | Multi-stop timed animation | Loops, entrances, multi-step, staggers | Gesture/interruptible motion; exact data-driven values | Web platform | Native | **Best.** Tiny, CSP-safe, can approximate springs via many stops | Verbose for springs; no runtime input |
| **Web Animations API** | JS-driven timeline over DOM (`el.animate`) | Dynamic/interruptible motion without a library; sequencing | Pure-no-JS files | Web platform | Native | **Excellent.** JS but **no eval** → CSP-safe when inlined | Slightly more code; older-engine gaps for some features |
| **CSS scroll-driven** | `scroll()`/`view()` timelines | Scroll progress, reveal-on-enter, parallax | When Safari/FF support is required without fallback | Web platform | Native | **Great where supported;** off-main-thread, CSP-safe. Needs `@supports` + fallback | Uneven support (mid-2026); never gate visibility on it |
| **SVG + CSS / SMIL** | Vector path/stroke/morph animation | Logos, marks, icons, line-draw, morph | Photographic/complex raster motion | Web platform | Native | **Best for marks.** Inlinable, CSP-safe, deterministic | SMIL quirks; morph needs compatible path node counts |
| **Lottie (`lottie-web`)** | Plays AE/JSON vector animations | Designer-authored complex marks, illustrations | Simple motion CSS can do; tight byte budgets | **MIT** | [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | **Works inlined** (plain JS, no eval, no WASM). ~250 KB min / ~60 KB gz + JSON | Heavy JSON; Canvas renderer ignores CSS; verify build |
| **Rive (web runtime)** | State-machine interactive vector | Interactive characters, rich stateful marks | **Strict no-eval CSP** (blocked); tiny budgets | **MIT** (runtimes) | [rive-app/rive-runtime](https://github.com/rive-app/rive-runtime) | **Blocked under strict CSP** — needs `wasm-unsafe-eval`. Great tech, wrong sandbox | WASM CSP; runtime weight; editor is freemium |
| **Motion (Motion One / for React)** | Modern JS animation lib, springs, WAAPI-backed | Springs, gestures, orchestration in a JS build | Pure-CSS files; extreme byte budgets | **MIT** | [motiondivision/motion](https://github.com/motiondivision/motion) | JS, no eval → CSP-safe inlined. Core is small/tree-shakeable | Bundle adds up; overkill for simple transitions |
| **anime.js** | Lightweight JS animation engine | Timelines, staggers, SVG, sequencing | Pure-CSS files | **MIT** | [animejs](https://github.com/juliangarnier/anime) | JS, no eval → CSP-safe inlined | Another dependency; verify tree-shaking |
| **GSAP** | Industry-standard JS animation platform | Complex timelines, ScrollTrigger, hardest sequencing | When an **OSI** licence is required by policy | **Free** but a **custom "Standard 'No Charge'" licence — NOT OSI-approved** ([terms](https://gsap.com/community/standard-license/), [Webflow made it free](https://webflow.com/blog/gsap-becomes-free)) | [gsap.com](https://gsap.com) | JS, no eval → CSP-safe inlined; free & self-hostable | **Licence caveat:** free ≠ open-source; if the project mandates OFL/MIT/Apache/CC, prefer Motion/anime.js. Verify current terms |
| **Canvas 2D + rAF** | Imperative pixel animation | Particles, generative backgrounds, many objects | Text/UI (no DOM semantics, no a11y) | Web platform | Native | JS, CSP-safe; can be costly on CPU | No accessibility; watch frame budget; pause when offscreen/reduced-motion |
| **WebGL / shaders** | GPU fragment/vertex programs | Rich generative backgrounds, fluid/mesh | Anything needing DOM semantics; low-end devices | Web platform | Native | CSP-safe (no eval); heavy GPU; big for a single file | Battery/thermal; needs reduced-motion + static fallback; overkill risk |

*(Deeper cross-technique feasibility — including hand-inlining a React/Tailwind snippet to vanilla — is owned by **H2**.)*

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| **Janky animation (dropped frames)** | Stutter; DevTools Performance shows Layout/Paint bars every frame | Move to `transform`/`opacity`; replace `top/left/width` with translate/scale; cross-fade pre-rendered shadows instead of animating `box-shadow` |
| **Everything at one duration** | UI feels either uniformly slow or uniformly twitchy | Apply the duration ladder (§4.1); scale by size/role; shorten exits |
| **Wrong easing direction** | Entrances feel laggy or exits feel hesitant | Decelerate for enter, accelerate for exit, standard for move (§4.2) |
| **Linear positional motion** | Mechanical, "cheap" slides/moves | Swap `linear` for an eased curve; reserve linear for spins/progress/cross-fades |
| **Jelly springs** | Wobble that won't settle; users wait for it | Raise damping; target ζ ≈ 0.7–1.0; or cap with `visualDuration`/lower `bounce` |
| **Stagger too slow** | List "loads" visibly slowly | Reduce per-item offset to 20–50 ms; cap total ≤ 500 ms; stagger only visible items |
| **Motion behind text** | Text over a live gradient/particles/video; hard to read even at rest | Scrim layer, pause, or drop motion opacity ≤ 0.06 under text; gate ambient loops behind reduced-motion (§4.9) |
| **`will-change` everywhere** | Whole-page `will-change` in CSS; memory spikes, *worse* perf | Remove static hints; add/remove on interaction; hint specific props on few elements |
| **No reduced-motion path** | Parallax/spin still runs with OS "reduce motion" on | Add `prefers-reduced-motion: reduce` overrides; substitute fades/instant (§4.10) |
| **Reduced-motion nuked everything** | Focus rings, skeletons, state changes all frozen | Replace blanket `*{animation:none}` with targeted substitutions; keep functional feedback |
| **Scroll-effect breaks non-Chromium / motion-off** | Content invisible or stuck in Safari/Firefox or with reduce-motion | `@supports` gate + IntersectionObserver/static fallback; never gate visibility on scroll |
| **Rive won't run in the sandbox** | Blank where a Rive mark should be; CSP console error about WASM/eval | Swap to Lottie (inlined), SVG+CSS, or WAAPI; Rive needs `wasm-unsafe-eval` |
| **Overshoot on big elements** | Large panel bounces past and back; feels unstable | Remove overshoot on large/heavy elements; reserve gentle overshoot for small confirmations |
| **Flashing/strobe** | Rapid flicker > 3×/s | Cap flash rate < 3 Hz (WCAG 2.3.1); slow or remove |

---

## 7. Pre-flight checklist (run before shipping any motion)

- [ ] Every duration comes from the ladder and matches the element's **role and size** (§4.1); exits are shorter than entrances.
- [ ] Easing direction is correct: **decelerate-in, accelerate-out, standard-move**; no `linear` on positional motion (§4.2).
- [ ] Springs (if used) settle at **ζ ≈ 0.7–1.0** for functional UI; no un-settling wobble (§4.3).
- [ ] Only **`transform`/`opacity`** animate on any hot path; verified in DevTools that Layout/Paint aren't firing per frame (§4.8).
- [ ] `will-change` is applied surgically (interaction-scoped), not globally (§4.8).
- [ ] Staggers are **20–50 ms/item, capped ≤ 500 ms**, visible-items-only past ~10 (§4.4).
- [ ] Layout moves use **FLIP / View Transitions**, not animated layout properties (§4.4).
- [ ] **No motion behind reading text** at rest; ambient loops are pausable (WCAG 2.2.2) and quiet (§4.9).
- [ ] Nothing flashes **> 3×/s** (WCAG 2.3.1) (§4.9).
- [ ] A **`prefers-reduced-motion: reduce`** path exists and *substitutes* rather than deletes (§4.10).
- [ ] Any **scroll/pointer** effect is `@supports`-gated with a static/observer fallback; visibility never depends on it (§4.7).
- [ ] Every animated **mark/asset** is CSP-safe and inlinable: SVG+CSS or WAAPI or inlined Lottie; **no Rive** in a no-eval sandbox (§4.6, §5).
- [ ] Every recommended library is **free + self-hostable**; licence noted; the **GSAP non-OSI caveat** acknowledged if GSAP is chosen (§5).
- [ ] Pointer effects are `hover: hover`/`pointer: fine`-gated and disabled under reduced motion (§4.7).

---

## 8. Open questions / unverified

- **Scroll-driven & View Transitions support is moving fast.** The Chromium-115+ / Firefox-flag / Safari-partial picture is as of **mid-2026** and *must be re-checked at build time* (caniuse). Treat all "supported" claims here as time-sensitive. *(Unverified beyond the sources dated to the fetch.)*
- **Doherty 400 ms threshold** is a widely repeated heuristic attributed to IBM (Doherty & Thadani, 1982); the primary technical report was not fetched. Use as a strong heuristic, not a measured constant.
- **Material 3 "Emphasized" easing** cannot be expressed as one `cubic-bezier`; the single-value token exports (e.g. `cubic-bezier(0.2,0,0,1)`) are approximations. The exact two-part definition should be pulled from the M3 spec / `@material/motion` tokens at implementation time if fidelity matters.
- **Framer Motion defaults** (stiffness 100 / damping 10 / mass 1) were confirmed via a secondary source; the newer Motion API leads with `visualDuration`+`bounce` (default bounce 0.25). Exact defaults can change across major versions — pin the version.
- **Lottie/Rive byte sizes** are approximate (build- and version-dependent). Verify the specific build's weight and CSP behaviour before committing.
- **Spring-to-CSS-keyframe generators** (for CSP-safe springs) exist but output verbose keyframes; no single canonical open tool is endorsed here — evaluate output size case by case.

---

## 9. Sources

Primary / authoritative:
- [Material Design 3 — Easing and duration tokens & specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) — duration + easing token values.
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/docs/Web/CSS/CSS_scroll-driven_animations) — syntax, timelines, support, fallback.
- [MDN — `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — layer promotion cost.
- [web.dev — How to create high-performance CSS animations](https://web.dev/articles/animations-guide) — compositor-only properties, pipeline.
- [web.dev — Stick to compositor-only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count).
- [web.dev — Why are some animations slow?](https://web.dev/articles/animations-overview) — layout/paint/composite.
- [web.dev — prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) — reduced-motion patterns.
- [web.dev — RAIL performance model](https://web.dev/articles/rail/) — frame budget, response limits.
- [WCAG 2.2 — 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); [2.3.1 Three Flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).
- [Nielsen Norman Group — Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) — 0.1 s / 1 s / 10 s.
- [Paul Lewis — FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/) — layout animation via transforms.
- [Chrome for Developers — Scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations).

Reference / secondary:
- [Maxime Heckel — The physics behind spring animations](https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/) — stiffness/damping/mass, defaults.
- [Motion — React transitions docs](https://motion.dev/docs/react-transitions) — spring params, `visualDuration`/`bounce`.
- [A List Apart — Designing Safer Web Animation for Motion Sensitivity](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/) — vestibular triggers.
- [CSS-Tricks — Nuking Motion with `prefers-reduced-motion`](https://css-tricks.com/nuking-motion-with-prefers-reduced-motion/).
- [Carbon Design System — Motion](https://carbondesignsystem.com/elements/motion/overview/) — enter/exit easing, durations.

Licences (verified from source):
- [`lottie-web` — MIT](https://github.com/airbnb/lottie-web/blob/master/LICENSE.md) (© 2015 Bodymovin).
- [Rive runtime — MIT](https://github.com/rive-app/rive-runtime/blob/main/LICENSE) (© Rive) — note WASM/CSP constraint.
- [Motion — MIT](https://github.com/motiondivision/motion); [anime.js — MIT](https://github.com/juliangarnier/anime).
- [GSAP — "Standard 'No Charge'" licence](https://gsap.com/community/standard-license/) (free, self-hostable, **not** OSI-approved); [Webflow made GSAP free](https://webflow.com/blog/gsap-becomes-free).
