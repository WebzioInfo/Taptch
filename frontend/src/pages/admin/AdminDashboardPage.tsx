import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Package,
  CreditCard,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface OverviewResponse {
  users: number;
  activeUsers: number;
  orders: number;
  pendingOrders: number;
  cards: number;
  activeCards: number;
  revenue: number;
  openTickets: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    orderStatus: string;
    paymentStatus: string;
    totalAmount: number;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    systemRole: string;
    status: string;
    createdAt: string;
  }>;
  timestamp: string;
}

export function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<OverviewResponse>({
    queryKey: ['admin-overview'],
    queryFn: () => ApiClient.get<OverviewResponse>('/api/v1/admin/overview'),
  });

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        <AdminPageHeader
          title="Overview"
          subtitle="Platform metrics across users, orders, NFC cards, and revenue"
          action={
            <Button variant="accent" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          }
        />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
              <div className="h-64 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
            </div>
          </div>
        ) : isError || !data ? (
          <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--danger-border)] p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm text-[var(--danger-text)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{(error as Error)?.message || 'Failed to load overview metrics.'}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* 4 Core KPI Cards: Users, Orders, Cards, Revenue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-muted)]">Total Users</span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">{data.users}</div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">{data.activeUsers} active accounts</p>
                </div>
              </div>

              <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-muted)]">All Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">{data.orders}</div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">{data.pendingOrders} in progress</p>
                </div>
              </div>

              <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-muted)]">NFC Cards</span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">{data.cards}</div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">{data.activeCards} active cards</p>
                </div>
              </div>

              <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink-muted)]">Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-[var(--ink)] tabular-nums">
                    ₹{Number(data.revenue || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">
                    {data.openTickets} open support tickets
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Recent Orders</h2>
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] hover:underline"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {data.recentOrders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--ink-muted)]">
                      No orders placed yet.
                    </div>
                  ) : (
                    data.recentOrders.map((ord) => (
                      <div key={ord.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--ink)] truncate">
                            #{ord.orderNumber} · {ord.userName || ord.userEmail || 'Customer'}
                          </div>
                          <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                            ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')} ·{' '}
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <StatusBadge status={ord.orderStatus} />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--ink)]">Recent Users</h2>
                  <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] hover:underline"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {data.recentUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--ink-muted)]">
                      No registered users found.
                    </div>
                  ) : (
                    data.recentUsers.map((u) => (
                      <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--ink)] truncate">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-[var(--ink-muted)] truncate mt-0.5">
                            {u.email} · {u.systemRole}
                          </div>
                        </div>
                        <StatusBadge status={u.status} />
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      );
                      }
