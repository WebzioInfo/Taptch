'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { emailOtp } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';
import { getSafeRedirectUrl } from '@/lib/auth/redirect';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailParam || otp.length < 6) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await emailOtp.verifyEmail({
        email: emailParam,
        otp,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid or expired code.');
      } else {
        router.push(destination);
      }
    } catch {
      setErrorMsg('Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) return;
    setResending(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email: emailParam,
        type: 'sign-in',
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Unable to resend code.');
      } else {
        setInfoMsg('A new verification code has been sent to your email.');
      }
    } catch {
      setErrorMsg('Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 antialiased">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <BrandLogo variant="horizontal" size="md" asLink href="/" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Check your email
          </h1>
          <p className="text-xs text-slate-500">
            We sent a verification code to{' '}
            <span className="font-semibold text-slate-700">{emailParam || 'your email'}</span>
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-600 text-xs border border-red-100 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {infoMsg && (
              <div className="p-2.5 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100 leading-relaxed">
                {infoMsg}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="otp" className="text-xs font-semibold text-slate-700">
                  Verification Code
                </label>
                <Input
                  id="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  className="h-10 text-center tracking-widest font-mono text-base font-semibold"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Verify and Sign In</span>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend verification code'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900">
            ← Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyContent />
    </React.Suspense>
  );
}
