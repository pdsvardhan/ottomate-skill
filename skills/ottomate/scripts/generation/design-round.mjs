#!/usr/bin/env node
// design-round.mjs — ONE command: gates → build → check → computed → publish.
//
// C5, 2026-07-27. Locked spec §12 criterion 10 says the pipeline runs as one command. It ran as two
// (build-variant-set, then publish-round), and the seam mattered: a round could be built, look fine,
// and then simply not be published — or be published from a stale build. One command removes the seam.
//
//   node design-round.mjs --set variant-set.json --manifest round.json \
//        --previews-dir /mnt/storage/ottomate/assets/previews \
//        --api http://127.0.0.1:8110 --token-file /opt/homeserver/ottomate/.token
//   ... --dry-run   run every gate and the build, publish nothing
//
// FAIL CLOSED at every step: if the isolation gate, the constraint checker or a blocking computed rule
// rejects the set, NOTHING is published. That is the whole point of collapsing the two commands — the
// publish step can no longer be run independently of the checks that guard it.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function args(argv) {
  const o = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a.startsWith('--')) o[a.slice(2).replace(/-/g, '_')] = argv[++i];
  }
  return o;
}

function run(script, argv, label) {
  const r = spawnSync(process.execPath, [script, ...argv], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n${label} exited ${r.status} — NOTHING PUBLISHED.`);
    process.exit(r.status || 1);
  }
}

const a = args(process.argv.slice(2));
if (!a.set || !a.manifest) {
  console.error('usage: node design-round.mjs --set variant-set.json --manifest round.json [--previews-dir <d>] [--api <url>] [--token-file <f>] [--dry-run]');
  process.exit(1);
}

console.log('── 1/2  build + gate + check + computed ' + '─'.repeat(30));
run(path.join(HERE, '..', 'preview-build', 'build-variant-set.mjs'), [a.set], 'build');

if (a.dryRun) {
  console.log('\n── 2/2  publish ' + '─'.repeat(54));
  run(path.join(HERE, 'publish-round.mjs'), ['--manifest', a.manifest, '--dry-run'], 'publish');
  console.log('\n--dry-run: the round was built and fully checked; nothing was published.');
  process.exit(0);
}

// The manifest's `html` must be what we just built — otherwise the seam is back, just hidden.
const set = JSON.parse(readFileSync(a.set, 'utf8'));
const man = JSON.parse(readFileSync(a.manifest, 'utf8'));
const built = path.resolve(path.dirname(a.set), set.output ?? 'variant-set.html');
if (path.resolve(man.html) !== built) {
  console.error(`\nmanifest.html (${man.html}) is not the file this run just built (${built}).`);
  console.error('Refusing: publishing a DIFFERENT file than the one that passed the gates is exactly');
  console.error('the failure collapsing these two commands exists to prevent.');
  process.exit(2);
}

console.log('\n── 2/2  publish ' + '─'.repeat(54));
const pub = ['--manifest', a.manifest];
if (a.previews_dir) pub.push('--previews-dir', a.previews_dir);
if (a.api) pub.push('--api', a.api);
if (a.token_file) pub.push('--token-file', a.token_file);
if (a.replace !== undefined) pub.push('--replace');
run(path.join(HERE, 'publish-round.mjs'), pub, 'publish');
