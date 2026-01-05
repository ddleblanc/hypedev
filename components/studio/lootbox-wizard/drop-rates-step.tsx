"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaRenderer } from "@/components/MediaRenderer";
import { Percent, Sparkles, Info, TrendingUp } from "lucide-react";
import type { SelectedNFT } from "@/app/studio/lootbox/create/page";
import { calculateLootboxRarityWithDetails, RARITY_DISPLAY } from "@/lib/lootbox-utils";

interface DropRatesStepProps {
  selectedNFTs: SelectedNFT[];
  setSelectedNFTs: (nfts: SelectedNFT[]) => void;
}

const RARITY_OPTIONS = [
  { value: "common", label: "Common", color: "bg-gray-500" },
  { value: "rare", label: "Rare", color: "bg-blue-500" },
  { value: "epic", label: "Epic", color: "bg-purple-500" },
  { value: "legendary", label: "Legendary", color: "bg-orange-500" },
  { value: "hyper", label: "Hyper", color: "bg-pink-500" },
];

export function DropRatesStep({ selectedNFTs, setSelectedNFTs }: DropRatesStepProps) {
  // Calculate total weight and probabilities
  const totalWeight = useMemo(
    () => selectedNFTs.reduce((sum, nft) => sum + nft.weight, 0),
    [selectedNFTs]
  );

  const calculateProbability = (weight: number) => {
    if (totalWeight === 0) return 0;
    return (weight / totalWeight) * 100;
  };

  const updateNFT = (id: string, updates: Partial<SelectedNFT>) => {
    setSelectedNFTs(
      selectedNFTs.map((nft) =>
        nft.id === id ? { ...nft, ...updates } : nft
      )
    );
  };

  // Calculate the lootbox rarity based on rewards
  const calculatedRarity = useMemo(() => {
    if (selectedNFTs.length === 0) return null;
    return calculateLootboxRarityWithDetails(
      selectedNFTs.map((nft) => ({ rarity: nft.rarity, weight: nft.weight }))
    );
  }, [selectedNFTs]);

  // Group by rarity for summary
  const raritySummary = useMemo(() => {
    const summary = new Map<string, { count: number; totalWeight: number }>();
    for (const nft of selectedNFTs) {
      const current = summary.get(nft.rarity) || { count: 0, totalWeight: 0 };
      summary.set(nft.rarity, {
        count: current.count + 1,
        totalWeight: current.totalWeight + nft.weight,
      });
    }
    return Array.from(summary.entries())
      .map(([rarity, data]) => ({
        rarity,
        count: data.count,
        probability: totalWeight > 0 ? (data.totalWeight / totalWeight) * 100 : 0,
        ...RARITY_OPTIONS.find((r) => r.value === rarity),
      }))
      .sort((a, b) => b.probability - a.probability);
  }, [selectedNFTs, totalWeight]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/10">
          <Percent className="w-6 h-6 text-[rgb(163,255,18)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Configure Drop Rates</h2>
          <p className="text-sm text-white/60">
            Set the probability weight and rarity for each NFT reward
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-400">
          Higher weight = more likely to drop. Weights are relative - an NFT with
          weight 200 is twice as likely to drop as one with weight 100.
        </p>
      </div>

      {/* Calculated Lootbox Rarity */}
      {calculatedRarity && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-[rgb(163,255,18)]/10 to-transparent border border-[rgb(163,255,18)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/20">
                <TrendingUp className="w-5 h-5 text-[rgb(163,255,18)]" />
              </div>
              <div>
                <p className="text-xs text-white/60 uppercase tracking-wide">Calculated Lootbox Tier</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={RARITY_DISPLAY[calculatedRarity.tier].bgColor}>
                    {RARITY_DISPLAY[calculatedRarity.tier].label}
                  </Badge>
                  <span className="text-xs text-white/40">
                    Score: {calculatedRarity.score.toFixed(2)} / 5.00
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/60 max-w-[200px] text-right">
              Adjusting weights and individual rarities changes the lootbox tier
            </p>
          </div>
        </div>
      )}

      {/* Rarity Summary */}
      {raritySummary.length > 0 && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">
            Drop Rate Summary by Rarity
          </h3>
          <div className="flex flex-wrap gap-3">
            {raritySummary.map((item) => (
              <div
                key={item.rarity}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
              >
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-white text-sm">{item.label}</span>
                <span className="text-white/60 text-sm">
                  ({item.count})
                </span>
                <Badge variant="secondary" className="text-xs">
                  {item.probability.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NFT List with Controls */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {selectedNFTs.map((nft, index) => (
          <div
            key={nft.id}
            className="p-4 rounded-lg border border-white/10 bg-zinc-900/50"
          >
            <div className="flex gap-4">
              {/* NFT Image */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 left-1">
                  <Badge variant="secondary" className="text-[9px] px-1">
                    #{index + 1}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{nft.name}</p>
                    <p className="text-xs text-white/40">{nft.collectionName}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)]"
                  >
                    {calculateProbability(nft.weight).toFixed(1)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rarity Select */}
                  <div className="space-y-1">
                    <Label className="text-xs text-white/60">Rarity</Label>
                    <Select
                      value={nft.rarity}
                      onValueChange={(value) => updateNFT(nft.id, { rarity: value })}
                    >
                      <SelectTrigger className="h-8 bg-zinc-800 border-white/10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        {RARITY_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-white hover:bg-white/5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${option.color}`}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-white/60">Weight</Label>
                      <span className="text-xs text-white/40">{nft.weight}</span>
                    </div>
                    <Slider
                      value={[nft.weight]}
                      onValueChange={([value]) =>
                        updateNFT(nft.id, { weight: value })
                      }
                      min={1}
                      max={500}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            const equalWeight = 100;
            setSelectedNFTs(
              selectedNFTs.map((nft) => ({ ...nft, weight: equalWeight }))
            );
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          Equal Weights
        </button>
        <button
          onClick={() => {
            // Assign weights based on rarity (rarer = lower weight = lower drop chance)
            const rarityWeights: Record<string, number> = {
              common: 200,
              rare: 100,
              epic: 50,
              legendary: 25,
              hyper: 10,
            };
            setSelectedNFTs(
              selectedNFTs.map((nft) => ({
                ...nft,
                weight: rarityWeights[nft.rarity] || 100,
              }))
            );
          }}
          className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Auto-balance by Rarity
        </button>
      </div>
    </div>
  );
}
