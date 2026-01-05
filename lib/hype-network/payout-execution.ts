/**
 * Payout Execution Service - Process payout requests on-chain
 *
 * This service handles the automated execution of affiliate payouts:
 * - Single payout processing with on-chain transfer
 * - Batch processing for cron jobs
 * - Failed payout retry logic
 * - Treasury health monitoring
 */
import { prisma } from "@/lib/prisma";
import {
  executeDirectTransfer,
  hasSufficientBalance,
  getTreasuryBalance,
  canCoverPayoutBatch,
  isPayoutSystemConfigured,
} from "./payout-contract";

// Configuration
const BATCH_DELAY_MS = 2000; // Delay between transfers to avoid rate limiting
const MAX_RETRY_AGE_DAYS = 7; // Only retry payouts that failed within this period

export interface PayoutResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface BatchResult {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  totalAmountPaid: string;
  errors: Array<{ payoutId: string; error: string }>;
}

/**
 * Process a single payout request
 *
 * Flow:
 * 1. Validate payout exists and is PENDING
 * 2. Check treasury balance
 * 3. Update status to PROCESSING
 * 4. Execute on-chain transfer
 * 5. Update payout and commissions on success/failure
 */
export async function processPayout(payoutId: string): Promise<PayoutResult> {
  // Get payout with agent info
  const payout = await prisma.agentPayout.findUnique({
    where: { id: payoutId },
    include: {
      agent: {
        select: { id: true, agentTag: true },
      },
    },
  });

  if (!payout) {
    return { success: false, error: "Payout not found" };
  }

  if (payout.status !== "PENDING") {
    return {
      success: false,
      error: `Payout status is ${payout.status}, expected PENDING`,
    };
  }

  const amountEth = payout.amount.toString();

  // Check treasury balance before processing
  if (!(await hasSufficientBalance(amountEth))) {
    const { balanceEth } = await getTreasuryBalance();
    return {
      success: false,
      error: `Insufficient treasury balance. Required: ${amountEth} ETH, Available: ${balanceEth} ETH`,
    };
  }

  // Mark as processing - atomic update to prevent double processing
  const updateResult = await prisma.agentPayout.updateMany({
    where: {
      id: payoutId,
      status: "PENDING", // Only update if still pending
    },
    data: {
      status: "PROCESSING",
      processedAt: new Date(),
    },
  });

  if (updateResult.count === 0) {
    return {
      success: false,
      error: "Payout already being processed or completed",
    };
  }

  try {
    // Execute on-chain transfer
    const result = await executeDirectTransfer(payout.recipientAddress, amountEth);

    if (result.success && result.txHash) {
      // Update payout as completed
      await prisma.$transaction(async (tx) => {
        await tx.agentPayout.update({
          where: { id: payoutId },
          data: {
            status: "COMPLETED",
            txHash: result.txHash,
            completedAt: new Date(),
          },
        });

        // Update all linked commissions as paid
        await tx.affiliateCommission.updateMany({
          where: { payoutId: payoutId },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
      });

      console.log(
        `[Payout] Success: ${amountEth} ETH to ${payout.recipientAddress} ` +
          `(agent: ${payout.agent.agentTag}, tx: ${result.txHash})`
      );

      return { success: true, txHash: result.txHash };
    } else {
      // Transfer failed - revert to FAILED status
      await handlePayoutFailure(payoutId, result.error || "Transaction failed");
      return { success: false, error: result.error };
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await handlePayoutFailure(payoutId, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle payout failure - update status and revert commissions
 */
async function handlePayoutFailure(payoutId: string, reason: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.agentPayout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    // Revert commissions to approved status so they can be included in next payout
    await tx.affiliateCommission.updateMany({
      where: { payoutId: payoutId },
      data: {
        status: "APPROVED",
        payoutId: null,
      },
    });
  });

  console.error(`[Payout] Failed: ${payoutId} - ${reason}`);
}

/**
 * Process all pending payouts (for cron/admin automation)
 *
 * @param maxBatchSize - Maximum number of payouts to process in one run
 * @returns Batch processing results
 */
export async function processAllPendingPayouts(maxBatchSize: number = 20): Promise<BatchResult> {
  // Check if payout system is configured
  if (!isPayoutSystemConfigured()) {
    console.warn("[Payout] System not configured - skipping batch processing");
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      totalAmountPaid: "0",
      errors: [{ payoutId: "system", error: "Payout system not configured" }],
    };
  }

  // Get pending payouts ordered by request time (FIFO)
  const pendingPayouts = await prisma.agentPayout.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "asc" },
    take: maxBatchSize,
  });

  if (pendingPayouts.length === 0) {
    console.log("[Payout] No pending payouts to process");
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      totalAmountPaid: "0",
      errors: [],
    };
  }

  // Calculate total amount needed
  const totalRequired = pendingPayouts.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  // Check if treasury can cover all payouts
  const coverageCheck = await canCoverPayoutBatch(totalRequired.toString());

  const { balanceEth } = await getTreasuryBalance();
  console.log(
    `[Payout] Processing ${pendingPayouts.length} payouts. ` +
      `Total: ${totalRequired.toFixed(6)} ETH, Treasury: ${balanceEth} ETH`
  );

  if (!coverageCheck.canCover) {
    console.warn(
      `[Payout] Treasury may not cover all payouts. Shortfall: ${coverageCheck.shortfallEth} ETH`
    );
    // Continue anyway - process what we can
  }

  const results: BatchResult = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    totalAmountPaid: "0",
    errors: [],
  };

  let totalPaid = 0;

  for (const payout of pendingPayouts) {
    // Check balance before each payout
    if (!(await hasSufficientBalance(payout.amount.toString()))) {
      console.warn(
        `[Payout] Insufficient balance for payout ${payout.id} (${payout.amount} ETH) - skipping remaining`
      );
      results.skipped = pendingPayouts.length - results.processed;
      break;
    }

    const result = await processPayout(payout.id);
    results.processed++;

    if (result.success) {
      results.successful++;
      totalPaid += Number(payout.amount);
    } else {
      results.failed++;
      results.errors.push({
        payoutId: payout.id,
        error: result.error || "Unknown error",
      });
    }

    // Delay between payouts to avoid rate limiting and nonce issues
    if (results.processed < pendingPayouts.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  results.totalAmountPaid = totalPaid.toFixed(6);

  console.log(
    `[Payout] Batch complete: ${results.successful}/${results.processed} successful, ` +
      `${results.skipped} skipped. Total paid: ${results.totalAmountPaid} ETH`
  );

  return results;
}

/**
 * Retry recently failed payouts
 *
 * Only retries payouts that:
 * - Failed within the last MAX_RETRY_AGE_DAYS days
 * - Haven't been manually resolved
 *
 * @param maxRetries - Maximum number of payouts to retry
 * @returns Number of successfully retried payouts
 */
export async function retryFailedPayouts(maxRetries: number = 5): Promise<{
  attempted: number;
  successful: number;
  errors: Array<{ payoutId: string; error: string }>;
}> {
  const cutoffDate = new Date(Date.now() - MAX_RETRY_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Find recently failed payouts
  const failedPayouts = await prisma.agentPayout.findMany({
    where: {
      status: "FAILED",
      failedAt: { gte: cutoffDate },
    },
    orderBy: { failedAt: "asc" },
    take: maxRetries,
  });

  if (failedPayouts.length === 0) {
    console.log("[Payout] No failed payouts to retry");
    return { attempted: 0, successful: 0, errors: [] };
  }

  console.log(`[Payout] Retrying ${failedPayouts.length} failed payouts`);

  const result = {
    attempted: 0,
    successful: 0,
    errors: [] as Array<{ payoutId: string; error: string }>,
  };

  for (const payout of failedPayouts) {
    // Reset to pending for retry
    await prisma.agentPayout.update({
      where: { id: payout.id },
      data: {
        status: "PENDING",
        failureReason: null,
        failedAt: null,
        processedAt: null,
      },
    });

    result.attempted++;
    const processResult = await processPayout(payout.id);

    if (processResult.success) {
      result.successful++;
    } else {
      result.errors.push({
        payoutId: payout.id,
        error: processResult.error || "Unknown error",
      });
    }

    // Delay between retries
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }

  console.log(
    `[Payout] Retry complete: ${result.successful}/${result.attempted} successful`
  );

  return result;
}

/**
 * Get comprehensive treasury health status
 */
export async function getTreasuryHealth(): Promise<{
  balance: string;
  balanceWei: string;
  pendingPayouts: string;
  pendingCount: number;
  processingCount: number;
  isHealthy: boolean;
  coveragePercent: number;
  canProcessAll: boolean;
}> {
  const [balance, pendingAgg, processingCount] = await Promise.all([
    getTreasuryBalance(),
    prisma.agentPayout.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.agentPayout.count({
      where: { status: "PROCESSING" },
    }),
  ]);

  const pendingAmount = Number(pendingAgg._sum.amount || 0);
  const balanceNum = Number(balance.balanceEth);

  // Calculate coverage (how much of pending payouts can be covered)
  const coveragePercent =
    pendingAmount > 0 ? Math.round((balanceNum / pendingAmount) * 100) : 100;

  // Check if we can process all with gas buffer
  const canProcessAll =
    pendingAmount > 0
      ? balanceNum >= pendingAmount * 1.2 // 20% buffer for gas
      : true;

  return {
    balance: balance.balanceEth,
    balanceWei: balance.balanceWei,
    pendingPayouts: pendingAmount.toFixed(6),
    pendingCount: pendingAgg._count,
    processingCount,
    isHealthy: coveragePercent >= 100,
    coveragePercent,
    canProcessAll,
  };
}

/**
 * Get payout processing statistics
 */
export async function getPayoutStatistics(days: number = 30): Promise<{
  totalPayouts: number;
  totalAmountPaid: string;
  successRate: number;
  averageAmount: string;
  byStatus: Record<string, { count: number; amount: string }>;
}> {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalStats, statusBreakdown] = await Promise.all([
    prisma.agentPayout.aggregate({
      where: {
        completedAt: { gte: cutoffDate },
        status: "COMPLETED",
      },
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true },
    }),
    prisma.agentPayout.groupBy({
      by: ["status"],
      where: {
        requestedAt: { gte: cutoffDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  // Calculate success rate
  const totalAttempts = statusBreakdown.reduce((sum, s) => sum + s._count, 0);
  const completed = statusBreakdown.find((s) => s.status === "COMPLETED")?._count || 0;
  const successRate = totalAttempts > 0 ? Math.round((completed / totalAttempts) * 100) : 100;

  // Format status breakdown
  const byStatus: Record<string, { count: number; amount: string }> = {};
  for (const s of statusBreakdown) {
    byStatus[s.status] = {
      count: s._count,
      amount: (s._sum.amount?.toNumber() || 0).toFixed(6),
    };
  }

  return {
    totalPayouts: totalStats._count,
    totalAmountPaid: (totalStats._sum.amount?.toNumber() || 0).toFixed(6),
    successRate,
    averageAmount: (totalStats._avg.amount?.toNumber() || 0).toFixed(6),
    byStatus,
  };
}

/**
 * Cancel a stuck PROCESSING payout (admin action)
 * Use when a payout is stuck in PROCESSING without completing
 */
export async function cancelStuckPayout(
  payoutId: string,
  reason: string = "Manually cancelled - stuck in processing"
): Promise<void> {
  const payout = await prisma.agentPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  if (payout.status !== "PROCESSING") {
    throw new Error(`Cannot cancel payout in ${payout.status} status - only PROCESSING payouts can be cancelled`);
  }

  // Check if payout has been processing for too long (> 10 minutes suggests stuck)
  const processingTime = payout.processedAt
    ? Date.now() - payout.processedAt.getTime()
    : 0;
  const tenMinutes = 10 * 60 * 1000;

  if (processingTime < tenMinutes) {
    throw new Error(
      `Payout has only been processing for ${Math.round(processingTime / 1000)}s - wait at least 10 minutes before cancelling`
    );
  }

  await handlePayoutFailure(payoutId, reason);
  console.log(`[Payout] Cancelled stuck payout ${payoutId}: ${reason}`);
}
