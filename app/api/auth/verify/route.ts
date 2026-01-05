import { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/thirdweb-auth";
import { auth } from "@/lib/auth";
import { rateLimitCheck } from "@/lib/rate-limit";
import { AUTH_REFRESH_THRESHOLD } from "@/lib/constants/auth";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponseWithRateLimit } from "@/lib/api-utils";
import { internalError, type AnyAppError } from "@/lib/errors";

/**
 * GET /api/auth/verify
 * Check if user is logged in and return their info with session expiry
 */
export async function GET(request: NextRequest) {
  // Rate limit by IP/wallet
  const rateLimit = await rateLimitCheck(request, "auth");
  if (rateLimit.blocked) return rateLimit.response;

  // Get authenticated session (address + expiry) from JWT
  const sessionResult = await ResultAsync.fromPromise(
    getAuthenticatedSession(),
    (e) => internalError("Failed to verify authentication", e)
  );

  if (sessionResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(sessionResult.error), rateLimit);
  }

  const session = sessionResult.value;
  const jwtAddress = session?.address ?? null;
  const expiresAt = session?.expiresAt ?? null;

  // Optional: Get connected address for mismatch validation
  const connectedAddress = request.nextUrl.searchParams.get("address")?.toLowerCase();

  // Not logged in (no JWT)
  if (!jwtAddress) {
    return resultToResponseWithRateLimit(
      ok({
        loggedIn: false,
        user: null,
        reason: "no_jwt",
      }),
      rateLimit
    );
  }

  // If connected address provided, check for mismatch
  if (connectedAddress && jwtAddress !== connectedAddress) {
    // Log for monitoring (helps identify wallet switching issues)
    console.warn(
      `Auth mismatch: JWT address ${jwtAddress} != connected address ${connectedAddress}`
    );

    // Report the mismatch - let client handle clearing the cookie
    return resultToResponseWithRateLimit(
      ok({
        loggedIn: false,
        user: null,
        reason: "address_mismatch",
        jwtAddress, // For debugging
      }),
      rateLimit
    );
  }

  // Get user from database
  const userResult = await ResultAsync.fromPromise(
    auth.getUserByWallet(jwtAddress),
    (e) => internalError("Failed to get user", e)
  );

  if (userResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(userResult.error), rateLimit);
  }

  const user = userResult.value;

  // User not found in database
  if (!user) {
    return resultToResponseWithRateLimit(
      ok({
        loggedIn: false,
        user: null,
        reason: "user_not_found",
      }),
      rateLimit
    );
  }

  // Calculate session info
  const sessionInfo = expiresAt
    ? {
        expiresAt: expiresAt.toISOString(),
        // Calculate when client should refresh (threshold before expiry)
        refreshBefore: new Date(
          expiresAt.getTime() - AUTH_REFRESH_THRESHOLD * 1000
        ).toISOString(),
      }
    : null;

  // Return user info with session details
  return resultToResponseWithRateLimit(
    ok({
      loggedIn: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileCompleted: user.profileCompleted,
        isCreator: user.isCreator,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        bio: user.bio,
        creatorAppliedAt: user.creatorAppliedAt,
        creatorApprovedAt: user.creatorApprovedAt,
        socials: user.socials,
      },
      session: sessionInfo,
    }),
    rateLimit
  );
}
