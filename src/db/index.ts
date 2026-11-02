import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

// Ensure environment variables are loaded for CLI scripts & standalone execution
if (fs.existsSync(path.resolve('.env.local'))) {
  dotenv.config({ path: path.resolve('.env.local') });
}
dotenv.config({ path: path.resolve('.env') });

export interface ActorContext {
  userId: string;
  orgId?: string | null;
  role: string;
  isAdmin?: boolean;
}

// Global cached client instance for HMR across dev reloads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;
let rawPostgresClient: ReturnType<typeof postgres> | null = null;
let pgliteInstance: PGlite | null = null;

export function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const isTestOrPglite =
    process.env.USE_PGLITE_DEV === 'true' ||
    process.env.NODE_ENV === 'test' ||
    (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DIRECT);

  if (isTestOrPglite) {
    if (!pgliteInstance) {
      const dataDir = process.env.PGLITE_DATA_DIR || path.resolve('.pgdata');
      pgliteInstance = new PGlite(dataDir);
    }
    dbInstance = drizzlePglite(pgliteInstance, { schema });
    return dbInstance;
  }

  // Production or Docker Compose PostgreSQL via PgBouncer
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_POOLED ||
    'postgres://tapzio_app:tapzio_app_pass@localhost:6432/tapzio_db?sslmode=disable';

  if (!rawPostgresClient) {
    // prepare: false is strictly MANDATORY behind PgBouncer transaction pooling
    rawPostgresClient = postgres(connectionString, {
      prepare: false,
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }

  dbInstance = drizzlePg(rawPostgresClient, { schema });
  return dbInstance;
}

export const db = getDatabase();

/**
 * Tenant-Scoped Data Access Layer Wrapper
 *
 * Mandate: In pooled connections, RLS session variables MUST be scoped to the
 * transaction using `SELECT set_config(name, value, is_local = true)`.
 */
export async function withActor<T>(
  actor: ActorContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: (tx: any) => Promise<T>
): Promise<T> {
  const database = getDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return database.transaction(async (tx: any) => {
    // Inject tenant session variables locally for this transaction only
    await tx.execute(
      sql`SELECT 
        set_config('app.current_user_id', ${actor.userId}, true),
        set_config('app.current_org_id', ${actor.orgId || ''}, true),
        set_config('app.current_role', ${actor.role}, true),
        set_config('app.is_admin', ${actor.isAdmin ? 'true' : 'false'}, true);`
    );

    return operation(tx);
  });
}
