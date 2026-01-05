'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MediaRenderer } from '@/components/media-renderer';
import {
  LayoutGrid,
  List,
  Tag,
  Gavel,
  MoreHorizontal,
  ExternalLink,
  FileX,
  CheckSquare,
  Check,
  X,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BulkListingDialog } from '@/components/profile/bulk-listing-dialog';
import { BulkCancelDialog } from '@/components/profile/bulk-cancel-dialog';
import { BulkTransferDialog } from '@/components/profile/bulk-transfer-dialog';

export interface NFTItem {
  id: string;
  tokenId: string;
  name: string;
  image: string;
  description?: string | null;
  collection: {
    id: string;
    name: string;
    address: string;
    image?: string | null;
  };
  ownerAddress?: string | null;
  isListed: boolean;
  listingPrice?: number | null;
  listingType?: string | null;
  listingExpiry?: string | null;
  listingId?: string | null;
  rarityRank?: number | null;
  rarityTier?: string | null;
  // On-chain status for listing eligibility
  isOnChain?: boolean;
  onChainTokenId?: string | null;
  // Auction and offer status
  auction?: boolean;
  hasOffers?: boolean;
  topBid?: {
    amount: number;
    bidder: string;
    minimumBid?: number;
    buyoutPrice?: number;
  } | null;
}

interface ProfileNFTGridProps {
  nfts: NFTItem[];
  isLoading?: boolean;
  isOwnProfile: boolean;
  isDraftsTab?: boolean;  // Whether viewing drafts tab (disables listing actions)
  onListForSale?: (nft: NFTItem) => void;
  onCreateAuction?: (nft: NFTItem) => void;
  onCancelListing?: (nft: NFTItem) => void;
  onViewNFT?: (nft: NFTItem) => void;
  emptyMessage?: string;
  onRefresh?: () => void;
}

type ViewMode = 'grid' | 'list';

// Helper to transform NFT for bulk listing dialog
function nftForBulkListing(nft: NFTItem) {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    image: nft.image,
    collection: {
      id: nft.collection.id,
      name: nft.collection.name,
      address: nft.collection.address,
    },
    isOnChain: nft.isOnChain,
    onChainTokenId: nft.onChainTokenId,
  };
}

// Helper to transform NFT for bulk cancel dialog
function nftForBulkCancel(nft: NFTItem) {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    image: nft.image,
    listingId: nft.listingId || '',
    listingPrice: nft.listingPrice || 0,
    collection: {
      id: nft.collection.id,
      name: nft.collection.name,
      address: nft.collection.address,
    },
  };
}

// Helper to transform NFT for bulk transfer dialog
function nftForBulkTransfer(nft: NFTItem) {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    image: nft.image,
    collection: {
      id: nft.collection.id,
      name: nft.collection.name,
      address: nft.collection.address,
    },
    isOnChain: nft.isOnChain,
    onChainTokenId: nft.onChainTokenId,
  };
}

const rarityColors: Record<string, string> = {
  Legendary: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500',
  Epic: 'bg-purple-500/20 border-purple-500/50 text-purple-500',
  Rare: 'bg-blue-500/20 border-blue-500/50 text-blue-500',
  Uncommon: 'bg-green-500/20 border-green-500/50 text-green-500',
  Common: 'bg-white/20 border-white/50 text-white',
};

