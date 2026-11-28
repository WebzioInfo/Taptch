import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, X, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface PlanRow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  entitlements: Array<{ id: string; entitlementKey: string; value: unknown }>;
}

interface SubscriptionRow {
  id: string;
  userId: string | null;
  planId: string;
  status: string;
  paymentStatus: string;
  validUntil: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface PlansResponse {
  plans: PlanRow[];
  subscriptions: {
    items: SubscriptionRow[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [planTier, setPlanTier] = useState<'nano' | 'micro' | 'mini' | 'max'>('mini');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<PlansResponse>({
    queryKey: ['admin-plans', q, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<PlansResponse>(`/api/v1/admin/plans?${params.toString()}`);
    },
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      ApiClient.post('/api/v1/admin/subscriptions/assign', {
        userId: userId.trim(),
        planTier,
      }),
    onSuccess: () => {
      setErrorMsg(null);
      setAssignOpen(false);
      setUserId('');
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to assign subscription.'),
  });

  const columns: ColumnDef<SubscriptionRow>[] = [
    {
      key: 'user',
      header: 'Subscriber',
      render: (s) => (
        <div>
          <div className="font-semibold text-[var(--ink)]">{s.userName || 'User'}</div>
          <div className="text-[11px] text-[var(--ink-muted)]">{s.userEmail || s.userId}</div>
        </div>
      ),
    },
    {
      key: 'planId',
      header: 'Plan',
      render: (s) => (
        <span className="uppercase font-semibold text-[var(--ink)]">{s.planId}</span>
      ),
    },
    {
      key: 'status',
      header: 'Subscription',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (s) => <StatusBadge status={s.paymentStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Assigned',
      render: (s) => (
        <span className="text-[var(--ink-muted)]">
          {new Date(s.createdAt).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ];

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <AdminPageHeader
          title="Plans and Subscriptions"
          subtitle="Manage 4-tier plan entitlements and tenant subscription assignments"
          action={
            <Button variant="accent" size="sm" onClick={() => setAssignOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Assign Plan
            </Button>
          }
        />

        {errorMsg && (
          <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
            {(error as Error)?.message || 'Failed to load plans and subscriptions.'}
          </div>
        )}

        {/* Plans Matrix Summary */}
        {data?.plans && data.plans.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--ink)]">{plan.name}</h3>
                  <StatusBadge status={plan.isActive ? 'active' : 'inactive'} />
                </div>
                <p className="text-xs text-[var(--ink-muted)]">{plan.description}</p>
              </div>
            ))}
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.subscriptions?.items ?? []}
          loading={isLoading}
          keyExtractor={(s) => s.id}
          searchValue={q}
          onSearchChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          searchPlaceholder="Search subscriber name, email, or plan..."
          filters={[
            {
              key: 'status',
              value: statusFilter,
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
              options: [
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Expired', value: 'expired' },
              ],
            },
          ]}
          page={page}
          pageSize={data?.subscriptions?.pageSize ?? 20}
          total={data?.subscriptions?.total ?? 0}
          onPageChange={setPage}
          emptyIcon={<Layers className="w-7 h-7" />}
          emptyTitle="No subscriptions found"
          emptyDescription="Assign a plan tier to a user to manage their entitlements."
        />

        {assignOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--ink)]">Assign Plan Tier</h3>
                <button type="button" onClick={() => setAssignOpen(false)}>
                  <X className="w-4 h-4 text-[var(--ink-muted)]" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[var(--ink)] mb-1">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[var(--ink)] mb-1">Plan Tier</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  >
                    <option value="nano">Nano</option>
                    <option value="micro">Micro</option>
                    <option value="mini">Mini</option>
                    <option value="max">Max</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAssignOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={assignMutation.isPending || !userId.trim()}
                  onClick={() => assignMutation.mutate()}
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign Plan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      );
}
