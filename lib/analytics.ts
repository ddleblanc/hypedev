/**
 * Analytics Library - Hybrid data aggregation from DB and subgraph
 * Provides collection stats, NFT price history, and trending calculations
 */
import { prisma } from "./prisma";
import { fetchCollectionStats as fetchGraphStats, fetchRecentSales } from "./graph-client";
import { MARKETPLACE_CHAIN_ID } from "./marketplace";
import {
  SALE_TYPES,
  OWNERSHIP_CHANGE_TYPES,
  mapActivityToCategory,
  mapToOwnershipType,
  isSaleType,
  type ActivityCategory,
  type OwnershipType,
} from "./activity-types";

// ============================================================
// Types
// ============================================================

export interface CollectionStats {
  // From subgraph or calculated
  totalVolumeETH: number;
  floorPrice: number | null;
  holders: number;

  // From database
  listedCount: number;
  listedPercentage: number;
  totalSupply: number;
  mintedSupply: number;

  // Time-based metrics
  volume24h: number;
  volume7d: number;
  sales24h: number;
  sales7d: number;
  avgPrice24h: number | null;

  // Change percentages (requires snapshots)
  floorChange24h: number | null;
  floorChange7d: number | null;
}

export interface NFTPriceEvent {
  type: "sale" | "listing" | "offer" | "transfer" | "mint" | "bid";
  price: number | null;
  from: string;
  to: string | null;
  timestamp: Date;
  transactionHash: string | null;
}

export interface TrendingCollection {
  id: string;
  title: string;
  image: string | null;
  floor: string;
  floorPrice: number;
  change: string;
  volume: number;
  sales: number;
  creatorAddress: string;
  creatorName: string | null;
  isVerified: boolean;
}

// ============================================================
// Collection Stats - Hybrid DB + Graph
// ============================================================

/**
 * Get comprehensive collection statistics combining DB and subgraph data
 */
export async function getCollectionStats(
  collectionId: string,
  contractAddress?: string
): Promise<CollectionStats> {
  const now = new Date();
  const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get collection from DB for contract address
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: {
      address: true,
      mintedSupply: true,
      maxSupply: true,
      totalSupply: true,
      floorPrice: true,
      isDeployed: true,
    },
  });

  const address = contractAddress || collection?.address;

  // Parallel queries for performance
  const [dbStats, graphStats, activityVolume24h, activityVolume7d, salesCount24h, salesCount7d] =
    await Promise.all([
      // Database stats - transaction for consistency
      prisma.$transaction([
        prisma.nft.count({ where: { collectionId } }),
        prisma.nft.count({ where: { collectionId, isListed: true } }),
        prisma.nft.groupBy({
          by: ["ownerAddress"],
          where: { collectionId, ownerAddress: { not: null } },
          orderBy: { ownerAddress: "asc" },
        }),
      ]),

      // Subgraph stats (if deployed and has address)
      address && collection?.isDeployed
        ? fetchGraphStats(address, MARKETPLACE_CHAIN_ID)
        : Promise.resolve(null),

      // Activity-based volume (24h)
      prisma.activity.aggregate({
        where: {
          collectionId,
          type: { in: SALE_TYPES },
          createdAt: { gte: day1Ago },
        },
        _sum: { amount: true },
      }),

      // Activity-based volume (7d)
      prisma.activity.aggregate({
        where: {
          collectionId,
          type: { in: SALE_TYPES },
          createdAt: { gte: day7Ago },
        },
        _sum: { amount: true },
      }),

      // Sales counts (24h)
      prisma.activity.count({
        where: {
          collectionId,
          type: { in: SALE_TYPES },
          createdAt: { gte: day1Ago },
        },
      }),

      // Sales counts (7d)
      prisma.activity.count({
        where: {
          collectionId,
          type: { in: SALE_TYPES },
          createdAt: { gte: day7Ago },
        },
      }),
    ]);

  const [totalCount, listedCount, ownerGroups] = dbStats;
  const totalSupply = collection?.totalSupply || collection?.mintedSupply || totalCount;
  const vol24h = activityVolume24h._sum.amount || 0;
  const vol7d = activityVolume7d._sum.amount || 0;

  // Use graph data for floor if available, else use DB
  const floorPrice = graphStats?.floorPrice || collection?.floorPrice || null;

  return {
    // From subgraph (with DB fallback)
    totalVolumeETH: graphStats?.totalVolume || vol7d,
    floorPrice,
    holders: graphStats?.holders || ownerGroups.length,

    // From database
    listedCount,
    listedPercentage: totalSupply > 0 ? (listedCount / totalSupply) * 100 : 0,
    totalSupply,
    mintedSupply: collection?.mintedSupply || 0,

    // Calculated from activity
    volume24h: vol24h,
    volume7d: vol7d,
    sales24h: salesCount24h,
    sales7d: salesCount7d,
    avgPrice24h: salesCount24h > 0 ? vol24h / salesCount24h : null,

    // Requires historical snapshots - will be filled by getFloorPriceChanges
    floorChange24h: null,
    floorChange7d: null,
  };
}

