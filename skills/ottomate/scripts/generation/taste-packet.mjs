// taste-packet.mjs — Phase 0 WS0.3. Pillar A wired into generation (spec §8 / §3 Pillar A).
//
// Reads the owner's taste profile (references/taste-profile.md) and turns it into (1) a compact `taste`
// block injected into every round packet, and (2) the anti-slop TIER FLIP: for THIS owner the aesthetic
// "slop tells" they A-graded — glow, gradient-text, glassmorphism, 3D, spotlight — become ADVISORY, never
// blocking (F-16 + the doctrine's own owner-override corollary: "an explicitly requested slop tell wins —
// do it well"). Floors are NOT touched: contrast (the per-theme gate), reduced-motion and feasibility
// stay blocking. Taste changes the aesthetic ceiling, never the legibility floor.
//
// Pure + dependency-free. loadTaste(file) reads the md; buildTastePacket(taste) is what the packet carries.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TASTE_FILE = path.resolve(HERE, '../../references/taste-profile.md');

// The doctrine's aesthetic "slop tells" (design-rules.json forbidden.detectors + doctrine rule 48).
// These are the ONLY tiers taste may flip — floors (contrast/reduced-motion/feasibility) are excluded.
export const DOCTRINE_TELLS = ['glow', 'gradient-text', 'glassmorphism', 'neumorphism', 'parallax', 'bounce'];
// aliases so a prose profile ("glass cards", "gradient flow text", "3D") maps onto the canonical tells.
const TELL_ALIASES = {
  glow: [/\bglow\b/i, /spotlight/i, /lampeffect/i, /borderglow/i],
  'gradient-text': [/gradient[- ]?(flow )?text/i, /\bgradient\b/i],
  glassmorphism: [/glassmorphism/i, /\bglass(-| )?card/i, /\bglass\b/i],
  neumorphism: [/neumorphism/i],
  parallax: [/parallax/i, /scroll-driven/i, /webgl scroll/i],
  bounce: [/\bspringy\b/i, /\belastic\b/i, /\bbounce\b/i],
};

const section = (md, heading) => {
  const re = new RegExp(`^##\\s+.*${heading}.*$`, 'im');
  const m = md.match(re);
  if (!m) return '';
  const start = m.index + m[0].length;
  const next = md.slice(start).search(/^##\s+/m);
  return md.slice(start, next === -1 ? undefined : start + next).trim();
};
const bullets = (block) => block.split('\n').filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, '').trim());

/**
 * Parse the taste profile markdown into the structured signal the generator grounds on.
 * @returns {{oneLine, styleFamily, motionBudget, delight, loves:string[], avoid:string, wanted:string[],
 *            antiSlop:{tier:'advisory', tells:string[], reason:string}, source:string}}
 */
export function parseTasteProfile(md) {
  const oneLine = (section(md, 'One line').match(/\*\*(.+?)\*\*/)?.[1] ?? section(md, 'One line').split('\n')[0] ?? '').trim();
  const posture = section(md, 'Default generator posture');
  const motionBudget = /motion budget\s*=\s*expressive/i.test(posture) || /motion appetite is \*\*maximum/i.test(md) ? 'expressive' : 'productive';
  const loves = bullets(section(md, 'Loves')).map((l) => l.replace(/\*\*/g, '').split('→')[0].trim()).filter(Boolean);
  const avoid = section(md, 'Avoid').replace(/\n+/g, ' ').trim();

  // wanted = the doctrine tells this profile marks as loved (grounded in the file, not hardcoded taste).
  const wanted = DOCTRINE_TELLS.filter((tell) => (TELL_ALIASES[tell] || []).some((re) => re.test(md)));
  const advisory = /anti-slop.*(advisory|never blocking)/is.test(md) || /ADVISORY, never blocking/i.test(md);

  return {
    oneLine,
    styleFamily: section(md, 'Style family').split('\n')[0].trim(),
    motionBudget,
    delight: /delight is a feature/i.test(md),
    loves,
    avoid,
    wanted,
    antiSlop: {
      tier: advisory ? 'advisory' : 'block_owner',
      tells: wanted,
      reason: 'owner A-graded these components; doctrine rule 22 corollary — an explicitly wanted tell wins',
    },
    source: 'references/taste-profile.md',
  };
}

export function loadTaste(file = DEFAULT_TASTE_FILE) {
  return parseTasteProfile(readFileSync(file, 'utf8'));
}

/**
 * The compact block injected into a round packet. Small on purpose — a bar the generator reads, not the
 * whole essay. `antiSlopAdvisory` is the flip flag the checker consults.
 */
export function buildTastePacket(taste) {
  return {
    oneLine: taste.oneLine,
    styleFamily: taste.styleFamily,
    motionBudget: taste.motionBudget,
    delight: taste.delight,
    loves: taste.loves.slice(0, 8),
    avoid: taste.avoid,
    antiSlopAdvisory: taste.antiSlop.tier === 'advisory',
    wantedTells: taste.wanted,
    source: taste.source,
  };
}

/**
 * The tier an anti-slop tell carries FOR THIS OWNER. A wanted aesthetic tell downgrades to 'advisory';
 * anything else keeps its base tier. Floors are never passed here, so they are never downgraded.
 * @param {string} tell        a doctrine tell id (glow / gradient-text / glassmorphism / ...)
 * @param {string} baseTier    the tier the tell would carry with no taste (e.g. 'block_owner')
 * @param {object} taste       parsed taste profile
 */
export function antiSlopTierFor(tell, baseTier, taste) {
  if (taste?.antiSlop?.tier === 'advisory' && taste.wanted.includes(tell)) return 'advisory';
  return baseTier;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // quick self-dump
  const t = loadTaste();
  console.log(JSON.stringify(buildTastePacket(t), null, 2));
}
