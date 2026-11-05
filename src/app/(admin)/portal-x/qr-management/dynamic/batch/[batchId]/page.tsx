'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  FileDown,
  Printer,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
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

  // Template Range Modal
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);
  const [templateUrl, setTemplateUrl] = React.useState('');
  const [paramName, setParamName] = React.useState('table');
  const [valuePrefix, setValuePrefix] = React.useState('T');
  const [sep, setSep] = React.useState('-');
  const [startSeq, setStartSeq] = React.useState(1);
  const [endSeq, setEndSeq] = React.useState(50);
  const [applying, setApplying] = React.useState(false);
  const [modalMsg, setModalMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBatchItems = React.useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/v1/qr/batches/${batchId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          if (Array.isArray(res.data)) {
            setItems(res.data);
          } else {
            if (res.data.items) setItems(res.data.items);
            if (res.data.batch) setBatch(res.data.batch);
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

  const handleApplyTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateUrl.trim()) return;

    setApplying(true);
    setModalMsg(null);

    try {
      const res = await fetch(`/api/v1/qr/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateUrl: templateUrl.trim(),
          paramName: paramName.trim() || undefined,
          valuePrefix: valuePrefix.trim() || undefined,
          sep: sep.trim() || undefined,
          startSeq: Number(startSeq),
          endSeq: Number(endSeq),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to apply template.');

      setModalMsg({ type: 'success', text: data.data?.message || 'Template applied successfully!' });
      fetchBatchItems();
      setTimeout(() => {
        setShowTemplateModal(false);
        setModalMsg(null);
      }, 1200);
    } catch (err) {
      setModalMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error applying template' });
    } finally {
      setApplying(false);
    }
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              setEndSeq(items.length || 50);
              setShowTemplateModal(true);
            }}
            className="text-xs font-bold gap-1.5 h-9"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Apply Template URL</span>
          </Button>

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
            placeholder="Search within batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#121216] border-neutral-800 text-xs h-9"
          />
        </div>
        <div className="text-xs text-neutral-400">
          Showing <span className="text-white font-medium">{filteredItems.length}</span> of {items.length} codes
        </div>
      </div>

      {/* Items Table */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#121216]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-neutral-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading batch records...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No QR records found in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-900/60 text-neutral-400 font-mono text-[11px] uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3">Seq #</th>
                  <th className="px-5 py-3">Tracking Serial</th>
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Destination URL</th>
                  <th className="px-5 py-3 text-right">Scans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-white">
                      #{item.batchSequence || 1}
                    </td>
                    <td className="px-5 py-3 font-mono text-neutral-400">
                      {item.serialNumber}
                    </td>
                    <td className="px-5 py-3 font-mono text-primary font-semibold">
                      {item.token}
                    </td>
                    <td className="px-5 py-3">
                      {item.status === 'assigned' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 max-w-sm truncate text-neutral-400">
                      {item.manualRedirectUrl ? (
                        <a
                          href={item.manualRedirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{item.manualRedirectUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="italic text-neutral-600">Pending on-field assignment</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-neutral-400">
                      {item.scanCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121216] border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-white">Apply Template to Batch</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}
              >
                {modalMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleApplyTemplate} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs text-neutral-300">Base Destination URL *</Label>
                <Input
                  required
                  type="url"
                  placeholder="https://menu.com/order"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-neutral-400">Param Name</Label>
                  <Input
                    placeholder="table"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                    className="bg-[#18181D] border-neutral-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-neutral-400">Prefix</Label>
                  <Input
                    placeholder="T"
                    value={valuePrefix}
                    onChange={(e) => setValuePrefix(e.target.value)}
                    className="bg-[#18181D] border-neutral-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-neutral-400">Sep</Label>
                  <Input
                    placeholder="-"
                    value={sep}
                    onChange={(e) => setSep(e.target.value)}
                    className="bg-[#18181D] border-neutral-800 text-xs text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] text-neutral-400">Start Sequence #</Label>
                  <Input
                    type="number"
                    min={1}
                    value={startSeq}
                    onChange={(e) => setStartSeq(Number(e.target.value))}
                    className="bg-[#18181D] border-neutral-800 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-neutral-400">End Sequence #</Label>
                  <Input
                    type="number"
                    min={1}
                    value={endSeq}
                    onChange={(e) => setEndSeq(Number(e.target.value))}
                    className="bg-[#18181D] border-neutral-800 text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#18181D] border border-neutral-800 text-[11px] text-neutral-400">
                <span className="text-neutral-500">Preview:</span>{' '}
                <span className="font-mono text-primary">
                  {templateUrl ? `${templateUrl}?${paramName || 'id'}=${valuePrefix || ''}${sep || '-'}${startSeq}` : 'https://...'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={applying}
                  className="text-xs font-bold gap-1.5"
                >
                  {applying && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Apply to Batch Range</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
