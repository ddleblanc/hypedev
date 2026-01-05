/**
 * User tRPC Router
 * Handles all user-related procedures: profile, nfts, followers, and social
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import { auth } from "@/lib/auth";
import { logFollow } from "@/lib/activity";
import type { Prisma } from "@prisma/client";

// =============================================================================
// Helper Functions
// =============================================================================

function formatEthValue(value: number): string | undefined {
  if (value === 0) return undefined;
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ETH`;
  }
  if (value >= 1) {
    return `${value.toFixed(2)} ETH`;
  }
  return `${value.toFixed(4)} ETH`;
}

function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    1: "ethereum",
    137: "polygon",
    42161: "arbitrum",
    10: "optimism",
    8453: "base",
    11155111: "ethereum", // Sepolia testnet
  };
  return chainMap[chainId] || "ethereum";
}

function getDefaultStats(isCreator: boolean): {
  nftsOwned: number;
  collectionsOwned: number;
  volumeTraded: string | undefined;
  totalSales: number;
  totalPurchases: number;
  created: number | undefined;
  followers: number;
  following: number;
  avgSalePrice: number;
  topSale: number;
  salesCount: number;
  purchasesCount: number;
  joinedDays: number;
} {
  return {
    nftsOwned: 0,
    collectionsOwned: 0,
    volumeTraded: undefined,
    totalSales: 0,
    totalPurchases: 0,
    created: isCreator ? 0 : undefined,
    followers: 0,
    following: 0,
    avgSalePrice: 0,
    topSale: 0,
    salesCount: 0,
    purchasesCount: 0,
    joinedDays: 1,
  };
}

// =============================================================================
// Input Schemas - Profile
// =============================================================================

const GetProfileInput = z.object({
  address: z.string().min(1),
});

const CheckUsernameInput = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  excludeUserId: z.string().optional(),
});

const GetActivityInput = z.object({
  address: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  type: z.string().optional(),
  days: z.number().min(1).max(365).default(90),
});

const GetFavoritesInput = z.object({
  userId: z.string().min(1),
  isPublic: z.boolean().optional(),
});

const ToggleFavoriteInput = z.object({
  nftId: z.string().min(1),
});

const CheckFavoriteInput = z.object({
  nftId: z.string().min(1),
});

const CreateReportInput = z.object({
  type: z.enum(["nft", "collection", "user"]),
  targetId: z.string().min(1),
  contractAddress: z.string().optional(),
  tokenId: z.string().optional(),
  reason: z.enum(["stolen", "copyright", "explicit", "spam", "other"]),
  details: z.string().optional(),
});

const UpdateProfileInput = z.object({
  address: z.string().min(1),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  profilePicture: z.string().optional().or(z.literal("")),
  bannerImage: z.string().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  profileCompleted: z.boolean().optional(),
  socials: z
    .array(
      z.object({
        platform: z.enum(["twitter", "instagram", "discord", "telegram", "website", "youtube"]),
        url: z.string().url(),
      })
    )
    .optional(),
});

// =============================================================================
// Input Schemas - NFTs
// =============================================================================

const GetNFTsInput = z.object({
  address: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(24),
  filter: z.enum(["owned", "created", "drafts", "all"]).default("owned"),
  search: z.string().optional(),
  sortBy: z
    .enum(["recent", "oldest", "price-low", "price-high", "rarity-rare", "rarity-common", "most-liked"])
    .default("recent"),
  chains: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  status: z.enum(["listed", "unlisted", "auction", "on_auction", "has_offers", "hasOffers", "new"]).optional(),
});

// =============================================================================
// Input Schemas - Followers
// =============================================================================

const GetFollowersInput = z.object({
  address: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const GetFollowingInput = z.object({
  address: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const FollowInput = z.object({
  targetAddress: z.string().min(1),
  followerAddress: z.string().min(1),
});

const GetFollowStatusInput = z.object({
  address: z.string().min(1),
  checkerAddress: z.string().optional(),
});

// =============================================================================
// Profile Router
// =============================================================================

const profileRouter = router({
  /**
   * Get user profile by wallet address
   */
  byAddress: publicProcedure.input(GetProfileInput).query(async ({ ctx, input }) => {
    const { address } = input;

    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const normalizedAddress = user.walletAddress.toLowerCase();

    // Calculate stats
    let stats = getDefaultStats(user.isCreator);
    try {
      const userWithCounts = await ctx.prisma.user.findUnique({
        where: { walletAddress: normalizedAddress },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
            },
          },
        },
      });

      if (userWithCounts) {
        const [ownedNFTs, collectionsOwned, createdNFTs, salesData, purchasesData] = await Promise.all([
          ctx.prisma.nft.count({
            where: {
              ownerAddress: normalizedAddress,
              isMinted: true,
            },
          }),
          ctx.prisma.collection.count({
            where: { creatorAddress: normalizedAddress },
          }),
          user.isCreator
            ? ctx.prisma.nft.count({
                where: {
                  collection: {
                    creatorAddress: normalizedAddress,
                    isDeployed: true,
                  },
                  isMinted: true,
                },
              })
            : Promise.resolve(0),
          ctx.prisma.activity.aggregate({
            where: {
              userId: userWithCounts.id,
              type: "listing_sold",
              amount: { not: null },
            },
            _sum: { amount: true },
            _count: { id: true },
            _max: { amount: true },
          }),
          ctx.prisma.activity.aggregate({
            where: {
              userId: userWithCounts.id,
              type: { in: ["purchase", "auction_won"] },
              amount: { not: null },
            },
            _sum: { amount: true },
            _count: { id: true },
          }),
        ]);

        const totalSales = salesData._sum.amount || 0;
        const totalPurchases = purchasesData._sum.amount || 0;
        const volumeTraded = totalSales + totalPurchases;
        const salesCount = salesData._count.id;
        const purchasesCount = purchasesData._count.id;
        const avgSalePrice = salesCount > 0 ? totalSales / salesCount : 0;
        const topSale = salesData._max.amount || 0;

        const joinedDays = userWithCounts.createdAt
          ? Math.floor((Date.now() - new Date(userWithCounts.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        stats = {
          nftsOwned: ownedNFTs,
          collectionsOwned: collectionsOwned,
          volumeTraded: formatEthValue(volumeTraded),
          totalSales: +totalSales.toFixed(4),
          totalPurchases: +totalPurchases.toFixed(4),
          created: user.isCreator ? createdNFTs : undefined,
          followers: userWithCounts._count?.followers || 0,
          following: userWithCounts._count?.following || 0,
          avgSalePrice: +avgSalePrice.toFixed(4),
          topSale: +topSale.toFixed(4),
          salesCount,
          purchasesCount,
          joinedDays: Math.max(1, joinedDays),
        };
      }
    } catch (error) {
      console.error("Error calculating user stats:", error);
    }

    // Check verification status
    const verified = await auth.isUserVerified(user.walletAddress);

    return {
      ...user,
      stats,
      verified,
    };
  }),

  /**
   * Update user profile
   */
  update: protectedProcedure.input(UpdateProfileInput).mutation(async ({ ctx, input }) => {
    const { address, username, ...updateData } = input;

    // Verify the caller matches the address
    if (ctx.walletAddress.toLowerCase() !== address.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only update your own profile",
      });
    }

    const existingUser = await auth.getUserByWallet(address);
    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check username availability if provided
    if (username && username !== existingUser.username) {
      const isAvailable = await auth.isUsernameAvailable(username, existingUser.id);
      if (!isAvailable) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken",
        });
      }
    }

    // Update user profile
    const updatedUser = await auth.updateUserProfile(existingUser.id, {
      username,
      ...updateData,
    });

    return { success: true as const, user: updatedUser };
  }),

  /**
   * Get trading stats for a user
   */
  tradingStats: publicProcedure.input(GetProfileInput).query(async ({ ctx, input }) => {
    const { address } = input;
    const normalizedAddress = address.toLowerCase();

    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      return {
        success: true as const,
        stats: {
          totalVolume: "0 ETH",
          totalSales: 0,
          totalPurchases: 0,
          profitLoss: "0 ETH",
          profitLossPercent: 0,
          bestSale: null,
        },
      };
    }

    // Get sales (where user was seller)
    const salesData = await ctx.prisma.activity.aggregate({
      where: {
        userId: user.id,
        type: "sale",
      },
      _sum: { amount: true },
      _count: { id: true },
      _max: { amount: true },
    });

    // Get purchases (where user was buyer)
    const purchasesData = await ctx.prisma.activity.aggregate({
      where: {
        userId: user.id,
        type: "purchase",
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalSales = salesData._sum.amount || 0;
    const totalPurchases = purchasesData._sum.amount || 0;
    const profitLoss = totalSales - totalPurchases;
    const profitLossPercent = totalPurchases > 0 ? (profitLoss / totalPurchases) * 100 : 0;

    // Get best sale NFT
    let bestSale = null;
    if (salesData._max.amount && salesData._max.amount > 0) {
      const bestSaleActivity = await ctx.prisma.activity.findFirst({
        where: {
          userId: user.id,
          type: "sale",
          amount: salesData._max.amount,
        },
        include: {
          nft: {
            select: {
              id: true,
              name: true,
              image: true,
              tokenId: true,
              collection: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (bestSaleActivity?.nft) {
        bestSale = {
          name: bestSaleActivity.nft.name,
          image: bestSaleActivity.nft.image,
          price: formatEthValue(salesData._max.amount) || "0 ETH",
        };
      }
    }

    return {
      success: true as const,
      stats: {
        totalVolume: formatEthValue(totalSales + totalPurchases) || "0 ETH",
        totalSales: salesData._count.id,
        totalPurchases: purchasesData._count.id,
        profitLoss: `${profitLoss >= 0 ? "+" : ""}${formatEthValue(Math.abs(profitLoss)) || "0 ETH"}`,
        profitLossPercent: Math.round(profitLossPercent * 10) / 10,
        bestSale,
      },
    };
  }),

  /**
   * Check if username is available
   */
  checkUsername: publicProcedure.input(CheckUsernameInput).query(async ({ input }) => {
    const { username, excludeUserId } = input;

    const isAvailable = await auth.isUsernameAvailable(username, excludeUserId);

    return {
      success: true as const,
      available: isAvailable,
      username,
    };
  }),
});

// =============================================================================
// Activity Router
// =============================================================================

const activityRouter = router({
  /**
   * Get user activity feed
   */
  list: publicProcedure.input(GetActivityInput).query(async ({ ctx, input }) => {
    const { address, page, limit, type, days } = input;

    const normalizedAddress = address.toLowerCase();

    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Build the where clause
    const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: {
      userId: string;
      type?: string;
      createdAt?: { gte: Date };
    } = {
      userId: user.id,
      createdAt: { gte: dateFilter },
    };

    if (type && type !== "all") {
      where.type = type;
    }

    // Fetch activities with related data
    const [activities, total] = await Promise.all([
      ctx.prisma.activity.findMany({
        where,
        include: {
          nft: {
            select: {
              id: true,
              name: true,
              image: true,
              tokenId: true,
              collection: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  image: true,
                },
              },
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
              address: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      ctx.prisma.activity.count({ where }),
    ]);

    // Get activity stats grouped by type
    const statsRaw = await ctx.prisma.activity.groupBy({
      by: ["type"],
      where: { userId: user.id },
      _count: true,
    });

    const stats = Object.fromEntries(
      statsRaw.map((s) => [s.type, s._count])
    ) as Record<string, number>;

    // Calculate volume stats for sale activities
    const volumeStats = await ctx.prisma.activity.aggregate({
      where: {
        userId: user.id,
        type: { in: ["listing_sold", "purchase"] },
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    });

    // Get unique collections count
    const uniqueCollections = await ctx.prisma.activity.groupBy({
      by: ["collectionId"],
      where: {
        userId: user.id,
        collectionId: { not: null },
      },
    });

    // Get last activity timestamp
    const lastActivity = await ctx.prisma.activity.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Get available activity types for this user
    const availableTypes = await ctx.prisma.activity.groupBy({
      by: ["type"],
      where: { userId: user.id },
    });

    // Transform activities to match expected format
    const transformedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      nft: activity.nft
        ? {
            id: activity.nft.id,
            name: activity.nft.name,
            image: activity.nft.image,
            tokenId: activity.nft.tokenId,
            collectionName: activity.nft.collection?.name || null,
            collectionSlug: activity.nft.collection?.address || null,
            contractAddress: activity.nft.collection?.address || null,
          }
        : null,
      collection: activity.collection
        ? {
            id: activity.collection.id,
            name: activity.collection.name,
            address: activity.collection.address,
            image: activity.collection.image,
          }
        : null,
      price: activity.amount,
      currency: activity.currency,
      txHash: activity.transactionHash,
      relatedUserId: activity.relatedUserId,
      relatedAddress: activity.relatedAddress,
      listingId: activity.listingId,
      tradeId: activity.tradeId,
      metadata: activity.metadata,
      timestamp: activity.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true as const,
      activities: transformedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats: {
        total,
        byType: stats,
        totalVolume: volumeStats._sum.amount || 0,
        totalSales: volumeStats._count || 0,
        averagePrice: volumeStats._avg.amount
          ? +volumeStats._avg.amount.toFixed(4)
          : 0,
        uniqueCollections: uniqueCollections.length,
        lastActivity: lastActivity?.createdAt || null,
      },
      filters: {
        availableTypes: availableTypes.map((t) => t.type),
      },
    };
  }),
});

// =============================================================================
// Favorites Router
// =============================================================================

const favoritesRouter = router({
  /**
   * Get user's favorites/watchlist
   */
  list: publicProcedure.input(GetFavoritesInput).query(async ({ ctx, input }) => {
    const { userId, isPublic } = input;

    // Find or create the default watchlist
    let watchlist = await ctx.prisma.userList.findFirst({
      where: {
        userId,
        type: "watchlist",
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
      include: {
        items: {
          orderBy: { addedAt: "desc" },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    // If watchlist doesn't exist, create it
    if (!watchlist) {
      watchlist = await ctx.prisma.userList.create({
        data: {
          userId,
          name: "Watchlist",
          type: "watchlist",
          isPublic: false,
        },
        include: {
          items: {
            orderBy: { addedAt: "desc" },
          },
          _count: {
            select: { items: true },
          },
        },
      });
    }

    return {
      success: true as const,
      watchlist,
    };
  }),

  /**
   * Toggle favorite status for an NFT
   */
  toggle: protectedProcedure.input(ToggleFavoriteInput).mutation(async ({ ctx, input }) => {
    const { nftId } = input;

    // Get user from wallet address
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress.toLowerCase() },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to favorite items",
      });
    }

    const userId = user.id;

    // Find or create the user's favorites list
    let favoritesList = await ctx.prisma.userList.findFirst({
      where: {
        userId,
        type: "favorites",
      },
    });

    if (!favoritesList) {
      favoritesList = await ctx.prisma.userList.create({
        data: {
          userId,
          name: "Favorites",
          type: "favorites",
          isPublic: false,
        },
      });
    }

    // Check if the NFT is already in favorites
    const existingItem = await ctx.prisma.listItem.findUnique({
      where: {
        listId_itemType_itemId: {
          listId: favoritesList.id,
          itemType: "nft",
          itemId: nftId,
        },
      },
    });

    if (existingItem) {
      // Remove from favorites
      await ctx.prisma.listItem.delete({
        where: { id: existingItem.id },
      });
      return { favorited: false };
    } else {
      // Get NFT info for metadata
      const nft = await ctx.prisma.nft.findUnique({
        where: { id: nftId },
        select: {
          id: true,
          name: true,
          image: true,
          collectionId: true,
          collection: { select: { name: true } },
        },
      });

      // Add to favorites
      await ctx.prisma.listItem.create({
        data: {
          listId: favoritesList.id,
          itemType: "nft",
          itemId: nftId,
          collectionId: nft?.collectionId,
          metadata: nft ? {
            name: nft.name,
            image: nft.image,
            collectionName: nft.collection?.name,
          } : undefined,
        },
      });
      return { favorited: true };
    }
  }),

  /**
   * Check if an NFT is favorited by the current user
   */
  check: publicProcedure.input(CheckFavoriteInput).query(async ({ ctx, input }) => {
    const { nftId } = input;

    if (!ctx.walletAddress) {
      return { favorited: false };
    }

    // Get user from wallet address
    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: ctx.walletAddress.toLowerCase() },
    });

    if (!user) {
      return { favorited: false };
    }

    // Find the user's favorites list
    const favoritesList = await ctx.prisma.userList.findFirst({
      where: {
        userId: user.id,
        type: "favorites",
      },
    });

    if (!favoritesList) {
      return { favorited: false };
    }

    // Check if the NFT is in favorites
    const existingItem = await ctx.prisma.listItem.findUnique({
      where: {
        listId_itemType_itemId: {
          listId: favoritesList.id,
          itemType: "nft",
          itemId: nftId,
        },
      },
    });

    return { favorited: !!existingItem };
  }),
});

// =============================================================================
// Reports Router
// =============================================================================

const reportsRouter = router({
  /**
   * Create a report for an NFT, collection, or user
   */
  create: publicProcedure.input(CreateReportInput).mutation(async ({ ctx, input }) => {
    const { type, targetId, reason, details } = input;

    // Get user ID if wallet is connected
    let reporterId: string | null = null;
    if (ctx.walletAddress) {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: ctx.walletAddress.toLowerCase() },
      });
      reporterId = user?.id || null;
    }

    // Create the report
    await ctx.prisma.report.create({
      data: {
        type,
        targetId,
        reason,
        details,
        reporterId,
        reporterAddress: ctx.walletAddress || null,
      },
    });

    return { success: true };
  }),
});

// =============================================================================
// NFTs Router
// =============================================================================

const nftsRouter = router({
  /**
   * Get user's NFTs with filtering and sorting
   */
  list: publicProcedure.input(GetNFTsInput).query(async ({ ctx, input }) => {
    const {
      address,
      page,
      limit,
      filter,
      search,
      sortBy,
      chains,
      collections,
      minPrice,
      maxPrice,
      status,
    } = input;

    const user = await auth.getUserByWallet(address);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const normalizedAddress = user.walletAddress.toLowerCase();

    // Build the base query based on filter
    let whereClause: Prisma.NftWhereInput = {};

    if (filter === "owned") {
      whereClause = {
        ownerAddress: { equals: normalizedAddress, mode: "insensitive" },
        isOnChain: true,
      };
    } else if (filter === "created") {
      whereClause = {
        collection: {
          creatorAddress: { equals: normalizedAddress, mode: "insensitive" },
        },
        isOnChain: true,
      };
    } else if (filter === "drafts") {
      whereClause = {
        collection: {
          creatorAddress: { equals: normalizedAddress, mode: "insensitive" },
        },
        isMinted: true,
        isOnChain: false,
      };
    } else {
      whereClause = {
        OR: [
          {
            ownerAddress: { equals: normalizedAddress, mode: "insensitive" },
            isOnChain: true,
          },
          {
            collection: {
              creatorAddress: { equals: normalizedAddress, mode: "insensitive" },
            },
            isOnChain: true,
          },
        ],
      };
    }

    // Get NFTs from database
    const allNFTs = await ctx.prisma.nft.findMany({
      where: whereClause,
      include: {
        collection: {
          select: {
            name: true,
            symbol: true,
            creatorAddress: true,
            chainId: true,
            address: true,
            floorPrice: true,
            image: true,
          },
        },
        traits: true,
        marketplaceListings: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            listingId: true,
            listingType: true,
            pricePerToken: true,
            highestBid: true,
            highestBidder: true,
            minimumBidAmount: true,
            buyoutBidAmount: true,
            endTimestamp: true,
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Transform database NFTs to frontend format
    let transformedNFTs = allNFTs.map((nft) => {
      const activeListing = nft.marketplaceListings?.[0] || null;
      const isAuction = nft.listingType === "auction" || activeListing?.listingType === "auction";
      const hasOffer = activeListing?.highestBid != null && activeListing.highestBid > 0;

      return {
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description || "",
        image: nft.image,
        collectionName: nft.collection.name,
        collectionSlug: nft.collection.name.toLowerCase().replace(/\s+/g, "-"),
        contractAddress: nft.collection.address,
        chain: getChainName(nft.collection.chainId),
        collectionId: nft.collectionId,
        rarity: nft.rarityTier || "Common",
        rarityScore: nft.rarityScore,
        rarityTier: nft.rarityTier,
        rank: nft.rarityRank || Math.floor(Math.random() * 10000) + 1,
        traits: nft.traits.reduce((acc: Record<string, string>, trait) => {
          acc[trait.traitType] = trait.value;
          return acc;
        }, {}),
        owned: nft.ownerAddress?.toLowerCase() === normalizedAddress,
        created: nft.collection.creatorAddress.toLowerCase() === normalizedAddress,
        price: nft.listingPrice,
        listingPrice: nft.listingPrice,
        lastSale: null,
        floorPrice: nft.collection.floorPrice || 0,
        listed: nft.isListed,
        isListed: nft.isListed,
        listingType: nft.listingType,
        auction: isAuction && nft.isListed,
        new: Date.now() - new Date(nft.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
        topBid: hasOffer
          ? {
              amount: activeListing?.highestBid ?? null,
              bidder: activeListing?.highestBidder ?? null,
              minimumBid: activeListing?.minimumBidAmount ?? null,
              buyoutPrice: activeListing?.buyoutBidAmount ?? null,
            }
          : null,
        hasOffers: hasOffer,
        likes: Math.floor(Math.random() * 500) + 10,
        views: Math.floor(Math.random() * 2000) + 100,
        lastViewed: nft.updatedAt,
        royalty: 5.0,
        createdAt: nft.createdAt,
        updatedAt: nft.updatedAt,
        isOnChain: nft.isOnChain || false,
        onChainTokenId: nft.onChainTokenId,
        collection: {
          name: nft.collection.name,
          symbol: nft.collection.symbol,
          image: nft.collection.image,
          address: nft.collection.address,
          floorPrice: nft.collection.floorPrice,
        },
        listingDetails: activeListing
          ? {
              listingId: activeListing.listingId,
              endTimestamp: activeListing.endTimestamp,
            }
          : null,
      };
    });

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      transformedNFTs = transformedNFTs.filter(
        (nft) =>
          nft.name.toLowerCase().includes(searchLower) ||
          nft.collectionName.toLowerCase().includes(searchLower)
      );
    }

    if (chains && chains.length > 0) {
      transformedNFTs = transformedNFTs.filter((nft) => chains.includes(nft.chain));
    }

    if (collections && collections.length > 0) {
      transformedNFTs = transformedNFTs.filter((nft) => collections.includes(nft.collectionName));
    }

    if ((minPrice && minPrice > 0) || (maxPrice && maxPrice < 999999)) {
      transformedNFTs = transformedNFTs.filter((nft) => {
        const price = nft.price || nft.lastSale || 0;
        return price >= (minPrice || 0) && price <= (maxPrice || 999999);
      });
    }

    if (status) {
      switch (status) {
        case "listed":
          transformedNFTs = transformedNFTs.filter((nft) => nft.listed && !nft.auction);
          break;
        case "unlisted":
          transformedNFTs = transformedNFTs.filter((nft) => !nft.listed);
          break;
        case "on_auction":
        case "auction":
          transformedNFTs = transformedNFTs.filter((nft) => nft.auction);
          break;
        case "has_offers":
        case "hasOffers":
          transformedNFTs = transformedNFTs.filter((nft) => nft.hasOffers || nft.topBid);
          break;
        case "new":
          transformedNFTs = transformedNFTs.filter((nft) => nft.new);
          break;
      }
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        transformedNFTs.sort((a, b) => (a.price || 999) - (b.price || 999));
        break;
      case "price-high":
        transformedNFTs.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rarity-rare":
        transformedNFTs.sort((a, b) => a.rank - b.rank);
        break;
      case "rarity-common":
        transformedNFTs.sort((a, b) => b.rank - a.rank);
        break;
      case "most-liked":
        transformedNFTs.sort((a, b) => b.likes - a.likes);
        break;
      case "oldest":
        transformedNFTs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case "recent":
      default:
        transformedNFTs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedNFTs = transformedNFTs.slice(skip, skip + limit);
    const totalPages = Math.ceil(transformedNFTs.length / limit);

    // Get available collections and chains for filtering
    const availableCollections = [...new Set(transformedNFTs.map((nft) => nft.collectionName))];
    const availableChains = [...new Set(transformedNFTs.map((nft) => nft.chain))];

    // Count stats
    const [totalDrafts, totalOwned, totalCreated] = await Promise.all([
      ctx.prisma.nft.count({
        where: {
          collection: {
            creatorAddress: { equals: normalizedAddress, mode: "insensitive" },
          },
          isMinted: true,
          isOnChain: false,
        },
      }),
      ctx.prisma.nft.count({
        where: {
          ownerAddress: { equals: normalizedAddress, mode: "insensitive" },
          isOnChain: true,
        },
      }),
      ctx.prisma.nft.count({
        where: {
          collection: {
            creatorAddress: { equals: normalizedAddress, mode: "insensitive" },
          },
          isOnChain: true,
        },
      }),
    ]);

    return {
      success: true as const,
      nfts: paginatedNFTs,
      pagination: {
        page,
        limit,
        total: transformedNFTs.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        availableCollections,
        availableChains,
        totalOwned,
        totalCreated,
        totalDrafts,
        totalListed: transformedNFTs.filter((nft) => nft.listed).length,
        totalOnAuction: transformedNFTs.filter((nft) => nft.auction).length,
        totalWithOffers: transformedNFTs.filter((nft) => nft.hasOffers || nft.topBid).length,
        totalUnlisted: transformedNFTs.filter((nft) => !nft.listed).length,
      },
    };
  }),

  /**
   * Get owned NFTs for a wallet address (for lootbox/transfer operations)
   */
  owned: publicProcedure.input(z.object({ address: z.string().min(1) })).query(async ({ ctx, input }) => {
    const { getContract } = await import("thirdweb");
    const { getOwnedNFTs } = await import("thirdweb/extensions/erc721");
    const { getOwnedTokenIds } = await import("thirdweb/extensions/erc1155");
    const { client } = await import("@/lib/thirdweb");
    const { defineChain } = await import("thirdweb/chains");

    const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "11155111";
    const chain = defineChain(parseInt(CHAIN_ID));

    const { address } = input;

    // Fetch collections the user owns NFTs from
    const collections = await ctx.prisma.collection.findMany({
      where: {
        nfts: {
          some: {
            ownerAddress: address.toLowerCase(),
          },
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    const ownedNFTs: Array<{
      id: string;
      contractAddress: string;
      tokenId: string;
      name: string;
      image: string;
      collectionName: string;
      tokenType: "ERC721" | "ERC1155";
      balance?: number;
      isOnChain: boolean;
      onChainTokenId?: string;
    }> = [];

    // If user has collections, query those contracts
    if (collections.length > 0) {
      for (const collection of collections) {
        if (!collection.address) continue;

        try {
          const contract = getContract({
            client,
            chain,
            address: collection.address,
          });

          // Try ERC721 first (most common)
          try {
            const nfts = await getOwnedNFTs({
              contract,
              owner: address,
            });

            for (const nft of nfts) {
              ownedNFTs.push({
                id: `${collection.address}-${nft.id.toString()}`,
                contractAddress: collection.address,
                tokenId: nft.id.toString(),
                name: nft.metadata?.name || `#${nft.id.toString()}`,
                image: nft.metadata?.image || "/api/placeholder/400/400",
                collectionName: collection.name,
                tokenType: "ERC721",
                isOnChain: true, // These are confirmed on-chain via getOwnedNFTs
                onChainTokenId: nft.id.toString(),
              });
            }
          } catch {
            // If ERC721 fails, try ERC1155
            try {
              const ownedTokens = await getOwnedTokenIds({
                contract,
                address,
              });

              for (const token of ownedTokens) {
                ownedNFTs.push({
                  id: `${collection.address}-${token.tokenId.toString()}`,
                  contractAddress: collection.address,
                  tokenId: token.tokenId.toString(),
                  name: `${collection.name} #${token.tokenId.toString()}`,
                  image: "/api/placeholder/400/400",
                  collectionName: collection.name,
                  tokenType: "ERC1155",
                  balance: Number(token.balance),
                  isOnChain: true, // These are confirmed on-chain via getOwnedTokenIds
                  onChainTokenId: token.tokenId.toString(),
                });
              }
            } catch {
              // Neither standard worked, skip this collection
            }
          }
        } catch (contractError) {
          console.error(`Error fetching from ${collection.address}:`, contractError);
        }
      }
    }

    // Also try to fetch from any NFTs stored in our database
    const dbNfts = await ctx.prisma.nft.findMany({
      where: {
        ownerAddress: address.toLowerCase(),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      take: 100,
    });

    // Add database NFTs if not already included
    // Build a set of on-chain token IDs we already have for deduplication
    const existingOnChainIds = new Set(
      ownedNFTs.map((n) => `${n.contractAddress.toLowerCase()}-${n.tokenId}`)
    );

    for (const nft of dbNfts) {
      const contractAddr = nft.collection?.address || "";
      const contractAddrLower = contractAddr.toLowerCase();

      // Use onChainTokenId for deduplication if available (most reliable)
      // This prevents adding a DB entry when on-chain query already found it
      if (nft.onChainTokenId && contractAddr) {
        const onChainKey = `${contractAddrLower}-${nft.onChainTokenId}`;
        if (existingOnChainIds.has(onChainKey)) {
          // Already have this NFT from on-chain query, skip DB version
          continue;
        }
      }

      const cleanTokenId = nft.tokenId.includes("-") ? nft.tokenId.split("-")[0] : nft.tokenId;
      // Use onChainTokenId if available, otherwise fall back to cleanTokenId
      const tokenIdToUse = nft.onChainTokenId || cleanTokenId;
      const existingId = `${contractAddr}-${tokenIdToUse}`;

      if (!ownedNFTs.some((n) => n.id === existingId)) {
        ownedNFTs.push({
          id: existingId,
          contractAddress: contractAddr,
          tokenId: tokenIdToUse,
          name: nft.name,
          image: nft.image || "/api/placeholder/400/400",
          collectionName: nft.collection?.name || "Unknown Collection",
          tokenType: "ERC721",
          isOnChain: nft.isOnChain, // Use database flag
          onChainTokenId: nft.onChainTokenId || undefined,
        });
      }
    }

    return {
      success: true as const,
      nfts: ownedNFTs,
      count: ownedNFTs.length,
    };
  }),
});

// =============================================================================
// Followers Router
// =============================================================================

const followersRouter = router({
  /**
   * Get user's followers
   */
  list: publicProcedure.input(GetFollowersInput).query(async ({ ctx, input }) => {
    const { address, page, limit } = input;

    const normalizedAddress = address.toLowerCase();

    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const [followers, total] = await Promise.all([
      ctx.prisma.userFollow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              profilePicture: true,
              isCreator: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      ctx.prisma.userFollow.count({ where: { followingId: user.id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true as const,
      followers: followers.map((f) => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }),

  /**
   * Get users this user is following
   */
  following: publicProcedure.input(GetFollowingInput).query(async ({ ctx, input }) => {
    const { address, page, limit } = input;

    const normalizedAddress = address.toLowerCase();

    const user = await ctx.prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const [following, total] = await Promise.all([
      ctx.prisma.userFollow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              profilePicture: true,
              isCreator: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      ctx.prisma.userFollow.count({ where: { followerId: user.id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true as const,
      following: following.map((f) => ({
        ...f.following,
        followedAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }),

  /**
   * Get follow status and counts
   */
  status: publicProcedure.input(GetFollowStatusInput).query(async ({ ctx, input }) => {
    const { address, checkerAddress } = input;

    const normalizedAddress = address.toLowerCase();

    const targetUser = await auth.getUserByWallet(normalizedAddress);
    if (!targetUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const [followersCount, followingCount] = await Promise.all([
      ctx.prisma.userFollow.count({
        where: { followingId: targetUser.id },
      }),
      ctx.prisma.userFollow.count({
        where: { followerId: targetUser.id },
      }),
    ]);

    let isFollowing = false;

    if (checkerAddress) {
      const normalizedCheckerAddress = checkerAddress.toLowerCase();
      const checkerUser = await auth.getUserByWallet(normalizedCheckerAddress);

      if (checkerUser) {
        const follow = await ctx.prisma.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: checkerUser.id,
              followingId: targetUser.id,
            },
          },
        });
        isFollowing = !!follow;
      }
    }

    return {
      success: true as const,
      followersCount,
      followingCount,
      isFollowing,
    };
  }),

  /**
   * Follow a user
   */
  follow: protectedProcedure.input(FollowInput).mutation(async ({ ctx, input }) => {
    const { targetAddress, followerAddress } = input;

    // Verify the caller matches the followerAddress
    if (ctx.walletAddress.toLowerCase() !== followerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only follow from your own wallet",
      });
    }

    const normalizedTargetAddress = targetAddress.toLowerCase();
    const normalizedFollowerAddress = followerAddress.toLowerCase();

    // Can't follow yourself
    if (normalizedTargetAddress === normalizedFollowerAddress) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot follow yourself",
      });
    }

    const [targetUser, followerUser] = await Promise.all([
      auth.getUserByWallet(normalizedTargetAddress),
      auth.getUserByWallet(normalizedFollowerAddress),
    ]);

    if (!targetUser || !followerUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or both users not found",
      });
    }

    // Check if already following
    const existingFollow = await ctx.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Already following this user",
      });
    }

    // Create follow relationship
    await ctx.prisma.userFollow.create({
      data: {
        followerId: followerUser.id,
        followingId: targetUser.id,
      },
    });

    // Log the follow activity (non-blocking)
    logFollow(followerUser.id, targetUser.id).catch(console.error);

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      ctx.prisma.userFollow.count({
        where: { followingId: targetUser.id },
      }),
      ctx.prisma.userFollow.count({
        where: { followerId: followerUser.id },
      }),
    ]);

    return {
      success: true as const,
      message: "Successfully followed user",
      following: true,
      followersCount,
      followingCount,
    };
  }),

  /**
   * Unfollow a user
   */
  unfollow: protectedProcedure.input(FollowInput).mutation(async ({ ctx, input }) => {
    const { targetAddress, followerAddress } = input;

    // Verify the caller matches the followerAddress
    if (ctx.walletAddress.toLowerCase() !== followerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only unfollow from your own wallet",
      });
    }

    const normalizedTargetAddress = targetAddress.toLowerCase();
    const normalizedFollowerAddress = followerAddress.toLowerCase();

    const [targetUser, followerUser] = await Promise.all([
      auth.getUserByWallet(normalizedTargetAddress),
      auth.getUserByWallet(normalizedFollowerAddress),
    ]);

    if (!targetUser || !followerUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "One or both users not found",
      });
    }

    // Check if following exists
    const existingFollow = await ctx.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id,
        },
      },
    });

    if (!existingFollow) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Not following this user",
      });
    }

    // Delete follow relationship
    await ctx.prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id,
        },
      },
    });

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      ctx.prisma.userFollow.count({
        where: { followingId: targetUser.id },
      }),
      ctx.prisma.userFollow.count({
        where: { followerId: followerUser.id },
      }),
    ]);

    return {
      success: true as const,
      message: "Successfully unfollowed user",
      following: false,
      followersCount,
      followingCount,
    };
  }),
});

// =============================================================================
// Export Combined User Router
// =============================================================================

export const userRouter = router({
  profile: profileRouter,
  nfts: nftsRouter,
  followers: followersRouter,
  activity: activityRouter,
  favorites: favoritesRouter,
  reports: reportsRouter,
});
