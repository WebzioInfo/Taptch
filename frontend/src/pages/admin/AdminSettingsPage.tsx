import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { ApiClient } from '../../services/api';
import { AdminPageHeader } from '../../components/common/AdminPageHeader';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';

interface PlatformSettings {
  paymentSimulatorEnabled: boolean;
  environment: string;
  razorpayConfigured: boolean;
  brandName: string;
  brandTagline: string;
  contactEmail: string;
  customDomainCname: string;
  featuresEnabled: {
    enablePublicRegistration: boolean;
    enableGoogleAuth: boolean;
    enablePhoneOtp: boolean;
    enableWalletPasses: boolean;
    enableCustomDomains: boolean;
  };
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<PlatformSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => ApiClient.get('/api/v1/admin/settings'),
  });

  const [brandName, setBrandName] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [customDomainCname, setCustomDomainCname] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (data) {
      setBrandName(data.brandName || '');
      setBrandTagline(data.brandTagline || '');
      setContactEmail(data.contactEmail || '');
      setCustomDomainCname(data.customDomainCname || '');
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      ApiClient.patch('/api/v1/admin/settings', {
        brandName,
        brandTagline,
        contactEmail,
        customDomainCname,
      }),
    onSuccess: () => {
      setSavedNotice(true);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setTimeout(() => setSavedNotice(false), 3000);
    },
  });

  return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
            <AdminPageHeader
              title="System Settings"
              subtitle="Configure platform identity, runtime environment, and payment gateway status"
              action={
                <Button
                  variant="accent"
                  size="sm"
                  disabled={saveMutation.isPending || isLoading}
                  onClick={() => saveMutation.mutate()}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              }
            />

            {savedNotice && (
        <div className="p-3 rounded-[12px] bg-[var(--success-bg)] border border-[var(--success-border)] text-xs text-[var(--success)] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>System settings saved successfully.</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
          Loading system settings...
        </div>
      ) : isError || !data ? (
        <div className="p-4 rounded-[12px] bg-[var(--danger-bg)] border border-[var(--danger-border)] text-xs text-[var(--danger-text)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{(error as Error)?.message || 'Failed to load settings.'}</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Runtime Status */}
          <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <Settings className="w-4 h-4 text-[var(--accent-text)]" />
              <span>Environment &amp; Gateway Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)]">
                <div className="text-[var(--ink-muted)]">Environment</div>
                <div className="mt-1 font-semibold text-[var(--ink)] uppercase">
                  {data.environment}
                </div>
              </div>
              <div className="p-3.5 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)]">
                <div className="text-[var(--ink-muted)]">Payment Simulator</div>
                <div className="mt-1.5">
                  <StatusBadge
                    status={data.paymentSimulatorEnabled ? 'pending' : 'inactive'}
                    label={data.paymentSimulatorEnabled ? 'Enabled (Test Mode)' : 'Disabled'}
                  />
                </div>
              </div>
              <div className="p-3.5 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border)]">
                <div className="text-[var(--ink-muted)]">Razorpay Gateway</div>
                <div className="mt-1.5">
                  <StatusBadge
                    status={data.razorpayConfigured ? 'active' : 'inactive'}
                    label={data.razorpayConfigured ? 'Configured' : 'Not Configured'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Brand & Domain Configuration */}
          <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4">
            <h2 className="text-sm font-bold text-[var(--ink)]">Platform Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--ink)] mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--ink)] mb-1">Support Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--ink)] mb-1">Tagline</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--ink)] mb-1">Custom Domain CNAME</label>
                <input
                  type="text"
                  value={customDomainCname}
                  onChange={(e) => setCustomDomainCname(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] text-[var(--ink)] border border-[var(--border-strong)] rounded-[8px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
