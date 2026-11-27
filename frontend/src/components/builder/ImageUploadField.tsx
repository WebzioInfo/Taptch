import * as React from 'react';
import { Upload, Link as LinkIcon, Trash2, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  category?: 'avatar' | 'logo' | 'cover';
  placeholder?: string;
  compact?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function isValidImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/api/v1/uploads/file/') || trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({
  label,
  value,
  onChange,
  category = 'avatar',
  placeholder = 'https://images.unsplash.com/photo-...',
  compact = false,
}: ImageUploadFieldProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [previewSrc, setPreviewSrc] = React.useState<string>(value);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Sync external value changes when not actively showing a temporary local preview
  React.useEffect(() => {
    if (!isUploading) {
      setPreviewSrc(value);
      setLoadError(null);
      setUrlError(value && !isValidImageUrl(value) ? 'Enter a valid http(s) image URL.' : null);
    }
  }, [value, isUploading]);

  // Revoke temporary object URL on unmount
  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const revokeTempUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUrlError(null);
    setLoadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUrlError('Unsupported file type. Please choose a JPG, JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setUrlError('Image exceeds the 5 MB size limit.');
      return;
    }

    revokeTempUrl();
    const tempObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = tempObjectUrl;
    setPreviewSrc(tempObjectUrl);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUploadProgress(60);

      const response = await ApiClient.post<{ url: string }>('/api/v1/uploads/image', {
        dataUrl,
        filename: file.name,
        category,
      });

      setUploadProgress(100);
      const persistedUrl = response?.url;
      if (!persistedUrl) {
        throw new Error('Upload succeeded without returning an image URL.');
      }

      revokeTempUrl();
      setPreviewSrc(persistedUrl);
      onChange(persistedUrl);
    } catch (err) {
      revokeTempUrl();
      setPreviewSrc(value);
      setUrlError(err instanceof Error ? err.message : 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUrlInputChange = (nextRaw: string) => {
    revokeTempUrl();
    setLoadError(null);
    onChange(nextRaw);
    setPreviewSrc(nextRaw);

    if (nextRaw.trim() && !isValidImageUrl(nextRaw)) {
      setUrlError('Enter a valid http:// or https:// image URL.');
    } else {
      setUrlError(null);
    }
  };

  const handleRemove = () => {
    revokeTempUrl();
    setUrlError(null);
    setLoadError(null);
    setPreviewSrc('');
    onChange('');
  };

  const activeError = urlError || loadError;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-[var(--ink)] font-medium">{label}</Label>
        {previewSrc && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <div className={`flex ${compact ? 'items-center gap-1.5 min-w-0' : 'items-start gap-3'}`}>
        {/* Live Thumbnail Preview */}
        <div
          className={`${compact ? 'w-8 h-8 rounded-md' : 'w-14 h-14 rounded-xl'} shrink-0 border border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden flex items-center justify-center relative`}
        >
          {previewSrc && !loadError ? (
            <img
              src={previewSrc}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => {
                if (!isUploading) {
                  setLoadError('Unable to load image from this URL.');
                }
              }}
              onLoad={() => setLoadError(null)}
            />
          ) : (
            <ImageIcon className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-[var(--ink-muted)] opacity-50`} />
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white animate-spin`} />
            </div>
          )}
        </div>

        {/* Upload Button + Direct URL Input */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-[11px] font-medium text-[var(--ink)] transition-colors shrink-0 disabled:opacity-60 ${
                compact ? 'px-2 py-1 h-8 text-[10px]' : 'px-2.5 py-1.5'
              }`}
              title={value ? 'Replace Image' : 'Upload Image'}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-text)]" />
                  <span className="truncate">{compact ? `${uploadProgress}%` : `Uploading ${uploadProgress}%`}</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 text-[var(--accent-text)] shrink-0" />
                  <span className="truncate">{value ? 'Replace' : 'Upload'}</span>
                </>
              )}
            </button>

            <div className="relative flex-1 min-w-0">
              <LinkIcon className="w-2.5 h-2.5 text-[var(--ink-muted)] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              <Input
                type="url"
                value={value}
                onChange={(e) => handleUrlInputChange(e.target.value)}
                placeholder={compact ? 'URL' : placeholder}
                className={`pl-5.5 h-8 font-mono text-[10px] w-full min-w-0 ${compact ? 'px-1.5 pl-5' : 'pl-7 text-[11px]'}`}
              />
            </div>
          </div>

          {!activeError && !compact && (
            <p className="text-[10px] text-[var(--ink-muted)] mt-1.5">
              Upload JPG, PNG, or WebP (max 5 MB) or paste a direct image URL.
            </p>
          )}
        </div>
      </div>

      {activeError && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--danger)]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
}
