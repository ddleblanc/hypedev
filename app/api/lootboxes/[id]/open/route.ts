import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitCheck } from "@/lib/rate-limit";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponseWithRateLimit } from "@/lib/api-utils";
import {
  validationError,
  notFoundError,
  databaseError,
  badRequestError,
  type AnyAppError,
} from "@/lib/errors";
import { chatBroadcaster } from "@/lib/chat-broadcaster";

// Rarity ranking for determining "best" drop
const RARITY_RANK: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  mythic: 4,
  cosmic: 5,
};

// Zod schemas for validation
const OpenLootboxSchema = z.object({
  vrfRequestId: z.string().min(1),
  txHash: z.string().optional(),
  openerWalletAddress: z.string().min(1),
});

const FulfillOpeningSchema = z.object({
  vrfRequestId: z.string().min(1),
  rewardIndex: z.number().int().min(0).optional(),
  rewardIndices: z.array(z.number().int().min(0)).optional(),
  nftContractAddress: z.string().optional(),
  nftTokenId: z.string().optional(),
});

const GetOpeningQuerySchema = z.object({
  vrfRequestId: z.string().min(1),
});

// POST /api/lootboxes/[id]/open - Record a lootbox opening
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit blockchain operations
  const rateLimit = await rateLimitCheck(request, "blockchain");
  if (rateLimit.blocked) return rateLimit.response;

  const { id } = await params;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimit);
  }

  // Validate input
  const parseResult = OpenLootboxSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { vrfRequestId, txHash, openerWalletAddress } = parseResult.data;

  // Find the lootbox
  const lootboxResult = await findLootboxById(id);

  if (lootboxResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(lootboxResult.error), rateLimit);
  }

  const lootbox = lootboxResult.value;
  if (!lootbox) {
    return resultToResponseWithRateLimit(err(notFoundError("Lootbox", id)), rateLimit);
  }

  // Find or create user
  const userResult = await ResultAsync.fromPromise(
    (async () => {
      let user = await prisma.user.findUnique({
        where: { walletAddress: openerWalletAddress.toLowerCase() },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress: openerWalletAddress.toLowerCase(),
          },
        });
      }

      return user;
    })(),
    (e) => databaseError(e)
  );

  if (userResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(userResult.error), rateLimit);
  }

  const user = userResult.value;

  // Create opening and decrement supply in transaction
  const openingResult = await ResultAsync.fromPromise(
    prisma.$transaction([
      prisma.lootboxOpening.create({
        data: {
          lootboxId: lootbox.id,
          userId: user.id,
          vrfRequestId,
          txHash,
          rewardsCount: lootbox.rewardsPerOpening,
          fulfilled: false,
        },
      }),
      prisma.lootbox.update({
        where: { id: lootbox.id },
        data: {
          remainingSupply: {
            decrement: 1,
          },
        },
      }),
    ]),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(
    openingResult.map(([opening]) => ({
      opening: {
        id: opening.id,
        vrfRequestId: opening.vrfRequestId,
        fulfilled: opening.fulfilled,
        openedAt: opening.openedAt,
      },
    })),
    rateLimit
  );
}

