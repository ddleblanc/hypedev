/**
 * Lootbox tRPC Router
 * Handles all lootbox-related procedures
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";

// Input schemas
const GetLootboxesInput = z.object({
  rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]).nullish(),  // Accept null or undefined
  creatorId: z.string().uuid().nullish(),
  search: z.string().nullish(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const GetLootboxInput = z.object({
  id: z.string().min(1),  // Accept both UUID (database ID) and numeric string (on-chain ID)
});

const CreateLootboxInput = z.object({
  onChainId: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  image: z.string().url().or(z.literal('')).optional(),  // Accept valid URL, empty string, or undefined
  price: z.number().positive(),
  totalSupply: z.number().positive(),
  rewardsPerOpening: z.number().min(1).max(10).default(1),
  contractAddress: z.string().optional(),
  // Project linking
  projectId: z.string().uuid().optional(),
  // New project creation (used if projectId is not provided)
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }).optional(),
  rewards: z
    .array(
      z.object({
        nftContractAddress: z.string(),
        nftTokenId: z.string(),
        tokenType: z.enum(["ERC721", "ERC1155"]).default("ERC721"),
        name: z.string(),
        description: z.string().optional(),
        image: z.string(),
        collectionName: z.string().optional(),
        rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]),
        weight: z.number().positive().default(100),
      })
    )
    .min(1),
});

const OpenLootboxInput = z.object({
  lootboxId: z.string().uuid(),
  vrfRequestId: z.string(),
  txHash: z.string(),
});

const GetDropsInput = z.object({
  id: z.string(),
});

const GetWinnersInput = z.object({
  id: z.string(),
  limit: z.number().min(1).max(50).default(10),
  rarity: z.enum(["common", "rare", "epic", "mythic", "cosmic"]).optional(),
});

const GetInventoryInput = z.object({
  address: z.string().min(1),
});

export const lootboxRouter = router({
  // Get all active lootboxes
  list: publicProcedure.input(GetLootboxesInput).query(async ({ ctx, input }) => {
    const { rarity, creatorId, search, limit, offset } = input;

    const where: {
      isActive: boolean;
      rarity?: string;
      creatorId?: string;
      OR?: { name: { contains: string; mode: "insensitive" } }[];
    } = { isActive: true };

    if (rarity) where.rarity = rarity;
    if (creatorId) where.creatorId = creatorId;
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    const [lootboxes, total] = await Promise.all([
      ctx.prisma.lootbox.findMany({
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
          _count: { select: { openings: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      ctx.prisma.lootbox.count({ where }),
    ]);

    // Calculate stats
    const lootboxesWithStats = lootboxes.map((lb) => {
      const totalWeight = lb.rewards.reduce((sum, r) => sum + r.weight, 0);
      const rarityDistribution: Record<string, number> = {};

      for (const reward of lb.rewards) {
        if (!rarityDistribution[reward.rarity]) {
          rarityDistribution[reward.rarity] = 0;
        }
        rarityDistribution[reward.rarity] +=
          totalWeight > 0 ? (reward.weight / totalWeight) * 100 : 0;
      }

      return {
        id: lb.id,
        onChainId: lb.onChainId,
        name: lb.name,
        description: lb.description,
        image: lb.image,
        price: parseFloat(lb.price.toString()),
        priceCurrency: lb.priceCurrency,
        rarity: lb.rarity || "common",  // Default to common if null
        totalSupply: lb.totalSupply,
        remainingSupply: lb.remainingSupply,
        contractAddress: lb.contractAddress,
        creator: lb.creator,
        rewardCount: lb.rewards.length,
        openingsCount: lb._count.openings,
        rarityDistribution,
        createdAt: lb.createdAt.toISOString(),
      };
    });

    return {
      success: true as const,
      lootboxes: lootboxesWithStats,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    };
  }),

  // Get a single lootbox by ID with full details
  byId: publicProcedure.input(GetLootboxInput).query(async ({ ctx, input }) => {
    // Try by database ID first, then by onChainId
    let lootbox = await ctx.prisma.lootbox.findUnique({
      where: { id: input.id },
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
          orderBy: { openedAt: "desc" },
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
        _count: { select: { openings: true } },
      },
    });

    // Try by onChainId if not found
    if (!lootbox) {
      const onChainId = parseInt(input.id);
      if (!isNaN(onChainId)) {
        lootbox = await ctx.prisma.lootbox.findUnique({
          where: { onChainId },
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
              orderBy: { openedAt: "desc" },
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
            _count: { select: { openings: true } },
          },
        });
      }
    }

    if (!lootbox) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lootbox not found",
      });
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
      rarityDistribution[reward.rarity].probability += totalWeight > 0 ? (reward.weight / totalWeight) * 100 : 0;
    }

    return {
      id: lootbox.id,
      onChainId: lootbox.onChainId,
      name: lootbox.name,
      description: lootbox.description,
      image: lootbox.image,
      price: parseFloat(lootbox.price.toString()),
      priceCurrency: lootbox.priceCurrency,
      rarity: lootbox.rarity || "common",  // Default to common if null
      totalSupply: lootbox.totalSupply,
      remainingSupply: lootbox.remainingSupply,
      rewardsPerOpening: lootbox.rewardsPerOpening,
      contractAddress: lootbox.contractAddress,
      isActive: lootbox.isActive,
      creator: lootbox.creator,
      rewards: lootbox.rewards.map((r) => ({
        ...r,
        probability: totalWeight > 0 ? (r.weight / totalWeight) * 100 : 0,
      })),
      recentOpenings: lootbox.openings,
      stats: {
        totalOpenings: lootbox._count.openings,
        availableRewards: availableRewards.length,
        totalRewards: lootbox.rewards.length,
        rarityDistribution,
      },
      createdAt: lootbox.createdAt.toISOString(),
      updatedAt: lootbox.updatedAt.toISOString(),
    };
  }),

  // Get drop table for a lootbox
  drops: publicProcedure.input(GetDropsInput).query(async ({ ctx, input }) => {
    // Find lootbox by id or onChainId
    let lootbox = await ctx.prisma.lootbox.findUnique({
      where: { id: input.id },
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
      const onChainId = parseInt(input.id);
      if (!isNaN(onChainId)) {
        lootbox = await ctx.prisma.lootbox.findUnique({
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lootbox not found",
      });
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
        probability: totalWeight > 0 && !reward.claimed ? (reward.weight / totalWeight) * 100 : 0,
        available: !reward.claimed,
        collectionName: reward.collectionName,
      });

      rarityGroups.set(reward.rarity, existing);
    }

    // Calculate rarity-level probabilities
    for (const group of rarityGroups.values()) {
      group.probability = totalWeight > 0 ? (group.weight / totalWeight) * 100 : 0;
    }

    // Convert to sorted array
    const dropTable = Array.from(rarityGroups.values())
      .sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity))
      .map((group) => ({
        rarity: group.rarity,
        probability: Math.round(group.probability * 100) / 100,
        count: group.count,
        available: group.available,
        preview: group.rewards.slice(0, 3).map((r) => ({
          name: r.name,
          image: r.image,
          available: r.available,
        })),
      }));

    return {
      lootboxId: lootbox.id,
      lootboxName: lootbox.name,
      dropTable,
      summary: {
        totalRewards: lootbox.rewards.length,
        availableRewards: availableRewards.length,
        claimedRewards: lootbox.rewards.length - availableRewards.length,
        totalWeight,
      },
    };
  }),

  // Get recent winners for a lootbox
  winners: publicProcedure.input(GetWinnersInput).query(async ({ ctx, input }) => {
    const { id, limit, rarity } = input;

    // Find lootbox by id or onChainId
    let lootbox = await ctx.prisma.lootbox.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!lootbox) {
      const onChainId = parseInt(id);
      if (!isNaN(onChainId)) {
        lootbox = await ctx.prisma.lootbox.findUnique({
          where: { onChainId },
          select: { id: true, name: true },
        });
      }
    }

    if (!lootbox) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lootbox not found",
      });
    }

    // Build where clause
    const where: {
      lootboxId: string;
      fulfilled: boolean;
      rewardId: { not: null };
      bestRarityTier?: string;
    } = {
      lootboxId: lootbox.id,
      fulfilled: true,
      rewardId: { not: null },
    };

    if (rarity) {
      where.bestRarityTier = rarity;
    }

    // Fetch recent fulfilled openings with rewards
    const openings = await ctx.prisma.lootboxOpening.findMany({
      where,
      orderBy: { fulfilledAt: "desc" },
      take: limit,
      select: {
        id: true,
        fulfilledAt: true,
        bestRarityTier: true,
        rewardsCount: true,
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

    // Format response
    const winners = openings.map((opening) => {
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
          displayName: opening.user.username ||
            `${opening.user.walletAddress.slice(0, 6)}...${opening.user.walletAddress.slice(-4)}`,
          avatar: opening.user.profilePicture,
          walletAddress: opening.user.walletAddress,
        },
        rewards,
        rewardsCount: opening.rewardsCount,
        reward: rewards[0] || null,
        wonAt: opening.fulfilledAt?.toISOString() || null,
        rarity: opening.bestRarityTier || rewards[0]?.rarity || null,
      };
    });

    // Get winner stats
    const stats = await ctx.prisma.lootboxOpening.groupBy({
      by: ["bestRarityTier"],
      where: {
        lootboxId: lootbox.id,
        fulfilled: true,
        rewardId: { not: null },
      },
      _count: { id: true },
    });

    const rarityStats = stats.reduce((acc, stat) => {
      if (stat.bestRarityTier) {
        acc[stat.bestRarityTier] = stat._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      lootboxId: lootbox.id,
      lootboxName: lootbox.name,
      winners,
      stats: {
        total: stats.reduce((sum, s) => sum + s._count.id, 0),
        byRarity: rarityStats,
      },
    };
  }),

  // Get user's lootbox inventory
  inventory: publicProcedure.input(GetInventoryInput).query(async ({ ctx, input }) => {
    const { getLootboxBalance, isContractDeployed, LOOTBOX_CONTRACT_ADDRESS } = await import("@/lib/lootbox-contracts");

    // Find user
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: input.address.toLowerCase() },
    });

    if (!user) {
      return {
        inventory: [],
        openings: [],
        createdLootboxes: [],
      };
    }

    // Get user's lootbox openings (history)
    const openings = await ctx.prisma.lootboxOpening.findMany({
      where: { userId: user.id },
      include: {
        lootbox: {
          select: {
            id: true,
            onChainId: true,
            name: true,
            image: true,
            rarity: true,
          },
        },
        reward: {
          select: {
            id: true,
            name: true,
            image: true,
            rarity: true,
            nftContractAddress: true,
            nftTokenId: true,
          },
        },
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    });

    // Get all active lootboxes to check on-chain balances
    const activeLootboxes = await ctx.prisma.lootbox.findMany({
      where: { isActive: true },
      select: {
        id: true,
        onChainId: true,
        name: true,
        description: true,
        image: true,
        price: true,
        priceCurrency: true,
        rarity: true,
        remainingSupply: true,
        contractAddress: true,
      },
    });

    // Check if lootbox contract is deployed
    const contractDeployed = LOOTBOX_CONTRACT_ADDRESS && await isContractDeployed();

    // Fetch on-chain balances for each lootbox
    const inventoryWithBalances = await Promise.all(
      activeLootboxes.map(async (lb) => {
        let balance = 0;

        if (contractDeployed && lb.onChainId !== null) {
          try {
            balance = await getLootboxBalance(input.address, lb.onChainId);
          } catch (error) {
            console.error(`Failed to fetch balance for lootbox ${lb.id}:`, error);
          }
        }

        return {
          ...lb,
          price: parseFloat(lb.price.toString()),
          balance,
        };
      })
    );

    // Get user's created lootboxes
    const createdLootboxes = await ctx.prisma.lootbox.findMany({
      where: { creatorId: user.id },
      select: {
        id: true,
        onChainId: true,
        name: true,
        image: true,
        price: true,
        rarity: true,
        totalSupply: true,
        remainingSupply: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            openings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      inventory: inventoryWithBalances,
      openings: openings.map((o) => ({
        id: o.id,
        lootbox: o.lootbox,
        reward: o.reward,
        fulfilled: o.fulfilled,
        openedAt: o.openedAt.toISOString(),
        fulfilledAt: o.fulfilledAt?.toISOString() || null,
      })),
      createdLootboxes: createdLootboxes.map((lb) => ({
        ...lb,
        price: parseFloat(lb.price.toString()),
        soldCount: lb.totalSupply - lb.remainingSupply,
        openingsCount: lb._count.openings,
        createdAt: lb.createdAt.toISOString(),
      })),
    };
  }),

  // Create a new lootbox (requires auth)
  create: protectedProcedure
    .input(CreateLootboxInput)
    .mutation(async ({ ctx, input }) => {
      // Import rarity calculation
      const { calculateLootboxRarity } = await import("@/lib/lootbox-utils");

      // Calculate rarity from rewards
      const calculatedRarity = calculateLootboxRarity(
        input.rewards.map((r) => ({ rarity: r.rarity, weight: r.weight }))
      );

      // Find or create user
      let creator = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
      });

      if (!creator) {
        creator = await ctx.prisma.user.create({
          data: { walletAddress: ctx.walletAddress },
        });
      }

      // Handle project creation or linking
      let finalProjectId = input.projectId;
      if (!finalProjectId && input.project?.name) {
        // Create a new project
        const newProject = await ctx.prisma.project.create({
          data: {
            name: input.project.name,
            description: input.project.description || "",
            creatorId: creator.id,
            status: "active",
          },
        });
        finalProjectId = newProject.id;
      }

      // Create lootbox
      const lootbox = await ctx.prisma.lootbox.create({
        data: {
          onChainId: input.onChainId,
          name: input.name,
          description: input.description || "",
          image: input.image || "",
          price: input.price,
          rarity: calculatedRarity,
          totalSupply: input.totalSupply,
          remainingSupply: input.totalSupply,
          rewardsPerOpening: input.rewardsPerOpening,
          contractAddress:
            input.contractAddress ||
            process.env.NEXT_PUBLIC_LOOTBOX_CONTRACT_ADDRESS ||
            "",
          creatorId: creator.id,
          projectId: finalProjectId,
          isActive: true,
          rewards: {
            create: input.rewards.map((r) => ({
              nftContractAddress: r.nftContractAddress,
              nftTokenId: r.nftTokenId,
              tokenType: r.tokenType,
              name: r.name,
              description: r.description || "",
              image: r.image,
              collectionName: r.collectionName || "",
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
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          rewards: true,
        },
      });

      return { lootbox, calculatedRarity };
    }),

  // Record lootbox opening (after VRF request)
  recordOpening: protectedProcedure
    .input(OpenLootboxInput)
    .mutation(async ({ ctx, input }) => {
      // Find lootbox
      const lootbox = await ctx.prisma.lootbox.findUnique({
        where: { id: input.lootboxId },
      });

      if (!lootbox) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lootbox not found",
        });
      }

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Create opening record
      const opening = await ctx.prisma.lootboxOpening.create({
        data: {
          lootboxId: lootbox.id,
          userId: user.id,
          vrfRequestId: input.vrfRequestId,
          rewardsCount: lootbox.rewardsPerOpening,
          txHash: input.txHash,
        },
      });

      return opening;
    }),
});
