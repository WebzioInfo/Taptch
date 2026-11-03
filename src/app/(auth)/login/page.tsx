'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="symbol" size="xl" asLink href="/" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to {brandConfig.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {templateParam
              ? 'Sign in to link this template and continue building your profile'
              : 'Access your executive profile, digital cards, and team analytics'}
          </p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex border-b border-border pb-3 text-xs justify-center space-x-6">
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`font-semibold pb-1 transition-colors ${
                  authMode === 'otp'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Instant OTP
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
                Password Login
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                {errorMsg}
              </div>
            )}

            {authMode === 'otp' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Work Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="aditya@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Send Instant Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="aditya@enterprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Sign In
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 flex flex-col space-y-3 text-center border-t border-border/40 mt-4">
            <div className="text-xs text-muted-foreground pt-4">
              Don&apos;t have an account?{' '}
              <Link href={registerHref} className="text-primary hover:underline font-semibold">
                Create Account
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Encrypted & secure</span>
            </div>
          </CardFooter>
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
