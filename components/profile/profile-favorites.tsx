'use client';

import { motion } from 'framer-motion';
import { MediaRenderer } from '@/components/media-renderer';
import { Badge } from '@/components/ui/badge';
import { Heart, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FavoriteItem {
  id: string;
  itemType: 'nft' | 'collection' | 'user';
  itemId: string;
  metadata: {
    name: string;
    image?: string;
    symbol?: string;
    description?: string;
  };
  addedAt: string;
}

interface ProfileFavoritesProps {
  favorites: FavoriteItem[];
  isLoading?: boolean;
  onItemClick?: (item: FavoriteItem) => void;
  emptyMessage?: string;
}

export function ProfileFavorites({
  favorites,
  isLoading = false,
  onItemClick,
  emptyMessage = 'No favorites yet',
}: ProfileFavoritesProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <FavoriteSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 text-lg font-medium">{emptyMessage}</p>
        <p className="text-white/40 text-sm mt-2">
          Items you favorite will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {favorites.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
        >
          <FavoriteCard item={item} onClick={() => onItemClick?.(item)} />
        </motion.div>
      ))}
    </div>
  );
}

function FavoriteCard({
  item,
  onClick,
}: {
  item: FavoriteItem;
  onClick?: () => void;
}) {
  const typeColors = {
    nft: 'bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]',
    collection: 'bg-purple-500/10 border-purple-500/50 text-purple-500',
    user: 'bg-blue-500/10 border-blue-500/50 text-blue-500',
  };

  return (
    <div
      className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {item.metadata.image ? (
          <MediaRenderer
            src={item.metadata.image}
            alt={item.metadata.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Heart className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={cn('text-xs uppercase', typeColors[item.itemType])}>
            {item.itemType}
          </Badge>
        </div>

        {/* Favorite Icon */}
        <div className="absolute top-2 right-2">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white font-medium text-sm truncate">
          {item.metadata.name}
        </h3>
        {item.metadata.symbol && (
          <p className="text-white/40 text-xs truncate">{item.metadata.symbol}</p>
        )}
      </div>
    </div>
  );
}

function FavoriteSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  );
}
