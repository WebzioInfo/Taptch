import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';

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

const DIMENSIONS: Record<BrandLogoVariant, Record<BrandLogoSize, { width: number; height: number }>> = {
  primary: {
    sm: { width: 115, height: 25 },
    md: { width: 147, height: 32 },
    lg: { width: 184, height: 40 },
    xl: { width: 230, height: 50 },
    '2xl': { width: 276, height: 60 },
  },
  horizontal: {
    sm: { width: 126, height: 24 },
    md: { width: 168, height: 32 },
    lg: { width: 211, height: 40 },
    xl: { width: 253, height: 48 },
    '2xl': { width: 316, height: 60 },
  },
  stacked: {
    sm: { width: 80, height: 60 },
    md: { width: 120, height: 90 },
    lg: { width: 160, height: 120 },
    xl: { width: 200, height: 150 },
    '2xl': { width: 240, height: 180 },
  },
  symbol: {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
    '2xl': { width: 64, height: 64 },
  },
  monochrome: {
    sm: { width: 115, height: 25 },
    md: { width: 147, height: 32 },
    lg: { width: 184, height: 40 },
    xl: { width: 230, height: 50 },
    '2xl': { width: 276, height: 60 },
  },
};

function getAssetSrc(variant: BrandLogoVariant, theme: BrandLogoTheme): string {
  if (variant === 'symbol') {
    return brandConfig.assets.symbolUrl;
  }
  if (variant === 'monochrome') {
    return brandConfig.assets.monochromeUrl;
  }
  if (variant === 'stacked') {
    return brandConfig.assets.logoStackedUrl;
  }
  if (variant === 'horizontal') {
    return brandConfig.assets.logoHorizontalUrl;
  }
  
  if (theme === 'light') {
    return brandConfig.assets.logoDarkUrl;
  }
  if (theme === 'dark') {
    return brandConfig.assets.logoLightUrl;
  }
  return brandConfig.assets.logoUrl;
}

export function BrandLogo({
  variant = 'primary',
  theme = 'auto',
  size = 'md',
  width,
  height,
  className = '',
  priority = false,
  asLink = false,
  href = '/',
  onClick,
}: BrandLogoProps) {
  const defaultDims = DIMENSIONS[variant][size];
  const finalWidth = width ?? defaultDims.width;
  const finalHeight = height ?? defaultDims.height;
  const src = getAssetSrc(variant, theme);

  const imageElement = (
    <Image
      src={src}
      alt={brandConfig.name}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      unoptimized
      className={`inline-block select-none object-contain transition-opacity duration-200 ${className}`}
      onClick={onClick}
    />
  );

  if (asLink) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 rounded"
        aria-label={brandConfig.name}
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}

