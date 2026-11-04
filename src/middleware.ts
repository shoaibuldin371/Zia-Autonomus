import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

export const runtime = 'experimental-edge';

const SESSION_COOKIE_NAME = 'growth_session';

// Strict Public Allowlist
const PUBLIC_PATHS = [
  '/login',
  '/privacy',
  '/terms',
  '/api/health',
  '/api/compliance/unsubscribe',
  '/api/auth/login', // Auth login endpoint itself
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/cron/')) return true; // Handled by cron-guard (Bearer/query secret verification)
  if (pathname.startsWith('/api/webhooks/')) return true;
  if (pathname === '/api/auth/gmail/callback') return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/public/')) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const tokenCookie = req.cookies.get(SESSION_COOKIE_NAME);
  const token = tokenCookie?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl, 307);
  }

  // Verify HS256 signature using jose in edge runtime
  const secretEnv = process.env.SESSION_SECRET;
  if (!secretEnv || secretEnv.trim().length === 0) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'SESSION_SECRET not configured' }, { status: 503 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'unconfigured');
    return NextResponse.redirect(loginUrl, 307);
  }

  try {
    const secretKey = new TextEncoder().encode(secretEnv);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (payload.email !== 'ziauldin371@gmail.com' || payload.role !== 'admin') {
      throw new Error('Forbidden session');
    }

    // Authorized
    return NextResponse.next();
  } catch {
    // Forged or expired cookie
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired session' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl, 307);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
