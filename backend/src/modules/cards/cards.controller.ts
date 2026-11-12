import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { CardsService } from './cards.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Cards')
@Controller('api/v1/cards')
@UseGuards(AuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user physical NFC cards' })
  async getMyCards(@CurrentActor() actor: ActorContext) {
    return this.cardsService.findAllForActor(actor);
  }

  @Post(':id/link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link NFC card to a digital profile' })
  async linkCard(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { profileId: string },
  ) {
    return this.cardsService.linkCardToProfile(actor, id, body?.profileId);
  }
}

