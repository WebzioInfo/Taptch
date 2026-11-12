import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/brand';
import { Button } from '../components/ui/button';
import { signUp } from '../lib/auth/client';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Try again with a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C] px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#121216] border border-border/60 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <BrandLogo variant="symbol" size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Your TAPTCH Account</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Claim your digital business profile in seconds
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-9 pr-4 py-2.5 bg-[#18181D] border border-border/60 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@company.com"
                className="w-full pl-9 pr-4 py-2.5 bg-[#18181D] border border-border/60 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-[#18181D] border border-border/60 rounded-xl text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-black hover:bg-primary-hover font-semibold rounded-xl text-sm mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

