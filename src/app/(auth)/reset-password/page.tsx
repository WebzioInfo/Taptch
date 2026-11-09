'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { ConfirmPasswordInput, PasswordStrengthMeter } from '@/components/ui/confirm-password-input';
import { FormField, FormLabel, FormError } from '@/components/ui/form-field';
import { LoadingButton } from '@/components/ui/loading-button';
import { resetPassword } from '@/lib/auth/client';
import { CheckCircle2, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ password?: string; confirmPassword?: string }>({});

  const validateForm = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      errors.password = 'Please enter a new password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) return;
    if (!token) {
      setErrorMsg('Password reset token is missing or expired. Please request a new link.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Failed to reset password. The link may have expired.');
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
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
            Create new password
          </h1>
          <p className="text-xs text-slate-500">
            Choose a strong, secure password for your account
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {!token ? (
              <div className="text-center space-y-3 py-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Invalid or missing link
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This password reset link is invalid or has expired. Please request a new reset email.
                </p>
                <div className="pt-2">
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Request new reset link</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="text-center space-y-3 py-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Password updated successfully
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your account password has been changed. You can now sign in with your new credentials.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 rounded-md transition-colors"
                  >
                    <span>Sign in to account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-red-700 text-xs border border-red-100 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-4">
                  <FormField>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="new-password" required>
                        New password
                      </FormLabel>
                      <span className="text-[11px] text-slate-400">At least 8 characters</span>
                    </div>
                    <PasswordInput
                      id="new-password"
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
                      autoFocus
                    />
                    <PasswordStrengthMeter password={password} />
                    <FormError>{fieldErrors.password}</FormError>
                  </FormField>

                  <FormField>
                    <FormLabel htmlFor="confirm-new-password" required>
                      Confirm new password
                    </FormLabel>
                    <ConfirmPasswordInput
                      id="confirm-new-password"
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
                    loadingText="Updating password..."
                    disabled={!password || !confirmPassword || password !== confirmPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors mt-2"
                  >
                    Set New Password
                  </LoadingButton>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}

