'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Percent, Info, Sparkles, TrendingUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaRenderer } from '@/components/MediaRenderer';
import { useStudioNew, type LootboxRarity } from '@/contexts/studio-new-context';
import { calculateLootboxRarityWithDetails, RARITY_DISPLAY } from '@/lib/lootbox-utils';

const RARITY_OPTIONS: { value: LootboxRarity; label: string; color: string }[] = [
  { value: 'common', label: 'Common', color: 'bg-gray-500' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'mythic', label: 'Mythic', color: 'bg-orange-500' },
  { value: 'cosmic', label: 'Cosmic', color: 'bg-pink-500' },
];

export function LootboxRatesStep() {
  const { state, updateLootboxDraft } = useStudioNew();
  const lootbox = state.create.draft.lootbox;
  const selectedNFTs = lootbox?.selectedNFTs || [];

  // Calculate total weight and probabilities
  const totalWeight = useMemo(
    () => selectedNFTs.reduce((sum, nft) => sum + nft.weight, 0),
    [selectedNFTs]
  );

  const calculateProbability = (weight: number) => {
    if (totalWeight === 0) return 0;
    return (weight / totalWeight) * 100;
  };

  const updateNFT = (index: number, updates: { weight?: number; rarity?: LootboxRarity }) => {
    const updatedNFTs = [...selectedNFTs];
    if (index >= 0 && index < updatedNFTs.length) {
      updatedNFTs[index] = { ...updatedNFTs[index], ...updates };
      updateLootboxDraft({ selectedNFTs: updatedNFTs });
    }
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

  // Quick actions
  const setEqualWeights = () => {
    const updatedNFTs = selectedNFTs.map((nft) => ({ ...nft, weight: 100 }));
    updateLootboxDraft({ selectedNFTs: updatedNFTs });
  };

  const autoBalanceByRarity = () => {
    const rarityWeights: Record<string, number> = {
      common: 200,
      rare: 100,
      epic: 50,
      mythic: 25,
      cosmic: 10,
    };
    const updatedNFTs = selectedNFTs.map((nft) => ({
      ...nft,
      weight: rarityWeights[nft.rarity] || 100,
    }));
    updateLootboxDraft({ selectedNFTs: updatedNFTs });
  };

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto h-14 w-14 rounded-xl bg-studio-accent/10 flex items-center justify-center mb-4"
      >
        <Percent className="h-7 w-7 text-studio-accent" />
      </motion.div>

      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Configure drop rates
      </h2>
      <p className="text-studio-text-muted mb-6">
        Set the probability weight and rarity for each NFT
      </p>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4 text-left">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-400">
          Higher weight = more likely to drop. An NFT with weight 200 is twice as likely to drop as one with weight 100.
        </p>
      </div>

      {/* Calculated Lootbox Rarity */}
      {calculatedRarity && (
        <div className="p-3 rounded-lg bg-studio-accent/10 border border-studio-accent/30 mb-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-studio-accent" />
              <span className="text-xs text-studio-text-muted uppercase tracking-wide">
                Lootbox Tier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={RARITY_DISPLAY[calculatedRarity.tier].bgColor}>
                {RARITY_DISPLAY[calculatedRarity.tier].label}
              </Badge>
              <span className="text-xs text-studio-text-muted">
                {calculatedRarity.score.toFixed(2)} / 5.00
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rarity Summary */}
      {raritySummary.length > 0 && (
        <div className="p-3 rounded-lg bg-studio-surface border border-studio-border mb-4 text-left">
          <p className="text-xs font-medium text-studio-text-muted mb-2">
            Drop Rate Summary
          </p>
          <div className="flex flex-wrap gap-2">
            {raritySummary.map((item) => (
              <div
                key={item.rarity}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-studio-border/50"
              >
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-studio-text">{item.label}</span>
                <span className="text-xs text-studio-text-muted">({item.count})</span>
                <span className="text-xs font-medium text-studio-accent">
                  {item.probability.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={setEqualWeights}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-studio-surface text-studio-text-muted hover:bg-studio-border/70 hover:text-studio-text transition-colors"
        >
          Equal Weights
        </button>
        <button
          onClick={autoBalanceByRarity}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-studio-surface text-studio-text-muted hover:bg-studio-border/70 hover:text-studio-text transition-colors flex items-center justify-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Auto-balance
        </button>
      </div>

      {/* NFT List with Controls */}
      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 text-left">
        {selectedNFTs.map((nft, index) => (
          <div
            key={nft.id}
            className="p-3 rounded-lg border border-studio-border bg-studio-surface"
          >
            <div className="flex gap-3">
              {/* NFT Image */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <MediaRenderer
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <Badge variant="secondary" className="absolute top-0.5 left-0.5 text-[8px] px-1">
                  #{index + 1}
                </Badge>
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-studio-text truncate">{nft.name}</p>
                    <p className="text-[10px] text-studio-text-muted truncate">{nft.collectionName}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-studio-accent/10 text-studio-accent text-[10px] ml-2"
                  >
                    {calculateProbability(nft.weight).toFixed(1)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Rarity Select */}
                  <div>
                    <Label className="text-[10px] text-studio-text-muted">Rarity</Label>
                    <Select
                      value={nft.rarity}
                      onValueChange={(value: LootboxRarity) =>
                        updateNFT(index, { rarity: value })
                      }
                    >
                      <SelectTrigger className="h-7 bg-studio-border/50 border-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-studio-surface border-studio-border">
                        {RARITY_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] text-studio-text-muted">Weight</Label>
                      <span className="text-[10px] text-studio-text-muted">{nft.weight}</span>
                    </div>
                    <Slider
                      value={[nft.weight]}
                      onValueChange={([value]) => updateNFT(index, { weight: value })}
                      min={1}
                      max={500}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
