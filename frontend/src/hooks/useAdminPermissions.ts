import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../services/api';

export interface AdminRbacResponse {
  role: string;
  permissions: string[];
}

export function useAdminPermissions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'rbac', 'me'],
    queryFn: () => ApiClient.get<AdminRbacResponse>('/api/v1/admin/rbac/me'),
    staleTime: 60_000,
  });

  const permissions = data?.permissions ?? [];
  const role = data?.role ?? '';

  const can = (permission: string): boolean => {
    if (role === 'super_admin') return true;
    return permissions.includes(permission);
  };

  return {
    role,
    permissions,
    can,
    isLoading,
    error,
  };
}
