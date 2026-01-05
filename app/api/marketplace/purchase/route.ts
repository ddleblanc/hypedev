import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logPurchase } from "@/lib/activity";
import { getListingById } from "@/lib/marketplace";
import { requireAuthMatch, AuthError } from "@/lib/thirdweb-auth";
import { rateLimitCheck } from "@/lib/rate-limit";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponse, resultToResponseWithRateLimit } from "@/lib/api-utils";
import {
  validationError,
  notFoundError,
  databaseError,
  badRequestError,
  unauthorizedError,
  forbiddenError,
  type AnyAppError,
} from "@/lib/errors";
import {
  getAttributionData,
  clearAttributionCookie,
} from "@/lib/hype-network/attribution";
import { recordConversion } from "@/lib/hype-network/link-service";

// Zod schemas for validation
const PurchaseSchema = z.object({
  listingId: z.string(),
  buyerAddress: z.string(),
  transactionHash: z.string(),
  quantity: z.number().int().positive().default(1),
});

const GetPurchasesQuerySchema = z.object({
  buyer: z.string().optional(),
  seller: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * POST /api/marketplace/purchase
 * Record a successful purchase after on-chain transaction
 */
export async function POST(request: NextRequest) {
  // Rate limit blockchain operations
  const rateLimit = await rateLimitCheck(request, "blockchain");
  if (rateLimit.blocked) return rateLimit.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimit);
  }

  // Validate input
  const parseResult = PurchaseSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const validatedData = parseResult.data;

  // Verify the caller is the buyer
  try {
    await requireAuthMatch(validatedData.buyerAddress);
  } catch (authError) {
    if (authError instanceof AuthError) {
      return resultToResponseWithRateLimit(
        err(
          authError.status === 401
            ? unauthorizedError(authError.message)
            : forbiddenError(authError.message)
        ),
        rateLimit
      );
    }
    throw authError;
  }

  // Get buyer user record
  const buyerResult = await ResultAsync.fromPromise(
    auth.getUserByWallet(validatedData.buyerAddress),
    (e) => databaseError(e)
  );

  if (buyerResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(buyerResult.error), rateLimit);
  }

  const buyer = buyerResult.value;
  if (!buyer) {
    return resultToResponseWithRateLimit(
      err(unauthorizedError("Buyer not found. Please connect your wallet first.")),
      rateLimit
    );
  }

  // Find the listing
  const listingResult = await ResultAsync.fromPromise(
    prisma.marketplaceListing.findUnique({
      where: { listingId: validatedData.listingId },
      include: {
        nft: {
          include: {
            collection: true,
          },
        },
      },
    }),
    (e) => databaseError(e)
  );

  if (listingResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(listingResult.error), rateLimit);
  }

  const listing = listingResult.value;
  if (!listing) {
    return resultToResponseWithRateLimit(err(notFoundError("Listing", validatedData.listingId)), rateLimit);
  }

  if (listing.status !== "ACTIVE") {
    return resultToResponseWithRateLimit(
      err(badRequestError(`Listing is not active (current status: ${listing.status})`)),
      rateLimit
    );
  }

  // Verify purchase on-chain (non-blocking warning)
  try {
    const onChainListing = await getListingById(validatedData.listingId);
    if (
      onChainListing &&
      (onChainListing.status === "CREATED" || Number(onChainListing.status) === 1)
    ) {
      console.warn(`Listing ${validatedData.listingId} is still active on-chain`);
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
  const result = await ResultAsync.fromPromise(
    prisma.$transaction(async (tx) => {
      const updatedListing = await tx.marketplaceListing.update({
        where: { listingId: validatedData.listingId },
        data: {
          status: "SOLD",
          transactionHash: validatedData.transactionHash,
        },
      });

      const updatedNft = await tx.nft.update({
        where: { id: listing.nftId },
        data: {
          ownerAddress: validatedData.buyerAddress.toLowerCase(),
          isListed: false,
          listingPrice: null,
          listingId: null,
          listingType: null,
          listingExpiry: null,
          listedAt: null,
        },
      });

      return { listing: updatedListing, nft: updatedNft };
    }),
    (e) => databaseError(e)
  );

  if (result.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(result.error), rateLimit);
  }

  // Log purchase activity (non-blocking)
  if (seller) {
    logPurchase(
      buyer.id,
      seller.id,
      listing.nftId,
      listing.pricePerToken,
      listing.nft?.collectionId || undefined,
      validatedData.transactionHash
    ).catch(console.error);
  }

  // Process affiliate attribution (non-blocking)
  let attributionResult: {
    attributed: boolean;
    commissionId?: string;
    agentTag?: string;
  } = { attributed: false };

  try {
    const attribution = await getAttributionData();

    if (attribution) {
      // Verify the campaign matches this collection
      const link = await prisma.affiliateLink.findUnique({
        where: { id: attribution.linkId },
        include: {
          agent: { select: { agentTag: true } },
          campaign: { select: { collectionId: true, status: true } },
        },
      });

      if (
        link &&
        link.campaign.status === "ACTIVE" &&
        link.campaign.collectionId === listing.nft?.collectionId
      ) {
        // Record the conversion
        const commission = await recordConversion({
          linkId: attribution.linkId,
          buyerAddress: validatedData.buyerAddress.toLowerCase(),
          txHash: validatedData.transactionHash,
          saleAmount: Number(listing.pricePerToken),
        });

        attributionResult = {
          attributed: true,
          commissionId: commission.id,
          agentTag: link.agent.agentTag,
        };

        // Clear the attribution cookie (one conversion per click)
        await clearAttributionCookie();

        console.log(
          `[Purchase] Attribution processed: agent ${link.agent.agentTag}, commission ${commission.id}`
        );
      }
    }
  } catch (attrError) {
    // Don't fail the purchase if attribution fails
    console.error("[Purchase] Attribution processing failed:", attrError);
  }

  return resultToResponseWithRateLimit(
    ok({
      message: "Purchase recorded successfully",
      listing: result.value.listing,
      nft: result.value.nft,
      buyer: {
        address: validatedData.buyerAddress,
        id: buyer.id,
      },
      seller: seller
        ? {
            address: listing.sellerAddress,
            id: seller.id,
          }
        : null,
      attribution: attributionResult,
    }),
    rateLimit
  );
}

