'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  FileDown,
  Printer,
  Loader2,
  Search,
} from 'lucide-react';

interface QRItem {
  id: string;
  serialNumber: string;
  token: string;
  label: string | null;
  batchSequence: number | null;
  status: string;
  manualRedirectUrl: string | null;
  scanCount: number;
}

interface BatchInfo {
  id: string;
  batchCode: string;
  name: string;
  quantity: number;
  productType: string;
  templateUrl: string | null;
}

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params?.batchId as string;

  const [batch, setBatch] = React.useState<BatchInfo | null>(null);
  const [items, setItems] = React.useState<QRItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [exportingLayout, setExportingLayout] = React.useState<string | null>(null);

  const fetchBatchItems = React.useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/v1/qr?batchId=${batchId}&limit=200`)
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          setItems(res.data);
          if (res.data[0]) {
            setBatch({
              id: batchId,
              batchCode: res.data[0].serialNumber?.split('-').slice(0, -1).join('-') || 'BATCH',
              name: res.data[0].batchLabel || 'Batch Items',
              quantity: res.data.length,
              productType: 'sticker',
              templateUrl: null,
            });
          }
        }
      })
      .finally(() => setLoading(false));
  }, [batchId]);

  React.useEffect(() => {
    fetchBatchItems();
  }, [fetchBatchItems]);

  const handleDownloadPdf = (layout: 'branded_sheet' | 'thermal_sticker' | 'table_tent') => {
    setExportingLayout(layout);
    const downloadUrl = `/api/v1/qr/batches/${batchId}/export?layout=${layout}`;
    window.open(downloadUrl, '_blank');
    setTimeout(() => setExportingLayout(null), 1500);
  };

  const filteredItems = items.filter((it) => {
    const q = search.toLowerCase();
    return (
      it.token.toLowerCase().includes(q) ||
      it.serialNumber.toLowerCase().includes(q) ||
      it.label?.toLowerCase().includes(q) ||
      it.manualRedirectUrl?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/portal-x/qr-management" className="p-2 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-primary font-semibold tracking-wider">
                {batch?.batchCode || 'BATCH'}
              </span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">{items.length} Total QR Records</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {batch?.name || 'Production Batch Detail'}
            </h1>
          </div>
        </div>

        {/* PDF Exporters */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadPdf('branded_sheet')}
            disabled={exportingLayout !== null}
            className="text-xs gap-1.5 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 h-9"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>A4 Grid Sheet</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadPdf('thermal_sticker')}
            disabled={exportingLayout !== null}
            className="text-xs gap-1.5 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 h-9"
          >
            <FileDown className="h-3.5 w-3.5 text-emerald-400" />
            <span>Thermal Stickers</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadPdf('table_tent')}
            disabled={exportingLayout !== null}
            className="text-xs gap-1.5 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 h-9"
          >
            <FileDown className="h-3.5 w-3.5 text-amber-400" />
            <span>Table Standees</span>
          </Button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search items by sequence, serial, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#121216] border-neutral-800 text-white placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-[#121216] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/60 text-neutral-400 border-b border-neutral-800 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Seq</th>
                <th className="py-3 px-4">Serial</th>
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Destination Target</th>
                <th className="py-3 px-4 text-right">Scans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500 font-sans">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                    <span>Loading batch items...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-sans">
                    No items found matching search query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-bold">#{item.batchSequence || 1}</td>
                    <td className="py-3 px-4 text-neutral-300 font-semibold">{item.serialNumber}</td>
                    <td className="py-3 px-4 text-primary font-bold">{item.token}</td>
                    <td className="py-3 px-4 font-sans text-white">{item.label || '—'}</td>
                    <td className="py-3 px-4 font-sans">
                      {item.status === 'assigned' ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Assigned
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 truncate max-w-xs">
                      {item.manualRedirectUrl ? (
                        <span className="text-neutral-300 truncate">{item.manualRedirectUrl}</span>
                      ) : (
                        <span className="text-neutral-600 font-sans italic">None (Awaiting Field Activation)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-400 font-bold">{item.scanCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
