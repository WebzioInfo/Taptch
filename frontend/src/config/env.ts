/// <reference types="vite/client" />

function resolveApiUrl(): string {
  const envApiUrl = import.meta.env.VITE_API_URL as string;
  if (envApiUrl && envApiUrl.trim() !== '') {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  // Automatic runtime detection for production domains
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'taptch.com' || host.endsWith('.taptch.com') || host.endsWith('webziotech.in')) {
      return 'https://api.taptch.com';
    }
  }

  return 'http://localhost:4000';
}

function resolveAppUrl(): string {
  const envAppUrl = import.meta.env.VITE_APP_URL as string;
  if (envAppUrl && envAppUrl.trim() !== '') {
    return envAppUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5173';
}

export const env = {
  appName: (import.meta.env.VITE_APP_NAME as string) || 'Taptch',
  appEnv:
    (import.meta.env.VITE_APP_ENV as string) ||
    (typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('taptch.com') || window.location.hostname.endsWith('webziotech.in'))
      ? 'production'
      : 'development'),
  apiUrl: resolveApiUrl(),
  appUrl: resolveAppUrl(),
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  isProduction:
    (import.meta.env.VITE_APP_ENV as string) === 'production' ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.endsWith('taptch.com') || window.location.hostname.endsWith('webziotech.in'))),
};