/**
 * Get floor price at a specific point in time (for calculating changes)
 */
export async function getHistoricalFloorPrice(
  collectionId: string,
  timestamp: Date
): Promise<number | null> {
  const snapshot = await prisma.collectionPriceSnapshot.findFirst({
    where: {
      collectionId,
      timestamp: { lte: timestamp },
    },
    orderBy: { timestamp: "desc" },
    select: { floorPrice: true },
  });

  return snapshot?.floorPrice ?? null;
}

// ============================================================
// NFT Price History
// ============================================================

/**
 * Get price history for a specific NFT from activity + subgraph
 */
export async function getNFTPriceHistory(
  nftId: string,
  contractAddress?: string,
  tokenId?: string
): Promise<NFTPriceEvent[]> {
  // Primary: Database activity
  const activities = await prisma.activity.findMany({
    where: { nftId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { username: true, walletAddress: true } },
    },
  });

  const events: NFTPriceEvent[] = activities.map((a) => ({
    type: mapActivityType(a.type),
    price: a.amount,
    from: a.user?.walletAddress || a.relatedAddress || "Unknown",
    to: a.relatedAddress || null,
    timestamp: a.createdAt,
    transactionHash: a.transactionHash,
  }));

  // Supplement with subgraph data if we have contract info
  if (contractAddress && tokenId) {
    try {
      const graphSales = await fetchRecentSales(MARKETPLACE_CHAIN_ID, contractAddress, 20);
      interface GraphSale {
        tokenId: string;
        transactionHash: string;
        totalPrice: string;
        listingCreator: string;
        buyer: string;
        blockTimestamp: number;
      }
      const nftSales = graphSales.filter((s: GraphSale) => s.tokenId === tokenId);

      // Merge unique events (by txHash)
      const existingHashes = new Set(events.map((e) => e.transactionHash));
      for (const sale of nftSales) {
        if (!existingHashes.has(sale.transactionHash)) {
          events.push({
            type: "sale",
            price: parseFloat(sale.totalPrice) / 1e18,
            from: sale.listingCreator,
            to: sale.buyer,
            timestamp: new Date(sale.blockTimestamp * 1000),
            transactionHash: sale.transactionHash,
          });
        }
      }
    } catch (error) {
      console.warn("Could not fetch graph sales for NFT price history:", error);
    }
  }

  // Sort by timestamp desc
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function mapActivityType(type: string): NFTPriceEvent["type"] {
  switch (type) {
    case "purchase":
    case "auction_won":
    case "listing_sold":
      return "sale";
    case "listing_created":
      return "listing";
    case "offer_made":
    case "offer_accepted":
      return "offer";
    case "bid_placed":
      return "bid";
    case "transfer":
      return "transfer";
    case "mint":
    default:
      return "mint";
  }
}

// ============================================================
// NFT Price History for Charts
// ============================================================

export interface NFTPricePoint {
  timestamp: Date;
  price: number;
  currency: string;
  type: 'sale' | 'listing' | 'offer_accepted';
  transactionHash: string | null;
  from: string | null;
  to: string | null;
}

export interface NFTPriceHistoryStats {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalSales: number;
  firstSaleDate: Date | null;
  lastSaleDate: Date | null;
  priceChange: number | null; // Percentage change from first to last sale
}

export interface NFTPriceHistoryData {
  events: NFTPricePoint[];
  stats: NFTPriceHistoryStats;
}

/**
 * Get price history data optimized for charts
 * Returns all sales for an NFT with calculated statistics
 */
