import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugOf, impactedApps, globToRegExp, impactedMatrices } from './impacted.mjs';

test('slugOf: repo-path convention → slug (websites + ottomate), else null', () => {
  assert.equal(slugOf('/mnt/storage/websites/mapsofbharat/app/page.tsx'), 'mapsofbharat');
  assert.equal(slugOf('/opt/homeserver/ottomate/app/x.tsx'), 'ottomate');
  assert.equal(slugOf('/opt/homeserver/ottomate'), 'ottomate');
  assert.equal(slugOf('/tmp/scratch/x.ts'), null);
  assert.equal(slugOf('C:\\mnt\\storage\\websites\\foo\\a.ts', { websitesRoot: 'C:/mnt/storage/websites' }), 'foo');
});

test('impactedApps: unique + sorted, nulls dropped', () => {
  const apps = impactedApps([
    '/mnt/storage/websites/screenroom/a.ts',
    '/mnt/storage/websites/mapsofbharat/b.ts',
    '/mnt/storage/websites/screenroom/c.ts',
    '/tmp/unrelated.ts',
  ]);
  assert.deepEqual(apps, ['mapsofbharat', 'screenroom']);
});

test('globToRegExp: ** spans dirs, * within a segment, ? one char', () => {
  assert.equal(globToRegExp('app/**').test('app/components/x.tsx'), true);
  assert.equal(globToRegExp('app/components/*.tsx').test('app/components/Card.tsx'), true);
  assert.equal(globToRegExp('app/components/*.tsx').test('app/components/sub/Card.tsx'), false);
  assert.equal(globToRegExp('**/*.css').test('app/styles/globals.css'), true);
  assert.equal(globToRegExp('a?c.ts').test('abc.ts'), true);
  assert.equal(globToRegExp('a?c.ts').test('a/c.ts'), false);
});

const matrices = [
  { file: 'poster-card.matrix.json', covers: ['app/components/PosterCard.tsx', 'app/components/poster/**'] },
  { file: 'indicator-switch.matrix.json', covers: ['app/routes/map/**'] },
  { file: 'legacy.matrix.json' }, // no covers ⇒ always impacted
];

test('must-pass: a diff impacts only the matrices whose covers globs match — plus every no-covers matrix', () => {
  const hit = impactedMatrices(['app/components/PosterCard.tsx'], matrices).map((m) => m.file);
  assert.deepEqual(hit.sort(), ['legacy.matrix.json', 'poster-card.matrix.json']);
});

test('must-fail: a matrix whose covers do not match is EXCLUDED (not swept in)', () => {
  const hit = impactedMatrices(['app/components/PosterCard.tsx'], matrices).map((m) => m.file);
  assert.equal(hit.includes('indicator-switch.matrix.json'), false);
});

test('an empty diff impacts nothing (even the no-covers matrix)', () => {
  assert.deepEqual(impactedMatrices([], matrices), []);
});
