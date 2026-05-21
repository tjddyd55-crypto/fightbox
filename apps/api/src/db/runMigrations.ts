import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePool, closeDatabasePool } from '../config/database.js';

function resolveMigrationsDir(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const bundledDir = join(currentDir, 'migrations');
  if (existsSync(bundledDir)) {
    return bundledDir;
  }

  const sourceDir = join(currentDir, '../../src/db/migrations');
  if (existsSync(sourceDir)) {
    return sourceDir;
  }

  throw new Error('Migrations directory not found');
}

async function ensureSchemaMigrationsTable(): Promise<void> {
  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrationIds(): Promise<Set<string>> {
  const pool = getDatabasePool();
  const result = await pool.query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id');
  return new Set(result.rows.map((row) => row.id));
}

async function applyMigration(id: string, sql: string): Promise<void> {
  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
    await client.query('COMMIT');
    console.info(`[migrate] applied ${id}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations(): Promise<void> {
  const migrationsDir = resolveMigrationsDir();
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.info('[migrate] no migration files found');
    return;
  }

  await ensureSchemaMigrationsTable();
  const applied = await getAppliedMigrationIds();

  for (const file of files) {
    if (applied.has(file)) {
      console.info(`[migrate] skip ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    await applyMigration(file, sql);
  }

  console.info('[migrate] complete');
}

runMigrations()
  .catch((error) => {
    console.error('[migrate] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
