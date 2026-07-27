// Generates the panels + configs for Screenroom poster-card rounds A and B.
// A generator rather than six hand-copied files: the structural axes (title placement, meta density,
// aspect) must produce genuinely different DOM, and copy-paste is exactly how a set ends up
// "declared different, authored identical" — the failure reproduced on 2026-07-27.
import { writeFileSync, mkdirSync } from 'node:fs';

const ELEV = {
  'flat-hairline':      { rest: 'box-shadow:none;', hoverExtra: '' },
  'surface-lightness':  { rest: 'background:#1c212c;', hoverExtra: 'background:#242a37;' },
  'dual-layer-shadow':  { rest: 'box-shadow:0 2px 4px -2px #05070ba6, 0 16px 34px -16px #05070be6;', hoverExtra: '' },
};
const HOVER = {
  'none-edge-tint': 'border-color:#e9b84c66;',
  'lift-6px':       'transform:translateY(-6px);',
  'scale-1.02':     'transform:scale(1.02);',
};
const BADGE = {
  'hairline-outline': '.pill{border:1px solid #ffffff2e;background:#0b0d11a6;color:#e8eaf0;border-radius:3px;padding:2px 6px;}',
  'pill-solid':       '.pill{border:0;background:#dfe3ec;color:#0d1015;border-radius:999px;padding:3px 8px;font-weight:600;}',
  'corner-ribbon':    '.pill{border:0;background:#dfe3ec;color:#0d1015;border-radius:0 0 8px 0;padding:3px 9px 4px 7px;font-weight:700;}',
};
const SELECTED = {
  ring:  '.mc.s-sel{outline:2px solid var(--au);outline-offset:2px;}',
  fill:  '.mc.s-sel{background:#241d0c;border-color:#e9b84c73;}',
  check: '.mc.s-sel .cap::after{content:"\\2713";float:right;color:var(--au);font-weight:700;}',
};

function css(v, accentPerCard) {
  const e = ELEV[v.elevation];
  return `
  .sr{background:#101216;color:#f4f5f8;padding:20px;font-family:system-ui,sans-serif;
      --au:#e9b84c;--dim:#9aa1b2;--dim2:#5f6575;--line:#ffffff1a;--card:#161a22;}
  .sr-row{display:grid;grid-template-columns:repeat(4,${v.aspect === '16/9' ? '208px' : '168px'});gap:18px;align-items:start;}
  .sr-state{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--dim2);margin-bottom:7px;}
  .mc{position:relative;border-radius:${v.radius};overflow:hidden;background:var(--card);
      border:1px solid var(--line);transition:transform 260ms ease,border-color 260ms ease,background-color 260ms ease;${e.rest}}
  .mc.s-hover{${HOVER[v.hoverMotion]}${e.hoverExtra}}
  .mc.s-focus{outline:2px solid var(--au);outline-offset:2px;}
  .mc.unowned{border-style:dashed;border-color:#ffffff2e;box-shadow:none;}
  ${SELECTED[v.selectedSignal]}
  .pz{aspect-ratio:${v.aspect};position:relative;overflow:hidden;background:#1a1e28;}
  .pz img{width:100%;height:100%;object-fit:cover;display:block;}
  .pills{position:absolute;top:7px;left:7px;display:flex;gap:4px;}
  ${v.badgeStyle === 'corner-ribbon' ? '.pills{top:0;left:0;flex-direction:column;gap:0;}' : ''}
  .pill{font-size:9px;letter-spacing:.05em;}
  ${BADGE[v.badgeStyle]}
  .own{position:absolute;left:8px;bottom:8px;}
  .chip{font-size:10px;padding:3px 8px;border-radius:${v.badgeStyle === 'pill-solid' ? '999px' : '4px'};border:1px solid;}
  .c-full{color:#f4cf7d;border-color:#e9b84c73;background:#12151ccc;}
  .c-out{color:var(--dim);border-color:#ffffff2e;background:#0b0d11cc;border-style:dashed;}
  ${v.accentUsage === 'chip-and-meter' ? '.meter{position:absolute;left:0;right:0;bottom:0;height:3px;background:#ffffff14;}.meter i{display:block;height:100%;width:62%;background:var(--au);}' : ''}
  ${accentPerCard ? '.mc{border-color:var(--card-accent,var(--line));}' : ''}
  .acts{position:absolute;right:7px;bottom:8px;display:flex;gap:5px;${v.actionsReveal === 'hover-reveal' ? 'opacity:0;transition:opacity 200ms ease;' : ''}}
  ${v.actionsReveal === 'hover-reveal' ? '.mc.s-hover .acts,.mc:focus-within .acts{opacity:1;}' : ''}
  .acts button{width:22px;height:22px;border-radius:4px;border:1px solid #ffffff2e;background:#0b0d11bf;color:#e8eaf0;font-size:11px;line-height:1;cursor:pointer;}
  .acts button:focus-visible{outline:2px solid var(--au);outline-offset:2px;}
  .cap{padding:8px 9px 10px;}
  .ov{position:absolute;left:0;right:0;bottom:0;padding:16px 9px 8px;background:linear-gradient(#0b0d1100,#0b0d11e6 60%);}
  .t{display:block;font-size:12.5px;line-height:1.3;color:#f4f5f8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .m1,.m2{display:block;margin-top:3px;font-size:11px;color:var(--dim);font-variant-numeric:tabular-nums;}
  .m2{color:var(--dim2);}`;
}

