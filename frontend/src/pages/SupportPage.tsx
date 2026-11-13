import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Headphones,
  Users,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  Layers,
  ExternalLink,
  MessageSquare,
  Activity,
  Package,
} from 'lucide-react';

export function SupportPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'profiles' | 'orders' | 'audit'>('users');
  const [userQuery, setUserQuery] = useState('');

  // Support Operational Metrics
  const { data: stats } = useQuery({
    queryKey: ['support', 'dashboard'],
    queryFn: () => ApiClient.get<any>('/api/v1/support/dashboard'),
  });

  // Users search query
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['support', 'users', userQuery],
    queryFn: () => {
      const p = new URLSearchParams();
      if (userQuery.trim()) p.set('q', userQuery.trim());
      return ApiClient.get<any[]>(`/api/v1/support/users?${p.toString()}`);
    },
  });

  // Profiles for audit
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['support', 'profiles'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/support/profiles'),
  });

  // Operational audit trail
  const { data: auditTrail = [] } = useQuery({
    queryKey: ['support', 'audit-trail'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/support/audit-trail'),
  });

  // Profile moderation review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'flag' | 'suspend'; reason: string }) =>
      ApiClient.patch(`/api/v1/support/profiles/${id}/review`, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'profiles'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'audit-trail'] });
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Support Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5" />
            <span>Support &amp; Customer Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Customer Support &amp; Moderation</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Account assistance, digital profile content audits, hardware fulfillment triage, and operations
          </p>
        </div>

        {/* Security Isolation Notice */}
        <div className="p-3 rounded-xl border border-border/50 bg-[#121216] flex items-center gap-2 text-xs text-muted-foreground max-w-xs">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Financial P&amp;L and platform credentials are restricted from Support roles.</span>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Customer Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalUsers ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Published Profiles</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalProfiles ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Pending Orders</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats?.pendingOrders ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121216] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">Leads Captured</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats?.totalLeadsCaptured ?? '—'}</p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-border/40 pb-4 overflow-x-auto scrollbar-none">
        {[
          { id: 'users', label: 'Customer Account Lookup', icon: Users },
          { id: 'profiles', label: 'Profile Content Moderation', icon: Layers },
          { id: 'audit', label: 'Operational Audit Trail', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#121216] text-muted-foreground hover:text-white border border-border/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS LOOKUP */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-[#121216] border-border/60"
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Member Since</th>
                  <th className="py-3 px-4 text-right">Direct Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-white/10 text-white text-[10px] uppercase">{u.systemRole}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`mailto:${u.email}?subject=Taptch%20Support%20Assistance`}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Email Customer
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILES AUDIT & CONTENT MODERATION */}
      {activeTab === 'profiles' && (
        <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181D] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Profile &amp; Handle</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{p.displayName}</p>
                      <a
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title="View Public Profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">/{p.slug}</p>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-300">{p.profileType}</td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`text-[10px] uppercase ${
                        p.status === 'PUBLISHED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : p.status === 'SUSPENDED'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">{p.templateId}</td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {p.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewMutation.mutate({ id: p.id, action: 'approve', reason: 'Approved by Support' })}
                        className="text-xs h-7 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40"
                      >
                        Approve
                      </Button>
                    )}
                    {p.status !== 'SUSPENDED' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewMutation.mutate({ id: p.id, action: 'suspend', reason: 'Flagged for content violation' })}
                        className="text-xs h-7"
                      >
                        Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: OPERATIONAL AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-border/60 bg-[#121216] overflow-hidden">
          <div className="p-4 bg-[#18181D] border-b border-border/40 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Immutable Action Log (Security &amp; DPDP Compliant)
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">Real-time DB stream</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121216] text-muted-foreground border-b border-border/40 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details / Reason</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {auditTrail.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{log.actorName || log.actorId}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{log.actorEmail}</p>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-[11px] text-primary font-mono">{log.action}</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {log.resourceType}: <span className="font-mono text-slate-200">{log.resourceId}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.metadata?.reason || JSON.stringify(log.metadata || {})}
                  </td>
                  <td className="py-3 px-4 text-right text-muted-foreground font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

