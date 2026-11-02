import React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-border/50 py-12 bg-background/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
        <div className="flex items-center space-x-3">
          <BrandLogo variant="symbol" size="sm" />
          <span className="font-semibold text-sm text-foreground">{brandConfig.name}</span>
          <span>&bull;</span>
          <span>{brandConfig.tagline}</span>
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/templates" className="hover:text-foreground transition-colors">
            Templates
          </Link>
          <Link href="/dev/gallery" className="hover:text-foreground transition-colors">
            UI Studio
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
        </div>

        <div>
          &copy; {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

