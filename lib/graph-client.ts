import { GraphQLClient } from 'graphql-request';

// The Graph endpoints for different networks
const GRAPH_ENDPOINTS = {
  // Sepolia testnet - using a general NFT subgraph or our custom one
  11155111: process.env.NEXT_PUBLIC_GRAPH_SEPOLIA_ENDPOINT ||
    'https://api.thegraph.com/subgraphs/name/your-username/your-subgraph', // Replace with your subgraph

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

// Collection stats query
export const COLLECTION_STATS_QUERY = `
  query GetCollectionStats($address: String!, $from: Int!) {
    collection(id: $address) {
      id
      name
      symbol
      totalSupply
      totalVolume
      totalSales
      floorPrice
      uniqueHolders

      dayData(first: 30, orderBy: date, orderDirection: desc) {
        date
        volume
        sales
        averagePrice
      }

      nfts(first: 1000) {
        id
        tokenId
        owner
      }

      sales(first: 100, orderBy: timestamp, orderDirection: desc) {
        id
        price
        timestamp
        from
        to
        tokenId
      }
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
      return null;
    }

    // Try to get full collection stats first
    try {
      const data = await client.request(COLLECTION_STATS_QUERY, {
        address: contractAddress.toLowerCase(),
        from: Math.floor(Date.now() / 1000) - 86400 * 30 // Last 30 days
      });

      if (data.collection) {
        return {
          totalVolume: parseFloat(data.collection.totalVolume || '0'),
          floorPrice: parseFloat(data.collection.floorPrice || '0'),
          holders: data.collection.uniqueHolders || 0,
          totalSupply: data.collection.totalSupply || 0,
          sales: data.collection.sales || []
        };
      }
    } catch (e) {
      console.log('Full stats not available, trying simple query...');
    }

    // Fallback to simple transfer analysis
    const data = await client.request(SIMPLE_COLLECTION_STATS, {
      address: contractAddress.toLowerCase()
    });

    const stats = calculateVolumeFromTransfers(data.transfers || []);

    return {
      totalVolume: stats.totalVolume,
      floorPrice: stats.floorPrice,
      holders: stats.uniqueHolders.size,
      totalSupply: data.mints?.length || 0,
      sales: data.transfers || []
    };

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