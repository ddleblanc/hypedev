'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useStudioNew } from '@/contexts/studio-new-context';

export function SupplyStep() {
  const { state, updateDraft } = useStudioNew();

  const handleSupplyChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 1000000) {
      updateDraft({ maxSupply: num });
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Set supply & royalties
      </h2>
      <p className="text-studio-text-muted mb-8">
        How many NFTs and what&apos;s your cut?
      </p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 text-left"
      >
        {/* Max Supply */}
        <div>
          <label className="block text-sm font-medium text-studio-text mb-2">
            Maximum Supply
          </label>
          <Input
            type="number"
            placeholder="10000"
            value={state.create.draft.maxSupply || ''}
            onChange={(e) => handleSupplyChange(e.target.value)}
            className="bg-studio-surface border-studio-border text-studio-text text-lg py-6"
            min={1}
            max={1000000}
          />
          <p className="text-xs text-studio-text-muted mt-2">
            The total number of NFTs that can ever exist (1 - 1,000,000)
          </p>
        </div>

        {/* Royalty */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-studio-text">
              Royalty Percentage
            </label>
            <span className="text-lg font-semibold text-studio-accent">
              {state.create.draft.royaltyPercentage ?? 5}%
            </span>
          </div>
          <Slider
            value={[state.create.draft.royaltyPercentage ?? 5]}
            onValueChange={([value]) => updateDraft({ royaltyPercentage: value })}
            max={10}
            step={0.5}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-studio-text-muted">
            <span>0%</span>
            <span>10% max</span>
          </div>
          <p className="text-xs text-studio-text-muted mt-2">
            Percentage you earn on secondary sales
          </p>
        </div>
      </motion.div>
    </div>
  );
}
