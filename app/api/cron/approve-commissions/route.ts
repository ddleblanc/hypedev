/**
 * Cron endpoint for commission approval
 * Runs daily to approve commissions past the 7-day cooldown period
 */
import { NextRequest, NextResponse } from "next/server";
import { processCommissionApprovals } from "@/lib/hype-network/commission-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Unauthorized commission approval request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Process pending commissions past cooldown
    const approvedCount = await processCommissionApprovals();

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Commission approval completed: ${approvedCount} approved in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      approved: approvedCount,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Commission approval cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Commission approval failed",
      },
      { status: 500 }
    );
  }
}
