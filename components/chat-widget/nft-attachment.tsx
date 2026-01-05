'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineTradeView } from './inline-trade-view';

export interface AttachedNft {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collectionId: string;
  collection?: {
    name: string;
    symbol: string;
    image?: string;
    floorPrice?: number;
  };
  ownerAddress?: string;
  rarityTier?: string;
  listingPrice?: number | null;
}

interface NftAttachmentProps {
  nft: AttachedNft;
  senderAddress: string;
  senderUsername: string | null;
  isOwnMessage: boolean;
  className?: string;
}

const RARITY_COLORS: Record<string, string> = {
  MYTHIC: 'from-purple-500/30 to-pink-500/30 border-purple-500/50',
  LEGENDARY: 'from-amber-500/30 to-orange-500/30 border-amber-500/50',
  EPIC: 'from-violet-500/30 to-purple-500/30 border-violet-500/50',
  RARE: 'from-blue-500/30 to-cyan-500/30 border-blue-500/50',
  COMMON: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
};

export function NftAttachment({
  nft,
  senderAddress,
  senderUsername,
  isOwnMessage,
  className,
}: NftAttachmentProps) {
  const [showTradeView, setShowTradeView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rarityClass = RARITY_COLORS[nft.rarityTier || 'COMMON'] || RARITY_COLORS.COMMON;

  const handleClick = () => {
    // Only show trade view if it's not your own NFT
    if (!isOwnMessage) {
      setShowTradeView(true);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative w-full max-w-[200px] rounded-lg overflow-hidden',
          'bg-gradient-to-br border backdrop-blur-sm',
          'transition-all duration-200',
          rarityClass,
          !isOwnMessage && 'cursor-pointer hover:shadow-lg hover:shadow-purple-500/20',
          isOwnMessage && 'cursor-default',
          className
        )}
        disabled={isOwnMessage}
        aria-label={`NFT: ${nft.name}${!isOwnMessage ? '. Click to trade.' : ''}`}
      >
        {/* NFT Image */}
        <div className="relative aspect-square bg-black/30">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
            </div>
          )}
          <img
            src={nft.image}
            alt={nft.name}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* Rarity badge */}
          {nft.rarityTier && nft.rarityTier !== 'COMMON' && (
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wide',
                nft.rarityTier === 'MYTHIC' && 'text-purple-400',
                nft.rarityTier === 'LEGENDARY' && 'text-amber-400',
                nft.rarityTier === 'EPIC' && 'text-violet-400',
                nft.rarityTier === 'RARE' && 'text-blue-400',
              )}>
                {nft.rarityTier}
              </span>
            </div>
          )}

          {/* Trade indicator for non-own messages */}
          {!isOwnMessage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
              <span className="flex items-center gap-1 text-[10px] font-medium text-white/90">
                <Sparkles className="w-3 h-3" />
                Click to Trade
              </span>
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div className="p-2 bg-black/40">
          <div className="text-white/90 text-xs font-medium truncate">
            {nft.name}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-white/50 text-[10px] truncate">
              {nft.collection?.name || 'Unknown Collection'}
            </span>
            {(nft.listingPrice || nft.collection?.floorPrice) && (
              <span className="text-emerald-400 text-[10px] font-medium">
                {nft.listingPrice || nft.collection?.floorPrice} ETH
              </span>
            )}
          </div>
        </div>
      </motion.button>

      {/* Inline Trade View Modal */}
      <AnimatePresence>
        {showTradeView && (
          <InlineTradeView
            nft={nft}
            senderAddress={senderAddress}
            senderUsername={senderUsername}
            onClose={() => setShowTradeView(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
