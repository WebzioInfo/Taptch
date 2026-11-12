import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { QrService } from './qr.service';
import type { ActorContext } from '@taptch/shared';

@ApiTags('Dynamic QR')
@Controller('api/v1/qr')
@UseGuards(AuthGuard)
export class QrController {
  constructor(private qrService: QrService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user dynamic QR codes' })
  async getMyCodes(@CurrentActor() actor: ActorContext) {
    return this.qrService.findAllForActor(actor);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new dynamic QR code' })
  async createDynamicQr(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.qrService.createDynamicQr(actor, body);
  }
}

