'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Shield, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
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
    <div className="w-full max-w-md space-y-6 z-10">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-3">
          <BrandLogo variant="symbol" size="xl" asLink href="/" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Enter Verification Code
        </h1>
        <p className="text-xs text-muted-foreground">
          A one-time security code was sent to <span className="font-semibold text-foreground">{email || 'your device'}</span>
        </p>
      </div>

      <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Enter 6-Digit Code</span>
            <Link href={loginHref} className="text-primary hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Change Email</span>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          {message && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!emailParam && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Confirm Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                One-Time Security Code
              </label>
              <Input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                className="bg-background/50 border-border text-center text-2xl tracking-[0.5em] font-mono h-14"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Authenticate Session
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col space-y-3 text-center border-t border-border/40 mt-4">
          <div className="text-xs text-muted-foreground pt-4 flex items-center justify-center space-x-2">
            <span>Didn&apos;t receive code?</span>
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-primary hover:underline font-semibold disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3 text-primary" />
            <span>Time-based HMAC SHA-256 verified single-use authentication tokens</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <React.Suspense
        fallback={
          <div className="w-full max-w-md p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyOtpInner />
      </React.Suspense>
    </div>
  );
}
