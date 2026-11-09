'use client';

import * as React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormError } from '@/components/ui/form-field';
import { LoadingButton } from '@/components/ui/loading-button';
import { requestPasswordReset } from '@/lib/auth/client';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEmailError(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordReset({
        email: cleanEmail,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Unable to request password reset. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMsg('Failed to process request. Please check your network connection.');
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
            Reset your password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your email and we will send you a reset link
          </p>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xs rounded-lg overflow-hidden">
          <CardContent className="p-6 space-y-4">
            {submitted ? (
              <div className="text-center space-y-4 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Check your inbox
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    If an account is associated with <strong className="text-slate-700">{email}</strong>, a password reset link has been dispatched.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Return to sign in</span>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField>
                    <FormLabel htmlFor="forgot-email" required>
                      Email address
                    </FormLabel>
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="name@company.com"
                      className={`h-9 text-xs ${emailError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                      autoFocus
                    />
                    <FormError>{emailError}</FormError>
                  </FormField>

                  <LoadingButton
                    type="submit"
                    loading={loading}
                    loadingText="Sending reset link..."
                    disabled={!email}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 transition-colors"
                  >
                    Send reset instructions
                  </LoadingButton>
                </form>

                <div className="pt-2 text-center border-t border-slate-100">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to sign in</span>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

