import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';

// Load local environment files if running standalone via CLI
if (fs.existsSync(path.resolve('.env.local'))) {
  dotenv.config({ path: path.resolve('.env.local') });
}
dotenv.config({ path: path.resolve('.env') });

export async function runMigrations() {
  console.log('[MIGRATIONS] Starting TAPTCH database migrations...');

  const migrationsDir = path.resolve('src/db/migrations');
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const isTestOrExplicitPglite = process.env.NODE_ENV === 'test' || process.env.USE_PGLITE_DEV === 'true';

  if (isTestOrExplicitPglite) {
    const dataDir = process.env.PGLITE_DATA_DIR || path.resolve('.pgdata');
    console.log(`[MIGRATIONS] Executing migrations on isolated testing database (${dataDir})...`);
    const client = new PGlite(dataDir);

    // Ensure migrations ledger exists
    await client.exec(`
      CREATE TABLE IF NOT EXISTS __taptch_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = await client.query<{ name: string }>(
      'SELECT name FROM __taptch_migrations'
    );
    const appliedSet = new Set(appliedRows.rows.map((r) => r.name));

    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        console.log(`[MIGRATIONS] Skipping already applied: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`[MIGRATIONS] Applying ${file}...`);
      await client.exec(sql);
      await client.exec(`INSERT INTO __taptch_migrations (name) VALUES ('${file}') ON CONFLICT DO NOTHING`);
    }
    console.log('[MIGRATIONS] Isolated testing migrations completed successfully.');
    return;
  }

  // Connect via Supabase PostgreSQL connection
  const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      '[MIGRATIONS ERROR] DATABASE_URL (or DATABASE_URL_DIRECT) is not configured. ' +
      'Supabase PostgreSQL is the sole application runtime database.'
    );
  }

  if (connectionString.includes('[YOUR-PASSWORD]')) {
    throw new Error(
      '[MIGRATIONS ERROR] Detected placeholder "[YOUR-PASSWORD]" in connection string. ' +
      'Please replace [YOUR-PASSWORD] with your actual Supabase database password.'
    );
  }

  console.log(`[MIGRATIONS] Connecting to Supabase: ${connectionString.replace(/:[^:@]+@/, ':***@')}...`);
  const isRemote = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
  const sqlClient = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: isRemote ? 'require' : undefined,
  });

  try {
    await sqlClient.unsafe(`
      CREATE TABLE IF NOT EXISTS __taptch_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const applied = await sqlClient<{ name: string }[]>`
      SELECT name FROM __taptch_migrations
    `;
    const appliedSet = new Set(applied.map((r) => r.name));

    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        console.log(`[MIGRATIONS] Skipping already applied: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`[MIGRATIONS] Applying ${file}...`);
      await sqlClient.unsafe(sql);
      await sqlClient`INSERT INTO __taptch_migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`;
    }
    console.log('[MIGRATIONS] All PostgreSQL migrations applied successfully.');
  } catch (error) {
    console.error('[MIGRATIONS ERROR]', error);
    throw error;
  } finally {
    await sqlClient.end();
  }
}

// Allow direct execution: tsx src/db/migrate.ts
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
