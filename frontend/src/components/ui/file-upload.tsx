'use client';

import * as React from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  accept?: string;
  maxSizeBytes?: number; // default 5MB
  value?: string | null; // URL of existing image/file
  onChange?: (file: File | null) => void;
  onUpload?: (file: File) => Promise<string | void>;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

export function FileUpload({
  accept = 'image/png,image/jpeg,image/webp,image/svg+xml',
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  value = null,
  onChange,
  onUpload,
  loading = false,
  disabled = false,
  label = 'Upload image',
  helperText = 'PNG, JPG, WebP up to 5MB',
  className,
}: FileUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(value);
  const [prevValue, setPrevValue] = React.useState<string | null>(value);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setPreviewUrl(value);
  }

  const handleFile = async (file: File) => {
    setErrorMsg(null);

    if (maxSizeBytes && file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setErrorMsg(`File size exceeds ${maxMb}MB limit.`);
      return;
    }

    // Local object URL for instant preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    onChange?.(file);

    if (onUpload) {
      try {
        const uploadedUrl = await onUpload(file);
        if (uploadedUrl) {
          setPreviewUrl(uploadedUrl);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
        setErrorMsg(msg);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || loading}
        className="hidden"
        aria-label={label}
      />

      {previewUrl ? (
        <div className="relative flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative h-12 w-12 rounded-md bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                {label}
              </p>
              <p className="text-[11px] text-slate-400">
                Image uploaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-7 px-2.5"
            >
              Replace
            </Button>
            <button
              type="button"
              disabled={disabled || loading}
              onClick={handleRemove}
              className="p-1 rounded text-slate-400 hover:text-red-600 focus:outline-none transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !loading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !loading) fileInputRef.current?.click();
          }}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center select-none bg-slate-50/60',
            dragOver ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            (disabled || loading) && 'pointer-events-none opacity-60'
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500">Uploading file...</p>
            </div>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-2.5">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-slate-800">
                <span className="text-blue-600 hover:underline">Click to browse</span> or drag & drop
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {helperText}
              </p>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] font-medium text-red-600 mt-1">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

