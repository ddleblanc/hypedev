'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ExternalLink,
  Settings,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaRenderer } from '@/components/media-renderer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NftPreviewGrid } from './nft-preview-grid';

// =============================================================================
// Types
// =============================================================================

interface Nft {
  id: string;
  name: string;
  image?: string;
  tokenId?: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  address?: string;
  isDeployed: boolean;
  nftsCount: number;
  nfts?: Nft[];
}

interface CollectionRowProps {
  collection: Collection;
  isExpanded: boolean;
  onExpand: () => void;
  onView?: (collection: Collection) => void;
  onSettings?: (collection: Collection) => void;
  onAddNft?: (collectionId: string) => void;
  onViewAllNfts?: (collectionId: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export function CollectionRow({
  collection,
  isExpanded,
  onExpand,
  onView,
  onSettings,
  onAddNft,
  onViewAllNfts,
}: CollectionRowProps) {
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden transition-colors',
        isExpanded ? 'bg-studio-border/30' : 'hover:bg-studio-border/20'
      )}
    >
      {/* Collection Header */}
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Expand Icon with indent */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-4"
        >
          <ChevronRight className="h-4 w-4 text-studio-text-muted" />
        </motion.div>

        {/* Collection Image */}
        <div className="h-10 w-10 rounded-lg bg-studio-border overflow-hidden flex-shrink-0">
          {collection.image ? (
            <MediaRenderer
              src={collection.image}
              alt={collection.name}
              width="40"
              height="40"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-studio-text-muted text-xs font-medium">
              {collection.symbol?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Collection Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-studio-text truncate">
              {collection.name}
            </h4>
            {/* Status Badge */}
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0',
                collection.isDeployed
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-amber-500/10 text-amber-500'
              )}
            >
              {collection.isDeployed ? 'Live' : 'Draft'}
            </span>
          </div>
          <p className="text-xs text-studio-text-muted">
            {collection.symbol} · {collection.nftsCount} item
            {collection.nftsCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions Dropdown */}
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
            <DropdownMenuItem onClick={() => onAddNft?.(collection.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add NFTs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView?.(collection)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSettings?.(collection)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </button>

      {/* Expanded Content - NFT Preview */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <NftPreviewGrid
              nfts={collection.nfts || []}
              collectionId={collection.id}
              onAddNft={() => onAddNft?.(collection.id)}
              onViewAll={() => onViewAllNfts?.(collection.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
