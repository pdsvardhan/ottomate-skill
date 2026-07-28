// round-banner.mjs — WS1.2. The legibility banner (fixes F-17, the owner's sharpest complaint).
//
// The test's #1 failure: the owner could not tell WHAT a round was deciding, or what varied vs what was
// held — and motion was silently deferred to a "round 2" they never agreed to. A round must state, LOUD
// and in plain language, exactly what it decides THIS round and what is held constant, and it must NEVER
// silently defer an axis. Decision-legibility is a first-class requirement, not a caption.
//
// Pure + dependency-free. Emits a structured banner + a plain-text render (method/CLI) + an HTML render
// (the Ottomate design surface consumes it when WS1.1 deploys). Two guarantees the tests pin:
//   1. every contested axis is ACCOUNTED FOR — decided | held | deferred — or `assertAccounted` fails
//      (that unaccounted axis is exactly the silent gap F-17 is about);
//   2. any deferred axis sets `assentRequired` — a deferral is stated and needs a yes, never silent.

const label = (a) => a.hint ? `${a.id} (${a.hint})` : a.id;

/**
 * @param {object} o
 * @param {string} [o.archetype]
 * @param {Array<{id,hint?}>} o.decided     the sub-decisions THIS round decides
 * @param {Array<{id,hint?,value?}>} [o.held]  frozen/constant axes held this round
 * @param {Array<{id,hint?,toRound?}>} [o.deferred]  axes pushed to another round — NAMED, never silent
 * @param {number} o.variantCount            how many versions are shown
 * @returns {{headline,decides,held,deferred,variantCount,assentRequired,text,html}}
 */
export function buildBanner({ archetype = null, decided = [], held = [], deferred = [], variantCount = 0 } = {}) {
  if (!decided.length) throw new Error('a round with nothing decided is not a round — `decided` is required');
  if (variantCount < 2) throw new Error(`a round shows at least 2 versions to pick between; got ${variantCount}`);

  const decidesList = decided.map(label);
  const headline = `This round decides: ${decidesList.join(', ')}.`;
  const holdLine = `The ${variantCount} versions differ ONLY in that — everything else is held constant.`;
  const assentRequired = deferred.length > 0;

  const lines = [headline, holdLine];
  if (held.length) lines.push(`Held: ${held.map(label).join(', ')}.`);
  if (deferred.length) {
    lines.push(`Deferred to a later round (NOT decided now): ${deferred.map(label).join(', ')}. ` +
      `— confirm you're OK deferring these; nothing is decided behind your back.`);
  }
  lines.push('Pick one value per decision, or mix across versions — a mix is the normal outcome.');

  return {
    archetype, headline,
    decides: decided, held, deferred, variantCount, assentRequired,
    text: lines.join('\n'),
    html: renderHtml({ headline, holdLine, decided, held, deferred, assentRequired }),
  };
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function renderHtml({ headline, holdLine, decided, held, deferred, assentRequired }) {
  const chips = (arr, cls) => arr.map((a) => `<span class="rb-chip rb-${cls}">${esc(label(a))}</span>`).join('');
  return [
    '<section class="round-banner" role="note" aria-label="What this round decides">',
    `  <p class="rb-headline"><strong>This round decides:</strong> ${chips(decided, 'decide')}</p>`,
    `  <p class="rb-hold">${esc(holdLine)}</p>`,
    held.length ? `  <p class="rb-held"><strong>Held constant:</strong> ${chips(held, 'held')}</p>` : '',
    deferred.length
      ? `  <p class="rb-deferred"><strong>Deferred (not decided now):</strong> ${chips(deferred, 'deferred')}`
        + `<span class="rb-assent">needs your OK to defer</span></p>`
      : '',
    '  <p class="rb-mix">Pick one per decision, or mix across versions — a mix is normal.</p>',
    '</section>',
  ].filter(Boolean).join('\n');
}

/**
 * Every contested axis must be accounted for. An axis that is neither decided, held, nor explicitly
 * deferred is the SILENT GAP F-17 is about — the round would vary or drop it without saying so.
 * @param {Array<{id}>} contested   all sub-decisions in play (anatomy minus none)
 * @param {{decided,held,deferred}} placed
 * @returns {{ok:boolean, unaccounted:string[], doubleCounted:string[], why:string}}
 */
export function assertAccounted(contested = [], { decided = [], held = [], deferred = [] } = {}) {
  const ids = (a) => new Set(a.map((x) => x.id));
  const dec = ids(decided), hel = ids(held), def = ids(deferred);
  const all = contested.map((x) => x.id);
  const placed = new Set([...dec, ...hel, ...def]);
  const unaccounted = all.filter((id) => !placed.has(id));
  // an axis that is BOTH decided and deferred (or decided and held) is an incoherent round
  const doubleCounted = all.filter((id) => [dec.has(id), hel.has(id), def.has(id)].filter(Boolean).length > 1);
  const ok = unaccounted.length === 0 && doubleCounted.length === 0;
  return {
    ok, unaccounted, doubleCounted,
    why: ok ? 'every contested axis is decided, held, or explicitly deferred'
      : [unaccounted.length ? `SILENT GAP — unaccounted axes: ${unaccounted.join(', ')} (varied or dropped without saying so)` : '',
         doubleCounted.length ? `incoherent — axes in two buckets: ${doubleCounted.join(', ')}` : ''].filter(Boolean).join('; '),
  };
}

/**
 * Derive the banner from a composeRounds() result for the round being published, and CHECK accountability.
 * @param {object} o
 * @param {{rounds:Array}} o.composition     composeRounds output
 * @param {number} o.currentRound            the round index being published (1-based)
 * @param {Array<{id,hint?}>} [o.frozen]     held/locked axes (from frozenByAxis, as {id,...})
 * @param {number} o.variantCount
 * @returns {{banner, accounting}}
 */
export function bannerFromComposition({ composition, currentRound = 1, frozen = [], variantCount = 0, archetype = null } = {}) {
  const rounds = composition?.rounds ?? [];
  const thisRound = rounds.find((r) => r.index === currentRound);
  if (!thisRound) throw new Error(`round ${currentRound} is not in the composition (rounds: ${rounds.map((r) => r.index).join(', ') || 'none'})`);
  const decided = thisRound.axes.map((a) => ({ id: a.id, hint: a.hint }));
  const deferred = rounds.filter((r) => r.index !== currentRound)
    .flatMap((r) => r.axes.map((a) => ({ id: a.id, hint: a.hint, toRound: r.index })));
  const held = frozen.map((a) => ({ id: a.id ?? a, hint: a.hint }));

  const contested = rounds.flatMap((r) => r.axes.map((a) => ({ id: a.id })));
  const accounting = assertAccounted([...contested, ...held], { decided, held, deferred });
  const banner = buildBanner({ archetype, decided, held, deferred, variantCount });
  return { banner, accounting };
}
