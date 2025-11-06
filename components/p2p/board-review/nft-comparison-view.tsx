'use client';

import { motion } from 'framer-motion';
import { ArrowRightLeft } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
    symbol: string;
  };
  floorPrice?: number;
  estimatedValue?: number;
}

interface NFTComparisonViewProps {
  userNFTs: NFT[];
  traderNFTs: NFT[];
  userTotal: number;
  traderTotal: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, rotateY: -90 },
  show: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export function NFTComparisonView({
  userNFTs,
  traderNFTs,
  userTotal,
  traderTotal,
}: NFTComparisonViewProps) {
  return (
    <div className="space-y-4">
      {/* Your Offer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Your Offer
            <span className="px-2 py-0.5 rounded-lg bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 text-[rgb(163,255,18)] text-xs font-bold">
              {userNFTs.length}
            </span>
          </h2>
          <div className="text-sm font-mono text-[rgb(163,255,18)]">
            {userTotal.toFixed(3)} ETH
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {userNFTs.map((nft) => (
            <motion.div
              key={nft.id}
              variants={cardVariants}
              className="relative aspect-square rounded-xl overflow-hidden bg-black/40 backdrop-blur-xl border border-[rgb(163,255,18)]/20 hover:border-[rgb(163,255,18)]/40 transition-all"
            >
              {/* NFT Image */}
              <div className="absolute inset-0">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white text-sm font-semibold truncate mb-1">
                  {nft.name}
                </h3>
                {nft.collection && (
                  <p className="text-white/60 text-xs truncate mb-1">
                    {nft.collection.name}
                  </p>
                )}
                {(nft.estimatedValue || nft.floorPrice) && (
                  <p className="text-[rgb(163,255,18)] text-xs font-mono">
                    {(nft.estimatedValue || nft.floorPrice || 0).toFixed(3)} ETH
                  </p>
                )}
              </div>

              {/* Green glow effect */}
              <div className="absolute inset-0 bg-[rgb(163,255,18)]/5 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Swap Icon */}
      <div className="flex justify-center py-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
          className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center"
        >
          <ArrowRightLeft className="w-5 h-5 text-white/40 rotate-90" />
        </motion.div>
      </div>

      {/* Their Offer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Their Offer
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.12] text-white/70 text-xs font-bold">
              {traderNFTs.length}
            </span>
          </h2>
          <div className="text-sm font-mono text-white/70">
            {traderTotal.toFixed(3)} ETH
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          {traderNFTs.map((nft) => (
            <motion.div
              key={nft.id}
              variants={cardVariants}
              className="relative aspect-square rounded-xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] transition-all"
            >
              {/* NFT Image */}
              <div className="absolute inset-0">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white text-sm font-semibold truncate mb-1">
                  {nft.name}
                </h3>
                {nft.collection && (
                  <p className="text-white/60 text-xs truncate mb-1">
                    {nft.collection.name}
                  </p>
                )}
                {(nft.estimatedValue || nft.floorPrice) && (
                  <p className="text-white/70 text-xs font-mono">
                    {(nft.estimatedValue || nft.floorPrice || 0).toFixed(3)} ETH
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
