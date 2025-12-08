import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAllValidAuctions, getAllValidListings } from 'thirdweb/extensions/marketplace';
import { getMarketplaceContract, MARKETPLACE_CHAIN_ID } from '@/lib/marketplace';

// Admin key - MUST be set in environment, no default
const ADMIN_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_KEY) {
  console.error('CRITICAL: ADMIN_API_KEY environment variable is not set');
}

/**
 * Parse timestamp from various formats thirdweb might return
 */
function parseTimestamp(value: any): Date {
  if (!value) return new Date();

  // If it's already a Date
  if (value instanceof Date) return value;

  // If it's a BigInt
  if (typeof value === 'bigint') {
    const num = Number(value);
    // If it looks like seconds (less than year 3000 in seconds)
    if (num < 32503680000) {
      return new Date(num * 1000);
    }
    // If it looks like milliseconds
    return new Date(num);
  }

  // If it's a number
  if (typeof value === 'number') {
    // If it looks like seconds
    if (value < 32503680000) {
      return new Date(value * 1000);
    }
    return new Date(value);
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      if (num < 32503680000) {
        return new Date(num * 1000);
      }
      return new Date(num);
    }
    return new Date(value);
  }

  return new Date();
}

/**
 * POST /api/admin/sync-listings
 *
 * Sync marketplace listings from on-chain to database
 * This finds active on-chain listings/auctions and updates the database
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin key
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin API not configured' },
        { status: 503 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dryRun = true, sellerAddress } = body;

    const marketplace = getMarketplaceContract();

    // Fetch all valid auctions from on-chain
    let onChainAuctions: any[] = [];
    let onChainListings: any[] = [];

    try {
      onChainAuctions = await getAllValidAuctions({ contract: marketplace });
      console.log(`Found ${onChainAuctions.length} valid auctions on-chain`);
    } catch (e) {
      console.error('Error fetching on-chain auctions:', e);
    }

    try {
      onChainListings = await getAllValidListings({ contract: marketplace });
      console.log(`Found ${onChainListings.length} valid listings on-chain`);
    } catch (e) {
      console.error('Error fetching on-chain listings:', e);
    }

    // Filter by seller if provided
    if (sellerAddress) {
      const normalizedSeller = sellerAddress.toLowerCase();
      onChainAuctions = onChainAuctions.filter(
        (a: any) => a.creatorAddress?.toLowerCase() === normalizedSeller ||
                    a.auctionCreator?.toLowerCase() === normalizedSeller
      );
      onChainListings = onChainListings.filter(
        (l: any) => l.creatorAddress?.toLowerCase() === normalizedSeller ||
                    l.listingCreator?.toLowerCase() === normalizedSeller
      );
    }

    const results = {
      auctions: { found: 0, synced: 0, errors: 0, details: [] as any[] },
      listings: { found: 0, synced: 0, errors: 0, details: [] as any[] },
    };

    // Process auctions
    for (const auction of onChainAuctions) {
      results.auctions.found++;

      const auctionId = auction.id?.toString() || auction.auctionId?.toString();
      const tokenId = auction.tokenId?.toString();
      const assetContract = auction.assetContractAddress?.toLowerCase() || auction.assetContract?.toLowerCase();
      const seller = auction.creatorAddress?.toLowerCase() || auction.auctionCreator?.toLowerCase();

      if (!auctionId || !tokenId || !assetContract) {
        results.auctions.errors++;
        results.auctions.details.push({
          auctionId,
          status: 'error',
          error: 'Missing required fields',
        });
        continue;
      }

      // Find the NFT in database
      const nft = await prisma.nft.findFirst({
        where: {
          collection: {
            address: { equals: assetContract, mode: 'insensitive' }
          },
          OR: [
            { onChainTokenId: tokenId },
            { tokenId: tokenId },
          ]
        }
      });

      if (!nft) {
        results.auctions.details.push({
          auctionId,
          tokenId,
          assetContract,
          status: 'skipped',
          error: 'NFT not found in database',
        });
        continue;
      }

      if (!dryRun) {
        try {
          // Upsert the marketplace listing
          const startTs = parseTimestamp(auction.startTimestamp || auction.startTimeInSeconds);
          const endTs = parseTimestamp(auction.endTimestamp || auction.endTimeInSeconds);
          const minBid = Number(auction.minimumBidAmount || auction.minimumBidCurrencyValue?.value || 0) / 1e18;
          const buyout = Number(auction.buyoutBidAmount || auction.buyoutCurrencyValue?.value || 0) / 1e18;

          await prisma.marketplaceListing.upsert({
            where: { listingId: auctionId },
            create: {
              listingId: auctionId,
              nftId: nft.id,
              sellerAddress: seller,
              assetContractAddress: assetContract,
              tokenId: tokenId,
              quantity: Number(auction.quantity) || 1,
              pricePerToken: minBid || 0,
              listingType: 'auction',
              minimumBidAmount: minBid || 0,
              buyoutBidAmount: buyout || undefined,
              startTimestamp: startTs,
              endTimestamp: endTs,
              status: 'ACTIVE',
            },
            update: {
              pricePerToken: minBid || 0,
              minimumBidAmount: minBid || 0,
              buyoutBidAmount: buyout || undefined,
              endTimestamp: endTs,
              status: 'ACTIVE',
            },
          });

          // Update the NFT
          await prisma.nft.update({
            where: { id: nft.id },
            data: {
              isListed: true,
              listingPrice: minBid || 0,
              listingId: auctionId,
              listingType: 'auction',
              listingExpiry: endTs,
            },
          });

          results.auctions.synced++;
          results.auctions.details.push({
            auctionId,
            nftId: nft.id,
            tokenId,
            status: 'synced',
          });
        } catch (e: any) {
          results.auctions.errors++;
          results.auctions.details.push({
            auctionId,
            nftId: nft.id,
            status: 'error',
            error: e.message,
          });
        }
      } else {
        results.auctions.details.push({
          auctionId,
          nftId: nft.id,
          tokenId,
          status: 'would_sync',
        });
      }
    }

    // Process direct listings similarly
    for (const listing of onChainListings) {
      results.listings.found++;

      const listingId = listing.id?.toString() || listing.listingId?.toString();
      const tokenId = listing.tokenId?.toString();
      const assetContract = listing.assetContractAddress?.toLowerCase() || listing.assetContract?.toLowerCase();
      const seller = listing.creatorAddress?.toLowerCase() || listing.listingCreator?.toLowerCase();

      if (!listingId || !tokenId || !assetContract) {
        results.listings.errors++;
        continue;
      }

      const nft = await prisma.nft.findFirst({
        where: {
          collection: {
            address: { equals: assetContract, mode: 'insensitive' }
          },
          OR: [
            { onChainTokenId: tokenId },
            { tokenId: tokenId },
          ]
        }
      });

      if (!nft) {
        results.listings.details.push({
          listingId,
          tokenId,
          status: 'skipped',
          error: 'NFT not found in database',
        });
        continue;
      }

      if (!dryRun) {
        try {
          const startTs = parseTimestamp(listing.startTimestamp || listing.startTimeInSeconds);
          const endTs = parseTimestamp(listing.endTimestamp || listing.endTimeInSeconds);
          const price = Number(listing.pricePerToken || listing.currencyValuePerToken?.value || 0) / 1e18;

          // Prefix listing IDs with 'L' to distinguish from auction IDs
          const dbListingId = `L${listingId}`;

          await prisma.marketplaceListing.upsert({
            where: { listingId: dbListingId },
            create: {
              listingId: dbListingId,
              nftId: nft.id,
              sellerAddress: seller,
              assetContractAddress: assetContract,
              tokenId: tokenId,
              quantity: Number(listing.quantity) || 1,
              pricePerToken: price || 0,
              listingType: 'direct',
              startTimestamp: startTs,
              endTimestamp: endTs,
              status: 'ACTIVE',
            },
            update: {
              pricePerToken: price || 0,
              endTimestamp: endTs,
              status: 'ACTIVE',
            },
          });

          await prisma.nft.update({
            where: { id: nft.id },
            data: {
              isListed: true,
              listingPrice: price || 0,
              listingId: dbListingId,
              listingType: 'direct',
              listingExpiry: endTs,
            },
          });

          results.listings.synced++;
          results.listings.details.push({
            listingId: dbListingId,
            nftId: nft.id,
            tokenId,
            status: 'synced',
          });
        } catch (e: any) {
          results.listings.errors++;
          results.listings.details.push({
            listingId,
            status: 'error',
            error: e.message,
          });
        }
      } else {
        results.listings.details.push({
          listingId,
          nftId: nft.id,
          tokenId,
          status: 'would_sync',
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      results,
    });

  } catch (error: any) {
    console.error('Sync listings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync listings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-listings
 *
 * Get current sync status - compare on-chain vs database
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin key
    if (!ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin API not configured' },
        { status: 503 }
      );
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${ADMIN_KEY}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const marketplace = getMarketplaceContract();

    // Get counts
    let onChainAuctionCount = 0;
    let onChainListingCount = 0;

    try {
      const auctions = await getAllValidAuctions({ contract: marketplace });
      onChainAuctionCount = auctions.length;
    } catch (e) {
      console.error('Error counting auctions:', e);
    }

    try {
      const listings = await getAllValidListings({ contract: marketplace });
      onChainListingCount = listings.length;
    } catch (e) {
      console.error('Error counting listings:', e);
    }

    const dbAuctionCount = await prisma.marketplaceListing.count({
      where: { listingType: 'auction', status: 'ACTIVE' }
    });

    const dbListingCount = await prisma.marketplaceListing.count({
      where: { listingType: 'direct', status: 'ACTIVE' }
    });

    return NextResponse.json({
      success: true,
      onChain: {
        auctions: onChainAuctionCount,
        listings: onChainListingCount,
        total: onChainAuctionCount + onChainListingCount,
      },
      database: {
        auctions: dbAuctionCount,
        listings: dbListingCount,
        total: dbAuctionCount + dbListingCount,
      },
      needsSync: (onChainAuctionCount !== dbAuctionCount) || (onChainListingCount !== dbListingCount),
    });

  } catch (error: any) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
