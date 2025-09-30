"use client";

import { Search, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ItemsFiltersBarProps {
  itemsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterRarity: string;
  onRarityChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  selectedTraitsCount: number;
}

export function ItemsFiltersBar({
  itemsCount,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterRarity,
  onRarityChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  selectedTraitsCount
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
            <SelectItem value="rarity">Rarity</SelectItem>
            <SelectItem value="rank">Rank</SelectItem>
            <SelectItem value="recent">Recently Listed</SelectItem>
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
