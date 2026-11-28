import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import {
  PermissionsGuard,
  RequirePermissions,
  RoleOnlyAccess,
} from '../../common/guards/permissions.guard';
import {
  ADMIN_ROLES,
  ALL_PERMISSIONS,
  ROLE_PERMISSION_MATRIX,
  getPermissionsForRole,
} from '../../common/rbac/permissions';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { parseWithZod } from '../../common/validation/zod-validate';
import { AdminService } from './admin.service';
import { AdminOperationsService } from './admin-operations.service';
import { ActivityLogService } from './activity-log.service';
import type { ActorContext, PlanTier } from '../../common/types';

const recordExpenseSchema = z.object({
  category: z.enum(['infrastructure', 'shipping', 'packaging', 'cogs', 'marketing', 'operations']),
  title: z.string().trim().min(2).max(255),
  amount: z.coerce.number().positive(),
  notes: z.string().max(1000).optional(),
  receiptUrl: z.string().max(1000).optional(),
});

const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'deactivated']),
});

const updateOrderLegacySchema = z
  .object({
    status: z.enum([
      'ORDER_PLACED',
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
      'DESIGN_REVIEW',
      'CARD_PRODUCTION',
      'CARD_READY',
      'DISPATCHED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'shipped',
    ]),
  })
  .strict();

const updateOrderFulfillmentSchema = z.object({
  orderStatus: z
    .enum([
      'ORDER_PLACED',
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
      'DESIGN_REVIEW',
      'CARD_PRODUCTION',
      'CARD_READY',
      'DISPATCHED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ])
    .optional(),
  courierName: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
  trackingUrl: z
    .string()
    .max(500)
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Tracking URL must be a valid http:// or https:// URL.' },
    )
    .optional(),
  internalNotes: z.string().max(2000).optional(),
  title: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

const updateProfileAssistanceSchema = z.object({
  profileAssistanceStatus: z.enum([
    'NOT_REQUIRED',
    'REQUESTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
  ]),
  profileAssistanceNotes: z.string().max(2000).optional(),
});

const updateOrderPaymentSchema = z.object({
  paymentStatus: z.enum([
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
    'WAIVED',
    'COD_PENDING',
    'COD_COLLECTED',
  ]),
  paymentReference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

const assignSubscriptionSchema = z.object({
  userId: z.string().trim().min(1),
  planTier: z.enum(['nano', 'micro', 'mini', 'max']),
});

const updateAdminRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'support_admin', 'staff', 'user']),
});

const updateProfileStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT', 'SUSPENDED']),
});

