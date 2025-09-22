"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useP2PTrading } from "@/contexts/p2p-trading-context";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type P2PViewProps = {};

export function P2PView({}: P2PViewProps) {
  const { userBoardNFTs, traderBoardNFTs, removeUserNFTFromBoard, removeTraderNFTFromBoard } = useP2PTrading();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 pt-24">
      {/* Trading Board */}
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-2 gap-8 items-stretch">
          
          {/* User's Side (Left) */}
          <div className="relative flex">
            {/* Card Placement Area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-[rgb(163,255,18)]/5 to-transparent rounded-2xl border border-[rgb(163,255,18)]/20 p-6 min-h-[600px] flex-1 flex flex-col relative"
            >
              {/* NFT Grid */}
              <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                <AnimatePresence>
                  {userBoardNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ 
                        opacity: 0, 
                        scale: 0.8,
                        x: -200,
                        rotateY: -180
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: 0,
                        rotateY: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.8,
                        x: -200
                      }}
                      transition={{ 
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: 5,
                        z: 50
                      }}
                      className="relative group"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Card Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* NFT Card */}
                      <div className="relative bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[rgb(163,255,18)]/30 group-hover:border-[rgb(163,255,18)]/60 transition-all duration-300">
                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeUserNFTFromBoard(nft.id)}
                          className="absolute top-2 left-2 z-10 w-6 h-6 p-0 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                        
                        {/* Image */}
                        <div className="aspect-square relative overflow-hidden">
                          <img 
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
                          <p className="text-[rgb(163,255,18)] text-xs font-mono mt-1">{nft.value} ETH</p>
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
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Side Indicator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90"
            >
              <div className="text-[rgb(163,255,18)] text-xs font-bold tracking-widest uppercase">
                YOUR OFFER
              </div>
            </motion.div>
          </div>

          {/* Trader's Side (Right) */}
          <div className="relative flex">
            {/* Card Placement Area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-bl from-purple-500/5 to-transparent rounded-2xl border border-purple-500/20 p-6 min-h-[600px] flex-1 flex flex-col relative"
            >
              {/* NFT Grid */}
              <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                <AnimatePresence>
                  {traderBoardNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ 
                        opacity: 0, 
                        scale: 0.8,
                        x: 200,
                        rotateY: 180
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: 0,
                        rotateY: 0
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.8,
                        x: 200
                      }}
                      transition={{ 
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 100,
                        damping: 15
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: -5,
                        z: 50
                      }}
                      className="relative group"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Card Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* NFT Card */}
                      <div className="relative bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/30 group-hover:border-purple-500/60 transition-all duration-300">
                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTraderNFTFromBoard(nft.id)}
                          className="absolute top-2 left-2 z-10 w-6 h-6 p-0 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </Button>
                        
                        {/* Image */}
                        <div className="aspect-square relative overflow-hidden">
                          <img 
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
                          <p className="text-purple-400 text-xs font-mono mt-1">{nft.value} ETH</p>
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
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Side Indicator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 rotate-90"
            >
              <div className="text-purple-400 text-xs font-bold tracking-widest uppercase">
                THEIR OFFER
              </div>
            </motion.div>
          </div>
        </div>

        {/* Center VS Indicator */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.8,
            type: "spring",
            stiffness: 100
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(163,255,18)] to-purple-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-black rounded-full p-4 border-2 border-transparent bg-gradient-to-r from-[rgb(163,255,18)] to-purple-500 bg-clip-padding">
              <div className="bg-black rounded-full p-3">
                <span className="text-white font-bold text-xl">VS</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
