/**
 * Cron: Process Affiliate Payouts
 *
 * POST /api/cron/hype-network/payouts
 *
 * Automatically processes pending payout requests on-chain.
 * Runs every 4 hours to batch payouts efficiently.
 *
 * Schedule: "0 *\/4 * * *" (every 4 hours)
 *
 * Requirements:
 * - PAYOUT_ADMIN_PRIVATE_KEY must be set
 * - Treasury wallet must have sufficient ETH balance
 * - CRON_SECRET must match for Vercel cron authentication
 */
import { NextRequest, NextResponse } from "next/server";
import {
  processAllPendingPayouts,
  getTreasuryHealth,
  retryFailedPayouts,
} from "@/lib/hype-network/payout-execution";
import { isPayoutSystemConfigured } from "@/lib/hype-network/payout-contract";

// Maximum payouts per cron run (conservative to stay within timeout limits)
const MAX_PAYOUTS_PER_RUN = 10;
const MAX_RETRIES_PER_RUN = 3;

/**
 * POST /api/cron/hype-network/payouts
 *
 * Process pending payouts automatically.
 * Requires sufficient treasury balance.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Cron:Payouts] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if payout system is configured
  if (!isPayoutSystemConfigured()) {
    console.warn("[Cron:Payouts] Payout system not configured - skipping");
    return NextResponse.json({
      success: false,
      error: "Payout system not configured. Set PAYOUT_ADMIN_PRIVATE_KEY.",
      duration: Date.now() - startTime,
    });
  }

  try {
    // Get treasury health status first
    const health = await getTreasuryHealth();

    if (health.pendingCount === 0) {
      console.log("[Cron:Payouts] No pending payouts to process");
      return NextResponse.json({
        success: true,
        message: "No pending payouts",
        duration: Date.now() - startTime,
        treasury: {
          balance: health.balance,
          pendingCount: 0,
        },
      });
    }

    // Log treasury status
    if (!health.isHealthy) {
      console.warn(
        `[Cron:Payouts] Treasury low: ${health.balance} ETH available, ` +
          `${health.pendingPayouts} ETH pending (${health.coveragePercent}% coverage)`
      );
    }

    // Process pending payouts
    const results = await processAllPendingPayouts(MAX_PAYOUTS_PER_RUN);

    // Optionally retry some failed payouts if we have capacity
    let retryResults = null;
    if (results.processed < MAX_PAYOUTS_PER_RUN && results.failed === 0) {
      retryResults = await retryFailedPayouts(MAX_RETRIES_PER_RUN);
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Cron:Payouts] Completed in ${duration}ms - ` +
        `Processed: ${results.processed}, Success: ${results.successful}, ` +
        `Failed: ${results.failed}, Skipped: ${results.skipped}, ` +
        `Paid: ${results.totalAmountPaid} ETH`
    );

    // Send detailed response
    return NextResponse.json({
      success: true,
      duration,
      results: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        totalAmountPaid: results.totalAmountPaid,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
      retries: retryResults
        ? {
            attempted: retryResults.attempted,
            successful: retryResults.successful,
            errors: retryResults.errors.length > 0 ? retryResults.errors : undefined,
          }
        : undefined,
      treasury: {
        balance: health.balance,
        pendingPayouts: health.pendingPayouts,
        pendingCount: health.pendingCount,
        processingCount: health.processingCount,
        coveragePercent: health.coveragePercent,
        isHealthy: health.isHealthy,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("[Cron:Payouts] Error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        duration,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
