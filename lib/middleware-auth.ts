import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants/auth';

/**
 * Result of middleware auth verification
 */
export interface MiddlewareAuthResult {
  authenticated: boolean;
  address: string | null;
  error: string | null;
}

/**
 * Verify JWT in middleware (Edge Runtime compatible)
 * Uses internal API call for guaranteed compatibility with Thirdweb's JWT verification
 */
export async function verifyAuthInMiddleware(
  request: NextRequest
): Promise<MiddlewareAuthResult> {
  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return {
        authenticated: false,
        address: null,
        error: 'no_token',
      };
    }

    // Call internal verify API
    // This adds ~50-100ms latency but guarantees compatibility
    const verifyUrl = new URL('/api/auth/verify', request.url);
    const response = await fetch(verifyUrl, {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
    });

    if (!response.ok) {
      return {
        authenticated: false,
        address: null,
        error: 'verification_failed',
      };
    }

    const data = await response.json();

    if (data.success && data.data?.loggedIn && data.data?.user) {
      return {
        authenticated: true,
        address: data.data.user.walletAddress.toLowerCase(),
        error: null,
      };
    }

    return {
      authenticated: false,
      address: null,
      error: data.data?.reason || 'not_logged_in',
    };
  } catch (error) {
    console.error('Middleware auth error:', error);
    return {
      authenticated: false,
      address: null,
      error: 'verification_error',
    };
  }
}

/**
 * Quick check if auth cookie exists (no verification)
 * Use this for performance-sensitive paths where actual verification
 * happens in the API route
 */
export function hasAuthCookie(request: NextRequest): boolean {
  return !!request.cookies.get(AUTH_COOKIE_NAME)?.value;
}
