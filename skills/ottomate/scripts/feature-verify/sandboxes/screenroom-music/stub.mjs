// Minimal Jellyfin + Subsonic stub for the screenroom music-upload sandbox. Answers the endpoints the
// upload flow calls so the app's own rescan/dedup paths run, and logs every call (GET /__log) so a test
// can prove the rescan fired. (The real "visible after rescan" check uses a REAL disposable Navidrome —
// this stub only covers Jellyfin's dedup/refresh + a Subsonic ping.)
import http from 'node:http';
const log = [];
const j = (res, o, c = 200) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  log.push(`${new Date().toISOString()} ${req.method} ${u.pathname}`);
  if (u.pathname === '/rest/startScan' || u.pathname === '/rest/ping')
    return j(res, { 'subsonic-response': { status: 'ok', version: '1.16.1', type: 'navidrome' } });
  if (u.pathname === '/Search/Hints') return j(res, { SearchHints: [], TotalRecordCount: 0 }); // empty ⇒ no false dupes
  if (u.pathname === '/Library/Refresh') { res.writeHead(204); return res.end(); }
  if (u.pathname === '/__log') return j(res, { log });
  let b = ''; req.on('data', d => b += d); req.on('end', () => j(res, { ok: true, stub: true, path: u.pathname }));
}).listen(4599, '0.0.0.0', () => console.log('stub on 4599'));
