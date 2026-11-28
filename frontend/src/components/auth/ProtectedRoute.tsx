import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSession, getAuthState, useAuthSync } from '../../lib/auth/client';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

  export function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
    const location = useLocation();
    const { data: session, isPending } = useSession();

    useAuthSync();

    const authState = getAuthState(session, isPending);

    if (authState === 'INITIALIZING') {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
          <Loader2 className="w-7 h-7 text-[#FF6A00] animate-spin mb-2" />
          <p className="text-xs font-medium text-[#666666]">Verifying session...</p>
        </div>
      );
    }

    if (authState === 'UNAUTHENTICATED') {
      // Strip OAuth callback parameters so auth_code is never nested inside ?redirect=
      const params = new URLSearchParams(location.search);
      const hadAuthCode = params.has('auth_code');
      params.delete('auth_code');
      params.delete('session_token');
      const cleanSearch = params.toString();
      const returnTo = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`;
      const loginUrl = hadAuthCode
        ? `/login?error=oauth_exchange_failed&redirect=${encodeURIComponent(returnTo)}`
        : `/login?redirect=${encodeURIComponent(returnTo)}`;
      return <Navigate to={loginUrl} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (session as any)?.user?.systemRole || 'user';
      if (!allowedRoles.includes(userRole)) {
        return <Navigate to={redirectTo} replace />;
      }
    }

    return children ? <>{children}</> : <Outlet />;
  }
