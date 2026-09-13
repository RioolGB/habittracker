import pg from 'pg';
import { config } from '../config.js';

const { Pool, types } = pg;

// node-postgres по умолчанию парсит DATE в Date (UTC полночь); нам нужна строка
// 'YYYY-MM-DD' для всех сравнений/ключей. TIME возвращаем как исходную строку.
types.setTypeParser(types.builtins.DATE, (v: string) => v);
types.setTypeParser(types.builtins.TIME, (v: string) => v);
types.setTypeParser(types.builtins.NUMERIC, (v: string) => Number(v));

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}