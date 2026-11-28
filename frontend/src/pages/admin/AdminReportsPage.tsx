import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Download } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';

export function AdminReportsPage() {
  const { can } = useAdminPermissions();
  const canExport = can('reports.export');
  const [reportType, setReportType] = useState('orders');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, isError, error } = useQuery<{ type: string; rows: any[]; summary: any }>({
    queryKey: ['admin-report', reportType, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      return ApiClient.get(`/api/v1/admin/reports/${reportType}?${params.toString()}`);
    },
  });

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams({ format });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    const res = await ApiClient.get<{ filename: string; content: string }>(
      `/api/v1/admin/reports/${reportType}/export?${params.toString()}`,
    );
    const blob = new Blob([res.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white border border-[#E8E8E8] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#FF6A00]" />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-[#E8E8E8] rounded-md bg-white"
          >
            <option value="orders">Orders Report</option>
            <option value="sales">Sales Report</option>
            <option value="customers">Customers Report</option>
            <option value="products">Products Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="nfc_cards">NFC Lifecycle Report</option>
            <option value="staff">Staff Performance Report</option>
            <option value="payments">Payments & Refunds Report</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 text-xs border border-[#E8E8E8] rounded-md" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 text-xs border border-[#E8E8E8] rounded-md" />
        </div>
        {canExport && (
          <div className="flex gap-2">
            <button type="button" onClick={() => handleExport('csv')} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border border-[#E8E8E8]">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button type="button" onClick={() => handleExport('xlsx')} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border border-[#E8E8E8]">
              <Download className="w-3.5 h-3.5" /> XLSX
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white border border-[#E8E8E8] p-4 text-xs">
        {isLoading ? (
          <div className="text-[#666666]">Generating report...</div>
        ) : isError ? (
          <div className="text-red-600">{(error as Error)?.message || 'Failed to load report.'}</div>
        ) : !data?.rows?.length ? (
          <div className="text-[#666666]">No records match the selected report filters.</div>
        ) : (
          <div className="space-y-2">
            <div className="font-medium text-[#171717]">Records: {data.summary?.count ?? data.rows.length}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FB] border-b border-[#E8E8E8]">
                  <tr>
                    {Object.keys(data.rows[0]).map((k) => (
                      <th key={k} className="px-3 py-2 font-medium text-[#666666]">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E8]">
                  {data.rows.slice(0, 50).map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(data.rows[0]).map((k) => (
                        <td key={k} className="px-3 py-2 text-[#171717]">{String(row[k] ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
