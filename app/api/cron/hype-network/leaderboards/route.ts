/**
 * Cron endpoint for leaderboard snapshots
 *
 * Creates daily/weekly/monthly leaderboard snapshots for historical tracking.
 * - Daily: Runs every day at 00:05 UTC
 * - Weekly: Runs on Sundays
 * - Monthly: Runs on 1st of each month
 *
 * Schedule: Daily at 00:05 UTC (5 0 * * *)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("[Cron] Unauthorized leaderboard snapshot request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const results = { daily: 0, weekly: 0, monthly: 0 };

    // Get all active agents with their stats
    const agents = await prisma.hypeAgent.findMany({
      where: {
        isBanned: false,
      },
      select: {
        id: true,
        totalXp: true,
        totalReferrals: true,
        totalEarnings: true,
      },
    });

    // Calculate period earnings for each agent from XP logs
    const dailyXpGains = await prisma.agentXpLog.groupBy({
      by: ["agentId"],
      where: {
        createdAt: {
          gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      _sum: { amount: true },
    });
    const dailyXpMap = new Map(dailyXpGains.map((g) => [g.agentId, g._sum.amount || 0]));

    // Calculate period commissions for volume tracking
    const dailyCommissions = await prisma.affiliateCommission.groupBy({
      by: ["agentId"],
      where: {
        createdAt: {
          gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
      },
      _sum: { saleAmount: true },
      _count: { id: true },
    });
    const dailyVolumeMap = new Map(
      dailyCommissions.map((c) => [
        c.agentId,
        { volume: c._sum.saleAmount || new Decimal(0), count: c._count.id },
      ])
    );

    // Create daily snapshots
    for (const agent of agents) {
      const periodXp = dailyXpMap.get(agent.id) || 0;
      const periodData = dailyVolumeMap.get(agent.id) || {
        volume: new Decimal(0),
        count: 0,
      };

      await prisma.agentLeaderboard.upsert({
        where: {
          agentId_period_periodStart: {
            agentId: agent.id,
            period: "DAILY",
            periodStart: today,
          },
        },
        update: {
          xpEarned: periodXp,
          referrals: periodData.count,
          volume: periodData.volume,
          earnings: agent.totalEarnings,
        },
        create: {
          agentId: agent.id,
          period: "DAILY",
          periodStart: today,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          xpEarned: periodXp,
          referrals: periodData.count,
          volume: periodData.volume,
          earnings: agent.totalEarnings,
        },
      });
      results.daily++;
    }

    // Update daily ranks
    await updatePeriodRanks("DAILY", today);

    // Weekly snapshots (on Sundays)
    if (now.getDay() === 0) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);

      // Get weekly XP gains
      const weeklyXpGains = await prisma.agentXpLog.groupBy({
        by: ["agentId"],
        where: {
          createdAt: { gte: weekStart },
        },
        _sum: { amount: true },
      });
      const weeklyXpMap = new Map(weeklyXpGains.map((g) => [g.agentId, g._sum.amount || 0]));

      // Get weekly commissions
      const weeklyCommissions = await prisma.affiliateCommission.groupBy({
        by: ["agentId"],
        where: {
          createdAt: { gte: weekStart },
        },
        _sum: { saleAmount: true },
        _count: { id: true },
      });
      const weeklyVolumeMap = new Map(
        weeklyCommissions.map((c) => [
          c.agentId,
          { volume: c._sum.saleAmount || new Decimal(0), count: c._count.id },
        ])
      );

      for (const agent of agents) {
        const periodXp = weeklyXpMap.get(agent.id) || 0;
        const periodData = weeklyVolumeMap.get(agent.id) || {
          volume: new Decimal(0),
          count: 0,
        };

        await prisma.agentLeaderboard.upsert({
          where: {
            agentId_period_periodStart: {
              agentId: agent.id,
              period: "WEEKLY",
              periodStart: weekStart,
            },
          },
          update: {
            xpEarned: periodXp,
            referrals: periodData.count,
            volume: periodData.volume,
            earnings: agent.totalEarnings,
          },
          create: {
            agentId: agent.id,
            period: "WEEKLY",
            periodStart: weekStart,
            periodEnd: today,
            xpEarned: periodXp,
            referrals: periodData.count,
            volume: periodData.volume,
            earnings: agent.totalEarnings,
          },
        });
        results.weekly++;
      }

      await updatePeriodRanks("WEEKLY", weekStart);
    }

    // Monthly snapshots (on 1st of month)
    if (now.getDate() === 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get monthly XP gains
      const monthlyXpGains = await prisma.agentXpLog.groupBy({
        by: ["agentId"],
        where: {
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      });
      const monthlyXpMap = new Map(monthlyXpGains.map((g) => [g.agentId, g._sum.amount || 0]));

      // Get monthly commissions
      const monthlyCommissions = await prisma.affiliateCommission.groupBy({
        by: ["agentId"],
        where: {
          createdAt: { gte: monthStart },
        },
        _sum: { saleAmount: true },
        _count: { id: true },
      });
      const monthlyVolumeMap = new Map(
        monthlyCommissions.map((c) => [
          c.agentId,
          { volume: c._sum.saleAmount || new Decimal(0), count: c._count.id },
        ])
      );

      for (const agent of agents) {
        const periodXp = monthlyXpMap.get(agent.id) || 0;
        const periodData = monthlyVolumeMap.get(agent.id) || {
          volume: new Decimal(0),
          count: 0,
        };

        await prisma.agentLeaderboard.upsert({
          where: {
            agentId_period_periodStart: {
              agentId: agent.id,
              period: "MONTHLY",
              periodStart: monthStart,
            },
          },
          update: {
            xpEarned: periodXp,
            referrals: periodData.count,
            volume: periodData.volume,
            earnings: agent.totalEarnings,
          },
          create: {
            agentId: agent.id,
            period: "MONTHLY",
            periodStart: monthStart,
            periodEnd: today,
            xpEarned: periodXp,
            referrals: periodData.count,
            volume: periodData.volume,
            earnings: agent.totalEarnings,
          },
        });
        results.monthly++;
      }

      await updatePeriodRanks("MONTHLY", monthStart);
    }

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Leaderboard snapshots: ${results.daily} daily, ${results.weekly} weekly, ${results.monthly} monthly in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      daily: results.daily,
      weekly: results.weekly,
      monthly: results.monthly,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  } catch (error) {
    console.error("[Cron] Leaderboard snapshot cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Leaderboard snapshot failed",
      },
      { status: 500 }
    );
  }
}

/**
 * Update ranks for a specific period's leaderboard entries
 */
async function updatePeriodRanks(
  period: "DAILY" | "WEEKLY" | "MONTHLY",
  periodStart: Date
) {
  // Get all entries for this period sorted by XP
  const entries = await prisma.agentLeaderboard.findMany({
    where: {
      period,
      periodStart,
    },
    orderBy: [{ xpEarned: "desc" }, { referrals: "desc" }, { volume: "desc" }],
    select: {
      id: true,
      rank: true,
    },
  });

  // Update ranks in batch
  const updates = entries.map((entry, index) =>
    prisma.agentLeaderboard.update({
      where: { id: entry.id },
      data: {
        previousRank: entry.rank,
        rank: index + 1,
      },
    })
  );

  await prisma.$transaction(updates);
}
