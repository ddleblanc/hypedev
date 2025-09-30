"use client";

import { Button } from "@/components/ui/button";

interface CollectionStatsProps {
  itemsCount: number;
  ownersCount: string | number;
  floorPrice: string | number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function CollectionStats({
  itemsCount,
  ownersCount,
  floorPrice,
  viewMode,
  onViewModeChange
}: CollectionStatsProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <div className="text-white/70">{itemsCount} items</div>
        <div className="text-white/70">{ownersCount} owners</div>
        <div className="text-white/70">Floor: {floorPrice}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => onViewModeChange('grid')}
        >
          <svg className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => onViewModeChange('list')}
        >
          <svg className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
