import { NextRequest, NextResponse } from "next/server";
import { generateLoginPayload, verifyLoginPayload, LoginPayload } from "@/lib/thirdweb-auth";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rate-limit";

// Use __Host- prefix for enhanced security (requires Secure, Path=/, no Domain)
const AUTH_COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-tw_auth_token"
  : "tw_auth_token";

// Cookie expiration: 24 hours (shorter than 7 days for better security)
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Helper to create rate limit error response
 */
function rateLimitResponse(resetTime: number) {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * GET /api/auth/login?address=0x...
 * Generate a login payload for the wallet to sign
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`login-payload:${clientIP}`, rateLimiters.loginPayload);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const address = request.nextUrl.searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const payload = await generateLoginPayload(address);

    return NextResponse.json({
      success: true,
      payload,
    });
  } catch (error) {
    console.error("Error generating login payload:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate login payload" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/login
 * Verify the signed payload and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (stricter for verification)
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`login-verify:${clientIP}`, rateLimiters.loginVerify);
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const payload = body.payload as LoginPayload;
    const signature = body.signature as string;

    if (!payload || !signature) {
      return NextResponse.json(
        { success: false, error: "Payload and signature are required" },
        { status: 400 }
      );
    }

    // Verify the signature and get JWT
    const result = await verifyLoginPayload(payload, signature);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Find or create user in our database
    const user = await auth.findOrCreateUser(result.address);

    // Set the JWT cookie with enhanced security settings
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";
    cookieStore.set(AUTH_COOKIE_NAME, result.jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      // Note: Don't set domain when using __Host- prefix (required by spec)
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileCompleted: user.profileCompleted,
        isCreator: user.isCreator,
        profilePicture: user.profilePicture,
      },
      requiresOnboarding: !user.profileCompleted,
      isNewUser: user.isNewUser,
      // Include warning if email couldn't be saved
      ...(user.emailWarning && { warning: user.emailWarning }),
    });
  } catch (error) {
    console.error("Error verifying login:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify login" },
      { status: 500 }
    );
  }
}
