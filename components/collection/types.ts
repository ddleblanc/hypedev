export interface CollectionItem {
  id: number;
  dbId?: string; // Database UUID
  name: string;
  price: string;
  lastSale: string;
  image: string;
  rarity: string;
  rank: number;
  likes: number;
  owner: string;
  listed: boolean;
  listingId?: string | null; // Marketplace listing ID
  hasOffer: boolean;
  offerPrice: string;
  onAuction?: boolean;
  auctionId?: string | null; // Marketplace auction ID
  traits: Array<{ trait_type: string; value: string }>;
}

export interface TopHolder {
  address: string;
  amount: number;
  percentage: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  item: string;
  price: string;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
}

export interface TraitValue {
  trait: string;
  count: number;
  percentage: number;
}

export interface Trait {
  name: string;
  values: TraitValue[];
}

export interface CollectionStats {
  totalSupply: number;
  owners: number;
  uniqueOwners: number;
  floorPrice: string;
  floorPriceUSD: number;
  ceilingPrice: string;
  volume24h: string;
  volume7d: string;
  volume30d: string;
  volumeAll: string;
  volumeChange24h: number;
  volumeChange7d: number;
  avgPrice: string;
  avgPrice24h: string;
  marketCap: string;
  listedCount: number;
  listedPercentage: number;
  sales24h: number;
  sales7d: number;
  royalty: number;
  bestOffer: string;
}

export interface Collection {
  id: string;
  title: string;
  name: string; // Alias for title - used by sweep dialog
  subtitle: string;
  description: string;
  longDescription: string;
  videoUrl: string;
  bannerImage: string;
  logo: string;
  contractAddress: string;
  blockchain: string;
  tokenStandard: string;
  createdDate: string;
  creator: {
    name: string;
    address: string;
    avatar: string;
    verified: boolean;
    followers: string;
    description: string;
  };
  stats: CollectionStats;
  floorPrice: number; // Derived from stats.floorPrice
  totalSupply: number; // Derived from stats.totalSupply
  priceHistory: Array<{ date: string; price: number }>;
  traits: Trait[];
  items: CollectionItem[];
  topHolders: TopHolder[];
  recentActivity: RecentActivity[];
  socials: {
    website: string;
    twitter: string;
    discord: string;
    medium: string;
  };
}
