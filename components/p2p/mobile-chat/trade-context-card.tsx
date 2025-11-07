'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowRightLeft, Eye } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
  };
}

interface TradeContextCardProps {
  userNFTs: NFT[];
  traderNFTs: NFT[];
  tradeStatus: string | null;
  isKeyboardOpen?: boolean;
  onViewFullTrade?: () => void;
}

export function TradeContextCard({
  userNFTs,
  traderNFTs,
  tradeStatus,
  isKeyboardOpen = false,
  onViewFullTrade,
}: TradeContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-collapse when keyboard opens
  if (isKeyboardOpen && isExpanded) {
    setIsExpanded(false);
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'AGREED':
      case 'FINALIZED':
        return 'border-[rgb(163,255,18)]/20 bg-[rgb(163,255,18)]/5';
      case 'REJECTED':
      case 'CANCELLED':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-white/10 bg-black/40';
    }
  };

  // Show only first 2 NFTs in collapsed state
  const displayUserNFTs = isExpanded ? userNFTs : userNFTs.slice(0, 2);
  const displayTraderNFTs = isExpanded ? traderNFTs : traderNFTs.slice(0, 2);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: isKeyboardOpen ? 0 : 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`border-t ${getStatusColor(tradeStatus)} backdrop-blur-xl`}
    >
      {/* Collapse/Expand Handle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <div className="w-10 h-1 rounded-full bg-white/20" />
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      <div className="px-4 pb-4">
        {/* Trade Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Trade Details</p>
              <p className="text-white/40 text-xs">
                {userNFTs.length} for {traderNFTs.length} NFTs
              </p>
            </div>
          </div>

          {onViewFullTrade && (
            <button
              onClick={onViewFullTrade}
              className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[rgb(163,255,18)]/30 text-white/70 hover:text-[rgb(163,255,18)] text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
          )}
        </div>

        <AnimatePresence>
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 'auto' }}
            className="space-y-3"
          >
            {/* Your Offer */}
            <div>
              <p className="text-white/60 text-xs mb-2">Your Offer ({userNFTs.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {displayUserNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-black/40 border border-[rgb(163,255,18)]/20"
                  >
                    <MediaRenderer src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {!isExpanded && userNFTs.length > 2 && (
                  <div className="aspect-square rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-semibold">+{userNFTs.length - 2}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Their Offer */}
            <div>
              <p className="text-white/60 text-xs mb-2">Their Offer ({traderNFTs.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {displayTraderNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-black/40 border border-white/10"
                  >
                    <MediaRenderer src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {!isExpanded && traderNFTs.length > 2 && (
                  <div className="aspect-square rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-semibold">+{traderNFTs.length - 2}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions (only when expanded) */}
            {isExpanded && tradeStatus === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-4 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all">
                  Counter
                </button>
                <button className="flex-1 px-4 py-2 rounded-lg bg-black/40 hover:bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] text-sm font-medium transition-all">
                  Accept
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
