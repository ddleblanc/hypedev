/**
 * Affiliate Link Redirect Route
 *
 * Handles /ref/[code] requests:
 * 1. Tracks the click
 * 2. Sets attribution cookie
 * 3. Redirects to target (collection or lootbox)
 */
import { NextRequest, NextResponse } from "next/server";
import { trackClick } from "@/lib/hype-network/link-service";
import { setAttributionCookie } from "@/lib/hype-network/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /ref/[code]
 * Process affiliate link click and redirect
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Validate code format
  if (!code || code.length < 4 || code.length > 32) {
    console.log(`[Ref] Invalid code format: ${code}`);
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Extract visitor info from request
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || undefined;

    // Track the click
    const result = await trackClick(code, { ip, userAgent, referrer });

    if (!result) {
      // Invalid or inactive link - redirect to home
      console.log(`[Ref] Link not found or inactive: ${code}`);
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Set attribution cookie for conversion tracking
    await setAttributionCookie({
      linkId: result.linkId,
      agentId: result.agentId,
      campaignId: result.campaignId,
      code: code.toUpperCase(),
    });

    console.log(`[Ref] Redirect: ${code} -> ${result.redirectTo}`);

    // Redirect to target page
    return NextResponse.redirect(new URL(result.redirectTo, request.url));
  } catch (error) {
    console.error("[Ref] Error processing affiliate link:", error);

    // On error, redirect to home gracefully
    return NextResponse.redirect(new URL("/", request.url));
  }
}
