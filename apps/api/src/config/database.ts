import { Pool, type PoolConfig } from 'pg';
import { ApiError } from '../utils/apiError.js';

let pool: Pool | null = null;

function buildPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new ApiError(
      503,
      'DATABASE_NOT_CONFIGURED',
      'DATABASE_URL is required for database operations',
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    max: 10,
  };
}

export function getDatabasePool(): Pool {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }
  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
