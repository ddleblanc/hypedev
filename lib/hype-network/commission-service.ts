/**
 * Commission Service - Earnings management and payouts for Hype Network
 */
import { prisma } from "@/lib/prisma";
import type { CommissionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Configuration constants
const COOLDOWN_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_PAYOUT_AMOUNT = 0.01; // 0.01 ETH minimum

export interface EarningsSummary {
  totalEarnings: string;
  pending: { amount: string; count: number };
  available: { amount: string; count: number };
  paid: { amount: string; count: number };
}

export interface CommissionHistoryItem {
  id: string;
  txHash: string;
  buyerAddress: string;
  saleAmount: string;
  commissionBps: number;
  multiplier: number;
  baseCommission: string;
  bonusCommission: string;
  totalCommission: string;
  xpAwarded: number;
  status: CommissionStatus;
  createdAt: Date;
  paidAt: Date | null;
  campaignName: string;
  linkCode: string;
}

export interface PayoutEligibility {
  canRequest: boolean;
  reason?: string;
  availableAmount: number;
}

/**
 * Get agent's earnings summary
 */
export async function getEarningsSummary(agentId: string): Promise<EarningsSummary> {
  const agent = await prisma.hypeAgent.findUnique({
    where: { id: agentId },
    select: { totalEarnings: true },
  });

  // Aggregate commission stats by status
  const stats = await prisma.affiliateCommission.groupBy({
    by: ["status"],
    where: { agentId },
    _sum: { totalCommission: true },
    _count: true,
  });

  const pending = stats.find((s) => s.status === "PENDING");
  const approved = stats.find((s) => s.status === "APPROVED");
  const paid = stats.find((s) => s.status === "PAID");

  return {
    totalEarnings: agent?.totalEarnings?.toString() || "0",
    pending: {
      amount: pending?._sum.totalCommission?.toString() || "0",
      count: pending?._count || 0,
    },
    available: {
      amount: approved?._sum.totalCommission?.toString() || "0",
      count: approved?._count || 0,
    },
    paid: {
      amount: paid?._sum.totalCommission?.toString() || "0",
      count: paid?._count || 0,
    },
  };
}

/**
 * Get commission history with pagination
 */
export async function getCommissionHistory(
  agentId: string,
  options?: {
    status?: CommissionStatus;
    limit?: number;
    cursor?: string;
  }
): Promise<{ items: CommissionHistoryItem[]; nextCursor: string | null }> {
  const { status, limit = 20, cursor } = options || {};

  const commissions = await prisma.affiliateCommission.findMany({
    where: {
      agentId,
      ...(status && { status }),
    },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      link: {
        select: {
          code: true,
          campaign: {
            select: { name: true },
          },
        },
      },
    },
  });

  const hasMore = commissions.length > limit;
  const items = hasMore ? commissions.slice(0, -1) : commissions;

  return {
    items: items.map((c) => ({
      id: c.id,
      txHash: c.txHash,
      buyerAddress: c.buyerAddress,
      saleAmount: c.saleAmount.toString(),
      commissionBps: c.commissionBps,
      multiplier: c.multiplier,
      baseCommission: c.baseCommission.toString(),
      bonusCommission: c.bonusCommission.toString(),
      totalCommission: c.totalCommission.toString(),
      xpAwarded: c.xpAwarded,
      status: c.status,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
      campaignName: c.link.campaign.name,
      linkCode: c.link.code,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/**
 * Process pending commissions (approve after cooldown)
 * Run via cron job daily
 */
export async function processCommissionApprovals(): Promise<number> {
  const cutoffDate = new Date(Date.now() - COOLDOWN_PERIOD_MS);

  const result = await prisma.affiliateCommission.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoffDate },
    },
    data: {
      status: "APPROVED",
    },
  });

  console.log(`[Commission] Approved ${result.count} commissions past cooldown period`);

  return result.count;
}

/**
 * Check if agent can request payout
 */
export async function canRequestPayout(agentId: string): Promise<PayoutEligibility> {
  // Check for pending payouts
  const pendingPayout = await prisma.agentPayout.findFirst({
    where: {
      agentId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  if (pendingPayout) {
    return {
      canRequest: false,
      reason: "You have a payout already in progress",
      availableAmount: 0,
    };
  }

  // Get available balance (sum of approved commissions)
  const available = await prisma.affiliateCommission.aggregate({
    where: {
      agentId,
      status: "APPROVED",
    },
    _sum: { totalCommission: true },
  });

  const availableAmount = Number(available._sum.totalCommission || 0);

  if (availableAmount < MIN_PAYOUT_AMOUNT) {
    return {
      canRequest: false,
      reason: `Minimum payout is ${MIN_PAYOUT_AMOUNT} ETH. You have ${availableAmount.toFixed(6)} ETH available.`,
      availableAmount,
    };
  }

  return { canRequest: true, availableAmount };
}

/**
 * Request payout - creates payout request and links commissions
 */
export async function requestPayout(
  agentId: string,
  recipientAddress: string
): Promise<string> {
  // Verify eligibility
  const check = await canRequestPayout(agentId);
  if (!check.canRequest) {
    throw new Error(check.reason);
  }

  // Create payout in transaction
  const payout = await prisma.$transaction(async (tx) => {
    // Get all approved commissions
    const commissions = await tx.affiliateCommission.findMany({
      where: {
        agentId,
        status: "APPROVED",
      },
      select: { id: true, totalCommission: true },
    });

    if (commissions.length === 0) {
      throw new Error("No approved commissions available for payout");
    }

    const totalAmount = commissions.reduce(
      (sum, c) => sum + Number(c.totalCommission),
      0
    );

    // Create payout record
    const newPayout = await tx.agentPayout.create({
      data: {
        agentId,
        amount: new Decimal(totalAmount),
        recipientAddress: recipientAddress.toLowerCase(),
        commissionCount: commissions.length,
      },
    });

    // Link commissions to payout and update status
    await tx.affiliateCommission.updateMany({
      where: {
        id: { in: commissions.map((c) => c.id) },
      },
      data: {
        status: "PROCESSING",
        payoutId: newPayout.id,
      },
    });

    return newPayout;
  });

  console.log(
    `[Commission] Payout requested: ${payout.id} for ${payout.amount} ETH (${payout.commissionCount} commissions)`
  );

  return payout.id;
}

/**
 * Process payout batch (called by admin/automation after on-chain tx)
 */
export async function processPayoutBatch(payoutId: string, txHash: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify payout exists and is in correct state
    const payout = await tx.agentPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    if (payout.status !== "PENDING" && payout.status !== "PROCESSING") {
      throw new Error(`Cannot process payout in ${payout.status} status`);
    }

    // Update payout to completed
    await tx.agentPayout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        txHash,
        processedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Update all linked commissions to PAID
    await tx.affiliateCommission.updateMany({
      where: { payoutId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  });

  console.log(`[Commission] Payout completed: ${payoutId} with tx ${txHash}`);
}

/**
 * Mark payout as failed and revert commissions
 */
export async function failPayout(payoutId: string, reason: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify payout exists
    const payout = await tx.agentPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    if (payout.status === "COMPLETED") {
      throw new Error("Cannot fail a completed payout");
    }

    // Update payout to failed
    await tx.agentPayout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureReason: reason,
      },
    });

    // Revert commissions to approved status
    await tx.affiliateCommission.updateMany({
      where: { payoutId },
      data: {
        status: "APPROVED",
        payoutId: null,
      },
    });
  });

  console.log(`[Commission] Payout failed: ${payoutId} - ${reason}`);
}

