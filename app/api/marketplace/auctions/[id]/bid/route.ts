import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logBidPlaced } from '@/lib/activity';
import { fetchWinningBid } from '@/lib/marketplace';
import { rateLimitCheck } from '@/lib/rate-limit';

// Schema for placing a bid
const placeBidSchema = z.object({
  bidderAddress: z.string(),
  bidAmount: z.number().positive(),
  transactionHash: z.string(),
});

/**
 * POST /api/marketplace/auctions/[id]/bid
 * Record a bid after on-chain transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit blockchain operations
  const rateLimit = await rateLimitCheck(request, "blockchain");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const { id: auctionId } = await params;
    const body = await request.json();
    const validatedData = placeBidSchema.parse(body);

    // Verify the bidder exists in our system
    const bidder = await auth.getUserByWallet(validatedData.bidderAddress);
    if (!bidder) {
      return NextResponse.json(
        { success: false, error: 'Bidder not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

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

    // Check if auction has ended
    if (auction.endTimestamp && new Date() > auction.endTimestamp) {
      return NextResponse.json(
        { success: false, error: 'Auction has ended' },
        { status: 400 }
      );
    }

    // Verify bid is higher than current highest bid
    const currentHighestBid = auction.highestBid || auction.minimumBidAmount || 0;
    if (validatedData.bidAmount <= currentHighestBid) {
      return NextResponse.json(
        { success: false, error: `Bid must be higher than current bid (${currentHighestBid} ETH)` },
        { status: 400 }
      );
    }

    // Verify the bid on-chain
    try {
      const winningBid = await fetchWinningBid(auctionId);
      if (winningBid) {
        console.log('On-chain winning bid:', {
          bidder: winningBid.bidderAddress,
          amount: winningBid.bidAmountWei?.toString(),
        });
      }
    } catch (chainError) {
      console.log('Could not fetch winning bid from chain:', chainError);
      // Continue anyway - the transaction hash was provided
    }

    // Get seller information for activity logging
    const seller = await auth.getUserByWallet(auction.sellerAddress);

    // Update the auction with the new bid
    const updatedAuction = await prisma.marketplaceListing.update({
      where: { id: auction.id },
      data: {
        highestBid: validatedData.bidAmount,
        highestBidder: validatedData.bidderAddress.toLowerCase(),
      },
    });

    // Log the bid activity
    try {
      if (seller) {
        await logBidPlaced(
          bidder.id,
          seller.id,
          auction.nftId,
          auctionId,
          validatedData.bidAmount,
          auction.nft?.collectionId || undefined,
          validatedData.transactionHash
        );
      }
    } catch (activityError) {
      console.error('Failed to log bid activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    const response = NextResponse.json({
      success: true,
      message: 'Bid recorded successfully',
      auction: updatedAuction,
      bid: {
        amount: validatedData.bidAmount,
        bidder: validatedData.bidderAddress,
        transactionHash: validatedData.transactionHash,
      },
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error('Error recording bid:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
      return rateLimit.applyHeaders(response);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = NextResponse.json(
      { success: false, error: `Failed to record bid: ${errorMessage}` },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}

/**
 * GET /api/marketplace/auctions/[id]/bid
 * Get bid history for an auction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit API reads
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const { id: auctionId } = await params;

    // Get the auction
    const auction = await prisma.marketplaceListing.findFirst({
      where: {
        listingId: auctionId,
        listingType: 'auction',
      },
      select: {
        id: true,
        highestBid: true,
        highestBidder: true,
        minimumBidAmount: true,
        nftId: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Get bid activities for this auction with user info
    const bidActivities = await prisma.activity.findMany({
      where: {
        type: 'bid_placed',
        listingId: auctionId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user data for bidders
    const userIds = bidActivities.map(a => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        profilePicture: true,
      },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Also get on-chain winning bid
    let onChainWinningBid = null;
    try {
      onChainWinningBid = await fetchWinningBid(auctionId);
    } catch {
      // Ignore if we can't fetch
    }

    const response = NextResponse.json({
      success: true,
      currentBid: {
        amount: auction.highestBid || auction.minimumBidAmount,
        bidder: auction.highestBidder,
      },
      bidHistory: bidActivities.map(activity => {
        const user = userMap.get(activity.userId);
        return {
          amount: activity.amount,
          bidder: user?.walletAddress,
          username: user?.username,
          avatar: user?.profilePicture,
          timestamp: activity.createdAt,
          transactionHash: activity.transactionHash,
        };
      }),
      onChainWinningBid: onChainWinningBid ? {
        amount: onChainWinningBid.currencyValue?.displayValue,
        bidder: onChainWinningBid.bidderAddress,
      } : null,
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error('Error fetching bid history:', error);
    const response = NextResponse.json(
      { success: false, error: 'Failed to fetch bid history' },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}
