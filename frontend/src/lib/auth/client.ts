import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../../services/api';

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    systemRole: string;
  } | null;
  session: {
    token: string;
    expiresAt: string;
  } | null;
}

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      // 1. Consume single-use auth code from OAuth redirect (Zero Token in URL)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('auth_code');
        const legacyToken = urlParams.get('session_token');

        if (authCode) {
          // Immediately sanitize URL to prevent code leakage in browser history or referrers
          urlParams.delete('auth_code');
          const cleanQuery = urlParams.toString();
          const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);

          try {
            const res = await ApiClient.post<UserSession>('/api/auth/oauth/exchange-code', { code: authCode });
            if (res?.session?.token) {
              localStorage.setItem('taptch_session_token', res.session.token);
            }
            return res || { user: null, session: null };
          } catch {
            // Fall back to standard session retrieval
          }
        } else if (legacyToken) {
          // Sanitize legacy session_token from URL
          localStorage.setItem('taptch_session_token', legacyToken);
          urlParams.delete('session_token');
          const cleanQuery = urlParams.toString();
          const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

      // 2. Standard session retrieval via HttpOnly cookie and/or Bearer token
      try {
        const res = await ApiClient.get<UserSession>('/api/auth/get-session');
        if (res?.session?.token && typeof window !== 'undefined') {
          localStorage.setItem('taptch_session_token', res.session.token);
        }
        return res || { user: null, session: null };
      } catch {
        return { user: null, session: null };
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export const signIn = {
  email: async (data: { email: string; password: string }) => {
    const res = await ApiClient.post<UserSession>('/api/auth/sign-in/email', data);
    if (res?.session?.token && typeof window !== 'undefined') {
      localStorage.setItem('taptch_session_token', res.session.token);
    }
    return res;
  },
};

export const signUp = {
  email: async (data: { name: string; email: string; password: string }) => {
    const res = await ApiClient.post<UserSession>('/api/auth/sign-up/email', data);
    if (res?.session?.token && typeof window !== 'undefined') {
      localStorage.setItem('taptch_session_token', res.session.token);
    }
    return res;
  },
};

export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('taptch_session_token');
  }
  return ApiClient.post('/api/auth/sign-out');
};

