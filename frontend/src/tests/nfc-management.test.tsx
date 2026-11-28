import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CardsPage } from '../pages/CardsPage';
import { NfcResolvePage } from '../pages/NfcResolvePage';
import { validateUsernameFormat, isReservedUsername } from '../config/reservedUsernames';
import { buildCardUrl } from '../lib/card-url';

describe('Customer NFC Card Management & Username-Based Public URLs', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('CardsPage renders empty state when customer has no NFC cards', () => {
    qc.setQueryData(['cards', 'purchased'], []);
    qc.setQueryData(['cards', 'my'], []);
    qc.setQueryData(['profiles', 'my'], []);

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard/my-nfc-cards']}>
          <CardsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('No NFC cards yet');
    expect(html).toContain('Explore our NFC cards and create your own personalized physical card.');
    expect(html).toContain('Explore NFC Cards');
  });

  it('CardsPage renders profile-based NFC URLs (https://taptch.com/{username}) and legacy migration notice', () => {
    qc.setQueryData(['cards', 'purchased'], [
      {
        id: 'pc_1',
        orderId: 'ord_1',
        unitIndex: 1,
        productName: 'PVC NFC Card — Black',
        redirectToken: 'abc123def456',
        destinationType: 'profile',
        profileId: 'prof_1',
        profile: {
          id: 'prof_1',
          displayName: 'John Doe',
          slug: 'john',
          profileType: 'personal',
        },
        order: { orderNumber: 'TAP-2026-1001' },
        updatedAt: '2026-11-26T00:00:00.000Z',
      },
      {
        id: 'pc_2',
        orderId: 'ord_1',
        unitIndex: 2,
        productName: 'Metal NFC Card — Black',
        redirectToken: 'xyz789uvw012',
        destinationType: 'custom_url',
        customDestinationUrl: 'https://alexcompany.com/',
        profileId: null,
        profile: null,
        order: { orderNumber: 'TAP-2026-1001' },
        updatedAt: '2026-11-26T00:00:00.000Z',
      },
    ]);
    qc.setQueryData(['cards', 'my'], []);
    qc.setQueryData(['profiles', 'my'], []);

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard/my-nfc-cards']}>
          <CardsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const plainHtml = html.replace(/<!-- -->/g, '');
    expect(plainHtml).toContain('Total Purchased');
    expect(plainHtml).toContain('PVC NFC Card — Black');
    expect(plainHtml).toContain('Metal NFC Card — Black');
    expect(plainHtml).toContain(buildCardUrl('abc123def456'));
    expect(plainHtml).toContain('@john');
    expect(plainHtml).toContain('Needs profile assignment (legacy card)');
    expect(plainHtml).not.toContain('Custom URL');
  });

  it('validates usernames and blocks reserved system routes', () => {
    expect(validateUsernameFormat('john')).toBeNull();
    expect(validateUsernameFormat('acmecompany')).toBeNull();
    expect(validateUsernameFormat('john-doe-99')).toBeNull();

    expect(validateUsernameFormat('ab')).not.toBeNull();
    expect(validateUsernameFormat('-john')).not.toBeNull();
    expect(validateUsernameFormat('john-')).not.toBeNull();
    expect(validateUsernameFormat('john doe')).not.toBeNull();
    expect(validateUsernameFormat('john_doe')).not.toBeNull();

    expect(isReservedUsername('admin')).toBe(true);
    expect(isReservedUsername('checkout')).toBe(true);
    expect(isReservedUsername('orders')).toBe(true);
    expect(isReservedUsername('products')).toBe(true);
    expect(isReservedUsername('dashboard')).toBe(true);
    expect(isReservedUsername('nfc')).toBe(true);
    expect(isReservedUsername('p')).toBe(true);
    expect(isReservedUsername('b')).toBe(true);
  });

  it('NfcResolvePage renders unconfigured fallback message safely on legacy /b/:uniqueKey route', () => {
    const html = renderToString(
      <MemoryRouter initialEntries={['/b/abc123?status=unconfigured']}>
        <Routes>
          <Route path="/b/:uniqueKey" element={<NfcResolvePage expectedProfileType="business" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(html).toContain("This NFC card hasn&#x27;t been configured yet.");
  });

  it('NfcResolvePage distinguishes not_found from network_error cleanly', () => {
    const notFoundHtml = renderToString(
      <MemoryRouter initialEntries={['/p/missing-card?status=not_found']}>
        <Routes>
          <Route path="/p/:uniqueKey" element={<NfcResolvePage expectedProfileType="personal" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(notFoundHtml).toContain('NFC card not recognized.');
    expect(notFoundHtml).toContain('Configure My Card');

    const netErrHtml = renderToString(
      <MemoryRouter initialEntries={['/p/slow-card?status=network_error']}>
        <Routes>
          <Route path="/p/:uniqueKey" element={<NfcResolvePage expectedProfileType="personal" />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(netErrHtml).toContain('Unable to connect right now.');
    expect(netErrHtml).toContain('Retry');
  });
});
