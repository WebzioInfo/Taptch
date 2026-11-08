'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Loader2, Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';
import { getSafeRedirectUrl, buildAuthQueryString } from '@/lib/auth/redirect';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const [authMode, setAuthMode] = React.useState<'password' | 'otp'>('otp');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid email or password.');
      } else {
        router.push(destination);
      }
    } catch {
      setErrorMsg('Failed to sign in. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Unable to send code.');
      } else {
        const query = buildAuthQueryString(templateParam, redirectParam, { email });
        router.push(`/verify${query}`);
      }
    } catch {
      setErrorMsg('Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 antialiased">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <BrandLogo variant="horizontal" size="md" asLink href="/" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-slate-900">
            Sign in to your account
          </h1>
          <p className="text-xs text-slate-500">
            Manage and share your digital profiles
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setErrorMsg(null); }}
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${
                  authMode === 'otp'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign in with Code
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('password'); setErrorMsg(null); }}
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${
                  authMode === 'password'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Password
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-600 text-xs border border-red-100 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {authMode === 'otp' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-9 text-xs"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Continue with code</span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="pwd-email" className="text-xs font-medium text-slate-700">
                    Email address
                  </label>
                  <Input
                    id="pwd-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-9 text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="password" className="text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link
            href={`/register${templateParam ? `?template=${templateParam}` : ''}`}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
