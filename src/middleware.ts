import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
const AUTH_PAGES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Production Dev Route Protection: Gate /dev/* in production
  if (process.env.NODE_ENV === 'production' && pathname.startsWith('/dev')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Extract Session Token (Support HTTP development and HTTPS production secure cookie)
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_AUTH === 'true'
      ? request.headers.get('x-test-user-id')
      : null);

  const isAuthenticated = Boolean(sessionToken);

  // 3. Protected Routes Gate
  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    STAFF_PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated User on Auth Pages: Redirect to /dashboard
  const isAuthPage = AUTH_PAGES.some((authPath) => pathname === authPath || pathname.startsWith(`${authPath}/`));
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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

