// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminProfilesPage } from '../pages/admin/AdminProfilesPage';
import { ApiClient } from '../services/api';

vi.mock('../lib/auth/client', () => ({
  useSession: () => ({
    data: { user: { id: 'sa1', systemRole: 'super_admin' } },
    isPending: false,
  }),
}));

vi.mock('../hooks/useAdminPermissions', () => ({
  useAdminPermissions: () => ({
    role: 'super_admin',
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

describe('Phase 2 Admin Pages (Dashboard, Users, Profiles)', () => {
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

  it('renders AdminDashboardPage metrics, empty state, and error state', async () => {
    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
      users: 12,
      activeUsers: 10,
      orders: 5,
      pendingOrders: 2,
      cards: 8,
      activeCards: 6,
      revenue: 14990,
      openTickets: 1,
      recentOrders: [],
      recentUsers: [],
      timestamp: new Date().toISOString(),
    });

    renderWithQuery(<AdminDashboardPage />);
    await flush();
    expect(container.textContent).toContain('Total Users');
    expect(container.textContent).toContain('12');
    expect(container.textContent).toContain('No registered users found.');
  });

  it('renders AdminDashboardPage error state', async () => {
    vi.spyOn(ApiClient, 'get').mockRejectedValueOnce(new Error('403 Forbidden'));
    renderWithQuery(<AdminDashboardPage />);
    await flush();
    expect(container.textContent).toContain('403 Forbidden');
  });

  it('supports AdminUsersPage confirmation modal and status mutation', async () => {
    const getSpy = vi.spyOn(ApiClient, 'get').mockResolvedValue({
      items: [
        {
          id: 'u_1',
          name: 'Alice',
          email: 'alice@example.com',
          phoneNumber: null,
          systemRole: 'user',
          status: 'active',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const patchSpy = vi.spyOn(ApiClient, 'patch').mockResolvedValue({ success: true });

    renderWithQuery(<AdminUsersPage />);
    await flush();
    expect(container.textContent).toContain('alice@example.com');

    const suspendBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Block'),
    );
    expect(suspendBtn).toBeTruthy();
    act(() => {
      suspendBtn!.click();
    });
    expect(container.textContent).toContain('Block User Account?');

    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Confirm',
    );
    act(() => {
      confirmBtn!.click();
    });
    await flush();

    expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/users/u_1/status', { status: 'suspended' });
    expect(getSpy).toHaveBeenCalled();
  });

  it('supports AdminProfilesPage publish/unpublish confirmation', async () => {
    vi.spyOn(ApiClient, 'get').mockResolvedValueOnce({
      items: [
        {
          id: 'p_1',
          slug: 'alice-one',
          displayName: 'Alice Studio',
          profileType: 'personal',
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          ownerName: 'Alice',
          ownerEmail: 'alice@example.com',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const patchSpy = vi.spyOn(ApiClient, 'patch').mockResolvedValue({ success: true });

    renderWithQuery(<AdminProfilesPage />);
    await flush();
    expect(container.textContent).toContain('Alice Studio');

    const row = container.querySelector('tbody tr') as HTMLElement | null;
    expect(row).toBeTruthy();
    act(() => {
      row!.click();
    });
    await flush();

    const unpubBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Unpublish'),
    );
      expect(unpubBtn).toBeTruthy();
      act(() => {
        unpubBtn!.click();
      });
      await flush();

      expect(patchSpy).toHaveBeenCalledWith('/api/v1/admin/profiles/p_1/status', { status: 'DRAFT' });
    });
  });
