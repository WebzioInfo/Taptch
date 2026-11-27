import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CardsService } from './cards.service';
import { Response } from 'express';

@ApiTags('NFC Redirect')
@Controller()
export class NfcRedirectController {
  constructor(private cardsService: CardsService) {}

  @Public()
  @Get('nfc/:token')
  @ApiOperation({ summary: 'Public permanent NFC card tap redirect' })
  async handleNfcTap(@Param('token') token: string, @Res() res: Response) {
    const resolved = await this.cardsService.resolvePublicNfcToken(token);
    const frontendUrl = (process.env.FRONTEND_URL || 'https://taptch.com').replace(/\/+$/, '');

    if (resolved.status === 'active' && resolved.destinationUrl) {
      const target = resolved.destinationUrl.startsWith('/')
        ? `${frontendUrl}${resolved.destinationUrl}`
        : resolved.destinationUrl;
      return res.redirect(302, target);
    }

    return res.redirect(302, `${frontendUrl}/nfc/${encodeURIComponent(token)}?status=${resolved.status}`);
  }

  @Public()
  @Get('api/v1/nfc/:token/resolve')
  @ApiOperation({ summary: 'Resolve permanent NFC token destination without exposing private customer data' })
  async resolveNfcToken(
    @Param('token') token: string,
    @Query('type') type?: 'business' | 'personal',
  ) {
    const expectedType = type === 'business' || type === 'personal' ? type : undefined;
    return this.cardsService.resolvePublicNfcToken(token, expectedType);
  }
}
