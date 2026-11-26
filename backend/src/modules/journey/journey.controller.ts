import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { JourneyService, type UpdateJourneyDto } from './journey.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Purchase Journey')
@Controller('api/v1/journey')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class JourneyController {
  constructor(private journeyService: JourneyService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active customer purchase journey, entitlements, profiles, and designs' })
  async getActiveJourney(@CurrentActor() actor: ActorContext) {
    return this.journeyService.getContext(actor);
  }

  @Put('active')
  @ApiOperation({ summary: 'Persist and update active customer purchase journey state' })
  async updateActiveJourney(
    @CurrentActor() actor: ActorContext,
    @Body() body: UpdateJourneyDto,
  ) {
    return this.journeyService.upsertActiveJourney(actor, body);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Start a fresh purchase journey without affecting existing orders or profiles' })
  async resetJourney(
    @CurrentActor() actor: ActorContext,
    @Body() body?: UpdateJourneyDto,
  ) {
    return this.journeyService.resetJourney(actor, body);
  }
}
