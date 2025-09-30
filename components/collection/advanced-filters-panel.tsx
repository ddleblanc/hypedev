"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trait } from "./types";

interface AdvancedFiltersPanelProps {
  show: boolean;
  priceRange: number[];
  onPriceRangeChange: (range: number[]) => void;
  traits: Trait[];
  selectedTraits: string[];
  onTraitToggle: (trait: string) => void;
  onClearAll: () => void;
  onApply: () => void;
}

export function AdvancedFiltersPanel({
  show,
  priceRange,
  onPriceRangeChange,
  traits,
  selectedTraits,
  onTraitToggle,
  onClearAll,
  onApply
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
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <Label className="text-white">Price Range (ETH)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={onPriceRangeChange}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{priceRange[0]} ETH</span>
                    <span className="text-sm text-white/60">{priceRange[1]} ETH</span>
                  </div>
                </div>

                {/* Trait Filters */}
                {traits.slice(0, 2).map((trait) => (
                  <div key={trait.name} className="space-y-3">
                    <Label className="text-white">{trait.name}</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {trait.values.map((value) => (
                        <label key={value.trait} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-white/20 bg-black/40 text-[rgb(163,255,18)]"
                            checked={selectedTraits.includes(value.trait)}
                            onChange={() => onTraitToggle(value.trait)}
                          />
                          <span className="text-sm text-white/80">{value.trait}</span>
                          <Badge variant="outline" className="ml-auto text-[10px] border-white/20 text-white/60">
                            {value.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
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
