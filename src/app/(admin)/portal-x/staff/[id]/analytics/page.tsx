'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  QrCode,
  TrendingUp,
  Building2,
  MapPin,
  ExternalLink,
  Edit3,
  AlertCircle,
  Loader2,
  Eye,
  Phone,
} from 'lucide-react';

interface AssignedQRItem {
  id: string;
  token: string;
  label: string | null;
  serialNumber: string | null;
  manualRedirectUrl: string | null;
  status: string | null;
  assignedAt: string | null;
  scanCount: number;
  customerName: string | null;
  customerPhone: string | null;
  customerBusiness: string | null;
  customerPlace: string | null;
}

interface AnalyticsData {
  totalConfigured: number;
  history: AssignedQRItem[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StaffAuditAnalyticsPage({ params }: PageProps) {
  const { id: staffId } = React.use(params);

  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  // Reassign / Edit Modal State
  const [selectedQR, setSelectedQR] = React.useState<AssignedQRItem | null>(null);
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [destUrl, setDestUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/analytics`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to load staff performance data.');
      }
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching analytics.');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleOpenEditModal = (qr: AssignedQRItem) => {
    setSelectedQR(qr);
    setClientName(qr.customerName || '');
    setClientPhone(qr.customerPhone || '');
    setBusinessName(qr.customerBusiness || '');
    setPlace(qr.customerPlace || '');
    setDestUrl(qr.manualRedirectUrl || '');
    setModalError(null);
  };

  const handleSaveReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQR) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/sales/assign-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: selectedQR.token,
          name: clientName.trim(),
          mobileNumber: clientPhone.trim() || undefined,
          business: businessName.trim() || undefined,
          place: place.trim() || undefined,
          destinationUrl: destUrl.trim(),
          isReassign: true, // Explicit flag required to update existing assignment
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update QR assignment.');
      }

      setSelectedQR(null);
      fetchAnalytics();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error updating assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const history = data?.history || [];
  const filteredHistory = history.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.token.toLowerCase().includes(term) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(term)) ||
      (item.customerName && item.customerName.toLowerCase().includes(term)) ||
      (item.customerBusiness && item.customerBusiness.toLowerCase().includes(term)) ||
      (item.customerPlace && item.customerPlace.toLowerCase().includes(term)) ||
      (item.manualRedirectUrl && item.manualRedirectUrl.toLowerCase().includes(term))
    );
  });

  const totalScans = history.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <Link
            href="/portal-x/staff"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Staff Management</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-primary font-semibold tracking-wider">
              Field Staff Audit
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Staff Performance & Activation Ledger</h1>
          <p className="text-xs text-neutral-400">
            Audit assigned QR codes, client pairings, scans generated, and manage destination URLs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="text-xs border-neutral-800 text-neutral-300 hover:text-white"
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total QRs Assigned</span>
            <QrCode className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{data?.totalConfigured ?? 0}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Physical codes activated in field</p>
        </div>

        <div className="p-5 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Scans Generated</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">{totalScans}</div>
          <p className="text-[11px] text-neutral-500 mt-1">Engagement from active deployments</p>
        </div>

        <div className="p-5 rounded-xl bg-[#121216] border border-neutral-800/80">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Scans / QR</span>
            <Eye className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {data && data.totalConfigured > 0 ? (totalScans / data.totalConfigured).toFixed(1) : '0.0'}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Average engagement density</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121216]/60 p-3 rounded-xl border border-neutral-800/60">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Search by client, business, serial, or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#18181D] border-neutral-800 text-xs h-9"
          />
        </div>
        <div className="text-xs text-neutral-400">
          Showing <span className="font-semibold text-white">{filteredHistory.length}</span> assignments
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#121216]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-neutral-500 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading activation ledger...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <QrCode className="h-10 w-10 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No QR activations found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              This staff member has not activated any QR codes yet, or no items match your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#18181D] text-neutral-400 font-mono text-[11px] uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3">QR Tracking</th>
                  <th className="px-5 py-3">Customer / Client</th>
                  <th className="px-5 py-3">Business & Location</th>
                  <th className="px-5 py-3">Destination URL</th>
                  <th className="px-5 py-3">Scans</th>
                  <th className="px-5 py-3">Assigned Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-semibold text-white">{item.token}</div>
                      {item.serialNumber && (
                        <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                          {item.serialNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-neutral-200">
                        {item.customerName || 'Anonymous Customer'}
                      </div>
                      {item.customerPhone && (
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-neutral-500" />
                          {item.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-neutral-200">
                        <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{item.customerBusiness || '—'}</span>
                      </div>
                      {item.customerPlace && (
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                          <MapPin className="h-3 w-3 text-neutral-500" />
                          <span>{item.customerPlace}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
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
                        <span className="text-neutral-500 italic">Default category routing</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-200">
                        {item.scanCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400 text-[11px]">
                      {item.assignedAt ? new Date(item.assignedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(item)}
                        className="text-[11px] h-7 px-2.5 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white gap-1"
                      >
                        <Edit3 className="h-3 w-3 text-primary" />
                        <span>Reassign</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Reassign Client Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121216] border border-neutral-800 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Reassign QR Code</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Token: {selectedQR.token} {selectedQR.serialNumber && `(${selectedQR.serialNumber})`}
                </p>
              </div>
              <button
                onClick={() => setSelectedQR(null)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReassignment} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Client / Customer Name *</Label>
                <Input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Client Mobile Number</Label>
                <Input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Business / Brand Name</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Place / Territory (e.g. Mumbai, Indiranagar)</Label>
                <Input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-300">Destination URL *</Label>
                <Input
                  required
                  type="url"
                  placeholder="https://..."
                  value={destUrl}
                  onChange={(e) => setDestUrl(e.target.value)}
                  className="bg-[#18181D] border-neutral-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedQR(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs font-bold gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Save Reassignment</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
