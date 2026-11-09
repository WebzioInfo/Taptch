import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySignedSessionCookie } from '@/lib/auth/cookie-verify';
import { createClient as createSupabaseClient } from '@/utils/supabase/middleware';

/**
 * Routes that strictly require an active authenticated user session.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/qr',
  '/cards',
  '/leads',
  '/team',
  '/builder',
  '/portal-x',
  '/admin',
  '/settings',
];

/**
 * Staff portal routes that require authentication (excluding /staff/login and /staff/assign).
 */
const STAFF_PROTECTED_PREFIXES = [
  '/staff/dashboard',
  '/staff/history',
];

/**
 * Authentication pages where already-authenticated users should be redirected to /dashboard.
 */
const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Production Dev Route Protection: Gate /dev/* in production
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/dev')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Extract Raw Session Cookie (Support HTTP development and HTTPS production secure cookie)
  const rawCookie =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    null;

  // 3. Cryptographic Verification of Session Cookie
  let isAuthenticated = false;

  // Test environment bypass strictly restricted to automated unit test environment (NODE_ENV === 'test')
  if (process.env.NODE_ENV === 'test') {
    const testHeader = request.headers.get('x-test-user-id');
    const isMockTestCookie = rawCookie && (rawCookie.startsWith('valid_test_') || rawCookie.startsWith('valid_secure_'));
    if (testHeader || isMockTestCookie) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated && rawCookie) {
    // Verify HMAC-SHA256 signature using BETTER_AUTH_SECRET
    const isCryptographicallyValid = await verifySignedSessionCookie(rawCookie);
    if (isCryptographicallyValid) {
      isAuthenticated = true;
    }
  }

  // 4. Protected Routes Gate: Intercept unauthenticated / forged requests before page hydration
  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    STAFF_PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Authenticated User on Auth Pages: Redirect to /dashboard
  const isAuthPage = AUTH_PAGES.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 6. Supabase Session Refresh: Maintain active Supabase session cookies
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      return createSupabaseClient(request);
    } catch {
      // Fallback to standard response if Supabase client refresh encounters edge error
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - dynamic redirect tokens (/dq/*, /q/*, /n/*)
     * - public digital profiles (/p/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, static assets
     */
    '/((?!api|_next/static|_next/image|dq|q|n|p|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
