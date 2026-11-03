'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signUp } from '@/lib/auth/client';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { getSafeRedirectUrl, buildAuthQueryString } from '@/lib/auth/redirect';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Registration failed');
      } else {
        router.push(destination);
      }
    } catch {
      setErrorMsg('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref = `/login${buildAuthQueryString(templateParam, redirectParam)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="symbol" size="xl" asLink href="/" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Your {brandConfig.name} Account
          </h1>
          <p className="text-xs text-muted-foreground">
            {templateParam
              ? 'Complete free signup to apply this template to your new digital profile'
              : 'Deploy your obsidian digital business card and join elite networks'}
          </p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {templateParam ? `Template Selected: ${templateParam}` : 'Registration'}
            </span>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Aditya Vikram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border text-sm"
                />
              </div>

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
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-border text-sm"
                />
              </div>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {templateParam ? 'Continue with Template' : 'Launch Profile'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 flex flex-col space-y-3 text-center border-t border-border/40 mt-4">
            <div className="text-xs text-muted-foreground pt-4">
              Already have an account?{' '}
              <Link href={loginHref} className="text-primary hover:underline font-semibold">
                Sign In
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Free forever • No credit card required</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}
