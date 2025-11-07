'use client';

import { motion } from 'framer-motion';
import { ArrowRight, X, ArrowLeft } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';

interface NFT {
  id: string;
  name: string;
  image: string;
}

interface SelectedNFTsBarProps {
  selectedNFTs: NFT[];
  onNext: () => void;
  onBack?: () => void;
  onClear?: () => void;
  nextLabel?: string;
  isLoading?: boolean;
  tradeContext?: {
    wantCount: number;
    offerCount: number;
  };
}

export function SelectedNFTsBar({
  selectedNFTs,
  onNext,
  onBack,
  onClear,
  nextLabel = 'Next',
  isLoading = false,
  tradeContext,
}: SelectedNFTsBarProps) {
  const count = selectedNFTs.length;
  const showCount = count > 3;
  const displayedNFTs = selectedNFTs.slice(0, 3);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-white/10 px-4 py-4 pb-safe-or-4"
    >
      {/* Trade Context (optional) */}
      {tradeContext && (
        <div className="flex items-center justify-center gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">You want</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-white/70 font-semibold">
              {tradeContext.wantCount}
            </span>
          </div>
          <ArrowRight className="w-3 h-3 text-white/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Your offer</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-[rgb(163,255,18)]/40 text-[rgb(163,255,18)] font-semibold">
              {tradeContext.offerCount}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {count === 0 ? (
          <>
            {/* Empty state: Show back button and message */}
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all min-h-[48px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-semibold">Back</span>
              </button>
            )}

            <div className="flex-1 text-center">
              <span className="text-sm text-white/40">Select NFTs to continue</span>
            </div>

            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/40 border border-white/10 text-white/20 font-semibold min-w-[120px] justify-center cursor-not-allowed"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Filled state: Show NFT previews + count */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex -space-x-2">
                {displayedNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.id}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                      delay: index * 0.05,
                    }}
                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] bg-black"
                  >
                    <MediaRenderer src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>

              <motion.div
                key={count}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-sm font-semibold text-white">
                  {count} {count === 1 ? 'NFT' : 'NFTs'} Selected
                </span>
                {showCount && (
                  <span className="text-xs text-white/50">
                    (+{count - 3} more)
                  </span>
                )}
              </motion.div>

              {onClear && (
                <button
                  onClick={onClear}
                  className="ml-auto p-1.5 rounded-lg hover:bg-black/60 transition-colors text-white/50 hover:text-white/80"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right: Next button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/40 hover:bg-black/60 border border-[rgb(163,255,18)]/30 hover:border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[rgb(163,255,18)]/30 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
