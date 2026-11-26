import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SimpleCardStudio } from '../components/editor/SimpleCardStudio';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import {
  WHATSAPP_SUPPORT_NUMBER,
  buildOrderDesignAssistanceMessage,
  buildStudioDesignAssistanceMessage,
  buildWhatsAppChatUrl,
} from '../utils/whatsappAssistance';

function extractWhatsAppHref(html: string): string {
  const match = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/);
  expect(match).not.toBeNull();
  return match![1].replace(/&amp;/g, '&');
}

describe('WhatsApp Design Assistance Integration', () => {
  it('builds properly URL-encoded wa.me/918089864422 links and handles missing optional fields gracefully', () => {
    expect(WHATSAPP_SUPPORT_NUMBER).toBe('918089864422');

    const studioMsg = buildStudioDesignAssistanceMessage({
      productName: undefined,
      variantName: null,
      templateName: '',
    });
    expect(studioMsg).toContain('Hi TAPTCH Team! I need assistance with designing my NFC card.');
    expect(studioMsg).toContain('Product: NFC Card');
    expect(studioMsg).not.toContain('Variant:');
    expect(studioMsg).not.toContain('Design Template:');

    const url = buildWhatsAppChatUrl(studioMsg);
    expect(url.startsWith('https://wa.me/918089864422?text=')).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('text')).toBe(studioMsg);
  });

  it('renders Need Assistance in Design? button in SimpleCardStudio with dynamic product, variant, and template', () => {
    const html = renderToString(
      <MemoryRouter>
        <SimpleCardStudio
          product={{ id: 'prod_metal_nfc', name: 'Metal NFC Card', slug: 'metal-nfc-card', material: 'metal' }}
          selectedVariant={{ id: 'var_metal_rose_gold', name: 'Rose Gold Metal', color: '#B76E79' }}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Need Assistance in Design?');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');

    const href = extractWhatsAppHref(html);
    const decodedText = new URL(href).searchParams.get('text') || '';
    expect(decodedText).toContain('Hi TAPTCH Team! I need assistance with designing my NFC card.');
    expect(decodedText).toContain('Product: Metal NFC Card');
    expect(decodedText).toContain('Variant: Rose Gold Metal');
    expect(decodedText).toContain('Design Template: Executive Minimal');
    expect(decodedText).toContain('Please help me customize my card.');
  });

  it('renders Need Assistance in Design? button in OrderTrackingPage with actual order details', () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    qc.setQueryData(['order', 'track', 'ord_test_123'], {
      id: 'ord_test_123',
      orderNumber: 'ORD-2026-9912',
      orderStatus: 'ORDER_CONFIRMED',
      paymentStatus: 'PAID',
      cardMaterial: 'pvc',
      totalAmount: 1769,
      items: [
        {
          id: 'item_1',
          productName: 'PVC NFC Card',
          variantName: 'Black PVC',
          quantity: 1,
          unitPrice: 1499,
          previewFrontUrl: '/products/pvc-black.svg',
        },
      ],
      shippingAddress: {
        fullName: 'Aarav Mehta',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
      },
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/orders/ord_test_123/track']}>
          <Routes>
            <Route path="/orders/:id/track" element={<OrderTrackingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Need Assistance in Design?');
    const href = extractWhatsAppHref(html);
    const decodedText = new URL(href).searchParams.get('text') || '';
    expect(decodedText).toContain('Hi TAPTCH Team! I need assistance with the design of my ordered NFC card.');
    expect(decodedText).toContain('Order ID: ORD-2026-9912');
    expect(decodedText).toContain('Product: PVC NFC Card');
    expect(decodedText).toContain('Variant: Black PVC');
    expect(decodedText).toContain('Please help me with my card design.');
  });
});
