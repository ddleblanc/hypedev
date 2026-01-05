import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireAuth, requireAuthMatch, AuthError } from '@/lib/thirdweb-auth';
import { rateLimitCheck } from '@/lib/rate-limit';
import { MAX_UINT256 } from '@/lib/marketplace';

// Schema for creating a collection offer record
const createCollectionOfferSchema = z.object({
  offerId: z.string(),
  collectionId: z.string().uuid(),
  assetContractAddress: z.string(),
  offerAmount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  expirationTimestamp: z.string().datetime(),
  transactionHash: z.string(),
});

/**
 * POST /api/marketplace/collection-offers
 * Create a new collection offer record in the database after on-chain transaction
 */
export async function POST(request: NextRequest) {
  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const body = await request.json();
    const validatedData = createCollectionOfferSchema.parse(body);

    // Get the authenticated user's wallet address
    let walletAddress: string;
    try {
      walletAddress = await requireAuth();
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Get the user from database
    const user = await auth.getUserByWallet(walletAddress);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Verify collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: validatedData.collectionId },
      select: { id: true, name: true, address: true }
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Check for existing active collection offer from same user on same collection
    const existingOffer = await prisma.marketplaceOffer.findFirst({
      where: {
        collectionId: validatedData.collectionId,
        offerorAddress: user.walletAddress.toLowerCase(),
        isCollectionOffer: true,
        status: 'ACTIVE',
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { success: false, error: 'You already have an active collection offer. Cancel it first.' },
        { status: 400 }
      );
    }

    // Create collection offer record
    const offer = await prisma.marketplaceOffer.create({
      data: {
        offerId: validatedData.offerId,
        collectionId: validatedData.collectionId,
        nftId: null, // Collection offers don't target specific NFTs
        assetContractAddress: validatedData.assetContractAddress.toLowerCase(),
        tokenId: MAX_UINT256.toString(), // Marker for collection offer
        offerorAddress: user.walletAddress.toLowerCase(),
        offerAmount: validatedData.offerAmount,
        quantity: validatedData.quantity,
        expirationTimestamp: new Date(validatedData.expirationTimestamp),
        isCollectionOffer: true,
        transactionHash: validatedData.transactionHash,
        status: 'ACTIVE',
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'collection_offer_made',
        collectionId: validatedData.collectionId,
        amount: validatedData.offerAmount,
        currency: 'ETH',
        transactionHash: validatedData.transactionHash,
        metadata: {
          quantity: validatedData.quantity,
          offerId: validatedData.offerId,
          collectionName: collection.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      offer,
      collection: {
        id: collection.id,
        name: collection.name,
        address: collection.address,
      },
    });
  } catch (error) {
    console.error('Error creating collection offer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to create collection offer: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/collection-offers
 * Fetch collection offers - by collection, by offeror, or all active
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');
    const assetContract = searchParams.get('assetContract');
    const offerorAddress = searchParams.get('offeror');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      isCollectionOffer: true,
      status: status as any,
      expirationTimestamp: { gt: new Date() }, // Only active, non-expired offers
    };

    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (assetContract) {
      where.assetContractAddress = assetContract.toLowerCase();
    }

    if (offerorAddress) {
      where.offerorAddress = offerorAddress.toLowerCase();
    }

    const [offers, total] = await Promise.all([
      prisma.marketplaceOffer.findMany({
        where,
        orderBy: [
          { offerAmount: 'desc' }, // Highest offers first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.marketplaceOffer.count({ where }),
    ]);

    // Fetch offeror user info
    const offerorAddresses = [...new Set(offers.map(o => o.offerorAddress))];
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: offerorAddresses } },
      select: { walletAddress: true, username: true, profilePicture: true },
    });
    const userMap = new Map(users.map(u => [u.walletAddress.toLowerCase(), u]));

    // Fetch collection info if needed
    const collectionIds = [...new Set(offers.map(o => o.collectionId).filter(Boolean))] as string[];
    const collections = await prisma.collection.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, name: true, address: true, image: true, floorPrice: true },
    });
    const collectionMap = new Map(collections.map(c => [c.id, c]));

    const offersWithDetails = offers.map(offer => ({
      ...offer,
      offeror: userMap.get(offer.offerorAddress) || null,
      collection: offer.collectionId ? collectionMap.get(offer.collectionId) || null : null,
    }));

    // Calculate best offer for the collection
    const bestOffer = offers.length > 0 ? offers[0] : null;

    return NextResponse.json({
      success: true,
      offers: offersWithDetails,
      bestOffer,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching collection offers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection offers' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/collection-offers
 * Cancel a collection offer (mark as cancelled)
 */
export async function DELETE(request: NextRequest) {
  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');

    if (!offerId) {
      return NextResponse.json(
        { success: false, error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Find the offer first
    const existingOffer = await prisma.marketplaceOffer.findUnique({
      where: { offerId },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (!existingOffer.isCollectionOffer) {
      return NextResponse.json(
        { success: false, error: 'This is not a collection offer. Use /api/marketplace/offers instead.' },
        { status: 400 }
      );
    }

    // Verify the caller is the offeror
    try {
      await requireAuthMatch(existingOffer.offerorAddress);
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Get the user for activity logging
    const user = await auth.getUserByWallet(existingOffer.offerorAddress);

    // Cancel the offer
    const result = await prisma.marketplaceOffer.update({
      where: { offerId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Log the cancellation activity
    if (user) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: 'collection_offer_canceled',
          collectionId: existingOffer.collectionId,
          metadata: {
            offerId,
            offerAmount: existingOffer.offerAmount,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      offer: result,
    });
  } catch (error) {
    console.error('Error cancelling collection offer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel collection offer' },
      { status: 500 }
    );
  }
}
