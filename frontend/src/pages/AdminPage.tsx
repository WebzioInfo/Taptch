import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
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
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  UserCheck,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'finance' | 'orders' | 'users' | 'subscriptions' | 'qr-verify'>('finance');

  // Manual Subscription state
  const [targetUserId, setTargetUserId] = useState('');
  const [targetTier, setTargetTier] = useState<'nano' | 'micro' | 'mini' | 'max'>('mini');
  const [subMessage, setSubMessage] = useState<string | null>(null);

  // New expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('infrastructure');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseMessage, setExpenseMessage] = useState<string | null>(null);

  // User search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Platform Metrics
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => ApiClient.get<any>('/api/v1/admin/stats'),
  });

  // Financial Summary & P&L
  const { data: finance, isLoading: financeLoading } = useQuery({
    queryKey: ['admin', 'finance'],
    queryFn: () => ApiClient.get<any>('/api/v1/admin/finance'),
  });

  // Orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/admin/orders'),
  });

  // Users
  const { data: usersList = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearch, userRoleFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (userSearch.trim()) p.set('q', userSearch.trim());
      if (userRoleFilter !== 'ALL') p.set('role', userRoleFilter);
      return ApiClient.get<any[]>(`/api/v1/admin/users?${p.toString()}`);
    },
  });

  // Record Expense mutation
  const expenseMutation = useMutation({
    mutationFn: () =>
      ApiClient.post('/api/v1/admin/finance/expenses', {
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory,
        notes: expenseNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      setExpenseMessage('Expense logged successfully!');
      setTimeout(() => setExpenseMessage(null), 3000);
    },
    onError: (err: any) => {
      setExpenseMessage(`Error: ${err?.message || 'Failed to record expense.'}`);
    },
  });

  // Toggle user status mutation (suspend/reactivate)
  const userStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      ApiClient.patch(`/api/v1/admin/users/${userId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status: string; paymentStatus?: string }) =>
      ApiClient.patch(`/api/v1/admin/orders/${id}`, { status, paymentStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Governance &amp; P&amp;L</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real financial statements, double-entry COGS ledger, user governance, and physical card logistics
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Registered Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.users ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Active Profiles</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-white">
            {stats?.profiles ?? '—'}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              ({stats?.personalProfiles || 0} Personal, {stats?.businessProfiles || 0} Business)
            </span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            ₹{(finance?.collectedRevenue || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Net Profit (P&amp;L)</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary font-mono">
            ₹{(finance?.netProfit || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/40 pb-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'finance', label: 'Financial Management & P&L', icon: DollarSign },
          { id: 'orders', label: 'Physical Orders Logistics', icon: Package },
          { id: 'users', label: 'User Accounts Governance', icon: Users },
          { id: 'subscriptions', label: 'Manual Plan Entitlements', icon: Sparkles },
          { id: 'qr-verify', label: 'Hardware QR Verifier', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-black shadow-md'
                  : 'bg-[#121216] text-muted-foreground hover:text-white border border-border/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FINANCIAL MANAGEMENT & P&L */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* P&L Statement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-[#121216] border border-border/60 space-y-2">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Gross Order Value</span>
              <p className="text-2xl font-mono font-bold text-white">₹{(finance?.totalOrderValue || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-muted-foreground">Total retail face value of requested hardware cards</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121216] border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Settled Cash Revenue</span>
              <p className="text-2xl font-mono font-bold text-emerald-300">₹{(finance?.collectedRevenue || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-emerald-400/80">Outstanding unpaid: ₹{(finance?.outstandingRevenue || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121216] border border-primary/40 bg-primary/10 space-y-2">
              <span className="text-xs text-primary uppercase font-bold tracking-wider">Net Profit &amp; Margin</span>
              <p className="text-2xl font-mono font-bold text-primary">₹{(finance?.netProfit || 0).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-primary/80">Net Margin: {finance?.profitMargin || '0%'}</p>
            </div>
          </div>

          {/* Unit Cost & Expense Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Cost Breakdown */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-border/60 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />
                Comprehensive P&amp;L Ledger Breakdown
              </h3>
              <div className="divide-y divide-border/30 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">(+) Collected Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{(finance?.collectedRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">(-) Cost of Goods Sold (COGS - PVC @ ₹150, Metal @ ₹450):</span>
                  <span className="font-mono font-bold text-red-400">-₹{(finance?.totalCogs || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="py-2.5 flex justify-between font-bold text-white">
                  <span>(=) Gross Profit:</span>
                  <span className="font-mono text-primary">₹{(finance?.grossProfit || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-muted-foreground">(-) Operating Expenses:</span>
                  <span className="font-mono font-bold text-red-400">-₹{(finance?.totalExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="py-3 flex justify-between font-black text-sm text-primary border-t-2 border-primary/40">
                  <span>Net Bottom-Line Profit:</span>
                  <span className="font-mono text-base">₹{(finance?.netProfit || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Record Operating Expense Form */}
            <div className="p-6 rounded-2xl bg-[#121216] border border-border/60 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Record Operational Expense
              </h3>
              {expenseMessage && (
                <div className="p-3 rounded-lg text-xs bg-white/5 border border-border text-slate-200">
                  {expenseMessage}
                </div>
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Expense Title</label>
                    <Input
                      placeholder="e.g. AWS VPS & Dokploy Host"
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                      className="text-xs h-9 bg-[#18181D] border-border/60 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Amount (₹ INR)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2500"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="text-xs h-9 bg-[#18181D] border-border/60 mt-1 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full text-xs h-9 rounded-xl bg-[#18181D] border border-border/60 text-white px-3 mt-1"
                    >
                      <option value="infrastructure">Infrastructure &amp; Server</option>
                      <option value="shipping">Logistics &amp; Courier</option>
                      <option value="packaging">Packaging &amp; Sleeves</option>
                      <option value="cogs">Raw Hardware &amp; Chips</option>
                      <option value="marketing">Marketing &amp; Ads</option>
                      <option value="operations">General Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Notes / Invoice Ref</label>
                    <Input
                      placeholder="Invoice # or vendor reference"
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      className="text-xs h-9 bg-[#18181D] border-border/60 mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => expenseMutation.mutate()}
                  disabled={expenseMutation.isPending || !expenseTitle || !expenseAmount}
                  className="w-full text-xs font-bold h-9 bg-primary text-black hover:bg-primary-hover gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{expenseMutation.isPending ? 'Logging Expense...' : 'Log Operating Expense'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER GOVERNANCE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 text-xs h-9 bg-[#121216] border-border/60"
              />
            </div>
            <div className="flex items-center gap-1">
              {['ALL', 'super_admin', 'support_admin', 'user'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    userRoleFilter === r
                      ? 'bg-primary text-black'
                      : 'bg-[#121216] text-muted-foreground hover:text-white border border-border/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase">
                        {u.systemRole}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => userStatusMutation.mutate({ userId: u.id, status: 'suspended' })}
                          className="text-xs h-7 gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Suspend</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => userStatusMutation.mutate({ userId: u.id, status: 'active' })}
                          className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Reactivate</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL ORDERS */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order ID &amp; Recipient</th>
                <th className="py-3 px-4">Hardware Specs</th>
                <th className="py-3 px-4">Fulfillment Stage</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white font-mono text-[11px]">{ord.id}</p>
                    <p className="text-muted-foreground text-[11px]">{ord.shippingAddress?.recipientName || 'Recipient'}</p>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-medium text-slate-200">
                    {ord.material} &bull; Qty: {ord.quantity}
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white">
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        ord.paymentStatus === 'paid_offline'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateOrderMutation.mutate({
                          id: ord.id,
                          status: 'shipped',
                          paymentStatus: 'paid_offline',
                        })
                      }
                      className="text-[11px] h-7 border-border"
                    >
                      Mark Shipped
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: MANUAL PLAN ASSIGNMENT */}
      {activeTab === 'subscriptions' && (
        <div className="max-w-xl p-6 rounded-2xl bg-[#121216] border border-border/60 space-y-4">
          <h3 className="text-base font-bold text-white">Assign Manual Plan Entitlement</h3>
          {subMessage && (
            <div className="p-3 rounded-lg text-xs bg-white/5 border border-border text-slate-200">
              {subMessage}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Target User ID</label>
              <Input
                placeholder="usr-..."
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="text-xs bg-[#18181D] border-border/60"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Select Entitlement Tier</label>
              <select
                value={targetTier}
                onChange={(e) => setTargetTier(e.target.value as any)}
                className="w-full text-xs h-9 rounded-xl bg-[#18181D] border border-border/60 text-white px-3"
              >
                <option value="nano">Nano Tier (Essential Individual)</option>
                <option value="micro">Micro Tier (Lead Exchange &amp; Company Overview)</option>
                <option value="mini">Mini Tier (Multi-Business &amp; Catalogue)</option>
                <option value="max">Max Tier (Enterprise &amp; Video Showcases)</option>
              </select>
            </div>
            <Button
              onClick={() => assignSubMutation.mutate()}
              disabled={assignSubMutation.isPending || !targetUserId}
              className="w-full text-xs font-bold h-9 bg-primary text-black hover:bg-primary-hover"
            >
              Confirm Entitlement Assignment
            </Button>
          </div>
        </div>
      )}

      {/* TAB 5: QR VERIFY */}
      {activeTab === 'qr-verify' && <VerifyQRTab />}
    </div>
  );
}
