/**
 * OrderTrackingPage - Premium Light & Orange NFC Card Order Detail & Tracking
 * Flipkart / Amazon style detail view:
 * 1. Large CardPreview (w_800, max-w-[340px], centered, front/back toggle + tap-to-flip)
 * 2. 4-step vertical timeline (Confirmed -> Packed -> Shipped -> Delivered)
 * 3. Compact Info blocks (Items & Price, Delivery Address, Paired Digital Profile)
 * 4. Mobile sticky bottom bar (View Invoice + Track Shipment) & Desktop 2-column layout
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Check,
  Package,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertCircle,
  Loader2,
  Copy,
  Receipt,
  RotateCw,
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { defaultBrandConfig } from '../config/brand';
import { BrandLogo } from '../components/brand';
import { CardPreview } from '../components/cards/CardPreview';
import { DesignAssistanceButton } from '../components/common/DesignAssistanceButton';
import { buildOrderDesignAssistanceMessage } from '../utils/whatsappAssistance';

const TIMELINE_STEPS = [
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Order verified & placed in production' },
  { key: 'PACKED', label: 'Packed & Inspected', desc: 'NFC chip encoded & packaged' },
  { key: 'SHIPPED', label: 'Shipped', desc: 'In transit with express courier partner' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to your address' },
];

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [copiedWaybill, setCopiedWaybill] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', 'track', id],
    queryFn: () => ApiClient.get<any>(`/api/v1/orders/${id}`),
    enabled: !!id,
    refetchInterval: 8000,
  });

        if (isLoading) {
          return (
            <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-4">
              <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin mb-3" />
              <p className="text-xs font-medium text-[#737373]">Loading order details...</p>
            </div>
          );
        }

          if (error || !order) {
            return (
              <div className="min-h-screen bg-[#F4F4F2] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-[#161616]">Order Not Found</h2>
                <p className="text-xs text-[#737373] max-w-sm mt-1 mb-4">
                  The requested order could not be located. Please check your order history.
                </p>
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-xs text-white font-semibold shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to My Orders</span>
                </Link>
              </div>
            );
          }

            const shipping = order.shippingAddress || {};
            const orderItem = order.items && order.items.length > 0 ? order.items[0] : null;
            const orderNum = order.orderNumber || (order.id ? order.id.substring(0, 8).toUpperCase() : '');
            const statusHistory = order.statusHistory || [];

            // Parse card previews & artwork snapshot
            const frontUrl =
              orderItem?.previewFrontUrl ||
              orderItem?.designPreviewUrl ||
              orderItem?.previewUrl ||
              order.previewFrontUrl ||
              order.previewUrl ||
              '';
            const backUrl =
              orderItem?.previewBackUrl ||
              orderItem?.backPreviewUrl ||
              order.previewBackUrl ||
              order.backPreviewUrl ||
              '';

            let frontJson = '';
            let backJson = '';
            let designSnapshotName = '';
            if (orderItem?.designSnapshotJson) {
              try {
                const snap = JSON.parse(orderItem.designSnapshotJson);
                frontJson = snap.frontCanvasJson || '';
                backJson = snap.backCanvasJson || '';
                designSnapshotName = snap.name || '';
              } catch (_) { }
            }

          const productName =
            orderItem?.productName ||
            designSnapshotName ||
            (order.cardMaterial === 'metal'
              ? 'Matte Titanium Metal NFC Card'
              : order.cardMaterial === 'wood'
                ? 'Handcrafted Walnut Wood NFC Card'
                : 'Matte Obsidian PVC NFC Card');

            const variantLabel =
              orderItem?.variantName ||
              (order.cardMaterial === 'metal'
                ? 'Matte Titanium'
                : order.cardMaterial === 'wood'
                  ? 'Natural Walnut'
                  : 'Matte Obsidian PVC');

            // Compute 4-step timeline progress
            const getTimelineIndex = (status?: string) => {
              const s = (status || '').toUpperCase();
              if (s === 'DELIVERED') return 3;
              if (s === 'DISPATCHED' || s === 'SHIPPED') return 2;
              if (s === 'CARD_READY' || s === 'CARD_PRODUCTION' || s === 'DESIGN_REVIEW') return 1;
              return 0; // ORDER_CONFIRMED, ORDER_PLACED, PAYMENT_PENDING
            };

            const currentTimelineIndex = getTimelineIndex(order.orderStatus);
            const isDelivered = (order.orderStatus || '').toUpperCase() === 'DELIVERED';

            const findStageDate = (stepIndex: number) => {
              if (stepIndex === 0) {
                return order.createdAt ? new Date(order.createdAt) : null;
              }
              if (stepIndex === 1) {
                const h = statusHistory.find(
                  (it: any) =>
                    it.status === 'CARD_READY' ||
                    it.status === 'CARD_PRODUCTION' ||
                    it.status === 'DESIGN_REVIEW'
                );
                return h?.createdAt ? new Date(h.createdAt) : null;
              }
              if (stepIndex === 2) {
                const h = statusHistory.find((it: any) => it.status === 'DISPATCHED' || it.status === 'SHIPPED');
                return h?.createdAt ? new Date(h.createdAt) : null;
              }
              if (stepIndex === 3) {
                const h = statusHistory.find((it: any) => it.status === 'DELIVERED');
                return h?.createdAt ? new Date(h.createdAt) : null;
              }
              return null;
            };

            const formatStepDate = (d: Date | null) => {
              if (!d) return '';
              return d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
            };

  const handleCopyWaybill = () => {
    if (order.trackingNumber) {
                    navigator.clipboard.writeText(order.trackingNumber);
                  setCopiedWaybill(true);
      setTimeout(() => setCopiedWaybill(false), 2000);
    }
  };

                  const unitPrice = orderItem?.unitPrice || (order.cardMaterial === 'metal' ? 2499 : order.cardMaterial === 'wood' ? 1999 : 1499);
                  const quantity = orderItem?.quantity || order.quantity || 1;
                  const subtotal = unitPrice * quantity;
  const shippingCost = order.shippingCost !== undefined ? order.shippingCost : (subtotal >= 2000 ? 0 : 99);
                  const taxAmount = order.taxAmount !== undefined ? order.taxAmount : Math.round(subtotal * 0.18);
                  const totalAmount = order.totalAmount || (subtotal + shippingCost + taxAmount);

                  const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID';
                  const isCod = (order.paymentMethod || '').toLowerCase() === 'cod';

                  return (
                  <div className="min-h-screen bg-[#F4F4F2] text-[#161616] pb-28 md:pb-12 font-sans select-none">
                    {/* 1. Header (Sticky) */}
                    <header className="sticky top-0 z-30 bg-white border-b border-[#E9E9E6] h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/orders')}
                          className="p-1.5 -ml-1 rounded-lg text-[#737373] hover:text-[#161616] hover:bg-[#F4F4F2] transition-colors"
                          aria-label="Back to Orders"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div
                          onClick={() => navigate('/')}
                          className="flex items-center gap-2 cursor-pointer"
                          role="button"
                          tabIndex={0}
                        >
                          <BrandLogo variant="symbol" className="w-6 h-6" />
                          <span className="font-bold tracking-tight text-[15px] sm:text-base text-[#161616]">
                            {defaultBrandConfig.name}
                          </span>
                        </div>
                        <span className="text-[#E9E9E6] mx-1 hidden sm:inline">/</span>
                        <span className="text-xs sm:text-sm font-semibold text-[#737373] hidden sm:inline">
                          Order Details
                        </span>
                      </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-orange-50 text-[#FF6A00] border border-orange-200/80 font-semibold">
                              #{orderNum}
                            </span>
                          </div>
                        </header>

                        {/* Main Container */}
                        <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-3 md:pt-6">
                          {/* 2-Column Responsive Layout (Mobile: Single Column, Desktop >= 1024px: 2 Columns) */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">

                            {/* LEFT COLUMN (lg:col-span-6): Card Preview & Timeline */}
                            <div className="lg:col-span-6 space-y-3 sm:space-y-4">

                              {/* 1. Card Preview Section */}
                              <div className="bg-white rounded-[12px] p-4 sm:p-5 border border-[#E9E9E6] shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-[#F4F4F2] pb-2.5">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                                    Personalized Card Artwork
                                  </span>
                                  {/* Subtle Front/Back Toggle */}
                                  <div className="flex items-center bg-[#F4F4F2] p-0.5 rounded-lg border border-[#E9E9E6]">
                                    <button
                                      type="button"
                                      onClick={() => setCardSide('front')}
                                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all ${cardSide === 'front'
                                          ? 'bg-white text-[#161616] shadow-xs'
                                          : 'text-[#737373] hover:text-[#161616]'
                                        }`}
                                    >
                                      Front
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setCardSide('back')}
                                      className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all ${cardSide === 'back'
                                          ? 'bg-white text-[#161616] shadow-xs'
                                          : 'text-[#737373] hover:text-[#161616]'
                                        }`}
                                    >
                                      Back
                                    </button>
                                  </div>
                                </div>

                                {/* Large Centered Card Preview with Tap to Flip */}
                                <div className="max-w-[340px] mx-auto py-1">
                                  <CardPreview
                                    frontUrl={frontUrl}
                                    backUrl={backUrl}
                                    frontJson={frontJson}
                                    backJson={backJson}
                                    side={cardSide}
                                    allowFlip={true}
                                    showFlipHint={true}
                                    onFlip={(s) => setCardSide(s)}
                                    cloudinaryWidth={800}
                                    className="rounded-[10px] shadow-sm border border-[#E9E9E6]"
                                  />
                                </div>

                                      {/* Design name & variant in one clean line below */}
                                      <p className="text-center text-[12px] font-medium text-[#737373] truncate pt-1">
                                        <span className="text-[#161616] font-semibold">{productName}</span> · {variantLabel}
                                      </p>

                                      <div className="pt-1 flex justify-center">
                                        <DesignAssistanceButton
                                          message={buildOrderDesignAssistanceMessage({
                                            orderId: orderNum || order.id,
                                            productName,
                                            variantName: variantLabel,
                                          })}
                                          className="w-full sm:w-auto"
                                        />
                                      </div>
                                    </div>

                              {/* 2. 4-Step Vertical Timeline */}
                              <div className="bg-white rounded-[12px] p-4 sm:p-5 border border-[#E9E9E6] shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-[#F4F4F2] pb-2.5">
                                  <h3 className="text-[14px] font-bold text-[#161616]">
                                    Order Status
                                  </h3>
                                  <span className="text-[11px] font-medium text-[#737373]">
                                    {isDelivered ? 'Delivered' : `Step ${currentTimelineIndex + 1} of 4`}
                                  </span>
                                </div>

                                    <div className="space-y-0 pl-1">
                                      {TIMELINE_STEPS.map((step, idx) => {
                                        const isCompleted = isDelivered ? true : currentTimelineIndex > idx;
                                        const isCurrent = !isDelivered && currentTimelineIndex === idx;
                                        const isFuture = !isDelivered && currentTimelineIndex < idx;
                                        const isLast = idx === TIMELINE_STEPS.length - 1;
                                        const stageDate = findStageDate(idx);

                                  return (
                                  <div key={step.key} className="relative flex gap-3.5 pb-6 last:pb-0">
                                    {/* Vertical line connecting nodes */}
                                    {!isLast && (
                                      <div
                                        className={`absolute left-[13px] top-6 bottom-0 w-0.5 ${currentTimelineIndex > idx || isDelivered
                                            ? 'bg-[#161616]'
                                            : 'bg-[#E9E9E6]'
                                          }`}
                                      />
                                    )}

                                          {/* Node circle */}
                                          <div className="relative z-10 shrink-0">
                                            {isCompleted ? (
                                              <div className="w-7 h-7 rounded-full bg-[#161616] text-white flex items-center justify-center shadow-xs">
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                              </div>
                                            ) : isCurrent ? (
                                              <div className="w-7 h-7 rounded-full bg-[#FF6A00] text-white ring-4 ring-orange-100 flex items-center justify-center shadow-xs">
                                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                              </div>
                                            ) : (
                                              <div className="w-7 h-7 rounded-full bg-[#F4F4F2] border border-[#E9E9E6] text-[#737373] flex items-center justify-center text-[11px] font-semibold">
                                                {idx + 1}
                                              </div>
                                            )}
                                          </div>

                                                  {/* Step description */}
                                                  <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-[13px] ${
                              isCurrent
                                ? 'font-bold text-[#FF6A00]'
                                : isCompleted
                                ? 'font-semibold text-[#161616]'
                                : 'font-medium text-[#737373]'
                            }`}
                          >
                            {step.label}
                          </p>
                          {stageDate && (
                            <span className="text-[11px] font-mono text-[#737373]">
                              {formatStepDate(stageDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                                      </div>
                                      );
                })}
                              </div>

                              {/* Courier Tracking Block (if tracking exists) */}
                              {order.trackingNumber && (
                                <div className="mt-3 p-3 rounded-lg bg-orange-50/70 border border-orange-200 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[#161616] flex items-center gap-1.5">
                                      <Truck className="w-3.5 h-3.5 text-[#FF6A00]" />
                                      <span>{order.courierName || 'Express Courier'}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleCopyWaybill}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-orange-200 text-[11px] font-medium text-[#FF6A00] hover:bg-orange-50 transition-colors"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>{copiedWaybill ? 'Copied' : 'Copy AWB'}</span>
                                    </button>
                                  </div>
                                  <p className="font-mono text-[11px] text-[#737373]">
                                    Waybill: <span className="font-semibold text-[#161616]">{order.trackingNumber}</span>
                                  </p>
                                  {order.trackingUrl && (
                                    <a
                                      href={order.trackingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6A00] hover:underline pt-0.5"
                                    >
                                      <span>Track on Courier Site</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                              {/* RIGHT COLUMN (lg:col-span-6): Info Blocks */}
                              <div className="lg:col-span-6 space-y-3 sm:space-y-4">

                                {/* Info Block 1: Items & Price Summary */}
                                <div className="bg-white rounded-[12px] p-4 sm:p-5 border border-[#E9E9E6] shadow-xs space-y-3 text-xs">
                                  <h3 className="font-bold text-[14px] text-[#161616] flex items-center gap-2 border-b border-[#F4F4F2] pb-2.5">
                                    <Package className="w-4 h-4 text-[#FF6A00]" />
                                    <span>Price &amp; Payment Details</span>
                                  </h3>

                                <div className="space-y-2 text-[#737373]">
                                  <div className="flex items-center justify-between">
                                    <span>Product Item</span>
                                    <span className="font-semibold text-[#161616] text-right truncate max-w-[200px]">
                                      {productName}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Material Finish</span>
                                    <span className="font-medium text-[#161616]">{variantLabel}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Quantity</span>
                                    <span className="font-medium text-[#161616]">{quantity}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Unit Price</span>
                                    <span className="font-mono font-medium text-[#161616]">₹{unitPrice.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium text-[#16A34A]">
                                      {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>GST (18%)</span>
                                    <span className="font-mono font-medium text-[#161616]">₹{taxAmount.toLocaleString('en-IN')}</span>
                                  </div>

                                  <div className="pt-2 border-t border-[#F4F4F2] flex items-center justify-between text-[#161616]">
                                    <span className="font-bold text-[13px]">Total Amount</span>
                                    <span className="font-mono font-bold text-[15px]">
                                      ₹{totalAmount.toLocaleString('en-IN')}
                                    </span>
                                  </div>

                                      <div className="pt-2 border-t border-[#F4F4F2] flex items-center justify-between">
                                        <span>Payment Mode</span>
                                        <span className="font-medium text-[#161616] capitalize">
                                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'Online UPI'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>Payment Status</span>
                                        {isPaid ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <Check className="w-3 h-3 stroke-[2.5]" />
                                            <span>Paid</span>
                                          </span>
                                        ) : isCod ? (
                                          <span className="text-[11px] font-semibold text-[#FF6A00] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                            Pay ₹{totalAmount.toLocaleString('en-IN')} on delivery
                                          </span>
                                        ) : (
                                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            Payment Pending
                                          </span>
                                        )}
                                      </div>
                                    </div>
            </div>

                                {/* Info Block 2: Delivery Address */}
                                <div className="bg-white rounded-[12px] p-4 sm:p-5 border border-[#E9E9E6] shadow-xs space-y-2 text-xs">
                                  <h3 className="font-bold text-[14px] text-[#161616] flex items-center gap-2 border-b border-[#F4F4F2] pb-2.5">
                                    <MapPin className="w-4 h-4 text-[#FF6A00]" />
                                    <span>Delivery Address</span>
                                  </h3>
                                  <p className="font-semibold text-[13px] text-[#161616]">
                                    {shipping.fullName || shipping.recipientName || 'Recipient'}
                                  </p>
                                  <p className="font-mono font-bold text-[12px] text-[#161616]">
                                    {shipping.phone}
                                  </p>
                                  <p className="text-[#737373] leading-relaxed">
                                    {shipping.addressLine1 || shipping.street}
                                    {shipping.addressLine2 ? `, ${shipping.addressLine2}` : ''}
                                  </p>
                                  <p className="text-[#737373] font-mono">
                                    {shipping.city}{shipping.city && shipping.state ? ', ' : ''}{shipping.state} - {shipping.postalCode}
                                  </p>
                                  {shipping.deliveryInstructions && (
                                    <p className="text-[11px] text-[#737373] italic pt-1 border-t border-[#F4F4F2]">
                                      Note: "{shipping.deliveryInstructions}"
                                    </p>
                                  )}
                                </div>

                              {/* Info Block 3: Paired Digital Profile */}
                              <div className="bg-white rounded-[12px] p-4 sm:p-5 border border-[#E9E9E6] shadow-xs space-y-2.5 text-xs">
                                <div className="flex items-center justify-between border-b border-[#F4F4F2] pb-2.5">
                                  <h3 className="font-bold text-[14px] text-[#161616] flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#FF6A00]" />
                                    <span>Paired Digital Identity</span>
                                  </h3>
                                </div>

                      {order.attachedProfile ? (
                        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E9E9E6] flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-[#161616] truncate">
                              {order.attachedProfile.name}
                            </p>
                            <p className="text-[11px] font-mono text-[#FF6A00] truncate">
                              taptch.com/p/{order.attachedProfile.slug}
                            </p>
                          </div>
                          <a
                            href={`/p/${order.attachedProfile.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-[#E9E9E6] hover:border-[#FF6A00] text-[11px] font-semibold text-[#161616] transition-colors"
                          >
                            Preview
                          </a>
                        </div>
                      ) : order.profileAssistanceStatus &&
                        order.profileAssistanceStatus !== 'NOT_REQUIRED' ? (
                        <div className="p-3 rounded-lg bg-orange-50/60 border border-orange-200 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF6A00]" />
                            <span className="font-semibold text-[#FF6A00]">Concierge assistance active</span>
                          </div>
                          <p className="text-[11px] text-[#737373]">
                            Our digital profile specialist will assist you before your smart card is encoded.
                          </p>
                          {order.profileAssistanceNotes && (
                            <p className="text-[11px] text-[#161616] italic pt-0.5">
                              Instructions: "{order.profileAssistanceNotes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[12px] text-[#737373]">
                          No digital profile attached yet. You can tap and program this NFC card after delivery.
                        </p>
                      )}
                  </div>

                  {/* Desktop Action Block (Invoice Link) */}
                  <div className="hidden lg:block bg-white rounded-[12px] p-4 border border-[#E9E9E6] shadow-xs">
                    <Link
                      to={`/orders/${order.id}/confirmation`}
                      className="w-full h-10 rounded-lg border border-[#E9E9E6] hover:bg-[#F4F4F2] text-[#161616] text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-[#737373]" />
                      <span>View Tax Invoice</span>
                    </Link>
                  </div>
                </div>
        </div >
      </main >

    {/* 4. Mobile Sticky Bottom Action Bar */ }
    < div className = "lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E9E9E6] p-3 shadow-lg" >
      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-2.5">
        <Link
          to={`/orders/${order.id}/confirmation`}
          className="h-10 text-[13px] font-medium border border-[#E9E9E6] text-[#161616] hover:bg-[#F4F4F2] bg-white rounded-lg flex items-center justify-center transition-colors active:scale-98"
        >
          View Invoice
        </Link>
        {order.trackingUrl ? (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 text-[13px] font-semibold bg-[#FF6A00] hover:bg-[#E85D00] text-white rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors active:scale-98"
          >
            <span>Track Shipment</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              const el = document.querySelector('main');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="h-10 text-[13px] font-semibold bg-[#FF6A00] hover:bg-[#E85D00] text-white rounded-lg flex items-center justify-center shadow-xs transition-colors active:scale-98"
          >
            Track Status
          </button>
        )}
      </div>
      </div >
    </div >
  );
}
