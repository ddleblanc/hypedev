import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchListings, fetchAuctions, fetchOffers } from '@/lib/graph-client';

const prisma = new PrismaClient();
const SEPOLIA_CHAIN_ID = 11155111;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get collection contract address
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { address: true }
    });

    // Fetch NFTs for this collection
    const [nfts, totalCount] = await Promise.all([
      prisma.nft.findMany({
        where: {
          collectionId: collectionId,
        },
        skip,
        take: limit,
        orderBy: {
          tokenId: 'asc',
        },
        include: {
          traits: true,
        },
      }),
      prisma.nft.count({
        where: {
          collectionId: collectionId,
        },
      }),
    ]);

    // Fetch active listings and auctions from subgraph if we have contract address
    let listingsMap = new Map<string, any>();
    let auctionsMap = new Map<string, any>();
    let offersMap = new Map<string, any>();

    if (collection?.address) {
      try {
        // Fetch all active listings for this collection
        const [listings, auctions] = await Promise.all([
          fetchListings(SEPOLIA_CHAIN_ID, collection.address, 'CREATED', 1000),
          fetchAuctions(SEPOLIA_CHAIN_ID, collection.address, 'CREATED', 1000),
        ]);

        // Map listings by tokenId for quick lookup
        listings.forEach((listing: any) => {
          listingsMap.set(listing.tokenId.toString(), listing);
        });

        // Map auctions by tokenId
        auctions.forEach((auction: any) => {
          auctionsMap.set(auction.tokenId.toString(), auction);
        });

        // Fetch offers for listed tokens (batch in smaller chunks)
        const tokenIds = nfts.map(nft => nft.tokenId);
        for (const tokenId of tokenIds.slice(0, 20)) { // Limit to first 20 to avoid too many requests
          const offers = await fetchOffers(SEPOLIA_CHAIN_ID, collection.address, tokenId, 'CREATED', 5);
          if (offers.length > 0) {
            offersMap.set(tokenId, offers[0]); // Store highest offer
          }
        }
      } catch (graphError) {
        console.error('Error fetching from subgraph:', graphError);
        // Continue without subgraph data
      }
    }

    // Format NFTs to match expected structure with marketplace data
    const formattedNfts = nfts.map((nft, index) => {
      const listing = listingsMap.get(nft.tokenId);
      const auction = auctionsMap.get(nft.tokenId);
      const offer = offersMap.get(nft.tokenId);

      // Determine price - listing price or auction minimum bid
      let price = '0';
      let listed = false;
      let onAuction = false;
      let listingId = null;
      let auctionId = null;

      if (listing) {
        listed = true;
        listingId = listing.listingId;
        // Convert from wei to ETH
        price = (parseFloat(listing.pricePerToken) / 1e18).toFixed(4);
      }

      if (auction) {
        onAuction = true;
        auctionId = auction.auctionId;
        if (!listed) {
          price = (parseFloat(auction.minimumBidAmount) / 1e18).toFixed(4);
        }
      }

      return {
        id: parseInt(nft.tokenId),
        dbId: nft.id,
        name: nft.name || `#${nft.tokenId}`,
        price,
        lastSale: '0', // TODO: Get from sales history
        image: nft.image || '/api/placeholder/300/450',
        rarity: nft.rarityTier || 'Common',
        rank: nft.rarityRank || (skip + index + 1),
        likes: 0,
        owner: nft.ownerAddress || '',
        listed,
        listingId,
        onAuction,
        auctionId,
        hasOffer: !!offer,
        offerPrice: offer ? (parseFloat(offer.totalPrice) / 1e18).toFixed(4) : '0',
        traits: nft.traits.map(trait => ({
          trait_type: trait.traitType,
          value: trait.value,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      nfts: formattedNfts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NFTs',
        nfts: [],
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
