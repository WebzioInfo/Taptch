import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
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
  Users,
  ClipboardList,
  Layers,
  LayoutTemplate,
  BarChart3,
  IdCard,
  Bell,
} from 'lucide-react';
import { PwaInstallPrompt } from '../components/pwa/PwaInstallPrompt';

export interface SidebarItem {
  to: string;
  label: string;
  mobileLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
}

export const USER_NAV_ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'Profiles', mobileLabel: 'Profiles', icon: LayoutDashboard },
  { to: '/dashboard/nfc-shop', label: 'Purchase NFC Cards', mobileLabel: 'Shop', icon: ShoppingBag },
  { to: '/dashboard/my-nfc-cards', label: 'My NFC Cards', mobileLabel: 'My Cards', icon: CreditCard },
  { to: '/orders', label: 'Orders', mobileLabel: 'Orders', icon: Package },
];

export const ADMIN_SIDEBAR_ROLES = ['super_admin', 'admin', 'support_admin'];

export const ADMIN_NAV_ITEMS: SidebarItem[] = [
  {
    to: '/admin',
    label: 'Overview',
    icon: BarChart3,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/profiles',
    label: 'Profiles',
    icon: IdCard,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/cards',
    label: 'NFC Cards',
    icon: CreditCard,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ClipboardList,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: ShoppingBag,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: Users,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/plans',
    label: 'Plans and Subscriptions',
    icon: Layers,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/templates',
    label: 'Templates',
    icon: LayoutTemplate,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/tickets',
    label: 'Support Tickets',
    icon: Headphones,
    allowedRoles: ['super_admin', 'admin', 'support_admin'],
  },
  {
    to: '/admin/roles',
    label: 'Roles and Permissions',
    icon: ShieldCheck,
    allowedRoles: ['super_admin', 'admin'],
  },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userRole = session?.user?.systemRole || 'user';
  const isAdminRole = ADMIN_SIDEBAR_ROLES.includes(userRole);

  const { data: notifications = [], refetch: refetchNotifications } = useQuery<
    Array<{
      id: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }>
  >({
    queryKey: ['user-notifications'],
    queryFn: () => ApiClient.get('/api/v1/notifications'),
    enabled: Boolean(session?.user?.id) && !isAdminRole,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markNotificationRead = async (id: string) => {
    try {
      await ApiClient.patch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {});
      refetchNotifications();
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    performCompleteLogout(queryClient, navigate, '/');
  };

  const visibleNavItems = isAdminRole
    ? ADMIN_NAV_ITEMS.filter((item) => !item.allowedRoles || item.allowedRoles.includes(userRole))
    : USER_NAV_ITEMS;

  const isNavItemActive = (to: string) => {
    if (to === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/settings';
    }
    if (to === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const userInitials = (session?.user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderNavLink = (item: SidebarItem, onClick?: () => void) => {
    const Icon = item.icon;
    const isActive = isNavItemActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={`relative flex items-center gap-3 px-3 min-h-[44px] py-2 rounded-[8px] text-sm transition-colors ${isActive
          ? 'bg-[var(--accent-tint)] text-[var(--accent-text)] font-semibold'
          : 'text-[#3A3A36] font-medium hover:text-[var(--ink)] hover:bg-[var(--bg-raised)]'
          }`}
      >
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[var(--accent)]" />
        )}
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const homeHref = isAdminRole ? '/admin' : '/dashboard';

  return (
    <ProtectedRoute>
      <div
        data-theme="light"
        className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-page)] text-[var(--ink)] font-body selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden"
      >
        {/* Mobile/Tablet Top Header (< lg) */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-[#3A3A36] hover:text-[var(--ink)] rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo variant="symbol" size="sm" asLink href={homeHref} />
            {isAdminRole && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-text)] bg-[var(--accent-tint)] px-2 py-0.5 rounded-md">
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isAdminRole && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#3A3A36] hover:bg-[var(--bg-raised)]"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6A00]" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white border border-[var(--border)] shadow-xl z-50 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-xs font-bold text-[var(--ink)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            await ApiClient.patch('/api/v1/notifications/read-all', {});
                            refetchNotifications();
                          }}
                          className="text-[11px] font-semibold text-[#FF6A00] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[var(--ink-muted)] py-3 text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => markNotificationRead(n.id)}
                            className={`w-full text-left py-2 px-1.5 rounded hover:bg-[var(--bg-raised)] ${n.isRead ? 'opacity-65' : ''}`}
                          >
                            <div className="text-xs font-semibold text-[var(--ink)]">{n.title}</div>
                            <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                              {n.message}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <span className="text-xs font-medium text-[var(--ink-muted)] hidden sm:inline truncate max-w-[160px]">
              {session?.user?.name}
            </span>
          </div>
        </header>

        {/* Slide-in Drawer (< lg) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-[var(--bg-surface)] h-full border-r border-[var(--border)] shadow-2xl flex flex-col justify-between p-4 z-10 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <BrandLogo variant="horizontal" size="sm" asLink href={homeHref} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close Navigation Menu"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#3A3A36] hover:text-[var(--ink)] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isAdminRole && (
                  <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-subtle)]">
                    ADMIN CONSOLE
                  </div>
                )}

                <nav className="mt-2 space-y-1" aria-label="Mobile drawer navigation">
                  {visibleNavItems.map((item) =>
                    renderNavLink(item, () => setMobileMenuOpen(false)),
                  )}
                </nav>
              </div>

              <div className="border-t border-[var(--border)] pt-3 mt-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">
                    {session?.user?.name || 'My Account'}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)] truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--danger)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop Sidebar (>= lg) */}
        <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] flex-col justify-between p-4 flex-shrink-0">
          <div className="overflow-y-auto pr-0.5">
            <div className="py-3 px-2 flex items-center justify-between gap-2">
              <BrandLogo variant="horizontal" size="md" asLink href={homeHref} />
            </div>

            {isAdminRole && (
              <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-subtle)]">
                ADMIN CONSOLE
              </div>
            )}

            <nav className="mt-2 space-y-1" aria-label="Sidebar navigation">
              {visibleNavItems.map((item) => renderNavLink(item))}
            </nav>
          </div>

          {/* Desktop User Footer */}
          <div className="border-t border-[var(--border)] pt-4 mt-4 shrink-0">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-tint)] border border-[var(--accent-border)] text-[var(--accent-text)] flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[var(--ink)] truncate">
                    {session?.user?.name || 'My Account'}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--ink-muted)] truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#3A3A36] hover:text-[var(--danger-text)] hover:bg-[var(--danger-bg)] transition-colors rounded-lg"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area — Full width right of sidebar */}
        <main
          data-scroll-container="true"
          className={`flex-1 min-w-0 overflow-y-auto bg-[var(--bg-page)] text-[var(--ink)] ${isAdminRole ? 'pb-8 lg:pb-0' : 'pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0'
            }`}
        >
          <Outlet />
        </main>

        {/* PWA Smart Install Prompt */}
        <PwaInstallPrompt />

        {/* Mobile Bottom Navigation Bar — Normal Users Only */}
        {!isAdminRole && (
          <nav
            aria-label="Mobile bottom navigation"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
          >
            {USER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center h-14 px-1 min-w-0 text-[11px] leading-none gap-1 whitespace-nowrap transition-colors ${isActive
                    ? 'text-[var(--accent-text)] font-semibold'
                    : 'text-[#3A3A36] font-medium hover:text-[var(--ink)]'
                    }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate max-w-full">{item.mobileLabel}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </ProtectedRoute>
  );
}
