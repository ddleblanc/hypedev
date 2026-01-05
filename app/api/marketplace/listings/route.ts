import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getListingById } from "@/lib/marketplace";
import { auth } from "@/lib/auth";
import { logListing, logListingCanceled } from "@/lib/activity";
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

// Zod schemas for validation
const CreateListingSchema = z.object({
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

const UpdateListingSchema = z.object({
  listingId: z.string(),
  pricePerToken: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).optional(),
});

const GetListingsQuerySchema = z.object({
  seller: z.string().optional(),
  status: z.enum(["ACTIVE", "SOLD", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * POST /api/marketplace/listings
 * Create a new listing record in the database after on-chain transaction
 */
export async function POST(request: NextRequest) {
  // Rate limit API writes
  const rateLimit = await rateLimitCheck(request, "apiWrite");
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
  const parseResult = CreateListingSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const validatedData = parseResult.data;

  // Verify the caller is the seller
  try {
    await requireAuthMatch(validatedData.sellerAddress);
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

  // Verify the listing exists on-chain (non-blocking)
  try {
    const onChainListing = await getListingById(validatedData.listingId);
    if (!onChainListing) {
      console.warn(
        `Listing ${validatedData.listingId} not found on-chain yet, proceeding with DB save anyway`
      );
    }
  } catch (chainError) {
    console.error("Error fetching on-chain listing:", chainError);
  }

  // Create listing and update NFT in transaction
  const result = await ResultAsync.fromPromise(
    prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.create({
        data: {
          listingId: validatedData.listingId,
          nftId: validatedData.nftId,
          sellerAddress: validatedData.sellerAddress.toLowerCase(),
          assetContractAddress: validatedData.assetContractAddress.toLowerCase(),
          tokenId: validatedData.tokenId,
          quantity: validatedData.quantity,
          pricePerToken: validatedData.pricePerToken,
          listingType: "direct",
          startTimestamp: new Date(validatedData.startTimestamp),
          endTimestamp: new Date(validatedData.endTimestamp),
          transactionHash: validatedData.transactionHash,
          status: "ACTIVE",
        },
      });

      const updatedNft = await tx.nft.update({
        where: { id: validatedData.nftId },
        data: {
          isListed: true,
          listingPrice: validatedData.pricePerToken,
          listingId: validatedData.listingId,
          listingType: "direct",
          listingExpiry: new Date(validatedData.endTimestamp),
          listedAt: new Date(),
        },
      });

      return { listing, updatedNft };
    }),
    (e) => databaseError(e)
  );

  if (result.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(result.error), rateLimit);
  }

  // Log activity (non-blocking)
  logListingActivity(validatedData).catch(console.error);

  return resultToResponseWithRateLimit(
    ok({
      listing: result.value.listing,
      nft: result.value.updatedNft,
    }),
    rateLimit
  );
}

/**
 * GET /api/marketplace/listings
 * Fetch listings - by seller address, or all active listings
 */
export async function GET(request: NextRequest) {
  // Rate limit API reads
  const rateLimitGet = await rateLimitCheck(request, "api");
  if (rateLimitGet.blocked) return rateLimitGet.response;

  const searchParams = request.nextUrl.searchParams;

  // Validate query parameters
  const parseResult = GetListingsQuerySchema.safeParse({
    seller: searchParams.get("seller") || undefined,
    status: searchParams.get("status") || "ACTIVE",
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitGet);
  }

  const { seller, status, page, limit } = parseResult.data;
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    status: status as "ACTIVE" | "SOLD" | "CANCELLED" | "EXPIRED",
    listingType: "direct" as const,
    ...(seller && { sellerAddress: seller.toLowerCase() }),
  };

  // Execute query
  const result = await ResultAsync.fromPromise(
    Promise.all([
      prisma.marketplaceListing.findMany({
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
      prisma.marketplaceListing.count({ where }),
    ]),
    (e) => databaseError(e)
  );

  return resultToResponseWithRateLimit(
    result.map(([listings, total]) => ({
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })),
    rateLimitGet
  );
}

/**
 * PUT /api/marketplace/listings
 * Update listing status (for cancellation or completion)
 */
export async function PUT(request: NextRequest) {
  // Rate limit API writes
  const rateLimitPut = await rateLimitCheck(request, "apiWrite");
  if (rateLimitPut.blocked) return rateLimitPut.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimitPut);
  }

  // Validate input
  const parseResult = UpdateListingSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimitPut);
  }

  const validatedData = parseResult.data;

  // Execute update in transaction
  const result = await ResultAsync.fromPromise(
    prisma.$transaction(async (tx) => {
      const existingListing = await tx.marketplaceListing.findUnique({
        where: { listingId: validatedData.listingId },
      });

      if (!existingListing) {
        throw new Error("Listing not found");
      }

      const listing = await tx.marketplaceListing.update({
        where: { listingId: validatedData.listingId },
        data: {
          pricePerToken: validatedData.pricePerToken ?? existingListing.pricePerToken,
          status: validatedData.status ?? existingListing.status,
        },
      });

      // Clear NFT listing data if cancelled or sold
      if (validatedData.status === "CANCELLED" || validatedData.status === "SOLD") {
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
    }),
    (e) => {
      if (e instanceof Error && e.message === "Listing not found") {
        return notFoundError("Listing", validatedData.listingId);
      }
      return databaseError(e);
    }
  );

  return resultToResponseWithRateLimit(result.map((listing) => ({ listing })), rateLimitPut);
}

/**
 * DELETE /api/marketplace/listings
 * Cancel a listing (mark as cancelled)
 */
export async function DELETE(request: NextRequest) {
  // Rate limit API writes
  const rateLimitDelete = await rateLimitCheck(request, "apiWrite");
  if (rateLimitDelete.blocked) return rateLimitDelete.response;

  const searchParams = request.nextUrl.searchParams;
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return resultToResponseWithRateLimit(err(badRequestError("Listing ID is required")), rateLimitDelete);
  }

  // Find the listing
  const listingResult = await ResultAsync.fromPromise(
    prisma.marketplaceListing.findUnique({
      where: { listingId },
    }),
    (e) => databaseError(e)
  );

  if (listingResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(listingResult.error), rateLimitDelete);
  }

  const existingListing = listingResult.value;
  if (!existingListing) {
    return resultToResponseWithRateLimit(err(notFoundError("Listing", listingId)), rateLimitDelete);
  }

  // Verify the caller is the seller
  try {
    await requireAuthMatch(existingListing.sellerAddress);
  } catch (authError) {
    if (authError instanceof AuthError) {
      return resultToResponseWithRateLimit(
        err(
          authError.status === 401
            ? unauthorizedError(authError.message)
            : forbiddenError(authError.message)
        ),
        rateLimitDelete
      );
    }
    throw authError;
  }

  // Verify listing is cancelled on-chain
  try {
    const onChainListing = await getListingById(listingId);
    if (
      onChainListing &&
      (onChainListing.status === "CREATED" || Number(onChainListing.status) === 1)
    ) {
      return resultToResponseWithRateLimit(
        err(
          badRequestError(
            "Listing is still active on-chain. Please complete the cancellation transaction first."
          )
        ),
        rateLimitDelete
      );
    }
  } catch {
    // Ignore errors - listing may not exist on-chain anymore
  }

  // Cancel listing and update NFT
  const result = await ResultAsync.fromPromise(
    prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.update({
        where: { listingId },
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
    }),
    (e) => databaseError(e)
  );

  if (result.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(result.error), rateLimitDelete);
  }

  // Log cancellation (non-blocking)
  logCancellationActivity(existingListing, listingId).catch(console.error);

  return resultToResponseWithRateLimit(ok({ listing: result.value }), rateLimitDelete);
}

// Helper function to log listing activity
async function logListingActivity(data: z.infer<typeof CreateListingSchema>) {
  const seller = await auth.getUserByWallet(data.sellerAddress);
  if (seller) {
    const nftWithCollection = await prisma.nft.findUnique({
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

// Helper function to log cancellation activity
async function logCancellationActivity(
  listing: { sellerAddress: string; nftId: string },
  listingId: string
) {
  const user = await auth.getUserByWallet(listing.sellerAddress);
  if (user) {
    const nftWithCollection = await prisma.nft.findUnique({
      where: { id: listing.nftId },
      select: { collectionId: true },
    });
    await logListingCanceled(
      user.id,
      listing.nftId,
      listingId,
      nftWithCollection?.collectionId
    );
  }
}
