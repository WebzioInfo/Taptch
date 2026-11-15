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
      // Extract session token from OAuth redirect parameter if present
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('session_token');
        if (tokenFromUrl) {
          localStorage.setItem('taptch_session_token', tokenFromUrl);
          urlParams.delete('session_token');
          const cleanQuery = urlParams.toString();
          const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

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

