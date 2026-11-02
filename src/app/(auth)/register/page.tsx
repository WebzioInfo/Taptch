'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { signUp } from '@/lib/auth/client';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

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
        router.push('/dashboard');
      }
    } catch {
      setErrorMsg('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center font-bold text-xl text-primary mb-2">
            {brandConfig.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Your {brandConfig.name} Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Deploy your obsidian digital business card and join elite networks
          </p>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Registration
            </span>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Aditya Vikram"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Work Email Address
                </label>
                <Input
                  type="email"
                  required
                  placeholder="aditya@apexcapital.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Secure Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Launch Profile
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 flex flex-col space-y-3 text-center border-t border-border/40 mt-4">
            <div className="text-xs text-muted-foreground pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign In
              </Link>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" />
              <span>Free forever tier includes 1 digital profile with zero credit card needed</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

