import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/brand';
import { useSession, signOut } from '../lib/auth/client';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  QrCode,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';

export function AppLayout() {
  const location = useLocation();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Profiles', icon: LayoutDashboard },
    { to: '/cards', label: 'Cards', icon: CreditCard },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/qr', label: 'QR Engine', icon: QrCode },
    { to: '/leads', label: 'Leads', icon: Users },
  ];

  const userInitials = (session?.user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      data-theme="light"
      className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FB] text-[#171717] font-body selection:bg-orange-100 selection:text-orange-900"
    >
      {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E8E8E8] sticky top-0 z-40">
          <BrandLogo variant="symbol" size="sm" asLink href="/dashboard" />
            <div className="flex items-center space-x-1">
              <Link
                to="/settings"
                className="p-2 text-[#666666] hover:text-[#171717] rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#666666] hover:text-[#171717] rounded-lg transition-colors"
                aria-label="Toggle Navigation Menu"
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
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2 text-[#666666] hover:text-[#171717] rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <nav className="space-y-1">
                        {[...navItems, { to: '/settings', label: 'Account Settings', icon: Settings }].map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`relative flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                  ? 'bg-[#FFF3E9] text-[#FF6A00] font-semibold'
                                  : 'text-[#666666] hover:text-[#171717] hover:bg-[#F8F9FB]'
                                }`}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FF6A00]" />
                              )}
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </nav>

                        <div className="border-t border-[#E8E8E8] pt-3 flex items-center justify-between">
                          <div className="truncate">
                              <p className="text-sm font-semibold text-[#171717] truncate">
                                {session?.user?.name || 'My Account'}
                              </p>
                                <p className="text-xs text-[#929292] truncate">
                                  {session?.user?.email}
                                </p>
                              </div>
                              <button
                                onClick={() => signOut().then(() => (window.location.href = '/login'))}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors"
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

                                <nav className="mt-6 space-y-1">
                                  {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.startsWith(item.to);
                                    return (
                                      <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`relative flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                            ? 'bg-[#FFF3E9] text-[#FF6A00] font-semibold'
                                            : 'text-[#666666] hover:text-[#171717] hover:bg-[#F8F9FB]'
                                          }`}
                                      >
                                        {isActive && (
                                          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FF6A00]" />
                                        )}
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                      </Link>
                                    );
                                  })}
                                  <Link
                                    to="/settings"
                                    className={`relative flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.startsWith('/settings')
                                        ? 'bg-[#FFF3E9] text-[#FF6A00] font-semibold'
                                        : 'text-[#666666] hover:text-[#171717] hover:bg-[#F8F9FB]'
                                      }`}
                                  >
                                    {location.pathname.startsWith('/settings') && (
                                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#FF6A00]" />
                                    )}
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                  </Link>

                                  {/* Role-Specific Governance & Support */}
                                  {(session?.user?.systemRole === 'super_admin' || session?.user?.systemRole === 'admin') && (
                                    <Link
                                      to="/admin"
                                      className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                      <span>Admin Governance</span>
                                    </Link>
                                  )}

                            {(session?.user?.systemRole === 'support_admin' || session?.user?.systemRole === 'super_admin' || session?.user?.systemRole === 'admin') && (
                              <Link
                                to="/support"
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                              >
                                <Headphones className="w-4 h-4" />
                                <span>Support Operations</span>
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
                            onClick={() => signOut().then(() => (window.location.href = '/login'))}
                            className="p-1.5 text-[#666666] hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-lg"
                            title="Sign Out"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-[#F8F9FB] text-[#171717]">
                      <Outlet />
                    </main>

                    {/* PWA Smart Install Prompt */}
                    <PwaInstallPrompt />

                {/* Mobile Bottom Navigation Bar */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E8E8] flex items-center justify-around py-2 px-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${isActive ? 'text-[#FF6A00] font-semibold' : 'text-[#666666] hover:text-[#171717]'
                          }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
            </div>
            );
}
