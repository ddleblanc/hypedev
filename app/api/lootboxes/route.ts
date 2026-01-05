import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateLootboxRarity } from "@/lib/lootbox-utils";
import { rateLimitCheck } from "@/lib/rate-limit";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponseWithRateLimit } from "@/lib/api-utils";
import {
  validationError,
  databaseError,
  badRequestError,
  type AnyAppError,
} from "@/lib/errors";

// Zod schemas for validation
const RewardSchema = z.object({
  nftContractAddress: z.string(),
  nftTokenId: z.string(),
  tokenType: z.enum(["ERC721", "ERC1155"]).default("ERC721"),
  name: z.string(),
  description: z.string().optional(),
  image: z.string(),
  collectionName: z.string().optional(),
  rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]),
  weight: z.number().positive().default(100),
});

const CreateLootboxSchema = z.object({
  onChainId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string(),
  price: z.number().positive(),
  totalSupply: z.number().positive(),
  rewardsPerOpening: z.number().min(1).max(10).default(1),
  contractAddress: z.string().optional(),
  creatorWalletAddress: z.string().optional(),
  rewards: z.array(RewardSchema).min(1),
});

const GetLootboxesQuerySchema = z.object({
  rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]).optional(),
  creatorId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

type CreateLootboxInput = z.infer<typeof CreateLootboxSchema>;

// GET /api/lootboxes - List all active lootboxes
export async function GET(request: NextRequest) {
  // Rate limit API reads
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const parseResult = GetLootboxesQuerySchema.safeParse({
    rarity: searchParams.get("rarity") || undefined,
    creatorId: searchParams.get("creatorId") || undefined,
    limit: searchParams.get("limit") || 50,
    offset: searchParams.get("offset") || 0,
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { rarity, creatorId, limit, offset } = parseResult.data;

  // Build where clause
  const where: {
    isActive: boolean;
    rarity?: string;
    creatorId?: string;
  } = {
    isActive: true,
  };

  if (rarity) {
    where.rarity = rarity;
  }

  if (creatorId) {
    where.creatorId = creatorId;
  }

  // Execute database query with Result pattern
  const result = await ResultAsync.fromPromise(
    Promise.all([
      prisma.lootbox.findMany({
        where,
        include: {
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
              name: true,
              image: true,
              rarity: true,
              weight: true,
              claimed: true,
            },
          },
          _count: {
            select: {
              openings: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.lootbox.count({ where }),
    ]),
    (e) => databaseError(e)
  );

  // Transform result
  const finalResult = result.map(([lootboxes, total]) => {
    const lootboxesWithStats = lootboxes.map((lb) => {
      const totalWeight = lb.rewards.reduce((sum, r) => sum + r.weight, 0);
      const rarityDistribution: Record<string, number> = {};

      for (const reward of lb.rewards) {
        if (!rarityDistribution[reward.rarity]) {
          rarityDistribution[reward.rarity] = 0;
        }
        rarityDistribution[reward.rarity] += (reward.weight / totalWeight) * 100;
      }

      return {
        id: lb.id,
        onChainId: lb.onChainId,
        name: lb.name,
        description: lb.description,
        image: lb.image,
        price: parseFloat(lb.price.toString()),
        priceCurrency: lb.priceCurrency,
        rarity: lb.rarity,
        totalSupply: lb.totalSupply,
        remainingSupply: lb.remainingSupply,
        rewardsPerOpening: lb.rewardsPerOpening,
        contractAddress: lb.contractAddress,
        creator: lb.creator,
        rewardCount: lb.rewards.length,
        openingsCount: lb._count.openings,
        rarityDistribution,
        createdAt: lb.createdAt,
      };
    });

    return {
      lootboxes: lootboxesWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });

  return resultToResponseWithRateLimit(finalResult, rateLimit);
}

// POST /api/lootboxes - Create a new lootbox
export async function POST(request: NextRequest) {
  // Rate limit API writes
  const rateLimitPost = await rateLimitCheck(request, "apiWrite");
  if (rateLimitPost.blocked) return rateLimitPost.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimitPost);
  }

  // Validate input
  const parseResult = CreateLootboxSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitPost);
  }

  const input = parseResult.data;

  // Calculate rarity from rewards
  const calculatedRarity = calculateLootboxRarity(
    input.rewards.map((r) => ({ rarity: r.rarity, weight: r.weight }))
  );

  // Execute database operations with Result pattern
  const result = await createLootbox(input, calculatedRarity);

  return resultToResponseWithRateLimit(result, rateLimitPost);
}

// Helper function to create lootbox with Result pattern
async function createLootbox(
  input: CreateLootboxInput,
  calculatedRarity: string
) {
  const {
    onChainId,
    name,
    description,
    image,
    price,
    totalSupply,
    rewardsPerOpening,
    contractAddress,
    creatorWalletAddress,
    rewards,
  } = input;

  // Find or create user
  const userResult = await ResultAsync.fromPromise(
    (async () => {
      let creator = await prisma.user.findUnique({
        where: { walletAddress: creatorWalletAddress?.toLowerCase() },
      });

      if (!creator) {
        creator = await prisma.user.create({
          data: {
            walletAddress: creatorWalletAddress?.toLowerCase() ?? "",
          },
        });
      }

      return creator;
    })(),
    (e) => databaseError(e)
  );

  if (userResult.isErr()) {
    return err<{ lootbox: unknown; calculatedRarity: string }, AnyAppError>(userResult.error);
  }

  const creator = userResult.value;

  // Create lootbox
  const lootboxResult = await ResultAsync.fromPromise(
    prisma.lootbox.create({
      data: {
        onChainId,
        name,
        description,
        image,
        price,
        rarity: calculatedRarity,
        totalSupply,
        remainingSupply: totalSupply,
        rewardsPerOpening,
        contractAddress: contractAddress || process.env.NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS || "",
        creatorId: creator.id,
        isActive: true,
        rewards: {
          create: rewards.map((r) => ({
            nftContractAddress: r.nftContractAddress,
            nftTokenId: r.nftTokenId,
            tokenType: r.tokenType,
            name: r.name,
            description: r.description,
            image: r.image,
            collectionName: r.collectionName,
            rarity: r.rarity,
            weight: r.weight,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            walletAddress: true,
          },
        },
        rewards: true,
      },
    }),
    (e) => databaseError(e)
  );

  return lootboxResult.map((lootbox) => ({
    lootbox,
    calculatedRarity,
  }));
}
