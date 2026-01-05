/**
 * Cron endpoint for streak expiration checks
 *
 * Resets streaks for agents who haven't had activity
 * within the grace period (36 hours).
 *
 * Schedule: Daily at 06:00 UTC (0 6 * * *)
 */
import { NextRequest, NextResponse } from "next/server";
import { checkBrokenStreaks } from "@/lib/hype-network/streak-service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Unauthorized streak check request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Check and reset broken streaks
    const resetCount = await checkBrokenStreaks();

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Streak check completed: ${resetCount} streaks reset in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      streaksReset: resetCount,
      graceHours: 36,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Streak check cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Streak check failed",
      },
      { status: 500 }
    );
  }
}
