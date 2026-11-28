import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUseSession = vi.fn();

vi.mock('../lib/auth/client', () => ({
  useSession: () => mockUseSession(),
  getAuthState: (session: any, isPending: boolean) => {
    if (isPending) return 'INITIALIZING';
    return session?.user ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  },
  useAuthSync: () => { },
  performCompleteLogout: vi.fn(),
}));

import { AppLayout } from '../layouts/AppLayout';

  describe('AppLayout pure admin console & user sidebar separation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

        function renderLayout(initialPath = '/dashboard') {
          const qc = new QueryClient();
          return renderToStaticMarkup(
            React.createElement(
              QueryClientProvider,
              { client: qc },
              React.createElement(
                MemoryRouter,
                { initialEntries: [initialPath] },
                React.createElement(
                  Routes,
                  null,
                  React.createElement(
                    Route,
                    { element: React.createElement(AppLayout) },
                    React.createElement(Route, {
                      path: '/dashboard',
                      element: React.createElement('div', null, 'DASHBOARD_CONTENT'),
                    }),
                    React.createElement(Route, {
                      path: '/admin/users',
                      element: React.createElement('div', null, 'ADMIN_USERS_CONTENT'),
                    }),
                  ),
                ),
      ),
      ),
    );
  }

  it('shows only user-side navigation for normal user role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'u1', name: 'Regular User', email: 'user@taptch.com', systemRole: 'user' } },
      isPending: false,
    });

  const html = renderLayout();
  expect(html).toContain('Profiles');
  expect(html).toContain('Purchase NFC Cards');
  expect(html).toContain('My NFC Cards');
  expect(html).toContain('Orders');
  expect(html).not.toContain('ADMIN CONSOLE');
  expect(html).not.toContain('href="/admin/users"');
});

  it('shows pure admin sidebar for support_admin without user-side items or Roles', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 's1', name: 'Support Admin', email: 'sup@taptch.com', systemRole: 'support_admin' } },
      isPending: false,
    });

  const html = renderLayout('/admin/users');
  expect(html).toContain('ADMIN CONSOLE');
  expect(html).toContain('Overview');
  expect(html).toContain('Profiles');
  expect(html).toContain('NFC Cards');
  expect(html).toContain('Orders');
  expect(html).toContain('Products');
  expect(html).toContain('Users');
  expect(html).toContain('Plans and Subscriptions');
  expect(html).toContain('Templates');
  expect(html).toContain('Support Tickets');
  expect(html).not.toContain('Purchase NFC Cards');
  expect(html).not.toContain('My NFC Cards');
  expect(html).not.toContain('href="/admin/roles"');
});

  it('shows Roles and Permissions for admin and super_admin', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'a1', name: 'Admin', email: 'admin@taptch.com', systemRole: 'admin' } },
      isPending: false,
    });

const html = renderLayout('/admin/users');
expect(html).toContain('href="/admin/roles"');
expect(html).not.toContain('Purchase NFC Cards');
expect(html).not.toContain('My NFC Cards');
  });
});
