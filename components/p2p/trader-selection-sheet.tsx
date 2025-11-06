'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Star, TrendingUp, Package, ArrowRight } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';
import { useP2PSelectionFlow } from '@/contexts/p2p-selection-flow-context';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  collection?: {
    name: string;
    symbol: string;
  };
}

interface Trader {
  id: string;
  walletAddress: string;
  username?: string;
  avatar?: string;
  rating: number;
  completedTrades: number;
  successRate: number;
  collectionCompletion: number;
  availableCopies: number;
  tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
}

interface TraderSelectionSheetProps {
  nft: NFT;
  owners: string[];
  collectionName?: string;
  onClose: () => void;
}

export function TraderSelectionSheet({ nft, owners, collectionName, onClose }: TraderSelectionSheetProps) {
  const router = useRouter();
  const { resetFlow } = useP2PSelectionFlow();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTraders();
  }, [nft.id, owners]);

  const fetchTraders = async () => {
    try {
      setIsLoading(true);
      // Fetch trader data for owners
      const response = await fetch('/api/p2p/traders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: owners, nftId: nft.id }),
      });

      const data = await response.json();
      setTraders(data.traders || []);
    } catch (error) {
      console.error('Failed to fetch traders:', error);
      // Mock data for development
      setTraders(
        owners.map((address, i) => ({
          id: address,
          walletAddress: address,
          username: `Trader ${i + 1}`,
          avatar: '/assets/img/default-avatar.png',
          rating: 4.5 + Math.random() * 0.5,
          completedTrades: Math.floor(Math.random() * 100) + 10,
          successRate: 85 + Math.floor(Math.random() * 15),
          collectionCompletion: Math.floor(Math.random() * 100),
          availableCopies: Math.floor(Math.random() * 3) + 1,
          tier: ['DIAMOND', 'GOLD', 'SILVER', 'BRONZE'][Math.floor(Math.random() * 4)] as Trader['tier'],
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrader = (trader: Trader) => {
    // Clear any previous trade selections before starting a new flow
    resetFlow();

    // Use the collectionName prop if available, otherwise fall back to nft.collection?.name
    const collectionNameToUse = collectionName || nft.collection?.name;
    // Use dbId (database UUID) for reliable cross-owner matching, fallback to id for compatibility
    const nftIdentifier = (nft as any).dbId || nft.id || nft.tokenId;

    // Navigate to Step 1: Trader NFT Selection with initial NFT highlighted
    const params = new URLSearchParams();
    params.set('initial', nftIdentifier);
    if (collectionNameToUse) {
      params.set('collection', collectionNameToUse);
    }

    router.push(`/p2p/select-trader-nfts/${trader.walletAddress}?${params.toString()}`);
    onClose();
  };

  const getTierColor = (tier: Trader['tier']) => {
    switch (tier) {
      case 'DIAMOND':
        return 'from-cyan-400 to-blue-500';
      case 'GOLD':
        return 'from-yellow-400 to-orange-500';
      case 'SILVER':
        return 'from-gray-300 to-gray-500';
      default:
        return 'from-orange-700 to-orange-900';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 || velocity.y > 500) {
            onClose();
          }
        }}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl bg-black/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-white">Select Trader</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NFT Info */}
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
              <MediaRenderer
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{nft.name}</h3>
              <p className="text-white/60 text-sm">#{nft.tokenId}</p>
            </div>
          </div>
        </div>

        {/* Traders List */}
        <div className="overflow-y-auto overscroll-contain max-h-[calc(85vh-180px)] px-5 py-4">
          {isLoading ? (
            <LoadingList />
          ) : (
            <div className="space-y-3 pb-safe-or-4">
              {traders.map((trader) => (
                <TraderCard
                  key={trader.id}
                  trader={trader}
                  onClick={() => handleSelectTrader(trader)}
                  getTierColor={getTierColor}
                />
              ))}
            </div>
          )}

          {!isLoading && traders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/60">No traders available</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

interface TraderCardProps {
  trader: Trader;
  onClick: () => void;
  getTierColor: (tier: Trader['tier']) => string;
}

function TraderCard({ trader, onClick, getTierColor }: TraderCardProps) {
  const tierGradient = getTierColor(trader.tier);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-200 active:scale-97"
    >
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20">
          {trader.avatar ? (
            <MediaRenderer
              src={trader.avatar}
              alt={trader.username || trader.walletAddress}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {trader.username?.[0] || 'T'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-left">
          {/* Name & Tier */}
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-white font-semibold truncate">
              {trader.username || `${trader.walletAddress.slice(0, 6)}...${trader.walletAddress.slice(-4)}`}
            </h3>
            <div className={`px-2 py-0.5 rounded bg-gradient-to-r ${tierGradient} text-white text-xs font-semibold`}>
              {trader.tier}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1 text-white/60">
              <Star className="w-3 h-3 text-yellow-400" />
              <span>{trader.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center space-x-1 text-white/60">
              <TrendingUp className="w-3 h-3" />
              <span>{trader.successRate}%</span>
            </div>
            <div className="flex items-center space-x-1 text-white/60">
              <Package className="w-3 h-3" />
              <span>{trader.availableCopies}x</span>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>Collection</span>
              <span>{trader.collectionCompletion}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trader.collectionCompletion}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  );
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 animate-pulse"
        />
      ))}
    </div>
  );
}
