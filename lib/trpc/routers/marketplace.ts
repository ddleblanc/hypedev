/**
 * Marketplace tRPC Router
 * Handles all marketplace-related procedures: listings, auctions, offers, and purchases
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../index";
import { getListingById, getAuctionById, getOfferById, getOffersForNFT, getCollectionOffers as getOnChainCollectionOffers } from "@/lib/marketplace";
import { auth } from "@/lib/auth";
import {
  logListing,
  logListingCanceled,
  logAuctionCreated,
  logOfferMade,
  logOfferCanceled,
  logPurchase,
} from "@/lib/activity";
import {
  getCollectionStats,
  getNFTPriceHistory,
  getNFTPriceHistoryForChart,
  getTrendingCollections,
  getCollectionActivity,
  getNFTActivity,
  getNFTLastSale,
  getNFTTraitRarity,
  getNFTProvenance,
  getNFTOffers,
  getNFTBestOffer,
} from "@/lib/analytics";
import { getFloorPriceChanges, getFloorPriceHistory } from "@/lib/jobs/collection-snapshots";

// =============================================================================
// Input Schemas - Listings
// =============================================================================

const ListingsFilterInput = z.object({
  seller: z.string().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const GetListingInput = z.object({
  listingId: z.string(),
});

const CreateListingInput = z.object({
  nftId: z.string(),
  listingId: z.string(),
  sellerAddress: z.string(),
  assetContractAddress: z.string(),
  tokenId: z.string(),
  pricePerToken: z.number().positive(),
  startTimestamp: z.string().datetime(),
  endTimestamp: z.string().datetime(),
  transactionHash: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

const UpdateListingInput = z.object({
  listingId: z.string(),
  pricePerToken: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).optional(),
});

const CancelListingInput = z.object({
  listingId: z.string(),
});

// =============================================================================
// Input Schemas - Auctions
// =============================================================================

const AuctionsFilterInput = z.object({
  seller: z.string().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const GetAuctionInput = z.object({
  auctionId: z.string(),
});

const CreateAuctionInput = z.object({
  nftId: z.string(),
  auctionId: z.string(),
  sellerAddress: z.string(),
  assetContractAddress: z.string(),
  tokenId: z.string(),
  minimumBidAmount: z.number().positive(),
  buyoutBidAmount: z.number().positive().optional(),
  startTimestamp: z.string().datetime(),
  endTimestamp: z.string().datetime(),
  transactionHash: z.string().optional(),
  quantity: z.number().int().positive().default(1),
});

const UpdateAuctionInput = z.object({
  auctionId: z.string(),
  highestBid: z.number().positive().optional(),
  highestBidder: z.string().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).optional(),
});

const CancelAuctionInput = z.object({
  auctionId: z.string(),
});

// =============================================================================
// Input Schemas - Offers
// =============================================================================

const OffersFilterInput = z.object({
  offeror: z.string().optional(),
  nftId: z.string().optional(),
  assetContract: z.string().optional(),
  tokenId: z.string().optional(),
  status: z.enum(["ACTIVE", "ACCEPTED", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const GetOfferInput = z.object({
  offerId: z.string(),
});

const MakeOfferInput = z.object({
  offerId: z.string(),
  offerorAddress: z.string(),
  assetContractAddress: z.string(),
  tokenId: z.string(),
  offerAmount: z.number().positive(),
  expirationTimestamp: z.string().datetime(),
  transactionHash: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  nftId: z.string().optional(),
});

const AcceptOfferInput = z.object({
  offerId: z.string(),
  transactionHash: z.string().optional(),
});

const CancelOfferInput = z.object({
  offerId: z.string(),
});

// =============================================================================
// Input Schemas - Purchase
// =============================================================================

const RecordPurchaseInput = z.object({
  listingId: z.string(),
  buyerAddress: z.string(),
  transactionHash: z.string(),
  quantity: z.number().int().positive().default(1),
});

const PurchaseHistoryInput = z.object({
  buyer: z.string().optional(),
  seller: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// =============================================================================
// Listings Router
// =============================================================================

const listingsRouter = router({
  /**
   * Get all listings with optional filtering
   */
  list: publicProcedure.input(ListingsFilterInput).query(async ({ ctx, input }) => {
    const { seller, status, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: {
      status: "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED";
      listingType: "direct";
      sellerAddress?: string;
    } = {
      status,
      listingType: "direct",
    };

    if (seller) {
      where.sellerAddress = seller.toLowerCase();
    }

    const [listings, total] = await Promise.all([
      ctx.prisma.marketplaceListing.findMany({
        where,
        include: {
          nft: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  image: true,
                  royaltyPercentage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.prisma.marketplaceListing.count({ where }),
    ]);

    return {
      success: true as const,
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single listing by ID
   */
  byId: publicProcedure.input(GetListingInput).query(async ({ ctx, input }) => {
    const listing = await ctx.prisma.marketplaceListing.findUnique({
      where: { listingId: input.listingId },
      include: {
        nft: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                address: true,
                image: true,
                royaltyPercentage: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found",
      });
    }

    return listing;
  }),

  /**
   * Create a new listing (requires auth)
   */
  create: protectedProcedure.input(CreateListingInput).mutation(async ({ ctx, input }) => {
    // Verify the caller is the seller
    if (ctx.walletAddress.toLowerCase() !== input.sellerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create listings for your own NFTs",
      });
    }

    // Verify the listing exists on-chain (non-blocking)
    try {
      const onChainListing = await getListingById(input.listingId);
      if (!onChainListing) {
        console.warn(
          `Listing ${input.listingId} not found on-chain yet, proceeding with DB save anyway`
        );
      }
    } catch (chainError) {
      console.error("Error fetching on-chain listing:", chainError);
    }

    // Create listing and update NFT in transaction
    const result = await ctx.prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.create({
        data: {
          listingId: input.listingId,
          nftId: input.nftId,
          sellerAddress: input.sellerAddress.toLowerCase(),
          assetContractAddress: input.assetContractAddress.toLowerCase(),
          tokenId: input.tokenId,
          quantity: input.quantity,
          pricePerToken: input.pricePerToken,
          listingType: "direct",
          startTimestamp: new Date(input.startTimestamp),
          endTimestamp: new Date(input.endTimestamp),
          transactionHash: input.transactionHash,
          status: "ACTIVE",
        },
      });

      const updatedNft = await tx.nft.update({
        where: { id: input.nftId },
        data: {
          isListed: true,
          listingPrice: input.pricePerToken,
          listingId: input.listingId,
          listingType: "direct",
          listingExpiry: new Date(input.endTimestamp),
          listedAt: new Date(),
        },
      });

      return { listing, updatedNft };
    });

    // Log activity (non-blocking)
    logListingActivity(ctx, input).catch(console.error);

    return {
      success: true as const,
      listing: result.listing,
      nft: result.updatedNft,
    };
  }),

  /**
   * Update a listing
   */
  update: protectedProcedure.input(UpdateListingInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.prisma.$transaction(async (tx) => {
      const existingListing = await tx.marketplaceListing.findUnique({
        where: { listingId: input.listingId },
      });

      if (!existingListing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Verify ownership
      if (existingListing.sellerAddress.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own listings",
        });
      }

      const listing = await tx.marketplaceListing.update({
        where: { listingId: input.listingId },
        data: {
          pricePerToken: input.pricePerToken ?? existingListing.pricePerToken,
          status: input.status ?? existingListing.status,
        },
      });

      // Clear NFT listing data if cancelled or sold
      if (input.status === "CANCELLED" || input.status === "SOLD") {
        await tx.nft.update({
          where: { id: existingListing.nftId },
          data: {
            isListed: false,
            listingPrice: null,
            listingId: null,
            listingType: null,
            listingExpiry: null,
            listedAt: null,
          },
        });
      }

      return listing;
    });

    return { success: true as const, listing: result };
  }),

  /**
   * Cancel a listing (requires auth and ownership)
   */
  cancel: protectedProcedure.input(CancelListingInput).mutation(async ({ ctx, input }) => {
    // Find the listing
    const existingListing = await ctx.prisma.marketplaceListing.findUnique({
      where: { listingId: input.listingId },
    });

    if (!existingListing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found",
      });
    }

    // Verify ownership
    if (existingListing.sellerAddress.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own listings",
      });
    }

    // Verify listing is cancelled on-chain
    try {
      const onChainListing = await getListingById(input.listingId);
      if (
        onChainListing &&
        (onChainListing.status === "CREATED" || Number(onChainListing.status) === 1)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Listing is still active on-chain. Please complete the cancellation transaction first.",
        });
      }
    } catch (e) {
      if (e instanceof TRPCError) throw e;
      // Ignore other errors - listing may not exist on-chain anymore
    }

    // Cancel listing and update NFT
    const result = await ctx.prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.update({
        where: { listingId: input.listingId },
        data: { status: "CANCELLED" },
      });

      await tx.nft.update({
        where: { id: existingListing.nftId },
        data: {
          isListed: false,
          listingPrice: null,
          listingId: null,
          listingType: null,
          listingExpiry: null,
          listedAt: null,
        },
      });

      return listing;
    });

    // Log cancellation (non-blocking)
    logCancellationActivity(ctx, existingListing, input.listingId).catch(console.error);

    return { success: true as const, listing: result };
  }),
});

