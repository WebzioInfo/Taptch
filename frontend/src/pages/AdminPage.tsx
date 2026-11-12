import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { VerifyQRTab } from '../components/admin/VerifyQRTab';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Package,
  Layers,
  CheckCircle,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  QrCode,
  Loader2,
} from 'lucide-react';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'subscriptions' | 'qr-verify'>('orders');

  // Manual Subscription state
  const [targetUserId, setTargetUserId] = useState('');
  const [targetTier, setTargetTier] = useState<'nano' | 'micro' | 'mini' | 'max'>('mini');
  const [subMessage, setSubMessage] = useState<string | null>(null);

  // Platform Metrics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => ApiClient.get<any>('/api/v1/admin/stats'),
  });

  // Orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/admin/orders'),
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status: string; paymentStatus?: string }) =>
      ApiClient.patch(`/api/v1/admin/orders/${id}`, { status, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  // Assign subscription mutation
  const assignSubMutation = useMutation({
    mutationFn: () =>
      ApiClient.post('/api/v1/admin/subscriptions/assign', {
        userId: targetUserId.trim(),
        planTier: targetTier,
      }),
    onSuccess: () => {
      setSubMessage(`Successfully assigned ${targetTier.toUpperCase()} tier to user.`);
      setTargetUserId('');
      setTimeout(() => setSubMessage(null), 4000);
    },
    onError: (err: any) => {
      setSubMessage(`Error: ${err?.message || 'Failed to assign plan tier.'}`);
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Portal-X Super Admin Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Operations & Governance</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Physical card logistics, manual plan entitlements, and hardware QR token verification
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Users', value: stats?.users ?? '—', icon: Users, color: 'text-blue-400' },
          { label: 'Active Profiles', value: stats?.profiles ?? '—', icon: Layers, color: 'text-primary' },
          { label: 'NFC Cards Claimed', value: stats?.cards ?? '—', icon: CreditCard, color: 'text-emerald-400' },
          { label: 'Physical Orders', value: stats?.orders ?? '—', icon: Package, color: 'text-amber-400' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-[#121216] border border-border/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-2xl font-black text-white">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/40 pb-4">
        {[
          { id: 'orders', label: 'Physical Card Orders', icon: Package },
          { id: 'subscriptions', label: 'Manual Plan Assignment', icon: Sparkles },
          { id: 'qr-verify', label: 'Post-Print Hardware QR Verifier', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-black shadow-md'
                  : 'bg-[#121216] border border-border/50 text-muted-foreground hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Physical Card Order Requests</h3>
              <span className="text-xs text-muted-foreground font-mono">{orders.length} total orders</span>
            </div>

            {ordersLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">No physical card orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer / Address</th>
                      <th className="py-3 px-4">Material / Qty</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{o.id.slice(0, 8)}...</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{o.shippingAddress?.fullName || 'Customer'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-xs">
                            {o.shippingAddress?.phone} • {o.shippingAddress?.city}, {o.shippingAddress?.state}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize">{o.cardMaterial || 'PVC'}</span> ({o.quantity || 1}x)
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              o.paymentStatus === 'paid_offline'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {o.paymentStatus || 'unpaid'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              o.status === 'DELIVERED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : o.status === 'SHIPPED'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-neutral-800 text-neutral-300'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              updateOrderMutation.mutate({ id: o.id, status: e.target.value })
                            }
                            className="bg-[#18181D] border border-border text-[11px] text-white rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              updateOrderMutation.mutate({
                                id: o.id,
                                status: o.status,
                                paymentStatus: o.paymentStatus === 'paid_offline' ? 'unpaid' : 'paid_offline',
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-semibold border border-white/10 text-primary"
                          >
                            Toggle Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="max-w-xl p-6 rounded-2xl bg-[#121216] border border-border/60 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Assign Plan Tier Override</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Manually upgrade or assign a client's subscription tier without a payment gateway.
            </p>
          </div>

          {subMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                subMessage.startsWith('Error')
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {subMessage}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Target User UUID *</label>
              <Input
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Paste User UUID here..."
                className="mt-1 bg-[#18181D] border-border text-xs rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Target Plan Tier *</label>
              <select
                value={targetTier}
                onChange={(e) => setTargetTier(e.target.value as any)}
                className="w-full mt-1 bg-[#18181D] border border-border text-xs text-white rounded-xl p-2.5 focus:outline-none"
              >
                <option value="nano">NANO (Free • 1 Profile • 1 Card)</option>
                <option value="micro">MICRO (₹999 • 3 Profiles • 3 Cards • Creator)</option>
                <option value="mini">MINI (₹2,499 • 10 Profiles • 10 Cards • Boutique)</option>
                <option value="max">MAX (₹5,999 • 100 Profiles • 100 Cards • Apex Enterprise)</option>
              </select>
            </div>

            <Button
              type="button"
              onClick={() => assignSubMutation.mutate()}
              disabled={!targetUserId.trim() || assignSubMutation.isPending}
              className="w-full bg-primary hover:bg-primary-hover text-black font-bold text-xs rounded-xl h-10 mt-2"
            >
              {assignSubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Tier Assignment'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE QR VERIFIER */}
      {activeTab === 'qr-verify' && (
        <div className="p-6 rounded-2xl bg-[#121216] border border-border/60">
          <VerifyQRTab />
        </div>
      )}
    </div>
  );
}

