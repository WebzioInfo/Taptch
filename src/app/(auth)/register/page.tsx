'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ConfirmPasswordInput, PasswordStrengthMeter } from '@/components/ui/confirm-password-input';
import { FormField, FormLabel, FormError } from '@/components/ui/form-field';
import { LoadingButton } from '@/components/ui/loading-button';
import { signUp } from '@/lib/auth/client';
import { AlertCircle } from 'lucide-react';
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
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const destination = getSafeRedirectUrl(templateParam, redirectParam);

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

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

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
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
              <FormField>
                <FormLabel htmlFor="name" required>
                  Full name
                </FormLabel>
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
                <FormError>{fieldErrors.name}</FormError>
              </FormField>

              <FormField>
                <FormLabel htmlFor="reg-email" required>
                  Email address
                </FormLabel>
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
                <FormError>{fieldErrors.email}</FormError>
              </FormField>

              <FormField>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="reg-password" required>
                    Password
                  </FormLabel>
                  <span className="text-[11px] text-slate-400">At least 8 characters</span>
                </div>
                <PasswordInput
                  id="reg-password"
                  required
                  minLength={8}
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={Boolean(fieldErrors.password)}
                />
                <PasswordStrengthMeter password={password} />
                <FormError>{fieldErrors.password}</FormError>
              </FormField>

              <FormField>
                <FormLabel htmlFor="reg-confirm-password" required>
                  Confirm password
                </FormLabel>
                <ConfirmPasswordInput
                  id="reg-confirm-password"
                  required
                  disabled={loading}
                  primaryPassword={password}
                  confirmPassword={confirmPassword}
                  onConfirmChange={(val) => {
                    setConfirmPassword(val);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  error={Boolean(fieldErrors.confirmPassword)}
                />
                <FormError>{fieldErrors.confirmPassword}</FormError>
              </FormField>

              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Creating account..."
                disabled={!name || !email || !password || !confirmPassword || password !== confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors mt-2"
              >
                Create Account
              </LoadingButton>
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
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}
