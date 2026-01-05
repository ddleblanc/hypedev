'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';
import { useActiveAccount } from 'thirdweb/react';

interface OwnedNft {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collectionId: string;
  collection?: {
    name: string;
    symbol: string;
  };
  rarityTier?: string | null;
}

interface NftPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (nft: OwnedNft) => void;
}

export function NftPicker({ isOpen, onClose, onSelect }: NftPickerProps) {
  const account = useActiveAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNft, setSelectedNft] = useState<OwnedNft | null>(null);

  // Fetch user's NFTs
  const { data, isLoading } = trpc.user.nfts.list.useQuery(
    { address: account?.address || '', filter: 'owned' },
    { enabled: !!account?.address && isOpen }
  );

  const nfts: OwnedNft[] = data?.success
    ? data.nfts.map((n) => ({
        id: n.id,
        name: n.name,
        image: n.image,
        tokenId: String(n.tokenId),
        collectionId: n.collectionId,
        collection: n.collection
          ? { name: n.collection.name, symbol: n.collection.symbol }
          : undefined,
        rarityTier: n.rarityTier,
      }))
    : [];

  // Filter NFTs based on search
  const filteredNfts = nfts.filter(
    (nft) =>
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.collection?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedNft(null);
    }
  }, [isOpen]);

  const handleSelect = (nft: OwnedNft) => {
    setSelectedNft(nft);
  };

  const handleConfirm = () => {
    if (selectedNft) {
      onSelect(selectedNft);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nft-picker-title"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="w-full max-w-md max-h-[80vh] bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex-shrink-0">
          <h2 id="nft-picker-title" className="text-white font-semibold text-sm">
            Share an NFT
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your NFTs..."
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-white/5 border border-white/10',
                'text-white text-sm placeholder:text-white/30',
                'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50'
              )}
            />
          </div>
        </div>

        {/* NFT Grid */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : filteredNfts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50 text-sm">
                {searchQuery ? 'No NFTs match your search' : 'No NFTs found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredNfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => handleSelect(nft)}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden',
                    'border-2 transition-all duration-200',
                    selectedNft?.id === nft.id
                      ? 'border-purple-500 ring-2 ring-purple-500/50 scale-95'
                      : 'border-transparent hover:border-white/20'
                  )}
                >
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="text-white text-[10px] font-medium truncate">
                        {nft.name}
                      </div>
                    </div>
                  </div>
                  {selectedNft?.id === nft.id && (
                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedNft && (
          <div className="p-3 border-t border-white/10 bg-white/5 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={selectedNft.image}
                alt=""
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {selectedNft.name}
                </div>
                <div className="text-white/50 text-xs truncate">
                  {selectedNft.collection?.name || 'Unknown Collection'}
                </div>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-medium transition-all',
                'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
                'hover:from-purple-600 hover:to-pink-600'
              )}
            >
              Attach NFT
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
