'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Building,
  User,
  Phone,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface ResolveData {
  status: 'assigned' | 'unassigned' | 'disabled' | 'not_found';
  redirect_url?: string;
  token: string;
}

export default function StaffAssignPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string)?.toLowerCase().trim();

  const [loadingInitial, setLoadingInitial] = React.useState(true);
  const [resolveData, setResolveData] = React.useState<ResolveData | null>(null);
  const [initialError, setInitialError] = React.useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [destinationUrl, setDestinationUrl] = React.useState('');
  const [isReassignMode, setIsReassignMode] = React.useState(false);

  // Submit status
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [successResult, setSuccessResult] = React.useState<{ activatedUrl: string } | null>(null);

  // Resolve token on mount
  React.useEffect(() => {
    if (!token) return;

    setLoadingInitial(true);
    fetch(`/api/qr/dynamic/${token}/resolve`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error?.message || 'Unable to resolve QR token.');
        }
        return body.data as ResolveData;
      })
      .then((data) => {
        setResolveData(data);
        if (data.status === 'assigned') {
          setIsReassignMode(true);
          if (data.redirect_url) {
            setDestinationUrl(data.redirect_url);
          }
        }
      })
      .catch((err) => {
        setInitialError(err instanceof Error ? err.message : 'Failed to inspect QR code.');
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !destinationUrl) {
      setSubmitError('Customer Name and Destination URL are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/admin/sales/assign-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: token,
          name: customerName.trim(),
          mobile_number: mobileNumber.trim() || undefined,
          place: place.trim() || undefined,
          business: businessName.trim() || undefined,
          destination_url: destinationUrl.trim(),
          isReassign: isReassignMode,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || 'Failed to assign QR code.');
      }

      setSuccessResult({
        activatedUrl: body.data?.qr?.manualRedirectUrl || destinationUrl,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error during activation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center space-y-3 text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs">Resolving token #{token}...</p>
      </div>
    );
  }

  if (initialError || !resolveData) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white p-6 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">QR Token Issue</h2>
        <p className="text-xs text-neutral-400">{initialError || 'QR Code not found or invalid.'}</p>
        <Link href="/staff/dashboard">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 border-neutral-800 text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Scan Another</span>
          </Button>
        </Link>
      </div>
    );
  }

  // Success view
  if (successResult) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white p-6 flex flex-col justify-center max-w-md mx-auto">
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">QR Code Activated!</h2>
            <p className="text-xs text-neutral-400">Physical QR #{token} is now live</p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-left space-y-1 text-xs">
            <span className="text-[10px] text-neutral-500 font-mono uppercase">Redirect Target</span>
            <div className="text-primary font-medium truncate flex items-center gap-1">
              <span className="truncate">{successResult.activatedUrl}</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="gold"
              onClick={() => router.push('/staff/dashboard')}
              className="w-full h-10 text-xs font-bold"
            >
              Scan Next QR Code
            </Button>
            <Link href="/staff/history">
              <Button
                variant="ghost"
                className="w-full h-9 text-xs text-neutral-400 hover:text-white"
              >
                View Activation History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground flex flex-col pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-800 bg-[#0A0A0C]/90 px-4 backdrop-blur">
        <Link href="/staff/dashboard" className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-xs font-bold text-white tracking-wide">POST-PRINT ACTIVATION</span>
          <div className="text-[10px] font-mono text-neutral-400">TOKEN: {token}</div>
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Status Badge */}
        {resolveData.status === 'unassigned' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Unassigned — Ready for Initial Setup</span>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Currently Assigned (Reassignment Mode)</span>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} className="bg-[#121216] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div>
            <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-500" />
              <span>Customer / Owner Name *</span>
            </Label>
            <Input
              required
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <div>
            <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-neutral-500" />
              <span>Mobile Number</span>
            </Label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="mt-1 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <div>
            <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-neutral-500" />
              <span>Business / Shop Name</span>
            </Label>
            <Input
              placeholder="e.g. Royal Cafe & Bakery"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <div>
            <Label className="text-xs text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                <span>Location / City (Google Places)</span>
              </span>
              <span className="text-[10px] text-neutral-500">Auto-suggest</span>
            </Label>
            <Input
              id="places-autocomplete-input"
              placeholder="e.g. Indiranagar, Bengaluru or search place..."
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="mt-1 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
            {/* Quick-tap territory chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'].map((city) => (
                <button
                  type="button"
                  key={city}
                  onClick={() => setPlace(city)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    place === city
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-neutral-300 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-neutral-500" />
              <span>Destination URL *</span>
            </Label>
            <Input
              required
              placeholder="https://g.page/r/your-review or https://..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="mt-1 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              Supports Google Reviews, Instagram, Menu, or Custom Websites.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              variant="gold"
              className="w-full h-11 text-xs font-bold gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Activating QR Code...</span>
                </>
              ) : (
                <span>{isReassignMode ? 'Reassign & Activate' : 'Assign & Activate QR'}</span>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
