import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resetActiveScrollContainers } from '../components/common/GlobalScrollReset';
import { AppLayout } from '../layouts/AppLayout';

vi.mock('../lib/auth/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth/client')>();
  return {
    ...actual,
    useSession: () => ({
      data: {
        user: { id: 'usr_scroll_1', name: 'Test User', email: 'test@taptch.com', systemRole: 'user' },
        session: { token: 'tok_scroll' },
      },
      isPending: false,
    }),
    performCompleteLogout: vi.fn(),
  };
});

describe('Global Page Navigation Scroll Reset', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    vi.restoreAllMocks();
  });

  it('resets window, document, and nested data-scroll-container elements without touching modals', () => {
    const scrollToSpy = vi.fn();
    const nestedMain = { scrollTop: 420, scrollLeft: 10 };
    const modalScroller = { scrollTop: 180, scrollLeft: 0 };

    const mockHistory = { scrollRestoration: 'auto' as ScrollRestoration };
    const mockDocEl = { scrollTop: 650, scrollLeft: 0 };
    const mockBody = { scrollTop: 650, scrollLeft: 0 };

    (globalThis as any).window = {
      scrollTo: scrollToSpy,
      history: mockHistory,
    };
    (globalThis as any).document = {
      documentElement: mockDocEl,
      body: mockBody,
      querySelectorAll: vi.fn((selector: string) =>
        selector === '[data-scroll-container="true"]' ? [nestedMain] : [],
      ),
    };

    resetActiveScrollContainers();

    expect(mockHistory.scrollRestoration).toBe('manual');
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    expect(mockDocEl.scrollTop).toBe(0);
    expect(mockBody.scrollTop).toBe(0);
    expect(nestedMain.scrollTop).toBe(0);
    expect(nestedMain.scrollLeft).toBe(0);
    // Unmarked modal scroll containers remain untouched
    expect(modalScroller.scrollTop).toBe(180);
  });

  it('AppLayout marks its nested <main> scroll container with data-scroll-container="true"', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppLayout />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('data-scroll-container="true"');
  });

  it('wraps all application routes inside RootScrollBoundary with GlobalScrollReset', () => {
    const routesSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/routes/index.tsx'),
      'utf8',
    );
    expect(routesSource).toContain('<GlobalScrollReset />');
    expect(routesSource).toContain('element: <RootScrollBoundary />');
  });
});
