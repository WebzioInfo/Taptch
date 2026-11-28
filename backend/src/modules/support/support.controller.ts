import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { parseWithZod } from '../../common/validation/zod-validate';
import { SupportService } from './support.service';
import type { ActorContext } from '../../common/types';

const reviewProfileSchema = z.object({
  action: z.enum(['approve', 'flag', 'suspend']),
  reason: z.string().trim().min(3, 'Audit reason must be at least 3 characters.').max(500),
});

@ApiTags('Support Staff Operations')
@Controller('api/v1/support')
@UseGuards(AuthGuard, RolesGuard)
@Roles('support_admin', 'super_admin', 'admin')
@ApiBearerAuth()
export class SupportController {
  constructor(private supportService: SupportService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Support dashboard operational metrics' })
  async getDashboard(@CurrentActor() actor: ActorContext) {
    return this.supportService.getDashboardStats(actor);
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and inspect customer accounts' })
  async searchUsers(
    @Query('q') query: string,
    @CurrentActor() actor: ActorContext,
  ) {
    return this.supportService.searchUsers(query, actor);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Audit published and reported profile content' })
  async getProfiles(@CurrentActor() actor: ActorContext) {
    return this.supportService.getProfilesForAudit(actor);
  }

  @Patch('profiles/:id/review')
  @ApiOperation({ summary: 'Moderate profile status with required audit rationale' })
  async reviewProfile(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'flag' | 'suspend'; reason: string },
    @CurrentActor() actor: ActorContext,
  ) {
    const validated = parseWithZod(reviewProfileSchema, body, 'Profile review');
    return this.supportService.reviewProfile(id, validated.action, validated.reason, actor);
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'View operational audit history' })
  async getAuditTrail(@CurrentActor() actor: ActorContext) {
    return this.supportService.getAuditTrail(actor);
  }
}

const createUserTicketSchema = z.object({
  subject: z.string().trim().min(3).max(255),
  category: z.enum(['general', 'order', 'card', 'billing', 'profile']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  message: z.string().trim().min(3).max(4000),
});

@ApiTags('User Support Tickets')
@Controller('api/v1/tickets')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserTicketsController {
  constructor(private supportService: SupportService) { }

  @Post()
  @ApiOperation({ summary: 'Create a customer support ticket' })
  async createTicket(@Body() body: any, @CurrentActor() actor: ActorContext) {
    const validated = parseWithZod(createUserTicketSchema, body, 'Create support ticket');
    return this.supportService.createUserTicket(
      actor,
      validated as { subject: string; message: string; category?: string; priority?: string },
    );
  }
}

@ApiTags('User Notifications')
@Controller('api/v1/notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserNotificationsController {
  constructor(private supportService: SupportService) { }

  @Get()
  @ApiOperation({ summary: 'List in-app notifications for the current user' })
  async list(@CurrentActor() actor: ActorContext) {
    return this.supportService.getNotificationsForActor(actor);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentActor() actor: ActorContext) {
    return this.supportService.markAllNotificationsRead(actor);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.supportService.markNotificationRead(actor, id);
  }
}

