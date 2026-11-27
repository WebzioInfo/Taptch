import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { ApiClient } from '../../services/api';

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    systemRole: string;
    accountType?: 'personal' | 'business' | null;
  } | null;
  session: {
    token: string;
    expiresAt: string;
  } | null;
}

export type AuthState = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export function getAuthState(session: UserSession | undefined, isPending: boolean): AuthState {
  if (isPending) return 'INITIALIZING';
  return session?.user ? 'AUTHENTICATED' : 'UNAUTHENTICATED';
}

const LOGOUT_EVENT_KEY = 'taptch_auth_logout_event';
const inflightExchangePromises = new Map<string, Promise<UserSession | null>>();

function exchangeAuthCodeOnce(authCode: string): Promise<UserSession | null> {
  const existing = inflightExchangePromises.get(authCode);
  if (existing) return existing;

  const promise = ApiClient.post<UserSession>('/api/auth/oauth/exchange-code', {
    code: authCode,
  })
    .then((res) => {
      if (res?.session?.token && typeof window !== 'undefined') {
        localStorage.setItem('taptch_session_token', res.session.token);
      }
      return res || null;
    })
    .catch(() => null)
    .finally(() => {
      setTimeout(() => inflightExchangePromises.delete(authCode), 5000);
    });

  inflightExchangePromises.set(authCode, promise);
  return promise;
}

function clearUserStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('taptch_session_token');
    localStorage.removeItem('taptch_checkout_design_draft');
    localStorage.removeItem('taptch_studio_recovery');
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith('taptch_recovery_')) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }
}

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('auth_code');
        const legacyToken = urlParams.get('session_token');

        if (authCode) {
          const res = await exchangeAuthCodeOnce(authCode);
          // Clean auth_code from visible URL after exchange attempt
          urlParams.delete('auth_code');
          const cleanQuery = urlParams.toString();
          const cleanUrl =
            window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);

          if (res?.user) {
            return res;
          }
          // Do not fall through with stale/empty cookie if exchange explicitly failed
          return { user: null, session: null };
        } else if (legacyToken) {
          localStorage.setItem('taptch_session_token', legacyToken);
          urlParams.delete('session_token');
          const cleanQuery = urlParams.toString();
          const cleanUrl =
            window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
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
    staleTime: 60 * 1000,
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
  email: async (data: {
    name: string;
    email: string;
    password: string;
    accountType?: 'personal' | 'business';
  }) => {
    const res = await ApiClient.post<UserSession>('/api/auth/sign-up/email', data);
    if (res?.session?.token && typeof window !== 'undefined') {
      localStorage.setItem('taptch_session_token', res.session.token);
    }
    return res;
  },
};

export const signOut = async () => {
  try {
    await ApiClient.post('/api/auth/sign-out');
  } catch {
    // Proceed with local cleanup even if network fails
  }
  clearUserStorage();
};

export async function performCompleteLogout(
  queryClient?: QueryClient,
  navigate?: NavigateFunction,
  redirectTo = '/',
) {
  await signOut();

  if (queryClient) {
    await queryClient.cancelQueries();
    queryClient.clear();
    queryClient.setQueryData(['auth', 'session'], { user: null, session: null });
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOGOUT_EVENT_KEY, String(Date.now()));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('taptch_auth');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
      }
    } catch {
      // Ignore
    }
  }

  if (navigate) {
    navigate(redirectTo, { replace: true });
  }
}

/**
 * Synchronizes auth state across:
 * - Multiple browser tabs (storage event & BroadcastChannel)
 * - Browser BFCache restoration (pageshow event)
 * - 401 Unauthorized API responses (taptch:unauthorized event)
 */
export function useAuthSync(onForceLogout?: () => void) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRemoteLogout = () => {
      clearUserStorage();
      queryClient.cancelQueries();
      queryClient.clear();
      queryClient.setQueryData(['auth', 'session'], { user: null, session: null });
      onForceLogout?.();
      navigate('/login', { replace: true });
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_EVENT_KEY) {
        handleRemoteLogout();
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
      }
    };

    const onUnauthorized = () => {
      handleRemoteLogout();
    };

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('taptch_auth');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'LOGOUT') {
          handleRemoteLogout();
        }
      };
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('taptch:unauthorized', onUnauthorized);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('taptch:unauthorized', onUnauthorized);
      bc?.close();
    };
  }, [queryClient, navigate, onForceLogout]);
}
