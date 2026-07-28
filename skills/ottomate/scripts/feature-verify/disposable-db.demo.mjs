#!/usr/bin/env node
// P3 (L2): live demo of the disposable real-DB harness — spins a throwaway Postgres via Testcontainers,
// round-trips a non-ASCII value (the headline L2 unicode-preservation assertion class) through a REAL
// database, and tears the container down. Proves the disposable-dependency mechanism is ready to back a
// write-heavy feature's system-state check. Needs Docker + `npm install` (@testcontainers/postgresql + pg).
//   node disposable-db.demo.mjs
import { withDisposablePostgres, disposableDbEnv } from './harness/disposable-db.mjs';
import pg from 'pg';

const ok = await withDisposablePostgres(async (conn) => {
  console.log('[disposable-db] started throwaway postgres:', conn.uri.replace(/:[^:@/]+@/, ':***@'));
  console.log('[disposable-db] app-under-test env would be:', JSON.stringify(disposableDbEnv(conn)).replace(/:[^:@/]+@/, ':***@'));
  const client = new pg.Client({ connectionString: conn.uri });
  await client.connect();
  await client.query('CREATE TABLE songs (id serial primary key, title text)');
  const title = 'పాట — Track 01 🎵'; // Telugu + em-dash + emoji: the exact "did the write preserve native script?" case
  await client.query('INSERT INTO songs (title) VALUES ($1)', [title]);
  const { rows } = await client.query('SELECT title FROM songs WHERE id = 1');
  await client.end();
  const roundTrip = rows[0]?.title === title;
  console.log(`[disposable-db] non-ascii round-trip through REAL postgres: ${roundTrip ? 'PASS' : 'FAIL'} — stored "${rows[0]?.title}"`);
  return roundTrip;
});
console.log('[disposable-db] container torn down.');
process.exit(ok ? 0 : 1);
