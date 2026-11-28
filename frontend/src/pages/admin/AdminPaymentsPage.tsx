import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { ApiClient } from '../../services/api';

interface PaymentRow {
  id: string;
  orderId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  gatewayPaymentId: string | null;
  isSimulated: boolean;
  createdAt: string;
}

export function AdminPaymentsPage() {
  const [status, setStatus] = useState('ALL');
  const { data, isLoading, isError, error } = useQuery<{ items: PaymentRow[]; total: number }>({
    queryKey: ['admin-payments', status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      return ApiClient.get(`/api/v1/admin/payments?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white border border-[#E8E8E8] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#171717]">
          <Receipt className="w-4 h-4 text-[#FF6A00]" />
          <span>Payments & Refunds Ledger</span>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-[#E8E8E8] rounded-md bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="COD_PENDING">COD_PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      <div className="rounded-lg bg-white border border-[#E8E8E8] overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-[#666666]">Loading payments...</div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-red-600">{(error as Error)?.message || 'Failed to load payments.'}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#666666]">No payment records found.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] text-[#666666] border-b border-[#E8E8E8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Reference</th>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8F9FB]">
                  <td className="px-4 py-2.5 font-mono text-[11px]">{p.gatewayPaymentId || p.id.slice(0, 12)}</td>
                  <td className="px-4 py-2.5 text-[#666666]">{p.paymentMethod}</td>
                  <td className="px-4 py-2.5 tabular-nums">{p.currency} {p.amount}</td>
                  <td className="px-4 py-2.5">{p.status}</td>
                  <td className="px-4 py-2.5">
                    {p.isSimulated ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        TEST / SIMULATED
                      </span>
                    ) : (
                      <span className="text-[#666666]">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
