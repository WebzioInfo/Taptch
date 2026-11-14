import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import type { ActorContext } from '../../common/types';

@ApiTags('Uploads')
@Controller('api/v1/uploads')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private uploadsService: UploadsService) { }

  @Post('signature')
  @ApiOperation({ summary: 'Generate signed Cloudinary direct upload token' })
  async getUploadSignature(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.generateSignature(actor, body?.assetType || 'image');
  }

  @Post('record')
  @ApiOperation({ summary: 'Record uploaded asset metadata' })
  async recordAsset(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.recordAsset(actor, body);
  }

  @Post()
  @ApiOperation({ summary: 'Multipart upload fallback endpoint' })
  async uploadFallback(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.recordAsset(actor, {
      url: body?.url || '/branding/cards/default-card-preview.png',
      originalName: body?.filename || 'uploaded-file.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List customer uploaded assets' })
  async getMyUploads(@CurrentActor() actor: ActorContext) {
    return this.uploadsService.findAllForActor(actor);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete uploaded asset' })
  async deleteUpload(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.uploadsService.delete(actor, id);
  }
}
