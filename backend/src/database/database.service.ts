import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres = require('postgres');
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import type { ActorContext } from '../common/types';

export const DRIZZLE = 'DRIZZLE';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private rawClient: postgres.Sql;
  public db: PostgresJsDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    const connectionString =
      this.configService.get<string>('DATABASE_URL_DIRECT') ||
      this.configService.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('[DATABASE] Neither DATABASE_URL nor DATABASE_URL_DIRECT is configured.');
    }

    const isRemoteHost = connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com');
    const isSslRequired = isRemoteHost || connectionString.includes('sslmode=require');

    this.logger.log(`[DATABASE] Connecting to PostgreSQL (${connectionString.replace(/:[^:@]+@/, ':***@')})...`);

    this.rawClient = postgres(connectionString, {
      prepare: false, // Strictly required for PgBouncer / Supabase pooling safety
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: isSslRequired ? 'require' : undefined,
    });

    this.db = drizzle(this.rawClient, { schema });
  }

  /**
   * Tenant-Scoped Data Access Wrapper
   * In pooled connections, RLS session variables MUST be scoped to the transaction
   */
  async withActor<T>(actor: ActorContext, fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      if (actor?.userId) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${actor.userId}, true)`
        );
      }
      return fn(tx as unknown as PostgresJsDatabase<typeof schema>);
    });
  }

  async onModuleDestroy() {
    this.logger.log('[DATABASE] Closing PostgreSQL pool...');
    await this.rawClient.end();
  }
}
