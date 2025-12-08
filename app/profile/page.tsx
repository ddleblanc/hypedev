'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWalletAuthOptimized } from '@/hooks/use-wallet-auth-optimized';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Profile Components
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileTabs, type ProfileTab } from '@/components/profile/profile-tabs';
import { ProfileFilterSidebar, type ProfileFilters } from '@/components/profile/profile-filter-sidebar';
import { ProfileNFTGrid, type NFTItem } from '@/components/profile/profile-nft-grid';
import { ProfileActivityFeed, type Activity } from '@/components/profile/profile-activity-feed';
import { ProfileFavorites, type FavoriteItem } from '@/components/profile/profile-favorites';
import { ProfileEditModal } from '@/components/profile/profile-edit-modal';
import { ListForSaleDialog } from '@/components/profile/list-for-sale-dialog';
import { CreateAuctionDialog } from '@/components/profile/create-auction-dialog';
import { CancelListingDialog } from '@/components/profile/cancel-listing-dialog';
import { SyncNftsButton } from '@/components/profile/sync-nfts-button';

// UI Components
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  bannerImage?: string | null;
  isCreator: boolean;
  creatorAppliedAt?: Date | null;  // When user applied to be creator (grants studio access)
  creatorApprovedAt?: Date | null; // When admin approved creator status
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

function ProfilePageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useWalletAuthOptimized();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    nftsOwned: 0,
    collectionsOwned: 0,
    followers: 0,
    following: 0,
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<ProfileTab>('collected');
  const [tabCounts, setTabCounts] = useState({
    collected: 0,
    created: 0,
    drafts: 0,
    favorited: 0,
    activity: 0,
  });

  // Content state
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [createdNfts, setCreatedNfts] = useState<NFTItem[]>([]);
  const [draftNfts, setDraftNfts] = useState<NFTItem[]>([]);
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

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showAuctionDialog, setShowAuctionDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFTItem | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user?.walletAddress) return;

    try {
      const response = await fetch(`/api/user/${user.walletAddress}`);
      const data = await response.json();

      if (data.success) {
        setProfile({
          id: user.id,
          walletAddress: user.walletAddress,
          username: data.user.username,
          bio: data.user.bio,
          profilePicture: data.user.profilePicture,
          bannerImage: data.user.bannerImage,
          isCreator: data.user.isCreator,
          creatorAppliedAt: data.user.creatorAppliedAt,
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  // Fetch user's NFTs
  const fetchNfts = useCallback(async (filter: 'owned' | 'created' | 'drafts' = 'owned') => {
    if (!user?.walletAddress) return;

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

      const response = await fetch(`/api/user/${user.walletAddress}/nfts?${params}`);
      const data = await response.json();

      // API returns data.data.nfts structure
      const nftsData = data.data?.nfts || data.nfts || [];
      const totalCount = data.data?.pagination?.total || data.total || nftsData.length;

      // Update tab counts from API response
      if (data.data?.filters) {
        setTabCounts((prev) => ({
          ...prev,
          collected: data.data.filters.totalOwned ?? prev.collected,
          created: data.data.filters.totalCreated ?? prev.created,
          drafts: data.data.filters.totalDrafts ?? prev.drafts,
        }));
      }

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
          isOnChain: nft.isOnChain ?? true,  // Include on-chain status
          onChainTokenId: nft.onChainTokenId,
        }));

        if (filter === 'owned') {
          setNfts(transformedNfts);
        } else if (filter === 'created') {
          setCreatedNfts(transformedNfts);
        } else if (filter === 'drafts') {
          setDraftNfts(transformedNfts);
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
        } else if (filter === 'created') {
          setCreatedNfts([]);
        } else if (filter === 'drafts') {
          setDraftNfts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setIsLoadingNfts(false);
    }
  }, [user, filters]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingFavorites(true);
    try {
      const response = await fetch(`/api/lists/watchlist?userId=${user.id}&type=favorites`);
      const data = await response.json();

      if (data.success && data.watchlist) {
        setFavorites(data.watchlist.items || []);
        setTabCounts((prev) => ({ ...prev, favorited: data.watchlist.items?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [user]);

  // Fetch activity from real API
  const fetchActivity = useCallback(async () => {
    if (!user?.walletAddress) return;

    setIsLoadingActivity(true);
    try {
      const response = await fetch(
        `/api/user/${user.walletAddress}/activity?limit=50`
      );
      const data = await response.json();

      if (data.success && data.data?.activity) {
        // Transform API response to match Activity interface
        const transformedActivities: Activity[] = data.data.activity.map(
          (item: {
            id: string;
            type: string;
            nft?: { id: string; name: string; image: string; collectionName?: string };
            price?: number;
            relatedAddress?: string;
            timestamp: string;
            txHash?: string;
          }) => ({
            id: item.id,
            type: item.type,
            nft: item.nft
              ? {
                  id: item.nft.id,
                  name: item.nft.name,
                  image: item.nft.image,
                  collection: item.nft.collectionName || '',
                }
              : undefined,
            price: item.price,
            from: item.relatedAddress,
            timestamp: new Date(item.timestamp),
            transactionHash: item.txHash,
          })
        );
        setActivities(transformedActivities);
        setTabCounts((prev) => ({
          ...prev,
          activity: data.data.pagination?.total || transformedActivities.length,
        }));
      } else {
        setActivities([]);
        setTabCounts((prev) => ({ ...prev, activity: 0 }));
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivities([]);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Load tab content when tab changes
  useEffect(() => {
    if (!user) return;

    switch (activeTab) {
      case 'collected':
        fetchNfts('owned');
        break;
      case 'created':
        fetchNfts('created');
        break;
      case 'drafts':
        fetchNfts('drafts');
        break;
      case 'favorited':
        fetchFavorites();
        break;
      case 'activity':
        fetchActivity();
        break;
    }
  }, [activeTab, user, fetchNfts, fetchFavorites, fetchActivity]);

  // Refresh NFTs when filters change
  useEffect(() => {
    if (activeTab === 'collected' || activeTab === 'created' || activeTab === 'drafts') {
      const filterMap = { collected: 'owned', created: 'created', drafts: 'drafts' } as const;
      fetchNfts(filterMap[activeTab]);
    }
  }, [filters, activeTab, fetchNfts]);

  // Handle profile update
  const handleProfileSave = async (data: {
    username?: string;
    bio?: string;
    profilePicture?: string;
    bannerImage?: string;
    socials?: { platform: string; url: string }[];
  }) => {
    if (!user?.id) return;

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        ...data,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update profile');
    }

    // Refresh profile
    fetchProfile();
  };

  // Handle banner/avatar change (from header)
  const handleBannerChange = async (uri: string) => {
    await handleProfileSave({ bannerImage: uri });
  };

  const handleAvatarChange = async (uri: string) => {
    await handleProfileSave({ profilePicture: uri });
  };

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
    // Refresh NFT list
    fetchNfts(activeTab === 'collected' ? 'owned' : 'created');
  };

  const handleFavoriteClick = (item: FavoriteItem) => {
    if (item.itemType === 'collection') {
      router.push(`/collection/${item.itemId}`);
    } else if (item.itemType === 'nft') {
      router.push(`/marketplace/nft/${item.itemId}`);
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Profile not found</p>
      </div>
    );
  }

  // Show Created tab if user has studio access (applied or is creator)
  // This matches the canUserAccessStudio logic in auth.ts
  const hasStudioAccess = profile.isCreator || !!profile.creatorAppliedAt;
  const showCreatedTab = hasStudioAccess;
  // Show drafts tab only on own profile for creators with draft NFTs
  const showDraftsTab = hasStudioAccess && tabCounts.drafts > 0;

  // Get current NFTs based on active tab
  const currentNfts = activeTab === 'collected'
    ? nfts
    : activeTab === 'created'
      ? createdNfts
      : activeTab === 'drafts'
        ? draftNfts
        : nfts;

  // Check if we're on a draft tab (for disabling listing actions)
  const isDraftsTab = activeTab === 'drafts';

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
        isOwnProfile={true}
        onEditProfile={() => setShowEditModal(true)}
        onBannerChange={handleBannerChange}
        onAvatarChange={handleAvatarChange}
      />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showCreatedTab={showCreatedTab}
        showDraftsTab={showDraftsTab}
        counts={tabCounts}
      />

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
              {/* Sync Button - only show when there are NFTs */}
              {currentNfts.length > 0 && (
                <div className="flex justify-end mb-4">
                  <SyncNftsButton
                    onSyncComplete={() => {
                      const filterMap = { collected: 'owned', created: 'created', drafts: 'drafts' } as const;
                      fetchNfts(filterMap[activeTab as keyof typeof filterMap]);
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

        {/* Favorites Tab */}
        {activeTab === 'favorited' && (
          <ProfileFavorites
            favorites={favorites}
            isLoading={isLoadingFavorites}
            onItemClick={handleFavoriteClick}
          />
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <ProfileActivityFeed
            activities={activities}
            isLoading={isLoadingActivity}
          />
        )}
      </div>

      {/* Modals */}
      <ProfileEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={profile}
        onSave={handleProfileSave}
      />

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

export default function ProfilePage() {
  return (
    <ProtectedRoute requireOnboarding>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
