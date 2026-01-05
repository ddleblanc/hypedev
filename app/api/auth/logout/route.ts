import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rateLimitCheck } from "@/lib/rate-limit";
import { AUTH_COOKIE_NAME } from "@/lib/constants/auth";

/**
 * POST /api/auth/logout
 * Clear the auth cookie
 */
export async function POST(request: NextRequest) {
  // Rate limit auth operations
  const rateLimit = await rateLimitCheck(request, "auth");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error("Error logging out:", error);
    const response = NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}
