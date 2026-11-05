'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  QrCode,
  Users,
  Eye,
  Loader2,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { StaffDashboardSummary } from '@/modules/orgs/types';

export default function StaffMyWorkPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('orgId');

  const [summary, setSummary] = React.useState<StaffDashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSummary() {
      if (!orgId) {
        setError('No organization specified in request.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/v1/orgs/${orgId}/staff/dashboard`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Failed to load staff workspace.');
        }
        setSummary(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading workspace.');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      loadSummary();
    }
  }, [session, orgId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading your staff workspace...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center bg-card border border-border/60 rounded-2xl space-y-4">
        <ShieldCheck className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Workspace Unavailable</h2>
        <p className="text-xs text-muted-foreground">{error || 'Could not load staff dashboard.'}</p>
        <Link href="/team">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Team
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {summary.organization.name}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
            Staff Workspace
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="gold" className="uppercase text-[10px] tracking-wider px-2 py-0.5">
            Role: {summary.membership.role}
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize px-2 py-0.5">
            Status: {summary.membership.status}
          </Badge>
        </div>
      </div>

      {/* Assigned Responsibilities Banner */}
      {summary.membership.assignedResponsibilities && (
        <Card className="border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-foreground">Assigned Focus:</span>
            <p className="text-muted-foreground">{summary.membership.assignedResponsibilities}</p>
          </div>
        </Card>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Configured QRs</span>
            <QrCode className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{summary.assignedAssets.totalQRs}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Paired under your staff account</div>
        </Card>

        <Card className="border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Active Profiles</span>
            <Eye className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{summary.assignedAssets.activeProfiles}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Digital identity instances</div>
        </Card>

        <Card className="border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Captured Leads</span>
            <Users className="h-3.5 w-3.5" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{summary.assignedAssets.capturedLeads}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Networking inquiries</div>
        </Card>
      </div>

      {/* Operational Actions */}
      <Card className="border-border/60 bg-card/40 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Operational Shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/qr" className="block">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/50 hover:border-primary/50 transition-colors space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Dynamic QR Studio</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">Manage and retarget dynamic QR codes.</p>
            </div>
          </Link>

          <Link href="/staff/dashboard" className="block">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/50 hover:border-primary/50 transition-colors space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Field QR Scanner</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">Scan and pair cards on-site with mobile camera.</p>
            </div>
          </Link>

          <Link href="/leads" className="block">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/50 hover:border-primary/50 transition-colors space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">Contact Leads Inbox</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">Review incoming contact submissions.</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Personal Activity */}
      <Card className="border-border/60 bg-card/40 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Your Recent Staff Activity</h2>
        {summary.recentActivities.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No recent activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-border/40 text-xs">
            {summary.recentActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-semibold text-primary text-[11px] uppercase mr-2">
                    {act.action}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {act.resourceType}:{act.resourceId?.slice(0, 10)}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(act.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