export function ProfileNFTGrid({
  nfts,
  isLoading = false,
  isOwnProfile,
  isDraftsTab = false,
  onListForSale,
  onCreateAuction,
  onCancelListing,
  onViewNFT,
  emptyMessage = 'No items found',
  onRefresh,
}: ProfileNFTGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkListDialog, setShowBulkListDialog] = useState(false);
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);
  const [showBulkTransferDialog, setShowBulkTransferDialog] = useState(false);

  // Toggle selection for an NFT
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select all NFTs
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(nfts.map((nft) => nft.id)));
  }, [nfts]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // Get selected NFTs
  const selectedNfts = nfts.filter((nft) => selectedIds.has(nft.id));
  const unlistedSelected = selectedNfts.filter((nft) => !nft.isListed && nft.isOnChain !== false);
  const listedSelected = selectedNfts.filter((nft) => nft.isListed && nft.listingId);
  // Transferable: on-chain and NOT currently listed (can't transfer while listed)
  const transferableSelected = selectedNfts.filter((nft) => nft.isOnChain !== false && !nft.isListed);

  // Handle bulk action success
  const handleBulkSuccess = useCallback(() => {
    exitSelectionMode();
    onRefresh?.();
  }, [exitSelectionMode, onRefresh]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'flex flex-col'
          )}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <NFTSkeleton key={i} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar with selection mode */}
      <div className="flex items-center justify-between gap-4">
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

        {isOwnProfile && !isDraftsTab && (
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <span className="text-sm text-white/60">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-white/60 hover:text-white"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-white/60 hover:text-white"
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectionMode}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Exit
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Select
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <span className="text-sm text-white">
              {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            {unlistedSelected.length > 0 && (
              <Button
                size="sm"
                onClick={() => setShowBulkListDialog(true)}
                className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
              >
                <Tag className="w-4 h-4 mr-2" />
                List {unlistedSelected.length}
              </Button>
            )}
            {transferableSelected.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkTransferDialog(true)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Send className="w-4 h-4 mr-2" />
                Transfer {transferableSelected.length}
              </Button>
            )}
            {listedSelected.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkCancelDialog(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel {listedSelected.length}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={cn(
          'gap-4',
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'flex flex-col'
        )}
      >
        <AnimatePresence mode="popLayout">
          {nfts.map((nft, index) => (
            <motion.div
              key={nft.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.02 }}
            >
              {viewMode === 'grid' ? (
                <NFTGridCard
                  nft={nft}
                  isOwnProfile={isOwnProfile}
                  isDraftsTab={isDraftsTab}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(nft.id)}
                  onToggleSelect={() => toggleSelection(nft.id)}
                  onListForSale={onListForSale}
                  onCreateAuction={onCreateAuction}
                  onCancelListing={onCancelListing}
                  onViewNFT={onViewNFT}
                />
              ) : (
                <NFTListCard
                  nft={nft}
                  isOwnProfile={isOwnProfile}
                  isDraftsTab={isDraftsTab}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(nft.id)}
                  onToggleSelect={() => toggleSelection(nft.id)}
                  onListForSale={onListForSale}
                  onCreateAuction={onCreateAuction}
                  onCancelListing={onCancelListing}
                  onViewNFT={onViewNFT}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Listing Dialog */}
      <BulkListingDialog
        open={showBulkListDialog}
        onOpenChange={setShowBulkListDialog}
        nfts={unlistedSelected.map(nftForBulkListing)}
        onSuccess={handleBulkSuccess}
      />

      {/* Bulk Cancel Dialog */}
      <BulkCancelDialog
        open={showBulkCancelDialog}
        onOpenChange={setShowBulkCancelDialog}
        listings={listedSelected.map(nftForBulkCancel)}
        onSuccess={handleBulkSuccess}
      />

      {/* Bulk Transfer Dialog */}
      <BulkTransferDialog
        open={showBulkTransferDialog}
        onOpenChange={setShowBulkTransferDialog}
        nfts={transferableSelected.map(nftForBulkTransfer)}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1 p-1 bg-white/5 rounded-lg w-fit">
      <button
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'p-2 rounded-md transition-colors',
          viewMode === 'grid'
            ? 'bg-[rgb(163,255,18)] text-black'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          'p-2 rounded-md transition-colors',
          viewMode === 'list'
            ? 'bg-[rgb(163,255,18)] text-black'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        )}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

function NFTGridCard({
  nft,
  isOwnProfile,
  isDraftsTab = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onListForSale,
  onCreateAuction,
  onCancelListing,
  onViewNFT,
}: {
  nft: NFTItem;
  isOwnProfile: boolean;
  isDraftsTab?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onListForSale?: (nft: NFTItem) => void;
  onCreateAuction?: (nft: NFTItem) => void;
  onCancelListing?: (nft: NFTItem) => void;
  onViewNFT?: (nft: NFTItem) => void;
}) {
  // Check if NFT is a draft (not on-chain) - can't be listed
  const isDraft = isDraftsTab || nft.isOnChain === false;

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      onViewNFT?.(nft);
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-gradient-to-br from-white/5 to-white/[0.02] border rounded-xl overflow-hidden transition-all cursor-pointer',
        selectionMode && isSelected
          ? 'border-[rgb(163,255,18)] ring-2 ring-[rgb(163,255,18)]/30'
          : 'border-white/10 hover:border-white/20'
      )}
      onClick={handleClick}
    >
      {/* Selection Checkbox Overlay */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <div
            className={cn(
              'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
              isSelected
                ? 'bg-[rgb(163,255,18)] border-[rgb(163,255,18)]'
                : 'bg-black/60 border-white/40 hover:border-white/60'
            )}
          >
            {isSelected && <Check className="w-4 h-4 text-black" />}
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <MediaRenderer
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Draft/Not Minted Badge - shifted right when in selection mode */}
        {isDraft && !selectionMode && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="text-xs font-bold bg-orange-500/20 border-orange-500/50 text-orange-500">
              <FileX className="w-3 h-3 mr-1" />
              Not Minted
            </Badge>
          </div>
        )}
        {isDraft && selectionMode && (
          <div className="absolute top-2 left-10 z-10">
            <Badge className="text-xs font-bold bg-orange-500/20 border-orange-500/50 text-orange-500">
              <FileX className="w-3 h-3 mr-1" />
              Draft
            </Badge>
          </div>
        )}

        {/* Listing Status Badge - only show if not a draft, shifted when in selection mode */}
        {!isDraft && nft.isListed && (
          <div className={cn('absolute top-2 z-10', selectionMode ? 'left-10' : 'left-2')}>
            <Badge
              className={cn(
                'text-xs font-bold',
                nft.listingType === 'auction'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-500'
                  : 'bg-[rgb(163,255,18)]/20 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]'
              )}
            >
              {nft.listingType === 'auction' ? (
                <>
                  <Gavel className="w-3 h-3 mr-1" />
                  Auction
                </>
              ) : (
                <>
                  <Tag className="w-3 h-3 mr-1" />
                  Listed
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Rarity Badge */}
        {nft.rarityTier && (
          <div className="absolute top-2 right-2">
            <Badge className={cn('text-xs', rarityColors[nft.rarityTier] || rarityColors.Common)}>
              {nft.rarityTier}
            </Badge>
          </div>
        )}

        {/* Quick Actions (Own Profile) - Hidden for drafts and selection mode */}
        {isOwnProfile && !isDraft && !selectionMode && (
          <div
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-black/80 hover:bg-black border-white/20"
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-white/10">
                {nft.isListed ? (
                  <DropdownMenuItem
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                    onClick={() => onCancelListing?.(nft)}
                  >
                    Cancel Listing
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => onListForSale?.(nft)}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      List for Sale
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => onCreateAuction?.(nft)}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Create Auction
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  className="text-white hover:bg-white/10 cursor-pointer"
                  onClick={() => onViewNFT?.(nft)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-[rgb(163,255,18)] truncate mb-1">
          {nft.collection.name}
        </p>
        <h3 className="text-white font-medium text-sm truncate">{nft.name}</h3>

        {/* Price */}
        {nft.isListed && nft.listingPrice && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-white/40">
              {nft.listingType === 'auction' ? 'Starting Bid' : 'Price'}
            </p>
            <p className="text-white font-bold">{nft.listingPrice} ETH</p>
          </div>
        )}

        {/* Rarity Rank */}
        {nft.rarityRank && (
          <div className="mt-2 text-xs text-white/40">
            Rank #{nft.rarityRank}
          </div>
        )}
      </div>
    </div>
  );
}

function NFTListCard({
  nft,
  isOwnProfile,
  isDraftsTab = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onListForSale,
  onCreateAuction,
  onCancelListing,
  onViewNFT,
}: {
  nft: NFTItem;
  isOwnProfile: boolean;
  isDraftsTab?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onListForSale?: (nft: NFTItem) => void;
  onCreateAuction?: (nft: NFTItem) => void;
  onCancelListing?: (nft: NFTItem) => void;
  onViewNFT?: (nft: NFTItem) => void;
}) {
  // Check if NFT is a draft (not on-chain) - can't be listed
  const isDraft = isDraftsTab || nft.isOnChain === false;

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
    } else {
      onViewNFT?.(nft);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 bg-gradient-to-br from-white/5 to-white/[0.02] border rounded-xl p-4 transition-all cursor-pointer',
        selectionMode && isSelected
          ? 'border-[rgb(163,255,18)] ring-2 ring-[rgb(163,255,18)]/30'
          : 'border-white/10 hover:border-white/20'
      )}
      onClick={handleClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div
          className={cn(
            'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
            isSelected
              ? 'bg-[rgb(163,255,18)] border-[rgb(163,255,18)]'
              : 'bg-black/60 border-white/40'
          )}
        >
          {isSelected && <Check className="w-4 h-4 text-black" />}
        </div>
      )}
      {/* Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <MediaRenderer
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[rgb(163,255,18)] truncate">
          {nft.collection.name}
        </p>
        <h3 className="text-white font-medium truncate">{nft.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          {isDraft && (
            <Badge className="text-xs bg-orange-500/20 border-orange-500/50 text-orange-500">
              <FileX className="w-3 h-3 mr-1" />
              Not Minted
            </Badge>
          )}
          {nft.rarityTier && (
            <Badge className={cn('text-xs', rarityColors[nft.rarityTier] || rarityColors.Common)}>
              {nft.rarityTier}
            </Badge>
          )}
          {nft.rarityRank && (
            <span className="text-xs text-white/40">Rank #{nft.rarityRank}</span>
          )}
        </div>
      </div>

      {/* Status & Price */}
      <div className="text-right flex-shrink-0">
        {isDraft ? (
          <span className="text-orange-500/60 text-sm">Draft</span>
        ) : nft.isListed ? (
          <>
            <Badge
              className={cn(
                'text-xs mb-1',
                nft.listingType === 'auction'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-500'
                  : 'bg-[rgb(163,255,18)]/20 border-[rgb(163,255,18)]/50 text-[rgb(163,255,18)]'
              )}
            >
              {nft.listingType === 'auction' ? 'Auction' : 'Listed'}
            </Badge>
            {nft.listingPrice && (
              <p className="text-white font-bold">{nft.listingPrice} ETH</p>
            )}
          </>
        ) : (
          <span className="text-white/40 text-sm">Not listed</span>
        )}
      </div>

      {/* Actions - Hidden for drafts and when in selection mode */}
      {isOwnProfile && !isDraft && !selectionMode && (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-white/10">
              {nft.isListed ? (
                <DropdownMenuItem
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => onCancelListing?.(nft)}
                >
                  Cancel Listing
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem
                    className="text-white hover:bg-white/10 cursor-pointer"
                    onClick={() => onListForSale?.(nft)}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    List for Sale
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-white/10 cursor-pointer"
                    onClick={() => onCreateAuction?.(nft)}
                  >
                    <Gavel className="w-4 h-4 mr-2" />
                    Create Auction
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

function NFTSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 animate-pulse">
        <div className="w-20 h-20 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-16 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-white/10 rounded" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}
