import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../brand';
import { Button } from '../ui/button';
import { useSession } from '../../lib/auth/client';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';

export function MarketingHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/templates', label: 'Profile Templates' },
    { href: '/nfc-cards', label: 'NFC Cards' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-page)]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <BrandLogo variant="horizontal" size="md" asLink href="/" />

        <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-[var(--ink-muted)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`transition-colors hover:text-[var(--ink)] ${
                pathname === link.href ? 'text-[var(--ink)] font-semibold' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          {isPending ? (
            <div className="h-8 w-20 bg-[var(--border)] animate-pulse rounded-[var(--radius-sm)]" />
          ) : session?.user ? (
            <Link to="/dashboard">
              <Button
                variant="accent"
                size="sm"
                className="text-xs font-medium gap-1.5"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Login
                </Button>
              </Link>
              <Link to="/nfc-cards">
                <Button
                  variant="accent"
                  size="sm"
                  className="text-xs font-medium gap-1.5"
                >
                  <span>Order NFC Card</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-[var(--radius-sm)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface)]"
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
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--bg-page)]/98 px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-[var(--radius-sm)] transition-colors ${
                  pathname === link.href
                    ? 'bg-[var(--bg-surface)] text-[var(--ink)] font-semibold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
