'use client';

import * as React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  Loader2,
  RefreshCw,
  Palette,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalProfiles: number;
  totalCards: number;
  totalLeads: number;
  totalOrders: number;
}

interface AdminOrder {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  material: string;
  quantity: number;
  shippingAddress: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  orderStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
}

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  requiredPlanId: string;
  isActive: boolean;
  isFeatured: boolean;
}

export default function SuperAdminPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [templates, setTemplates] = React.useState<TemplateItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'templates' | 'system'>('orders');
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(null);

  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === 'super_admin';

  const loadAdminData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, templatesRes] = await Promise.all([
        fetch('/api/v1/admin/stats').then((r) => r.json()).catch(() => ({ data: null })),
        fetch('/api/v1/admin/orders').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/v1/templates?activeOnly=false').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (session?.user) {
      loadAdminData();
    }
  }, [session, loadAdminData]);

  const handleUpdateOrder = async (orderId: string, updates: { orderStatus?: string; paymentStatus?: string; trackingNumber?: string }) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
        );
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground">
          The Super Admin control portal requires authenticated system administrator privileges.
        </p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Platform Super Admin Control
            </h1>
            <Badge variant="gold" className="text-xs">
              Root Authority
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global management of {brandConfig.name} users, physical hardware fulfillment, and system settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadAdminData} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Total Users</div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalUsers ?? '...'}</div>
        </Card>
        <Card className="border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Profiles</div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalProfiles ?? '...'}</div>
        </Card>
        <Card className="border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Active NFC Cards</div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalCards ?? '...'}</div>
        </Card>
        <Card className="border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Captured Leads</div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalLeads ?? '...'}</div>
        </Card>
        <Card className="border-border/80 bg-card/60 p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Hardware Orders</div>
          <div className="text-2xl font-bold text-primary">{stats?.totalOrders ?? '...'}</div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Hardware Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Templates ({templates.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeTab === 'orders' ? (
        <Card className="border-border/80 bg-card/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-lg">Physical Card Fulfillment Queue</CardTitle>
            <CardDescription className="text-xs">
              Manage production stages, courier tracking codes, and manual offline payment confirmations.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground">
                  <th className="p-3">Order / User</th>
                  <th className="p-3">Material & Qty</th>
                  <th className="p-3">Delivery Address</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Tracking #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No card orders in queue.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/10">
                      <td className="p-3 font-mono">
                        <div className="font-semibold text-foreground">{ord.userName || 'User'}</div>
                        <div className="text-[11px] text-muted-foreground">{ord.userEmail}</div>
                        <div className="text-[10px] text-primary">{ord.id.slice(0, 14)}...</div>
                      </td>
                      <td className="p-3">
                        <span className="capitalize font-medium">{ord.material}</span> (x{ord.quantity})
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground max-w-xs">
                        <div>{ord.shippingAddress?.recipientName}</div>
                        <div>{ord.shippingAddress?.street}, {ord.shippingAddress?.city}</div>
                        <div>{ord.shippingAddress?.state} - {ord.shippingAddress?.postalCode}</div>
                        <div>Phone: {ord.shippingAddress?.phone}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { orderStatus: e.target.value })}
                          disabled={updatingOrderId === ord.id}
                          className="px-2 py-1 rounded bg-background border border-border text-xs capitalize text-foreground"
                        >
                          <option value="requested">Requested</option>
                          <option value="in_production">In Production</option>
                          <option value="qc">Quality Check</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => handleUpdateOrder(ord.id, { paymentStatus: e.target.value })}
                          disabled={updatingOrderId === ord.id}
                          className="px-2 py-1 rounded bg-background border border-border text-xs capitalize text-foreground"
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="paid_offline">Paid Offline</option>
                          <option value="waived">Waived / Entitled</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          defaultValue={ord.trackingNumber || ''}
                          placeholder="e.g. BLUEDART-12345"
                          onBlur={(e) => {
                            if (e.target.value !== ord.trackingNumber) {
                              handleUpdateOrder(ord.id, { trackingNumber: e.target.value });
                            }
                          }}
                          className="px-2 py-1 rounded bg-background border border-border text-xs font-mono text-foreground w-36"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Templates Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="border-border/80 bg-card/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="gold" className="text-[10px] uppercase">
                    Plan: {tpl.requiredPlanId}
                  </Badge>
                  <Badge variant={tpl.isActive ? 'outline' : 'secondary'} className="text-[10px]">
                    {tpl.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold pt-1">{tpl.name}</CardTitle>
                <CardDescription className="text-xs capitalize">Category: {tpl.category}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>Built-in responsive template engine supporting personal & business profiles.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
