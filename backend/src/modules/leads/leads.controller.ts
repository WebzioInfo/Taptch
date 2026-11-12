import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Leads')
@Controller('api/v1/leads')
@UseGuards(AuthGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contacts/leads collected by user' })
  async getMyLeads(
    @CurrentActor() actor: ActorContext,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('profileId') profileId?: string,
  ) {
    return this.leadsService.findAllForActor(actor, { status, search, profileId });
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead status metrics for current actor' })
  async getLeadStats(@CurrentActor() actor: ActorContext) {
    return this.leadsService.getStatsForActor(actor);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit contact exchange / message on public profile' })
  async submitLead(@Body() body: any) {
    return this.leadsService.captureLead(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status or internal notes' })
  async updateLead(
    @Param('id') id: string,
    @CurrentActor() actor: ActorContext,
    @Body() body: { status?: string; notes?: string },
  ) {
    return this.leadsService.updateLead(id, actor, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a lead record' })
  async deleteLead(@Param('id') id: string, @CurrentActor() actor: ActorContext) {
    return this.leadsService.deleteLead(id, actor);
  }
}

