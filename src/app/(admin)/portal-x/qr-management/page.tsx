'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Layers,
  Plus,
  Search,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { VerifyQRTab } from '@/components/admin/VerifyQRTab';
import { PortalXHeader } from '@/components/admin/PortalXHeader';

interface BatchItem {
  id: string;
  batchCode: string;
  name: string;
  quantity: number;
  productType: string;
  destinationCategory: string;
  createdAt: string;
}

export default function PortalXQRManagementPage() {
  const [activeTab, setActiveTab] = React.useState<'batches' | 'qa_scanner'>('batches');
  const [batches, setBatches] = React.useState<BatchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [batchName, setBatchName] = React.useState('');
  const [quantity, setQuantity] = React.useState(50);
  const [startFrom, setStartFrom] = React.useState(1);
  const [productType, setProductType] = React.useState('sticker');
  const [paramName, setParamName] = React.useState('');
  const [valuePrefix, setValuePrefix] = React.useState('');
  const [sep, setSep] = React.useState('-');
  const [templateUrl, setTemplateUrl] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const fetchBatches = React.useCallback(() => {
    setLoading(true);
    fetch('/api/v1/qr/batches')
      .then((res) => res.json())
      .then((res) => {
        // Fallback: fetch general qr codes or batches
        if (Array.isArray(res.data)) {
          setBatches(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/v1/qr/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName.trim(),
          quantity: Number(quantity),
          startFrom: Number(startFrom),
          productType,
          paramName: paramName.trim() || undefined,
          valuePrefix: valuePrefix.trim() || undefined,
          sep: sep.trim() || undefined,
          manualRedirectUrl: templateUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to create batch');

      setShowCreateModal(false);
      setBatchName('');
      setTemplateUrl('');
      fetchBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating batch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <PortalXHeader
        title="Dynamic QR Management"
        subtitle="Post-print activation, bulk batch generator, and manufacturing QA"
        actions={
          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold gap-1.5 h-9"
          >
            <Plus className="h-4 w-4" />
            <span>Generate QR Batch</span>
          </Button>
        }
      />

      {/* Segmented Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'batches'
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Production Batches
        </button>
        <button
          onClick={() => setActiveTab('qa_scanner')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'qa_scanner'
              ? 'bg-neutral-800 text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Warehouse QA Scanner
        </button>
      </div>

      {activeTab === 'qa_scanner' ? (
        <VerifyQRTab />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search batches by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-[#121216] border-neutral-800 text-white placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-[#121216] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900/60 text-neutral-400 border-b border-neutral-800 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Batch Code</th>
                    <th className="py-3 px-4">Name / Label</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Product Type</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                        <span>Loading production batches...</span>
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-neutral-500 space-y-2">
                        <Layers className="h-8 w-8 mx-auto text-neutral-600" />
                        <p>No production batches generated yet.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateModal(true)}
                          className="h-8 text-xs border-neutral-700 text-white"
                        >
                          Create First Batch
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary">{b.batchCode}</td>
                        <td className="py-3.5 px-4 text-white font-medium">{b.name}</td>
                        <td className="py-3.5 px-4 text-neutral-300">{b.quantity} QRs</td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize text-[11px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                            {b.productType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/portal-x/qr-management/dynamic/batch/${b.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary hover:text-primary">
                              <span>Manage & Export</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Batch Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#121216] p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Generate Unassigned QR Batch</h3>
                <p className="text-xs text-neutral-400">Mint sequential cryptographic QRs for manufacturing</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <Label className="text-neutral-300">Batch Name *</Label>
                <Input
                  required
                  placeholder="e.g. November Cafe Table Decals #01"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="mt-1 h-9 text-xs bg-neutral-900 border-neutral-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-neutral-300">Quantity (1-2000) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={2000}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 h-9 text-xs bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Starting Sequence</Label>
                  <Input
                    type="number"
                    min={1}
                    value={startFrom}
                    onChange={(e) => setStartFrom(Number(e.target.value))}
                    className="mt-1 h-9 text-xs bg-neutral-900 border-neutral-800 text-white"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Product Designation</Label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 text-xs text-white"
                  >
                    <option value="sticker">Sticker</option>
                    <option value="standee">Acrylic Standee</option>
                    <option value="card">NFC Card</option>
                    <option value="packaging">Packaging</option>
                  </select>
                </div>
              </div>

              {/* Dynamic URL Template Settings */}
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                  Optional Parameterized URL Template
                </span>
                <div>
                  <Label className="text-neutral-400">Base Redirect URL</Label>
                  <Input
                    placeholder="https://menu.com (leave blank for unassigned setup)"
                    value={templateUrl}
                    onChange={(e) => setTemplateUrl(e.target.value)}
                    className="mt-1 h-9 text-xs bg-neutral-950 border-neutral-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-neutral-400">Param Name</Label>
                    <Input
                      placeholder="e.g. table"
                      value={paramName}
                      onChange={(e) => setParamName(e.target.value)}
                      className="mt-1 h-8 text-xs bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-neutral-400">Prefix</Label>
                    <Input
                      placeholder="e.g. T"
                      value={valuePrefix}
                      onChange={(e) => setValuePrefix(e.target.value)}
                      className="mt-1 h-8 text-xs bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-neutral-400">Separator</Label>
                    <Input
                      placeholder="-"
                      value={sep}
                      onChange={(e) => setSep(e.target.value)}
                      className="mt-1 h-8 text-xs bg-neutral-950 border-neutral-800 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="h-9 text-xs border-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  variant="gold"
                  className="h-9 text-xs font-bold gap-1.5"
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Mint {quantity} QRs</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
