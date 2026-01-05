import { GraphQLClient } from 'graphql-request';

// The Graph endpoints for different networks
const GRAPH_ENDPOINTS = {
  // Sepolia testnet - your deployed hyperchain-x subgraph
  11155111: process.env.NEXT_PUBLIC_GRAPH_SEPOLIA_ENDPOINT ||
    'https://api.studio.thegraph.com/query/118938/hyperchain-x/v0.2.0',

  // Mainnet - using popular NFT subgraph
  1: 'https://api.thegraph.com/subgraphs/name/messari/nft-marketplace',

  // Base
  8453: process.env.NEXT_PUBLIC_GRAPH_BASE_ENDPOINT ||
    'https://api.studio.thegraph.com/query/your-id/your-subgraph/v0.0.1'
};

export function getGraphClient(chainId: number): GraphQLClient | null {
  const endpoint = GRAPH_ENDPOINTS[chainId as keyof typeof GRAPH_ENDPOINTS];
  if (!endpoint || endpoint.includes('your-')) {
    console.warn(`No Graph endpoint configured for chain ${chainId}`);
    return null;
  }
  return new GraphQLClient(endpoint);
}

// ==========================================
// Marketplace Queries (DirectListings, Auctions, Offers)
// ==========================================

// Get active listings for a collection
export const LISTINGS_QUERY = `
  query GetListings($assetContract: Bytes, $status: String, $first: Int, $skip: Int) {
    listings(
      where: { assetContract: $assetContract, status: $status }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      listingId
      listingCreator
      assetContract
      tokenId
      quantity
      currency
      pricePerToken
      startTimestamp
      endTimestamp
      tokenType
      status
      reserved
      buyer
      quantitySold
      totalPricePaid
      createdAt
      soldAt
      transactionHash
    }
  }
`;

// Get active auctions for a collection
export const AUCTIONS_QUERY = `
  query GetAuctions($assetContract: Bytes, $status: String, $first: Int, $skip: Int) {
    auctions(
      where: { assetContract: $assetContract, status: $status }
      first: $first
      skip: $skip
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      auctionId
      auctionCreator
      assetContract
      tokenId
      quantity
      currency
      minimumBidAmount
      buyoutBidAmount
      timeBufferInSeconds
      bidBufferBps
      startTimestamp
      endTimestamp
      tokenType
      status
      winningBidder
      winningBid
      createdAt
      closedAt
      transactionHash
    }
  }
`;

// Get offers for a token
export const OFFERS_QUERY = `
  query GetOffers($assetContract: Bytes, $tokenId: BigInt, $status: String, $first: Int) {
    offers(
      where: { assetContract: $assetContract, tokenId: $tokenId, status: $status }
      first: $first
      orderBy: totalPrice
      orderDirection: desc
    ) {
      id
      offerId
      offeror
      assetContract
      tokenId
      quantity
      currency
      totalPrice
      expirationTimestamp
      tokenType
      status
      seller
      createdAt
      acceptedAt
      transactionHash
    }
  }
`;

// Batch get offers for multiple tokens
export const OFFERS_BATCH_QUERY = `
  query GetOffersBatch($assetContract: Bytes, $tokenIds: [BigInt!], $status: String, $first: Int) {
    offers(
      where: { assetContract: $assetContract, tokenId_in: $tokenIds, status: $status }
      first: $first
      orderBy: totalPrice
      orderDirection: desc
    ) {
      id
      offerId
      offeror
      assetContract
      tokenId
      quantity
      currency
      totalPrice
      expirationTimestamp
      tokenType
      status
      seller
      createdAt
      acceptedAt
      transactionHash
    }
  }
`;

// Get marketplace stats
export const MARKETPLACE_STATS_QUERY = `
  query GetMarketplaceStats {
    marketplaceStats(id: "global") {
      id
      totalListings
      totalSales
      totalAuctions
      totalOffers
      totalVolumeETH
      lastUpdated
    }
  }
`;

// Get collection stats from subgraph
export const COLLECTION_STATS_GRAPH_QUERY = `
  query GetCollectionStats($assetContract: ID!) {
    collectionStats(id: $assetContract) {
      id
      assetContract
      totalListings
      totalSales
      totalAuctions
      totalOffers
      totalVolumeETH
      floorPrice
      lastSalePrice
      lastUpdated
    }
  }
`;

// Get recent sales
export const RECENT_SALES_QUERY = `
  query GetRecentSales($assetContract: Bytes, $first: Int) {
    sales(
      where: { assetContract: $assetContract }
      first: $first
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      listingId
      listingCreator
      buyer
      assetContract
      tokenId
      quantity
      totalPrice
      blockTimestamp
      transactionHash
    }
  }
`;

// Get bids for an auction
export const AUCTION_BIDS_QUERY = `
  query GetAuctionBids($auctionId: BigInt, $first: Int) {
    bids(
      where: { auctionId: $auctionId }
      first: $first
      orderBy: bidAmount
      orderDirection: desc
    ) {
      id
      auctionId
      bidder
      assetContract
      bidAmount
      blockTimestamp
      transactionHash
    }
  }
`;

