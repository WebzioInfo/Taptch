'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Video as VideoIcon,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export interface UploadedMediaItem {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

export interface BaseUploaderProps {
  label: string;
  description?: string;
  mediaCategory:
    | 'avatar'
    | 'cover'
    | 'logo'
    | 'business_cover'
    | 'gallery'
    | 'product'
    | 'service'
    | 'business_gallery'
    | 'video'
    | 'brochure';
  currentUrl?: string | null;
  onUploadSuccess: (item: UploadedMediaItem) => void;
  onRemove?: () => void;
  profileId?: string;
  businessId?: string;
  accept?: string;
}

/**
 * Universal Media Uploader supporting Cloudflare images, videos, and PDF documents.
 */
export function MediaUploader({
  label,
  description,
  mediaCategory,
  currentUrl,
  onUploadSuccess,
  onRemove,
  profileId,
  businessId,
  accept = 'image/*',
}: BaseUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setPreviewUrl(currentUrl || null);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaCategory', mediaCategory);
      if (profileId) formData.append('profileId', profileId);
      if (businessId) formData.append('businessId', businessId);

      const res = await fetch('/api/v1/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error(data.error?.message || 'Media upload failed.');
      }

      const item: UploadedMediaItem = data.data;
      setPreviewUrl(item.secureUrl);
      onUploadSuccess(item);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isVideo = mediaCategory === 'video';
  const isDocument = mediaCategory === 'brochure';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/90">{label}</label>
        {previewUrl && (
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Cloudflare Hosted
          </Badge>
        )}
      </div>

      {description && <p className="text-xs text-white/50">{description}</p>}

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Container */}
      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/5 p-2">
          {isVideo ? (
            <video src={previewUrl} controls className="w-full max-h-48 rounded-lg bg-black" />
          ) : isDocument ? (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#D4AF37]" />
                <div>
                  <div className="text-sm font-medium text-white">PDF Brochure</div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    View Document <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video max-h-48 rounded-lg overflow-hidden flex items-center justify-center bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={label}
                className="max-h-48 w-full object-contain rounded-lg"
              />
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-xs border-white/10 hover:bg-white/5"
            >
              Replace
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setPreviewUrl(null);
                  onRemove();
                }}
                disabled={isUploading}
                className="text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Upload Drag & Drop Trigger */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-white/[0.02] flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform text-white/60 group-hover:text-[#D4AF37]">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
            ) : isVideo ? (
              <VideoIcon className="w-5 h-5" />
            ) : isDocument ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>
          <div className="text-sm font-medium text-white/90">
            {isUploading ? 'Uploading to Cloudflare...' : `Click or drag ${isVideo ? 'video' : isDocument ? 'PDF' : 'image'} to upload`}
          </div>
          <p className="text-xs text-white/40">
            {isVideo ? 'MP4, WebM (up to 50MB)' : isDocument ? 'PDF document (up to 20MB)' : 'PNG, JPG, WebP, SVG (up to 10MB)'}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Specialized Conveniences
export function ProfileImageUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="avatar" accept="image/*" />;
}

export function CoverImageUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="cover" accept="image/*" />;
}

export function BusinessLogoUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="logo" accept="image/*" />;
}

export function ProductImageUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="product" accept="image/*" />;
}

export function VideoUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="video" accept="video/mp4,video/webm,video/quicktime" />;
}

export function DocumentUploader(props: Omit<BaseUploaderProps, 'mediaCategory'>) {
  return <MediaUploader {...props} mediaCategory="brochure" accept="application/pdf" />;
}
