import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getListingById } from '@/lib/marketplace';
import { auth } from '@/lib/auth';
import { logListing, logListingCanceled } from '@/lib/activity';
import { requireAuthMatch, AuthError } from '@/lib/thirdweb-auth';

// Schema for creating a listing record
const createListingSchema = z.object({
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

// Schema for updating a listing
const updateListingSchema = z.object({
  listingId: z.string(),
  pricePerToken: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED']).optional(),
});

/**
 * POST /api/marketplace/listings
 * Create a new listing record in the database after on-chain transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createListingSchema.parse(body);

    // Verify the caller is the seller
    try {
      await requireAuthMatch(validatedData.sellerAddress);
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Verify the listing exists on-chain
    // Note: There may be a delay between tx confirmation and indexing
    let onChainListing = null;
    try {
      onChainListing = await getListingById(validatedData.listingId);
    } catch (chainError) {
      console.error('Error fetching on-chain listing:', chainError);
      // Continue anyway - the listing was just created so may not be indexed yet
    }

    if (!onChainListing) {
      console.warn(`Listing ${validatedData.listingId} not found on-chain yet, proceeding with DB save anyway`);
      // Don't fail - the tx succeeded so the listing should exist, might just not be indexed yet
    }

    // Create the listing record and update NFT in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the marketplace listing
      const listing = await tx.marketplaceListing.create({
        data: {
          listingId: validatedData.listingId,
          nftId: validatedData.nftId,
          sellerAddress: validatedData.sellerAddress.toLowerCase(),
          assetContractAddress: validatedData.assetContractAddress.toLowerCase(),
          tokenId: validatedData.tokenId,
          quantity: validatedData.quantity,
          pricePerToken: validatedData.pricePerToken,
          listingType: 'direct',
          startTimestamp: new Date(validatedData.startTimestamp),
          endTimestamp: new Date(validatedData.endTimestamp),
          transactionHash: validatedData.transactionHash,
          status: 'ACTIVE',
        },
      });

      // Update the NFT with listing information
      const updatedNft = await tx.nft.update({
        where: { id: validatedData.nftId },
        data: {
          isListed: true,
          listingPrice: validatedData.pricePerToken,
          listingId: validatedData.listingId,
          listingType: 'direct',
          listingExpiry: new Date(validatedData.endTimestamp),
          listedAt: new Date(),
        },
      });

      return { listing, updatedNft };
    });

    // Log the listing activity
    try {
      const seller = await auth.getUserByWallet(validatedData.sellerAddress);
      if (seller) {
        // Get collection ID from NFT
        const nftWithCollection = await prisma.nft.findUnique({
          where: { id: validatedData.nftId },
          select: { collectionId: true },
        });
        await logListing(
          seller.id,
          validatedData.nftId,
          validatedData.listingId,
          validatedData.pricePerToken,
          nftWithCollection?.collectionId,
          validatedData.transactionHash
        );
      }
    } catch (activityError) {
      // Don't fail the request if activity logging fails
      console.error('Failed to log listing activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      listing: result.listing,
      nft: result.updatedNft,
    });
  } catch (error) {
    console.error('Error creating listing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Include more details for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Listing creation failed:', errorMessage);
    return NextResponse.json(
      { success: false, error: `Failed to create listing record: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/listings
 * Fetch listings - by seller address, or all active listings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerAddress = searchParams.get('seller');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      status: status as any,
      listingType: 'direct',
    };

    if (sellerAddress) {
      where.sellerAddress = sellerAddress.toLowerCase();
    }

    const [listings, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketplace/listings
 * Update listing status (for cancellation or completion)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateListingSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get the listing to find the associated NFT
      const existingListing = await tx.marketplaceListing.findUnique({
        where: { listingId: validatedData.listingId },
      });

      if (!existingListing) {
        throw new Error('Listing not found');
      }

      // Update the listing
      const listing = await tx.marketplaceListing.update({
        where: { listingId: validatedData.listingId },
        data: {
          pricePerToken: validatedData.pricePerToken ?? existingListing.pricePerToken,
          status: validatedData.status ?? existingListing.status,
        },
      });

      // If listing is cancelled or sold, update NFT
      if (validatedData.status === 'CANCELLED' || validatedData.status === 'SOLD') {
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

    return NextResponse.json({
      success: true,
      listing: result,
    });
  } catch (error) {
    console.error('Error updating listing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/listings
 * Cancel a listing (mark as cancelled)
 * Requires authenticated seller
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Find the listing first to get seller address
    const existingListing = await prisma.marketplaceListing.findUnique({
      where: { listingId },
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify the caller is the seller
    try {
      await requireAuthMatch(existingListing.sellerAddress);
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Get user for activity logging
    const user = await auth.getUserByWallet(existingListing.sellerAddress);

    // Verify the listing is cancelled on-chain before updating database
    // This ensures the user actually completed the on-chain cancellation
    const onChainListing = await getListingById(listingId);

    // If listing still exists and is active on-chain, don't update DB yet
    // Status can be a string or number depending on thirdweb version
    if (onChainListing && (onChainListing.status === 'CREATED' || Number(onChainListing.status) === 1)) {
      return NextResponse.json(
        { success: false, error: 'Listing is still active on-chain. Please complete the cancellation transaction first.' },
        { status: 400 }
      );
    }

    // Cancel the listing and update NFT
    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.marketplaceListing.update({
        where: { listingId },
        data: { status: 'CANCELLED' },
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

    // Log the cancellation activity
    if (user) {
      try {
        // Get collection ID from NFT
        const nftWithCollection = await prisma.nft.findUnique({
          where: { id: existingListing.nftId },
          select: { collectionId: true },
        });
        await logListingCanceled(
          user.id,
          existingListing.nftId,
          listingId,
          nftWithCollection?.collectionId
        );
      } catch (activityError) {
        console.error('Failed to log listing cancellation activity:', activityError);
      }
    }

    return NextResponse.json({
      success: true,
      listing: result,
    });
  } catch (error) {
    console.error('Error cancelling listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel listing' },
      { status: 500 }
    );
  }
}
