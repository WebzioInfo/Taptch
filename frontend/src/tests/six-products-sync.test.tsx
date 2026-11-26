import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DesignStudioPage } from '../pages/DesignStudioPage';
import { SimpleCardStudio } from '../components/editor/SimpleCardStudio';
import { CheckoutPage } from '../pages/CheckoutPage';

vi.mock('../lib/auth/client', () => ({
  useSession: () => ({
    data: {
      user: { id: 'usr_sync_1', name: 'Aarav Mehta', email: 'aarav@taptch.com' },
      session: { token: 'tok_sync' },
    },
    isPending: false,
  }),
}));

const SIX_PRODUCTS = [
  {
    id: 'prod_pvc_black',
    name: 'PVC NFC Card — Black',
    slug: 'pvc-nfc-card-black',
    material: 'pvc',
    colorName: 'Black',
    color: '#000000',
    basePrice: 1499,
    imageUrl: '/products/pvc-black.svg',
    themeConfig: {
      background: '#000000',
      primaryText: '#FFFFFF',
      secondaryText: '#D4AF37',
      accent: '#D4AF37',
      borderColor: '#27272A',
      qrColor: '#FFFFFF',
    },
  },
  {
    id: 'prod_pvc_white',
    name: 'PVC NFC Card — White',
    slug: 'pvc-nfc-card-white',
    material: 'pvc',
    colorName: 'White',
    color: '#FFFFFF',
    basePrice: 1499,
    imageUrl: '/products/pvc-white.svg',
    themeConfig: {
      background: '#FFFFFF',
      primaryText: '#111827',
      secondaryText: '#374151',
      accent: '#111827',
      borderColor: '#E5E7EB',
      qrColor: '#111827',
    },
  },
  {
    id: 'prod_metal_black',
    name: 'Metal NFC Card — Black',
    slug: 'metal-nfc-card-black',
    material: 'metal',
    colorName: 'Black',
    color: '#000000',
    basePrice: 2499,
    imageUrl: '/products/metal-black.svg',
    themeConfig: {
      background: '#000000',
      primaryText: '#FFFFFF',
      secondaryText: '#D4AF37',
      accent: '#D4AF37',
      borderColor: '#27272A',
      qrColor: '#D4AF37',
    },
  },
  {
    id: 'prod_metal_silver',
    name: 'Metal NFC Card — Silver',
    slug: 'metal-nfc-card-silver',
    material: 'metal',
    colorName: 'Silver',
    color: '#C0C0C0',
    basePrice: 2499,
    imageUrl: '/products/metal-silver.svg',
    themeConfig: {
      background: '#C0C0C0',
      primaryText: '#111111',
      secondaryText: '#374151',
      accent: '#4B5563',
      borderColor: '#9CA3AF',
      qrColor: '#111111',
    },
  },
  {
    id: 'prod_metal_gold',
    name: 'Metal NFC Card — Gold',
    slug: 'metal-nfc-card-gold',
    material: 'metal',
    colorName: 'Gold',
    color: '#D4AF37',
    basePrice: 2499,
    imageUrl: '/products/metal-gold.svg',
    themeConfig: {
      background: '#D4AF37',
      primaryText: '#111111',
      secondaryText: '#292524',
      accent: '#78350F',
      borderColor: '#A16207',
      qrColor: '#111111',
    },
  },
  {
    id: 'prod_metal_rose_gold',
    name: 'Metal NFC Card — Rose Gold',
    slug: 'metal-nfc-card-rose-gold',
    material: 'metal',
    colorName: 'Rose Gold',
    color: '#B76E79',
    basePrice: 2499,
    imageUrl: '/products/metal-rose-gold.svg',
    themeConfig: {
      background: '#B76E79',
      primaryText: '#FFFFFF',
      secondaryText: '#4C0519',
      accent: '#4C0519',
      borderColor: '#9F525E',
      qrColor: '#FFFFFF',
    },
  },
];

describe('6-Product State Synchronization (Studio Skeleton -> Studio -> Checkout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DesignStudioPage renders card skeleton on initial load instead of flashing a Black Card', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/studio/prod_metal_rose_gold']}>
        <Routes>
          <Route path="/studio/:productId" element={<DesignStudioPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain('aria-label="Loading NFC Card Design Studio"');
    expect(html).toContain('animate-pulse');
    expect(html).not.toContain('ALEX VANCE');
    expect(html).not.toContain('background-color:#000000');
  });

  it.each(SIX_PRODUCTS)(
    'SimpleCardStudio renders $name with exact solid background $color and no color picker',
    (prod) => {
      const html = renderToString(
        <MemoryRouter>
          <SimpleCardStudio product={prod} />
        </MemoryRouter>,
      );

      expect(html).toContain(prod.name);
      expect(html).toContain(`background-color:${prod.themeConfig.background}`);
      expect(html).not.toContain('linear-gradient');
      expect(html).not.toContain('radial-gradient');
    },
  );

  it.each(SIX_PRODUCTS)(
    'CheckoutPage displays $name ($colorName) with its exact image and price, without card material/color selectors',
    (prod) => {
      const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      qc.setQueryData(['public', 'product', prod.id], prod);

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={[`/checkout?productId=${prod.id}`]}>
            <CheckoutPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(html).toContain('Selected NFC Smart Card');
      expect(html).toContain(prod.name);
      expect(html).toContain(prod.colorName);
      expect(html).toContain(prod.imageUrl);
      expect(html).toContain(prod.basePrice.toLocaleString('en-IN'));
      expect(html).not.toContain('Choose Your NFC Smart Card');
    },
  );
});
