import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { NfcRedirectController } from './nfc-redirect.controller';
import { CardsService } from './cards.service';

@Module({
  controllers: [CardsController, NfcRedirectController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}