@ApiTags('Admin / Portal-X')
@Controller('api/v1/admin')
@UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
@Roles('super_admin', 'admin', 'support_admin', 'staff')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private activityLogService: ActivityLogService,
    @Optional() private opsService?: AdminOperationsService,
  ) { }

  @Get('rbac/me')
  @RoleOnlyAccess()
  @ApiOperation({ summary: 'Get current admin/staff role and resolved permissions' })
  async getMyRbac(@CurrentActor() actor: ActorContext) {
    return {
      role: actor.role,
      permissions: getPermissionsForRole(actor.role),
    };
  }

  @Get('rbac/matrix')
  @Roles('super_admin', 'admin')
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Get platform roles and granular permission matrix' })
  async getRbacMatrix() {
    return {
      roles: ADMIN_ROLES,
      permissions: ALL_PERMISSIONS,
      matrix: ROLE_PERMISSION_MATRIX,
    };
  }

  @Get('activity-logs')
  @RequirePermissions('activity_logs.view')
  @ApiOperation({ summary: 'Query immutable administrative activity logs' })
  async getActivityLogs(
    @Query('q') q?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.activityLogService.queryLogs({
      q,
      action,
      resourceType,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('admins')
  @RequirePermissions('staff.view')
  @ApiOperation({ summary: 'List administrator and staff accounts with permissions' })
  async getAdmins() {
    return this.adminService.getAdminAccounts();
  }

  @Patch('admins/:id/role')
  @RequirePermissions('staff.manage')
  @ApiOperation({ summary: 'Update administrator or staff role' })
  async updateAdminRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(updateAdminRoleSchema, body, 'Admin role update');
    return this.adminService.updateAdminRole(id, validated.role, actor);
  }

  @Get('stats')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Platform summary metrics for Admin Dashboard' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('dashboard')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Phase 2 Admin Dashboard overview with aggregate metrics and recent activity' })
  async getDashboard(@CurrentActor() actor: ActorContext) {
    return this.adminService.getDashboardOverview(actor);
  }

  @Get('finance')
  @RequirePermissions('finance.view')
  @ApiOperation({ summary: 'Full Platform Financial Management & P&L Analysis' })
  async getFinance() {
    return this.adminService.getFinancialSummary();
  }

  @Post('finance/expenses')
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Record an operating or manufacturing expense' })
  async recordExpense(
    @CurrentActor() actor: ActorContext,
    @Body() body: { category: string; title: string; amount: number; notes?: string; receiptUrl?: string },
  ) {
    const validated = parseWithZod(recordExpenseSchema, body, 'Expense');
    return this.adminService.recordExpense(validated as typeof body, actor);
  }

  @Get('users')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Search and inspect all registered accounts' })
  async getUsers(
    @Query('q') query?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAllUsers(query, role, status, {
      fromDate,
      toDate,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('users/:id')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Get user details, associated profiles, and account activity' })
  async getUserById(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch('users/:id/status')
  @RequirePermissions('users.suspend')
  @ApiOperation({ summary: 'Suspend or reactivate user account' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: string,
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(updateUserStatusSchema, { status }, 'User status');
    return this.adminService.updateUserStatus(userId, validated.status, actor);
  }

  @Patch('users/:id/role')
  @Roles('super_admin')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Change user system role (super_admin only)' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() body: { role: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(updateAdminRoleSchema, body, 'User role update');
    return this.adminService.updateAdminRole(userId, validated.role, actor);
  }

  @Get('orders')
  @RequirePermissions('orders.view')
  @ApiOperation({ summary: 'Review all physical card order requests with search and filters' })
  async getOrders(
    @Query('q') q?: string,
    @Query('orderStatus') orderStatus?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('profileAssistanceStatus') profileAssistanceStatus?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAllOrders({
      q,
      orderStatus,
      paymentStatus,
      paymentMethod,
      profileAssistanceStatus,
      fromDate,
      toDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('orders/:id')
  @RequirePermissions('orders.view')
  @ApiOperation({ summary: 'Get full order details, snapshot, and tracking history for admin' })
  async getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id')
  @RequirePermissions('orders.manage')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrder(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(updateOrderLegacySchema, body, 'Order update');
    return this.adminService.updateOrderStatus(id, validated.status, actor);
  }

  @Patch('orders/:id/fulfillment')
  @RequirePermissions('orders.manage')
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
    const validated = parseWithZod(updateOrderFulfillmentSchema, body, 'Order fulfillment');
    return this.adminService.updateOrderFulfillment(id, validated, actor);
  }

  @Patch('orders/:id/profile-assistance')
  @RequirePermissions('orders.manage')
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
    const validated = parseWithZod(updateProfileAssistanceSchema, body, 'Profile assistance');
    return this.adminService.updateOrderProfileAssistance(id, validated as typeof body, actor);
  }

  @Patch('orders/:id/payment')
  @RequirePermissions('finance.manage')
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
    const validated = parseWithZod(updateOrderPaymentSchema, body, 'Order payment');
    return this.adminService.updateOrderPayment(id, validated as any, actor);
  }

  @Post('subscriptions/assign')
  @RequirePermissions('users.edit')
  @ApiOperation({ summary: 'Manually assign plan tier to user' })
  async assignSubscription(
    @CurrentActor() actor: ActorContext,
    @Body() body: { userId: string; planTier: PlanTier },
  ) {
    const validated = parseWithZod(assignSubscriptionSchema, body, 'Subscription assignment');
    return this.adminService.assignSubscription(validated.userId, validated.planTier, actor);
  }

  @Get('profiles')
  @RequirePermissions('profiles.view')
  @ApiOperation({ summary: 'Search and paginate all digital profiles' })
  async getProfiles(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('template') template?: string,
    @Query('plan') plan?: string,
    @Query('hasCard') hasCard?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAllProfiles({
      q,
      status,
      type,
      template,
      plan,
      hasCard,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('profiles/:id')
  @RequirePermissions('profiles.view')
  @ApiOperation({ summary: 'Get full profile details, owner info, ventures, and associated NFC cards' })
  async getProfileById(@Param('id') id: string) {
    return this.adminService.getProfileDetails(id);
  }

  @Patch('profiles/:id/status')
  @RequirePermissions('profiles.edit')
  @ApiOperation({ summary: 'Publish, unpublish, or suspend a digital profile' })
  async updateProfileStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PUBLISHED' | 'DRAFT' | 'SUSPENDED' },
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(updateProfileStatusSchema, body, 'Profile status');
    return this.adminService.updateProfileStatus(id, validated.status as any, actor);
  }

  @Get('cards')
  @RequirePermissions('cards.view')
  @ApiOperation({ summary: 'List NFC cards with search, filters, and pagination' })
  async getCards(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('assigned') assigned?: string,
    @Query('orderId') orderId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAllCards({
      q,
      status,
      productId,
      assigned,
      orderId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('cards/issue-context/:userId')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Get customer active orders and profiles for Issue NFC Card modal' })
  async getIssueCardContext(@Param('userId') userId: string) {
    return this.adminService.getIssueCardContext(userId);
  }

  @Post('cards/register')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Issue one or more NFC cards to a customer' })
  async registerCard(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const schema = z.object({
      userId: z.string().min(1, 'Customer is required.'),
      productId: z.string().min(1, 'Product is required.'),
      quantity: z.coerce.number().int().min(1).max(50).default(1),
      orderId: z.string().nullable().optional(),
      profileId: z.string().nullable().optional(),
      note: z.string().max(500).nullable().optional(),
    });
    const validated = parseWithZod(schema, body, 'Issue NFC card');
    return this.adminService.registerCard(validated as any, actor);
  }

  @Post('cards/bulk-register')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Bulk issue NFC cards to a customer from CSV rows' })
  async bulkRegisterCards(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const schema = z.object({
      userId: z.string().min(1, 'Customer is required.'),
      productId: z.string().min(1, 'Product is required.'),
      orderId: z.string().nullable().optional(),
      note: z.string().max(500).nullable().optional(),
      rows: z
        .array(
          z.object({
            profileUsername: z.string().max(128).optional(),
          }),
        )
        .min(1, 'At least one row is required.')
        .max(50),
    });
    const validated = parseWithZod(schema, body, 'Bulk issue NFC cards');
    return this.adminService.bulkRegisterCards(validated as any, actor);
  }

  @Get('cards/:id/assignable-profiles')
  @RequirePermissions('cards.view')
  @ApiOperation({ summary: 'List profiles belonging strictly to the card owner' })
  async getAssignableProfiles(
    @Param('id') id: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAssignableProfilesForCard(id, search);
  }

  @Get('cards/:id')
  @RequirePermissions('cards.view')
  @ApiOperation({ summary: 'Get NFC card details and recent tap history' })
  async getCardDetails(@Param('id') id: string) {
    return this.adminService.getCardDetails(id);
  }

  @Patch('cards/:id')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Update NFC card owner, assignment, or status' })
  async updateCard(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({
      userId: z.string().nullable().optional(),
      profileId: z.string().nullable().optional(),
      status: z.enum(['UNASSIGNED', 'ASSIGNED', 'ACTIVE', 'SUSPENDED', 'LOST']).optional(),
      statusReason: z.string().max(1000).nullable().optional(),
    });
    const validated = parseWithZod(schema, body, 'Update card');
    return this.adminService.updateCardAdmin(id, validated as any, actor);
  }

  @Post('cards/:id/regenerate-url')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Regenerate NFC card short code and URL' })
  async regenerateCardUrl(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.adminService.regenerateCardUrl(id, actor);
  }

  @Get('products')
  @RequirePermissions('products.view')
  @ApiOperation({ summary: 'List physical NFC products with search, filter, and sort' })
  async getProducts(
    @Query('q') q?: string,
    @Query('material') material?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getAllProductsAdmin({ q, material, sort });
  }

  @Post('products')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: 'Create a new NFC card product' })
  async createProduct(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const schema = z.object({
      name: z.string().trim().min(2).max(128),
      material: z.enum(['pvc', 'metal']),
      finish: z.string().max(64).optional(),
      colorName: z.string().trim().min(1).max(64),
      color: z.string().trim().min(1).max(32),
      basePrice: z.coerce.number().positive(),
      description: z.string().trim().min(2).max(2000),
      imageUrl: z.string().max(1000).optional(),
      stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK']).optional(),
      isActive: z.boolean().optional(),
    });
    const validated = parseWithZod(schema, body, 'Create product');
    return this.adminService.createProductAdmin(validated as any, actor);
  }

  @Patch('products/:id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: 'Update an NFC card product' })
  async updateProduct(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({
      name: z.string().trim().min(2).max(128).optional(),
      material: z.enum(['pvc', 'metal']).optional(),
      finish: z.string().max(64).optional(),
      colorName: z.string().trim().min(1).max(64).optional(),
      color: z.string().trim().min(1).max(32).optional(),
      basePrice: z.coerce.number().positive().optional(),
      description: z.string().trim().min(2).max(2000).optional(),
      imageUrl: z.string().max(1000).nullable().optional(),
      stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK']).optional(),
      isActive: z.boolean().optional(),
    });
    const validated = parseWithZod(schema, body, 'Update product');
    return this.adminService.updateProductAdmin(id, validated as any, actor);
  }

  @Delete('products/:id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: 'Delete an NFC card product' })
  async deleteProduct(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.adminService.deleteProductAdmin(id, actor);
  }

  @Get('payments')
  @RequirePermissions('finance.view')
  @ApiOperation({ summary: 'List payment records with simulated-transaction flags' })
  async getPayments(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getAllPaymentsAdmin({
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('analytics')
  @RequirePermissions('finance.view')
  @ApiOperation({ summary: 'Platform sales & analytics excluding simulated test payments' })
  async getAnalytics() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('settings')
  @Roles('super_admin')
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'View platform configuration status' })
  async getSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Patch('settings')
  @Roles('super_admin')
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Update platform configuration (super_admin only)' })
  async updateSettings(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const settingsSchema = z.object({
      brandName: z.string().trim().min(1).max(128).optional(),
      brandTagline: z.string().trim().max(500).optional(),
      contactEmail: z.string().email().optional(),
      customDomainCname: z.string().trim().max(255).optional(),
      featuresEnabled: z
        .object({
          enablePublicRegistration: z.boolean(),
          enableGoogleAuth: z.boolean(),
          enablePhoneOtp: z.boolean(),
          enableWalletPasses: z.boolean(),
          enableCustomDomains: z.boolean(),
        })
        .optional(),
    });
    const validated = parseWithZod(settingsSchema, body, 'Settings update');
    return this.adminService.updatePlatformSettings(validated as any, actor);
  }

  @Get('overview')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Admin overview stats: users, orders, cards, revenue' })
  async getOverview() {
    return this.adminService.getOverviewStats();
  }

  @Get('batches')
  @RequirePermissions('cards.view')
  @ApiOperation({ summary: 'List NFC card batches with search and pagination' })
  async getBatches(
    @Query('q') q?: string,
    @Query('material') material?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getBatches({
      q,
      material,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Post('batches')
  @RequirePermissions('cards.manage')
  @ApiOperation({ summary: 'Create a new NFC card batch' })
  async createBatch(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const schema = z.object({
      batchCode: z.string().trim().min(3).max(64),
      quantity: z.coerce.number().int().min(1).max(10000),
      material: z.enum(['pvc', 'metal', 'wood']),
      chipType: z.enum(['ntag213', 'ntag215', 'ntag216']),
    });
    const validated = parseWithZod(schema, body, 'Card batch');
    return this.adminService.createBatch(validated as any, actor);
  }

  @Get('plans')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'List plans, entitlements, and tenant subscriptions' })
  async getPlansAndSubscriptions(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getPlansAndSubscriptions({
      q,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get('templates')
  @RequirePermissions('products.view')
  @ApiOperation({ summary: 'List card design templates' })
  async getTemplates(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getTemplates({
      q,
      category,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Patch('templates/:id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: 'Update template visibility or metadata' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({
      isGlobal: z.boolean().optional(),
      name: z.string().trim().min(1).max(128).optional(),
      category: z.string().trim().min(1).max(64).optional(),
    });
    const validated = parseWithZod(schema, body, 'Template update');
    return this.adminService.updateTemplate(id, validated, actor);
  }

  @Get('tickets')
  @RequirePermissions('tickets.view')
  @ApiOperation({ summary: 'List support tickets with search, filters, and pagination' })
  async getTickets(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getTickets({
      q,
      status,
      priority,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Post('tickets')
  @RequirePermissions('tickets.manage')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const schema = z.object({
      subject: z.string().trim().min(3).max(255),
      category: z.enum(['general', 'order', 'card', 'billing', 'profile']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      message: z.string().trim().min(2).max(4000),
      userId: z.string().optional(),
    });
    const validated = parseWithZod(schema, body, 'Support ticket');
    return this.adminService.createTicket(validated as any, actor);
  }

  @Get('tickets/:id')
  @RequirePermissions('tickets.view')
  @ApiOperation({ summary: 'Get support ticket details and messages' })
  async getTicketById(@Param('id') id: string) {
    return this.adminService.getTicketById(id);
  }

  @Post('tickets/:id/reply')
  @RequirePermissions('tickets.manage')
  @ApiOperation({ summary: 'Reply to a support ticket' })
  async replyToTicket(
    @Param('id') id: string,
    @Body() body: { message: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({ message: z.string().trim().min(1).max(4000) });
    const validated = parseWithZod(schema, body, 'Ticket reply');
    return this.adminService.replyToTicket(id, validated.message, actor);
  }

  @Patch('tickets/:id/status')
  @RequirePermissions('tickets.manage')
  @ApiOperation({ summary: 'Update support ticket status' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() body: { status: 'open' | 'in_progress' | 'resolved' | 'closed' },
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) });
    const validated = parseWithZod(schema, body, 'Ticket status');
    return this.adminService.updateTicketStatus(id, validated.status, actor);
  }

  // --- Phase 4: NFC & Inventory Lifecycle ---
  @Get('nfc-lifecycle')
  @RequirePermissions('cards.view')
  async getNfcLifecycle(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.opsService!.getNfcLifecycleCards({
      q,
      status,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Patch('nfc-lifecycle/:id')
  @RequirePermissions('cards.manage')
  async updateNfcLifecycle(
    @Param('id') id: string,
    @Body() body: { action: 'activate' | 'damage' | 'revoke' | 'replace'; reason: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({
      action: z.enum(['activate', 'damage', 'revoke', 'replace']),
      reason: z.string().trim().min(2).max(500),
    });
    const validated = parseWithZod(schema, body, 'NFC card lifecycle');
    return this.opsService!.updateNfcCardLifecycle(id, validated as any, actor);
  }

  @Get('inventory')
  @RequirePermissions('inventory.view')
  async getInventory() {
    return this.opsService!.getInventoryOverview();
  }

  @Post('inventory/movements')
  @RequirePermissions('inventory.manage')
  async recordInventoryMovement(
    @Body()
    body: {
      material: string;
      sku?: string;
      movementType: 'RECEIPT' | 'ADJUSTMENT' | 'DAMAGED' | 'LOST';
      quantityDelta: number;
      reason: string;
      idempotencyKey?: string;
    },
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({
      material: z.string().trim().min(1).max(32),
      sku: z.string().trim().max(64).optional(),
      movementType: z.enum(['RECEIPT', 'ADJUSTMENT', 'DAMAGED', 'LOST']),
      quantityDelta: z.coerce.number().int(),
      reason: z.string().trim().min(2).max(500),
      idempotencyKey: z.string().trim().max(128).optional(),
    });
    const validated = parseWithZod(schema, body, 'Inventory movement');
    return this.opsService!.recordInventoryMovement(validated as any, actor);
  }

  // --- Phase 4: Reports & Export ---
  @Get('reports/:type')
  @RequirePermissions('reports.view')
  async getReport(
    @Param('type') type: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('includeSimulated') includeSimulated?: string,
  ) {
    return this.opsService!.generateReport(type, {
      fromDate,
      toDate,
      status,
      includeSimulated: includeSimulated === 'true',
    });
  }

  @Get('reports/:type/export')
  @RequirePermissions('reports.export')
  async exportReport(
    @Param('type') type: string,
    @Query('format') format?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('includeSimulated') includeSimulated?: string,
  ) {
    const report = await this.opsService!.generateReport(type, {
      fromDate,
      toDate,
      status,
      includeSimulated: includeSimulated === 'true',
    });
    const csv = this.opsService!.buildCsvExport(report.rows as Record<string, unknown>[]);
    return {
      format: format === 'xlsx' ? 'xlsx' : 'csv',
      filename: `taptch-${type}-report.${format === 'xlsx' ? 'xlsx' : 'csv'}`,
      content: csv,
      summary: report.summary,
    };
  }

  // --- Phase 4: Smart Alerts & Notifications ---
  @Get('alerts')
  @RequirePermissions('notifications.view')
  async getAlerts(@Query('status') status?: string, @Query('severity') severity?: string) {
    return this.opsService!.evaluateAndListAlerts({ status, severity });
  }

  @Patch('alerts/:id')
  @RequirePermissions('notifications.manage')
  async updateAlert(
    @Param('id') id: string,
    @Body() body: { action: 'read' | 'resolve' | 'dismiss' },
    @CurrentActor() actor: ActorContext,
  ) {
    const schema = z.object({ action: z.enum(['read', 'resolve', 'dismiss']) });
    const validated = parseWithZod(schema, body, 'Alert update');
    return this.opsService!.updateAlertStatus(id, validated.action, actor);
  }

  // --- Phase 4: Admin Security Controls ---
  @Get('security/login-history')
  @RequirePermissions('security.login_history.view')
  async getLoginHistory(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.opsService!.getLoginHistory({
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 25,
    });
  }

  @Get('security/sessions')
  @RequirePermissions('security.sessions.view')
  async getActiveSessions(@Query('userId') userId?: string) {
    return this.opsService!.getActiveSessions(userId);
  }

  @Delete('security/sessions/:id')
  @RequirePermissions('security.sessions.manage')
  async revokeSession(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.opsService!.revokeSession(id, actor);
  }
}

