"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { useWalletAuthOptimized } from "@/hooks/use-wallet-auth-optimized";
import {
  X,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Send,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { IntegratedTradeHistory } from "@/components/p2p/integrated-trade-history";
import { TradeDetailModal } from "@/components/p2p/trade-detail-modal";
import { MediaRenderer } from "@/components/media-renderer";

type P2PViewProps = {
  setViewMode: (mode: string) => void;
};

export function P2PView({ setViewMode: _ }: P2PViewProps) {
  const { user } = useWalletAuthOptimized();
  const address = user?.walletAddress;

  const {
    userBoardNFTs,
    traderBoardNFTs,
    removeUserNFTFromBoard,
    removeTraderNFTFromBoard,
    loadTradeIntoBoard,
    loadedTrade,
    boardHistoryIndex,
    navigateBoardHistory,
    isViewingHistory,
    selectedTrader,
    clearAllSelections,
    activeTradeId,
    clearActiveTradeId
  } = useP2PTrading();

  const [activeTab, setActiveTab] = useState<'trade' | 'history'>('trade');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [refreshHistoryKey, setRefreshHistoryKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // History filters
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Calculate fairness score
  const calculateFairnessScore = () => {
    const userValue = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
    const traderValue = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);

    if (userValue === 0 && traderValue === 0) return 0;
    if (userValue === 0 || traderValue === 0) return 0;

    const ratio = Math.min(userValue, traderValue) / Math.max(userValue, traderValue);
    return Math.round(ratio * 100);
  };

  const fairnessScore = calculateFairnessScore();
  const userTotal = userBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);
  const traderTotal = traderBoardNFTs.reduce((sum, nft) => sum + nft.value, 0);

  // Helper function to extract real NFT ID
  const extractRealNFTId = (id: string): string => {
    if (id.startsWith('user-') || id.startsWith('trader-')) {
      const parts = id.split('-');
      return parts.slice(1, -1).join('-');
    }
    return id;
  };

  // Send trade offer
  const sendOffer = async () => {
    if (!address || !selectedTrader) return;

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = activeTradeId ? `/api/p2p/trades/${activeTradeId}` : '/api/p2p/trades';
      const method = activeTradeId ? 'PUT' : 'POST';

      const body = activeTradeId ? {
        action: 'counteroffer',
        userAddress: address,
        items: [
          ...userBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'INITIATOR',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          })),
          ...traderBoardNFTs.map(nft => ({
            nftId: extractRealNFTId(nft.id),
            side: 'COUNTERPARTY',
            tokenAmount: nft.value,
            metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
          }))
        ],
        message
      } : {
        initiatorAddress: address,
        counterpartyAddress: selectedTrader.walletAddress,
        initiatorItems: userBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'INITIATOR',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        counterpartyItems: traderBoardNFTs.map(nft => ({
          nftId: extractRealNFTId(nft.id),
          side: 'COUNTERPARTY',
          tokenAmount: nft.value,
          metadata: { name: nft.name, image: nft.image, rarity: nft.rarity }
        })),
        metadata: {
          message,
          fairnessScore,
          createdAt: new Date().toISOString()
        }
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(activeTradeId ? 'Counter-offer sent!' : 'Trade offer sent!');
        clearAllSelections();
        setMessage("");
        if (activeTradeId) clearActiveTradeId();

        // Show in history
        setRefreshHistoryKey(prev => prev + 1);
        setActiveTab('history');
        setSelectedTradeId(data.data.id);

        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      setError('Failed to send trade offer');
    } finally {
      setIsCreating(false);
    }
  };

  const canSendOffer = userBoardNFTs.length > 0 && selectedTrader && !isCreating && !isViewingHistory;

  return (
    <div className="h-screen relative px-6 pt-20 pb-8 flex flex-col">
      {/* Main Trading Board Container */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1">
        {/* Header with Integrated Tab Controls and Actions */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {activeTab === 'trade' ? (
                  <motion.div
                    key="trade-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    {/* Fairness Indicator */}
                    {fairnessScore > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full",
                          fairnessScore >= 80 ? "bg-green-500/20" :
                          fairnessScore >= 60 ? "bg-yellow-500/20" :
                          "bg-red-500/20"
                        )}
                      >
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          fairnessScore >= 80 ? "text-green-400" :
                          fairnessScore >= 60 ? "text-yellow-400" :
                          "text-red-400"
                        )}>
                          {fairnessScore}% Fair
                        </span>
                      </motion.div>
                    )}

                    {/* Value Comparison */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">You:</span>
                        <span className="text-[rgb(163,255,18)] font-mono font-medium">
                          {userTotal.toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="w-px h-4 bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">Them:</span>
                        <span className="text-purple-400 font-mono font-medium">
                          {traderTotal.toFixed(4)} ETH
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="history-filters"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {/* Quick Filters */}
                    <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                      {(['all', 'active', 'completed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setViewFilter(filter)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-all",
                            viewFilter === filter
                              ? "bg-white text-black shadow-lg"
                              : "text-white/60 hover:text-white"
                          )}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <Input
                      placeholder="Search trades..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-48 h-8 bg-black/60 border-white/20 text-white text-xs placeholder:text-white/40"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-2">
              {/* Tab Buttons */}
              <div className="flex gap-1 bg-black/60 rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'trade'
                      ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/30"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Trade
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'history'
                      ? "bg-white text-black shadow-lg"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  History
                  {loadedTrade && (
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* History Navigation - Only show on trade tab when viewing loaded trade */}
          {activeTab === 'trade' && loadedTrade && loadedTrade.history && loadedTrade.history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  isViewingHistory
                    ? "bg-orange-500/20 text-orange-300"
                    : "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]"
                )}>
                  {isViewingHistory
                    ? `Viewing: Version ${boardHistoryIndex + 1} of ${loadedTrade.history.length}`
                    : 'Current State'}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBoardHistory('prev')}
                    disabled={boardHistoryIndex === 0}
                    className="h-7 w-7 p-0 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateBoardHistory('next')}
                    disabled={boardHistoryIndex === -1}
                    className="h-7 w-7 p-0 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tab Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'trade' ? (
              <motion.div
                key="trade"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Trading Boards - Side by Side with Separation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Your Side Section */}
                  <div className="p-6 bg-black/20 rounded-xl border border-[rgb(163,255,18)]/10">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full" />
                        Your Offer
                      </h3>
                      <span className="text-xs text-[rgb(163,255,18)]/60">{userBoardNFTs.length}/6 items</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {userBoardNFTs.map((nft) => (
                        <motion.div
                          key={`user-${nft.id}`}
                          layout
                          initial={{
                            opacity: 0,
                            scale: 0.5,
                            x: -200,
                            rotateY: -90
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            rotateY: 0
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            x: -200,
                            rotateY: 90
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                          whileHover={{ scale: 1.05, z: 10 }}
                          className="relative group aspect-square"
                        >
                          <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-[rgb(163,255,18)]/50 transition-all">
                            {!isViewingHistory && (
                              <button
                                onClick={() => removeUserNFTFromBoard(nft.id)}
                                className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            )}
                            <MediaRenderer
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                              <p className="text-[10px] text-white truncate">{nft.name}</p>
                              <p className="text-[10px] text-[rgb(163,255,18)]/80 font-mono">
                                {nft.value.toFixed(3)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                      {/* Empty slots */}
                      {userBoardNFTs.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center">
                          <div className="text-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[rgb(163,255,18)]/20 to-transparent"
                            />
                            <p className="text-white/40 text-xs">Select NFTs from sidebar</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Their Side Section */}
                  <div className="p-6 bg-black/20 rounded-xl border border-purple-500/10">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Their Offer
                      </h3>
                      <span className="text-xs text-purple-400/60">{traderBoardNFTs.length}/6 items</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                    <AnimatePresence mode="popLayout">
                      {traderBoardNFTs.map((nft) => (
                        <motion.div
                          key={`trader-${nft.id}`}
                          layout
                          initial={{
                            opacity: 0,
                            scale: 0.5,
                            x: 200,
                            rotateY: 90
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            rotateY: 0
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            x: 200,
                            rotateY: -90
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                          whileHover={{ scale: 1.05, z: 10 }}
                          className="relative group aspect-square"
                        >
                          <div className="relative h-full bg-black/40 rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all">
                            {!isViewingHistory && (
                              <button
                                onClick={() => removeTraderNFTFromBoard(nft.id)}
                                className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            )}
                            <MediaRenderer
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black to-transparent">
                              <p className="text-[10px] text-white truncate">{nft.name}</p>
                              <p className="text-[10px] text-purple-400/80 font-mono">
                                {nft.value.toFixed(3)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                      {/* Empty slots */}
                      {traderBoardNFTs.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center">
                          <div className="text-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                              className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-transparent"
                            />
                            <p className="text-white/40 text-xs">Trader's NFTs</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <IntegratedTradeHistory
                key={refreshHistoryKey}
                searchQuery={searchQuery}
                viewFilter={viewFilter}
                onTradeSelect={(trade) => {
                  setSelectedTradeId(trade.id);
                }}
                onLoadTrade={(trade) => {
                  loadTradeIntoBoard(trade);
                  setActiveTab('trade');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Input Footer - Fixed at Bottom, Only show on trade tab */}
      {activeTab === 'trade' && (
        <div className="p-6 border-t border-white/10 bg-black/60">
          {selectedTrader && (
            <div className="mb-3">
              <p className="text-xs text-white/60">Trading with <span className="text-white font-medium">{selectedTrader.name}</span></p>
            </div>
          )}
          <div className="flex items-stretch gap-3">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to your trade offer (optional)..."
                className="w-full bg-black/40 border-white/20 text-white placeholder:text-white/40 resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && canSendOffer) {
                    e.preventDefault();
                    sendOffer();
                  }
                }}
              />
              {message.length > 0 && (
                <p className="mt-1 text-xs text-white/40">{message.length} characters</p>
              )}
            </div>
            {/* Send Offer Button */}
            <Button
              onClick={sendOffer}
              disabled={!canSendOffer}
              className={cn(
                "self-stretch px-6 transition-all min-w-[140px]",
                canSendOffer
                  ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-500 text-black hover:shadow-lg hover:shadow-[rgb(163,255,18)]/30"
                  : "bg-white/10 text-white/40"
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {activeTradeId ? 'Send Counter-Offer' : 'Send Offer'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>

      {/* Alerts and Tips - Below Board */}
      {activeTab === 'trade' && (
        <div className="mt-6 space-y-3">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-sm text-red-400 flex-1">{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400 flex-1">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Smart Tips Based on Context */}
          {userBoardNFTs.length === 0 && traderBoardNFTs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-1">Getting Started</h4>
                  <p className="text-xs text-white/60">
                    Select NFTs from the sidebar to start building your trade. Both sides need items for a fair trade.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {fairnessScore > 0 && fairnessScore < 60 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-1">Unbalanced Trade</h4>
                  <p className="text-xs text-white/60">
                    This trade has a low fairness score. Consider adjusting the items to make it more balanced.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Trade Detail Modal */}
      <AnimatePresence>
        {selectedTradeId && (
          <TradeDetailModal
            tradeId={selectedTradeId}
            isOpen={true}
            onClose={() => setSelectedTradeId(null)}
            onTradeUpdate={() => {
              setRefreshHistoryKey(prev => prev + 1);
            }}
            onCounterOffer={(trade) => {
              loadTradeIntoBoard(trade);
              setActiveTab('trade');
              setSelectedTradeId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}