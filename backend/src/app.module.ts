import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { QrModule } from './modules/qr/qr.module';
import { CardsModule } from './modules/cards/cards.module';
import { LeadsModule } from './modules/leads/leads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { AdminModule } from './modules/admin/admin.module';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('api'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_DIRECT: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  USE_IN_MEMORY_REDIS: z.string().default('true'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`[CONFIG ERROR] Invalid environment variables: ${JSON.stringify(parsed.error.format())}`);
  }
  return parsed.data;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['backend/.env', '.env.local', '.env'],
      validate: validateEnv,
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    QrModule,
    CardsModule,
    LeadsModule,
    OrdersModule,
    TemplatesModule,
    EntitlementsModule,
    AdminModule,
  ],
})
export class AppModule {}
