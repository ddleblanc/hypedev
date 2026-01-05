import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/lootboxes/stats/global - Get global lootbox statistics
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    // Get total openings count
    const totalOpeningsPromise = prisma.lootboxOpening.count({
      where: { fulfilled: true },
    });

    // Get total unique openers
    const uniqueOpenersPromise = prisma.lootboxOpening.findMany({
      where: { fulfilled: true },
      select: { userId: true },
      distinct: ["userId"],
    });

    // Get total value won (from LootboxOpening.totalValueAtOpen)
    const totalValuePromise = prisma.lootboxOpening.aggregate({
      where: {
        fulfilled: true,
        totalValueAtOpen: { not: null },
      },
      _sum: { totalValueAtOpen: true },
    });

    // Get rarity distribution
    const rarityDistributionPromise = prisma.lootboxOpening.groupBy({
      by: ["bestRarityTier"],
      where: {
        fulfilled: true,
        bestRarityTier: { not: null },
      },
      _count: { id: true },
    });

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOpeningsPromise = prisma.lootboxOpening.count({
      where: {
        fulfilled: true,
        fulfilledAt: { gte: todayStart },
      },
    });

    // Get active lootboxes count
    const activeLootboxesPromise = prisma.lootbox.count({
      where: {
        isActive: true,
        remainingSupply: { gt: 0 },
      },
    });

    // Get biggest wins (top 5 by value)
    const biggestWinsPromise = prisma.lootboxOpening.findMany({
      where: {
        fulfilled: true,
        totalValueAtOpen: { not: null },
      },
      orderBy: { totalValueAtOpen: "desc" },
      take: 5,
      select: {
        totalValueAtOpen: true,
        fulfilledAt: true,
        bestRarityTier: true,
        rewardsCount: true,
        user: {
          select: {
            username: true,
            walletAddress: true,
            profilePicture: true,
          },
        },
        reward: {
          select: {
            name: true,
            image: true,
            rarity: true,
          },
        },
        openingRewards: {
          select: {
            reward: {
              select: {
                name: true,
                image: true,
                rarity: true,
              },
            },
          },
          take: 1,
          orderBy: { rewardIndex: "asc" },
        },
      },
    });

    // Execute all queries in parallel
    const [
      totalOpenings,
      uniqueOpeners,
      totalValue,
      rarityDistribution,
      todayOpenings,
      activeLootboxes,
      biggestWins,
    ] = await Promise.all([
      totalOpeningsPromise,
      uniqueOpenersPromise,
      totalValuePromise,
      rarityDistributionPromise,
      todayOpeningsPromise,
      activeLootboxesPromise,
      biggestWinsPromise,
    ]);

    // Format rarity distribution
    const rarityStats = rarityDistribution.reduce(
      (acc, item) => {
        if (item.bestRarityTier) {
          acc[item.bestRarityTier] = item._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Format biggest wins - support multi-reward
    const formattedBiggestWins = biggestWins.map((win) => {
      // Get best reward from openingRewards or legacy reward
      const primaryReward = win.openingRewards[0]?.reward || win.reward;
      return {
        value: win.totalValueAtOpen ? Number(win.totalValueAtOpen) : null,
        rarity: win.bestRarityTier || primaryReward?.rarity,
        rewardsCount: win.rewardsCount,
        wonAt: win.fulfilledAt,
        user: {
          displayName:
            win.user.username ||
            `${win.user.walletAddress.slice(0, 6)}...${win.user.walletAddress.slice(-4)}`,
          avatar: win.user.profilePicture,
        },
        reward: primaryReward
          ? {
              name: primaryReward.name,
              image: primaryReward.image,
              rarity: primaryReward.rarity,
            }
          : null,
      };
    });

    // Calculate lucky rate (rare+ drops / total)
    const rareOrBetter =
      (rarityStats.rare || 0) +
      (rarityStats.epic || 0) +
      (rarityStats.mythic || 0) +
      (rarityStats.cosmic || 0);
    const luckyRate =
      totalOpenings > 0
        ? Math.round((rareOrBetter / totalOpenings) * 10000) / 100
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalOpenings,
        uniqueOpeners: uniqueOpeners.length,
        totalValueWon: totalValue._sum.totalValueAtOpen
          ? Number(totalValue._sum.totalValueAtOpen)
          : 0,
        todayOpenings,
        activeLootboxes,
        luckyRate, // Percentage of rare+ drops
        rarityDistribution: {
          common: rarityStats.common || 0,
          rare: rarityStats.rare || 0,
          epic: rarityStats.epic || 0,
          mythic: rarityStats.mythic || 0,
          cosmic: rarityStats.cosmic || 0,
        },
        biggestWins: formattedBiggestWins,
      },
      // Cache hint for client
      cacheHint: {
        maxAge: 30, // Cache for 30 seconds
        staleWhileRevalidate: 60,
      },
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch global stats" },
      { status: 500 }
    );
  }
}
