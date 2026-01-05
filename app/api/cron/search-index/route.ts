import { NextRequest, NextResponse } from "next/server";
import { rebuildSearchIndex, getSearchIndexStats } from "@/lib/jobs/rebuild-search-index";

/**
 * GET /api/cron/search-index
 * Returns search index statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getSearchIndexStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[SearchIndex] Failed to get stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get search index stats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/search-index
 * Rebuilds the entire search index
 * Should be triggered via Vercel Cron (daily) or manually by admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if CRON_SECRET matches or in development
    const isDev = process.env.NODE_ENV === "development";
    const isAuthorized = isDev || (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("[SearchIndex] Starting rebuild via cron/API...");
    const result = await rebuildSearchIndex();

    return NextResponse.json({
      success: true,
      result,
      message: `Rebuilt search index: ${result.total} items indexed in ${result.duration}ms`,
    });
  } catch (error) {
    console.error("[SearchIndex] Rebuild failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