// =============================================================================
// Auctions Router
// =============================================================================

const auctionsRouter = router({
  /**
   * Get all auctions with optional filtering
   */
  list: publicProcedure.input(AuctionsFilterInput).query(async ({ ctx, input }) => {
    const { seller, status, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: {
      status: "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED";
      listingType: "auction";
      sellerAddress?: string;
    } = {
      status,
      listingType: "auction",
    };

    if (seller) {
      where.sellerAddress = seller.toLowerCase();
    }

    const [auctions, total] = await Promise.all([
      ctx.prisma.marketplaceListing.findMany({
        where,
        include: {
          nft: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  image: true,
                  royaltyPercentage: true,
                },
              },
            },
          },
        },
        orderBy: { endTimestamp: "asc" }, // Show ending soonest first
        skip,
        take: limit,
      }),
      ctx.prisma.marketplaceListing.count({ where }),
    ]);

    return {
      success: true as const,
      auctions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single auction by ID
   */
  byId: publicProcedure.input(GetAuctionInput).query(async ({ ctx, input }) => {
    const auction = await ctx.prisma.marketplaceListing.findFirst({
      where: {
        listingId: input.auctionId,
        listingType: "auction",
      },
      include: {
        nft: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                address: true,
                image: true,
                royaltyPercentage: true,
              },
            },
          },
        },
      },
    });

    if (!auction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Auction not found",
      });
    }

    return auction;
  }),

  /**
   * Create a new auction (requires auth)
   */
  create: protectedProcedure.input(CreateAuctionInput).mutation(async ({ ctx, input }) => {
    // Verify the caller is the seller
    if (ctx.walletAddress.toLowerCase() !== input.sellerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only create auctions for your own NFTs",
      });
    }

    // Verify the auction exists on-chain (non-blocking)
    try {
      const onChainAuction = await getAuctionById(input.auctionId);
      if (!onChainAuction) {
        console.warn(
          `Auction ${input.auctionId} not found on-chain yet, proceeding with DB save anyway`
        );
      }
    } catch (chainError) {
      console.error("Error fetching on-chain auction:", chainError);
    }

    // Get the seller's user ID for activity logging
    const seller = await auth.getUserByWallet(input.sellerAddress);

    // Create the auction record and update NFT in a transaction
    const result = await ctx.prisma.$transaction(async (tx) => {
      const auction = await tx.marketplaceListing.create({
        data: {
          listingId: input.auctionId,
          nftId: input.nftId,
          sellerAddress: input.sellerAddress.toLowerCase(),
          assetContractAddress: input.assetContractAddress.toLowerCase(),
          tokenId: input.tokenId,
          quantity: input.quantity,
          pricePerToken: input.minimumBidAmount, // Store minimum bid as price
          listingType: "auction",
          minimumBidAmount: input.minimumBidAmount,
          buyoutBidAmount: input.buyoutBidAmount,
          startTimestamp: new Date(input.startTimestamp),
          endTimestamp: new Date(input.endTimestamp),
          transactionHash: input.transactionHash,
          status: "ACTIVE",
        },
      });

      const updatedNft = await tx.nft.update({
        where: { id: input.nftId },
        data: {
          isListed: true,
          listingPrice: input.minimumBidAmount,
          listingId: input.auctionId,
          listingType: "auction",
          listingExpiry: new Date(input.endTimestamp),
          listedAt: new Date(),
        },
      });

      return { auction, updatedNft };
    });

    // Log activity (non-blocking)
    if (seller) {
      logAuctionCreated(
        seller.id,
        input.nftId,
        input.auctionId,
        input.minimumBidAmount,
        result.updatedNft.collectionId,
        input.transactionHash
      ).catch(console.error);
    }

    return {
      success: true as const,
      auction: result.auction,
      nft: result.updatedNft,
    };
  }),

  /**
   * Update an auction (record bids, update status)
   */
  update: protectedProcedure.input(UpdateAuctionInput).mutation(async ({ ctx, input }) => {
    const result = await ctx.prisma.$transaction(async (tx) => {
      const existingAuction = await tx.marketplaceListing.findFirst({
        where: {
          listingId: input.auctionId,
          listingType: "auction",
        },
      });

      if (!existingAuction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auction not found",
        });
      }

      const auction = await tx.marketplaceListing.update({
        where: { id: existingAuction.id },
        data: {
          highestBid: input.highestBid ?? existingAuction.highestBid,
          highestBidder: input.highestBidder ?? existingAuction.highestBidder,
          status: input.status ?? existingAuction.status,
        },
      });

      // If auction is cancelled or sold, update NFT
      if (input.status === "CANCELLED" || input.status === "SOLD") {
        await tx.nft.update({
          where: { id: existingAuction.nftId },
          data: {
            isListed: false,
            listingPrice: null,
            listingId: null,
            listingType: null,
            listingExpiry: null,
            listedAt: null,
          },
        });
      }

      return auction;
    });

    return { success: true as const, auction: result };
  }),

  /**
   * Cancel an auction (only if no bids, requires auth and ownership)
   */
  cancel: protectedProcedure.input(CancelAuctionInput).mutation(async ({ ctx, input }) => {
    // Find the auction
    const existingAuction = await ctx.prisma.marketplaceListing.findFirst({
      where: {
        listingId: input.auctionId,
        listingType: "auction",
      },
    });

    if (!existingAuction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Auction not found",
      });
    }

    // Verify ownership
    if (existingAuction.sellerAddress.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own auctions",
      });
    }

    // Check if there are any bids
    if (existingAuction.highestBid && existingAuction.highestBid > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot cancel auction with active bids",
      });
    }

    // Verify the auction is cancelled on-chain
    try {
      const onChainAuction = await getAuctionById(input.auctionId);
      if (
        onChainAuction &&
        (onChainAuction.status === "CREATED" || Number(onChainAuction.status) === 1)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Auction is still active on-chain. Please complete the cancellation transaction first.",
        });
      }
    } catch (e) {
      if (e instanceof TRPCError) throw e;
      // Ignore other errors
    }

    // Cancel the auction and update NFT
    const result = await ctx.prisma.$transaction(async (tx) => {
      const auction = await tx.marketplaceListing.update({
        where: { id: existingAuction.id },
        data: { status: "CANCELLED" },
      });

      await tx.nft.update({
        where: { id: existingAuction.nftId },
        data: {
          isListed: false,
          listingPrice: null,
          listingId: null,
          listingType: null,
          listingExpiry: null,
          listedAt: null,
        },
      });

      return auction;
    });

    return { success: true as const, auction: result };
  }),
});

// =============================================================================
// Offers Router
// =============================================================================

