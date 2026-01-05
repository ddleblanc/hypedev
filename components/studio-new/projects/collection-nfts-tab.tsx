'use client';

import { useState, useMemo } from 'react';
import { Plus, Upload, Search, Grid, List, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MediaRenderer } from '@/components/media-renderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
  isMinted?: boolean;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  address?: string;
  chainId: number;
  contractType?: string;
  nfts?: Nft[];
}

interface CollectionNftsTabProps {
  collection: Collection;
  onAddNft?: () => void;
  onViewNft?: (nft: Nft) => void;
}

// =============================================================================
// Components
// =============================================================================

function NftGridItem({
  nft,
  onView,
}: {
  nft: Nft;
  onView?: (nft: Nft) => void;
}) {
  return (
    <div
      onClick={() => onView?.(nft)}
      className="aspect-square rounded-lg bg-studio-surface overflow-hidden relative group cursor-pointer"
    >
      {nft.image ? (
        <MediaRenderer
          src={nft.image}
          alt={nft.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-studio-text-muted text-sm">
          #{nft.tokenId || '?'}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="text-xs text-white font-medium truncate">{nft.name}</p>
          {nft.tokenId && (
            <p className="text-[10px] text-white/70">#{nft.tokenId}</p>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-2 right-2">
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
            nft.isMinted
              ? 'bg-green-500/80 text-white'
              : 'bg-amber-500/80 text-white'
          )}
        >
          {nft.isMinted ? 'Minted' : 'Draft'}
        </span>
      </div>
    </div>
  );
}

function NftListItem({
  nft,
  onView,
}: {
  nft: Nft;
  onView?: (nft: Nft) => void;
}) {
  return (
    <div
      onClick={() => onView?.(nft)}
      className="flex items-center gap-3 p-3 rounded-lg bg-studio-surface hover:bg-studio-border/30 transition-colors cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 rounded-lg bg-studio-border overflow-hidden flex-shrink-0">
        {nft.image ? (
          <MediaRenderer
            src={nft.image}
            alt={nft.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-studio-text-muted">
            #{nft.tokenId || '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-studio-text truncate">{nft.name}</p>
        <p className="text-xs text-studio-text-muted">
          Token #{nft.tokenId || '—'}
        </p>
      </div>

      {/* Status */}
      <span
        className={cn(
          'px-2 py-0.5 text-xs rounded-full flex-shrink-0',
          nft.isMinted
            ? 'bg-green-500/10 text-green-500'
            : 'bg-studio-border text-studio-text-muted'
        )}
      >
        {nft.isMinted ? 'Minted' : 'Draft'}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="p-2 rounded-lg hover:bg-studio-border transition-colors">
            <MoreHorizontal className="h-4 w-4 text-studio-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-studio-surface border-studio-border"
        >
          <DropdownMenuItem onClick={() => onView?.(nft)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyState({ onAddNft }: { onAddNft?: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-studio-surface flex items-center justify-center mb-4">
        <Upload className="h-8 w-8 text-studio-text-muted" />
      </div>
      <p className="text-studio-text font-medium">No NFTs yet</p>
      <p className="text-sm text-studio-text-muted mt-1">
        Add your first NFT to this collection
      </p>
      <Button
        onClick={onAddNft}
        className="mt-4 bg-studio-accent hover:bg-studio-accent/90 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add NFT
      </Button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CollectionNftsTab({
  collection,
  onAddNft,
  onViewNft,
}: CollectionNftsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const nfts = collection.nfts || [];

  // Filter NFTs by search query
  const filteredNfts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return nfts;

    return nfts.filter(
      (nft) =>
        nft.name?.toLowerCase().includes(query) ||
        nft.tokenId?.toLowerCase().includes(query)
    );
  }, [nfts, searchQuery]);

  // Check if it's an OpenEdition contract
  const isOpenEdition = collection.contractType?.includes('OpenEdition');

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-studio-text-muted pointer-events-none" />
          <Input
            type="text"
            placeholder="Search NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-studio-surface border-studio-border text-studio-text placeholder:text-studio-text-muted focus-visible:ring-studio-accent"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-studio-surface rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'grid'
                ? 'bg-studio-border text-studio-text'
                : 'text-studio-text-muted hover:text-studio-text'
            )}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'list'
                ? 'bg-studio-border text-studio-text'
                : 'text-studio-text-muted hover:text-studio-text'
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Add NFT Button */}
        {!isOpenEdition && (
          <Button
            onClick={onAddNft}
            className="bg-studio-accent hover:bg-studio-accent/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add NFT</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {/* OpenEdition Notice */}
      {isOpenEdition && (
        <div className="p-3 rounded-lg bg-studio-accent/10 border border-studio-accent/20">
          <p className="text-sm text-studio-accent">
            This is an Open Edition collection. All copies share the same
            metadata. Users can claim copies using the Claim Phases.
          </p>
        </div>
      )}

      {/* NFT Grid/List */}
      {filteredNfts.length === 0 ? (
        searchQuery ? (
          <div className="py-12 text-center">
            <p className="text-studio-text">No NFTs found</p>
            <p className="text-sm text-studio-text-muted mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <EmptyState onAddNft={onAddNft} />
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredNfts.map((nft) => (
            <NftGridItem key={nft.id} nft={nft} onView={onViewNft} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNfts.map((nft) => (
            <NftListItem key={nft.id} nft={nft} onView={onViewNft} />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {filteredNfts.length > 0 && (
        <div className="pt-4 border-t border-studio-border">
          <p className="text-xs text-studio-text-muted text-center">
            Showing {filteredNfts.length} of {nfts.length} NFT
            {nfts.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
