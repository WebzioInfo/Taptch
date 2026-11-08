'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { signIn, emailOtp } from '@/lib/auth/client';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { getSafeRedirectUrl, buildAuthQueryString } from '@/lib/auth/redirect';

function formatLoginError(rawMessage?: string, code?: string): string {
  if (code === 'INVALID_EMAIL_OR_PASSWORD' || (rawMessage && /invalid email or password/i.test(rawMessage))) {
    return 'Invalid email address or password. Please verify your credentials and try again.';
  }
  if (code === 'USER_NOT_FOUND' || (rawMessage && /user not found/i.test(rawMessage))) {
    return 'No account was found with this email address. Please create an account.';
  }
  if (code === 'ACCOUNT_SUSPENDED' || (rawMessage && /suspended/i.test(rawMessage))) {
    return 'Your account is currently unavailable. Please contact support.';
  }
  if (code === 'INVALID_ORIGIN') {
    return 'Security validation failed due to an untrusted origin. Please reload the page.';
  }
  if (rawMessage && !/internal server error/i.test(rawMessage)) {
    return rawMessage;
  }
  return 'Unable to sign in right now. Please check your network connection and try again.';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  const redirectParam = searchParams.get('redirect');

  const [authMode, setAuthMode] = React.useState<'password' | 'otp'>('password');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const validatePasswordForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOtpForm = (): boolean => {
    const errors: { email?: string } = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await signIn.email({
        email: cleanEmail,
        password,
      });

      if (res.error) {
        setErrorMsg(formatLoginError(res.error.message, res.error.code));
      } else {
        router.push(destination);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(formatLoginError(message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateOtpForm()) {
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await emailOtp.sendVerificationOtp({
        email: cleanEmail,
        type: 'sign-in',
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Unable to dispatch verification code.');
      } else {
        const query = buildAuthQueryString(templateParam, redirectParam, { email: cleanEmail });
        router.push(`/verify${query}`);
      }
    } catch {
      setErrorMsg('Failed to dispatch verification code. Please try again.');
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
                onClick={() => {
                  setAuthMode('password');
                  setErrorMsg(null);
                  setFieldErrors({});
                }}
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${
                  authMode === 'password'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setErrorMsg(null);
                  setFieldErrors({});
                }}
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${
                  authMode === 'otp'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign in with Code
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-xs border border-red-100 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {authMode === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="pwd-email" className="text-xs font-medium text-slate-700">
                    Email address
                  </label>
                  <Input
                    id="pwd-email"
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
                    autoFocus
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-medium text-slate-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
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
                  disabled={loading || !email || !password}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Email address
                  </label>
                  <Input
                    id="email"
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
                    autoFocus
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending code...</span>
                    </div>
                  ) : (
                    <span>Continue with code</span>
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
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
