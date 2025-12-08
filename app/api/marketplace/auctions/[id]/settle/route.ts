import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logAuctionWon } from '@/lib/activity';
import { fetchWinningBid } from '@/lib/marketplace';

// Schema for settling an auction
const settleAuctionSchema = z.object({
  callerAddress: z.string(),
  transactionHash: z.string(),
});

/**
 * POST /api/marketplace/auctions/[id]/settle
 * Record auction settlement after on-chain transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;
    const body = await request.json();
    const validatedData = settleAuctionSchema.parse(body);

    // Find the auction in our database
    const auction = await prisma.marketplaceListing.findFirst({
      where: {
        listingId: auctionId,
        listingType: 'auction',
      },
      include: {
        nft: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found in database' },
        { status: 404 }
      );
    }

    if (auction.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Auction is not active (current status: ${auction.status})` },
        { status: 400 }
      );
    }

    // Check if auction has a winning bid
    if (!auction.highestBid || !auction.highestBidder) {
      return NextResponse.json(
        { success: false, error: 'Auction has no winning bid' },
        { status: 400 }
      );
    }

    // Get seller and winner information
    const seller = await auth.getUserByWallet(auction.sellerAddress);
    const winner = await auth.getUserByWallet(auction.highestBidder);

    // Verify on-chain state if possible
    try {
      const winningBid = await fetchWinningBid(auctionId);
      if (winningBid) {
        console.log('Settling auction with winning bid:', {
          bidder: winningBid.bidderAddress,
          amount: winningBid.currencyValue?.displayValue,
        });
      }
    } catch (chainError) {
      console.log('Could not verify winning bid on-chain:', chainError);
      // Continue anyway - the transaction hash was provided
    }

    // Update auction status and transfer NFT ownership
    const result = await prisma.$transaction(async (tx) => {
      // Update the auction status to SOLD
      const updatedAuction = await tx.marketplaceListing.update({
        where: { id: auction.id },
        data: {
          status: 'SOLD',
          transactionHash: validatedData.transactionHash,
        },
      });

      // Transfer NFT ownership to winner and clear listing data
      const updatedNft = await tx.nft.update({
        where: { id: auction.nftId },
        data: {
          ownerAddress: auction.highestBidder!.toLowerCase(),
          isListed: false,
          listingPrice: null,
          listingId: null,
          listingType: null,
          listingExpiry: null,
          listedAt: null,
        },
      });

      return { auction: updatedAuction, nft: updatedNft };
    });

    // Log the auction won activity
    try {
      if (seller && winner) {
        await logAuctionWon(
          winner.id,
          seller.id,
          auction.nftId,
          auctionId,
          auction.highestBid!,
          auction.nft?.collectionId || undefined,
          validatedData.transactionHash
        );
      }
    } catch (activityError) {
      console.error('Failed to log auction won activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Auction settled successfully',
      auction: result.auction,
      nft: result.nft,
      winner: {
        address: auction.highestBidder,
        winningBid: auction.highestBid,
      },
      seller: {
        address: auction.sellerAddress,
      },
    });
  } catch (error) {
    console.error('Error settling auction:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to settle auction: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketplace/auctions/[id]/settle
 * Get auction settlement status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;

    // Get the auction
    const auction = await prisma.marketplaceListing.findFirst({
      where: {
        listingId: auctionId,
        listingType: 'auction',
      },
      include: {
        nft: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const hasEnded = auction.endTimestamp && now > auction.endTimestamp;
    const hasWinner = auction.highestBid && auction.highestBidder;
    const canSettle = hasEnded && hasWinner && auction.status === 'ACTIVE';

    return NextResponse.json({
      success: true,
      auction: {
        id: auctionId,
        status: auction.status,
        endTimestamp: auction.endTimestamp,
        hasEnded,
        hasWinner,
        canSettle,
        winningBid: hasWinner ? {
          amount: auction.highestBid,
          bidder: auction.highestBidder,
        } : null,
        seller: auction.sellerAddress,
        nft: {
          id: auction.nftId,
          currentOwner: auction.nft?.ownerAddress,
        },
      },
    });
  } catch (error) {
    console.error('Error getting auction settlement status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get auction status' },
      { status: 500 }
    );
  }
}