// PATCH /api/lootboxes/[id]/open - Fulfill a lootbox opening (after VRF callback)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit blockchain operations
  const rateLimitPatch = await rateLimitCheck(request, "blockchain");
  if (rateLimitPatch.blocked) return rateLimitPatch.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimitPatch);
  }

  // Validate input
  const parseResult = FulfillOpeningSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitPatch);
  }

  const { vrfRequestId, rewardIndex, rewardIndices, nftContractAddress, nftTokenId } =
    parseResult.data;

  // Find the opening with full context
  const openingResult = await ResultAsync.fromPromise(
    prisma.lootboxOpening.findUnique({
      where: { vrfRequestId },
      include: {
        lootbox: {
          include: {
            rewards: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
      },
    }),
    (e) => databaseError(e)
  );

  if (openingResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(openingResult.error), rateLimitPatch);
  }

  const opening = openingResult.value;
  if (!opening) {
    return resultToResponseWithRateLimit(err(notFoundError("Opening", vrfRequestId)), rateLimitPatch);
  }

  if (opening.fulfilled) {
    return resultToResponseWithRateLimit(err(badRequestError("Opening already fulfilled")), rateLimitPatch);
  }

  const now = new Date();
  const availableRewards = opening.lootbox.rewards.filter((r) => !r.claimed);

  // Determine which rewards were won
  type RewardWithIndex = { reward: (typeof availableRewards)[0]; index: number };
  const wonRewards: RewardWithIndex[] = [];

  if (rewardIndices && Array.isArray(rewardIndices)) {
    // Multi-reward mode
    for (let i = 0; i < rewardIndices.length; i++) {
      const idx = rewardIndices[i];
      if (idx < availableRewards.length) {
        wonRewards.push({ reward: availableRewards[idx], index: i });
      }
    }
  } else if (nftContractAddress && nftTokenId) {
    // Find by NFT contract/token (legacy)
    const rewardByNft = await prisma.lootboxReward.findFirst({
      where: {
        lootboxId: opening.lootboxId,
        nftContractAddress,
        nftTokenId,
        claimed: false,
      },
    });
    if (rewardByNft) {
      wonRewards.push({ reward: rewardByNft, index: 0 });
    }
  } else if (rewardIndex !== undefined) {
    // Legacy single rewardIndex
    if (rewardIndex < availableRewards.length) {
      wonRewards.push({ reward: availableRewards[rewardIndex], index: 0 });
    }
  }

  // Calculate best rarity
  const bestRarityTier =
    wonRewards.length > 0
      ? wonRewards.reduce((best, { reward }) => {
          const currentRank = RARITY_RANK[reward.rarity] || 0;
          const bestRank = RARITY_RANK[best] || 0;
          return currentRank > bestRank ? reward.rarity : best;
        }, "common")
      : null;

  // User display name
  const userDisplayName =
    opening.user.username ||
    `${opening.user.walletAddress.slice(0, 6)}...${opening.user.walletAddress.slice(-4)}`;

  // Find best reward for activity feed
  const activityReward =
    wonRewards.length > 0
      ? wonRewards.reduce((best, current) => {
          const currentRank = RARITY_RANK[current.reward.rarity] || 0;
          const bestRank = RARITY_RANK[best.reward.rarity] || 0;
          return currentRank > bestRank ? current : best;
        }).reward
      : null;

  // Execute all updates in transaction
  const transactionResult = await ResultAsync.fromPromise(
    prisma.$transaction([
      // Update opening
      prisma.lootboxOpening.update({
        where: { id: opening.id },
        data: {
          fulfilled: true,
          fulfilledAt: now,
          bestRarityTier,
          rewardId: wonRewards[0]?.reward.id,
        },
        include: {
          openingRewards: {
            include: {
              reward: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              walletAddress: true,
            },
          },
        },
      }),
      // Create opening rewards
      ...wonRewards.map(({ reward, index }) =>
        prisma.lootboxOpeningReward.create({
          data: {
            openingId: opening.id,
            rewardId: reward.id,
            rewardIndex: index,
            rarity: reward.rarity,
          },
        })
      ),
      // Mark rewards as claimed
      ...wonRewards.map(({ reward }) =>
        prisma.lootboxReward.update({
          where: { id: reward.id },
          data: {
            claimed: true,
            claimedBy: opening.userId,
            claimedAt: now,
          },
        })
      ),
      // Update lootbox counter
      prisma.lootbox.update({
        where: { id: opening.lootboxId },
        data: {
          totalOpened: { increment: 1 },
        },
      }),
      // Create activity feed entry
      prisma.lootboxActivityFeed.create({
        data: {
          userId: opening.userId,
          type: bestRarityTier
            ? bestRarityTier === "common"
              ? "opened"
              : `${bestRarityTier}_drop`
            : "opened",
          lootboxId: opening.lootboxId,
          openingId: opening.id,
          rewardId: activityReward?.id,
          userDisplayName,
          userAvatar: opening.user.profilePicture,
          lootboxName: opening.lootbox.name,
          rewardName:
            wonRewards.length > 1 ? `${wonRewards.length} rewards` : activityReward?.name,
          rewardImage: activityReward?.image,
          rewardRarity: bestRarityTier,
        },
      }),
    ]),
    (e) => databaseError(e)
  );

  if (transactionResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(transactionResult.error), rateLimitPatch);
  }

  // Update user stats (non-blocking)
  for (const { reward } of wonRewards) {
    updateUserLootboxStats(opening.userId, reward.rarity, null).catch(console.error);
  }

  // Broadcast to chat world channel
  if (bestRarityTier && activityReward) {
    chatBroadcaster.broadcastLootboxOpen(
      userDisplayName,
      bestRarityTier.toUpperCase(),
      wonRewards.length > 1
        ? `${wonRewards.length} items including ${activityReward.name}`
        : activityReward.name
    );
  }

  // Fetch complete opening for response
  const completeOpeningResult = await ResultAsync.fromPromise(
    prisma.lootboxOpening.findUnique({
      where: { id: opening.id },
      include: {
        openingRewards: {
          include: {
            reward: true,
          },
          orderBy: {
            rewardIndex: "asc",
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
      },
    }),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(
    completeOpeningResult.map((completeOpening) => ({
      opening: {
        ...completeOpening,
        rewards: completeOpening?.openingRewards.map((or) => or.reward) || [],
        user: {
          id: completeOpening?.user.id,
          displayName: userDisplayName,
          avatar: completeOpening?.user.profilePicture,
          walletAddress: completeOpening?.user.walletAddress,
        },
      },
    })),
    rateLimitPatch
  );
}

// GET /api/lootboxes/[id]/open?vrfRequestId=xxx - Get opening status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit API reads
  const rateLimitGet = await rateLimitCheck(request, "api");
  if (rateLimitGet.blocked) return rateLimitGet.response;

  const { searchParams } = new URL(request.url);

  // Validate query
  const parseResult = GetOpeningQuerySchema.safeParse({
    vrfRequestId: searchParams.get("vrfRequestId"),
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitGet);
  }

  const { vrfRequestId } = parseResult.data;

  // Find opening
  const openingResult = await ResultAsync.fromPromise(
    prisma.lootboxOpening.findUnique({
      where: { vrfRequestId },
      include: {
        openingRewards: {
          include: {
            reward: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                rarity: true,
                nftContractAddress: true,
                nftTokenId: true,
              },
            },
          },
          orderBy: {
            rewardIndex: "asc",
          },
        },
        reward: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            rarity: true,
            nftContractAddress: true,
            nftTokenId: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        lootbox: {
          select: {
            id: true,
            name: true,
            image: true,
            rewardsPerOpening: true,
          },
        },
      },
    }),
    (e) => databaseError(e)
  );

  const finalResult = openingResult.andThen((opening) => {
    if (!opening) {
      return err(notFoundError("Opening", vrfRequestId));
    }

    const userDisplayName =
      opening.user.username ||
      `${opening.user.walletAddress.slice(0, 6)}...${opening.user.walletAddress.slice(-4)}`;

    const rewards =
      opening.openingRewards.length > 0
        ? opening.openingRewards.map((or) => or.reward)
        : opening.reward
          ? [opening.reward]
          : [];

    return ok({
      opening: {
        id: opening.id,
        vrfRequestId: opening.vrfRequestId,
        fulfilled: opening.fulfilled,
        rewardsCount: opening.rewardsCount,
        bestRarityTier: opening.bestRarityTier,
        rewards,
        reward: opening.reward,
        user: {
          id: opening.user.id,
          displayName: userDisplayName,
          avatar: opening.user.profilePicture,
          walletAddress: opening.user.walletAddress,
        },
        lootbox: opening.lootbox,
        openedAt: opening.openedAt,
        fulfilledAt: opening.fulfilledAt,
      },
    });
  });

  return resultToResponseWithRateLimit(finalResult, rateLimitGet);
}

