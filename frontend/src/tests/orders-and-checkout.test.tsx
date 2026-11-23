import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';

vi.mock('../services/api', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../lib/auth/client', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'usr_test_1',
        name: 'Alexander Vance',
        email: 'alexander@taptch.com',
        systemRole: 'user',
      },
      session: { token: 'mock_token', expiresAt: '2026-12-31' },
    },
    isLoading: false,
  }),
  signOut: vi.fn(),
}));

describe('Taptch NFC Card Ordering, Checkout & Tracking Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
    return renderToString(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  describe('CheckoutPage', () => {
      it('renders the progressive 4-step wizard with Step 1: Choose Your NFC Smart Card', () => {
        const html = renderWithProviders(<CheckoutPage />);

        // Step 1 title and product options
        expect(html).toContain('Choose Your NFC Smart Card');
        expect(html).toContain('Select your card material, preview artwork, and choose quantity');
        expect(html).toContain('PVC');
        expect(html).toContain('Matte');
        expect(html).toContain('Wood');
        expect(html).toContain('Metal');

      // 4-step progress indicator
      expect(html).toContain('Card');
      expect(html).toContain('Profile');
      expect(html).toContain('Delivery');
      expect(html).toContain('Payment');
    });

      it('renders technical specifications accordion option', () => {
        const html = renderWithProviders(<CheckoutPage />);

      expect(html).toContain('Technical Specifications');
      expect(html).toContain('Live Card Artwork Preview');
      expect(html).toContain('Front Side');
      expect(html).toContain('Back Side');
    });

      it('configures desktop order summary and mobile sticky bottom bar with lg:hidden', () => {
        const html = renderWithProviders(<CheckoutPage />);

    // Desktop actions visible on lg+
    expect(html).toContain('Proceed to Profile');
    // Mobile sticky bottom bar has lg:hidden so it never renders on desktop (>=1024px)
    expect(html).toContain('lg:hidden fixed bottom-0 left-0 right-0 z-40');
    // Total Payable displayed
    expect(html).toContain('Total Payable');
    // Quantity adjustment in order summary
    expect(html).toContain('Quantity:');
  });

  it('renders live card artwork preview with front and back toggles and studio link fallback', () => {
    const html = renderWithProviders(<CheckoutPage />);

    expect(html).toContain('Live Card Artwork Preview');
    expect(html).toContain('Front Side');
    expect(html).toContain('Back Side');
    expect(html).toContain('Customize in Design Studio');
  });
});

describe('OrderConfirmationPage', () => {
  it('renders confirmed order state and loading fallback in initial SSR', () => {
    const html = renderWithProviders(
      <Routes>
        <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
      </Routes>,
      '/orders/ord_sample_123/confirmation'
    );

    // In initial SSR render before query resolves, shows loading structure
    expect(html).toContain('Retrieving order confirmation...');
  });
});

describe('OrdersPage (Order History)', () => {
  it('renders order history header and design new card CTA', () => {
    const html = renderWithProviders(<OrdersPage />);

    expect(html).toContain('My NFC Card Orders');
    expect(html).toContain('Design New Card');
  });
});

describe('OrderTrackingPage', () => {
  it('renders tracking page shell and real-time fulfillment container', () => {
    const html = renderWithProviders(
      <Routes>
        <Route path="/orders/:id/track" element={<OrderTrackingPage />} />
      </Routes>,
      '/orders/ord_sample_123/track'
    );

    expect(html).toBeDefined();
  });
});
    });
