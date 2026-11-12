import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/brand';
import { useSession, signOut } from '../lib/auth/client';
import {
  LayoutDashboard,
  CreditCard,
  QrCode,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function AppLayout() {
  const location = useLocation();
  const { data: session } = useSession();

  const navItems = [
    { to: '/dashboard', label: 'Profiles', icon: LayoutDashboard },
    { to: '/cards', label: 'NFC Cards', icon: CreditCard },
    { to: '/qr', label: 'Dynamic QR', icon: QrCode },
    { to: '/leads', label: 'Leads & Contacts', icon: Users },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#0A0A0C] text-[#F4F4F6]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-[#121216] flex flex-col justify-between p-4">
        <div>
          <div className="py-4 px-2">
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
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-border/40 pt-4">
          <div className="flex items-center justify-between px-2">
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name || 'My Account'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut().then(() => window.location.href = '/login')}
              className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
