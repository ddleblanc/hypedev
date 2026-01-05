'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/client';

// Profile Components
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs, type ProfileTab } from '@/components/profile/profile-tabs';
import { ProfileFilterSidebar, type ProfileFilters } from '@/components/profile/profile-filter-sidebar';
import { ProfileNFTGrid, type NFTItem } from '@/components/profile/profile-nft-grid';
import { ProfileActivityFeed, type Activity } from '@/components/profile/profile-activity-feed';
import { ProfileFavorites, type FavoriteItem } from '@/components/profile/profile-favorites';

// UI Components
import { Button } from '@/components/ui/button';
import { Menu, X, AlertTriangle } from 'lucide-react';

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

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const address = params.address as string;
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('collected');
  const [tabCounts, setTabCounts] = useState({
    collected: 0,
    created: 0,
    favorited: 0,
    activity: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<ProfileFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Check if viewing own profile - redirect to /profile
  const isOwnProfile = currentUser?.walletAddress?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    if (isOwnProfile && !authLoading) {
      router.replace('/profile');
    }
  }, [isOwnProfile, authLoading, router]);

  // Map status filter
  const getStatusFilter = () => {
    if (filters.status === 'all') return undefined;
    return filters.status as 'listed' | 'unlisted' | 'auction' | 'on_auction' | 'has_offers' | 'hasOffers' | 'new';
  };

  // tRPC query for profile
  const profileQuery = trpc.user.profile.byAddress.useQuery(
    { address: address || '' },
    {
      enabled: !!address && !isOwnProfile,
    }
  );

  // tRPC query for follow status
  const followStatusQuery = trpc.user.followers.status.useQuery(
    {
      address: address || '',
      checkerAddress: currentUser?.walletAddress,
    },
    {
      enabled: !!address && !!currentUser?.walletAddress && !isOwnProfile,
    }
  );

  // tRPC mutations for follow/unfollow
  const followMutation = trpc.user.followers.follow.useMutation();
  const unfollowMutation = trpc.user.followers.unfollow.useMutation();

  // tRPC queries for NFTs
  const collectedQuery = trpc.user.nfts.list.useQuery(
    {
      address: address || '',
      filter: 'owned',
      status: getStatusFilter(),
      sortBy: sortByMap[filters.sortBy] || 'recent',
      search: filters.searchQuery || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      collections: filters.collections.length > 0 ? filters.collections : undefined,
    },
    {
      enabled: !!address && !isOwnProfile && activeTab === 'collected' && !!profileQuery.data,
    }
  );

  const createdQuery = trpc.user.nfts.list.useQuery(
    {
      address: address || '',
      filter: 'created',
      status: getStatusFilter(),
      sortBy: sortByMap[filters.sortBy] || 'recent',
      search: filters.searchQuery || undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      collections: filters.collections.length > 0 ? filters.collections : undefined,
    },
    {
      enabled: !!address && !isOwnProfile && activeTab === 'created' && !!profileQuery.data,
    }
  );

  // tRPC query for favorites
  const favoritesQuery = trpc.user.favorites.list.useQuery(
    {
      userId: profileQuery.data?.id || '',
      isPublic: true,
    },
    {
      enabled: !!profileQuery.data?.id && !isOwnProfile && activeTab === 'favorited',
    }
  );

  // tRPC query for activity
  const activityQuery = trpc.user.activity.list.useQuery(
    {
      address: address || '',
    },
    {
      enabled: !!address && !isOwnProfile && activeTab === 'activity',
    }
  );

  // Update tab counts when data changes
  useEffect(() => {
    if (collectedQuery.data?.filters) {
      setTabCounts((prev) => ({
        ...prev,
        collected: collectedQuery.data.filters.totalOwned,
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
    if (favoritesQuery.data?.watchlist) {
      setTabCounts((prev) => ({
        ...prev,
        favorited: favoritesQuery.data.watchlist?.items?.length || 0,
      }));
    }
  }, [favoritesQuery.data]);

  useEffect(() => {
    if (activityQuery.data?.activities) {
      setTabCounts((prev) => ({
        ...prev,
        activity: activityQuery.data.activities.length,
      }));
    }
  }, [activityQuery.data]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!currentUser?.walletAddress || !address) {
      toast({
        title: 'Please connect your wallet',
        description: 'You need to be logged in to follow users',
        variant: 'destructive',
      });
      return;
    }

    const isFollowing = followStatusQuery.data?.isFollowing || false;

    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({
          targetAddress: address,
          followerAddress: currentUser.walletAddress,
        });
        toast({
          title: 'Unfollowed',
          description: `You unfollowed ${profileQuery.data?.username || 'this user'}`,
        });
      } else {
        await followMutation.mutateAsync({
          targetAddress: address,
          followerAddress: currentUser.walletAddress,
        });
        toast({
          title: 'Following',
          description: `You are now following ${profileQuery.data?.username || 'this user'}`,
        });
      }
      // Refetch follow status
      followStatusQuery.refetch();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

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
    }));
  }, []);

  // Get current NFTs based on active tab
  const currentNfts = useMemo(() => {
    if (activeTab === 'collected') {
      return transformNfts(collectedQuery.data?.nfts || []);
    } else if (activeTab === 'created') {
      return transformNfts(createdQuery.data?.nfts || []);
    }
    return [];
  }, [activeTab, collectedQuery.data, createdQuery.data, transformNfts]);

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

  // Get activities data - transform to match Activity interface
  const activities: Activity[] = useMemo(() => {
    const rawActivities = activityQuery.data?.activities || [];
    return rawActivities.map((activity) => ({
      id: activity.id,
      type: activity.type as Activity['type'],
      nft: activity.nft ? {
        id: activity.nft.id,
        name: activity.nft.name,
        image: activity.nft.image,
        collection: activity.nft.collectionName || 'Unknown Collection',
      } : undefined,
      price: activity.price ?? undefined,
      from: activity.relatedAddress ?? undefined,
      timestamp: activity.timestamp,
      transactionHash: activity.txHash ?? undefined,
    }));
  }, [activityQuery.data]);

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

  const handleViewNFT = (nft: NFTItem) => {
    router.push(`/collection/${nft.collection.address}/${nft.tokenId}`);
  };

  const handleFavoriteClick = (item: FavoriteItem) => {
    if (item.itemType === 'collection') {
      router.push(`/collection/${item.itemId}`);
    } else if (item.itemType === 'nft') {
      router.push(`/marketplace/nft/${item.itemId}`);
    }
  };

  // Redirect if viewing own profile
  if (isOwnProfile && !authLoading) {
    return null;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Profile Not Found</h1>
        <p className="text-white/60 text-center max-w-md">
          The profile you&apos;re looking for doesn&apos;t exist or hasn&apos;t been set up yet.
        </p>
        <Button
          onClick={() => router.push('/marketplace')}
          className="mt-4 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
        >
          Browse Marketplace
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const stats = {
    nftsOwned: profile.stats?.nftsOwned || 0,
    collectionsOwned: profile.stats?.collectionsOwned || 0,
    followers: profile.stats?.followers || 0,
    following: profile.stats?.following || 0,
    volumeTraded: profile.stats?.volumeTraded,
  };

  const showCreatedTab = profile.isCreator && !!profile.creatorApprovedAt;
  const isLoadingNfts =
    (activeTab === 'collected' && collectedQuery.isLoading) ||
    (activeTab === 'created' && createdQuery.isLoading);
  const isLoadingFavorites = activeTab === 'favorited' && favoritesQuery.isLoading;
  const isLoadingActivity = activeTab === 'activity' && activityQuery.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-16"
    >
      {/* Profile Header */}
      <ProfileHeader
        user={{
          id: profile.id,
          walletAddress: profile.walletAddress,
          username: profile.username,
          bio: profile.bio,
          profilePicture: profile.profilePicture,
          bannerImage: profile.bannerImage,
          isCreator: profile.isCreator,
          creatorApprovedAt: profile.creatorApprovedAt,
          socials: profile.socials || [],
        }}
        stats={stats}
        isOwnProfile={false}
        isFollowing={followStatusQuery.data?.isFollowing || false}
        isFollowLoading={followMutation.isPending || unfollowMutation.isPending}
        onFollowToggle={handleFollowToggle}
      />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCreatedTab={showCreatedTab}
        counts={tabCounts}
      />

      {/* Content Area */}
      <div className="px-4 md:px-8 py-6">
        {/* NFT Tabs (Collected/Created) */}
        {(activeTab === 'collected' || activeTab === 'created') && (
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

            {/* NFT Grid - No listing actions for public profiles */}
            <div className="flex-1">
              <ProfileNFTGrid
                nfts={currentNfts}
                isLoading={isLoadingNfts}
                isOwnProfile={false}
                onViewNFT={handleViewNFT}
                emptyMessage={
                  activeTab === 'collected'
                    ? `${profile.username || 'This user'} hasn't collected any NFTs yet`
                    : `${profile.username || 'This user'} hasn't created any NFTs yet`
                }
              />
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorited' && (
          <ProfileFavorites
            favorites={favorites}
            isLoading={isLoadingFavorites}
            onItemClick={handleFavoriteClick}
            emptyMessage={`${profile.username || 'This user'} hasn't favorited anything yet`}
          />
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <ProfileActivityFeed
            activities={activities}
            isLoading={isLoadingActivity}
            emptyMessage={`${profile.username || 'This user'} has no recent activity`}
          />
        )}
      </div>
    </motion.div>
  );
}
