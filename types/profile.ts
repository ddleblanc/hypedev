/**
 * Shared types for profile-related components
 */

export interface NFTCollection {
  id: string;
  name: string;
  address: string;
  image?: string | null;
  royaltyPercentage?: number;
}

export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  description?: string | null;
  collection: NFTCollection;
  ownerAddress?: string | null;
  isListed: boolean;
  listingPrice?: number | null;
  listingType?: 'direct' | 'auction' | string | null;
  listingId?: string | null;
  listingExpiry?: string | null;
  rarityRank?: number | null;
  rarityTier?: string | null;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  bannerImage?: string | null;
  isCreator: boolean;
  creatorApprovedAt?: Date | null;
  socials?: UserSocial[];
}

export interface UserSocial {
  platform: string;
  url: string;
}

export interface ProfileStats {
  nftsOwned: number;
  collectionsOwned: number;
  followers: number;
  following: number;
  volumeTraded?: string;
}

export interface ProfileFilters {
  status: 'all' | 'listed' | 'unlisted' | 'auction' | 'offers';
  minPrice?: number;
  maxPrice?: number;
  collections: string[];
  sortBy: 'recently_listed' | 'price_low' | 'price_high' | 'recently_received' | 'oldest';
  searchQuery: string;
}

export type ProfileTab = 'collected' | 'created' | 'favorited' | 'activity';

export type ActivityType =
  | 'purchase'
  | 'sale'
  | 'listing'
  | 'bid'
  | 'transfer'
  | 'offer'
  | 'mint'
  | 'auction_won';

export interface Activity {
  id: string;
  type: ActivityType;
  nft?: {
    id: string;
    name: string;
    image: string;
    collection: string;
  };
  price?: number;
  from?: string;
  to?: string;
  timestamp: Date;
  transactionHash?: string;
}

export interface FavoriteItem {
  id: string;
  itemType: 'nft' | 'collection' | 'user';
  itemId: string;
  metadata: {
    name: string;
    image?: string;
    symbol?: string;
    description?: string;
  };
  addedAt: string;
}

// Listing types
export type ListingType = 'direct' | 'auction';

export interface ListingFeeBreakdown {
  proceeds: string;
  platformFee: string;
  royalty: string;
}

// Chain configuration for explorers
export interface ChainConfig {
  chainId: number;
  name: string;
  explorerUrl: string;
  explorerName: string;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    explorerUrl: 'https://etherscan.io',
    explorerName: 'Etherscan',
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerName: 'Etherscan',
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com',
    explorerName: 'Polygonscan',
  },
  80001: {
    chainId: 80001,
    name: 'Mumbai',
    explorerUrl: 'https://mumbai.polygonscan.com',
    explorerName: 'Polygonscan',
  },
};

export function getExplorerUrl(chainId: number, txHash: string): string {
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[11155111]; // Default to Sepolia
  return `${chain.explorerUrl}/tx/${txHash}`;
}

export function getExplorerName(chainId: number): string {
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[11155111];
  return chain.explorerName;
}
