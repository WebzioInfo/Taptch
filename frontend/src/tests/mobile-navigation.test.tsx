import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '../layouts/AppLayout';

vi.mock('../lib/auth/client', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        systemRole: 'customer',
      },
    },
    isPending: false,
  }),
  performCompleteLogout: vi.fn(),
}));

vi.mock('../components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/pwa/PwaInstallPrompt', () => ({
  PwaInstallPrompt: () => null,
}));

describe('AppLayout — QR Engine Removal & Mobile Navigation Structure', () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it('removes all QR Engine references from sidebar and mobile navigation', () => {
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<div>Dashboard Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).not.toContain('QR Engine');
    expect(html).not.toContain('href="/qr"');
  });

  it('renders 4-column single-line mobile bottom navbar with safe-area padding', () => {
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard/my-nfc-cards']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard/my-nfc-cards" element={<div>Cards Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('grid-cols-4');
    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('pb-[env(safe-area-inset-bottom)]');
    expect(html).toContain('Profiles');
    expect(html).toContain('Shop');
    expect(html).toContain('My Cards');
    expect(html).toContain('Orders');
  });
});
