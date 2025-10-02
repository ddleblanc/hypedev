"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft,
  Search,
  Users,
  User,
  Package,
  Star,
  TrendingUp,
  CheckCircle2,
  Plus,
  Minus,
  Filter,
  SlidersHorizontal,
  ArrowRightLeft,
  X,
  Trophy,
  Sword,
  Target,
  Zap,
  Crown,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Trader } from "@/contexts/p2p-trading-context";
import { useConditionalP2P } from "@/hooks/use-conditional-p2p";

interface RightAnimatedSidebarProps {
  show: boolean;
  currentRoute?: string;
  p2pData?: {
    activeOffers: number;
    pendingTrades: number;
    totalVolume: string;
    successRate: number;
    trustScore: number;
  };
  oneVsOneData?: {
    onlineOpponents: number;
    activeMatches: number;
    rankPoints: number;
    winRate: number;
    currentRank: string;
  };
  museumData?: {
    items: Array<{
      id: string;
      title: string;
      subtitle: string;
      thumbnail: string;
      introVideo: string;
    }>;
    onItemClick: (item: any) => void;
  };
}

// Mock 1v1 players data
interface OneVsOnePlayer {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  rating: number;
  wins: number;
  losses: number;
  winRate: number;
  isOnline: boolean;
  gameMode: string;
  streak: number;
}

const mock1v1Players: OneVsOnePlayer[] = [
  {
    id: '1',
    name: 'DuelMaster',
    avatar: 'https://picsum.photos/40/40?random=301',
    rank: 'GRANDMASTER',
    rating: 2847,
    wins: 423,
    losses: 28,
    winRate: 93.8,
    isOnline: true,
    gameMode: 'Ranked',
    streak: 12
  },
  {
    id: '2',
    name: 'ShadowSlayer',
    avatar: 'https://picsum.photos/40/40?random=302',
    rank: 'MASTER',
    rating: 2156,
    wins: 287,
    losses: 41,
    winRate: 87.5,
    isOnline: true,
    gameMode: 'Casual',
    streak: 7
  },
  {
    id: '3',
    name: 'QuickStrike',
    avatar: 'https://picsum.photos/40/40?random=303',
    rank: 'DIAMOND',
    rating: 1923,
    wins: 198,
    losses: 42,
    winRate: 82.5,
    isOnline: false,
    gameMode: 'Ranked',
    streak: 3
  }
];

// Mock leaderboard data
const mockLeaderboard: OneVsOnePlayer[] = [
  {
    id: 'l1',
    name: 'ChampionX',
    avatar: 'https://picsum.photos/40/40?random=401',
    rank: 'LEGEND',
    rating: 3245,
    wins: 892,
    losses: 23,
    winRate: 97.5,
    isOnline: true,
    gameMode: 'Ranked',
    streak: 45
  },
  {
    id: 'l2',
    name: 'Unstoppable',
    avatar: 'https://picsum.photos/40/40?random=402',
    rank: 'GRANDMASTER',
    rating: 3102,
    wins: 678,
    losses: 34,
    winRate: 95.2,
    isOnline: false,
    gameMode: 'Ranked',
    streak: 28
  },
  {
    id: 'l3',
    name: 'DuelKing',
    avatar: 'https://picsum.photos/40/40?random=403',
    rank: 'GRANDMASTER',
    rating: 2987,
    wins: 543,
    losses: 41,
    winRate: 93.0,
    isOnline: true,
    gameMode: 'Ranked',
    streak: 15
  }
];

// Mock traders data
const mockTraders: Trader[] = [
  { 
    id: '1', 
    name: 'CryptoKing', 
    avatar: 'https://picsum.photos/40/40?random=201',
    rating: 4.9,
    trades: 2847,
    successRate: 94.2,
    isOnline: true,
    tier: 'DIAMOND'
  },
  { 
    id: '2', 
    name: 'NFTWhale', 
    avatar: 'https://picsum.photos/40/40?random=202',
    rating: 4.7,
    trades: 1923,
    successRate: 87.5,
    isOnline: true,
    tier: 'GOLD'
  },
  { 
    id: '3', 
    name: 'DigitalTrader', 
    avatar: 'https://picsum.photos/40/40?random=203',
    rating: 4.5,
    trades: 1456,
    successRate: 82.1,
    isOnline: false,
    tier: 'SILVER'
  }
];

