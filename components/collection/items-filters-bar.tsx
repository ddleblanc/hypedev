"use client";

import { Search, Grid3x3, List, SlidersHorizontal, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ItemsFiltersBarProps {
  itemsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterRarity: string;
  onRarityChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  selectedTraitsCount: number;
  onSweepClick?: () => void;
  hasListings?: boolean;
}

export function ItemsFiltersBar({
  itemsCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterRarity,
  onRarityChange,
  filterStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  selectedTraitsCount,
  onSweepClick,
  hasListings = false,
}: ItemsFiltersBarProps) {
  return (
    <div className="space-y-3">
      {/* Items Count & Active Search Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white/70 text-sm md:text-base">
            {itemsCount} items
          </p>
          {searchQuery && (
            <Badge className="bg-white/10 text-white/80 text-xs">
              "{searchQuery}"
            </Badge>
          )}
        </div>

        {/* View Mode Toggle - Always visible on right */}
        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
          <Button
            size="icon"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar - Full Width on Mobile */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4 pointer-events-none z-10" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 h-11 bg-black/40 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white/40 transition-colors"
        />
      </div>

      {/* Filters Row - Responsive Layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Sort - Flexible on mobile */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] h-11 bg-black/40 border-white/20 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rarity">Rarity: Rare First</SelectItem>
            <SelectItem value="rarity-common">Rarity: Common First</SelectItem>
            <SelectItem value="rank">Rank: Best First</SelectItem>
            <SelectItem value="rank-worst">Rank: Worst First</SelectItem>
            <SelectItem value="recent">Recently Listed</SelectItem>
            <SelectItem value="oldest">Oldest Listed</SelectItem>
            <SelectItem value="name-az">Name: A-Z</SelectItem>
            <SelectItem value="name-za">Name: Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Rarity Filter - Flexible on mobile */}
        <Select value={filterRarity} onValueChange={onRarityChange}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] h-11 bg-black/40 border-white/20 text-white">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            <SelectItem value="common">Common</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
            <SelectItem value="mythic">Mythic</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[130px] h-11 bg-black/40 border-white/20 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="not-listed">Not Listed</SelectItem>
            <SelectItem value="has-offers">Has Offers</SelectItem>
            <SelectItem value="on-auction">On Auction</SelectItem>
          </SelectContent>
        </Select>

        {/* Sweep Floor Button - always visible, disabled when no listings */}
        {onSweepClick && (
          <Button
            onClick={onSweepClick}
            disabled={!hasListings}
            className={cn(
              "h-11 font-medium",
              hasListings
                ? "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sweep Floor</span>
            <span className="sm:hidden">Sweep</span>
          </Button>
        )}

        {/* Advanced Filters Button */}
        <Button
          variant="outline"
          className="h-11 border-white/20 text-white hover:bg-white/10 justify-center sm:justify-start"
          onClick={onToggleFilters}
        >
          <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sm:hidden">Advanced</span>
          {selectedTraitsCount > 0 && (
            <Badge className="ml-2 bg-[rgb(163,255,18)] text-black px-2 py-0.5 text-xs">
              {selectedTraitsCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
