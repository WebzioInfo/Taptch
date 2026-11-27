import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentActor } from '../../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';
import type { ActorContext } from '../../common/types';
import type { Response } from 'express';

@ApiTags('Uploads')
@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) { }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Serve uploaded public profile image' })
  async getUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.uploadsService.getLocalProfileImage(filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  }

  @Post('image')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile avatar or venture logo image' })
  async uploadProfileImage(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.uploadProfileImage(actor, body);
  }

  @Post('signature')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate signed Cloudinary direct upload token' })
  async getUploadSignature(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.generateSignature(actor, body?.assetType || 'image');
  }

  @Post('card-preview')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload card preview front/back images to Cloudinary' })
  async uploadCardPreview(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.uploadCardPreview(actor, body);
  }

  @Post('record')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record uploaded asset metadata' })
  async recordAsset(@CurrentActor() actor: ActorContext, @Body() body: any) {
    return this.uploadsService.recordAsset(actor, body);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Multipart upload fallback endpoint (uploads to Cloudinary)' })
  async uploadFallback(
    @CurrentActor() actor: ActorContext,
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    if (file) {
      return this.uploadsService.uploadMultipartFile(actor, file, body);
    }
    return this.uploadsService.recordAsset(actor, {
      url: body?.url,
      originalName: body?.filename || 'uploaded-file.png',
      mimeType: body?.mimeType || 'image/png',
      sizeBytes: body?.sizeBytes || 0,
    });
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List customer uploaded assets' })
  async getMyUploads(@CurrentActor() actor: ActorContext) {
    return this.uploadsService.findAllForActor(actor);
  }

  @Post('cleanup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Best-effort cleanup of replaced or removed Cloudinary asset' })
  async cleanupAsset(
    @CurrentActor() actor: ActorContext,
    @Body() body: { url?: string; publicId?: string },
  ) {
    return this.uploadsService.cleanupAsset(actor, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete uploaded asset' })
  async deleteUpload(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.uploadsService.delete(actor, id);
  }
}
