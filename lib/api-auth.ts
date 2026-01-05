import { headers } from 'next/headers';

/**
 * Get authenticated address from middleware-set header
 *
 * Use this in API routes that are protected by middleware.
 * The middleware sets 'x-authenticated-address' header for authenticated requests.
 *
 * Note: This only works for routes covered by the middleware protection.
 * For routes not protected by middleware, use getAuthenticatedAddress() from thirdweb-auth.ts
 */
export async function getAuthFromMiddleware(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-authenticated-address');
}

/**
 * Require authentication from middleware
 * Throws an error if not authenticated
 *
 * Use in protected API routes for cleaner code:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const address = await requireAuthFromMiddleware();
 *   // proceed with authenticated logic
 * }
 * ```
 */
export async function requireAuthFromMiddleware(): Promise<string> {
  const address = await getAuthFromMiddleware();

  if (!address) {
    // This shouldn't happen if middleware is configured correctly
    // But we throw an error just in case
    throw new AuthFromMiddlewareError(
      'Authentication required - middleware header not found',
      401
    );
  }

  return address;
}

/**
 * Custom error for middleware auth failures
 */
export class AuthFromMiddlewareError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthFromMiddlewareError';
    this.status = status;
  }
}