// Meta lines are a genuine DOM difference, not a CSS one — 1/2/3 lines emit 0/1/2 extra elements.
function metaBlock(n, i) {
  if (n === '1-line') return '';
  if (n === '2-line') return `<span class="m1" data-role="card-meta">{{META_${i}}}</span>`;
  return `<span class="m1" data-role="card-meta">{{META_${i}}}</span><span class="m2">owned</span>`;
}

function card(v, i, state, label, owned, accentPerCard) {
  const cls = ['mc', state, owned ? '' : 'unowned'].filter(Boolean).join(' ');
  const styleAttr = accentPerCard ? ` style="--card-accent:{{ACCENT_${i}}}"` : '';
  const title = `<span class="t" data-role="card-title">{{TITLE_${i}}}</span>`;
  const meta = metaBlock(v.metaDensity, i);
  const caption = v.titlePlacement === 'overlay'
    ? '' : `<div class="cap">${title}${meta}</div>`;
  const overlay = v.titlePlacement === 'overlay'
    ? `<div class="ov">${title}${meta}</div>` : '';
  return `
    <div>
      <div class="sr-state">${label}</div>
      <article class="${cls}" data-role="media-card"${styleAttr}>
        <div class="pz">
          <img src="{{IMG_${i}}}" alt="">
          <div class="pills"><span class="pill">2160p</span><span class="pill">DV</span></div>
          ${overlay}
          <span class="own"><span class="chip ${owned ? 'c-full' : 'c-out'}">${owned ? 'Owned' : 'Not ours yet'}</span></span>
          ${v.accentUsage === 'chip-and-meter' && owned ? '<div class="meter"><i></i></div>' : ''}
          <div class="acts"><button aria-label="Quick look">i</button><button aria-label="Play">&#9654;</button></div>
        </div>
        ${caption}
      </article>
    </div>`;
}

export function panel(v) {
  const accentPerCard = v.accentUsage === 'poster-derived-edge';
  const states = [
    [1, '', 'rest · owned', true],
    [2, 's-hover', 'hover · owned', true],
    [3, 's-focus s-sel', 'focus-visible · selected', true],
    [4, '', 'not ours yet', false],
  ];
  return `<style>${css(v, accentPerCard)}\n</style>\n<div class="sr"><div class="sr-row">`
    + states.map(([i, s, l, o]) => card(v, i, s, l, o, accentPerCard)).join('')
    + '</div></div>\n';
}

// ── the two rounds ────────────────────────────────────────────────────────────────────────────
const CTRL_COLOUR_MOTION = { accentUsage: 'ownership-chip-only', badgeStyle: 'hairline-outline', selectedSignal: 'ring', actionsReveal: 'always-visible', hoverMotion: 'lift-6px' };
const CTRL_WEIGHT_DENSITY = { radius: '12px', elevation: 'flat-hairline', aspect: '2/3', titlePlacement: 'below-media', metaDensity: '2-line' };

