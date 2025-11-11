'use client';

import { motion } from 'framer-motion';
import { Package, Coins, Star } from 'lucide-react';

interface MobileHomescreenStatsProps {
  nftCount: number;
  hyperTokens: number;
  level: number;
}

export function MobileHomescreenStats({ nftCount, hyperTokens, level }: MobileHomescreenStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {/* NFT Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center py-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10"
      >
        <Package className="w-4 h-4 text-[rgb(163,255,18)] mb-2" />
        <span className="text-white text-lg font-bold">{nftCount}</span>
        <span className="text-white/40 text-xs">NFTs</span>
      </motion.div>

      {/* HYP Tokens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center py-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10"
      >
        <Coins className="w-4 h-4 text-[rgb(163,255,18)] mb-2" />
        <span className="text-white text-lg font-bold">
          {(hyperTokens / 1000).toFixed(1)}K
        </span>
        <span className="text-white/40 text-xs">HYP</span>
      </motion.div>

      {/* Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center py-4 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10"
      >
        <Star className="w-4 h-4 text-[rgb(163,255,18)] mb-2" />
        <span className="text-white text-lg font-bold">{level}</span>
        <span className="text-white/40 text-xs">Level</span>
      </motion.div>
    </div>
  );
}
