import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthInMiddleware, hasAuthCookie } from '@/lib/middleware-auth';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Routes that require authentication
 * Unauthenticated users will be redirected to /discover with redirect param
 */
const PROTECTED_ROUTES = [
  '/p2p',
  '/studio',
  '/home',
  '/control-center',
  '/profile',
  '/lists',
] as const;

/**
 * API routes that require authentication
 * Unauthenticated requests will receive 401 response
 */
const PROTECTED_API_ROUTES = [
  '/api/studio',
  '/api/marketplace/listings',
  '/api/marketplace/offers',
  '/api/marketplace/purchase',
  '/api/marketplace/auctions',
  '/api/marketplace/sweep',
  '/api/p2p',
  '/api/user/profile',
  '/api/user/apply-creator',
  '/api/lists',
  '/api/notifications',
] as const;

/**
 * Public routes that never require auth checks
 */
const PUBLIC_ROUTES = [
  '/',
  '/discover',
  '/api/auth',
  '/api/public',
  '/api/homepage',
  '/api/collections',
  '/api/search',
] as const;

/**
 * Routes that should be accessible only during onboarding
 */
const ONBOARDING_ROUTES = [
  '/signup',
] as const;

// ============================================================================
// Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.') // Files with extensions (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Skip auth for explicitly public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedPage = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const isProtectedAPI = PROTECTED_API_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
  const isOnboardingRoute = ONBOARDING_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  // If not a protected or onboarding route, allow through
  if (!isProtectedPage && !isProtectedAPI && !isOnboardingRoute) {
    return NextResponse.next();
  }

  // Quick check: if no cookie at all, fast fail
  if (!hasAuthCookie(request)) {
    if (isProtectedPage) {
      // Redirect to discover with return URL
      const url = new URL('/discover', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (isProtectedAPI) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Onboarding routes: allow unauthenticated access
    return NextResponse.next();
  }

  // Full verification for protected routes
  const auth = await verifyAuthInMiddleware(request);

  // Handle protected pages
  if (isProtectedPage) {
    if (!auth.authenticated) {
      // Redirect to discover with return URL
      const url = new URL('/discover', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Handle protected API routes
  if (isProtectedAPI) {
    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            reason: auth.error,
          },
        },
        { status: 401 }
      );
    }
  }

  // Handle onboarding routes
  if (isOnboardingRoute) {
    // Onboarding routes are accessible to users who are connected but not onboarded
    // The page itself will check if user needs onboarding
    // Just let them through if they have a valid token
  }

  // Add auth info to headers for downstream use
  const response = NextResponse.next();
  if (auth.address) {
    response.headers.set('x-authenticated-address', auth.address);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|.*\\..*).*)',
  ],
};
