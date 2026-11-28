import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockUseSession = vi.fn();

vi.mock('../lib/auth/client', () => ({
  useSession: () => mockUseSession(),
  getAuthState: (session: any, isPending: boolean) => {
    if (isPending) return 'INITIALIZING';
    return session?.user ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
  },
  useAuthSync: () => {},
}));

import { ProtectedRoute } from '../components/auth/ProtectedRoute';

describe('ProtectedRoute role-based access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    const html = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin'] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(ProtectedRoute, { allowedRoles: ['super_admin', 'admin'] }) },
            React.createElement(Route, {
              path: '/admin',
              element: React.createElement('div', null, 'SECRET_ADMIN_PANEL'),
            }),
          ),
          React.createElement(Route, {
            path: '/login',
            element: React.createElement('div', null, 'LOGIN_PAGE'),
          }),
        ),
      ),
    );
    expect(html).not.toContain('SECRET_ADMIN_PANEL');
  });

  it('blocks standard user from /admin and allows super_admin', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'u1', systemRole: 'user' } },
      isPending: false,
    });
    const blockedHtml = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin'] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(ProtectedRoute, { allowedRoles: ['super_admin', 'admin'] }) },
            React.createElement(Route, {
              path: '/admin',
              element: React.createElement('div', null, 'SECRET_ADMIN_PANEL'),
            }),
          ),
          React.createElement(Route, {
            path: '/dashboard',
            element: React.createElement('div', null, 'USER_DASHBOARD'),
          }),
        ),
      ),
    );
    expect(blockedHtml).not.toContain('SECRET_ADMIN_PANEL');

    mockUseSession.mockReturnValue({
      data: { user: { id: 'a1', systemRole: 'super_admin' } },
      isPending: false,
    });
    const allowedHtml = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/admin'] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(ProtectedRoute, { allowedRoles: ['super_admin', 'admin'] }) },
            React.createElement(Route, {
              path: '/admin',
              element: React.createElement('div', null, 'SECRET_ADMIN_PANEL'),
            }),
          ),
        ),
      ),
    );
    expect(allowedHtml).toContain('SECRET_ADMIN_PANEL');
  });
});
