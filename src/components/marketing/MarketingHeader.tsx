'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/client';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';

export function MarketingHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <BrandLogo variant="horizontal" size="md" asLink href="/" />

        <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-muted-foreground">
          <Link
            href="/#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/templates"
            className={`transition-colors ${
              pathname === '/templates'
                ? 'text-primary font-semibold'
                : 'hover:text-foreground'
            }`}
          >
            Templates
          </Link>
          <Link
            href="/#pricing"
            className="hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#hardware"
            className="hover:text-foreground transition-colors"
          >
            NFC Cards
          </Link>
          <Link
            href="/dev/gallery"
            className="hover:text-foreground transition-colors"
          >
            Studio
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {isPending ? (
            <div className="h-8 w-20 bg-muted/40 animate-pulse rounded-md" />
          ) : session?.user ? (
            <Link href="/dashboard">
              <Button
                variant="gold"
                size="sm"
                className="text-xs font-medium gap-1.5 shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="gold"
                  size="sm"
                  className="text-xs font-medium gap-1.5 shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="/templates"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-2 py-1.5 rounded-md ${
                pathname === '/templates'
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Templates
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/#hardware"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              NFC Cards
            </Link>
            <Link
              href="/dev/gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            >
              Studio
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
