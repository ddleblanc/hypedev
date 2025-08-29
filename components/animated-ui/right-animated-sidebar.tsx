"use client";

import React, { useState } from "react";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useP2PTrading, type Trader } from "@/contexts/p2p-trading-context";

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
}

// Mock traders data
const mockTraders = [
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

export function RightAnimatedSidebar({ show, currentRoute = 'p2p', p2pData }: RightAnimatedSidebarProps) {
  const { 
    selectedTrader, 
    traderNFTs, 
    selectTrader, 
    toggleTraderNFTSelection, 
    confirmTraderNFTs 
  } = useP2PTrading();
  
  const [searchMode, setSearchMode] = useState<'trader' | 'item'>('trader');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTraderSelect = (trader: Trader) => {
    selectTrader(trader);
  };

  const clearSelection = () => {
    selectTrader(null);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 30,
            duration: 0.4
          }}
          className="fixed right-0 top-16 bottom-[44.6px] w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 z-40 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {selectedTrader ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedTrader.avatar} 
                      alt={selectedTrader.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedTrader.name}
                        {selectedTrader.isOnline && (
                          <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                        )}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[rgb(163,255,18)]" />
                          <span className="text-xs text-[rgb(163,255,18)]">{selectedTrader.rating}</span>
                        </div>
                        <Badge className={`text-[10px] ${
                          selectedTrader.tier === 'DIAMOND' ? 'bg-blue-500/20 text-blue-400' :
                          selectedTrader.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {selectedTrader.tier}
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
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[rgb(163,255,18)]" />
                    Find Trader
                  </h2>
                  <p className="text-sm text-white/60">Search by trader or item</p>
                </>
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedTrader ? (
              <>
                {/* Trader Stats */}
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white/80 mb-4">TRADER STATS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Total Trades</div>
                      <div className="text-lg font-bold text-white">{selectedTrader.trades}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <div className="text-xs text-white/60">Success Rate</div>
                      <div className="text-lg font-bold text-[rgb(163,255,18)]">{selectedTrader.successRate}%</div>
                    </div>
                  </div>
                </div>

                {/* Trader's NFT Collection */}
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
                    {traderNFTs.map((nft, index) => (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
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
              </>
            ) : (
              <>
                {/* Search Tabs */}
                <div className="p-6 border-b border-white/10">
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

                    <div className="mt-4">
                      <Input
                        placeholder={searchMode === 'trader' ? "Search traders..." : "Search items..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
                        icon={<Search className="h-4 w-4 text-white/40" />}
                      />
                    </div>
                  </Tabs>
                </div>

                {/* Search Results */}
                <div className="p-6">
                  {searchMode === 'trader' ? (
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
                P2P Trading v1.0 | {p2pData?.activeOffers || 0} Active Offers
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}