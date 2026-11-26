import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { CardsService } from './cards.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Cards')
@Controller('api/v1/cards')
@UseGuards(AuthGuard)
export class CardsController {
  constructor(private cardsService: CardsService) { }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user physical NFC cards' })
  async getMyCards(@CurrentActor() actor: ActorContext) {
    return this.cardsService.findAllForActor(actor);
  }

  @Get('purchased')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user purchased NFC card allocations and profile assignment statuses' })
  async getPurchasedCards(@CurrentActor() actor: ActorContext) {
    return this.cardsService.findPurchasedCardsForActor(actor);
  }

  @Post('purchased/:id/attach-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach or change digital profile on a purchased NFC card allocation' })
  async attachProfileToPurchasedCard(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { profileId: string },
  ) {
    return this.cardsService.attachProfileToPurchasedCard(actor, id, body?.profileId);
  }

  @Post('purchased/:id/disconnect-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect digital profile from a purchased NFC card without deleting either' })
  async disconnectProfileFromPurchasedCard(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    return this.cardsService.disconnectProfileFromPurchasedCard(actor, id);
  }

  @Post('purchased/:id/destination')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach a Taptch profile or clear destination for a purchased NFC card' })
  async setPurchasedCardDestination(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body()
    body: {
      destinationType: 'profile' | 'none';
      profileId?: string;
    },
  ) {
    return this.cardsService.setPurchasedCardDestination(actor, id, body);
  }

  @Delete('purchased/:id/destination')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear destination configuration for a purchased NFC card' })
  async clearPurchasedCardDestination(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
  ) {
    return this.cardsService.setPurchasedCardDestination(actor, id, { destinationType: 'none' });
  }

  @Patch('purchased/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile assignment status for a purchased NFC card' })
  async updateAssignmentStatus(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { status: 'AWAITING_PROFILE' | 'PROFILE_SETUP_IN_PROGRESS' | 'PROFILE_ATTACHED' },
  ) {
    return this.cardsService.updateAssignmentStatus(actor, id, body?.status);
  }

  @Post(':id/link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link physical NFC card to a digital profile' })
  async linkCard(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body() body: { profileId: string },
  ) {
    return this.cardsService.linkCardToProfile(actor, id, body?.profileId);
  }
}
