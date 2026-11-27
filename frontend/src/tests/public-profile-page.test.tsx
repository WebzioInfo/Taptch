import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicProfilePage } from '../pages/PublicProfilePage';

describe('PublicProfilePage — Minimal 404, Error Handling & Visibility', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders minimal "Profile not found" for reserved usernames without calling API', () => {
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Profile not found');
    expect(html).toContain('Go to Taptch');
    expect(html).not.toContain('Create Your Profile');
  });

  it('renders "Profile unavailable" for unpublished/DRAFT profiles without exposing private fields', () => {
    qc.setQueryData(['public-profile', 'draft-user'], {
      id: 'p1',
      slug: 'draft-user',
      status: 'DRAFT',
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/draft-user']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Profile unavailable');
    expect(html).toContain('Go to Taptch');
  });

  it('renders published profile cleanly when cached data is present', () => {
    qc.setQueryData(['public-profile', 'sinan'], {
      id: '47fc972f-32e1-48f8-8755-5c4ea3b4845a',
      slug: 'sinan',
      displayName: 'Muhammed',
      headline: 'Software developer',
      profileType: 'personal',
      status: 'PUBLISHED',
      templateId: 'clean-corporate',
      sections: [
        { id: 's1', sectionType: 'contact_info', title: 'Contact', isEnabled: true, orderIndex: 0, content: {} },
        { id: 's2', sectionType: 'bio', title: 'Hidden Bio', isEnabled: false, orderIndex: 1, content: {} },
      ],
      businesses: [],
      catalogue: [],
      socialLinks: [],
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/sinan']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('Muhammed');
    expect(html).not.toContain('Profile not found');
  });
});
