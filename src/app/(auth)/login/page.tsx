'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = React.useState<'password' | 'otp'>('otp');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
        router.push('/dashboard');
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
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setErrorMsg('Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center font-bold text-xl text-primary mb-2">
            {brandConfig.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to {brandConfig.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Access your executive profile, digital cards, and team analytics
          </p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex border-b border-border pb-3 text-xs justify-center space-x-6">
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`font-semibold pb-1 transition-colors ${
                  authMode === 'otp' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Instant OTP
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`font-semibold pb-1 transition-colors ${
                  authMode === 'password' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
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
                    placeholder="aditya@apexcapital.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Send Verification Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Work Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="aditya@apexcapital.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
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
              <Link href="/register" className="text-primary hover:underline font-semibold">
                Create Account
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" />
              <span>Secured with end-to-end multi-tenant cryptographic isolation</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
