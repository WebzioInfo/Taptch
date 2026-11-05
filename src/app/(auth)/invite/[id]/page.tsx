'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function InvitationResponsePage() {
  const params = useParams();
  const invitationId = params?.id as string;
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleAccept = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/invite/${invitationId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/orgs/invitations/${invitationId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to accept invitation');
      }

      setSuccess('Invitation accepted successfully! Redirecting to your team workspace...');
      setTimeout(() => {
        router.push('/team');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error accepting invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/invite/${invitationId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/orgs/invitations/${invitationId}/reject`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reject invitation');
      }

      setSuccess('Invitation declined.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error declining invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <BrandLogo variant="horizontal" size="md" className="mx-auto" />

        <Card className="border-border/60 bg-card/60 p-6 space-y-5 shadow-xl text-xs">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-base font-bold text-foreground">Team Collaboration Invitation</h1>
            <p className="text-muted-foreground mt-1">
              You have been invited to join an organization on {brandConfig.name}.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-left">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {!session?.user && !sessionLoading && (
                <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg">
                  Please sign in or create an account to accept this invitation.
                </p>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={loading}
                  className="h-8 text-xs flex-1"
                >
                  Decline
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleAccept}
                  disabled={loading}
                  className="h-8 text-xs font-semibold flex-1 gap-1.5"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Accept Invitation
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
