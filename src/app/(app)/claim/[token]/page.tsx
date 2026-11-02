'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreditCard, Sparkles, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ProfileSummary {
  id: string;
  displayName: string;
  slug: string;
}

export default function ClaimCardPage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [activationCode, setActivationCode] = React.useState('');
  const [profiles, setProfiles] = React.useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (session?.user) {
      fetch('/api/v1/profiles')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setProfiles(data.data);
            if (data.data.length > 0) {
              setSelectedProfileId(data.data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      setError('Please enter your card activation code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationCode: activationCode.trim(),
          profileId: selectedProfileId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to claim card.');
      }

      setSuccess(`Congratulations! Card ${data.data.serialNumber} is now active.`);
      setTimeout(() => {
        router.push('/cards');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="border-border/80 bg-card/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/60">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Activate Your {brandConfig.name} Smart Card
          </CardTitle>
          <CardDescription>
            You scanned card token <span className="font-mono text-primary">{token?.slice(0, 8)}...</span>. Enter your packaging activation code to pair it to your digital identity.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {sessionPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !session?.user ? (
            <div className="space-y-4 text-center py-4">
              <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Please sign in to your account or create a new account to link this physical card.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => router.push(`/login?redirect=/claim/${token}`)}>
                  Sign In
                </Button>
                <Button variant="gold" onClick={() => router.push(`/register?redirect=/claim/${token}`)}>
                  Create Account
                </Button>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center py-6">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-lg text-foreground">{success}</h3>
              <p className="text-xs text-muted-foreground">Redirecting to your card management page...</p>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-6">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="activationCode" className="text-sm font-medium">
                  Activation Code
                </Label>
                <Input
                  id="activationCode"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TPZ-ACT-XXXX"
                  className="font-mono text-center tracking-widest text-lg uppercase bg-background/50 border-border"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Located on the security sticker inside your card presentation box.
                </p>
              </div>

              {profiles.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="profileSelect" className="text-sm font-medium">
                    Link to Profile
                  </Label>
                  <select
                    id="profileSelect"
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName} (/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 text-xs rounded-lg bg-primary/10 border border-primary/20 text-muted-foreground flex items-center justify-between">
                  <span>No profiles found yet. You can create one right now!</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary gap-1"
                    onClick={() => router.push('/builder/new')}
                  >
                    Create Profile <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                disabled={loading}
                className="w-full gap-2 font-medium"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Activate & Pair Card
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

