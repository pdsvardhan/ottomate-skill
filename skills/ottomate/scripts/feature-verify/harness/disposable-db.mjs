// P3 (L2 flake-control): the DISPOSABLE real-dependency harness (Testcontainers, owner-confirmed IN).
// For an L2 system-state case that must assert against a REAL database rather than the live one, this
// spins a throwaway container, hands the app-under-test its connection, and tears it down — so the
// assertion runs against real-but-isolated state (no cross-test contamination, no touching prod data).
// ONE DOOR still holds: read the disposable instance's effect THROUGH the app's own API, never a 2nd
// client on prod. Testcontainers is loaded via dynamic import so this module is loadable without the dep;
// the container helper is exercised only where the dep + Docker exist (VAULT7A). See harness/flake-control.md.

/**
 * Map a disposable container's connection info to the env an app-under-test reads — so you point the
 * app's DISPOSABLE instance at the throwaway DB, drive it, then assert via its API. Pure + testable.
 */
export function disposableDbEnv(conn, opts = {}) {
  const varName = opts.varName ?? 'DATABASE_URL';
  if (!conn || !conn.uri) throw new Error('disposableDbEnv: connection info needs a uri');
  return { [varName]: conn.uri };
}

/**
 * Start a throwaway Postgres, run `fn(conn)`, and ALWAYS stop the container (even on throw).
 * @param {(conn:{uri:string,host:string,port:number,database:string,username:string,password:string})=>Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withDisposablePostgres(fn, opts = {}) {
  const image = opts.image ?? 'postgres:16-alpine';
  let PostgreSqlContainer;
  try {
    ({ PostgreSqlContainer } = await import('@testcontainers/postgresql'));
  } catch (e) {
    throw new Error(
      `disposable-db: @testcontainers/postgresql is not installed (${e.message}). ` +
      `Add it (+ pg) to package.json and npm install; the run host needs Docker.`,
    );
  }
  const container = await new PostgreSqlContainer(image).start();
  const conn = {
    uri: container.getConnectionUri(),
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    username: container.getUsername(),
    password: container.getPassword(),
  };
  try {
    return await fn(conn);
  } finally {
    await container.stop();
  }
}
