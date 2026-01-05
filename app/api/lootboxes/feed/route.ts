import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(), // For pagination (last createdAt)
  rarity: z.enum(["rare", "epic", "mythic", "cosmic"]).optional(), // Filter by rarity (rare+)
  lootboxId: z.string().optional(), // Filter by specific lootbox
});

// GET /api/lootboxes/feed - Get activity feed for all lootbox opens
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryResult = querySchema.safeParse({
      limit: searchParams.get("limit") ?? 20,
      cursor: searchParams.get("cursor"),
      rarity: searchParams.get("rarity"),
      lootboxId: searchParams.get("lootboxId"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { limit, cursor, rarity, lootboxId } = queryResult.data;

    // Build where clause
    const where: any = {};

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Filter by rarity tier (rare+ for marquee)
    if (rarity) {
      const rarityFilter = {
        rare: ["rare", "epic", "mythic", "cosmic"],
        epic: ["epic", "mythic", "cosmic"],
        mythic: ["mythic", "cosmic"],
        cosmic: ["cosmic"],
      };
      where.rewardRarity = { in: rarityFilter[rarity] };
    }

    if (lootboxId) {
      where.lootboxId = lootboxId;
    }

    // Fetch activity feed entries
    const activities = await prisma.lootboxActivityFeed.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Get one extra to check if there's more
      select: {
        id: true,
        type: true,
        userDisplayName: true,
        userAvatar: true,
        lootboxName: true,
        rewardName: true,
        rewardImage: true,
        rewardRarity: true,
        rewardValue: true,
        createdAt: true,
        lootboxId: true,
      },
    });

    // Check if there's a next page
    const hasMore = activities.length > limit;
    const feedItems = hasMore ? activities.slice(0, limit) : activities;

    // Format for client consumption
    const feed = feedItems.map((item) => ({
      id: item.id,
      type: item.type,
      user: {
        displayName: item.userDisplayName,
        avatar: item.userAvatar,
      },
      lootbox: {
        id: item.lootboxId,
        name: item.lootboxName,
      },
      reward: {
        name: item.rewardName,
        image: item.rewardImage,
        rarity: item.rewardRarity,
        value: item.rewardValue ? Number(item.rewardValue) : null,
      },
      createdAt: item.createdAt,
    }));

    // Next cursor is the createdAt of the last item
    const nextCursor = hasMore
      ? feedItems[feedItems.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      success: true,
      feed,
      pagination: {
        hasMore,
        nextCursor,
        count: feed.length,
      },
    });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}

// GET /api/lootboxes/feed/rare - Convenience endpoint for rare+ drops only
// This is used for the social proof marquee
export async function HEAD(request: NextRequest) {
  // Return count of recent rare drops (last 24h)
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await prisma.lootboxActivityFeed.count({
      where: {
        createdAt: { gte: oneDayAgo },
        rewardRarity: { in: ["rare", "epic", "mythic", "cosmic"] },
      },
    });

    const response = new NextResponse(null, { status: 200 });
    response.headers.set("X-Rare-Drops-24h", count.toString());
    return response;
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
