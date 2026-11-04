'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { signUp } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo variant="symbol" size="lg" asLink href="/" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
        </div>

        <Card className="border-border/70 bg-card/60 p-5 shadow-sm space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 bg-card border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

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
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 bg-card border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <Button type="submit" variant="gold" className="w-full h-8 text-xs font-semibold" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              <span>{templateParam ? 'Continue' : 'Create'}</span>
            </Button>
          </form>

          <div className="pt-3 border-t border-border/40 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link href={loginHref} className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </div>
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
