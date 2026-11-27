import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadOptions {
  folder: string;
  publicId: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  private getCredentials() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || '';
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim() || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() || '';
    return { cloudName, apiKey, apiSecret };
  }

  isConfigured(): boolean {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();
    return Boolean(cloudName && apiKey && apiSecret);
  }

  private configureSdk() {
    const { cloudName, apiKey, apiSecret } = this.getCredentials();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary storage is not configured on the server.',
      );
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadDataUrl(
    dataUrl: string,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    this.configureSdk();

    const maxWidth = options.maxWidth ?? 1600;
    const maxHeight = options.maxHeight ?? 1600;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: options.folder,
      public_id: options.publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
      transformation: [
        { width: maxWidth, height: maxHeight, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    const secureUrl = result.secure_url || result.url;
    if (!secureUrl || !secureUrl.startsWith('https://')) {
      throw new ServiceUnavailableException('Cloudinary did not return a secure HTTPS URL.');
    }

    return {
      secureUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  async uploadBuffer(
    buffer: Buffer,
    mimeType: string,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return this.uploadDataUrl(dataUrl, options);
  }

  async deleteByPublicId(publicId: string): Promise<boolean> {
    if (!publicId || !this.isConfigured()) {
      return false;
    }

    try {
      this.configureSdk();
      const res = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image',
      });
      return res?.result === 'ok' || res?.result === 'not found';
    } catch (err) {
      this.logger.warn(
        `[CloudinaryStorageService] Best-effort delete failed for "${publicId}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  extractPublicIdFromUrl(rawUrl?: string | null): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    try {
      const parsed = new URL(rawUrl.trim());
      if (!parsed.hostname.endsWith('cloudinary.com')) return null;
      const marker = '/image/upload/';
      const idx = parsed.pathname.indexOf(marker);
      if (idx === -1) return null;
      let rest = parsed.pathname.slice(idx + marker.length);
      const parts = rest.split('/').filter(Boolean);
      // Skip optional transformation segments before version (v123456) or folder (taptch/...)
      const taptchIdx = parts.findIndex((p) => p === 'taptch');
      if (taptchIdx !== -1) {
        rest = parts.slice(taptchIdx).join('/');
      } else {
        const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
        rest = (versionIdx !== -1 ? parts.slice(versionIdx + 1) : parts).join('/');
      }
      // Strip file extension
      const dotIdx = rest.lastIndexOf('.');
      return dotIdx !== -1 ? rest.slice(0, dotIdx) : rest;
    } catch {
      return null;
    }
  }
}
