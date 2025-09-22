import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // List of authenticated routes
  const authenticatedRoutes = [
    '/trade',
    '/play',
    '/p2p',
    '/marketplace',
    '/casual',
    '/launchpad',
    '/museum',
    '/studio'
  ];
  
  // Check if the current path is an authenticated route
  const isAuthenticatedRoute = authenticatedRoutes.some(route => pathname.startsWith(route));
  
  // For now, we'll let the client-side handle authentication
  // This is just to ensure proper routing structure
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).)',
  ],
};