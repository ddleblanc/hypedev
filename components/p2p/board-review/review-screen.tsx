'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { NFTComparisonView } from './nft-comparison-view';
import { FairnessScoreBar } from './fairness-score-bar';
import { OfferMessageInput } from './offer-message-input';
import { ReviewMenu } from './review-menu';

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

interface ReviewScreenProps {
  traderNFTs: NFT[];
  userNFTs: NFT[];
  traderName?: string;
  traderAddress: string;
  onBack: () => void;
  onEditTraderNFTs: () => void;
  onEditUserNFTs: () => void;
  onChangeTrader: () => void;
  onCancel: () => void;
  onSend: (message?: string) => Promise<void>;
}

export function ReviewScreen({
  traderNFTs,
  userNFTs,
  traderName,
  traderAddress,
  onBack,
  onEditTraderNFTs,
  onEditUserNFTs,
  onChangeTrader,
  onCancel,
  onSend,
}: ReviewScreenProps) {
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  // Calculate total values
  const userTotal = userNFTs.reduce((sum, nft) => sum + (nft.estimatedValue || nft.floorPrice || 0), 0);
  const traderTotal = traderNFTs.reduce((sum, nft) => sum + (nft.estimatedValue || nft.floorPrice || 0), 0);

  // Calculate fairness score (0-100)
  const fairnessScore = Math.min(100, Math.round((Math.min(userTotal, traderTotal) / Math.max(userTotal, traderTotal)) * 100));

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(message || undefined);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-[64px] z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-white">Review Trade</h1>

          <ReviewMenu
            onEditTraderNFTs={onEditTraderNFTs}
            onEditUserNFTs={onEditUserNFTs}
            onChangeTrader={onChangeTrader}
            onCancel={onCancel}
          />
        </div>
      </motion.div>

      {/* Trader Info Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="sticky top-[137px] z-30 bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 py-3"
      >
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-white/50">Trading with</span>
          <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-semibold">
            {traderName || `${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`}
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pt-[5.5rem] pb-6 space-y-6">
        {/* NFT Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <NFTComparisonView
            userNFTs={userNFTs}
            traderNFTs={traderNFTs}
            userTotal={userTotal}
            traderTotal={traderTotal}
          />
        </motion.div>

        {/* Fairness Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <FairnessScoreBar
            score={fairnessScore}
            userTotal={userTotal}
            traderTotal={traderTotal}
          />
        </motion.div>

        {/* Optional Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <OfferMessageInput
            value={message}
            onChange={setMessage}
            placeholder="Add a message to your offer (optional)"
          />
        </motion.div>
      </div>

      {/* Sticky Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-white/10 px-4 py-4 pb-safe-or-4"
      >
        {/* Send Offer Button - Full Width */}
        <button
          onClick={handleSend}
          disabled={isSending || traderNFTs.length === 0 || userNFTs.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-black/40 hover:bg-black/60 border border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Offer</span>
            </>
          )}
        </button>

        {/* Helper text */}
        {(traderNFTs.length === 0 || userNFTs.length === 0) && !isSending && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/40 text-sm mt-3"
          >
            Both sides must have at least one NFT to send offer
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
