'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';
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
        setErrorMsg(res.error.message || 'Invalid credentials');
      } else {
        router.push(destination);
      }
    } catch {
      setErrorMsg('Failed to sign in. Please verify your connection.');
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
        setErrorMsg(res.error.message || 'Failed to send OTP');
      } else {
        const verifyQuery = buildAuthQueryString(templateParam, redirectParam, {
          email,
        });
        router.push(`/verify${verifyQuery}`);
      }
    } catch {
      setErrorMsg('Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const registerHref = `/register${buildAuthQueryString(templateParam, redirectParam)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo variant="symbol" size="lg" asLink href="/" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign In
          </h1>
        </div>

        <Card className="border-border/70 bg-card/60 p-5 shadow-sm space-y-4">
          <div className="flex border-b border-border/60 pb-2 text-xs justify-center space-x-6">
            <button
              type="button"
              onClick={() => setAuthMode('otp')}
              className={`font-semibold pb-1 transition-colors ${
                authMode === 'otp'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              OTP
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`font-semibold pb-1 transition-colors ${
                authMode === 'password'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Password
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          {authMode === 'otp' ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                <span>Send Code</span>
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-3">
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

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 bg-card border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                <span>Sign In</span>
              </Button>
            </form>
          )}

          <div className="pt-3 border-t border-border/40 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href={registerHref} className="text-primary hover:underline font-semibold">
              Create
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
