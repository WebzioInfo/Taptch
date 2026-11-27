import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BrandLogo } from '../components/brand';
import { useSession, performCompleteLogout } from '../lib/auth/client';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Headphones,
  ShoppingBag,
} from 'lucide-react';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    performCompleteLogout(queryClient, navigate, '/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Profiles', mobileLabel: 'Profiles', icon: LayoutDashboard },
    { to: '/dashboard/nfc-shop', label: 'Purchase NFC Cards', mobileLabel: 'Shop', icon: ShoppingBag },
    { to: '/dashboard/my-nfc-cards', label: 'My NFC Cards', mobileLabel: 'My Cards', icon: CreditCard },
    { to: '/orders', label: 'Orders', mobileLabel: 'Orders', icon: Package },
  ];

  const isNavItemActive = (to: string) => {
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/settings';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const isAdminUser =
    session?.user?.systemRole === 'super_admin' || session?.user?.systemRole === 'admin';
  const isSupportUser =
    session?.user?.systemRole === 'support_admin' || isAdminUser;

  const userInitials = (session?.user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ProtectedRoute>
      <div
        data-theme="light"
        className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FB] text-[#171717] font-body selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden"
      >
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-[#E8E8E8] sticky top-0 z-40 shrink-0">
          <BrandLogo variant="symbol" size="sm" asLink href="/dashboard" />
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#666666] hover:text-[#171717] rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer (When Open) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm pt-4 px-4 pb-6 flex flex-col justify-between">
            <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
                <BrandLogo variant="horizontal" size="sm" asLink href="/dashboard" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="p-2 text-[#666666] hover:text-[#171717] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1" aria-label="Mobile drawer navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#FFF3E9] text-[#FF6A00] font-semibold'
                          : 'text-[#666666] hover:text-[#171717] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FF6A00]" />
                      )}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}

                {isAdminUser && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="truncate">Admin Governance</span>
                  </Link>
                )}

                {isSupportUser && (
                  <Link
                    to="/support"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    <Headphones className="w-4 h-4 shrink-0" />
                    <span className="truncate">Support Operations</span>
                  </Link>
                )}
              </nav>

              <div className="border-t border-[#E8E8E8] pt-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#171717] truncate">
                    {session?.user?.name || 'My Account'}
                  </p>
                  <p className="text-xs text-[#929292] truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-[#E8E8E8] bg-white flex-col justify-between p-4 flex-shrink-0">
          <div>
            <div className="py-3 px-2">
              <BrandLogo variant="horizontal" size="md" asLink href="/dashboard" />
            </div>

            <nav className="mt-6 space-y-1" aria-label="Sidebar navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#FFF3E9] text-[#FF6A00] font-semibold'
                        : 'text-[#666666] hover:text-[#171717] hover:bg-[#F8F9FB]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FF6A00]" />
                    )}
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}

              {/* Role-Specific Governance & Support */}
              {isAdminUser && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Admin Governance</span>
                </Link>
              )}

              {isSupportUser && (
                <Link
                  to="/support"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                >
                  <Headphones className="w-4 h-4 shrink-0" />
                  <span className="truncate">Support Operations</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Desktop User Footer */}
          <div className="border-t border-[#E8E8E8] pt-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFF3E9] border border-orange-200 text-[#FF6A00] flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#171717] truncate">
                    {session?.user?.name || 'My Account'}
                  </p>
                  <p className="font-mono text-[10px] text-[#929292] truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-[#666666] hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-lg"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          data-scroll-container="true"
          className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 bg-[#F8F9FB] text-[#171717]"
        >
          <Outlet />
        </main>

        {/* PWA Smart Install Prompt */}
        <PwaInstallPrompt />

        {/* Mobile Bottom Navigation Bar — 4 equal columns, single-line labels, safe-area inset */}
        <nav
          aria-label="Mobile bottom navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-[#E8E8E8] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center h-14 px-1 min-w-0 text-[11px] leading-none gap-1 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#FF6A00] font-semibold'
                    : 'text-[#666666] font-medium hover:text-[#171717]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate max-w-full">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </ProtectedRoute>
  );
}
