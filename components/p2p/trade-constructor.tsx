"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownUp, 
  Plus, 
  Minus, 
  Coins, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaRenderer } from "@/components/MediaRenderer";

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  value: number;
}

interface TradeOffer {
  userNFTs: NFT[];
  userTokens: number;
  opponentNFTs: NFT[];
  opponentTokens: number;
  status: 'draft' | 'pending' | 'accepted' | 'rejected';
  fairnessScore: number;
}

// Mock data for demonstration
const MOCK_USER_NFTS: NFT[] = [
  { id: 'u1', name: 'Genesis Warrior #001', image: 'https://picsum.photos/300/300?random=201', collection: 'Genesis Warriors', rarity: 'Legendary', value: 12.5 },
  { id: 'u2', name: 'Quantum Beast #256', image: 'https://picsum.photos/300/300?random=202', collection: 'Quantum Beasts', rarity: 'Epic', value: 5.2 }
];

const MOCK_OPPONENT_NFTS: NFT[] = [
  { id: 'o1', name: 'Dragon King #777', image: 'https://picsum.photos/300/300?random=301', collection: 'Dragon Kings', rarity: 'Legendary', value: 18.3 },
];

export function TradeConstructor() {
  const [trade, setTrade] = useState<TradeOffer>({
    userNFTs: MOCK_USER_NFTS,
    userTokens: 2.5,
    opponentNFTs: MOCK_OPPONENT_NFTS,
    opponentTokens: 1.0,
    status: 'draft',
    fairnessScore: 0.85
  });

  const [tokenInput, setTokenInput] = useState(trade.userTokens.toString());

  const rarityColors = {
    'Common': 'bg-gray-500/20 text-gray-300 border-gray-500/40',
    'Rare': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    'Epic': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    'Legendary': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  };

  const userTotalValue = trade.userNFTs.reduce((sum, nft) => sum + nft.value, 0) + trade.userTokens;
  const opponentTotalValue = trade.opponentNFTs.reduce((sum, nft) => sum + nft.value, 0) + trade.opponentTokens;
  const valueDifference = Math.abs(userTotalValue - opponentTotalValue);
  const isUserAdvantaged = userTotalValue < opponentTotalValue;

  const getFairnessColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFairnessText = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Fair';
    return 'Unbalanced';
  };

  const handleTokenChange = (value: string) => {
    setTokenInput(value);
    const numValue = parseFloat(value) || 0;
    setTrade(prev => ({ ...prev, userTokens: numValue }));
  };

  const adjustTokens = (delta: number) => {
    const newValue = Math.max(0, trade.userTokens + delta);
    setTrade(prev => ({ ...prev, userTokens: newValue }));
    setTokenInput(newValue.toString());
  };

  return (
    <div className="h-full bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-2xl font-bold tracking-wide">TRADE CONSTRUCTOR</h2>
          <Badge 
            variant="outline"
            className={`${getFairnessColor(trade.fairnessScore)} border-current`}
          >
            {getFairnessText(trade.fairnessScore)} ({(trade.fairnessScore * 100).toFixed(0)}%)
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-[rgb(163,255,18)] text-sm font-bold mb-1">YOUR OFFER</div>
            <div className="text-white text-lg font-black">{userTotalValue.toFixed(6)} ETH</div>
            <div className="text-white/60 text-xs">{trade.userNFTs.length} NFTs + Tokens</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-purple-400 text-sm font-bold mb-1">THEIR OFFER</div>
            <div className="text-white text-lg font-black">{opponentTotalValue.toFixed(6)} ETH</div>
            <div className="text-white/60 text-xs">{trade.opponentNFTs.length} NFTs + Tokens</div>
          </div>
        </div>
      </div>

      {/* Trade Areas */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          
          {/* Your Offer Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[rgb(163,255,18)] font-bold text-lg">YOUR OFFER</h3>
              {isUserAdvantaged && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  GOOD DEAL
                </Badge>
              )}
            </div>

            {/* User NFTs */}
            <div className="space-y-2 mb-4">
              {trade.userNFTs.length === 0 ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <Plus className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60">Select NFTs from your collection</p>
                </div>
              ) : (
                trade.userNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-black/40 border-white/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          <MediaRenderer
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover rounded"
                            aspectRatio="square"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-sm truncate">{nft.name}</h4>
                          <p className="text-white/60 text-xs truncate">{nft.collection}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{nft.value} ETH</div>
                          <Badge className={`text-xs ${rarityColors[nft.rarity]}`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Token Input */}
            <div className="bg-black/40 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 font-medium">Additional Tokens (ETH)</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustTokens(-0.1)}
                    className="w-6 h-6 p-0 text-white/60 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustTokens(0.1)}
                    className="w-6 h-6 p-0 text-white/60 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <Input
                  type="number"
                  value={tokenInput}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  step="0.1"
                  min="0"
                />
                <span className="text-white/60 text-sm flex-shrink-0">ETH</span>
              </div>
            </div>
          </div>

          {/* Trade Direction Indicator */}
          <div className="flex items-center justify-center py-2">
            <div className="bg-black/40 rounded-full p-3">
              <ArrowDownUp className="w-6 h-6 text-white/60" />
            </div>
          </div>

          {/* Opponent's Offer Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-purple-400 font-bold text-lg">THEIR OFFER</h3>
              {!isUserAdvantaged && valueDifference > 1 && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-xs">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  REVIEW NEEDED
                </Badge>
              )}
            </div>

            {/* Opponent NFTs */}
            <div className="space-y-2 mb-4">
              {trade.opponentNFTs.length === 0 ? (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60">Waiting for their selection...</p>
                </div>
              ) : (
                trade.opponentNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-black/40 border-white/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0">
                          <MediaRenderer
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover rounded"
                            aspectRatio="square"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-sm truncate">{nft.name}</h4>
                          <p className="text-white/60 text-xs truncate">{nft.collection}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">{nft.value} ETH</div>
                          <Badge className={`text-xs ${rarityColors[nft.rarity]}`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Opponent Tokens */}
            {trade.opponentTokens > 0 && (
              <div className="bg-black/40 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">
                    {trade.opponentTokens} ETH
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* Value Analysis */}
          <div className="bg-black/40 rounded-lg p-4">
            <h4 className="text-white font-bold mb-3">TRADE ANALYSIS</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Value Difference:</span>
                <span className={`font-bold ${valueDifference > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {valueDifference.toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Fairness Score:</span>
                <span className={`font-bold ${getFairnessColor(trade.fairnessScore)}`}>
                  {(trade.fairnessScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Trade Benefit:</span>
                <span className={`font-bold ${isUserAdvantaged ? 'text-green-400' : 'text-purple-400'}`}>
                  {isUserAdvantaged ? 'Favorable' : 'Consider Terms'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-6 border-t border-white/10">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Clock className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold"
            disabled={trade.userNFTs.length === 0 && trade.userTokens === 0}
          >
            <Handshake className="w-4 h-4 mr-2" />
            Send Offer
          </Button>
        </div>
        
        {trade.fairnessScore < 0.7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-yellow-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Consider adjusting your offer for better fairness</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}