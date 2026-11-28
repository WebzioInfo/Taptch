import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ShieldCheck, Check, RefreshCw } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { Button } from '../../components/ui/button';

interface RbacMatrixResponse {
  roles: string[];
  permissions: string[];
  matrix: Record<string, string[]>;
}

export function AdminRolesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'rbac', 'matrix'],
    queryFn: () => ApiClient.get<RbacMatrixResponse>('/api/v1/admin/rbac/matrix'),
  });

  return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <AdminPageHeader
          title="Roles and Permissions"
          subtitle="Inspect granular RBAC permissions enforced across platform admin roles"
          action={
            <Button variant="accent" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          }
        />

        {
          isLoading ? (
            <div className="flex items-center justify-center py-12 text-xs text-[var(--ink-muted)] gap-2 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
              <span>Loading roles &amp; permissions matrix...</span>
            </div>
          ) : error || !data ? (
            <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Unable to load RBAC matrix.</span>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[12px] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />
                <h2 className="text-xs font-semibold text-[var(--ink)]">
                  Granular Permission Matrix ({data.permissions.length} permissions)
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-raised)] text-[var(--ink-muted)] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Permission</th>
                      {data.roles.map((r) => (
                        <th key={r} className="px-4 py-2.5 font-semibold text-center">
                          {r}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.permissions.map((perm) => (
                      <tr key={perm} className="hover:bg-[var(--bg-raised)]/60">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--ink)]">{perm}</td>
                        {data.roles.map((r) => {
                          const granted = (data.matrix[r] || []).includes(perm);
                          return (
                            <td key={r} className="px-4 py-2.5 text-center">
                              {granted ? (
                                <Check className="w-4 h-4 text-[var(--success)] inline" />
                              ) : (
                                <span className="text-[var(--ink-subtle)]">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
      );
}
