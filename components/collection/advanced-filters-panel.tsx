"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trait } from "./types";
import { cn } from "@/lib/utils";

export type TraitFilterMode = 'and' | 'or';

interface AdvancedFiltersPanelProps {
  show: boolean;
  priceRange: number[];
  onPriceRangeChange: (range: number[]) => void;
  minPrice?: number;
  maxPrice?: number;
  traits: Trait[];
  selectedTraits: string[];
  onTraitToggle: (trait: string) => void;
  onClearAll: () => void;
  onApply: () => void;
  traitFilterMode?: TraitFilterMode;
  onTraitFilterModeChange?: (mode: TraitFilterMode) => void;
}

export function AdvancedFiltersPanel({
  show,
  priceRange,
  onPriceRangeChange,
  minPrice = 0,
  maxPrice = 100,
  traits,
  selectedTraits,
  onTraitToggle,
  onClearAll,
  onApply,
  traitFilterMode = 'or',
  onTraitFilterModeChange,
}: AdvancedFiltersPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-black/40 border-white/10">
            <CardContent className="pt-6 space-y-6">
              {/* Price Range & Filter Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-white">Price Range (ETH)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={onPriceRangeChange}
                    min={minPrice}
                    max={maxPrice}
                    step={Math.max(0.001, (maxPrice - minPrice) / 100)} // Dynamic step size
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{priceRange[0].toFixed(3)} ETH</span>
                    <span className="text-sm text-white/60">{priceRange[1].toFixed(3)} ETH</span>
                  </div>
                  <p className="text-xs text-white/40">
                    Range: {minPrice.toFixed(3)} - {maxPrice.toFixed(3)} ETH
                  </p>
                </div>

                {/* AND/OR Toggle */}
                {onTraitFilterModeChange && selectedTraits.length > 1 && (
                  <div className="space-y-3">
                    <Label className="text-white">Trait Filter Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={traitFilterMode === 'or' ? 'default' : 'outline'}
                        className={cn(
                          "flex-1",
                          traitFilterMode === 'or'
                            ? 'bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]'
                            : 'border-white/20 text-white hover:bg-white/10'
                        )}
                        onClick={() => onTraitFilterModeChange('or')}
                      >
                        Match Any (OR)
                      </Button>
                      <Button
                        size="sm"
                        variant={traitFilterMode === 'and' ? 'default' : 'outline'}
                        className={cn(
                          "flex-1",
                          traitFilterMode === 'and'
                            ? 'bg-[rgb(163,255,18)] text-black hover:bg-[rgb(143,235,0)]'
                            : 'border-white/20 text-white hover:bg-white/10'
                        )}
                        onClick={() => onTraitFilterModeChange('and')}
                      >
                        Match All (AND)
                      </Button>
                    </div>
                    <p className="text-xs text-white/50">
                      {traitFilterMode === 'or'
                        ? 'Show items with any of the selected traits'
                        : 'Show items with all of the selected traits'}
                    </p>
                  </div>
                )}
              </div>

              {/* Trait Filters - Show all traits in grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {traits.map((trait) => (
                  <div key={trait.name} className="space-y-2">
                    <Label className="text-white text-sm font-medium">{trait.name}</Label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                      {trait.values.map((value) => (
                        <label
                          key={value.trait}
                          className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-white/20 bg-black/40 text-[rgb(163,255,18)] focus:ring-[rgb(163,255,18)] focus:ring-offset-0"
                            checked={selectedTraits.includes(value.trait)}
                            onChange={() => onTraitToggle(value.trait)}
                          />
                          <span className="text-sm text-white/80 truncate flex-1">{value.trait}</span>
                          <Badge variant="outline" className="text-[10px] border-white/20 text-white/50 shrink-0">
                            {value.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Filters Summary */}
              {selectedTraits.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  <span className="text-sm text-white/60">Active:</span>
                  {selectedTraits.map((trait) => (
                    <Badge
                      key={trait}
                      className="bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/30 cursor-pointer"
                      onClick={() => onTraitToggle(trait)}
                    >
                      {trait} &times;
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={onClearAll}
                >
                  Clear All
                </Button>
                <Button
                  className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
                  onClick={onApply}
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
