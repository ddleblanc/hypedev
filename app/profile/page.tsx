"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Trophy, Eye, ChevronRight, Sparkles, Hash, Star, TrendingUp, ArrowUpRight, Target, Zap, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockProfile = {
  username: "CyberWarrior",
  level: 42,
  currentXP: 8750,
  nextLevelXP: 10000,

  stats: [
    { label: "Total Volume", value: "47.8 ETH", change: "+2.4%", trending: true },
    { label: "NFTs Owned", value: "127", change: "+12", trending: true },
    { label: "Collections", value: "23", change: null, trending: false },
    { label: "Win Rate", value: "74%", change: "+3%", trending: true }
  ],

  nftCollection: [
    { id: 1, name: "Cyber Punk #4721", collection: "Cyber Punks", rarity: "Legendary", image: "https://via.placeholder.com/400x300/1a1a1a/a3ff12?text=Cyber+Punk", lastPrice: "2.8 ETH", traits: 7, rank: 142 },
    { id: 2, name: "Neon Warrior #891", collection: "Neon Warriors", rarity: "Epic", image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Neon+Warrior", lastPrice: "1.9 ETH", traits: 6, rank: 387 },
    { id: 3, name: "Pixel Legend #3304", collection: "Pixel Legends", rarity: "Rare", image: "https://via.placeholder.com/400x300/1a1a1a/3b82f6?text=Pixel+Legend", lastPrice: "1.1 ETH", traits: 5, rank: 891 },
    { id: 4, name: "Digital Dream #156", collection: "Digital Dreams", rarity: "Epic", image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Digital+Dream", lastPrice: "3.4 ETH", traits: 8, rank: 234 },
    { id: 5, name: "Cyber Samurai #2891", collection: "Cyber Punks", rarity: "Epic", image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Samurai", lastPrice: "2.2 ETH", traits: 6, rank: 512 },
    { id: 6, name: "Neon Dragon #445", collection: "Neon Warriors", rarity: "Legendary", image: "https://via.placeholder.com/400x300/1a1a1a/a3ff12?text=Dragon", lastPrice: "4.1 ETH", traits: 9, rank: 89 }
  ],

  favoriteGames: [
    { id: 1, name: "NFT Battle Royale", plays: 127, wins: 94, winRate: 74, image: "https://via.placeholder.com/400x300/1a1a1a/eab308?text=Battle+Royale", status: "online" },
    { id: 2, name: "Collector Wars", plays: 89, wins: 73, winRate: 82, image: "https://via.placeholder.com/400x300/1a1a1a/a3ff12?text=Collector+Wars", status: "online" },
    { id: 3, name: "Speed Trading", plays: 56, wins: 48, winRate: 86, image: "https://via.placeholder.com/400x300/1a1a1a/3b82f6?text=Speed+Trading", status: "offline" },
    { id: 4, name: "Treasure Hunt", plays: 34, wins: 29, winRate: 85, image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Treasure+Hunt", status: "online" }
  ],

  recentActivity: [
    { text: "RANKED #8 IN TOURNAMENT", time: "5H", icon: Trophy },
    { text: "EARNED DIAMOND COLLECTOR", time: "2H", icon: Star },
    { text: "10 TRADE STREAK COMPLETE", time: "1D", icon: Zap },
    { text: "NEW NFT ACQUIRED", time: "2D", icon: Sparkles },
    { text: "LEVEL UP TO 42", time: "3D", icon: Crown }
  ]
};

interface WatchlistItem {
  id: string;
  itemType: string;
  itemId: string;
  metadata: any;
  addedAt: string;
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useWalletAuthOptimized();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  // Fetch watchlist items
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user?.id) {
        setIsLoadingWatchlist(false);
        return;
      }

      try {
        const response = await fetch(`/api/lists/watchlist?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.watchlist) {
          setWatchlistItems(data.watchlist.items.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setIsLoadingWatchlist(false);
      }
    };

    fetchWatchlist();
  }, [user?.id]);

  const xpProgress = (mockProfile.currentXP / mockProfile.nextLevelXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black pt-16"
    >
      {/* Hero Section - Profile Header */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="px-4 md:px-8 pt-8 pb-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: User Info */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[rgb(163,255,18)] to-green-600 flex items-center justify-center">
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-black" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-black border-2 border-[rgb(163,255,18)] px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-[rgb(163,255,18)]">LVL {mockProfile.level}</span>
              </div>
            </div>

            {/* Name & XP */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{mockProfile.username}</h1>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-xs">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-600 transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-white/60 font-mono">
                  {mockProfile.currentXP.toLocaleString()} / {mockProfile.nextLevelXP.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Edit Profile
            </Button>
            <Button className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold">
              Share Profile
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="px-4 md:px-8 pb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mockProfile.stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.6 }}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
            >
              <p className="text-xs text-white/60 uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.change && (
                  <span className={cn(
                    "text-xs font-bold",
                    stat.trending ? "text-[rgb(163,255,18)]" : "text-white/60"
                  )}>
                    {stat.change}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Watchlist Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="px-4 md:px-8 py-6"
      >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[rgb(163,255,18)]" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Watchlist</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white flex items-center gap-1"
              onClick={() => router.push('/lists')}
            >
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>

          {isLoadingWatchlist ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin mx-auto" />
            </div>
          ) : watchlistItems.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-bold mb-2">Your watchlist is empty</p>
              <p className="text-xs text-white/30">Add collections, NFTs, or games to track them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {watchlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.6 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    if (item.itemType === 'launchpad' || item.itemType === 'collection') {
                      router.push(`/launchpad/${item.itemId}`);
                    } else if (item.itemType === 'nft') {
                      router.push(`/marketplace/nft/${item.itemId}`);
                    }
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square mb-2">
                    <img
                      src={item.metadata?.image || '/api/placeholder/200/200'}
                      alt={item.metadata?.name || 'Watchlist item'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                    {/* Type Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] text-xs">
                        {item.itemType.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white font-bold text-sm truncate">{item.metadata?.name || 'Unknown'}</h3>
                      {item.metadata?.symbol && (
                        <p className="text-white/60 text-xs truncate">{item.metadata.symbol}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
      </motion.section>

      {/* NFT Collection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="px-4 md:px-8 py-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[rgb(163,255,18)]" />
            <h2 className="text-xl md:text-2xl font-bold text-white">My Collection</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {mockProfile.nftCollection.map((nft, index) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.6 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg aspect-square mb-2">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Rarity Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className={cn(
                    "text-xs font-bold",
                    nft.rarity === "Legendary" && "bg-yellow-500/20 border-yellow-500/50 text-yellow-500",
                    nft.rarity === "Epic" && "bg-purple-500/20 border-purple-500/50 text-purple-500",
                    nft.rarity === "Rare" && "bg-blue-500/20 border-blue-500/50 text-blue-500"
                  )}>
                    {nft.rarity.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-white font-bold text-sm md:text-base truncate leading-tight">{nft.name}</h3>
                <p className="text-[rgb(163,255,18)] text-xs md:text-sm truncate leading-tight">{nft.collection}</p>
              </div>

              <div>
                <p className="text-white/50 text-xs uppercase tracking-wider leading-tight">Last Price</p>
                <p className="text-sm leading-tight">
                  <span className="text-white font-medium">{nft.lastPrice}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Favorite Games */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="px-4 md:px-8 py-6 bg-gradient-to-b from-black/50 to-black"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Favorite Games</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mockProfile.favoriteGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.6 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg aspect-[4/3] mb-2">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Status Badge */}
                {game.status === "online" && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[rgb(163,255,18)]/20 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] text-xs flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-[rgb(163,255,18)] rounded-full animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <h3 className="text-white font-bold text-sm md:text-base truncate leading-tight">{game.name}</h3>
                <p className="text-white/60 text-xs truncate leading-tight">{game.plays} plays</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider leading-tight">Win Rate</p>
                  <p className={cn(
                    "text-sm font-bold leading-tight",
                    game.winRate >= 80 ? "text-[rgb(163,255,18)]" : game.winRate >= 70 ? "text-yellow-500" : "text-white"
                  )}>
                    {game.winRate}%
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider leading-tight">Wins</p>
                  <p className="text-sm font-bold text-white leading-tight">{game.wins}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="px-4 md:px-8 py-6 pb-16"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl md:text-2xl font-bold text-white">Recent Activity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mockProfile.recentActivity.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.6 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[rgb(163,255,18)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-bold leading-tight mb-1">{activity.text}</p>
                    <p className="text-xs text-white/40 font-mono">{activity.time} AGO</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
