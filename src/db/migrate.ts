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
  console.log('[MIGRATIONS] Starting Tappzio database migrations...');

  const migrationsDir = path.resolve('src/db/migrations');
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const isPglite =
    process.env.USE_PGLITE_DEV === 'true' ||
    (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DIRECT);

  if (isPglite) {
    const dataDir = process.env.PGLITE_DATA_DIR || path.resolve('.pgdata');
    console.log(`[MIGRATIONS] Executing migrations on embedded PGlite (${dataDir})...`);
    const client = new PGlite(dataDir);

    // Ensure migrations ledger exists (support both __tappzio_migrations and legacy __tapzio_migrations)
    await client.exec(`
      CREATE TABLE IF NOT EXISTS __tappzio_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS __tapzio_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = await client.query<{ name: string }>(
      'SELECT name FROM __tappzio_migrations UNION SELECT name FROM __tapzio_migrations'
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
      await client.exec(`INSERT INTO __tappzio_migrations (name) VALUES ('${file}') ON CONFLICT DO NOTHING`);
    }
    console.log('[MIGRATIONS] Embedded PGlite migrations completed successfully.');
    return;
  }

  // Connect via DIRECT migrator connection (tappzio_migrator)
  const connectionString =
    process.env.DATABASE_URL_DIRECT ||
    process.env.DATABASE_URL ||
    'postgres://tappzio_migrator:tappzio_migrator_pass@localhost:5432/tappzio_db?sslmode=disable';

  console.log(`[MIGRATIONS] Connecting to ${connectionString.replace(/:[^:@]+@/, ':***@')}...`);
  const sqlClient = postgres(connectionString, { max: 1 });

  try {
    await sqlClient.unsafe(`
      CREATE TABLE IF NOT EXISTS __tappzio_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS __tapzio_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const applied = await sqlClient<{ name: string }[]>`
      SELECT name FROM __tappzio_migrations
      UNION
      SELECT name FROM __tapzio_migrations
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
      await sqlClient`INSERT INTO __tappzio_migrations (name) VALUES (${file}) ON CONFLICT DO NOTHING`;
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
