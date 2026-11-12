import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import type { ActorContext, PlanTier } from '@taptch/shared';

@ApiTags('Admin / Portal-X')
@Controller('api/v1/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform summary metrics for Super Admin' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Review all physical card order requests' })
  async getOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch('orders/:id')
  @ApiOperation({ summary: 'Update order status and manual payment status' })
  async updateOrder(
    @Param('id') id: string,
    @Body() body: { status: string; paymentStatus?: string },
  ) {
    return this.adminService.updateOrderStatus(id, body.status, body.paymentStatus);
  }

  @Post('subscriptions/assign')
  @ApiOperation({ summary: 'Manually assign plan tier to user' })
  async assignSubscription(
    @CurrentActor() actor: ActorContext,
    @Body() body: { userId: string; planTier: PlanTier },
  ) {
    return this.adminService.assignSubscription(body.userId, body.planTier, actor);
  }
}

