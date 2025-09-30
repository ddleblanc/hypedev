"use client";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Trophy, Flame, Crown, Shield, Zap,
  ArrowRight, Clock, Target, ChevronRight, Sparkles, Hash, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";

const mockProfile = {
  username: "CyberWarrior",
  level: 42,
  currentXP: 8750,
  nextLevelXP: 10000,

  activeTournament: {
    name: "COLLECTOR'S SHOWDOWN",
    rank: 8,
    total: 800,
    prize: "25 ETH",
    progress: 72,
    endsIn: "5h 23m",
    status: "leading"
  },

  opportunities: [
    { title: "CYBER PUNKS +12.5%", subtitle: "FLOOR SPIKING", urgency: true },
    { title: "WHALE STATUS", subtitle: "2.2 ETH AWAY", urgency: false },
    { title: "BATTLE ROYALE", subtitle: "2.1K ONLINE", urgency: false }
  ],

  nftCollection: [
    { id: 1, name: "Cyber Punk #4721", collection: "Cyber Punks", rarity: "Legendary", image: "https://via.placeholder.com/400x300/1a1a1a/a3ff12?text=Cyber+Punk", lastPrice: "2.8 ETH", traits: 7, rank: 142 },
    { id: 2, name: "Neon Warrior #891", collection: "Neon Warriors", rarity: "Epic", image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Neon+Warrior", lastPrice: "1.9 ETH", traits: 6, rank: 387 },
    { id: 3, name: "Pixel Legend #3304", collection: "Pixel Legends", rarity: "Rare", image: "https://via.placeholder.com/400x300/1a1a1a/3b82f6?text=Pixel+Legend", lastPrice: "1.1 ETH", traits: 5, rank: 891 },
    { id: 4, name: "Digital Dream #156", collection: "Digital Dreams", rarity: "Epic", image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Digital+Dream", lastPrice: "3.4 ETH", traits: 8, rank: 234 }
  ],

  favoriteGames: [
    { id: 1, name: "NFT Battle Royale", plays: 127, wins: 94, winRate: 74, image: "https://via.placeholder.com/400x300/1a1a1a/eab308?text=Battle+Royale", status: "online" },
    { id: 2, name: "Collector Wars", plays: 89, wins: 73, winRate: 82, image: "https://via.placeholder.com/400x300/1a1a1a/a3ff12?text=Collector+Wars", status: "online" },
    { id: 3, name: "Speed Trading", plays: 56, wins: 48, winRate: 86, image: "https://via.placeholder.com/400x300/1a1a1a/3b82f6?text=Speed+Trading", status: "offline" },
    { id: 4, name: "Treasure Hunt", plays: 34, wins: 29, winRate: 85, image: "https://via.placeholder.com/400x300/1a1a1a/9333ea?text=Treasure+Hunt", status: "online" }
  ],

  liveStats: [
    { value: "#8", label: "RANK", change: "+3" },
    { value: "47.8 ETH", label: "VALUE", change: "+2.4%" },
    { value: "12", label: "STREAK", change: null }
  ],

  recentActivity: [
    { text: "RANKED #8 IN TOURNAMENT", time: "5H" },
    { text: "EARNED DIAMOND COLLECTOR", time: "2H" },
    { text: "10 TRADE STREAK COMPLETE", time: "1D" }
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
  const [isMobile, setIsMobile] = useState(false);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          // Get latest 6 items
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
  const t = mockProfile.activeTournament;

  if (isMobile) {
    return <div className="pt-16 p-4"><p className="text-white/60 text-center">Desktop required</p></div>;
  }

  return (
    <div className="w-full min-h-screen relative">

      {/* ULTRA MINIMAL TOP BAR */}
      <div className="sticky top-16 z-30 bg-black border-b border-[rgb(163,255,18)]/20">
        <div className="px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-9 h-9 bg-[rgb(163,255,18)] clip-hex flex items-center justify-center">
                <Crown className="w-5 h-5 text-black" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-black border border-[rgb(163,255,18)] px-1.5 py-0.5 text-[9px] font-black text-[rgb(163,255,18)]">
                {mockProfile.level}
              </div>
            </div>
            {/* Name + XP */}
            <div>
              <p className="text-xs font-black text-white tracking-wider">{mockProfile.username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-0.5 w-16 bg-white/10">
                  <div className="h-full bg-[rgb(163,255,18)]" style={{ width: `${xpProgress}%` }} />
                </div>
                <span className="text-[9px] text-white/30 font-mono">{mockProfile.currentXP}/{mockProfile.nextLevelXP}</span>
              </div>
            </div>
          </div>

          {/* Live Stats - Aggressive Typography */}
          <div className="flex items-center gap-8">
            {mockProfile.liveStats.map((stat, i) => (
              <div key={i} className="text-right">
                <p className="text-[9px] text-white/30 font-black tracking-widest mb-0.5">{stat.label}</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <p className="text-sm font-black text-white tracking-tight">{stat.value}</p>
                  {stat.change && <span className="text-[9px] text-[rgb(163,255,18)] font-black">↑{stat.change}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-8 pt-24 pb-16">

        {/* DOMINANT TOURNAMENT CARD - Hard edges, aggressive layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 via-[rgb(163,255,18)] to-yellow-500 opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />

          <div className="relative bg-black border-2 border-yellow-500">
            {/* Diagonal corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent clip-triangle" />

            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Left: Rank Badge + Info */}
                <div className="flex items-start gap-6">
                  {/* MASSIVE RANK */}
                  <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-yellow-500 to-orange-600 flex flex-col items-center justify-center clip-hex">
                      <Trophy className="w-8 h-8 text-black mb-1" />
                      <div className="text-3xl font-black text-black tracking-tighter">#{t.rank}</div>
                    </div>
                    {t.status === "leading" && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[9px] font-black px-2 py-1 clip-corner">
                        TOP 10
                      </div>
                    )}
                  </div>

                  {/* Tournament Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 animate-pulse" />
                      <span className="text-xs font-black text-yellow-500 tracking-widest">ACTIVE</span>
                    </div>

                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight leading-none">{t.name}</h2>
                    <p className="text-lg text-white/60 mb-5 font-bold">
                      RANK <span className="text-yellow-500">#{t.rank}</span> / {t.total.toLocaleString()}
                    </p>

                    {/* Stats Grid */}
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-white/40 font-black tracking-wider mb-1">PRIZE</p>
                        <p className="text-2xl font-black text-yellow-500 tracking-tight">{t.prize}</p>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <div>
                        <p className="text-xs text-white/40 font-black tracking-wider mb-1">ENDS</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500" />
                          <p className="text-lg font-black text-white">{t.endsIn}</p>
                        </div>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <div>
                        <p className="text-xs text-white/40 font-black tracking-wider mb-1">PROGRESS</p>
                        <p className="text-2xl font-black text-[rgb(163,255,18)]">{t.progress}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: CTA */}
                <button className="group/btn relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 blur-lg opacity-50 group-hover/btn:opacity-75 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 px-8 py-5 flex items-center gap-3 clip-corner-lg hover:scale-105 transition-transform">
                    <div className="text-left">
                      <p className="text-xs font-black text-black/80 tracking-widest">CONTINUE</p>
                      <p className="text-xl font-black text-black tracking-tight">PLAYING</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-black" />
                  </div>
                </button>
              </div>

              {/* Progress Bar - Sharp */}
              <div className="relative h-2 bg-white/5 mt-6">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-orange-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${t.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[rgb(163,255,18)] animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* TWO COLUMN LAYOUT */}
        <div className="flex gap-4">

          {/* LEFT COLUMN - Watchlist + Opportunities */}
          <div className="flex-1 space-y-4">

            {/* WATCHLIST - Latest additions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[rgb(163,255,18)]" />
                  <h3 className="text-xs font-black text-white/40 tracking-widest">WATCHLIST</h3>
                </div>
                <button
                  onClick={() => router.push('/lists')}
                  className="text-xs font-black text-[rgb(163,255,18)] hover:text-[rgb(163,255,18)]/80 transition-colors flex items-center gap-1"
                >
                  SHOW ALL
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black border border-white/10 p-4">
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
                  <div className="grid grid-cols-3 gap-3">
                    {watchlistItems.map((item, i) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative text-left"
                        onClick={() => {
                          // Navigate based on item type
                          if (item.itemType === 'launchpad' || item.itemType === 'collection') {
                            router.push(`/launchpad/${item.itemId}`);
                          } else if (item.itemType === 'nft') {
                            router.push(`/marketplace/nft/${item.itemId}`);
                          }
                        }}
                      >
                        <div className="relative bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden hover:border-[rgb(163,255,18)]/50 transition-all duration-300">
                          {/* Image Section */}
                          <div className="relative aspect-square overflow-hidden bg-black/60 backdrop-blur-sm">
                            <img
                              src={item.metadata?.image || '/api/placeholder/200/200'}
                              alt={item.metadata?.name || 'Watchlist item'}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                            {/* Type Badge */}
                            <div className="absolute top-2 right-2">
                              <div className="text-[9px] font-black px-1.5 py-0.5 border border-[rgb(163,255,18)]/50 bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] backdrop-blur-sm">
                                {item.itemType.toUpperCase()}
                              </div>
                            </div>

                            {/* Bottom Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <h3 className="text-white font-semibold text-xs truncate">{item.metadata?.name || 'Unknown'}</h3>
                              {item.metadata?.symbol && (
                                <p className="text-zinc-400 text-[10px]">{item.metadata.symbol}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* OPPORTUNITIES - Horizontal, Sharp */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-[rgb(163,255,18)]" />
                <h3 className="text-xs font-black text-white/40 tracking-widest">OPPORTUNITIES</h3>
              </div>

              <div className="flex gap-3">
                {mockProfile.opportunities.map((opp, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className={cn(
                      "flex-1 text-left p-4 bg-black border-2 transition-all hover:scale-[1.02]",
                      opp.urgency ? "border-[rgb(163,255,18)]" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    {opp.urgency && <div className="w-1.5 h-1.5 bg-[rgb(163,255,18)] mb-2 animate-pulse" />}
                    <p className={cn("text-sm font-black mb-1 tracking-tight", opp.urgency ? "text-[rgb(163,255,18)]" : "text-white")}>
                      {opp.title}
                    </p>
                    <p className="text-xs text-white/40 font-bold tracking-wide mb-3">{opp.subtitle}</p>
                    <div className={cn("text-xs font-black tracking-widest flex items-center gap-1", opp.urgency ? "text-[rgb(163,255,18)]" : "text-white/60")}>
                      ACT NOW
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* NFT COLLECTION & FAVORITE GAMES - Side by side */}
            <div className="flex gap-4">
              {/* NFT COLLECTION */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-[rgb(163,255,18)]" />
                  <h3 className="text-xs font-black text-white/40 tracking-widest">NFT COLLECTION</h3>
                </div>

                <div className="bg-black border border-white/10 p-4">
                  <div className="grid grid-cols-2 gap-3">
                  {mockProfile.nftCollection.map((nft, i) => (
                    <motion.button
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="group relative text-left"
                    >
                      <div className="relative bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-black/60 backdrop-blur-sm">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                          {/* Rarity Badge */}
                          <div className="absolute top-3 right-3">
                            <div className={cn(
                              "text-xs font-black px-2 py-1 border backdrop-blur-sm",
                              nft.rarity === "Legendary" && "text-yellow-500 border-yellow-500/50 bg-yellow-500/10",
                              nft.rarity === "Epic" && "text-purple-500 border-purple-500/50 bg-purple-500/10",
                              nft.rarity === "Rare" && "text-blue-500 border-blue-500/50 bg-blue-500/10"
                            )}>
                              {nft.rarity.toUpperCase()}
                            </div>
                          </div>

                          {/* Bottom Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-base">{nft.name}</h3>
                            <p className="text-zinc-400 text-sm">{nft.collection}</p>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/5">
                              <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                                <Hash className="w-3 h-3" />
                                <span className="text-xs">Rank</span>
                              </div>
                              <p className="text-white font-medium text-sm">#{nft.rank}</p>
                            </div>

                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/5">
                              <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                                <Sparkles className="w-3 h-3" />
                                <span className="text-xs">Traits</span>
                              </div>
                              <p className="text-white font-medium text-sm">{nft.traits}</p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Last Price</span>
                              <span className="text-sm font-black text-[rgb(163,255,18)]">{nft.lastPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  </div>
                </div>
              </div>

              {/* FAVORITE GAMES */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-black text-white/40 tracking-widest">FAVORITE GAMES</h3>
                </div>

                <div className="bg-black border border-white/10 p-4">
                  <div className="grid grid-cols-2 gap-3">
                  {mockProfile.favoriteGames.map((game, i) => (
                    <motion.button
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="group relative text-left"
                    >
                      <div className="relative bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-black/60 backdrop-blur-sm">
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            {game.status === "online" && (
                              <div className="bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50 border text-[rgb(163,255,18)] backdrop-blur-sm text-xs font-black px-2 py-1 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[rgb(163,255,18)] animate-pulse" />
                                LIVE
                              </div>
                            )}
                          </div>

                          {/* Bottom Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-base">{game.name}</h3>
                            <p className="text-zinc-400 text-sm">{game.plays} plays</p>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/5">
                              <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                                <Trophy className="w-3 h-3" />
                                <span className="text-xs">Win Rate</span>
                              </div>
                              <p className={cn(
                                "font-medium text-sm",
                                game.winRate >= 80 ? "text-[rgb(163,255,18)]" : game.winRate >= 70 ? "text-yellow-500" : "text-white"
                              )}>{game.winRate}%</p>
                            </div>

                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-white/5">
                              <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                                <Target className="w-3 h-3" />
                                <span className="text-xs">Wins</span>
                              </div>
                              <p className="text-white font-medium text-sm">{game.wins}</p>
                            </div>
                          </div>

                          {/* Play Button */}
                          <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">Ready to play</span>
                              <span className="text-sm font-black text-purple-500 flex items-center gap-1">
                                PLAY NOW
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Activity Feed */}
          <div className="w-80">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-black text-white/40 tracking-widest">RECENT ACTIVITY</h3>
            </div>

            <div className="space-y-2">
              {mockProfile.recentActivity.map((act, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-black border border-white/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-[rgb(163,255,18)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-black tracking-wide leading-tight">{act.text}</p>
                      <p className="text-xs text-white/30 font-mono mt-1.5">{act.time} AGO</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .clip-hex {
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
        }
        .clip-corner {
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
        }
        .clip-corner-lg {
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
        }
        .clip-triangle {
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}