export async function getNFTPriceHistoryForChart(
  nftId: string
): Promise<NFTPriceHistoryData> {
  // Get all sale events for this NFT (types that represent completed sales)
  const sales = await prisma.activity.findMany({
    where: {
      nftId,
      type: { in: ['purchase', 'auction_won', 'listing_sold', 'nft_purchased', 'offer_accepted', 'collection_offer_accepted'] },
      amount: { not: null },
    },
    orderBy: { createdAt: 'asc' }, // Chronological order for charts
    include: {
      user: {
        select: { walletAddress: true },
      },
    },
  });

  const events: NFTPricePoint[] = sales.map((sale) => ({
    timestamp: sale.createdAt,
    price: sale.amount!,
    currency: sale.currency || 'ETH',
    type: mapSaleTypeForChart(sale.type),
    transactionHash: sale.transactionHash,
    from: sale.user?.walletAddress || null,
    to: sale.relatedAddress || null,
  }));

  // Calculate stats from the sale events
  const prices = events.map((e) => e.price);

  const stats: NFTPriceHistoryStats = {
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    totalSales: events.length,
    firstSaleDate: events.length > 0 ? events[0].timestamp : null,
    lastSaleDate: events.length > 0 ? events[events.length - 1].timestamp : null,
    priceChange:
      events.length >= 2
        ? ((events[events.length - 1].price - events[0].price) / events[0].price) * 100
        : null,
  };

  return { events, stats };
}

function mapSaleTypeForChart(type: string): NFTPricePoint['type'] {
  switch (type) {
    case 'offer_accepted':
    case 'collection_offer_accepted':
      return 'offer_accepted';
    case 'listing_sold':
      return 'listing';
    case 'purchase':
    case 'auction_won':
    case 'nft_purchased':
    default:
      return 'sale';
  }
}

// ============================================================
// Trending Collections
// ============================================================

interface PeriodDuration {
  "24h": number;
  "7d": number;
  "30d": number;
}

/**
 * Get trending collections based on actual trading volume
 */
