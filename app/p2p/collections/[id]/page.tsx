'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useP2PBackground } from '@/hooks/use-p2p-background';
import { ArrowLeft, Users, Layers, TrendingUp } from 'lucide-react';
import { TraderSelectionSheet } from '@/components/p2p/trader-selection-sheet';
import { MediaRenderer } from '@/components/media-renderer';
import { MobileNav } from '@/components/p2p/mobile-nav';

interface NFT {
  id: string;
  dbId?: string; // Database UUID for exact matching
  tokenId: string;
  name: string;
  image: string;
  rarityTier?: string;
  rarityScore?: number;
  listingPrice?: number;
  ownerAddress?: string;
  collection?: {
    name: string;
    symbol: string;
  };
}

interface StackedNFT {
  nft: NFT;
  count: number;
  owners: string[];
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  bannerImage: string | null;
  image: string | null;
  floorPrice: number | null;
}

export default function CollectionBrowsePage() {
  const params = useParams();
  const router = useRouter();
  const { setCollectionBackground, restoreDefaultBackground } = useP2PBackground();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [stackedNFTs, setStackedNFTs] = useState<StackedNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<StackedNFT | null>(null);
  const [showTraderSheet, setShowTraderSheet] = useState(false);

  useEffect(() => {
    fetchCollectionData();
    fetchNFTs();
  }, [collectionId]);

  const fetchCollectionData = async () => {
    try {
      const response = await fetch(`/api/public/collections/${collectionId}`);
      const data = await response.json();

      if (data.success && data.collection) {
        const collectionData = data.collection;
        setCollection(collectionData);

        // Note: Overlay is already set by navigation hook for immediate transition
        // Only set it here as fallback if user navigates directly to this URL
        const bannerImage = collectionData.bannerImage || collectionData.image;
        if (bannerImage) {
          setCollectionBackground(bannerImage);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    }
  };

  const fetchNFTs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/marketplace/collection/${collectionId}/nfts?limit=100`);
      const data = await response.json();

      if (data.success && data.nfts) {
        // Map the marketplace API response to our NFT interface
        const nftList: NFT[] = data.nfts.map((nft: any) => ({
          id: nft.id.toString(),
          dbId: nft.dbId, // Database UUID for exact matching
          tokenId: nft.id.toString(),
          name: nft.name,
          image: nft.image,
          rarityTier: nft.rarity,
          rarityScore: nft.rank,
          listingPrice: parseFloat(nft.price) || undefined,
          ownerAddress: nft.owner || undefined,
          collection: {
            name: collection?.name || '',
            symbol: collection?.symbol || '',
          },
        }));

        setNfts(nftList);
        // Stack identical NFTs
        stackNFTs(nftList);
      }
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stackNFTs = (nftList: NFT[]) => {
    const nftMap = new Map<string, StackedNFT>();

    nftList.forEach((nft) => {
      const key = `${nft.tokenId}`;
      if (nftMap.has(key)) {
        const existing = nftMap.get(key)!;
        existing.count++;
        if (nft.ownerAddress && !existing.owners.includes(nft.ownerAddress)) {
          existing.owners.push(nft.ownerAddress);
        }
      } else {
        nftMap.set(key, {
          nft,
          count: 1,
          owners: nft.ownerAddress ? [nft.ownerAddress] : [],
        });
      }
    });

    const stacked = Array.from(nftMap.values());
    setStackedNFTs(stacked);
  };

  const handleNFTClick = (stackedNFT: StackedNFT) => {
    setSelectedNFT(stackedNFT);
    setShowTraderSheet(true);
  };

  const handleBack = () => {
    // Restore video background immediately before navigation
    restoreDefaultBackground();
    // Navigate back
    router.back();
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

  return (
    <>
      <div className="relative z-10 min-h-screen px-4 pt-20 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>

          {collection && (
            <div className="flex items-center space-x-3 mb-3">
              {collection.image && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20">
                  <MediaRenderer
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {collection.name}
                </h1>
                <p className="text-white/60 text-lg">{collection.symbol}</p>
              </div>
            </div>
          )}

          <p className="text-white/60">
            Select an NFT to view available traders
          </p>
        </motion.div>

        {/* NFT Grid */}
        {isLoading ? (
          <LoadingGrid />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8"
          >
            {stackedNFTs.map((stackedNFT, index) => (
              <NFTCard
                key={`${stackedNFT.nft.id}-${index}`}
                stackedNFT={stackedNFT}
                onClick={() => handleNFTClick(stackedNFT)}
                getRarityColor={getRarityColor}
              />
            ))}
          </motion.div>
        )}

        {!isLoading && stackedNFTs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Layers className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-white/60 text-lg">
              No tradeable NFTs found
            </p>
          </motion.div>
        )}
      </div>

      {/* Trader Selection Sheet */}
      <AnimatePresence>
        {showTraderSheet && selectedNFT && (
          <TraderSelectionSheet
            nft={selectedNFT.nft}
            owners={selectedNFT.owners}
            collectionName={collection?.name}
            onClose={() => setShowTraderSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <MobileNav activeTab="hub" onTabChange={() => {}} />
    </>
  );
}

interface NFTCardProps {
  stackedNFT: StackedNFT;
  onClick: () => void;
  getRarityColor: (rarity?: string) => string;
}

function NFTCard({ stackedNFT, onClick, getRarityColor }: NFTCardProps) {
  const { nft, count } = stackedNFT;
  const rarityGradient = getRarityColor(nft.rarityTier);

  return (
    <motion.button
      variants={cardVariants}
      layoutId={`nft-${nft.id}`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/50 hover:border-white/20 transition-all duration-300 active:scale-95"
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

      {/* Rarity Badge */}
      {nft.rarityTier && (
        <div className="absolute top-2 right-2 z-10">
          <div className={`px-2 py-1 rounded-lg bg-gradient-to-r ${rarityGradient} text-white text-xs font-semibold`}>
            {nft.rarityTier}
          </div>
        </div>
      )}

      {/* Stack Count Badge */}
      {count > 1 && (
        <div className="absolute top-2 left-2 z-10">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20">
            <Layers className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-semibold">{count}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white text-sm font-semibold truncate mb-1">
          {nft.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">#{nft.tokenId}</span>
          {stackedNFT.owners.length > 0 && (
            <div className="flex items-center space-x-1 text-white/80">
              <Users className="w-3 h-3" />
              <span>{stackedNFT.owners.length}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 animate-pulse"
        />
      ))}
    </div>
  );
}

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
    },
  },
};
