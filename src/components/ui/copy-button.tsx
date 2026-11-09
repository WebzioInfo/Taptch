'use client';

import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string;
  label?: string;
  successLabel?: string;
  showToast?: boolean;
  toastMessage?: string;
  onCopy?: () => void;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }

  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export function CopyButton({
  value,
  label,
  successLabel = 'Copied!',
  showToast = true,
  toastMessage = 'Copied to clipboard',
  onCopy,
  variant = 'outline',
  size = 'sm',
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      onCopy?.();
      if (showToast) {
        toast.success(toastMessage);
      }
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Unable to copy to clipboard. Please copy manually.');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn('inline-flex items-center gap-1.5 transition-all text-xs', className)}
      aria-label={label || 'Copy to clipboard'}
      {...props}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{label || 'Copy'}</span>
        </>
      )}
    </Button>
  );
}

export interface ShareButtonProps extends Omit<ButtonProps, 'onClick'> {
  url: string;
  title?: string;
  text?: string;
  label?: string;
}

export function ShareButton({
  url,
  title,
  text,
  label = 'Share',
  variant = 'outline',
  size = 'sm',
  className,
  ...props
}: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'TAPTCH Digital Profile',
          text: text || 'Connect with me on TAPTCH:',
          url,
        });
        return;
      } catch (err: unknown) {
        // User aborted share dialog; do not trigger fallback error
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    // Fallback to clipboard copy
    const ok = await copyToClipboard(url);
    if (ok) {
      toast.success('Profile link copied to clipboard');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn('inline-flex items-center gap-1.5 transition-all text-xs', className)}
      aria-label={label}
      {...props}
    >
      <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}

