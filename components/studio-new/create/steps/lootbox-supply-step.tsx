'use client';

import { motion } from 'framer-motion';
import { Coins, Package, Gift, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudioNew } from '@/contexts/studio-new-context';

export function LootboxSupplyStep() {
  const { state, updateLootboxDraft } = useStudioNew();
  const lootbox = state.create.draft.lootbox;

  const supply = lootbox?.supply || 0;
  const rewardsPerOpening = lootbox?.rewardsPerOpening || 1;
  const requiredNFTs = supply * rewardsPerOpening;

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto h-14 w-14 rounded-xl bg-studio-accent/10 flex items-center justify-center mb-4"
      >
        <Package className="h-7 w-7 text-studio-accent" />
      </motion.div>

      <h2 className="text-2xl font-semibold text-studio-text mb-2">
        Configure supply & pricing
      </h2>
      <p className="text-studio-text-muted mb-8">
        Set the price and quantity for your lootbox
      </p>

      <div className="space-y-6 text-left">
        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="lootbox-price" className="text-studio-text flex items-center gap-2">
            <Coins className="w-4 h-4 text-studio-accent" />
            Price (ETH)
          </Label>
          <Input
            id="lootbox-price"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.01"
            value={lootbox?.price || ''}
            onChange={(e) => updateLootboxDraft({ price: e.target.value })}
            className="bg-studio-surface border-studio-border text-studio-text"
          />
          <p className="text-xs text-studio-text-muted">
            The price buyers pay to purchase one lootbox
          </p>
        </div>

        {/* Supply */}
        <div className="space-y-2">
          <Label htmlFor="lootbox-supply" className="text-studio-text flex items-center gap-2">
            <Package className="w-4 h-4 text-studio-accent" />
            Total Supply
          </Label>
          <Input
            id="lootbox-supply"
            type="number"
            min="1"
            max="1000"
            placeholder="10"
            value={supply || ''}
            onChange={(e) =>
              updateLootboxDraft({
                supply: Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)),
              })
            }
            className="bg-studio-surface border-studio-border text-studio-text"
          />
          <p className="text-xs text-studio-text-muted">
            Maximum number of lootboxes that can be purchased (max: 1000)
          </p>
        </div>

        {/* Rewards Per Opening */}
        <div className="space-y-2">
          <Label htmlFor="lootbox-rewards" className="text-studio-text flex items-center gap-2">
            <Gift className="w-4 h-4 text-studio-accent" />
            Rewards Per Opening
          </Label>
          <Input
            id="lootbox-rewards"
            type="number"
            min="1"
            max="10"
            value={rewardsPerOpening}
            onChange={(e) =>
              updateLootboxDraft({
                rewardsPerOpening: Math.min(10, Math.max(1, parseInt(e.target.value) || 1)),
              })
            }
            className="bg-studio-surface border-studio-border text-studio-text"
          />
          <p className="text-xs text-studio-text-muted">
            How many random NFTs a buyer receives when opening (1-10)
          </p>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl bg-studio-surface border border-studio-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-studio-text-muted">Total supply</p>
              <p className="text-studio-text font-medium">{supply || 0} lootboxes</p>
            </div>
            <div>
              <p className="text-studio-text-muted">Rewards per open</p>
              <p className="text-studio-text font-medium">{rewardsPerOpening} NFT{rewardsPerOpening > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-studio-text-muted">NFTs required</p>
              <p className="text-studio-accent font-medium">{requiredNFTs} NFTs</p>
            </div>
            <div>
              <p className="text-studio-text-muted">Max revenue</p>
              <p className="text-studio-text font-medium">
                {((parseFloat(lootbox?.price || '0') || 0) * supply).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>

        {/* Warning for high reward count */}
        {rewardsPerOpening > 1 && supply > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">
              With {rewardsPerOpening} rewards per opening, you'll need at least{' '}
              <span className="font-semibold">{requiredNFTs} NFTs</span> as rewards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
