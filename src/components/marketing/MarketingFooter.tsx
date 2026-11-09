import React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';

export function MarketingFooter() {
  return (
    <footer className="w-full border-t border-border/50 py-16 bg-muted/20 text-xs text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-border/60">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <BrandLogo variant="horizontal" size="md" />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              The smart contactless NFC business card and digital identity platform. Tap or scan to share your verified profile, phonebook vCard, and ventures in seconds.
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Developed by {brandConfig.legalName}.
            </p>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Solutions</p>
            <ul className="space-y-2">
              <li>
                <Link href="/nfc-business-card" className="hover:text-foreground transition-colors">
                  NFC Business Cards
                </Link>
              </li>
              <li>
                <Link href="/digital-business-card" className="hover:text-foreground transition-colors">
                  Digital Business Cards
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-foreground transition-colors">
                  Template Showcase
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Platform</p>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Platform Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  Frequently Asked
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Company</p>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            &copy; {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span>Made with precision in India</span>
            <span>&bull;</span>
            <span>DPDP Act Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