const offersRouter = router({
  /**
   * Get all offers with optional filtering
   * Queries BOTH database AND blockchain for comprehensive results
   */
  list: publicProcedure.input(OffersFilterInput).query(async ({ ctx, input }) => {
    const { offeror, nftId, assetContract, tokenId, status, page, limit } = input;
    const skip = (page - 1) * limit;

    console.log("[offersRouter.list] Input:", { offeror, nftId, assetContract, tokenId, status, page, limit });

    const where: {
      status: "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
      offerorAddress?: string;
      nftId?: string;
      assetContractAddress?: string;
      tokenId?: string;
    } = { status };

    if (offeror) {
      where.offerorAddress = offeror.toLowerCase();
    }

    if (nftId) {
      where.nftId = nftId;
    }

    if (assetContract && tokenId) {
      where.assetContractAddress = assetContract.toLowerCase();
      where.tokenId = tokenId;
    }

    console.log("[offersRouter.list] Where clause:", JSON.stringify(where, null, 2));

    // Query database for offers
    const [dbOffers, dbTotal] = await Promise.all([
      ctx.prisma.marketplaceOffer.findMany({
        where,
        include: {
          nft: {
            include: {
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.prisma.marketplaceOffer.count({ where }),
    ]);

    console.log("[offersRouter.list] DB Results:", { dbOffersCount: dbOffers.length, dbTotal });

    // Also query blockchain for on-chain offers if we have assetContract and tokenId
    let onChainOffers: any[] = [];
    if (assetContract && tokenId && status === "ACTIVE") {
      try {
        console.log("[offersRouter.list] Fetching on-chain offers for:", { assetContract, tokenId });
        const chainOffers = await getOffersForNFT(assetContract, tokenId);
        console.log("[offersRouter.list] On-chain offers found:", chainOffers.length);

        // Transform on-chain offers to match our format
        // Only include active offers (status === 1)
        onChainOffers = chainOffers
          .filter((offer: any) => offer.status === 1) // 1 = CREATED/ACTIVE
          .map((offer: any) => ({
            offerId: offer.id.toString(),
            nftId: nftId || null,
            assetContractAddress: offer.assetContractAddress.toLowerCase(),
            tokenId: offer.tokenId.toString(),
            offerAmount: Number(offer.totalPrice) / 1e18, // Convert from wei
            offerorAddress: offer.offerorAddress.toLowerCase(),
            currency: offer.currency,
            status: "ACTIVE" as const,
            expirationTimestamp: new Date(Number(offer.expirationTimestamp) * 1000),
            createdAt: new Date(),
            transactionHash: null,
            nft: null, // Will be populated below if needed
            isOnChain: true, // Flag to indicate this is from blockchain
          }));

        console.log("[offersRouter.list] Transformed on-chain offers:", onChainOffers.length);
      } catch (error) {
        console.error("[offersRouter.list] Error fetching on-chain offers:", error);
      }
    }

    // Merge DB and on-chain offers, avoiding duplicates by offerId
    const dbOfferIds = new Set(dbOffers.map((o) => o.offerId));
    const uniqueOnChainOffers = onChainOffers.filter((o) => !dbOfferIds.has(o.offerId));

    const allOffers = [...dbOffers, ...uniqueOnChainOffers];
    const total = dbTotal + uniqueOnChainOffers.length;

    console.log("[offersRouter.list] Merged results:", {
      dbOffers: dbOffers.length,
      uniqueOnChainOffers: uniqueOnChainOffers.length,
      total
    });

    // Fetch offeror user info for all offers
    const offerorAddresses = [...new Set(allOffers.map((o) => o.offerorAddress))];
    const users = await ctx.prisma.user.findMany({
      where: { walletAddress: { in: offerorAddresses } },
      select: { walletAddress: true, username: true, profilePicture: true },
    });
    const userMap = new Map(users.map((u) => [u.walletAddress.toLowerCase(), u]));

    const offersWithUserInfo = allOffers.map((offer) => ({
      ...offer,
      offeror: userMap.get(offer.offerorAddress) || null,
    }));

    return {
      success: true as const,
      offers: offersWithUserInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single offer by ID
   */
  byId: publicProcedure.input(GetOfferInput).query(async ({ ctx, input }) => {
    const offer = await ctx.prisma.marketplaceOffer.findUnique({
      where: { offerId: input.offerId },
      include: {
        nft: {
          include: {
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
      },
    });

    if (!offer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    // Get offeror info
    const offeror = await ctx.prisma.user.findUnique({
      where: { walletAddress: offer.offerorAddress },
      select: { walletAddress: true, username: true, profilePicture: true },
    });

    return { ...offer, offeror };
  }),

  /**
   * Make an offer on an NFT (requires auth)
   */
  make: protectedProcedure.input(MakeOfferInput).mutation(async ({ ctx, input }) => {
    console.log("[offersRouter.make] Input:", {
      offerId: input.offerId,
      offerorAddress: input.offerorAddress,
      assetContractAddress: input.assetContractAddress,
      tokenId: input.tokenId,
      nftId: input.nftId,
      offerAmount: input.offerAmount,
    });

    // Verify the caller is the offeror
    if (ctx.walletAddress.toLowerCase() !== input.offerorAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only make offers with your own wallet",
      });
    }

    // Get the offeror user record
    const offeror = await auth.getUserByWallet(input.offerorAddress);
    if (!offeror) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found. Please connect your wallet first.",
      });
    }

    // Try to find the NFT in our database
    let nftId = input.nftId;
    let nft = null;
    if (!nftId) {
      const collection = await ctx.prisma.collection.findUnique({
        where: { address: input.assetContractAddress.toLowerCase() },
      });
      console.log("[offersRouter.make] Found collection:", collection?.id, collection?.name);

      if (collection) {
        nft = await ctx.prisma.nft.findFirst({
          where: {
            collectionId: collection.id,
            OR: [{ tokenId: input.tokenId }, { onChainTokenId: input.tokenId }],
          },
          include: { collection: true },
        });
        console.log("[offersRouter.make] Found NFT:", nft?.id, nft?.name, "tokenId:", nft?.tokenId);
        nftId = nft?.id;
      }
    } else {
      nft = await ctx.prisma.nft.findUnique({
        where: { id: nftId },
        include: { collection: true },
      });
      console.log("[offersRouter.make] NFT by ID:", nft?.id, nft?.name);
    }

    // Verify the offer exists on-chain (non-blocking)
    try {
      const onChainOffer = await getOfferById(input.offerId);
      if (!onChainOffer) {
        console.warn(`Offer ${input.offerId} not found on-chain yet, proceeding anyway`);
      }
    } catch (chainError) {
      console.log("Error fetching on-chain offer:", chainError);
    }

    // Create the offer record
    const offerData = {
      offerId: input.offerId,
      nftId: nftId || null,
      offerorAddress: input.offerorAddress.toLowerCase(),
      assetContractAddress: input.assetContractAddress.toLowerCase(),
      tokenId: input.tokenId,
      quantity: input.quantity,
      offerAmount: input.offerAmount,
      expirationTimestamp: new Date(input.expirationTimestamp),
      transactionHash: input.transactionHash,
      status: "ACTIVE" as const,
    };

    console.log("[offersRouter.make] Creating offer with data:", JSON.stringify(offerData, null, 2));

    const offer = await ctx.prisma.marketplaceOffer.create({
      data: offerData,
    });

    console.log("[offersRouter.make] Offer created successfully:", {
      id: offer.id,
      offerId: offer.offerId,
      nftId: offer.nftId,
      assetContractAddress: offer.assetContractAddress,
      tokenId: offer.tokenId,
      status: offer.status,
    });

    // Log the offer activity (non-blocking)
    logOfferActivity(ctx, offeror, nft, input).catch(console.error);

    return { success: true as const, offer };
  }),

  /**
   * Accept an offer (requires auth and NFT ownership)
   */
  accept: protectedProcedure.input(AcceptOfferInput).mutation(async ({ ctx, input }) => {
    // Find the offer
    const offer = await ctx.prisma.marketplaceOffer.findUnique({
      where: { offerId: input.offerId },
      include: { nft: true },
    });

    if (!offer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    if (offer.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Offer is not active (current status: ${offer.status})`,
      });
    }

    // Verify the caller is the NFT owner
    if (offer.nft && offer.nft.ownerAddress?.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only accept offers for NFTs you own",
      });
    }

    // Update offer status
    const result = await ctx.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.marketplaceOffer.update({
        where: { offerId: input.offerId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          transactionHash: input.transactionHash,
        },
      });

      // Update NFT ownership if we have the NFT in our DB
      if (offer.nftId) {
        await tx.nft.update({
          where: { id: offer.nftId },
          data: {
            ownerAddress: offer.offerorAddress,
            isListed: false,
            listingPrice: null,
            listingId: null,
            listingType: null,
            listingExpiry: null,
            listedAt: null,
          },
        });
      }

      return updatedOffer;
    });

    return { success: true as const, offer: result };
  }),

  /**
   * Cancel an offer (requires auth and offeror ownership)
   */
  cancel: protectedProcedure.input(CancelOfferInput).mutation(async ({ ctx, input }) => {
    // Find the offer
    const existingOffer = await ctx.prisma.marketplaceOffer.findUnique({
      where: { offerId: input.offerId },
      include: { nft: true },
    });

    if (!existingOffer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    // Verify ownership
    if (existingOffer.offerorAddress.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own offers",
      });
    }

    // Get the user for activity logging
    const user = await auth.getUserByWallet(existingOffer.offerorAddress);

    // Cancel the offer
    const result = await ctx.prisma.marketplaceOffer.update({
      where: { offerId: input.offerId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Log the cancellation activity (non-blocking)
    if (user) {
      logOfferCanceled(
        user.id,
        existingOffer.nftId || "",
        input.offerId,
        existingOffer.nft?.collectionId
      ).catch(console.error);
    }

    return { success: true as const, offer: result };
  }),
});

// =============================================================================
// Purchase Router
// =============================================================================

const purchaseRouter = router({
  /**
   * Record a successful purchase after on-chain transaction
   */
  record: protectedProcedure.input(RecordPurchaseInput).mutation(async ({ ctx, input }) => {
    // Verify the caller is the buyer
    if (ctx.walletAddress.toLowerCase() !== input.buyerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only record purchases for your own wallet",
      });
    }

    // Get buyer user record
    const buyer = await auth.getUserByWallet(input.buyerAddress);
    if (!buyer) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Buyer not found. Please connect your wallet first.",
      });
    }

    // Find the listing
    const listing = await ctx.prisma.marketplaceListing.findUnique({
      where: { listingId: input.listingId },
      include: {
        nft: {
          include: { collection: true },
        },
      },
    });

    if (!listing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found",
      });
    }

    if (listing.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Listing is not active (current status: ${listing.status})`,
      });
    }

    // Verify purchase on-chain (non-blocking warning)
    try {
      const onChainListing = await getListingById(input.listingId);
      if (
        onChainListing &&
        (onChainListing.status === "CREATED" || Number(onChainListing.status) === 1)
      ) {
        console.warn(`Listing ${input.listingId} is still active on-chain`);
      }
    } catch (chainError) {
      console.log(
        "On-chain listing check failed (expected if purchase completed):",
        chainError
      );
    }

    // Get seller information
    const seller = await auth.getUserByWallet(listing.sellerAddress);

    // Update listing and NFT ownership in transaction
    const result = await ctx.prisma.$transaction(async (tx) => {
      const updatedListing = await tx.marketplaceListing.update({
        where: { listingId: input.listingId },
        data: {
          status: "SOLD",
          transactionHash: input.transactionHash,
        },
      });

      const updatedNft = await tx.nft.update({
        where: { id: listing.nftId },
        data: {
          ownerAddress: input.buyerAddress.toLowerCase(),
          isListed: false,
          listingPrice: null,
          listingId: null,
          listingType: null,
          listingExpiry: null,
          listedAt: null,
        },
      });

      return { listing: updatedListing, nft: updatedNft };
    });

    // Log purchase activity (non-blocking)
    if (seller) {
      logPurchase(
        buyer.id,
        seller.id,
        listing.nftId,
        listing.pricePerToken,
        listing.nft?.collectionId || undefined,
        input.transactionHash
      ).catch(console.error);
    }

    return {
      success: true as const,
      message: "Purchase recorded successfully",
      listing: result.listing,
      nft: result.nft,
      buyer: {
        address: input.buyerAddress,
        id: buyer.id,
      },
      seller: seller
        ? {
            address: listing.sellerAddress,
            id: seller.id,
          }
        : null,
    };
  }),

  /**
   * Get purchase history
   */
  history: publicProcedure.input(PurchaseHistoryInput).query(async ({ ctx, input }) => {
    const { buyer: buyerAddress, seller: sellerAddress, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: {
      type: { in: string[] };
      userId?: string;
    } = {
      type: { in: ["purchase", "listing_sold", "auction_won"] },
    };

    // If buyer is specified, find their user ID
    if (buyerAddress) {
      const buyer = await auth.getUserByWallet(buyerAddress);
      if (!buyer) {
        return {
          success: true as const,
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      where.userId = buyer.id;
      where.type = { in: ["purchase", "auction_won"] };
    }

    // If seller is specified, find their user ID
    if (sellerAddress) {
      const seller = await auth.getUserByWallet(sellerAddress);
      if (!seller) {
        return {
          success: true as const,
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      where.userId = seller.id;
      where.type = { in: ["listing_sold"] };
    }

    const [activities, total] = await Promise.all([
      ctx.prisma.activity.findMany({
        where,
        include: {
          nft: {
            include: {
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
          user: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      ctx.prisma.activity.count({ where }),
    ]);

    return {
      success: true as const,
      purchases: activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        amount: activity.amount,
        transactionHash: activity.transactionHash,
        createdAt: activity.createdAt,
        nft: activity.nft,
        user: activity.user,
        listingId: activity.listingId,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function logListingActivity(
  ctx: { walletAddress: string; prisma: typeof import("@/lib/prisma").prisma },
  data: z.infer<typeof CreateListingInput>
) {
  const seller = await auth.getUserByWallet(data.sellerAddress);
  if (seller) {
    const nftWithCollection = await ctx.prisma.nft.findUnique({
      where: { id: data.nftId },
      select: { collectionId: true },
    });
    await logListing(
      seller.id,
      data.nftId,
      data.listingId,
      data.pricePerToken,
      nftWithCollection?.collectionId,
      data.transactionHash
    );
  }
}

async function logCancellationActivity(
  ctx: { walletAddress: string; prisma: typeof import("@/lib/prisma").prisma },
  listing: { sellerAddress: string; nftId: string },
  listingId: string
) {
  const user = await auth.getUserByWallet(listing.sellerAddress);
  if (user) {
    const nftWithCollection = await ctx.prisma.nft.findUnique({
      where: { id: listing.nftId },
      select: { collectionId: true },
    });
    await logListingCanceled(user.id, listing.nftId, listingId, nftWithCollection?.collectionId);
  }
}

async function logOfferActivity(
  ctx: { walletAddress: string; prisma: typeof import("@/lib/prisma").prisma },
  offeror: { id: string },
  nft: { id?: string; ownerAddress?: string | null; collectionId?: string } | null,
  input: z.infer<typeof MakeOfferInput>
) {
  let ownerId: string | null = null;
  if (nft?.ownerAddress) {
    const owner = await auth.getUserByWallet(nft.ownerAddress);
    ownerId = owner?.id || null;
  }

  await logOfferMade(
    offeror.id,
    ownerId,
    nft?.id || "",
    input.offerId,
    input.offerAmount,
    nft?.collectionId,
    input.transactionHash
  );
}

// =============================================================================
// Input Schemas - Collection Offers
// =============================================================================

const CollectionOffersFilterInput = z.object({
  collectionId: z.string().optional(),
  assetContract: z.string().optional(),
  offeror: z.string().optional(),
  status: z.enum(["ACTIVE", "ACCEPTED", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const MakeCollectionOfferInput = z.object({
  offerId: z.string(),
  collectionId: z.string(),
  assetContractAddress: z.string(),
  offerAmount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  expirationTimestamp: z.string().datetime(),
  transactionHash: z.string(),
});

const AcceptCollectionOfferInput = z.object({
  offerId: z.string(),
  tokenId: z.string(),
  nftId: z.string().optional(),
  transactionHash: z.string(),
});

const CancelCollectionOfferInput = z.object({
  offerId: z.string(),
});

// =============================================================================
// Collection Offers Router
// =============================================================================

const collectionOffersRouter = router({
  /**
   * Get collection offers with optional filtering
   */
  list: publicProcedure.input(CollectionOffersFilterInput).query(async ({ ctx, input }) => {
    const { collectionId, assetContract, offeror, status, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: {
      isCollectionOffer: true;
      status: "ACTIVE" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
      expirationTimestamp: { gt: Date };
      collectionId?: string;
      assetContractAddress?: string;
      offerorAddress?: string;
    } = {
      isCollectionOffer: true,
      status,
      expirationTimestamp: { gt: new Date() },
    };

    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (assetContract) {
      where.assetContractAddress = assetContract.toLowerCase();
    }

    if (offeror) {
      where.offerorAddress = offeror.toLowerCase();
    }

    const [offers, total] = await Promise.all([
      ctx.prisma.marketplaceOffer.findMany({
        where,
        orderBy: [
          { offerAmount: "desc" }, // Highest offers first
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      ctx.prisma.marketplaceOffer.count({ where }),
    ]);

    // Fetch offeror user info
    const offerorAddresses = [...new Set(offers.map((o) => o.offerorAddress))];
    const users = await ctx.prisma.user.findMany({
      where: { walletAddress: { in: offerorAddresses } },
      select: { walletAddress: true, username: true, profilePicture: true },
    });
    const userMap = new Map(users.map((u) => [u.walletAddress.toLowerCase(), u]));

    // Fetch collection info
    const collectionIds = [...new Set(offers.map((o) => o.collectionId).filter(Boolean))] as string[];
    const collections = await ctx.prisma.collection.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, name: true, address: true, image: true, floorPrice: true },
    });
    const collectionMap = new Map(collections.map((c) => [c.id, c]));

    const offersWithDetails = offers.map((offer) => ({
      ...offer,
      offeror: userMap.get(offer.offerorAddress) || null,
      collection: offer.collectionId ? collectionMap.get(offer.collectionId) || null : null,
    }));

    // Best offer for the collection
    const bestOffer = offers.length > 0 ? offersWithDetails[0] : null;

    return {
      success: true as const,
      offers: offersWithDetails,
      bestOffer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get best collection offer for a specific collection
   */
  best: publicProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const offer = await ctx.prisma.marketplaceOffer.findFirst({
        where: {
          collectionId: input.collectionId,
          isCollectionOffer: true,
          status: "ACTIVE",
          expirationTimestamp: { gt: new Date() },
        },
        orderBy: { offerAmount: "desc" },
      });

      if (!offer) {
        return { success: true as const, offer: null };
      }

      const offeror = await ctx.prisma.user.findUnique({
        where: { walletAddress: offer.offerorAddress },
        select: { walletAddress: true, username: true, profilePicture: true },
      });

      return {
        success: true as const,
        offer: { ...offer, offeror },
      };
    }),

  /**
   * Make a collection offer (requires auth)
   */
  make: protectedProcedure.input(MakeCollectionOfferInput).mutation(async ({ ctx, input }) => {
    // Verify collection exists
    const collection = await ctx.prisma.collection.findUnique({
      where: { id: input.collectionId },
      select: { id: true, name: true, address: true },
    });

    if (!collection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collection not found",
      });
    }

    // Check for existing active collection offer from same user
    const existingOffer = await ctx.prisma.marketplaceOffer.findFirst({
      where: {
        collectionId: input.collectionId,
        offerorAddress: ctx.walletAddress.toLowerCase(),
        isCollectionOffer: true,
        status: "ACTIVE",
      },
    });

    if (existingOffer) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You already have an active collection offer. Cancel it first.",
      });
    }

    // Create collection offer
    const offer = await ctx.prisma.marketplaceOffer.create({
      data: {
        offerId: input.offerId,
        collectionId: input.collectionId,
        nftId: null, // Collection offers don't target specific NFTs
        assetContractAddress: input.assetContractAddress.toLowerCase(),
        tokenId: "115792089237316195423570985008687907853269984665640564039457584007913129639935", // MAX_UINT256
        offerorAddress: ctx.walletAddress.toLowerCase(),
        offerAmount: input.offerAmount,
        quantity: input.quantity,
        expirationTimestamp: new Date(input.expirationTimestamp),
        isCollectionOffer: true,
        transactionHash: input.transactionHash,
        status: "ACTIVE",
      },
    });

    // Get user for activity logging
    const user = await auth.getUserByWallet(ctx.walletAddress);

    // Log activity
    if (user) {
      await ctx.prisma.activity.create({
        data: {
          userId: user.id,
          type: "collection_offer_made",
          collectionId: input.collectionId,
          amount: input.offerAmount,
          currency: "ETH",
          transactionHash: input.transactionHash,
          metadata: {
            quantity: input.quantity,
            offerId: input.offerId,
            collectionName: collection.name,
          },
        },
      });
    }

    return {
      success: true as const,
      offer,
      collection: {
        id: collection.id,
        name: collection.name,
        address: collection.address,
      },
    };
  }),

  /**
   * Accept a collection offer with a specific NFT (requires auth)
   */
  accept: protectedProcedure.input(AcceptCollectionOfferInput).mutation(async ({ ctx, input }) => {
    // Find the offer
    const offer = await ctx.prisma.marketplaceOffer.findUnique({
      where: { offerId: input.offerId },
    });

    if (!offer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    if (!offer.isCollectionOffer) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This is not a collection offer",
      });
    }

    if (offer.status !== "ACTIVE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Offer is no longer active",
      });
    }

    if (new Date() > offer.expirationTimestamp) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Offer has expired",
      });
    }

    // Cannot accept your own offer
    if (ctx.walletAddress.toLowerCase() === offer.offerorAddress.toLowerCase()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot accept your own offer",
      });
    }

    // Try to find the NFT
    let nft = null;
    if (input.nftId) {
      nft = await ctx.prisma.nft.findUnique({
        where: { id: input.nftId },
        include: { collection: true },
      });
    } else {
      const collection = await ctx.prisma.collection.findUnique({
        where: { address: offer.assetContractAddress },
      });

      if (collection) {
        nft = await ctx.prisma.nft.findFirst({
          where: {
            collectionId: collection.id,
            OR: [
              { tokenId: input.tokenId },
              { onChainTokenId: input.tokenId },
            ],
          },
          include: { collection: true },
        });
      }
    }

    // Update offer and NFT in transaction
    const result = await ctx.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.marketplaceOffer.update({
        where: { offerId: input.offerId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedTokenId: input.tokenId,
          transactionHash: input.transactionHash,
        },
      });

      // Update NFT ownership if we have it
      if (nft) {
        await tx.nft.update({
          where: { id: nft.id },
          data: {
            ownerAddress: offer.offerorAddress.toLowerCase(),
            isListed: false,
            listingId: null,
            listingPrice: null,
            listingType: null,
            listingExpiry: null,
            listedAt: null,
          },
        });
      }

      return updatedOffer;
    });

    // Log activity for seller
    const seller = await auth.getUserByWallet(ctx.walletAddress);
    if (seller) {
      await ctx.prisma.activity.create({
        data: {
          userId: seller.id,
          type: "collection_offer_accepted",
          nftId: nft?.id,
          collectionId: offer.collectionId,
          amount: offer.offerAmount,
          currency: "ETH",
          transactionHash: input.transactionHash,
          metadata: {
            offerId: input.offerId,
            tokenId: input.tokenId,
            buyer: offer.offerorAddress,
          },
        },
      });
    }

    // Log activity for buyer
    const buyer = await auth.getUserByWallet(offer.offerorAddress);
    if (buyer) {
      await ctx.prisma.activity.create({
        data: {
          userId: buyer.id,
          type: "nft_purchased",
          nftId: nft?.id,
          collectionId: offer.collectionId,
          relatedUserId: seller?.id,
          amount: offer.offerAmount,
          currency: "ETH",
          transactionHash: input.transactionHash,
          metadata: {
            via: "collection_offer",
            offerId: input.offerId,
            tokenId: input.tokenId,
          },
        },
      });
    }

    return {
      success: true as const,
      offer: result,
      nft: nft ? {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        tokenId: nft.tokenId,
        newOwner: offer.offerorAddress,
      } : null,
    };
  }),

  /**
   * Cancel a collection offer (requires auth and ownership)
   */
  cancel: protectedProcedure.input(CancelCollectionOfferInput).mutation(async ({ ctx, input }) => {
    // Find the offer
    const existingOffer = await ctx.prisma.marketplaceOffer.findUnique({
      where: { offerId: input.offerId },
    });

    if (!existingOffer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Offer not found",
      });
    }

    if (!existingOffer.isCollectionOffer) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This is not a collection offer. Use the regular offers endpoint.",
      });
    }

    // Verify ownership
    if (existingOffer.offerorAddress.toLowerCase() !== ctx.walletAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own offers",
      });
    }

    // Cancel the offer
    const result = await ctx.prisma.marketplaceOffer.update({
      where: { offerId: input.offerId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Log activity
    const user = await auth.getUserByWallet(ctx.walletAddress);
    if (user) {
      await ctx.prisma.activity.create({
        data: {
          userId: user.id,
          type: "collection_offer_canceled",
          collectionId: existingOffer.collectionId,
          metadata: {
            offerId: input.offerId,
            offerAmount: existingOffer.offerAmount,
          },
        },
      });
    }

    return { success: true as const, offer: result };
  }),
});

// =============================================================================
// Input Schemas - Sweep
// =============================================================================

const SweepPreviewInput = z.object({
  collection: z.string(), // Collection contract address
  maxItems: z.number().min(1).max(50).default(10),
  maxTotalPrice: z.number().positive().optional(), // In ETH
});

const RecordSweepInput = z.object({
  collectionAddress: z.string(),
  buyerAddress: z.string(),
  transactions: z.array(
    z.object({
      transactionHash: z.string(),
      listingId: z.string(),
    })
  ),
});

// =============================================================================
// Sweep Router
// =============================================================================

const sweepRouter = router({
  /**
   * Preview sweep - get floor listings for a collection
   */
  preview: publicProcedure.input(SweepPreviewInput).query(async ({ ctx, input }) => {
    const { collection, maxItems, maxTotalPrice } = input;

    // Find collection by address
    const collectionRecord = await ctx.prisma.collection.findFirst({
      where: {
        address: { equals: collection, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    // Get active listings for this collection, sorted by price ASC (floor first)
    const listings = await ctx.prisma.marketplaceListing.findMany({
      where: {
        assetContractAddress: { equals: collection, mode: "insensitive" },
        status: "ACTIVE",
        listingType: "direct",
      },
      include: {
        nft: {
          select: {
            id: true,
            name: true,
            image: true,
            collectionId: true,
          },
        },
      },
      orderBy: { pricePerToken: "asc" },
      take: Math.min(maxItems * 2, 100), // Fetch extra in case some are filtered
    });

    // Filter by max total price if specified
    const selectedListings: typeof listings = [];
    let totalPriceEth = 0;

    for (const listing of listings) {
      if (selectedListings.length >= maxItems) break;
      const listingPriceEth = listing.pricePerToken;
      if (maxTotalPrice && totalPriceEth + listingPriceEth > maxTotalPrice) break;

      selectedListings.push(listing);
      totalPriceEth += listingPriceEth;
    }

    // Calculate total in Wei (pricePerToken is stored in ETH, convert to Wei string)
    const totalPriceWei = BigInt(Math.floor(totalPriceEth * 1e18)).toString();

    // Get floor price (first listing price)
    const floorPrice = listings.length > 0 ? listings[0].pricePerToken.toString() : null;

    // Format response
    const formattedListings = selectedListings.map((listing) => ({
      listingId: listing.listingId,
      tokenId: listing.tokenId,
      priceWei: BigInt(Math.floor(listing.pricePerToken * 1e18)).toString(),
      priceEth: listing.pricePerToken.toString(),
      sellerAddress: listing.sellerAddress,
      nft: listing.nft
        ? {
            id: listing.nft.id,
            name: listing.nft.name,
            image: listing.nft.image,
            collection: collectionRecord
              ? {
                  id: collectionRecord.id,
                  name: collectionRecord.name,
                  image: collectionRecord.image,
                }
              : {
                  id: "",
                  name: "Unknown",
                  image: null,
                },
          }
        : null,
    }));

    return {
      success: true as const,
      listings: formattedListings,
      summary: {
        totalAvailable: listings.length,
        floorPrice,
        selectedCount: selectedListings.length,
        totalPrice: totalPriceEth.toFixed(6),
        totalPriceWei,
      },
    };
  }),

  /**
   * Record sweep transactions after on-chain execution
   */
  record: protectedProcedure.input(RecordSweepInput).mutation(async ({ ctx, input }) => {
    const { collectionAddress, buyerAddress, transactions } = input;

    // Verify the caller is the buyer
    if (ctx.walletAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only record sweeps for your own wallet",
      });
    }

    // Get buyer user record
    const buyer = await auth.getUserByWallet(buyerAddress);
    if (!buyer) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Buyer not found. Please connect your wallet first.",
      });
    }

    // Process each transaction
    const results = await ctx.prisma.$transaction(async (tx) => {
      const processedListings: string[] = [];

      for (const txn of transactions) {
        // Find the listing
        const listing = await tx.marketplaceListing.findUnique({
          where: { listingId: txn.listingId },
          include: { nft: true },
        });

        if (!listing) {
          console.warn(`Listing ${txn.listingId} not found during sweep record`);
          continue;
        }

        // Update listing status
        await tx.marketplaceListing.update({
          where: { listingId: txn.listingId },
          data: {
            status: "SOLD",
            transactionHash: txn.transactionHash,
          },
        });

        // Update NFT ownership
        if (listing.nftId) {
          await tx.nft.update({
            where: { id: listing.nftId },
            data: {
              ownerAddress: buyerAddress.toLowerCase(),
              isListed: false,
              listingPrice: null,
              listingId: null,
              listingType: null,
              listingExpiry: null,
              listedAt: null,
            },
          });
        }

        processedListings.push(txn.listingId);
      }

      return processedListings;
    });

    // Log activity (non-blocking)
    const collection = await ctx.prisma.collection.findFirst({
      where: { address: { equals: collectionAddress, mode: "insensitive" } },
    });

    for (const listingId of results) {
      const listing = await ctx.prisma.marketplaceListing.findUnique({
        where: { listingId },
        include: { nft: true },
      });

      if (listing) {
        const seller = await auth.getUserByWallet(listing.sellerAddress);
        if (seller && listing.nftId) {
          logPurchase(
            buyer.id,
            seller.id,
            listing.nftId,
            listing.pricePerToken,
            collection?.id,
            listing.transactionHash || undefined
          ).catch(console.error);
        }
      }
    }

    return {
      success: true as const,
      message: `Recorded ${results.length} sweep transactions`,
      processedListings: results,
    };
  }),
});

// =============================================================================
// Input Schemas - Collections
// =============================================================================

const CollectionsFilterInput = z.object({
  category: z.string().optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
  orderBy: z.enum(["trending", "newest", "volume", "floor"]).default("trending"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const GetCollectionInput = z.object({
  id: z.string().uuid().optional(),
  address: z.string().optional(),
}).refine((data) => data.id || data.address, {
  message: "Either id or address must be provided",
});

const CollectionNftsInput = z.object({
  collectionId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

const GetCollectionBySlugInput = z.object({
  slug: z.string().min(1),
});

// =============================================================================
// Collections Router
// =============================================================================

const collectionsRouter = router({
  /**
   * Get trending collections
   */
  trending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      const collections = await ctx.prisma.collection.findMany({
        where: {
          isDeployed: true,
        },
        orderBy: [{ mintedSupply: "desc" }, { createdAt: "desc" }],
        take: input.limit,
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          bannerImage: true,
          profileImage: true,
          address: true,
          mintedSupply: true,
          maxSupply: true,
          totalSupply: true,
          description: true,
          creatorAddress: true,
          isVerified: true,
          isFeatured: true,
          floorPrice: true,
          claimPhases: true,
          createdAt: true,
        },
      });

      // Fetch creator names
      const creatorAddresses = [...new Set(collections.map((c) => c.creatorAddress))];
      const creators = await ctx.prisma.user.findMany({
        where: { walletAddress: { in: creatorAddresses } },
        select: { walletAddress: true, username: true },
      });
      const creatorMap = new Map(
        creators.map((c) => [c.walletAddress.toLowerCase(), c.username])
      );

      // Transform to expected format
      const formattedCollections = collections.map((collection) => {
        // Calculate change percentage from minted supply
        const changePercentage = collection.maxSupply
          ? Math.round((collection.mintedSupply / collection.maxSupply) * 100 * 3)
          : Math.round(Math.random() * 200 + 50);

        // Extract floor price from claim phases or use stored value
        let floorPrice = collection.floorPrice || 0.08;
        if (collection.claimPhases) {
          try {
            const phases = JSON.parse(collection.claimPhases as string);
            if (Array.isArray(phases) && phases.length > 0) {
              const now = new Date();
              const activePhase =
                phases.find((phase: { startTimestamp?: string; startTime?: string }) => {
                  const startTime = new Date(phase.startTimestamp || phase.startTime || 0);
                  return now >= startTime;
                }) || phases[0];

              if (activePhase && activePhase.pricePerToken) {
                const priceInWei = BigInt(activePhase.pricePerToken);
                floorPrice = Number(priceInWei) / 1e18;
              }
            }
          } catch {
            // Use default floor price
          }
        }

        return {
          id: collection.id,
          slug: collection.slug,
          address: collection.address,
          title: collection.name,
          image:
            collection.image ||
            collection.bannerImage ||
            collection.profileImage ||
            null,
          floor: `${floorPrice} ETH`,
          floorPrice,
          change: `+${changePercentage}%`,
          mintedSupply: collection.mintedSupply,
          maxSupply: collection.maxSupply,
          totalSupply: collection.totalSupply,
          description: collection.description,
          creatorAddress: collection.creatorAddress,
          creatorName: creatorMap.get(collection.creatorAddress.toLowerCase()) || null,
          isVerified: collection.isVerified,
          isFeatured: collection.isFeatured,
        };
      });

      return {
        success: true as const,
        collections: formattedCollections,
      };
    }),

  /**
   * Get featured collections
   */
  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(async ({ ctx, input }) => {
      const collections = await ctx.prisma.collection.findMany({
        where: {
          isDeployed: true,
          isFeatured: true,
        },
        orderBy: [{ mintedSupply: "desc" }, { createdAt: "desc" }],
        take: input.limit,
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          bannerImage: true,
          profileImage: true,
          address: true,
          description: true,
          creatorAddress: true,
          mintedSupply: true,
          maxSupply: true,
          totalSupply: true,
          floorPrice: true,
          isVerified: true,
          isFeatured: true,
          claimPhases: true,
          tags: true,
          category: true,
          createdAt: true,
        },
      });

      // Fetch creator names
      const creatorAddresses = [...new Set(collections.map((c) => c.creatorAddress))];
      const creators = await ctx.prisma.user.findMany({
        where: { walletAddress: { in: creatorAddresses } },
        select: { walletAddress: true, username: true },
      });
      const creatorMap = new Map(
        creators.map((c) => [c.walletAddress.toLowerCase(), c.username])
      );

      const formattedCollections = collections.map((collection) => {
        let floorPrice = collection.floorPrice || 0.08;
        if (collection.claimPhases) {
          try {
            const phases = JSON.parse(collection.claimPhases as string);
            if (Array.isArray(phases) && phases.length > 0) {
              const activePhase = phases[0];
              if (activePhase && activePhase.pricePerToken) {
                const priceInWei = BigInt(activePhase.pricePerToken);
                floorPrice = Number(priceInWei) / 1e18;
              }
            }
          } catch {
            // Use default floor price
          }
        }

        const trendingPercentage = collection.maxSupply
          ? Math.round((collection.mintedSupply / collection.maxSupply) * 100)
          : Math.round(Math.random() * 50 + 10);

        return {
          id: collection.id,
          slug: collection.slug,
          address: collection.address,
          title: collection.name,
          subtitle: collection.description?.slice(0, 60) || "",
          image: collection.image || collection.bannerImage || null,
          items: collection.totalSupply,
          floor: `${floorPrice} ETH`,
          floorPrice,
          volume: `${(floorPrice * collection.mintedSupply).toFixed(1)}K ETH`,
          isNew: collection.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          trending: `+${trendingPercentage}%`,
          creator: creatorMap.get(collection.creatorAddress.toLowerCase()) || "Unknown",
          creatorAddress: collection.creatorAddress,
          tags: collection.tags,
          category: collection.category,
        };
      });

      return {
        success: true as const,
        collections: formattedCollections,
      };
    }),

  /**
   * Get all collections with filters
   */
  list: publicProcedure.input(CollectionsFilterInput).query(async ({ ctx, input }) => {
    const { category, isVerified, isFeatured, search, orderBy, page, limit } = input;
    const skip = (page - 1) * limit;

    const where: {
      isDeployed: boolean;
      category?: string;
      isVerified?: boolean;
      isFeatured?: boolean;
      name?: { contains: string; mode: "insensitive" };
    } = {
      isDeployed: true,
    };

    if (category) where.category = category;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (search) where.name = { contains: search, mode: "insensitive" };

    // Determine sort order
    let orderByClause: { mintedSupply?: "desc"; createdAt?: "desc"; floorPrice?: "asc" | "desc" }[] = [];
    switch (orderBy) {
      case "trending":
        orderByClause = [{ mintedSupply: "desc" }, { createdAt: "desc" }];
        break;
      case "newest":
        orderByClause = [{ createdAt: "desc" }];
        break;
      case "volume":
        orderByClause = [{ mintedSupply: "desc" }];
        break;
      case "floor":
        orderByClause = [{ floorPrice: "asc" }];
        break;
    }

    const [collections, total] = await Promise.all([
      ctx.prisma.collection.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          image: true,
          bannerImage: true,
          address: true,
          description: true,
          creatorAddress: true,
          mintedSupply: true,
          maxSupply: true,
          totalSupply: true,
          floorPrice: true,
          isVerified: true,
          isFeatured: true,
          category: true,
          createdAt: true,
        },
      }),
      ctx.prisma.collection.count({ where }),
    ]);

    // Fetch creator names
    const creatorAddresses = [...new Set(collections.map((c) => c.creatorAddress))];
    const creators = await ctx.prisma.user.findMany({
      where: { walletAddress: { in: creatorAddresses } },
      select: { walletAddress: true, username: true },
    });
    const creatorMap = new Map(
      creators.map((c) => [c.walletAddress.toLowerCase(), c.username])
    );

    const formattedCollections = collections.map((collection) => ({
      id: collection.id,
      title: collection.name,
      image: collection.image || collection.bannerImage || null,
      floor: `${collection.floorPrice || 0} ETH`,
      floorPrice: collection.floorPrice || 0,
      items: collection.totalSupply,
      mintedSupply: collection.mintedSupply,
      maxSupply: collection.maxSupply,
      description: collection.description,
      creator: creatorMap.get(collection.creatorAddress.toLowerCase()) || "Unknown",
      creatorAddress: collection.creatorAddress,
      isVerified: collection.isVerified,
      isFeatured: collection.isFeatured,
      category: collection.category,
      address: collection.address,
    }));

    return {
      success: true as const,
      collections: formattedCollections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get a single collection by ID or address
   */
  byId: publicProcedure.input(GetCollectionInput).query(async ({ ctx, input }) => {
    const collection = await ctx.prisma.collection.findFirst({
      where: input.id ? { id: input.id } : { address: input.address },
      include: {
        _count: {
          select: { nfts: true },
        },
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collection not found",
      });
    }

    // Get creator info
    const creator = await ctx.prisma.user.findUnique({
      where: { walletAddress: collection.creatorAddress },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePicture: true,
        isCreator: true,
      },
    });

    return {
      ...collection,
      creator,
      nftCount: collection._count.nfts,
    };
  }),

  /**
   * Get NFTs in a collection
   */
  nfts: publicProcedure.input(CollectionNftsInput).query(async ({ ctx, input }) => {
    const { collectionId, page, limit } = input;
    const skip = (page - 1) * limit;

    const [nfts, total] = await Promise.all([
      ctx.prisma.nft.findMany({
        where: {
          collectionId,
        },
        include: {
          collection: {
            select: {
              id: true,
              name: true,
              symbol: true,
              address: true,
              image: true,
            },
          },
          traits: {
            select: {
              traitType: true,
              value: true,
            },
          },
        },
        orderBy: [
          { rarityRank: "asc" },
          { tokenId: "asc" },
        ],
        skip,
        take: limit,
      }),
      ctx.prisma.nft.count({ where: { collectionId } }),
    ]);

    // Transform NFTs to expected format
    const formattedNfts = nfts.map((nft) => ({
      id: nft.tokenId || nft.id,
      dbId: nft.id,
      tokenId: nft.tokenId, // Database tokenId (may be compound format)
      onChainTokenId: nft.onChainTokenId, // Actual on-chain tokenId
      name: nft.name,
      image: nft.image,
      rarity: nft.rarityTier,
      rank: nft.rarityRank,
      price: nft.listingPrice?.toString() || "0",
      lastSale: "0", // TODO: Query from Activity table
      owner: nft.ownerAddress,
      listed: nft.isListed, // CollectionItem expects `listed`
      isListed: nft.isListed, // Keep for backward compat
      listingPrice: nft.listingPrice,
      listingId: nft.listingId,
      likes: 0, // TODO: Implement likes
      hasOffer: false, // TODO: Query from MarketplaceOffer
      offerPrice: "0",
      collection: nft.collection,
      // Transform traits to expected format: { trait_type, value }[]
      traits: nft.traits.map((trait) => ({
        trait_type: trait.traitType,
        value: trait.value,
      })),
    }));

    return {
      success: true as const,
      nfts: formattedNfts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  /**
   * Get collection by slug/address/id for detail page
   */
  bySlug: publicProcedure.input(GetCollectionBySlugInput).query(async ({ ctx, input }) => {
    const { slug } = input;

    // Check if the input looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Find collection by slug first, then fallback to address, then to id
    const collection = await ctx.prisma.collection.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: "insensitive" } },
          { address: { equals: slug, mode: "insensitive" } },
          ...(isUuid ? [{ id: slug }] : []),
        ],
      },
      include: {
        nfts: {
          take: 50,
          orderBy: [{ rarityRank: "asc" }, { tokenId: "asc" }],
        },
        _count: { select: { nfts: true } },
      },
    });

    if (!collection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Collection not found",
      });
    }

    // Get creator info
    const creator = await ctx.prisma.user.findUnique({
      where: { walletAddress: collection.creatorAddress },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePicture: true,
        isCreator: true,
      },
    });

    // Calculate stats - run all queries in parallel
    const [listedNfts, uniqueOwners, floorNft, volumeData] = await Promise.all([
      // Count listed NFTs
      ctx.prisma.nft.count({
        where: { collectionId: collection.id, isListed: true },
      }),
      // Get unique owners
      ctx.prisma.nft.groupBy({
        by: ["ownerAddress"],
        where: { collectionId: collection.id, ownerAddress: { not: null } },
        _count: true,
      }),
      // Get floor price from lowest listed NFT
      ctx.prisma.nft.findFirst({
        where: {
          collectionId: collection.id,
          isListed: true,
          listingPrice: { gt: 0 },
        },
        orderBy: { listingPrice: "asc" },
        select: { listingPrice: true },
      }),
      // Calculate total volume from sales (purchases in activity)
      ctx.prisma.activity.aggregate({
        where: {
          collectionId: collection.id,
          type: { in: ["purchase", "listing_sold", "auction_won", "collection_offer_accepted"] },
          amount: { not: null },
        },
        _sum: { amount: true },
      }),
    ]);

    // Extract floor price - priority: 1) Lowest listing, 2) stored floorPrice, 3) claim phases
    let floorPrice = 0;
    if (floorNft?.listingPrice && floorNft.listingPrice > 0) {
      floorPrice = floorNft.listingPrice;
    } else if (collection.floorPrice && collection.floorPrice > 0) {
      floorPrice = collection.floorPrice;
    } else if (collection.claimPhases) {
      try {
        const phases = JSON.parse(collection.claimPhases as string);
        if (Array.isArray(phases) && phases.length > 0) {
          const activePhase = phases[0];
          if (activePhase?.pricePerToken) {
            floorPrice = Number(BigInt(activePhase.pricePerToken)) / 1e18;
          }
        }
      } catch {
        // Use default 0
      }
    }

    // Calculate total volume
    const totalVolume = volumeData._sum.amount || 0;

    // Transform NFTs to expected format
    const items = collection.nfts.map((nft) => ({
      id: nft.tokenId || nft.id,
      dbId: nft.id,
      tokenId: nft.tokenId, // Database tokenId (may be compound format)
      onChainTokenId: nft.onChainTokenId, // Actual on-chain tokenId
      name: nft.name,
      image: nft.image,
      rarity: nft.rarityTier || "Common",
      rank: nft.rarityRank || 0,
      price: nft.listingPrice?.toString() || "0",
      owner: nft.ownerAddress,
      listed: nft.isListed,
      hasOffer: false,
      traits: {},
    }));

    const listedPercentage = collection._count.nfts > 0
      ? Math.round((listedNfts / collection._count.nfts) * 100)
      : 0;

    return {
      success: true as const,
      collection: {
        id: collection.id,
        title: collection.name,
        description: collection.description,
        bannerImage: collection.bannerImage || collection.image,
        image: collection.image,
        contractAddress: collection.address,
        contractType: collection.contractType,
        chainId: collection.chainId,
        creator: {
          name: creator?.username || "Unknown",
          address: collection.creatorAddress,
          avatar: creator?.profilePicture || null,
          verified: creator?.isCreator || false,
        },
        stats: {
          floorPrice: floorPrice.toString(),
          totalSupply: collection.totalSupply || collection._count.nfts,
          mintedSupply: collection.mintedSupply,
          maxSupply: collection.maxSupply,
          uniqueOwners: uniqueOwners.length,
          owners: uniqueOwners.length, // Alias for component compatibility
          listedCount: listedNfts,
          listedPercentage,
          volumeAll: totalVolume.toString(),
          volume7d: "0", // TODO: Calculate from activity with date filter
          volume24h: "0", // TODO: Calculate from activity with date filter
        },
        traits: (collection as any).traits || [],
        items,
        isVerified: collection.isVerified,
        isFeatured: collection.isFeatured,
        category: collection.category,
        tags: collection.tags,
      },
    };
  }),

  /**
   * Get collection stats with real data from DB + subgraph
   */
  stats: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        contractAddress: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const [stats, changes] = await Promise.all([
        getCollectionStats(input.collectionId, input.contractAddress),
        getFloorPriceChanges(input.collectionId),
      ]);

      return {
        ...stats,
        floorChange24h: changes.floorChange24h,
        floorChange7d: changes.floorChange7d,
      };
    }),

  /**
   * Get floor price history for charts
   */
  priceHistory: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return getFloorPriceHistory(input.collectionId, input.days);
    }),

  /**
   * Get collection activity with pagination
   */
  activity: publicProcedure
    .input(
      z.object({
        collectionId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return getCollectionActivity(input.collectionId, {
        limit: input.limit,
        cursor: input.cursor,
        types: input.types,
      });
    }),

  /**
   * Get trending collections based on actual trading volume
   */
  realTrending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        period: z.enum(["24h", "7d", "30d"]).default("7d"),
      })
    )
    .query(async ({ input }) => {
      return getTrendingCollections(input.limit, input.period);
    }),
});

