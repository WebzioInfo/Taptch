import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
