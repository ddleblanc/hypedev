/**
 * Cron endpoint for collection price snapshots
 * Runs hourly via Vercel Cron
 */
import { NextRequest, NextResponse } from "next/server";
import { takeCollectionSnapshots, cleanupOldSnapshots } from "@/lib/jobs/collection-snapshots";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Unauthorized snapshot request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Take snapshots
    const result = await takeCollectionSnapshots();

    // Cleanup old snapshots (once per run is fine, idempotent)
    const cleaned = await cleanupOldSnapshots();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      snapshots: {
        succeeded: result.succeeded,
        failed: result.failed,
        total: result.total,
      },
      cleanedUp: cleaned,
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Snapshot cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Snapshot job failed",
      },
      { status: 500 }
    );
  }
}
