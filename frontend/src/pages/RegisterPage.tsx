import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/brand';
import { brandConfig } from '../config/brand';
import { Button } from '../components/ui/button';
import { signUp } from '../lib/auth/client';
import { env } from '../config/env';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err === 'google_not_configured') {
      setError('Google Sign-Up is awaiting credentials. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.');
    } else if (err === 'google_auth_failed') {
      setError('Google authorization was cancelled or failed. Please try again.');
    } else if (err === 'google_token_exchange_failed') {
      setError('Could not verify Google account. Please register with your email address.');
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp.email({ name: name.trim(), email: email.trim(), password });
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      navigate(redirectUrl);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Try again with a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-[var(--ink)] font-body px-4 py-12">
          <div className="w-full max-w-md p-8 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border)] shadow-sm">
            <div className="text-center mb-8">
                <div className="inline-block mb-3">
                  <BrandLogo variant="symbol" size="lg" />
                </div>
                  <h2 className="font-head text-2xl font-medium tracking-tight text-[var(--ink)]">
                    Create Your {brandConfig.name} Account
                  </h2>
                  <p className="font-body text-xs text-[var(--ink-muted)] mt-1.5">
                    Claim your digital business profile in seconds
                  </p>
              </div>

              {error && (
                  <div className="mb-6 p-3 rounded-[var(--radius-sm)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-start space-x-2 text-[var(--danger)] text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
        )}

                  {/* Google OAuth Quick Sign Up */}
                  <button
                    type="button"
                    onClick={() => {
                      const returnTo = typeof window !== 'undefined' ? window.location.origin : '';
                      window.location.href = `${env.apiUrl}/api/auth/oauth/google?returnTo=${encodeURIComponent(returnTo)}`;
                    }}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] hover:bg-[var(--bg-page)] text-[var(--ink)] font-medium text-xs border border-[var(--border)] transition-colors active:translate-y-[1px]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[var(--bg-raised)] px-2 text-[var(--ink-muted)] font-mono text-[10px]">
                          Or register with email
                        </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)]" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Aarav Sharma"
                            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            required
                          />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                          Work Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)]" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="aarav@company.com"
                            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            required
                          />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                          Password (min. 8 characters)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3 top-3 text-[var(--ink-muted)]" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm font-body text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            required
                          />
                        </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      variant="accent"
                      className="w-full py-2.5 font-medium rounded-[var(--radius-sm)] text-xs mt-2"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </form>

                    <p className="text-center text-xs text-[var(--ink-muted)] mt-8">
                      Already have an account?{' '}
                        <Link to="/login" className="text-[var(--accent-text)] font-medium hover:underline">
                          Sign In
                        </Link>
                    </p>
                </div>
    </div>
            );
}
