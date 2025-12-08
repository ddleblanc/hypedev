'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useWalletAuthOptimized } from '@/hooks/use-wallet-auth-optimized';
import { useToast } from '@/hooks/use-toast';

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

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  bannerImage?: string | null;
  isCreator: boolean;
  creatorApprovedAt?: Date | null;
  socials?: { platform: string; url: string }[];
}

interface ProfileStats {
  nftsOwned: number;
  collectionsOwned: number;
  followers: number;
  following: number;
  volumeTraded?: string;
}

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

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const address = params.address as string;
  const { user: currentUser, isLoading: authLoading } = useWalletAuthOptimized();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    nftsOwned: 0,
    collectionsOwned: 0,
    followers: 0,
    following: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('collected');
  const [tabCounts, setTabCounts] = useState({
    collected: 0,
    created: 0,
    favorited: 0,
    activity: 0,
  });

  // Content state
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [createdNfts, setCreatedNfts] = useState<NFTItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Filter state
  const [filters, setFilters] = useState<ProfileFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Check if viewing own profile - redirect to /profile
  const isOwnProfile = currentUser?.walletAddress?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    if (isOwnProfile && !authLoading) {
      router.replace('/profile');
    }
  }, [isOwnProfile, authLoading, router]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/user/${address}`);
      const data = await response.json();

      if (data.success) {
        setProfile({
          id: data.user.id,
          walletAddress: address,
          username: data.user.username,
          bio: data.user.bio,
          profilePicture: data.user.profilePicture,
          bannerImage: data.user.bannerImage,
          isCreator: data.user.isCreator,
          creatorApprovedAt: data.user.creatorApprovedAt,
          socials: data.user.socials || [],
        });

        setStats({
          nftsOwned: data.user.stats?.nftsOwned || 0,
          collectionsOwned: data.user.stats?.collectionsOwned || 0,
          followers: data.user.stats?.followers || 0,
          following: data.user.stats?.following || 0,
          volumeTraded: data.user.stats?.volumeTraded,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address]);

  // Check follow status
  const checkFollowStatus = useCallback(async () => {
    if (!currentUser?.walletAddress || !address) return;

    try {
      const response = await fetch(
        `/api/user/${address}/follow?follower=${currentUser.walletAddress}`
      );
      const data = await response.json();
      setIsFollowing(data.data?.isFollowing || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  }, [currentUser, address]);

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

    setIsFollowLoading(true);
    try {
      const response = await fetch(`/api/user/${address}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerAddress: currentUser.walletAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        setStats((prev) => ({
          ...prev,
          followers: data.data?.followersCount ?? (isFollowing ? prev.followers - 1 : prev.followers + 1),
        }));
        toast({
          title: isFollowing ? 'Unfollowed' : 'Following',
          description: isFollowing
            ? `You unfollowed ${profile?.username || 'this user'}`
            : `You are now following ${profile?.username || 'this user'}`,
        });
      } else {
        throw new Error(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Fetch user's NFTs
  const fetchNfts = useCallback(
    async (filter: 'owned' | 'created' = 'owned') => {
      if (!address) return;

      setIsLoadingNfts(true);
      try {
        const params = new URLSearchParams({
          filter,
          status: filters.status !== 'all' ? filters.status : '',
          sortBy: filters.sortBy,
          search: filters.searchQuery,
        });

        if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
        if (filters.collections.length > 0) {
          params.set('collections', filters.collections.join(','));
        }

        const response = await fetch(`/api/user/${address}/nfts?${params}`);
        const data = await response.json();

        // API returns data.data.nfts structure
        const nftsData = data.data?.nfts || data.nfts || [];
        const totalCount = data.data?.pagination?.total || data.total || nftsData.length;

        if (data.success && nftsData.length > 0) {
          const transformedNfts: NFTItem[] = nftsData.map((nft: any) => ({
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
            listingId: nft.listingId,
            listingExpiry: nft.listingExpiry,
            rarityRank: nft.rarityRank || nft.rank,
            rarityTier: nft.rarityTier || nft.rarity,
          }));

          if (filter === 'owned') {
            setNfts(transformedNfts);
            setTabCounts((prev) => ({
              ...prev,
              collected: totalCount,
            }));
          } else {
            setCreatedNfts(transformedNfts);
            setTabCounts((prev) => ({
              ...prev,
              created: totalCount,
            }));
          }

          // Extract unique collections for filter
          const uniqueCollections = Array.from(
            new Map(
              transformedNfts.map((nft) => [
                nft.collection.id,
                {
                  id: nft.collection.id,
                  name: nft.collection.name,
                  image: nft.collection.image,
                },
              ])
            ).values()
          );
          setCollections(uniqueCollections);
        } else if (data.success) {
          // Empty result
          if (filter === 'owned') {
            setNfts([]);
            setTabCounts((prev) => ({ ...prev, collected: 0 }));
          } else {
            setCreatedNfts([]);
            setTabCounts((prev) => ({ ...prev, created: 0 }));
          }
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setIsLoadingNfts(false);
      }
    },
    [address, filters]
  );

  // Fetch favorites (public favorites if available)
  const fetchFavorites = useCallback(async () => {
    if (!profile?.id) return;

    setIsLoadingFavorites(true);
    try {
      const response = await fetch(
        `/api/lists/watchlist?userId=${profile.id}&type=favorites&public=true`
      );
      const data = await response.json();

      if (data.success && data.watchlist) {
        setFavorites(data.watchlist.items || []);
        setTabCounts((prev) => ({
          ...prev,
          favorited: data.watchlist.items?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [profile]);

  // Fetch activity
  const fetchActivity = useCallback(async () => {
    if (!address) return;

    setIsLoadingActivity(true);
    try {
      // Fetch public activity for this user
      const response = await fetch(`/api/user/${address}/activity`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.activities || []);
        setTabCounts((prev) => ({
          ...prev,
          activity: data.activities?.length || 0,
        }));
      } else {
        // Fallback to empty
        setActivities([]);
        setTabCounts((prev) => ({ ...prev, activity: 0 }));
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivities([]);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [address]);

  // Load profile on mount
  useEffect(() => {
    if (address && !isOwnProfile) {
      fetchProfile();
    }
  }, [address, isOwnProfile, fetchProfile]);

  // Check follow status when profile loads
  useEffect(() => {
    if (profile && currentUser) {
      checkFollowStatus();
    }
  }, [profile, currentUser, checkFollowStatus]);

  // Load tab content when tab changes
  useEffect(() => {
    if (!profile) return;

    switch (activeTab) {
      case 'collected':
        fetchNfts('owned');
        break;
      case 'created':
        fetchNfts('created');
        break;
      case 'favorited':
        fetchFavorites();
        break;
      case 'activity':
        fetchActivity();
        break;
    }
  }, [activeTab, profile, fetchNfts, fetchFavorites, fetchActivity]);

  // Refresh NFTs when filters change
  useEffect(() => {
    if (activeTab === 'collected' || activeTab === 'created') {
      fetchNfts(activeTab === 'collected' ? 'owned' : 'created');
    }
  }, [filters, activeTab, fetchNfts]);

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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
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

  const showCreatedTab = profile.isCreator && !!profile.creatorApprovedAt;
  const currentNfts = activeTab === 'collected' ? nfts : createdNfts;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-16"
    >
      {/* Profile Header */}
      <ProfileHeader
        user={profile}
        stats={stats}
        isOwnProfile={false}
        isFollowing={isFollowing}
        isFollowLoading={isFollowLoading}
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
