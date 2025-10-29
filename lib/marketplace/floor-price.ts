import { createThirdwebClient, getContract, defineChain } from 'thirdweb';
import { getAllValidListings } from 'thirdweb/extensions/marketplace';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Thirdweb client
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Get marketplace contract
function getMarketplaceContract() {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
  const marketplaceAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;

  if (!marketplaceAddress) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS is not set');
  }

  const chain = defineChain(chainId);
  return getContract({
    client,
    chain,
    address: marketplaceAddress,
  });
}

/**
 * Fetch floor price for a specific NFT collection from the marketplace
 * @param collectionAddress - The NFT collection contract address
 * @returns Floor price in ETH, or null if no listings found
 */
export async function getCollectionFloorPrice(
  collectionAddress: string
): Promise<number | null> {
  try {
    const contract = getMarketplaceContract();

    // Get all valid (active) listings from the marketplace
    const allListings = await getAllValidListings({
      contract,
      count: BigInt(1000), // Fetch up to 1000 listings
    });

    // Filter listings for this specific collection and sort by price
    const collectionListings = allListings
      .filter((listing) => {
        // Check if the listing is for an NFT from this collection
        return listing.assetContractAddress.toLowerCase() === collectionAddress.toLowerCase();
      })
      .map((listing) => {
        // Convert price to number (assuming ETH/native token)
        // Price is typically in wei, so convert to ETH
        const priceInWei = listing.pricePerToken;
        const priceInEth = Number(priceInWei) / 1e18;
        return priceInEth;
      })
      .filter((price) => price > 0) // Remove invalid prices
      .sort((a, b) => a - b); // Sort ascending to get floor

    // Return the lowest price (floor) or null if no listings
    return collectionListings.length > 0 ? collectionListings[0] : null;
  } catch (error) {
    console.error('Error fetching floor price:', error);
    return null;
  }
}

/**
 * Sync floor prices for all deployed collections in the database
 * Updates collections where floor price cache is older than 5 minutes
 */
export async function syncFloorPrices(): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Get all deployed collections that need floor price update
    const collections = await prisma.collection.findMany({
      where: {
        isDeployed: true,
        address: { not: '' },
        OR: [
          { lastFloorPriceSync: null },
          { lastFloorPriceSync: { lt: fiveMinutesAgo } },
        ],
      },
      select: {
        id: true,
        address: true,
      },
    });

    console.log(`Syncing floor prices for ${collections.length} collections...`);

    // Update floor prices for each collection
    for (const collection of collections) {
      try {
        const floorPrice = await getCollectionFloorPrice(collection.address);

        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            floorPrice,
            lastFloorPriceSync: new Date(),
          },
        });

        console.log(
          `Updated floor price for collection ${collection.address}: ${floorPrice || 'No listings'}`
        );
      } catch (error) {
        console.error(
          `Failed to update floor price for collection ${collection.address}:`,
          error
        );
      }
    }

    console.log('Floor price sync completed');
  } catch (error) {
    console.error('Error syncing floor prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get cached floor price for a collection, or fetch if cache is stale
 * @param collectionId - The collection ID in the database
 * @returns Floor price in ETH, or null if no listings
 */
export async function getCachedFloorPrice(
  collectionId: string
): Promise<number | null> {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        address: true,
        floorPrice: true,
        lastFloorPriceSync: true,
      },
    });

    if (!collection) {
      return null;
    }

    // Check if cache is fresh (less than 5 minutes old)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isCacheFresh =
      collection.lastFloorPriceSync &&
      collection.lastFloorPriceSync > fiveMinutesAgo;

    if (isCacheFresh && collection.floorPrice !== null) {
      return collection.floorPrice;
    }

    // Cache is stale, fetch fresh data
    const floorPrice = await getCollectionFloorPrice(collection.address);

    // Update cache
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        floorPrice,
        lastFloorPriceSync: new Date(),
      },
    });

    return floorPrice;
  } catch (error) {
    console.error('Error getting cached floor price:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
