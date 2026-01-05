import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getAllListings, weiToEth, ethToWei } from '@/lib/marketplace';
import { rateLimitCheck } from '@/lib/rate-limit';

// Schema for sweep floor preview request
const sweepPreviewSchema = z.object({
  collectionAddress: z.string(),
  maxItems: z.number().int().positive().max(50).default(10),
  maxTotalPrice: z.string().optional(), // In ETH
});

// Schema for sweep floor execution request (after on-chain transactions)
const sweepExecuteSchema = z.object({
  collectionAddress: z.string(),
  transactions: z.array(z.object({
    listingId: z.string(),
    transactionHash: z.string(),
  })),
  buyerAddress: z.string(),
});

/**
 * GET /api/marketplace/sweep
 * Preview sweep floor - get available floor listings for a collection
 */
export async function GET(request: NextRequest) {
  // Rate limit API reads
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionAddress = searchParams.get('collection');
    const maxItems = parseInt(searchParams.get('maxItems') || '10', 10);
    const maxTotalPrice = searchParams.get('maxTotalPrice'); // In ETH

    if (!collectionAddress) {
      return NextResponse.json(
        { success: false, error: 'Collection address is required' },
        { status: 400 }
      );
    }

    // Get all valid listings from on-chain
    const allListings = await getAllListings();

    // Filter for this collection and sort by price (floor first)
    const collectionListings = allListings
      .filter(
        (listing) =>
          listing.assetContractAddress.toLowerCase() === collectionAddress.toLowerCase()
      )
      .sort((a, b) => {
        const priceA = Number(a.pricePerToken);
        const priceB = Number(b.pricePerToken);
        return priceA - priceB;
      });

    if (collectionListings.length === 0) {
      return NextResponse.json({
        success: true,
        listings: [],
        summary: {
          totalAvailable: 0,
          floorPrice: null,
          selectedCount: 0,
          totalPrice: '0',
        },
      });
    }

    // Select listings based on constraints
    const maxTotalPriceWei = maxTotalPrice ? ethToWei(maxTotalPrice) : null;
    const selectedListings: typeof collectionListings = [];
    let totalPriceWei = BigInt(0);

    for (const listing of collectionListings) {
      if (selectedListings.length >= maxItems) break;
      if (maxTotalPriceWei && totalPriceWei + listing.pricePerToken > maxTotalPriceWei) break;

      selectedListings.push(listing);
      totalPriceWei += listing.pricePerToken;
    }

    // Get NFT metadata from our database for the selected listings
    const tokenIds = selectedListings.map((l) => l.tokenId.toString());
    const nfts = await prisma.nft.findMany({
      where: {
        collection: {
          address: collectionAddress.toLowerCase(),
        },
        onChainTokenId: { in: tokenIds },
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Map NFT metadata to listings
    const nftMap = new Map(nfts.map((nft) => [nft.onChainTokenId, nft]));

    const enrichedListings = selectedListings.map((listing) => {
      const nft = nftMap.get(listing.tokenId.toString());
      return {
        listingId: listing.id.toString(),
        tokenId: listing.tokenId.toString(),
        priceWei: listing.pricePerToken.toString(),
        priceEth: weiToEth(listing.pricePerToken),
        sellerAddress: listing.creatorAddress,
        nft: nft
          ? {
              id: nft.id,
              name: nft.name,
              image: nft.image,
              collection: nft.collection,
            }
          : null,
      };
    });

    const floorPrice =
      collectionListings.length > 0
        ? weiToEth(collectionListings[0].pricePerToken)
        : null;

    const response = NextResponse.json({
      success: true,
      listings: enrichedListings,
      summary: {
        totalAvailable: collectionListings.length,
        floorPrice,
        selectedCount: selectedListings.length,
        totalPrice: weiToEth(totalPriceWei),
        totalPriceWei: totalPriceWei.toString(),
      },
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error('Error previewing sweep floor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = NextResponse.json(
      { success: false, error: `Failed to preview sweep: ${errorMessage}` },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}

/**
 * POST /api/marketplace/sweep
 * Record successful sweep floor purchases after on-chain transactions
 */
export async function POST(request: NextRequest) {
  // Rate limit blockchain operations
  const rateLimit = await rateLimitCheck(request, "blockchain");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const body = await request.json();
    const validatedData = sweepExecuteSchema.parse(body);

    // Verify the buyer exists
    const buyer = await auth.getUserByWallet(validatedData.buyerAddress);
    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Buyer not found. Please connect your wallet first.' },
        { status: 401 }
      );
    }

    // Batch fetch all listings upfront to avoid N+1 queries
    const listingIds = validatedData.transactions.map((tx) => tx.listingId);
    const listings = await prisma.marketplaceListing.findMany({
      where: { listingId: { in: listingIds } },
      include: { nft: true },
    });
    const listingsMap = new Map(listings.map((l) => [l.listingId, l]));

    // Process each transaction
    const results = [];
    const errors = [];

    for (const tx of validatedData.transactions) {
      try {
        // Get listing from pre-fetched map
        const listing = listingsMap.get(tx.listingId);

        if (!listing) {
          errors.push({ listingId: tx.listingId, error: 'Listing not found' });
          continue;
        }

        if (listing.status !== 'ACTIVE') {
          errors.push({ listingId: tx.listingId, error: `Listing not active: ${listing.status}` });
          continue;
        }

        // Update listing and NFT in transaction
        const result = await prisma.$transaction(async (prismaClient) => {
          // Update listing status
          const updatedListing = await prismaClient.marketplaceListing.update({
            where: { listingId: tx.listingId },
            data: {
              status: 'SOLD',
              transactionHash: tx.transactionHash,
            },
          });

          // Transfer NFT ownership
          const updatedNft = await prismaClient.nft.update({
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

        results.push({
          listingId: tx.listingId,
          transactionHash: tx.transactionHash,
          nftId: result.nft.id,
          success: true,
        });
      } catch (txError) {
        console.error(`Error processing sweep transaction for listing ${tx.listingId}:`, txError);
        errors.push({
          listingId: tx.listingId,
          error: txError instanceof Error ? txError.message : 'Unknown error',
        });
      }
    }

    const response = NextResponse.json({
      success: true,
      message: `Sweep recorded: ${results.length} successful, ${errors.length} failed`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      buyer: {
        address: validatedData.buyerAddress,
        id: buyer.id,
      },
    });
    return rateLimit.applyHeaders(response);
  } catch (error) {
    console.error('Error recording sweep purchases:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
      return rateLimit.applyHeaders(response);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = NextResponse.json(
      { success: false, error: `Failed to record sweep: ${errorMessage}` },
      { status: 500 }
    );
    return rateLimit.applyHeaders(response);
  }
}
