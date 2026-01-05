'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { trpc } from '@/lib/trpc/client';

// Profile Components
import { ProfileFilterSidebar, type ProfileFilters } from '@/components/profile/profile-filter-sidebar';
import { ProfileNFTGrid, type NFTItem } from '@/components/profile/profile-nft-grid';
import { ProfileFavorites, type FavoriteItem } from '@/components/profile/profile-favorites';
import { ProfileLootboxes } from '@/components/profile/profile-lootboxes';
import { ListForSaleDialog } from '@/components/profile/list-for-sale-dialog';
import { CreateAuctionDialog } from '@/components/profile/create-auction-dialog';
import { CancelListingDialog } from '@/components/profile/cancel-listing-dialog';
import { SyncNftsButton } from '@/components/profile/sync-nfts-button';

// UI Components
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Sparkles, Palette, FileEdit, Heart, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  image?: string | null;
  nftCount?: number;
}

const defaultFilters: ProfileFilters = {
  status: 'all',
  minPrice: undefined,
  maxPrice: undefined,
  collections: [],
  sortBy: 'recently_listed',
  searchQuery: '',
};

type CollectionTab = 'collected' | 'created' | 'drafts' | 'favorited' | 'lootboxes';

// Map filter sortBy values to API sortBy values
const sortByMap: Record<string, 'recent' | 'oldest' | 'price-low' | 'price-high' | 'rarity-rare' | 'rarity-common' | 'most-liked'> = {
  'recently_listed': 'recent',
  'price_low': 'price-low',
  'price_high': 'price-high',
  'oldest': 'oldest',
  'rarity_rare': 'rarity-rare',
  'rarity_common': 'rarity-common',
  'most_liked': 'most-liked',
};

function CollectionPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<CollectionTab>('collected');
  const [tabCounts, setTabCounts] = useState({
    collected: 0,
    created: 0,
    drafts: 0,
    favorited: 0,
    lootboxes: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<ProfileFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal states
  const [showListDialog, setShowListDialog] = useState(false);
  const [showAuctionDialog, setShowAuctionDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);

  // Check if user is a creator
  const hasStudioAccess = user?.isCreator || !!(user as any)?.creatorAppliedAt;

  // Map status filter
  const getStatusFilter = () => {
    if (filters.status === 'all') return undefined;
    return filters.status as 'listed' | 'unlisted' | 'auction' | 'on_auction' | 'has_offers' | 'hasOffers' | 'new';
  };

  // tRPC queries for NFTs
  const collectedQuery = trpc.user.nfts.list.useQuery(
    {
      address: user?.walletAddress || '',
      filter: 'owned',
      status: getStatusFilter(),
      sortBy: sortByMap[filters.sortBy] || 'recent',
      search: filters.searchQuery || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      collections: filters.collections.length > 0 ? filters.collections : undefined,
    },
    {
      enabled: !!user?.walletAddress && activeTab === 'collected',
    }
  );

  const createdQuery = trpc.user.nfts.list.useQuery(
    {
      address: user?.walletAddress || '',
      filter: 'created',
      status: getStatusFilter(),
      sortBy: sortByMap[filters.sortBy] || 'recent',
      search: filters.searchQuery || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      collections: filters.collections.length > 0 ? filters.collections : undefined,
    },
    {
      enabled: !!user?.walletAddress && activeTab === 'created',
    }
  );

  const draftsQuery = trpc.user.nfts.list.useQuery(
    {
      address: user?.walletAddress || '',
      filter: 'drafts',
      status: getStatusFilter(),
      sortBy: sortByMap[filters.sortBy] || 'recent',
      search: filters.searchQuery || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      collections: filters.collections.length > 0 ? filters.collections : undefined,
    },
    {
      enabled: !!user?.walletAddress && activeTab === 'drafts',
    }
  );

  // tRPC query for favorites
  const favoritesQuery = trpc.user.favorites.list.useQuery(
    {
      userId: user?.id || '',
    },
    {
      enabled: !!user?.id && activeTab === 'favorited',
    }
  );

  // Update tab counts when data changes
  useEffect(() => {
    if (collectedQuery.data?.filters) {
      setTabCounts((prev) => ({
        ...prev,
        collected: collectedQuery.data.filters.totalOwned,
        created: collectedQuery.data.filters.totalCreated,
        drafts: collectedQuery.data.filters.totalDrafts,
      }));
    }
  }, [collectedQuery.data]);

  useEffect(() => {
    if (createdQuery.data?.filters) {
      setTabCounts((prev) => ({
        ...prev,
        created: createdQuery.data.filters.totalCreated,
      }));
    }
  }, [createdQuery.data]);

  useEffect(() => {
    if (draftsQuery.data?.filters) {
      setTabCounts((prev) => ({
        ...prev,
        drafts: draftsQuery.data.filters.totalDrafts,
      }));
    }
  }, [draftsQuery.data]);

  useEffect(() => {
    if (favoritesQuery.data?.watchlist) {
      setTabCounts((prev) => ({
        ...prev,
        favorited: favoritesQuery.data.watchlist?.items?.length || 0,
      }));
    }
  }, [favoritesQuery.data]);

  // Transform NFT data for the grid
  const transformNfts = useCallback((nfts: any[]): NFTItem[] => {
    return nfts.map((nft) => ({
      id: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      image: nft.image,
      description: nft.description,
      collection: {
        id: nft.collectionId || nft.collection?.id,
        name: nft.collectionName || nft.collection?.name,
        address: nft.contractAddress || nft.collection?.address,
        image: nft.collection?.image,
      },
      ownerAddress: nft.ownerAddress,
      isListed: nft.isListed || nft.listed || false,
      listingPrice: nft.listingPrice || nft.price,
      listingType: nft.listingType,
      listingId: nft.listingDetails?.listingId,
      listingExpiry: nft.listingDetails?.endTimestamp,
      rarityRank: nft.rarityRank || nft.rank,
      rarityTier: nft.rarityTier || nft.rarity,
      isOnChain: nft.isOnChain ?? true,
      onChainTokenId: nft.onChainTokenId,
    }));
  }, []);

  // Get current NFTs based on active tab
  const currentNfts = useMemo(() => {
    if (activeTab === 'collected') {
      return transformNfts(collectedQuery.data?.nfts || []);
    } else if (activeTab === 'created') {
      return transformNfts(createdQuery.data?.nfts || []);
    } else if (activeTab === 'drafts') {
      return transformNfts(draftsQuery.data?.nfts || []);
    }
    return [];
  }, [activeTab, collectedQuery.data, createdQuery.data, draftsQuery.data, transformNfts]);

  // Get favorites data - transform to match FavoriteItem interface
  const favorites: FavoriteItem[] = useMemo(() => {
    const items = favoritesQuery.data?.watchlist?.items || [];
    return items.map((item) => ({
      id: item.id,
      itemType: item.itemType as 'nft' | 'collection' | 'user',
      itemId: item.itemId,
      metadata: (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata))
        ? item.metadata as { name: string; image?: string; symbol?: string; description?: string }
        : { name: 'Unknown' },
      addedAt: item.addedAt.toISOString(),
    }));
  }, [favoritesQuery.data]);

  // Extract collections for filter
  const collections = useMemo(() => {
    const nfts = currentNfts;
    const uniqueCollections = Array.from(
      new Map(
        nfts.map((nft) => [
          nft.collection.id,
          {
            id: nft.collection.id,
            name: nft.collection.name,
            image: nft.collection.image,
          },
        ])
      ).values()
    );
    return uniqueCollections;
  }, [currentNfts]);

  // Loading states
  const isLoadingNfts =
    (activeTab === 'collected' && collectedQuery.isLoading) ||
    (activeTab === 'created' && createdQuery.isLoading) ||
    (activeTab === 'drafts' && draftsQuery.isLoading);

  const isLoadingFavorites = activeTab === 'favorited' && favoritesQuery.isLoading;

  // Listing actions
  const handleListForSale = (nft: NFTItem) => {
    setSelectedNft(nft);
    setShowListDialog(true);
  };

  const handleCreateAuction = (nft: NFTItem) => {
    setSelectedNft(nft);
    setShowAuctionDialog(true);
  };

  const handleCancelListing = (nft: NFTItem) => {
    setSelectedNft(nft);
    setShowCancelDialog(true);
  };

  const handleViewNFT = (nft: NFTItem) => {
    router.push(`/collection/${nft.collection.address}/${nft.tokenId}`);
  };

  const handleListingSuccess = () => {
    // Refetch the current tab's data
    if (activeTab === 'collected') {
      collectedQuery.refetch();
    } else if (activeTab === 'created') {
      createdQuery.refetch();
    }
  };

  const handleFavoriteClick = (item: FavoriteItem) => {
    if (item.itemType === 'collection') {
      router.push(`/collection/${item.itemId}`);
    } else if (item.itemType === 'nft') {
      router.push(`/marketplace/nft/${item.itemId}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  // Show Created tab if user has studio access
  const showCreatedTab = hasStudioAccess;
  const showDraftsTab = hasStudioAccess && tabCounts.drafts > 0;

  const isDraftsTab = activeTab === 'drafts';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-20"
    >
      {/* Page Header */}
      <div className="px-4 md:px-8 pb-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Package className="h-7 w-7 text-[rgb(163,255,18)]" />
              My Collection
            </h1>
            <p className="text-white/60 mt-1">Manage your NFTs, favorites, and lootboxes</p>
          </div>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => router.push('/studio/create')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create NFT
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CollectionTab)} className="w-full">
          <div className="px-4 md:px-8">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="collected"
                className="relative px-4 py-4 text-sm font-medium text-white/60 data-[state=active]:text-[rgb(163,255,18)] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(163,255,18)]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Collected
                {tabCounts.collected > 0 && (
                  <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                    {tabCounts.collected}
                  </Badge>
                )}
              </TabsTrigger>

              {showCreatedTab && (
                <TabsTrigger
                  value="created"
                  className="relative px-4 py-4 text-sm font-medium text-white/60 data-[state=active]:text-[rgb(163,255,18)] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(163,255,18)]"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Created
                  {tabCounts.created > 0 && (
                    <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                      {tabCounts.created}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              {showDraftsTab && (
                <TabsTrigger
                  value="drafts"
                  className="relative px-4 py-4 text-sm font-medium text-white/60 data-[state=active]:text-[rgb(163,255,18)] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(163,255,18)]"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Drafts
                  {tabCounts.drafts > 0 && (
                    <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                      {tabCounts.drafts}
                    </Badge>
                  )}
                </TabsTrigger>
              )}

              <TabsTrigger
                value="lootboxes"
                className="relative px-4 py-4 text-sm font-medium text-white/60 data-[state=active]:text-[rgb(163,255,18)] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(163,255,18)]"
              >
                <Package className="w-4 h-4 mr-2" />
                Lootboxes
              </TabsTrigger>

              <TabsTrigger
                value="favorited"
                className="relative px-4 py-4 text-sm font-medium text-white/60 data-[state=active]:text-[rgb(163,255,18)] data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[rgb(163,255,18)]"
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorited
                {tabCounts.favorited > 0 && (
                  <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                    {tabCounts.favorited}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-8 py-6">
        {/* NFT Tabs (Collected/Created/Drafts) */}
        {(activeTab === 'collected' || activeTab === 'created' || activeTab === 'drafts') && (
          <div className="flex gap-6">
            {/* Filter Sidebar (Desktop) */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <ProfileFilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  collections={collections}
                />
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden fixed bottom-20 right-4 z-30">
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-[rgb(163,255,18)] text-black shadow-lg"
                onClick={() => setShowMobileFilters(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {showMobileFilters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 lg:hidden"
                >
                  <div
                    className="absolute inset-0 bg-black/60"
                    onClick={() => setShowMobileFilters(false)}
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-black border-l border-white/10 p-6 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">Filters</h3>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <ProfileFilterSidebar
                      filters={filters}
                      onFiltersChange={setFilters}
                      collections={collections}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* NFT Grid */}
            <div className="flex-1">
              {/* Sync Button */}
              {currentNfts.length > 0 && (
                <div className="flex justify-end mb-4">
                  <SyncNftsButton
                    onSyncComplete={() => {
                      if (activeTab === 'collected') {
                        collectedQuery.refetch();
                      } else if (activeTab === 'created') {
                        createdQuery.refetch();
                      } else if (activeTab === 'drafts') {
                        draftsQuery.refetch();
                      }
                    }}
                    className="text-white/60 border-white/20 hover:text-white hover:border-white/40"
                  />
                </div>
              )}
              <ProfileNFTGrid
                nfts={currentNfts}
                isLoading={isLoadingNfts}
                isOwnProfile={true}
                isDraftsTab={isDraftsTab}
                onListForSale={isDraftsTab ? undefined : handleListForSale}
                onCreateAuction={isDraftsTab ? undefined : handleCreateAuction}
                onCancelListing={isDraftsTab ? undefined : handleCancelListing}
                onViewNFT={handleViewNFT}
                emptyMessage={
                  activeTab === 'collected'
                    ? 'No NFTs in your collection yet'
                    : activeTab === 'created'
                      ? 'No created NFTs yet'
                      : 'No draft NFTs - all your NFTs have been minted on-chain!'
                }
              />
            </div>
          </div>
        )}

        {/* Lootboxes Tab */}
        {activeTab === 'lootboxes' && user?.walletAddress && (
          <ProfileLootboxes walletAddress={user.walletAddress} />
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorited' && (
          <ProfileFavorites
            favorites={favorites}
            isLoading={isLoadingFavorites}
            onItemClick={handleFavoriteClick}
          />
        )}
      </div>

      {/* Modals */}
      <ListForSaleDialog
        open={showListDialog}
        onOpenChange={setShowListDialog}
        nft={selectedNft}
        onSuccess={handleListingSuccess}
      />

      <CreateAuctionDialog
        open={showAuctionDialog}
        onOpenChange={setShowAuctionDialog}
        nft={selectedNft}
        onSuccess={handleListingSuccess}
      />

      <CancelListingDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        nft={selectedNft as any}
        onSuccess={handleListingSuccess}
      />
    </motion.div>
  );
}

export default function CollectionPage() {
  return (
    <ProtectedRoute requireOnboarding>
      <CollectionPageContent />
    </ProtectedRoute>
  );
}