export async function getTrendingCollections(
  limit: number = 10,
  period: "24h" | "7d" | "30d" = "7d"
): Promise<{ collections: TrendingCollection[] }> {
  const periodMs: PeriodDuration = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const since = new Date(Date.now() - periodMs[period]);

  // Get volume by collection from Activity
  const volumeByCollection = await prisma.activity.groupBy({
    by: ["collectionId"],
    where: {
      type: { in: SALE_TYPES },
      createdAt: { gte: since },
      collectionId: { not: null },
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const collectionIds = volumeByCollection
    .filter((v) => v.collectionId)
    .map((v) => v.collectionId as string);

  // Fallback to mintedSupply if no trading activity
  if (collectionIds.length === 0) {
    const collections = await prisma.collection.findMany({
      where: { isDeployed: true },
      orderBy: { mintedSupply: "desc" },
      take: limit,
    });

    // Fetch creator names
    const creatorAddresses = [...new Set(collections.map((c) => c.creatorAddress))];
    const creators = await prisma.user.findMany({
      where: { walletAddress: { in: creatorAddresses } },
      select: { walletAddress: true, username: true },
    });
    const creatorMap = new Map(creators.map((c) => [c.walletAddress.toLowerCase(), c.username]));

    return {
      collections: collections.map((c) => ({
        id: c.id,
        title: c.name,
        image: c.bannerImage || c.image,
        floor: `${c.floorPrice || 0} ETH`,
        floorPrice: c.floorPrice || 0,
        change: "New",
        volume: 0,
        sales: 0,
        creatorAddress: c.creatorAddress,
        creatorName: creatorMap.get(c.creatorAddress.toLowerCase()) || null,
        isVerified: c.isVerified,
      })),
    };
  }

  // Fetch collection details for the trending ones
  const collections = await prisma.collection.findMany({
    where: { id: { in: collectionIds } },
  });

  // Fetch creator names
  const creatorAddresses = [...new Set(collections.map((c) => c.creatorAddress))];
  const creators = await prisma.user.findMany({
    where: { walletAddress: { in: creatorAddresses } },
    select: { walletAddress: true, username: true },
  });
  const creatorMap = new Map(creators.map((c) => [c.walletAddress.toLowerCase(), c.username]));

  // Build response maintaining volume order
  return {
    collections: collectionIds.map((id) => {
      const collection = collections.find((c) => c.id === id);
      const volumeData = volumeByCollection.find((v) => v.collectionId === id);

      return {
        id,
        title: collection?.name || "Unknown",
        image: collection?.bannerImage || collection?.image || null,
        floor: `${collection?.floorPrice || 0} ETH`,
        floorPrice: collection?.floorPrice || 0,
        change: `${volumeData?._count || 0} sales`,
        volume: volumeData?._sum.amount || 0,
        sales: volumeData?._count || 0,
        creatorAddress: collection?.creatorAddress || "",
        creatorName: collection ? creatorMap.get(collection.creatorAddress.toLowerCase()) || null : null,
        isVerified: collection?.isVerified || false,
      };
    }),
  };
}

// ============================================================
// Collection Activity
// ============================================================

export interface ActivityItem {
  id: string;
  type: string;
  amount: number | null;
  currency: string;
  transactionHash: string | null;
  timestamp: Date;
  user: {
    address: string | null;
    username: string | null;
    avatar: string | null;
  };
  nft: {
    id: string;
    name: string;
    image: string;
    tokenId: string;
  } | null;
}

export interface ActivityResponse {
  items: ActivityItem[];
  nextCursor: string | null;
}

/**
 * Get paginated activity for a collection
 */
export async function getCollectionActivity(
  collectionId: string,
  options: {
    limit?: number;
    cursor?: string;
    types?: string[];
  } = {}
): Promise<ActivityResponse> {
  const { limit = 50, cursor, types } = options;

  const activities = await prisma.activity.findMany({
    where: {
      collectionId,
      ...(types?.length && { type: { in: types } }),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: { select: { username: true, profilePicture: true, walletAddress: true } },
      nft: { select: { id: true, name: true, image: true, tokenId: true } },
    },
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  return {
    items: items.map((a) => ({
      id: a.id,
      type: a.type,
      amount: a.amount,
      currency: a.currency || "ETH",
      transactionHash: a.transactionHash,
      timestamp: a.createdAt,
      user: {
        address: a.user?.walletAddress || a.relatedAddress,
        username: a.user?.username || null,
        avatar: a.user?.profilePicture || null,
      },
      nft: a.nft
        ? {
            id: a.nft.id,
            name: a.nft.name,
            image: a.nft.image,
            tokenId: a.nft.tokenId,
          }
        : null,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// ============================================================
// NFT-Specific Activity
// ============================================================

export interface NFTActivityEvent {
  id: string;
  type: 'sale' | 'listing' | 'offer' | 'transfer' | 'mint' | 'bid' | 'cancel';
  price: number | null;
  currency: string;
  from: string | null;
  to: string | null;
  timestamp: Date;
  transactionHash: string | null;
  fromUser?: {
    username: string | null;
    avatar: string | null;
    address: string | null;
  };
  toUser?: {
    username: string | null;
    avatar: string | null;
    address: string | null;
  };
}

export interface NFTActivityResponse {
  items: NFTActivityEvent[];
  nextCursor: string | null;
}

/**
 * Get activity history for a specific NFT
 * This returns events that happened TO this specific NFT, not the collection
 */
export async function getNFTActivity(
  nftId: string,
  options: {
    limit?: number;
    cursor?: string;
    types?: string[];
  } = {}
): Promise<NFTActivityResponse> {
  const { limit = 20, cursor, types } = options;

  const activities = await prisma.activity.findMany({
    where: {
      nftId, // This is the key - filter by THIS specific NFT
      ...(types?.length && { type: { in: types } }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      user: {
        select: {
          username: true,
          profilePicture: true,
          walletAddress: true,
        },
      },
      nft: {
        select: {
          id: true,
          name: true,
          image: true,
          tokenId: true,
          ownerAddress: true,
        },
      },
    },
  });

  // Fetch related users for toUser data
  const relatedUserIds = activities
    .map((a) => a.relatedUserId)
    .filter((id): id is string => id !== null);

  const relatedUsers = relatedUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: relatedUserIds } },
        select: {
          id: true,
          username: true,
          profilePicture: true,
          walletAddress: true,
        },
      })
    : [];

  const relatedUserMap = new Map(relatedUsers.map((u) => [u.id, u]));

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Map activity type to our normalized types
  function mapToNFTActivityType(type: string): NFTActivityEvent['type'] {
    switch (type) {
      case 'purchase':
      case 'auction_won':
      case 'listing_sold':
      case 'nft_purchased':
      case 'collection_offer_accepted':
        return 'sale';
      case 'listing_created':
        return 'listing';
      case 'listing_cancelled':
      case 'listing_canceled':
        return 'cancel';
      case 'offer_made':
      case 'offer_accepted':
        return 'offer';
      case 'bid_placed':
        return 'bid';
      case 'transfer':
        return 'transfer';
      case 'mint':
      default:
        return 'mint';
    }
  }

  return {
    items: items.map((a) => {
      // Get the related user from our map if we have the relatedUserId
      const relatedUser = a.relatedUserId ? relatedUserMap.get(a.relatedUserId) : null;

      return {
        id: a.id,
        type: mapToNFTActivityType(a.type),
        price: a.amount,
        currency: a.currency || 'ETH',
        from: a.user?.walletAddress || null,
        to: relatedUser?.walletAddress || a.relatedAddress || null,
        timestamp: a.createdAt,
        transactionHash: a.transactionHash,
        fromUser: a.user
          ? {
              username: a.user.username,
              avatar: a.user.profilePicture,
              address: a.user.walletAddress,
            }
          : undefined,
        toUser: relatedUser
          ? {
              username: relatedUser.username,
              avatar: relatedUser.profilePicture,
              address: relatedUser.walletAddress,
            }
          : a.relatedAddress
          ? {
              username: null,
              avatar: null,
              address: a.relatedAddress,
            }
          : undefined,
      };
    }),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// ============================================================
// NFT Last Sale
// ============================================================

export interface LastSaleData {
  price: number;
  currency: string;
  timestamp: Date;
  transactionHash: string | null;
  seller: {
    address: string;
    username: string | null;
  } | null;
  buyer: {
    address: string;
    username: string | null;
  } | null;
}

/**
 * Get the last sale for a specific NFT
 */
export async function getNFTLastSale(nftId: string): Promise<LastSaleData | null> {
  const lastSale = await prisma.activity.findFirst({
    where: {
      nftId,
      type: { in: ['purchase', 'auction_won', 'listing_sold', 'nft_purchased', 'collection_offer_accepted'] },
      amount: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { username: true, walletAddress: true },
      },
    },
  });

  if (!lastSale || !lastSale.amount) return null;

  // Try to get the buyer info if we have relatedAddress
  let buyerInfo = null;
  if (lastSale.relatedAddress) {
    const buyer = await prisma.user.findUnique({
      where: { walletAddress: lastSale.relatedAddress },
      select: { username: true, walletAddress: true },
    });
    buyerInfo = buyer
      ? { address: buyer.walletAddress, username: buyer.username }
      : { address: lastSale.relatedAddress, username: null };
  }

  return {
    price: lastSale.amount,
    currency: lastSale.currency || 'ETH',
    timestamp: lastSale.createdAt,
    transactionHash: lastSale.transactionHash,
    seller: lastSale.user
      ? {
          address: lastSale.user.walletAddress || '',
          username: lastSale.user.username,
        }
      : null,
    buyer: buyerInfo,
  };
}

// ============================================================
// NFT Trait Rarity
// ============================================================

export interface TraitWithRarity {
  traitType: string;
  value: string;
  count: number; // Number of NFTs with this trait value
  totalSupply: number; // Total NFTs in collection
  percentage: number; // (count / totalSupply) * 100
  rarityScore: number; // 1 / percentage (higher = rarer)
}

/**
 * Get trait rarity data for a specific NFT
 * Returns each trait with its actual rarity percentage based on collection data
 */
export async function getNFTTraitRarity(nftId: string): Promise<TraitWithRarity[]> {
  // Get the NFT with its traits
  const nft = await prisma.nft.findUnique({
    where: { id: nftId },
    include: {
      collection: {
        select: {
          id: true,
          mintedSupply: true,
          maxSupply: true,
        },
      },
      traits: true,
    },
  });

  if (!nft || !nft.collection) return [];

  const collectionId = nft.collection.id;

  // Get total supply for percentage calculation
  // Use mintedSupply if available, otherwise count NFTs
  let totalSupply = nft.collection.mintedSupply || 0;
  if (!totalSupply) {
    totalSupply = await prisma.nft.count({
      where: { collectionId },
    });
  }

  if (totalSupply === 0) return [];

  // Get all collection traits with their values for efficient lookup
  const collectionTraits = await prisma.collectionTrait.findMany({
    where: { collectionId },
    include: {
      values: true,
    },
  });

  // Create a lookup map for trait values: traitType -> value -> frequency
  const traitValueMap = new Map<string, Map<string, number>>();
  for (const ct of collectionTraits) {
    const valueMap = new Map<string, number>();
    for (const v of ct.values) {
      valueMap.set(v.value, v.frequency);
    }
    traitValueMap.set(ct.traitType, valueMap);
  }

  // First pass: identify traits that need count lookup
  const traitsNeedingLookup: { traitType: string; value: string }[] = [];
  for (const trait of nft.traits) {
    let count = trait.frequency || 0;
    if (count === 0) {
      const valueMap = traitValueMap.get(trait.traitType);
      if (valueMap) {
        count = valueMap.get(trait.value) || 0;
      }
    }
    if (count === 0) {
      traitsNeedingLookup.push({ traitType: trait.traitType, value: trait.value });
    }
  }

  // Batch query all missing trait counts in a single query
  const batchCounts = new Map<string, number>();
  if (traitsNeedingLookup.length > 0) {
    // Use groupBy to get all counts in one query
    const counts = await prisma.nftTrait.groupBy({
      by: ['traitType', 'value'],
      where: {
        nft: { collectionId },
        OR: traitsNeedingLookup.map(t => ({
          traitType: t.traitType,
          value: t.value,
        })),
      },
      _count: true,
    });

    for (const c of counts) {
      batchCounts.set(`${c.traitType}:${c.value}`, c._count);
    }
  }

  // Map each NFT trait to include rarity data (no more N+1 queries)
  const traitsWithRarity: TraitWithRarity[] = nft.traits.map((trait) => {
    // First check if count is stored in NftTrait.frequency
    let count = trait.frequency || 0;

    // If not, try to find the count from CollectionTraitValue
    if (count === 0) {
      const valueMap = traitValueMap.get(trait.traitType);
      if (valueMap) {
        count = valueMap.get(trait.value) || 0;
      }
    }

    // If still no count found, use the batch-fetched count
    if (count === 0) {
      count = batchCounts.get(`${trait.traitType}:${trait.value}`) || 1;
    }

    const percentage = totalSupply > 0 ? (count / totalSupply) * 100 : 0;
    const rarityScore = percentage > 0 ? 100 / percentage : 100;

    return {
      traitType: trait.traitType,
      value: trait.value,
      count,
      totalSupply,
      percentage: Math.round(percentage * 100) / 100, // 2 decimal places
      rarityScore: Math.round(rarityScore * 100) / 100,
    };
  });

  return traitsWithRarity;
}

/**
 * Get all trait values and counts for a collection
 * Useful for filtering and market analysis
 */
export async function getCollectionTraitDistribution(
  collectionId: string
): Promise<
  {
    traitType: string;
    values: {
      value: string;
      count: number;
      percentage: number;
    }[];
  }[]
> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      collectionTraits: {
        include: {
          values: {
            orderBy: { frequency: "desc" },
          },
        },
      },
    },
  });

  if (!collection) return [];

  // Get total supply
  const totalSupply =
    collection.mintedSupply ||
    (await prisma.nft.count({
      where: { collectionId },
    }));

  return collection.collectionTraits.map((trait) => ({
    traitType: trait.traitType,
    values: trait.values.map((v) => ({
      value: v.value,
      count: v.frequency,
      percentage:
        totalSupply > 0 ? Math.round((v.frequency / totalSupply) * 10000) / 100 : 0,
    })),
  }));
}

// ============================================================
// NFT Provenance / Ownership History
// ============================================================

export interface OwnershipEvent {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'airdrop';
  from: string | null;  // null for mint
  to: string;
  timestamp: Date;
  transactionHash: string | null;
  price: number | null;  // null for non-sale transfers
  currency: string | null;
  fromUser?: {
    username: string | null;
    avatar: string | null;
  };
  toUser?: {
    username: string | null;
    avatar: string | null;
  };
  blockNumber: number | null;
}

export interface ProvenanceData {
  currentOwner: {
    address: string;
    username: string | null;
    avatar: string | null;
    ownedSince: Date | null;
    acquisitionType: 'mint' | 'transfer' | 'sale' | 'airdrop';
    acquisitionPrice: number | null;
  };
  originalMinter: {
    address: string;
    username: string | null;
    avatar: string | null;
    mintDate: Date | null;
    transactionHash: string | null;
  } | null;
  ownershipHistory: OwnershipEvent[];
  totalOwners: number;
  holdingPeriodDays: number | null;  // Days current owner has held
}

// Using mapToOwnershipType from ./activity-types
// Legacy local function replaced with centralized implementation

/**
 * Get complete ownership history (provenance) for an NFT
 * Returns the full chain of custody from mint to current owner
 */
export async function getNFTProvenance(nftId: string): Promise<ProvenanceData> {
  // Get the NFT with current owner
  const nft = await prisma.nft.findUnique({
    where: { id: nftId },
    include: {
      collection: {
        select: { address: true }
      }
    }
  });

  if (!nft) {
    throw new Error("NFT not found");
  }

  // Get all transfer/ownership events from Activity
  // Using shared OWNERSHIP_CHANGE_TYPES constant
  const ownershipEvents = await prisma.activity.findMany({
    where: {
      nftId,
      type: { in: OWNERSHIP_CHANGE_TYPES }
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          username: true,
          profilePicture: true,
          walletAddress: true
        }
      }
    }
  });

  // Fetch user info for all addresses involved in ownership events
  // Build a comprehensive set of addresses we need user info for
  const addressesToLookup = new Set<string>();

  // Add current owner address
  if (nft.ownerAddress) {
    addressesToLookup.add(nft.ownerAddress.toLowerCase());
  }

  // Add all addresses from events (both user addresses and related addresses)
  ownershipEvents.forEach(event => {
    if (event.relatedAddress) {
      addressesToLookup.add(event.relatedAddress.toLowerCase());
    }
    if (event.user?.walletAddress) {
      addressesToLookup.add(event.user.walletAddress.toLowerCase());
    }
  });

  // Batch fetch all users in a single query
  const allUsers = await prisma.user.findMany({
    where: {
      walletAddress: { in: Array.from(addressesToLookup), mode: 'insensitive' }
    },
    select: {
      walletAddress: true,
      username: true,
      profilePicture: true
    }
  });

  // Create a lookup map for all users
  const userLookup = new Map<string, typeof allUsers[0]>();
  allUsers.forEach(user => {
    userLookup.set(user.walletAddress.toLowerCase(), user);
  });

  // Transform to OwnershipEvent format
  const history: OwnershipEvent[] = ownershipEvents.map(event => {
    const eventType = mapToOwnershipType(event.type);

    // Determine from/to based on event type
    // For mints: from is null, to is the receiver
    // For sales/transfers: from is the user (seller), to is relatedAddress (buyer)
    let fromAddress: string | null = null;
    let toAddress: string = '';

    if (eventType === 'mint') {
      fromAddress = null;
      toAddress = event.relatedAddress || event.user?.walletAddress || '';
    } else {
      fromAddress = event.user?.walletAddress || null;
      toAddress = event.relatedAddress || '';
    }

    // Get user info for 'to' address
    const toUser = toAddress ? userLookup.get(toAddress.toLowerCase()) : undefined;

    return {
      id: event.id,
      type: eventType,
      from: fromAddress,
      to: toAddress,
      timestamp: event.createdAt,
      transactionHash: event.transactionHash,
      price: ['purchase', 'auction_won', 'listing_sold'].includes(event.type) ? event.amount : null,
      currency: event.currency,
      fromUser: event.user ? {
        username: event.user.username,
        avatar: event.user.profilePicture
      } : undefined,
      toUser: toUser ? {
        username: toUser.username,
        avatar: toUser.profilePicture
      } : undefined,
      blockNumber: null // Could be added from transaction lookup if needed
    };
  });

  // Find original mint event
  const mintEvent = history.find(h => h.type === 'mint');

  // Find most recent ownership change for current owner
  const currentOwnerEvent = [...history].reverse().find(
    h => h.to.toLowerCase() === nft.ownerAddress?.toLowerCase()
  );

  // Calculate unique owners
  const uniqueOwners = new Set(history.map(h => h.to.toLowerCase()).filter(Boolean));

  // Calculate holding period
  let holdingPeriodDays: number | null = null;
  if (currentOwnerEvent) {
    const holdingMs = Date.now() - new Date(currentOwnerEvent.timestamp).getTime();
    holdingPeriodDays = Math.floor(holdingMs / (1000 * 60 * 60 * 24));
  }

  // Get current owner user info from the lookup map (no additional query needed)
  const currentOwnerUser = nft.ownerAddress
    ? userLookup.get(nft.ownerAddress.toLowerCase())
    : null;

  // Get minter user info from the lookup map (no additional query needed)
  const minterUser = mintEvent?.to
    ? userLookup.get(mintEvent.to.toLowerCase())
    : null;

  return {
    currentOwner: {
      address: nft.ownerAddress || '',
      username: currentOwnerUser?.username || null,
      avatar: currentOwnerUser?.profilePicture || null,
      ownedSince: currentOwnerEvent?.timestamp || null,
      acquisitionType: currentOwnerEvent?.type || 'mint',
      acquisitionPrice: currentOwnerEvent?.price || null,
    },
    originalMinter: mintEvent ? {
      address: mintEvent.to,
      username: minterUser?.username || null,
      avatar: minterUser?.profilePicture || null,
      mintDate: mintEvent.timestamp,
      transactionHash: mintEvent.transactionHash,
    } : null,
    ownershipHistory: history.reverse(), // Most recent first
    totalOwners: uniqueOwners.size,
    holdingPeriodDays,
  };
}

// ============================================================
// NFT Offers
// ============================================================

export interface NFTOffer {
  id: string;
  offerId: string; // On-chain offer ID
  type: 'individual' | 'collection' | 'trait';
  amount: number;
  currency: string;
  expiresAt: Date | null;
  createdAt: Date;
  status: string;
  offeror: {
    address: string;
    username: string | null;
    avatar: string | null;
  };
  // For trait offers (future)
  traitType?: string;
  traitValue?: string;
  onChainId: string | null;
  isExpiringSoon: boolean;
}

/**
 * Get all active offers for a specific NFT
 * Includes individual offers and collection offers that apply to this NFT
 */
export async function getNFTOffers(
  nftId: string,
  options: {
    includeCollectionOffers?: boolean;
    includeTraitOffers?: boolean;
  } = { includeCollectionOffers: true, includeTraitOffers: true }
): Promise<NFTOffer[]> {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Get the NFT with its collection info
  const nft = await prisma.nft.findUnique({
    where: { id: nftId },
    include: {
      collection: {
        select: {
          id: true,
          address: true,
        }
      },
      traits: true
    }
  });

  if (!nft) return [];

  const offers: NFTOffer[] = [];

  // 1. Get individual offers for this NFT (by nftId)
  const individualOffers = await prisma.marketplaceOffer.findMany({
    where: {
      nftId,
      status: 'ACTIVE',
      expirationTimestamp: { gt: now }
    },
    orderBy: { offerAmount: 'desc' }
  });

  // Get user info for all offerors
  const offerorAddresses = individualOffers.map(o => o.offerorAddress.toLowerCase());
  const users = await prisma.user.findMany({
    where: {
      walletAddress: { in: offerorAddresses, mode: 'insensitive' }
    },
    select: {
      walletAddress: true,
      username: true,
      profilePicture: true
    }
  });
  const userMap = new Map(users.map(u => [u.walletAddress.toLowerCase(), u]));

  offers.push(...individualOffers.map(o => {
    const user = userMap.get(o.offerorAddress.toLowerCase());
    return {
      id: o.id,
      offerId: o.offerId,
      type: 'individual' as const,
      amount: o.offerAmount,
      currency: o.currency === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'WETH',
      expiresAt: o.expirationTimestamp,
      createdAt: o.createdAt,
      status: o.status,
      offeror: {
        address: o.offerorAddress,
        username: user?.username || null,
        avatar: user?.profilePicture || null
      },
      onChainId: o.offerId,
      isExpiringSoon: o.expirationTimestamp ? o.expirationTimestamp < oneDayFromNow : false
    };
  }));

  // 2. Get collection offers (if enabled)
  if (options.includeCollectionOffers && nft.collectionId) {
    const collectionOffers = await prisma.marketplaceOffer.findMany({
      where: {
        collectionId: nft.collectionId,
        isCollectionOffer: true,
        status: 'ACTIVE',
        expirationTimestamp: { gt: now }
      },
      orderBy: { offerAmount: 'desc' }
    });

    // Get user info for collection offer offerors
    const collOfferorAddresses = collectionOffers.map(o => o.offerorAddress.toLowerCase());
    const collUsers = await prisma.user.findMany({
      where: {
        walletAddress: { in: collOfferorAddresses, mode: 'insensitive' }
      },
      select: {
        walletAddress: true,
        username: true,
        profilePicture: true
      }
    });
    const collUserMap = new Map(collUsers.map(u => [u.walletAddress.toLowerCase(), u]));

    offers.push(...collectionOffers.map(o => {
      const user = collUserMap.get(o.offerorAddress.toLowerCase());
      return {
        id: o.id,
        offerId: o.offerId,
        type: 'collection' as const,
        amount: o.offerAmount,
        currency: o.currency === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ? 'ETH' : 'WETH',
        expiresAt: o.expirationTimestamp,
        createdAt: o.createdAt,
        status: o.status,
        offeror: {
          address: o.offerorAddress,
          username: user?.username || null,
          avatar: user?.profilePicture || null
        },
        onChainId: o.offerId,
        isExpiringSoon: o.expirationTimestamp ? o.expirationTimestamp < oneDayFromNow : false
      };
    }));
  }

  // Sort all offers by amount (descending)
  return offers.sort((a, b) => b.amount - a.amount);
}

/**
 * Get the best offer for an NFT (highest amount)
 */
export async function getNFTBestOffer(nftId: string): Promise<NFTOffer | null> {
  const offers = await getNFTOffers(nftId);
  return offers.length > 0 ? offers[0] : null;
}
