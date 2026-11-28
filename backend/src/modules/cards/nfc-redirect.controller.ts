import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CardsService } from './cards.service';
import { getPublicBaseUrl } from './card-serializer';
import { Request, Response } from 'express';

@ApiTags('NFC Redirect')
@Controller()
export class NfcRedirectController {
  constructor(private cardsService: CardsService) { }

  private extractScanMeta(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    const userAgent = String(req.headers['user-agent'] || '');
    const country =
      (req.headers['cf-ipcountry'] as string) ||
      (req.headers['x-vercel-ip-country'] as string) ||
      (req.headers['x-country'] as string) ||
      null;
    const city =
      (req.headers['x-vercel-ip-city'] as string) ||
      (req.headers['cf-ipcity'] as string) ||
      null;
    return { rawIp, userAgent, country, city };
  }

  @Public()
  @Get('nfc/:token')
  @ApiOperation({ summary: 'Public permanent NFC card tap redirect' })
  async handleNfcTap(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    const resolved = await this.cardsService.resolvePublicNfcToken(
      token,
      undefined,
      this.extractScanMeta(req),
    );
    const frontendUrl = getPublicBaseUrl();

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
    @Req() req: Request,
    @Query('type') type?: 'business' | 'personal',
  ) {
    const expectedType = type === 'business' || type === 'personal' ? type : undefined;
    return this.cardsService.resolvePublicNfcToken(token, expectedType, this.extractScanMeta(req));
  }
}
