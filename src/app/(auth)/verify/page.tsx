'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getSafeRedirectUrl, buildAuthQueryString } from '@/lib/auth/redirect';

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const [email, setEmail] = React.useState(emailParam);
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setMessage(null);

    try {
      const res = await signIn.emailOtp({
        email,
        otp,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid or expired OTP code');
      } else {
        router.push(destination);
      }
    } catch {
      setErrorMsg('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg(null);
    setMessage(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Failed to resend code');
      } else {
        setMessage('A fresh 6-digit security code has been dispatched.');
      }
    } catch {
      setErrorMsg('Could not resend OTP code.');
    } finally {
      setResending(false);
    }
  };

  const loginHref = `/login${buildAuthQueryString(templateParam, redirectParam)}`;

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <BrandLogo variant="symbol" size="lg" asLink href="/" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Verify
        </h1>
        <p className="text-xs text-muted-foreground truncate">
          Code sent to <span className="font-medium text-foreground">{email || 'email'}</span>
        </p>
      </div>

      <Card className="border-border/70 bg-card/60 p-5 shadow-sm space-y-4">
        {errorMsg && (
          <div className="p-2.5 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        {message && (
          <div className="p-2.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          {!emailParam && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 bg-card border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              6-Digit Code
            </label>
            <Input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              className="bg-card border-border text-center text-xl tracking-[0.4em] font-mono h-11 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            <span>Verify</span>
          </Button>
        </form>

        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <Link href={loginHref} className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="text-primary hover:underline font-semibold disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <React.Suspense
        fallback={
          <div className="w-full max-w-sm p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyOtpInner />
      </React.Suspense>
    </div>
  );
}