// Mock trader NFTs
const mockTraderNFTs = [
  { id: 't1', name: 'Mystic Wolf #234', image: 'https://picsum.photos/80/80?random=801', value: 3.1, rarity: 'LEGENDARY', selected: false },
  { id: 't2', name: 'Golden Eagle #567', image: 'https://picsum.photos/80/80?random=802', value: 2.4, rarity: 'EPIC', selected: false },
  { id: 't3', name: 'Diamond Snake #890', image: 'https://picsum.photos/80/80?random=803', value: 4.2, rarity: 'MYTHIC', selected: false },
  { id: 't4', name: 'Crystal Bear #123', image: 'https://picsum.photos/80/80?random=804', value: 1.9, rarity: 'RARE', selected: false },
  { id: 't5', name: 'Thunder Lion #456', image: 'https://picsum.photos/80/80?random=805', value: 5.8, rarity: 'MYTHIC', selected: false },
  { id: 't6', name: 'Frost Tiger #789', image: 'https://picsum.photos/80/80?random=806', value: 2.7, rarity: 'EPIC', selected: false },
  { id: 't7', name: 'Flame Fox #012', image: 'https://picsum.photos/80/80?random=807', value: 1.6, rarity: 'RARE', selected: false },
  { id: 't8', name: 'Ocean Shark #345', image: 'https://picsum.photos/80/80?random=808', value: 3.5, rarity: 'LEGENDARY', selected: false }
];

