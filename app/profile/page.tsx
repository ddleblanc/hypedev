'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';

// Profile Components
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileEditModal } from '@/components/profile/profile-edit-modal';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Trophy,
  Gamepad2,
  Users,
  Heart,
  Activity,
  ArrowRight,
  Sparkles,
  Crown,
  Target,
  Zap,
  Gift,
  BarChart3,
  Wallet,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  bannerImage?: string | null;
  isCreator: boolean;
  creatorAppliedAt?: Date | null;
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

interface TradingStats {
  totalVolume: string;
  totalSales: number;
  totalPurchases: number;
  profitLoss: string;
  profitLossPercent: number;
  bestSale: { name: string; price: string; image: string } | null;
}

interface GamingStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarnings: string;
  rank: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

interface LootboxStats {
  owned: number;
  opened: number;
  totalSpent: string;
  bestPull: { name: string; rarity: string; image: string } | null;
}

interface FollowedEntity {
  id: string;
  name: string;
  image: string;
  type: 'user' | 'collection';
  stats?: string;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl bg-white/5" />
        <Skeleton className="h-64 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'white',
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'bg-black/40 border-white/10 hover:border-white/20 transition-all cursor-pointer',
          onClick && 'hover:shadow-lg hover:shadow-white/5'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            {trend && (
              <Badge
                className={cn(
                  'text-xs',
                  trend.isPositive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-white/60">{label}</p>
            {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProfileDashboardContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    nftsOwned: 0,
    collectionsOwned: 0,
    followers: 0,
    following: 0,
  });

  // Dashboard data state
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [gamingStats, setGamingStats] = useState<GamingStats | null>(null);
  const [lootboxStats, setLootboxStats] = useState<LootboxStats | null>(null);
  const [following, setFollowing] = useState<FollowedEntity[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Use tRPC to fetch profile data
  const profileQuery = trpc.user.profile.byAddress.useQuery(
    { address: user?.walletAddress ?? '' },
    {
      enabled: !!user?.walletAddress,
    }
  );

  // tRPC queries for dashboard data
  const tradingStatsQuery = trpc.user.profile.tradingStats.useQuery(
    { address: user?.walletAddress ?? '' },
    { enabled: !!user?.walletAddress }
  );

  const lootboxInventoryQuery = trpc.lootbox.inventory.useQuery(
    { address: user?.walletAddress ?? '' },
    { enabled: !!user?.walletAddress }
  );

  const activityQuery = trpc.user.activity.list.useQuery(
    { address: user?.walletAddress ?? '', limit: 5 },
    { enabled: !!user?.walletAddress }
  );

  // Update profile state when data changes
  useEffect(() => {
    if (profileQuery.data && user) {
      const data = profileQuery.data;
      setProfile({
        id: user.id,
        walletAddress: user.walletAddress,
        username: data.username,
        bio: data.bio,
        profilePicture: data.profilePicture,
        bannerImage: data.bannerImage,
        isCreator: data.isCreator,
        creatorAppliedAt: data.creatorAppliedAt,
        creatorApprovedAt: data.creatorApprovedAt,
        socials: data.socials || [],
      });

      setStats({
        nftsOwned: data.stats?.nftsOwned || 0,
        collectionsOwned: data.stats?.collectionsOwned || 0,
        followers: data.stats?.followers || 0,
        following: data.stats?.following || 0,
        volumeTraded: data.stats?.volumeTraded,
      });
      setIsLoadingProfile(false);
    }
  }, [profileQuery.data, user]);

  // Handle query error
  useEffect(() => {
    if (profileQuery.error) {
      console.error('Error fetching profile:', profileQuery.error);
      setIsLoadingProfile(false);
    }
  }, [profileQuery.error]);

  // Wrapper for backward compatibility
  const fetchProfile = useCallback(async () => {
    if (!user?.walletAddress) return;
    await profileQuery.refetch();
  }, [user, profileQuery]);

  // Fetch dashboard data using tRPC queries
  const fetchDashboardData = useCallback(async () => {
    if (!user?.walletAddress) return;

    try {
      // Refetch all dashboard data via tRPC
      await Promise.allSettled([
        tradingStatsQuery.refetch(),
        lootboxInventoryQuery.refetch(),
        activityQuery.refetch(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [user, tradingStatsQuery, lootboxInventoryQuery, activityQuery]);

  // Process tRPC dashboard data
  useEffect(() => {
    // Process trading stats
    if (tradingStatsQuery.data?.success) {
      setTradingStats(tradingStatsQuery.data.stats);
    } else if (tradingStatsQuery.error) {
      // Default stats on error
      setTradingStats({
        totalVolume: '0 ETH',
        totalSales: 0,
        totalPurchases: 0,
        profitLoss: '0 ETH',
        profitLossPercent: 0,
        bestSale: null,
      });
    }
  }, [tradingStatsQuery.data, tradingStatsQuery.error]);

  useEffect(() => {
    // Process lootbox stats from inventory
    if (lootboxInventoryQuery.data) {
      const inv = lootboxInventoryQuery.data;
      const totalOwned = inv.inventory?.reduce(
        (sum: number, lb: any) => sum + lb.balance,
        0
      ) || 0;
      const totalOpened = inv.openings?.length || 0;

      setLootboxStats({
        owned: totalOwned,
        opened: totalOpened,
        totalSpent: '0.5 ETH',
        bestPull: null,
      });
    } else if (lootboxInventoryQuery.error) {
      setLootboxStats({
        owned: 0,
        opened: 0,
        totalSpent: '0 ETH',
        bestPull: null,
      });
    }
  }, [lootboxInventoryQuery.data, lootboxInventoryQuery.error]);

  useEffect(() => {
    // Process activity
    if (activityQuery.data) {
      setRecentActivity(activityQuery.data.activities || []);
    }
  }, [activityQuery.data]);

  // Set default gaming stats and following (to be implemented via tRPC later)
  useEffect(() => {
    if (user?.walletAddress) {
      // Mock gaming stats for now
      setGamingStats({
        gamesPlayed: 42,
        wins: 28,
        losses: 14,
        winRate: 66.7,
        totalEarnings: '1,250 HYP',
        rank: 'Gold II',
        level: 23,
        xp: 7500,
        xpToNextLevel: 10000,
      });

      // Mock following for now
      setFollowing([
        { id: '1', name: 'CryptoArt', image: '/placeholder.svg', type: 'collection', stats: '1.2K items' },
        { id: '2', name: 'player_one', image: '/placeholder.svg', type: 'user', stats: '500 followers' },
        { id: '3', name: 'GameGuild', image: '/placeholder.svg', type: 'collection', stats: '3.4K items' },
      ]);

      // Mark dashboard as loaded when all queries are settled
      if (!tradingStatsQuery.isLoading && !lootboxInventoryQuery.isLoading && !activityQuery.isLoading) {
        setIsLoadingDashboard(false);
      }
    }
  }, [user, tradingStatsQuery.isLoading, lootboxInventoryQuery.isLoading, activityQuery.isLoading]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDashboardData();
    }
  }, [user, fetchProfile, fetchDashboardData]);

  // Use tRPC mutation for profile update
  const updateProfileMutation = trpc.user.profile.update.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
    },
    onError: (error) => {
      throw new Error(error.message || 'Failed to update profile');
    },
  });

  // Handle profile update
  const handleProfileSave = async (data: {
    username?: string;
    bio?: string;
    profilePicture?: string;
    bannerImage?: string;
    socials?: { platform: string; url: string }[];
  }) => {
    if (!user?.walletAddress) return;

    // Cast socials to the expected type for the mutation
    const socialsTyped = data.socials as { platform: 'twitter' | 'instagram' | 'discord' | 'telegram' | 'website' | 'youtube'; url: string }[] | undefined;

    await updateProfileMutation.mutateAsync({
      address: user.walletAddress,
      username: data.username,
      bio: data.bio,
      profilePicture: data.profilePicture,
      bannerImage: data.bannerImage,
      socials: socialsTyped,
    });
  };

  const handleBannerChange = async (uri: string) => {
    await handleProfileSave({ bannerImage: uri });
  };

  const handleAvatarChange = async (uri: string) => {
    await handleProfileSave({ profilePicture: uri });
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

      {/* Dashboard Content */}
      <div className="px-4 md:px-8 py-8">
        {isLoadingDashboard ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Package}
                label="NFTs Owned"
                value={stats.nftsOwned}
                color="rgb(163,255,18)"
                onClick={() => router.push('/profile/collection')}
              />
              <StatCard
                icon={Trophy}
                label="Achievements"
                value={gamingStats?.level || 0}
                subValue={`Level ${gamingStats?.level || 1}`}
                color="#fbbf24"
                onClick={() => router.push('/profile/achievements')}
              />
              <StatCard
                icon={Users}
                label="Followers"
                value={stats.followers}
                trend={{ value: 12, isPositive: true }}
                color="#60a5fa"
              />
              <StatCard
                icon={Wallet}
                label="Volume Traded"
                value={tradingStats?.totalVolume || '0 ETH'}
                color="#a855f7"
                onClick={() => router.push('/profile/stats')}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Overview */}
              <Card className="bg-black/40 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Trading Overview
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                    onClick={() => router.push('/profile/stats')}
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {tradingStats?.totalSales || 0}
                      </p>
                      <p className="text-xs text-white/60">Sales</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {tradingStats?.totalPurchases || 0}
                      </p>
                      <p className="text-xs text-white/60">Purchases</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          tradingStats?.profitLossPercent &&
                            tradingStats.profitLossPercent >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        )}
                      >
                        {tradingStats?.profitLoss || '0 ETH'}
                      </p>
                      <p className="text-xs text-white/60">P/L</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gaming Stats */}
              <Card className="bg-black/40 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-cyan-400" />
                    Gaming Stats
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    {gamingStats?.rank || 'Unranked'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Level Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Level {gamingStats?.level || 1}</span>
                      <span className="text-white/60">
                        {gamingStats?.xp?.toLocaleString() || 0} /{' '}
                        {gamingStats?.xpToNextLevel?.toLocaleString() || 0} XP
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            ((gamingStats?.xp || 0) /
                              (gamingStats?.xpToNextLevel || 1)) *
                            100
                          }%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {gamingStats?.gamesPlayed || 0}
                      </p>
                      <p className="text-xs text-white/60">Games</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {gamingStats?.wins || 0}
                      </p>
                      <p className="text-xs text-white/60">Wins</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">
                        {gamingStats?.winRate?.toFixed(1) || 0}%
                      </p>
                      <p className="text-xs text-white/60">Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lootbox Stats */}
              <Card className="bg-black/40 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-pink-400" />
                    Lootbox Stats
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                    onClick={() => router.push('/profile/collection?tab=lootboxes')}
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-3xl font-bold text-white">
                        {lootboxStats?.owned || 0}
                      </p>
                      <p className="text-sm text-white/60">Owned</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                      <p className="text-3xl font-bold text-white">
                        {lootboxStats?.opened || 0}
                      </p>
                      <p className="text-sm text-white/60">Opened</p>
                    </div>
                  </div>
                  {lootboxStats?.owned && lootboxStats.owned > 0 ? (
                    <Button
                      className="w-full mt-4 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                      onClick={() => router.push('/lootboxes/reveal')}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Open Lootboxes
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                      onClick={() => router.push('/lootboxes')}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Browse Lootboxes
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Following */}
              <Card className="bg-black/40 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-400" />
                    Following
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {following.length > 0 ? (
                      following.map((entity) => (
                        <div
                          key={entity.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarImage src={entity.image} />
                            <AvatarFallback className="bg-white/10 text-white">
                              {entity.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {entity.name}
                            </p>
                            <p className="text-xs text-white/60">{entity.stats}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs capitalize',
                              entity.type === 'collection'
                                ? 'border-purple-500/30 text-purple-400'
                                : 'border-blue-500/30 text-blue-400'
                            )}
                          >
                            {entity.type}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Users className="h-10 w-10 text-white/20 mx-auto mb-2" />
                        <p className="text-white/60 text-sm">Not following anyone yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-white/20 text-white hover:bg-white/10"
                          onClick={() => router.push('/marketplace')}
                        >
                          Discover
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Recent Activity
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={() => router.push('/profile/stats')}
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, i) => (
                      <div
                        key={activity.id || i}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                          {activity.type === 'sale' && (
                            <TrendingUp className="h-5 w-5 text-green-400" />
                          )}
                          {activity.type === 'purchase' && (
                            <Package className="h-5 w-5 text-blue-400" />
                          )}
                          {activity.type === 'list' && (
                            <Star className="h-5 w-5 text-yellow-400" />
                          )}
                          {!['sale', 'purchase', 'list'].includes(activity.type) && (
                            <Activity className="h-5 w-5 text-white/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {activity.nft?.name || 'Activity'}
                          </p>
                          <p className="text-xs text-white/60 capitalize">{activity.type}</p>
                        </div>
                        <div className="text-right">
                          {activity.price && (
                            <p className="text-sm font-medium text-white">
                              {activity.price} ETH
                            </p>
                          )}
                          <p className="text-xs text-white/40">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-10 w-10 text-white/20 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={profile}
        onSave={handleProfileSave}
      />
    </motion.div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requireOnboarding>
      <ProfileDashboardContent />
    </ProtectedRoute>
  );
}
