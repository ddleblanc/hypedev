import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logOfferMade, logOfferCanceled } from '@/lib/activity';
import { getOfferById } from '@/lib/marketplace';
import { requireAuthMatch, AuthError } from '@/lib/thirdweb-auth';
import { rateLimitCheck } from '@/lib/rate-limit';

// Schema for creating an offer record
const createOfferSchema = z.object({
  offerId: z.string(),
  offerorAddress: z.string(),
  assetContractAddress: z.string(),
  tokenId: z.string(),
  offerAmount: z.number().positive(),
  expirationTimestamp: z.string().datetime(),
  transactionHash: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  nftId: z.string().optional(), // Optional - we'll try to find it
});

/**
 * POST /api/marketplace/offers
 * Create a new offer record in the database after on-chain transaction
 */
export async function POST(request: NextRequest) {
  console.log("[POST /api/marketplace/offers] Request received");

  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) {
    console.log("[POST /api/marketplace/offers] Rate limited");
    return rateCheck.response;
  }

  try {
    const body = await request.json();
    console.log("[POST /api/marketplace/offers] Request body:", JSON.stringify(body, null, 2));

    const validatedData = createOfferSchema.parse(body);
    console.log("[POST /api/marketplace/offers] Validated data:", JSON.stringify(validatedData, null, 2));

    // Verify the caller is the offeror
    try {
      await requireAuthMatch(validatedData.offerorAddress);
      console.log("[POST /api/marketplace/offers] Auth verified for:", validatedData.offerorAddress);
    } catch (authError) {
      console.log("[POST /api/marketplace/offers] Auth failed:", authError);
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        );
      }
      throw authError;
    }

    // Get the offeror user record
    const offeror = await auth.getUserByWallet(validatedData.offerorAddress);
    if (!offeror) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

    // Try to find the NFT in our database
    let nftId: string | undefined = validatedData.nftId;
    let nft = null;

    // Check if nftId is a valid UUID format
    const isValidUUID = nftId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nftId);

    if (nftId && isValidUUID) {
      // Valid UUID - look up directly
      nft = await prisma.nft.findUnique({
        where: { id: nftId },
        include: { collection: true },
      });
    }

    // If no valid nftId or NFT not found, try to find by contract address and tokenId
    if (!nft) {
      const collection = await prisma.collection.findUnique({
        where: { address: validatedData.assetContractAddress.toLowerCase() },
      });

      if (collection) {
        nft = await prisma.nft.findFirst({
          where: {
            collectionId: collection.id,
            OR: [
              { tokenId: validatedData.tokenId },
              { onChainTokenId: validatedData.tokenId },
            ],
          },
          include: { collection: true },
        });
        nftId = nft?.id;
      } else {
        nftId = undefined;
      }
    }

    // Verify the offer exists on-chain
    let onChainOffer = null;
    try {
      onChainOffer = await getOfferById(validatedData.offerId);
    } catch (chainError) {
      console.log('Error fetching on-chain offer:', chainError);
      // Continue anyway - may not be indexed yet
    }

    // Create the offer record
    const offerData = {
      offerId: validatedData.offerId,
      nftId: nftId || null,
      offerorAddress: validatedData.offerorAddress.toLowerCase(),
      assetContractAddress: validatedData.assetContractAddress.toLowerCase(),
      tokenId: validatedData.tokenId,
      quantity: validatedData.quantity,
      offerAmount: validatedData.offerAmount,
      expirationTimestamp: new Date(validatedData.expirationTimestamp),
      transactionHash: validatedData.transactionHash,
      status: 'ACTIVE' as const,
    };
    console.log("[POST /api/marketplace/offers] Creating offer with:", JSON.stringify(offerData, null, 2));

    const offer = await prisma.marketplaceOffer.create({
      data: offerData,
    });

    console.log("[POST /api/marketplace/offers] Offer created successfully:", {
      id: offer.id,
      offerId: offer.offerId,
      status: offer.status,
    });

    // Log the offer activity
    try {
      // Find the NFT owner if NFT exists
      let ownerId = null;
      if (nft?.ownerAddress) {
        const owner = await auth.getUserByWallet(nft.ownerAddress);
        ownerId = owner?.id || null;
      }

      await logOfferMade(
        offeror.id,
        ownerId,
        nftId || '',
        validatedData.offerId,
        validatedData.offerAmount,
        nft?.collectionId,
        validatedData.transactionHash
      );
    } catch (activityError) {
      console.error('Failed to log offer activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error('Error creating offer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to create offer record: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/offers
 * Fetch offers - by offeror, by NFT, or all active offers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offerorAddress = searchParams.get('offeror');
    const nftId = searchParams.get('nftId');
    const assetContract = searchParams.get('assetContract');
    const tokenId = searchParams.get('tokenId');
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      status: status as any,
    };

    if (offerorAddress) {
      where.offerorAddress = offerorAddress.toLowerCase();
    }

    if (nftId) {
      where.nftId = nftId;
    }

    if (assetContract && tokenId) {
      where.assetContractAddress = assetContract.toLowerCase();
      where.tokenId = tokenId;
    }

    const [offers, total] = await Promise.all([
      prisma.marketplaceOffer.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.marketplaceOffer.count({ where }),
    ]);

    // Also fetch offeror user info
    const offerorAddresses = [...new Set(offers.map(o => o.offerorAddress))];
    const users = await prisma.user.findMany({
      where: { walletAddress: { in: offerorAddresses } },
      select: { walletAddress: true, username: true, profilePicture: true },
    });
    const userMap = new Map(users.map(u => [u.walletAddress.toLowerCase(), u]));

    const offersWithUserInfo = offers.map(offer => ({
      ...offer,
      offeror: userMap.get(offer.offerorAddress) || null,
    }));

    return NextResponse.json({
      success: true,
      offers: offersWithUserInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/marketplace/offers
 * Cancel an offer (mark as cancelled)
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
      include: { nft: true },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
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
      try {
        await logOfferCanceled(
          user.id,
          existingOffer.nftId || '',
          offerId,
          existingOffer.nft?.collectionId
        );
      } catch (activityError) {
        console.error('Failed to log offer cancellation activity:', activityError);
      }
    }

    return NextResponse.json({
      success: true,
      offer: result,
    });
  } catch (error) {
    console.error('Error cancelling offer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel offer' },
      { status: 500 }
    );
  }
}
