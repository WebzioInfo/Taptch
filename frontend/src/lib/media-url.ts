import { env } from '@/config/env';

/**
 * Resolves relative API media paths (e.g. /api/v1/uploads/file/...) to absolute URLs
 * using the configured API base URL, while preserving absolute http(s) and data URIs.
 */
export function resolveMediaUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/') && env.apiUrl) {
    return `${env.apiUrl}${trimmed}`;
  }
  return trimmed;
}
