import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponse } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import {
  validationError,
  notFoundError,
  databaseError,
  badRequestError,
  type AnyAppError,
} from "@/lib/errors";

// Zod schemas for validation
const GetLootboxParamsSchema = z.object({
  id: z.string().min(1),
});

const UpdateLootboxSchema = z.object({
  remainingSupply: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Include configuration for lootbox queries
const lootboxInclude = {
  creator: {
    select: {
      id: true,
      username: true,
      profilePicture: true,
      walletAddress: true,
    },
  },
  rewards: {
    select: {
      id: true,
      nftContractAddress: true,
      nftTokenId: true,
      tokenType: true,
      name: true,
      description: true,
      image: true,
      collectionName: true,
      rarity: true,
      weight: true,
      claimed: true,
      claimedBy: true,
      claimedAt: true,
    },
  },
  openings: {
    take: 10,
    orderBy: { openedAt: "desc" as const },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
          walletAddress: true,
        },
      },
      reward: {
        select: {
          id: true,
          name: true,
          image: true,
          rarity: true,
        },
      },
    },
  },
  _count: {
    select: {
      openings: true,
    },
  },
} as const;

// GET /api/lootboxes/[id] - Get lootbox details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;

  // Validate params
  const parseResult = GetLootboxParamsSchema.safeParse({ id });
  if (!parseResult.success) {
    return resultToResponse(err(validationError(parseResult.error)));
  }

  // Try to find by database ID first, then by onChainId
  const lootboxResult = await findLootboxById(id);

  const finalResult = lootboxResult.andThen((lootbox) => {
    if (!lootbox) {
      return err(notFoundError("Lootbox", id));
    }

    // Calculate stats
    const totalWeight = lootbox.rewards.reduce((sum, r) => sum + r.weight, 0);
    const availableRewards = lootbox.rewards.filter((r) => !r.claimed);

    // Calculate rarity distribution
    const rarityDistribution: Record<string, { count: number; probability: number }> = {};
    for (const reward of lootbox.rewards) {
      if (!rarityDistribution[reward.rarity]) {
        rarityDistribution[reward.rarity] = { count: 0, probability: 0 };
      }
      rarityDistribution[reward.rarity].count++;
      rarityDistribution[reward.rarity].probability += (reward.weight / totalWeight) * 100;
    }

    return ok({
      lootbox: {
        id: lootbox.id,
        onChainId: lootbox.onChainId,
        name: lootbox.name,
        description: lootbox.description,
        image: lootbox.image,
        price: parseFloat(lootbox.price.toString()),
        priceCurrency: lootbox.priceCurrency,
        rarity: lootbox.rarity,
        totalSupply: lootbox.totalSupply,
        remainingSupply: lootbox.remainingSupply,
        rewardsPerOpening: lootbox.rewardsPerOpening,
        contractAddress: lootbox.contractAddress,
        isActive: lootbox.isActive,
        creator: lootbox.creator,
        rewards: lootbox.rewards.map((r) => ({
          ...r,
          probability: (r.weight / totalWeight) * 100,
        })),
        recentOpenings: lootbox.openings,
        stats: {
          totalOpenings: lootbox._count.openings,
          availableRewards: availableRewards.length,
          totalRewards: lootbox.rewards.length,
          rarityDistribution,
        },
        createdAt: lootbox.createdAt,
        updatedAt: lootbox.updatedAt,
      },
    });
  });

  return resultToResponse(finalResult);
}

// PATCH /api/lootboxes/[id] - Update lootbox (sync with on-chain state)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResult = await rateLimit(request, "apiWrite");
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;

  // Validate params
  const paramsResult = GetLootboxParamsSchema.safeParse({ id });
  if (!paramsResult.success) {
    return resultToResponse(err(validationError(paramsResult.error)));
  }

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponse(err<never, AnyAppError>(bodyResult.error));
  }

  // Validate input
  const parseResult = UpdateLootboxSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponse(err(validationError(parseResult.error)));
  }

  const { remainingSupply, isActive } = parseResult.data;

  // Check that at least one field is being updated
  if (remainingSupply === undefined && isActive === undefined) {
    return resultToResponse(err(badRequestError("No fields to update")));
  }

  // Build update data
  const updates: { remainingSupply?: number; isActive?: boolean } = {};
  if (remainingSupply !== undefined) {
    updates.remainingSupply = remainingSupply;
  }
  if (isActive !== undefined) {
    updates.isActive = isActive;
  }

  // Execute update
  const result = await ResultAsync.fromPromise(
    prisma.lootbox.update({
      where: { id },
      data: updates,
    }),
    (e) => databaseError(e)
  );

  return resultToResponse(result.map((lootbox) => ({ lootbox })));
}

// Helper function to find lootbox by ID or onChainId
async function findLootboxById(id: string) {
  return ResultAsync.fromPromise(
    (async () => {
      // Try by database ID first
      let lootbox = await prisma.lootbox.findUnique({
        where: { id },
        include: lootboxInclude,
      });

      // Try by onChainId if not found
      if (!lootbox) {
        const onChainId = parseInt(id);
        if (!isNaN(onChainId)) {
          lootbox = await prisma.lootbox.findUnique({
            where: { onChainId },
            include: lootboxInclude,
          });
        }
      }

      return lootbox;
    })(),
    (e) => databaseError(e)
  );
}
