/**
 * Admin API for managing affiliate payouts
 *
 * GET - List pending payouts with treasury health
 * POST - Process payouts (manual or automated on-chain)
 *
 * Supports both:
 * - Manual processing: Admin sends ETH manually, then marks complete/fail
 * - Automated processing: System executes on-chain transfers directly
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";
import { getAuthenticatedAddress } from "@/lib/thirdweb-auth";
import {
  getPendingPayouts,
  processPayoutBatch,
  failPayout,
  getPayoutStats,
} from "@/lib/hype-network/commission-service";
import {
  processPayout,
  processAllPendingPayouts,
  retryFailedPayouts,
  getTreasuryHealth,
  getPayoutStatistics,
  cancelStuckPayout,
} from "@/lib/hype-network/payout-execution";
import {
  getPayoutSystemStatus,
  isPayoutSystemConfigured,
} from "@/lib/hype-network/payout-contract";

// Admin wallets - should be in env vars in production
const ADMIN_WALLETS = (process.env.ADMIN_WALLET_ADDRESSES || "")
  .split(",")
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean);

// Admin API key for server-to-server calls
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Check if the request is from an admin
 */
async function requireAdmin(
  request: NextRequest
): Promise<{ error: string; status: number } | { address: string }> {
  // Check for API key (server-to-server)
  const apiKey = request.headers.get("x-admin-key");
  if (apiKey && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    return { address: "api-key-admin" };
  }

  // Check for wallet-based admin
  try {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return { error: "Unauthorized", status: 401 };
    }

    const normalizedAddress = address.toLowerCase();
    if (!ADMIN_WALLETS.includes(normalizedAddress)) {
      return { error: "Forbidden - Admin access required", status: 403 };
    }

    return { address: normalizedAddress };
  } catch {
    return { error: "Unauthorized", status: 401 };
  }
}

