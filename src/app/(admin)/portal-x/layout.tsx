'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth/client';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalXLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  React.useEffect(() => {
    if (!isPending && session?.user) {
      const user = session.user as Record<string, unknown>;
      const role = (user.systemRole as string) || (user.role as string);
      if (role === 'sales_staff') {
        router.replace('/staff/dashboard');
      }
    }
  }, [session, isPending, router]);

  if (!isPending && session?.user) {
    const user = session.user as Record<string, unknown>;
    const role = (user.systemRole as string) || (user.role as string);
    if (role === 'sales_staff') {
      return (
        <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-white">403 Forbidden</h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-sm">
            Field sales staff accounts are not authorized to access Portal-X administration.
          </p>
          <Button
            variant="gold"
            size="sm"
            onClick={() => router.replace('/staff/dashboard')}
            className="mt-4 text-xs font-bold"
          >
            Go to Staff Dashboard
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
