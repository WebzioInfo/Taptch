import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { EntitlementsService } from './entitlements.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Entitlements')
@Controller('api/v1/entitlements')
@UseGuards(AuthGuard)
export class EntitlementsController {
  constructor(private entitlementsService: EntitlementsService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active plan limits and entitlements for user' })
  async getMyEntitlements(@CurrentActor() actor: ActorContext) {
    return this.entitlementsService.getActorEntitlements(actor);
  }
}