// Helper function to find lootbox by ID or onChainId
async function findLootboxById(id: string) {
  return ResultAsync.fromPromise(
    (async () => {
      let lootbox = await prisma.lootbox.findUnique({
        where: { id },
      });

      if (!lootbox) {
        const onChainId = parseInt(id);
        if (!isNaN(onChainId)) {
          lootbox = await prisma.lootbox.findUnique({
            where: { onChainId },
          });
        }
      }

      return lootbox;
    })(),
    (e) => databaseError(e)
  );
}

// Helper function to update user lootbox stats
async function updateUserLootboxStats(
  userId: string,
  rarityTier: string | null,
  valueAtOpen: number | null
) {
  const existingStats = await prisma.userLootboxStats.findUnique({
    where: { userId },
  });

  const now = new Date();

  if (existingStats) {
    let newStreak = existingStats.currentStreak;
    const lastOpened = existingStats.lastOpenedAt;

    if (lastOpened) {
      const hoursSinceLastOpen = (now.getTime() - lastOpened.getTime()) / (1000 * 60 * 60);
      newStreak = hoursSinceLastOpen <= 24 ? newStreak + 1 : 1;
    } else {
      newStreak = 1;
    }

    const currentBestRank = existingStats.bestDropRarity
      ? RARITY_RANK[existingStats.bestDropRarity] || 0
      : 0;
    const newRank = rarityTier ? RARITY_RANK[rarityTier] || 0 : 0;
    const isNewBest = newRank > currentBestRank;

    const updateData: Record<string, unknown> = {
      totalOpened: { increment: 1 },
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, existingStats.longestStreak),
      lastOpenedAt: now,
    };

    if (rarityTier) {
      const rarityField = `${rarityTier}Drops`;
      updateData[rarityField] = { increment: 1 };
    }

    if (isNewBest && rarityTier) {
      updateData.bestDropRarity = rarityTier;
      if (valueAtOpen) {
        updateData.bestDropValue = valueAtOpen;
      }
    }

    await prisma.userLootboxStats.update({
      where: { userId },
      data: updateData,
    });
  } else {
    const createData: Record<string, unknown> = {
      userId,
      totalOpened: 1,
      currentStreak: 1,
      longestStreak: 1,
      lastOpenedAt: now,
    };

    if (rarityTier) {
      createData[`${rarityTier}Drops`] = 1;
      createData.bestDropRarity = rarityTier;
      if (valueAtOpen) {
        createData.bestDropValue = valueAtOpen;
      }
    }

    await prisma.userLootboxStats.create({
      data: createData as Parameters<typeof prisma.userLootboxStats.create>[0]["data"],
    });
  }
}
