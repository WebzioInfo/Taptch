/**
 * OrderConfirmationPage - Post-Order Summary & Real-Time Tracking Link
 * Displays confirmed order receipt, frozen card snapshot, profile attachment status, and shipping information.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  QrCode,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { ApiClient } from '../services/api';
import { BrandLogo } from '../components/brand';
import { CardPreview } from '../components/cards/CardPreview';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ApiClient.get<any>(`/api/v1/orders/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center p-4 font-body">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-3" />
        <p className="text-sm font-mono text-[var(--ink-muted)]">Retrieving order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center p-4 text-center font-body">
        <AlertCircle className="w-12 h-12 text-[var(--danger)] mb-3" />
        <h2 className="text-lg font-bold text-[var(--ink)]">Order Not Found</h2>
        <p className="text-xs text-[var(--ink-muted)] max-w-sm mt-1 mb-4">
          The requested order reference could not be located or has expired.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] border border-[var(--border)] text-xs text-[var(--ink)] font-medium hover:bg-[var(--bg-surface)] transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddress || {};
  const isPaid = order.paymentStatus === 'PAID';
  const isCod = order.paymentMethod === 'cod';
  const isFailed = order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED';
  const isPendingOnline = !isCod && !isPaid && !isFailed;
  const isVerifiedSuccess = isPaid || (isCod && order.orderStatus === 'ORDER_CONFIRMED');
  const orderRef = order.orderNumber || order.id?.substring(0, 8);

  const handleRetryPayment = async () => {
    setIsRetryingPayment(true);
    setRetryError(null);
    try {
      await ApiClient.post(`/api/v1/orders/${order.id}/verify-payment`, {
        paymentMethod: order.paymentMethod || 'upi',
        simulationStatus: 'SUCCESS',
      });
      await ApiClient.put('/api/v1/journey/active', {
        stage: 'COMPLETED',
        orderId: order.id,
      }).catch(() => {});
      window.location.reload();
    } catch (err: any) {
      setRetryError(err?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const handleCopyOrderId = () => {
    if (orderRef) {
      navigator.clipboard.writeText(orderRef);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--ink)] pb-20 selection:bg-[var(--accent)] selection:text-[var(--accent-ink)] font-body">
      {/* Top Banner */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-page)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2.5">
          <BrandLogo variant="horizontal" size="md" asLink href="/" />
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
            Order Confirmed
          </span>
        </div>

        <Link
          to="/orders"
          className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          View All Orders &rarr;
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Payment Pending / Failed Guard (Never show success before verified) */}
        {!isVerifiedSuccess ? (
          <div className="text-center space-y-4 p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-head font-medium text-[var(--ink)]">
              {isFailed ? 'Payment Not Completed' : 'Awaiting Payment Verification'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto">
              Order <span className="font-mono font-bold text-[var(--ink)]">#{orderRef}</span> is currently{' '}
              <span className="font-semibold">{order.paymentStatus}</span>. Complete payment verification to confirm your NFC card production.
            </p>
            {retryError && (
              <p className="text-xs text-rose-600 font-medium">{retryError}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={isRetryingPayment}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-sm)] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-semibold text-xs sm:text-sm transition-colors"
              >
                {isRetryingPayment ? 'Verifying Payment...' : 'Complete & Verify Payment'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to={`/orders/${order.id}/track`}
                className="px-5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--bg-raised)]"
              >
                View Order Status
              </Link>
            </div>
          </div>
        ) : (
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] mx-auto flex items-center justify-center shadow-lg shadow-[var(--accent)]/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-head font-medium text-[var(--ink)] tracking-tight">
            Order Placed Successfully!
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[var(--ink-muted)]">
            <span>Order</span>
            <span className="font-mono font-bold text-[var(--ink)]">#{orderRef}</span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--bg-raised)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
              title="Copy Order ID"
              aria-label="Copy Order ID"
            >
              {copiedOrderId ? <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-[var(--ink-muted)] font-mono">
            Estimated express delivery: 2–4 business days
          </p>

          <div className="pt-3 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to={`/profile-setup?orderId=${encodeURIComponent(order.id)}`}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-[var(--radius-sm)] bg-[#FF6A00] hover:bg-[#E85D00] text-white font-semibold text-xs sm:text-sm shadow-sm active:translate-y-[1px] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Set Up My Digital Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cards"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--ink)] font-semibold text-xs sm:text-sm transition-colors"
              >
                <span>I&apos;ll Do This Later</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs">
              <Link
                to={`/orders/${order.id}/track`}
                className="inline-flex items-center gap-1.5 font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>View Order &amp; Tracking</span>
              </Link>
              {order.attachedProfile?.slug && (
                <Link
                  to={`/${order.attachedProfile.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-[#FF6A00] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View My Profile</span>
                </Link>
              )}
              <Link
                to="/"
                className="font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                Continue Exploring Taptch
              </Link>
            </div>
          </div>
        </div>
        )}

        {/* Order Details & Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card & Items Summary */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Package className="w-4 h-4 text-[var(--accent)]" />
              NFC Hardware Ordered
            </h3>

            {order.items && order.items.length > 0 ? (
              order.items.map((it: any) => (
                    <div key={it.id} className="flex items-center justify-between text-xs py-2 border-b border-[var(--border)] last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-[72px] h-[45px] rounded-[6px] overflow-hidden border border-[#E9E9E6] shrink-0 bg-[#161616]">
                          <CardPreview
                            frontUrl={it.previewFrontUrl || it.designPreviewUrl || it.previewUrl}
                            backUrl={it.previewBackUrl || it.backPreviewUrl}
                            width="72px"
                            height="45px"
                            cloudinaryWidth={240}
                            alt={it.productName || 'Smart NFC Card'}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[var(--ink)] capitalize">{it.productName || `${it.cardMaterial || 'PVC'} Smart NFC Card`}</p>
                          <p className="text-[11px] text-[var(--ink-muted)]">Quantity: {it.quantity || 1} &bull; Custom Artwork</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[var(--ink)]">
                        ₹{(it.unitPrice * (it.quantity || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    ))
                    ) : (
                    <div className="text-xs text-[var(--ink-muted)]">
                      <p className="font-semibold text-[var(--ink)] capitalize">{order.material || 'PVC'} Smart NFC Card</p>
                      <p>Quantity: {order.quantity || 1}</p>
                    </div>
            )}

                    {/* Independent Digital Profile Callout (Optional) */}
                    <div className="pt-3 border-t border-[var(--border)]">
                      <p className="text-[11px] font-semibold text-[var(--ink-muted)] mb-1.5">Digital Profile (Optional)</p>
                      {order.attachedProfile ? (
                        <div className="p-3 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[var(--ink)]">{order.attachedProfile.displayName || order.attachedProfile.name}</p>
                            <p className="text-[10px] font-mono text-[var(--accent)]">/{order.attachedProfile.slug}</p>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                            Linked
                          </span>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-[var(--bg-raised)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-[var(--ink)]">
                              Your physical card order is confirmed.
                            </p>
                            <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                              Create or connect a digital profile to your card anytime from My NFC Cards.
                            </p>
                          </div>
                          <Link
                            to="/cards"
                            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Set Up Your Digital Profile</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping & Payment Status */}
                  <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-4 shadow-xl">
                    <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
                      <MapPin className="w-4 h-4 text-[var(--accent)]" />
                      Shipping &amp; Payment Summary
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{shipping.fullName || shipping.recipientName || 'Recipient'}</p>
                        <p className="text-[var(--ink-muted)]">{shipping.addressLine1 || shipping.street}</p>
                        {shipping.addressLine2 && <p className="text-[var(--ink-muted)]">{shipping.addressLine2}</p>}
                        <p className="text-[var(--ink-muted)] font-mono">
                          {shipping.city}, {shipping.state} - {shipping.postalCode}
                        </p>
                        <p className="text-[var(--ink-muted)] font-mono mt-1">Phone: {shipping.phone}</p>
                      </div>

                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink-muted)]">Payment Method</p>
                          <p className="text-xs font-bold text-[var(--ink)] capitalize">{order.paymentMethod || 'Online'}</p>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-[var(--radius-sm)] font-bold uppercase ${isPaid
                              ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                              : isCod
                                ? 'bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30'
                                : 'bg-[var(--bg-raised)] text-[var(--ink)] border border-[var(--border)]'
                            }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm font-bold text-[var(--ink)]">
                        <span>Grand Total:</span>
                        <span className="font-mono text-base text-[var(--accent)] font-bold">
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

        {/* Bottom Navigation */ }
                < div className = "flex flex-col sm:flex-row items-center justify-center gap-3 pt-4" >
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-sm)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-xs font-semibold text-center shadow-sm active:translate-y-[1px] transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            to={`/orders/${order.id}/track`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold text-[var(--ink)] text-center transition-colors"
          >
            Track Status Timeline
          </Link>
          <Link
            to="/studio"
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-raised)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)] text-center transition-colors"
          >
            Design Another Card
          </Link>
        </div>
      </main>
    </div>
  );
}
