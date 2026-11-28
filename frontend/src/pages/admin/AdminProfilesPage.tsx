import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IdCard,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  User,
  Package,
  CreditCard,
  Link2,
  Unlink,
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Modal } from '../../components/ui/modal';
import { CARD_STATUS_LABELS, normalizeCardStatus } from '../../lib/card-status';

interface AttachedCardSummary {
  id: string;
  cardCode: string | null;
  status: string;
  tapCount: number;
  orderId: string | null;
  orderNumber: string | null;
}

interface AdminProfileRow {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  profileType: string;
  status: string;
  templateId: string;
  createdAt: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  plan: string;
  attachedCards: AttachedCardSummary[];
  views: number;
  taps: number;
}

interface ProfilesResponse {
  items: AdminProfileRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function AdminProfilesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [templateFilter, setTemplateFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hasCardFilter, setHasCardFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [selectedProfile, setSelectedProfile] = useState<AdminProfileRow | null>(null);
  const [attachCardId, setAttachCardId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<ProfilesResponse>({
    queryKey: [
      'admin-profiles',
      q,
      typeFilter,
      templateFilter,
      planFilter,
      statusFilter,
      hasCardFilter,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (templateFilter !== 'ALL') params.set('template', templateFilter);
      if (planFilter !== 'ALL') params.set('plan', planFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (hasCardFilter !== 'ALL') params.set('hasCard', hasCardFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<ProfilesResponse>(`/api/v1/admin/profiles?${params.toString()}`);
    },
  });

  const unassignedCardsQuery = useQuery<{ items: Array<{ id: string; cardCode: string | null; productName: string | null }> }>({
    queryKey: ['admin-unassigned-cards'],
    queryFn: () => ApiClient.get('/api/v1/admin/cards?assigned=unassigned&pageSize=50'),
    enabled: Boolean(selectedProfile),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PUBLISHED' | 'DRAFT' | 'SUSPENDED' }) =>
      ApiClient.patch(`/api/v1/admin/profiles/${id}/status`, { status }),
    onSuccess: (_res, vars) => {
      setErrorMsg(null);
      if (selectedProfile && selectedProfile.id === vars.id) {
        setSelectedProfile({ ...selectedProfile, status: vars.status });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to update profile status.'),
  });

  const attachCardMutation = useMutation({
    mutationFn: ({ cardId, profileId }: { cardId: string; profileId: string | null }) =>
      ApiClient.patch(`/api/v1/admin/cards/${cardId}`, { profileId }),
    onSuccess: () => {
      setErrorMsg(null);
      setAttachCardId('');
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-unassigned-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to update card attachment.'),
  });

  const columns: ColumnDef<AdminProfileRow>[] = [
    {
      key: 'profile',
      header: 'Profile',
      render: (p) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.displayName}
              className="w-8 h-8 rounded-full object-cover border border-[var(--border)] shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center text-xs font-bold shrink-0">
              {(p.displayName || 'P').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-[var(--ink)] truncate">{p.displayName}</div>
            <div className="text-[11px] text-[var(--ink-muted)] truncate">/{p.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type & Template',
      render: (p) => (
        <div>
          <div className="capitalize font-medium text-[var(--ink)]">{p.profileType}</div>
          <div className="text-[11px] text-[var(--ink-muted)]">{p.templateId}</div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (p) => (
        <div>
          <div className="font-medium text-[var(--ink)]">{p.ownerName || '—'}</div>
          <div className="text-[11px] text-[var(--ink-muted)]">
            {p.ownerEmail}
            {p.ownerPhone ? ` · ${p.ownerPhone}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'cards',
      header: 'Attached Card(s)',
      render: (p) =>
        (p.attachedCards ?? []).length === 0 ? (
          <span className="text-[var(--ink-subtle)]">No card</span>
        ) : (
          <div className="space-y-1">
            {p.attachedCards.map((c) => {
              const st = normalizeCardStatus(c.status);
              return (
                <div key={c.id} className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink)]">
                    {c.cardCode || c.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={st} label={CARD_STATUS_LABELS[st]} />
                </div>
              );
            })}
          </div>
        ),
    },
    {
      key: 'orders',
      header: 'Order ID(s)',
      render: (p) => {
        const orderNums = (p.attachedCards ?? [])
          .map((c) => c.orderNumber || c.orderId)
          .filter(Boolean);
        return orderNums.length === 0 ? (
          <span className="text-[var(--ink-subtle)]">—</span>
        ) : (
          <span className="font-mono text-[11px] text-[var(--ink)]">{orderNums.join(', ')}</span>
        );
      },
    },
    {
      key: 'plan',
      header: 'Plan & Status',
      render: (p) => (
        <div className="space-y-1">
          <StatusBadge status={p.status} />
          <div className="text-[11px] uppercase font-semibold text-[var(--ink-muted)]">
            {p.plan || 'nano'}
          </div>
        </div>
      ),
    },
    {
      key: 'metrics',
      header: 'Views / Taps',
      render: (p) => (
        <div className="text-[11px] text-[var(--ink-muted)] tabular-nums">
          <div>{p.views} views · {p.taps} taps</div>
          <div>{new Date(p.createdAt).toLocaleDateString('en-IN')}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <AdminPageHeader
        title="Profiles"
        subtitle="Inspect every digital profile, attached NFC cards, linked orders, and moderation status"
        action={
          <Button variant="accent" size="sm" onClick={() => refetch()} className="min-h-[44px] md:min-h-[36px]">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
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
          {(error as Error)?.message || 'Failed to load profiles.'}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => setSelectedProfile(p)}
        searchValue={q}
        onSearchChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        searchPlaceholder="Search name, username, email, card code, or order ID..."
        filters={[
          {
            key: 'type',
            label: 'Profile Type',
            value: typeFilter,
            onChange: (v) => {
              setTypeFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Types', value: 'ALL' },
              { label: 'Personal', value: 'personal' },
              { label: 'Business', value: 'business' },
            ],
          },
          {
            key: 'template',
            label: 'Template',
            value: templateFilter,
            onChange: (v) => {
              setTemplateFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Templates', value: 'ALL' },
              { label: 'Cinematic Noir', value: 'cinematic-noir' },
              { label: 'Dark Premium', value: 'dark-premium' },
              { label: 'Modern Business', value: 'modern-business' },
              { label: 'Corporate Business', value: 'corporate-business' },
            ],
          },
          {
            key: 'plan',
            label: 'Plan',
            value: planFilter,
            onChange: (v) => {
              setPlanFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Plans', value: 'ALL' },
              { label: 'Nano', value: 'nano' },
              { label: 'Micro', value: 'micro' },
              { label: 'Mini', value: 'mini' },
              { label: 'Max', value: 'max' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ],
          },
          {
            key: 'hasCard',
            label: 'Card Attachment',
            value: hasCardFilter,
            onChange: (v) => {
              setHasCardFilter(v);
              setPage(1);
            },
            options: [
              { label: 'Any Card State', value: 'ALL' },
              { label: 'Has Card', value: 'yes' },
              { label: 'No Card', value: 'no' },
            ],
          },
        ]}
        page={page}
        pageSize={data?.pageSize ?? 20}
        total={data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={<IdCard className="w-7 h-7" />}
        emptyTitle="No profiles found"
        emptyDescription="Try adjusting your search query or profile filters."
      />

                    {/* Profile Detail Modal (lg) */}
      <Modal
                    open={Boolean(selectedProfile)}
                    onClose={() => setSelectedProfile(null)}
                    title={selectedProfile?.displayName || 'Profile'}
                    subtitle={selectedProfile ? `/${selectedProfile.slug}` : undefined}
                    headerBadge={selectedProfile ? <StatusBadge status={selectedProfile.status} /> : undefined}
                    size="lg"
                    footer={
                      <div className="flex justify-end w-full">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedProfile(null)}>
                          Close
                        </Button>
                      </div>
                    }
                  >
                    {selectedProfile && (
                      <div className="space-y-5 text-xs">
                        {/* Status & Quick Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-[12px] bg-[var(--bg-raised)] border border-[var(--border)]">
                          <StatusBadge status={selectedProfile.status} />
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={`/${selectedProfile.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink)] font-semibold hover:bg-[var(--bg-raised)]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Public Page</span>
                            </a>
                            {selectedProfile.status !== 'SUSPENDED' ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={statusMutation.isPending}
                                onClick={() =>
                                  statusMutation.mutate({ id: selectedProfile.id, status: 'SUSPENDED' })
                                }
                              >
                            Suspend
                          </Button>
                          ) : (
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                      statusMutation.mutate({id: selectedProfile.id, status: 'PUBLISHED' })
                    }
                  >
                          Restore
                        </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          id: selectedProfile.id,
                          status: selectedProfile.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
                        })
                      }
                    >
                      {selectedProfile.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner Details */}
                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[var(--accent-text)]" />
                      Owner Details
                    </span>
                    {selectedProfile.ownerEmail && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const email = selectedProfile.ownerEmail;
                          setSelectedProfile(null);
                          navigate(`/admin/users?q=${encodeURIComponent(email || '')}`);
                        }}
                      >
                        Jump to Owner
                      </Button>
                    )}
                  </div>
                  <div className="text-[var(--ink-muted)]">
                    <div>{selectedProfile.ownerName || '—'}</div>
                    <div>{selectedProfile.ownerEmail || '—'}</div>
                    {selectedProfile.ownerPhone && <div>{selectedProfile.ownerPhone}</div>}
                  </div>
                </div>

                {/* Attached Cards & Orders */}
                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-3">
                  <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[var(--accent-text)]" />
                    Attached NFC Cards ({(selectedProfile.attachedCards ?? []).length})
                  </div>

                  {(selectedProfile.attachedCards ?? []).length === 0 ? (
                    <p className="text-[var(--ink-muted)]">No physical NFC cards attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProfile.attachedCards.map((c) => {
                        const st = normalizeCardStatus(c.status);
                        return (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-mono font-semibold text-[var(--ink)]">
                                {c.cardCode || c.id}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={st} label={CARD_STATUS_LABELS[st]} />
                                {(c.orderNumber || c.orderId) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const ord = c.orderNumber || c.orderId || '';
                                      setSelectedProfile(null);
                                      navigate(`/admin/orders?q=${encodeURIComponent(ord)}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-text)] hover:underline"
                                  >
                                    <Package className="w-3 h-3" />
                                    #{c.orderNumber || c.orderId}
                                  </button>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={attachCardMutation.isPending}
                              onClick={() =>
                                attachCardMutation.mutate({ cardId: c.id, profileId: null })
                              }
                            >
                              <Unlink className="w-3.5 h-3.5 mr-1" />
                              Detach
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--border)] flex gap-2">
                    <select
                      value={attachCardId}
                      onChange={(e) => setAttachCardId(e.target.value)}
                      className="flex-1 min-h-[38px] px-2.5 py-1.5 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                    >
                      <option value="">Select unassigned card...</option>
                      {(unassignedCardsQuery.data?.items ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cardCode || c.id} — {c.productName || 'NFC Card'}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="accent"
                      size="sm"
                      disabled={!attachCardId || attachCardMutation.isPending}
                      onClick={() =>
                        attachCardMutation.mutate({
                          cardId: attachCardId,
                          profileId: selectedProfile.id,
                        })
                      }
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1" />
                      Attach
                    </Button>
                  </div>
                </div>
              </div>
    </div>
  )
}
      </Modal >
    </div >
  );
}
