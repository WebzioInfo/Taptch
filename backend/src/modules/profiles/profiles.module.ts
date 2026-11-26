import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { LeadsModule } from '../leads/leads.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [LeadsModule, EntitlementsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

