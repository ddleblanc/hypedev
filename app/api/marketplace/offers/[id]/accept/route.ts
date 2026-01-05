import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logOfferAccepted } from '@/lib/activity';
import { rateLimitCheck } from '@/lib/rate-limit';

// Schema for accepting an offer
const acceptOfferSchema = z.object({
  ownerAddress: z.string(),
  transactionHash: z.string(),
});

/**
 * POST /api/marketplace/offers/[id]/accept
 * Record an accepted offer after on-chain transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit blockchain operations
  const rateLimit = await rateLimitCheck(request, "blockchain");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const { id: offerId } = await params;
    const body = await request.json();
    const validatedData = acceptOfferSchema.parse(body);

    // Verify the owner exists in our system
    const owner = await auth.getUserByWallet(validatedData.ownerAddress);
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

    // Find the offer
    const offer = await prisma.marketplaceOffer.findUnique({
      where: { offerId },
      include: {
        nft: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found in database' },
        { status: 404 }
      );
    }

    if (offer.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Offer is not active (current status: ${offer.status})` },
        { status: 400 }
      );
    }

    // Verify the owner is the NFT owner (if NFT exists in our DB)
    if (offer.nft && offer.nft.ownerAddress) {
      if (offer.nft.ownerAddress.toLowerCase() !== validatedData.ownerAddress.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'You are not the owner of this NFT' },
          { status: 403 }
        );
      }
    }

    // Get offeror user info
    const offeror = await auth.getUserByWallet(offer.offerorAddress);

    // Update offer status and transfer NFT ownership
    const result = await prisma.$transaction(async (tx) => {
      // Update the offer status to ACCEPTED
      const updatedOffer = await tx.marketplaceOffer.update({
        where: { offerId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // If NFT exists in our DB, transfer ownership
      let updatedNft = null;
      if (offer.nftId) {
        updatedNft = await tx.nft.update({
          where: { id: offer.nftId },
          data: {
            ownerAddress: offer.offerorAddress.toLowerCase(),
            isListed: false,
            listingPrice: null,
            listingId: null,
            listingType: null,
            listingExpiry: null,
            listedAt: null,
          },
        });

        // Also cancel any active listings for this NFT
        await tx.marketplaceListing.updateMany({
          where: {
            nftId: offer.nftId,
            status: 'ACTIVE',
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      return { offer: updatedOffer, nft: updatedNft };
    });

    // Log the accept activity
    try {
      if (offeror) {
        await logOfferAccepted(
          owner.id,
          offeror.id,
          offer.nftId || '',
          offerId,
          offer.offerAmount,
          offer.nft?.collectionId,
          validatedData.transactionHash
        );
      }
    } catch (activityError) {
      console.error('Failed to log offer accepted activity:', activityError);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      offer: result.offer,
      nft: result.nft,
      buyer: {
        address: offer.offerorAddress,
        id: offeror?.id,
      },
      seller: {
        address: validatedData.ownerAddress,
        id: owner.id,
      },
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error('Error accepting offer:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
      return rateLimit.applyHeaders(response);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = NextResponse.json(
      { success: false, error: `Failed to accept offer: ${errorMessage}` },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}
