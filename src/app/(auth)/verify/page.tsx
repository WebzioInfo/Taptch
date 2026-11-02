'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Shield, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

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
        router.push('/dashboard');
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

  return (
    <div className="w-full max-w-md space-y-6 z-10">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center font-bold text-xl text-primary mb-2">
          {brandConfig.name.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Enter Verification Code
        </h1>
        <p className="text-xs text-muted-foreground">
          A one-time security code was sent to <span className="font-semibold text-foreground">{email || 'your device'}</span>
        </p>
      </div>

      <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
            Two-Factor / Passwordless Verification
          </span>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          {message && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!emailParam && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                6-Digit Security Code
              </label>
              <Input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                className="text-center font-mono text-2xl tracking-[0.5em] h-12"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </div>

            <Button type="submit" variant="gold" className="w-full h-11" disabled={loading || otp.length < 6}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm & Enter
            </Button>
          </form>

          <div className="flex justify-between items-center mt-5 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
            <Link href="/login" className="flex items-center hover:text-foreground">
              <ArrowLeft className="h-3 w-3 mr-1" /> Back to sign in
            </Link>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col space-y-2 text-center border-t border-border/40 mt-4">
          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-muted-foreground pt-4">
            <Shield className="h-3 w-3 text-primary" />
            <span>Time-based OTP expires in 10 minutes</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <React.Suspense fallback={<div className="text-muted-foreground text-sm">Loading security verification...</div>}>
        <VerifyOtpInner />
      </React.Suspense>
    </div>
  );
}

