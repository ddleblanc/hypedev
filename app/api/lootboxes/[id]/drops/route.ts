import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/lootboxes/[id]/drops - Get drop table with probabilities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    const { id } = await params;

    // Find lootbox by id or onChainId
    let lootbox = await prisma.lootbox.findUnique({
      where: { id },
      include: {
        rewards: {
          select: {
            id: true,
            name: true,
            image: true,
            rarity: true,
            weight: true,
            claimed: true,
            nftContractAddress: true,
            collectionName: true,
          },
        },
      },
    });

    // Try by onChainId if not found
    if (!lootbox) {
      const onChainId = parseInt(id);
      if (!isNaN(onChainId)) {
        lootbox = await prisma.lootbox.findUnique({
          where: { onChainId },
          include: {
            rewards: {
              select: {
                id: true,
                name: true,
                image: true,
                rarity: true,
                weight: true,
                claimed: true,
                nftContractAddress: true,
                collectionName: true,
              },
            },
          },
        });
      }
    }

    if (!lootbox) {
      return NextResponse.json(
        { success: false, error: "Lootbox not found" },
        { status: 404 }
      );
    }

    // Calculate total weight of available (unclaimed) rewards
    const availableRewards = lootbox.rewards.filter((r) => !r.claimed);
    const totalWeight = availableRewards.reduce((sum, r) => sum + r.weight, 0);

    // Group rewards by rarity and calculate probabilities
    const rarityGroups = new Map<
      string,
      {
        rarity: string;
        weight: number;
        probability: number;
        count: number;
        available: number;
        rewards: Array<{
          id: string;
          name: string;
          image: string;
          probability: number;
          available: boolean;
          collectionName: string | null;
        }>;
      }
    >();

    // Define rarity order for consistent sorting
    const rarityOrder = ["cosmic", "mythic", "epic", "rare", "common"];

    for (const reward of lootbox.rewards) {
      const existing = rarityGroups.get(reward.rarity) || {
        rarity: reward.rarity,
        weight: 0,
        probability: 0,
        count: 0,
        available: 0,
        rewards: [],
      };

      existing.count++;
      if (!reward.claimed) {
        existing.weight += reward.weight;
        existing.available++;
      }

      existing.rewards.push({
        id: reward.id,
        name: reward.name,
        image: reward.image,
        probability:
          totalWeight > 0 && !reward.claimed
            ? (reward.weight / totalWeight) * 100
            : 0,
        available: !reward.claimed,
        collectionName: reward.collectionName,
      });

      rarityGroups.set(reward.rarity, existing);
    }

    // Calculate rarity-level probabilities
    for (const group of rarityGroups.values()) {
      group.probability =
        totalWeight > 0 ? (group.weight / totalWeight) * 100 : 0;
    }

    // Convert to sorted array
    const dropTable = Array.from(rarityGroups.values())
      .sort(
        (a, b) =>
          rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
      )
      .map((group) => ({
        rarity: group.rarity,
        probability: Math.round(group.probability * 100) / 100, // Round to 2 decimals
        count: group.count,
        available: group.available,
        // Show first 3 rewards as preview
        preview: group.rewards.slice(0, 3).map((r) => ({
          name: r.name,
          image: r.image,
          available: r.available,
        })),
      }));

    // Summary stats
    const summary = {
      totalRewards: lootbox.rewards.length,
      availableRewards: availableRewards.length,
      claimedRewards: lootbox.rewards.length - availableRewards.length,
      totalWeight,
    };

    return NextResponse.json({
      success: true,
      lootboxId: lootbox.id,
      lootboxName: lootbox.name,
      dropTable,
      summary,
    });
  } catch (error) {
    console.error("Error fetching drop table:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch drop table" },
      { status: 500 }
    );
  }
}
