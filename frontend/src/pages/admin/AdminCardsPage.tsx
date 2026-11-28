import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  Upload,
  Copy,
  Check,
  QrCode,
  Wifi,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Search,
} from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useSession } from '../../lib/auth/client';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Modal } from '../../components/ui/modal';
import { CARD_STATUS_LABELS, normalizeCardStatus, type CardStatus } from '../../lib/card-status';
import {
  buildProfileUrl,
  formatCardUrlDisplay,
  resolveCardPublicUrl,
} from '../../lib/card-url';

interface AdminCardRow {
  id: string;
  cardCode: string | null;
  productId: string | null;
  productName: string | null;
  variantName: string | null;
  material: string;
  status: string;
  statusChangedAt?: string | null;
  statusChangedBy?: string | null;
  statusReason?: string | null;
  profileId: string | null;
  profileName: string | null;
  profileSlug: string | null;
  profileType?: 'personal' | 'business' | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone?: string | null;
  orderId: string | null;
  orderNumber: string | null;
  nfcUrl: string | null;
  redirectToken: string | null;
  tapCount: number;
  lastTappedAt: string | null;
  assignedAt: string | null;
  issuedAt?: string | null;
  createdAt: string;
}

interface CardDetailResponse {
  card: AdminCardRow;
  tapStats?: {
    totalTaps: number;
    taps7d: number;
    taps30d: number;
    firstTapAt: string | null;
    lastTapAt: string | null;
    lastTapLocation: string | null;
    lastTapDevice: string | null;
    dailyTaps14d: Array<{ date: string; count: number }>;
  };
  tapHistory: Array<{
    id: string;
    eventType: string;
    deviceCategory: string | null;
    browser: string | null;
    os: string | null;
    city: string | null;
    country: string | null;
    createdAt: string;
  }>;
  blockedScans?: Array<{
    id: string;
    cardStatus: string;
    deviceCategory: string | null;
    city: string | null;
    country: string | null;
    createdAt: string;
  }>;
}

