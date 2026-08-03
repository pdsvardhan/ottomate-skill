#!/usr/bin/env node
// Feature verifier for screenroom's MUSIC-UPLOAD flow (flow-music-upload). Runs on VAULT7A against the
// DISPOSABLE sandbox (./up.sh) — a throwaway screenroom + real disposable Navidrome + Jellyfin stub on
// scratch dirs; the live library is never touched. Drives the REAL routes /api/music/{upload,scan,commit}
// (multipart) and asserts via second channels the coder can't fake: the FILESYSTEM (landed path + ffprobe
// tags), the COMMIT response, and LIVE Navidrome search3. Fail-closed. On finish it posts the report keyed
// to the flow id + drives flow.test_status via the tracker (skip with FV_NO_POST=1).
//
//   ./up.sh && FV_BEARER_TOKEN=$(cat /opt/homeserver/ottomate/.token) node music-upload.verify.mjs
//
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ROOT = process.env.SR_SANDBOX_ROOT || '/tmp/sr-sandbox';
const MUSIC = `${ROOT}/music`, C = `${ROOT}/corpus`;
const SR = process.env.SR_URL || 'http://127.0.0.1:8599';
const ND = process.env.ND_URL || 'http://127.0.0.1:4610';
const NDPASS = process.env.ND_ADMIN_PASS || 'verifyadmin';
const LIB = process.env.SR_MUSIC_LIB || '/mnt/storage/media/music';