// =============================================================================
// NFT Analytics Router
// =============================================================================

const nftAnalyticsRouter = router({
  /**
   * Get NFT price history optimized for charts
   * Returns events and stats (avg, min, max, total sales, price change)
   */
  priceHistory: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getNFTPriceHistoryForChart(input.nftId);
    }),

  /**
   * Get NFT-specific activity history
   * Returns events that happened to this specific NFT (sales, listings, transfers, etc.)
   */
  activity: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return getNFTActivity(input.nftId, {
        limit: input.limit,
        cursor: input.cursor,
        types: input.types,
      });
    }),

  /**
   * Get last sale details for a specific NFT
   * Returns price, timestamp, buyer/seller info, and transaction hash
   */
  lastSale: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getNFTLastSale(input.nftId);
    }),

  /**
   * Get trait rarity data for a specific NFT
   * Returns each trait with real percentage based on collection distribution
   */
  traitRarity: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getNFTTraitRarity(input.nftId);
    }),

  /**
   * Get ownership history (provenance) for a specific NFT
   * Returns complete chain of custody from mint to current owner
   */
  provenance: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getNFTProvenance(input.nftId);
    }),

  /**
   * Get all active offers for a specific NFT
   * Includes individual offers and collection offers that apply to this NFT
   */
  offers: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
        includeCollectionOffers: z.boolean().default(true),
        includeTraitOffers: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      return getNFTOffers(input.nftId, {
        includeCollectionOffers: input.includeCollectionOffers,
        includeTraitOffers: input.includeTraitOffers,
      });
    }),

  /**
   * Get the best (highest) offer for a specific NFT
   */
  bestOffer: publicProcedure
    .input(
      z.object({
        nftId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getNFTBestOffer(input.nftId);
    }),
});

// =============================================================================
// Export Combined Marketplace Router
// =============================================================================

export const marketplaceRouter = router({
  listings: listingsRouter,
  auctions: auctionsRouter,
  offers: offersRouter,
  collectionOffers: collectionOffersRouter,
  purchase: purchaseRouter,
  collections: collectionsRouter,
  sweep: sweepRouter,
  nft: nftAnalyticsRouter,
});
