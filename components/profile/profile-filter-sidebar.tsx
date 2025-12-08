'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption =
  | 'recently_listed'
  | 'price_low'
  | 'price_high'
  | 'recently_created'
  | 'rarity_rank';

export type StatusFilter = 'all' | 'listed' | 'unlisted' | 'on_auction' | 'has_offers';

export interface ProfileFilters {
  status: StatusFilter;
  minPrice?: number;
  maxPrice?: number;
  collections: string[];
  sortBy: SortOption;
  searchQuery: string;
}

interface Collection {
  id: string;
  name: string;
  image?: string | null;
  nftCount?: number;
}

interface ProfileFilterSidebarProps {
  filters: ProfileFilters;
  onFiltersChange: (filters: ProfileFilters) => void;
  collections: Collection[];
  isLoading?: boolean;
  className?: string;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Items' },
  { value: 'listed', label: 'Listed' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'on_auction', label: 'On Auction' },
  { value: 'has_offers', label: 'Has Offers' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recently_listed', label: 'Recently Listed' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'recently_created', label: 'Recently Created' },
  { value: 'rarity_rank', label: 'Rarity Rank' },
];

export function ProfileFilterSidebar({
  filters,
  onFiltersChange,
  collections,
  isLoading = false,
  className,
}: ProfileFilterSidebarProps) {
  const [statusOpen, setStatusOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const updateFilter = <K extends keyof ProfileFilters>(
    key: K,
    value: ProfileFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCollection = (collectionId: string) => {
    const newCollections = filters.collections.includes(collectionId)
      ? filters.collections.filter((id) => id !== collectionId)
      : [...filters.collections, collectionId];
    updateFilter('collections', newCollections);
  };

  const resetFilters = () => {
    onFiltersChange({
      status: 'all',
      minPrice: undefined,
      maxPrice: undefined,
      collections: [],
      sortBy: 'recently_listed',
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.collections.length > 0 ||
    filters.searchQuery !== '';

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white h-8 px-2"
            onClick={resetFilters}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search items..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
        {filters.searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => updateFilter('searchQuery', '')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-white/60 text-xs uppercase tracking-wider">
          Sort By
        </Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter('sortBy', value as SortOption)}
        >
          <SelectTrigger className="bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black border-white/10">
            {sortOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-white hover:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-white hover:text-[rgb(163,255,18)] transition-colors">
          <span className="font-medium">Status</span>
          {statusOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 py-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                  filters.status === option.value
                    ? 'bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={filters.status === option.value}
                  onChange={() => updateFilter('status', option.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    filters.status === option.value
                      ? 'border-[rgb(163,255,18)]'
                      : 'border-white/30'
                  )}
                >
                  {filters.status === option.value && (
                    <div className="w-2 h-2 rounded-full bg-[rgb(163,255,18)]" />
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-white hover:text-[rgb(163,255,18)] transition-colors">
          <span className="font-medium">Price Range</span>
          {priceOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-white/40 text-xs">Min</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  step={0.001}
                  value={filters.minPrice ?? ''}
                  onChange={(e) =>
                    updateFilter(
                      'minPrice',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                />
              </div>
              <span className="text-white/40 mt-5">to</span>
              <div className="flex-1">
                <Label className="text-white/40 text-xs">Max</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  min={0}
                  step={0.001}
                  value={filters.maxPrice ?? ''}
                  onChange={(e) =>
                    updateFilter(
                      'maxPrice',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                />
              </div>
            </div>
            <div className="text-white/40 text-xs">Price in ETH</div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Collections */}
      {collections.length > 0 && (
        <Collapsible open={collectionsOpen} onOpenChange={setCollectionsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-white hover:text-[rgb(163,255,18)] transition-colors">
            <span className="font-medium">Collections</span>
            {collectionsOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 py-2 max-h-48 overflow-y-auto">
              {collections.map((collection) => (
                <label
                  key={collection.id}
                  className={cn(
                    'flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                    filters.collections.includes(collection.id)
                      ? 'bg-[rgb(163,255,18)]/10'
                      : 'hover:bg-white/5'
                  )}
                >
                  <Checkbox
                    checked={filters.collections.includes(collection.id)}
                    onCheckedChange={() => toggleCollection(collection.id)}
                    className="border-white/30 data-[state=checked]:bg-[rgb(163,255,18)] data-[state=checked]:border-[rgb(163,255,18)]"
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        'text-sm truncate block',
                        filters.collections.includes(collection.id)
                          ? 'text-[rgb(163,255,18)]'
                          : 'text-white/70'
                      )}
                    >
                      {collection.name}
                    </span>
                  </div>
                  {collection.nftCount !== undefined && (
                    <span className="text-xs text-white/40">
                      {collection.nftCount}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Active Filters Summary */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-white/10"
          >
            <div className="flex flex-wrap gap-2">
              {filters.status !== 'all' && (
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => updateFilter('status', 'all')}
                >
                  {statusOptions.find((o) => o.value === filters.status)?.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {(filters.minPrice !== undefined ||
                filters.maxPrice !== undefined) && (
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => {
                    updateFilter('minPrice', undefined);
                    updateFilter('maxPrice', undefined);
                  }}
                >
                  {filters.minPrice ?? '0'} - {filters.maxPrice ?? '∞'} ETH
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {filters.collections.map((collectionId) => {
                const collection = collections.find((c) => c.id === collectionId);
                return (
                  <Badge
                    key={collectionId}
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={() => toggleCollection(collectionId)}
                  >
                    {collection?.name || 'Collection'}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Badge component for filter tags
function Badge({
  children,
  variant = 'default',
  className,
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary';
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors',
        className
      )}
    >
      {children}
    </button>
  );
}
