'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { signUp } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';
import { getSafeRedirectUrl } from '@/lib/auth/redirect';

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
      setErrorMsg('Failed to create account. Please check your connection.');
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
            Create your account
          </h1>
          <p className="text-xs text-slate-500">
            Set up your digital identity in minutes
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-600 text-xs border border-red-100 leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="name" className="text-xs font-medium text-slate-700">
                  Full name
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Sharma"
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="reg-email" className="text-xs font-medium text-slate-700">
                  Email address
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="reg-password" className="text-xs font-medium text-slate-700">
                  Password
                </label>
                <Input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !name || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href={`/login${templateParam ? `?template=${templateParam}` : ''}`}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}
