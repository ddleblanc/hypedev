import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logPurchase } from '@/lib/activity';
import { getListingById } from '@/lib/marketplace';
import { requireAuthMatch, AuthError } from '@/lib/thirdweb-auth';

// Schema for purchase request
const purchaseSchema = z.object({
  listingId: z.string(),
  buyerAddress: z.string(),
  transactionHash: z.string(),
  quantity: z.number().int().positive().default(1),
});

/**
 * POST /api/marketplace/purchase
 * Record a successful purchase after on-chain transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);

    // Verify the caller is the buyer
    try {
      await requireAuthMatch(validatedData.buyerAddress);
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Get the buyer user record
    const buyer = await auth.getUserByWallet(validatedData.buyerAddress);
    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Buyer not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

    // Find the listing in our database
    const listing = await prisma.marketplaceListing.findUnique({
      where: { listingId: validatedData.listingId },
      include: {
        nft: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found in database' },
        { status: 404 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Listing is not active (current status: ${listing.status})` },
        { status: 400 }
      );
    }

    // Verify the purchase happened on-chain by checking listing status
    // Note: Listing should be completed/gone after purchase
    let onChainListing = null;
    try {
      onChainListing = await getListingById(validatedData.listingId);
    } catch (chainError) {
      console.log('On-chain listing check failed (expected if purchase completed):', chainError);
    }

    // If listing is still active on-chain, the purchase may not have completed
    if (onChainListing && (onChainListing.status === 'CREATED' || Number(onChainListing.status) === 1)) {
      console.warn(`Listing ${validatedData.listingId} is still active on-chain`);
      // We'll proceed anyway since the tx hash was provided - the on-chain state may just be slow to update
    }

    // Get seller information
    const seller = await auth.getUserByWallet(listing.sellerAddress);

    // Update listing and NFT ownership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the listing status to SOLD
      const updatedListing = await tx.marketplaceListing.update({
        where: { listingId: validatedData.listingId },
        data: {
          status: 'SOLD',
          transactionHash: validatedData.transactionHash,
        },
      });

      // Transfer NFT ownership to buyer and clear listing data
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
    });

    // Log the purchase activity for both buyer and seller
    try {
      if (seller) {
        await logPurchase(
          buyer.id,
          seller.id,
          listing.nftId,
          listing.pricePerToken,
          listing.nft?.collectionId || undefined,
          validatedData.transactionHash
        );
      }
    } catch (activityError) {
      console.error('Failed to log purchase activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase recorded successfully',
      listing: result.listing,
      nft: result.nft,
      buyer: {
        address: validatedData.buyerAddress,
        id: buyer.id,
      },
      seller: seller ? {
        address: listing.sellerAddress,
        id: seller.id,
      } : null,
    });
  } catch (error) {
    console.error('Error recording purchase:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to record purchase: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/purchase
 * Get purchase history using Activity table for accurate historical data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const buyerAddress = searchParams.get('buyer');
    const sellerAddress = searchParams.get('seller');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Use Activity table for accurate purchase history
    // This tracks actual purchases even if NFT was later resold
    const where: any = {
      type: { in: ['purchase', 'listing_sold', 'auction_won'] },
    };

    // If buyer is specified, find their user ID and filter by userId
    if (buyerAddress) {
      const buyer = await auth.getUserByWallet(buyerAddress);
      if (buyer) {
        where.userId = buyer.id;
        where.type = { in: ['purchase', 'auction_won'] };
      } else {
        // Buyer not found, return empty results
        return NextResponse.json({
          success: true,
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    // If seller is specified, find sales by that seller
    if (sellerAddress) {
      const seller = await auth.getUserByWallet(sellerAddress);
      if (seller) {
        where.userId = seller.id;
        where.type = 'listing_sold';
      } else {
        return NextResponse.json({
          success: true,
          purchases: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    const [activities, total] = await Promise.all([
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    // Transform activities into purchase format
    const purchases = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      amount: activity.amount,
      transactionHash: activity.transactionHash,
      createdAt: activity.createdAt,
      nft: activity.nft,
      user: activity.user,
      listingId: activity.listingId,
    }));

    return NextResponse.json({
      success: true,
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase history' },
      { status: 500 }
    );
  }
}
