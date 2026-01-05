'use client';

import { Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaRenderer } from '@/components/media-renderer';

// =============================================================================
// Types
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
}

interface NftPreviewGridProps {
  nfts: Nft[];
  collectionId: string;
  maxDisplay?: number;
  onAddNft?: () => void;
  onViewAll?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function NftPreviewGrid({
  nfts,
  collectionId,
  maxDisplay = 8,
  onAddNft,
  onViewAll,
}: NftPreviewGridProps) {
  const displayedNfts = nfts.slice(0, maxDisplay);
  const remainingCount = nfts.length - maxDisplay;

  // Empty state
  if (nfts.length === 0) {
    return (
      <div className="px-4 pb-4 ml-8">
        <div className="py-6 text-center border border-dashed border-studio-border rounded-lg">
          <p className="text-sm text-studio-text-muted mb-2">
            No NFTs in this collection
          </p>
          <button
            onClick={onAddNft}
            className="inline-flex items-center gap-1 text-sm text-studio-accent hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add NFTs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 ml-8">
      {/* NFT Thumbnail Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {displayedNfts.map((nft) => (
          <div
            key={nft.id}
            className="aspect-square rounded-lg bg-studio-border overflow-hidden group relative cursor-pointer"
          >
            {nft.image ? (
              <MediaRenderer
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-studio-text-muted">
                #{nft.tokenId || '?'}
              </div>
            )}
            {/* Hover overlay with name */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white font-medium truncate px-1">
                {nft.name}
              </span>
            </div>
          </div>
        ))}

        {/* "More" tile when there are additional NFTs */}
        {remainingCount > 0 && (
          <button
            onClick={onViewAll}
            className={cn(
              'aspect-square rounded-lg bg-studio-border/50',
              'flex flex-col items-center justify-center',
              'text-studio-text-muted hover:bg-studio-border transition-colors'
            )}
          >
            <span className="text-lg font-semibold">+{remainingCount}</span>
            <span className="text-[10px]">more</span>
          </button>
        )}

        {/* Add NFT tile when under maxDisplay */}
        {nfts.length < maxDisplay && (
          <button
            onClick={onAddNft}
            className={cn(
              'aspect-square rounded-lg border border-dashed border-studio-border',
              'flex items-center justify-center',
              'text-studio-text-muted hover:border-studio-accent hover:text-studio-accent transition-colors'
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* View All Link */}
      {nfts.length > 0 && (
        <button
          onClick={onViewAll}
          className="mt-3 flex items-center gap-1 text-xs text-studio-text-muted hover:text-studio-text transition-colors"
        >
          View all {nfts.length} items
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
