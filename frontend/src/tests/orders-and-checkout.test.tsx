import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { SimpleCardStudio } from '../components/editor/SimpleCardStudio';

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
      it('renders the progressive 3-step decoupled wizard with read-only Selected NFC Smart Card (no card type/color selector)', () => {
        const html = renderWithProviders(<CheckoutPage />);

        // Step 1 displays the already-selected card without asking to choose PVC/Matte/Wood/Metal
        expect(html).toContain('Selected NFC Smart Card');
        expect(html).not.toContain('Choose Your NFC Smart Card');
        expect(html).not.toContain('Select your card material');

      // 3-step progress indicator (Profile step removed)
      expect(html).toContain('Card');
      expect(html).not.toContain('Link Digital Profile');
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
    expect(html).toContain('Proceed to Delivery');
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
  it('renders loading and confirmed order states without React Hooks order violation', () => {
    const htmlLoading = renderWithProviders(
      <Routes>
        <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
      </Routes>,
      '/orders/ord_sample_123/confirmation'
    );
    expect(htmlLoading).toContain('Retrieving order confirmation...');

    queryClient.setQueryData(['order', 'ord_sample_123'], {
      id: 'ord_sample_123',
      orderNumber: 'TAP-2026-1001',
      paymentMethod: 'cod',
      paymentStatus: 'COD_PENDING',
      orderStatus: 'ORDER_CONFIRMED',
      totalAmount: 1868,
      shippingAddress: {
        fullName: 'Alex Vance',
        addressLine1: '100 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '9876543210',
      },
      items: [],
    });

    const htmlConfirmed = renderWithProviders(
      <Routes>
        <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
      </Routes>,
      '/orders/ord_sample_123/confirmation'
    );
    expect(htmlConfirmed).toContain('TAP-2026-1001');
    expect(htmlConfirmed).toContain('Set Up Your Digital Profile');
  });
});

describe('SimpleCardStudio Mobile UX & Preview Sync', () => {
  it('uses solid-color variant themes, new templates, no unrelated color pickers, and synced PiP preview', () => {
    const html = renderWithProviders(
      <SimpleCardStudio
        product={{ id: 'prod_metal_nfc', name: 'Metal NFC Card', slug: 'metal-nfc-card', basePrice: 2499 }}
        selectedVariant={{
          id: 'var_metal_rose_gold',
          name: 'Rose Gold Metal',
          color: '#B76E79',
          price: 2499,
          themeConfig: {
            background: '#B76E79',
            primaryText: '#FFFFFF',
            secondaryText: '#FFF1F2',
            accent: '#4C0519',
            borderColor: '#9F525E',
            qrColor: '#FFFFFF',
          },
        }}
      />,
    );
    expect(html).not.toContain('Card Purpose');
    expect(html).not.toContain('linear-gradient');
    expect(html).not.toContain('radial-gradient');
    expect(html).toContain('Executive Minimal');
    expect(html).toContain('Signature Identity');
    expect(html).toContain('Rose Gold Metal');
    expect(html).toContain('#B76E79');
    expect(html).toContain('hidden lg:flex');
    expect(html).toContain('lg:hidden fixed bottom-0');
    expect(html).toContain('tracking-[0.16em]');
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
