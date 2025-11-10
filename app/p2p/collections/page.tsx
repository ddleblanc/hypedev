'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useP2PBackground } from '@/hooks/use-p2p-background';
import { ArrowLeft, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MediaRenderer } from '@/components/media-renderer';
import { MobileNav } from '@/components/p2p/mobile-nav';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  bannerImage: string | null;
  image: string | null;
  floorPrice: number | null;
  mintedSupply: number;
  totalSupply: number;
  isVerified: boolean;
  availableNFTCount?: number;
}

export default function CollectionsPage() {
  const { navigateToHub, navigateToCollection } = useP2PBackground();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/public/collections?category=all');
      const data = await response.json();

      // Filter to only collections with tradeable NFTs
      const tradeableCollections = data.collections || [];
      setCollections(tradeableCollections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCollectionClick = (collection: Collection) => {
    const bannerImage = collection.bannerImage || collection.image || '/assets/img/bg1.jpg';
    navigateToCollection(collection.id, bannerImage);
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
            onClick={navigateToHub}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg">Back</span>
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            Browse Collections
          </h1>
          <p className="text-white/60">
            Select a collection to view tradeable NFTs
          </p>
        </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-white/30 transition-colors"
          />
        </div>
      </motion.div>

      {/* Collections Grid */}
      {isLoading ? (
        <LoadingGrid />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-8"
        >
          {filteredCollections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onClick={() => handleCollectionClick(collection)}
              index={index}
            />
          ))}
        </motion.div>
      )}

      {!isLoading && filteredCollections.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/60 text-lg">
            No collections found
          </p>
        </motion.div>
      )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab="hub" onTabChange={() => {}} />
    </>
  );
}

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  index: number;
}

function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const bannerImage = collection.bannerImage || collection.image || '/assets/img/bg1.jpg';
  const floorPrice = collection.floorPrice?.toFixed(4) || '—';

  return (
    <motion.button
      variants={cardVariants}
      layoutId={`collection-${collection.id}`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative w-full h-48 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/50 hover:border-white/20 transition-all duration-300 active:scale-95"
    >
      {/* Banner Image */}
      <div className="absolute inset-0">
        <MediaRenderer
          src={bannerImage}
          alt={collection.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5">
        {/* Collection Info */}
        <div className="flex items-center space-x-2 mb-2">
          {collection.image && (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-white/20">
              <MediaRenderer
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-1">
              <span>{collection.name}</span>
              {collection.isVerified && (
                <span className="text-blue-400">✓</span>
              )}
            </h3>
            <p className="text-white/60 text-sm">{collection.symbol}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-white/80">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{floorPrice} ETH</span>
          </div>
          <div className="text-white/60">
            {collection.mintedSupply}/{collection.totalSupply}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-8">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 animate-pulse"
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
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
    },
  },
};
