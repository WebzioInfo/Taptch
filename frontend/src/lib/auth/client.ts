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
      try {
        const res = await ApiClient.get<UserSession>('/api/auth/get-session');
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
    return ApiClient.post<UserSession>('/api/auth/sign-in/email', data);
  },
};

export const signUp = {
  email: async (data: { name: string; email: string; password: string }) => {
    return ApiClient.post<UserSession>('/api/auth/sign-up/email', data);
  },
};

export const signOut = async () => {
  return ApiClient.post('/api/auth/sign-out');
};