// Query for Transfer events and TokensClaimed events
export const COLLECTION_STATS_QUERY = `
  query GetCollectionStats($address: String!) {
    transfers(
      where: {
        id_contains: $address
      }
      first: 1000
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      from
      to
      tokenId
      blockTimestamp
      transactionHash
    }

    tokensClaimed: tokensClaimeds(
      where: {
        id_contains: $address
      }
      first: 100
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      claimer
      receiver
      startTokenId
      quantityClaimed
      blockTimestamp
      transactionHash
    }

    sharedMetadata: sharedMetadataUpdateds(
      first: 1
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      name
      description
      imageURI
      animationURI
      blockTimestamp
    }
  }
`;

// Simplified stats for collections that don't have full indexing
export const SIMPLE_COLLECTION_STATS = `
  query GetSimpleStats($address: String!) {
    transfers(
      where: {
        contract: $address,
        from_not: "0x0000000000000000000000000000000000000000"
      }
      first: 1000
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      from
      to
      tokenId
      value
      timestamp
      transaction {
        value
      }
    }

    mints: transfers(
      where: {
        contract: $address,
        from: "0x0000000000000000000000000000000000000000"
      }
    ) {
      id
      to
      tokenId
      timestamp
    }
  }
`;

// Calculate volume from transfers
export function calculateVolumeFromTransfers(transfers: any[]): {
  totalVolume: number;
  floorPrice: number;
  uniqueHolders: Set<string>;
} {
  let totalVolume = 0;
  let minPrice = Infinity;
  const holders = new Set<string>();

  transfers.forEach(transfer => {
    // Add to holders set
    if (transfer.to !== '0x0000000000000000000000000000000000000000') {
      holders.add(transfer.to.toLowerCase());
    }

    // Calculate volume (value is in wei)
    if (transfer.value && transfer.value !== '0') {
      const ethValue = parseFloat(transfer.value) / 1e18;
      totalVolume += ethValue;

      if (ethValue > 0 && ethValue < minPrice) {
        minPrice = ethValue;
      }
    } else if (transfer.transaction?.value) {
      const ethValue = parseFloat(transfer.transaction.value) / 1e18;
      totalVolume += ethValue;

      if (ethValue > 0 && ethValue < minPrice) {
        minPrice = ethValue;
      }
    }
  });

  return {
    totalVolume,
    floorPrice: minPrice === Infinity ? 0 : minPrice,
    uniqueHolders: holders
  };
}

// Fetch collection stats from The Graph
export async function fetchCollectionStats(
  contractAddress: string,
  chainId: number
): Promise<{
  totalVolume: number;
  floorPrice: number;
  holders: number;
  totalSupply: number;
  sales: any[];
} | null> {
  try {
    const client = getGraphClient(chainId);
    if (!client) {
      console.log('No Graph client for chain:', chainId);
      return null;
    }

    // Remove verbose logging - only log errors
    // console.log('Fetching stats for:', contractAddress, 'on chain:', chainId);

    // Query the actual entities that exist in your subgraph
    const query = `
      {
        tokensClaimeds(first: 1000, orderBy: blockTimestamp, orderDirection: desc) {
          id
          claimer
          receiver
          startTokenId
          quantityClaimed
          blockTimestamp
          transactionHash
        }
        transfers(first: 1000, orderBy: blockTimestamp, orderDirection: desc) {
          id
          from
          to
          tokenId
          blockTimestamp
          transactionHash
        }
      }
    `;

    const data = await client.request(query) as any;
    // console.log('Graph response:', data);

    // Calculate stats from TokensClaimed events
    let totalVolume = 0;
    let totalSupply = 0;
    const holders = new Set<string>();

    if (data.tokensClaimeds && data.tokensClaimeds.length > 0) {
      // console.log('Found', data.tokensClaimeds.length, 'TokensClaimed events');

      // Each claim was at 0.0001 ETH per NFT (you should get this from claim conditions)
      const pricePerNFT = 0.0001;

      data.tokensClaimeds.forEach((claim: any) => {
        const quantity = parseInt(claim.quantityClaimed);
        totalSupply += quantity;
        totalVolume += quantity * pricePerNFT;
        holders.add(claim.receiver.toLowerCase());
      });

      // console.log('Calculated stats:', { totalVolume, totalSupply, holders: holders.size });

      return {
        totalVolume,
        floorPrice: pricePerNFT, // Floor price is the mint price for now
        holders: holders.size,
        totalSupply,
        sales: data.tokensClaimeds || []
      };
    }

    // Also check transfers for holder count
    if (data.transfers && data.transfers.length > 0) {
      // console.log('Found', data.transfers.length, 'Transfer events');

      data.transfers.forEach((transfer: any) => {
        // Add holders from transfers (excluding burn address)
        if (transfer.to !== '0x0000000000000000000000000000000000000000') {
          holders.add(transfer.to.toLowerCase());
        }
      });

      return {
        totalVolume: 0, // No volume data from just transfers
        floorPrice: 0,
        holders: holders.size,
        totalSupply: totalSupply || data.transfers.length,
        sales: []
      };
    }

    // console.log('No events found in subgraph');
    return null;

  } catch (error) {
    console.error('Error fetching collection stats from The Graph:', error);
    return null;
  }
}

