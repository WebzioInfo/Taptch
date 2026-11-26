import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';
import { ApiClient } from '../services/api';
import { useSession } from '../lib/auth/client';

export const PENDING_JOURNEY_KEY = 'taptch_pending_journey';

export type JourneyStage =
  | 'EXPLORING'
  | 'AUTHENTICATION_REQUIRED'
  | 'ACCOUNT_SETUP'
  | 'PROFILE_TEMPLATE_SELECTION'
  | 'PROFILE_CREATION'
  | 'CARD_DESIGN'
  | 'CHECKOUT'
  | 'PAYMENT_PENDING'
  | 'COMPLETED';

export interface PendingPurchaseIntent {
  selectedProductId?: string | null;
  selectedVariantId?: string | null;
  selectedCardTemplateId?: string | null;
  selectedProfileTemplateId?: string | null;
  quantity?: number;
  source?: string;
  capturedAt?: string;
}

export interface PurchaseJourneyRecord {
  id: string;
  userId: string;
  stage: JourneyStage;
  accountType: 'personal' | 'business' | null;
  selectedProductId: string | null;
  selectedVariantId: string | null;
  selectedCardTemplateId: string | null;
  selectedProfileTemplateId: string | null;
  profileId: string | null;
  designId: string | null;
  quantity: number;
  orderId: string | null;
  metadata: Record<string, any>;
}

export interface JourneyContextResponse {
  user: {
    id: string;
    name: string;
    email: string;
    accountType: 'personal' | 'business' | null;
  } | null;
  entitlements: {
    maxProfiles: number;
    maxCards: number;
    tier: string;
    accountType?: 'personal' | 'business' | null;
  };
  profiles: Array<{
    id: string;
    slug: string;
    displayName: string;
    profileType: string;
    templateId: string;
    status: string;
    avatarUrl?: string | null;
    headline?: string | null;
  }>;
  designs: Array<{
    id: string;
    name: string;
    productId: string;
    variantId?: string | null;
    templateId?: string | null;
    profileId?: string | null;
    previewUrl?: string | null;
    backPreviewUrl?: string | null;
    previewFrontUrl?: string | null;
    previewBackUrl?: string | null;
    isDraft: boolean;
  }>;
  journey: PurchaseJourneyRecord | null;
}

export function savePendingPurchaseIntent(intent: PendingPurchaseIntent) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getPendingPurchaseIntent() || {};
    const merged: PendingPurchaseIntent = {
      ...existing,
      ...intent,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_JOURNEY_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage quota errors
  }
}

export function getPendingPurchaseIntent(): PendingPurchaseIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_JOURNEY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPurchaseIntent;
  } catch {
    return null;
  }
}

export function clearPendingPurchaseIntent() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_JOURNEY_KEY);
  } catch {
    // Ignore
  }
}

export function startPurchaseJourney(
  navigate: NavigateFunction,
  isAuthenticated: boolean,
  intent: PendingPurchaseIntent,
) {
  savePendingPurchaseIntent(intent);
  const params = new URLSearchParams();
  if (intent.selectedProductId) params.set('productId', intent.selectedProductId);
  if (intent.selectedVariantId) params.set('variantId', intent.selectedVariantId);
  if (intent.quantity && intent.quantity > 1) params.set('quantity', String(intent.quantity));
  const checkoutUrl = `/checkout${params.toString() ? `?${params.toString()}` : ''}`;

  if (isAuthenticated) {
    navigate(checkoutUrl);
  } else {
    navigate(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
  }
}

export function usePurchaseJourney() {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user?.id);
  const queryClient = useQueryClient();
  const syncedRef = useRef(false);

  const query = useQuery<JourneyContextResponse>({
    queryKey: ['purchase-journey', 'active', session?.user?.id],
    queryFn: () => ApiClient.get<JourneyContextResponse>('/api/v1/journey/active'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<PurchaseJourneyRecord> & { metadata?: Record<string, any> }) =>
      ApiClient.put<PurchaseJourneyRecord>('/api/v1/journey/active', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-journey', 'active'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (payload?: Partial<PurchaseJourneyRecord>) =>
      ApiClient.post<PurchaseJourneyRecord>('/api/v1/journey/reset', payload || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-journey', 'active'] });
    },
  });

  // Automatically sync pending pre-auth purchase intent into backend journey once authenticated
  useEffect(() => {
    if (!isAuthenticated || !query.data || syncedRef.current) return;
    const pending = getPendingPurchaseIntent();
    if (!pending) return;

    syncedRef.current = true;
    const hasCardOrTemplate =
      pending.selectedProductId ||
      pending.selectedVariantId ||
      pending.selectedCardTemplateId ||
      pending.selectedProfileTemplateId;

    if (hasCardOrTemplate) {
      updateMutation
        .mutateAsync({
          selectedProductId: pending.selectedProductId ?? undefined,
          selectedVariantId: pending.selectedVariantId ?? undefined,
          selectedCardTemplateId: pending.selectedCardTemplateId ?? undefined,
          selectedProfileTemplateId: pending.selectedProfileTemplateId ?? undefined,
          quantity: pending.quantity ?? 1,
        })
        .then(() => {
          clearPendingPurchaseIntent();
        })
        .catch(() => {
          syncedRef.current = false;
        });
    } else {
      clearPendingPurchaseIntent();
    }
  }, [isAuthenticated, query.data]);

  return {
    ...query,
    context: query.data,
    user: query.data?.user || null,
    entitlements: query.data?.entitlements || null,
    profiles: query.data?.profiles || [],
    designs: query.data?.designs || [],
    journey: query.data?.journey || null,
    updateJourney: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    resetJourney: resetMutation.mutateAsync,
    isResetting: resetMutation.isPending,
  };
}