const sh = (c) => execFileSync('bash', ['-c', c]).toString().trim();
const ndAuth = (() => { const s = 'fvsalt01'; const t = sh(`echo -n ${NDPASS}${s}|md5sum|cut -d' ' -f1`); return `u=admin&t=${t}&s=${s}&v=1.16.1&c=fv&f=json`; })();
const ff = (p) => { try { const t = JSON.parse(sh(`ffprobe -v quiet -show_entries format_tags -of json "${p}"`)).format?.tags || {}; const o = {}; for (const k in t) o[k.toLowerCase()] = t[k]; return o; } catch { return {}; } };
const landed = () => sh(`find ${MUSIC} -type f 2>/dev/null`).split('\n').filter(Boolean);
const ndSearch = async (q) => { const r = await (await fetch(`${ND}/rest/search3?query=${encodeURIComponent(q)}&${ndAuth}`)).json(); return r['subsonic-response']?.searchResult3?.song || []; };
const upload = async (rels) => { const fd = new FormData(); for (const rel of rels) { const b = await readFile(`${C}/${rel}`); fd.append('files', new Blob([b]), rel); } fd.append('relativePaths', JSON.stringify(rels)); const res = await fetch(SR + '/api/music/upload', { method: 'POST', body: fd }); return { status: res.status, json: await res.json().catch(() => ({})) }; };
const scan = async (f) => await (await fetch(SR + '/api/music/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: f, recursive: true }) })).json();
const toCommit = (f) => { const t = f.tags || {}; const o = { srcPath: f.srcPath, language: f.detectedLang, artist: t.artist, artists: t.artists, album: t.album, title: t.title, trackNumber: t.trackNumber, extension: (f.filename || '').split('.').pop(), albumArtist: t.albumArtist, lyrics: f.lyrics }; if (f.detectedLang === 'other') o.genre = t.genre; return o; };
const commit = async (files, extra = {}) => await (await fetch(SR + '/api/music/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ files, triggerRescan: true, ...extra }) })).json();
const R = []; const rec = (c, layer, ok, detail) => { R.push({ case: c, layer, outcome: ok ? 'pass' : 'fail', detail }); console.log((ok ? 'PASS' : 'FAIL').padEnd(5), `[${layer}]`, c, '-', detail); };
const clean = (s) => (s || '').split(' (')[0].trim();

// ── corpus prep: copy 5 blessed from the real library (read-only) + build nasty variants ──
sh(`mkdir -p ${C}`);
const SRC = {
  'payphone.flac': `${LIB}/other/Maroon 5/Singles/02 - Payphone.flac`,
  'indhuvadana.flac': `${LIB}/telugu/Challenge/Indhuvadana.flac`,
  'ghoomar.flac': `${LIB}/hindi/Padmaavat/01 - Ghoomar.flac`,
  'lovemelikeyoudo.flac': `${LIB}/english/Fifty Shades Freed (Original Motion Picture Soundtrack)/17 - Love Me Like You Do.flac`,
};
for (const [rel, src] of Object.entries(SRC)) sh(`cp "${src}" "${C}/${rel}"`);
sh(`cp "$(find ${LIB}/tamil -iname '*Pavazha Malli*.flac' | head -1)" "${C}/pavazha.flac"`);
sh(`printf 'not an audio file' > "${C}/readme.txt"`);                         // non-audio
sh(`head -c 40000 "${C}/payphone.flac" > "${C}/corrupt.flac"`);               // truncated → integrity fails
sh(`ffmpeg -y -v error -i "${C}/payphone.flac" -map_metadata -1 -c copy "${C}/notags.flac"`); // tags stripped

const blessed = ['payphone.flac', 'indhuvadana.flac', 'ghoomar.flac', 'lovemelikeyoudo.flac', 'pavazha.flac'].map(rel => ({ rel, t: ff(`${C}/${rel}`) }));

// ── Phase 1 — happy path: 5 blessed songs land correctly + conservation + live Navidrome visibility ──
sh(`rm -rf ${MUSIC}/* 2>/dev/null; true`);
const u1 = await upload(blessed.map(b => b.rel));
rec('upload 5 blessed songs', 'L1', u1.json.ok && u1.json.fileCount === 5, `status ${u1.status} fileCount ${u1.json.fileCount}`);
const s1 = await scan(u1.json.folderPath);
rec('scan detects 5, 0 unplayable', 'L1', s1.ok && s1.count === 5 && s1.unplayable === 0, `count ${s1.count} unplayable ${s1.unplayable}`);
const c1 = await commit(s1.files.map(toCommit));
rec('commit moves 5, 0 failed, rescan fired', 'L2', c1.ok && c1.moved === 5 && c1.failed === 0 && c1.rescan?.ok, `moved ${c1.moved} failed ${c1.failed} rescan ${c1.rescan?.ok}`);
await new Promise(r => setTimeout(r, 8000)); // let the real Navidrome index the scratch library
const L1 = landed();
rec('conservation 5 in to 5 landed', 'L3', L1.length === 5, `landed ${L1.length}`);
for (const b of blessed) {
  const bt = b.t, core = clean(bt.title);
  const m = L1.map(p => ({ p, t: ff(p) })).find(x => x.t.album === bt.album && ((x.t.title === bt.title) || clean(x.t.title) === core));
  const ok = m && m.t.artist === bt.artist && (m.t.album_artist || m.t.albumartist) === (bt.album_artist || bt.albumartist) && m.t.album === bt.album && m.t.genre === bt.genre;
  rec(`correctness ${b.rel}`, 'correctness', !!ok, m ? `${m.p.replace(MUSIC, '')} | ${m.t.title}/${m.t.artist}/${m.t.album}/${m.t.album_artist || m.t.albumartist}` : 'MISSING');
  const nd = await ndSearch(core); const hit = nd.find(x => x.album === bt.album || clean(x.title) === core);
  rec(`navidrome-visible ${b.rel}`, 'L2', !!hit, hit ? `"${hit.title}"/${hit.album}` : 'NOT FOUND');
}
// ── Phase 2 — duplicate re-commit: no-clobber guard, library size unchanged ──
const u2 = await upload(blessed.map(b => b.rel)); const s2 = await scan(u2.json.folderPath); const c2 = await commit(s2.files.map(toCommit));
rec('duplicate re-commit not double-committed', 'L3', c2.moved === 0 && landed().length === 5, `2nd-commit moved ${c2.moved} landed ${landed().length}`);
// ── Phase 3 — non-audio rejected at upload ──
const u3 = await upload(['readme.txt']);
rec('non-audio rejected at upload', 'L1', (!u3.json.ok) || u3.status >= 400, `status ${u3.status} ok ${u3.json.ok}`);
// ── Phase 4 — corrupt FLAC fail-closed (integrity gate rejects, nothing lands) ──
const before = landed().length; const u4 = await upload(['corrupt.flac']); let rej = false, integ = null;
if (u4.json.ok) { const s4 = await scan(u4.json.folderPath); integ = s4.files?.[0]?.integrity?.ok; const c4 = await commit((s4.files || []).map(toCommit)); rej = (c4.rejectedUnplayable > 0) || (c4.moved === 0); } else rej = true;
rec('corrupt FLAC rejected, not committed', 'L1-failclosed', rej && landed().length === before, `integrity.ok ${integ} landed ${before}->${landed().length}`);
// ── Phase 5 — no-tags → user-chosen (web-searched) metadata persists on commit ──
const u5 = await upload(['notags.flac']); const s5 = await scan(u5.json.folderPath);
const f5 = s5.files?.[0] || {}; const lowconf = !f5.tags?.title || f5.confidence !== 'high';
rec('no-tags: scan flags low/absent metadata', 'L1', lowconf, `detected.title=${f5.tags?.title || '(none)'} confidence=${f5.confidence}`);
const chosen = { srcPath: f5.srcPath, language: 'english', artist: 'FV Tester', album: 'FV Sandbox Album', title: 'No Tags Test', albumArtist: 'FV Tester', extension: 'flac' };
const c5 = await commit([chosen]); const nt = landed().find(p => /No Tags Test/.test(p)); const t5 = nt ? ff(nt) : {};
rec('no-tags: chosen metadata persists on commit', 'L2', c5.moved >= 1 && t5.title === 'No Tags Test' && t5.artist === 'FV Tester', `landed ${nt ? nt.replace(MUSIC, '') : 'MISSING'} title=${t5.title}`);

// ── Phase 6 — feat.-grouping (edge #126): a real multi-track album (Son of Satyamurthy,
//    7 tracks, ALBUMARTIST=Devi Sri Prasad, varied per-track ARTIST incl. a ;-multi one).
//    Assert they group into ONE folder by album-artist, and the ;-track keeps BOTH singers. ──
sh(`rm -rf ${MUSIC}/* 2>/dev/null; true`);
sh(`cp "${LIB}/telugu/Son of Satyamurthy"/*.flac "${C}/" 2>/dev/null; true`);
const sosRels = sh(`cd "${LIB}/telugu/Son of Satyamurthy" && ls *.flac 2>/dev/null`).split('\n').filter(Boolean);
const u6 = await upload(sosRels);
const s6 = await scan(u6.json.folderPath);
const c6 = await commit(s6.files.map(toCommit));
const L6 = landed(); const L6t = L6.map(p => ({ p, t: ff(p) }));
const dirs = new Set(L6.map(p => p.replace(/\/[^/]+$/, ''))); const theDir = [...dirs][0] || '';
rec('feat-grouping: varied-artist tracks land in ONE folder (conservation)', 'L3', dirs.size === 1 && L6.length === sosRels.length, `moved ${c6.moved} landed ${L6.length}/${sosRels.length} in ${dirs.size} dir(s)`);
rec('feat-grouping: one folder <lang>/Devi Sri Prasad/Son of Satyamurthy', 'L2', /\/Devi Sri Prasad\/Son of Satyamurthy$/.test(theDir), theDir.replace(MUSIC, '') || '(none)');
const aaSet = new Set(L6t.map(x => x.t.album_artist || x.t.albumartist));
rec('feat-grouping: album-artist constant = Devi Sri Prasad', 'correctness', aaSet.size === 1 && aaSet.has('Devi Sri Prasad'), [...aaSet].join(' | ') || '(none)');
const multi = L6t.find(x => /Sagar/i.test(x.t.artist || ''));
rec('feat-grouping: ;-multi-artist track keeps both singers', 'correctness', !!multi && /Sagar/i.test(multi.t.artist || '') && /Manasi/i.test(multi.t.artist || ''), multi ? `artist=${multi.t.artist}` : 'Sagar track not found');

// ── verdict ──
const fails = R.filter(r => r.outcome === 'fail').length;
console.log(`\n=== VERDICT: ${fails ? 'BLOCK' : 'APPROVE'} — screenroom music-upload — cases ${R.length} | pass ${R.length - fails} | fail ${fails} ===`);

// ── P1d/P1e: wire the real result into the tracker registry (skip with FV_NO_POST=1) ──
if (process.env.FV_NO_POST !== '1') {
  const TB = process.env.FV_TRACKER_BASE || 'http://127.0.0.1:8110', TOK = process.env.FV_BEARER_TOKEN;
  const H = { 'content-type': 'application/json', authorization: `Bearer ${TOK}` };
  const verdict = fails ? 'BLOCK' : 'APPROVE';
  const failed = R.filter(r => r.outcome === 'fail').map(r => r.case);
  const body = {
    project_slug: 'screenroom', target_kind: 'stage-3-feature', target_id: 'flow-music-upload',
    verifier_session_id: 'fv-music-upload-' + Date.now(), commit_sha: process.env.FV_COMMIT_SHA || null,
    recommendation_overall: verdict, recommendation_reason: `${R.length - fails}/${R.length} cases passed` + (fails ? `; DEFECT: ${failed.join('; ')}` : ''),
    risk_policy: 'block', mandatory_user_review: fails > 0,
    case_matrix: R.map(r => ({ case: r.case, axis: r.layer, variant: 'happy', outcome: r.outcome, system_state: { detail: r.detail } })),
    full_report: { flow_id: 'flow-music-upload', instance: 'disposable sandbox (never the live library)', failed },
  };
  const rep = await (await fetch(TB + '/api/feature-verification-reports', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
  console.log('REPORT id', rep.report?.id ?? rep.id, '->', verdict);
  const ft = await (await fetch(TB + '/api/flows/flow-music-upload/test', { method: 'POST', headers: H, body: JSON.stringify({ status: fails ? 'failing' : 'passing', ran_by: 'automated', notes: (`FV: ${R.length - fails}/${R.length} pass.` + (fails ? ` DEFECT: ${failed.join('; ')}` : '')).slice(0, 500) }) })).json();
  console.log('flow.test_status ->', ft.flow?.test_status);
  await fetch(TB + '/api/projects/screenroom/flows/flow-music-upload', { method: 'PATCH', headers: H, body: JSON.stringify({ linked_playwright_test: 'skills/ottomate/scripts/feature-verify/sandboxes/screenroom-music/music-upload.verify.mjs' }) });
}
process.exit(fails ? 1 : 0);
