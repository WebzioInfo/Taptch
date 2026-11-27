import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { defaultBrandConfig } from '../config/brand';
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 bg-[#F8F9FB] min-h-screen text-[#171717] font-body">
      {/* Support Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E8]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-orange-200 bg-[#FFF3E9] text-[#FF6A00] text-xs font-semibold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5" />
            <span>Support &amp; Customer Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717]">Customer Support &amp; Moderation</h1>
          <p className="text-xs text-[#666666] mt-1">
            Account assistance, digital profile content audits, hardware fulfillment triage, and operations
          </p>
        </div>

        {/* Security Isolation Notice */}
        <div className="p-3 rounded-xl border border-[#E8E8E8] bg-white shadow-xs flex items-center gap-2 text-xs text-[#666666] max-w-xs">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Financial P&amp;L and platform credentials are restricted from Support roles.</span>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#666666] font-medium">Customer Accounts</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{stats?.totalUsers ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#666666] font-medium">Published Profiles</span>
            <Layers className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{stats?.totalProfiles ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#666666] font-medium">Pending Orders</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-[#FF6A00]">{stats?.pendingOrders ?? '—'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#666666] font-medium">Leads Captured</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-[#16A36A]">{stats?.totalLeadsCaptured ?? '—'}</p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E8E8E8] pb-4 overflow-x-auto scrollbar-none">
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
                  ? 'bg-[#FFF3E9] text-[#FF6A00] border border-[#FF6A00] shadow-xs font-semibold'
                  : 'bg-white text-[#666666] hover:text-[#171717] border border-[#E8E8E8]'
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#929292]" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-white border-[#E8E8E8] text-[#171717] focus:border-[#FF6A00]"
            />
          </div>

          <div className="rounded-2xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Member Since</th>
                  <th className="py-3 px-4 text-right">Direct Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#171717]">{u.name}</p>
                      <p className="text-[11px] text-[#666666] font-mono">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-neutral-100 text-[#171717] border-[#E8E8E8] text-[10px] uppercase">{u.systemRole}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#666666] font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`mailto:${u.email}?subject=${encodeURIComponent(defaultBrandConfig.name)}%20Support%20Assistance`}
                        className="text-xs text-[#FF6A00] hover:text-[#E85D00] hover:underline font-medium"
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
        <div className="rounded-2xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Profile &amp; Handle</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#171717]">{p.displayName}</p>
                      <a
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#666666] hover:text-[#FF6A00]"
                        title="View Public Profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-[#666666] font-mono">/{p.slug}</p>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-[#171717]">{p.profileType}</td>
                  <td className="py-3 px-4">
                    <Badge
                      className={`text-[10px] uppercase ${
                        p.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'SUSPENDED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[#666666] font-mono text-[11px]">{p.templateId}</td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {p.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewMutation.mutate({ id: p.id, action: 'approve', reason: 'Approved by Support' })}
                        className="text-xs h-7 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
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
        <div className="rounded-2xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
          <div className="p-4 bg-[#F8F9FB] border-b border-[#E8E8E8] flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#666666]">
              Immutable Action Log (Security &amp; DPDP Compliant)
            </h3>
            <span className="text-[11px] text-[#929292] font-mono">Real-time DB stream</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8] uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Details / Reason</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {auditTrail.map((log) => (
                <tr key={log.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#171717]">{log.actorName || log.actorId}</p>
                    <p className="text-[10px] text-[#666666] font-mono">{log.actorEmail}</p>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-[11px] text-[#FF6A00] font-mono">{log.action}</code>
                  </td>
                  <td className="py-3 px-4 text-[#666666]">
                    {log.resourceType}: <span className="font-mono text-[#171717]">{log.resourceId}</span>
                  </td>
                  <td className="py-3 px-4 text-[#666666]">
                    {log.metadata?.reason || JSON.stringify(log.metadata || {})}
                  </td>
                  <td className="py-3 px-4 text-right text-[#666666] font-mono text-[11px]">
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

