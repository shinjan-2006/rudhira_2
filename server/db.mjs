import { Pool, neonConfig } from "@neondatabase/serverless";
neonConfig.webSocketConstructor = globalThis.WebSocket;
let pool;
export function database() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "[SENSITIVE]")
    throw new Error("Database is not configured");
  return (pool ||= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }));
}
export async function transaction(fn) {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    const value = await fn(client);
    await client.query("COMMIT");
    return value;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
export async function query(text, values = []) {
  return database().query(text, values);
}
