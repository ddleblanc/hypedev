/**
 * Cron endpoint for campaign status lifecycle management
 *
 * Updates campaign statuses based on dates:
 * - SCHEDULED → ACTIVE when startAt is reached
 * - ACTIVE → ENDED when endAt is reached
 * - ACTIVE → PAUSED when budget is exhausted
 *
 * Schedule: Every hour (0 * * * *)
 */
import { NextRequest, NextResponse } from "next/server";
import { updateCampaignStatuses } from "@/lib/hype-network/campaign-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Unauthorized campaign status request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Update campaign statuses
    const result = await updateCampaignStatuses();

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Campaign status update completed: ${result.activated} activated, ${result.ended} ended, ${result.paused} paused in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      activated: result.activated,
      ended: result.ended,
      paused: result.paused,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Campaign status cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Campaign status update failed",
      },
      { status: 500 }
    );
  }
}
