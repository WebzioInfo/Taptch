import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../services/api';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { CardPreview } from '../components/cards/CardPreview';
import { defaultBrandConfig } from '../config/brand';
import { env } from '../config/env';
import { resolveCardPublicUrl } from '../lib/card-url';
import { CARD_STATUS_LABELS, normalizeCardStatus } from '../lib/card-status';
import {
  CreditCard,
  Sparkles,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Package,
  Link2,
  Unlink,
  Loader2,
  User,
  Building2,
  Search,
  Copy,
  Check,
  RefreshCw,
  X,
  Lock,
  Headphones,
} from 'lucide-react';

export function CardsPage() {
  const queryClient = useQueryClient();
  const [managingCard, setManagingCard] = useState<any | null>(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [supportCard, setSupportCard] = useState<{
    cardCode: string;
    orderRef: string;
    status: string;
  } | null>(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  const {
    data: rawPurchasedCards = [],
    isLoading: isPurchasedLoading,
    isError: isPurchasedError,
    error: purchasedError,
    refetch: refetchPurchased,
  } = useQuery<any[]>({
    queryKey: ['cards', 'purchased'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/cards/purchased'),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const {
    data: rawPhysicalCards = [],
    isLoading: isPhysicalLoading,
    refetch: refetchPhysical,
  } = useQuery<any[]>({
    queryKey: ['cards', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/cards'),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { data: rawProfiles = [] } = useQuery<any[]>({
    queryKey: ['profiles', 'my'],
    queryFn: () => ApiClient.get<any[]>('/api/v1/profiles'),
  });

  const purchasedCards = Array.isArray(rawPurchasedCards) ? rawPurchasedCards : [];
  const physicalCards = Array.isArray(rawPhysicalCards) ? rawPhysicalCards : [];
  const profiles = Array.isArray(rawProfiles) ? rawProfiles : [];

  const isLoading = isPurchasedLoading || isPhysicalLoading;

  const stats = useMemo(() => {
    const total = purchasedCards.length;
    const active = purchasedCards.filter((c) => normalizeCardStatus(c.status) === 'ACTIVE').length;
    const awaiting = purchasedCards.filter(
      (c) => !Boolean(c.isRegistered ?? (c.physicalCardId || normalizeCardStatus(c.status) === 'ACTIVE')),
    ).length;
    const configured = purchasedCards.filter((c) =>
      Boolean(c.profileAttached ?? (c.profileId && c.profile)),
    ).length;
    const unconfigured = purchasedCards.filter(
      (c) => normalizeCardStatus(c.status) === 'UNASSIGNED',
    ).length;
    return { total, active, awaiting, configured, unconfigured };
  }, [purchasedCards]);

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.displayName || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q),
    );
  }, [profiles, profileSearch]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) || null,
    [profiles, selectedProfileId],
  );

  const openSupportModal = (card: any) => {
    const code = card.cardCode || card.id;
    const orderRef = card.orderNumber || card.order?.orderNumber || card.orderId || 'N/A';
    const statusLabel = card.status === 'LOST' ? 'Lost' : 'Suspended';
    setSupportCard({ cardCode: code, orderRef, status: statusLabel });
    setSupportSubject(`Help with ${statusLabel} Card ${code} (Order #${orderRef})`);
    setSupportMessage(
      `Card Code: ${code}\nOrder ID: ${orderRef}\nCurrent Status: ${statusLabel}\n\nPlease assist with this card:`,
    );
    setSupportError(null);
    setSupportSuccess(null);
  };

  const handleSubmitSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      setSupportError('Please enter a subject and message.');
      return;
    }
    setSupportSubmitting(true);
    setSupportError(null);
    try {
      const res = await ApiClient.post<{ ticket?: { ticketNumber?: string } }>('/api/v1/tickets', {
        subject: supportSubject.trim(),
        category: 'card',
        priority: 'high',
        message: supportMessage.trim(),
      });
      setSupportSuccess(
        `Support ticket ${res?.ticket?.ticketNumber || ''} created. Our team will respond shortly.`,
      );
    } catch (err: any) {
      setSupportError(err?.message || 'Failed to submit support ticket.');
    } finally {
      setSupportSubmitting(false);
    }
  };

  const openManageDestination = (card: any) => {
    setManagingCard(card);
    setSaveError(null);
    setProfileSearch('');
    setSelectedProfileId(card.profileId || profiles[0]?.id || '');
  };

  const handleSaveDestination = async () => {
    if (!managingCard) return;
    setSaveError(null);

    if (!selectedProfileId) {
      setSaveError('Please select a profile to attach to this NFC card.');
      return;
    }

    setIsSaving(true);
    try {
      await ApiClient.post(`/api/v1/cards/purchased/${encodeURIComponent(managingCard.id)}/attach-profile`, {
        profileId: selectedProfileId,
      });
      await queryClient.invalidateQueries({ queryKey: ['cards', 'purchased'] });
      await queryClient.invalidateQueries({ queryKey: ['cards', 'my'] });
      setManagingCard(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to attach profile to NFC card.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDestination = async () => {
    if (!managingCard) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await ApiClient.post(`/api/v1/cards/purchased/${encodeURIComponent(managingCard.id)}/disconnect-profile`, {});
      await queryClient.invalidateQueries({ queryKey: ['cards', 'purchased'] });
      await queryClient.invalidateQueries({ queryKey: ['cards', 'my'] });
      setManagingCard(null);
    } catch (err: any) {
      setSaveError(err?.message || 'Could not disconnect profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = () => {
    refetchPurchased();
    refetchPhysical();
  };

  const getNfcProfileUrl = (card: any) => resolveCardPublicUrl(card);

  const handleCopyNfcUrl = (cardId: string, card: any) => {
    const url = getNfcProfileUrl(card);
    if (!url || typeof navigator === 'undefined') return;
    navigator.clipboard?.writeText(url);
    setCopiedCardId(cardId);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 font-body text-[var(--ink)] space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="font-head text-2xl font-medium tracking-tight text-[var(--ink)]">
            My NFC Cards
          </h1>
          <p className="font-body text-sm text-[var(--ink-muted)] mt-1">
            Attach each NFC card to one of your {defaultBrandConfig.name} profiles and view its public tap URL.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link to="/dashboard/nfc-shop">
            <Button
              variant="accent"
              className="rounded-[var(--radius-sm)] text-xs font-medium gap-1.5 shadow-none bg-[#FF6A00] hover:bg-[#E85D00] text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>Order New NFC Card</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Overview Statistics */}
      {!isLoading && !isPurchasedError && purchasedCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] block">Total Purchased</span>
            <span className="font-mono text-xl font-bold text-[var(--ink)] mt-1 block">{stats.total}</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] block">Active / Registered</span>
            <span className="font-mono text-xl font-bold text-emerald-600 mt-1 block">{stats.active}</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] block">Awaiting Registration</span>
            <span className="font-mono text-xl font-bold text-amber-600 mt-1 block">{stats.awaiting}</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[var(--border)]">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] block">Profile Attached</span>
            <span className="font-mono text-xl font-bold text-[#FF6A00] mt-1 block">{stats.configured}</span>
          </div>
          <div className="p-4 rounded-xl bg-white border border-[var(--border)] col-span-2 sm:col-span-1">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] block">Unassigned</span>
            <span className="font-mono text-xl font-bold text-[var(--ink-muted)] mt-1 block">{stats.unconfigured}</span>
          </div>
        </div>
      )}

      {/* 3. Cards Listing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#FF6A00]" />
            <span>Your NFC Cards ({purchasedCards.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-white border border-[var(--border)] animate-pulse"
              />
            ))}
          </div>
        ) : isPurchasedError ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-rose-200 bg-rose-50/70 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-head text-base font-semibold text-[#171717]">
              Unable to load your NFC cards
            </h3>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              {purchasedError instanceof Error ? purchasedError.message : 'A network error occurred.'}
            </p>
            <Button type="button" variant="outline" onClick={handleRefresh} className="text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : purchasedCards.length === 0 && physicalCards.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[var(--border)] bg-white">
            <div className="w-12 h-12 rounded-xl bg-[#FFF3E9] border border-[#FF6A00]/20 flex items-center justify-center text-[#FF6A00] mx-auto mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-head text-lg font-medium text-[var(--ink)] mb-1">No NFC cards yet</h3>
            <p className="font-body text-xs sm:text-sm text-[var(--ink-muted)] max-w-md mx-auto mb-6">
              Explore our NFC cards and create your own personalized physical card.
            </p>
            <Link to="/dashboard/nfc-shop">
              <Button
                variant="accent"
                className="rounded-[var(--radius-sm)] text-xs font-semibold bg-[#FF6A00] hover:bg-[#E85D00] text-white"
              >
                Explore NFC Cards
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchasedCards.map((card) => {
              const upperStatus = (card.status || '').toUpperCase();
              const isLocked =
                Boolean(card.isLocked) ||
                upperStatus === 'SUSPENDED' ||
                upperStatus === 'LOST';

              if (isLocked) {
                const isLost = upperStatus === 'LOST';
                const statusChangedLabel = card.statusChangedAt
                  ? new Date(card.statusChangedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  : '';

                return (
                  <div
                    key={card.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F5] border border-[#E3E3DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-95"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-[104px] h-[66px] rounded-[8px] border border-[#DCDCD7] bg-[#E8E8E4] shrink-0 flex flex-col items-center justify-center text-[#7A7A75]">
                        <Lock className="w-5 h-5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">
                          Locked
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-sm text-[#4A4A46] truncate">
                            {card.productName || 'Custom NFC Card'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${isLost
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                          >
                            {isLost ? 'Lost' : 'Suspended'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6B66]">
                          {card.cardCode && (
                            <span className="font-mono font-semibold text-[#4A4A46]">
                              {card.cardCode}
                            </span>
                          )}
                          {(card.colorName || card.variantName || card.material) && (
                            <span>
                              · {(card.material || 'PVC').toUpperCase()}
                              {(card.colorName || card.variantName)
                                ? ` · ${card.colorName || card.variantName}`
                                : ''}
                            </span>
                          )}
                          {(card.orderNumber || card.orderId) && (
                            <span>
                              · Order #{card.orderNumber || String(card.orderId).slice(0, 8)}
                            </span>
                          )}
                          {statusChangedLabel && (
                            <span>· Status changed {statusChangedLabel}</span>
                          )}
                        </div>

                        <p className="text-xs text-[#5B5B57] pt-0.5">
                          {card.message ||
                            (isLost
                              ? 'This card is marked as lost and has been disabled.'
                              : "This card is suspended. It can't be used until it's reactivated.")}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openSupportModal(card)}
                        className="text-xs font-semibold gap-1.5 bg-white border-[#D6D6D1] text-[#161616] hover:bg-[#F0F0EC]"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Contact support</span>
                      </Button>
                    </div>
                  </div>
                );
              }

              const canonicalStatus = normalizeCardStatus(card.status);
              const isProfileAttached = Boolean(card.profileAttached ?? (card.profileId && card.profile));
              const isRegistered = Boolean(
                card.isRegistered ?? (card.physicalCardId || canonicalStatus === 'ACTIVE'),
              );
              const statusBadgeClass =
                canonicalStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : canonicalStatus === 'ASSIGNED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : canonicalStatus === 'SUSPENDED' || canonicalStatus === 'LOST'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200';
              const hasLegacyCustomUrl =
                !isProfileAttached &&
                card.destinationType === 'custom_url' &&
                Boolean(card.customDestinationUrl);
              const nfcUrl = getNfcProfileUrl(card);
              const updatedLabel = card.updatedAt
                ? new Date(card.updatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                : '';

              return (
                <div
                  key={card.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center shadow-xs"
                >
                  {/* LEFT 50%: Card Preview, Title, Status, Attached Profile */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-[104px] h-[66px] rounded-[8px] overflow-hidden border border-[var(--border)] shrink-0 bg-[#161616]">
                      <CardPreview
                        frontUrl={card.previewFrontUrl}
                        backUrl={card.previewBackUrl}
                        width="104px"
                        height="66px"
                        allowFlip={true}
                        cloudinaryWidth={240}
                        alt={card.productName || 'NFC Smart Card'}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-[var(--ink)] truncate">
                          {card.productName || 'Custom NFC Card'}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F9FA] border border-[var(--border)] text-[var(--ink-muted)] shrink-0">
                          Card #{card.unitIndex || 1}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${statusBadgeClass}`}>
                            {CARD_STATUS_LABELS[canonicalStatus]}
                          </span>
                          {!isRegistered && canonicalStatus !== 'SUSPENDED' && canonicalStatus !== 'LOST' && (
                            <span className="px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Awaiting Registration
                            </span>
                          )}
                          {(card.colorName || card.variantName || card.material) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F8F9FA] border border-[var(--border)] text-[var(--ink-muted)] font-medium">
                              {card.color && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                                  style={{ backgroundColor: card.color }}
                                />
                              )}
                              <span className="uppercase">{card.material || 'PVC'}</span>
                              {(card.colorName || card.variantName) && (
                                <span>&middot; {card.colorName || card.variantName}</span>
                              )}
                            </span>
                          )}
                          <span className="text-[var(--ink-muted)]">
                            &bull; Order #{card.order?.orderNumber || card.orderId?.slice(0, 8)}
                          </span>
                      </div>

                      <div className="pt-0.5 text-xs">
                        {isProfileAttached ? (
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium truncate">
                              {card.profile.displayName} (@{card.profile.slug})
                            </span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
                              {card.profile.profileType === 'business' ? 'Business' : 'Personal'}
                            </span>
                          </div>
                        ) : hasLegacyCustomUrl ? (
                          <div className="flex items-center gap-1.5 text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium truncate">
                              Needs profile assignment (legacy card)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#FF6A00]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium">No profile attached yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT 50%: Permanent NFC URL & Configuration Action */}
                  <div className="flex flex-col gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--border)] lg:pl-6 min-w-0">
                    {nfcUrl && (
                      <div className="px-3 py-2 rounded-xl bg-[#F8F9FB] border border-[var(--border)] flex items-center justify-between gap-2 text-[11px]">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
                            Permanent NFC URL
                          </span>
                          <span className="font-mono text-[var(--ink)] truncate block">{nfcUrl}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyNfcUrl(card.id, card)}
                            aria-label="Copy NFC URL"
                            className="p-1.5 rounded-lg border border-[var(--border)] bg-white hover:border-[#FF6A00] text-[var(--ink-muted)] hover:text-[#171717]"
                          >
                            {copiedCardId === card.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={nfcUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open NFC URL"
                            className="p-1.5 rounded-lg border border-[var(--border)] bg-white hover:border-[#FF6A00] text-[var(--ink-muted)] hover:text-[#FF6A00]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[var(--ink-muted)] truncate">
                        {updatedLabel ? `Updated ${updatedLabel}` : ''}
                      </span>
                      <Button
                        type="button"
                        variant={isProfileAttached ? 'outline' : 'accent'}
                        onClick={() => openManageDestination(card)}
                        className={`text-xs font-semibold gap-1.5 shrink-0 ${isProfileAttached
                          ? ''
                          : 'bg-[#FF6A00] hover:bg-[#E85D00] text-white'
                          }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{isProfileAttached ? 'Change Profile' : 'Select Profile'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
        }
      </section >

      {/* Attach Profile Modal (Profile-Only, No External URLs) */}
      {
        managingCard && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => !isSaving && setManagingCard(null)}
          >
            <div
              className="bg-white rounded-2xl border border-[var(--border)] max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div>
                  <h2 className="font-head text-lg font-semibold text-[#171717]">
                    Attach {defaultBrandConfig.name} Profile
                  </h2>
                  <p className="text-xs text-[#666666] mt-0.5">
                    {managingCard.productName || 'NFC Card'} &bull; Card #{managingCard.unitIndex || 1}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close profile selection modal"
                  onClick={() => !isSaving && setManagingCard(null)}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[#F8F9FB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="space-y-3">
                {profiles.length === 0 ? (
                  <div className="p-5 rounded-xl bg-[#F8F9FB] border border-[var(--border)] text-center space-y-3">
                    <p className="text-xs text-[#52525B]">
                      You haven&apos;t created any {defaultBrandConfig.name} profiles yet. Create a personal or business profile with your unique username, then attach it here.
                    </p>
                    <Link to="/builder/new">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#FF6A00] text-[#FF6A00]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Create Digital Profile</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#929292]" />
                      <input
                        type="text"
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        placeholder="Search your profiles by name or username..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--border)] bg-[#F8F9FB] focus:bg-white focus:outline-none focus:border-[#FF6A00]"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {filteredProfiles.map((p) => {
                        const isSel = selectedProfileId === p.id;
                        const isBiz = p.profileType === 'business';
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedProfileId(p.id)}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${isSel
                              ? 'border-[#FF6A00] bg-[#FFF3E9]'
                              : 'border-[var(--border)] bg-white hover:border-[#D4D4D8]'
                              }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                {isBiz ? (
                                  <Building2 className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                                )}
                                <p className="text-xs font-semibold text-[#171717] truncate">
                                  {p.displayName}
                                </p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8F9FB] border border-[var(--border)] text-[#666666] uppercase">
                                  {isBiz ? 'Business' : 'Personal'}
                                </span>
                              </div>
                              <p className="font-mono text-[11px] text-[#666666] truncate">
                                @{p.slug} &bull; {env.nfcPublicBaseUrl}/{p.slug}
                              </p>
                            </div>
                            {isSel && <Check className="w-4 h-4 text-[#FF6A00] shrink-0" />}
                          </button>
                        );
                      })}
                      {filteredProfiles.length === 0 && (
                        <p className="text-xs text-center text-[#666666] py-4">
                          No profiles match &quot;{profileSearch}&quot;.
                        </p>
                      )}
                    </div>

                    {/* Selected Profile Public URL Preview */}
                    {selectedProfile && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                          NFC Chip &amp; QR Public URL
                        </span>
                        <p className="font-mono text-emerald-900 break-all">
                          {env.nfcPublicBaseUrl}/{selectedProfile.slug}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                {
                  managingCard.profileId ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleRemoveDestination}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Profile</span>
                    </button>
                  ) : (
                    <span />
                  )
                }

                < div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setManagingCard(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isSaving || profiles.length === 0 || !selectedProfileId}
                    onClick={handleSaveDestination}
                    className="bg-[#FF6A00] hover:bg-[#E85D00] text-white text-xs font-semibold gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Attaching...</span>
                      </>
                    ) : (
                      <span>Attach Profile</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Contact Support Modal (pre-filled with card code and order ID) */}
      <Modal
        open={Boolean(supportCard)}
        onClose={() => !supportSubmitting && setSupportCard(null)}
        title="Contact Support"
        subtitle={
          supportCard
            ? `Card ${supportCard.cardCode} · Order #${supportCard.orderRef}`
            : undefined
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              disabled={supportSubmitting}
              onClick={() => setSupportCard(null)}
            >
              {supportSuccess ? 'Close' : 'Cancel'}
            </Button>
            {!supportSuccess && (
              <Button
                type="button"
                disabled={supportSubmitting}
                onClick={handleSubmitSupport}
                className="bg-[#FF6A00] hover:bg-[#E85D00] text-white"
              >
                {supportSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {supportError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              {supportError}
            </div>
          )}
          {supportSuccess ? (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              {supportSuccess}
            </div>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--ink)] mb-1">Message</label>
                <textarea
                  rows={5}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
