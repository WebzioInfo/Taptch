import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, Shield, Users } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  systemRole: string;
  status: string;
  permissions: string[];
  createdAt: string;
}

const ASSIGNABLE_ROLES = ['super_admin', 'admin', 'support_admin', 'staff', 'user'] as const;

export function AdminAdminsPage() {
  const queryClient = useQueryClient();
  const { role: myRole, can } = useAdminPermissions();
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: admins, isLoading, error } = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => ApiClient.get<AdminAccount[]>('/api/v1/admin/admins'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      ApiClient.patch(`/api/v1/admin/admins/${userId}/role`, { role }),
    onSuccess: () => {
      setFeedback('Role updated and recorded in activity logs.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'activity-logs'] });
    },
    onError: (err: any) => {
      setFeedback(err?.message || 'Failed to update role.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-[#666666] gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
        <span>Loading administrator accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC4545] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Unable to load administrator accounts.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="px-3 py-2 rounded-lg bg-[#FFF3E9] border border-[#FF6A00]/30 text-xs text-[#171717]">
          {feedback}
        </div>
      )}

      <div className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E8E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-xs font-semibold text-[#171717]">
              Administrator &amp; Staff Accounts ({admins?.length ?? 0})
            </h2>
          </div>
        </div>

        {!admins || admins.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666]">No administrator accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Permissions</th>
                  {can('staff.manage') && <th className="px-4 py-2.5 font-medium">Change Role</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-[#F8F9FB]/60">
                    <td className="px-4 py-2.5 font-medium text-[#171717]">{admin.name}</td>
                    <td className="px-4 py-2.5 text-[#666666]">{admin.email}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF3E9] text-[#FF6A00]">
                        <Shield className="w-3 h-3" />
                        {admin.systemRole}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#666666]">{admin.status}</td>
                    <td className="px-4 py-2.5 text-[#666666]">{admin.permissions.length} granted</td>
                    {can('staff.manage') && (
                      <td className="px-4 py-2.5">
                        <select
                          aria-label={`Role for ${admin.email}`}
                          value={admin.systemRole}
                          disabled={
                            roleMutation.isPending ||
                            (admin.systemRole === 'super_admin' && myRole !== 'super_admin')
                          }
                          onChange={(e) =>
                            roleMutation.mutate({ userId: admin.id, role: e.target.value })
                          }
                          className="h-8 px-2 rounded-md border border-[#E8E8E8] bg-white text-xs text-[#171717]"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option
                              key={r}
                              value={r}
                              disabled={r === 'super_admin' && myRole !== 'super_admin'}
                            >
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
