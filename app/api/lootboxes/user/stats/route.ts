import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  address: z.string().min(1),
});

// GET /api/lootboxes/user/stats?address=0x... - Get user's lootbox statistics
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryResult = querySchema.safeParse({
      address: searchParams.get("address"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid address parameter" },
        { status: 400 }
      );
    }

    const { address } = queryResult.data;
    const normalizedAddress = address.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        walletAddress: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's lootbox stats (create if doesn't exist)
    let stats = await prisma.userLootboxStats.findUnique({
      where: { userId: user.id },
    });

    // If no stats record exists, calculate from openings
    if (!stats) {
      // Calculate stats from openings
      const openings = await prisma.lootboxOpening.findMany({
        where: {
          userId: user.id,
          fulfilled: true,
        },
        select: {
          bestRarityTier: true,
          totalValueAtOpen: true,
          fulfilledAt: true,
        },
      });

      const rarityCounts = openings.reduce(
        (acc, o) => {
          if (o.bestRarityTier) {
            acc[o.bestRarityTier] = (acc[o.bestRarityTier] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Find best drop
      let bestDropRarity: string | null = null;
      let bestDropValue: number | null = null;
      const rarityOrder = ["common", "rare", "epic", "mythic", "cosmic"];

      for (const opening of openings) {
        if (opening.bestRarityTier) {
          const currentRank = rarityOrder.indexOf(opening.bestRarityTier);
          const bestRank = bestDropRarity
            ? rarityOrder.indexOf(bestDropRarity)
            : -1;
          if (currentRank > bestRank) {
            bestDropRarity = opening.bestRarityTier;
            bestDropValue = opening.totalValueAtOpen
              ? Number(opening.totalValueAtOpen)
              : null;
          }
        }
      }

      // Create stats record
      stats = await prisma.userLootboxStats.create({
        data: {
          userId: user.id,
          totalOpened: openings.length,
          commonDrops: rarityCounts.common || 0,
          rareDrops: rarityCounts.rare || 0,
          epicDrops: rarityCounts.epic || 0,
          mythicDrops: rarityCounts.mythic || 0,
          cosmicDrops: rarityCounts.cosmic || 0,
          bestDropRarity,
          bestDropValue: bestDropValue ?? undefined,
          lastOpenedAt:
            openings.length > 0
              ? openings[openings.length - 1].fulfilledAt
              : null,
        },
      });
    }

    // Get recent openings for history (supports multi-reward)
    const recentOpenings = await prisma.lootboxOpening.findMany({
      where: {
        userId: user.id,
        fulfilled: true,
      },
      orderBy: { fulfilledAt: "desc" },
      take: 10,
      select: {
        id: true,
        fulfilledAt: true,
        bestRarityTier: true,
        totalValueAtOpen: true,
        rewardsCount: true,
        lootbox: {
          select: {
            name: true,
            image: true,
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

    // Get free boxes available
    const freeBoxes = await prisma.freeBoxReward.findMany({
      where: {
        userId: user.id,
        claimed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        source: true,
        expiresAt: true,
        lootbox: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Calculate lucky score (rare+ / total * 100)
    const rareOrBetter =
      stats.rareDrops +
      stats.epicDrops +
      stats.mythicDrops +
      stats.cosmicDrops;
    const luckyScore =
      stats.totalOpened > 0
        ? Math.round((rareOrBetter / stats.totalOpened) * 10000) / 100
        : 0;

    // Format response
    return NextResponse.json({
      success: true,
      user: {
        displayName:
          user.username ||
          `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
        avatar: user.profilePicture,
        walletAddress: user.walletAddress,
      },
      stats: {
        totalOpened: stats.totalOpened,
        totalPurchased: stats.totalPurchased,
        totalSpent: Number(stats.totalSpentEth),
        luckyScore,
        streak: {
          current: stats.currentStreak,
          longest: stats.longestStreak,
        },
        lastOpenedAt: stats.lastOpenedAt,
        rarityDistribution: {
          common: stats.commonDrops,
          rare: stats.rareDrops,
          epic: stats.epicDrops,
          mythic: stats.mythicDrops,
          cosmic: stats.cosmicDrops,
        },
        bestDrop: stats.bestDropRarity
          ? {
              rarity: stats.bestDropRarity,
              value: stats.bestDropValue
                ? Number(stats.bestDropValue)
                : null,
            }
          : null,
      },
      freeBoxes: {
        available: freeBoxes.length,
        items: freeBoxes.map((fb) => ({
          id: fb.id,
          source: fb.source,
          expiresAt: fb.expiresAt,
          lootbox: fb.lootbox,
        })),
      },
      recentOpenings: recentOpenings.map((o) => {
        const primaryReward = o.openingRewards[0]?.reward || o.reward;
        return {
          id: o.id,
          rarity: o.bestRarityTier || primaryReward?.rarity,
          value: o.totalValueAtOpen ? Number(o.totalValueAtOpen) : null,
          rewardsCount: o.rewardsCount,
          wonAt: o.fulfilledAt,
          lootbox: o.lootbox,
          reward: primaryReward,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
