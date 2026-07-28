# Owner taste profile (v0, 2026-07-29) — READ THIS BEFORE GENERATING

Derived from the owner's **A-graded components** (31) in the Ottomate components-browser
(`ottomate.vault7a.xyz/components-browser?quality=A`), curated by the owner. This is the owner's taste
DNA. Pillar A of the design-system rebuild. **Manually updatable** (future `/taste` trigger); never
auto-overwritten.

## One line
**Bold, motion-first, 3D, effect-rich, playful.** The Aceternity / MagicUI / react-bits aesthetic — depth,
glow, animation, delight. Motion appetite is **maximum (5/5)**. This is the *opposite* of flat, static,
timid panels.

## ⚠ Direct conflict with the default anti-slop rules — RESOLVE IN FAVOUR OF TASTE
The design doctrine's "anti-slop tells" forbid **glow, gradient-text, glassmorphism, heavy effects**. The
owner rated exactly those **A** (GlowingEffect, LampEffect, BorderGlow, Gradient Flow Text, CardSpotlight,
3D/glass cards). The doctrine's own carve-out applies: *"when the owner explicitly asks for a slop tell,
their words win — do it well."* For this owner, treat glow / gradient / 3D / spotlight / bold motion as
**wanted**, not penalised. The anti-slop checks become ADVISORY, never blocking, on this owner's projects.
(This is F-16 from the test: a few structural rules were capping ambition — this is the concrete instance.)

## Loves (concrete, with generator directives)
- **3D & depth** (8 of 31 cards are 3D): tilt-on-hover, perspective cards, cutout/layered depth, coverflow,
  even `model-viewer`. → *Reach for real 3D transforms and depth where they fit; a flat card is the fallback,
  not the default.*
- **Glow / spotlight / light**: BorderGlow, GlowingEffect, LampEffect, CardSpotlight, PixelCard. → *Light
  effects (radial glow, spotlight-follow, animated borders) are a welcomed signature, not slop.*
- **Animated data**: AnimatedNumber, NumberTicker, Sparkline Stat. → *Numbers count-up on mount; KPIs carry
  sparklines; data should feel alive, not printed.*
- **Scroll-driven & WebGL motion**: Hyper Scroll, WebGL Scroll Sync V2. → *Scroll-reveal / scroll-sync and
  even WebGL are in-bounds for hero/marketing surfaces.*
- **Playful micro-interactions & personality**: Confetti Button, Coin Flip Donate, "Don't Let the Door Hit
  You", Tricky CSS hover. → *Add a moment of delight and a bit of wit; surprise-on-hover is valued.*
- **Animated / gradient text**: Gradient Flow Text, TextGenerateEffect. → *Animated text reveals + gradient
  flow are liked (for display type, not body).*
- **Bento layouts**: MagicBento. → *Bento/asymmetric grids over uniform equal columns where content allows.*
- **Springy / elastic inputs**: ElasticSlider. → *Inputs can have physical, springy feedback.*

## Style family
Aceternity / MagicUI / react-bits: modern, dark-friendly, gradient + glow, depth, motion-led, high-craft.

## Default generator posture for this owner
- **Motion budget = EXPRESSIVE** by default (not productive-only). Real animation on load, hover, interaction.
- **Interactivity is the point** — designs must be judged LIVE (this is why Pillar F's live preview matters;
  a static screenshot cannot represent this taste).
- **Delight is a feature** — one surprising/celebratory moment per surface is on-brand.
- Still honour the *non-negotiables*: contrast (per-theme gate), `prefers-reduced-motion` (rich by default,
  gracefully reduced), legibility, and per-project theme fit. Taste ≠ chaos — it's bold done well.

## Avoid (for this owner)
Flat / static / timid / plain panels with no motion or depth; "safe middle"; treating glow/gradient/3D as
mistakes to be caught. (These are precisely what the cointrail round produced and the owner called "basic".)

## Applied within each project's theme
Taste = the DIRECTION and appetite; the per-project **theme tokens** govern the palette/skin (cointrail
light-glass-finance vs a dark app). A finance app expresses this boldness *within* its tokens — animated
numbers, a tasteful tilt, a glow on the key CTA — not by importing a foreign neon skin.

## Provenance / freshness
- Source: owner's A-grade curation, 31 components, 2026-07-29. Secondary signal: B-grade (21) = "decent".
- Update policy: MANUAL only (owner re-curates grades / runs `/taste`); the AI proposes, the owner decides.
- Open: render the A-set to pull *visual* specifics (exact glow intensities, easing feel) — offered, not done.

## `/taste` — manual update flow (STUB, WS0.3)
The taste profile is a **living file**, updated only on a manual trigger — never auto-overwritten mid-round.
When the owner runs `/taste` (or says "update my taste"):
1. **Re-read the signal.** Pull the owner's current A/B grades from the components-browser
   (`ottomate.vault7a.xyz/components-browser?quality=A`) — the A-set is the taste DNA, B = "decent".
2. **Propose a diff, don't overwrite.** Show what changed (new loves / new avoids / motion-appetite shift)
   as a proposed edit to this file; the owner confirms. (propose→confirm, `references/propose-confirm.md`.)
3. **Write this file + bump the date/provenance line.** `parseTasteProfile` (taste-packet.mjs) re-reads it,
   so the next round's packet reflects the update with no code change — the file IS the interface.
4. **Optional deepening:** render the A-set to extract *visual* specifics (glow intensities, easing feel).
- **Now:** the file + `taste-packet.mjs` wiring exist and are read by the generator. A dedicated app UI /
  slash-command surface is later (Phase 2+); until then the update is this doc edit + a re-run.
