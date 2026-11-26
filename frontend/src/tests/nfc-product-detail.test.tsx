import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NfcProductDetailPage } from '../pages/NfcProductDetailPage';
import { NfcCardsPage } from '../pages/NfcCardsPage';

const MOCK_PRODUCTS = [
  {
    id: 'prod_classic_pvc',
    name: 'Classic White PVC NFC Card',
    slug: 'classic-white-pvc-nfc-card',
    description: 'Crisp white matte finish premium PVC smart contactless card.',
    category: 'Classic NFC Cards',
    material: 'pvc',
    basePrice: 1499,
    discountPrice: null,
    canvasWidth: 1050,
    canvasHeight: 600,
    supportedSides: 'FRONT_AND_BACK',
    isActive: true,
    inStock: true,
    variants: [
      { id: 'var_white_matte', name: 'Bright White Matte', color: '#FAF8F5', finish: 'matte', price: 1499 },
    ],
  },
  {
    id: 'prod_brushed_metal',
    name: 'Executive Brushed Metal Card',
    slug: 'executive-brushed-metal-card',
    description: 'CNC-machined aerospace grade metal NFC card.',
    category: 'Metal NFC Cards',
    material: 'metal',
    basePrice: 2999,
    discountPrice: 2499,
    canvasWidth: 1050,
    canvasHeight: 600,
    supportedSides: 'FRONT_AND_BACK',
    isActive: true,
    inStock: true,
    variants: [
      { id: 'var_raw_steel', name: 'Raw Stainless Steel', color: '#C4C4CC', finish: 'brushed', price: 2499 },
      { id: 'var_black_titanium', name: 'Matte Black Titanium', color: '#16161B', finish: 'pvd', price: 2999 },
    ],
  },
];

describe('NFC Product Catalog & Product Detail Experience', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('NfcCardsPage renders catalog items with View Details and Design Your Card links', () => {
    qc.setQueryData(['public', 'products'], MOCK_PRODUCTS);
    qc.setQueryData(['public', 'card-templates', 'prod_matte_obsidian'], []);

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/nfc-cards']}>
          <NfcCardsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Classic White PVC NFC Card');
    expect(html).toContain('Executive Brushed Metal Card');
    expect(html).toContain('/nfc-cards/classic-white-pvc-nfc-card');
    expect(html).toContain('/nfc-cards/executive-brushed-metal-card');
    expect(html).toContain('View Details');
    expect(html).toContain('Design This Card');
  });

  it('NfcProductDetailPage renders gallery, variants, pricing, specifications, how-it-works, and related products', () => {
    qc.setQueryData(['public', 'product', 'executive-brushed-metal-card'], MOCK_PRODUCTS[1]);
    qc.setQueryData(['public', 'products'], MOCK_PRODUCTS);
    qc.setQueryData(['public', 'card-templates', 'prod_brushed_metal'], []);

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/nfc-cards/executive-brushed-metal-card']}>
          <Routes>
            <Route path="/nfc-cards/:slug" element={<NfcProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Executive Brushed Metal Card');
    expect(html).toContain('Metal NFC Cards');
    expect(html).toContain('Material:');
    expect(html).toContain('Color:');
    expect(html).toContain('Raw Stainless Steel');
    expect(html).toContain('2,499');
    expect(html).toContain('DESIGN THIS CARD');
    expect(html).toContain('Product Specifications');
    expect(html).toContain('Why Choose This Card?');
    expect(html).toContain('HOW IT WORKS');
    expect(html).toContain('Related NFC Smart Cards');
    expect(html).toContain('Classic White PVC NFC Card');
  });
});
