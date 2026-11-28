import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export function AdminAlertsPage() {
  const queryClient = useQueryClient();
  const { can } = useAdminPermissions();
  const canManage = can('notifications.manage');

  const { data, isLoading, isError, error } = useQuery<{ items: any[]; summary: any }>({
    queryKey: ['admin-alerts'],
    queryFn: () => ApiClient.get('/api/v1/admin/alerts'),
  });

  const alertMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'read' | 'resolve' | 'dismiss' }) =>
      ApiClient.patch(`/api/v1/admin/alerts/${id}`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
    },
  });

  return (
    <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E8E8E8] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#171717]">
          <Bell className="w-4 h-4 text-[#FF6A00]" />
          <span>Smart Admin Alerts & Notifications</span>
        </div>
        {data?.summary && (
          <div className="text-xs text-[#666666]">
            Critical: {data.summary.critical} · Warning: {data.summary.warning} · Unread: {data.summary.unread}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-xs text-[#666666]">Evaluating alerts...</div>
      ) : isError ? (
        <div className="p-6 text-center text-xs text-red-600">{(error as Error)?.message || 'Failed to load alerts.'}</div>
      ) : !data?.items?.length ? (
        <div className="p-6 text-center text-xs text-[#666666]">No active alerts.</div>
      ) : (
        <ul className="divide-y divide-[#E8E8E8] text-xs">
          {data.items.map((a) => (
            <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-[#171717]">
                  [{a.severity}] {a.title}
                </div>
                <div className="text-[#666666]">{a.message}</div>
              </div>
              {canManage && a.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => alertMutation.mutate({ id: a.id, action: 'resolve' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-200 text-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolve
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
