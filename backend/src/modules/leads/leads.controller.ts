import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { LeadsService } from './leads.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Leads')
@Controller('api/v1/leads')
@UseGuards(AuthGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contacts/leads collected by user' })
  async getMyLeads(@CurrentActor() actor: ActorContext) {
    return this.leadsService.findAllForActor(actor);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit contact exchange on public profile' })
  async submitLead(@Body() body: any) {
    return this.leadsService.captureLead(body);
  }
}

