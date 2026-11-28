/**
 * OrdersPage - Customer NFC Card Order History
 * Flipkart / Amazon "My Orders" style compact design
 * Mobile-first (~110px card height, 8px gap), desktop single-row layout.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Plus,
  AlertCircle,
  Check,
  CreditCard,
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { CardPreview } from '../components/cards/CardPreview';

/**
 * Shimmer skeleton placeholder card matching the ~110px height
 */
function OrderCardSkeleton() {
  return (
          <div className="rounded-[12px] bg-white border border-[#E9E9E6] p-3 flex flex-col justify-between h-[110px] animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-[96px] h-[60px] rounded-[6px] bg-[#EFEFEF] shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-[#EFEFEF] rounded w-3/4" />
                <div className="h-3 bg-[#EFEFEF] rounded w-1/3" />
                <div className="h-3 bg-[#EFEFEF] rounded w-1/2" />
              </div>
            </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#F4F4F2]">
                <div className="h-2.5 bg-[#EFEFEF] rounded w-1/3" />
                <div className="h-2.5 bg-[#EFEFEF] rounded w-1/4" />
              </div>
            </div>
            );
}

            export function OrdersPage() {
  const navigate = useNavigate();

            const {data: orders = [], isLoading, error } = useQuery<any[]>({
              queryKey: ['orders', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/orders'),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-IN', {
              day: 'numeric',
            month: 'short',
            year: 'numeric',
    });
  };

  const getProductName = (ord: any): string => {
    if (ord.items?.[0]?.productName) return ord.items[0].productName;
            if (ord.cardMaterial === 'metal') return 'Matte Titanium Metal NFC Card';
            if (ord.cardMaterial === 'wood') return 'Handcrafted Walnut Wood NFC Card';
            return 'Matte Obsidian PVC NFC Card';
  };

  const getCardPreviews = (ord: any) => {
    const item = ord.items?.[0];
            const front =
            item?.previewFrontUrl ||
            item?.designPreviewUrl ||
            item?.previewUrl ||
            ord.previewFrontUrl ||
            ord.previewUrl ||
            '';
            const back =
            item?.previewBackUrl ||
            item?.backPreviewUrl ||
            ord.previewBackUrl ||
            ord.backPreviewUrl ||
            '';
            let frontJson = '';
            let backJson = '';
            if (item?.designSnapshotJson) {
      try {
        const snap = JSON.parse(item.designSnapshotJson);
            frontJson = snap.frontCanvasJson || '';
            backJson = snap.backCanvasJson || '';
      } catch (_) { }
    }
            return {front, back, frontJson, backJson};
  };

  const getStatusDisplay = (orderStatus?: string, deliveredAt?: string) => {
    const s = (orderStatus || '').toUpperCase();
            if (s === 'DELIVERED') {
            return {
              label: deliveredAt ? `Delivered on ${formatDate(deliveredAt)}` : 'Delivered',
            dotColor: 'bg-[#16A34A]',
            textColor: 'text-[#16A34A]',
      };
    }
            if (s === 'DISPATCHED' || s === 'SHIPPED') {
      return {
              label: 'Shipped — Arriving soon',
            dotColor: 'bg-[#FF6A00]',
            textColor: 'text-[#FF6A00]',
      };
    }
            if (s === 'CARD_PRODUCTION') {
            return {
              label: 'In production',
            dotColor: 'bg-[#FF6A00]',
            textColor: 'text-[#FF6A00]',
      };
    }
            if (s === 'CARD_READY') {
            return {
              label: 'Ready for dispatch',
            dotColor: 'bg-[#FF6A00]',
            textColor: 'text-[#FF6A00]',
      };
    }
            if (s === 'CANCELLED') {
      return {
              label: 'Cancelled',
            dotColor: 'bg-[#DC2626]',
            textColor: 'text-[#DC2626]',
      };
    }
            return {
              label: 'Order confirmed',
            dotColor: 'bg-[#2563EB]',
            textColor: 'text-[#161616]',
    };
  };

  const renderPaymentInfo = (ord: any) => {
    const pStatus = (ord.paymentStatus || '').toUpperCase();
            const pMethod = (ord.paymentMethod || '').toLowerCase();
            const amount = `₹${(ord.totalAmount || 0).toLocaleString('en-IN')}`;

            if (pStatus === 'PAID') {
      return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A]">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Paid</span>
            </span>
            );
    }
            if (pMethod === 'cod' || pStatus === 'COD_PENDING') {
      return (
            <span className="text-[11px] font-medium text-[#FF6A00]">
              Pay {amount} on delivery
            </span>
            );
    }
            if (pStatus === 'PENDING' || pStatus === 'PAYMENT_PENDING') {
      return (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className="font-medium text-[#D97706]">Payment pending</span>
              <span className="text-[#FF6A00] font-semibold underline ml-0.5">Pay now</span>
            </span>
            );
    }
    return (
            <span className="text-[11px] text-[#737373]">
              {ord.paymentStatus || 'Pending'}
            </span>
            );
  };

            return (
                  <div className="bg-[#F4F4F2] min-h-screen text-[#161616] pb-24 md:pb-12 font-sans select-none">
                    {/* 1. Mobile Header (Sticky, 56px) */}
                    <header className="md:hidden sticky top-0 z-20 bg-white border-b border-[#E9E9E6] h-14 px-3 flex items-center justify-between shadow-xs">
                      <h1 className="text-[18px] font-semibold text-[#161616] tracking-tight">
                        My Orders
                        <span className="sr-only">My NFC Card Orders</span>
                      </h1>
                      <Link
                        to="/studio"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF3E9] text-[12px] font-semibold transition-colors active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Design New Card</span>
                      </Link>
                    </header>

                    {/* Main Content Area */}
                    <div className="max-w-[920px] mx-auto px-3 sm:px-4 md:px-6 pt-2.5 md:pt-6">
                      {/* Desktop Header Row */}
                      <div className="hidden md:flex items-center justify-between pb-4 border-b border-[#E9E9E6] mb-5">
                        <div>
                          <h1 className="text-[20px] font-bold text-[#161616] tracking-tight">
                            My Orders
                            <span className="sr-only">My NFC Card Orders</span>
                          </h1>
                          <p className="text-[12px] text-[#737373] mt-0.5">
                            Manage your custom NFC smart cards and track shipments
                          </p>
                        </div>
                        <Link
                          to="/studio"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-white text-[13px] font-semibold shadow-xs transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Design New Card</span>
                        </Link>
                      </div>

                      {/* Loading State */}
                      {isLoading ? (
                        <div className="space-y-2">
                          <OrderCardSkeleton />
                          <OrderCardSkeleton />
                          <OrderCardSkeleton />
                        </div>
                      ) : error ? (
                        /* Error State */
                        <div className="p-6 rounded-[12px] bg-rose-50 border border-rose-200 text-center space-y-2 my-4">
                          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
                          <p className="text-xs font-medium text-rose-700">
                            Failed to load orders. Please refresh or check your connection.
                          </p>
                        </div>
                      ) : orders.length === 0 ? (
                        /* Empty State */
                        <div className="p-8 sm:p-12 text-center rounded-[12px] border border-[#E9E9E6] bg-white space-y-4 my-4">
                          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#FF6A00]">
                            <CreditCard className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-base font-semibold text-[#161616]">No orders found</h3>
                            <p className="text-xs text-[#737373] max-w-xs mx-auto">
                              You haven't ordered any custom smart cards yet. Create your design in the studio.
                            </p>
                          </div>
                          <Link
                            to="/studio"
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-white font-medium text-xs shadow-xs transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Design your first card</span>
                          </Link>
          </div>
                    ) : (
                    /* Orders List: Flipkart/Amazon Compact Card Spec */
                    <div className="space-y-2">
                      {orders.map((ord) => {
                        const productName = getProductName(ord);
                        const { front, back, frontJson } = getCardPreviews(ord);
                        const status = getStatusDisplay(ord.orderStatus, ord.deliveredAt);
                        const orderDate = formatDate(ord.createdAt);
                        const orderNum = ord.orderNumber || (ord.id ? ord.id.substring(0, 8).toUpperCase() : '');
                        const qty = ord.items?.[0]?.quantity || ord.quantity || 1;
                        const hasShipment =
                          ord.orderStatus === 'DISPATCHED' ||
                          ord.orderStatus === 'DELIVERED' ||
                          Boolean(ord.trackingNumber);
                        const detailUrl = `/orders/${ord.id}/track`;

                                return (
                              <div
                                key={ord.id}
                                onClick={() => navigate(detailUrl)}
                                className="group rounded-[12px] bg-white border border-[#E9E9E6] hover:border-[#FF6A00]/40 p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer select-none"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    navigate(detailUrl);
                                  }
                                }}
                              >
                                {/* MOBILE LAYOUT (<768px): Target height ~110px */ }
                                <div className="md:hidden flex flex-col justify-between gap-2.5">
                                  {/* Top Row: [96x60 card preview] + Right info (Item Name, Qty · Price, Status) */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-[96px] h-[60px] min-w-[96px] min-h-[60px] rounded-[6px] overflow-hidden border border-[#E9E9E6] shrink-0 bg-[#161616]">
                                      <CardPreview
                                        frontUrl={front}
                                        backUrl={back}
                                        frontJson={frontJson}
                                        width="96px"
                                        height="60px"
                                        cloudinaryWidth={240}
                                        alt={productName}
                                      />
                                    </div>

                                        <div className="flex-1 min-w-0 space-y-0.5">
                                          {/* Line 1: Item Name (14px medium, 1 line, ellipsis) */}
                                          <h2 className="text-[14px] font-medium text-[#161616] truncate leading-tight">
                                            {productName}
                                          </h2>

                                          {/* Line 2: Qty · Price (13px, ink text) */}
                                          <p className="text-[13px] text-[#161616] font-medium leading-tight">
                                            Qty: {qty} ·{' '}
                                            <span className="font-semibold">
                                              ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                                            </span>
                                          </p>

                                            {/* Line 3: Order Status with colored dot */}
                                            <div className="flex items-center gap-1.5 text-[12px] font-medium leading-tight pt-0.5">
                                              <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor}`} />
                                              <span className={`${status.textColor} truncate`}>
                                                {status.label}
                                              </span>
                                              {Array.isArray(ord.purchasedCards) &&
                                                ord.purchasedCards.some(
                                                  (c: any) =>
                                                    c.status === 'SUSPENDED' || c.status === 'LOST',
                                                ) && (
                                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                                                    {ord.purchasedCards.some((c: any) => c.status === 'LOST')
                                                      ? 'Card Lost'
                                                      : 'Card Suspended'}
                                                  </span>
                                                )}
                                            </div>
                                          </div>
                                        </div>

                                      {/* Bottom Row: Left (Order ID & Date) | Right (Payment Info & Optional Track >) */}
                                      <div className="flex items-center justify-between pt-2 border-t border-[#F4F4F2] text-[11px]">
                                        <div className="text-[#737373] truncate mr-2">
                                          #{orderNum} · {orderDate}
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                          {renderPaymentInfo(ord)}

                                        {hasShipment && (
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(detailUrl);
                                            }}
                                            className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#FF6A00] hover:underline"
                                          >
                                            <span>Track</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                    {/* DESKTOP LAYOUT (>=768px): Single Clean Row */}
                                    <div className="hidden md:flex items-center justify-between gap-4 py-0.5">
                                      {/* Left: 96x60 Preview */}
                                      <div className="w-[96px] h-[60px] min-w-[96px] min-h-[60px] rounded-[6px] overflow-hidden border border-[#E9E9E6] shrink-0 bg-[#161616]">
                                        <CardPreview
                                          frontUrl={front}
                                          backUrl={back}
                                          frontJson={frontJson}
                                          width="96px"
                                          height="60px"
                                          cloudinaryWidth={240}
                                          alt={productName}
                                        />
                                      </div>

                                      {/* Column 2: Item Name + Order ID & Date */}
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <h2 className="text-[14px] font-medium text-[#161616] truncate max-w-[320px]">
                                          {productName}
                                        </h2>
                                        <p className="text-[11px] text-[#737373]">
                                          #{orderNum} · {orderDate}
                                        </p>
                                      </div>

                                      {/* Column 3: Price + Payment Status */}
                                      <div className="w-36 shrink-0 space-y-1">
                                        <div className="text-[13px] font-semibold text-[#161616]">
                                          Qty: {qty} · ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div>{renderPaymentInfo(ord)}</div>
                                      </div>

                                  {/* Column 4: Order Status with colored dot */}
                                  <div className="w-44 shrink-0 flex items-center gap-1.5 text-[13px] font-medium">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor}`} />
                                    <span className={`${status.textColor} truncate`}>
                                      {status.label}
                                    </span>
                                  </div>

                                  {/* Column 5: Track Action */}
                                  <div className="w-24 shrink-0 flex justify-end">
                                    {hasShipment ? (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(detailUrl);
                                        }}
                                        className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#FF6A00] hover:underline"
                                      >
                                        <span>Track</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[13px] text-[#737373] group-hover:text-[#FF6A00] transition-colors">
                                        <span>Details</span>
                                        <ChevronRight className="w-4 h-4" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                </div>
                          );
            })}
          </div>
        )}
            </div>
          </div>
          );
}