export function AdminCardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.systemRole === 'super_admin';
  const { can } = useAdminPermissions();
  const canManage = can('cards.manage');

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [page, setPage] = useState(1);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalCard, setQrModalCard] = useState<AdminCardRow | null>(null);
  const [nfcNotice, setNfcNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regProductId, setRegProductId] = useState('');
  const [regChipUid, setRegChipUid] = useState('');

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState('10');
  const [bulkUidsText, setBulkUidsText] = useState('');

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'profile' | 'customer'>('profile');
  const [profileSearch, setProfileSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [pendingOwner, setPendingOwner] = useState<{ id: string; name: string; email: string } | null>(
    null,
  );
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [statusPrompt, setStatusPrompt] = useState<{
    status: 'SUSPENDED' | 'LOST';
    reason: string;
  } | null>(null);

  const [issueCustomer, setIssueCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
  } | null>(null);
  const [issueCustomerSearch, setIssueCustomerSearch] = useState('');
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueOrderId, setIssueOrderId] = useState('');
  const [issueProfileId, setIssueProfileId] = useState('');
  const [issueNote, setIssueNote] = useState('');
  const [issueFormError, setIssueFormError] = useState<string | null>(null);
  const [issueResult, setIssueResult] = useState<{
    count: number;
    orderId: string;
    orderNumber: string;
    customer: { id: string; name: string; email: string };
    items: AdminCardRow[];
  } | null>(null);

  const [bulkCustomer, setBulkCustomer] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [bulkCustomerSearch, setBulkCustomerSearch] = useState('');
  const [bulkOrderId, setBulkOrderId] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkFormError, setBulkFormError] = useState<string | null>(null);

  const productsQuery = useQuery<{ items: Array<{ id: string; name: string; material: string }> }>({
    queryKey: ['admin-products-list'],
    queryFn: () => ApiClient.get('/api/v1/admin/products'),
  });

  const cardsQuery = useQuery<{ items: AdminCardRow[]; total: number; pageSize: number }>({
    queryKey: ['admin-cards', q, statusFilter, productFilter, assignedFilter, orderIdFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (productFilter !== 'ALL') params.set('productId', productFilter);
      if (assignedFilter !== 'ALL') params.set('assigned', assignedFilter);
      if (orderIdFilter.trim()) params.set('orderId', orderIdFilter.trim());
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get(`/api/v1/admin/cards?${params.toString()}`);
    },
  });

  // Support deep link /admin/cards?card=TPZBEA543
  useEffect(() => {
    const deepCard = searchParams.get('card');
    if (deepCard && cardsQuery.data?.items && !selectedCardId) {
      const match = cardsQuery.data.items.find(
        (c) => c.cardCode === deepCard || c.id === deepCard,
      );
      if (match) setSelectedCardId(match.id);
    }
  }, [searchParams, cardsQuery.data?.items, selectedCardId]);

  const openCardModal = (card: AdminCardRow) => {
    setSelectedCardId(card.id);
    setPickerModalOpen(false);
    setPendingOwner(null);
    setProfileSearch('');
    setCustomerSearch('');
    const next = new URLSearchParams(searchParams);
    next.set('card', card.cardCode || card.id);
    setSearchParams(next, { replace: true });
  };

  const closeCardModal = () => {
    setSelectedCardId(null);
    setPickerModalOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('card');
    setSearchParams(next, { replace: true });
  };

  const detailQuery = useQuery<CardDetailResponse>({
    queryKey: ['admin-card-detail', selectedCardId],
    queryFn: async () => {
      return ApiClient.get<CardDetailResponse>(`/api/v1/admin/cards/${selectedCardId}`);
    },
    enabled: Boolean(selectedCardId),
  });

  const assignableQuery = useQuery<{
    owner: { id: string; name: string; email: string; plan: string } | null;
    allowsMultipleCards: boolean;
    profiles: Array<{
      id: string;
      displayName: string;
      slug: string;
      profileType: string;
      templateId: string;
      status: string;
      hasCard: boolean;
      attachedCardCode: string | null;
    }>;
  }>({
    queryKey: ['admin-card-assignable-profiles', selectedCardId, profileSearch],
    queryFn: () => {
      const p = new URLSearchParams();
      if (profileSearch.trim()) p.set('search', profileSearch.trim());
      return ApiClient.get(
        `/api/v1/admin/cards/${selectedCardId}/assignable-profiles?${p.toString()}`,
      );
    },
    enabled: Boolean(selectedCardId),
  });

  const customerSearchQuery = useQuery<{
    items: Array<{ id: string; name: string; email: string }>;
  }>({
    queryKey: ['admin-card-customer-picker', customerSearch],
    queryFn: () => {
      const p = new URLSearchParams();
      if (customerSearch.trim()) p.set('q', customerSearch.trim());
      p.set('pageSize', '15');
      return ApiClient.get(`/api/v1/admin/users?${p.toString()}`);
    },
    enabled: Boolean(selectedCardId) && pickerModalOpen && pickerMode === 'customer',
  });

  const issueCustomerSearchQuery = useQuery<{
    items: Array<{ id: string; name: string; email: string; phoneNumber?: string | null; status?: string }>;
  }>({
    queryKey: ['admin-issue-customer-search', issueCustomerSearch],
    queryFn: () => {
      const p = new URLSearchParams();
      if (issueCustomerSearch.trim()) p.set('q', issueCustomerSearch.trim());
      p.set('status', 'active');
      p.set('pageSize', '12');
      return ApiClient.get(`/api/v1/admin/users?${p.toString()}`);
    },
    enabled: registerOpen && !issueCustomer,
  });

  const bulkCustomerSearchQuery = useQuery<{
    items: Array<{ id: string; name: string; email: string; status?: string }>;
  }>({
    queryKey: ['admin-bulk-customer-search', bulkCustomerSearch],
    queryFn: () => {
      const p = new URLSearchParams();
      if (bulkCustomerSearch.trim()) p.set('q', bulkCustomerSearch.trim());
      p.set('status', 'active');
      p.set('pageSize', '12');
      return ApiClient.get(`/api/v1/admin/users?${p.toString()}`);
    },
    enabled: bulkOpen && !bulkCustomer,
  });

  const issueContextQuery = useQuery<{
    customer: { id: string; name: string; email: string };
    orders: Array<{ id: string; orderNumber: string; orderType?: string; quantity: number }>;
    profiles: Array<{ id: string; displayName: string; slug: string; profileType: string; status: string }>;
  }>({
    queryKey: ['admin-issue-context', issueCustomer?.id],
    queryFn: () => ApiClient.get(`/api/v1/admin/cards/issue-context/${issueCustomer!.id}`),
    enabled: Boolean(issueCustomer?.id) && registerOpen,
  });

  const registerMutation = useMutation({
    mutationFn: () => {
      if (!issueCustomer) throw new Error('Please select a customer.');
      if (!regProductId) throw new Error('Please select a product.');
      return ApiClient.post<{
        count: number;
        orderId: string;
        orderNumber: string;
        customer: { id: string; name: string; email: string };
        items: AdminCardRow[];
      }>('/api/v1/admin/cards/register', {
        userId: issueCustomer.id,
        productId: regProductId,
        quantity: issueQuantity,
        orderId: issueOrderId || null,
        chipUid: issueQuantity === 1 ? regChipUid.trim() || null : null,
        profileId: issueProfileId || null,
        note: issueNote.trim() || null,
      });
    },
    onSuccess: (res) => {
      setIssueFormError(null);
      setErrorMsg(null);
      setRegisterOpen(false);
      setRegChipUid('');
      setIssueQuantity(1);
      setIssueOrderId('');
      setIssueProfileId('');
      setIssueNote('');
      setIssueResult(res);
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => setIssueFormError(err.message || 'Failed to issue card.'),
  });

  const bulkRegisterMutation = useMutation({
    mutationFn: () => {
      const chipUids = bulkUidsText
        .split(/[\n,;]+/)
        .map((s) => s.trim())
      if (!bulkCustomer) throw new Error('Please select a customer.');
      if (!bulkProductId) throw new Error('Please select a product.');
      const lines = bulkUidsText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const rows = lines
        .filter((l, idx) => !(idx === 0 && l.toLowerCase().startsWith('chip_uid')))
        .map((line) => {
          const [chipUid, profileUsername] = line.split(',').map((s) => s.trim());
          return {
            chipUid: chipUid || undefined,
            profileUsername: profileUsername || undefined,
          };
        });
      if (rows.length === 0) {
        throw new Error('Please provide at least one CSV row.');
      }
      return ApiClient.post<{
        count: number;
        orderId: string;
        orderNumber: string;
        customer: { id: string; name: string; email: string };
        items: AdminCardRow[];
      }>('/api/v1/admin/cards/bulk-register', {
        userId: bulkCustomer.id,
        productId: bulkProductId,
        orderId: bulkOrderId || null,
        note: bulkNote.trim() || null,
        rows,
      });
    },
    onSuccess: (res) => {
      setBulkFormError(null);
      setErrorMsg(null);
      setBulkOpen(false);
      setBulkUidsText('');
      setBulkOrderId('');
      setBulkNote('');
      setIssueResult(res);
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: Error) => setBulkFormError(err.message || 'Failed to bulk issue cards.'),
  });

  const updateCardMutation = useMutation({
    mutationFn: (payload: {
      cardId: string;
      userId?: string | null;
      profileId?: string | null;
      status?: CardStatus;
      statusReason?: string | null;
    }) =>
      ApiClient.patch(`/api/v1/admin/cards/${payload.cardId}`, {
        userId: payload.userId,
        profileId: payload.profileId,
        status: payload.status,
        statusReason: payload.statusReason,
      }),
    onSuccess: (_res, vars) => {
      setErrorMsg(null);
      if (vars.profileId) setPickerModalOpen(false);
      if (vars.userId !== undefined) {
        setPendingOwner(null);
        setPickerMode('profile');
      }
      if (vars.status) {
        setStatusPrompt(null);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-card-detail', selectedCardId] });
      queryClient.invalidateQueries({
        queryKey: ['admin-card-assignable-profiles', selectedCardId],
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to update card.'),
  });

  const regenerateUrlMutation = useMutation({
    mutationFn: (cardId: string) => ApiClient.post(`/api/v1/admin/cards/${cardId}/regenerate-url`),
    onSuccess: () => {
      setConfirmRegen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-card-detail', selectedCardId] });
    },
    onError: (err: Error) => setErrorMsg(err.message || 'Failed to regenerate URL.'),
  });

  const getCardUrl = (card: AdminCardRow) => resolveCardPublicUrl(card);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWriteToTag = async (url: string) => {
    const win = window as any;
    if (typeof win.NDEFReader === 'function') {
      try {
        const ndef = new win.NDEFReader();
        await ndef.write({ records: [{ recordType: 'url', data: url }] });
        setNfcNotice(`Written ${url} to NFC tag successfully.`);
      } catch (err: any) {
        setNfcNotice(`Web NFC write cancelled or failed: ${err?.message || 'Unknown error'}`);
      }
    } else {
      copyToClipboard(url, 'nfc-fallback');
      setNfcNotice(`Web NFC is not supported on this browser. URL copied: ${url} — paste into NFC Tools.`);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkUidsText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const columns: ColumnDef<AdminCardRow>[] = [
    {
      key: 'cardCode',
      header: 'Card ID',
      render: (c) => (
        <div>
          <div className="font-mono font-bold text-[var(--ink)]">{c.cardCode || c.id}</div>
          <div className="text-[11px] text-[var(--ink-muted)] truncate max-w-[180px]">
            {c.ownerName || 'Unassigned'}
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (c) => (
        <div>
          <div className="font-medium text-[var(--ink)]">{c.productName || 'Custom Card'}</div>
          <div className="text-[11px] text-[var(--ink-muted)] uppercase">
            {c.material} {c.variantName ? `· ${c.variantName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const st = normalizeCardStatus(c.status);
        return <StatusBadge status={st} label={CARD_STATUS_LABELS[st]} />;
      },
    },
    {
      key: 'profile',
      header: 'Profile & Owner',
      render: (c) =>
        c.profileName ? (
          <div>
            <div className="font-medium text-[var(--ink)]">
              {c.profileName} <span className="text-[var(--ink-muted)]">(/{c.profileSlug})</span>
            </div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              {c.ownerName || '—'} {c.ownerEmail ? `· ${c.ownerEmail}` : ''}
            </div>
          </div>
        ) : c.ownerName || c.ownerEmail ? (
          <div>
            <div className="text-[var(--ink-muted)]">Unassigned</div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              {c.ownerName || '—'} {c.ownerEmail ? `· ${c.ownerEmail}` : ''}
            </div>
          </div>
        ) : (
          <span className="text-[var(--ink-subtle)]">Unassigned</span>
        ),
    },
    {
      key: 'orderNumber',
      header: 'Order ID',
      render: (c) =>
        c.orderNumber || c.orderId ? (
          <span className="font-mono text-[11px] text-[var(--ink)]">
            #{c.orderNumber || c.orderId}
          </span>
        ) : (
          <span className="text-[var(--ink-subtle)]">—</span>
        ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (c) => {
        const url = getCardUrl(c);
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => copyToClipboard(url, c.id)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-[var(--border)] bg-[var(--bg-raised)] text-[11px] font-mono text-[var(--ink)] hover:border-[var(--accent)]"
              title={`Copy ${url}`}
            >
              {copiedId === c.id ? (
                <Check className="w-3 h-3 text-[var(--success)]" />
              ) : (
                <Copy className="w-3 h-3 text-[var(--ink-muted)]" />
              )}
              <span className="truncate max-w-[180px]">{url.replace(/^https?:\/\//i, '')}</span>
            </button>
            <button
              type="button"
              onClick={() => setQrModalCard(c)}
              className="p-1.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'taps',
      header: 'Taps & Dates',
      render: (c) => (
        <div className="text-[11px] text-[var(--ink-muted)] tabular-nums">
          <div className="font-semibold text-[var(--ink)]">{c.tapCount || 0} taps</div>
          <div>
            Issued: {new Date(c.createdAt).toLocaleDateString('en-IN')}
            {c.assignedAt ? ` · Assigned: ${new Date(c.assignedAt).toLocaleDateString('en-IN')}` : ''}
          </div>
        </div>
      ),
    },
  ];

  const activeCard = detailQuery.data?.card;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <AdminPageHeader
        title="NFC Cards"
        subtitle="Cards issued to customers, profile assignment, and tap logs"
        action={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setBulkFormError(null);
                  setBulkOpen(true);
                }}
                className="min-h-[44px] md:min-h-[36px]"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Bulk Issue
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  setIssueFormError(null);
                  setRegisterOpen(true);
                }}
                className="min-h-[44px] md:min-h-[36px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Issue Card
              </Button>
            </div>
          ) : undefined
        }
      />

      {nfcNotice && (
        <div className="p-3 rounded-[12px] bg-[var(--accent-tint)] border border-[var(--accent-border)] text-xs text-[var(--accent-text)] flex items-center justify-between gap-2">
          <span>{nfcNotice}</span>
          <button type="button" onClick={() => setNfcNotice(null)} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={cardsQuery.data?.items ?? []}
        loading={cardsQuery.isLoading}
        keyExtractor={(c) => c.id}
        onRowClick={openCardModal}
        searchValue={q}
        onSearchChange={(v) => {
          setQ(v);
          setPage(1);
        }}
        searchPlaceholder="Search card ID, profile, owner or order ID…"
        filters={[
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
              { label: 'Unassigned', value: 'UNASSIGNED' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Lost', value: 'LOST' },
            ],
          },
          {
            key: 'productId',
            label: 'Product',
            value: productFilter,
            onChange: (v) => {
              setProductFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Products', value: 'ALL' },
              ...(productsQuery.data?.items ?? []).map((p) => ({
                label: p.name,
                value: p.id,
              })),
            ],
          },
          {
            key: 'assigned',
            label: 'Assignment',
            value: assignedFilter,
            onChange: (v) => {
              setAssignedFilter(v);
              setPage(1);
            },
            options: [
              { label: 'All Cards', value: 'ALL' },
              { label: 'Assigned', value: 'assigned' },
              { label: 'Unassigned', value: 'unassigned' },
            ],
          },
        ]}
        toolbarExtra={
          <input
            type="text"
            value={orderIdFilter}
            onChange={(e) => {
              setOrderIdFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Filter Order ID..."
            className="min-h-[44px] md:min-h-[38px] px-3 py-2 text-xs bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px] w-36"
          />
        }
        page={page}
        pageSize={cardsQuery.data?.pageSize ?? 20}
        total={cardsQuery.data?.total ?? 0}
        onPageChange={setPage}
        emptyIcon={<CreditCard className="w-7 h-7" />}
        emptyTitle="No NFC cards found"
        emptyDescription="Issue a single card or bulk issue a batch to a customer to get started."
        emptyAction={
          canManage ? (
            <Button variant="accent" size="sm" onClick={() => setRegisterOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Issue Card
            </Button>
          ) : undefined
        }
      />

      {/* Register Single Card Modal */}
      {/* Issue NFC Card Modal (md) */}
      <Modal
        open={registerOpen}
        onClose={() => !registerMutation.isPending && setRegisterOpen(false)}
        title="Issue NFC Card"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={registerMutation.isPending}
              onClick={() => setRegisterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={registerMutation.isPending || !issueCustomer || !regProductId}
              onClick={() => registerMutation.mutate()}
            >
              {registerMutation.isPending ? 'Issuing...' : 'Issue Card'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-3.5 text-xs">
            {issueFormError && (
              <div className="p-2.5 rounded-[8px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)]">
                {issueFormError}
              </div>
            )}

            {/* Customer (required) */}
            <div>
              <label className="block font-medium text-[var(--ink)] mb-1">Product</label>
              <select
                value={regProductId}
                onChange={(e) => setRegProductId(e.target.value)}
                className="w-full min-h-[44px] md:min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              >
                <option value="">Default NFC Card</option>
                {(productsQuery.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.material.toUpperCase()})
                  </option>
                ))}
              </select>
              <label className="block font-semibold text-[var(--ink)] mb-1">Customer *</label>
              {issueCustomer ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)]">
                  <div className="min-w-0">
                    <span className="font-semibold text-[var(--ink)]">{issueCustomer.name}</span>
                    <span className="text-[var(--ink-muted)] ml-1.5">· {issueCustomer.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIssueCustomer(null);
                      setIssueOrderId('');
                      setIssueProfileId('');
                    }}
                    className="text-[11px] font-semibold text-[var(--accent-text)] hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--ink-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={issueCustomerSearch}
                      onChange={(e) => setIssueCustomerSearch(e.target.value)}
                      placeholder="Search active customers by name, email, or phone..."
                      className="w-full min-h-[40px] pl-8 pr-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-[8px]">
                    {(issueCustomerSearchQuery.data?.items ?? []).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setIssueCustomer(u)}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--bg-raised)] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--ink)] truncate">{u.name}</div>
                          <div className="text-[11px] text-[var(--ink-muted)] truncate">
                            {u.email}{u.phoneNumber ? ` · ${u.phoneNumber}` : ''}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--accent-text)] shrink-0">Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product (required) & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--ink)] mb-1">Product *</label>
                <select
                  value={regProductId}
                  onChange={(e) => setRegProductId(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                >
                  <option value="">Select active product...</option>
                  {(productsQuery.data?.items ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.material.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">Quantity (1–50)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
            </div>

            {/* Order (optional) & Profile (optional) */}
            {issueCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">Order (optional)</label>
                  <select
                    value={issueOrderId}
                    onChange={(e) => setIssueOrderId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  >
                    <option value="">Create new admin-issued order (₹0)</option>
                    {(issueContextQuery.data?.orders ?? []).map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.orderNumber} ({o.quantity}x)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[var(--ink)] mb-1">Assign Profile (optional)</label>
                  <select
                    value={issueProfileId}
                    onChange={(e) => setIssueProfileId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  >
                    <option value="">Leave unassigned for now</option>
                    {(issueContextQuery.data?.profiles ?? []).map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.displayName} (/{pr.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {issueQuantity === 1 && (
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">Chip UID (optional)</label>
                <input
                  type="text"
                  value={regChipUid}
                  onChange={(e) => setRegChipUid(e.target.value)}
                  placeholder="e.g. 04:A1:B2:C3:D4:E5:F6"
                  className="w-full min-h-[40px] px-3 py-2 font-mono bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-[var(--ink)] mb-1">Chip UID (optional)</label>
              <label className="block font-semibold text-[var(--ink)] mb-1">Note to customer (optional)</label>
              <input
                type="text"
                value={regChipUid}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="Shown in the customer's notification..."
                className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Register Modal */}
      {/* Bulk Issue Modal (md) */}
      <Modal
        open={bulkOpen}
        onClose={() => !bulkRegisterMutation.isPending && setBulkOpen(false)}
        title="Bulk Issue NFC Cards"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={bulkRegisterMutation.isPending}
              onClick={() => setBulkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={bulkRegisterMutation.isPending || !bulkCustomer || !bulkProductId}
              onClick={() => bulkRegisterMutation.mutate()}
            >
              {bulkRegisterMutation.isPending ? 'Issuing Batch...' : 'Bulk Issue'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[var(--ink)] mb-1">Product</label>
              <select
                value={bulkProductId}
                onChange={(e) => setBulkProductId(e.target.value)}
                className="w-full min-h-[44px] md:min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              >
                <option value="">Default NFC Card</option>
                {(productsQuery.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">Customer *</label>
              {bulkCustomer ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)]">
                  <span className="font-semibold text-[var(--ink)] truncate">
                    {bulkCustomer.name} · {bulkCustomer.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkCustomer(null)}
                    className="text-[11px] font-semibold text-[var(--accent-text)] hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={bulkCustomerSearch}
                    onChange={(e) => setBulkCustomerSearch(e.target.value)}
                    placeholder="Search active customers..."
                    className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                  />
                  <div className="max-h-32 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-[8px]">
                    {(bulkCustomerSearchQuery.data?.items ?? []).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setBulkCustomer(u)}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--bg-raised)] flex items-center justify-between"
                      >
                        <span className="truncate">{u.name} · {u.email}</span>
                        <span className="text-[11px] font-semibold text-[var(--accent-text)]">Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-[var(--ink)]">
                  Paste Chip UIDs (one per line or comma-separated)
                </label>
                <label className="text-[11px] font-semibold text-[var(--accent-text)] cursor-pointer hover:underline">
                  Upload CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
                </label>
              </div>
              <textarea
                rows={4}
                value={bulkUidsText}
                onChange={(e) => setBulkUidsText(e.target.value)}
                placeholder="04:A1:B2:C3:D4:E5:01&#10;04:A1:B2:C3:D4:E5:02"
                className="w-full px-3 py-2 font-mono bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              />
            </div>
            <div>
              <label className="block font-medium text-[var(--ink)] mb-1">
                Quantity (if no UIDs)
              </label>
              ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={bulkCustomerSearch}
                  onChange={(e) => setBulkCustomerSearch(e.target.value)}
                  placeholder="Search active customers..."
                  className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
                <div className="max-h-32 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-[8px]">
                  {(bulkCustomerSearchQuery.data?.items ?? []).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setBulkCustomer(u)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--bg-raised)] flex items-center justify-between"
                    >
                      <span className="truncate">{u.name} · {u.email}</span>
                      <span className="text-[11px] font-semibold text-[var(--accent-text)]">Select</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">Product *</label>
              <select
                value={bulkProductId}
                onChange={(e) => setBulkProductId(e.target.value)}
                className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              >
                <option value="">Select active product...</option>
                {(productsQuery.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.material.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[var(--ink)]">
                  CSV Rows (profile_username, optional)
                </label>
                <label className="text-[11px] font-semibold text-[var(--accent-text)] cursor-pointer hover:underline">
                  Upload CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
                </label>
              </div>
              <textarea
                rows={4}
                value={bulkUidsText}
                onChange={(e) => setBulkUidsText(e.target.value)}
                placeholder="04:A1:B2:C3:D4:E5:01,alex&#10;04:A1:B2:C3:D4:E5:02,"
                className="w-full px-3 py-2 font-mono bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Issue Result Modal */}
      <Modal
        open={Boolean(issueResult)}
        onClose={() => setIssueResult(null)}
        title={
          issueResult && issueResult.count === 1
            ? `Card ${issueResult.items[0]?.cardCode || ''} issued to ${issueResult.customer.name}`
            : `${issueResult?.count || 0} Cards issued to ${issueResult?.customer.name || ''}`
        }
        subtitle={issueResult ? `Order #${issueResult.orderNumber}` : undefined}
        size="md"
        footer={
          <div className="flex flex-wrap justify-between gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIssueResult(null);
                setRegisterOpen(true);
              }}
            >
              Issue another
            </Button>
            <div className="flex gap-2">
              {issueResult && issueResult.count === 1 && issueResult.items[0] && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    const c = issueResult.items[0];
                    setIssueResult(null);
                    openCardModal(c);
                  }}
                >
                  Open card
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setIssueResult(null)}>
                Done
              </Button>
            </div>
          </div>
        }
      >
        {issueResult && issueResult.count === 1 && issueResult.items[0] ? (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)] space-y-1">
              <div className="text-[var(--ink-muted)]">Card Code</div>
              <div className="font-mono font-bold text-sm text-[var(--ink)]">{issueResult.items[0].cardCode}</div>
              <div className="text-[var(--ink-muted)] pt-1">Permanent URL</div>
              <div className="font-mono text-[var(--ink)] break-all">{getCardUrl(issueResult.items[0])}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(getCardUrl(issueResult.items[0]), 'issued-url')}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                {copiedId === 'issued-url' ? 'Copied' : 'Copy URL'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQrModalCard(issueResult.items[0])}
              >
                <QrCode className="w-3.5 h-3.5 mr-1" />
                QR Code
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleWriteToTag(getCardUrl(issueResult.items[0]))}
              >
                <Wifi className="w-3.5 h-3.5 mr-1" />
                Write to Tag
              </Button>
            </div>
          </div>
        ) : issueResult ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const csv = ['card_code,url', ...issueResult.items.map((it) => `${it.cardCode},${getCardUrl(it)}`)].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `issued-cards-${issueResult.orderNumber}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download CSV
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-[var(--border)] rounded-[8px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-raised)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2">Card Code</th>
                    <th className="px-3 py-2">Permanent URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {issueResult.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 font-mono font-semibold">{it.cardCode}</td>
                      <td className="px-3 py-2 font-mono break-all">{getCardUrl(it)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        open={Boolean(qrModalCard)}
        onClose={() => setQrModalCard(null)}
        title={`Card QR · ${qrModalCard?.cardCode || qrModalCard?.id || ''}`}
        size="sm"
        footer={
          qrModalCard && (
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(getCardUrl(qrModalCard), 'qr-modal')}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy URL
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleWriteToTag(getCardUrl(qrModalCard))}
              >
                <Wifi className="w-3.5 h-3.5 mr-1" />
                Write to Tag
              </Button>
            </div>
          )
        }
      >
        {qrModalCard && (
          <div className="p-4 rounded-[12px] bg-[var(--bg-raised)] border border-[var(--border)] space-y-2 text-center">
            <QrCode className="w-24 h-24 mx-auto text-[var(--ink)]" />
            <div className="font-mono text-xs text-[var(--ink)] break-all">
              {getCardUrl(qrModalCard)}
            </div>
          </div>
        )}
      </Modal>

      {/* NFC Card Detail Modal (lg) */}
      <Modal
        open={Boolean(selectedCardId)}
        onClose={closeCardModal}
        title={activeCard ? activeCard.cardCode || activeCard.id : 'NFC Card'}
        subtitle={activeCard?.productName || 'Physical NFC Card'}
        headerBadge={
          activeCard ? (
            <StatusBadge
              status={normalizeCardStatus(activeCard.status)}
              label={CARD_STATUS_LABELS[normalizeCardStatus(activeCard.status)]}
            />
          ) : undefined
        }
        size="lg"
        footer={
          activeCard && (
            <>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-none border-emerald-500/60 text-emerald-700 hover:bg-emerald-50 disabled:opacity-45"
                  disabled={updateCardMutation.isPending || normalizeCardStatus(activeCard.status) === 'ACTIVE'}
                  onClick={() => updateCardMutation.mutate({ cardId: activeCard.id, status: 'ACTIVE' })}
                >
                  Mark Active
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-none bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-45"
                  disabled={updateCardMutation.isPending || normalizeCardStatus(activeCard.status) === 'SUSPENDED'}
                  onClick={() => setStatusPrompt({ status: 'SUSPENDED', reason: '' })}
                >
                  Mark Suspended
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[36px] flex-1 sm:flex-none bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 disabled:opacity-45"
                  disabled={updateCardMutation.isPending || normalizeCardStatus(activeCard.status) === 'LOST'}
                  onClick={() => setStatusPrompt({ status: 'LOST', reason: '' })}
                >
                  Mark Lost
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[44px] sm:min-h-[36px] w-full sm:w-auto"
                onClick={closeCardModal}
              >
                Close
              </Button>
            </>
          )
        }
      >
        {detailQuery.isLoading || !activeCard ? (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)]">Loading card...</div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Top Box: Card URL */}
            <div className="p-3.5 rounded-[12px] bg-[var(--bg-raised)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-[var(--ink-muted)]">
                  Card URL
                </div>
                <div className="font-mono text-xs text-[var(--ink)] break-all mt-0.5">
                  {getCardUrl(activeCard)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[34px]"
                  onClick={() => copyToClipboard(getCardUrl(activeCard), 'modal-url')}
                >
                  {copiedId === 'modal-url' ? (
                    <Check className="w-3.5 h-3.5 mr-1 text-[var(--success)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  Copy URL
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[34px]"
                  onClick={() => setQrModalCard(activeCard)}
                >
                  <QrCode className="w-3.5 h-3.5 mr-1" />
                  QR
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="min-h-[44px] sm:min-h-[34px]"
                  onClick={() => handleWriteToTag(getCardUrl(activeCard))}
                >
                  <Wifi className="w-3.5 h-3.5 mr-1" />
                  Write to Tag
                </Button>
              </div>
            </div>

            {/* Two Columns on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Assigned Profile, Owner, Order, Dates, Danger Zone */}
              <div className="space-y-4">
                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">Assigned Profile</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeCard.profileId ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="min-h-[44px] sm:min-h-[32px]"
                            onClick={() => {
                              setPickerMode('profile');
                              setPickerModalOpen(true);
                            }}
                          >
                            Reassign
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="min-h-[44px] sm:min-h-[32px]"
                            onClick={() =>
                              updateCardMutation.mutate({ cardId: activeCard.id, profileId: null })
                            }
                          >
                            Unassign
                          </Button>
                        </>
                      ) : (
                        assignableQuery.data?.owner && (
                          <Button
                            variant="accent"
                            size="sm"
                            className="min-h-[44px] sm:min-h-[32px]"
                            onClick={() => {
                              setPickerMode('profile');
                              setPickerModalOpen(true);
                            }}
                          >
                            Assign Profile
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  {activeCard.profileName && activeCard.profileSlug ? (
                    <div className="p-3 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--ink)] truncate">
                          {activeCard.profileName}
                        </div>
                        <div className="text-[var(--ink-muted)] truncate font-mono text-[11px]">
                          {buildProfileUrl({
                            slug: activeCard.profileSlug,
                            profileType: activeCard.profileType,
                          })}
                        </div>
                      </div>
                      <a
                        href={buildProfileUrl({
                          slug: activeCard.profileSlug,
                          profileType: activeCard.profileType,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] sm:min-h-[34px] px-3 inline-flex items-center gap-1 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--accent-text)] font-semibold shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    </div>
                  ) : (
                    <p className="text-[var(--ink-muted)]">No profile assigned</p>
                  )}
                </div>

                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">Owner</span>
                    {activeCard.ownerId && (
                      <button
                        type="button"
                        onClick={() => {
                          const q = activeCard.ownerEmail || activeCard.ownerName || '';
                          closeCardModal();
                          navigate(`/admin/users?q=${encodeURIComponent(q)}`);
                        }}
                        className="text-[11px] font-semibold text-[var(--accent-text)] hover:underline min-h-[44px] sm:min-h-0 inline-flex items-center"
                      >
                        View user
                      </button>
                    )}
                  </div>
                  {activeCard.ownerName || assignableQuery.data?.owner ? (
                    <div className="space-y-0.5 text-xs">
                      <div className="font-semibold text-[var(--ink)]">
                        {activeCard.ownerName || assignableQuery.data?.owner?.name}
                      </div>
                      <div className="text-[var(--ink-muted)]">
                        {activeCard.ownerEmail || assignableQuery.data?.owner?.email}
                      </div>
                      {activeCard.ownerPhone && (
                        <div className="text-[var(--ink-muted)]">{activeCard.ownerPhone}</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[var(--ink-muted)]">Unassigned</p>
                  )}
                </div>

                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-2">
                  <span className="font-bold text-[var(--ink)] block">Order</span>
                  {activeCard.orderNumber ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ord = activeCard.orderNumber || '';
                        closeCardModal();
                        navigate(`/admin/orders?q=${encodeURIComponent(ord)}`);
                      }}
                      className="font-mono text-xs font-semibold text-[var(--accent-text)] hover:underline min-h-[44px] sm:min-h-0 inline-flex items-center"
                    >
                      {activeCard.orderNumber}
                    </button>
                  ) : (
                    <span className="text-[var(--ink-muted)]">No linked order</span>
                  )}
                </div>

                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-1.5 text-xs">
                  <span className="font-bold text-[var(--ink)] block mb-1">Dates</span>
                  <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                    <span>Issued</span>
                    <span className="text-[var(--ink)]">
                      {new Date(activeCard.issuedAt || activeCard.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {activeCard.assignedAt && (
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>Assigned</span>
                      <span className="text-[var(--ink)]">
                        {new Date(activeCard.assignedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {activeCard.statusChangedAt && (
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>Last status change</span>
                      <span className="text-[var(--ink)]">
                        {new Date(activeCard.statusChangedAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {activeCard.statusReason && (
                    <div className="pt-1 text-[var(--ink-muted)]">
                      Reason: <span className="text-[var(--ink)]">{activeCard.statusReason}</span>
                    </div>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="p-4 rounded-[12px] border border-[var(--danger)]/30 bg-[var(--danger)]/5 space-y-2">
                    <span className="font-bold text-[var(--danger)] block">Danger zone</span>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Regenerating the URL invalidates the physical tag until rewritten.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px] sm:min-h-[34px]"
                      onClick={() => setConfirmRegen(true)}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Regenerate URL
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column: Tap Statistics */}
              <div className="space-y-4">
                <div className="p-4 rounded-[12px] border border-[var(--border)] space-y-4">
                  <span className="font-bold text-[var(--ink)] block">Tap Statistics</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--ink-muted)] uppercase">Total</div>
                      <div className="text-base font-bold text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.totalTaps ?? activeCard.tapCount ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--ink-muted)] uppercase">7 Days</div>
                      <div className="text-base font-bold text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.taps7d ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--ink-muted)] uppercase">30 Days</div>
                      <div className="text-base font-bold text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.taps30d ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>First tap</span>
                      <span className="text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.firstTapAt
                          ? new Date(detailQuery.data.tapStats.firstTapAt).toLocaleString('en-IN')
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>Last tap</span>
                      <span className="text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.lastTapAt
                          ? new Date(detailQuery.data.tapStats.lastTapAt).toLocaleString('en-IN')
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>Last location</span>
                      <span className="text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.lastTapLocation || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[var(--ink-muted)]">
                      <span>Last device</span>
                      <span className="text-[var(--ink)]">
                        {detailQuery.data?.tapStats?.lastTapDevice || '—'}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const series = detailQuery.data?.tapStats?.dailyTaps14d ?? [];
                    const maxVal = Math.max(1, ...series.map((d) => d.count));
                    return (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-[var(--ink-muted)]">
                          Last 14 days
                        </div>
                        <div className="h-16 flex items-end gap-1 pt-2">
                          {series.length === 0 ? (
                            <div className="text-[11px] text-[var(--ink-subtle)]">No data</div>
                          ) : (
                            series.map((d) => (
                              <div
                                key={d.date}
                                title={`${d.date}: ${d.count} taps`}
                                className="flex-1 bg-[var(--accent)]/80 hover:bg-[var(--accent)] rounded-t-[2px] min-h-[3px] transition-all"
                                style={{ height: `${Math.max(6, Math.round((d.count / maxVal) * 100))}%` }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {(normalizeCardStatus(activeCard.status) === 'SUSPENDED' ||
                    normalizeCardStatus(activeCard.status) === 'LOST') && (
                      <div className="p-3 rounded-[8px] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs space-y-1">
                        <div className="font-semibold text-[var(--danger)]">
                          Blocked scans: {(detailQuery.data?.blockedScans ?? []).length}
                        </div>
                        {(detailQuery.data?.blockedScans ?? [])[0] && (
                          <div className="text-[var(--ink-muted)]">
                            Last attempt:{' '}
                            {new Date(
                              (detailQuery.data?.blockedScans ?? [])[0].createdAt,
                            ).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Full Width Below: Recent Tap History */}
            <div className="rounded-[12px] border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-2.5 bg-[var(--bg-raised)] border-b border-[var(--border)] flex items-center justify-between">
                <span className="font-bold text-[var(--ink)]">Recent Tap History</span>
                {(detailQuery.data?.tapHistory ?? []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      closeCardModal();
                      navigate('/admin/analytics');
                    }}
                    className="text-[11px] font-semibold text-[var(--accent-text)] hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>
              {(detailQuery.data?.tapHistory ?? []).length === 0 ? (
                <div className="p-4 text-center text-[var(--ink-muted)]">
                  No tap events recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-raised)]/60 border-b border-[var(--border)] text-[var(--ink-muted)]">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Time</th>
                        <th className="px-4 py-2 font-semibold">Location</th>
                        <th className="px-4 py-2 font-semibold">Device</th>
                        <th className="px-4 py-2 font-semibold text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {(detailQuery.data?.tapHistory ?? []).map((ev) => (
                        <tr key={ev.id}>
                          <td className="px-4 py-2 text-[var(--ink-muted)]">
                            {new Date(ev.createdAt).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2 text-[var(--ink-muted)]">
                            {ev.city || ev.country || 'Unknown'}
                          </td>
                          <td className="px-4 py-2 text-[var(--ink-muted)]">
                            {ev.deviceCategory || 'device'} · {ev.os || 'OS'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium uppercase text-[var(--ink)]">
                            {ev.eventType}
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
      </Modal>

      {/* Stacked Modal: Select Customer or Assign Profile */}
      <Modal
        open={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        title={pickerMode === 'customer' ? 'Select Customer' : 'Assign Profile'}
        subtitle={
          pickerMode === 'profile' && assignableQuery.data?.owner
            ? `Showing profiles of ${assignableQuery.data.owner.name} · ${assignableQuery.data.owner.email}`
            : 'Choose the customer who owns this NFC card'
        }
        size="md"
        darkerBackdrop
        footer={
          < div className="flex justify-end w-full" >
            <Button variant="secondary" size="sm" onClick={() => setPickerModalOpen(false)}>
              Close
            </Button>
          </div >
        }
      >
        {pickerMode === 'customer' ? (
          <div className="space-y-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--ink-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers by name or email..."
                className="w-full min-h-[44px] pl-8 pr-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-[8px]">
              {(customerSearchQuery.data?.items ?? []).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    if (activeCard?.profileId) {
                      setPendingOwner(u);
                    } else if (activeCard) {
                      updateCardMutation.mutate({ cardId: activeCard.id, userId: u.id });
                    }
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 text-left hover:bg-[var(--bg-raised)] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--ink)] truncate">{u.name}</div>
                    <div className="text-[11px] text-[var(--ink-muted)] truncate">{u.email}</div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--accent-text)] shrink-0">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--ink-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="Search this customer's profiles..."
                className="w-full min-h-[44px] pl-8 pr-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
              />
            </div>

            {assignableQuery.isLoading ? (
              <div className="py-6 text-center text-[var(--ink-muted)]">Loading profiles...</div>
            ) : (assignableQuery.data?.profiles ?? []).length === 0 ? (
              <div className="p-6 rounded-[12px] bg-[var(--bg-raised)] border border-[var(--border)] text-center space-y-3">
                <p className="text-[var(--ink-muted)]">
                  This user hasn&apos;t created any profiles yet.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const em = assignableQuery.data?.owner?.email || '';
                    setPickerModalOpen(false);
                    closeCardModal();
                    navigate(`/admin/users?q=${encodeURIComponent(em)}`);
                  }}
                >
                  View user
                </Button>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-[8px]">
                {assignableQuery.data!.profiles.map((prof) => {
                  const blockedByExistingCard =
                    prof.hasCard && !assignableQuery.data?.allowsMultipleCards;
                  return (
                    <div
                      key={prof.id}
                      className="min-h-[44px] px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-[var(--bg-raised)]/60"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[var(--ink)] truncate">
                            {prof.displayName}
                          </span>
                          <span className="text-[11px] text-[var(--ink-muted)]">/{prof.slug}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-raised)] border border-[var(--border)] text-[10px] font-semibold uppercase text-[var(--ink)]">
                            {prof.profileType}
                          </span>
                          <StatusBadge status={prof.status} />
                          {prof.hasCard && (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--neutral-bg)] border border-[var(--neutral-border)] text-[10px] font-medium text-[var(--neutral-text)]">
                              Has card {prof.attachedCardCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="accent"
                        size="sm"
                        className="min-h-[44px] sm:min-h-[36px] px-3.5 shrink-0"
                        disabled={updateCardMutation.isPending || blockedByExistingCard}
                        title={
                          blockedByExistingCard
                            ? "This profile already has a card attached and the user's plan allows one card per profile"
                            : 'Assign card to this profile'
                        }
                        onClick={() =>
                          activeCard &&
                          updateCardMutation.mutate({
                            cardId: activeCard.id,
                            profileId: prof.id,
                          })
                        }
                      >
                        Assign
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Owner Change Modal (sm) */}
      <Modal
        open={Boolean(pendingOwner)}
        onClose={() => setPendingOwner(null)}
        title="Change Card Owner?"
        size="sm"
        darkerBackdrop
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setPendingOwner(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={updateCardMutation.isPending}
              onClick={() =>
                activeCard &&
                pendingOwner &&
                updateCardMutation.mutate({
                  cardId: activeCard.id,
                  userId: pendingOwner.id,
                  profileId: null,
                })
              }
            >
              Confirm Change
            </Button>
          </div>
        }
      >
        <p className="text-xs text-[var(--ink-muted)]">
          Changing the card owner to <strong>{pendingOwner?.name}</strong> will unassign the
          currently attached profile first. Continue?
        </p>
      </Modal>

      {/* Confirm Regenerate URL Modal (sm) */}
      <Modal
        open={confirmRegen}
        onClose={() => setConfirmRegen(false)}
        title="Regenerate Card URL?"
        size="sm"
        darkerBackdrop
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setConfirmRegen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={regenerateUrlMutation.isPending}
              onClick={() => activeCard && regenerateUrlMutation.mutate(activeCard.id)}
            >
              Confirm Regenerate
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-2.5 text-xs text-[var(--warning)] bg-[var(--warning-bg)] border border-[var(--warning-border)] p-3 rounded-[10px]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Warning: Regenerating this URL will permanently invalidate the old URL and previously
            written NFC tags will stop working.
          </span>
        </div>
      </Modal>

      {/* Confirm Suspend / Lost Status Modal (sm) */}
      <Modal
        open={Boolean(statusPrompt)}
        onClose={() => !updateCardMutation.isPending && setStatusPrompt(null)}
        title={
          statusPrompt?.status === 'LOST'
            ? 'Mark Card as Lost?'
            : 'Suspend NFC Card?'
        }
        size="sm"
        darkerBackdrop
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={updateCardMutation.isPending}
              onClick={() => setStatusPrompt(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={updateCardMutation.isPending}
              onClick={() =>
                activeCard &&
                statusPrompt &&
                updateCardMutation.mutate({
                  cardId: activeCard.id,
                  status: statusPrompt.status,
                  statusReason: statusPrompt.reason.trim() || null,
                })
              }
            >
              {updateCardMutation.isPending
                ? 'Updating...'
                : statusPrompt?.status === 'LOST'
                  ? 'Confirm Lost'
                  : 'Confirm Suspend'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-[var(--ink-muted)]">
            {statusPrompt?.status === 'LOST'
              ? 'Marking this card as lost will immediately block its public URL and lock it in the user dashboard. Profile assignment and tap history are preserved if reactivated later.'
              : 'Suspending this card will immediately block its public URL and lock it in the user dashboard until reactivated.'}
          </p>
          <div>
            <label className="block font-semibold text-[var(--ink)] mb-1">
              Reason (optional)
            </label>
            <textarea
              rows={3}
              value={statusPrompt?.reason || ''}
              onChange={(e) =>
                setStatusPrompt((prev) => (prev ? { ...prev, reason: e.target.value } : null))
              }
              placeholder="Enter an internal/support reason..."
              className="w-full px-3 py-2 rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink)]"
            />
          </div>
        </div>
      </Modal>
    </div >
  );
}
