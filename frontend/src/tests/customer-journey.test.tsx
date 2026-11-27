import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NfcCardsPage } from '../pages/NfcCardsPage';
import { RegisterPage } from '../pages/RegisterPage';
import { CardsPage } from '../pages/CardsPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { getAuthState } from '../lib/auth/client';
import {
  savePendingPurchaseIntent,
  getPendingPurchaseIntent,
  clearPendingPurchaseIntent,
  startPurchaseJourney,
} from '../hooks/usePurchaseJourney';

function renderWithProviders(ui: React.ReactElement, route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Customer Purchase Journey & Public Exploration', () => {
  beforeEach(() => {
    clearPendingPurchaseIntent();
  });

  it('renders public NFC Cards catalog with all 6 independent products without authentication', () => {
    const html = renderWithProviders(<NfcCardsPage />, '/nfc-cards');
    expect(html).toContain('NFC Card Catalogue');
    expect(html).toContain('PVC NFC Cards');
    expect(html).toContain('Metal NFC Cards');
    expect(html).toContain('PVC NFC Card — Black');
    expect(html).toContain('PVC NFC Card — White');
    expect(html).toContain('Metal NFC Card — Black');
    expect(html).toContain('Metal NFC Card — Silver');
    expect(html).toContain('Metal NFC Card — Gold');
    expect(html).toContain('Metal NFC Card — Rose Gold');
    expect(html).toContain('/products/pvc-black.svg');
    expect(html).toContain('/products/pvc-white.svg');
    expect(html).toContain('/products/metal-black.svg');
    expect(html).toContain('/products/metal-silver.svg');
    expect(html).toContain('/products/metal-gold.svg');
    expect(html).toContain('/products/metal-rose-gold.svg');
    expect(html).toContain('View Details');
    expect(html).toContain('Customize');
  });

  it('renders Personal vs Business Account Type selection on RegisterPage', () => {
    const html = renderWithProviders(<RegisterPage />, '/register?redirect=%2Fcheckout');
    expect(html).toContain('Account Type');
    expect(html).toContain('Personal');
    expect(html).toContain('Business');
    expect(html).toContain('1 Profile');
    expect(html).toContain('Multi-Profile');
  });

  it('renders My NFC Cards management shell', () => {
    const html = renderWithProviders(<CardsPage />, '/cards');
    expect(html).toContain('My NFC Cards');
    expect(html).toContain('Order New NFC Card');
  });

  it('enforces 3-state auth lifecycle and blocks unauthenticated ProtectedRoute rendering', () => {
    expect(getAuthState(undefined, true)).toBe('INITIALIZING');
    expect(getAuthState({ user: null, session: null }, false)).toBe('UNAUTHENTICATED');
    expect(
      getAuthState(
        {
          user: { id: 'u1', email: 'a@b.com', name: 'A', systemRole: 'user' },
          session: { token: 't', expiresAt: '2099-01-01' },
        },
        false,
      ),
    ).toBe('AUTHENTICATED');

    const html = renderWithProviders(
      <ProtectedRoute>
        <div>SECRET_AUTHENTICATED_CONTENT</div>
      </ProtectedRoute>,
      '/dashboard',
    );
    expect(html).not.toContain('SECRET_AUTHENTICATED_CONTENT');
    expect(html).toContain('Verifying session...');
  });

  it('preserves pending purchase intent across unauthenticated redirects', () => {
    const store = new Map<string, string>();
    const prevWindow = (globalThis as any).window;
    const prevLocalStorage = (globalThis as any).localStorage;

    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    };
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockStorage;

    try {
      savePendingPurchaseIntent({
        selectedProductId: 'prod_brushed_metal',
        selectedVariantId: 'var_black_titanium',
        selectedProfileTemplateId: 'obsidian-luxury',
        quantity: 2,
      });

      const restored = getPendingPurchaseIntent();
      expect(restored?.selectedProductId).toBe('prod_brushed_metal');
      expect(restored?.selectedVariantId).toBe('var_black_titanium');
      expect(restored?.selectedProfileTemplateId).toBe('obsidian-luxury');
      expect(restored?.quantity).toBe(2);

      // Guest Order Now -> immediate redirect to /login?redirect=/checkout...
      const navigated: string[] = [];
      const mockNavigate = (to: any) => navigated.push(String(to));
      startPurchaseJourney(mockNavigate as any, false, {
        selectedProductId: 'prod_matte_obsidian',
        selectedVariantId: 'var_matte_black',
        quantity: 1,
      });
      expect(navigated[0]).toContain('/login?redirect=');
      expect(decodeURIComponent(navigated[0])).toContain('/checkout?productId=prod_matte_obsidian');

      // Authenticated Order Now -> direct /checkout without login
      startPurchaseJourney(mockNavigate as any, true, {
        selectedProductId: 'prod_matte_obsidian',
        selectedVariantId: 'var_matte_black',
        quantity: 1,
      });
      expect(navigated[1]).toBe('/checkout?productId=prod_matte_obsidian&variantId=var_matte_black');
    } finally {
      (globalThis as any).window = prevWindow;
      (globalThis as any).localStorage = prevLocalStorage;
    }
  });
});
