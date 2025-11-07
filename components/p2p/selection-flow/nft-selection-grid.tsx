'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
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
  rarityTier?: string;
}

interface NFTSelectionGridProps {
  nfts: NFT[];
  selectedNFTIds: string[];
  onToggleNFT: (nft: NFT) => void;
  isInitialNFT?: (id: string) => boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const getRarityColor = (rarity?: string) => {
  switch (rarity?.toUpperCase()) {
    case 'MYTHIC':
      return 'from-purple-500 to-pink-500';
    case 'LEGENDARY':
      return 'from-orange-500 to-yellow-500';
    case 'EPIC':
      return 'from-purple-500 to-blue-500';
    case 'RARE':
      return 'from-blue-500 to-cyan-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

export function NFTSelectionGrid({
  nfts,
  selectedNFTIds,
  onToggleNFT,
  isInitialNFT,
}: NFTSelectionGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4"
    >
      {nfts.map((nft) => {
        const isSelected = selectedNFTIds.includes(nft.id);
        const isInitial = isInitialNFT?.(nft.id);

        return (
          <motion.button
            key={nft.id}
            variants={itemVariants}
            layoutId={`nft-${nft.id}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleNFT(nft)}
            className={`
              group relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 backdrop-blur-xl
              shadow-lg shadow-black/50 transition-all duration-300 active:scale-95
              ${
                isSelected
                  ? 'border-2 border-[rgb(163,255,18)] shadow-[rgb(163,255,18)]/20'
                  : 'border border-white/[0.08] hover:border-white/[0.15]'
              }
              ${isInitial ? 'ring-2 ring-[rgb(163,255,18)] ring-offset-2 ring-offset-black' : ''}
            `}
          >
            {/* NFT Image */}
            <div className="absolute inset-0">
              <MediaRenderer
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Initial NFT Badge */}
            {isInitial && (
              <div className="absolute top-2 left-2 z-10">
                <div className="px-2 py-1 rounded-lg bg-black/40 border border-[rgb(163,255,18)]/40 text-[rgb(163,255,18)] text-xs font-semibold">
                  Initially Selected
                </div>
              </div>
            )}

            {/* Rarity Badge */}
            {nft.rarityTier && !isInitial && (
              <div className="absolute top-2 right-2 z-10">
                <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${getRarityColor(nft.rarityTier)} text-white text-xs font-semibold`}>
                  {nft.rarityTier}
                </div>
              </div>
            )}

            {/* Selection Checkmark */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center shadow-lg"
              >
                <Check className="w-5 h-5 text-black" strokeWidth={3} />
              </motion.div>
            )}

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              <h3 className="text-white text-sm font-semibold truncate mb-1">
                {nft.name}
              </h3>
              {nft.collection && (
                <p className="text-white/60 text-xs truncate">
                  {nft.collection.name}
                </p>
              )}
            </div>

            {/* Selection Overlay */}
            {isSelected && (
              <div className="absolute inset-0 bg-[rgb(163,255,18)]/10 pointer-events-none" />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
