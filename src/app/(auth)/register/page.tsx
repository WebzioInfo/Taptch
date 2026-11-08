'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { signUp } from '@/lib/auth/client';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { getSafeRedirectUrl } from '@/lib/auth/redirect';

function formatRegisterError(rawMessage?: string, code?: string): string {
  if (code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' || (rawMessage && /already exists/i.test(rawMessage))) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code === 'PASSWORD_TOO_SHORT' || (rawMessage && /password too short/i.test(rawMessage))) {
    return 'Password is too short. Please choose a password with at least 8 characters.';
  }
  if (code === 'INVALID_ORIGIN') {
    return 'Security validation failed due to an untrusted origin. Please reload the page.';
  }
  if (code === 'VALIDATION_ERROR' || (rawMessage && /invalid email/i.test(rawMessage))) {
    return 'Please enter a valid email address.';
  }
  if (rawMessage && !/internal server error/i.test(rawMessage)) {
    return rawMessage;
  }
  return 'Unable to complete registration. Please check your network connection and try again.';
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; email?: string; password?: string }>({});

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Please enter your full name.';
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      const res = await signUp.email({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      if (res.error) {
        setErrorMsg(formatRegisterError(res.error.message, res.error.code));
      } else {
        router.push(destination);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(formatRegisterError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 antialiased font-sans">
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
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-xs border border-red-100 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
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
                  disabled={loading}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Aditya Sharma"
                  className={`h-9 text-xs ${fieldErrors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  autoFocus
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="reg-email" className="text-xs font-medium text-slate-700">
                  Email address
                </label>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="name@company.com"
                  className={`h-9 text-xs ${fieldErrors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-600 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-password" className="text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">At least 8 characters</span>
                </div>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    disabled={loading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`h-9 text-xs pr-9 ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !name || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </div>
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
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
