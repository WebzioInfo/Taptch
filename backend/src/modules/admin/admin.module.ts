import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminOperationsService } from './admin-operations.service';
import { ActivityLogService } from './activity-log.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminOperationsService, ActivityLogService, PermissionsGuard],
  exports: [AdminService, AdminOperationsService, ActivityLogService],
})
export class AdminModule { }

