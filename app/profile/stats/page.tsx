'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ProfileActivityFeed, type Activity, type ActivityType } from '@/components/profile/profile-activity-feed';
import { trpc } from '@/lib/trpc/client';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity as ActivityIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Gamepad2,
  Trophy,
  Target,
  Flame,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingStats {
  totalVolume: number;
  totalSales: number;
  totalPurchases: number;
  profitLoss: number;
  avgSalePrice: number;
  avgPurchasePrice: number;
  highestSale: { name: string; price: number; date: string } | null;
  recentTrades: Array<{
    type: 'sale' | 'purchase';
    nftName: string;
    price: number;
    date: string;
  }>;
}

interface GamingStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalEarnings: number;
  favoriteGame: string;
  recentGames: Array<{
    game: string;
    result: 'win' | 'loss';
    earnings: number;
    date: string;
  }>;
}

function StatBox({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  color = 'white',
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5" style={{ color }} />
        {trend && (
          <Badge
            className={cn(
              'text-xs',
              trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}
          >
            {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
      {subValue && <p className="text-xs text-white/40 mt-1">{subValue}</p>}
    </div>
  );
}

function StatsPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('activity');

  // Fetch activity using tRPC
  const { data: activityData, isLoading: activityLoading } = trpc.user.activity.list.useQuery(
    { address: user?.walletAddress ?? '', limit: 50 },
    { enabled: !!user?.walletAddress }
  );

  // Transform activities to match expected format
  const activities = useMemo((): Activity[] => {
    if (!activityData?.activities) return [];
    return activityData.activities.map((item) => ({
      id: item.id,
      type: item.type as ActivityType,
      nft: item.nft
        ? {
            id: item.nft.id,
            name: item.nft.name,
            image: item.nft.image,
            collection: item.nft.collectionName || '',
          }
        : undefined,
      price: item.price ?? undefined,
      from: item.relatedAddress ?? undefined,
      timestamp: new Date(item.timestamp),
      transactionHash: item.txHash ?? undefined,
    }));
  }, [activityData?.activities]);

  // Mock trading stats (would be replaced with real tRPC call when endpoint exists)
  const tradingStats: TradingStats = {
    totalVolume: 12.5,
    totalSales: 8,
    totalPurchases: 15,
    profitLoss: 2.3,
    avgSalePrice: 1.56,
    avgPurchasePrice: 0.83,
    highestSale: { name: 'Rare Dragon #1234', price: 3.5, date: '2024-01-15' },
    recentTrades: [
      { type: 'sale', nftName: 'CryptoWarrior #456', price: 1.2, date: '2024-01-20' },
      { type: 'purchase', nftName: 'Space Cat #789', price: 0.8, date: '2024-01-19' },
      { type: 'sale', nftName: 'Art Piece #123', price: 2.1, date: '2024-01-18' },
    ],
  };

  // Mock gaming stats (would be replaced with real tRPC call when endpoint exists)
  const gamingStats: GamingStats = {
    totalGames: 42,
    wins: 28,
    losses: 14,
    winRate: 66.7,
    currentStreak: 3,
    bestStreak: 8,
    totalEarnings: 1250,
    favoriteGame: 'Arena Battles',
    recentGames: [
      { game: 'Arena Battles', result: 'win', earnings: 50, date: '2024-01-20' },
      { game: 'Card Masters', result: 'win', earnings: 30, date: '2024-01-20' },
      { game: 'Arena Battles', result: 'loss', earnings: -25, date: '2024-01-19' },
    ],
  };

  const isLoading = activityLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-20"
    >
      {/* Header */}
      <div className="px-4 md:px-8 pb-6 border-b border-white/10">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <ActivityIcon className="h-7 w-7 text-green-400" />
          Activity & Stats
        </h1>
        <p className="text-white/60 mt-1">Track your performance and history</p>
      </div>

      <div className="px-4 md:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black"
            >
              <ActivityIcon className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="trading"
              className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Trading
            </TabsTrigger>
            <TabsTrigger
              value="gaming"
              className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Gaming
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-xl bg-white/5" />
            </div>
          ) : (
            <>
              <TabsContent value="activity" className="mt-0">
                <ProfileActivityFeed activities={activities} isLoading={false} />
              </TabsContent>

              <TabsContent value="trading" className="mt-0 space-y-6">
                <>
                  {/* Trading Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatBox
                        icon={DollarSign}
                        label="Total Volume"
                        value={`${tradingStats.totalVolume} ETH`}
                        color="#a855f7"
                        trend={{ value: 12, isPositive: true }}
                      />
                      <StatBox
                        icon={TrendingUp}
                        label="Total Sales"
                        value={tradingStats.totalSales}
                        subValue={`Avg: ${tradingStats.avgSalePrice} ETH`}
                        color="#22c55e"
                      />
                      <StatBox
                        icon={Package}
                        label="Total Purchases"
                        value={tradingStats.totalPurchases}
                        subValue={`Avg: ${tradingStats.avgPurchasePrice} ETH`}
                        color="#3b82f6"
                      />
                      <StatBox
                        icon={tradingStats.profitLoss >= 0 ? TrendingUp : TrendingDown}
                        label="Profit/Loss"
                        value={`${tradingStats.profitLoss >= 0 ? '+' : ''}${tradingStats.profitLoss} ETH`}
                        color={tradingStats.profitLoss >= 0 ? '#22c55e' : '#ef4444'}
                      />
                    </div>

                    {/* Best Sale */}
                    {tradingStats.highestSale && (
                      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                              <Trophy className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm text-white/60">Highest Sale</p>
                              <p className="text-lg font-bold text-white">
                                {tradingStats.highestSale.name}
                              </p>
                              <p className="text-green-400 font-bold">
                                {tradingStats.highestSale.price} ETH
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recent Trades */}
                    <Card className="bg-black/40 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Recent Trades</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tradingStats.recentTrades.map((trade, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'p-2 rounded-lg',
                                  trade.type === 'sale' ? 'bg-green-500/20' : 'bg-blue-500/20'
                                )}
                              >
                                {trade.type === 'sale' ? (
                                  <TrendingUp className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Package className="h-4 w-4 text-blue-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{trade.nftName}</p>
                                <p className="text-xs text-white/60 capitalize">{trade.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">{trade.price} ETH</p>
                              <p className="text-xs text-white/40">{trade.date}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                </>
              </TabsContent>

              <TabsContent value="gaming" className="mt-0 space-y-6">
                <>
                  {/* Gaming Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatBox
                        icon={Gamepad2}
                        label="Total Games"
                        value={gamingStats.totalGames}
                        color="#06b6d4"
                      />
                      <StatBox
                        icon={Trophy}
                        label="Wins"
                        value={gamingStats.wins}
                        subValue={`${gamingStats.winRate.toFixed(1)}% win rate`}
                        color="#22c55e"
                      />
                      <StatBox
                        icon={Flame}
                        label="Current Streak"
                        value={gamingStats.currentStreak}
                        subValue={`Best: ${gamingStats.bestStreak}`}
                        color="#f97316"
                      />
                      <StatBox
                        icon={DollarSign}
                        label="Total Earnings"
                        value={`${gamingStats.totalEarnings} HYP`}
                        color="#fbbf24"
                      />
                    </div>

                    {/* Favorite Game */}
                    <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-cyan-500/20 rounded-lg">
                            <Target className="h-6 w-6 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm text-white/60">Favorite Game</p>
                            <p className="text-lg font-bold text-white">{gamingStats.favoriteGame}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Games */}
                    <Card className="bg-black/40 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Recent Games</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {gamingStats.recentGames.map((game, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'p-2 rounded-lg',
                                  game.result === 'win' ? 'bg-green-500/20' : 'bg-red-500/20'
                                )}
                              >
                                {game.result === 'win' ? (
                                  <Trophy className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Target className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{game.game}</p>
                                <p className="text-xs text-white/60 capitalize">{game.result}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  'text-sm font-bold',
                                  game.earnings >= 0 ? 'text-green-400' : 'text-red-400'
                                )}
                              >
                                {game.earnings >= 0 ? '+' : ''}
                                {game.earnings} HYP
                              </p>
                              <p className="text-xs text-white/40">{game.date}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                </>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </motion.div>
  );
}

export default function StatsPage() {
  return (
    <ProtectedRoute requireOnboarding>
      <StatsPageContent />
    </ProtectedRoute>
  );
}