/**
 * GET /api/marketplace/purchase
 * Get purchase history using Activity table for accurate historical data
 */
export async function GET(request: NextRequest) {
  // Rate limit API reads
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  const searchParams = request.nextUrl.searchParams;

  // Validate query parameters
  const parseResult = GetPurchasesQuerySchema.safeParse({
    buyer: searchParams.get("buyer") || undefined,
    seller: searchParams.get("seller") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { buyer: buyerAddress, seller: sellerAddress, page, limit } = parseResult.data;
  const skip = (page - 1) * limit;

  // Build where clause for Activity table
  const where: {
    type: { in: string[] };
    userId?: string;
  } = {
    type: { in: ["purchase", "listing_sold", "auction_won"] },
  };

  // If buyer is specified, find their user ID
  if (buyerAddress) {
    const buyerResult = await ResultAsync.fromPromise(
      auth.getUserByWallet(buyerAddress),
      (e) => databaseError(e)
    );

    if (buyerResult.isErr()) {
      return resultToResponseWithRateLimit(err<never, AnyAppError>(buyerResult.error), rateLimit);
    }

    const buyer = buyerResult.value;
    if (!buyer) {
      return resultToResponseWithRateLimit(
        ok({
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        }),
        rateLimit
      );
    }

    where.userId = buyer.id;
    where.type = { in: ["purchase", "auction_won"] };
  }

  // If seller is specified, find their user ID
  if (sellerAddress) {
    const sellerResult = await ResultAsync.fromPromise(
      auth.getUserByWallet(sellerAddress),
      (e) => databaseError(e)
    );

    if (sellerResult.isErr()) {
      return resultToResponseWithRateLimit(err<never, AnyAppError>(sellerResult.error), rateLimit);
    }

    const seller = sellerResult.value;
    if (!seller) {
      return resultToResponseWithRateLimit(
        ok({
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        }),
        rateLimit
      );
    }

    where.userId = seller.id;
    where.type = { in: ["listing_sold"] };
  }

  // Execute query
  const result = await ResultAsync.fromPromise(
    Promise.all([
      prisma.activity.findMany({
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
      prisma.activity.count({ where }),
    ]),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(
    result.map(([activities, total]) => ({
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
    })),
    rateLimit
  );
}
