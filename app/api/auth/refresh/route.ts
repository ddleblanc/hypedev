import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, generateRefreshJWT } from "@/lib/thirdweb-auth";
import { auth } from "@/lib/auth";
import { rateLimitCheck } from "@/lib/rate-limit";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AUTH_TOKEN_MAX_AGE,
} from "@/lib/constants/auth";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponseWithRateLimit } from "@/lib/api-utils";
import { unauthorizedError, internalError, type AnyAppError } from "@/lib/errors";

/**
 * POST /api/auth/refresh
 * Issue a new JWT if the current one is valid but approaching expiry
 * This allows users to stay logged in indefinitely with activity
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimit = await rateLimitCheck(request, "auth");
  if (rateLimit.blocked) return rateLimit.response;

  // Get current token from cookie
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!currentToken) {
    return resultToResponseWithRateLimit(
      err(unauthorizedError("No token to refresh")),
      rateLimit
    );
  }

  // Verify current token is still valid
  const verifyResult = await ResultAsync.fromPromise(
    verifyJWT(currentToken),
    (e) => internalError("Token verification failed", e)
  );

  if (verifyResult.isErr()) {
    return resultToResponseWithRateLimit(
      err<never, AnyAppError>(verifyResult.error),
      rateLimit
    );
  }

  const { valid, address } = verifyResult.value;

  if (!valid || !address) {
    return resultToResponseWithRateLimit(
      err(unauthorizedError("Invalid or expired token")),
      rateLimit
    );
  }

  // Verify user still exists in database
  const userResult = await ResultAsync.fromPromise(
    auth.getUserByWallet(address),
    (e) => internalError("Failed to fetch user", e)
  );

  if (userResult.isErr()) {
    return resultToResponseWithRateLimit(
      err<never, AnyAppError>(userResult.error),
      rateLimit
    );
  }

  const user = userResult.value;

  if (!user) {
    return resultToResponseWithRateLimit(
      err(unauthorizedError("User not found")),
      rateLimit
    );
  }

  // Generate new JWT with fresh expiry
  // SECURITY: generateRefreshJWT requires prior verification (done above)
  const newJwtResult = await ResultAsync.fromPromise(
    generateRefreshJWT(address),
    (e) => internalError("Failed to generate new token", e)
  );

  if (newJwtResult.isErr()) {
    return resultToResponseWithRateLimit(
      err<never, AnyAppError>(newJwtResult.error),
      rateLimit
    );
  }

  // Set the new cookie with fresh expiry
  cookieStore.set(AUTH_COOKIE_NAME, newJwtResult.value, AUTH_COOKIE_OPTIONS);

  // Calculate new expiry time
  const expiresAt = new Date(Date.now() + AUTH_TOKEN_MAX_AGE * 1000);

  return resultToResponseWithRateLimit(
    ok({
      refreshed: true,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
      },
    }),
    rateLimit
  );
}
