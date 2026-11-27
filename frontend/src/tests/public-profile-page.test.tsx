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
      customFields: {
        education: 'B.Tech Computer Science',
        upiId: 'sinan@okaxis',
      },
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
    expect(html).toContain('cinematic-noir-root');
    expect(html).toContain('B.Tech Computer Science');
    expect(html).not.toContain('Profile not found');
  });

  it('renders complete saved user data (bio, ventures, locations, websites, education, socials, UPI) in Cinematic template', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['public-profile', 'rohan-kapoor'], {
      id: 'prof-rohan-1',
      slug: 'rohan-kapoor',
      displayName: 'Rohan Kapoor',
      headline: 'Industrial Architect',
      bio: 'Designing sustainable urban spaces.',
      location: 'Kochi, Kerala',
      avatarUrl: 'https://cdn.example.com/rohan.jpg',
      profileType: 'personal',
      status: 'PUBLISHED',
      templateId: 'cinematic-noir',
      customFields: {
        education: 'M.Arch, SPA Delhi',
        upiId: 'rohan@okhdfcbank',
        upiPayeeName: 'Rohan Kapoor',
      },
      businesses: [
        {
          id: 'biz-1',
          companyName: 'Kapoor Atelier',
          jobTitle: 'Principal',
          description: 'Urban architecture studio',
          businessWebsite: 'https://kapooratelier.example',
          businessAddress: 'Kochi',
        },
        {
          id: 'biz-2',
          companyName: 'TimberCraft',
          jobTitle: 'Co-Founder',
          description: 'Modular timber systems',
          businessWebsite: 'https://timbercraft.example',
          businessAddress: 'Bengaluru',
        },
      ],
      socialLinks: [{ platform: 'instagram', username: 'rohan.arch', url: 'https://instagram.com/rohan.arch' }],
      catalogue: [],
      sections: [],
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/rohan-kapoor']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('cinematic-noir-root');
    expect(html).toContain('Rohan Kapoor');
    expect(html).toContain('Industrial Architect');
    expect(html).toContain('Designing sustainable urban spaces.');
    expect(html).toContain('Kapoor Atelier');
    expect(html).toContain('TimberCraft');
    expect(html).toContain('Kochi');
    expect(html).toContain('Bengaluru');
    expect(html).toContain('https://kapooratelier.example/');
    expect(html).toContain('https://timbercraft.example/');
    expect(html).toContain('M.Arch, SPA Delhi');
    expect(html).toContain('@rohan.arch');
    expect(html).toContain('Pay via UPI');
  });

  it('resolves relative /api/v1/uploads/file/... avatarUrl to an absolute URL using API base URL', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['public-profile', 'sdf'], {
      id: '50ee4289-0653-4a7c-b1db-05405d3fbe9e',
      slug: 'sdf',
      displayName: 'dafs',
      headline: 'sdfsd',
      bio: 'test-123',
      address: 'sddfsdf',
      avatarUrl: '/api/v1/uploads/file/db4f8043-3616-4e8f-947d-17fc75cdf9e7.webp',
      profileType: 'personal',
      status: 'PUBLISHED',
      templateId: 'cinematic-noir',
      businesses: [],
      socialLinks: [],
      catalogue: [],
      sections: [],
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/sdf']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('test-123');
    expect(html).toContain('http://localhost:4000/api/v1/uploads/file/db4f8043-3616-4e8f-947d-17fc75cdf9e7.webp');
  });

  it('renders each user own chosen template independently without defaulting business profiles to cinematic-noir', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(['public-profile', 'user-cinematic'], {
      id: 'p-a',
      slug: 'user-cinematic',
      displayName: 'Alice Personal',
      profileType: 'personal',
      status: 'PUBLISHED',
      templateId: 'cinematic-noir',
      businesses: [],
      socialLinks: [],
      catalogue: [],
      sections: [],
    });
    qc.setQueryData(['public-profile', 'user-corporate'], {
      id: 'p-b',
      slug: 'user-corporate',
      displayName: 'Acme Corp',
      profileType: 'business',
      status: 'PUBLISHED',
      templateId: 'corporate-business',
      businesses: [],
      socialLinks: [],
      catalogue: [],
      sections: [],
    });
    qc.setQueryData(['public-profile', 'shareef'], {
      id: 'p-shareef',
      slug: 'shareef',
      displayName: 'Shareef Business',
      profileType: 'business',
      status: 'PUBLISHED',
      templateId: 'soft-modern',
      businesses: [],
      socialLinks: [],
      catalogue: [],
      sections: [],
    });

    const htmlA = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/user-cinematic']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const htmlB = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/user-corporate']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const htmlShareef = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/shareef']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(htmlA).toContain('cinematic-noir-root');
    expect(htmlB).not.toContain('cinematic-noir-root');
    expect(htmlB).toContain('Acme Corp');
    expect(htmlShareef).not.toContain('cinematic-noir-root');
    expect(htmlShareef).toContain('unknown-template-error');
  });

  it('passes absolute Cloudinary https avatarUrl through unchanged on published public profile page', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const cloudinaryUrl =
      'https://res.cloudinary.com/demo-cloud/image/upload/v173000/taptch/user1/avatars/avatar.webp';

    qc.setQueryData(['public-profile', 'cloud-user'], {
      id: 'p-cloud-1',
      slug: 'cloud-user',
      displayName: 'Cloud User',
      avatarUrl: cloudinaryUrl,
      profileType: 'personal',
      status: 'PUBLISHED',
      templateId: 'dark-premium',
      businesses: [],
      socialLinks: [],
      catalogue: [],
      sections: [],
    });

    const html = renderToString(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/cloud-user']}>
          <Routes>
            <Route path="/:slug" element={<PublicProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(html).toContain('tpl-dark-premium');
    expect(html).toContain(cloudinaryUrl);
  });
});