/**
 * Get payout history for an agent
 */
export async function getPayoutHistory(
  agentId: string,
  options?: { limit?: number; cursor?: string }
) {
  const { limit = 20, cursor } = options || {};

  const payouts = await prisma.agentPayout.findMany({
    where: { agentId },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      recipientAddress: true,
      txHash: true,
      status: true,
      commissionCount: true,
      requestedAt: true,
      completedAt: true,
      failedAt: true,
      failureReason: true,
    },
  });

  const hasMore = payouts.length > limit;
  const items = hasMore ? payouts.slice(0, -1) : payouts;

  return {
    items: items.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/**
 * Get pending payouts for admin processing
 */
export async function getPendingPayouts() {
  const payouts = await prisma.agentPayout.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
    },
    include: {
      agent: {
        select: {
          agentTag: true,
          agentName: true,
          user: {
            select: { username: true, walletAddress: true },
          },
        },
      },
    },
    orderBy: { requestedAt: "asc" },
  });

  return payouts.map((p) => ({
    id: p.id,
    amount: p.amount.toString(),
    currency: p.currency,
    recipientAddress: p.recipientAddress,
    status: p.status,
    commissionCount: p.commissionCount,
    requestedAt: p.requestedAt,
    agent: {
      tag: p.agent.agentTag,
      name: p.agent.agentName,
      username: p.agent.user.username,
      walletAddress: p.agent.user.walletAddress,
    },
  }));
}

/**
 * Get payout totals for analytics
 */
export async function getPayoutStats(agentId?: string) {
  const where = agentId ? { agentId } : {};

  const [totalPaid, pendingPayouts] = await Promise.all([
    prisma.agentPayout.aggregate({
      where: { ...where, status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.agentPayout.aggregate({
      where: { ...where, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalPaid: {
      amount: totalPaid._sum.amount?.toString() || "0",
      count: totalPaid._count,
    },
    pending: {
      amount: pendingPayouts._sum.amount?.toString() || "0",
      count: pendingPayouts._count,
    },
  };
}
