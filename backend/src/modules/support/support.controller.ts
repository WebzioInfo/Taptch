import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { SupportService } from './support.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Support Staff Operations')
@Controller('api/v1/support')
@UseGuards(AuthGuard, RolesGuard)
@Roles('support_admin', 'super_admin', 'admin')
@ApiBearerAuth()
export class SupportController {
  constructor(private supportService: SupportService) {}

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
    return this.supportService.reviewProfile(id, body.action, body.reason, actor);
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'View operational audit history' })
  async getAuditTrail(@CurrentActor() actor: ActorContext) {
    return this.supportService.getAuditTrail(actor);
  }
}

