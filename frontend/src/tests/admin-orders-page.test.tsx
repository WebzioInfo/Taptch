// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { ApiClient } from '../services/api';

vi.mock('../hooks/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    role: 'admin',
    can: () => true,
    isLoading: false,
  }),
}));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  act(() => {
    root.render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
      </MemoryRouter>,
    );
  });
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
}

describe('Phase 3A AdminOrdersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders order list and supports fulfillment modal mutation', async () => {
    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
      items: [
        {
          id: 'ord_1',
          orderNumber: 'ORD-1001',
          material: 'metal',
          quantity: 1,
          totalAmount: 2949,
          currency: 'INR',
          orderStatus: 'ORDER_CONFIRMED',
          paymentStatus: 'PAID',
          courierName: null,
          trackingNumber: null,
          createdAt: new Date().toISOString(),
          user: { id: 'u_1', name: 'Alice', email: 'alice@example.com' },
          items: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const patchSpy = vi.spyOn(ApiClient, 'patch').mockResolvedValue({ success: true });

    renderWithQuery(<AdminOrdersPage />);
    await flush();
    expect(container.textContent).toContain('ORD-1001');

    const fulfillBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Update'),
    );
    act(() => {
      fulfillBtn!.click();
    });
    expect(container.textContent).toContain('Update Order #ORD-1001');

    const saveBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Save Status'),
    );
    act(() => {
      saveBtn!.click();
    });
    await flush();

    expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/orders/ord_1/fulfillment', {
      orderStatus: 'CARD_PRODUCTION',
      courierName: undefined,
      trackingNumber: undefined,
    });
  });

  it('renders error state when API fails', async () => {
    vi.spyOn(ApiClient, 'get').mockRejectedValueOnce(new Error('403 Forbidden'));
    renderWithQuery(<AdminOrdersPage />);
    await flush();
    expect(container.textContent).toContain('403 Forbidden');
  });
});
