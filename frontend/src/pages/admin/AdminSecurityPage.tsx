import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, LogOut } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export function AdminSecurityPage() {
  const queryClient = useQueryClient();
  const { can } = useAdminPermissions();
  const canManageSessions = can('security.sessions.manage');
  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null);

  const { data: loginData } = useQuery<{ items: any[] }>({
    queryKey: ['admin-login-history'],
    queryFn: () => ApiClient.get('/api/v1/admin/security/login-history'),
    enabled: can('security.login_history.view'),
  });

  const { data: sessionsData } = useQuery<{ items: any[] }>({
    queryKey: ['admin-sessions'],
    queryFn: () => ApiClient.get('/api/v1/admin/security/sessions'),
    enabled: can('security.sessions.view'),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => ApiClient.delete(`/api/v1/admin/security/sessions/${sessionId}`),
    onSuccess: () => {
      setConfirmSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E8E8] flex items-center gap-2 text-sm font-semibold text-[#171717]">
          <ShieldAlert className="w-4 h-4 text-[#FF6A00]" />
          <span>Active Admin Sessions</span>
        </div>
        {!sessionsData?.items?.length ? (
          <div className="p-6 text-center text-xs text-[#666666]">No active sessions found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
              <tr>
                <th className="px-4 py-2 font-medium">Session</th>
                <th className="px-4 py-2 font-medium">User ID</th>
                <th className="px-4 py-2 font-medium">IP</th>
                <th className="px-4 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {sessionsData.items.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-mono text-[11px]">{s.id.slice(0, 12)}</td>
                  <td className="px-4 py-2">{s.userId}</td>
                  <td className="px-4 py-2 text-[#666666]">{s.ipAddress || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    {canManageSessions && (
                      <button
                        type="button"
                        onClick={() => setConfirmSessionId(s.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 text-red-700"
                      >
                        <LogOut className="w-3 h-3" /> Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8E8E8] text-sm font-semibold text-[#171717]">
          Admin Login History
        </div>
        {!loginData?.items?.length ? (
          <div className="p-6 text-center text-xs text-[#666666]">No login history recorded.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Result</th>
                <th className="px-4 py-2 font-medium">IP</th>
                <th className="px-4 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {loginData.items.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2">{l.email}</td>
                  <td className="px-4 py-2">{l.success ? 'Success' : `Failed (${l.failureReason || 'error'})`}</td>
                  <td className="px-4 py-2 text-[#666666]">{l.ipAddress || '—'}</td>
                  <td className="px-4 py-2 text-[#666666]">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmSessionId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#E8E8E8] w-full max-w-md p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold">Confirm Force Logout</h3>
            <p className="text-[#666666]">Revoke session {confirmSessionId.slice(0, 12)} immediately?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmSessionId(null)} className="px-3 py-1.5 rounded border border-[#E8E8E8]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => revokeMutation.mutate(confirmSessionId)}
                className="px-3 py-1.5 rounded bg-red-600 text-white"
              >
                Revoke Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
