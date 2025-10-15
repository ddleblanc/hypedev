"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { X, History, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTradeConstructor } from "@/components/p2p/enhanced-trade-constructor";
import { TradeHistory } from "@/components/p2p/trade-history";
import { TradeDetailModal } from "@/components/p2p/trade-detail-modal";
import { MediaRenderer } from "@/components/media-renderer";

type P2PViewProps = {
  setViewMode: (mode: string) => void;
};

export function P2PView({ setViewMode }: P2PViewProps) {
  const {
    userBoardNFTs,
    traderBoardNFTs,
    removeUserNFTFromBoard,
    removeTraderNFTFromBoard,
    loadTradeIntoBoard,
    loadedTrade,
    boardHistoryIndex,
    navigateBoardHistory,
    isViewingHistory
  } = useP2PTrading();
  const [activeTab, setActiveTab] = useState("trade");
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col" style={{ perspective: '1000px' }}>
      {/* Header with Tabs */}
      <div className="p-6 pt-24 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Trade Board
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Trade History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="mt-6">
            {/* History Navigation Controls */}
            {loadedTrade && loadedTrade.history && loadedTrade.history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-center gap-4"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateBoardHistory('prev')}
                  disabled={boardHistoryIndex === 0}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  isViewingHistory
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    : "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
                )}>
                  {isViewingHistory
                    ? `History: Version ${boardHistoryIndex + 1} of ${loadedTrade.history.length}`
                    : 'Current State'}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateBoardHistory('next')}
                  disabled={boardHistoryIndex === -1}
                  className="bg-white/5 border-white/10 hover:bg-white/10"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-8 items-stretch h-[calc(100vh-200px)]">
              
              {/* User's Side (Left) */}
              <div className="relative flex">
                {/* Card Placement Area */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-[rgb(163,255,18)]/5 to-transparent rounded-2xl border border-[rgb(163,255,18)]/20 p-6 h-full flex-1 flex flex-col relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* NFT Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                    <AnimatePresence mode="popLayout">
                      {userBoardNFTs.map((nft) => (
                        <motion.div
                          key={`user-${nft.id}`}
                          layout
                          initial={{
                            opacity: 0,
                            scale: 0.3,
                            x: -450,
                            y: -100,
                            rotateY: -180
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            rotateY: 0
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.3,
                            x: -450,
                            y: -100,
                            rotateY: 180
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 22,
                            mass: 1.2,
                            rotateY: {
                              duration: 0.5,
                              ease: [0.43, 0.13, 0.23, 0.96]
                            }
                          }}
                          whileHover={{
                            scale: 1.05,
                            rotateY: 5,
                            z: 50,
                            transition: { duration: 0.2 }
                          }}
                          className="relative group"
                          style={{
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'center center'
                          }}
                        >
                          {/* Card Container */}
                          <div style={{ transformStyle: 'preserve-3d' }}>
                            {/* Card Front */}
                            <div 
                              className="relative"
                              style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(0deg)'
                              }}
                            >
                              {/* Card Glow Effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* NFT Card */}
                              <div className="relative bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[rgb(163,255,18)]/30 group-hover:border-[rgb(163,255,18)]/60 transition-all duration-300">
                                {/* Remove Button - disabled when viewing history */}
                                {!isViewingHistory && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeUserNFTFromBoard(nft.id)}
                                    className="absolute top-2 left-2 z-10 w-6 h-6 p-0 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </Button>
                                )}
                                
                                {/* Image */}
                                <div className="aspect-square relative overflow-hidden">
                                  <MediaRenderer
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                  />
                                  
                                  {/* Rarity Badge */}
                                  <div className={cn(
                                    "absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md",
                                    nft.rarity === 'MYTHIC' ? 'bg-purple-500/80 text-white' :
                                    nft.rarity === 'LEGENDARY' ? 'bg-orange-500/80 text-white' :
                                    nft.rarity === 'EPIC' ? 'bg-blue-500/80 text-white' :
                                    'bg-gray-500/80 text-white'
                                  )}>
                                    {nft.rarity}
                                  </div>
                                </div>
                                
                                {/* Card Info */}
                                <div className="p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
                                  <p className="text-white text-sm font-semibold truncate">{nft.name}</p>
                                  <p className="text-[rgb(163,255,18)] text-xs font-mono mt-1">{nft.value.toFixed(6)} ETH</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Back */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)] to-green-500 rounded-xl flex items-center justify-center"
                              style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                              }}
                            >
                              <div className="text-black font-black text-2xl">NFT</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Empty State */}
                  {userBoardNFTs.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-2xl border-2 border-dashed border-[rgb(163,255,18)]/20 flex items-center justify-center">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-16 h-16 rounded-lg bg-[rgb(163,255,18)]/10"
                          />
                        </div>
                        <p className="text-white/40 text-sm">Select NFTs from the sidebar</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Trader's Side (Right) */}
              <div className="relative flex">
                {/* Card Placement Area */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-bl from-purple-500/5 to-transparent rounded-2xl border border-purple-500/20 p-6 h-full flex-1 flex flex-col relative"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* NFT Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                    <AnimatePresence mode="popLayout">
                      {traderBoardNFTs.map((nft) => (
                        <motion.div
                          key={`trader-${nft.id}`}
                          layout
                          initial={{
                            opacity: 0,
                            scale: 0.3,
                            x: 450,
                            y: -100,
                            rotateY: 180
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: 0,
                            rotateY: 0
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.3,
                            x: 450,
                            y: -100,
                            rotateY: -180
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 22,
                            mass: 1.2,
                            rotateY: {
                              duration: 0.5,
                              ease: [0.43, 0.13, 0.23, 0.96]
                            }
                          }}
                          whileHover={{
                            scale: 1.05,
                            rotateY: -5,
                            z: 50,
                            transition: { duration: 0.2 }
                          }}
                          className="relative group"
                          style={{
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'center center'
                          }}
                        >
                          {/* Card Container */}
                          <div style={{ transformStyle: 'preserve-3d' }}>
                            {/* Card Front */}
                            <div 
                              className="relative"
                              style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(0deg)'
                              }}
                            >
                              {/* Card Glow Effect */}
                              <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* NFT Card */}
                              <div className="relative bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/30 group-hover:border-purple-500/60 transition-all duration-300">
                                {/* Remove Button - disabled when viewing history */}
                                {!isViewingHistory && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeTraderNFTFromBoard(nft.id)}
                                    className="absolute top-2 left-2 z-10 w-6 h-6 p-0 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </Button>
                                )}
                                
                                {/* Image */}
                                <div className="aspect-square relative overflow-hidden">
                                  <MediaRenderer
                                    src={nft.image}
                                    alt={nft.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                  />
                                  
                                  {/* Rarity Badge */}
                                  <div className={cn(
                                    "absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md",
                                    nft.rarity === 'MYTHIC' ? 'bg-purple-500/80 text-white' :
                                    nft.rarity === 'LEGENDARY' ? 'bg-orange-500/80 text-white' :
                                    nft.rarity === 'EPIC' ? 'bg-blue-500/80 text-white' :
                                    'bg-gray-500/80 text-white'
                                  )}>
                                    {nft.rarity}
                                  </div>
                                </div>
                                
                                {/* Card Info */}
                                <div className="p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
                                  <p className="text-white text-sm font-semibold truncate">{nft.name}</p>
                                  <p className="text-purple-400 text-xs font-mono mt-1">{nft.value.toFixed(6)} ETH</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Card Back */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
                              style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                              }}
                            >
                              <div className="text-white font-black text-2xl">NFT</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Empty State */}
                  {traderBoardNFTs.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-2xl border-2 border-dashed border-purple-500/20 flex items-center justify-center">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 1
                            }}
                            className="w-16 h-16 rounded-lg bg-purple-500/10"
                          />
                        </div>
                        <p className="text-white/40 text-sm">Trader's NFTs will appear here</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Trade Constructor */}
            <div className="mt-8">
              <EnhancedTradeConstructor
                onTradeCreated={(tradeId) => {
                  setSelectedTradeId(tradeId);
                  setActiveTab("history");
                }}
                onTradeUpdated={(tradeId) => {
                  setSelectedTradeId(tradeId);
                  setActiveTab("history");
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <TradeHistory 
              onTradeSelect={(trade) => setSelectedTradeId(trade.id)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Trade Detail Modal */}
      <TradeDetailModal
        tradeId={selectedTradeId}
        isOpen={!!selectedTradeId}
        onClose={() => setSelectedTradeId(null)}
        onTradeUpdate={() => {
          // Handle trade updates if needed
        }}
        onCounterOffer={(trade) => {
          loadTradeIntoBoard(trade);
          setActiveTab("trade");
          setSelectedTradeId(null);
        }}
      />
    </div>
  );
}