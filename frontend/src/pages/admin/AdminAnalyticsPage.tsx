import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { ApiClient } from '../../services/api';

interface AnalyticsOverview {
  totalOrders: number;
  paidOrders: number;
  simulatedOrders: number;
  realRevenue: number;
  timestamp: string;
}

export function AdminAnalyticsPage() {
  const { data, isLoading, isError, error } = useQuery<AnalyticsOverview>({
    queryKey: ['admin-analytics'],
    queryFn: () => ApiClient.get('/api/v1/admin/analytics'),
  });

  if (isLoading) return <div className="p-6 text-xs text-[#666666]">Loading analytics...</div>;
  if (isError || !data) {
    return <div className="p-6 text-xs text-red-600">{(error as Error)?.message || 'Failed to load analytics.'}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#171717]">
        <BarChart3 className="w-4 h-4 text-[#FF6A00]" />
        <span>Sales & Analytics (Simulated Test Orders Excluded from Real Revenue)</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white border border-[#E8E8E8] p-4">
          <div className="text-xs text-[#666666]">Total Orders</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{data.totalOrders}</div>
        </div>
        <div className="rounded-lg bg-white border border-[#E8E8E8] p-4">
          <div className="text-xs text-[#666666]">Verified Paid Orders</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{data.paidOrders}</div>
        </div>
        <div className="rounded-lg bg-white border border-[#E8E8E8] p-4">
          <div className="text-xs text-[#666666]">Simulated Test Orders</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-amber-700">{data.simulatedOrders}</div>
        </div>
        <div className="rounded-lg bg-white border border-[#E8E8E8] p-4">
          <div className="text-xs text-[#666666]">Real Collected Revenue</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">INR {data.realRevenue}</div>
        </div>
      </div>
    </div>
  );
}
