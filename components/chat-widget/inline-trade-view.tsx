'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  X,
  ArrowRightLeft,
  ExternalLink,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttachedNft } from './nft-attachment';

interface InlineTradeViewProps {
  nft: AttachedNft;
  senderAddress: string;
  senderUsername: string | null;
  onClose: () => void;
}

export function InlineTradeView({
  nft,
  senderAddress,
  senderUsername,
  onClose,
}: InlineTradeViewProps) {
  const router = useRouter();

  // Navigate to NFT detail page to make an offer (requires blockchain transaction)
  const handleMakeOffer = useCallback(() => {
    router.push(`/marketplace/nft/${nft.id}?action=offer`);
    onClose();
  }, [router, nft.id, onClose]);

  const handleGoToP2P = useCallback(() => {
    // Navigate to P2P page with trader and NFT pre-selected
    const params = new URLSearchParams({
      trader: senderAddress,
      nftId: nft.id,
    });
    router.push(`/p2p?${params.toString()}`);
    onClose();
  }, [router, senderAddress, nft.id, onClose]);

  const handleViewDetails = useCallback(() => {
    router.push(`/marketplace/nft/${nft.id}`);
    onClose();
  }, [router, nft.id, onClose]);

  const displayName = senderUsername || `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-view-title"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <h2 id="trade-view-title" className="text-white font-semibold text-sm">
            Trade NFT
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NFT Preview */}
        <div className="p-4 border-b border-white/5">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate">{nft.name}</div>
              <div className="text-white/50 text-xs truncate mt-0.5">
                {nft.collection?.name || 'Unknown Collection'}
              </div>
              <div className="mt-2 text-xs text-white/40">
                Owned by <span className="text-purple-400">{displayName}</span>
              </div>
              {(nft.listingPrice || nft.collection?.floorPrice) && (
                <div className="mt-1 text-emerald-400 text-sm font-medium">
                  {nft.listingPrice ? `Listed: ${nft.listingPrice} ETH` : `Floor: ${nft.collection?.floorPrice} ETH`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <p className="text-white/60 text-xs text-center mb-4">
            What would you like to do with this NFT?
          </p>

          {/* Make Offer - Goes to NFT page with offer modal */}
          <button
            onClick={handleMakeOffer}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl',
              'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
              'border border-purple-500/30 hover:border-purple-500/50',
              'text-left transition-all hover:scale-[1.02]'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Make an Offer</div>
              <div className="text-white/50 text-xs">Submit an ETH offer for this NFT</div>
            </div>
          </button>

          {/* Go to P2P */}
          <button
            onClick={handleGoToP2P}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl',
              'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
              'border border-emerald-500/30 hover:border-emerald-500/50',
              'text-left transition-all hover:scale-[1.02]'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">P2P Trade</div>
              <div className="text-white/50 text-xs">Trade NFTs directly with {displayName}</div>
            </div>
          </button>

          {/* View on Marketplace */}
          <button
            onClick={handleViewDetails}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl',
              'bg-white/5 border border-white/10 hover:border-white/20',
              'text-left transition-all hover:scale-[1.02]'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white/60" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">View Details</div>
              <div className="text-white/50 text-xs">See full NFT details on marketplace</div>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
