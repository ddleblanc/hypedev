// Homepage Types - Clean Architecture
// Centralized type definitions for the dual-homepage system

export type HomepageMode = 'traditional' | 'hud';

export interface HomepageModeState {
  mode: HomepageMode;
  isFirstLoad: boolean;
  isTransitioning: boolean;
}

// Collection types for Traditional Homepage sliders
export interface CollectionCardData {
  id: string;
  name: string;
  slug: string;
  image: string;
  bannerImage?: string;
  floorPrice: string;
  floorPriceCurrency: string;
  volume24h?: string;
  change24h?: string;
  itemCount?: number;
  ownerCount?: number;
  creatorName?: string;
  creatorAddress?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
}

export interface NFTSaleData {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collectionName: string;
  collectionSlug: string;
  salePrice: string;
  salePriceCurrency: string;
  saleDate: string;
  seller: string;
  buyer: string;
}

export interface DropData {
  id: string;
  name: string;
  slug: string;
  image: string;
  bannerImage?: string;
  description?: string;
  mintPrice: string;
  mintPriceCurrency: string;
  totalSupply: number;
  mintedSupply: number;
  startDate?: string;
  endDate?: string;
  status: 'upcoming' | 'live' | 'ended';
  creatorName?: string;
  isVerified?: boolean;
}

export interface LootboxData {
  id: string;
  name: string;
  image: string;
  price: string;
  priceCurrency: string;
  totalSupply?: number;
  remainingSupply?: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  isTrending?: boolean;
  isFeatured?: boolean;
}

// Carousel configuration
export interface CarouselConfig {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
}

// Section props for Traditional Homepage
export interface HomepageSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

// Portal button props
export interface PortalSwitchButtonProps {
  currentMode: HomepageMode;
  onModeChange: (mode: HomepageMode) => void;
  isTransitioning?: boolean;
  className?: string;
}

// ==========================================
// NEW: Traditional Homepage Section Types
// ==========================================

// Platform statistics for stats banner
export interface PlatformStats {
  totalVolume: number;
  totalVolumeFormatted: string;
  volumeChange24h: string;
  collectionsCount: number;
  usersCount: number;
  sales24h: number;
  salesChange24h: string;
}

// Category for navigation
export interface CategoryData {
  name: string;
  slug: string;
  icon: string; // Icon name as string
  count: number;
  color?: string;
}

// Top collection row for rankings table
export interface TopCollectionRow {
  rank: number;
  id: string;
  name: string;
  slug: string;
  image: string;
  floorPrice: string;
  floorPriceCurrency: string;
  volume24h: string;
  volumeChange24h: string;
  sales24h: number;
  owners: number;
  isVerified: boolean;
}

// Activity item for live feed
export interface ActivityItem {
  id: string;
  type: 'sale' | 'listing' | 'bid' | 'mint' | 'transfer';
  nft: {
    name: string;
    image: string;
    tokenId: string;
  };
  collection: {
    name: string;
    slug: string;
  };
  price?: string;
  priceCurrency?: string;
  from: string;
  fromUsername?: string;
  to?: string;
  toUsername?: string;
  timestamp: string;
}

// Footer link section
export interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
}

// Search result type
export interface SearchResult {
  id: string;
  type: 'collection' | 'nft' | 'user';
  name: string;
  image?: string;
  slug?: string;
  subtitle?: string;
}