// =============================================================================
// GET - List pending payouts with treasury health
// =============================================================================

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  // Rate limit
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    // Fetch all data in parallel
    const [payouts, stats, systemStatus, payoutStatistics] = await Promise.all([
      getPendingPayouts(),
      getPayoutStats(),
      getPayoutSystemStatus(),
      getPayoutStatistics(30), // Last 30 days
    ]);

    // Get treasury health if system is configured
    let treasury = null;
    if (systemStatus.configured) {
      treasury = await getTreasuryHealth();
    }

    return NextResponse.json({
      success: true,
      data: {
        payouts,
        stats,
        treasury,
        system: systemStatus,
        statistics: payoutStatistics,
      },
    });
  } catch (error) {
    console.error("[Admin] Error listing payouts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Process payout actions
// =============================================================================

const ProcessPayoutSchema = z.discriminatedUnion("action", [
  // Manual completion - admin already sent ETH
  z.object({
    action: z.literal("complete"),
    payoutId: z.string().uuid(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  }),
  // Manual failure
  z.object({
    action: z.literal("fail"),
    payoutId: z.string().uuid(),
    failureReason: z.string().max(500).optional(),
  }),
  // Automated: Process single payout on-chain
  z.object({
    action: z.literal("process-single"),
    payoutId: z.string().uuid(),
  }),
  // Automated: Process all pending payouts
  z.object({
    action: z.literal("process-all"),
    maxBatchSize: z.number().min(1).max(50).optional(),
  }),
  // Automated: Retry failed payouts
  z.object({
    action: z.literal("retry-failed"),
    maxRetries: z.number().min(1).max(20).optional(),
  }),
  // Cancel stuck PROCESSING payout
  z.object({
    action: z.literal("cancel-stuck"),
    payoutId: z.string().uuid(),
    reason: z.string().max(500).optional(),
  }),
]);

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  // Rate limit write operations
  const rateLimit = await rateLimitCheck(request, "apiWrite");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const body = await request.json();
    const parsed = ProcessPayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    switch (data.action) {
      // =========================================================================
      // Manual: Mark payout as completed (admin already sent ETH)
      // =========================================================================
      case "complete": {
        await processPayoutBatch(data.payoutId, data.txHash);

        console.log(
          `[Admin] Payout ${data.payoutId} completed with tx ${data.txHash} by ${adminCheck.address}`
        );

        return NextResponse.json({
          success: true,
          data: {
            payoutId: data.payoutId,
            status: "COMPLETED",
            txHash: data.txHash,
          },
        });
      }

      // =========================================================================
      // Manual: Mark payout as failed
      // =========================================================================
      case "fail": {
        const reason = data.failureReason || "Payout failed - no reason provided";
        await failPayout(data.payoutId, reason);

        console.log(
          `[Admin] Payout ${data.payoutId} failed: ${reason} by ${adminCheck.address}`
        );

        return NextResponse.json({
          success: true,
          data: {
            payoutId: data.payoutId,
            status: "FAILED",
            failureReason: reason,
          },
        });
      }

      // =========================================================================
      // Automated: Process single payout on-chain
      // =========================================================================
      case "process-single": {
        if (!isPayoutSystemConfigured()) {
          return NextResponse.json(
            {
              success: false,
              error: "Payout system not configured. Set PAYOUT_ADMIN_PRIVATE_KEY.",
            },
            { status: 400 }
          );
        }

        const result = await processPayout(data.payoutId);

        console.log(
          `[Admin] Auto-processed payout ${data.payoutId}: ` +
            `${result.success ? `success (tx: ${result.txHash})` : `failed (${result.error})`} ` +
            `by ${adminCheck.address}`
        );

        return NextResponse.json({
          success: result.success,
          data: {
            payoutId: data.payoutId,
            txHash: result.txHash,
            error: result.error,
          },
        });
      }

      // =========================================================================
      // Automated: Process all pending payouts
      // =========================================================================
      case "process-all": {
        if (!isPayoutSystemConfigured()) {
          return NextResponse.json(
            {
              success: false,
              error: "Payout system not configured. Set PAYOUT_ADMIN_PRIVATE_KEY.",
            },
            { status: 400 }
          );
        }

        const batchSize = data.maxBatchSize ?? 20;
        const results = await processAllPendingPayouts(batchSize);

        console.log(
          `[Admin] Batch processed ${results.processed} payouts: ` +
            `${results.successful} success, ${results.failed} failed, ${results.skipped} skipped ` +
            `by ${adminCheck.address}`
        );

        return NextResponse.json({
          success: true,
          data: {
            processed: results.processed,
            successful: results.successful,
            failed: results.failed,
            skipped: results.skipped,
            totalAmountPaid: results.totalAmountPaid,
            errors: results.errors.length > 0 ? results.errors : undefined,
          },
        });
      }

      // =========================================================================
      // Automated: Retry failed payouts
      // =========================================================================
      case "retry-failed": {
        if (!isPayoutSystemConfigured()) {
          return NextResponse.json(
            {
              success: false,
              error: "Payout system not configured. Set PAYOUT_ADMIN_PRIVATE_KEY.",
            },
            { status: 400 }
          );
        }

        const maxRetries = data.maxRetries ?? 5;
        const results = await retryFailedPayouts(maxRetries);

        console.log(
          `[Admin] Retried ${results.attempted} failed payouts: ` +
            `${results.successful} success by ${adminCheck.address}`
        );

        return NextResponse.json({
          success: true,
          data: {
            attempted: results.attempted,
            successful: results.successful,
            errors: results.errors.length > 0 ? results.errors : undefined,
          },
        });
      }

      // =========================================================================
      // Cancel stuck PROCESSING payout
      // =========================================================================
      case "cancel-stuck": {
        const reason = data.reason || "Manually cancelled - stuck in processing";

        try {
          await cancelStuckPayout(data.payoutId, reason);

          console.log(
            `[Admin] Cancelled stuck payout ${data.payoutId}: ${reason} by ${adminCheck.address}`
          );

          return NextResponse.json({
            success: true,
            data: {
              payoutId: data.payoutId,
              status: "FAILED",
              reason,
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: error instanceof Error ? error.message : "Failed to cancel payout",
            },
            { status: 400 }
          );
        }
      }

      default: {
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("[Admin] Error processing payout:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
