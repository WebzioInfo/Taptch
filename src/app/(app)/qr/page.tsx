'use client';

import * as React from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { brandConfig } from '@/config/brand';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  Plus,
  Copy,
  CheckCircle,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Sliders,
  X,
} from 'lucide-react';

interface QRCodeItem {
  id: string;
  name: string | null;
  token: string;
  shortCode: string | null;
  destinationType: 'profile' | 'url' | 'whatsapp' | 'vcard' | 'multilink';
  targetUrl: string | null;
  profileId: string | null;
  destinationPayload: Record<string, unknown> | null;
  status: string;
  totalScans: number;
  uniqueScans: number;
  lastScannedAt: string | null;
  designConfig: {
    fgColor?: string;
    bgColor?: string;
    cornerShape?: 'square' | 'rounded' | 'dots';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  } | null;
  createdAt: string;
}

interface ProfileOption {
  id: string;
  displayName: string;
  slug: string;
  profileType: string;
}

export default function CustomerQRPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [qrList, setQrList] = React.useState<QRCodeItem[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingQR, setEditingQR] = React.useState<QRCodeItem | null>(null);
  const [stylingQR, setStylingQR] = React.useState<QRCodeItem | null>(null);

  // Form states for creation
  const [createName, setCreateName] = React.useState('');
  const [createDestType, setCreateDestType] = React.useState<'profile' | 'url' | 'whatsapp'>('profile');
  const [createProfileId, setCreateProfileId] = React.useState('');
  const [createTargetUrl, setCreateTargetUrl] = React.useState('');
  const [createPhone, setCreatePhone] = React.useState('');
  const [createMessage, setCreateMessage] = React.useState('');
  const [submittingCreate, setSubmittingCreate] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Form states for destination editing
  const [editDestType, setEditDestType] = React.useState<'profile' | 'url' | 'whatsapp'>('profile');
  const [editProfileId, setEditProfileId] = React.useState('');
  const [editTargetUrl, setEditTargetUrl] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editMessage, setEditMessage] = React.useState('');
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Form states for QR styling
  const [fgColor, setFgColor] = React.useState('#000000');
  const [bgColor, setBgColor] = React.useState('#FFFFFF');
  const [submittingStyle, setSubmittingStyle] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [qrRes, profRes] = await Promise.all([
        fetch('/api/v1/qr').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/v1/profiles').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (qrRes.data) {
        setQrList(qrRes.data);
      }
      if (profRes.data) {
        setProfiles(profRes.data);
        if (profRes.data.length > 0 && !createProfileId) {
          setCreateProfileId(profRes.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [createProfileId]);

  React.useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const getQRRedirectUrl = (qr: QRCodeItem) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/dq/${qr.token}`;
  };

  const handleCopy = (qr: QRCodeItem) => {
    const url = getQRRedirectUrl(qr);
    navigator.clipboard.writeText(url);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPng = async (qr: QRCodeItem) => {
    try {
      const url = getQRRedirectUrl(qr);
      const fg = qr.designConfig?.fgColor || '#000000';
      const bg = qr.designConfig?.bgColor || '#FFFFFF';

      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: 'H',
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${brandConfig.name.toLowerCase()}-qr-${qr.token}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    }
  };

  const handleDownloadSvg = async (qr: QRCodeItem) => {
    try {
      const url = getQRRedirectUrl(qr);
      const fg = qr.designConfig?.fgColor || '#000000';
      const bg = qr.designConfig?.bgColor || '#FFFFFF';

      const svgString = await QRCode.toString(url, {
        type: 'svg',
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: 'H',
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${brandConfig.name.toLowerCase()}-qr-${qr.token}.svg`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to generate SVG:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setSubmittingCreate(true);

    try {
      const payload: Record<string, unknown> = {
        name: createName.trim() || undefined,
        destinationType: createDestType,
        isDynamic: true,
      };

      if (createDestType === 'profile') {
        if (!createProfileId) {
          throw new Error('Please select a profile.');
        }
        payload.profileId = createProfileId;
      } else if (createDestType === 'url') {
        if (!createTargetUrl.trim()) {
          throw new Error('Please enter a destination URL.');
        }
        let url = createTargetUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        payload.targetUrl = url;
      } else if (createDestType === 'whatsapp') {
        if (!createPhone.trim()) {
          throw new Error('Please enter a WhatsApp phone number with country code.');
        }
        const phone = createPhone.replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(createMessage.trim());
        payload.targetUrl = `https://wa.me/${phone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
        payload.destinationPayload = { phone, message: createMessage.trim() };
      }

      const res = await fetch('/api/v1/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create QR code.');
      }

      setIsCreateOpen(false);
      setCreateName('');
      setCreateTargetUrl('');
      setCreatePhone('');
      setCreateMessage('');
      await loadData();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openEditModal = (qr: QRCodeItem) => {
    setEditingQR(qr);
    setEditDestType(qr.destinationType === 'whatsapp' ? 'whatsapp' : qr.destinationType === 'url' ? 'url' : 'profile');
    setEditProfileId(qr.profileId || (profiles[0]?.id || ''));
    setEditTargetUrl(qr.targetUrl || '');
    if (qr.destinationType === 'whatsapp' && qr.destinationPayload) {
      setEditPhone((qr.destinationPayload.phone as string) || '');
      setEditMessage((qr.destinationPayload.message as string) || '');
    } else {
      setEditPhone('');
      setEditMessage('');
    }
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQR) return;
    setEditError(null);
    setSubmittingEdit(true);

    try {
      const payload: Record<string, unknown> = {
        destinationType: editDestType,
      };

      if (editDestType === 'profile') {
        if (!editProfileId) throw new Error('Please select a profile.');
        payload.profileId = editProfileId;
        payload.targetUrl = null;
      } else if (editDestType === 'url') {
        if (!editTargetUrl.trim()) throw new Error('Please enter a valid URL.');
        let url = editTargetUrl.trim();
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        payload.targetUrl = url;
        payload.profileId = null;
      } else if (editDestType === 'whatsapp') {
        if (!editPhone.trim()) throw new Error('Please enter a phone number with country code.');
        const phone = editPhone.replace(/[^0-9]/g, '');
        const encodedMsg = encodeURIComponent(editMessage.trim());
        payload.targetUrl = `https://wa.me/${phone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
        payload.destinationPayload = { phone, message: editMessage.trim() };
        payload.profileId = null;
      }

      const res = await fetch(`/api/v1/qr/${editingQR.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update destination.');
      }

      setEditingQR(null);
      await loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openStylingModal = (qr: QRCodeItem) => {
    setStylingQR(qr);
    setFgColor(qr.designConfig?.fgColor || '#000000');
    setBgColor(qr.designConfig?.bgColor || '#FFFFFF');
  };

  const handleStyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stylingQR) return;
    setSubmittingStyle(true);

    try {
      const res = await fetch(`/api/v1/qr/${stylingQR.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designConfig: {
            fgColor,
            bgColor,
            errorCorrectionLevel: 'H',
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update styling.');

      setStylingQR(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save QR style configuration.');
    } finally {
      setSubmittingStyle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Dynamic QR Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your high-speed smart redirect QR codes. Update destinations anytime without reprinting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={loadData} disabled={loading} variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 text-xs font-semibold gap-1.5 px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Dynamic QR</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading your dynamic QR codes...</p>
        </div>
      ) : qrList.length === 0 ? (
        <Card className="border-slate-200 bg-white p-8 text-center max-w-lg mx-auto my-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 mx-auto mb-4">
            <QrCode className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">No QR Codes Yet</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Create a dynamic QR code for your digital profile, website, or WhatsApp. You can change where it points at any time.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs font-medium gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Your First QR
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrList.map((qr) => {
            const redirectUrl = getQRRedirectUrl(qr);
            const isProfile = qr.destinationType === 'profile';
            const linkedProfile = isProfile ? profiles.find((p) => p.id === qr.profileId) : null;

            return (
              <Card key={qr.id} className="border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
                {/* Header Strip */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {qr.name || `Dynamic QR #${qr.token.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                          {qr.destinationType}
                        </Badge>
                        <Badge variant="default" className="text-[9px] px-1 py-0">
                          Dynamic
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {qr.totalScans} {qr.totalScans === 1 ? 'scan' : 'scans'}
                      </span>
                    </div>
                  </div>

                  {/* QR Canvas / Visual Preview */}
                  <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <QRCanvasVisual
                      content={redirectUrl}
                      fgColor={qr.designConfig?.fgColor || '#000000'}
                      bgColor={qr.designConfig?.bgColor || '#FFFFFF'}
                    />

                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <div className="text-[11px] text-slate-500 font-medium">Destination:</div>
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {isProfile
                          ? linkedProfile
                            ? linkedProfile.displayName
                            : 'Linked Digital Profile'
                          : qr.targetUrl || 'Unassigned URL'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {redirectUrl.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(qr)}
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>Edit Link</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStylingModal(qr)}
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Sparkles className="h-3 w-3 text-blue-600" />
                      <span>Styling</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(qr)}
                      className="h-7 text-xs px-2 gap-1 flex-1"
                    >
                      {copiedId === qr.id ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === qr.id ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPng(qr)}
                      className="h-7 text-xs px-2 gap-1 flex-1"
                      title="Download 1024x1024 PNG"
                    >
                      <Download className="h-3 w-3" />
                      <span>PNG</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSvg(qr)}
                      className="h-7 text-xs px-2 gap-1 flex-1"
                      title="Download Vector SVG"
                    >
                      <Download className="h-3 w-3" />
                      <span>SVG</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-slate-900">Create Dynamic QR Code</h2>

            {createError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-900 mb-1">Name / Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Desk Standee, Business Card, Conference"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-900 mb-1">Destination Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['profile', 'url', 'whatsapp'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCreateDestType(type)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                        createDestType === type
                          ? 'bg-blue-600/20 text-blue-600 border-blue-600 font-semibold'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {createDestType === 'profile' && (
                <div>
                  <label className="block font-medium text-slate-900 mb-1">Select Digital Profile</label>
                  {profiles.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No profiles found. <Link href="/builder/new" className="text-blue-600 underline">Create one first</Link>.
                    </p>
                  ) : (
                    <select
                      value={createProfileId}
                      onChange={(e) => setCreateProfileId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} (/p/{p.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {createDestType === 'url' && (
                <div>
                  <label className="block font-medium text-slate-900 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/promo"
                    value={createTargetUrl}
                    onChange={(e) => setCreateTargetUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              )}

              {createDestType === 'whatsapp' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-slate-900 mb-1">WhatsApp Number (with country code)</label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-900 mb-1">Default Pre-filled Message</label>
                    <input
                      type="text"
                      placeholder={`Hi, I scanned your ${brandConfig.name} QR code!`}
                      value={createMessage}
                      onChange={(e) => setCreateMessage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submittingCreate}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={submittingCreate}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {submittingCreate && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Dynamic QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DESTINATION MODAL */}
      {editingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingQR(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-slate-900">Update Destination</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Physical QR code remains identical; traffic redirects instantly to the new target.
              </p>
            </div>

            {editError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-900 mb-1">Destination Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['profile', 'url', 'whatsapp'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditDestType(type)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                        editDestType === type
                          ? 'bg-blue-600/20 text-blue-600 border-blue-600 font-semibold'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {editDestType === 'profile' && (
                <div>
                  <label className="block font-medium text-slate-900 mb-1">Select Digital Profile</label>
                  <select
                    value={editProfileId}
                    onChange={(e) => setEditProfileId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName} (/p/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editDestType === 'url' && (
                <div>
                  <label className="block font-medium text-slate-900 mb-1">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/new-page"
                    value={editTargetUrl}
                    onChange={(e) => setEditTargetUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              )}

              {editDestType === 'whatsapp' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-medium text-slate-900 mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-900 mb-1">Pre-filled Message</label>
                    <input
                      type="text"
                      placeholder="Hi there!"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQR(null)}
                  disabled={submittingEdit}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={submittingEdit}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {submittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Destination
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STYLING MODAL */}
      {stylingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setStylingQR(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                QR Customizer
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Customize colors while maintaining high-contrast scanning reliability.
              </p>
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <QRCanvasVisual
                content={getQRRedirectUrl(stylingQR)}
                fgColor={fgColor}
                bgColor={bgColor}
                size={120}
              />
            </div>

            <form onSubmit={handleStyleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-900 mb-1">Foreground Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-8 w-8 rounded border border-slate-200 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-900 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-8 rounded border border-slate-200 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStylingQR(null)}
                  disabled={submittingStyle}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={submittingStyle}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {submittingStyle && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Styling
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * High-performance canvas QR renderer component using `qrcode`
 */
function QRCanvasVisual({
  content,
  fgColor,
  bgColor,
  size = 64,
}: {
  content: string;
  fgColor: string;
  bgColor: string;
  size?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !content) return;

    QRCode.toCanvas(canvasRef.current, content, {
      width: size,
      margin: 1,
      color: {
        dark: fgColor || '#000000',
        light: bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    }).catch((err) => {
      console.error('Canvas QR rendering error:', err);
    });
  }, [content, fgColor, bgColor, size]);

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200/50 shrink-0 bg-white">
      <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />
    </div>
  );
}
