import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import type { ActorContext, PlanTier } from '../../common/types';

@ApiTags('Admin / Portal-X')
@Controller('api/v1/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) { }

  @Get('stats')
  @ApiOperation({ summary: 'Platform summary metrics for Super Admin' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('finance')
  @ApiOperation({ summary: 'Full Platform Financial Management & P&L Analysis' })
  async getFinance() {
    return this.adminService.getFinancialSummary();
  }

  @Post('finance/expenses')
  @ApiOperation({ summary: 'Record an operating or manufacturing expense' })
  async recordExpense(
    @CurrentActor() actor: ActorContext,
    @Body() body: { category: string; title: string; amount: number; notes?: string; receiptUrl?: string },
  ) {
    return this.adminService.recordExpense(body, actor);
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and inspect all registered accounts' })
  async getUsers(
    @Query('q') query?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers(query, role, status);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Suspend or reactivate user account' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: string,
    @CurrentActor() actor: ActorContext,
  ) {
    return this.adminService.updateUserStatus(userId, status, actor);
  }

  @Get('orders')
    @ApiOperation({ summary: 'Review all physical card order requests with search and filters' })
    async getOrders(
      @Query('q') q ?: string,
      @Query('orderStatus') orderStatus ?: string,
      @Query('paymentStatus') paymentStatus ?: string,
      @Query('paymentMethod') paymentMethod ?: string,
      @Query('profileAssistanceStatus') profileAssistanceStatus ?: string,
    ) {
      return this.adminService.getAllOrders({
        q,
        orderStatus,
        paymentStatus,
        paymentMethod,
        profileAssistanceStatus,
      });
    }

    @Get('orders/:id')
    @ApiOperation({ summary: 'Get full order details, snapshot, and tracking history for admin' })
    async getOrderById(@Param('id') id: string) {
      return this.adminService.getOrderById(id);
    }

    @Patch('orders/:id')
    @ApiOperation({ summary: 'Update order status and manual payment status' })
    async updateOrder(
      @Param('id') id: string,
      @Body() body: { status: string; paymentStatus?: string },
    ) {
      return this.adminService.updateOrderStatus(id, body.status, body.paymentStatus);
    }

    @Patch('orders/:id/fulfillment')
    @ApiOperation({ summary: 'Update order fulfillment stage and courier tracking details' })
    async updateOrderFulfillment(
      @Param('id') id: string,
      @Body()
    body: {
      orderStatus?: string;
      courierName?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      internalNotes?: string;
      title?: string;
      description?: string;
    },
      @CurrentActor() actor: ActorContext,
    ) {
      return this.adminService.updateOrderFulfillment(id, body, actor);
    }

    @Patch('orders/:id/profile-assistance')
    @ApiOperation({ summary: 'Update customer digital profile assistance status and notes' })
    async updateOrderProfileAssistance(
      @Param('id') id: string,
      @Body()
    body: {
      profileAssistanceStatus: 'NOT_REQUIRED' | 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
      profileAssistanceNotes?: string;
    },
      @CurrentActor() actor: ActorContext,
    ) {
      return this.adminService.updateOrderProfileAssistance(id, body, actor);
    }

    @Patch('orders/:id/payment')
    @ApiOperation({ summary: 'Update payment status (e.g., mark Cash on Delivery collected)' })
    async updateOrderPayment(
      @Param('id') id: string,
      @Body()
    body: {
      paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'WAIVED' | 'COD_PENDING';
      paymentReference?: string;
      notes?: string;
    },
      @CurrentActor() actor: ActorContext,
    ) {
      return this.adminService.updateOrderPayment(id, body, actor);
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

