import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireAuth, AuthError } from '@/lib/thirdweb-auth';
import { rateLimitCheck } from '@/lib/rate-limit';

// Schema for accepting a collection offer
const acceptCollectionOfferSchema = z.object({
  tokenId: z.string(), // The specific token ID being used to fulfill the offer
  nftId: z.string().uuid().optional(), // Optional database NFT ID
  transactionHash: z.string(),
});

/**
 * POST /api/marketplace/collection-offers/[id]/accept
 * Accept a collection offer with a specific NFT
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: blockchain operations (20 req/min with 60s block)
  const rateCheck = await rateLimitCheck(request, "blockchain");
  if (rateCheck.blocked) return rateCheck.response;

  try {
    const { id: offerId } = await params;
    const body = await request.json();
    const validatedData = acceptCollectionOfferSchema.parse(body);

    // Find the offer
    const offer = await prisma.marketplaceOffer.findUnique({
      where: { offerId },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (!offer.isCollectionOffer) {
      return NextResponse.json(
        { success: false, error: 'This is not a collection offer' },
        { status: 400 }
      );
    }

    if (offer.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Offer is no longer active' },
        { status: 400 }
      );
    }

    if (new Date() > offer.expirationTimestamp) {
      return NextResponse.json(
        { success: false, error: 'Offer has expired' },
        { status: 400 }
      );
    }

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

    // Ensure the acceptor is not the offeror
    if (user.walletAddress.toLowerCase() === offer.offerorAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Cannot accept your own offer' },
        { status: 400 }
      );
    }

    // Try to find the NFT in our database
    let nft = null;
    if (validatedData.nftId) {
      nft = await prisma.nft.findUnique({
        where: { id: validatedData.nftId },
        include: { collection: true },
      });
    } else {
      // Find by collection address and tokenId
      const collection = await prisma.collection.findUnique({
        where: { address: offer.assetContractAddress },
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
      }
    }

    // Update the offer as accepted
    const updatedOffer = await prisma.marketplaceOffer.update({
      where: { offerId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedTokenId: validatedData.tokenId,
        transactionHash: validatedData.transactionHash,
      },
    });

    // Update NFT ownership if we have it in DB
    if (nft) {
      await prisma.nft.update({
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

    // Log activity for the seller (current user)
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'collection_offer_accepted',
        nftId: nft?.id,
        collectionId: offer.collectionId,
        amount: offer.offerAmount,
        currency: 'ETH',
        transactionHash: validatedData.transactionHash,
        metadata: {
          offerId,
          tokenId: validatedData.tokenId,
          buyer: offer.offerorAddress,
        },
      },
    });

    // Log activity for the buyer (offeror)
    const buyer = await auth.getUserByWallet(offer.offerorAddress);
    if (buyer) {
      await prisma.activity.create({
        data: {
          userId: buyer.id,
          type: 'nft_purchased',
          nftId: nft?.id,
          collectionId: offer.collectionId,
          relatedUserId: user.id,
          amount: offer.offerAmount,
          currency: 'ETH',
          transactionHash: validatedData.transactionHash,
          metadata: {
            via: 'collection_offer',
            offerId,
            tokenId: validatedData.tokenId,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      nft: nft ? {
        id: nft.id,
        name: nft.name,
        image: nft.image,
        tokenId: nft.tokenId,
        newOwner: offer.offerorAddress,
      } : null,
    });
  } catch (error) {
    console.error('Error accepting collection offer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to accept collection offer: ${errorMessage}` },
      { status: 500 }
    );
  }
}
