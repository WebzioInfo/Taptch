'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Users, Calendar, ShieldCheck } from 'lucide-react';

interface PortalXHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PortalXHeader({ title, subtitle, actions }: PortalXHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/portal-x/qr-management',
      label: 'QR Batches & QA',
      icon: QrCode,
      active: pathname.startsWith('/portal-x/qr-management'),
    },
    {
      href: '/portal-x/staff',
      label: 'Field Staff RBAC',
      icon: Users,
      active: pathname.startsWith('/portal-x/staff'),
    },
    {
      href: '/portal-x/analytics',
      label: 'Calendar Analytics',
      icon: Calendar,
      active: pathname.startsWith('/portal-x/analytics'),
    },
  ];

  return (
    <div className="space-y-4 border-b border-neutral-800 pb-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-primary font-semibold tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Portal-X Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">{title}</h1>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 overflow-x-auto pt-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                item.active
                  ? 'bg-neutral-800 text-white font-semibold border border-neutral-700/60 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${item.active ? 'text-primary' : 'text-neutral-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
