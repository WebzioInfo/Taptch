'use client';

import * as React from 'react';
import { Upload, Link as LinkIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ImageUploadOrUrlProps {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  mediaCategory?:
    | 'avatar'
    | 'cover'
    | 'logo'
    | 'business_cover'
    | 'gallery'
    | 'product'
    | 'service';
  aspectRatio?: 'square' | 'video' | 'banner';
  profileId?: string;
  businessId?: string;
}

export function ImageUploadOrUrl({
  label,
  description,
  value,
  onChange,
  mediaCategory = 'avatar',
  aspectRatio = 'square',
  profileId,
  businessId,
}: ImageUploadOrUrlProps) {
  const [mode, setMode] = React.useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [urlInput, setUrlInput] = React.useState(value || '');
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be smaller than 10MB.');
      return;
    }

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

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message || 'Failed to upload image.');
      }

      onChange(json.data.secureUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error uploading image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUrlApply = () => {
    const clean = urlInput.trim();
    if (!clean) {
      onChange(null);
      setError(null);
      return;
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setError('URL must begin with http:// or https://');
      return;
    }

    setError(null);
    onChange(clean);
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[120px]'
      : aspectRatio === 'banner'
      ? 'aspect-[3/1] max-w-full'
      : 'aspect-video max-w-[200px]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-foreground">{label}</label>
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              mode === 'upload' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
              mode === 'url' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Mode A: File Upload */}
      {mode === 'upload' && (
        <div>
          {value ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className={`relative rounded-lg overflow-hidden border border-border bg-muted ${aspectClass}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt={label} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Image uploaded</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[11px] h-7"
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(null)}
                    disabled={isUploading}
                    className="text-[11px] h-7 text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div className="flex flex-col items-center gap-1.5">
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-medium text-foreground">Uploading to Cloudflare...</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Click to browse or drop image here
                    </span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP up to 10MB</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Direct URL */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://images.example.com/photo.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs h-8 flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleUrlApply}
              className="text-xs h-8"
            >
              Apply
            </Button>
          </div>

          {value && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
              <div className={`relative rounded-md overflow-hidden border border-border bg-muted ${aspectClass}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-mono truncate">{value}</p>
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    onChange(null);
                  }}
                  className="text-[11px] text-destructive hover:underline mt-1 cursor-pointer"
                >
                  Clear URL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