const ROUNDS = {
  A: {
    round: 1,
    title: 'Screenroom — poster card · round A: weight + density',
    params: ['corner-radius', 'elevation', 'media-aspect', 'title-placement', 'meta-density'],
    control: { ...CTRL_COLOUR_MOTION, typeface: 'system-ui (Sora at build)', canvas: '#101216', 'gold-token': '#e9b84c', content: 'the same 4 real library titles and posters in every option' },
    variants: [
      { label: 'tight-below',  caption: 'sharp corners, flat, caption under the poster', spec: { ...CTRL_COLOUR_MOTION, radius: '4px',  elevation: 'flat-hairline',     aspect: '2/3',  titlePlacement: 'below-media', metaDensity: '2-line' },
        axis_values: { 'corner-radius': '4px',  elevation: 'flat-hairline',     'media-aspect': '2/3',  'title-placement': 'below-media', 'meta-density': '2-line' } },
      { label: 'soft-overlay', caption: 'soft corners, lighter surface, title over the poster', spec: { ...CTRL_COLOUR_MOTION, radius: '18px', elevation: 'surface-lightness', aspect: '2/3',  titlePlacement: 'overlay',     metaDensity: '1-line' },
        axis_values: { 'corner-radius': '18px', elevation: 'surface-lightness', 'media-aspect': '2/3',  'title-placement': 'overlay',     'meta-density': '1-line' } },
      { label: 'wide-plate',   caption: 'still frame instead of poster, cast shadow, three meta lines', spec: { ...CTRL_COLOUR_MOTION, radius: '10px', elevation: 'dual-layer-shadow', aspect: '16/9', titlePlacement: 'below-media', metaDensity: '3-line' },
        axis_values: { 'corner-radius': '10px', elevation: 'dual-layer-shadow', 'media-aspect': '16/9', 'title-placement': 'below-media', 'meta-density': '3-line' } },
    ],
  },
  B: {
    round: 2,
    title: 'Screenroom — poster card · round B: colour + motion',
    params: ['accent-usage', 'badge-style', 'selected-signal', 'actions-reveal', 'hover-motion'],
    control: { ...CTRL_WEIGHT_DENSITY, typeface: 'system-ui (Sora at build)', canvas: '#101216', 'gold-token': '#e9b84c', content: 'the same 4 real library titles and posters in every option' },
    variants: [
      { label: 'gold-only',     caption: 'gold on the ownership chip alone; nothing moves on hover', spec: { ...CTRL_WEIGHT_DENSITY, accentUsage: 'ownership-chip-only', badgeStyle: 'hairline-outline', selectedSignal: 'ring',  actionsReveal: 'always-visible', hoverMotion: 'none-edge-tint' },
        axis_values: { 'accent-usage': 'ownership-chip-only', 'badge-style': 'hairline-outline', 'selected-signal': 'ring',  'actions-reveal': 'always-visible', 'hover-motion': 'none-edge-tint' } },
      { label: 'poster-edge',   caption: 'each card edged in its own poster colour; controls appear on hover', spec: { ...CTRL_WEIGHT_DENSITY, accentUsage: 'poster-derived-edge', badgeStyle: 'pill-solid', selectedSignal: 'fill', actionsReveal: 'hover-reveal', hoverMotion: 'lift-6px' },
        axis_values: { 'accent-usage': 'poster-derived-edge', 'badge-style': 'pill-solid', 'selected-signal': 'fill', 'actions-reveal': 'hover-reveal', 'hover-motion': 'lift-6px' } },
      { label: 'chip-meter',    caption: 'gold on chip and progress meter; ribbon spec tags; scales on hover', spec: { ...CTRL_WEIGHT_DENSITY, accentUsage: 'chip-and-meter', badgeStyle: 'corner-ribbon', selectedSignal: 'check', actionsReveal: 'always-visible', hoverMotion: 'scale-1.02' },
        axis_values: { 'accent-usage': 'chip-and-meter', 'badge-style': 'corner-ribbon', 'selected-signal': 'check', 'actions-reveal': 'always-visible', 'hover-motion': 'scale-1.02' } },
    ],
  },
};

const CARDS = [
  { image: '/opt/homeserver/appdata/radarr/MediaCover/4/poster-500.jpg',  title: 'Cautionary Tale', meta: '2023 · 1.4 GB',  owned: true },
  { image: '/opt/homeserver/appdata/radarr/MediaCover/13/poster-500.jpg', title: 'Harry Potter and the Deathly Hallows: Part 2', meta: '2011 · 46.2 GB', owned: true },
  { image: '/opt/homeserver/appdata/radarr/MediaCover/42/poster-500.jpg', title: 'The Lord of the Rings: The Fellowship of the Ring', meta: '2001 · 16.4 GB', owned: true },
  { image: '/opt/homeserver/appdata/radarr/MediaCover/59/poster-500.jpg', title: 'Arjun Reddy', meta: '2017 · 6.2 GB', owned: false },
];

const out = process.argv[2] ?? '.';
mkdirSync(out, { recursive: true });
for (const [key, r] of Object.entries(ROUNDS)) {
  const variants = r.variants.map((v) => {
    const file = `panel-${key}-${v.label}.html`;
    writeFileSync(`${out}/${file}`, panel(v.spec));
    return { label: v.label, caption: v.caption, panelTemplate: file, axis_values: v.axis_values };
  });
  const cfg = {
    title: r.title,
    subtitle: 'Four states pinned open per option: rest · hover · focus-visible+selected · not-ours-yet. Real library posters, identical in every option; only the five named parameters move.',
    audienceProfile: 'P1',
    axis: {
      name: key === 'A' ? 'poster-card weight + density' : 'poster-card colour + motion',
      parameter: r.params.join(' · '),
      rung: 3,
      // STYLISTIC, deliberately: of the five params only title-placement and meta-density genuinely
      // restructure the DOM. The markup fingerprint is blind to CSS VALUES, so declaring this
      // "structural" is what false-rejected round 1. distinct-source + value-present + the computed
      // divergence pass are the real proof here.
      kind: 'stylistic',
      params: r.params,
    },
    control: r.control,
    contract: { animation_vocab: ['transform', 'opacity'], forbidden: ['parallax', 'bounce', 'gradient-text'] },
    cards: CARDS,
    posterWidth: 340,
    variants,
    shuffleSeed: key === 'A' ? 20260727 : 20260728,
    output: `screenroom-postercard-r${r.round}.html`,
    manifest: `screenroom-postercard-r${r.round}.manifest.json`,
  };
  writeFileSync(`${out}/variant-set-${key}.json`, JSON.stringify(cfg, null, 2));
  console.log(`round ${key}: ${variants.length} panels + variant-set-${key}.json`);
}
