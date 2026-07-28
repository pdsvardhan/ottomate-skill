import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disposableDbEnv } from './disposable-db.mjs';

// The container helper itself needs Docker + @testcontainers/postgresql, so it is proven by the live
// demo (disposable-db.demo.mjs on VAULT7A), not a pure test. The pure config shaper is tested here.

test('disposableDbEnv maps a container connection uri to the app-under-test env var', () => {
  const conn = { uri: 'postgres://u:p@127.0.0.1:54321/test' };
  assert.deepEqual(disposableDbEnv(conn), { DATABASE_URL: 'postgres://u:p@127.0.0.1:54321/test' });
  assert.deepEqual(disposableDbEnv(conn, { varName: 'FV_DB_URL' }), { FV_DB_URL: 'postgres://u:p@127.0.0.1:54321/test' });
});

test('disposableDbEnv refuses connection info without a uri (fail-loud)', () => {
  assert.throws(() => disposableDbEnv({}), /needs a uri/);
  assert.throws(() => disposableDbEnv(null), /needs a uri/);
});
