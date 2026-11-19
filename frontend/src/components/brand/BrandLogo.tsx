import React from 'react';
import { Link } from 'react-router-dom';
import { brandConfig } from '../../config/brand';

export type BrandLogoVariant = 'primary' | 'horizontal' | 'stacked' | 'symbol' | 'monochrome';
export type BrandLogoTheme = 'auto' | 'dark' | 'light';
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  size?: BrandLogoSize;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  asLink?: boolean;
  href?: string;
  onClick?: () => void;
}

  const SIZE_MAP: Record<BrandLogoSize, { text: string; icon: string }> = {
    sm: { text: 'text-base', icon: 'w-4 h-4' },
    md: { text: 'text-xl', icon: 'w-5 h-5' },
    lg: { text: 'text-2xl', icon: 'w-6 h-6' },
    xl: { text: 'text-3xl', icon: 'w-8 h-8' },
    '2xl': { text: 'text-4xl', icon: 'w-10 h-10' },
  };

export function BrandLogo({
  variant = 'primary',
  size = 'md',
  className = '',
  asLink = false,
  href = '/',
  onClick,
}: BrandLogoProps) {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const brandName = (brandConfig.shortName || 'taptch').toLowerCase();

  const symbolElement = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.icon} text-[var(--ink)] inline-block select-none flex-shrink-0`}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="14.5" r="2.5" fill="var(--accent)" />
    </svg>
  );

  const wordmarkElement = (
    <span className={`font-head font-medium tracking-tight text-[var(--ink)] leading-none select-none ${currentSize.text}`}>
      {brandName}
      <span className="text-[var(--accent)] font-bold">.</span>
    </span>
  );

  let content: React.ReactNode;

  if (variant === 'symbol') {
    content = (
      <span className={`inline-flex items-center justify-center ${className}`} onClick={onClick}>
        {symbolElement}
      </span>
    );
  } else if (variant === 'stacked') {
    content = (
      <span className={`inline-flex flex-col items-center gap-1.5 ${className}`} onClick={onClick}>
        {symbolElement}
        {wordmarkElement}
      </span>
    );
  } else {
    // primary, horizontal, monochrome
    content = (
      <span className={`inline-flex items-center gap-2 ${className}`} onClick={onClick}>
        {variant !== 'monochrome' && symbolElement}
        {wordmarkElement}
      </span>
    );
  }

  if (asLink) {
    return (
      <Link
        to={href}
        className="inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 rounded-[var(--radius-sm)] transition-opacity hover:opacity-90"
        aria-label={brandConfig.name}
      >
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}
