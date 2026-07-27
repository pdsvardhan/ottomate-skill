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

/** Parse the CLI flags. Exported so the seam logic is testable without spawning the whole pipeline. */
export function parseArgs(argv) {
  const o = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a.startsWith('--')) o[a.slice(2).replace(/-/g, '_')] = argv[++i];
  }
  return o;
}

/**
 * THE SEAM the one-command design exists to close: the manifest we publish must name the very file
 * this run just built. Pure and exported so it can be tested directly — publishing a stale or
 * different artifact past green gates is the exact failure collapsing build+publish prevents.
 * @returns {{ok:boolean, built:string, want:string}}
 */
export function manifestMatchesBuild(set, manifest, setPath) {
  const built = path.resolve(path.dirname(setPath), set.output ?? 'variant-set.html');
  const want = path.resolve(manifest.html);
  return { ok: want === built, built, want };
}

function run(script, argv, label) {
  const r = spawnSync(process.execPath, [script, ...argv], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n${label} exited ${r.status} — NOTHING PUBLISHED.`);
    process.exit(r.status || 1);
  }
}

function main(argv) {
  const a = parseArgs(argv);
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

  const set = JSON.parse(readFileSync(a.set, 'utf8'));
  const man = JSON.parse(readFileSync(a.manifest, 'utf8'));
  const match = manifestMatchesBuild(set, man, a.set);
  if (!match.ok) {
    console.error(`\nmanifest.html (${man.html}) is not the file this run just built (${match.built}).`);
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
}

// Only run the CLI when invoked directly — importing it in a test must not execute the pipeline.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
