import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]).optional(),
});

// GET /api/lootboxes/[id]/winners - Get recent winners for a lootbox
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryResult = querySchema.safeParse({
      limit: searchParams.get("limit") ?? 10,
      rarity: searchParams.get("rarity"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { limit, rarity } = queryResult.data;

    // Find lootbox by id or onChainId
    let lootbox = await prisma.lootbox.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!lootbox) {
      const onChainId = parseInt(id);
      if (!isNaN(onChainId)) {
        lootbox = await prisma.lootbox.findUnique({
          where: { onChainId },
          select: { id: true, name: true },
        });
      }
    }

    if (!lootbox) {
      return NextResponse.json(
        { success: false, error: "Lootbox not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      lootboxId: lootbox.id,
      fulfilled: true,
      rewardId: { not: null },
    };

    if (rarity) {
      where.bestRarityTier = rarity;
    }

    // Fetch recent fulfilled openings with rewards (supports multi-reward)
    const openings = await prisma.lootboxOpening.findMany({
      where,
      orderBy: { fulfilledAt: "desc" },
      take: limit,
      select: {
        id: true,
        fulfilledAt: true,
        bestRarityTier: true,
        rewardsCount: true,
        // Multi-reward support
        openingRewards: {
          select: {
            reward: {
              select: {
                id: true,
                name: true,
                image: true,
                rarity: true,
                collectionName: true,
              },
            },
          },
          orderBy: { rewardIndex: "asc" },
        },
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        // Legacy single reward for backwards compatibility
        reward: {
          select: {
            id: true,
            name: true,
            image: true,
            rarity: true,
            collectionName: true,
          },
        },
      },
    });

    // Format response - support multi-reward
    const winners = openings.map((opening) => {
      // Build rewards array: prefer openingRewards (multi-reward), fallback to legacy reward
      const rewards = opening.openingRewards.length > 0
        ? opening.openingRewards.map((or) => ({
            name: or.reward.name,
            image: or.reward.image,
            rarity: or.reward.rarity,
            collectionName: or.reward.collectionName,
          }))
        : opening.reward
          ? [{
              name: opening.reward.name,
              image: opening.reward.image,
              rarity: opening.reward.rarity,
              collectionName: opening.reward.collectionName,
            }]
          : [];

      return {
        id: opening.id,
        user: {
          displayName:
            opening.user.username ||
            `${opening.user.walletAddress.slice(0, 6)}...${opening.user.walletAddress.slice(-4)}`,
          avatar: opening.user.profilePicture,
          walletAddress: opening.user.walletAddress,
        },
        // Multi-reward support
        rewards,
        rewardsCount: opening.rewardsCount,
        // Legacy single reward for backwards compatibility
        reward: rewards[0] || null,
        wonAt: opening.fulfilledAt,
        rarity: opening.bestRarityTier || rewards[0]?.rarity,
      };
    });

    // Get winner stats for this lootbox
    const stats = await prisma.lootboxOpening.groupBy({
      by: ["bestRarityTier"],
      where: {
        lootboxId: lootbox.id,
        fulfilled: true,
        rewardId: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const rarityStats = stats.reduce(
      (acc, stat) => {
        if (stat.bestRarityTier) {
          acc[stat.bestRarityTier] = stat._count.id;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      lootboxId: lootbox.id,
      lootboxName: lootbox.name,
      winners,
      stats: {
        total: stats.reduce((sum, s) => sum + s._count.id, 0),
        byRarity: rarityStats,
      },
    });
  } catch (error) {
    console.error("Error fetching winners:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch winners" },
      { status: 500 }
    );
  }
}
