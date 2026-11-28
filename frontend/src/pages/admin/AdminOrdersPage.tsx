import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Truck, Package, AlertCircle, X, User, CreditCard } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Modal } from '../../components/ui/modal';
import { CARD_STATUS_LABELS, normalizeCardStatus } from '../../lib/card-status';

interface AdminOrderRow {
  id: string;
  orderNumber: string;
  material: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phoneNumber?: string | null };
  items: Array<{ id: string; productName?: string; quantity: number }>;
  assignedCards?: Array<{ id: string; cardCode: string | null; status: string }>;
}

interface OrdersResponse {
  items: AdminOrderRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderDetailsResponse extends AdminOrderRow {
  shippingAddress: {
    recipientName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl: string | null;
  internalNotes: string | null;
  statusHistory: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
}

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = useAdminPermissions();
  const canManage = can('orders.manage');

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [fulfillTarget, setFulfillTarget] = useState<AdminOrderRow | null>(null);
  const [nextStatus, setNextStatus] = useState('CARD_PRODUCTION');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', q, orderStatusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (orderStatusFilter !== 'ALL') params.set('orderStatus', orderStatusFilter);
      params.set('page', String(page));
      params.set('pageSize', '20');
      return ApiClient.get<OrdersResponse>(`/api/v1/admin/orders?${params.toString()}`);
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery<OrderDetailsResponse>({
    queryKey: ['admin-order-detail', selectedOrderId],
    queryFn: () => ApiClient.get<OrderDetailsResponse>(`/api/v1/admin/orders/${selectedOrderId}`),
    enabled: Boolean(selectedOrderId),
  });

  const fulfillmentMutation = useMutation({
    mutationFn: (payload: {
      orderId: string;
      orderStatus: string;
      courierName?: string;
      trackingNumber?: string;
    }) =>
      ApiClient.patch(`/api/v1/admin/orders/${payload.orderId}/fulfillment`, {
        orderStatus: payload.orderStatus,
        courierName: payload.courierName || undefined,
        trackingNumber: payload.trackingNumber || undefined,
      }),
    onSuccess: () => {
      setActionError(null);
      setFulfillTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: Error) => setActionError(err.message || 'Failed to update order status.'),
  });

          const columns: ColumnDef<AdminOrderRow>[] = [
            {
              key: 'orderNumber',
            header: 'Order ID',
      render: (o) => (
            <div>
              <div className="font-mono font-semibold text-[var(--ink)]">#{o.orderNumber}</div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                {new Date(o.createdAt).toLocaleDateString('en-IN')}
              </div>
              </div>
              ),
    },
              {
                key: 'customer',
              header: 'Customer',
      render: (o) => (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/users?q=${encodeURIComponent(o.user?.email || '')}`);
                  }}
                  className="font-semibold text-[var(--ink)] hover:text-[var(--accent-text)] text-left"
                >
                  {o.user?.name || 'Customer'}
                </button>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  {o.user?.email}
                  {o.user?.phoneNumber ? ` · ${o.user.phoneNumber}` : ''}
                </div>
              </div>
              ),
    },
              {
                key: 'items',
              header: 'Items & Cards',
      render: (o) => (
              <div className="space-y-1">
                <div className="text-[var(--ink)]">
                  {o.items?.length
                    ? o.items.map((it) => `${it.productName || 'NFC Card'} ×${it.quantity}`).join(', ')
                    : `${o.material?.toUpperCase()} ×${o.quantity}`}
                </div>
                {(o.assignedCards ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {o.assignedCards!.map((c) => {
                      const st = normalizeCardStatus(c.status);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/cards?q=${encodeURIComponent(c.cardCode || c.id)}`);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-raised)] border border-[var(--border)] font-mono text-[10px] text-[var(--ink)] hover:border-[var(--accent)]"
                          title={CARD_STATUS_LABELS[st]}
                        >
                          <CreditCard className="w-2.5 h-2.5 text-[var(--accent-text)]" />
                          {c.cardCode || c.id.slice(0, 8)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              ),
    },
              {
                key: 'totalAmount',
              header: 'Amount',
      render: (o) => (
              <span className="font-semibold text-[var(--ink)] tabular-nums">
                ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
              </span>
              ),
    },
              {
                key: 'paymentStatus',
              header: 'Payment',
      render: (o) => <StatusBadge status={o.paymentStatus} />,
    },
              {
                key: 'orderStatus',
              header: 'Shipment',
      render: (o) => <StatusBadge status={o.orderStatus} />,
    },
              ];

                return (
                <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
                  <AdminPageHeader
                    title="Orders"
                    subtitle="Manage every customer order, payment verification, shipment status, and assigned NFC cards"
                    action={
                        <Button variant="accent" size="sm" onClick={() => refetch()} className="min-h-[44px] md:min-h-[36px]">
                          Refresh Orders
                        </Button>
        }
      />

                        {actionError && (
                          <div className="p-3 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{actionError}</span>
                            </div>
                            <button type="button" onClick={() => setActionError(null)} className="font-semibold">
                              Dismiss
                            </button>
                          </div>
                        )}

                        {isError && (
                          <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)]">
                            {(error as Error)?.message || 'Failed to load orders.'}
                          </div>
                        )}

                        <DataTable
                          columns={columns}
                          data={data?.items ?? []}
                          loading={isLoading}
                          keyExtractor={(o) => o.id}
                          searchValue={q}
                          onSearchChange={(val) => {
                            setQ(val);
                            setPage(1);
                          }}
                          searchPlaceholder="Search order number, customer name, or email..."
                          filters={[
                            {
                              key: 'orderStatus',
                              label: 'Filter by order status',
                              value: orderStatusFilter,
                              onChange: (v) => {
                                setOrderStatusFilter(v);
                                setPage(1);
                              },
                              options: [
                                { label: 'All Statuses', value: 'ALL' },
                                { label: 'Placed', value: 'ORDER_PLACED' },
                                { label: 'Confirmed', value: 'ORDER_CONFIRMED' },
                                { label: 'Processing', value: 'CARD_PRODUCTION' },
                                { label: 'Ready', value: 'CARD_READY' },
                                { label: 'Shipped', value: 'DISPATCHED' },
                                { label: 'Delivered', value: 'DELIVERED' },
                                { label: 'Cancelled', value: 'CANCELLED' },
                              ],
                            },
                          ]}
                          page={page}
                          pageSize={data?.pageSize ?? 20}
                          total={data?.total ?? 0}
                          onPageChange={setPage}
                          emptyIcon={<Package className="w-7 h-7" />}
                          emptyTitle="No orders found"
                          emptyDescription="There are no orders matching your current filters."
                          rowActions={(o) => (
                            <>
                              <Button variant="secondary" size="sm" onClick={() => setSelectedOrderId(o.id)}>
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                              {canManage && (
                                <Button
                                  variant="accent"
                                  size="sm"
                                  onClick={() => {
                                    setFulfillTarget(o);
                                    setNextStatus(
                                      o.orderStatus === 'CARD_PRODUCTION'
                                        ? 'DISPATCHED'
                                        : o.orderStatus === 'DISPATCHED'
                                          ? 'DELIVERED'
                                          : 'CARD_PRODUCTION',
                                    );
                                    setCourierName(o.courierName || '');
                                    setTrackingNumber(o.trackingNumber || '');
                                  }}
                                >
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Update
                                </Button>
                              )}
                            </>
                          )}
                        />

                        {/* Order Detail Drawer */}
                        {selectedOrderId && (
                                <div className="fixed inset-0 z-50 flex justify-end">
                                  <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedOrderId(null)} />
                                  <aside className="relative z-10 w-full md:max-w-lg bg-[var(--bg-surface)] h-full border-l border-[var(--border)] shadow-2xl flex flex-col">
                                    <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                                      <h3 className="text-sm font-bold text-[var(--ink)]">Order Details</h3>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedOrderId(null)}
                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--ink-muted)] hover:text-[var(--ink)]"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </div>
                                      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                                        {detailLoading || !detailData ? (
                                          <div className="py-8 text-center text-[var(--ink-muted)]">Loading order...</div>
                                        ) : (
                                          <>
                                              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-[12px] bg-[var(--bg-raised)] border border-[var(--border)]">
                                                <div>
                                                  <div className="text-[var(--ink-muted)]">Order Number</div>
                                                  <div className="font-mono font-semibold text-[var(--ink)] mt-0.5">
                                                    #{detailData.orderNumber}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-[var(--ink-muted)]">Total</div>
                                                  <div className="font-semibold text-[var(--ink)] mt-0.5">
                                                    ₹{Number(detailData.totalAmount || 0).toLocaleString('en-IN')}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-[var(--ink-muted)]">Order Status</div>
                                                  <div className="mt-0.5">
                                                    <StatusBadge status={detailData.orderStatus} />
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-[var(--ink-muted)]">Payment Status</div>
                                                  <div className="mt-0.5">
                                                    <StatusBadge status={detailData.paymentStatus} />
                                                  </div>
                                                </div>
                                              </div>

                                              {detailData.user && (
                                                <div className="p-3.5 rounded-[12px] border border-[var(--border)] flex items-center justify-between">
                                                  <div>
                                                    <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                                                      <User className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                                                      {detailData.user.name}
                                                    </div>
                                                    <div className="text-[var(--ink-muted)]">{detailData.user.email}</div>
                                                  </div>
                                                  <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                      const em = detailData.user.email;
                                                      setSelectedOrderId(null);
                                                      navigate(`/admin/users?q=${encodeURIComponent(em)}`);
                                                    }}
                                                  >
                                                    View Customer
                                                  </Button>
                                                </div>
                                              )}

                                              {detailData.shippingAddress && (
                                                  <div className="p-3.5 rounded-[12px] border border-[var(--border)]">
                                                    <div className="font-semibold text-[var(--ink)] mb-1">Shipping Address</div>
                                                    <p className="text-[var(--ink-muted)] leading-relaxed">
                                                      {detailData.shippingAddress.recipientName} ({detailData.shippingAddress.phone})
                                                      <br />
                                                      {detailData.shippingAddress.street}, {detailData.shippingAddress.city},{' '}
                                                      {detailData.shippingAddress.state} - {detailData.shippingAddress.postalCode}
                                                    </p>
                                                  </div>
                  )}
                                                </>
                                              )}
                                            </div>
                                      </aside>
                                    </div>
      )}

                                    {/* Update Status Modal */}
                                    {fulfillTarget && (
                                      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                                        <div className="w-full max-w-md rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4 shadow-xl">
                                          <h3 className="text-sm font-bold text-[var(--ink)]">
                                            Update Order #{fulfillTarget.orderNumber}
                                          </h3>
                                          <div className="space-y-3 text-xs">
                                            <div>
                                              <label className="block font-medium text-[var(--ink)] mb-1">Order Stage</label>
                                              <select
                                                value={nextStatus}
                                                onChange={(e) => setNextStatus(e.target.value)}
                                                className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                                              >
                                                <option value="ORDER_CONFIRMED">Confirmed</option>
                                                <option value="CARD_PRODUCTION">Processing (In Production)</option>
                                                <option value="CARD_READY">Ready for Dispatch</option>
                                                <option value="DISPATCHED">Shipped (Dispatched)</option>
                                                <option value="DELIVERED">Delivered</option>
                                                <option value="CANCELLED">Cancelled</option>
                                              </select>
                                            </div>
                                            <div>
                                              <label className="block font-medium text-[var(--ink)] mb-1">Courier Name</label>
                                              <input
                                                type="text"
                                                value={courierName}
                                                onChange={(e) => setCourierName(e.target.value)}
                                                placeholder="e.g. BlueDart, Delhivery"
                                                className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                                              />
                                            </div>
                                            <div>
                                              <label className="block font-medium text-[var(--ink)] mb-1">Tracking Number</label>
                                              <input
                                                type="text"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                placeholder="Optional waybill number"
                                                className="w-full min-h-[40px] px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-end gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => setFulfillTarget(null)}>
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="accent"
                                              size="sm"
                                              disabled={fulfillmentMutation.isPending}
                                              onClick={() =>
                                                fulfillmentMutation.mutate({
                                                  orderId: fulfillTarget.id,
                                                  orderStatus: nextStatus,
                                                  courierName: courierName.trim() || undefined,
                                                  trackingNumber: trackingNumber.trim() || undefined,
                                                })
                                              }
                                            >
                                              {fulfillmentMutation.isPending ? 'Saving...' : 'Save Status'}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                                );
}
