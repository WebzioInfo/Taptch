'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth/client';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        throw new Error(res.error.message || 'Invalid email or password.');
      }

      router.replace('/staff/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-foreground flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex justify-center">
          <BrandLogo variant="symbol" size="lg" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Staff Field Portal</h1>
        <p className="text-xs text-neutral-400">Scan, assign, and activate dynamic physical QRs</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#121216] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs text-neutral-300">Staff Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="email"
                  required
                  placeholder="agent@tappzio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-neutral-300">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 text-xs bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs font-semibold gap-1.5 bg-primary text-black hover:bg-primary/90 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Scanner'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Authorized Field Staff Access Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