// Get real-time price from recent sales
export async function getRealtimeFloorPrice(
  contractAddress: string,
  chainId: number
): Promise<number> {
  try {
    const stats = await fetchCollectionStats(contractAddress, chainId);
    if (!stats) return 0;

    // Get the lowest price from recent sales
    const recentSales = stats.sales.slice(0, 10);
    if (recentSales.length === 0) return 0;

    const prices = recentSales
      .map((s: any) => parseFloat(s.price))
      .filter((p: number) => p > 0);

    return prices.length > 0 ? Math.min(...prices) : 0;

  } catch (error) {
    console.error('Error getting realtime floor price:', error);
    return 0;
  }
}

// ==========================================
// Marketplace Data Fetching Functions
// ==========================================

// Fetch active listings from subgraph
export async function fetchListings(
  chainId: number,
  assetContract?: string,
  status: string = 'CREATED',
  first: number = 100,
  skip: number = 0
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return [];

    const data = await client.request(LISTINGS_QUERY, {
      assetContract: assetContract?.toLowerCase(),
      status,
      first,
      skip
    }) as any;

    return data.listings || [];
  } catch (error) {
    console.error('Error fetching listings from subgraph:', error);
    return [];
  }
}

// Fetch active auctions from subgraph
export async function fetchAuctions(
  chainId: number,
  assetContract?: string,
  status: string = 'CREATED',
  first: number = 100,
  skip: number = 0
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return [];

    const data = await client.request(AUCTIONS_QUERY, {
      assetContract: assetContract?.toLowerCase(),
      status,
      first,
      skip
    }) as any;

    return data.auctions || [];
  } catch (error) {
    console.error('Error fetching auctions from subgraph:', error);
    return [];
  }
}

// Fetch offers for a token from subgraph
export async function fetchOffers(
  chainId: number,
  assetContract: string,
  tokenId: string,
  status: string = 'CREATED',
  first: number = 50
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return [];

    const data = await client.request(OFFERS_QUERY, {
      assetContract: assetContract.toLowerCase(),
      tokenId,
      status,
      first
    }) as any;

    return data.offers || [];
  } catch (error) {
    console.error('Error fetching offers from subgraph:', error);
    return [];
  }
}

// Batch fetch offers for multiple tokens from subgraph
// Returns a Map of tokenId -> highest offer
export async function fetchOffersBatch(
  chainId: number,
  assetContract: string,
  tokenIds: string[],
  status: string = 'CREATED',
  first: number = 100
): Promise<Map<string, any>> {
  try {
    const client = getGraphClient(chainId);
    if (!client || tokenIds.length === 0) return new Map();

    const data = await client.request(OFFERS_BATCH_QUERY, {
      assetContract: assetContract.toLowerCase(),
      tokenIds,
      status,
      first
    }) as any;

    // Group offers by tokenId and get highest offer for each
    const offersMap = new Map<string, any>();
    for (const offer of (data.offers || [])) {
      const tokenId = offer.tokenId.toString();
      // Since results are sorted by totalPrice desc, first one for each tokenId is highest
      if (!offersMap.has(tokenId)) {
        offersMap.set(tokenId, offer);
      }
    }

    return offersMap;
  } catch (error) {
    console.error('Error batch fetching offers from subgraph:', error);
    return new Map();
  }
}

// Fetch global marketplace stats
export async function fetchMarketplaceStats(chainId: number) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return null;

    const data = await client.request(MARKETPLACE_STATS_QUERY) as any;
    return data.marketplaceStats || null;
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return null;
  }
}

// Fetch collection-specific marketplace stats
export async function fetchCollectionMarketplaceStats(
  chainId: number,
  assetContract: string
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return null;

    const data = await client.request(COLLECTION_STATS_GRAPH_QUERY, {
      assetContract: assetContract.toLowerCase()
    }) as any;

    return data.collectionStats || null;
  } catch (error) {
    console.error('Error fetching collection marketplace stats:', error);
    return null;
  }
}

// Fetch recent sales for a collection
export async function fetchRecentSales(
  chainId: number,
  assetContract: string,
  first: number = 50
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return [];

    const data = await client.request(RECENT_SALES_QUERY, {
      assetContract: assetContract.toLowerCase(),
      first
    }) as any;

    return data.sales || [];
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}

// Fetch bids for an auction
export async function fetchAuctionBids(
  chainId: number,
  auctionId: string,
  first: number = 50
) {
  try {
    const client = getGraphClient(chainId);
    if (!client) return [];

    const data = await client.request(AUCTION_BIDS_QUERY, {
      auctionId,
      first
    }) as any;

    return data.bids || [];
  } catch (error) {
    console.error('Error fetching auction bids:', error);
    return [];
  }
}