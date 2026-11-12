import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrRedirectController } from './qr-redirect.controller';
import { QrService } from './qr.service';

@Module({
  controllers: [QrController, QrRedirectController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}

