import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, History, Search } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { Input } from '../../components/ui/input';

interface ActivityLogItem {
  id: string;
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityLogResponse {
  items: ActivityLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function AdminActivityLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'activity-logs', search, page],
    queryFn: () =>
      ApiClient.get<ActivityLogResponse>(
        `/api/v1/admin/activity-logs?q=${encodeURIComponent(search)}&page=${page}&pageSize=25`,
      ),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E8E8E8] rounded-xl p-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-[#929292] shrink-0" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by action, resource type, resource ID, or actor email..."
          className="h-8 text-xs border-0 focus-visible:ring-0"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-xs text-[#666666] gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#FF6A00]" />
          <span>Loading activity logs...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC4545] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Unable to load activity logs.</span>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E8E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#FF6A00]" />
              <h2 className="text-xs font-semibold text-[#171717]">
                Immutable Activity Log ({data?.total ?? 0} entries)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-[#E8E8E8] disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-[#666666]">Page {page}</span>
              <button
                type="button"
                disabled={!data || page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border border-[#E8E8E8] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {!data?.items || data.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#666666]">No activity logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Timestamp</th>
                    <th className="px-4 py-2.5 font-medium">Actor</th>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    <th className="px-4 py-2.5 font-medium">Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {data.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8F9FB]/60">
                      <td className="px-4 py-2 text-[#666666] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-[#171717]">
                        {item.actorEmail || item.actorId}{' '}
                        <span className="text-[10px] text-[#929292]">({item.actorRole || 'user'})</span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-[#FF6A00]">{item.action}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-[#666666]">
                        {item.resourceType}
                        {item.resourceId ? `:${item.resourceId}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
