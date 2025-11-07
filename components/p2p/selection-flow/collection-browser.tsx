'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';

interface Collection {
  id: string;
  name: string;
  image?: string;
  nftCount: number;
}

interface CollectionBrowserProps {
  collections: Collection[];
  selectedCollection: string | null;
  onCollectionChange: (collectionId: string | null) => void;
}

export function CollectionBrowser({
  collections,
  selectedCollection,
  onCollectionChange,
}: CollectionBrowserProps) {
  const allNFTsCount = collections.reduce((sum, col) => sum + col.nftCount, 0);

  return (
    <div className="w-full overflow-x-auto hide-scrollbar pb-2">
      <div className="flex gap-2 min-w-min px-4">
        {/* All tab */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onCollectionChange(null)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
            ${
              selectedCollection === null
                ? 'bg-black/40 border border-[rgb(163,255,18)]/40 text-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/10'
                : 'bg-black/40 text-white/50 hover:bg-black/60 hover:text-white/70 border border-white/10'
            }
          `}
        >
          <Layers className="w-4 h-4" />
          <span>All</span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${selectedCollection === null ? 'bg-[rgb(163,255,18)]/20' : 'bg-black/40'}`}>
            {allNFTsCount}
          </span>
        </motion.button>

        {/* Collection tabs */}
        {collections.map((collection) => (
          <motion.button
            key={collection.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCollectionChange(collection.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all
              ${
                selectedCollection === collection.id
                  ? 'bg-black/40 border border-[rgb(163,255,18)]/40 text-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/10'
                  : 'bg-black/40 text-white/50 hover:bg-black/60 hover:text-white/70 border border-white/10'
              }
            `}
          >
            {collection.image && (
              <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                <MediaRenderer
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <span className="truncate max-w-[120px]">{collection.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${selectedCollection === collection.id ? 'bg-[rgb(163,255,18)]/20' : 'bg-black/40'}`}>
              {collection.nftCount}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
