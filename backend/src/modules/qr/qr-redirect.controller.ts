import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { QrService } from './qr.service';
import { Request, Response } from 'express';

@ApiTags('QR Redirect')
@Controller()
export class QrRedirectController {
  constructor(private qrService: QrService) {}

  @Public()
  @Get('dq/:token')
  @ApiOperation({ summary: 'High-speed Dynamic QR resolution and 302 redirect' })
  async handleDynamicRedirect(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const target = await this.qrService.resolveToken(token, ip, userAgent);
    return res.redirect(302, target.destinationUrl);
  }

  @Public()
  @Get('api/qr/dynamic/:token/resolve')
  @ApiOperation({ summary: 'API token resolution without redirect' })
  async resolveApiToken(
    @Param('token') token: string,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.qrService.resolveToken(token, ip, userAgent);
  }
}

