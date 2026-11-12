import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../services/api';

describe('ApiClient URL Resolution & Error Handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('correctly dispatches GET request and deduplicates endpoint slashes', async () => {
    let capturedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true, data: { status: 'healthy' } })),
      });
    });

    const res = await ApiClient.get<{ status: string }>('/api/v1/profiles');
    expect(res).toEqual({ status: 'healthy' });
    expect(capturedUrl).not.toContain('/api/api');
    expect(capturedUrl).toMatch(/\/api\/v1\/profiles$/);
  });

  it('correctly handles 204 No Content response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      text: () => Promise.resolve(''),
    });

    const res = await ApiClient.post('/api/auth/sign-out');
    expect(res).toEqual({});
  });

  it('properly extracts backend error message when request fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 400,
      ok: false,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
          }),
        ),
    });

    await expect(
      ApiClient.post('/api/auth/sign-in/email', { email: 'wrong@test.com', password: 'bad' }),
    ).rejects.toThrow('Email or password is incorrect.');
  });
});

