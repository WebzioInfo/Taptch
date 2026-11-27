import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UploadsController],
  providers: [UploadsService, CloudinaryStorageService],
  exports: [UploadsService, CloudinaryStorageService],
})
export class UploadsModule {}