export function RightAnimatedSidebar({ show, currentRoute = 'p2p', p2pData, oneVsOneData, museumData }: RightAnimatedSidebarProps) {
  const isP2P = currentRoute === 'p2p';
  const { 
    selectedTrader, 
    traderNFTs, 
    selectTrader, 
    toggleTraderNFTSelection, 
    confirmTraderNFTs 
  } = useConditionalP2P(isP2P);
  
  const [searchMode, setSearchMode] = useState<'trader' | 'item'>('trader');
  const [searchQuery, setSearchQuery] = useState('');

  // 1v1 specific state
  const [oneVsOneMode, setOneVsOneMode] = useState<'players' | 'leaderboard'>('players');
  const [selectedPlayer, setSelectedPlayer] = useState<OneVsOnePlayer | null>(null);

  // Museum specific state
  const [hoveredMuseumItem, setHoveredMuseumItem] = useState<string | null>(null);

  const isOneVsOne = currentRoute === 'play-1v1';

  const handleTraderSelect = (trader: Trader) => {
    selectTrader(trader);
  };

  const clearSelection = () => {
    selectTrader(null);
    setSelectedPlayer(null);
  };

  const handlePlayerSelect = (player: OneVsOnePlayer) => {
    setSelectedPlayer(player);
  };

  const challengePlayer = () => {
    if (selectedPlayer) {
      // TODO: Implement challenge logic
      console.log('Challenging player:', selectedPlayer.name);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: currentRoute === 'museum' ? '100%' : 320, opacity: currentRoute === 'museum' ? 1 : 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: currentRoute === 'museum' ? '100%' : 320, opacity: currentRoute === 'museum' ? 1 : 0 }}
          transition={
            currentRoute === 'museum'
              ? { duration: 3.6, ease: [0.6, 0.05, 0.01, 0.9] } // Slow cinematic animation for museum
              : {
                  type: "spring",
                  stiffness: 260,
                  damping: 30,
                  duration: 0.4
                }
          }
          className={`fixed right-0 top-0 bottom-0 ${currentRoute === 'museum' ? 'w-1/2' : 'top-16 bottom-[44.6px] w-80'} bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {selectedTrader || selectedPlayer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedTrader?.avatar || selectedPlayer?.avatar || ''} 
                      alt={selectedTrader?.name || selectedPlayer?.name || ''}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedTrader?.name || selectedPlayer?.name}
                        {(selectedTrader?.isOnline || selectedPlayer?.isOnline) && (
                          <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                        )}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {selectedTrader ? (
                            <>
                              <Star className="w-3 h-3 text-[rgb(163,255,18)]" />
                              <span className="text-xs text-[rgb(163,255,18)]">{selectedTrader.rating}</span>
                            </>
                          ) : (
                            <>
                              <Trophy className="w-3 h-3 text-[rgb(163,255,18)]" />
                              <span className="text-xs text-[rgb(163,255,18)]">{selectedPlayer?.rating}</span>
                            </>
                          )}
                        </div>
                        <Badge className={`text-[10px] ${
                          isOneVsOne ? (
                            selectedPlayer?.rank === 'LEGEND' ? 'bg-purple-500/20 text-purple-400' :
                            selectedPlayer?.rank === 'GRANDMASTER' ? 'bg-red-500/20 text-red-400' :
                            selectedPlayer?.rank === 'MASTER' ? 'bg-orange-500/20 text-orange-400' :
                            selectedPlayer?.rank === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          ) : (
                            selectedTrader?.tier === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                            selectedTrader?.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          )
                        }`}>
                          {selectedTrader?.tier || selectedPlayer?.rank}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {currentRoute === 'museum' ? (
                    <>
                      <h2 className="text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                        GAMING
                      </h2>
                      <p className="text-[#00ff88] text-sm md:text-base font-light">
                        Enter the Arena
                      </p>
                    </>
                  ) : isOneVsOne ? (
                    <>
                      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Sword className="h-5 w-5 text-[rgb(163,255,18)]" />
                        Find Opponent
                      </h2>
                      <p className="text-sm text-white/60">Challenge players or view leaderboard</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-[rgb(163,255,18)]" />
                        Find Trader
                      </h2>
                      <p className="text-sm text-white/60">Search by trader or item</p>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentRoute === 'museum' && museumData ? (
              <>
                {/* Museum GAMING Items - Netflix Style Banners */}
                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-2 gap-4">
                    {museumData.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="relative group cursor-pointer"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredMuseumItem(item.id)}
                        onMouseLeave={() => setHoveredMuseumItem(null)}
                        onClick={() => museumData.onItemClick(item)}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                          {/* Title Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-lg font-bold text-white mb-1 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-white/70">{item.subtitle}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : selectedTrader || selectedPlayer ? (
              <>
                {/* Stats Section */}
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white/80 mb-4">
                    {selectedTrader ? 'TRADER STATS' : 'PLAYER STATS'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTrader ? (
                      <>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Total Trades</div>
                          <div className="text-lg font-bold text-white">{selectedTrader.trades}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Success Rate</div>
                          <div className="text-lg font-bold text-[rgb(163,255,18)]">{selectedTrader.successRate}%</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Wins</div>
                          <div className="text-lg font-bold text-white">{selectedPlayer?.wins}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Win Rate</div>
                          <div className="text-lg font-bold text-[rgb(163,255,18)]">{selectedPlayer?.winRate}%</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Current Streak</div>
                          <div className="text-lg font-bold text-orange-400">{selectedPlayer?.streak}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-xs text-white/60">Game Mode</div>
                          <div className="text-lg font-bold text-cyan-400">{selectedPlayer?.gameMode}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedTrader ? (
                  /* Trader's NFT Collection */
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white/80">
                        AVAILABLE NFTS ({traderNFTs.length})
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 border-white/20 text-white/70 hover:bg-white/10"
                        >
                          <Filter className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 border-white/20 text-white/70 hover:bg-white/10"
                        >
                          <SlidersHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* NFT List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      <AnimatePresence mode="popLayout">
                        {traderNFTs.map((nft, index) => (
                          <motion.div
                            key={nft.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              scale: 0.5,
                              x: -400,
                              transition: { duration: 0.4, ease: "easeIn" }
                            }}
                            transition={{ delay: 0.05 * index }}
                            className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                            onClick={() => toggleTraderNFTSelection(nft.id)}
                          >
                          <div className="relative">
                            <img 
                              src={nft.image} 
                              alt={nft.name} 
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            {nft.selected && (
                              <div className="absolute inset-0 bg-[rgb(163,255,18)]/20 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-[rgb(163,255,18)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[rgb(163,255,18)] font-mono">{nft.value} ETH</span>
                              {nft.rarity && (
                                <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  {nft.rarity}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {nft.selected ? (
                              <Minus className="h-4 w-4 text-red-400" />
                            ) : (
                              <Plus className="h-4 w-4 text-[rgb(163,255,18)]" />
                            )}
                          </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Trade Summary */}
                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Their NFTs</span>
                          <span className="text-sm font-bold text-white">{traderNFTs.filter(nft => nft.selected).length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">Total Value</span>
                          <span className="text-sm font-bold text-[rgb(163,255,18)]">
                            {traderNFTs
                              .filter(nft => nft.selected)
                              .reduce((sum, nft) => sum + nft.value, 0)
                              .toFixed(1)} ETH
                          </span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold"
                        disabled={traderNFTs.filter(nft => nft.selected).length === 0}
                        onClick={confirmTraderNFTs}
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        {traderNFTs.filter(nft => nft.selected).length > 0 
                          ? `Confirm ${traderNFTs.filter(nft => nft.selected).length} NFTs` 
                          : 'Select NFTs First'
                        }
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 1v1 Challenge Section */
                  <div className="p-6">
                    <div className="text-center py-8">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                          <Sword className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[rgb(163,255,18)] rounded-full flex items-center justify-center">
                          <Flame className="w-4 h-4 text-black" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">
                        Challenge {selectedPlayer?.name}
                      </h3>
                      <p className="text-white/60 mb-6">
                        Ready to test your skills in an epic 1v1 duel?
                      </p>
                      
                      {/* Challenge Options */}
                      <div className="space-y-3 mb-6">
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-orange-400" />
                              <span className="text-white font-medium">Ranked Match</span>
                            </div>
                            <Badge className="bg-orange-500/20 text-orange-400">+/- 25 RP</Badge>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-cyan-400" />
                              <span className="text-white font-medium">Quick Match</span>
                            </div>
                            <Badge className="bg-cyan-500/20 text-cyan-400">Casual</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3"
                        onClick={challengePlayer}
                      >
                        <Sword className="w-5 h-5 mr-2" />
                        Send Challenge
                      </Button>
                      
                      <p className="text-xs text-white/40 mt-4">
                        Challenge will expire in 60 seconds
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Search Tabs */}
                <div className="p-6 border-b border-white/10">
                  {isOneVsOne ? (
                    <Tabs value={oneVsOneMode} onValueChange={(v) => setOneVsOneMode(v as 'players' | 'leaderboard')}>
                      <TabsList className="grid w-full grid-cols-2 bg-white/5">
                        <TabsTrigger value="players" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
                          <User className="w-4 h-4 mr-2" />
                          Players
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
                          <Trophy className="w-4 h-4 mr-2" />
                          Leaderboard
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  ) : (
                    <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'trader' | 'item')}>
                      <TabsList className="grid w-full grid-cols-2 bg-white/5">
                        <TabsTrigger value="trader" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
                          <User className="w-4 h-4 mr-2" />
                          By Trader
                        </TabsTrigger>
                        <TabsTrigger value="item" className="data-[state=active]:bg-[rgb(163,255,18)] data-[state=active]:text-black">
                          <Package className="w-4 h-4 mr-2" />
                          By Item
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                    <div className="mt-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          placeholder={isOneVsOne 
                            ? (oneVsOneMode === 'players' ? "Search players..." : "Search rankings...") 
                            : (searchMode === 'trader' ? "Search traders..." : "Search items...")
                          }
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-black/30 border-white/20 text-white placeholder:text-white/40 pl-10"
                        />
                      </div>
                    </div>
                </div>

                {/* Search Results */}
                <div className="p-6">
                  {isOneVsOne ? (
                    oneVsOneMode === 'players' ? (
                    <>
                      <h3 className="text-sm font-semibold text-white/80 mb-4">ONLINE PLAYERS</h3>
                      <div className="space-y-3">
                        {mock1v1Players.map((player, index) => (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Card 
                              className="bg-white/5 border-white/10 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => handlePlayerSelect(player)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img 
                                    src={player.avatar} 
                                    alt={player.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  {player.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[rgb(163,255,18)] rounded-full border-2 border-black" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">{player.name}</span>
                                    <Badge className={`text-[10px] ${
                                      player.rank === 'LEGEND' ? 'bg-purple-500/20 text-purple-400' :
                                      player.rank === 'GRANDMASTER' ? 'bg-red-500/20 text-red-400' :
                                      player.rank === 'MASTER' ? 'bg-orange-500/20 text-orange-400' :
                                      player.rank === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {player.rank}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1">
                                      <Trophy className="w-3 h-3 text-[rgb(163,255,18)]" />
                                      <span className="text-xs text-[rgb(163,255,18)]">{player.rating}</span>
                                    </div>
                                    <span className="text-xs text-white/60">{player.wins}W/{player.losses}L</span>
                                    <span className="text-xs text-white/60">{player.winRate}% WR</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </>
                    ) : (
                      /* Leaderboard Section */
                      <>
                        <h3 className="text-sm font-semibold text-white/80 mb-4">TOP DUELISTS</h3>
                        <div className="space-y-3">
                          {mockLeaderboard.map((player, index) => (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * index }}
                              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                            >
                              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded text-black font-bold text-sm">
                                #{index + 1}
                              </div>
                              <img 
                                src={player.avatar} 
                                alt={player.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white">{player.name}</span>
                                  <Badge className={`text-[10px] ${
                                    player.rank === 'LEGEND' ? 'bg-purple-500/20 text-purple-400' :
                                    player.rank === 'GRANDMASTER' ? 'bg-red-500/20 text-red-400' :
                                    'bg-orange-500/20 text-orange-400'
                                  }`}>
                                    {player.rank}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs text-yellow-400">{player.rating}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span className="text-xs text-orange-400">{player.streak}</span>
                                  </div>
                                </div>
                              </div>
                              {player.isOnline && (
                                <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )
                  ) : (
                    /* P2P Section */
                    searchMode === 'trader' ? (
                      <>
                        <h3 className="text-sm font-semibold text-white/80 mb-4">ONLINE TRADERS</h3>
                        <div className="space-y-3">
                          {mockTraders.map((trader, index) => (
                            <motion.div
                              key={trader.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <Card 
                                className="bg-white/5 border-white/10 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                                onClick={() => handleTraderSelect(trader)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img 
                                      src={trader.avatar} 
                                      alt={trader.name}
                                      className="w-10 h-10 rounded-full"
                                    />
                                    {trader.isOnline && (
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[rgb(163,255,18)] rounded-full border-2 border-black" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-white">{trader.name}</span>
                                      <Badge className={`text-[10px] ${
                                        trader.tier === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                                        trader.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-gray-500/20 text-gray-400'
                                      }`}>
                                        {trader.tier}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-[rgb(163,255,18)]" />
                                        <span className="text-xs text-[rgb(163,255,18)]">{trader.rating}</span>
                                      </div>
                                      <span className="text-xs text-white/60">{trader.trades} trades</span>
                                      <span className="text-xs text-white/60">{trader.successRate}% success</span>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-white/80 mb-4">SEARCH BY ITEM</h3>
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-sm text-white/40">
                            Enter an item name to find traders<br />who have it available
                          </p>
                        </div>
                      </>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <p className="text-xs text-white/40">
                {isOneVsOne ? (
                  `1v1 Dueling v1.0 | ${oneVsOneData?.onlineOpponents || 0} Online Opponents`
                ) : (
                  `P2P Trading v1.0 | ${p2pData?.activeOffers || 0} Active Offers`
                )}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}