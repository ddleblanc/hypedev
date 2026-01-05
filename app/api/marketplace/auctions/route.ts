import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuctionById } from '@/lib/marketplace';
import { auth } from '@/lib/auth';
import { logAuctionCreated } from '@/lib/activity';
import { requireAuthMatch, AuthError } from '@/lib/thirdweb-auth';
import { rateLimit } from '@/lib/rate-limit';

// Schema for creating an auction record
const createAuctionSchema = z.object({
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

// Schema for updating an auction (e.g., recording bids)
const updateAuctionSchema = z.object({
  auctionId: z.string(),
  highestBid: z.number().positive().optional(),
  highestBidder: z.string().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'CANCELLED', 'EXPIRED']).optional(),
});

/**
 * POST /api/marketplace/auctions
 * Create a new auction record in the database after on-chain transaction
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'blockchain');
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validatedData = createAuctionSchema.parse(body);

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

    // Verify the auction exists on-chain
    // Note: There may be a delay between tx confirmation and indexing
    let onChainAuction = null;
    try {
      onChainAuction = await getAuctionById(validatedData.auctionId);
    } catch (chainError) {
      console.error('Error fetching on-chain auction:', chainError);
      // Continue anyway - the auction was just created so may not be indexed yet
    }

    if (!onChainAuction) {
      console.warn(`Auction ${validatedData.auctionId} not found on-chain yet, proceeding with DB save anyway`);
      // Don't fail - the tx succeeded so the auction should exist, might just not be indexed yet
    }

    // Get the seller's user ID for activity logging
    const seller = await auth.getUserByWallet(validatedData.sellerAddress);

    // Create the auction record and update NFT in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the marketplace listing for the auction
      const auction = await tx.marketplaceListing.create({
        data: {
          listingId: validatedData.auctionId,
          nftId: validatedData.nftId,
          sellerAddress: validatedData.sellerAddress.toLowerCase(),
          assetContractAddress: validatedData.assetContractAddress.toLowerCase(),
          tokenId: validatedData.tokenId,
          quantity: validatedData.quantity,
          pricePerToken: validatedData.minimumBidAmount, // Store minimum bid as price
          listingType: 'auction',
          minimumBidAmount: validatedData.minimumBidAmount,
          buyoutBidAmount: validatedData.buyoutBidAmount,
          startTimestamp: new Date(validatedData.startTimestamp),
          endTimestamp: new Date(validatedData.endTimestamp),
          transactionHash: validatedData.transactionHash,
          status: 'ACTIVE',
        },
      });

      // Update the NFT with auction information
      const updatedNft = await tx.nft.update({
        where: { id: validatedData.nftId },
        data: {
          isListed: true,
          listingPrice: validatedData.minimumBidAmount,
          listingId: validatedData.auctionId,
          listingType: 'auction',
          listingExpiry: new Date(validatedData.endTimestamp),
          listedAt: new Date(),
        },
      });

      return { auction, updatedNft };
    });

    // Log activity for auction creation
    if (seller) {
      try {
        await logAuctionCreated(
          seller.id,
          validatedData.nftId,
          validatedData.auctionId,
          validatedData.minimumBidAmount,
          result.updatedNft.collectionId,
          validatedData.transactionHash
        );
      } catch (activityError) {
        console.error('Failed to log auction activity:', activityError);
        // Don't fail the request if activity logging fails
      }
    }

    return NextResponse.json({
      success: true,
      auction: result.auction,
      nft: result.updatedNft,
    });
  } catch (error: any) {
    console.error('Error creating auction:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Check for Prisma unique constraint violation
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Auction already exists in database. Use the sync feature to update listings from on-chain data.',
          code: 'DUPLICATE_LISTING'
        },
        { status: 409 }
      );
    }

    // Check for Prisma foreign key constraint (NFT not found)
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'NFT not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create auction record' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/auctions
 * Fetch auctions - by seller address, or all active auctions
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerAddress = searchParams.get('seller');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      status: status as any,
      listingType: 'auction',
    };

    if (sellerAddress) {
      where.sellerAddress = sellerAddress.toLowerCase();
    }

    const [auctions, total] = await Promise.all([
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
        orderBy: { endTimestamp: 'asc' }, // Show ending soonest first
        skip,
        take: limit,
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      auctions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketplace/auctions
 * Update auction (record bid, update status)
 */
export async function PUT(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'apiWrite');
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validatedData = updateAuctionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Get the auction
      const existingAuction = await tx.marketplaceListing.findFirst({
        where: {
          listingId: validatedData.auctionId,
          listingType: 'auction',
        },
      });

      if (!existingAuction) {
        throw new Error('Auction not found');
      }

      // Update the auction
      const auction = await tx.marketplaceListing.update({
        where: { id: existingAuction.id },
        data: {
          highestBid: validatedData.highestBid ?? existingAuction.highestBid,
          highestBidder: validatedData.highestBidder ?? existingAuction.highestBidder,
          status: validatedData.status ?? existingAuction.status,
        },
      });

      // If auction is cancelled or sold, update NFT
      if (validatedData.status === 'CANCELLED' || validatedData.status === 'SOLD') {
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

    return NextResponse.json({
      success: true,
      auction: result,
    });
  } catch (error) {
    console.error('Error updating auction:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update auction' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/auctions
 * Cancel an auction (only if no bids)
 * Requires authenticated seller
 */
export async function DELETE(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'blockchain');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const auctionId = searchParams.get('auctionId');

    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      );
    }

    // Find the auction first
    const existingAuction = await prisma.marketplaceListing.findFirst({
      where: {
        listingId: auctionId,
        listingType: 'auction',
      },
    });

    if (!existingAuction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Verify the caller is the seller
    try {
      await requireAuthMatch(existingAuction.sellerAddress);
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Check if there are any bids
    if (existingAuction.highestBid && existingAuction.highestBid > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel auction with active bids' },
        { status: 400 }
      );
    }

    // Verify the auction is cancelled on-chain before updating database
    const onChainAuction = await getAuctionById(auctionId);
    // Status can be a string or number depending on thirdweb version
    if (onChainAuction && (onChainAuction.status === 'CREATED' || Number(onChainAuction.status) === 1)) {
      return NextResponse.json(
        { success: false, error: 'Auction is still active on-chain. Please complete the cancellation transaction first.' },
        { status: 400 }
      );
    }

    // Cancel the auction and update NFT
    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.marketplaceListing.update({
        where: { id: existingAuction.id },
        data: { status: 'CANCELLED' },
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

    return NextResponse.json({
      success: true,
      auction: result,
    });
  } catch (error) {
    console.error('Error cancelling auction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel auction' },
      { status: 500 }
    );
  }
}
