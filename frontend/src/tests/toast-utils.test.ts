import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildProfileSaveErrorNotification,
  getToastDurationMs,
  PROFILE_LIMIT_TOAST_MESSAGE,
} from '../lib/toast-utils';

describe('Builder Toast & Profile Limit UX', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows concise single-line message and Upgrade action on personal 403 profile limit error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const err = Object.assign(
      new Error('Personal accounts are limited to 1 digital profile. Upgrade to a Business Account to create multiple profiles.'),
      { statusCode: 403 },
    );

    const toast = buildProfileSaveErrorNotification(err, 'personal', true);

    expect(toast.type).toBe('limit_reached');
    expect(toast.message).toBe(PROFILE_LIMIT_TOAST_MESSAGE);
    expect(toast.message).toBe('Profile limit reached. Upgrade to Business for more profiles.');
    expect(toast.message).not.toContain('403');
    expect(toast.message).not.toContain('/api/');
    expect(toast.actionLabel).toBe('Upgrade');
    expect(toast.actionTo).toBe('/pricing');
    expect(consoleSpy).toHaveBeenCalledWith('[BuilderPage] Profile save/publish failed:', err);
  });

  it('handles 403 statusCode even if backend message varies', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = Object.assign(new Error('Forbidden'), { statusCode: 403 });

    const toast = buildProfileSaveErrorNotification(err, 'personal', true);

    expect(toast.type).toBe('limit_reached');
    expect(toast.message).toBe('Profile limit reached. Upgrade to Business for more profiles.');
    expect(toast.actionLabel).toBe('Upgrade');
    expect(toast.actionTo).toBe('/pricing');
  });

  it('returns standard error toast for non-limit errors', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = Object.assign(new Error('The username "alex" is already taken.'), { statusCode: 409 });

    const toast = buildProfileSaveErrorNotification(err, 'personal', true);

    expect(toast.type).toBe('error');
    expect(toast.message).toBe('The username "alex" is already taken.');
    expect(toast.actionLabel).toBeUndefined();
    expect(toast.actionTo).toBeUndefined();
  });

  it('enforces consistent auto-dismiss durations for success, info, error, and limit_reached toasts', () => {
    expect(getToastDurationMs('success')).toBe(3000);
    expect(getToastDurationMs('info')).toBe(4000);
    expect(getToastDurationMs('error')).toBeGreaterThanOrEqual(4000);
    expect(getToastDurationMs('error')).toBeLessThanOrEqual(5000);
    expect(getToastDurationMs('limit_reached')).toBeGreaterThanOrEqual(4000);
    expect(getToastDurationMs('limit_reached')).toBeLessThanOrEqual(5000);
  });
});
