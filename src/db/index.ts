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
  memberRole?: string | null;
  permissions?: string[] | null;
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

  const isPlaceholderPassword =
    Boolean((process.env.DATABASE_URL && process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) ||
    (process.env.DATABASE_URL_DIRECT && process.env.DATABASE_URL_DIRECT.includes('[YOUR-PASSWORD]')));

  const isTestOrPglite =
    isPlaceholderPassword ||
    process.env.USE_PGLITE_DEV === 'true' ||
    process.env.NODE_ENV === 'test' ||
    (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DIRECT);

  if (isTestOrPglite) {
    if (isPlaceholderPassword && process.env.NODE_ENV !== 'test') {
      console.warn(
        '\nℹ️ [DATABASE NOTICE] Detected "[YOUR-PASSWORD]" placeholder in DATABASE_URL.\n' +
        'Using embedded database for local execution. Replace [YOUR-PASSWORD] in .env.local with your Supabase database password to connect to live Supabase.\n'
      );
    }
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
    'postgres://taptch_app:taptch_app_pass@localhost:6432/taptch_db?sslmode=disable';

  if (!rawPostgresClient) {
    // Warn if IPv6-only direct Supabase endpoint is detected in connection string
    if (connectionString.includes('db.') && connectionString.includes('.supabase.co')) {
      console.warn(
        '\n⚠️ [DATABASE CONFIG WARNING] Detected direct Supabase host ("db.*.supabase.co").\n' +
        'Direct Supabase endpoints are IPv6-only. If running in an IPv4-only environment (such as Docker or VPS),\n' +
        'queries will fail with "getaddrinfo ENOTFOUND".\n' +
        'Please switch DATABASE_URL to the Supabase Connection Pooler host (aws-0-[region].pooler.supabase.com:6543).\n'
      );
    }

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
